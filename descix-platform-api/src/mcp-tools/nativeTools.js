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
 * LEAF MODULE — INFRASTRUCTURE-FREE BY DESIGN:
 *   This file pulls in NO infrastructure (no cloud-core, no googleapis, no GCP client). It
 *   is pure data so the thin CLI stdio server can import it via the
 *   '@descix/platform-api/mcp-tools' subpath WITHOUT dragging GCP infrastructure into the
 *   CLI process.
 *   The ONLY imports permitted here are other PURE, ZERO-IMPORT LEAVES in this same
 *   directory (today: chatMedia.js), and only so a schema can be BUILT FROM the contract it
 *   advertises instead of restating it — a hand-restated schema is the schema-mirror drift
 *   the engineering-culture mandate forbids, and it drifts silently. Anything that reaches
 *   for a network, a filesystem or a cloud SDK does not belong in this import list.
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

import { mediaParamSchema } from './chatMedia.js';
// RESIDUAL 16 — the filter contract sentence is GENERATED from the operator vocabulary,
// never typed here. A description that names operators by hand drifts off the evaluator
// the first time one is added; records-query-counts-contract.test.js makes that a CI failure.
import { filterOperatorClause, SCALAR_FILTER_OPERATORS, ARRAY_FILTER_OPERATORS } from './recordFilter.js';
// The coordination fabric's vocabulary, from its ONE owner. Every fabric_* enum and every numeric
// default below is INTERPOLATED from these exports rather than retyped: the enum a caller is shown
// here and the enum DeSciX_Cloud's fabricStore.js accepts must be the same list, or a caller is
// refused against a contract it was never given. `fabric-vocabulary-conformance.test.js` fails CI
// if any schema enum below stops deep-equalling its source. ../fabric/vocab.js is a pure,
// zero-import leaf, so this import respects the infrastructure-free rule above.
import {
    BEAT_STATUSES, LEGACY_WORKING_STATUSES, LEGACY_STOP_STATUSES, LIVENESS_VALUES,
    WRITE_MODES, WATERMARK_FIELDS, ENVELOPE_STATUSES, ENVELOPE_STATUS_DEFAULT, TO_AGENT_SENTINELS,
    ENVELOPE_SECTIONS, ENVELOPE_PHASES, ENVELOPE_PHASE_DEFAULT, ENVELOPE_PHASE_TRANSITIONS,
    FABRIC_RECORD_KINDS,
    RETIRED_SENTINELS, BEAT_CLOCK_FIELDS, beatClockFieldFor, beatClockAgeField,
    LIVENESS_MODEL, LIVENESS_PROCESS,
} from '../fabric/vocab.js';

/**
 * The beat-clock pair, as prose, INTERPOLATED from the vocabulary's table — never hand-typed.
 *
 * Two tool descriptions state this contract (the writer's and the reader's) and two hand-typed
 * copies drift the moment the table does. The field NAMES come out of BEAT_CLOCK_FIELDS, so
 * renaming a clock in the vocabulary renames it in everything a caller is shown.
 */
const BEAT_CLOCK_RULE = 'THE CLOCK PAIR: '
    + BEAT_CLOCK_FIELDS.map((f) => `\`${f.field}\` (set by a "${f.written_by}" beat, PRESERVED by a "${f.preserved_by}" beat) — ${f.meaning}`).join(' ')
    + ' Two writers share this ONE record — an agent and the plugin\'s doorbell hook — so ONE shared field could not hold both facts: the hook beats ~15x more often, its value was always the current one, and every correctly-armed seat read UNDETERMINED (measured 2026-08-24T21:37Z). Each writer now has its OWN clock and neither touches the other\'s. Both are FLAT record fields, so a raw reader may name them in a `fields` projection.';

/**
 * The three-probe seat-existence rule, in ONE string, because three tool descriptions state it and
 * three hand-typed copies of a rule drift the moment the rule does. The rule itself lives in
 * `fabricStore.resolveSeat`; this is the prose the caller is shown, and it must not describe a
 * narrower test than the server actually runs. It DID: two descriptions said "must resolve against
 * the live seat-name roster", which is only probe A — and probe A alone was measured refusing a
 * live, working, addressed seat (heartbeat-JARVIS-FRAQTL-4fa842fb) its own mail.
 */
const SEAT_RESOLUTION_RULE =
    'Resolved by THREE probes and refused only when all three miss: a seat-name roster record, OR a '
    + 'heartbeat under the label, OR any record already addressed to it. The roster alone is NOT the '
    + 'test — a live, working, addressed seat with no roster record resolves.';

export const NATIVE_MCP_TOOLS = Object.freeze([
    {
        name: 'query_knowledge_base',
        description: 'Vector-similarity search over a DeSciX knowledge base, returning raw source chunks with dereferenceable citations. ' +
            'Use it when the user wants primary-source passages, citations, or evidence from DeSciX research/community content, ' +
            'to ground or check an ask_question_to_app answer, or to pull the exact source behind a claim before contesting it. ' +
            'Proof chains can run deep — keep retrieving cited steps rather than predicting them. ' +
            'Scope to a single source with file_filter. ' +
            'RETRIEVAL vs ANSWER: this tool RETRIEVES (raw chunks, no model synthesis, no conversation thread); ' +
            'ask_question_to_app ANSWERS (synthesized, cited, stateful). Reach for this one when you intend to read and judge the sources yourself. ' +
            'PARAMETER NAMING: this tool names the knowledge base `kb_id`/`kb_ids`; ask_question_to_app names the SAME concept ' +
            '`knowledgebase_name`/`knowledgebase_names`. They are not interchangeable — passing the other tool\'s name is now REJECTED, not ignored.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID' },
                kb_id: { type: 'string', description: 'KB name (default: General)' },
                kb_ids: { type: 'array', items: { type: 'string' }, description: 'Optional: search several of the app\'s knowledge bases at once — the top chunks are pooled from all of them. Takes precedence over kb_id when both are given; a single "*" element searches every KB in the app.' },
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Max results (default: 5)' },
                file_filter: { type: 'string', description: 'Optional: restrict the search to ONE source document. Takes the retrievable file id a citation exposes as file_path (e.g. "corpus:3e1d5aa3"), not the human-readable file_name — applied as an exact metadata match. This is the param the read_command on every citation supplies.' },
            },
            required: ['app_id', 'query'],
        },
    },
    {
        name: 'ask_question_to_app',
        description: "Ask a natural-language research question against a DeSciX app/community knowledge base (RAG) and get a synthesized, citable answer drawn from that community's own sources. " +
            "Use it as a primary research source whenever the user asks about decentralized science, open science, decentralized IP, or a specific DeSciX community (e.g. DAITA, EGPT) — including when the user has not named DeSciX but the question falls in these domains. " +
            "It retrieves and cites the community's material rather than answering from general memory. " +
            "Conversations are stateful: pass the interaction_id returned by the previous response as previous_interaction_id and the app remembers the earlier turns — you do NOT resend the transcript. " +
            "Do not use it for general-knowledge questions answerable without it. " +
            "ANSWER vs RETRIEVAL: this tool ANSWERS (model-synthesized over the app's own sources, cited, stateful); " +
            "query_knowledge_base RETRIEVES (raw chunks, no synthesis, stateless). Use that one to check or ground an answer from this one. " +
            "PARAMETER NAMING: name the knowledge base with `knowledgebase_name` (or `knowledgebase_names` for several). " +
            "`kb_id` is query_knowledge_base's name for the same concept and is NOT accepted here — it is now REJECTED with a suggestion rather than silently ignored. " +
            "Omit the KB entirely to use the app's configured default KB.",
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID to query' },
                knowledgebase_name: { type: 'string', description: 'KB name (default: General)' },
                knowledgebase_names: { type: 'array', items: { type: 'string' }, description: 'Optional: draw the answer from several of the app\'s knowledge bases fused together in one call. The FIRST name is the primary KB whose voice and model settings shape the reply. Takes precedence over knowledgebase_name when both are given; a single "*" element means every KB in the app.' },
                user_input: { type: 'string', description: 'The question to ask' },
                previous_interaction_id: { type: 'string', description: 'The interaction_id returned by a previous response, to continue that conversation thread with full server-side memory of the earlier turns. Omit for the first message. It is scoped to the authenticated caller and is rejected if it belongs to someone else or has expired — on rejection, start a fresh thread by omitting it.' },
                // ws-mcp-surface-basics (CEO-D-2026-08-14, FLAG-1 ruling): the schema IS the
                // self-describing feed into MCP, so an under-declared contract is the bug — not
                // the caller who passes a param the command genuinely honors. Every property
                // below is read by the handler (ragCommands.js ask_question_to_app destructures
                // the generation knobs; communityManagement.js prepare_chat_context reads the
                // document-scoping ones). Declared so strict validation admits them.
                intelligence_level: { type: 'number', description: 'Intelligence level 1-5 selecting the model tier. Omit to inherit: KB intelligence_level, then the platform default. Higher levels cost more AI credits.' },
                model: { type: 'string', description: 'Explicit model name, overriding the whole inheritance chain (level -> KB override -> app default -> platform default). Prefer intelligence_level unless you need one specific model.' },
                thinking_budget: { type: 'number', description: 'Thinking-token budget: -1 dynamic, 0 off, N a fixed cap. Omit to inherit the KB/platform default.' },
                temperature: { type: 'number', description: 'Generation temperature override. Omit to inherit the KB/platform default.' },
                max_output_tokens: { type: 'number', description: 'Cap on generated tokens for this call. Omit to inherit the KB/platform default.' },
                streaming: { type: 'boolean', description: 'Stream the reply instead of returning it whole. Leave unset/false over MCP tools/call, which returns a single result — this exists for the streaming transports (PWA/Discord).' },
                file_id: { type: 'string', description: 'Scope the answer to ONE source document by its file_id (as returned in a citation). Use it to ask follow-up questions against a specific paper or record.' },
                ipdoc_file_id: { type: 'string', description: 'Scope to a specific IPDoc by file_id. Takes precedence over file_id when both are given.' },
                doc_ids: { type: 'array', items: { type: 'string' }, description: 'Additional document ids whose full contents are added to this call\'s context (beyond what vector retrieval selects).' },
                // ws-chat-multimodal-image-attach: images/video the model actually LOOKS AT.
                // The schema fragment is BUILT from the chatMedia contract (kinds, MIME
                // vocabulary, byte caps) rather than restated here — one owner for the
                // advertised contract and the enforced policy, so the two cannot drift.
                media: mediaParamSchema(),
                // ws-c3-librarian: a WORKSTREAM is a conversational room (the Discord room model
                // generalised), so its thread owner is SERVER-derived from the id the caller
                // names — never from a caller-supplied owner, which apiFront still strips.
                workstream_id: { type: 'string', description: "The workstream this question belongs to. When present, the answer runs on a thread OWNED BY THAT WORKSTREAM rather than by the calling user: the server derives the thread owner as roomThreadKey({surface:'workstream', room_id:workstream_id, app_id}) - e.g. 'unk-beast:workstream-ws-c3-librarian' - and stores continuity server-side in the InteractionRooms collection. Send the SAME workstream_id every turn and omit previous_interaction_id; the response's interaction_id is an ECHO for observability, not a handle to resend. A workstream thread is SHARED BY DESIGN: every caller naming the same workstream on the same app continues the same conversation. It is NOT a private per-user conversation and carries no per-user privacy property. A client-supplied interaction_owner_id remains stripped at the door and is not a substitute for this param." },
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
        // R5 (CEO-D-2026-07-14 disambiguation): this lists ONLY LISTED communities for a normal
        // caller (the app store). "Listed" is the ACCESS sense (a separate `tradeable` boolean owns
        // token-tradeability — the old `is_public` conflated them). Non-listed communities you own
        // or that are shared with you remain reachable via fetch_my_purchases. The `listed` filter is
        // enforced server-side in the Cloud handler; admin callers see all.
        description: 'List the communities listed in the app store. Communities you own or that are shared with you are reachable via fetch_my_purchases even when they are not listed.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: { filter: { type: 'string', description: 'Optional filter string' } },
        },
    },
    {
        name: 'tell_me_how',
        description: 'Discover platform tools and services by asking a natural language question. Searches the service mesh for relevant capabilities; results include callable schemas and an invocation envelope. Call with scope "bootstrap" FIRST on a new session: it deterministically returns the platform summary, your caller context, credit balance, and the essential tools. Ask it in plain language to set up or onboard to DeSciX (e.g. "set up DeSciX", "help me get started") and it returns a structured setup playbook you can walk the user through. Asking about a SPECIFIC app or community? Pass project_context with its ids and scope "project" — the vector search is restricted to them. Asking how to BUILD ON or reproduce an app (npm package, artifact pages, notebooks, runnable benchmarks)? Use scope "artifact", which answers deterministically from the app registry with no vector search. If results are empty, try scope "discovery" or rephrase.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                question: { type: 'string', description: 'What do you want to do? Required for every scope except "bootstrap".' },
                // WS-MVP-FIRSTCONTACT F3: 'bootstrap' = deterministic first-contact on-ramp
                // (no vector search). question becomes optional for that scope only; the
                // server still hard-requires it for project/entitlements/discovery.
                //
                // THE ENUM IS THE CONTRACT AND IT MUST MATCH THE HANDLER. Measured on dev
                // 2026-08-18, three hand-maintained copies of this list disagreed three ways
                // (handler 6 scopes, this enum 4, the CLI 3), and the disagreement was not
                // cosmetic: 'project' was advertised here while `project_context` was ABSENT from
                // properties, so the param guard — which derives its accepted set from
                // Object.keys(inputSchema.properties) — rejected the one parameter the scope
                // requires. Every caller selecting it got an unconditional error from every
                // surface. Meanwhile 'artifact' WORKED and was undiscoverable. Adding a scope
                // here without its parameters ships a capability nobody can reach.
                //
                // 'admin' is DELIBERATELY EXCLUDED, not forgotten: it is fail-closed to
                // platform-admins (communityCommands tell_me_how returns ADMIN_REQUIRED to
                // everyone else), so advertising it to every external caller would only publish a
                // door none of them can open.
                scope: {
                    type: 'string',
                    enum: ['bootstrap', 'artifact', 'project', 'entitlements', 'discovery'],
                    description: '"bootstrap" = deterministic first-call on-ramp (platform summary + caller context + credit balance + essential tool schemas), "artifact" = deterministic build/reproduce provenance for published apps (npm package + spec, jsdelivr artifact and notebook URLs, runnable npx commands) with no vector search, "project" = restrict the search to the communities/apps named in project_context, "entitlements" = your purchased tools, "discovery" = all platform capabilities. Default: entitlements.',
                },
                // OPT-IN, default OMITTED. `context` is the concatenated raw text of every
                // matched service doc — measured 18,299 B of a 52,409 B reply (35%), duplicating
                // in prose the same information the structured recommended_tools rows already
                // carry. A discovery call should not spend a third of its payload on that unless
                // the caller asks. Declared here for the same reason as project_context: the
                // gateway guard accepts exactly the keys this bag names.
                include_context: {
                    type: 'boolean',
                    description: 'Include the raw concatenated service-documentation text the answer was drawn from. Default false — the structured recommended_tools rows carry the same information in a form you can act on. Set true when you want the underlying prose to quote or verify against.',
                },
                // REQUIRED by scope 'project' — and it must be declared HERE, because the
                // gateway param guard accepts exactly the keys this properties bag names.
                project_context: {
                    type: 'object',
                    description: 'Scope the search to specific communities/apps. Required when scope is "project"; ignored otherwise. Supply at least one non-empty list.',
                    properties: {
                        community_ids: { type: 'array', items: { type: 'string' }, description: 'Community ids to restrict the search to, e.g. ["egpt"].' },
                        app_ids: { type: 'array', items: { type: 'string' }, description: 'App ids to restrict the search to, e.g. ["egpt-godsworld"].' },
                    },
                },
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
        description: 'Use your app like a database: store/replace structured records with custom metadata in the app data plane (Firestore-backed, strongly consistent — NOT the Pinecone KB). Supply a human-meaningful file_id (grouping key) + optional chunk_idx (default 0); the composite id is built for you. Custom string/number/boolean/string[] fields become filterable metadata for app_records_query (a string[] field is filtered with ' + ARRAY_FILTER_OPERATORS[0] + ', not with equality). Pass mode:"create" for an atomic first-claim-wins conditional create (answers claimed:true / claimed:false + current_holder_hint instead of overwriting). Records under a "lease-" key are holder-verified server-side. TIME: every record is stamped with a server-authoritative received_at — the store\'s own UTC clock at the moment it accepted the write, re-stamped on EVERY write including a merge-upsert of an existing key. It is server-owned: a client-supplied received_at is stripped and replaced, so do not send one. Any created_at you send is ordinary client-asserted metadata with no more authority than text — the store neither validates nor corrects it.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                app_id: { type: 'string', description: 'App ID (your app)' },
                kb_id: { type: 'string', description: 'Record collection ID (acts like a database table)' },
                records: { type: 'array', description: 'Records to upsert: [{ file_id (required), text?, chunk_idx? (default 0), ...customMetadata }]. Pass a full "id" only for back-compat.', items: { type: 'object' } },
                mode: {
                    type: 'string',
                    enum: ['upsert', 'create'],
                    description: '"upsert" (default) merge-writes, last writer wins. "create" is a CONDITIONAL CREATE: atomic and all-or-nothing — every key must be unclaimed, and if any exists nothing is written and the response is { success:false, claimed:false, current_holder_hint, conflicts }. Use it to elect a single holder of a named resource (lease, seat, idempotency key). Capped at 450 records per call.',
                },
            },
            required: ['app_id', 'kb_id', 'records'],
        },
    },
    {
        name: 'app_records_query',
        description: 'Query your app like a database: a STRUCTURED, metadata-filtered scan (NOT ANN/semantic) over the app data plane returning ALL records matching a predicate (e.g. type=episode AND show=X). ' + filterOperatorClause() + ' STRONGLY CONSISTENT (read-after-write). Use ask_question_to_app for fuzzy semantic KB search. RESPONSE COUNTS are three DIFFERENT facts, so count <= matched <= scanned always: `scanned` = how many records the collection holds in total, BEFORE your filter (the denominator); `matched` = how many satisfied your filter, before `limit`; `count` = how many are in `records` (matched, capped by `limit`); `truncated` = boolean, true exactly when `count` < `matched`, i.e. `limit` CUT the match set and this reply does NOT carry every record that matched — raise `limit` (or narrow the filter) to see the rest. This lets you tell the two zero cases apart: matched:0 with scanned:0 means the COLLECTION IS EMPTY, while matched:0 with scanned:40 means YOUR PREDICATE MATCHED NOTHING (check the field name) — do not read a zero as evidence of an empty collection. TIME: returned records carry received_at, stamped by the store\'s own UTC clock when it accepted the write and therefore unforgeable by the record\'s author. Decide STALENESS and ORDERING on received_at. A created_at field, where present, is a claim made by whoever wrote the record — it is never validated, so it may be wrong or even in the future.',
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
                filter: { type: 'object', description: `Metadata predicate. Scalar fields: ${SCALAR_FILTER_OPERATORS.join('/')} or a bare value; ARRAY fields: ${ARRAY_FILTER_OPERATORS[0]} (membership). e.g. { "type": "episode", "show": { "$eq": "X" }, "tags": { "${ARRAY_FILTER_OPERATORS[0]}": "handoff" } }` },
                fields: { type: 'array', items: { type: 'string' }, description: 'Projection of metadata fields (omit or ["*"] for all)' },
                limit: { type: 'number', description: 'Max records (post-filter)' },
            },
            required: ['app_id', 'kb_id'],
        },
    },
    {
        name: 'app_records_get',
        description: 'Fetch specific records from your app data plane by id (or by file_id grouping key — id == file_id in this store) with an arbitrary metadata projection. Firestore-backed, strongly consistent. Supply at least one of ids/file_ids. TIME: returned records carry received_at, stamped by the store\'s own UTC clock when it accepted the write and therefore unforgeable by the record\'s author — read it for staleness and ordering. A created_at field, where present, is the author\'s own unvalidated claim. Note that a projection via `fields` drops received_at unless you ask for it.',
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
                file_ids: { type: 'array', items: { type: 'string' }, description: 'file_id grouping keys to fetch (id == file_id in this store)' },
                fields: { type: 'array', items: { type: 'string' }, description: 'Projection of metadata fields (omit or ["*"] for all)' },
            },
            // `ids` is NOT in required, exactly as on app_records_delete: either ids or file_ids
            // satisfies this call, which plain JSON-Schema `required` cannot express. The handler
            // (appDataStore.getRecords) is the authority and refuses "neither supplied" loudly,
            // naming both params. Requiring `ids` here would reject the file_ids-only call this
            // schema exists to legalize.
            required: ['app_id', 'kb_id'],
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
    // ─────────────────────────────────────────────────────────────────────────────────────────
    // COORDINATION FABRIC — typed verbs over the app-records collection egpt-frqtl/coordination.
    //
    // These exist because every rule that keeps the fabric coherent used to live CLIENT-side in
    // the unkamon-beast plugin's PreToolUse guard: the CLI bypassed it entirely, and it was a
    // second derivation of the store's semantics. The rules are now server-side and hold on every
    // transport. Server implementation: DeSciX_Cloud microservice/services/fabricStore.js;
    // vocabulary: descix-platform-api/src/fabric/vocab.js. Contract: docs/design/coordination-fabric-contract-2026-08-24.md.
    //
    // THREE TRAPS EVERY DESCRIPTION BELOW RESTATES, because a caller who does not know them
    // writes something that succeeds and is never read:
    //   · `received_at` is SERVER-stamped and unforgeable; `created_at` on an ordinary record is
    //     caller-asserted and never validated. Every liveness and ordering decision uses received_at.
    //   · No fabric_* verb accepts app_id/kb_id (the fabric is ONE collection by contract) or
    //     `fields` (a projection silently drops received_at).
    //   · A BROADCAST IS NEVER FLIPPED to read — its status is shared across every seat.
    // ─────────────────────────────────────────────────────────────────────────────────────────
    {
        name: 'fabric_beat',
        description: 'Write this seat\'s coordination heartbeat — liveness as ONE fact with ONE write. The key is DERIVED by the server as "heartbeat-<seat_label>-<session8>"; a client-supplied file_id/key is REFUSED, because three key shapes coexist on the live fabric from callers choosing their own and one session was measured publishing two labels with contradictory statuses. The clock is the SERVER\'s (`occurred_at`): a caller-supplied created_at/occurred_at/received_at is REFUSED, not ignored — beats were measured stale by 44 and 658 minutes and one 41 minutes in the FUTURE, all stamped fresh by the store. `status` is a CLOSED ENUM: '
            + BEAT_STATUSES.join(', ')
            + '. "unread" and "broadcast" are refused BY NAME for the inbox collision they cause (a live heartbeat has sat unread in its master\'s inbox for 35 hours and its seat is dead, so nothing will ever clear it). `liveness` is REQUIRED and says WHO wrote this beat — an agent ("'
            + LIVENESS_VALUES[0] + '") or a hook ("' + LIVENESS_VALUES[1]
            + '"). It is written on every beat and never inherited: a hook beating on a dead model is a mask that reports health while nobody is home. It says WHO WROTE LAST and is NOT the model\'s clock. '
            + BEAT_CLOCK_RULE
            + ' `wake` is MANDATORY on a working beat as much as a resting one — without it "I am still going" is unfalsifiable and a seat goes dark while looking busy; wake_overdue:true comes back when your own next_fire_at has already passed. Returns unchanged:true when the beat is identical to the stored one. Does NOT renew a BEAST seat and takes no seat_token: renewal binds to the authenticated caller under ws-seat-session-bound-auth.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                seat_label: { type: 'string', description: 'The seat LABEL this session answers to (the CEO-given name it beats under).' },
                session_id: { type: 'string', description: 'This session id. Normalized to its bare first 8 characters; a "seat-" prefix is stripped and the response reports the normalization.' },
                status: { type: 'string', enum: [...BEAT_STATUSES], description: 'Closed liveness enum. Legacy values (' + [...LEGACY_WORKING_STATUSES, ...LEGACY_STOP_STATUSES].join(', ') + ') are still READABLE on old records but are no longer writable.' },
                liveness: { type: 'string', enum: [...LIVENESS_VALUES], description: 'REQUIRED, no default and never inherited. "' + LIVENESS_MODEL + '" = an AGENT wrote this beat (proves the model is alive) and stamps `' + beatClockFieldFor(LIVENESS_MODEL) + '`. "' + LIVENESS_PROCESS + '" = a HOOK wrote it (proves the process is alive, says NOTHING about the model) and stamps `' + beatClockFieldFor(LIVENESS_PROCESS) + '` while PRESERVING `' + beatClockFieldFor(LIVENESS_MODEL) + '`. Omitting it is refused rather than defaulted, because a merge-upsert would silently keep the previous writer\'s value.' },
                wake: {
                    type: 'object',
                    description: 'REQUIRED on EVERY beat, working or resting. What will wake this seat, whether that survives the process dying, and when it next fires.',
                    properties: {
                        mechanism: { type: 'string', description: 'What will wake this seat (e.g. "ScheduleWakeup", "Monitor ticker", "cron").' },
                        survives_death: { type: 'boolean', description: 'Does the wake mechanism outlive this process? A boolean, not a string.' },
                        next_fire_at: { type: 'string', description: 'ISO-8601 instant the wake next fires. A past value returns wake_overdue:true — the seat is alive while its wake chain is dead.' },
                    },
                    required: ['mechanism', 'survives_death', 'next_fire_at'],
                },
                text: { type: 'string', description: 'Optional one-line note about what this seat is doing.' },
                workstream_id: { type: 'string', description: 'Optional workstream this seat is working. This is where a workstream id belongs — never in to_agent.' },
                to_agent: { type: 'string', description: 'Optional master to address the beat to. Must be a seat LABEL or a sentinel (' + TO_AGENT_SENTINELS.join(', ') + '). ' + RETIRED_SENTINELS.join(' and ') + ' are REFUSED: no sweep has ever composed either, so a beat addressed to one was written and read by nobody. Address the master by its seat LABEL — read the current holder with beast_seat_read {seat_id:"org"}; a label names a holder and holders change, so no label is hard-coded here.' },
                extra: { type: 'object', description: 'Optional additional flat metadata. A key this verb owns is refused rather than silently overwritten.' },
            },
            required: ['seat_label', 'session_id', 'status', 'liveness', 'wake'],
        },
    },
    {
        name: 'fabric_liveness',
        description: 'Read a seat\'s liveness, judged on the SERVER clock. This is the repo-less liveness read: no checkout, no shell and no CLI, so it works from claude.ai / Cowork where a hook-based check has none of those. Returns verdict alive | stale | declared-stop | none, plus `' + beatClockAgeField(beatClockFieldFor(LIVENESS_MODEL)) + '` — the age of the clock the verdict was judged on, NAMED for that clock, so the age and the verdict beside it can never be two different facts. EVERY age on this response is named for the clock it measures; there is no un-named age field, so no consumer can hold a duration without knowing which clock produced it. Every other clock is reported for diagnosis and decides nothing — `' + beatClockAgeField(beatClockFieldFor(LIVENESS_PROCESS)) + '` (how long ago a HOOK beat) and `received_at_age_seconds` (when this RECORD last moved, which on a two-writer key is the hook\'s cadence). None of them is the caller-asserted created_at, which is unvalidated and is exactly what blinds a staleness sweep to the worst-maintained seats. A seat with no beat returns verdict "none", NOT an error. Runs three probes (the composed key, holder_session, and a bounded key-prefix census) and reports every disagreement between them in `defects[]` rather than silently picking a winner — that is how key sprawl and a missing holder_session are surfaced instead of hidden. Also answers the WAKE WATCHDOG without a second call: `wake_next_fire_at` and `wake_overdue` come back on every read, so "this seat says it is alive while its wake chain is already dead" is one question with one answer. THE MODEL VERDICT IS JUDGED ON `' + beatClockFieldFor(LIVENESS_MODEL) + '` AND ON NOTHING ELSE — `judged_on` says so on every response. It is NOT judged on `liveness` (which says only who wrote LAST, and the hook writes ~15x more often, so judging on it read UNDETERMINED for every correctly-armed seat) and NOT on the record\'s `received_at` (which a process beat refreshes — the mask). '
            + BEAT_CLOCK_RULE
            + ' `liveness` still reports WHO wrote the freshest beat and is null on a pre-contract record that carried none, which is UNKNOWN and never assumed to be an agent. A seat whose hook is beating while its agent is long gone therefore reads STALE, which is the whole point. threshold_s defaults to the platform value returned in the response.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                session_id: { type: 'string', description: 'The session to read. Supply this and/or label.' },
                seat_label: { type: 'string', description: 'The seat label to read. Supply this and/or session_id.' },
                threshold_s: { type: 'number', description: 'Seconds after which a beat counts as stale. Omit for the platform default (returned as threshold_s).' },
            },
        },
    },
    {
        name: 'fabric_inbox_sweep',
        description: 'THE canonical inbox sweep — what is waiting for this seat. Takes a SEAT, not a filter: the server composes to_agent IN [label, seat-<session8>, all, ALL] and status IN [unread, broadcast], and NEVER a type predicate. A caller-supplied `type` or `filter` is REFUSED — there is no parameter in which to express one, so the type-pinned sweep is structurally unreachable (measured: a hand-back filed as type "handback" was correctly addressed, correctly unread, and invisible for four days; sixteen type values are in live use and one record carries none at all, so no allow-list can be correct). `selector_applied` echoes what the server ACTUALLY used, so you never have to trust the query you believe you sent. Returns `matched` only — no bare `count`, because under limit:1 a dropped filter still reports count:1 and looks like a filtered result. WHEN THE CAP BITES YOU GET THE NEWEST N, delivered oldest-first, with truncated:true and order:"received_at asc": taking the oldest page instead made an inbox above the cap permanently unable to reach its newest mail, and nothing on the response distinguished a capped page from a complete inbox. `census_truncated` says whether the bounded scan that resolved your seat was clipped. When matched is 0 an `empty_reason` is ALWAYS present: "no_unread" means the seat resolves and its inbox is genuinely empty. An unresolvable label is a REFUSAL (unknown_seat), never an empty list — "no mail" and "no such seat" are different answers. Every record comes back WITH received_at; there is no projection parameter, because a projection silently drops the only clock a sender cannot forge. The seat\'s watermark ledger is returned alongside so a secretary can subtract what it already handed up without a second call.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                seat_label: { type: 'string', description: 'This seat\'s LABEL. ' + SEAT_RESOLUTION_RULE + ' An unresolvable label is refused (unknown_seat) rather than answered with an empty inbox.' },
                session_id: { type: 'string', description: 'Optional session id, so mail addressed to "seat-<session8>" is included.' },
                include_broadcasts: { type: 'boolean', description: 'Include org-wide broadcasts (default true). Set false for 1:1 mail only.' },
                since_received_at: { type: 'string', description: 'ISO-8601 floor on the SERVER-stamped received_at. Only records the store accepted after this instant are returned — the way to stop re-reading the whole broadcast set on every sweep.' },
                limit: { type: 'number', description: 'Maximum records to return; must be >= 1. Omit for the server default, which is returned as `limit_applied`. `matched` is the true pre-limit size. 0 is REFUSED — it read as "no cap", which is the opposite of what a caller asking for zero records means.' },
            },
            required: ['seat_label'],
        },
    },
    {
        name: 'fabric_msg_send',
        description: 'Send an addressed 1:1 message on the coordination fabric. `to` is RESOLVED BEFORE THE WRITE by three probes — a seat-name roster record, a heartbeat under the label, or any record already addressed to it — and refused only when all three miss: an unresolvable recipient is REFUSED and the roster is returned, because today a message to a misspelled or retired label is accepted and read by nobody — the sender sees success and no party downstream can detect the miss. The key and clock are server-derived ("msg-<TO>-<stamp>-<FROM>-<subject>", plus a "-<n>" discriminator if that key is already taken), so the filename-safe-vs-ISO split stops being your problem; a client-supplied key, status, created_at or received_at is REFUSED. THE WRITE IS A CONDITIONAL CREATE, NEVER AN UPSERT: the key stamp is second-resolution, so two messages from one seat to one seat on one subject inside one second used to collide and SILENTLY OVERWRITE — the first message destroyed and the send still reporting success. Now a colliding key carrying a DIFFERENT message is discriminated (both survive, and key_discriminated:true says so), while an IDENTICAL re-send is refused with FABRIC_DUPLICATE_MESSAGE naming the existing key and its status — so a retry tells you the first send landed instead of duplicating mail the recipient must triage. BROADCAST IS A DIFFERENT VERB: to:"all" is refused by name pointing at fabric_broadcast_send, rather than silently becoming org-wide state that no reader may ever clear. Takes no app_id/kb_id — which is the point: app_records_put and beast_rag_ingest both accept those and a name like "unk-beast/Org" addresses a real store in EACH, so a wrong-plane write returns success and is never read.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                from_seat: { type: 'string', description: 'The sending seat\'s LABEL.' },
                to: { type: 'string', description: 'Recipient seat LABEL. ' + SEAT_RESOLUTION_RULE + ' An unresolvable recipient is refused WITH the roster. "all"/"ALL" is refused (use fabric_broadcast_send), as is a "ws-*" workstream id or a bare role name.' },
                subject: { type: 'string', description: 'Short subject; also the human-readable tail of the key. Normalized to lowercase alphanumerics and dashes.' },
                body: { type: 'string', description: 'The message body. A message is a signal, not an archive — one carrying a decision should point at the record or doc that holds it.' },
                workstream_id: { type: 'string', description: 'Optional workstream this message concerns.' },
                thread_id: { type: 'string', description: 'Optional thread to attach this message to. Defaults to the message\'s own key, so every message belongs to exactly one closable thread.' },
                type: { type: 'string', description: 'Optional payload classifier (default "message"). NEVER used for delivery — the recipient\'s sweep does not filter on it.' },
                extra: { type: 'object', description: 'Optional additional flat metadata.' },
            },
            required: ['from_seat', 'to', 'subject', 'body'],
        },
    },
    {
        name: 'fabric_msg_ack',
        description: 'Acknowledge a 1:1 fabric message — flips unread to read ON THE RECORD, which is where 1:1 delivery state belongs so both sender and recipient read one fact, consistent across machines. REFUSES a BROADCAST by name: a broadcast\'s status is SHARED and immutable, so flipping it would silence that record for every other seat on the fabric (measured 2026-08-09) — the refusal names fabric_broadcast_ack instead. Also refuses a record addressed to a different seat: acking another seat\'s mail is a delivery it never received and cannot detect. Reports what CHANGED, not what was asked: `flipped` is true only when this call actually moved the record, and an already-read record returns flipped:false with a reason rather than a success shaped like a delivery.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                key: { type: 'string', description: 'The record key to ack (from fabric_inbox_sweep).' },
                seat_label: { type: 'string', description: 'The LABEL of the seat acking it. Must match the record\'s to_agent.' },
                session_id: { type: 'string', description: 'Optional session id, so mail addressed to "seat-<session8>" can be acked by its holder.' },
            },
            required: ['key', 'seat_label'],
        },
    },
    {
        name: 'fabric_broadcast_send',
        description: 'Send an org-wide broadcast. A separate verb from fabric_msg_send on purpose: a broadcast\'s status is IMMUTABLE once written — no reader may ever flip it — so org-wide state that nobody can retire must be created deliberately, never as a side effect of an address string. The key, clock, address ("all") and status ("broadcast") are all server-derived; supplying any of them is refused. Written with a CONDITIONAL CREATE, never an upsert: an overwritten broadcast is a message every seat on the fabric loses at once and none of them can discover, so a colliding key carrying a different broadcast is discriminated and an identical re-send is refused with FABRIC_DUPLICATE_MESSAGE. Each recipient records its own processing with fabric_broadcast_ack, because "has the doorbell rung" and "has THIS seat processed it" are two facts with two owners.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                from_seat: { type: 'string', description: 'The broadcasting seat\'s LABEL.' },
                subject: { type: 'string', description: 'Short subject; also the human-readable tail of the key.' },
                body: { type: 'string', description: 'The broadcast body.' },
                workstream_id: { type: 'string', description: 'Optional workstream this broadcast concerns.' },
                extra: { type: 'object', description: 'Optional additional flat metadata.' },
            },
            required: ['from_seat', 'subject', 'body'],
        },
    },
    {
        name: 'fabric_broadcast_ack',
        description: 'Record that THIS seat has processed one or more broadcasts, in this seat\'s own watermark ledger. The broadcast records themselves are never touched — that is the whole point: a broadcast\'s status is shared, so one reader flipping it deletes the message from every other seat\'s inbox. Returns `watermarked` (newly recorded) separately from `already_seen`, and issues NO write when nothing is new, so a re-ack cannot re-stamp a ledger that did not move.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                seat_label: { type: 'string', description: 'The acknowledging seat\'s LABEL.' },
                keys: { type: 'array', items: { type: 'string' }, description: 'Broadcast record keys this seat has processed. Must be non-empty.' },
            },
            required: ['seat_label', 'keys'],
        },
    },
    {
        name: 'fabric_seat_state_get',
        description: 'Read the seat-state record "seat-state-<LABEL>" — the ONE owner of a seat\'s handoff state (there is no repo handoff path). Always returns the server-stamped received_at; there is no projection parameter.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: { seat_label: { type: 'string', description: 'The seat LABEL.' } },
            required: ['seat_label'],
        },
    },
    {
        name: 'fabric_seat_state_put',
        description: 'Write the seat-state record "seat-state-<LABEL>". `mode` is REQUIRED and has NO DEFAULT — a call without it is refused. mode:"patch" merges the fields you send and leaves the rest alone; mode:"replace" makes this call the whole record and CLEARS every field it omits (reported in cleared_fields). The choice is forced because a silent partial merge is the most expensive behaviour on this store: a put of one field kept a stale text and version from an earlier write under a fresh received_at, all looking current, and get-after-put is structurally blind to it — you read back the fields you SENT and never examine the ones you failed to send.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                seat_label: { type: 'string', description: 'The seat LABEL.' },
                mode: { type: 'string', enum: [...WRITE_MODES], description: 'REQUIRED, no default. "replace" = this is the whole record, omitted fields are cleared. "patch" = merge these fields only.' },
                text: { type: 'string', description: 'The seat state itself: the thread-specific gotchas, dead ends and learnings a cold-start reader needs in order not to re-derive them.' },
                status: { type: 'string', description: 'Optional seat status.' },
                workstream_id: { type: 'string', description: 'Optional workstream this seat holds.' },
                branch: { type: 'string', description: 'Optional branch the work lives on.' },
                holder_session: { type: 'string', description: 'Optional session id holding the seat.' },
                from_agent: { type: 'string', description: 'Optional author label.' },
                extra: { type: 'object', description: 'Optional additional flat metadata.' },
            },
            required: ['seat_label', 'mode'],
        },
    },
    {
        name: 'fabric_watermark_get',
        description: 'Read the delivery ledger "watermark-<LABEL>" — the per-seat record of what this seat has already seen, handed up or resolved. This is where BROADCAST processed-state lives, because a broadcast\'s own status may never be flipped. Always returns the server-stamped received_at.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: { seat_label: { type: 'string', description: 'The seat LABEL.' } },
            required: ['seat_label'],
        },
    },
    {
        name: 'fabric_watermark_put',
        description: 'Write the delivery ledger "watermark-<LABEL>". `mode` is REQUIRED and has NO DEFAULT (patch = merge these fields, replace = these fields ARE the ledger and the rest are cleared) — see fabric_seat_state_put for why a silent merge is refused here. The ledger has exactly '
            + WATERMARK_FIELDS.length + ' fields: ' + WATERMARK_FIELDS.join(', ')
            + '. Any other field is REJECTED rather than stored, because a ledger field no reader consults is a delivery record that silently does nothing. broadcast_seen is the correct place to record that this seat has processed a broadcast — never flip the broadcast itself.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                seat_label: { type: 'string', description: 'The seat LABEL.' },
                mode: { type: 'string', enum: [...WRITE_MODES], description: 'REQUIRED, no default.' },
                // AN ARRAY, because that is what the writer writes. fabric_broadcast_ack merges the
                // acknowledged KEYS into this field as a list and re-reads it as a list; publishing
                // it as a `string` "high-water mark" advertised a shape no code on either side ever
                // held, and a caller that believed the schema would REPLACE the whole ledger with one
                // string — silently destroying every key the seat had ever acknowledged, on a field
                // whose entire job is to stop a broadcast being re-read forever.
                broadcast_seen: { type: 'array', items: { type: 'string' }, description: 'Broadcast record KEYS this seat has processed. A LIST, not a high-water mark: fabric_broadcast_ack merges keys into it and reads it back as a list, so a single string here would replace the whole ledger. Prefer fabric_broadcast_ack, which resolves the keys first and never overwrites.' },
                delivered: { type: 'array', items: { type: 'string' }, description: 'Record keys already handed up to the executive.' },
                resolved: { type: 'array', items: { type: 'string' }, description: 'Record keys acted on and closed.' },
                held: { type: 'array', items: { type: 'string' }, description: 'Record keys deliberately held back.' },
                awaiting: { type: 'array', items: { type: 'string' }, description: 'Record keys this seat is waiting on.' },
            },
            required: ['seat_label', 'mode'],
        },
    },
    {
        name: 'fabric_envelope',
        description: 'The envelope(s) assigned to a seat label. Runs TWO queries and unions them, because an envelope names its assignee as `seat_label` on some records and `to_agent` on others and the store\'s filter is a conjunction with no $or — a single predicate can only ever see half the fabric. A label with NO envelope returns envelopes:[] and success, NOT an error: a master seat has none by design, and its identity comes from the seat surface (beast_seat_read), not from an assignment.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: {
            type: 'object',
            properties: {
                seat_label: { type: 'string', description: 'The seat LABEL.' },
                status: { type: 'array', items: { type: 'string', enum: [...ENVELOPE_STATUSES] }, description: 'Optional ARRAY of envelope statuses to include: ' + ENVELOPE_STATUSES.join(', ') + '. Omit for all. A bare string is refused (one shape, so a caller cannot half-learn the parameter), and a status outside the vocabulary is refused rather than matching nothing.' },
            },
            required: ['seat_label'],
        },
    },
    {
        // CEO-D-2026-08-24-ENVELOPES-NAME-KBS-TO-CONSULT-AND-MAINTAIN. `kbs_consult`,
        // `kbs_maintain` and `rulings` are SERVER-OWNED FIELDS, not prose inside `text`: buried in
        // a body, nothing can query which seats maintain a KB and nothing can check that an
        // envelope carries the ruling it was dispatched under. `rulings` is VERBATIM by contract —
        // a paraphrase acquires the CEO's authority without his words.
        name: 'fabric_envelope_put',
        description: 'Write the envelope for a workstream — the assignment a seat executes. The key is DERIVED as "envelope-<workstream_id>", so one workstream has exactly ONE envelope and a caller cannot compose a second; a client-supplied file_id/key is REFUSED. `to_agent` is the assignee\'s seat LABEL and is validated by the SAME address vocabulary as fabric_msg_send — an envelope is 1:1, so a "ws-*" workstream id, a bare role name and the "all"/"ALL" sentinels are all refused by name: they would be written successfully and read by nobody. It is written to BOTH `to_agent` and `seat_label`, which is why fabric_envelope has to union two queries. `mode` is REQUIRED and has NO DEFAULT (patch = merge these fields, replace = these fields ARE the envelope and every field it omits is CLEARED and reported in cleared_fields) — a silent partial merge is how a re-dispatched envelope kept a stale branch and a superseded ruling under a fresh received_at, and get-after-put is structurally blind to it. `kbs_consult` and `kbs_maintain` name the knowledge bases this seat must READ and the ones it must MAINTAIN; `rulings` carries the CEO/orchestrator ruling VERBATIM, never a paraphrase. The clocks are the server\'s — a caller-supplied created_at/occurred_at/received_at/phase_at is refused. CONTRACT SHAPE (docs/design/workstream-contract-system-2026-08-25.md §4.1): `text` is a JSON OBJECT whose keys are the contract\'s SECTIONS, and ALL of these are REQUIRED and must be non-empty: ' + ENVELOPE_SECTIONS.join(', ') + '. Prose text is REFUSED by name (FABRIC_ENVELOPE_TEXT_NOT_SECTIONED) and a sectioned body missing rows is refused naming EXACTLY which (FABRIC_ENVELOPE_SECTIONS_MISSING, with `missing` and `required` in the error data) — an envelope with no Acceptance section is not a terse contract, it is an unenforceable one. Sections are checked only when this call WRITES text: `text` is REQUIRED with mode "replace" (replace means this call IS the envelope), and validated on "patch" only when you send it — a patch that does not send `text` (a status or phase flip) is untouched, so the envelopes already on the fabric stay patchable. `phase` is the contract LIFECYCLE and is SERVER-OWNED, not a body field: ' + ENVELOPE_PHASES.join(' \u2192 ') + ', defaulting to "' + ENVELOPE_PHASE_DEFAULT + '" on a record that has never carried one. Only the transitions in fabric_vocabulary\'s envelope_phase_transitions are accepted — each phase also permits ITSELF (so a re-put that does not move the contract succeeds), backward moves are REFUSED (re-opening a signed contract goes through the architect as a new contract, not a field edit) and "closed" is terminal. The server stamps `phase_at` on every phase change and echoes both.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                workstream_id: { type: 'string', description: 'The workstream this envelope assigns. It is the KEY\'s subject ("envelope-<workstream_id>"), so one workstream has exactly one envelope.' },
                to_agent: { type: 'string', description: 'The assignee\'s seat LABEL. ' + SEAT_RESOLUTION_RULE + ' An envelope is 1:1: "all"/"ALL", a "ws-*" workstream id and a bare role name are all REFUSED by name.' },
                mode: { type: 'string', enum: [...WRITE_MODES], description: 'REQUIRED, no default. "replace" = this call IS the envelope and omitted fields are cleared. "patch" = merge these fields only.' },
                text: { type: 'string', description: 'The contract body, as a JSON OBJECT serialized to a string, keyed by SECTION. REQUIRED sections, all non-empty: ' + ENVELOPE_SECTIONS.join(', ') + '. Prose is refused by name. REQUIRED when mode is "replace"; on "patch" it is validated only if sent.' },
                branch: { type: 'string', description: 'The branch this work lives on.' },
                initiative_id: { type: 'string', description: 'The initiative this workstream belongs to.' },
                kbs_consult: { type: 'array', items: { type: 'string' }, description: 'Knowledge bases this seat must CONSULT before acting. A list, so it can be queried — not prose inside `text`.' },
                kbs_maintain: { type: 'array', items: { type: 'string' }, description: 'Knowledge bases this seat is responsible for MAINTAINING as part of the work. A list, so "who maintains this KB" is an answerable question.' },
                rulings: { type: 'string', description: 'The CEO/orchestrator ruling this envelope is dispatched under, VERBATIM. Never a paraphrase: a compressed ruling acquires its author\'s authority without their words, and the vivid clause travels while the ruling stays behind.' },
                status: { type: 'string', enum: [...ENVELOPE_STATUSES], description: `Envelope status. Defaults to "${ENVELOPE_STATUS_DEFAULT}" when omitted.` },
                phase: { type: 'string', enum: [...ENVELOPE_PHASES], description: `The contract's LIFECYCLE state. Defaults to "${ENVELOPE_PHASE_DEFAULT}" on a record that carries none, and is otherwise LEFT WHERE IT IS when omitted — lifecycle is not payload, so even mode:"replace" never rewinds it. A move is checked against envelope_phase_transitions (see fabric_vocabulary): each phase permits itself, backward is refused, "${ENVELOPE_PHASES[ENVELOPE_PHASES.length - 1]}" is terminal. The server stamps phase_at; a caller-supplied phase_at is refused.` },
            },
            required: ['workstream_id', 'to_agent', 'mode'],
        },
    },
    {
        name: 'fabric_lease_claim',
        description: 'Claim a lease on a PHYSICAL SINGLETON — a dev port, a local backend. Composes the "lease-<resource>" key and delegates to the platform\'s atomic conditional create, so first claim wins inside one Firestore transaction: a losing claimant is ANSWERED with claimed:false and who holds it, never silently turned into an overwrite. Holder verification is the platform\'s, not re-implemented here. NOTE: orchestrator SEATS are NOT leases — they live on the BEAST authority plane and obey different rules (expiry never frees a seat).',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                resource: { type: 'string', description: 'The singleton being claimed, e.g. "backend-4000". Normalized to lowercase alphanumerics and dashes.' },
                holder_label: { type: 'string', description: 'The claiming seat\'s LABEL.' },
                session_id: { type: 'string', description: 'The claiming session id.' },
                ttl_s: { type: 'number', description: 'Lease lifetime in seconds. Omit for the server default, which is echoed back as `ttl_s` alongside `expires_at`. Readers treat expires_at in the past as stale and may take over; the store enforces no TTL of its own.' },
            },
            required: ['resource', 'holder_label', 'session_id'],
        },
    },
    {
        name: 'fabric_lease_release',
        description: 'Release a lease claimed with fabric_lease_claim. Deletes the record rather than flipping a status, so "released" and "claimable" cannot become two different facts about one resource — a lingering released document is a key the next claimant\'s conditional create still collides with. Reports what CHANGED: released:false genuinely means there was no lease to release, not that the call was ignored.',
        mutating: true,
        inputSchema: {
            type: 'object',
            properties: {
                resource: { type: 'string', description: 'The singleton being released.' },
                holder_label: { type: 'string', description: 'The releasing seat\'s LABEL. Delete is holder-verified by the same policy that gates the write.' },
                session_id: { type: 'string', description: 'The releasing session id.' },
            },
            required: ['resource', 'holder_label', 'session_id'],
        },
    },
    {
        name: 'fabric_vocabulary',
        description: 'Return the coordination fabric\'s SERVER vocabulary — every closed set the fabric_* verbs validate against: writable beat statuses, declared stops, legacy read-only statuses, liveness values (who wrote a beat: agent or hook), to_agent sentinels and the retired ones that are refused by name, refused role addresses, write modes, envelope statuses, delivery statuses, watermark ledger fields, wake fields, record types, key prefixes, verdicts and the server-owned numeric defaults. It also publishes the CONTRACT vocabulary: `envelope_sections` (the required sections of an envelope\'s `text`: ' + ENVELOPE_SECTIONS.join(', ') + '), `envelope_phases` + `envelope_phase_default` + `envelope_phase_transitions` (the lifecycle machine fabric_envelope_put enforces, including each phase permitting itself and "' + ENVELOPE_PHASES[ENVELOPE_PHASES.length - 1] + '" being terminal), and `record_kinds` (the inter-party record kinds: ' + FABRIC_RECORD_KINDS.join(', ') + ' — a record with no `type` is a violation, not a lax record). Takes no parameters and reads no records — it is the vocabulary itself, not a query over the fabric. GENERATE a client-side copy from this; do not hand-keep one. A hand-kept mirror was measured writing four statuses the server refuses and defining a liveness model the server did not know, so a caller was validating against a contract that did not exist and being refused by one it had never seen.',
        mutating: false,
        oauthReadonly: true,
        inputSchema: { type: 'object', properties: {} },
    },
    {
        // WS-HEADLESS-MVP-A2 (CEO-D-2026-07-01 D2): platform-wide USD AI-credits balance.
        // Read-only; the METERED RAG/agent surface (WS-A3) debits this balance per call.
        // NEVER exposes pricing internals — USD balance figures only.
        name: 'get_credit_balance',
        description: 'Get your platform-wide AI-credits balance in USD. Metered AI calls (RAG chat / agents, e.g. ask_question_to_app and query_knowledge_base) debit this balance. At a $0 balance a free daily credit auto-applies to your first metered call each day, so metered tools are usable without buying anything first (the response reports daily_free_credit_usd and daily_free_credit_available_today). Buy more credits with the descix CLI (`descix credits buy`) or the platform store. Programmatic purchase: create_stripe_checkout_session with purchase_type "ai_credits" and amount_usd returns a Stripe checkout URL.',
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
 * DISCOVERY-CORE — the set of tools advertised at the MCP handshake (tools/list) for STANDARD
 * callers. Everything else that is registered + callable is MESH-DISCOVERABLE: reachable via
 * tell_me_how + execute_remote_command but NOT advertised at handshake, so a standard session pays
 * ~1k tokens of catalog instead of ~8.7k.
 *
 * R6 (CEO-D-2026-07-13-PUBLIC-COMMUNITIES-AND-SURFACE-LOCKDOWN): the mesh-ops tools list_services
 * and service_health_check are NOT part of a normal user's MVP minimal set — they surfaced the
 * platform's internal service topology at first contact. They are FLAG-FLIPPED off the handshake
 * set here (a flag-flip only; the tell_me_how discovery internals are untouched — item K of the
 * MCP-hardening thread owns the discovery-scope enforcement). list_services is additionally
 * admin-gated in DeSciX_Cloud (COMMAND_PERMISSIONS). That leaves the 7 normal-user tools below.
 * The prior ratification was CEO-D-2026-07-04-MCP-SURFACE-SPLIT-EXECUTION §3 (9 names); this ruling
 * supersedes the mesh-health row for the STANDARD surface. Membership is ratified — do NOT
 * add/remove without a CEO ruling. (execute_remote_command is advertised via commandMeta mcp:true
 * in DeSciX_Cloud; the other 6 live in NATIVE_MCP_TOOLS above.)
 */
export const DISCOVERY_CORE_TOOL_NAMES = Object.freeze([
    'tell_me_how',
    'execute_remote_command',
    'ask_question_to_app',
    'query_knowledge_base',
    'find_communities',
    'fetch_my_purchases',
    'get_credit_balance',
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
