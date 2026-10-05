import { expect, test } from "@playwright/test";

test("new user picks topics and receives a test email", async ({ page }) => {
  const email = `ngozi.${Date.now()}@example.ng`;
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Ngozi Eze");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");
  await expect(page.getByRole("heading", { name: "Welcome, Ngozi" })).toBeVisible();

  // Clear the default topics to trigger the validation error.
  for (const name of ["Nigeria", "World"]) await page.getByRole("checkbox", { name }).uncheck({ force: true });
  await page.getByRole("button", { name: "Finish and send test email" }).click();
  await expect(page.getByText("Pick at least one topic")).toBeVisible();

  await page.getByRole("checkbox", { name: "Technology" }).check({ force: true });
  await page.getByRole("checkbox", { name: "Sports" }).check({ force: true });
  await page.getByRole("button", { name: "Finish and send test email" }).click();
  await page.waitForURL(/\/inbox\/\d+\?welcome=1/);
  await expect(page.getByRole("status")).toContainText(`We sent this test email to ${email}`);
  const frame = page.frameLocator('[data-testid="email-frame"]');
  await expect(frame.getByText("Hello, Ngozi")).toBeVisible();
  await expect(frame.getByText("TECHNOLOGY", { exact: false }).first()).toBeVisible();

  await page.goto("/news");
  await expect(page.getByRole("link", { name: "Technology" }).first()).toBeVisible();
});
