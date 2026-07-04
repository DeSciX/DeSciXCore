# DeSciX Secrets Audit

This document audits all keys in [docs/secret.example.json](../secret.example.json) against the codebase. It categorizes each key as **Active**, **Deprecated**, **Ambiguous**, or **Migration Target**, and provides cleanup recommendations.

## Methodology

- Grepped each key across `DeSciX_Cloud/cloud`, `DeSciX_Powch`, `DeSciX_Core/descix-cloud-core`
- Cross-referenced [DeSciX_Cloud/cloud/defaults-config.json](../../DeSciX_Cloud/cloud/defaults-config.json) and config-schema.json
- Status: **Active** = code uses it; **Deprecated** = no code usage; **Ambiguous** = unclear or likely bug; **Migration** = moving to descix-chain

---

## Audit Table

| Key | Purpose | Consumers | Status |
|-----|---------|------------|--------|
| **GOOGLE_CLIENT_ID** | Google OAuth client ID | authHandlers.js | Active |
| **GOOGLE_CLIENT_SECRET** | Google OAuth client secret | authHandlers.js, app.js | Active |
| **GOOGLE_CLIENT_SECRETS_FILE** | Path to Google OAuth JSON file | — | Deprecated (no .js usage) |
| **STRIPE_SECRET_KEY** | Stripe API secret | purchase.js, PowchPaymentService, stripeService | Active |
| **STRIPE_WEBHOOK_SECRET** | Stripe webhook verification | purchase.js, stripeService | Active |
| **STRIPE_PUBLISHABLE_KEY** | Stripe public key for frontend | purchase.js, authHandlers.js, stripeService | Active |
| **SECRET_KEY** | Core JWT/session signing | tools/test-jwt-secrets.js | Active |
| **GEMINI_API_KEY** | Gemini AI API | geminiInteractions.js, geminiAPI.js | Active |
| **PINECONE_API_KEY** | Pinecone vector DB | pineconeService.js, bootstrap.js, clearDevData.js | Active |
| **COINBASE_API_KEY_NAME** | Coinbase CDP API key name | priceFeedService.js | Active |
| **COINBASE_API_KEY_SECRET** | Coinbase CDP API PEM key | priceFeedService.js | Active |
| **SERPAPI_API_KEY** | SerpAPI search | — | Deprecated (no .js usage) |
| **OPENAI_API_KEY** | OpenAI API | — | Deprecated (no .js usage) |
| **GOOGLE_CSE_ID** | Google Custom Search | — | Deprecated (no .js usage) |
| **DESCIX_DISCORD_BOT_TOKEN** | Discord bot token | discordService.js, apiFront.js, app.js, cloudfunction_app.js | Active |
| **DRIVE_ROOT_FOLDER** | Google Drive root folder name | — | Deprecated (no .js usage) |
| **DRIVE_COMMUNITIES_FOLDER** | Drive communities folder | — | Deprecated (no .js usage) |
| **PUB_SUB_DISCORD_BOT_REPLY** | Pub/Sub topic for Discord replies | discordService.js, config.js (suffix by CONFIG_SECRET_VERSION) | Active |
| **FIRESTORE_DATABASE_ID** | Firestore database (e.g. descix-dev) | firestore.js, cloudflaredService, clearUsersAndPurchases, Powch storage | Active |
| **SITE_DOMAIN** | Domain for groups/email (e.g. descix.net) | communityManagement.js, googleGroupsService.js | Active |
| **APP_URL** | Public PWA URL (canonical; includes https://) | cryptoApisService, pwaHandoff, tokenClaimService, powchService, many others | Active |
| **DEFAULT_AI_MODEL** | Default Gemini model name | geminiInteractions, geminiAPI, appCommands, communityManagement, ipStorageUtils | Active |
| **STORAGE_BUCKET** | GCS bucket (private) | googleStorageService, communityManagement, ipStorageUtils, descixTest | Active |
| **STORAGE_BUCKET_PUBLIC** | GCS bucket (public) | googleStorageService, appCommands, communityManagement | Active |
| **STORAGE_ROOT_FOLDER** | GCS root path | defaults only | Deprecated (no service usage) |
| **DEFAULT_EMBEDDINGS_MODEL** | Embeddings model name | — | Deprecated (no .js usage) |
| **GEMINI_CACHE_STORAGE_SUBBUCKET** | GCS subpath for Gemini cache | googleStorageService, communityManagement, geminiAPI | Active |
| **PROJECT_ID** | GCP project ID | googleStorageService (Document AI processor) | Active |
| **DESCIX_ROUTER_COMMUNITY_MANAGER** | Router community manager email | communityManagement, appCommands, deviceAuthHandlers, googleStorageService, many | Active |
| **DESCIX_SUPER_USER** | Super user for impersonation | googleGroupsService.js | Active |
| **DESCIX_ADMIN_GROUP** | Admin group email | adminAlertService, loginWithWallet, bootstrap | Active |
| **PINECONE_ENVIORNMENT** | Pinecone env (typo: enviornment) | defaults only | Deprecated (Pinecone SDK uses apiKey+index) |
| **PINECONE_INDEX_NAME** | Pinecone index | pineconeService.js, clearDevData.js, ipStorageUtils | Active |
| **DEFAULT_COMMUNITY_ID** | Default community | userManagement, discordService, communityManagement, onboardingRouter, many | Active |
| **DEFAULT_APP_ID** | Default app | communityCommands, communityManagement, ipStorageUtils | Active |
| **DEFAULT_KNOWLEDGEBASE_NAME** | Default KB name | appCommands, communityManagement, ragCommands, ipStorageUtils | Active |
| **DESCIX_ROUTER_PREFIX** | Email routing prefix (e.g. daita+) | googleGroupsService.js | Active |
| **DEFAULT_COMMUNITY_PROMPT** | System prompt template | communityManagement.js, ipStorageUtils | Active |
| **WEB3_HARDHAT_PROVIDER_URL** | Hardhat local RPC | — | Deprecated (Rinkeby deprecated; use POLYGON_URL) |
| **WEB3_INFURA_DEV_PROVIDER_URL** | Infura dev RPC | — | Deprecated |
| **DAITA_TOKEN_ADDRESS_INFURA** | Legacy DAITA on Infura network | — | Deprecated (superseded by descix-chain) |
| **DAITA_TOKEN_ADDRESS_MAINNET** | Legacy DAITA mainnet | — | Deprecated (superseded by descix-chain) |
| **BITCOIN_TREASURY_WALLET** | Bitcoin treasury address | — | Ambiguous (in secret; chainWatcherService uses POLYGON_DAITA for polygon) |
| **EVM_TREASURY_WALLET** | EVM treasury address | — | Ambiguous (same as above) |
| **DISCORD_BOT_URL** | Discord bot HTTP endpoint | apiFront.js, discordService.js | Active |
| **DISCORD_CLIENT_ID** | Discord OAuth client | app.js, authHandlers.js | Active |
| **DISCORD_CLIENT_SECRET** | Discord OAuth secret | app.js, authHandlers.js | Active |
| **WALLET_ADDRESS** | Platform wallet (deployer/treasury) | contractDeployService, communityCommands, poolDeploymentService, chainWatcherService | Active |
| **WALLET_PK** | Deployer private key | contractDeployService, tokenService, poolService, many | Active |
| **ETHERSCAN_API_KEY** | Etherscan verification | hardhat.config.js, deploy scripts (process.env) | Active (env, not utils) |
| **CRYPTOAPIS_API_KEY** | CryptoAPIs | cryptoApisSdkService, Powch, portfolioCryptoApisTest | Active |
| **POLYGON_DAITA_PROXY_ADDRESS** | DAITA contract on Polygon | tokenService, chainWatcherService, quoteService, populateChainData | Migration (→ descix-chain) |
| **POLYGON_EGPT_PROXY_ADDRESS** | EGPT contract on Polygon | tokenService, populateChainData | Migration (→ descix-chain) |
| **CONTRACT_ADMIN** | Contract admin address | deploy-DAITA_v2.js (process.env) | Active (env) |
| **POLYGON_URL** | Polygon RPC URL | depositService, contractDeployService, tokenService, many | Active |
| **DEFAULT_SIGNATURE_MESSAGE** | Wallet signature message for TOS | powchCommands, authHandlers, tokenService, bootstrap, tests | Active |
| **WALLET_SEED_PHRASE** | Legacy seed phrase key | — | Deprecated (use HD_WALLET_MNEMONIC) |
| **HD_WALLET_MNEMONIC** | BIP-39 seed for EVM | hdWalletService.js, Powch paymentService | Active |
| **BTC_XPUB** | Bitcoin xpub | config-schema dev overrides | Active (GenerateCryptoSecrets) |
| **DOGE_XPUB** | Dogecoin xpub | config-schema dev overrides | Active (GenerateCryptoSecrets) |
| **GMAIL_SENDER_EMAIL** | Gmail reply-to | gmailAPI.js | Active |
| **POWCH_RP_ID** | WebAuthn relying party ID | powchService.js, DeSciX_Powch index.js | Active |
| **POWCH_RP_NAME** | WebAuthn relying party name | powchService.js, DeSciX_Powch index.js | Active |
| **POWCH_JWT_SECRET** | Powch JWT signing | powchCommands.js, DeSciX_Powch index.js | Active |
| **DRIVE_COMMUNITY_TEMPLATE_FOLDER_ID** | Drive template folder | communityManagement, deviceAuthHandlers | Active |
| **DRIVE_AGENT_APP_TEMPLATE_FOLDER_ID** | Drive app template folder | appCommands, communityManagement, deviceAuthHandlers | Active |

---

## Keys Not in secret.example.json but in defaults-config

| Key | Purpose | Status |
|-----|---------|--------|
| DOCUMENT_AI_PROCESSOR_ID | Document AI processor | Used in googleStorageService; add to secret if using Document AI |
| CLOUDFLARED_TUNNEL_NAME | Cloudflare tunnel | Dev override |
| CLOUDFLARE_TOKEN | Cloudflare API token | Dev override |
| DEBUG_WALLET_ADDRESS, DEBUG_WALLET_PK | Dev wallet | Dev overrides |

---

## TEST Label Setup

For the test environment, create a Secret Manager version with the `TEST` label:

```bash
# Create version from JSON file
gcloud secrets versions add descix_config --data-file=test-config.json

# Label the latest version (or specific version) as TEST
# Note: Secret Manager uses version aliases; ensure TEST points to the correct version
```

**Required keys for TEST:**
- Same as DEBUG/LIVE minus env-specific overrides
- `APP_URL`: e.g. `https://test.descix.net`
- `FIRESTORE_DATABASE_ID`: `descix-dev` (shared with platform dev)
- `DISCORD_BOT_URL`: Test App Engine URL if Discord enabled
- `SITE_DOMAIN`: `descix.net`

---

## Cleanup Checklist

### Remove from secret.example.json (Deprecated)

- GOOGLE_CLIENT_SECRETS_FILE
- SERPAPI_API_KEY
- OPENAI_API_KEY
- GOOGLE_CSE_ID
- DRIVE_ROOT_FOLDER
- DRIVE_COMMUNITIES_FOLDER
- STORAGE_ROOT_FOLDER
- DEFAULT_EMBEDDINGS_MODEL
- PINECONE_ENVIORNMENT (and fix typo if ever used)
- WEB3_HARDHAT_PROVIDER_URL
- WEB3_INFURA_DEV_PROVIDER_URL
- WEB3_INFURA_MAINNET_PROVIDER_URL
- DAITA_TOKEN_ADDRESS_INFURA
- DAITA_TOKEN_ADDRESS_MAINNET
- WALLET_SEED_PHRASE (document HD_WALLET_MNEMONIC as the canonical key)

### Migration Target (descix-chain)

- POLYGON_DAITA_PROXY_ADDRESS
- POLYGON_EGPT_PROXY_ADDRESS

Once [CHAIN_DATA_CONSOLIDATION_DESIGN](../../DeSciX_Cloud/cloud/design/CHAIN_DATA_CONSOLIDATION_DESIGN.md) is implemented, these move to descix-chain Products/Contracts. `populateChainData` can seed from chain config; services should use `getContractAddressBySymbol()`.

### Ambiguous (Clarify / Fix)

- **BITCOIN_TREASURY_WALLET**, **EVM_TREASURY_WALLET**: Defined but not used. `chainWatcherService.getTreasuryAddress('polygon')` returns `utils.POLYGON_DAITA_PROXY_ADDRESS` (the token contract, not treasury). Recommendation: Add treasury per chain to descix-chain; use BITCOIN/EVM_TREASURY or chain-specific config once wired.

---

## Config vs. Secret Manager: Recommendations

This section compares [config-schema.json](../../DeSciX_Cloud/cloud/config-schema.json) and [defaults-config.json](../../DeSciX_Cloud/cloud/defaults-config.json) to recommend what belongs in Secret Manager vs. what stays in config files.

### Add to Secret Manager (and secret.example.json)

| Key | Reason |
|-----|--------|
| **DOCUMENT_AI_PROCESSOR_ID** | Used in googleStorageService for Document AI PDF processing. Not in defaults-config; add as null in defaults, document in secret.example. Required only if using Document AI strategy. |
| **SECRET_KEY** | Core JWT/session signing. In secret.example and ENV_TEMPLATE but missing from defaults-config. Ensure it is in Secret Manager for all envs. |

### Keep in Config (defaults-config.json) — Do NOT put in Secret Manager

These are non-sensitive, instance-wide defaults. They may vary by deployment but are not secrets.

| Key | Current Value | Notes |
|-----|---------------|-------|
| DRIVE_COMMUNITY_TEMPLATE_FOLDER_ID | `1ocVhrODQPGMICWmod3OWSGAj4-t6-o-B` | Shared Google Drive template; same across envs |
| DRIVE_AGENT_APP_TEMPLATE_FOLDER_ID | `1ewnvtVG5hhEcRg_rcYmnGiWjTjznu8nu` | Same |
| GATEWAY_ROUTES | `["/apifront"]` | Routing config |
| TOKENS | `["DAITA","EGPT"]` | Platform token list |
| UPVOTE_EMOJI | `👍` | UI default |
| DEFAULT_KNOWLEDGEBASE_NAME | `General` | config-schema defaults |
| VECTORIZE_MODE | `sync` | RAG behavior |
| PINECONE_INTEGRATED_EMBED_MODEL | `llama-text-embed-v2` | config-schema defaults |
| DELIMITER | `\n---END---\n` | Parsing |
| SEND_THRESHOLD | `500` | Messaging |
| MAX_SEND_SIZE | `2000` | Messaging |
| DEFAULT_PORT | `4000` | Local dev |
| PLATFORM_DEFAULT_CHAIN | `polygon` | config-schema defaults |
| POLYGON_USDC_ADDRESS | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | Public contract; consider moving to descix-chain |
| POLYGON_USDT_ADDRESS | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | Same |

### Deprecate from defaults-config.json and config-schema

| Key | Action |
|-----|--------|
| GOOGLE_CLIENT_SECRETS_FILE | Remove from defaults-config; already Deprecated in audit |
| SERPAPI_API_KEY, OPENAI_API_KEY, GOOGLE_CSE_ID | Remove from defaults-config |
| DRIVE_ROOT_FOLDER, DRIVE_COMMUNITIES_FOLDER | Remove from defaults-config |
| STORAGE_ROOT_FOLDER | Remove from defaults-config |
| DEFAULT_EMBEDDINGS_MODEL | Remove from defaults-config |
| PINECONE_ENVIORNMENT | Remove (typo; Pinecone uses apiKey+index) |
| DESCIX_TOKEN_ADDRESS_HARDHAT, DESCIX_TOKEN_ADDRESS_MAINNET | Remove; superseded by descix-chain |
| UPVOTE_EMOJI in bootstrap_keys | config-schema: UPVOTE_EMOJI is a default, not bootstrap; move to defaults only |

### Ambiguous

| Key | Issue |
|-----|-------|
| **POLYGON_USDC_ADDRESS, POLYGON_USDT_ADDRESS** | Public addresses; currently in defaults. Per CHAIN_DATA_CONSOLIDATION_DESIGN, move to descix-chain stablecoins config. Until then, keep in defaults. |
| **DEFAULT_COMMUNITY_PROMPT** | Long template in defaults (null). If env-specific, belongs in Secret Manager. If shared, can stay in defaults with a checked-in template. |

### config-schema.json Adjustments

1. **bootstrap_keys**: Remove UPVOTE_EMOJI (it has a safe default; bootstrap should be minimal).
2. **dev_override_keys**: Remove deprecated keys (SERPAPI, OPENAI, GOOGLE_CSE, etc.). Add DOCUMENT_AI_PROCESSOR_ID if Document AI is used in dev.
3. **defaults**: Add PLATFORM_DEFAULT_CHAIN (already in DeSciX_Core/descix-cloud-core config-schema). Ensure DeSciX_Cloud config-schema stays in sync with packages.

### dev-overrides.json

- Contains POWCH_JWT_SECRET (or other dev overrides). Already in .gitignore (root, DeSciX_Cloud/cloud, packages). Never commit real secrets; use dev-overrides.json.example as template.

---

## Recommendation Summary

1. **Remove** deprecated keys from secret.example.json and document HD_WALLET_MNEMONIC as the canonical seed key.
2. **Migrate** POLYGON_DAITA/EGPT to descix-chain per CHAIN_DATA_CONSOLIDATION_DESIGN; update tokenService, chainWatcherService, quoteService to use `getContractAddressBySymbol()` and chain DB.
3. **Clarify** treasury addresses: wire BITCOIN_TREASURY_WALLET and EVM_TREASURY_WALLET into chainWatcherService, or add treasury to descix-chain ChainConfig.
4. **Add to Secret Manager**: DOCUMENT_AI_PROCESSOR_ID (if using Document AI), ensure SECRET_KEY is documented.
5. **Keep in config**: DRIVE_*_FOLDER_ID, GATEWAY_ROUTES, TOKENS, UPVOTE_EMOJI, DEFAULT_KNOWLEDGEBASE_NAME, VECTORIZE_MODE, PINECONE_*_MODE, DELIMITER, SEND_THRESHOLD, MAX_SEND_SIZE, DEFAULT_PORT, PLATFORM_DEFAULT_CHAIN, POLYGON_USDC/USDT_ADDRESS (until descix-chain migration).
6. **Deprecate from config**: GOOGLE_CLIENT_SECRETS_FILE, SERPAPI, OPENAI, GOOGLE_CSE, DRIVE_ROOT/COMMUNITIES_FOLDER, STORAGE_ROOT_FOLDER, DEFAULT_EMBEDDINGS_MODEL, PINECONE_ENVIORNMENT, DESCIX_TOKEN_ADDRESS_*.
