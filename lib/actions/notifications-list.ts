"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function clearNotifications() {
  const userId = await requireUserId();
  await db.notification.deleteMany({ where: { userId } });
  revalidatePath("/notifications");
}
