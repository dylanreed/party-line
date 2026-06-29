// ABOUTME: Bundled Claude Code adapter — shells to `claude -p` via an injected
// ABOUTME: runner, parses PASS vs a real message, and carries token usage through.
import type { AgentAdapter, AgentContext, AgentReply } from './types.js';

export type Runner = (
  cmd: string,
  args: string[],
  input: string,
) => Promise<{ stdout: string; usageTokens?: number }>;

function renderPrompt(ctx: AgentContext): string {
  const transcript = ctx.transcript.map((m) => `${m.author}: ${m.text}`).join('\n');
  return `${ctx.persona}\n\n${ctx.instruction}\n\nConversation:\n${transcript}`;
}

export class ClaudeCodeAdapter implements AgentAdapter {
  constructor(private readonly opts: { claudeCmd: string; runner: Runner }) {}

  async respond(ctx: AgentContext): Promise<AgentReply> {
    const prompt = renderPrompt(ctx);
    const { stdout, usageTokens } = await this.opts.runner(
      this.opts.claudeCmd,
      ['-p', '--dangerously-skip-permissions', prompt],
      '',
    );
    const trimmed = stdout.trim();
    // Empty/whitespace output means nothing to add — treat as PASS, never post a blank.
    if (trimmed === '' || /^PASS\b/.test(trimmed)) {
      return { kind: 'pass', tokensUsed: usageTokens };
    }
    return { kind: 'message', text: trimmed, tokensUsed: usageTokens };
  }
}
