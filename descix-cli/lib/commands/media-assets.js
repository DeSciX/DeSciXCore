/**
 * `descix app media-list` and `descix app media-delete` — read and remove an app's uploaded
 * media (the objects `descix app media-upload` puts under the app's GCS assets/ prefix), over the
 * same API surface media-upload uses: `apiClient.invoke` → POST /apifront, user-session authed.
 *
 * Backend contract (owned by DeSciX_Cloud; the CLI only ferries and renders it):
 *   list_app_assets  { app_id, prefix? }        → { objects: [{ path, size, content_type, updated, public_url }],
 *                                                    total_bytes, quota_bytes }
 *   delete_app_asset { app_id, path, dry_run? } → { path, existed, deleted, freed_bytes, purged }
 *
 * SERVER IS THE SOLE AUTHORITY (same rule as media-upload.js): permission, path validity, the
 * prefix's meaning and the quota are the server's. `--prefix` and each path go through UNCHANGED,
 * and a server refusal surfaces with its message verbatim.
 *
 * ONE PATH PER delete_app_asset CALL (platform rule): the CLI loops. A path that does not exist
 * (`existed: false`) is reported and the rest still run; only a call that FAILED (the server
 * refused or errored, or answered outside the contract) makes the run exit non-zero. On a dry run
 * `freed_bytes` is what a real delete WOULD free. `purged:false` on a real delete means the object
 * is gone but the edge purge failed: a visible warning, never a failure.
 *
 * With `--prefix`, list_app_assets' `total_bytes` sums only the listed objects while
 * `quota_bytes` stays the whole app's, so the prefix total is never set against the quota.
 *
 * FAIL LOUD on an older Cloud: a backend that does not register the command answers
 * `Invalid command: <name>`. That is never rendered as an empty list or as "not found" — it
 * throws naming the missing command and the origin that lacks it.
 */

import chalk from 'chalk';
import { progress } from '../output.js';
import { formatMb } from './media-upload.js';

/**
 * If the backend refused because it does not register the command at all, return an error that
 * names the command and the origin lacking it; otherwise return `err` unchanged. Cloud apiFront
 * answers `Invalid command: <name>` on both of its doors (route and dispatch); `Unknown command`
 * is matched too, so a server rewording cannot turn this back into a silent miss. The command
 * name is read from the server's answer, so each runner names its command once, in its literal
 * invoke() call (the form scripts/lib/verb-invoke-graph.mjs attributes to the verb).
 * @param {Error} err
 * @param {{baseUrl:string}} apiClient - invoke() has resolved its origin by the time this runs
 * @param {string} verb - e.g. "media-list"
 * @returns {Error}
 */
function missingCommandOr(err, apiClient, verb) {
  const m = /\b(?:invalid|unknown) command:?\s*['"`]?([A-Za-z0-9_]+)/i.exec(String(err?.message || ''));
  if (!m) return err;
  const command = m[1];
  const missing = new Error(
    `${apiClient.baseUrl} does not have the backend command '${command}' ` +
    `(it answered: "${err.message}"). \`descix app ${verb}\` needs a DeSciX Cloud that ships ` +
    `${command}; nothing was done.`
  );
  missing.code = 'BACKEND_COMMAND_MISSING';
  return missing;
}

/**
 * Run `app media-list`.
 *
 * @param {import('../api-client.js').DeSciXApiClient} apiClient
 * @param {{app:string, prefix?:string, json?:boolean}} options
 * @returns {Promise<object>} the backend object, unchanged
 */
export async function runMediaList(apiClient, options) {
  const params = { app_id: options.app };
  if (options.prefix !== undefined) params.prefix = options.prefix;

  let listing;
  try {
    listing = (await apiClient.invoke('list_app_assets', params))?.message;
  } catch (err) {
    throw missingCommandOr(err, apiClient, 'media-list');
  }
  if (!listing || !Array.isArray(listing.objects)
      || typeof listing.total_bytes !== 'number' || typeof listing.quota_bytes !== 'number') {
    throw new Error(`list_app_assets returned an unexpected shape: ${JSON.stringify(listing)}`);
  }

  if (options.json) {
    console.log(JSON.stringify(listing, null, 2));
    return listing;
  }

  const where = options.prefix !== undefined ? `assets/${options.prefix}` : 'assets/';
  progress(options, chalk.cyan(`\n  Media: ${options.app} → ${where}\n`));
  if (listing.objects.length === 0) {
    console.log(chalk.gray('  (no objects)'));
  }
  for (const o of listing.objects) {
    console.log(`  ${chalk.white(o.path)}  ${formatMb(o.size)} MB (${o.size} B)  ${o.content_type}  ${o.updated}`);
    console.log(chalk.gray(`    public_url: ${o.public_url}`));
  }
  if (options.prefix !== undefined) {
    // With a prefix the server's total_bytes sums ONLY the listed objects while quota_bytes is
    // still the whole app's quota: setting one against the other would misstate usage.
    console.log(chalk.gray(
      `\n  Total under ${where}: ${formatMb(listing.total_bytes)} MB (${listing.total_bytes} bytes)\n`
    ));
  } else {
    console.log(chalk.gray(
      `\n  Storage: ${formatMb(listing.total_bytes)} MB / ${formatMb(listing.quota_bytes)} MB used ` +
      `(${listing.total_bytes} / ${listing.quota_bytes} bytes)\n`
    ));
  }
  return listing;
}

/**
 * Run `app media-delete`.
 *
 * @param {import('../api-client.js').DeSciXApiClient} apiClient
 * @param {string[]} paths - object paths relative to the app's assets/ prefix, one call each
 * @param {{app:string, dryRun?:boolean, json?:boolean}} options
 * @returns {Promise<{app_id:string, dry_run:boolean, results:object[], summary:object}>}
 */
export async function runMediaDelete(apiClient, paths, options) {
  const dryRun = !!options.dryRun;
  const results = [];
  const failures = [];
  let deleted = 0;
  let notFound = 0;
  let freedBytes = 0;
  let wouldDelete = 0;
  let wouldFreeBytes = 0;

  progress(options, chalk.cyan(`\n  Media ${dryRun ? 'delete (dry run)' : 'delete'}: ${options.app} → assets/\n`));

  for (const p of paths) {
    const params = { app_id: options.app, path: p };
    if (dryRun) params.dry_run = true;
    let r;
    try {
      r = (await apiClient.invoke('delete_app_asset', params))?.message;
    } catch (caught) {
      const err = missingCommandOr(caught, apiClient, 'media-delete');
      // A missing backend command throws out of the loop: every later path would get the same answer.
      if (err.code === 'BACKEND_COMMAND_MISSING') throw err;
      results.push({ path: p, error: err.message });
      failures.push(`${p}: ${err.message}`);
      progress(options, chalk.red(`  x ${p}  ${err.message}`));
      continue;
    }
    if (!r || typeof r.existed !== 'boolean' || typeof r.deleted !== 'boolean' || typeof r.freed_bytes !== 'number') {
      const msg = `delete_app_asset returned an unexpected shape: ${JSON.stringify(r)}`;
      results.push({ path: p, error: msg });
      failures.push(`${p}: ${msg}`);
      progress(options, chalk.red(`  x ${p}  ${msg}`));
      continue;
    }
    // Contract violations the server owns: a dry run that deleted, or a real run that found the
    // object and did not delete it. Either is a failure for that path, never a quiet success.
    const violation = dryRun && r.deleted ? 'delete_app_asset reported deleted:true on a dry run'
      : !dryRun && r.existed && !r.deleted ? 'delete_app_asset reported existed:true, deleted:false'
      : null;
    if (violation) {
      results.push({ path: p, error: violation, response: r });
      failures.push(`${p}: ${violation}`);
      progress(options, chalk.red(`  x ${p}  ${violation}`));
      continue;
    }
    results.push(r);
    if (!r.existed) {
      notFound++;
      progress(options, chalk.yellow(`  ? ${p}  not found`));
    } else if (r.deleted) {
      deleted++;
      freedBytes += r.freed_bytes;
      progress(options, chalk.green(`  - ${p}  freed ${r.freed_bytes} B  purged: ${r.purged}`));
      if (r.purged === false) {
        // The delete stands (exit code unchanged); only the edge cache copy survived the purge.
        progress(options, chalk.yellow(
          `  ! ${p}  deleted, but the edge cache purge failed (purged:false): a cached copy ` +
          `may still be served until its cache lifetime ends`
        ));
      }
    } else {
      wouldDelete++;
      wouldFreeBytes += r.freed_bytes;
      progress(options, chalk.gray(`  ~ ${p}  would delete (${r.freed_bytes} B)`));
    }
  }

  const summary = { deleted, not_found: notFound, failed: failures.length, freed_bytes: freedBytes };
  if (dryRun) Object.assign(summary, { would_delete: wouldDelete, would_free_bytes: wouldFreeBytes });
  const result = { app_id: options.app, dry_run: dryRun, results, summary };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const failedPart = failures.length ? `, ${failures.length} failed` : '';
    if (dryRun) {
      console.log(chalk.cyan(
        `\n  Dry run: nothing deleted. ${deleted} deleted, ${notFound} not found${failedPart}; ` +
        `${wouldDelete} would be deleted (${wouldFreeBytes} bytes, ${formatMb(wouldFreeBytes)} MB).\n`
      ));
    } else {
      console.log(chalk.cyan(
        `\n  ${deleted} deleted, ${notFound} not found${failedPart}, ` +
        `${freedBytes} bytes freed (${formatMb(freedBytes)} MB).\n`
      ));
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} of ${paths.length} path(s) failed:\n  - ${failures.join('\n  - ')}`);
  }
  return result;
}
