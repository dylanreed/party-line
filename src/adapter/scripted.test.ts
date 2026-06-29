// ABOUTME: Tests for ScriptedAdapter — returns queued replies, then defaults to PASS.
// ABOUTME: This adapter is the test-time stand-in injected into runCycle tests.
import { describe, it, expect } from 'vitest';
import { ScriptedAdapter } from './scripted.js';
import type { AgentContext } from './types.js';

const ctx: AgentContext = { transcript: [], persona: 'p', instruction: 'i' };

describe('ScriptedAdapter', () => {
  it('returns queued replies in order then defaults to pass', async () => {
    const adapter = new ScriptedAdapter([
      { kind: 'message', text: 'first', tokensUsed: 10 },
      { kind: 'pass' },
    ]);
    expect(await adapter.respond(ctx)).toEqual({ kind: 'message', text: 'first', tokensUsed: 10 });
    expect(await adapter.respond(ctx)).toEqual({ kind: 'pass' });
    expect(await adapter.respond(ctx)).toEqual({ kind: 'pass' });
  });
});
