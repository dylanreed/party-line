// ABOUTME: Tests for parseCommand — operator allowlist and the kill-switch verbs.
// ABOUTME: Pure parsing; no Discord objects involved.
import { describe, it, expect } from 'vitest';
import { parseCommand } from './commands.js';

const ops = ['op1', 'op2'];

describe('parseCommand', () => {
  it('maps !quiet and !pause to quiet for an operator', () => {
    expect(parseCommand('!quiet', 'op1', ops)).toEqual({ cmd: 'quiet' });
    expect(parseCommand('!pause', 'op2', ops)).toEqual({ cmd: 'quiet' });
  });

  it('maps !resume to resume for an operator', () => {
    expect(parseCommand('!resume', 'op1', ops)).toEqual({ cmd: 'resume' });
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(parseCommand('  !QUIET  ', 'op1', ops)).toEqual({ cmd: 'quiet' });
  });

  it('ignores commands from non-operators', () => {
    expect(parseCommand('!quiet', 'rando', ops)).toEqual({ cmd: null });
  });

  it('returns null for non-command content', () => {
    expect(parseCommand('hello everyone', 'op1', ops)).toEqual({ cmd: null });
  });
});
