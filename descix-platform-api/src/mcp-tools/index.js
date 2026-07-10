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
