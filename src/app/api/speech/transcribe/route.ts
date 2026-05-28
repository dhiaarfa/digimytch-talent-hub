import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const OPENROUTER_STT_URL = "https://openrouter.ai/api/v1/audio/transcriptions";
/** Modèle STT via OpenRouter (facturation à la minute, crédits gratuits possibles). */
const STT_MODEL = "openai/whisper-large-v3";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENROUTER_API_KEY manquante. Créez une clé sur https://openrouter.ai/keys et ajoutez-la dans .env",
      },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const audio = formData.get("audio");
  const lang = (formData.get("lang") as string) || "fr";

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Audio vide" }, { status: 400 });
  }

  if (audio.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio trop volumineux (max 4 Mo)" }, { status: 400 });
  }

  const mime = audio.type || "audio/webm";
  const format = mime.includes("webm")
    ? "webm"
    : mime.includes("mp4") || mime.includes("m4a")
      ? "m4a"
      : mime.includes("ogg")
        ? "ogg"
        : mime.includes("wav")
          ? "wav"
          : mime.includes("mpeg") || mime.includes("mp3")
            ? "mp3"
            : "webm";

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const base64 = buffer.toString("base64");

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

    const res = await fetch(OPENROUTER_STT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "Digimytch Talent Hub",
      },
      body: JSON.stringify({
        model: STT_MODEL,
        language: lang === "en" ? "en" : "fr",
        input_audio: {
          data: base64,
          format,
        },
      }),
    });

    const payload = (await res.json()) as { text?: string; error?: { message?: string } };

    if (!res.ok) {
      const msg =
        payload.error?.message ||
        (typeof payload === "object" && "message" in payload
          ? String((payload as { message?: string }).message)
          : null) ||
        `OpenRouter STT (${res.status})`;
      const needsBrowserFallback =
        /balance|credits|\$0\.50|insufficient/i.test(msg);
      return NextResponse.json(
        {
          error: msg,
          fallbackToBrowser: needsBrowserFallback,
        },
        { status: needsBrowserFallback ? 402 : res.status >= 500 ? 503 : 400 }
      );
    }

    return NextResponse.json({ text: (payload.text || "").trim() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription échouée";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
