/* ======================================================================
   Organ: the sound and the beat shared by CantusFirmus and ChoirBook.
   One playback engine for both: the organ voice (registers, drawbars, room),
   the metronome (hand, pendulum, audible tick, count-in), tempo with tap and
   the heart, loop, volume and the pitch of a′. Both apps load this file; the
   sound settings and the beat display are shared between them, the tempo is
   each app's own. Also here: the mensural reading (readValues) and the
   writing of sounding values as mensural notes (notateValues), so a melody
   can pass from one app to the other.
   ====================================================================== */
(function(){
'use strict';
const Organ = {};
const SRC = (document.currentScript && document.currentScript.src) || location.href;
let S = null;             /* the app's settings object (its "ui" or "st") */
let H = {save(){}, replay(){}, toast(){}, playing(){}, loopChanged(){}, units: ['Mx','L','B','S','M','Sm','F'], unitIcon: null, unitName: k => k};
const $ = s => document.querySelector(s);
const pressed = (el, on) => { if (el) el.setAttribute('aria-pressed', on ? 'true' : 'false'); };

/* settings both apps share (kept under one key, so the organ sounds the same in both) */
const SHARED_KEY = 'organ:shared:v1';
const SHARED = ['vol', 'reg', 'bright', 'room', 'atk', 'rel', 'chiff', 'ens', 'wind', 'scoop', 'draw', 'ref', 'beatHand', 'beatPend', 'beatTick', 'handOp', 'handSize'];
Organ.DEFAULTS = {tempo: 60, unit: 'S', loop: false, countIn: 0, beatHand: true, beatPend: false, beatTick: false, handOp: 0.3, handSize: 1,
  ref: 440, vol: 70, reg: 'custom', bright: 50, room: 40, atk: 82, rel: 10, chiff: 7, ens: 0.3, wind: 10, scoop: 5,
  draw: [100, 71, 55, 48, 37, 22, 12, 8, 0, 0, 0, 0], setOpen: false};
Organ.init = function(settings, hooks){
  S = settings; Object.assign(H, hooks || {});
  for (const [k, v] of Object.entries(Organ.DEFAULTS)) if (S[k] === undefined) S[k] = Array.isArray(v) ? v.slice() : v;
  Organ.loadShared();
  return Organ;
};
Organ.loadShared = function(){
  let o = null; try { o = JSON.parse(localStorage.getItem(SHARED_KEY) || 'null'); } catch (e) {}
  if (!o) return;
  for (const k of SHARED) {
    const v = o[k];
    if (v === undefined || v === null) continue;
    if (k === 'draw') { if (Array.isArray(v) && v.length === 12 && v.every(x => x >= 0 && x <= 100)) S.draw = v.slice(); continue; }
    if (k === 'reg') { if (REGISTERS[v]) S.reg = v; continue; }
    if (typeof Organ.DEFAULTS[k] === 'boolean') { if (typeof v === 'boolean') S[k] = v; continue; }
    if (typeof v === 'number' && isFinite(v)) S[k] = v;
  }
};
Organ.saveShared = function(){
  if (!S) return;
  const o = {}; for (const k of SHARED) o[k] = S[k];
  try { localStorage.setItem(SHARED_KEY, JSON.stringify(o)); } catch (e) {}
};
/* the other app may change the shared settings while this one is open in another tab */
window.addEventListener('storage', e => { if (e.key === SHARED_KEY && S) { Organ.loadShared(); Organ.sync(); } });

/* ------------------------------------------------------------------ */
/* Sound                                                               */
/* Synth.voice() is the one place that makes a tone.                   */
/* ------------------------------------------------------------------ */
const audio = {ctx: null, master: null, voices: [], raf: 0, timeline: null, aud: null};
Organ.audio = audio;
function ensureAudio(){
  if (!audio.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = masterLevel();
    audio.master.connect(audio.ctx.destination);
    /* organ bus: dry signal plus a church-like room (a generated impulse response) */
    audio.bus = audio.ctx.createGain();
    const lp = audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500; lp.Q.value = 0.5;
    audio.bus.connect(lp); lp.connect(audio.master); audio.lp = lp; lp.frequency.value = lpFreq();
    /* a stone room: a few early reflections, then a dense tail that loses its treble as it fades (about 3.5 s) */
    const sr = audio.ctx.sampleRate, len = Math.floor(sr * 5), pre = Math.floor(sr * 0.028), ir = audio.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let y = 0;
      for (let i = pre; i < len; i++) {
        const t = (i - pre) / sr;
        const a = 0.5 * Math.exp(-t * 0.9) + 0.03;           /* low-pass coefficient: bright at first, dark later */
        y += a * ((Math.random() * 2 - 1) - y);
        d[i] = y * Math.exp(-t * 1.97) * Math.min(1, t * 40);
      }
      [0.013, 0.021, 0.034, 0.047, 0.061, 0.083].forEach((dt, j) => { d[pre + Math.floor((dt + c * 0.004) * sr)] += (j % 2 ? -1 : 1) * 0.5 / (1 + j * 0.4); });
    }
    const conv = audio.ctx.createConvolver(); conv.buffer = ir;
    audio.wet = audio.ctx.createGain(); audio.wet.gain.value = roomLevel();
    lp.connect(conv); conv.connect(audio.wet); audio.wet.connect(audio.master);
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}
const roomLevel = () => S.room / 100 * 2.2;
const masterLevel = () => Math.pow(S.vol / 100, 1.6) * 0.9;
/* Organ registers: strength of each harmonic (1 = the note itself, 2 = its octave, ...) */
const REGISTERS = {
  gedackt:   {name: "Gedackt 8′ (stopped flute)", h: [1, .03, .28, .02, .1, .01, .035]},
  principal: {name: "Principal 8′",               h: [1, .8, .6, .5, .35, .3, .22, .16, .12, .08, .06, .04]},
  plenum:    {name: "Principal chorus (8′ 4′ 2′)", h: [1, .9, .55, .85, .3, .4, .25, .55, .2, .25, .15, .3]},
  flute:     {name: "Open flute 8′",              h: [1, .35, .12, .05, .02]},
  regal:     {name: "Regal (soft reed)",          h: Array.from({length: 12}, (_, i) => Math.pow(i + 1, -0.85))},
  sine:      {name: "Sine",                       h: [1]},
  custom:    {name: "Your own (drawbars)",        get h(){ return S.draw.map(v => v / 100); }}
};
/* Recorded pipe organ: real pipes, sampled (games/shared/organ-samples, made from the SoundFont
   "Jeux d'orgues 2.1"; see the manifest there). Each registration lists its stops; a stop's file is
   fetched only when a registration that uses it is chosen. h is the synthesised sound used until then. */
const SAMPLED = {
  'rec-montre':    {name: 'Montre 8′',                       sf: ['i-montre-8']},
  'rec-bordun':    {name: 'Bourdon 8′',                      sf: ['i-bordun-8']},
  'rec-salicional':{name: 'Salicional 8′',                   sf: ['i-salicional-8']},
  'rec-fonds8':    {name: 'Montre and Bourdon 8′',           sf: ['i-montre-8', 'i-bordun-8']},
  'rec-fonds84':   {name: 'Bourdon 8′, Flûte 4′',            sf: ['i-bordun-8', 'i-floete-4']},
  'rec-prin84':    {name: 'Principals 8′ 4′',                sf: ['i-montre-8', 'i-octav-4']},
  'rec-prin842':   {name: 'Principals 8′ 4′ 2′',             sf: ['i-montre-8', 'i-octav-4', 'i-doublette-2']},
  'rec-pos84':     {name: 'Positive: Bourdon 8′, Prestant 4′', sf: ['ii-bordun-8', 'ii-prestant-4']},
  'rec-nazard':    {name: 'Positive: Bourdon 8′, Nazard 2⅔′', sf: ['ii-bordun-8', 'ii-nazard-2-2-3']},
  'rec-pleinjeu':  {name: 'Plein jeu',                       sf: ['i-plein-jeu']},
  'rec-grandplein':{name: 'Grand plein jeu (with 16′)',      sf: ['i-bordun-16', 'i-plein-jeu', 'ii-petit-plein-jeu']},
  'rec-trompette': {name: 'Trompette 8′',                    sf: ['i-trompette-8']},
  'rec-grandjeu':  {name: 'Grand jeu (Cornet, Trompette)',   sf: ['i-cornett', 'i-trompette-8']}
};
for (const [k, v] of Object.entries(SAMPLED)) REGISTERS[k] = {name: v.name + ' (recorded)', sf: v.sf, h: REGISTERS.principal.h};
const isSampled = r => !!(REGISTERS[r] && REGISTERS[r].sf);
/* the room's treble: the synthesised organ is dulled a little; the recorded one follows Brightness */
const lpFreq = () => isSampled(S.reg) ? 4000 * Math.pow(2, S.bright / 100 * 2.3) : 7500;
function syncLp(){ if (audio.lp) audio.lp.frequency.setTargetAtTime(lpFreq(), audio.ctx.currentTime, 0.03); }
const FEET = ["8′", "4′", "2⅔′", "2′", "1⅗′", "1⅓′", "1⅐′", "1′", "8/9′", "4/5′", "8/11′", "2/3′"];
const padDraw = h => Array.from({length: 12}, (_, i) => Math.round((h[i] || 0) * 100));
/* amplitudes of the harmonics for the current register, tilted by the brightness setting */
function organAmps(){
  const base = REGISTERS[S.reg].h;
  return base.map((a, i) => a * Math.pow(2, (S.bright / 100 - 0.5) * i * 0.55));
}
let chiffBuf = null;
let noiseBuf = null;
const Synth = {
  level: 0.28,
  /* Each harmonic is its own sine with its own small tuning error and its own speech time: the upper
     ones speak a little sooner, the whole pipe starts a few cents sharp and settles, and a breath of
     wind and a puff of air accompany it. Together that is what makes it a pipe and not a tone. */
  voice(ctx, dest, freq, t0, t1){
    const out = ctx.createGain();
    const atk = S.atk / 1000, rel = Math.min(S.rel / 1000, (t1 - t0) * 0.4);
    out.gain.setValueAtTime(1, t0);
    out.gain.setValueAtTime(1, Math.max(t0 + 0.01, t1 - rel));
    out.gain.linearRampToValueAtTime(0, t1);
    const amps = organAmps();
    const power = Math.sqrt(amps.reduce((s, a) => s + a * a, 0)) || 1, parts = [];
    amps.forEach((a, i) => {
      const k = i + 1, f = freq * k;
      if (a < 0.008 || f > 15000) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(f, t0);
      const cents = (Math.random() * 2 - 1) * S.ens;
      o.detune.setValueAtTime(cents + S.scoop, t0);
      o.detune.setTargetAtTime(cents, t0, 0.035);
      const at = Math.max(0.004, atk * (1 - 0.4 * Math.min(1, i / 11)));
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(this.level * 0.7 * a / power, t0 + at);
      o.connect(g); g.connect(out);
      o.start(t0); o.stop(t1 + 0.03); parts.push(o);
    });
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    /* the breath of the wind in the pipe */
    if (S.wind > 0) {
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(6000, freq * 2.5); bp.Q.value = 0.9;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0, t0); ng.gain.linearRampToValueAtTime(0.1 * this.level * S.wind / 100, t0 + Math.max(0.03, atk));
      n.connect(bp); bp.connect(ng); ng.connect(out);
      n.start(t0); n.stop(t1 + 0.03); parts.push(n);
    }
    /* the puff of air as the pipe speaks */
    if (S.chiff > 0) {
      const n = ctx.createBufferSource(); n.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, freq * 3); bp.Q.value = 3;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.5 * this.level * S.chiff / 100, t0);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      n.connect(bp); bp.connect(ng); ng.connect(out);
      n.start(t0, Math.random() * 0.8); n.stop(t0 + 0.12); parts.push(n);
    }
    out.connect(dest);
    return {osc: {stop(t){ parts.forEach(p => { try { p.stop(t); } catch (e) {} }); }}, g: out, t1};
  }
};
const Sampler = {
  base: new URL('organ-samples/', SRC).href,
  man: null, manP: null, bufs: {}, loads: {}, failed: false,
  manifest(){
    if (!this.manP) this.manP = fetch(this.base + 'manifest.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(m => (this.man = m));
    return this.manP;
  },
  decode(ab){
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = new OAC(1, 1, 44100);
    return new Promise((ok, no) => { const p = c.decodeAudioData(ab, ok, no); if (p && p.then) p.then(ok, no); });
  },
  loadStop(slug){
    if (!this.loads[slug]) this.loads[slug] = this.manifest()
      .then(m => fetch(this.base + m.stops[slug].file))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => this.decode(ab))
      .then(b => (this.bufs[slug] = b))
      .catch(e => { delete this.loads[slug]; throw e; });
    return this.loads[slug];
  },
  /* the size still to download for a registration, in MB */
  pendingMB(reg){
    if (!this.man) return null;
    return REGISTERS[reg].sf.filter(s => !this.bufs[s]).reduce((a, s) => a + this.man.stops[s].bytes, 0) / 1e6;
  },
  ready(reg){ return isSampled(reg) && REGISTERS[reg].sf.every(s => this.bufs[s]); },
  prepare(reg, quiet){
    if (!isSampled(reg)) return Promise.resolve(false);
    if (this.ready(reg)) return Promise.resolve(true);
    const loud = !quiet;
    if (loud) this.manifest().then(() => { if (!this.ready(reg)) H.toast(`Loading the recorded organ (${this.pendingMB(reg).toFixed(1)} MB)…`); }, () => {});
    return Promise.all(REGISTERS[reg].sf.map(s => this.loadStop(s))).then(() => true, () => {
      if (loud) H.toast('The recorded organ could not be loaded; the synthesised organ plays instead.');
      return false;
    });
  },
  /* the same shape as Synth.voice: a note of the recorded stops, from t0 to t1 */
  voice(ctx, dest, f, t0, t1){
    const reg = REGISTERS[S.reg], m = this.man;
    const midi = 69 + 12 * Math.log2(f / S.ref), key = Math.round(midi);
    const stops = reg.sf.map(s => m.stops[s]);
    /* one loudness for every registration; the stops keep their balance within it */
    const gain = 0.16 / Math.sqrt(stops.reduce((a, s) => a + s.rms * s.rms, 0));
    const out = ctx.createGain(), parts = [];
    const rel = Math.max(0.06, Math.min(S.rel / 1000, 0.6));
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(gain, t0 + 0.006);
    out.gain.setValueAtTime(gain, Math.max(t0 + 0.01, t1));
    out.gain.linearRampToValueAtTime(0, t1 + rel);
    reg.sf.forEach((slug, i) => {
      const st = stops[i], buf = this.bufs[slug], zs = st.zones;
      let z = zs.find(z => key >= z.lo && key <= z.hi);
      if (!z) {
        const lo = zs[0], hi = zs[zs.length - 1];
        if (key < lo.lo) { if (lo.lo > 48) return; z = lo; } else z = hi;   /* a treble stop (Cornet) is silent below its compass */
      }
      const sr = m.sr, src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      src.loopStart = (z.off + z.ls) / sr; src.loopEnd = (z.off + z.le) / sr;
      /* the organ stands about 5 cents below a′ = 440; tuned up to the chosen a′ */
      src.playbackRate.value = Math.pow(2, (midi - z.root) / 12 + (z.tune + 5) / 1200);
      src.connect(out);
      src.start(t0, z.off / sr); src.stop(t1 + rel + 0.05); parts.push(src);
    });
    out.connect(dest);
    return {osc: {stop(t){ parts.forEach(p => { try { p.stop(t); } catch (e) {} }); }}, g: out, t1: t1 + rel};
  }
};
/* every note goes through here: the recorded organ when it is chosen and loaded, otherwise the synthesis */
function voice(ctx, dest, f, t0, t1){
  if (isSampled(S.reg)) {
    if (Sampler.ready(S.reg) && Sampler.man) return Sampler.voice(ctx, dest, f, t0, t1);
    Sampler.prepare(S.reg, true);
  }
  return Synth.voice(ctx, dest, f, t0, t1);
}
function silence(v, now){
  try {
    v.g.gain.cancelScheduledValues(now);
    v.g.gain.setValueAtTime(v.g.gain.value, now);
    v.g.gain.linearRampToValueAtTime(0, now + 0.04);
    v.osc.stop(now + 0.06);
  } catch (e) {}
}
const TUNE = [
  {k: 'atk',   label: 'Attack',   min: 0, max: 300, step: 1,   unit: ' ms'},
  {k: 'rel',   label: 'Release',  min: 10, max: 600, step: 5,  unit: ' ms'},
  {k: 'chiff', label: 'Chiff',    min: 0, max: 100, step: 1,   unit: ''},
  {k: 'ens',   label: 'Ensemble', min: 0, max: 12, step: 0.1,  unit: ' ct'},
  {k: 'wind',  label: 'Wind',     min: 0, max: 100, step: 1,   unit: ''},
  {k: 'scoop', label: 'Scoop',    min: 0, max: 30, step: 1,    unit: ' ct'}
];
function buildTune(){
  const box = $('#tune');
  let html = '<div class="tcol"><div class="tg">Pipe speech</div>';
  TUNE.forEach(t => { html += `<label for="tn-${t.k}">${t.label}</label><input type="range" id="tn-${t.k}" min="${t.min}" max="${t.max}" step="${t.step}"><output id="to-${t.k}"></output>`; });
  html += '</div><div class="tcol"><div class="tg">Harmonics, as organ drawbars</div>';
  FEET.forEach((f, i) => { html += `<label for="db-${i}">${f}</label><input type="range" id="db-${i}" min="0" max="100" step="1"><output id="do-${i}"></output>`; });
  box.innerHTML = html + '</div>';
  TUNE.forEach(t => {
    $('#tn-' + t.k).addEventListener('input', e => { S[t.k] = Number(e.target.value); syncTune(); H.save(); });
    $('#tn-' + t.k).addEventListener('change', testTone);
  });
  FEET.forEach((f, i) => {
    $('#db-' + i).addEventListener('input', e => {
      if (S.reg !== 'custom') { if (!isSampled(S.reg)) S.draw = padDraw(REGISTERS[S.reg].h); S.reg = 'custom'; syncLp(); }
      S.draw[i] = Number(e.target.value); syncTune(); H.save();
    });
    $('#db-' + i).addEventListener('change', testTone);
  });
  syncTune();
}
function syncTune(){
  TUNE.forEach(t => { $('#tn-' + t.k).value = S[t.k]; $('#to-' + t.k).textContent = S[t.k] + t.unit; });
  const d = S.reg === 'custom' || isSampled(S.reg) ? S.draw : padDraw(REGISTERS[S.reg].h);
  FEET.forEach((f, i) => { $('#db-' + i).value = d[i]; $('#do-' + i).textContent = d[i]; });
  $('#reg').value = S.reg;
}

/* a′ = S.ref Hz, equal temperament */
const freq = midi => S.ref * Math.pow(2, (midi - 69) / 12);
function testTone(){
  const ctx = ensureAudio();
  if (!ctx || audio.timeline) return;
  const now = ctx.currentTime;
  if (audio.aud) silence(audio.aud, now);
  audio.aud = voice(ctx, audio.bus, freq(55), now + 0.01, now + 0.9);
  audio.audInfo = {f: freq(55), t1: now + 0.9};
}
/* one note, heard while writing */
function audition(midi, len){
  if (audio.timeline) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime, f = freq(midi), d = len || 0.55;
  if (audio.aud) silence(audio.aud, now);
  audio.aud = voice(ctx, audio.bus, f, now + 0.01, now + d);
  audio.audInfo = {f, t1: now + d};
}
/* A woodblock-like tick for the metronome */
function metroClick(ctx, dest, t){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(1500, t);
  o.frequency.exponentialRampToValueAtTime(820, t + 0.035);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.55, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0005, t + 0.07);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + 0.08);
  return {osc: o, g, t1: t + 0.08};
}

Object.assign(Organ, {Sampler, voice, isSampled, ensureAudio, roomLevel, masterLevel, REGISTERS, FEET, padDraw, organAmps, Synth, silence, TUNE, buildTune, syncTune, testTone, audition, metroClick, freq});

/* ------------------------------------------------------------------ */
/* Mensural reading (the same in both apps)                            */
/* ------------------------------------------------------------------ */
const DUR = {Mx: {m: 16}, L: {m: 8}, B: {m: 4}, S: {m: 2}, M: {m: 1}, Sm: {m: 0.5}, F: {m: 0.25}};
/* MENS-BEGIN */
/* Mensural reading: how long every note and rest lasts, in minims.
   C, tempus imperfectum: a brevis is two semibreves; a dot adds half the value (punctus additionis).
   O, tempus perfectum: a brevis is three semibreves, read by the rules of the theorists:
   - a brevis next to a single semibreve (or its worth in smaller notes or rests) loses a third: imperfection,
     preferably by what follows it (a parte post), otherwise by what precedes it (a parte ante);
   - of two semibreves between breves, the second is doubled: alteration;
   - a dot after a brevis or longa keeps it perfect (punctus perfectionis); a dot after a semibreve that is
     followed by a semibreve or a longer value separates the perfections (punctus divisionis);
     any other dot adds half the value (punctus additionis).
   Prolatio minor and modus imperfectus throughout: a longa is two breves, a maxima two longae. */
const BIG = {Mx: 1, L: 1, B: 1};
function readValues(notes, tempus){
  const N = notes.length, v = new Array(N), odd = [];
  const dotted = i => !!notes[i].p && !notes[i].r;
  if (tempus !== 'O') {
    for (let i = 0; i < N; i++) v[i] = DUR[notes[i].d].m * (dotted(i) ? 1.5 : 1);
    return {v, odd};
  }
  const isDiv = i => dotted(i) && notes[i].d === 'S' && (i + 1 >= N || DUR[notes[i + 1].d].m >= 2);
  for (let i = 0; i < N; i++) {
    const m = DUR[notes[i].d].m;
    v[i] = BIG[notes[i].d] ? m * 1.5 : (dotted(i) && !isDiv(i) ? m * 1.5 : m);
  }
  const done = new Set();
  const canImp = j => j !== null && !notes[j].r && !dotted(j) && !done.has(j);
  const imperfect = j => { done.add(j); v[j] -= 2; };
  const alter = seg => {
    const k = seg[seg.length - 1], n = notes[k];
    if (seg.length < 2 || n.r || n.d !== 'S' || dotted(k)) return false;
    v[k] = 4; return true;
  };
  const rest6 = seg => (((Math.round(seg.reduce((a, k) => a + v[k], 0) * 8)) % 48) + 48) % 48 / 8;
  let X = null, run = [];
  const settle = Y => {
    if (!run.length) return;
    const segs = [[]];
    run.forEach(k => { segs[segs.length - 1].push(k); if (isDiv(k)) segs.push([]); });
    if (!segs[segs.length - 1].length) segs.pop();
    if (segs.length === 1) {
      const s = segs[0], r = rest6(s);
      if (r === 2) { if (canImp(X)) imperfect(X); else if (canImp(Y)) imperfect(Y); else odd.push(s[0]); }
      else if (r === 4) { if (!alter(s)) { if (canImp(X) && canImp(Y)) { imperfect(X); imperfect(Y); } else odd.push(s[0]); } }
      else if (r !== 0) odd.push(s[0]);
    } else {
      segs.forEach((s, j) => {
        const r = rest6(s);
        if (r === 0) return;
        if (r === 2 && j === 0 && canImp(X)) { imperfect(X); return; }
        if (r === 2 && j === segs.length - 1 && canImp(Y)) { imperfect(Y); return; }
        if (r === 4 && alter(s)) return;
        odd.push(s[0]);
      });
    }
    run = [];
  };
  for (let i = 0; i < N; i++) {
    if (BIG[notes[i].d]) { settle(i); X = i; }
    else run.push(i);
  }
  settle(null);
  return {v, odd};
}
/* MENS-END */

/* Sounding values (in minims) written as mensural notes in C or O: shapes, and a dot where one is needed;
   checked with readValues so the notes read back exactly. Values that cannot be written as one note are
   split (the parts are new attacks); `split` counts them. Rests are written with the largest rest values. */
function notateValues(items, tempus){
  const O = tempus === 'O';
  const CMAP = {24:['Mx',1],16:['Mx',0],12:['L',1],8:['L',0],6:['B',1],4:['B',0],3:['S',1],2:['S',0],1.5:['M',1],1:['M',0],0.75:['Sm',1],0.5:['Sm',0],0.375:['F',1],0.25:['F',0]};
  const OMAP = {24:['Mx',0],12:['L',0],10:['L',0],6:['B',0],4:['B',0],3:['S',1],2:['S',0],1.5:['M',1],1:['M',0],0.75:['Sm',1],0.5:['Sm',0],0.25:['F',0]};
  const RC = [['L', 8], ['B', 4], ['S', 2], ['M', 1], ['Sm', 0.5], ['F', 0.25]];
  const RO = [['L', 12], ['B', 6], ['S', 2], ['M', 1], ['Sm', 0.5], ['F', 0.25]];
  const key = m => String(Math.round(m * 1000) / 1000);
  const MAP = O ? OMAP : CMAP;
  /* values the notation has no single note for (a proportion's thirds, say) are rounded, keeping the music's
     overall time: each note ends on the nearest semiminima to where it really ends */
  let te = 0, tw = 0, rounded = 0;
  const r3 = x => Math.round(x * 1000) / 1000;
  const onGrid = (x, g) => Math.abs(x / g - Math.round(x / g)) < 1e-3;
  const vals = items.map(it => {
    te += it.m;
    let want = r3(te - tw);
    const ok = it.rest ? onGrid(want, 0.25) : !!MAP[key(want)];
    if (ok) { want = it.rest ? Math.round(want * 4) / 4 : want; tw = r3(tw + want); return want; }
    const was = want;
    want = Math.max(0.5, r3(Math.round(te * 2) / 2 - tw));
    if (Math.abs(want - was) > 1e-3) rounded++;
    tw = r3(tw + want);
    return want;
  });
  const notes = [], target = [], from = [];
  let split = 0;
  items.forEach((it, k) => {
    let m = vals[k];
    if (m <= 1e-6) return;
    if (it.rest) {
      for (const [d, v] of (O ? RO : RC)) while (m >= v - 1e-3) { notes.push({d, r: true, s: it.s || 26, a: '', p: false}); target.push(v); from.push(k); m = Math.round((m - v) * 1000) / 1000; }
      return;
    }
    const map = MAP[key(m)];
    if (map) { notes.push({d: map[0], r: false, s: it.s, a: it.a || '', p: !!map[1]}); target.push(m); from.push(k); return; }
    /* still not one note: the largest plain values, as repeated notes */
    let first = true;
    for (const [d, v] of (O ? RO : RC)) while (m >= v - 1e-3) { notes.push({d, r: false, s: it.s, a: it.a || '', p: false}); target.push(v); from.push(k); m = Math.round((m - v) * 1000) / 1000; if (!first) split++; first = false; }
  });
  const bad = () => { const v = readValues(notes, tempus).v; for (let i = 0; i < v.length; i++) if (Math.abs(v[i] - target[i]) > 1e-6) return i; return -1; };
  if (!O) return {notes, ok: bad() < 0, split, rounded, from, target};
  /* tempus perfectum: perfect or imperfect by the rules; a dot where the rules alone would read it otherwise */
  let b = bad(), guard = 0;
  while (b >= 0 && guard++ < 600) {
    const lo = Math.max(0, b - 6), hi = Math.min(notes.length - 1, b + 40), cand = [];
    for (let j = lo; j <= hi; j++) {
      if (notes[j].r) continue;
      if (notes[j].d === 'B' || notes[j].d === 'L' || notes[j].d === 'S') cand.push({j, kind: 'dot'});
      if (target[j] === 4 && (notes[j].d === 'B' || notes[j].d === 'S')) cand.push({j, kind: 'shape'});
    }
    const apply = ms => ms.forEach(m => { const n = notes[m.j]; if (m.kind === 'dot') n.p = !n.p; else n.d = n.d === 'B' ? 'S' : 'B'; });
    let best = null;
    const tryIt = ms => { apply(ms); const x = bad(); apply(ms); const sc = x < 0 ? 1e9 : x; if (sc > b && (!best || sc > best.sc || (sc === best.sc && ms.length < best.ms.length))) best = {sc, ms: ms.slice()}; };
    for (let a = 0; a < cand.length; a++) { tryIt([cand[a]]); for (let c = a + 1; c < cand.length; c++) tryIt([cand[a], cand[c]]); }
    if (!best) break;
    apply(best.ms);
    b = bad();
  }
  return {notes, ok: b < 0, split, rounded, from, target};
}
Object.assign(Organ, {DUR, readValues, notateValues});

/* ------------------------------------------------------------------ */
/* The tactus: hand and pendulum                                       */
/* ------------------------------------------------------------------ */
const HAND_SVG = `<g transform="translate(0 3)"><path d="M-44 88 C-14 85 18 84 44 86 L44 142 C18 144 -14 144 -44 142Z" fill="#F2E6C6"/><defs><clipPath id="cfSleeve"><path d="M-44 88 C-14 85 18 84 44 86 L44 142 C18 144 -14 144 -44 142Z"/></clipPath></defs><g clip-path="url(#cfSleeve)"><path d="M-30 86 L-29.4 88.8 L-28.8 91.5 L-28.3 94.2 L-28 97 L-27.7 99.8 L-27.4 102.6 L-27.2 105.5 L-27 108.3 L-26.7 111.3 L-26.4 114.2 L-26 117.2 L-25.4 120.2 L-24.7 123.2 L-23.8 126.2 L-22.6 129.2 L-21 132 L-21 132 L-21.7 128.8 L-22.5 125.8 L-23.1 122.8 L-23.6 119.9 L-24 116.9 L-24.3 114 L-24.5 111.1 L-24.8 108.2 L-25 105.3 L-25.3 102.4 L-25.7 99.5 L-26.1 96.7 L-26.7 93.9 L-27.5 91.2 L-28.5 88.5 L-30 86ZM-26.8 89.8 L-26.5 91.3 L-26.3 92.8 L-26 94.3 L-25.8 95.9 L-25.6 97.4 L-25.4 98.9 L-25.3 100.5 L-25.1 102 L-25 103.5 L-24.9 105.1 L-24.8 106.6 L-24.6 108.2 L-24.5 109.7 L-24.4 111.2 L-24.2 112.8 L-24 114.3 L-23.8 115.9 L-23.6 117.5 L-23.3 119 L-22.9 120.5 L-22.6 122.1 L-22.1 123.6 L-21.6 125.2 L-21.5 125.1 L-21.7 123.5 L-22 122 L-22.3 120.4 L-22.5 118.9 L-22.7 117.3 L-22.9 115.8 L-23 114.2 L-23.2 112.7 L-23.3 111.2 L-23.4 109.6 L-23.5 108.1 L-23.7 106.5 L-23.8 105 L-23.9 103.4 L-24.1 101.9 L-24.3 100.3 L-24.5 98.8 L-24.7 97.3 L-25 95.7 L-25.3 94.2 L-25.7 92.7 L-26.1 91.2 L-26.7 89.8ZM-24.4 92.5 L-24.3 94 L-24.1 95.6 L-23.9 97.1 L-23.7 98.7 L-23.5 100.3 L-23.4 101.8 L-23.3 103.4 L-23.1 104.9 L-23 106.5 L-22.9 108 L-22.8 109.5 L-22.6 111.1 L-22.5 112.6 L-22.3 114.2 L-22.1 115.7 L-21.9 117.2 L-21.6 118.7 L-21.3 120.2 L-20.9 121.7 L-20.4 123.2 L-20.3 123.2 L-20.6 121.7 L-20.8 120.2 L-21 118.6 L-21.2 117.1 L-21.4 115.6 L-21.5 114.1 L-21.7 112.5 L-21.8 111 L-21.9 109.5 L-22.1 107.9 L-22.2 106.4 L-22.3 104.8 L-22.5 103.3 L-22.6 101.7 L-22.8 100.2 L-23 98.6 L-23.3 97.1 L-23.6 95.5 L-23.9 94 L-24.4 92.5ZM-22.7 93.8 L-22.6 95.3 L-22.4 96.9 L-22.2 98.5 L-22 100.1 L-21.9 101.7 L-21.8 103.2 L-21.6 104.8 L-21.5 106.3 L-21.4 107.9 L-21.3 109.4 L-21.1 111 L-21 112.5 L-20.8 114 L-20.6 115.5 L-20.4 117 L-20.1 118.5 L-19.8 120 L-19.4 121.5 L-19.3 121.5 L-19.5 119.9 L-19.7 118.4 L-19.9 116.9 L-20.1 115.4 L-20.3 113.9 L-20.4 112.4 L-20.5 110.9 L-20.7 109.4 L-20.8 107.8 L-20.9 106.3 L-21.1 104.7 L-21.2 103.2 L-21.4 101.6 L-21.6 100 L-21.8 98.5 L-22 96.9 L-22.3 95.3 L-22.7 93.8ZM-6 86 L-5.5 88.8 L-4.8 91.5 L-4.3 94.2 L-4 97 L-3.7 99.8 L-3.4 102.6 L-3.2 105.5 L-3 108.3 L-2.7 111.3 L-2.4 114.2 L-2 117.2 L-1.4 120.2 L-0.7 123.2 L0.2 126.2 L1.4 129.2 L3 132 L3 132 L2.3 128.8 L1.5 125.8 L0.9 122.8 L0.4 119.9 L0 116.9 L-0.3 114 L-0.5 111.1 L-0.8 108.2 L-1 105.3 L-1.3 102.4 L-1.7 99.5 L-2.1 96.7 L-2.7 93.9 L-3.5 91.2 L-4.5 88.5 L-6 86ZM-2.8 89.8 L-2.5 91.3 L-2.3 92.8 L-2 94.3 L-1.8 95.9 L-1.6 97.4 L-1.4 98.9 L-1.3 100.5 L-1.1 102 L-1 103.5 L-0.9 105.1 L-0.8 106.6 L-0.6 108.2 L-0.5 109.7 L-0.3 111.2 L-0.2 112.8 L0 114.3 L0.2 115.9 L0.5 117.5 L0.7 119 L1.1 120.5 L1.4 122.1 L1.9 123.6 L2.5 125.2 L2.5 125.1 L2.3 123.5 L2 122 L1.7 120.4 L1.5 118.9 L1.3 117.3 L1.1 115.8 L1 114.2 L0.8 112.7 L0.7 111.2 L0.6 109.6 L0.5 108.1 L0.3 106.5 L0.2 105 L0.1 103.4 L-0.1 101.9 L-0.3 100.3 L-0.5 98.8 L-0.7 97.3 L-1 95.7 L-1.3 94.2 L-1.7 92.7 L-2.1 91.2 L-2.7 89.8ZM-0.4 92.5 L-0.3 94 L-0.1 95.6 L0.1 97.1 L0.3 98.7 L0.5 100.3 L0.6 101.8 L0.7 103.4 L0.8 104.9 L1 106.5 L1.1 108 L1.2 109.5 L1.4 111.1 L1.5 112.6 L1.7 114.2 L1.9 115.7 L2.1 117.2 L2.4 118.7 L2.7 120.2 L3.1 121.7 L3.6 123.2 L3.7 123.2 L3.4 121.7 L3.2 120.2 L3 118.6 L2.8 117.1 L2.6 115.6 L2.5 114.1 L2.3 112.5 L2.2 111 L2.1 109.5 L1.9 107.9 L1.8 106.4 L1.7 104.8 L1.5 103.3 L1.4 101.7 L1.2 100.2 L1 98.6 L0.7 97.1 L0.4 95.5 L0.1 94 L-0.4 92.5ZM1.3 93.8 L1.4 95.3 L1.6 96.9 L1.8 98.5 L2 100.1 L2.1 101.7 L2.2 103.2 L2.4 104.8 L2.5 106.3 L2.6 107.9 L2.7 109.4 L2.9 111 L3 112.5 L3.2 114 L3.4 115.5 L3.6 117 L3.9 118.5 L4.2 120 L4.6 121.5 L4.7 121.5 L4.5 119.9 L4.3 118.4 L4.1 116.9 L3.9 115.4 L3.7 113.9 L3.6 112.4 L3.5 110.9 L3.3 109.4 L3.2 107.8 L3.1 106.3 L3 104.7 L2.8 103.2 L2.6 101.6 L2.5 100 L2.2 98.5 L2 96.9 L1.7 95.3 L1.3 93.8ZM20 86 L20.6 88.8 L21.2 91.5 L21.7 94.2 L22 97 L22.3 99.8 L22.6 102.6 L22.8 105.5 L23 108.3 L23.3 111.3 L23.6 114.2 L24 117.2 L24.6 120.2 L25.3 123.2 L26.2 126.2 L27.4 129.2 L29 132 L29 132 L28.3 128.8 L27.5 125.8 L26.9 122.8 L26.4 119.9 L26 116.9 L25.7 114 L25.5 111.1 L25.2 108.2 L25 105.3 L24.7 102.4 L24.3 99.5 L23.9 96.7 L23.3 93.9 L22.5 91.2 L21.5 88.5 L20 86ZM23.2 89.8 L23.5 91.3 L23.7 92.8 L24 94.3 L24.2 95.9 L24.4 97.4 L24.6 98.9 L24.7 100.5 L24.9 102 L25 103.5 L25.1 105.1 L25.2 106.6 L25.4 108.2 L25.5 109.7 L25.6 111.2 L25.8 112.8 L26 114.3 L26.2 115.9 L26.4 117.5 L26.7 119 L27.1 120.5 L27.4 122.1 L27.9 123.6 L28.4 125.2 L28.5 125.1 L28.3 123.5 L28 122 L27.7 120.4 L27.5 118.9 L27.3 117.3 L27.1 115.8 L27 114.2 L26.8 112.7 L26.7 111.2 L26.6 109.6 L26.5 108.1 L26.3 106.5 L26.2 105 L26.1 103.4 L25.9 101.9 L25.7 100.3 L25.5 98.8 L25.3 97.3 L25 95.7 L24.7 94.2 L24.3 92.7 L23.9 91.2 L23.3 89.8ZM25.6 92.5 L25.7 94 L25.9 95.6 L26.1 97.1 L26.3 98.7 L26.5 100.3 L26.6 101.8 L26.7 103.4 L26.9 104.9 L27 106.5 L27.1 108 L27.2 109.5 L27.4 111.1 L27.5 112.6 L27.7 114.2 L27.9 115.7 L28.1 117.2 L28.4 118.7 L28.7 120.2 L29.1 121.7 L29.6 123.2 L29.7 123.2 L29.4 121.7 L29.2 120.2 L29 118.6 L28.8 117.1 L28.6 115.6 L28.5 114.1 L28.3 112.5 L28.2 111 L28.1 109.5 L27.9 107.9 L27.8 106.4 L27.7 104.8 L27.5 103.3 L27.4 101.7 L27.2 100.2 L27 98.6 L26.7 97.1 L26.4 95.5 L26.1 94 L25.6 92.5ZM27.3 93.8 L27.4 95.3 L27.6 96.9 L27.8 98.5 L28 100.1 L28.1 101.7 L28.2 103.2 L28.4 104.8 L28.5 106.3 L28.6 107.9 L28.7 109.4 L28.9 111 L29 112.5 L29.2 114 L29.4 115.5 L29.6 117 L29.9 118.5 L30.2 120 L30.6 121.5 L30.7 121.5 L30.5 119.9 L30.3 118.4 L30.1 116.9 L29.9 115.4 L29.7 113.9 L29.6 112.4 L29.5 110.9 L29.3 109.4 L29.2 107.8 L29.1 106.3 L28.9 104.7 L28.8 103.2 L28.6 101.6 L28.4 100 L28.2 98.5 L28 96.9 L27.7 95.3 L27.3 93.8ZM-46 141.4 L-41.2 142.2 L-36.4 142.6 L-31.6 143 L-26.9 143.3 L-22.1 143.5 L-17.3 143.7 L-12.6 143.9 L-7.9 144 L-3.2 144 L1.5 144.1 L6.1 144 L10.8 143.9 L15.3 143.8 L19.9 143.6 L24.4 143.4 L28.8 143.1 L33.2 142.7 L37.5 142.3 L41.8 141.8 L46 141 L46 141 L41.7 141 L37.4 141.3 L33.1 141.6 L28.7 141.8 L24.3 142 L19.8 142.2 L15.3 142.3 L10.7 142.4 L6.1 142.5 L1.5 142.6 L-3.2 142.6 L-7.8 142.5 L-12.6 142.4 L-17.3 142.3 L-22 142.2 L-26.8 142 L-31.6 141.8 L-36.4 141.6 L-41.2 141.4 L-46 141.4ZM-46 139 L-41.2 139.7 L-36.4 140.1 L-31.6 140.5 L-26.9 140.8 L-22.1 141 L-17.3 141.2 L-12.6 141.4 L-7.9 141.5 L-3.2 141.5 L1.5 141.6 L6.1 141.5 L10.8 141.4 L15.3 141.3 L19.9 141.1 L24.3 140.9 L28.8 140.6 L33.2 140.2 L37.5 139.8 L41.8 139.4 L46 138.6 L46 138.6 L41.7 138.7 L37.5 139 L33.1 139.3 L28.7 139.5 L24.3 139.7 L19.8 139.9 L15.3 140 L10.7 140.2 L6.1 140.2 L1.5 140.2 L-3.2 140.2 L-7.8 140.2 L-12.6 140.1 L-17.3 140 L-22 139.9 L-26.8 139.7 L-31.6 139.5 L-36.4 139.3 L-41.2 139 L-46 139ZM-46 136.4 L-41.2 137.1 L-36.4 137.5 L-31.6 137.8 L-26.9 138.1 L-22.1 138.3 L-17.3 138.5 L-12.6 138.7 L-7.9 138.8 L-3.2 138.8 L1.5 138.8 L6.1 138.8 L10.8 138.7 L15.3 138.6 L19.9 138.4 L24.3 138.2 L28.8 137.9 L33.2 137.6 L37.5 137.2 L41.8 136.7 L46 136 L46 136 L41.7 136.1 L37.5 136.4 L33.1 136.7 L28.7 137 L24.3 137.2 L19.8 137.4 L15.3 137.5 L10.7 137.7 L6.1 137.7 L1.5 137.8 L-3.2 137.8 L-7.8 137.7 L-12.6 137.6 L-17.3 137.5 L-22 137.4 L-26.8 137.2 L-31.6 137 L-36.4 136.7 L-41.2 136.5 L-46 136.4ZM-46 133.6 L-41.2 134.2 L-36.4 134.6 L-31.6 134.9 L-26.9 135.2 L-22.1 135.4 L-17.3 135.6 L-12.6 135.8 L-7.9 135.9 L-3.2 135.9 L1.5 135.9 L6.1 135.9 L10.8 135.8 L15.3 135.7 L19.9 135.5 L24.3 135.3 L28.8 135 L33.2 134.7 L37.5 134.3 L41.8 133.9 L46 133.2 L46 133.2 L41.8 133.4 L37.5 133.7 L33.1 134 L28.7 134.3 L24.3 134.5 L19.8 134.7 L15.3 134.8 L10.7 134.9 L6.1 135 L1.5 135.1 L-3.2 135.1 L-7.8 135 L-12.6 134.9 L-17.3 134.8 L-22.1 134.7 L-26.8 134.5 L-31.6 134.2 L-36.4 134 L-41.2 133.7 L-46 133.6ZM-46 130.6 L-41.2 131.2 L-36.4 131.5 L-31.6 131.9 L-26.9 132.1 L-22.1 132.4 L-17.3 132.6 L-12.6 132.7 L-7.9 132.8 L-3.2 132.8 L1.5 132.8 L6.1 132.8 L10.7 132.7 L15.3 132.6 L19.8 132.4 L24.3 132.2 L28.8 131.9 L33.2 131.6 L37.5 131.2 L41.8 130.8 L46 130.2 L46 130.2 L41.8 130.4 L37.5 130.8 L33.1 131.1 L28.7 131.3 L24.3 131.6 L19.8 131.8 L15.3 131.9 L10.7 132 L6.1 132.1 L1.5 132.2 L-3.2 132.2 L-7.8 132.1 L-12.6 132 L-17.3 131.9 L-22.1 131.8 L-26.8 131.6 L-31.6 131.3 L-36.4 131.1 L-41.2 130.8 L-46 130.6ZM-46 127.4 L-41.2 127.9 L-36.4 128.3 L-31.6 128.6 L-26.8 128.8 L-22.1 129.1 L-17.3 129.3 L-12.6 129.4 L-7.9 129.5 L-3.2 129.5 L1.5 129.6 L6.1 129.5 L10.7 129.4 L15.3 129.3 L19.8 129.1 L24.3 128.9 L28.8 128.7 L33.2 128.3 L37.5 128 L41.8 127.6 L46 127 L46 127 L41.8 127.3 L37.5 127.7 L33.1 128 L28.7 128.2 L24.3 128.5 L19.8 128.7 L15.3 128.8 L10.7 128.9 L6.1 129 L1.5 129.1 L-3.2 129.1 L-7.8 129 L-12.6 128.9 L-17.3 128.8 L-22.1 128.6 L-26.8 128.4 L-31.6 128.2 L-36.4 127.9 L-41.2 127.6 L-46 127.4Z" fill="#1F1A14"/></g><path d="M-44 88 C-14 85 18 84 44 86 L44 142 C18 144 -14 144 -44 142Z" fill="none" stroke="#1F1A14" stroke-width="2.4" stroke-linejoin="round"/><defs><clipPath id="cfHand"><path d="M58 97 C74 94 92 91.5 108 91 C118 90.8 126 91.5 132 93 C150 95 170 96.5 188 98.5 C196 99.4 201 101 201 104.5 C201 107.5 198 109 194 109.2 C200 109.5 207 110.5 207 114 C207 117.5 202 118.6 196 118.4 C200 119.2 201 122.5 197 123.6 C193 124.6 188 124.2 184 123.8 C188 124.8 188 128 183 128.6 C176 129.2 168 128.6 160 128.2 C146 127.6 134 128.6 122 130.6 C104 133.6 82 133.6 58 131 Z"/></clipPath></defs><path d="M58 97 C74 94 92 91.5 108 91 C118 90.8 126 91.5 132 93 C150 95 170 96.5 188 98.5 C196 99.4 201 101 201 104.5 C201 107.5 198 109 194 109.2 C200 109.5 207 110.5 207 114 C207 117.5 202 118.6 196 118.4 C200 119.2 201 122.5 197 123.6 C193 124.6 188 124.2 184 123.8 C188 124.8 188 128 183 128.6 C176 129.2 168 128.6 160 128.2 C146 127.6 134 128.6 122 130.6 C104 133.6 82 133.6 58 131 Z" fill="#F2E6C6"/><g clip-path="url(#cfHand)"><path d="M185.2 125.8 L185.2 126 L185.3 126.1 L185.3 126.2 L185.3 126.2 L185.3 126.3 L185.2 126.3 L185.8 126.2 L185.8 126.2 L185.2 126 L185.2 126 L185.2 126 L185.2 126 L185.1 126.1 L185 126.1 L184.9 126.2 L184.8 126.2 L184.6 126.3 L184.4 126.4 L184.2 126.5 L183.9 126.5 L183.5 126.6 L183.2 126.7 L182.8 126.7 L182.2 126.8 L181.5 126.8 L180.8 126.8 L180.1 126.9 L179.4 126.9 L178.6 126.9 L177.9 126.9 L177.2 126.9 L176.5 126.9 L175.7 126.9 L175 126.9 L174.2 126.9 L173.5 126.8 L172.7 126.8 L171.9 126.8 L171.2 126.8 L170.4 126.7 L169.6 126.7 L168.8 126.7 L168.1 126.6 L167.3 126.6 L166.5 126.5 L165.7 126.5 L164.9 126.4 L164.1 126.4 L163.3 126.3 L162.5 126.3 L161.7 126.3 L160.9 126.2 L160.1 126.2 L158.7 126.1 L157.3 126.1 L155.9 126 L154.5 126 L153.2 126 L151.8 126 L150.5 126 L149.2 126 L147.8 126.1 L146.5 126.1 L145.2 126.2 L143.9 126.2 L142.7 126.3 L141.4 126.3 L140.1 126.4 L138.8 126.5 L137.6 126.6 L136.3 126.7 L135.1 126.9 L133.9 127 L132.6 127.1 L131.4 127.3 L130.2 127.4 L129 127.6 L127.8 127.8 L126.5 127.9 L125.3 128.1 L124.1 128.3 L122.9 128.5 L121.7 128.7 L119.9 129 L118.1 129.3 L116.2 129.5 L114.4 129.8 L112.5 130 L110.6 130.2 L108.6 130.4 L106.7 130.5 L104.7 130.7 L102.7 130.8 L100.6 130.9 L98.5 131 L96.5 131.1 L94.4 131.1 L92.2 131.2 L90.1 131.2 L87.9 131.2 L85.8 131.2 L83.5 131.1 L81.3 131.1 L79.1 131 L76.8 130.9 L74.5 130.8 L72.2 130.7 L69.9 130.7 L69.9 130.7 L72.2 130.9 L74.5 131.1 L76.8 131.3 L79.1 131.4 L81.3 131.6 L83.5 131.7 L85.7 131.7 L87.9 131.8 L90.1 131.8 L92.2 131.8 L94.4 131.8 L96.5 131.8 L98.6 131.8 L100.6 131.7 L102.7 131.6 L104.7 131.5 L106.7 131.4 L108.7 131.3 L110.7 131.1 L112.6 130.9 L114.5 130.7 L116.4 130.5 L118.2 130.3 L120 130 L121.9 129.7 L123.1 129.5 L124.3 129.3 L125.5 129.2 L126.7 129 L127.9 128.8 L129.1 128.7 L130.3 128.5 L131.5 128.4 L132.8 128.3 L134 128.1 L135.2 128 L136.5 127.9 L137.7 127.8 L138.9 127.7 L140.2 127.6 L141.5 127.5 L142.7 127.5 L144 127.4 L145.3 127.4 L146.6 127.3 L147.9 127.3 L149.2 127.3 L150.5 127.2 L151.8 127.2 L153.2 127.2 L154.5 127.3 L155.9 127.3 L157.2 127.3 L158.6 127.4 L160 127.4 L160.8 127.5 L161.6 127.5 L162.4 127.5 L163.2 127.6 L164 127.6 L164.8 127.7 L165.6 127.7 L166.4 127.8 L167.2 127.8 L168 127.8 L168.8 127.9 L169.6 127.9 L170.3 127.9 L171.1 127.9 L171.9 128 L172.7 128 L173.4 128 L174.2 128 L175 128 L175.7 128 L176.5 128 L177.2 128 L177.9 128 L178.7 128 L179.4 127.9 L180.1 127.9 L180.8 127.9 L181.5 127.8 L182.2 127.8 L182.9 127.7 L183.3 127.6 L183.7 127.5 L184.1 127.4 L184.4 127.3 L184.7 127.2 L185 127.1 L185.2 127 L185.4 126.8 L185.5 126.7 L185.6 126.6 L185.7 126.5 L185.8 126.4 L185.8 126.3 L185.8 126.3 L185.2 126.2 L185.2 126.2 L185.7 126.1 L185.7 126.1 L185.7 126 L185.6 126 L185.5 125.9 L185.4 125.9 L185.2 125.8ZM184.1 126.2 L184.2 126.2 L184.2 126 L184.3 125.8 L184.4 125.7 L184.5 125.6 L184.5 125.5 L184.6 125.5 L184.3 125.1 L184.2 125.1 L184.2 125.1 L184.1 125.2 L183.9 125.2 L183.8 125.2 L183.5 125.3 L183.3 125.3 L183 125.4 L182.7 125.4 L182.1 125.5 L181.4 125.5 L180.7 125.5 L180 125.6 L179.3 125.6 L178.6 125.6 L177.9 125.6 L177.2 125.6 L176.4 125.6 L175.7 125.6 L175 125.6 L174.2 125.5 L173.5 125.5 L172.7 125.5 L172 125.5 L171.2 125.5 L170.4 125.4 L169.7 125.4 L168.9 125.3 L168.1 125.3 L167.3 125.3 L166.6 125.2 L165.8 125.2 L165 125.1 L164.2 125.1 L163.4 125 L162.6 125 L161.8 125 L161 124.9 L160.1 124.9 L158.7 124.8 L157.3 124.8 L155.9 124.7 L154.6 124.7 L153.2 124.7 L151.8 124.7 L150.5 124.7 L149.1 124.7 L147.8 124.8 L146.5 124.8 L145.2 124.8 L143.9 124.9 L142.6 125 L141.3 125 L140 125.1 L138.8 125.2 L137.5 125.3 L136.2 125.4 L135 125.6 L133.7 125.7 L132.5 125.8 L131.3 126 L130 126.1 L128.8 126.3 L127.6 126.5 L126.3 126.6 L125.1 126.8 L123.9 127 L122.7 127.2 L121.5 127.4 L119.7 127.7 L117.9 128 L116.1 128.2 L114.2 128.5 L112.3 128.7 L110.4 128.9 L108.5 129.1 L106.6 129.2 L104.6 129.4 L102.6 129.5 L100.6 129.6 L98.5 129.7 L96.4 129.8 L94.3 129.8 L92.2 129.9 L90.1 129.9 L88 129.9 L85.8 129.9 L83.6 129.9 L81.3 129.9 L81.3 129.9 L83.6 130.1 L85.8 130.2 L87.9 130.2 L90.1 130.3 L92.2 130.3 L94.4 130.3 L96.5 130.3 L98.5 130.3 L100.6 130.2 L102.6 130.1 L104.6 130 L106.6 129.9 L108.6 129.8 L110.5 129.6 L112.4 129.4 L114.3 129.2 L116.2 129 L118 128.8 L119.8 128.5 L121.6 128.2 L122.8 128.1 L124 127.9 L125.2 127.7 L126.5 127.5 L127.7 127.4 L128.9 127.2 L130.1 127.1 L131.4 126.9 L132.6 126.8 L133.8 126.7 L135.1 126.5 L136.3 126.4 L137.6 126.3 L138.8 126.2 L140.1 126.1 L141.4 126.1 L142.6 126 L143.9 125.9 L145.2 125.9 L146.5 125.8 L147.8 125.8 L149.2 125.8 L150.5 125.8 L151.8 125.8 L153.2 125.8 L154.5 125.8 L155.9 125.8 L157.3 125.8 L158.7 125.9 L160.1 125.9 L160.9 126 L161.7 126 L162.5 126.1 L163.3 126.1 L164.1 126.1 L164.9 126.2 L165.7 126.2 L166.5 126.3 L167.3 126.3 L168.1 126.3 L168.8 126.4 L169.6 126.4 L170.4 126.4 L171.2 126.5 L171.9 126.5 L172.7 126.5 L173.5 126.5 L174.2 126.5 L175 126.5 L175.7 126.5 L176.4 126.5 L177.2 126.5 L177.9 126.5 L178.6 126.5 L179.3 126.4 L180.1 126.4 L180.8 126.4 L181.4 126.3 L182.1 126.3 L182.8 126.2 L183.1 126.1 L183.4 126.1 L183.7 126 L184 125.9 L184.2 125.8 L184.3 125.7 L184.5 125.7 L184.5 125.6 L184.5 125.6 L184.2 125.2 L184.2 125.2 L184.1 125.4 L184 125.5 L184 125.8 L184 126 L184 126.2 L184.1 126.2ZM183.4 124.4 L183.5 124.5 L183.6 124.4 L183.7 124.4 L183.8 124.4 L183.6 124.1 L183.5 124.1 L183.4 124.1 L183.2 124.2 L183 124.2 L182.8 124.2 L182.5 124.2 L182 124.3 L181.3 124.3 L180.6 124.3 L180 124.4 L179.3 124.4 L178.6 124.4 L177.9 124.4 L177.2 124.4 L176.4 124.4 L175.7 124.4 L175 124.4 L174.3 124.3 L173.5 124.3 L172.8 124.3 L172 124.3 L171.3 124.2 L170.5 124.2 L169.7 124.2 L169 124.1 L168.2 124.1 L167.4 124 L166.6 124 L165.8 124 L165 123.9 L164.2 123.9 L163.4 123.8 L162.6 123.8 L161.8 123.8 L161 123.7 L160.2 123.7 L158.8 123.6 L157.3 123.6 L155.9 123.5 L154.6 123.5 L153.2 123.5 L151.8 123.5 L150.5 123.5 L149.1 123.5 L147.8 123.5 L146.4 123.6 L145.1 123.6 L143.8 123.7 L142.5 123.8 L141.2 123.8 L139.9 123.9 L138.7 124 L137.4 124.1 L136.1 124.2 L134.9 124.3 L133.6 124.5 L132.4 124.6 L131.1 124.8 L129.9 124.9 L128.6 125.1 L127.4 125.3 L126.2 125.4 L125 125.6 L123.7 125.8 L122.5 126 L121.3 126.2 L119.5 126.5 L117.7 126.8 L115.9 127.1 L114.1 127.3 L112.2 127.5 L110.3 127.7 L108.4 127.9 L106.5 128.1 L104.5 128.2 L102.5 128.3 L100.5 128.4 L98.5 128.5 L96.4 128.6 L94.3 128.7 L92.2 128.8 L92.2 128.8 L94.3 128.9 L96.4 128.9 L98.5 128.8 L100.5 128.8 L102.5 128.7 L104.5 128.6 L106.5 128.5 L108.5 128.4 L110.4 128.2 L112.3 128 L114.2 127.8 L116 127.6 L117.8 127.4 L119.6 127.2 L121.4 126.9 L122.6 126.7 L123.8 126.5 L125 126.3 L126.3 126.2 L127.5 126 L128.7 125.8 L130 125.7 L131.2 125.5 L132.4 125.4 L133.7 125.3 L134.9 125.2 L136.2 125 L137.5 124.9 L138.7 124.8 L140 124.8 L141.3 124.7 L142.6 124.6 L143.9 124.5 L145.2 124.5 L146.5 124.5 L147.8 124.4 L149.1 124.4 L150.5 124.4 L151.8 124.4 L153.2 124.4 L154.6 124.4 L155.9 124.4 L157.3 124.5 L158.7 124.5 L160.2 124.5 L161 124.6 L161.8 124.6 L162.6 124.7 L163.4 124.7 L164.2 124.8 L165 124.8 L165.8 124.8 L166.6 124.9 L167.4 124.9 L168.1 124.9 L168.9 125 L169.7 125 L170.5 125 L171.2 125.1 L172 125.1 L172.8 125.1 L173.5 125.1 L174.2 125.1 L175 125.1 L175.7 125.1 L176.4 125.1 L177.2 125.1 L177.9 125.1 L178.6 125.1 L179.3 125 L180 125 L180.7 125 L181.3 124.9 L182 124.9 L182.6 124.8 L182.9 124.8 L183.1 124.7 L183.3 124.6 L183.5 124.5 L183.7 124.5 L183.7 124.4 L183.6 124.1 L183.6 124.2 L183.5 124.2 L183.4 124.4 L183.5 124.4ZM183.3 123.1 L183.1 123.1 L183 123.1 L182.8 123.1 L182.6 123.2 L182.4 123.2 L181.9 123.2 L181.2 123.2 L180.6 123.2 L179.9 123.3 L179.2 123.3 L178.6 123.3 L177.9 123.3 L177.2 123.3 L176.4 123.3 L175.7 123.3 L175 123.3 L174.3 123.2 L173.6 123.2 L172.8 123.2 L172.1 123.2 L171.3 123.1 L170.5 123.1 L169.8 123.1 L169 123 L168.2 123 L167.4 123 L166.7 122.9 L165.9 122.9 L165.1 122.8 L164.3 122.8 L163.5 122.7 L162.7 122.7 L161.9 122.6 L161.1 122.6 L160.2 122.5 L158.8 122.5 L157.4 122.5 L156 122.4 L154.6 122.4 L153.2 122.4 L151.8 122.4 L150.4 122.4 L149.1 122.4 L147.8 122.4 L146.4 122.5 L145.1 122.5 L143.8 122.6 L142.5 122.6 L141.2 122.7 L139.9 122.8 L138.6 122.9 L137.3 123 L136 123.1 L134.8 123.2 L133.5 123.4 L132.2 123.5 L131 123.7 L129.7 123.8 L128.5 124 L127.2 124.2 L126 124.3 L124.8 124.5 L123.5 124.7 L122.3 124.9 L121.1 125.1 L119.3 125.4 L117.6 125.7 L115.8 126 L114 126.2 L112.1 126.4 L110.2 126.6 L108.3 126.8 L106.4 127 L104.5 127.1 L102.4 127.3 L102.5 127.3 L104.5 127.3 L106.4 127.2 L108.3 127.1 L110.3 126.9 L112.1 126.7 L114 126.5 L115.8 126.3 L117.6 126.1 L119.4 125.9 L121.2 125.6 L122.4 125.4 L123.6 125.2 L124.9 125 L126.1 124.9 L127.3 124.7 L128.6 124.5 L129.8 124.4 L131.1 124.2 L132.3 124.1 L133.6 124 L134.8 123.9 L136.1 123.8 L137.3 123.7 L138.6 123.5 L139.9 123.5 L141.2 123.4 L142.5 123.3 L143.8 123.3 L145.1 123.2 L146.4 123.2 L147.8 123.1 L149.1 123.1 L150.5 123.1 L151.8 123.1 L153.2 123.1 L154.6 123.1 L156 123.1 L157.4 123.2 L158.8 123.2 L160.2 123.3 L161.1 123.3 L161.9 123.3 L162.7 123.4 L163.5 123.4 L164.3 123.5 L165.1 123.5 L165.8 123.5 L166.6 123.6 L167.4 123.6 L168.2 123.7 L169 123.7 L169.8 123.7 L170.5 123.7 L171.3 123.8 L172 123.8 L172.8 123.8 L173.5 123.8 L174.3 123.8 L175 123.8 L175.7 123.8 L176.4 123.8 L177.2 123.8 L177.9 123.8 L178.6 123.8 L179.3 123.7 L179.9 123.7 L180.6 123.7 L181.3 123.6 L181.9 123.5 L182.5 123.5 L182.7 123.4 L182.9 123.4 L183 123.3 L183.1 123.3 L183.3 123.1ZM135 110.7 L134.2 110.7 L133.4 110.8 L132.6 110.8 L131.8 110.9 L130.9 111 L130.1 111 L129.2 111.1 L128.3 111.1 L127.4 111.2 L126.5 111.2 L125.6 111.2 L124.7 111.3 L123.7 111.3 L122.8 111.4 L121.8 111.4 L120.9 111.4 L119.9 111.5 L119 111.5 L118 111.6 L117 111.6 L116 111.7 L115 111.8 L114 111.8 L113.1 111.9 L112.1 112 L111.1 112 L110.1 112.2 L109 112.3 L107.9 112.4 L106.9 112.6 L105.8 112.7 L104.8 112.9 L103.8 113.1 L102.8 113.3 L101.8 113.6 L100.8 113.8 L99.8 114.1 L98.9 114.3 L97.9 114.6 L97 114.9 L96.1 115.3 L95.2 115.6 L94.3 115.9 L93.4 116.3 L92.5 116.7 L91.6 117 L90.8 117.4 L89.9 117.8 L89.1 118.3 L88.2 118.7 L87.4 119.2 L86.6 119.6 L85.8 120.1 L85 120.7 L85.1 120.7 L86 120.3 L86.8 120 L87.6 119.6 L88.5 119.2 L89.3 118.8 L90.2 118.4 L91 118.1 L91.9 117.7 L92.8 117.4 L93.7 117 L94.5 116.7 L95.5 116.4 L96.4 116.1 L97.3 115.8 L98.2 115.6 L99.1 115.3 L100.1 115 L101 114.8 L102 114.6 L103 114.4 L104 114.2 L105 114 L106 113.8 L107 113.7 L108.1 113.5 L109.1 113.4 L110.2 113.2 L111.2 113.2 L112.2 113.1 L113.1 113 L114.1 112.9 L115.1 112.8 L116.1 112.8 L117.1 112.7 L118 112.6 L119 112.5 L120 112.5 L121 112.4 L121.9 112.4 L122.8 112.3 L123.8 112.2 L124.7 112.2 L125.7 112.1 L126.6 112 L127.5 111.9 L128.4 111.8 L129.2 111.8 L130.1 111.7 L131 111.5 L131.8 111.4 L132.7 111.3 L133.5 111.1 L134.3 111 L135 110.7ZM132.8 112.3 L131.9 112.3 L131.1 112.4 L130.2 112.4 L129.3 112.5 L128.4 112.5 L127.5 112.6 L126.6 112.6 L125.7 112.6 L124.8 112.7 L123.8 112.7 L122.9 112.8 L121.9 112.8 L121 112.8 L120 112.9 L119 112.9 L118.1 113 L117.1 113 L116.1 113.1 L115.1 113.1 L114.2 113.2 L113.2 113.3 L112.2 113.3 L111.2 113.4 L110.2 113.5 L109.2 113.7 L108.1 113.8 L107.1 113.9 L106.1 114.1 L105 114.3 L104.1 114.5 L103.1 114.7 L102.1 114.9 L101.1 115.2 L100.2 115.4 L99.2 115.7 L98.3 116 L97.4 116.3 L96.5 116.6 L95.6 116.9 L94.7 117.2 L93.9 117.6 L93 117.9 L92.2 118.3 L91.3 118.7 L90.5 119.1 L89.7 119.5 L88.9 120 L88.1 120.4 L87.3 120.9 L87.3 121 L88.2 120.6 L89 120.2 L89.8 119.9 L90.7 119.5 L91.5 119.2 L92.4 118.8 L93.2 118.5 L94.1 118.2 L95 117.9 L95.8 117.6 L96.8 117.3 L97.7 117 L98.6 116.7 L99.5 116.5 L100.4 116.2 L101.3 116 L102.3 115.8 L103.3 115.6 L104.2 115.4 L105.2 115.2 L106.2 115 L107.2 114.8 L108.2 114.7 L109.3 114.6 L110.3 114.4 L111.3 114.3 L112.3 114.3 L113.2 114.2 L114.2 114.1 L115.2 114 L116.2 114 L117.2 113.9 L118.1 113.8 L119.1 113.8 L120 113.7 L121 113.6 L122 113.6 L122.9 113.5 L123.9 113.4 L124.8 113.4 L125.7 113.3 L126.7 113.2 L127.6 113.1 L128.5 113 L129.3 112.9 L130.2 112.8 L131.1 112.7 L131.9 112.6 L132.8 112.4ZM130.3 113.8 L129.4 113.8 L128.5 113.8 L127.6 113.9 L126.7 113.9 L125.8 113.9 L124.8 114 L123.9 114 L123 114 L122 114.1 L121 114.1 L120.1 114.2 L119.1 114.2 L118.2 114.3 L117.2 114.3 L116.2 114.4 L115.2 114.4 L114.2 114.5 L113.3 114.6 L112.3 114.6 L111.3 114.7 L110.4 114.8 L109.3 114.9 L108.3 115.1 L107.3 115.2 L106.3 115.4 L105.3 115.6 L104.3 115.8 L103.3 116 L102.4 116.2 L101.5 116.4 L100.5 116.7 L99.6 116.9 L98.7 117.2 L97.8 117.5 L96.9 117.8 L96 118.1 L95.2 118.5 L94.3 118.8 L93.5 119.2 L92.7 119.5 L91.8 119.9 L91 120.3 L90.2 120.8 L90.2 120.8 L91.1 120.5 L92 120.2 L92.8 119.8 L93.6 119.5 L94.5 119.2 L95.3 118.9 L96.2 118.6 L97.1 118.3 L98 118 L98.9 117.8 L99.8 117.5 L100.7 117.3 L101.6 117.1 L102.5 116.8 L103.5 116.7 L104.5 116.5 L105.4 116.3 L106.4 116.1 L107.4 115.9 L108.4 115.8 L109.4 115.7 L110.4 115.5 L111.4 115.5 L112.3 115.4 L113.3 115.3 L114.3 115.2 L115.3 115.1 L116.2 115.1 L117.2 115 L118.2 114.9 L119.2 114.9 L120.1 114.8 L121.1 114.7 L122 114.7 L123 114.6 L123.9 114.5 L124.9 114.5 L125.8 114.4 L126.7 114.3 L127.6 114.2 L128.5 114.1 L129.4 114 L130.3 113.8ZM150.6 107.1 L152.6 107.5 L154.5 107.7 L156.4 107.9 L158.4 108.1 L160.4 108.3 L162.4 108.5 L164.4 108.7 L166.4 108.8 L168.4 109 L170.5 109.1 L172.5 109.3 L174.6 109.4 L176.7 109.6 L178.8 109.7 L180.9 109.8 L183.1 109.9 L185.2 110 L187.4 109.9 L187.4 109.9 L185.2 109.5 L183.1 109.3 L181 109.1 L178.9 108.9 L176.8 108.7 L174.7 108.5 L172.6 108.3 L170.6 108.2 L168.5 108 L166.5 107.8 L164.4 107.7 L162.4 107.6 L160.4 107.4 L158.5 107.3 L156.5 107.2 L154.5 107.1 L152.6 107 L150.7 107.1ZM152.5 108.4 L154.4 108.7 L156.4 108.9 L158.3 109.1 L160.3 109.3 L162.3 109.5 L164.3 109.7 L166.3 109.8 L168.3 110 L170.4 110.2 L172.5 110.3 L174.5 110.4 L176.6 110.6 L178.7 110.7 L180.8 110.8 L183 110.9 L185.1 110.9 L185.1 110.8 L183 110.5 L180.9 110.3 L178.8 110.1 L176.7 109.9 L174.6 109.7 L172.5 109.5 L170.5 109.3 L168.4 109.2 L166.4 109 L164.4 108.9 L162.3 108.8 L160.4 108.6 L158.4 108.5 L156.4 108.4 L154.4 108.3 L152.5 108.3ZM160.7 116.2 L162.4 116.6 L164.1 116.8 L165.8 117 L167.4 117.2 L169.1 117.5 L170.8 117.7 L172.5 117.8 L174.2 118 L175.9 118.2 L177.6 118.4 L179.3 118.5 L181 118.7 L182.7 118.8 L184.4 118.9 L186 119 L187.7 119.1 L189.4 119.2 L191 119.2 L191 119.1 L189.4 118.8 L187.8 118.6 L186.1 118.3 L184.4 118.1 L182.8 117.9 L181.1 117.7 L179.4 117.6 L177.7 117.4 L176 117.2 L174.3 117 L172.6 116.9 L170.9 116.7 L169.2 116.6 L167.5 116.5 L165.8 116.3 L164.1 116.2 L162.4 116.1 L160.7 116.2ZM162.3 117.5 L164 117.8 L165.7 118 L167.3 118.2 L169 118.5 L170.7 118.7 L172.4 118.8 L174.1 119 L175.8 119.2 L177.5 119.4 L179.2 119.5 L180.9 119.7 L182.6 119.8 L184.3 119.9 L185.9 120 L187.6 120.1 L189.3 120.1 L189.3 120.1 L187.7 119.8 L186 119.5 L184.3 119.3 L182.7 119.1 L181 118.9 L179.3 118.7 L177.6 118.6 L175.9 118.4 L174.2 118.2 L172.5 118.1 L170.8 117.9 L169.1 117.8 L167.4 117.6 L165.7 117.5 L164 117.4 L162.3 117.4ZM164.8 122.7 L165.8 123 L166.7 123.2 L167.7 123.4 L168.6 123.6 L169.6 123.8 L170.5 123.9 L171.5 124 L172.4 124.2 L173.4 124.3 L174.3 124.4 L175.2 124.5 L176.1 124.6 L177 124.7 L177.9 124.7 L178.8 124.8 L179.7 124.8 L180.5 124.8 L181.4 124.8 L181.4 124.7 L180.6 124.4 L179.7 124.3 L178.9 124.1 L178 124 L177.1 123.8 L176.2 123.7 L175.3 123.5 L174.4 123.4 L173.5 123.3 L172.6 123.2 L171.6 123.1 L170.7 123 L169.7 122.9 L168.7 122.8 L167.8 122.7 L166.8 122.7 L165.8 122.6 L164.8 122.7ZM165.6 123.9 L166.6 124.2 L167.6 124.4 L168.5 124.6 L169.5 124.8 L170.4 124.9 L171.4 125 L172.3 125.2 L173.2 125.3 L174.2 125.4 L175.1 125.5 L176 125.6 L176.9 125.7 L177.8 125.7 L178.7 125.8 L179.6 125.8 L180.4 125.8 L180.4 125.7 L179.6 125.5 L178.7 125.3 L177.9 125.1 L177 125 L176.1 124.8 L175.2 124.7 L174.3 124.6 L173.3 124.5 L172.4 124.4 L171.5 124.3 L170.5 124.2 L169.6 124.1 L168.6 124 L167.6 123.9 L166.6 123.9 L165.6 123.9Z" fill="#1F1A14"/></g><path d="M58 97 C74 94 92 91.5 108 91 C118 90.8 126 91.5 132 93 C150 95 170 96.5 188 98.5 C196 99.4 201 101 201 104.5 C201 107.5 198 109 194 109.2 C200 109.5 207 110.5 207 114 C207 117.5 202 118.6 196 118.4 C200 119.2 201 122.5 197 123.6 C193 124.6 188 124.2 184 123.8 C188 124.8 188 128 183 128.6 C176 129.2 168 128.6 160 128.2 C146 127.6 134 128.6 122 130.6 C104 133.6 82 133.6 58 131 Z" fill="none" stroke="#1F1A14" stroke-width="2.3" stroke-linejoin="round"/><path d="M133.9 105.6 L137.3 105.8 L140.8 106.1 L144.3 106.3 L147.8 106.5 L151.4 106.8 L155 107 L158.7 107.3 L162.4 107.5 L166.2 107.8 L170 108.1 L173.9 108.3 L177.8 108.6 L181.8 108.8 L185.8 109.1 L189.9 109.4 L194 109.7 L194 108.8 L189.9 108.4 L185.9 108.1 L181.9 107.8 L177.9 107.4 L174 107.1 L170.1 106.8 L166.3 106.4 L162.6 106.1 L158.8 105.8 L155.2 105.5 L151.5 105.1 L147.9 104.8 L144.4 104.5 L140.9 104.2 L137.5 103.9 L134.1 103.6ZM145.9 114.6 L148.9 114.8 L152 115.1 L155.1 115.3 L158.2 115.6 L161.4 115.9 L164.6 116.2 L167.7 116.4 L170.9 116.7 L174.1 117 L177.3 117.3 L180.5 117.6 L183.6 117.8 L186.8 118.1 L189.9 118.4 L192.9 118.6 L196 118.8 L196 118 L193 117.7 L190 117.3 L186.9 117 L183.7 116.7 L180.6 116.3 L177.4 116 L174.3 115.6 L171.1 115.3 L167.9 114.9 L164.7 114.6 L161.5 114.2 L158.4 113.9 L155.3 113.5 L152.2 113.2 L149.1 112.9 L146.1 112.6ZM155.9 121.4 L157.8 121.6 L159.6 121.8 L161.5 122 L163.4 122.2 L165.2 122.4 L167 122.6 L168.9 122.8 L170.7 123 L172.4 123.2 L174.2 123.3 L175.9 123.5 L177.6 123.7 L179.2 123.8 L180.8 124 L182.4 124.1 L183.9 124.2 L184.1 123.3 L182.5 123.2 L181 123 L179.4 122.7 L177.7 122.5 L176.1 122.3 L174.3 122 L172.6 121.8 L170.8 121.5 L169.1 121.3 L167.2 121 L165.4 120.7 L163.6 120.5 L161.7 120.2 L159.9 119.9 L158 119.7 L156.1 119.4Z" fill="#1F1A14"/><path d="M70 106 C84 100.5 102 98 118 99 C127 99.6 133 100.8 137.5 102.8 C141 104.4 140.6 108 137 109 C130 110.6 120 110.4 110 111.4 C99 112.6 90 116 82 121" fill="#F2E6C6" stroke="#1F1A14" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M128 100.4 C132 100.9 135.6 102 137.2 103.6 C134.6 104.2 131.4 104 128.6 103.6ZM186 98.6 C191 99.2 195.6 100.2 198.4 102 C195 102.6 190.6 102.2 186.4 101.8Z" fill="none" stroke="#1F1A14" stroke-width="1.1"/><path d="M158 96.4 L158 96.8 L158 97.2 L158.1 97.5 L158.1 97.9 L158.2 98.2 L158.2 98.5 L158.2 98.8 L158.2 99.1 L158.2 99.4 L158.2 99.7 L158.2 100 L158.2 100.4 L158.2 100.7 L158.2 101 L158.2 101.4 L158.2 101.8 L158.2 101.8 L158.5 101.5 L158.8 101.2 L158.9 100.9 L159.1 100.5 L159.2 100.2 L159.3 99.8 L159.3 99.5 L159.3 99.1 L159.3 98.7 L159.2 98.3 L159.1 98 L159 97.6 L158.8 97.3 L158.6 97 L158.4 96.7 L158 96.4ZM161.2 96.8 L161.2 97.1 L161.2 97.4 L161.3 97.7 L161.3 98 L161.3 98.2 L161.3 98.5 L161.4 98.8 L161.4 99 L161.4 99.3 L161.4 99.5 L161.4 99.8 L161.4 100 L161.4 100.3 L161.3 100.6 L161.3 100.9 L161.4 101.2 L161.4 101.2 L161.7 101 L161.8 100.7 L162 100.5 L162.1 100.2 L162.2 99.9 L162.2 99.6 L162.3 99.3 L162.3 99 L162.2 98.7 L162.2 98.4 L162.1 98.1 L162 97.8 L161.9 97.5 L161.7 97.2 L161.5 97 L161.2 96.8ZM181 98.3 L181 98.6 L181 98.9 L181 99.2 L181.1 99.4 L181.1 99.7 L181.1 99.9 L181.1 100.1 L181.1 100.4 L181.1 100.6 L181.1 100.8 L181.1 101.1 L181.1 101.3 L181.1 101.6 L181.1 101.8 L181.1 102.1 L181.2 102.4 L181.2 102.4 L181.5 102.2 L181.7 102 L181.8 101.7 L181.9 101.5 L182 101.2 L182.1 100.9 L182.1 100.6 L182.1 100.3 L182.1 100 L182 99.8 L182 99.5 L181.8 99.2 L181.7 98.9 L181.5 98.7 L181.3 98.5 L181 98.3ZM126.4 92.6 L126.6 93 L126.9 93.3 L127.1 93.7 L127.3 94 L127.4 94.3 L127.6 94.6 L127.7 94.9 L127.8 95.2 L127.8 95.5 L127.9 95.8 L127.9 96.1 L128 96.4 L128 96.7 L128 97 L128 97.4 L128 97.8 L128 97.8 L128.3 97.5 L128.5 97.2 L128.7 96.8 L128.8 96.5 L128.8 96.1 L128.8 95.7 L128.8 95.3 L128.7 94.9 L128.6 94.5 L128.4 94.2 L128.2 93.8 L127.9 93.5 L127.6 93.2 L127.3 93 L126.9 92.7 L126.4 92.6ZM104 103.4 L104 103.7 L104 104 L104.1 104.3 L104.1 104.6 L104.1 104.8 L104.1 105.1 L104.2 105.3 L104.2 105.6 L104.2 105.8 L104.1 106.1 L104.1 106.4 L104.1 106.6 L104.1 106.9 L104 107.2 L104 107.5 L104 107.8 L104 107.8 L104.3 107.6 L104.5 107.4 L104.7 107.1 L104.8 106.8 L104.9 106.5 L105 106.2 L105 105.9 L105 105.6 L105 105.3 L105 105 L104.9 104.7 L104.8 104.4 L104.7 104.1 L104.5 103.8 L104.3 103.6 L104 103.4Z" fill="#1F1A14"/><path d="M44 82 q-5.5 5.3 0 10.7 q-5.5 5.3 0 10.7 q-5.5 5.3 0 10.7 q-5.5 5.3 0 10.7 q-5.5 5.3 0 10.7 q-5.5 5.3 0 10.7 L60 146 q5.5 -5.3 0 -10.7 q5.5 -5.3 0 -10.7 q5.5 -5.3 0 -10.7 q5.5 -5.3 0 -10.7 q5.5 -5.3 0 -10.7 q5.5 -5.3 0 -10.7 Z" fill="#F2E6C6" stroke="#1F1A14" stroke-width="2.4" stroke-linejoin="round"/><path d="M48.5 85.2 L55.5 88.2 M48.5 95.9 L55.5 98.9 M48.5 106.5 L55.5 109.5 M48.5 117.2 L55.5 120.2 M48.5 127.9 L55.5 130.9 M48.5 138.5 L55.5 141.5 " stroke="#1F1A14" stroke-width="1.3" stroke-linecap="round"/></g>`;
let handEl = null, handAngle = -1, pendEl = null, pendAngle = 99;
function setHand(deg){
  if (!handEl) return;
  const a = Math.round(deg * 10) / 10;
  if (a === handAngle) return;
  handAngle = a;
  /* the forearm turns at the elbow, out of the picture behind the sleeve */
  handEl.setAttribute('transform', `rotate(${-a * 0.51} -170 118)`);
}
function setPend(deg){
  if (!pendEl) pendEl = document.getElementById('pendRot');
  if (!pendEl) return;
  const a = Math.round(deg * 10) / 10;
  if (a === pendAngle) return;
  pendAngle = a;
  pendEl.setAttribute('transform', `rotate(${a} 98 150)`);
}
function initHand(){
  handEl = document.getElementById('handRot');
  if (handEl) { handEl.innerHTML = HAND_SVG; handAngle = -1; setHand(0); }
  pendEl = document.getElementById('pendRot'); pendAngle = 99; setPend(0);
}
function syncBeat(){
  const on = {hand: S.beatHand, pendulum: S.beatPend, tick: S.beatTick};
  document.querySelectorAll('#beatList button').forEach(b => pressed(b, !!on[b.dataset.beat]));
  if ($('#handBox')) $('#handBox').hidden = !S.beatHand;
  if ($('#pendBox')) { $('#pendBox').hidden = !S.beatPend; $('#pendBox').classList.toggle('both', S.beatHand && S.beatPend); }
  const r = document.documentElement.style;
  r.setProperty('--hand-op', String(S.handOp)); r.setProperty('--hand-sc', String(S.handSize));
}
let countShown = 0;
function showCount(n){
  if (n === countShown) return;
  countShown = n;
  const box = $('#countBox'); if (!box) return;
  box.hidden = !n;
  box.innerHTML = n ? `<span>${n}</span>` : '';
}
Object.assign(Organ, {HAND_SVG, setHand, setPend, initHand, syncBeat, showCount});

/* ------------------------------------------------------------------ */
/* Playback                                                            */
/* Organ.play(spec): spec.events = [{id, t, d, midi}] with t and d in  */
/* minims from the start of the piece (midi null for a rest; `hold`    */
/* a longer sounding length for a tied note, `silent` for the parts of */
/* a tie that do not strike again); spec.from: where to start, in      */
/* minims; spec.unit: the beat's length in minims; spec.count: beats   */
/* counted in; spec.group(beat): 2 or 3 beats to the hand's pattern;   */
/* spec.onFrame(ids, now, timeline); spec.onStop(now, timeline);       */
/* spec.onLoop(); spec.onStart(timeline); spec.level: loudness of     */
/* each voice (1 for one voice; less for many).                        */
/* ------------------------------------------------------------------ */
const beatSeconds = () => 60 / S.tempo;
function play(spec){
  const ctx = ensureAudio();
  if (!ctx) { H.toast('This browser cannot play sound.'); return false; }
  stop();
  const beat = beatSeconds(), spm = beat / (spec.unit || 2);
  const from = Math.max(0, spec.from || 0), offset = from * spm;
  const count = Math.max(0, Math.min(32, spec.count | 0));
  const c0 = ctx.currentTime + 0.12;
  for (let k = 0; k < count; k++) audio.voices.push(metroClick(ctx, audio.master, c0 + k * beat));
  const t0 = c0 + count * beat, origin = t0 - offset;
  /* several voices at once: each a little softer, so the sum stays as loud as one */
  const dest = ctx.createGain(); dest.gain.value = spec.level || 1; dest.connect(audio.bus);
  const tl = [], pending = [];
  let end = t0;
  for (const e of spec.events) {
    const a = origin + e.t * spm, b = origin + (e.t + e.d) * spm;
    if (b <= t0 + 1e-4) continue;
    const a1 = Math.max(a, t0);
    if (e.midi !== null && e.midi !== undefined && !e.silent) pending.push({a: a1, b: origin + (e.t + (e.hold || e.d)) * spm - 0.012, midi: e.midi});
    tl.push({i: e.id, t0: a1, t1: b});
    end = Math.max(end, b);
  }
  pending.sort((x, y) => x.a - y.a);
  /* the audible tick, one per beat */
  const ticks = [];
  if (S.beatTick) for (let k = Math.ceil(offset / beat - 1e-6); origin + k * beat < end - 0.02; k++) ticks.push(origin + k * beat);
  /* Notes are made just before they sound (a little more than a second ahead), not all at once:
     a whole polyphonic piece made in advance would be thousands of oscillators and choke the browser. */
  const sched = {pending, pi: 0, ticks, ti: 0, dest, timer: 0};
  const feed = () => {
    if (audio.timeline !== T) return;
    const until = ctx.currentTime + 1.2;
    while (sched.pi < pending.length && pending[sched.pi].a < until) {
      const n = pending[sched.pi++];
      audio.voices.push(voice(ctx, dest, freq(n.midi), Math.max(n.a, ctx.currentTime + 0.005), n.b));
    }
    while (sched.ti < ticks.length && ticks[sched.ti] < until) audio.voices.push(metroClick(ctx, audio.master, ticks[sched.ti++]));
    /* let go of the notes that are over */
    if (audio.voices.length > 64) { const now = ctx.currentTime; audio.voices = audio.voices.filter(v => !(v.t1 < now - 0.5)); }
  };
  const T = audio.timeline = {tl, end, origin, beat, count, c0, t0, spm, spec, sched, feed};
  feed();
  sched.timer = setInterval(feed, 200);   /* keeps feeding when the tab is in the background */
  if (spec.onStart) spec.onStart(audio.timeline);
  H.playing(true);
  audio.raf = requestAnimationFrame(tick);
  return true;
}
function tick(){
  const T = audio.timeline;
  if (!T) return;
  const now = audio.ctx.currentTime;
  if (now >= T.end) {
    if (S.loop) { if (T.spec.onLoop) T.spec.onLoop(); else play(Object.assign({}, T.spec, {from: 0, count: 0})); return; }
    stop(); return;
  }
  T.feed();
  const ids = [];
  for (const x of T.tl) if (now >= x.t0 && now < x.t1) ids.push(x.i);
  showCount(T.count && now >= T.c0 && now < T.t0 ? T.count - Math.floor((now - T.c0) / T.beat + 1e-6) : 0);
  /* tactus: a quick drop on one beat, a quick lift on the next, held still in between */
  if (S.beatPend) setPend(now < T.origin ? 24 : 24 * Math.cos(Math.PI * (now - T.origin) / T.beat));
  if (now < T.t0) setHand(0);
  else {
    const el = now - T.origin, bi = Math.floor(el / T.beat), t = el - bi * T.beat;
    const N = T.spec.group ? T.spec.group(bi) : 2;                 /* imperfectum: down, up. perfectum: down, (still down), up */
    const seg = T.spec.groupStart ? T.spec.groupStart(bi) : 0;     /* where the current mensuration began, in beats */
    const ph = (((bi - seg) % N) + N) % N;
    const a1 = ph === 0 && bi > 0 ? 45 : 0, a2 = ph === N - 1 ? 45 : 0;   /* the first downbeat: no movement */
    const p = Math.min(1, t / Math.min(0.09, T.beat * 0.3)), e = 1 - Math.pow(1 - p, 3);
    setHand(a1 + (a2 - a1) * e);
  }
  if (T.spec.onFrame) T.spec.onFrame(ids, now, T);
  audio.raf = requestAnimationFrame(tick);
}
function stop(){
  const T = audio.timeline;
  if (!T) return;
  cancelAnimationFrame(audio.raf);
  clearInterval(T.sched.timer);
  const now = audio.ctx.currentTime;
  if (T.spec.onStop) T.spec.onStop(now, T);
  audio.voices.forEach(v => silence(v, now));
  audio.voices = [];
  audio.timeline = null;
  if (T.spec.onFrame) T.spec.onFrame([], now, null);
  showCount(0);
  H.playing(false);
  setHand(0); setPend(0);
}
/* where the music stands, in minims from the start of the piece */
function position(){
  const T = audio.timeline;
  if (!T) return null;
  return Math.max(0, (audio.ctx.currentTime - T.origin) / T.spm);
}
const playing = () => !!audio.timeline;
Object.assign(Organ, {play, stop, position, playing, beatSeconds});

/* ------------------------------------------------------------------ */
/* The controls (the same markup in both apps; each part optional)     */
/* ------------------------------------------------------------------ */
const CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg>';
const PULSE = 60;   /* Gaffurius: the semibrevis lasts one pulse of someone breathing quietly */
function setTempo(v){
  const num = Number(v);
  v = (String(v).trim() === '' || !isFinite(num)) ? S.tempo : Math.max(10, Math.min(300, Math.round(num)));
  const changed = v !== S.tempo;
  S.tempo = v; if ($('#tempo')) $('#tempo').value = v; H.save();
  if (changed) H.replay();
}
function syncUnit(){
  const b = $('#unitBtn'); if (!b) return;
  b.innerHTML = (H.unitIcon ? H.unitIcon(S.unit) : S.unit) + CHEV;
  b.setAttribute('aria-label', `Beat: ${H.unitName(S.unit).toLowerCase()}. Change`);
  b.title = `${H.unitName(S.unit)} gets the beat`;
  document.querySelectorAll('#unitList li').forEach(li => li.setAttribute('aria-selected', li.dataset.d === S.unit ? 'true' : 'false'));
}
function chooseUnit(k){
  if (!H.units.includes(k)) return;
  S.unit = k; syncUnit(); H.save(); H.replay();
}
let unitActive = 0;
function markActive(){
  const items = document.querySelectorAll('#unitList li');
  items.forEach((li, i) => li.classList.toggle('active', i === unitActive));
  $('#unitList').setAttribute('aria-activedescendant', 'unit-' + H.units[unitActive]);
}
function openUnits(){
  const list = $('#unitList');
  list.hidden = false;
  $('#unitBtn').setAttribute('aria-expanded', 'true');
  unitActive = Math.max(0, H.units.indexOf(S.unit));
  markActive();
  list.focus();
}
function closeUnits(focusBtn){
  const list = $('#unitList');
  if (!list || list.hidden) return;
  list.hidden = true;
  $('#unitBtn').setAttribute('aria-expanded', 'false');
  if (focusBtn) $('#unitBtn').focus();
}
function syncOut(){ if ($('#bo')) $('#bo').textContent = S.bright; if ($('#ro')) $('#ro').textContent = S.room; }
function applySettingsOpen(){
  const side = $('.tp-side'); if (side) side.hidden = !S.setOpen;
  if ($('#toggleSet')) $('#toggleSet').setAttribute('aria-expanded', S.setOpen ? 'true' : 'false');
}
/* every control's shown value from the settings */
function sync(){
  if ($('#tempo')) $('#tempo').value = S.tempo;
  syncUnit(); syncBeat();
  if ($('#ref')) $('#ref').value = String(S.ref);
  if ($('#vol')) $('#vol').value = S.vol;
  if ($('#countIn')) $('#countIn').value = S.countIn ? String(S.countIn) : '';
  if ($('#reg')) { $('#reg').value = S.reg; }
  syncLp();
  if ($('#bright')) $('#bright').value = S.bright;
  if ($('#room')) $('#room').value = S.room;
  syncOut();
  pressed($('#loop'), S.loop);
  if ($('#tune') && $('#tn-atk')) syncTune();
  applySettingsOpen();
  if (audio.master) audio.master.gain.setTargetAtTime(masterLevel(), audio.ctx.currentTime, 0.03);
  if (audio.wet) audio.wet.gain.setTargetAtTime(roomLevel(), audio.ctx.currentTime, 0.03);
}
/* the recorded registrations, as a group of their own in the Sound menu */
function addSampledOptions(){
  const sel = $('#reg');
  if (!sel || sel.querySelector('optgroup')) return;
  const synth = document.createElement('optgroup'); synth.label = 'Synthesised organ';
  [...sel.children].forEach(o => synth.appendChild(o));
  const rec = document.createElement('optgroup'); rec.label = 'Recorded pipe organ';
  for (const [k, v] of Object.entries(SAMPLED)) { const o = document.createElement('option'); o.value = k; o.textContent = v.name; rec.appendChild(o); }
  sel.appendChild(synth); sel.appendChild(rec);
  sel.value = S.reg;
}
function wire(){
  initHand();
  /* note value that gets the beat */
  const list = $('#unitList');
  if (list && !list.children.length) H.units.forEach(k => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option'); li.dataset.d = k; li.id = 'unit-' + k;
    li.innerHTML = (H.unitIcon ? H.unitIcon(k) : '') + `<span>${H.unitName(k)}</span>`;
    li.addEventListener('click', () => { chooseUnit(k); closeUnits(true); });
    list.appendChild(li);
  });
  if ($('#unitBtn')) {
    $('#unitBtn').addEventListener('click', () => $('#unitList').hidden ? openUnits() : closeUnits(true));
    list.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        unitActive = Math.max(0, Math.min(H.units.length - 1, unitActive + (e.key === 'ArrowDown' ? 1 : -1)));
        markActive();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); e.stopPropagation(); chooseUnit(H.units[unitActive]); closeUnits(true);
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.stopPropagation(); closeUnits(e.key === 'Escape');
      } else e.stopPropagation();
    });
    document.addEventListener('pointerdown', e => { if (!e.composedPath().includes($('.unitpick'))) closeUnits(false); });
  }
  /* tap: two taps or more set the tempo */
  let taps = [];
  if ($('#tap')) $('#tap').addEventListener('click', () => {
    const t = performance.now();
    if (taps.length && t - taps[taps.length - 1] > 2500) taps = [];
    taps.push(t); taps = taps.slice(-6);
    if (taps.length >= 2) setTempo(60000 * (taps.length - 1) / (taps[taps.length - 1] - taps[0]));
  });
  const tempoIn = $('#tempo');
  if (tempoIn) {
    tempoIn.addEventListener('change', () => setTempo(tempoIn.value));
    tempoIn.addEventListener('keydown', e => { if (e.key === 'Enter') { setTempo(tempoIn.value); tempoIn.blur(); } });
  }
  /* − and +: one step per click, keeps going while held */
  for (const [id, step] of [['#tempoDown', -1], ['#tempoUp', 1]]) {
    const b = $(id); if (!b) continue;
    let hold = 0, rep = 0;
    const stopRep = () => { clearTimeout(hold); clearInterval(rep); };
    b.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      setTempo(S.tempo + step);
      hold = setTimeout(() => { rep = setInterval(() => setTempo(S.tempo + step), 70); }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, stopRep));
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setTempo(S.tempo + step); } });
  }
  if ($('#heart')) $('#heart').addEventListener('click', () => {
    S.unit = 'S'; syncUnit();
    S.tempo = PULSE; if ($('#tempo')) $('#tempo').value = PULSE; H.save();
    H.replay();
    H.toast('Semibrevis = 60 per minute: the pulse of someone at rest.');
  });
  document.querySelectorAll('#beatList button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.beat;
    if (k === 'hand') S.beatHand = !S.beatHand;
    else if (k === 'pendulum') S.beatPend = !S.beatPend;
    else S.beatTick = !S.beatTick;
    syncBeat(); H.save();
    if (k === 'tick') H.replay();
  }));
  if ($('#loop')) $('#loop').addEventListener('click', () => { S.loop = !S.loop; pressed($('#loop'), S.loop); H.save(); H.loopChanged(); });
  if ($('#countIn')) $('#countIn').addEventListener('change', e => {
    const v = Math.round(Number(e.target.value));
    S.countIn = e.target.value.trim() === '' || !(v > 0) ? 0 : Math.min(32, v);
    e.target.value = S.countIn ? String(S.countIn) : '';
    H.save();
  });
  if ($('#ref')) {
    $('#ref').addEventListener('input', e => { const v = Number(e.target.value); if (e.target.value !== '' && v >= 100 && v <= 1000) { S.ref = v; stop(); H.save(); } });
    $('#ref').addEventListener('change', e => { e.target.value = String(S.ref); });
  }
  if ($('#vol')) $('#vol').addEventListener('input', e => {
    S.vol = Number(e.target.value);
    if (audio.master) audio.master.gain.setTargetAtTime(masterLevel(), audio.ctx.currentTime, 0.03);
    H.save();
  });
  if ($('#toggleSet')) $('#toggleSet').addEventListener('click', () => { S.setOpen = !S.setOpen; applySettingsOpen(); H.save(); });
  addSampledOptions();
  if ($('#tune')) buildTune();
  if ($('#reg')) $('#reg').addEventListener('change', e => {
    S.reg = e.target.value;
    if (S.reg !== 'custom' && !isSampled(S.reg)) S.draw = padDraw(REGISTERS[S.reg].h);
    syncTune(); syncLp(); H.save();
    if (isSampled(S.reg)) { const r = S.reg; Sampler.prepare(r).then(ok => { if (ok && S.reg === r) testTone(); }); }
    else testTone();
  });
  /* the recorded organ chosen earlier: fetched now, quietly, so it is there when Play is pressed */
  if (isSampled(S.reg)) Sampler.prepare(S.reg, true);
  if ($('#copySound')) $('#copySound').addEventListener('click', () => {
    const t = `Sound: ${REGISTERS[S.reg].name}; brightness ${S.bright}; room ${S.room}; attack ${S.atk} ms; release ${S.rel} ms; chiff ${S.chiff}; wind ${S.wind}; scoop ${S.scoop} cents; ensemble ${S.ens} cents; drawbars ${S.draw.join(' ')}; a′ ${S.ref} Hz.`;
    const done = () => { $('#copySound').textContent = 'Copied'; setTimeout(() => { $('#copySound').textContent = 'Copy sound settings'; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => window.prompt('Copy this:', t));
    else window.prompt('Copy this:', t);
  });
  if ($('#bright')) {
    $('#bright').addEventListener('input', e => { S.bright = Number(e.target.value); syncOut(); syncLp(); H.save(); });
    $('#bright').addEventListener('change', testTone);
  }
  if ($('#room')) {
    $('#room').addEventListener('input', e => { S.room = Number(e.target.value); syncOut(); if (audio.wet) audio.wet.gain.setTargetAtTime(roomLevel(), audio.ctx.currentTime, 0.03); H.save(); });
    $('#room').addEventListener('change', testTone);
  }
  sync();
}
Object.assign(Organ, {wire, sync, syncUnit, setTempo, applySettingsOpen, PULSE});
window.Organ = Organ;
})();
