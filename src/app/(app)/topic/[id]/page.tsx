import { notFound } from "next/navigation";
import { Story } from "@/components/Story";
import { TopicIcon } from "@/components/TopicIcon";
import { now } from "@/lib/today";
import { getTopic } from "@/lib/topics";
import { requireUser } from "@/server/auth";
import { userTopics } from "@/server/digest";
import { feedForTopics } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/topic/[id]">) {
  const { id } = await params;
  return { title: getTopic(id)?.label ?? "Topic" };
}

export default async function TopicPage({ params }: PageProps<"/topic/[id]">) {
  const { id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();
  const user = await requireUser();
  const at = now();
  const [items, followed] = await Promise.all([feedForTopics([topic.id], at, 40), userTopics(user.id)]);
  const following = followed.includes(topic.id);

  return (
    <main className="page" style={{ maxWidth: 860 }}>
      <div className="briefing-head">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TopicIcon topic={topic.id} size={28} color={topic.color} /> {topic.label}
          </h1>
          <p>{following ? "You follow this topic. It is included in your emails." : "You do not follow this topic. Add it in Settings to get it by email."}</p>
        </div>
      </div>
      <section className="card">
        {items.length === 0 ? <p className="muted">No stories in the last 3 days.</p> : items.map((a, i) => <Story key={a.id} article={a} now={at} lead={i === 0} />)}
      </section>
      <p className="small muted" style={{ marginTop: 12 }}>Sources: {topic.feeds.map((f) => f.source).join(", ")}</p>
    </main>
  );
}
