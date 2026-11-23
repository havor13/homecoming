"use server";

import { notifyModerators } from "@/lib/notifications";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { activeMembership, canAccessThread } from "@/lib/access";
import { storyWhere } from "@/lib/story-queries";
import { REPORT_REASONS, REPORT_TARGETS } from "@/lib/reports";
import type { ReportTargetType } from "@/lib/reports";
import type { FormState } from "@/lib/types";

const schema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
});

const cut = (text: string) => (text.length > 300 ? `${text.slice(0, 300)}...` : text);

/** Finds who and what is being reported, and only if the reporter is allowed to see it. */
async function resolveTarget(
  reporterId: string,
  type: ReportTargetType,
  id: string,
): Promise<{ userId: string | null; snippet: string } | null> {
  switch (type) {
    case "STORY": {
      const story = await db.story.findFirst({
        where: { id, ...(await storyWhere(reporterId)) },
        select: { body: true, authorId: true },
      });
      if (!story) return null;
      return { userId: story.authorId, snippet: cut(story.body) || "(a photo story)" };
    }
    case "POST": {
      const post = await db.post.findUnique({
        where: { id },
        select: { body: true, authorId: true, circleId: true },
      });
      if (!post) return null;
      if (post.circleId && !(await activeMembership(reporterId, post.circleId))) return null;
      return { userId: post.authorId, snippet: cut(post.body) || "(a post with only attachments)" };
    }
    case "COMMENT": {
      const comment = await db.comment.findUnique({
        where: { id },
        select: { body: true, authorId: true, post: { select: { circleId: true } } },
      });
      if (!comment) return null;
      if (comment.post.circleId && !(await activeMembership(reporterId, comment.post.circleId))) return null;
      return { userId: comment.authorId, snippet: cut(comment.body) };
    }
    case "MESSAGE": {
      const message = await db.message.findUnique({
        where: { id },
        select: { body: true, senderId: true, threadId: true },
      });
      if (!message || !(await canAccessThread(reporterId, message.threadId))) return null;
      return { userId: message.senderId, snippet: cut(message.body) || "(a message with only attachments)" };
    }
    case "JOB": {
      const job = await db.job.findUnique({
        where: { id },
        select: { title: true, company: true, description: true, postedById: true },
      });
      if (!job) return null;
      return { userId: job.postedById, snippet: cut(`${job.title} at ${job.company}. ${job.description}`) };
    }
    case "USER": {
      const user = await db.user.findUnique({ where: { id }, select: { name: true, bio: true } });
      if (!user) return null;
      return { userId: id, snippet: cut(`${user.name}${user.bio ? `: ${user.bio}` : ""}`) };
    }
  }
}

export async function createReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const reporterId = await requireUserId();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { targetType, targetId, reason, note } = parsed.data;

  const target = await resolveTarget(reporterId, targetType, targetId);
  if (!target) return { error: "That could not be found, or you can't see it." };
  if (target.userId === reporterId) return { error: "You can't report your own content." };

  const duplicate = await db.report.findFirst({
    where: { reporterId, targetType, targetId, status: "OPEN" },
  });
  if (duplicate) return { error: "You already reported this. A moderator will look at it." };

  const today = await db.report.count({
    where: { reporterId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (today >= 10) return { error: "You have sent a lot of reports today. Please try again tomorrow." };

  await db.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      targetUserId: target.userId,
      reason,
      note: note || null,
      snippet: target.snippet,
    },
  });
  await notifyModerators("A new report needs review", "/admin/reports");
  return { ok: true };
}
