/**
 * verb-invoke-graph.mjs
 *
 * THE ONE OWNER of "which /apifront command(s) does a CLI verb invoke". Builds a map of
 * `"verb path" -> ["command_name", ...]` by statically reading bin/descix.js's commander tree
 * and following every `invoke('literal', ...)` / `invokeRaw('literal', ...)` call reachable from
 * each verb's action handler, TRANSITIVELY across bin/ and lib/ (named and namespace imports).
 *
 * Consumed by:
 *   - scripts/generate-verb-invokes.mjs (writes/checks lib/verb-invokes.generated.json)
 *   - tests/verb-invokes-conformance.test.js (regenerate-and-diff + orphan-literal audit)
 *
 * SCOPE BOUNDARIES (all deliberate, not omissions):
 *
 * 1. Only PLAIN function calls are resolved: a bare `foo(...)` resolved against the current
 *    module's own top-level function bindings or its named imports, and a namespace member call
 *    `ns.foo(...)` resolved against `ns`'s imported module's named exports. A member call on
 *    anything else (`apiClient.ensureInitialized()`, `chalk.red(...)`, `options.foo()`) is not
 *    attempted — the codebase's own call sites never route a command name through such a call,
 *    and attempting it would require type inference this script does not do.
 *
 * 2. `lib/auth-guard.js` (`requireAuth` / `isAuthenticated`) is EXCLUDED from traversal. Nearly
 *    every verb action calls `requireAuth(apiClient)` before its real work, and requireAuth
 *    itself calls `apiClient.invoke('validate_session', ...)`. `validate_session` is declared
 *    ACCESS.AUTHENTICATED on the server (permissionMiddleware.js), i.e. PUBLIC visibility. Left
 *    unexcluded, every authenticated admin verb would carry a mixed
 *    [validate_session(public), delete_community(admin)] set, and "every invoked command is
 *    admin" would be false for every one of them — silently defeating the entire hide mechanism.
 *    This is authentication PRECONDITION middleware, not "what the verb does"; excluding it is a
 *    narrow, documented boundary, the same shape as the three declared dynamic exceptions below.
 *
 * 3. `lib/api-client.js` and `lib/service-api-client.js` are EXCLUDED. Their `invoke`/`invokeRaw`
 *    call sites live inside CLASS METHOD bodies (`DeSciXApiClient.invoke`, `.ensureSession`,
 *    `.mcpListTools`, the `service-api-client.js` wrapper) — they are the DEFINITION of the
 *    dispatch mechanism, not a verb's own consumer call site, and per (1) above this script never
 *    resolves a call graph into a class's instance methods (`new DeSciXApiClient().invoke(...)`
 *    is not statically resolvable to "the class's invoke method" without type inference).
 *
 * 4. `bin/mcp-server.js` is a SEPARATE ENTRY POINT (its own `bin` target), never imported by
 *    `bin/descix.js`, and is out of scope entirely.
 *
 * DYNAMIC (non-literal) invoke call sites are recorded as "seen but not attributed" — the first
 * argument was not a plain string Literal or a zero-expression TemplateLiteral. The three known
 * dynamic categories in this codebase: `mcp execute`'s `--tool` (`apiClient.invoke(options.tool, ...)`),
 * `bin/mcp-server.js`'s `invoke(name, params)` (out of scope per (4)), and the `${cmdPrefix}_*`
 * templates in `attachRecordsSubcommands` (app_records put/query/get/delete).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';

/** Files whose bodies are never traversed for invoke attribution. See header for why. */
const EXCLUDED_TRAVERSAL_SUFFIXES = [
  path.join('lib', 'auth-guard.js'),
  path.join('lib', 'api-client.js'),
  path.join('lib', 'service-api-client.js'),
  // lib/command-visibility.js calls get_command_surface as part of the BOOTSTRAP that decides
  // what to hide (bin/descix.js's tail, before program.parseAsync) — never from inside a verb's
  // own action handler. Same shape as api-client.js: infrastructure, not a verb's call site.
  path.join('lib', 'command-visibility.js'),
];

function isExcludedFile(absPath, cliRoot) {
  const rel = path.relative(cliRoot, absPath);
  return EXCLUDED_TRAVERSAL_SUFFIXES.some((suffix) => rel === suffix);
}

/** Generic recursive descent over every descendant AST node (acorn nodes are plain objects). */
function* walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) yield* walk(item);
    return;
  }
  if (typeof node.type === 'string') yield node;
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
    const value = node[key];
    if (value && typeof value === 'object') yield* walk(value);
  }
}

/** A plain string Literal, or a zero-expression TemplateLiteral (equivalent to a plain string). */
function literalStringOf(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? null;
  }
  return null;
}

/**
 * Parse one module and index: named/namespace/default imports (resolved to absolute paths for
 * relative specifiers only — bare specifiers like 'chalk' or '@descix/app-sdk/dev' are recorded
 * as unresolvable, which is correct: nothing this script needs to follow lives across a package
 * boundary), and top-level function-like bindings (function declarations, and
 * const/let = function/arrow expressions), keyed both by local name (intra-module calls) and by
 * exported name (inter-module named/namespace-member calls).
 */
function loadModule(absPath) {
  const src = fs.readFileSync(absPath, 'utf8');
  const ast = parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: false });

  const imports = new Map(); // localName -> { kind: 'named'|'namespace'|'default', file, exportedName? }
  const localFunctions = new Map(); // localName -> function-like node
  const exportsMap = new Map(); // exportedName -> function-like node

  const isFnLike = (n) => n && (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');

  const registerBinding = (name, node, exported) => {
    if (!isFnLike(node)) return;
    localFunctions.set(name, node);
    if (exported) exportsMap.set(name, node);
  };

  const scanDeclaration = (decl, exported) => {
    if (!decl) return;
    if (decl.type === 'FunctionDeclaration' && decl.id) {
      registerBinding(decl.id.name, decl, exported);
    } else if (decl.type === 'VariableDeclaration') {
      for (const d of decl.declarations) {
        if (d.id?.type === 'Identifier' && d.init) {
          registerBinding(d.id.name, d.init, exported);
        }
      }
    }
  };

  for (const stmt of ast.body) {
    if (stmt.type === 'ImportDeclaration') {
      const source = stmt.source.value;
      const isRelative = source.startsWith('.') || source.startsWith('/');
      const resolvedFile = isRelative ? path.resolve(path.dirname(absPath), source) : null;
      for (const spec of stmt.specifiers) {
        if (spec.type === 'ImportDefaultSpecifier') {
          imports.set(spec.local.name, { kind: 'default', file: resolvedFile });
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          imports.set(spec.local.name, { kind: 'namespace', file: resolvedFile });
        } else if (spec.type === 'ImportSpecifier') {
          imports.set(spec.local.name, { kind: 'named', file: resolvedFile, exportedName: spec.imported.name });
        }
      }
    } else if (stmt.type === 'FunctionDeclaration') {
      scanDeclaration(stmt, false);
    } else if (stmt.type === 'VariableDeclaration') {
      scanDeclaration(stmt, false);
    } else if (stmt.type === 'ExportNamedDeclaration') {
      if (stmt.declaration) {
        scanDeclaration(stmt.declaration, true);
      } else if (stmt.specifiers?.length) {
        for (const spec of stmt.specifiers) {
          const localNode = localFunctions.get(spec.local.name);
          if (localNode) exportsMap.set(spec.exported.name, localNode);
        }
      }
    }
    // export default is deliberately NOT indexed: every default export in this codebase is an
    // object literal re-bundling already-named-exported functions, and every consumer in this
    // codebase uses namespace imports (`import * as x`) which read NAMED exports only.
  }

  return { filePath: absPath, imports, localFunctions, exportsMap };
}

/** Resolve a `foo(...)` or `ns.foo(...)` callee to a function-like node + its owning module. */
function resolveCallTarget(moduleInfo, moduleCache, name, ns) {
  if (ns == null) {
    const local = moduleInfo.localFunctions.get(name);
    if (local) return { file: moduleInfo.filePath, node: local };
    const imp = moduleInfo.imports.get(name);
    if (imp && imp.file && (imp.kind === 'named' || imp.kind === 'default')) {
      const target = getModule(moduleCache, imp.file);
      const exported = imp.kind === 'default' ? target.exportsMap.get('default') : target.exportsMap.get(imp.exportedName);
      if (exported) return { file: imp.file, node: exported };
    }
    return null;
  }
  const nsImport = moduleInfo.imports.get(ns);
  if (nsImport && nsImport.kind === 'namespace' && nsImport.file) {
    const target = getModule(moduleCache, nsImport.file);
    const exported = target.exportsMap.get(name);
    if (exported) return { file: nsImport.file, node: exported };
  }
  return null;
}

function getModule(moduleCache, absPath) {
  let mod = moduleCache.get(absPath);
  if (!mod) {
    mod = loadModule(absPath);
    moduleCache.set(absPath, mod);
  }
  return mod;
}

/**
 * Collect every literal invoke/invokeRaw command string reachable (transitively) from a
 * function-like node, memoized per (file, node.start) so shared helpers are analyzed once.
 */
function collectInvokes(moduleInfo, fnNode, ctx) {
  const key = `${moduleInfo.filePath}::${fnNode.start}`;
  const cached = ctx.functionCache.get(key);
  if (cached === 'IN_PROGRESS') return new Set(); // cycle guard
  if (cached) return cached;
  ctx.functionCache.set(key, 'IN_PROGRESS');

  const result = new Set();
  for (const node of walk(fnNode.body ?? fnNode)) {
    if (node.type !== 'CallExpression') continue;
    const callee = node.callee;

    // Terminal: an invoke/invokeRaw call site, on ANY receiver.
    if (callee.type === 'MemberExpression' && !callee.computed &&
        (callee.property.name === 'invoke' || callee.property.name === 'invokeRaw')) {
      const lit = literalStringOf(node.arguments[0]);
      if (lit != null) {
        result.add(lit);
      } else {
        ctx.dynamicSites.push({ file: moduleInfo.filePath, start: node.start });
      }
      continue;
    }

    // Resolvable: a bare identifier call, or a namespace-member call.
    let name = null, ns = null;
    if (callee.type === 'Identifier') {
      name = callee.name;
    } else if (callee.type === 'MemberExpression' && !callee.computed && callee.object.type === 'Identifier') {
      name = callee.property.name;
      ns = callee.object.name;
    } else {
      continue;
    }

    const target = resolveCallTarget(moduleInfo, ctx.moduleCache, name, ns);
    if (!target) continue;
    if (isExcludedFile(target.file, ctx.cliRoot)) continue;

    const targetModule = getModule(ctx.moduleCache, target.file);
    const sub = collectInvokes(targetModule, target.node, ctx);
    for (const c of sub) result.add(c);
  }

  ctx.functionCache.set(key, result);
  return result;
}

/** `.command('name <arg>')` / `.command('name [arg...]')` -> the bare command token. */
function commandToken(rawName) {
  return rawName.trim().split(/\s+/)[0];
}

/**
 * Flatten a right-nested Commander method chain (`base.a().b().c()`) into
 * `{ base: <leftmost non-call node>, calls: [{name, args}, ...] }` in LEFT-TO-RIGHT call order.
 */
function flattenChain(node) {
  const calls = [];
  let cur = node;
  while (cur && cur.type === 'CallExpression' && cur.callee.type === 'MemberExpression' && !cur.callee.computed) {
    calls.push({ name: cur.callee.property.name, args: cur.arguments });
    cur = cur.callee.object;
  }
  calls.reverse();
  return { base: cur, calls };
}

/**
 * Walk bin/descix.js's TOP-LEVEL statements to discover every commander verb's full path and its
 * `.action(fn)` handler node — the same structural pattern throughout the file:
 *   `const groupVar = program.command('name').description(...)`  (registers groupVar)
 *   `groupVar.command('leaf').option(...).action(async (opts) => {...})`  (records a verb)
 * Only relies on this ONE shape (verified against the executing file, not assumed): every
 * `.command(...)` argument is a plain string literal, and no chain nests two `.command()` calls
 * in one statement without an intermediate variable.
 */
function discoverVerbActions(binModule) {
  const identifierToNode = new Map();
  identifierToNode.set('program', { verbPath: [] });
  const verbActions = []; // { verbPath: string, fnNode }

  const processChain = (initNode, declaredName) => {
    const { base, calls } = flattenChain(initNode);
    if (base.type !== 'Identifier') return;
    let current = identifierToNode.get(base.name);
    if (!current) return;
    let actionFn = null;
    for (const c of calls) {
      if (c.name === 'command') {
        const raw = literalStringOf(c.args[0]);
        if (raw == null) { current = null; break; }
        current = { verbPath: [...current.verbPath, commandToken(raw)] };
      } else if (c.name === 'action') {
        actionFn = c.args[0];
      }
    }
    if (!current) return;
    if (declaredName) identifierToNode.set(declaredName, current);
    if (actionFn) verbActions.push({ verbPath: current.verbPath.join(' '), fnNode: actionFn });
  };

  for (const stmt of binModule.ast.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const d of stmt.declarations) {
        if (d.id?.type === 'Identifier' && d.init) processChain(d.init, d.id.name);
      }
    } else if (stmt.type === 'ExpressionStatement') {
      processChain(stmt.expression, null);
    }
  }
  return verbActions;
}

/**
 * Build the full `{ "verb path": ["cmd", ...] }` map for the CLI rooted at `cliRoot`
 * (the descix-cli package directory).
 *
 * @param {string} cliRoot - absolute path to descix-cli/
 * @returns {{ map: Record<string,string[]>, diagnostics: { dynamicSites: Array, verbCount: number, commandCount: number } }}
 */
export function buildVerbInvokeMap(cliRoot) {
  const binPath = path.join(cliRoot, 'bin', 'descix.js');
  const moduleCache = new Map();
  const binModule = getModule(moduleCache, binPath);
  binModule.ast = parse(fs.readFileSync(binPath, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module', locations: false });

  const verbActions = discoverVerbActions(binModule);
  const ctx = { moduleCache, functionCache: new Map(), dynamicSites: [], cliRoot };

  const map = {};
  const allCommands = new Set();
  for (const { verbPath, fnNode } of verbActions) {
    const invokes = [...collectInvokes(binModule, fnNode, ctx)].sort();
    map[verbPath] = invokes;
    for (const c of invokes) allCommands.add(c);
  }

  const sortedMap = {};
  for (const key of Object.keys(map).sort()) sortedMap[key] = map[key];

  return {
    map: sortedMap,
    diagnostics: {
      dynamicSites: ctx.dynamicSites,
      verbCount: Object.keys(sortedMap).length,
      commandCount: allCommands.size,
    },
  };
}

export { isExcludedFile, EXCLUDED_TRAVERSAL_SUFFIXES };
