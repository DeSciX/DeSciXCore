/**
 * BrieferExtractorError — canonical hard-fail surface for the `descix briefer` CLI.
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.3 ("Hard-fail philosophy"), every data
 * source has exactly one extraction method and exactly one failure mode:
 * HARD-FAIL with an actionable error message.
 *
 * Per feedback_no-hardcoded-fallbacks: NO fallback values, NO best-effort prose,
 * NO try-catch-and-default. If a source moved or changed shape, the CLI exits
 * non-zero and the canonical briefer file remains untouched.
 *
 * Stable error codes (per scope doc §2.3) — grep-friendly for diagnostics:
 *   BRIEFER-SRC-NOT-FOUND   Source file missing / line range no longer matches
 *   BRIEFER-GCLOUD-AUTH     gcloud auth missing or insufficient scope
 *   BRIEFER-GCLOUD-FAIL     gcloud probe failed (auth/empty/timeout) when --env=demo|prod required it
 *   BRIEFER-PARSE-FAIL      Source file present but construct unparseable
 *   BRIEFER-DRIFT-DETECTED  --check diff against canonical briefer non-empty
 *   BRIEFER-NEGATIVE-CLAIM  Briefer claims X does not exist, but found at Y:Z
 *   BRIEFER-FIRESTORE       Firestore read via apifront failed
 *   BRIEFER-NOT-IMPLEMENTED M1 stub — extractor scaffold-only, real impl in later milestone
 *
 * Per scope doc §2.3, every error message must include:
 *   1. The exact source path + line range that was being read.
 *   2. The construct shape that was expected.
 *   3. What the operator should do to recover.
 *   4. A stable error code from the list above.
 */

export const BRIEFER_ERROR_CODES = Object.freeze({
  SRC_NOT_FOUND: 'BRIEFER-SRC-NOT-FOUND',
  GCLOUD_AUTH: 'BRIEFER-GCLOUD-AUTH',
  PARSE_FAIL: 'BRIEFER-PARSE-FAIL',
  DRIFT_DETECTED: 'BRIEFER-DRIFT-DETECTED',
  NEGATIVE_CLAIM: 'BRIEFER-NEGATIVE-CLAIM',
  FIRESTORE: 'BRIEFER-FIRESTORE',
  GCLOUD_FAIL: 'BRIEFER-GCLOUD-FAIL',
  NOT_IMPLEMENTED: 'BRIEFER-NOT-IMPLEMENTED'
});

export class BrieferExtractorError extends Error {
  /**
   * @param {object} args
   * @param {string} args.code       One of BRIEFER_ERROR_CODES (REQUIRED).
   * @param {string} args.section    Briefer section being extracted (e.g., '§3 routing').
   * @param {string} args.source     File path or 'gcloud' or 'firestore' (REQUIRED).
   * @param {string} args.expected   Construct shape that was expected (REQUIRED).
   * @param {string} args.recovery   Concrete next step for the operator (REQUIRED).
   * @param {string} [args.detail]   Optional extra context (e.g., parser msg, exit code).
   */
  constructor({ code, section, source, expected, recovery, detail } = {}) {
    if (!code || !Object.values(BRIEFER_ERROR_CODES).includes(code)) {
      // Hard-fail loud on misuse — caller is constructing a bad error.
      // We do NOT default the code; per feedback_no-hardcoded-fallbacks the
      // absence of a code is itself a misconfiguration we want to surface.
      throw new Error(
        `BrieferExtractorError requires a valid 'code'. Got: ${JSON.stringify(code)}. ` +
        `Valid codes: ${Object.values(BRIEFER_ERROR_CODES).join(', ')}.`
      );
    }
    if (!source) {
      throw new Error(`BrieferExtractorError requires a 'source' (file path / 'gcloud' / 'firestore').`);
    }
    if (!expected) {
      throw new Error(`BrieferExtractorError requires an 'expected' construct shape description.`);
    }
    if (!recovery) {
      throw new Error(`BrieferExtractorError requires a 'recovery' instruction for the operator.`);
    }

    const lines = [
      `[${code}] ${section || '(section unspecified)'}`,
      `  source:   ${source}`,
      `  expected: ${expected}`,
      `  recovery: ${recovery}`
    ];
    if (detail) lines.push(`  detail:   ${detail}`);

    super(lines.join('\n'));
    this.name = 'BrieferExtractorError';
    this.code = code;
    this.section = section || null;
    this.source = source;
    this.expected = expected;
    this.recovery = recovery;
    this.detail = detail || null;
  }
}
