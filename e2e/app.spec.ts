import { expect, test } from "@playwright/test";
import { signInAsDemo } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signInAsDemo(page);
});

test("home shows top stories and topic sections", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Top stories for you" })).toBeVisible();
  expect(await page.getByTestId("story").count()).toBeGreaterThan(5);
  await expect(page.getByRole("heading", { name: "Picks by topic" })).toBeVisible();
});

test("inbox lists sent, failed and skipped briefings", async ({ page }) => {
  await page.getByRole("link", { name: "Inbox", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  const list = page.getByTestId("mail-list");
  await expect(list.getByText("failed", { exact: true }).first()).toBeVisible();
  await expect(list.getByText("skipped", { exact: true }).first()).toBeVisible();
  await list.getByText(/SMTP timeout/).click();
  await expect(page.getByText(/Delivery failed: SMTP timeout/)).toBeVisible();
});

test("opening a briefing shows the rendered email", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByTestId("mail-list").getByRole("link").filter({ hasText: "Morning briefing" }).first().click();
  await expect(page.frameLocator('[data-testid="email-frame"]').getByText("Good morning, Chiamaka")).toBeVisible();
});

test("send a test email from the home page", async ({ page }) => {
  await page.getByRole("button", { name: "Send a test email now" }).click();
  await page.waitForURL(/\/inbox\/\d+\?test=1/);
  await expect(page.getByText("Test email sent to demo@newsinmail.ng")).toBeVisible();
});

test("settings saves delivery times and can pause briefings", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Evening time").selectOption("19:30");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Preferences saved")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Evening time")).toHaveValue("19:30");
  await expect(page.getByTestId("next-email")).toContainText("7:30 PM");

  await page.getByRole("button", { name: "Pause briefings" }).click();
  await expect(page.getByTestId("next-email")).toContainText("Paused");
  await page.getByRole("button", { name: "Resume briefings" }).click();
  await expect(page.getByTestId("next-email")).toContainText("7:30 PM");

  await page.getByLabel("Evening time").selectOption("18:00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Preferences saved")).toBeVisible();
});

test("topic tabs and search", async ({ page }) => {
  await page.getByRole("link", { name: "Sports", exact: true }).first().click();
  await expect(page).toHaveURL(/\/topic\/sports$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sports");
  await page.getByPlaceholder("Search for topics").fill("Lagos");
  await page.getByPlaceholder("Search for topics").press("Enter");
  await expect(page.getByRole("heading", { name: 'Results for "Lagos"' })).toBeVisible();
  expect(await page.getByTestId("story").count()).toBeGreaterThan(0);
});

test("another user's email returns not found", async ({ page }) => {
  const res = await page.goto("/inbox/999999");
  expect(res?.status()).toBe(404);
});
