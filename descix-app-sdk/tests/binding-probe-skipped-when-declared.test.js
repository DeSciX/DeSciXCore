/**
 * The origin binding-probe is NOT made when the app declares itself standalone.
 *
 * WHY THIS TEST EXISTS: powch.dev.descix.net logged a 404 for /__descix/app-binding.json on every
 * single load. Diagnosed 2026-08-22 — nothing was reaching across origins (appBinding.js requests
 * a RELATIVE path, so it always asks the current document's own origin); the POWCH bundle was
 * probing ITSELF, and the edge correctly declined because powch is SHELL_EXEMPT by design
 * (ZK-SSO isolation). Functionally harmless — fetchAppBinding treats non-ok as "no binding" — but
 * a browser logs the 404 and no application code can suppress that. The only way to remove the
 * noise is to not make the request.
 *
 * THE RULE PINNED HERE: an app that BUILDS ITSELF standalone declares its identity at its own
 * mount, and that is more local truth than an origin probe. So when `standalone` is declared, the
 * probe is skipped.
 *
 * THE ACCEPTED TRADE, pinned deliberately in a test name below: this does NOT fail loud on a
 * declared-vs-served conflict — it makes that conflict UNOBSERVABLE by construction. The
 * misconfiguration it hides is "an edge serves a binding for an origin whose app self-declares",
 * which SHELL_EXEMPT prevents for the only live case. Anyone re-reading this later should see the
 * trade stated rather than rediscover it as a bug. (VISION ruling A, 2026-08-22.)
 *
 * Scope note: SdkInitializer is a React component and this repo has no DOM test harness, so these
 * assertions target the DECISION — "given a declared standalone id, is the probe called?" — via
 * the same expression the call site uses. The source-shape assertion at the end is what keeps
 * this honest if the call site is ever rewritten.
 *
 * Run: cd descix-app-sdk && node --test "tests/binding-probe-skipped-when-declared.test.js"
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fetchAppBinding, APP_BINDING_PATH } from '../src/util/appBinding.js';

/** The call site's decision, isolated: probe only when the app did NOT declare itself. */
async function resolveServedBinding({ standalone, appId, probe }) {
    const declaredAppId = standalone ? appId : null;
    return declaredAppId ? null : await probe();
}

test('a self-declaring standalone app does NOT probe its origin', async () => {
    let probes = 0;
    const binding = await resolveServedBinding({
        standalone: true,
        appId: 'powch',
        probe: async () => { probes += 1; return null; },
    });
    assert.equal(probes, 0, 'the request that produced a 404 on every powch load must not be made at all');
    assert.equal(binding, null);
});

test('a generic bundle with NO declared identity still probes — the store path is unchanged', async () => {
    let probes = 0;
    await resolveServedBinding({
        standalone: false,
        appId: undefined,
        probe: async () => { probes += 1; return { mode: 'standalone', appId: 'egpt-godsworld' }; },
    });
    assert.equal(probes, 1,
        'NEGATIVE CONTROL: descix.net and `descix serve` rely on this probe — skipping it there would break how one bundle boots three ways');
});

test('ACCEPTED TRADE: a declared-vs-served conflict is made unobservable, not fail-loud', async () => {
    // If the origin DID serve a binding naming a different app, we never learn it. That is the
    // ruled trade, not an oversight: SHELL_EXEMPT prevents the only live case.
    let probes = 0;
    const binding = await resolveServedBinding({
        standalone: true,
        appId: 'powch',
        probe: async () => { probes += 1; return { mode: 'standalone', appId: 'SOMETHING-ELSE' }; },
    });
    assert.equal(probes, 0);
    assert.equal(binding, null, 'the conflicting served binding is never fetched, so it cannot be honoured OR reported');
});

test('the call site really is wired this way (guards against a rewrite that re-adds the fetch)', () => {
    const src = readFileSync(new URL('../src/util/SdkInitializer.jsx', import.meta.url), 'utf8');
    // Order matters: declaredAppId must be computed BEFORE the probe decision, or the skip is dead code.
    const declIdx = src.indexOf('const declaredAppId =');
    const probeIdx = src.indexOf('const servedBinding =');
    assert.ok(declIdx > -1 && probeIdx > -1, 'call site not found — this test has gone stale, fix it rather than deleting it');
    assert.ok(declIdx < probeIdx, 'declaredAppId must be resolved before the probe decision');
    assert.match(src.slice(probeIdx, probeIdx + 200), /declaredAppId\s*\?\s*null\s*:\s*await fetchAppBinding\(\)/,
        'the probe must remain conditional on declaredAppId — an unconditional fetchAppBinding() here resurrects the per-load 404');
});

test('the probe path itself is unchanged and still same-origin relative', () => {
    assert.equal(APP_BINDING_PATH, '/__descix/app-binding.json');
    assert.ok(APP_BINDING_PATH.startsWith('/') && !APP_BINDING_PATH.startsWith('//'),
        'relative-to-own-origin is why this was never a cross-origin reach into powch');
    assert.equal(typeof fetchAppBinding, 'function');
});
