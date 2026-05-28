"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Target, BookOpen, Loader2 } from "lucide-react";
import { getAdminStats, type AdminStats } from "@/utils/actions/admin/actions";

export function AdminOverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setStats(await getAdminStats());
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des statistiques…
      </p>
    );
  }

  if (!stats) {
    return <p className="text-sm text-red-600">Impossible de charger les statistiques.</p>;
  }

  const cards = [
    { label: "Utilisateurs", value: stats.userCount, icon: Users },
    { label: "CV", value: stats.resumeCount, icon: FileText },
    { label: "Offres / jobs", value: stats.jobCount, icon: Target },
    { label: "Formations", value: stats.courseCount, icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-[var(--digi-accent)]" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)] mt-2">
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Vue d&apos;ensemble de la plateforme. Utilisez les onglets Formations, Import IA et
        Utilisateurs pour gérer le contenu.
      </p>
    </div>
  );
}
