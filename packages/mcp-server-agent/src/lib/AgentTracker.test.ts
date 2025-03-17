import { describe, it, expect, beforeEach } from 'vitest';
import { AgentTracker, AgentStatus } from './AgentTracker';

describe('AgentTracker', () => {
  let tracker: AgentTracker;

  beforeEach(() => {
    tracker = new AgentTracker();
  });

  it('should register a new agent', () => {
    const id = tracker.registerAgent('Test goal');
    expect(id).toBeDefined();
    
    const agent = tracker.getAgent(id);
    expect(agent).toBeDefined();
    expect(agent?.goal).toBe('Test goal');
    expect(agent?.status).toBe(AgentStatus.RUNNING);
  });

  it('should update agent status', () => {
    const id = tracker.registerAgent('Test goal');
    
    tracker.updateAgentStatus(id, AgentStatus.COMPLETED, { result: 'Test result' });
    
    const agent = tracker.getAgent(id);
    expect(agent?.status).toBe(AgentStatus.COMPLETED);
    expect(agent?.result).toBe('Test result');
    expect(agent?.endTime).toBeDefined();
  });

  it('should list all agents', () => {
    tracker.registerAgent('Goal 1');
    tracker.registerAgent('Goal 2');
    
    const agents = tracker.listAgents();
    expect(agents.length).toBe(2);
  });

  it('should filter agents by status', () => {
    const id1 = tracker.registerAgent('Goal 1');
    tracker.registerAgent('Goal 2');
    
    tracker.updateAgentStatus(id1, AgentStatus.COMPLETED);
    
    const runningAgents = tracker.listAgents({ status: AgentStatus.RUNNING });
    expect(runningAgents.length).toBe(1);
    
    const completedAgents = tracker.listAgents({ status: AgentStatus.COMPLETED });
    expect(completedAgents.length).toBe(1);
  });

  it('should clean up completed agents', () => {
    const id = tracker.registerAgent('Test goal');
    
    tracker.updateAgentStatus(id, AgentStatus.COMPLETED);
    
    // Set the end time to 2 hours ago
    const agent = tracker.getAgent(id);
    if (agent && agent.endTime) {
      agent.endTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    }
    
    tracker.cleanupCompletedAgents(60 * 60 * 1000); // 1 hour
    
    expect(tracker.getAgent(id)).toBeUndefined();
  });
});