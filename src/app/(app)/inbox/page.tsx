import { AlertTriangle, Mail, MailX, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { listDigests } from "@/server/queries";

export const metadata = { title: "Inbox" };

function SlotIcon({ slot, status }: { slot: string; status: string }) {
  if (status === "failed") return <span className="mail-icon" style={{ background: "var(--red-soft)", color: "var(--red)" }}><AlertTriangle size={18} /></span>;
  if (status === "skipped") return <span className="mail-icon" style={{ background: "var(--surface-2)", color: "var(--muted)" }}><MailX size={18} /></span>;
  if (slot === "morning") return <span className="mail-icon" style={{ background: "var(--yellow-soft)", color: "#b06000" }}><Sun size={18} /></span>;
  if (slot === "evening") return <span className="mail-icon" style={{ background: "#e8eaf6", color: "#3949ab" }}><Moon size={18} /></span>;
  return <span className="mail-icon" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}><Mail size={18} /></span>;
}

export default async function InboxPage() {
  const user = await requireUser();
  const rows = await listDigests(user.id);
  const sent = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const skipped = rows.filter((r) => r.status === "skipped").length;
  const fmt = (d: Date) => d.toLocaleString("en-NG", { timeZone: user.timezone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <main className="page" style={{ maxWidth: 900 }}>
      <div className="briefing-head">
        <div>
          <h1>Inbox</h1>
          <p>Every briefing sent to {user.email}. Open one to see exactly what arrived.</p>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat"><b data-testid="stat-sent">{sent}</b><span>Sent</span></div>
        <div className="stat"><b style={{ color: failed ? "var(--red)" : undefined }}>{failed}</b><span>Failed</span></div>
        <div className="stat"><b>{skipped}</b><span>Skipped</span></div>
      </div>
      {rows.length === 0 ? (
        <div className="card empty">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/empty-inbox.svg" alt="" width={200} height={150} />
          <p>No emails yet. Your first briefing arrives at the next scheduled time.</p>
        </div>
      ) : (
        <div className="mail-list" data-testid="mail-list">
          {rows.map((r) => (
            <Link key={r.id} href={`/inbox/${r.id}`} className="mail-row">
              <SlotIcon slot={r.slot} status={r.status} />
              <div style={{ minWidth: 0 }}>
                <div className="subject">{r.subject}</div>
                <div className="sub">
                  <span className={`status status-${r.status}`}>{r.status}</span>{" "}
                  {r.status === "failed" ? r.error : r.status === "skipped" ? "Nothing new to send in your topics" : `${r.articleIds.length} stories, ${r.slot === "test" ? "test email" : `${r.slot} briefing`}`}
                </div>
              </div>
              <span className="when">{fmt(r.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
