import type { Page } from "@playwright/test";

export type Callout = { selector: string; label: string; nth?: number };
export type Shot = { file: string; title: string; callouts: string[] };

/**
 * Draws numbered callouts over elements, takes a screenshot, then removes them.
 * Returns the callout texts in the same order as the numbers.
 */
export async function shoot(page: Page, file: string, callouts: Callout[], opts: { fullPage?: boolean } = {}): Promise<string[]> {
  const boxes: { x: number; y: number; w: number; h: number; n: number }[] = [];
  for (const [i, c] of callouts.entries()) {
    const loc = page.locator(c.selector).nth(c.nth ?? 0);
    await loc.waitFor({ state: "visible", timeout: 15_000 });
    const box = await loc.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    });
    boxes.push({ ...box, n: i + 1 });
  }
  await page.evaluate((list) => {
    const layer = document.createElement("div");
    layer.id = "doc-callouts";
    layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:99999;pointer-events:none";
    for (const b of list) {
      const ring = document.createElement("div");
      ring.style.cssText = `position:absolute;left:${b.x - 4}px;top:${b.y - 4}px;width:${b.w + 8}px;height:${b.h + 8}px;border:3px solid #ea4335;border-radius:10px;box-sizing:border-box`;
      const dot = document.createElement("div");
      dot.textContent = String(b.n);
      const left = Math.max(2, b.x - 16);
      const top = Math.max(2, b.y - 16);
      dot.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:28px;height:28px;border-radius:50%;background:#ea4335;color:#fff;font:700 15px/28px Roboto,Arial,sans-serif;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.4)`;
      layer.append(ring, dot);
    }
    document.body.append(layer);
  }, boxes);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  await page.evaluate(() => document.getElementById("doc-callouts")?.remove());
  return callouts.map((c) => c.label);
}
