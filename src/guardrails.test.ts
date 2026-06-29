// ABOUTME: Exhaustive tests for the pure guardrail logic — every canSpeak branch
// ABOUTME: in order, plus recordPost day-roll and setPaused, all with explicit now.
import { describe, it, expect } from 'vitest';
import { initialState, canSpeak, recordPost, setPaused } from './guardrails.js';
import type { ConnectorState } from './guardrails.js';
import type { Config } from './config.js';
import type { ConvoMessage } from './adapter/types.js';

const baseConfig: Config = {
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

function self(text = 's'): ConvoMessage {
  return { author: 'Cosmo', isSelf: true, isBot: true, text };
}
function otherBot(text = 'o'): ConvoMessage {
  return { author: 'Keel', isSelf: false, isBot: true, text };
}

describe('initialState', () => {
  it('starts silent, empty, and unpaused', () => {
    expect(initialState()).toEqual({
      lastPostAt: null,
      postTimestamps: [],
      spentTokensToday: 0,
      dayStamp: '',
      paused: false,
    });
  });
});

describe('canSpeak gate order', () => {
  it('blocks when paused (first gate)', () => {
    const state: ConnectorState = { ...initialState(), paused: true };
    expect(canSpeak(state, baseConfig, NOW, 'tick', [human])).toEqual({
      allowed: false,
      reason: 'paused',
    });
  });

  it('blocks when the daily token budget is reached (second gate)', () => {
    const state: ConnectorState = { ...initialState(), spentTokensToday: 1000, dayStamp: '2026-06-29' };
    expect(canSpeak(state, baseConfig, NOW, 'tick', [human])).toEqual({
      allowed: false,
      reason: 'daily token budget reached',
    });
  });

  it('frees the budget after the UTC day rolls over, even without a post (self-heal)', () => {
    const state: ConnectorState = { ...initialState(), spentTokensToday: 1000, dayStamp: '2026-06-28' };
    expect(canSpeak(state, baseConfig, NOW, 'tick', [human])).toEqual({ allowed: true });
  });

  it('blocks when inside the minimum post gap (third gate)', () => {
    const state: ConnectorState = { ...initialState(), lastPostAt: NOW - 1000 };
    expect(canSpeak(state, baseConfig, NOW, 'tick', [human])).toEqual({
      allowed: false,
      reason: 'min gap',
    });
  });

  it('blocks when the hourly cap is hit (fourth gate)', () => {
    const stamps = Array.from({ length: 12 }, (_, i) => NOW - 200000 - i * 1000);
    const state: ConnectorState = {
      ...initialState(),
      lastPostAt: NOW - 200000,
      postTimestamps: stamps,
    };
    expect(canSpeak(state, baseConfig, NOW, 'tick', [human])).toEqual({
      allowed: false,
      reason: 'hourly cap',
    });
  });

  it('blocks when the last message is its own (loop-breaker)', () => {
    expect(canSpeak(initialState(), baseConfig, NOW, 'tick', [human, self()])).toEqual({
      allowed: false,
      reason: 'would reply to self',
    });
  });

  it('blocks ping-pong: last 4 alternate between self and one other bot', () => {
    const recent = [self('a'), otherBot('b'), self('c'), otherBot('d')];
    expect(canSpeak(initialState(), baseConfig, NOW, 'tick', recent)).toEqual({
      allowed: false,
      reason: 'ping-pong cooldown',
    });
  });

  it('does not flag ping-pong when a human is in the last 4', () => {
    const recent = [self('a'), otherBot('b'), human, otherBot('d')];
    expect(canSpeak(initialState(), baseConfig, NOW, 'tick', recent).allowed).toBe(true);
  });

  it('does not flag ping-pong when the last 4 involve two different bots', () => {
    const bot2: ConvoMessage = { author: 'Hermes', isSelf: false, isBot: true, text: 'h' };
    const recent = [self('a'), otherBot('b'), self('c'), bot2];
    expect(canSpeak(initialState(), baseConfig, NOW, 'tick', recent).allowed).toBe(true);
  });

  it('does not flag ping-pong when there are fewer than 4 messages', () => {
    const recent = [self('a'), otherBot('b')];
    expect(canSpeak(initialState(), baseConfig, NOW, 'tick', recent).allowed).toBe(true);
  });

  it('allows when every gate passes', () => {
    expect(canSpeak(initialState(), baseConfig, NOW, 'tick', [human])).toEqual({ allowed: true });
  });

  it('applies the same guardrails to a mention trigger', () => {
    const state: ConnectorState = { ...initialState(), lastPostAt: NOW - 1000 };
    expect(canSpeak(state, baseConfig, NOW, 'mention', [human])).toEqual({
      allowed: false,
      reason: 'min gap',
    });
  });
});

describe('recordPost', () => {
  it('appends a timestamp, sets lastPostAt, and adds tokens', () => {
    const next = recordPost(initialState(), 100, NOW);
    expect(next.lastPostAt).toBe(NOW);
    expect(next.postTimestamps).toEqual([NOW]);
    expect(next.spentTokensToday).toBe(100);
  });

  it('accumulates spend within the same UTC day', () => {
    const a = recordPost(initialState(), 100, NOW);
    const b = recordPost(a, 50, NOW + 60000);
    expect(b.spentTokensToday).toBe(150);
  });

  it('resets spend and timestamps when the UTC day rolls over', () => {
    const a = recordPost(initialState(), 100, NOW);
    const nextDay = Date.UTC(2026, 5, 30, 1, 0, 0);
    const b = recordPost(a, 30, nextDay);
    expect(b.spentTokensToday).toBe(30);
    expect(b.postTimestamps).toEqual([nextDay]);
  });

  it('prunes timestamps older than one hour', () => {
    const old = { ...initialState(), dayStamp: '2026-06-29', postTimestamps: [NOW - 3_700_000] };
    const next = recordPost(old, 10, NOW);
    expect(next.postTimestamps).toEqual([NOW]);
  });
});

describe('setPaused', () => {
  it('toggles the paused flag without mutating other fields', () => {
    const s = initialState();
    const paused = setPaused(s, true);
    expect(paused).toEqual({ ...s, paused: true });
    expect(setPaused(paused, false)).toEqual({ ...s, paused: false });
  });
});
