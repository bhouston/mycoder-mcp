import { z } from 'zod';

import { agentStates, agentTracker } from '../lib/agentState.js';
import { AgentStatus } from '../lib/AgentTracker.js';

// Define the parameter schema for the agentMessage tool
const parameterSchema = z.object({
  instanceId: z.string().describe('The ID returned by agentStart'),
  guidance: z
    .string()
    .optional()
    .describe('Optional guidance or instructions to send to the agent'),
  terminate: z.boolean().optional().describe('Whether to terminate the agent (default: false)'),
  description: z.string().describe('The reason for this agent interaction (max 80 chars)'),
});

// Define the return schema for the agentMessage tool
const returnSchema = z.object({
  output: z.string().describe('The current output from the agent'),
  completed: z.boolean().describe('Whether the agent has completed its task'),
  error: z.string().optional().describe('Error message if the agent encountered an error'),
  terminated: z.boolean().optional().describe('Whether the agent was terminated by this message'),
});

// Export the agentMessage tool schema and handler
export const agentMessageTool = {
  schema: parameterSchema,
  handler: async (params: z.infer<typeof parameterSchema>) => {
    const { instanceId, guidance, terminate } = params;

    try {
      const agentState = agentStates.get(instanceId);
      if (!agentState) {
        throw new Error(`No agent found with ID ${instanceId}`);
      }

      // Check if the agent was already terminated
      if (agentState.aborted) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                output: agentState.output || 'Agent was previously terminated',
                completed: true,
                terminated: true,
              }),
            },
          ],
        };
      }

      // Terminate the agent if requested
      if (terminate) {
        agentState.aborted = true;
        agentState.completed = true;

        // Update agent tracker with terminated status
        agentTracker.updateAgentStatus(instanceId, AgentStatus.TERMINATED, {
          metadata: { terminatedByUser: true },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                output: agentState.output || 'Agent terminated before completion',
                completed: true,
                terminated: true,
              }),
            },
          ],
        };
      }

      // Add guidance to the agent state for future implementation
      if (guidance) {
        // This is a placeholder for future implementation
        // In a real implementation, we would need to interrupt the agent's
        // execution and inject this guidance
        agentState.metadata = {
          ...agentState.metadata,
          guidance: [...(agentState.metadata?.guidance || []), guidance],
        };
      }

      // Get the current output
      const output = agentState.result || agentState.output || 'No output yet';

      // Return the current state
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              output,
              completed: agentState.completed,
              ...(agentState.error && { error: agentState.error }),
            }),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                output: '',
                completed: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        };
      }

      const errorMessage = String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              output: '',
              completed: false,
              error: `Unknown error occurred: ${errorMessage}`,
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
