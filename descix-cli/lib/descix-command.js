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
import { Command, CommanderError } from 'commander';

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

  /**
   * While the root is in parseWithPreparedHelp, commander's own help output (--help or -h at any
   * depth, `help <cmd>`, a bare group, help after an error) is held, not printed: the first
   * request is recorded on the root and printed once the prepare step has run.
   */
  outputHelp(contextOptions) {
    const root = this._descixRoot();
    if (root._descixHelpHold) {
      root._descixHelpHold.pending ??= { kind: 'help', command: this, contextOptions };
      return;
    }
    return super.outputHelp(contextOptions);
  }

  /**
   * The unknown-command error is held the same way: commander's "Did you mean" is drawn from the
   * VISIBLE commands, so it is replayed after the prepare step has hidden what the listing hides —
   * a hidden verb is never suggested. Nothing here re-derives which commands are visible.
   */
  unknownCommand() {
    const root = this._descixRoot();
    if (root._descixHelpHold) {
      root._descixHelpHold.pending ??= { kind: 'unknownCommand', command: this };
      throw new CommanderError(1, 'descix.heldUnknownCommand', 'held until the listing is prepared');
    }
    return super.unknownCommand();
  }

  _descixRoot() {
    let root = this;
    while (root.parent) root = root.parent;
    return root;
  }

  /**
   * Parse `argv`. When commander decides to print help, or to name an unknown command, run
   * `prepareHelp()` (may be async) first, then print that help (exiting with commander's own exit
   * code) or that error. An action never triggers it. Commander decides what is help and what is
   * unknown; nothing here reads argv.
   *
   * Every command gets an exit override for the parse, because commander exits from the command
   * that printed the help: the override throws when a help is held (so it can be prepared), and
   * otherwise exits exactly as commander would.
   *
   * @param {string[]} argv
   * @param {() => (void|Promise<void>)} prepareHelp
   */
  async parseWithPreparedHelp(argv, prepareHelp) {
    if (this.parent) throw new Error('parseWithPreparedHelp is called on the root command');
    this._descixHelpHold = { pending: null };
    const exitUnlessHeld = (err) => {
      if (this._descixHelpHold?.pending) throw err;
      process.exit(err.exitCode);
    };
    (function setAll(cmd) {
      cmd.exitOverride(exitUnlessHeld);
      cmd.commands.forEach(setAll);
    })(this);

    let exitCode = null;
    try {
      await this.parseAsync(argv);
    } catch (err) {
      if (!(err instanceof CommanderError) || !this._descixHelpHold.pending) throw err;
      exitCode = err.exitCode;
    }
    const held = this._descixHelpHold.pending;
    this._descixHelpHold = null;
    if (!held) return;
    await prepareHelp();
    if (held.kind === 'unknownCommand') {
      held.command.unknownCommand(); // commander writes the error and exits through the override
      return;
    }
    held.command.outputHelp(held.contextOptions);
    if (exitCode !== null) process.exit(exitCode);
  }
}
