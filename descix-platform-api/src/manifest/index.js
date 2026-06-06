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
            const meta = metaOverlay[cmd];
            if (meta) {
                if (meta.description) entry.description = meta.description;
                if (meta.inputSchema) entry.inputSchema = meta.inputSchema;
                if (typeof meta.mcp === 'boolean') entry.mcp = meta.mcp;
                if (typeof meta.mutating === 'boolean') entry.mutating = meta.mutating;
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
            ...(app_id && { app_id })
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
 * Rules:
 *   - service.name is required
 *   - service.domain is required (or debugPort in dev)
 *   - Every command must have a non-empty description
 *
 * @param {Object} manifest
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateManifest(manifest) {
    const errors = [];

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

    let missingDescriptions = 0;
    for (const [cmd, config] of Object.entries(commands)) {
        if (!config.description || config.description.trim() === '') {
            missingDescriptions++;
            // Don't list every one — just count
        }
    }
    if (missingDescriptions > 0) {
        errors.push(`${missingDescriptions} command(s) missing description`);
    }

    return { valid: errors.length === 0, errors };
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
