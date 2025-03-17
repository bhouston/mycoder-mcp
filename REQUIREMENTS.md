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

https://modelcontextprotocol.io/introduction
https://modelcontextprotocol.io/quickstart/server
https://modelcontextprotocol.io/quickstart/client
https://modelcontextprotocol.io/examples
https://modelcontextprotocol.io/clients

## Development Approach

The CLI tool should load the agent MCP and then call the main startAgent tool and then wait for it to complete by checking the listAgent tool.  I am wondering how to get this tool to respond to an agentQuery tool call?  Should we engage in polling via the agentMessage command?

The agent MCP should load all of the default MCPs listed above as well as those specified in the mycoder.config.js file as described above.

The MCPs should forward the log messages of sub-agents but with a prefix of two spaces so we can tell it was from a sub-MCP.  The cLI tool should output these to console.log so the user can track progress.

Please start very small and incrementally add features while ensure the project builds and runs correctly at every stage.  Move half-done/example code out of the src folders as necessary to ensure that we do a slow and purposeful build-up of features.  It is best to create a development plan called PLAN.md and then create Github issues for that plan, modifying the plan to link to those Github issues.  And then implement those sub-issues one by one by using a sub-agent to implement each one, ensure the project builds, the tests pass, and then create a PR and then merge it into the main project.  Using sub-agents in this way will ensure that the main agent will not get overwhelmed with unnecessary context.
