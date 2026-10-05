import type { Article } from "@/db/schema";
import { fallbackSummary, initials, relativeTime } from "@/lib/text";
import { getTopic } from "@/lib/topics";
import { TopicArt } from "./TopicArt";

export function Story({ article, now, lead = false, showArt = true }: { article: Article; now: Date; lead?: boolean; showArt?: boolean }) {
  const color = getTopic(article.topic)?.color ?? "#1a73e8";
  const summary = article.summary ?? fallbackSummary(article.excerpt);
  const body = (
    <div>
      <div className="story-meta">
        <span className="source-badge" style={{ background: color }}>{initials(article.source)}</span>
        <span className="source-name">{article.source}</span>
        {article.summary && article.summaryModel !== "sample" ? <span className="chip-ai" title={`Summary by ${article.summaryModel}`}>AI summary</span> : null}
        {article.isSample ? <span className="chip-sample">Sample</span> : null}
      </div>
      <h3>
        <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
      </h3>
      {summary ? <p>{summary}</p> : null}
      <time dateTime={article.publishedAt.toISOString()}>{relativeTime(article.publishedAt, now)}</time>
    </div>
  );
  if (lead) {
    return (
      <article className="story story-lead" data-testid="story">
        {showArt ? <div className="thumb thumb-lead"><TopicArt topic={article.topic} seed={article.id} /></div> : null}
        {body}
      </article>
    );
  }
  return (
    <article className="story" data-testid="story">
      {body}
      {showArt ? <div className="thumb"><TopicArt topic={article.topic} seed={article.id} /></div> : null}
    </article>
  );
}
