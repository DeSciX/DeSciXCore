/**
 * chatMedia contract tests (ws-chat-multimodal-image-attach).
 *
 * The provider-block assertions below are pinned to LIVE-PROBED facts against
 * @google/genai 2.16.0 Interactions API (2026-08-20), not to generateContent docs:
 * flat snake_case `{ type, mime_type, data }`. `inlineData` / `fileData` / `source`
 * wrappers are rejected by that API ("Unknown parameter 'inlineData'"), so a refactor
 * that reintroduces one must fail here rather than at a metered round-trip.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CHAT_MEDIA_KINDS,
    MAX_MEDIA_BYTES,
    MAX_TURN_MEDIA_BYTES,
    MAX_MEDIA_ATTACHMENTS_PER_TURN,
    base64DecodedBytes,
    kindForMimeType,
    allAcceptedMimeTypes,
    normalizeMediaAttachment,
    normalizeMediaAttachments,
    assertMediaBytesWithinPolicy,
    mediaTruncationNotice,
    toProviderBlock,
    buildProviderInput,
    mediaParamSchema,
} from '../src/mcp-tools/chatMedia.js';

const b64 = (n) => Buffer.alloc(n, 7).toString('base64');
const PNG = { mime_type: 'image/png', data: b64(64), label: 'still' };
const MP4 = { mime_type: 'video/mp4', data: b64(128), label: 'flyby' };

test('kind is derived from mime_type, and unlisted types fail loud', () => {
    assert.equal(kindForMimeType('image/png'), 'image');
    assert.equal(kindForMimeType('VIDEO/MP4'), 'video');
    assert.equal(kindForMimeType('application/zip'), null);
    assert.throws(() => normalizeMediaAttachment({ mime_type: 'application/zip', data: b64(4) }),
        /unsupported media mime_type/);
});

test('audio/document are refused BY NAME as an unverified scope boundary, not as a typo', () => {
    // The provider accepts these block types; this platform has not live-measured them, so the
    // refusal must say so rather than looking like an unrecognized string.
    assert.throws(() => normalizeMediaAttachment({ mime_type: 'audio/mp3', data: b64(4) }),
        /not enabled on this surface yet/);
    assert.throws(() => normalizeMediaAttachment({ mime_type: 'application/pdf', data: b64(4) }),
        /not enabled on this surface yet/);
});

test('exactly one of data / asset_ref — both or neither fails loud', () => {
    assert.throws(() => normalizeMediaAttachment({ mime_type: 'image/png' }),
        /neither data .* nor asset_ref/);
    assert.throws(() => normalizeMediaAttachment({ mime_type: 'image/png', data: b64(4), asset_ref: 'gs://b/o' }),
        /declares BOTH data and asset_ref/);
});

test('a data: URL is rejected — `data` must be raw base64', () => {
    assert.throws(
        () => normalizeMediaAttachment({ mime_type: 'image/png', data: '  data:image/png;base64,AAAA' }),
        /must be RAW base64, not a data: URL/,
    );
});

test('normalize(partial) -> FULL bag, so consumers ferry instead of hand-listing fields', () => {
    const bag = normalizeMediaAttachment(PNG);
    assert.deepEqual(Object.keys(bag).sort(), [
        'asset_ref', 'bytes', 'data', 'kind', 'label', 'mime_type', 'source', 'track', 'truncated',
    ]);
    assert.equal(bag.kind, 'image');
    assert.equal(bag.source, 'inline');
    assert.equal(bag.asset_ref, null);
    assert.equal(bag.bytes, 64);
    assert.equal(bag.truncated, false);
});

test('an asset_ref bag defers sizing to the server (bytes unknown at the door)', () => {
    const bag = normalizeMediaAttachment({ mime_type: 'video/mp4', asset_ref: 'flyby.mp4' });
    assert.equal(bag.source, 'asset_ref');
    assert.equal(bag.data, null);
    assert.equal(bag.bytes, null);
});

test('base64DecodedBytes measures DECODED bytes (padding-aware), not encoded length', () => {
    for (const n of [1, 2, 3, 61, 64, 1024]) {
        assert.equal(base64DecodedBytes(Buffer.alloc(n).toString('base64')), n, `n=${n}`);
    }
});

test('SIZE POLICY: oversized media is REJECTED, never truncated (a partial MP4 is corrupt)', () => {
    assert.throws(() => assertMediaBytesWithinPolicy(MAX_MEDIA_BYTES + 1, { label: 'big' }),
        /over the .* per-attachment limit/);
    // The cap must comfortably clear the MEASURED common case: a 24-frame flyby is ~373 KB
    // as base64 MP4 (~287 KB decoded). If someone tightens this below the common case, the
    // premise-blocking Gods World turn stops working.
    assert.ok(MAX_MEDIA_BYTES > 287 * 1024, 'per-attachment cap must clear the ~287 KB common-case flyby');
    assert.ok(MAX_MEDIA_BYTES > 1.78 * 1024 * 1024, 'per-attachment cap must clear the 1.78 MB PNG-sequence form');
});

test('per-turn bounds: attachment count and aggregate bytes', () => {
    const many = Array.from({ length: MAX_MEDIA_ATTACHMENTS_PER_TURN + 1 }, () => PNG);
    assert.throws(() => normalizeMediaAttachments(many), /over the .* per-turn limit/);
    assert.equal(normalizeMediaAttachments([PNG, MP4]).length, 2);
    assert.deepEqual(normalizeMediaAttachments(null), []);
    assert.deepEqual(normalizeMediaAttachments(undefined), []);
    assert.throws(() => normalizeMediaAttachments('nope'), /must be an array/);
    assert.ok(MAX_TURN_MEDIA_BYTES >= MAX_MEDIA_BYTES);
});

test('producer `truncated` is FERRIED and made MODEL-VISIBLE', () => {
    const bag = normalizeMediaAttachment({ ...MP4, truncated: true });
    assert.equal(bag.truncated, true);
    const notice = mediaTruncationNotice([bag]);
    assert.match(notice, /TRUNCATED at capture by the producer/);
    assert.match(notice, /"flyby"/);
    // The whole point: the model must not infer that nothing happened after the last frame.
    assert.match(notice, /do not infer/i);
    assert.equal(mediaTruncationNotice([normalizeMediaAttachment(MP4)]), '');
});

test('the `track` sidecar is ferried VERBATIM (the producer owns that schema)', () => {
    const track = { scene: 'abc123', ticksPerFrame: 4, fps: 24, frames: [{ i: 0, tick: 0 }] };
    assert.deepEqual(normalizeMediaAttachment({ ...MP4, track }).track, track);
});

test('provider block is FLAT snake_case — the probe-verified wire shape', () => {
    assert.deepEqual(toProviderBlock(normalizeMediaAttachment(PNG)),
        { type: 'image', mime_type: 'image/png', data: PNG.data });
    assert.deepEqual(toProviderBlock(normalizeMediaAttachment(MP4)),
        { type: 'video', mime_type: 'video/mp4', data: MP4.data });
});

test('encoding an UNRESOLVED asset_ref fails loud — it is a server pipeline bug', () => {
    const bag = normalizeMediaAttachment({ mime_type: 'image/png', asset_ref: 'a.png' });
    assert.throws(() => toProviderBlock(bag), /was never resolved/);
});

test('buildProviderInput: text-only turns stay a bare STRING (no behavior change)', () => {
    assert.equal(buildProviderInput('hello', []), 'hello');
    assert.equal(buildProviderInput('hello'), 'hello');
});

test('buildProviderInput: media turns are text-block-FIRST then one block per attachment', () => {
    const input = buildProviderInput('what do you see?', normalizeMediaAttachments([PNG, MP4]));
    assert.ok(Array.isArray(input));
    assert.equal(input.length, 3);
    assert.deepEqual(input[0], { type: 'text', text: 'what do you see?' });
    assert.equal(input[1].type, 'image');
    assert.equal(input[2].type, 'video');
});

test('the advertised schema is BUILT FROM the contract, so it cannot drift from the policy', () => {
    const schema = mediaParamSchema();
    assert.equal(schema.type, 'array');
    assert.deepEqual(schema.items.properties.mime_type.enum, allAcceptedMimeTypes());
    assert.deepEqual(schema.items.required, ['mime_type']);
    // Every accepted MIME really is claimed by a kind.
    for (const m of allAcceptedMimeTypes()) assert.ok(CHAT_MEDIA_KINDS.includes(kindForMimeType(m)), m);
    // The caps quoted in the description are the enforced ones.
    assert.match(schema.description, new RegExp(`${MAX_MEDIA_ATTACHMENTS_PER_TURN} attachments`));
    assert.match(schema.description, new RegExp(`${Math.round(MAX_MEDIA_BYTES / (1024 * 1024))} MiB each`));
});
