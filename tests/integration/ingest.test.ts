import { afterAll, describe, expect, it } from "vitest";
import { pool } from "@/db";
import { parseFeed } from "@/server/ingest";

afterAll(async () => {
  await pool.end();
});

const XML = `<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>
<item><title>Lagos — rain &amp; traffic</title><link>https://n.test/1</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Heavy rain hit Lagos. Read More: https://n.test/1</p>]]></description></item>
<item><title>Future dated</title><link>https://n.test/2</link><pubDate>Mon, 05 Oct 2026 23:00:00 GMT</pubDate><description>x</description></item>
<item><title>No link</title><description>y</description></item>
</channel></rss>`;

describe("parseFeed", () => {
  it("cleans titles and excerpts and clamps future dates", async () => {
    const at = new Date("2026-10-05T12:00:00Z");
    const items = await parseFeed(XML, "nigeria", "Test", at);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Lagos - rain & traffic");
    expect(items[0].excerpt).toBe("Heavy rain hit Lagos.");
    expect(items[1].publishedAt).toEqual(at);
  });
});
