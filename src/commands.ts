// ABOUTME: Pure decision function mapping Discord messages to connector pause/resume actions.
// ABOUTME: Enforces operator/listener scoping rules before recognizing any command.

export interface CommandIdentity {
  operatorIds: string[];
  listenerId: string;
  selfBotId: string;
}

export function commandForSelf(
  content: string,
  authorId: string,
  mentionedBotIds: string[],
  id: CommandIdentity,
): 'pause' | 'resume' | null {
  const lower = content.trim().toLowerCase();
  const verb = lower.split(/\s+/)[0];
  const isOperator = id.operatorIds.includes(authorId);
  const isListener = authorId === id.listenerId;
  const targetsMe = mentionedBotIds.includes(id.selfBotId);

  if (verb === '!quiet') return isOperator ? 'pause' : null;
  if (verb === '!resume') return isOperator ? 'resume' : null;

  if (verb === '!pause' || verb === '!unpause') {
    const action = verb === '!pause' ? 'pause' : 'resume';
    if (isOperator && mentionedBotIds.length > 0) return targetsMe ? action : null;
    if (isListener) return action; // listener can pause their own
    return null;
  }
  return null;
}
