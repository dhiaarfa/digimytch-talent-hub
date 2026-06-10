import { getOpenRouterApiKey } from "@/lib/openrouter-config";
import { EMBEDDING_VECTOR_DIM, mockEmbeddingFromText } from "@/lib/embeddings-text";
import { logger } from "@/lib/logger";

const EMBEDDING_MODELS = [
  "openai/text-embedding-3-small",
  "mistralai/mistral-embed",
] as const;

function normalizeVector(values: number[], targetDim = EMBEDDING_VECTOR_DIM): number[] {
  if (values.length === targetDim) return values;
  if (values.length > targetDim) return values.slice(0, targetDim);
  return [...values, ...new Array(targetDim - values.length).fill(0)];
}

async function fetchOpenRouterEmbedding(
  text: string,
  model: string,
  apiKey: string
): Promise<number[]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
      "X-Title": "Digimytch Talent Hub",
    },
    body: JSON.stringify({ model, input: text }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter embeddings ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data?: { embedding?: number[] }[];
  };
  const raw = json.data?.[0]?.embedding;
  if (!raw?.length) throw new Error("OpenRouter embeddings: empty vector");
  return normalizeVector(raw);
}

/**
 * Génère un vecteur 1536-dim pour la recherche sémantique pgvector.
 * Utilise OpenRouter ; repli déterministe local si clé absente.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) return new Array(EMBEDDING_VECTOR_DIM).fill(0);

  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    logger.warn("[embeddings] No OpenRouter key — using deterministic mock vector");
    return mockEmbeddingFromText(trimmed);
  }

  let lastError: unknown;
  for (const model of EMBEDDING_MODELS) {
    try {
      return await fetchOpenRouterEmbedding(trimmed, model, apiKey);
    } catch (error) {
      lastError = error;
      logger.warn(
        `[embeddings] model ${model} failed: ${error instanceof Error ? error.message : "error"}`
      );
    }
  }

  logger.warn("[embeddings] All models failed — mock fallback");
  if (lastError) logger.error("[embeddings]", lastError);
  return mockEmbeddingFromText(trimmed);
}

/** Format attendu par Supabase pgvector via PostgREST. */
export function formatEmbeddingForPg(vector: number[]): string {
  return `[${vector.map((v) => Number(v.toFixed(8))).join(",")}]`;
}
