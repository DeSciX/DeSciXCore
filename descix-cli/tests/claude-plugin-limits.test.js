/**
 * lib/core/ClaudePluginLimits.js is the one owner of the limits claude.ai enforces when a plugin
 * syncs to it (and `claude plugin validate` does not check). The conformance block below is driven
 * by the exported CLAUDE_PLUGIN_LIMITS table: a rule added without a fixture builder for its
 * surface fails here. The hand fixtures pin the measured facts (500 characters; no < or > in a
 * skill or agent description) and the YAML forms a description can take.
 *
 * Run: `node --test tests/claude-plugin-limits.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  CLAUDE_PLUGIN_LIMITS,
  validatePluginManifest,
  validateMarketplace,
  validateFrontmatterDescription,
  validatePluginDir,
  parseFrontmatter,
} from '../lib/core/ClaudePluginLimits.js';
import { scaffoldAppRepo } from '../lib/app-scaffold.js';

async function tmp(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-plugin-limits-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
async function put(root, rel, content) {
  const f = path.join(root, rel);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  return f;
}
const md = (description) => `---\nname: x\ndescription: ${JSON.stringify(description)}\n---\n\nbody <ok> in the body\n`;
const ruleIds = (vs) => vs.map((v) => v.rule);
const unreadable = { code: 'CLAUDE_PLUGIN_UNREADABLE' };

// One fixture builder per surface: [validate a value in memory, lay the value out as a plugin dir].
const SURFACE_FIXTURES = {
  plugin: {
    validate: (d) => validatePluginManifest({ name: 'p', description: d }, { file: 'plugin.json' }),
    layout: (root, d) => put(root, '.claude-plugin/plugin.json', { name: 'p', description: d }),
  },
  marketplace: {
    validate: (d) => validateMarketplace({ name: 'm', plugins: [{ name: 'p', source: 'x', description: d }] }, { file: 'marketplace.json' }),
    layout: (root, d) => put(root, '.claude-plugin/marketplace.json', { name: 'm', plugins: [{ name: 'p', source: 'github:o/r', description: d }] }),
  },
  skill: {
    validate: (d) => validateFrontmatterDescription(md(d), { file: 'SKILL.md', kind: 'skill' }),
    layout: (root, d) => put(root, 'skills/s/SKILL.md', md(d)),
  },
  agent: {
    validate: (d) => validateFrontmatterDescription(md(d), { file: 'a.md', kind: 'agent' }),
    layout: (root, d) => put(root, 'agents/a.md', md(d)),
  },
};

// ---------------------------------------------------------------------------------------------
// Conformance, driven by the exported table
// ---------------------------------------------------------------------------------------------

test('every rule in the table is well-formed and has a fixture builder for its surface', () => {
  assert.ok(CLAUDE_PLUGIN_LIMITS.length > 0);
  assert.ok(Object.isFrozen(CLAUDE_PLUGIN_LIMITS));
  const ids = new Set();
  for (const r of CLAUDE_PLUGIN_LIMITS) {
    assert.ok(!ids.has(r.id), `duplicate rule id ${r.id}`);
    ids.add(r.id);
    for (const k of ['id', 'surface', 'field', 'check', 'limit', 'message']) assert.ok(r[k], `${r.id} lacks ${k}`);
    assert.ok(SURFACE_FIXTURES[r.surface], `no fixture builder for surface '${r.surface}' (rule ${r.id})`);
    if (r.check === 'max-length') assert.ok(Number.isInteger(r.limit) && r.limit > 0);
    else if (r.check === 'forbidden-chars') assert.ok(Array.isArray(r.limit) && r.limit.every((c) => typeof c === 'string' && c.length === 1));
    else assert.fail(`rule ${r.id} has unknown check ${r.check}`);
  }
});

for (const rule of CLAUDE_PLUGIN_LIMITS) {
  const fx = () => SURFACE_FIXTURES[rule.surface];
  if (rule.check === 'max-length') {
    test(`conformance ${rule.id}: exactly ${rule.limit} passes, ${rule.limit + 1} is a violation (in memory and via the dir walk)`, async (t) => {
      assert.deepEqual(fx().validate('a'.repeat(rule.limit)), []);
      const vs = fx().validate('a'.repeat(rule.limit + 1));
      assert.deepEqual(ruleIds(vs), [rule.id]);
      assert.equal(vs[0].length, rule.limit + 1);
      assert.equal(vs[0].limit, rule.limit);
      assert.match(vs[0].message, new RegExp(`${rule.limit + 1} characters; the limit is ${rule.limit}`));

      const ok = await tmp(t);
      await fx().layout(ok, 'a'.repeat(rule.limit));
      assert.deepEqual(await validatePluginDir(ok), []);
      const bad = await tmp(t);
      const file = await fx().layout(bad, 'a'.repeat(rule.limit + 1));
      const dvs = await validatePluginDir(bad);
      assert.deepEqual(ruleIds(dvs), [rule.id]);
      assert.equal(dvs[0].file, file, 'the violation names the file');
    });
  } else {
    for (const c of rule.limit) {
      test(`conformance ${rule.id}: a description holding '${c}' is a violation, a clean one passes (in memory and via the dir walk)`, async (t) => {
        assert.deepEqual(fx().validate('plain text, no tags'), []);
        const vs = fx().validate(`use when a ${c} b`);
        assert.deepEqual(ruleIds(vs), [rule.id]);
        assert.deepEqual(vs[0].offending, [c]);
        assert.deepEqual(vs[0].limit, rule.limit);
        assert.equal(vs[0].field, rule.field);

        const ok = await tmp(t);
        await fx().layout(ok, 'plain text, no tags');
        assert.deepEqual(await validatePluginDir(ok), []);
        const bad = await tmp(t);
        const file = await fx().layout(bad, `use when a ${c} b`);
        const dvs = await validatePluginDir(bad);
        assert.deepEqual(ruleIds(dvs), [rule.id]);
        assert.equal(dvs[0].file, file);
      });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// The measured facts, pinned
// ---------------------------------------------------------------------------------------------

test('the measured limits: 500 characters for plugin.json and marketplace entries; < and > for skills and agents', () => {
  const by = Object.fromEntries(CLAUDE_PLUGIN_LIMITS.map((r) => [r.surface, r]));
  assert.equal(by.plugin.limit, 500);
  assert.equal(by.marketplace.limit, 500);
  assert.deepEqual([...by.skill.limit], ['<', '>']);
  assert.deepEqual([...by.agent.limit], ['<', '>']);
});

test('plugin.json description: 500 characters passes, 501 is reported with file, field, length and limit', () => {
  assert.deepEqual(validatePluginManifest({ description: 'x'.repeat(500) }, { file: 'p.json' }), []);
  const [v, ...rest] = validatePluginManifest({ description: 'x'.repeat(501) }, { file: 'p.json' });
  assert.equal(rest.length, 0);
  assert.equal(v.file, 'p.json');
  assert.equal(v.field, 'description');
  assert.equal(v.length, 501);
  assert.equal(v.limit, 500);
});

test('marketplace: only the over-limit entry is reported, named by index and plugin name', () => {
  const vs = validateMarketplace({
    plugins: [{ name: 'a', description: 'y'.repeat(500) }, { name: 'b', description: 'y'.repeat(501) }],
  }, { file: 'm.json' });
  assert.equal(vs.length, 1);
  assert.equal(vs[0].field, 'plugins[1] (b).description');
  assert.equal(vs[0].length, 501);
});

// ---------------------------------------------------------------------------------------------
// YAML forms of a frontmatter description
// ---------------------------------------------------------------------------------------------

const skill = (fm) => `---\nname: s\n${fm}\nallowed-tools:\n  - Read\n---\n\n# Body may hold <tags>\n`;
const check = (text) => validateFrontmatterDescription(text, { file: 'SKILL.md', kind: 'skill' });

test('folded `description: >` — the YAML indicator is not an offending character', () => {
  assert.deepEqual(check(skill('description: >\n  Use this skill when the user\n  asks for a summary.')), []);
  assert.deepEqual(check(skill('description: >-\n  Folded and stripped.')), []);
  assert.deepEqual(check(skill('description: >2\n  Explicit indent.')), []);
  assert.deepEqual(check(skill('description: |\n  Literal block,\n  two lines.')), []);
});

test('folded `description: >` — a > or < INSIDE the value is offending', () => {
  const gt = check(skill('description: >\n  Use when x\n  > y holds.'));
  assert.deepEqual(gt.map((v) => v.offending), [['>']]);
  const lt = check(skill('description: >-\n  Use when x\n  < y holds.'));
  assert.deepEqual(lt.map((v) => v.offending), [['<']]);
});

test('multi-line plain, single- and double-quoted descriptions are read in full', () => {
  assert.deepEqual(check(skill('description: first line\n  second line has a < b')).map((v) => v.offending), [['<']]);
  assert.deepEqual(check(skill("description: 'it''s\n  on line two: a > b'")).map((v) => v.offending), [['>']]);
  assert.deepEqual(check(skill('description: "escaped \\u003c here"')).map((v) => v.offending), [['<']]);
  assert.deepEqual(check(skill('description: "clean # not a comment"')), []);
  assert.deepEqual(check(skill('description: clean # a comment with <x>')), [], 'a YAML comment is not the value');
});

test('the parser decodes folded, literal and quoted scalars to their YAML values', () => {
  const v = (fm) => parseFrontmatter(`---\n${fm}\n---\n`, { file: 'f' }).get('description').value;
  assert.equal(v('description: >\n  a\n  b\n\n  c'), 'a b\nc\n');
  assert.equal(v('description: >-\n  a\n  b'), 'a b');
  assert.equal(v('description: |\n  a\n   b'), 'a\n b\n');
  assert.equal(v('description: "a\n  b"'), 'a b');
  assert.equal(v("description: 'a''b'"), "a'b");
  assert.equal(v('description: plain\n  more'), 'plain more');
});

test('a 501-character folded description counts the decoded value, not the source lines', () => {
  const body = `description: >-\n  ${'a'.repeat(250)}\n  ${'b'.repeat(250)}`;
  assert.equal(parseFrontmatter(`---\n${body}\n---\n`, { file: 'f' }).get('description').value.length, 501);
});

// ---------------------------------------------------------------------------------------------
// Fail loud: what cannot be measured never passes
// ---------------------------------------------------------------------------------------------

test('unreadable inputs throw CLAUDE_PLUGIN_UNREADABLE instead of passing', async (t) => {
  assert.throws(() => check('# no frontmatter\n'), unreadable);
  assert.throws(() => check('---\ndescription: x\n'), unreadable);
  assert.throws(() => check('---\ndescription:\n  nested: map\n---\n'), unreadable);
  assert.throws(() => check('---\ndescription: [a, b]\n---\n'), unreadable);
  assert.throws(() => check('---\ndescription: "never closed\n---\n'), unreadable);
  assert.throws(() => check('---\ndescription: a\ndescription: b\n---\n'), unreadable);
  assert.throws(() => validatePluginManifest({ description: 42 }, { file: 'p' }), unreadable);
  assert.throws(() => validateMarketplace({ plugins: {} }, { file: 'm' }), unreadable);
  assert.throws(() => validateFrontmatterDescription(md('x'), { file: 'f', kind: 'command' }), /kind must be/);
  const empty = await tmp(t);
  await assert.rejects(validatePluginDir(empty), unreadable);
  const badJson = await tmp(t);
  await put(badJson, '.claude-plugin/plugin.json', '{ not json');
  await assert.rejects(validatePluginDir(badJson), unreadable);
});

// ---------------------------------------------------------------------------------------------
// The directory walk
// ---------------------------------------------------------------------------------------------

test('validatePluginDir reports every surface at once and walks marketplace-listed local plugins', async (t) => {
  const root = await tmp(t);
  await put(root, '.claude-plugin/marketplace.json', {
    name: 'm', plugins: [{ name: 'inner', source: './plugins/inner', description: 'z'.repeat(501) }],
  });
  await put(root, 'plugins/inner/.claude-plugin/plugin.json', { name: 'inner', description: 'z'.repeat(501) });
  await put(root, 'plugins/inner/skills/one/SKILL.md', skill('description: >\n  fine'));
  await put(root, 'plugins/inner/skills/two/SKILL.md', skill('description: >\n  a <b> c'));
  await put(root, 'plugins/inner/agents/ag.md', md('x > y'));
  const vs = await validatePluginDir(root);
  assert.deepEqual(ruleIds(vs).sort(), [
    'agent-description-no-angle-brackets',
    'marketplace-plugin-description-max-length',
    'plugin-description-max-length',
    'skill-description-no-angle-brackets',
  ]);
  assert.ok(vs.find((v) => v.rule.startsWith('skill')).file.endsWith(path.join('skills', 'two', 'SKILL.md')));
});

test('validatePluginDir follows custom skills/agents paths declared in plugin.json', async (t) => {
  const root = await tmp(t);
  await put(root, '.claude-plugin/plugin.json', { name: 'p', skills: './extra-skills', agents: ['./extra/agent.md'] });
  await put(root, 'extra-skills/s/SKILL.md', skill('description: has <x>'));
  await put(root, 'extra/agent.md', md('has >'));
  assert.deepEqual(ruleIds(await validatePluginDir(root)).sort(), ['agent-description-no-angle-brackets', 'skill-description-no-angle-brackets']);
});

test('a custom skills/agents path plugin.json declares must exist and be a path string or an array of them', async (t) => {
  const missing = await tmp(t);
  await put(missing, '.claude-plugin/plugin.json', { name: 'p', skills: './nope' });
  await assert.rejects(validatePluginDir(missing), unreadable);
  const missingAgent = await tmp(t);
  await put(missingAgent, '.claude-plugin/plugin.json', { name: 'p', agents: ['./nope.md'] });
  await assert.rejects(validatePluginDir(missingAgent), unreadable);
  const badType = await tmp(t);
  await put(badType, '.claude-plugin/plugin.json', { name: 'p', agents: ['./a.md', 7] });
  await put(badType, 'a.md', md('fine'));
  await assert.rejects(validatePluginDir(badType), unreadable);
});

// ---------------------------------------------------------------------------------------------
// The app init scaffold consumes the owner
// ---------------------------------------------------------------------------------------------

const STUB_OVERHEAD = ', an app of the  community on DeSciX.'.length;

test('scaffold: an appId whose stub description is exactly 500 characters scaffolds', async (t) => {
  const root = await tmp(t);
  const communityId = 'c';
  const appId = 'a'.repeat(500 - STUB_OVERHEAD - communityId.length);
  await scaffoldAppRepo(root, { appId, communityId });
  const plugin = JSON.parse(await fs.readFile(path.join(root, '.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(plugin.description.length, 500);
});

test('scaffold: an appId whose stub description is 501 characters is REFUSED and nothing is written', async (t) => {
  const root = await tmp(t);
  const communityId = 'c';
  const appId = 'a'.repeat(501 - STUB_OVERHEAD - communityId.length);
  await assert.rejects(scaffoldAppRepo(root, { appId, communityId }), (e) => {
    assert.equal(e.code, 'CLAUDE_PLUGIN_LIMIT');
    assert.match(e.message, /501 characters; the limit is 500/);
    return true;
  });
  assert.deepEqual(await fs.readdir(root), [], 'nothing was written');
});

const ROOT_SKIP = typeof process.getuid === 'function' && process.getuid() === 0
  ? 'running as root: chmod 000 does not stop root from reading, so EACCES cannot be produced'
  : false;

test('a file the process cannot read throws CLAUDE_PLUGIN_UNREADABLE naming the file and EACCES', { skip: ROOT_SKIP }, async (t) => {
  const root = await tmp(t);
  await put(root, '.claude-plugin/plugin.json', { name: 'p', description: 'fine' });
  const skill = path.join(root, 'skills/s/SKILL.md');
  await put(root, 'skills/s/SKILL.md', md('fine'));
  await fs.chmod(skill, 0o000);
  await assert.rejects(validatePluginDir(root), (e) => {
    assert.equal(e.code, 'CLAUDE_PLUGIN_UNREADABLE');
    assert.ok(e.message.includes(skill), e.message);
    assert.match(e.message, /EACCES/);
    return true;
  });
});

test('a SKILL.md that is a directory throws CLAUDE_PLUGIN_UNREADABLE naming EISDIR', async (t) => {
  const root = await tmp(t);
  await fs.mkdir(path.join(root, 'skills/s/SKILL.md'), { recursive: true });
  await assert.rejects(validatePluginDir(root), (e) => {
    assert.equal(e.code, 'CLAUDE_PLUGIN_UNREADABLE');
    assert.match(e.message, /SKILL\.md: read failed with EISDIR/);
    return true;
  });
});
