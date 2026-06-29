// ABOUTME: Entry point — loads config, builds the Claude Code adapter over a real
// ABOUTME: child_process runner, constructs the connector, and starts the bot.
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { loadConfig } from './config.js';
import { ClaudeCodeAdapter } from './adapter/claude-code.js';
import type { Runner } from './adapter/claude-code.js';
import { createConnector } from './connector.js';
import { logExchange } from './log.js';

const nodeRunner: Runner = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout });
      else reject(new Error(`${cmd} exited ${code}: ${(stderr || stdout).trim().slice(0, 600)}`));
    });
  });

const config = loadConfig(process.env);
const adapter = new ClaudeCodeAdapter({ claudeCmd: config.claudeCmd, runner: nodeRunner });
const connector = createConnector(config, adapter);

connector.start().catch((err) => {
  logExchange(config.agentName, 'fatal', String(err));
  process.exit(1);
});
