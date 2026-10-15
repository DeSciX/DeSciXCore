/**
 * The one converter from a full EIP-712 object to the (domain, types, value) triple that
 * ethers v6 signTypedData and the Powch wire (POWCH_SIGN_TYPED_DATA) take.
 * ethers v6 REJECTS an explicit `EIP712Domain` entry in `types`, so it is dropped here.
 */

export class TypedDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TypedDataError';
  }
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * @param {{domain: object, types: object, primaryType: string, message: object}} typedData
 * @returns {{domain: object, types: object, value: object}} types without EIP712Domain; value = message
 * @throws {TypedDataError} when a field is missing or primaryType is not a key of the remaining types
 */
export function toSignableTypedData(typedData) {
  if (!isObject(typedData)) {
    throw new TypedDataError('typedData must be an object { domain, types, primaryType, message }');
  }
  const { domain, types, primaryType, message } = typedData;
  if (!isObject(domain)) throw new TypedDataError('typedData.domain is missing or not an object');
  if (!isObject(types)) throw new TypedDataError('typedData.types is missing or not an object');
  if (typeof primaryType !== 'string' || primaryType === '') {
    throw new TypedDataError('typedData.primaryType is missing or not a string');
  }
  if (!isObject(message)) throw new TypedDataError('typedData.message is missing or not an object');

  const { EIP712Domain: _dropped, ...signableTypes } = types;
  if (!Object.hasOwn(signableTypes, primaryType)) {
    throw new TypedDataError(
      `typedData.primaryType "${primaryType}" is not a key of typedData.types (EIP712Domain excluded): ${Object.keys(signableTypes).join(', ') || '(none)'}`
    );
  }
  return { domain, types: signableTypes, value: message };
}
