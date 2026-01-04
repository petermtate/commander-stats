import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tempDatasetPath = path.resolve("data/mtgjson/test-atomic-trimmed.json");

const sampleDataset = {
  cards: [
    {
      name: "Atraxa, Praetors' Voice",
      manaValue: 4,
      colorIdentity: ["W", "U", "B", "G"],
      type: "Legendary Creature — Angel Horror",
      types: ["Legendary", "Creature"],
    },
    {
      name: "Sol Ring",
      manaValue: 1,
      colorIdentity: [],
      type: "Artifact",
      types: ["Artifact"],
    },
    {
      name: "Arcane Signet",
      manaValue: 2,
      colorIdentity: ["W", "U", "B", "G"],
      type: "Artifact",
      types: ["Artifact"],
    },
  ],
};

beforeEach(() => {
  vi.resetModules();
  fs.mkdirSync(path.dirname(tempDatasetPath), { recursive: true });
  fs.writeFileSync(tempDatasetPath, JSON.stringify(sampleDataset), "utf8");
});

afterEach(() => {
  if (fs.existsSync(tempDatasetPath)) {
    fs.unlinkSync(tempDatasetPath);
  }
});

describe("parseDecklist", () => {
  it("parses counts and trims whitespace", async () => {
    const { parseDecklist } = await import("../deck-analysis");
    const parsed = parseDecklist("2 Sol Ring\nAtraxa, Praetors' Voice\n  3   Cultivate  \n");
    expect(parsed).toEqual([
      { count: 2, name: "Sol Ring" },
      { count: 1, name: "Atraxa, Praetors' Voice" },
      { count: 3, name: "Cultivate" },
    ]);
  });
});

describe("analyzeDecklist", () => {
  it("computes totals, average CMC, colors, and commander using loaded data", async () => {
    const { analyzeDecklist, loadCardIndex } = await import("../deck-analysis");
    const index = loadCardIndex(tempDatasetPath);
    expect(index).not.toBeNull();

    const analysis = analyzeDecklist(
      "1 Atraxa, Praetors' Voice\n1 Sol Ring\n2 Arcane Signet\n1 Unknown Card",
    );

    expect(analysis.totalCards).toBe(5);
    expect(analysis.avgCmc).toBe(2.25);
    expect(analysis.colors.sort()).toEqual(["B", "G", "U", "W"]);
    expect(analysis.commander).toBe("Atraxa, Praetors' Voice");
    expect(analysis.source).toBe("trimmed-mtgjson");
  });
});
