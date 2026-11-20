"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { isIndustry } from "@/lib/careers";
import { deleteBlobs, pickFiles, tryUpload } from "@/lib/upload";
import type { FormState } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  missionName: z.string().trim().min(2, "Enter your mission name.").max(120),
  language: z.string().trim().max(60).optional(),
  yearsServed: z.string().trim().max(40).optional(),
  homeCity: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(300, "Your bio can be up to 300 characters.").optional(),
  industry: z
    .string()
    .trim()
    .refine((v) => v === "" || isIndustry(v), "Pick an industry from the list.")
    .optional(),
  jobTitle: z.string().trim().max(100).optional(),
  employer: z.string().trim().max(100).optional(),
  mentorAbout: z.string().trim().max(400, "Keep the mentoring note under 400 characters.").optional(),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const current = await db.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  let avatarUrl = current?.avatarUrl ?? null;
  const oldAvatar = avatarUrl;

  const [avatar] = pickFiles(formData, "avatar");
  if (avatar) {
    if (!avatar.type.startsWith("image/")) return { error: "Your profile picture must be an image." };
    const upload = await tryUpload([avatar], "avatars", userId);
    if (!upload.ok) return { error: upload.error };
    avatarUrl = upload.files[0].url;
  } else if (formData.get("removeAvatar") === "on") {
    avatarUrl = null;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      missionName: data.missionName,
      language: data.language || null,
      yearsServed: data.yearsServed || null,
      homeCity: data.homeCity || null,
      bio: data.bio || null,
      industry: data.industry || null,
      jobTitle: data.jobTitle || null,
      employer: data.employer || null,
      mentorAbout: data.mentorAbout || null,
      lookingForWork: formData.get("lookingForWork") === "on",
      openToMentor: formData.get("openToMentor") === "on",
      avatarUrl,
    },
  });

  if (oldAvatar && oldAvatar !== avatarUrl) await deleteBlobs([oldAvatar]);

  revalidatePath("/", "layout");
  // Show the person how their profile now looks, instead of leaving them in the long form.
  redirect(`/people/${userId}`);
}