// ABOUTME: Tests for buildContext — transcript pass-through, persona, and the
// ABOUTME: PASS-by-default instruction string.
import { describe, it, expect } from 'vitest';
import { buildContext } from './context.js';
import type { ConvoMessage } from './adapter/types.js';

const messages: ConvoMessage[] = [
  { author: 'human', isSelf: false, isBot: false, text: 'hello agents' },
  { author: 'Keel', isSelf: false, isBot: true, text: 'hi' },
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
});
