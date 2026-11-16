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
  /* The pages are drawn as pictures (sharp, 220 dpi) with the lyrics' own fonts, and put one to a page in a PDF written here;
     nothing is sent anywhere. The fonts (a little over 100 KB) are fetched once from the same place the page gets them. */
  let fontCache = null;
  async function embedFonts(){
    if (fontCache !== null) return fontCache;
    fontCache = '';
    try {
      const link = [...document.querySelectorAll('link[rel=stylesheet]')].find(l => /fonts\.googleapis\.com/.test(l.href)); if (!link) return fontCache;
      const css = await (await fetch(link.href)).text();
      /* only the Latin pieces (Google splits each font into ranges) */
      const blocks = css.split('/*').slice(1).map(b => '/*' + b).filter(b => /\/\*\s*latin\s*\*\//.test(b) && !/latin-ext/.test(b.slice(0, 20)));
      let out = '';
      for (const b of blocks) {
        const m = /url\(([^)]+)\)/.exec(b); if (!m) continue;
        const buf = new Uint8Array(await (await fetch(m[1])).arrayBuffer());
        let bin = ''; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        out += b.replace(m[0], 'url(data:font/woff2;base64,' + btoa(bin) + ')').replace(/\/\*[^*]*\*\//, '');
      }
      fontCache = out;
    } catch (e) { fontCache = ''; }
    return fontCache;
  }
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  async function makePdf(){
    closePops();
    const n = pagesEl.querySelectorAll('.page').length;
    if (!piece || !n) { toast('There is nothing to put in a PDF yet.'); return; }
    toast('Making the PDF (' + n + ' page' + (n > 1 ? 's' : '') + ') …');
    try {
      const G = pageGeom(), css = await embedFonts();
      /* the paper: A3, A4 or A5 as chosen (and its orientation); on the Web page, A4 wide with the height of the page */
      const paper = G.web || G.fit ? null : [G.wmm, G.hmm];
      const DPI = 220, jpgs = [];
      for (let k = 0; k < n; k++) {
        const p = pageSvg(k); if (!p) continue;
        const wmm = paper ? paper[0] : 210, hmm = paper ? paper[1] : 210 * p.h / p.w;
        const svg = css ? p.svg.replace('<defs>', '<defs><style>' + css + '</style>') : p.svg;
        const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
        const c = document.createElement('canvas'); c.width = Math.round(wmm / 25.4 * DPI); c.height = Math.round(hmm / 25.4 * DPI);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
        jpgs.push({w: c.width, h: c.height, wpt: wmm / 25.4 * 72, hpt: hmm / 25.4 * 72, data: new Uint8Array(await blob.arrayBuffer())});
      }
      download(buildPdf(jpgs, (piece && piece.title) || 'Score'), baseName() + '.pdf');
      toast('PDF downloaded.');
    } catch (e) { toast('The PDF could not be made: ' + (e && e.message || 'this browser could not draw the pages.')); }
  }
  /* a PDF file: one JPEG picture per page, each page the size of its paper */
  function buildPdf(pages, title){
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0;
    const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (id, body) => { offs[id] = len; put(id + ' 0 obj\n'); put(body); put('\nendobj\n'); };
    const np = pages.length;
    put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Count ' + np + ' /Kids [' + pages.map((p, i) => (3 + i * 3) + ' 0 R').join(' ') + '] >>');
    pages.forEach((p, i) => {
      const pg = 3 + i * 3, im = pg + 1, ct = pg + 2, w = p.wpt.toFixed(2), h = p.hpt.toFixed(2);
      obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + w + ' ' + h + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>');
      offs[im] = len; put(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.data.length + ' >>\nstream\n'); put(p.data); put('\nendstream\nendobj\n');
      const cs = 'q ' + w + ' 0 0 ' + h + ' 0 0 cm /Im0 Do Q';
      obj(ct, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
    });
    const info = 3 + np * 3, total = info + 1;
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
  window.__share = {pack, unpack, pageSvg, pdf: makePdf, buildPdf};
}]);
