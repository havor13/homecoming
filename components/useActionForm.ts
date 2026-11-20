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
  options: { resetOnSuccess?: boolean } = {},
) {
  const { resetOnSuccess = true } = options;
  const [state, run, pending] = useActionState(action, undefined);
  const [localError, setLocalError] = useState<string | undefined>();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

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

  return { ref, onSubmit, pending, state, error: localError ?? state?.error };
}
