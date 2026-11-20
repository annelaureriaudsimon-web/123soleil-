/* js/core/config.js — Réglages du jeu (vitesse, freinage, regard du soleil…) et création de l’objet global Soleil */
window.Soleil = window.Soleil || {};   // le seul objet global du jeu
(function (S) {
'use strict';

/* ==============================================================
   1, 2, 3… SOLEIL !
   Maintiens pour courir vers le soleil. Lâche avant qu'il se
   retourne : s'il te voit bouger, tu es GRILLÉ.
   Un seul fichier, aucune librairie : tout est dessiné en canvas.
   ============================================================== */

/* ---------- 1. Réglages (c'est ici qu'on équilibre le jeu) ---------- */
const VMAX0 = 8, VMAX_STEP = 1, VMAX_CAP = 12;   // vitesse : 8 m/s au départ, +1 à chaque phase, 12 max
const ACC = 30;              // accélération (m/s²)
const DEC = 40;              // freinage (m/s²) : 0,2 s de glissade à 8 m/s, 0,3 s à 12 m/s
const ICE_DEC = 13;          // sur le verglas, on glisse 3 fois plus loin
const MUD_ACC = 9, MUD_SPEED = 0.55;   // dans la boue : démarrage au ralenti, vitesse ×0,55
const V_EPS = 0.12;          // au-dessus de cette vitesse, le soleil te voit bouger
const CLOSE = 0.18;          // arrêté moins de 0,18 s avant son regard = « OUF ! » (et combo)
const PHASE_LEN = 60;        // matin, midi, soir, nuit : une phase (et un boss) tous les 60 m (~20 s). Presque tout en découle
const TURN0 = 0.45, TURN_MIN = 0.26;   // temps pour réagir après « SOLEIL ! » : au départ, puis au plus dur
const RET_DUR = 0.28;        // durée de son demi-tour quand il se remet de dos
const HOP_DUR = 0.16;        // le « HOP ! » du faux dos est très rapide
const PEEK_P = 0.56;         // pendant le faux dos, il reste tourné juste assez pour qu'un œil dépasse
const DIFF_SCALE = 5 * PHASE_LEN;   // plus c'est grand, plus la difficulté monte lentement
const PRESSURE = 3;          // anti-camping : le soleil s'impatiente avec le temps
const OVER_START = 8 * PHASE_LEN, OVER_LEN = 3 * PHASE_LEN;   // au-delà, il s'emballe : aucune partie ne dure des heures
// Apparition des pièges (m), en fractions de phase : avec PHASE_LEN = 60 → 30, 45, 60, 80, 100, 120, 120, 180
const UNLOCK = { traps: PHASE_LEN / 2, stutter: PHASE_LEN * 3 / 4, mud: PHASE_LEN, cloud: PHASE_LEN * 4 / 3,
                 fauxDos: PHASE_LEN * 5 / 3, rush: 2 * PHASE_LEN, slope: 2 * PHASE_LEN, ice: 3 * PHASE_LEN };
const FIRST_TRAP_CYCLE = 3;  // un mot piège forcé au 3e cycle de chaque partie (vers 12-15 s)
const STAR_EVERY = PHASE_LEN / 4;   // une étoile de distance tous les 15 m
// Étoiles à attraper (risque / récompense)
const STAR_P = 0.4;          // probabilité qu'une étoile apparaisse au « 3 » (dé w.R[21])
const BIG_P = 0.25;          // part de grosses étoiles dorées (dé w.R[22])
const STAR_PTS = 2, BIG_PTS = 5;    // ⭐ gagnées (doublées avec un OUF sur le même regard)
const STAR_MARGIN = [0.12, 0.06];   // marge (s) avant le tout dernier moment pour lâcher : au début, puis au plus dur
const BIG_MARGIN = 0.7;      // la grosse étoile est encore plus près du bord (marge ×0,7)
const STAR_R = 0.45;         // rayon d'attrape (m) : on l'attrape en passant dessus, même en glissade
// Nuage devant le soleil
const CLOUD_P = 0.3;         // probabilité d'un nuage sur un chant (dé w.R[23]) ; jamais pendant un boss
// Descente
const SLOPE_SPEED = 1.3;     // en courant : vitesse max ×1,3
const SLOPE_DEC = 26;        // en lâchant : freinage 2 fois plus long qu'au sol (depuis la vitesse max)
const SLOPE_TILT = 0.035;    // l'horizon descend de 3,5 % de l'écran
// Voix du soleil (Web Speech)
const VOICE_MAX_LAG = 0.25;  // délai de la voix (s) au-delà duquel on la coupe : trop grand ou trop instable
const BOSS_LEAD = 1.1;       // un boss parle avant de chanter (s)
const BOSS_REST = 1.2;       // pause en plus après un boss battu, le temps qu'il râle (s)
// Mode 2 joueurs
const DUO_FINISH = 120;      // ligne d'arrivée (m)
const DUO_WIN = 2;           // manches gagnantes
const DUO_D = 0.25;          // difficulté fixe du soleil (0 = facile, 1 = très dur)
const DUO_TURN = 0.45;       // temps pour réagir après « SOLEIL ! » (s), comme au début du solo
const DUO_TRAPS = 0.35;      // probabilité d'un mot piège dans un chant
const DUO_FAUX = 0.25;       // probabilité d'un faux dos après un regard
const DUO_RESPAWN = 1.1;     // durée de l'animation « grillé » avant le retour au départ (s)
const DUO_LANE = 0.45;       // écart de chaque couloir par rapport au centre du chemin (m)
const DUO_INTRO = 2.4;       // durée de l'écran « J1 / J2 : maintiens ici » (s)
const CAM_H = 3, CAM_BACK = 5, PATH_W = 0.95, FAR = 150;                                     // caméra et chemin
const INK = '#2B2D42', SKIN = '#F2B48C', TAU = Math.PI * 2;
const FONT = 'ui-rounded,"SF Pro Rounded","Nunito","Varela Round","Arial Rounded MT Bold",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

Object.assign(S, { VMAX0, VMAX_STEP, VMAX_CAP, ACC, DEC, ICE_DEC, MUD_ACC, MUD_SPEED, V_EPS, CLOSE, PHASE_LEN,
  TURN0, TURN_MIN, RET_DUR, HOP_DUR, PEEK_P, DIFF_SCALE, PRESSURE, OVER_START, OVER_LEN, UNLOCK,
  FIRST_TRAP_CYCLE, STAR_EVERY, STAR_P, BIG_P, STAR_PTS, BIG_PTS, STAR_MARGIN, BIG_MARGIN, STAR_R, CLOUD_P,
  SLOPE_SPEED, SLOPE_DEC, SLOPE_TILT, VOICE_MAX_LAG, BOSS_LEAD, BOSS_REST, DUO_FINISH, DUO_WIN, DUO_D, DUO_TURN,
  DUO_TRAPS, DUO_FAUX, DUO_RESPAWN, DUO_LANE, DUO_INTRO, CAM_H, CAM_BACK, PATH_W, FAR, INK, SKIN, TAU, FONT });
})(window.Soleil);
