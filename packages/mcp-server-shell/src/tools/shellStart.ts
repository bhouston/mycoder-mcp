import { spawn } from 'child_process';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { errorToString } from '../lib/errorToString.js';
import { ShellStatus, shellTracker } from './ShellTracker.js';

import type { ProcessState } from './ShellTracker.js';

// Define the parameter schema for the shellStart tool
export const shellStartParameters = {
  command: z.string().describe('The shell command to execute'),
  description: z.string().describe('The reason this shell command is being run (max 80 chars)'),
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
};

// Define the parameter schema using z.object
export const parameterSchema = z.object(shellStartParameters);

// Define the return schema for the shellStart tool
const returnSchema = z.object({
  instanceId: z.string().describe('The ID of the shell process'),
  mode: z.enum(['sync', 'async']).describe('Whether the command ran in sync or async mode'),
  stdout: z.string().optional().describe('The standard output of the command (for sync mode)'),
  stderr: z.string().optional().describe('The standard error of the command (for sync mode)'),
  exitCode: z.number().optional().describe('The exit code of the command (for sync mode)'),
  error: z.string().optional().describe('Error message if the command failed to start'),
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
    ...('error' in result && !('mode' in result) && { isError: true }),
  };
};

// Maximum buffer size for sync mode
const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Execute a shell command
 */
export async function shellStartExecute(
  parameters: Parameters,
  extra: any,
): Promise<ContentResponse> {
  const { command, timeout = 10000, showStdIn = false, showStdout = false } = parameters;
  const logger = extra.logger || console;

  try {
    logger.verbose(`Starting shell command: ${command}`);

    const instanceId = uuidv4();
    let stdout = '';
    let stderr = '';
    let processState: ProcessState;

    // Try to run in sync mode first with a timeout
    const syncPromise = new Promise<{
      mode: 'sync';
      stdout: string;
      stderr: string;
      exitCode: number;
    }>((resolve, reject) => {
      try {
        // Start the process
        const childProcess = spawn(command, {
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdoutBuffer = Buffer.alloc(0);
        let stderrBuffer = Buffer.alloc(0);
        let bufferOverflow = false;

        // Handle stdout
        childProcess.stdout?.on('data', (data) => {
          if (showStdout) {
            process.stdout.write(data);
          }
          
          if (stdoutBuffer.length + data.length <= MAX_BUFFER_SIZE) {
            stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
          } else {
            bufferOverflow = true;
          }
        });

        // Handle stderr
        childProcess.stderr?.on('data', (data) => {
          if (showStdout) {
            process.stderr.write(data);
          }
          
          if (stderrBuffer.length + data.length <= MAX_BUFFER_SIZE) {
            stderrBuffer = Buffer.concat([stderrBuffer, data]);
          } else {
            bufferOverflow = true;
          }
        });

        // Handle errors
        childProcess.on('error', (error) => {
          reject(error);
        });

        // Handle process exit
        childProcess.on('close', (code, signal) => {
          if (bufferOverflow) {
            reject(new Error('Command output exceeded maximum buffer size, switching to async mode'));
            return;
          }

          stdout = stdoutBuffer.toString();
          stderr = stderrBuffer.toString();

          if (code === 0 || code === null) {
            resolve({
              mode: 'sync',
              stdout,
              stderr,
              exitCode: code || 0,
            });
          } else {
            resolve({
              mode: 'sync',
              stdout,
              stderr,
              exitCode: code,
            });
          }
        });

        // Store the process state
        processState = {
          process: childProcess,
          command,
          stdout: [],
          stderr: [],
          state: {
            completed: false,
            signaled: false,
            exitCode: undefined
          },
          showStdIn,
          showStdout,
        };

        // Register with the tracker
        shellTracker.registerShell(command);
        shellTracker.processStates.set(instanceId, processState);
      } catch (error) {
        reject(error);
      }
    });

    // Set up a timeout to switch to async mode if needed
    const timeoutPromise = new Promise<{
      mode: 'async';
      instanceId: string;
    }>((resolve) => {
      setTimeout(() => {
        resolve({
          mode: 'async',
          instanceId,
        });
      }, timeout);
    });

    // Race between sync completion and timeout
    try {
      const result = await Promise.race([syncPromise, timeoutPromise]);

      if (result.mode === 'sync') {
        // Command completed in sync mode
        shellTracker.updateShellStatus(
          instanceId,
          result.exitCode === 0 ? ShellStatus.COMPLETED : ShellStatus.ERROR,
          {
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
          },
        );

        return buildContentResponse({
          instanceId,
          mode: 'sync',
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        });
      } else {
        // Command is still running, switch to async mode
        logger.verbose(`Command taking longer than ${timeout}ms, switching to async mode`);

        return buildContentResponse({
          instanceId,
          mode: 'async',
        });
      }
    } catch (error) {
      // If sync mode failed due to buffer overflow or other reason, switch to async
      logger.verbose(`Switching to async mode: ${errorToString(error)}`);

      return buildContentResponse({
        instanceId,
        mode: 'async',
      });
    }
  } catch (error) {
    logger.error(`Error starting shell command: ${errorToString(error)}`);
    
    return buildContentResponse({
      error: errorToString(error),
    });
  }
}