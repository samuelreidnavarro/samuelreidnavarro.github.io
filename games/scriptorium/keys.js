/* Scriptorium add-on: playing and writing notes from a keyboard (Samuel 2026-11-15).
   The keyboard button at the left of the playback row opens a small piano above it:
   - on a computer the letter keys play it: A S D F G H J K L ; ' are the white keys, the row above the black ones
     between them, as on a piano. Z and X move it an octave down or up, C and V one white key down or up (so A can be
     any white note; the white keys stay on the A S D F row). Escape closes it. Keys it does not use (space, the
     arrows, Delete, the note values 1 to 7, R, Ctrl+Z ...) keep doing what they did.
   - on a phone or tablet the piano is played with the fingers; it scrolls sideways.
   - a MIDI keyboard plays whenever one is plugged in (once the browser has been allowed to use it).
   The notes sound in the sound of the selected voice (its sound in the Mixer). In note input each key also writes its
   note at the caret, in the note value chosen, as typing a letter name does. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const play0 = $('#play'); if (!play0) return;
  const LO = 36, HI = 84;                         /* the piano on the screen: C2 to C6 */
  const WHITE = [0, 2, 4, 5, 7, 9, 11], isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
  const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
  /* the computer's keys, by their place on the keyboard (so they work the same on QWERTZ and AZERTY): the home row is
     the white keys from the one on A; a key of the row above stands between two of them and plays the black key there, if there is one */
  const HOME = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
  const TOP = ['KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft'];
  const CAP = c => c === 'Semicolon' ? ';' : c === 'Quote' ? '\'' : c === 'BracketLeft' ? '[' : c.slice(3);
  const WHITES = []; for (let m = 0; m < 128; m++) if (!isBlack(m)) WHITES.push(m);
  const LETTER = m => 'CDEFGAB'[WHITE.indexOf(((m % 12) + 12) % 12)] + (Math.floor(m / 12) - 1);
  const hoverable = () => window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  const K = {on: false, w: WHITES.indexOf(60), base: 60, baseVi: -1, held: new Map(), midi: null, midiAsked: false, inputs: []};

  /* ---------- the button, at the left of the playback row ---------- */
  play0.insertAdjacentHTML('afterend', '<div class="podg" id="podKbd"><div class="pop" id="popKbd"><button class="ib" id="kbdBtn" aria-pressed="false" aria-haspopup="true" aria-controls="kbd" aria-label="Keyboard" title="Keyboard: play the notes, and write them in note input (N). On a computer the letter keys play it (A S D F … white keys, W E T Y … black keys; Z X octave, C V one key; Escape closes)">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 5.2h17.6a.9.9 0 0 1 .9.9v11.8a.9.9 0 0 1-.9.9H3.2a.9.9 0 0 1-.9-.9V6.1a.9.9 0 0 1 .9-.9Zm.6 1.5v10.6h3.3v-4.1H6.2V6.7Zm4.8 0v6.5h-.9v4.1h4.1v-4.1h-.9V6.7Zm4.7 0v6.5h-.9v4.1h3.3V6.7Zm4.8 0h-1.9v6.5h-.9v4.1h2.8Z"/></svg><span class="singchev" aria-hidden="true"><svg class="chev" viewBox="0 0 12 12"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></span></button>'
    + '<div class="popbody"><div class="btns col" role="group" aria-label="Keyboard options"><button class="tb" id="kbdShow" data-keep aria-pressed="true" title="The key you play shows as a faint red dot on the selected staff">Show pitch on staff</button></div>'
    + '<div class="kbdset" role="group" aria-label="Keyboard settings"><div class="kbdcog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58ZM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6Z"/></svg><span>Keyboard</span></div>'
    + '<label class="kbdrow" for="kbdW"><span>Width</span><input type="range" id="kbdW" min="20" max="130" step="1" aria-label="Width of the keys"></label>'
    + '<label class="kbdrow" for="kbdH"><span>Height</span><input type="range" id="kbdH" min="50" max="400" step="1" aria-label="Height of the keys"></label>'
    + '<label class="check kbdrow kbdgl" title="On: the keyboard no longer scrolls, and sliding a finger (or the mouse) over the keys plays them one after the other, for scales"><input type="checkbox" id="kbdG"> Glissando</label></div></div></div></div>');
  $('#kbdShow').setAttribute('aria-pressed', st.kbdShow === false ? 'false' : 'true');
  $('#popKbd').addEventListener('mouseenter', () => { if (window.__sing) window.__sing.syncSing(); });
  const btn = $('#kbdBtn');

  /* ---------- the piano ---------- */
  document.body.insertAdjacentHTML('beforeend', '<div class="kbd" id="kbd" role="group" aria-label="Keyboard" hidden>'
    + '<div class="kbd-oct" id="kbdOct">'
    + '<button class="ib" id="kbdSl" aria-label="One key down" title="One white key down (C)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.6-1.6L11.2 12 17 6.2Z"/></svg></button>'
    + '<span id="kbdLab" title="The note on A"></span>'
    + '<button class="ib" id="kbdSr" aria-label="One key up" title="One white key up (V)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4L7 17.8 12.8 12 7 6.2Z"/></svg></button>'
    + '<button class="ib" id="kbdDn" aria-label="Octave down" title="Octave down (Z)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.4 4.6 5 12l7.4 7.4 1.6-1.6L8.2 12 14 6.2ZM19.4 4.6 12 12l7.4 7.4 1.6-1.6L15.2 12 21 6.2Z"/></svg></button>'
    + '<span class="kbd-ol">8ve</span>'
    + '<button class="ib" id="kbdUp" aria-label="Octave up" title="Octave up (X)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.6 4.6 19 12l-7.4 7.4-1.6-1.6 5.8-5.8L10 6.2ZM4.6 4.6 12 12l-7.4 7.4L3 17.8 8.8 12 3 6.2Z"/></svg></button></div>'
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
    if (vi !== K.baseVi) { K.baseVi = vi; setW(WHITES.indexOf(baseFor(v))); labels(); }
  }
  /* the white key under A (an index into WHITES), kept so that the whole home row stays on the screen's piano */
  const W_MIN = WHITES.indexOf(LO), W_MAX = WHITES.indexOf(HI) - HOME.length + 1;
  function setW(w){ K.w = Math.max(W_MIN, Math.min(W_MAX, w)); K.base = WHITES[K.w]; }
  /* the note a computer key plays now, or undefined */
  function codeMidi(code){
    const h = HOME.indexOf(code);
    if (h >= 0) return WHITES[K.w + h];
    const t = TOP.indexOf(code);
    if (t >= 0) { const a = WHITES[K.w + t], b = WHITES[K.w + t + 1]; return b - a === 2 ? a + 1 : undefined; }
    return undefined;
  }
  function labels(){
    $('#kbdLab').textContent = LETTER(K.base);
    const show = hoverable(), lab = {};
    for (const c of HOME.concat(TOP)) { const m = codeMidi(c); if (m !== undefined) lab[m] = CAP(c); }
    keysEl.querySelectorAll('.kk').forEach(el => {
      const m = +el.dataset.m, i = el.querySelector('i'), has = show && lab[m] !== undefined;
      i.textContent = has ? lab[m] : '';
      el.classList.toggle('inr', has);
    });
    $('#kbdDn').disabled = K.w - 7 < W_MIN; $('#kbdUp').disabled = K.w + 7 > W_MAX;
    $('#kbdSl').disabled = K.w <= W_MIN; $('#kbdSr').disabled = K.w >= W_MAX;
    reveal(K.base, WHITES[K.w + HOME.length - 1]);
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
  /* Z X: an octave; C V: one white key, so A can be any white note */
  function shift(n){
    const w0 = K.w; setW(K.w + n);
    if (K.w === w0) return;
    labels();
    toast('Keyboard: A plays ' + LETTER(K.base) + '.');
  }
  const octave = d => shift(7 * d);

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
  /* in note input a key writes its note at the caret (as typing its letter does), in the value chosen */
  function write(m){
    if (!piece || !CBA.guard()) return;
    /* outside note input a key changes the pitch of the note that is selected (nothing else is written) */
    if (!ed.on) {
      const s = selSym(), v = curVoice();
      if (!s || s.rest || !v || ed.range || ed.picks) return;
      const sp = spell(m, v, v.events[s.src[0]].t);
      if (sp.step < STEP_MIN || sp.step > STEP_MAX) { toast('That note is outside the range that can be written.'); return; }
      commit(() => { for (const i of s.src) CBA.setPitch({e: v.events[i], v}, sp.step, sp.alt); });
      return;
    }
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
    if (!(H.keyNote && H.keyNote(m, true))) write(m);
  }
  function up(m, src){
    const v = K.held.get(src + m); if (v === undefined) return;
    K.held.delete(src + m); Organ.unhold(v);
    if (H.keyNote) H.keyNote(m, false);
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
      if (hoverable() && !K.told) { K.told = true; toast('Keyboard: A S D F G H J K L ; are the white keys, W E T Y U O P the black ones. Z X change the octave, C V move it by one key; Escape closes it.'); }
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
  /* the size of the keys and the glissando, set in the keyboard's menu (kept in this browser). Without a setting of its own, the keys
     have the size of their screen (a phone's are a little smaller). */
  const phone = () => window.matchMedia && matchMedia('(max-width:700px),(pointer:coarse)').matches;
  const KW = 'scriptorium:kbdW', KHT = 'scriptorium:kbdH', KG = 'scriptorium:kbdG';
  const load = k => { try { const v = localStorage.getItem(k); return v === null ? null : +v; } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
  let kw = load(KW), kht = load(KHT), gliss = load(KG) === 1;
  if (kw !== null) kw = Math.max(20, Math.min(130, kw || 28));
  if (kht !== null) kht = Math.max(50, Math.min(400, kht || 90));
  function width(){
    if (kw !== null) { box.style.setProperty('--kw', kw + 'px'); box.style.setProperty('--bw', Math.round(kw * 0.64) + 'px'); }
    else { box.style.removeProperty('--kw'); box.style.removeProperty('--bw'); }
    if (kht !== null) box.style.setProperty('--kh', kht + 'px'); else box.style.removeProperty('--kh');
    $('#kbdW').value = kw !== null ? kw : (phone() ? 28 : 30);
    $('#kbdH').value = kht !== null ? kht : Math.round(parseFloat(getComputedStyle(box).getPropertyValue('--kh')) || 92);
    $('#kbdG').checked = gliss; box.classList.toggle('gliss', gliss);
  }
  $('#kbdW').addEventListener('input', e => {
    /* the key in the middle of the screen stays there */
    const mid = (scroller.scrollLeft + scroller.clientWidth / 2) / (keysEl.offsetWidth || 1);
    kw = +e.target.value; save(KW, kw); width();
    scroller.scrollLeft = mid * keysEl.offsetWidth - scroller.clientWidth / 2;
  });
  $('#kbdH').addEventListener('input', e => { kht = +e.target.value; save(KHT, kht); width(); if (window.__dockPlace) window.__dockPlace(); });
  $('#kbdG').addEventListener('change', e => { gliss = e.target.checked; save(KG, gliss ? 1 : 0); width(); });
  if (window.ResizeObserver) new ResizeObserver(() => { if (!box.hidden) { document.documentElement.style.setProperty('--kbh', box.offsetHeight + 'px'); if (window.__dockPlace) window.__dockPlace(); } }).observe(box);
  window.addEventListener('message', () => { if (!box.hidden) setTimeout(fit, 0); });
  window.addEventListener('resize', () => { if (!box.hidden) fit(); });
  btn.addEventListener('click', e => {
    if (e.target.closest('.singchev')) {
      if (window.matchMedia && matchMedia('(hover:hover)').matches) return;   /* with a mouse the menu follows the pointer */
      const p = $('#popKbd'), open = !p.classList.contains('open');
      closePops(p); p.classList.toggle('open', open); return;
    }
    midiStart(true); setOn(!K.on); btn.blur();
  });
  $('#kbdDn').addEventListener('click', e => { octave(-1); e.currentTarget.blur(); });
  $('#kbdUp').addEventListener('click', e => { octave(1); e.currentTarget.blur(); });
  $('#kbdSl').addEventListener('click', e => { shift(-1); e.currentTarget.blur(); });
  $('#kbdSr').addEventListener('click', e => { shift(1); e.currentTarget.blur(); });

  /* fingers and the mouse: a press sounds at once; it writes the note when let go, unless the finger moved on to scroll */
  const touches = new Map();
  keysEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.kk'); if (!el) return;
    e.preventDefault();
    const m = +el.dataset.m, s = sound();
    const taking = !!(H.keyNote && H.keyNote(m, true));
    touches.set(e.pointerId, {m, v: Organ.hold(m, s.reg, s.gain), x: e.clientX, taking});
    el.classList.add('on');
    if (e.pointerType === 'mouse') { if (!taking) { follow(); write(m); } touches.get(e.pointerId).done = true; }
  });
  const lift = (e, cancel) => {
    const p = touches.get(e.pointerId); if (!p) return;
    touches.delete(e.pointerId); Organ.unhold(p.v);
    const el = keyEl(p.m); if (el && ![...K.held.keys()].some(k => k.endsWith(':' + p.m))) el.classList.remove('on');
    if (H.keyNote) H.keyNote(p.m, false);
    if (!cancel && !p.done && !p.taking && Math.abs(e.clientX - p.x) < 12) { follow(); write(p.m); }
  };
  /* Glissando: the finger (or the mouse, pressed) slides on from key to key, each playing as it is reached; what is left behind stops.
     Nothing is written by a slide, only by a press that stays on its key. */
  keysEl.addEventListener('pointermove', e => {
    if (!gliss) return;
    const p = touches.get(e.pointerId); if (!p) return;
    const under = document.elementFromPoint(e.clientX, e.clientY), k = under && under.closest && under.closest('.kk');
    if (!k || !keysEl.contains(k)) return;
    const m = +k.dataset.m; if (m === p.m) return;
    const old = keyEl(p.m);
    Organ.unhold(p.v); if (H.keyNote) H.keyNote(p.m, false);
    if (old && ![...K.held.keys()].some(q => q.endsWith(':' + p.m)) && ![...touches.values()].some(q => q !== p && q.m === p.m)) old.classList.remove('on');
    const s2 = sound(); p.m = m; p.v = Organ.hold(m, s2.reg, s2.gain); p.done = true;
    k.classList.add('on'); if (H.keyNote) H.keyNote(m, true);
    e.preventDefault();
  });
  keysEl.addEventListener('pointerup', e => lift(e, false));
  keysEl.addEventListener('pointercancel', e => lift(e, true));
  keysEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') lift(e, true); });
  keysEl.addEventListener('contextmenu', e => e.preventDefault());
  /* two fingers on the keys play two notes: the browser must not take them for a pinch (zoom) or a two-finger scroll */
  box.addEventListener('touchstart', e => { if (e.touches.length > 1) e.preventDefault(); }, {passive: false});
  box.addEventListener('touchmove', e => { if (e.touches.length > 1 || gliss) e.preventDefault(); }, {passive: false});
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) box.addEventListener(t, e => e.preventDefault());

  /* the computer's keys: before the app's own shortcuts (window, capture), only while the keyboard is open */
  window.addEventListener('keydown', e => {
    if (!K.on) return;
    const t = e.target, tag = t.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setOn(false); return; }
    if (e.shiftKey) return;   /* Shift+L (lyrics) and the Shift keys keep their meaning */
    const sh = {KeyZ: -7, KeyX: 7, KeyC: -1, KeyV: 1}[e.code];
    if (sh) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) shift(sh); return; }
    if (!HOME.includes(e.code) && !TOP.includes(e.code)) return;
    /* a key of the black row with no black key under it is silent (it does not fall through to a shortcut) */
    e.preventDefault(); e.stopImmediatePropagation();
    const m = codeMidi(e.code);
    if (e.repeat || m === undefined) return;
    down(m, 'k' + e.code + ':');
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
    btn.title = (now.length ? 'MIDI keyboard: ' + now.join(', ') + '. ' : '') + 'Keyboard: play the notes, and write them in note input (N). On a computer the letter keys play it (A S D F … white keys, W E T Y … black keys; Z X octave; Escape closes)';
    if (added.length) toast('MIDI keyboard connected: ' + added.join(', ') + '. It plays in the sound of the selected voice, and writes notes in note input.');
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
