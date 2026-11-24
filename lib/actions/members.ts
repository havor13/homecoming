"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isModeratorEmail, requireModerator } from "@/lib/moderation";
import { createNotification } from "@/lib/notifications";

function refresh() {
  revalidatePath("/admin/members");
}

export async function suspendMember(userId: string) {
  const moderatorId = await requireModerator();
  if (userId === moderatorId) return;
  const target = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  // Moderators can't be suspended from here.
  if (!target || isModeratorEmail(target.email)) return;
  await db.user.update({ where: { id: userId }, data: { suspendedAt: new Date() } });
  refresh();
}

export async function unsuspendMember(userId: string) {
  await requireModerator();
  await db.user.updateMany({ where: { id: userId }, data: { suspendedAt: null } });
  refresh();
}

/** For a member whose inviter is gone or slow to confirm them. */
export async function confirmMember(userId: string) {
  await requireModerator();
  const result = await db.user.updateMany({ where: { id: userId, status: "PENDING" }, data: { status: "VERIFIED" } });
  if (result.count > 0) {
    await createNotification({
      userId,
      type: "CONFIRMED",
      text: "You have been confirmed. You can now invite other returned missionaries.",
      href: "/invites",
    });
  }
  refresh();
}
