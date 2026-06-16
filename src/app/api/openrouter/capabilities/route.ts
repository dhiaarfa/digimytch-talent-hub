import { NextResponse } from "next/server";
import { getOpenRouterCapabilities } from "@/lib/openrouter-capabilities";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cache court côté client — évite de spammer OpenRouter */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const caps = await getOpenRouterCapabilities();
  return NextResponse.json(caps, {
    headers: {
      "Cache-Control": "private, max-age=120",
    },
  });
}
