# Digimytch Talent Hub — contexte complet (reprise conversation)

> Collez ce fichier (ou un extrait) au début d’un nouveau chat Cursor après ouverture de **`C:\Dev\digimytch-talent-hub`**.

**Audit technique (architecture, backend, dette) :** [`docs/AUDIT-TECHNIQUE.md`](docs/AUDIT-TECHNIQUE.md)

## Identité projet

- **Nom produit :** Digimytch Talent Hub (PFE / prototype, pas produit « lancé »)
- **Ancien nom repo :** ResumeLM / resume-lm — renommé en code (`package.json` → `digimytch-talent-hub`)
- **Chemin actif :** `C:\Dev\digimytch-talent-hub`
- **Ancien chemin (à supprimer) :** `E:\DownloadFolder\resume-lm-main\` — quasi tout effacé ; reste peut être verrouillé par Cursor tant que l’ancien workspace E est ouvert
- **Stack :** Next.js 15.1, React 19, Supabase (Docker local), Tailwind, pnpm
- **Mode par défaut :** `isDigimytchTalentHub()` → UI Digimytch, pas le produit SaaS ResumeLM d’origine

## Charte & design system

- **Couleurs :** navy `#030A8C`, magenta `#D10069`, variables CSS dans `src/app/globals.css` (`.btn-digi-primary`, `.digimytch-landing`, glass)
- **Polices :** Space Grotesk + Plus Jakarta Sans (`src/app/layout.tsx`)
- **Logo :** `public/digimytch-logo.png`
- **Métadonnées :** `src/lib/app-metadata.ts` — titre « Digimytch Talent Hub »
- **Landing :** pas de faux témoignages ; bannière type « Prototype PFE »

## Fonctionnalités livrées (9 blocs UX)

1. **Design system** — CSS vars, boutons, shell
2. **Landing complète** — `src/components/landing/talent-hub/*`, `src/app/page.tsx`
3. **Score Bridge** — `/jobs` : `score-gauge`, `skill-pills`, `score-bridge-panel`, `jobs-matching-hub`
4. **Kanban candidatures** — `/candidatures` : `candidatures-kanban.tsx` + `@dnd-kit`
5. **Formations** — filtres + catalogue
6. **Home KPI** — `digimytch-home-stats.tsx`
7. **Shell navigation** — `digimytch-shell.tsx` : sidebar 240px + bottom nav mobile
8. **Helpers UX** — `demo-banner.tsx`, `page-guide.tsx`, `(dashboard)/loading.tsx`
9. **Tunisie** — `src/lib/digimytch-tunisia.ts`, datalist éducation dans `education-form.tsx`

## Performance (déjà appliqué)

- Suppression `console.log` spam dans `middleware.ts` / `src/utils/supabase/middleware.ts`
- Digimytch : skip requêtes subscription lourdes (layout/middleware)
- Home allégée en mode Digimytch (pas d’orbes lourds)
- `React.cache` : `src/lib/digimytch-queries.ts` (`getCachedJobsWithMatch`, `getCachedApplications`)
- Retrait `experimental.turbo` de `next.config.ts`
- **ModelSelector** : import statique + `ClientOnly` (évite ChunkLoadError)
- **Taille disque :** ~682 Mo `node_modules` + cache `.next` supprimable ; `src` ~1–2 Mo — pas de « code dupliqué » massif
- **Dev lent 1ère page :** normal Next.js (1–2 min compile). **Démo fluide :** `pnpm build` puis `pnpm start`

## Bugs corrigés importants

| Problème | Fix |
|----------|-----|
| Lien « Nouveau CV » → `/resumes/new` (404) | `NewResumeButton` + `CreateResumeDialog` sur `resumes/page.tsx` |
| `toast.success` invalide | `toast({ title, description })` dans `create-base-resume-dialog.tsx` |
| Messages erreur CV en anglais | Français + message Supabase réel |
| `node_modules` corrompu | `pnpm install` |
| ChunkLoadError | supprimer `.next`, redémarrer dev ; pas de dynamic import ModelSelector |
| `profile-strength-bar` | `target_role` pas `professional_summary` |
| Migration déjà appliquée | `scripts/apply-digimytch-migration.mjs` tolère « already exists » |

## Quotas / IA

- `assertResumeQuota` **désactivé** si `isDigimytchTalentHub()` — création CV libre en démo
- Clés IA vides dans `.env` → matching/Kanban OK sans IA ; features IA besoin `OPENROUTER_API_KEY` ou Paramètres

## Commandes locales (Windows)

**pnpm pas en PATH global → toujours `npx pnpm@9`**

```powershell
cd C:\Dev\digimytch-talent-hub
npx pnpm@9 supabase:up      # Docker doit tourner
npx pnpm@9 supabase:check
npx pnpm@9 supabase:migrate
npx pnpm@9 dev              # http://localhost:3001
```

**Production locale (rapide pour soutenance) :**

```powershell
npx pnpm@9 build
npx pnpm@9 start
```

**Tests :**

```powershell
npx pnpm@9 typecheck
npx pnpm@9 test             # 45 tests unitaires
node scripts/smoke-local.mjs
```

**Supprimer reste sur E (après ouverture workspace C) :**

```powershell
powershell -ExecutionPolicy Bypass -File C:\Dev\digimytch-talent-hub\scripts\delete-e-project.ps1
```

**Recopier vers C (si besoin) :** `scripts\copy-to-c-drive.ps1`

## URLs & comptes

| Service | URL |
|---------|-----|
| App | http://localhost:3001 |
| Supabase API | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |

- **Compte démo :** `admin@admin.com` / `Admin123`
- **Config :** `.env` (copié sur C), voir `.env.example`

## Fichiers clés

| Zone | Chemins |
|------|---------|
| Config Digimytch | `src/lib/digimytch-config.ts` |
| Layout / theme | `src/app/layout.tsx`, `globals.css` |
| Landing | `src/app/page.tsx`, `src/components/landing/talent-hub/` |
| Shell dashboard | `src/components/dashboard/digimytch-shell.tsx`, `(dashboard)/layout.tsx` |
| Jobs / Score Bridge | `src/app/(dashboard)/jobs/page.tsx`, `src/components/jobs/*` |
| Candidatures | `src/app/(dashboard)/candidatures/page.tsx`, `candidatures-kanban.tsx` |
| Home | `src/app/(dashboard)/home/page.tsx`, `digimytch-home-stats.tsx` |
| CV | `src/app/(dashboard)/resumes/page.tsx`, `new-resume-button.tsx`, `create-base-resume-dialog.tsx` |
| Actions CV | `src/utils/actions/resumes/actions.ts` (`createBaseResume`) |
| Docker | `docker/docker-compose.yml` |
| Install doc | `INSTALL-LOCAL.md` |

## État migration E → C

- **localhost:3001** doit servir **`C:\Dev\digimytch-talent-hub`** (vérifier : process node avec chemin `C:\Dev\...`)
- Cursor : **File → Open Folder** → `C:\Dev\digimytch-talent-hub` pour que le chat suive le bon workspace
- Ancien README racine parle encore ResumeLM (upstream OSS) — le produit affiché est Digimytch

## Tests dernier état connu

- `pnpm typecheck` : OK
- `pnpm test` : **45/45** OK (après ajout `tsx` en devDependency)
- `smoke-local.mjs` : Supabase + login OK ; HTTP app OK si `pnpm dev` lancé

## Pistes non faites / optionnel

- Remplacer entièrement `README.md` par doc Digimytch uniquement
- Renommer références internes `resumelm_checkout` (Stripe, legacy)
- Lazy-load éditeur CV lourd pour perf
- Purger anciens composants landing ResumeLM encore utilisés par `auth/login` si simplification voulue

## Prompt pour nouveau chat Cursor

```
Je travaille sur Digimytch Talent Hub (PFE Tunisie).
Workspace : C:\Dev\digimytch-talent-hub
Lis CONTEXTE-PFE.md et INSTALL-LOCAL.md avant toute modification.
Stack : Next 15, Supabase Docker, pnpm via npx pnpm@9, app :3001.
Continue les optimisations perf et la démo PFE sans réintroduire le branding ResumeLM.
```
