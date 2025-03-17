# MCP Server Shell

A Model Context Protocol (MCP) server for executing and managing shell commands.

## Features

- Start shell commands in both synchronous and asynchronous modes
- Interact with running shell commands (send input, receive output)
- Send signals to shell processes
- List all running and completed shell commands

## Tools

### shellStart

Starts a shell command with fast sync mode (default 10s timeout) that falls back to async mode for longer-running commands.

Parameters:

- `command`: The shell command to execute
- `description`: The reason this shell command is being run (max 80 chars)
- `timeout`: (Optional) Timeout in ms before switching to async mode (default: 10s)
- `showStdIn`: (Optional) Whether to show the command input to the user (default: false)
- `showStdout`: (Optional) Whether to show command output to the user (default: false)

Returns:

- For sync mode (command completes within timeout):
  - `mode`: "sync"
  - `stdout`: Command standard output
  - `stderr`: Command standard error
  - `exitCode`: Command exit code
  - `error`: (Optional) Error message if command failed
- For async mode (command exceeds timeout):
  - `mode`: "async"
  - `instanceId`: ID to use with shellMessage
  - `stdout`: Command standard output so far
  - `stderr`: Command standard error so far
  - `error`: (Optional) Error message if command failed to start

### shellMessage

Interacts with a running shell process, sending input and receiving output.

Parameters:

- `instanceId`: The ID returned by shellStart
- `description`: The reason for this shell interaction (max 80 chars)
- `stdin`: (Optional) Input to send to the process
- `signal`: (Optional) Signal to send to the process (e.g., SIGTERM, SIGINT)
- `showStdIn`: (Optional) Whether to show the input to the user (default: false or value from shellStart)
- `showStdout`: (Optional) Whether to show output to the user (default: false or value from shellStart)

Returns:

- `success`: Whether the operation was successful
- `status`: Current status of the shell process ("running", "completed", "error", "terminated")
- `stdout`: Current standard output of the process
- `stderr`: Current standard error of the process
- `exitCode`: Exit code if process has completed, null otherwise
- `message`: Status message
- `error`: (Optional) Error message if applicable

### listBackgroundTools

Lists all background tools (shells) and their status.

Parameters:

- `status`: (Optional) Filter tools by status (default: "all", options: "all", "running", "completed", "error", "terminated")
- `verbose`: (Optional) Include detailed metadata about each tool (default: false)

Returns:

- `shells`: Array of shell process information
  - `id`: Shell process ID
  - `status`: Current status
  - `command`: The command that was executed
  - `startTime`: When the command started
  - `endTime`: (Optional) When the command ended
  - `exitCode`: (Optional) Exit code if process has completed
  - `metadata`: (Optional, when verbose=true) Additional metadata

## Usage

This MCP server is designed to be used with the MyCoder-MCP CLI or other MCP clients.

## Installation

```bash
npm install @mycoder-mcp/mcp-server-shell
```

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Start the server directly
pnpm start
```
