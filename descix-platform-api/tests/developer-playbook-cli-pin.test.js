/**
 * The developer playbook names ONE published CLI release, and every CLI invocation it teaches is
 * pinned to it. An unpinned `npx -y -p @descix/cli descix …` resolves whatever npm calls latest,
 * which may lack a verb or flag the playbook teaches; a bare `descix …` needs a global install the
 * playbook never asks for.
 *
 * Run: node --test tests/developer-playbook-cli-pin.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    DESCIX_DEVELOPER_PLAYBOOK,
    DEVELOPER_PLAYBOOK_CLI_VERSION,
} from '../src/mcp-tools/setup-playbook.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp-tools', 'setup-playbook.js'), 'utf8');
const PINNED = `npx -y -p @descix/cli@${DEVELOPER_PLAYBOOK_CLI_VERSION} descix `;

/**
 * Every CLI invocation in `text` that is NOT the pinned form: an `@descix/cli` package spec with no
 * version or another version, or a code span that starts with a bare `descix`.
 */
function offPinInvocations(text) {
    const out = [];
    for (const m of text.matchAll(/@descix\/cli(@[^\s`]+)? descix/g)) {
        if (m[1] !== `@${DEVELOPER_PLAYBOOK_CLI_VERSION}`) out.push(m[0]);
    }
    for (const m of text.matchAll(/`descix [^`]*`/g)) out.push(m[0]);
    // `npx descix` / `npx -y descix` resolves a package named descix, not @descix/cli.
    for (const m of text.matchAll(/npx (?:-y )?descix\b/g)) out.push(m[0]);
    return out;
}

test('the pinned CLI version is a release literal, spelled once in the owner', () => {
    assert.match(DEVELOPER_PLAYBOOK_CLI_VERSION, /^\d+\.\d+\.\d+$/);
    assert.equal(
        SRC.split(`'${DEVELOPER_PLAYBOOK_CLI_VERSION}'`).length - 1, 1,
        'the CLI version literal appears more than once — derive every use from DEVELOPER_PLAYBOOK_CLI_VERSION',
    );
    assert.match(DESCIX_DEVELOPER_PLAYBOOK.version, /^\d{4}-\d{2}-\d{2}\.\d+$/);
});

test('every CLI invocation in the developer playbook is pinned to that version', () => {
    const text = JSON.stringify(DESCIX_DEVELOPER_PLAYBOOK);
    assert.deepEqual(offPinInvocations(text), [], 'the playbook teaches an unpinned CLI invocation');
    // Each script step that names a CLI verb carries the pinned form.
    for (const step of ['pin_environment', 'cli_login', 'create_app', 'knowledge_base', 'publish_site', 'take_site_down']) {
        const s = DESCIX_DEVELOPER_PLAYBOOK.script.find((x) => x.step === step);
        assert.ok(s, `no ${step} step`);
        assert.ok(s.do.includes(PINNED), `${step} does not use the pinned invocation`);
    }
    assert.ok(DESCIX_DEVELOPER_PLAYBOOK.media_note.includes(`${PINNED}app media-link <ref>`));
});

test('NEGATIVE CONTROL: the detector flags each unpinned form and passes the pinned one', () => {
    assert.deepEqual(offPinInvocations('`npx -y -p @descix/cli descix login`'), ['@descix/cli descix']);
    assert.deepEqual(offPinInvocations('`npx -y -p @descix/cli@4.4.0 descix login`'), ['@descix/cli@4.4.0 descix']);
    assert.deepEqual(offPinInvocations('then `descix site upload -a x -p y`'), ['`descix site upload -a x -p y`']);
    assert.deepEqual(offPinInvocations('run npx descix login'), ['npx descix']);
    assert.deepEqual(offPinInvocations('run npx -y descix login'), ['npx -y descix']);
    assert.deepEqual(offPinInvocations(`\`${PINNED}login\``), []);
    // The real playbook with one step reverted to the old form is caught.
    const reverted = JSON.stringify(DESCIX_DEVELOPER_PLAYBOOK).replace(PINNED, 'npx -y -p @descix/cli descix ');
    assert.notEqual(reverted, JSON.stringify(DESCIX_DEVELOPER_PLAYBOOK), 'FIXTURE INVALID: nothing was reverted');
    assert.equal(offPinInvocations(reverted).length, 1);
});

/** Flags of the FIRST `site upload` code span in a step: does it pass -p, and is it a dry run? */
function leadUploadFlags(stepText) {
    const lead = [...stepText.matchAll(/`([^`]*)`/g)].map((m) => m[1]).find((c) => / site upload /.test(c));
    assert.ok(lead, 'the step has no site upload command');
    // Only the descix arguments: the npx prefix carries its own `-p @descix/cli@…`.
    const args = lead.slice(lead.indexOf(' site upload ') + ' site upload '.length);
    return { hasP: /(^|\s)-p(\s|$)/.test(args), dryRun: /--dry-run/.test(args) };
}

test('NEGATIVE CONTROL: the lead-command check rejects the pre-fix -p form', () => {
    assert.deepEqual(leadUploadFlags(`publish with \`${PINNED}site upload -a x -p <built output dir>\`. Then`), { hasP: true, dryRun: false });
    assert.deepEqual(leadUploadFlags(`\`${PINNED}site upload -a x --dry-run\``), { hasP: false, dryRun: true });
});

test('media note states visibility and media-link, and no minimum version of its own', () => {
    const m = DESCIX_DEVELOPER_PLAYBOOK.media_note;
    assert.match(m, /Public is the default; --private selects the app's private space/);
    assert.match(m, /valid for 300 seconds/);
    assert.ok(!/or later|send visibility/.test(m), 'the media note restates a minimum CLI version');
});

test('step 1 pins production with the flag after the subcommand, the form config init documents', () => {
    const s = DESCIX_DEVELOPER_PLAYBOOK.script.find((x) => x.step === 'pin_environment');
    assert.ok(s.do.includes(`${PINNED}config init --env prod`));
    assert.ok(!/there is no default/i.test(s.do), 'says the CLI has no default; production is its default');
});

test('site steps state the manifest, dry-run, silent-skip and take-down behaviour', () => {
    const publish = DESCIX_DEVELOPER_PLAYBOOK.script.find((x) => x.step === 'publish_site').do;
    // app init always writes .descix/manifests/site.json, and with a manifest -p is ignored, so the
    // lead command of a playbook-created app carries no -p.
    assert.deepEqual(leadUploadFlags(publish), { hasP: false, dryRun: true }, 'the lead site upload command is not the manifest form');
    assert.match(publish, /^app init wrote the site manifest \.descix\/manifests\/site\.json naming site\//);
    assert.match(publish, /buildCommand/);
    assert.match(publish, /read the "Would remove" list, then run the same command without --dry-run/);
    assert.match(publish, /Only a repo with no site manifest uses -p <dir>, which defaults to \.\/site/);
    assert.match(publish, /does not exist is skipped without a warning/);
    const down = DESCIX_DEVELOPER_PLAYBOOK.script.find((x) => x.step === 'take_site_down').do;
    assert.match(down, /one-page site/);
    assert.match(down, /site delete -c <community> -a <issued id>/);
    assert.match(down, /does not purge the edge/);
    // User-facing text cites no issue number.
    assert.ok(!/#\d+/.test(JSON.stringify(DESCIX_DEVELOPER_PLAYBOOK)), 'the playbook cites an issue number');
});
