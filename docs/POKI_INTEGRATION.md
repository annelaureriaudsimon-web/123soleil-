# Intégration Poki — étape 1 : les fondations (v2.2)

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
| Casier, son, voix, partage, carte, onglets de monde | — | aucun |

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
| Écran de fin : casier, partager, image, 🏠 | aucun |

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
`commercialBreak()` (promesse), `rewardedBreak()` (prête, **pas utilisée** à cette étape), `movePill()`.
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
`movePill(0, 24)`, 46×62 px, **en haut à gauche** (Poki ne documente pas le côté : c'est notre hypothèse,
réglable dans `PILL` de `js/platform/flow.js`). Quand le jeu tourne dans une iframe sur un appareil
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

- `python3 tools/tests/test_poki.py` : 76 vérifications dans un vrai navigateur, avec un faux SDK qui note
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

Astuce : dans la version dev, `index.html?debug=1` montre le même journal directement dans le jeu (en rouge
si quelque chose cloche), et `index.html?debug=1&fakead=1` simule une pub de 2 secondes.
