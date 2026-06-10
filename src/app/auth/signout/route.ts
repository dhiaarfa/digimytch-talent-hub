import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** Clears server auth cookies then redirects to the landing page. */
export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    /* Supabase unreachable — cookie jar still cleared by SSR client when possible */
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", siteUrl));
}
