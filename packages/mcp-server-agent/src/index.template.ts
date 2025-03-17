import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';

import { agentTracker } from './lib/agentState.js';
import { agentDoneTool } from './tools/agentDone.js';
import { agentMessageTool } from './tools/agentMessage.js';
import { agentStartParameters, agentStartExecute, agentStartTool } from './tools/agentStart.template.js';
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
  server.tool(
    'agentStart',
    'Start a new agent with specific goals and context',
    agentStartParameters,
    agentStartExecute
  );
  
  // TODO: Update the other tools to use the same pattern as agentStart
  // For now, we're using a workaround to extract the parameters from the schema
  server.tool(
    'agentMessage',
    'Send a message to a running agent or check its status',
    {
      instanceId: agentMessageTool.schema.shape.instanceId,
      guidance: agentMessageTool.schema.shape.guidance,
      terminate: agentMessageTool.schema.shape.terminate,
      description: agentMessageTool.schema.shape.description,
    },
    agentMessageTool.handler
  );
  
  server.tool(
    'agentDone',
    'Complete an agent task and return the final result',
    {
      result: agentDoneTool.schema.shape.result,
    },
    agentDoneTool.handler
  );
  
  server.tool(
    'agentQuery',
    'Ask a clarifying question to the user during agent execution',
    {
      prompt: clarificationPromptTool.schema.shape.prompt,
    },
    clarificationPromptTool.handler
  );
  
  server.tool(
    'listAgents',
    'List all agents and their current status',
    {
      status: listAgentsTool.schema.shape.status,
      verbose: listAgentsTool.schema.shape.verbose,
    },
    listAgentsTool.handler
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