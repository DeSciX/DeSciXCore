/**
 * chatIngress — THE canonical contract for content entering a chat conversation
 * from OUTSIDE the composer textarea.
 *
 * ONE OWNER RULE (WS-B8): a human types into the composer; everything else —
 * CodeSite action results, image/file attachments (ws-chat-multimodal-image-attach),
 * future telemetry or sensor feeds — is an "external contribution" and enters the
 * conversation through ChatWidget's ingress handle and NOWHERE ELSE. There is no
 * second path that appends to a thread or mutates user_input. If you are about to
 * write one, extend this contract instead.
 *
 * This module owns the SHAPE and the SIZE POLICY. ChatWidget owns the transport
 * (it holds activeThread / interaction_id / the metered call). Consumers ferry the
 * normalized bag; nobody re-enumerates these fields by hand.
 */

/**
 * Dispositions — what the ingress does with a contribution.
 *  - 'stage': park it on the composer; it rides into the NEXT submitted turn
 *    alongside whatever the user types. This is what an image attachment wants.
 *  - 'send':  park it AND submit immediately as its own turn. This is what an
 *    action result wants when the model should react to it without further typing.
 */
export const CHAT_INGRESS_DISPOSITIONS = Object.freeze(['stage', 'send']);

/**
 * Kinds — the provenance of a contribution. Used for rendering affordance and for
 * the model-visible framing. Extend deliberately; do not invent ad-hoc strings.
 */
export const CHAT_CONTRIBUTION_KINDS = Object.freeze([
  'action_result',
  'action_error',
]);

/**
 * SIZE POLICY (WS-B8 AC: "oversized results must not blow the turn").
 *
 * A CodeSite action can return anything — a scalar, or a 200k-element simulation
 * dump. That text is (a) rendered into the transcript and (b) billed as input
 * tokens on a metered Gemini turn. So it is CAPPED, and the cap is enforced HERE,
 * once, for every contribution kind.
 *
 * 8000 characters ~= 2000 tokens: enough for a counterfactual result table or a
 * few hundred data points, small enough that a runaway return value cannot
 * silently multiply the cost of a turn or overflow the context window.
 *
 * Truncation is FAIL-LOUD, never silent: the marker below is appended to the
 * MODEL-VISIBLE text (so the model knows it is reasoning over a prefix, not the
 * whole result) and the contribution carries `truncated`/`omittedChars` so the UI
 * can say so to the user too.
 */
export const MAX_CONTRIBUTION_CHARS = 8000;

/** Marker appended to any text the size policy cut. Must be model-visible. */
export const truncationMarker = (omittedChars, totalChars) =>
  `\n\n… [TRUNCATED by DeSciX chat ingress: showing the first ${MAX_CONTRIBUTION_CHARS} of ${totalChars} characters; ${omittedChars} omitted. This is a PREFIX of the result, not the whole result.]`;

/**
 * Apply the size policy to a text blob.
 * @returns {{ text: string, truncated: boolean, totalChars: number, omittedChars: number }}
 */
export function applySizePolicy(text) {
  const totalChars = text.length;
  if (totalChars <= MAX_CONTRIBUTION_CHARS) {
    return { text, truncated: false, totalChars, omittedChars: 0 };
  }
  const omittedChars = totalChars - MAX_CONTRIBUTION_CHARS;
  return {
    text: text.slice(0, MAX_CONTRIBUTION_CHARS) + truncationMarker(omittedChars, totalChars),
    truncated: true,
    totalChars,
    omittedChars,
  };
}

/**
 * Render an arbitrary JS action return value as model-visible text.
 *
 * FAIL LOUD: a value that cannot be serialized (circular reference, DOM node,
 * BigInt, a function) does NOT silently become "{}" — that is the failure mode
 * that makes an agent confidently reason about an empty result. It is reported as
 * what it is.
 */
export function stringifyResult(value) {
  if (value === undefined) return '(the action returned no value)';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function') {
    throw new TypeError(`action returned a function (${value.name || 'anonymous'}), which is not a result`);
  }
  // JSON.stringify throws on circular refs and BigInt-in-object; let it throw —
  // the caller converts the throw into a visible action_error contribution.
  const json = JSON.stringify(value, null, 2);
  if (json === undefined) {
    throw new TypeError(`action returned a value of type ${typeof value} that has no JSON representation`);
  }
  return json;
}

/**
 * Build the canonical contribution bag for a SUCCESSFUL CodeSite action result.
 * The text is framed so the model knows this is a tool/CodeSite observation and
 * not something the human typed.
 */
export function actionResultContribution(functionName, rawResult, { disposition = 'send' } = {}) {
  let body;
  let kind = 'action_result';
  try {
    body = stringifyResult(rawResult);
  } catch (err) {
    kind = 'action_error';
    body = `The action ran but its return value could not be read: ${err.message}`;
  }
  const sized = applySizePolicy(body);
  return normalizeContribution({
    kind,
    label: functionName,
    text:
      kind === 'action_result'
        ? `[CodeSite action result — \`${functionName}\`]\n\n\`\`\`\n${sized.text}\n\`\`\``
        : `[CodeSite action error — \`${functionName}\`]\n\n${sized.text}`,
    disposition,
    truncated: sized.truncated,
    totalChars: sized.totalChars,
    omittedChars: sized.omittedChars,
  });
}

/** Build the canonical contribution bag for a FAILED CodeSite action. */
export function actionErrorContribution(functionName, error, { disposition = 'send' } = {}) {
  const sized = applySizePolicy(String(error?.stack || error?.message || error));
  return normalizeContribution({
    kind: 'action_error',
    label: functionName,
    text: `[CodeSite action FAILED — \`${functionName}\`]\n\n\`\`\`\n${sized.text}\n\`\`\``,
    disposition,
    truncated: sized.truncated,
    totalChars: sized.totalChars,
    omittedChars: sized.omittedChars,
  });
}

/**
 * normalize(partial) -> full bag. THE contract. Consumers ferry this; they never
 * hand-list its fields (schema-mirror drift is a bug class — engineering-culture
 * mandate 2026-06-18).
 *
 * FAIL LOUD on anything malformed: a bad contribution is a programming error at
 * the call site, and a silently-dropped one is invisible until Maxi wonders why
 * his result never showed up.
 */
export function normalizeContribution(partial) {
  if (!partial || typeof partial !== 'object') {
    throw new TypeError('[chatIngress] contribution must be an object');
  }
  const { kind, label, text, disposition = 'stage' } = partial;
  if (!CHAT_CONTRIBUTION_KINDS.includes(kind)) {
    throw new TypeError(
      `[chatIngress] unknown contribution kind "${kind}" — expected one of ${CHAT_CONTRIBUTION_KINDS.join(', ')}`
    );
  }
  if (typeof text !== 'string' || !text.length) {
    throw new TypeError(`[chatIngress] contribution "${kind}" has empty text`);
  }
  if (!CHAT_INGRESS_DISPOSITIONS.includes(disposition)) {
    throw new TypeError(
      `[chatIngress] unknown disposition "${disposition}" — expected one of ${CHAT_INGRESS_DISPOSITIONS.join(', ')}`
    );
  }
  return {
    kind,
    label: label || kind,
    text,
    disposition,
    truncated: !!partial.truncated,
    totalChars: partial.totalChars ?? text.length,
    omittedChars: partial.omittedChars ?? 0,
    contributed_at: partial.contributed_at || new Date().toISOString(),
  };
}

/**
 * Compose staged contributions + the human's typed text into ONE model-visible
 * user_input. Order is contributions-first, then the human's words, so the model
 * reads the observation before the instruction about it.
 */
export function composeTurnInput(contributions, typedText) {
  const parts = contributions.map((c) => c.text);
  if (typedText && typedText.trim()) parts.push(typedText);
  return parts.join('\n\n');
}
