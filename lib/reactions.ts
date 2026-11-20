// Shared by server and client code, so it must not import anything server-only.

/** The emojis people can react with. The server rejects anything else. */
export const REACTIONS = ["👍", "❤️", "🙏", "😂", "😮", "😢", "🎉", "🔥"] as const;

export type ReactionSummary = { emoji: string; count: number; mine: boolean };

/** Turns raw reaction rows into one entry per emoji, in the order they first appeared. */
export function summarize(rows: { emoji: string; userId: string }[], viewerId: string): ReactionSummary[] {
  const byEmoji = new Map<string, ReactionSummary>();
  for (const r of rows) {
    const entry = byEmoji.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    entry.count += 1;
    if (r.userId === viewerId) entry.mine = true;
    byEmoji.set(r.emoji, entry);
  }
  return [...byEmoji.values()];
}
