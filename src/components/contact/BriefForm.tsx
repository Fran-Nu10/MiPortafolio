"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { submitBrief } from "@/app/actions/brief";
import { BRIEF_INITIAL, LIMITS, briefCompletion, readValues, validateBrief, type BriefFieldErrors, type BriefState, type BriefValues } from "@/lib/brief";
import { EndSequence } from "./EndSequence";

export interface BriefFormCopy {
  fields: { name: string; email: string; brief: string; briefPlaceholder: string };
  button: { idle: string; pending: string };
  errors: { missing: string; invalid: string };
  /** the full route-error sentence (email part only when confirmed) */
  routeError: string;
  success: string;
  end: string;
}

type Field = keyof BriefValues;
const ORDER: Field[] = ["name", "email", "brief"];

/**
 * The brief (Spec §14). `<form action>` + useActionState: works without JavaScript (plain
 * POST, the server re-renders with the result) and, with it, validates on submit, then live
 * per field once that field has shown an error. Success only after the server got a 2xx from
 * Resend; then the form is replaced by the End block.
 *
 * With JavaScript the action is called directly, inside a transition, so a request that never
 * reaches the server (offline, a crashed function, a 5xx) becomes the honest route error with the
 * values kept — it used to throw into Next's error screen (Phase 13, Spec §24). Without JavaScript
 * the same server action handles the plain POST through `formAction`.
 */
export function BriefForm({ copy, renderedAt }: { copy: BriefFormCopy; renderedAt: number }) {
  const [actionState, formAction, actionPending] = useActionState(submitBrief, BRIEF_INITIAL);
  const [clientState, setClientState] = useState<BriefState | null>(null);
  const [sending, startSending] = useTransition();
  const state = clientState ?? actionState;
  const pending = actionPending || sending;
  const serverValues = state.status === "error" ? state.values : undefined;
  const [values, setValues] = useState<BriefValues>(() => serverValues ?? { name: "", email: "", brief: "" });
  const [clientErrors, setClientErrors] = useState<BriefFieldErrors | null>(null);
  /** server field errors the visitor has since edited (keyed by response id) */
  const [edited, setEdited] = useState<{ id: string; fields: Field[] } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const tRef = useRef<HTMLInputElement>(null);

  // the timing check starts when the form becomes interactive, not at build time
  useEffect(() => {
    if (tRef.current) tRef.current.value = String(Date.now());
  }, []);

  // a server answer with field errors: focus moves to the first invalid field (Spec §14)
  const serverId = state.status === "error" ? state.id : null;
  const serverFirst = state.status === "error" && state.fields ? ORDER.find((f) => state.fields?.[f]) : undefined;
  useEffect(() => {
    if (serverId && serverFirst) formRef.current?.querySelector<HTMLElement>(`[name="${serverFirst}"]`)?.focus();
  }, [serverId, serverFirst]);

  if (state.status === "success") return <EndSequence success={copy.success} name={copy.end} />;

  const serverFields = state.status === "error" ? state.fields : undefined;
  const errorFor = (f: Field) => {
    if (clientErrors && f in clientErrors) return clientErrors[f];
    if (state.status === "error" && edited?.id === state.id && edited.fields.includes(f)) return undefined;
    return serverFields?.[f];
  };
  const message = (f: Field) => {
    const e = errorFor(f);
    return e === "invalid" ? copy.errors.invalid : e ? copy.errors.missing : undefined;
  };

  const onChange = (f: Field, v: string) => {
    const next = { ...values, [f]: v };
    setValues(next);
    // live validation only for fields that already showed an error
    if (errorFor(f)) {
      const all = validateBrief(next) ?? {};
      setClientErrors({ ...(clientErrors ?? {}), [f]: all[f] });
    }
    if (state.status === "error" && serverFields?.[f]) {
      const fields = edited?.id === state.id ? edited.fields : [];
      if (!fields.includes(f)) setEdited({ id: state.id, fields: [...fields, f] });
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const errors = validateBrief(values);
    e.preventDefault();
    if (!errors) {
      setClientErrors(null);
      const fd = new FormData(e.currentTarget);
      startSending(async () => {
        let next: BriefState;
        try {
          next = await submitBrief(state, fd);
        } catch {
          // the request never got an answer: never a success, the values stay
          next = { status: "error", id: `client-${Date.now()}`, route: true, values: readValues(fd), t: Number(fd.get("t")) || renderedAt };
        }
        startSending(() => setClientState(next));
      });
      return;
    }
    setClientErrors(errors);
    const first = ORDER.find((f) => errors[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const typing = values.name || values.email || values.brief;
  const completion = briefCompletion(values);
  const routeError = state.status === "error" && state.route;

  const field = (f: Field, label: string, input: ReactNode) => {
    const msg = message(f);
    return (
      <div className="field" data-field={f}>
        <label htmlFor={`brief-${f}`} className="field-label micro">
          {label}
        </label>
        {input}
        {msg ? (
          <p id={`brief-${f}-error`} className="field-error micro">
            {msg}
          </p>
        ) : null}
      </div>
    );
  };
  const aria = (f: Field) => ({
    "aria-invalid": message(f) ? true : undefined,
    "aria-describedby": message(f) ? `brief-${f}-error` : undefined,
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="brief-form"
      aria-busy={pending || undefined}
      data-state={pending ? "submitting" : routeError ? "error-route" : clientErrors || serverFields ? "error-fields" : typing ? "typing" : "idle"}
    >
      {field(
        "name",
        copy.fields.name,
        <input
          id="brief-name"
          name="name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          required
          minLength={LIMITS.name.min}
          maxLength={LIMITS.name.max}
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          readOnly={pending}
          className="field-input"
          {...aria("name")}
        />,
      )}
      {field(
        "email",
        copy.fields.email,
        <input
          id="brief-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          required
          maxLength={LIMITS.email.max}
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
          readOnly={pending}
          className="field-input"
          {...aria("email")}
        />,
      )}
      {field(
        "brief",
        copy.fields.brief,
        <textarea
          id="brief-brief"
          name="brief"
          required
          rows={4}
          minLength={LIMITS.brief.min}
          maxLength={LIMITS.brief.max}
          placeholder={copy.fields.briefPlaceholder}
          value={values.brief}
          onChange={(e) => onChange("brief", e.target.value)}
          readOnly={pending}
          className="field-input field-textarea"
          {...aria("brief")}
        />,
      )}

      {/* honeypot: off-screen, out of the tab order, never filled by a person */}
      <div className="hp" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input ref={tRef} type="hidden" name="t" defaultValue={String(state.status === "error" ? state.t : renderedAt)} />

      <div className="brief-actions">
        <button type="submit" disabled={pending} aria-disabled={pending || undefined} className="brief-submit">
          {pending ? copy.button.pending : copy.button.idle}
          {pending ? null : (
            <span className="brief-arrow" aria-hidden="true">
              →
            </span>
          )}
        </button>
        {typing ? (
          <span className="micro muted brief-completion" aria-hidden="true">
            {completion} %
          </span>
        ) : null}
      </div>
      <div role="alert" className="brief-route-error micro">
        {routeError ? copy.routeError : null}
      </div>
    </form>
  );
}
