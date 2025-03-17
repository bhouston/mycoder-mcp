import { v4 as uuidv4 } from 'uuid';
import consola from 'consola';

/**
 * Status of an agent
 */
export enum AgentStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

/**
 * Information about an agent
 */
export interface AgentInfo {
  id: string;
  goal: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Class to track agents
 */
export class AgentTracker {
  private agents: Map<string, AgentInfo> = new Map();
  private logger = consola.create({ level: 3 });

  /**
   * Register a new agent
   * @param goal - The goal of the agent
   * @param metadata - Additional metadata for the agent
   * @returns The ID of the agent
   */
  registerAgent(goal: string, metadata?: Record<string, any>): string {
    const id = uuidv4();
    this.agents.set(id, {
      id,
      goal,
      status: AgentStatus.RUNNING,
      startTime: new Date(),
      metadata,
    });
    this.logger.debug(`Registered agent with ID: ${id}`);
    return id;
  }

  /**
   * Update the status of an agent
   * @param id - The ID of the agent
   * @param status - The new status
   * @param details - Additional details about the status update
   */
  updateAgentStatus(
    id: string,
    status: AgentStatus,
    details?: { result?: string; error?: string; metadata?: Record<string, any> },
  ): void {
    const agent = this.agents.get(id);
    if (!agent) {
      this.logger.warn(`Attempted to update non-existent agent: ${id}`);
      return;
    }

    agent.status = status;

    if (
      status === AgentStatus.COMPLETED ||
      status === AgentStatus.ERROR ||
      status === AgentStatus.TERMINATED
    ) {
      agent.endTime = new Date();
    }

    if (details) {
      if (details.result !== undefined) {
        agent.result = details.result;
      }

      if (details.error !== undefined) {
        agent.error = details.error;
      }

      if (details.metadata) {
        agent.metadata = { ...agent.metadata, ...details.metadata };
      }
    }

    this.logger.debug(`Updated agent ${id} status to ${status}`);
  }

  /**
   * Get information about an agent
   * @param id - The ID of the agent
   * @returns Information about the agent, or undefined if not found
   */
  getAgent(id: string): AgentInfo | undefined {
    return this.agents.get(id);
  }

  /**
   * List all agents
   * @param filter - Optional filter for agent status
   * @returns Array of agent information
   */
  listAgents(filter?: { status?: AgentStatus }): AgentInfo[] {
    const agents = Array.from(this.agents.values());

    if (filter?.status) {
      return agents.filter((agent) => agent.status === filter.status);
    }

    return agents;
  }

  /**
   * Clean up completed agents
   * @param olderThan - Only clean up agents that completed more than this many milliseconds ago
   */
  cleanupCompletedAgents(olderThan: number = 3600000): void {
    // Default: 1 hour
    const now = new Date();

    for (const [id, agent] of this.agents.entries()) {
      if (
        (agent.status === AgentStatus.COMPLETED ||
          agent.status === AgentStatus.ERROR ||
          agent.status === AgentStatus.TERMINATED) &&
        agent.endTime &&
        now.getTime() - agent.endTime.getTime() > olderThan
      ) {
        this.agents.delete(id);
        this.logger.debug(`Cleaned up agent: ${id}`);
      }
    }
  }

  /**
   * Set the logger
   * @param logger - The logger to use
   */
  setLogger(logger: typeof consola): void {
    this.logger = logger;
  }
}
