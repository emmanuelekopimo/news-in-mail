"use client";

import { useActionState } from "react";
import { signUpAction, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});
  const v = (state.values ?? {}) as { name?: string; email?: string };
  return (
    <form action={action} noValidate>
      {state.message ? <div className="alert alert-error" role="alert">{state.message}</div> : null}
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" className="input" autoComplete="name" defaultValue={v.name ?? ""} aria-invalid={Boolean(state.errors?.name)} />
        {state.errors?.name ? <p className="error">{state.errors.name[0]}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" defaultValue={v.email ?? ""} aria-invalid={Boolean(state.errors?.email)} />
        {state.errors?.email ? <p className="error">{state.errors.email[0]}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" aria-invalid={Boolean(state.errors?.password)} />
        {state.errors?.password ? <p className="error">{state.errors.password[0]}</p> : <p className="small muted" style={{ margin: "6px 0 0" }}>At least 8 characters</p>}
      </div>
      <SubmitButton className="btn btn-primary btn-block" pending="Creating account...">Create account</SubmitButton>
    </form>
  );
}
