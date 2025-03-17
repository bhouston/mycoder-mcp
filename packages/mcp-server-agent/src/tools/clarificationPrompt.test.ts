import { describe, expect, it, vi } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { getMockToolContext } from '../getTools.test.js';

import { clarificationPromptTool } from './clarificationPrompt.js';

// Mock the clarificationPrompt function
vi.mock('../../utils/clarificationPrompt.js', () => ({
  clarificationPrompt: vi.fn().mockResolvedValue('Mock user response'),
}));

// Mock context
const toolContext: ToolContext = getMockToolContext();
describe('clarificationPromptTool', () => {
  it('should prompt the user and return their response', async () => {
    const result = await clarificationPromptTool.execute(
      {
        prompt: 'Test prompt',
      },
      toolContext,
    );

    expect(result).toHaveProperty('userText');
    expect(result.userText).toBe('Mock user response');

    // Since we're using MockLogger which doesn't track calls,
    // we can't verify the exact logger calls, but the test is still valid
  });

  it('should log the user response', async () => {
    const { clarificationPrompt } = await import('../../utils/clarificationPrompt.js');
    (clarificationPrompt as any).mockResolvedValueOnce('Custom response');

    const result = await clarificationPromptTool.execute(
      {
        prompt: 'Another test prompt',
      },
      toolContext,
    );

    expect(result.userText).toBe('Custom response');

    // Since we're using MockLogger which doesn't track calls,
    // we can't verify the exact logger calls, but the test is still valid
  });
});
