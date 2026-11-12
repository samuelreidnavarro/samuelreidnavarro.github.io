/* Scriptorium add-on: Canon Maker. Runs inside the engine (scriptorium.js evaluates it in its own scope),
   so it uses the engine's piece, ed, commit, render ... directly, and plugs in through the hooks H. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  /* ------------------------------------------------------------------ */
  /* The canon: one dux, up to two comes made from it                    */
  /* ------------------------------------------------------------------ */
  /* The settings travel with the score (!!!CANON in the **kern), so undo and My canons keep them. Each voice carries its
     part in *I' : dux, comes1, comes2. On every change the comes are written again from the dux: the dux's notes, moved by
     the interval of imitation, after rests as long as the delay. */
  const IV_WORDS = ['unison', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'octave', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth'];
  const IV_Q_NAMES = {d: 'diminished', m: 'minor', M: 'major', P: 'perfect', A: 'augmented'};
  const IVB = [0, 2, 4, 5, 7, 9, 11];
  const ivPerf = n => n % 7 === 0 || n % 7 === 3 || n % 7 === 4;
  const ivQuals = n => n === 0 ? ['P', 'A'] : ivPerf(n) ? ['d', 'P', 'A'] : ['d', 'm', 'M', 'A'];
  const ivDefQ = n => ivPerf(n) ? 'P' : n % 7 === 6 ? 'm' : 'M';
  const ivSemis = (n, q) => 12 * Math.floor(n / 7) + IVB[n % 7] + ({d: ivPerf(n) ? -1 : -2, m: -1, M: 0, P: 0, A: 1})[q];
  /* the delay's note values, in semibreves, as a note of that value is written in the app */
  const DELAY_U = {M: 0.5, S: 1, B: 2, L: 4};
  const DELAY_NAMES = {M: ['minima', 'minimae'], S: ['semibrevis', 'semibreves'], B: ['brevis', 'breves'], L: ['longa', 'longae']};
  /* each comes keeps its id (its part is 'comes' + id), so names and view switches stay with it when another is removed */
  const CANON0 = {mode: 'dia', c: [{id: 1, dir: 1, n: 4, q: 'P', dc: 1, du: 'B', name: 'Altus'}]};
  const MAX_COMES = 4;
  /* what a new comes is, in turn: the first of these not taken yet */
  const COMES_NEW = [{dir: 1, n: 4, dc: 1, name: 'Altus'}, {dir: -1, n: 7, dc: 2, name: 'Bassus'}, {dir: 1, n: 7, dc: 3, name: 'Cantus'}, {dir: -1, n: 3, dc: 4, name: 'Quintus'}, {dir: 1, n: 3, dc: 5, name: 'Sextus'}];
  const mod7 = s => ((s % 7) + 7) % 7;
  function canonOf(P){
    let C = null; try { C = JSON.parse((P.meta && P.meta.CANON) || 'null'); } catch (e) {}
    if (!C || typeof C !== 'object') return JSON.parse(JSON.stringify(CANON0));
    const out = {mode: C.mode === 'exact' ? 'exact' : 'dia', c: []};
    const used = new Set();
    (Array.isArray(C.c) ? C.c : []).forEach((x, k) => {
      if (!x || x.on === false || out.c.length >= MAX_COMES) return;     /* on: false, from the first version */
      const c = Object.assign({dir: 1, n: 4, q: 'P', dc: 1, du: 'B', name: 'Comes'}, x);
      let id = Math.round(+c.id) || k + 1; while (used.has(id)) id++; used.add(id); c.id = id;
      delete c.on;
      c.dir = c.dir < 0 ? -1 : 1;
      c.n = Math.max(0, Math.min(14, Math.round(+c.n) || 0));
      if (!ivQuals(c.n).includes(c.q)) c.q = ivDefQ(c.n);
      c.dc = Math.max(0, Math.min(64, Math.round(+c.dc) || 0));
      if (!DELAY_U[c.du]) c.du = 'B';
      c.name = String(c.name || 'Comes').slice(0, 40);
      out.c.push(c);
    });
    return out;
  }
  function addComes(C){
    if (C.c.length >= MAX_COMES) return false;
    const pick = COMES_NEW.find(x => !C.c.some(c => c.dir * c.n === x.dir * x.n)) || COMES_NEW[0];
    const id = Math.max(0, ...C.c.map(c => c.id)) + 1;
    C.c.push({id, dir: pick.dir, n: pick.n, q: ivDefQ(pick.n), dc: Math.max(pick.dc, ...C.c.map(c => c.dc + 1)), du: 'B', name: pick.name});
    return true;
  }
  const duxIndex = () => { const i = piece ? piece.voices.findIndex(v => v.abbr === 'dux') : -1; return i < 0 ? 0 : i; };
  function comesToast(){ toast('The comes follows the dux: write in the dux.'); }
  /* a dux note in the comes. Diatonic: the same number of steps along the scale, the comes keeping the dux's signature;
     a sharp or flat of the dux's own goes with it (F sharp a fifth up is C sharp), unless it would make a note outside
     the gamut (B flat a fifth up is F, not F flat). Exact: the interval as named, every note spelt with its accidental. */
  function shiftPitch(dux, e, c, mode){
    const s2 = e.step + c.dir * c.n;
    const imp = implied(dux, e.step, e.t) || 0;
    if (mode !== 'exact') {
      if (e.alt === null || e.alt === undefined) return {step: s2, alt: null, ed: false};
      const infl = e.alt - imp;
      if (!infl) return {step: s2, alt: null, ed: false};
      const a = (implied(dux, s2, e.t) || 0) + infl, L = LETTERS[mod7(s2)];
      if (Math.abs(a) > 1 || (a > 0 && (L === 'e' || L === 'b')) || (a < 0 && (L === 'c' || L === 'f'))) return {step: s2, alt: null, ed: false};
      return {step: s2, alt: a, ed: !!e.ed};
    }
    const target = midiOf({step: e.step, alt: e.alt === null || e.alt === undefined ? imp : e.alt}) + c.dir * ivSemis(c.n, c.q);
    for (const ds of [0, c.dir, -c.dir]) {
      const s = s2 + ds, a = target - midiOf({step: s, alt: 0});
      if (Math.abs(a) <= 1) return {step: s, alt: a || null, ed: false};
    }
    return {step: s2, alt: null, ed: false};
  }
  /* the comes' modern clef, by its range; it keeps the clef it had while that one still fits as well */
  function modernClef(steps, prev){
    if (!steps.length) return prev || 'Gv2';
    const cost = k => { const b = CLEFS[KERN_CLEF[k]].bottom; let c = 0; for (const s of steps) { const p = s - b; if (p < -2) c += Math.ceil((-2 - p) / 2); else if (p > 10) c += Math.ceil((p - 10) / 2); } return c; };
    let best = null, bc = Infinity;
    for (const k of ['Gv2', 'G2', 'F4']) { const c = cost(k); if (c < bc) { bc = c; best = k; } }
    return prev && KERN_CLEF[prev] && ['Gv2', 'G2', 'F4'].includes(prev) && cost(prev) <= bc ? prev : best;
  }
  function canonize(P){
    const C = canonOf(P);
    let dux = P.voices.find(v => v.abbr === 'dux') || P.voices.find(v => !/^comes/.test(v.abbr || '')) || P.voices[0];
    dux.abbr = 'dux';
    retime(dux);
    const mi = mensInfo(metAt(dux, 0));
    /* the dux with its tied notes made one again (the barlines split them afresh when the score is written) */
    const E = dux.events, at = [], mel = [];
    for (let i = 0; i < E.length; i++) {
      const e = Object.assign({}, E[i], {syl: (E[i].syl || []).slice()});
      at[i] = mel.length;
      if (!e.rest && e.tieStart && !e.tieEnd) {
        let j = i + 1;
        while (j < E.length && !E[j].rest && E[j].step === e.step && (E[j].tieMid || E[j].tieEnd)) {
          at[j] = mel.length;
          e.d = rt(e.d + E[j].d); e.kd = e.d; e.ferm = e.ferm || E[j].ferm; e.long = E[j].long;
          const stop = !E[j].tieMid; j++;
          if (stop) break;
        }
        i = j - 1;
        e.tieStart = e.tieEnd = e.tieMid = false;
      }
      mel.push(e);
    }
    for (const arr of [dux.mets, dux.keys, dux.clefs]) for (const m of arr) m.ei = m.ei < E.length ? at[m.ei] : mel.length;
    dux.events = mel;
    retime(dux);
    const old = {}; P.voices.forEach(v => { if (v.abbr) old[v.abbr] = v; });
    const list = [{v: dux, lvl: 0, k: -1}];
    C.c.forEach((c, k) => {
      const role = 'comes' + c.id, prev = old[role];
      const v = {name: prev ? prev.name : c.name, abbr: role, kclef: null, events: [], mets: [], keys: [], clefs: [], verses: dux.verses, t: 0};
      c.name = v.name;
      if (mel.length) {
        let D = rt(c.dc * DELAY_U[c.du] / mi.p);
        for (const u of [2, 1, 0.5, 0.25, 0.125, 0.0625]) while (D > u - EPS) { v.events.push({d: u, kd: u, rest: true, syl: []}); D = rt(D - u); }
        if (D > EPS) v.events.push({d: D, kd: D, rest: true, syl: []});
      }
      const lead = v.events.length;
      for (const e of mel) {
        const x = Object.assign({}, e, {syl: e.syl.slice()});
        if (!e.rest) Object.assign(x, shiftPitch(dux, e, c, C.mode));
        v.events.push(x);
      }
      const place = ei => ei <= 0 ? 0 : lead + ei;
      v.mets = dux.mets.map(m => ({t: 0, sign: m.sign, ei: place(m.ei)}));
      if (!v.mets.length) v.mets.push({t: 0, sign: 'C', ei: 0});
      if (C.mode !== 'exact') v.keys = dux.keys.map(m => ({t: 0, alts: Object.assign({}, m.alts), raw: m.raw, ei: place(m.ei)}));
      v.kclef = modernClef(v.events.filter(e => !e.rest).map(e => e.step), prev && prev.kclef);
      v.clefs = [{t: 0, c: v.kclef, ei: 0}];
      retime(v);
      list.push({v, lvl: c.dir * c.n, k});
    });
    /* the highest voice on top; the dux above a comes at the unison */
    list.sort((a, b) => b.lvl - a.lvl || a.k - b.k);
    P.voices = list.map(x => x.v);
    P.meta.CANON = JSON.stringify(C);
    /* a barline at every brevis */
    P.end = Math.max(0, ...P.voices.map(v => v.end));
    const per = (mi.T === 3 ? 3 : 2) / mi.p;
    P.bars = [];
    for (let t = per; t < P.end - EPS; t = rt(t + per)) P.bars.push({t: rt(t), type: 'single'});
    P.sections = [];
    return P;
  }
  /* the view switches and the selection follow their voices when the voices change places */
  function followRoles(roles0){
    const now = piece.voices.map(v => v.abbr);
    if (roles0.join() === now.join()) return;
    const all = st.vis[pieceKey] || {}, nv = {};
    roles0.forEach((r, i) => { const j = now.indexOf(r); if (j >= 0 && all[i]) nv[j] = all[i]; });
    st.vis[pieceKey] = nv; save();
    const map = x => { if (!x) return null; const j = now.indexOf(roles0[x.vi]); return j >= 0 ? {vi: j, ei: x.ei} : null; };
    ed.sel = map(ed.sel); ed.ins = map(ed.ins);
  }
  /* in the dux, the selection and the cursor are kept as times, since writing the score again joins and splits tied notes */
  let nextPlace = null;
  function placeAsTimes(){
    const d = duxIndex(), v = piece.voices[d]; retime(v);
    const tOf = (x, ins) => !x || x.vi !== d ? null : x.ei < v.events.length ? v.events[x.ei].t : (ins ? Infinity : v.end);
    return {sel: tOf(ed.sel, false), ins: tOf(ed.ins, true)};
  }
  function placeFromTimes(p){
    const d = duxIndex(), v = piece.voices[d], n = v.events.length;
    if (p.sel !== null) {
      let k = -1; v.events.forEach((e, i) => { if (e.t <= p.sel + EPS) k = i; });
      ed.sel = n ? {vi: d, ei: Math.max(0, k)} : null;
    }
    if (p.ins !== null) { const k = v.events.findIndex(e => e.t >= p.ins - EPS); ed.ins = {vi: d, ei: k < 0 ? n : k}; }
  }
  /* the cursor never stands between two tied halves of a note */
  function insAfterTies(){
    if (!ed.ins || !piece) return;
    const v = piece.voices[ed.ins.vi]; if (!v) return;
    while (ed.ins.ei > 0 && ed.ins.ei < v.events.length) {
      const p = v.events[ed.ins.ei - 1];
      if (!p.rest && (p.tieStart || p.tieMid)) ed.ins.ei++; else break;
    }
  }
  function setCanon(fn){
    commit(() => { const C = canonOf(piece); fn(C); piece.meta.CANON = JSON.stringify(C); });
  }
  /* Edit on, the cursor at the end of the dux: type or click and the comes follow */
  function startWriting(){
    const d = duxIndex();
    ed.on = true; ed.sel = null; ed.ins = {vi: d, ei: piece.voices[d].events.length};
    syncEdit(); showSel();
  }
  async function newCanon(){
    const P = parseKern(['!!!OTL: Canon', '**kern', '*I"Tenor', "*I'dux", '*clefGv2', '*met(C)', '*-'].join('\n') + '\n');
    P.meta.CANON = JSON.stringify(CANON0);
    canonize(P);
    const id = mineAdd('Canon', writeKern(P));
    await loadPiece(id);
    render(); refreshMine();
    startWriting();
  }
  /* the comes in the order they come in: Comes I enters first */
  const byEntry = C => C.c.slice().sort((a, b) => a.dc * DELAY_U[a.du] - b.dc * DELAY_U[b.du] || a.id - b.id);
  /* the Voices pop-over: every voice, top to bottom, as in ChoirBook; comes are added and removed here */
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  function partName(v, C){
    if (v.abbr === 'dux') return 'Dux';
    const k = byEntry(C).findIndex(c => 'comes' + c.id === v.abbr);
    return 'Comes' + (C.c.length > 1 ? ' ' + ROMAN[k] : '');
  }
  function voicesPanel(){
    const tb = $('#voiceTable'); if (!tb || !piece) return;
    if (tb.contains(document.activeElement) && document.activeElement.classList.contains('vname')) return;
    const C = canonOf(piece);
    const opt = (v, label, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`;
    const rows = piece.voices.map((v, i) => {
      v.idx = i;
      const s = vis(i), dux = v.abbr === 'dux';
      const cb = (k, label) => `<td><input type="checkbox" data-i="${i}" data-k="${k}" aria-label="${esc(v.name)}: ${label}"${s[k] ? ' checked' : ''}${k === 'notes' && !s.on ? ' disabled' : ''}></td>`;
      const clef = dux ? (s.clef || KERN_CLEF[v.kclef] || 'treble8') : (s.clef || '');
      const clefs = (dux ? [] : [['', 'Automatic']]).concat(CLEF_OPTS);
      return `<tr data-i="${i}"><td class="part">${partName(v, C)}</td>` +
        `<td><input class="vname" data-i="${i}" value="${esc(v.name)}" aria-label="Name of the voice" autocomplete="off"></td>` +
        `<td><select class="vclef" data-i="${i}" aria-label="Clef of ${esc(v.name)}">${clefs.map(([k, n]) => opt(k, n, clef)).join('')}</select></td>` +
        `${cb('on', 'shown')}${cb('notes', 'notes')}${cb('play', 'playback')}` +
        `<td>${dux ? '' : `<button class="vbtn vdel" data-cop="del" data-r="${v.abbr}" aria-label="Remove ${esc(v.name)}" title="Remove this comes">×</button>`}</td></tr>`;
    });
    tb.innerHTML = `<thead><tr><th></th><th></th><th></th><th>Shown</th><th>Notes</th><th>Playback</th><th></th></tr></thead><tbody>${rows.join('')}</tbody>` +
      `<tfoot><tr><td colspan="7"><button data-cop="add"${C.c.length >= MAX_COMES ? ' disabled' : ''}>+ New comes</button></td></tr></tfoot>`;
  }
  $('#voiceTable').addEventListener('click', e => {
    const b = e.target.closest('button[data-cop]'); if (!b || !piece) return;
    e.stopPropagation();
    if (b.dataset.cop === 'add') setCanon(C => { addComes(C); });
    else {
      const r = b.dataset.r, v = piece.voices.find(x => x.abbr === r), name = v ? v.name : 'The comes';
      setCanon(C => { C.c = C.c.filter(c => 'comes' + c.id !== r); });
      toast(`${name} removed. Undo brings it back.`);
    }
    if (play) restartPlay();
  });
  /* the Canon pop-over: for each comes, the interval and the delay; and how the comes are transposed */
  const CLEF_OPTS = CLEF_MENU.map(c => [c[0], c[2]]);
  function canonPanel(){
    voicesPanel();
    const box = $('#canonBox'); if (!box || !piece) return;
    if (box.contains(document.activeElement) && /INPUT/.test(document.activeElement.tagName)) return;
    const C = canonOf(piece);
    const opt = (v, label, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`;
    let h = '';
    byEntry(C).forEach(c => {
      const k = C.c.indexOf(c);
      const v = piece.voices.find(x => x.abbr === 'comes' + c.id);
      h += `<div class="crow"><span class="role">${esc(v ? v.name : c.name)}</span>` +
        `<span class="w">at the</span>` +
        (C.mode === 'exact' ? `<select class="cq" data-k="${k}" aria-label="Quality of the interval">${ivQuals(c.n).map(q => opt(q, IV_Q_NAMES[q], c.q)).join('')}</select>` : '') +
        `<select class="civ" data-k="${k}" aria-label="Interval of imitation">${IV_WORDS.map((w, i) => opt(i, w, c.n)).join('')}</select>` +
        `<select class="cdir" data-k="${k}" aria-label="Above or below the dux"${c.n === 0 ? ' disabled' : ''}>${opt(1, 'above', c.dir)}${opt(-1, 'below', c.dir)}</select>` +
        `<span class="w">after</span><input type="number" class="cdc" data-k="${k}" min="0" max="64" step="1" inputmode="numeric" value="${c.dc}" aria-label="How many note values later">` +
        `<select class="cdu" data-k="${k}" aria-label="Note value of the delay">${Object.keys(DELAY_U).map(u => opt(u, DELAY_NAMES[u][c.dc === 1 ? 0 : 1], c.du)).join('')}</select></div>`;
    });
    h += `<div class="crow"><span class="role">Transposition</span><div class="btns" id="cmode" role="group" aria-label="Transposition">` +
      `<button class="tb" data-v="dia" aria-pressed="${C.mode !== 'exact'}" title="Every note moves the same number of steps along the scale, as a canon is sung from one part: the intervals follow the mode">Diatonic</button>` +
      `<button class="tb" data-v="exact" aria-pressed="${C.mode === 'exact'}" title="Every interval stays exactly the same, with sharps and flats where needed">Exact</button></div></div>`;
    box.innerHTML = h;
  }
  $('#canonBox').addEventListener('change', e => {
    const t = e.target; if (!piece) return;
    const k = t.dataset.k !== undefined ? +t.dataset.k : null;
    if (k === null) return;
    setCanon(C => {
      const c = C.c[k]; if (!c) return;
      if (t.classList.contains('civ')) { c.n = +t.value; if (!ivQuals(c.n).includes(c.q)) c.q = ivDefQ(c.n); }
      else if (t.classList.contains('cq')) c.q = t.value;
      else if (t.classList.contains('cdir')) c.dir = +t.value;
      else if (t.classList.contains('cdc')) c.dc = Math.max(0, Math.min(64, Math.round(+t.value) || 0));
      else if (t.classList.contains('cdu')) c.du = t.value;
    });
    if (play) restartPlay();
  });
  $('#canonBox').addEventListener('click', e => {
    const b = e.target.closest('#cmode button'); if (!b || !piece) return;
    if (canonOf(piece).mode !== b.dataset.v) { setCanon(C => { C.mode = b.dataset.v; }); if (play) restartPlay(); }
  });
  $('#canonBox').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur(); });

  /* ---------- how Canon Maker plugs into the Scriptorium engine ---------- */
  Object.assign(H, {
    /* the comes follow the dux on every change */
    commitStart: () => piece.voices.map(v => v.abbr),
    commitEnd(roles0){ const place = placeAsTimes(); canonize(piece); followRoles(roles0); nextPlace = place; },
    applyStart: () => piece ? piece.voices.map(v => v.abbr).join() : '',
    applyEnd(roles0){
      /* undo or redo brought back another order of voices: start again from the end of the dux */
      if (roles0 !== piece.voices.map(v => v.abbr).join()) { ed.sel = null; ed.ins = null; }
      if (nextPlace) { const p = nextPlace; nextPlace = null; placeFromTimes(p); }
      insAfterTies();
    },
    /* only the dux is written in */
    writable: v => v.abbr === 'dux',
    refuse: comesToast,
    guard(){ const v = anyVoice(); if (v && v.abbr !== 'dux') { comesToast(); return false; } if (!v && piece) { const d = duxIndex(); ed.ins = {vi: d, ei: piece.voices[d].events.length}; } return true; },
    voicePanel: canonPanel,
    afterParse: P => canonize(P),
    newScore: newCanon,
    mineRemoved(id){ if (id === pieceKey) newCanon(); },
    fileName: () => (piece.title || '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'Canon',
    async buildPieceList(){ libEl.innerHTML = `<div id="libMine">${mineHtml()}</div>`; },
    /* start: the canon last open, or a new one */
    start(){ (async () => {
      try { await document.fonts.load('100px "IM Fell English"'); await document.fonts.load('italic 100px "IM Fell English"'); } catch (e) {}
      syncUI(); sizeViewer();
      if (H.preStart) { try { await H.preStart(); } catch (e) {} }
      if (await takeHandoff().catch(() => false)) { buildPieceList().then(syncUI); return; }
      const last = st.piece && mineAll()[st.piece] ? st.piece : null;
      if (last) {
        try { await loadPiece(last); startWriting(); } catch (e) { await newCanon(); }
      } else await newCanon();
      buildPieceList().then(syncUI);
      if (/[?&]print=1/.test(location.search)) setTimeout(() => window.print(), 600);
    })(); },
    /* a voice from another app becomes the dux of a new canon */
    async fromHandoff(h){
      const P = parseKern(h.kern);
      if (!P.voices.length) return false;
      P.voices = [P.voices[0]];
      const v = P.voices[0]; v.abbr = 'dux';
      for (const e of v.events) e.syl = [];
      v.verses = 0;
      P.meta = {OTL: h.title || 'Canon', CANON: JSON.stringify(CANON0)};
      canonize(P);
      const id = mineAdd(h.title || 'Canon', writeKern(P));
      await loadPiece(id); refreshMine();
      startWriting();
      toast(`${v.name} came over from ${h.from || 'another app'} as the dux. The Canon menu sets the comes.`);
      return true;
    },
    expose: () => ({canonize, canonOf, setCanon})
  });

}]);
