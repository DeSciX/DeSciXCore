# descix-cli Tests

## Running the suite

From `DeSciX_Core/descix-cli/`:

```bash
npm test
```

This runs all `tests/*.test.js` files using Node.js's built-in test runner (`node --test`).

## Test runner

Node.js `node:test` (built-in, no external framework). Assertions use `node:assert/strict`.

## Test files

| File | What it covers |
|------|---------------|
| `airdrop.test.js` | `descix airdrop execute-queue` — dry-run, apply, PK file, mutual-exclusion guards |
| `app-set-localpath.test.js` | `descix app set-localpath` — path validation, workspace.json update, hard-fail paths |
| `app-unmap.test.js` | `descix app unmap` — workspace removal, "not mapped" guard, zero Pinecone calls |
| `app-init-hardening.test.js` | `descix app init` — already-mapped guard, no-silent-mkdir-p, new-app happy path |
| `kb-namespace-purge.test.js` | `descix kb` namespace — pull/push removed, exit non-zero, not listed in --help |
| `drive-pull-push.test.js` | `descix drive pull/push` — listed in --help, same underlying functions as removed kb pull/push |
| `workspace-config-v1-hard-error.test.js` | `WorkspaceConfig.load()` — v1 format throws canonical error, tryLoad() returns null |
| `multi-manifest.test.js` | ManifestLoader with N manifests per app — Corpus + Training enumeration and filtering |

## Design principles

- Tests use **temp workspace fixtures** (`os.tmpdir()`), never the real `.descix/workspace.json`
- **No platform API calls** — workspace-level tests run fully offline
- CLI binary tests (`kb-namespace-purge`, `drive-pull-push`) spawn the real `bin/descix.js` process
- Error-path tests assert **canonical error text** — the exact strings surfaced to users

## No CI config

There is no `.github/workflows/` in this repo yet. CI is a follow-up (WS-2). Run `npm test` locally before merging.
