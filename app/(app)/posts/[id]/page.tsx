import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canViewPost } from "@/lib/access";
import { hiddenUserIds } from "@/lib/privacy";
import { postInclude } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { PostCard } from "@/components/PostCard";
import { isModeratorEmail } from "@/lib/moderation";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  if (!(await canViewPost(userId, id))) notFound();
  const hidden = await hiddenUserIds(userId);

  const post = await db.post.findFirst({
    where: { id, authorId: { notIn: hidden } },
    include: postInclude(hidden),
  });
  if (!post) notFound();

  const adminMembership = post.circleId
    ? await db.membership.findFirst({ where: { userId, circleId: post.circleId, role: "ADMIN", status: "ACTIVE" } })
    : null;

  const viewer = await db.user.findUnique({ where: { id: userId }, select: { email: true } });

  return (
    <>
      <p><Link href={post.circle ? `/circles/${post.circle.slug}` : "/"}>← Back{post.circle ? ` to ${post.circle.name}` : " to Home"}</Link></p>
      <div style={{ maxWidth: 700 }}>
        <PostCard post={post} viewerId={userId} canModerate={!!adminMembership} canPin={!!adminMembership || isModeratorEmail(viewer?.email)} />
      </div>
    </>
  );
}
