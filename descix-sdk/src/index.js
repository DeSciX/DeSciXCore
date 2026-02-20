/**
 * DeSciX SDK - Node.js Business Logic Layer
 * 
 * Provides Git-aware project management, wizard orchestration,
 * and API wrappers for CLI and MCP tools.
 */

// Integrations
export { GitUtils, createGitUtils } from './integrations/gitUtils.js';

// Orchestrators
export { WizardOrchestrator, createWizardOrchestrator, WIZARD_STEPS } from './orchestrators/wizardOrchestrator.js';

// Managers
export { CommunityManager, createCommunityManager } from './managers/communityManager.js';
export { AppManager, createAppManager } from './managers/appManager.js';

// Auth
export { Signer } from './auth/signer.js';

// Import classes for factory function
import { GitUtils } from './integrations/gitUtils.js';
import { WizardOrchestrator, WIZARD_STEPS } from './orchestrators/wizardOrchestrator.js';
import { CommunityManager } from './managers/communityManager.js';
import { AppManager } from './managers/appManager.js';
import { Signer } from './auth/signer.js';

/**
 * Create all SDK components with a shared API client
 * @param {Object} apiClient - DeSciXApiClient instance
 * @returns {Object} SDK instance with all components
 */
export function createSDK(apiClient) {
  return {
    community: new CommunityManager(apiClient),
    app: new AppManager(apiClient),
    wizard: new WizardOrchestrator(apiClient),
    
    /**
     * Create GitUtils for a project path
     * @param {string} projectPath - Path to project
     * @returns {GitUtils}
     */
    createGitUtils(projectPath) {
      return new GitUtils(projectPath);
    }
  };
}

// Default export
export default {
  GitUtils,
  WizardOrchestrator,
  CommunityManager,
  AppManager,
  createGitUtils: (path) => new GitUtils(path),
  createWizardOrchestrator: (client) => new WizardOrchestrator(client),
  createCommunityManager: (client) => new CommunityManager(client),
  createAppManager: (client) => new AppManager(client),
  createSDK,
  WIZARD_STEPS,
  Signer
};
