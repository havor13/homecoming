"use server";

import { createNotification } from "@/lib/notifications";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function toggleRsvp(eventId: string) {
  const userId = await requireUserId();
  const key = { userId_eventId: { userId, eventId } };
  const existing = await db.rsvp.findUnique({ where: key });
  if (existing) await db.rsvp.delete({ where: key });
  else await db.rsvp.create({ data: { userId, eventId } });
  revalidatePath("/events");
}

export async function createEvent(formData: FormData) {
  const userId = await requireUserId();
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(120),
      location: z.string().trim().min(2).max(120),
      startsAt: z.coerce.date(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db.event.create({ data: { ...parsed.data, hostId: userId } });
  revalidatePath("/events");
}

export async function createInvite() {
  const userId = await requireUserId();
  const me = await db.user.findUnique({ where: { id: userId } });
  // Only verified members can vouch for someone else.
  if (me?.status !== "VERIFIED") return;
  const code = "HOME-" + randomBytes(3).toString("hex").toUpperCase();
  await db.invite.create({ data: { code, issuerId: userId } });
  revalidatePath("/profile");
}

export async function verifyMember(userId: string) {
  const voucherId = await requireUserId();
  const target = await db.user.findUnique({ where: { id: userId } });
  // Only the member who invited someone can confirm them.
  if (!target || target.invitedById !== voucherId) return;
  await db.user.update({ where: { id: userId }, data: { status: "VERIFIED" } });
  await createNotification({
    userId,
    type: "CONFIRMED",
    text: "You have been confirmed. You can now invite other returned missionaries.",
    href: "/invites",
  });
  revalidatePath("/profile");
}
