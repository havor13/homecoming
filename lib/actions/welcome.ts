"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function dismissWelcome() {
  const userId = await requireUserId();
  await db.user.update({ where: { id: userId }, data: { welcomeDismissed: true } });
  revalidatePath("/");
}
