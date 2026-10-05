import { Story } from "@/components/Story";
import { now } from "@/lib/today";
import { searchArticles } from "@/server/queries";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const results = query.length >= 2 ? await searchArticles(query) : [];
  const at = now();
  return (
    <main className="page" style={{ maxWidth: 860 }}>
      <div className="briefing-head">
        <div>
          <h1>{query ? `Results for "${query}"` : "Search"}</h1>
          <p>{query.length >= 2 ? `${results.length} stories found` : "Type at least 2 characters in the search bar."}</p>
        </div>
      </div>
      {results.length > 0 ? (
        <section className="card">
          {results.map((a) => <Story key={a.id} article={a} now={at} />)}
        </section>
      ) : null}
    </main>
  );
}
