#!/usr/bin/env node

/**
 * Fetch MTGJSON datasets with checksum verification.
 *
 * Usage:
 *   npm run fetch:mtgjson -- --dataset atomic --dir data/mtgjson --force
 *
 * Defaults to AtomicCards.json.
 */

import { createHash } from "crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync } from "fs";
import { basename, join } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

type DatasetKey = "atomic" | "all-printings";

type DatasetInfo = {
  fileName: string;
  url: string;
  shaUrl: string;
};

const datasetMap: Record<DatasetKey, DatasetInfo> = {
  atomic: {
    fileName: "AtomicCards.json",
    url: "https://mtgjson.com/api/v5/AtomicCards.json",
    shaUrl: "https://mtgjson.com/api/v5/AtomicCards.json.sha256",
  },
  "all-printings": {
    fileName: "AllPrintings.json",
    url: "https://mtgjson.com/api/v5/AllPrintings.json",
    shaUrl: "https://mtgjson.com/api/v5/AllPrintings.json.sha256",
  },
};

async function main() {
  const { dataset, dir, force } = parseArgs();
  const datasetInfo = datasetMap[dataset];
  const sha256 = await fetchSha256(datasetInfo.shaUrl);

  mkdirSync(dir, { recursive: true });

  const destination = join(dir, basename(datasetInfo.fileName));
  const hasExisting = existsSync(destination);
  if (hasExisting && !force) {
    const matches = await verifyChecksum(destination, sha256);
    if (matches) {
      log(`✔ ${basename(destination)} already up to date (sha256 match).`);
      return;
    }
  }

  log(`↓ Downloading ${datasetInfo.fileName} to ${destination}`);
  await downloadFile(datasetInfo.url, destination);

  const valid = await verifyChecksum(destination, sha256);
  if (!valid) {
    throw new Error(`Checksum mismatch for ${destination}. Expected ${sha256}`);
  }

  log(`✔ Downloaded and verified ${destination}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let dataset: DatasetKey = "atomic";
  let dir = "data/mtgjson";
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dataset" && args[i + 1]) {
      const value = args[i + 1] as DatasetKey;
      if (!datasetMap[value]) {
        throw new Error(`Invalid dataset "${value}". Use one of: ${Object.keys(datasetMap).join(", ")}`);
      }
      dataset = value;
      i++;
    } else if (arg === "--dir" && args[i + 1]) {
      dir = args[i + 1];
      i++;
    } else if (arg === "--force") {
      force = true;
    }
  }

  return { dataset, dir, force };
}

async function downloadFile(url: string, destination: string) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url} (${res.status} ${res.statusText})`);
  }

  const nodeStream = Readable.fromWeb(res.body as any);
  const fileStream = createWriteStream(destination);
  await pipeline(nodeStream, fileStream);
}

async function fetchSha256(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch sha256 from ${url} (${res.status} ${res.statusText})`);
  }
  const text = (await res.text()).trim();
  if (!/^[a-fA-F0-9]{64}$/.test(text)) {
    throw new Error(`Unexpected sha256 format from ${url}: ${text}`);
  }
  return text;
}

async function verifyChecksum(filePath: string, expectedSha256: string): Promise<boolean> {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);

  return await new Promise<boolean>((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => {
      const digest = hash.digest("hex");
      resolve(digest.toLowerCase() === expectedSha256.toLowerCase());
    });
    stream.on("error", reject);
  });
}

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
