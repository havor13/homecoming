"use client";

import { createCircle } from "@/lib/actions/circles";
import { useActionForm } from "./useActionForm";

export function CircleForm() {
  const { ref, onSubmit, pending, error } = useActionForm(createCircle, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <div className="field">
        <label htmlFor="name">Circle name</label>
        <input id="name" name="name" maxLength={60} required />
      </div>
      <div className="field">
        <label htmlFor="description">What is it for?</label>
        <textarea id="description" name="description" rows={3} maxLength={300} required />
      </div>
      <div className="field">
        <label htmlFor="kind">Type</label>
        <select id="kind" name="kind" defaultValue="INTEREST">
          <option value="MISSION">Mission</option>
          <option value="LANGUAGE">Language</option>
          <option value="RETURN_YEAR">Returned around the same time</option>
          <option value="INTEREST">Interest</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="visibility">Who can join?</label>
        <select id="visibility" name="visibility" defaultValue="PUBLIC">
          <option value="PUBLIC">Public: anyone in Homecoming can join</option>
          <option value="PRIVATE">Private: you approve each request</option>
        </select>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Creating..." : "Create circle"}</button>
    </form>
  );
}
