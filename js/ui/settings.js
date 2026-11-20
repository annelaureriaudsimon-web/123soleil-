/* js/ui/settings.js — Boutons son 🔊 et voix 🗣️ */
(function (S) {
'use strict';
const { L, $, store, Sound, Voice, toast } = S;   // déjà chargés

const muteBtn = $('mute');
function refreshMute() {
  muteBtn.textContent = Sound.muted ? '🔇' : '🔊';
  const label = Sound.muted ? L.unmute : L.mute;
  muteBtn.setAttribute('aria-label', label); muteBtn.title = label;
  $('locker').setAttribute('aria-label', L.locker); $('locker').title = L.locker;
  $('lock2').setAttribute('aria-label', L.locker); $('pClose').setAttribute('aria-label', L.close);
  $('homeBtn').setAttribute('aria-label', L.home); $('homeBtn').title = L.home;
  refreshVoice();
}
function refreshVoice() {                         // 🗣️ barré si la voix est coupée, indisponible ou si tout le son est coupé
  const b = $('voice');
  const on = Voice.pref && Voice.ready() && !Sound.muted;
  b.classList.toggle('off', !on);
  const label = !Voice.ready() ? L.voiceNoneLbl : Voice.pref ? L.voiceOffBtn : L.voiceOnBtn;
  b.setAttribute('aria-label', label); b.title = label;
}
function toggleMute() { Sound.unlock(); Sound.setMute(!Sound.muted); refreshMute(); }
muteBtn.addEventListener('click', e => { e.stopPropagation(); toggleMute(); muteBtn.blur(); });
muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
const voiceBtn = $('voice');
voiceBtn.addEventListener('click', e => {         // 🗣️ : la voix seulement (mémorisé)
  e.stopPropagation(); Sound.unlock(); voiceBtn.blur();
  if (!Voice.ok || !Voice.voice) { toast(L.voiceNone, true); refreshVoice(); return; }
  if (Voice.broken) { toast(L.voiceLag, true); return; }
  Voice.pref = !Voice.pref; store.set('voice', Voice.pref);
  if (!Voice.pref) Voice.stop();
  else { Voice.unlock(); if (Sound.muted) toggleMute(); }
  Sound.level(); refreshVoice();
});
voiceBtn.addEventListener('pointerdown', e => e.stopPropagation());

Object.assign(S, { muteBtn, refreshMute, refreshVoice, toggleMute, voiceBtn });
})(window.Soleil);
