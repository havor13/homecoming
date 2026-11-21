"use client";

import { useEffect, useState } from "react";
import { updatePrivacy } from "@/lib/actions/privacy";
import { useActionForm } from "./useActionForm";

export function PrivacyForm({
  profileVisibility,
  whoCanMessage,
  showHomeCity,
}: {
  profileVisibility: "EVERYONE" | "CIRCLES";
  whoCanMessage: "EVERYONE" | "CIRCLES";
  showHomeCity: boolean;
}) {
  const { ref, onSubmit, pending, state, error } = useActionForm(updatePrivacy, { resetOnSuccess: false });

  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!state?.ok) return;
    setJustSaved(true);
    const t = setTimeout(() => setJustSaved(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <h2>Who can see you</h2>
      <div className="field">
        <label htmlFor="profileVisibility">Your profile and search listings</label>
        <select id="profileVisibility" name="profileVisibility" defaultValue={profileVisibility}>
          <option value="EVERYONE">Everyone in Homecoming</option>
          <option value="CIRCLES">Only people who share a circle with me</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="whoCanMessage">Who can start a conversation with you</label>
        <select id="whoCanMessage" name="whoCanMessage" defaultValue={whoCanMessage}>
          <option value="EVERYONE">Everyone in Homecoming</option>
          <option value="CIRCLES">Only people who share a circle with me</option>
        </select>
      </div>
      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="showHomeCity" defaultChecked={showHomeCity} style={{ width: 20, minHeight: 20 }} />
        Show my home city on my profile
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {justSaved && !error ? "✓ Your privacy settings were saved." : ""}
      </p>
      <button className="primary" disabled={pending}>
        {pending ? "Saving..." : justSaved ? "Saved ✓" : "Save settings"}
      </button>
    </form>
  );
}
