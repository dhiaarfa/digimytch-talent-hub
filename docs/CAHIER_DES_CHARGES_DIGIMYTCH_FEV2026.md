**Réf. interne : DIGI-PFE-2026-02**  
**Version : 1.0**  
**Date : 15 février 2026**  
**Établissement partenaire : Digimytch**  
*Documents à usage interne et académique — proposition de projet de fin d’études*

---

## 1. Contexte et présentation de Digimytch

**Digimytch** est une structure tunisienne orientée services numériques et accompagnement vers l’emploi (orientation, employabilité, visibilité des profils). Dans le cadre de son développement produit, Digimytch souhaite concevoir une **plateforme web intégrée** permettant aux candidats de **structurer et optimiser leur CV**, d’**évaluer la compatibilité** avec des offres ciblées, de **compléter leur profil par des pistes de formation**, et de **suivre leurs démarches de candidature** dans un tableau de bord unique.

L’objectif n’est pas de remplacer les jobboards internationaux, mais de fournir un **outil métier cohérent**, exploitable en démonstration et en usage pilote (école, employabilité, partenaires).

---

## 2. Problématique

Les candidats peinent souvent à :

- adapter leur CV à un poste sans méthode répétable ;
- objectiver la **correspondance** entre leur profil et une offre ;
- identifier des **écarts de compétences** et des **actions de montée en compétences** ;
- centraliser le **suivi** des candidatures (statuts, notes, dates).

Les solutions généralistes manquent de **personnalisation contextualisée** ; Digimytch propose un **parcours guidé** avec **assistance par intelligence artificielle** (APIs) et **règles métier explicites** (matching).

---

## 3. Objectifs du projet

### 3.1 Objectifs fonctionnels

1. **Espace candidat** : inscription, authentification sécurisée, profil et CV structurés (données éditables).
2. **Assistant IA** : suggestion et reformulation de sections de CV ; tonalité professionnelle ; respect des contraintes utilisateur (APIs LLM).
3. **Offres et matching** : saisie ou import d’offres (texte) ; **score de compatibilité** (0–100) avec **décomposition** (compétences reconnues, manquantes, mots-clés) ; liste triée des offres.
4. **Formations** : catalogue **interne Digimytch** (titre, organisme, compétences visées, niveau, lien) ; **recommandations** basées sur les écarts entre profil et offre ou objectif métier.
5. **Candidatures** : association candidat–offre–version de CV ; statuts (ex. enregistrée, envoyée, entretien, refus, acceptation) ; historique et commentaires simples.
6. **Tableau de bord** : indicateurs synthétiques (nombre d’offres suivies, taux de match moyen, formations suggérées).

### 3.2 Objectifs non fonctionnels

- **Sécurité** : isolation des données par utilisateur ; bonnes pratiques d’auth et de session.
- **Performance** : temps de réponse correct pour un usage démo (pas d’exigence industrielle extrême).
- **Évolutivité** : schéma de données et code structurés pour ajouter plus tard un module « employeur » ou des imports d’offres externes.
- **Traçabilité** : journal minimal des actions IA (optionnel mais recommandé pour le rapport).

---

## 4. Périmètre

### 4.1 Inclus (MVP « soutenance »)

- Application web responsive.
- Backend et persistance (base relationnelle).
- IA par **API** pour rédaction / optimisation de contenu et textes explicatifs du matching.
- Matching **hybride** : règles et scores calculés côté serveur + texte explicatif IA optionnel.

### 4.2 Hors périmètre (phase ultérieure / hors contrat initial)

- Portail recruteur complet (publication d’offres côté entreprise, multi-tenant complexe).
- Connexion aux API Indeed / LinkedIn / France Travail (contraintes légales et techniques).
- Moteur de recommandation formation basé sur un catalogue externe non maîtrisé.
- Paiement en ligne et monétisation (sauf besoin explicite ultérieur).

---

## 5. Acteurs

| Acteur | Rôle |
|--------|------|
| **Candidat** | Gère profil, CV, offres, candidatures, consulte scores et formations. |
| **Administrateur Digimytch** (simple) | Gère le catalogue formations et paramètres de démo (optionnel MVP). |
| **Système IA** | Service externe (API) pour génération et reformulation de textes. |

---

## 6. Contraintes techniques proposées

| Couche | Choix indicatif |
|--------|------------------|
| Frontend | **React** (ex. **Next.js**), UI moderne accessible. |
| Backend | **Node.js** (API Routes / server actions) ou équivalent cohérent avec le frontend. |
| Base de données | **SGBD PostgreSQL** ; modèle relationnel décrit en **SQL** (schéma, contraintes, requêtes). L’instance peut être **locale**, **Docker**, ou **hébergée** (une offre managée de type *PostgreSQL as a service* reste du PostgreSQL standard). |
| IA | Fournisseur LLM via **API** (clé sécurisée côté serveur). |

*Validation définitive avec l’encadrant académique.*

---

## 7. Méthodologie et livraisons

**Approche agile — Scrum** (adaptée à une petite équipe ou un binôme ; ici **réalisation principalement individuelle** avec revues régulières).

- **Durée indicative du stage / PFE** : **20 semaines (~5 mois)**.
- **Sprints** : 2 semaines ; livrer un incrément démo à la fin de chaque sprint.
- Livrables : code déployable ou démo locale, documentation utilisateur courte, jeu de données de test, rapport de fin d’études.

### Jalons (indicatif)

| Phase | Contenu |
|-------|---------|
| Sprints 1–2 | Auth, profil, modèle de données CV. |
| Sprints 3–4 | Assistant IA sur sections CV ; export PDF ou équivalent. |
| Sprints 5–6 | Offres, algorithme de score, interface de classement. |
| Sprints 7–8 | Catalogue formations, recommandations liées aux écarts. |
| Sprints 9–10 | Module candidatures, tableau de bord, durcissement et tests. |

---

## 8. Critères d’acceptation (extrait)

- Un candidat peut créer un compte, compléter un CV et recevoir des suggestions IA sur au moins deux sections (ex. expérience, compétences).
- Pour une offre renseignée, le système affiche un **score** et la **liste des éléments** ayant influencé le score.
- Au moins **cinq formations** dans le catalogue peuvent être **recommandées** avec justification liée aux écarts.
- Le candidat peut enregistrer une candidature et modifier son **statut** avec horodatage.

---

## 9. Intitulé proposé pour le rapport / affiche

**« Digimytch Talent Hub — Plateforme web intelligente pour l’optimisation de CV, le matching emploi–profil, la recommandation de formations et le suivi des candidatures. »**

---

## 10. Contacts encadrement

- **Digimytch** — Responsable projet produit : *à compléter*  
- **Institution académique** — Encadrant pédagogique : *à compléter*

---

*Document préparé pour soumission à l’établissement et relecture du professeur encadrant — février 2026.*
