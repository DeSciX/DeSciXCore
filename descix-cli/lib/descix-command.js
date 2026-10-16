/**
 * DescixCommand — the CLI's commander Command, carrying ONE extra fact per verb: the
 * app-developer runbook section that documents it.
 *
 * The fact is declared BESIDE the verb's own definition in bin/descix.js
 * (`.command('serve').runbookAnchor('#_5-run-it-locally-descix-serve')`), so the verb tree and
 * its runbook pointers can never be two lists. `createCommand` makes every subcommand a
 * DescixCommand (commander's documented subclassing hook), so `.runbookAnchor()` chains on any
 * `.command(...)` in the tree.
 *
 * The value is the anchor VitePress renders for the runbook heading (leading '#'). Whether it
 * names a REAL heading is gated by tests/cli-verbs-generated.test.js against the runbook
 * source (scripts/lib/runbook-anchors.mjs owns the slug rule). A verb with no runbook section
 * declares nothing — there is no placeholder anchor. Read only by
 * scripts/lib/cli-verb-tree-hook.mjs, which publishes the tree into
 * @descix/platform-api/mcp-tools (cli-verbs.generated.json).
 */
import { Command } from 'commander';

const ANCHOR_SHAPE = /^#[^\sA-Z#]+$/;

export class DescixCommand extends Command {
  createCommand(name) {
    return new DescixCommand(name);
  }

  /** @param {string} anchor '#<slug>' as rendered by the docs site @returns {this} */
  runbookAnchor(anchor) {
    if (this._descixRunbookAnchor !== undefined) {
      throw new Error(`descix ${this.name()}: runbookAnchor declared twice (${this._descixRunbookAnchor}, ${anchor}) — one verb, one section`);
    }
    if (typeof anchor !== 'string' || !ANCHOR_SHAPE.test(anchor)) {
      throw new Error(`descix ${this.name()}: runbookAnchor must be a rendered anchor like "#_5-run-it-locally-descix-serve"; got ${JSON.stringify(anchor)}`);
    }
    this._descixRunbookAnchor = anchor;
    return this;
  }

  /** @returns {string|null} the declared anchor, or null when the verb has no runbook section */
  declaredRunbookAnchor() {
    return this._descixRunbookAnchor ?? null;
  }
}
