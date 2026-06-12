import { AuthDialog } from "@/components/auth/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { BarChart3, BookOpen, ClipboardList, Target, CheckCircle2, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-12 md:py-16 lg:py-20">
      <div className="w-full lg:w-1/2 space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-sm text-violet-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden />
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

        {/* Social proof row */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex -space-x-2">
            {["#7c3aed","#D10069","#030A8C","#10b981"].map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color }}
                aria-hidden
              >
                {["A","M","K","S"][i]}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Rejoignez des <strong className="text-foreground">centaines de candidats</strong> qui boostent leur recherche
          </p>
        </div>
      </div>

      {/* Right side: mock dashboard */}
      <div className="w-full lg:w-1/2 relative min-h-[280px] sm:min-h-[360px]">
        <div className="relative w-full max-w-md mx-auto">
          {/* Main card */}
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-teal-50 shadow-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Tableau de bord
              </p>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> Profil complet
              </span>
            </div>

            {/* CV card */}
            <div className="rounded-xl bg-white border p-3 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-violet-700" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">CV de référence</p>
                <p className="text-xs text-muted-foreground">Profil à jour · prêt pour le matching</p>
              </div>
            </div>

            {/* Score card */}
            <div className="rounded-xl bg-white border p-3 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#D10069]/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-[#D10069]" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">Offre — Développeur web</p>
                  <span className="text-violet-700 font-bold text-base shrink-0">78%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-[78%] bg-gradient-to-r from-violet-500 to-[#D10069] rounded-full" />
                </div>
              </div>
            </div>

            {/* Formation card */}
            <div className="rounded-xl bg-white border p-3 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#030A8C]/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-[#030A8C]" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Formation recommandée</p>
                <p className="text-xs text-muted-foreground">Cloud & DevOps · catalogue Digimytch</p>
              </div>
            </div>

            {/* Candidature card */}
            <div className="rounded-xl bg-gradient-to-r from-[#030A8C] to-[#D10069] text-white p-3 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-white" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold">Candidature envoyée</p>
                <p className="text-xs text-white/80">Entretien planifié · vendredi 14h</p>
              </div>
            </div>
          </div>

          {/* Floating stat badge */}
          <div className="absolute -right-3 -top-3 bg-white rounded-xl border border-violet-100 shadow-lg px-3 py-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" aria-hidden />
            <div>
              <p className="text-xs font-bold text-green-700">+3 offres</p>
              <p className="text-[10px] text-muted-foreground">cette semaine</p>
            </div>
          </div>

          {/* Floating score badge */}
          <div className="absolute -left-3 -bottom-3 bg-white rounded-xl border border-amber-100 shadow-lg px-3 py-2 flex items-center gap-2">
            <span className="text-lg" aria-hidden>⭐</span>
            <div>
              <p className="text-xs font-bold text-amber-800">250 pts</p>
              <p className="text-[10px] text-muted-foreground">fidélité</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
