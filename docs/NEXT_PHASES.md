# Notes pour les phases suivantes

Ce fichier dit **où** et **comment** brancher la suite, sans avoir à tout relire. Il est à jour à la fin de la **v2.5** (les nouveaux pièges, le monde 3 « La plage »), après la v2.4 (étape Poki 3 : 6 langues, grands écrans, qualité), la v2.3 (étape Poki 2 : corrections et pubs récompensées), la v2.2 (étape Poki 1 : SDK Poki, pause, premiers pas, build Poki), la phase 2 (monde 2 « Le parc ») et la v2.1 (nouveau look).

## L'architecture en 30 secondes

- **Fichiers.** `index.html` charge des `<script>` classiques dans l'ordre (63 fichiers ; le build Poki en réunit 62 dans un seul `game.js`, sans le mode debug). Il n'y a ni module ni `fetch()`, donc tout marche en ouvrant le fichier par double-clic. Le seul fichier externe est le SDK Poki, en `async` dans la version dev : sans lui, le jeu passe en mode de secours.
- **Objet global.** Il n'y en a qu'un : `window.Soleil`.
  - Chaque fichier est une fonction `(function (S) { … })(window.Soleil)`.
  - En haut, une ligne `const { … } = S;` liste ce qu'il utilise des fichiers chargés avant lui.
  - En bas, `Object.assign(S, { … })` liste ce qu'il partage.
  - Les variables partagées qui changent (état du jeu, coureur, soleil…) vivent directement dans `S` : `S.state`, `S.runner`, `S.watcher`, `S.mode`, `S.gtime`…
- **Ordre de chargement.** C'est celui de `index.html`. Un fichier ne peut utiliser **au chargement** que ce qui a été chargé avant lui. Dans une fonction appelée plus tard, `S.nom` marche toujours.
- **Moteur d'un niveau.** `js/game/match.js` (`S.Match`) est **pur** : il ne dessine rien et ne joue aucun son. Il range des événements dans `m.out`. Le navigateur (`js/modes/levels.js`) les transforme en sons, popups et bannières. La simulation (`tools/simulate.js`) fait tourner le même code dans Node.
- **Hasard.** Toutes les décisions de jeu passent par `mulberry32` + `mixSeed` (`js/core/rng.js`). Il y a **deux suites de dés** par cycle :
  - `cycleConfig` (`match.js`) : **16 dés, toujours dans le même ordre**, pour le chant (mots, pièges, express…). C'est la suite de la phase 1.
  - `lookConfig` (`match.js`, phase 2) : **24 dés** tirés d'une suite à part, `mulberry32(mixSeed(seed, 5000 + n))`, pour le regard (faux dos, durée de l'œil, tentations).
  - v2.5 : une **3e suite**, `mulberry32(mixSeed(seed, 7000 + n))` (16 dés, `cycleConfig`), pour les nouveautés de la v2.5 (recomptage, avion, fausse alerte, troupeau, nuage). En course infinie, `chant.js` a aussi sa suite à part, `mixSeed(S.runSeed, 7000 + S.cycleN)` : le défi du jour reste le même pour tous.
  - Pour une nouvelle mécanique, **ajoutez des dés à la fin** d'une suite (ou créez une 4e suite avec un autre décalage, par exemple `9000 + n`), sans décaler les autres : les niveaux existants gardent exactement le même comportement. C'est ce qui garantit que le monde 1 n'a pas bougé d'un chiffre en phase 2.
  - `Math.random()` est réservé aux effets visuels (particules, bulles des rivaux, ordre des moqueries).

## Poki (v2.2) : à respecter pour tout ce qui suit

Tout est décrit dans `docs/POKI_INTEGRATION.md` (le tableau de chaque moment du jeu et son événement SDK). L'essentiel :

- **Ne jamais appeler `PokiSDK` directement.** Tout passe par `S.Poki` (`js/platform/poki.js`), qui protège chaque appel et marche sans SDK.
- **Ne jamais envoyer `gameplayStart` / `gameplayStop` à la main.** `S.gameActive()` (`js/platform/flow.js`) dit si le joueur joue vraiment ; la boucle envoie l'événement quand la réponse change. Pour un **nouveau mode** : ajoutez une ligne dans `gameActive()` (quand il est « en jeu »), une dans `pausable()` (`js/ui/pause.js`, quand ⏸ est permis), et ses libellés dans `fillMenu()`. Une nouvelle cinématique ou carte d'intro = une phase qui n'est pas « en jeu ».
- **Une pub avant de rejouer** : `S.afterBreak(() => …)` (Rejouer, Suivant, Recommencer, Reprendre, Revanche). Elle bloque le double tap, fige et coupe le son si Poki montre une pub, puis lance la suite. Pas de pub quand on va vers la carte, l'accueil ou un écran de sélection.
- **Pubs récompensées (v2.3)** : tout passe par `js/ui/reward.js`. Pour une nouvelle récompense : ajoutez un `handlers.xxx = { can(token), give(token, bouton) }`, une taille dans `SIZE`, et affichez le duo avec `S.Reward.pairHTML({ act, label, icon }, { kind: 'xxx', token, label, cap })` (le bouton normal vert reste à gauche, plus large). Ne montrez jamais de bouton 🎬 si `S.Reward.available()` est faux (mode de secours). Une 2e chance dans un nouveau mode : une fonction de reprise (comme `Match.revive` ou `S.reviveRun`) et une ligne dans `canRevive()`.
- **Tenue dessinée** : utilisez `S.wornOutfit()` (et plus `S.outfit`) pour dessiner le joueur : c'est la tenue d'essai s'il y en a une. `S.trialBegin()` au début d'une partie, `S.trialEnd()` quand on la quitte.
- **Sons** : pour couper le son pour une raison du jeu, `Sound.silence('raison', true)` (jamais `Sound.muted`, qui est le choix du joueur). Testez `Sound.quiet` avant de jouer un son.
- **Nouveaux boutons** : à droite (colonne des boutons ronds) ou au centre, jamais dans la zone de la pilule Poki. Elle est à gauche (`S.pillX` = 56 px) OU à droite (`S.pillR` = 56 px) selon `PILL.side` (`js/platform/flow.js`) : décalez les textes du haut à gauche de `S.pillX`, et ce que vous placez en haut à droite de `S.pillR` (les boutons ronds le font tout seuls avec `--pr`).
- **Messages** (`S.toast`) : sur un écran de fin, ils se placent tout seuls au-dessus du panneau. Un nouvel écran de fin : ajoutez son sélecteur à `END_PANELS` (`js/ui/toast.js`).
- **Textes français** : écrivez-les avec des espaces normales, `typoAll` met les espaces insécables (avant « ! ? : ; », dans les « », entre un nombre et son unité). Un texte construit ailleurs : passez-le dans `S.typoFr()`.
- **Consignes** : `S.forDevice(texteTactile, texteClavier)` donne le bon texte (« Touche… » ou « Clic ou Espace… ») ; `S.drawTut('hold' | 'release')` dessine la main (tactile) ou la touche Espace (clavier), `S.drawTutWord(mot)` le mot au-dessus du coureur. Dans un niveau : `hints: [{ on: 'so', cycle: 1, text: T('LÂCHE !', 'LET GO!'), hand: 'release' }]`.
- **Premiers pas** : `js/ui/onboard.js` (`soleil.onboard` : 0 → 3). Le niveau 1 est en douceur (`soft: { back: 6 }`, géré par `match.js`) : un niveau difficile ne doit jamais l'utiliser.
- **Mode debug** : `index.html?debug=1` (journal à l'écran, enchaînements interdits en rouge), `&fakead=1` (fausse pub de 2 s). Le code de debug va dans `js/platform/debug.js`, ou sur une ligne marquée `// @debug` (ou entre `// @debug-start` et `// @debug-end`) : le build les retire.
- **Avant d'envoyer à Poki** : `node tools/build-poki.js` doit afficher « TOUT EST OK » (aucune adresse externe sauf le SDK, aucun lien sortant, `localStorage` toujours dans un try/catch — passez par `S.store` —, pas de `console.log`, moins de 8 Mo). Puis la liste de tests du Poki Inspector (`docs/POKI_INTEGRATION.md`, section 10).

## Les prochaines étapes Poki (pas faites à l'étape 1, exprès)

- Fait en v2.4 : 6 langues (avec leur chant), miniatures (`tools/thumbnails/make.py`), qualité automatique, grands écrans.
- Le partage a été **retiré** en v2.4 (décision : personne ne l'utilise). Ne pas le remettre sans en reparler.
- Fait en v2.5 : plus de « SO », les nouveaux pièges (`docs/TRAPS_DESIGN.md`), le monde 3 (`docs/WORLD3_DESIGN.md`), la courbe de difficulté (`docs/DIFFICULTY.md`).
- Les mondes 4 et 5 et les nouvelles mécaniques.
- **Pour tout nouveau texte** : l'écrire en français ET en anglais (`js/core/i18n.js` ou `T(fr, en)` dans un niveau), puis dans
  `js/core/lang/es.js`, `pt.js`, `de.js`, `it.js` (clé, ou phrase anglaise dans `phrases`). Le test 29 de `test_poki.py`
  liste ce qui manque. Ne jamais écrire « SO », « SOLEIL » ou un mot piège en dur : `S.chantW()` et `L.chant`.
- **Pour toute nouvelle information de jeu** : jamais par la couleur seule (forme, icône, mouvement ou texte en plus).
- **Pour tout nouvel effet coûteux** (particules, décor) : respecter `S.Q` (`js/render/quality.js`).

## Le look (v2.1)

- **Couleurs des boutons** : une classe par couleur dans `css/style.css` (`c-blue`, `c-green`, `c-orange`, `c-purple`, `c-pink`, `c-white`). Un nouveau bouton prend `class="btn c-green"` (ou `hbtn` pour l'accueil) et a tout de suite le relief et le contour.
- **Icônes** : `js/ui/icons.js`. `S.icon('play')` donne le SVG à glisser dans un bouton ; `S.setIcon(id, 'home')` change l'icône d'un bouton fixe. Pour une nouvelle icône, ajoutez son dessin (carré de 24 × 24) dans `ICONS`.
- **Logo** : `drawLogo(texte, taille, couleurHaut, couleurBas)` dans `js/render/hud.js`.
- **Carte** : `drawTile`, `drawPadlock`, `drawStones`, `drawRoundBtn` dans `js/ui/worldmap.js` servent pour les mondes suivants.

## Le cycle de vie d'un niveau

1. La carte (`ui/worldmap.js`) appelle `Levels.open(id)`.
2. `modes/levels.js` crée `Match.create(niveau, numéroEssai, { newSun: newWatcher })`. Le joueur devient `S.runner`, le soleil `S.watcher` : les dessins de la course infinie servent tels quels.
3. Il passe par les phases suivantes :

   | Phase | Ce qui se passe |
   |---|---|
   | `ready` | 1re visite : le niveau 1 sans carte d'intro, le soleil attend, la main montre le geste (v2.2) |
   | `intro` | carte d'intro ; elle attend un appui (v2.2 : c'est l'appui qui envoie `gameplayStart`) |
   | `boss` | cinématique du boss (lunettes noires, lunettes-nez-moustache, ou chapeau de paille et lunettes en cœur, selon `bossKind` ; table `BOSS` de `modes/levels.js`) |
   | `play` | `Match.step(m, dt, S.pressing)` à chaque image |
   | `caught` → `fail` | grillé, puis carte de défaite |
   | `win` → `results` | victoire, puis écran de résultats |

4. Le soleil d'un niveau passe par `pause` → `chant` → `turn` → `look` → `return`. En phase 2, deux états s'ajoutent pour le **faux dos** : `return` (vers `retTo` = 0,56) → `peek` (l'œil) → `hop` → `look` (2e regard, `sun.second`) → `return`.
5. Le rendu (`render/scene.js`) ajoute en mode Niveaux :
   - les flaques (`drawLevelMud`, `render/tempt.js`) puis l'arrivée (`drawFinish`) ;
   - l'étoile tentatrice (`drawTemptStar`), les rivaux (`render/rivals.js`), la mouche (`drawFly`) ;
   - le HUD (`render/levelhud.js`), qui dessine aussi les yeux de l'éternuement, la tête du Soleil Farceur, l'œil du faux dos, l'anneau vert du vrai retour et les bulles de moquerie ;
   - le décor du monde : `drawLevelDecor` choisit `render/playground.js` (monde 1), `render/park.js` (monde 2) ou `render/beach.js` (monde 3), et `tintLevel` choisit la palette ;
   - v2.5 : l'avion, le reflet et la bulle de la fausse alerte (`render/lies.js`), la barre de la nuit, les transats, le cornet et la montagne de glace (`render/pressure.js`).
6. La sauvegarde est dans `localStorage` :

   | Clé | Contenu |
   |---|---|
   | `soleil.levels` | `{ 'w2-3': { s: [★, ★★, ★★★], best, tries, done } }`, les deux mondes dans le même objet |
   | `soleil.temptSeen` (phase 2) | tentations déjà rencontrées (l'indication « 1re fois » ne revient pas) |
   | `soleil.worldsShown` (phase 2) | mondes dont l'animation de déblocage a déjà été jouée |
   | `soleil.lastLevel` (phase 2) | dernier niveau gagné (la carte s'ouvre sur son monde) |
   | `soleil.onboard` (v2.2) | premiers pas : 0 jamais joué, 1 niveau 1 fini, 2 niveau 2 fini, 3 carte présentée (anciennes sauvegardes : 3) |
   | `soleil.lieSeen` (v2.5) | faux signaux déjà rencontrés en course infinie (`recount`, `planeGo`, `reflet`) : la bannière ne revient pas |

   Chaque nouvelle étoile rapporte des ⭐ pour le casier (`COINS`), plus 1 ⭐ par tentation résistée si on finit le niveau.

## Le signal du vrai retour (« ding ») : à ne jamais imiter

- Il naît à **un seul endroit** : `trueReturn(m)` dans `match.js`, qui émet `return` puis `clear`. N'émettez jamais `clear` ailleurs.
- Sa mise en scène est dans `onTrueEnd()` (`modes/levels.js`) : `Sound.ding()`, anneau vert (`fx.halo`), tour rapide des rayons (`fx.spin`), visage complètement caché.
- Une nouvelle fausse fin peut reprendre **un** de ces indices (tourner, se cacher), mais jamais les quatre, et jamais le son « ding ». Le test automatique « Le ding n'arrive qu'au vrai retour » (`tools/tests/test_levels.py`) le vérifie sur 125 essais.
- `SIGNAL_WORLD` (`modes/levels.js`) : v2.5 : le « ding » et les « DÉPART ÉCLAIR ! » commencent **dès le monde 1** (`1`), parce que le recomptage et la fausse alerte y arrivent. Les faux signaux de la v2.5 (recomptage, avion, fausse alerte, troupeau) n'imitent aucun de ses quatre indices.

## Ajouter une tentation

1. `match.js`, table `TEMPT` : quand elle arrive dans le regard (`at`, `jit`), la durée minimale du regard (`need`) et son groupe (`group` : deux tentations du même groupe ne vont jamais ensemble, car elles se liraient au même endroit de l'écran).
2. `match.js`, `TEMPT_ORDER` (dés de la 2e suite) ou, depuis la v2.5, `TEMPT_V25` (dés de la 3e suite) : ajoutez-la **à la fin** (l'ordre fixe les dés).
3. `match.js`, `lookTimeline()` : si elle a un effet sur le soleil (comme le faux retour ou l'éternuement), c'est ici.
4. `game/rivals.js` : son multiplicateur `TEMPT_K` et son moment `CRACK_AT`.
5. `modes/levels.js`, `onTempt()` : le son et l'effet. Le dessin va dans `render/tempt.js`.
6. `core/i18n-levels.js` : `temptHint` (1re rencontre) et `temptFail` (carte de défaite), en FR et en EN, puis dans `core/lang/*.js` (les 4 autres langues).
7. Dans les niveaux : `sun.tempt: { nom: probabilité, max }`, ou forcée par cycle avec `script: { 2: { tempt: ['nom'] } }`, et `'tempt:nom'` dans `mechanics` (la simulation s'en sert pour la familiarité entre niveaux).

## Où brancher chaque future mécanique

Règle commune :
1. Ajoutez le nom de la mécanique dans `mechanics` des niveaux qui l'utilisent.
2. Ajoutez ses réglages dans `SUN_BASE` (ou un nouveau champ du niveau).
3. Faites la logique dans `match.js`, en événements dans `m.out`.
4. Faites la mise en scène dans `modes/levels.js` et le dessin dans `render/`.
5. Relancez `node tools/simulate.js` : l'expert doit réussir au moins 95 %, et les mondes déjà faits ne doivent pas bouger (la simulation compare le monde 1 à sa référence `REF_W1`).

| Mécanique | Où | Comment |
|---|---|---|
| **Couloirs** | `match.js` : `player.lane` existe déjà (0) | Les rivaux ont déjà un couloir (`LANES`). Ajoutez un geste dans `core/input.js` (glisser gauche/droite) et `m.player.lane`. Le dessin du joueur au centre est dans `render/characters.js` (`drawRunner`, décalage `jx`). Attention : l'étoile tentatrice et la mouche sont placées par rapport au coureur centré (`render/tempt.js`, `STAR_LAT`, `flyPos`). |
| **Cachettes** | données du niveau : `objects: [{ z, type: 'hide' }]` | Dans `lookStart()`, un joueur caché ne peut pas être grillé. Le dessin va dans `render/park.js` (comme les bancs) ou un nouveau fichier de décor. |
| **Rival tricheur** | `game/rivals.js` | Ajoutez `PROFILES.tricheur` (emoji, `crack`, `learn`). Il bouge pendant le regard quand le soleil ne le voit pas : il faut un « champ de vision » dans `lookStart()`. Il est peut-être démasqué au 2e regard : événement `rivalCaught`, réaction dans `modes/levels.js`, et texte `L.kind.tricheur` dans `core/i18n-levels.js`. Le 2e regard du faux dos (`sun.second`) est un bon moment. |
| **Objets** (bonus) | données : `items: [{ z, type }]` | Ramassage dans `Match.step` (comme `catchStar` en course infinie), effets sur `player` (vitesse `vmax`, bouclier…), dessin dans `render/items.js`. Un objet pendant le regard serait une tentation : passez par la table `TEMPT`. |
| **Descente** | `match.js`, `move()` | `move()` choisit déjà le sol (`'mud'` avec `mudAt`). Ajoutez `slope: [[début, fin]]` au niveau et passez `'slope'` à `kinStep`. Le dessin `drawSlope` existe (`render/ground.js`) et l'horizon penché aussi (`S.tiltPx`, `main.js`, désactivé en niveau). |
| **Verglas dans les niveaux** | même chemin que la boue | `ice: [[début, fin]]` dans le niveau, `kinStep(…, 'ice', …)` dans `move()`, dessin avec `drawPuddle({ type: 'ice' }, …)` (`render/ground.js`), comme `drawLevelMud`. |
| **La Lune** | `game/chant.js` (`MOON_TRAPS`) | La Lune existe en course infinie (nuit). Pour un niveau, il faudrait un champ `moon` dans `sun` et la palette de nuit (`render/sky.js`). Le « ding » doit rester le même signal pour la Lune. |
| **Soleil-projecteur** | `match.js`, `stepSun` (`case 'look'`) | Le regard grille aujourd'hui tout le monde. Un projecteur ne verrait qu'une zone : un test de couloir/position dans la boucle des rivaux et du joueur du `case 'look'`, et un cône dessiné dans `render/levelhud.js`. |
| **Voix du soleil** | `audio/voice.js` | Elle existe pour la course infinie : `Voice`, `sayEvent`, avance mesurée `Voice.lead`. En niveau, quand `'voice'` est dans `mechanics`, appelez `S.sayEvent(e.ev)` dans `events()` (`modes/levels.js`) **avant** l'affichage, de `Voice.lead` secondes. Les moqueries et l'éternuement pourraient aussi être dits. Le bouton 🗣️ est caché en mode Niveaux et pendant une partie, où ⏸ prend sa place (`syncButtons`, `ui/pause.js`). |
| **Nuage** (fait en v2.5) | niveaux : champ `cloud` de `sun` (`match.js`, dé de la 3e suite) ; course infinie : `main.js` (`cloudOn`) | Le reflet (`render/lies.js`, `drawReflection`) montre le visage, l'œil du faux dos et l'anneau vert : dans les niveaux, le nuage n'a donc pas besoin du son, et le texte du chant reste affiché. En course infinie, il garde la règle d'équité `audioOK()` (jamais de nuage si on n'entend pas le jeu) ; dès 150 m, son reflet aussi. |
| **Mode 2 joueurs** | `modes/duo.js` | Il existe et utilise le soleil de la course infinie. Pour un duo dans les niveaux, `Match` sait déjà gérer plusieurs coureurs : faites du 2e joueur un « rival » piloté au clavier (`press` imposé au lieu du cerveau, comme `r.forced`). |
| **Mondes 4 et 5** | `levels/worlds.js` | La plage (v2.5) montre le chemin : passez `soon: false` et ajoutez `need: { world: 3, stars: N }` ; créez `levels/world4.js` ; ajoutez le `<script>` dans `index.html` **et** dans `FILES` de `tools/simulate.js` (avec ses objectifs dans `TARGETS`). Décor : un fichier comme `render/beach.js`, choisi dans `drawLevelDecor` et `tintLevel` (`render/tempt.js`) ; les collines de `render/sky.js` (`drawHills`) sont coupées à la plage, à voir pour la montagne. Carte : un fond comme `drawBeachMap` (`render/beach.js`), appelé par `ui/worldmap.js`. Boss : une ligne dans `BOSS` (`modes/levels.js`) et sa musique dans `audio/music.js`. Textes de fin : `worldDone4` (`ui/results.js`), `worldUnlockedSub4` (`ui/worldmap.js`), dans les 6 langues. Le déblocage animé marche tout seul (`worldsShown`). |

## Pièges à éviter

- **Ne pas recopier de logique de jeu dans `modes/levels.js`.** Tout ce qui décide doit être dans `match.js`, sinon la simulation ment.
- **Ne jamais imiter le « ding ».** Voir plus haut.
- **Garder les textes en FR et EN.** Ceux du mode Niveaux sont dans `core/i18n-levels.js`. Le test « tous les nouveaux textes existent » vérifie les deux langues.
- **Ne pas casser les anciennes sauvegardes.** Les clés `soleil.best`, `stars`, `owned`, `outfit`, `ghost`, `medals`, `streak`, `mstate`, `daily`, `mute`, `voice`, `cloudSeen`, `levels`, `temptSeen`, `worldsShown`, `lastLevel` et `onboard` sont lues telles quelles. N'ajoutez que de nouvelles clés.
- **Rien d'externe.** Aucune requête réseau, aucun lien qui sort du jeu (Poki le refuse) : le build le vérifie.
- **Tester les modes existants.** La course infinie, le défi du jour et le mode 2 joueurs ont leurs propres chemins dans `update()` et `render()`. Vérifiez-les après chaque phase (voir `docs/TESTS.md`). Pour prouver que rien n'a bougé, `python3 tools/tests/compare_frames.py <ancienne version>` compare le dessin image par image (en phase 2, v2.1 et v2.2 : 94/94 images identiques). Les événements Poki se testent avec `python3 tools/tests/test_poki.py`.
