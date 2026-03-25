/**
 * Workspace Utilities
 *
 * Helper functions for workspace mode detection and path resolution.
 * v2.1 workspace format only (env.platform / env.products).
 */

import path from 'path';

/**
 * Detect workspace mode from workspace.json configuration (v2.1 format)
 * @param {Object} workspace - Parsed workspace.json
 * @returns {'single_app' | 'single_community' | 'multi_community'}
 */
export function detectWorkspaceMode(workspace) {
  // Explicit mode declaration
  if (workspace.mode) {
    return workspace.mode;
  }

  // v2.1 format: infer from env.platform + env.products
  if (workspace.env?.platform) {
    const productCount = Array.isArray(workspace.env.products) ? workspace.env.products.length : 0;
    // Platform + products = multi-community workspace
    return productCount > 0 ? 'multi_community' : 'single_app';
  }

  // Fallback for empty/initialized workspace using defaultContext
  if (workspace.defaultContext?.communityId && workspace.defaultContext?.appId) {
    return 'single_app';
  }

  throw new Error('Unable to determine workspace mode from configuration. Expected v2.1 format (env.platform / env.products).');
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
    case 'single_app': {
      const communityId = workspace.defaultContext?.communityId || workspace.env?.platform?.communityId;
      const appId = workspace.defaultContext?.appId || workspace.env?.platform?.appId;

      if (!communityId || !appId) {
        throw new Error('Missing community_id or app_id for single_app mode path resolution');
      }
      return `${communityId}/${appId}/${normalizedLocal}`;
    }

    case 'single_community': {
      const commId = workspace.defaultContext?.communityId || workspace.env?.platform?.communityId;
      if (!commId) {
        throw new Error('Missing community_id for single_community mode path resolution');
      }
      return `${commId}/${normalizedLocal}`;
    }

    case 'multi_community':
      // Workspace root = base folder
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
    case 'single_app': {
      const communityId = workspace.defaultContext?.communityId || workspace.env?.platform?.communityId;
      const appId = workspace.defaultContext?.appId || workspace.env?.platform?.appId;

      const appPrefix = `${communityId}/${appId}/`;
      if (drivePath.startsWith(appPrefix)) {
        return './' + drivePath.slice(appPrefix.length);
      }
      throw new Error(`Drive path '${drivePath}' does not match workspace app '${appId}'`);
    }

    case 'single_community': {
      const commId = workspace.defaultContext?.communityId || workspace.env?.platform?.communityId;
      const commPrefix = `${commId}/`;
      if (drivePath.startsWith(commPrefix)) {
        return './' + drivePath.slice(commPrefix.length);
      }
      throw new Error(`Drive path '${drivePath}' does not match workspace community '${commId}'`);
    }

    case 'multi_community':
      return './' + drivePath;
  }
}
