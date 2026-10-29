# CLAUDE.md — Beer Pong Cup

Application de gestion de tournois de beer pong (« pong » / cups), pour le web, iOS et Android.
Le MVP fonctionne **entièrement hors ligne, sans compte ni serveur** : un téléphone gère tout le tournoi.

- Spec des fonctionnalités (MVP / V2) : https://claude.ai/artifact/GLumtjPCE2n9uEEM9AK3eg
- Maquette (mode nuit + mode clair) : https://claude.ai/artifact/UBeXW8uTmeupA7ace9FadR
- Ancienne version Vue 2022, à ne PAS reprendre telle quelle (référence métier uniquement) : https://github.com/nicolas1607/beer_pong_cup_vue

## Stack

- Vue 3 (Composition API, `<script setup lang="ts">`), Vite, TypeScript strict
- Vue Router, Pinia
- Vitest (tests unitaires), ESLint + Oxlint, Prettier
- Capacitor 8 (iOS + Android), `webDir: dist`
- Node 24 (voir `.nvmrc`), npm 11

## Commandes

```bash
npm run dev            # serveur de dev → http://localhost:5173
npm run test:unit      # Vitest en mode watch ; `-- --run` pour une seule passe
npm run build          # type-check (vue-tsc) + build Vite
npm run lint           # oxlint + eslint (avec --fix)
npm run format         # prettier
npm run build && npx cap sync   # copier le build dans les projets natifs
npx cap open ios       # Xcode
npx cap open android   # Android Studio
```

Avant chaque commit : `npm run lint`, `npm run test:unit -- --run`, `npm run build` doivent passer.

## Git

- `main` : version stable uniquement. Jamais de commit direct.
- `dev` : branche d'intégration. Les fonctionnalités y sont fusionnées.
- Une branche par fonctionnalité, créée depuis `dev` : `feat/<nom>`, `fix/<nom>`, `chore/<nom>`. Pull request vers `dev`.
- Messages de commit en français, courts, à l'impératif, préfixés : `feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`.
- Ne jamais `git push --force` sur `main` ou `dev`.

## Architecture

```
src/
  domain/        Logique de tournoi en TypeScript pur — AUCUN import Vue, Pinia ou Capacitor
    types.ts       Team, Player, Match, Tournament, Settings, GameMode…
    roundRobin.ts  génération des matchs de poule + ordre des matchs
    standings.ts   calcul du classement et départages
    bracket.ts     tableau d'élimination directe (têtes de série, exemptés)
    scoring.ts     points par victoire / défaite
    __tests__/     tests Vitest de chaque module
  stores/        Pinia : tournoi en cours, réglages, historique ; appelle domain/
  services/      persistance (interface StorageAdapter : localStorage sur web, @capacitor/preferences sur mobile)
  views/         un fichier par écran (Accueil, Mode, Équipes, Match, Classement, PhaseFinale, Vainqueur, Règles, Réglages)
  components/    composants réutilisables (boutons, cartes d'équipe, compteur de score, barre de navigation…)
  i18n/          textes de l'interface (fr.ts au MVP, structure prête pour en.ts)
  styles/        tokens CSS (thèmes nuit et clair), styles de base
```

Règles :
- Toute règle métier vit dans `src/domain/` sous forme de fonctions pures, testées. Les composants n'implémentent aucune règle de tournoi.
- Pas de manipulation directe du DOM (`document.querySelector`, `innerHTML`…). Tout passe par l'état réactif.
- Pas de `any`. Types explicites pour les données de domaine.
- Pas de dépendance ajoutée sans raison claire ; la mentionner dans la PR.

## Règles métier du MVP

Modes :
1. **Match simple** : un match entre deux équipes.
2. **Poule** : chaque équipe rencontre toutes les autres une fois.
3. **Élimination directe** : tableau à élimination. Si le nombre d'équipes n'est pas une puissance de 2, les meilleures têtes de série sont exemptées du premier tour.
4. **Poule + phase finale** : les N premiers de la poule (2, 4 ou 8) passent en élimination directe.

Détails :
- De **2 à 32 équipes**. Attention : l'ancienne version générait des matchs invalides dès 10 équipes (identifiants concaténés en texte). Utiliser des identifiants stables (`id: string`) et la méthode du cercle pour la poule.
- **Ordre des matchs** : une équipe ne joue pas deux matchs de suite, sauf si c'est inévitable ou si l'utilisateur impose le match.
- L'utilisateur peut **choisir le prochain match**, **tirer un autre match au hasard** (sans reproposer les équipes du match écarté) et **annuler / corriger le dernier match validé**.
- **Format** : équipe contre équipe (EcE) ou 1 contre 1 (JcJ). **Équipes aléatoires** : à partir d'une liste de joueurs, l'app forme des équipes de 2.
- **Score** : nombre de verres touchés par équipe, plafonné au nombre de verres choisi (3, 6, 10 ou 15). Pas de match nul en élimination.
- **Points par victoire** : « écart de verres » (différence de score) ou fixe 1, 3 ou 5. **Points par défaite** : -2, -1, 0 ou 1. Ces réglages doivent réellement s'appliquer au classement.
- **Classement de poule** : points, puis confrontation directe, puis différence de verres, puis verres marqués.
- **Phase finale** : tirage selon le classement (1er contre dernier qualifié, 2e contre avant-dernier…) ou aléatoire.
- **Sauvegarde automatique** de l'état à chaque score validé ; reprise du tournoi en cours à l'ouverture de l'app.
- **Fin de tournoi** : écran vainqueur, « rejouer avec les mêmes équipes », « nouveau tournoi ».
- **Limite gratuite** : 8 équipes. Prévoir un drapeau `isPro` dans les réglages, sans paiement au MVP (achats in-app et pubs viendront plus tard).

## Interface

- Reproduire la maquette (liens en haut). Mobile d'abord (390 px de large), puis web (mise en page fluide, max 1280 px).
- Deux thèmes via variables CSS, appliqués sur `<html data-theme="dark|light">`, par défaut celui du système :
  - **Nuit** : fond `#0D0F14`, surfaces `#171A22` / `#222632`, bordures `#2C3140`, texte `#F4F5F7`, texte secondaire `#A3AAB8`.
  - **Clair** : fond `#F4F5F8`, surfaces `#FFFFFF` / `#EEF0F4`, bordures `#DDE1E8`, texte `#1B2550`, texte secondaire `#56608A`.
  - Accent (boutons principaux) `#FF7A45` avec texte `#1A0E08` ; en clair, accent utilisé comme texte : `#C2410C`.
  - Équipe 2 : bleu `#4C8DFF` (texte `#7FB0FF` en nuit, `#1D5FD6` en clair).
- Polices : **Anton** (titres, scores, boutons principaux, en majuscules) et **Inter** (texte).
- Logo : blanc en mode nuit, orange en mode clair (fichiers dans `src/assets/`).
- Accessibilité : vrais `<button>` / `<a>` / `<input>` + `<label>`, zones tactiles ≥ 44 px, contraste ≥ 4.5:1, `aria-label` sur les boutons-icônes.

## Contenu

- Interface en français ; tous les textes dans `src/i18n/fr.ts`, jamais en dur dans les composants.
- Positionnement « gestionnaire de tournoi » : **aucun texte qui incite à boire** (pas de « shooter », pas de gage alcoolisé). Les stores Apple et Google refusent ce type de contenu.

## Hors périmètre du MVP (ne pas implémenter sans demande)

Bonus & malus, matchs aller-retour, double élimination, barrages / repêchage, petite finale, sablier, plusieurs tables en parallèle, QR code / multi-appareils, comptes, synchronisation en ligne, statistiques et trophées, partage en image, pubs et achats in-app, traduction anglaise.

## Façon de travailler

- Commencer par la logique `src/domain/` avec ses tests, puis les stores, puis les écrans.
- Petites étapes : une fonctionnalité par branche, testée avant d'ouvrir la PR.
- En cas de doute sur une règle métier, demander plutôt que deviner.