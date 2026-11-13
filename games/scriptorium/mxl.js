/* Scriptorium add-on: Download MXL. The score as compressed MusicXML (.mxl), in modern notation, for MuseScore,
   Dorico, Sibelius or Finale: one part per voice, a measure between barlines (every brevis where the piece has none),
   notes split at the barlines with ties, values in proportion written as triplets where they need it. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const DIV = 96;                              /* divisions of a quarter; a semibrevis (whole note) is 384 */
  const TYPES = [[1536, 'long'], [768, 'breve'], [384, 'whole'], [192, 'half'], [96, 'quarter'], [48, 'eighth'], [24, '16th'], [12, '32nd'], [6, '64th']];
  const xesc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const ticks = d => Math.round(d * 4 * DIV);
  /* a length in ticks as written values: [{type, dots, tm}], tied together; tm = triplet */
  function values(n){
    const out = [];
    const one = x => { for (const [l, t] of TYPES) { if (x === l) return {type: t, dots: 0}; if (x === l * 1.5) return {type: t, dots: 1}; if (x === l * 1.75) return {type: t, dots: 2}; } return null; };
    let left = n, guard = 0;
    while (left > 0 && guard++ < 16) {
      const a = one(left); if (a) { out.push(a); break; }
      const big = TYPES.find(([l]) => l <= left);
      if (big && left - big[0] >= 0 && (one(left - big[0]) || (left - big[0]) % 6 === 0)) { out.push({type: big[1], dots: 0}); left -= big[0]; continue; }
      /* a third of a value: written as a triplet */
      const tr = one(left * 3 / 2);
      if (tr) { out.push(Object.assign(tr, {tm: true})); break; }
      if (big) { out.push({type: big[1], dots: 0}); left -= big[0]; continue; }
      out.push({type: '64th', dots: 0}); break;
    }
    return out;
  }
  const CLEF_X = {G2: ['G', 2, 0], Gv2: ['G', 2, -1], G2v: ['G', 2, -1], G1: ['G', 1, 0], F4: ['F', 4, 0], F3: ['F', 3, 0], C1: ['C', 1, 0], C2: ['C', 2, 0], C3: ['C', 3, 0], C4: ['C', 4, 0], C5: ['C', 5, 0]};
  const clefXml = c => { const [s, l, o] = CLEF_X[c] || CLEF_X.G2; return `<clef><sign>${s}</sign><line>${l}</line>${o ? `<clef-octave-change>${o}</clef-octave-change>` : ''}</clef>`; };
  const fifthsOf = alts => { const fl = Object.values(alts).filter(a => a < 0).length, sh = Object.values(alts).filter(a => a > 0).length; return sh - fl; };
  function musicXml(P){
    /* measures: between the piece's barlines, else every brevis */
    let cuts = [...new Set((P.bars || []).map(b => rt(b.t)))].filter(t => t > EPS && t < P.end - EPS).sort((a, b) => a - b);
    if (!cuts.length) for (let t = 2; t < P.end - EPS; t += 2) cuts.push(rt(t));
    const bounds = [0, ...cuts, P.end];
    const parts = P.voices.map((v, pi) => {
      let x = '', lastLen = null;
      const evs = v.events;
      let ei = 0, off = 0;     /* the event and how far into it (semibreves) the measure starts */
      for (let mi = 0; mi + 1 < bounds.length; mi++) {
        const a = bounds[mi], b = bounds[mi + 1], len = ticks(b - a);
        x += `<measure number="${mi + 1}">`;
        if (mi === 0 || len !== lastLen) {
          x += '<attributes>';
          if (mi === 0) x += `<divisions>${DIV}</divisions>`;
          if (mi === 0) { const k = v.keys.find(m => eq(m.t, 0)); x += `<key><fifths>${k ? fifthsOf(k.alts) : 0}</fifths></key>`; }
          { const [tn, td] = len % 384 === 0 ? [len / 384, 1] : len % 192 === 0 ? [len / 192, 2] : len % 96 === 0 ? [len / 96, 4] : [Math.max(1, Math.round(len / 48)), 8]; x += `<time><beats>${tn}</beats><beat-type>${td}</beat-type></time>`; }
          if (mi === 0) x += clefXml((v.clefs[0] && v.clefs[0].c) || v.kclef);
          x += '</attributes>';
          lastLen = len;
        }
        let t = a;
        while (t < b - EPS && ei < evs.length) {
          const e = evs[ei], end = Math.min(e.t + e.d, b), d = end - t;
          const tieIn = off > EPS || (!e.rest && (e.tieEnd || e.tieMid)), tieOut = end < e.t + e.d - EPS || (!e.rest && (e.tieStart || e.tieMid));
          const vals = values(ticks(d));
          vals.forEach((w, k) => {
            const dur = ticks(d) === 0 ? 0 : Math.round((w.tm ? 2 / 3 : 1) * TYPES.find(q => q[1] === w.type)[0] * (w.dots === 1 ? 1.5 : w.dots === 2 ? 1.75 : 1));
            const ti = tieIn || k > 0, to = tieOut || k < vals.length - 1;
            x += '<note>';
            if (e.rest) x += '<rest/>';
            else {
              const L = 'CDEFGAB'[((e.step % 7) + 7) % 7], oct = Math.floor(e.step / 7) - 0;
              const alt = e.alt !== null && e.alt !== undefined ? e.alt : (keyAt(v, e.t)[L.toLowerCase()] || 0);
              x += `<pitch><step>${L}</step>${alt ? `<alter>${alt}</alter>` : ''}<octave>${oct}</octave></pitch>`;
            }
            x += `<duration>${dur}</duration>`;
            if (!e.rest) { if (ti) x += '<tie type="stop"/>'; if (to) x += '<tie type="start"/>'; }
            x += `<voice>1</voice><type>${w.type}</type>` + '<dot/>'.repeat(w.dots);
            if (w.tm) x += '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>';
            if (!e.rest && e.alt !== null && e.alt !== undefined && !ti) x += `<accidental${e.ed ? ' editorial="yes" parentheses="yes"' : ''}>${e.alt < 0 ? 'flat' : e.alt > 0 ? 'sharp' : 'natural'}</accidental>`;
            if (!e.rest && (ti || to)) x += `<notations>${ti ? '<tied type="stop"/>' : ''}${to ? '<tied type="start"/>' : ''}</notations>`;
            if (!e.rest && !ti && off < EPS && e.syl && e.syl.length) e.syl.forEach((sy, n) => {
              if (sy === undefined || sy === null || sy === '') return;
              const begin = sy.endsWith('-'), cont = sy.startsWith('-');
              const kind = begin && cont ? 'middle' : begin ? 'begin' : cont ? 'end' : 'single';
              x += `<lyric number="${n + 1}"><syllabic>${kind}</syllabic><text>${xesc(sy.replace(/^-|-$/g, ''))}</text></lyric>`;
            });
            x += '</note>';
          });
          t = end;
          if (end >= e.t + e.d - EPS) { ei++; off = 0; } else off = end - e.t;
        }
        if (t < b - EPS) x += `<note><rest/><duration>${ticks(b - t)}</duration><voice>1</voice></note>`;
        if (mi + 2 === bounds.length) x += '<barline location="right"><bar-style>light-heavy</bar-style></barline>';
        x += '</measure>';
      }
      return `<part id="P${pi + 1}">${x}</part>`;
    });
    const list = P.voices.map((v, pi) => `<score-part id="P${pi + 1}"><part-name>${xesc(v.name)}</part-name></score-part>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${xesc(P.title || '')}</work-title></work>` +
      `<identification>${P.composer ? `<creator type="composer">${xesc(P.composer)}</creator>` : ''}<encoding><software>${xesc(APP.name)} (Scriptorium)</software></encoding></identification>` +
      `<part-list>${list}</part-list>${parts.join('')}</score-partwise>`;
  }
  /* a zip of stored (uncompressed) files, enough for .mxl */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files){
    const enc = new TextEncoder(), chunks = [], central = [];
    let off = 0;
    for (const [name, text] of files) {
      const nm = enc.encode(name), data = enc.encode(text), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true);
      chunks.push(new Uint8Array(h.buffer), nm, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + data.length;
    }
    const size = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...chunks, ...central, new Uint8Array(e.buffer)], {type: 'application/vnd.recordare.musicxml'});
  }
  $('#mxlBtn').addEventListener('click', () => {
    if (!piece) return;
    closePops();
    const P = parseKern(piece.text || writeKern(piece));
    const xml = musicXml(P);
    const blob = zip([['META-INF/container.xml', '<?xml version="1.0" encoding="UTF-8"?><container><rootfiles><rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>'], ['score.musicxml', xml]]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ((piece.title || '').replace(/[\\/:*?"<>|]+/g, '').trim() || APP.store) + '.mxl';
    document.body.appendChild(a); a.click(); a.remove();
  });
  window.__mxl = {musicXml, values, zip};
}]);
