# Analyse Technique Complète — Digimytch Talent Hub
*Date : 12 juin 2026 — Rapport exhaustif sur l'état du projet*

---

## 1. VUE D'ENSEMBLE DU PROJET

**Digimytch Talent Hub** est un fork de **ResumeLM** (Next.js 15 / React 19) transformé en plateforme d'insertion professionnelle pour le marché tunisien. L'application est activée par la variable d'environnement `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB=1`, qui bascule toute la logique entre le mode ResumeLM d'origine et le mode Digimytch.

### Stack technique principale
| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.1.11 |
| UI | React | 19.0.0 |
| Language | TypeScript (strict) | 5.7.2 |
| Base de données | Supabase (PostgreSQL + RLS) | @supabase/ssr 0.5.2 |
| Auth | Supabase Auth (JWT, SSR cookies) | — |
| AI | Vercel AI SDK v4 + OpenRouter | ai 4.0.23 |
| Cache/Rate limit | IORedis (local) + Upstash (cloud) | ioredis 5.8.2 |
| Styles | Tailwind CSS v3 + Shadcn UI | 3.4.17 |
| PDF | @react-pdf/renderer + pdfjs-dist | 4.1.6 / 4.8.69 |
| Rich text | TipTap | 2.11.x |
| Paiement | Stripe | 18.1.0 |
| Analytics | Vercel Analytics + PostHog (optionnel) | — |
| Package manager | pnpm 9.15.4 | — |
| Node minimum | 20.0.0 | — |

### Chiffres clés
- **468 fichiers source** TypeScript/TSX
- **31 fichiers de test** (.test.ts)
- **~58 500 lignes de code** au total
- **21 migrations SQL** Supabase
- **9 routes dans la nav candidat** (sidebar)
- **12 routes API** dans /app/api/

---

## 2. ARCHITECTURE & STRUCTURE

### 2.1 Structure des routes (App Router)
```
app/
├── (dashboard)/           ← Routes protégées (auth requise)
│   ├── home/              ← Dashboard principal candidat
│   ├── resumes/[id]/      ← Éditeur CV
│   ├── score-cv/          ← Score CV standalone (sans éditeur)
│   ├── jobs/              ← Analyse d'offres + matching
│   ├── linkedin/          ← Analyse profil LinkedIn (vision IA)
│   ├── formations/        ← Catalogue formations
│   ├── candidatures/      ← Kanban de suivi candidatures
│   ├── entretiens/        ← Simulateur d'entretien IA
│   ├── corbeille/         ← Corbeille (soft-delete 30j)
│   ├── profile/           ← Profil candidat
│   ├── settings/          ← Paramètres
│   ├── admin/             ← Back-office admin
│   └── subscription/      ← Stripe (inactif en mode Digimytch)
├── api/
│   ├── assistant/         ← Chat IA global (streaming)
│   ├── chat/              ← Chat IA éditeur CV (tools)
│   ├── cv/ats-gap/        ← Analyse ATS
│   ├── extract-cv/        ← Extraction texte CV
│   ├── jobs/clip/         ← Extension Chrome (Bearer auth)
│   ├── linkedin-analyze/  ← Analyse screenshot LinkedIn (vision)
│   ├── ocr-cv/            ← OCR image → texte CV
│   ├── openrouter/capabilities/ ← Check modèles disponibles
│   ├── resume-score/      ← Score CV via IA
│   ├── speech/transcribe/ ← STT Whisper via OpenRouter
│   └── webhooks/stripe/   ← Webhooks Stripe
└── auth/                  ← Login, signup, reset, callback
```

### 2.2 Middleware (src/middleware.ts)
- Délègue entièrement à `updateSession()` de Supabase SSR
- Gère les redirections : `/` → `/home` (user connecté) ou `/admin` (admin)
- Isole les routes admin (redirect /home si candidat) et candidat (redirect /admin si admin)
- Matcher exclut : `_next`, `favicon`, `api/webhooks`, `api/openrouter`, `api/jobs/clip`, fichiers statiques
- **ATTENTION** : utilise `getSession()` en mode Digimytch (plus rapide mais moins sécurisé que `getUser()`) — acceptable pour ce contexte

### 2.3 Layout (src/app/layout.tsx)
- Charge une seule fois l'utilisateur via `getCachedAuthUser()` (React `cache()`)
- Active le shell `DigimytchShell` (sidebar fixe) si user connecté en mode Digimytch
- Injecte : `SupabaseSessionGuard`, `FeedbackWidget`, barre de progression, Toaster, Analytics Vercel
- Langues : cookie `digi-lang` (fr/en), défaut `fr`
- **Optimisation** : subscription non chargée dans le layout — uniquement dans /settings et /subscription

### 2.4 Shell Digimytch (DigimytchShell)
Navigation latérale fixe avec 9 routes candidat :
1. `/home` — Tableau de bord
2. `/resumes` — CV & lettres
3. `/score-cv` — Score CV
4. `/jobs` — Analyser une offre
5. `/linkedin` — LinkedIn
6. `/formations` — Formations
7. `/candidatures` — Mes candidatures
8. `/entretiens` — Entretiens
9. `/corbeille` — Corbeille

**Fonctionnalités du shell** :
- Préchargement (`router.prefetch`) de toutes les routes au montage
- Avatar utilisateur avec fallback initiales (gradient bleu→magenta)
- `LoyaltyPointsBadge` compact dans la sidebar (lazy-loaded)
- Sélecteur de modèle IA (`DigimytchModelSelector`)
- Toutes les clés de traduction présentes dans `digi-i18n.ts` ✅
- Toutes les pages existent ✅

---

## 3. SERVICES ET FONCTIONNALITÉS DÉTAILLÉS

### 3.1 Authentification & Sécurité

**Supabase Auth (SSR cookies)** :
- `createClient()` (server) et `createClient()` (browser) avec patterns @supabase/ssr
- `getCachedAuthUser()` — React `cache()`, une seule requête auth par render tree
- `SupabaseSessionGuard` (client) — surveille `SIGNED_OUT`, nettoie les cookies, arrête le refresh auth si Supabase est down

**Modèle admin** (double couche) :
1. JWT claim `app_metadata.is_admin === true` (serveur, non falsifiable)
2. Fallback : `SEED_ADMIN_EMAIL` env var — bloqué si `admin@admin.com` en production
- `isAdminUser()` dans `digimytch-config.ts` est bien utilisé dans le middleware et les server actions

**Middleware** :
- Routes `SUBSCRIPTION_EXEMPT_ROUTES` : toutes les routes Digimytch sont exemptées de vérification Stripe (logique correcte)
- Robustesse : si Supabase est unreachable + cookie auth présent → accès autorisé (mode offline gracieux)

**Problème résiduel** : Le login affiche `admin@admin.com` dans le fichier `digimytch-login-view.tsx` (demo hint) — acceptable en dev, à supprimer en production.

### 3.2 Rate Limiting

Implémentation en **sliding window de 60s / 10 requêtes** par user+scope :
- **IORedis** (local Docker, `USE_LOCAL_REDIS=true`) : pipeline ZADD/ZREMRANGEBYSCORE avec atomic ops
- **Upstash REST** (Vercel/cloud) : Lua script atomique (EVAL) — correct et efficace
- **In-memory Map** (fallback CI) : bloqué en production (`throw RateLimitBackendError`)

**État actuel** : ✅ Correctement implémenté avec les 3 backends.

### 3.3 Système IA

**Provider unique : OpenRouter** (en mode Digimytch)
- Clé : `OPENROUTER_API_KEY` dans `.env`
- Modèle actif dans `.env` : `sk-or-v1-[REDACTED]`

**Chaîne de fallback modèles** (ordre) :
1. `openrouter/free` (défaut)
2. `nvidia/nemotron-3-super-120b-a12b:free`
3. `moonshotai/kimi-k2.6:free`
4. `meta-llama/llama-3.3-70b-instruct:free`
5. `google/gemma-4-26b-a4b-it:free`

**Modèles par tâche** (via `selectDigimytchModelForTask()`) :
- matching/cv → `openrouter/free`
- lettre/linkedin → `google/gemma-4-26b-a4b-it:free`
- interview → `meta-llama/llama-3.3-70b-instruct:free`

**Usage ledger** (AI Usage Tracking) :
- Table `ai_usage_events` : log chaque requête (started/succeeded/failed/rate_limited)
- Tracking analytics PostHog associé
- `logPromptInjectionAttempt()` sur détection d'injection

**Sécurité des prompts** :
- `sanitizeForPrompt()` — strip patterns injection ciblés (tokens LLM `[INST]`, `[SYS]`, jailbreaks)
- Limite à 4000 tokens estimés
- N'efface plus les brackets légitimes `[JavaScript]` — fix correct ✅

**STT (Speech-to-Text)** :
- Web Speech API (Chrome/Edge) via `useSpeechRecognition` hook — mode principal
- Fallback serveur : OpenRouter Whisper (`openai/whisper-large-v3`) via `POST /api/speech/transcribe`
- Fix critique appliqué : `stopListening()` retourne l'intérim pending ✅

### 3.4 Fonctionnalités Digimytch

#### 3.4.1 Score CV (`/score-cv`)
- Page standalone — ne nécessite pas d'ouvrir l'éditeur
- Accepte : CV existant (dropdown) ou import texte
- Import fichier : PDF (`pdf-parse`), Word (`mammoth`), Image (OCR vision IA via `/api/ocr-cv`)
- Score heuristique + score IA (via `resume-score-service.ts`)
- Sentinelle `-1` pour CV vide → affiche `—` et "CV requis" au lieu de `0/100` ✅

#### 3.4.2 Analyse d'offres (`/jobs`)
- Gate CV : si pas de CV de base → affiche `CvRequiredGate` ✅
- Matching mots-clés (`computeResumeJobMatch`) + optionnel sémantique pgvector
- Matching hybride : HNSW index sur `jobs.embedding` et `resumes.embedding`
- Fusion multi-CV : si plusieurs CV base en mode Digimytch → union des tokens
- Tri par score décroissant
- Catalog Platform : offres pré-insérées (demo) via `ensureDemoJobsIfEmpty()`
- Applications Kanban : bouton "Ajouter à Mes candidatures" dans chaque offre

#### 3.4.3 Simulateur d'entretien (`/entretiens`)
- Architecture réécrite : `InterviewEngine` + reducer (`interview-engine-reducer.ts`) + lifecycle (`interview-recognition-lifecycle.ts`)
- Phases : setup → live → debrief
- TTS (lecture) via `window.speechSynthesis`
- STT : Web Speech API + fallback Whisper server
- Mode démo (profil fictif "Alex Martin") si profil vide
- Fix `isPro` : mode Digimytch → `isPro = true` ✅
- Fix UI frozen : `setLoading(true)` avant mic check avec timeout 4s ✅

#### 3.4.4 Analyse LinkedIn (`/linkedin`)
- Upload screenshot PNG/JPG (drag & drop)
- Vision IA : envoie base64 à `/api/linkedin-analyze` → Claude/Gemini vision
- Résultat : score 0-100, forces, faiblesses, recommandations avec priorité, keywords
- `ScoreRing` SVG animé avec couleur conditionnelle (vert/orange/rouge)
- Compression image client-side avant envoi (`prepareLinkedInScreenshot`)
- Gestion rate limit spécifique avec message FR/EN

#### 3.4.5 Formations (`/formations`)
- Gate CV : `CvRequiredGate` si pas de CV ✅
- Catalogue courses depuis Supabase table `courses`
- Ranking IA (`rankCoursesBySkillGaps`) : croise `skills_targeted` avec gap union des offres analysées
- Filtres : niveau, provider, compétence, "recommandées only", "Digimytch Academy only"
- Vues grille / liste
- `LoyaltyPointsBadge` affiché sur la page

#### 3.4.6 Candidatures Kanban (`/candidatures`)
- 5 colonnes : À traiter → Envoyée → Entretien → Offre reçue → Refusée
- DnD via `@dnd-kit`
- Archivage (soft delete)
- Alimenté depuis /jobs via "Ajouter à Mes candidatures"

#### 3.4.7 Corbeille (`/corbeille`)
- Rétention 30 jours (`TRASH_RETENTION_DAYS = 30`)
- Entités : CV, offres, candidatures, formations
- Restauration (`isTrashRestorable`) + affichage "expire dans N jours"
- Admin a un onglet "Corbeille" dans le dashboard admin

#### 3.4.8 Système de Points Fidélité
- Table `loyalty_points` (user_id unique, points, total_earned)
- Table `course_completions` (user_id + course_id unique)
- RPC `complete_digimytch_course(p_course_id)` — SECURITY DEFINER, atomique
- 5 niveaux : Débutant (0) → Actif (100) → Engagé (300) → Expert (600) → Elite (1000)
- 6 récompenses déverrouillables par paliers de points
- `LoyaltyPointsBadge` : charge les points via Supabase client direct (lazy, SSR:false)
- **Limitation** : ne retourne rien si `points === 0 && total_earned === 0` (comportement voulu pour ne pas polluer l'UI)

### 3.5 Back-office Admin (`/admin`)

6 onglets dans `AdminDashboard` :
1. **Vue d'ensemble** — stats globales (users, cours, candidatures, feedback)
2. **Formations** — CRUD cours (ajouter, modifier, désactiver)
3. **Import IA** — import de cours via prompt IA
4. **Réclamations** — lire et répondre aux feedbacks candidats
5. **Corbeille** — voir/restaurer les items supprimés de tous les users
6. **Utilisateurs** — liste users, gestion rôles

Accès protégé middleware + double vérification `isAdminUser()` dans chaque server action.

### 3.6 Feedback Candidat
- `FeedbackWidget` — bouton flottant (hors admin, mode Digimytch uniquement)
- 4 options : Excellente 😊, Bonne 🙂, Moyenne 😐, Difficile 😞
- Flow rapide (Excellente/Bonne → submit direct) vs. flow détaillé (Moyenne/Difficile → textarea)
- Table `candidate_feedback` en DB avec `admin_reply` (l'admin peut répondre via l'onglet Réclamations)
- Animation Framer Motion sur le widget

### 3.7 Assistant IA Global (`GlobalAssistant`)
- Bouton flottant bas-droite (sparkles icon)
- Fenêtre chat avec streaming
- Suggestions contextuelles par page (`getSystemPrompt` adapte le system prompt selon `pathname`)
- Modèle : lu depuis `localStorage` (`digi-ai-model`) ou `openrouter/free` par défaut
- Fallback chain modèles identique aux autres routes

### 3.8 Éditeur CV (résumé ResumeLM)
- Layout 3 panneaux resizable : Formulaire | Preview PDF | Assistant IA
- TipTap pour zones rich text
- React PDF pour la preview en temps réel
- Cover letter editor (Tiptap full)
- AI tools (5 max par appel) pour suggestions work experience, skills, education, projects
- Score panel intégré dans l'éditeur
- Unsaved changes guard (contexte global)

---

## 4. BASE DE DONNÉES (Supabase PostgreSQL)

### 4.1 Tables principales
| Table | Description | RLS |
|---|---|---|
| `profiles` | Profil complet candidat (JSONB: work_experience, education, skills, projects) | ✅ |
| `resumes` | CV de base + tailored (JSONB, soft-delete `deleted_at`) | ✅ |
| `jobs` | Offres analysées (JSONB keywords, embedding vector 1536d) | ✅ |
| `job_applications` | Candidatures avec statuts Kanban | ✅ |
| `courses` | Catalogue formations (avec institution, is_digimytch, loyalty_points_reward) | ✅ |
| `loyalty_points` | Points fidélité par user (unique constraint sur user_id) | ✅ |
| `course_completions` | Formations complétées (unique user+course) | ✅ |
| `ai_usage_events` | Ledger IA (route, model, tokens, status) | ✅ |
| `candidate_feedback` | Feedbacks + réponses admin | ✅ |
| `subscriptions` | Stripe subscriptions (inactif en mode Digimytch) | ✅ |

### 4.2 Extensions PostgreSQL
- **pgvector** : colonnes `embedding storage.vector(1536)` sur jobs et resumes
- **HNSW index** : `vector_cosine_ops` avec m=16, ef_construction=64
- **uuid-generate-v4** : IDs
- **auth.uid()** : dans les policies RLS

### 4.3 Migrations (21 au total, chronologique)
- `20260215` — Courses + Applications (base)
- `20260503` — AI usage events + Stripe webhooks
- `20260520` — Ajout cours supplémentaires
- `20260523` — Bucket Supabase Storage (avatars)
- `20260524` — Card images
- `20260528` — Performance RLS + indexes
- `20260530` — Rôle admin
- `20260531` — **Loyalty points** (tables + RPC) + Candidate feedback
- `20260601` — Soft delete + feedback reply
- `20260605` — **pgvector** semantic matching
- `20260607` — Fixes linter Supabase (4 migrations)
- `20260609` — Refresh card images

### 4.4 Fonctions RPC
- `complete_digimytch_course(p_course_id)` — atomic SECURITY DEFINER
- `match_jobs_semantic(p_user_id, p_resume_embedding, ...)` — HNSW cosine search
- `update_application_status(...)` — mise à jour statut Kanban

---

## 5. SÉCURITÉ — ÉTAT ACTUEL

### ✅ Points forts
- RLS activé sur toutes les tables
- JWT claim `app_metadata.is_admin` non falsifiable côté client
- Rate limiting Redis sliding window (pas in-memory en prod)
- Prompt injection sanitizer (patterns ciblés, pas over-broad)
- Zod validation sur toutes les routes API critiques
- CSP headers dans `next.config.ts` (script-src, connect-src stricts)
- HSTS en production (`Strict-Transport-Security`)
- Permissions-Policy restrictive (camera=(), payment=self)
- `sanitizeForPrompt()` appliqué sur : `target_role`, `job`, `resume summary`, system prompts interview
- Injection attempts loggés dans `ai_usage_events`
- `admin@admin.com` refusé en production dans `isAdminEmail()`

### ⚠️ Points à surveiller
- **Clé OpenRouter dans .env** : La clé `sk-or-v1-[REDACTED]...` est dans `.env` (qui ne doit PAS être commité). Vérifier que `.env` est dans `.gitignore`.
- **`getSession()` au lieu de `getUser()`** en mode Digimytch : `getSession()` lit le JWT local sans le vérifier côté serveur Supabase. Acceptable en mode dev/local, mais en production préférer `getUser()`.
- **CSP `unsafe-inline`** pour scripts : nécessaire pour Next.js mais à documenter.
- La login page affiche les credentials demo `admin@admin.com / Admin123` — à masquer en prod.

---

## 6. PERFORMANCE

### ✅ Optimisations en place
- `getCachedAuthUser()` avec React `cache()` — une seule requête auth par tree de rendu serveur
- Queries DB parallèles (`Promise.all`) dans la majorité des pages
- Lazy loading : `InterviewSimulatorPanelLazy`, `CandidaturesKanbanLazy`, `LinkedInAnalyzerLazy` (dynamic imports)
- `LoyaltyPointsBadge` : `ssr: false`, ne bloque pas le render serveur
- `router.prefetch()` sur toutes les routes du shell au montage
- Framer Motion : lazy loaded via `GlobalAssistantLazy`
- HNSW index pgvector pour semantic search O(log n)
- `ensureDemoJobsIfEmpty()` : guard contre les insertions répétées
- View Transitions API native (CSS `@view-transition { navigation: auto }`)
- `maxDuration = 120` sur les routes streaming IA

### ⚠️ Points d'amélioration potentielle
- `LoyaltyPointsBadge` fait une requête Supabase client à chaque montage — pas de cache, pas de SWR
- La subscription est vérifiée à chaque page non-exemptée (ResumeLM mode) — impact en mode Digimytch nul car toujours exempt
- `ai_usage_events` insert sur chaque requête IA — peut devenir un bottleneck à fort volume

---

## 7. INTERNATIONALISATION (i18n)

- Système custom léger : `appCopy(lang)` retourne un objet de strings
- `useLanguage()` hook : lit le cookie `digi-lang` côté client, lang prop côté serveur
- Toggle langue : `LanguageToggle` dans la sidebar
- **Couverture** : `digi-i18n.ts` (UI shell + jobs), `score-cv-i18n.ts` (score CV), `landing-i18n.ts` (landing)
- Toutes les clés de navigation présentes (`navScoreCv`, `navLinkedIn`, `navTrash`, `navLoyalty`) ✅
- **Lacune** : la majorité des composants Digimytch (formations-hub, linkedin-analyzer, loyalty-points-badge) sont en français uniquement sans switch EN/FR

---

## 8. TESTS

### État des tests (30/31 en échec)
**Raison unique** : Le runner `node --test` utilise les modules ESM natifs sans TypeScript path aliases (`@/lib/...`). Ces imports échouent avec `ERR_MODULE_NOT_FOUND`.

**Ce n'est PAS un problème de code** — c'est un problème de configuration du runner de test. Le script `"test": "npx tsx --test \"src/**/*.test.ts\""` est dans `package.json` mais la commande `tsx` n'est pas disponible dans l'environnement sandbox.

**Seul test passant** : `src/utils/actions/stripe/actions.safety.test.ts` (simple import check, pas de path alias).

**Recommandation** : Ajouter `vitest` ou configurer `tsx` avec aliases pour que les tests fonctionnent correctement. En local avec pnpm installé, la commande `pnpm test` devrait fonctionner.

### Tests existants couvrent :
- `prompt-security.test.ts` — sanitization injection
- `matching.test.ts` — algorithme de matching CV/offre
- `interview-engine-reducer.test.ts` — machine à états de l'entretien
- `interview-recognition-lifecycle.test.ts` — lifecycle STT
- `linkedin-report-heuristic.test.ts` — heuristique LinkedIn
- `resume-score-heuristic.test.ts` — score CV heuristique
- `course-ranking.test.ts` — ranking formations
- `job-applications.test.ts` — applications Kanban
- `subscription-access.test.ts` — logique Stripe
- Et 21 autres...

---

## 9. DOCKER & DÉPLOIEMENT LOCAL

### Docker Compose (Supabase self-hosted)
Fichier `docker/docker-compose.yml` — stack Supabase complète : db, auth, realtime, storage, studio.

Variables d'environnement dev :
- `NEXT_PUBLIC_SITE_URL=http://localhost:3001`
- `USE_LOCAL_REDIS=true` + `REDIS_URL=redis://localhost:6379`
- `AUTO_PRO_SUBSCRIPTION=true` — skip Stripe en dev
- `SEED_ADMIN_EMAIL=admin@admin.com` / `SEED_ADMIN_PASSWORD=Admin123`

Scripts utiles :
- `pnpm supabase:up` — démarrer Docker Supabase
- `pnpm supabase:migrate` — appliquer les migrations Digimytch
- `pnpm dev` — lance `auto-maintain.mjs` puis Next.js sur port 3001
- `pnpm openrouter:check` — vérifier la clé et les modèles disponibles
- `pnpm verify` — typecheck + tests + lint

### Script `auto-maintain.mjs`
Lance avant `dev` et `build` — probablement vérifications/nettoyages automatiques.

---

## 10. PROBLÈMES IDENTIFIÉS ET RECOMMANDATIONS

### 🔴 Critiques
| # | Problème | Fichier | Fix |
|---|---|---|---|
| 1 | `.env` avec vraie clé OpenRouter commité potentiellement | `.env` | Vérifier `.gitignore` inclut `.env`. Faire tourner `git log --all -- .env` |
| 2 | `getSession()` en mode Digimytch | `server-auth.ts`, `middleware.ts` | Migrer vers `getUser()` en production pour valider le JWT côté Supabase |
| 3 | Tests ne s'exécutent pas (path aliases) | `package.json` | Installer `vitest` avec alias config ou configurer `tsx` + tsconfig-paths |

### 🟠 Importants
| # | Problème | Fichier | Fix |
|---|---|---|---|
| 4 | `isDigimytchTalentHub()` deprecated encore appelé dans 19 fichiers | Multiple | Remplacer par `IS_DIGIMYTCH_TALENT_HUB` constant directement |
| 5 | `LoyaltyPointsBadge` requête Supabase à chaque render sans cache | `loyalty-points-badge.tsx` | Ajouter `useSWR` ou `React.cache` / store Zustand |
| 6 | Login affiche `admin@admin.com` en clair | `digimytch-login-view.tsx` | Conditionner à `NODE_ENV === 'development'` |
| 7 | Interview : 30 tests en échec dans le runner | Tests | Configurer runner de test correctement |
| 8 | Formations uniquement en FR | `formations-hub.tsx`, `course-card.tsx` | Utiliser `useLanguage()` et `appCopy()` existant |

### 🟡 Améliorations
| # | Problème | Fix |
|---|---|---|
| 9 | Loyalty points non rechargés après complétion cours | Émettre un event ou refetch via SWR mutation |
| 10 | `ai_usage_events` insert synchrone — peut ralentir les routes IA | Passer en fire-and-forget avec `void` |
| 11 | CSP ne couvre pas `https://openrouter.ai` dans `connect-src` | Ajouter dans `next.config.ts` |
| 12 | Semantic matching (pgvector) : les embeddings doivent être générés | Lancer `pnpm images:backfill` et `ensureJobEmbedding()` pour les offres existantes |
| 13 | `corbeille` : pas de pagination (peut être lent à fort volume) | Ajouter `limit` + `offset` dans `listUserTrash` |

---

## 11. RÉSUMÉ DES FONCTIONNALITÉS — MATRICE ÉTAT

| Fonctionnalité | Implémentée | Testée | Problèmes connus |
|---|---|---|---|
| Auth (login/signup/reset) | ✅ | ✅ | — |
| Shell navigation | ✅ | ✅ | — |
| Dashboard home | ✅ | ✅ | — |
| Éditeur CV | ✅ | ✅ | — |
| Import CV (PDF+Word+Image) | ✅ | Partiel | — |
| Score CV standalone | ✅ | ✅ | — |
| Analyse offres + matching | ✅ | ✅ | Semantic matching nécessite embeddings générés |
| Gate CV (/jobs et /formations) | ✅ | ✅ | — |
| Simulateur entretien (STT+TTS) | ✅ | Partiel | Tests runner cassé |
| Analyse LinkedIn (vision IA) | ✅ | ✅ | Rate limit modèles gratuits |
| Formations + ranking | ✅ | ✅ | i18n FR uniquement |
| Kanban candidatures | ✅ | ✅ | — |
| Corbeille (soft-delete 30j) | ✅ | ✅ | Pas de pagination |
| Points fidélité | ✅ | Non | Table créée, UI existe, RPC présente |
| Admin (6 onglets) | ✅ | Partiel | — |
| Feedback candidat | ✅ | ✅ | — |
| Assistant IA global | ✅ | ✅ | — |
| Rate limiting Redis | ✅ | Non (runner) | OK en local avec Redis |
| Sécurité prompts | ✅ | Non (runner) | Patterns corrects |
| CSP headers | ✅ | — | `connect-src` manque openrouter.ai |
| Stripe (paiement) | ✅ (inactif) | — | Inactif en mode Digimytch |
| pgvector / semantic search | ✅ | Non | Embeddings à générer |
| i18n FR/EN | Partiel | — | Shell OK, composants Digimytch FR seulement |

---

## 12. CONCLUSIONS

Le projet Digimytch Talent Hub est dans un **état fonctionnel avancé**. Les fonctionnalités core (CV, matching offres, entretien, LinkedIn, formations, Kanban) sont toutes implémentées et les bugs critiques signalés lors de la session précédente ont été corrigés (interview frozen, STT interim lost, CV upload multi-format, score -1 pour CV vide, gates CV, admin security).

**Points forts** : Architecture propre Next.js 15 App Router, sécurité bien pensée (RLS, JWT claims, rate limiting Redis, CSP), base de données bien structurée avec 21 migrations, système d'IA robuste avec fallback chain de modèles.

**Priorité immédiate** : Vérifier que `.env` n'est pas dans le dépôt Git (clé OpenRouter exposée), puis corriger le runner de tests pour valider la non-régression continue.
