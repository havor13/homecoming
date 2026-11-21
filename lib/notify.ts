import { db } from "@/lib/db";
import { appUrl, escapeHtml, layout, sendEmail } from "@/lib/email";

const settingsFooter = () =>
  `You can turn these emails off in <a href="${appUrl()}/settings">your settings</a>. Homecoming is an independent community, not affiliated with The Church of Jesus Christ of Latter-day Saints.`;

async function blockedBetween(a: string, b: string) {
  return !!(await db.block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { blockerId: true },
  }));
}

/** Emails the other people in a direct or group chat, at most once every 30 minutes per conversation. */
export async function notifyNewMessage(threadId: string, senderId: string) {
  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: { circleId: true, title: true },
  });
  if (!thread || thread.circleId) return; // circle chats are too busy to email about

  const sender = await db.user.findUnique({ where: { id: senderId }, select: { name: true } });
  if (!sender) return;

  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const members = await db.threadMember.findMany({
    where: {
      threadId,
      userId: { not: senderId },
      user: { emailMessages: true, suspendedAt: null },
      OR: [{ lastEmailedAt: null }, { lastEmailedAt: { lt: cutoff } }],
    },
    select: { userId: true, user: { select: { email: true, name: true } } },
  });

  for (const m of members) {
    if (await blockedBetween(m.userId, senderId)) continue;
    await db.threadMember.update({
      where: { threadId_userId: { threadId, userId: m.userId } },
      data: { lastEmailedAt: new Date() },
    });
    const where = thread.title ? ` in ${thread.title}` : "";
    const url = `${appUrl()}/messages?t=${threadId}`;
    await sendEmail({
      to: m.user.email,
      subject: `${sender.name} sent you a message${where}`,
      text: `${sender.name} sent you a message${where} on Homecoming.\n\nOpen it: ${url}\n\nTurn these emails off: ${appUrl()}/settings`,
      html: layout({
        heading: "You have a new message",
        body: `<p><strong>${escapeHtml(sender.name)}</strong> sent you a message${escapeHtml(where)}.</p>`,
        buttonLabel: "Read it",
        buttonUrl: url,
        footer: settingsFooter(),
      }),
    });
  }
}

/** Emails a post's author when someone else comments. */
export async function notifyComment(postId: string, commenterId: string) {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true, author: { select: { email: true, emailActivity: true, suspendedAt: true } } },
  });
  if (!post || post.authorId === commenterId) return;
  if (!post.author.emailActivity || post.author.suspendedAt) return;
  if (await blockedBetween(post.authorId, commenterId)) return;

  const commenter = await db.user.findUnique({ where: { id: commenterId }, select: { name: true } });
  if (!commenter) return;

  const url = `${appUrl()}/`;
  await sendEmail({
    to: post.author.email,
    subject: `${commenter.name} commented on your post`,
    text: `${commenter.name} commented on your post on Homecoming.\n\nOpen Homecoming: ${url}\n\nTurn these emails off: ${appUrl()}/settings`,
    html: layout({
      heading: "New comment on your post",
      body: `<p><strong>${escapeHtml(commenter.name)}</strong> commented on your post.</p>`,
      buttonLabel: "See the comment",
      buttonUrl: url,
      footer: settingsFooter(),
    }),
  });
}

/** Emails a mentor when someone asks for mentoring. */
export async function notifyMentorRequest(mentorId: string, fromId: string, threadId: string) {
  const [mentor, from] = await Promise.all([
    db.user.findUnique({ where: { id: mentorId }, select: { email: true, emailActivity: true, suspendedAt: true } }),
    db.user.findUnique({ where: { id: fromId }, select: { name: true } }),
  ]);
  if (!mentor || !from || !mentor.emailActivity || mentor.suspendedAt) return;

  const url = `${appUrl()}/messages?t=${threadId}`;
  await sendEmail({
    to: mentor.email,
    subject: `${from.name} would like your mentoring`,
    text: `${from.name} asked for mentoring on Homecoming.\n\nRead the request: ${url}\n\nTurn these emails off: ${appUrl()}/settings`,
    html: layout({
      heading: "A mentoring request",
      body: `<p><strong>${escapeHtml(from.name)}</strong> asked you for mentoring.</p>`,
      buttonLabel: "Read the request",
      buttonUrl: url,
      footer: settingsFooter(),
    }),
  });
}
