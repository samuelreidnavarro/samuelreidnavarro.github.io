/* Scriptorium add-on: ReDiX Melodia.
   A melodic search engine across the ~2,870 polyphonic scores of the ReDiX corpus (Josquin Research Project,
   1520s Project, and music21 Palestrina). The query melody is written on the Scriptorium staff above — with
   a clef for exact pitches, or with "No clef" for transposed searches by exact intervallic structure (semitones)
   or generic diatonic steps (contour). */
(window.SCRIPTORIUM = window.SCRIPTORIUM || {}).addons = (window.SCRIPTORIUM.addons || []).concat([function(){
  const NOTE_SEMI = [0, 2, 4, 5, 7, 9, 11];
  const LET_UP = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const RECIP_TAB = [[8, '000'], [6, '00.'], [4, '00'], [3, '0.'], [2, '0'], [1.5, '1.'], [1, '1'], [0.75, '2.'], [0.5, '2'], [0.375, '4.'], [0.25, '4'], [0.1875, '8.'], [0.125, '8'], [0.0625, '16']];
  let lastRealClef = 'treble';
  let searchMode = 'semi'; /* 'pitch' | 'semi' | 'step' */
  let syncingText = false;

  /* inject layout and ReDiX Melodia panel styles */
  document.head.insertAdjacentHTML('beforeend', `<style>
    .viewer.frame, .viewer { height: auto !important; max-height: none !important; min-height: 150px !important; padding-top: 96px !important; padding-bottom: 12px !important; }
    @media (max-width: 700px) { .viewer.frame, .viewer { padding-top: 86px !important; } }
    html.ctl-top-idle .tools .bar > .podg, html.ctl-top-idle .tools .grow > .podg, html.ctl-top-idle .tools .editbar { opacity: 1 !important; pointer-events: auto !important; transform: none !important; }
    html.ctl-top-idle .tools .bar > .podg *, html.ctl-top-idle .tools .grow > .podg *, html.ctl-top-idle .tools .editbar * { pointer-events: auto !important; }
    html.ctl-bot-idle .tp-stack, html.ctl-bot-idle #podSing, html.ctl-bot-idle #podKbd { opacity: 1 !important; pointer-events: auto !important; transform: none !important; }
    html.ctl-bot-idle .tp-stack *, html.ctl-bot-idle #podSing *, html.ctl-bot-idle #podKbd * { pointer-events: auto !important; }
    .transport, html.embedded .transport { position: relative !important; top: auto !important; bottom: auto !important; left: auto !important; right: auto !important; margin: 2px auto 12px !important; max-width: 72rem; border-top: 0 !important; background: transparent !important; justify-content: center; }
    .kbd, html.embedded .kbd { position: relative !important; top: auto !important; bottom: auto !important; left: auto !important; right: auto !important; margin: 4px auto 12px !important; }
    #handBox, #pendBox, .framegrip, .fsbtn { display: none !important; }
    #pages .mel-int { font-family: "IM Fell English", Georgia, serif; font-size: 1.05px; font-style: italic; fill: var(--accent); text-anchor: middle; pointer-events: none; }
    .rdx-mel { max-width: 72rem; margin: 0 auto 40px; padding: 0 clamp(8px, 1.4vw, 24px); display: grid; gap: 1.15rem; color: var(--text); }
    .rdx-intro { max-width: 54rem; margin: 0 auto; font-size: 1.04rem; line-height: 1.48; color: var(--muted); text-align: center; }
    .rdx-intro strong { color: var(--text); }
    .rdx-intro a { color: var(--accent); }
    .rdx-card { display: grid; gap: 1rem; padding: 1.15rem 1.35rem; border: 1px solid var(--line); border-radius: 10px; background: color-mix(in srgb, var(--surface) 78%, var(--ground)); box-shadow: 0 6px 20px -12px rgba(42,34,24,.18); }
    .rdx-card h2 { margin: 0; font-family: "IM Fell Double Pica", "IM Fell English", Georgia, serif; font-weight: 400; font-size: 1.35rem; }
    .rdx-modes { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; }
    .rdx-modes .mbtn { font: inherit; font-size: 1.04rem; padding: .38rem .95rem; border: 1px solid var(--line); border-radius: 999px; background: var(--ground); color: var(--muted); cursor: pointer; transition: border-color .12s, background .12s, color .12s; }
    .rdx-modes .mbtn:hover { color: var(--text); border-color: var(--text); }
    .rdx-modes .mbtn[aria-selected="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
    .rdx-formula { display: flex; flex-wrap: wrap; gap: .5rem 1.2rem; align-items: baseline; padding: .55rem .8rem; border-radius: 7px; background: var(--ground); border: 1px solid var(--line); font-size: 1.02rem; }
    .rdx-formula .f-tag { font-style: italic; color: var(--muted); }
    .rdx-formula .f-val { font-family: "IM Fell Double Pica", "IM Fell English", Georgia, serif; font-size: 1.15rem; letter-spacing: .01em; }
    .rdx-quick { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
    .rdx-quick label { font-size: 1rem; color: var(--muted); font-style: italic; }
    .rdx-quick input[type=text] { flex: 1 1 16rem; font: inherit; font-size: 1.05rem; color: var(--text); background: var(--ground); border: 1px solid var(--line); border-radius: 6px; padding: .32rem .6rem; min-height: 36px; }
    .rdx-examples { display: flex; flex-wrap: wrap; gap: .35rem; align-items: center; font-size: .95rem; color: var(--muted); }
    .rdx-examples button { font: inherit; font-size: .93rem; padding: .15rem .55rem; min-height: 28px; height: auto; border-radius: 999px; border: 1px solid var(--line); background: var(--ground); color: var(--text); cursor: pointer; }
    .rdx-examples button:hover { border-color: var(--accent); color: var(--accent); }
    .rdx-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(18.5rem, 1fr)); gap: .85rem 1.5rem; }
    .rdx-fld { display: grid; gap: .25rem; font-size: 1.02rem; align-content: start; }
    .rdx-fld > label, .rdx-fld > span { color: var(--muted); font-size: .96rem; }
    .rdx-fld input[type=text], .rdx-fld select { font: inherit; font-size: 1.02rem; color: var(--text); background: var(--ground); border: 1px solid var(--line); border-radius: 6px; padding: .32rem .55rem; width: 100%; min-height: 36px; }
    .rdx-checks { display: flex; flex-wrap: wrap; gap: .35rem 1.35rem; font-size: 1.01rem; align-items: center; }
    .rdx-checks label { display: inline-flex; align-items: center; gap: .4rem; cursor: pointer; }
    .rdx-checks input[type=checkbox] { accent-color: var(--accent); width: 1.02rem; height: 1.02rem; }
    details.rdx-comp { border: 1px solid var(--line); border-radius: 6px; background: var(--ground); }
    details.rdx-comp summary { padding: .34rem .6rem; cursor: pointer; font-size: 1.02rem; }
    details.rdx-comp .box { padding: .45rem .65rem .65rem; border-top: 1px solid var(--line); }
    details.rdx-comp .clist { max-height: 15rem; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr)); gap: .08rem 1rem; font-size: .98rem; margin-top: .4rem; }
    details.rdx-comp .clist label { display: flex; gap: .4rem; align-items: baseline; cursor: pointer; }
    details.rdx-comp .clist .n { color: var(--muted); font-size: .88rem; }
    .rdx-btnrow { display: flex; gap: .65rem; flex-wrap: wrap; align-items: center; }
    .rdx-btn { font: inherit; font-size: 1.08rem; padding: .42rem 1.25rem; min-height: 38px; height: auto; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent); color: var(--accent-ink); cursor: pointer; }
    .rdx-btn:hover:not(:disabled) { background: #6F2017; color: var(--accent-ink); }
    .rdx-btn.light { background: transparent; color: var(--accent); }
    .rdx-btn.light:hover:not(:disabled) { background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); }
    .rdx-btn.small { font-size: .93rem; padding: .15rem .65rem; min-height: 28px; }
    .rdx-status { color: var(--muted); font-style: italic; }
    .rdx-err { color: #9b2a1a; }
    .rdx-summary { margin: 0; font-size: 1.06rem; }
    table.rdx-groups, table.rdx-items { width: 100%; border-collapse: collapse; font-size: 1.03rem; }
    table.rdx-groups th, table.rdx-items th { text-align: left; font-weight: 400; color: var(--muted); border-bottom: 1px solid var(--line); padding: .25rem .5rem; font-size: .94rem; font-style: italic; }
    table.rdx-groups td { padding: .34rem .5rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    table.rdx-groups td.num, table.rdx-groups th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .rdx-gbtn { font: inherit; font-size: 1.05rem; background: var(--ground); border: 1px solid var(--line); border-radius: 6px; padding: .14rem .65rem; min-height: 30px; height: auto; cursor: pointer; color: var(--text); text-align: left; }
    .rdx-gbtn:hover, .rdx-gbtn[aria-expanded="true"] { border-color: var(--accent); }
    td.rdx-sub { padding: .25rem 0 .85rem 1.1rem !important; background: color-mix(in srgb, var(--ground) 65%, transparent); }
    table.rdx-items td { padding: .28rem .5rem; border-bottom: 1px dotted var(--line); vertical-align: middle; }
    table.rdx-items td.where { white-space: nowrap; font-variant-numeric: tabular-nums; }
    table.rdx-items a { white-space: nowrap; color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
    .rdx-snip { padding: .55rem 0 .85rem; overflow-x: auto; }
    .rdx-snip .cb-prev { display: block; width: fit-content; max-width: 100%; overflow-x: auto; background: #ffffff; background-image: none; border-radius: 6px; border: 1px solid var(--line); box-shadow: 0 6px 18px -10px rgba(42,34,24,.32); padding: 4px 6px; }
    .rdx-snip svg { display: block; max-width: 100%; height: auto; pointer-events: none; }
    .rdx-snip svg .staff { stroke: #2A2218; }
    .rdx-snip svg .ledger, .rdx-snip svg .barl, .rdx-snip svg .tie, .rdx-snip svg .ms { stroke: var(--leaf-ink, #2A2218); fill: none; }
    .rdx-snip svg use, .rdx-snip svg .ink { fill: var(--leaf-ink, #2A2218); color: var(--leaf-ink, #2A2218); }
    .rdx-snip svg .red use, .rdx-snip svg .ink.red { fill: #A12C1C; color: #A12C1C; }
    .rdx-snip svg text { fill: var(--leaf-ink, #2A2218); font-family: "IM Fell English", "Palatino Linotype", Palatino, Georgia, serif; }
    .rdx-snip svg .hit, .rdx-snip svg .selbg, .rdx-snip svg .stafhit, .rdx-snip svg .clefhit rect, .rdx-snip svg .menshit rect, .rdx-snip svg .keyhit rect, .rdx-snip svg .dothit rect, .rdx-snip svg .mensadd, .rdx-snip svg .ksarr, .rdx-snip svg .dotkind { fill: transparent !important; opacity: 0 !important; }
    .rdx-snip svg g.mel-hit use, .rdx-snip svg g.mel-hit .ink, .rdx-snip svg g.mel-hit circle, .rdx-snip svg g.mel-hit text { fill: #1B56B8 !important; color: #1B56B8 !important; }
    .rdx-snip svg g.mel-hit .ledger, .rdx-snip svg g.mel-hit line, .rdx-snip svg g.mel-hit path.tie { stroke: #1B56B8 !important; }
    .rdx-snip svg .mel-hi-bg { fill: #1B56B8; fill-opacity: .14; rx: 0.45; pointer-events: none; }
    .rdx-snip .cap { font-size: .94rem; color: var(--muted); font-style: italic; margin-top: .3rem; }
  </style>`);

  /* build the ReDiX Melodia UI panel right below the transport bar */
  const wrap = document.querySelector('main.wrap');
  const tp = document.querySelector('.transport');
  const kbd = document.getElementById('kbd');
  if (tp && wrap) {
    /* keep transport and keyboard directly below the staff viewer, above the Melodia search panel */
    const vw = document.querySelector('.viewwrap');
    if (vw && vw.nextSibling) {
      if (kbd) vw.after(kbd);
      vw.after(tp);
    }
  }
  const panel = document.createElement('section');
  panel.className = 'rdx-mel';
  panel.setAttribute('aria-label', 'ReDiX Melodia search');
  panel.innerHTML = `
    <p class="rdx-intro">
      <strong>ReDiX Melodia</strong> searches the ~2,870 fifteenth- and sixteenth-century polyphonic scores of the
      <a href="../redix-progressio.html">ReDiX</a> corpus (over 2.18 million notes across 10,800 voices).
      Write a melody on the staff above (with any clef you prefer), then choose whether to match its <strong>exact pitches</strong>,
      its <strong>exact intervals</strong> (any transposition preserving half and whole steps), or its <strong>diatonic steps</strong> (any transposition regardless of major or minor).
    </p>
    <form class="rdx-card" id="melForm" autocomplete="off">
      <div style="display:grid;gap:.65rem">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.6rem">
          <h2>Melodic &amp; rhythmic search</h2>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.6rem 1.4rem;align-items:center">
          <div class="rdx-modes" role="group" aria-label="Pitch and interval matching">
            <span style="font-style:italic;color:var(--muted);margin-right:.2rem">Match:</span>
            <button type="button" class="mbtn" data-m="pitch" aria-selected="false" title="Match these exact note names as written on the staff">Exact pitches</button>
            <button type="button" class="mbtn" data-m="semi" aria-selected="true" title="Match any transposition preserving the exact major and minor intervals (half and whole steps)">Exact intervals</button>
            <button type="button" class="mbtn" data-m="step" aria-selected="false" title="Match any transposition preserving generic diatonic steps (2nds, 3rds, etc.) regardless of major or minor">Diatonic steps</button>
          </div>
          <div class="rdx-modes" id="melRhyBar" role="group" aria-label="Rhythm mode">
            <span style="font-style:italic;color:var(--muted);margin-right:.2rem">Rhythm:</span>
            <button type="button" class="rbtn mbtn" data-r="any" aria-selected="true" title="Rhythm OFF: match the pitches or intervals in any rhythm">Off (any rhythm)</button>
            <button type="button" class="rbtn mbtn" data-r="prop" aria-selected="false" title="Rhythm ON (proportional): match the pitches/intervals together with the relative duration ratios written on the staff (e.g. 2:1:1:2)">On: Relative durations</button>
            <button type="button" class="rbtn mbtn" data-r="exact" aria-selected="false" title="Rhythm ON (exact): match the pitches/intervals together with the exact note values written on the staff (Brevis, Semibrevis, Minima, etc.)">On: Exact note values</button>
          </div>
        </div>
      </div>

      <div class="rdx-formula" id="melFormula"></div>

      <div class="rdx-quick">
        <label for="melQuickIn">Quick entry:</label>
        <input type="text" id="melQuickIn" placeholder="e.g. C D E F D E C   or   F G A Bb G A F" aria-label="Quick melody entry">
        <button type="button" class="rdx-btn light small" id="melQuickApply">Put on staff</button>
        <button type="button" class="rdx-btn light small" id="melClearBtn">Clear staff</button>
      </div>

      <div class="rdx-examples">
        <span>Examples:</span>
        <button type="button" data-ex="1C 1D 1E 1F 1D 1E 0C" data-mode="semi" data-rhy="any">C D E F D E C (exact intervals)</button>
        <button type="button" data-ex="1C 1D 1E 1F 1D 1E 0C" data-mode="pitch" data-rhy="any">C D E F D E C (exact pitches)</button>
        <button type="button" data-ex="1.C 2D 1E 1F 1D 1E 0C" data-mode="semi" data-rhy="prop">Dotted S + M + S + S (intervals + relative rhythm)</button>
        <button type="button" data-ex="1F 1G 1A 1Bb 1G 1A 0F" data-mode="pitch" data-rhy="any">F G A B♭ G A F</button>
        <button type="button" data-ex="1G3 2G3 1C4 2C4 1D4 2D4 0E4" data-mode="semi" data-rhy="prop">L’homme armé (intervals + rhythm)</button>
      </div>

      <div class="rdx-grid2">
        <div class="rdx-fld">
          <label for="melRhythm">Rhythm</label>
          <select id="melRhythm">
            <option value="any" selected>Any rhythm (pitches / intervals only)</option>
            <option value="prop">Proportional rhythm (relative durations, e.g. 2:1:1:2)</option>
            <option value="exact">Exact note values as written on the staff</option>
          </select>
        </div>
        <div class="rdx-fld">
          <label for="melVoice">Voice</label>
          <select id="melVoice">
            <option value="">All voices</option>
            <option value="sup">Superius / Cantus / Discantus</option>
            <option value="alt">Altus / Contratenor</option>
            <option value="ten">Tenor</option>
            <option value="bas">Bassus</option>
            <option value="oth">Quinta / Sexta / Vagans</option>
          </select>
        </div>
      </div>

      <div class="rdx-checks">
        <label><input type="checkbox" id="melNoRest" checked> no rests between notes</label>
        <label><input type="checkbox" id="melCollapse"> collapse repeated pitches</label>
        <label id="melAccWrap"><input type="checkbox" id="melAcc" checked> match exact accidentals (B♮ ≠ B♭)</label>
        <label id="melOctWrap"><input type="checkbox" id="melOct"> match exact octave</label>
      </div>

      <h2>Which pieces</h2>
      <div class="rdx-grid2">
        <div class="rdx-fld">
          <span>Composers</span>
          <details class="rdx-comp" id="melCompBox">
            <summary id="melCompSum">All composers</summary>
            <div class="box">
              <div class="rdx-btnrow">
                <button type="button" class="rdx-btn light small" id="melCompAll">All</button>
                <button type="button" class="rdx-btn light small" id="melCompNone">None</button>
              </div>
              <div class="clist" id="melCompList"></div>
            </div>
          </details>
          <div class="rdx-checks" style="margin-top:.3rem">
            <label><input type="checkbox" id="melAttr" checked> include pieces whose attribution is uncertain</label>
          </div>
        </div>
        <div class="rdx-fld">
          <label for="melTitle">Title contains</label>
          <input type="text" id="melTitle" placeholder="e.g. Ave Maria or homme">
          <label for="melGenre" style="margin-top:.35rem">Genre</label>
          <select id="melGenre">
            <option value="">All genres</option>
            <option value="Mass">Mass movements</option>
            <option value="Motet">Motets</option>
            <option value="Song">Songs</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div class="rdx-btnrow">
        <button type="submit" class="rdx-btn" id="melGo">Search corpus</button>
        <span class="rdx-status" id="melStatus"></span>
      </div>
    </form>
    <div id="melResults"></div>
  `;
  wrap.appendChild(panel);

  /* Choose a G or F clef automatically from the melody's pitch range */
  function clefForNotes(notes){
    const steps = (notes || []).filter(n => !n.rest && typeof n.step === 'number').map(n => n.step);
    if (!steps.length) return 'treble';
    const avg = steps.reduce((a, b) => a + b, 0) / steps.length;
    if (avg >= 28) return 'treble';   /* C4 and above -> G2 */
    if (avg >= 22) return 'treble8';  /* D3..B3 -> G2 8 (tenor G clef) */
    return 'bass';                    /* below D3 -> F4 */
  }

  /* ---------------- Helper functions for extracting & formatting the staff melody ---------------- */
  function stepToSemi(step, alt){
    const oct = Math.floor(step / 7), l = ((step % 7) + 7) % 7;
    return oct * 12 + NOTE_SEMI[l] + (alt || 0);
  }
  function noteLabel(step, alt, showOct){
    const oct = Math.floor(step / 7), l = ((step % 7) + 7) % 7;
    const acc = alt > 0 ? '♯'.repeat(alt) : alt < 0 ? '♭'.repeat(-alt) : '';
    return LET_UP[l] + acc + (showOct ? oct : '');
  }
  const DUR_NAMES = [[192, 'Mx'], [144, 'L.'], [96, 'L'], [72, 'B.'], [48, 'B'], [36, 'S.'], [24, 'S'], [18, 'M.'], [12, 'M'], [9, 'Sm.'], [6, 'Sm'], [3, 'F'], [2, 'Sf']];
  function durLabel(durQ){
    let best = 'S', bd = 1e9;
    for (const [q, name] of DUR_NAMES) {
      const d = Math.abs(durQ - q);
      if (d < bd) { bd = d; best = name; }
    }
    return best;
  }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a || 1; }
  function propRatioStr(durs){
    if (!durs.length) return '';
    let g = durs[0];
    for (let i = 1; i < durs.length; i++) g = gcd(g, durs[i]);
    return durs.map(d => Math.round(d / g)).join(' : ');
  }
  function noteAscii(step, alt, d){
    const l = ((step % 7) + 7) % 7;
    const acc = alt > 0 ? '#'.repeat(alt) : alt < 0 ? 'b'.repeat(-alt) : '';
    const r = document.getElementById('melRhythm') ? document.getElementById('melRhythm').value : 'any';
    const prefix = (r !== 'any' && d !== undefined) ? recipFor(d) : '';
    return prefix + LET_UP[l] + acc;
  }
  function intervalLabel(ds, dm, exact){
    if (ds === 0 && (!exact || dm === 0)) return '1';
    const sign = ds > 0 || (ds === 0 && dm > 0) ? '+' : '−';
    const ads = Math.abs(ds), adm = Math.abs(dm);
    const num = ads + 1;
    if (!exact) return `${sign}${num}`;
    /* quality from diatonic size (mod 7) and semitones (mod 12) */
    const octs = Math.floor(ads / 7), baseStep = ads % 7, baseSemi = adm - octs * 12;
    const EXP = [0, 2, 4, 5, 7, 9, 11][baseStep];
    const perf = baseStep === 0 || baseStep === 3 || baseStep === 4;
    const diff = baseSemi - EXP;
    let q = '';
    if (perf) q = diff === 0 ? 'P' : diff > 0 ? 'A'.repeat(diff) : 'd'.repeat(-diff);
    else q = diff === 0 ? 'M' : diff === -1 ? 'm' : diff > 0 ? 'A'.repeat(diff) : 'd'.repeat(-diff - 1);
    return `${sign}${q}${num}`;
  }

  /* extract sounding notes from voice 0 of the Scriptorium score */
  function extractQuery(){
    if (!piece || !piece.voices.length) return [];
    const v = piece.voices[0];
    const k0 = keyAt(v, 0);
    const raw = [];
    let afterRest = false;
    for (let i = 0; i < v.events.length; i++) {
      const e = v.events[i];
      if (e.rest) { afterRest = true; continue; }
      if ((e.tieEnd || e.tieMid) && raw.length && !afterRest && raw[raw.length - 1].step === e.step) {
        raw[raw.length - 1].d += e.d;
        continue;
      }
      const letter = LETTERS[((e.step % 7) + 7) % 7];
      const sig = k0[letter] || 0;
      const alt = (e.alt !== null && e.alt !== undefined) ? e.alt : sig;
      const semi = stepToSemi(e.step, alt);
      raw.push({step: e.step, alt, semi, d: e.d, durQ: Math.max(1, Math.round(e.d * 24)), afterRest});
      afterRest = false;
    }
    const collapse = document.getElementById('melCollapse') && document.getElementById('melCollapse').checked;
    if (!collapse) return raw;
    const out = [];
    for (const n of raw) {
      if (out.length && !n.afterRest && out[out.length - 1].step === n.step && out[out.length - 1].semi === n.semi) {
        out[out.length - 1].d += n.d;
        out[out.length - 1].durQ = Math.max(1, Math.round(out[out.length - 1].d * 24));
      } else out.push(Object.assign({}, n));
    }
    return out;
  }

  /* draw interval labels above the staff when searching by Exact intervals or Diatonic steps */
  function drawStaffIntervals(){
    document.querySelectorAll('#pages .mel-int').forEach(el => el.remove());
    if (!piece || !piece.voices.length) return;
    const v = piece.voices[0];
    if (searchMode === 'pitch') return;
    const exact = searchMode !== 'step';
    const noteEls = [];
    (v.syms || []).forEach((s, qi) => {
      if (s.rest || s.cont || s.phantom) return;
      const g = pagesEl.querySelector(`g.n0-${qi}`);
      if (!g) return;
      const letter = LETTERS[((s.step % 7) + 7) % 7];
      const sig = keyAt(v, s.t)[letter] || 0;
      const alt = (s.alt !== null && s.alt !== undefined) ? s.alt : sig;
      noteEls.push({g, step: s.step, semi: stepToSemi(s.step, alt)});
    });
    for (let i = 1; i < noteEls.length; i++) {
      const a = noteEls[i - 1], b = noteEls[i];
      const ba = a.g.getBBox(), bb = b.g.getBBox();
      if (!ba.width || !bb.width || a.g.parentNode !== b.g.parentNode) continue;
      const x = (ba.x + ba.width / 2 + bb.x + bb.width / 2) / 2;
      const y = Math.min(ba.y, bb.y) - 0.85;
      const lbl = intervalLabel(b.step - a.step, b.semi - a.semi, exact);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('class', 'mel-int');
      t.setAttribute('x', x.toFixed(2));
      t.setAttribute('y', y.toFixed(2));
      t.textContent = lbl;
      b.g.parentNode.appendChild(t);
    }
  }

  function syncModeUI(){
    if (!piece || !piece.voices.length) return;
    const v = piece.voices[0];
    let curClef = (vis(0).clef && CLEFS[vis(0).clef]) ? vis(0).clef : chooseClef(v, st.clefs);
    if (!curClef || curClef === 'none') { curClef = lastRealClef || 'c1'; vis(0).clef = curClef; }
    else lastRealClef = curClef;

    const rhySel = document.getElementById('melRhythm');
    const rhyMode = rhySel ? rhySel.value : 'any';
    document.querySelectorAll('.rdx-modes .mbtn[data-m]').forEach(b => {
      b.setAttribute('aria-selected', String(b.dataset.m === searchMode));
    });
    document.querySelectorAll('#melRhyBar .rbtn').forEach(b => {
      b.setAttribute('aria-selected', String(b.dataset.r === rhyMode));
    });
    const accW = document.getElementById('melAccWrap'), octW = document.getElementById('melOctWrap');
    if (accW) accW.hidden = searchMode !== 'pitch';
    if (octW) octW.hidden = searchMode !== 'pitch';

    const q = extractQuery();
    const fBox = document.getElementById('melFormula');
    const qIn = document.getElementById('melQuickIn');
    if (!syncingText && qIn) qIn.value = q.map(n => noteAscii(n.step, n.alt, n.d)).join(' ');

    if (!fBox) return;
    if (!q.length) {
      fBox.innerHTML = `<span class="f-tag">Click on the staff above (or type letters A–G) to write a melody.</span>`;
      return;
    }
    const octOn = document.getElementById('melOct') && document.getElementById('melOct').checked;
    const notesStr = q.map(n => noteLabel(n.step, n.alt, octOn)).join(' – ');
    const dSemi = [], dStep = [];
    for (let i = 1; i < q.length; i++) {
      dSemi.push(intervalLabel(q[i].step - q[i - 1].step, q[i].semi - q[i - 1].semi, true));
      dStep.push(intervalLabel(q[i].step - q[i - 1].step, q[i].semi - q[i - 1].semi, false));
    }
    const durNames = q.map(n => durLabel(n.durQ)).join('  ');
    const ratios = propRatioStr(q.map(n => n.durQ));
    const rhyHtml = rhyMode === 'any'
      ? `<span><span class="f-tag">Rhythm:</span> <span>Off (any rhythm)</span></span>`
      : rhyMode === 'prop'
        ? `<span><span class="f-tag">Rhythm (relative ratios):</span> <strong class="f-val">${esc(ratios)}</strong> <span>(${esc(durNames)})</span></span>`
        : `<span><span class="f-tag">Rhythm (exact values):</span> <strong class="f-val">${esc(durNames)}</strong></span>`;
    if (searchMode === 'pitch') {
      fBox.innerHTML = `<span><span class="f-tag">Exact pitches:</span> <strong class="f-val">${esc(notesStr)}</strong></span>` +
        (dSemi.length ? `<span><span class="f-tag">Intervals:</span> <span>${esc(dSemi.join('  '))}</span></span>` : '') + rhyHtml;
    } else if (searchMode === 'semi') {
      fBox.innerHTML = `<span><span class="f-tag">Exact intervals (transposable):</span> <strong class="f-val">${esc(dSemi.join('  ') || '(single note)')}</strong></span>` +
        `<span><span class="f-tag">Written as:</span> <span>${esc(notesStr)} (matches any transposition with the same half/whole steps)</span></span>` + rhyHtml;
    } else {
      fBox.innerHTML = `<span><span class="f-tag">Diatonic steps (transposable):</span> <strong class="f-val">${esc(dStep.join('  ') || '(single note)')}</strong></span>` +
        `<span><span class="f-tag">Written as:</span> <span>${esc(notesStr)} (matches any major/minor quality)</span></span>` + rhyHtml;
    }
    drawStaffIntervals();
  }

  function setSearchMode(m){
    searchMode = m;
    syncModeUI();
  }

  document.querySelectorAll('.rdx-modes .mbtn[data-m]').forEach(b => {
    b.addEventListener('click', () => setSearchMode(b.dataset.m));
  });
  document.querySelectorAll('#melRhyBar .rbtn').forEach(b => {
    b.addEventListener('click', () => {
      const sel = document.getElementById('melRhythm');
      if (sel) sel.value = b.dataset.r;
      render();
    });
  });
  ['melCollapse', 'melAcc', 'melOct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', syncModeUI);
  });
  const rhyEl = document.getElementById('melRhythm');
  if (rhyEl) rhyEl.addEventListener('change', () => render());

  /* build a **kern score from a list of note tokens like "C D E F D E C" or [{step, alt, d}] */
  function recipFor(d){
    for (const [val, tok] of RECIP_TAB) if (Math.abs(d - val) < 1e-3) return tok;
    return '1';
  }
  function kernFromNotes(notes, clefKey){
    const ck = CLEF_KERN[clefKey] || (clefKey === 'none' ? 'none' : 'C1');
    const lines = ['!!!OTL: Query melody', '**kern', '*I"Melody', `*clef${ck}`, '*met(C)'];
    for (const n of notes) {
      const rec = recipFor(n.d || 1);
      if (n.rest) { lines.push(rec + 'r'); continue; }
      const oct = Math.floor(n.step / 7), l = ((n.step % 7) + 7) % 7, ch = LETTERS[l];
      const pTok = oct >= 4 ? ch.repeat(oct - 3) : ch.toUpperCase().repeat(4 - oct);
      const aTok = n.alt > 0 ? '#'.repeat(n.alt) : n.alt < 0 ? '-'.repeat(-n.alt) : '';
      lines.push(rec + pTok + aTok);
    }
    lines.push('==', '*-');
    return lines.join('\n') + '\n';
  }
  const SYM_DUR = {Mx: 8, 'L.': 6, L: 4, 'B.': 3, B: 2, 'S.': 1.5, S: 1, 'M.': 0.75, M: 0.5, 'Sm.': 0.375, Sm: 0.25, 'F.': 0.1875, F: 0.125, Sf: 0.0625};
  function parseQuickText(str){
    const toks = str.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    const out = [];
    let prevStep = 28;
    for (const t of toks) {
      let d = 1, restTok = t;
      const sm = /^(Mx|L\.?|B\.?|S\.?|M\.?|Sm\.?|F\.?|Sf):(.+)$/.exec(t);
      if (sm) { d = SYM_DUR[sm[1]] || 1; restTok = sm[2]; }
      else {
        const rm = /^(000\.?|00\.?|0\.?|16\.?|8\.?|4\.?|2\.?|1\.?)(?=[A-Ga-grR])(.+)$/.exec(t);
        if (rm) {
          const r = recipDur(rm[1]);
          if (r) d = r.d;
          restTok = rm[2];
        }
      }
      if (/^r$/i.test(restTok)) { out.push({rest: true, d}); continue; }
      const m = /^([A-Ga-g])(#+|-+|b+|s+|n|\u266f+|\u266d+)?(\d)?$/.exec(restTok);
      if (!m) continue;
      const l = LETTERS.indexOf(m[1].toLowerCase());
      const accStr = m[2] || '';
      let alt = 0;
      if (/^[#s\u266f]/.test(accStr)) alt = accStr.length;
      else if (/^[-b\u266d]/.test(accStr)) alt = -accStr.length;
      let step;
      if (m[3] !== undefined) {
        step = (+m[3]) * 7 + l;
      } else {
        /* choose the octave closest to prevStep (default around C4..B4 = 28..34) */
        step = 28 + l;
        if (out.length) {
          let best = step;
          for (let oct = 2; oct <= 6; oct++) {
            const cand = oct * 7 + l;
            if (Math.abs(cand - prevStep) < Math.abs(best - prevStep)) best = cand;
          }
          step = best;
        }
      }
      prevStep = step;
      out.push({step, alt, d});
    }
    return out;
  }

  async function setStaffMelody(notes, clefKey, mode){
    const c = (clefKey && clefKey !== 'none') ? clefKey : clefForNotes(notes);
    lastRealClef = c;
    if (mode) searchMode = mode;
    const krn = kernFromNotes(notes, c);
    const id = mineAdd('Query melody', krn);
    vis(0).clef = c;
    save();
    await loadPiece(id);
    vis(0).clef = c;
    ed.on = true;
    ed.sel = null;
    ed.ins = {vi: 0, ei: piece.voices[0].events.length};
    const eb = document.getElementById('editBar'), em = document.getElementById('editMore');
    if (eb) eb.hidden = false;
    if (em) em.setAttribute('aria-expanded', 'true');
    syncEdit(); render(); showSel();
    syncModeUI();
  }

  document.getElementById('melQuickApply').addEventListener('click', () => {
    const notes = parseQuickText(document.getElementById('melQuickIn').value);
    if (!notes.length) { toast('Enter note letters such as C D E F D E C.'); return; }
    syncingText = true;
    setStaffMelody(notes, clefForNotes(notes), searchMode).finally(() => { syncingText = false; });
  });
  document.getElementById('melQuickIn').addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('melQuickApply').click();
    }
  });
  document.getElementById('melClearBtn').addEventListener('click', () => {
    setStaffMelody([], lastRealClef || 'treble', searchMode);
  });
  document.querySelectorAll('.rdx-examples button[data-ex]').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.rhy && document.getElementById('melRhythm')) document.getElementById('melRhythm').value = b.dataset.rhy;
      const notes = parseQuickText(b.dataset.ex);
      setStaffMelody(notes, clefForNotes(notes), b.dataset.mode).then(() => runSearch(true));
    });
  });

  /* ---------------- Loading the ReDiX Melodia corpus index ---------------- */
  let MEL_DATA = null, melPromise = null, CAT_DATA = null;
  const nameOf = c => { const i = c.indexOf(', '); return i < 0 ? c : c.slice(i + 2) + ' ' + c.slice(0, i); };

  function loadCorpus(){
    if (MEL_DATA) return Promise.resolve(MEL_DATA);
    if (melPromise) return melPromise;
    const stEl = document.getElementById('melStatus');
    if (stEl) stEl.textContent = 'Loading the 2,870-piece melodic corpus…';
    melPromise = Promise.all([
      fetch('choirbook/catalogue.json').then(r => { if (!r.ok) throw new Error('Could not load catalogue.json'); return r.json(); }),
      fetch('../redix-progressio/melodia.json').then(r => { if (!r.ok) throw new Error('Could not load melodia.json'); return r.json(); }),
      fetch('../redix-progressio/melodia.bin').then(r => { if (!r.ok) throw new Error('Could not load melodia.bin'); return r.arrayBuffer(); })
    ]).then(([cat, meta, bin]) => {
      CAT_DATA = cat;
      const buf = new Uint8Array(bin);
      MEL_DATA = {cat, voices: meta.voices, pieces: meta.pieces, buf, totalNotes: buf.length >> 2};
      buildCompList(cat);
      if (stEl) stEl.textContent = '';
      return MEL_DATA;
    }).catch(err => { melPromise = null; throw err; });
    return melPromise;
  }

  let compNames = [];
  function buildCompList(cat){
    const cnt = {}, dates = {};
    for (const p of cat.pieces) {
      cnt[p.c] = (cnt[p.c] || 0) + 1;
      if (p.d && !dates[p.c]) dates[p.c] = p.d;
    }
    compNames = Object.keys(cnt).sort((a, b) => a.localeCompare(b));
    const box = document.getElementById('melCompList');
    if (!box) return;
    box.innerHTML = compNames.map((c, i) => `<label><input type="checkbox" class="mcc" value="${i}"> <span>${esc(c)}${dates[c] ? ' <span class="n">' + esc(dates[c]) + '</span>' : ''} <span class="n">(${cnt[c]})</span></span></label>`).join('');
  }
  function selectedComps(){
    return [...document.querySelectorAll('.mcc:checked')].map(x => compNames[+x.value]);
  }
  function updateCompSummary(){
    const s = selectedComps();
    const el = document.getElementById('melCompSum');
    if (el) el.textContent = !s.length ? 'All composers' : s.length <= 3 ? s.map(nameOf).join(', ') : `${s.length} composers`;
  }
  document.getElementById('melCompList').addEventListener('change', updateCompSummary);
  document.getElementById('melCompAll').addEventListener('click', () => { document.querySelectorAll('.mcc').forEach(x => x.checked = true); updateCompSummary(); });
  document.getElementById('melCompNone').addEventListener('click', () => { document.querySelectorAll('.mcc').forEach(x => x.checked = false); updateCompSummary(); });

  function voiceRoleMatch(vname, role){
    if (!role) return true;
    const s = vname.toLowerCase();
    if (role === 'sup') return /superius|cantus|discantus|soprano|1/.test(s);
    if (role === 'alt') return /altus|contra|alto|2/.test(s);
    if (role === 'ten') return /tenor|3/.test(s);
    if (role === 'bas') return /bassus|basso|bass|4/.test(s);
    if (role === 'oth') return /quinta|quintus|sexta|sextus|vagans|5|6/.test(s);
    return true;
  }

  /* ---------------- Running the melodic search across 2.18M notes ---------------- */
  let groups = [], openSnip = null;
  const SHOW_STEP = 50;

  function searchCorpus(D, q){
    const m = q.length;
    if (m < 2 && searchMode !== 'pitch') throw new Error('Write at least two notes on the staff to search by intervals.');
    if (m < 1) throw new Error('Write a melody on the staff above first.');

    const noRest = document.getElementById('melNoRest').checked;
    const collapse = document.getElementById('melCollapse').checked;
    const matchAcc = document.getElementById('melAcc').checked;
    const matchOct = document.getElementById('melOct').checked;
    const rhythm = document.getElementById('melRhythm').value;
    const voiceRole = document.getElementById('melVoice').value;
    const selComps = new Set(selectedComps());
    const attr = document.getElementById('melAttr').checked;
    const titleQ = document.getElementById('melTitle').value.trim().toLowerCase();
    const genreQ = document.getElementById('melGenre').value;

    const qSteps = new Int32Array(m);
    const qLets = new Int32Array(m);
    const qAlts = new Int32Array(m);
    const qSemis = new Int32Array(m);
    const qDurs = new Int32Array(m);
    const dSteps = new Int32Array(m);
    const dSemis = new Int32Array(m);
    for (let k = 0; k < m; k++) {
      qSteps[k] = q[k].step;
      qLets[k] = ((q[k].step % 7) + 7) % 7;
      qAlts[k] = q[k].alt;
      qSemis[k] = q[k].semi;
      qDurs[k] = q[k].durQ;
      if (k > 0) {
        dSteps[k] = q[k].step - q[k - 1].step;
        dSemis[k] = q[k].semi - q[k - 1].semi;
      }
    }
    const qDur0 = qDurs[0];
    const modeCode = searchMode === 'pitch' ? 0 : searchMode === 'semi' ? 1 : 2;
    const rhyCode = rhythm === 'exact' ? 2 : rhythm === 'prop' ? 1 : 0;

    const buf = D.buf, pieces = D.pieces, catPieces = D.cat.pieces, vNames = D.voices;
    const res = [];
    let off = 0, voicesExamined = 0, notesExamined = 0;

    for (let pi = 0; pi < pieces.length; pi++) {
      const pVoices = pieces[pi];
      const e = catPieces[pi];
      const pieceOk = (!selComps.size || selComps.has(e.c)) &&
        (attr || !e.a) &&
        (!titleQ || e.t.toLowerCase().includes(titleQ)) &&
        (!genreQ || e.g === genreQ);

      if (!pieceOk) {
        for (let vi = 0; vi < pVoices.length; vi++) off += pVoices[vi][1];
        continue;
      }

      for (let vi = 0; vi < pVoices.length; vi++) {
        const vnId = pVoices[vi][0], count = pVoices[vi][1];
        if (voiceRole && !voiceRoleMatch(vNames[vnId], voiceRole)) {
          off += count;
          continue;
        }
        voicesExamined++;
        notesExamined += count;
        const limit = count - m;
        for (let i = 0; i <= limit; i++) {
          let curIdx = off + i;
          let idx4 = curIdx << 2;
          const b0_0 = buf[idx4], b1_0 = buf[idx4 + 1];
          const s0 = b0_0 & 0x7F, m0 = b1_0 & 0x7F;

          if (modeCode === 0) {
            if (matchOct ? (s0 !== qSteps[0]) : ((s0 % 7) !== qLets[0])) continue;
            if (matchAcc) {
              const oct0 = (s0 / 7) | 0;
              const alt0 = m0 - (oct0 * 12 + NOTE_SEMI[s0 % 7]);
              if (alt0 !== qAlts[0]) continue;
            }
          }
          const d0 = buf[idx4 + 2];
          if (rhyCode === 2 && Math.abs(d0 - qDur0) > 2) continue;

          let prevS = s0, prevM = m0, ok = true;
          let matchedNotes = null;

          for (let k = 1; k < m; k++) {
            curIdx++;
            if (collapse) {
              /* skip consecutive repeated pitches if collapsing */
              while (curIdx < off + count) {
                const c4 = curIdx << 2;
                const cs = buf[c4] & 0x7F, cm = buf[c4 + 1] & 0x7F, car = buf[c4] & 0x80;
                if (!car && cs === prevS && cm === prevM) curIdx++;
                else break;
              }
              if (curIdx >= off + count) { ok = false; break; }
            }
            const k4 = curIdx << 2;
            const bk0 = buf[k4];
            if (noRest && (bk0 & 0x80)) { ok = false; break; }
            const sk = bk0 & 0x7F, mk = buf[k4 + 1] & 0x7F;

            if (modeCode === 0) {
              if (matchOct ? (sk !== qSteps[k]) : ((sk % 7) !== qLets[k])) { ok = false; break; }
              if (matchAcc) {
                const octk = (sk / 7) | 0;
                const altk = mk - (octk * 12 + NOTE_SEMI[sk % 7]);
                if (altk !== qAlts[k]) { ok = false; break; }
              }
            } else if (modeCode === 1) {
              if (sk - prevS !== dSteps[k] || mk - prevM !== dSemis[k]) { ok = false; break; }
            } else {
              if (sk - prevS !== dSteps[k]) { ok = false; break; }
            }

            if (rhyCode !== 0) {
              const dk = buf[k4 + 2];
              if (rhyCode === 2) {
                if (Math.abs(dk - qDurs[k]) > 2) { ok = false; break; }
              } else {
                if (Math.abs(dk * qDur0 - d0 * qDurs[k]) > Math.max(qDur0, qDurs[k]) * 2) { ok = false; break; }
              }
            }
            prevS = sk; prevM = mk;
          }

          if (ok) {
            /* build the realization key (note names of the matched passage) */
            const first4 = (off + i) << 2, last4 = curIdx << 2;
            const bar1 = buf[first4 + 3] | (((buf[first4 + 1] >> 7) & 1) << 8);
            const bar2 = buf[last4 + 3] | (((buf[last4 + 1] >> 7) & 1) << 8);
            const labels = [];
            const noteList = [];
            let scanIdx = off + i, pS = -1, pM = -1;
            for (let k = 0; k < m; k++) {
              if (k > 0 && collapse) {
                while (scanIdx < off + count) {
                  const c4 = scanIdx << 2;
                  const cs = buf[c4] & 0x7F, cm = buf[c4 + 1] & 0x7F, car = buf[c4] & 0x80;
                  if (!car && cs === pS && cm === pM) scanIdx++;
                  else break;
                }
              }
              const c4 = scanIdx << 2;
              const cs = buf[c4] & 0x7F, cm = buf[c4 + 1] & 0x7F, cd = buf[c4 + 2];
              const oct = (cs / 7) | 0, letIdx = cs % 7;
              const alt = cm - (oct * 12 + NOTE_SEMI[letIdx]);
              const nLbl = noteLabel(cs, alt, matchOct);
              labels.push(rhyCode !== 0 ? `${nLbl} (${durLabel(cd)})` : nLbl);
              noteList.push({step: cs, alt, d: Math.max(0.125, Math.round((cd / 24) * 8) / 8)});
              pS = cs; pM = cm;
              scanIdx++;
            }
            res.push({
              p: pi,
              vName: vNames[vnId],
              bar1,
              bar2,
              key: labels.join(' – '),
              notes: noteList
            });
          }
        }
        off += count;
      }
    }
    return {res, voicesExamined, notesExamined};
  }

  function cbLink(r){
    const e = CAT_DATA.pieces[r.p];
    return `../choirbook.html?piece=${encodeURIComponent(e.k).replace(/%2F/g, '/')}&bar=${r.bar1}&to=${r.bar2}`;
  }
  function whereText(r){
    return r.bar1 === r.bar2 ? `bar ${r.bar1}` : `bars ${r.bar1}–${r.bar2}`;
  }

  function renderResults(out){
    const res = out.res, n = res.length;
    const by = new Map();
    for (const r of res) {
      if (!by.has(r.key)) by.set(r.key, []);
      by.get(r.key).push(r);
    }
    groups = [...by.entries()].map(([key, list]) => ({key, list, shown: 0})).sort((a, b) => b.list.length - a.list.length);
    const nPieces = new Set(res.map(r => r.p)).size;
    let h = `<div class="rdx-card"><p class="rdx-summary">Found <strong>${n.toLocaleString('en')}</strong> occurrence${n === 1 ? '' : 's'} in <strong>${nPieces.toLocaleString('en')}</strong> piece${nPieces === 1 ? '' : 's'} (${out.notesExamined.toLocaleString('en')} notes across ${out.voicesExamined.toLocaleString('en')} voices examined).</p>`;
    if (n) {
      h += `<table class="rdx-groups"><thead><tr><th>Melodic realization (click to expand)</th><th class="num">Occurrences</th><th class="num">Share</th></tr></thead><tbody>`;
      groups.forEach((g, gi) => {
        h += `<tr><td><button type="button" class="rdx-gbtn" data-g="${gi}" aria-expanded="false">${esc(g.key)}</button></td><td class="num">${g.list.length.toLocaleString('en')}</td><td class="num">${(g.list.length * 100 / n).toFixed(2)} %</td></tr>`;
        h += `<tr hidden id="mgr${gi}"><td class="rdx-sub" colspan="3"></td></tr>`;
      });
      h += `</tbody></table>`;
    }
    h += `</div>`;
    document.getElementById('melResults').innerHTML = h;
    if (groups.length === 1) {
      const row = document.getElementById('mgr0'), btn = document.querySelector('.rdx-gbtn[data-g="0"]');
      if (row && btn) { openGroup(0); row.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    }
    postHeight();
  }

  function itemRows(g, gi, from, to){
    let h = '';
    for (let k = from; k < to; k++) {
      const r = g.list[k], e = CAT_DATA.pieces[r.p], id = `ms${gi}-${k}`;
      h += `<tr>` +
        `<td style="white-space:nowrap"><button type="button" class="rdx-btn light small mshow" data-g="${gi}" data-k="${k}" aria-expanded="false">Show</button> ` +
        `<button type="button" class="rdx-btn light small mput" data-g="${gi}" data-k="${k}" title="Load this matched melody onto the staff above">On staff</button></td>` +
        `<td>${esc(nameOf(e.c))}${e.a ? ' (attr.)' : ''}</td>` +
        `<td>${esc(e.t)}</td>` +
        `<td><em>${esc(r.vName)}</em></td>` +
        `<td class="where">${esc(whereText(r))}</td>` +
        `<td><a href="${esc(cbLink(r))}" target="_blank" rel="noopener">Open in ChoirBook ↗</a></td>` +
        `</tr>` +
        `<tr hidden id="${id}"><td colspan="6"><div class="rdx-snip"></div></td></tr>`;
    }
    return h;
  }

  function openGroup(gi){
    const g = groups[gi], row = document.getElementById('mgr' + gi), cell = row.firstElementChild;
    if (!g.shown) {
      g.shown = Math.min(SHOW_STEP, g.list.length);
      cell.innerHTML = `<table class="rdx-items"><thead><tr><th></th><th>Composer</th><th>Title</th><th>Voice</th><th>Where</th><th></th></tr></thead><tbody>${itemRows(g, gi, 0, g.shown)}</tbody></table>` +
        (g.shown < g.list.length ? `<button type="button" class="rdx-btn light small mmore" style="margin-top:.5rem" data-g="${gi}">Show more (${(g.list.length - g.shown).toLocaleString('en')} left)</button>` : '');
    }
  }

  /* Read-only ChoirBook (Scriptorium) SVG preview: 1 bar before through 1 bar after, found melody marked in blue */
  const kernCache = {};
  function catScoreUrl(e){
    if (e.h) return 'choirbook/redix-progressio/' + e.k + '.krn';
    return CAT_DATA.sources[e.s] + (e.u || (e.s === 'pal' ? e.k.slice(4) : e.k) + '.krn');
  }
  function renderChoirBookPreview(kernText, r){
    const P = parseKern(kernText);
    const bt = n => {
      const b = (P.barNums || []).find(x => x.n === n);
      if (b) return b.t;
      if (n <= 1) return 0;
      return null;
    };
    const fromBar = Math.max(1, r.bar1 - 1);
    const toBar = r.bar2 + 1;
    const t0 = bt(fromBar) ?? 0;
    const t1 = bt(toBar + 1) ?? P.end;
    const m0 = (bt(r.bar1) ?? t0) - t0;
    const m1 = (bt(r.bar2 + 1) ?? t1) - t0;

    /* Slice each voice cleanly to [t0, t1] */
    const slicedVoices = P.voices.map(v => {
      const c0 = clefAt(v, t0), k0 = keyAt(v, t0), met0 = metAt(v, t0);
      const evs = [];
      for (const e of v.events) {
        const ea = e.t, eb = rt(e.t + e.d);
        if (eb <= t0 + EPS || ea >= t1 - EPS) continue;
        const a = Math.max(ea, t0), b = Math.min(eb, t1);
        const ne = Object.assign({}, e, {t: rt(a - t0), d: rt(b - a), syl: ea >= t0 - EPS ? e.syl : []});
        if (a > ea + EPS) { ne.tieStart = false; ne.tieMid = false; ne.tieEnd = false; }
        if (b < eb - EPS) { ne.tieStart = false; }
        evs.push(ne);
      }
      /* Ensure a modern G/F clef for readability matching ChoirBook modern clefs */
      const noteSteps = evs.filter(e => !e.rest).map(e => e.step);
      const vClef = c0 && (c0 === 'treble' || c0 === 'treble8' || c0 === 'bass') ? c0 : clefForNotes(noteSteps.map(s => ({step: s})));
      const clefs = [{t: 0, c: CLEF_KERN[vClef] || 'G2', ei: 0}];
      const keys = [{t: 0, alts: Object.assign({}, k0), ei: 0}];
      const mets = met0 ? [{t: 0, sign: met0, ei: 0}] : [];
      return Object.assign({}, v, {events: evs, clefs, keys, mets, kclef: CLEF_KERN[vClef] || 'G2', clef: vClef, end: rt(t1 - t0)});
    });

    const sliced = {
      title: '', composer: '', attributed: false,
      voices: slicedVoices,
      bars: (P.bars || []).filter(b => b.t > t0 + EPS && b.t < t1 - EPS).map(b => Object.assign({}, b, {t: rt(b.t - t0)})),
      barNums: (P.barNums || []).filter(b => b.t >= t0 - EPS && b.t <= t1 + EPS).map(b => Object.assign({}, b, {t: rt(b.t - t0)})),
      sections: [],
      end: rt(t1 - t0),
      meta: {}
    };

    /* Locate the exact matched melody in the matched voice and mark its events with _melHit = true */
    let targetVi = sliced.voices.findIndex(v => (v.name || '').toLowerCase() === (r.vName || '').toLowerCase());
    if (targetVi < 0) targetVi = 0;
    const tv = sliced.voices[targetVi];
    if (tv && r.notes && r.notes.length) {
      /* Build sounding note groups (merging tied continuations) for target voice */
      const groupsV = [];
      for (let i = 0; i < tv.events.length; i++) {
        const e = tv.events[i];
        if (e.rest) { groupsV.push({rest: true, eis: [i], t: e.t}); continue; }
        if ((e.tieEnd || e.tieMid) && groupsV.length && !groupsV[groupsV.length - 1].rest && groupsV[groupsV.length - 1].step === e.step) {
          groupsV[groupsV.length - 1].eis.push(i);
          continue;
        }
        const letter = LETTERS[((e.step % 7) + 7) % 7];
        const sig = keyAt(tv, e.t)[letter] || 0;
        const alt = (e.alt !== null && e.alt !== undefined) ? e.alt : sig;
        groupsV.push({rest: false, step: e.step, alt, t: e.t, eis: [i]});
      }
      const notesV = groupsV.filter(g => !g.rest);
      const M = r.notes.length;
      let bestStart = -1, bestDist = 1e9;
      for (let i = 0; i <= notesV.length - M; i++) {
        let ok = true;
        for (let k = 0; k < M; k++) {
          if (notesV[i + k].step !== r.notes[k].step || notesV[i + k].alt !== r.notes[k].alt) { ok = false; break; }
        }
        if (ok) {
          const dist = notesV[i].t >= m0 - EPS && notesV[i].t <= m1 + EPS ? 0 : Math.abs(notesV[i].t - m0);
          if (dist < bestDist) { bestDist = dist; bestStart = i; }
        }
      }
      if (bestStart >= 0) {
        for (let k = 0; k < M; k++) {
          for (const ei of notesV[bestStart + k].eis) tv.events[ei]._melHit = true;
        }
      }
    }

    /* Temporarily render `sliced` using Scriptorium's own prepare() + layoutScore() */
    const saved = {
      piece, pieceKey, voiceNames: APP.voiceNames,
      paper: st.paper, view: st.view, size: st.size, bars: st.bars, bnum: st.bnum, clefs: st.clefs, webScroll: st.webScroll,
      visSnap: st.vis['__mel_preview__']
    };
    let svgs = [], hitIds = [];
    const sp = 1.65;
    try {
      piece = sliced;
      pieceKey = '__mel_preview__';
      APP.voiceNames = true;
      st.vis['__mel_preview__'] = {};
      sliced.voices.forEach((v, vi) => { st.vis['__mel_preview__'][vi] = {on: true, notes: true, lyr: true, play: false, clef: v.clef}; });
      st.paper = 'web'; st.view = 'score'; st.size = sp; st.bars = 'full'; st.bnum = '1'; st.clefs = 'modern'; st.webScroll = 'vertical';
      prepare();
      const wmm = Math.min(270, Math.max(170, (document.getElementById('melResults').clientWidth || 820) * 25.4 / 96 - 16));
      const G = {web: true, wmm, hmm: 240, sp, W: wmm / sp, H: 240 / sp, M: 6};
      svgs = layoutScore(G).map(svg => {
        const m = /viewBox="0 0 ([-\d.]+) ([\d.]+)"/.exec(svg);
        if (!m) return svg;
        const pw = Math.round(+m[1] * sp * 96 / 25.4), ph = Math.round(+m[2] * sp * 96 / 25.4);
        return svg.replace('<svg ', `<svg width="${pw}" height="${ph}" `);
      });
      /* Collect every symbol g class id belonging to the matched melody */
      if (sliced.voices[targetVi] && sliced.voices[targetVi].syms) {
        sliced.voices[targetVi].syms.forEach((s, qi) => {
          if (s.src && s.src.some(ei => sliced.voices[targetVi].events[ei] && sliced.voices[targetVi].events[ei]._melHit)) {
            hitIds.push(`n${targetVi}-${qi}`);
          }
        });
      }
    } finally {
      piece = saved.piece;
      pieceKey = saved.pieceKey;
      APP.voiceNames = saved.voiceNames;
      st.paper = saved.paper; st.view = saved.view; st.size = saved.size;
      st.bars = saved.bars; st.bnum = saved.bnum; st.clefs = saved.clefs; st.webScroll = saved.webScroll;
      if (saved.visSnap) st.vis['__mel_preview__'] = saved.visSnap; else delete st.vis['__mel_preview__'];
      if (piece) prepare();
    }
    return {svgs, hitIds, fromBar, toBar};
  }

  async function toggleSnippet(btn){
    const gi = +btn.dataset.g, k = +btn.dataset.k, row = document.getElementById(`ms${gi}-${k}`), box = row.querySelector('.rdx-snip');
    if (openSnip && openSnip.row === row) { closeSnip(); return; }
    closeSnip();
    openSnip = {row, btn};
    row.hidden = false; btn.textContent = 'Hide'; btn.setAttribute('aria-expanded', 'true');
    box.innerHTML = '<p class="rdx-status">Loading ChoirBook preview…</p>';
    postHeight();
    const r = groups[gi].list[k], e = CAT_DATA.pieces[r.p];
    try {
      const t = await (kernCache[e.k] || (kernCache[e.k] = fetch(catScoreUrl(e)).then(x => { if (!x.ok) throw new Error('Could not load the score.'); return x.text(); })));
      if (!openSnip || openSnip.row !== row) return;
      const {svgs, hitIds, fromBar, toBar} = renderChoirBookPreview(t, r);
      box.innerHTML = `<div class="cb-prev">${svgs.join('')}</div>` +
        `<p class="cap">ChoirBook preview · Bars ${fromBar}–${toBar} · <strong>${esc(r.vName)}</strong> (matched melody in blue): ${esc(r.key)}.</p>`;
      /* Apply blue highlight class and subtle blue background pill to matched notes */
      const hitSet = new Set(hitIds);
      const hitEls = [];
      box.querySelectorAll('svg g[class^="n"]').forEach(g => {
        const cls = g.classList[0];
        if (hitSet.has(cls)) { g.classList.add('mel-hit'); hitEls.push(g); }
      });
      if (hitEls.length) {
        /* Group contiguous hits by parent SVG group and add a soft blue highlight band behind them */
        const byParent = new Map();
        hitEls.forEach(g => { const p = g.parentNode; if (!byParent.has(p)) byParent.set(p, []); byParent.get(p).push(g); });
        byParent.forEach((els, p) => {
          let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
          els.forEach(g => { const b = g.getBBox(); if (b.width) { x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height); } });
          if (x1 < x2) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', 'mel-hi-bg');
            rect.setAttribute('x', (x1 - 0.5).toFixed(2));
            rect.setAttribute('y', (y1 - 0.45).toFixed(2));
            rect.setAttribute('width', (x2 - x1 + 1.0).toFixed(2));
            rect.setAttribute('height', (y2 - y1 + 0.9).toFixed(2));
            p.insertBefore(rect, els[0]);
          }
        });
      }
    } catch (err) {
      box.innerHTML = `<p class="rdx-err">${esc(err.message || err)}</p>`;
    }
    postHeight();
  }
  function closeSnip(){
    if (!openSnip) return;
    openSnip.row.hidden = true;
    openSnip.row.querySelector('.rdx-snip').innerHTML = '';
    openSnip.btn.textContent = 'Show';
    openSnip.btn.setAttribute('aria-expanded', 'false');
    openSnip = null;
    postHeight();
  }

  document.getElementById('melResults').addEventListener('click', ev => {
    const gb = ev.target.closest('.rdx-gbtn');
    if (gb) {
      const gi = +gb.dataset.g, row = document.getElementById('mgr' + gi), open = row.hidden;
      openGroup(gi); row.hidden = !open; gb.setAttribute('aria-expanded', String(open));
      postHeight();
      return;
    }
    const mb = ev.target.closest('.mmore');
    if (mb) {
      const gi = +mb.dataset.g, g = groups[gi], to = Math.min(g.shown + SHOW_STEP, g.list.length);
      mb.previousElementSibling.querySelector('tbody').insertAdjacentHTML('beforeend', itemRows(g, gi, g.shown, to));
      g.shown = to;
      if (to >= g.list.length) mb.remove(); else mb.textContent = `Show more (${(g.list.length - to).toLocaleString('en')} left)`;
      postHeight();
      return;
    }
    const sb = ev.target.closest('.mshow');
    if (sb) { toggleSnippet(sb); return; }
    const pb = ev.target.closest('.mput');
    if (pb) {
      const r = groups[+pb.dataset.g].list[+pb.dataset.k];
      if (r && r.notes) {
        setStaffMelody(r.notes, clefForNotes(r.notes), searchMode);
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    }
  });

  async function runSearch(){
    const stEl = document.getElementById('melStatus'), go = document.getElementById('melGo');
    go.disabled = true; closeSnip();
    try {
      const D = await loadCorpus();
      const q = extractQuery();
      stEl.textContent = 'Searching 2,186,376 notes…';
      await new Promise(r => setTimeout(r, 15));
      const t0 = performance.now();
      const out = searchCorpus(D, q);
      renderResults(out);
      stEl.textContent = `Done in ${((performance.now() - t0) / 1000).toFixed(2)} s.`;
    } catch (err) {
      stEl.innerHTML = `<span class="rdx-err">${esc(err.message || err)}</span>`;
    } finally {
      go.disabled = false;
      postHeight();
    }
  }

  document.getElementById('melForm').addEventListener('submit', e => {
    e.preventDefault();
    runSearch();
  });

  /* ---------------- Plug into the Scriptorium engine ---------------- */
  async function defaultMelody(){
    /* Start in Web view with C D E F D E C in G2 clef, searching by exact intervals */
    st.view = 'score'; st.paper = 'web'; st.clefs = 'modern';
    const notes = parseQuickText('C D E F D E C');
    await setStaffMelody(notes, clefForNotes(notes), 'semi');
    loadCorpus().then(() => runSearch()).catch(() => {});
  }

  Object.assign(H, {
    afterRender(){
      syncModeUI();
    },
    newScore(){
      setStaffMelody([], lastRealClef || 'treble', searchMode);
      toast('Empty staff ready. Click on the staff or press A–G to write a melody.');
    },
    async buildPieceList(){
      libEl.innerHTML = `<div id="libMine">${mineHtml()}</div>`;
    },
    start(){
      (async () => {
        try { await document.fonts.load('100px "IM Fell English"'); await document.fonts.load('italic 100px "IM Fell English"'); } catch (e) {}
        st.view = 'score'; st.paper = 'web'; st.clefs = 'modern';
        syncUI(); sizeViewer();
        await defaultMelody();
        buildPieceList().then(syncUI);
      })();
    }
  });
}]);
