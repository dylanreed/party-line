// ABOUTME: Pure guardrail logic — the safety core that decides if the agent may
// ABOUTME: speak (loop-breaker, rate, cost, pause) and records each post.
import type { Config } from './config.js';
import type { ConvoMessage } from './adapter/types.js';

const HOUR_MS = 3_600_000;

export interface ConnectorState {
  lastPostAt: number | null;
  postTimestamps: number[];
  spentTokensToday: number;
  dayStamp: string;
  paused: boolean;
}

export function initialState(): ConnectorState {
  return {
    lastPostAt: null,
    postTimestamps: [],
    spentTokensToday: 0,
    dayStamp: '',
    paused: false,
  };
}

function dayStampFor(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function canSpeak(
  state: ConnectorState,
  config: Config,
  now: number,
  trigger: 'tick' | 'mention',
  recent: ConvoMessage[],
): { allowed: boolean; reason?: string } {
  void trigger; // reserved for future per-trigger policy; v1 applies guardrails uniformly
  if (state.paused) {
    return { allowed: false, reason: 'paused' };
  }
  const spentToday = dayStampFor(now) === state.dayStamp ? state.spentTokensToday : 0;
  if (spentToday >= config.dailyTokenBudget) {
    return { allowed: false, reason: 'daily token budget reached' };
  }
  if (state.lastPostAt !== null && now - state.lastPostAt < config.minPostGapMs) {
    return { allowed: false, reason: 'min gap' };
  }
  const postsThisHour = state.postTimestamps.filter((t) => now - t < HOUR_MS).length;
  if (postsThisHour >= config.maxPostsPerHour) {
    return { allowed: false, reason: 'hourly cap' };
  }
  const last = recent[recent.length - 1];
  if (last && last.isSelf) {
    return { allowed: false, reason: 'would reply to self' };
  }
  const last4 = recent.slice(-4);
  if (last4.length === 4) {
    const alternating = last4.every((m, i) => i === 0 || m.isSelf !== last4[i - 1].isSelf);
    const others = last4.filter((m) => !m.isSelf);
    const otherAuthors = new Set(others.map((m) => m.author));
    const othersAllBots = others.every((m) => m.isBot);
    if (alternating && otherAuthors.size === 1 && othersAllBots) {
      return { allowed: false, reason: 'ping-pong cooldown' };
    }
  }
  return { allowed: true };
}

export function recordPost(state: ConnectorState, tokensUsed: number, now: number): ConnectorState {
  const day = dayStampFor(now);
  const rolled = day !== state.dayStamp;
  const priorTimestamps = rolled ? [] : state.postTimestamps;
  const priorSpent = rolled ? 0 : state.spentTokensToday;
  return {
    ...state,
    lastPostAt: now,
    postTimestamps: [...priorTimestamps, now].filter((t) => now - t < HOUR_MS),
    spentTokensToday: priorSpent + tokensUsed,
    dayStamp: day,
  };
}

export function setPaused(state: ConnectorState, paused: boolean): ConnectorState {
  return { ...state, paused };
}
