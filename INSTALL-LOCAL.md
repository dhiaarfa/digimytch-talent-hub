# Digimytch Talent Hub — installation locale

## Emplacement recommandé (disque C)

Le projet a été copié vers :

**`C:\Dev\digimytch-talent-hub`**

Ouvrez ce dossier dans Cursor (pas le dossier sur `E:\`).

```powershell
cd C:\Dev\digimytch-talent-hub
npx pnpm@9 install
npx pnpm@9 supabase:up
npx pnpm@9 supabase:migrate
npx pnpm@9 dev
```

App : http://localhost:3001 — Compte démo : `admin@admin.com` / `Admin123`

## Taille du projet

| Dossier | Rôle |
|---------|------|
| `node_modules` | Dépendances (~680 Mo) — normal, régénéré avec `pnpm install` |
| `.next` | Cache de build Next.js — supprimable, recréé au `dev` / `build` |
| `src` | Code source (~1–2 Mo) |

Pour recopier depuis E: : `powershell -File scripts\copy-to-c-drive.ps1`

## Configuration IA gratuite (fonctions principales)

Une seule clé **OpenRouter** suffit pour la démo PFE (assistant CV, import texte, lettre de motivation, explication Score Bridge).

1. Compte gratuit : https://openrouter.ai/
2. Clé API : https://openrouter.ai/keys
3. Dans `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-votre-cle
```

4. Redémarrer l’app (`dev` ou `start`).

Le mode Digimytch sélectionne par défaut **DeepSeek V3.2 (gratuit)** (`deepseek/deepseek-v3.2:nitro`). Vous pouvez changer le modèle dans le sélecteur en haut du dashboard (badge « gratuit »).

| Fonction | Sans clé IA | Avec OpenRouter |
|----------|-------------|-----------------|
| Score Bridge (score 0–100) | Oui | Oui |
| Kanban candidatures | Oui | Oui |
| Formations / catalogue | Oui | Oui |
| Édition CV manuelle | Oui | Oui |
| Assistant chat éditeur | Non | Oui |
| Import / génération CV IA | Non | Oui |
| Explication IA du matching | Non | Oui |
| Lettre de motivation IA | Non | Oui |

**Alternative (sans `.env`)** : Paramètres → ajouter une clé **OpenRouter** (stockée dans le navigateur) et choisir un modèle gratuit.

**Dépannage** :
- « OpenRouter API key not found » → vérifier `.env`, redémarrer, ou ajouter la clé dans Paramètres.
- Erreur `Could not find the table 'public.ai_usage_events'` → lancer `npx pnpm@9 supabase:migrate` (applique toutes les migrations SQL, dont le journal IA).
- Modèle GPT-5 sélectionné sans clé OpenAI → choisir **DeepSeek V3.2** dans le sélecteur du dashboard.

## Performance

- **Démo fluide** : `npx pnpm@9 build` puis `npx pnpm@9 start` (pas de recompilation à chaque clic).
- **Dev** : la première page peut prendre 1–2 min ; les suivantes sont plus rapides.
- En cas d’erreur de chunk : supprimer `.next` et relancer `dev`.
