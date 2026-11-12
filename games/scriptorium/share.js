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
  function pageSvg(){
    const items = [...pagesEl.querySelectorAll('.page')];
    if (!items.length) return null;
    let k = 0;
    const vr = viewerEl.getBoundingClientRect();
    items.forEach((p, i) => { const r = p.getBoundingClientRect(); if (r.top <= vr.top + vr.height / 2 && r.left <= vr.left + vr.width / 2) k = i; });
    const live = items[k].querySelector('svg'); if (!live) return null;
    const out = live.cloneNode(true);
    const L1 = live.querySelectorAll('*'), L2 = out.querySelectorAll('*');
    const PROPS = ['fill', 'stroke', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-style', 'font-weight', 'display', 'visibility'];
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
  $('#linkBtn').addEventListener('click', () => { copyLink().catch(() => toast('The link could not be made.')); });

  /* ---------------- the dark room: around the parchment, and the website page with it ---------------- */
  H.dark = () => {
    const on = st.dark === 'on';
    document.documentElement.classList.toggle('dark', on);
    if (EMBED) try { parent.postMessage({[APP.msg + 'Dark']: on}, '*'); } catch (e) {}
  };
  H.dark();
  window.__share = {pack, unpack, pageSvg};
}]);
