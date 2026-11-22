import { logout } from "@/lib/actions/auth";

export default function SuspendedPage() {
  return (
    <div className="auth">
      <div className="card">
        <h1>Your account is suspended</h1>
        <p>
          A moderator suspended this account after a report about it. You can&apos;t use Homecoming while it is
          suspended. If you think this was a mistake, contact [homecomingrm@gmail.com].
        </p>
        <form action={logout}>
          <button type="submit">Sign out</button>
        </form>
      </div>
    </div>
  );
}
