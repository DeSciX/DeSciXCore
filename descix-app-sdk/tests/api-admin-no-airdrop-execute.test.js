/**
 * airdrop_execute was struck from Cloud 2026-10-10 (410, settlement lives in daita-sam).
 * The client wrapper `airdropExecute` is dead surface and must stay deleted.
 *
 * Run: node --test tests/api-admin-no-airdrop-execute.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'util', 'api', 'ApiAdmin.js'), 'utf8');

test('ApiAdmin source exports no airdropExecute and names no airdrop_execute command', () => {
    assert.doesNotMatch(SRC, /airdropExecute/);
    assert.doesNotMatch(SRC, /airdrop_execute/);
});

// airdrop_stage was struck from Cloud 2026-10-11 (410, superseded by offerService.importOffers —
// the offers rail, CEO word 1530eb6). The wrapper `airdropStage` is dead surface the same way;
// airdropLoadSheet STAYS (the sheet reader feeding importOffers).
test('ApiAdmin source exports no airdropStage and names no airdrop_stage command', () => {
    assert.doesNotMatch(SRC, /airdropStage/);
    assert.doesNotMatch(SRC, /airdrop_stage/);
});
