import { mcpClient } from '../mcpClient.js';

export const commands = {
    /**
     * Simple echo command
     */
    sample_hello: async (params) => {
        const { message, _descix } = params;
        
        return {
            status: 'OK',
            message: `Echo: ${message}`,
            user: _descix?.user?.email || 'Guest'
        };
    },

    /**
     * Demonstrates Loopback:
     * 1. Receives a query
     * 2. Calls Core Tool (query_knowledge_base) via MCP Client
     * 3. Returns combined result
     */
    sample_analyze: async (params) => {
        const { query, _descix } = params;

        if (!_descix?.user) {
            throw new Error('Authentication required for analysis');
        }

        console.log(`[SampleService] Analyzing '${query}' for user ${_descix.user.id}`);

        try {
            // CALL CORE TOOL: query_knowledge_base
            // This goes Service -> Cloud -> Vector DB -> Cloud -> Service
            const ragResult = await mcpClient.callTool('query_knowledge_base', {
                community_id: 'descix',
                app_id: 'docs',
                kb_id: 'sdk',
                query: query
            }, _descix);

            return {
                status: 'OK',
                analysis: `Analyzed query: ${query}`,
                rag_findings: ragResult || 'No results found',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[SampleService] RAG lookup failed:', error);
            return {
                status: 'ERROR',
                message: 'Analysis failed due to upstream error',
                details: error.message
            };
        }
    }
};
