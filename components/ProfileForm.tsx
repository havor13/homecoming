"use client";

import { useEffect } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { IMAGE_ACCEPT_ATTR } from "@/lib/upload-config";
import { INDUSTRIES } from "@/lib/careers";
import { Avatar } from "./Avatar";
import { useActionForm } from "./useActionForm";

type Profile = {
  name: string;
  missionName: string | null;
  language: string | null;
  yearsServed: string | null;
  homeCity: string | null;
  bio: string | null;
  industry: string | null;
  jobTitle: string | null;
  employer: string | null;
  lookingForWork: boolean;
  openToMentor: boolean;
  mentorAbout: string | null;
  avatarUrl: string | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const { ref, onSubmit, pending, state, error } = useActionForm(updateProfile, { resetOnSuccess: false });

  // Clear the chosen picture after a successful save so it is not sent twice.
  useEffect(() => {
    if (state?.ok) {
      const input = ref.current?.elements.namedItem("avatar");
      if (input instanceof HTMLInputElement) input.value = "";
    }
  }, [state, ref]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ gap: 16 }}>
      <div className="row">
        <Avatar name={profile.name} url={profile.avatarUrl} size={80} />
        <div className="grow field">
          <label htmlFor="avatar">Profile picture</label>
          <input id="avatar" name="avatar" type="file" accept={IMAGE_ACCEPT_ATTR} className="file-input" />
          {profile.avatarUrl && (
            <label className="row" style={{ fontWeight: 400 }}>
              <input type="checkbox" name="removeAvatar" style={{ width: 20, minHeight: 20 }} />
              Remove my current picture
            </label>
          )}
        </div>
      </div>
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" defaultValue={profile.name} required />
      </div>
      <div className="field">
        <label htmlFor="missionName">Mission</label>
        <input id="missionName" name="missionName" defaultValue={profile.missionName ?? ""} required />
      </div>
      <div className="row">
        <div className="field grow">
          <label htmlFor="language">Language</label>
          <input id="language" name="language" defaultValue={profile.language ?? ""} />
        </div>
        <div className="field grow">
          <label htmlFor="yearsServed">Years served</label>
          <input id="yearsServed" name="yearsServed" defaultValue={profile.yearsServed ?? ""} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="homeCity">Home city</label>
        <input id="homeCity" name="homeCity" defaultValue={profile.homeCity ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="bio">About you</label>
        <textarea id="bio" name="bio" rows={3} maxLength={300} defaultValue={profile.bio ?? ""} />
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <legend style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Work</legend>
        <div className="row">
          <div className="field grow">
            <label htmlFor="jobTitle">Job title</label>
            <input id="jobTitle" name="jobTitle" defaultValue={profile.jobTitle ?? ""} maxLength={100} />
          </div>
          <div className="field grow">
            <label htmlFor="employer">Where you work or study</label>
            <input id="employer" name="employer" defaultValue={profile.employer ?? ""} maxLength={100} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="industry">Industry</label>
          <select id="industry" name="industry" defaultValue={profile.industry ?? ""}>
            <option value="">Not listed</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <label className="row" style={{ fontWeight: 400 }}>
          <input type="checkbox" name="lookingForWork" defaultChecked={profile.lookingForWork} style={{ width: 20, minHeight: 20 }} />
          I am open to work or internships
        </label>
        <label className="row" style={{ fontWeight: 400 }}>
          <input type="checkbox" name="openToMentor" defaultChecked={profile.openToMentor} style={{ width: 20, minHeight: 20 }} />
          I am happy to mentor other returned missionaries
        </label>
        <div className="field">
          <label htmlFor="mentorAbout">What can you help with? (shown to people looking for mentors)</label>
          <textarea id="mentorAbout" name="mentorAbout" rows={3} maxLength={400} defaultValue={profile.mentorAbout ?? ""} />
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      {state?.ok && !error && <p role="status" style={{ color: "var(--accent-dark)" }}>Saved.</p>}
      <button className="primary" disabled={pending}>{pending ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
