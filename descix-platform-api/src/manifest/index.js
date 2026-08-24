/**
 * @descix/platform-api/manifest
 *
 * Shared manifest generation, validation, and middleware for DeSciX microservices.
 * Every service exposes a /manifest endpoint; this module provides the building blocks.
 *
 * Two manifest sources:
 *   1. Static manifest.json (BEAST, Powch) — read via buildManifestFromStatic()
 *   2. Dynamic from JSDoc + registry (Cloud) — built via buildManifestFromHandlers()
 *
 * manifestMiddleware() is an Express GET handler that tries static first, falls back
 * to dynamic, caches the result, and serves it at /manifest.
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

import { validateParamsAgainstSchema } from '../mcp-tools/paramValidation.js';

// ─── The command contract ────────────────────────────────────────────────────

/**
 * CONTRACT TIERS (design §13.3, CEO-D-25 2026-08-24).
 *
 * Strictness travels with the MANIFEST, not with the door. `manifest.service.contract` declares
 * the tier; validateManifest keeps ONE call shape at every door and branches on the declared
 * token. That is what lets BEAST ship a strict contract on the same day Cloud's boot
 * self-registration, powch, daita-ssgpod and egpt-godsworld keep registering unchanged —
 * without a per-call-site `strict` flag to leak, a door asymmetry to document, or a second
 * validator to drift.
 *
 * An UNKNOWN token is refused. A tier is a promise the artifact makes about itself, so an
 * unrecognised promise is a refusal, never a fallback to leniency.
 */
export const CONTRACT_TIERS = Object.freeze(['v1', 'v2']);

/** A manifest that declares no tier is v1 — the pre-contract population. */
export const DEFAULT_CONTRACT_TIER = 'v1';

/**
 * The v1 branch is a MIGRATION STAGE, not a fence. §13.3: "Each v1 service gets a named
 * migration owner in the same change — a board row per service, or the tier is a fence rather
 * than a stage. The v1 branch is DELETED by the last migration."
 *
 * Keyed by `manifest.service.name`. When this map empties, the v1 branch below goes with it;
 * tests/manifest-contract.test.js::B0 is the gate that keeps the two facts tied together.
 */
export const V1_MIGRATION_OWNERS = Object.freeze({
    cloud: 'design §13.3 E5 — the 41-command Cloud commandMeta migration',
    powch: 'design §13.7 — the hand-rolled /manifest sweep (DeSciX_Powch/microservice/src/index.js:234)',
    ssgpod: 'design §13.7 — the hand-rolled /manifest sweep (apps/daita-ssgpod/microservice/app.js:86-88)',
    godsworld: 'design §13.7 — the hand-rolled /manifest sweep + the CLI scaffold that reproduces it',
});

/**
 * The ONE table describing what a command entry carries. Both readers drive off it:
 * `buildManifestFromHandlers` (which overlay-owned fields to ferry) and `validateManifest`
 * (which fields a v2 contract must declare). Two hand-kept lists would be the schema-mirror
 * drift class this whole row exists to close.
 *
 *   required — must be DECLARED under the v2 contract.
 *   overlay  — the handler's `commandMeta` export owns it, so the builder ferries it through.
 *              `overlay: false` means some other module owns the fact and the overlay must not
 *              become a second derivation of it.
 */
export const COMMAND_CONTRACT_FIELDS = Object.freeze({
    description:         { type: 'string',  required: true,  overlay: true },
    summary:             { type: 'string',  required: true,  overlay: true },
    inputSchema:         { type: 'object',  required: true,  overlay: true },
    errors:              { type: 'array',   required: true,  overlay: true },
    example:             { type: 'object',  required: true,  overlay: true },
    // REQUIRED, and `[]` must be written explicitly (§13.2). This is the authoritative EXTERNAL
    // permission gate — DeSciX_Cloud/microservice/services/apiFront.js:298-314 enforces it at call
    // time from the REGISTERED manifest, and :391-410 mirrors it at advertisement. If absence
    // meant "no gate", forgetting the field and opening the command would be the same bit.
    requiredPermissions: { type: 'array',   required: true,  overlay: true },
    visibility:          { type: 'string',  required: false, overlay: true },
    // Opaque to Core: declared by the service, ferried verbatim, never interpreted here.
    requires_seat:       { type: 'any',     required: false, overlay: true },
    scope:               { type: 'any',     required: false, overlay: true },
    mcp:                 { type: 'boolean', required: false, overlay: true },
    mutating:            { type: 'boolean', required: false, overlay: true },
    serviceAccountOnly:  { type: 'boolean', required: false, overlay: true },
    isProxy:             { type: 'boolean', required: false, overlay: true },
    // Builder-owned: the `guestCommands` set the service passes in is the single owner.
    guestAllowed:        { type: 'boolean', required: false, overlay: false },
    // JSDoc-owned: parsed from the @deprecated tag.
    deprecatedBy:        { type: 'string',  required: false, overlay: false },
});

/**
 * The keys of one published error entry.
 *
 * `statusCode`, NOT `http` (§13.2): the platform has exactly ONE structured-error contract,
 * `{code, statusCode, data}` (apiFront.js:244,251,334,340). Publishing the same fact under a
 * second name would be mirror drift introduced at the fix.
 */
export const ERROR_ENTRY_FIELDS = Object.freeze(['code', 'statusCode', 'when', 'fix']);

/** Fields a published `example` may never carry — the mesh injects them; a caller never does. */
const RESERVED_EXAMPLE_KEYS = Object.freeze(['_descix']);

/** Derived once from the table — the fields the overlay owns and the builder therefore ferries. */
const OVERLAY_OWNED_FIELDS = Object.freeze(
    Object.entries(COMMAND_CONTRACT_FIELDS).filter(([, spec]) => spec.overlay).map(([k]) => k)
);

// ─── JSDoc Parsing ───────────────────────────────────────────────────────────

/**
 * Parse a JSDoc comment block to extract description and visibility directives.
 *
 * Recognized tags:
 *   @admin          → visibility: "admin"
 *   @deprecated X   → visibility: "deprecated", deprecatedBy: X
 *   @internal       → visibility: "internal"
 *   @param {Type} name - desc  → inputSchema hint
 *   (no tag)        → visibility: "public"
 *
 * @param {string} jsdoc — raw JSDoc string (with leading * stripped)
 * @returns {{ description: string, visibility: string, deprecatedBy?: string, params: Array }}
 */
function parseJSDoc(jsdoc) {
    if (!jsdoc) return { description: '', visibility: 'public', params: [] };

    const lines = jsdoc
        .split('\n')
        .map(l => l.replace(/^\s*\*\s?/, '').trim())
        .filter(Boolean);

    let description = '';
    let visibility = 'public';
    let deprecatedBy = null;
    const params = [];

    for (const line of lines) {
        // @admin
        if (/^@admin\b/.test(line)) {
            visibility = 'admin';
            continue;
        }
        // @deprecated [replacement]
        const deprecMatch = line.match(/^@deprecated\s*(.*)/);
        if (deprecMatch) {
            visibility = 'deprecated';
            deprecatedBy = deprecMatch[1]?.trim() || null;
            continue;
        }
        // @internal
        if (/^@internal\b/.test(line)) {
            visibility = 'internal';
            continue;
        }
        // @param {Type} name - description
        const paramMatch = line.match(/^@param\s+\{(\w+)\}\s+(\w+)\s*-?\s*(.*)/);
        if (paramMatch) {
            params.push({
                type: paramMatch[1],
                name: paramMatch[2],
                description: paramMatch[3]?.trim() || ''
            });
            continue;
        }
        // @returns — skip
        if (/^@returns?\b/.test(line)) continue;
        // @throws — skip
        if (/^@throws?\b/.test(line)) continue;

        // Everything else before tags is description
        if (!line.startsWith('@') && !description) {
            description = line;
        } else if (!line.startsWith('@') && description) {
            // Append additional description lines
            description += ' ' + line;
        }
    }

    const result = { description: description.trim(), visibility, params };
    if (deprecatedBy) result.deprecatedBy = deprecatedBy;
    return result;
}

/**
 * Extract the JSDoc comment immediately preceding a given function name in source text.
 *
 * Strategy: find the function declaration, then look backwards for the nearest
 * closing JSDoc marker. If found, extract the full JSDoc block.
 *
 * @param {string} source — full file source
 * @param {string} fnName — function name to find JSDoc for
 * @returns {string|null} — raw JSDoc body (without the opening / closing markers), or null
 */
function extractJSDocForFunction(source, fnName) {
    // Find the function declaration
    const fnPattern = new RegExp(
        `(?:async\\s+)?function\\s+${escapeRegExp(fnName)}\\s*\\(`
    );
    const fnMatch = fnPattern.exec(source);
    if (!fnMatch) return null;

    // Look at the text before the function declaration
    const textBefore = source.substring(0, fnMatch.index);

    // Find the last */ before the function (must be within ~200 chars of whitespace/newlines)
    const closingIdx = textBefore.lastIndexOf('*/');
    if (closingIdx === -1) return null;

    // Check that between */ and the function there's only whitespace
    const between = textBefore.substring(closingIdx + 2);
    if (between.trim() !== '') return null;

    // Find the matching /** opening
    const openingIdx = textBefore.lastIndexOf('/**', closingIdx);
    if (openingIdx === -1) return null;

    // Extract the JSDoc body (between /** and */)
    return textBefore.substring(openingIdx + 3, closingIdx);
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Manifest Builders ───────────────────────────────────────────────────────

/**
 * Build a manifest by parsing JSDoc from handler files referenced by a command registry.
 *
 * @param {Object} config
 * @param {string} config.name          — service name (e.g., 'cloud')
 * @param {string} config.version       — semver version
 * @param {string} config.description   — human-readable service description
 * @param {string} config.domain        — production domain (e.g., 'api.descix.net')
 * @param {string} [config.healthEndpoint='/health'] — health check path
 * @param {number} [config.debugPort]   — local dev port
 * @param {string} [config.community_id] — owning community
 * @param {string} [config.app_id]       — owning app
 * @param {Object} config.handlers      — { command_name: 'handlerFile.js', ... } from registry.js
 * @param {string} config.handlerDir    — absolute path to commandHandlers/ directory
 * @param {Set<string>} [config.guestCommands] — set of guest-allowed command names
 * @param {Object} [config.metaOverlay] — { command: { description, inputSchema, mcp, mutating } }
 *        per-command meta (from handler commandMeta exports). Authoritative over JSDoc.
 * @returns {Promise<Object>} — standard manifest object
 */
export async function buildManifestFromHandlers(config) {
    const {
        name, version, description, domain,
        healthEndpoint = '/health',
        debugPort, community_id, app_id,
        // §13.3 — the tier the artifact promises. Emitted into service so the strictness is
        // visible in the reviewed manifest rather than in whichever caller happened to validate it.
        contract,
        handlers, handlerDir,
        guestCommands = new Set(),
        // WS-MCP-SSOT-TIER2: per-command meta from each handler's commandMeta export
        // (aggregated by the consuming service). When a command has meta, its
        // description + inputSchema are AUTHORITATIVE over the JSDoc-parsed values, and
        // mcp/mutating are surfaced into the manifest entry. Commands without meta fall
        // back to JSDoc (incremental migration — audit §5.B-3).
        metaOverlay = {}
    } = config;

    // Group commands by handler file to minimize file reads
    const fileCommands = {};
    for (const [cmd, file] of Object.entries(handlers)) {
        if (!fileCommands[file]) fileCommands[file] = [];
        fileCommands[file].push(cmd);
    }

    const commands = {};
    const parseWarnings = [];

    // Read each handler file once and extract JSDoc for all its commands
    for (const [file, cmds] of Object.entries(fileCommands)) {
        const filePath = path.join(handlerDir, file);
        let source;
        try {
            source = fs.readFileSync(filePath, 'utf8');
        } catch (err) {
            parseWarnings.push(`Cannot read ${file}: ${err.message}`);
            // Still register commands with empty description
            for (const cmd of cmds) {
                commands[cmd] = {
                    description: '',
                    guestAllowed: guestCommands.has(cmd),
                    visibility: 'public'
                };
            }
            continue;
        }

        for (const cmd of cmds) {
            const rawDoc = extractJSDocForFunction(source, cmd);
            const parsed = parseJSDoc(rawDoc);

            const entry = {
                description: parsed.description || '',
                guestAllowed: guestCommands.has(cmd),
                visibility: parsed.visibility
            };

            if (parsed.deprecatedBy) {
                entry.deprecatedBy = parsed.deprecatedBy;
            }

            // Build a minimal inputSchema from @param annotations if present
            if (parsed.params.length > 0) {
                const properties = {};
                for (const p of parsed.params) {
                    properties[p.name] = {
                        type: p.type.toLowerCase() === 'object' ? 'object' :
                              p.type.toLowerCase() === 'string' ? 'string' :
                              p.type.toLowerCase() === 'number' ? 'number' :
                              p.type.toLowerCase() === 'boolean' ? 'boolean' : 'string',
                        description: p.description
                    };
                }
                entry.inputSchema = { type: 'object', properties };
            }

            // WS-MCP-SSOT-TIER2: meta wins over JSDoc where a command self-describes.
            // Driven off COMMAND_CONTRACT_FIELDS so a new contract field cannot be added without
            // the builder carrying it. `!== undefined`, not truthiness: an explicit
            // `requiredPermissions: []` MUST survive the build, because under §13.2 it is the
            // difference between "declared open" and "forgot to declare".
            const meta = metaOverlay[cmd];
            if (meta) {
                for (const field of OVERLAY_OWNED_FIELDS) {
                    if (meta[field] !== undefined) entry[field] = meta[field];
                }
            }

            commands[cmd] = entry;
        }
    }

    const manifest = {
        service: {
            name,
            version,
            description,
            domain,
            healthEndpoint,
            ...(debugPort != null && { debugPort }),
            ...(community_id && { community_id }),
            ...(app_id && { app_id }),
            ...(contract && { contract })
        },
        commands
    };

    if (parseWarnings.length > 0) {
        manifest._parseWarnings = parseWarnings;
    }

    return manifest;
}

/**
 * Build a manifest from a static manifest.json file.
 *
 * @param {string} manifestPath — absolute path to manifest.json
 * @returns {Object} — parsed manifest object
 * @throws {Error} if file cannot be read or parsed
 */
export function buildManifestFromStatic(manifestPath) {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw);
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a manifest object for completeness.
 *
 * ONE function, ONE call shape, at every door (register_service, the CLI). It branches on the
 * tier the MANIFEST declares — `manifest.service.contract` — never on a caller-supplied flag
 * (§13.3). A door therefore cannot validate leniently by accident, and the returned `contract`
 * lets it say which tier it applied.
 *
 *   v1 (or absent) — the four historical checks. The migration population; see V1_MIGRATION_OWNERS.
 *   v2             — the full COMMAND_CONTRACT_FIELDS set, per command, LISTED not counted.
 *   anything else  — REFUSED.
 *
 * @param {Object} manifest
 * @returns {{ valid: boolean, errors: string[], contract: string }}
 */
export function validateManifest(manifest) {
    const errors = [];
    const declared = manifest?.service?.contract;
    const contract = declared === undefined || declared === null ? DEFAULT_CONTRACT_TIER : declared;

    if (!CONTRACT_TIERS.includes(contract)) {
        // Fail before anything else: an unrecognised promise is not a promise we can check.
        return {
            valid: false,
            contract,
            errors: [
                `Unknown service.contract '${contract}'. Declare one of: ${CONTRACT_TIERS.join(', ')}. ` +
                `The manifest declares its own strictness; an unrecognised tier is refused rather ` +
                `than validated leniently.`
            ],
        };
    }

    if (!manifest?.service?.name) {
        errors.push('Missing service.name');
    }
    if (!manifest?.service?.domain && !manifest?.service?.debugPort) {
        errors.push('Missing service.domain (or service.debugPort for local dev)');
    }

    const commands = manifest?.commands || {};
    if (Object.keys(commands).length === 0) {
        errors.push('No commands defined');
    }

    if (contract === 'v1') {
        let missingDescriptions = 0;
        for (const config of Object.values(commands)) {
            if (!config.description || config.description.trim() === '') missingDescriptions++;
        }
        if (missingDescriptions > 0) {
            errors.push(`${missingDescriptions} command(s) missing description`);
        }
        return { valid: errors.length === 0, errors, contract };
    }

    for (const [cmd, config] of Object.entries(commands)) {
        errors.push(...validateCommandV2(cmd, config || {}));
    }

    return { valid: errors.length === 0, errors, contract };
}

/**
 * The v2 per-command checks. Every failure is LISTED and names the command AND the field —
 * a count cannot be acted on by the developer who has to fix it.
 *
 * @param {string} cmd
 * @param {Object} config
 * @returns {string[]}
 */
function validateCommandV2(cmd, config) {
    const out = [];
    const fail = (msg) => out.push(`${cmd}: ${msg}`);

    for (const [field, spec] of Object.entries(COMMAND_CONTRACT_FIELDS)) {
        if (!spec.required) continue;
        const value = config[field];
        if (value === undefined || value === null) {
            fail(`missing '${field}'` + (spec.type === 'array'
                ? ` — declare it explicitly; an empty array [] is a declaration, absence is not`
                : ''));
            continue;
        }
        if (spec.type === 'string' && (typeof value !== 'string' || value.trim() === '')) {
            fail(`'${field}' must be a non-empty string`);
        }
        if (spec.type === 'array' && !Array.isArray(value)) {
            fail(`'${field}' must be an array`);
        }
        if (spec.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            fail(`'${field}' must be an object`);
        }
    }

    // errors[] — every command has at least one refusal mode, and each entry carries the whole
    // structured-error contract {code, statusCode, when, fix}.
    if (Array.isArray(config.errors)) {
        if (config.errors.length === 0) {
            fail(`'errors' is empty — declare at least one refusal mode with its ${ERROR_ENTRY_FIELDS.join('/')}`);
        }
        config.errors.forEach((e, i) => {
            for (const key of ERROR_ENTRY_FIELDS) {
                if (e == null || e[key] === undefined || e[key] === null) {
                    fail(`errors[${i}] is missing '${key}'` +
                        (key === 'statusCode' && e && e.http !== undefined
                            ? ` — the platform's one structured-error contract spells it 'statusCode', not 'http'`
                            : ''));
                }
            }
        });
    }

    // inputSchema — properties and required are both declarations, and an EMPTY properties bag
    // must say so explicitly (VISION 2026-08-24 22:53Z).
    const schema = config.inputSchema;
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
        const props = schema.properties;
        if (!props || typeof props !== 'object' || Array.isArray(props)) {
            fail(`'inputSchema.properties' must be an object (use {} with the parameterless declaration for a command that takes no parameters)`);
        } else if (!Array.isArray(schema.required)) {
            fail(`'inputSchema.required' must be an array (use [] when no parameter is mandatory)`);
        } else if (Object.keys(props).length === 0 &&
                   !(schema.additionalProperties === false && schema.required.length === 0)) {
            fail(`'inputSchema.properties' is empty but the command does not DECLARE itself parameterless — ` +
                 `a genuinely parameterless command declares that explicitly ` +
                 `(properties:{} + additionalProperties:false + required:[]). An empty properties bag ` +
                 `on a command that accepts parameters is refused as loudly as an absent one.`);
        }
    }

    // The published example must be a bag the boundary would actually accept. One owner of that
    // question: validateParamsAgainstSchema. A documented call the gateway would reject is a lie.
    if (config.example !== undefined && config.example !== null) {
        const params = (config.example && typeof config.example === 'object' && 'params' in config.example)
            ? config.example.params
            : config.example;
        for (const reserved of RESERVED_EXAMPLE_KEYS) {
            if (params && typeof params === 'object' && reserved in params) {
                fail(`example carries the reserved key '${reserved}' — it is injected by the mesh, never supplied by a caller`);
            }
        }
        if (schema && typeof schema === 'object') {
            try {
                validateParamsAgainstSchema(schema, params || {}, { commandName: cmd, surface: 'manifest example' });
            } catch (err) {
                fail(`example does not satisfy this command's own inputSchema — ${err.message}`);
            }
        }
    }

    return out;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Express middleware factory for /manifest endpoint.
 *
 * Attempts to load a static manifest.json first (if manifestPath is provided).
 * Falls back to buildManifestFromHandlers if available.
 * Caches the result until process restart (dev: could add file-watch invalidation).
 *
 * @param {Object} config
 * @param {string} [config.manifestPath]   — path to static manifest.json (optional)
 * @param {Object} [config.handlerConfig]  — config for buildManifestFromHandlers (optional)
 * @returns {Function} Express (req, res) handler for GET /manifest
 */
export function manifestMiddleware(config = {}) {
    let cachedManifest = null;

    return async (req, res) => {
        try {
            if (cachedManifest) {
                return res.json(cachedManifest);
            }

            // Try static manifest first
            if (config.manifestPath && fs.existsSync(config.manifestPath)) {
                cachedManifest = buildManifestFromStatic(config.manifestPath);
                return res.json(cachedManifest);
            }

            // Fall back to handler-based generation
            if (config.handlerConfig) {
                cachedManifest = await buildManifestFromHandlers(config.handlerConfig);
                return res.json(cachedManifest);
            }

            return res.status(500).json({ error: 'No manifest source configured' });
        } catch (err) {
            console.error('[Manifest] Error serving manifest:', err.message);
            return res.status(500).json({ error: 'Could not generate manifest' });
        }
    };
}

// ─── Hash Utility ────────────────────────────────────────────────────────────

/**
 * Compute a SHA-256 hash of the commands section for change detection.
 *
 * @param {Object} manifest — manifest with commands property
 * @returns {string} hex digest
 */
export function computeManifestHash(manifest) {
    return createHash('sha256')
        .update(JSON.stringify(manifest.commands || {}))
        .digest('hex');
}
