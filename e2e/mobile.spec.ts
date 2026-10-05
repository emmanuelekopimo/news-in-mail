import { expect, test } from "@playwright/test";
import { signInAsDemo } from "./helpers";

test("mobile: home, inbox and settings fit the screen", async ({ page }) => {
  await signInAsDemo(page);
  for (const path of ["/news", "/inbox", "/settings", "/topic/nigeria"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
  }
  await page.goto("/news");
  await expect(page.getByPlaceholder("Search for topics")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
});

test("mobile: sign in and open the latest briefing", async ({ page }) => {
  await signInAsDemo(page);
  await page.getByLabel(/Inbox/).first().click();
  await page.getByTestId("mail-list").getByRole("link").first().click();
  await expect(page.getByRole("link", { name: "Back to inbox" })).toBeVisible();
});
