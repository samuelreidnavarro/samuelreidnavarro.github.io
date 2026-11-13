/* Scriptorium add-on: Download LilyPond. The score as a .ly file, in modern notation: one staff per voice, a bar between the
   barlines (every brevis where the piece has none), notes split at the barlines with ties, values in proportion as triplets,
   the first verse as lyrics. Runs inside the engine (see scriptorium.js). */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const DIV = 96;                                     /* divisions of a quarter; a semibrevis (whole note) is 384 */
  const LEN = [[1536, '\\longa'], [768, '\\breve'], [384, '1'], [192, '2'], [96, '4'], [48, '8'], [24, '16'], [12, '32'], [6, '64']];
  const ticks = d => Math.round(d * 4 * DIV);
  /* a length in ticks as written values [{n, dots, tm}] (tied together); tm: a triplet value */
  function values(n){
    const out = [];
    const one = x => { for (const [l, t] of LEN) { if (x === l) return {n: t, dots: 0}; if (x === l * 1.5) return {n: t, dots: 1}; if (x === l * 1.75) return {n: t, dots: 2}; } return null; };
    let left = n, guard = 0;
    while (left > 0 && guard++ < 16) {
      const a = one(left); if (a) { out.push(a); break; }
      const big = LEN.find(([l]) => l <= left);
      if (big && (one(left - big[0]) || (left - big[0]) % 6 === 0)) { out.push({n: big[1], dots: 0}); left -= big[0]; continue; }
      const tr = one(left * 3 / 2);
      if (tr) { out.push(Object.assign(tr, {tm: true})); break; }
      if (big) { out.push({n: big[1], dots: 0}); left -= big[0]; continue; }
      out.push({n: '64', dots: 0}); break;
    }
    return out;
  }
  const CLEF = {G2: 'treble', Gv2: 'treble_8', G2v: 'treble_8', G1: 'french', F4: 'bass', F3: 'varbaritone', C1: 'soprano', C2: 'mezzosoprano', C3: 'alto', C4: 'tenor', C5: 'baritone'};
  const KEYS = {'-7': 'ces', '-6': 'ges', '-5': 'des', '-4': 'aes', '-3': 'ees', '-2': 'bes', '-1': 'f', 0: 'c', 1: 'g', 2: 'd', 3: 'a', 4: 'e', 5: 'b', 6: 'fis', 7: 'cis'};
  const fifthsOf = alts => Object.values(alts).filter(a => a > 0).length - Object.values(alts).filter(a => a < 0).length;
  const lq = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const ident = s => String(s).replace(/[^A-Za-z]/g, '');
  function pitch(e, alt){
    const L = 'cdefgab'[((e.step % 7) + 7) % 7], oct = Math.floor(e.step / 7) - 3;
    const acc = alt === 1 ? 'is' : alt === -1 ? 'es' : alt === 2 ? 'isis' : alt === -2 ? 'eses' : '';
    return L + acc + (oct > 0 ? "'".repeat(oct) : oct < 0 ? ','.repeat(-oct) : '');
  }
  function lilypond(P){
    let cuts = [...new Set((P.bars || []).map(b => rt(b.t)))].filter(t => t > EPS && t < P.end - EPS).sort((a, b) => a - b);
    if (!cuts.length) for (let t = 2; t < P.end - EPS; t += 2) cuts.push(rt(t));
    const bounds = [0, ...cuts, P.end];
    const staves = P.voices.map((v, vi) => {
      let notes = '', lyr = [], lastLen = null, lastMens = null, ei = 0, off = 0;
      const evs = v.events;
      const k0 = v.keys.find(m => eq(m.t, 0)), fifths = k0 ? fifthsOf(k0.alts) : 0;
      notes += `    \\clef ${CLEF[(v.clefs[0] && v.clefs[0].c) || v.kclef] || 'treble'}\n    \\key ${KEYS[Math.max(-7, Math.min(7, fifths))] || 'c'} \\major\n`;
      for (let mi = 0; mi + 1 < bounds.length; mi++) {
        const a = bounds[mi], b = bounds[mi + 1], len = ticks(b - a);
        if (len <= 0) continue;
        { const ms = metAt(v, a); if (ms && ms !== lastMens) { notes += `    % mensuration sign: ${ms}\n`; lastMens = ms; } }
        let line = '    ';
        const trip = [];
        const flush = () => { if (trip.length) line += (trip.length === 3 ? `\\tuplet 3/2 { ${trip.join(' ')} }` : trip.map(x => `\\tuplet 3/2 { ${x} }`).join(' ')) + ' '; trip.length = 0; };
        if (len !== lastLen) {
          { const [tn, td] = len % 384 === 0 ? [len / 384, 1] : len % 192 === 0 ? [len / 192, 2] : len % 96 === 0 ? [len / 96, 4] : [Math.max(1, Math.round(len / 48)), 8]; line += `\\time ${tn}/${td} `; }
          lastLen = len;
        }
        let t = a;
        while (t < b - EPS && ei < evs.length) {
          const e = evs[ei], end = Math.min(e.t + e.d, b), d = end - t;
          const tieIn = off > EPS || (!e.rest && (e.tieEnd || e.tieMid)), tieOut = end < e.t + e.d - EPS || (!e.rest && (e.tieStart || e.tieMid));
          const vals = values(ticks(d));
          vals.forEach((w, k) => {
            const dur = w.n + '.'.repeat(w.dots);
            let tok;
            if (e.rest) tok = 'r' + dur;
            else {
              const L = 'cdefgab'[((e.step % 7) + 7) % 7];
              const alt = e.alt !== null && e.alt !== undefined ? e.alt : (keyAt(v, e.t)[L] || 0);
              tok = pitch(e, alt) + (e.ed && e.alt !== null && e.alt !== undefined ? '?' : '') + dur;
              if (k < vals.length - 1 || tieOut) tok += ' ~';
              const first = !tieIn && k === 0;
              if (first) {
                const sy = e.syl && e.syl[0];
                lyr.push(sy === undefined || sy === null || sy === '' ? '_' : (sy.endsWith('-') ? lq(sy.replace(/^-|-$/g, '')) + ' --' : lq(sy.replace(/^-|-$/g, ''))));
              }
            }
            if (w.tm) { trip.push(tok); if (trip.length === 3) flush(); }
            else { flush(); line += tok + ' '; }
          });
          t = end;
          if (end >= e.t + e.d - EPS) { ei++; off = 0; } else off = end - e.t;
        }
        flush();
        if (t < b - EPS) line += 'r' + (values(ticks(b - t))[0] || {n: '1', dots: 0}).n + ' ';
        notes += line.trimEnd() + ' |\n';
      }
      notes += '    \\fine\n'.replace('\\fine', '\\bar "|."');
      const id = 'voice' + ident(String(vi + 1).replace(/\d/g, d => 'ABCDEFGHIJ'[d]));
      const hasLyr = lyr.some(x => x !== '_');
      return {id, name: v.name || 'Voice ' + (vi + 1), abbr: v.abbr || '', body: `${id} = {\n${notes}}\n` + (hasLyr ? `${id}Words = \\lyricmode {\n    ${lyr.join(' ')}\n}\n` : ''), hasLyr};
    });
    let out = `\\version "2.24.0"\n\n\\header {\n  title = ${lq(P.title || '')}\n${P.composer ? `  composer = ${lq(P.composer)}\n` : ''}  tagline = ##f\n}\n\n`;
    out += staves.map(s => s.body).join('\n');
    out += `\n\\score {\n  <<\n    \\new StaffGroup <<\n` + staves.map(s => `      \\new Staff \\with { instrumentName = ${lq(s.name)} } {\n        \\new Voice = ${lq(s.id)} \\${s.id}\n      }\n` + (s.hasLyr ? `      \\new Lyrics \\lyricsto ${lq(s.id)} \\${s.id}Words\n` : '')).join('') + `    >>\n  >>\n  \\layout {\n    \\context { \\Score \\override SpacingSpanner.base-shortest-duration = #(ly:make-moment 1/16) }\n  }\n}\n`;
    return out;
  }
  const btn = $('#lyBtn');
  if (btn) btn.addEventListener('click', () => {
    if (!piece) return;
    closePops();
    const P = parseKern(piece.text || writeKern(piece));
    const text = lilypond(P);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
    a.download = ((piece.title || '').replace(/[\\/:*?"<>|]+/g, '').trim() || APP.store) + '.ly';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  window.__ly = {lilypond, values};
}]);
