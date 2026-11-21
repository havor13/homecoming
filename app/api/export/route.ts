import { auth } from "@/auth";
import { db } from "@/lib/db";

// "Download my data": everything the signed-in person has put into Homecoming, as one JSON file.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Please sign in.", { status: 401 });

  const [profile, posts, comments, messages, circles, jobs, events, blocks, stories] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      // Everything except the password hash.
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        missionName: true,
        language: true,
        yearsServed: true,
        homeCity: true,
        bio: true,
        industry: true,
        jobTitle: true,
        employer: true,
        lookingForWork: true,
        openToMentor: true,
        mentorAbout: true,
        profileVisibility: true,
        whoCanMessage: true,
        showHomeCity: true,
        status: true,
        createdAt: true,
      },
    }),
    db.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, circleId: true, createdAt: true, attachments: { select: { name: true, url: true } } },
    }),
    db.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, postId: true, body: true, createdAt: true },
    }),
    db.message.findMany({
      where: { senderId: userId, kind: "TEXT" },
      orderBy: { createdAt: "asc" },
      select: { id: true, threadId: true, body: true, createdAt: true, attachments: { select: { name: true, url: true } } },
    }),
    db.membership.findMany({
      where: { userId },
      select: { role: true, status: true, joinedAt: true, circle: { select: { name: true, slug: true } } },
    }),
    db.job.findMany({ where: { postedById: userId }, orderBy: { createdAt: "asc" } }),
    db.rsvp.findMany({ where: { userId }, select: { event: { select: { title: true, location: true, startsAt: true } } } }),
    db.block.findMany({ where: { blockerId: userId }, select: { blockedId: true, createdAt: true } }),
    db.story.findMany({ where: { authorId: userId }, select: { body: true, imageUrl: true, createdAt: true, expiresAt: true } }),
  ]);

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      note: "Your own profile and everything you posted. Other people's messages to you are not included.",
      profile,
      posts,
      comments,
      messagesYouSent: messages,
      circles,
      jobsYouPosted: jobs,
      eventsYouJoined: events,
      peopleYouBlocked: blocks,
      activeStories: stories,
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="homecoming-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
