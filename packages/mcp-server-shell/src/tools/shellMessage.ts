import { z } from 'zod';

import { errorToString } from '../lib/errorToString.js';
import { ShellStatus, shellTracker } from './ShellTracker.js';

export const parameterSchema = z.object({
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
});

export const returnSchema = z.object({
  success: z.boolean(),
  status: z.enum(['running', 'completed', 'error', 'terminated']),
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().nullable(),
  message: z.string(),
  error: z.string().optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const shellMessageExecute = async ({
  instanceId,
  stdin,
  signal,
  showStdIn,
  showStdout,
}: Parameters): Promise<{ content: { type: 'text'; text: string }[] }> => {
  try {
    const result = await interactWithShell(instanceId, {
      stdin,
      signal,
      showStdIn,
      showStdout,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    console.error(`Error interacting with shell: ${errorToString(error)}`);

    // Return error result
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            status: 'error',
            stdout: '',
            stderr: '',
            exitCode: null,
            message: errorToString(error),
            error: errorToString(error),
          }),
        },
      ],
    };
  }
};

async function interactWithShell(
  instanceId: string,
  options: {
    stdin?: string;
    signal?: string;
    showStdIn?: boolean;
    showStdout?: boolean;
  },
): Promise<ReturnType> {
  // Get the shell process
  const shell = shellTracker.getShellById(instanceId);
  if (!shell) {
    throw new Error(`Shell process with ID ${instanceId} not found`);
  }

  // Get the process state
  const processState = shellTracker.processStates.get(instanceId);
  if (!processState) {
    throw new Error(`Process state for shell ${instanceId} not found`);
  }

  // Apply showStdIn and showStdout from options if provided
  if (options.showStdIn !== undefined) {
    processState.showStdIn = options.showStdIn;
  }

  if (options.showStdout !== undefined) {
    processState.showStdout = options.showStdout;
  }

  // Send input to the process if provided
  if (options.stdin) {
    if (processState.showStdIn) {
      console.error(`[${instanceId}] stdin: ${options.stdin}`);
    }

    if (processState.state.completed) {
      throw new Error(`Cannot send input to completed process`);
    }

    try {
      processState.process.stdin?.write(options.stdin);

      // Add a newline if not present
      if (!options.stdin.endsWith('\n')) {
        processState.process.stdin?.write('\n');
      }
    } catch (error) {
      throw new Error(`Failed to send input to process: ${errorToString(error)}`);
    }
  }

  // Send signal to the process if provided
  if (options.signal) {
    if (processState.state.completed) {
      throw new Error(`Cannot send signal to completed process`);
    }

    try {
      processState.process.kill(options.signal);
      console.error(`[${instanceId}] Sent signal ${options.signal} to process`);

      if (options.signal === 'SIGKILL' || options.signal === 'SIGTERM') {
        shellTracker.updateShellStatus(instanceId, ShellStatus.TERMINATED);
      }
    } catch (error) {
      throw new Error(`Failed to send signal to process: ${errorToString(error)}`);
    }
  }

  // Wait a short time for any new output or signals to be processed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Get the latest status
  const updatedShell = shellTracker.getShellById(instanceId);
  if (!updatedShell) {
    throw new Error(`Shell process with ID ${instanceId} not found after operation`);
  }

  // Return the current state
  return {
    success: true,
    status: updatedShell.status,
    stdout: processState.stdout.join('').trim(),
    stderr: processState.stderr.join('').trim(),
    exitCode: processState.state.exitCode,
    message: `Shell process ${instanceId} status: ${updatedShell.status}`,
    ...(updatedShell.metadata.error && { error: updatedShell.metadata.error }),
  };
}
