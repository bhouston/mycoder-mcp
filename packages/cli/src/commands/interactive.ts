import { defineCommand } from 'citty';
import consola from 'consola';

import { loadMyCoderConfig } from '../config';

// Define the interactive command
export const interactiveCommand = defineCommand({
  meta: {
    name: 'interactive',
    description: 'Start MyCoder-MCP in interactive mode',
  },
  args: {},
  async run() {
    try {
      const config = await loadMyCoderConfig();
      consola.info('Starting MyCoder-MCP in interactive mode...');
      
      // TODO: Initialize agent MCP server
      // TODO: Start the agent with a prompt asking for user input
      
      consola.success('Interactive mode started');
      return 0;
    } catch (error) {
      consola.error('Failed to start interactive mode:', error);
      return 1;
    }
  },
});