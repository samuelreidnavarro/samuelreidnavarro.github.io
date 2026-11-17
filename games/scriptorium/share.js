/* Scriptorium add-on: Copy link, Download SVG and PNG, and the dark room (from CantusFirmus), for every app.
   A link carries the whole score (its **kern, compressed) after #k=, so it opens with every change for anyone;
   the page around the app passes the # on. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = str => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
  async function pack(text){
    if (!window.CompressionStream) return 'u' + b64u(new TextEncoder().encode(text));
    const st2 = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'z' + b64u(new Uint8Array(await new Response(st2).arrayBuffer()));
  }
  async function unpack(p){
    const bytes = unb64u(p.slice(1));
    if (p[0] === 'u') return new TextDecoder().decode(bytes);
    const st2 = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(st2).text();
  }
  /* the link: the website's page for this app, with the score after #k= */
  async function copyLink(){
    if (!piece) return;
    closePops();
    let url = 'https://' + APP_URL;
    if (pieceKey && !pieceKey.startsWith('mine:') && !pieceKey.startsWith('file:') && !piece.text) url += '?piece=' + encodeURIComponent(pieceKey);
    else url += '#k=' + await pack(piece.text || writeKern(piece));
    try { await navigator.clipboard.writeText(url); toast(url.length > 6000 ? 'Link copied. It is long, since it carries the whole score.' : 'Link copied.'); }
    catch (e) { window.prompt('Copy this link:', url); }
  }
  /* a link opened: the score goes into My scores and opens */
  H.preStart = async () => {
    const m = /[#&]k=([zu][A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return;
    const text = await unpack(m[1]);
    const P = parseKern(text);
    st.piece = mineAdd(P.title || 'Score', text); save();
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) {}
  };

  /* ---------------- the page as a picture ---------------- */
  /* the page you see (the first of an opening), with its glyphs and every colour written into it */
  function pageSvg(only){
    const items = [...pagesEl.querySelectorAll('.page')];
    if (!items.length) return null;
    let k = 0;
    const vr = viewerEl.getBoundingClientRect();
    items.forEach((p, i) => { const r = p.getBoundingClientRect(); if (r.top <= vr.top + vr.height / 2 && r.left <= vr.left + vr.width / 2) k = i; });
    if (typeof only === 'number') k = only;
    const live = items[k].querySelector('svg'); if (!live) return null;
    const out = live.cloneNode(true);
    const L1 = live.querySelectorAll('*'), L2 = out.querySelectorAll('*');
    const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-style', 'font-weight', 'display', 'visibility'];
    L1.forEach((el, i) => {
      const cs = getComputedStyle(el), o = L2[i];
      if (/^(selbg|hit|caret)$/.test(el.getAttribute('class') || '') || el.classList.contains('hit') || el.classList.contains('stafhit') || el.classList.contains('selbg')) { o.remove(); return; }
      o.setAttribute('style', PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';'));
    });
    out.querySelectorAll('.mic,.ghost').forEach(g => g.remove());
    const used = new Set([...out.querySelectorAll('use')].map(u => (u.getAttribute('href') || '').slice(1)));
    const defs = [...used].filter(Boolean).map(id => { const p = document.getElementById(id); return p ? p.outerHTML : ''; }).join('');
    const vb = out.getAttribute('viewBox').split(/\s+/).map(Number);
    const bg = getComputedStyle(items[k]).backgroundColor || '#EFE3C7';
    out.insertAdjacentHTML('afterbegin', `<defs>${defs}</defs><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${bg}"/>`);
    out.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    out.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const r = items[k].getBoundingClientRect();
    out.setAttribute('width', Math.round(r.width)); out.setAttribute('height', Math.round(r.height));
    out.removeAttribute('style');
    return {svg: new XMLSerializer().serializeToString(out), w: r.width, h: r.height};
  }
  const baseName = () => (H.fileName ? H.fileName() : ((piece && piece.title) || APP.store).replace(/[\\/:*?"<>|]+/g, '').trim()) || APP.store;
  function download(blob, name){
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  $('#svgBtn').addEventListener('click', () => {
    closePops();
    const p = pageSvg(); if (!p) return;
    download(new Blob([p.svg], {type: 'image/svg+xml'}), baseName() + '.svg');
  });
  $('#pngBtn').addEventListener('click', () => {
    closePops();
    const p = pageSvg(); if (!p) return;
    const img = new Image(), sc = 3;
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = Math.round(p.w * sc); c.height = Math.round(p.h * sc);
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => download(b, baseName() + '.png'), 'image/png');
    };
    img.onerror = () => toast('This browser could not draw the picture.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.svg);
  });
  /* ---------------- a PDF, downloaded at once: every page at the paper size chosen in View (A3, A4, A5) ---------------- */
  /* Fully vector (Samuel 2026-11-16): the page's drawing is written into the PDF as lines, curves and filled shapes, and the
     lyrics, titles and names as outlines of the very letters of the font, so everything stays sharp at any zoom and prints
     crisp. Nothing is sent anywhere. The three fonts (about 200 KB in all) are fetched once from a font archive and kept in this
     browser; if they cannot be fetched, a standard font stands in for the text. */
  const FONT_FILE = {'IM Fell English': 'im-fell-english', 'IM Fell Double Pica': 'im-fell-double-pica', 'IM Fell English SC': 'im-fell-english-sc'};
  const fontMem = new Map();
  async function inflate(bytes){ return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer()); }
  async function loadFont(family, style){
    const pkg = FONT_FILE[family]; if (!pkg) return null;
    const key = pkg + '/' + (style === 'italic' ? 'italic' : 'normal');
    if (fontMem.has(key)) return fontMem.get(key);
    const href = 'https://cdn.jsdelivr.net/npm/@fontsource/' + pkg + '@5.3.0/files/' + pkg + '-latin-400-' + (style === 'italic' ? 'italic' : 'normal') + '.woff';
    let f = null;
    try {
      let buf = null;
      try { const c = await caches.open('choirbook-fonts'); const hit = await c.match(href); if (hit) buf = await hit.arrayBuffer(); else { const r = await fetch(href); if (r.ok) { await c.put(href, r.clone()); buf = await r.arrayBuffer(); } } }
      catch (e) { const r = await fetch(href); if (r.ok) buf = await r.arrayBuffer(); }
      if (buf) f = await parseWoff(buf);
    } catch (e) { f = null; }
    fontMem.set(key, f);
    return f;
  }
  /* a WOFF font read down to what outlines need: its letters' shapes (TrueType outlines) and where each letter is */
  async function parseWoff(buf){
    const dv = new DataView(buf);
    if (dv.getUint32(0) !== 0x774F4646) throw new Error('not a WOFF');
    const n = dv.getUint16(12), T = {};
    for (let i = 0; i < n; i++) {
      const o = 44 + 20 * i, tag = String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
      const off = dv.getUint32(o + 4), comp = dv.getUint32(o + 8), orig = dv.getUint32(o + 12);
      if (!['head', 'maxp', 'loca', 'glyf', 'cmap'].includes(tag)) continue;
      T[tag] = comp < orig ? await inflate(new Uint8Array(buf, off, comp)) : new Uint8Array(buf.slice(off, off + orig));
    }
    if (!T.glyf || !T.loca || !T.cmap || !T.head) throw new Error('no outlines');
    const H = new DataView(T.head.buffer, T.head.byteOffset), upem = H.getUint16(18), longLoca = H.getInt16(50) === 1;
    const nGl = new DataView(T.maxp.buffer, T.maxp.byteOffset).getUint16(4);
    const L = new DataView(T.loca.buffer, T.loca.byteOffset), loca = [];
    for (let i = 0; i <= nGl; i++) loca.push(longLoca ? L.getUint32(i * 4) : L.getUint16(i * 2) * 2);
    /* cmap: format 4 (or 12) */
    const C = new DataView(T.cmap.buffer, T.cmap.byteOffset), nt = C.getUint16(2);
    let sub = -1;
    for (let i = 0; i < nt; i++) { const pid = C.getUint16(4 + i * 8), eid = C.getUint16(6 + i * 8), off = C.getUint32(8 + i * 8); if ((pid === 3 && (eid === 1 || eid === 10)) || pid === 0) { const fmt = C.getUint16(off); if (fmt === 4 || fmt === 12) { sub = off; if (fmt === 12 || pid === 3) break; } } }
    if (sub < 0) throw new Error('no cmap');
    const fmt = C.getUint16(sub), map = new Map();
    if (fmt === 4) {
      const sc = C.getUint16(sub + 6) / 2, endO = sub + 14, startO = endO + sc * 2 + 2, deltaO = startO + sc * 2, rangeO = deltaO + sc * 2;
      for (let i = 0; i < sc; i++) {
        const end = C.getUint16(endO + i * 2), start = C.getUint16(startO + i * 2), delta = C.getInt16(deltaO + i * 2), ro = C.getUint16(rangeO + i * 2);
        for (let c = start; c <= end && c < 0xFFFF; c++) {
          let g;
          if (ro === 0) g = (c + delta) & 0xFFFF;
          else { const gp = rangeO + i * 2 + ro + (c - start) * 2; if (gp + 2 > T.cmap.length) continue; g = C.getUint16(gp); if (g) g = (g + delta) & 0xFFFF; }
          if (g) map.set(c, g);
        }
      }
    } else {
      const ng = C.getUint32(sub + 12);
      for (let i = 0; i < ng; i++) { const o = sub + 16 + i * 12, a = C.getUint32(o), b = C.getUint32(o + 4), g0 = C.getUint32(o + 8); for (let c = a; c <= b; c++) map.set(c, g0 + c - a); }
    }
    return {upem, loca, glyf: T.glyf, map, cache: new Map()};
  }
  /* a letter's outline as PDF path operators, in units of the em (y up becomes y down for the page's flipped drawing) */
  function glyphPath(font, gid, depth = 0){
    if (font.cache.has(gid)) return font.cache.get(gid);
    const {loca, glyf, upem} = font; let ops = '';
    const a = loca[gid], b = loca[gid + 1];
    if (b > a && depth < 6) {
      const dv = new DataView(glyf.buffer, glyf.byteOffset + a, b - a), nc = dv.getInt16(0);
      const f = v => (Math.round(v * 1000) / 1000).toString();
      if (nc >= 0) {
        const ends = []; let o = 10;
        for (let i = 0; i < nc; i++) { ends.push(dv.getUint16(o)); o += 2; }
        const np = nc ? ends[nc - 1] + 1 : 0, il = dv.getUint16(o); o += 2 + il;
        const flags = [];
        while (flags.length < np) { const fl = dv.getUint8(o++); flags.push(fl); if (fl & 8) { let r = dv.getUint8(o++); while (r-- > 0) flags.push(fl); } }
        const xs = [], ys = []; let v = 0;
        for (let i = 0; i < np; i++) { const fl = flags[i]; if (fl & 2) { const d = dv.getUint8(o++); v += (fl & 16) ? d : -d; } else if (!(fl & 16)) { v += dv.getInt16(o); o += 2; } xs.push(v); }
        v = 0;
        for (let i = 0; i < np; i++) { const fl = flags[i]; if (fl & 4) { const d = dv.getUint8(o++); v += (fl & 32) ? d : -d; } else if (!(fl & 32)) { v += dv.getInt16(o); o += 2; } ys.push(v); }
        let st = 0;
        for (const e of ends) {
          const pts = []; for (let i = st; i <= e; i++) pts.push({x: xs[i] / upem, y: -ys[i] / upem, on: !!(flags[i] & 1)});
          st = e + 1; if (pts.length < 2) continue;
          /* start on an on-curve point (or the middle of two off-curve ones) */
          let k0 = pts.findIndex(p => p.on), start;
          if (k0 < 0) { start = {x: (pts[0].x + pts[pts.length - 1].x) / 2, y: (pts[0].y + pts[pts.length - 1].y) / 2}; k0 = -1; }
          else start = pts[k0];
          const seq = []; for (let i = 1; i <= pts.length; i++) seq.push(pts[(k0 + i + pts.length) % pts.length]);
          if (k0 < 0) seq.pop();
          ops += f(start.x) + ' ' + f(start.y) + ' m ';
          let cur = start, ctrl = null;
          const quad = (c, p) => { ops += f(cur.x + 2 / 3 * (c.x - cur.x)) + ' ' + f(cur.y + 2 / 3 * (c.y - cur.y)) + ' ' + f(p.x + 2 / 3 * (c.x - p.x)) + ' ' + f(p.y + 2 / 3 * (c.y - p.y)) + ' ' + f(p.x) + ' ' + f(p.y) + ' c '; cur = p; };
          for (const p of seq) {
            if (p.on) { if (ctrl) { quad(ctrl, p); ctrl = null; } else { ops += f(p.x) + ' ' + f(p.y) + ' l '; cur = p; } }
            else { if (ctrl) quad(ctrl, {x: (ctrl.x + p.x) / 2, y: (ctrl.y + p.y) / 2}); ctrl = p; }
          }
          if (ctrl) quad(ctrl, start);
          ops += 'h ';
        }
      } else {
        /* a letter made of other letters (an accent on a base) */
        let o = 10, more = true;
        while (more) {
          const fl = dv.getUint16(o), gi = dv.getUint16(o + 2); o += 4;
          let dx, dy;
          if (fl & 1) { dx = dv.getInt16(o); dy = dv.getInt16(o + 2); o += 4; } else { dx = dv.getInt8(o); dy = dv.getInt8(o + 1); o += 2; }
          let a1 = 1, b1 = 0, c1 = 0, d1 = 1;
          if (fl & 8) { a1 = d1 = dv.getInt16(o) / 16384; o += 2; } else if (fl & 0x40) { a1 = dv.getInt16(o) / 16384; d1 = dv.getInt16(o + 2) / 16384; o += 4; } else if (fl & 0x80) { a1 = dv.getInt16(o) / 16384; b1 = dv.getInt16(o + 2) / 16384; c1 = dv.getInt16(o + 4) / 16384; d1 = dv.getInt16(o + 6) / 16384; o += 8; }
          const sub = glyphPath(font, gi, depth + 1);
          /* move the component's path: its numbers are x y pairs in the order of the operators */
          if (sub) ops += shiftOps(sub, a1, b1, c1, d1, dx / upem, -dy / upem);
          more = !!(fl & 0x20);
        }
      }
    }
    font.cache.set(gid, ops);
    return ops;
  }
  /* the numbers of a path (x y pairs, 'm l c h') moved and turned by a matrix (a b c d) and an offset */
  function shiftOps(ops, a, b, c, d, dx, dy){
    const t = ops.trim().split(/\s+/), out = []; let i = 0;
    const pair = () => { const x = +t[i++], y = +t[i++]; const nx = a * x + c * -y, ny = -(b * x + d * -y); out.push((Math.round((nx + dx) * 1000) / 1000) + ' ' + (Math.round((ny + dy) * 1000) / 1000)); };
    while (i < t.length) {
      const nxt = t[i];
      if (nxt === 'h') { out.push('h'); i++; continue; }
      /* read numbers up to the operator */
      let j = i; while (j < t.length && !/^[mlch]$/.test(t[j])) j++;
      const op = t[j], cnt = op === 'c' ? 3 : 1;
      for (let k = 0; k < cnt; k++) pair();
      out.push(op); i = j + 1;
    }
    return out.join(' ') + ' ';
  }
  /* path data (SVG) to PDF operators, in the page's own units */
  function svgPathOps(d){
    const f = v => (Math.round(v * 1000) / 1000).toString();
    const toks = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lcx = 0, lcy = 0, lastC = '', out = '';
    const num = () => +toks[i++];
    const arc = (x1, y1, rx, ry, phi, fa, fs, x2, y2) => {
      if (rx === 0 || ry === 0) { out += f(x2) + ' ' + f(y2) + ' l '; return; }
      rx = Math.abs(rx); ry = Math.abs(ry);
      const ph = phi * Math.PI / 180, cp = Math.cos(ph), sp = Math.sin(ph);
      const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
      const lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
      if (lam > 1) { const sq = Math.sqrt(lam); rx *= sq; ry *= sq; }
      const nu = rx * rx * y1p * y1p + ry * ry * x1p * x1p, co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, (rx * rx * ry * ry - nu) / nu));
      const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx, cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
      const ang = (ux, uy, vx, vy) => { const a2 = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a2; };
      let th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry), dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
      if (!fs && dth > 0) dth -= 2 * Math.PI; else if (fs && dth < 0) dth += 2 * Math.PI;
      const segs = Math.max(1, Math.ceil(Math.abs(dth) / (Math.PI / 2) - 1e-9)), dl = dth / segs, t = 4 / 3 * Math.tan(dl / 4);
      for (let s2 = 0; s2 < segs; s2++) {
        const a1 = th1 + s2 * dl, a2 = a1 + dl, c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2n = Math.sin(a2);
        const P = (px, py) => [cp * rx * px - sp * ry * py + cx, sp * rx * px + cp * ry * py + cy];
        const p1 = P(c1 - t * s1, s1 + t * c1), p2 = P(c2 + t * s2n, s2n - t * c2), p3 = P(c2, s2n);
        out += f(p1[0]) + ' ' + f(p1[1]) + ' ' + f(p2[0]) + ' ' + f(p2[1]) + ' ' + f(p3[0]) + ' ' + f(p3[1]) + ' c ';
      }
    };
    while (i < toks.length) {
      if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      if (C === 'Z') { out += 'h '; x = sx; y = sy; lastC = ''; continue; }
      if (C === 'M') { let nx = num(), ny = num(); if (rel) { nx += x; ny += y; } x = sx = nx; y = sy = ny; out += f(x) + ' ' + f(y) + ' m '; cmd = rel ? 'l' : 'L'; lastC = ''; }
      else if (C === 'L') { let nx = num(), ny = num(); if (rel) { nx += x; ny += y; } x = nx; y = ny; out += f(x) + ' ' + f(y) + ' l '; lastC = ''; }
      else if (C === 'H') { let nx = num(); if (rel) nx += x; x = nx; out += f(x) + ' ' + f(y) + ' l '; lastC = ''; }
      else if (C === 'V') { let ny = num(); if (rel) ny += y; y = ny; out += f(x) + ' ' + f(y) + ' l '; lastC = ''; }
      else if (C === 'C' || C === 'S') {
        let x1, y1;
        if (C === 'C') { x1 = num(); y1 = num(); if (rel) { x1 += x; y1 += y; } }
        else { x1 = lastC === 'C' ? 2 * x - lcx : x; y1 = lastC === 'C' ? 2 * y - lcy : y; }
        let x2 = num(), y2 = num(), nx = num(), ny = num();
        if (rel) { x2 += x; y2 += y; nx += x; ny += y; }
        out += f(x1) + ' ' + f(y1) + ' ' + f(x2) + ' ' + f(y2) + ' ' + f(nx) + ' ' + f(ny) + ' c ';
        lcx = x2; lcy = y2; x = nx; y = ny; lastC = 'C';
      } else if (C === 'Q' || C === 'T') {
        let qx, qy;
        if (C === 'Q') { qx = num(); qy = num(); if (rel) { qx += x; qy += y; } } else { qx = lastC === 'Q' ? 2 * x - lcx : x; qy = lastC === 'Q' ? 2 * y - lcy : y; }
        let nx = num(), ny = num(); if (rel) { nx += x; ny += y; }
        out += f(x + 2 / 3 * (qx - x)) + ' ' + f(y + 2 / 3 * (qy - y)) + ' ' + f(nx + 2 / 3 * (qx - nx)) + ' ' + f(ny + 2 / 3 * (qy - ny)) + ' ' + f(nx) + ' ' + f(ny) + ' c ';
        lcx = qx; lcy = qy; x = nx; y = ny; lastC = 'Q';
      } else if (C === 'A') {
        const rx = num(), ry = num(), phi = num(), fa = num(), fs = num(); let nx = num(), ny = num(); if (rel) { nx += x; ny += y; }
        arc(x, y, rx, ry, phi, fa, fs, nx, ny); x = nx; y = ny; lastC = '';
      } else { i++; }
    }
    return out;
  }
  const rgbOf = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); if (p.length > 3 && p[3] === 0) return null; return [p[0] / 255, p[1] / 255, p[2] / 255]; };
  const cnum = v => (Math.round(v * 1000) / 1000).toString();
  const matOf = tr => {
    let m = [1, 0, 0, 1, 0, 0];
    const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
    for (const [, name, args] of (tr || '').matchAll(/(\w+)\(([^)]*)\)/g)) {
      const a = args.split(/[ ,]+/).filter(Boolean).map(Number); let t = null;
      if (name === 'translate') t = [1, 0, 0, 1, a[0], a[1] || 0];
      else if (name === 'scale') t = [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0];
      else if (name === 'rotate') { const r = a[0] * Math.PI / 180, c = Math.cos(r), s2 = Math.sin(r); t = [c, s2, -s2, c, 0, 0]; if (a.length > 2) t = mul(mul([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]); }
      else if (name === 'matrix') t = a;
      if (t) m = mul(m, t);
    }
    return m;
  };
  /* one page: its SVG drawn as PDF operators (the page's units, y down; the caller flips the whole page) */
  async function pageOps(svg, res){
    let out = '';
    const skip = el => { const c = el.getAttribute && (el.getAttribute('class') || ''); return /\b(selbg|hit|stafhit|caret|ghost|mic|ksarr|mensadd)\b/.test(c) || el.tagName === 'defs' || el.tagName === 'style'; };
    const usedFonts = new Map();
    const gsOf = a => { const k = 'G' + Math.round(a * 100); res.gs.set(k, a); return '/' + k + ' gs '; };
    const paint = (el, d, fillRule, strokeOnly) => {
      const cs = getComputedStyle(el), fill = strokeOnly ? null : rgbOf(cs.fill), stroke = rgbOf(cs.stroke), sw = parseFloat(cs.strokeWidth) || 0;
      let op = '';
      const alpha = parseFloat(cs.opacity); const fa = alpha * (cs.fillOpacity === '' ? 1 : parseFloat(cs.fillOpacity));
      const doS = stroke && sw > 0 && cs.stroke !== 'none';
      if (!fill && !doS) return '';
      if (fill) op += cnum(fill[0]) + ' ' + cnum(fill[1]) + ' ' + cnum(fill[2]) + ' rg ';
      if (doS) op += cnum(stroke[0]) + ' ' + cnum(stroke[1]) + ' ' + cnum(stroke[2]) + ' RG ' + cnum(sw) + ' w ' + (cs.strokeLinecap === 'round' ? '1 J ' : cs.strokeLinecap === 'square' ? '2 J ' : '0 J ') + (cs.strokeLinejoin === 'round' ? '1 j ' : cs.strokeLinejoin === 'bevel' ? '2 j ' : '0 j ');
      if (cs.strokeDasharray && cs.strokeDasharray !== 'none') op += '[' + cs.strokeDasharray.replace(/px/g, '').replace(/,/g, ' ') + '] 0 d ';
      const gs = alpha < 1 ? gsOf(alpha) : '';
      return gs + op + d + (fill && doS ? (fillRule === 'evenodd' ? 'B* ' : 'B ') : fill ? (fillRule === 'evenodd' ? 'f* ' : 'f ') : 'S ');
    };
    const rectPath = (x, y, w, h, rx, ry) => {
      if (!rx && !ry) return cnum(x) + ' ' + cnum(y) + ' ' + cnum(w) + ' ' + cnum(h) + ' re ';
      rx = Math.min(rx || ry, w / 2); ry = Math.min(ry || rx, h / 2); const k = 0.5523;
      return svgPathOps(`M${x + rx} ${y}H${x + w - rx}C${x + w - rx + k * rx} ${y} ${x + w} ${y + ry - k * ry} ${x + w} ${y + ry}V${y + h - ry}C${x + w} ${y + h - ry + k * ry} ${x + w - rx + k * rx} ${y + h} ${x + w - rx} ${y + h}H${x + rx}C${x + rx - k * rx} ${y + h} ${x} ${y + h - ry + k * ry} ${x} ${y + h - ry}V${y + ry}C${x} ${y + ry - k * ry} ${x + rx - k * rx} ${y} ${x + rx} ${y}Z`);
    };
    const ellPath = (cx, cy, rx, ry) => { const k = 0.5523; return svgPathOps(`M${cx + rx} ${cy}C${cx + rx} ${cy + k * ry} ${cx + k * rx} ${cy + ry} ${cx} ${cy + ry}C${cx - k * rx} ${cy + ry} ${cx - rx} ${cy + k * ry} ${cx - rx} ${cy}C${cx - rx} ${cy - k * ry} ${cx - k * rx} ${cy - ry} ${cx} ${cy - ry}C${cx + k * rx} ${cy - ry} ${cx + rx} ${cy - k * ry} ${cx + rx} ${cy}Z`); };
    async function walk(el){
      if (skip(el)) return '';
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return '';
      const tag = el.tagName.toLowerCase(), tr = el.getAttribute('transform');
      const m = tr ? matOf(tr) : null;
      let body = '';
      const num = n => parseFloat(el.getAttribute(n)) || 0;
      if (tag === 'g' || tag === 'svg') { for (const k of el.children) body += await walk(k); }
      else if (tag === 'line') body = paint(el, cnum(num('x1')) + ' ' + cnum(num('y1')) + ' m ' + cnum(num('x2')) + ' ' + cnum(num('y2')) + ' l ', 'nonzero', true);
      else if (tag === 'rect') body = paint(el, rectPath(num('x'), num('y'), num('width'), num('height'), num('rx'), num('ry')));
      else if (tag === 'circle') body = paint(el, ellPath(num('cx'), num('cy'), num('r'), num('r')));
      else if (tag === 'ellipse') body = paint(el, ellPath(num('cx'), num('cy'), num('rx'), num('ry')));
      else if (tag === 'path') body = paint(el, svgPathOps(el.getAttribute('d') || ''), cs.fillRule);
      else if (tag === 'use') {
        const id = (el.getAttribute('href') || el.getAttribute('xlink:href') || '').slice(1), def = id && document.getElementById(id);
        if (def && def.tagName.toLowerCase() === 'path') {
          const x = num('x'), y = num('y');
          body = (x || y ? 'q 1 0 0 1 ' + cnum(x) + ' ' + cnum(y) + ' cm ' : 'q ') + paint(el, svgPathOps(def.getAttribute('d') || ''), cs.fillRule) + 'Q ';
        }
      } else if (tag === 'text') body = await textOps(el, cs);
      if (!body) return '';
      return m ? 'q ' + m.map(cnum).join(' ') + ' cm ' + body + 'Q ' : body;
    }
    async function textOps(el, cs){
      const txt = el.textContent; if (!txt.trim()) return '';
      const fill = rgbOf(cs.fill); if (!fill) return '';
      const size = parseFloat(cs.fontSize) || 1.6, fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), ital = cs.fontStyle === 'italic' ? 'italic' : 'normal';
      const font = await loadFont(fam, ital);
      let o = cnum(fill[0]) + ' ' + cnum(fill[1]) + ' ' + cnum(fill[2]) + ' rg ';
      const alpha = parseFloat(cs.opacity); if (alpha < 1) o = gsOf(alpha) + o;
      let any = false;
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i]; if (/\s/.test(ch)) continue;
        let pos; try { pos = el.getStartPositionOfChar(i); } catch (e) { continue; }
        if (font) {
          const gid = font.map.get(ch.codePointAt(0)); if (!gid) continue;
          const ops = glyphPath(font, gid); if (!ops) continue;
          o += 'q ' + cnum(size) + ' 0 0 ' + cnum(size) + ' ' + cnum(pos.x) + ' ' + cnum(pos.y) + ' cm ' + ops + 'f Q '; any = true;
        } else {
          /* the font could not be fetched: a standard one stands in */
          res.std = true; const code = ch.charCodeAt(0); if (code > 255) continue;
          o += 'BT /F1 ' + cnum(size) + ' Tf 1 0 0 -1 ' + cnum(pos.x) + ' ' + cnum(pos.y) + ' Tm <' + code.toString(16).padStart(2, '0') + '> Tj ET '; any = true;
        }
      }
      return any ? o : '';
    }
    out = await walk(svg);
    return out;
  }
  const deflate = async bytes => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  async function makePdf(){
    closePops();
    const items = [...pagesEl.querySelectorAll('.page')];
    if (!piece || !items.length) { toast('There is nothing to put in a PDF yet.'); return; }
    toast('Making the PDF (' + items.length + ' page' + (items.length > 1 ? 's' : '') + ') …');
    /* printed clean: nothing shown as selected */
    const sel = [...pagesEl.querySelectorAll('g.sel, g.on')]; sel.forEach(g => g.classList.remove('sel', 'on'));
    const caret = [...pagesEl.querySelectorAll('.caret')];
    try {
      const G = pageGeom();
      const paper = G.web || G.fit ? null : [G.wmm, G.hmm];
      const pages = [];
      for (const pg of items) {
        const svg = pg.querySelector('svg'); if (!svg) continue;
        const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number), r = pg.getBoundingClientRect();
        const wmm = paper ? paper[0] : 210, hmm = paper ? paper[1] : 210 * r.height / r.width;
        const wpt = wmm / 25.4 * 72, hpt = hmm / 25.4 * 72;
        const res = {gs: new Map(), std: false};
        const bg = rgbOf(getComputedStyle(pg).backgroundColor) || [1, 1, 1];
        const body = await pageOps(svg, res);
        const sx = wpt / vb[2], sy = hpt / vb[3];
        const content = cnum(bg[0]) + ' ' + cnum(bg[1]) + ' ' + cnum(bg[2]) + ' rg 0 0 ' + cnum(wpt) + ' ' + cnum(hpt) + ' re f ' +
          'q ' + cnum(sx) + ' 0 0 ' + cnum(-sy) + ' ' + cnum(-vb[0] * sx) + ' ' + cnum(hpt + vb[1] * sy) + ' cm ' + body + 'Q';
        pages.push({wpt, hpt, content: await deflate(new TextEncoder().encode(content)), gs: res.gs, std: res.std});
      }
      download(buildPdf(pages, (piece && piece.title) || 'Score'), baseName() + '.pdf');
      toast('PDF downloaded.');
    } catch (e) { toast('The PDF could not be made: ' + (e && e.message || 'something went wrong.')); console.error(e); }
    finally { sel.forEach(g => g.classList.add('sel')); }
  }
  /* a PDF file: one vector drawing per page, each page the size of its paper */
  function buildPdf(pages, title){
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0;
    const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (id, body) => { offs[id] = len; put(id + ' 0 obj\n'); put(body); put('\nendobj\n'); };
    const np = pages.length;
    put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Count ' + np + ' /Kids [' + pages.map((p, i) => (4 + i * 2) + ' 0 R').join(' ') + '] >>');
    obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
    pages.forEach((p, i) => {
      const pg = 4 + i * 2, ct = pg + 1;
      const gs = [...p.gs].map(([k, a]) => '/' + k + ' << /ca ' + a + ' /CA ' + a + ' >>').join(' ');
      obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + p.wpt.toFixed(2) + ' ' + p.hpt.toFixed(2) + '] /Resources << /ExtGState << ' + gs + ' >> /Font << /F1 3 0 R >> >> /Contents ' + ct + ' 0 R >>');
      offs[ct] = len; put(ct + ' 0 obj\n<< /Filter /FlateDecode /Length ' + p.content.length + ' >>\nstream\n'); put(p.content); put('\nendstream\nendobj\n');
    });
    const info = 4 + np * 2, total = info + 1;
    obj(info, '<< /Title (' + String(title).replace(/[()\\]/g, '').replace(/[^\x20-\x7e]/g, '?') + ') /Producer (ChoirBook) >>');
    const xref = len;
    let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    put(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, {type: 'application/pdf'});
  }
  $('#linkBtn').addEventListener('click', () => { copyLink().catch(() => toast('The link could not be made.')); });

  /* ---------------- the dark room: around the parchment, and the website page with it ---------------- */
  H.dark = () => {
    const on = st.dark === 'on';
    document.documentElement.classList.toggle('dark', on);
    if (EMBED) try { parent.postMessage({[APP.msg + 'Dark']: on}, '*'); } catch (e) {}
  };
  H.dark();
  window.__share = {pack, unpack, pageSvg, pdf: makePdf, buildPdf, pageOps};

  /* ---------------- ?example=1: only the music, for another page (Samuel's Jargon) ----------------
     Once the first page has drawn and stopped changing, it is sent to the page around as one SVG,
     cropped to the notes, without the title, the composer or anything of the app around it. */
  if (EMBED && /[?&]example=1/.test(location.search)) {
    let last = '', still = 0, tries = 0;
    const SKIP = el => el.closest('.selbg,.hit,.stafhit,.caret,.mic,.ghost') || el.classList.contains('foot') || /^(title|comp)$/.test(el.getAttribute('data-f') || '');
    const tick = () => {
      if (++tries > 120) return;
      const live = pagesEl.querySelector('.page svg');
      const sig = live ? live.innerHTML.length + ':' + live.getBoundingClientRect().width : '';
      if (!live || sig !== last) { last = sig; still = 0; return setTimeout(tick, 250); }
      if (++still < 2) return setTimeout(tick, 250);
      document.fonts.ready.then(() => send(live));
    };
    function send(live){
      /* the title block: the title, a line under it and the composer; everything above the music */
      const title = live.querySelector('[data-f="title"]'), sub = title && title.nextElementSibling;
      const drop = [title, sub && sub.tagName === 'text' && !sub.getAttribute('data-f') ? sub : null, live.querySelector('[data-f="comp"]')].filter(Boolean);
      const inv = live.getScreenCTM().inverse(), pt = live.createSVGPoint();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      live.querySelectorAll('path,line,polyline,polygon,ellipse,circle,use,text,rect').forEach(el => {
        if (drop.includes(el) || SKIP(el)) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
        if (el.tagName === 'rect' && (cs.fill === 'none' || /rgba\(.*, 0\)|transparent/.test(cs.fill)) && cs.stroke === 'none') return;
        const r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
        [[r.left, r.top], [r.right, r.bottom]].forEach(([x, y]) => { pt.x = x; pt.y = y; const q = pt.matrixTransform(inv); x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); });
      });
      const out = pageSvg(0);
      if (!out || !isFinite(x0)) return;
      const doc = new DOMParser().parseFromString(out.svg, 'image/svg+xml'), svg = doc.documentElement;
      svg.querySelectorAll('.foot').forEach(e => e.remove());
      svg.querySelectorAll('[data-f="title"],[data-f="comp"]').forEach(e => { const n = e.nextElementSibling; if (e.getAttribute('data-f') === 'title' && n && n.tagName === 'text' && !n.getAttribute('data-f')) n.remove(); e.remove(); });
      const vb = live.viewBox.baseVal, pad = Math.max(1, (x1 - x0) * .012);
      const bx = Math.max(vb.x, x0 - pad), by = Math.max(vb.y, y0 - pad), bw = Math.min(vb.x + vb.width, x1 + pad) - bx, bh = Math.min(vb.y + vb.height, y1 + pad) - by;
      svg.setAttribute('viewBox', `${bx} ${by} ${bw} ${bh}`);
      const k = out.w / vb.width;
      svg.setAttribute('width', Math.round(bw * k)); svg.setAttribute('height', Math.round(bh * k));
      try { parent.postMessage({[APP.msg + 'Example']: {svg: new XMLSerializer().serializeToString(svg), w: bw * k, h: bh * k}}, '*'); } catch (e) {}
    }
    setTimeout(tick, 400);
  }
}]);
