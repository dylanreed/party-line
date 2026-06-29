// ABOUTME: Tests for loadConfig — required fields, defaults, and CSV operator parsing.
// ABOUTME: Uses injected env objects so no process.env is touched.
import { describe, it, expect } from 'vitest';
import { loadConfig } from './config.js';

const fullEnv = {
  DISCORD_BOT_TOKEN: 'tok',
  CHANNEL_ID: 'chan',
  AGENT_NAME: 'Cosmo',
  AGENT_PERSONA: 'curious agent',
  LISTENER_ID: 'user123',
  TICK_INTERVAL_MS: '60000',
  TICK_JITTER_MS: '5000',
  GATHER_K: '10',
  MIN_POST_GAP_MS: '30000',
  MAX_POSTS_PER_HOUR: '6',
  DAILY_TOKEN_BUDGET: '50000',
  PING_PONG_COOLDOWN_MS: '90000',
  OPERATOR_IDS: '111, 222 ,333',
  CLAUDE_CMD: 'claude-test',
};

describe('loadConfig', () => {
  it('parses a full env into a typed config', () => {
    const cfg = loadConfig(fullEnv);
    expect(cfg.discordBotToken).toBe('tok');
    expect(cfg.channelId).toBe('chan');
    expect(cfg.listenerId).toBe('user123');
    expect(cfg.tickIntervalMs).toBe(60000);
    expect(cfg.gatherK).toBe(10);
    expect(cfg.pingPongCooldownMs).toBe(90000);
    expect(cfg.operatorIds).toEqual(['111', '222', '333']);
    expect(cfg.claudeCmd).toBe('claude-test');
  });

  it('applies documented defaults when optional vars are omitted', () => {
    const cfg = loadConfig({
      DISCORD_BOT_TOKEN: 'tok',
      CHANNEL_ID: 'chan',
      AGENT_NAME: 'Cosmo',
      AGENT_PERSONA: 'curious agent',
      LISTENER_ID: 'user123',
    });
    expect(cfg.tickIntervalMs).toBe(300000);
    expect(cfg.tickJitterMs).toBe(120000);
    expect(cfg.gatherK).toBe(20);
    expect(cfg.minPostGapMs).toBe(75000);
    expect(cfg.maxPostsPerHour).toBe(12);
    expect(cfg.dailyTokenBudget).toBe(200000);
    expect(cfg.pingPongCooldownMs).toBe(300000);
    expect(cfg.operatorIds).toEqual([]);
    expect(cfg.claudeCmd).toBe('claude');
  });

  it('throws a clear error naming a missing required field', () => {
    expect(() => loadConfig({ CHANNEL_ID: 'chan', AGENT_NAME: 'C', AGENT_PERSONA: 'p' }))
      .toThrowError(/discordBotToken/);
  });

  it('throws a clear error when LISTENER_ID is missing', () => {
    expect(() =>
      loadConfig({
        DISCORD_BOT_TOKEN: 'tok',
        CHANNEL_ID: 'chan',
        AGENT_NAME: 'C',
        AGENT_PERSONA: 'p',
      }),
    ).toThrowError(/listenerId/);
  });
});
