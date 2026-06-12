"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Target, BookOpen, Loader2, Activity, MessageSquare, RefreshCw } from "lucide-react";
import { getAdminStats, type AdminStats } from "@/utils/actions/admin/actions";
import { Button } from "@/components/ui/button";

export function AdminOverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setStats(await getAdminStats());
    } catch {
      setStats(null);
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
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Chargement des statistiques…
      </p>
    );
  }

  if (!stats) {
    return (
      <div className="py-8 space-y-3">
        <p className="text-sm text-red-600">Impossible de charger les statistiques.</p>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Réessayer
        </Button>
      </div>
    );
  }

  const cards = [
    {
      label: "Utilisateurs inscrits",
      value: stats.userCount,
      icon: Users,
      color: "bg-[#030A8C]",
      sub: `${stats.activeUserCount} actifs (7j)`,
    },
    {
      label: "CV générés",
      value: stats.resumeCount,
      icon: FileText,
      color: "bg-[#D10069]",
      sub: "au total",
    },
    {
      label: "Offres / jobs",
      value: stats.jobCount,
      icon: Target,
      color: "bg-amber-600",
      sub: "au total",
    },
    {
      label: "Formations actives",
      value: stats.courseCount,
      icon: BookOpen,
      color: "bg-violet-600",
      sub: "dans le catalogue",
    },
    {
      label: "Utilisateurs actifs (7j)",
      value: stats.activeUserCount,
      icon: Activity,
      color: "bg-emerald-600",
      sub: "connectés cette semaine",
    },
    {
      label: "Avis & retours",
      value: stats.feedbackCount,
      icon: MessageSquare,
      color: "bg-sky-600",
      sub: "retours reçus",
    },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon className="h-3.5 w-3.5 text-white" aria-hidden />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4">
        <h3 className="font-semibold text-sm mb-3">Accès rapide</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            { label: "Gérer les utilisateurs (rôles, accès, suppression)", tab: "Utilisateurs" },
            { label: "Voir les analytiques (croissance, engagement)", tab: "Analytiques" },
            { label: "Ajouter ou modifier une formation", tab: "Formations" },
            { label: "Importer une formation par IA", tab: "Import IA" },
            { label: "Traiter les réclamations candidats", tab: "Réclamations" },
            { label: "Consulter la configuration plateforme", tab: "Paramètres" },
          ].map(({ label, tab }) => (
            <div key={label} className="flex items-start gap-2 text-muted-foreground">
              <span className="text-[var(--digi-accent)] mt-0.5">→</span>
              <span>
                {label}{" "}
                <span className="text-xs font-medium text-[var(--digi-navy)]">({tab})</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
