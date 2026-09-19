/**
 * ONE OWNER for the question "may I prompt?".
 *
 * Every prompt site in this CLI consumes this module. No site derives the answer itself, and
 * there is no flag, env var or option that restores prompting when the environment cannot
 * support it: the guard is a property of the ENVIRONMENT, not of the invocation. A flag would
 * be a guard the caller must remember, and forgetting it reproduces the exact hang this module
 * exists to remove.
 *
 * The rule is enforced by ENCAPSULATION, not by detection: you cannot obtain a prompt handle
 * without passing the gate, because createPromptSession() is the only way to get one and it
 * calls requireInteractive() before it constructs anything. A comment asking authors to check
 * is not a guard — an author who does not read it ships the hang.
 *
 * Reference behaviour is gcloud: it refuses non-interactively rather than hanging or silently
 * succeeding. Both failure modes were measured in this CLI before this module existed:
 *   - stdin an open pipe or a FIFO whose write end is held: readline waits forever. SIGKILL.
 *   - stdin /dev/null: readline closes, the question callback NEVER fires, the event loop
 *     drains and node exits 0 having written NOTHING. That is worse than the hang, because it
 *     is indistinguishable from success.
 */

import readline from 'readline';
import chalk from 'chalk';

/**
 * The single derivation of "is there a human on the other end of stdin".
 *
 * stdin is the decisive stream: a prompt must READ. stdout being redirected does not stop a
 * terminal user from answering, so it is deliberately not consulted.
 *
 * @returns {boolean}
 */
export function stdinIsInteractive() {
  return process.stdin.isTTY === true;
}

/**
 * Thrown when a command needs to prompt and cannot. Carries the refusal text already formatted.
 * Command actions in bin/descix.js catch Error, print `error.message` and exit 1, so throwing
 * this produces a LOUD, NON-ZERO refusal — never a hang, never a silent exit 0.
 */
export class NonInteractiveError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonInteractiveError';
    this.isNonInteractive = true;
  }
}

/**
 * Build the refusal text. Names what was being asked and how to get the job done without a
 * prompt. It NEVER prescribes a destructive remedy: where the non-interactive form overwrites
 * or deletes something, the caller is told so explicitly and the non-destructive option leads.
 *
 * @param {Object} o
 * @param {string} o.what - the command, e.g. 'descix init'
 * @param {string} [o.question] - the question that cannot be asked
 * @param {string[]} [o.nonInteractiveForm] - concrete lines the caller can run instead
 */
function refusalText({ what, question, nonInteractiveForm, destructive }) {
  // NO leading blank line and NO ❌ marker: command actions print `❌ ${error.message}`
  // themselves. Emitting one here produced a doubled marker — the message OWNS the sentence,
  // the caller OWNS the decoration.
  const lines = [];
  lines.push(`${what} cannot prompt during non-interactive execution.`);
  lines.push(chalk.gray('   stdin is not a terminal, so there is no one to answer.'));
  if (question) {
    lines.push('');
    lines.push(chalk.gray(`   It needed to ask: ${question}`));
  }
  lines.push('');
  if (destructive) {
    // The confirmation being refused guards an IRREVERSIBLE act. The safe reading LEADS, and we
    // never hand back a copy-pasteable destructive command as if it were the obvious next step.
    lines.push(chalk.yellow('   This was a confirmation for an IRREVERSIBLE operation.'));
    lines.push(chalk.gray('   Nothing has been changed.'));
    lines.push('');
  }
  if (nonInteractiveForm && nonInteractiveForm.length > 0) {
    lines.push(chalk.white('   Non-interactive form:'));
    for (const line of nonInteractiveForm) lines.push(`     ${line}`);
  } else {
    lines.push(chalk.white(`   ${what} has no non-interactive form. Run it in a terminal.`));
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * The gate. Call this before ANY prompt — readline, inquirer, or anything else.
 * Returns silently when a human can answer; throws a loud NonInteractiveError when not.
 *
 * @param {Object} o - see refusalText
 * @throws {NonInteractiveError}
 */
export function requireInteractive({ what, question, nonInteractiveForm, destructive } = {}) {
  if (stdinIsInteractive()) return;
  throw new NonInteractiveError(refusalText({ what, question, nonInteractiveForm, destructive }));
}

/**
 * The ONLY way to obtain a prompt handle in this CLI.
 *
 * Gated at construction, so a site physically cannot reach readline without the check. Each
 * ask() also re-states the question in the refusal if the session is used later, and every
 * ask() rejects rather than hanging if stdin stops being a terminal mid-session.
 *
 * @param {Object} o
 * @param {string} o.what - the command, e.g. 'descix init'
 * @param {string[]} [o.nonInteractiveForm]
 * @param {boolean} [o.terminal] - readline terminal option (airdrop needs true to mask input)
 * @returns {{ask: Function, askYesNo: Function, close: Function}}
 */
export function createPromptSession({ what, nonInteractiveForm, terminal, destructive } = {}) {
  requireInteractive({ what, nonInteractiveForm, destructive });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    ...(terminal === undefined ? {} : { terminal })
  });

  /** Ask for free text, with an optional default. */
  const ask = (question, defaultValue = '') => {
    requireInteractive({ what, question, nonInteractiveForm, destructive });
    const suffix = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    return new Promise((resolve) => {
      rl.question(suffix, (answer) => resolve(answer.trim() || defaultValue));
    });
  };

  /** Ask a yes/no question with an explicit default. */
  const askYesNo = (question, defaultYes = true) => {
    requireInteractive({ what, question, nonInteractiveForm, destructive });
    const suffix = defaultYes ? '(Y/n)' : '(y/N)';
    return new Promise((resolve) => {
      rl.question(`${question} ${suffix}: `, (answer) => {
        const trimmed = answer.trim().toLowerCase();
        if (trimmed === '') return resolve(defaultYes);
        resolve(trimmed === 'y' || trimmed === 'yes');
      });
    });
  };

  /**
   * Ask with the prompt text EXACTLY as given — no added suffix. For sites that already spell
   * their own "[y/N] " and must keep their wording verbatim.
   */
  const askRaw = (question) => {
    requireInteractive({ what, question, nonInteractiveForm, destructive });
    return new Promise((resolve) => rl.question(question, resolve));
  };

  return { ask, askYesNo, askRaw, close: () => rl.close() };
}

/**
 * A prompt session that is built only when a question is actually ASKED.
 *
 * `createPromptSession` gates at construction, which is right for a command that always
 * prompts. A command whose every answer can arrive as a FLAG must not refuse a non-terminal
 * before it knows it needs one: that made `descix init -c <c> -a <a>` impossible to run from an
 * AI assistant or a script, although nothing was left to ask (measured 2026-09-19). The gate is
 * unchanged, and still the one owner — this only defers WHEN it is consulted.
 *
 * @param {Object} o - exactly createPromptSession's options
 * @returns {{ask: Function, askYesNo: Function, close: Function}}
 */
export function createLazyPromptSession(o = {}) {
  let session = null;
  const open = () => (session ||= createPromptSession(o));
  return {
    ask: (...args) => open().ask(...args),
    askYesNo: (...args) => open().askYesNo(...args),
    close: () => { if (session) session.close(); },
  };
}

export default { stdinIsInteractive, requireInteractive, createPromptSession, NonInteractiveError };
