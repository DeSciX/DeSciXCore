/**
 * MCP Transport Layer
 * 
 * Provides pluggable transport implementations for the DeSciX MCP Server:
 * - StdioTransport: For CLI-based clients (Cursor, VS Code, Claude Desktop)
 * - HttpSseTransport: For remote HTTP clients (ChatGPT, web agents)
 * 
 * All transports use the same DeSciXMCPServer core with HTTP-only API calls.
 */

export { StdioTransport } from './stdio-transport.js';
export { HttpSseTransport } from './http-sse-transport.js';



