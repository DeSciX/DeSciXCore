/**
 * The Firestore database an operator run on `env` must target, MEASURED from the booted service config:
 * FIRESTORE_DATABASE_ID of the service's own defaults-config-<env>.json exactly as @descix/cloud-core
 * loaded it (CloudConfig.envDefaultsLayer(), the per-env layer before any override), and the config's
 * DEPLOY_ENV must be `env`. Never caller-asserted.
 *
 * It reads the CloudConfig of the @descix/cloud-core module instance THIS package resolves: when a process
 * holds two cloud-core copies (a service's node_modules and this package's), the copy this package resolves
 * may hold no booted config, and this refuses naming the copy it resolved. Reads config only, never a database client.
 */
import { getCloudConfig } from '@descix/cloud-core';
import { OPERATOR_ENVS, OperatorGuardError, OperatorGuardRefusal } from './index.js';

function resolvedCloudCore() {
    try {
        return import.meta.resolve('@descix/cloud-core');
    } catch {
        return '@descix/cloud-core (unresolvable)';
    }
}

/**
 * @param {string} env - dev | demo | prod
 * @returns {{ databaseId: string, file: string }}
 * @throws {OperatorGuardError} OPERATOR_ENV_INVALID | OPERATOR_TARGET_INVALID
 */
export function bootedEnvDatabaseId(env) {
    const bad = (why) => new OperatorGuardError(OperatorGuardRefusal.TARGET_INVALID, `${why}. Nothing was read or written.`);
    if (!OPERATOR_ENVS.includes(env)) {
        throw new OperatorGuardError(OperatorGuardRefusal.ENV_INVALID, `env is required and has no default (got ${JSON.stringify(env)}). Name one of: ${OPERATOR_ENVS.join(', ')}.`);
    }
    let cfg;
    try {
        cfg = getCloudConfig();
    } catch (e) {
        throw bad(`The @descix/cloud-core this package resolves (${resolvedCloudCore()}) holds no booted config (${e?.message ?? e}); if the service booted a different copy of @descix/cloud-core, two module instances are in this process`);
    }
    if (cfg.DEPLOY_ENV !== env) throw bad(`The booted service config is DEPLOY_ENV ${JSON.stringify(cfg.DEPLOY_ENV ?? null)}, not ${env}`);
    if (typeof cfg.envDefaultsLayer !== 'function') {
        throw bad(`The @descix/cloud-core this package resolves (${resolvedCloudCore()}) has no CloudConfig.envDefaultsLayer(); it is older than this package needs`);
    }
    const layer = cfg.envDefaultsLayer();
    if (!layer) throw bad(`The booted service loaded no defaults-config-${env}.json, so no Firestore database is known for env ${env}`);
    if (layer.env !== env) throw bad(`The booted service's per-env layer is ${layer.file} (env ${layer.env}), not env ${env}`);
    const id = layer.values?.FIRESTORE_DATABASE_ID;
    if (typeof id !== 'string' || !id) throw bad(`${layer.file} names no FIRESTORE_DATABASE_ID`);
    return Object.freeze({ databaseId: id, file: layer.file });
}
