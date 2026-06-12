"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  FileText,
  Target,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAdminAnalytics, type AdminAnalytics } from "@/utils/actions/admin/actions";
import { Button } from "@/components/ui/button";

type StatCardProps = {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  alert?: boolean;
};

function StatCard({ label, value, sub, icon: Icon, color, alert }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 bg-white dark:bg-[var(--digi-card)] shadow-sm ${
        alert ? "border-red-200 bg-red-50 dark:bg-red-900/10" : "border-[var(--digi-border)]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="h-3.5 w-3.5 text-white" aria-hidden />
        </div>
      </div>
      <p className={`text-2xl font-bold ${alert ? "text-red-700" : "text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function AdminAnalyticsTab() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminAnalytics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les analytiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement des analytiques…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-8 space-y-3">
        <p className="text-sm text-red-600">{error ?? "Erreur inconnue"}</p>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Réessayer
        </Button>
      </div>
    );
  }

  const engagementRate =
    data.newUsersLast30Days > 0
      ? Math.round((data.activeUsersLast7Days / data.newUsersLast30Days) * 100)
      : 0;

  return (
    <div className="mt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
            Analytiques de la plateforme
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Données sur les 7 et 30 derniers jours
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Growth section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Croissance
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Nouveaux users (7j)"
            value={data.newUsersLast7Days}
            sub="inscrits cette semaine"
            icon={UserPlus}
            color="bg-[#030A8C]"
          />
          <StatCard
            label="Nouveaux users (30j)"
            value={data.newUsersLast30Days}
            sub="inscrits ce mois"
            icon={Users}
            color="bg-violet-600"
          />
          <StatCard
            label="CV créés (7j)"
            value={data.resumesLast7Days}
            sub="nouveaux curricula"
            icon={FileText}
            color="bg-[#D10069]"
          />
          <StatCard
            label="Offres ajoutées (7j)"
            value={data.jobsLast7Days}
            sub="nouvelles offres"
            icon={Target}
            color="bg-amber-600"
          />
        </div>
      </div>

      {/* Engagement section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Engagement
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            label="Utilisateurs actifs (7j)"
            value={data.activeUsersLast7Days}
            sub="connectés cette semaine"
            icon={Activity}
            color="bg-emerald-600"
          />
          <StatCard
            label="Taux d'engagement"
            value={`${engagementRate}%`}
            sub="actifs / inscrits 30j"
            icon={TrendingUp}
            color="bg-sky-600"
          />
          <StatCard
            label="Avis candidats"
            value={data.totalFeedback}
            sub="retours reçus au total"
            icon={MessageSquare}
            color="bg-[#030A8C]"
          />
        </div>
      </div>

      {/* Alerts section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Points d'attention
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Réclamations sans réponse"
            value={data.unrepliedComplaints}
            sub="à traiter dans l'onglet Réclamations"
            icon={MessageSquare}
            color="bg-orange-500"
            alert={data.unrepliedComplaints > 0}
          />
          <StatCard
            label="Expériences difficiles"
            value={data.poorExperienceCount}
            sub="candidats insatisfaits"
            icon={AlertTriangle}
            color="bg-red-600"
            alert={data.poorExperienceCount > 0}
          />
        </div>
      </div>

      {/* Activity bar chart (simplified) */}
      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4">
        <h3 className="text-sm font-semibold mb-3">Répartition de l'activité (7 derniers jours)</h3>
        <div className="space-y-3">
          {[
            { label: "Utilisateurs actifs", value: data.activeUsersLast7Days, max: Math.max(data.activeUsersLast7Days, data.resumesLast7Days, data.jobsLast7Days, 1), color: "bg-[#030A8C]" },
            { label: "CV créés", value: data.resumesLast7Days, max: Math.max(data.activeUsersLast7Days, data.resumesLast7Days, data.jobsLast7Days, 1), color: "bg-[#D10069]" },
            { label: "Offres ajoutées", value: data.jobsLast7Days, max: Math.max(data.activeUsersLast7Days, data.resumesLast7Days, data.jobsLast7Days, 1), color: "bg-amber-500" },
            { label: "Nouveaux inscrits", value: data.newUsersLast7Days, max: Math.max(data.activeUsersLast7Days, data.resumesLast7Days, data.jobsLast7Days, 1), color: "bg-violet-500" },
          ].map(({ label, value, max, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
              <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${Math.round((value / max) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium w-6 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
