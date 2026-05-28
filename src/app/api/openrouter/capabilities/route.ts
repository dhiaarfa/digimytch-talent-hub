import { NextResponse } from "next/server";
import { getOpenRouterCapabilities } from "@/lib/openrouter-capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cache court côté client — évite de spammer OpenRouter */
export async function GET() {
  const caps = await getOpenRouterCapabilities();
  return NextResponse.json(caps, {
    headers: {
      "Cache-Control": "private, max-age=120",
    },
  });
}
