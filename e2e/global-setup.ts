import { execSync } from "node:child_process";
import { E2E_DB, E2E_NOW } from "../playwright.config";

export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: E2E_DB, NEWSINMAIL_NOW: E2E_NOW };
  execSync("npx tsx scripts/migrate.ts", { env, stdio: "inherit" });
  execSync("npx tsx scripts/seed.ts", { env, stdio: "inherit" });
}
