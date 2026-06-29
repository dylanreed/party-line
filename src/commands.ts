// ABOUTME: Pure parser for operator kill-switch commands (!quiet/!pause/!resume).
// ABOUTME: Enforces the operator allowlist before recognizing any command.
export function parseCommand(
  content: string,
  authorId: string,
  operatorIds: string[],
): { cmd: 'quiet' | 'resume' | null } {
  if (!operatorIds.includes(authorId)) {
    return { cmd: null };
  }
  const normalized = content.trim().toLowerCase();
  if (normalized === '!quiet' || normalized === '!pause') {
    return { cmd: 'quiet' };
  }
  if (normalized === '!resume') {
    return { cmd: 'resume' };
  }
  return { cmd: null };
}
