"use server";
import { logger } from "@/lib/logger";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { suggestJobImageUrl } from "@/lib/card-images";
import { PLATFORM_JOB_CATALOG } from "@/lib/platform-jobs-catalog";

/** Insère des offres démo si l'utilisateur n'en a aucune (démo PFE). */
export async function ensureDemoJobsIfEmpty(): Promise<{ seeded: number }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { count, error: countErr } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countErr) throw new Error("Impossible de vérifier vos offres.");
  if ((count ?? 0) > 0) return { seeded: 0 };

  const seedTemplates = PLATFORM_JOB_CATALOG.slice(0, 10);
  const rows = seedTemplates.map((j) => ({
    user_id: user.id,
    company_name: j.company_name,
    position_title: j.position_title,
    location: j.location,
    keywords: [...j.keywords],
    description: j.description,
    image_url: suggestJobImageUrl(j.position_title, j.company_name, [...j.keywords]),
    is_active: true,
    job_url: null,
    salary_range: null,
    work_location: j.location.toLowerCase().includes("remote")
      ? ("remote" as const)
      : j.location.toLowerCase().includes("hybride")
        ? ("hybrid" as const)
        : ("in_person" as const),
    employment_type: j.position_title.toLowerCase().includes("stagiaire")
      ? ("internship" as const)
      : "full_time",
  }));

  const { error: insertErr } = await supabase.from("jobs").insert(rows);
  if (insertErr) {
    logger.error("[ensureDemoJobsIfEmpty]", insertErr);
    throw new Error("Impossible de créer les offres de démonstration.");
  }

  revalidatePath("/jobs");
  revalidatePath("/home");
  return { seeded: rows.length };
}
