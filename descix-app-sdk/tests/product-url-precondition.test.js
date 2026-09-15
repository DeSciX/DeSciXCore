/**
 * THE OWNER ENFORCES ITS OWN PRECONDITION.
 *
 * getProductUrl ended `return resolveAgainstCurrentOrigin(product.ip_site_gcs_path_url)` with no
 * guard on `product`, carrying an unenforced, undocumented precondition that FIVE call sites
 * re-derived by hand. Four were right. The fifth — the community lobby — did not guard at all,
 * twice, while using optional chaining on the very next term for the same value.
 *
 * Measured on PRODUCTION 2026-09-15: the egpt community record carries icon_url "" and
 * ip_site_gcs_path_url null. BOTH FALSY. So the lobby's four-term fallback chain fell through to
 * getProductUrl(AppData.myApps[0]) against an EMPTY apps array, and a brand-new user owns zero
 * apps by construction — the CEO hit an error boundary on his first install. DEV could not
 * reproduce it because DEV's egpt record has icon_url SET: the divergence was in DATA, not code.
 *
 * This file drives the RULE, which lives in productUrl.js precisely so it can be tested with no
 * DOM and no JSX loader. The workspace-aware wrapper (AppData.hasProductSite) and the lobby call
 * site are driven by the Cloud-side gate, which bundles this module and runs the real expression.
 *
 * Run: `node --test tests/product-url-precondition.test.js` from descix-app-sdk/.
 *
 * COVERAGE BOUNDARY, stated on GREEN as well as RED: this file reads the STORED-PATH rule and the
 * missing-product precondition ONLY. It does NOT read the dev workspaceProducts indirection, does
 * NOT render any component, and nothing runs it automatically — it runs under `npm test` in this
 * package and nowhere else.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
// Namespace import ON PURPOSE: it links against the PRE-FIX tree too, so this gate fails on
// BEHAVIOUR ("the owner does not enforce its precondition") rather than dying at link time.
// A gate that cannot even load on the broken tree cannot tell you what is broken about it.
import * as productUrl from '../src/util/productUrl.js';

// The PRODUCTION record, verbatim in the two fields that decide this, measured 2026-09-15.
const PROD_EGPT_COMMUNITY = { community_id: 'egpt', icon_url: '', ip_site_gcs_path_url: null };
// A product that DOES have a site — the working path that must not regress.
const APP_WITH_SITE = { app_id: 'egpt-frqtl', ip_site_gcs_path_url: 'https://dev.descix.net/dev/egpt-frqtl/site/index.html' };

test('the owner publishes its precondition and its predicate at all', () => {
    assert.equal(typeof productUrl.assertProductPresent, 'function',
        'productUrl.js must own assertProductPresent — without it every caller re-derives the guard');
    assert.equal(typeof productUrl.hasStoredSitePath, 'function',
        'productUrl.js must own hasStoredSitePath — this is the predicate the five call sites re-derived');
});

test('a missing product FAILS LOUD, naming the caller and what to call instead', () => {
    for (const absent of [undefined, null]) {
        assert.throws(
            () => productUrl.assertProductPresent(absent, 'AppData.getProductUrl'),
            (err) => {
                assert.ok(err instanceof TypeError, 'must be a TypeError');
                assert.match(err.message, /AppData\.getProductUrl/, 'must name the calling symbol');
                assert.match(err.message, /hasProductSite/, 'must name the predicate to call instead');
                assert.match(err.message, /no default to fall back to/,
                    'must say explicitly that it is not defaulting — no hardcoded fallback');
                return true;
            },
            `assertProductPresent must throw on ${String(absent)}`
        );
    }
});

test('a present product passes through untouched — the guard is not a filter', () => {
    assert.equal(productUrl.assertProductPresent(APP_WITH_SITE, 'x'), APP_WITH_SITE);
    // An empty object is PRESENT. "No site path" is a different question from "no product",
    // and conflating them is how a guard starts swallowing real products.
    assert.deepEqual(productUrl.assertProductPresent({}, 'x'), {});
});

test('hasStoredSitePath is TOTAL over a missing product — false is an answer, not a throw', () => {
    assert.equal(productUrl.hasStoredSitePath(undefined), false);
    assert.equal(productUrl.hasStoredSitePath(null), false);
});

test('THE ROW: the production egpt record reports NO SITE rather than crashing', () => {
    // Pre-fix, this record's falsy fields are what drove execution into the undefined dereference.
    assert.equal(productUrl.hasStoredSitePath(PROD_EGPT_COMMUNITY), false,
        'the measured production record must report no site');
    // FIXTURE SELF-CHECK: if these fields were not actually falsy the fixture could not exhibit
    // the failure, and this whole file would be green against a state that never crashed.
    assert.ok(!PROD_EGPT_COMMUNITY.icon_url, 'fixture must carry a FALSY icon_url or it measures nothing');
    assert.ok(!PROD_EGPT_COMMUNITY.ip_site_gcs_path_url, 'fixture must carry a FALSY site path or it measures nothing');
});

test('an empty or whitespace path is NOT a site — the .trim() check the call sites hand-wrote', () => {
    assert.equal(productUrl.hasStoredSitePath({ ip_site_gcs_path_url: '' }), false);
    assert.equal(productUrl.hasStoredSitePath({ ip_site_gcs_path_url: '   ' }), false);
    assert.equal(productUrl.hasStoredSitePath({ ip_site_gcs_path_url: undefined }), false);
    assert.equal(productUrl.hasStoredSitePath({ ip_site_gcs_path_url: null }), false);
    // Non-string junk must not be treated as a URL just because it is truthy.
    assert.equal(productUrl.hasStoredSitePath({ ip_site_gcs_path_url: 42 }), false);
});

test('G4 WORKING PATH: a product that HAS a site reports true and still resolves', () => {
    assert.equal(productUrl.hasStoredSitePath(APP_WITH_SITE), true,
        'a real app with a real site MUST still report true — a guard that says false here breaks every working install');
    const url = productUrl.resolveAgainstCurrentOrigin(APP_WITH_SITE.ip_site_gcs_path_url, 'https://dev.descix.net');
    assert.equal(url, 'https://dev.descix.net/dev/egpt-frqtl/site/index.html');
});

test('NEGATIVE CONTROL: the pre-fix dereference is what produced the CEO\'s exact message', () => {
    // Reproduces the ORIGINAL unguarded body against an absent product, proving the fixture shape
    // really does produce "of undefined" — the one word that separates this bug from the
    // null-community bug, which reads "of null" and is NOT what the CEO saw.
    const preFixBody = (product) => productUrl.resolveAgainstCurrentOrigin(product.ip_site_gcs_path_url);
    assert.throws(() => preFixBody(undefined), (err) => {
        assert.match(err.message, /Cannot read properties of undefined/,
            'the pre-fix red must say "of undefined" — "of null" means the wrong fixture');
        assert.match(err.message, /ip_site_gcs_path_url/);
        return true;
    });
    // And the discriminator itself, pinned so it cannot quietly rot:
    assert.throws(() => preFixBody(null), /Cannot read properties of null/);
});
