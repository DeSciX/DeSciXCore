/**
 * @descix/platform-api/mcp-tools — Shared native (core) MCP tool definitions.
 *
 * WS-MCP-SSOT-TIER2 (CEO-D-2026-06-06-SSOT-TIER2-DESIGN-APPROVED, audit §5.B-1):
 * THE single source of truth for the curated CORE MCP tools that are advertised over
 * BOTH MCP transports:
 *   - stdio (descix-cli/bin/mcp-server.js — Cursor / Claude Desktop)
 *   - HTTP/Streamable (DeSciX_Cloud apiFront.js tools/list — the Claude.ai connector)
 *
 * Before this module these two lists were hand-duplicated in mcp-server.js TOOLS[] and
 * Cloud services/nativeMcpTools.js NATIVE_MCP_TOOLS — they drifted. They now both import
 * NATIVE_MCP_TOOLS from here. The duplicated curated literal is GONE.
 *
 * LEAF MODULE — DEPENDENCY-FREE BY DESIGN:
 *   This file imports nothing (no cloud-core, no googleapis). It is pure data so the
 *   thin CLI stdio server can import it via the '@descix/platform-api/mcp-tools' subpath
 *   WITHOUT dragging GCP infrastructure into the CLI process. Do not add imports here.
 *
 * SCHEMA (CEO-approved):
 *   each entry = { name, description, inputSchema, mutating, oauthReadonly? }
 *     - inputSchema : plain JSON-Schema (type:'object').
 *     - mutating    : true => write/admin/on-chain; excluded from the OAuth read-only
 *                     surface (the security-owned policy READS this; it does not author it).
 *     - oauthReadonly (advisory): EVP's recommendation that a read tool be added to the
 *                     security-owned OAUTH_READONLY_TOOLS allow-list. The security lane owns
 *                     the actual policy; this flag is a coordination signal, not enforcement.
 *
 * CLI-ONLY tools (descix_doctor, platform_health) are intentionally ABSENT here — they are
 * local CLI diagnostics, NOT /apifront commands, so they are concatenated by the stdio
 * server only and never advertised over HTTP. (Audit §2.ii-a.)
 *
 * Every entry MUST be a real command in DeSciX_Cloud commandHandlers/registry.js.
 */

export const NATIVE_MCP_TOOLS = Object.freeze([
    {
        name: 'query_knowledge_base',
        description: 'Vector-similarity search over a DeSciX knowledge base, returning raw source chunks with dereferenceable citations. ' +
            'Use it when the user wants primary-source passages, citations, or evidence from DeSciX research/community content, ' +
            'to ground or check an ask_question_to_app answer, or to pull the exact source behind a claim before contesting it. ' +
            'Proof chains can run deep — keep retrieving cited steps rather than predicting them. ' +
            'Scope to a single source with file_filter.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID' },
                kb_id: { type: 'string', description: 'KB name (default: General)' },
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Max results (default: 5)' },
            },
            required: ['app_id', 'query'],
        },
    },
    {
        name: 'ask_question_to_app',
        description: "Ask a natural-language research question against a DeSciX app/community knowledge base (RAG) and get a synthesized, citable answer drawn from that community's own sources. " +
            "Use it as a primary research source whenever the user asks about decentralized science, open science, decentralized IP, or a specific DeSciX community (e.g. DAITA, EGPT) — including when the user has not named DeSciX but the question falls in these domains. " +
            "It retrieves and cites the community's material rather than answering from general memory; pass previous_interaction_id to continue a thread. " +
            "Do not use it for general-knowledge questions answerable without it.",
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID to query' },
                knowledgebase_name: { type: 'string', description: 'KB name (default: General)' },
                user_input: { type: 'string', description: 'The question to ask' },
                previous_interaction_id: { type: 'string', description: 'Interaction ID from a previous response to continue a conversation thread. Omit for the first message.' },
            },
            required: ['app_id', 'user_input'],
        },
    },
    {
        name: 'list_apps_for_community',
        description: 'List apps in a community',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: { community_id: { type: 'string', description: 'Community ID' } },
            required: ['community_id'],
        },
    },
    {
        name: 'find_communities',
        description: 'List available communities on the platform',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: { filter: { type: 'string', description: 'Optional filter string' } },
        },
    },
    {
        name: 'tell_me_how',
        description: 'Discover platform tools and services by asking a natural language question. Searches the service mesh for relevant capabilities; results include callable schemas and an invocation envelope. Call with scope "bootstrap" FIRST on a new session: it deterministically returns the platform summary, your caller context, credit balance, and the essential tools. Ask it in plain language to set up or onboard to DeSciX (e.g. "set up DeSciX", "help me get started") and it returns a structured setup playbook you can walk the user through. If results are empty, try scope "discovery" or rephrase.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                question: { type: 'string', description: 'What do you want to do? Required for every scope except "bootstrap".' },
                // WS-MVP-FIRSTCONTACT F3: 'bootstrap' = deterministic first-contact on-ramp
                // (no vector search). question becomes optional for that scope only; the
                // server still hard-requires it for project/entitlements/discovery.
                scope: { type: 'string', enum: ['bootstrap', 'project', 'entitlements', 'discovery'], description: '"bootstrap" = deterministic first-call on-ramp (platform summary + caller context + credit balance + essential tool schemas), "entitlements" = your purchased tools, "discovery" = all platform capabilities. Default: entitlements.' },
            },
        },
    },
    {
        name: 'resolve_invite',
        description: 'Resolve a DeSciX invite token into app configuration. Returns app context, community info, and the agent_hint authored by the app creator (skill level + goals).',
        mutating: false,
        // WS-MCP-SURFACE-SPLIT-EXEC §6.7 D6: this tool is NOT in the enforced
        // OAUTH_READONLY_TOOLS allow-list (oauthAsHandlers.js) — the oauthReadonly:true
        // advisory flag had drifted from the enforced policy and was removed to stop
        // implying enforcement that does not exist.
        inputSchema: {
            type: 'object',
            properties: { invite_token: { type: 'string', description: 'The invite token from .descix/app.json' } },
            required: ['invite_token'],
        },
    },
    {
        name: 'app_records_put',
        description: 'Use your app like a database: store/replace structured records with custom metadata in the app data plane (Firestore-backed, strongly consistent — NOT the Pinecone KB). Supply a human-meaningful file_id (grouping key) + optional chunk_idx (default 0); the composite id is built for you. Custom string/number/boolean/string[] fields become filterable metadata for app_records_query.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID (your app)' },
                kb_id: { type: 'string', description: 'Record collection ID (acts like a database table)' },
                records: { type: 'array', description: 'Records to upsert: [{ file_id (required), text?, chunk_idx? (default 0), ...customMetadata }]. Pass a full "id" only for back-compat.', items: { type: 'object' } },
            },
            required: ['app_id', 'kb_id', 'records'],
        },
    },
    {
        name: 'app_records_query',
        description: 'Query your app like a database: a STRUCTURED, metadata-filtered scan (NOT ANN/semantic) over the app data plane returning ALL records matching a predicate (e.g. type=episode AND show=X). Supports $eq/$in/$ne + field projection. STRONGLY CONSISTENT (read-after-write). Use ask_question_to_app for fuzzy semantic KB search.',
        mutating: false,
        // WS-MCP-SURFACE-SPLIT-EXEC §6.7 D6: this tool is NOT in the enforced
        // OAUTH_READONLY_TOOLS allow-list (oauthAsHandlers.js) — the oauthReadonly:true
        // advisory flag had drifted from the enforced policy and was removed to stop
        // implying enforcement that does not exist.
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID' },
                kb_id: { type: 'string', description: 'Record collection ID' },
                filter: { type: 'object', description: 'Metadata predicate, e.g. { "type": "episode", "show": { "$eq": "X" } }' },
                fields: { type: 'array', items: { type: 'string' }, description: 'Projection of metadata fields (omit or ["*"] for all)' },
                limit: { type: 'number', description: 'Max records (post-filter)' },
            },
            required: ['app_id', 'kb_id'],
        },
    },
    {
        name: 'app_records_get',
        description: 'Fetch specific records from your app data plane by id (point lookup) with an arbitrary metadata projection. Firestore-backed, strongly consistent.',
        mutating: false,
        // WS-MCP-SURFACE-SPLIT-EXEC §6.7 D6: this tool is NOT in the enforced
        // OAUTH_READONLY_TOOLS allow-list (oauthAsHandlers.js) — the oauthReadonly:true
        // advisory flag had drifted from the enforced policy and was removed to stop
        // implying enforcement that does not exist.
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID' },
                kb_id: { type: 'string', description: 'Record collection ID' },
                ids: { type: 'array', items: { type: 'string' }, description: 'Record ids to fetch' },
                fields: { type: 'array', items: { type: 'string' }, description: 'Projection of metadata fields (omit or ["*"] for all)' },
            },
            required: ['app_id', 'kb_id', 'ids'],
        },
    },
    {
        name: 'app_records_delete',
        description: 'Delete records from your app data plane by id (or by file_id grouping key). Firestore-backed.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID' },
                kb_id: { type: 'string', description: 'Record collection ID' },
                ids: { type: 'array', items: { type: 'string' }, description: 'Record ids to delete' },
                file_ids: { type: 'array', items: { type: 'string' }, description: 'file_id grouping keys to delete (deletes all records with each file_id)' },
            },
            required: ['app_id', 'kb_id'],
        },
    },
    {
        // WS-HEADLESS-MVP-A2 (CEO-D-2026-07-01 D2): platform-wide USD AI-credits balance.
        // Read-only; the METERED RAG/agent surface (WS-A3) debits this balance per call.
        // NEVER exposes pricing internals — USD balance figures only.
        name: 'get_credit_balance',
        description: 'Get your platform-wide AI-credits balance in USD. Metered AI calls (RAG chat / agents, e.g. ask_question_to_app and query_knowledge_base) debit this balance; buy credits with the descix CLI (`descix credits buy`) or the platform store. Programmatic purchase: create_stripe_checkout_session with purchase_type "ai_credits" and amount_usd returns a Stripe checkout URL.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        // WS-MCP-SURFACE-SPLIT-EXEC (CEO-D-2026-07-04 §6.3, D2): the DISCOVERY-CORE invoke gateway.
        // tell_me_how surfaces MESH-DISCOVERABLE commands (everything NOT in the handshake core);
        // this is how a client actually calls one without it being advertised at tools/list. It is a
        // thin passthrough into the SAME /apifront CommandHandler.invoke path — so EVERY existing
        // call-time gate (permission, credits, OAuth scope, service-account) applies to the TARGET
        // command exactly as if called directly. Nothing is bypassed.
        // mutating:true — a gateway that CAN reach mutating targets is itself classified mutating.
        // WS-FREEMIUM-ONRAMP FO-2 (doc c §2.5): it IS now admitted to the read-only OAuth SURFACE
        // (a read-scoped session may CALL the gateway — see MESH_INVOKE_GATEWAY_TOOLS below), but the
        // scope-aware dispatch gate in DeSciX_Cloud CommandHandler.invoke enforces that the re-entrant
        // TARGET command is read-only. The classification is about the tool; the gate is about the call.
        name: 'execute_remote_command',
        description:
            'Invoke a platform command discovered via tell_me_how that is NOT advertised in the ' +
            'handshake tool list (the MESH-DISCOVERABLE surface). Pass the exact command name and its ' +
            'params; the call runs through all normal permission, credit-metering and scope gates for ' +
            'that command — you can only do what you are already entitled to do. Use tell_me_how first ' +
            'to discover the command name and its parameters. Example: execute_remote_command({ command: ' +
            '"beast_get_dashboard", params: { ... } }).',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'The exact command name to invoke (as returned by tell_me_how).' },
                params: { type: 'object', description: "Parameters for the target command (its own inputSchema). Omit for no-arg commands." },
            },
            required: ['command'],
        },
    },
    {
        name: 'create_app_for_community',
        description:
            "Create a SUB-APP inside an existing community (registers Products + Firestore App doc + grants you the entitlement). " +
            "The unique app_id is COMPOSED SERVER-SIDE as {community_id}-{short_name} where community_id is the community's default app id (== its lowercased token symbol), e.g. community 'egpt' + short_name 'frqtl' => app_id 'egpt-frqtl'. " +
            "Pick a SHORT, lowercase short_name with NO hyphens ('-' is the reserved separator) — if omitted, app_name is used as the short name. " +
            "Fails loud if: the community does not exist in this environment (you must create the community first — an app without a materialized community is an invalid orphan), an app with the composed id already exists (pass overwrite:true to update it), or the short name contains '-' or other invalid characters. " +
            "Do NOT use this to create a community's DEFAULT app (app_id == community_id) — that is created by community-create. app_id stays opaque to routing; this only composes it at create time.",
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                community_id: { type: 'string', description: "Existing community id (== its default app id == lowercased token symbol). Must already be materialized in this env." },
                app_name: { type: 'string', description: 'Human-readable display name for the app.' },
                short_name: { type: 'string', description: "SHORT id segment used to compose the unique app_id {community_id}-{short_name}. Lowercase letters/digits/underscore, NO hyphens. Optional — defaults to app_name. Keep it short, e.g. 'frqtl'." },
                app_description: { type: 'string', description: 'Optional description.' },
                icon_url: { type: 'string', description: 'Optional icon URL.' },
                overwrite: { type: 'boolean', description: 'Set true to update an app whose composed id already exists (otherwise duplicate fails loud). Default false.' },
            },
            required: ['community_id', 'app_name'],
        },
    },
]);

/**
 * Tool definitions reduced to the bare { name, description, inputSchema } shape the MCP
 * tools/list protocol expects (strips the internal mutating/oauthReadonly classification).
 */
export function toMcpToolList(tools = NATIVE_MCP_TOOLS) {
    return tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

/** Names of native tools that self-declare mutating:true. */
export function mutatingNativeToolNames() {
    return NATIVE_MCP_TOOLS.filter(t => t.mutating === true).map(t => t.name);
}

/** EVP-recommended read-only tools for the security-owned OAuth allow-list (advisory). */
export function recommendedOAuthReadonlyToolNames() {
    return NATIVE_MCP_TOOLS.filter(t => t.mutating === false && t.oauthReadonly === true).map(t => t.name);
}

/**
 * DISCOVERY-CORE — the CEO-RATIFIED (CEO-D-2026-07-04-MCP-SURFACE-SPLIT-EXECUTION §3) set of tools
 * advertised at the MCP handshake (tools/list) for STANDARD callers. Everything else that is
 * registered + callable is MESH-DISCOVERABLE: reachable via tell_me_how + execute_remote_command but
 * NOT advertised at handshake, so a standard session pays ~1k tokens of catalog instead of ~8.7k.
 * The "8" of §3 is 8 CRITERIA ROWS; the mesh-health row names TWO tools (list_services +
 * service_health_check), so this is 9 tool NAMES. Membership is ratified — do NOT add/remove without
 * a CEO ruling. (execute_remote_command, list_services, service_health_check are advertised via
 * commandMeta mcp:true in DeSciX_Cloud; the other 6 live in NATIVE_MCP_TOOLS above.)
 */
export const DISCOVERY_CORE_TOOL_NAMES = Object.freeze([
    'tell_me_how',
    'execute_remote_command',
    'ask_question_to_app',
    'query_knowledge_base',
    'find_communities',
    'fetch_my_purchases',
    'get_credit_balance',
    'list_services',
    'service_health_check',
]);

/** True if `name` is in the ratified DISCOVERY-CORE handshake set. */
export function isDiscoveryCoreTool(name) {
    return DISCOVERY_CORE_TOOL_NAMES.includes(name);
}

/**
 * MESH-INVOKE GATEWAY tools (WS-FREEMIUM-ONRAMP FO-2, doc c §2.4/§2.5). These are mutating:true
 * tools that dispatch a DISCOVERED target command by re-entering CommandHandler.invoke (currently
 * only execute_remote_command). They are the ONE class admitted to the read-only OAuth surface
 * despite a mutating self-classification, because the scope-aware dispatch gate
 * (DeSciX_Cloud apiFront.js CommandHandler.invoke) fires again on the re-entrant TARGET — so a
 * read-scoped session can CALL the gateway but cannot dispatch a mutating target through it.
 *
 * SINGLE SOURCE so the two consumers never drift:
 *   - surface admission: DeSciX_Cloud oauthAsHandlers.js isToolAllowedForOAuth (exempts these from
 *     the MUTATING_TOOL_NAMES defense-in-depth),
 *   - dispatch exemption: DeSciX_Cloud apiFront.js invoke gate (does NOT treat the gateway call
 *     itself as a mutating dispatch; its inner re-entry is gated by construction).
 * Do NOT add a tool here without the matching re-entrant-invoke + inner-gate guarantee.
 */
export const MESH_INVOKE_GATEWAY_TOOLS = Object.freeze(['execute_remote_command']);

/** True if `name` is a mesh-invoke gateway tool (admitted-despite-mutating; dispatch-gated by re-entry). */
export function isMeshInvokeGatewayTool(name) {
    return MESH_INVOKE_GATEWAY_TOOLS.includes(name);
}
