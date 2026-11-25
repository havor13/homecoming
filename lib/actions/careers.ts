"use server";

import { after } from "next/server";
import { notifyMentorRequest } from "@/lib/notify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { findOrCreateDirectThread } from "@/lib/threads";
import { canMessage } from "@/lib/privacy";
import { JOB_TYPES } from "@/lib/careers";
import { deleteBlobs, pickFiles, tryUpload } from "@/lib/upload";
import type { FormState } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

const jobSchema = z.object({
  title: z.string().trim().min(3, "Add a job title.").max(100),
  company: z.string().trim().min(2, "Add the company name.").max(100),
  location: z.string().trim().min(2, "Add a location, or write Remote.").max(100),
  type: z.enum(JOB_TYPES),
  description: z.string().trim().min(30, "Describe the role in at least 30 characters.").max(3000),
  applyUrl: z.string().trim().max(500).optional(),
});

function cleanUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const me = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (me?.status !== "VERIFIED") {
    return { error: "You can post jobs once the member who invited you has confirmed you." };
  }

  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const applyUrl = cleanUrl(data.applyUrl);
  if (applyUrl === undefined) return { error: "The apply link must start with http:// or https://." };

  // Keeps the board useful: a handful of new listings per person per day.
  const today = await db.job.count({
    where: { postedById: userId, createdAt: { gte: new Date(Date.now() - DAY) } },
  });
  if (today >= 5) return { error: "You can post up to 5 jobs a day. Try again tomorrow." };

  const upload = await tryUpload(pickFiles(formData, "files"), "jobs", userId);
  if (!upload.ok) return { error: upload.error };

  await db.job.create({
    data: {
      attachments: { create: upload.files },
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type,
      description: data.description,
      applyUrl,
      remote: formData.get("remote") === "on",
      canRefer: formData.get("canRefer") === "on",
      postedById: userId,
    },
  });
  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function deleteJob(jobId: string) {
  const userId = await requireUserId();
  const job = await db.job.findFirst({ where: { id: jobId, postedById: userId }, include: { attachments: true } });
  if (!job) return;
  await db.job.delete({ where: { id: job.id } });
  await deleteBlobs(job.attachments.map((a) => a.url));
  revalidatePath("/jobs");
}

const requestSchema = z.object({
  mentorId: z.string().min(1),
  note: z
    .string()
    .trim()
    .min(20, "Tell them a little about what you would like help with (at least 20 characters).")
    .max(1000, "Keep it under 1,000 characters."),
});

/** Sends a first message to a mentor, with limits so nobody can be flooded. */
export async function requestMentoring(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { mentorId, note } = parsed.data;

  if (mentorId === userId) return { error: "You can't ask yourself." };

  const mentor = await db.user.findUnique({
    where: { id: mentorId },
    select: { id: true, name: true, openToMentor: true },
  });
  if (!mentor?.openToMentor) return { error: "That member is not taking mentoring requests." };
  if (!(await canMessage(userId, mentorId))) return { error: "That member isn't accepting messages from you." };

  const sentToday = await db.mentorRequest.count({
    where: { fromId: userId, createdAt: { gte: new Date(Date.now() - DAY) } },
  });
  if (sentToday >= 5) return { error: "You can send up to 5 mentoring requests a day." };

  const alreadyAsked = await db.mentorRequest.findFirst({
    where: { fromId: userId, toId: mentorId, createdAt: { gte: new Date(Date.now() - 7 * DAY) } },
  });
  if (alreadyAsked) return { error: `You already asked ${mentor.name} this week. Give them a few days to reply.` };

  const thread = await findOrCreateDirectThread(userId, mentorId);
  await db.message.create({
    data: { threadId: thread.id, senderId: userId, body: `Mentoring request: ${note}` },
  });
  await db.mentorRequest.create({ data: { fromId: userId, toId: mentorId } });
  after(() => notifyMentorRequest(mentorId, userId, thread.id));

  revalidatePath("/", "layout");
  redirect(`/messages?t=${thread.id}`);
}
