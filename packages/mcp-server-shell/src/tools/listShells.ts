import { z } from 'zod';

import { ShellStatus, shellTracker } from './ShellTracker.js';

export const parameterSchema = z.object({
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
});

export const returnSchema = z.object({
  shells: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['running', 'completed', 'error', 'terminated']),
      command: z.string(),
      startTime: z.string(),
      endTime: z.string().optional(),
      exitCode: z.number().nullable().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  ),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const listShellsExecute = async ({
  status = 'all',
  verbose = false,
}: Parameters): Promise<{ content: { type: 'text'; text: string }[] }> => {
  try {
    // Get shells based on status filter
    let shells = shellTracker.getShells();

    if (status !== 'all') {
      shells = shells.filter((shell) => shell.status === status);
    }

    // Map shells to the return format
    const result: ReturnType = {
      shells: shells.map((shell) => ({
        id: shell.id,
        status: shell.status,
        command: shell.metadata.command,
        startTime: shell.startTime.toISOString(),
        ...(shell.endTime && { endTime: shell.endTime.toISOString() }),
        ...(shell.metadata.exitCode !== undefined && {
          exitCode: shell.metadata.exitCode,
        }),
        ...(verbose && { metadata: shell.metadata }),
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    console.error(
      `Error listing shells: ${error instanceof Error ? error.message : String(error)}`,
    );

    // Return empty result on error
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ shells: [] }),
        },
      ],
    };
  }
};
