/**
 * THE ONE READER of "what .github/workflows/npm-publish.yml says is publishable".
 *
 * The publish set has ONE OWNER: the workflow file. It is the file GitHub executes, the file
 * CODEOWNERS guards, and the file whose `options:` list is the only thing a manual dispatch can
 * pick from. Everything else in this repo that needs the set — the release-tag router, the
 * runbook conformance gate — is a CONSUMER of that fact.
 *
 * This module exists so exactly ONE piece of code turns the workflow's text into the set. It was
 * extracted from check-runbook-publish-set.mjs the moment a second consumer appeared
 * (resolve-release-target.mjs). Two parsers of one file is the general form of mirror drift: the
 * copies disagree silently, and here the disagreement would surface as a package that routes in
 * the guard and is refused in the publish job, or the reverse.
 *
 * It parses TEXT, never a path, so a caller can hand it the working tree, `git show <ref>:...`,
 * or a synthetic fixture — which is how the parser's own failure modes get shown RED.
 */

export const WORKFLOW_PATH = '.github/workflows/npm-publish.yml';

/**
 * The publishable set, the refused set, and the raw dispatch choice list.
 *
 * `options`     — the `workflow_dispatch` choice list; a UI affordance for manual runs.
 * `refused`     — the packages the workflow refuses BY NAME before publishing.
 * `publishable` — options minus refused. The set a release tag may route to.
 *
 * Throws rather than returning a partial answer: a caller that cannot tell "the set is empty"
 * from "I could not find the set" reports a parse failure as a policy decision.
 */
export function workflowPublishSets(text) {
    const lines = String(text).split('\n');

    const optIdx = lines.findIndex((l) => /^\s*options:\s*$/.test(l));
    if (optIdx === -1) throw new Error(`${WORKFLOW_PATH}: no "options:" block found`);
    const options = [];
    for (let i = optIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;
        const m = line.match(/^\s*-\s+(\S+)\s*$/);
        if (!m) break;
        options.push(m[1]);
    }
    if (!options.length) throw new Error(`${WORKFLOW_PATH}: "options:" block parsed as empty`);

    // The refusal step's scrutinee is a shell variable, NOT `${{ inputs.package }}`. Under the
    // release trigger there is no `inputs.package`: a refusal keyed on an input that is empty on
    // the release path is a gate that cannot fail, which is not a gate.
    const caseIdx = lines.findIndex((l) => /^\s*case\s+"\$PKG"\s+in\s*$/.test(l));
    if (caseIdx === -1) {
        throw new Error(`${WORKFLOW_PATH}: no refusal 'case "$PKG" in' statement found`);
    }
    let refused = [];
    for (let i = caseIdx + 1; i < lines.length; i++) {
        const m = lines[i].match(/^\s*([A-Za-z0-9._|-]+)\)\s*$/);
        if (m) {
            refused = m[1].split('|').map((s) => s.trim()).filter((s) => s && s !== '.');
            break;
        }
        if (/^\s*esac\s*$/.test(lines[i])) break;
    }
    if (!refused.length) throw new Error(`${WORKFLOW_PATH}: refusal case parsed as empty`);

    const publishable = options.filter((o) => !refused.includes(o));
    if (!publishable.length) throw new Error(`${WORKFLOW_PATH}: every dispatch option is refused`);

    return { options, refused, publishable };
}

/**
 * How the `publish` job is wired to the `guard` job, read out of the same text.
 *
 * This is what makes "a foreign tag never reaches the publish job" a CHECKABLE claim about the
 * artifact rather than a reading of it. It reports the WIRING only. GitHub's evaluation of `if:`
 * is not executed here and cannot be from a laptop, so every consumer of this must say which
 * half it measured.
 */
export function publishJobWiring(text) {
    const lines = String(text).split('\n');
    const jobIdx = lines.findIndex((l) => /^ {2}publish:\s*$/.test(l));
    if (jobIdx === -1) throw new Error(`${WORKFLOW_PATH}: no "publish:" job found`);

    const out = { needs: null, if: null, environment: null };
    for (let i = jobIdx + 1; i < lines.length; i++) {
        if (/^ {2}\S/.test(lines[i])) break; // the next job, at the same indent
        const n = lines[i].match(/^\s*needs:\s*(.+?)\s*$/);
        if (n && out.needs === null) out.needs = n[1];
        const f = lines[i].match(/^\s*if:\s*(.+?)\s*$/);
        if (f && out.if === null) out.if = f[1];
        const e = lines[i].match(/^\s*environment:\s*(\S+)\s*$/);
        if (e && out.environment === null) out.environment = e[1];
    }
    return out;
}
