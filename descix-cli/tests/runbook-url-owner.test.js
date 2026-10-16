/**
 * RUNBOOK_URL has ONE owner: @descix/platform-api/mcp-tools (cli-verbs.js, beside CLI_VERBS, whose
 * runbookAnchor values are fragments of it). Cloud tell_me_how joins the two into the runbook link
 * it serves; the app-lane CLAUDE.md template names the same page to a developer. This gate makes a
 * second spelling of the URL a CI failure instead of a silent divergence (eabadir/DeSciXCloud#19).
 *
 * Run: `node --test tests/runbook-url-owner.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNBOOK_URL, CLI_VERBS } from '@descix/platform-api/mcp-tools';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'templates', 'agent-claude.md'), 'utf8');
// Any spelling of the app-developer runbook page, whatever host or path precedes it.
const RUNBOOK_LINK = /https?:\/\/[^\s)`'"<>]*app-developer-runbook\.html/g;

test('RUNBOOK_URL is exported beside CLI_VERBS as an absolute https page URL with no fragment', () => {
    assert.equal(typeof RUNBOOK_URL, 'string', 'RUNBOOK_URL is not exported from @descix/platform-api/mcp-tools');
    assert.match(RUNBOOK_URL, /^https:\/\/[^\s#]+app-developer-runbook\.html$/);
    // The anchors are fragments OF this page: joining must yield one URL, never a doubled '#'.
    const anchored = CLI_VERBS.filter((v) => v.runbookAnchor !== null);
    assert.ok(anchored.length > 0, 'FIXTURE INVALID: no verb declares an anchor, so the join is unmeasured');
    for (const v of anchored) assert.match(`${RUNBOOK_URL}${v.runbookAnchor}`, /^[^#]+#[^#]+$/, v.verbPath);
});

test('every runbook link in templates/agent-claude.md is the exported RUNBOOK_URL', () => {
    const links = TEMPLATE.match(RUNBOOK_LINK) || [];
    assert.ok(links.length > 0, 'FIXTURE INVALID: the template names no runbook link, so equality measures nothing');
    for (const link of links) assert.equal(link, RUNBOOK_URL, 'the template spells the runbook URL differently from its owner');
});

test('NEGATIVE CONTROL: the link pattern catches a divergent spelling', () => {
    const drifted = TEMPLATE.replaceAll(RUNBOOK_URL, 'https://descix.net/dev/daita-docs/site/app-sdk/app-developer-runbook.html');
    const links = drifted.match(RUNBOOK_LINK) || [];
    assert.ok(links.length > 0 && links.some((l) => l !== RUNBOOK_URL), 'the gate cannot see a drifted URL');
});
