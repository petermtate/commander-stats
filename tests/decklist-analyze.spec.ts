import { test, expect } from "@playwright/test";
import { readFile } from "fs/promises";
import path from "path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const deckPath = path.join(process.cwd(), "tests", "roon-blink.txt");

test("analyzes a pasted decklist and updates summary + grid", async ({ page }) => {
  const decklist = await readFile(deckPath, "utf8");

  await page.goto(new URL("/", baseURL).toString());

  await expect(page.getByRole("button", { name: /Switch to/ })).toBeVisible();

  const deckInput = page.locator("textarea");
  await deckInput.fill(decklist);
  await expect(deckInput).toHaveValue(/Roon of the Hidden Realm/);
  await expect(deckInput).not.toHaveValue(/Atraxa, Praetors' Voice/);

  const analyzeButton = page.getByRole("button", { name: "Analyze deck" });
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/analyze")),
    analyzeButton.click(),
  ]);

  const cardsStat = page.getByText("Cards").locator("..");
  await expect(cardsStat).toContainText("100");

  await expect(page.locator("table tbody tr")).toHaveCount(84);
  await expect(page.getByRole("cell", { name: "Roon of the Hidden Realm" })).toBeVisible();
});
