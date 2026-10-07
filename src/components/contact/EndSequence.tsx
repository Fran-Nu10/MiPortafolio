"use client";

import { useEffect, useRef } from "react";
import { setJourney } from "@/lib/journey-store";

/**
 * S16 · End (Spec §02). Triggered by the form's success (a 2xx from Resend), never by scroll.
 * Phase 1 renders the final static block — also what a no-JS POST returns. Phase 10 adds the
 * sequence: "Brief recibido." holds 1.2 s → the red dims → black → FRANCO NÚÑEZ.
 */
export function EndSequence({ success, name }: { success: string; name: string }) {
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    setJourney({ endActive: true });
    statusRef.current?.focus();
    return () => setJourney({ endActive: false });
  }, []);
  return (
    <div className="end" data-part="end">
      <p ref={statusRef} role="status" tabIndex={-1} className="end-status micro">
        {success}
      </p>
      <p className="end-name" aria-hidden="true">
        {name}
      </p>
    </div>
  );
}
