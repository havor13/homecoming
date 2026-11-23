import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toggleBlock } from "@/lib/actions/privacy";
import { Avatar } from "@/components/Avatar";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { NotificationForm } from "@/components/NotificationForm";
import { PrivacyForm } from "@/components/PrivacyForm";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const { password } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const me = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { profileVisibility: true, whoCanMessage: true, showHomeCity: true, emailMessages: true, emailActivity: true },
  });

  const blocks = await db.block.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Privacy and safety</h1>
        <p className="muted">
          See the <Link href="/privacy">privacy summary</Link> and the <Link href="/guidelines">community guidelines</Link>.
        </p>
      </div>

      <PrivacyForm
        profileVisibility={me.profileVisibility}
        whoCanMessage={me.whoCanMessage}
        showHomeCity={me.showHomeCity}
      />

      <section className="card" style={{ maxWidth: 560 }}>
        <h2>Install Homecoming on your phone</h2>
        <p><strong>iPhone:</strong> open this site in Safari, tap the Share button, then <em>Add to Home Screen</em>.</p>
        <p><strong>Android:</strong> open this site in Chrome, tap the menu (three dots), then <em>Install app</em> or <em>Add to Home screen</em>.</p>
        <p className="muted">It then opens full-screen with its own icon, like any other app.</p>
      </section>

      <ChangePasswordForm justChanged={password === "changed"} />

      <NotificationForm emailMessages={me.emailMessages} emailActivity={me.emailActivity} />

      <section className="card" style={{ maxWidth: 560 }}>
        <h2>People you have blocked</h2>
        <p className="muted">
          Blocked members can&apos;t message you, and you won&apos;t see their posts or comments. They are not told.
          To block someone, open their profile.
        </p>
        {blocks.length === 0 && <p className="muted">You have not blocked anyone.</p>}
        {blocks.map((b) => (
          <div key={b.blockedId} className="row">
            <Avatar name={b.blocked.name} url={b.blocked.avatarUrl} size={40} />
            <span className="grow">{b.blocked.name}</span>
            <form action={toggleBlock.bind(null, b.blockedId)}>
              <button>Unblock</button>
            </form>
          </div>
        ))}
      </section>

      <section className="card" style={{ maxWidth: 560 }}>
        <h2>Your data</h2>
        <p className="muted">
          Download your profile, posts, comments, messages you sent and more as a single file.
        </p>
        <a className="btn" href="/api/export" download>Download my data</a>
      </section>

      <DeleteAccountForm />
    </>
  );
}
