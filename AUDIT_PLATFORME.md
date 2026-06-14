# Audit Compétitif Complet — Digimytch Talent Hub
**Date :** Juin 2026 | **Analyste :** Claude (audit interne)

---

## Contexte & Méthodologie

Audit réalisé à partir du code source complet de la plateforme, comparé aux solutions leaders du marché dans trois catégories :

**Plateformes concurrentes analysées :**
- **Teal HQ** — all-in-one job search (resume + tracker + LinkedIn + AI) — le concurrent direct le plus proche
- **Huntr** — Kanban job tracker premium
- **Jobscan** — ATS resume scanner + job match
- **Rezi.ai** — AI resume builder ATS-first
- **Enhancv / Kickresume** — resume builders modernes
- **Careerflow** — LinkedIn optimizer + tracker
- **Google Interview Warmup** — simulateur d'entretien IA gratuit
- **Big Interview** — préparation entretien structurée
- **LinkedIn Jobs** — plateforme de référence
- **Rekrute.com** — job board Tunisie/Maghreb de référence
- **Emploi.tn / Keejob** — job boards tunisiens
- **Resume.io / Zety** — resume builders accessibles

---

## 1. VUE D'ENSEMBLE — Ce que Digimytch fait bien

Avant d'aller dans les failles, voici les vrais points forts :

| Force | Détail |
|---|---|
| **All-in-one local** | Seule plateforme du marché tunisien qui combine CV + matching + LinkedIn + formations + entretien IA dans une seule interface |
| **Score Bridge** | Concept fort : score 0–100 avec compétences reconnues vs manquantes — Jobscan le fait mais pas en arabe/FR local |
| **Simulateur vocal** | Très rare même à l'international. Google Warmup n'a pas de voix réaliste. C'est un différenciateur fort |
| **Kanban applications** | Implémentation propre avec dnd-kit. Huntr est mieux mais payant |
| **Architecture technique** | Next.js 15, RSC, Supabase RLS — stack solide et moderne |
| **Multi-AI** | Support OpenAI + Anthropic + Gemini + DeepSeek + Groq — rare |
| **LinkedIn screenshot analysis** | Approche astucieuse qui contourne l'API LinkedIn fermée |
| **Onboarding progress** | Les 5 étapes guidées sont un bon pattern d'activation |

---

## 2. AUDIT PAR DIMENSION

---

### 2.1 ERGONOMIE

**Benchmark :** Teal HQ — navigation sidebar claire, chaque outil accessible en 1 clic depuis n'importe quelle page. Huntr — sidebar collapsible, shortcuts clavier, filtre rapide sur les cartes Kanban.

**État actuel Digimytch :**

✅ Sidebar avec icônes + labels — lisible  
✅ Home cards avec accès direct aux 5 modules  
❌ **Navigation mobile non optimisée** — sidebar devient une bottom nav mais les cards home prennent trop de place sur petit écran (2 colonnes = cramped sur 375px)  
❌ **Pas de raccourcis clavier** — Teal, Huntr ont Cmd+K (command palette). 0 shortcut ici  
❌ **Pas de fil d'Ariane cohérent** — PageGuide avec "← Tableau de bord" est manuel et pas standardisé partout  
❌ **Ordre du menu sidebar** : "Formations" avant "Candidatures" — l'utilisateur cherche ses candidatures plus souvent que ses formations. L'ordre logique du parcours devrait s'imposer  
❌ **Pas de search globale** — impossible de chercher une offre, un CV ou une candidature depuis n'importe où  
❌ **Le CV builder est "Resumes" dans l'URL** mais "CV" dans l'UI — incohérence mental model  

**À changer :**
- Réordonner la sidebar : Accueil → CV → Offres → Candidatures → Entretiens → LinkedIn → Formations → Paramètres
- Ajouter un Cmd+K / Ctrl+K command palette (au moins pour naviguer entre modules)
- Standardiser les breadcrumbs avec un composant global, pas un prop manuel par page
- Bottom nav mobile : 4 items max (Accueil, Offres, Candidatures, Profil) + menu "Plus" pour le reste

---

### 2.2 DESIGN & ORGANISATION VISUELLE

**Benchmark :** Enhancv — design système cohérent, hiérarchie typographique claire, illustrations custom. Teal — cards avec état visible (progress %, statuts colorés), très lisible à la fois dense et aéré.

**État actuel Digimytch :**

✅ Design system cohérent avec CSS vars (--digi-accent, --digi-navy, --digi-border)  
✅ Gradient bleu-marine → rose/magenta — couleurs différenciantes  
✅ Badges colorés par module sur les Home Cards  
❌ **Landing page : aucune capture d'écran du produit** — Teal, Enhancv, Kickresume montrent immédiatement leur UI. L'utilisateur ne sait pas ce qu'il va trouver à l'intérieur avant de s'inscrire  
❌ **Hero section : texte seul** — "Décrochez votre prochain emploi avec l'IA" + bullets — correct mais générique. Aucune preuve visuelle immédiate  
❌ **Témoignages sans photos ni noms réels** — brise la confiance. Kickresume affiche des vrais utilisateurs avec LinkedIn badge  
❌ **Dashboard home : KPI cards à 0 par défaut** — "0 offres analysées", "0 candidatures actives" — démotivant. Teal affiche un "Get started" contextuel au lieu de 0  
❌ **Icônes Lucide standard** — fonctionnelles mais pas mémorables. Les concurrents utilisent des illustrations légères custom pour chaque module  
❌ **Mode sombre incomplet** — les variables dark existent mais certains composants ont des bg hardcodés `bg-white` qui cassent en dark mode  
❌ **Empty states** : composant `EmptyState` existe mais pas toujours utilisé — certaines pages affichent juste rien quand il n'y a pas de données  

**À améliorer :**
- Ajouter une section "Aperçu produit" sur la landing avec 3-4 screenshots ou un courte vidéo (even a GIF)
- Remplacer les témoignages fictifs par de vrais retours (ou supprimer la section si pas de vrais users encore)
- Dashboard vide → afficher un "plan d'action" au lieu de KPIs à 0 (ex: "Commencez par analyser votre première offre")
- Audit dark mode systématique : remplacer tous les `bg-white` par `bg-[var(--digi-card)]`

---

### 2.3 ATTRACTIVITÉ & PREMIÈRE IMPRESSION

**Benchmark :** Kickresume — landing avec "Your resume in 10 minutes", démo interactive sans inscription, templates visuels. Rezi — score ATS instantané sur la landing pour accrocher.

**État actuel Digimytch :**

✅ Hero bullet points clairs (CV + matching + LinkedIn + entretien)  
✅ CTA "Créer mon profil gratuitement" — friction-free  
❌ **Pas de démo sans inscription** — les plateformes qui convertissent le mieux offrent une démo anonyme (coller un CV et voir le score tout de suite, sans compte). Jobscan le fait. Rezi le fait.  
❌ **Pas de chiffres** dans le hero — "Des milliers de candidats tunisiens ont décroché leur entretien" avec un vrai nombre accroche bien plus que la prose actuelle  
❌ **Pas d'animation dans le hero** — une démo animée (typewriter sur les questions d'entretien, ou le score qui monte) capte l'attention  
❌ **"Digimytch Talent Hub"** — le nom est peu mémorable et "Talent Hub" est générique. Pas critique mais à surveiller  
❌ **Section FAQ** existe mais les questions sont génériques — aucune question sur "Est-ce que ça marche avec Rekrute ?" ou "Est-ce gratuit ?" qui sont les 2 questions #1 d'un candidat tunisien  

**À ajouter :**
- Une "zone de démo publique" sur la landing : input pour coller une URL d'offre → voir un exemple de score (calculé sur un CV fictif). Zéro engagement, résultat immédiat
- Un compteur social : "X offres analysées cette semaine" ou "X entretiens simulés"
- FAQ enrichie avec les vraies questions de l'audience locale

---

### 2.4 EFFICIENCE (Réduire le chemin critique)

**Benchmark :** Teal HQ — depuis la home, tu peux importer ton CV LinkedIn en 1 clic, et il extrait automatiquement toutes tes infos. Jobscan — colle une offre + un CV, score en 15 secondes.

**État actuel Digimytch :**

✅ Score CV : deux modes (import texte + CV existant) — bonne flexibilité  
✅ Job matching : coller une URL ou une description suffit  
❌ **Import LinkedIn bloquant** — l'utilisateur doit CAPTURER son profil LinkedIn en screenshot, puis uploader l'image. C'est 4 étapes trop. Teal HQ auto-importe via l'extension Chrome. Careerflow pareil.  
❌ **Pas d'extension Chrome** — Huntr, Teal, Careerflow ont tous une extension qui capture les offres LinkedIn en 1 clic depuis le navigateur. C'est LE raccourci qui change tout pour l'engagement quotidien  
❌ **Ajouter une offre = copier-coller manuel** — l'utilisateur doit ouvrir Rekrute, copier la description, revenir dans Digimytch, coller. Une extension ou un bookmarklet supprimerait cette friction  
❌ **Pas de raccourci "Analyser cette offre depuis ma liste"** — une fois que tu as analysé une offre (Jobs), tu ne peux pas directement la glisser en "Candidature". Les deux modules ne se parlent pas  
❌ **Score CV sans comparaison** — tu analyses le CV mais tu ne vois pas "avant/après" ni d'évolution dans le temps  
❌ **Formations** non linkées aux vraies plateformes — si Digimytch recommande "Apprendre React", l'utilisateur devrait pouvoir cliquer et aller directement sur Udemy/Coursera avec le bon cours  

**À ajouter :**
- Extension Chrome Digimytch : "Analyser cette offre" en 1 clic depuis LinkedIn / Rekrute
- Bouton "Ajouter aux candidatures" directement depuis la fiche offre analysée (Jobs → Candidatures en 1 clic)
- Historique des scores CV : graphique montrant l'évolution du score sur les dernières analyses
- Liens directs vers Coursera/Udemy/YouTube dans les formations recommandées

---

### 2.5 UX — FLUX UTILISATEUR

**Benchmark :** Teal HQ — le parcours complet (import CV → match offre → postuler → préparer entretien) est un seul flow guidé. Chaque étape propose la suivante.

**État actuel Digimytch :**

✅ Onboarding en 5 étapes avec progress bar — bon pattern  
✅ PageGuide avec steps collapsibles sur chaque page  
✅ Home cards avec descriptions des modules  
❌ **Les modules sont des îles** — finir une analyse d'offre ne propose pas de générer une lettre de motivation. Finir le score CV ne propose pas d'aller matcher des offres. Les transitions inter-modules sont absentes  
❌ **Pas de notifications / rappels** — si tu as un entretien dans 3 jours dans ton Kanban, aucun rappel. Huntr envoie des mails. Teal aussi.  
❌ **Pas de vue d'ensemble du pipeline** — l'utilisateur ne peut pas voir en un coup d'œil "j'ai 3 offres à 70%+ de match, 2 candidatures en attente, 1 entretien demain". Il doit naviguer entre 3 pages  
❌ **Guiding path** : après onboarding complet (5 étapes done), plus rien. L'utilisateur est livré à lui-même  
❌ **Lettre de motivation** : mentionnée dans la landing ET dans le flow "05" des steps mais pas visible dans la sidebar ni comme module standalone — confusion  

**À changer :**
- CTA contextuel après chaque action : "Score CV analysé → Voulez-vous maintenant matcher cette offre ?" avec un bouton
- Ajouter une "Vue Pipeline" dans la home : résumé visuel des offres en cours + statuts candidatures + prochain entretien
- Rendre la lettre de motivation accessible depuis la sidebar (ou l'intégrer clairement dans le parcours offre → lettre → postuler)
- Email de rappel automatique 24h avant un entretien Kanban (via Supabase Edge Functions + Resend)

---

### 2.6 UNDERSTANDABILITY (Lisibilité & Compréhension)

**Benchmark :** Teal explique chaque métrique avec un tooltip. Rezi a une sidebar "Why this matters" pour chaque suggestion ATS.

**État actuel Digimytch :**

✅ PageGuide avec steps expliqués par page  
✅ Badges descriptifs sur les home cards  
✅ La landing explique les 5 étapes clairement  
❌ **Score 0–100 sans explication du calcul** — l'utilisateur voit "67/100" mais ne comprend pas pourquoi. Jobscan explique exactement : "Titre de poste : match / Expérience : 2/5 mots-clés détectés". Il faut un breakdown visible  
❌ **"Score Bridge"** — le nom est interne et ne dit rien à l'utilisateur lambda. "Compatibilité avec l'offre" ou "Analyse d'adéquation" serait plus clair  
❌ **ATS Gap Analyzer** — terme technique. L'utilisateur de base ne sait pas ce qu'est un ATS  
❌ **"Semantic matching" toggle** dans Jobs — aucune explication de ce que ça change  
❌ **LinkedIn score** sans contexte : "Score 61/100 — À améliorer" mais pas de benchmark ("Les profils qui décrochent des entretiens ont en moyenne 75+")  
❌ **Formations** : la page affiche des formations mais sans expliquer POURQUOI elles sont recommandées (quelle compétence manquante les a déclenchées)  

**À améliorer :**
- Score détaillé : breakdown visuel du score par catégorie (titre, compétences, expérience, format)
- Renommer "Score Bridge" → "Analyse de compatibilité" dans l'UI (garder le nom interne si besoin)
- Tooltips sur tous les termes techniques (ATS, semantic matching, etc.)
- Formations : afficher "Recommandé car il vous manque : React, TypeScript" avant chaque formation

---

### 2.7 NEED ANSWERING (Les vrais besoins non couverts)

Ce sont les besoins qu'expriment les candidats tunisiens qui ne sont pas encore adressés :

| Besoin | Urgence | Ce que font les concurrents |
|---|---|---|
| "Où sont les offres d'emploi ?" | 🔴 Critique | LinkedIn, Rekrute, Indeed ont un moteur de recherche intégré. Digimytch n'en a pas — l'utilisateur cherche ailleurs puis revient coller |
| "Combien je vaux ?" | 🟠 Important | LinkedIn Salary, Glassdoor, Payscale donnent des benchmarks salariaux. Rien ici |
| "Je veux qu'on me contacte" | 🟠 Important | LinkedIn et Rekrute ont un profil public searchable par les recruteurs. Digimytch n'a pas de profil public |
| "Comment préparer cet entretien spécifique ?" | 🟡 Utile | Big Interview a une base de questions par secteur. Warmup Google a des thèmes. Ici : entretien générique |
| "Je veux relire ma progression" | 🟡 Utile | Journal de candidature, historique des scores — absent |
| "Quelqu'un peut relire mon CV ?" | 🟡 Utile | Enhancv a un CV review par un expert humain payant. Même optionnel ce serait une upsell forte |
| "Je cherche en anglais pour l'international" | 🟡 Utile | L'UI est bi-langue (FR/EN) mais le contenu est franco-centré (offres, formations) |
| "Je veux postuler directement d'ici" | 🔴 Critique | Teal HQ a un "1-click apply". L'utilisateur sort de Digimytch pour postuler — friction maximale |

---

### 2.8 FACILITÉ D'UTILISATION (Ease of Use)

**Benchmark :** Rezi — zero-configuration, score visible en 30 secondes sans créer de compte. Kickresume — template picker visuel en 3 clics.

**État actuel Digimytch :**

✅ Inscription simple (email/GitHub)  
✅ Onboarding guidé dès la première connexion  
❌ **Time-to-value trop long** — la première valeur concrète (voir son score d'adéquation) nécessite : créer un compte → remplir un profil → créer un CV → aller dans Jobs → coller une offre → attendre l'analyse. C'est 6+ étapes. Jobscan fait ça en 2 (coller CV + offre, sans compte)  
❌ **Profil obligatoire avant tout** — impossible d'analyser une offre ou un CV sans profil complet. Bloquer l'utilisateur au départ avant qu'il ait vu la valeur réduit la conversion  
❌ **Import CV externe** : mode "import texte" existe pour Score CV mais pas pour créer son profil — l'utilisateur doit remplir tout à la main alors qu'il a déjà un CV Word/PDF  
❌ **LinkedIn analyzer : upload screenshot** — le flux le plus compliqué de la plateforme. Faire une capture d'écran nécessite de savoir comment, puis uploader. Beaucoup abandonnent ici  
❌ **Simulateur d'entretien** : l'utilisateur doit choisir un scénario, configurer le micro, comprendre le mode vocal — pas de "Quick start" avec un scénario par défaut  

**À changer :**
- Permettre une première analyse d'offre SANS profil complet (mode "invité") pour montrer la valeur immédiatement
- Import PDF/Word pour créer le profil directement (parse automatique)
- LinkedIn : ajouter une alternative "Collez l'URL de votre profil LinkedIn public" (scraping possible côté serveur pour les profils publics)
- Entretien : bouton "Entretien rapide" (scénario pré-sélectionné, démarrage en 1 clic, sans config)

---

## 3. BILAN PAR MODULE

---

### MODULE : Score CV

| Aspect | Note | Commentaire |
|---|---|---|
| Valeur core | ⭐⭐⭐⭐⭐ | Excellent — deux modes (import/existant), analyse ATS réelle |
| UX du flux | ⭐⭐⭐ | Correct mais trop linéaire — pas d'historique des analyses |
| Lisibilité du résultat | ⭐⭐⭐ | Le score brut est donné mais le breakdown n'est pas assez visuel |

**À ajouter :**
- Graphique radar : Format / Compétences / Mots-clés / Expérience / Éducation
- Historique des 10 dernières analyses avec évolution du score
- Bouton "Exporter le rapport PDF" (très demandé — candidats veulent un document à montrer)
- Comparaison CV A vs CV B côte à côte

---

### MODULE : Jobs (Matching)

| Aspect | Note | Commentaire |
|---|---|---|
| Valeur core | ⭐⭐⭐⭐⭐ | Score 0–100 + skill gaps — différenciateur fort |
| Friction d'entrée | ⭐⭐ | Copier-coller manuel depuis Rekrute/LinkedIn |
| Catalogue interne | ⭐⭐⭐ | Existe (PlatformJobsCatalog) mais couverture limitée |

**À ajouter :**
- Extension Chrome : "Analyser avec Digimytch" directement depuis Rekrute/LinkedIn
- Bouton "→ Générer la lettre de motivation" après l'analyse (lien direct)
- Bouton "→ Ajouter aux candidatures" après l'analyse (lien direct)
- Alertes offres : l'utilisateur définit des critères, Digimytch envoie un email quand une offre du catalogue match > 70%

---

### MODULE : Candidatures (Kanban)

| Aspect | Note | Commentaire |
|---|---|---|
| Valeur core | ⭐⭐⭐⭐ | Bon Kanban drag-and-drop |
| Fonctionnalités vs Huntr | ⭐⭐ | Huntr a : contacts RH, documents par candidature, rappels, notes, historique |
| Engagement | ⭐⭐ | Aucun rappel ou notification |

**À ajouter :**
- Notes par candidature (textarea rapide dans la card)
- Date de suivi avec reminder email automatique ("Relancer dans 7 jours ?")
- Lien vers l'offre originale sur chaque card
- Statistiques : taux de transformation par étape (graphique en funnel)
- Colonne "Refusé" avec feedback optionnel (pour analyser pourquoi)

---

### MODULE : Entretiens (Simulateur IA)

| Aspect | Note | Commentaire |
|---|---|---|
| Valeur core | ⭐⭐⭐⭐⭐ | Unique sur le marché tunisien. Différenciateur absolu |
| Qualité de la voix | ⭐⭐⭐⭐ | Améliorée (rate 1.1, pitch 1.0) — naturelle |
| Profondeur | ⭐⭐⭐ | 8 questions max, générique sans offre ciblée |
| Débrief | ⭐⭐⭐⭐ | Bilan structuré amélioré — bien |

**À ajouter :**
- Mode "Entretien ciblé" : lier directement à une offre analysée (les questions viennent du JD)
- Questions par secteur : Tech, Finance, Marketing, RH, Ingénierie, Santé...
- Banque de questions préparées (l'utilisateur peut s'entraîner sur des questions spécifiques)
- Enregistrement audio optionnel de l'entretien pour se réécouter
- Évaluation de la communication : longueur des réponses, mots de remplissage ("euh", "bon"), confiance détectée
- Export PDF du débrief

---

### MODULE : LinkedIn Analyzer

| Aspect | Note | Commentaire |
|---|---|---|
| Valeur core | ⭐⭐⭐⭐ | Score + recommendations — utile |
| Friction d'entrée | ⭐ | Screenshot upload = frein majeur |
| Alternative | ⭐⭐ | Aucune fallback si screenshot trop petit ou coupé |

**À améliorer :**
- Alternative URL publique : l'utilisateur colle son URL LinkedIn et on scrape les données publiques (nom, titre, résumé, expériences) — techniquement faisable avec un headless browser côté serveur
- Guide visuel "Comment faire une bonne capture" avec flèches et exemples
- Recommandations avec des modèles : "Remplacez votre titre par : '[Poste] | [Compétence clé] | [Résultat]'"

---

### MODULE : Formations

| Aspect | Note | Commentaire |
|---|---|---|
| Valeur core | ⭐⭐⭐ | Catalogue recommandé — logique si bien lié aux skill gaps |
| Intégration | ⭐⭐ | Lien non clair entre "lacunes détectées dans Jobs" et formations affichées |
| Contenu | ⭐⭐ | Catalogue interne Digimytch uniquement — pas de Coursera/YouTube |

**À améliorer :**
- Lier chaque formation à la compétence manquante qui l'a déclenchée ("Recommandé car votre offre demande React — vous n'avez pas mentionné React dans votre CV")
- Partenariats : liens directs vers Coursera, Udemy, LinkedIn Learning, YouTube avec tracking d'affiliation
- Progression : cocher "En cours" / "Terminé" avec badge de complétion

---

### MODULE : Landing Page

| Aspect | Note | Commentaire |
|---|---|---|
| Message | ⭐⭐⭐⭐ | Clair et localisé (Tunisie + international) |
| Preuve visuelle | ⭐ | Aucune capture du produit |
| Conversion | ⭐⭐⭐ | CTA correct mais pas de démo sans friction |
| Crédibilité | ⭐⭐ | Témoignages génériques, pas de chiffres réels |

**À refaire :**
- Section "Aperçu produit" : 3 screenshots animés (dashboard, score CV, simulateur d'entretien)
- Compteur live ou figé : "X profils créés — X offres analysées ce mois"
- Démo publique : coller une offre dans la landing → voir un exemple de score instantané (CV fictif exemple)
- Témoignages : vrais utilisateurs ou supprimer la section

---

## 4. CE QU'IL FAUT SUPPRIMER / SIMPLIFIER

| Élément | Raison |
|---|---|
| **KPI cards à 0** sur la home | Démotivant. Remplacer par un "next action" contextuel pour les nouveaux |
| **Le terme "Score Bridge"** dans l'UI visible | Jargon interne — utiliser "Compatibilité" ou "Analyse d'adéquation" |
| **"ATS Gap Analyzer"** comme label UI | Incompréhensible pour 90% des utilisateurs. "Compétences manquantes" suffit |
| **Les 3 étapes numérotées dans Jobs** (header) | Répétitif avec PageGuide — double explication qui allonge la page |
| **LoyaltyPointsBadge** | Peu de contexte sur ce que ça apporte — à intégrer dans un vrai système de gamification ou supprimer |

---

## 5. CE QU'IL FAUT AJOUTER (par priorité)

### 🔴 Critique (impact direct sur l'engagement et la rétention)

1. **Extension Chrome** : "Analyser avec Digimytch" sur LinkedIn + Rekrute
2. **Time-to-value raccourci** : analyse d'offre possible sans profil complet (mode démo)
3. **Import PDF/Word** pour créer le profil (au lieu de tout saisir à la main)
4. **Liens inter-modules** : après chaque action, proposer l'étape suivante logique
5. **Vue Pipeline home** : résumé compact de tout le pipeline (offres, candidatures, prochain entretien)

### 🟠 Important (différenciation et rétention)

6. **Notifications / rappels** par email : entretien demain, candidature sans nouvelles depuis 7j
7. **Historique des scores CV** avec graphique d'évolution
8. **Entretien ciblé** : lier le simulateur à une offre analysée pour des questions spécifiques au JD
9. **Export PDF** du score CV et du débrief d'entretien
10. **Notes par candidature** dans le Kanban
11. **Formations liées aux lacunes** visibles (explication du pourquoi)

### 🟡 Utile (enrichissement moyen terme)

12. **Démo publique** sur la landing (score sur CV fictif sans inscription)
13. **Benchmarks salariaux** par poste en Tunisie (Glassdoor-like)
14. **Questions d'entretien par secteur** dans le simulateur
15. **Alternative URL LinkedIn** (vs screenshot upload)
16. **Colonne "Refusé"** dans le Kanban avec feedback
17. **Statistiques candidatures** : funnel de conversion par étape
18. **Compteur social** sur la landing
19. **Cmd+K** command palette pour naviguer rapidement
20. **Mode "Profil public"** pour être trouvé par les recruteurs Digimytch

---

## 6. COMPARAISON SYNTHÉTIQUE

| Fonctionnalité | Digimytch | Teal HQ | Huntr | Jobscan | Rezi | Rekrute |
|---|---|---|---|---|---|---|
| CV builder IA | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Match offre + score | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Kanban candidatures | ✅ | ✅ | ✅✅ | ❌ | ❌ | ❌ |
| Simulateur entretien vocal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| LinkedIn optimizer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Extension Chrome | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Import LinkedIn auto | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offres d'emploi intégrées | ❌ | ❌ | ❌ | ❌ | ❌ | ✅✅ |
| Rappels / notifications | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export PDF rapport | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Formations recommandées | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Historique scores | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Market focus Tunisie | ✅✅ | ❌ | ❌ | ❌ | ❌ | ✅✅ |
| Gratuit sans CB | ✅ | ✅ (limité) | ✅ (limité) | ✅ (limité) | ✅ (limité) | ✅ |

---

## 7. RECOMMANDATIONS STRATÉGIQUES

### Court terme (0–3 mois) — Quick wins à fort impact

1. **Lier les modules entre eux** — le changement le plus rapide et le plus fort sur l'UX. CTA "→ Générer la lettre", "→ Ajouter en candidature", "→ Préparer l'entretien" après chaque analyse
2. **Refaire la home pour les nouveaux utilisateurs** — si 0 data : afficher un "quick start" au lieu de KPIs à 0
3. **Démo publique minimale sur la landing** — même un score exemple sur une offre fictive suffit à convaincre
4. **Export PDF du débrief et du score CV** — fonctionnalité la plus demandée à ce stade du marché
5. **Email de rappel Kanban** — configurable par l'utilisateur

### Moyen terme (3–6 mois) — Fonctionnalités différenciantes

6. **Extension Chrome** — c'est ce qui fait que les utilisateurs reviennent chaque jour
7. **Import PDF → profil auto** — réduit drastiquement le temps d'activation
8. **Entretien ciblé sur offre** — combine les deux modules les plus forts
9. **Historique des scores** — crée de la rétention (l'utilisateur veut voir sa progression)

### Long terme (6–12 mois) — Vision plateforme

10. **Profil public / vitrine candidat** — ouverture aux recruteurs, monétisation B2B possible
11. **Job board intégré** — partenariat avec Rekrute, Emploi.tn, ou scraping avec permission
12. **Benchmarks salariaux Tunisie** — donnée rare et très demandée, crée un effet réseau
13. **Version mobile native** (PWA au minimum) — 70%+ des candidats tunisiens cherchent emploi sur mobile

---

## 8. CONCLUSION

Digimytch Talent Hub est **la plateforme career la plus complète du marché tunisien** — aucun concurrent local n'a cette combinaison de modules. Techniquement, la base est saine.

Les deux failles majeures qui freinent la croissance :

**Faille 1 — Friction trop haute pour voir la valeur** : l'utilisateur doit trop investir (remplir le profil, créer un CV) avant de voir le résultat. La valeur doit être accessible en 2 minutes maximum.

**Faille 2 — Les modules sont des silos** : ils ne se parlent pas. L'utilisateur qui finit une analyse d'offre ne sait pas qu'il peut générer une lettre de motivation, préparer l'entretien ou suivre sa candidature. Chaque module doit proposer les deux suivants.

Résoudre ces deux points (sans rien ajouter) ferait déjà un bond significatif sur les métriques d'activation et de rétention.

---

*Audit généré sur la base du code source complet de Digimytch Talent Hub (juin 2026) + analyse comparative des solutions concurrentes.*
