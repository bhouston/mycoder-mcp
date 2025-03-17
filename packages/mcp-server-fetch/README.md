# MCP Server: Fetch

An MCP server that exposes the Node.js fetch API for making HTTP requests.

## Overview

This package provides a Model Context Protocol (MCP) server that exposes the native Node.js fetch API as an MCP tool. It allows LLM agents to make HTTP requests to external services.

## Features

- Make HTTP requests (GET, POST, PUT, DELETE, etc.)
- Send request bodies (for POST, PUT, etc.)
- Add custom headers
- Include query parameters
- Automatic handling of JSON responses

## Installation

```bash
npm install @mycoder-mcp/mcp-server-fetch
# or
pnpm add @mycoder-mcp/mcp-server-fetch
```

## Usage

### As a standalone MCP server

```bash
npx @mycoder-mcp/mcp-server-fetch
```

### In your code

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parameterSchema, fetchExecute } from '@mycoder-mcp/mcp-server-fetch';

// Create an MCP server
const server = new McpServer({
  name: 'my-server',
  version: '1.0.0',
});

// Register the fetch tool
server.tool(
  'fetch',
  'Executes HTTP requests using native Node.js fetch API',
  parameterSchema,
  fetchExecute,
);
```

## Tool Parameters

| Parameter | Type              | Description                                                       |
| --------- | ----------------- | ----------------------------------------------------------------- |
| method    | string            | HTTP method to use (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS) |
| url       | string            | URL to make the request to                                        |
| params    | object (optional) | Query parameters to append to the URL                             |
| body      | object (optional) | Request body for POST, PUT, PATCH requests                        |
| headers   | object (optional) | Custom request headers                                            |

## Return Value

| Field      | Type             | Description                                                   |
| ---------- | ---------------- | ------------------------------------------------------------- |
| status     | number           | HTTP status code                                              |
| statusText | string           | HTTP status text                                              |
| headers    | object           | Response headers                                              |
| body       | string or object | Response body (parsed as JSON if possible, otherwise as text) |

## License

MIT
