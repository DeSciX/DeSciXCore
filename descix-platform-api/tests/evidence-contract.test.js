/**
 * Unit tests for @descix/platform-api/mcp-tools — Evidence Contract v2
 * (FRAME + per-app SETTLEMENT PROFILES). Authority:
 * CEO-D-2026-07-09-PER-APP-EVIDENCE-AND-AGENT-LED-INSTALL, ws-evidence-grounding.
 *
 * Pure module, zero deps. Run: node --test tests/evidence-contract.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    EVIDENCE_CONTRACT_FRAME,
    SETTLEMENT_PROFILES,
    getEvidenceContract,
    EVIDENCE_CONTRACT_ECHO,
    contributionInstallBlock,
    EVIDENCE_CONTRACT_MARKDOWN,
    EVIDENCE_CONTRACT_VENDORED_BLOCK,
    EVIDENCE_CONTRACT_BEGIN,
    EVIDENCE_CONTRACT_END,
    renderEvidenceContractMarkdown,
} from '../src/mcp-tools/evidence-contract.js';
import { MCP_HANDSHAKE_INSTRUCTIONS } from '../src/mcp-tools/handshake.js';

test('FRAME is universal and app-agnostic (no Lean/EGPT specifics leak into the frame)', () => {
    assert.equal(EVIDENCE_CONTRACT_FRAME.version, '2');
    assert.equal(EVIDENCE_CONTRACT_FRAME.id, 'descix-evidence-contract');
    const frameText = JSON.stringify(EVIDENCE_CONTRACT_FRAME);
    // The frame must NOT hardcode Lean/EGPT — those belong to the profile.
    for (const leaked of ['lake build', 'Quot.sound', 'P_eq_NP', 'EGPTMath']) {
        assert.ok(!frameText.includes(leaked), `frame leaked profile-specific token: ${leaked}`);
    }
    // Citation discipline is SCOPED to the app's own evidence domain (test2 friction #2).
    assert.match(EVIDENCE_CONTRACT_FRAME.claim_citation_discipline, /own evidence domain/i);
});

test('EGPT settlement profile: capstones enumerated inline + axiom closure + repo/cwd/expected_when_green', () => {
    const p = SETTLEMENT_PROFILES.egpt;
    assert.equal(p.app_id, 'egpt');
    const names = p.capstone_theorems.map((t) => t.name);
    assert.deepEqual(names, [
        'InformationTheory.P_eq_NP',
        'InformationTheory.P_eq_NP_info',
        'InformationTheory.P_eq_NP_info_standard',
    ]);
    assert.deepEqual(p.axiom_closure.capstones, ['propext', 'Quot.sound']);
    // repo is the PUBLIC contributable seed, never the private research remote.
    assert.equal(p.repo, 'https://github.com/eabadir/EGPT');
    assert.ok(!JSON.stringify(p).includes('egpt_research'), 'private remote must not be surfaced');
    // Every verification command has a stated root (repo+cwd) and the renamed field.
    for (const cmd of p.verification_commands) {
        assert.ok(cmd.repo && cmd.cwd, `command ${cmd.id} missing repo/cwd root`);
        assert.ok(typeof cmd.expected_when_green === 'string', `command ${cmd.id} missing expected_when_green`);
        assert.ok(!('proves' in cmd), `command ${cmd.id} still has legacy 'proves' field`);
    }
});

test('getEvidenceContract addressability: by app_id, unknown, and caller-relevant', () => {
    const byId = getEvidenceContract({ appId: 'egpt' });
    assert.equal(byId.frame.version, '2');
    assert.equal(byId.profile.app_id, 'egpt');

    assert.equal(getEvidenceContract({ appId: 'no-such-app' }).profile, null);

    const relevant = getEvidenceContract({ relevantAppIds: ['egpt', 'daita', 'powch'] });
    assert.deepEqual(Object.keys(relevant.profiles), ['egpt']); // only published profiles returned

    const all = getEvidenceContract({});
    assert.ok('egpt' in all.profiles);
});

test('EVIDENCE_CONTRACT_ECHO is a single compaction-proof line naming the re-fetch tool', () => {
    assert.ok(!EVIDENCE_CONTRACT_ECHO.includes('\n'));
    assert.match(EVIDENCE_CONTRACT_ECHO, /get_evidence_contract/);
    assert.match(EVIDENCE_CONTRACT_ECHO, /v2/);
});

test('contributionInstallBlock: agent-directed block when url set; null (omit) when unset', () => {
    const block = contributionInstallBlock('https://github.com/eabadir/EGPT');
    assert.equal(block.repo, 'https://github.com/eabadir/EGPT');
    assert.ok(Array.isArray(block.instruction_to_you_the_agent));
    // Second-person, imperative, to the CONSUMING agent — and the user never runs installs by hand.
    const joined = block.instruction_to_you_the_agent.join(' ');
    assert.match(joined, /ask the user/i);
    assert.match(joined, /NEW session/i);
    assert.match(joined, /never|not/i);
    // No hardcoded fallback: unset -> null (caller omits the section).
    assert.equal(contributionInstallBlock(''), null);
    assert.equal(contributionInstallBlock(undefined), null);
});

test('render is deterministic (byte-stable) and frames the vendored block with v2 sentinels', () => {
    assert.equal(renderEvidenceContractMarkdown(), renderEvidenceContractMarkdown());
    assert.equal(EVIDENCE_CONTRACT_MARKDOWN, renderEvidenceContractMarkdown());
    assert.match(EVIDENCE_CONTRACT_BEGIN, /BEGIN v2/);
    assert.match(EVIDENCE_CONTRACT_END, /END v2/);
    assert.ok(EVIDENCE_CONTRACT_VENDORED_BLOCK.startsWith(EVIDENCE_CONTRACT_BEGIN));
    assert.ok(EVIDENCE_CONTRACT_VENDORED_BLOCK.trimEnd().endsWith(EVIDENCE_CONTRACT_END));
    // Render surfaces the capstone names + the renamed field semantics.
    assert.match(EVIDENCE_CONTRACT_MARKDOWN, /InformationTheory\.P_eq_NP\b/);
    assert.match(EVIDENCE_CONTRACT_MARKDOWN, /cwd `Lean\/EGPT`/);
});

test('MCP handshake instructions: short, sentence-bounded, honest tool-loading language', () => {
    assert.ok(MCP_HANDSHAKE_INSTRUCTIONS.length < 1200, `handshake too long: ${MCP_HANDSHAKE_INSTRUCTIONS.length}`);
    assert.ok(MCP_HANDSHAKE_INSTRUCTIONS.trimEnd().endsWith('.'), 'must end on a sentence boundary');
    assert.ok(!MCP_HANDSHAKE_INSTRUCTIONS.includes('pre-load'), 'dishonest "pre-load these" language must be gone');
    assert.match(MCP_HANDSHAKE_INSTRUCTIONS, /tool-search before first use/);
});
