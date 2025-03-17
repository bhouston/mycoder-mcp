import { z } from 'zod';
import consola from 'consola';
import { createInterface } from 'node:readline/promises';

// Define the parameter schema for the clarificationPrompt tool
export const clarificationPromptParameters = {
  prompt: z.string().describe('The prompt message to display to the user'),
};

// Define the parameter schema using z.object
const parameterSchema = z.object(clarificationPromptParameters);

// Define the return schema for the clarificationPrompt tool
const returnSchema = z.object({
  userText: z.string().describe('The text response provided by the user'),
  error: z.string().optional().describe('Error message if prompting the user failed'),
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
const buildContentResponse = (result: ReturnType): ContentResponse => {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
    ...('error' in result && result.error && { isError: true }),
  };
};

/**
 * Helper function to prompt the user for input
 * @param prompt - The prompt to display to the user
 * @returns The user's response
 */
async function promptUser(prompt: string): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const response = await readline.question(`\n${prompt}\n> `);
    return response;
  } finally {
    readline.close();
  }
}

// Export the handler function
export const clarificationPromptExecute = async (parameters: Parameters): Promise<ContentResponse> => {
  const { prompt } = parameters;
  const logger = consola.create({ level: 3 });

  logger.debug(`Prompting user with: ${prompt}`);

  try {
    const response = await promptUser(prompt);
    logger.debug(`Received user response: ${response}`);
    return buildContentResponse({ userText: response });
  } catch (error) {
    logger.error('Error prompting user:', error);
    return buildContentResponse({
      userText: 'Error getting user input',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// For backward compatibility
export const clarificationPromptTool = {
  schema: parameterSchema,
  handler: clarificationPromptExecute,
};