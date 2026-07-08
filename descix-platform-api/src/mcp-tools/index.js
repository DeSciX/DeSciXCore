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
// ws-evidence-contract (DF-4/DF-5) — canonical Evidence Contract + science-DEX story
// + conditional repo pointer. One owner; the MCP surface consumes by import.
export {
    SCIENCE_DEX_STORY,
    EVIDENCE_CONTRACT,
    EVIDENCE_CONTRACT_MARKDOWN,
    EVIDENCE_CONTRACT_VENDORED_BLOCK,
    EVIDENCE_CONTRACT_BEGIN,
    EVIDENCE_CONTRACT_END,
    renderEvidenceContractMarkdown,
    evidenceRepoPointer,
} from './evidence-contract.js';
