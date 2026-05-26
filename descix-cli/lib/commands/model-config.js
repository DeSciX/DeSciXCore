/**
 * Model Config Commands — WS-CONFIG-BOOTSTRAP-FIX item #10
 *
 * CLI surface for the four resolver-chain knobs:
 *   - descix app set-default-model -a <app_id> -m <model_name> [--env=dev|demo|prod]
 *   - descix app set-default-model -a <app_id> --clear [--env=dev|demo|prod]
 *   - descix kb set-override-model -a <app_id> -k <kb_name> -m <model_name> [--env=dev|demo|prod]
 *   - descix kb clear-override-model -a <app_id> -k <kb_name> [--env=dev|demo|prod]
 *
 * Per CEO 2026-05-26 inheritance chain:
 *   options.model || kb.kb_model_override || app.default_app_model || levelConfig.model || utils.DEFAULT_AI_MODEL
 *
 * --clear flows use FieldValue.delete() server-side (NOT null) per tripwire #2.
 *
 * Every action appends a JSONL audit-log line to {workspace-root}/docs/handoff/model-config-changes.jsonl.
 *
 * This module performs NO Firestore I/O directly — it is HTTP-only, routing to backend handlers
 * via DeSciXApiClient.invoke (set_app_default_model, clear_app_default_model, set_kb_model_override,
 * clear_kb_model_override). This preserves the CLI invariant: zero direct service imports.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';
import { WorkspaceConfig } from '../workspace-config.js';

const AUDIT_LOG_RELATIVE = 'docs/handoff/model-config-changes.jsonl';

/**
 * Resolve the audit-log absolute path. Anchored at workspace root so the JSONL lives in
 * the worktree alongside related design docs. Creates the parent dir if missing.
 */
async function resolveAuditLogPath() {
    const ws = await WorkspaceConfig.tryLoad();
    const root = (ws && ws.getWorkspaceRoot && ws.getWorkspaceRoot()) || process.cwd();
    const abs = path.resolve(root, AUDIT_LOG_RELATIVE);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    return abs;
}

/**
 * Append a single JSONL line to the audit log.
 *
 * Schema (per dispatch §2.6):
 *   { date, action, env, app, kb?, before, after, performed_by }
 *
 * `performed_by` is sourced from the wallet credential email if available; if not,
 * we record "unknown" rather than guessing.
 */
async function appendAudit({ action, env, app_id, kb_name, before, after, performed_by }) {
    const line = {
        date: new Date().toISOString(),
        action,
        env: env || null,
        app: app_id,
        ...(kb_name ? { kb: kb_name } : {}),
        before,
        after,
        performed_by: performed_by || 'unknown'
    };
    const auditPath = await resolveAuditLogPath();
    await fs.appendFile(auditPath, JSON.stringify(line) + '\n');
    return { path: auditPath, line };
}

/**
 * Best-effort identity from the API client wallet credentials.
 *
 * Resolution order (mirrors backend's `params.user?.email || user_id || wallet`
 * pattern so audit lines remain comparable whether identity is captured at the
 * CLI or downstream):
 *   1. c.email          — primary, human-readable
 *   2. c.user_email     — alternate spelling some legacy wallet files used
 *   3. c.userId         — Powch's user_id (often the email, but kept distinct
 *                         in the wallet schema; was missing from this chain)
 *   4. c.user_id        — snake_case variant for cross-service consistency
 *   5. c.walletAddress  — 0x-address; durable identity even when email absent
 *   6. c.wallet_address — snake_case variant
 *   7. c.address        — generic last fallback
 * Returns null on any failure; `appendAudit` then writes the literal
 * "unknown" to make the audit line explicitly mark "identity could not be
 * captured" rather than silently dropping the field.
 */
function identityFromApiClient(apiClient) {
    try {
        const c = apiClient.credentials || {};
        return c.email
            || c.user_email
            || c.userId
            || c.user_id
            || c.walletAddress
            || c.wallet_address
            || c.address
            || null;
    } catch {
        return null;
    }
}

/**
 * Pretty-print the resolution chain that will apply going forward.
 * The print is deterministic and includes:
 *   - the chain template
 *   - the current value of App.default_app_model
 *   - the per-level platform defaults (L1..L5)
 *   - per-KB overrides (with explicit "cleared" markers when null/absent)
 */
function printResolution({ app_id, resolution }) {
    if (!resolution) return;
    const dam = resolution.default_app_model === null ? 'null' : `"${resolution.default_app_model}"`;
    const dai = resolution.default_ai_model ? `"${resolution.default_ai_model}"` : 'null';

    console.log(chalk.cyan('\nResolution chain that will apply going forward:'));
    console.log(chalk.gray(`  ${resolution.chain}`));
    console.log(chalk.gray(`  app.default_app_model = ${dam}`));
    console.log(chalk.gray(`  utils.DEFAULT_AI_MODEL = ${dai}`));

    const levels = resolution.intelligence_levels || {};
    const levelKeys = Object.keys(levels).sort();
    if (levelKeys.length > 0) {
        const parts = levelKeys.map(k => `L${k}: ${(levels[k] && levels[k].model) || '?'}`);
        console.log(chalk.gray(`  Per-level: ${parts.join(' | ')}`));
    }

    const overrides = resolution.kb_overrides || {};
    const keys = Object.keys(overrides).sort();
    if (keys.length > 0) {
        const parts = keys.map(k => {
            const v = overrides[k];
            return v === null || v === undefined ? `${k}=cleared` : `${k}="${v}"`;
        });
        console.log(chalk.gray(`  KB overrides: ${parts.join(', ')}`));
    }
}

/**
 * Pretty-print the before/after pair for a field.
 */
function printBeforeAfter({ field, before, after }) {
    const fmt = (v) => (v === null || v === undefined) ? chalk.gray('<absent>') : chalk.white(`"${v}"`);
    console.log(chalk.cyan(`\n${field}:`));
    console.log(`  before: ${fmt(before)}`);
    console.log(`  after:  ${fmt(after)}`);
}

// ============ App: set / clear default_app_model ============

/**
 * descix app set-default-model -a <app_id> -m <model_name> [--clear]
 *
 * HARD-FAIL on missing -a; HARD-FAIL on (no -m AND no --clear); HARD-FAIL on (-m AND --clear).
 * Backend HARD-FAILs on unknown app.
 */
export async function runAppSetDefaultModel(options) {
    const { app: app_id, model: model_name, clear, env } = options || {};

    if (!app_id) throw new Error('Missing required option: -a, --app <app_id>');
    if (!clear && !model_name) {
        throw new Error('Either -m, --model <model_name> or --clear is required.');
    }
    if (clear && model_name) {
        throw new Error('-m and --clear are mutually exclusive.');
    }

    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);

    if (clear) {
        const response = await apiClient.invoke('clear_app_default_model', { app_id });
        const result = response.message || response;

        console.log(chalk.green(`\n✓ Cleared App.default_app_model for ${app_id}`));
        printBeforeAfter({
            field: 'App.default_app_model',
            before: result.before?.default_app_model,
            after: result.after?.default_app_model
        });
        printResolution({ app_id, resolution: result.resolution });

        const audit = await appendAudit({
            action: 'clear_app_default_model',
            env,
            app_id,
            before: result.before,
            after: result.after,
            performed_by: identityFromApiClient(apiClient)
        });
        console.log(chalk.gray(`\nAudit log: ${audit.path}\n`));
        return result;
    }

    const response = await apiClient.invoke('set_app_default_model', { app_id, model_name });
    const result = response.message || response;

    console.log(chalk.green(`\n✓ Set App.default_app_model = "${model_name}" for ${app_id}`));
    printBeforeAfter({
        field: 'App.default_app_model',
        before: result.before?.default_app_model,
        after: result.after?.default_app_model
    });
    printResolution({ app_id, resolution: result.resolution });

    const audit = await appendAudit({
        action: 'set_app_default_model',
        env,
        app_id,
        before: result.before,
        after: result.after,
        performed_by: identityFromApiClient(apiClient)
    });
    console.log(chalk.gray(`\nAudit log: ${audit.path}\n`));
    return result;
}

// ============ KB: set kb_model_override ============

/**
 * descix kb set-override-model -a <app_id> -k <kb_name> -m <model_name>
 *
 * HARD-FAIL on missing -a/-k/-m. Backend HARD-FAILs on unknown app/KB.
 */
export async function runKbSetOverrideModel(options) {
    const { app: app_id, kb: kb_name, model: model_name, env } = options || {};

    if (!app_id) throw new Error('Missing required option: -a, --app <app_id>');
    if (!kb_name) throw new Error('Missing required option: -k, --kb <kb_name>');
    if (!model_name) throw new Error('Missing required option: -m, --model <model_name>');

    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);

    const response = await apiClient.invoke('set_kb_model_override', { app_id, kb_name, model_name });
    const result = response.message || response;

    console.log(chalk.green(`\n✓ Set KB.kb_model_override = "${model_name}" for ${app_id}/${kb_name}`));
    printBeforeAfter({
        field: `KB.kb_model_override (${kb_name})`,
        before: result.before?.kb_model_override,
        after: result.after?.kb_model_override
    });
    printResolution({ app_id, resolution: result.resolution });

    const audit = await appendAudit({
        action: 'set_kb_model_override',
        env,
        app_id,
        kb_name,
        before: result.before,
        after: result.after,
        performed_by: identityFromApiClient(apiClient)
    });
    console.log(chalk.gray(`\nAudit log: ${audit.path}\n`));
    return result;
}

// ============ KB: clear kb_model_override ============

/**
 * descix kb clear-override-model -a <app_id> -k <kb_name>
 *
 * HARD-FAIL on missing -a/-k. Backend HARD-FAILs on unknown app/KB.
 * Backend uses FieldValue.delete() — field GONE after this, not null.
 */
export async function runKbClearOverrideModel(options) {
    const { app: app_id, kb: kb_name, env } = options || {};

    if (!app_id) throw new Error('Missing required option: -a, --app <app_id>');
    if (!kb_name) throw new Error('Missing required option: -k, --kb <kb_name>');

    const apiClient = new DeSciXApiClient();
    await requireAuth(apiClient);

    const response = await apiClient.invoke('clear_kb_model_override', { app_id, kb_name });
    const result = response.message || response;

    console.log(chalk.green(`\n✓ Cleared KB.kb_model_override for ${app_id}/${kb_name}`));
    printBeforeAfter({
        field: `KB.kb_model_override (${kb_name})`,
        before: result.before?.kb_model_override,
        after: result.after?.kb_model_override
    });
    printResolution({ app_id, resolution: result.resolution });

    const audit = await appendAudit({
        action: 'clear_kb_model_override',
        env,
        app_id,
        kb_name,
        before: result.before,
        after: result.after,
        performed_by: identityFromApiClient(apiClient)
    });
    console.log(chalk.gray(`\nAudit log: ${audit.path}\n`));
    return result;
}

// Re-export helpers so tests can exercise them with mocked api clients / fs.
export const _internal = {
    resolveAuditLogPath,
    appendAudit,
    identityFromApiClient,
    printResolution,
    printBeforeAfter,
    AUDIT_LOG_RELATIVE
};

export default {
    runAppSetDefaultModel,
    runKbSetOverrideModel,
    runKbClearOverrideModel
};
