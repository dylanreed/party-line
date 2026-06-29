// ABOUTME: Tests for runCycle — proves guardrails gate the cycle, PASS posts
// ABOUTME: nothing, and a message posts and updates state. No live Discord.
import { describe, it, expect } from 'vitest';
import { runCycle } from './cycle.js';
import { initialState } from './guardrails.js';
import type { ConnectorState } from './guardrails.js';
import { ScriptedAdapter } from './adapter/scripted.js';
import type { Config } from './config.js';
import type { ConvoMessage } from './adapter/types.js';

const config: Config = {
  discordBotToken: 'tok',
  channelId: 'chan',
  agentName: 'Cosmo',
  agentPersona: 'curious',
  tickIntervalMs: 300000,
  tickJitterMs: 120000,
  gatherK: 20,
  minPostGapMs: 75000,
  maxPostsPerHour: 12,
  dailyTokenBudget: 1000,
  operatorIds: [],
  claudeCmd: 'claude',
};

const NOW = Date.UTC(2026, 5, 29, 12, 0, 0);
const human: ConvoMessage = { author: 'human', isSelf: false, isBot: false, text: 'hi' };

function harness(recent: ConvoMessage[], adapter: ScriptedAdapter, state: ConnectorState) {
  const posts: string[] = [];
  return {
    posts,
    deps: {
      fetchRecent: async () => recent,
      adapter,
      post: async (text: string) => {
        posts.push(text);
      },
      state,
      config,
      now: NOW,
      trigger: 'tick' as const,
    },
  };
}

describe('runCycle', () => {
  it('does not post when guardrails block (paused)', async () => {
    const state: ConnectorState = { ...initialState(), paused: true };
    const { posts, deps } = harness([human], new ScriptedAdapter([{ kind: 'message', text: 'x' }]), state);
    const result = await runCycle(deps);
    expect(result.posted).toBe(false);
    expect(result.reason).toBe('paused');
    expect(result.state).toBe(state);
    expect(posts).toEqual([]);
  });

  it('does not post when the agent replies PASS', async () => {
    const state = initialState();
    const { posts, deps } = harness([human], new ScriptedAdapter([{ kind: 'pass' }]), state);
    const result = await runCycle(deps);
    expect(result.posted).toBe(false);
    expect(result.reason).toBe('pass');
    expect(posts).toEqual([]);
    expect(result.state).toBe(state);
  });

  it('posts a message reply and updates state', async () => {
    const { posts, deps } = harness(
      [human],
      new ScriptedAdapter([{ kind: 'message', text: 'hello', tokensUsed: 50 }]),
      initialState(),
    );
    const result = await runCycle(deps);
    expect(result.posted).toBe(true);
    expect(posts).toEqual(['hello']);
    expect(result.state.lastPostAt).toBe(NOW);
    expect(result.state.spentTokensToday).toBe(50);
  });

  it('lets the loop-breaker gate the cycle (last message is self)', async () => {
    const recent: ConvoMessage[] = [human, { author: 'Cosmo', isSelf: true, isBot: true, text: 'me' }];
    const { posts, deps } = harness(recent, new ScriptedAdapter([{ kind: 'message', text: 'x' }]), initialState());
    const result = await runCycle(deps);
    expect(result.posted).toBe(false);
    expect(result.reason).toBe('would reply to self');
    expect(posts).toEqual([]);
  });
});
