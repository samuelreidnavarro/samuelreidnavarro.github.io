/* Reading scores from other programs: MusicXML (.musicxml, .xml, .mxl), MuseScore (.mscz, .mscx), MIDI (.mid), LilyPond (.ly) and GABC (.gabc).
   Each is read into a plain list of voices and written out as **kern, which the app already reads.
   ScoreImport.toKern(file) -> Promise<string>; ScoreImport.accepts(name) -> true for the types read here.
   One line per voice: of chords only the first note, of several voices on one staff only the first. */
(function () {
  const W = 20160;                 /* ticks in a whole note: halves to 64ths, triplets, quintuplets and septuplets come out whole */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const LET = 'CDEFGAB';

  /* ---------------- zip (.mxl, .mscz) ---------------- */
  async function unzip(buf){
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let e = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('This file is not a readable zip archive.');
    const n = dv.getUint16(e + 10, true);
    let p = dv.getUint32(e + 16, true);
    const files = new Map(), dec = new TextDecoder();
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      files.set(name, async () => {
        const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
        const data = u8.slice(start, start + size);
        if (method === 0) return data.buffer;
        if (method !== 8) throw new Error('Unsupported compression in ' + name);
        if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed files; please update it.');
        return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
      });
      p += 46 + nl + xl + cl;
    }
    return files;
  }
  function decodeText(buf){
    const b = new Uint8Array(buf);
    if (b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
    if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
    return new TextDecoder().decode(buf);
  }
  function xmlDoc(text){
    const d = new DOMParser().parseFromString(text, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) throw new Error('This file could not be read as XML.');
    return d;
  }
  const kids = (el, tag) => el ? [...el.children].filter(c => !tag || c.tagName === tag) : [];
  const kid = (el, tag) => kids(el, tag)[0] || null;
  const txt = (el, tag) => { const c = tag ? kid(el, tag) : el; return c ? c.textContent.trim() : ''; };

  /* ---------------- shared helpers ---------------- */
  function meterSign(num, den, sym){
    if (sym === 'common') return 'C';
    if (sym === 'cut') return 'C|';
    if (num % 3 === 0 && num !== 3 * den / 2 && den <= 2) return 'O';
    if (num % 3 === 0) return den <= 2 ? 'O' : 'C.';
    if (den <= 2) return 'C|';
    return 'C';
  }
  function guessClef(evs){
    const ps = evs.filter(e => !e.rest).map(e => e.step);
    if (!ps.length) return 'G2';
    const avg = ps.reduce((a, b) => a + b, 0) / ps.length;   /* steps: 28 = middle C */
    return avg >= 33 ? 'G2' : avg >= 27 ? 'Gv2' : 'F4';
  }
  /* the voices that share one staff or instrument: "Soprano/Alto" gives Soprano and Alto, otherwise numbers */
  function voiceNames(base, n){
    if (n === 1) return [base];
    const parts = base.split(/\s*[\/&]\s*|\s+and\s+/).filter(Boolean);
    return parts.length === n ? parts : Array.from({length: n}, (_, i) => (base ? base + ' ' : 'Voice ') + (i + 1));
  }
  /* a voice's events in time order, gaps filled with rests and overlaps cut */
  function tidy(evs){
    evs.sort((a, b) => a.t - b.t);
    const out = [];
    let t = 0;
    for (const e of evs) {
      if (e.t < t) { if (e.t + e.d <= t) continue; e.d -= t - e.t; e.t = t; }
      if (e.t > t) out.push({t, d: e.t - t, rest: true});
      out.push(e); t = e.t + e.d;
    }
    return out;
  }

  /* ---------------- MusicXML ---------------- */
  function fromMusicXML(text){
    const doc = xmlDoc(text), root = doc.documentElement;
    if (root.tagName === 'score-timewise') throw new Error('Timewise MusicXML is not supported; please export it as partwise MusicXML.');
    if (root.tagName !== 'score-partwise') throw new Error('This is not a MusicXML score.');
    const names = new Map();
    for (const sp of root.querySelectorAll('part-list > score-part')) names.set(sp.getAttribute('id'), txt(sp, 'part-name') || txt(sp, 'part-abbreviation'));
    const title = txt(kid(root, 'work'), 'work-title') || txt(root, 'movement-title') || [...root.querySelectorAll('credit')].filter(c => txt(c, 'credit-type') === 'title').map(c => txt(c, 'credit-words'))[0] || '';
    const composer = [...root.querySelectorAll('identification > creator')].filter(c => c.getAttribute('type') === 'composer').map(c => txt(c))[0] || '';
    const voices = [];
    let bars = null;
    for (const part of kids(root, 'part')) {
      let div = 1, pos = 0, key = null;
      const by = new Map(), clefs = {}, mets = [], starts = [];
      for (const m of kids(part, 'measure')) {
        const m0 = pos;
        let max = pos;
        starts.push(m0);
        for (const el of m.children) {
          const tag = el.tagName;
          if (tag === 'attributes') {
            if (kid(el, 'divisions')) div = +txt(el, 'divisions') || div;
            const k = kid(el, 'key');
            if (k && key === null && kid(k, 'fifths')) key = +txt(k, 'fifths');
            for (const ti of kids(el, 'time')) if (kid(ti, 'beats')) mets.push({t: pos, sign: meterSign(+txt(ti, 'beats').split('+')[0] || 4, +txt(ti, 'beat-type') || 4, ti.getAttribute('symbol'))});
            for (const c of kids(el, 'clef')) {
              const sn = c.getAttribute('number') || '1';
              if (sn in clefs) continue;
              const sign = txt(c, 'sign'), line = txt(c, 'line'), oct = +txt(c, 'clef-octave-change') || 0;
              clefs[sn] = sign === 'G' ? (oct < 0 ? 'Gv2' : 'G2') : sign === 'F' ? 'F' + (line || 4) : sign === 'C' ? 'C' + (line || 3) : null;
            }
          } else if (tag === 'backup') pos -= Math.round(+txt(el, 'duration') * W / (4 * div));
          else if (tag === 'forward') { pos += Math.round(+txt(el, 'duration') * W / (4 * div)); max = Math.max(max, pos); }
          else if (tag === 'note') {
            if (kid(el, 'grace') || kid(el, 'cue')) continue;
            const d = Math.round(+txt(el, 'duration') * W / (4 * div));
            const chord = !!kid(el, 'chord');
            const voice = txt(el, 'voice') || '1', staff = txt(el, 'staff') || '1';
            if (!chord) {
              if (d > 0) {
                const e = {t: pos, d};
                const p = kid(el, 'pitch');
                if (kid(el, 'rest') || !p) e.rest = true;
                else {
                  e.step = 7 * (+txt(p, 'octave')) + LET.indexOf(txt(p, 'step').toUpperCase());
                  e.alt = Math.round(+txt(p, 'alter') || 0);
                  const ties = kids(el, 'tie').map(x => x.getAttribute('type'));
                  e.tieStart = ties.includes('start'); e.tieStop = ties.includes('stop');
                  const ly = kids(el, 'lyric').find(l => !l.getAttribute('number') || l.getAttribute('number') === '1') || kid(el, 'lyric');
                  if (ly) {
                    const word = kids(ly, 'text').map(x => x.textContent).join('');
                    const syl = txt(ly, 'syllabic') || 'single';
                    if (word) e.syl = (syl === 'middle' || syl === 'end' ? '-' : '') + word + (syl === 'begin' || syl === 'middle' ? '-' : '');
                  }
                }
                const vk = staff + ':' + voice;
                if (!by.has(vk)) by.set(vk, {staff, evs: []});
                by.get(vk).evs.push(e);
              }
              pos += d; max = Math.max(max, pos);
            }
          }
        }
        pos = Math.max(max, m0);
      }
      /* every voice of every staff of the instrument, with notes in it */
      const list = [...by.values()].filter(x => x.evs.some(e => !e.rest));
      if (!list.length) continue;
      if (!bars) bars = starts.filter(t => t > 0);
      const nm = voiceNames(names.get(part.getAttribute('id')) || '', list.length);
      list.forEach((x, i) => voices.push({name: nm[i], clef: clefs[x.staff] || null, key: key || 0, mets, events: tidy(x.evs)}));
    }
    return {title, composer, voices, bars: bars || []};
  }

  /* ---------------- MuseScore (.mscx inside .mscz) ---------------- */
  const MS_DUR = {long: 4, breve: 2, whole: 1, half: 1 / 2, quarter: 1 / 4, eighth: 1 / 8, '16th': 1 / 16, '32nd': 1 / 32, '64th': 1 / 64, '128th': 1 / 128};
  const frac = s => { const m = /^(\d+)\/(\d+)$/.exec(s || ''); return m ? Math.round(+m[1] * W / +m[2]) : 0; };
  function fromMuseScore(text){
    const doc = xmlDoc(text), score = kid(doc.documentElement, 'Score');
    if (!score) throw new Error('This is not a MuseScore file.');
    const meta = {};
    for (const t of kids(score, 'metaTag')) meta[t.getAttribute('name')] = t.textContent.trim();
    /* the staves of each instrument, with its name */
    const staffName = new Map(), staffClef = new Map();
    const MS_CLEF = {G: 'G2', G8vb: 'Gv2', 'G8va': 'G2', F: 'F4', F3: 'F3', C1: 'C1', C2: 'C2', C3: 'C3', C4: 'C4', C5: 'C5', F8vb: 'F4'};
    for (const part of kids(score, 'Part')) {
      const ids = kids(part, 'Staff').map(s => s.getAttribute('id'));
      /* the instrument's clefs: Staff/defaultClef, Instrument/clef (staff="n"), else treble */
      const inst = kid(part, 'Instrument');
      kids(part, 'Staff').forEach((sf, i) => {
        const ic = kids(inst, 'clef').find(c => (+c.getAttribute('staff') || 1) === i + 1);
        staffClef.set(sf.getAttribute('id'), MS_CLEF[txt(sf, 'defaultClef') || (ic ? txt(ic) : '') || 'G'] || 'G2');
      });
      const name = txt(part, 'trackName') || txt(kid(part, 'Instrument'), 'longName') || '';
      ids.forEach((id, i) => staffName.set(id, ids.length > 1 ? name + ' ' + (i + 1) : name));
    }
    let title = meta.workTitle || '', composer = meta.composer || '';
    if (!title) for (const t of score.querySelectorAll('VBox > Text')) if (txt(t, 'style') === 'title' || txt(t, 'style') === 'Title') { title = txt(t, 'text'); break; }
    if (!composer) for (const t of score.querySelectorAll('VBox > Text')) if (/composer/i.test(txt(t, 'style'))) { composer = txt(t, 'text'); break; }
    title = title.replace(/<[^>]+>/g, ''); composer = composer.replace(/<[^>]+>/g, '');
    const voices = [];
    let bars = null;
    for (const staff of kids(score, 'Staff')) {
      const measures = kids(staff, 'Measure');
      if (!measures.length) continue;
      let pos = 0, mlen = W, clef = null, key = null;
      const by = [], mets = [], starts = [];
      for (const m of measures) {
        const m0 = pos;
        starts.push(m0);
        const vlist = kids(m, 'voice').length ? kids(m, 'voice') : [m];
        let len = m.getAttribute('len') ? frac(m.getAttribute('len')) : 0, reach = 0;
        vlist.forEach((v1, vi) => {
        const evs = by[vi] || (by[vi] = []);
        let t = pos, tup = 1;
        const tupStack = [];
        for (const el of v1.children) {
          const tag = el.tagName;
          if (tag === 'TimeSig') {
            const n = +txt(el, 'sigN') || 4, d = +txt(el, 'sigD') || 4;
            mlen = Math.round(n * W / d); mets.push({t, sign: meterSign(n, d, txt(el, 'subtype') === '1' ? 'common' : txt(el, 'subtype') === '2' ? 'cut' : null)});
          } else if (tag === 'KeySig' && key === null && !vi) key = +(txt(el, 'concertKey') || txt(el, 'accidental') || 0);
          else if (tag === 'Clef' && clef === null && !evs.length && !vi) {
            const c = txt(el, 'concertClefType') || txt(el, 'subtype');
            clef = MS_CLEF[c] || null;
          } else if (tag === 'Tuplet') { tupStack.push(tup); tup *= (+txt(el, 'normalNotes') || 2) / (+txt(el, 'actualNotes') || 3); }
          else if (tag === 'endTuplet') tup = tupStack.length ? tupStack.pop() : 1;
          else if (tag === 'location') t += frac((txt(el, 'fractions') || '').replace(/^-/, '')) * (/^-/.test(txt(el, 'fractions')) ? -1 : 1);
          else if (tag === 'Chord' || tag === 'Rest') {
            if (tag === 'Chord' && kids(el).some(c => /^(grace|acciaccatura|appoggiatura)/.test(c.tagName))) continue;
            const dt = txt(el, 'durationType');
            let d;
            if (dt === 'measure') d = frac(txt(el, 'duration')) || len || mlen;
            else d = Math.round((MS_DUR[dt] || 1 / 4) * W * (2 - Math.pow(0.5, +txt(el, 'dots') || 0)) * tup);
            const e = {t, d};
            if (tag === 'Rest') e.rest = true;
            else {
              const note = kid(el, 'Note');
              const midi = +txt(note, 'pitch'), tpc = +txt(note, 'tpc');
              const li = 'FCGDAEB'.indexOf('FCGDAEB'[((tpc + 1) % 7 + 7) % 7]);
              const letter = 'FCGDAEB'[li], alt = Math.floor((tpc + 1) / 7) - 2;
              const oct = Math.round((midi - alt - [0, 2, 4, 5, 7, 9, 11][LET.indexOf(letter)]) / 12) - 1;
              e.step = 7 * oct + LET.indexOf(letter); e.alt = alt;
              const sp = kids(note, 'Spanner').filter(s => s.getAttribute('type') === 'Tie');
              e.tieStart = !!kid(note, 'Tie') || sp.some(s => kid(s, 'next'));
              e.tieStop = !!kid(note, 'endSpanner') || sp.some(s => kid(s, 'prev'));
              const ly = kids(el, 'Lyrics').find(l => !kid(l, 'no') || txt(l, 'no') === '0');
              if (ly) {
                const word = txt(ly, 'text').replace(/<[^>]+>/g, ''), syl = txt(ly, 'syllabic') || 'single';
                if (word) e.syl = (syl === 'middle' || syl === 'end' ? '-' : '') + word + (syl === 'begin' || syl === 'middle' ? '-' : '');
              }
            }
            if (d > 0) evs.push(e);
            t += d;
          }
        }
        reach = Math.max(reach, t - m0);
        });
        if (!len) len = Math.max(mlen, reach);
        pos = m0 + len;
      }
      const list = by.filter(evs => evs && evs.some(e => !e.rest));
      if (!list.length) continue;
      if (!bars) bars = starts.filter(t => t > 0);
      const nm = voiceNames(staffName.get(staff.getAttribute('id')) || '', list.length);
      list.forEach((evs, i) => voices.push({name: nm[i], clef: clef || staffClef.get(staff.getAttribute('id')) || null, key: key || 0, mets, events: tidy(evs)}));
    }
    return {title, composer, voices, bars: bars || []};
  }

  /* ---------------- MIDI ---------------- */
  function fromMidi(buf){
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    const str = (p, n) => String.fromCharCode(...u8.subarray(p, p + n));
    if (str(0, 4) !== 'MThd') throw new Error('This is not a MIDI file.');
    const fmt = dv.getUint16(8), ntr = dv.getUint16(10), ppq = dv.getUint16(12);
    if (ppq & 0x8000) throw new Error('MIDI files timed in SMPTE frames are not supported.');
    let p = 8 + dv.getUint32(4);
    const groups = new Map(), names = [];
    let ts = null, sf = 0, title = '';
    const tsAll = [];
    for (let tr = 0; tr < ntr && p < u8.length; tr++) {
      if (str(p, 4) !== 'MTrk') break;
      const end = p + 8 + dv.getUint32(p + 4);
      let q = p + 8, tick = 0, run = 0, tname = '';
      const open = new Map();
      const vlq = () => { let v = 0, b; do { b = u8[q++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };
      while (q < end) {
        tick += vlq();
        let st = u8[q];
        if (st & 0x80) q++; else st = run;
        if (st === 0xFF) {
          const type = u8[q++], len = vlq(), d = u8.subarray(q, q + len);
          if (type === 0x03 && !tname) tname = new TextDecoder().decode(d).trim();
          if (type === 0x58) tsAll.push({tick, n: d[0], d: Math.pow(2, d[1])});
          if (type === 0x59 && tick === 0) sf = (d[0] << 24) >> 24;
          q += len;
        } else if (st === 0xF0 || st === 0xF7) { q += vlq(); }
        else {
          run = st;
          const hi = st & 0xf0, ch = st & 0x0f;
          const a = u8[q++], b = (hi === 0xC0 || hi === 0xD0) ? 0 : u8[q++];
          if (ch === 9) continue;
          const gk = fmt === 0 ? 'c' + ch : 't' + tr + 'c' + ch;
          if (hi === 0x90 && b > 0) open.set(ch + ':' + a, {t: tick, midi: a, gk});
          else if (hi === 0x80 || (hi === 0x90 && b === 0)) {
            const o = open.get(ch + ':' + a);
            if (o) { open.delete(ch + ':' + a); if (!groups.has(gk)) groups.set(gk, {notes: [], tr}); groups.get(gk).notes.push({t: o.t, e: tick, midi: a}); }
          }
        }
      }
      names[tr] = tname;
      p = end;
    }
    if (fmt === 1 && names[0] && ![...groups.values()].some(g => g.tr === 0)) title = names[0];
    if (!groups.size) throw new Error('No notes found in this MIDI file.');
    /* quantise to sixteenths (a triplet eighth where that fits better) */
    const g16 = ppq / 4, g12 = ppq / 3;
    const qz = x => { const a = Math.round(x / g16) * g16, b = Math.round(x / g12) * g12; return Math.abs(b - x) < Math.abs(a - x) - ppq / 48 ? b : a; };
    const toW = x => Math.round(x * W / (4 * ppq));
    const sharp = sf > 0;
    const SPELL = sharp ? [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]]
      : sf < 0 ? [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]]
      : [[0, 0], [0, 1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [6, -1], [6, 0]];
    const voices = [];
    let last = 0;
    for (const [gk, g] of groups) {
      const ns = g.notes.map(n => ({t: qz(n.t), e: qz(n.e), midi: n.midi})).filter(n => n.e > n.t).sort((a, b) => a.t - b.t || b.midi - a.midi);
      const evs = [];
      for (const n of ns) {
        if (evs.length && evs[evs.length - 1].t === toW(n.t)) continue;       /* a chord: its highest note */
        const [li, alt] = SPELL[n.midi % 12];
        evs.push({t: toW(n.t), d: toW(n.e - n.t), step: 7 * (Math.floor(n.midi / 12) - 1) + li, alt});
      }
      const tl = tidy(evs);
      if (!tl.length) continue;
      last = Math.max(last, tl[tl.length - 1].t + tl[tl.length - 1].d);
      const nm = names[g.tr] || '';
      voices.push({name: nm, clef: null, key: sf, mets: [], events: tl, avg: ns.reduce((a, n) => a + n.midi, 0) / ns.length});
    }
    /* the time signature gives the bars */
    if (!tsAll.length) tsAll.push({tick: 0, n: 4, d: 4});
    tsAll.sort((a, b) => a.tick - b.tick);
    const bars = [];
    let t = 0, k = 0, cur = tsAll[0];
    const mets = [{t: 0, sign: meterSign(cur.n, cur.d)}];
    while (t < last) {
      while (k + 1 < tsAll.length && toW(tsAll[k + 1].tick) <= t) { cur = tsAll[++k]; mets.push({t, sign: meterSign(cur.n, cur.d)}); }
      t += Math.round(cur.n * W / cur.d);
      if (t < last) bars.push(t);
    }
    voices.forEach(v => { v.mets = mets; v.clef = guessClef(v.events); });
    return {title, composer: '', voices, bars};
  }


  /* ---------------- LilyPond (simple files: notes, rests, ties, tuplets, \relative, \time, \key, \clef, lyrics) ---------------- */
  function balanced(src, i, open, close){
    /* src[i] is the opening bracket; returns the index after the matching close */
    let depth = 0;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '"') { j++; while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; } continue; }
      if (src.startsWith(open, j)) { depth++; j += open.length - 1; }
      else if (src.startsWith(close, j)) { depth--; j += close.length - 1; if (!depth) return j + 1; }
    }
    throw new Error('Unbalanced ' + open + ' in this LilyPond file.');
  }
  const LY_CLEF = {treble: 'G2', violin: 'G2', G: 'G2', G2: 'G2', 'treble_8': 'Gv2', 'G_8': 'Gv2', tenorG: 'Gv2', 'violin_8': 'Gv2', bass: 'F4', F: 'F4', subbass: 'F4', 'bass_8': 'F4',
    varbaritone: 'F3', baritone: 'C5', alto: 'C3', C: 'C3', tenor: 'C4', soprano: 'C1', mezzosoprano: 'C2'};
  const LY_MODE = {major: 0, ionian: 0, minor: -3, aeolian: -3, dorian: -2, phrygian: -4, lydian: 1, mixolydian: -1, locrian: -5};
  const lyAlt = s => ({isis: 2, is: 1, eses: -2, es: -1, s: -1, ses: -2}[s] || 0);
  const LY_DUR = {1: 1, 2: 2, 4: 4, 8: 8, 16: 16, 32: 32, 64: 64, 128: 128};
  function fromLilyPond(src){
    src = src.replace(/%\{[\s\S]*?%\}/g, ' ').replace(/%[^\n]*/g, ' ');
    const hdr = (k) => { const m = new RegExp('\\\\header\\s*\\{[\\s\\S]*?\\b' + k + '\\s*=\\s*"([^"]*)"').exec(src); return m ? m[1] : ''; };
    const title = hdr('title'), composer = hdr('composer');
    /* drop \header, \paper, \layout, \midi blocks, and markup */
    for (const blk of ['header', 'paper', 'layout', 'midi']) {
      let m; const re = new RegExp('\\\\' + blk + '\\s*\\{');
      while ((m = re.exec(src))) { const i = m.index + m[0].length - 1; src = src.slice(0, m.index) + ' ' + src.slice(balanced(src, i, '{', '}')); }
    }
    { let m; const re = /\\markup\s*\{/;
      while ((m = re.exec(src))) { const i = m.index + m[0].length - 1; src = src.slice(0, m.index) + ' ' + src.slice(balanced(src, i, '{', '}')); } }
    src = src.replace(/\\markup\s*(\\\w+\s*)*"[^"]*"/g, ' ').replace(/\\(?:set|override|unset|revert|once|tweak|version|include|language)\b[^\n]*/g, ' ');
    /* variables: name = { ... } / \relative c' { ... } / \lyricmode { ... } / << ... >> */
    const vars = {};
    { const re = /(^|\n)\s*([A-Za-z][A-Za-z]*)\s*=\s*/g; let m;
      while ((m = re.exec(src))) {
        let j = m.index + m[0].length;
        const head = /^(\\(?:relative|fixed|transpose|lyricmode|chordmode|drummode|figuremode)\b[^{<]*)?/.exec(src.slice(j))[0];
        const k = j + head.length;
        if (src[k] === '{' || src.startsWith('<<', k)) {
          const e = src[k] === '{' ? balanced(src, k, '{', '}') : balanced(src, k, '<<', '>>');
          vars[m[2]] = src.slice(j, e);
          src = src.slice(0, m.index) + '\n' + ' '.repeat(e - m.index - 1) + src.slice(e);
        } else if (src[k] === '"') { const e = src.indexOf('"', k + 1) + 1; vars[m[2]] = src.slice(j, e); src = src.slice(0, m.index) + '\n' + ' '.repeat(e - m.index - 1) + src.slice(e); }
      } }
    const expand = (t, depth = 0) => depth > 20 ? t : t.replace(/\\([A-Za-z]+)/g, (all, n) => n in vars ? ' ' + expand(vars[n], depth + 1) + ' ' : all);
    let score = '';
    { const m = /\\score\s*\{/.exec(src); score = m ? src.slice(m.index + m[0].length - 1, balanced(src, m.index + m[0].length - 1, '{', '}')) : src; }
    score = expand(score);
    /* staves: each \new Staff (or, without staves, each \new Voice, or else the whole) */
    const named = {};
    const music = [];
    const take = (from) => {
      /* the music after \new X [= "name"] [\with {...}] */
      let j = from;
      const nm = /^\s*=\s*"?([\w-]+)"?/.exec(score.slice(j)); if (nm) j += nm[0].length;
      const w = /^\s*\\with\s*\{/.exec(score.slice(j));
      let iname = '';
      if (w) { const e = balanced(score, j + w[0].length - 1, '{', '}'); const body = score.slice(j, e); const im = /instrumentName\s*=\s*(?:#?"([^"]*)")/.exec(body); if (im) iname = im[1]; j = e; }
      const st = /^\s*((?:\\(?:relative|fixed)\s*[a-g][',]*\s*)?)(\{|<<)/.exec(score.slice(j));
      if (!st) return null;
      const k = j + st[0].length - st[2].length;
      const e = st[2] === '{' ? balanced(score, k, '{', '}') : balanced(score, k, '<<', '>>');
      return {name: nm ? nm[1] : '', iname, text: st[1] + score.slice(k, e), end: e};
    };
    const kind = /\\new\s+Staff\b/.test(score) ? 'Staff' : /\\new\s+Voice\b/.test(score) ? 'Voice' : null;
    if (kind) {
      const re = new RegExp('\\\\new\\s+' + kind + '\\b', 'g'); let m;
      while ((m = re.exec(score))) { const x = take(m.index + m[0].length); if (x) { music.push(x); if (x.name) named[x.name] = x; re.lastIndex = x.end; } }
    } else {
      const m = /(\\relative\s*[a-g][',]*\s*)?(\{|<<)/.exec(score);
      if (m) { const k = m.index + m[0].length - m[2].length, e = m[2] === '{' ? balanced(score, k, '{', '}') : balanced(score, k, '<<', '>>'); music.push({name: '', iname: '', text: (m[1] || '') + score.slice(k, e), end: e}); }
    }
    /* inside a staff with several voices, the first voice */
    music.forEach(x => {
      const v = /\\new\s+Voice\b/.exec(x.text);
      if (kind === 'Staff' && v) { const sub = x.text.slice(v.index + v[0].length); const nm = /^\s*=\s*"?([\w-]+)"?/.exec(sub); const k = sub.search(/\{/); if (k >= 0) { x.text = (/\\relative\s*[a-g][',]*\s*$/.exec(sub.slice(0, k)) || [''])[0] + sub.slice(k, balanced(sub, k, '{', '}')); if (nm) named[nm[1]] = x; } }
      else if (x.text.trim().startsWith('<<')) { const k = x.text.indexOf('{'); if (k >= 0) x.text = x.text.slice(k, balanced(x.text, k, '{', '}')); }
    });
    /* lyrics: \addlyrics after a staff's music, or \new Lyrics \lyricsto "name" */
    const lyrics = new Map();
    { const re = /\\lyricsto\s*"?([\w-]+)"?\s*(\\lyricmode\s*)?\{/g; let m;
      while ((m = re.exec(score))) { const k = m.index + m[0].length - 1; const x = named[m[1]]; if (x && !lyrics.has(x)) lyrics.set(x, score.slice(k + 1, balanced(score, k, '{', '}') - 1)); } }
    { const re = /\\addlyrics\s*\{/g; let m;
      while ((m = re.exec(score))) { const k = m.index + m[0].length - 1; const before = music.filter(x => x.end !== undefined && x.end <= m.index).pop() || music[music.length - 1]; if (before && !lyrics.has(before)) lyrics.set(before, score.slice(k + 1, balanced(score, k, '{', '}') - 1)); } }
    const voices = [];
    let bars = null;
    for (const x of music) {
      const r = lyMusic(x.text);
      if (!r.events.some(e => !e.rest)) continue;
      if (lyrics.has(x)) lyAttach(r.events, lyrics.get(x));
      if (!bars) bars = r.bars;
      voices.push({name: x.iname || x.name.replace(/^./, c => c.toUpperCase()), clef: r.clef || 'G2', key: r.key, mets: r.mets, events: tidy(r.events)});
    }
    if (!voices.length) throw new Error('No notes found in this LilyPond file (only simple files can be read).');
    return {title, composer, voices, bars: bars || []};
  }
  function lyMusic(text){
    const toks = text.match(/\\[A-Za-z]+|<<|>>|"(?:[^"\\]|\\.)*"|#'?\([^)]*\)|#\S+|[a-zR][a-z]*[',]*[!?]?(?:=[',]*)?(?:\d+|\\breve|\\longa)?\.*(?:\*\d+(?:\/\d+)?)?|<[^<>]*>(?:\d+|\\breve|\\longa)?\.*|\d+\/\d+|\d+\.*|[{}~()|\[\]]|\S/g) || [];
    const evs = [], mets = [];
    let t = 0, dur = W / 4, ref = null, clef = null, key = null, tieNext = false, inSlur = false, partial = null, i = 0, rel = false;
    const fac = [1], pendingFac = [];
    const meter = [{t: 0, len: W}];
    const parseDur = (ds, dots) => {
      let d = ds === '\\breve' ? 2 * W : ds === '\\longa' ? 4 * W : ds ? W / +ds : dur;
      if (ds) { const k = (dots || '').length; dur = Math.round(d * (2 - Math.pow(0.5, k))); return dur; }
      return dur;
    };
    const pitchOf = (L, acc, oct) => {
      const li = 'cdefgab'.indexOf(L);
      let step;
      if (rel) { const base = ref === null ? 24 : ref; step = base + ((li - ((base % 7) + 7) % 7 + 10) % 7) - 3; if (Math.abs(step + 7 - base) < Math.abs(step - base)) step += 7; }
      else step = 21 + li;
      for (const c of oct) step += c === "'" ? 7 : -7;
      if (rel) ref = step;
      return {step, alt: lyAlt(acc)};
    };
    const push = (e, d) => {
      e.t = t; e.d = Math.round(d * fac[fac.length - 1]);
      if (!e.rest) { e.tieStop = tieNext; tieNext = false; e.mel = inSlur; }
      evs.push(e); t += e.d;
    };
    for (; i < toks.length; i++) {
      const s = toks[i];
      if (s === '\\relative') { rel = true; const p = /^([a-g])(isis|eses|is|es|s)?([',]*)$/.exec(toks[i + 1] || ''); if (p) { ref = null; ref = 21 + 'cdefgab'.indexOf(p[1]); for (const c of p[3]) ref += c === "'" ? 7 : -7; i++; } else ref = null; continue; }
      if (s === '\\fixed') { rel = false; i++; continue; }
      if (s === '\\time') { const m = /^(\d+)\/(\d+)$/.exec(toks[++i] || ''); if (m) { meter.push({t, len: Math.round(+m[1] * W / +m[2])}); mets.push({t, sign: meterSign(+m[1], +m[2])}); } continue; }
      if (s === '\\partial') { const m = /^(\d+)(\.*)/.exec(toks[++i] || ''); if (m) { const d = W / +m[1] * (2 - Math.pow(0.5, m[2].length)); partial = Math.round(d); } continue; }
      if (s === '\\key') { const p = /^([a-g])(isis|eses|is|es|s)?/.exec(toks[i + 1] || ''); const mode = (toks[i + 2] || '').slice(1); if (p && key === null) key = [0, 2, 4, -1, 1, 3, 5]['cdefgab'.indexOf(p[1])] + 7 * lyAlt(p[2]) + (LY_MODE[mode] || 0); i += 2; continue; }
      if (s === '\\clef') { const c = (toks[++i] || '').replace(/"/g, ''); if (clef === null && !evs.length) clef = LY_CLEF[c] || null; continue; }
      if (s === '\\tuplet') { const m = /^(\d+)\/(\d+)$/.exec(toks[++i] || ''); if (m) pendingFac.push(+m[2] / +m[1]); if (/^\d+$/.test(toks[i + 1] || '')) i++; continue; }
      if (s === '\\times') { const m = /^(\d+)\/(\d+)$/.exec(toks[++i] || ''); if (m) pendingFac.push(+m[1] / +m[2]); continue; }
      if (s === '\\repeat') { i += 2; continue; }
      if (s === '{') { fac.push(fac[fac.length - 1] * (pendingFac.length ? pendingFac.shift() : 1)); continue; }
      if (s === '}') { if (fac.length > 1) fac.pop(); continue; }
      if (s === '~') { tieNext = true; if (evs.length) evs[evs.length - 1].tieStart = true; continue; }
      if (s === '(') { inSlur = true; continue; }
      if (s === ')') { inSlur = false; continue; }
      if (s.startsWith('<') && s !== '<<') {
        const m = /^<([^<>]*)>(\d+|\\breve|\\longa)?(\.*)/.exec(s);
        const n = m && /([a-g])(isis|eses|is|es|s)?([',]*)/.exec(m[1]);
        const d = parseDur(m && m[2], m && m[3]);
        if (n) { const pp = pitchOf(n[1], n[2], n[3]); push(Object.assign({}, pp), d); }
        continue;
      }
      let m = /^([a-g])(isis|eses|is|es|s)?([',]*)[!?]?(?:=[',]*)?(\d+|\\breve|\\longa)?(\.*)$/.exec(s);
      if (m) { const pp = pitchOf(m[1], m[2], m[3]); push(pp, parseDur(m[4], m[5])); continue; }
      m = /^([rRs])(\d+|\\breve|\\longa)?(\.*)(?:\*(\d+)(?:\/(\d+))?)?$/.exec(s);
      if (m) { const d = parseDur(m[2], m[3]) * (m[4] ? +m[4] / (+m[5] || 1) : 1); push({rest: true}, d); continue; }
    }
    /* bars from the time signatures (and an upbeat) */
    const bars = [];
    let b = partial !== null ? partial : 0, k = 0;
    if (b > 0) bars.push(b);
    while (true) {
      while (k + 1 < meter.length && meter[k + 1].t <= b) k++;
      b += meter[k].len;
      if (b >= t) break;
      bars.push(b);
    }
    if (!mets.length || mets[0].t > 0) mets.unshift({t: 0, sign: 'C'});
    return {events: evs, mets, bars, clef, key: key || 0};
  }
  function lyAttach(evs, text){
    const toks = text.replace(/\\\w+/g, ' ').match(/"(?:[^"\\]|\\.)*"|\S+/g) || [];
    const syl = [];
    for (const tk of toks) {
      if (tk === '--') { if (syl.length) syl[syl.length - 1].hy = true; continue; }
      if (tk === '__' || tk === '{' || tk === '}') continue;
      let w = tk.replace(/^"|"$/g, '').replace(/\d+\.*$/, '');
      if (tk === '_') w = null;
      else w = w.replace(/~/g, ' ').replace(/_/g, ' ');
      syl.push({w, hy: false});
    }
    let k = 0, prevHy = false;
    for (const e of evs) {
      if (e.rest || e.tieStop || e.mel) continue;
      const s = syl[k++]; if (!s) break;
      if (s.w) e.syl = (prevHy ? '-' : '') + s.w + (s.hy ? '-' : '');
      prevHy = s.hy;
    }
  }
  /* ---------------- GABC (Gregorio chant) ----------------
     Each note a semibrevis (a mora vocis, the dot, doubles it); flats, naturals and sharps hold to the end of the word
     or the next bar; the syllables go to the first note of their neume; ; : and :: are barlines. The C clef's line is
     middle C, the F clef's the F below. */
  function fromGabc(text){
    const cut = text.search(/^%%\s*$/m);
    const head = cut >= 0 ? text.slice(0, cut) : '', body = (cut >= 0 ? text.slice(cut).replace(/^%%\s*/, '') : text).replace(/%[^\n]*/g, '');
    const meta = {};
    head.replace(/%[^\n]*/g, '').split(';').forEach(l => { const m = l.match(/^\s*([\w-]+)\s*:\s*([\s\S]*)$/); if (m) meta[m[1].toLowerCase()] = m[2].trim(); });
    const groups = [];
    const re = /([^()]*)\(([^)]*)\)/g;
    let m;
    while ((m = re.exec(body))) {
      const raw = m[1];
      const txt = raw.replace(/<[^>]*>/g, '').replace(/[{}]/g, '').replace(/\[[^\]]*\]/g, '').trim();
      groups.push({newWord: !groups.length || /^\s/.test(raw) || raw === '', txt, notes: m[2].replace(/\[[^\]]*\]/g, '')});
    }
    if (!groups.length) throw new Error('No GABC notes found in this file.');
    /* syllables: their place in the word */
    let word = [];
    const flush = () => { const w = word.filter(g => g.txt); w.forEach((g, k) => { g.syl = (k ? '-' : '') + g.txt + (k < w.length - 1 ? '-' : ''); }); word = []; };
    groups.forEach(g => { if (g.newWord) flush(); word.push(g); });
    flush();
    let clef = {c: true, line: 4, flatB: false}, t = 0, acc = {};
    const evs = [], bars = [];
    const stepOf = ch => {
      const L0 = 3 + 2 * (clef.line - 1), base = clef.c ? 28 : 24;
      return base + (ch.toLowerCase().charCodeAt(0) - 97 - L0);
    };
    for (const g of groups) {
      if (g.newWord) acc = {};
      const n = g.notes.trim();
      const cm = n.match(/^([cf])(b?)([1-5])$/);
      if (cm) { clef = {c: cm[1] === 'c', line: +cm[3], flatB: !!cm[2]}; continue; }
      let first = true;
      for (let i = 0; i < n.length; i++) {
        const ch = n[i];
        if (/[;:]/.test(ch)) { if (t > 0 && bars[bars.length - 1] !== t) bars.push(t); acc = {}; continue; }
        if (!/[a-mA-M]/.test(ch)) continue;
        const nx = n[i + 1] || '';
        if (nx === '+') { i++; continue; }                                 /* custos */
        const step = stepOf(ch), li = ((step % 7) + 7) % 7;
        if (nx === 'x' || nx === 'y' || nx === '#') { acc[step] = nx === 'x' ? -1 : nx === '#' ? 1 : 0; i++; if (n[i + 1] === '?') i++; continue; }
        let alt = step in acc ? acc[step] : (clef.flatB && li === 6 ? -1 : 0);
        let d = W;
        let j = i + 1;
        while (j < n.length && /[~<>owWvVsr'_0-9\/!-]/.test(n[j]) && !/[a-mA-M]/.test(n[j])) j++;
        if (n[j] === '.') { d = 2 * W; j++; if (n[j] === '.') j++; }
        i = j - 1;
        const e = {t, d, step, alt};
        if (first && g.syl) e.syl = g.syl;
        first = false;
        evs.push(e); t += d;
      }
    }
    if (!evs.length) throw new Error('No GABC notes found in this file.');
    const v = {name: meta['name'] ? 'Chant' : 'Chant', clef: null, key: clef.flatB ? -1 : 0, mets: [], events: evs};
    return {title: meta['name'] || '', composer: meta['author'] || '', voices: [v], bars};
  }

  /* ---------------- **kern ---------------- */
  function recip(ticks){
    const g = gcd(ticks, W), n = ticks / g, d = W / g;
    if (n === 1) return String(d);
    if (d === 1) { const r = {2: '0', 4: '00', 8: '000', 3: '0.', 6: '00.', 12: '000.'}[n]; if (r) return r; }
    if (n === 3 && d % 2 === 0) return (d / 2) + '.';
    if (n === 7 && d % 4 === 0) return (d / 4) + '..';
    return d + '%' + n;
  }
  function pitchTok(step, alt, keyAlts){
    const oct = Math.floor(step / 7), li = ((step % 7) + 7) % 7, L = LET[li];
    let s = oct >= 4 ? L.toLowerCase().repeat(oct - 3) : L.repeat(4 - oct);
    if (alt > 0) s += '#'.repeat(alt);
    else if (alt < 0) s += '-'.repeat(-alt);
    else if (keyAlts[L.toLowerCase()]) s += 'n';
    return s;
  }
  function keyAltsOf(fifths){
    const o = {};
    if (fifths > 0) 'fcgdaeb'.slice(0, Math.min(7, fifths)).split('').forEach(l => { o[l] = 1; });
    if (fifths < 0) 'beadgcf'.slice(0, Math.min(7, -fifths)).split('').forEach(l => { o[l] = -1; });
    return o;
  }
  function toKern(S, fileName){
    const vs = S.voices.filter(v => v.events.length);
    if (!vs.length) throw new Error('No notes found in this file.');
    vs.forEach((v, i) => { if (!v.name) v.name = 'Voice ' + (i + 1); if (!v.clef) v.clef = guessClef(v.events); });
    const end = Math.max(...vs.map(v => { const l = v.events[v.events.length - 1]; return l.t + l.d; }));
    const bars = [...new Set(S.bars)].filter(t => t > 0 && t < end).sort((a, b) => a - b);
    /* split notes at the barlines, tied over */
    const pieces = vs.map(v => {
      const L = [];
      for (const e of v.events) {
        const cuts = bars.filter(b => b > e.t && b < e.t + e.d), ts = [e.t, ...cuts, e.t + e.d];
        for (let q = 0; q + 1 < ts.length; q++) {
          const part = Object.assign({}, e, {t: ts[q], d: ts[q + 1] - ts[q]});
          if (!e.rest && ts.length > 2) { part.tieStart = q < ts.length - 2 || e.tieStart; part.tieStop = q > 0 || e.tieStop; }
          if (q) part.syl = null;
          L.push(part);
        }
      }
      return L;
    });
    const file = vs.map((v, i) => ({v, L: pieces[i], ka: keyAltsOf(v.key), text: v.events.some(e => e.syl)})).reverse();   /* lowest voice first */
    const cols = [];
    file.forEach(x => { cols.push({x, text: false}); if (x.text) cols.push({x, text: true}); });
    const line = fn => cols.map(fn).join('\t');
    const out = [];
    const nm = S.title || String(fileName || '').replace(/\.[^.]+$/, '');
    if (S.composer) out.push('!!!COM: ' + S.composer.replace(/\s+/g, ' '));
    out.push('!!!OTL: ' + nm.replace(/\s+/g, ' '));
    out.push(line(c => c.text ? '**text' : '**kern'));
    out.push(line(c => c.text ? '*' : '*I"' + c.x.v.name.replace(/\s+/g, ' ')));
    out.push(line(c => c.text ? '*' : '*clef' + c.x.v.clef));
    out.push(line(c => c.text ? '*' : '*k[' + Object.entries(c.x.ka).map(([l, a]) => l + (a > 0 ? '#' : '-')).join('') + ']'));
    const times = new Set([0, ...bars]);
    file.forEach(x => { x.L.forEach(e => times.add(e.t)); x.v.mets.forEach(m => times.add(m.t)); });
    const sorted = [...times].filter(t => t < end).sort((a, b) => a - b);
    const ptr = file.map(() => 0);
    out.push(line(() => '=1-'));
    let barNo = 1;
    for (const t of sorted) {
      if (bars.includes(t)) out.push(line(() => '=' + (++barNo)));
      if (file.some(x => x.v.mets.some(m => m.t === t))) out.push(line(c => { const m = !c.text && c.x.v.mets.find(m => m.t === t); return m ? '*met(' + m.sign + ')' : '*'; }));
      const row = file.map((x, i) => { const e = x.L[ptr[i]]; if (e && e.t === t) { ptr[i]++; return e; } return null; });
      if (!row.some(Boolean)) continue;
      out.push(line(c => {
        const e = row[file.indexOf(c.x)];
        if (!e) return '.';
        if (c.text) return e.syl ? e.syl.replace(/\s+/g, '_') : '.';
        if (e.rest) return recip(e.d) + 'r';
        const tie = e.tieStart && e.tieStop ? '_' : e.tieStart ? '[' : e.tieStop ? ']' : '';
        return (tie === '[' ? '[' : '') + recip(e.d) + pitchTok(e.step, e.alt || 0, c.x.ka) + (tie === ']' || tie === '_' ? tie : '');
      }));
    }
    out.push(line(() => '=='));
    out.push(line(() => '*-'));
    return out.join('\n') + '\n';
  }

  const EXT = /\.(musicxml|xml|mxl|mscz|mscx|mid|midi|kar|ly|gabc)$/i;
  async function read(file){
    const name = file.name || '', buf = await file.arrayBuffer();
    const ext = (name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
    let S;
    if (ext === 'mid' || ext === 'midi' || ext === 'kar') S = fromMidi(buf);
    else if (ext === 'ly') S = fromLilyPond(decodeText(buf));
    else if (ext === 'gabc') S = fromGabc(decodeText(buf));
    else if (ext === 'mxl' || ext === 'mscz') {
      const files = await unzip(buf);
      let pick = null;
      if (files.has('META-INF/container.xml')) {
        const c = xmlDoc(decodeText(await files.get('META-INF/container.xml')()));
        const rf = c.querySelector('rootfile'); if (rf) pick = rf.getAttribute('full-path');
      }
      if (!pick || !files.has(pick)) pick = [...files.keys()].find(n => ext === 'mscz' ? /\.mscx$/i.test(n) && !/\//.test(n) : /\.(xml|musicxml)$/i.test(n) && !/^META-INF\//.test(n))
        || [...files.keys()].find(n => ext === 'mscz' ? /\.mscx$/i.test(n) : /\.(xml|musicxml)$/i.test(n) && !/^META-INF\//.test(n));
      if (!pick) throw new Error('No score found inside this file.');
      const text = decodeText(await files.get(pick)());
      S = /\.mscx$/i.test(pick) ? fromMuseScore(text) : fromMusicXML(text);
    } else {
      const text = decodeText(buf);
      S = ext === 'mscx' || /<museScore\b/.test(text.slice(0, 400)) ? fromMuseScore(text) : fromMusicXML(text);
    }
    return toKern(S, name);
  }
  window.ScoreImport = {accepts: name => EXT.test(name || ''), toKern: read, _: {fromMusicXML, fromMuseScore, fromMidi, fromLilyPond, fromGabc, toKern}};
})();
