import Link from "next/link";
import { deleteComment, deletePost } from "@/lib/actions/posts";
import { startDirectThread } from "@/lib/actions/chat";
import { currentStatus } from "@/lib/member-status";
import { timeAgo } from "@/lib/format";
import { summarize } from "@/lib/reactions";
import type { PostWithMeta } from "@/lib/queries";
import { Attachments } from "./Attachments";
import { Avatar } from "./Avatar";
import { CommentForm } from "./CommentForm";
import { ReactionBar } from "./ReactionBar";
import { ReportButton } from "./ReportButton";

export function PostCard({
  post,
  viewerId,
  canModerate,
}: {
  post: PostWithMeta;
  viewerId: string;
  canModerate: boolean;
}) {
  const canDelete = post.authorId === viewerId || canModerate;

  return (
    <article className="card">
      <div className="row">
        <Avatar name={post.author.name} url={post.author.avatarUrl} />
        <div className="grow">
          <Link href={`/people/${post.authorId}`}><strong>{post.author.name}</strong></Link>
          <div className="muted">{post.author.missionName} · {timeAgo(post.createdAt)}</div>
          {currentStatus(post.author) && <div className="status-line">{currentStatus(post.author)}</div>}
        </div>
        {post.circle && (
          <Link className="chip amber" href={`/circles/${post.circle.slug}`}>{post.circle.name}</Link>
        )}
      </div>

      {post.body && <p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>}
      <Attachments items={post.attachments} />

      <div className="row">
        <ReactionBar target="post" id={post.id} summary={summarize(post.reactions, viewerId)} />
        {post.authorId !== viewerId && (
          <form action={startDirectThread.bind(null, post.authorId)}>
            <button>Message</button>
          </form>
        )}
        {post.authorId !== viewerId && <ReportButton targetType="POST" targetId={post.id} />}
        {canDelete && (
          <form action={deletePost.bind(null, post.id)} style={{ marginLeft: "auto" }}>
            <button className="danger">Delete</button>
          </form>
        )}
      </div>

      <section className="comments" aria-label="Comments">
        {post.comments.map((c) => (
          <div key={c.id} className="comment">
            <Avatar name={c.author.name} url={c.author.avatarUrl} size={32} />
            <div className="grow">
              <Link href={`/people/${c.authorId}`}><strong>{c.author.name}</strong></Link>{" "}
              <span className="muted">{timeAgo(c.createdAt)}</span>
              <p style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
            </div>
            {(c.authorId === viewerId || canDelete) && (
              <form action={deleteComment.bind(null, c.id)}>
                <button className="link">Delete</button>
              </form>
            )}
            {c.authorId !== viewerId && <ReportButton targetType="COMMENT" targetId={c.id} compact />}
          </div>
        ))}
        {post._count.comments > post.comments.length && (
          <p className="muted">Showing the first {post.comments.length} of {post._count.comments} comments.</p>
        )}
        <CommentForm postId={post.id} />
      </section>
    </article>
  );
}
