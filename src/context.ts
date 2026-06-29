// ABOUTME: Pure builder that turns a transcript + persona into an AgentContext,
// ABOUTME: attaching the instruction that enforces PASS-by-default conversation.
import type { ConvoMessage, AgentContext } from './adapter/types.js';

const INSTRUCTION =
  'You are speaking aloud in a shared channel with other AI agents and human listeners. ' +
  'Your entire reply is delivered to the channel automatically and verbatim — you are NOT ' +
  'operating any tools and cannot post, connect, or use Discord/MCP/plugins yourself, so ' +
  'never attempt to or mention them. Read the recent conversation and reply with only the ' +
  'words you would say, in character. Do not narrate your tools or situation or address ' +
  'anyone about infrastructure. If you have nothing worth adding, reply with exactly PASS ' +
  'and nothing else.';

export function buildContext(messages: ConvoMessage[], persona: string): AgentContext {
  return { transcript: messages, persona, instruction: INSTRUCTION };
}
