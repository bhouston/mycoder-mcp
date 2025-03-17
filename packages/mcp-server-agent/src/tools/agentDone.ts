import { z } from 'zod';

// Define the parameter schema for the agentDone tool
const parameterSchema = z.object({
  result: z.string().describe('The final result to return from the tool agent'),
});

// Export the agentDone tool schema and handler
export const agentDoneTool = {
  schema: parameterSchema,
  handler: async (params: z.infer<typeof parameterSchema>) => {
    const { result } = params;

    // Simply return the result
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ result }),
        },
      ],
    };
  },
};