#!/usr/bin/env node
/**
 * generate-app-sdk-copies — the ONE owner of the app-side `DeSciXAppSDK.js`.
 *
 * ── The drift this deletes ───────────────────────────────────────────────────
 * `DeSciXAppSDK.js` existed in three hand-maintained copies across three repos with
 * no generation step and no test tying them together, so they silently disagreed:
 * when `.chat` / `.view` / `ready()` were added under ws-c3-bridge-media-handle, only
 * the CLI scaffold got them. The other two kept a deleted placebo API and were, by
 * then, byte-identical to each other and stale against the one that mattered.
 *
 * Copies do not stay in sync because someone remembers. They stay in sync because
 * they are GENERATED and a check FAILS LOUD when they are not.
 *
 * ── What is generated from what ──────────────────────────────────────────────
 *   SOURCE  templates/DeSciXAppSDK.template.js   (the app-side proxy)
 *         + src/util/bridgeResolver.js           (inlined at __BRIDGE_RESOLVER__)
 *   OUTPUT  descix-cli/templates/scaffolds/site/DeSciXAppSDK.js   [DeSciX_Core]
 *           packages/client-core/src/DeSciXAppSDK.js              [DeSciX_Powch]
 *           apps/daita-splitviewdemo/site/DeSciXAppSDK.js         [Unkamon]
 *
 * The resolver is INLINED rather than imported because the outputs are plain browser
 * scripts loaded by `<script src>` with no module loader. Re-typing it into each
 * output is the drift; inlining it from the single owner is not.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   node scripts/generate-app-sdk-copies.js            # write every reachable output
 *   node scripts/generate-app-sdk-copies.js --check    # verify; non-zero exit on drift
 *
 * Outputs live in sibling repos, so a partial checkout cannot see them all. An output
 * whose repo is absent is reported SKIPPED and is not a failure; an output that is
 * PRESENT and differs is always a failure. Override roots with
 * `--powch-root=<path>` / `--apps-root=<path>` when the default layout does not hold
 * (a git worktree, for instance, does not sit beside its sibling repos).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_SDK = resolve(HERE, '..');           // …/descix-app-sdk
const CORE = resolve(APP_SDK, '..');           // …/DeSciX_Core

const TEMPLATE = join(APP_SDK, 'templates', 'DeSciXAppSDK.template.js');
const RESOLVER = join(APP_SDK, 'src', 'util', 'bridgeResolver.js');
const PLACEHOLDER = '__BRIDGE_RESOLVER__';
const INLINE_START = '/* ---8<--- INLINE START';
const INLINE_END = '/* ---8<--- INLINE END';

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

/**
 * Pull the self-contained region out of the resolver and make it valid inside a
 * function body: `export` is a module-only form and the outputs are plain scripts.
 */
function inlineResolver() {
  const src = readFileSync(RESOLVER, 'utf8');
  const from = src.indexOf(INLINE_START);
  const to = src.indexOf(INLINE_END);
  if (from === -1 || to === -1) {
    throw new Error(
      `[generate-app-sdk-copies] ${RESOLVER} is missing its INLINE markers. ` +
      'The generator extracts the region between them; without the markers there is ' +
      'no defined source and generation must not guess.'
    );
  }
  const body = src.slice(src.indexOf('\n', from) + 1, to).trim();

  if (/^\s*import\s/m.test(body)) {
    throw new Error(
      '[generate-app-sdk-copies] the inlined region imports something. It is inlined ' +
      'into plain browser scripts that cannot follow an import — keep it self-contained.'
    );
  }

  return body
    .replace(/^export\s+function\s/gm, 'function ')
    .replace(/^export\s+const\s/gm, 'const ')
    .split('\n')
    .map((line) => (line.trim() ? `    ${line}` : line))
    .join('\n');
}

function render() {
  const template = readFileSync(TEMPLATE, 'utf8');
  if (!template.includes(PLACEHOLDER)) {
    throw new Error(`[generate-app-sdk-copies] ${TEMPLATE} no longer contains ${PLACEHOLDER}.`);
  }
  return template.replace(PLACEHOLDER, inlineResolver());
}

/** The three outputs, with the repo root each one needs in order to exist. */
function outputs() {
  const powchRoot = arg('powch-root') || resolve(CORE, '..', 'DeSciX_Powch');
  const appsRoot = arg('apps-root') || resolve(CORE, '..', '..', 'apps');
  return [
    {
      repo: 'DeSciX_Core',
      path: join(CORE, 'descix-cli', 'templates', 'scaffolds', 'site', 'DeSciXAppSDK.js'),
    },
    {
      repo: 'DeSciX_Powch',
      path: join(powchRoot, 'packages', 'client-core', 'src', 'DeSciXAppSDK.js'),
    },
    {
      repo: 'Unkamon/apps',
      path: join(appsRoot, 'daita-splitviewdemo', 'site', 'DeSciXAppSDK.js'),
    },
  ];
}

function main() {
  const check = process.argv.includes('--check');
  const expected = render();
  let drifted = 0;
  let skipped = 0;
  let written = 0;
  let ok = 0;

  for (const out of outputs()) {
    // Absent because the sibling repo is not checked out — not drift.
    if (!existsSync(dirname(out.path))) {
      console.log(`  SKIP    ${out.repo}: ${out.path} (repo not present)`);
      skipped++;
      continue;
    }

    const actual = existsSync(out.path) ? readFileSync(out.path, 'utf8') : null;

    if (actual === expected) {
      console.log(`  OK      ${out.repo}: ${out.path}`);
      ok++;
      continue;
    }

    if (check) {
      console.error(
        `  DRIFT   ${out.repo}: ${out.path}\n` +
        `          ${actual === null ? 'missing' : 'differs from the generated source'}. ` +
        'This file is GENERATED — do not hand-edit it.\n' +
        '          Fix the source (@descix/app-sdk templates/DeSciXAppSDK.template.js or ' +
        'src/util/bridgeResolver.js), then run:\n' +
        '            node descix-app-sdk/scripts/generate-app-sdk-copies.js'
      );
      drifted++;
      continue;
    }

    writeFileSync(out.path, expected);
    console.log(`  WROTE   ${out.repo}: ${out.path}`);
    written++;
  }

  console.log(
    `\n${check ? 'check' : 'generate'}: ${ok} in sync, ${written} written, ` +
    `${drifted} drifted, ${skipped} skipped`
  );

  if (drifted > 0) {
    console.error('\nFAILED: generated copies are out of sync with their source.');
    process.exit(1);
  }
}

main();
