/**
 * Schema tests for @descix/platform-api/mcp-tools/setup-playbook.js — the D4 first-contact
 * script (packet V6; CEO-D-2026-07-12-METERING-DISPLAY-AND-FIRST-CONTACT-SCRIPT).
 * Pure module, zero deps. Run: node --test tests/setup-playbook.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESCIX_SETUP_PLAYBOOK, isSetupIntent } from '../src/mcp-tools/setup-playbook.js';

test('DESCIX_SETUP_PLAYBOOK: contract kind/version + single-source D3 stance', () => {
    assert.equal(DESCIX_SETUP_PLAYBOOK.kind, 'descix_setup_playbook');
    assert.ok(typeof DESCIX_SETUP_PLAYBOOK.version === 'string' && DESCIX_SETUP_PLAYBOOK.version.length > 0);
    const pi = DESCIX_SETUP_PLAYBOOK.project_instructions;
    assert.ok(typeof pi === 'string' && pi.length > 0);
    // The D3 stance rides ONLY here (single source with the drafts doc / packet V7.D3-AI).
    assert.match(pi, /honest, transparent research assistant/);
    assert.match(pi, /gets anything for free/);
    assert.equal(DESCIX_SETUP_PLAYBOOK.verification.probe_tool, 'ask_question_to_app');
});

test('first-contact script: public two-step instruction + doctor-style steps in order', () => {
    // The PUBLIC onboarding instruction (ad/setup-card copy) — exact two-step.
    assert.match(DESCIX_SETUP_PLAYBOOK.onboarding_instruction, /Settings → Connectors/);
    assert.match(DESCIX_SETUP_PLAYBOOK.onboarding_instruction, /Help me set-up DeSciX/);
    assert.match(DESCIX_SETUP_PLAYBOOK.onboarding_instruction, /\/mcp/);
    // Doctor-style conversational script (voice round 2): greet -> LEARN DAITA -> ask -> offer
    // prompts -> create project -> tokenomics -> VERIFY (real settlement run, the final step).
    const steps = DESCIX_SETUP_PLAYBOOK.script.map((s) => s.step);
    assert.deepEqual(steps, ['greet', 'learn_daita', 'ask_interest', 'offer_prompts', 'create_project', 'explain_tokenomics', 'verify_settlement']);
    for (const s of DESCIX_SETUP_PLAYBOOK.script) {
        assert.ok(typeof s.do === 'string' && s.do.length > 0, `step ${s.step} missing 'do'`);
    }
});

test('V2 purpose-first greet + DAITA-first guided first step', () => {
    const greet = DESCIX_SETUP_PLAYBOOK.script.find((s) => s.step === 'greet');
    // Greet leads with the economic-model PURPOSE, mechanism second.
    assert.match(greet.do, /economic model/i);
    assert.match(greet.do, /share in the value/i);
    // The explicit guided FIRST step points at the DAITA community's own agent; DAITA = concept
    // home, EGPT = one example effort.
    const learn = DESCIX_SETUP_PLAYBOOK.script.find((s) => s.step === 'learn_daita');
    assert.match(learn.do, /ask_question_to_app/);
    assert.match(learn.do, /'daita'|app_id: 'daita'/);
    assert.match(learn.do, /concept\/platform home/i);
    assert.match(learn.do, /EGPT is one example/i);
});

test('V4 verify_settlement: setup ends with a REAL runnable verification (published DSE command)', () => {
    const verify = DESCIX_SETUP_PLAYBOOK.script.find((s) => s.step === 'verify_settlement');
    // It is the FINAL step.
    assert.equal(DESCIX_SETUP_PLAYBOOK.script[DESCIX_SETUP_PLAYBOOK.script.length - 1].step, 'verify_settlement');
    assert.match(verify.do, /npx -y -p @descix\/frqtl-sdk@0\.1\.2 frqtl-dse-settlement --check/);
    assert.match(verify.do, /CHECK RESULT: PASS/);
    // Per-surface framing (doctrine surface ladder).
    assert.match(verify.do, /Claude Code or Cowork/);
    // The structured settlement_experience carries the exact command/output for machine consumers.
    const exp = DESCIX_SETUP_PLAYBOOK.settlement_experience;
    assert.equal(exp.app_id, 'egpt-dse');
    assert.equal(exp.package, '@descix/frqtl-sdk@0.1.2');
    assert.equal(exp.command, 'npx -y -p @descix/frqtl-sdk@0.1.2 frqtl-dse-settlement --check');
    assert.match(exp.expected_output, /chi2 \(combined histogram\) = 0/);
    assert.ok(exp.per_surface.claude_ai && exp.per_surface.claude_code && exp.per_surface.cowork);
});

test('offer_prompts tracks: drawn from the use-case canon (surface-ladder §3)', () => {
    const offer = DESCIX_SETUP_PLAYBOOK.script.find((s) => s.step === 'offer_prompts');
    const tracks = offer.tracks;
    for (const key of ['value_building', 'quantum_computing', 'light_engine', 'neuromorphic', 'proofs_and_debate']) {
        assert.ok(Array.isArray(tracks[key]) && tracks[key].length > 0, `track ${key} missing/empty`);
    }
    assert.match(tracks.value_building.join(' '), /referral link/);
    assert.match(tracks.quantum_computing.join(' '), /Willsch/);
    assert.match(tracks.light_engine.join(' '), /double-slit/);
    assert.match(tracks.neuromorphic.join(' '), /Computer & the Brain/);
    // Proofs escalate to Cowork/Code (voice-doctrine cross-referral), never dead-end.
    assert.match(offer.proofs_referral_note, /Cowork\/Claude Code/);
});

test('explain_tokenomics: setup is the canonical metering-education home (CEO ruling)', () => {
    const tok = DESCIX_SETUP_PLAYBOOK.script.find((s) => s.step === 'explain_tokenomics');
    assert.match(tok.do, /metering is the default/i);
    assert.match(tok.do, /like the Claude API/i);
    assert.match(tok.do, /get_credit_balance/);
    // Truth rule: no promised alert thresholds / effective-tokens reporting (not shipped).
    assert.ok(!tok.do.includes('%'), 'no alert-threshold promises in tokenomics education');
    assert.ok(!/effective.tokens/i.test(tok.do), 'no effective-tokens reporting promise');
});

test('isSetupIntent: fires on the public instruction phrase + variants; not on discovery', () => {
    assert.equal(isSetupIntent('Help me set-up DeSciX'), true);   // the PUBLIC exact phrase (hyphenated)
    assert.equal(isSetupIntent('help me setup descix'), true);
    assert.equal(isSetupIntent('set up DeSciX'), true);
    assert.equal(isSetupIntent('help me get started with DeSciX'), true);
    // R2 (TEST-3 G3.3): the real phrasing that failed the walkthrough now fires.
    assert.equal(isSetupIntent('Help me get set-up with DeSciX'), true);
    assert.equal(isSetupIntent('help me get set up with descix'), true);
    assert.equal(isSetupIntent('how do I query a knowledge base'), false);
});
