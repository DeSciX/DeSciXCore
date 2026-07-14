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
    SCIENCE_DEX_STORY,
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
import { MCP_HANDSHAKE_INSTRUCTIONS, ESSENTIAL_TOOL_NAMES } from '../src/mcp-tools/handshake.js';
import { DISCOVERY_CORE_TOOL_NAMES, NATIVE_MCP_TOOLS } from '../src/mcp-tools/nativeTools.js';

test('R6: DISCOVERY-CORE is the 7 normal-user MVP tools; mesh-ops tools flipped off the handshake', () => {
    assert.equal(DISCOVERY_CORE_TOOL_NAMES.length, 7);
    assert.ok(!DISCOVERY_CORE_TOOL_NAMES.includes('list_services'), 'list_services flipped off handshake');
    assert.ok(!DISCOVERY_CORE_TOOL_NAMES.includes('service_health_check'), 'service_health_check flipped off handshake');
    for (const t of ['tell_me_how', 'execute_remote_command', 'ask_question_to_app', 'query_knowledge_base', 'find_communities', 'fetch_my_purchases', 'get_credit_balance']) {
        assert.ok(DISCOVERY_CORE_TOOL_NAMES.includes(t), `MVP tool ${t} stays in DISCOVERY-CORE`);
    }
});

test('R5: find_communities tool description advertises LISTED-only (no "public") listing', () => {
    const fc = NATIVE_MCP_TOOLS.find((t) => t.name === 'find_communities');
    assert.match(fc.description, /listed in the app store/i);
    assert.match(fc.description, /fetch_my_purchases/);
    // CEO-D-2026-07-14: the word "public" is killed from the field/description vocabulary.
    assert.ok(!/public/i.test(fc.description), 'find_communities description must not use the word "public"');
});

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

test('FRAME.retrieval_first: retrieval-first directive naming concrete read commands, no adversarial pressure (ws-first-contact-voice V1.2/V1.4)', () => {
    // V1.2: the load-bearing behavioral directive exists and is a non-empty string.
    assert.equal(typeof EVIDENCE_CONTRACT_FRAME.retrieval_first, 'string');
    assert.ok(EVIDENCE_CONTRACT_FRAME.retrieval_first.length > 0, 'retrieval_first must be a non-empty string');
    // It must name CONCRETE read instruments so "retrieve" is a one-call action, not a slogan.
    assert.match(EVIDENCE_CONTRACT_FRAME.retrieval_first, /query_knowledge_base/);
    assert.match(EVIDENCE_CONTRACT_FRAME.retrieval_first, /get_kb_rag_file_content/);
    // CEO wording pass 2026-07-12: the recursive-chain principle is load-bearing — assert
    // on durable phrases so a future rewording that drops the principle fails here.
    assert.match(EVIDENCE_CONTRACT_FRAME.retrieval_first, /recursive/);
    assert.match(EVIDENCE_CONTRACT_FRAME.retrieval_first, /followed the chain/);
    assert.match(EVIDENCE_CONTRACT_FRAME.retrieval_first, /honest/i);
    // egpt profile threads the chain principle concretely (facts unchanged).
    assert.match(SETTLEMENT_PROFILES.egpt.burden_of_proof.rule, /followable end-to-end/);
    assert.match(SETTLEMENT_PROFILES.egpt.burden_of_proof.rule, /not predicting/);
    // It stays app-agnostic (same no-leak rule as the FRAME): no Lean/EGPT tokens.
    for (const leaked of ['lake build', 'Quot.sound', 'P_eq_NP', 'EGPTMath']) {
        assert.ok(!EVIDENCE_CONTRACT_FRAME.retrieval_first.includes(leaked), `retrieval_first leaked profile token: ${leaked}`);
    }
    // The test-2 adversarial pressure is gone from the FRAME: the "burden reversed onto the
    // challenger" framing no longer appears anywhere in the app-agnostic frame.
    const frameText = JSON.stringify(EVIDENCE_CONTRACT_FRAME);
    assert.ok(!/reversed onto the challenger/i.test(frameText), 'adversarial "reversed onto the challenger" must be gone from the FRAME');
    // And the egpt burden rule drops the "not acceptable to burn a conversation" pressure.
    assert.ok(!/not acceptable to/i.test(SETTLEMENT_PROFILES.egpt.burden_of_proof.rule), 'egpt burden rule must drop the "not acceptable to" pressure');
    // The egpt rule now carries a retrieval-first instruction instead.
    assert.match(SETTLEMENT_PROFILES.egpt.burden_of_proof.rule, /retrieve and read it first/i);
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

    // Prefix-match (voice round 2): a caller in community 'egpt' is relevant to 'egpt' AND its
    // sub-app settlement profiles ({community}-{name}) — so 'egpt-dse' surfaces too. 'daita'/'powch'
    // have no published profile and no sub-app profile, so they contribute nothing.
    const relevant = getEvidenceContract({ relevantAppIds: ['egpt', 'daita', 'powch'] });
    assert.deepEqual(Object.keys(relevant.profiles).sort(), ['egpt', 'egpt-dse']);
    // An unrelated community surfaces no profile.
    assert.deepEqual(Object.keys(getEvidenceContract({ relevantAppIds: ['daita'] }).profiles), []);

    const all = getEvidenceContract({});
    assert.ok('egpt' in all.profiles);
    assert.ok('egpt-dse' in all.profiles);
});

test('V1 purpose-first: the platform framing leads with the economic-model PURPOSE, mechanism second', () => {
    // SCIENCE_DEX_STORY is the single source the handshake + bootstrap consume; sentence 1 must
    // name the purpose (open source gets an economic model / creators share the value), not "a DEX".
    assert.match(SCIENCE_DEX_STORY[0], /economic model/i);
    assert.match(SCIENCE_DEX_STORY[0], /share in the value|researchers and creators/i);
    // The purpose leads: the word "DEX" (the mechanism) must not be the opening frame of sentence 1.
    assert.ok(!/^DeSciX is a rigorous decentralized-science DEX/.test(SCIENCE_DEX_STORY[0]), 'sentence 1 must not open mechanics-first');
});

test('R3: FRAME leads with the verifiability INVITATION; no-priors is a consequence of checkability', () => {
    // Lead with "you can check this yourself, here it takes minutes" rather than a posture demand.
    assert.match(EVIDENCE_CONTRACT_FRAME.summary, /check them yourself|verifiable BY YOU|check it, usually in minutes/i);
    // no-priors is now framed as a CONSEQUENCE of checkability ("because everything here is checkable").
    assert.match(EVIDENCE_CONTRACT_FRAME.no_priors_rule, /because everything here is checkable/i);
    // The egpt burden rule leads with the concrete invitation (exact command, minutes) and drops
    // any posture-demand phrasing.
    const egptRule = SETTLEMENT_PROFILES.egpt.burden_of_proof.rule;
    assert.match(egptRule, /check this yourself/i);
    assert.match(egptRule, /takes minutes|~2 min/i);
    assert.match(egptRule, /not a posture you are asked to adopt/i);
});

test('PROFILE: egpt-dse settlement profile carries the ratified DSE settlement facts (D-report 2026-07-12)', () => {
    const p = SETTLEMENT_PROFILES['egpt-dse'];
    assert.ok(p, 'egpt-dse profile must be registered');
    assert.equal(p.app_id, 'egpt-dse');
    assert.equal(p.package, '@descix/frqtl-sdk@0.1.2');
    assert.equal(p.golden_in_package_path, 'dist/node/conformance/goldens/double-slit.json');
    // CEO-ratified golden parameter tuple.
    assert.deepEqual(p.golden_tuple, { seed: 42, wavelength: 64, detectAtSlits: 1, ticks: 400, total: 103, slit1: 63, slit2: 40, combined_bins: 74 });
    // Exact-bin-match criterion (chi2 === 0), no tolerance band.
    assert.match(p.criterion, /chi2 === 0/);
    assert.match(p.settles_on, /Pearson χ² must be exactly 0|exact bin match/i);
    // The exact ratified command, verified against the published registry.
    const cmd = p.verification_commands.find(v => v.id === 'dse_settlement');
    assert.ok(cmd, 'dse_settlement verification command present');
    assert.equal(cmd.cmd, 'npx -y -p @descix/frqtl-sdk@0.1.2 frqtl-dse-settlement --check');
    assert.match(cmd.expected_when_green, /chi2 \(combined histogram\) = 0/);
    assert.match(cmd.expected_when_green, /CHECK RESULT: PASS/);
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
    // ws-first-contact-voice V1: the deterministic render now surfaces the retrieval-first directive.
    assert.match(EVIDENCE_CONTRACT_MARKDOWN, /Retrieval first/);
    assert.match(EVIDENCE_CONTRACT_MARKDOWN, /query_knowledge_base/);
});

test('MCP handshake instructions: short (< client cut), sentence-bounded, honest tool-loading, names all essential tools', () => {
    // test2 #5: prior copy was 2449 chars and truncated mid-word (~1500). Stay well under.
    assert.ok(MCP_HANDSHAKE_INSTRUCTIONS.length < 1500, `handshake too long: ${MCP_HANDSHAKE_INSTRUCTIONS.length}`);
    assert.ok(MCP_HANDSHAKE_INSTRUCTIONS.trimEnd().endsWith('.'), 'must end on a sentence boundary');
    assert.ok(!MCP_HANDSHAKE_INSTRUCTIONS.includes('pre-load'), 'dishonest "pre-load these" language must be gone');
    // V4 (ws-first-contact-voice): the lead-in now states the deferred-tool honesty
    // ("run your tool-search for a tool before its first call") instead of the exact
    // phrase "tool-search before first use". Assert the load-bearing token — the honest
    // tool-search directive — still survives (deliberate, still-meaningful check).
    assert.match(MCP_HANDSHAKE_INSTRUCTIONS, /tool-search/);
    // Mirror the Cloud F1 conformance contract (ws-mvp-firstcontact): 8-25 lines, names all 4 essential tools.
    const lines = MCP_HANDSHAKE_INSTRUCTIONS.split('\n').length;
    assert.ok(lines >= 8 && lines <= 25, `handshake ${lines} lines — outside the 8-25 operating-manual envelope`);
    for (const name of ESSENTIAL_TOOL_NAMES) {
        assert.ok(MCP_HANDSHAKE_INSTRUCTIONS.includes(name), `handshake must name essential tool ${name}`);
    }
});
