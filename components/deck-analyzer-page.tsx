"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronRight, FlameKindling, Leaf, Link as LinkIcon, ListFilter, Share, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DeckAnalysis, DeckAnalysisCard } from "@/lib/deck-analysis";

type DeckAnalyzerPageProps = {
  initialDecklist: string;
  initialAnalysis: DeckAnalysis;
};

const defaultCommanderImage =
  "https://cards.scryfall.io/art_crop/front/5/1/51ed9df0-3c43-4cea-9e83-1efa045c1f9b.jpg?1682206226";

const typeRows = [
  { key: "Creature", label: "Creatures" },
  { key: "Instant", label: "Instants" },
  { key: "Sorcery", label: "Sorceries" },
  { key: "Artifact", label: "Artifacts" },
  { key: "Enchantment", label: "Enchantments" },
  { key: "Planeswalker", label: "Planeswalkers" },
  { key: "Land", label: "Lands" },
];

const curveBins = ["0-1", "2", "3", "4", "5", "6", "7+"];

const healthChecks = [
  { status: "warn", label: "Low ramp density (need 15+)" },
  { status: "ok", label: "Interaction looks healthy" },
  { status: "warn", label: "Color fixing risk (heavy blue pips)" },
];

const upgrades = [
  { action: "Add", card: "Bloom Tender", note: "+ fixing + ramp" },
  { action: "Add", card: "Mystic Remora", note: "Early draw" },
  { action: "Cut", card: "Plague Myr", note: "Low impact" },
  { action: "Cut", card: "Azorius Keyrune", note: "Swap for 2 CMC rock" },
];

export default function DeckAnalyzerPage({ initialDecklist, initialAnalysis }: DeckAnalyzerPageProps) {
  const [decklist, setDecklist] = useState(initialDecklist);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const typeCounts = useMemo(() => buildTypeCounts(analysis.cards), [analysis.cards]);
  const curve = useMemo(() => buildCurve(analysis.cards), [analysis.cards]);
  const cardRows = useMemo(() => buildCardRows(analysis.cards), [analysis.cards]);

  const landsCount = typeCounts.Land ?? 0;
  const landsPct = analysis.totalCards > 0 ? Math.round((landsCount / analysis.totalCards) * 100) : null;

  const commanderName = analysis.commander ?? "Commander not found";
  const commanderColors = analysis.colors.length ? analysis.colors : [];
  const commanderTags = analysis.commander ? ["Local analysis"] : [];
  const commanderPower = analysis.commander ? "Analyzed" : "Unknown";

  const summaryStats = {
    cards: analysis.totalCards || "—",
    cmc: analysis.avgCmc ?? "—",
    landsPct: landsPct !== null ? `${landsPct}%` : "—",
    budget: "—",
  };

  const keyMetrics = [
    { label: "Avg CMC", value: analysis.avgCmc ?? "—" },
    { label: "Lands", value: analysis.totalCards ? landsCount : "—" },
    { label: "Ramp", value: "—" },
    { label: "Draw", value: "—" },
    { label: "Removal", value: "—" },
    { label: "Wincons", value: "—" },
  ];

  const breakdown = typeRows.map((row) => ({ label: row.label, value: typeCounts[row.key] ?? 0 }));

  async function handleAnalyze(nextDecklist?: string) {
    const targetDecklist = (nextDecklist ?? decklist).trim();
    if (!targetDecklist) {
      setError("Paste a decklist to analyze.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decklist: targetDecklist }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to analyze decklist.");
      }

      const payload = (await response.json()) as DeckAnalysis;
      setAnalysis(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze decklist.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseSample() {
    setDecklist(initialDecklist);
    void handleAnalyze(initialDecklist);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
      <Hero
        decklist={decklist}
        onDecklistChange={setDecklist}
        onAnalyze={handleAnalyze}
        onUseSample={handleUseSample}
        isLoading={isLoading}
        error={error}
      />
      <DeckSummary
        commanderName={commanderName}
        commanderImage={defaultCommanderImage}
        commanderColors={commanderColors}
        commanderTags={commanderTags}
        commanderPower={commanderPower}
        stats={summaryStats}
      />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <MainAnalyzer keyMetrics={keyMetrics} breakdown={breakdown} curve={curve} colors={commanderColors} />
        <Sidebar />
      </div>
      <CardTable cards={cardRows} />
      <ExportBar />
    </div>
  );
}

type HeroProps = {
  decklist: string;
  onDecklistChange: (value: string) => void;
  onAnalyze: (nextDecklist?: string) => void;
  onUseSample: () => void;
  isLoading: boolean;
  error: string | null;
};

function Hero({ decklist, onDecklistChange, onAnalyze, onUseSample, isLoading, error }: HeroProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">Commander deck analyzer</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Analyze any Commander deck in seconds
          </h1>
          <p className="mt-2 text-muted-foreground">
            Paste a decklist or upload a file. We’ll calculate color identity, curve, ramp/draw density, and health
            checks instantly.
          </p>
        </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Paste decklist</CardTitle>
            <CardDescription>Supports Moxfield, Archidekt, text exports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={decklist} onChange={(event) => onDecklistChange(event.target.value)} />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => onAnalyze()} disabled={isLoading}>
                {isLoading ? "Analyzing..." : "Analyze deck"}
              </Button>
              <Button variant="secondary" disabled={isLoading}>
                Upload .txt / .csv
              </Button>
              <Button variant="ghost" className="text-sm" size="sm" onClick={onUseSample} disabled={isLoading}>
                Use sample deck
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
      <Card className="h-fit border-dashed">
        <CardHeader>
          <CardTitle>Supported formats</CardTitle>
          <CardDescription>Paste text or URLs. Imports stay local.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <span>Moxfield / Archidekt</span>
            <Badge variant="secondary">URL</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <span>Text exports</span>
            <Badge variant="secondary">.txt</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <span>CSV lists</span>
            <Badge variant="secondary">.csv</Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

type DeckSummaryProps = {
  commanderName: string;
  commanderImage: string;
  commanderColors: string[];
  commanderTags: string[];
  commanderPower: string;
  stats: {
    cards: string | number;
    cmc: string | number;
    landsPct: string;
    budget: string;
  };
};

function DeckSummary({
  commanderName,
  commanderImage,
  commanderColors,
  commanderTags,
  commanderPower,
  stats,
}: DeckSummaryProps) {
  return (
    <Card className="border border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-muted">
            <Image alt={commanderName} src={commanderImage} fill sizes="56px" className="object-cover" unoptimized />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{commanderName}</h3>
              <Badge variant="accent">{commanderPower}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ColorPips colors={commanderColors} />
              {commanderTags.length > 0 && <span className="h-1 w-1 rounded-full bg-muted-foreground" />}
              {commanderTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <SummaryStat label="Cards" value={stats.cards} />
          <SummaryStat label="Avg CMC" value={stats.cmc} />
          <SummaryStat label="Lands %" value={stats.landsPct} />
          <SummaryStat label="Budget" value={stats.budget} />
        </div>
      </CardContent>
    </Card>
  );
}

type MainAnalyzerProps = {
  keyMetrics: Array<{ label: string; value: string | number }>;
  breakdown: Array<{ label: string; value: number }>;
  curve: Array<{ bin: string; count: number }>;
  colors: string[];
};

function MainAnalyzer({ keyMetrics, breakdown, curve, colors }: MainAnalyzerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle>Analyzer</CardTitle>
          <Badge variant="secondary">Live</Badge>
        </div>
        <CardDescription>Curve, colors, synergy highlights, and staples.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curve">Curve</TabsTrigger>
            <TabsTrigger value="synergy">Synergy</TabsTrigger>
            <TabsTrigger value="staples">Staples</TabsTrigger>
            <TabsTrigger value="mana">Mana</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <MetricGrid metrics={keyMetrics} />
            <TypeBreakdown breakdown={breakdown} />
            <CurveChart curve={curve} />
            <SynergyHighlights />
          </TabsContent>
          <TabsContent value="curve">
            <CurveChart curve={curve} highlight />
          </TabsContent>
          <TabsContent value="synergy">
            <SynergyHighlights expanded />
          </TabsContent>
          <TabsContent value="staples">
            <StaplesList />
          </TabsContent>
          <TabsContent value="mana">
            <ManaPanel colors={colors} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="text-xl font-semibold text-foreground">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function TypeBreakdown({ breakdown }: { breakdown: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Type breakdown</h4>
        <Badge variant="secondary">Bar</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {breakdown.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="w-32">{row.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${row.value ? row.value / 1.5 : 0}%` }}
              />
            </div>
            <span className="w-10 text-right text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurveChart({ curve, highlight }: { curve: Array<{ bin: string; count: number }>; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Mana curve</h4>
        {highlight && <Badge variant="accent">Detail</Badge>}
      </div>
      <div className="mt-4 grid grid-cols-7 items-end gap-2">
        {curve.map((bucket) => (
          <div key={bucket.bin} className="flex flex-col items-center gap-2">
            <div
              className="flex w-full items-end justify-center rounded-md bg-primary/20 text-sm font-semibold text-foreground"
              style={{ height: `${bucket.count * 4}px` }}
            >
              <span className="pb-1 text-xs">{bucket.count}</span>
            </div>
            <span className="text-xs text-muted-foreground">{bucket.bin}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SynergyHighlights({ expanded = false }: { expanded?: boolean }) {
  const items = [
    { title: "Proliferate shell", detail: "Atraxa + Tezzeret's Gambit + Evolution Sage" },
    { title: "Counters engines", detail: "Deepglow Skate, Hardened Scales, Branching Evolution" },
    { title: "Defense + draw", detail: "Teferi's Protection, Fierce Guardianship, Mystic Remora" },
  ];
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Synergy highlights</h4>
        {!expanded && (
          <Button variant="ghost" size="sm" className="gap-1">
            View more <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg border border-border/70 bg-background/50 px-3 py-2">
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
          </div>
        ))}
        {!expanded && <p className="text-xs text-muted-foreground">Based on decklist text (local only).</p>}
      </div>
    </div>
  );
}

function StaplesList() {
  const staples = [
    { name: "Cyclonic Rift", role: "Interaction" },
    { name: "Smothering Tithe", role: "Ramp" },
    { name: "Fierce Guardianship", role: "Protection" },
    { name: "Rhystic Study", role: "Draw" },
    { name: "Teferi's Protection", role: "Defense" },
  ];
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Staples & upgrades</h4>
        <Badge variant="secondary">Top 5</Badge>
      </div>
      <div className="space-y-2">
        {staples.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
            <div>
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.role}</p>
            </div>
            <Button size="sm" variant="ghost">
              Details
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManaPanel({ colors }: { colors: string[] }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Mana</h4>
        <Badge variant="secondary">Color + Fixing</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-foreground">Color identity</p>
          <ColorPips colors={colors} />
          <p className="mt-2 text-sm text-muted-foreground">Pips vs land sources</p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Fixing checks</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Shock lands: 4</li>
            <li>Fetch lands: 6</li>
            <li>Basics: 10</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Commander</CardTitle>
          <CardDescription>Oracle text and roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Flying, vigilance, deathtouch, lifelink. At the beginning of your end step, proliferate.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Proliferate</Badge>
            <Badge variant="secondary">Counters</Badge>
            <Badge variant="secondary">Midrange</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Health checks</CardTitle>
          <CardDescription>Warnings to address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {healthChecks.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2",
                item.status === "warn" ? "border-accent/60 bg-accent/10" : "border-border/70",
              )}
            >
              <span className="text-sm text-foreground">{item.label}</span>
              {item.status === "warn" ? (
                <FlameKindling className="h-4 w-4 text-accent" />
              ) : (
                <Leaf className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upgrades</CardTitle>
          <CardDescription>Top adds and cuts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {upgrades.map((item) => (
            <div key={item.card} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
              <div>
                <p className="font-medium text-foreground">
                  {item.action}: {item.card}
                </p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
              <Button size="sm" variant="ghost">
                Apply
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
          <CardDescription>Filter high-cost staples</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="range" min={50} max={1000} defaultValue={500} className="w-full" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>$50</span>
            <span>$1000+</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type CardTableProps = {
  cards: Array<{ name: string; type: string; role: string; cmc: string | number; price: string }>;
};

function CardTable({ cards }: CardTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Card grid</CardTitle>
          <CardDescription>Filter by type, color, role.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" size="sm">
            <ListFilter className="h-4 w-4" />
            Filters
          </Button>
          <Input className="w-48" placeholder="Search cards" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border/70">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2 text-right">CMC</th>
                <th className="px-3 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, idx) => (
                <tr key={`${card.name}-${idx}`} className="border-b border-border/40">
                  <td className="px-3 py-2 font-medium text-foreground">{card.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{card.type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{card.role}</td>
                  <td className="px-3 py-2 text-right text-foreground">{card.cmc}</td>
                  <td className="px-3 py-2 text-right text-foreground">{card.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportBar() {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="font-semibold text-foreground">Export & share</p>
          <p className="text-sm text-muted-foreground">Copy report, export CSV, or share a link.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Copy report
          </Button>
          <Button variant="secondary" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="gap-2">
            <Share className="h-4 w-4" />
            Share link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-left shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ColorPips({ colors }: { colors: string[] }) {
  if (colors.length === 0) {
    return <span className="text-xs text-muted-foreground">Colorless</span>;
  }

  const map: Record<string, string> = {
    W: "bg-amber-200 text-amber-900",
    U: "bg-sky-200 text-sky-900",
    B: "bg-slate-900 text-slate-100",
    R: "bg-red-200 text-red-900",
    G: "bg-emerald-200 text-emerald-900",
  };
  return (
    <div className="flex items-center gap-1">
      {colors.map((c) => (
        <span
          key={c}
          className={cn("flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs", map[c])}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function buildTypeCounts(cards: DeckAnalysisCard[]) {
  const counts: Record<string, number> = {};
  for (const row of typeRows) {
    counts[row.key] = 0;
  }

  for (const card of cards) {
    const typeKeys = new Set<string>();
    if (card.typeLine) {
      for (const row of typeRows) {
        if (card.typeLine.includes(row.key)) {
          typeKeys.add(row.key);
        }
      }
    }
    if (card.types) {
      for (const row of typeRows) {
        if (card.types.includes(row.key)) {
          typeKeys.add(row.key);
        }
      }
    }
    for (const key of typeKeys) {
      counts[key] = (counts[key] ?? 0) + card.count;
    }
  }

  return counts;
}

function buildCurve(cards: DeckAnalysisCard[]) {
  const counts: Record<string, number> = {};
  for (const bin of curveBins) {
    counts[bin] = 0;
  }

  for (const card of cards) {
    if (card.manaValue === null || card.manaValue === undefined) continue;
    const value = Math.floor(card.manaValue);
    const bin = value >= 7 ? "7+" : value <= 1 ? "0-1" : String(value);
    counts[bin] = (counts[bin] ?? 0) + card.count;
  }

  return curveBins.map((bin) => ({ bin, count: counts[bin] ?? 0 }));
}

function buildCardRows(cards: DeckAnalysisCard[]) {
  return cards.map((card) => ({
    name: card.count > 1 ? `${card.count} ${card.name}` : card.name,
    type: card.typeLine ?? (card.types ? card.types.join(" ") : "—"),
    role: "—",
    cmc: card.manaValue ?? "—",
    price: "—",
  }));
}
