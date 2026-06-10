import { NextResponse } from "next/server";
import { extractBearerToken, getUserFromBearerToken } from "@/lib/supabase/bearer-auth";
import { clipJobToKanban, jobClipRequestSchema } from "@/lib/job-clip";
import { logger } from "@/lib/logger";
import { checkRateLimit, RateLimitError } from "@/lib/rateLimiter";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_SITE_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ""),
  "http://localhost:3001",
  "http://127.0.0.1:3001",
].filter((origin): origin is string => Boolean(origin));

function resolveClipCorsOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  if (!origin) return ALLOWED_SITE_ORIGINS[0] ?? "http://localhost:3001";
  if (origin.startsWith("chrome-extension://")) return origin;
  if (ALLOWED_SITE_ORIGINS.includes(origin)) return origin;
  return ALLOWED_SITE_ORIGINS[0] ?? "http://localhost:3001";
}

function corsHeaders(request: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveClipCorsOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return jsonResponse(request, { error: "Token JWT manquant (Authorization: Bearer …)" }, 401);
    }

    const { user, error: authError, supabase } = await getUserFromBearerToken(token);
    if (authError || !user) {
      return jsonResponse(request, { error: "Session invalide ou expirée" }, 401);
    }

    try {
      await checkRateLimit(user.id, "api.jobs.clip");
    } catch (error) {
      if (error instanceof RateLimitError) {
        return jsonResponse(
          request,
          { error: error.message },
          429
        );
      }
      throw error;
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonResponse(request, { error: "Corps JSON invalide" }, 400);
    }

    const parsed = jobClipRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return jsonResponse(request, { error: msg }, 400);
    }

    const { jobId, application } = await clipJobToKanban(supabase, user.id, parsed.data);

    return jsonResponse(request, {
      success: true,
      application_id: application.id,
      job_id: jobId,
    });
  } catch (error) {
    logger.error("[api/jobs/clip]", error);
    const message = error instanceof Error ? error.message : "Enregistrement impossible";
    return jsonResponse(request, { error: message }, 500);
  }
}
