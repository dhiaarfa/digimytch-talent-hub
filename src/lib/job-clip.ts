import { z } from "zod";
import type { ApplicationStatus } from "@/lib/types";
import { APPLICATION_STATUSES } from "@/lib/types";
import { runJobApplicationUpsert } from "@/lib/job-applications-upsert";
import type { JobApplication } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { suggestJobImageUrl } from "@/lib/card-images";
import { ensureJobEmbedding } from "@/utils/actions/embeddings/actions";

export const jobClipRequestSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  company: z.string().optional().default(""),
  description: z.string().min(10, "Description trop courte"),
  source_url: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  initial_status: z.enum(APPLICATION_STATUSES).default("saved"),
});

export type JobClipRequest = z.infer<typeof jobClipRequestSchema>;

function clipKeywords(title: string, description: string): string[] {
  const raw = `${title} ${description}`.toLowerCase().split(/[\s,/;|()[\]{}]+/);
  const stop = new Set(["the", "and", "for", "with", "des", "les", "une", "pour", "dans"]);
  const out = new Set<string>();
  for (const w of raw) {
    const t = w.replace(/[^a-z0-9+#.\-]/gi, "").trim();
    if (t.length < 2 || t.length > 32 || stop.has(t)) continue;
    out.add(t);
  }
  return [...out].slice(0, 25);
}

export async function clipJobToKanban(
  supabase: SupabaseClient,
  userId: string,
  input: JobClipRequest
): Promise<{ jobId: string; application: JobApplication }> {
  const company = input.company?.trim() || "Entreprise non précisée";
  const title = input.title.trim();
  const description = input.description.trim();
  const keywords = clipKeywords(title, description);
  const sourceUrl = input.source_url?.trim() || null;

  let jobId: string | null = null;

  if (sourceUrl) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("user_id", userId)
      .eq("job_url", sourceUrl)
      .is("deleted_at", null)
      .maybeSingle();
    jobId = existing?.id ?? null;
  }

  if (!jobId) {
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        company_name: company,
        position_title: title,
        job_url: sourceUrl,
        description,
        location: input.location?.trim() || null,
        keywords,
        work_location: "in_person",
        employment_type: "full_time",
        is_active: true,
        image_url: suggestJobImageUrl(title, company, keywords),
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      throw new Error(jobErr?.message ?? "Impossible de créer l'offre");
    }
    jobId = job.id;
    void ensureJobEmbedding(job.id).catch(() => undefined);
  }

  if (!jobId) {
    throw new Error("Impossible de résoudre l'offre");
  }

  const application = await runJobApplicationUpsert(
    {
      fetchActiveJob: async (jid) => {
        const { data } = await supabase
          .from("jobs")
          .select("id")
          .eq("id", jid)
          .eq("user_id", userId)
          .is("deleted_at", null)
          .maybeSingle();
        return data;
      },
      fetchApplicationByJob: async (jid) => {
        const { data } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", userId)
          .eq("job_id", jid)
          .maybeSingle();
        return data;
      },
      updateApplication: async (id, patch) => {
        const { data: updated, error } = await supabase
          .from("job_applications")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error || !updated) throw new Error("Mise à jour candidature impossible");
        return updated;
      },
      insertApplication: async (row) => {
        const { data, error } = await supabase
          .from("job_applications")
          .insert({
            user_id: userId,
            job_id: row.job_id,
            resume_id: row.resume_id,
            status: row.status as ApplicationStatus,
            notes: row.notes,
          })
          .select()
          .single();
        return { data, error };
      },
      insertStatusEvent: async (event) => {
        await supabase.from("job_application_events").insert(event);
      },
    },
    {
      jobId,
      status: input.initial_status,
      notes: sourceUrl ? `Source: ${sourceUrl}` : null,
    }
  );

  return { jobId, application };
}
