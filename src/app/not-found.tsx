import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-wrap">
      <div className="auth-card" style={{ textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/empty-inbox.svg" alt="" width={200} height={150} />
        <h1>Page not found</h1>
        <p className="lead">The page you are looking for does not exist or is not yours.</p>
        <Link href="/news" className="btn btn-primary">Go to your briefing</Link>
      </div>
    </main>
  );
}
