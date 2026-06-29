// ABOUTME: Thin discord.js shell — wires Discord I/O into the pure runCycle core.
// ABOUTME: Schedules jittered ticks and handles mentions + operator !quiet/!resume.
import { Client, Events, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import type { Config } from './config.js';
import { initialState, setPaused } from './guardrails.js';
import type { ConnectorState } from './guardrails.js';
import type { AgentAdapter, ConvoMessage } from './adapter/types.js';
import { runCycle } from './cycle.js';
import { parseCommand } from './commands.js';
import { logExchange } from './log.js';

export function createConnector(
  config: Config,
  adapter: AgentAdapter,
): { start: () => Promise<void> } {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  let state: ConnectorState = initialState();

  async function fetchRecent(channel: TextChannel): Promise<ConvoMessage[]> {
    const fetched = await channel.messages.fetch({ limit: config.gatherK });
    return [...fetched.values()].reverse().map((m) => ({
      author: m.author.username,
      isSelf: m.author.id === client.user?.id,
      isBot: m.author.bot,
      text: m.content,
    }));
  }

  function scheduleTick(channel: TextChannel): void {
    const delay = config.tickIntervalMs + Math.floor(Math.random() * config.tickJitterMs);
    setTimeout(async () => {
      try {
        const result = await runCycle({
          fetchRecent: () => fetchRecent(channel),
          adapter,
          post: async (text) => {
            await channel.send(text);
          },
          state,
          config,
          now: Date.now(),
          trigger: 'tick',
        });
        state = result.state;
      } catch (err) {
        logExchange(config.agentName, 'tick-error', String(err));
      }
      scheduleTick(channel);
    }, delay);
  }

  client.once(Events.ClientReady, async () => {
    logExchange(config.agentName, 'ready', `connected as ${client.user?.tag ?? '?'}`);
    const channel = await client.channels.fetch(config.channelId);
    if (channel instanceof TextChannel) {
      scheduleTick(channel);
    } else {
      logExchange(config.agentName, 'error', 'configured channel is not a text channel');
    }
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.channelId !== config.channelId) return;

    const command = parseCommand(message.content, message.author.id, config.operatorIds);
    if (command.cmd === 'quiet') {
      state = setPaused(state, true);
      logExchange(config.agentName, 'paused', `by ${message.author.username}`);
      return;
    }
    if (command.cmd === 'resume') {
      state = setPaused(state, false);
      logExchange(config.agentName, 'resumed', `by ${message.author.username}`);
      return;
    }

    if (message.author.id === client.user?.id) return;
    if (!client.user || !message.mentions.has(client.user)) return;
    const channel = message.channel;
    if (!(channel instanceof TextChannel)) return;

    try {
      const result = await runCycle({
        fetchRecent: () => fetchRecent(channel),
        adapter,
        post: async (text) => {
          await message.reply(text);
        },
        state,
        config,
        now: Date.now(),
        trigger: 'mention',
      });
      state = result.state;
    } catch (err) {
      logExchange(config.agentName, 'mention-error', String(err));
    }
  });

  return {
    start: async () => {
      await client.login(config.discordBotToken);
    },
  };
}
