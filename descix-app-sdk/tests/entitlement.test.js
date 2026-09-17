/**
 * isAppEntitled is THE predicate ChatWidget's legacy `entitled` fallback uses to
 * decide whether the input is unlocked. Run: `node --test tests/entitlement.test.js`
 * from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAppEntitled } from '../src/util/entitlement.js';

const APP = { app_id: 'egpt-frqtl', community_id: 'egpt' };

test('owned app (present in myApps, matching app_id AND community_id) is entitled', () => {
  assert.equal(
    isAppEntitled(APP, [{ app_id: 'egpt-frqtl', community_id: 'egpt' }]),
    true
  );
});

test('an app absent from myApps is not entitled', () => {
  assert.equal(isAppEntitled(APP, [{ app_id: 'other-app', community_id: 'egpt' }]), false);
  assert.equal(isAppEntitled(APP, []), false);
});

test('app_id match alone is not enough — community_id must also match', () => {
  // Guards against a cross-community app_id collision silently granting entitlement.
  assert.equal(
    isAppEntitled(APP, [{ app_id: 'egpt-frqtl', community_id: 'someone-elses-community' }]),
    false
  );
});

test('no app selected is never entitled, regardless of myApps', () => {
  assert.equal(isAppEntitled(null, [{ app_id: 'egpt-frqtl', community_id: 'egpt' }]), false);
  assert.equal(isAppEntitled(undefined, [{ app_id: 'egpt-frqtl', community_id: 'egpt' }]), false);
});

test('a null/undefined/non-array myApps is treated as not-entitled, never throws', () => {
  assert.doesNotThrow(() => isAppEntitled(APP, null));
  assert.doesNotThrow(() => isAppEntitled(APP, undefined));
  assert.equal(isAppEntitled(APP, null), false);
  assert.equal(isAppEntitled(APP, undefined), false);
});

test('an app with no app_id is never entitled', () => {
  assert.equal(isAppEntitled({ community_id: 'egpt' }, [{ app_id: undefined, community_id: 'egpt' }]), false);
});
