import { expect, test } from "@playwright/test";
import { signInAsDemo } from "./helpers";

test("landing page explains the product and links to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("summarized");
  await page.getByRole("link", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("protected pages redirect to sign in", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("demo login is pre-filled and works", async ({ page }) => {
  await signInAsDemo(page);
  await expect(page.getByRole("heading", { name: /Good afternoon, Chiamaka/ })).toBeVisible();
  await expect(page.getByTestId("next-email")).toContainText("6:00 PM");
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".alert-error")).toHaveText("Wrong email or password");
});

test("sign up shows inline field errors", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("A");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
});

test("sign out returns to sign in", async ({ page }) => {
  await signInAsDemo(page);
  await page.getByLabel("Account menu").click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});
