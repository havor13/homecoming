import { db } from "@/lib/db";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const JOIN_WINDOW_MS = 60 * 60 * 1000;

export const MAX_LOGIN_FAILS_PER_EMAIL = 5;
const MAX_LOGIN_FAILS_PER_IP = 20;
const MAX_JOIN_FAILS_PER_IP = 10;

/** The caller's address as Vercel reports it, or "unknown" if there is none. */
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}

export async function loginBlocked(email: string, ip: string) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const byEmail = await db.loginAttempt.count({ where: { kind: "LOGIN", email, createdAt: { gte: since } } });
  if (byEmail >= MAX_LOGIN_FAILS_PER_EMAIL) return true;
  if (ip === "unknown") return false;
  const byIp = await db.loginAttempt.count({ where: { kind: "LOGIN", ip, createdAt: { gte: since } } });
  return byIp >= MAX_LOGIN_FAILS_PER_IP;
}

export async function joinBlocked(ip: string) {
  if (ip === "unknown") return false;
  const since = new Date(Date.now() - JOIN_WINDOW_MS);
  return (await db.loginAttempt.count({ where: { kind: "JOIN", ip, createdAt: { gte: since } } })) >= MAX_JOIN_FAILS_PER_IP;
}

export async function recordFailure(kind: "LOGIN" | "JOIN", email: string | null, ip: string) {
  await db.loginAttempt.create({ data: { kind, email, ip } });
  // Keep the table small: nothing older than a day is ever needed.
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}

export async function clearLoginFailures(email: string) {
  await db.loginAttempt.deleteMany({ where: { kind: "LOGIN", email } });
}
