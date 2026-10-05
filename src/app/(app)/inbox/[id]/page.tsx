import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmailFrame } from "@/components/EmailFrame";
import { requireUser } from "@/server/auth";
import { getDigest } from "@/server/queries";

export const metadata = { title: "Email" };

export default async function DigestPage({ params, searchParams }: PageProps<"/inbox/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const digestId = Number(id);
  if (!Number.isInteger(digestId)) notFound();
  const d = await getDigest(user.id, digestId);
  if (!d) notFound();
  const when = d.createdAt.toLocaleString("en-NG", { timeZone: user.timezone, dateStyle: "full", timeStyle: "short" });

  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <Link href="/inbox" className="back"><ArrowLeft size={16} aria-hidden /> Back to inbox</Link>
      {sp.welcome ? (
        <div className="alert alert-success" role="status">You are all set. We sent this test email to {d.toEmail}. Your first real briefing arrives at your next delivery time.</div>
      ) : null}
      {sp.test ? <div className="alert alert-success" role="status">Test email sent to {d.toEmail}.</div> : null}
      <div className="mail-head">
        <span className={`status status-${d.status}`}>{d.status}</span>
        <h1>{d.subject}</h1>
        <div className="small muted">
          To {d.toEmail} &middot; {when} &middot; {d.deliveredVia === "smtp" ? "Sent by email (SMTP)" : "Saved to in-app inbox"}
        </div>
        {d.error ? <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>Delivery failed: {d.error}. The next briefing will try again.</div> : null}
      </div>
      {d.html ? (
        <EmailFrame html={d.html} title={`Email: ${d.subject}`} />
      ) : (
        <div className="card empty">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/empty-inbox.svg" alt="" width={200} height={150} />
          <p>No email was sent for this slot because there were no new stories in your topics.</p>
        </div>
      )}
    </main>
  );
}
