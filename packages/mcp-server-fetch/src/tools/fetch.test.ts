import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchExecute, parameterSchema, returnSchema } from './fetch.js';

// Mock global fetch
const mockResponse = {
  status: 200,
  statusText: 'OK',
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => ({ message: 'success' }),
  text: async () => 'text response',
};

global.fetch = vi.fn().mockResolvedValue(mockResponse);

describe('fetch tool', () => {
  const logger = {
    verbose: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate parameters correctly', () => {
    // Valid parameters
    expect(() =>
      parameterSchema.parse({
        method: 'GET',
        url: 'https://example.com',
      }),
    ).not.toThrow();

    // Invalid parameters (missing url)
    expect(() =>
      parameterSchema.parse({
        method: 'GET',
      }),
    ).toThrow();
  });

  it('should make a GET request successfully', async () => {
    const result = await fetchExecute(
      {
        method: 'GET',
        url: 'https://example.com',
      },
      { logger },
    );

    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
      headers: {},
    });

    expect(result).toEqual({
      status: 200,
      statusText: 'OK',
      headers: expect.any(Object),
      body: { message: 'success' },
    });
  });

  it('should make a POST request with body', async () => {
    const result = await fetchExecute(
      {
        method: 'POST',
        url: 'https://example.com',
        body: { name: 'test' },
      },
      { logger },
    );

    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    expect(result).toEqual({
      status: 200,
      statusText: 'OK',
      headers: expect.any(Object),
      body: { message: 'success' },
    });
  });

  it('should handle query parameters', async () => {
    await fetchExecute(
      {
        method: 'GET',
        url: 'https://example.com',
        params: { q: 'search', page: '1' },
      },
      { logger },
    );

    expect(global.fetch).toHaveBeenCalledWith('https://example.com?q=search&page=1', {
      method: 'GET',
      headers: {},
    });
  });

  it('should handle custom headers', async () => {
    await fetchExecute(
      {
        method: 'GET',
        url: 'https://example.com',
        headers: { Authorization: 'Bearer token' },
      },
      { logger },
    );

    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token',
      },
    });
  });
});
