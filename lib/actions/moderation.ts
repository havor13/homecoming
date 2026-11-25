"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isModeratorEmail, requireModerator } from "@/lib/moderation";
import { deleteBlobs } from "@/lib/upload";

function refresh() {
  revalidatePath("/admin/reports");
}

export async function dismissReport(reportId: string) {
  const moderatorId = await requireModerator();
  await db.report.updateMany({
    where: { id: reportId, status: "OPEN" },
    data: { status: "DISMISSED", resolvedById: moderatorId, resolvedAt: new Date() },
  });
  refresh();
}

/** Deletes the reported post, comment, message or job, and closes every open report about it. */
export async function removeReportedContent(reportId: string) {
  const moderatorId = await requireModerator();
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) return;

  switch (report.targetType) {
    case "STORY": {
      const story = await db.story.findUnique({ where: { id: report.targetId }, select: { id: true, imageUrl: true } });
      if (story) {
        await db.story.delete({ where: { id: story.id } });
        if (story.imageUrl) await deleteBlobs([story.imageUrl]);
      }
      break;
    }
    case "POST": {
      const post = await db.post.findUnique({ where: { id: report.targetId }, include: { attachments: true } });
      if (post) {
        await db.post.delete({ where: { id: post.id } });
        await deleteBlobs(post.attachments.map((a) => a.url));
      }
      break;
    }
    case "COMMENT":
      await db.comment.deleteMany({ where: { id: report.targetId } });
      break;
    case "MESSAGE": {
      const message = await db.message.findUnique({ where: { id: report.targetId }, include: { attachments: true } });
      if (message) {
        await db.message.delete({ where: { id: message.id } });
        await deleteBlobs(message.attachments.map((a) => a.url));
      }
      break;
    }
    case "JOB": {
      const job = await db.job.findUnique({ where: { id: report.targetId }, include: { attachments: true } });
      if (job) {
        await db.job.delete({ where: { id: job.id } });
        await deleteBlobs(job.attachments.map((a) => a.url));
      }
      break;
    }
    default:
      return; // A member report has no content to remove.
  }

  await db.report.updateMany({
    where: { targetType: report.targetType, targetId: report.targetId, status: "OPEN" },
    data: { status: "ACTIONED", resolvedById: moderatorId, resolvedAt: new Date() },
  });
  refresh();
}

/** Suspends the member behind a report. They are signed out of everything and cannot sign back in. */
export async function suspendReportedUser(reportId: string) {
  const moderatorId = await requireModerator();
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report?.targetUserId) return;

  const target = await db.user.findUnique({
    where: { id: report.targetUserId },
    select: { id: true, email: true },
  });
  // Moderators cannot be suspended through a report.
  if (!target || isModeratorEmail(target.email)) return;

  await db.user.update({ where: { id: target.id }, data: { suspendedAt: new Date() } });
  await db.report.updateMany({
    where: { targetUserId: target.id, status: "OPEN" },
    data: { status: "ACTIONED", resolvedById: moderatorId, resolvedAt: new Date() },
  });
  refresh();
}

export async function unsuspendUser(userId: string) {
  await requireModerator();
  await db.user.updateMany({ where: { id: userId }, data: { suspendedAt: null } });
  refresh();
}
