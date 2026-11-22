import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { unreadThreadIds } from "@/lib/unread";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 }, { status: 401 });
  const ids = await unreadThreadIds(session.user.id);
  return NextResponse.json({ count: ids.length }, { headers: { "Cache-Control": "no-store" } });
}
