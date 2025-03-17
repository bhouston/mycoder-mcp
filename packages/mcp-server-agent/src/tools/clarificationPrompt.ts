import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { clarificationPrompt } from '../../utils/clarificationPrompt.js';

const parameterSchema = z.object({
  prompt: z.string().describe('The prompt message to display to the user'),
});

const returnSchema = z.object({
  userText: z.string().describe("The user's response"),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const clarificationPromptTool: Tool<Parameters, ReturnType> = {
  name: 'clarificationPrompt',
  description: 'Prompts the user for input and returns their response',
  logPrefix: '🗣️',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async ({ prompt }, { logger }) => {
    logger.verbose(`Prompting user with: ${prompt}`);

    const response = await clarificationPrompt(prompt);

    logger.verbose(`Received user response: ${response}`);

    return { userText: response };
  },
  logParameters: () => {},
  logReturns: () => {},
};
