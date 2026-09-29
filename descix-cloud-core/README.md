# @descix/cloud-core

**Config bootstrap, Firestore, Pub/Sub, mesh context and service-manifest registration for DeSciX
platform microservices.** This is the bottom layer: it owns the platform's relationship with GCP
and knows nothing about DeSciX domain objects.

Consumed by `@descix/platform-api`, the Cloud microservice, the Powch microservice, and the
microservice scaffold the CLI generates.

## Where it sits

```
@descix/cloud-core        GCP infrastructure: config, Firestore, Pub/Sub, manifests
        ↑
@descix/platform-api      DeSciX domain: models, auth, permissions, entitlements
        ↑
your microservice
```

There is no package called a "service SDK". The library is `@descix/cloud-core`, the scaffold is
`@descix/service-starter`, and the command group that creates and runs one is
`descix microservice`.

## Entry point

One export path, `.` → `src/index.js`.

```js
import { createCloudConfig, initializeCloudConfig, getCloudConfig } from '@descix/cloud-core';

createCloudConfig({ rootPath: path.resolve(import.meta.url, '../../') });
await initializeCloudConfig();
const utils = getCloudConfig();
```

That three-call shape is the contract: construct, await, then read. `getCloudConfig()` before
`initializeCloudConfig()` resolves has not finished loading secrets.

## What it exports

| Area | Members |
|---|---|
| Config | `createCloudConfig`, `initializeCloudConfig`, `getCloudConfig`, `CloudConfigFatalError` |
| Constants | `ProductTypes`, `LoginStatus`, `NetworkStatus`, `PERMISSIONS`, `GUEST_ALLOWED_COMMANDS` |
| Mesh context | `mountMeshApi`, `MESH_API_PATH`, `MESH_TRUST_ANCHORS`, `MESH_VERIFY_MODES`, `resolveMeshTrustAnchor`, `normalizeMeshContext`, `serializeMeshContext`, `signMeshContext`, `verifyMeshContext`, `buildOutboundMeshHeaders`, `MeshContextError` |
| Infrastructure | `getFirestoreInstance`, `publishMessage`, `registerServiceManifest`, `killExistingProcess` |
| Helpers | `networkResponse`, `stripInvalidAndLower` |

Source modules: `config.js`, `firestore.js`, `meshContext.js`, `meshApi.js`, `pubsub.js`,
`serviceManifest.js`, `processUtils.js`, `storageUtils.js`.

## Mesh services verify, or do not boot

A service's `/api` is where the platform proxies mesh commands, and it is publicly reachable.
Mount it with `mountMeshApi(app, apiRouter)` after `initializeCloudConfig()` resolves and after the
JSON body parser. Whether it verifies the platform-signed context is decided at boot, not by the
service:

| Where | `MESH_CTX_VERIFY_MODE` | Result |
|---|---|---|
| Managed runtime (App Engine, Cloud Run, Cloud Functions) | `enforce` | boots; unsigned or forged requests get `401` before any handler |
| Managed runtime | unset, `""` or `warn` | refuses to boot (`CloudConfigFatalError`) |
| Developer machine | `enforce` or `warn` | verifies (warn logs and proceeds) |
| Developer machine | unset or `""` | unverified; every request carries `req.meshContextVerified === false` |

Set `"MESH_CTX_VERIFY_MODE": "enforce"` in the service's `defaults-config.json`. The key the
service verifies against is the platform's, resolved from `DEPLOY_ENV` (`MESH_TRUST_ANCHORS`); a
config file that sets `MESH_CTX_PUBLIC_KEY` or `MESH_CTX_KEY_ID` refuses boot.

## Config

Config resolution — the two-phase bootstrap, the layer precedence, per-environment secret
isolation, and the no-fallback policy — is documented in the platform repo at
`DeSciX/V2_docs/deployment/config-bootstrap-chain.md`. Read it before adding a config key; where
a value belongs (secret vs per-env defaults vs env-invariant defaults) is a decision that file
already answers.

(Deliberately not a relative link: this README ships inside the published package, where any
`../` path escapes the tarball and resolves to nothing.)

**A missing required value is a boot failure, not a default.** `CloudConfigFatalError` is the
intended behaviour: a null surfaces a misconfiguration immediately instead of letting a service
run against the wrong thing. Do not add `|| 'some-default'` to recover from it.

`config-schema.json` ships with the package and holds only the keys universal to every consumer.
Service-specific requirements are declared by the consumer via
`createCloudConfig({ additionalRequiredKeys: [...] })`, so a small app microservice is not forced
to supply RAG, chain or AI config it never uses.
