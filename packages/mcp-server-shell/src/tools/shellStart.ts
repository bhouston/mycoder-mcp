import { spawn } from 'child_process';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { errorToString } from '../lib/errorToString.js';
import { ShellStatus, shellTracker } from './ShellTracker.js';

import type { ProcessState } from './ShellTracker.js';

export const parameterSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  description: z
    .string()
    .describe('The reason this shell command is being run (max 80 chars)'),
  timeout: z
    .number()
    .optional()
    .describe(
      'Timeout in ms before switching to async mode (default: 10s, which usually is sufficient)',
    ),
  showStdIn: z
    .boolean()
    .optional()
    .describe(
      'Whether to show the command input to the user, or keep the output clean (default: false)',
    ),
  showStdout: z
    .boolean()
    .optional()
    .describe(
      'Whether to show command output to the user, or keep the output clean (default: false)',
    ),
});

export const returnSchema = z.union([
  z
    .object({
      mode: z.literal('sync'),
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
      error: z.string().optional(),
    })
    .describe(
      'Synchronous execution results when command completes within timeout',
    ),
  z
    .object({
      mode: z.literal('async'),
      instanceId: z.string(),
      stdout: z.string(),
      stderr: z.string(),
      error: z.string().optional(),
    })
    .describe('Asynchronous execution results when command exceeds timeout'),
]);

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

const DEFAULT_TIMEOUT = 1000 * 10; // 10 seconds

export const shellStartExecute = async (
  {
    command,
    timeout = DEFAULT_TIMEOUT,
    showStdIn = false,
    showStdout = false,
  }: Parameters,
): Promise<{ content: { type: 'text'; text: string }[] }> => {
  console.error(`Starting shell command: ${command}`);
  
  if (showStdIn) {
    console.error(`Command input: ${command}`);
  }

  try {
    const result = await executeShellCommand(command, {
      timeout,
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
    console.error(`Error executing shell command: ${errorToString(error)}`);
    
    // Return error result
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            mode: 'sync',
            stdout: '',
            stderr: '',
            exitCode: 1,
            error: errorToString(error),
          }),
        },
      ],
    };
  }
};

async function executeShellCommand(
  command: string,
  options: {
    timeout: number;
    showStdIn: boolean;
    showStdout: boolean;
  },
): Promise<ReturnType> {
  return new Promise((resolve) => {
    try {
      // Generate a unique ID for this process
      const instanceId = uuidv4();

      // Register this shell process with the shell tracker
      shellTracker.registerShell(command);

      let hasResolved = false;

      // Use shell option instead of explicit shell path to avoid platform-specific issues
      const process = spawn(command, [], {
        shell: true,
        cwd: process.cwd(),
      });

      const processState: ProcessState = {
        command,
        process,
        stdout: [],
        stderr: [],
        state: { completed: false, signaled: false, exitCode: null },
        showStdIn: options.showStdIn,
        showStdout: options.showStdout,
      };

      // Initialize process state
      shellTracker.processStates.set(instanceId, processState);

      // Handle process events
      if (process.stdout)
        process.stdout.on('data', (data) => {
          const output = data.toString();
          processState.stdout.push(output);
          if (processState.showStdout) {
            console.error(`[${instanceId}] stdout: ${output.trim()}`);
          }
        });

      if (process.stderr)
        process.stderr.on('data', (data) => {
          const output = data.toString();
          processState.stderr.push(output);
          if (processState.showStdout) {
            console.error(`[${instanceId}] stderr: ${output.trim()}`);
          }
        });

      process.on('error', (error) => {
        console.error(`[${instanceId}] Process error: ${error.message}`);
        processState.state.completed = true;

        // Update shell tracker with error status
        shellTracker.updateShellStatus(instanceId, ShellStatus.ERROR, {
          error: error.message,
        });

        if (!hasResolved) {
          hasResolved = true;
          resolve({
            mode: 'async',
            instanceId,
            stdout: processState.stdout.join('').trim(),
            stderr: processState.stderr.join('').trim(),
            error: error.message,
          });
        }
      });

      process.on('exit', (code, signal) => {
        console.error(
          `[${instanceId}] Process exited with code ${code} and signal ${signal}`,
        );

        processState.state.completed = true;
        processState.state.signaled = signal !== null;
        processState.state.exitCode = code;

        // Update shell tracker with completed status
        const status = code === 0 ? ShellStatus.COMPLETED : ShellStatus.ERROR;
        shellTracker.updateShellStatus(instanceId, status, {
          exitCode: code,
          signaled: signal !== null,
        });

        // For test environment with timeout=0, we should still return sync results
        // when the process completes quickly
        if (!hasResolved) {
          hasResolved = true;
          // If we haven't resolved yet, this happened within the timeout
          // so return sync results
          resolve({
            mode: 'sync',
            stdout: processState.stdout.join('').trim(),
            stderr: processState.stderr.join('').trim(),
            exitCode: code ?? 1,
            ...(code !== 0 && {
              error: `Process exited with code ${code}${signal ? ` and signal ${signal}` : ''}`,
            }),
          });
        }
      });

      // For test environment, when timeout is explicitly set to 0, we want to force async mode
      if (options.timeout === 0) {
        // Force async mode immediately
        hasResolved = true;
        resolve({
          mode: 'async',
          instanceId,
          stdout: processState.stdout.join('').trim(),
          stderr: processState.stderr.join('').trim(),
        });
      } else {
        // Set timeout to switch to async mode after the specified timeout
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              mode: 'async',
              instanceId,
              stdout: processState.stdout.join('').trim(),
              stderr: processState.stderr.join('').trim(),
            });
          }
        }, options.timeout);
      }
    } catch (error) {
      console.error(`Failed to start process: ${errorToString(error)}`);
      resolve({
        mode: 'sync',
        stdout: '',
        stderr: '',
        exitCode: 1,
        error: errorToString(error),
      });
    }
  });
}