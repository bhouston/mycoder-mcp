#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getPackageJson } from './lib/getPackageInfo.js';
import { parameterSchema, fetchExecute, logParameters, logReturns } from './tools/fetch.js';

// Create server instance with package information
const packageJson = getPackageJson();
const server = new McpServer({
  name: packageJson.name!,
  version: packageJson.version!,
});

// Register the fetch tool
server.tool(
  'fetch',
  'Executes HTTP requests using native Node.js fetch API, for using APIs, not for browsing the web.',
  parameterSchema,
  fetchExecute,
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
  } catch (error) {
    console.error('Error during server startup:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
