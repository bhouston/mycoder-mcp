# MyCoder-MCP Requirements

Tech stack:

- TypeScript, ES Modules
- Monorepository managed by PNPM
- Vitest is used for testing.
- Eslint is used for linting.
- Prettier is used for formatting.
- C12 is used for loading configuration settings.
- Citty is used for managing CLI arguments and commands

## Overview

MyCoder-MCP is at its core a Model Context Protocol host that can run on the command line.  This package, located in packages/cli, will be called 'cli'.  It has two modes, it can either ask the user what they would like to do, or it can be given a file which it will then execute.  Interactive mode is triggered via the 'interactive' or 'i' command.  The default command is to expect a string that is the user's wishes.  If the user specifies -f then the next parameters should be the filename to load as the prompt.

MyCoder-MCP is designed to use MCP servers/services for its tools.  In its configuration it contains:

```
  // MCP configuration
  mcp: {
    servers: [
      {
        name: 'example',
        url: 'https://mcp.example.com',
        auth: {
          type: 'bearer',
          token: 'your-token-here',
        },
      },
    ],
    defaultResources: ['example://docs/api'],
  },
```

These are the external MCP services that one can specify to augment the capabilities of mycoder-mcp.

The system also has a set of default MCP servers that it uses, these are local services.

There are a bunch of MCP servers that will be built into this tool:

## Agent

This is the most important service.  This is an MCP server that runs a local agent using the Claude LLM.  The agents are asynchronous so one starts the agent via the agentStart tool and then one can send messages to the agent via the agentMessage tool.  One can list the running agents via the listAgents tool.

The agent when it is running has one built-in tool called "agentDone", which takes a string parameter.  It causes this string to be returned when the agent is done its task.  This call doesn't actually return for the agent calling this function, but instead this string parameter is what is returned in the "returnSchema.response" to the parent agent.  It halts the calling agent's run.

The agent also has a built-in tool called "agentQuery".  This is a tool that asks the agent owner to answer a question.  It can be to ask the user to specify their initial requirements, such as when the tool starts up in interactive mode, or it can be for a sub-agent to ask its parent agent for further details in a confusing situation.  It is a blocking Query that only returns once the owner of the agent responds.

The agent also has all of the tools available made possible by the current loaded MCP clients.  Thus the Agent MCP server will actually be loading the config file and loading the MCP servers that will be using.

## Text Editor

This tool can read, modify and create text files.  I have an existing implementation for this tool which I have placed in the directory: packages/mcp-server-text-editor  I should mention it was previously a standalone project so it needs to be modified in order to become a sub-package within a pnpm monorepository. It's lint rules should be move up to the top level as well as prettier settings and test settings.

This is a good project to inspect because it shows how to create a MCP Server.  One should likely copy this pattern for the other MCP server packages in this project.

## Shell Command

This tool can start shell commands in both sync and async modes and allow the calling agent to check in on them and provide additional input to interactive commands or kill frozen shell commands.  There is also a listShells tool that list the shell commands that have been started and their current status.  You can check on shell commands via the shellMessage tool.  some code for doing this in the context of another project is in the packages/mcp-server-shell-command directory.  You can likely just refactor this for the current project.

## Fetch

This tool exposes the node JS fetch API as an MCP.  I have included example code in the src/tools directory for this tool from a separate project.  Please refactor it as you see fit.

## Background information

### Model Context Protocol

You can read this to learn about the MCP - I would recommend using fetch to get their contents and using a sub-agent to learn about MCP and report back:

The Model Context Protocol allows applications to provide context for LLMs in a standardized way, separating the concerns of providing context from the actual LLM interaction. This TypeScript SDK implements the full MCP specification, making it easy to:

Build MCP clients that can connect to any MCP server
Create MCP servers that expose resources, prompts and tools
Use standard transports like stdio and SSE
Handle all MCP protocol messages and lifecycle events
Installation

npm install @modelcontextprotocol/sdk
Quick Start

Let's create a simple MCP server that exposes a calculator tool and some data:

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Add an addition tool
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
What is MCP?

The Model Context Protocol (MCP) lets you build servers that expose data and functionality to LLM applications in a secure, standardized way. Think of it like a web API, but specifically designed for LLM interactions. MCP servers can:

Expose data through Resources (think of these sort of like GET endpoints; they are used to load information into the LLM's context)
Provide functionality through Tools (sort of like POST endpoints; they are used to execute code or otherwise produce a side effect)
Define interaction patterns through Prompts (reusable templates for LLM interactions)
And more!
Core Concepts

Server

The McpServer is your core interface to the MCP protocol. It handles connection management, protocol compliance, and message routing:

const server = new McpServer({
  name: "My App",
  version: "1.0.0"
});
Resources

Resources are how you expose data to LLMs. They're similar to GET endpoints in a REST API - they provide data but shouldn't perform significant computation or have side effects:

// Static resource
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "App configuration here"
    }]
  })
);

// Dynamic resource with parameters
server.resource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: `Profile data for user ${userId}`
    }]
  })
);
Tools

Tools let LLMs take actions through your server. Unlike resources, tools are expected to perform computation and have side effects:

// Simple tool with parameters
server.tool(
  "calculate-bmi",
  {
    weightKg: z.number(),
    heightM: z.number()
  },
  async ({ weightKg, heightM }) => ({
    content: [{
      type: "text",
      text: String(weightKg / (heightM * heightM))
    }]
  })
);

// Async tool with external API call
server.tool(
  "fetch-weather",
  { city: z.string() },
  async ({ city }) => {
    const response = await fetch(`https://api.weather.com/${city}`);
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }]
    };
  }
);
Prompts

Prompts are reusable templates that help LLMs interact with your server effectively:

server.prompt(
  "review-code",
  { code: z.string() },
  ({ code }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please review this code:\n\n${code}`
      }
    }]
  })
);
Running Your Server

MCP servers in TypeScript need to be connected to a transport to communicate with clients. How you start the server depends on the choice of transport:

stdio

For command-line tools and direct integrations:

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...

const transport = new StdioServerTransport();
await server.connect(transport);
HTTP with SSE

For remote servers, start a web server with a Server-Sent Events (SSE) endpoint, and a separate endpoint for the client to send its messages to:

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...

const app = express();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // Note: to support multiple simultaneous connections, these messages will
  // need to be routed to a specific matching transport. (This logic isn't
  // implemented here, for simplicity.)
  await transport.handlePostMessage(req, res);
});

app.listen(3001);
Testing and Debugging

To test your server, you can use the MCP Inspector. See its README for more information.

Examples

Echo Server

A simple server demonstrating resources, tools, and prompts:

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "Echo",
  version: "1.0.0"
});

server.resource(
  "echo",
  new ResourceTemplate("echo://{message}", { list: undefined }),
  async (uri, { message }) => ({
    contents: [{
      uri: uri.href,
      text: `Resource echo: ${message}`
    }]
  })
);

server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Tool echo: ${message}` }]
  })
);

server.prompt(
  "echo",
  { message: z.string() },
  ({ message }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please process this message: ${message}`
      }
    }]
  })
);
SQLite Explorer

A more complex example showing database integration:

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { z } from "zod";

const server = new McpServer({
  name: "SQLite Explorer",
  version: "1.0.0"
});

// Helper to create DB connection
const getDb = () => {
  const db = new sqlite3.Database("database.db");
  return {
    all: promisify<string, any[]>(db.all.bind(db)),
    close: promisify(db.close.bind(db))
  };
};

server.resource(
  "schema",
  "schema://main",
  async (uri) => {
    const db = getDb();
    try {
      const tables = await db.all(
        "SELECT sql FROM sqlite_master WHERE type='table'"
      );
      return {
        contents: [{
          uri: uri.href,
          text: tables.map((t: {sql: string}) => t.sql).join("\n")
        }]
      };
    } finally {
      await db.close();
    }
  }
);

server.tool(
  "query",
  { sql: z.string() },
  async ({ sql }) => {
    const db = getDb();
    try {
      const results = await db.all(sql);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    } finally {
      await db.close();
    }
  }
);
Advanced Usage

Low-Level Server

For more control, you can use the low-level Server class directly:

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "example-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {}
    }
  }
);

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [{
      name: "example-prompt",
      description: "An example prompt template",
      arguments: [{
        name: "arg1",
        description: "Example argument",
        required: true
      }]
    }]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "example-prompt") {
    throw new Error("Unknown prompt");
  }
  return {
    description: "Example prompt",
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: "Example prompt text"
      }
    }]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
Writing MCP Clients

The SDK provides a high-level client interface:

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["server.js"]
});

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {}
    }
  }
);

await client.connect(transport);

// List prompts
const prompts = await client.listPrompts();

// Get a prompt
const prompt = await client.getPrompt("example-prompt", {
  arg1: "value"
});

// List resources
const resources = await client.listResources();

// Read a resource
const resource = await client.readResource("file:///example.txt");

// Call a tool
const result = await client.callTool({
  name: "example-tool",
  arguments: {
    arg1: "value"
  }
});

## Development Approach

The CLI tool should load the agent MCP and then call the main startAgent tool and then wait for it to complete by checking the listAgent tool.  I am wondering how to get this tool to respond to an agentQuery tool call?  Should we engage in polling via the agentMessage command?

The agent MCP should load all of the default MCPs listed above as well as those specified in the mycoder.config.js file as described above.

The MCPs should forward the log messages of sub-agents but with a prefix of two spaces so we can tell it was from a sub-MCP.  The cLI tool should output these to console.log so the user can track progress.

Please start very small and incrementally add features while ensure the project builds and runs correctly at every stage.  Move half-done/example code out of the src folders as necessary to ensure that we do a slow and purposeful build-up of features.  It is best to create a development plan called PLAN.md and then create Github issues for that plan, modifying the plan to link to those Github issues.  And then implement those sub-issues one by one by using a sub-agent to implement each one, ensure the project builds, the tests pass, and then create a PR and then merge it into the main project.  Using sub-agents in this way will ensure that the main agent will not get overwhelmed with unnecessary context.
