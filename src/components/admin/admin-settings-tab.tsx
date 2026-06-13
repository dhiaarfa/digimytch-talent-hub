"use client";

import {
  Settings,
  Shield,
  Mic,
  BookOpen,
  Users,
  Globe,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type SettingRowProps = {
  icon: React.ElementType;
  label: string;
  description: string;
  value: string | boolean | number;
  envKey: string;
};

function SettingRow({ icon: Icon, label, description, value, envKey }: SettingRowProps) {
  const isEnabled = value === true || value === "true" || value === "1";
  const isBool = typeof value === "boolean" || value === "true" || value === "false";

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0 border-[var(--digi-border)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--digi-surface)]">
          <Icon className="h-3.5 w-3.5 text-[var(--digi-navy)]" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          <code className="text-[10px] text-muted-foreground/70 mt-1 block">{envKey}</code>
        </div>
      </div>
      <div className="shrink-0 mt-0.5">
        {isBool ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isEnabled
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isEnabled ? (
              <><CheckCircle2 className="h-3 w-3" aria-hidden /> Activé</>
            ) : (
              <><XCircle className="h-3 w-3" aria-hidden /> Désactivé</>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--digi-surface)] text-[var(--digi-navy)]">
            {String(value) || "—"}
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminSettingsTab() {
  // Read-only display of platform configuration from env vars / constants
  const settings: SettingRowProps[] = [
    {
      icon: Shield,
      label: "Mode Digimytch Talent Hub",
      description: "Toutes les fonctionnalités Digimytch sont activées. Les utilisateurs ont accès Pro par défaut.",
      value: true,
      envKey: "IS_DIGIMYTCH_TALENT_HUB",
    },
    {
      icon: Globe,
      label: "URL de l'application",
      description: "URL publique utilisée pour les redirections d'authentification et les emails.",
      value: process.env.NEXT_PUBLIC_APP_URL ?? "(non défini)",
      envKey: "NEXT_PUBLIC_APP_URL",
    },
    {
      icon: Mic,
      label: "Simulateur d'entretien IA",
      description: "Fonctionnalité d'entretien IA avec reconnaissance vocale et synthèse vocale.",
      value: true,
      envKey: "interview-simulator (activé par défaut)",
    },
    {
      icon: BookOpen,
      label: "Catalogue formations",
      description: "Formations visibles par les candidats. Gérez le catalogue dans l'onglet Formations.",
      value: true,
      envKey: "courses (table Supabase)",
    },
    {
      icon: Users,
      label: "Inscription ouverte",
      description: "Les nouveaux candidats peuvent créer un compte. Désactivez via Supabase Auth settings.",
      value: true,
      envKey: "Supabase Auth > Settings > Sign-ups",
    },
    {
      icon: Settings,
      label: "Modèle IA par défaut (entretien)",
      description: "Modèle utilisé pour le simulateur d'entretien (non-thinking, résultats propres).",
      value: "meta-llama/llama-3.3-70b-instruct:free",
      envKey: "selectDigimytchModelForTask('interview')",
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#030A8C] mt-0.5 shrink-0" aria-hidden />
          <div>
            <h2 className="font-semibold text-[var(--digi-navy)] dark:text-[var(--digi-dark-fg)]">
              Configuration de la plateforme
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vue en lecture seule de la configuration actuelle. Pour modifier ces paramètres,
              éditez les variables d&apos;environnement sur votre hébergeur (Vercel, Railway…) ou dans{" "}
              <code className="text-xs">.env.local</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4 divide-y divide-[var(--digi-border)]">
        {settings.map((s) => (
          <SettingRow key={s.envKey} {...s} />
        ))}
      </div>

      {/* Admin email config */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-800">Email(s) administrateur</p>
            <p className="text-xs text-amber-700 mt-1">
              Les adresses admin sont définies dans la variable d&apos;environnement{" "}
              <code className="font-mono">ADMIN_EMAILS</code> (liste séparée par des virgules).
              Seuls ces comptes ont accès au panneau d&apos;administration.
            </p>
            <p className="text-xs text-amber-600 mt-2">
              Exemple : <code className="font-mono">ADMIN_EMAILS=admin@digimytch.com,tech@digimytch.com</code>
            </p>
          </div>
        </div>
      </div>

      {/* Supabase info */}
      <div className="rounded-xl border border-[var(--digi-border)] bg-white dark:bg-[var(--digi-card)] p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-[var(--digi-accent)]" aria-hidden />
          Accès Supabase (actions avancées)
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            { action: "Modifier les quotas d'email", where: "Authentication > Rate limits" },
            { action: "Activer/désactiver Google OAuth", where: "Authentication > Providers" },
            { action: "Éditer les politiques RLS", where: "Database > Policies" },
            { action: "Consulter les logs en direct", where: "Database > Logs > Edge Functions" },
            { action: "Configurer le SMTP email", where: "Authentication > SMTP settings" },
          ].map(({ action, where }) => (
            <li key={action} className="flex justify-between gap-2">
              <span>{action}</span>
              <code className="text-xs text-[var(--digi-navy)] shrink-0">{where}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
