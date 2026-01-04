import { describe, expect, it } from "vitest";

import { analyzeDecklist, parseDecklist } from "../deck-analysis";

describe("validate analysis", () => {
  it("parses a basic decklist and produces totals", () => {
    const decklist = `1 Atraxa, Praetors' Voice
1 Sol Ring
1 Arcane Signet
1 Cultivate
1 Swords to Plowshares`;

    const parsed = parseDecklist(decklist);
    expect(parsed.length).toBe(5);
    expect(parsed[0].name).toBe("Atraxa, Praetors' Voice");

    const analysis = analyzeDecklist(decklist);
    expect(analysis.totalCards).toBe(5);
  });
});
