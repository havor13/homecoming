"use client";

import { updateJob } from "@/lib/actions/careers";
import { JOB_TYPES, JOB_TYPE_LABEL } from "@/lib/careers";
import { formatSize } from "@/lib/format";
import { ACCEPT_ATTR } from "@/lib/upload-config";
import { useActionForm } from "./useActionForm";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: (typeof JOB_TYPES)[number];
  description: string;
  applyUrl: string;
  remote: boolean;
  canRefer: boolean;
  attachments: { id: string; name: string; size: number }[];
};

export function JobEditForm({ job }: { job: Job }) {
  const { ref, onSubmit, pending, error } = useActionForm(updateJob, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 640 }}>
      <input type="hidden" name="jobId" value={job.id} />
      <div className="field">
        <label htmlFor="title">Job title</label>
        <input id="title" name="title" defaultValue={job.title} maxLength={100} required />
      </div>
      <div className="row">
        <div className="field grow">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" defaultValue={job.company} maxLength={100} required />
        </div>
        <div className="field grow">
          <label htmlFor="location">Location</label>
          <input id="location" name="location" defaultValue={job.location} maxLength={100} required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue={job.type}>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{JOB_TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">About the role</label>
        <textarea id="description" name="description" defaultValue={job.description} rows={6} maxLength={3000} required />
      </div>
      <div className="field">
        <label htmlFor="applyUrl">Apply link (optional)</label>
        <input id="applyUrl" name="applyUrl" type="url" defaultValue={job.applyUrl} maxLength={500} placeholder="https://" />
      </div>

      {job.attachments.length > 0 && (
        <fieldset className="field" style={{ border: 0, padding: 0 }}>
          <legend>Files on this job</legend>
          {job.attachments.map((a) => (
            <label key={a.id} className="row" style={{ fontWeight: 400 }}>
              <input type="checkbox" name="removeFile" value={a.id} style={{ width: 20, minHeight: 20 }} />
              Remove {a.name} <span className="muted">({formatSize(a.size)})</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="field">
        <label htmlFor="job-files">Add files (optional)</label>
        <input id="job-files" name="files" type="file" multiple accept={ACCEPT_ATTR} className="file-input" />
        <span className="muted">A job can have up to 4 files, 4 MB in total for new ones.</span>
      </div>

      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="remote" defaultChecked={job.remote} style={{ width: 20, minHeight: 20 }} />
        Remote work is possible
      </label>
      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="canRefer" defaultChecked={job.canRefer} style={{ width: 20, minHeight: 20 }} />
        I work there and can give a referral
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
    </form>
  );
}
