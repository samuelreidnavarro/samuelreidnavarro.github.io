/* Scriptorium add-on: lyrics. Typed under the notes, in every app.
   Add > Lyrics (or L with a note selected, or a click on any syllable) opens a small field under the selected note.
   Space or Tab: on to the next note. Hyphen: the syllable goes on in the next one (Ky-ri-e). Underscore: the next
   note is left without a syllable (a melisma). Shift+Tab, or the arrows at the field's edge: back and forth.
   Backspace in an empty field: back, taking that syllable off. Enter or Escape: done. Pasting a whole text fills
   the notes from here on, a syllable each (words split at their hyphens; an underscore skips a note).
   The syllables are the score's own (**text columns in the kern, one per verse, Ky- -ri- -e), so saving, export,
   the share link and undo all have them. Add > New verse writes a further line of text under the same notes. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const list = $('#addList'); if (!list) return;
  list.insertAdjacentHTML('beforeend',
    '<button class="tb" id="addLyr" title="Type the words under the selected note: Space goes on to the next note, a hyphen joins the syllables of a word, underscore leaves a note without one; paste a whole text to fill the notes (L, or click a syllable)">Lyrics</button>' +
    '<button class="tb" id="addVerse" title="A further verse: another line of words under the same notes">New verse</button>');

  const L = {inp: null, vi: -1, ei: -1, verse: 0, busy: false};
  /* the notes a syllable can go on: a note's start, not a rest, nor the later parts of a tied note */
  const sylNote = e => e && !e.rest && !e.tieEnd && !e.tieMid;
  const nextNote = (v, ei, dir) => { for (let i = ei + dir; i >= 0 && i < v.events.length; i += dir) if (sylNote(v.events[i])) return i; return -1; };
  const verseOf = () => Math.max(0, st.verse || 0);
  const cur = e => { const s = e && e.syl && e.syl[verseOf()]; return s && s !== '.' ? s : ''; };
  /* how a syllable is written in the field: without the leading dash of a word's later syllables, with its own trailing one */
  const shown = s => s.replace(/^-/, '').replace(/_/g, ' ');
  /* kern **text can't take a tab, and a token must not look like an interpretation, comment or barline */
  const clean = s => s.replace(/[\t\r\n]+/g, ' ').trim().replace(/ +/g, '_').replace(/^[*!=]+/, '');

  /* the leading dashes follow the trailing ones: a syllable after one that ends in "-" starts with "-" */
  function relink(v, verse){
    let prevHy = false;
    for (const e of v.events) {
      if (!sylNote(e)) continue;
      const s = e.syl && e.syl[verse];
      if (!s || s === '.') continue;
      const core = s.replace(/^-+/, '');
      if (!core || core === '-') { e.syl[verse] = undefined; continue; }
      e.syl[verse] = (prevHy ? '-' : '') + core;
      prevHy = /-$/.test(core);
    }
  }
  function setSyl(v, ei, text, verse){
    const e = v.events[ei]; if (!e) return;
    e.syl = e.syl ? e.syl.slice() : [];
    const t = clean(text);
    e.syl[verse] = t && t !== '-' && t !== '.' ? t : undefined;
    if (t) v.verses = Math.max(v.verses || 0, verse + 1);
  }
  /* trailing verses that no voice uses any more are dropped from the file */
  function trimVerses(){
    for (const v of piece.voices) {
      let n = v.verses || 0;
      while (n > 0 && !v.events.some(e => e.syl && e.syl[n - 1] && e.syl[n - 1] !== '.')) n--;
      v.verses = n;
      v.events.forEach(e => { if (e.syl && e.syl.length > n) e.syl.length = n; });
    }
  }
  const okVoice = v => { if (!CBA.guard()) return false; if (!writable(v)) { refuse(); return false; } return true; };

  /* where the field goes: under the note, on its voice's line of words */
  function place(){
    const inp = L.inp; if (!inp || !piece) return;
    const v = piece.voices[L.vi]; if (!v || !v.syms) return;
    const k = v.syms.findIndex(q => q.src && q.src.includes(L.ei)); if (k < 0) return;
    const g = pagesEl.querySelector('g.n' + L.vi + '-' + k); if (!g) return;
    const par = g.parentNode;
    let r = null;
    for (const r2 of par.querySelectorAll('rect.stafhit[data-v="' + L.vi + '"]')) if (r2.dataset.k0 !== '' && +r2.dataset.k0 <= k && k <= +r2.dataset.k1) r = r2;
    if (!r) return;
    const own = par.querySelector('text.lyr[data-s="n' + L.vi + '-' + k + '"]');
    let ly = null;
    for (const t of par.querySelectorAll('text.lyr')) { const m = /^n(\d+)-(\d+)/.exec(t.dataset.s || ''); if (m && +m[1] === L.vi && +m[2] >= +r.dataset.k0 && +m[2] <= +r.dataset.k1) { ly = +t.getAttribute('y'); break; } }
    if (ly === null) ly = +r.dataset.top + 6.6;
    const bb = g.getBBox(), ctm = par.getScreenCTM ? par.getScreenCTM() : null; if (!ctm) return;
    const q = (x, y) => new DOMPoint(x, y).matrixTransform(ctm);
    const c = q(bb.x + bb.width / 2, ly - 0.55), unit = q(0, 1).y - q(0, 0).y;
    const wr = wrapEl.getBoundingClientRect();
    const fs = Math.max(13, Math.min(26, unit * 1.7 * 0.95));
    inp.style.fontSize = fs + 'px'; inp.style.height = Math.round(fs * 1.75) + 'px';
    const w = Math.max(64, Math.min(260, (inp.value.length + 2) * fs * 0.58 + 18, own ? own.getBoundingClientRect().width + 40 : 999));
    inp.style.width = w + 'px';
    inp.style.left = Math.max(2, c.x - wr.left - w / 2) + 'px';
    inp.style.top = (c.y - wr.top - inp.offsetHeight / 2) + 'px';
  }
  function go(vi, ei){
    const v = piece.voices[vi];
    L.vi = vi; L.ei = ei;
    ed.range = null; ed.picks = null; ed.sel = {vi, ei}; ed.ins = {vi, ei: ei + 1};
    showSel(true);
    L.inp.value = shown(cur(v.events[ei]));
    L.orig = L.inp.value;
    place(); setTimeout(place, 60); setTimeout(place, 420);
    L.inp.focus({preventScroll: true}); L.inp.select();
  }
  /* write what the field holds into the note (one undo step); false when nothing changed */
  function save(){
    if (!L.inp || !piece) return false;
    const v = piece.voices[L.vi]; if (!v || !v.events[L.ei]) return false;
    const val = L.inp.value;
    if (val === L.orig) return false;
    const vi = L.vi, ei = L.ei, verse = L.verse;
    L.busy = true;
    commit(() => { const w = piece.voices[vi]; setSyl(w, ei, val, verse); relink(w, verse); trimVerses(); });
    L.busy = false; L.orig = val;
    return true;
  }
  function step(dir, opts = {}){
    const v = piece.voices[L.vi];
    let n = nextNote(v, L.ei, dir);
    if (opts.skip && n >= 0) {
      /* a melisma: the note after this one keeps no syllable */
      const vi = L.vi, at = n;
      if (cur(v.events[at])) { L.busy = true; commit(() => { const w = piece.voices[vi]; setSyl(w, at, '', L.verse); relink(w, L.verse); trimVerses(); }); L.busy = false; }
      n = nextNote(piece.voices[vi], at, 1);
    }
    if (n < 0) { if (dir > 0) { toast('That was the last note of the voice.'); } return; }
    go(L.vi, n);
  }
  function close(keep){
    const inp = L.inp; if (!inp) return;
    if (keep) save();
    L.inp = null; inp.remove();
    viewerEl.removeEventListener('scroll', place); window.removeEventListener('resize', place);
    showSel();
  }
  /* a whole text pasted: a syllable on each note from here on */
  function fill(text){
    const toks = [];
    for (const w of text.replace(/[‐‑]/g, '-').split(/\s+/).filter(Boolean)) {
      if (/^_+$/.test(w)) { for (let i = 0; i < w.length; i++) toks.push(null); continue; }
      const parts = w.split('-').filter(p => p !== '');
      parts.forEach((p, i) => {
        const m = /^(.*?)(_*)$/.exec(p);
        toks.push((m[1] || p) + (i < parts.length - 1 ? '-' : ''));
        for (let j = 0; j < m[2].length && m[1]; j++) toks.push(null);
      });
    }
    if (!toks.length) return;
    const vi = L.vi, verse = L.verse;
    let ei = L.ei, last = ei, used = 0;
    L.busy = true;
    commit(() => {
      const w = piece.voices[vi];
      for (const t of toks) {
        if (ei < 0) break;
        setSyl(w, ei, t === null ? '' : t, verse); last = ei; used++;
        ei = nextNote(w, ei, 1);
      }
      relink(w, verse); trimVerses();
    });
    L.busy = false;
    const n = nextNote(piece.voices[vi], last, 1);
    if (used < toks.length) toast((toks.length - used) + ' syllable' + (toks.length - used > 1 ? 's' : '') + ' left over: the voice has no more notes.');
    go(vi, n >= 0 ? n : last);
  }
  function open(vi, ei, verse){
    if (!piece) return;
    const v = piece.voices[vi]; if (!v || !okVoice(v)) return;
    if (!sylNote(v.events[ei])) { const n = nextNote(v, ei, 1); if (n < 0) { toast('No note to put words under here.'); return; } ei = n; }
    if (L.inp) close(true);
    closePops();
    L.verse = verse === undefined ? verseOf() : verse;
    if (L.verse !== (st.verse || 0)) { st.verse = L.verse; render(); }
    const inp = document.createElement('input');
    inp.className = 'vrename lyrin'; inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('aria-label', 'Syllable under the note');
    wrapEl.appendChild(inp);
    L.inp = inp;
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      const k = e.key, mod = e.ctrlKey || e.metaKey, atStart = inp.selectionStart === 0 && inp.selectionEnd === 0, atEnd = inp.selectionStart === inp.value.length;
      if (mod && (k === 'z' || k === 'Z' || k === 'y' || k === 'Y')) { e.preventDefault(); const vi = L.vi, ei = L.ei; save(); close(false); (k === 'z' || k === 'Z') && !e.shiftKey ? undo() : redo(); open(vi, ei); return; }
      if (k === 'Enter' || k === 'Escape') { e.preventDefault(); close(k === 'Enter'); return; }
      if ((k === ' ' && !e.shiftKey) || (k === 'Tab' && !e.shiftKey)) { e.preventDefault(); save(); step(1); return; }
      if ((k === 'Tab' || k === ' ') && e.shiftKey) { e.preventDefault(); save(); step(-1); return; }
      if (k === '-' && !mod) { e.preventDefault(); const t = inp.value.replace(/-+$/, ''); if (!t) return; inp.value = t + '-'; save(); step(1); return; }
      if (k === '_' && !mod) { e.preventDefault(); save(); step(1, {skip: true}); return; }
      if (k === 'ArrowRight' && atEnd && !e.shiftKey) { e.preventDefault(); save(); step(1); return; }
      if (k === 'ArrowLeft' && atStart && !e.shiftKey) { e.preventDefault(); save(); step(-1); return; }
      if (k === 'Backspace' && !inp.value) {
        e.preventDefault();
        const had = L.orig; inp.value = ''; if (had) save();
        step(-1); return;
      }
    });
    inp.addEventListener('input', place);
    inp.addEventListener('paste', e => {
      const t = (e.clipboardData || window.clipboardData).getData('text');
      if (!t || !/[\s-]/.test(t.trim())) return;      /* one plain syllable: pasted into the field as usual */
      e.preventDefault();
      fill(inp.value.slice(0, inp.selectionStart) + t + inp.value.slice(inp.selectionEnd));
    });
    inp.addEventListener('blur', () => setTimeout(() => { if (L.inp === inp && document.activeElement !== inp && !L.busy) close(true); }, 0));
    viewerEl.addEventListener('scroll', place, {passive: true}); window.addEventListener('resize', place);
    go(vi, ei);
  }
  /* where Add > Lyrics starts: the selected note (the first of a selection), else the note at the caret */
  function startAt(){
    if (!piece) return null;
    if (ed.range || ed.picks) {
      const it = selItems().filter(x => !x.e.rest).sort((a, b) => a.v.idx - b.v.idx || a.e.t - b.e.t);
      if (it.length) return {vi: it[0].v.idx, ei: it[0].v.events.indexOf(it[0].e)};
    }
    if (ed.sel) return {vi: ed.sel.vi, ei: ed.sel.ei};
    if (ed.ins) {
      const v = piece.voices[ed.ins.vi]; if (!v) return null;
      const t = targetSym();
      if (t && !t.rest) return {vi: v.idx, ei: t.src[0]};
      return {vi: v.idx, ei: Math.max(0, Math.min(ed.ins.ei, v.events.length - 1))};
    }
    const vs = visibleVoices(); return vs.length ? {vi: vs[0].idx, ei: 0} : null;
  }
  $('#addLyr').addEventListener('click', () => { const p = startAt(); if (!p) { toast('Select a note first.'); return; } open(p.vi, p.ei); });
  $('#addVerse').addEventListener('click', () => {
    if (!piece) return;
    const p = startAt(); if (!p) { toast('Select a note first.'); return; }
    const v = piece.voices[p.vi];
    const n = Math.max(1, v.verses || 0);
    /* a new verse begins where the first one does in this voice, unless a note was chosen */
    let ei = p.ei;
    if (!ed.sel && !ed.range && !ed.picks) { const f = v.events.findIndex(e => sylNote(e) && e.syl && e.syl[0] && e.syl[0] !== '.'); if (f >= 0) ei = f; }
    open(p.vi, ei, n);
    if (L.inp) toast('Verse ' + (n + 1) + '. Engraving > Verse shows the others.');
  });
  /* lyrics are edited in any mode: a click on a syllable, or L on a selected note, opens its field */
  /* a click on any syllable opens it. The staff below reaches up over the line of words with its writing area,
     so look under the pointer (and before the engine's own click handlers, which would write a note there) */
  function lyricAt(e){
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      if (el.matches && el.matches('#pages text.lyr')) return el;
      if (el === pagesEl) break;
    }
    for (const t of pagesEl.querySelectorAll('text.lyr')) {
      const r = t.getBoundingClientRect();
      if (e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2) return t;
    }
    return null;
  }
  const lyrHit = e => {
    if (!piece || !e.target.closest || !e.target.closest('#pages') || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return null;
    if (e.target.closest('g[class^="n"]')) return null;           /* a note itself stays a note */
    if (e.target.closest('.sechit')) return null;                /* a section line opens its own menu */
    const t = lyricAt(e); if (!t) return null;
    const m = /^n(\d+)-(\d+)/.exec(t.dataset.s || ''); if (!m) return null;
    const v = piece.voices[+m[1]], q = v && v.syms[+m[2]]; return q && q.src ? {vi: +m[1], ei: q.src[0]} : null;
  };
  /* the pointer is the text cursor over a syllable */
  pagesEl.addEventListener('pointermove', e => { const on = !!(e.target.closest && !e.target.closest('g[class^="n"]') && lyricAt(e)); pagesEl.classList.toggle('overlyr', on); }, {passive: true});
  for (const type of ['pointerdown', 'mousedown']) document.addEventListener(type, e => { if (lyrHit(e)) { e.stopImmediatePropagation(); } }, true);
  document.addEventListener('click', e => {
    const h = lyrHit(e); if (!h) return;
    e.stopImmediatePropagation(); e.preventDefault();
    open(h.vi, h.ei);
  }, true);
  /* L with one note selected (Shift+L also with only the caret); with several notes selected L stays Ligature */
  document.addEventListener('keydown', e => {
    const tg = e.target, tag = tg.tagName;
    if (!piece || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tg.isContentEditable) return;
    if ((e.key !== 'l' && e.key !== 'L') || e.ctrlKey || e.metaKey || e.altKey || ed.range || ed.picks) return;
    if (!ed.sel && !(e.shiftKey && ed.on)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const p = startAt(); if (p) open(p.vi, p.ei);
  }, true);

}]);
