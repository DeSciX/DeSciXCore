/**
 * @descix/platform-api/mcp-tools CLI_VERBS — the published accessor over the generated CLI verb
 * list. Freshness and anchor truth are gated where the list is generated
 * (descix-cli/tests/cli-verbs-generated.test.js); this gates the accessor's contract.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLI_VERBS } from '../src/mcp-tools/index.js';

test('CLI_VERBS is served from the package entry, frozen, one entry per verb path', () => {
    assert.ok(Array.isArray(CLI_VERBS) && CLI_VERBS.length > 0);
    assert.ok(Object.isFrozen(CLI_VERBS) && Object.isFrozen(CLI_VERBS[0]) && Object.isFrozen(CLI_VERBS[0].options));
    const paths = CLI_VERBS.map((v) => v.verbPath);
    assert.equal(new Set(paths).size, paths.length, 'duplicate verbPath');
    assert.deepEqual(paths, [...paths].sort(), 'entries are sorted by verbPath');
});

test('every entry carries exactly the documented shape', () => {
    for (const v of CLI_VERBS) {
        assert.deepEqual(Object.keys(v), ['verbPath', 'description', 'arguments', 'options', 'runbookAnchor'], v.verbPath);
        assert.equal(typeof v.description, 'string', v.verbPath);
        assert.ok(v.runbookAnchor === null || /^#\S+$/.test(v.runbookAnchor), `${v.verbPath}: ${v.runbookAnchor}`);
        for (const o of v.options) assert.deepEqual(Object.keys(o), ['flags', 'description', 'required'], v.verbPath);
        for (const a of v.arguments) assert.deepEqual(Object.keys(a), ['name', 'required', 'variadic', 'description'], v.verbPath);
    }
});
