#!/usr/bin/env node

/**
 * Trim MTGJSON AtomicCards.json into a smaller Commander-friendly dataset.
 *
 * Usage:
 *   npm run trim:mtgjson -- --input data/mtgjson/AtomicCards.json --output data/mtgjson/atomic-trimmed.json
 *
 * Options:
 *   --input <path>        Path to AtomicCards.json (default: data/mtgjson/AtomicCards.json)
 *   --output <path>       Output path for trimmed JSON (default: data/mtgjson/atomic-trimmed.json)
 *   --commander-only      Keep only Commander-legal cards (default: false)
 *   --all                 Keep all cards (default)
 *
 * Output shape:
 * {
 *   "meta": { generatedAt, commanderOnly, source },
 *   "cards": [ { name, manaCost, manaValue, colors, colorIdentity, types, subtypes, supertypes, keywords, layout, power, toughness, loyalty, text, type, legalities, identifiers, faces? } ]
 * }
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync } from "fs";
import { basename, dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { pick } = require("stream-json/filters/Pick");
const { streamObject } = require("stream-json/streamers/StreamObject");

type TrimOptions = {
  input: string;
  output: string;
  commanderOnly: boolean;
};

type AtomicCard = {
  name: string;
  faceName?: string;
  manaCost?: string;
  manaValue?: number;
  cmc?: number;
  colors?: string[];
  colorIdentity?: string[];
  types?: string[];
  supertypes?: string[];
  subtypes?: string[];
  keywords?: string[];
  layout?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  text?: string;
  type?: string;
  side?: string;
  identifiers?: {
    scryfallId?: string;
    scryfallOracleId?: string;
    mtgjsonV4Id?: string;
    oracleId?: string;
    uuid?: string;
  };
  legalities?: {
    commander?: string;
  };
  cardFaces?: AtomicCard[];
};

async function main() {
  const opts = parseArgs();
  mkdirSync(dirname(opts.output), { recursive: true });

  const sourceMeta = await readMeta(opts.input);

  await trimAtomic(opts, sourceMeta);
}

function parseArgs(): TrimOptions {
  const args = process.argv.slice(2);
  let input = "data/mtgjson/AtomicCards.json";
  let output = "data/mtgjson/atomic-trimmed.json";
  let commanderOnly = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--input" && args[i + 1]) {
      input = args[i + 1];
      i++;
    } else if (arg === "--output" && args[i + 1]) {
      output = args[i + 1];
      i++;
    } else if (arg === "--commander-only") {
      commanderOnly = true;
    } else if (arg === "--all") {
      commanderOnly = false;
    }
  }

  return { input, output, commanderOnly };
}

async function readMeta(inputPath: string): Promise<Record<string, unknown>> {
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  return await new Promise((resolve, reject) => {
    const pipeline = chain([createReadStream(inputPath), parser(), streamObject()]);
    let resolved = false;

    pipeline.on("data", (data: { key: string; value: unknown }) => {
      if (data.key === "meta") {
        resolved = true;
        resolve(data.value as Record<string, unknown>);
        pipeline.destroy();
      }
    });
    pipeline.on("error", reject);
    pipeline.on("close", () => {
      if (!resolved) {
        reject(new Error("Meta section not found in input file"));
      }
    });
  });
}

async function trimAtomic(opts: TrimOptions, sourceMeta: Record<string, unknown>) {
  const { input, output, commanderOnly } = opts;
  const readStream = createReadStream(input);
  const dataStream = chain([readStream, parser(), pick({ filter: "data" }), streamObject()]);

  const writeStream = createWriteStream(output);
  const outputMeta = {
    generatedAt: new Date().toISOString(),
    commanderOnly,
    source: basename(input),
    mtgjson: sourceMeta,
  };

  writeStream.write('{"meta":');
  writeStream.write(JSON.stringify(outputMeta));
  writeStream.write(',\n"cards":[\n');

  let first = true;
  let kept = 0;

  await new Promise<void>((resolve, reject) => {
    dataStream.on("data", (data: { key: string; value: unknown }) => {
      const selected = selectVariant(data.value as AtomicCard[], commanderOnly);
      if (!selected) return;

      const trimmed = trimCard(data.key as string, selected);
      if (!first) {
        writeStream.write(",\n");
      }
      writeStream.write("  " + JSON.stringify(trimmed));
      first = false;
      kept++;
    });

    dataStream.on("end", () => {
      writeStream.write("\n]}\n");
      writeStream.end();
      resolve();
    });

    dataStream.on("error", (err: unknown) => {
      writeStream.destroy();
      reject(err);
    });
  });

  log(`Trimmed ${kept} cards -> ${output}`);
}

function selectVariant(variants: AtomicCard[], commanderOnly: boolean): AtomicCard | null {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  if (!commanderOnly) return variants[0];

  const legal = variants.find((card) => card.legalities?.commander === "Legal");
  return legal ?? null;
}

function trimCard(name: string, card: AtomicCard) {
  const {
    manaCost,
    manaValue,
    cmc,
    colors,
    colorIdentity,
    types,
    supertypes,
    subtypes,
    keywords,
    layout,
    power,
    toughness,
    loyalty,
    text,
    type,
    side,
    identifiers,
    legalities,
    cardFaces,
  } = card;

  return {
    name,
    faceName: card.faceName,
    manaCost,
    manaValue: manaValue ?? cmc,
    colors,
    colorIdentity,
    types,
    supertypes,
    subtypes,
    keywords,
    layout,
    power,
    toughness,
    loyalty,
    text,
    type,
    side,
    legalities: legalities ? { commander: legalities.commander } : undefined,
    identifiers: identifiers
      ? {
          scryfallId: identifiers.scryfallId,
          scryfallOracleId: identifiers.scryfallOracleId,
          oracleId: identifiers.oracleId,
          mtgjsonV4Id: identifiers.mtgjsonV4Id,
          uuid: identifiers.uuid,
        }
      : undefined,
    faces: cardFaces?.map((face) => ({
      name: face.name ?? face.faceName,
      manaCost: face.manaCost,
      manaValue: face.manaValue ?? face.cmc,
      colors: face.colors,
      colorIdentity: face.colorIdentity,
      types: face.types,
      supertypes: face.supertypes,
      subtypes: face.subtypes,
      keywords: face.keywords,
      layout: face.layout,
      power: face.power,
      toughness: face.toughness,
      loyalty: face.loyalty,
      text: face.text,
      type: face.type,
      side: face.side,
    })),
  };
}

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
