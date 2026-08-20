/**
 * chatMedia — THE canonical contract for MEDIA entering a chat turn.
 *
 * ONE OWNER RULE (ws-chat-multimodal-image-attach, extending WS-B8's chatIngress):
 * text contributions enter a turn through `chatIngress` (descix-app-sdk); MEDIA
 * contributions carry bytes, and bytes need a wire shape, a MIME vocabulary, a size
 * policy and a provider-block encoder. All four live HERE, once. No consumer
 * re-enumerates a MIME list, re-derives a byte cap, or hand-writes a provider block.
 *
 * ## Why this module is in @descix/platform-api and not in chatIngress
 *
 * chatIngress lives in `@descix/app-sdk`, which is a BROWSER package (React/MUI/viem) and
 * does NOT depend on platform-api; platform-api depends on `googleapis` and is server-side.
 * Making the browser package import this one would drag googleapis into a browser bundle,
 * and duplicating the constants into both would be exactly the schema-mirror drift the
 * engineering-culture mandate forbids. So the SERVER is the single validation authority:
 * chatIngress owns the client-side contribution SHAPE (a media attachment is a staged
 * contribution, not a second ingress), and this module owns the WIRE and the POLICY. A
 * client that sends something inadmissible is refused loudly by the server, naming the
 * limit it broke — it is never silently trimmed.
 *
 * ## Probe-verified provider facts (@google/genai 2.16.0 Interactions API, live 2026-08-20)
 * These are MEASURED, not inferred from generateContent docs — do not re-derive:
 *  - `interactions.create({ input })` accepts `string | Step[] | Content[] | Turn[] | Content`.
 *    Turn[] (role-bearing) is REJECTED on this API version with "When using the steps-based
 *    API version, use step_list input format instead of turn_list", and `{role, parts}` is
 *    rejected with "Unknown parameter 'parts'". The admissible multimodal form is a FLAT
 *    array of typed content blocks:
 *        [ { type:'text', text }, { type:'image', mime_type, data } ]
 *  - block `type` vocabulary: text | document | image | audio | video | thought | *_call | *_result.
 *  - media blocks are FLAT and snake_case: `{ type, mime_type, data }`. There is NO
 *    `inlineData` / `fileData` / `source` wrapper here — those belong to the classic
 *    generateContent Part and are rejected ("Unknown parameter 'inlineData'"). The SDK does
 *    NO key-casing transformation on this surface: what you type is what goes on the wire.
 *  - `{ type:'image', uri:'gs://…' }` is REJECTED: "Referencing Google Cloud Storage files
 *    directly is not supported. Register them using FileService.RegisterFile first."
 *    THIS IS WHY app-space GCS references are resolved to BYTES server-side (the platform
 *    reads its own private bucket through its own canonical asset reader) rather than handed
 *    to the provider as a URI. A gs:// path is a DeSciX-side reference, never a provider one.
 *  - the provider returns a per-modality token breakdown on `usage.input_tokens_by_modality`,
 *    so media tokens are counted by the provider and already land in `total_input_tokens` /
 *    `total_tokens`. Measured: text-only turn 21 input tokens; same turn + one 640x360 PNG
 *    1096 (image 1075 + text 21); a 3s 320x240 MP4 189 video tokens.
 */

/**
 * The media kinds this platform accepts TODAY.
 *
 * The provider also accepts 'audio' and 'document' blocks with a structurally identical
 * shape, and adding them here is a two-line change — but they are deliberately NOT enabled,
 * because they have not been live-measured on this surface and the platform does not ship
 * capabilities it has not observed working (working-discipline mandate). An audio/document
 * attachment is refused by name, pointing at this comment, rather than silently accepted
 * into an unverified path.
 */
export const CHAT_MEDIA_KINDS = Object.freeze(['image', 'video']);

/**
 * MIME allow-list per kind, taken from the SDK's own typed unions
 * (`ImageContentMimeType` / `VideoContentMimeType`, genai.d.ts). An unlisted MIME FAILS
 * LOUD rather than being forwarded on the hope the provider tolerates it: a rejected
 * upstream call costs a metered round-trip and produces a far worse error message.
 */
export const CHAT_MEDIA_MIME_TYPES = Object.freeze({
  image: Object.freeze([
    'image/png', 'image/jpeg', 'image/webp', 'image/heic',
    'image/heif', 'image/gif', 'image/bmp', 'image/tiff',
  ]),
  video: Object.freeze([
    'video/mp4', 'video/mpeg', 'video/mpg', 'video/mov', 'video/avi',
    'video/x-flv', 'video/webm', 'video/wmv', 'video/3gpp',
  ]),
});

/**
 * SIZE POLICY — set against the MEASURED producer numbers, not guesses
 * (godsworld/design/frqtl-producer-contract.md, "MEASURED size arithmetic"):
 *
 *   a 24-frame 600x600 flyby as base64 MP4  ~ 373 KB   <- the COMMON CASE
 *   the same flyby as a base64 PNG sequence ~ 1.78 MB
 *   a single 600x600 still as base64 PNG    ~ 78 KB
 *
 * 8 MiB per attachment is ~22x the common-case flyby, so a longer flight or a higher
 * resolution still fits, while a runaway producer cannot put an unbounded blob on a
 * metered turn. 16 MiB per turn bounds the whole turn even with several attachments.
 *
 * Caps are DECODED byte counts (what the provider bills against), not base64 lengths —
 * base64 inflates by 4/3 and a policy expressed in encoded length would silently be 25%
 * tighter than it reads.
 *
 * UNLIKE TEXT, OVERSIZE MEDIA IS REJECTED, NOT TRUNCATED. chatIngress truncates an
 * oversized text result because a prefix of text is still meaningful. A prefix of an MP4
 * is a CORRUPT FILE: the model would receive something undecodable, or worse, decodable
 * but wrong. So the size policy here fails loud with the numbers named.
 */
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
export const MAX_TURN_MEDIA_BYTES = 16 * 1024 * 1024;
export const MAX_MEDIA_ATTACHMENTS_PER_TURN = 8;

/** Decoded byte length of a base64 payload, without allocating the buffer to find out. */
export function base64DecodedBytes(b64) {
  if (typeof b64 !== 'string' || b64.length === 0) return 0;
  const clean = b64.endsWith('==') ? b64.slice(0, -2) : b64.endsWith('=') ? b64.slice(0, -1) : b64;
  return Math.floor((clean.length * 3) / 4);
}

/** Human-readable byte size for error messages that have to be actionable. */
function humanBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${n} B`;
}

/**
 * Which kind does this MIME belong to? Returns null for anything unlisted — callers decide
 * whether that is a fail-loud (it always is, today).
 */
export function kindForMimeType(mime) {
  if (typeof mime !== 'string') return null;
  const m = mime.toLowerCase().trim();
  for (const kind of CHAT_MEDIA_KINDS) {
    if (CHAT_MEDIA_MIME_TYPES[kind].includes(m)) return kind;
  }
  return null;
}

/** Every MIME the platform accepts, flat — used to build schema descriptions (DRY). */
export function allAcceptedMimeTypes() {
  return CHAT_MEDIA_KINDS.flatMap((k) => CHAT_MEDIA_MIME_TYPES[k]);
}

/**
 * A media attachment arrives one of exactly TWO ways, and never both:
 *  - 'inline'    : `data` is base64 bytes the caller already holds.
 *  - 'asset_ref' : `asset_ref` names an object in THIS APP's own GCS assets space
 *                  (a `gs://` URI or a path relative to the app's assets/ prefix), which
 *                  the server resolves to bytes through the canonical app-asset reader.
 * Declaring both is a caller bug (which one did you mean?) and is refused.
 */
export const MEDIA_SOURCES = Object.freeze(['inline', 'asset_ref']);

/**
 * normalize(partial) -> full bag. THE contract. Consumers ferry this bag; they never
 * hand-list its fields (schema-mirror drift is a bug class — engineering-culture mandate).
 *
 * FAIL LOUD on anything malformed. A silently-dropped attachment is the worst outcome
 * available here: the model answers confidently about an image it never received, and
 * nothing in the transcript says so.
 *
 * @param {Object} partial - { mime_type, data? , asset_ref?, label?, truncated?, track? }
 * @returns {Object} the full normalized bag
 */
export function normalizeMediaAttachment(partial) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
    throw new TypeError('[chatMedia] media attachment must be an object');
  }
  const { mime_type, data, asset_ref, label, track } = partial;

  if (typeof mime_type !== 'string' || !mime_type.trim()) {
    throw new TypeError(
      `[chatMedia] media attachment is missing mime_type. Accepted: ${allAcceptedMimeTypes().join(', ')}`
    );
  }
  const kind = kindForMimeType(mime_type);
  if (!kind) {
    // Name the two the provider supports but this platform has not measured, so the caller
    // understands the refusal is a scope boundary and not a typo on their side.
    const unverified = /^audio\//i.test(mime_type) || /^application\/pdf$/i.test(mime_type);
    throw new TypeError(
      `[chatMedia] unsupported media mime_type "${mime_type}"` +
        (unverified
          ? ' — audio and document attachments are not enabled on this surface yet (not live-verified).'
          : '') +
        ` Accepted: ${allAcceptedMimeTypes().join(', ')}`
    );
  }

  const hasInline = typeof data === 'string' && data.length > 0;
  const hasRef = typeof asset_ref === 'string' && asset_ref.length > 0;
  if (hasInline && hasRef) {
    throw new TypeError(
      '[chatMedia] media attachment declares BOTH data and asset_ref — supply exactly one ' +
        '(inline bytes, or a reference into the app\'s asset space).'
    );
  }
  if (!hasInline && !hasRef) {
    throw new TypeError(
      '[chatMedia] media attachment has neither data (base64 bytes) nor asset_ref ' +
        '(a gs:// URI or a path under the app\'s assets/ prefix).'
    );
  }

  // Size policy applies to inline bytes at the door. An asset_ref is sized AFTER the server
  // resolves it (assertMediaBytesWithinPolicy), because only then are the bytes known.
  let bytes = null;
  if (hasInline) {
    if (/\s/.test(data.slice(0, 64)) && data.trimStart().startsWith('data:')) {
      throw new TypeError(
        '[chatMedia] media `data` must be RAW base64, not a data: URL. ' +
          'Strip the "data:<mime>;base64," prefix and pass mime_type separately.'
      );
    }
    bytes = base64DecodedBytes(data);
    assertMediaBytesWithinPolicy(bytes, { label: label || kind, mime_type });
  }

  return {
    kind,
    mime_type: mime_type.toLowerCase().trim(),
    source: hasInline ? 'inline' : 'asset_ref',
    data: hasInline ? data : null,
    asset_ref: hasRef ? asset_ref : null,
    label: label || kind,
    bytes,
    // Ferried straight from the producer's sidecar manifest, NOT re-derived here.
    // `truncated` means the PRODUCER shortened the capture (FlightRecorder.overflowed).
    // It is made MODEL-VISIBLE by mediaTruncationNotice below — losing the flag in
    // transport would re-introduce, one layer up, exactly the observability lie the
    // recorder treats as a bug class (frqtl-producer-contract.md).
    truncated: partial.truncated === true,
    // Opaque provenance bag (scene hash, tick indices, frame table, fps/ticksPerFrame…).
    // Ferried verbatim so the VLA loop can align a prediction with the state that produced
    // it. We deliberately do NOT re-enumerate its fields: the producer owns that schema.
    track: track && typeof track === 'object' ? track : null,
  };
}

/**
 * Enforce the per-attachment cap. Separate from normalize() because an asset_ref's size is
 * only knowable after the server has resolved the object.
 */
export function assertMediaBytesWithinPolicy(bytes, { label = 'attachment', mime_type = '' } = {}) {
  if (bytes > MAX_MEDIA_BYTES) {
    const err = new Error(
      `[chatMedia] media attachment "${label}" (${mime_type}) is ${humanBytes(bytes)}, over the ` +
        `${humanBytes(MAX_MEDIA_BYTES)} per-attachment limit. Media is REJECTED rather than truncated — ` +
        `a partial video or image is a corrupt file, not a shorter one. Re-encode smaller ` +
        `(for a flyby, an MP4 is ~5x smaller than the equivalent PNG sequence) and retry.`
    );
    err.code = 'MEDIA_TOO_LARGE';
    err.data = { label, mime_type, bytes, limit: MAX_MEDIA_BYTES };
    throw err;
  }
  return bytes;
}

/**
 * Normalize a whole turn's worth of attachments and enforce the per-TURN bounds.
 * @param {Array} list
 * @returns {Array} normalized bags
 */
export function normalizeMediaAttachments(list) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) {
    throw new TypeError('[chatMedia] `media` must be an array of media attachments');
  }
  if (list.length > MAX_MEDIA_ATTACHMENTS_PER_TURN) {
    const err = new Error(
      `[chatMedia] ${list.length} media attachments on one turn, over the ` +
        `${MAX_MEDIA_ATTACHMENTS_PER_TURN} per-turn limit.`
    );
    err.code = 'MEDIA_TOO_MANY';
    err.data = { count: list.length, limit: MAX_MEDIA_ATTACHMENTS_PER_TURN };
    throw err;
  }
  const bags = list.map(normalizeMediaAttachment);
  assertTurnMediaWithinPolicy(bags);
  return bags;
}

/** Enforce the per-turn aggregate byte cap over whatever sizes are known so far. */
export function assertTurnMediaWithinPolicy(bags) {
  const total = bags.reduce((sum, b) => sum + (b.bytes || 0), 0);
  if (total > MAX_TURN_MEDIA_BYTES) {
    const err = new Error(
      `[chatMedia] this turn carries ${humanBytes(total)} of media, over the ` +
        `${humanBytes(MAX_TURN_MEDIA_BYTES)} per-turn limit. Send fewer or smaller attachments.`
    );
    err.code = 'MEDIA_TURN_TOO_LARGE';
    err.data = { bytes: total, limit: MAX_TURN_MEDIA_BYTES };
    throw err;
  }
  return total;
}

/**
 * The MODEL-VISIBLE notice for producer-truncated media, mirroring chatIngress's
 * truncationMarker contract: the model must know it is reasoning over a prefix.
 * Returns '' when nothing was truncated, so callers can concatenate unconditionally.
 */
export function mediaTruncationNotice(bags) {
  const cut = bags.filter((b) => b.truncated);
  if (cut.length === 0) return '';
  const names = cut.map((b) => `"${b.label}"`).join(', ');
  return (
    `\n\n… [TRUNCATED at capture by the producer: ${names} ${cut.length === 1 ? 'is' : 'are'} a PREFIX of the ` +
    `recording, not the whole of it. Frames after the cut were never captured — do not infer that ` +
    `nothing happened after the last frame you can see.]`
  );
}

/**
 * Encode one normalized bag as the provider's typed content block.
 * THE ONLY PLACE that knows the wire shape. Probe-verified flat snake_case:
 *   { type:'image'|'video', mime_type:'image/png', data:'<base64>' }
 *
 * An unresolved asset_ref reaching here is a programming error in the server pipeline
 * (the resolver runs first), not a caller error — it fails loud as such.
 */
export function toProviderBlock(bag) {
  if (!bag || !CHAT_MEDIA_KINDS.includes(bag.kind)) {
    throw new TypeError(`[chatMedia] cannot encode media block for kind "${bag && bag.kind}"`);
  }
  if (typeof bag.data !== 'string' || !bag.data.length) {
    throw new Error(
      `[chatMedia] media "${bag.label}" has no bytes at encode time` +
        (bag.asset_ref ? ` — its asset_ref "${bag.asset_ref}" was never resolved.` : '.')
    );
  }
  return { type: bag.kind, mime_type: bag.mime_type, data: bag.data };
}

/**
 * Build the whole provider `input` for a turn: the text block first, then one block per
 * attachment. Text-first so the model reads the instruction before the pixels, matching
 * chatIngress.composeTurnInput's ordering rationale.
 *
 * Returns a STRING when there is no media, so the existing text-only path is byte-for-byte
 * unchanged (the API accepts a bare string, and every prior probe/measurement was taken
 * against that form).
 */
export function buildProviderInput(text, bags = []) {
  if (!bags || bags.length === 0) return text;
  return [{ type: 'text', text: text + mediaTruncationNotice(bags) }, ...bags.map(toProviderBlock)];
}

/**
 * The JSON-Schema fragment for the `media` parameter, so nativeTools.js DECLARES the
 * contract instead of restating it. One owner for the vocabulary and the caps means the
 * advertised schema can never drift from the enforced policy.
 */
export function mediaParamSchema() {
  return {
    type: 'array',
    description:
      'Optional: images and/or videos for the model to LOOK AT on this turn. Each entry supplies ' +
      'EITHER `data` (raw base64 bytes, no data: URL prefix) OR `asset_ref` (a gs:// URI or a path ' +
      'relative to this app\'s assets/ prefix, uploaded via `descix app media-upload` / ' +
      'get_asset_upload_token) — exactly one, never both. Media persists in the conversation thread: ' +
      'on a later turn with previous_interaction_id the model still remembers it, so do NOT resend. ' +
      `Limits: up to ${MAX_MEDIA_ATTACHMENTS_PER_TURN} attachments/turn, ` +
      `${Math.round(MAX_MEDIA_BYTES / (1024 * 1024))} MiB each, ` +
      `${Math.round(MAX_TURN_MEDIA_BYTES / (1024 * 1024))} MiB per turn. Oversized media is REJECTED, ` +
      'not truncated. Media tokens are billed as input tokens.',
    items: {
      type: 'object',
      properties: {
        mime_type: {
          type: 'string',
          enum: allAcceptedMimeTypes(),
          description: 'MIME type of the attachment; determines whether it is sent as an image or a video block.',
        },
        data: { type: 'string', description: 'Raw base64-encoded bytes. Mutually exclusive with asset_ref.' },
        asset_ref: {
          type: 'string',
          description:
            'Reference to an object in THIS app\'s GCS asset space (gs:// URI, or a path relative to the ' +
            'app assets/ prefix). Resolved to bytes server-side. Mutually exclusive with data.',
        },
        label: { type: 'string', description: 'Short human/model-readable name for this attachment.' },
        truncated: {
          type: 'boolean',
          description:
            'Set true when the PRODUCER shortened the capture (e.g. FlightRecorder overflow). The model is ' +
            'told explicitly that it is seeing a prefix.',
        },
        track: {
          type: 'object',
          description:
            'Optional provenance sidecar ferried verbatim (scene hash, tick indices, frame table, ' +
            'ticksPerFrame/fps). Lets a VLA loop align a prediction with the state that produced it.',
        },
      },
      required: ['mime_type'],
    },
  };
}
