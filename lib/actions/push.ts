"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { sendPush } from "@/lib/push";

const subSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  p256dh: z.string().min(10).max(200),
  auth: z.string().min(10).max(100),
});

export async function subscribePush(input: { endpoint: string; p256dh: string; auth: string }) {
  const userId = await requireUserId();
  const parsed = subSchema.safeParse(input);
  if (!parsed.success) return { error: "This device could not be set up for alerts." };
  const data = parsed.data;
  // A device belongs to whoever signed in last on it.
  await db.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    update: { userId, p256dh: data.p256dh, auth: data.auth },
    create: { userId, ...data },
  });
  return { ok: true as const };
}

export async function unsubscribePush(endpoint: string) {
  const userId = await requireUserId();
  await db.pushSubscription.deleteMany({ where: { endpoint, userId } });
  return { ok: true as const };
}

export async function sendTestPush() {
  const userId = await requireUserId();
  await sendPush(userId, { body: "Alerts are working on your devices.", url: "/notifications", tag: "test" });
  return { ok: true as const };
}
