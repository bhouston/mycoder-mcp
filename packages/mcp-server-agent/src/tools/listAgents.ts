import { z } from 'zod';

import { agentTracker } from '../lib/agentState.js';
import { AgentStatus } from '../lib/AgentTracker.js';

// Define the parameter schema for the listAgents tool
export const listAgentsParameters = {
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .describe('Filter agents by status (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .describe('Include detailed metadata about each agent (default: false)'),
};

// Define the parameter schema using z.object
const parameterSchema = z.object(listAgentsParameters);

// Define a schema for agent info
const agentInfoSchema = z.object({
  id: z.string(),
  goal: z.string(),
  status: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Define the return schema for the listAgents tool
const returnSchema = z.object({
  agents: z.array(agentInfoSchema),
});

// Type inference for parameters
type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Define the content response type to match SDK expectations
type ContentResponse = {
  content: {
    type: 'text';
    text: string;
  }[];
  isError?: boolean;
};

// Helper function to build consistent responses
const buildContentResponse = (result: ReturnType | { error: string }): ContentResponse => {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
    ...('error' in result && { isError: true }),
  };
};

// Export the handler function
export const listAgentsExecute = async (parameters: Parameters): Promise<ContentResponse> => {
  try {
    const { status = 'all', verbose = false } = parameters;

    // Get the agents with the specified status
    let agents = agentTracker.listAgents();

    if (status !== 'all') {
      const statusMap = {
        running: AgentStatus.RUNNING,
        completed: AgentStatus.COMPLETED,
        error: AgentStatus.ERROR,
        terminated: AgentStatus.TERMINATED,
      };

      agents = agents.filter(
        (agent) => agent.status === statusMap[status as keyof typeof statusMap],
      );
    }

    // Format the agents for output
    const formattedAgents = agents.map((agent) => {
      const basicInfo = {
        id: agent.id,
        goal: agent.goal,
        status: agent.status,
        startTime: agent.startTime.toISOString(),
        ...(agent.endTime && { endTime: agent.endTime.toISOString() }),
        ...(agent.result && { result: agent.result }),
        ...(agent.error && { error: agent.error }),
      };

      if (verbose && agent.metadata) {
        return {
          ...basicInfo,
          metadata: agent.metadata,
        };
      }

      return basicInfo;
    });

    // Return the list of agents
    return buildContentResponse({ agents: formattedAgents });
  } catch (error) {
    return buildContentResponse({
      error: error instanceof Error ? error.message : `Unknown error occurred: ${String(error)}`,
    });
  }
};

// For backward compatibility
export const listAgentsTool = {
  schema: parameterSchema,
  handler: listAgentsExecute,
};