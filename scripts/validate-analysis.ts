#!/usr/bin/env node

import assert from "assert";

import { analyzeDecklist, parseDecklist } from "../lib/deck-analysis";

const decklist = `1 Atraxa, Praetors' Voice
1 Sol Ring
1 Arcane Signet
1 Cultivate
1 Swords to Plowshares`;

const parsed = parseDecklist(decklist);
assert.strictEqual(parsed.length, 5, "Expected 5 parsed lines");
assert.strictEqual(parsed[0].name, "Atraxa, Praetors' Voice");

const analysis = analyzeDecklist(decklist);
assert.strictEqual(analysis.totalCards, 5, "Total cards should match parsed counts");

console.log("Deck analysis validation passed.");
