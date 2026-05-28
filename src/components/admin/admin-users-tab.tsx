"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAdminStats, type AdminStats } from "@/utils/actions/admin/actions";

export function AdminUsersTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger les stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mt-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-amber-700">
          Cette section affiche des statistiques agrégées. La suppression de comptes
          se fait via Supabase Dashboard pour la sécurité.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center py-4" role="alert">
          {error}
        </p>
      )}

      {stats && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-xl p-5 text-center bg-white">
            <p className="text-3xl font-bold text-[#030A8C]">{stats.userCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Comptes créés</p>
          </div>
          <div className="border rounded-xl p-5 text-center bg-white">
            <p className="text-3xl font-bold text-[#D10069]">{stats.resumeCount}</p>
            <p className="text-sm text-muted-foreground mt-1">CV en base</p>
          </div>
          <div className="border rounded-xl p-5 text-center bg-white">
            <p className="text-3xl font-bold text-green-600">{stats.jobCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Offres enregistrées</p>
          </div>
          <div className="border rounded-xl p-5 text-center bg-white">
            <p className="text-3xl font-bold text-[var(--digi-navy)]">
              {stats.courseCount}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Formations catalogue</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">
        Données en temps réel : Supabase Studio —{" "}
        <a
          href="http://localhost:54323"
          className="text-[#030A8C] underline"
          target="_blank"
          rel="noreferrer"
        >
          http://localhost:54323
        </a>
      </p>
    </div>
  );
}
