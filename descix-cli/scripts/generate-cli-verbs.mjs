#!/usr/bin/env node
/**
 * generate-cli-verbs.mjs — regenerates @descix/platform-api/mcp-tools/cli-verbs.generated.json
 * from the LIVE commander tree of bin/descix.js (scripts/lib/cli-verb-list.mjs), refusing to
 * write a list that declares a runbook anchor the app-developer runbook does not render
 * (scripts/lib/runbook-anchors.mjs).
 *
 * USAGE (from descix-cli/):
 *   npm run generate:cli-verbs              # regenerate and write
 *   npm run generate:cli-verbs -- --check   # regenerate in memory, exit 1 if the committed file is stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildCliVerbList, serializeCliVerbs, CLI_VERBS_GENERATED_PATH } from './lib/cli-verb-list.mjs';
import { readRunbookAnchors, unknownRunbookAnchors, RUNBOOK_SOURCE_PATH } from './lib/runbook-anchors.mjs';

const verbs = buildCliVerbList();
const unknown = unknownRunbookAnchors(verbs, readRunbookAnchors());
if (unknown.length) {
  console.error(`generate-cli-verbs: declared runbook anchors that ${RUNBOOK_SOURCE_PATH} does not render:\n  ${unknown.join('\n  ')}`);
  process.exit(1);
}
const serialized = serializeCliVerbs(verbs);
const rel = path.relative(process.cwd(), CLI_VERBS_GENERATED_PATH);
const anchored = verbs.filter((v) => v.runbookAnchor !== null).length;

if (process.argv.includes('--check')) {
  const existing = fs.existsSync(CLI_VERBS_GENERATED_PATH) ? fs.readFileSync(CLI_VERBS_GENERATED_PATH, 'utf8') : null;
  if (existing !== serialized) {
    console.error(`generate-cli-verbs --check: ${rel} is STALE. Run: npm run generate:cli-verbs`);
    process.exit(1);
  }
  console.log(`generate-cli-verbs --check: up to date (${verbs.length} verbs, ${anchored} with a runbook anchor).`);
  process.exit(0);
}

fs.writeFileSync(CLI_VERBS_GENERATED_PATH, serialized);
console.log(`generate-cli-verbs: wrote ${rel} (${verbs.length} verbs, ${anchored} with a runbook anchor).`);
