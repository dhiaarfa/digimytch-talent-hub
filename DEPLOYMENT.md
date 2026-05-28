# Déploiement GitHub + Vercel + Supabase Cloud

Guide pour publier **Digimytch Talent Hub** sans exposer de secrets.

## Prérequis

- Compte [GitHub](https://github.com)
- Compte [Vercel](https://vercel.com) (plan Hobby suffit pour le PFE)
- Projet [Supabase Cloud](https://supabase.com/dashboard) (gratuit)
- Clé [OpenRouter](https://openrouter.ai/keys) (modèles `:free` possibles)

## 1. Préparer le dépôt Git

```bash
cd digimytch-talent-hub
git init
git add .
git status   # vérifier qu’aucun .env n’apparaît
git commit -m "Initial commit: Digimytch Talent Hub PFE"
```

Créer un dépôt vide sur GitHub, puis :

```bash
git branch -M main
git remote add origin https://github.com/VOTRE_ORG/digimytch-talent-hub.git
git push -u origin main
```

**Ne jamais committer :** `.env`, `.env.local`, clés API, `SUPABASE_SERVICE_ROLE_KEY` en clair dans le code.

## 2. Supabase Cloud (base de données)

1. Créer un projet Supabase (région proche : `eu-west-*` ou `eu-central-*`).
2. **Settings → API** : copier `Project URL`, `anon` et `service_role`.
3. **Authentication → URL Configuration** :
   - Site URL : `https://VOTRE_APP.vercel.app`
   - Redirect URLs :  
     `https://VOTRE_APP.vercel.app/auth/callback`  
     `https://VOTRE_APP.vercel.app/auth/confirm`  
     `https://VOTRE_APP.vercel.app/auth/update-password`
4. Appliquer les migrations SQL du dossier `supabase/migrations/` :
   - **SQL Editor** : exécuter chaque fichier dans l’ordre lexicographique, **ou**
   - CLI : `supabase link` puis `supabase db push`
5. **Storage** : vérifier le bucket `avatars` (migration `20260523000000_avatars_bucket.sql`).
6. Créer un utilisateur admin dans **Authentication → Users** ou utiliser l’inscription puis promouvoir via SQL si besoin.

## 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → sélectionner le repo.
2. Framework : **Next.js** (détecté automatiquement).
3. **Root Directory** : `/` (racine du monorepo).
4. **Install Command** : `corepack enable && pnpm install --frozen-lockfile` (déjà dans `vercel.json`).
5. **Build Command** : `pnpm run build`.
6. **Node.js Version** : 20.x (voir `package.json` → `engines`).

### Variables d’environnement (Production)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL Supabase Cloud |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Service role (serveur uniquement) |
| `NEXT_PUBLIC_SITE_URL` | Oui | URL Vercel **sans** slash final |
| `NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB` | Oui | `1` |
| `OPENROUTER_API_KEY` | Oui | IA (chat, CV, entretien) |
| `AUTO_PRO_SUBSCRIPTION` | PFE | `true` pour démo sans Stripe |
| `STRIPE_SECRET_KEY` | Non* | Si abonnements Stripe actifs |
| `STRIPE_WEBHOOK_SECRET` | Non* | Webhook `/api/webhooks/stripe` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Non* | |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Non* | |
| `UPSTASH_REDIS_REST_URL` | Non | Rate limit multi-instance (sinon mémoire) |
| `UPSTASH_REDIS_REST_TOKEN` | Non | |
| `NEXT_PUBLIC_POSTHOG_KEY` | Non | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Non | Ex. `https://eu.i.posthog.com` |

\* Avec `AUTO_PRO_SUBSCRIPTION=true`, Stripe peut rester vide pour la soutenance.

**Ne pas définir sur Vercel :** `USE_LOCAL_REDIS`, `REDIS_URL`, `SEED_ADMIN_PASSWORD` (local uniquement).

7. Déployer → noter l’URL → mettre à jour `NEXT_PUBLIC_SITE_URL` si besoin → **Redeploy**.

### Webhook Stripe (optionnel)

URL : `https://VOTRE_APP.vercel.app/api/webhooks/stripe`  
Événements : `checkout.session.completed`, `customer.subscription.*`, etc.

## 4. Vérifications post-déploiement

- [ ] Page d’accueil charge sans erreur 500
- [ ] Inscription / connexion (email Supabase)
- [ ] Dashboard CV + matching
- [ ] Assistant IA (avec `OPENROUTER_API_KEY`)
- [ ] Avatar (Storage Supabase)
- [ ] Simulateur d’entretien (micro Chrome ; texte sur Firefox)

## 5. CI GitHub Actions

Le workflow `.github/workflows/ci.yml` exécute à chaque push/PR :

- `typecheck`, `test` (avec `CI_MOCK_AI=1`), `lint`, `build`

Aucune clé OpenRouter réelle n’est requise en CI.

## 6. Dépannage Vercel

| Problème | Piste |
|----------|--------|
| Build échoue Supabase | Variables `NEXT_PUBLIC_SUPABASE_*` manquantes |
| Auth redirect loop | `NEXT_PUBLIC_SITE_URL` ≠ URL Vercel ; URLs Supabase Auth |
| IA 403 / rate limit | `OPENROUTER_API_KEY` ; logs `ai_usage_events` |
| Images Storage 403 | Policies bucket `avatars` + RLS |
| Fonctions API timeout | `maxDuration` dans `vercel.json` / route |

## 7. Commandes utiles

```bash
pnpm run verify          # typecheck + test + lint
pnpm run build           # build production local
vercel link              # lier le projet CLI Vercel
vercel env pull .env.local
```
