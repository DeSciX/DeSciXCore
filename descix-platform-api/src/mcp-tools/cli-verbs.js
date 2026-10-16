/**
 * @descix/platform-api/mcp-tools — the CLI VERB LIST (eabadir/DeSciXCloud#20, option B).
 *
 * cli-verbs.generated.json is GENERATED from the live commander tree of
 * @descix/cli bin/descix.js by `npm run generate:cli-verbs` in descix-cli — never hand-edit it.
 * One entry per runnable verb, sorted by verbPath:
 *   { verbPath, description, arguments[{name, required, variadic, description}],
 *     options[{flags, description, required}], runbookAnchor }
 * runbookAnchor is the app-developer runbook heading anchor ('#_5-run-it-locally-descix-serve')
 * declared beside the verb's definition, or null when the runbook has no section for it.
 * descix-cli/tests/cli-verbs-generated.test.js fails when this file is stale or an anchor names
 * no runbook heading. Consumer: DeSciX_Cloud tell_me_how (the cli_verbs section).
 */
import VERBS from './cli-verbs.generated.json' with { type: 'json' };

function deepFreeze(value) {
    if (value && typeof value === 'object') {
        for (const v of Object.values(value)) deepFreeze(v);
        Object.freeze(value);
    }
    return value;
}

/** @type {ReadonlyArray<{verbPath: string, description: string, arguments: object[], options: object[], runbookAnchor: string|null}>} */
export const CLI_VERBS = deepFreeze(VERBS);
