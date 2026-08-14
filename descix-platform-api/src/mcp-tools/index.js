/**
 * @descix/platform-api/mcp-tools — shared MCP tool-definition SSOT (WS-MCP-SSOT-TIER2).
 * Dependency-free leaf so the CLI stdio server can import it without GCP infra.
 */
export {
    NATIVE_MCP_TOOLS,
    toMcpToolList,
    mutatingNativeToolNames,
    recommendedOAuthReadonlyToolNames,
    DISCOVERY_CORE_TOOL_NAMES,
    isDiscoveryCoreTool,
    MESH_INVOKE_GATEWAY_TOOLS,
    isMeshInvokeGatewayTool,
} from './nativeTools.js';
export {
    ESSENTIAL_TOOL_NAMES,
    MCP_HANDSHAKE_INSTRUCTIONS,
    PLATFORM_BOOTSTRAP_SUMMARY,
} from './handshake.js';
// ws-mcp-surface-basics (CEO-D-2026-08-14-MCP-BASICS) — strict fail-loud param validation.
// The schema stopped being advertising-only: unknown/missing params are rejected AT the MCP
// boundary, naming the offender and suggesting the canonical key. One owner; the Cloud MCP
// router, the execute_remote_command gateway and the CLI stdio server all consume this.
export {
    PARAM_ALIASES,
    PLATFORM_INJECTED_PARAMS,
    suggestParam,
    validateParamsAgainstSchema,
    validateToolParams,
    toolAcceptsParam,
} from './paramValidation.js';
// ws-evidence-grounding (CEO-D-2026-07-09) — canonical Evidence Contract: FRAME +
// per-app SETTLEMENT PROFILES, addressability (getEvidenceContract), the compaction-proof
// echo, the agent-led install block, and the vendored-copy render/sentinels. One owner;
// the MCP surface consumes by import.
export {
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
} from './evidence-contract.js';
// ws-first-contact-voice (CEO-D-2026-07-12, packet V6) — D4 "Set up DeSciX" setup-playbook:
// the structured onboarding return contract + the setup-intent detector consumed as an
// additive tell_me_how route. Dependency-free leaf; project_instructions is the single-source
// D3-AI stance text.
export {
    DESCIX_SETUP_PLAYBOOK,
    isSetupIntent,
} from './setup-playbook.js';
