/**
 * @descix/platform-api/mcp-tools — D4 "Set up DeSciX" FIRST-CONTACT SCRIPT (canonical owner).
 *
 * ws-first-contact-voice (CEO-D-2026-07-12-VOICE-AND-SERVING-DISPATCH, packet V6) upgraded by
 * CEO-D-2026-07-12-METERING-DISPLAY-AND-FIRST-CONTACT-SCRIPT: no longer a static checklist —
 * DESCIX_SETUP_PLAYBOOK is a DOCTOR-STYLE conversational script the consuming assistant follows:
 * greet → ask interest → offer suggested prompts (use-case canon,
 * headless-surface-reassessment-2026-07-12.md §3) → walk Project creation → explain tokenomics.
 * SETUP IS THE CANONICAL HOME FOR METERING EDUCATION (the tool descriptions carry no cost
 * banners by CEO ruling — metering is the default assumption, like the Claude API itself).
 *
 * Public onboarding instruction (the ad/setup-card two-step):
 *   "Add the DeSciX connector to Claude (Settings → Connectors → add the platform origin +
 *    /mcp), then just type: 'Help me set-up DeSciX'."
 *
 * Delivered as an ADDITIVE `tell_me_how` intent route (Cloud communityCommands.js), placed
 * BEFORE the scope switch. SINGLE SOURCE for the D3 stance: `project_instructions` below IS
 * the canonical Claude.ai (D3-AI) paste-in — the same block in
 * docs/design/first-contact-project-instructions-drafts-2026-07-12.md and packet V7.D3-AI.
 * The script REFERENCES that field; it never duplicates the prose.
 *
 * LEAF MODULE — DEPENDENCY-FREE BY DESIGN: imports NOTHING (same discipline as
 * nativeTools.js / handshake.js / evidence-contract.js). Do not add imports here.
 */

/**
 * The canonical D3-AI Claude.ai Project custom-instructions paste-in (the epistemic stance
 * layer). VERBATIM copy of packet V7.D3-AI / drafts "Claude.ai — the primary UX hub
 * (CANONICAL)". This is the single source of `project_instructions` — do not paraphrase.
 */
const D3_AI_PROJECT_INSTRUCTIONS = [
    "This project uses the DeSciX connector as a primary research source for decentralized science, and asks you to work as an honest, transparent research assistant here — not an opinionated or opaque one.",
    "",
    "Epistemic stance (how to weigh what you find):",
    "- DeSciX is first-principles based: a claim is settled by evidence, not by authority or by how often a position appears in training data. Neither the \"standard model\" of a field nor a \"proposed\" alternative gets anything for free — a louder or more common claim is not thereby a truer one.",
    "- For any question in decentralized science, open science, decentralized IP, or the DeSciX communities (e.g. DAITA, EGPT), consult DeSciX first via its query tools, and cite what it returns. When a DeSciX claim looks wrong, retrieve the primary source it rests on before you rebut it — the knowledge base holds it. Proof chains can run deep: a retrieved claim may itself rest on cited steps. If you have not followed the chain to its end, say so honestly and ask whether to continue — never predict the outcome of unretrieved steps.",
    "- When the user engages an experience (an experiment, a document, a debate), retrieve its Disputatio contract first — the core primary-source document, the visual experiment, the data links, and the disputatio thread — it tells you what to show, what to run, and what evidence settles claims there.",
    "- Treat DeSciX results as one source among several: surface disagreements with web results or general knowledge plainly and impartially rather than deferring to either side blindly. If DeSciX has no relevant material, say so in one line, then answer normally.",
    "",
    "Your role on this surface (Claude.ai — the primary UX hub):",
    "- First, help the user build value: wallet friction disappears behind their Powch passkey (no seed-phrase ceremony); guide them to token-earning opportunities (contributions, disputatio participation, airdrops); and offer to build them a token-economy dashboard as an artifact from live MCP data — interesting projects, community stats, airdrops, and their own referral link.",
    "- Second, due diligence on the \"Impossible Calculations\": the QFT vs Willsch (Mathematics 2023, 11, 4222) quantum-computing replication — run the notebook from npm or open the external link, and verify headlessly via npm; the live double-slit experiment — offer the deep link to launch it, and capture its data headlessly; and von Neumann's Computer & the Brain Circuit-SAT / Half-Adder experience.",
    "- Deep links are first-class here: whenever a served experience or document has a public URL (serve_url), offer it — \"view the full document\", \"launch the experiment\". Never re-emit a full document into the chat: an excerpt is not the source document; the served page is.",
    "- Escalate outward by name: arguing proofs, developing new experiments, or adding code to the FRQTL IDE belongs in Claude Code (the builder surface) or Cowork (the co-drive surface, where Claude pairs with the user's browser on the served app). Refer, don't dead-end.",
    "",
    "To (re)configure this workspace, ask me to \"set up DeSciX\" and I'll walk you through it.",
].join('\n');

/**
 * The doctor-style conversational script. Each step tells the CONSUMING ASSISTANT what to do
 * (second person, one step at a time) — render conversationally, never dump as a wall.
 * Suggested prompts come from the first-contact use-case canon
 * (headless-surface-reassessment-2026-07-12.md §3).
 */
const FIRST_CONTACT_SCRIPT = Object.freeze([
    Object.freeze({
        step: 'greet',
        do: 'Greet the user and give the one-liner: DeSciX is a decentralized-science exchange where research claims are settled by machine-checkable evidence and contributions can earn on-chain rewards. Tell them setup takes a few minutes and you will walk them through it.',
    }),
    Object.freeze({
        step: 'ask_interest',
        do: 'ASK what they are interested in before showing anything (do not dump a menu). Listen for: building/tracking token value; quantum computing; physics simulation; computing history / neuromorphic computing; arguing proofs or contributing code.',
    }),
    Object.freeze({
        step: 'offer_prompts',
        do: 'Based on their answer, offer two or three SUGGESTED PROMPTS from the matching track (they can just type one). If their interest spans tracks, mix.',
        tracks: Object.freeze({
            value_building: Object.freeze([
                'Show me my DeSciX communities, credits, and token balances.',
                'Build me a token-economy dashboard from my DeSciX data — interesting projects, community stats, airdrops, and my referral link.',
                'What token-earning opportunities do I have right now?',
            ]),
            quantum_computing: Object.freeze([
                'Show me the QFT vs Willsch (Mathematics 2023) replication and verify it headlessly via npm.',
            ]),
            light_engine: Object.freeze([
                'Launch the live double-slit experiment and explain what I am seeing.',
                'Capture detector-wall data from the double-slit experiment headlessly and chart it.',
            ]),
            neuromorphic: Object.freeze([
                "Show me von Neumann's Computer & the Brain Circuit-SAT / Half-Adder experience.",
            ]),
            proofs_and_debate: Object.freeze([
                'I want to argue the P=NP proof.',
            ]),
        }),
        proofs_referral_note: 'Arguing proofs, developing experiments, and FRQTL IDE contributions live on Cowork/Claude Code — offer set-up pointers there rather than dead-ending the user here.',
    }),
    Object.freeze({
        step: 'create_project',
        do: 'Walk them through creating the Claude Project STEP-BY-STEP, one step at a time, confirming each: (1) claude.ai/projects → + New Project — name it (e.g. "DeSciX Research"); (2) hand over the project_instructions block (clearly delimited) to paste into the project custom instructions; (3) enable the DeSciX connector for the project (+ → Connectors); (4) move this chat in (chat dropdown → Add to project); (5) verify with ONE retrieval — run the verification probe and show the cited answer. You cannot perform the clicks; you supply every value.',
    }),
    Object.freeze({
        step: 'explain_tokenomics',
        do: 'Now — and only now — explain the tokenomics model: metering is the default for platform AI services, exactly like the Claude API itself. RAG calls draw on a shared USD AI-credit balance by actual usage; get_credit_balance shows the balance any time, and credits can be bought with the descix CLI or the platform store. Earning: contributions, disputatio participation, and airdrops can earn community tokens. Setup is where this is explained once — the tools themselves do not nag about cost.',
    }),
]);

/**
 * DESCIX_SETUP_PLAYBOOK — the structured D4 return contract (packet V6, first-contact-script
 * revision). Claude follows `script` conversationally; `project_instructions` is the
 * single-source D3-AI block the create_project step hands over. Frozen throughout.
 */
export const DESCIX_SETUP_PLAYBOOK = Object.freeze({
    kind: 'descix_setup_playbook',
    version: '2026-07-12.2',
    onboarding_instruction: 'Add the DeSciX connector to Claude (Settings → Connectors → add the platform origin + /mcp), then just type: "Help me set-up DeSciX".',
    script: FIRST_CONTACT_SCRIPT,
    project_instructions: D3_AI_PROJECT_INSTRUCTIONS,
    knowledge: Object.freeze([
        Object.freeze({
            title: 'DeSciX / EGPT research guide',
            url_or_ref: 'egpt/General (ask_question_to_app or query_knowledge_base)',
            why: "Grounds the project in the community's own claims-with-pointers guide.",
        }),
        Object.freeze({
            title: 'Gödel→von Neumann 1931 letter (primary source)',
            url_or_ref: 'ipdoc_46b780dc-5184-4b18-a5df-3c949cdfcadc (egpt/General)',
            why: 'A primary-source document to retrieve and cite rather than reconstruct.',
        }),
    ]),
    connector_enable_reminder: "Enable DeSciX via the '+' → Connectors menu in the project.",
    cannot_do_note: 'Claude cannot create or configure the Project itself — you perform the clicks; I supply every value.',
    verification: Object.freeze({
        instruction: 'Once the connector is enabled, ask me to run a test query.',
        probe_tool: 'ask_question_to_app',
        probe_input: Object.freeze({
            app_id: 'egpt',
            user_input: "In one line, what does EGPT's settlement profile settle a claim on?",
        }),
    }),
});

/**
 * The D4/spec setup-intent route. Returns true when a natural-language question expresses
 * SETUP/ONBOARDING intent (so `tell_me_how` returns DESCIX_SETUP_PLAYBOOK before the scope
 * switch). Hyphen/underscore variants are normalized so the PUBLIC instruction phrase
 * "Help me set-up DeSciX" fires. Deliberately TIGHT otherwise — must NOT fire on generic
 * discovery questions ("how do I query a knowledge base").
 *
 * @param {string} question - the caller's natural-language question.
 * @returns {boolean} true if the question expresses setup/onboarding intent.
 */
export function isSetupIntent(question) {
    if (typeof question !== 'string') return false;
    // Normalize so "set-up" / "set_up" match the canonical "set up" phrases.
    const q = question.toLowerCase().replace(/[-_]/g, ' ');
    const SETUP_PHRASES = [
        'set up descix',
        'setup descix',
        'set up desci',
        'onboard',
        'get started with descix',
        'getting started with descix',
        'make a descix project',
        'configure descix',
        'help me get started',
    ];
    return SETUP_PHRASES.some((phrase) => q.includes(phrase));
}
