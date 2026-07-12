/**
 * Unit tests for @descix/platform-api/mcp-tools setup-playbook (D4 "Set up DeSciX").
 * Authority: CEO-D-2026-07-12-VOICE-AND-SERVING-DISPATCH, ws-first-contact-voice packet V6.
 *
 * Pure module, zero deps. Run: node --test tests/setup-playbook.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESCIX_SETUP_PLAYBOOK, isSetupIntent } from '../src/mcp-tools/setup-playbook.js';

test('DESCIX_SETUP_PLAYBOOK: structured D4 return contract with the D3-AI stance carried verbatim', () => {
    assert.equal(DESCIX_SETUP_PLAYBOOK.kind, 'descix_setup_playbook');
    assert.ok(DESCIX_SETUP_PLAYBOOK.version, 'version must be present');
    // project_instructions IS the single-source D3-AI stance text.
    assert.equal(typeof DESCIX_SETUP_PLAYBOOK.project_instructions, 'string');
    assert.ok(DESCIX_SETUP_PLAYBOOK.project_instructions.length > 0, 'project_instructions must be non-empty');
    // Proves it carries the D3 stance (honest-assistant + neither-side-free).
    assert.match(DESCIX_SETUP_PLAYBOOK.project_instructions, /honest, transparent research assistant/);
    assert.match(DESCIX_SETUP_PLAYBOOK.project_instructions, /gets anything for free/);
    // Walkthrough mechanics.
    assert.ok(Array.isArray(DESCIX_SETUP_PLAYBOOK.ui_steps) && DESCIX_SETUP_PLAYBOOK.ui_steps.length > 0, 'ui_steps must be a non-empty array');
    assert.equal(DESCIX_SETUP_PLAYBOOK.verification.probe_tool, 'ask_question_to_app');
});

test('isSetupIntent: fires on setup/onboarding phrasing, not on generic discovery', () => {
    assert.equal(isSetupIntent('set up DeSciX'), true);
    assert.equal(isSetupIntent('help me get started with DeSciX'), true);
    // Generic discovery must NOT be misrouted into the setup playbook.
    assert.equal(isSetupIntent('how do I query a knowledge base'), false);
    // Robust to non-string input.
    assert.equal(isSetupIntent(undefined), false);
});
