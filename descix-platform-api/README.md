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

## Models

`Role`, `App`, `User`, `Community`, `UserCommunityStats`, `GuildSettings`, `Promotion`, `NFT`,
`AdCampaign`, `SharedAsset`, plus helpers including `clean_name_for_id`, `count_tokens`,
`sanitizeCredentialId`, `get_default_community` and `getUserEntitlements`.

**User-domain data has an owner.** User fields, entitlements and per-user flags belong to their
model or service module, and every consumer goes through it. Reaching into a user-domain Firestore
collection from outside its owner is a review-blocking anti-pattern, not a shortcut — the owner is
where a new field gets added and normalised.

## MCP tool definitions

`./mcp-tools` holds the tool schemas the platform advertises. A parameter that is not declared in
a tool's `inputSchema` is **rejected at the gateway boundary**, with the accepted set returned in
the error — it is never silently dropped. That makes the schema, not the prose description, the
contract: if the two disagree, the schema is what callers experience.
