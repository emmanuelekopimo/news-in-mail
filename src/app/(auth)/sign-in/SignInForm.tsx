"use client";

import { useActionState } from "react";
import { signInAction, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function SignInForm({ demoEmail, demoPassword }: { demoEmail: string; demoPassword: string }) {
  const [state, action] = useActionState<FormState, FormData>(signInAction, {});
  const email = (state.values?.email as string | undefined) ?? demoEmail;
  return (
    <form action={action} noValidate>
      {state.message ? <div className="alert alert-error" role="alert">{state.message}</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" defaultValue={email} aria-invalid={Boolean(state.errors?.email)} aria-describedby="email-error" />
        {state.errors?.email ? <p className="error" id="email-error">{state.errors.email[0]}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" defaultValue={demoPassword} aria-invalid={Boolean(state.errors?.password)} aria-describedby="password-error" />
        {state.errors?.password ? <p className="error" id="password-error">{state.errors.password[0]}</p> : null}
      </div>
      <SubmitButton className="btn btn-primary btn-block" pending="Signing in...">Sign in</SubmitButton>
    </form>
  );
}
