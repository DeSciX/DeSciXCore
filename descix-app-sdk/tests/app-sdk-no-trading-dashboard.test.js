/**
 * The Platform TradingDashboard was retired (CEO word a0a430a); the user's portfolio lives in the
 * Powch portfolio tab. The view enum must not carry TRADING_DASHBOARD and no source may emit or
 * reference it. Needs-onboarding purchases open the Powch portfolio tab through the bridge.
 *
 * Run: node --test tests/app-sdk-no-trading-dashboard.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const FILES = walk(SRC).filter((f) => /\.(jsx?|tsx?)$/.test(f));

test('no src file references TRADING_DASHBOARD or trading-dashboard', () => {
    for (const f of FILES) {
        const t = fs.readFileSync(f, 'utf8');
        assert.doesNotMatch(t, /TRADING_DASHBOARD|trading-dashboard/i, f);
    }
});

test('needsOnboarding opens the Powch portfolio tab, never a CHANGE_VIEW', () => {
    const t = fs.readFileSync(path.join(SRC, 'AppContext.jsx'), 'utf8');
    const hits = t.match(/window\.DeSciX\?\.powch\?\.open\?\.\(\{ tab: 'portfolio' \}\)/g) || [];
    assert.equal(hits.length, 2);
});
