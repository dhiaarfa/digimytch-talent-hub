# Digimytch Talent Hub — plan d’implémentation (étapes)

Référence : cahier des charges **Digimytch Talent Hub** (PDF remis à l’établissement) et `docs/CAHIER_DES_CHARGES_DIGIMYTCH_FEV2026.md`.

## Étape 0 — Prérequis

1. **Variables d’environnement** : copier `.env.example` vers `.env`.  
   - Mode Digimytch : **par défaut activé** (ne pas définir `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB`, ou tout sauf `0`).  
   - Pour revenir au produit d’origine : `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB=0`.
2. **Supabase** : `pnpm dev` ou stack Docker ; appliquer les migrations (`supabase db push` ou équivalent).
3. Migration **`20260215120000_digimytch_courses_applications.sql`** : tables `courses`, `job_applications`, `job_application_events`, RLS, seed du catalogue.

## Étape 1 — Alignement produit (fait dans le code)

| Livrable CdC | Implémentation |
|--------------|----------------|
| Comptes & auth | Inchangé (Supabase Auth) |
| CV structuré + IA | Flux existant éditeur + `/api/chat` |
| Matching score | `src/lib/matching.ts` + page `/jobs` |
| Formations | Table `courses` + page `/formations` + `rankCoursesBySkillGaps` |
| Candidatures + historique | Tables `job_applications` + `job_application_events` + `/candidatures` |
| Tableau de bord | Cartes sur `/home` + indicateurs existants |
| Hors périmètre (paiement) | `isDigimytchTalentHub()` : pas de paywall, `getSubscriptionPlan` / middleware adaptés |

## Étape 2 — Navigation & marque

- `TalentHubNav` / `TalentHubMobileNav` : `/home`, `/resumes`, `/jobs`, `/formations`, `/candidatures`.
- Logo + footer + métadonnées : `src/lib/app-metadata.ts`, `Logo`, `Footer`, `layout.tsx`.

## Étape 3 — Données & SQL (rapport / UML)

- Documenter le **MCD** : `profiles`, `resumes`, `jobs`, `courses`, `job_applications`, `job_application_events`.
- Joindre dans le rapport des **extraits SQL** (CREATE POLICY, exemples SELECT).

## Étape 4 — Tests & démo

- `pnpm typecheck` ; tests Node : `pnpm test` (incl. `matching.test.ts`).
- Scénario démo : créer CV de base → ajouter offre avec mots-clés → vérifier score sur `/jobs` → `/formations` → « Ajouter aux candidatures » → `/candidatures` et changement de statut.

## Étape 5 — Rapport PFE (Scrum)

- Backlog aligné sur les sprints du cahier des charges (auth/CV → IA → matching → formations → candidatures → durcissement).
- Captures d’écran des pages **Matching**, **Formations**, **Candidatures**.

## Fichiers clés ajoutés ou modifiés

| Fichier | Rôle |
|---------|------|
| `src/lib/digimytch-config.ts` | Feature flag produit |
| `src/lib/matching.ts` | Algorithme de score explicable |
| `src/utils/actions/digimytch/actions.ts` | Données matching + hub formations |
| `src/utils/actions/courses/actions.ts` | Catalogue |
| `src/utils/actions/applications/actions.ts` | CRUD candidatures + événements |
| `supabase/migrations/20260215120000_*.sql` | Schéma PostgreSQL |
| `src/app/(dashboard)/jobs`, `formations`, `candidatures` | Pages MVP |
