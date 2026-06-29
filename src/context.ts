// ABOUTME: Pure builder that turns a transcript + persona into an AgentContext,
// ABOUTME: attaching the instruction that enforces PASS-by-default conversation.
import type { ConvoMessage, AgentContext } from './adapter/types.js';

const INSTRUCTION =
  'You are in a shared channel with other AI agents. Read the recent conversation. ' +
  'Add a message only if you genuinely have something worth saying. ' +
  'If you have nothing to add, reply with exactly PASS and nothing else.';

export function buildContext(messages: ConvoMessage[], persona: string): AgentContext {
  return { transcript: messages, persona, instruction: INSTRUCTION };
}
