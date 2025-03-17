import { z } from 'zod';

// Define the parameter schema for the agentDone tool
export const agentDoneParameters = {
  result: z.string().describe('The final result to return from the tool agent'),
};

// Define the parameter schema using z.object
const parameterSchema = z.object(agentDoneParameters);

// Define the return schema for the agentDone tool
const returnSchema = z.object({
  result: z.string().describe('The final result returned from the agent'),
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
export const agentDoneExecute = async (parameters: Parameters): Promise<ContentResponse> => {
  try {
    const { result } = parameters;
    
    // Simply return the result
    return buildContentResponse({ result });
  } catch (error) {
    return buildContentResponse({
      error: error instanceof Error ? error.message : `Unknown error occurred: ${String(error)}`,
    });
  }
};

// For backward compatibility
export const agentDoneTool = {
  schema: parameterSchema,
  handler: agentDoneExecute,
};