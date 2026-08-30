// ESM resolve hook: TRIPWIRE on the interactive-login module.
// It does not let loginDevice run — it fails the import the instant the branch reaches for it.
// That is the whole point: observing the ENTRY, never executing the flow. A negative control
// that opens a browser or waits on one is not a negative control.
export async function resolve(specifier, context, next) {
  const r = await next(specifier, context);
  if (/lib\/commands\/auth\.js$/.test(new URL(r.url).pathname)) {
    const e = new Error('AUTH_MODULE_ENTERED: the interactive device-login module was imported');
    e.code = 'AUTH_MODULE_ENTERED';
    throw e;
  }
  return r;
}
