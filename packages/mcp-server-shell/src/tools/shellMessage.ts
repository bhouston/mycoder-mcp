import { z } from 'zod';

import { errorToString } from '../lib/errorToString.js';
import { ShellStatus, shellTracker } from './ShellTracker.js';

// Define the parameter schema for the shellMessage tool
export const shellMessageParameters = {
  instanceId: z.string().describe('The ID returned by shellStart'),
  description: z.string().describe('The reason for this shell interaction (max 80 chars)'),
  stdin: z.string().optional().describe('Input to send to process'),
  signal: z
    .enum([
      'SIGABRT',
      'SIGALRM',
      'SIGBUS',
      'SIGCHLD',
      'SIGCONT',
      'SIGFPE',
      'SIGHUP',
      'SIGILL',
      'SIGINT',
      'SIGIO',
      'SIGIOT',
      'SIGKILL',
      'SIGPIPE',
      'SIGPOLL',
      'SIGPROF',
      'SIGPWR',
      'SIGQUIT',
      'SIGSEGV',
      'SIGSTKFLT',
      'SIGSTOP',
      'SIGSYS',
      'SIGTERM',
      'SIGTRAP',
      'SIGTSTP',
      'SIGTTIN',
      'SIGTTOU',
      'SIGUNUSED',
      'SIGURG',
      'SIGUSR1',
      'SIGUSR2',
      'SIGVTALRM',
      'SIGWINCH',
      'SIGXCPU',
      'SIGXFSZ',
    ])
    .optional()
    .describe('Signal to send to the process (e.g., SIGTERM, SIGINT)'),
  showStdIn: z
    .boolean()
    .optional()
    .describe(
      'Whether to show the input to the user, or keep the output clean (default: false or value from shellStart)',
    ),
  showStdout: z
    .boolean()
    .optional()
    .describe(
      'Whether to show output to the user, or keep the output clean (default: false or value from shellStart)',
    ),
};

// Define the parameter schema using z.object
export const parameterSchema = z.object(shellMessageParameters);

// Define the return schema for the shellMessage tool
const returnSchema = z.object({
  stdout: z.string().describe('The standard output since the last check'),
  stderr: z.string().describe('The standard error since the last check'),
  status: z.enum(['running', 'completed', 'error', 'terminated']).describe('Current status of the shell process'),
  exitCode: z.number().optional().describe('Exit code if the process has completed'),
  error: z.string().optional().describe('Error message if something went wrong'),
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
    ...('error' in result && !('status' in result) && { isError: true }),
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
 * Interact with a running shell process
 */
export async function shellMessageExecute(
  parameters: Parameters,
  extra: any,
): Promise<ContentResponse> {
  const { instanceId, stdin, signal, showStdIn, showStdout } = parameters;
  const logger = extra.logger || console;

  try {
    logger.verbose(`Shell message for instance ${instanceId}`);

    // Get the shell state
    const shellState = shellTracker.getShellById(instanceId);
    if (!shellState) {
      throw new Error(`No shell found with ID ${instanceId}`);
    }

    // Handle sending a signal
    if (signal) {
      logger.verbose(`Sending signal ${signal} to process`);
      try {
        shellState.process.kill(signal);
        return buildContentResponse({
          stdout: '',
          stderr: '',
          status: mapStatus(shellState.status),
          ...(shellState.exitCode && { exitCode: shellState.exitCode }),
        });
      } catch (error) {
        logger.error(`Error sending signal: ${errorToString(error)}`);
        return buildContentResponse({
          stdout: '',
          stderr: '',
          status: mapStatus(shellState.status),
          error: `Failed to send signal: ${errorToString(error)}`,
          ...(shellState.exitCode && { exitCode: shellState.exitCode }),
        });
      }
    }

    // Send input if provided
    if (stdin) {
      if (shellState.status !== ShellStatus.RUNNING) {
        return buildContentResponse({
          stdout: '',
          stderr: '',
          status: mapStatus(shellState.status),
          error: 'Cannot send input to a process that is not running',
          ...(shellState.exitCode && { exitCode: shellState.exitCode }),
        });
      }

      // Send the input
      const actualShowStdIn = showStdIn !== undefined ? showStdIn : shellState.showStdIn;
      if (actualShowStdIn) {
        process.stdout.write(stdin);
      }

      try {
        shellState.process.stdin?.write(stdin);
      } catch (error) {
        logger.error(`Error sending input: ${errorToString(error)}`);
        return buildContentResponse({
          stdout: '',
          stderr: '',
          status: mapStatus(shellState.status),
          error: `Failed to send input: ${errorToString(error)}`,
          ...(shellState.exitCode && { exitCode: shellState.exitCode }),
        });
      }
    }

    // Get the current output
    const stdout = shellState.stdout || '';
    const stderr = shellState.stderr || '';

    // Clear the output buffers
    shellState.stdout = '';
    shellState.stderr = '';

    // Return the current state
    return buildContentResponse({
      stdout,
      stderr,
      status: mapStatus(shellState.status),
      ...(shellState.exitCode && { exitCode: shellState.exitCode }),
    });
  } catch (error) {
    logger.error(`Error in shellMessage: ${errorToString(error)}`);
    
    return buildContentResponse({
      error: errorToString(error),
    });
  }
}