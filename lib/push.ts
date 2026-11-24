import webpush from "web-push";
import { db } from "@/lib/db";

export type PushPayload = { title?: string; body: string; url: string; tag?: string };

let configured: boolean | null = null;

function configure() {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:homecomingrm@gmail.com";
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (e) {
    console.error("Push is not set up correctly:", e);
    configured = false;
  }
  return configured;
}

/**
 * Sends a push alert to every device a person has turned alerts on for.
 * It never throws, so a push problem can never break posting, commenting or messaging.
 * Devices that have gone away are removed.
 */
export async function sendPush(userId: string, payload: PushPayload) {
  try {
    if (!configure()) return;
    const subs = await db.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return;
    const body = JSON.stringify({ title: "Homecoming", ...payload });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
            TTL: 60 * 60 * 24,
            timeout: 5000,
          });
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await db.pushSubscription.deleteMany({ where: { id: s.id } });
          else console.error("Push failed:", status ?? e);
        }
      }),
    );
  } catch (e) {
    console.error("Push error:", e);
  }
}
