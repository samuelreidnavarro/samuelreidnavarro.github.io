/* Scriptorium add-on: Download MIDI (.mid), Download MuseScore (.mscz) and Download GABC (.gabc, one voice). Both are written from the same parsed piece as the
   MusicXML and LilyPond exports (one part per voice, modern notation). Runs inside the engine (see scriptorium.js). */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const DIV = 96;                                      /* a quarter; a semibrevis (whole note) is 384 */
  const ticks = d => Math.round(d * 4 * DIV);
  const PC = [0, 2, 4, 5, 7, 9, 11];
  const fifthsOf = alts => Object.values(alts).filter(a => a > 0).length - Object.values(alts).filter(a => a < 0).length;
  const xesc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const tsig = len => len % 384 === 0 ? [len / 384, 1] : len % 192 === 0 ? [len / 192, 2] : len % 96 === 0 ? [len / 96, 4] : [Math.max(1, Math.round(len / 48)), 8];
  const altOf = (v, e) => {
    const L = 'cdefgab'[((e.step % 7) + 7) % 7];
    return e.alt !== null && e.alt !== undefined ? e.alt : (keyAt(v, e.t)[L] || 0);
  };
  const midiOf = (v, e) => 12 * (Math.floor(e.step / 7) + 1) + PC[((e.step % 7) + 7) % 7] + altOf(v, e);
  const base = () => (piece.title || '').replace(/[\\/:*?"<>|]+/g, '').trim() || APP.store;
  const save = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const bounds = P => {
    let cuts = [...new Set((P.bars || []).map(b => rt(b.t)))].filter(t => t > EPS && t < P.end - EPS).sort((a, b) => a - b);
    if (!cuts.length) for (let t = 2; t < P.end - EPS; t += 2) cuts.push(rt(t));
    return [0, ...cuts, P.end];
  };

  /* ---------------- MIDI ---------------- */
  const PPQ = 480;
  const vlq = n => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
  const bytes = s => [...new TextEncoder().encode(s)];
  const meta = (type, data) => [0xFF, type, ...vlq(data.length), ...data];
  const track = evs => {                      /* evs: [tick, order, bytes[]] */
    evs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let out = [], last = 0;
    for (const [t, , b] of evs) { out.push(...vlq(t - last), ...b); last = t; }
    out.push(0, 0xFF, 0x2F, 0);
    const n = out.length;
    return [0x4D, 0x54, 0x72, 0x6B, n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255, ...out];
  };
  function midi(P){
    const tk = d => Math.round(d * 4 * PPQ);
    const [bn, bd] = tsig(ticks(bounds(P)[1] - bounds(P)[0]));
    const k0 = P.voices[0] && P.voices[0].keys.find(m => eq(m.t, 0));
    const f0 = Math.max(-7, Math.min(7, k0 ? fifthsOf(k0.alts) : 0));
    const head = [[0, 0, meta(0x03, bytes(P.title || 'Score'))], [0, 1, meta(0x51, [0x07, 0xA1, 0x20])],
      [0, 1, meta(0x58, [bn, Math.log2(bd), 24, 8])], [0, 1, meta(0x59, [f0 & 255, 0])]];
    const tracks = [track(head)];
    P.voices.forEach((v, i) => {
      const ch = i % 15 < 9 ? i % 15 : i % 15 + 1;
      const evs = [[0, 0, meta(0x03, bytes(v.name || 'Voice ' + (i + 1)))], [0, 1, [0xC0 | ch, 52]]];
      const notes = [];
      let prev = null;
      for (const e of v.events) {
        if (e.rest) { prev = null; continue; }
        const m = midiOf(v, e);
        if (prev && prev.out && prev.midi === m && (e.tieEnd || e.tieMid)) { prev.end = e.t + e.d; prev.out = !!(e.tieStart || e.tieMid); continue; }
        prev = {t: e.t, end: e.t + e.d, midi: m, out: !!(e.tieStart || e.tieMid), syl: e.syl && e.syl[0]};
        notes.push(prev);
      }
      for (const n of notes) {
        if (n.syl) evs.push([tk(n.t), 1, meta(0x05, bytes(String(n.syl).replace(/^-/, '')))]);
        evs.push([tk(n.t), 2, [0x90 | ch, n.midi, 80]], [tk(n.end), 0, [0x80 | ch, n.midi, 0]]);
      }
      tracks.push(track(evs));
    });
    const hd = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, PPQ >> 8, PPQ & 255];
    return new Uint8Array([...hd, ...tracks.flat()]);
  }

  /* ---------------- MuseScore ---------------- */
  const TYPES = [[1536, 'long'], [768, 'breve'], [384, 'whole'], [192, 'half'], [96, 'quarter'], [48, 'eighth'], [24, '16th'], [12, '32nd'], [6, '64th']];
  function values(n){
    const out = [];
    const one = x => { for (const [l, t] of TYPES) { if (x === l) return {type: t, dots: 0}; if (x === l * 1.5) return {type: t, dots: 1}; if (x === l * 1.75) return {type: t, dots: 2}; } return null; };
    let left = n, guard = 0;
    while (left > 0 && guard++ < 16) {
      const a = one(left); if (a) { out.push(a); break; }
      const big = TYPES.find(([l]) => l <= left);
      if (big && ((one(left - big[0])) || (left - big[0]) % 6 === 0)) { out.push({type: big[1], dots: 0}); left -= big[0]; continue; }
      const tr = one(left * 3 / 2);
      if (tr) { out.push(Object.assign(tr, {tm: true})); break; }
      if (big) { out.push({type: big[1], dots: 0}); left -= big[0]; continue; }
      out.push({type: '64th', dots: 0}); break;
    }
    return out;
  }
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const frac = n => { const g = gcd(n, 1536); return (n / g) + '/' + (1536 / g); };     /* ticks as a fraction of a whole note */
  const CLEF_MS = {G2: 'G', Gv2: 'G8vb', G2v: 'G8vb', G1: 'G1', F4: 'F', F3: 'F3', C1: 'C1', C2: 'C2', C3: 'C3', C4: 'C4', C5: 'C5'};
  const LET = 'FCGDAEB';
  function mscx(P){
    const bd = bounds(P);
    let parts = '', staves = '';
    P.voices.forEach((v, vi) => {
      const clef = CLEF_MS[(v.clefs[0] && v.clefs[0].c) || v.kclef] || 'G';
      parts += `<Part><Staff id="${vi + 1}"><StaffType group="pitched"><name>stdNormal</name></StaffType></Staff><trackName>${xesc(v.name || 'Voice ' + (vi + 1))}</trackName>` +
        `<Instrument id="voice"><longName>${xesc(v.name || '')}</longName><shortName>${xesc(v.abbr || '')}</shortName><trackName>${xesc(v.name || '')}</trackName><Channel><program value="52"/></Channel></Instrument></Part>`;
      const k0 = v.keys.find(m => eq(m.t, 0)), fifths = Math.max(-7, Math.min(7, k0 ? fifthsOf(k0.alts) : 0));
      let x = '', lastLen = null, ei = 0, off = 0, prevSpan = '1/4';
      for (let mi = 0; mi + 1 < bd.length; mi++) {
        const a = bd[mi], b = bd[mi + 1], len = ticks(b - a);
        if (len <= 0) continue;
        let m = '', trip = [];
        const flush = () => {
          if (!trip.length) return;
          const grp = trip.length === 3 ? [trip] : trip.map(q => [q]);
          for (const g of grp) m += `<Tuplet><normalNotes>2</normalNotes><actualNotes>3</actualNotes><baseNote>${g[0].type}</baseNote><Number><style>Tuplet</style><text>3</text></Number></Tuplet>` + g.map(q => q.xml).join('') + '<endTuplet/>';
          trip = [];
        };
        if (mi === 0) m += `<Clef><concertClefType>${clef}</concertClefType><transposingClefType>${clef}</transposingClefType></Clef><KeySig><concertKey>${fifths}</concertKey></KeySig>`;
        if (len !== lastLen) { const [n, d] = tsig(len); m += `<TimeSig><sigN>${n}</sigN><sigD>${d}</sigD></TimeSig>`; lastLen = len; }
        let t = a;
        while (t < b - EPS && ei < v.events.length) {
          const e = v.events[ei], end = Math.min(e.t + e.d, b), d = end - t;
          const tieIn = off > EPS || (!e.rest && (e.tieEnd || e.tieMid)), tieOut = end < e.t + e.d - EPS || (!e.rest && (e.tieStart || e.tieMid));
          const vals = values(ticks(d));
          vals.forEach((w, k) => {
            const dots = w.dots ? `<dots>${w.dots}</dots>` : '';
            const span = frac(Math.round(TYPES.find(q => q[1] === w.type)[0] * (w.dots === 1 ? 1.5 : w.dots === 2 ? 1.75 : 1) * (w.tm ? 2 / 3 : 1)));
            let xml;
            if (e.rest) xml = `<Rest>${dots}<durationType>${w.type}</durationType></Rest>`;
            else {
              const alt = altOf(v, e), li = ((e.step % 7) + 7) % 7, letter = 'CDEFGAB'[li];
              const tpc = LET.indexOf(letter) + 7 * (alt + 2) - 1;
              const ti = tieIn || k > 0, to = tieOut || k < vals.length - 1;
              let note = '';
              if (to) note += `<Spanner type="Tie"><Tie/><next><location><fractions>${span}</fractions></location></next></Spanner>`;
              if (ti) note += `<Spanner type="Tie"><prev><location><fractions>-${prevSpan}</fractions></location></prev></Spanner>`;
              note += `<pitch>${midiOf(v, e)}</pitch><tpc>${tpc}</tpc>`;
              let lyr = '';
              const sy = e.syl && e.syl[0];
              if (!ti && sy) {
                const begin = sy.endsWith('-'), cont = sy.startsWith('-');
                lyr = `<Lyrics><syllabic>${begin && cont ? 'middle' : begin ? 'begin' : cont ? 'end' : 'single'}</syllabic><text>${xesc(sy.replace(/^-|-$/g, ''))}</text></Lyrics>`;
              }
              xml = `<Chord>${dots}<durationType>${w.type}</durationType>${lyr}<Note>${note}</Note></Chord>`;
            }
            prevSpan = span;
            if (w.tm) { trip.push({type: w.type, xml}); if (trip.length === 3) flush(); }
            else { flush(); m += xml; }
          });
          t = end;
          if (end >= e.t + e.d - EPS) { ei++; off = 0; } else off = end - e.t;
        }
        flush();
        if (t < b - EPS) m += `<Rest><durationType>measure</durationType><duration>${frac(ticks(b - t))}</duration></Rest>`;
        if (mi + 2 === bd.length) m += '<BarLine><subtype>end</subtype></BarLine>';
        x += `<Measure><voice>${m}</voice></Measure>`;
      }
      staves += `<Staff id="${vi + 1}">${x}</Staff>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<museScore version="4.20"><programVersion>4.2.0</programVersion><Score><Division>${PPQ}</Division><Style/>` +
      `<metaTag name="workTitle">${xesc(P.title || '')}</metaTag><metaTag name="composer">${xesc(P.composer || '')}</metaTag>` + parts + staves + '</Score></museScore>';
  }

  /* ---------------- GABC (Gregorio) ----------------
     One voice (the one being edited, else the top one): the notes as letters on a clef chosen to fit them, the
     syllables before their notes, notes without a syllable joined to the neume before; a note longer than most gets
     a dot (mora); rests become a half bar, the end a double bar. */
  function gabc(P, vi){
    const v = P.voices[vi] || P.voices[0];
    const notes = v.events.filter(e => !e.rest);
    if (!notes.length) return null;
    const lo = Math.min(...notes.map(e => e.step)), hi = Math.max(...notes.map(e => e.step));
    let best = null;
    for (const [c, line] of [['c', 4], ['c', 3], ['f', 3], ['c', 2], ['f', 4], ['c', 1], ['f', 2]]) {
      const L0 = 3 + 2 * (line - 1), base = c === 'c' ? 28 : 24;
      for (const oct of [0, 7, -7, 14, -14]) {
        const a = lo - base - oct + L0, b = hi - base - oct + L0;
        if (a < 0 || b > 12) continue;
        const cost = Math.abs((a + b) / 2 - 6.5) + (oct ? 0.5 : 0);
        if (!best || cost < best.cost) best = {c, line, L0, base: base + oct, cost};
      }
    }
    if (!best) best = {c: 'c', line: 4, L0: 9, base: 28 + 7 * Math.round((((lo + hi) / 2) - 31.5) / 7)};
    const letter = s => String.fromCharCode(97 + Math.max(0, Math.min(12, s - best.base + best.L0)));
    const durs = notes.map(e => e.d).sort((a, b) => a - b), typical = durs[Math.floor(durs.length / 2)];
    let out = `name: ${(P.title || 'Chant').replace(/;/g, ',')};\n` + (P.composer ? `author: ${P.composer.replace(/;/g, ',')};\n` : '') + '%%\n' + `(${best.c}${best.line}) `;
    let cur = null, said = {};
    const close = () => { if (cur) { out += cur.text + '(' + cur.notes + ') '; cur = null; } };
    v.events.forEach((e, i) => {
      if (e.rest) { close(); out += '(;) '; said = {}; return; }
      if (e.tieEnd || e.tieMid) return;                      /* counted with the note it is tied from */
      const sy = e.syl && e.syl[0];
      const L = letter(e.step);
      const alt = e.alt !== null && e.alt !== undefined ? e.alt : (keyAt(v, e.t)['cdefgab'[((e.step % 7) + 7) % 7]] || 0);
      let tok = '';
      if ((said[L] || 0) !== alt) { tok += L + (alt < 0 ? 'x' : alt > 0 ? '#' : 'y'); said[L] = alt; }
      let total = e.d, j = i;
      while ((v.events[j].tieStart || v.events[j].tieMid) && v.events[j + 1]) { j++; total += v.events[j].d; }
      tok += L + (total > typical + EPS ? '.' : '');
      if (sy || !cur) {
        close();
        const word = sy ? sy.replace(/^-|-$/g, '') : '';
        const startsWord = !sy || !sy.startsWith('-');
        if (startsWord) said = {};
        out = out.replace(/ $/, startsWord ? ' ' : '');
        cur = {text: word.replace(/[()]/g, ''), notes: tok};
      } else cur.notes += tok;
    });
    close();
    return out + '(::)\n';
  }

  $('#midBtn').addEventListener('click', () => {
    if (!piece) return;
    closePops();
    save(new Blob([midi(parseKern(piece.text || writeKern(piece)))], {type: 'audio/midi'}), base() + '.mid');
  });
  $('#mscBtn').addEventListener('click', () => {
    if (!piece) return;
    closePops();
    const xml = mscx(parseKern(piece.text || writeKern(piece))), nm = base() + '.mscx';
    const z = window.__mxl.zip([['META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?><container><rootfiles><rootfile full-path="${xesc(nm)}"/></rootfiles></container>`], [nm, xml]]);
    save(new Blob([z], {type: 'application/x-musescore'}), base() + '.mscz');
  });
  $('#gabcBtn').addEventListener('click', () => {
    if (!piece) return;
    closePops();
    const vi = ed.sel ? ed.sel.vi : ed.ins ? ed.ins.vi : 0;
    const txt = gabc(parseKern(piece.text || writeKern(piece)), vi);
    if (!txt) { toast('There are no notes to write as GABC.'); return; }
    save(new Blob([txt], {type: 'text/plain;charset=utf-8'}), base() + '.gabc');
    if (piece.voices.length > 1) toast('GABC holds one voice: ' + (piece.voices[vi] || piece.voices[0]).name + '.');
  });
  window.__export2 = {midi, mscx, tsig, gabc};
}]);
