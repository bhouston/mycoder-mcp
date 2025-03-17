import { z } from 'zod';

import { agentStates, agentTracker } from '../lib/agentState.js';
import { AgentStatus } from '../lib/AgentTracker.js';

// Define the parameter schema for the agentMessage tool
export const agentMessageParameters = {
  instanceId: z.string().describe('The ID returned by agentStart'),
  guidance: z
    .string()
    .optional()
    .describe('Optional guidance or instructions to send to the agent'),
  terminate: z.boolean().optional().describe('Whether to terminate the agent (default: false)'),
  description: z.string().describe('The reason for this agent interaction (max 80 chars)'),
};

// Define the parameter schema using z.object
const parameterSchema = z.object(agentMessageParameters);

// Define the return schema for the agentMessage tool
const returnSchema = z.object({
  output: z.string().describe('The current output from the agent'),
  completed: z.boolean().describe('Whether the agent has completed its task'),
  error: z.string().optional().describe('Error message if the agent encountered an error'),
  terminated: z.boolean().optional().describe('Whether the agent was terminated by this message'),
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
export const agentMessageExecute = async (parameters: Parameters): Promise<ContentResponse> => {
  try {
    const { instanceId, guidance, terminate } = parameters;

    const agentState = agentStates.get(instanceId);
    if (!agentState) {
      throw new Error(`No agent found with ID ${instanceId}`);
    }

    // Check if the agent was already terminated
    if (agentState.aborted) {
      return buildContentResponse({
        output: agentState.output || 'Agent was previously terminated',
        completed: true,
        terminated: true,
      });
    }

    // Terminate the agent if requested
    if (terminate) {
      agentState.aborted = true;
      agentState.completed = true;

      // Update agent tracker with terminated status
      agentTracker.updateAgentStatus(instanceId, AgentStatus.TERMINATED, {
        metadata: { terminatedByUser: true },
      });

      return buildContentResponse({
        output: agentState.output || 'Agent terminated before completion',
        completed: true,
        terminated: true,
      });
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
    return buildContentResponse({
      output,
      completed: agentState.completed,
      ...(agentState.error && { error: agentState.error }),
    });
  } catch (error) {
    return buildContentResponse({
      output: '',
      completed: false,
      error: error instanceof Error ? error.message : `Unknown error occurred: ${String(error)}`,
    });
  }
};

// For backward compatibility
export const agentMessageTool = {
  schema: parameterSchema,
  handler: agentMessageExecute,
};