/**
 * `descix app create --quick` is Drive-free — WS-V1-PURGE Phase 1, item 1 (audit #1;
 * CEO-D-2026-06-02-WS-V1-PURGE-SCOPE / -SSGPOD-PROD-PUBLISH-TWO-ROOT-CAUSES).
 *
 * The V1 create path hard-required a Google Drive base folder (prompting for a Drive URL and
 * invoking register_base_folder) before creating an app, and passed create_skeleton:true to
 * build a Drive skeleton. V2 app creation needs only the Products row + Firestore App doc +
 * entitlement (developer permission checked server-side); KB sync is the Git manifest path
 * (`descix kb corpus sync`), never Drive.
 *
 * Source-level anti-regression (the create action is a commander handler not unit-callable in
 * isolation; we assert the de-Drived shape of the source + that the new media-upload command
 * exists). Mirrors removed-methods-anti-regression.test.js's source-scan approach.
 *
 * Run: node --test tests/app-create-no-drive.test.js   (from descix-cli/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESCIX_JS = path.resolve(__dirname, '../bin/descix.js');

async function readDescix() {
  return fs.readFile(DESCIX_JS, 'utf-8');
}

// Extract the `app create` command block (from its `.command('create')` within the appCommand
// group to the next `appCommand` declaration) so assertions are scoped to the create flow.
function extractCreateBlock(src) {
  // The `app create` command is the appCommand block whose .command('create') passes
  // create_app_for_community. Scan all `appCommand\n  .command('create')` occurrences and
  // pick the one whose body references create_app_for_community (the app-level create).
  const marker = "appCommand\n  .command('create')";
  let from = 0;
  while (true) {
    const start = src.indexOf(marker, from);
    assert.ok(start !== -1, "expected an app-level appCommand .command('create') that creates an app");
    // block ends at the next top-level `appCommand\n  .command(` (or the start of media-upload comment)
    const next = src.indexOf("\n  .command('", start + marker.length);
    const nextAppCommand = src.indexOf('appCommand\n  .command(', start + marker.length);
    const end = nextAppCommand !== -1 ? nextAppCommand : src.length;
    const block = src.slice(start, end);
    if (block.includes('create_app_for_community')) return block;
    from = start + marker.length;
  }
}

test('app create --quick passes create_skeleton:false (no Drive skeleton)', async () => {
  const src = await readDescix();
  const block = extractCreateBlock(src);
  assert.match(block, /create_skeleton:\s*false/, 'create flow must pass create_skeleton:false');
  assert.doesNotMatch(block, /create_skeleton:\s*true/, 'create flow must NOT pass create_skeleton:true');
});

test('app create flow has no Drive base-folder gate', async () => {
  const src = await readDescix();
  const block = extractCreateBlock(src);
  assert.doesNotMatch(block, /register_base_folder/, 'create flow must not invoke register_base_folder');
  assert.doesNotMatch(block, /driveConfig/, 'create flow must not read driveConfig.base_folder_id');
  assert.doesNotMatch(block, /Drive folder URL/, 'create flow must not prompt for a Drive folder URL');
});

test('dead runAppWizard import (its only Drive-gate consumer) is removed', async () => {
  const src = await readDescix();
  assert.doesNotMatch(src, /import\s*\{\s*runAppWizard\s*\}/, 'runAppWizard import must be removed');
});

test('descix app media-upload command exists (media-via-API-surface)', async () => {
  const src = await readDescix();
  assert.match(src, /\.command\('media-upload'\)/, 'app media-upload command must exist');
  assert.match(src, /get_asset_upload_token/, 'media-upload must use get_asset_upload_token');
});
