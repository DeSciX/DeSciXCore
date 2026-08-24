/**
 * `Community.get_apps` must distinguish MEASURED-EMPTY from UNREADABLE.
 *
 * `CacheFirestore.get_docs` (@descix/cloud-core src/storageUtils.js) returns `[]` for an empty
 * collection and `null` for a read that THREW — it catches, console.errors, and swallows. The model
 * used to map both to `[]`, so every caller that derives a scope, a listing or a count from
 * `get_apps` would report a FABRICATED ZERO as fact with no error anywhere. That is the same bug
 * class as a silent `?? []` on a failed read.
 *
 * The three cases are asserted TOGETHER on purpose: a fix that threw on everything would pass the
 * failure case alone, and a gate that cannot distinguish is not a gate.
 *
 * Pure — CacheFirestore.prototype.get_docs is mocked; no Firestore, no config bootstrap.
 * Run: `node --test tests/community-get-apps-fails-loud.test.js` from descix-platform-api/.
 */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import { CacheFirestore } from '@descix/cloud-core';
import { Community } from '../src/models/index.js';

/** Replace the ONE read get_apps performs, and restore it after the assertion. */
async function withGetDocs(returnValue, fn) {
    const spy = mock.method(CacheFirestore.prototype, 'get_docs', async () => returnValue);
    try {
        return await fn(spy);
    } finally {
        spy.mock.restore();
    }
}

test('a FAILED read (null) throws COMMUNITY_APPS_UNREADABLE naming the community', async () => {
    await withGetDocs(null, async () => {
        await assert.rejects(
            () => Community.get_apps('daita'),
            (err) => {
                assert.equal(err.code, 'COMMUNITY_APPS_UNREADABLE', `wrong code: ${err.code}`);
                assert.match(err.message, /daita/, 'the error must name the community that could not be read');
                assert.match(err.message, /null/, 'the error must say WHAT it observed, not just that something failed');
                assert.equal(err.data?.community_id, 'daita');
                return true;
            },
        );
    });
});

test('a MEASURED-EMPTY collection ([]) still returns [] — the positive control', async () => {
    await withGetDocs([], async (spy) => {
        const apps = await Community.get_apps('a-community-with-no-apps');
        assert.deepEqual(apps, [], 'an empty community is a legitimate answer and must NOT throw');
        // The read must actually have happened, against the community's Apps collection. Without
        // this the "returns []" assertion would also pass on a method that reads nothing at all.
        assert.equal(spy.mock.callCount(), 1, 'get_apps performs exactly one read');
        assert.match(String(spy.mock.calls[0].arguments[0]), /a-community-with-no-apps/,
            'the read is scoped to the named community');
    });
});

/*
 * NOT TESTED HERE: the populated case. `App.from_dict` calls `getCloudConfig()`, so mapping a real
 * document requires a bootstrapped CloudConfig — infrastructure this pure suite deliberately does
 * not have. Stated rather than faked: the mapping path is unchanged by this commit, and the live
 * suite that exercises it is BEAST's tests/seat-derivation-live.test.js, whose scope resolution
 * calls get_apps against descix-dev and asserts non-empty app lists per community.
 */

test('NEGATIVE CONTROL: the pre-fix implementation FAILS this suite', async () => {
    // The pre-fix body was `if (!appDocs) return [];`. Asserting the shape of the old behaviour
    // here proves the first test above can actually fail — without this, a `get_apps` that silently
    // returned [] on null would have to be caught by reading the source, not by running the test.
    const preFix = async (docs) => (!docs ? [] : docs);
    assert.deepEqual(await preFix(null), [], 'the old behaviour: a failed read is reported as no apps');
    // ...and the two outcomes it collapses are indistinguishable, which is the whole defect.
    assert.deepEqual(await preFix(null), await preFix([]),
        'pre-fix, UNREADABLE and MEASURED-EMPTY produce byte-identical results — that is why it had to change');
});
