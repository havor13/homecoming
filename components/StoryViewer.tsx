"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteStory, markStorySeen } from "@/lib/actions/stories";
import { bgColor } from "@/lib/stories";
import { timeLeftLabel } from "@/lib/format";
import { Avatar } from "./Avatar";
import { ReportButton } from "./ReportButton";

export type ViewerStory = {
  id: string;
  body: string;
  imageUrl: string | null;
  bg: string;
  expiresAt: string;
  viewers: string[]; // only filled in for your own stories
};

export function StoryViewer({
  author,
  stories,
  isOwn,
}: {
  author: { id: string; name: string; avatarUrl: string | null };
  stories: ViewerStory[];
  isOwn: boolean;
}) {
  const [i, setI] = useState(0);
  const story = stories[i];

  useEffect(() => {
    if (!isOwn) void markStorySeen(story.id);
  }, [story.id, isOwn]);

  return (
    <div className="stack" style={{ maxWidth: 440 }}>
      <div className="row">
        <Avatar name={author.name} url={author.avatarUrl} size={44} />
        <div className="grow">
          <Link href={`/people/${author.id}`}><strong>{isOwn ? "Your story" : author.name}</strong></Link>
          <div className="muted">{timeLeftLabel(new Date(story.expiresAt))}</div>
        </div>
        <Link href="/">Close</Link>
      </div>

      <div className="story-dots" role="img" aria-label={`Story ${i + 1} of ${stories.length}`}>
        {stories.map((s, n) => <span key={s.id} className={n <= i ? "on" : ""} />)}
      </div>

      <div className="story-card" style={{ background: bgColor(story.bg) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {story.imageUrl && <img src={story.imageUrl} alt="" className="story-img" />}
        {story.body && <p className={story.imageUrl ? "story-caption" : "story-text"}>{story.body}</p>}
      </div>

      <div className="row">
        <button type="button" onClick={() => setI(i - 1)} disabled={i === 0}>Previous</button>
        {i < stories.length - 1 ? (
          <button type="button" className="primary" onClick={() => setI(i + 1)}>Next</button>
        ) : (
          <Link href="/" className="button">Done</Link>
        )}
      </div>

      {isOwn ? (
        <section className="card">
          <h2>Seen by {story.viewers.length}</h2>
          {story.viewers.length === 0 ? (
            <p className="muted">No one has watched this yet.</p>
          ) : (
            <p>{story.viewers.join(", ")}</p>
          )}
          <form action={deleteStory}>
            <input type="hidden" name="storyId" value={story.id} />
            <button className="danger">Delete this story</button>
          </form>
        </section>
      ) : (
        <ReportButton targetType="STORY" targetId={story.id} />
      )}
    </div>
  );
}
