# 1, 2, 3… SOLEIL ! — v2.5.1

Maintiens pour courir vers le soleil. Il compte « 1… 2… 3… » puis dit un mot : si c'est « SOLEIL ! », lâche avant qu'il se retourne. S'il te voit bouger, tu es **GRILLÉ**.

**▶ Jouer en ligne : https://annelaureriaudsimon-web.github.io/123soleil-/**

Le jeu se joue en **niveaux**, avec d'autres enfants qui courent contre toi :
- **Monde 1, « La cour de récré »** : 8 niveaux, dont le boss « Le Soleil Cool » 😎.
- **Monde 2, « Le parc »** (12 ★ du monde 1 pour l'ouvrir) : 8 niveaux, dont le boss « Le Soleil Farceur » 🤡. Pendant qu'il te regarde, le soleil essaie de te faire bouger : étoile tentatrice, faux retour, éternuement, moqueries, mouche, rival qui craque, faux dos… et de la boue sur le chemin. La règle ne change jamais : **tant qu'il est tourné vers toi, ne bouge pas. Attends le « ding » !**
- **Monde 3, « La plage »** (12 ★ du monde 2 pour l'ouvrir, v2.5) : 8 niveaux, dont le boss « Le Soleil Vacancier » 🏖️. Les transats (un de moins que d'enfants), la glace qui fond, l'avion menteur et le reflet du soleil dans l'eau.

La course infinie, le défi du jour, le mode 2 joueurs, le casier, les tenues, les rangs et le fantôme sont toujours là, depuis l'écran d'accueil.

**Les nouveaux pièges** (v2.5) : plus de « SO » nulle part (c'est le mot qui prévient) ; le « ding » du vrai retour dès le monde 1 ; le coucher du soleil (s'arrêter pour rien fait tomber la nuit) ; le recomptage (il compte en te regardant : il ment) ; la fausse alerte (un rival crie « IL REGARDE PAS ! ») ; le troupeau ; et sur la plage, les transats, la glace, l'avion menteur et le reflet. En course infinie : le recomptage dès 50 m, l'avion dès 90 m, le reflet dès 150 m. Voir `docs/TRAPS_DESIGN.md` et `docs/DIFFICULTY.md`.

**Prêt pour Poki** (v2.2) : SDK Poki branché, vraie pause, premiers pas sans menu (on joue en moins de 3 secondes), et un build Poki vérifié automatiquement. Voir `docs/POKI_INTEGRATION.md`.

**6 langues, grands écrans, qualité automatique, daltoniens** (v2.4) : français, anglais, espagnol, portugais, allemand et italien, chacune avec son chant (« RED LIGHT! », « ¡POLLITO! »…) au même rythme ; plus de partage. Pour envoyer le jeu à Poki : `docs/POKI_SUBMISSION.md`.

**Pubs récompensées** (v2.3) : 🎬 2e chance (niveaux et course infinie), 🎬 ×2 ⭐ sur les résultats, 🎬 essayer une tenue dans le casier, en respectant toutes les règles de Poki. Elles n'apparaissent qu'avec le SDK Poki (en dev : `index.html?debug=1&fakead=1`).

## Jouer

- **Ouvrir :** double-clique sur `index.html`. Ça marche sans Internet et sans serveur : tout est dessiné et joué dans le navigateur, sans aucune image, police ou librairie téléchargée. Le seul fichier externe est le SDK Poki : sans lui (hors ligne, bloqueur de pub), le jeu marche pareil.
- **Téléphone :** maintiens le doigt sur l'écran pour courir, lâche pour t'arrêter. Pause : ⏸ en haut à droite.
- **PC :** maintiens Espace (ou ↑, W, Entrée), ou le clic. Sur la carte : ← → et Entrée. Pendant une partie, **Échap ou P : pause**. Ailleurs, Échap : retour. M : son.
- **Langue :** celle de l'appareil (sinon l'anglais), ou le bouton rond « FR » de l'accueil ; pour tester : `index.html?lang=de`.
- **Mode debug :** `index.html?debug=1` affiche chaque événement envoyé à Poki ; `index.html?debug=1&fakead=1` simule une pub de 2 secondes (et montre les boutons 🎬) ; `&pill=1` dessine la zone de la pilule Poki (`&pillside=right` pour l'autre côté).
- **Les étoiles d'un niveau :**
  - ★ finir ;
  - ★★ l'objectif ;
  - ★★★ le défi.

  Chaque nouvelle étoile rapporte aussi des ⭐ pour acheter des tenues au casier. Chaque tentation résistée rapporte +1 ⭐ (si tu finis le niveau).

## Les dossiers

```
index.html        la page : charge les scripts dans l'ordre
css/style.css     styles des boutons, cartes et écrans
js/core/          réglages, textes (FR/EN dans i18n.js, ES/PT/DE/IT dans lang/), outils, hasard avec graine, sauvegarde, contrôles
js/platform/      Poki : la couche SDK (poki.js), le fil du jeu et les pauses pub (flow.js), le mode debug (debug.js) et la vitrine pour les miniatures (showcase.js), dev seulement
js/audio/         sons 8-bit, voix (course infinie), musiques des boss
js/game/          logique sans affichage : chant, soleil, coureur, physique, rivaux, moteur d'un niveau (match.js)
js/render/        dessin : ciel, soleil, sol, coureurs, rivaux, décor de la cour, du parc et de la plage, tentations, faux signaux, nuit/transats/glace, HUD, main du tutoriel
js/modes/         course infinie, défi du jour, 2 joueurs, niveaux
js/ui/            accueil, choix de la langue, premiers pas, carte du monde, intro, résultats, pause, casier, icônes (SVG)
levels/           les mondes et leurs niveaux (données)
tools/            simulation (simulate.js), build Poki (build-poki.js), miniatures Poki (thumbnails/) et tests automatiques
docs/             design des mondes 1 à 3, les pièges, la courbe de difficulté, résultats de la simulation, tests, notes pour la suite
```

Il n'y a qu'un seul objet global, `window.Soleil`. Chaque fichier prend ce dont il a besoin dedans et y range ce qu'il offre. Les explications sont dans `docs/NEXT_PHASES.md`.

## Créer un niveau

1. Ouvre `levels/world1.js` (ou `levels/world2.js` pour les tentations, le faux dos et la boue, `levels/world3.js` pour les transats, la glace, l'avion et le nuage) et copie un niveau. Change `id`, `name`, `length`, les rivaux, les réglages du soleil, l'objectif et le défi. Tout est expliqué dans `levels/README.md`.
2. Vérifie-le avec la simulation : `node tools/simulate.js --level w2-3`. **L'expert doit réussir au moins 95 %**, sinon le niveau est injuste ; et le robot prudent (il s'arrête tout le temps) ne doit pas avoir ★★★.
3. Recharge `index.html`.

## La simulation

```
node tools/simulate.js                         # 300 essais × 4 joueurs × 24 niveaux, ~70 s
node tools/simulate.js --world 2               # un seul monde
node tools/simulate.js --n 1000                # plus précis
node tools/simulate.js --md docs/LEVELS.md     # réécrit le tableau des résultats
```

Elle fait tourner le **même code** que le navigateur (moteur, chant, physique, rivaux, niveaux), sans affichage. Elle vérifie les objectifs de difficulté. Elle a besoin de Node.js, qui est gratuit.

## Le build Poki

```
node tools/build-poki.js
```

Il fabrique `dist/poki/` (`index.html`, un seul `game.js`, `style.css`) et `dist/soleil-poki.zip`, le fichier à envoyer à Poki, sans le mode debug ni les outils. Puis il vérifie tout et affiche un rapport : il doit finir par « TOUT EST OK ». Il a seulement besoin de Node.js (gratuit), sans rien installer d'autre. Ensuite, teste le ZIP dans le Poki Inspector (liste pas à pas dans `docs/POKI_INTEGRATION.md`).

## Mettre le jeu en ligne gratuitement

Le jeu est un simple dossier de fichiers. N'importe quel hébergeur de pages statiques gratuit convient :
- **Netlify Drop** : va sur app.netlify.com/drop et glisse le dossier `soleil-v2`. Tu obtiens un lien tout de suite.
- **GitHub Pages** : crée un dépôt, envoie les fichiers, puis Settings → Pages → « Deploy from a branch » (branche `main`, dossier `/`).
- **itch.io** : compresse le dossier en `.zip`, crée un projet « HTML » et coche « This file will be played in the browser ».

Pense à garder `index.html` à la racine.
