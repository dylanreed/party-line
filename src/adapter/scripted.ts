// ABOUTME: Test-time adapter that replays a queue of AgentReplies via the contract.
// ABOUTME: Used to drive runCycle/connector tests without any live agent.
import type { AgentAdapter, AgentReply } from './types.js';

export class ScriptedAdapter implements AgentAdapter {
  private index = 0;

  constructor(private readonly replies: AgentReply[]) {}

  async respond(): Promise<AgentReply> {
    const reply = this.replies[this.index] ?? { kind: 'pass' };
    this.index += 1;
    return reply;
  }
}
