"use client";

import { createStory } from "@/lib/actions/stories";
import { STORY_BACKGROUNDS, STORY_MAX_CHARS } from "@/lib/stories";
import type { StoryBg } from "@/lib/stories";
import { IMAGE_ACCEPT_ATTR } from "@/lib/upload-config";
import { EmojiPicker } from "./EmojiPicker";
import { useActionForm } from "./useActionForm";

export function StoryComposer() {
  const { ref, onSubmit, pending, error } = useActionForm(createStory, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <h2>Add to your story</h2>
      <p className="muted">Stories disappear after 24 hours. People who can see your profile can see your story.</p>

      <div className="field">
        <label htmlFor="story-body">What do you want to share?</label>
        <textarea id="story-body" name="body" rows={3} maxLength={STORY_MAX_CHARS} placeholder="A thought, a memory, a moment from today" />
        <div className="row">
          <EmojiPicker targetId="story-body" />
          <span className="muted">Up to {STORY_MAX_CHARS} characters</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="story-image">Photo (optional, up to 4 MB)</label>
        <input id="story-image" name="image" type="file" accept={IMAGE_ACCEPT_ATTR} className="file-input" />
        <span className="muted">With a photo, your words appear over it. Without one, they sit on a colour.</span>
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>Colour for a text story</legend>
        <div className="row">
          {(Object.keys(STORY_BACKGROUNDS) as StoryBg[]).map((key, i) => (
            <label key={key} className="swatch" style={{ background: STORY_BACKGROUNDS[key].color }}>
              <input type="radio" name="bg" value={key} defaultChecked={i === 0} />
              <span className="sr-only">{STORY_BACKGROUNDS[key].label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Posting..." : "Share story"}</button>
    </form>
  );
}
