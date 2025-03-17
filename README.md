# MyCoder-MCP

MyCoder-MCP is a Model Context Protocol (MCP) host that runs on the command line. It provides a CLI that can operate in two modes:

1. Interactive mode - Ask the user what they'd like to do
2. File execution mode - Execute a file containing the user's wishes

## Tech Stack

- TypeScript with ES Modules
- Monorepository managed by PNPM
- Vitest for testing
- ESLint for linting
- Prettier for formatting
- C12 for loading configuration settings
- Citty for managing CLI arguments and commands

## Project Structure

```
/
├── packages/
│   ├── cli/                    # Main CLI package
│   ├── mcp-server-agent/       # Agent MCP server
│   ├── mcp-server-text-editor/ # Text editor MCP server
│   ├── mcp-server-shell/       # Shell command MCP server
│   └── mcp-server-fetch/       # Fetch MCP server
└── ...
```

## Development

### Prerequisites

- Node.js (v18 or higher)
- PNPM (v8 or higher)

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Commands

- `pnpm build` - Build all packages
- `pnpm dev` - Run development mode
- `pnpm clean` - Clean build outputs
- `pnpm clean:all` - Clean build outputs and node_modules
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm format` - Run Prettier
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage

## License

MIT
