import DeckAnalyzerPage from "@/components/deck-analyzer-page";
import { analyzeDecklist } from "@/lib/deck-analysis";

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

export default function Page() {
  const initialAnalysis = analyzeDecklist(sampleDecklist);

  return <DeckAnalyzerPage initialDecklist={sampleDecklist} initialAnalysis={initialAnalysis} />;
}
