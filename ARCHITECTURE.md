# Digimytch Talent Hub — Architecture Technique Complète

> Document de référence pour comprendre, présenter et maîtriser le projet.  
> Rédigé pour permettre une soutenance technique devant jury sans assistance IA.

---

## 1. Vue d'ensemble du projet

**Digimytch Talent Hub** est une plateforme web tunisienne d'aide à l'emploi alimentée par l'IA. Elle permet aux candidats de :

- Créer et optimiser leur CV avec l'assistance de l'IA (score ATS, suggestions)
- Simuler des entretiens d'embauche avec un intervieweur IA vocal
- Analyser leur profil LinkedIn
- Suivre leurs candidatures (Kanban)
- Accéder à un catalogue de formations recommandées

**Contexte** : PFE (Projet de Fin d'Études), fork et refonte de ResumeLM (open source) adapté au marché tunisien.

---

## 2. Stack Technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Framework** | Next.js 15 (App Router) | SSR, routing, Server Actions |
| **UI** | React 19 + Tailwind CSS | Composants, styles |
| **Composants** | shadcn/ui + Radix UI | Bibliothèque de composants accessibles |
| **Base de données** | Supabase (PostgreSQL) | BDD + Auth + Storage + Realtime |
| **ORM / Requêtes** | Supabase JS Client | Client BDD typé |
| **IA** | Vercel AI SDK | Abstraction multi-provider |
| **Providers IA** | OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, OpenRouter | Modèles de langage |
| **Paiement** | Stripe | Abonnements Pro |
| **Cache / Rate limiting** | Upstash Redis | Limitation des appels IA |
| **Email** | Resend | Emails transactionnels |
| **Éditeur de texte riche** | TipTap | Sections de CV |
| **PDF** | React-PDF + pdf-parse | Génération et extraction PDF |
| **Déploiement** | Vercel | Hosting + Edge Functions |
| **Package manager** | pnpm | Gestion des dépendances |
| **Typage** | TypeScript 5 (strict) | Sécurité des types |

---

## 3. Architecture — Structure des dossiers

```
digimytch-talent-hub/
│
├── src/                          ← Tout le code source
│   ├── app/                      ← Routes Next.js (App Router)
│   │   ├── (dashboard)/          ← Pages protégées (authentifié requis)
│   │   │   ├── home/             ← Tableau de bord principal
│   │   │   ├── resumes/          ← Gestion des CVs
│   │   │   ├── jobs/             ← Offres d'emploi
│   │   │   ├── candidatures/     ← Suivi des candidatures (Kanban)
│   │   │   ├── entretiens/       ← Simulateur d'entretien IA
│   │   │   ├── score-cv/         ← Score ATS du CV
│   │   │   ├── formations/       ← Catalogue de formations
│   │   │   ├── linkedin/         ← Analyse LinkedIn
│   │   │   ├── profile/          ← Profil utilisateur
│   │   │   ├── settings/         ← Paramètres & clés API
│   │   │   ├── subscription/     ← Abonnement Stripe
│   │   │   ├── admin/            ← Dashboard admin
│   │   │   └── corbeille/        ← Corbeille (soft delete)
│   │   │
│   │   ├── auth/                 ← Authentification
│   │   │   ├── login/            ← Page de connexion
│   │   │   ├── confirm/          ← Confirmation email (OTP)
│   │   │   ├── confirmed/        ← Page post-confirmation
│   │   │   ├── reset-password/   ← Réinitialisation mot de passe
│   │   │   ├── update-password/  ← Mise à jour mot de passe
│   │   │   ├── callback/         ← Callback OAuth (Google, GitHub)
│   │   │   └── signout/          ← Déconnexion
│   │   │
│   │   ├── api/                  ← Routes API (backend Next.js)
│   │   │   ├── assistant/        ← Chat IA global
│   │   │   ├── chat/             ← Chat IA résumé
│   │   │   ├── cv/ats-gap/       ← Analyse écart ATS
│   │   │   ├── extract-cv/       ← Extraction texte CV (PDF/image)
│   │   │   ├── ocr-cv/           ← OCR sur image CV
│   │   │   ├── resume-score/     ← Score ATS du CV
│   │   │   ├── speech/transcribe/← Transcription vocale (STT)
│   │   │   ├── jobs/clip/        ← Extension Chrome (ajout offres)
│   │   │   ├── linkedin-analyze/ ← Analyse profil LinkedIn
│   │   │   ├── openrouter/       ← Vérification capacités modèles
│   │   │   ├── export-resume/    ← Export PDF
│   │   │   └── webhooks/stripe/  ← Webhooks Stripe (paiements)
│   │   │
│   │   ├── page.tsx              ← Landing page publique
│   │   ├── layout.tsx            ← Layout racine (HTML, fonts, providers)
│   │   └── globals.css           ← Styles globaux
│   │
│   ├── components/               ← Composants React réutilisables
│   │   ├── ui/                   ← Composants de base (shadcn/ui)
│   │   ├── auth/                 ← Formulaires d'authentification
│   │   ├── resume/               ← Éditeur + gestion CVs
│   │   │   ├── editor/           ← Éditeur de CV (formulaires, preview)
│   │   │   ├── management/       ← Liste, création, suppression CVs
│   │   │   ├── assistant/        ← Chat IA pour le CV
│   │   │   └── shared/           ← Composants partagés
│   │   ├── digimytch/            ← Fonctionnalités Talent Hub
│   │   ├── interview/            ← Moteur d'entretien IA
│   │   ├── jobs/                 ← Composants offres d'emploi
│   │   ├── dashboard/            ← Shell et navigation
│   │   ├── settings/             ← Paramètres utilisateur
│   │   ├── landing/              ← Landing page
│   │   ├── admin/                ← Dashboard administrateur
│   │   ├── profile/              ← Formulaires profil
│   │   └── layout/               ← Header, footer, navigation
│   │
│   ├── lib/                      ← Logique métier et utilitaires
│   │   ├── types.ts              ← Types TypeScript globaux
│   │   ├── utils.ts              ← Utilitaires généraux (cn, etc.)
│   │   ├── ai-models.ts          ← Config des modèles IA
│   │   ├── prompts.ts            ← Prompts système pour l'IA
│   │   ├── digimytch-config.ts   ← Feature flags (mode Talent Hub, admin)
│   │   ├── site-url.ts           ← URL publique (Vercel/local)
│   │   ├── server-auth.ts        ← Auth côté serveur (cache)
│   │   ├── redis.ts              ← Client Redis (rate limiting)
│   │   ├── rateLimiter.ts        ← Middleware rate limiting IA
│   │   ├── stripe-server.ts      ← Client Stripe
│   │   ├── ai/                   ← Couche IA (access control, usage)
│   │   ├── stripe/               ← Stripe (sync abonnements)
│   │   └── analytics/            ← Événements analytics
│   │
│   ├── utils/                    ← Server Actions (mutations BDD)
│   │   ├── actions/              ← Actions par domaine métier
│   │   │   ├── resumes/          ← CRUD CVs + IA
│   │   │   ├── jobs/             ← CRUD offres + matching IA
│   │   │   ├── profiles/         ← CRUD profil utilisateur
│   │   │   ├── applications/     ← CRUD candidatures
│   │   │   ├── digimytch/        ← Actions Talent Hub (stats, entretien)
│   │   │   ├── stripe/           ← Actions paiement
│   │   │   ├── admin/            ← Actions admin
│   │   │   └── trash/            ← Corbeille (soft delete)
│   │   └── supabase/             ← Clients Supabase (server/client/middleware)
│   │
│   ├── hooks/                    ← Hooks React personnalisés
│   ├── contexts/                 ← Contextes React (navigation guard)
│   ├── middleware.ts             ← Protection des routes (auth)
│   └── types/                    ← Déclarations de types pour libs tiers
│
├── supabase/                     ← Migrations BDD PostgreSQL
│   └── migrations/               ← Historique des changements de schéma
│
├── docker/                       ← Environnement local (dev sans cloud)
│   ├── Dockerfile
│   ├── docker-compose.yml        ← PostgreSQL + Redis + Supabase local
│   └── supabase/                 ← Config Supabase locale
│
├── scripts/                      ← Scripts utilitaires
│   ├── start-dev.ps1             ← Lanceur local Windows (Docker + Next.js)
│   ├── copy-pdf-worker.mjs       ← Copie worker PDF (postinstall)
│   ├── auto-maintain.mjs         ← Maintenance auto avant build
│   └── ...                       ← Vérifications, migrations
│
├── public/                       ← Fichiers statiques
├── chrome-extension/             ← Extension Chrome (clip d'offres)
├── docs/                         ← Documentation du projet
├── content/                      ← Contenu MDX (blog, futur)
│
├── next.config.ts                ← Config Next.js (headers sécu, images)
├── tailwind.config.ts            ← Config Tailwind CSS
├── components.json               ← Config shadcn/ui
├── package.json                  ← Dépendances et scripts
├── tsconfig.json                 ← Config TypeScript (strict)
├── eslint.config.mjs             ← Config ESLint
├── schema.sql                    ← Schéma BDD complet (référence)
└── vercel.json                   ← Config Vercel
```

---

## 4. Base de données — Schéma PostgreSQL

Hébergée sur **Supabase** (PostgreSQL managé). Toutes les tables ont la **Row Level Security (RLS)** activée : chaque utilisateur ne peut accéder qu'à ses propres données.

### Tables principales

#### `profiles`
Informations de base du profil utilisateur.
```sql
id uuid (FK → auth.users)
first_name, last_name, email
phone_number, location, website
linkedin_url, github_url
work_experience  JSONB[]   -- Tableau d'expériences
education        JSONB[]   -- Tableau de formations
skills           JSONB[]   -- Tableau de compétences par catégorie
projects         JSONB[]   -- Projets personnels
certifications   JSONB[]
created_at, updated_at
```

#### `resumes`
CVs créés par l'utilisateur (base ou adaptés à une offre).
```sql
id uuid
user_id uuid (FK → auth.users)
name text                  -- Nom du CV
is_base_resume boolean     -- true = CV de base, false = CV adapté
target_role text           -- Poste visé
job_description text       -- Description du poste (pour adaptation)
-- Mêmes champs JSONB que profiles (work_experience, education, skills...)
ai_customization_prompt text  -- Instructions IA personnalisées
document_settings JSONB    -- Style, police, couleurs
```

#### `jobs`
Offres d'emploi sauvegardées par l'utilisateur.
```sql
id uuid
user_id uuid
company_name, position_title
job_url, description, location
salary_range, keywords text[]
work_location  ENUM('remote','in_person','hybrid')
employment_type ENUM('full_time','part_time','internship','contract')
```

#### `job_applications`
Suivi des candidatures (pipeline Kanban).
```sql
id uuid
user_id uuid
job_id uuid (FK → jobs)
status ENUM('saved','applied','interview','rejected','accepted')
notes text
applied_at timestamp
```

#### `subscriptions`
Abonnements Stripe.
```sql
user_id uuid (PK, FK → auth.users)
stripe_customer_id text
stripe_subscription_id text
subscription_plan ENUM('free','pro')
subscription_status ENUM('active','canceled')
current_period_end timestamp
```

#### `courses`
Catalogue de formations.
```sql
id uuid
title, provider, institution
skills_targeted text[]
level text                 -- 'Débutant','Intermédiaire','Avancé'
url, image_url
is_digimytch boolean       -- Formation interne Digimytch
loyalty_points_reward int  -- Points fidélité
duration_hours int
certificate boolean
```

#### `job_applications` (Kanban)
Candidatures avec statuts : `saved → applied → interview → rejected/accepted`

#### Autres tables
- `ai_usage_events` — Suivi consommation IA par utilisateur
- `stripe_webhook_events` — Idempotence webhooks Stripe
- `candidate_feedback` — Retours utilisateurs
- `loyalty_points` — Programme de fidélité

---

## 5. Authentification

Gérée entièrement par **Supabase Auth** avec cookies HTTP-only.

### Flux de connexion email/mot de passe
```
1. Utilisateur soumet login-form.tsx
2. Server Action (login/actions.ts) appelle supabase.auth.signInWithPassword()
3. Supabase crée une session → cookies sécurisés (access_token + refresh_token)
4. middleware.ts intercepte chaque requête → updateSession() rafraîchit le token
5. Pages protégées vérifient la session → redirect si non authentifié
```

### Flux OAuth (Google / GitHub)
```
1. Clic "Connexion avec Google" → supabase.auth.signInWithOAuth()
2. Redirect vers Google → authentification Google
3. Google redirige vers /auth/callback avec code
4. callback/route.ts échange le code → session Supabase
5. Redirect vers /home
```

### Flux confirmation email
```
1. Inscription → Supabase envoie email avec lien token_hash
2. Clic lien → /auth/confirm?token_hash=xxx&type=email
3. confirm/route.ts appelle supabase.auth.verifyOtp()
4. Si succès → redirect /auth/confirmed (page de succès)
5. Si échec → redirect /auth/login?error=email_confirmation
```

### Protection des routes
`src/middleware.ts` s'exécute sur **toutes les routes** sauf les fichiers statiques et certains endpoints API publics. Il rafraîchit la session et redirige si non authentifié.

---

## 6. Intégration IA

### Architecture multi-provider
Le projet utilise le **Vercel AI SDK** comme couche d'abstraction. On peut changer de provider (OpenAI → Anthropic → Groq, etc.) sans changer le code métier.

```
src/lib/ai-models.ts          ← Définition des modèles disponibles
src/lib/prompts.ts            ← Prompts système (instructions pour l'IA)
src/lib/ai/access-control.ts  ← Vérifie si l'utilisateur peut utiliser l'IA
src/lib/ai/usage-ledger.ts    ← Comptage des tokens utilisés
src/lib/ai/run-tracked-request.ts ← Exécute une requête IA + enregistre usage
src/lib/rateLimiter.ts        ← Rate limiting via Redis (X req/minute)
```

### Fonctionnalités IA

| Fonctionnalité | Route/Action | Modèle typique |
|----------------|-------------|----------------|
| Chat assistant CV | `api/chat/route.ts` | GPT-4o / Claude |
| Génération CV | `utils/actions/resumes/ai.ts` | GPT-4o |
| Score ATS CV | `api/resume-score/route.ts` | GPT-4o mini |
| Analyse écart ATS | `api/cv/ats-gap/route.ts` | GPT-4o |
| Simulateur entretien | `api/assistant/route.ts` | GPT-4o |
| Analyse LinkedIn | `api/linkedin-analyze/route.ts` | Claude |
| Matching emploi | `lib/matching.ts` | Embeddings |
| Transcription voix | `api/speech/transcribe/route.ts` | Whisper |
| Extraction CV | `api/extract-cv/route.ts` | GPT-4o Vision / OCR |

### Contrôle d'accès IA
Les utilisateurs **Free** ont un quota limité d'appels IA par jour. Les utilisateurs **Pro** ont accès illimité. La vérification se fait dans `src/lib/ai/access-control.ts` avant chaque appel.

---

## 7. Simulateur d'entretien IA

Le module le plus complexe du projet. Architecture en machines à états.

```
src/components/interview/
├── InterviewEngine.tsx              ← Composant principal (UI + orchestration)
├── interview-engine-reducer.ts      ← Reducer (machine à états de l'entretien)
├── use-interview-recognition.ts     ← Hook reconnaissance vocale (STT)
├── interview-recognition-lifecycle.ts ← Cycle de vie du micro
└── interview-messages.ts           ← Gestion des messages (historique)

src/lib/
├── interview-simulator.ts           ← Génération des questions/réponses IA
├── interview-demo-profile.ts        ← Profil démo pour test
└── speech-tts.ts                   ← Text-to-Speech (voix IA)
```

### Flux d'un entretien
```
1. Utilisateur clique "Démarrer l'entretien"
2. InterviewEngine charge le profil CV + le job visé
3. IA génère la première question (via api/assistant)
4. TTS convertit la question en audio → joué dans le navigateur
5. Utilisateur parle → STT (Whisper) transcrit sa réponse
6. Réponse envoyée à l'IA → IA génère question suivante
7. Cycle jusqu'à la fin → Rapport de performance généré
```

---

## 8. Abonnement Stripe

```
Utilisateur → Page /subscription → CheckoutSession Stripe
→ Paiement Stripe → Webhook stripe → /api/webhooks/stripe/route.ts
→ Mise à jour table subscriptions → Accès Pro débloqué
```

- **Free** : quota limité d'appels IA, fonctionnalités de base
- **Pro** : IA illimitée, toutes les fonctionnalités

La synchronisation est idempotente via `stripe_webhook_events` (évite les doublons si webhook reçu 2 fois).

---

## 9. Server Actions vs API Routes

**Next.js 15** offre deux façons de gérer la logique serveur :

| | **Server Actions** (`utils/actions/`) | **API Routes** (`app/api/`) |
|--|--------------------------------------|----------------------------|
| Usage | Mutations BDD (CRUD) | Streaming IA, webhooks, upload |
| Appelé depuis | Composants React directement | `fetch()` côté client |
| Auth | Vérifiée dans l'action | Vérifiée dans le handler |
| Exemple | Créer un CV, sauvegarder un profil | Stream de chat IA, webhook Stripe |

**Règle** : mutations simples → Server Actions. Streaming/webhooks → API Routes.

---

## 10. Variables d'environnement

Toutes définies dans `.env` (jamais committé). Voir `.env.example` pour la liste complète.

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l'instance Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase (lecture côté client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase (serveur uniquement) |
| `OPENAI_API_KEY` | Clé OpenAI (GPT-4o, Whisper) |
| `ANTHROPIC_API_KEY` | Clé Anthropic (Claude) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Clé Google (Gemini) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret validation webhooks Stripe |
| `UPSTASH_REDIS_REST_URL` | URL Redis (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Redis |
| `NEXT_PUBLIC_SITE_URL` | URL publique de l'app |
| `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB` | Feature flag mode Talent Hub (défaut: 1) |
| `SEED_ADMIN_EMAIL` | Email de l'administrateur |

---

## 11. Déploiement

### Production (Vercel)
```
git push origin main
→ Vercel détecte le push → Lance pnpm run build
→ Build Next.js → Deploy sur CDN global
→ URL : https://digimytch-talent-hub.vercel.app
```

### Local (avec Docker)
```bash
# 1. Démarrer les services (PostgreSQL + Redis + Supabase local)
scripts/start-dev.ps1     # Windows

# 2. Appliquer les migrations BDD
pnpm run supabase:migrate

# 3. Démarrer le serveur Next.js
pnpm dev                  # http://localhost:3001
```

### Scripts utiles
```bash
pnpm dev              # Serveur de développement (port 3001)
pnpm build            # Build de production
pnpm lint             # Vérification ESLint
pnpm typecheck        # Vérification TypeScript
pnpm test             # Tests unitaires (Jest)
```

---

## 12. Sécurité

| Mesure | Implémentation |
|--------|---------------|
| **Auth** | Supabase JWT (cookies HTTP-only, SameSite) |
| **RLS** | Chaque table PostgreSQL filtre par `user_id = auth.uid()` |
| **Rate limiting** | Redis (Upstash) — limite les appels IA par utilisateur/minute |
| **CSP** | `Content-Security-Policy` stricte dans `next.config.ts` |
| **XSS** | React échappe le HTML par défaut + `html-safety.ts` pour le contenu généré |
| **Prompt injection** | `src/lib/prompt-security.ts` — nettoie les inputs avant envoi à l'IA |
| **Webhooks** | Signature Stripe vérifiée (`STRIPE_WEBHOOK_SECRET`) |
| **Admin** | JWT claim `app_metadata.is_admin` (ne peut pas être forgé par l'utilisateur) |
| **Secrets** | Jamais exposés côté client — uniquement dans Server Actions/API Routes |

---

## 13. Fonctionnalités clés — Résumé

| Page | Ce qu'elle fait |
|------|----------------|
| `/home` | Dashboard : stats, actions rapides, onboarding |
| `/resumes` | Créer/gérer ses CVs (base + adaptés par offre) |
| `/resumes/[id]` | Éditeur de CV avec preview en temps réel + chat IA |
| `/jobs` | Offres d'emploi + score de correspondance IA |
| `/candidatures` | Kanban de suivi (Sauvegardé → Postulé → Entretien → Résultat) |
| `/entretiens` | Simulateur d'entretien vocal avec IA |
| `/score-cv` | Score ATS + analyse des lacunes vs une offre |
| `/formations` | Catalogue de formations recommandées par l'IA |
| `/linkedin` | Analyse et optimisation du profil LinkedIn |
| `/profile` | Profil de base (source pour générer les CVs) |
| `/settings` | Clés API personnelles, prompts IA, sécurité |
| `/subscription` | Abonnement Pro via Stripe |
| `/admin` | Dashboard administrateur (users, stats, contenu) |

---

## 14. Patterns de code importants

### Server Component (défaut en Next.js 15)
```tsx
// src/app/(dashboard)/home/page.tsx
// Pas de 'use client' → s'exécute côté serveur
export default async function HomePage() {
  const user = await getCachedAuthUser();     // Appel BDD côté serveur
  const stats = await getQuickStats(user.id); // Pas de fetch() client
  return <HomeClient stats={stats} />;        // Passe données au client
}
```

### Server Action (mutation BDD)
```ts
// src/utils/actions/resumes/actions.ts
'use server'; // ← Marque la fonction comme action serveur
export async function createResume(data: ResumeData) {
  const supabase = await createClient();
  const { data: resume } = await supabase.from('resumes').insert(data).select().single();
  revalidatePath('/resumes'); // Invalide le cache
  return resume;
}
```

### API Route (streaming IA)
```ts
// src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({ model: openai('gpt-4o'), messages });
  return result.toDataStreamResponse(); // Stream vers le client
}
```

---

*Document généré pour la soutenance PFE Digimytch Talent Hub — Juin 2026*
