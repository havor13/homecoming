import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * The signed-in person's id. Sends people to sign in, and stops suspended or deleted
 * accounts even if their sign-in cookie is still valid.
 */
export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { suspendedAt: true },
  });
  if (!user) redirect("/api/signout");
  if (user.suspendedAt) redirect("/suspended");

  return session.user.id;
}
