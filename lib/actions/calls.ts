"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { canAccessThread } from "@/lib/access";
import { livekitConfigured, participantCount } from "@/lib/livekit";

/** Starts a call in a chat: posts a "started a call" note, then opens the call screen. */
export async function startCall(threadId: string, mode: "video" | "audio") {
  const userId = await requireUserId();
  if (!(await canAccessThread(userId, threadId))) return;

  const safeMode = mode === "audio" ? "audio" : "video";

  if (livekitConfigured()) {
    // Only announce the call if nobody is in it yet, so joining never spams the chat.
    const inCall = await participantCount(threadId);
    if (inCall === 0) {
      await db.message.create({
        data: {
          threadId,
          senderId: userId,
          kind: "CALL",
          body: safeMode === "video" ? "Started a video call" : "Started a voice call",
        },
      });
      revalidatePath("/", "layout");
    }
  }

  redirect(`/call/${threadId}?mode=${safeMode}`);
}
