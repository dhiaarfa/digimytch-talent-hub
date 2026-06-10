"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { suggestJobImageUrl } from "@/lib/card-images";
import {
  PLATFORM_JOB_CATALOG,
  type PlatformJobTemplate,
} from "@/lib/platform-jobs-catalog";
import { upsertJobApplication } from "@/utils/actions/applications/actions";
import { queueJobEmbedding } from "@/utils/actions/embeddings/actions";

function toJobRow(userId: string, j: PlatformJobTemplate) {
  return {
    user_id: userId,
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
  };
}

/** Adopte une offre du catalogue Digimytch dans « Mes offres analysées ». */
export async function adoptPlatformJob(slug: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const template = PLATFORM_JOB_CATALOG.find((j) => j.slug === slug);
  if (!template) {
    return { ok: false, error: "Offre introuvable dans le catalogue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Session expirée. Reconnectez-vous." };
  }

  const { data: existing } = await supabase
    .from("jobs")
    .select("id, deleted_at")
    .eq("user_id", user.id)
    .eq("position_title", template.position_title)
    .eq("company_name", template.company_name)
    .maybeSingle();

  if (existing) {
    if (existing.deleted_at) {
      const { error: restoreErr } = await supabase
        .from("jobs")
        .update({ deleted_at: null })
        .eq("id", existing.id)
        .eq("user_id", user.id);
      if (restoreErr) {
        return { ok: false, error: "Impossible de restaurer l'offre." };
      }
    }
    try {
      await upsertJobApplication({ jobId: existing.id, status: "saved" });
    } catch {
      return { ok: false, error: "Impossible d'ajouter l'offre à vos candidatures." };
    }
    revalidatePath("/jobs");
    revalidatePath("/candidatures");
    revalidatePath("/formations");
    return { ok: true };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("jobs")
    .insert(toJobRow(user.id, template))
    .select("id")
    .single();
  if (insertErr || !inserted) {
    return { ok: false, error: "Impossible d'ajouter l'offre." };
  }

  try {
    await upsertJobApplication({ jobId: inserted.id, status: "saved" });
  } catch {
    return { ok: false, error: "Offre créée mais candidature non enregistrée." };
  }

  void queueJobEmbedding(inserted.id);

  revalidatePath("/jobs");
  revalidatePath("/candidatures");
  revalidatePath("/formations");
  return { ok: true };
}

export async function listPlatformCatalogSlugsForUser(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: jobs } = await supabase
    .from("jobs")
    .select("position_title, company_name, deleted_at")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const owned = new Set(
    (jobs ?? []).map((j) => `${j.company_name}::${j.position_title}`.toLowerCase())
  );

  return PLATFORM_JOB_CATALOG.filter(
    (t) => !owned.has(`${t.company_name}::${t.position_title}`.toLowerCase())
  ).map((t) => t.slug);
}
