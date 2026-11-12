/* Scriptorium add-on: Sing (from CantusFirmus). Runs inside the engine (see scriptorium.js), for every app.
   The pitch the microphone hears shows as a faint red dot on the staff of the voice being sung; with Notate on,
   what is sung during playback is written out as a voice of its own ("Sung"), which can then be edited like any other.
   The organ's own notes are notched out of the microphone signal (every harmonic of the notes sounding now and of the
   ones just before, still ringing in the room), unless Headphones is on. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const audio = Organ.audio;
  const pressed = (el, on) => { if (el) el.setAttribute('aria-pressed', on ? 'true' : 'false'); };
  if (st.micFlex === undefined) st.micFlex = true;
  if (st.micNotate === undefined) st.micNotate = true;
  if (st.micPhones === undefined) st.micPhones = false;
  if (st.micDia === undefined) st.micDia = false;
  if (st.micLag === undefined) st.micLag = 0;
  if (st.micCal === undefined) st.micCal = null;

  const mic = {on: false, busy: false, stream: null, nodes: [], notch: [], an: null, raw: null, dec: null, yd: null,
               raf: 0, hist: [], shown: null, snap: null, pend: null, pendT: 0, seen: 0, peak: 0, lastT: 0, q: 1, drawn: '', pre: null, preRaw: null, pa: null, tilt: null, last: []};
  const NOTCH_N = 8, BANKS = 5, MIC_FMIN = 70, MIC_FMAX = 1100, MIC_LEFT = 0.1, MIC_GATE = 0.005;
  const freqOfMidi = m => st.ref * Math.pow(2, (m - 69) / 12);

  /* ---------------- which voice is sung ---------------- */
  /* the first shown voice whose Playback is off; else the voice being edited; else the top voice */
  function singIdx(){
    if (!piece) return -1;
    const ok = (v, k) => v.abbr !== 'sung' && vis(k).on;
    let i = piece.voices.findIndex((v, k) => ok(v, k) && !vis(k).play);
    if (i < 0) { const v = anyVoice(); if (v && v.abbr !== 'sung') i = piece.voices.indexOf(v); }
    if (i < 0) i = piece.voices.findIndex(ok);
    return i;
  }
  /* ---------------- the microphone ---------------- */
  function organPartials(freq){
    const amps = Organ.organAmps(), max = Math.max(...amps, 1e-9);
    return amps.map((a, i) => ({f: freq * (i + 1), a: a / max}))
      .filter(p => p.a > 0.02 && p.f < 6000).sort((p, q) => q.a - p.a).slice(0, NOTCH_N).map(p => p.f);
  }
  function setBank(b, freqs, now){
    for (let k = 0; k < NOTCH_N; k++) {
      const n = mic.notch[b * NOTCH_N + k], fq = freqs[k] || 20000;
      if (Math.abs(n.frequency.value - fq) > 0.01) n.frequency.setValueAtTime(fq, now);
    }
  }
  /* the organ notes the microphone may be hearing now: those sounding, and those that stopped less than 0.6 s ago */
  function micBanks(now){
    const cur = [], prev = [];
    const T = audio.timeline;
    if (T && T.sched) {
      for (const n of T.sched.pending) {
        if (n.a > now + 0.02) break;
        if (now < n.b + 0.05) cur.push(freqOfMidi(n.midi));
        else if (now - n.b < 0.6) prev.push({f: freqOfMidi(n.midi), age: now - n.b});
      }
    }
    const a = audio.audInfo;
    if (a && now < a.t1 + 0.6) { if (now < a.t1 + 0.05) cur.push(a.f); else prev.push({f: a.f, age: now - a.t1}); }
    if (cur.length) mic.last = cur.map(f => ({f, t: now}));
    else if (!prev.length) for (const l of mic.last) if (now - l.t < 0.6) prev.push({f: l.f, age: now - l.t});
    prev.sort((p, q) => p.age - q.age);
    return [cur, prev];
  }
  async function micStart(){
    if (mic.on || mic.busy) return;
    const ctx = Organ.ensureAudio();
    if (!ctx || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('This browser cannot use the microphone here.'); return; }
    mic.busy = true;
    let stream;
    try {
      /* the raw microphone: echo cancelling and noise suppression bend a sung tone; the organ is taken out here instead */
      stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}});
    } catch (e) {
      mic.busy = false;
      toast(e && e.name === 'NotAllowedError' ? 'The microphone is blocked. Allow it for this site to sing along.' : 'No microphone could be opened.');
      return;
    }
    mic.busy = false;
    mic.stream = stream;
    const src = ctx.createMediaStreamSource(stream);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 55; hp.Q.value = 0.7;
    src.connect(hp);
    mic.pre = ctx.createAnalyser(); mic.pre.fftSize = 2048; mic.pre.smoothingTimeConstant = 0;
    hp.connect(mic.pre);
    let node = hp;
    mic.notch = [];
    for (let k = 0; k < BANKS * NOTCH_N; k++) {
      const n = ctx.createBiquadFilter(); n.type = 'notch'; n.frequency.value = 20000; n.Q.value = 30;
      node.connect(n); node = n; mic.notch.push(n);
    }
    mic.an = ctx.createAnalyser(); mic.an.fftSize = 2048; mic.an.smoothingTimeConstant = 0;
    node.connect(mic.an);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; lp.Q.value = 0.6;   /* tilts the voice towards its fundamental */
    mic.pa = ctx.createAnalyser(); mic.pa.fftSize = 2048; mic.pa.smoothingTimeConstant = 0;
    node.connect(lp); lp.connect(mic.pa);
    const mute = ctx.createGain(); mute.gain.value = 0;      /* keeps the analysers running in every browser; nothing is heard */
    mic.an.connect(mute); mute.connect(ctx.destination);
    mic.pre.connect(mute); mic.pa.connect(mute);
    mic.nodes = [src, hp, mic.pre, ...mic.notch, mic.an, lp, mic.pa, mute];
    mic.tilt = new Float32Array(mic.pa.fftSize);
    mic.preRaw = new Float32Array(mic.pre.fftSize);
    mic.raw = new Float32Array(mic.an.fftSize); mic.dec = new Float32Array(mic.an.fftSize >> 1);
    mic.yd = new Float32Array(mic.dec.length);
    mic.on = true; mic.hist = []; mic.shown = null; mic.snap = null; mic.pend = null; mic.seen = 0; mic.peak = 0; mic.last = []; mic.lowT = null; mic.onset = false;
    pressed($('#mic'), true);
    const i = singIdx();
    toast(`Sing${i >= 0 ? ' the ' + piece.voices[i].name : ''}: your pitch shows as a red dot on its staff.`);
    mic.raf = requestAnimationFrame(micTick);
  }
  function micStop(){
    if (!mic.on) return;
    mic.on = false;
    cancelAnimationFrame(mic.raf);
    mic.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
    if (mic.stream) mic.stream.getTracks().forEach(t => t.stop());
    mic.stream = null; mic.nodes = []; mic.notch = [];
    pressed($('#mic'), false);
    takeKeep();
    takeClear();
    clearDot();
  }
  /* Pitch: YIN (de Cheveigné and Kawahara 2002), made to hold on to the fundamental (see CantusFirmus). */
  function localMin(d, t, lo, hi){
    let b = t;
    for (let k = Math.max(lo, Math.floor(t * 0.96)); k <= Math.min(hi, Math.ceil(t * 1.04)); k++) if (d[k] < d[b]) b = k;
    return b;
  }
  function yin(x, sr){
    const N = x.length, maxT = Math.min(Math.floor(sr / MIC_FMIN), N >> 1), minT = Math.max(2, Math.floor(sr / MIC_FMAX)), W = N - maxT, d = mic.yd;
    for (let t = 1; t <= maxT; t++) {
      let s = 0;
      for (let i = 0; i < W; i++) { const v = x[i] - x[i + t]; s += v * v; }
      d[t] = s;
    }
    d[0] = 1;
    let run = 0;
    for (let t = 1; t <= maxT; t++) { run += d[t]; d[t] = run > 0 ? d[t] * t / run : 1; }
    let g = minT;
    for (let t = minT; t < maxT; t++) if (d[t] < d[g]) g = t;
    if (d[g] > 0.3) return null;
    const lim = Math.max(0.1, d[g] * 1.5 + 0.02);
    let tau = g;
    for (let t = minT; t < maxT; t++) {
      if (d[t] <= lim) { while (t + 1 < maxT && d[t + 1] < d[t]) t++; tau = t; break; }
    }
    for (let m = 2; m <= 4; m++) {
      const tm = m * tau;
      if (tm >= maxT - 1) break;
      const k = localMin(d, tm, minT, maxT - 2);
      if (d[tau] > 0.03 && d[k] < 0.55 * d[tau]) { tau = k; m = 1; }
    }
    const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a + c - 2 * b;
    const sh = den > 0 ? Math.max(-0.5, Math.min(0.5, (a - c) / (2 * den))) : 0;
    mic.q = b;
    return sr / (tau + sh);
  }
  const rmsOf = x => { let e = 0; for (let i = 0; i < x.length; i++) e += x[i] * x[i]; return Math.sqrt(e / x.length); };
  const median = a => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
  function micPitch(raw, sr){
    for (let i = 0; i < mic.dec.length; i++) mic.dec[i] = 0.5 * (raw[2 * i] + raw[2 * i + 1]);
    return yin(mic.dec, sr / 2);
  }
  /* What the dot shows: a new note once clean readings agree for 45 ms (an octave jump only after 95 ms); small changes followed smoothly. */
  function micTrack(m, q, rms, t){
    const dt = t - mic.lastT; mic.lastT = t;
    mic.peak = Math.max(rms, mic.peak * Math.pow(0.5, Math.max(0, dt) / 700));
    if (rms < 0.25 * mic.peak) { if (mic.lowT === null) mic.lowT = t; }
    else if (rms > 0.5 * mic.peak) { if (mic.lowT !== null && t - mic.lowT >= 30) mic.onset = true; mic.lowT = null; }
    if (m !== null && rms < 0.15 * mic.peak) m = null;
    const H = mic.hist;
    H.push({t, m, q});
    while (H.length && t - H[0].t > 400) H.shift();
    if (m !== null) {
      if (mic.shown !== null && Math.abs(m - mic.shown) < 1.5) {
        if (q < 0.3) {
          const near = H.filter(h => h.m !== null && h.q < 0.3 && t - h.t < 90 && Math.abs(h.m - mic.shown) < 1.5).map(h => h.m);
          mic.shown += 0.35 * (median(near) - mic.shown); mic.seen = t;
        }
      } else if (q < 0.15) {
        const run = [];
        for (let i = H.length - 1; i >= 0 && H[i].m !== null && H[i].q < 0.15 && Math.abs(H[i].m - m) < 0.8; i--) run.push(H[i]);
        const span = run.length ? t - run[run.length - 1].t : 0, dd = mic.shown === null ? 0 : m - mic.shown;
        const oct = Math.abs(dd) > 10 && Math.abs(dd - 12 * Math.round(dd / 12)) < 1;
        if (run.length >= 3 && span >= (oct ? 95 : 45)) { mic.shown = median(run.map(h => h.m)); mic.seen = t; }
      }
    }
    if (mic.shown !== null && t - mic.seen > 270) mic.shown = null;
    if (mic.shown === null) { mic.snap = null; mic.pend = null; return; }
    const near = Math.round(mic.shown);
    if (st.micFlex) { if (mic.snap === null || Math.abs(mic.shown - mic.snap) > 0.62) mic.snap = near; return; }
    if (mic.snap === null) { mic.snap = near; mic.pend = null; }
    else if (Math.abs(mic.shown - mic.snap) > 0.7 && near !== mic.snap) {
      if (mic.pend !== near) { mic.pend = near; mic.pendT = t; }
      else if (t - mic.pendT >= 120) { mic.snap = near; mic.pend = null; }
    } else mic.pend = null;
  }
  /* is this frequency one of the organ's notes, or its octave, within so many cents? */
  const onOrgan = (hz, list, ct) => list.some(o => o && [1, 2].some(k => Math.abs(1200 * Math.log2(hz / (o * k))) < ct));
  function micTick(){
    if (!mic.on) return;
    const ctx = audio.ctx, now = ctx.currentTime;
    const [cur, prev] = micBanks(now);
    mic.pre.getFloatTimeDomainData(mic.preRaw);
    const preRms = rmsOf(mic.preRaw);
    const filt = !st.micPhones, q = st.ens > 3 ? 30 : 60;
    if (mic.notch.length && mic.notch[0].Q.value !== q) mic.notch.forEach(n => { n.Q.value = q; });
    const banks = [...new Set(cur)].slice(0, BANKS);
    for (const p of prev) { if (banks.length >= BANKS) break; if (!banks.includes(p.f)) banks.push(p.f); }
    for (let b = 0; b < BANKS; b++) setBank(b, filt && banks[b] ? organPartials(banks[b]) : [], now);
    mic.an.getFloatTimeDomainData(mic.raw);
    const rms = rmsOf(mic.raw);
    const recent = [...cur, ...prev.filter(p => p.age < 0.2).map(p => p.f)];
    let hz = null;
    if (rms > MIC_GATE && (!filt || !banks.length || rms > MIC_LEFT * preRms)) {
      mic.pa.getFloatTimeDomainData(mic.tilt);
      hz = micPitch(mic.tilt, ctx.sampleRate);
      /* through speakers, a reading on one of the organ's own notes (or its octave) is the organ, not the singer */
      if (hz && filt && onOrgan(hz, recent, 70)) hz = null;
    }
    const mm = hz ? 69 + 12 * Math.log2(hz / st.ref) : null;
    micTrack(mm, hz ? mic.q : 1, rms, performance.now());
    if (filt && mic.shown !== null && onOrgan(freqOfMidi(mic.shown), recent, 80)) { mic.shown = null; mic.snap = null; mic.pend = null; }
    takeRecord(now, mm, hz ? mic.q : 1, rms);
    drawDot();
    mic.raf = requestAnimationFrame(micTick);
  }
  /* Clap test: eight clicks; the loudest sound near each one is the clap. The median distance, from the fourth on, is the latency. */
  async function clapTest(){
    if (!mic.on) await micStart();
    if (!mic.on || mic.clap) return;
    stopPlay();
    const ctx = audio.ctx, sr = ctx.sampleRate, n = 8, gap = 0.6, t0 = ctx.currentTime + 0.6;
    const clicks = [];
    for (let k = 0; k < n; k++) { Organ.metroClick(ctx, audio.master, t0 + k * gap); clicks.push(t0 + k * gap); }
    const btn = $('#micClap'); btn.disabled = true; mic.clap = true;
    toast('Clap with each click.');
    const buf = new Float32Array(mic.pre.fftSize), peaks = [];
    let last = ctx.currentTime;
    await new Promise(done => {
      const step = () => {
        const now = ctx.currentTime;
        mic.pre.getFloatTimeDomainData(buf);
        const fresh = Math.min(buf.length, Math.ceil((now - last) * sr) + 128);
        let a = 0, at = 0;
        for (let i = buf.length - fresh; i < buf.length; i++) { const v = Math.abs(buf[i]); if (v > a) { a = v; at = i; } }
        peaks.push({t: now - (buf.length - at) / sr, a});
        last = now;
        if (now < t0 + n * gap + 0.3) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
    btn.disabled = false; mic.clap = false;
    const floor = median(peaks.map(q => q.a)) || 1e-4, offs = [];
    clicks.forEach((tc, k) => {
      if (k < 3) return;
      let best = null;
      for (const q of peaks) if (q.t > tc - 0.2 && q.t < tc + 0.45 && (!best || q.a > best.a)) best = q;
      if (best && best.a > 4 * floor) offs.push(best.t - tc);
    });
    if (offs.length < 3) { toast('No claps were heard. Try again, a little louder.'); return; }
    st.micCal = Math.max(0, Math.min(0.6, median(offs)));
    $('#micLat').value = Math.round(st.micCal * 1000);
    save();
    toast(`Latency: ${Math.round(st.micCal * 1000)} ms.`);
  }

  /* ---------------- the dot ---------------- */
  /* the sung note, spelled the way early music spells it: C♯ E♭ F♯ G♯ B♭ */
  const SPELL = [[0, 0], [0, 1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [6, -1], [6, 0]];
  const spellMidi = m => { const [L, alt] = SPELL[((m % 12) + 12) % 12]; return {s: 7 * (Math.floor(m / 12) - 1) + L, L, alt}; };
  /* where in the piece we are now, in semibreves (null when nothing plays) */
  function nowT(){
    const T = audio.timeline; if (!T || !audio.ctx) return null;
    return Math.max(0, (audio.ctx.currentTime - T.origin) / T.spm / 2);
  }
  function clearDot(){ document.querySelectorAll('#pages .mic').forEach(g => g.remove()); mic.drawn = ''; mic.el = null; }
  /* the dot stands on the column of the note of the sung voice that sounds now (or the one selected, or its first note) */
  function drawDot(){
    const vi = singIdx(), v = vi >= 0 ? piece.voices[vi] : null;
    if (!v || !v.syms || !v.syms.length || mic.snap === null || mic.shown === null) { if (mic.drawn) clearDot(); return; }
    const t = nowT();
    let k = -1;
    if (t !== null) k = v.syms.findIndex(s => s.t <= t + EPS && t < s.t + s.d - EPS);
    if (k < 0 && ed.sel && ed.sel.vi === vi) k = v.syms.findIndex(s => s.src && s.src.includes(ed.sel.ei));
    if (k < 0 && t !== null && t >= piece.end - EPS) k = v.syms.length - 1;
    if (k < 0) k = 0;
    const el = document.querySelector('#pages g.n' + vi + '-' + k);
    if (!el) { if (mic.drawn) clearDot(); return; }
    const par = el.parentNode;
    let r = null;
    for (const r2 of par.querySelectorAll('rect.stafhit[data-v="' + vi + '"]')) if (r2.dataset.k0 !== '' && +r2.dataset.k0 <= k && k <= +r2.dataset.k1) r = r2;
    if (!r) for (const r2 of par.querySelectorAll('rect.stafhit[data-v="' + vi + '"]')) r = r2;
    if (!r) return;
    const top = +r.dataset.top, bb = el.getBBox();
    const m = mic.snap, sp = spellMidi(m), pos = sp.s - CLEFS[v.clef].bottom;
    const sym = v.syms[k], sig = keyAt(v, sym.t)[LETTERS[sp.L]] || 0;
    const acc = sp.alt === sig ? '' : sp.alt < 0 ? 'fl' : sp.alt > 0 ? 'sh' : 'na';
    const rr = 0.5, aw = acc ? gw(acc) + 0.25 : 0;
    /* on the note's own column: directly above or below it, at the height of the sung pitch */
    const cx = sym.hw ? bb.x + sym.hw / 2 : bb.x + bb.width / 2, x = cx - rr - aw;
    const cents = st.micFlex ? Math.max(-50, Math.min(50, (mic.shown - m) * 100)) : 0;
    const y = top + 4 - pos * 0.5, yd = y - cents / 100 * 0.5;
    const s = ledgers(pos, cx - rr, 2 * rr, top) + (acc ? use(acc, x, y) : '') +
      `<ellipse class="micdot" cx="${f(cx)}" cy="${f(yd)}" rx="${rr + 0.04}" ry="${f(rr * 0.86)}"/>`;
    if (s === mic.drawn && mic.el === el && mic.g && mic.g.isConnected) return;
    if (mic.g) mic.g.remove();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'mic'); g.innerHTML = s; par.appendChild(g);
    mic.g = g; mic.el = el; mic.drawn = s;
  }

  /* ---------------- writing out the singing (experimental) ---------------- */
  /* While the music plays with Sing on, each semiminima gets the note sung for most of it, or a rest; equal neighbours
     join into longer notes, and the result is written as a voice of its own, "Sung", under the music. */
  const take = {on: false, frames: [], sig: '', from: 0, done: 0, before: null, last: 0, timer: 0};
  const takeShown = () => take.on && mic.on && st.micNotate;
  /* a take cut short (the microphone turned off while the music plays): what it already wrote stays, and Undo takes it away */
  function takeKeep(){
    if (!take.on || !take.sig || !take.before || !piece) return;
    const text = writeKern(piece);
    if (text !== take.before) { ed.undo.push(take.before); ed.redo = []; piece.text = text; syncEdit(); }
  }
  function takeClear(){ take.on = false; take.frames = []; take.sig = ''; take.before = null; take.self = undefined; take.vi = undefined; take.ref = null; clearTimeout(take.timer); }
  function takeStart(fromU){
    takeClear();
    if (!mic.on || !st.micNotate || !piece) return;
    take.on = true; take.from = fromU; take.done = Math.floor(fromU * 2 + 1e-6); take.stopU = undefined;
    take.before = piece.text || writeKern(piece);
  }
  /* seconds from the organ starting a note to that moment reaching the analyser in the singer's voice */
  function takeLag(ctx){
    if (st.micCal !== null) return st.micCal + 1024 / ctx.sampleRate;
    let inLat = 0.02;
    try { const s = mic.stream && mic.stream.getAudioTracks()[0].getSettings(); if (s && s.latency >= 0 && s.latency < 0.3) inLat = s.latency; } catch (e) {}
    return (ctx.outputLatency || 0) + (ctx.baseLatency || 0) + inLat + 1024 / ctx.sampleRate;
  }
  function takeRecord(now, m, q, rms){
    const T = audio.timeline;
    if (!takeShown() || !T) { mic.onset = false; return; }
    const c = T.spm / 2, u = (now - takeLag(audio.ctx) - T.origin) / c;
    if (u >= take.from) {
      let v = m !== null && q < 0.3 && rms >= 0.12 * mic.peak ? m : null;
      if (v !== null && mic.shown !== null && Math.abs(v - mic.shown) > 9) {
        const w = v + 12 * Math.round((mic.shown - v) / 12);
        if (Math.abs(w - mic.shown) < 1) v = w;
      }
      take.frames.push({u, m: v, o: mic.onset});
      if (Math.floor(u * 2) > take.done) { take.done = Math.floor(u * 2); takeQuantize(false, c); }
    }
    mic.onset = false;
  }
  function takeFinish(stopU, c){
    if (!takeShown() || !take.frames.length) { take.on = false; return; }
    take.stopU = stopU;
    takeQuantize(true, c);
    take.on = false;
  }
  function takeSegments(frames, c){
    const segs = [], hold = 0.16 / c;
    let cur = null, cand = [], attack = null;
    for (const fr of frames) {
      if (fr.o) attack = fr.u;
      if (fr.m === null) { if (cur && fr.u - cur.u1 > hold) cur = null; continue; }
      const fresh = attack !== null && cur && attack > cur.u0 + 0.5;
      if (cur && !fresh && Math.abs(fr.m - cur.mid) < 0.75) {
        cur.u1 = fr.u; cur.ms.push(fr.m);
        if (cur.ms.length <= 12 || cur.ms.length % 4 === 0) cur.mid = median(cur.ms.slice(-24));
        cand = [];
        continue;
      }
      if (cand.length && Math.abs(fr.m - cand[0].m) >= 0.75) cand = [];
      cand.push(fr);
      if (cand.length >= 3) {
        let u0 = cand[0].u;
        if (attack !== null && attack <= u0 && u0 - attack < 0.12 / c) u0 = attack;
        cur = {u0, u1: fr.u, ms: cand.map(x => x.m), mid: median(cand.map(x => x.m))};
        segs.push(cur); cand = []; attack = null;
      }
    }
    return segs.filter(g => g.u1 - g.u0 >= 0.06 / c).map(g => ({u0: g.u0, u1: g.u1, m: takePitch(median(g.ms))}));
  }
  /* the written pitch: the nearest semitone, or with Diatonic the nearest note of the scale (B or B flat as the sung voice has it) */
  function takePitch(m){
    if (!st.micDia) return Math.round(m);
    const vi = singIdx(), bflat = vi >= 0 && keyAt(piece.voices[vi], 0).b === -1;
    const pcs = bflat ? [0, 2, 4, 5, 7, 9, 10] : [0, 2, 4, 5, 7, 9, 11];
    let best = Math.round(m), bd = 99;
    for (let k = Math.floor(m) - 2; k <= Math.ceil(m) + 2; k++)
      if (pcs.includes(((k % 12) + 12) % 12) && Math.abs(k - m) < bd) { bd = Math.abs(k - m); best = k; }
    return best;
  }
  function takeSnap(u, len, lo){
    const Ln = Math.min(len, 8), sg = 0.25 + 0.2 * Ln;
    let best = Math.max(lo, Math.round(u * 2) / 2), bc = Infinity;
    for (let g = Math.max(lo, Math.floor((u - 3) * 2) / 2); g <= u + 3; g += 0.5) {
      const lv = g % 4 === 0 ? 0 : g % 2 === 0 ? 0.5 : g % 1 === 0 ? 1.2 + 0.3 * Ln : 2.4 + 0.6 * Ln;
      const cost = (g - u) * (g - u) / (sg * sg) + lv;
      if (cost < bc) { bc = cost; best = g; }
    }
    return best;
  }
  function takeDelay(segs, c){
    const s0 = segs.map(g => g.u0);
    if (s0.length < 4) return null;
    for (const P of [4, 2]) {
      let sx = 0, sy = 0;
      s0.forEach(u => { sx += Math.cos(2 * Math.PI * u / P); sy += Math.sin(2 * Math.PI * u / P); });
      const R = Math.hypot(sx, sy) / s0.length;
      if (R >= 0.55) {
        const d = Math.atan2(sy, sx) / (2 * Math.PI) * P;
        if (d * c > -0.12 && d * c < 0.45) return d;
      }
    }
    return null;
  }
  /* the sung notes as {a, b, m}: beginning and end in semiminimae from the start of the piece, midi pitch */
  function takeNotes(last, c){
    const segs = takeSegments(take.frames, c);
    const est = st.micCal !== null ? null : takeDelay(segs, c), d = st.micCal !== null ? 0 : est !== null ? est : st.micLag / c;
    if (last && est !== null) { st.micLag = Math.round((st.micLag * 0.4 + est * c * 0.6) * 1000) / 1000; save(); }
    const ev = [];
    let lo = Math.floor(take.from + 1e-6);
    const nlen = k => k < segs.length ? (segs[k + 1] ? segs[k + 1].u0 : segs[k].u1) - segs[k].u0 : 0;
    segs.forEach((g, i) => {
      const len = nlen(i), a = takeSnap(g.u0 - d, len, lo);
      let b = Math.max(a + 0.5, takeSnap(g.u1 + 0.15 - d, len, a + 0.5));
      const nx = segs[i + 1];
      if (nx) { const na = takeSnap(nx.u0 - d, nlen(i + 1), a + 0.5); if (na - b <= 1) b = na; }
      else if (last && take.stopU !== undefined && take.frames[take.frames.length - 1].u - g.u1 < 0.6) b = Math.max(b, Math.round(take.stopU));
      const p = ev[ev.length - 1];
      if (p && a < p.b) p.b = a;
      if (p && p.b <= p.a) ev.pop();
      ev.push({a, b, m: g.m});
      lo = a + 0.5;
    });
    return ev;
  }
  /* the Sung voice: rests up to the first sung note, the sung notes with rests between, rests to the end */
  function sungVoice(ev, ref){
    const kclef = (() => {
      const steps = ev.map(e => spellMidi(e.m).s);
      if (!steps.length) return ref.kclef || 'Gv2';
      const med = median(steps);
      return med >= 33 ? 'G2' : med >= 24 ? 'Gv2' : 'F4';
    })();
    const v = {name: 'Sung', abbr: 'sung', kclef, events: [], mets: [], keys: [], clefs: [{t: 0, c: kclef, ei: 0}], verses: 0, t: 0};
    for (const m of ref.mets) v.mets.push({t: m.t, sign: m.sign, ei: 0, _t: m.t});
    for (const k of ref.keys) if (eq(k.t, 0)) v.keys.push({t: 0, alts: Object.assign({}, k.alts), raw: k.raw, ei: 0});
    if (!v.mets.length) v.mets.push({t: 0, sign: 'C', ei: 0, _t: 0});
    const end = Math.max(piece.end, ev.length ? ev[ev.length - 1].b / 4 : 0);
    /* times where a rest must break: the mensuration changes of the voice sung against */
    const cuts = [...new Set(v.mets.map(m => m._t))].sort((a, b) => a - b);
    const push = (a, b, m) => {
      let t = a;
      while (b - t > EPS) {
        const nc = cuts.find(x => x > t + EPS && x < b - EPS);
        const e = Math.min(b, nc === undefined ? b : nc);
        if (m === null) {
          let r = rt(e - t);
          while (r > EPS) { const d = r >= 2 - EPS ? 2 : r >= 1 - EPS ? 1 : r; v.events.push({d: rt(d), kd: rt(d), rest: true, t, syl: []}); t = rt(t + d); r = rt(r - d); }
        } else {
          const sp = spellMidi(m), k = keyAt(ref, t)[LETTERS[sp.L]] || 0;
          v.events.push({d: rt(e - t), rest: false, step: sp.s, alt: sp.alt === k && !k ? null : sp.alt, ed: false, syl: [], t});
          t = e;
        }
        t = rt(e);
      }
    };
    let u = 0;
    for (const e of ev) {
      const a = rt(e.a / 4), b = rt(e.b / 4);
      if (a > u + EPS) push(u, a, null);
      push(Math.max(a, u), b, e.m);
      u = b;
    }
    if (end > u + EPS) push(u, end, null);
    for (const m of v.mets) { const k = v.events.findIndex(e => e.t >= m._t - EPS); m.ei = k < 0 ? v.events.length : k; delete m._t; }
    return v;
  }
  /* write the Sung voice into the piece: live (no undo) while the music plays, once more with undo at the end */
  function takeQuantize(last, c){
    if (!piece) return;
    const ev = takeNotes(last, c);
    const sig = ev.map(e => [e.a, e.b, e.m].join(':')).join(' ');
    if (sig === take.sig && !last) return;
    take.sig = sig;
    const write = () => {
      const vi = take.vi !== undefined ? take.vi : singIdx(); if (vi < 0 || !piece.voices[vi]) return;
      const ref = piece.voices[vi];
      /* a voice with no notes yet (CantusFirmus's Contrapunctus, a new voice) is written into itself; otherwise into Sung */
      if (take.self === undefined) { take.self = !ref.events.some(e => !e.rest); take.vi = vi; take.ref = ref; }
      const nv = sungVoice(ev, take.ref);
      let si;
      if (take.self) {
        nv.name = ref.name; nv.abbr = ref.abbr; nv.kclef = ref.kclef; nv.clefs = [{t: 0, c: ref.kclef || nv.kclef, ei: 0}];
        piece.voices[vi] = nv; si = vi;
      } else {
        si = piece.voices.findIndex(v => v.abbr === 'sung');
        if (si < 0) { piece.voices.splice(vi + 1, 0, nv); si = vi + 1; shiftVis(si, 1); vis(si).play = false; }
        else piece.voices[si] = nv;
      }
      save();
      const text = writeKern(piece);
      if (last) {
        const before = take.before;
        if (before && before !== text) { ed.undo.push(before); ed.redo = []; }
        applyText(text);
        toast(`What you sang is written in ${take.self ? 'the ' + ref.name : 'the Sung voice'}. Undo takes it away.`);
      } else {
        const P = parseKern(text); P.text = text; piece = P;
        render();
      }
    };
    clearTimeout(take.timer);
    if (last) { write(); return; }
    /* live: at most every 0.6 s, so the drawing keeps up */
    const wait = Math.max(0, 600 - (performance.now() - take.last));
    take.timer = setTimeout(() => { take.last = performance.now(); if (take.on) write(); }, wait);
  }

  /* ---------------- the engine's playback, and the menu ---------------- */
  H.playSpec = spec => {
    spec.onStart = T => { if (mic.on) takeStart(Math.max(0, (T.t0 - T.origin) / (T.spm / 2))); };
    spec.onStop = (now, T) => { if (take.on) takeFinish((Math.min(now, T.end) - T.origin) / (T.spm / 2), T.spm / 2); };
  };
  const syncSing = () => {
    pressed($('#micFlex'), st.micFlex); pressed($('#micPhones'), st.micPhones); pressed($('#micNotate'), st.micNotate); pressed($('#micDia'), st.micDia);
    $('#micLat').value = st.micCal === null ? '' : Math.round(st.micCal * 1000);
  };
  /* one button: pressed, the microphone goes on or off; its arrow (or hovering) opens the options */
  $('#mic').addEventListener('click', e => {
    if (e.target.closest('.singchev')) {
      const p = $('#popSing'), open = !p.classList.contains('open');
      closePops(p); p.classList.toggle('open', open); syncSing(); return;
    }
    if (mic.on) micStop(); else micStart();
  });
  $('#popSing').addEventListener('mouseenter', syncSing);
  /* Ctrl+Z / Ctrl+Shift+Z also outside Edit, so a take that replaced the one before can be undone */
  document.addEventListener('keydown', e => {
    if (ed.on || !(e.ctrlKey || e.metaKey) || (e.key !== 'z' && e.key !== 'Z')) return;
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    e.preventDefault();
    if (e.shiftKey) { if (ed.redo.length) redo(); } else if (ed.undo.length) { undo(); toast('Undone.'); }
  });
  $('#micFlex').addEventListener('click', () => { st.micFlex = !st.micFlex; mic.snap = null; mic.pend = null; save(); syncSing(); });
  $('#micPhones').addEventListener('click', () => { st.micPhones = !st.micPhones; save(); syncSing(); });
  $('#micNotate').addEventListener('click', () => { st.micNotate = !st.micNotate; if (!st.micNotate) takeClear(); save(); syncSing(); });
  $('#micDia').addEventListener('click', () => { st.micDia = !st.micDia; save(); syncSing(); });
  $('#micClap').addEventListener('click', clapTest);
  $('#micLat').addEventListener('change', e => {
    const v = e.target.value.trim();
    st.micCal = v === '' || !(Number(v) >= 0) ? null : Math.min(600, Number(v)) / 1000;
    e.target.value = st.micCal === null ? '' : Math.round(st.micCal * 1000);
    save();
  });

  /* ---------------- Record: yourself (and the organ, with headphones), kept in this browser ---------------- */
  const rec = {on: false, busy: false, mr: null, stream: null, chunks: [], t0: 0, dest: null, src: null, audio: null, playing: null, url: null};
  const DB_NAME = APP.store + ':recordings';
  function db(){
    return new Promise((ok, no) => {
      if (!window.indexedDB) { no(new Error('no indexedDB')); return; }
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('rec', {keyPath: 'id', autoIncrement: true});
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    });
  }
  async function dbDo(mode, fn){
    const d = await db();
    return new Promise((ok, no) => {
      const tx = d.transaction('rec', mode), q = fn(tx.objectStore('rec'));
      tx.oncomplete = () => { ok(q && q.result); d.close(); }; tx.onerror = () => { no(tx.error); d.close(); };
    });
  }
  const recAll = () => dbDo('readonly', o => o.getAll()).catch(() => []);
  const ICON = {
    play: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5 12.5 7 3 12.5Z"/></svg>',
    stop: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3h8v8H3Z"/></svg>',
    down: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M6 1.5h2v6.2l2.3-2.3 1.4 1.4L7 11.5 2.3 6.8l1.4-1.4L6 7.7ZM2 12h10v1.5H2Z"/></svg>'
  };
  const clock = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const when = t => { const d = new Date(t); return d.toLocaleDateString(undefined, {day: 'numeric', month: 'short'}) + ', ' + d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'}); };
  async function recList(){
    const el = $('#recList'); if (!el) return;
    const all = (await recAll()).sort((a, b) => b.at - a.at);
    el.innerHTML = all.map(r => `<div class="recitem" data-id="${r.id}"><span class="rn" title="${esc(r.name)}">${esc(r.name)}<small>${esc(when(r.at))} · ${clock(r.dur || 0)}</small></span>` +
      `<button data-a="play" aria-label="Play" title="Listen">${rec.playing === r.id ? ICON.stop : ICON.play}</button>` +
      `<button data-a="down" aria-label="Download" title="Download">${ICON.down}</button>` +
      `<button data-a="del" aria-label="Delete" title="Delete">×</button></div>`).join('');
  }
  async function recStart(){
    if (rec.on || rec.busy) return;
    const ctx = Organ.ensureAudio();
    if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('This browser cannot record here.'); return; }
    rec.busy = true;
    try { rec.stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}}); }
    catch (e) { rec.busy = false; toast(e && e.name === 'NotAllowedError' ? 'The microphone is blocked. Allow it for this site to record.' : 'No microphone could be opened.'); return; }
    rec.busy = false;
    let stream = rec.stream;
    /* with headphones the microphone does not hear the organ, so the organ goes into the recording itself */
    if (st.micPhones && ctx && audio.master) {
      rec.dest = ctx.createMediaStreamDestination();
      rec.src = ctx.createMediaStreamSource(rec.stream); rec.src.connect(rec.dest);
      audio.master.connect(rec.dest);
      stream = rec.dest.stream;
    }
    rec.chunks = [];
    try { rec.mr = new MediaRecorder(stream); } catch (e) { recCleanup(); toast('This browser cannot record here.'); return; }
    rec.mr.ondataavailable = e => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = async () => {
      const mime = rec.mr.mimeType || (rec.chunks[0] && rec.chunks[0].type) || 'audio/webm';
      const blob = new Blob(rec.chunks, {type: mime}), dur = (performance.now() - rec.t0) / 1000;
      recCleanup();
      if (!blob.size) return;
      const name = (piece && piece.title) || APP.name;
      try { await dbDo('readwrite', o => o.add({name, at: Date.now(), mime, dur, blob})); toast('Recorded. It is in the Sing menu.'); }
      catch (e) { toast('The recording could not be kept in this browser.'); }
      recList();
    };
    rec.mr.start(1000); rec.t0 = performance.now(); rec.on = true;
    pressed($('#recBtn'), true); $('#recBtn').lastChild.textContent = 'Stop recording';
  }
  function recCleanup(){
    if (rec.src) try { rec.src.disconnect(); } catch (e) {}
    if (rec.dest && audio.master) try { audio.master.disconnect(rec.dest); } catch (e) {}
    if (rec.stream) rec.stream.getTracks().forEach(t => t.stop());
    rec.stream = rec.src = rec.dest = null; rec.on = false;
    pressed($('#recBtn'), false); $('#recBtn').lastChild.textContent = 'Record';
  }
  function recStop(){ if (rec.mr && rec.mr.state !== 'inactive') rec.mr.stop(); else recCleanup(); }
  function recPlayStop(){ if (rec.audio) { rec.audio.pause(); rec.audio = null; } if (rec.url) { URL.revokeObjectURL(rec.url); rec.url = null; } rec.playing = null; }
  $('#recBtn').addEventListener('click', () => { if (rec.on) recStop(); else recStart(); });
  $('#recList').addEventListener('click', async e => {
    const b = e.target.closest('button'), row = e.target.closest('.recitem'); if (!b || !row) return;
    e.stopPropagation();
    const id = +row.dataset.id;
    if (b.dataset.a === 'del') {
      if (!b.classList.contains('sure')) { b.classList.add('sure'); b.textContent = 'Delete?'; setTimeout(() => { if (b.isConnected) { b.classList.remove('sure'); b.textContent = '×'; } }, 3000); return; }
      if (rec.playing === id) recPlayStop();
      await dbDo('readwrite', o => o.delete(id)).catch(() => {}); recList(); return;
    }
    const r = await dbDo('readonly', o => o.get(id)).catch(() => null); if (!r) return;
    if (b.dataset.a === 'down') {
      const ext = /mp4|m4a|aac/.test(r.mime) ? 'm4a' : /ogg/.test(r.mime) ? 'ogg' : 'webm';
      const d = new Date(r.at), pad = n => String(n).padStart(2, '0');
      const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob);
      a.download = `${r.name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Recording'} ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      return;
    }
    const was = rec.playing; recPlayStop();
    if (was !== id) {
      rec.url = URL.createObjectURL(r.blob); rec.audio = new Audio(rec.url); rec.playing = id;
      rec.audio.onended = () => { recPlayStop(); recList(); };
      rec.audio.play().catch(() => { recPlayStop(); recList(); });
    }
    recList();
  });
  recList();
  syncSing();
  window.__sing = {mic, take, rec, recAll, singIdx, sungVoice, takeNotes, spellMidi, drawDot};
}]);
