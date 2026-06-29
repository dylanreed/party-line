// ABOUTME: Tests for ClaudeCodeAdapter using an injected fake runner (no live claude).
// ABOUTME: Covers the message path, PASS detection, and prompt assembly.
import { describe, it, expect } from 'vitest';
import { ClaudeCodeAdapter } from './claude-code.js';
import type { Runner } from './claude-code.js';
import type { AgentContext } from './types.js';

const ctx: AgentContext = {
  transcript: [{ author: 'human', isSelf: false, isBot: false, text: 'hello' }],
  persona: 'You are Cosmo.',
  instruction: 'reply with exactly PASS if nothing to add.',
};

function fakeRunner(result: { stdout: string; usageTokens?: number }): {
  runner: Runner;
  calls: { cmd: string; args: string[]; input: string }[];
} {
  const calls: { cmd: string; args: string[]; input: string }[] = [];
  const runner: Runner = async (cmd, args, input) => {
    calls.push({ cmd, args, input });
    return result;
  };
  return { runner, calls };
}

describe('ClaudeCodeAdapter', () => {
  it('returns a message reply carrying tokensUsed', async () => {
    const { runner } = fakeRunner({ stdout: 'Hello there\n', usageTokens: 42 });
    const adapter = new ClaudeCodeAdapter({ claudeCmd: 'claude', runner });
    const reply = await adapter.respond(ctx);
    expect(reply).toEqual({ kind: 'message', text: 'Hello there', tokensUsed: 42 });
  });

  it('detects an exact PASS as a pass reply', async () => {
    const { runner } = fakeRunner({ stdout: 'PASS\n', usageTokens: 5 });
    const adapter = new ClaudeCodeAdapter({ claudeCmd: 'claude', runner });
    expect(await adapter.respond(ctx)).toEqual({ kind: 'pass', tokensUsed: 5 });
  });

  it('treats a PASS-prefixed reply as a pass (word boundary)', async () => {
    const { runner } = fakeRunner({ stdout: 'PASS - nothing to add' });
    const adapter = new ClaudeCodeAdapter({ claudeCmd: 'claude', runner });
    expect((await adapter.respond(ctx)).kind).toBe('pass');
  });

  it('does NOT treat PASSING... as a pass (regression: over-matching startsWith)', async () => {
    const { runner } = fakeRunner({ stdout: 'PASSING the mic to Keel' });
    const adapter = new ClaudeCodeAdapter({ claudeCmd: 'claude', runner });
    const reply = await adapter.respond(ctx);
    expect(reply.kind).toBe('message');
    expect((reply as { kind: 'message'; text: string }).text).toBe('PASSING the mic to Keel');
  });

  it('passes the configured command and a prompt containing persona + transcript', async () => {
    const { runner, calls } = fakeRunner({ stdout: 'hi' });
    const adapter = new ClaudeCodeAdapter({ claudeCmd: 'claude-x', runner });
    await adapter.respond(ctx);
    expect(calls[0].cmd).toBe('claude-x');
    const prompt = calls[0].args.join(' ');
    expect(prompt).toContain('You are Cosmo.');
    expect(prompt).toContain('human: hello');
  });
});
