# Intégration Poki — étape 1 : les fondations (v2.2) · étape 2 : corrections et pubs récompensées (v2.3) · étape 3 : écrans, qualité, langues (v2.4)

Ce document est le **plan** écrit avant de coder, puis tenu à jour (v2.2) : chaque moment du jeu, l'événement
SDK envoyé (ou aucun), le schéma des états, les règles de la couche SDK, la pause, l'affichage, le build,
et la liste de tests à faire dans le Poki Inspector (section 10).

Règle de base : **le jeu ne parle jamais directement au SDK**. Tout passe par `js/platform/poki.js`
(`S.Poki`). Et **personne n'appelle `gameplayStart` / `gameplayStop` à la main** : `js/platform/flow.js`
regarde à chaque image (et à chaque transition) si le joueur est *vraiment en train de jouer*, et
n'envoie un événement que quand la réponse change. Un événement ne peut donc jamais partir deux fois.

---

## 1. Quand est-on « en jeu » ?

`S.gameActive()` (js/platform/flow.js) répond **oui** seulement si :

| Mode | En jeu quand… |
|---|---|
| Course infinie et défi du jour | `S.state === 'play'` (la course a démarré sur un appui) |
| Niveaux | `S.Levels.phase === 'play'` (après l'appui sur la carte d'intro, ou après la cinématique du boss) |
| 2 joueurs | `S.duo.phase === 'play'` (après « GO ! » de chaque manche) |

…et jamais si le jeu est en pause, si une pub est en cours (ou demandée), si le casier est ouvert, ou
pendant le chargement. Tout le reste (titre, accueil, carte, carte d'intro, « prêt », cinématique,
ralenti « GRILLÉ », écrans de fin, fin de manche) = **arrêté**.

`S.syncGameplay()` compare cette réponse à l'état mémorisé par la couche SDK et envoie
`gameplayStart()` ou `gameplayStop()` s'il a changé. Elle est appelée à chaque image **et** tout de suite
après chaque appui, pause, reprise ou fin de pub (pas besoin d'attendre l'image suivante, et ça marche
même quand l'onglet est caché et que les images s'arrêtent).

## 2. Tous les moments du jeu, et l'événement envoyé

### Chargement et accueil

| Moment | Ce que voit le joueur | Événement SDK |
|---|---|---|
| Ouverture de la page | Le titre (logo) tout de suite, sans boutons | aucun (`PokiSDK.init()` démarre) |
| `init()` réussit, échoue, ou 2,5 s passent | — | `gameLoadingFinished()` (une seule fois) |
| 1re visite | Directement le niveau 1, en « prêt » (main animée) | aucun |
| Joueur qui revient | Accueil : gros « Continuer – Niveau X » | aucun |
| Casier, son, voix, langue, carte, onglets de monde | — | aucun |

### Mode Niveaux

| Moment | Événement SDK |
|---|---|
| Carte → toucher un niveau → carte d'intro | aucun (« aller de la carte vers un écran de sélection ne compte pas ») |
| « Continuer – Niveau X » (accueil) → carte d'intro | aucun |
| Appui sur la carte d'intro (tap, clic, Espace, Entrée) | **gameplayStart** |
| Boss : appui sur l'intro → cinématique des lunettes (passable) | aucun… puis **gameplayStart** à la fin de la cinématique |
| 1re visite : niveau 1 « prêt » → 1er appui | **gameplayStart** |
| Pause (bouton ⏸, Échap, P, onglet caché, fenêtre quittée) | **gameplayStop** |
| Pause → Reprendre | **commercialBreak** → **gameplayStart** (+ 1 s de grâce, immobile) |
| Pause → Recommencer le niveau | **commercialBreak** → **gameplayStart** (le niveau repart direct) |
| Pause → Carte | aucun (déjà arrêté) |
| Niveau 1 : « OUPS ! » (recul de quelques mètres) | aucun : la partie continue |
| GRILLÉ ! (début du ralenti) | **gameplayStop** |
| Appui pendant le ralenti | ignoré (aucun) |
| Carte de défaite : appui (= Rejouer) | **commercialBreak** → **gameplayStart** |
| Carte de défaite : bouton Carte | aucun |
| Ligne d'arrivée touchée (célébration) | **gameplayStop** |
| Résultats → Suivant | **commercialBreak** → carte d'intro du niveau suivant → appui → **gameplayStart** |
| Résultats → Rejouer | **commercialBreak** → **gameplayStart** |
| Résultats → Carte | aucun |
| 1re visite : fin du niveau 1 → carte d'intro du niveau 2 (automatique) | aucun (pas de pub dans la 1re minute) |
| 1re visite : résultats du niveau 2 → Suivant → présentation de la carte | aucun (on va vers la carte, pas vers le jeu) |
| 🏠 (hors partie : intro, défaite, résultats) → carte | aucun |

### Course infinie

| Moment | Événement SDK |
|---|---|
| Accueil : « Course infinie », ou maintenir sur le décor, ou Espace | **gameplayStart** |
| Pause | **gameplayStop** |
| Pause → Reprendre | **commercialBreak** → **gameplayStart** (+ 1 s de grâce) |
| Pause → Recommencer | **commercialBreak** → **gameplayStart** |
| Pause → Accueil | aucun |
| GRILLÉ ! | **gameplayStop** |
| Écran de fin : appui (= Rejouer) | **commercialBreak** → **gameplayStart** |
| Écran de fin : casier, 🏠 | aucun |

### Défi du jour

| Moment | Événement SDK |
|---|---|
| Accueil : « Défi du jour » | **gameplayStart** (pas de pub avant : une pub ne peut ni coûter ni donner un essai) |
| Pause → Reprendre | **commercialBreak** → **gameplayStart** (l'essai continue, rien n'est recompté) |
| Pause → Abandonner | aucun (l'essai était compté dès le départ, comme avant) |
| GRILLÉ ! | **gameplayStop** |
| Écran de fin : appui → accueil | aucun (il n'y a pas de « Rejouer » dans le défi) |
| Défi déjà joué | l'accueil montre le résultat, rien à lancer : aucun |

### 2 joueurs

| Moment | Événement SDK |
|---|---|
| « 2 joueurs » → manche 1 (2,4 s d'annonce) | aucun… puis **gameplayStart** à « GO ! » |
| Fin de manche (bannière) | **gameplayStop** |
| Manche suivante : « GO ! » | **gameplayStart** |
| Pause → Reprendre | **commercialBreak** → **gameplayStart** |
| Pause → Recommencer | **commercialBreak** → nouvelle partie → **gameplayStart** à « GO ! » |
| Pause → Accueil | aucun |
| Fin du match → Revanche | **commercialBreak** → nouvelle partie → **gameplayStart** à « GO ! » |
| Fin du match → Accueil | aucun |

### Partout

| Moment | Événement SDK |
|---|---|
| Onglet caché / fenêtre quittée **pendant le jeu** | pause automatique → **gameplayStop** (une fois) |
| Retour sur l'onglet | le menu pause attend : Reprendre → **commercialBreak** → **gameplayStart** |
| Onglet caché hors du jeu | aucun (son coupé, c'est tout) |
| Pendant une pub | rien ne bouge, son coupé (effets, musique du boss, voix), clavier et écran bloqués ; tout événement est ignoré (en rouge dans le debug) |
| Double tap très rapide sur Rejouer | un seul `commercialBreak` (le 2e appui est bloqué tant qu'elle n'a pas répondu) |

## 3. Schéma des états

```
 page ──▶ CHARGEMENT (titre) ──init() ou 2,5 s──▶ gameLoadingFinished
                                                     │
                       1re visite ◀──────────────────┴──────────────────▶ joueur connu
                 NIVEAU 1 « prêt » (main)                               ACCUEIL ◀──────────────┐
                          │ 1er appui                       bouton / appui │                    │
                          ▼                                                ▼                    │
              ┌──────────────────────────────── EN JEU ──────────────────────────────┐          │
              │                       gameplayStart (1 seule fois)                    │          │
              └───┬─────────────────────┬─────────────────────────┬──────────────────┘          │
        pause / onglet           grillé │                victoire │                             │
                  ▼                     ▼                         ▼                             │
         PAUSE (stop)           DÉFAITE (stop)            RÉSULTATS (stop) ──Carte/🏠──▶ CARTE ──┘
     Reprendre│Recommencer        Rejouer│                Suivant│Rejouer
              ▼                          ▼                       ▼
      ┌──────────────── commercialBreak() : Poki décide s'il y a une pub ───────────────┐
      │  pub : boucle figée · son coupé (effets + musique + voix) · entrées bloquées      │
      │  après : son rétabli (sauf si le joueur l'avait coupé) · entrées rétablies        │
      └─────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
                         EN JEU (gameplayStart) — après une pause : 1 s de grâce, immobile
                         (Suivant : carte d'intro du niveau d'après, puis gameplayStart à l'appui)
```

## 4. La couche SDK — `js/platform/poki.js`

API (`S.Poki`) : `init()`, `loadingFinished()`, `gameplayStart()`, `gameplayStop()`,
`commercialBreak()` (promesse), `rewardedBreak(taille)` (promesse : `true` seulement si la vidéo a été vue
jusqu'au bout ; utilisée par les boutons 🎬, section 11), `movePill()`.
Lecture : `mode` (`'sdk'` ou `'secours'`), `state` (`'chargement'`, `'arrêté'`, `'en jeu'`, `'pub'`),
`playing`, `busy` (une pause pub est demandée ou en cours).

- **Le SDK** : `https://game-cdn.poki.com/scripts/v2/poki-sdk.js` dans le `<head>`. En dev il est chargé
  en `async` (une page en double-clic hors ligne ne reste pas bloquée) ; dans le build Poki, c'est la
  balise normale, comme le demande Poki.
- **`init()`** n'échoue jamais : SDK présent → `PokiSDK.init()` ; réussite **ou** erreur → on continue.
  Délai max : 2,5 s, puis mode de secours.
- **Mode de secours** (fichier ouvert en double-clic, bloqueur de pub, hors ligne, SDK qui ne répond pas) :
  tout se passe comme si tout allait bien, sans erreur ni attente : `commercialBreak()` répond tout de
  suite, `rewardedBreak()` répond « pas de récompense ».
- **Mémoire de l'état** : `gameplayStart` en jeu, `gameplayStop` arrêté, tout événement pendant une pub
  ou pendant le chargement → **ignoré** (et affiché en rouge dans le debug).
- **`commercialBreak()`** : si on était en jeu, la couche envoie d'abord `gameplayStop` (en rouge dans le
  debug : c'est une erreur du jeu). Pendant la pub (`onStart` du SDK) : boucle figée, son coupé, entrées
  bloquées et relâchées. Délais de sécurité : si la pub n'a pas commencé au bout de 5 s, ou dure plus de
  60 s, on reprend quand même (le jeu ne reste jamais bloqué). Une seule pause pub à la fois : le double
  tap sur Rejouer n'en demande qu'une.
- **Pub en retard (v2.3)** : si le SDK lance quand même la pub APRÈS ces 5 s, alors que le jeu a repris,
  elle passe par-dessus le jeu. La couche fige alors tout (boucle arrêtée, son coupé, entrées bloquées),
  **sans envoyer aucun événement pendant la pub**, et attend que le SDK réponde vraiment. À la fin, le jeu
  se met en **pause** (menu), ce qui envoie `gameplayStop` : le joueur reprend quand il veut. Tant que le SDK
  n'a pas répondu à une demande, aucune nouvelle pub n'est demandée (`P.sdkBusy`).
- **Après la pub** : son rétabli (s'il était coupé par le joueur, il le reste), entrées rétablies **sans
  appui fantôme** (tout est relâché, il faut un nouvel appui), puis le jeu repart et `gameplayStart`.
- **Debug** : `index.html?debug=1` affiche un journal à l'écran (heure, événement) ; les enchaînements
  interdits sont en rouge. `&fakead=1` simule une pub de 2 s en mode de secours. Le fichier
  `js/platform/debug.js` et les lignes marquées `// @debug` sont **retirés du build Poki**.

## 5. La pause

- **Échap** ou **P** : pause / reprise pendant le jeu. Hors du jeu, Échap garde son rôle d'avant
  (carte → accueil, fermer le casier, fin de partie → accueil, niveau hors partie → carte).
- **Bouton ⏸** pendant le jeu, à droite à côté du bouton son (la place du bouton 🗣️, qui revient hors du
  jeu), jamais sous la pilule. En mode Niveaux et en 2 joueurs, il remplace 🏠 pendant la partie (le menu a
  « Carte » ou « Accueil ») : un appui par erreur ne fait plus quitter la partie.
- **Menu** (style du jeu) : Reprendre · Recommencer (le niveau) · Carte (ou Accueil) · Son oui/non.
  Défi du jour : pas de Recommencer (un seul essai) ; « Abandonner » à la place d'« Accueil ».
- **Pause automatique** si l'onglet est caché ou si la fenêtre perd le focus pendant le jeu (pas pendant
  une pub : Poki prend le focus pour la montrer).
- **Reprendre** : `commercialBreak()` puis `gameplayStart()`, puis **1 s de grâce** : le monde reste figé,
  un anneau se remplit, le joueur est immobile (vitesse 0) et ne peut pas être grillé. Les appuis d'avant
  la pause ne comptent plus : pour courir, il faut appuyer (ou maintenir) de nouveau ; on repart à la fin
  de l'anneau.
- **Jamais de défilement de la page** : `preventDefault` sur Espace et les flèches (et Page/Début/Fin),
  écouteur `wheel` en `{ passive: false }` (sauf dans le casier, qui défile à l'intérieur).

## 6. Affichage

Le canvas remplit toute la fenêtre (le jeu se met en page lui-même en portrait et en paysage).
Tailles vérifiées : 640×360, 836×470, 1031×580 (PC sur Poki), 390×844 (téléphone portrait, prioritaire)
et 844×390 (téléphone paysage). Tablette = mobile (contrôles tactiles, main animée).

**Zone protégée de la pilule Poki** (mobile seulement) : Poki la place par défaut en
`movePill(0, 24)`, environ 46×62 px. Poki ne documente pas de quel côté : **c'est un seul réglage**,
`PILL.side` (`'left'` ou `'right'`) dans `js/platform/flow.js` (voir « La pilule : quelle ligne changer »
ci-dessous). Par défaut : à gauche. Quand le jeu tourne dans une iframe sur un appareil
tactile, la zone `x < 56 px, 16 px < y < 96 px` (+ encoche) est laissée libre : les textes du haut à gauche
(distance, barre de progression, place, pastilles de l'accueil, en-tête et onglets de la carte, J1 en
2 joueurs) se décalent de 56 px vers la droite. Aucun bouton n'y est jamais placé (les boutons ronds
sont à droite).

| Élément en haut à gauche | Position normale | Avec la pilule |
|---|---|---|
| Distance (course infinie), record, fantôme | x = 14 | x = 70 |
| Barre de progression, place « 2e/3 » (niveaux) | x = 14 | x = 70 |
| J1 : distance et barre (2 joueurs) | x = 14 | x = 70 |
| Pastilles de l'accueil (`#meta`) | left 10 | left 66 |
| En-tête et onglets des mondes (carte) | x = 6 / 14 | x = 62 / 70 |

**Si la pilule est à droite** (`PILL.side = 'right'`) : rien ne bouge à gauche ; c'est la colonne des
boutons ronds du haut à droite (son, voix/pause, casier, accueil) qui se décale de 56 px vers la gauche
(variable CSS `--pr`), ainsi que tout ce que le canvas dessine en haut à droite (place réservée aux boutons
dans le HUD des niveaux et en 2 joueurs, étoiles de la course, compteur et onglets de la carte, panneau de
fin en paysage). Les deux côtés sont testés (`test_poki.py`, test 16).

### La pilule : quelle ligne changer

1. Dans le Poki Inspector, sur un téléphone (ou en mode tactile), ouvre le jeu avec **`?debug=1&pill=1`**
   à la fin de l'adresse de la version dev : la zone réservée apparaît en **rouge transparent**.
2. Compare avec la vraie pilule de Poki :
   - elle est **dans le rectangle rouge** : rien à faire ;
   - elle est **de l'autre côté** : dans `js/platform/flow.js`, change `side: 'left'` en `side: 'right'`
     (ou l'inverse) dans la ligne `const PILL = { side: 'left', w: 56, top: 16, h: 80 };` ;
   - elle est **plus grande ou plus bas** : augmente `w` (largeur) ou `h` (hauteur).
3. Pour essayer l'autre côté sans toucher au code : `?debug=1&pill=1&pillside=right` (ou `left`).
4. Relance `node tools/build-poki.js` (le réglage de test et le rectangle rouge sont retirés du build).

## 7. Première expérience

- **1re visite** (aucune sauvegarde) : pas de titre, d'accueil ni de carte. Le niveau 1 s'affiche en
  « prêt » : le soleil attend, une main animée appuie (une touche Espace dessinée sur PC). Un appui
  lance la partie.
- **Niveau 1 « Premiers pas »** : départ en douceur. Si le soleil te voit bouger : pas de défaite,
  « OUPS ! », tu recules de 6 m en faisant la toupie, le soleil rigole, et la main montre le doigt qui
  se lève : « LÂCHE ! ». Il faut lâcher pour repartir. Tutoriel visuel, presque sans texte.
- **Après le niveau 1** : petite célébration, puis directement la petite carte d'intro du niveau 2.
- **Après le niveau 2** : écran de résultats, puis Suivant → la carte du monde apparaît avec une petite
  animation de présentation (les niveaux apparaissent un par un, une main montre le niveau 3).
- **Joueur qui revient** : accueil très rapide, gros bouton « Continuer – Niveau X » (un appui), les
  autres modes plus petits.
- Sauvegarde : `soleil.onboard` (0 = jamais joué, 1 = niveau 1 fini, 2 = niveau 2 fini, 3 = carte
  présentée). Les anciennes sauvegardes (record, partie, niveau) passent directement à 3.

## 8. Le build Poki — `node tools/build-poki.js`

Sans dépendance. Il prend les scripts de `index.html` **dans l'ordre**, sauf `js/platform/debug.js`,
retire les lignes marquées `// @debug` (et les blocs `// @debug-start` … `// @debug-end`), les met dans **un seul** `game.js`, copie `css/style.css`, écrit un
`index.html` avec le SDK en `<head>`, puis fait `dist/soleil-poki.zip`. Il n'emporte ni `tools/`, ni
`docs/`, ni `README.md`, `CHANGELOG.md`, `.gitignore`, `.nojekyll`.

Rapport OK / ERREUR : aucune adresse http(s) sauf le SDK · aucun lien sortant (`window.open`, lien
`<a href>` externe, `location.href` vers un autre site) · tous les `localStorage` dans un try/catch ·
aucun `console.log` ni code de debug · taille totale < 8 Mo · chaque JS passe `node --check` · chaque
fichier est entier après le retrait du debug (un commentaire mal fermé avalerait du code sans erreur de syntaxe).

## 9. Ce qui est vérifié automatiquement

- `python3 tools/tests/test_poki.py` : toutes les vérifications de l'étape 1 et de l'étape 2 (corrections et
  pubs récompensées, tests 15 à 24) dans un vrai navigateur, avec un faux SDK qui note
  chaque appel et peut montrer une « pub » (`tools/tests/fake_poki_sdk.js`). Tous les modes et tous les cas
  limites du tableau ci-dessus (ralenti de la défaite, double tap, onglet caché, fenêtre quittée, casier depuis
  l'écran de fin, défi déjà joué, retour à la carte en plein niveau), avec le SDK, sans SDK, avec un bloqueur de
  pub et avec un SDK qui ne répond pas. À la fin, le journal de tous les tests est relu : jamais deux fois le
  même événement de suite, rien pendant une pub, rien avant `gameLoadingFinished`. Le build Poki lui-même
  (`dist/poki`) est aussi lancé dans le navigateur, avec et sans SDK.
- `node tools/build-poki.js` : le rapport du build (section 8).
- `python3 tools/tests/compare_frames.py <v2.1>` : le jeu se dessine exactement comme avant (94/94).

## 10. Tester dans le Poki Inspector (à refaire à chaque build)

1. Lance `node tools/build-poki.js`. Le rapport doit finir par « TOUT EST OK ».
2. Ouvre <https://inspector.poki.dev/> et donne-lui `dist/soleil-poki.zip`. Garde la liste des événements
   SDK ouverte à côté du jeu.
3. **Chargement** : le titre apparaît tout de suite, puis `gameLoadingFinished` une seule fois. Aucun
   `gameplayStart` tant que tu n'as pas touché le jeu.
4. **1re visite** (efface les données du site si besoin) : tu arrives directement dans le niveau 1, la main
   (ou la touche Espace) montre le geste. Appuie : `gameplayStart`.
5. **Niveau 1** : cours pendant que le soleil regarde : « OUPS ! », tu recules, aucun événement. Finis-le :
   `gameplayStop`, puis la petite carte d'intro du niveau 2 (pas de pub). Appuie : `gameplayStart`.
6. **Défaite** (niveau 2) : fais-toi griller. `gameplayStop` dès « GRILLÉ ! ». Touche l'écran pendant le
   ralenti : rien. Puis touche la carte de défaite : `commercialBreak`. Si l'Inspector montre une pub :
   le jeu est figé, sans aucun son ; après la pub, `gameplayStart` et le niveau repart.
7. **Double tap** sur la carte de défaite : un seul `commercialBreak`.
8. **Pause** : bouton ⏸, Échap, puis P. Chaque fois `gameplayStop`, le menu s'affiche, la page ne bouge pas.
   Reprendre : `commercialBreak` puis `gameplayStart`, l'anneau d'une seconde, et tu repars à l'arrêt.
   Recommencer le niveau : `commercialBreak`, `gameplayStart`. Carte : aucun événement.
9. **Résultats** : Suivant → `commercialBreak`, carte d'intro, appui → `gameplayStart`. Rejouer →
   `commercialBreak`, `gameplayStart`. Carte → rien.
10. **Course infinie** : lance-la → `gameplayStart` ; grillé → `gameplayStop` ; appui sur l'écran de fin →
    `commercialBreak`, `gameplayStart`. Ouvre et ferme le casier depuis l'écran de fin : aucun événement.
11. **Défi du jour** : lance-le → `gameplayStart` (pas de pub avant). Pause → Reprendre : l'essai continue.
    Fin → accueil, aucun événement ; le défi est marqué joué et ne se relance pas.
12. **2 joueurs** : rien pendant l'annonce, `gameplayStart` à « GO ! », `gameplayStop` à chaque fin de
    manche ; Revanche → `commercialBreak`.
13. **Onglet** : change d'onglet en pleine partie, reviens : le menu pause attend, un seul `gameplayStop`.
14. **Bloqueur de pub** (si l'Inspector le propose) : le jeu marche pareil, sans aucun message.
15. **Clavier et souris** : Espace, flèches et molette ne font jamais défiler la page.
16. **Tailles** : 640×360, 836×470, 1031×580, puis téléphone en portrait et en paysage. Tout est lisible,
    rien n'est coupé ; sur téléphone, la pilule Poki ne cache aucun bouton ni aucun texte important ; les
    consignes parlent de toucher (téléphone, tablette) ou de clic / Espace (PC).
17. À la fin, relis la liste des événements : jamais deux fois le même de suite, rien pendant une pub.
18. **Pilule** : sur téléphone, avec `?debug=1&pill=1` (version dev), vérifie que la vraie pilule est dans le
    rectangle rouge. Sinon, change `PILL.side` (section 6, « La pilule : quelle ligne changer »).
19. **🎬 2e chance (niveau)** : fais-toi griller au niveau 3. La carte de défaite montre « Réessayer » (vert, à
    gauche, plus large) et « 🎬 2e chance » (violet), avec la phrase « Regarde une courte vidéo… » dessous.
    Appuie sur 🎬 : `rewardedBreak`, la vidéo de l'Inspector se lance, le jeu est figé et muet. Vidéo vue
    jusqu'au bout : tu repars au même endroit, à l'arrêt, avec l'anneau d'une seconde, puis `gameplayStart`.
    Grillé à nouveau dans le même essai : plus de bouton 🎬.
20. **Vidéo fermée avant la fin** (si l'Inspector le permet) : aucune récompense, petit message « Vidéo
    indisponible », « Réessayer » marche toujours.
21. **🎬 Continuer (course infinie)** : même chose sur l'écran de fin (« Rejouer » vert + « 🎬 Continuer »).
    La distance, le record et le fantôme continuent. Pas de bouton 🎬 dans le défi du jour ni en 2 joueurs.
22. **🎬 ×2 ⭐** : gagne un niveau pour la première fois (des ⭐ pour le casier) : « Suivant » (vert) + « 🎬 ×2 ⭐ ».
    Vidéo vue : le nombre double une fois, le bouton devient « ✓ Fait ».
23. **🎬 Essayer une tenue** : casier → touche une tenue que tu n'as pas → fiche avec « Acheter » (vert) et
    « 🎬 Essayer ». Vidéo vue : badge « Essai », tu la portes pendant la prochaine partie (niveau ou course
    libre), puis tu retrouves la tienne avec « Tu l'as aimée ? ».

## 11. Les pubs récompensées (v2.3) — `js/ui/reward.js`

Toutes passent par **un seul composant** : `S.Reward.pairHTML(normal, récompense)` dessine le duo de boutons,
et un seul écouteur gère le clic sur n'importe quel bouton 🎬 (`[data-reward]`).

| Récompense | Où | Quand | Taille | Ce qu'elle donne | Limites |
|---|---|---|---|---|---|
| **2e chance** | carte de défaite d'un niveau ; écran de fin de la course infinie | grillé | `medium` | on reprend là où on a été grillé : à l'arrêt, soleil de dos, nouveau cycle après 1,2 s de pause, 1 s de protection (l'anneau) ; les rivaux continuent | une par essai de niveau, une par partie de course ; jamais : défi du jour, 2 joueurs, niveau 1 en douceur ; ensuite ★★★ impossible (écrit sur les résultats) et pas de meilleur temps |
| **×2 ⭐** | écran de résultats d'un niveau | le niveau vient de rapporter des ⭐ pour le casier | `small` | les ⭐ de CE résultat une 2e fois | une fois par résultat ; jamais : défi du jour, 2 joueurs |
| **Essayer une tenue** | casier → fiche d'une tenue pas encore achetée | quand on veut (sauf pendant un essai en cours) | `small` | la tenue est portée tout de suite, pour la PROCHAINE partie (niveau ou course libre) | jamais enregistrée comme achetée ; oubliée au rechargement ; pas dans le défi du jour ni en 2 joueurs (elle reste en attente) |

**Les règles de Poki, respectées et testées** (`test_poki.py`, tests 19 à 24, mesurées dans le navigateur) :
- un bouton normal **vert** (`.rnorm`) est toujours affiché **en même temps**, **à gauche** du bouton 🎬, **plus
  large et aussi haut** (`flex 1.3` contre `1`) ; le bouton 🎬 (`.rbtn`) est **violet**, jamais vert ;
- l'icône 🎬 (caméra dessinée en SVG, `video` dans `js/ui/icons.js`) et une phrase sous les deux boutons
  (« Regarde une courte vidéo pour… ») préviennent **avant** le clic ;
- la récompense n'est donnée **que si la vidéo a été vue jusqu'au bout** (`true`) ; sinon rien, et au plus un
  petit message neutre « Vidéo indisponible » (jamais de message sur les bloqueurs de pub) ;
- **jamais deux fois** : chaque occasion a un jeton (`revive:niveau:essai`, `revive:run:graine:n°`,
  `double:niveau:essai`) ; un double clic ne lance qu'une vidéo ; un bouton déjà récompensé devient « ✓ Fait » ;
- une seule vidéo par récompense ; aucun minuteur de pubs maison ;
- pendant la vidéo : comme pour `commercialBreak` (boucle figée, tout le son coupé, entrées bloquées et
  relâchées, aucun événement) ; après : aucun appui fantôme ; `gameplayStart` part quand le jeu reprend
  vraiment (2e chance) ;
- **mode de secours** (aucun SDK) : **aucun bouton 🎬** (aucune vidéo possible). En dev, ils apparaissent avec
  `?debug=1&fakead=1` (fausse vidéo de 2 s).

Enchaînement des événements (2e chance) : `gameplayStop` (au « GRILLÉ ! ») → `rewardedBreak` → (pub) →
`gameplayStart` quand le niveau reprend. Les autres récompenses se prennent sur un écran déjà arrêté :
`rewardedBreak` → (pub) → rien d'autre.

```
 Carte de défaite                 Résultats                         Casier : fiche d'une tenue
┌───────────────────────┐   ┌──────────────────────────────┐   ┌────────────────────────────┐
│ [ Réessayer ][🎬 2e   ]│   │ [  ▶ Suivant  ][ 🎬 ×2 ⭐ ]   │   │ [ ⭐ Acheter · 80 ][🎬 Essayer]│
│   vert, large  chance │   │    vert, large   violet       │   │    vert, large     violet   │
│ 🎬 Regarde une courte │   │ 🎬 Regarde une courte vidéo…  │   │ 🎬 Regarde une courte vidéo…│
│    vidéo pour…        │   │ [ Rejouer ][ Carte ]          │   └────────────────────────────┘
│ [ Carte ]             │   └──────────────────────────────┘
└───────────────────────┘
```

Astuce : dans la version dev, `index.html?debug=1` montre le même journal directement dans le jeu (en rouge
si quelque chose cloche), et `index.html?debug=1&fakead=1` simule une pub de 2 secondes.


---

## 12. Étape 3 (v2.4) : grands écrans, qualité, pas fixe, langues, partage retiré

- **Plein écran** : Poki a son propre bouton ; le jeu n'en ajoute pas. Il remplit toujours la fenêtre.
- **Grands écrans** (`js/render/canvas.js`) : `S.uiZoom` = entre 1 et 1,6 selon la fenêtre (`min(largeur/1300, hauteur/760)`,
  arrondi au 0,05), copié dans la variable CSS `--uiz`. Les panneaux (accueil, cartes, fin de partie, pause, casier,
  messages, boutons ronds) ont `zoom: var(--uiz)` ; les distances dessinées dans le canvas près des boutons sont
  multipliées par `S.uiZoom`. Attention : avec `zoom`, `getBoundingClientRect` donne des tailles zoomées, mais une
  position écrite en `left/top` est multipliée par le zoom (`js/ui/toast.js` et `js/ui/over.js` divisent par le zoom).
  Si la fenêtre change de plus de 15 % pendant une partie (plein écran, rotation), le jeu se met en pause.
- **Pas fixe** (`js/main.js`) : le jeu avance par pas de 1/120 s (au plus 12 par image), quelle que soit la vitesse
  de l'écran. Le temps s'arrête pendant une pause, une pub et la seconde de grâce. La simulation et les tests
  utilisent toujours `update(1/60)` directement : ils ne changent pas.
- **Qualité automatique** (`js/render/quality.js`, `S.Q`) : 3 niveaux (résolution 2 / 1,5 / 1, particules, distance
  du décor). Si une image prend plus de 23 ms pendant 1,5 s, on baisse ; moins de 15 ms pendant 8 s, on remonte ;
  4 s au moins entre deux changements, et seulement à un moment calme (jamais pendant que le soleil se retourne,
  regarde ou fait un faux dos). Le réglage du menu pause (Auto / Haute / Basse) est mémorisé.
- **Langues** : `S.LANG`, `L` (un seul objet, rempli par `js/core/i18n-apply.js`, re-rempli par `S.setLang`). Le chant
  vient de `L.chant` (début commun, vrai signal, 12 pièges, Lune) : les listes `SUN_TRAPS` / `MOON_TRAPS` sont
  re-remplies sur place. Aucun texte, aucune durée et aucun dé ne dépend de la langue. Changer de langue n'est possible
  que depuis l'accueil et n'envoie aucun événement au SDK.
- **Partage retiré** : plus de `navigator.share`, de presse-papiers ni d'image à télécharger. `shareableURL` n'est pas
  utilisé.
- **Vitrine** (`js/platform/showcase.js`, dev seulement, retirée par le build) : `?showcase=race&lv=w2-3` ou
  `?showcase=title[&nologo]`, sans interface, pour `tools/thumbnails/make.py`.
- **Envoi à Poki** : tout est dans `docs/POKI_SUBMISSION.md`.
