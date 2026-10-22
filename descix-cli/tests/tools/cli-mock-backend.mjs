/**
 * Test-only preload: `node --import ./tests/tools/cli-mock-backend.mjs bin/descix.js <verb> …`
 * runs the REAL CLI with the backend mocked — no network, no wallet. bin/descix.js's imports of
 * lib/auth-guard.js and lib/api-client.js are redirected to the stubs below: requireAuth passes, and
 * DeSciXApiClient.invoke answers from canned data and prints `MOCK invoke <command> <files>` and
 * `MOCK scope <command> app=<app_id> community=<community_id>` to stderr, so a test reads exactly
 * which files a site upload would send and which app/community a kb verb asked about:
 *   site upload — get_site_build_config, get_site_deploy_token
 *   kb verbs    — list_knowledge_bases (General registered), kb_list_file_ids (empty KB),
 *                 get_kb_rag_status (0 vectors)
 *   kb create   — init_git_mode_kb, answered by CLI_MOCK_INIT_KB: `created` (created: true),
 *                 `exists` (created: false), `app-not-found` (404 APP_NOT_FOUND) or `denied`
 *                 (403 PERMISSION_DENIED); unset, it is refused like any unexpected command.
 *                 Its params are printed as `MOCK params init_git_mode_kb <json>`.
 *   site upload, confirmed — with CLI_MOCK_CONFIRM set to the JSON of a confirm_site_deploy
 *                 `message`, get_site_deploy_token mints a signed URL per file (https://mock.invalid/put/…),
 *                 every PUT to mock.invalid answers 200 (no bytes leave the process), and
 *                 confirm_site_deploy answers that message — so a test drives the whole upload to
 *                 its receipt. CLI_MOCK_CONFIRM=lost makes confirm throw (HTTP 504) and get_site_manifest
 *                 serve this upload's token: the lost-response read-back path. Unset, the token has no
 *                 signed URLs and confirm is refused.
 * Every other command is refused loudly (a test that reaches one is wrong) — get_product_context
 * included, so a kb verb that could not name the app's community from its repo fails the test.
 */
import { register } from 'node:module';

if (process.env.CLI_MOCK_CONFIRM) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://mock.invalid/')) {
      process.stderr.write(`MOCK put ${String(url).slice('https://mock.invalid/put/'.length)}\n`);
      return new Response(null, { status: 200 });
    }
    return realFetch(url, init);
  };
}

const here = new URL('./', import.meta.url);

register('data:text/javascript,' + encodeURIComponent(`
  const STUB_AUTH = ${JSON.stringify(new URL('cli-mock-backend.mjs?stub=auth', here).href)};
  const STUB_API = ${JSON.stringify(new URL('cli-mock-backend.mjs?stub=api', here).href)};
  export async function resolve(specifier, context, next) {
    const fromCli = context.parentURL && context.parentURL.includes('/bin/descix.js');
    if (fromCli && specifier === '../lib/auth-guard.js') return { url: STUB_AUTH, shortCircuit: true };
    if (fromCli && specifier === '../lib/api-client.js') return { url: STUB_API, shortCircuit: true };
    return next(specifier, context);
  }
  export async function load(url, context, next) {
    if (url === STUB_AUTH) {
      return { format: 'module', shortCircuit: true, source: 'export async function requireAuth() { return { mock: true }; }\\nexport async function isAuthenticated() { return true; }' };
    }
    if (url === STUB_API) {
      const real = ${JSON.stringify(new URL('../../lib/api-client.js', here).href)};
      return { format: 'module', shortCircuit: true, source: [
        'import { DeSciXApiClient as Real } from ' + JSON.stringify(real) + ';',
        'export * from ' + JSON.stringify(real) + ';',
        'export class DeSciXApiClient extends Real {',
        '  async invoke(command, params = {}) {',
        '    process.stderr.write("MOCK invoke " + command + " " + JSON.stringify((params.files || []).map((f) => f.path)) + "\\\\n");',
        '    process.stderr.write("MOCK scope " + command + " app=" + params.app_id + " community=" + params.community_id + "\\\\n");',
        '    if (command === "get_site_build_config") return { status: "OK", message: { VITE_BASE_PATH: "/", VITE_GTM_ID: "" } };',
        '    if (command === "get_site_deploy_token") {',
        '      const signed_urls = process.env.CLI_MOCK_CONFIRM ? Object.fromEntries((params.files || []).map((f) => [f.path, "https://mock.invalid/put/" + f.path])) : {};',
        '      return { status: "OK", message: { signed_urls, upload_headers: {}, existing_manifest: null, token_id: "t", site_url: "https://mock.invalid/" } };',
        '    }',
        '    if (command === "confirm_site_deploy" && process.env.CLI_MOCK_CONFIRM === "lost") throw new Error("HTTP 504");',
        '    if (command === "get_site_manifest" && process.env.CLI_MOCK_CONFIRM === "lost") return { status: "OK", message: { exists: true, manifest: { deploy: { token_id: "t", deployed_at: "2026-10-22T00:00:00.000Z" } } } };',
        '    if (command === "confirm_site_deploy" && process.env.CLI_MOCK_CONFIRM) return { status: "OK", message: JSON.parse(process.env.CLI_MOCK_CONFIRM) };',
        '    if (command === "list_knowledge_bases") return { status: "OK", message: { knowledgebases: [{ knowledgebase_name: "General" }] } };',
        '    if (command === "kb_list_file_ids") return { status: "OK", message: { file_ids: [], unique_count: 0, total_chunks: 0 } };',
        '    if (command === "get_kb_rag_status") return { status: "OK", message: { vectorCount: 0 } };',
        '    if (command === "init_git_mode_kb" && process.env.CLI_MOCK_INIT_KB) {',
        '      const mode = process.env.CLI_MOCK_INIT_KB;',
        '      process.stderr.write("MOCK params init_git_mode_kb " + JSON.stringify(params) + "\\\\n");',
        '      const bag = { community_id: "mock-comm", app_id: params.app_id, kb_name: params.kb_name };',
        '      if (mode === "created") return { status: "OK", message: { created: true, ...bag, message: "KB initialized for Git Mode" } };',
        '      if (mode === "exists") return { status: "OK", message: { created: false, ...bag, message: "KB already exists" } };',
        '      if (mode === "app-not-found") throw Object.assign(new Error("Could not resolve community for " + params.app_id + ". Run bootstrap first."), { code: "APP_NOT_FOUND", status: 404 });',
        '      if (mode === "denied") throw Object.assign(new Error("init_git_mode_kb requires the app owner or an app/community/platform admin"), { code: "PERMISSION_DENIED", status: 403 });',
        '      throw new Error("cli-mock-backend: unknown CLI_MOCK_INIT_KB " + mode);',
        '    }',
        '    throw new Error("cli-mock-backend: unexpected command " + command);',
        '  }',
        '}',
        'export default DeSciXApiClient;',
      ].join("\\n") };
    }
    return next(url, context);
  }
`));
