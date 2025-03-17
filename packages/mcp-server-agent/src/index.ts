import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';

import { agentTracker } from './lib/agentState.js';
import { agentDoneTool } from './tools/agentDone.js';
import { agentMessageTool } from './tools/agentMessage.js';
import { agentStartTool } from './tools/agentStart.js';
import { clarificationPromptTool } from './tools/clarificationPrompt.js';
import { listAgentsTool } from './tools/listAgents.js';

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
  agentTracker,
};
