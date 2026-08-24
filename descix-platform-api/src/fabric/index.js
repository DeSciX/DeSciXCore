/**
 * @descix/platform-api/fabric — the coordination fabric's vocabulary.
 *
 * A dependency-free leaf: importing this entry point pulls in no Firestore, no googleapis and no
 * other package entry point, so the microservice's verb layer, the MCP tool SSOT and a CI
 * conformance test can all read one owner without paying for infrastructure.
 */
export * from './vocab.js';
