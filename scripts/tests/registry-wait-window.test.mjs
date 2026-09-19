/**
 * The post-publish registry wait is sized from MEASURED propagation.
 *
 * 2026-09-18: all four releases (app-sdk 0.1.10, cli 1.0.13, 1.0.14, 1.0.15) failed a 54-second
 * wait (10 × 6 s) and passed on rerun. npm took up to 8.7 minutes to list a new version
 * (@descix/app-sdk@0.1.10: published 18:15:32Z, visible 18:24:13Z). A gate that fails on every
 * correct publish trains blind reruns — the one habit a gate must never teach.
 *
 * Run: node --test scripts/tests/registry-wait-window.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGISTRY_WAIT_ATTEMPTS, REGISTRY_WAIT_DELAY_MS, waitForRegistry } from '../check-published-install.mjs';

const WORST_MEASURED_MS = (8 * 60 + 41) * 1000;

test('the wait window covers the worst measured propagation with margin', () => {
    const windowMs = REGISTRY_WAIT_ATTEMPTS * REGISTRY_WAIT_DELAY_MS;
    assert.ok(windowMs >= WORST_MEASURED_MS * 1.5,
        `window ${windowMs / 60000} min vs measured ${(WORST_MEASURED_MS / 60000).toFixed(1)} min`);
});

test('NEGATIVE CONTROL: the old 54-second window would fail this test', () => {
    const oldWindowMs = 10 * 6000;
    assert.ok(!(oldWindowMs >= WORST_MEASURED_MS * 1.5), 'if this passes, the assertion above measures nothing');
});

test('the defaults ARE the named constants, not a second copy of the numbers', () => {
    assert.match(String(waitForRegistry), /attempts = REGISTRY_WAIT_ATTEMPTS, delayMs = REGISTRY_WAIT_DELAY_MS/);
});
