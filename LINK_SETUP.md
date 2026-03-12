# npm link Setup for DeSciX Core

DeSciX Core (this repo) can live anywhere on disk. Peer projects consume packages via `npm link`, so relative paths are not required.

## 1. From DeSciX Core (this repo)

```bash
cd /path/to/DeSciXCore   # or DeSciX_Core/ inside DeSciX
npm install
npm run link
```

This registers all packages globally: `cryptoapis-sdk`, `@descix/app-sdk`, `@descix/cli`, `@descix/cloud-core`, `@descix/sdk`.

## 2. In each peer project

Replace `file:` dependencies with `npm link`:

### DeSciX_Cloud (microservice)

```bash
cd DeSciX_Cloud/microservice
npm link @descix/cloud-core cryptoapis-sdk
```

Keep the existing `file:` entries in `package.json`; `npm link` overrides them at resolve time with the globally registered packages. When you move DeSciX Core elsewhere, switch to version ranges (`^1.0.0`) and use `npm link` for local dev.

### DeSciX_Cloud/site (Platform PWA)

```bash
cd DeSciX_Cloud/site
npm link @descix/app-sdk
```

### DeSciX_Cloud admin (ops)

```bash
cd DeSciX_Cloud/microservice/admin
npm link @descix/cli
```

### DeSciX_Powch/site and samples (if using app-sdk)

```bash
cd DeSciX_Powch/site   # or samples/standalone-react, samples/standalone-vanilla
npm link @descix/app-sdk
```

### DeSciX_Powch service (if using cloud-core)

```bash
cd DeSciX_Powch/service
npm link @descix/cloud-core
```

## 3. Unlinking

To restore published/registry versions:

```bash
npm unlink @descix/cloud-core cryptoapis-sdk   # etc.
npm install
```

## Recommended disk layout

With `npm link`, DeSciX Core can be a sibling of DeSciX or live in a separate directory:

```
~/Code/
├── DeSciXCore/          # This repo (packages only)
│   ├── cryptoapis-sdk/
│   ├── descix-app-sdk/
│   ├── descix-cli/
│   ├── descix-cloud-core/
│   └── descix-sdk/
└── DeSciX/              # Monorepo with peer projects
    ├── DeSciX_Cloud/
    ├── DeSciX_Powch/
    └── ...
```

Or keep packages inside DeSciX (current layout):

```
DeSciX/
├── DeSciX_Core/            # DeSciX Core (separate git, npm link source)
│   └── ...
├── DeSciX_Cloud/
└── DeSciX_Powch/
```

Run `npm run link` from `DeSciX_Core/` and `npm link <pkg>` from each peer project. No `file:` paths required.
