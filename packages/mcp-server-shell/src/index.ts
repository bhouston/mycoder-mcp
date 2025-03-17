#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getPackageJson } from './lib/getPackageInfo.js';
import { parameterSchema as shellStartParams, shellStartExecute } from './tools/shellStart.js';
import {
  parameterSchema as shellMessageParams,
  shellMessageExecute,
} from './tools/shellMessage.js';
import { parameterSchema as listShellsParams, listShellsExecute } from './tools/listShells.js';
import { shellTracker } from './tools/ShellTracker.js';

// Create server instance with package information
const packageJson = getPackageJson();
const server = new McpServer({
  name: packageJson.name!,
  version: packageJson.version!,
});

// Register the shellStart tool
server.tool(
  'shellStart',
  'Starts a shell command with fast sync mode (default 100ms timeout) that falls back to async mode for longer-running commands',
  shellStartParams,
  shellStartExecute,
);

// Register the shellMessage tool
server.tool(
  'shellMessage',
  'Interacts with a running shell process, sending input and receiving output',
  shellMessageParams,
  shellMessageExecute,
);

// Register the listShells tool
server.tool(
  'listBackgroundTools',
  'Lists all background tools (shells, browsers, agents) and their status',
  listShellsParams,
  listShellsExecute,
);

async function main() {
  console.error(`Starting ${packageJson.name} MCP Server v${packageJson.version}...`);

  try {
    console.error('Initializing StdioServerTransport...');
    const transport = new StdioServerTransport();

    console.error('Connecting server to transport...');
    await server.connect(transport);

    console.error(`${packageJson.name} MCP Server v${packageJson.version} running on stdio`);
    console.error('Server ready to accept commands');

    // Setup cleanup on exit
    process.on('exit', async () => {
      await shellTracker.cleanupAllShells();
    });

    process.on('SIGINT', async () => {
      console.error('Received SIGINT, cleaning up shells...');
      await shellTracker.cleanupAllShells();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Received SIGTERM, cleaning up shells...');
      await shellTracker.cleanupAllShells();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during server startup:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
