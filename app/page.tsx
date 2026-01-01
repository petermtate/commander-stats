import Image from "next/image";
import { ChevronRight, FlameKindling, Leaf, Link as LinkIcon, ListFilter, Share, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { analyzeDecklist } from "@/lib/deck-analysis";
import { cn } from "@/lib/utils";

const sampleDecklist = `1 Atraxa, Praetors' Voice
1 Sol Ring
1 Arcane Signet
1 Farseek
1 Cultivate
1 Swords to Plowshares
1 Cyclonic Rift
1 Rhystic Study
1 Smothering Tithe
1 Fierce Guardianship
1 Teferi's Protection`;

const sampleAnalysis = analyzeDecklist(sampleDecklist);

const sampleSummary = {
  commander: {
    name: sampleAnalysis.commander ?? "Atraxa, Praetors' Voice",
    colors: sampleAnalysis.colors.length ? sampleAnalysis.colors : ["W", "U", "B", "G"],
    tags: ["Proliferate", "Goodstuff"],
    power: "High",
    image:
      "https://cards.scryfall.io/art_crop/front/5/1/51ed9df0-3c43-4cea-9e83-1efa045c1f9b.jpg?1682206226",
  },
  stats: {
    cards: sampleAnalysis.totalCards || 100,
    cmc: sampleAnalysis.avgCmc ?? 3.6,
    landsPct: 38,
    budget: "$450",
  },
};

const keyMetrics = [
  { label: "Avg CMC", value: sampleSummary.stats.cmc.toString() },
  { label: "Lands", value: "38" },
  { label: "Ramp", value: "14" },
  { label: "Draw", value: "12" },
  { label: "Removal", value: "10" },
  { label: "Wincons", value: "3" },
];

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

const cardsTable = [
  { name: "Sol Ring", type: "Artifact", role: "Ramp", cmc: 1, price: "$2.50" },
  { name: "Smothering Tithe", type: "Enchantment", role: "Ramp", cmc: 4, price: "$43.00" },
  { name: "Cyclonic Rift", type: "Instant", role: "Interaction", cmc: 2, price: "$33.00" },
  { name: "Fierce Guardianship", type: "Instant", role: "Interaction", cmc: 3, price: "$70.00" },
  { name: "Teferi's Protection", type: "Instant", role: "Protection", cmc: 3, price: "$33.00" },
];

const curve = [
  { bin: "0-1", count: 12 },
  { bin: "2", count: 18 },
  { bin: "3", count: 22 },
  { bin: "4", count: 18 },
  { bin: "5", count: 12 },
  { bin: "6", count: 8 },
  { bin: "7+", count: 6 },
];

export default function Page() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
      <Hero />
      <DeckSummary />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <MainAnalyzer />
        <Sidebar />
      </div>
      <CardTable />
      <ExportBar />
    </div>
  );
}

function Hero() {
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
            <Textarea defaultValue={sampleDecklist} />
            <div className="flex flex-wrap items-center gap-3">
              <Button>Analyze deck</Button>
              <Button variant="secondary">Upload .txt / .csv</Button>
              <Button variant="ghost" className="text-sm" size="sm">
                Use sample deck
              </Button>
            </div>
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

function DeckSummary() {
  const { commander, stats } = sampleSummary;
  return (
    <Card className="border border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-muted">
            <Image alt={commander.name} src={commander.image} fill sizes="56px" className="object-cover" unoptimized />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{commander.name}</h3>
              <Badge variant="accent">{commander.power}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ColorPips colors={commander.colors} />
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              {commander.tags.map((tag) => (
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
          <SummaryStat label="Lands %" value={`${stats.landsPct}%`} />
          <SummaryStat label="Budget" value={stats.budget} />
        </div>
      </CardContent>
    </Card>
  );
}

function MainAnalyzer() {
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
            <MetricGrid />
            <TypeBreakdown />
            <CurveChart />
            <SynergyHighlights />
          </TabsContent>
          <TabsContent value="curve">
            <CurveChart highlight />
          </TabsContent>
          <TabsContent value="synergy">
            <SynergyHighlights expanded />
          </TabsContent>
          <TabsContent value="staples">
            <StaplesList />
          </TabsContent>
          <TabsContent value="mana">
            <ManaPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MetricGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {keyMetrics.map((metric) => (
        <div key={metric.label} className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="text-xl font-semibold text-foreground">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function TypeBreakdown() {
  const breakdown = [
    { label: "Creatures", value: 24 },
    { label: "Instants", value: 18 },
    { label: "Sorceries", value: 10 },
    { label: "Artifacts", value: 12 },
    { label: "Enchantments", value: 12 },
    { label: "Planeswalkers", value: 2 },
    { label: "Lands", value: 22 },
  ];
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
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.value / 1.5}%` }} />
            </div>
            <span className="w-10 text-right text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurveChart({ highlight }: { highlight?: boolean }) {
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

function ManaPanel() {
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Mana</h4>
        <Badge variant="secondary">Color + Fixing</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-foreground">Color identity</p>
          <ColorPips colors={["W", "U", "B", "G"]} />
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

function CardTable() {
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
              {cardsTable.map((card, idx) => (
                <tr key={card.name} className="border-b border-border/40">
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
