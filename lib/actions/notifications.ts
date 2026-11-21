"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import type { FormState } from "@/lib/types";

export async function updateNotifications(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  await db.user.update({
    where: { id: userId },
    data: {
      emailMessages: formData.get("emailMessages") === "on",
      emailActivity: formData.get("emailActivity") === "on",
    },
  });
  revalidatePath("/settings");
  return { ok: true };
}
