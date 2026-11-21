import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="auth">
        <div className="card">
          <h1>Reset link needed</h1>
          <p>This page needs the link from your email. <Link href="/forgot-password">Ask for a new link</Link>.</p>
        </div>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}
