/**
 * Test-only preload: `node --import ./tests/tools/site-upload-mock-backend.mjs bin/descix.js site upload …`
 * runs the REAL CLI with the backend mocked — no network, no wallet. bin/descix.js's imports of
 * lib/auth-guard.js and lib/api-client.js are redirected to the stubs below: requireAuth passes, and
 * DeSciXApiClient.invoke answers get_site_build_config / get_site_deploy_token from canned data and
 * prints `MOCK invoke <command> <files>` to stderr so a test reads exactly which files the upload
 * would send. Every other command is refused loudly (a test that reaches one is wrong).
 */
import { register } from 'node:module';

const here = new URL('./', import.meta.url);

register('data:text/javascript,' + encodeURIComponent(`
  const STUB_AUTH = ${JSON.stringify(new URL('site-upload-mock-backend.mjs?stub=auth', here).href)};
  const STUB_API = ${JSON.stringify(new URL('site-upload-mock-backend.mjs?stub=api', here).href)};
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
        '    if (command === "get_site_build_config") return { status: "OK", message: { VITE_BASE_PATH: "/", VITE_GTM_ID: "" } };',
        '    if (command === "get_site_deploy_token") return { status: "OK", message: { signed_urls: {}, upload_headers: {}, existing_manifest: null, token_id: "t", site_url: "https://mock.invalid/" } };',
        '    throw new Error("site-upload-mock-backend: unexpected command " + command);',
        '  }',
        '}',
        'export default DeSciXApiClient;',
      ].join("\\n") };
    }
    return next(url, context);
  }
`));
