# Runbook — npm Trusted Publishing for `@descix`

**Audience: the CEO.** Everything below is clicking in two web UIs. You author nothing; the
workflow file is already written and lands with this branch.

**Why we are doing this, in your words (2026-08-21):**
> "npm is turning off 2FA bypass and now is moving to Trusted Publisher model through CI so we
> need to set-up GitHub actions. Let me know how you recommend we set-up the automation."

**What you get:** no publish token exists anywhere — not on a laptop, not in GitHub secrets, not
in a password manager. Each publish authenticates with a short-lived token minted for that one
run and bound to this repo + this workflow file + this environment. And because the workflow
needs environment approval, **every publish becomes a click you make**, which is the deploy gate
enforced by machinery instead of by discipline.

---

## The one hard constraint, verified before anything was built

**A trusted publisher cannot be configured for a package that does not exist yet.** npm's own
prerequisites, verbatim:

> "Package must exist: The package you're configuring must already exist on the npm registry."

Measured registry state for our five publishable packages:

| package | on npm today | needs a manual first publish? |
|---|---|---|
| `@descix/sdk` | 1.0.0 | no |
| `@descix/cli` | 1.0.1 | no |
| `@descix/app-sdk` | 0.1.0 | no |
| `@descix/cloud-core` | **never published** | **yes — once** |
| `@descix/platform-api` | **never published** | **yes — once** |

So the sequence is: **Step 0 for those two only**, then Steps 1–3 for all five, then never again.

*(`cryptoapis-sdk` is vendored third-party code and is never published under our scope — the
workflow refuses it explicitly. `descix-vscode` ships to the VS Code Marketplace, not npm.)*

---

## Step 0 — one interactive first publish (only `cloud-core` and `platform-api`)

On your machine, in the canonical `DeSciX_Core` checkout, once per package:

```bash
npm login                       # browser + 2FA
cd descix-cloud-core && npm publish --access public
cd ../descix-platform-api && npm publish --access public
```

`--access public` matters: `@descix` is a scope, and scoped packages default to **restricted**,
which a free org will refuse.

Then **log out again** — `npm logout` — so no session lingers. After Step 2 the account should
not be able to publish from a laptop at all.

---

## Step 1 — configure the trusted publisher (npmjs.com, once per package)

For each of the five packages: **npmjs.com → the package → Settings → Trusted Publisher →
GitHub Actions**, and enter exactly:

| field | value |
|---|---|
| Organization or user | `eabadir` |
| Repository | `DeSciXCore` |
| Workflow filename | `npm-publish.yml` |
| Environment | `npm-publish` |

All four must match or the publish is refused — that exactness *is* the security property. The
workflow filename is why the file may never be renamed or moved without redoing this step.

---

## Step 2 — harden publishing access (npmjs.com, once per package)

Same Settings page: set publishing access to **require trusted publishing / disallow tokens**
(npm's wording varies by rollout; choose the strictest option that excludes token publishing).

This is the step that converts "we have a nice CI path" into "there is no other path." Do it
after Step 1, or you will lock out the publisher you have not configured yet.

---

## Step 3 — create the approval gate (GitHub, once for the repo)

**github.com/eabadir/DeSciXCore → Settings → Environments → New environment → `npm-publish`**,
then tick **Required reviewers** and add **`eabadir`**.

Name it exactly `npm-publish` — the workflow and the npm trusted-publisher config both name it.

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
