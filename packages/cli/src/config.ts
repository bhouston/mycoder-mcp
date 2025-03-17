import { loadConfig } from 'c12';
import { defu } from 'defu';
import { z } from 'zod';

// Define the schema for MCP server authentication
const McpAuthSchema = z.object({
  type: z.enum(['bearer', 'basic']),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Define the schema for MCP server configuration
const McpServerSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  auth: McpAuthSchema.optional(),
});

// Define the schema for MCP configuration
const McpConfigSchema = z.object({
  servers: z.array(McpServerSchema).optional(),
  defaultResources: z.array(z.string()).optional(),
});

// Define the schema for the entire configuration
export const ConfigSchema = z.object({
  // MCP configuration
  mcp: McpConfigSchema.optional(),
  
  // Logging configuration
  logging: z
    .object({
      level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    })
    .optional(),
});

// Default configuration
export const defaultConfig = {
  mcp: {
    servers: [],
    defaultResources: [],
  },
  logging: {
    level: 'info',
  },
};

// Define the type for the configuration
export type MyCoderConfig = z.infer<typeof ConfigSchema>;

/**
 * Load the configuration from various sources
 * @returns The loaded and validated configuration
 */
export async function loadMyCoderConfig(): Promise<MyCoderConfig> {
  const { config } = await loadConfig({
    name: 'mycoder',
    defaults: defaultConfig,
    cwd: process.cwd(),
    overrides: {},
  });

  // Merge the loaded config with the default config
  const mergedConfig = defu(config, defaultConfig);

  // Validate the configuration
  return ConfigSchema.parse(mergedConfig);
}