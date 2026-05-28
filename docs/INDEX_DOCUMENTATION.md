# Index de la documentation — Digimytch Talent Hub / ResumeLM

**À lire en premier pour Claude (ou tout assistant)** : cet index indique **quel document répond à quelle question**. Ne pas confondre l’**état réel du code** avec le **cahier des charges** ou le **plan d’implémentation**.

| Document | Rôle | Question à laquelle il répond |
|----------|------|------------------------------|
| **[ETAT_REEL_DU_PROJET.md](./ETAT_REEL_DU_PROJET.md)** | **État factuel du dépôt aujourd’hui** | Qu’est-ce qui existe vraiment ? Fichiers, routes, DB, tests, lacunes, dette, comment ça tourne ? |
| [CAHIER_DES_CHARGES_DIGIMYTCH_FEV2026.md](./CAHIER_DES_CHARGES_DIGIMYTCH_FEV2026.md) | Spécification **entreprise / PFE** (fév. 2026) | Que doit livrer le produit « idéal » ? Périmètre MVP, acteurs, contraintes ? |
| [IMPLEMENTATION_DIGIMYTCH_STEPS.md](./IMPLEMENTATION_DIGIMYTCH_STEPS.md) | Plan d’alignement code ↔ CdC | Quelles étapes ont été prévues / marquées « fait » dans le code ? |
| [PFE_CONTEXTE_ET_INSTRUCTIONS.md](./PFE_CONTEXTE_ET_INSTRUCTIONS.md) | Mémo contexte étudiant / narrative | Pourquoi Digimytch ? Quoi éviter ? Comment présenter le PFE ? |

## Règle de lecture

1. **Comprendre le code** → `ETAT_REEL_DU_PROJET.md` + exploration de `src/`.
2. **Comprendre le contrat métier** → `CAHIER_DES_CHARGES_DIGIMYTCH_FEV2026.md`.
3. **Comprendre ce qui a été planifié côté dev** → `IMPLEMENTATION_DIGIMYTCH_STEPS.md`.
4. **Rédiger le rapport PFE** → CdC + `PFE_CONTEXTE_ET_INSTRUCTIONS.md` + captures de l’app réelle.

## Racine du dépôt (hors `docs/`)

| Fichier | Rôle |
|---------|------|
| `CLAUDE.md` | Guide développeur (stack, commandes, architecture ResumeLM) |
| `.cursorrules` | Règles Cursor courtes (Digimytch, port 3001, périmètre PFE) |
| `.cursorignore` | Exclut `node_modules`, `.next`, `.agents`, volumes Docker de l’index Cursor |
| `.env.example` | Variables attendues (Supabase local, IA, Stripe optionnel, Digimytch) |
| `package.json` | Scripts : `dev` (port **3001**), `build`, `test`, `typecheck` |
| `next.config.ts` | Next 15 standalone, images custom loader, pas de MDX |
| `docker/docker-compose.yml` | Stack locale optionnelle (voir `docker/DOCKER.md`) |

## Commandes utiles (état vérifié en local)

```bash
npx pnpm@9 install
npx pnpm@9 dev          # http://localhost:3001
npx pnpm@9 test         # tests unitaires (Node test runner + tsx)
npx pnpm@9 verify       # typecheck + test + lint
npx pnpm@9 exec tsc --noEmit
npx pnpm@9 exec next build
```

Prérequis : **Node ≥ 20**, **Supabase** joignable (`NEXT_PUBLIC_SUPABASE_URL` dans `.env`).
