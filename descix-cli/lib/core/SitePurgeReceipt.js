/**
 * SitePurgeReceipt — the one owner of what `descix site upload` says about the edge purge, and of
 * whether that purge lets the command succeed: an incomplete purge is a failed upload.
 *
 * confirm_site_deploy (DeSciX_Cloud appCommands) returns, on every non-preview deploy,
 *   purge: { status: 'ok'|'failed', attempted, purged, failed?: string[] }
 * `attempted`/`purged` count Cloudflare purge ENTRIES — cache keys, each stale path purged plain and
 * once per page Origin (cloudflarePurge.js) — so the line says "cache keys", not paths. `failed`
 * names the failed batches; the server does not name individual paths.
 *
 * A purge that is not complete leaves the edge serving stale bytes until the cache TTL: the deploy
 * is confirmed, but the command FAILS so the developer cannot read it as done. Re-running the same
 * upload re-purges every file. A non-preview deploy whose confirm carries no receipt fails too —
 * an absent receipt is not a successful purge.
 */

const isCount = (n) => Number.isInteger(n) && n >= 0;

/**
 * @param {object} result - the confirm_site_deploy `message`
 * @param {{preview: boolean}} opts - whether THIS upload was a preview deploy
 * @returns {{ok: boolean, lines: string[]}} lines[0] is the receipt line; the rest detail a failure
 */
export function assessPurgeReceipt(result, { preview }) {
  const purge = result?.purge;
  if (purge === undefined) {
    if (preview) return { ok: true, lines: ['edge purge: not run (preview deploy)'] };
    return {
      ok: false,
      lines: [
        'edge purge: NO RECEIPT — confirm_site_deploy returned no `purge` field for a non-preview deploy.',
        'The edge may serve stale copies of this site\'s files until their cache TTL, and nothing says whether it was purged.',
        'This backend does not send the purge receipt; report it with this output.',
      ],
    };
  }
  if (!purge || typeof purge !== 'object' || typeof purge.status !== 'string'
      || !isCount(purge.attempted) || !isCount(purge.purged)) {
    return {
      ok: false,
      lines: [
        `edge purge: MALFORMED receipt ${JSON.stringify(purge)} — expected {status, attempted, purged}.`,
        'Whether the edge was purged is unknown; re-run `descix site upload` and report this output if it repeats.',
      ],
    };
  }
  const { status, attempted, purged } = purge;
  if (status === 'ok' && purged === attempted) {
    return { ok: true, lines: [`edge purge: ok, ${purged}/${attempted} cache keys`] };
  }
  const failed = Array.isArray(purge.failed) ? purge.failed : [];
  return {
    ok: false,
    lines: [
      `edge purge: FAILED, ${purged}/${attempted} cache keys purged, ${attempted - purged} not purged (status ${status})`,
      ...(failed.length > 0
        ? ['Failed batches (as the server named them):', ...failed.map((f) => `  - ${f}`)]
        : ['The server named no failed batch.']),
      'The deploy is confirmed, but the edge may serve stale copies of these files until their cache TTL.',
      'Re-run `descix site upload` with the same arguments: it re-uploads and re-purges every file.',
    ],
  };
}

/** What to say when the confirm RESPONSE was lost: the receipt rode on it, so the purge is unknown. */
export const PURGE_RECEIPT_LOST_LINES = [
  'edge purge: UNKNOWN — the confirm response, which carries the purge receipt, was lost.',
  'The edge may serve stale copies of this site\'s files until their cache TTL. Re-run `descix site upload` with the same arguments to re-purge.',
];
