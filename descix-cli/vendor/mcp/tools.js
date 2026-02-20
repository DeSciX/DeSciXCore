/**
 * MCP Tools for DeSciX - Intelligent Discovery-First Implementation
 * 
 * Minimal tool set designed for semantic discovery via tell_me_how.
 * Instead of loading all tools statically, AI agents use tell_me_how to
 * discover relevant tools, then execute them via execute_remote_command.
 * 
 * Core tools:
 * - tell_me_how: Discover tools via semantic search (scoped by entitlements)
 * - descix_init: Git-aware project scaffolding (local)
 * - descix_wizard_step: Multi-step wizard execution (hybrid)
 * - git_sync_ops: Git operations with auto-generated messages (local)
 * - execute_remote_command: Pass-through gateway for any backend command
 * 
 * Plus core RAG operations for direct KB access when you know the target.
 */

export class DeSciXMCPTools {
    constructor(defaultContext = {}, apiClient = null) {
        this.defaultContext = defaultContext; // { communityId, appId, kbId }
        this.apiClient = apiClient; // HTTP-only API client
    }

    /**
     * Get all available tools - minimal discovery-first set
     */
    getTools() {
        return [
            // ============ Core Discovery Tool ============
            {
                name: 'tell_me_how',
                description: `Ask the DeSciX platform how to accomplish a task. This is your PRIMARY tool for discovering platform capabilities.

Returns recommended tools and step-by-step instructions based on semantic search of service documentation.

Scope options:
- "project": Only tools from communities/apps in current project (.descix/workspace.json)
- "entitlements": Only tools you have access to (DEFAULT - safe, actionable)
- "discovery": All platform tools (shows which require purchase)

Use this BEFORE attempting any platform operation to find the right tools.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        question: {
                            type: 'string',
                            description: 'What do you want to accomplish? Use natural language.'
                        },
                        scope: {
                            type: 'string',
                            enum: ['project', 'entitlements', 'discovery'],
                            default: 'entitlements',
                            description: 'Scope of tool search'
                        },
                        project_context: {
                            type: 'object',
                            description: 'For project scope: { community_ids: [...], app_ids: [...] }',
                            properties: {
                                community_ids: { type: 'array', items: { type: 'string' } },
                                app_ids: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    },
                    required: ['question']
                }
            },
            
            // ============ Local Project Operations ============
            {
                name: 'descix_init',
                description: `Initialize or prepare a local project for DeSciX deployment.

LOCAL-ONLY operation that:
- Detects Git repo status (branch, commit, uncommitted changes)
- Creates/updates .descix/workspace.json with project configuration
- Generates app_description.md from README if missing
- Sets up folder structure for knowledge base files
- Prepares manifest.json for microservice registration

Use this to set up a new project or verify an existing one.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: {
                            type: 'string',
                            description: 'Absolute path to the project root'
                        },
                        appName: {
                            type: 'string',
                            description: 'Name for the app (auto-detected from folder if not provided)'
                        },
                        communityId: {
                            type: 'string',
                            description: 'Community ID this app belongs to'
                        }
                    },
                    required: ['projectPath']
                }
            },
            {
                name: 'descix_wizard_step',
                description: `Execute a step in a multi-step wizard workflow.

HYBRID operation - manages local state while calling backend APIs.
Supports stateless execution with client-managed wizard_state.

Common wizards:
- create_app: Multi-step app creation with folder setup
- create_community: Community creation with token setup
- publish_kb: Knowledge base sync and publish workflow

The wizard guides you through complex operations step by step.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        wizard_type: {
                            type: 'string',
                            description: 'Type of wizard (create_app, create_community, publish_kb, etc.)'
                        },
                        step: {
                            type: 'string',
                            description: 'Current step name (init, configure, execute, verify)'
                        },
                        wizard_state: {
                            type: 'object',
                            description: 'Previous wizard state (for continuation)'
                        },
                        params: {
                            type: 'object',
                            description: 'Step-specific parameters'
                        }
                    },
                    required: ['wizard_type', 'step']
                }
            },
            {
                name: 'git_sync_ops',
                description: `Perform Git operations with DeSciX-aware commit message generation.

LOCAL-ONLY operation for Git workflows:
- status: Get uncommitted changes and sync state
- commit: Stage and commit with auto-generated message
- diff: Show changes since last sync
- sync_info: Get metadata for .descix/workspace.json update

Automatically generates descriptive commit messages based on changes.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            enum: ['status', 'commit', 'diff', 'sync_info'],
                            description: 'Git operation to perform'
                        },
                        projectPath: {
                            type: 'string',
                            description: 'Path to git repository'
                        },
                        commitMessage: {
                            type: 'string',
                            description: 'Optional: Override auto-generated commit message'
                        },
                        stageAll: {
                            type: 'boolean',
                            description: 'Stage all changes before commit (default: true)',
                            default: true
                        }
                    },
                    required: ['operation', 'projectPath']
                }
            },
            
            // ============ Remote Command Gateway ============
            {
                name: 'execute_remote_command',
                description: `Execute any DeSciX backend command.

This is the GATEWAY for all remote operations discovered via tell_me_how.
Pass the command name and parameters exactly as returned by tell_me_how.

Use this after tell_me_how has identified the right tool to use.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Backend command name (e.g., "create_app", "sync_kb_rag")'
                        },
                        params: {
                            type: 'object',
                            description: 'Command parameters (varies by command)'
                        }
                    },
                    required: ['command', 'params']
                }
            },
            
            // ============ Direct RAG Operations ============
            // Keep these for direct KB access when you know the target
            {
                name: 'search_knowledge_base',
                description: 'Perform semantic search across a DeSciX knowledge base. Use when you know the exact community/app/kb to search.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        communityId: {
                            type: 'string',
                            description: 'Community ID (e.g., "egpt", "descix")'
                        },
                        appId: {
                            type: 'string',
                            description: 'App ID (e.g., "agent", "docs")'
                        },
                        kbId: {
                            type: 'string',
                            description: 'Knowledge Base ID (e.g., "General", "sdk")'
                        },
                        query: {
                            type: 'string',
                            description: 'Search query (natural language)'
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum results (default: 5)',
                            default: 5
                        }
                    },
                    required: ['communityId', 'appId', 'kbId', 'query']
                }
            },
            {
                name: 'chat_with_kb',
                description: 'Chat with RAG-enhanced AI using knowledge base context. Use when you know the exact KB and want conversational interaction.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        communityId: { type: 'string' },
                        appId: { type: 'string' },
                        kbId: { type: 'string' },
                        message: {
                            type: 'string',
                            description: 'Your question or message'
                        }
                    },
                    required: ['communityId', 'appId', 'kbId', 'message']
                }
            }
        ];
    }

    /**
     * Call a tool by name with arguments
     */
    async callTool(toolName, args) {
        this._ensureApiClient();

        switch (toolName) {
            // Core Discovery
            case 'tell_me_how':
                return await this.tellMeHow(args);
                
            // Local Operations
            case 'descix_init':
                return await this.initWorkspace(args);
            case 'descix_wizard_step':
                return await this.executeWizardStep(args);
            case 'git_sync_ops':
                return await this.gitSyncOps(args);
                
            // Remote Gateway
            case 'execute_remote_command':
                return await this.executeRemoteCommand(args);
                
            // Direct RAG
            case 'search_knowledge_base':
                return await this.searchKnowledgeBase(args);
            case 'chat_with_kb':
                return await this.chatWithKB(args);
                
            default:
                throw new Error(`Unknown tool: ${toolName}. Use tell_me_how to discover available tools.`);
        }
    }

    _ensureApiClient() {
        if (!this.apiClient) {
            throw new Error('API client not configured. Call setApiClient() first.');
        }
    }

    // ============ Core Discovery Implementation ============

    /**
     * Discover tools via semantic search
     */
    async tellMeHow(args) {
        const { question, scope = 'entitlements', project_context } = args;

        // Read project context from workspace.json if scope is 'project' and not provided
        let contextToUse = project_context;
        if (scope === 'project' && !project_context) {
            try {
                const { WorkspaceConfig } = await import('../../lib/workspace-config.js');
                const wsConfig = await WorkspaceConfig.load(process.cwd());
                if (wsConfig) {
                    // Extract community_ids from primaryCommunity and directoryMappings
                    const communityIds = new Set();
                    const appIds = new Set();
                    
                    if (wsConfig.primaryCommunity) {
                        communityIds.add(wsConfig.primaryCommunity);
                    }
                    
                    // Extract from directoryMappings
                    for (const mapping of Object.values(wsConfig.directoryMappings || {})) {
                        if (mapping.communityId) communityIds.add(mapping.communityId);
                        if (mapping.appId) appIds.add(mapping.appId);
                    }
                    
                    // Extract from defaultContext
                    if (wsConfig.defaultContext?.communityId) {
                        communityIds.add(wsConfig.defaultContext.communityId);
                    }
                    if (wsConfig.defaultContext?.appId) {
                        appIds.add(wsConfig.defaultContext.appId);
                    }
                    
                    contextToUse = {
                        community_ids: Array.from(communityIds),
                        app_ids: Array.from(appIds)
                    };
                }
            } catch (e) {
                console.warn('[tell_me_how] Could not read workspace config:', e.message);
            }
        }

        const result = await this.apiClient.invoke('tell_me_how', {
            question,
            scope,
            project_context: contextToUse
        });

        return result.message || result;
    }

    // ============ Local Operations Implementation ============

    /**
     * Initialize workspace: creates .descix/workspace.json only (creation is via PWA/Admin CLI).
     * LOCAL-ONLY operation
     */
    async initWorkspace(args) {
        const { initWorkspace: doInit } = await import('../../commands/init.js');
        const result = await doInit({
            path: args.projectPath,
            communityId: args.communityId,
            appName: args.appName
        });
        const appId = (args.appName || args.projectPath.split('/').pop() || 'app')
            .toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        return {
            success: true,
            projectPath: args.projectPath,
            workspace: {
                communityId: args.communityId,
                appName: args.appName || appId,
                appId
            },
            filesCreated: result.created,
            filesSkipped: result.skipped,
            warnings: result.warnings,
            nextSteps: result.nextSteps || []
        };
    }

    /**
     * Execute wizard step
     * HYBRID operation - local state + remote API
     */
    async executeWizardStep(args) {
        const { wizard_type, step, wizard_state = {}, params = {} } = args;
        
        const { WizardOrchestrator } = await import('@descix/sdk/orchestrators/wizard');
        
        const orchestrator = new WizardOrchestrator(this.apiClient);
        const result = await orchestrator.executeStep(wizard_type, step, {
            ...wizard_state,
            ...params
        });
        
        return result;
    }

    /**
     * Git operations with auto-generated messages
     * LOCAL-ONLY operation
     */
    async gitSyncOps(args) {
        const { operation, projectPath, commitMessage, stageAll = true } = args;
        const { GitUtils } = await import('@descix/sdk/integrations/git');
        
        const git = new GitUtils(projectPath);
        
        switch (operation) {
            case 'status':
                return await git.getStatus();
                
            case 'commit':
                const msg = commitMessage || await git.generateCommitMessage();
                if (stageAll) {
                    await git.stageAll();
                }
                return await git.commit(msg);
                
            case 'diff':
                return await git.getDiff();
                
            case 'sync_info':
                return await git.getSyncInfo();
                
            default:
                throw new Error(`Unknown git operation: ${operation}`);
        }
    }

    // ============ Remote Gateway Implementation ============

    /**
     * Execute any remote command - pass-through gateway
     */
    async executeRemoteCommand(args) {
        const { command, params } = args;
        
        if (!command) {
            throw new Error('command is required');
        }
        
        console.log(`[execute_remote_command] Executing: ${command}`);
        
        try {
            const result = await this.apiClient.invoke(command, params || {});
            return result.message || result;
        } catch (error) {
            // Enhance error with helpful suggestions
            return {
                status: 'ERROR',
                message: error.message,
                command: command,
                suggestion: `Use tell_me_how("How do I ${command}?") for usage instructions`
            };
        }
    }

    // ============ Direct RAG Operations ============

    /**
     * Search a knowledge base
     */
    async searchKnowledgeBase(args) {
        const communityId = args.communityId || this.defaultContext.communityId;
        const appId = args.appId || this.defaultContext.appId;
        const kbId = args.kbId || this.defaultContext.kbId;

        if (!communityId || !appId || !kbId) {
            throw new Error('communityId, appId, and kbId are required. Use tell_me_how to find the right KB.');
        }

        const result = await this.apiClient.invoke('query_knowledge_base', {
            community_id: communityId,
            app_id: appId,
            knowledgebase_name: kbId,
            query_text: args.query,
            top_k: args.limit || 5
        });

        const ragResult = result.message || result;

        return {
            query: args.query,
            results: ragResult.results?.map(r => ({
                content: r.text,
                score: r.score,
                source: r.fileName,
                fileId: r.fileId
            })) || [],
            citations: ragResult.citations || []
        };
    }

    /**
     * Chat with a knowledge base
     */
    async chatWithKB(args) {
        const communityId = args.communityId || this.defaultContext.communityId;
        const appId = args.appId || this.defaultContext.appId;
        const kbId = args.kbId || this.defaultContext.kbId;

        if (!communityId || !appId || !kbId) {
            throw new Error('communityId, appId, and kbId are required. Use tell_me_how to find the right KB.');
        }

        const result = await this.apiClient.invoke('chat_with_kb_rag', {
            community_id: communityId,
            app_id: appId,
            knowledgebase_name: kbId,
            user_input: args.message
        });

        const chatResult = result.message || result;
        return {
            response: chatResult.text || chatResult.answer || chatResult,
            sources: chatResult.sources || []
        };
    }
}

export default DeSciXMCPTools;
