/**
 * `descix app media-upload` — upload media/asset files to an app's GCS assets prefix via the
 * API surface (storage-cap ferrying: a 200MB size limit for now, until credit-based metering
 * for more storage).
 *
 * This is the canonical, filesystem-free way to get app media (podcast audio, cover art, etc.)
 * into the platform: request a short-lived signed PUT token from the API surface
 * (`get_asset_upload_token` over /apifront, user-session authed), upload each file straight to
 * GCS, and print the server's asset references. An app microservice then fetches an uploaded
 * asset by reference over the Core broker via `get_app_asset` (no shared local filesystem
 * needed). App owners, community admins and platform admins may upload — the server is the
 * sole authority on that and on the app's storage quota (200 MB per app today; nothing here
 * pre-validates either).
 *
 * SERVER IS THE SOLE AUTHORITY (super-DRY: never re-derive a server-owned fact client-side):
 * - quota, path validity (no leading `/`, no backslash, no empty/`.`/`..` segment) and caller
 *   permission are enforced ONLY by `get_asset_upload_token`; a refusal there throws with the
 *   server's message verbatim (`DeSciXApiClient#invoke`) and this module does not catch it —
 *   let it propagate so the caller prints exactly what the server said and exits non-zero.
 * - `--prefix` is passed through UNCHANGED (no slash-stripping): stripping could silently mask
 *   a server-side path refusal the server is best positioned to name.
 * - Each file is PUT with the server's `upload_headers[path]` bag VERBATIM (precedent: `site
 *   upload`'s `ferriedHeaders` — the server binds Content-Type and
 *   `x-goog-content-length-range` into the v4 signed-URL signature, so a re-derived header
 *   403s). Size is still read from `fs.stat`, since GCS itself rejects a body whose length
 *   disagrees with the declared range.
 * - `--private` uploads into the app's private media space: the server returns each object's
 *   `ref` (`asset:<app_id>/<path>`) instead of a `public_url`, and the CLI prints the `ref`.
 *   `visibility` ("public" by default, "private" with `--private`) is ALWAYS sent explicitly.
 * - `public_url` and `storage` are printed exactly as the server returned them — never
 *   reconstructed from `bucket` + `gcs_path` (that WAS a client-side re-derivation of a server
 *   fact; removed here rather than perpetuated).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { progress } from '../output.js';

/**
 * ONE OWNER of how the media verbs (upload, list, delete) render a byte count in MB.
 * @param {number} bytes
 * @returns {string} e.g. "3.0"
 */
export function formatMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/**
 * ONE OWNER of which media space a media verb addresses. `--private` selects the private space;
 * otherwise the public one. The result is always sent EXPLICITLY (the server refuses an absent
 * `visibility`), never left for the server to default.
 * @param {{private?:boolean}} options
 * @returns {'public'|'private'}
 */
export function mediaVisibility(options) {
  return options.private ? 'private' : 'public';
}

/**
 * ONE OWNER of the request params every media verb (upload, list, delete) sends: the app and the
 * explicit visibility, plus the verb's own params.
 * @param {{app:string, private?:boolean}} options
 * @param {object} [extra]
 * @returns {object}
 */
export function mediaParams(options, extra = {}) {
  return { app_id: options.app, visibility: mediaVisibility(options), ...extra };
}

/**
 * ONE OWNER of the check that a media command answered for the media space that was asked.
 * Throws naming the command when the server's echoed `visibility` differs or is absent.
 * @param {string} command - e.g. "list_app_assets"
 * @param {{visibility?:string}} answer - the server's answer (or one per-path row)
 * @param {'public'|'private'} asked
 */
export function assertAnsweredVisibility(command, answer, asked) {
  if (answer?.visibility !== asked) {
    throw new Error(
      `${command} answered for visibility ${JSON.stringify(answer?.visibility)}, ` +
      `but ${JSON.stringify(asked)} was asked for.`);
  }
}

/**
 * Run `app media-upload`.
 *
 * @param {import('../api-client.js').DeSciXApiClient} apiClient
 * @param {{app:string, file:string|string[], prefix?:string, private?:boolean, json?:boolean}} options
 * @returns {Promise<{app_id:string, assets:Array<object>, storage:object|null}>}
 */
export async function runMediaUpload(apiClient, options) {
  const mime = (await import('mime-types')).default;

  const appId = options.app;
  const localFiles = Array.isArray(options.file) ? options.file : [options.file];
  // No local normalization: a leading/trailing slash, empty segment, or `.`/`..` segment is a
  // server-owned validity rule (get_asset_upload_token) — pass --prefix through untouched so a
  // bad prefix surfaces as the server's own refusal, never a silently-corrected local guess.
  const subPrefix = options.prefix || '';

  // Build the upload descriptor list: object path under assets/ = [subPrefix/]basename.
  const fileDescriptors = [];
  for (const localPath of localFiles) {
    const abs = path.resolve(localPath);
    let stat;
    try {
      stat = await fs.stat(abs);
    } catch {
      throw new Error(`File not found: ${abs}`);
    }
    if (!stat.isFile()) {
      throw new Error(`Not a file: ${abs}`);
    }
    const base = path.basename(abs);
    const objectPath = subPrefix ? `${subPrefix}/${base}` : base;
    fileDescriptors.push({
      path: objectPath,
      content_type: mime.lookup(abs) || 'application/octet-stream',
      size: stat.size,
      _absolutePath: abs
    });
  }

  progress(options, chalk.cyan(`\n  Media Upload: ${appId} → GCS assets/\n`));
  fileDescriptors.forEach(f => progress(options, chalk.gray(`  • ${f.path} (${(f.size / 1024).toFixed(1)}KB, ${f.content_type})`)));

  // 1. Request a signed-PUT upload token over the API surface. The server owns quota, path
  // validity and caller permission — a refusal here throws with the server's message verbatim
  // and this function does not catch it.
  const tokenResponse = await apiClient.invoke('get_asset_upload_token', mediaParams(options, {
    files: fileDescriptors.map(f => ({ path: f.path, content_type: f.content_type, size: f.size }))
  }));
  const token = tokenResponse.message || tokenResponse;
  const { signed_urls, upload_headers, objects, storage } = token;
  assertAnsweredVisibility('get_asset_upload_token', token, mediaVisibility(options));
  if (mediaVisibility(options) === 'private') {
    // A private object is addressed ONLY by its ref: refuse before any byte is PUT rather than
    // upload a file the caller then cannot name.
    const noRef = fileDescriptors.filter(f => !(objects || []).find(o => o.path === f.path)?.ref);
    if (noRef.length > 0) {
      throw new Error(
        `get_asset_upload_token returned no ref for private object(s): ${noRef.map(f => f.path).join(', ')}; nothing was uploaded.`);
    }
  }

  // 2. PUT each file directly to GCS using its signed URL and the server's exact header bag.
  progress(options, chalk.gray(`\n  Uploading ${fileDescriptors.length} file(s)...`));
  const uploaded = [];
  const errors = [];
  for (const f of fileDescriptors) {
    const signedUrl = signed_urls?.[f.path];
    if (!signedUrl) {
      errors.push(`No signed URL for: ${f.path}`);
      progress(options, chalk.red(`  x ${f.path}`));
      continue;
    }
    // Never re-derive Content-Type (or the length-range header) locally for the PUT — the
    // server binds them into the v4 signature. A path the server did not ferry a header bag
    // for is an error for that path, naming the server as the thing that is missing it.
    const headers = upload_headers?.[f.path];
    if (!headers) {
      errors.push(
        `No upload_headers for: ${f.path} (get_asset_upload_token response is missing the header ` +
        `bag for this path)`
      );
      progress(options, chalk.red(`  x ${f.path}`));
      continue;
    }
    try {
      const content = await fs.readFile(f._absolutePath);
      const resp = await fetch(signedUrl, {
        method: 'PUT',
        headers,
        body: content
      });
      if (!resp.ok) {
        errors.push(`Failed ${f.path}: ${resp.status} ${resp.statusText}`);
        progress(options, chalk.red(`  x ${f.path}`));
      } else {
        const obj = (objects || []).find(o => o.path === f.path) || {};
        uploaded.push({
          path: f.path,
          gcs_path: obj.gcs_path || null,
          public_url: obj.public_url || null,
          ref: obj.ref || null,
          content_type: f.content_type,
          size: f.size
        });
        progress(options, chalk.green(`  + ${f.path}`));
      }
    } catch (err) {
      errors.push(`Error ${f.path}: ${err.message}`);
      progress(options, chalk.red(`  x ${f.path}`));
    }
  }

  if (errors.length > 0) {
    progress(options, chalk.yellow(`\n  ${errors.length} error(s):`));
    errors.forEach(e => progress(options, chalk.red(`  - ${e}`)));
  }

  if (uploaded.length === 0) {
    throw new Error('No files uploaded.');
  }
  if (errors.length > 0) {
    // FAIL LOUD on a partial upload: the files that went up are listed above, but a caller that
    // reads only the exit status must not take a half-uploaded set as success.
    throw new Error(`${errors.length} of ${fileDescriptors.length} file(s) failed to upload:\n  - ${errors.join('\n  - ')}`);
  }

  const isPrivate = mediaVisibility(options) === 'private';
  const result = { app_id: appId, assets: uploaded, storage: storage || null };

  if (options.json) {
    console.log('\n' + JSON.stringify(result, null, 2) + '\n');
  } else {
    console.log(chalk.green(`\n  ✅ Uploaded ${uploaded.length} asset(s).\n`));
    console.log(chalk.cyan(isPrivate
      ? '  Private asset references (store the ref; read an object with `descix app media-link <ref>`):'
      : '  Asset references (pass the path to your app handler; the service fetches via get_app_asset):'));
    uploaded.forEach(u => {
      console.log(chalk.white(`    ${u.path}`));
      // The server returns `ref` for a private object and `public_url` for a public one; print
      // exactly the one the server gave for the space that was asked for.
      console.log(chalk.gray(isPrivate ? `      ref: ${u.ref}` : `      public_url: ${u.public_url}`));
    });
    if (result.storage) {
      // projected_bytes is the app's total INCLUDING this upload; used_bytes is the total before it.
      console.log(chalk.gray(`\n  Storage: ${formatMb(result.storage.projected_bytes)} MB / ${formatMb(result.storage.limit_bytes)} MB used`));
    }
    console.log();
  }

  return result;
}
