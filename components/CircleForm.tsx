"use client";

import { useState } from "react";
import { createCircle } from "@/lib/actions/circles";
import { useActionForm } from "./useActionForm";

type Kind = "MISSION" | "LANGUAGE" | "RETURN_YEAR" | "INTEREST";

const MATCH_HELP: Record<Exclude<Kind, "INTEREST">, { label: string; placeholder: string }> = {
  MISSION: { label: "Which mission is it for?", placeholder: "For example Ghana Accra" },
  LANGUAGE: { label: "Which language is it for?", placeholder: "For example Twi" },
  RETURN_YEAR: { label: "Which year did members return?", placeholder: "For example 2023" },
};

export function CircleForm() {
  const { ref, onSubmit, pending, error } = useActionForm(createCircle, { resetOnSuccess: false });
  const [kind, setKind] = useState<Kind>("INTEREST");

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
        <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          <option value="MISSION">Mission</option>
          <option value="LANGUAGE">Language</option>
          <option value="RETURN_YEAR">Returned around the same time</option>
          <option value="INTEREST">Interest</option>
        </select>
      </div>
      {kind !== "INTEREST" && (
        <div className="field">
          <label htmlFor="matchValue">{MATCH_HELP[kind].label}</label>
          <input id="matchValue" name="matchValue" maxLength={60} placeholder={MATCH_HELP[kind].placeholder} />
          <span className="muted">
            Only members whose profile matches can join straight away. Anyone else can ask, and you decide. Leave this
            blank to let everyone in.
          </span>
        </div>
      )}
      <div className="field">
        <label htmlFor="visibility">Who can join?</label>
        <select id="visibility" name="visibility" defaultValue="PUBLIC">
          <option value="PUBLIC">Public: matching members can join</option>
          <option value="PRIVATE">Private: you approve each request</option>
        </select>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Creating..." : "Create circle"}</button>
    </form>
  );
}
