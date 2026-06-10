"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { listAdminFeedback } from "@/utils/actions/feedback/actions";
import { FeedbackReplyForm } from "@/components/admin/feedback-reply-form";

const EXPERIENCE_LABELS: Record<string, string> = {
  excellent: "Excellente",
  good: "Bonne",
  average: "Moyenne",
  poor: "Difficile",
};

type FeedbackRow = Awaited<ReturnType<typeof listAdminFeedback>>[number];

export function AdminFeedbackTab() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminFeedback());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les retours.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement des retours…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 py-8">
        {error}
        {error.includes("candidate_feedback") && (
          <span className="block mt-2 text-[var(--digi-muted)]">
            Exécutez <code className="text-xs">pnpm supabase:migrate</code> pour créer la table.
          </span>
        )}
      </p>
    );
  }

  const complaints = rows.filter((r) => r.category === "complaint" || r.category === "suggestion");
  const ratings = rows.filter((r) => r.category === "rating");

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Réclamations / suggestions</p>
          <p className="text-2xl font-bold">{complaints.length}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Avis candidats</p>
          <p className="text-2xl font-bold">{ratings.length}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Expérience difficile</p>
          <p className="text-2xl font-bold text-red-600">
            {rows.filter((r) => r.experience_choice === "poor").length}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Boîte de réclamation & recommandations</h2>
        {complaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {complaints.map((row) => (
              <li key={row.id} className="rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2 mb-2">
                  <span className="font-medium">{row.user_email ?? "Candidat"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-wide text-[var(--digi-accent)] mb-1">
                  {row.category === "complaint" ? "Réclamation" : "Suggestion"}
                  {row.page_path ? ` · ${row.page_path}` : ""}
                </p>
                <p className="whitespace-pre-wrap">{row.message}</p>
                {row.status === "replied" && (
                  <p className="text-xs text-green-700 mt-2">Répondu</p>
                )}
                <FeedbackReplyForm
                  feedbackId={row.id}
                  userEmail={row.user_email}
                  existingReply={row.admin_reply}
                  onReplied={() => void load()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Retours d&apos;expérience récents</h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {ratings.slice(0, 20).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <span>{row.user_email ?? "Candidat"}</span>
                <span className="font-medium">
                  {row.experience_choice
                    ? EXPERIENCE_LABELS[row.experience_choice] ?? row.experience_choice
                    : row.rating
                      ? `${row.rating}/5`
                      : "—"}
                </span>
                <span className="text-xs text-muted-foreground w-full sm:w-auto">
                  {new Date(row.created_at).toLocaleString("fr-FR")}
                  {row.page_path ? ` · ${row.page_path}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
