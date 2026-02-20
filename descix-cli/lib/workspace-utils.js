/**
 * Workspace Utilities
 * 
 * Helper functions for workspace mode detection and path resolution.
 */

import path from 'path';

/**
 * Detect workspace mode from workspace.json configuration
 * @param {Object} workspace - Parsed workspace.json
 * @returns {'single_app' | 'single_community' | 'multi_community'}
 */
export function detectWorkspaceMode(workspace) {
  // Strict Mode Validation: Prioritize explicit mode
  if (workspace.mode) {
    return workspace.mode;
  }
  
  // Infer from structure (fallback)
  if (workspace.communities && Object.keys(workspace.communities).length > 0) {
    const communityCount = Object.keys(workspace.communities).length;
    if (communityCount > 1) {
      return 'multi_community';
    }
    // Single community in communities object
    const community = Object.values(workspace.communities)[0];
    const appCount = Object.keys(community.apps || {}).length;
    return appCount > 1 ? 'single_community' : 'single_app';
  }
  
  // Legacy format: single community at root
  if (workspace.community_id && workspace.app_id) {
    return 'single_app';
  }
  
  if (workspace.community_id && workspace.apps) {
    return Object.keys(workspace.apps).length > 1 ? 'single_community' : 'single_app';
  }

  // Fallback for empty/initialized workspace using defaultContext
  if (workspace.defaultContext && workspace.defaultContext.communityId && workspace.defaultContext.appId) {
     return 'single_app';
  }
  
  throw new Error('Unable to determine workspace mode from configuration');
}

/**
 * Resolve local path to Drive path based on workspace mode
 * @param {Object} workspace - Workspace configuration
 * @param {string} localPath - Path relative to workspace root
 * @returns {string} Path relative to user's base_folder_id
 */
export function resolveToDrivePath(workspace, localPath) {
  const mode = detectWorkspaceMode(workspace);
  
  // Normalize local path (remove leading ./)
  const normalizedLocal = localPath.replace(/^\.\//, '');
  
  switch (mode) {
    case 'single_app':
      // Workspace root = app folder
      // Local: ./kb/General/file.md
      // Drive: {community_id}/{app_id}/kb/General/file.md
      const communityId = workspace.community_id || (workspace.defaultContext && workspace.defaultContext.communityId);
      const appId = workspace.app_id || (workspace.defaultContext && workspace.defaultContext.appId);
      
      if (!communityId || !appId) {
          throw new Error('Missing community_id or app_id for single_app mode path resolution');
      }
      return `${communityId}/${appId}/${normalizedLocal}`;
      
    case 'single_community':
      // Workspace root = community folder
      // Local: ./agent/kb/General/file.md
      // Drive: {community_id}/agent/kb/General/file.md
      const commId = workspace.community_id || (workspace.communities && Object.keys(workspace.communities)[0]);
      if (!commId) {
          throw new Error('Missing community_id for single_community mode path resolution');
      }
      return `${commId}/${normalizedLocal}`;
      
    case 'multi_community':
      // Workspace root = base folder
      // Local: ./descix/agent/kb/General/file.md
      // Drive: descix/agent/kb/General/file.md
      return normalizedLocal;
  }
}

/**
 * Resolve Drive path to local path based on workspace mode
 * @param {Object} workspace - Workspace configuration
 * @param {string} drivePath - Path relative to user's base_folder_id
 * @returns {string} Path relative to workspace root
 */
export function resolveToLocalPath(workspace, drivePath) {
  const mode = detectWorkspaceMode(workspace);
  
  switch (mode) {
    case 'single_app':
      // Remove community_id/app_id prefix
      const communityId = workspace.community_id || (workspace.defaultContext && workspace.defaultContext.communityId);
      const appId = workspace.app_id || (workspace.defaultContext && workspace.defaultContext.appId);
      
      const appPrefix = `${communityId}/${appId}/`;
      if (drivePath.startsWith(appPrefix)) {
        return './' + drivePath.slice(appPrefix.length);
      }
      throw new Error(`Drive path '${drivePath}' implies app '${appId}', but workspace is configured for '${appId}'`);
      
    case 'single_community':
      // Remove community_id prefix
      const commId = workspace.community_id || (workspace.communities && Object.keys(workspace.communities)[0]);
      const commPrefix = `${commId}/`;
      if (drivePath.startsWith(commPrefix)) {
        return './' + drivePath.slice(commPrefix.length);
      }
      throw new Error(`Drive path '${drivePath}' implies community '${commId}', but workspace is configured for '${commId}'`);
      
    case 'multi_community':
      // No prefix to remove
      return './' + drivePath;
  }
}
