# 1, 2, 3… SOLEIL ! — v2 (phase 2)

Maintiens pour courir vers le soleil, et lâche avant qu'il se retourne. S'il te voit bouger, tu es **GRILLÉ**.

**▶ Jouer en ligne : https://annelaureriaudsimon-web.github.io/123soleil-/**

Le jeu se joue en **niveaux**, avec d'autres enfants qui courent contre toi :
- **Monde 1, « La cour de récré »** : 8 niveaux, dont le boss « Le Soleil Cool » 😎.
- **Monde 2, « Le parc »** (12 ★ du monde 1 pour l'ouvrir) : 8 niveaux, dont le boss « Le Soleil Farceur » 🤡. Pendant qu'il te regarde, le soleil essaie de te faire bouger : étoile tentatrice, faux retour, éternuement, moqueries, mouche, rival qui craque, faux dos… et de la boue sur le chemin. La règle ne change jamais : **tant qu'il est tourné vers toi, ne bouge pas. Attends le « ding » !**

La course infinie, le défi du jour, le mode 2 joueurs, le casier, les tenues, les rangs et le fantôme sont toujours là, depuis l'écran d'accueil.

## Jouer

- **Ouvrir :** double-clique sur `index.html`. Ça marche sans Internet et sans serveur : tout est dessiné et joué dans le navigateur, sans aucune image, police ou librairie téléchargée.
- **Téléphone :** maintiens le doigt sur l'écran pour courir, lâche pour t'arrêter.
- **PC :** maintiens Espace (ou ↑, W, Entrée), ou le clic. Sur la carte : ← → et Entrée. Échap : retour. M : son.
- **Les étoiles d'un niveau :**
  - ★ finir ;
  - ★★ l'objectif ;
  - ★★★ le défi.

  Chaque nouvelle étoile rapporte aussi des ⭐ pour acheter des tenues au casier. Dans le parc, chaque tentation résistée rapporte +1 ⭐ (si tu finis le niveau).

## Les dossiers

```
index.html        la page : charge les scripts dans l'ordre
css/style.css     styles des boutons, cartes et écrans
js/core/          réglages, textes FR/EN, outils, hasard avec graine, sauvegarde, contrôles
js/audio/         sons 8-bit, voix (course infinie), musiques des boss
js/game/          logique sans affichage : chant, soleil, coureur, physique, rivaux, moteur d'un niveau (match.js)
js/render/        dessin : ciel, soleil, sol, coureurs, rivaux, décor de la cour et du parc, tentations, HUD
js/modes/         course infinie, défi du jour, 2 joueurs, niveaux
js/ui/            accueil, carte du monde, intro, résultats, casier, partage
levels/           les mondes et leurs niveaux (données)
tools/            simulation (simulate.js) et tests automatiques
docs/             design des mondes 1 et 2, résultats de la simulation, tests, notes pour la suite
```

Il n'y a qu'un seul objet global, `window.Soleil`. Chaque fichier prend ce dont il a besoin dedans et y range ce qu'il offre. Les explications sont dans `docs/NEXT_PHASES.md`.

## Créer un niveau

1. Ouvre `levels/world1.js` (ou `levels/world2.js` pour les tentations, le faux dos et la boue) et copie un niveau. Change `id`, `name`, `length`, les rivaux, les réglages du soleil, l'objectif et le défi. Tout est expliqué dans `levels/README.md`.
2. Vérifie-le avec la simulation : `node tools/simulate.js --level w2-3`. **L'expert doit réussir au moins 95 %**, sinon le niveau est injuste.
3. Recharge `index.html`.

## La simulation

```
node tools/simulate.js                         # 300 essais × 3 joueurs × 16 niveaux, ~20 s
node tools/simulate.js --world 2               # un seul monde
node tools/simulate.js --n 1000                # plus précis
node tools/simulate.js --md docs/LEVELS.md     # réécrit le tableau des résultats
```

Elle fait tourner le **même code** que le navigateur (moteur, chant, physique, rivaux, niveaux), sans affichage. Elle vérifie les objectifs de difficulté. Elle a besoin de Node.js, qui est gratuit.

## Mettre le jeu en ligne gratuitement

Le jeu est un simple dossier de fichiers. N'importe quel hébergeur de pages statiques gratuit convient :
- **Netlify Drop** : va sur app.netlify.com/drop et glisse le dossier `soleil-v2`. Tu obtiens un lien tout de suite.
- **GitHub Pages** : crée un dépôt, envoie les fichiers, puis Settings → Pages → « Deploy from a branch » (branche `main`, dossier `/`).
- **itch.io** : compresse le dossier en `.zip`, crée un projet « HTML » et coche « This file will be played in the browser ».

Pense à garder `index.html` à la racine.
