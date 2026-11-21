import Link from "next/link";
import { storyGroups } from "@/lib/story-queries";
import { Avatar } from "./Avatar";

export async function StoryTray({ viewerId }: { viewerId: string }) {
  const groups = await storyGroups(viewerId);
  const mine = groups.find((g) => g.author.id === viewerId);
  const others = groups.filter((g) => g.author.id !== viewerId);

  return (
    <section className="story-tray" aria-label="Stories">
      <Link href="/stories/new" className="story-item">
        <span className="story-add" aria-hidden="true">+</span>
        <span>Add story</span>
      </Link>
      {mine && (
        <Link href={`/stories/${viewerId}`} className="story-item">
          <span className="story-ring seen"><Avatar name={mine.author.name} url={mine.author.avatarUrl} size={52} /></span>
          <span>Your story</span>
        </Link>
      )}
      {others.map((g) => (
        <Link
          key={g.author.id}
          href={`/stories/${g.author.id}`}
          className="story-item"
          aria-label={`${g.author.name}, ${g.count} ${g.count === 1 ? "story" : "stories"}${g.unseen ? ", new" : ""}`}
        >
          <span className={`story-ring ${g.unseen ? "new" : "seen"}`}>
            <Avatar name={g.author.name} url={g.author.avatarUrl} size={52} />
          </span>
          <span>{g.author.name.split(" ")[0]}</span>
        </Link>
      ))}
    </section>
  );
}
