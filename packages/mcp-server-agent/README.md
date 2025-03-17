# MyCoder-MCP Agent Server

An MCP server that provides agent functionality for MyCoder-MCP.

## Features

- Start agents with specific goals and contexts
- Send messages to running agents
- Query agents for their current status
- Terminate agents
- List all running and completed agents

## Tools

### agentStart

Starts a new agent with a specific goal and context.

```typescript
interface AgentStartParams {
  description: string;
  goal: string;
  projectContext: string;
  workingDirectory?: string;
  relevantFilesDirectories?: string;
}
```

### agentMessage

Interacts with a running agent, getting its current state and optionally providing guidance or terminating it.

```typescript
interface AgentMessageParams {
  instanceId: string;
  guidance?: string;
  terminate?: boolean;
  description: string;
}
```

### agentDone

Completes the agent and returns the final result.

```typescript
interface AgentDoneParams {
  result: string;
}
```

### agentQuery

Prompts the user for input and returns their response.

```typescript
interface AgentQueryParams {
  prompt: string;
}
```

### listAgents

Lists all agents, optionally filtered by status.

```typescript
interface ListAgentsParams {
  status?: 'all' | 'running' | 'completed' | 'error' | 'terminated';
  verbose?: boolean;
}
```

## Usage

```typescript
import { createAgentMcpServer } from '@mycoder-mcp/mcp-server-agent';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create the agent MCP server
const server = createAgentMcpServer();

// Start the server with a transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

## License

MIT
