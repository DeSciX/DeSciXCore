/**
 * Anti-regression guard for WS-CANONICAL-STACK (CEO-D-2026-06-08).
 *
 * These tests assert, at the SOURCE level, that the create stack derives community_id
 * from the TOKEN SYMBOL (never from the free-text community NAME) and that app-create
 * enforces the canonical fail-loud checks. They guard the exact lines that were the
 * descix/daita split root cause and the egpt orphan bug, so a future refactor can't
 * silently reintroduce them.
 *
 * Pure file reads — no backend, no chain. Run from descix-platform-api/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// platform-api/tests -> repo .../DeSciX_Core -> ../DeSciX_Cloud/microservice/services
const CLOUD = path.resolve(__dirname, '../../../DeSciX_Cloud/microservice/services');

function read(rel) {
    return readFileSync(path.join(CLOUD, rel), 'utf8');
}

test('FIX1a: create_community_skeleton derives community_id from token symbol, NOT name', () => {
    const src = read('commandHandlers/communityCommands.js');
    assert.match(src, /community_id = communityIdFromTokenSymbol\(token_symbol\)/,
        'skeleton must derive community_id via communityIdFromTokenSymbol(token_symbol)');
    // The root-cause line must NOT exist as real code (a comment reference is fine).
    assert.doesNotMatch(src, /^\s*const community_id = stripInvalidAndLower\(community_name\)/m,
        'community_id must NOT be derived from community_name');
});

test('FIX1a: create_community_with_app (drive path) derives community_id from symbol', () => {
    const src = read('communityManagement.js');
    assert.match(src, /community_id = communityIdFromTokenSymbol\(token_symbol\)/,
        'drive path must derive community_id via communityIdFromTokenSymbol(token_symbol)');
    assert.doesNotMatch(src, /^\s*const community_id = stripInvalidAndLower\(community_name\)/m,
        'community_id must NOT be derived from community_name in the drive path');
});

test('FIX2/FIX3: create_app_for_community enforces canonical checks', () => {
    const src = read('commandHandlers/appCommands.js');
    // (a) community-exists fail-loud
    assert.match(src, /does not exist in this environment/,
        'must fail loud when the target community does not exist');
    // (b) duplicate fail-loud, gated by overwrite
    assert.match(src, /already exists in community/,
        'must fail loud on duplicate app_id');
    assert.match(src, /if \(existing && !overwrite\)/,
        'duplicate check must be gated by an explicit overwrite flag');
    // (c)+(d)+FIX3: composed id via composeAppId from short_name/app_name
    assert.match(src, /composeAppId\(community_id, requestedShort\)/,
        'app_id must be composed via composeAppId (enforces {community}-{short} + invalid-char fail-loud)');
    assert.match(src, /short_name/, 'an optional short_name param must be accepted');
    // No code path may derive a bare app_id from app_name with no community prefix —
    // this guards BOTH create_app_for_community and the Drive create_skeleton_app sibling.
    assert.doesNotMatch(src, /const app_id = stripInvalidAndLower\(app_name\)/,
        'app_id must not be bare stripInvalidAndLower(app_name) — that bypassed the name scheme');
});
