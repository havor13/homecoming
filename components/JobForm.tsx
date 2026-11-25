"use client";

import { createJob } from "@/lib/actions/careers";
import { JOB_TYPES, JOB_TYPE_LABEL } from "@/lib/careers";
import { ACCEPT_ATTR } from "@/lib/upload-config";
import { useActionForm } from "./useActionForm";

export function JobForm() {
  const { ref, onSubmit, pending, error } = useActionForm(createJob, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 640 }}>
      <div className="field">
        <label htmlFor="title">Job title</label>
        <input id="title" name="title" maxLength={100} required />
      </div>
      <div className="row">
        <div className="field grow">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" maxLength={100} required />
        </div>
        <div className="field grow">
          <label htmlFor="location">Location</label>
          <input id="location" name="location" maxLength={100} placeholder="City, or Remote" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue="FULL_TIME">
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{JOB_TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">About the role</label>
        <textarea id="description" name="description" rows={6} maxLength={3000} required />
      </div>
      <div className="field">
        <label htmlFor="applyUrl">Apply link (optional)</label>
        <input id="applyUrl" name="applyUrl" type="url" maxLength={500} placeholder="https://" />
      </div>
      <div className="field">
        <label htmlFor="job-files">Attach a file (optional)</label>
        <input id="job-files" name="files" type="file" multiple accept={ACCEPT_ATTR} className="file-input" />
        <span className="muted">For example the full job description or a flyer. PDF, Word, Excel, PowerPoint, text or images, up to 4 MB in total.</span>
      </div>
      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="remote" style={{ width: 20, minHeight: 20 }} />
        Remote work is possible
      </label>
      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="canRefer" style={{ width: 20, minHeight: 20 }} />
        I work there and can give a referral
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Posting..." : "Post job"}</button>
    </form>
  );
}
