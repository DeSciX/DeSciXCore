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
