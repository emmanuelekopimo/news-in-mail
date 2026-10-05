import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div className="auth-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="News in Mail" width={44} height={44} />
      <h1>Create your account</h1>
      <p className="lead">Then pick your topics and get a test email right away.</p>
      <SignUpForm />
      <p className="small muted" style={{ marginTop: 20 }}>
        Already have an account? <Link href="/sign-in" style={{ color: "var(--blue)" }}>Sign in</Link>
      </p>
    </div>
  );
}
