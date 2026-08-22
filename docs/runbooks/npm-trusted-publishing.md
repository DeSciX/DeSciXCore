# Runbook — npm Trusted Publishing for `@descix`

**Audience: the CEO.** Everything below is clicking in two web UIs. You author nothing; the
workflow file is already written and lands with this branch.

**Why we are doing this, in your words (2026-08-21):**
> "npm is turning off 2FA bypass and now is moving to Trusted Publisher model through CI so we
> need to set-up GitHub actions. Let me know how you recommend we set-up the automation."

**What you get:** no publish token exists anywhere — not on a laptop, not in GitHub secrets, not
in a password manager. Each publish authenticates with a short-lived token minted for that one
run and bound to this repo + this workflow file + this environment.

**A correction to what I first wrote here.** I said the GitHub environment's *required reviewer*
would make every publish a click you make. **That is not available to us** — required-reviewer
protection on a PRIVATE repository is an Enterprise-plan feature, and it was measured refusing
with a 422 under the Team org. So the gate is NOT a GitHub approval prompt.

**What actually gates a publish today, and it is stronger than a convention:**
1. The workflow only runs when you press *Run workflow* — there is no push or tag trigger.
2. npm refuses any publish whose OIDC claim does not match the trusted-publisher binding exactly.
   That check is server-side, fail-closed, and only you can change it.

---

## The one hard constraint, verified before anything was built

**A trusted publisher cannot be configured for a package that does not exist yet.** npm's own
prerequisites, verbatim:

> "Package must exist: The package you're configuring must already exist on the npm registry."

**The public story is ONE package** (your call, 2026-08-21): `@descix/sdk`, which will re-export
the microservice backend at `@descix/sdk/microservice`. `@descix/cloud-core` still publishes, but
as **plumbing** — named in no docs, installed by nobody directly.

Measured registry state:

| package | role | on npm today | needs a manual first publish? |
|---|---|---|---|
| `@descix/sdk` | the story | 1.0.0 | no |
| `@descix/cloud-core` | plumbing | **never published** | **yes — once** |

So the sequence is: **Step 0 for `cloud-core` only**, then Steps 1–3, then never again.

*Not published, deliberately:* `@descix/cli` (stays at 1.0.1 as-is), `@descix/platform-api` and
`@descix/app-sdk` — the workflow refuses all three by name. `cryptoapis-sdk` is vendored
third-party code and must never reach the registry under our scope. `descix-vscode` ships to the
VS Code Marketplace, not npm.

**`@descix/platform-api` does NOT have to be published** — checked rather than assumed:
`@descix/cloud-core` has zero imports of it today, and its dependencies are only Google Cloud
libraries plus `chokidar`/`dotenv`/`google-auth-library`. Nothing forces platform-api public.

---

## Step 0 — one interactive first publish (`cloud-core` only)

On your machine, in the canonical `DeSciX_Core` checkout — **once, for `cloud-core` only**:

```bash
npm login                       # browser + 2FA
cd descix-cloud-core && npm publish --access public
```

`--access public` matters: `@descix` is a scope, and scoped packages default to **restricted**,
which a free org will refuse.

Then **log out again** — `npm logout` — so no session lingers. After Step 3 the account should
not be able to publish from a laptop at all.

---

## Step 1 — configure the trusted publisher (npmjs.com, once per package)

⚠️ **The repository moved, so the existing binding no longer matches.** `DeSciXCore` now lives at
**`DeSciX/DeSciXCore`** (org). The `@descix/sdk` binding you created still names `eabadir/DeSciXCore`,
so every OIDC claim from the new path **mismatches and npm refuses the publish**. That is the
system working: fail-closed, server-side, and only your key can change it.

So `@descix/sdk` needs **re-binding** (org `DeSciX`), and `@descix/cloud-core` needs binding for
the first time after Step 0. Git remotes keep working via redirects — this is an npm-side change
only.

**Re-binding is the LAST step of whichever posture you choose, not a prerequisite for anything
else.** The workflow can merge now; publishes simply remain impossible until you re-bind.

**Useful thing you discovered:** npm saved the connection **with no workflow file in the repo** —
the form warns about it but does not validate it. So configuring ahead of the merge is fine.

For each package: **npmjs.com → the package → Settings → Trusted Publisher → GitHub Actions**,
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

If a version already exists, npm rejects it and the run fails loudly. That is intended — there is
no force and no skip-if-exists, because a publish that silently does nothing is worse than one
that stops and tells you.

---

## Two things worth knowing

**No provenance, and that is a deliberate, reversible cost.** Trusted publishing normally attaches
a cryptographic provenance attestation automatically. It requires a **public** source repository —
npm: *"Ensure your `package.json` is configured with a public `repository`…"* — and publishing with
provenance from private source repos has been unsupported since 2023-07-26. `DeSciXCore` is
private (verified), so the workflow sets `NPM_CONFIG_PROVENANCE=false` explicitly rather than
relying on npm quietly skipping it. **If this repo is ever made public, delete that one line and
provenance turns back on.** It is a real supply-chain gain we are forgoing only because of
visibility.

**The workflow file is now the credential.** With no token to steal, the thing an attacker wants
is edit access to `.github/workflows/npm-publish.yml` — change what it publishes, or from where.
It is under CODEOWNERS requiring your review, and it should stay that way.

---

## Requirements this rests on (verified 2026-08-21, not assumed)

- npm CLI **≥ 11.5.1** and Node **≥ 22.14.0** — the workflow pins Node 22.14.0 and upgrades npm.
- Job permissions `id-token: write` + `contents: read` — the OIDC mint plus the checkout, nothing more.
- Trusted publishing with OIDC has been generally available since 2025-07-31.

Sources: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) ·
[npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/) ·
[generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) ·
[provenance from private repos unsupported](https://github.blog/changelog/2023-07-26-publishing-with-npm-provenance-from-private-source-repositories-is-no-longer-supported/) ·
[OIDC trusted publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
