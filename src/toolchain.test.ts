// ABOUTME: Smoke test that proves the Vitest + TypeScript toolchain runs.
// ABOUTME: Replaced in spirit by real module tests; kept as a fast green canary.
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest under ESM', () => {
    expect(1 + 1).toBe(2);
  });
});
