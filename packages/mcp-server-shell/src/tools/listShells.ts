import { z } from 'zod';

import { errorToString } from '../lib/errorToString.js';
import { ShellStatus, shellTracker } from './ShellTracker.js';

// Define the parameter schema for the listShells tool
export const listShellsParameters = {
  status: z
    .enum(['all', 'running', 'completed', 'error', 'terminated'])
    .optional()
    .default('all')
    .describe('Filter tools by status (default: "all")'),
  verbose: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include detailed metadata about each tool (default: false)'),
};

// Define the parameter schema using z.object
export const parameterSchema = z.object(listShellsParameters);

// Define a schema for shell info
const shellInfoSchema = z.object({
  id: z.string(),
  command: z.string(),
  status: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  exitCode: z.number().optional(),
  description: z.string(),
});

// Define the return schema for the listShells tool
const returnSchema = z.object({
  shells: z.array(shellInfoSchema),
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

// Map internal shell status to the external API status
const mapStatus = (status: ShellStatus): 'running' | 'completed' | 'error' | 'terminated' => {
  switch (status) {
    case ShellStatus.RUNNING:
      return 'running';
    case ShellStatus.COMPLETED:
      return 'completed';
    case ShellStatus.ERROR:
      return 'error';
    case ShellStatus.TERMINATED:
      return 'terminated';
    default:
      return 'error';
  }
};

/**
 * List all shell processes
 */
export async function listShellsExecute(
  parameters: Parameters,
  extra: any,
): Promise<ContentResponse> {
  const { status = 'all', verbose = false } = parameters;
  const logger = extra.logger || console;

  try {
    logger.verbose(`Listing shells with status: ${status}, verbose: ${verbose}`);

    // Get all shells
    const allShells = shellTracker.getShells();

    // Filter by status if needed
    const filteredShells = status === 'all'
      ? allShells
      : allShells.filter((shell) => mapStatus(shell.status) === status);

    // Format the shells for output
    const formattedShells = filteredShells.map((shell) => {
      const result: any = {
        id: shell.id,
        command: shell.command || shell.metadata.command,
        status: mapStatus(shell.status),
        startTime: shell.startTime.toISOString(),
        description: shell.description || shell.metadata.command,
      };
      
      if (shell.endTime) {
        result.endTime = shell.endTime.toISOString();
      }
      
      if (shell.exitCode !== undefined) {
        result.exitCode = shell.exitCode;
      }
      
      if (verbose) {
        if (shell.showStdIn !== undefined) {
          result.showStdIn = shell.showStdIn;
        }
        if (shell.showStdout !== undefined) {
          result.showStdout = shell.showStdout;
        }
      }
      
      return result;
    });

    // Return the list of shells
    return buildContentResponse({
      shells: formattedShells,
    });
  } catch (error) {
    logger.error(`Error listing shells: ${errorToString(error)}`);
    
    return buildContentResponse({
      error: errorToString(error),
    });
  }
}