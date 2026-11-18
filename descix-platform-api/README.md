# @descix/platform-api

**Shared platform infrastructure: Firestore models, auth and session, permissions, entitlements,
email, service manifests and MCP tool definitions.** This is the DeSciX domain layer — it sits
between `@descix/cloud-core` (which owns GCP) and the services that consume it.

Consumed by the Cloud microservice, the Powch microservice, and the CLI.

## Where it sits

```
@descix/cloud-core        GCP infrastructure: config, Firestore, Pub/Sub, manifests
        ↑
@descix/platform-api      DeSciX domain: models, auth, permissions, entitlements   ← you are here
        ↑
your microservice
```

## Entry points

The root export carries the common surface; sub-paths let a consumer take one area without pulling
the rest.

| Import path | Area |
|---|---|
| `@descix/platform-api` | everything below, re-exported |
| `@descix/platform-api/models` | Firestore models |
| `@descix/platform-api/auth` | session creation, email verification, user migration |
| `@descix/platform-api/permissions` | command permission checks |
| `@descix/platform-api/entitlements` | ownership and access queries |
| `@descix/platform-api/email` | transactional email |
| `@descix/platform-api/manifest` | service manifest shapes |
| `@descix/platform-api/service-bootstrap` | a microservice serves its manifest and registers it at boot — the one owner |
| `@descix/platform-api/mcp-tools` | MCP tool definitions and param validation |
| `@descix/platform-api/naming` | id and name normalisation |
| `@descix/platform-api/operator` | the operator email rule, operator envs and Firestore target check |
| `@descix/platform-api/account-admin` | the operator account admin (delete, merge) and its store-owner contract |

## Models

`Role`, `App`, `User`, `Community`, `UserCommunityStats`, `GuildSettings`, `Promotion`, `NFT`,
`AdCampaign`, `SharedAsset`, plus helpers including `clean_name_for_id`, `count_tokens`,
`sanitizeCredentialId`, `get_default_community` and `getUserEntitlements`.

**User-domain data has an owner.** User fields, entitlements and per-user flags belong to their
model or service module, and every consumer goes through it. Reaching into a user-domain Firestore
collection from outside its owner is a review-blocking anti-pattern, not a shortcut — the owner is
where a new field gets added and normalised.

## Operator account admin

`createAccountAdmin` deletes a test account (and restores the absent entries of a PARTIAL delete) or
merges a legacy record into its passkey account, in-process only: a local operator tool builds it with
`userAccountOwner` (the User-owned store) and the dependent store owners it booted. No command, route or
tool reaches it. Every account it touches is named by the operator email rule
(`normalizeOperatorEmailRule`, matched on `verified_email`; no rule, no run).

The database is measured, never asserted. The factory takes `{ userOwner, storeOwners, walletValueReader,
env, target, rule }` (there is no `expectedDatabaseIdFor`; passing it throws): `bootedEnvDatabaseId(env)`
reads `FIRESTORE_DATABASE_ID` of the service's own `defaults-config-<env>.json` as the booted
`@descix/cloud-core` loaded it (`CloudConfig.envDefaultsLayer()`, before any override; `DEPLOY_ENV` must be
`env`) and `target.databaseId` must equal it. Every act then asks each owner's `storeTarget()` for the
database its own client targets and refuses (`ACCOUNT_TARGET_INVALID`, naming the owner) before any read
when one differs, which is how two `@descix/cloud-core` instances in one process are caught.

A plan is a dry run; a commit re-checks the plan and saves the receipt (bound by `planHash` and the account
ids) before any write. A delete plan records every non-volatile entry's `dataHash` (`entryDataHash` of its
receipt data); each owner's `deleteForUser(user, { expectPaths, expectData })` refuses `ACCOUNT_PLAN_STALE`
when a document changed since (`assertDeletePlanCurrent`), and an `irrecoverable` owner compares inside the
transaction that deletes (`assertDocumentAsPlanned`). A delete runs the User owner's `preflightDelete`, its
`stampDelete` (the USERS doc's `admin_delete: { planHash, startedAt }`), the dependents, `preflightDelete`
again, the `irrecoverable` dependents, then the User owner last; endings (`DELETE_OUTCOME`,
`MERGE_OUTCOME`, `MERGE_ROLLBACK_OUTCOME`, `RESTORE_OUTCOME`) come from a read-back of every owner. A PARTIAL
delete whose USERS doc stands names the two ways on: plan and commit again, or
`restoreDelete({ receipt, confirmAccountId })` for the restorable entries, which requires the account's
`admin_delete.planHash` to be the receipt's and clears the stamp once every restorable entry is back. A
PARTIAL delete whose USERS doc is gone lists the documents left behind (`orphaned`, per owner) and offers
neither. `rollbackMerge({ receipt, confirmFromAccountId, confirmIntoAccountId })` refuses an
edited receipt before any write. A merge moves only from a legacy record (`ACCOUNT_MERGE_SOURCE_NOT_LEGACY`
otherwise), only the User owner's fields (`migrated_to`, the email ProviderIndex row, roles) and the moves
of dependent merge owners; the legacy record keeps its sessions, wallet and index rows, since it remains a
sign-in identity until its services are re-keyed.

The wallet: `walletValueReader(address)` answers `{ measured: true, holdsValue, summary, scope, details? }`;
`scope` (plain text of exactly what was measured) is required, anything else is
`ACCOUNT_WALLET_VALUE_UNMEASURED`. An account without `wallet_address` whose footprint holds an entry marked
`walletMaterial: true` is `ACCOUNT_WALLET_VALUE_UNMEASURED`, and an owner's own wallet blockers are shown in
the plan's `wallet` section. Every delete plan carries `notMeasured: string[]` at its top level (and in
`wallet`): what the reading's scope leaves out, and each wallet-material entry's `unmeasuredNote`.

The store-owner contract:

| | Who | What |
|---|---|---|
| `footprintForUser`, `deleteForUser`, `storeTarget` | every owner (`STORE_OWNER_METHODS`) | `storeTarget() -> { databaseId, projectId? }` read from the owner's client |
| `footprintForMerge`, `mergeForUser`, `rollbackMergeForUser`, `validateRollbackMoves` | a merge owner, all or none (`STORE_OWNER_MERGE_METHODS`) | `validateRollbackMoves(moves, pair)` throws `ACCOUNT_RECEIPT_INVALID` for a move it would not make; rollback validates every move before its first write and never overwrites a value changed since the merge |
| `account`, `accountsByEmailPrefixes`, `readMergeFields`, `preflightDelete`, `stampDelete`, `clearDeleteStamp` | the User owner (`USER_OWNER_METHODS`) | it restores nothing in v1 |
| `restoreForUser(user, entries) -> { restored, remaining }` | optional (`STORE_OWNER_RESTORE_METHOD`) | re-creates absent receipt entries, never overwrites; refuses `ACCOUNT_RECEIPT_INVALID` an entry that is not this account's |
| `irrecoverable: true` | optional flag | deleted after every other dependent, immediately before the User owner; compares each document's data in the deleting transaction |
| `credentialKeys: string[]` | optional | a credential the name rule cannot see |
| `credentialIdCollections: string[]` | optional | collection ids whose document id is a credential: their entries are `pathIsSecret` with a `secretPath(collection, id)` path |
| entry `walletMaterial: true` (+ `unmeasuredNote`) / `volatile: true` / `pathIsSecret: true` | optional footprint flags | wallet material (and what it may hold that nobody measured) / deleted by query at delete time (never stale, never restored) / the path is a digest of a credential id (never restored) |

The credential name rule (`redactCredentials`, `receiptData`): a key is redacted when, case-insensitively,
the whole key or its last `_`/`-` segment is token, secret, password, passphrase, passwd, private_key,
mnemonic, seed, signature, api_key/apikey, code or otp, or it is camelCase ending in one of those.

A store owner in another repo imports the codes, `AccountAdminError`, `accountAdminBlocker`,
`receiptData`, `encodeStoreValue`, `ACCOUNT_READ_LIMIT` and the outcome tables from here, and its own test
runs `assertAccountStoreOwnerConforms(owner, { user, bystanders, snapshot, clientTarget, pair?,
withFailingReads?, withBlocker?, changeAfterMerge?, changeAfterFootprint?, countUnboundedReads? })` against the
store it seeded: `bystanders` are three other accounts (the same verified email and wallet address; the same
wallet only; the same email only), `snapshot()` the whole store as `Map<path, value>` of raw documents keyed
as footprints name them, `clientTarget` the `{ databaseId, projectId? }` read from the client the test
injected, `changeAfterFootprint(path)` (required for an `irrecoverable` owner) changes one document's data. The checker calls the owner, judges collateral
writes from the snapshot, reports a clause whose hook is absent as skipped, and throws
`AccountStoreOwnerNonConformance` naming the failing clause.

## MCP tool definitions

`./mcp-tools` holds the tool schemas the platform advertises. A parameter that is not declared in
a tool's `inputSchema` is **rejected at the gateway boundary**, with the accepted set returned in
the error — it is never silently dropped. That makes the schema, not the prose description, the
contract: if the two disagree, the schema is what callers experience.
