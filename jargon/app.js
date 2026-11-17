/* Samuel's Jargon. Articles and weeks live in a Cloudflare Worker (see the project's jargon/worker.js).
   Log in: a group code shows that group's weeks; the admin password lets Samuel write. */
(function () {
  const API = new URLSearchParams(location.search).get('api') || 'https://samuels-jargon.samreidn.workers.dev';
  const CODES = { grazare: 'Graz Are', grazgammaut: 'Graz Gammaut' };
  const GROUPS = Object.values(CODES);
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };

  let D = { terms: {}, weeks: {} };
  let user = null, pw = null;           /* user: null | 'Samuel' | a group name */
  let viewGroup = 'All terms';
  let markDate = new Date().toISOString().slice(0, 10), markUnplanned = false;
  let delArm = null;

  /* ---------- dates ---------- */
  const monday = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  const fmt = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const weekNo = iso => { const t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7)); const j = new Date(t.getFullYear(), 0, 4); return 1 + Math.round(((t - j) / 864e5 - 3 + ((j.getDay() + 6) % 7)) / 7); };

  /* ---------- text ---------- */
  const titleId = name => Object.keys(D.terms).find(k => D.terms[k].title.toLowerCase() === name.trim().toLowerCase());
  function rich(s) {
    return esc(s).split(/\n\s*\n/).map(p => '<p>' + p.replace(/\n/g, '<br>').replace(/\[\[([^\]]+)\]\]/g, (m, name) => {
      const k = titleId(name); return k ? `<a href="#${k}" data-go="${k}">${esc(name)}</a>` : esc(name);
    }) + '</p>').join('');
  }
  /* t.sug lists the fields that are still Claude's suggestions: grey for Samuel, hidden for everyone else */
  const isSug = (t, k) => (t.sug || []).includes(k);
  const ok = (t, k) => (user === 'Samuel' || !isSug(t, k)) ? (t[k] || '') : '';
  const short = t => (ok(t, 'short') || ok(t, 'def').replace(/\[\[([^\]]+)\]\]/g, '$1').split(/(?<=\.)\s/)[0] || ok(t, 'syn') || '').trim();
  const imgUrl = id => API + '/img/' + id;

  function toast(m) { const el = $('#jgToast'); el.textContent = m; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2800); }

  /* ---------- server ---------- */
  async function load() {
    try { const r = await fetch(API + '/data', { cache: 'no-store' }); if (!r.ok) throw 0; D = await r.json(); D.terms = D.terms || {}; D.weeks = D.weeks || {}; }
    catch (e) { $('#jgList').innerHTML = '<p class="jg-none">The articles could not be loaded. Please try again later.</p>'; return false; }
    return true;
  }
  async function save(msg) {
    try {
      const r = await fetch(API + '/data', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': pw }, body: JSON.stringify(D) });
      if (!r.ok) throw new Error(r.status === 401 ? 'The password was not accepted.' : 'Saving failed (' + r.status + ').');
      if (msg) toast(msg);
      return true;
    } catch (e) { toast(e.message && !/fetch/i.test(e.message) ? e.message : 'Saving failed. Check your connection.'); return false; }
  }
  async function upload(file) {
    const blob = await shrink(file);
    const r = await fetch(API + '/img', { method: 'POST', headers: { 'Content-Type': blob.type, 'X-Admin': pw }, body: blob });
    if (!r.ok) throw new Error('Upload failed (' + r.status + ').');
    return (await r.json()).id;
  }
  /* photos get scaled to at most 1600 px; PNG/SVG of music stay sharp */
  function shrink(file) {
    return new Promise(res => {
      if (!/jpeg|webp/.test(file.type)) return res(file);
      const img = new Image(); img.onload = () => {
        const s = Math.min(1, 1600 / Math.max(img.width, img.height)); if (s === 1 && file.size < 600000) return res(file);
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => res(b || file), 'image/jpeg', .86);
      }; img.onerror = () => res(file); img.src = URL.createObjectURL(file);
    });
  }

  /* ---------- weeks ---------- */
  const weeksOf = g => Object.entries(D.weeks[g] || {}).filter(([, l]) => l.length).sort((a, b) => b[0].localeCompare(a[0]));
  const markedIn = (g, wk, id) => (D.weeks[g] && D.weeks[g][wk] || []).find(x => x[0] === id);
  function toggleMark(g, id) {
    const wk = monday(markDate);
    D.weeks[g] = D.weeks[g] || {}; const l = D.weeks[g][wk] = D.weeks[g][wk] || [];
    const i = l.findIndex(x => x[0] === id);
    if (i >= 0) l.splice(i, 1); else l.push(markUnplanned ? [id, 1] : [id]);
    if (!l.length) delete D.weeks[g][wk];
    return i < 0;
  }

  /* ---------- drawing ---------- */
  /* every section folds when its title is clicked */
  const sec = (label, inner) => `<details class="jg-sec" open><summary><h3>${label}</h3></summary>${inner}</details>`;
  /* a ChoirBook / CantusFirmus / Canon Maker link -> just the music, drawn by the app in a hidden frame */
  const APPS = { 'choirbook.html': ['ChoirBook', 130], 'cantus-firmus.html': ['CantusFirmus', 166], 'canon-maker.html': ['Canon Maker', 114] };
  const appOf = link => { try { const u = new URL(link, location.href), f = u.pathname.split('/').pop(); return APPS[f] ? { u, f, name: APPS[f][0], v: APPS[f][1] } : null; } catch (e) { return null; } };
  function exFrame(link) {
    const a = appOf(link); if (!a) return '';
    const piece = a.u.searchParams.get('piece');
    const src = 'games/' + a.f + '?example=1&' + (piece ? 'piece=' + encodeURIComponent(piece) + '&' : '') + 'v=' + a.v + a.u.hash;
    return `<div class="jg-ex"><iframe class="jg-cb" data-src="${esc(src)}" title="${a.name}" scrolling="no" tabindex="-1" aria-hidden="true"></iframe></div>`;
  }
  const openIn = link => { const a = appOf(link); return `<a class="jg-btn" href="${esc(link)}" target="_blank" rel="noopener">Open in ${a ? a.name : 'ChoirBook'}</a>`; };
  function article(id) {
    const t = D.terms[id], A = user === 'Samuel';
    const see = t.see || [];
    const from = Object.keys(D.terms).filter(k => k !== id && (D.terms[k].see || []).includes(id));
    const lk = k => `<a href="#${k}" data-go="${k}">${esc(D.terms[k].title)}</a>`;
    const field = (label, key, hint) => sec(label, `<div class="jg-field${isSug(t, key) ? ' jg-sug' : ''}" contenteditable="true" data-k="${key}" ${hint ? `aria-label="${esc(hint)}"` : ''}>${esc(t[key] || '')}</div>`);
    let h = '';
    if (A) {
      h += field('Title', 'title') + field('Short description', 'short', 'Shown on the card. Empty: the first sentence of the definition.');
      h += field('Synonyms and other spellings', 'syn') + field('Definition', 'def');
      h += sec('Musical example', `<input class="jg-in" data-k="ex" placeholder="Link from ChoirBook, CantusFirmus or Canon Maker (Copy link)" value="${esc(t.ex || '')}">${t.ex ? exFrame(t.ex) + `<p class="jg-row">${openIn(t.ex)}</p>` : ''}
        ${t.exImg ? `<img class="jg-img" src="${imgUrl(t.exImg)}" alt="">` : ''}
        <div class="jg-row"><button class="jg-btn" data-act="pick" data-key="exImg">${t.exImg ? 'Replace picture' : 'Add picture'}</button>${t.exImg ? '<button class="jg-btn danger" data-act="unimg" data-key="exImg">Remove picture</button>' : ''}</div>`);
      h += sec('Historical origin of the terminus', `<div class="jg-field${isSug(t, 'origin') ? ' jg-sug' : ''}" contenteditable="true" data-k="origin">${esc(t.origin || '')}</div>
        <input class="jg-in" data-k="originLink" placeholder="Link to the source" value="${esc(t.originLink || '')}" style="margin-top:.5rem">`);
      h += sec('Card picture', `${t.img ? `<img class="jg-img" src="${imgUrl(t.img)}" alt="" style="max-width:12rem">` : ''}
        <div class="jg-row"><button class="jg-btn" data-act="pick" data-key="img">${t.img ? 'Replace picture' : 'Add picture'}</button>${t.img ? '<button class="jg-btn danger" data-act="unimg" data-key="img">Remove picture</button>' : ''}</div>`);
      h += sec('See also', `<div class="jg-row">${see.filter(k => D.terms[k]).map(k => `<span class="jg-chip">${lk(k)}<button class="x" data-unlink="${k}" aria-label="Remove link">×</button></span>`).join('')}
        <input class="jg-in jg-addlink" list="jgTerms" placeholder="Link to another term" style="width:auto;flex:1;min-width:10rem"></div>`);
      if (from.length) h += sec('Linked from', `<p>${from.map(lk).join(', ')}</p>`);
      h += sec(`Taught in the week of ${esc(fmt(monday(markDate)))}`, `<div class="jg-row">${GROUPS.map(g => `<button class="jg-chip${markedIn(g, monday(markDate), id) ? ' on' : ''}" data-mark="${esc(g)}">${esc(g)}</button>`).join('')}</div>`);
      h += sec('Comments', `<div class="jg-comments jg-noprint" data-term="${id}"></div>`);
      h += `<div class="jg-tools"><button class="jg-btn" data-act="pdf">Download PDF</button><button class="jg-btn danger" data-act="del">${delArm === id ? 'Click again to delete' : 'Delete article'}</button></div>`;
      return `<div class="jg-art">${h}</div>`;
    }
    if (ok(t, 'syn')) h += sec('Synonyms and other spellings', rich(t.syn));
    if (ok(t, 'def')) h += sec('Definition', rich(t.def));
    if (t.exImg || t.ex) h += sec('Musical example', `${t.ex ? exFrame(t.ex) : ''}${t.exImg ? `<img class="jg-img" src="${imgUrl(t.exImg)}" alt="Musical example: ${esc(t.title)}">` : ''}${t.ex ? `<p class="jg-noprint">${openIn(t.ex)}</p>` : ''}`);
    if (ok(t, 'origin') || t.originLink) h += sec('Historical origin of the terminus', `${rich(ok(t, 'origin'))}${t.originLink ? `<p><a href="${esc(t.originLink)}" target="_blank" rel="noopener">${esc(t.originLink)}</a></p>` : ''}`);
    const links = see.filter(k => D.terms[k]).concat(from.filter(k => !see.includes(k)));
    if (links.length) h += sec('See also', `<p>${links.map(lk).join(', ')}</p>`);
    h += sec('Comments', `<div class="jg-comments jg-noprint" data-term="${id}"></div>`);
    h += `<div class="jg-tools"><button class="jg-btn" data-act="pdf">Download PDF</button></div>`;
    return `<div class="jg-art">${h}</div>`;
  }

  function card(id, unplanned) {
    const t = D.terms[id]; if (!t) return '';
    const d = short(t);
    return `<details class="jg-card" id="${id}" data-id="${id}"><summary>${t.img ? `<img class="jg-thumb" src="${imgUrl(t.img)}" alt="">` : ''}<span class="jg-t"><h2>${esc(t.title)}</h2>${d ? `<p class="jg-d">${esc(d)}</p>` : ''}</span>${unplanned && user === 'Samuel' ? '<span class="jg-tag">unplanned</span>' : ''}<span class="jg-chev" aria-hidden="true">›</span></summary></details>`;
  }
  const alpha = ids => ids.sort((a, b) => D.terms[a].title.localeCompare(D.terms[b].title));

  function render() {
    const A = user === 'Samuel';
    $('#jgWho').innerHTML = user ? `${esc(user)} <button class="jg-btn" id="jgOut">Log out</button>` : `<button class="jg-btn" id="jgIn">Log in</button>`;
    $('#jgAdmin').hidden = !A;
    if (A) {
      $('#jgAdmin').innerHTML = `<form class="jg-form" id="jgNew"><input id="jgNewTitle" type="text" placeholder="Title of a new article" aria-label="Title of a new article" autocomplete="off"><button class="jg-btn solid">New article</button></form>
        <span>Timeline: ${['All terms'].concat(GROUPS).map(g => `<button class="jg-chip${g === viewGroup ? ' on' : ''}" data-view="${esc(g)}">${esc(g)}</button>`).join(' ')}</span>
        <label>Marking week <input type="date" id="jgDate" value="${markDate}"></label>
        <label><input type="checkbox" id="jgUnpl" ${markUnplanned ? 'checked' : ''}> unplanned</label>`;
    }
    const open = [...document.querySelectorAll('.jg-card[open]')].map(c => c.id);
    const q = $('#jgQ').value.trim().toLowerCase();
    let html = '';
    if (q) {
      const hits = alpha(Object.keys(D.terms).filter(k => { const t = D.terms[k]; return [t.title, t.syn, t.short, t.def, t.origin].join(' ').toLowerCase().includes(q); }));
      html = hits.length ? `<div class="jg-cards">${hits.map(k => card(k)).join('')}</div>` : `<p class="jg-none">No term matches “${esc(q)}”.</p>`;
    } else {
      const g = A ? viewGroup : user;
      if (g && GROUPS.includes(g)) {
        const w = weeksOf(g);
        html = w.length ? w.map(([wk, l]) => `<section class="jg-week"><div class="jg-date">${esc(fmt(wk))}<small>Week ${weekNo(wk)}</small></div><div class="jg-cards">${l.map(([k, u]) => card(k, u)).join('')}</div></section>`).join('')
          : `<p class="jg-none">No weeks yet.</p>`;
      } else html = `<div class="jg-cards">${alpha(Object.keys(D.terms)).map(k => card(k)).join('')}</div>`;
    }
    $('#jgList').innerHTML = html + `<datalist id="jgTerms">${Object.values(D.terms).map(t => `<option value="${esc(t.title)}">`).join('')}</datalist>`;
    open.forEach(k => openCard(k, false));
  }
  function openCard(id, scroll) {
    const el = document.getElementById(id); if (!el || !el.classList.contains('jg-card')) return false;
    el.open = true; if (!el.querySelector('.jg-art')) el.insertAdjacentHTML('beforeend', article(id));
    startFrames(el);
    if (scroll) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  function redrawCard(id) { const el = document.getElementById(id); if (!el) return; const a = el.querySelector('.jg-art'); if (a) a.outerHTML = article(id); startFrames(el); }
  /* frames load once their card is open; each sends back its music as one SVG, which takes the frame's place */
  /* ---------- comments ---------- */
  const when = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const para = s => esc(s).replace(/\n/g, '<br>');
  async function loadComments(box) {
    const id = box.dataset.term; let list = [];
    try { const r = await fetch(API + '/comments/' + id, { cache: 'no-store' }); if (r.ok) list = await r.json(); } catch (e) {}
    drawComments(box, list);
  }
  function drawComments(box, list) {
    const A = user === 'Samuel';
    box.innerHTML = list.map(c => `<div class="jg-com" data-cid="${esc(c.id)}">
        <div class="jg-com-h"><b>${esc(c.name || 'Anonymous')}</b> <span>${esc(when(c.at))}</span>${A ? ` <button class="jg-link" data-cdel="${esc(c.id)}">Delete</button>` : ''}</div>
        <p>${para(c.text)}</p>
        ${(c.replies || []).map(r => `<div class="jg-com jg-reply"><div class="jg-com-h"><b>Samuel</b> <span>${esc(when(r.at))}</span>${A ? ` <button class="jg-link" data-cdel="${esc(c.id)}" data-rat="${esc(r.at)}">Delete</button>` : ''}</div><p>${para(r.text)}</p></div>`).join('')}
        ${A ? `<form class="jg-cform jg-replyform" data-reply="${esc(c.id)}"><textarea rows="2" placeholder="Reply" aria-label="Reply" required></textarea><button class="jg-btn">Reply</button></form>` : ''}
      </div>`).join('') + (A ? '' : `<form class="jg-cform jg-newcom"><input type="text" placeholder="Name (optional)" aria-label="Name (optional)" maxlength="60"><textarea rows="3" placeholder="Comment" aria-label="Comment" required maxlength="4000"></textarea><input class="jg-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="jg-btn solid">Send</button></form>`);
  }
  document.addEventListener('submit', async e => {
    const f = e.target; if (!f.classList.contains('jg-cform')) return;
    e.preventDefault();
    const box = f.closest('.jg-comments'), term = box.dataset.term, text = f.querySelector('textarea').value.trim(); if (!text) return;
    const btn = f.querySelector('button'); btn.disabled = true;
    try {
      let r;
      if (f.dataset.reply) r = await fetch(API + '/comments/' + term, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': pw }, body: JSON.stringify({ reply: f.dataset.reply, text }) });
      else r = await fetch(API + '/comments/' + term, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.querySelector('input[type=text]').value, text, website: f.querySelector('.jg-hp').value }) });
      if (r.status === 429) { toast('Please wait a minute before writing another comment.'); btn.disabled = false; return; }
      if (!r.ok) throw 0;
      toast(f.dataset.reply ? 'Reply posted.' : 'Comment posted.'); loadComments(box);
    } catch (x) { toast('Sending failed. Please try again.'); btn.disabled = false; }
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-cdel]'); if (!b || user !== 'Samuel') return;
    if (b.dataset.arm !== '1') { b.dataset.arm = '1'; b.textContent = 'Click again to delete'; return; }
    const box = b.closest('.jg-comments');
    const r = await fetch(API + '/comments/' + box.dataset.term, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': pw }, body: JSON.stringify({ delete: b.dataset.cdel, replyAt: b.dataset.rat || undefined }) }).catch(() => null);
    if (r && r.ok) { drawComments(box, await r.json()); toast('Deleted.'); } else toast('Deleting failed.');
  });
  function startFrames(el) { el.querySelectorAll('.jg-comments:not([data-loaded])').forEach(b => { b.dataset.loaded = 1; loadComments(b); }); el.querySelectorAll('iframe.jg-cb[data-src]').forEach(f => { f.src = f.dataset.src; f.removeAttribute('data-src'); }); }
  window.addEventListener('message', e => {
    const f = [...document.querySelectorAll('iframe.jg-cb')].find(x => x.contentWindow === e.source);
    if (!f || !e.data) return;
    const key = Object.keys(e.data).find(k => /Example$/.test(k)); if (!key) return;
    const box = f.parentNode; box.innerHTML = e.data[key].svg; box.classList.add('jg-done');
  });

  /* show a term from a link: if it is not in the current view, search for it */
  function go(id) {
    if (!D.terms[id]) return;
    if (!openCard(id, true)) { $('#jgQ').value = D.terms[id].title; render(); openCard(id, true); }
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }

  /* a field saves by itself when you leave it, if it changed; the card's title and description follow */
  document.addEventListener('focusout', e => {
    const f = e.target; if (user !== 'Samuel' || !f.dataset || !f.dataset.k) return;
    const card = f.closest('.jg-card'); if (!card) return;
    const id = card.dataset.id, t = D.terms[id]; if (!t) return;
    const before = JSON.stringify(t);
    collect(id);
    if (!t.title) { t.title = JSON.parse(before).title; f.innerText = t.title; }
    if (JSON.stringify(t) === before) return;
    const sum = card.querySelector('summary .jg-t');
    if (sum) { const d = short(t); sum.innerHTML = `<h2>${esc(t.title)}</h2>${d ? `<p class="jg-d">${esc(d)}</p>` : ''}`; }
    if (f.dataset.k === 'ex') redrawCard(id);
    save('Saved.');
  });
  /* a suggestion becomes Samuel's own once he changes it or presses Enter in it */
  function approve(f) {
    const card = f.closest('.jg-card'), t = card && D.terms[card.dataset.id]; if (!t || !f.classList.contains('jg-sug')) return false;
    f.classList.remove('jg-sug'); t.sug = (t.sug || []).filter(k => k !== f.dataset.k); if (!t.sug.length) delete t.sug;
    return true;
  }
  document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.k) approve(e.target); });
  document.addEventListener('keydown', e => {
    const f = e.target; if (e.key !== 'Enter' || !f.classList || !f.classList.contains('jg-sug')) return;
    e.preventDefault(); approve(f); save('Approved.');
  });
  function collect(id) {
    const t = D.terms[id], el = document.getElementById(id);
    el.querySelectorAll('[data-k]').forEach(f => { const v = (f.tagName === 'INPUT' ? f.value : f.innerText).replace(/ /g, ' ').trim(); if (v) t[f.dataset.k] = v; else if (f.dataset.k !== 'title') { delete t[f.dataset.k]; if (t.sug) { t.sug = t.sug.filter(k => k !== f.dataset.k); if (!t.sug.length) delete t.sug; } } });
  }

  /* ---------- events ---------- */
  document.addEventListener('toggle', e => { const c = e.target; if (c.classList && c.classList.contains('jg-card') && c.open) openCard(c.id, false); }, true);
  document.addEventListener('click', async e => {
    const b = e.target.closest('button, a[data-go]'); if (!b || !b.closest('.jg')) return;
    if (b.dataset.go) { e.preventDefault(); go(b.dataset.go); return; }
    if (b.id === 'jgIn') { const f = $('#jgLogin'); f.hidden = !f.hidden; if (!f.hidden) $('#jgCode').focus(); return; }
    if (b.id === 'jgOut') { user = pw = null; store.set('jargon-user', null); store.set('jargon-pw', null); render(); return; }
    if (b.dataset.view) { viewGroup = b.dataset.view; render(); return; }
    const card = b.closest('.jg-card'), id = card && card.dataset.id;
    if (!id) return;
    const act = b.dataset.act;
    if (act === 'pdf') {
      if (user === 'Samuel') collect(id);
      const old = document.title; document.title = D.terms[id].title;
      card.querySelectorAll('.jg-sec').forEach(s => s.open = true);
      card.classList.add('jg-print'); document.body.classList.add('jg-printing');
      window.print();
      card.classList.remove('jg-print'); document.body.classList.remove('jg-printing'); document.title = old;
      return;
    }
    if (user !== 'Samuel') return;
    if (b.dataset.unlink) { collect(id); const t = D.terms[id]; t.see = (t.see || []).filter(k => k !== b.dataset.unlink); redrawCard(id); save('Link removed.'); return; }
    if (b.dataset.mark) { const on = toggleMark(b.dataset.mark, id); b.classList.toggle('on', on); if (await save(on ? `Marked for ${b.dataset.mark}.` : `Removed from ${b.dataset.mark}.`)) { if (viewGroup === b.dataset.mark && !$('#jgQ').value) render(); } return; }
    if (act === 'del') {
      if (delArm !== id) { delArm = id; redrawCard(id); return; }
      delete D.terms[id]; Object.values(D.terms).forEach(t => t.see && (t.see = t.see.filter(k => k !== id)));
      Object.values(D.weeks).forEach(W => Object.keys(W).forEach(wk => { W[wk] = W[wk].filter(x => x[0] !== id); if (!W[wk].length) delete W[wk]; }));
      delArm = null; if (await save('Deleted.')) render(); return;
    }
    if (act === 'pick') { collect(id); const f = $('#jgFile'); f.dataset.id = id; f.dataset.key = b.dataset.key; f.value = ''; f.click(); return; }
    if (act === 'unimg') { collect(id); const k = b.dataset.key, old = D.terms[id][k]; delete D.terms[id][k]; if (await save('Picture removed.')) { fetch(API + '/img/' + old, { method: 'DELETE', headers: { 'X-Admin': pw } }).catch(() => {}); render(); } return; }
  });
  $('#jgFile').addEventListener('change', async e => {
    const f = e.target.files[0], { id, key } = e.target.dataset; if (!f || !D.terms[id]) return;
    toast('Uploading…');
    try { const old = D.terms[id][key]; D.terms[id][key] = await upload(f); if (await save('Picture added.')) { if (old) fetch(API + '/img/' + old, { method: 'DELETE', headers: { 'X-Admin': pw } }).catch(() => {}); render(); } }
    catch (err) { toast(err.message || 'Upload failed.'); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'jgDate') { markDate = e.target.value || markDate; render(); return; }
    if (e.target.id === 'jgUnpl') { markUnplanned = e.target.checked; return; }
    if (e.target.classList.contains('jg-addlink')) {
      const id = e.target.closest('.jg-card').dataset.id, k = titleId(e.target.value);
      if (!k || k === id) { toast('Pick a term from the list.'); return; }
      collect(id); const t = D.terms[id]; t.see = t.see || []; if (!t.see.includes(k)) t.see.push(k);
      redrawCard(id); save(`Linked to ${D.terms[k].title}.`);
    }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id === 'jgNew') {
      e.preventDefault();
      const title = $('#jgNewTitle').value.trim(); if (!title) return;
      if (titleId(title)) { go(titleId(title)); return; }
      let id = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'term';
      while (D.terms[id]) id += '-2';
      D.terms[id] = { title };
      if (GROUPS.includes(viewGroup)) toggleMark(viewGroup, id);
      if (await save(`${title} created.`)) { $('#jgQ').value = ''; render(); go(id); }
    }
    if (e.target.id === 'jgLogin') {
      e.preventDefault();
      const v = $('#jgCode').value.trim(), g = CODES[v.toLowerCase().replace(/\s+/g, '')], err = $('#jgErr');
      if (g) user = g;
      else {
        let ok = false;
        try { ok = (await fetch(API + '/check', { method: 'POST', headers: { 'X-Admin': v } })).ok; } catch (x) {}
        if (!ok) { err.textContent = 'That name is not on the list.'; err.hidden = false; return; }
        user = 'Samuel'; pw = v; store.set('jargon-pw', v);
      }
      err.hidden = true; $('#jgCode').value = ''; $('#jgLogin').hidden = true; store.set('jargon-user', user);
      render();
    }
  });
  $('#jgQ').addEventListener('input', render);
  window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (D.terms[k]) go(k); });

  (async function start() {
    const u = store.get('jargon-user');
    if (GROUPS.includes(u)) user = u;
    else if (u === 'Samuel' && store.get('jargon-pw')) { user = 'Samuel'; pw = store.get('jargon-pw'); }
    if (await load()) { render(); const k = location.hash.slice(1); if (D.terms[k]) go(k); }
  })();
})();
