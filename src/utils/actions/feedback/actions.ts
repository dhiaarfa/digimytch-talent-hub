"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/server";
import { isAdminUser } from "@/lib/digimytch-config";
import { sendTransactionalEmail } from "@/lib/email/send-mail";

export type FeedbackInput = {
  category: "rating" | "complaint" | "suggestion";
  rating?: number;
  experienceChoice?: "excellent" | "good" | "average" | "poor";
  message?: string;
  pagePath?: string;
};

export async function submitCandidateFeedback(
  input: FeedbackInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Connectez-vous pour envoyer un retour." };
  }

  if (input.category === "rating" && !input.experienceChoice && !input.rating) {
    return { ok: false, error: "Choisissez une note ou une expérience." };
  }

  if ((input.category === "complaint" || input.category === "suggestion") && !input.message?.trim()) {
    return { ok: false, error: "Décrivez brièvement votre retour." };
  }

  const { error } = await supabase.from("candidate_feedback").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    category: input.category,
    rating: input.rating ?? null,
    experience_choice: input.experienceChoice ?? null,
    message: input.message?.trim() || null,
    page_path: input.pagePath ?? null,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[submitCandidateFeedback]", error.message);
    }
    return { ok: false, error: "Envoi impossible pour le moment. Réessayez plus tard." };
  }

  return { ok: true };
}

export interface AdminFeedbackRow {
  id: string;
  user_email: string | null;
  category: string;
  rating: number | null;
  experience_choice: string | null;
  message: string | null;
  page_path: string | null;
  created_at: string;
  status: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
}

export async function listAdminFeedback(): Promise<AdminFeedbackRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !isAdminUser(user)) {
    throw new Error("Accès administrateur requis.");
  }

  const service = await createServiceClient();
  const { data, error: fetchErr } = await service
    .from("candidate_feedback")
    .select(
      "id, user_email, category, rating, experience_choice, message, page_path, created_at, status, admin_reply, admin_reply_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (fetchErr) throw new Error(fetchErr.message);
  return (data ?? []) as AdminFeedbackRow[];
}

export async function markFeedbackSeen(): Promise<void> {
  revalidatePath("/admin");
}

export async function replyToCandidateFeedback(input: {
  feedbackId: string;
  replyMessage: string;
  subject?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user || !isAdminUser(user)) {
    return { ok: false, error: "Accès administrateur requis." };
  }

  const body = input.replyMessage.trim();
  if (body.length < 10) {
    return { ok: false, error: "La réponse doit contenir au moins 10 caractères." };
  }

  const service = await createServiceClient();
  const { data: row, error: fetchErr } = await service
    .from("candidate_feedback")
    .select("id, user_email, category, message, status")
    .eq("id", input.feedbackId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Réclamation introuvable." };
  }

  if (row.category === "rating") {
    return { ok: false, error: "Les avis simples ne reçoivent pas de réponse par e-mail." };
  }

  const to = row.user_email?.trim();
  if (!to) {
    return { ok: false, error: "Aucune adresse e-mail associée à ce candidat." };
  }

  const subject =
    input.subject?.trim() ||
    `Digimytch — réponse à votre ${row.category === "complaint" ? "réclamation" : "suggestion"}`;

  const original = row.message?.trim() ? `\n\n— Votre message —\n${row.message.trim()}` : "";

  const mail = await sendTransactionalEmail({
    to,
    subject,
    text: `${body}${original}\n\n— L'équipe Digimytch`,
    html: `<p>${body.replace(/\n/g, "<br>")}</p>${
      row.message
        ? `<p style="color:#666;font-size:14px"><strong>Votre message :</strong><br>${row.message.replace(/\n/g, "<br>")}</p>`
        : ""
    }<p style="color:#666;font-size:14px">— L'équipe Digimytch</p>`,
  });

  if (!mail.ok) {
    return mail;
  }

  const { error: updateErr } = await service
    .from("candidate_feedback")
    .update({
      admin_reply: body,
      admin_reply_at: new Date().toISOString(),
      admin_replied_by: user.id,
      status: "replied",
    })
    .eq("id", input.feedbackId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
