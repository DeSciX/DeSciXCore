/**
 * Core Library - Canonical modules for SDK operations
 * 
 * This barrel export provides the three core modules:
 * 
 * - Hydrator: Drive sync operations (pull/push/convert)
 * - Chunker: Document chunking for RAG
 * - Syncer: Upstream sync to Pinecone
 * 
 * Architecture:
 * - All CLI commands delegate to these core modules
 * - Ensures DRY - no duplicate code paths
 * - Consistent error handling and progress reporting
 * 
 * Usage:
 *   import { Hydrator, Chunker, Syncer } from '../core/index.js';
 *   
 *   // Or individual imports:
 *   import { hydrateKb, pushStaging } from '../core/Hydrator.js';
 *   import { processKb, loadChunks } from '../core/Chunker.js';
 *   import { syncKb, getSyncStatus } from '../core/Syncer.js';
 */

// Re-export all named exports from each module
export * from './Hydrator.js';
export * from './Chunker.js';
export * from './Syncer.js';

// Re-export default exports as named modules
export { default as Hydrator } from './Hydrator.js';
export { default as Chunker } from './Chunker.js';
export { default as Syncer } from './Syncer.js';
