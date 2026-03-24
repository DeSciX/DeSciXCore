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
  
  switch (fileCategory) {
    case 'code':
      return chunkCode(content, { name: file_name }, rules);
    case 'docs':
    case 'papers':
      return chunkDocument(content, { name: file_name }, rules);
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

  // Merge custom metadata fields (passthrough to Pinecone)
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
    (f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.csv'))
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
