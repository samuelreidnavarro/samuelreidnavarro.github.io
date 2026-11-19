/* Scriptorium add-on: ReDiX Contrapunctus.
   Two-voice counterpoint analysis per piece on top of the Scriptorium engine.
   Select any two voices of the open piece, choose whether to analyze all vertical slices or only
   notes struck together (filtering out passing notes), and click Run Analysis to generate two
   interactive SVG pie charts (Harmonic Intervals and Contrapuntal Motions) with counts and percentages. */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const NOTE_SEMI = [0, 2, 4, 5, 7, 9, 11];
  const INT_NAMES = {
    1: 'Unisons', 2: 'Seconds', 3: 'Thirds', 4: 'Fourths',
    5: 'Fifths', 6: 'Sixths', 7: 'Sevenths', 8: 'Octaves'
  };
  const INT_SHORT = {
    1: '1 (Unison)', 2: '2nd', 3: '3rd', 4: '4th',
    5: '5th', 6: '6th', 7: '7th', 8: '8ve (Octave)'
  };
  const INT_COLORS = {
    3: '#8E2A1E',  /* Thirds — deep crimson */
    6: '#C58632',  /* Sixths — warm ochre */
    5: '#2F5D7C',  /* Fifths — slate blue */
    8: '#3D6B4F',  /* Octaves — forest green */
    1: '#74537A',  /* Unisons — plum */
    4: '#A6634B',  /* Fourths — terracotta */
    2: '#7D6F5B',  /* Seconds — warm umber */
    7: '#4A433B'   /* Sevenths — charcoal */
  };
  const MOTION_ORDER = ['contrary', 'oblique', 'similar', 'parallel'];
  const MOTION_META = {
    contrary: {label: 'Contrary motion', color: '#2F5D7C', desc: 'Voices move in opposite directions'},
    oblique:  {label: 'Oblique motion',  color: '#3D6B4F', desc: 'One voice holds or repeats while the other moves'},
    similar:  {label: 'Similar motion',  color: '#C58632', desc: 'Same direction by different intervals'},
    parallel: {label: 'Parallel motion', color: '#8E2A1E', desc: 'Same direction by the same diatonic interval'}
  };

  let lastResult = null;
  let activeHighlight = null; /* {kind: 'int'|'mot', key: string, idx: number, items: [...]} */

  /* Styles for the ReDiX Contrapunctus analysis dashboard */
  document.head.insertAdjacentHTML('beforeend', `<style>
    .cp-panel {
      max-width: 74rem; margin: 56px auto 12px; padding: 1rem 1.25rem 1.15rem;
      border: 1px solid var(--line); border-radius: 10px;
      background: color-mix(in srgb, var(--surface) 84%, var(--ground));
      box-shadow: 0 8px 24px -14px rgba(42,34,24,.22);
      color: var(--text); display: grid; gap: .95rem; position: relative; z-index: 12;
    }
    .cp-panel[hidden] { display: none !important; }
    @media (max-width: 700px) { .cp-panel { margin-top: 52px; padding: .85rem .9rem; } }
    .cp-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem 1rem; }
    .cp-head h2 { margin: 0; font-family: "IM Fell Double Pica", "IM Fell English", Georgia, serif; font-weight: 400; font-size: 1.4rem; }
    .cp-head .cp-sub { font-size: .96rem; color: var(--muted); font-style: italic; }
    .cp-controls { display: flex; flex-wrap: wrap; gap: .6rem 1rem; align-items: flex-end; }
    .cp-fld { display: grid; gap: .2rem; font-size: .95rem; }
    .cp-fld label { color: var(--muted); font-style: italic; font-size: .9rem; }
    .cp-fld select {
      font: inherit; font-size: 1rem; color: var(--text); background: var(--ground);
      border: 1px solid var(--line); border-radius: 6px; padding: .3rem .55rem; min-height: 36px; min-width: 9.5rem;
    }
    .cp-checks { display: flex; flex-wrap: wrap; gap: .35rem 1.25rem; align-items: center; font-size: .98rem; }
    .cp-checks label { display: inline-flex; align-items: center; gap: .38rem; cursor: pointer; }
    .cp-checks input[type=checkbox] { accent-color: var(--accent); width: 1rem; height: 1rem; }
    .cp-btn {
      font: inherit; font-size: 1.04rem; padding: .38rem 1.15rem; min-height: 36px; height: auto;
      border-radius: 6px; border: 1px solid var(--accent); background: var(--accent); color: var(--accent-ink); cursor: pointer;
    }
    .cp-btn:hover:not(:disabled) { background: #6F2017; color: var(--accent-ink); }
    .cp-btn.light { background: var(--ground); color: var(--text); border-color: var(--line); }
    .cp-btn.light:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .cp-btn.small { font-size: .9rem; padding: .18rem .6rem; min-height: 28px; }
    .cp-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); gap: 1rem 1.4rem; }
    .cp-chart-card {
      background: var(--ground); border: 1px solid var(--line); border-radius: 8px;
      padding: .9rem 1rem; display: grid; gap: .7rem; align-content: start;
    }
    .cp-chart-card h3 { margin: 0; font-family: "IM Fell Double Pica", "IM Fell English", Georgia, serif; font-weight: 400; font-size: 1.22rem; display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
    .cp-chart-card h3 small { font-family: "IM Fell English", Georgia, serif; font-size: .9rem; font-style: italic; color: var(--muted); }
    .cp-chart-body { display: grid; grid-template-columns: 164px minmax(0, 1fr); gap: .8rem 1rem; align-items: center; }
    @media (max-width: 560px) { .cp-chart-body { grid-template-columns: 1fr; justify-items: center; } }
    .cp-pie { width: 160px; height: 160px; display: block; overflow: visible; }
    .cp-pie path { cursor: pointer; transition: transform .14s ease, opacity .14s ease; transform-origin: 80px 80px; }
    .cp-pie path:hover, .cp-pie path.active { transform: scale(1.045); }
    .cp-pie.dimmed path:not(.active) { opacity: .42; }
    .cp-pie-center { font-family: "IM Fell Double Pica", "IM Fell English", Georgia, serif; fill: var(--text); text-anchor: middle; pointer-events: none; }
    .cp-pie-sub { font-family: "IM Fell English", Georgia, serif; font-style: italic; fill: var(--muted); text-anchor: middle; pointer-events: none; }
    table.cp-leg { width: 100%; border-collapse: collapse; font-size: .97rem; }
    table.cp-leg th { text-align: left; font-weight: 400; font-style: italic; color: var(--muted); font-size: .88rem; padding: .15rem .3rem; border-bottom: 1px solid var(--line); }
    table.cp-leg td { padding: .24rem .3rem; border-bottom: 1px dotted var(--line); }
    table.cp-leg tr.cp-row { cursor: pointer; }
    table.cp-leg tr.cp-row:hover td, table.cp-leg tr.cp-row.active td { background: color-mix(in srgb, var(--accent) 10%, transparent); }
    table.cp-leg td.num, table.cp-leg th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .cp-sw { display: inline-block; width: 11px; height: 11px; border-radius: 3px; vertical-align: -1px; margin-right: 6px; }
    .cp-foot { font-size: .92rem; color: var(--muted); font-style: italic; line-height: 1.4; }
    .cp-nav { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; padding: .45rem .7rem; border-radius: 7px; background: color-mix(in srgb, var(--accent) 9%, var(--ground)); border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); font-size: .96rem; }
    .cp-nav[hidden] { display: none !important; }
    #pages g.cp-hi use, #pages g.cp-hi .ink { fill: var(--accent) !important; color: var(--accent) !important; }
    #pages g.cp-hi .ledger { stroke: var(--accent) !important; }
    #pages g.cp-hi-cur use, #pages g.cp-hi-cur .ink { fill: #C58632 !important; color: #C58632 !important; }
    #pages g.cp-hi-cur .ledger { stroke: #C58632 !important; }
    .viewer.frame { padding-top: 12px !important; }
    #cpToggleBtn[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  </style>`);

  /* Insert the Analysis toggle button in the top Scriptorium toolbar */
  const voicesPod = document.getElementById('popVoices') && document.getElementById('popVoices').parentNode;
  let toggleBtn = null;
  if (voicesPod && voicesPod.parentNode) {
    const pod = document.createElement('div');
    pod.className = 'podg';
    pod.innerHTML = `<button type="button" class="tb" id="cpToggleBtn" aria-pressed="true" title="Show or hide the two-voice counterpoint analysis panel">Analysis</button>`;
    voicesPod.parentNode.insertBefore(pod, voicesPod);
    toggleBtn = pod.querySelector('#cpToggleBtn');
  }

  /* Insert the Counterpoint Analysis panel right above .viewwrap */
  const viewWrap = document.querySelector('.viewwrap');
  const panel = document.createElement('section');
  panel.className = 'cp-panel';
  panel.id = 'cpPanel';
  panel.setAttribute('aria-label', 'Counterpoint analysis');
  panel.innerHTML = `
    <div class="cp-head">
      <div>
        <h2>ReDiX Contrapunctus — Two-Voice Analysis</h2>
        <div class="cp-sub" id="cpPieceTitle">Open any piece from Open → Repertoire (or Open file), pick two voices, and click Run Analysis.</div>
      </div>
      <div style="display:flex;gap:.45rem;align-items:center">
        <button type="button" class="cp-btn light small" id="cpSwapBtn" title="Swap Voice 1 and Voice 2">Swap voices</button>
        <button type="button" class="cp-btn" id="cpRunBtn">Run Analysis</button>
      </div>
    </div>

    <div class="cp-controls">
      <div class="cp-fld">
        <label for="cpV1">Voice 1</label>
        <select id="cpV1"></select>
      </div>
      <div class="cp-fld">
        <label for="cpV2">Voice 2</label>
        <select id="cpV2"></select>
      </div>
      <div class="cp-fld">
        <label for="cpOnset">Passing notes / onsets</label>
        <select id="cpOnset">
          <option value="all" selected>All vertical slices (includes passing notes &amp; oblique)</option>
          <option value="struck">Struck together only (filters out passing notes)</option>
          <option value="beat">Strong beats only (every semibreve)</option>
        </select>
      </div>
      <div class="cp-fld">
        <label for="cpFold">Interval display</label>
        <select id="cpFold">
          <option value="simple" selected>Simple (Unison, 2nd–7th, Octave)</option>
          <option value="compound">Compound (keeps 10ths, 12ths, etc.)</option>
        </select>
      </div>
    </div>

    <div class="cp-checks">
      <label><input type="checkbox" id="cpQual"> split major / minor &amp; diminished / augmented qualities</label>
      <label><input type="checkbox" id="cpSolo"> solo these two voices in playback</label>
    </div>

    <div class="cp-nav" id="cpNav" hidden>
      <span id="cpNavText"></span>
      <button type="button" class="cp-btn light small" id="cpPrev">← Prev</button>
      <button type="button" class="cp-btn light small" id="cpNext">Next →</button>
      <button type="button" class="cp-btn light small" id="cpClearHi">Clear highlight</button>
    </div>

    <div class="cp-charts" id="cpCharts"></div>
  `;
  if (viewWrap && viewWrap.parentNode) viewWrap.parentNode.insertBefore(panel, viewWrap);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggleBtn.setAttribute('aria-pressed', String(open));
      postHeight();
    });
  }

  /* ---------------- Musicological analysis engine ---------------- */
  function stepToSemi(step, alt){
    const oct = Math.floor(step / 7), l = ((step % 7) + 7) % 7;
    return oct * 12 + NOTE_SEMI[l] + (alt || 0);
  }

  /* Merge tied continuations in a voice into sounding note spans */
  function voiceSpans(v){
    const spans = [];
    for (let i = 0; i < v.events.length; i++) {
      const e = v.events[i];
      if (e.rest) continue;
      if ((e.tieEnd || e.tieMid) && spans.length && Math.abs(spans[spans.length - 1].t1 - e.t) < EPS && spans[spans.length - 1].step === e.step) {
        spans[spans.length - 1].t1 = rt(e.t + e.d);
        spans[spans.length - 1].eis.push(i);
        continue;
      }
      const key = keyAt(v, e.t);
      const letter = LETTERS[((e.step % 7) + 7) % 7];
      const sig = key[letter] || 0;
      const alt = (e.alt !== null && e.alt !== undefined) ? e.alt : sig;
      spans.push({
        t0: e.t,
        t1: rt(e.t + e.d),
        step: e.step,
        alt,
        semi: stepToSemi(e.step, alt),
        eis: [i]
      });
    }
    return spans;
  }

  function findSpanAt(spans, t){
    let lo = 0, hi = spans.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, s = spans[mid];
      if (t < s.t0 - EPS) hi = mid - 1;
      else if (t >= s.t1 - EPS) lo = mid + 1;
      else return s;
    }
    return null;
  }

  function intervalQuality(rawStep, rawSemi){
    const octs = Math.floor(rawStep / 7), baseStep = rawStep % 7, baseSemi = rawSemi - octs * 12;
    const EXP = [0, 2, 4, 5, 7, 9, 11][baseStep];
    const perf = baseStep === 0 || baseStep === 3 || baseStep === 4;
    const diff = baseSemi - EXP;
    if (perf) return diff === 0 ? 'P' : diff > 0 ? 'A'.repeat(diff) : 'd'.repeat(-diff);
    return diff === 0 ? 'M' : diff === -1 ? 'm' : diff > 0 ? 'A'.repeat(diff) : 'd'.repeat(-diff - 1);
  }

  function classifyInterval(rawStep, rawSemi, compound, withQual){
    const simpleNum = rawStep === 0 ? 1 : (rawStep % 7 === 0 ? 8 : (rawStep % 7) + 1);
    const num = compound ? (rawStep + 1) : simpleNum;
    const qual = withQual ? intervalQuality(rawStep, rawSemi) : '';
    const key = withQual ? `${qual}${num}` : String(num);
    let label;
    if (withQual) {
      const QNAME = {P: 'Perfect', M: 'Major', m: 'Minor', d: 'Diminished', A: 'Augmented'};
      const qWord = QNAME[qual] || qual;
      const nWord = num === 1 ? 'unison' : num === 8 ? 'octave' : num === 2 ? '2nd' : num === 3 ? '3rd' : `${num}th`;
      label = `${qWord} ${nWord} (${key})`;
    } else if (!compound) {
      label = `${INT_NAMES[simpleNum]} (${simpleNum === 1 ? '1' : simpleNum === 8 ? '8' : simpleNum})`;
    } else {
      label = num === 1 ? 'Unison (1)' : num === 8 ? 'Octave (8)' : `${num}${num % 10 === 2 && num !== 12 ? 'nd' : num % 10 === 3 && num !== 13 ? 'rd' : 'th'}`;
    }
    const baseColor = INT_COLORS[simpleNum] || '#666';
    return {key, label, simpleNum, color: baseColor};
  }

  function analyzePair(vi1, vi2, onsetMode, foldMode, withQual){
    const v1 = piece.voices[vi1], v2 = piece.voices[vi2];
    const s1 = voiceSpans(v1), s2 = voiceSpans(v2);
    const compound = foldMode === 'compound';

    /* collect candidate sample times */
    let times = [];
    if (onsetMode === 'beat') {
      const end = Math.max(v1.end || 0, v2.end || 0);
      for (let t = 0; t < end - EPS; t += 1) times.push(rt(t));
    } else {
      const set = new Set();
      s1.forEach(s => set.add(s.t0));
      s2.forEach(s => set.add(s.t0));
      times = [...set].sort((a, b) => a - b);
    }

    const slices = [];
    for (const t of times) {
      const a = findSpanAt(s1, t), b = findSpanAt(s2, t);
      if (!a || !b) continue;
      const hitA = Math.abs(a.t0 - t) < EPS, hitB = Math.abs(b.t0 - t) < EPS;
      if (onsetMode === 'struck' && !(hitA && hitB)) continue;
      const rawStep = Math.abs(a.step - b.step);
      const rawSemi = Math.abs(a.semi - b.semi);
      const info = classifyInterval(rawStep, rawSemi, compound, withQual);
      slices.push({t, a, b, hitA, hitB, rawStep, rawSemi, info});
    }

    /* Count intervals */
    const intMap = new Map();
    let impCons = 0, perfCons = 0, diss = 0;
    for (const sl of slices) {
      const k = sl.info.key;
      if (!intMap.has(k)) intMap.set(k, {key: k, label: sl.info.label, color: sl.info.color, simpleNum: sl.info.simpleNum, items: []});
      intMap.get(k).items.push(sl);
      const sn = sl.info.simpleNum;
      if (sn === 3 || sn === 6) impCons++;
      else if (sn === 1 || sn === 5 || sn === 8) perfCons++;
      else diss++;
    }

    /* Count motions between consecutive slices (skipping transitions broken by a rest in either voice) */
    const motMap = new Map();
    MOTION_ORDER.forEach(m => motMap.set(m, {key: m, label: MOTION_META[m].label, color: MOTION_META[m].color, desc: MOTION_META[m].desc, items: []}));
    let staticCount = 0, par5 = 0, par8 = 0;
    for (let i = 1; i < slices.length; i++) {
      const prev = slices[i - 1], cur = slices[i];
      /* ensure both voices remained continuous (no rest gap between prev and cur) */
      if (cur.a.t0 > prev.a.t1 + EPS || cur.b.t0 > prev.b.t1 + EPS) continue;
      const dA = cur.a.step - prev.a.step;
      const dB = cur.b.step - prev.b.step;
      if (dA === 0 && dB === 0) { staticCount++; continue; }
      let mKey;
      if (dA === 0 || dB === 0) mKey = 'oblique';
      else if ((dA > 0 && dB < 0) || (dA < 0 && dB > 0)) mKey = 'contrary';
      else if (dA === dB) {
        mKey = 'parallel';
        if (prev.info.simpleNum === 5 && cur.info.simpleNum === 5) par5++;
        if ((prev.info.simpleNum === 8 || prev.info.simpleNum === 1) && (cur.info.simpleNum === 8 || cur.info.simpleNum === 1)) par8++;
      } else mKey = 'similar';
      motMap.get(mKey).items.push({prev, cur, t: cur.t, a: cur.a, b: cur.b});
    }

    const intGroups = [...intMap.values()].sort((a, b) => b.items.length - a.items.length || a.simpleNum - b.simpleNum);
    const motGroups = MOTION_ORDER.map(k => motMap.get(k));
    const totalInts = slices.length;
    const totalMots = motGroups.reduce((s, g) => s + g.items.length, 0);

    return {
      vi1, vi2, v1Name: v1.name, v2Name: v2.name,
      onsetMode, foldMode, withQual,
      intGroups, motGroups, totalInts, totalMots,
      impCons, perfCons, diss, staticCount, par5, par8
    };
  }

  /* ---------------- SVG Donut / Pie Chart Renderer ---------------- */
  function polar(cx, cy, r, deg){
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function pieSvg(groups, total, kind, centerWord){
    const cx = 80, cy = 80, R = 74, rIn = 34;
    let paths = '';
    if (!total) {
      paths = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="18" opacity=".45"/>`;
    } else {
      const nonZero = groups.filter(g => g.items.length > 0);
      let angle = 0;
      for (const g of nonZero) {
        const frac = g.items.length / total;
        const sweep = frac * 360;
        const pct = (frac * 100).toFixed(1);
        const title = `${g.label}: ${g.items.length} (${pct}%)`;
        if (nonZero.length === 1 || sweep >= 359.99) {
          paths += `<path data-kind="${kind}" data-key="${esc(g.key)}" fill="${g.color}" d="M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} Z M ${cx} ${cy - rIn} A ${rIn} ${rIn} 0 1 0 ${cx - 0.01} ${cy - rIn} Z" fill-rule="evenodd"><title>${esc(title)}</title></path>`;
        } else {
          const a1 = angle, a2 = angle + sweep;
          const [x1, y1] = polar(cx, cy, R, a1);
          const [x2, y2] = polar(cx, cy, R, a2);
          const [x3, y3] = polar(cx, cy, rIn, a2);
          const [x4, y4] = polar(cx, cy, rIn, a1);
          const large = sweep > 180 ? 1 : 0;
          const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
          paths += `<path data-kind="${kind}" data-key="${esc(g.key)}" fill="${g.color}" stroke="var(--ground)" stroke-width="1.2" d="${d}"><title>${esc(title)}</title></path>`;
        }
        angle += sweep;
      }
    }
    return `<svg class="cp-pie" viewBox="0 0 160 160" role="img" aria-label="${esc(centerWord)} pie chart">
      ${paths}
      <text class="cp-pie-center" x="${cx}" y="${cy + 3}" font-size="22">${total.toLocaleString('en')}</text>
      <text class="cp-pie-sub" x="${cx}" y="${cy + 18}" font-size="11.5">${esc(centerWord)}</text>
    </svg>`;
  }

  function legendHtml(groups, total, kind){
    if (!total) return `<p class="cp-foot">No overlapping notes found for this voice pair under the selected filter.</p>`;
    let h = `<table class="cp-leg"><thead><tr><th>Category</th><th class="num">Count</th><th class="num">%</th></tr></thead><tbody>`;
    for (const g of groups) {
      const cnt = g.items.length;
      const pct = total ? (cnt * 100 / total).toFixed(1) : '0.0';
      h += `<tr class="cp-row" data-kind="${kind}" data-key="${esc(g.key)}" title="${esc(g.desc || 'Click to highlight in score')}">` +
        `<td><span class="cp-sw" style="background:${g.color}"></span>${esc(g.label)}</td>` +
        `<td class="num">${cnt.toLocaleString('en')}</td>` +
        `<td class="num">${pct}%</td></tr>`;
    }
    h += `</tbody></table>`;
    return h;
  }

  /* ---------------- Highlighting selected intervals/motions on the Scriptorium score ---------------- */
  function clearHighlight(){
    activeHighlight = null;
    document.querySelectorAll('#pages g.cp-hi, #pages g.cp-hi-cur').forEach(el => el.classList.remove('cp-hi', 'cp-hi-cur'));
    document.querySelectorAll('.cp-pie').forEach(p => p.classList.remove('dimmed'));
    document.querySelectorAll('.cp-pie path.active, tr.cp-row.active').forEach(el => el.classList.remove('active'));
    const nav = document.getElementById('cpNav');
    if (nav) nav.hidden = true;
  }

  function symElsForSpan(vi, span){
    const v = piece && piece.voices[vi];
    if (!v || !v.syms) return [];
    const eis = new Set(span.eis);
    const out = [];
    v.syms.forEach((s, qi) => {
      if (s.src && s.src.some(i => eis.has(i))) {
        const el = pagesEl.querySelector(`g.n${vi}-${qi}`);
        if (el) out.push(el);
      }
    });
    return out;
  }

  function applyHighlight(scrollToCur){
    document.querySelectorAll('#pages g.cp-hi, #pages g.cp-hi-cur').forEach(el => el.classList.remove('cp-hi', 'cp-hi-cur'));
    if (!activeHighlight || !lastResult) return;
    const {vi1, vi2} = lastResult;
    const {kind, key, items, idx} = activeHighlight;
    let firstCurEl = null;
    items.forEach((it, i) => {
      const els = [...symElsForSpan(vi1, it.a), ...symElsForSpan(vi2, it.b)];
      if (kind === 'mot' && it.prev) {
        els.push(...symElsForSpan(vi1, it.prev.a), ...symElsForSpan(vi2, it.prev.b));
      }
      for (const el of els) {
        el.classList.add('cp-hi');
        if (i === idx) {
          el.classList.add('cp-hi-cur');
          if (!firstCurEl) firstCurEl = el;
        }
      }
    });
    const nav = document.getElementById('cpNav'), txt = document.getElementById('cpNavText');
    if (nav && txt) {
      nav.hidden = false;
      txt.innerHTML = `Highlighting <strong>${esc(activeHighlight.label)}</strong>: occurrence <strong>${idx + 1}</strong> of ${items.length}`;
    }
    if (scrollToCur && firstCurEl) bringIntoView(firstCurEl, false);
  }

  function selectSlice(kind, key){
    if (!lastResult) return;
    if (activeHighlight && activeHighlight.kind === kind && activeHighlight.key === key) {
      clearHighlight();
      return;
    }
    const groups = kind === 'int' ? lastResult.intGroups : lastResult.motGroups;
    const g = groups.find(x => x.key === key);
    if (!g || !g.items.length) return;
    clearHighlight();
    activeHighlight = {kind, key, label: g.label, items: g.items, idx: 0};
    document.querySelectorAll(`.cp-pie`).forEach(p => {
      const has = p.querySelector(`path[data-kind="${kind}"][data-key="${CSS.escape(key)}"]`);
      p.classList.toggle('dimmed', !!has);
    });
    document.querySelectorAll(`[data-kind="${kind}"][data-key="${CSS.escape(key)}"]`).forEach(el => el.classList.add('active'));
    applyHighlight(true);
  }

  function renderAnalysis(res){
    lastResult = res;
    clearHighlight();
    const box = document.getElementById('cpCharts');
    const pc = (x, tot) => tot ? (x * 100 / tot).toFixed(1) + '%' : '0.0%';
    const onsetLabel = res.onsetMode === 'struck' ? 'Struck together only' : res.onsetMode === 'beat' ? 'Strong beats (semibreve)' : 'All vertical slices';
    const intFoot = res.totalInts
      ? `Imperfect consonances (3rds, 6ths): <strong>${res.impCons}</strong> (${pc(res.impCons, res.totalInts)}) · Perfect consonances (1, 5, 8): <strong>${res.perfCons}</strong> (${pc(res.perfCons, res.totalInts)}) · Dissonances (2, 4, 7): <strong>${res.diss}</strong> (${pc(res.diss, res.totalInts)}). Click any slice or row to highlight in the score.`
      : '';
    const motFoot = res.totalMots
      ? `${res.staticCount ? `Skipped ${res.staticCount} static pitch repetition${res.staticCount === 1 ? '' : 's'}. ` : ''}` +
        `${res.par5 || res.par8 ? `Parallel 5ths: <strong>${res.par5}</strong> · Parallel 8ves/unisons: <strong>${res.par8}</strong>. ` : ''}` +
        `Click any slice or row to highlight in the score.`
      : '';

    box.innerHTML = `
      <div class="cp-chart-card">
        <h3><span>Harmonic Intervals</span><small>${esc(res.v1Name)} &amp; ${esc(res.v2Name)} · ${esc(onsetLabel)}</small></h3>
        <div class="cp-chart-body">
          ${pieSvg(res.intGroups, res.totalInts, 'int', 'intervals')}
          <div>${legendHtml(res.intGroups, res.totalInts, 'int')}</div>
        </div>
        ${intFoot ? `<div class="cp-foot">${intFoot}</div>` : ''}
      </div>
      <div class="cp-chart-card">
        <h3><span>Contrapuntal Motion</span><small>${esc(res.v1Name)} &amp; ${esc(res.v2Name)}</small></h3>
        <div class="cp-chart-body">
          ${pieSvg(res.motGroups, res.totalMots, 'mot', 'motions')}
          <div>${legendHtml(res.motGroups, res.totalMots, 'mot')}</div>
        </div>
        ${motFoot ? `<div class="cp-foot">${motFoot}</div>` : ''}
      </div>
    `;
    postHeight();
  }

  function applySolo(){
    if (!piece) return;
    const solo = document.getElementById('cpSolo').checked;
    const vi1 = +document.getElementById('cpV1').value;
    const vi2 = +document.getElementById('cpV2').value;
    piece.voices.forEach((v, i) => {
      vis(i).play = solo ? (i === vi1 || i === vi2 ? true : 'mute') : true;
    });
    save(); syncUI();
    if (play) restartPlay();
  }

  function populateVoices(){
    if (!piece || !piece.voices.length) return;
    const s1 = document.getElementById('cpV1'), s2 = document.getElementById('cpV2');
    const prev1 = s1.value, prev2 = s2.value;
    const opts = piece.voices.map((v, i) => `<option value="${i}">${esc(v.name || ('Voice ' + (i + 1)))}</option>`).join('');
    s1.innerHTML = opts;
    s2.innerHTML = opts;
    const n = piece.voices.length;
    if (prev1 !== '' && +prev1 < n) s1.value = prev1; else s1.value = '0';
    if (prev2 !== '' && +prev2 < n && +prev2 !== +s1.value) s2.value = prev2;
    else s2.value = String(n > 1 ? Math.min(n - 1, n >= 3 ? n - 1 : 1) : 0);
    const sub = document.getElementById('cpPieceTitle');
    if (sub) sub.textContent = `${piece.title || 'Score'}${piece.composer ? ' — ' + piece.composer : ''} (${n} voice${n === 1 ? '' : 's'})`;
  }

  function runAnalysis(){
    if (!piece || piece.voices.length < 2) {
      document.getElementById('cpCharts').innerHTML = `<p class="cp-foot">This score has fewer than two voices. Open a polyphonic piece from Open → Repertoire.</p>`;
      return;
    }
    const vi1 = +document.getElementById('cpV1').value;
    const vi2 = +document.getElementById('cpV2').value;
    if (vi1 === vi2) {
      toast('Choose two different voices to analyze their counterpoint.');
      return;
    }
    const onset = document.getElementById('cpOnset').value;
    const fold = document.getElementById('cpFold').value;
    const qual = document.getElementById('cpQual').checked;
    const res = analyzePair(vi1, vi2, onset, fold, qual);
    renderAnalysis(res);
  }

  /* Event listeners */
  document.getElementById('cpRunBtn').addEventListener('click', runAnalysis);
  document.getElementById('cpSwapBtn').addEventListener('click', () => {
    const s1 = document.getElementById('cpV1'), s2 = document.getElementById('cpV2');
    const tmp = s1.value; s1.value = s2.value; s2.value = tmp;
    runAnalysis();
  });
  document.getElementById('cpSolo').addEventListener('change', applySolo);
  ['cpV1', 'cpV2'].forEach(id => document.getElementById(id).addEventListener('change', () => {
    if (document.getElementById('cpSolo').checked) applySolo();
  }));
  document.getElementById('cpCharts').addEventListener('click', e => {
    const t = e.target.closest('[data-kind][data-key]');
    if (t) selectSlice(t.dataset.kind, t.dataset.key);
  });
  document.getElementById('cpPrev').addEventListener('click', () => {
    if (!activeHighlight) return;
    activeHighlight.idx = (activeHighlight.idx - 1 + activeHighlight.items.length) % activeHighlight.items.length;
    applyHighlight(true);
  });
  document.getElementById('cpNext').addEventListener('click', () => {
    if (!activeHighlight) return;
    activeHighlight.idx = (activeHighlight.idx + 1) % activeHighlight.items.length;
    applyHighlight(true);
  });
  document.getElementById('cpClearHi').addEventListener('click', clearHighlight);

  /* Hook into Scriptorium */
  Object.assign(H, {
    afterLoad(){
      populateVoices();
      if (piece && piece.voices.length >= 2) runAnalysis();
    },
    afterRender(){
      if (activeHighlight) applyHighlight(false);
    }
  });
}]);
