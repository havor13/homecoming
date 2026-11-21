"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { STATUS_MAX } from "@/lib/member-status";
import type { FormState } from "@/lib/types";

const schema = z.object({
  statusText: z.string().trim().max(STATUS_MAX, `Keep your status under ${STATUS_MAX} characters.`),
});

/** Sets the status line. An empty value clears it. */
export async function updateStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = schema.safeParse({ statusText: formData.get("statusText") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const text = parsed.data.statusText;
  await db.user.update({
    where: { id: userId },
    data: text ? { statusText: text, statusUpdatedAt: new Date() } : { statusText: null, statusUpdatedAt: null },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
