# Mémo PFE — contexte à conserver (instructions cumulées)

Ce fichier résume les contraintes et objectifs exprimés dans les échanges (prompt actuel + précédents). À garder dans le dépôt jusqu’à demande contraire.

## Projet et produit

- Base technique : dépôt **ResumeLM** (Next.js, React, TypeScript, Supabase, IA via APIs).
- Direction : plateforme **Digimytch** orientée **insertion professionnelle** — périmètre **réaliste solo** ; mode produit **`NEXT_PUBLIC_DIGIMYTCH_TALENT_HUB`** : **activé par défaut** dans ce dépôt ; mettre **`=0`** pour retrouver ResumeLM (paywall, branding d’origine).

## Sujet affiné (réalisme + crédibilité fac)

- Intitulé de travail : **CV / profil par IA**, **matching intelligent** (score explicable), **recommandations de formations** (catalogue maîtrisé + écarts de compétences), **suivi des candidatures**.
- À éviter comme cœur du livrable : portail recruteur complet, agrégation massive d’offres externes (Indeed/LinkedIn), marketplace freelance, ML entraîné maison.
- IA : **APIs** (LLM), pas apprentissage machine lourd.

## Narrative pour l’encadrant (cohérente avec envoi « février »)

- Le **cahier des charges** et la fiche sujet peuvent être datés **février 2026** (document entreprise Digimytch).
- En **mai 2026**, le discours est : projet déjà avancé depuis **~3 mois** ; il reste surtout la **finalisation** et surtout le **rapport** + feedback prof sur la **dernière ligne droite**.

## Contrainte temps réel de développement

- L’étudiant peut condenser l’implémentation en **~1 mois ou moins** avec **vibe coding** + outils IA ; l’exigence reste : **système fonctionnel démo soutenance**, périmètre maîtrisé.

## Attentes « type fac » observées (rapports d’exemple)

- Rapport structuré : cadre général, entreprise, existant / problématique, besoins, méthode (**Scrum**), conception (UML), implémentation, tests, conclusion.
- Mots-clés et stack explicites ; méthodologie agile nommée.

## Fichiers associés

- `docs/CAHIER_DES_CHARGES_DIGIMYTCH_FEV2026.md` — version entreprise à transmettre pour relecture.
