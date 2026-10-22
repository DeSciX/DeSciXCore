/**
 * @descix/platform-api/mcp-tools — PLATFORM BASICS SSOT (CEO 2026-10-09, "we're going to
 * need a platform basics … that gets into the bootstrap sequence").
 *
 * THE single owner of the app-lane-safe "platform basics": the canonical identity model,
 * naming rules, environments, and the developer entry path. Two consumers, zero mirrors:
 *   - DeSciX_Cloud communityCommands.tellMeHowBootstrap serves PLATFORM_BASICS_SUMMARY as
 *     the `platform_basics` section of the tell_me_how scope:'bootstrap' payload;
 *   - DeSciX/scripts/generate-platform-basics.mjs renders PLATFORM_BASICS_DOC into
 *     V2_docs/architecture/platform-basics.md (GENERATED), which the daita General corpus
 *     manifest carries tier-1 into the KB and the public docs dist.
 *
 * Three-audience rule (same contract as handshake.js): this text is for the EXTERNAL
 * app-lane reader. It must never name load balancers, GCP projects, secret names, or
 * platform source paths. Dependency-free leaf. Do NOT hand-mirror these strings; import
 * them, or regenerate the doc.
 */

/**
 * The compact basics served inline on every scope:'bootstrap' response. Deterministic —
 * no RAG lookup. Keep it under ~250 words; the full treatment is PLATFORM_BASICS_DOC,
 * reachable through the KB (query_knowledge_base on daita/General).
 */
export const PLATFORM_BASICS_SUMMARY = [
    "PLATFORM BASICS — the identity model everything else derives from:",
    "1. A community IS its ERC-20 token, per environment: community_id == app_id == lowercased(token_symbol). One token symbol, one on-chain contract, one community.",
    "2. Every community is itself an app (its default app), and every app belongs to exactly one community. Sub-apps are named {community_id}-{short_name} (e.g. egpt-frqtl, daita-docs); the short name never contains '-'.",
    "3. 'descix' is a BRAND, never an identifier. The root community is labelled DAITA with community_id 'daita' (== lowercased token symbol DAITA); DeSciX is the platform brand, never an id. No app or community id is ever 'descix' or 'descix-*'.",
    "4. Identifiers are environment-invariant; records are per-environment. A community or app existing in one environment (dev/demo/prod) says nothing about another — each env materializes its own records.",
    "5. An app is three slots: site/ (any web framework), assets/ (its agent instructions and description), microservice/ (optional backend). Each app has knowledge bases; RAG answers are metered against USD AI credits.",
    "6. Developers build with the published @descix/cli and @descix/app-sdk as external users: `app init` creates the record + default KB + scaffold, `descix serve` runs it locally, `kb corpus sync` publishes the KB, `site upload` publishes the site. Start with `descix tell-me-how`.",
].join('\n');

/**
 * The full app-lane-safe basics document, rendered to V2_docs/architecture/platform-basics.md
 * by DeSciX/scripts/generate-platform-basics.mjs. Markdown body WITHOUT the generated-file
 * banner (the generator owns that).
 */
export const PLATFORM_BASICS_DOC = `# DeSciX Platform Basics

What every reader — a person or an agent — must internalize before doing anything on DeSciX.
This is the app-developer / consumer view; it deliberately contains no platform internals.

## The canonical identity model

Everything on DeSciX derives from one model:

1. **Token ⟷ contract, 1:1.** Every token has exactly one on-chain ERC-20 contract. One
   symbol means one contract — a second contract is never deployed for an existing symbol.
2. **Community ⟷ token, per environment.** Every community is linked to exactly one token —
   the token whose symbol it carries — and its identifiers derive from it:
   \`community_id == lowercased(token_symbol)\` (DAITA → \`daita\`, EGPT → \`egpt\`).
3. **A community IS an app — its default app.** Every community is itself an agentic app:
   \`app_id == community_id == lowercased(token_symbol)\`. Creating a community creates its
   default app; the two are inseparable.
4. **Apps belong to communities; not every app is a community.** Every app belongs to exactly
   one community. Sub-apps are named \`{community_id}-{short_name}\` (for example
   \`egpt-frqtl\`, \`daita-docs\`); the short name never contains \`-\` (the reserved
   separator). Only communities have on-chain tokens — sub-apps have no on-chain presence.
5. **Identifiers are environment-invariant; records are per-environment.** The same id names
   the same thing across dev, demo and prod, but each environment materializes its own
   community and app records. Existence in one environment says nothing about another, and an
   environment name is never part of an id.

## Brand vs identifier

\`descix\` is the platform's **brand and infrastructure namespace** (the descix.net domain,
the \`descix\` CLI) — it is **never an identifier**. The root community is labelled DAITA,
with \`community_id\` and \`app_id\` \`daita\` (== the lowercased token symbol DAITA); DeSciX
is the platform brand, never an id. There is no \`descix\` community, so no app is ever named
\`descix\` or \`descix-*\`. Display names are free-form; ids are always the lowercased token symbol.

## What an app is

An app is an agentic service with three slots:

\`\`\`
{app_root}/
├── site/           ← its web UI — any framework (VitePress, React, …)
├── assets/         ← system_instructions.md, app_description.md, icon.png
└── microservice/   ← optional backend service
\`\`\`

Every app has one or more **knowledge bases** (KBs). RAG queries against them
(\`ask_question_to_app\`, \`query_knowledge_base\`) are metered against a shared USD
AI-credit balance (\`get_credit_balance\` shows it). Apps are served inside the platform's
App Shell — on the web at \`/p/{app_id}\` under the platform origin — and self-custody
wallet auth (Powch) comes with the shell automatically.

## How developers work

Developers build as **external users of the published SDK** — \`@descix/cli\` and
\`@descix/app-sdk\` from npm — never against platform internals:

- \`descix tell-me-how\` — capability discovery; the canonical first command.
- \`descix app init -a <app_id> -c <community_id>\` — creates the platform record, the
  default KB, and the local scaffold. The only way an app comes into existence.
- \`descix serve\` — local dev: one HTTPS origin serving your app in the shell, proxying a
  dev server (vite-like, with HMR) or serving your built site, exactly as the cloud will.
- \`descix kb corpus sync -a <app_id> -k <kb>\` — the one KB publishing surface: a
  git-tracked corpus manifest, synced from your repo.
- \`descix site upload -a <app_id>\` — publishes the built site to the platform.

Agents connect over MCP at the platform origin + \`/mcp\`; \`tell_me_how({ scope:
'bootstrap' })\` is the canonical first call and returns these basics, the caller's context,
and the essential tool schemas.

## Where to go deeper

- \`descix tell-me-how\` (CLI) or \`tell_me_how({ question })\` (MCP) — ask in your own words.
- The app-developer runbook in the daita docs — the end-to-end path from \`app init\` to a
  published, listed app.
- \`fetch_my_purchases()\` — what the signed-in caller owns; \`get_credit_balance()\` — the
  AI-credit balance platform AI usage draws on.
`;
