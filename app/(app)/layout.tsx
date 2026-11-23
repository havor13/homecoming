import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/Avatar";
import { SideNav } from "@/components/SideNav";
import { MobileNav } from "@/components/MobileNav";
import { isModeratorEmail } from "@/lib/moderation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const me = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, avatarUrl: true, email: true, suspendedAt: true, sessionVersion: true },
      })
    : null;
  if (session?.user?.id && !me) redirect("/api/signout");
  if (me && (session?.user?.sv ?? 0) !== me.sessionVersion) redirect("/api/signout");
  if (me?.suspendedAt) redirect("/suspended");

  return (
    <div className="shell">
      <MobileNav user={me ? { name: me.name, avatarUrl: me.avatarUrl } : null} isModerator={!!me && isModeratorEmail(me.email)} />
      <aside className="side">
        <div className="brand">Homecoming</div>
        {me && (
          <Link href="/profile" className="me-link">
            <Avatar name={me.name} url={me.avatarUrl} size={40} />
            <span>{me.name}</span>
          </Link>
        )}
        <SideNav isModerator={!!me && isModeratorEmail(me.email)} />
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
