import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/Avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const me = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, avatarUrl: true },
      })
    : null;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Homecoming</div>
        {me && (
          <Link href="/profile" className="me-link">
            <Avatar name={me.name} url={me.avatarUrl} size={40} />
            <span>{me.name}</span>
          </Link>
        )}
        <nav className="nav" aria-label="Main">
          <Link href="/">Home</Link>
          <Link href="/circles">Mission circles</Link>
          <Link href="/messages">Messages</Link>
          <Link href="/people">People</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/mentors">Mentors</Link>
          <Link href="/events">Reunions and events</Link>
          <Link href="/profile">My profile</Link>
        </nav>
        <form action={logout}>
          <button type="submit">Sign out</button>
        </form>
        <p className="disclaimer">
          An independent community. Not affiliated with or endorsed by The Church of Jesus Christ of Latter-day Saints.
        </p>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
