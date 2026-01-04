import fs from "fs";
import path from "path";

type TrimmedCard = {
  name: string;
  manaValue?: number;
  manaCost?: string;
  colorIdentity?: string[];
  types?: string[];
  type?: string;
};

type CardIndex = Map<string, TrimmedCard>;

let cachedIndex: CardIndex | null = null;

export type DeckAnalysisCard = {
  name: string;
  count: number;
  manaValue: number | null;
  typeLine: string | null;
  types: string[] | null;
  colorIdentity: string[];
};

export type DeckAnalysis = {
  totalCards: number;
  avgCmc: number | null;
  colors: string[];
  commander: string | null;
  source: "trimmed-mtgjson" | "stub";
  cards: DeckAnalysisCard[];
};

export function parseDecklist(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        return { count: Number(match[1]), name: match[2] };
      }
      return { count: 1, name: line };
    });
}

export function loadCardIndex(datasetPath = "data/mtgjson/atomic-trimmed.json"): CardIndex | null {
  if (cachedIndex) return cachedIndex;
  const absolute = path.resolve(datasetPath);
  if (!fs.existsSync(absolute)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(absolute, "utf8");
    const parsed = JSON.parse(raw) as { cards: TrimmedCard[] };
    cachedIndex = new Map(parsed.cards.map((card) => [card.name.toLowerCase(), card]));
    return cachedIndex;
  } catch (err) {
    console.error("Failed to load trimmed MTGJSON", err);
    return null;
  }
}

export function analyzeDecklist(text: string): DeckAnalysis {
  const list = parseDecklist(text);
  const index = loadCardIndex();

  const totalCards = list.reduce((sum, card) => sum + card.count, 0);

  let cmcSum = 0;
  let cmcCount = 0;
  let commanderCandidate: TrimmedCard | null = null;
  const colors = new Set<string>();
  const cards: DeckAnalysisCard[] = [];

  for (const entry of list) {
    const data = index?.get(entry.name.toLowerCase());
    if (data?.manaValue !== undefined) {
      cmcSum += data.manaValue * entry.count;
      cmcCount += entry.count;
    }
    if (data?.colorIdentity) {
      data.colorIdentity.forEach((c) => colors.add(c));
    }
    if (!commanderCandidate && (data?.type?.includes("Legendary Creature") || data?.types?.includes("Legendary"))) {
      commanderCandidate = data;
    }
    cards.push({
      name: entry.name,
      count: entry.count,
      manaValue: data?.manaValue ?? null,
      typeLine: data?.type ?? (data?.types ? data.types.join(" ") : null),
      types: data?.types ?? null,
      colorIdentity: data?.colorIdentity ?? [],
    });
  }

  const avgCmc = cmcCount > 0 ? Number((cmcSum / cmcCount).toFixed(2)) : null;

  return {
    totalCards,
    avgCmc,
    colors: Array.from(colors),
    commander: commanderCandidate?.name ?? null,
    source: index ? "trimmed-mtgjson" : "stub",
    cards,
  };
}
