/**
 * Chunker - Canonical module for document chunking
 * 
 * Responsibilities:
 * - Chunk documents for RAG embedding
 * - Support multiple chunking strategies (semantic, sliding window)
 * - Generate chunk records with proper metadata for Pinecone
 * 
 * Ported from: DeSciX_Cloud/services/chunkingUtils.js
 * 
 * Architecture:
 * - All chunking happens locally in the SDK
 * - Chunks are saved as JSON files in kb/chunks/
 * - Pinecone handles embedding server-side via kb_sync_chunks API
 * 
 * Chunk ID Format (v2.1 - Multi-tenancy):
 * - Composite: ${community_id}:${app_id}:${kb_id}:${file_id}:${chunk_idx}
 * - file_id: Drive ID for Drive-backed files, "local:${hash}" for local-only
 * - chunk_idx: Sequential number (not string) for contiguous retrieval
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

// Default chunking parameters (from server)
const DEFAULT_MAX_CHUNK_SIZE = 2000;
const DEFAULT_MAX_CODE_FILE_SIZE = 8000;
const DEFAULT_OVERLAP_SIZE = 500;

/**
 * Categorize file by name and MIME type
 * Determines chunking strategy
 * 
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type (optional)
 * @returns {'code'|'docs'|'papers'|'generic'}
 */
export function categorizeFile(fileName, mimeType = null) {
  const name = (fileName || '').toLowerCase();

  // Structured data files — splits by top-level array/object element
  if (name.endsWith('.json')) {
    return 'structured-json';
  }

  // Check by extension
  if (name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.ts') ||
      name.endsWith('.jsx') || name.endsWith('.tsx') || name.endsWith('.lean') ||
      name.endsWith('.sol') || name.endsWith('.rs') || name.endsWith('.go')) {
    return 'code';
  }
  if (name.endsWith('.md')) {
    return 'docs';
  }
  if (name.endsWith('.tex')) {
    return 'papers';
  }
  if (name.endsWith('.jsonl')) {
    return 'training';
  }

  // Check by MIME type
  if (mimeType === 'application/vnd.google-apps.document' ||
      mimeType === 'text/markdown' ||
      mimeType === 'text/plain') {
    return 'docs';
  }

  return 'generic';
}


/**
 * Chunk code files
 * Optimizes for embedding by keeping logical units together
 * 
 * @param {string} content - File content
 * @param {Object} fileMetadata - { name }
 * @param {Object} rules - { maxCodeFileSize }
 * @returns {Array<{content, metadata}>}
 */
function chunkCode(content, fileMetadata, rules) {
  const maxSize = rules.maxCodeFileSize || DEFAULT_MAX_CODE_FILE_SIZE;
  
  // If small enough, keep as single chunk
  if (content.length <= maxSize) {
    return [{
      content,
      metadata: {
        chunkIndex: 0,
        totalChunks: 1,
        type: 'full-file',
        fileName: fileMetadata.name
      }
    }];
  }
  
  // For large files, split by logical boundaries
  return splitByLogicalBoundaries(content, fileMetadata, rules);
}

/**
 * Split code by logical boundaries (functions, classes, etc.)
 */
function splitByLogicalBoundaries(content, fileMetadata, rules) {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let currentName = 'Module';
  const maxSize = rules.maxCodeFileSize || DEFAULT_MAX_CODE_FILE_SIZE;
  
  // Patterns for logical boundaries
  const patterns = [
    /^(theorem|lemma|def|definition|structure|class|instance)\s+(\w+)/,
    /^(function|const|let|var)\s+(\w+)/,
    /^(export\s+)?(async\s+)?function\s+(\w+)/,
    /^(export\s+)?(class)\s+(\w+)/,
    /^(contract|interface)\s+(\w+)/  // Solidity
  ];
  
  for (const line of lines) {
    let foundBoundary = false;
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && currentChunk.length > 1000) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex: chunks.length,
            name: currentName,
            type: 'code-block',
            fileName: fileMetadata.name
          }
        });
        currentChunk = line + '\n';
        currentName = match[match.length - 1]; // Last group is name
        foundBoundary = true;
        break;
      }
    }
    
    if (!foundBoundary) {
      currentChunk += line + '\n';
    }
    
    // Force split if too large
    if (currentChunk.length > maxSize) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex: chunks.length,
          name: currentName,
          type: 'code-block',
          fileName: fileMetadata.name
        }
      });
      currentChunk = '';
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        chunkIndex: chunks.length,
        name: currentName,
        type: 'code-block',
        fileName: fileMetadata.name
      }
    });
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });
  
  return chunks;
}

/**
 * Chunk documentation using markdown-aware section-based chunking
 * 
 * @param {string} content - Document content
 * @param {Object} fileMetadata - { name }
 * @param {Object} rules - { maxChunkSize, overlapSize }
 * @returns {Array<{content, metadata}>}
 */
export function chunkDocument(content, fileMetadata, rules) {
  const maxSize = rules.maxChunkSize || DEFAULT_MAX_CHUNK_SIZE;
  
  // If small enough, keep as single chunk
  if (content.length <= maxSize) {
    return [{
      content,
      metadata: {
        chunkIndex: 0,
        totalChunks: 1,
        type: 'full-document',
        fileName: fileMetadata.name
      }
    }];
  }
  
  // Use markdown section-based chunking
  return chunkByMarkdownSections(content, fileMetadata, rules);
}

/**
 * Split content by markdown sections (headers)
 */
function chunkByMarkdownSections(content, fileMetadata, rules) {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let currentTitle = 'Introduction';
  const maxSize = rules.maxChunkSize || DEFAULT_MAX_CHUNK_SIZE;
  const overlap = rules.overlapSize || DEFAULT_OVERLAP_SIZE;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect markdown headers (# ## ###)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    
    if (headerMatch && currentChunk.length > 500) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex: chunks.length,
          title: currentTitle,
          type: 'section',
          fileName: fileMetadata.name
        }
      });
      
      // Start new chunk with overlap from end of previous
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n\n' + line;
      currentTitle = headerMatch[2];
    } else {
      currentChunk += line + '\n';
      
      // If chunk too large, force split
      if (currentChunk.length > maxSize) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex: chunks.length,
            title: currentTitle,
            type: 'section',
            fileName: fileMetadata.name
          }
        });
        // Only keep overlap if it's less than current content
        currentChunk = currentChunk.length > overlap ? currentChunk.slice(-overlap) : '';
      }
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        chunkIndex: chunks.length,
        title: currentTitle,
        type: 'section',
        fileName: fileMetadata.name
      }
    });
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });
  
  return chunks;
}

/**
 * Chunk JSONL training files — one chunk per record
 * Each line is parsed as JSON; Q&A pairs are formatted as readable text for embedding.
 * Non-reserved fields (domain, role, difficulty, verified_by, etc.) are preserved in
 * chunk.metadata.jsonlFields for passthrough to Pinecone as filterable metadata.
 *
 * @param {string} content - File content (one JSON object per line)
 * @param {Object} fileMetadata - { name }
 * @returns {Array<{content, metadata}>}
 */
function chunkJsonl(content, fileMetadata) {
  const lines = content.split('\n').filter(line => line.trim());
  const chunks = [];

  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue; // skip malformed lines
    }

    // Format as readable text for embedding
    let text;
    if (parsed.question && parsed.answer) {
      text = `Q: ${parsed.question}\nA: ${parsed.answer}`;
    } else {
      text = JSON.stringify(parsed, null, 2);
    }

    // Separate embedding content from metadata fields
    // question/answer go into text; everything else becomes filterable Pinecone metadata
    const { question, answer, ...jsonlFields } = parsed;  // eslint-disable-line no-unused-vars

    chunks.push({
      content: text,
      metadata: {
        chunkIndex: chunks.length,
        type: 'qa-pair',
        fileName: fileMetadata.name,
        jsonlFields  // domain, role, difficulty, verified_by, id, status, etc.
      }
    });
  }

  chunks.forEach(chunk => { chunk.metadata.totalChunks = chunks.length; });
  return chunks;
}

/**
 * Generic chunking using sliding window
 * Fallback for file types without semantic structure
 * 
 * @param {string} content - File content
 * @param {Object} fileMetadata - { name }
 * @param {Object} rules - { maxChunkSize, overlapSize }
 * @returns {Array<{content, metadata}>}
 */
function chunkGeneric(content, fileMetadata, rules) {
  const maxSize = rules.maxChunkSize || DEFAULT_MAX_CHUNK_SIZE;
  const overlap = rules.overlapSize || DEFAULT_OVERLAP_SIZE;
  const chunks = [];
  
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + maxSize, content.length);
    const chunk = content.slice(start, end);
    
    chunks.push({
      content: chunk,
      metadata: {
        chunkIndex: chunks.length,
        type: 'generic',
        fileName: fileMetadata.name
      }
    });
    
    // Calculate next start position with overlap
    // Ensure forward progress to prevent infinite loop
    const nextStart = end - overlap;
    if (nextStart <= start || end >= content.length) {
      break;
    }
    start = nextStart;
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });
  
  return chunks;
}

// ============ Content-Aware Structured Chunking (M1, 2026-04-20) ============
// Rationale: the pre-existing chunkCode/chunkGeneric paths silently produced
// 0 chunks for files like EGPT/www/data/concordance-data.js (588KB). The
// regex-driven logical-boundary walker never matched, and the downstream
// corpus.js had a 500KB hard cap that dropped such files entirely. These
// helpers split by structural boundaries first — top-level object keys,
// top-level array elements, top-level function/class/export/const-arrow
// declarations — before falling back to line-aware sliding windows.
// The cap in corpus.js is removed; large content is now safely chunked.

/**
 * Split a JSON object into chunks by walking its top-level structure.
 *
 * Strategy:
 *  - If root is an array: one chunk per element (merging small adjacent
 *    elements up to maxSize to avoid single-entry chunks when the array
 *    contains many tiny items).
 *  - If root is an object: one chunk per top-level key. If a single key's
 *    value is still larger than maxSize, recurse into it (array → per-
 *    element; object → per-sub-key).
 *  - If content is not valid JSON or produces no natural splits: fall back
 *    to chunkGeneric (line-aware sliding window).
 *
 * Each chunk is a pretty-printed JSON snippet with a header comment so
 * the retrieval context tells Gemini what part of the original document
 * it came from.
 *
 * @param {string} content - Full JSON text
 * @param {Object} fileMetadata - { name }
 * @param {Object} rules - { maxChunkSize, overlapSize }
 * @returns {Array<{content, metadata}>}
 */
function chunkStructuredJson(content, fileMetadata, rules) {
  // Structured data is denser than prose — default to 8KB per chunk so that a
  // single rich array element (e.g. one debate exchange with multi-KB turns)
  // stays intact. Callers can still override via rules.maxChunkSize.
  const maxSize = rules.maxChunkSize || 8000;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Not valid JSON (or contains trailing code like `window.X = {...};`).
    // Fall back to the generic line-aware sliding window so we never
    // produce zero chunks for a non-empty file.
    return chunkGeneric(content, fileMetadata, rules);
  }

  // If whole document fits, keep as one chunk
  if (content.length <= maxSize) {
    return [{
      content,
      metadata: {
        chunkIndex: 0,
        totalChunks: 1,
        type: 'full-json',
        fileName: fileMetadata.name
      }
    }];
  }

  const chunks = [];
  const push = (obj, label, type) => {
    const snippet = JSON.stringify(obj, null, 2);
    // If a single logical unit itself overflows, recurse (but only one level)
    // then fall back to line-aware windowing. Prior behaviour atomised
    // elements into per-field shards which were useless for retrieval.
    if (snippet.length > maxSize) {
      if (Array.isArray(obj)) {
        // Emit each element as its own chunk — do NOT recurse deeper into
        // object fields. A 15KB exchange stays whole as one 15KB chunk.
        for (let j = 0; j < obj.length; j++) {
          const esnip = JSON.stringify(obj[j], null, 2);
          const elemLabel = `${label}[${j}]`;
          if (esnip.length <= maxSize * 2) {
            chunks.push({
              content: `// ${elemLabel}
${esnip}`,
              metadata: {
                chunkIndex: chunks.length,
                type: 'array-element',
                title: elemLabel,
                fileName: fileMetadata.name
              }
            });
          } else {
            // Truly enormous element — line-window it
            const sub = chunkGeneric(esnip, fileMetadata, rules);
            for (const c of sub) {
              chunks.push({
                content: `// ${elemLabel} (part ${chunks.length + 1})
${c.content}`,
                metadata: {
                  chunkIndex: chunks.length,
                  type: 'array-element-overflow',
                  title: elemLabel,
                  fileName: fileMetadata.name
                }
              });
            }
          }
        }
        return;
      }
      if (obj && typeof obj === 'object') {
        // Object with a too-big value: recurse ONE level, then stop.
        for (const [k, v] of Object.entries(obj)) {
          push(v, `${label}.${k}`, 'object-key-nested');
        }
        return;
      }
      // Primitive that somehow exceeds maxSize → sliding window with line boundaries
      const sub = chunkGeneric(snippet, fileMetadata, rules);
      for (const c of sub) {
        chunks.push({
          content: `// ${label}\n${c.content}`,
          metadata: {
            chunkIndex: chunks.length,
            type: 'json-overflow',
            title: label,
            fileName: fileMetadata.name
          }
        });
      }
      return;
    }

    chunks.push({
      content: `// ${label}\n${snippet}`,
      metadata: {
        chunkIndex: chunks.length,
        type,
        title: label,
        fileName: fileMetadata.name
      }
    });
  };

  if (Array.isArray(parsed)) {
    // Merge small adjacent elements up to maxSize to avoid many tiny chunks
    let batch = [];
    let batchSize = 0;
    let startIdx = 0;
    for (let i = 0; i < parsed.length; i++) {
      const elem = parsed[i];
      const elemSize = JSON.stringify(elem, null, 2).length;
      if (batchSize + elemSize > maxSize && batch.length > 0) {
        push(batch, `[${startIdx}..${i - 1}]`, 'array-batch');
        batch = [];
        batchSize = 0;
        startIdx = i;
      }
      batch.push(elem);
      batchSize += elemSize;
    }
    if (batch.length > 0) {
      push(batch, `[${startIdx}..${parsed.length - 1}]`, 'array-batch');
    }
  } else if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) {
      push(value, key, 'object-key');
    }
  } else {
    // Primitive root — shouldn't normally happen in our KB content, but be safe
    return chunkGeneric(content, fileMetadata, rules);
  }

  // Safety net: if the walk produced nothing (empty object/array with headers
  // still counts as empty), fall back so we never return 0 chunks from a
  // non-empty file.
  if (chunks.length === 0) {
    return chunkGeneric(content, fileMetadata, rules);
  }

  chunks.forEach(c => { c.metadata.totalChunks = chunks.length; });
  return chunks;
}

/**
 * Try to extract an embedded JSON object from JS content like:
 *   window.X = { ... };
 *   module.exports = { ... };
 *   const X = { ... };
 *   export const X = { ... };
 *   export default { ... };
 *
 * Walks braces/brackets respecting string literals. Returns the captured
 * JSON-ish text (still may be JS — trailing commas, unquoted keys) or null.
 *
 * Caller must JSON.parse() and handle failure gracefully.
 */
function extractTopLevelAssignmentLiteral(content) {
  // Patterns (ordered): we match the line up to the first `{` or `[` that
  // starts the value and then do a bracket walk to find the matching close.
  const patterns = [
    /\b(?:window|globalThis)\.\w+\s*=\s*(?=[{[])/,
    /\bmodule\.exports\s*=\s*(?=[{[])/,
    /\bexport\s+default\s*(?=[{[])/,
    /\bexport\s+const\s+\w+\s*=\s*(?=[{[])/,
    /\b(?:const|let|var)\s+\w+\s*=\s*(?=[{[])/
  ];

  let start = -1;
  for (const p of patterns) {
    const m = p.exec(content);
    if (m && (start === -1 || m.index < start)) {
      start = m.index + m[0].length;
    }
  }
  if (start === -1) return null;

  const open = content[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === inStr) { inStr = null; }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return content.substring(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Split JavaScript/TypeScript source on top-level declarations.
 *
 * Handles these top-level patterns line-anchored:
 *   function foo(...)              export async function foo(...)
 *   class Foo { ... }              export class Foo { ... }
 *   export const foo = (...) => {  const foo = function (...) {
 *   export default ...             module.exports = ...
 *
 * Unlike the legacy splitByLogicalBoundaries() this walker:
 *  - Requires boundaries to start at column 0 (skips indented matches that
 *    live inside classes/objects/functions).
 *  - Does not impose a minimum chunk size (the 1000-char gate in the
 *    legacy walker silently swallowed boundaries inside large objects).
 *  - Uses overlap between adjacent chunks so declarations keep surrounding
 *    context for retrieval.
 *  - Always falls back to chunkGeneric on no-match so we never return 0.
 */
function chunkJsStructured(content, fileMetadata, rules) {
  const maxSize = rules.maxCodeFileSize || DEFAULT_MAX_CODE_FILE_SIZE;
  const overlap = rules.overlapSize || DEFAULT_OVERLAP_SIZE;

  // Fast path: if the whole file fits, keep as one chunk.
  if (content.length <= maxSize) {
    return [{
      content,
      metadata: {
        chunkIndex: 0,
        totalChunks: 1,
        type: 'full-file',
        fileName: fileMetadata.name
      }
    }];
  }

  // Attempt to extract a single top-level assignment object literal (e.g.
  // window.CONCORDANCE_SOURCE = {...};). If present and parseable as JSON,
  // chunk the object as structured JSON — this is the dominant shape for
  // data-embedded JS files. (Strict JSON.parse is used — this is a
  // conservative best-effort; any failure falls through to the boundary
  // walker.)
  const literal = extractTopLevelAssignmentLiteral(content);
  if (literal) {
    try {
      JSON.parse(literal);
      return chunkStructuredJson(literal, fileMetadata, rules);
    } catch {
      // Not strict JSON (trailing commas, comments, expressions). Fall through.
    }
  }

  // Top-level declaration boundary walker.
  const lines = content.split('\n');
  const patterns = [
    /^export\s+(?:async\s+)?function\s+(\w+)/,
    /^export\s+default\s+(?:async\s+)?function(?:\s+(\w+))?/,
    /^export\s+class\s+(\w+)/,
    /^export\s+const\s+(\w+)/,
    /^export\s+default\s+/,
    /^(?:async\s+)?function\s+(\w+)/,
    /^class\s+(\w+)/,
    /^(?:const|let|var)\s+(\w+)\s*=/,
    /^module\.exports\s*=/,
    /^(?:window|globalThis)\.(\w+)\s*=/
  ];

  // Collect boundary line indices and the name at each boundary.
  const boundaries = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of patterns) {
      const m = line.match(pat);
      if (m) {
        boundaries.push({ line: i, name: m[1] || 'anonymous' });
        break;
      }
    }
  }

  if (boundaries.length === 0) {
    // No top-level boundaries found — fall back to a line-aware sliding
    // window. This is the key fix: we never return 0 chunks.
    return chunkGeneric(content, fileMetadata, rules);
  }

  const chunks = [];
  for (let b = 0; b < boundaries.length; b++) {
    const startLine = boundaries[b].line;
    const endLine = (b + 1 < boundaries.length) ? boundaries[b + 1].line : lines.length;
    const sliceLines = lines.slice(startLine, endLine);
    let slice = sliceLines.join('\n');

    // Very large single boundary (e.g. a 400KB object literal) → window it
    if (slice.length > maxSize) {
      const sub = chunkGeneric(slice, fileMetadata, rules);
      for (const c of sub) {
        chunks.push({
          content: c.content,
          metadata: {
            chunkIndex: chunks.length,
            type: 'code-block-overflow',
            name: boundaries[b].name,
            fileName: fileMetadata.name
          }
        });
      }
      continue;
    }

    // Prepend overlap from previous slice for retrieval continuity
    if (chunks.length > 0) {
      const prev = chunks[chunks.length - 1].content;
      const carry = prev.slice(-overlap);
      slice = `// ...prior context...\n${carry}\n// --- boundary: ${boundaries[b].name} ---\n${slice}`;
    }

    chunks.push({
      content: slice,
      metadata: {
        chunkIndex: chunks.length,
        type: 'code-block',
        name: boundaries[b].name,
        fileName: fileMetadata.name
      }
    });
  }

  chunks.forEach(c => { c.metadata.totalChunks = chunks.length; });
  return chunks;
}

// ============ End M1 additions ============

/**
 * Chunk a file's content based on its type
 * 
 * @param {Object} fileInfo - { file_name, mime_type, content }
 * @param {Object} options - { maxChunkSize, maxCodeFileSize, overlapSize }
 * @returns {Array<{content, metadata}>}
 */
export function chunkFile(fileInfo, options = {}) {
  const { file_name, mime_type, content } = fileInfo;
  const fileCategory = categorizeFile(file_name, mime_type);
  
  const rules = {
    maxChunkSize: options.maxChunkSize || DEFAULT_MAX_CHUNK_SIZE,
    maxCodeFileSize: options.maxCodeFileSize || DEFAULT_MAX_CODE_FILE_SIZE,
    overlapSize: options.overlapSize || DEFAULT_OVERLAP_SIZE
  };
  
  // M1 (2026-04-20): route structured formats through content-aware chunkers.
  // For .js/.ts, try the structured walker first (handles embedded JSON
  // literals like window.X = {...} and top-level declaration boundaries).
  // For .json, always use chunkStructuredJson.
  switch (fileCategory) {
    case 'structured-json':
      return chunkStructuredJson(content, { name: file_name }, rules);
    case 'code': {
      const nm = (file_name || '').toLowerCase();
      if (nm.endsWith('.js') || nm.endsWith('.mjs') || nm.endsWith('.cjs') ||
          nm.endsWith('.ts') || nm.endsWith('.jsx') || nm.endsWith('.tsx')) {
        return chunkJsStructured(content, { name: file_name }, rules);
      }
      return chunkCode(content, { name: file_name }, rules);
    }
    case 'docs':
    case 'papers':
      return chunkDocument(content, { name: file_name }, rules);
    case 'training':
      return chunkJsonl(content, { name: file_name });
    default:
      return chunkGeneric(content, { name: file_name }, rules);
  }
}

/**
 * Compute SHA256 hash of content
 * @param {string} content - Content to hash
 * @returns {string} Hash prefixed with "sha256:"
 */
function computeContentHash(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

/**
 * Generate a local file ID from relative path
 * Used for files that don't have a Drive ID (local-only)
 * @param {string} relativePath - Relative path from app root
 * @returns {string} Local file ID prefixed with "local:"
 */
function generateLocalFileId(relativePath) {
  const hash = createHash('sha256').update(relativePath).digest('hex').substring(0, 16);
  return `local:${hash}`;
}

/**
 * Create a chunk record formatted for Pinecone sync
 * 
 * ID Format: ${community_id}:${app_id}:${kb_id}:${file_id}:${chunk_idx}
 * This composite format ensures multi-tenancy isolation and supports
 * the same file appearing in multiple KBs/Apps.
 * 
 * @param {Object} chunk - { content, metadata }
 * @param {Object} context - { community_id, app_id, kb_id, file_id, file_name, customMetadata }
 * @returns {Object} Pinecone-ready chunk record
 */
function createChunkRecord(chunk, context) {
  const { community_id, app_id, kb_id, file_id, file_name, customMetadata } = context;
  const chunk_idx = chunk.metadata.chunkIndex;
  const text = chunk.content.trim();

  // Composite ID — app_id is globally unique, no community_id prefix needed
  const id = `${app_id}:${kb_id}:${file_id}:${chunk_idx}`;

  const record = {
    id,
    text,
    entity_type: 'CHUNK',
    // Multi-tenancy fields (ALL REQUIRED for filtering)
    community_id,
    app_id,
    knowledgebase_name: kb_id,
    file_id,                                    // Drive ID or "local:hash"
    chunk_idx,                                  // Number for contiguous retrieval
    // Document metadata
    file_name,
    mime_type: 'text/markdown',
    total_chunks: chunk.metadata.totalChunks,
    // Optional content metadata
    chunk_type: chunk.metadata.type,
    chunk_title: chunk.metadata.title || chunk.metadata.name || null,
    content_hash: computeContentHash(text)      // For change detection
  };

  // Merge file-level custom metadata (passthrough to Pinecone)
  // Pinecone supports: string, number, boolean, string[] as metadata types.
  // Custom fields must not collide with reserved record fields.
  if (customMetadata && typeof customMetadata === 'object') {
    for (const [key, value] of Object.entries(customMetadata)) {
      if (key in record) continue; // Don't overwrite reserved fields
      const type = typeof value;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        record[key] = value;
      } else if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
        record[key] = value;
      }
    }
  }

  // Merge per-chunk JSONL fields (domain, role, difficulty, verified_by, id, etc.)
  // These override file-level customMetadata but cannot overwrite reserved record fields.
  if (chunk.metadata.jsonlFields && typeof chunk.metadata.jsonlFields === 'object') {
    for (const [key, value] of Object.entries(chunk.metadata.jsonlFields)) {
      if (key in record) continue;
      const type = typeof value;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        record[key] = value;
      } else if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
        record[key] = value;
      }
    }
  }

  return record;
}

/**
 * Load .descix_metadata.json for a KB directory
 * Returns a map of filename -> drive_id (or null if not found)
 * 
 * @param {string} kbDir - Path to KB directory (e.g., kb/General)
 * @returns {Promise<Object>} Map of filename -> { drive_id, ... }
 */
async function loadKbMetadata(kbDir) {
  const metadataPath = path.join(kbDir, '.descix_metadata.json');
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    return metadata.files || {};
  } catch {
    // No metadata file - all files are local-only
    return {};
  }
}

/**
 * Get file_id for a file - Drive ID if available, otherwise local:hash
 * 
 * @param {string} fileName - Local filename
 * @param {Object} fileMetadata - Metadata entry from .descix_metadata.json
 * @param {string} kbId - Knowledge base ID
 * @returns {string} file_id (Drive ID or "local:hash")
 */
function getFileId(fileName, fileMetadata, kbId) {
  if (fileMetadata && fileMetadata.drive_id) {
    return fileMetadata.drive_id;
  }
  // Generate local ID from relative path within KB
  const relativePath = `kb/${kbId}/${fileName}`;
  return generateLocalFileId(relativePath);
}

/**
 * Process an entire KB directory and generate chunks
 * 
 * Uses .descix_metadata.json to get Drive IDs for files.
 * Files without Drive IDs get a local:hash ID for tracking.
 * 
 * @param {Object} config - { workspaceRoot, communityId, appId, kbId, localPath, customMetadata }
 * @param {Object} options - { maxChunkSize, overlapSize, verbose }
 * @returns {Promise<{files: number, totalChunks: number}>}
 */
export async function processKb(config, options = {}) {
  const { workspaceRoot, communityId, appId, kbId = 'General', localPath, customMetadata } = config;
  const { verbose = false } = options;
  
  // Find source directory (kb/General for converted files)
  const appLocalPath = localPath || `${communityId}/${appId}`;
  const srcDir = path.join(workspaceRoot, appLocalPath, 'kb', kbId);
  const chunksDir = path.join(workspaceRoot, appLocalPath, 'kb', 'chunks');
  
  // Check if source directory exists
  try {
    await fs.access(srcDir);
  } catch {
    throw new Error(`Source directory not found: ${srcDir}\nRun "descix kb pull" first.`);
  }
  
  await fs.mkdir(chunksDir, { recursive: true });
  
  // Load metadata to get Drive IDs
  const kbMetadata = await loadKbMetadata(srcDir);
  
  // Read files (exclude metadata and hidden files)
  const files = await fs.readdir(srcDir);
  const textFiles = files.filter(f =>
    !f.startsWith('.') &&
    (f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.csv') || f.endsWith('.jsonl'))
  );
  
  if (textFiles.length === 0) {
    return { files: 0, totalChunks: 0 };
  }
  
  let totalChunks = 0;
  
  for (const fileName of textFiles) {
    try {
      const filePath = path.join(srcDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Get file_id from metadata (Drive ID) or generate local ID
      const fileMetadata = kbMetadata[fileName];
      const file_id = getFileId(fileName, fileMetadata, kbId);
      const isLocal = file_id.startsWith('local:');
      
      // Get MIME type from extension
      let mimeType = 'text/plain';
      if (fileName.endsWith('.md')) mimeType = 'text/markdown';
      else if (fileName.endsWith('.csv')) mimeType = 'text/csv';
      else if (fileName.endsWith('.jsonl')) mimeType = 'application/jsonl';
      
      // Generate chunks
      const rawChunks = chunkFile({ file_name: fileName, mime_type: mimeType, content }, options);
      
      // Convert to Pinecone-ready records
      const chunks = rawChunks.map(chunk =>
        createChunkRecord(chunk, {
          community_id: communityId,
          app_id: appId,
          kb_id: kbId,
          file_id,
          file_name: fileName,
          customMetadata
        })
      );
      
      // Write chunks file (v2.1 format with source_drive_id)
      const baseName = fileName.replace(/\.[^.]+$/, '');
      const chunksFile = {
        version: '2.1',
        source_file: fileName,
        source_drive_id: isLocal ? null : file_id,
        source_kb: kbId,
        generated_at: new Date().toISOString(),
        chunking_config: {
          strategy: 'semantic',
          max_chunk_size: options.maxChunkSize || DEFAULT_MAX_CHUNK_SIZE,
          overlap_size: options.overlapSize || DEFAULT_OVERLAP_SIZE
        },
        chunks
      };
      
      const chunksPath = path.join(chunksDir, `${baseName}.chunks.json`);
      await fs.writeFile(chunksPath, JSON.stringify(chunksFile, null, 2));
      
      totalChunks += chunks.length;
      
      if (verbose) {
        const idType = isLocal ? '(local)' : '(drive)';
        console.log(`  ✓ ${fileName} ${idType}: ${chunks.length} chunks`);
      }
    } catch (error) {
      if (verbose) {
        console.log(`  ✗ ${fileName}: ${error.message}`);
      }
    }
  }
  
  return { files: textFiles.length, totalChunks };
}

/**
 * Load all chunks from the chunks directory
 * 
 * @param {Object} config - { workspaceRoot, communityId, appId, kbId, localPath }
 * @returns {Promise<Array>} All chunk records
 */
export async function loadChunks(config) {
  const { workspaceRoot, communityId, appId, kbId = 'General', localPath } = config;
  
  const appLocalPath = localPath || `${communityId}/${appId}`;
  const chunksDir = path.join(workspaceRoot, appLocalPath, 'kb', 'chunks');
  
  try {
    await fs.access(chunksDir);
  } catch {
    return [];
  }
  
  const files = await fs.readdir(chunksDir);
  const chunkFiles = files.filter(f => f.endsWith('.chunks.json'));
  
  const allChunks = [];
  
  for (const fileName of chunkFiles) {
    try {
      const filePath = path.join(chunksDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      const chunkFile = JSON.parse(content);
      
      // Filter chunks for this specific KB
      const kbChunks = (chunkFile.chunks || []).filter(c =>
        c.community_id === communityId &&
        c.app_id === appId &&
        c.knowledgebase_name === kbId
      );
      
      allChunks.push(...kbChunks);
    } catch {
      // Skip invalid files
    }
  }
  
  return allChunks;
}

// Export helper functions for external use
export { computeContentHash, generateLocalFileId };

export default {
  categorizeFile,
  chunkFile,
  chunkDocument,
  processKb,
  loadChunks,
  computeContentHash,
  generateLocalFileId
};
