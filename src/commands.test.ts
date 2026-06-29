// ABOUTME: Tests for commandForSelf — per-connector scoped pause/resume decisions.
// ABOUTME: Pure parsing; no Discord objects involved.
import { describe, it, expect } from 'vitest';
import { commandForSelf } from './commands.js';
import type { CommandIdentity } from './commands.js';

const id: CommandIdentity = {
  operatorIds: ['op1', 'op2'],
  ownerId: 'owner1',
  selfBotId: 'bot1',
};
const otherId: CommandIdentity = { ...id, selfBotId: 'bot2' };

describe('commandForSelf', () => {
  describe('!quiet (global, operator-only)', () => {
    it('returns pause for an operator', () => {
      expect(commandForSelf('!quiet', 'op1', [], id)).toBe('pause');
    });
    it('returns null for a non-operator', () => {
      expect(commandForSelf('!quiet', 'rando', [], id)).toBeNull();
    });
  });

  describe('!resume (global, operator-only)', () => {
    it('returns resume for an operator', () => {
      expect(commandForSelf('!resume', 'op1', [], id)).toBe('resume');
    });
    it('returns null for a non-operator', () => {
      expect(commandForSelf('!resume', 'rando', [], id)).toBeNull();
    });
  });

  describe('!pause / !unpause (per-agent)', () => {
    it('owner with no mention → pause', () => {
      expect(commandForSelf('!pause', 'owner1', [], id)).toBe('pause');
    });
    it('owner with no mention → !unpause → resume', () => {
      expect(commandForSelf('!unpause', 'owner1', [], id)).toBe('resume');
    });
    it('operator mentioning me → pause', () => {
      expect(commandForSelf('!pause @bot1', 'op1', ['bot1'], id)).toBe('pause');
    });
    it('operator mentioning me → !unpause → resume', () => {
      expect(commandForSelf('!unpause @bot1', 'op1', ['bot1'], id)).toBe('resume');
    });
    it('operator mentioning a different bot → null (not me)', () => {
      expect(commandForSelf('!pause @bot99', 'op1', ['bot99'], id)).toBeNull();
    });
    it('non-owner non-operator → null', () => {
      expect(commandForSelf('!pause', 'rando', [], id)).toBeNull();
    });
    it('non-operator mentioning me → null (only operators can target others)', () => {
      expect(commandForSelf('!pause @bot1', 'rando', ['bot1'], id)).toBeNull();
    });
    it('operator with NO mention falls through to owner rule: op owns this bot → pause', () => {
      const idOpIsOwner: CommandIdentity = { ...id, ownerId: 'op1' };
      expect(commandForSelf('!pause', 'op1', [], idOpIsOwner)).toBe('pause');
    });
    it('operator with NO mention but is NOT owner → null', () => {
      expect(commandForSelf('!pause', 'op1', [], id)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns null for a non-command message', () => {
      expect(commandForSelf('hello everyone', 'op1', [], id)).toBeNull();
    });
    it('is case-insensitive and trims whitespace', () => {
      expect(commandForSelf('  !QUIET  ', 'op1', [], id)).toBe('pause');
      expect(commandForSelf('  !RESUME  ', 'op1', [], id)).toBe('resume');
      expect(commandForSelf('  !PAUSE  ', 'owner1', [], id)).toBe('pause');
      expect(commandForSelf('  !UNPAUSE  ', 'owner1', [], id)).toBe('resume');
    });
  });
});
