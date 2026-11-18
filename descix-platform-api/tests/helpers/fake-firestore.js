/**
 * An in-memory Firestore standing in for CacheFirestore in owner tests: a flat map of document paths.
 * `.db` supports collection(path).doc(id) / where('==' | '>=' | '<', incl. FieldPath.documentId()) / limit /
 * get / listDocuments, doc get / set / create / update / delete / listCollections, and runTransaction with
 * get / set / update / delete (FieldValue.delete() honoured). The CacheFirestore helpers the User model uses
 * (get_doc, get_docs, get_docs_with_ids, put_doc, update_doc_fields, delete_doc) read the same map.
 *
 * `set(data, { merge: true })` and put_doc deep-merge plain maps as Firestore does; `db.databaseId` /
 * `db.projectId` are the client's target (settable); `unboundedReads` counts query reads without a limit.
 *
 * Fault injection: `faults.read(path)` / `faults.write(path)` returning true makes that read / write throw;
 * `faults.drop(path)` returning true makes a delete of that path report success and change nothing.
 * `log` records every write in order ({ op, path }); a test pushes its own events into it to order them.
 * Nothing leaves the process.
 */

export function createFakeFirestore(real) {
    const docs = new Map(); // path -> data
    const counters = { unboundedReads: 0 };
    const created = new Map(); // path -> ISO
    const log = [];
    const faults = { read: () => false, write: () => false, drop: () => false };
    const isDelete = (v) => typeof v?.isEqual === 'function' && v.isEqual(real.FieldValue.delete());
    const isDocId = (f) => typeof f !== 'string';

    /** Deep copy of plain data; class instances (Timestamp, FieldValue) are kept by reference. */
    const clone = (v) => {
        if (Array.isArray(v)) return v.map(clone);
        if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
            return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
        }
        return v;
    };
    const readGuard = (path) => { if (faults.read(path)) throw new Error(`fake: read of ${path} failed`); };
    const writeGuard = (op, path) => {
        if (faults.write(path)) throw new Error(`fake: ${op} of ${path} failed`);
        log.push({ op, path });
    };
    const put = (path, data) => {
        if (!created.has(path)) created.set(path, new Date(Date.UTC(2026, 0, 1) + created.size * 1000).toISOString());
        docs.set(path, clone(data));
    };
    const snapOf = (path) => {
        const d = docs.get(path);
        const id = path.split('/').pop();
        return {
            id,
            ref: docRef(path),
            exists: d !== undefined,
            data: () => (d === undefined ? undefined : clone(d)),
            createTime: d !== undefined && created.has(path) ? { toDate: () => new Date(created.get(path)) } : undefined,
        };
    };
    const isPlain = (v) => v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
    /** Firestore set(..., { merge: true }): plain maps merge key by key at every depth; anything else replaces. */
    const mergeInto = (base, data) => {
        const out = isPlain(base) ? clone(base) : {};
        for (const [k, v] of Object.entries(data)) {
            if (isDelete(v)) delete out[k];
            else out[k] = isPlain(v) && isPlain(out[k]) ? mergeInto(out[k], v) : clone(v);
        }
        return out;
    };
    const setDoc = (path, data, opts) => put(path, opts?.merge ? mergeInto(docs.get(path), data) : data);
    const applyUpdate = (path, data) => {
        if (!docs.has(path)) throw Object.assign(new Error(`NOT_FOUND ${path}`), { code: 5 });
        const doc = clone(docs.get(path));
        for (const [k, v] of Object.entries(data)) {
            if (isDelete(v)) delete doc[k];
            else doc[k] = clone(v);
        }
        docs.set(path, doc);
    };

    function docRef(path) {
        const i = path.lastIndexOf('/');
        return {
            id: path.slice(i + 1),
            path,
            parentPath: path.slice(0, i),
            async get() { readGuard(path); return snapOf(path); },
            async set(data, opts) { writeGuard('set', path); setDoc(path, data, opts); },
            async create(data) {
                writeGuard('create', path);
                if (docs.has(path)) throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 });
                put(path, data);
            },
            async update(data) { writeGuard('update', path); applyUpdate(path, data); },
            async delete() { writeGuard('delete', path); if (!faults.drop(path)) docs.delete(path); },
            async listCollections() {
                readGuard(`${path}/*`);
                const ids = new Set();
                for (const p of docs.keys()) if (p.startsWith(`${path}/`)) ids.add(p.slice(path.length + 1).split('/')[0]);
                return [...ids].sort().map((id) => collectionRef(`${path}/${id}`));
            },
        };
    }

    function query(collPath, filters, max) {
        return {
            where: (field, op, value) => {
                if (!['==', '>=', '<'].includes(op)) throw new Error(`fake query: unsupported op ${op}`);
                return query(collPath, [...filters, [field, op, value]], max);
            },
            limit: (n) => query(collPath, filters, n),
            async get() {
                readGuard(collPath);
                if (max == null) counters.unboundedReads += 1;
                const depth = collPath.split('/').length + 1;
                const hit = (path, d) => filters.every(([f, op, v]) => {
                    const x = isDocId(f) ? path.split('/').pop() : d[f];
                    if (op === '==') return x === v;
                    if (typeof x !== 'string') return false;
                    return op === '>=' ? x >= v : x < v;
                });
                let found = [...docs.entries()]
                    .filter(([p, d]) => p.startsWith(`${collPath}/`) && p.split('/').length === depth && hit(p, d))
                    .map(([p]) => p).sort();
                if (max != null) found = found.slice(0, max);
                const out = found.map(snapOf);
                return { docs: out, empty: out.length === 0, size: out.length };
            },
        };
    }

    function collectionRef(path) {
        return {
            id: path.split('/').pop(),
            path,
            doc: (id) => docRef(`${path}/${id}`),
            ...query(path, [], null),
            async listDocuments() {
                readGuard(`${path}/*`);
                const depth = path.split('/').length;
                const ids = new Set();
                for (const p of docs.keys()) if (p.startsWith(`${path}/`)) ids.add(p.split('/')[depth]);
                return [...ids].sort().map((id) => docRef(`${path}/${id}`));
            },
        };
    }

    const db = {
        databaseId: 'descix-dev',
        projectId: 'descix',
        collection: (path) => collectionRef(path),
        doc: (path) => docRef(path),
        async runTransaction(fn) {
            const pending = [];
            const result = await fn({
                get: (ref) => ref.get(),
                update: (ref, data) => { pending.push(['update', ref, data]); },
                set: (ref, data, opts) => { pending.push(['set', ref, data, opts]); },
                delete: (ref) => { pending.push(['delete', ref]); },
            });
            for (const [op, ref] of pending) if (faults.write(ref.path)) throw new Error(`fake: ${op} of ${ref.path} failed`);
            for (const [op, ref, data, opts] of pending) {
                log.push({ op: `tx-${op}`, path: ref.path });
                if (op === 'update') applyUpdate(ref.path, data);
                else if (op === 'set') setDoc(ref.path, data, opts);
                else if (!faults.drop(ref.path)) docs.delete(ref.path);
            }
            return result;
        },
    };

    class FakeCacheFirestore {
        get db() { return db; }
        async get_doc(coll, id) { readGuard(`${coll}/${id}`); const d = docs.get(`${coll}/${id}`); return d === undefined ? null : clone(d); }
        async get_docs(coll, ids = null, where = null) {
            const r = await this.get_docs_with_ids(coll, ids, where);
            return r === null ? null : r.map(({ _id, ...d }) => ({ ...d, id: d.id ?? _id }));
        }
        async get_docs_with_ids(coll, ids = null, where = null) {
            try {
                let q = query(coll, [], null);
                for (const [f, op, v] of where || []) q = q.where(f, op, v);
                const snap = await q.get();
                return snap.docs.filter((d) => !ids || ids.includes(d.id)).map((d) => ({ ...d.data(), _id: d.id }));
            } catch {
                return null;
            }
        }
        // cloud-core put_doc is docRef.set(data, { merge: true }).
        async put_doc(coll, id, data) { try { writeGuard('set', `${coll}/${id}`); setDoc(`${coll}/${id}`, data, { merge: true }); return true; } catch { return false; } }
        async update_doc_fields(coll, id, data) { try { writeGuard('update', `${coll}/${id}`); applyUpdate(`${coll}/${id}`, data); return true; } catch { return false; } }
        async delete_doc(coll, id) { try { writeGuard('delete', `${coll}/${id}`); docs.delete(`${coll}/${id}`); return true; } catch { return false; } }
    }

    return {
        FakeCacheFirestore,
        docs,
        log,
        faults,
        put,
        counters,
        get: (path) => (docs.has(path) ? clone(docs.get(path)) : undefined),
        reset() {
            docs.clear(); created.clear(); log.length = 0; counters.unboundedReads = 0;
            db.databaseId = 'descix-dev'; db.projectId = 'descix';
            faults.read = () => false; faults.write = () => false; faults.drop = () => false;
        },
        snapshot: () => new Map([...docs].map(([p, d]) => [p, JSON.stringify(d)])),
    };
}
