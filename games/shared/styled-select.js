/* Styled drop-downs (Samuel 2026-11-14: "only in style drop down menus").
   Every <select> on the page keeps working as before (its value, its options, its 'change' events, code that reads or sets it),
   but its list opens as a menu in the page's own look instead of the system's. One script, no markup changes: a press on any
   select is caught before the browser opens its own list.
   Mouse: press opens, click chooses. Touch: one tap opens, one tap chooses. Keyboard: Arrow keys, Enter or Space open; arrows,
   Home, End, Page Up/Down and typing move; Enter or Space chooses; Escape or Tab closes. Long lists scroll; the menu sits over
   everything (fixed, at the end of <body>) and closes on a tap or click outside, on scrolling the page or resizing it. */
(function(){
  if (window.StyledSelect) return;
  const css = `
select:not([multiple]):not([size]),select[size="1"]{-webkit-appearance:none;-moz-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%237D6F5B' d='M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z'/%3E%3C/svg%3E") !important;
  background-repeat:no-repeat !important;background-position:right 7px center !important;background-size:11px 11px !important;padding-right:24px !important;cursor:pointer}
select:disabled{cursor:not-allowed}
html.dark select:not([multiple]){background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%23A5957B' d='M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z'/%3E%3C/svg%3E") !important}
select::-ms-expand{display:none}
.ssel-menu{position:fixed;z-index:2147483000;margin:0;padding:4px;list-style:none;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;scrollbar-width:thin;color:var(--text,#2A2218);background:var(--surface,#F4EDE0);
  border:1px solid var(--line,#D6C8B0);border-radius:6px;box-shadow:0 10px 28px -10px rgba(0,0,0,.35);font-size:16px;line-height:1.3;
  text-align:left;-webkit-user-select:none;user-select:none;touch-action:pan-y}
html.dark .ssel-menu{box-shadow:0 14px 34px -10px rgba(0,0,0,.85)}
.ssel-menu:focus{outline:none}
.ssel-menu li{display:block;padding:6px 12px 6px 10px;border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ssel-menu li.grp{cursor:default;padding:8px 10px 3px;font-size:13.5px;font-style:italic;color:var(--muted,#7D6F5B)}
.ssel-menu li.in{padding-left:20px}
.ssel-menu li[aria-disabled="true"]{opacity:.45;cursor:default}
.ssel-menu li[aria-selected="true"]{background:var(--accent,var(--mark,#8E2A1E));color:var(--accent-ink,#F7F2E6)}
.ssel-menu li.act:not([aria-selected="true"]){background:color-mix(in srgb,var(--accent,var(--mark,#8E2A1E)) 14%,transparent)}
.ssel-menu li.act[aria-selected="true"]{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--accent-ink,#F7F2E6) 55%,transparent)}
@media (hover:hover){.ssel-menu li:not(.grp):not([aria-disabled="true"]):not([aria-selected="true"]):hover{background:color-mix(in srgb,var(--accent,var(--mark,#8E2A1E)) 12%,transparent)}}
@media (pointer:coarse){.ssel-menu li{padding:10px 14px 10px 12px}}
`;
  const style = document.createElement('style'); style.id = 'ssel-css'; style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  let menu = null, owner = null, items = [], act = -1, typed = '', typedAt = 0, uid = 0;
  const usable = s => s && s.tagName === 'SELECT' && !s.multiple && !(s.size > 1) && !s.hasAttribute('data-native');
  const pick = it => it && !it.dis;

  function build(s){
    menu = document.createElement('ul');
    menu.className = 'ssel-menu'; menu.setAttribute('role', 'listbox'); menu.tabIndex = -1;
    menu.id = 'ssel-' + (++uid);
    const lab = s.getAttribute('aria-label') || (s.labels && s.labels[0] && s.labels[0].textContent) || '';
    if (lab) menu.setAttribute('aria-label', lab.trim());
    items = [];
    const add = (o, inGroup) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option'); li.id = menu.id + '-' + items.length;
      li.textContent = o.label || o.text;
      if (o.dataset && o.dataset.font) li.style.fontFamily = o.dataset.font;   /* a font list shows each name in its own font */
      if (o.title) li.title = o.title;
      const dis = o.disabled || (o.parentNode && o.parentNode.tagName === 'OPTGROUP' && o.parentNode.disabled);
      if (dis) li.setAttribute('aria-disabled', 'true');
      if (o.hidden) li.hidden = true;
      if (inGroup) li.classList.add('in');
      li.setAttribute('aria-selected', String(o.selected));
      li.dataset.i = items.length;
      items.push({li, o, dis: !!(dis || o.hidden)});
      menu.appendChild(li);
    };
    for (const ch of s.children) {
      if (ch.tagName === 'OPTGROUP') {
        const g = document.createElement('li'); g.className = 'grp'; g.setAttribute('role', 'presentation'); g.textContent = ch.label; menu.appendChild(g);
        for (const o of ch.children) if (o.tagName === 'OPTION') add(o, true);
      } else if (ch.tagName === 'OPTION') add(ch, false);
    }
    const cs = getComputedStyle(s);
    menu.style.fontFamily = cs.fontFamily;
    menu.addEventListener('mousedown', e => e.preventDefault());      /* the select keeps the focus (its menu stays open) */
    menu.addEventListener('click', e => {
      const li = e.target.closest('li[role=option]'); if (!li) return;
      const it = items[+li.dataset.i]; if (!pick(it)) return;
      e.stopPropagation(); choose(it);
    });
    menu.addEventListener('mousemove', e => {
      const li = e.target.closest('li[role=option]'); if (li && pick(items[+li.dataset.i])) setAct(+li.dataset.i, false);
    });
    document.body.appendChild(menu);
  }
  function place(){
    if (!menu || !owner) return;
    const r = owner.getBoundingClientRect(), vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight;
    const top0 = 0, h0 = vh;
    menu.style.minWidth = Math.max(r.width, 120) + 'px';
    menu.style.maxWidth = (vw - 16) + 'px';
    menu.style.maxHeight = 'none'; menu.style.left = '0px'; menu.style.top = '0px';
    const mh = menu.scrollHeight + 2, mw = menu.offsetWidth;
    const below = top0 + h0 - r.bottom - 8, above = r.top - top0 - 8;
    let top, maxH;
    if (mh <= below || below >= above) { top = r.bottom + 2; maxH = Math.max(120, below); }
    else { maxH = above; top = Math.max(top0 + 8, r.top - 2 - Math.min(mh, maxH)); }
    menu.style.maxHeight = Math.floor(maxH) + 'px';
    let left = Math.min(r.left, vw - 8 - mw); left = Math.max(8, left);
    menu.style.left = Math.round(left) + 'px'; menu.style.top = Math.round(top) + 'px';
  }
  function setAct(i, scroll = true){
    if (items[act]) items[act].li.classList.remove('act');
    act = i;
    if (!items[act]) return;
    items[act].li.classList.add('act');
    if (owner) owner.setAttribute('aria-activedescendant', items[act].li.id);
    if (scroll) {
      const li = items[act].li, t = li.offsetTop, b = t + li.offsetHeight;
      if (t < menu.scrollTop + 4) menu.scrollTop = t - 4;
      else if (b > menu.scrollTop + menu.clientHeight - 4) menu.scrollTop = b - menu.clientHeight + 4;
    }
  }
  function open(s, focus){
    if (owner === s && menu) return;
    close();
    owner = s; build(s);
    owner.setAttribute('aria-expanded', 'true'); owner.setAttribute('aria-controls', menu.id);
    document.documentElement.classList.add('ssel-open');
    if (focus && document.activeElement !== s) { try { s.focus({preventScroll: true}); } catch (e) { s.focus(); } }
    place();
    const cur = items.findIndex(it => it.o.selected);
    if (cur >= 0) { setAct(cur, false); const li = items[cur].li; menu.scrollTop = Math.max(0, li.offsetTop - (menu.clientHeight - li.offsetHeight) / 2); }
    else { act = -1; }
  }
  function close(){
    if (!menu) return;
    menu.remove(); menu = null; items = []; act = -1;
    if (owner) { owner.setAttribute('aria-expanded', 'false'); owner.removeAttribute('aria-activedescendant'); owner.removeAttribute('aria-controls'); }
    owner = null;
    document.documentElement.classList.remove('ssel-open');
  }
  function choose(it){
    const s = owner; close();
    if (!s || it.o.selected) return;
    it.o.selected = true;
    s.dispatchEvent(new Event('input', {bubbles: true}));
    s.dispatchEvent(new Event('change', {bubbles: true}));
  }
  function step(d){
    if (!items.length) return;
    let i = act < 0 ? (d > 0 ? -1 : items.length) : act;
    for (let n = 0; n < items.length; n++) { i += d; if (i < 0 || i >= items.length) return; if (pick(items[i])) { setAct(i); return; } }
  }
  function edge(first){
    const order = first ? items.map((_, i) => i) : items.map((_, i) => items.length - 1 - i);
    for (const i of order) if (pick(items[i])) { setAct(i); return; }
  }
  function page(d){
    const per = Math.max(1, Math.floor(menu.clientHeight / ((items[0] && items[0].li.offsetHeight) || 30)) - 1);
    for (let n = 0; n < per; n++) step(d);
  }
  function typeAhead(ch){
    const now = Date.now(); typed = (now - typedAt < 700 ? typed : '') + ch.toLowerCase(); typedAt = now;
    const start = typed.length === 1 ? act + 1 : Math.max(act, 0);
    for (let n = 0; n < items.length; n++) {
      const i = (start + n) % items.length, it = items[i];
      if (pick(it) && it.li.textContent.trim().toLowerCase().startsWith(typed)) { setAct(i); return; }
    }
  }

  /* mouse: the browser's own list never opens */
  document.addEventListener('mousedown', e => {
    if (menu && !menu.contains(e.target) && e.target !== owner) close();
    const s = e.target.closest && e.target.closest('select');
    if (!usable(s) || e.button !== 0) return;
    e.preventDefault();
    if (s.disabled) return;
    if (owner === s) { close(); return; }
    open(s, true);
  }, true);
  /* touch: one tap opens it; a swipe that starts on it still scrolls the row or the page */
  let tx = 0, ty = 0, tmoved = false, tsel = null;
  document.addEventListener('touchstart', e => {
    const t = e.touches[0]; tx = t.clientX; ty = t.clientY; tmoved = false;
    tsel = e.target.closest && e.target.closest('select');
    if (menu && !menu.contains(e.target) && e.target !== owner) close();
  }, {capture: true, passive: true});
  document.addEventListener('touchmove', e => {
    const t = e.touches[0]; if (Math.abs(t.clientX - tx) > 8 || Math.abs(t.clientY - ty) > 8) tmoved = true;
  }, {capture: true, passive: true});
  document.addEventListener('touchend', e => {
    const s = tsel; tsel = null;
    if (!usable(s)) return;
    e.preventDefault();                                   /* no focus, no system picker, no mouse events after it */
    if (tmoved || s.disabled) return;
    if (owner === s) { close(); return; }
    open(s, false);
  }, {capture: true, passive: false});
  /* a click a browser still sends to the select (some fire it without a mousedown) opens nothing of its own */
  document.addEventListener('click', e => {
    if (menu && !menu.contains(e.target) && e.target !== owner && !(e.target.closest && e.target.closest('select') === owner)) close();
  }, true);
  /* keyboard */
  document.addEventListener('keydown', e => {
    const s = e.target;
    if (menu && s === owner) {
      const k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); if (e.altKey) return; step(1); }
      else if (k === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); if (e.altKey) { close(); return; } step(-1); }
      else if (k === 'Home') { e.preventDefault(); e.stopPropagation(); edge(true); }
      else if (k === 'End') { e.preventDefault(); e.stopPropagation(); edge(false); }
      else if (k === 'PageDown') { e.preventDefault(); e.stopPropagation(); page(1); }
      else if (k === 'PageUp') { e.preventDefault(); e.stopPropagation(); page(-1); }
      else if (k === 'Enter' || (k === ' ' && !(Date.now() - typedAt < 700 && typed))) { e.preventDefault(); e.stopPropagation(); if (pick(items[act])) choose(items[act]); else close(); }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (k === 'Tab') close();
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); typeAhead(k); }
      return;
    }
    if (!usable(s) || s.disabled) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'F4') {
      e.preventDefault(); e.stopPropagation(); open(s, true);
    }
  }, true);
  document.addEventListener('focusout', e => { if (menu && e.target === owner) setTimeout(() => { if (menu && document.activeElement !== owner) close(); }, 0); }, true);
  document.addEventListener('scroll', e => { if (menu && !(e.target === menu || (e.target.nodeType === 1 && menu.contains(e.target)))) close(); }, true);
  addEventListener('resize', () => { if (menu) close(); });
  addEventListener('blur', () => { if (menu) close(); });
  window.StyledSelect = {close, isOpen: () => !!menu, owner: () => owner, menu: () => menu};
})();
