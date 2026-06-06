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
        description: 'Search a knowledge base using vector similarity (returns raw chunks)',
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
        description: "Ask an AI-powered question to an app's knowledge base using RAG. Supports conversation threading via previous_interaction_id — pass the interaction_id from the previous response to continue a conversation.",
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
        description: 'Discover platform tools and services by asking a natural language question. Searches the service mesh for relevant capabilities. If results are empty, try scope "discovery" or rephrase.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                question: { type: 'string', description: 'What do you want to do?' },
                scope: { type: 'string', enum: ['project', 'entitlements', 'discovery'], description: '"entitlements" = your purchased tools, "discovery" = all platform capabilities. Default: entitlements.' },
            },
            required: ['question'],
        },
    },
    {
        name: 'resolve_invite',
        description: 'Resolve a DeSciX invite token into app configuration. Returns app context, community info, and the agent_hint authored by the app creator (skill level + goals).',
        mutating: false,
        oauthReadonly: true,
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
        oauthReadonly: true,
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
        oauthReadonly: true,
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
