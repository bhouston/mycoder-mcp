# MyCoder-MCP CLI

The main CLI for MyCoder-MCP, a Model Context Protocol (MCP) host that runs on the command line.

## Usage

```bash
# Install globally
npm install -g @mycoder-mcp/cli

# Run with a prompt
mycoder "What is the weather today?"

# Run with a prompt file
mycoder -f prompt.txt

# Run in interactive mode
mycoder interactive
# or
mycoder i
```

## Configuration

MyCoder-MCP can be configured using a `mycoder.config.js` file in your project directory:

```js
export default {
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

  // Logging configuration
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
  },
};
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
