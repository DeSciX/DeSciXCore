/**
 * Wizard Orchestrator for DeSciX SDK
 * 
 * Orchestrates multi-step wizard flows for app/community creation.
 * Used by both CLI (interactive) and MCP (agent-driven).
 * 
 * CRITICAL: This is a STATELESS orchestrator.
 * State is passed in and returned, not stored internally.
 * Git-aware: captures commit context at each sync step.
 */

/**
 * Wizard step definitions (prepare step removed - creation is via PWA/Admin CLI template copy)
 */
export const WIZARD_STEPS = {
  APP: [
    { id: 'create', name: 'Create Skeleton', description: 'Create app in DeSciX backend' },
    { id: 'assets', name: 'Upload Assets', description: 'Sync icon and description from assets/' },
    { id: 'drive_push', name: 'Push to Drive', description: 'Git-aware sync (kb/→Drive)' },
    { id: 'sync_gcs', name: 'Extract to GCS', description: 'Delta-extract text content' },
    { id: 'sync_pinecone', name: 'Vectorize', description: 'Delta-index in Pinecone for RAG' }
  ],
  COMMUNITY: [
    { id: 'validate_token', name: 'Validate Token', description: 'Check token symbol availability' },
    { id: 'create', name: 'Create Community', description: 'Register community with tokenomics' },
    { id: 'deploy_token', name: 'Deploy Token', description: 'Deploy DAITA_v2 token contract' },
    { id: 'assets', name: 'Upload Assets', description: 'Upload icon and description' },
    { id: 'verify', name: 'Verify', description: 'Confirm community is accessible' }
  ]
};

/**
 * WizardOrchestrator - Stateless multi-step wizard execution
 */
export class WizardOrchestrator {
  /**
   * @param {Object} apiClient - DeSciXApiClient instance for API calls
   */
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get the wizard steps for a workflow type
   * @param {string} wizardType - 'app' or 'community'
   * @returns {Array} Array of step definitions
   */
  getSteps(wizardType = 'app') {
    const type = wizardType.toUpperCase();
    return WIZARD_STEPS[type] || WIZARD_STEPS.APP;
  }

  /**
   * Get step index by ID
   * @param {string} stepId - Step identifier
   * @param {string} wizardType - Wizard type
   * @returns {number} Step index or -1
   */
  getStepIndex(stepId, wizardType = 'app') {
    const steps = this.getSteps(wizardType);
    return steps.findIndex(s => s.id === stepId);
  }

  /**
   * Get next step ID after current step
   * @param {string} currentStepId - Current step ID
   * @param {string} wizardType - Wizard type
   * @returns {string|null} Next step ID or null if complete
   */
  getNextStepId(currentStepId, wizardType = 'app') {
    const steps = this.getSteps(wizardType);
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) {
      return null;
    }
    return steps[currentIndex + 1].id;
  }

  /**
   * Execute a specific wizard step
   * @param {string} stepId - Step to execute
   * @param {Object} state - Current wizard state
   * @param {Object} options - Step-specific options
   * @returns {Promise<Object>} Result with updated state and next step
   */
  async executeStep(stepId, state, options = {}) {
    const handlers = {
      'validate_token': this._stepValidateToken.bind(this),
      'create': this._stepCreate.bind(this),
      'deploy_token': this._stepDeployToken.bind(this),
      'assets': this._stepAssets.bind(this),
      'drive_push': this._stepDrivePush.bind(this),
      'sync_gcs': this._stepSyncGcs.bind(this),
      'sync_pinecone': this._stepSyncPinecone.bind(this),
      'verify': this._stepVerify.bind(this)
    };

    const handler = handlers[stepId];
    if (!handler) {
      throw new Error(`Unknown wizard step: ${stepId}`);
    }

    return await handler(state, options);
  }

  /**
   * Execute all remaining steps from current position
   * @param {Object} state - Current wizard state
   * @param {Object} options - Options for all steps
   * @param {Function} [onProgress] - Progress callback (stepId, result)
   * @returns {Promise<Object>} Final state and results
   */
  async executeAll(state, options = {}, onProgress = null) {
    const wizardType = state.wizardType || 'app';
    const steps = this.getSteps(wizardType);
    const results = [];
    let currentState = { ...state };
    let startIndex = 0;

    // Find starting step if resuming
    if (state.currentStep) {
      startIndex = this.getStepIndex(state.currentStep, wizardType);
      if (startIndex === -1) startIndex = 0;
    }

    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        const result = await this.executeStep(step.id, currentState, options);
        currentState = result.state;
        results.push({ stepId: step.id, success: true, result: result.result });
        
        if (onProgress) {
          onProgress(step.id, result);
        }

        // Stop if step indicates completion
        if (result.nextStep === null) {
          break;
        }
      } catch (error) {
        results.push({ stepId: step.id, success: false, error: error.message });
        
        // Return partial results with error
        return {
          state: { ...currentState, error: error.message, failedStep: step.id },
          results,
          completed: false,
          error: error.message
        };
      }
    }

    return {
      state: { ...currentState, completed: true },
      results,
      completed: true
    };
  }

  // ============ Step Handlers ============

  /**
   * Step: Validate token symbol availability (community wizard only)
   * @private
   */
  async _stepValidateToken(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for validate_token step');
    }

    const tokenSymbol = state.tokenSymbol;
    if (!tokenSymbol) {
      throw new Error('tokenSymbol is required in state for validate_token step');
    }

    const response = await this.apiClient.invoke('check_token_symbol_available', {
      token_symbol: tokenSymbol
    });

    const result = response.message || response;

    if (!result.available) {
      throw new Error(result.message || `Token symbol '${tokenSymbol}' is not available`);
    }

    return {
      state: { 
        ...state, 
        tokenValidated: true,
        tokenSymbol: result.symbol
      },
      result: result,
      nextStep: 'create'
    };
  }

  /**
   * Step: Create skeleton app or community in backend
   * @private
   */
  async _stepCreate(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for create step');
    }

    const wizardType = state.wizardType || 'app';

    if (wizardType === 'community') {
      const response = await this.apiClient.invoke('create_community_with_app', {
        community_name: state.communityName,
        app_name: 'agent',
        token_symbol: state.tokenSymbol,
        is_public: options.isPublic ?? true
      });

      const data = response.message || response;
      const community = data.community || data;

      return {
        state: { 
          ...state, 
          created: true,
          communityId: community.community_id || state.communityId,
          driveFolderId: community.drive_folder_id
        },
        result: data,
        nextStep: 'deploy_token'
      };
    }

    // Create app
    const response = await this.apiClient.invoke('create_skeleton_app', {
      community_id: state.communityId,
      app_name: state.appName,
      overwrite: options.overwrite || false,
      app_description: state.description,
      createSubfolders: true
    });

    const data = response.message || response;
    const appId = data.app_id || state.appName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    return {
      state: { 
        ...state, 
        created: true, 
        appId,
        driveFolderId: data.folder_id
      },
      result: data,
      nextStep: 'assets'
    };
  }

  /**
   * Step: Deploy DAITA_v2 token contract (community wizard only)
   * 
   * Note: Token deployment is now handled automatically by create_community_with_app
   * during community creation. This step is for deploying to existing communities
   * that don't yet have a token contract.
   * @private
   */
  async _stepDeployToken(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for deploy_token step');
    }

    // Check if token contract is already deployed
    if (state.tokenContractAddress) {
      return {
        state: { ...state, tokenDeployed: true },
        result: { 
          skipped: true, 
          message: 'Token contract already deployed',
          contract_address: state.tokenContractAddress
        },
        nextStep: 'assets'
      };
    }

    // Skip deployment if explicitly disabled
    if (options.skipTokenDeployment) {
      return {
        state: { ...state, tokenDeployed: false },
        result: { 
          skipped: true, 
          message: 'Token deployment skipped by option'
        },
        nextStep: 'assets'
      };
    }

    // Deploy token contract via deploy_contract command
    // This deploys a DAITA_v2 contract and links it to the community
    const response = await this.apiClient.invoke('deploy_contract', {
      community_id: state.communityId,
      token_symbol: state.tokenSymbol,
      token_name: state.tokenName || `${state.communityName} Token`,
      cap_size: options.capSize || 'small'
    });

    const data = response.message || response;

    return {
      state: { 
        ...state, 
        tokenDeployed: true,
        tokenContractAddress: data.contract_address || data.proxyAddress
      },
      result: {
        ...data,
        message: `Token contract deployed at ${data.contract_address || data.proxyAddress}`
      },
      nextStep: 'assets'
    };
  }

  /**
   * Step: Upload/refresh listing assets
   * @private
   */
  async _stepAssets(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for assets step');
    }

    const wizardType = state.wizardType || 'app';

    if (wizardType === 'community') {
      // Upload community assets from local assets/ folder
      const projectPath = state.projectPath || process.cwd();
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const assetsPath = path.join(projectPath, 'assets');
      const files = [];
      
      try {
        const entries = await fs.readdir(assetsPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && !entry.name.startsWith('.')) {
            const fullPath = path.join(assetsPath, entry.name);
            const content = await fs.readFile(fullPath);
            files.push({
              name: entry.name,
              content: content.toString('base64'),
              mime_type: this._getMimeType(entry.name)
            });
          }
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            state: { ...state, assetsUploaded: true },
            result: { 
              skipped: true, 
              message: 'No assets/ folder found. Create it with icon.png and community_description.md'
            },
            nextStep: 'verify'
          };
        }
        throw error;
      }

      if (files.length === 0) {
        return {
          state: { ...state, assetsUploaded: true },
          result: { skipped: true, message: 'No files found in assets/' },
          nextStep: 'verify'
        };
      }

      const response = await this.apiClient.invoke('upload_community_assets', {
        community_id: state.communityId,
        files: files
      });

      return {
        state: { ...state, assetsUploaded: true },
        result: response.message || response,
        nextStep: 'verify'
      };
    }

    // App: Refresh assets from Drive folder
    const response = await this.apiClient.invoke('refresh_listing_assets', {
      community_id: state.communityId,
      app_id: state.appId
    });

    return {
      state: { ...state, assetsUploaded: true },
      result: response.message || response,
      nextStep: 'drive_push'
    };
  }

  /**
   * Get MIME type from filename
   * @private
   */
  _getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Step: Push local files to Drive (Git-aware)
   * @private
   */
  async _stepDrivePush(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for drive_push step');
    }

    // Read files from local folder
    const localFolder = options.localFolder || 'General';
    const projectPath = state.projectPath || process.cwd();
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const kbPath = path.join(projectPath, localFolder);
    const files = [];
    
    try {
      const entries = await fs.readdir(kbPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && !entry.name.startsWith('.')) {
          const fullPath = path.join(kbPath, entry.name);
          const content = await fs.readFile(fullPath);
          const stat = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            path: entry.name,
            content: content.toString('base64'),
            modified_time: stat.mtime.toISOString()
          });
        }
      }
    } catch (error) {
      // Folder doesn't exist or can't be read
      if (error.code === 'ENOENT') {
        return {
          state: { ...state, drivePushed: true, lastCommitHash: state.gitCommitHash },
          result: { 
            skipped: true, 
            message: `Local folder '${localFolder}' not found. Create it and add files to sync.`
          },
          nextStep: options.dryRun ? null : 'sync_gcs'
        };
      }
      throw error;
    }

    if (files.length === 0) {
      return {
        state: { ...state, drivePushed: true, lastCommitHash: state.gitCommitHash },
        result: { skipped: true, message: `No files found in ${localFolder}/` },
        nextStep: options.dryRun ? null : 'sync_gcs'
      };
    }

    if (options.dryRun) {
      return {
        state: { ...state },
        result: { 
          dryRun: true, 
          filesFound: files.length,
          files: files.map(f => f.name)
        },
        nextStep: null
      };
    }

    // Sync files to Drive
    const response = await this.apiClient.invoke('sync_local_to_drive', {
      community_id: state.communityId,
      app_id: state.appId,
      kb_id: localFolder,
      files: files,
      mode: 'overwrite_if_newer'
    });

    return {
      state: { 
        ...state, 
        drivePushed: true, 
        lastCommitHash: state.gitCommitHash 
      },
      result: {
        ...response.message || response,
        commit_hash: state.gitCommitHash
      },
      nextStep: 'sync_gcs'
    };
  }

  /**
   * Step: Sync Drive to GCS (text extraction)
   * @private
   */
  async _stepSyncGcs(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for sync_gcs step');
    }

    const kbId = options.kbId || 'General';

    const response = await this.apiClient.invoke('sync_drive_to_gcs', {
      community_id: state.communityId,
      app_id: state.appId,
      kb_id: kbId
    });

    return {
      state: { ...state, gcsSync: true },
      result: response.message || response,
      nextStep: 'sync_pinecone'
    };
  }

  /**
   * Step: Sync GCS to Pinecone (vectorization)
   * @private
   */
  async _stepSyncPinecone(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for sync_pinecone step');
    }

    const kbId = options.kbId || 'General';

    const response = await this.apiClient.invoke('sync_gcs_to_pinecone', {
      community_id: state.communityId,
      app_id: state.appId,
      kb_id: kbId
    });

    return {
      state: { 
        ...state, 
        pineconeSync: true, 
        completed: true 
      },
      result: response.message || response,
      nextStep: null
    };
  }

  /**
   * Step: Verify community/app is accessible (for community wizard)
   * @private
   */
  async _stepVerify(state, options) {
    if (!this.apiClient) {
      throw new Error('API client required for verify step');
    }

    const response = await this.apiClient.invoke('get_community', {
      community_id: state.communityId
    });

    const community = response.message?.community || response.community;
    
    return {
      state: { ...state, verified: true, completed: true },
      result: {
        verified: !!community,
        community
      },
      nextStep: null
    };
  }
}

/**
 * Create a WizardOrchestrator instance
 * @param {Object} apiClient - API client for backend calls
 * @returns {WizardOrchestrator}
 */
export function createWizardOrchestrator(apiClient) {
  return new WizardOrchestrator(apiClient);
}

export default WizardOrchestrator;
