/**
 * @descix/platform-api/mcp-tools — shared MCP tool-definition SSOT (WS-MCP-SSOT-TIER2).
 * Dependency-free leaf so the CLI stdio server can import it without GCP infra.
 */
export {
    NATIVE_MCP_TOOLS,
    // The (model, thinking) precedence chain, in words. ONE owner for the sentence: the served
    // tool docstrings interpolate it and DeSciX_Cloud's get_model_config serves it back as its
    // `chain` field instead of keeping a second hand-typed copy that drifts.
    MODEL_THINKING_CHAIN,
    toMcpToolList,
    mutatingNativeToolNames,
    recommendedOAuthReadonlyToolNames,
    DISCOVERY_CORE_TOOL_NAMES,
    isDiscoveryCoreTool,
    describeDiscoveryCoreFence,
    MESH_INVOKE_GATEWAY_TOOLS,
    isMeshInvokeGatewayTool,
} from './nativeTools.js';
// RESIDUAL 16 (seat DEVPLANE, 2026-08-24) — the record-filter OPERATOR VOCABULARY. One owner
// for "which operators exist" and "what shape of stored value each one can evaluate"; the Cloud
// evaluator and the advertised app_records_query description both import it instead of listing
// operators by hand.
export {
    SCALAR_FILTER_OPERATORS,
    ARRAY_FILTER_OPERATORS,
    SUPPORTED_FILTER_OPERATORS,
    operatorValueKind,
    remedyOperatorFor,
    filterOperatorClause,
} from './recordFilter.js';
export {
    ESSENTIAL_TOOL_NAMES,
    MCP_HANDSHAKE_INSTRUCTIONS,
    PLATFORM_BOOTSTRAP_SUMMARY,
} from './handshake.js';
// ws-chat-multimodal-image-attach — THE canonical media-on-a-chat-turn contract: kinds, MIME
// vocabulary, byte policy, normalize(partial)->bag, and the ONE provider-block encoder. Both
// the Cloud chat pipeline and the advertised nativeTools schema consume this; nobody
// re-enumerates a MIME list or re-derives a cap.
export {
    CHAT_MEDIA_KINDS,
    CHAT_MEDIA_MIME_TYPES,
    MEDIA_SOURCES,
    MAX_MEDIA_BYTES,
    MAX_TURN_MEDIA_BYTES,
    MAX_MEDIA_ATTACHMENTS_PER_TURN,
    base64DecodedBytes,
    kindForMimeType,
    allAcceptedMimeTypes,
    normalizeMediaAttachment,
    normalizeMediaAttachments,
    assertMediaBytesWithinPolicy,
    assertTurnMediaWithinPolicy,
    mediaTruncationNotice,
    toProviderBlock,
    buildProviderInput,
    mediaParamSchema,
} from './chatMedia.js';
// ws-mcp-surface-basics (CEO-D-2026-08-14-MCP-BASICS) — strict fail-loud param validation.
// The schema stopped being advertising-only: unknown/missing params are rejected AT the MCP
// boundary, naming the offender and suggesting the canonical key. One owner; the Cloud MCP
// router, the execute_remote_command gateway and the CLI stdio server all consume this.
export {
    PARAM_ALIASES,
    PLATFORM_INJECTED_PARAMS,
    isPlatformInjectedParam,
    VALIDATION_PHASE,
    VALIDATION_PHASES,
    DEFAULT_VALIDATION_PHASE,
    paramWaiverForPhase,
    requireValidationPhase,
    SCHEMA_TYPE_PREDICATES,
    SUPPORTED_SCHEMA_TYPES,
    runtimeTypeOf,
    declaredTypesOf,
    valueMatchesDeclaredType,
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
