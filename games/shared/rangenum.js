/* Every slider shows its number, and the number can be typed.
   Click (tap) the number beside a slider, type a value: Enter or clicking away applies it,
   Escape cancels. The value is kept within the slider's range and snapped to its step, and the
   slider moves with it (the page hears the same input/change events as from dragging).
   The number shown is the page's own one when it has it (an <output> right after the slider,
   .rng-val in a .rng-wrap, .slider-value in the same label); otherwise one is added.
   On a slider:  data-num="off"   no number (e.g. a slider that shows a name)
                 data-num-scale   shown = value × scale (e.g. 100 for a percentage)
                 data-num-unit    text after the number (e.g. "%")                     */
(function(){
  if (window.__rangeNum) return; window.__rangeNum = true;

  const css = '.rnum-click{cursor:text;border-radius:3px;text-decoration:underline dotted color-mix(in srgb,currentColor 50%,transparent);text-underline-offset:3px;font-variant-numeric:tabular-nums}' +
    '@media (hover:hover){.rnum-click:hover{background:color-mix(in srgb,currentColor 9%,transparent)}}' +
    '.rnum-own{display:inline-block;min-width:2.2em;text-align:right;font-size:.86em;color:var(--muted,#6b5e4b);padding:0 2px;white-space:nowrap}' +
    '.rnum-box{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%}' +
    '.rnum-box>input[type=range]{flex:1 1 auto;min-width:0}' +
    '.rnum-below{display:block;text-align:center;margin-top:4px;min-width:0}' +
    '.rnum-hide{display:none !important}' +
    '.rnum-edit{width:52px;font:inherit;font-size:max(12px,.9em);padding:0 4px;margin:0;border:1px solid var(--accent,#8B2A1F);border-radius:4px;background:var(--ground,#FBF7EF);color:var(--ink,#2A2218);text-align:center;outline:none;font-variant-numeric:tabular-nums;box-sizing:border-box}' +
    '@media (pointer:coarse){.rnum-edit{font-size:16px;min-height:28px}}';
  const addCss = () => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s); };

  const scaleOf = inp => +inp.dataset.numScale || 1;
  function places(inp){
    const step = inp.step && inp.step !== 'any' ? +inp.step : 0.01;
    const s = String(+(step * scaleOf(inp)).toFixed(6)), i = s.indexOf('.');
    return i < 0 ? 0 : Math.min(4, s.length - i - 1);
  }
  const shown = inp => String(+((+inp.value) * scaleOf(inp)).toFixed(places(inp))) + (inp.dataset.numUnit || '');

  /* our own numbers follow the slider, whether dragged or set by the page */
  function paint(inp){ const d = inp.__rnum; if (d && d.__rnumOwn && !d.__rnumEditing) d.textContent = shown(inp); }
  const vd = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  if (vd && vd.set) Object.defineProperty(HTMLInputElement.prototype, 'value', {
    configurable: true, enumerable: vd.enumerable, get: vd.get,
    set(v){ vd.set.call(this, v); if (this.__rnum) paint(this); }
  });
  document.addEventListener('input', e => { const t = e.target; if (t && t.__rnum) paint(t); }, true);

  function findDisplay(inp){
    if (inp.dataset.numEl) return document.querySelector(inp.dataset.numEl);
    const w = inp.closest('.rng-wrap'); if (w && w.querySelector('.rng-val')) return w.querySelector('.rng-val');
    const n = inp.nextElementSibling;
    if (n && (n.tagName === 'OUTPUT' || n.classList.contains('slider-value'))) return n;
    const l = inp.closest('label'); if (l) { const o = l.querySelector('output, .slider-value'); if (o) return o; }
    return null;
  }
  function bind(inp){
    if (inp.__rnumDone) return; inp.__rnumDone = true;
    if (inp.dataset.num === 'off') return;
    let d = findDisplay(inp);
    if (!d) {
      d = document.createElement('output'); d.className = 'rnum-own'; d.__rnumOwn = true;
      const cs = getComputedStyle(inp);
      if (cs.position === 'absolute' || cs.position === 'fixed') { d.classList.add('rnum-below'); inp.parentElement.after(d); }
      else {
        const box = document.createElement('span'); box.className = 'rnum-box';
        if (cs.gridArea && cs.gridArea !== 'auto' && cs.gridArea !== 'auto / auto / auto / auto') box.style.gridArea = cs.gridArea;
        inp.before(box); box.appendChild(inp); box.appendChild(d);
      }
    }
    d.classList.add('rnum-click'); d.__rnumInp = inp; inp.__rnum = d;
    if (!d.title) d.title = 'Click to type a value';
    paint(inp);
  }
  let queued = false;
  function scan(){ queued = false; document.querySelectorAll('input[type=range]').forEach(bind); }
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(scan); } };

  function nameOf(inp){
    const a = inp.getAttribute('aria-label'); if (a) return a;
    const l = (inp.id && document.querySelector('label[for="' + inp.id + '"]')) || inp.closest('label');
    return l ? l.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : 'the slider';
  }
  function edit(d, inp){
    if (d.__rnumEditing) return;
    const sc = scaleOf(inp), mn = +inp.min || 0, mx = inp.max === '' ? 100 : +inp.max;
    const ed = document.createElement('input');
    ed.type = 'text'; ed.className = 'rng-edit rnum-edit'; ed.autocomplete = 'off'; ed.spellcheck = false;
    if (Math.min(mn, mx) * sc >= 0) ed.inputMode = 'decimal';
    ed.value = String(+((+inp.value) * sc).toFixed(Math.max(places(inp), 2)));
    ed.setAttribute('aria-label', 'Type a value for ' + nameOf(inp) + ' (' + +(mn * sc).toFixed(4) + ' to ' + +(mx * sc).toFixed(4) + ')');
    ed.title = 'From ' + +(mn * sc).toFixed(4) + ' to ' + +(mx * sc).toFixed(4) + ' · Enter applies, Esc cancels';
    ed.style.width = Math.max(52, Math.min(90, d.offsetWidth + 18)) + 'px';
    d.__rnumEditing = true; d.classList.add('rnum-hide'); d.after(ed);
    ed.focus({preventScroll: true}); ed.select();
    let done = false;
    const finish = commit => {
      if (done) return; done = true;
      const raw = ed.value.trim().replace(',', '.').replace(/[^0-9.+\-eE]/g, '');
      ed.remove(); d.classList.remove('rnum-hide'); d.__rnumEditing = false;
      let v = parseFloat(raw);
      if (commit && isFinite(v)) {
        v /= sc;
        const step = inp.step && inp.step !== 'any' ? +inp.step : 0;
        v = Math.min(mx, Math.max(mn, v));
        if (step > 0) v = Math.min(mx, Math.max(mn, mn + Math.round((v - mn) / step) * step));
        v = +v.toFixed(10);
        if (v !== +inp.value) {
          inp.value = String(v);
          inp.dispatchEvent(new Event('input', {bubbles: true}));
          inp.dispatchEvent(new Event('change', {bubbles: true}));
        }
      }
      paint(inp);
    };
    const stop = ev => ev.stopPropagation();
    ed.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
      else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
    });
    ['keyup', 'keypress', 'pointerdown', 'mousedown', 'click', 'dblclick', 'touchstart'].forEach(t => ed.addEventListener(t, stop));
    ed.addEventListener('blur', () => finish(true));
  }
  document.addEventListener('click', e => {
    const d = e.target && e.target.closest && e.target.closest('.rnum-click'); if (!d || !d.__rnumInp) return;
    const inp = d.__rnumInp; if (inp.disabled) return;
    e.preventDefault(); e.stopPropagation();
    edit(d, inp);
  }, true);

  function start(){
    addCss(); scan();
    new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches('input[type=range]') || n.querySelector('input[type=range]'))) { later(); return; } })
      .observe(document.documentElement, {childList: true, subtree: true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.RangeNum = {scan};
})();
