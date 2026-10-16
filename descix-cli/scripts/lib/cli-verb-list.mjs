/**
 * cli-verb-list.mjs — THE ONE OWNER of "build the CLI verb list from the live commander tree".
 *
 * Runs bin/descix.js in a child process with scripts/lib/cli-verb-tree-hook.mjs preloaded (see
 * that file), from an empty temp directory with an empty HOME and no DESCIX_* variables, so no
 * workspace, global config or origin override can colour a description. Returns the parsed
 * list. Consumed by scripts/generate-cli-verbs.mjs (writes/checks the generated file) and
 * tests/cli-verbs-generated.test.js (regenerate-and-diff).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOOK = path.join(CLI_ROOT, 'scripts', 'lib', 'cli-verb-tree-hook.mjs');
const BIN = path.join(CLI_ROOT, 'bin', 'descix.js');

/** Where the generated list lives: @descix/platform-api/mcp-tools, the package Cloud consumes. */
export const CLI_VERBS_GENERATED_PATH = path.resolve(
  CLI_ROOT, '..', 'descix-platform-api', 'src', 'mcp-tools', 'cli-verbs.generated.json'
);

/** The committed file's exact bytes for a list. */
export function serializeCliVerbs(verbs) {
  return JSON.stringify(verbs, null, 2) + '\n';
}

/** @returns {{ verbPath: string, description: string, arguments: object[], options: object[], runbookAnchor: string|null }[]} */
export function buildCliVerbList() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-cli-verbs-'));
  try {
    const out = path.join(scratch, 'tree.json');
    const home = path.join(scratch, 'home');
    const cwd = path.join(scratch, 'cwd');
    fs.mkdirSync(home);
    fs.mkdirSync(cwd);
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('DESCIX_')));
    Object.assign(env, { HOME: home, DESCIX_CLI_VERB_TREE_OUT: out, NO_COLOR: '1' });
    const run = spawnSync(process.execPath, ['--import', pathToFileURL(HOOK).href, BIN, '--admin'], {
      cwd, env, encoding: 'utf8', timeout: 60_000,
    });
    if (run.status !== 0 || !fs.existsSync(out)) {
      throw new Error(
        `cli-verb-list: bin/descix.js did not dump its commander tree (exit ${run.status}, signal ${run.signal}).\n` +
        `stderr:\n${run.stderr}\nstdout:\n${run.stdout}`
      );
    }
    const verbs = JSON.parse(fs.readFileSync(out, 'utf8'));
    if (!Array.isArray(verbs) || verbs.length < 20) {
      throw new Error(`cli-verb-list: the dumped tree has ${Array.isArray(verbs) ? verbs.length : 'no'} verbs — the walk broke`);
    }
    return verbs;
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
