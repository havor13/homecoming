import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { unreadNotificationCount } from "@/lib/notifications";
import { unreadThreadIds } from "@/lib/unread";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ messages: 0, notifications: 0 }, { status: 401 });
  const [threads, notifications] = await Promise.all([
    unreadThreadIds(session.user.id),
    unreadNotificationCount(session.user.id),
  ]);
  return NextResponse.json(
    { messages: threads.length, notifications },
    { headers: { "Cache-Control": "no-store" } },
  );
}
