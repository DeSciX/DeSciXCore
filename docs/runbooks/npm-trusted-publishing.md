# Runbook — npm Trusted Publishing for `@descix`

**Audience: the CEO.** Everything below is clicking in two web UIs. You author nothing; the
workflow file is already written and merged.

**Why we are doing this, in your words (2026-08-21):**
> "npm is turning off 2FA bypass and now is moving to Trusted Publisher model through CI so we
> need to set-up GitHub actions. Let me know how you recommend we set-up the automation."

**What you get:** no publish token exists anywhere — not on a laptop, not in GitHub secrets, not
in a password manager. Each publish authenticates with a short-lived token minted for that one
run and bound to this repo + this workflow file + this environment.

**What gates a publish — three independent checks, none of them a convention:**
1. The workflow only runs when you press *Run workflow*. There is no push or tag trigger.
2. The run then **waits for your approval**. The `npm-publish` environment carries a
   required-reviewer rule naming you, so the publish step does not execute until you approve it
   in the run's page. Two deliberate actions, not one.
3. npm refuses any publish whose OIDC claim does not match the trusted-publisher binding
   exactly. That check is server-side, fail-closed, and only you can change the binding.

---

## The one hard constraint, verified before anything was built

**A trusted publisher cannot be configured for a package that does not exist yet.** npm's own
prerequisites, verbatim:

> "Package must exist: The package you're configuring must already exist on the npm registry."

**The public story is ONE package**: `@descix/sdk`, which will re-export
the microservice backend at `@descix/sdk/microservice`. `@descix/cloud-core` and `@descix/app-sdk`
also publish, but as **plumbing** — named in no docs, installed by nobody directly.

Those three are exactly what the workflow offers. The `directory` column is the value you pick from
the *Which package to publish* dropdown, and it is the same string
`.github/workflows/npm-publish.yml` lists — that file is the single source of truth for what is
publishable. `scripts/check-runbook-publish-set.mjs` compares this table against it and fails when
they disagree; nothing triggers it automatically, so it catches drift only when someone runs it.

| package | directory | role |
|---|---|---|
| `@descix/sdk` | `descix-sdk` | the story |
| `@descix/cloud-core` | `descix-cloud-core` | plumbing |
| `@descix/app-sdk` | `descix-app-sdk` | plumbing |

Whether each one already exists on the registry — the prerequisite above — is a question only the
registry can answer, and it answers one package at a time:

```bash
npm view @descix/sdk versions
npm view @descix/cloud-core versions
npm view @descix/app-sdk versions
```

Run them separately. Passing several names to a single `npm view` prints the versions of the first
one and exits 0, which reads as an answer about all of them.

The sequence is **Steps 1–3, then never again.**

*Not published, deliberately:* `@descix/cli` and `@descix/platform-api` — the workflow refuses both
by name, along with `cryptoapis-sdk`, which is vendored third-party code and must never reach the
registry under our scope, and `descix-vscode`, which ships to the VS Code Marketplace instead.

**`@descix/platform-api` does NOT have to be published** — checked rather than assumed:
`@descix/cloud-core` has zero imports of it today, and its dependencies are only Google Cloud
libraries plus `chokidar`/`dotenv`/`google-auth-library`. Nothing forces platform-api public.

---

## Step 1 — configure the trusted publisher (npmjs.com, once per package)

**All three need this, and `@descix/app-sdk` is first.** npm's OIDC check is fail-closed *per
package binding*: a package with no binding at all — or one whose binding names anything other than
the values in the second table below — has its publish refused by npm's servers regardless of what
the workflow allows. `@descix/app-sdk` is the first package you will publish, so a missing binding
there stops you before you start.

Which bindings exist today is visible only inside your npm account, so work down this list and
confirm each one:

| order | package | what it needs |
|---|---|---|
| 1 | `@descix/app-sdk` | confirm the binding, or create it |
| 2 | `@descix/cloud-core` | confirm the binding, or create it |
| 3 | `@descix/sdk` | **re-bind** — the binding you created names `eabadir/DeSciXCore` |

`@descix/sdk` was bound before the repository moved into the `DeSciX` org, so its OIDC claims now
mismatch and npm refuses them. Git remotes keep working via redirects; this is an npm-side change
only.

**Useful thing you discovered:** npm saves the connection **with no workflow file in the repo** —
the form warns about it but does not validate it.

For each of the three: **npmjs.com → the package → Settings → Trusted Publisher → GitHub Actions**,
and enter exactly:

| field | value |
|---|---|
| Organization or user | `DeSciX` |
| Repository | `DeSciXCore` |
| Workflow filename | `npm-publish.yml` |
| Environment | `npm-publish` |
| Allowed actions | **`npm publish` only** (leave stage-publish unchecked) |

All of these must match or the publish is refused — that exactness *is* the security property. The
workflow filename is why the file may never be renamed or moved without redoing this step.

---

## Step 2 — the `npm-publish` environment (GitHub) — configured, approval prompt ON

The workflow declares `environment: npm-publish`, and it must keep doing so: **the npm binding
includes the environment name in the OIDC claim**, so removing it would break publishing.

The repository is **public** (`DeSciX/DeSciXCore`, 2026-08-22) and the environment is configured:
**required reviewer = `eabadir`**, deployment branch policy = `main` only. Every *Run workflow*
therefore pauses for your approval in the GitHub UI before any publish step runs. Nothing to set.

---

## Step 3 (LAST) — harden publishing access (npmjs.com, once per package)

**Do this only AFTER the first successful publish through the workflow.** Same Settings page: set
publishing access to **require trusted publishing / disallow tokens** (npm's wording varies by
rollout; choose the strictest option that excludes token publishing).

This converts "we have a nice CI path" into "there is no other path" — which is exactly why it
goes last. Flip it before CI has published successfully even once and you have removed the old
road before confirming the new one carries traffic. Publishing access stays on the current
token setting until then, by design.

---

## Publishing, from then on

**Actions → "npm publish (trusted publishing)" → Run workflow**, choose the package and dist-tag
(`latest` unless you mean otherwise). The run pauses for your approval; approve it and it
publishes. Nothing else is needed and no credential is ever handled.

One run publishes one package, so when you are publishing all three, take them in **dependency
order: `@descix/app-sdk`, then `@descix/cloud-core`, then `@descix/sdk`.** `@descix/sdk` declares
the other two — `@descix/cloud-core` as a dependency, `@descix/app-sdk` as an optional peer — so it
goes last. Publishing it first succeeds, and then `npm i @descix/sdk` cannot resolve until the other
two follow. This ordering is not housekeeping to be tidied away later: it is the direction the
dependencies point.

If a version already exists, npm rejects it and the run fails loudly. That is intended — there is
no force and no skip-if-exists, because a publish that silently does nothing is worse than one
that stops and tells you.

---

## Two things worth knowing

**Provenance is available and is currently switched off.** Trusted publishing normally attaches
a cryptographic provenance attestation automatically, which requires a **public** source
repository — npm: *"Ensure your `package.json` is configured with a public `repository`…"*.
`DeSciXCore` is public, so nothing blocks it. The workflow still sets
`NPM_CONFIG_PROVENANCE=false` explicitly. **Turning it on is one line** — delete that env var —
and it is a real supply-chain gain, but it changes what your click publishes and no agent can
rehearse a publish, so the switch is yours to make deliberately rather than as a side effect of
this runbook.

**The workflow file is now the credential.** With no token to steal, the thing an attacker wants
is edit access to `.github/workflows/npm-publish.yml` — change what it publishes, or from where.
It is under CODEOWNERS requiring your review, and it should stay that way.

---

## Requirements this rests on (verified 2026-08-21, not assumed)

- npm CLI **≥ 11.5.1** and Node **≥ 22.14.0**.
- Job permissions `id-token: write` + `contents: read` — the OIDC mint plus the checkout, nothing more.
- Trusted publishing with OIDC has been generally available since 2025-07-31.

Sources: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) ·
[npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/) ·
[generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) ·
[provenance from private repos unsupported](https://github.blog/changelog/2023-07-26-publishing-with-npm-provenance-from-private-source-repositories-is-no-longer-supported/) ·
[OIDC trusted publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
