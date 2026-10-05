import { expect, type Page } from "@playwright/test";

export async function signInAsDemo(page: Page) {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toHaveValue("demo@newsinmail.ng");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/news");
}
