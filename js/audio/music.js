/* js/audio/music.js — Musique 8-bit du boss et petits jingles du mode Niveaux, générés en Web Audio (aucun fichier).
   La musique passe par sa propre « prise » de volume (baissée pendant le chant, pour bien entendre les mots)
   et respecte le bouton 🔊 (Sound.muted) et les silences du jeu : pub, pause, onglet caché (Sound.quiet). */
(function (S) {
'use strict';
const { Sound } = S;

// ---------- Réglages ----------
const BPM = 138;                      // tempo de la musique du boss
const VOL = 0.13, VOL_DUCK = 0.045;   // volume normal, et pendant que le soleil chante
const AHEAD = 0.25;                   // on programme les notes 0,25 s à l'avance
// La mélodie : 4 accords (la mineur, fa, sol, mi), une croche = un pas. 0 = silence. Fréquences en Hz.
const N = { A2: 110, E2: 82.41, F2: 87.31, G2: 98, A3: 220, E3: 164.8, F3: 174.6, G3: 196, A4: 440, B4: 493.9, C5: 523.3,
            D5: 587.3, E5: 659.3, F4: 349.2, G4: 392, Gs4: 415.3, E4: 329.6, A5: 880 };
const CHORDS = [
  { bass: [N.A2, N.A2, N.A3, N.A2], arp: [N.A4, N.C5, N.E5, N.C5] },
  { bass: [N.F2, N.F2, N.F3, N.F2], arp: [N.F4, N.A4, N.C5, N.A4] },
  { bass: [N.G2, N.G2, N.G3, N.G2], arp: [N.G4, N.B4, N.D5, N.B4] },
  { bass: [N.E2, N.E2, N.E3, N.E2], arp: [N.E4, N.Gs4, N.B4, N.E5] }
];
const LEAD = [N.E5, 0, N.D5, N.C5, N.D5, 0, N.E5, 0, N.C5, 0, N.A4, 0, N.B4, N.C5, N.D5, 0,
              N.B4, 0, N.G4, 0, N.Gs4, 0, N.B4, N.E5, N.A5, 0, N.E5, 0, N.C5, N.B4, N.A4, 0];
// Monde 2 : le Soleil Farceur joue une musique de cirque (do majeur, « oum-pa »)
const C3 = 130.8, G2 = 98, F2 = 87.31, C4 = 261.6, E4 = 329.6, G4 = 392, A4 = 440, B4 = 493.9, C5 = 523.3, D5 = 587.3, E5 = 659.3, F5 = 698.5, G5 = 784, A5 = 880;
const TRACKS = {
  cool: { bpm: BPM, chords: CHORDS, lead: LEAD },
  farceur: { bpm: 152,
    chords: [{ bass: [C3, 0, G2, 0], arp: [C4, E4, G4, E4] }, { bass: [G2, 0, 123.5, 0], arp: [B4 / 2, 293.7, G4, 293.7] },
             { bass: [F2, 0, C3, 0], arp: [F2 * 4, A4, C5, A4] }, { bass: [G2, 0, G2 * 2, 0], arp: [G4, B4, 293.7 * 2, B4] }],
    lead: [E5, G5, E5, C5, D5, 0, B4, 0, C5, E5, G5, A5, G5, 0, E5, 0, F5, A5, F5, D5, E5, 0, C5, 0, D5, F5, E5, D5, C5, 0, 0, 0] }
};

const Music = {
  on: false, gain: null, next: 0, step: 0, duck: false,
  // une note dans la prise de la musique
  note(f, t, d, type, v) {
    const c = Sound.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.gain); o.start(t); o.stop(t + d + 0.03);
  },
  hit(t, hi) {                        // percussion : grosse caisse (tonalité qui tombe) ou charleston (bruit aigu)
    const c = Sound.ctx;
    if (!hi) { this.note(130, t, 0.12, 'sine', 0.5); return; }
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = Sound.noiseBuf; fl.type = 'highpass'; fl.frequency.value = 6000;
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(fl); fl.connect(g); g.connect(this.gain); s.start(t, Math.random() * 0.5); s.stop(t + 0.07);
  },
  start(track = 'cool') {
    if (!Sound.ctx || this.on) return;
    this.T = TRACKS[track] || TRACKS.cool;
    if (!this.gain) { this.gain = Sound.ctx.createGain(); this.gain.connect(Sound.out); }
    this.gain.gain.cancelScheduledValues(Sound.ctx.currentTime);
    this.gain.gain.setValueAtTime(VOL, Sound.ctx.currentTime);
    this.on = true; this.step = 0; this.next = Sound.ctx.currentTime + 0.1;
  },
  stop(fade = 0.4) {
    if (!this.on) return;
    this.on = false;
    if (this.gain && Sound.ctx) this.gain.gain.setTargetAtTime(0.0001, Sound.ctx.currentTime, fade / 3);
  },
  setDuck(d) {                        // plus bas pendant le chant du soleil
    if (!this.on || d === this.duck || !this.gain) return;
    this.duck = d;
    this.gain.gain.setTargetAtTime(d ? VOL_DUCK : VOL, Sound.ctx.currentTime, 0.08);
  },
  tick() {                            // appelée à chaque image : programme les prochaines notes
    if (!this.on || !Sound.ctx) return;
    if (Sound.quiet) { this.next = Sound.ctx.currentTime + 0.1; return; }
    const T = this.T || TRACKS.cool, st = 60 / T.bpm / 2;   // une croche
    if (this.next < Sound.ctx.currentTime - 0.1) this.next = Sound.ctx.currentTime + 0.05;   // retour d'arrière-plan : pas de rafale de notes
    while (this.next < Sound.ctx.currentTime + AHEAD) {
      const t = this.next, i = this.step, ch = T.chords[Math.floor(i / 8) % 4];
      if (ch.bass[i % 4]) this.note(ch.bass[i % 4], t, st * 0.9, 'square', 0.16);
      this.note(ch.arp[i % 4] * 2, t + st / 2, st * 0.45, 'triangle', 0.05);
      const ld = T.lead[i % T.lead.length];
      if (ld && Math.floor(i / 32) % 2 === 1) this.note(ld, t, st * 0.95, 'square', 0.07);   // la mélodie, un tour sur deux
      this.hit(t, i % 2 === 1);
      this.step++; this.next += st;
    }
  }
};

// ---------- Jingles et bruitages du mode Niveaux ----------
Object.assign(Sound, {
  starOn(i) { [784, 988, 1175].slice(0, 1).forEach(f => this.tone(f * Math.pow(1.26, i), 0.25, 'square', 0.12)); this.tone(1568 * Math.pow(1.26, i), 0.35, 'triangle', 0.1, 0, 0.06); },
  starOff() { this.tone(260, 0.16, 'triangle', 0.08); },
  levelWin() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'square', 0.1, 0, i * 0.09)); },
  fanfare() {
    [[392, 0], [392, 0.12], [392, 0.24], [523, 0.36], [659, 0.6], [784, 0.84], [1047, 1.1]].forEach(([f, d]) => this.tone(f, 0.3, 'square', 0.12, 0, d));
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.9, 'triangle', 0.08, 0, 1.1 + i * 0.02));
  },
  firework() { this.noise(0.5, 0.14, 'lowpass', 900, 150, 0.8); this.tone(1800 + Math.random() * 900, 0.3, 'sine', 0.04, 600, 0.05); },
  glasses() { this.tone(300, 0.12, 'square', 0.12, 900); this.noise(0.08, 0.15, 'highpass', 3000, 0, 1, 0.12); },
  passed() { this.tone(880, 0.08, 'triangle', 0.08, 1320); },
  passedBy() { this.tone(500, 0.1, 'triangle', 0.06, 330); },
  lock() { this.tone(180, 0.12, 'square', 0.1, 140); this.noise(0.05, 0.1, 'bandpass', 2400, 0, 2, 0.02); },
  tick() { this.tone(1200, 0.04, 'square', 0.05); },
  // ---- Monde 2 : le vrai retour, les tentations, la boue, le parc
  ding() { this.tone(784, 0.16, 'triangle', 0.16); this.tone(1175, 0.32, 'triangle', 0.16, 0, 0.11); this.tone(2350, 0.25, 'sine', 0.03, 0, 0.11); },   // le « ding » : seulement au VRAI retour
  creak() { this.tone(190, 0.26, 'sawtooth', 0.05, 120); this.noise(0.22, 0.04, 'bandpass', 900, 0, 6); },   // faux retour : il tourne à moitié
  ha() { this.tone(330, 0.18, 'square', 0.14, 520); this.noise(0.1, 0.12, 'highpass', 1500, 0, 1); },
  aah(k) { this.tone(k > 1 ? 392 : 330, k > 1 ? 0.4 : 0.45, 'triangle', 0.07 + 0.04 * k, k > 1 ? 560 : 420); },
  atchoum() { this.noise(0.35, 0.22, 'bandpass', 2200, 700, 1.2); this.tone(720, 0.3, 'square', 0.1, 180, 0.02); },
  nyah() { [660, 550, 660, 550].forEach((f, i) => this.tone(f, 0.09, 'square', 0.06, 0, i * 0.11)); },
  twinkle() { this.tone(1568, 0.12, 'triangle', 0.05); this.tone(2093, 0.16, 'triangle', 0.04, 0, 0.06); },
  pfff() { this.noise(0.45, 0.1, 'lowpass', 1400, 300, 1); },
  boom() { this.noise(0.5, 0.3, 'lowpass', 600, 80, 0.8); this.tone(90, 0.4, 'sine', 0.25, 45); },
  splotch() { this.noise(0.22, 0.16, 'lowpass', 420, 160, 1); this.tone(150, 0.18, 'sine', 0.12, 70); },
  flap() { for (let i = 0; i < 4; i++) this.noise(0.05, 0.05, 'bandpass', 1200 + i * 150, 0, 2, i * 0.06); },
  boing() { this.tone(180, 0.45, 'sine', 0.2, 620); this.tone(620, 0.3, 'sine', 0.1, 260, 0.2); },
  sangFroid() { [880, 1109, 1319].forEach((f, i) => this.tone(f, 0.12, 'square', 0.07, 0, i * 0.07)); },
  zip() { this.tone(600, 0.12, 'square', 0.07, 1400); },
  buzz(on) {                                        // la mouche : un bourdonnement qui tourne en boucle
    if (!this.ctx) return;
    if (on && !this.fly && !this.quiet) {
      const o = this.ctx.createOscillator(), l = this.ctx.createOscillator(), lg = this.ctx.createGain(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 210; l.frequency.value = 17; lg.gain.value = 40;
      l.connect(lg); lg.connect(o.frequency); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.025, this.ctx.currentTime, 0.05);
      o.connect(g); g.connect(this.out); o.start(); l.start();
      this.fly = { o, l, g };
    } else if (!on && this.fly) {
      const f = this.fly; this.fly = null;
      f.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      setTimeout(() => { try { f.o.stop(); f.l.stop(); } catch (e) { /* déjà arrêté */ } }, 300);
    }
  },
  buzzPitch(k) { if (this.fly) this.fly.o.frequency.setTargetAtTime(190 + 90 * k, this.ctx.currentTime, 0.05); }
});

S.Music = Music;
})(window.Soleil);
