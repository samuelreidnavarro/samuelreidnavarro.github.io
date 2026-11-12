/* Scriptorium add-on: CantusFirmus. Runs inside the engine (see scriptorium.js).
   Each cantus firmus (window.CF_LIBRARY, cantus-firmi.js) opens as a score of one voice; a counterpoint is sung
   (Sing writes it as a voice of its own) or added in Voices. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const LIB = window.CF_LIBRARY || [];
  const CF_KERN = {treble8: 'Gv2', treble: 'G2', g1: 'G1', c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4', c5: 'C5', baritone: 'F3', bass: 'F4'};
  const CF_KEY = {baritone: 'f3'};   /* the engine's name of a CantusFirmus clef */
  const engineClef = c => CF_KEY[c] || (CLEFS[c] ? c : 'treble8');
  const COUNTER = 'Contrapunctus';

  /* ---------------- the old CantusFirmus notes ---------------- */
  function parseTokens(str){
    const out = []; let prev = 26;
    str.trim().split(/\s+/).forEach(tok => {
      const m = /^(r)?(\d+)?([bn#])?(Mx|Sm|L|B|S|M|F)(\.)?$/.exec(tok);
      if (!m) throw new Error('bad token ' + tok);
      const s = m[2] ? Number(m[2]) : prev;
      out.push({d: m[4], r: !!m[1], s, a: m[1] ? '' : (m[3] || ''), p: !m[1] && !!m[5]});
      if (!m[1]) prev = s;
    });
    return out;
  }
  function itemNotes(item){
    if (item.n) return parseTokens(item.n);
    return item.s.map((s, i) => ({d: i === item.s.length - 1 ? 'L' : 'B', r: false, s, a: (item.a && item.a[i]) || '', p: false}));
  }
  /* a cantus firmus {title, clef, bflat, notes: [{d, r, s, a, p}]} in its tempus, as **kern: the cantus firmus and an empty voice above */
  function cfKern(doc, tempus){
    const vals = Organ.readValues(doc.notes, tempus).v;     /* sounding values in minims */
    const title = doc.title || 'Cantus firmus';
    const ck = CF_KERN[doc.clef] || 'Gv2';
    const lines = [`!!!OTL: ${title}`, '**kern', '*I"Cantus firmus', `*clef${ck}`];
    if (doc.bflat) lines.push('*k[b-]');
    lines.push(`*met(${tempus === 'O' ? 'O' : 'C'})`, '=1-');
    doc.notes.forEach((n, i) => {
      const d = recipOf(vals[i] / 2);
      if (n.r) { lines.push(d + 'r'); return; }
      const B = ((n.s % 7) + 7) % 7 === 6;
      const alt = n.a === 'b' ? -1 : n.a === '#' ? 1 : n.a === 'n' ? 0 : (doc.bflat && B ? -1 : 0);
      const acc = alt < 0 ? '-' : alt > 0 ? '#' : (n.a === 'n' || (doc.bflat && B)) ? 'n' : '';
      lines.push(d + pitchTok(n.s) + acc);
    });
    lines.push('==', '*-');
    const P = parseKern(lines.join('\n') + '\n');
    /* barlines at every perfection (every brevis), with ties where a note runs over */
    const per = tempus === 'O' ? 3 : 2;
    for (let t = per; t < P.end - EPS; t += per) P.bars.push({t: rt(t), type: 'single'});
    P.meta.OTL = title;
    if (doc.source) P.meta.SMS = doc.source;
    return writeKern(P);
  }
  const SOURCE = {'Fux, Gradus ad Parnassum': () => 'Johann Joseph Fux, Gradus ad Parnassum (1725)', Chant: it => it.desc, Chanson: it => it.desc, 'Basse danse': it => it.desc.replace(/\.$/, '')};
  const itemDoc = (item, g) => ({title: item.title, clef: item.c || 'treble8', bflat: !!item.b, notes: itemNotes(item), source: SOURCE[g.group] ? SOURCE[g.group](item) : ''});

  /* every cantus firmus is a piece of its own, cf:<group>:<item>, written out the first time it is opened */
  LIB.forEach((g, gi) => g.items.forEach((it, ii) => {
    const key = `cf:${gi}:${ii}`;
    let text = null;
    Object.defineProperty(cache, key, {enumerable: true, configurable: true,
      get(){ if (text === null) text = cfKern(itemDoc(it, g), it.t === 'O' ? 'O' : 'C'); return text; },
      set(v){ text = v; }});
  }));

  /* ---------------- the library: categories, then their cantus firmi with a picture of each ---------------- */
  function preview(item){
    const ck = engineClef(item.c || 'treble8'), C = CLEFS[ck], top = 0;
    let o = clefSvg(ck, 0.5, top), x = 0.5 + clefW(ck) + 0.9;
    if (item.b) {
      let pos = [2, 3, 4, 5, 6, 7, 8, 0, 1].find(p => ((C.bottom + p) % 7 + 7) % 7 === 6);
      o += use('fl', x, top + 4 - pos * 0.5); x += gw('fl') + 0.8;
    }
    itemNotes(item).slice(0, 40).forEach(n => {
      if (n.r) { const k = SHAPE_REST[n.d] || 'rB'; o += use(k, x + 0.2, top + 2); x += 2.2; return; }
      const pos = n.s - C.bottom;
      const acc = {b: 'fl', '#': 'sh', n: 'na'}[n.a];
      if (acc) { o += use(acc, x, top + 4 - pos * 0.5); x += gw(acc) + 0.3; }
      o += ledgers(pos, x, gw(n.d), top);
      o += use(n.d, x, top + 4 - pos * 0.5);
      x += Math.max(2.2, gw(n.d) + 0.9);
    });
    const w = x + 0.4;
    let lines = '';
    for (let k = 0; k < 5; k++) lines += hl(0, w, top + k, 'staff', 0.13);
    return `<svg viewBox="0 -2.6 ${f(w)} 9.6" style="width:${f(w * 4.8)}px" aria-hidden="true">${lines}${o}</svg>`;
  }
  let libCat = null;
  function renderLib(){
    let h = `<div id="libMine">${mineHtml()}</div>`;
    if (libCat === null) {
      h += '<h2>Cantus firmi</h2>';
      LIB.forEach((g, gi) => {
        const first = g.items[0];
        h += `<button class="catitem" data-g="${gi}"><span class="cathead"><span class="t">${esc(g.group)}</span>` +
          `<span class="cnt">${g.items.length} cantus firmi<svg class="chev r" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.2 2 8.4 6 4.2 10 3.1 8.9 6.1 6 3.1 3.1Z"/></svg></span></span>` +
          `<span class="d">${esc(g.note)}</span><span class="pv">${preview(first)}</span><span class="first">Starts with ${esc(first.title)}</span></button>`;
      });
    } else {
      const g = LIB[libCat];
      h += `<div class="libnav"><button class="libback" type="button"><svg class="chev l" viewBox="0 0 12 12" aria-hidden="true"><path d="M7.8 2 3.6 6 7.8 10 8.9 8.9 5.9 6 8.9 3.1Z"/></svg>All categories</button></div>` +
        `<h2>${esc(g.group)}</h2><p class="gnote">${esc(g.note)}</p>`;
      g.items.forEach((it, ii) => {
        const key = `cf:${libCat}:${ii}`;
        h += `<button class="pc cfitem" data-p="${key}" aria-current="${key === pieceKey}"><span class="t">${esc(it.title)}</span><span class="c">${esc(it.desc)}</span><span class="pv">${preview(it)}</span></button>`;
      });
    }
    libEl.innerHTML = h;
    libEl.scrollTop = 0;
  }
  libEl.addEventListener('click', e => {
    const c = e.target.closest('.catitem');
    if (c) { libCat = +c.dataset.g; renderLib(); return; }
    if (e.target.closest('.libback')) { libCat = null; renderLib(); }
  });
  libBtn.addEventListener('click', () => { libCat = null; renderLib(); });

  /* ---------------- a cantus firmus written anew, or coming from another app ---------------- */
  async function newCF(){
    const id = mineAdd('New cantus firmus', kernOf('New cantus firmus', [['Cantus firmus', 'Gv2']]));
    await loadPiece(id);
    refreshMine();
    ed.on = true; ed.sel = null; ed.ins = {vi: 0, ei: 0}; syncEdit(); showSel();
    toast('A new cantus firmus. Click on its staff to write a note, or type the letters A to G.');
  }
  /* one voice from ChoirBook or Canon Maker: the cantus firmus, alone (a second voice can be added in Voices) */
  async function fromHandoff(h){
    const P = parseKern(h.kern);
    if (!P.voices.length) return false;
    const id = mineAdd(h.title || 'Cantus firmus', h.kern);
    await loadPiece(id);
    refreshMine();
    toast(`${h.title || 'The voice'} came over from ${h.from || 'another app'}.`);
    return true;
  }

  /* ---------------- what the old CantusFirmus kept: the melody last open, and shared links ---------------- */
  const CLEF_CODE = {t8: 'treble8', t: 'treble', g1: 'g1', c1: 'c1', c2: 'c2', c3: 'c3', c4: 'c4', c5: 'c5', f3: 'baritone', f: 'bass'};
  function docFromHash(){
    const p = new URLSearchParams(location.hash.slice(1));
    if (!p.has('notes')) return null;
    const clef = CLEF_CODE[p.get('clef')] || 'treble8', bottom = CLEFS[engineClef(clef)].bottom;
    const notes = [];
    for (const tok of (p.get('notes') || '').split('.')) {
      const m = /^(Mx|Sm|L|B|S|M|F)(p?)-(?:(r)|([A-G])([bns]?)(\d))$/.exec(tok);
      if (!m) continue;
      if (m[3]) { notes.push({d: m[1], r: true, s: bottom + 4, a: ''}); continue; }
      notes.push({d: m[1], r: false, s: 7 * Number(m[6]) + 'CDEFGAB'.indexOf(m[4]), a: ({b: 'b', n: 'n', s: '#'})[m[5]] || '', p: m[2] === 'p'});
    }
    return notes.length ? {doc: {title: p.get('title') || '', clef, bflat: p.get('flat') === '1', notes}, tempus: p.get('t') === 'O' ? 'O' : 'C'} : null;
  }
  try {
    const link = docFromHash();
    if (link) {
      st.piece = mineAdd(link.doc.title || 'Cantus firmus', cfKern(link.doc, link.tempus)); save();
      try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) {}
    } else if (!localStorage.getItem(APP.store + ':migrated')) {
      localStorage.setItem(APP.store + ':migrated', '1');
      const old = JSON.parse(localStorage.getItem('cantus-firmus:v1') || 'null');
      if (old && old.doc && Array.isArray(old.doc.notes) && old.doc.notes.length) {
        const d = old.doc;
        st.piece = mineAdd(d.title || 'My cantus firmus', cfKern({title: d.title || 'My cantus firmus', clef: d.clef, bflat: !!d.bflat, notes: d.notes}, old.prefs && old.prefs.tempus === 'O' ? 'O' : 'C'));
        save();
      }
    }
  } catch (e) {}

  Object.assign(H, {
    buildPieceList: async () => { renderLib(); },
    newScore: newCF,
    fromHandoff,
    /* the Contrapunctus starts with Playback off: it is the voice sung (or written) against the cantus firmus */
    afterLoad(){
      const i = piece ? piece.voices.findIndex(v => v.name === COUNTER) : -1;
      const all = st.vis[pieceKey];
      if (i >= 0 && !(all && all[i])) { vis(i).play = false; save(); }
    }
  });
}]);
