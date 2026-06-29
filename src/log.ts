// ABOUTME: Tiny structured logger that prefixes every line with [party-line].
// ABOUTME: One call site for exchange/guardrail/lifecycle events.
export function logExchange(name: string, action: string, detail: string): void {
  console.log(`[party-line] ${name} ${action}: ${detail}`);
}
