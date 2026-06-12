# CURSOR TASKS — Digimytch Talent Hub
*Rapport complet de ce qui doit être corrigé, amélioré et supprimé.*
*Chaque item contient le fichier exact, le problème, et ce qu'il faut faire.*

---

## 🔴 PRIORITÉ 1 — CRITIQUE (à faire maintenant)

---

### [CRITIQUE-1] Simulateur d'entretien — Problème IA profond

**Symptôme** : Le bouton "Démarrer" se bloque ou l'entretien ne démarre pas. Parfois le TTS (voix) ne se lance pas. Parfois le STT (micro) ne détecte rien. L'entretien reste bloqué en phase "booting".

**Cause racine identifiée** : Plusieurs problèmes simultanés dans le flow de boot.

#### Problème A — `runBoot` attend le micro AVANT d'appeler l'IA
**Fichier** : `src/components/interview/InterviewEngine.tsx`, fonction `runBoot` (ligne ~140)

```typescript
// PROBLÈME ACTUEL : requestMicrophoneAccess() peut prendre jusqu'à 10s
// si l'utilisateur tarde à accepter → l'IA attend dans la file
const access = await requestMicrophoneAccess();   // ← BLOQUE ICI
if (!access.ok) setMicDenied(true);
const result = await startInterviewSimulation(...); // ← appelé APRÈS
```

**Fix à appliquer** : Lancer les deux en parallèle avec `Promise.allSettled`, et rajouter un timeout strict de 5s sur le micro.

```typescript
const runBoot = useCallback(async () => {
  if (inFlightRef.current) return;
  inFlightRef.current = true;
  try {
    // Lance micro + IA EN PARALLÈLE — l'IA ne dépend pas du micro
    const [micResult, aiResult] = await Promise.allSettled([
      Promise.race([
        requestMicrophoneAccess(),
        new Promise<{ ok: false; error: string }>((res) =>
          setTimeout(() => res({ ok: false, error: "timeout" }), 5000)
        ),
      ]),
      startInterviewSimulation({ scenario, config: aiConfig, demoMode }),
    ]);

    if (micResult.status === "fulfilled" && !micResult.value.ok) {
      setMicDenied(true);
    }

    if (aiResult.status === "rejected") {
      dispatch({ type: "BOOT_FAILED", error: String(aiResult.reason) });
      return;
    }
    const result = aiResult.value;
    if (!result.ok) {
      dispatch({ type: "BOOT_FAILED", error: result.error });
      return;
    }
    dispatch({ type: "ASSISTANT_REPLY", content: result.reply });
  } catch (e) {
    dispatch({ type: "BOOT_FAILED", error: e instanceof Error ? e.message : "Démarrage impossible" });
  } finally {
    inFlightRef.current = false;
  }
}, [aiConfig, scenario, demoMode]);
```

#### Problème B — TTS ne se lance pas si `speechSynthesis.getVoices()` est vide au premier appel
**Fichier** : `src/lib/speech-tts.ts`, fonction `speakText`

Le handler `onvoiceschanged` n'est pas toujours déclenché sur Chrome/Edge. Le fallback `setTimeout(handler, 350)` est trop court dans certains environnements.

**Fix** :
```typescript
// Augmenter le timeout fallback de 350ms → 800ms
// ET ajouter une retry loop si speechSynthesis.speaking est toujours false après 1s
if (window.speechSynthesis.getVoices().length === 0) {
  let spoken = false;
  const handler = () => {
    if (spoken) return;
    spoken = true;
    window.speechSynthesis.onvoiceschanged = null;
    setVoiceAndSpeak();
  };
  window.speechSynthesis.onvoiceschanged = handler;
  setTimeout(handler, 800); // était 350
} else {
  setVoiceAndSpeak();
}
```

#### Problème C — Phase "speaking" → "listening" peut rater si TTS échoue silencieusement
**Fichier** : `src/components/interview/InterviewEngine.tsx`, useEffect sur `state.phase === "speaking"`

Si `speechSynthesis.speak()` ne déclenche jamais `onend` (bug Chrome connu quand l'onglet est en arrière-plan), l'entretien reste bloqué en "speaking" pour toujours.

**Fix** : Ajouter un timeout de sécurité de 15s qui force `SPEAK_DONE` si TTS n'a pas fini.

```typescript
useEffect(() => {
  if (state.phase !== "speaking" || !state.currentQuestion) return;

  if (!voiceEnabledRef.current) {
    dispatch({ type: "SPEAK_DONE" });
    return;
  }

  cancelSpeech();
  speakText(state.currentQuestion, {
    rate: 1.1,
    pitch: 1.02,
    onEnd: () => dispatch({ type: "SPEAK_DONE" }),
  });

  // ← AJOUT : safety timeout si onEnd ne se déclenche jamais
  const safetyTimer = window.setTimeout(() => {
    dispatch({ type: "SPEAK_DONE" });
  }, 15_000);

  return () => {
    window.clearTimeout(safetyTimer);
    cancelSpeech();
  };
}, [state.phase, state.currentQuestion]);
```

#### Problème D — STT silence auto-submit trop rapide (2s)
**Fichier** : `src/components/interview/interview-recognition-lifecycle.ts`

`SILENCE_SUBMIT_MS = 2000` — 2 secondes de silence soumet automatiquement la réponse. C'est trop court pour des pauses normales dans le discours.

**Fix** :
```typescript
export const SILENCE_SUBMIT_MS = 3500; // était 2000 — laisser le temps à l'utilisateur
```

#### Problème E — `inFlightRef` jamais reset si exception non catchée dans `processing` effect
**Fichier** : `src/components/interview/InterviewEngine.tsx`, useEffect sur `state.phase === "processing"`

Si `continueInterviewSimulation` jette une exception non prévue, `inFlightRef.current` reste `true` → les tours suivants sont bloqués.

**Fix** : S'assurer que le `finally` reset toujours `inFlightRef`:
```typescript
// Le finally { inFlightRef.current = false; } est bien présent mais
// vérifier que toutes les branches catch le font aussi — ajouter un
// try/catch global autour du useEffect run() avec finally garanti.
```

---

### [CRITIQUE-2] `.env` — Vérifier que la clé OpenRouter n'est pas dans Git

**Action** : Vérifier impérativement dans le terminal :
```bash
git log --all --oneline -- .env
git status --porcelain .env
```

Si `.env` est tracké par Git → faire immédiatement :
```bash
echo ".env" >> .gitignore
git rm --cached .env
git commit -m "remove .env from tracking"
```

Puis **régénérer la clé** sur https://openrouter.ai/keys — la clé actuelle dans `.env` doit être considérée comme compromise.

---

### [CRITIQUE-3] `getSession()` → remplacer par `getUser()` en mode Digimytch

**Fichier** : `src/lib/server-auth.ts`

```typescript
// PROBLÈME : getSession() lit le JWT local sans valider avec Supabase
// → Un JWT expiré ou modifié peut passer
if (isDigimytchTalentHub()) {
  try {
    const { data: { session } } = await supabase.auth.getSession(); // ← DANGEREUX
    return { user: session?.user ?? null, unavailable: false };
  } catch {
    return { user: null, unavailable: true };
  }
}
```

**Fix** : Supprimer le branch Digimytch et laisser toujours `getUser()` :
```typescript
// Supprimer le if (isDigimytchTalentHub()) et son body entier
// Garder uniquement :
return getAuthUserWithTimeout(() => supabase.auth.getUser(), 900);
```

Même chose dans `src/utils/supabase/middleware.ts` :
```typescript
// Chercher : useFastSessionAuth = digimytch || isPassthrough
// Remplacer par : useFastSessionAuth = isPassthrough (supprimer "digimytch ||")
```

---

## 🟠 PRIORITÉ 2 — IMPORTANT (à faire cette semaine)

---

### [IMPORTANT-1] Remplacer tous les `console.log/error/warn` par `logger`

**Fichiers concernés** (30+ occurrences) :

Faire un remplacement global dans tous ces fichiers :
- `src/app/(dashboard)/settings/actions.ts`
- `src/app/auth/login/actions.ts` (9 occurrences !)
- `src/app/auth/update-password/page.tsx`
- `src/components/auth/auth-dialog-provider.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/components/dashboard/resumes-section.tsx`
- `src/components/jobs/job-listings-card.tsx`
- `src/components/profile/profile-edit-form.tsx` (5 occurrences)
- `src/components/resume/editor/panels/resume-score-panel.tsx`
- `src/components/resume/editor/forms/projects-form.tsx`
- `src/components/resume/editor/forms/work-experience-form.tsx`
- `src/components/resume/editor/actions/resume-editor-actions.tsx`
- `src/app/(dashboard)/subscription/page.tsx`

**Pattern de remplacement** :
```typescript
// AVANT :
import { logger } from "@/lib/logger"; // (ajouter si absent)
console.error("...", error) → logger.error("...", error)
console.warn("...", x)     → logger.warn("...", x)
console.log("...", x)      → logger.debug("...", x)  // ou supprimer si inutile
console.debug("...", x)    → logger.debug("...", x)
```

---

### [IMPORTANT-2] Remplacer `isDigimytchTalentHub()` par `IS_DIGIMYTCH_TALENT_HUB`

**La fonction est @deprecated** — 25 fichiers appellent encore `isDigimytchTalentHub()`.

**Important** : Dans les composants client (`"use client"`), `IS_DIGIMYTCH_TALENT_HUB` est une constante module-level — elle fonctionne côté client car c'est une variable publique (`NEXT_PUBLIC_*`).

**Fichiers à modifier** :
- `src/app/(dashboard)/home/page.tsx` — ligne 70
- `src/app/auth/login/page.tsx` — ligne 30
- `src/components/digimytch/talent-hub-nav.tsx` — lignes 27, 58
- `src/components/layout/app-header.tsx` — ligne 37
- `src/components/resume/editor/dialogs/unsaved-changes-dialog.tsx` — ligne 34
- `src/components/resume/editor/forms/document-settings-form.tsx` — ligne 68
- `src/components/resume/editor/panels/cover-letter-panel.tsx` — ligne 84
- `src/components/resume/editor/panels/resume-score-panel.tsx` — lignes 278, 309
- `src/components/resume/management/dialogs/create-base-resume-dialog.tsx` — lignes 628, 652, 787
- `src/components/resume/management/dialogs/create-tailored-resume-dialog.tsx` — ligne 44
- `src/components/resume/management/loading-overlay.tsx` — ligne 91
- `src/components/settings/api-keys-form.tsx` — lignes 19, 39, 82
- `src/components/settings/danger-zone.tsx` — lignes 24, 41
- `src/components/settings/settings-content.tsx` — ligne 45
- `src/components/shared/model-selector.tsx` — ligne 124
- `src/components/ui/api-key-error-alert.tsx` — ligne 37
- `src/hooks/use-api-keys.ts` — lignes 85, 96
- `src/lib/ai/ci-mock-model.ts`
- `src/lib/ai/run-tracked-request.ts`
- `src/lib/ai/usage-ledger.ts`

**Remplacement** :
```typescript
// Changer l'import :
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
// au lieu de :
import { isDigimytchTalentHub } from "@/lib/digimytch-config";

// Changer l'usage :
const digimytch = IS_DIGIMYTCH_TALENT_HUB;  // au lieu de isDigimytchTalentHub()
if (IS_DIGIMYTCH_TALENT_HUB) { ... }        // au lieu de if (isDigimytchTalentHub()) { ... }
```

---

### [IMPORTANT-3] Configurer Vitest pour que les tests fonctionnent

**Problème** : `pnpm test` utilise `npx tsx --test` qui ne résout pas les path aliases `@/`. 30/31 tests échouent.

**Fix** : Installer et configurer Vitest.

```bash
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

Créer `vitest.config.ts` à la racine :
```typescript
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
});
```

Mettre à jour `package.json` :
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

### [IMPORTANT-4] Login — Masquer les credentials demo en production

**Fichier** : `src/components/auth/digimytch-login-view.tsx`

Chercher la ligne affichant `admin@admin.com` et conditionner à `process.env.NODE_ENV`:
```typescript
// AVANT : toujours affiché
<span className="font-mono text-foreground">admin@admin.com</span>

// APRÈS : seulement en développement
{process.env.NODE_ENV === "development" && (
  <p className="text-xs text-muted-foreground">
    Demo: <span className="font-mono">admin@admin.com</span> / Admin123
  </p>
)}
```

---

### [IMPORTANT-5] LoyaltyPointsBadge — Ajouter du cache pour éviter requête à chaque render

**Fichier** : `src/components/digimytch/loyalty-points-badge.tsx`

Actuellement : requête Supabase directe dans `useEffect` à chaque montage, sans cache.

**Fix** : Utiliser `useSWR` (déjà indirect dans le projet) ou un simple cache en module :
```typescript
// Option simple : cache in-module avec TTL 60s
let _cache: { data: LoyaltyData; at: number } | null = null;
const CACHE_TTL = 60_000;

// Dans le useEffect, vérifier le cache avant la requête :
useEffect(() => {
  if (_cache && Date.now() - _cache.at < CACHE_TTL) {
    setData(_cache.data);
    return;
  }
  const supabase = createClient();
  void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: lp } = await supabase
      .from("loyalty_points")
      .select("points, total_earned")
      .eq("user_id", user.id)
      .maybeSingle();
    const result = lp ?? { points: 0, total_earned: 0 };
    _cache = { data: result, at: Date.now() };
    setData(result);
  })();
}, []);
```

---

### [IMPORTANT-6] Interview — Augmenter `INTERVIEW_MAX_TURNS` et rendre configurable

**Fichier** : `src/lib/interview-simulator.ts`

```typescript
export const INTERVIEW_MAX_TURNS = 8; // OK mais devrait être configurable
```

**Fix** : Exposer un select dans l'UI setup pour choisir 5 / 8 / 12 questions.
Dans `src/components/digimytch/interview-simulator-panel.tsx`, ajouter avant le bouton Start :
```tsx
<Select value={String(maxTurns)} onValueChange={(v) => setMaxTurns(Number(v))}>
  <SelectTrigger className="w-36">
    <SelectValue placeholder="Nb questions" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="5">5 questions</SelectItem>
    <SelectItem value="8">8 questions</SelectItem>
    <SelectItem value="12">12 questions</SelectItem>
  </SelectContent>
</Select>
```

Et passer `maxTurns` au `InterviewEngine` et dans `InterviewScenario`.

---

## 🟡 PRIORITÉ 3 — AMÉLIORATIONS (semaine suivante)

---

### [AMÉLIORATION-1] i18n — Traduire les composants Digimytch en EN/FR

**Composants actuellement FR uniquement** :
- `src/components/digimytch/formations-hub.tsx`
- `src/components/digimytch/course-card.tsx`
- `src/components/digimytch/loyalty-points-badge.tsx`
- `src/components/digimytch/cv-required-gate.tsx`
- `src/components/digimytch/onboarding-progress.tsx`
- `src/components/digimytch/demo-banner.tsx`
- `src/components/digimytch/page-guide.tsx`

**Fix** : Utiliser `useLanguage()` existant et `appCopy(lang)` / ajouter les clés manquantes dans `src/lib/digi-i18n.ts`.

---

### [AMÉLIORATION-2] Corbeille — Ajouter pagination

**Fichier** : `src/utils/actions/trash/actions.ts`

La fonction `listUserTrash()` charge tout d'un coup. À fort volume, c'est lent.

**Fix** :
```typescript
export async function listUserTrash(opts?: { limit?: number; offset?: number }) {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  // Ajouter .range(offset, offset + limit - 1) aux queries Supabase
}
```

---

### [AMÉLIORATION-3] Semantic matching — S'assurer que les embeddings sont générés

**Fichiers** : `src/utils/actions/digimytch/actions.ts`, `src/lib/semantic-matching.ts`

Le matching hybride pgvector ne fonctionne que si les offres et le CV ont un vecteur `embedding`. Actuellement c'est lazy (généré à la demande par `ensureJobEmbedding`).

**Fix** : Ajouter une notification dans `/jobs` si l'embedding du CV base n'est pas encore généré :
```tsx
{!resume?.embedding && (
  <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
    ⚡ Première analyse : calcul du vecteur sémantique de votre CV en cours…
  </p>
)}
```

Et s'assurer que `buildResumeEmbeddingText()` + `generateEmbedding()` est appelé après chaque update du CV base dans `src/utils/actions/resumes/actions.ts`.

---

### [AMÉLIORATION-4] Supprimer les fonctions `@deprecated`

Nettoyer le code mort :

| Fonction deprecated | Fichier | Remplacée par |
|---|---|---|
| `isDigimytchTalentHub()` | `src/lib/digimytch-config.ts` | `IS_DIGIMYTCH_TALENT_HUB` |
| `speakFrenchRecruiter()` | `src/lib/speech-tts.ts` | `speakText()` |
| `pickFrenchRecruiterVoice()` | `src/lib/speech-tts.ts` | (interne) |
| `parseResumeTextHeuristic` | `src/lib/resume-text-heuristic.ts` | `parseResumeTextStructured()` |
| `LINKEDIN_VISION_FALLBACK_CHAIN` | `src/lib/digimytch-openrouter-models.ts` | vision path dans linkedin-analyze.ts |
| `resumeChatTools` (old export) | `src/lib/tools.ts` | `resumeChatTools` (current) |
| `useToast` | `src/hooks/use-toast.ts` | `sonner` directement |
| `scoreResume` server action | `src/utils/actions/resumes/actions.ts` | `POST /api/resume-score` |

**Avant de supprimer** : vérifier avec `grep -r "speakFrenchRecruiter\|pickFrenchRecruiterVoice" src/` qu'aucun fichier ne les importe encore.

---

### [AMÉLIORATION-5] Interview — Ajouter feedback visuel "IA réfléchit"

**Fichier** : `src/components/interview/InterviewEngine.tsx`

En phase `processing`, afficher un indicateur animé dans la bulle assistant (dots animés) pour que l'utilisateur sache que l'IA génère la réponse.

```tsx
{state.phase === "processing" && (
  <div className="flex items-end gap-2">
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#030A8C] to-[#D10069] flex items-center justify-center shrink-0">
      <span className="text-lg">👩‍💼</span>
    </div>
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1.5 items-center h-5">
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} className="w-2 h-2 bg-[#030A8C]/40 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  </div>
)}
```

---

### [AMÉLIORATION-6] Interview — Gérer le cas "modèle IA saturé" avec message clair

**Fichier** : `src/components/interview/InterviewEngine.tsx`

Quand `result.ok === false`, le message d'erreur est souvent cryptique ("Too many requests").

**Fix** : Dans le reducer `TURN_FAILED` et `BOOT_FAILED`, mapper les erreurs connues :
```typescript
function friendlyInterviewError(raw: string): string {
  if (/too many requests|rate limit|429|temporarily/i.test(raw))
    return "Les modèles IA gratuits sont saturés. Réessayez dans 1–2 minutes.";
  if (/no endpoints found|model not found|404/i.test(raw))
    return "Modèle IA indisponible. Changez le modèle dans les paramètres.";
  if (/network|fetch/i.test(raw))
    return "Erreur réseau. Vérifiez votre connexion.";
  return raw;
}
```

---

### [AMÉLIORATION-7] `ai_usage_events` — Passer les inserts en fire-and-forget

**Fichier** : `src/lib/ai/usage-ledger.ts`

Les fonctions `recordAIUsageStarted()` et `recordAIUsageFinished()` sont `await`-ées sur chaque requête IA, ajoutant une latence inutile.

**Fix** : Les exécuter en parallèle avec la vraie requête IA, sans bloquer.

Dans `src/lib/ai/run-tracked-request.ts` et `startAIUsageRequest` / `finishAIUsageRequest`, utiliser `void` pour ne pas attendre le log :
```typescript
// Pour recordAIUsageFinished dans onFinish callback :
onFinish: async ({ usage }) => {
  void finishAIUsageRequest({ usageEventId, status: "succeeded", usage }); // fire & forget
},
```

---

### [AMÉLIORATION-8] Formations — Afficher le progress de completion des cours Digimytch

**Fichier** : `src/components/digimytch/course-card.tsx`

Actuellement le bouton "Marquer complété" existe mais il n'y a pas de feedback visuel persistant (badge ✓ vert) après completion.

**Fix** : Passer la liste des `course_completions` de l'user en prop depuis la page `/formations`, et afficher un badge "Complété ✓" sur les cartes déjà terminées.

---

## 🗑️ À SUPPRIMER

---

### [SUPPRIMER-1] `src/components/landing/talent-hub/` — Pages landing non utilisées

Vérifier si ces composants sont montés quelque part. Si non (la landing Digimytch est dans `src/app/page.tsx` qui utilise ses propres composants) :
- `src/components/landing/talent-hub/hero-section.tsx`
- `src/components/landing/talent-hub/landing-nav.tsx`
- `src/components/landing/talent-hub/sections.tsx`
- `src/components/landing/talent-hub/trust-banner.tsx`

```bash
grep -r "talent-hub/hero-section\|talent-hub/landing-nav\|talent-hub/sections\|talent-hub/trust-banner" src/
```
Si aucun résultat → supprimer le dossier entier.

---

### [SUPPRIMER-2] `src/components/digimytch/talent-hub-nav.tsx` — Doublon du shell

Ce composant existe mais le shell `DigimytchShell` gère déjà toute la navigation. Vérifier :
```bash
grep -r "talent-hub-nav" src/ --include="*.tsx" --include="*.ts"
```
Si seulement importé dans des fichiers eux-mêmes inutilisés → supprimer.

---

### [SUPPRIMER-3] `src/app/(dashboard)/start-trial/page.tsx` — Stripe inutile en mode Digimytch

Cette page n'a aucune utilité en mode Digimytch (pas de Stripe, tout le monde est Pro). Mettre une redirection :
```typescript
// src/app/(dashboard)/start-trial/page.tsx
import { redirect } from "next/navigation";
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config";
export default function StartTrialPage() {
  if (IS_DIGIMYTCH_TALENT_HUB) redirect("/home");
  // ...reste du code Stripe...
}
```

---

### [SUPPRIMER-4] Imports `@/lib/resume-text-heuristic` dans le codebase

```bash
grep -r "resume-text-heuristic" src/ --include="*.ts" --include="*.tsx"
```
Remplacer tous les usages par `parseResumeTextStructured` de `resume-text-structured.ts`.

---

### [SUPPRIMER-5] Commentaires debug et logs temporaires dans `api/chat/route.ts`

**Fichier** : `src/app/api/chat/route.ts`

Ce fichier contient des commentaires longs sur GPT-5 et des blocs de config `providerOptions` très verbeux.
Nettoyer et simplifier les types inline :
```typescript
// Supprimer la section de commentaires "Some models (e.g., GPT-5 family...)"
// Simplifier le type ProviderOptions en interface propre dans un fichier séparé
```

---

## 📋 CHECKLIST RAPIDE POUR CURSOR

```
□ CRITIQUE-1 : Fixer le boot de l'interview (paralléliser mic + IA, safety timer TTS, silence 3.5s)
□ CRITIQUE-2 : Vérifier .env dans git + régénérer clé OpenRouter
□ CRITIQUE-3 : Remplacer getSession() par getUser() dans server-auth.ts et middleware.ts
□ IMPORTANT-1 : Remplacer console.log par logger dans 30+ fichiers
□ IMPORTANT-2 : Remplacer isDigimytchTalentHub() par IS_DIGIMYTCH_TALENT_HUB dans 25 fichiers
□ IMPORTANT-3 : Configurer Vitest pour les tests (path aliases)
□ IMPORTANT-4 : Masquer admin@admin.com hors développement
□ IMPORTANT-5 : Cache 60s pour LoyaltyPointsBadge
□ IMPORTANT-6 : Select nb de questions dans l'entretien (5/8/12)
□ AMÉLIORATION-1 : i18n EN/FR pour composants formations, loyalty, gate
□ AMÉLIORATION-2 : Pagination dans la corbeille
□ AMÉLIORATION-3 : Indicateur embedding CV manquant sur /jobs
□ AMÉLIORATION-4 : Supprimer fonctions @deprecated
□ AMÉLIORATION-5 : Indicateur "IA réfléchit" (dots animés) en phase processing
□ AMÉLIORATION-6 : Messages d'erreur interview plus clairs (rate limit, modèle 404)
□ AMÉLIORATION-7 : fire-and-forget pour ai_usage_events inserts
□ AMÉLIORATION-8 : Badge "Complété ✓" sur course-card après completion
□ SUPPRIMER-1 : landing/talent-hub/ si non utilisé
□ SUPPRIMER-2 : talent-hub-nav.tsx si doublon
□ SUPPRIMER-3 : Redirection /start-trial → /home en mode Digimytch
□ SUPPRIMER-4 : Imports resume-text-heuristic (deprecated)
□ SUPPRIMER-5 : Nettoyer commentaires verbeux dans api/chat/route.ts
```

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ POUR CURSOR

1. **CRITIQUE-1** (interview boot fix) — impact immédiat, le simulateur est la feature phare
2. **CRITIQUE-3** (getUser vs getSession) — sécurité
3. **IMPORTANT-1** (console → logger) — qualité production, find-replace global facile
4. **IMPORTANT-2** (deprecated function) — refactor mécanique, find-replace global
5. **IMPORTANT-3** (Vitest) — permettra de valider tous les autres changements
6. **AMÉLIORATION-5+6** (UX interview) — polish de la feature principale
7. Tout le reste dans l'ordre de la checklist
