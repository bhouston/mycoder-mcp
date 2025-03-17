import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';

import { agentTracker } from './lib/agentState.js';
import { agentDoneParameters, agentDoneExecute, agentDoneTool } from './tools/agentDone.js';
import { agentMessageParameters, agentMessageExecute, agentMessageTool } from './tools/agentMessage.js';
import { agentStartParameters, agentStartExecute, agentStartTool } from './tools/agentStart.js';
import { clarificationPromptParameters, clarificationPromptExecute, clarificationPromptTool } from './tools/clarificationPrompt.js';
import { listAgentsParameters, listAgentsExecute, listAgentsTool } from './tools/listAgents.js';

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
  server.tool(
    'agentStart',
    'Start a new agent with specific goals and context',
    agentStartParameters,
    agentStartExecute
  );
  
  server.tool(
    'agentMessage',
    'Send a message to a running agent or check its status',
    agentMessageParameters,
    agentMessageExecute
  );
  
  server.tool(
    'agentDone',
    'Complete an agent task and return the final result',
    agentDoneParameters,
    agentDoneExecute
  );
  
  server.tool(
    'agentQuery',
    'Ask a clarifying question to the user during agent execution',
    clarificationPromptParameters,
    clarificationPromptExecute
  );
  
  server.tool(
    'listAgents',
    'List all agents and their current status',
    listAgentsParameters,
    listAgentsExecute
  );

  consola.debug('Agent MCP server created');
  return server;
}

// Export the tools for backward compatibility
export {
  agentStartTool,
  agentMessageTool,
  agentDoneTool,
  clarificationPromptTool,
  listAgentsTool,
  agentTracker,
};