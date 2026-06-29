// ABOUTME: The pure, injectable orchestration core — fetch, gate, ask, post, record.
// ABOUTME: Contains all decide-and-respond logic so it is testable without Discord.
import type { Config } from './config.js';
import { canSpeak, recordPost } from './guardrails.js';
import type { ConnectorState } from './guardrails.js';
import { buildContext } from './context.js';
import type { AgentAdapter, ConvoMessage } from './adapter/types.js';
import { logExchange } from './log.js';

export interface CycleDeps {
  fetchRecent: () => Promise<ConvoMessage[]>;
  adapter: AgentAdapter;
  post: (text: string) => Promise<void>;
  state: ConnectorState;
  config: Config;
  now: number;
  trigger: 'tick' | 'mention';
}

export async function runCycle(
  deps: CycleDeps,
): Promise<{ state: ConnectorState; posted: boolean; reason?: string }> {
  const recent = await deps.fetchRecent();
  const gate = canSpeak(deps.state, deps.config, deps.now, deps.trigger, recent);
  if (!gate.allowed) {
    logExchange(deps.config.agentName, 'blocked', gate.reason ?? '');
    return { state: deps.state, posted: false, reason: gate.reason };
  }
  const ctx = buildContext(recent, deps.config.agentPersona);
  const reply = await deps.adapter.respond(ctx);
  if (reply.kind === 'pass') {
    logExchange(deps.config.agentName, 'pass', '');
    return { state: deps.state, posted: false, reason: 'pass' };
  }
  await deps.post(reply.text);
  const state = recordPost(deps.state, reply.tokensUsed ?? 0, deps.now);
  logExchange(deps.config.agentName, 'posted', reply.text);
  return { state, posted: true };
}
