/* js/audio/voice.js — La voix du soleil et de la Lune (Web Speech) — course infinie */
(function (S) {
'use strict';
const { VOICE_MAX_LAG, L, clamp, store, Sound } = S;   // déjà chargés
   // le joueur entend-il le jeu ?

/* ---------- 8 bis. La voix du soleil et de la Lune (Web Speech, aucun fichier audio) ---------- */
// La voix ne pilote JAMAIS le jeu : elle suit la chronologie de makeChant(), lancée un peu en avance
// de son délai mesuré pour tomber pile avec le texte. Elle parle la langue du jeu (L.say, js/core/i18n.js et lang/*.js),
// avec une voix de cette langue (sinon : pas de voix, les sons 8-bit restent).
const SAY = new Proxy({}, { get: (o, k) => (S.L.say || {})[k] });   // SAY.sun… lit toujours la langue actuelle
const VOICE_LANG = { fr: /^fr[-_]fr/i, en: /^en[-_](us|gb)/i, es: /^es[-_](es|mx|us)/i, pt: /^pt[-_]br/i, de: /^de[-_]de/i, it: /^it[-_]it/i };
const Voice = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  pref: store.get('voice', true) !== false,      // bouton 🗣️ (mémorisé)
  voice: null, unlocked: false, broken: false, skip: 1,
  lead: 0.1, lags: [], cur: null,                // délai mesuré (s) entre speak() et le début de la parole
  init() {
    if (!this.ok) return;
    const pick = () => {                         // les voix arrivent en différé : on choisit dès qu'elles sont là
      let vs = [];
      try { vs = speechSynthesis.getVoices() || []; } catch (e) { vs = []; }
      const lg = S.LANG, mine = vs.filter(v => new RegExp('^' + lg + '([-_]|$)', 'i').test(v.lang || ''));
      this.voice = null;
      if (!mine.length) { S.refreshVoice(); return; }
      const score = v => (VOICE_LANG[lg] && VOICE_LANG[lg].test(v.lang) ? 4 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0);
      this.voice = mine.sort((a, b) => score(b) - score(a))[0];
      S.refreshVoice();
    };
    this.repick = () => { this.stop(); this.lags = []; this.skip = 1; pick(); };   // le joueur a changé de langue
    pick();
    try { speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { speechSynthesis.onvoiceschanged = pick; }
  },
  ready() { return this.ok && !!this.voice && !this.broken; },
  active() { return this.pref && this.unlocked && this.ready() && !Sound.quiet; },
  unlock() {                                     // au premier appui du joueur
    if (this.unlocked || !this.ready()) return;
    this.unlocked = true;
    this.speak('.', 1, 1, 0, true);              // « phrase » muette d'échauffement (débloque iOS)
    Sound.level(); S.refreshVoice();
  },
  stop() {
    if (!this.ok) return;
    if (this.cur) this.cur.dead = true;
    try { speechSynthesis.cancel(); } catch (e) { /* rien */ }
  },
  say(text, moon) { if (this.active()) this.speak(text, moon ? 0.7 : 1.6, moon ? 0.85 : 1.3, 1, false); },
  quip(list, moon) { this.say(list[Math.floor(Math.random() * list.length)], moon); },   // au hasard : ce n'est pas du gameplay
  speak(text, pitch, rate, vol, warmup) {
    const sp = speechSynthesis;
    if (this.cur) this.cur.dead = true;
    try { if (sp.speaking || sp.pending || (this.cur && !this.cur.ended)) sp.cancel(); } catch (e) { /* rien */ }   // jamais deux phrases empilées
    const u = new SpeechSynthesisUtterance(text);
    u.voice = this.voice; u.lang = this.voice.lang || S.LANG; u.pitch = pitch; u.rate = rate; u.volume = vol;
    const t0 = performance.now();
    u.onstart = () => { u.started = true; if (!u.dead && !warmup) this.measure((performance.now() - t0) / 1000); };
    u.onend = u.onerror = () => { u.ended = true; };
    this.cur = u;
    try { sp.speak(u); } catch (e) { this.fail(); return; }
    if (!warmup) setTimeout(() => { if (!u.started && !u.dead) this.measure(0.6); }, 600);   // rien entendu : gros retard
  },
  measure(sec) {                                 // moyenne glissante ; trop grand ou trop instable → on coupe la voix
    if (this.skip > 0) { this.skip--; return; }  // la toute première phrase sert d'échauffement
    this.lags.push(sec); if (this.lags.length > 8) this.lags.shift();
    const n = this.lags.length, avg = this.lags.reduce((a, b) => a + b, 0) / n;
    this.lead = clamp(avg, 0, VOICE_MAX_LAG);
    const srt = this.lags.slice().sort((a, b) => a - b), spread = n >= 4 ? srt[n - 2] - srt[1] : 0;
    if (n >= 3 && (avg > VOICE_MAX_LAG || spread > VOICE_MAX_LAG)) this.fail();
  },
  fail() {                                       // on garde les sons 8-bit
    if (this.broken) return;
    this.broken = true; this.stop(); Sound.level(); S.refreshVoice();
    S.toast(L.voiceLag);
  }
};
const sayable = t => { const x = t.toLowerCase(), i = x.search(/\p{L}/u); return i < 0 ? x : x.slice(0, i) + x.charAt(i).toUpperCase() + x.slice(i + 1); };
function sayEvent(ev) {                            // ce que dit la voix pour un mot du chant
  const w = S.watcher;
  if (!Voice.active() || ev.t < w.t - 0.15) return;   // trop tard : on saute ce mot (le jeu ne l'attend jamais)
  const moon = w.type === 'moon';
  Voice.say(ev.kind === 'num' ? SAY.num[ev.n] : ev.kind === 'trigger' ? (moon ? SAY.moon : SAY.sun)
            : sayable(ev.text), moon);   // « SOLDES ! » → « Soldes ! », « ¡POLLO! » → « ¡Pollo! »
}

Object.assign(S, { SAY, Voice, sayEvent });
})(window.Soleil);
