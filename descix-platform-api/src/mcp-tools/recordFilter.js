/**
 * The record-filter OPERATOR VOCABULARY — the ONE owner of which operators a structured record
 * query accepts, and of what each operator expects the STORED value to be.
 *
 * WHY IT LIVES HERE AND NOT IN THE STORE (measured 2026-08-24, seat DEVPLANE, RESIDUAL 16):
 * `app_records_query` filtered with `{"tags":"handoff"}` against records whose `tags` is an
 * ARRAY answered `matched:0` and `success:true` — a silent empty success over records that
 * plainly carried the tag. Two facts had to change together to fix that: the evaluator had to
 * learn an array operator, and the advertised tool description had to say so. The description
 * is published from `nativeTools.js` (this package) and the evaluator lives in the Cloud
 * microservice, so a list kept in either one is a hand mirror of the other — the drift bug
 * class. Both now import THIS module; neither re-lists an operator.
 *
 * Dependency-free leaf: the CLI stdio server imports the mcp-tools barrel without GCP infra.
 */

/**
 * Operators that compare against a SCALAR stored value (string / number / boolean / null).
 * Against an ARRAY-valued field these can never match — Firestore `==` on an array field wants
 * the WHOLE array, and the in-memory residual compares by identity — so the store REFUSES them
 * there rather than counting the record as a miss.
 */
export const SCALAR_FILTER_OPERATORS = Object.freeze(['$eq', '$ne', '$in']);

/** Operators that test MEMBERSHIP in an ARRAY-valued field (Firestore `array-contains`). */
export const ARRAY_FILTER_OPERATORS = Object.freeze(['$contains']);

/**
 * The COMPLETE accepted set. A bare (non-object) condition value is sugar for `$eq` and is
 * therefore governed by the SCALAR rules above.
 *
 * Deliberately NOT the same list as any store's pushdown set: what a query engine can push
 * DOWN to the database is an optimization subset, and "supported" vs "pushed down" are two
 * different facts, not one duplicated fact.
 */
export const SUPPORTED_FILTER_OPERATORS = Object.freeze([
    ...SCALAR_FILTER_OPERATORS,
    ...ARRAY_FILTER_OPERATORS,
]);

/**
 * Which shape of STORED value an operator can evaluate.
 *
 * @param {string} operator - e.g. '$eq', '$contains'
 * @returns {'scalar'|'array'|null} null when the operator is not supported at all
 */
export function operatorValueKind(operator) {
    if (SCALAR_FILTER_OPERATORS.includes(operator)) return 'scalar';
    if (ARRAY_FILTER_OPERATORS.includes(operator)) return 'array';
    return null;
}

/**
 * The operator a caller should have reached for, given what the field ACTUALLY holds. This is
 * what makes a type refusal actionable instead of merely loud — the message names the remedy.
 *
 * @param {'scalar'|'array'} valueKind - the stored value's shape
 * @returns {string} the canonical operator for that shape
 */
export function remedyOperatorFor(valueKind) {
    if (valueKind === 'array') return ARRAY_FILTER_OPERATORS[0];
    if (valueKind === 'scalar') return SCALAR_FILTER_OPERATORS[0];
    throw new Error(`remedyOperatorFor: unknown value kind '${valueKind}' (expected 'scalar' or 'array')`);
}

/**
 * The operator clause for a tool description, GENERATED from the lists above.
 *
 * Every advertised description composes this rather than typing operator names, so an operator
 * added to (or removed from) the vocabulary cannot leave the published contract behind. The
 * conformance test `records-query-counts-contract.test.js` drives its assertions off the same
 * exported lists, which is what makes a hand-typed operator name a CI failure.
 *
 * @returns {string}
 */
export function filterOperatorClause() {
    const scalar = SCALAR_FILTER_OPERATORS.join('/');
    const array = ARRAY_FILTER_OPERATORS.join('/');
    return (
        `Supports ${scalar} on SCALAR fields (a bare value means ${SCALAR_FILTER_OPERATORS[0]}) ` +
        `and ${array} on ARRAY fields (membership, e.g. { "tags": { "${ARRAY_FILTER_OPERATORS[0]}": "handoff" } }) ` +
        `+ field projection. OPERATOR AND VALUE TYPE MUST AGREE: a scalar comparison against a ` +
        `field that holds an ARRAY, or ${array} against a field that holds a SCALAR, is REFUSED ` +
        `with FILTER_UNSUPPORTED naming the field and the operator to use instead — it is never ` +
        `answered as a zero-match success, because a predicate that CANNOT match must not be ` +
        `reported as one that simply did not.`
    );
}
