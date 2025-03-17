import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { agentStates, agentTracker } from '../lib/agentState.js';
import { AgentStatus } from '../lib/AgentTracker.js';

// Define the parameter schema for the agentStart tool
export const agentStartParameters = {
  description: z.string().describe("A brief description of the agent's purpose (max 80 chars)"),
  goal: z.string().describe('The main objective that the agent needs to achieve'),
  projectContext: z.string().describe('Context about the problem or environment'),
  workingDirectory: z.string().optional().describe('The directory where the agent should operate'),
  relevantFilesDirectories: z
    .string()
    .optional()
    .describe('A list of files, which may include ** or * wildcard characters'),
};

// Define the parameter schema using z.object
const parameterSchema = z.object(agentStartParameters);

// Define the return schema for the agentStart tool
const returnSchema = z.object({
  instanceId: z.string().describe('The ID of the started agent process'),
  status: z.string().describe('The initial status of the agent'),
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
    ...(('error' in result) && { isError: true }),
  };
};

// Export the handler function
export const agentStartExecute = async (parameters: Parameters): Promise<ContentResponse> => {
  try {
    // Validate parameters
    const { description, goal, projectContext, workingDirectory, relevantFilesDirectories } =
      parameters;

    // Create an instance ID
    const instanceId = uuidv4();

    // Register this agent with the tracker
    agentTracker.registerAgent(goal, { description });

    // Construct a well-structured prompt
    const prompt = [
      `Description: ${description}`,
      `Goal: ${goal}`,
      `Project Context: ${projectContext}`,
      workingDirectory ? `Working Directory: ${workingDirectory}` : '',
      relevantFilesDirectories ? `Relevant Files:\n  ${relevantFilesDirectories}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Store the agent state
    const agentState = {
      goal,
      prompt,
      output: '',
      completed: false,
      workingDirectory: workingDirectory ?? process.cwd(),
      aborted: false,
      metadata: {
        description,
        projectContext,
        relevantFilesDirectories,
      },
    };

    agentStates.set(instanceId, agentState);

    // Start the agent in a separate promise that we don't await
    Promise.resolve().then(async () => {
      try {
        // TODO: Implement actual agent execution
        // For now, we'll just simulate a successful agent execution
        setTimeout(() => {
          const state = agentStates.get(instanceId);
          if (state && !state.aborted) {
            state.completed = true;
            state.result = 'Task completed successfully';
            state.output = 'Task completed successfully';

            // Update agent tracker with completed status
            agentTracker.updateAgentStatus(instanceId, AgentStatus.COMPLETED, {
              result: 'Task completed successfully',
            });
          }
        }, 5000); // Simulate 5 seconds of work
      } catch (error) {
        // Update agent state with the error
        const state = agentStates.get(instanceId);
        if (state && !state.aborted) {
          state.completed = true;
          state.error = error instanceof Error ? error.message : String(error);

          // Update agent tracker with error status
          agentTracker.updateAgentStatus(instanceId, AgentStatus.ERROR, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    // Return the instance ID and status
    return buildContentResponse({
      instanceId,
      status: 'Agent started successfully',
    });
  } catch (error) {
    return buildContentResponse({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// For backward compatibility
export const agentStartTool = {
  schema: agentStartParameters,
  handler: agentStartExecute,
};