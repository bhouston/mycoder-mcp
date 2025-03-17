import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';

import { agentDoneTool } from './tools/agentDone';
import { agentMessageTool } from './tools/agentMessage';
import { agentStartTool } from './tools/agentStart';
import { clarificationPromptTool } from './tools/clarificationPrompt';
import { listAgentsTool } from './tools/listAgents';
import { agentTracker } from './lib/agentState';

/**
 * Create an Agent MCP server instance
 */
export function createAgentMcpServer() {
  // Create the MCP server
  const server = new McpServer({
    name: 'MyCoder-MCP Agent',
    version: '1.0.0',
  });

  // Set up the logger for the agent tracker
  agentTracker.setLogger(consola);

  // Register the agent tools
  server.tool('agentStart', agentStartTool.schema, agentStartTool.handler);
  server.tool('agentMessage', agentMessageTool.schema, agentMessageTool.handler);
  server.tool('agentDone', agentDoneTool.schema, agentDoneTool.handler);
  server.tool('agentQuery', clarificationPromptTool.schema, clarificationPromptTool.handler);
  server.tool('listAgents', listAgentsTool.schema, listAgentsTool.handler);

  consola.debug('Agent MCP server created');
  return server;
}

export { 
  agentStartTool, 
  agentMessageTool, 
  agentDoneTool, 
  clarificationPromptTool,
  listAgentsTool,
  agentTracker 
};