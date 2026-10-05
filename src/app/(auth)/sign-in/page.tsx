import Link from "next/link";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/server/seed-data";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="auth-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="News in Mail" width={44} height={44} />
      <h1>Sign in</h1>
      <p className="lead">Continue to News in Mail</p>
      <div className="demo-hint">
        Demo account is filled in: <b>{DEMO_EMAIL}</b> / <b>{DEMO_PASSWORD}</b>
      </div>
      <SignInForm demoEmail={DEMO_EMAIL} demoPassword={DEMO_PASSWORD} />
      <p className="small muted" style={{ marginTop: 20 }}>
        New here? <Link href="/sign-up" style={{ color: "var(--blue)" }}>Create an account</Link>
      </p>
    </div>
  );
}
