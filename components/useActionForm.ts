"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { FormState } from "@/lib/types";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Wraps a server action for a form. It keeps what the person typed when the server
 * returns an error (React would otherwise clear the form), checks attachment size
 * before sending, and clears the form after a success.
 */
export function useActionForm(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  options: {
    resetOnSuccess?: boolean;
    /** Runs before sending (for example a direct upload). Return an error message to stop. */
    prepare?: (formData: FormData) => Promise<string | undefined>;
  } = {},
) {
  const { resetOnSuccess = true, prepare } = options;
  const [preparing, setPreparing] = useState(false);
  const [state, run, pending] = useActionState(action, undefined);
  const [localError, setLocalError] = useState<string | undefined>();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (prepare) {
      setPreparing(true);
      setLocalError(undefined);
      let problem: string | undefined;
      try {
        problem = await prepare(formData);
      } catch {
        problem = "Something went wrong while uploading. Please try again.";
      }
      setPreparing(false);
      if (problem) {
        setLocalError(problem);
        return;
      }
    }

    let total = 0;
    for (const value of formData.values()) {
      if (value instanceof File) total += value.size;
    }
    if (total > MAX_UPLOAD_BYTES) {
      setLocalError("Attachments can total up to 4 MB.");
      return;
    }
    setLocalError(undefined);
    startTransition(() => run(formData));
  }

  return { ref, onSubmit, pending: pending || preparing, state, error: localError ?? state?.error };
}
