"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitBrief } from "@/app/actions/brief";
import { BRIEF_INITIAL, LIMITS, briefCompletion, validateBrief, type BriefFieldErrors, type BriefValues } from "@/lib/brief";
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
 */
export function BriefForm({ copy, renderedAt }: { copy: BriefFormCopy; renderedAt: number }) {
  const [state, formAction, pending] = useActionState(submitBrief, BRIEF_INITIAL);
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
    if (!errors) {
      setClientErrors(null);
      return; // the action runs
    }
    e.preventDefault();
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
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="brief-form" aria-busy={pending || undefined}>
      {field(
        "name",
        copy.fields.name,
        <input
          id="brief-name"
          name="name"
          type="text"
          autoComplete="name"
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
