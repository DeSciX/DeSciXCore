/**
 * @descix/platform-api/mcp-tools — D4 "Set up DeSciX" setup-playbook (canonical owner module).
 *
 * ws-first-contact-voice (CEO-D-2026-07-12-VOICE-AND-SERVING-DISPATCH, packet V6):
 * spec D4 delivered as an ADDITIVE `tell_me_how` intent route, NOT a new handshake tool.
 * Cloud `communityCommands.js` `tell_me_how` calls `isSetupIntent(question)` as an intent
 * route placed BEFORE the scope switch; on a match it returns DESCIX_SETUP_PLAYBOOK — the
 * structured object Claude renders into a walkthrough.
 *
 * SINGLE SOURCE for the D3 stance: `project_instructions` below IS the canonical Claude.ai
 * (D3-AI) paste-in text — the same block published in
 * docs/design/first-contact-project-instructions-drafts-2026-07-12.md ("Claude.ai — the
 * research assistant (CANONICAL)") and mirrored in the voice-pass packet (V7 D3-AI). The
 * playbook and the paste-in are versioned together so the stance text cannot drift.
 *
 * LEAF MODULE — DEPENDENCY-FREE BY DESIGN: this file imports NOTHING (same discipline as
 * nativeTools.js / handshake.js / evidence-contract.js) so both MCP transports consume it
 * by import without dragging infrastructure in. Do not add imports here.
 */

/**
 * The canonical D3-AI Claude.ai Project custom-instructions paste-in (the epistemic stance
 * layer). VERBATIM copy of packet V7.D3-AI / drafts "Claude.ai — the research assistant
 * (CANONICAL)". This is the single source of `project_instructions` — do not paraphrase.
 */
const D3_AI_PROJECT_INSTRUCTIONS = [
    'This project uses the DeSciX connector as a primary research source for decentralized science, and asks you to work as an honest, transparent research assistant here — not an opinionated or opaque one.',
    '',
    'Epistemic stance (how to weigh what you find):',
    '- DeSciX is first-principles based: a claim is settled by evidence, not by authority or by how often a position appears in training data. Neither the "standard model" of a field nor a "proposed" alternative gets anything for free — a louder or more common claim is not thereby a truer one.',
    '- For any question in decentralized science, open science, decentralized IP, or the DeSciX communities (e.g. DAITA, EGPT), consult DeSciX first via its query tools, and cite what it returns. When a DeSciX claim looks wrong, retrieve the primary source it rests on before you rebut it — the knowledge base holds it.',
    '- Treat DeSciX results as one source among several: surface disagreements with web results or general knowledge plainly and impartially rather than deferring to either side blindly. If DeSciX has no relevant material, say so in one line, then answer normally.',
    '',
    'Your role on this surface (Claude.ai — the research assistant): retrieval, citation, primary sources, and light building in Artifacts (you have artifacts and some tooling like npm). For heavier work, refer it out: a full `lake build`, a large proof, or a kit contribution belongs in Claude Code (the building surface); running a distribution app with local servers or installs belongs in Cowork (the most capable interactive surface). Point the user there rather than dead-ending.',
    '',
    'To (re)configure this workspace, ask me to "set up DeSciX" and I\'ll walk you through it.',
].join('\n');

/**
 * DESCIX_SETUP_PLAYBOOK — the structured D4 return contract (packet V6). Claude renders this
 * into a step-by-step walkthrough. Frozen so a consumer cannot mutate the shared object.
 */
export const DESCIX_SETUP_PLAYBOOK = Object.freeze({
    kind: 'descix_setup_playbook',
    version: '2026-07-12',
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
    ui_steps: Object.freeze([
        "Create a new Project at claude.ai/projects → '+ New Project'. (I can't do this step for you — I'll supply every value.)",
        "Name it (e.g., 'DeSciX Research') and paste the provided instructions into the project's custom instructions.",
        'Enable the DeSciX connector for this project (+ → Connectors).',
        'Move our current chat in: chat-name dropdown → Add to project.',
        "Say the word and I'll run a quick test query to confirm it's live.",
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
 * SETUP/ONBOARDING intent (so `tell_me_how` should return DESCIX_SETUP_PLAYBOOK before the
 * scope switch). Deliberately TIGHT — it must NOT fire on generic discovery questions
 * ("how do I query a knowledge base"); those flow through to the normal discovery scope.
 *
 * Note: DESCIX_SETUP_PLAYBOOK.project_instructions is the single-source D3-AI stance text —
 * this detector is the only gate that surfaces it, so keep the phrase list conservative.
 *
 * @param {string} question - the caller's natural-language question.
 * @returns {boolean} true if the question expresses setup/onboarding intent.
 */
export function isSetupIntent(question) {
    if (typeof question !== 'string') return false;
    const q = question.toLowerCase();
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
