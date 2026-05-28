# Digimytch Talent Hub

Plateforme web d'insertion professionnelle — Projet de Fin d'Études (PFE)  
**Mohamed Dhia Arfa** — ISET Sousse, 2025-2026

> Fork technique de [resume-lm](https://github.com/olyaiy/resume-lm). Le produit affiché est **Digimytch Talent Hub**, pas le SaaS ResumeLM d'origine.

## Fonctionnalités

- **CV intelligent** — Éditeur avec assistant IA, export PDF
- **Matching emploi** — Score 0-100, compétences reconnues / manquantes
- **Formations recommandées** — Catalogue Digimytch, recommandations personnalisées
- **Candidatures** — Suivi Kanban avec historique
- **Simulateur d'entretien** — Recruteur IA vocal
- **Assistant global** — Bulle IA sur toute la plateforme
- **Administration** — CRUD formations et import IA (compte admin)

## Stack technique

Next.js 15 · React 19 · TypeScript · Supabase · Tailwind CSS · Vercel AI SDK · OpenRouter

## Installation locale

```bash
cp .env.example .env
# Remplir OPENROUTER_API_KEY et les clés Supabase dans .env
npx pnpm@9 install
npx pnpm@9 supabase:up
npx pnpm@9 supabase:migrate
npx pnpm@9 dev
```

| Service | URL |
|---------|-----|
| Application | http://localhost:3001 |
| Supabase API | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |

**Compte démo :** `admin@admin.com` / `Admin123`

Documentation : [INSTALL-LOCAL.md](./INSTALL-LOCAL.md) · [CONTEXTE-PFE.md](./CONTEXTE-PFE.md)

## Démo soutenance (mode production)

```bash
npx pnpm@9 build
npx pnpm@9 start
```

## GitHub & Vercel

Guide complet : **[DEPLOYMENT.md](./DEPLOYMENT.md)** (Git init, Supabase Cloud, variables Vercel, CI).

Résumé :

1. `git init` → commit → push vers GitHub (`main`)
2. Importer le repo sur [vercel.com](https://vercel.com) (Node 20, `pnpm install`)
3. Variables minimales : Supabase (`NEXT_PUBLIC_*` + `SUPABASE_SERVICE_ROLE_KEY`), `NEXT_PUBLIC_SITE_URL`, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB=1`, `AUTO_PRO_SUBSCRIPTION=true`
4. Migrations SQL : dossier `supabase/migrations/` sur Supabase Cloud

**Note PFE :** la démo locale reste la plus stable pour la soutenance. Vercel fournit une URL publique optionnelle.

## Encadrement

- **Entreprise** : Digimytch — Nour Ben Lazrek (CEO & Founder)
- **Encadrant académique** : ISET Sousse

## Licence

Voir [LICENSE](./LICENSE).
