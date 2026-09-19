/**
 * A COMMAND THAT DOES NOT EXIST MUST NOT APPEAR TO HAVE HELP.
 *
 * Commander resolves `--help` before it resolves the command, so `descix update --help` printed the
 * TOP-LEVEL help and exited 0 — indistinguishable, to a reader or a script, from a real verb with
 * help. `descix update` alone correctly says `error: unknown command 'update'`.
 *
 * That exit 0 is not only wrong, it TAUGHT something wrong: the daita-sdk docs tell readers that
 * `site upload --help` "silently prints top-level help" and to use `help <sub>` instead. It does no
 * such thing for a real command; the author had been probing a command that did not exist (devx
 * review 2026-09-19, I2 → S5).
 *
 * This guard runs ONLY when a help flag is present, so every other path keeps Commander's own
 * behaviour (it already exits non-zero for an unknown command without `--help`).
 */

const HELP_FLAGS = new Set(['-h', '--help']);

/** Does this option consume the next argv token as its value? */
function takesValue(option) {
    return Boolean(option && option.required);
}

function findOption(command, token) {
    const name = token.split('=')[0];
    return command.options.find((o) => o.short === name || o.long === name);
}

function findSubcommand(command, token) {
    return command.commands.find(
        (c) => c.name() === token || (typeof c.aliases === 'function' && c.aliases().includes(token)),
    );
}

/**
 * Walk argv down the command tree and return the first token that should name a subcommand but does
 * not. Returns null when every command token resolves — including when a command takes positional
 * arguments (a command with no subcommands ends the walk, so `descix chat hello` is not "unknown").
 *
 * @param {import('commander').Command} program
 * @param {string[]} argv arguments after the node binary and script (process.argv.slice(2))
 * @returns {{token: string, parent: import('commander').Command}|null}
 */
export function findUnknownCommand(program, argv) {
    let command = program;
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (token === '--') break;
        if (token.startsWith('-')) {
            if (takesValue(findOption(command, token)) && !token.includes('=')) i++;
            continue;
        }
        // A command with no subcommands takes positional arguments from here on.
        if (command.commands.length === 0) break;
        const sub = findSubcommand(command, token);
        if (!sub) return { token, parent: command };
        command = sub;
    }
    return null;
}

/** The command names `parent` actually has, for the "did you mean" line. */
function nameList(parent) {
    return parent.commands.map((c) => c.name()).sort();
}

/**
 * When argv asks for help on a command that does not exist, refuse by name and exit 1.
 *
 * @param {import('commander').Command} program
 * @param {string[]} argv
 * @param {{ error: (msg: string) => void, exit: (code: number) => void }} io
 */
export function assertKnownCommandForHelp(program, argv, io = { error: console.error, exit: process.exit }) {
    if (!argv.some((a) => HELP_FLAGS.has(a))) return;
    const unknown = findUnknownCommand(program, argv);
    if (!unknown) return;

    const path = [];
    for (let c = unknown.parent; c && c.parent; c = c.parent) path.unshift(c.name());
    const where = path.length ? `'descix ${path.join(' ')}'` : 'descix';
    io.error(`error: unknown command '${unknown.token}'`);
    io.error(`${where} has: ${nameList(unknown.parent).join(', ')}`);
    io.exit(1);
}
