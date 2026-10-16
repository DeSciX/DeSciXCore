/**
 * cli-verb-tree-hook.mjs — preloaded (`node --import`) into bin/descix.js by
 * scripts/lib/cli-verb-list.mjs. It reads the LIVE commander tree, the same object `--help`
 * renders and lib/command-visibility.js walks: bin/descix.js builds the whole tree, then calls
 * `program.parseAsync(process.argv)`; this hook replaces parseAsync so that, instead of parsing,
 * the ROOT command serializes its tree to $DESCIX_CLI_VERB_TREE_OUT and the process exits 0.
 * No second tree, no static parse of the source, no shipped dump verb.
 *
 * One entry per runnable verb (a command with an action handler), sorted by verbPath:
 *   { verbPath, description, arguments[], options[], runbookAnchor }
 * Commands the CLI registers `{ hidden: true }` (retired-surface stubs) and their subtrees are
 * omitted, as are hidden options — the list is what a developer is offered.
 */
import fs from 'node:fs';
import { Command } from 'commander';

const OUT = process.env.DESCIX_CLI_VERB_TREE_OUT;
if (!OUT) {
  throw new Error('cli-verb-tree-hook: DESCIX_CLI_VERB_TREE_OUT is not set — this hook is only loaded by scripts/lib/cli-verb-list.mjs');
}

function entry(cmd, verbPath) {
  if (typeof cmd.declaredRunbookAnchor !== 'function') {
    throw new Error(`cli-verb-tree-hook: "${verbPath}" is not a DescixCommand — bin/descix.js must build its tree from lib/descix-command.js`);
  }
  return {
    verbPath,
    description: cmd.description(),
    arguments: cmd.registeredArguments.map((a) => ({
      name: a.name(),
      required: a.required,
      variadic: a.variadic,
      description: a.description,
    })),
    options: cmd.options.filter((o) => !o.hidden).map((o) => ({
      flags: o.flags,
      description: o.description,
      required: !!o.mandatory,
    })),
    runbookAnchor: cmd.declaredRunbookAnchor(),
  };
}

function collect(root) {
  const verbs = [];
  (function visit(cmd, tokens) {
    for (const child of cmd.commands) {
      if (child._hidden) continue;
      const path = [...tokens, child.name()];
      if (child._actionHandler) verbs.push(entry(child, path.join(' ')));
      visit(child, path);
    }
  })(root, []);
  return verbs.sort((a, b) => (a.verbPath < b.verbPath ? -1 : a.verbPath > b.verbPath ? 1 : 0));
}

function dumpInsteadOfParse() {
  if (this.parent) throw new Error('cli-verb-tree-hook: parse called on a non-root command');
  fs.writeFileSync(OUT, JSON.stringify(collect(this)));
  process.exit(0);
}

Command.prototype.parseAsync = dumpInsteadOfParse;
Command.prototype.parse = dumpInsteadOfParse;
