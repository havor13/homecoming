import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { GroupChatForm } from "@/components/GroupChatForm";

export default async function NewGroupChatPage() {
  const session = await auth();
  const userId = session!.user.id;

  const people = await db.user.findMany({
    where: { id: { not: userId } },
    orderBy: { name: "asc" },
    take: 200,
    select: { id: true, name: true, missionName: true, avatarUrl: true },
  });

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>New group chat</h1>
        <p className="muted">
          A private chat for the people you pick. <Link href="/messages">Back to messages</Link>
        </p>
      </div>
      <GroupChatForm people={people} />
    </>
  );
}
