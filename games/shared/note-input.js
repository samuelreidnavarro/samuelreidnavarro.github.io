/* Note input: the editing tools shared by the CantusFirmus and ChoirBook apps.
   Both apps load this one file, so they have the same buttons, the same keys and the same behaviour.
   Each app hands over an adapter A with:
     A.edit()                  true while the Edit button is on
     A.state()                 {selected, dur, rest, target: {r, a, p} | null, canUndo, canRedo, hasNotes, durs: [value keys]}
                               target is the note the arrows, accidentals and dot act on: the selected note, or else the
                               note just entered (left of the cursor). a is '' | 'b' | 'n' | '#'
     A.setDur(k) A.setRestMode(on) A.toggleAcc(a) A.toggleDot() A.stepPitch(d) A.moveSel(dir) A.deleteTarget()
     A.typeNote('C') A.typeRest() A.undo() A.redo() A.deselect() A.togglePlay() A.scaleAll(dir) A.shiftOctave(dir)
     A.mutate(fn)              one undoable change
     A.pitched()               the notes that transpose (not rests), each {s, alter}; A.setPitch(h, s, alter)
                               (alter null: no sharp or flat of its own, the signature applies)
     A.range                   [lowest step, highest step]
     A.toast(msg)
*/
(function(){
'use strict';
const DKEYS = ['Mx', 'L', 'B', 'S', 'M', 'Sm', 'F'];
const DNAME = {Mx: 'Maxima', L: 'Longa', B: 'Brevis', S: 'Semibrevis', M: 'Minima', Sm: 'Semiminima', F: 'Fusa'};
const ACC = {
  'b': {g: 'fl', name: 'Flat',    key: '-'},
  'n': {g: 'na', name: 'Natural', key: 'N'},
  '#': {g: 'sh', name: 'Sharp',   key: '='}
};
const SEMI = [0, 2, 4, 5, 7, 9, 11];
const mod7 = s => ((s % 7) + 7) % 7;
const $ = s => document.querySelector(s);
const CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg>';
const setPressed = (el, on) => el.setAttribute('aria-pressed', on ? 'true' : 'false');

/* o.what: 'melody' | 'voice'; o.whole: 'the whole cantus firmus' | 'the whole voice'; o.extra: the app's own buttons at the end */
function markup(o){
  return `
      <div class="podg">
        <button class="ib" id="undo" aria-label="Undo" title="Undo (Ctrl+Z)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5V13.2c4.6-.4 7.4.6 9.6 4.3-.5-5.2-3.6-8.6-9.6-9.2Z"/></svg></button>
        <button class="ib" id="redo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 7 5 5-5 5v-3.8c-4.6-.4-7.4.6-9.6 4.3.5-5.2 3.6-8.6 9.6-9.2Z"/></svg></button>
        <button class="ib" id="del" aria-label="Delete selected note" title="Delete the selected note (Delete)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4h7l.8 1.5H20V7.5H4V5.5h3.7ZM6 9h12l-.9 11H6.9Z"/></svg></button>
      </div>
      <div class="podg" id="navPod">
        <button class="ib" id="selPrev" aria-label="Select the previous note" title="Select the previous note (Left arrow)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.6-1.6L11.2 12 17 6.2Z"/></svg></button>
        <button class="ib" id="stepUp" aria-label="Move the selected note up a step" title="Move the selected note up a step (Up arrow)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.6 15.4 12 8l7.4 7.4-1.6 1.6L12 11.2 6.2 17Z"/></svg></button>
        <button class="ib" id="stepDown" aria-label="Move the selected note down a step" title="Move the selected note down a step (Down arrow)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.6 8.6 12 16l7.4-7.4L17.8 7 12 12.8 6.2 7Z"/></svg></button>
        <button class="ib" id="selNext" aria-label="Select the next note" title="Select the next note (Right arrow)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4L7 17.8 12.8 12 7 6.2Z"/></svg></button>
      </div>
      <div class="podg">
      <div class="pop" id="popDur">
        <span class="sr" id="durLabel">Note value</span>
        <button class="tb popbtn" id="durSum" aria-haspopup="true" aria-label="Note value"></button>
        <div class="popbody"><div class="btns" id="durBtns" role="group" aria-labelledby="durLabel"></div></div>
      </div>
      <button class="ib" id="restBtn" aria-pressed="false" aria-label="Enter rests" title="Enter rests (R)"></button>
      </div>
      <div class="podg"><div class="btns" id="accBtns" role="group" aria-label="Accidental"></div></div>
      <div class="podg"><div class="pop" id="popXform">
        <button class="tb popbtn" id="xfSum" aria-haspopup="true">Transform ${o.what}${CHEV}</button>
        <div class="popbody">
          <div class="btns col">
            <button class="tb" id="xfWho" data-keep aria-expanded="false" aria-controls="xfList" title="Which voices the changes below act on" hidden>All voices${CHEV}</button>
            <div id="xfList" class="advt xflist" role="group" aria-label="Voices to transform" hidden></div>
            <button class="tb" id="octup" title="Move ${o.whole} up an octave">Octave up</button>
            <button class="tb" id="octdn" title="Move ${o.whole} down an octave">Octave down</button>
            <button class="tb" id="tonup" title="Move ${o.whole} up to the next key on C D E F G A B♭, adding sharps and flats to the notes where needed">Tone up</button>
            <button class="tb" id="tondn" title="Move ${o.whole} down to the previous key on C D E F G A B♭, adding sharps and flats to the notes where needed">Tone down</button>
            <button class="tb" id="dbl" title="Doubles every note and rest: brevis becomes longa, and so on">Double all values</button>
            <button class="tb" id="hlv" title="Halves every note and rest: brevis becomes semibrevis, and so on">Halve all values</button>
            <button class="tb" id="advBtn" data-keep aria-expanded="false" aria-controls="advT">Advanced transposition${CHEV}</button>
            <div id="advT" class="advt" hidden>
              <div class="seg" role="group" aria-label="Direction"><button class="tb" data-dir="1" data-keep aria-pressed="true">Up</button><button class="tb" data-dir="-1" data-keep aria-pressed="false">Down</button></div>
              <div class="ivrow"><select id="advQ" aria-label="Quality of the interval"></select><select id="advN" aria-label="Interval"></select></div>
              <label class="check" title="On: every interval stays exactly the same, so D minor becomes G minor, with sharps and flats on the notes. Off: every note moves the same number of steps along the scale, so D dorian becomes E phrygian"><input type="checkbox" id="advExact" checked> Respect intervallic structure</label>
              <button class="tb" id="advGo">Transpose</button>
            </div>
          </div>
        </div>
      </div></div>
      ${o.extra || ''}`;
}
const STYLE = `.editbar{margin-top:10px}.editbar[hidden]{display:none!important}`;

/* ---------------- transposition (works on {s, alter}, so on any app's notes) ---------------- */
const KEYS = [0, 2, 4, 5, 7, 9, 10];
const natMidi = s => 12 * (Math.floor(s / 7) + 1) + SEMI[mod7(s)];
const midiOf = h => natMidi(h.s) + h.alter;
function tonePlan(A, dir){
  const pn = A.pitched();
  if (!pn.length) return null;
  const pc = ((midiOf(pn[pn.length - 1]) % 12) + 12) % 12;
  let semis = 0;
  for (let k = 1; k <= 12; k++) { if (KEYS.includes((((pc + dir * k) % 12) + 12) % 12)) { semis = dir * k; break; } }
  if (!semis || pn.some(x => x.s + dir < A.range[0] || x.s + dir > A.range[1])) return null;
  return semis;
}
function transposeTone(A, dir){
  const semis = tonePlan(A, dir);
  if (semis === null) return;
  A.mutate(() => {
    for (const h of A.pitched()) {
      const target = midiOf(h) + semis, s = h.s + dir;
      A.setPitch(h, s, Math.max(-1, Math.min(1, target - natMidi(s))));
    }
  });
}
const IV_NUM = ['unison', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'octave'];
const IV_BASE = [0, 2, 4, 5, 7, 9, 11, 12];
const IV_Q = {d: 'diminished', m: 'minor', M: 'major', P: 'perfect', A: 'augmented'};
const ivPerfect = n => n === 0 || n === 3 || n === 4 || n === 7;
const ivQualities = n => n === 0 ? ['A'] : ivPerfect(n) ? ['d', 'P', 'A'] : ['d', 'm', 'M', 'A'];
const ivSemis = (n, q) => IV_BASE[n] + ({d: ivPerfect(n) ? -1 : -2, m: -1, M: 0, P: 0, A: 1})[q];
const adv = {dir: 1, n: 3, q: 'P', exact: true};
function fillAdvIntervals(){
  const N = $('#advN'), Q = $('#advQ');
  if (!adv.exact && adv.n === 0) adv.n = 1;
  N.innerHTML = IV_NUM.map((w, i) => i === 0 && !adv.exact ? '' : `<option value="${i}">${w}</option>`).join('');
  N.value = String(adv.n);
  const qs = ivQualities(adv.n);
  if (!qs.includes(adv.q)) { const alt = ({M: 'P', m: 'P', P: 'M'})[adv.q]; adv.q = qs.includes(alt) ? alt : qs.includes('P') ? 'P' : qs.includes('M') ? 'M' : qs[0]; }
  Q.innerHTML = qs.map(q => `<option value="${q}">${IV_Q[q]}</option>`).join('');
  Q.value = adv.q;
  Q.hidden = !adv.exact;
}
/* the step and alteration that sound `target`; a double sharp or flat is written on the neighbouring letter */
function spellAs(A, h, target){
  for (const ds of [0, 1, -1]) {
    const s = h.s + ds, want = target - natMidi(s);
    if (Math.abs(want) > 1) continue;
    A.setPitch(h, s, want);
    return;
  }
}
function advTranspose(A){
  const steps = adv.n, semis = ivSemis(adv.n, adv.q), dir = adv.dir;
  const pn = A.pitched();
  if (!pn.length) return;
  if (pn.some(x => x.s + dir * steps < A.range[0] + 1 || x.s + dir * steps > A.range[1] - 1)) { A.toast('That would take the notes out of range.'); return; }
  A.mutate(() => {
    for (const h of A.pitched()) {
      const target = midiOf(h) + dir * semis;
      if (adv.exact) spellAs(A, Object.assign({}, h, {s: h.s + dir * steps}), target);
      else A.setPitch(h, h.s + dir * steps, null);   /* null: no sharp or flat of its own, the signature applies */
    }
  });
}

/* ---------------- the bar ---------------- */
function build(host, o){
  if (!document.getElementById('note-input-style')) {
    const st = document.createElement('style'); st.id = 'note-input-style'; st.textContent = STYLE; document.head.appendChild(st);
  }
  host.innerHTML = markup(o);
}
/* the glyph buttons; iconSVG(glyphKey, minBox) comes from the app (both draw the same glyphs) */
function fill(A, iconSVG){
  const durBtns = $('#durBtns');
  DKEYS.forEach((k, ix) => {
    const b = document.createElement('button');
    b.className = 'ib'; b.dataset.d = k;
    b.title = `${DNAME[k]} (${ix + 1})`;
    b.setAttribute('aria-label', DNAME[k]);
    b.innerHTML = iconSVG(k, 2.7);
    b.addEventListener('click', () => A.setDur(k));
    durBtns.appendChild(b);
  });
  $('#restBtn').innerHTML = iconSVG('rB', 1.4);
  const accBtns = $('#accBtns');
  /* Ed.: the next accidental (or the selected note's accidental) becomes editorial, written above the staff */
  if (A.toggleEd) {
    const eb = document.createElement('button');
    eb.className = 'ib edbtn'; eb.id = 'edBtn';
    eb.title = 'Editorial accidental: the next accidental you enter, or the one on the selected note, goes above the staff';
    eb.setAttribute('aria-label', 'Editorial accidental');
    eb.innerHTML = '<span>Ed.</span>';
    eb.addEventListener('click', () => A.toggleEd());
    accBtns.appendChild(eb);
  }
  Object.entries(ACC).forEach(([a, X]) => {
    const b = document.createElement('button');
    b.className = 'ib'; b.dataset.a = a;
    b.title = `${X.name} (${X.key})`;
    b.setAttribute('aria-label', X.name);
    b.innerHTML = iconSVG(X.g, 2.9);
    b.addEventListener('click', () => A.toggleAcc(a));
    accBtns.appendChild(b);
  });
  const db = document.createElement('button');
  db.className = 'ib'; db.id = 'dotBtn';
  db.title = 'Dot, punctus (.)';
  db.setAttribute('aria-label', 'Dot (punctus)');
  db.innerHTML = '<svg viewBox="-1 -1 2 2" aria-hidden="true"><circle r="0.3"/></svg>';
  db.addEventListener('click', () => A.toggleDot());
  accBtns.appendChild(db);
  /* coloration: the selected note black (two thirds of its value), or with nothing selected the notes entered next */
  if (A.toggleCol) {
    const cb = document.createElement('button');
    cb.className = 'ib'; cb.id = 'colBtn';
    cb.title = 'Coloration: the selected note black, two thirds of its value; with nothing selected, the notes you enter next (K)';
    cb.setAttribute('aria-label', 'Coloration');
    cb.innerHTML = iconSVG('Sc', 2.9);
    cb.addEventListener('click', () => A.toggleCol());
    accBtns.appendChild(cb);
  }
  /* ligature: the note joins the ligature before it, or starts one with the next note */
  if (A.toggleLig) {
    const lb = document.createElement('button');
    lb.className = 'ib'; lb.id = 'ligBtn';
    lb.title = 'Ligature: joins the note to the ligature before it, or starts one with the next note; on a ligature, takes its last note out or undoes it (L)';
    lb.setAttribute('aria-label', 'Ligature');
    lb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v5h-2V6H5v3H3Z"/><path d="M4 11h7v2.2H6.2v1.6H11V17H4Zm8 3h8v6h-8v-2.2h5.8v-1.6H12Z"/></svg>';
    lb.addEventListener('click', () => A.toggleLig());
    accBtns.appendChild(lb);
  }
  /* Insert or Overwrite: one button, showing the mode in use */
  if (A.toggleOverwrite) {
    const ob = document.createElement('button');
    ob.className = 'tb'; ob.id = 'ovrBtn';
    ob.title = 'Insert: a new note pushes the music after it along. Overwrite: it takes the place of what stands there, so the other voices stay in step. Alt + arrows move the caret by the chosen value, also into a note (I)';
    ob.addEventListener('click', () => A.toggleOverwrite());
    $('#restBtn').parentNode.appendChild(ob);
  }
}
function wire(A){
  $('#restBtn').addEventListener('click', () => A.setRestMode(!A.state().rest));
  $('#stepUp').addEventListener('click', () => A.stepPitch(1));
  $('#stepDown').addEventListener('click', () => A.stepPitch(-1));
  $('#selPrev').addEventListener('click', () => A.moveSel(-1));
  $('#selNext').addEventListener('click', () => A.moveSel(1));
  $('#del').addEventListener('click', () => A.deleteTarget());
  $('#undo').addEventListener('click', () => A.undo());
  $('#redo').addEventListener('click', () => A.redo());
  $('#dbl').addEventListener('click', () => A.scaleAll(-1));
  $('#hlv').addEventListener('click', () => A.scaleAll(1));
  $('#octdn').addEventListener('click', () => A.shiftOctave(-1));
  $('#octup').addEventListener('click', () => A.shiftOctave(1));
  $('#tonup').addEventListener('click', () => transposeTone(A, 1));
  $('#tondn').addEventListener('click', () => transposeTone(A, -1));
  fillAdvIntervals();
  $('#advBtn').addEventListener('click', () => { const t = $('#advT'); t.hidden = !t.hidden; $('#advBtn').setAttribute('aria-expanded', t.hidden ? 'false' : 'true'); });
  document.querySelectorAll('#advT [data-dir]').forEach(b => b.addEventListener('click', () => {
    adv.dir = Number(b.dataset.dir);
    document.querySelectorAll('#advT [data-dir]').forEach(x => setPressed(x, x === b));
  }));
  $('#advN').addEventListener('change', e => { const was = adv.n; adv.n = Number(e.target.value); if (was === 0) adv.q = 'M'; fillAdvIntervals(); });
  $('#advQ').addEventListener('change', e => { adv.q = e.target.value; });
  $('#advExact').addEventListener('change', e => { adv.exact = e.target.checked; fillAdvIntervals(); });
  $('#advGo').addEventListener('click', () => advTranspose(A));
  /* which voices Transform acts on: all of them, or one (only with more than one voice; A.xform() / A.setXform(v)) */
  if (A.xform) {
    $('#xfWho').addEventListener('click', () => {
      const L = $('#xfList'), open = L.hidden;
      if (open) {
        const X = A.xform();
        L.innerHTML = [['all', 'All voices']].concat(X.names.map((n, i) => [String(i), n])).map(([v, n]) =>
          `<button class="tb" data-xf="${v}" data-keep aria-pressed="${String(X.target) === v ? 'true' : 'false'}">${n.replace(/[&<>"]/g, c => '&#' + c.charCodeAt(0) + ';')}</button>`).join('');
      }
      L.hidden = !open; $('#xfWho').setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $('#xfList').addEventListener('click', e => {
      const b = e.target.closest('[data-xf]'); if (!b) return;
      A.setXform(b.dataset.xf === 'all' ? 'all' : +b.dataset.xf);
      $('#xfList').hidden = true; $('#xfWho').setAttribute('aria-expanded', 'false');
      sync(A);
    });
  }
  /* a choice in the value or Transform menu closes it (not the buttons marked data-keep) */
  document.querySelectorAll('#popDur .popbody, #popXform .popbody').forEach(body => body.addEventListener('click', e => {
    if (!e.target.closest('button') || e.target.closest('[data-keep]')) return;
    setTimeout(() => {
      const p = body.parentNode; p.classList.remove('open');
      if (window.matchMedia && matchMedia('(hover:hover)').matches) { p.classList.add('shut'); p.addEventListener('mouseleave', () => p.classList.remove('shut'), {once: true}); }
      const pb = p.querySelector('.popbtn'); if (pb) pb.setAttribute('aria-expanded', 'false');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }, 0);
  }));
  /* keys */
  document.addEventListener('keyup', e => {
    const tag = e.target.tagName;
    if (e.key === ' ' && (tag === 'BUTTON' || tag === 'SUMMARY')) e.preventDefault();   /* a focused button would also "click" */
  });
  document.addEventListener('keydown', e => {
    const t = e.target, tag = t.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t.isContentEditable) return;
    const mod = e.ctrlKey || e.metaKey, k = e.key, edit = A.edit();
    if (A.key && A.key(e)) { e.preventDefault(); return; }
    if (edit && mod && (k === 'z' || k === 'Z')) { e.preventDefault(); e.shiftKey ? A.redo() : A.undo(); return; }
    if (edit && mod && (k === 'y' || k === 'Y')) { e.preventDefault(); A.redo(); return; }
    if (edit && (k === 'ArrowUp' || k === 'ArrowDown')) {
      e.preventDefault();
      A.stepPitch((k === 'ArrowUp' ? 1 : -1) * (e.shiftKey || mod ? 7 : 1));
      return;
    }
    if (edit && e.altKey && !mod && (k === 'ArrowLeft' || k === 'ArrowRight') && A.moveCaret) { e.preventDefault(); A.moveCaret(k === 'ArrowLeft' ? -1 : 1); return; }
    if (mod || e.altKey) return;
    if (k === ' ') { e.preventDefault(); A.togglePlay(); return; }
    if (tag === 'BUTTON' && k === 'Enter') return;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); A.moveSel(k === 'ArrowLeft' ? -1 : 1); return; }
    if (k === 'Escape') { A.deselect(); return; }
    if (!edit) return;
    if (/^[a-gA-G]$/.test(k)) { e.preventDefault(); A.typeNote(k.toUpperCase()); return; }
    if (k === 'r' || k === 'R') { e.preventDefault(); A.typeRest(); return; }
    if (/^[1-7]$/.test(k)) { e.preventDefault(); A.setDur(DKEYS[Number(k) - 1]); return; }
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); A.deleteTarget(); return; }
    if (k === '-' || k === '_') { e.preventDefault(); A.toggleAcc('b'); return; }
    if (k === '=' || k === '+' || k === '#') { e.preventDefault(); A.toggleAcc('#'); return; }
    if (k === 'n' || k === 'N') { e.preventDefault(); A.toggleAcc('n'); return; }
    if (k === '.') { e.preventDefault(); A.toggleDot(); return; }
    if ((k === 'i' || k === 'I') && A.toggleOverwrite) { e.preventDefault(); A.toggleOverwrite(); return; }
    if ((k === 'k' || k === 'K') && A.toggleCol) { e.preventDefault(); A.toggleCol(); return; }
    if ((k === 'l' || k === 'L') && A.toggleLig) { e.preventDefault(); A.toggleLig(); return; }
  });
}
function sync(A){
  const S = A.state(), t = S.target;
  document.querySelectorAll('#durBtns button').forEach(b => setPressed(b, b.dataset.d === S.dur));
  $('#durLabel').textContent = `Note value: ${(DNAME[S.dur] || '').toLowerCase()}${S.selected ? ', selected' : ''}`;
  const sb = document.querySelector('#durBtns button[data-d="' + S.dur + '"]');
  if (sb) $('#durSum').innerHTML = sb.innerHTML + CHEV;
  setPressed($('#restBtn'), S.rest);
  document.querySelectorAll('#accBtns button[data-a]').forEach(b => {
    setPressed(b, !!t && !t.r && t.a === b.dataset.a);
    b.disabled = !t || t.r;
  });
  setPressed($('#dotBtn'), !!t && !t.r && !!t.p);
  if ($('#edBtn')) setPressed($('#edBtn'), !!S.edArm || (!!t && !t.r && !!t.a && !!t.ed));
  $('#dotBtn').disabled = !t || t.r;
  const cb = $('#colBtn'); if (cb) setPressed(cb, !!S.col);
  const lb = $('#ligBtn'); if (lb) { setPressed(lb, !!t && !t.r && !!t.lig); lb.disabled = !t || t.r; }
  const ob = $('#ovrBtn'); if (ob) { ob.textContent = S.ovr ? 'Overwrite' : 'Insert'; setPressed(ob, !!S.ovr); }
  $('#stepUp').disabled = $('#stepDown').disabled = (!t || t.r) && !S.range;
  $('#del').disabled = !t && !S.range;
  $('#selPrev').disabled = $('#selNext').disabled = !S.hasNotes;
  $('#undo').disabled = !S.canUndo;
  $('#redo').disabled = !S.canRedo;
  const d = S.durs || [];
  const dbl = $('#dbl'), hlv = $('#hlv');
  dbl.disabled = !d.length || d.includes('Mx');
  hlv.disabled = !d.length || d.includes('F');
  dbl.title = d.includes('Mx') ? 'A maxima has no larger value, so nothing can be doubled' : 'Doubles every note and rest: brevis becomes longa, and so on';
  hlv.title = d.includes('F') ? 'A fusa is the smallest value here, so nothing can be halved' : 'Halves every note and rest: brevis becomes semibrevis, and so on';
  if (A.xform) {
    const X = A.xform(), many = X.names.length > 1, who = X.target === 'all' ? null : X.names[X.target];
    $('#xfWho').hidden = !many || !!X.range;
    if (!many) $('#xfList').hidden = true;
    $('#xfWho').innerHTML = (who || 'All voices').replace(/[&<>"]/g, c => '&#' + c.charCodeAt(0) + ';') + CHEV;
    $('#xfSum').innerHTML = (X.range ? 'Transform selection' : !many ? 'Transform voice' : who ? 'Transform ' + who.replace(/[&<>"]/g, c => '&#' + c.charCodeAt(0) + ';') : 'Transform all voices') + CHEV;
  }
  const pn = A.pitched();
  $('#octdn').disabled = !pn.length || pn.some(x => x.s - 7 < A.range[0]);
  $('#octup').disabled = !pn.length || pn.some(x => x.s + 7 > A.range[1]);
  $('#tonup').disabled = tonePlan(A, 1) === null;
  $('#tondn').disabled = tonePlan(A, -1) === null;
  $('#advGo').disabled = !pn.length;
}
window.NoteInput = {DKEYS, DNAME, ACC, build, fill, wire, sync};
})();
