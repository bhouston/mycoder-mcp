import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defaultConfig, ConfigSchema } from '../src/config';

// Mock c12's loadConfig function
vi.mock('c12', () => ({
  loadConfig: vi.fn().mockResolvedValue({ config: {} }),
}));

describe('Configuration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should have valid default config', () => {
    // Validate that the default config matches the schema
    const result = ConfigSchema.safeParse(defaultConfig);
    expect(result.success).toBe(true);
  });

  it('should have proper default values', () => {
    expect(defaultConfig.mcp).toBeDefined();
    expect(defaultConfig.logging.level).toBe('info');
  });
});
