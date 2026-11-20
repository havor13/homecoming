import Link from "next/link";
import { JobForm } from "@/components/JobForm";

export default function NewJobPage() {
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Post a job</h1>
        <p className="muted">
          Share an opening where you work, or one you have heard about. Listings stay up for 60 days.{" "}
          <Link href="/jobs">Back to jobs</Link>
        </p>
      </div>
      <JobForm />
    </>
  );
}
