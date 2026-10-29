# Maquette — Beer Pong Cup (version minimaliste)

Référence visuelle des écrans du MVP, en **mode clair** (`clair/`) et **mode nuit** (`nuit/`).
Exportée le 2026-10-29 depuis l'outil de maquette claude.ai.

## À lire avant de s'en servir

- Ces fichiers sont une **référence visuelle, pas du code à copier**. Ils utilisent le format de
  l'outil de maquette : `<x-dc>`, `<helmet>`, `<sc-for>`, `{{accent}}`, `support.js`, une classe
  `DCLogic`. Ne pas reprendre ce format dans `src/` : réécrire en composants Vue.
- Ils ne s'ouvrent pas correctement dans un navigateur seul (`support.js` absent). Lire le HTML :
  toutes les couleurs, tailles, espacements et polices sont écrits en clair dans les `style="…"`.
- `{{accent}}` = la couleur d'accent du thème (voir plus bas). Les données affichées (équipes,
  scores) sont des exemples.
- Ce dossier reflète la maquette au moment de l'export. Une fois `src/styles/` écrit, c'est le
  code qui fait foi.

## Écrans

| Fichier | Écran |
| --- | --- |
| `Accueil.dc.html` | Accueil : tournoi en cours, « Nouveau tournoi », « Match simple » |
| `Mode.dc.html` | Étape 1 : nom, mode de jeu, qualifiés, verres, points |
| `Equipes.dc.html` | Étape 2 : EcE / JcJ, équipes aléatoires, liste des équipes |
| `Match.dc.html` | Match en cours : scores, pastilles de verres, +/-, actions, validation |
| `Classement.dc.html` | Classement de poule, ligne de qualification pour la phase finale |
| `Tableau.dc.html` | Phase finale : demi-finales, finale, champion |
| `Vainqueur.dc.html` | Fin de tournoi : champions, podium, rejouer |
| `Web.dc.html` | Version web (1440 px) : match + classement côte à côte |

Mobile : 390 × 844 px. Web : mise en page fluide, conteneur de 1240 px max.

## Thèmes

| Rôle | Clair | Nuit |
| --- | --- | --- |
| Fond | `#F6F4EF` | `#161A17` |
| Texte principal | `#23302A` | `#ECE9E1` |
| Texte secondaire | `#5E6862` | `#A3ABA5` |
| Lignes de séparation | `#E3E0D8` | `#2B312D` |
| Bordure des boutons ronds | `#D6D2C8` | `#3A413C` |
| Accent (vert sauge) : textes, icônes, équipe 1 | `#4E6B55` | `#9DBBA3` |
| Texte sur bouton d'accent | `#FFFFFF` | `#142019` |
| Équipe 2 (terre cuite) | `#A4553A` | `#E08E6D` |
| Survol des liens | `#3B5442` | `#B9D1BE` |

Contrastes vérifiés (WCAG, texte normal ≥ 4.5:1) : accent clair 5.37:1, texte secondaire clair
5.26:1, équipe 2 claire 4.85:1, texte blanc sur accent 5.9:1 ; en nuit, tous entre 6.9:1 et 14.5:1.

Accents alternatifs testés dans la maquette (non retenus) : clair `#2F5D62`, `#7A5C3E`, `#5A4E7A` ;
nuit `#8CC2C7`, `#D2B48C`, `#B7A9DB`.

## Typographie (Google Fonts)

- **Fraunces** (serif) : titres (300, 36–52 px), noms d'équipe (400, 24–32 px), scores
  (300, 84 px mobile / 112 px web), chiffres de classement, mots en italique (« contre »).
- **Inter** (sans-serif) : texte courant 13–15 px ; libellés en capitales 11 px, graisse 600,
  espacement 0.14em.

## Composants récurrents

- Bouton principal : pilule (`border-radius: 999px`), hauteur 54 px, fond accent.
- Bouton secondaire : texte seul, hauteur 48 px.
- Boutons +/- : cercles de 44 px (48 px en web), bordure fine, sans fond.
- Sélecteurs (Top 2/4/8, nombre de verres) : pilules de 40 px, la valeur choisie remplie d'accent.
- Onglets : texte souligné de 2 px en accent.
- Champs : soulignés (bordure basse 1 px), sans cadre.
- Listes et tableaux : lignes séparées par 1 px, pas de cartes ni d'ombres.
- Pastilles de verres (écran Match) : cercles de 12 px, remplis selon le score.
- Navigation du bas : 4 entrées (Accueil, Tournoi, Règles, Réglages), icônes au trait 1.6 px,
  l'entrée active en accent.
- Zones tactiles ≥ 44 px partout.

## Fichiers

- `assets/logo-sauge.png` : logo pour le mode clair (`#4E6B55`).
- `assets/logo-sauge-clair.png` : logo pour le mode nuit (`#9DBBA3`).
