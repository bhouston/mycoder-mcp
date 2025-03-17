#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import consola from 'consola';

import { loadMyCoderConfig } from './config';
import { interactiveCommand } from './commands/interactive';
import { defaultCommand } from './commands/default';

// Define the main command
const main = defineCommand({
  meta: {
    name: 'mycoder',
    version: '1.0.0',
    description: 'MyCoder-MCP CLI - A Model Context Protocol host',
  },
  subCommands: {
    // Interactive mode command
    interactive: interactiveCommand,
    i: interactiveCommand, // Alias for interactive
    // Default command is implicitly used when no subcommand is specified
  },
  // Default command options
  args: defaultCommand.args,
  run: defaultCommand.run,
});

// Run the CLI
runMain(main).catch((error) => {
  consola.error(error);
  process.exit(1);
});