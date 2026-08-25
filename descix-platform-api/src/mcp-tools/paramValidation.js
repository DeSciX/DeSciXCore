/**
 * paramValidation.js — strict, fail-loud parameter validation for the MCP surface
 * (ws-mcp-surface-basics, CEO-D-2026-08-14-MCP-BASICS).
 *
 * THE PROBLEM this closes: a tool's `inputSchema` was used ONLY to ADVERTISE at tools/list.
 * At tools/call the arguments object was spread verbatim into the handler, which destructured
 * the keys it knew and silently dropped the rest. So a well-formed-looking call carrying a
 * WRONG-BUT-PLAUSIBLE param name executed against the DEFAULT instead of failing:
 *
 *     ask_question_to_app({ app_id:'unk-beast', kb_id:'Org', user_input:'...' })
 *       -> kb_id is not in ask_question_to_app's schema (it is query_knowledge_base's name for
 *          the same concept), so it was dropped, the default KB was used, and the caller got
 *          "KnowledgeBase 'General' not found" — an error naming a KB it never asked for.
 *
 * That is the silent-failure class. The schema IS the published contract, so anything not in
 * it is an ERROR, named out loud, with the nearest valid parameter suggested.
 *
 * Dependency-free leaf: imported by BOTH the Cloud MCP router (apiFront tools/call + the
 * execute_remote_command gateway, which feed it the per-command commandMeta inputSchema) and
 * the CLI stdio MCP server (which feeds it the NATIVE_MCP_TOOLS inputSchema). ONE validator,
 * one message format, no parallel implementations.
 */

/**
 * Curated cross-tool confusions. Edit distance alone cannot connect these — they are different
 * WORDS for the same concept on ADJACENT tools, which is exactly why callers get them wrong.
 * Each entry maps a wrong-but-plausible key to the canonical key(s) it is usually meant to be.
 */
export const PARAM_ALIASES = Object.freeze({
    // The one that bit JARVIS: query_knowledge_base says kb_id, ask_question_to_app says
    // knowledgebase_name, and both take an app_id — so the call looks right and dies wrong.
    kb_id: ['knowledgebase_name'],
    kb_ids: ['knowledgebase_names'],
    kb: ['knowledgebase_name', 'kb_id'],
    kb_name: ['knowledgebase_name', 'kb_id'],
    knowledgebase: ['knowledgebase_name', 'kb_id'],
    knowledgebase_id: ['knowledgebase_name', 'kb_id'],
    knowledgebase_name: ['kb_id'],
    knowledgebase_names: ['kb_ids'],
    // Ask-vs-search phrasing.
    query: ['user_input'],
    user_input: ['query'],
    question: ['user_input', 'query'],
    prompt: ['user_input', 'query'],
    text: ['user_input', 'query'],
    // Identity shorthands.
    app: ['app_id'],
    appId: ['app_id'],
    community: ['community_id'],
    communityId: ['community_id'],
    // Thread continuation.
    interaction_id: ['previous_interaction_id'],
    previous_interaction: ['previous_interaction_id'],
    thread_id: ['previous_interaction_id'],
});

/**
 * Params the PLATFORM itself injects onto a command's params after the MCP boundary
 * (apiFront auth middleware / the gateway's auth-context forwarding). A caller never sends
 * these; validation runs BEFORE injection, but they are allow-listed so a re-validation on an
 * already-decorated bag can never fail. NOT a place to park caller-facing params.
 */
export const PLATFORM_INJECTED_PARAMS = Object.freeze([
    'user', 'community_id', 'access_token', 'service_account',
]);

/**
 * JSON-Schema `type` word -> the predicate that decides whether a runtime value IS that type.
 * THE ONE OWNER of "what does this type word mean" for the whole platform boundary: the validator,
 * the error message and the conformance test all read this table, so no surface can re-derive a
 * second, differently-worded answer.
 *
 * `integer` is a distinct word from `number` in JSON Schema and is enforced as such — a manifest
 * that declares `integer` and receives 1.5 has been lied to.
 */
export const SCHEMA_TYPE_PREDICATES = Object.freeze({
    string: v => typeof v === 'string',
    number: v => typeof v === 'number' && Number.isFinite(v),
    integer: v => typeof v === 'number' && Number.isInteger(v),
    boolean: v => typeof v === 'boolean',
    array: v => Array.isArray(v),
    object: v => v !== null && typeof v === 'object' && !Array.isArray(v),
    null: v => v === null,
});

/** The declared type words this validator can enforce. Derived from the table; never hand-listed. */
export const SUPPORTED_SCHEMA_TYPES = Object.freeze(Object.keys(SCHEMA_TYPE_PREDICATES));

/**
 * "Absent" has ONE definition on this boundary, shared by the required-parameter check and the
 * type check. `null` counts as absent because that is the definition the required check has always
 * used, and two definitions of absence in one function is the mirror-drift bug in miniature.
 */
function isAbsent(value) {
    return value === undefined || value === null;
}

/** The runtime type word for a value, in the SAME vocabulary the schema uses. */
export function runtimeTypeOf(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const t = typeof value;
    return t === 'number' && !Number.isFinite(value) ? 'number (non-finite)' : t;
}

/**
 * Normalise a property's declared `type` to the list of accepted type words.
 * JSON Schema allows a single word or a union array; both are answered here so no caller branches.
 * @returns {string[]} [] when the property declares no type (=> nothing to enforce).
 */
export function declaredTypesOf(propertySchema) {
    const declared = propertySchema && typeof propertySchema === 'object' ? propertySchema.type : undefined;
    if (typeof declared === 'string') return [declared];
    if (Array.isArray(declared)) return declared.filter(t => typeof t === 'string');
    return [];
}

/**
 * Does a value satisfy a property's declared `type`?
 * A type word this validator does not know is NOT enforced — we make no claim we cannot justify.
 * An unknown word is a SCHEMA-authoring defect, and it is caught by the schema conformance test
 * (which asserts every declared type is in SUPPORTED_SCHEMA_TYPES) rather than by refusing a live
 * call, so a typo in a manifest surfaces in CI instead of as a runtime outage.
 */
export function valueMatchesDeclaredType(value, propertySchema) {
    const types = declaredTypesOf(propertySchema);
    if (types.length === 0) return true;
    const enforceable = types.filter(t => t in SCHEMA_TYPE_PREDICATES);
    if (enforceable.length === 0) return true;
    return enforceable.some(t => SCHEMA_TYPE_PREDICATES[t](value));
}

/**
 * A NON-REVEALING description of what arrived: its SHAPE, never its contents.
 *
 * The refusal must say what was received without becoming an exfiltration path. Declared-string
 * parameters are exactly the ones that carry secrets — `seat_token`, `signature`,
 * `walletSignature`, `invite_token` are all `type:'string'` in the registered manifests — and a
 * validation error is a string that gets logged, relayed and pasted into agent context. Echoing a
 * rejected value would put those bytes on that path for free.
 *
 * Nothing diagnostic is lost: "declared 'number' but received string (length 1)" already tells the
 * caller they sent "3" instead of 3, which is the whole confusion this error exists to resolve.
 */
function describeShape(value) {
    if (typeof value === 'string') return `length ${value.length}`;
    if (Array.isArray(value)) return `${value.length} element${value.length === 1 ? '' : 's'}`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value !== null && typeof value === 'object') {
        const keys = Object.keys(value);
        return `${keys.length} key${keys.length === 1 ? '' : 's'}`;
    }
    return String(value);
}

/** Levenshtein distance — small inputs (parameter names), so the simple DP is fine. */
function editDistance(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    const curr = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        prev = curr.slice();
    }
    return prev[n];
}

/**
 * Best canonical parameter for an unknown key: curated alias first (the confusions edit
 * distance cannot see), then nearest neighbour within a conservative distance.
 * @returns {string|null} the suggestion, or null when nothing is close enough to claim.
 */
export function suggestParam(unknownKey, validNames) {
    if (!unknownKey || !Array.isArray(validNames) || validNames.length === 0) return null;
    const valid = new Set(validNames);

    for (const candidate of PARAM_ALIASES[unknownKey] || []) {
        if (valid.has(candidate)) return candidate;
    }

    const lowerKey = String(unknownKey).toLowerCase();
    for (const name of validNames) {
        if (name.toLowerCase() === lowerKey) return name; // pure case mismatch
    }

    let best = null;
    let bestDist = Infinity;
    for (const name of validNames) {
        const d = editDistance(lowerKey, name.toLowerCase());
        if (d < bestDist) { bestDist = d; best = name; }
    }
    // Only claim a typo when the edit is small relative to the name — otherwise stay silent
    // rather than send the caller somewhere unrelated.
    const threshold = Math.max(2, Math.floor(Math.max(lowerKey.length, best ? best.length : 0) / 3));
    return bestDist <= threshold ? best : null;
}

/**
 * Validate a caller-supplied params bag against a plain JSON-Schema `inputSchema`.
 *
 * FAIL-LOUD, NO COERCION: unknown parameters, missing required parameters and parameters whose
 * value contradicts the DECLARED `type` all THROW, naming the offending key and (for unknowns) the
 * nearest valid one. Nothing is silently dropped, defaulted or coerced — that behaviour is the bug
 * this exists to kill.
 *
 * TYPE IS PART OF THE PUBLISHED CONTRACT. A schema that says `type:'string'` and accepts a number
 * has advertised something untrue; the caller then debugs a downstream symptom (`.trim is not a
 * function`, a Firestore doc keyed by `[object Object]`) instead of reading a refusal that names
 * the parameter. Only the property's own top-level `type` is enforced here — nested `items`/
 * sub-schemas are NOT, so this never silently claims more validation than it performs.
 *
 * NO-SCHEMA => NO CLAIM: when the command has no declared `properties`, we cannot know what is
 * valid, so we validate nothing rather than fabricate a contract (a hardcoded guess here would
 * be the same anti-pattern in a new place). Commands are onboarded by DECLARING a schema.
 *
 * @param {object} schema        plain JSON-Schema object ({ properties, required })
 * @param {object} params        the caller-supplied arguments
 * @param {object} [opts]
 * @param {string} [opts.commandName]  name used in the error message
 * @param {string} [opts.surface]      e.g. 'MCP tools/call' — where the rejection happened
 * @throws {Error} with `code = 'INVALID_PARAMS'` on any violation
 */
export function validateParamsAgainstSchema(schema, params, opts = {}) {
    const { commandName = 'command', surface = 'MCP' } = opts;
    const properties = schema && typeof schema === 'object' ? schema.properties : null;
    if (!properties || typeof properties !== 'object') return; // undeclared => nothing to check

    const validNames = Object.keys(properties);
    const supplied = params && typeof params === 'object' ? params : {};
    const injected = new Set(PLATFORM_INJECTED_PARAMS);

    const unknown = Object.keys(supplied).filter(k => !(k in properties) && !injected.has(k));
    if (unknown.length > 0) {
        const details = unknown.map(k => {
            const hint = suggestParam(k, validNames);
            return hint ? `'${k}' (did you mean '${hint}'?)` : `'${k}'`;
        });
        const err = new Error(
            `${commandName}: unknown parameter${unknown.length > 1 ? 's' : ''} ${details.join(', ')}. ` +
            `Accepted parameters: ${validNames.join(', ')}. ` +
            `Rejected at the ${surface} boundary — the parameter was NOT applied, and no default was substituted.`
        );
        err.code = 'INVALID_PARAMS';
        err.data = { command: commandName, unknown_parameters: unknown, accepted_parameters: validNames };
        throw err;
    }

    const required = Array.isArray(schema.required) ? schema.required : [];
    const missing = required.filter(k => isAbsent(supplied[k]));
    if (missing.length > 0) {
        const err = new Error(
            `${commandName}: missing required parameter${missing.length > 1 ? 's' : ''} ` +
            `${missing.map(k => `'${k}'`).join(', ')}. ` +
            `Accepted parameters: ${validNames.join(', ')}.`
        );
        err.code = 'INVALID_PARAMS';
        err.data = { command: commandName, missing_parameters: missing, accepted_parameters: validNames };
        throw err;
    }

    // THIRD GATE: the value must BE what the schema said it would be. Runs after the required
    // check so a required parameter that is absent is reported as missing, not as a type error.
    const mistyped = [];
    for (const name of validNames) {
        const value = supplied[name];
        if (isAbsent(value)) continue; // absence is the required check's business, not ours
        if (valueMatchesDeclaredType(value, properties[name])) continue;
        mistyped.push({
            parameter: name,
            declared_type: declaredTypesOf(properties[name]).join(' | '),
            received_type: runtimeTypeOf(value),
            received_shape: describeShape(value),
        });
    }
    if (mistyped.length > 0) {
        const details = mistyped.map(m =>
            `'${m.parameter}' is declared type '${m.declared_type}' but received ${m.received_type} (${m.received_shape})`
        );
        const err = new Error(
            `${commandName}: wrong parameter type${mistyped.length > 1 ? 's' : ''} — ${details.join('; ')}. ` +
            `Rejected at the ${surface} boundary — the value was NOT coerced and the command did NOT run. ` +
            `Send each parameter as its declared type.`
        );
        err.code = 'INVALID_PARAMS';
        err.data = { command: commandName, mistyped_parameters: mistyped, accepted_parameters: validNames };
        throw err;
    }
}

/**
 * Does `toolName` declare `paramName` in its schema? Used by the CLI stdio server so workspace
 * context (app_id / community_id) is only auto-filled into tools that actually ACCEPT it —
 * blind injection is what made the stdio path manufacture params the target tool never took.
 */
export function toolAcceptsParam(tools, toolName, paramName) {
    const tool = Array.isArray(tools) ? tools.find(t => t && t.name === toolName) : null;
    const properties = tool && tool.inputSchema ? tool.inputSchema.properties : null;
    return !!(properties && Object.prototype.hasOwnProperty.call(properties, paramName));
}

/** Convenience: validate against a tool definition list (name -> inputSchema). */
export function validateToolParams(tools, toolName, params, opts = {}) {
    const tool = Array.isArray(tools) ? tools.find(t => t && t.name === toolName) : null;
    if (!tool || !tool.inputSchema) return; // unknown tool is the dispatcher's error, not ours
    validateParamsAgainstSchema(tool.inputSchema, params, { commandName: toolName, ...opts });
}
