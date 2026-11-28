import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { JobEditForm } from "@/components/JobEditForm";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  // Only the person who posted it can edit it.
  const job = await db.job.findFirst({
    where: { id, postedById: userId },
    include: { attachments: { select: { id: true, name: true, size: true } } },
  });
  if (!job) notFound();

  return (
    <>
      <p><Link href="/jobs">Back to jobs</Link></p>
      <h1>Edit job</h1>
      <JobEditForm
        job={{
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          description: job.description,
          applyUrl: job.applyUrl ?? "",
          remote: job.remote,
          canRefer: job.canRefer,
          attachments: job.attachments,
        }}
      />
    </>
  );
}
