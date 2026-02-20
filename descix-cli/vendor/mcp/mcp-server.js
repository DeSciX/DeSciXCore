/**
 * DeSciX MCP Server - HTTP-Only Implementation
 * 
 * Model Context Protocol server that uses HTTP-only calls to /apifront/
 * No direct backend imports - all operations via HTTP API client
 */

import { EventEmitter } from 'events';
import DeSciXMCPTools from './tools.js';
import DeSciXMCPResources from './resources.js';
import DeSciXMCPPrompts from './prompts.js';

/**
 * DeSciX MCP Server - HTTP-only implementation
 */
export class DeSciXMCPServer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = config;
        this.defaultContext = config.defaultContext || {
            communityId: 'egpt',
            appId: 'agent',
            kbId: 'General'
        };
        
        // Initialize MCP modules (all HTTP-only)
        this.tools = new DeSciXMCPTools(this.defaultContext, config.apiClient);
        this.resources = new DeSciXMCPResources(this.defaultContext, config.apiClient);
        this.prompts = new DeSciXMCPPrompts(this.defaultContext);
        
        // Server info
        this.serverInfo = {
            name: 'DeSciX RAG MCP Server',
            version: '1.0.0',
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: true,
                resources: true,
                prompts: true,
                logging: true
            }
        };
        
        console.error('[MCP] DeSciX MCP Server initialized (HTTP-only)');
    }

    /**
     * Handle incoming JSON-RPC 2.0 request
     * All authentication handled via walletInfo passed to HTTP client
     */
    async handleRequest(request, user = null, walletInfo = null) {
        const { jsonrpc, id, method, params } = request;
        
        // Validate JSON-RPC format
        if (jsonrpc !== '2.0') {
            return this.createErrorResponse(id, -32600, 'Invalid Request: jsonrpc must be "2.0"');
        }
        
        if (!method) {
            return this.createErrorResponse(id, -32600, 'Invalid Request: method is required');
        }
        
        console.error(`[MCP] Request: ${method}`);
        
        try {
            let result;
            
            switch (method) {
                case 'initialize':
                    result = await this.handleInitialize(params);
                    break;
                
                case 'notifications/initialized':
                    // Client confirms initialization - no response needed
                    console.error('[MCP] Client confirmed initialization');
                    return null; // Notifications don't get responses
                
                case 'tools/list':
                    result = await this.handleToolsList(params);
                    break;
                
                case 'tools/call':
                    result = await this.handleToolsCall(params, walletInfo);
                    break;
                
                case 'resources/list':
                    result = await this.handleResourcesList(params);
                    break;
                
                case 'resources/read':
                    result = await this.handleResourcesRead(params, walletInfo);
                    break;
                
                case 'prompts/list':
                    result = await this.handlePromptsList(params);
                    break;
                
                case 'prompts/get':
                    result = await this.handlePromptsGet(params);
                    break;
                
                case 'ping':
                    result = { status: 'ok', timestamp: new Date().toISOString() };
                    break;
                
                default:
                    return this.createErrorResponse(id, -32601, `Method not found: ${method}`);
            }
            
            return this.createSuccessResponse(id, result);
        } catch (error) {
            console.error(`[MCP] Error handling ${method}:`, error.message);
            return this.createErrorResponse(id, -32603, `Internal error: ${error.message}`);
        }
    }

    /**
     * Handle initialize request
     */
    async handleInitialize(params) {
        console.error('[MCP] Initializing session');
        console.error('[MCP] Client capabilities:', JSON.stringify(params?.capabilities || {}));
        
        return {
            protocolVersion: this.serverInfo.protocolVersion,
            capabilities: this.serverInfo.capabilities,
            serverInfo: {
                name: this.serverInfo.name,
                version: this.serverInfo.version
            }
        };
    }

    /**
     * Handle tools/list request
     */
    async handleToolsList(params) {
        const tools = this.tools.getTools();
        return { tools };
    }

    /**
     * Handle tools/call request
     */
    async handleToolsCall(params, walletInfo) {
        const { name, arguments: args } = params;
        
        if (!name) {
            throw new Error('Tool name is required');
        }
        
        console.error(`[MCP] Calling tool: ${name}`);
        
        // Execute tool via callTool method
        const result = await this.tools.callTool(name, args || {});
        
        return {
            content: [
                {
                    type: 'text',
                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    /**
     * Handle resources/list request
     */
    async handleResourcesList(params) {
        const resources = this.resources.getResources();
        return { resources };
    }

    /**
     * Handle resources/read request
     */
    async handleResourcesRead(params, walletInfo) {
        const { uri } = params;
        
        if (!uri) {
            throw new Error('Resource URI is required');
        }
        
        console.error(`[MCP] Reading resource: ${uri}`);
        
        const resource = await this.resources.read(uri, walletInfo);
        return resource;
    }

    /**
     * Handle prompts/list request
     */
    async handlePromptsList(params) {
        const prompts = this.prompts.getPrompts();
        return { prompts };
    }

    /**
     * Handle prompts/get request
     */
    async handlePromptsGet(params) {
        const { name, arguments: args } = params;
        
        if (!name) {
            throw new Error('Prompt name is required');
        }
        
        const prompt = await this.prompts.get(name, args || {});
        return prompt;
    }

    /**
     * Create success response
     */
    createSuccessResponse(id, result) {
        return {
            jsonrpc: '2.0',
            id,
            result
        };
    }

    /**
     * Create error response
     */
    createErrorResponse(id, code, message, data = null) {
        const response = {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message
            }
        };
        
        if (data) {
            response.error.data = data;
        }
        
        return response;
    }
}

export default DeSciXMCPServer;

