// ABOUTME: Loads and validates the connector's runtime config from an env object.
// ABOUTME: Uses zod for coercion/defaults and throws a clear error on bad input.
import { z } from 'zod';

const schema = z.object({
  discordBotToken: z.string().min(1),
  channelId: z.string().min(1),
  agentName: z.string().min(1),
  agentPersona: z.string().min(1),
  tickIntervalMs: z.coerce.number().int().positive().default(300000),
  tickJitterMs: z.coerce.number().int().nonnegative().default(120000),
  gatherK: z.coerce.number().int().positive().default(20),
  minPostGapMs: z.coerce.number().int().nonnegative().default(75000),
  maxPostsPerHour: z.coerce.number().int().positive().default(12),
  dailyTokenBudget: z.coerce.number().int().positive().default(200000),
  operatorIds: z
    .string()
    .optional()
    .default('')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  claudeCmd: z.string().min(1).default('claude'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: Record<string, string | undefined>): Config {
  const parsed = schema.safeParse({
    discordBotToken: env.DISCORD_BOT_TOKEN,
    channelId: env.CHANNEL_ID,
    agentName: env.AGENT_NAME,
    agentPersona: env.AGENT_PERSONA,
    tickIntervalMs: env.TICK_INTERVAL_MS,
    tickJitterMs: env.TICK_JITTER_MS,
    gatherK: env.GATHER_K,
    minPostGapMs: env.MIN_POST_GAP_MS,
    maxPostsPerHour: env.MAX_POSTS_PER_HOUR,
    dailyTokenBudget: env.DAILY_TOKEN_BUDGET,
    operatorIds: env.OPERATOR_IDS,
    claudeCmd: env.CLAUDE_CMD,
  });
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid Party Line config: ${detail}`);
  }
  return parsed.data;
}
