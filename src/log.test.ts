// ABOUTME: Test for logExchange — verifies the bracketed [party-line] line format.
// ABOUTME: Spies on console.log; no real output assertions beyond the message.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { logExchange } from './log.js';

afterEach(() => vi.restoreAllMocks());

describe('logExchange', () => {
  it('writes a bracketed party-line line', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logExchange('Cosmo', 'posted', 'hello world');
    expect(spy).toHaveBeenCalledWith('[party-line] Cosmo posted: hello world');
  });
});
