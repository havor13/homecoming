"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isModeratorEmail } from "@/lib/moderation";
import { requireUserId } from "@/lib/session";
import type { FormState } from "@/lib/types";

const schema = z.object({
  note: z.string().trim().max(60, "Keep the note under 60 characters.").optional(),
  count: z.coerce.number().int().min(1).max(20).default(1),
  maxUses: z.coerce.number().int().min(1, "At least 1 person.").max(200).default(1),
  expiryDays: z.coerce.number().int().min(0).max(365).default(0),
});

export async function createInvites(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const me = await db.user.findUnique({ where: { id: userId }, select: { status: true, email: true } });
  if (!me) return { error: "Account not found." };

  const moderator = isModeratorEmail(me.email);
  // Only confirmed members can vouch for someone else. Moderators always can.
  if (me.status !== "VERIFIED" && !moderator) return { error: "You can invite others once you are confirmed." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const count = moderator ? parsed.data.count : 1;
  const maxUses = parsed.data.maxUses;
  if (!moderator && maxUses > 10) return { error: "A code can be shared with up to 10 people." };
  const expiresAt = parsed.data.expiryDays > 0 ? new Date(Date.now() + parsed.data.expiryDays * 86_400_000) : null;
  // Codes shared with several people should not last forever.
  if (maxUses > 1 && !expiresAt) return { error: "Choose how long a shared code stays valid." };

  const unused = await db.invite.count({ where: { issuerId: userId, usedById: null } });
  const limit = moderator ? 100 : 10;
  if (unused + count > limit) {
    return { error: `You can have up to ${limit} unused codes. Remove some, or wait for people to use them.` };
  }

  for (let i = 0; i < count; i++) {
    await db.invite.create({
      data: {
        code: `HOME-${randomBytes(3).toString("hex").toUpperCase()}`,
        issuerId: userId,
        note: parsed.data.note || null,
        maxUses,
        expiresAt,
      },
    });
  }
  revalidatePath("/invites");
  return { ok: true };
}

export async function revokeInvite(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("inviteId") ?? "");
  // Only your own codes. Unused ones are deleted; ones people already joined with just stop accepting new people.
  await db.invite.deleteMany({ where: { id, issuerId: userId, usedById: null, useCount: 0 } });
  await db.invite.updateMany({ where: { id, issuerId: userId, useCount: { gt: 0 } }, data: { expiresAt: new Date() } });
  revalidatePath("/invites");
}
