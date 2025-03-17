import { z } from 'zod';

import { AgentStatus } from '../lib/AgentTracker';
import { agentTracker } from '../lib/agentState';

// Define the parameter schema for the listAgents tool
const parameterSchema = z.object({
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .describe('Filter agents by status (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .describe('Include detailed metadata about each agent (default: false)'),
});

// Export the listAgents tool schema and handler
export const listAgentsTool = {
  schema: parameterSchema,
  handler: async (params: z.infer<typeof parameterSchema>) => {
    const { status = 'all', verbose = false } = params;

    // Get the agents with the specified status
    let agents = agentTracker.listAgents();
    
    if (status !== 'all') {
      const statusMap = {
        running: AgentStatus.RUNNING,
        completed: AgentStatus.COMPLETED,
        error: AgentStatus.ERROR,
        terminated: AgentStatus.TERMINATED,
      };
      
      agents = agents.filter(agent => agent.status === statusMap[status as keyof typeof statusMap]);
    }

    // Format the agents for output
    const formattedAgents = agents.map(agent => {
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
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ agents: formattedAgents }),
        },
      ],
    };
  },
};