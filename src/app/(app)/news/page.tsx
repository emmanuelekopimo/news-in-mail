import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { NextEmailCard } from "@/components/NextEmailCard";
import { Story } from "@/components/Story";
import { TopicIcon } from "@/components/TopicIcon";
import { formatLongDate } from "@/lib/email";
import { selectArticles } from "@/lib/ranking";
import { localParts } from "@/lib/schedule";
import { firstName } from "@/lib/text";
import { now } from "@/lib/today";
import { getTopic } from "@/lib/topics";
import { requireUser } from "@/server/auth";
import { userTopics } from "@/server/digest";
import { feedForTopics, listDigests } from "@/server/queries";

export const metadata = { title: "Your briefing" };

export default async function NewsHome() {
  const user = await requireUser();
  const at = now();
  const topics = await userTopics(user.id);
  const [feed, digests] = await Promise.all([feedForTopics(topics, at, 120), listDigests(user.id)]);
  const top = selectArticles(feed, { now: at, topics, perTopic: 2, max: 6, maxAgeHours: 72 });
  const topIds = new Set(top.map((a) => a.id));
  const rest = feed.filter((a) => !topIds.has(a.id));
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: user.timezone }).format(at));
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="page">
      <div className="briefing-head">
        <div>
          <h1>{hello}, {firstName(user.name)}</h1>
          <p>{formatLongDate(localParts(at, user.timezone).date)}</p>
        </div>
      </div>

      <div className="home-grid">
        <div>
          <section className="card" aria-labelledby="top-stories">
            <div className="card-title">
              <h2 id="top-stories" style={{ fontSize: 20 }}>Top stories for you</h2>
              <small>{feed.length} stories in the last 3 days</small>
            </div>
            {top.length === 0 ? (
              <p className="muted">No stories yet. New stories arrive every 20 minutes.</p>
            ) : (
              top.map((a, i) => <Story key={a.id} article={a} now={at} lead={i === 0} />)
            )}
          </section>
        </div>

        <aside>
          <NextEmailCard user={user} at={at} />
          <section className="card">
            <div className="card-title" style={{ fontSize: 16 }}>
              <span>Your topics</span>
              <Link href="/settings" className="small">Edit</Link>
            </div>
            <div className="chips">
              {topics.map((t) => (
                <Link key={t} href={`/topic/${t}`} className="chip">
                  <TopicIcon topic={t} size={16} color={getTopic(t)?.color} /> {getTopic(t)?.label}
                </Link>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="card-title" style={{ fontSize: 16 }}>
              <span>Recent emails</span>
              <Link href="/inbox" className="small">See all</Link>
            </div>
            {digests.slice(0, 3).map((d) => (
              <Link key={d.id} href={`/inbox/${d.id}`} className="mail-row" style={{ padding: "10px 0", gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <div>
                  <div className="subject" style={{ fontSize: 14 }}>{d.subject}</div>
                  <div className="sub">{d.createdAt.toLocaleString("en-NG", { timeZone: user.timezone, weekday: "short", hour: "numeric", minute: "2-digit" })}</div>
                </div>
                <span className={`status status-${d.status}`}>{d.status}</span>
              </Link>
            ))}
            {digests.length === 0 ? <p className="muted small">No emails yet.</p> : null}
          </section>
        </aside>
      </div>

      <h2 className="section-title">Picks by topic</h2>
      <div className="topic-grid">
        {topics.map((t) => {
          const items = rest.filter((a) => a.topic === t).slice(0, 3);
          return (
            <section key={t} className="card" aria-label={getTopic(t)?.label}>
              <div className="card-title">
                <Link href={`/topic/${t}`}>
                  <TopicIcon topic={t} size={20} /> {getTopic(t)?.label} <ChevronRight size={18} aria-hidden />
                </Link>
              </div>
              {items.length ? items.map((a) => <Story key={a.id} article={a} now={at} />) : <p className="muted small">More stories will appear after the next refresh.</p>}
            </section>
          );
        })}
      </div>
    </main>
  );
}
