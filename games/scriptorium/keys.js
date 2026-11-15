/* Scriptorium add-on: playing and writing notes from a keyboard (Samuel 2026-11-15).
   The keyboard button at the left of the playback row opens a small piano above it:
   - on a computer the letter keys play it: A S D F G H J K L ; are the white keys (C to E), W E T Y U O P the black
     ones, as on a piano. Z and X move it an octave down or up. Escape closes it. Keys it does not use (space, the
     arrows, Delete, the note values 1 to 7, R, Ctrl+Z ...) keep doing what they did.
   - on a phone or tablet the piano is played with the fingers; it scrolls sideways.
   - a MIDI keyboard plays whenever one is plugged in (once the browser has been allowed to use it).
   The notes sound in the sound of the selected voice (its sound in the Mixer). In Edit mode each key also writes its
   note at the caret, in the note value chosen, as typing a letter name does. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const play0 = $('#play'); if (!play0) return;
  const LO = 36, HI = 84;                         /* the piano on the screen: C2 to C6 */
  const WHITE = [0, 2, 4, 5, 7, 9, 11], isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
  const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
  /* the computer's keys, by their place on the keyboard (so they work the same on QWERTZ and AZERTY), in semitones above the C */
  const CODES = {KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11,
    KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16};
  const LABEL = {}; for (const [c, n] of Object.entries(CODES)) LABEL[n] = c === 'Semicolon' ? ';' : c.slice(3);
  const hoverable = () => window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  const K = {on: false, base: 60, baseVi: -1, held: new Map(), midi: null, midiAsked: false, inputs: []};

  /* ---------- the button, at the left of the playback row ---------- */
  play0.insertAdjacentHTML('afterend', '<div class="podg" id="podKbd"><button class="ib" id="kbdBtn" aria-pressed="false" aria-controls="kbd" aria-label="Keyboard" title="Keyboard: play the notes, and write them in Edit mode. On a computer the letter keys play it (A S D F … white keys, W E T Y … black keys; Z X octave; Escape closes)">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 5.2h17.6a.9.9 0 0 1 .9.9v11.8a.9.9 0 0 1-.9.9H3.2a.9.9 0 0 1-.9-.9V6.1a.9.9 0 0 1 .9-.9Zm.6 1.5v10.6h3.3v-4.1H6.2V6.7Zm4.8 0v6.5h-.9v4.1h4.1v-4.1h-.9V6.7Zm4.7 0v6.5h-.9v4.1h3.3V6.7Zm4.8 0h-1.9v6.5h-.9v4.1h2.8Z"/></svg></button></div>');
  const btn = $('#kbdBtn');

  /* ---------- the piano ---------- */
  document.body.insertAdjacentHTML('beforeend', '<div class="kbd" id="kbd" role="group" aria-label="Keyboard" hidden>'
    + '<div class="kbd-oct" id="kbdOct"><button class="ib" id="kbdDn" aria-label="Octave down" title="Octave down (Z)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.6-1.6L11.2 12 17 6.2Z"/></svg></button>'
    + '<span id="kbdLab"></span><button class="ib" id="kbdUp" aria-label="Octave up" title="Octave up (X)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4L7 17.8 12.8 12 7 6.2Z"/></svg></button></div>'
    + '<div class="kbd-size"><label for="kbdW">Width</label><input type="range" id="kbdW" min="20" max="56" step="1" aria-label="Width of the keys"></div>'
    + '<div class="kbd-scroll" id="kbdScroll"><div class="kbd-keys" id="kbdKeys"></div></div></div>');
  const box = $('#kbd'), keysEl = $('#kbdKeys'), scroller = $('#kbdScroll');
  {
    let html = '', w = 0;
    for (let m = LO; m <= HI; m++) {
      if (isBlack(m)) html += `<div class="kk blk" data-m="${m}" style="left:calc(${w} * var(--kw) - var(--bw) / 2)"><i></i></div>`;
      else { html += `<div class="kk wht" data-m="${m}" style="left:calc(${w} * var(--kw))"><i></i>${m % 12 === 0 ? '<b>C' + (m / 12 - 1) + '</b>' : ''}</div>`; w++; }
    }
    keysEl.innerHTML = html;
    keysEl.style.width = `calc(${w} * var(--kw) + 1px)`;
  }
  const keyEl = m => keysEl.querySelector('.kk[data-m="' + m + '"]');

  /* ---------- which voice: the selected one (or the one with the caret) ---------- */
  const voiceNow = () => anyVoice() || (piece && piece.voices[0]) || null;
  function sound(){
    const v = anyVoice(); if (!v || !piece) return {};
    const o = vis(v.idx); return {reg: mixReg(o) || undefined, gain: mixGain(o)};
  }
  /* where the computer's keys start: the C at or below the middle of the voice's notes, so the voice's range is under the fingers */
  function baseFor(v){
    if (!v) return 60;
    const ns = v.events.filter(e => !e.rest).map(e => midiOf({step: e.step, alt: e.alt}));
    const mid = ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : midiOf({step: refStepBefore(v, 0), alt: 0});
    return Math.max(LO, Math.min(HI - 12, 12 * Math.floor((mid - 3) / 12)));
  }
  function follow(){
    const v = voiceNow(), vi = v ? v.idx : -1;
    if (vi !== K.baseVi) { K.baseVi = vi; K.base = baseFor(v); labels(); }
  }
  function labels(){
    $('#kbdLab').textContent = 'C' + (K.base / 12 - 1);
    const show = hoverable();
    keysEl.querySelectorAll('.kk').forEach(el => {
      const n = +el.dataset.m - K.base, i = el.querySelector('i');
      const has = show && n >= 0 && n <= 16;
      i.textContent = has ? LABEL[n] : '';
      el.classList.toggle('inr', has);
    });
    $('#kbdDn').disabled = K.base <= LO; $('#kbdUp').disabled = K.base >= HI - 12;
    reveal(K.base, K.base + 16);
  }
  /* the keys being played stay in sight on a narrow screen */
  function reveal(m0, m1){
    if (box.hidden) return;
    const a = keyEl(Math.max(LO, m0)), b = keyEl(Math.min(HI, m1));
    if (!a || !b) return;
    const x0 = a.offsetLeft, x1 = b.offsetLeft + b.offsetWidth, sw = scroller.clientWidth, sl = scroller.scrollLeft;
    if (x0 >= sl && x1 <= sl + sw) return;
    scroller.scrollLeft = x1 - x0 > sw ? x0 - 8 : Math.max(0, (x0 + x1) / 2 - sw / 2);
  }
  function octave(d){
    const nb = Math.max(LO, Math.min(HI - 12, K.base + 12 * d));
    if (nb === K.base) return;
    K.base = nb; labels();
    toast('Keyboard: A plays C' + (K.base / 12 - 1) + '.');
  }

  /* ---------- a note: how it is written ---------- */
  /* black keys: the sharp or flat the signature has, else C♯ E♭ F♯ G♯ B♭, as the music of the time mostly writes them */
  function spell(m, v, t){
    const pc = ((m % 12) + 12) % 12, oct = Math.floor(m / 12) - 1;
    const wi = WHITE.indexOf(pc);
    if (wi >= 0) return {step: 7 * oct + wi, alt: 0};
    const below = {step: 7 * oct + WHITE.indexOf(pc - 1), alt: 1}, above = {step: 7 * oct + WHITE.indexOf(pc + 1), alt: -1};
    if (v) {
      if (implied(v, above.step, t) === -1) return above;
      if (implied(v, below.step, t) === 1) return below;
    }
    return pc === 3 || pc === 10 ? above : below;
  }
  /* in Edit mode a key writes its note at the caret (as typing its letter does), in the value chosen */
  function write(m){
    if (!ed.on || !piece || !CBA.guard()) return;
    const v = curVoice(); if (!v) return;
    const idx = insertionIndex(v), t = v.events[idx] ? v.events[idx].t : v.end;
    const sp = spell(m, v, t);
    if (sp.step < STEP_MIN || sp.step > STEP_MAX) { toast('That note is outside the range that can be written.'); return; }
    ed.inRest = false;
    const was = st.audition; st.audition = false;   /* the key itself is sounding already */
    try { insertEvent(v.idx, idx, sp.step, false, caretPad(v, idx), sp.alt); } finally { st.audition = was; }
  }

  /* ---------- sound ---------- */
  function down(m, src){
    if (K.held.has(src + m)) return;
    follow();
    const s = sound();
    K.held.set(src + m, Organ.hold(m, s.reg, s.gain));
    const el = keyEl(m); if (el) el.classList.add('on');
    write(m);
  }
  function up(m, src){
    const v = K.held.get(src + m); if (v === undefined) return;
    K.held.delete(src + m); Organ.unhold(v);
    if (![...K.held.keys()].some(k => k.endsWith(':' + m) || k === src + m)) { const el = keyEl(m); if (el) el.classList.remove('on'); }
  }
  function allUp(){ for (const k of [...K.held.keys()]) up(+k.split(':')[1], k.split(':')[0] + ':'); }

  /* ---------- open and close ---------- */
  function setOn(on){
    K.on = on; box.hidden = !on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.documentElement.classList.toggle('kbd-on', on);
    if (!on) allUp();
    else {
      K.baseVi = -2; follow(); labels();
      fit();
      if (hoverable() && !K.told) { K.told = true; toast('Keyboard: A S D F G H J K L ; are the white keys, W E T Y U O P the black ones. Z and X change the octave; Escape closes it.'); }
    }
    if (window.__dockPlace) window.__dockPlace();
    postHeight();
  }
  /* a short window (a phone on its side) gets shorter keys; the window's height, not the frame's (the app's frame is as tall as the app) */
  function fit(){
    const win = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--win')) || window.innerHeight;
    box.classList.toggle('short', win < 520);
    width();
    document.documentElement.style.setProperty('--kbh', box.offsetHeight + 'px');
  }
  /* phones: the piano runs from edge to edge, and the slider sets how wide the keys are (kept in this browser) */
  const phone = () => window.matchMedia && matchMedia('(max-width:700px),(pointer:coarse)').matches;
  const KW = 'scriptorium:kbdW';
  let kw = 28; try { kw = Math.max(20, Math.min(56, +localStorage.getItem(KW) || 28)); } catch (e) {}
  function width(){
    if (phone()) { box.style.setProperty('--kw', kw + 'px'); box.style.setProperty('--bw', Math.round(kw * 0.64) + 'px'); }
    else { box.style.removeProperty('--kw'); box.style.removeProperty('--bw'); }
    $('#kbdW').value = kw;
  }
  $('#kbdW').addEventListener('input', e => {
    /* the key in the middle of the screen stays there */
    const mid = (scroller.scrollLeft + scroller.clientWidth / 2) / (keysEl.offsetWidth || 1);
    kw = +e.target.value; width();
    scroller.scrollLeft = mid * keysEl.offsetWidth - scroller.clientWidth / 2;
    try { localStorage.setItem(KW, String(kw)); } catch (e2) {}
  });
  if (window.ResizeObserver) new ResizeObserver(() => { if (!box.hidden) { document.documentElement.style.setProperty('--kbh', box.offsetHeight + 'px'); if (window.__dockPlace) window.__dockPlace(); } }).observe(box);
  window.addEventListener('message', () => { if (!box.hidden) setTimeout(fit, 0); });
  window.addEventListener('resize', () => { if (!box.hidden) fit(); });
  btn.addEventListener('click', () => { midiStart(true); setOn(!K.on); btn.blur(); });
  $('#kbdDn').addEventListener('click', e => { octave(-1); e.currentTarget.blur(); });
  $('#kbdUp').addEventListener('click', e => { octave(1); e.currentTarget.blur(); });

  /* fingers and the mouse: a press sounds at once; it writes the note when let go, unless the finger moved on to scroll */
  const touches = new Map();
  keysEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.kk'); if (!el) return;
    e.preventDefault();
    const m = +el.dataset.m, s = sound();
    touches.set(e.pointerId, {m, v: Organ.hold(m, s.reg, s.gain), x: e.clientX});
    el.classList.add('on');
    if (e.pointerType === 'mouse') { follow(); write(m); touches.get(e.pointerId).done = true; }
  });
  const lift = (e, cancel) => {
    const p = touches.get(e.pointerId); if (!p) return;
    touches.delete(e.pointerId); Organ.unhold(p.v);
    const el = keyEl(p.m); if (el && ![...K.held.keys()].some(k => k.endsWith(':' + p.m))) el.classList.remove('on');
    if (!cancel && !p.done && Math.abs(e.clientX - p.x) < 12) { follow(); write(p.m); }
  };
  keysEl.addEventListener('pointerup', e => lift(e, false));
  keysEl.addEventListener('pointercancel', e => lift(e, true));
  keysEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') lift(e, true); });
  keysEl.addEventListener('contextmenu', e => e.preventDefault());

  /* the computer's keys: before the app's own shortcuts (window, capture), only while the keyboard is open */
  window.addEventListener('keydown', e => {
    if (!K.on) return;
    const t = e.target, tag = t.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setOn(false); return; }
    if (e.shiftKey) return;   /* Shift+L (lyrics) and the Shift keys keep their meaning */
    if (e.code === 'KeyZ' || e.code === 'KeyX') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) octave(e.code === 'KeyZ' ? -1 : 1); return; }
    const n = CODES[e.code]; if (n === undefined) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    down(K.base + n, 'k' + e.code + ':');
  }, true);
  window.addEventListener('keyup', e => {
    for (const k of [...K.held.keys()]) if (k.startsWith('k' + e.code + ':')) up(+k.split(':')[1], k.split(':')[0] + ':');
  }, true);
  window.addEventListener('blur', () => { for (const k of [...K.held.keys()]) if (k[0] === 'k') up(+k.split(':')[1], k.split(':')[0] + ':'); });
  /* the voice may change while it is open: the keys follow it to its range */
  document.addEventListener('pointerup', () => { if (K.on) setTimeout(follow, 0); });

  /* ---------- MIDI ---------- */
  function onMidi(e){
    const d = e.data; if (!d || d.length < 2) return;
    const cmd = d[0] & 0xf0, m = d[1], vel = d.length > 2 ? d[2] : 0;
    if (cmd === 0x90 && vel > 0) down(m, 'm:');
    else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) up(m, 'm:');
    else if (cmd === 0xb0 && (m === 120 || m === 123)) { for (const k of [...K.held.keys()]) if (k[0] === 'm') up(+k.split(':')[1], 'm:'); }
  }
  function hook(){
    if (!K.midi) return;
    const now = [];
    K.midi.inputs.forEach(inp => { inp.onmidimessage = onMidi; if (inp.state !== 'disconnected') now.push(inp.name || 'MIDI keyboard'); });
    const added = now.filter(n => !K.inputs.includes(n));
    K.inputs = now;
    btn.classList.toggle('midi', now.length > 0);
    btn.title = (now.length ? 'MIDI keyboard: ' + now.join(', ') + '. ' : '') + 'Keyboard: play the notes, and write them in Edit mode. On a computer the letter keys play it (A S D F … white keys, W E T Y … black keys; Z X octave; Escape closes)';
    if (added.length) toast('MIDI keyboard connected: ' + added.join(', ') + '. It plays in the sound of the selected voice, and writes notes in Edit mode.');
  }
  /* asked for the first time when the keyboard button is pressed; later visits connect by themselves */
  function midiStart(ask){
    if (K.midi || !navigator.requestMIDIAccess || (ask && K.midiAsked)) return;
    if (ask) K.midiAsked = true;
    navigator.requestMIDIAccess({sysex: false}).then(acc => { K.midi = acc; acc.onstatechange = hook; hook(); }).catch(() => {});
  }
  try {
    if (navigator.requestMIDIAccess && navigator.permissions && navigator.permissions.query)
      navigator.permissions.query({name: 'midi'}).then(p => { if (p.state === 'granted') midiStart(false); }).catch(() => {});
  } catch (e) {}
  APP.keyboard = window.ScriptoriumKeyboard = {open: setOn, down, up, spell, state: K, notes: () => { const v = curVoice(); return v ? v.events.map(e => [e.step, e.alt, e.rest]) : null; }};
}]);
