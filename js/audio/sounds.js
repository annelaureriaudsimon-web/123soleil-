/* js/audio/sounds.js — Sons 8-bit générés dans le navigateur (aucun fichier) */
(function (S) {
'use strict';
const { store } = S;   // déjà chargés

/* ---------- 8. Sons 8-bit générés dans le navigateur (aucun fichier) ---------- */
const Sound = {
  ctx: null, out: null, noiseBuf: null, muted: !!store.get('mute', false),
  hush: new Set(),                               // silences du jeu (pub, pause, onglet caché) : le choix 🔊 du joueur n'y est pour rien
  get quiet() { return this.muted || this.hush.size > 0; },
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { S.Voice.unlock(); return; }                    // pas de sons 8-bit : la voix peut quand même marcher
      try { this.ctx = new AC(); } catch (e) { S.Voice.unlock(); return; }
      this.out = this.ctx.createGain();
      this.out.gain.value = this.quiet ? 0 : 0.55;
      this.out.connect(this.ctx.destination);
      const n = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, n, n);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    S.Voice.unlock();                              // la voix se débloque au même geste (obligatoire sur iPhone)
  },
  setMute(m) {                                   // 🔊 coupe tout, voix comprise
    this.muted = m; store.set('mute', m);
    this.level();
    if (m) S.Voice.stop();
    S.refreshVoice();
  },
  level() {                                      // sons 8-bit un peu moins forts quand la voix est active
    if (this.out) this.out.gain.setTargetAtTime(this.quiet ? 0 : S.Voice.active() ? 0.4 : 0.55, this.ctx.currentTime, this.hush.size ? 0.01 : 0.03);
  },
  silence(why, on) {                             // coupe (ou rend) TOUT le son pour une raison du jeu ; la voix s'arrête net
    if (on === this.hush.has(why)) return;
    if (on) { this.hush.add(why); S.Voice.stop(); } else this.hush.delete(why);
    this.level();
  },
  tone(f, d, type = 'triangle', v = 0.2, f2 = 0, delay = 0) {
    const c = this.ctx; if (!c || this.quiet) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d, v = 0.2, type = 'bandpass', f = 1000, f2 = 0, q = 1, delay = 0) {
    const c = this.ctx; if (!c || this.quiet) return;
    const t = c.currentTime + delay, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf;
    fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(this.out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
  },
  chant(ev, moon) {
    if (ev.kind === 'num') this.tone(moon ? [262, 294, 330][ev.n] : [523, 587, 659][ev.n], 0.2, moon ? 'sine' : 'triangle', 0.24);
    else if (moon) { this.tone(440, 0.55, 'sine', 0.3, 220); this.tone(660, 0.5, 'triangle', 0.08, 330); }
    else { this.tone(1047, 0.32, 'square', 0.12); this.tone(523, 0.32, 'triangle', 0.16); }   // trigger et pièges : même son !
  },
  laugh() { [0, 0.11, 0.22].forEach((d, i) => this.tone(520 - i * 40, 0.09, 'square', 0.1, 760 - i * 60, d)); },
  hmm() { this.tone(210, 0.4, 'triangle', 0.2, 175); },
  hop() { this.tone(500, 0.14, 'square', 0.16, 1300); this.noise(0.15, 0.12, 'bandpass', 600, 2400, 1.2); },
  whoosh(d) { this.noise(Math.max(0.2, d), 0.12, 'bandpass', 300, 2200, 1.2); },
  unwhoosh() { this.noise(0.25, 0.06, 'bandpass', 1800, 400, 1.2); },
  heart() { this.tone(110, 0.12, 'triangle', 0.22, 70); this.tone(100, 0.1, 'triangle', 0.16, 65, 0.15); },
  step() { this.noise(0.04, 0.05, 'highpass', 1800); },
  mud() { this.noise(0.09, 0.09, 'lowpass', 500, 200, 1); },
  ice() { this.noise(0.45, 0.06, 'highpass', 3500, 7000, 0.6); },
  skid() { this.noise(0.18, 0.1, 'bandpass', 900, 500, 0.8); },
  ouf(k) { const b = 880 * Math.pow(1.06, Math.min(k, 8)); this.tone(b, 0.12, 'sine', 0.18); this.tone(b * 1.5, 0.18, 'sine', 0.16, 0, 0.08); },
  star() { this.tone(1568, 0.08, 'sine', 0.08); },
  busted() { this.tone(1200, 0.25, 'square', 0.1, 300); },
  sizzle() { this.noise(0.9, 0.3, 'highpass', 2500, 6000, 0.7); this.tone(180, 0.5, 'sawtooth', 0.2, 50); },
  record() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.18, 0, i * 0.08)); },
  mission() { [659, 831, 988, 1319].forEach((f, i) => this.tone(f, 0.16, 'square', 0.08, 0, i * 0.07)); },
  boss() { for (let i = 0; i < 9; i++) this.noise(0.06, 0.16, 'bandpass', 180, 0, 1.5, i * 0.055); this.tone(98, 0.7, 'sawtooth', 0.1, 196, 0.45); },
  phase() { this.tone(660, 0.3, 'sine', 0.15); this.tone(990, 0.4, 'sine', 0.12, 0, 0.12); },
  swap() { this.noise(1.0, 0.06, 'lowpass', 600, 200, 0.7); },
  buy() { [784, 1047, 1568].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.15, 0, i * 0.08)); },
  nope() { this.tone(220, 0.18, 'square', 0.1, 160); },
  start() { this.tone(392, 0.1, 'triangle', 0.12); this.tone(523, 0.14, 'triangle', 0.12, 0, 0.07); },
  catchStar(big) {                               // étoile attrapée : petit arpège qui brille
    (big ? [784, 988, 1175, 1568, 1976] : [988, 1319, 1760]).forEach((f, i) => this.tone(f, 0.13, 'sine', big ? 0.16 : 0.13, 0, i * 0.05));
  },
  doubled() { [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.16, 'square', 0.07, 0, i * 0.06)); },
  poof() { this.noise(0.25, 0.08, 'bandpass', 1300, 300, 0.9); },
  cloud() { this.noise(1.0, 0.05, 'lowpass', 520, 180, 0.6); },
  wind(level) {                                  // vent continu dans la descente (0 = silence)
    const c = this.ctx; if (!c || !this.noiseBuf) return;
    if (Math.abs(level - (this.windL || 0)) < 0.03 && level !== 0) return;
    if (!this.windG) {
      if (level <= 0) return;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noiseBuf; src.loop = true; f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.7; g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.out); src.start();
      this.windG = g; this.windF = f;
    }
    if (level === this.windL) return;
    this.windL = level;
    this.windG.gain.setTargetAtTime(level * 0.17, c.currentTime, 0.08);
    this.windF.frequency.setTargetAtTime(450 + level * 1000, c.currentTime, 0.1);
  }
};
const audioOK = () => !!Sound.ctx && Sound.ctx.state === 'running' && !Sound.muted;

Object.assign(S, { Sound, audioOK });
})(window.Soleil);
