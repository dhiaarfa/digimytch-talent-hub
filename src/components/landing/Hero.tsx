import { AuthDialog } from "@/components/auth/auth-dialog";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-12 md:py-16 lg:py-20">
      <div className="w-full lg:w-1/2 space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-sm text-violet-800">
          <span className="font-medium">Digimytch</span>
          <span className="text-violet-600">· Tunisie</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
          <span className="block">Votre parcours pro,</span>
          <span className="block text-violet-700">structuré et accompagné</span>
          <span className="block text-2xl md:text-3xl font-semibold text-muted-foreground mt-2">
            CV · Matching · Formations · Candidatures
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
          Digimytch Talent Hub centralise votre CV, mesure votre compatibilité avec chaque offre,
          recommande des formations sur vos écarts de compétences et suit vos candidatures au même endroit.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <AuthDialog>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-violet-700 text-white font-medium transition-all hover:bg-violet-800 hover:-translate-y-0.5 shadow-md"
              aria-label="Créer mon compte gratuitement"
            >
              Commencer gratuitement
            </button>
          </AuthDialog>
          <a
            href="#features"
            className="px-6 py-3 rounded-lg border border-gray-200 bg-white text-center font-medium text-foreground transition-all hover:border-violet-300 hover:-translate-y-0.5"
          >
            Découvrir les fonctionnalités
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-violet-50 text-violet-800 border-violet-200">
            Assistant IA en français
          </Badge>
          <Badge variant="secondary" className="bg-teal-50 text-teal-800 border-teal-200">
            Score de matching explicable
          </Badge>
          <Badge variant="secondary" className="bg-amber-50 text-amber-900 border-amber-200">
            Données hébergées en sécurité
          </Badge>
        </div>
      </div>

      <div className="w-full lg:w-1/2 relative min-h-[280px] sm:min-h-[360px]">
        <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-teal-50 shadow-lg p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Tableau de bord
          </p>
          <div className="space-y-3 flex-1">
            <div className="rounded-lg bg-white border p-3 shadow-sm">
              <p className="text-sm font-medium">CV de référence</p>
              <p className="text-xs text-muted-foreground mt-1">Profil à jour · prêt pour le matching</p>
            </div>
            <div className="rounded-lg bg-white border p-3 shadow-sm">
              <p className="text-sm font-medium flex justify-between gap-2">
                <span>Offre — Développeur web</span>
                <span className="text-violet-700 font-bold shrink-0">78%</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compétences alignées · 2 écarts identifiés</p>
            </div>
            <div className="rounded-lg bg-white border p-3 shadow-sm">
              <p className="text-sm font-medium">Formation recommandée</p>
              <p className="text-xs text-muted-foreground mt-1">Cloud & DevOps · catalogue Digimytch</p>
            </div>
            <div className="rounded-lg bg-violet-700 text-white p-3 text-sm">
              Candidature · Entretien planifié
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
