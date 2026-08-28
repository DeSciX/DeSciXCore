# Runbook — npm Trusted Publishing for `@descix`

**Publishing a `@descix` package is a domain act under a signed contract, not a human approval.**
A GitHub **release** with a package-prefixed version tag starts the workflow; the workflow routes
the release to its package, refuses the ways the release can be wrong, publishes over OIDC, and
then installs what it published. No token is handled and no approval is waited on.

**Why we are doing this at all, in the CEO's words (2026-08-21):**
> "npm is turning off 2FA bypass and now is moving to Trusted Publisher model through CI so we
> need to set-up GitHub actions. Let me know how you recommend we set-up the automation."

**And why it is not gated on the CEO (2026-08-28):**
> "(A) align with FRQTL"

**What you get:** no publish token exists anywhere — not on a laptop, not in GitHub secrets, not
in a password manager. Each publish authenticates with a short-lived token minted for that one
run and bound to this repo + this workflow file + this environment.

**What gates a publish — four mechanical checks, none of them a convention:**
1. The **tag/version guard**. A release tag must be `<directory>-v<version>`, it must name exactly
   one of the packages below, and its version must equal that package's `package.json` version.
   A tag belonging to another package (or to nothing here) skips the run; a version disagreement
   fails it loudly, naming both versions.
2. The **dependency-satisfiability refusal**. Before publishing, every `@descix/*` range the
   package declares is resolved against the live registry. An unsatisfiable range refuses the run
   and names the range and what the registry actually has.
3. The **post-publish install check**. After a successful publish the run installs the published
   `name@version` from the registry into an empty directory and fails if that install fails. That
   is the whole check for a routed package. The app-half leak assertion and the install-size
   ceilings are `@descix/sdk`'s alone — the gate scopes them to it from the spec, and
   `@descix/app-sdk` is that leak assertion's negative control rather than a package it judges.
4. **npm's own server-side check.** It refuses any publish whose OIDC claim does not match the
   trusted-publisher binding. That check is fail-closed, and only the CEO's npm account can change
   the binding.

Behind all four: the `npm-publish` environment's deployment branch policy is `main` only, and
CODEOWNERS guards the workflow file path.

**The one human act that remains** is Step 1 below — the once-per-package trusted-publisher
binding on npmjs.com, which lives in the CEO's npm account and cannot be automated away.

---

## The one hard constraint, verified before anything was built

**A trusted publisher cannot be configured for a package that does not exist yet.** npm's own
prerequisites, verbatim:

> "Package must exist: The package you're configuring must already exist on the npm registry."

**The public story is ONE package**: `@descix/sdk`, which will re-export
the microservice backend at `@descix/sdk/microservice`. `@descix/cloud-core` and `@descix/app-sdk`
also publish, but as **plumbing** — named in no docs, installed by nobody directly.

Those three are exactly what the workflow publishes. The `directory` column is both the release
tag's prefix and the value in the *Which package to publish* dropdown on a manual run, and it is
the same string `.github/workflows/npm-publish.yml` lists — that file is the single source of
truth for what is publishable, and `scripts/publish-set.mjs` is the only code that reads it.
`scripts/check-runbook-publish-set.mjs` compares this table against it and fails when they
disagree; nothing triggers it automatically, so it catches drift only when someone runs it.

| package | directory | release tag | role |
|---|---|---|---|
| `@descix/sdk` | `descix-sdk` | `descix-sdk-v<version>` | the story |
| `@descix/cloud-core` | `descix-cloud-core` | `descix-cloud-core-v<version>` | plumbing |
| `@descix/app-sdk` | `descix-app-sdk` | `descix-app-sdk-v<version>` | plumbing |

Whether each one already exists on the registry — the prerequisite above — is a question only the
registry can answer, and it answers one package at a time:

```bash
npm view @descix/sdk versions
npm view @descix/cloud-core versions
npm view @descix/app-sdk versions
```

Run them separately. Passing several names to a single `npm view` prints the versions of the first
one and exits 0, which reads as an answer about all of them.

*Not published, deliberately:* `@descix/cli` and `@descix/platform-api` — the workflow refuses both
by name, along with `cryptoapis-sdk`, which is vendored third-party code and must never reach the
registry under our scope, and `descix-vscode`, which ships to the VS Code Marketplace instead.

**`@descix/platform-api` does NOT have to be published** — checked rather than assumed:
`@descix/cloud-core` has zero imports of it today, and its dependencies are only Google Cloud
libraries plus `chokidar`/`dotenv`/`google-auth-library`. Nothing forces platform-api public.

---

## Step 1 — configure the trusted publisher (npmjs.com, once per package)

**This is the CEO's, and it is the only part of publishing that is.** It is once per package,
ever.

**Each package needs its own binding.** npm's OIDC check is fail-closed *per package binding*: a
package with no binding at all — or one whose binding names anything other than the values in the
second table below — has its publish refused by npm's servers regardless of what the workflow
allows.

`@descix/sdk` is bound and its binding is proven: a publish through this workflow succeeded on the
first attempt. Which of the others are bound is visible only inside the npm account, so confirm
each one:

| order | package | what it needs |
|---|---|---|
| 1 | `@descix/cloud-core` | confirm the binding, or create it — **and release it before `@descix/sdk`; see below** |
| 2 | `@descix/app-sdk` | confirm the binding, or create it |
| — | `@descix/sdk` | nothing — bound, and already published through this workflow |

> **The order is a hard constraint, not tidiness.** `@descix/cloud-core` must be on the registry at
> a version satisfying the range `@descix/sdk` declares **before** `@descix/sdk` is
> published: `@descix/sdk` declares it as a hard dependency, so it is the one that can strand the
> install. `@descix/app-sdk` is an *optional* peer, so it cannot, and its order does not matter.
> What it controls instead is whether the app half exists at all: until `@descix/app-sdk` is on the
> registry at a version satisfying the peer range `@descix/sdk` declares, `npm install @descix/sdk`
> still succeeds and the app half is simply absent — no error, nothing to see. That is why its
> release is a repair and not housekeeping.
>
> Releasing `@descix/sdk` first *succeeds*, and then every `npm install @descix/sdk` fails with
> `ETARGET` on the range it cannot resolve — and that broken install is what the `latest` tag
> serves to everyone. **This is not hypothetical: it happened on 2026-08-27.** `@descix/sdk` went
> out ahead of `@descix/cloud-core`, and the `latest` it published could not be installed at all.
>
> **This order is now enforced, not merely advised — but read the refusal you get.** The workflow
> asks the registry these questions itself, on every run. Before it publishes anything, it refuses
> an `@descix/*` range the registry cannot satisfy, and the refusal separates exactly the two cases
> above: a hard dependency says *this will not install at all*, an optional peer says *it installs,
> but the half it advertises cannot be obtained by anyone*. Both stop the run, and which one you
> got is the difference between a stranded install and a silently missing app half. After the
> publish, a final job installs the package from the registry into an empty directory and fails the
> run if it does not install — the check whose absence let the broken `latest` out.
>
> These answer the same question without spending a run, and need no checkout:
>
> ```bash
> npm view @descix/sdk dependencies        # the range @descix/sdk declares
> npm view @descix/cloud-core version      # what the registry actually has
> npm view @descix/sdk peerDependencies    # the optional-peer range, for the app half
> npm view @descix/app-sdk versions        # whether anything satisfies it yet
> ```
>
> The registry can only answer for a package that is already published. For one that is not — a
> brand-new package, or a range you are about to change — read it from the tree instead:
>
> ```bash
> node -p "require('./descix-sdk/package.json').dependencies['@descix/cloud-core']"
> ```

**Useful thing the CEO discovered:** npm saves the connection **with no workflow file in the
repo** — the form warns about it but does not validate it.

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

## Step 2 — the `npm-publish` environment (GitHub)

The workflow declares `environment: npm-publish`, and it must keep doing so: **the npm binding
includes the environment name in the OIDC claim**, so removing it would break publishing.

The repository is **public** (`DeSciX/DeSciXCore`, 2026-08-22). The environment's deployment
branch policy is `main` only, so nothing published from a branch can mint a token. No human
reviewer stands on it — publishing is domain authority under the contract that grants it, and
the guard, the dependency refusal and npm's own binding are the boundary.

Read the environment's current state rather than trusting this page:

```bash
gh api repos/DeSciX/DeSciXCore/environments/npm-publish
```

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

**Cut a GitHub release whose tag is `<directory>-v<version>`,** using the `directory` and tag
columns in the table above, with the version equal to what that package's `package.json` declares.
Publishing the release is what starts the run. One release publishes one package, on the `latest`
dist-tag.

```bash
gh release create <directory>-v<version> --title <directory>-v<version> --notes "..."
```

The guard job answers three questions before anything is published, and each has one outcome:

| what the guard sees | what happens |
|---|---|
| the tag names no package here | the run **skips**, exits 0, and the publish job never starts |
| the tag names one package, versions agree | the run continues to the dependency gate |
| the tag names one package, versions disagree | the run **fails**, printing both versions |
| the tag prefix matches more than one package | the run **fails** as ambiguous |

**The manual path is retained** for a re-run or a dist-tag other than `latest`: **Actions → "npm
publish (trusted publishing)" → Run workflow**, choose the package, and type the exact
`package.json` version into `confirm_version`. A manual run has no tag, so that input is the
check — a wrong value refuses the run.

When more than one package is going out, Step 1 states the order they go in and why it is not
optional.

If a version already exists, npm rejects it and the run fails loudly. That is intended — there is
no force and no skip-if-exists, because a publish that silently does nothing is worse than one
that stops and tells you.

Every gate is a script under `scripts/`, so you can answer any of these yourself before cutting
a release, without spending a run:

```bash
EVENT_NAME=release TAG=<directory>-v<version> node scripts/resolve-release-target-cli.mjs
node scripts/check-prepublish-deps-cli.mjs <directory>
node scripts/check-published-install-cli.mjs --spec <name@version>
node scripts/tests/release-target.test.mjs
node scripts/tests/published-install.test.mjs
```

If the post-publish job goes red, the artifact is already public and already broken. **Fix forward
with a new version** — a published version cannot be edited, and there is no unpublish worth
reaching for.

---

## Two things worth knowing

**Provenance is available and is currently switched off.** Trusted publishing normally attaches
a cryptographic provenance attestation automatically, which requires a **public** source
repository — npm: *"Ensure your `package.json` is configured with a public `repository`…"*.
`DeSciXCore` is public, so nothing blocks it. The workflow still sets
`NPM_CONFIG_PROVENANCE=false` explicitly. **Turning it on is one line** — delete that env var —
and it is a real supply-chain gain, but it changes what a release publishes, so the switch is the
CEO's to make deliberately rather than as a side effect of this runbook.

**The workflow file is now the credential.** With no token to steal, the thing an attacker wants
is edit access to `.github/workflows/npm-publish.yml` — change what it publishes, or from where.
It is under CODEOWNERS requiring the CEO's review, and it should stay that way.

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
