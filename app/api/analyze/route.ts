import { NextResponse } from "next/server";

import { analyzeDecklist } from "@/lib/deck-analysis";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const decklist = typeof body?.decklist === "string" ? body.decklist : "";

  if (!decklist.trim()) {
    return NextResponse.json({ error: "Decklist is required." }, { status: 400 });
  }

  const analysis = analyzeDecklist(decklist);

  return NextResponse.json(analysis);
}
