/**
 * Test fixture: a REAL local listener that answers unsigned requests the way the mesh guard does
 * (HTTP 401, code MESH_CTX_UNSIGNED). service-bootstrap's register() self-calls the service's own
 * listener and registers only on that answer, so any test driving register() with
 * selfRegister:true needs one. It is a stand-in for the guard, not the guard: the real
 * createMeshContextVerifier is exercised against the same self-test in
 * descix-cloud-core/tests/mesh-self-test.test.js. Returns { origin, close }.
 */
import http from 'node:http';

export async function startGuardedListener() {
    const server = http.createServer((req, res) => {
        req.resume();
        req.on('end', () => {
            res.statusCode = 401;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ success: false, code: 'MESH_CTX_UNSIGNED' }));
        });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
