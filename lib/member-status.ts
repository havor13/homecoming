export const STATUS_MAX = 100;
const SHOW_FOR_DAYS = 14;

/** The person's status line, or null if empty or older than two weeks. */
export function currentStatus(u: { statusText?: string | null; statusUpdatedAt?: Date | null }): string | null {
  if (!u.statusText || !u.statusUpdatedAt) return null;
  const age = Date.now() - u.statusUpdatedAt.getTime();
  return age > SHOW_FOR_DAYS * 24 * 60 * 60 * 1000 ? null : u.statusText;
}
