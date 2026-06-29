// ABOUTME: Pure decision function mapping Discord messages to connector pause/resume actions.
// ABOUTME: Enforces operator/owner scoping rules before recognizing any command.

export interface CommandIdentity {
  operatorIds: string[];
  ownerId: string;
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
  const isOwner = authorId === id.ownerId;
  const targetsMe = mentionedBotIds.includes(id.selfBotId);

  if (verb === '!quiet') return isOperator ? 'pause' : null;
  if (verb === '!resume') return isOperator ? 'resume' : null;

  if (verb === '!pause' || verb === '!unpause') {
    const action = verb === '!pause' ? 'pause' : 'resume';
    if (isOperator && mentionedBotIds.length > 0) return targetsMe ? action : null;
    if (isOwner) return action;
    return null;
  }
  return null;
}
