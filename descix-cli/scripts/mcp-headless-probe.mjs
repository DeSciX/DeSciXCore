/**
 * The child half of check-mcp-headless-reachability.mjs — kept separate so the tripwire is
 * registered before api-client.js is ever imported.
 */
import { register } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export async function runProbe(CLI, serviceMode) {
    register(new URL('./mcp-auth-tripwire.mjs', import.meta.url).href, import.meta.url);
    const srv = http.createServer((_q, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ERROR', auth_status: 'AUTH_FAILED', message: 'No account found with this wallet address.' }));
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-'));
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'), JSON.stringify({
        version: '2.1', type: 'workspace',
        env: { products: [], apiUrl: `http://127.0.0.1:${srv.address().port}` },
    }));
    process.chdir(dir);
    const { DeSciXApiClient } = await import(path.join(CLI, 'lib/api-client.js'));
    const c = new DeSciXApiClient({ projectRoot: dir, ...(serviceMode ? { serviceMode: true } : {}) });
    c.setCredentials({
        userId: 'probe', accessToken: null,
        walletAddress: '0x0000000000000000000000000000000000000001', signature: '0x' + '11'.repeat(65),
    });
    let headlessThrow = false, authEntered = false, other = null;
    try { await c.invoke('get_credit_balance', {}); }
    catch (e) {
        const msg = String((e && e.message) || e);
        if (e?.code === 'AUTH_MODULE_ENTERED' || /AUTH_MODULE_ENTERED/.test(msg)) authEntered = true;
        else if (/No interactive login fallback/i.test(msg)) headlessThrow = true;
        else other = msg.slice(0, 120);
    }
    srv.close();
    console.log(JSON.stringify({ serviceMode, headlessThrow, authEntered, other }));
}
