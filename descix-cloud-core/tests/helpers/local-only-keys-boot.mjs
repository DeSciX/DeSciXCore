/**
 * Child-process boot for local-only-keys.test.js. Runs the REAL createCloudConfig + initialize()
 * over the service root given as argv[2], with Secret Manager replaced by the blob in
 * argv[3] (JSON). Prints one JSON line: { ok: true, sink } or { ok: false, name, message }.
 * Run only as a child: it builds the process-wide config singleton and exits.
 */
import { createCloudConfig } from '../../src/config.js';

const [rootPath, blobJson] = process.argv.slice(2);
const out = (o) => { process.stdout.write('@@RESULT ' + JSON.stringify(o) + '\n'); process.exit(0); };
for (const k of ['log', 'warn', 'error']) console[k] = () => {};
try {
    const cfg = createCloudConfig({ rootPath });
    cfg.accessSecretVersion = async () => blobJson;
    await cfg.initialize();
    out({ ok: true, sink: cfg.LOCAL_VERIFICATION_CODE_SINK ?? null, managed: cfg.isManagedCloudRuntime });
} catch (e) {
    out({ ok: false, name: e.name, message: e.message });
}
