// ABOUTME: The Agent Adapter contract — the minimal types the connector and any
// ABOUTME: agent stack share: a conversation transcript in, a message or PASS out.

export interface ConvoMessage {
  author: string;
  isSelf: boolean;
  isBot: boolean;
  text: string;
  timestamp: number;
}

export interface AgentContext {
  transcript: ConvoMessage[];
  persona: string;
  instruction: string;
}

export type AgentReply =
  | { kind: 'message'; text: string; tokensUsed?: number }
  | { kind: 'pass'; tokensUsed?: number };

export interface AgentAdapter {
  respond(ctx: AgentContext): Promise<AgentReply>;
}
