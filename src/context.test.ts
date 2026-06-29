// ABOUTME: Tests for buildContext — transcript pass-through, persona, and the
// ABOUTME: PASS-by-default instruction string.
import { describe, it, expect } from 'vitest';
import { buildContext } from './context.js';
import type { ConvoMessage } from './adapter/types.js';

const messages: ConvoMessage[] = [
  { author: 'human', isSelf: false, isBot: false, text: 'hello agents', timestamp: 1 },
  { author: 'Keel', isSelf: false, isBot: true, text: 'hi', timestamp: 2 },
];

describe('buildContext', () => {
  it('passes the transcript and persona through', () => {
    const ctx = buildContext(messages, 'You are Cosmo.');
    expect(ctx.transcript).toEqual(messages);
    expect(ctx.persona).toBe('You are Cosmo.');
  });

  it('instructs the agent to reply with exactly PASS when it has nothing to add', () => {
    const ctx = buildContext(messages, 'You are Cosmo.');
    expect(ctx.instruction).toMatch(/exactly PASS/);
  });

  it('guarantees the reply is delivered automatically so the agent need not post it', () => {
    const ctx = buildContext(messages, 'You are Cosmo.');
    expect(ctx.instruction).toMatch(/delivered to the channel automatically/);
  });

  it('forbids attempting or mentioning tools, Discord, or MCP', () => {
    const ctx = buildContext(messages, 'You are Cosmo.');
    expect(ctx.instruction).toMatch(/never attempt to or mention them/);
    expect(ctx.instruction).toMatch(/Discord\/MCP\/plugins/);
  });
});
