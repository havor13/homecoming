import Link from "next/link";
import { CircleForm } from "@/components/CircleForm";

export default function NewCirclePage() {
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Create a circle</h1>
        <p className="muted">
          You will be its admin: you approve requests to a private circle and can remove posts and members.{" "}
          <Link href="/circles">Back to circles</Link>
        </p>
      </div>
      <CircleForm />
    </>
  );
}
