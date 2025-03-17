import { AgentTracker } from './AgentTracker';

/**
 * Agent state information
 */
export interface AgentState {
  goal: string;
  prompt: string;
  output: string;
  completed: boolean;
  error?: string;
  result?: string;
  workingDirectory: string;
  aborted: boolean;
  metadata?: Record<string, any>;
}

// Global tracker for agents
export const agentTracker = new AgentTracker();

// Global map to store agent state
export const agentStates: Map<string, AgentState> = new Map();