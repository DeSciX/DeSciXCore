/**
 * selfGuided — the SHELL's side of the page-declares / shell-decides self-guidance contract.
 *
 * WHAT THIS IS FOR. The Run button is a literal onClick in the PARENT frame
 * (ChatWidget.jsx -> onExecuteAction -> CodeSiteWidget.handleExecuteAction), so a page cannot
 * un-gate itself no matter what it does — which is exactly the property we want to keep. This
 * module is the ONLY sanctioned way that gate opens: the page DECLARES which of its own ops may
 * run unattended, and the shell DECIDES whether to honour the declaration. No parent-DOM-click
 * synthesis, no second command pipe. A declared op takes the SAME onExecuteAction path a human
 * click would have taken.
 *
 * THE CONTRACT IS THE PAGE'S, NOT OURS (VIEWER, authoritative, already merged at Unkamon 4dde0a0
 * and DEPLOYED — this describes served bytes, not a plan):
 *
 *   window.DeSciX_SelfGuided = {
 *     v: 1,                                   // `v`, NOT `version`
 *     autoRun: [...], neverAutoRun: [...],    // DISPLAY/DEBUG ONLY — never branch on these
 *     mayAutoRun(fn)   -> bool
 *     shouldContinue() -> {ok:true, remaining:n} | {ok:false, reason:'<human-readable>'}
 *     spend(n)         -> spentTotal          // bare spend() adds 1
 *     stop(reason)     -> reason
 *     status()         -> {state, spent, budget, stopped}
 *   }
 *
 * IT IS FUNCTIONS, NOT DATA, AND THAT IS LOAD-BEARING. VIEWER's words: budget comes from the lab
 * card at call time and stop-state changes DURING a run, so a static bag read at boot is a
 * SNAPSHOT — they shipped exactly that bug hours earlier and it would have handed the CEO a false
 * reading. So this module NEVER caches the declaration's answers and NEVER mirrors its state:
 * every decision calls through, every read of stop-state goes to status().
 *
 * THREE RULES THAT LOOK LIKE STYLE AND ARE NOT:
 *  1. NEVER read `autoRun`/`neverAutoRun` to decide anything — call mayAutoRun(fn). The arrays
 *     exist so a HUMAN can see the list. Re-deriving the criterion here would put two copies of
 *     one fact in two repos, and they would drift silently. One owner: the page.
 *  2. NEVER model `reversible`/`recorded`. The shell needs exactly one bit — may this run
 *     unattended — and mayAutoRun IS that bit. If the criterion leaked in here as per-op flags,
 *     every change to it would become a two-repo change.
 *  3. THERE IS EXACTLY ONE STOP STATE AND THE PAGE OWNS IT. A shell STOP button must call
 *     decl.stop(reason); it must not keep a local flag. Two stop states drift, and the user
 *     eventually hits a stop that stops half the system.
 */

/** The contract version this shell speaks. A page declaring anything else is ignored, loudly. */
export const SELF_GUIDED_VERSION = 1;

/**
 * Read the page's declaration off the app frame, or null when there isn't a usable one.
 *
 * Returns null (never throws) for: no frame, no declaration, a version we do not speak, or a
 * declaration missing a required function. Accessing a cross-origin frame throws, and that is a
 * NORMAL condition here (Powch is deliberately cross-origin), so it is caught and treated as
 * "no declaration" rather than allowed to break the chat pane.
 *
 * @param {Window|null|undefined} childWindow - the app frame's contentWindow
 * @returns {Object|null} the live declaration object — call through it, never copy it
 */
export function readSelfGuidedDeclaration(childWindow) {
    let decl;
    try {
        decl = childWindow && childWindow.DeSciX_SelfGuided;
    } catch {
        return null; // cross-origin frame — expected, not an error
    }
    if (!decl || typeof decl !== 'object') return null;
    if (decl.v !== SELF_GUIDED_VERSION) return null;
    for (const fn of ['mayAutoRun', 'shouldContinue', 'spend', 'stop', 'status']) {
        if (typeof decl[fn] !== 'function') return null;
    }
    return decl;
}

/**
 * Should this action run unattended, right now?
 *
 * Order matters and is not arbitrary: mayAutoRun first (is this op ELIGIBLE at all), then
 * shouldContinue (is there BUDGET and are we not stopped). Asking budget about an ineligible op
 * would spend a question on something that can never run.
 *
 * DEGRADE, NEVER STRAND. Every "no" returns a reason and leaves the caller to render the ordinary
 * Run button — a human can always click. Refusing outright would strand the user mid-task.
 *
 * @param {Object|null} decl - from readSelfGuidedDeclaration
 * @param {string} functionName - the SAME string the action carries (action.functionName)
 * @returns {{autoRun: boolean, reason: string|null}}
 */
export function decideAutoRun(decl, functionName) {
    if (!decl) return { autoRun: false, reason: null };            // no declaration: silent, ordinary Run
    if (!functionName) return { autoRun: false, reason: null };

    let eligible;
    try {
        eligible = decl.mayAutoRun(functionName);
    } catch (e) {
        return { autoRun: false, reason: `self-guidance check failed: ${e.message}` };
    }
    if (!eligible) return { autoRun: false, reason: null };        // declared-not-eligible is ordinary, not an error

    let verdict;
    try {
        verdict = decl.shouldContinue();
    } catch (e) {
        return { autoRun: false, reason: `self-guidance budget check failed: ${e.message}` };
    }
    if (!verdict || verdict.ok !== true) {
        return { autoRun: false, reason: (verdict && verdict.reason) || 'self-guidance paused' };
    }
    return { autoRun: true, reason: null };
}

/**
 * Record one hop against the page's budget.
 *
 * ALWAYS CALL THIS ONCE PER HOP, even when the hop produced no media. VIEWER's reasoning, which
 * is the whole design: the budget counts MEDIA because the thread re-bills every attachment on
 * every turn, so media cost is quadratic while a text hop is linear — but a media-only bound
 * leaves a TEXT-ONLY loop unbounded, which the envelope forbids. Bare spend() adds 1, so the
 * floor of one-per-hop bounds text loops too, with no invented number anywhere.
 *
 * @param {Object|null} decl
 * @param {number} [mediaCount] - media items this hop produced; omit for a text-only hop
 * @returns {number|null} the page's accumulated spend, or null if it could not be recorded
 */
export function recordHopSpend(decl, mediaCount) {
    if (!decl) return null;
    try {
        return typeof mediaCount === 'number' && mediaCount > 0 ? decl.spend(mediaCount) : decl.spend();
    } catch {
        return null;
    }
}

/**
 * Halt self-guidance. The page owns the state; this only asks it to stop.
 *
 * Used by the shell's STOP control AND by "the user touched the app" — VIEWER: user interaction
 * takes precedence. Deliberately returns nothing worth storing, so there is no local flag to
 * drift out of step with the page.
 *
 * @param {Object|null} decl
 * @param {string} reason
 * @returns {boolean} whether the page was successfully asked
 */
export function requestStop(decl, reason) {
    if (!decl) return false;
    try {
        decl.stop(reason);
        return true;
    } catch {
        return false;
    }
}

/**
 * Is self-guidance currently stopped? Read from the page every time — never mirrored.
 *
 * @param {Object|null} decl
 * @returns {boolean}
 */
export function isStopped(decl) {
    if (!decl) return false;
    try {
        const s = decl.status();
        return !!(s && s.stopped);
    } catch {
        return false;
    }
}
