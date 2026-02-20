/**
 * MCP Resources for DeSciX - HTTP-Only Implementation
 * 
 * Provides access to knowledge base files and platform documentation via HTTP
 */

export class DeSciXMCPResources {
    constructor(defaultContext = {}, apiClient = null) {
        this.defaultContext = defaultContext;
        this.apiClient = apiClient;
    }

    /**
     * Get all available resources
     */
    getResources() {
        return [
            {
                uri: 'descix://kb/{community}/{app}/{kb}/stats',
                name: 'Knowledge Base Statistics',
                description: 'Statistics about a knowledge base RAG vectors',
                mimeType: 'application/json'
            },
            {
                uri: 'descix://kb/{community}/{app}/{kb}/files',
                name: 'Knowledge Base Files',
                description: 'List of all indexed files in a knowledge base',
                mimeType: 'application/json'
            },
            {
                uri: 'descix://kb/{community}/{app}/{kb}/file/{path}',
                name: 'File Content',
                description: 'Complete content of a specific file',
                mimeType: 'text/plain'
            },
            {
                uri: 'descix://communities',
                name: 'Communities List',
                description: 'List of all DeSciX communities',
                mimeType: 'application/json'
            },
            {
                uri: 'descix://docs/{name}',
                name: 'Platform Documentation',
                description: 'Access platform documentation from platform-docs KB (e.g., nft-advertising, economy, platform-architecture)',
                mimeType: 'text/markdown'
            }
        ];
    }

    /**
     * Read a resource by URI via HTTP
     */
    async read(uri, walletInfo = null) {
        // Parse URI
        const match = uri.match(/^descix:\/\/([^\/]+)\/(.+)$/);
        if (!match) {
            throw new Error(`Invalid resource URI: ${uri}`);
        }

        const [, type, path] = match;

        // Set credentials if provided
        if (walletInfo && this.apiClient) {
            this.apiClient.setCredentials({
                userId: walletInfo.userId || null,
                accessToken: walletInfo.sessionToken || null,
                walletAddress: walletInfo.walletAddress || null,
                signature: walletInfo.signature || null
            });
        }

        // Handle different resource types
        if (type === 'kb') {
            return await this.handleKBResource(path);
        }

        if (type === 'docs') {
            return await this.handleDocsResource(path);
        }

        if (type === 'communities') {
            return await this.handleCommunitiesResource();
        }

        throw new Error(`Unknown resource type: ${type}`);
    }

    /**
     * Handle KB resource via HTTP
     */
    async handleKBResource(path) {
        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const parts = path.split('/');
        
        if (parts.length < 3) {
            throw new Error('Invalid KB resource path');
        }

        const [communityId, appId, kbId, ...rest] = parts;

        // Determine resource type
        if (rest[0] === 'stats') {
            const result = await this.apiClient.invoke('get_kb_rag_status', {
                community_id: communityId,
                app_id: appId,
                kb_id: kbId
            });
            
            return {
                uri: `descix://kb/${communityId}/${appId}/${kbId}/stats`,
                mimeType: 'application/json',
                content: JSON.stringify(result.message || result, null, 2)
            };
        }

        if (rest[0] === 'files') {
            const result = await this.apiClient.invoke('list_kb_rag_files', {
                community_id: communityId,
                app_id: appId,
                kb_id: kbId
            });
            
            const files = result.message?.files || [];
            return {
                uri: `descix://kb/${communityId}/${appId}/${kbId}/files`,
                mimeType: 'application/json',
                content: JSON.stringify({ files, count: files.length }, null, 2)
            };
        }

        if (rest[0] === 'file') {
            const filePath = rest.slice(1).join('/');
            const result = await this.apiClient.invoke('get_kb_rag_file_content', {
                community_id: communityId,
                app_id: appId,
                kb_id: kbId,
                file_path: filePath
            });
            
            return {
                uri: `descix://kb/${communityId}/${appId}/${kbId}/file/${filePath}`,
                mimeType: 'text/plain',
                content: result.message?.content || result.message || ''
            };
        }

        throw new Error(`Unknown KB resource: ${rest[0]}`);
    }

    /**
     * Handle docs resource via HTTP
     */
    async handleDocsResource(docName) {
        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        // Map common doc names to file patterns
        const docMap = {
            'nft-advertising': 'NFT_Advertising_System',
            'economy': 'Economy_Architecture',
            'platform-architecture': 'DeSciX_Platform_Architecture',
            'platform-setup': 'DeSciX_Platform_Setup_Dev',
            'whitepaper': 'DeSciX_Whitepaper'
        };

        const searchPattern = docMap[docName] || docName.replace(/-/g, '_');
        
        try {
            // Search for the document using query_knowledge_base
            const result = await this.apiClient.invoke('query_knowledge_base', {
                community_id: 'descix',
                app_id: 'platform-docs',
                kb_id: 'General',
                query: searchPattern,
                limit: 5
            });
            
            if (!result.message?.results || result.message.results.length === 0) {
                throw new Error(`Document "${docName}" not found in platform-docs KB. Available docs: ${Object.keys(docMap).join(', ')}`);
            }

            // Get the best match
            const bestMatch = result.message.results[0];
            const filePath = bestMatch.filePath || bestMatch.file_path;

            // Get full content of the file
            const fileResult = await this.apiClient.invoke('get_kb_rag_file_content', {
                community_id: 'descix',
                app_id: 'platform-docs',
                kb_id: 'General',
                file_path: filePath
            });

            return {
                uri: `descix://docs/${docName}`,
                mimeType: 'text/markdown',
                content: fileResult.message?.content || fileResult.message || ''
            };
        } catch (error) {
            throw new Error(`Error accessing documentation "${docName}": ${error.message}`);
        }
    }

    /**
     * Handle communities resource via HTTP
     */
    async handleCommunitiesResource() {
        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const result = await this.apiClient.invoke('find_communities', {}, { allowGuest: true });
        
        const communities = result.message || [];
        
        return {
            uri: 'descix://communities',
            mimeType: 'application/json',
            content: JSON.stringify({ 
                communities: communities.map(c => ({
                    id: c.community_id,
                    name: c.community_name,
                    description: c.community_description
                })),
                count: communities.length 
            }, null, 2)
        };
    }
}

export default DeSciXMCPResources;

