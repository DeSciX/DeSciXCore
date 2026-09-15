/**
 * THE LOOPBACK LISTENER, IN ITS OWN PROCESS.
 *
 * WHY ITS OWN PROCESS (measured 2026-09-15, this instrument's first positive-control run): when
 * the listener lived inside the census runner, `spawnSync` blocked the runner's event loop for
 * the whole of every child run, so the server never accepted anything. The positive control
 * connected, got no response, and hung to a 300s SIGTERM while the listener logged ZERO. A
 * listener that cannot accept during the measurement reads exactly like a listener nobody
 * called — the gate-that-cannot-fail this instrument exists to avoid.
 *
 * IT LOGS EVERY CONNECTION, not just every request: a connection that is opened and abandoned
 * still names a harness that reached for the network.
 */
import http from 'node:http';
import fs from 'node:fs';

const LOG = process.env.CENSUS_LISTENER_LOG;
const PORTFILE = process.env.CENSUS_LISTENER_PORTFILE;

let seq = 0;
const rec = (o) => fs.appendFileSync(LOG, JSON.stringify({ n: ++seq, t: Date.now(), ...o }) + '\n');

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
        rec({ kind: 'request', method: req.method, url: req.url, body: body.slice(0, 400) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'OK',
            message: { userId: 'census-disposable' },
            communities: [], apps: [], service_slots: [], results: [], data: {},
        }));
    });
});

server.on('connection', (sock) => {
    rec({ kind: 'connection', from: sock.remoteAddress, remotePort: sock.remotePort });
});

fs.writeFileSync(LOG, '');
server.listen(0, '127.0.0.1', () => {
    fs.writeFileSync(PORTFILE, String(server.address().port));
    process.stdout.write(`listener up on 127.0.0.1:${server.address().port}\n`);
});
