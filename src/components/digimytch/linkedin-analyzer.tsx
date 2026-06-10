"use client";

import { useState, useRef } from "react";
import { Linkedin, Upload, Loader2, Star, AlertCircle, CheckCircle2, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/use-language";
import { cn } from "@/lib/utils";
import { prepareLinkedInScreenshot } from "@/lib/linkedin-image-client";
import { useDefaultModel } from "@/hooks/use-api-keys";

type LinkedInResult = {
  name: string | null;
  headline: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: { priority: string; action: string; why: string }[];
  cvImportTips: string[];
  keywords: string[];
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f5a623" : "#ef4444";
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--digi-border)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        <text x="50" y="44" textAnchor="middle" fill="var(--digi-dark)" fontSize="22" fontWeight="700">{score}</text>
        <text x="50" y="58" textAnchor="middle" fill="var(--digi-muted)" fontSize="11">/100</text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {score >= 70 ? "Profil solide" : score >= 45 ? "À améliorer" : "Profil faible"}
      </span>
    </div>
  );
}

export function LinkedInAnalyzer() {
  const { lang } = useLanguage();
  const { defaultModel } = useDefaultModel();
  const isFr = lang === "fr";
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkedInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(isFr ? "Veuillez choisir une image (PNG, JPG, etc.)" : "Please select an image (PNG, JPG, etc.)");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setPreviewUrl(URL.createObjectURL(file));

    const { base64, mimeType } = await prepareLinkedInScreenshot(file);

    try {
      const res = await fetch("/api/linkedin-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          mimeType,
          lang,
          ...(defaultModel ? { model: defaultModel } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.error === "string" ? err.error : "Analysis failed";
        throw new Error(msg);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse impossible");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void analyzeImage(file);
  };

  const priorityColor = (p: string) =>
    p === "haute" || p === "high" ? "bg-red-100 text-red-700" :
    p === "moyenne" || p === "medium" ? "bg-amber-100 text-amber-700" :
    "bg-blue-100 text-blue-700";

  const exampleResult: LinkedInResult = {
    name: "Alex Martin",
    headline: "Développeur Full Stack · React · Node.js",
    score: 72,
    strengths: [
      "Titre clair aligné sur le marché tech",
      "Compétences techniques visibles dès l'aperçu",
      "Expériences récentes bien structurées",
    ],
    weaknesses: [
      "Résumé trop court — manque de mots-clés ATS",
      "Peu de preuves chiffrées dans les expériences",
    ],
    recommendations: [
      {
        priority: "haute",
        action: "Enrichir le résumé avec 3–4 lignes orientées résultats",
        why: "Améliore la visibilité dans les recherches recruteurs",
      },
    ],
    cvImportTips: ["Reprendre les compétences listées dans la section À propos"],
    keywords: ["React", "TypeScript", "Node.js", "Full Stack"],
  };

  return (
    <div className="space-y-6">
      {!result && !loading && (
        <Card className="border-[var(--digi-border)] bg-[var(--digi-surface)]/40">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <p className="text-sm font-semibold text-[var(--digi-navy)]">
              {isFr ? "Ce que l'IA analyse" : "What AI analyzes"}
            </p>
            <ul className="text-sm text-[var(--digi-muted)] space-y-1.5 list-none">
              <li>• {isFr ? "Titre, résumé et mots-clés visibles sur la capture" : "Headline, summary and visible keywords on the screenshot"}</li>
              <li>• {isFr ? "Cohérence du positionnement et clarté du profil" : "Positioning consistency and profile clarity"}</li>
              <li>• {isFr ? "Recommandations actionnables pour votre CV Talent Hub" : "Actionable tips to improve your Talent Hub CV"}</li>
            </ul>
            <div className="rounded-xl border border-dashed border-[var(--digi-border)] bg-white/80 p-4 opacity-80">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--digi-muted)] mb-3">
                {isFr ? "Aperçu exemple (résultat fictif)" : "Example preview (sample result)"}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <ScoreRing score={exampleResult.score} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-display font-bold text-[var(--digi-dark)]">{exampleResult.name}</p>
                  <p className="text-xs text-[var(--digi-muted)]">{exampleResult.headline}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exampleResult.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload zone */}
      <Card className="border-[var(--digi-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display text-[var(--digi-navy)]">
            <Linkedin className="h-5 w-5 text-[#0077B5]" aria-hidden />
            {isFr ? "Analyser mon profil LinkedIn" : "Analyze my LinkedIn profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--digi-muted)] mb-4">
            {isFr
              ? "Faites une capture d'écran de votre profil LinkedIn, puis uploadez-la. L'IA analysera vos points forts, faiblesses et vous suggérera des améliorations."
              : "Take a screenshot of your LinkedIn profile, then upload it. AI will analyze your strengths, weaknesses and suggest improvements."}
          </p>
          <label
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
              isDragging ? "border-[#0077B5] bg-[#0077B5]/5" :
              loading ? "border-[var(--digi-border)] opacity-60 pointer-events-none" :
              "border-[var(--digi-border)] hover:border-[#0077B5] hover:bg-[#0077B5]/5"
            )}
          >
            <input ref={inputRef} type="file" className="hidden" accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void analyzeImage(f); e.target.value = ""; }} />
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 text-[#0077B5] animate-spin" />
                <p className="text-sm font-medium text-[var(--digi-navy)]">
                  {isFr ? "Analyse en cours…" : "Analyzing…"}
                </p>
              </>
            ) : previewUrl ? (
              <div className="w-full flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="LinkedIn screenshot preview" className="max-h-48 rounded-lg object-contain border" />
                <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                  {isFr ? "Changer d'image" : "Change image"}
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-[var(--digi-muted)]" aria-hidden />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--digi-dark)]">
                    {isFr ? "Glissez votre capture LinkedIn ici" : "Drop your LinkedIn screenshot here"}
                  </p>
                  <p className="text-xs text-[var(--digi-muted)] mt-0.5">
                    {isFr ? "ou cliquez pour choisir" : "or click to select"}
                  </p>
                </div>
              </>
            )}
          </label>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Score + headline */}
          <Card className="border-[var(--digi-border)]">
            <CardContent className="p-5 flex flex-wrap items-center gap-6">
              <ScoreRing score={result.score} />
              <div className="flex-1 min-w-0">
                {result.name && <p className="font-display font-bold text-lg text-[var(--digi-dark)]">{result.name}</p>}
                {result.headline && <p className="text-sm text-[var(--digi-muted)]">{result.headline}</p>}
                {result.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.keywords.slice(0, 8).map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mb-2">
                  <CheckCircle2 className="h-4 w-4" /> {isFr ? "Points forts" : "Strengths"}
                </p>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 flex gap-2">
                      <span className="shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700 mb-2">
                  <AlertCircle className="h-4 w-4" /> {isFr ? "À améliorer" : "Weaknesses"}
                </p>
                <ul className="space-y-1">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-red-800 flex gap-2">
                      <span className="shrink-0">○</span>{w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card className="border-[var(--digi-border)]">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--digi-navy)] mb-3">
                  <Star className="h-4 w-4 text-[var(--digi-accent)]" />
                  {isFr ? "Recommandations" : "Recommendations"}
                </p>
                <div className="space-y-3">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-3">
                      <span className={cn("shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full h-fit", priorityColor(r.priority))}>
                        {r.priority}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--digi-dark)]">{r.action}</p>
                        <p className="text-xs text-[var(--digi-muted)]">{r.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CV Import Tips */}
          {result.cvImportTips.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  {isFr ? "Conseils pour créer votre CV" : "Tips for creating your CV"}
                </p>
                <ul className="space-y-1">
                  {result.cvImportTips.map((tip, i) => (
                    <li key={i} className="text-xs text-blue-800 flex gap-2">
                      <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" />{tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
