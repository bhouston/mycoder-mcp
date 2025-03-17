import { z } from 'zod';
import consola from 'consola';
import { createInterface } from 'node:readline/promises';

// Define the parameter schema for the clarificationPrompt tool
const parameterSchema = z.object({
  prompt: z.string().describe('The prompt message to display to the user'),
});

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

// Export the clarificationPrompt tool schema and handler
export const clarificationPromptTool = {
  schema: parameterSchema,
  handler: async (params: z.infer<typeof parameterSchema>) => {
    const { prompt } = params;
    const logger = consola.create({ level: 3 });

    logger.debug(`Prompting user with: ${prompt}`);

    try {
      const response = await promptUser(prompt);
      
      logger.debug(`Received user response: ${response}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ userText: response }),
          },
        ],
      };
    } catch (error) {
      logger.error('Error prompting user:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              userText: 'Error getting user input',
              error: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
        isError: true,
      };
    }
  },
};