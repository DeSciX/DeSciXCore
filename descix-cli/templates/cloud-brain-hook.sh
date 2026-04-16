#!/bin/bash
set -euo pipefail
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ALIGNMENT="$PROJECT_DIR/.descix/alignment.json"
[ ! -f "$ALIGNMENT" ] && exit 0
REMINDER=$(node -e '
const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync(process.argv[1], "utf-8"));
const apps = cfg.apps || [];
if (!apps.length) { process.exit(0); }
const appList = apps.map(a => a.app_id).join(", ");
const appsCsv = apps.map(a => a.app_id).join(",");
const level = (cfg.defaults && cfg.defaults.level) || 3;
const thinking = (cfg.defaults && cfg.defaults.thinking !== undefined) ? cfg.defaults.thinking : -1;
const tokens = (cfg.defaults && cfg.defaults.tokens) ? "--tokens" : "";
const roles = apps.map(a => "  • " + a.app_id + ": " + a.role).join("\n");
const reminder = "CLOUD BRAIN ACTIVE — Aligned apps: " + appList + "\n\nYOU MUST query your cloud knowledge bases BEFORE starting any task. Do not guess when the KB knows.\n\nApps and their domains:\n" + roles + "\n\nMulti-app query:\n  descix chat --apps " + appsCsv + " -q \"YOUR QUESTION\" --level " + level + " --thinking " + thinking + " " + tokens + "\n\nSingle-app query:\n  descix chat --app APP_ID -q \"YOUR QUESTION\" --level " + level + " " + tokens + "\n\nMCP fallback:\n  ask_question_to_app({ app_id: \"APP_ID\", user_input: \"YOUR QUESTION\" })\n\nThreading: omit --new to continue session. Use --new only for unrelated topics.\nQuery MULTIPLE TIMES during a task. Cross-reference KB answers with local files.";
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: reminder } }));
' "$ALIGNMENT" 2>/dev/null)
[ -n "$REMINDER" ] && echo "$REMINDER"
