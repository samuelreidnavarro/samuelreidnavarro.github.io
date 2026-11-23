(function(){
'use strict';
/* ------------------------------------------------------------------ */
/* Scriptorium: the one engine of ChoirBook, CantusFirmus and Canon    */
/* Maker. Each app is a small page that sets window.SCRIPTORIUM (its   */
/* name, repertoire and add-ons) and loads this file.                  */
/* ------------------------------------------------------------------ */
const APP = Object.assign({
  id: 'choirbook', name: 'ChoirBook', page: 'choirbook.html', store: 'choirbook', msg: 'choirbook',
  pieces: [], catalogue: false, openFile: true, keep: true, drop: true, emptyStaves: false, newFirst: false
}, window.SCRIPTORIUM || {});
const H = APP.hooks = APP.hooks || {};
const L = Object.assign({lib: 'Repertoire', newScore: 'New score', newTitle: 'A new, empty score to write polyphony in', mine: 'My scores',
  mineHint: 'Star a piece in the library to keep it here. Scores you write with New score are kept here too.',
  mineSub: 'Your score, kept in this browser, '}, APP.labels || {});
const escH = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
{
  const esc = escH;
  const LIBSUB = L.libSub !== undefined ? L.libSub : L.lib === 'Repertoire' ? 'Digitized corpus' : '';
  const LIBBTN = LIBSUB
    ? `<button class="tb openfile" id="libBtn" aria-haspopup="true" aria-expanded="false" aria-controls="library"><span class="of-t">${esc(L.lib)}</span><span class="of-f">${esc(LIBSUB)}</span></button>`
    : `<button class="tb" id="libBtn" aria-haspopup="true" aria-expanded="false" aria-controls="library">${esc(L.lib)}</button>`;
  /* Open menu order (Samuel 2026-11-14): Repertoire, Open file, New score, then Recent scores and My scores */
  const OPENBTN = `<button class="tb openfile" id="openBtn"${APP.openFile === false ? ' hidden' : ''}><span class="of-t">Open file</span><span class="of-f">.mxl · MuseScore · MEI · MIDI · LilyPond · .krn · .gabc · CMME</span></button>`;
  const NEWBTN = `<button class="tb" id="newBtn" title="${esc(L.newTitle)}">${esc(L.newScore)}</button>`;
  document.body.insertAdjacentHTML('afterbegin', `<main class="wrap">
  <header class="top"><h1>${esc(APP.name)}</h1></header>

  <section class="tools" aria-label="View">
    <div class="bar">
      <div class="podg split" id="editPod"><button class="ib" id="editBtn" aria-pressed="false" aria-label="Note input" title="Note input: write, change and remove notes (N; Escape leaves it)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 17.3 14.8 6l3.2 3.2L6.7 20.5 3 21Zm13.7-12.6 1.4-1.4a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1l-1.4 1.4Z"/></svg></button><button class="ib edmore" id="editMore" aria-expanded="false" aria-controls="editBar" aria-label="Editing tools" title="Show or hide the editing tools"><svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button></div>
${APP.popsBeforeVoices || ''}
      <div class="podg"><div class="pop" id="popVoices">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Voices<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><table class="voices" id="voiceTable"></table><div id="staffCombine" hidden></div></div>
      </div></div>
      <div class="podg"><div class="pop" id="popPage">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Layout<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="staffset">
          <div class="subhead">Page</div>
          <span class="lab">Format</span><div class="btns" id="viewList" role="group" aria-label="Format"><button class="tb" data-v="score">Score</button><button class="tb" data-v="parts">Parts</button><button class="tb" data-v="choir">Choirbook</button></div>
          <span class="lab">Size</span><div class="btns" id="paperSeg" role="group" aria-label="Paper size"><button class="tb" data-v="A3">A3</button><button class="tb" data-v="A4">A4</button><button class="tb" data-v="A5">A5</button></div>
          <span class="lab">Orientation</span><div class="btns" id="orientSeg" role="group" aria-label="Orientation"><button class="tb" data-v="portrait">Portrait</button><button class="tb" data-v="landscape">Landscape</button></div>
          <div class="subhead">Staves &amp; Notes</div>
          <label class="ctl" for="size">Staff size</label><div class="rng-wrap" data-for="size"><input type="range" id="size" min="1" max="7" step="0.05"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
          <span class="lab-lock"><label class="ctl" for="noteSize">Note size</label><button type="button" class="lockbtn" id="sizeLock" aria-pressed="true" aria-label="Lock note size to staff size" title="Locked to staff size — click to adjust independently"></button></span><div class="rng-wrap" data-for="noteSize"><input type="range" id="noteSize" min="1" max="7" step="0.05"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
          <span class="lab">Staff colour</span><div class="swatches" id="staffSeg" role="group" aria-label="Staff colour"></div>
          <span class="lab-lock"><span class="lab">Note colour</span><button type="button" class="lockbtn" id="colLock" aria-pressed="true" aria-label="Lock note colour to staff colour" title="Locked to staff colour — click to adjust independently"></button></span><div class="swatches" id="noteColSeg" role="group" aria-label="Note colour"></div>
          <label class="ctl" for="thickL" title="Thicker staff lines, barlines and ledger lines">Staff line thickness</label><div class="rng-wrap" data-for="thickL"><input type="range" id="thickL" min="0" max="0.16" step="0.005"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
          <label class="ctl" for="thick" title="Thicker notes, rests, clefs, signs, stems and ties">Note thickness</label><div class="rng-wrap" data-for="thick"><input type="range" id="thick" min="0" max="0.16" step="0.005"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
          <div class="subhead">Spacing</div>
          <label class="ctl" for="hs">Horizontal spacing</label><div class="rng-wrap" data-for="hs"><input type="range" id="hs" min="-0.4" max="1.2" step="0.01"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
          <label class="ctl" for="vs">Vertical spacing</label><div class="rng-wrap" data-for="vs"><input type="range" id="vs" min="0" max="2" step="0.02"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
          <span class="lab">Equal staff distances</span><div class="btns" id="eqSeg" role="group" aria-label="Equal staff distances"><button class="tb" data-v="on" title="All staves of a system the same distance apart">On</button><button class="tb" data-v="off" title="Each staff as close to the one above as its notes, stems and words allow">Off</button></div>
          <label class="ctl" for="ss">Space between systems</label><div class="rng-wrap" data-for="ss"><input type="range" id="ss" min="0" max="3" step="0.05"><div class="rng-meta"><button type="button" class="rng-bound" data-end="min" title="Click to change minimum"></button><span class="rng-val" title="Current value"></span><button type="button" class="rng-bound" data-end="max" title="Click to change maximum"></button></div></div>
        </div></div>
      </div></div>
      <div class="podg"><div class="pop" id="popLook">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Engraving<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="staffset">
          <div class="subhead">Notation</div>
          <span class="lab">Notation</span><div class="btns" id="notaSeg" role="group" aria-label="Notation"><button class="tb" data-v="real" title="White mensural notation">White</button><button class="tb" data-v="black" title="Black mensural notation, for this piece only: filled notes, the semiminima with a flag, coloration in red">Black</button><button class="tb" data-v="fake" title="Modern rhythm, with ties and triplets">Modern</button></div>
          <span class="lab" id="headLab">Note heads</span><div class="btns" id="headSeg" role="group" aria-label="Note heads in modern notation"><button class="tb" data-v="modern" title="Round modern note heads (in modern notation)">Modern</button><button class="tb" data-v="old" title="Lozenge note heads (in modern notation)">Old</button></div>
          <span class="lab">Ligatures</span><div class="btns" id="ligSeg" role="group" aria-label="Ligatures"><button class="tb" data-v="on" title="Ligatures drawn as ligatures (in mensural notation)">On</button><button class="tb" data-v="off" title="The notes of a ligature written one by one, under a bracket">Off</button></div>
          <span class="lab">Stem direction</span><div class="btns" id="stemSeg" role="group" aria-label="Stem direction"><button class="tb" data-v="adaptive" title="Stems flip automatically near the top or bottom of the staff">Adaptive</button><button class="tb" data-v="strict" title="Historical mensural stem directions: minima, semiminima and fusa stems always point up; longa and maxima tails always point down (on single-voice staves)">Strict</button></div>
          <span class="lab">Clefs</span><div class="btns" id="clefSeg" role="group" aria-label="Clefs"><button class="tb" data-v="modern">Modern</button><button class="tb" data-v="mens">Old</button></div>
          <span class="lab">Staff lines</span><div class="btns lines-ctl" id="linesSeg" role="group" aria-label="Staff lines"><button class="tb" data-v="5">Five</button><button class="tb" data-v="4">Four</button><input type="number" id="linesNum" min="1" max="15" step="1" inputmode="numeric" title="Custom number of staff lines (1–15)" aria-label="Number of staff lines"></div>
          <div class="subhead">Bars &amp; Accidentals</div>
          <span class="lab">Barlines</span><div class="btns" id="barSeg" role="group" aria-label="Barlines"><button class="tb" data-v="none">None</button><button class="tb" data-v="tick">Ticks</button><button class="tb" data-v="out" title="Short ticks above and below the staff, nothing across it">Outside ticks</button><button class="tb" data-v="full">Through the staff</button></div>
          <label class="lab" for="bnumSel">Bar numbers</label><select id="bnumSel" title="Bar numbers above the staff, placed by time: they work with the barlines hidden too"><option value="off">None</option><option value="line">At the start of every line</option><option value="1">Every bar</option><option value="5">Every 5 bars</option><option value="10">Every 10 bars</option></select>
          <label class="lab bnx" for="bunitSel">A bar is</label><select class="bnx" id="bunitSel" title="What one bar is when counting"><option value="bar">From barline to barline</option><option value="mens">A breve of the mensuration sign</option><option value="S">A semibreve</option><option value="B">A breve</option><option value="Bp">A perfect breve (dotted)</option><option value="L">A long</option><option value="Lp">A perfect long</option></select>
          <span class="lab bnx">Bar numbers over</span><div class="btns bnx" id="bposSeg" role="group" aria-label="Bar numbers over"><button class="tb" data-v="top" title="Above the highest staff of each system">Top staff</button><button class="tb" data-v="all" title="Above every staff">Every staff</button></div>
          <span class="lab">Editorial accidentals</span><div class="btns" id="edSeg" role="group" aria-label="Editorial accidentals"><button class="tb" data-v="on">On</button><button class="tb" data-v="off">Off</button></div>
          <span class="lab">Accidentals</span><div class="btns" id="accSeg" role="group" aria-label="Accidental style"><button class="tb" data-v="modern" title="Standard vertical sharp and natural">Modern</button><button class="tb" data-v="old" title="Renaissance diagonal double-cross sharp (diesis) and square b quadratum">Old</button></div>
          <div class="subhead">Lyrics</div>
          <label class="lab" for="lyrFontSel">Font</label><select id="lyrFontSel" title="Font used for lyrics"></select>
          <label class="ctl" for="lyrPt">Size</label><span class="pt-field"><input type="number" id="lyrPt" min="4" max="36" step="0.5" inputmode="decimal" aria-label="Lyrics size in points"><span>pt</span></span>
          <span class="lab">Syllable dashes</span><div class="btns" id="dashSeg" role="group" aria-label="Syllable dashes"><button class="tb" data-v="on">On</button><button class="tb" data-v="off">Off</button></div>
          <span class="lab" id="verseLab">Verse</span><div class="btns" id="verseSeg" role="group" aria-label="Verse"></div>
          <span class="lab pslab">Presets</span><div id="presetBox"><div id="presetList"></div><div id="presetNew"><button class="tb" id="presetAdd">Save current settings as preset</button><span id="presetForm" hidden><input id="presetName" type="text" placeholder="Name" maxlength="30" autocomplete="off"><button class="tb" id="presetOk">Save</button></span></div></div>
        </div></div>
      </div></div>
      <div class="podg"><div class="pop" id="popView">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">View<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="staffset">
          <span class="lab">Display</span><div class="btns" id="dispSeg" role="group" aria-label="Display"><button class="tb" data-v="page">Page</button><button class="tb" data-v="web">Web</button></div>
          <span class="lab" id="flowLab">Pages</span><div class="btns" id="flowSeg" role="group" aria-label="Pages"><button class="tb" data-v="vertical">Vertical</button><button class="tb" data-v="horizontal">Horizontal</button></div>
          <span class="lab" id="scrollLab">Scroll</span><div class="btns" id="scrollSeg" role="group" aria-label="Scroll"><button class="tb" data-v="vertical" title="Systems below each other">Vertical</button><button class="tb" data-v="horizontal" title="The score as one long line, scrolling sideways">Horizontal</button></div>
          <span class="lab">Paper colour</span><div class="swatches" id="paperColSeg" role="group" aria-label="Paper colour"></div>
          <span class="lab">Dark mode</span><div class="btns" id="darkSeg" role="group" aria-label="Dark mode"><button class="tb" data-v="on">On</button><button class="tb" data-v="off">Off</button></div>
          <label class="ctl" for="glassRange" title="How transparent the menus and buttons are">Window transparency</label><input type="range" id="glassRange" min="0" max="0.95" step="0.01">
        </div></div>
      </div></div>
      <div class="podg"><div class="pop" id="popAdv">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Advanced<span class="betapill">Beta</span><svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="staffset advset">
          <div class="subhead">Selected rest / ligature</div>
          <span class="lab">Rest shape</span><div class="btns" id="restSpSeg" role="group" aria-label="Rest span"><button class="tb" data-v="">Auto</button><button class="tb" data-v="1">1 sp</button><button class="tb" data-v="2">2 sp</button><button class="tb" data-v="3">3 sp</button><select id="restBotSel" title="Bottom staff line of rest (1–5)" aria-label="Rest bottom line"><option value="">Line</option><option value="1">L1</option><option value="2">L2</option><option value="3">L3</option><option value="4">L4</option><option value="5">L5</option></select></div>
          <span class="lab">Ligature kind</span><div class="btns" id="ligKindSeg" role="group" aria-label="Ligature kind"><button class="tb" data-v="">Auto</button><button class="tb" data-v="recta">Recta</button><button class="tb" data-v="obliqua">Obliqua</button><button class="tb" data-v="cop">c.o.p.</button><button class="tb" data-v="sp">s.p.</button></div>
          <div class="subhead">Text, Annotations &amp; Apparatus</div>
          <span class="lab">Original text</span><div class="btns" id="origTxtSeg" role="group" aria-label="Original orthography layer"><button class="tb" data-v="off">Off</button><button class="tb" data-v="on">Show</button><button class="tb" id="editOrigTxtBtn" type="button" title="Add or edit original-orthography text on the selected note">Edit…</button></div>
          <span class="lab">Annotations</span><div class="btns" id="annSeg" role="group" aria-label="Editorial annotations"><button class="tb" data-v="on">Show</button><button class="tb" data-v="off">Hide</button><button class="tb" id="addAnnBtn" type="button" title="Attach or edit an editorial note on the selected note">Add / edit…</button></div>
          <div class="adv-list" id="annList" hidden></div>
          <span class="lab">Variant reading</span><div class="btns" id="varCtl"><select id="varVerSel" aria-label="Active variant reading"></select><button class="tb" id="addVarBtn" type="button" title="Create a variant reading for the selected passage">+ Variant</button></div>
          <div class="adv-list" id="varList" hidden></div>
          <span class="lab">Plainchant</span><div class="btns"><button class="tb" id="addChantBtn" type="button" title="Insert a GABC plainchant section as its own 4-line chant system">+ Chant section (GABC)</button></div>
          <div class="adv-list" id="chantList" hidden></div>
        </div></div>
      </div></div>
      <div class="podg"><div class="pop" id="popAdd">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Add<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="btns col" id="addList">
          <button class="tb" id="addInc" title="The original clefs, mensuration signs and first notes of every voice, before the staves">Incipit</button>
          <button class="tb" id="addMens" title="Put a mensuration sign at the selected note, in the selected voice or voices only (select several voices to give them all one)">Mensuration sign</button>
          <button class="tb" id="addClef" title="A new clef at the selected note, in the selected voice or voices only; click it to choose which. Again to take it off">Clef change</button>
          <button class="tb" id="addKey" title="A new key signature at the selected note, in the selected voice or voices only; hover (tap on a phone) it to change it. Again to take it off">Key signature change</button>
          <button class="tb" id="addFerm" title="A fermata (corona) over the selected note or notes (again to take it off)">Fermata (corona)</button>
          <button class="tb" id="addSignum" title="A signum congruentiae over the selected note (visual alignment mark, no effect on playback)">Signum congruentiae</button>
          <button class="tb" id="addCustos" title="Add or remove an explicit custos at the selected note">Custos</button>
          <button class="tb" id="addLacuna" title="Mark a lacuna (missing passage) at the selected note or range">Lacuna</button>
          <button class="tb" id="addSec" title="A section line through all the staves at the selected note or the caret, apart from the barlines; click it to make it double or take it off">Section line</button>
          <button class="tb" id="addMark" title="A rehearsal mark, [A], [B] and so on, over the selected note (again to take it off)">Rehearsal mark</button>
          <button class="tb" id="addText" title="Text above the staff at the selected note or caret (e.g. Prima pars, Patrem omnipotentem); click existing staff text to edit or clear it">Staff text</button>
        </div></div>
      </div></div>
      <div class="grow">
        <div class="podg"><button class="tb" id="ackBtn" aria-haspopup="dialog">Acknowledgments</button></div>
        <div class="podg"><div class="pop" id="popInfo">
          <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Info<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
          <div class="popbody"><div class="pagemeta infobox"><label class="lab" for="metaTitle">Title</label><input id="metaTitle" type="text" autocomplete="off"><label class="lab" for="metaComp">Composer</label><input id="metaComp" type="text" autocomplete="off"><label class="lab" for="metaEditor">Editor</label><input id="metaEditor" type="text" autocomplete="off" placeholder="Editor name"><label class="lab" for="metaSource">Source</label><input id="metaSource" type="text" autocomplete="off" placeholder="Manuscript / print"><label class="lab" for="metaLicence">Licence</label><input id="metaLicence" type="text" autocomplete="off" placeholder="e.g. CC BY 4.0"><label class="lab" for="metaNotes">Notes</label><textarea id="metaNotes" rows="2" placeholder="Editorial or public notes"></textarea><span class="lab">Origin</span><div id="infoSrc"></div></div></div>
        </div></div>
        <div class="podg" id="libPod"><div class="libwrap"><div class="pop" id="popOpen">
          <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Open<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
          <div class="popbody"><div class="btns col" id="openList">
${APP.catalogue ? LIBBTN + OPENBTN + NEWBTN + '<div class="rhead" id="recentHead" hidden>Recent scores</div><div id="openRecent"></div><button class="tb openfile" id="myBtn"><span class="of-t">' + esc(L.mine) + '</span><span class="of-f">Everything you have kept</span></button>' : APP.newFirst ? NEWBTN + LIBBTN + OPENBTN : LIBBTN + OPENBTN + NEWBTN}
          </div></div>
        </div>
          <div id="library" class="library" role="dialog" aria-label="Pieces" hidden></div>
        </div></div>
        <div class="podg">
          <div class="pop" id="popExport">
            <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Export<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
            <div class="popbody"><div class="btns col" id="exportList">
              <div class="btns duo"><button class="tb" id="saveBtn" title="Save this piece, with your changes, as a .krn file">Download .krn</button><button class="tb" id="cmmeBtn" title="Save this piece as CMME XML (.cmme.xml) with full mensural metadata and pass-through">Download CMME</button></div>
              <div class="btns duo"><button class="tb" id="mxlBtn" title="MusicXML (.mxl), for MuseScore, Dorico, Sibelius, Finale: in modern notation">Download MXL</button><button class="tb" id="mscBtn" title="MuseScore (.mscz), in modern notation, one staff per voice, with the lyrics">Download MuseScore</button></div>
              <div class="btns duo"><button class="tb" id="lyBtn" title="LilyPond (.ly), in modern notation: one staff per voice, with the lyrics">Download LilyPond</button><button class="tb" id="midBtn" title="MIDI (.mid), one track per voice, with the lyrics">Download MIDI</button></div>
              <div class="btns duo"><button class="tb" id="gabcBtn" title="GABC (.gabc), chant for Gregorio: one voice, the one you are editing (else the top one), with its syllables">Download GABC</button><button class="tb" id="keepBtn" title="Keep a copy of this piece, with your changes, in ${esc(L.mine)}"${APP.keep === false ? ' hidden' : ''}>Save to ${esc(L.mine)}</button></div>
              <div class="btns duo"><button class="tb" id="printBtn" title="A PDF of the whole score, at the paper size chosen in View (A3, A4, A5)">Download PDF</button><button class="tb" id="svgBtn" title="The page you see, as an SVG picture">Download SVG</button></div>
              <div class="btns duo"><button class="tb" id="pngBtn" title="The page you see, as a PNG picture">Download PNG</button><button class="tb" id="linkBtn" title="A link that opens this score, with your changes, for anyone">Copy link</button></div>
            </div></div>
          </div>
        </div>
        <div class="podg sendpod">
          <div class="pop" id="popSend">
            <button class="tb popbtn ib sendbtn" aria-haspopup="true" aria-expanded="false" aria-label="Open in another app" title="Open this score in another app"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.5h6.5V10h-2V6.9l-6.8 6.8-1.4-1.4 6.8-6.8H14ZM4.5 6.5h7v2h-5v9h9v-5h2v7h-13Z"/></svg></button>
            <div class="popbody"><div class="btns col" id="sendList"></div></div>
          </div>
        </div>
      </div>
      <input type="file" id="fileIn" accept=".krn,.kern,.txt,.musicxml,.xml,.mxl,.mscz,.mscx,.mei,.mid,.midi,.ly,.gabc,.cmme" hidden>
    </div>
    <div class="bar editbar" id="editBar" hidden></div>
    <div class="bar chantbar" id="chantBar" hidden>
      <div class="chrow">
        <span class="chlab">Plainchant</span>
        <input id="chTitle" type="text" placeholder="Title" title="Plainchant section title" autocomplete="off">
        <select id="chClef" title="Gregorian clef"><option value="c4">c4</option><option value="c3">c3</option><option value="c2">c2</option><option value="c1">c1</option><option value="cb4">cb4 (B♭)</option><option value="cb3">cb3 (B♭)</option><option value="f4">f4</option><option value="f3">f3</option></select>
        <div class="btns" id="chAlign" role="group" aria-label="Plainchant alignment"><button type="button" class="tb" data-v="left">Left</button><button type="button" class="tb" data-v="center">Center</button></div>
        <span class="chsep"></span>
        <button type="button" class="tb" id="chAddNote" title="Add a note after the selected note (or click anywhere on the 4-line staff)">+ Note</button>
        <button type="button" class="tb" data-chbar="," title="Insert divisio minima (,)">,</button>
        <button type="button" class="tb" data-chbar=";" title="Insert divisio minor (;)">;</button>
        <button type="button" class="tb" data-chbar=":" title="Insert divisio maior (:)">:</button>
        <button type="button" class="tb" data-chbar="::" title="Insert divisio finalis (::)">::</button>
        <span class="chsep"></span>
        <button type="button" class="tb" id="chRawTog" title="Show/hide raw GABC text">GABC</button>
        <button type="button" class="tb" id="chDelSec" title="Delete this plainchant section">Delete section</button>
        <button type="button" class="tb" id="chDone" title="Close plainchant editor">Done</button>
      </div>
      <div class="chrow chnote" id="chNoteRow">
        <span class="chlab">Note</span>
        <input id="chSyl" type="text" placeholder="Syllable" title="Syllable text under this neume" autocomplete="off">
        <button type="button" class="tb" id="chUp" title="Pitch up (↑)">↑</button>
        <button type="button" class="tb" id="chDn" title="Pitch down (↓)">↓</button>
        <button type="button" class="tb" id="chDot" title="Punctum mora dot (.)">·</button>
        <button type="button" class="tb" id="chEpiH" title="Horizontal episema (_)">—</button>
        <button type="button" class="tb" id="chEpiV" title="Vertical episema (')">|</button>
        <button type="button" class="tb" id="chFlat" title="Flat (x)">♭</button>
        <button type="button" class="tb" id="chNat" title="Natural (y)">♮</button>
        <button type="button" class="tb" id="chIncl" title="Inclinatum diamond">◆</button>
        <button type="button" class="tb" id="chJoin" title="Join with / split from previous neume">Join/Split</button>
        <button type="button" class="tb" id="chDelNote" title="Delete selected note (Delete / Backspace)">⌫</button>
      </div>
      <div class="chrow" id="chRawRow" hidden>
        <span class="chlab">GABC</span>
        <input id="chRaw" type="text" style="flex:1;min-width:260px" placeholder="(c4) Glo(g)ri(h)a(g)..." autocomplete="off">
      </div>
    </div>
  </section>

  <div class="markbar" id="markBar" hidden><span id="markTxt"></span><button id="markClear">Clear marking</button></div>
  <div class="viewwrap">
    <div class="ackov" id="ackOv" role="dialog" aria-label="Acknowledgments" hidden><div class="ackbox"><button class="ackx" id="ackX" aria-label="Close" title="Close">×</button><div class="ackbody" id="ackBody"></div></div></div>
    <section class="viewer" id="viewer" aria-label="Music"><div id="pages"></div></section>
    <button class="fsbtn" id="fsBtn" aria-label="Full screen" title="Full screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path id="fsIcon" d="M3 3h7v2.4H5.4V10H3Zm11 0h7v7h-2.4V5.4H14ZM3 14h2.4v4.6H10V21H3Zm15.6 0H21v7h-7v-2.4h4.6Z"/></svg></button>
    <div class="fsctl" id="fsCtl"><button id="fsPlay" aria-label="Play" title="Play"><svg viewBox="0 0 14 14" aria-hidden="true"><path id="fsPlayIcon" d="M3 1.5 12.5 7 3 12.5Z"/></svg></button></div>
    <button class="pagenav prev" id="pgPrev" aria-label="Previous page" title="Previous page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.6-1.6L11.2 12 17 6.2Z"/></svg></button>
    <div id="countBox" aria-live="off" hidden></div>
    <ul id="clefPick" class="menu" role="menu" aria-label="Clef" hidden></ul>
    <ul id="notePick" class="menu" role="menu" aria-label="Note" hidden></ul>
    <button class="pagenav next" id="pgNext" aria-label="Next page" title="Next page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4L7 17.8 12.8 12 7 6.2Z"/></svg></button>
    <div class="handbox" id="handBox" title="The tactus: the hand drops on one beat and lifts on the next" aria-hidden="true"><svg viewBox="-20 -36 236 190"><g id="handRot"></g></svg></div><div class="handbox pendbox" id="pendBox" aria-hidden="true"><svg viewBox="-20 -36 236 190"><g id="pendG"><path d="M66 158 H130 L120 142 H76Z" fill="currentColor"/><g id="pendRot"><line x1="98" y1="150" x2="98" y2="-16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="84" y="14" width="28" height="34" rx="4" fill="currentColor"/></g></g></svg></div><div class="handpop" id="handPop" role="group" aria-label="Hand settings" hidden><label for="handSizeP">Size</label><input type="range" id="handSizeP" min="0.4" max="2.5" step="0.05"><label for="handOpP">Opacity</label><input type="range" id="handOpP" min="0.05" max="1" step="0.05"></div>
  </div>

  <section class="transport" aria-label="Playback and sound">
    <div class="tp-main">
    <button id="play" aria-label="Play" title="Play (space bar)"><svg viewBox="0 0 14 14" aria-hidden="true"><path id="playIcon" d="M2 1 13 7 2 13Z"/></svg><span>Play</span></button>
    <div class="podg" id="podSing">
    <div class="pop" id="popSing">
      <button class="ib" id="mic" aria-pressed="false" aria-haspopup="true" aria-label="Microphone" title="Microphone: the note you sing shows as a faint red dot on the selected staff. Hover (on a phone: the arrow) for its options"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14.6a3.4 3.4 0 0 0 3.4-3.4V5.4a3.4 3.4 0 0 0-6.8 0v5.8a3.4 3.4 0 0 0 3.4 3.4Zm6-3.5a6 6 0 0 1-12 0H4.3a7.7 7.7 0 0 0 6.8 7.6V22h1.8v-3.3a7.7 7.7 0 0 0 6.8-7.6Z"/></svg><span class="singchev" aria-hidden="true"><svg class="chev" viewBox="0 0 12 12"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></span></button>
      <div class="popbody">
        <div class="btns col" role="group" aria-label="Microphone options">
        <button class="tb" id="micFlex" data-keep aria-pressed="true" title="On: the dot follows your exact pitch, a little above or below its note when you are sharp or flat. Off: it sits on the nearest note">Flexible pitch</button>
        <button class="tb" id="micDia" data-keep aria-pressed="false" title="What you sing is written with the notes of the scale only (B or B flat as your voice has it), never a chromatic note">Diatonic</button>
        <button class="tb" id="micPhones" data-keep aria-pressed="false" title="On: no filtering, so unisons and octaves with the organ show too. Off: the organ is filtered out of what the microphone hears, for singing along through speakers">Headphones</button>
        <button class="tb" id="micShow" data-keep aria-pressed="true" title="The note you sing shows as a faint red dot on the selected staff">Show pitch on staff</button>
        </div>
        <div class="latrow" title="The time from the organ sounding to your voice reaching the microphone, so what you sing is written in the right place. Empty: worked out by itself">
          <label for="micLat">Latency</label><input type="number" id="micLat" min="0" max="600" step="1" inputmode="numeric" placeholder="auto"><span>ms</span>
          <button class="tb" id="micClap" data-keep title="Eight clicks: clap with each one, and the latency is measured">Clap test</button>
        </div>
      </div>
    </div>
    <div class="pop" id="popRec">
      <button class="ib" id="recGo" aria-pressed="false" aria-haspopup="true" aria-label="Record" title="Record: the music plays and what you sing (or play on the keyboard) is written out as a staff of its own. Press again to stop. Hover (on a phone: the arrow) for its options"><svg viewBox="0 0 24 24" aria-hidden="true"><circle class="recring" cx="12" cy="12" r="8.2"/><circle class="reccore" cx="12" cy="12" r="5"/></svg><span class="singchev" aria-hidden="true"><svg class="chev" viewBox="0 0 12 12"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></span></button>
      <div class="popbody">
        <div class="btns col" role="group" aria-label="Record options">
        <button class="tb" id="micNotate" data-keep aria-pressed="true" title="Record writes out what you sing and what you play on the keyboard, while the music plays, as staves of their own (Sung, Played). Recording again replaces them; Ctrl+Z brings the earlier ones back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 17.3 14.8 6l3.2 3.2L6.7 20.5 3 21Zm13.7-12.6 1.4-1.4a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1l-1.4 1.4Z"/></svg>Notate</button>
        <button class="tb" id="recAudio" data-keep aria-pressed="false" title="Record keeps your voice as a sound recording (with the organ too when Headphones is on), in this browser. The recordings are listed below"><span class="recdot"></span>Record audio</button>
        </div>
        <div class="recbox">
          <div id="recList" class="reclist"></div>
        </div>
      </div>
    </div>
    </div>
    <div class="tp-stack">
    <div class="podg" id="podModes">
    <button id="loop" aria-pressed="false" title="Repeat until stopped; adds a repeat sign at the end">Loop</button>
    <div class="pop" id="popMetro">
      <button class="tb popbtn" id="metro" aria-haspopup="true" title="How the beat is shown or heard">Metronome<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
      <div class="popbody"><div class="btns col" id="beatList" role="group" aria-label="Beat">
        <button class="tb" data-beat="hand" data-keep aria-pressed="true">Hand (tactus)</button>
        <button class="tb" data-beat="pendulum" data-keep aria-pressed="false">Pendulum metronome</button>
        <button class="tb" data-beat="tick" data-keep aria-pressed="false">Audible tick</button>
      </div></div>
    </div>
    </div>
    <div class="podg" id="podCount"><label class="ctl cntin" title="Beats counted in, with clicks, before the music starts. Empty or 0: none"><span class="cntlbl">Count-in</span><input type="number" id="countIn" min="0" max="32" step="1" inputmode="numeric" placeholder="0" aria-label="Beats to count in"></label></div>
    <div class="tempo-row podg" role="group" aria-label="Tempo">
      <div class="unitpick">
        <button id="unitBtn" class="unitbtn" aria-haspopup="listbox" aria-expanded="false"></button>
        <ul id="unitList" class="menu" role="listbox" aria-label="Note value that gets the beat" tabindex="-1" hidden></ul>
      </div>
      <span class="eq" aria-hidden="true">=</span>
      <div class="stepper">
        <button id="tempoDown" aria-label="Slower" title="Slower">−</button>
        <input type="number" id="tempo" min="10" max="300" step="1" inputmode="numeric" aria-label="Beats per minute">
        <button id="tempoUp" aria-label="Faster" title="Faster">+</button>
      </div>
      <button id="tap" title="Tap the beat twice or more: the tempo follows your taps">Tap</button>
      <button id="heart" class="ib" aria-label="Semibrevis at the pulse: 60 per minute" title="Semibrevis = 60 per minute, a resting pulse (Gaffurius takes the semibrevis as one heartbeat)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2s-7.6-4.7-9.7-9.4C.8 8.4 2.9 4.8 6.5 4.8c2.2 0 3.7 1.3 5.5 3.3 1.8-2 3.3-3.3 5.5-3.3 3.6 0 5.7 3.6 4.2 7-2.1 4.7-9.7 9.4-9.7 9.4Z"/></svg></button>
    </div>
    </div>
    </div>
    <div class="tp-tools">
      <div class="podg" id="podSound">
        <div class="pop" id="popVol"><button type="button" class="ib" id="volBtn" aria-haspopup="true" aria-expanded="false" aria-label="Volume" title="Volume: hover (on a touch screen, tap) for the slider"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.2h3.9L12.6 5v14l-5.2-4.2H3.5Zm11.6-1.1a5.5 5.5 0 0 1 0 7.8l-1.2-1.2a3.8 3.8 0 0 0 0-5.4Zm2.7-2.7a9.3 9.3 0 0 1 0 13.2l-1.2-1.2a7.6 7.6 0 0 0 0-10.8Z"/></svg></button>
          <div class="popbody"><div class="volbox"><input type="range" id="vol" min="0" max="100" step="1" aria-label="Volume"></div></div></div>
        <label class="ctl hzctl" title="The pitch of a′ in Hz">a′<span class="eqs"> =</span><input type="number" id="ref" min="100" max="1000" step="any" inputmode="decimal" aria-label="Pitch of a′ in Hz">Hz</label>
        <button id="toggleSet" aria-expanded="false" aria-controls="tpSide" title="Show or hide all the sound settings">Sound<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
      </div>
    </div>
  </section>

  <section class="tp-side" id="tpSide" aria-label="Sound settings" hidden>
    <div class="mixcol" id="mixCol">
      <div class="tg">Mixer</div>
      <div class="mxr gen"><label class="mxn" for="reg" title="The sound of every voice that is set to General">General</label><span class="mxg"></span><select id="reg"><option value="gedackt">Gedackt 8′ (stopped flute)</option><option value="principal">Principal 8′</option><option value="plenum">Principal chorus (8′ 4′ 2′)</option><option value="flute">Open flute 8′</option><option value="regal">Regal (soft reed)</option><option value="sine">Sine</option><option value="custom">Your own (drawbars)</option></select><span class="mxg"></span></div>
      <div class="mixlist" id="mixList"></div>
    </div>
    <div class="tcol" id="soundCol">
      <label class="check"><input type="checkbox" id="audition"> Hear notes while editing</label>
    </div>
    <div class="tcol" id="toneCol">
      <div class="tg">Tone</div>
      <label for="bright">Brightness</label><input type="range" id="bright" min="0" max="100" step="1"><output id="bo"></output>
      <label for="room">Room</label><input type="range" id="room" min="0" max="100" step="1"><output id="ro"></output>
      <div class="tune" id="tune"></div>
    </div>
  </section>

  <div id="toast" role="status" aria-live="polite"></div>
</main>`);
  if (!document.getElementById('pagerule')) document.head.insertAdjacentHTML('beforeend', '<style id="pagerule">@page{size:A4 portrait;margin:0}</style>');
  document.title = APP.name;
}
let EMBED = false;
try { EMBED = window.self !== window.top; } catch (e) { EMBED = true; }
if (EMBED) document.documentElement.classList.add('embedded');

/* Pieces shipped with the app: APP.pieces, files in games/choirbook/ (ChoirBook ships none now: everything comes from the library).
   APP.first: the piece shown on a first visit. APP.moved: old piece keys (saved state, favourites, old links) and the key that replaces each. */
const PIECES = APP.pieces || [];
const FIRST = APP.first || PIECES[0] || null;
const MOVED = APP.moved || {};

/* Glyph outlines in staff-space units, y pointing down. b = [left, top, right, bottom]. */
const GLY = {"Mx":{"d":"M2.456 -0.684H2.42C2.396 -0.684 2.38 -0.664 2.38 -0.64V-0.54H0.12V-0.64C0.12 -0.664 0.1 -0.684 0.076 -0.684H0.04C0.02 -0.684 0 -0.664 0 -0.64V0.644C0 0.668 0.02 0.688 0.04 0.688H0.076C0.1 0.688 0.12 0.668 0.12 0.644V0.544H2.38V3.504C2.38 3.528 2.396 3.548 2.42 3.548H2.456C2.48 3.548 2.5 3.528 2.5 3.504V-0.64C2.5 -0.664 2.48 -0.684 2.456 -0.684ZM2.38 -0.292V0.3H0.12V-0.292Z","b":[0.0,-0.684,2.5,3.548]},"L":{"d":"M1.256 -0.684H1.22C1.196 -0.684 1.18 -0.664 1.18 -0.64V-0.54H0.12V-0.64C0.12 -0.664 0.1 -0.684 0.076 -0.684H0.04C0.02 -0.684 0 -0.664 0 -0.64V0.644C0 0.668 0.02 0.688 0.04 0.688H0.076C0.1 0.688 0.12 0.668 0.12 0.644V0.544H1.18V3.504C1.18 3.528 1.196 3.548 1.22 3.548H1.256C1.28 3.548 1.3 3.528 1.3 3.504V-0.64C1.3 -0.664 1.28 -0.684 1.256 -0.684ZM1.18 -0.292V0.3H0.12V-0.292Z","b":[0.0,-0.684,1.3,3.548]},"B":{"d":"M1.26 -0.688H1.224C1.2 -0.688 1.18 -0.668 1.18 -0.644V-0.544H0.12V-0.644C0.12 -0.668 0.104 -0.688 0.08 -0.688H0.044C0.02 -0.688 0 -0.668 0 -0.644V0.64C0 0.664 0.02 0.684 0.044 0.684H0.08C0.104 0.684 0.12 0.664 0.12 0.64V0.54H1.18V0.64C1.18 0.664 1.2 0.684 1.224 0.684H1.26C1.28 0.684 1.3 0.664 1.3 0.64V-0.644C1.3 -0.668 1.28 -0.688 1.26 -0.688ZM1.18 -0.296V0.296H0.12V-0.296Z","b":[0.0,-0.688,1.3,0.684]},"S":{"d":"M0.68 -0.724C0.672 -0.736 0.66 -0.74 0.648 -0.74C0.632 -0.736 0.624 -0.732 0.616 -0.724L0.008 -0.028C0.004 -0.016 0 -0.008 0 0C0 0.016 0.004 0.02 0.008 0.028L0.616 0.724C0.624 0.732 0.636 0.736 0.648 0.736C0.66 0.736 0.672 0.732 0.68 0.724L1.272 0.028C1.276 0.02 1.28 0.012 1.28 0C1.28 -0.008 1.276 -0.02 1.272 -0.028ZM0.74 0.468 0.24 -0.108 0.56 -0.472 1.04 0.108Z","b":[0.0,-0.74,1.28,0.736]},"M":{"d":"M1.272 -0.028 0.712 -0.712V-3.504C0.712 -3.524 0.692 -3.544 0.668 -3.544H0.632C0.608 -3.544 0.592 -3.524 0.592 -3.504V-0.712L0.008 -0.028C0 -0.02 0 -0.008 0 0C0 0.012 0 0.02 0.008 0.028L0.616 0.724C0.624 0.732 0.636 0.736 0.648 0.736C0.66 0.736 0.672 0.732 0.68 0.724L1.272 0.028C1.276 0.02 1.28 0.012 1.28 0C1.28 -0.008 1.276 -0.02 1.272 -0.028ZM0.74 0.468 0.24 -0.108 0.56 -0.472 1.04 0.108Z","b":[0.0,-3.544,1.28,0.736]},"Sm":{"d":"M1.272 -0.028 0.712 -0.712V-3.504C0.712 -3.524 0.692 -3.544 0.668 -3.544H0.632C0.608 -3.544 0.588 -3.524 0.588 -3.504V-0.712L0.008 -0.028C0 -0.02 0 -0.008 0 0C0 0.012 0 0.02 0.008 0.028L0.616 0.724C0.624 0.732 0.636 0.736 0.648 0.736C0.66 0.736 0.672 0.732 0.68 0.724L1.272 0.028C1.276 0.02 1.28 0.012 1.28 0C1.28 -0.008 1.276 -0.02 1.272 -0.028Z","b":[0.0,-3.544,1.28,0.736]},"F":{"d":"M1.384 -2.16 0.712 -3.508C0.696 -3.512 0.692 -3.54 0.668 -3.54C0.664 -3.54 0.656 -3.544 0.652 -3.544C0.648 -3.544 0.644 -3.54 0.64 -3.54C0.608 -3.54 0.588 -3.52 0.588 -3.496V-0.708L0.008 -0.024C0 -0.016 0 -0.004 0 0.004C0 0.016 0 0.024 0.008 0.032L0.616 0.728C0.624 0.736 0.636 0.744 0.648 0.744C0.66 0.744 0.672 0.736 0.68 0.728L1.272 0.032C1.276 0.024 1.28 0.016 1.28 0.004C1.28 -0.004 1.276 -0.016 1.272 -0.024L0.708 -0.708V-3.22L1.268 -2.1C1.28 -2.08 1.304 -2.064 1.328 -2.064C1.336 -2.064 1.344 -2.068 1.356 -2.072C1.38 -2.084 1.392 -2.108 1.392 -2.132C1.392 -2.144 1.388 -2.152 1.384 -2.16Z","b":[0.0,-3.544,1.392,0.744]},"rL":{"d":"M0.192 -0.936C0.192 -0.972 0.164 -1 0.128 -1H0.064C0.028 -1 0 -0.972 0 -0.936V0.936C0 0.972 0.028 1 0.064 1H0.128C0.164 1 0.192 0.972 0.192 0.936Z","b":[0.0,-1.0,0.192,1.0]},"rB":{"d":"M0.192 -0.936C0.192 -0.972 0.164 -1 0.128 -1H0.064C0.028 -1 0 -0.972 0 -0.936V-0.064C0 -0.028 0.028 0 0.064 0H0.128C0.164 0 0.192 -0.028 0.192 -0.064Z","b":[0.0,-1.0,0.192,0.0]},"rS":{"d":"M0.192 -0.936C0.192 -0.972 0.164 -1 0.128 -1H0.064C0.028 -1 0 -0.972 0 -0.936V-0.564C0 -0.528 0.028 -0.5 0.064 -0.5H0.128C0.164 -0.5 0.192 -0.528 0.192 -0.564Z","b":[0.0,-1.0,0.192,-0.5]},"rM":{"d":"M0.192 -0.436C0.192 -0.472 0.164 -0.5 0.128 -0.5H0.064C0.028 -0.5 0 -0.472 0 -0.436V-0.064C0 -0.028 0.028 0 0.064 0H0.128C0.164 0 0.192 -0.028 0.192 -0.064Z","b":[0.0,-0.5,0.192,0.0]},"rSm":{"d":"M0.512 -0.54 0.156 -0.656C0.152 -0.66 0.144 -0.66 0.14 -0.66H0.064C0.028 -0.66 0 -0.632 0 -0.596V-0.064C0 -0.028 0.028 0 0.064 0H0.128C0.164 0 0.192 -0.028 0.192 -0.064V-0.444L0.448 -0.356C0.456 -0.352 0.46 -0.352 0.468 -0.352C0.496 -0.352 0.524 -0.372 0.532 -0.396L0.552 -0.46C0.552 -0.464 0.556 -0.472 0.556 -0.476C0.556 -0.504 0.54 -0.532 0.512 -0.54Z","b":[0.0,-0.66,0.556,0.0]},"rF":{"d":"M0.044 -0.54C0.016 -0.532 0 -0.504 0 -0.476C0 -0.472 0.004 -0.464 0.004 -0.46L0.024 -0.396C0.032 -0.372 0.06 -0.352 0.088 -0.352C0.096 -0.352 0.1 -0.352 0.108 -0.356L0.364 -0.444V-0.064C0.364 -0.028 0.392 0 0.428 0H0.492C0.528 0 0.556 -0.028 0.556 -0.064V-0.596C0.556 -0.632 0.528 -0.66 0.492 -0.66H0.416C0.412 -0.66 0.404 -0.66 0.4 -0.656Z","b":[0.0,-0.66,0.556,0.0]},"gP":{"d":"M0.916 -0.356C0.988 -0.352 1.052 -0.332 1.1 -0.304C1.104 -0.304 1.108 -0.3 1.112 -0.3C1.12 -0.3 1.132 -0.304 1.14 -0.308C1.204 -0.348 1.292 -0.496 1.292 -0.524C1.292 -0.544 1.288 -0.548 1.284 -0.552C1.212 -0.604 1.132 -0.632 1.044 -0.632C1.028 -0.632 1.012 -0.628 0.996 -0.628L1.016 -0.668C1.092 -0.832 1.188 -1.036 1.188 -1.236C1.188 -1.256 1.188 -1.28 1.184 -1.3C1.164 -1.512 1.004 -1.828 0.864 -2.076C0.96 -2.232 1.02 -2.404 1.08 -2.584C1.116 -2.704 1.208 -3.024 1.208 -3.288C1.208 -3.508 1.148 -3.688 0.944 -3.688C0.924 -3.688 0.904 -3.688 0.884 -3.684C0.512 -3.628 0.4 -3.24 0.372 -3.092C0.36 -3.036 0.356 -2.976 0.356 -2.92C0.356 -2.652 0.464 -2.396 0.588 -2.164L0.704 -1.968C0.5 -1.72 0.228 -1.52 0.076 -1.228C0.032 -1.136 0 -1.036 0 -0.936V-0.916C0.008 -0.564 0.244 -0.496 0.244 -0.496C0.244 -0.496 0.256 -0.484 0.272 -0.484C0.284 -0.484 0.3 -0.492 0.316 -0.508C0.36 -0.552 0.376 -0.6 0.384 -0.612C0.388 -0.62 0.396 -0.636 0.396 -0.64C0.396 -0.648 0.388 -0.66 0.372 -0.672C0.308 -0.672 0.124 -0.828 0.124 -1.04C0.124 -1.056 0.124 -1.072 0.128 -1.088C0.18 -1.448 0.52 -1.652 0.74 -1.908C0.848 -1.732 0.96 -1.548 1.012 -1.356C1.036 -1.272 1.048 -1.192 1.048 -1.104C1.048 -0.972 1.02 -0.84 0.956 -0.696L0.92 -0.612C0.796 -0.572 0.668 -0.48 0.544 -0.32C0.44 -0.188 0.4 -0.056 0.4 0.08C0.4 0.188 0.428 0.3 0.468 0.408C0.524 0.556 0.716 0.676 0.88 0.676H0.904C1.108 0.66 1.356 0.432 1.356 0.084C1.356 0.024 1.348 -0.04 1.332 -0.104C1.332 -0.104 1.204 -0.116 1.108 -0.116C1.06 -0.116 1.016 -0.112 1.004 -0.104C0.996 -0.104 0.988 -0.092 0.976 -0.08C0.944 -0.16 0.916 -0.244 0.916 -0.336ZM0.824 -2.144C0.756 -2.268 0.692 -2.364 0.664 -2.412C0.604 -2.508 0.492 -2.848 0.492 -3.128C0.492 -3.264 0.52 -3.388 0.592 -3.46C0.632 -3.5 0.7 -3.52 0.768 -3.52C0.852 -3.52 0.94 -3.488 0.992 -3.42C1.06 -3.328 1.084 -3.212 1.084 -3.096C1.084 -3.012 1.072 -2.928 1.06 -2.848C1.024 -2.636 0.964 -2.424 0.872 -2.228ZM0.596 -0.26C0.66 -0.324 0.752 -0.356 0.84 -0.36C0.816 -0.264 0.804 -0.168 0.804 -0.084C0.804 0.012 0.824 0.092 0.876 0.14C0.884 0.144 0.904 0.144 0.924 0.144C0.964 0.144 1.024 0.14 1.068 0.14C1.108 0.14 1.14 0.144 1.144 0.156C1.156 0.184 1.164 0.252 1.164 0.312C1.164 0.364 1.16 0.408 1.144 0.408C1.124 0.412 1.088 0.416 1.048 0.416C0.88 0.416 0.596 0.34 0.596 -0.184Z","b":[0.0,-3.688,1.356,0.676]},"fP":{"d":"M1.94 -0.484C1.948 -0.5 1.952 -0.512 1.952 -0.528C1.952 -0.552 1.944 -0.576 1.928 -0.608C1.904 -0.656 1.704 -1.008 1.668 -1.06L1.644 -1.092V-2.324C1.644 -2.344 1.624 -2.364 1.604 -2.364H1.552C1.528 -2.364 1.512 -2.344 1.512 -2.324V-1.136C1.48 -1.12 1.448 -1.084 1.416 -1.02L1.096 -0.46C1.092 -0.436 1.072 -0.42 1.072 -0.396C1.072 -0.38 1.08 -0.36 1.096 -0.332C1.132 -0.272 1.284 0.008 1.308 0.044C1.32 0.06 1.324 0.072 1.324 0.08C1.324 0.088 1.32 0.096 1.308 0.112C1.308 0.112 1.308 0.116 1.088 0.504C1.08 0.524 1.072 0.544 1.072 0.568C1.072 0.588 1.076 0.608 1.088 0.624C1.12 0.664 1.336 1.04 1.368 1.088L1.388 1.12V4.236C1.388 4.26 1.404 4.276 1.428 4.276H1.48C1.5 4.276 1.52 4.26 1.52 4.236V1.14C1.548 1.12 1.58 1.088 1.616 1.032C1.756 0.812 1.936 0.468 1.936 0.468C1.936 0.468 1.944 0.452 1.944 0.42C1.944 0.396 1.94 0.36 1.916 0.324C1.864 0.24 1.72 -0.02 1.72 -0.02C1.712 -0.036 1.704 -0.048 1.704 -0.064C1.704 -0.076 1.708 -0.088 1.716 -0.104ZM1.312 -0.54 1.468 -0.804 1.716 -0.388 1.556 -0.116ZM0.864 -0.72C0.84 -0.72 0.82 -0.716 0.816 -0.664C0.808 -0.588 0.792 -0.508 0.696 -0.508H0.228C0.192 -0.508 0.144 -0.536 0.132 -0.64V-0.68C0.132 -0.704 0.108 -0.72 0.084 -0.72H0.048C0.02 -0.72 0 -0.704 0 -0.68V0.704C0 0.724 0.02 0.744 0.048 0.744H0.084C0.108 0.744 0.132 0.724 0.132 0.704V0.632C0.152 0.54 0.196 0.54 0.224 0.54H0.708C0.748 0.54 0.788 0.552 0.816 0.632V3.776C0.816 3.848 0.836 3.848 0.864 3.848H0.896C0.924 3.848 0.944 3.848 0.944 3.776V-0.644C0.944 -0.712 0.924 -0.72 0.896 -0.72ZM0.228 0.212C0.192 0.212 0.144 0.184 0.132 0.08V-0.088C0.152 -0.18 0.196 -0.18 0.224 -0.18H0.708C0.748 -0.18 0.788 -0.168 0.816 -0.088V0.064C0.808 0.136 0.792 0.212 0.696 0.212ZM1.556 0.824 1.312 0.4 1.468 0.136 1.716 0.552Z","b":[0.0,-2.364,1.952,4.276]},"c1":{"d":"M0.928 1.256C0.952 1.256 0.976 1.256 0.976 1.188V-2.16C0.976 -2.228 0.952 -2.228 0.928 -2.228H0.892C0.864 -2.228 0.84 -2.228 0.84 -2.16V-1.252C0.832 -1.18 0.82 -1.104 0.72 -1.104H0.236C0.196 -1.104 0.148 -1.132 0.136 -1.236V-3.132C0.136 -3.2 0.112 -3.2 0.084 -3.2H0.052C0.024 -3.2 0 -3.2 0 -3.132V1.328C0 1.396 0.024 1.396 0.052 1.396H0.084C0.112 1.396 0.136 1.396 0.136 1.328V1.228C0.144 1.156 0.16 1.076 0.256 1.076H0.72C0.82 1.076 0.832 1.116 0.84 1.188C0.84 1.256 0.864 1.256 0.892 1.256ZM0.732 -0.696C0.772 -0.696 0.816 -0.684 0.84 -0.604V-0.452C0.84 -0.436 0.836 -0.42 0.832 -0.404C0.816 -0.332 0.772 -0.312 0.74 -0.312H0.256C0.16 -0.312 0.144 -0.388 0.136 -0.46V-0.604C0.16 -0.696 0.204 -0.696 0.232 -0.696ZM0.256 0.676C0.16 0.676 0.144 0.6 0.136 0.528V0.44C0.14 0.376 0.156 0.308 0.224 0.292H0.732C0.744 0.292 0.752 0.292 0.764 0.296C0.824 0.316 0.836 0.38 0.84 0.44V0.544C0.828 0.648 0.78 0.676 0.74 0.676Z","b":[0.0,-3.2,0.976,1.396]},"c2":{"d":"M0.892 2.188H0.928C0.952 2.188 0.976 2.188 0.976 2.12V-2.176C0.976 -2.244 0.952 -2.244 0.928 -2.244H0.892C0.864 -2.244 0.84 -2.244 0.84 -2.176V-1.228C0.832 -1.156 0.82 -1.076 0.72 -1.076H0.256C0.16 -1.076 0.144 -1.156 0.136 -1.228V-3.132C0.136 -3.2 0.112 -3.2 0.084 -3.2H0.052C0.024 -3.2 0 -3.2 0 -3.132V2.332C0 2.4 0.024 2.4 0.052 2.4H0.084C0.112 2.4 0.136 2.4 0.136 2.332V1.196C0.148 1.092 0.196 1.064 0.236 1.064H0.72C0.82 1.064 0.832 1.14 0.84 1.212V2.12C0.84 2.188 0.864 2.188 0.892 2.188ZM0.84 -0.544V-0.44C0.836 -0.38 0.824 -0.316 0.764 -0.296C0.752 -0.292 0.744 -0.292 0.732 -0.292H0.224C0.156 -0.308 0.14 -0.376 0.136 -0.44V-0.528C0.144 -0.6 0.16 -0.676 0.256 -0.676H0.74C0.78 -0.676 0.828 -0.648 0.84 -0.544ZM0.84 0.452V0.604C0.816 0.684 0.772 0.696 0.732 0.696H0.232C0.204 0.696 0.16 0.696 0.136 0.604V0.46C0.144 0.388 0.16 0.312 0.256 0.312H0.74C0.772 0.312 0.816 0.332 0.832 0.404C0.836 0.42 0.84 0.436 0.84 0.452Z","b":[0.0,-3.2,0.976,2.4]},"c3":{"d":"M0.892 -2.228C0.864 -2.228 0.84 -2.228 0.84 -2.16V-1.252C0.832 -1.18 0.82 -1.104 0.72 -1.104H0.236C0.196 -1.104 0.148 -1.132 0.136 -1.236V-3.132C0.136 -3.2 0.112 -3.2 0.084 -3.2H0.052C0.024 -3.2 0 -3.2 0 -3.132V3.132C0 3.2 0.024 3.2 0.052 3.2H0.084C0.112 3.2 0.136 3.2 0.136 3.132V1.228C0.144 1.156 0.16 1.076 0.256 1.076H0.72C0.82 1.076 0.832 1.156 0.84 1.228V2.176C0.84 2.244 0.864 2.244 0.892 2.244H0.928C0.952 2.244 0.976 2.244 0.976 2.176V-2.16C0.976 -2.228 0.952 -2.228 0.928 -2.228ZM0.84 -0.452C0.84 -0.436 0.836 -0.42 0.832 -0.404C0.816 -0.332 0.772 -0.312 0.74 -0.312H0.256C0.16 -0.312 0.144 -0.388 0.136 -0.46V-0.604C0.16 -0.696 0.204 -0.696 0.232 -0.696H0.732C0.772 -0.696 0.816 -0.684 0.84 -0.604ZM0.84 0.544C0.828 0.648 0.78 0.676 0.74 0.676H0.256C0.16 0.676 0.144 0.6 0.136 0.528V0.44C0.14 0.376 0.156 0.308 0.224 0.292H0.732C0.744 0.292 0.752 0.292 0.764 0.296C0.824 0.316 0.836 0.38 0.84 0.44Z","b":[0.0,-3.2,0.976,3.2]},"c4":{"d":"M0.892 -2.188C0.864 -2.188 0.84 -2.188 0.84 -2.12V-1.212C0.832 -1.14 0.82 -1.064 0.72 -1.064H0.236C0.196 -1.064 0.148 -1.092 0.136 -1.196V-2.332C0.136 -2.4 0.112 -2.4 0.084 -2.4H0.052C0.024 -2.4 0 -2.4 0 -2.332V3.132C0 3.2 0.024 3.2 0.052 3.2H0.084C0.112 3.2 0.136 3.2 0.136 3.132V1.228C0.144 1.156 0.16 1.076 0.256 1.076H0.72C0.82 1.076 0.832 1.156 0.84 1.228V2.176C0.84 2.244 0.864 2.244 0.892 2.244H0.928C0.952 2.244 0.976 2.244 0.976 2.176V-2.12C0.976 -2.188 0.952 -2.188 0.928 -2.188ZM0.84 -0.452C0.84 -0.436 0.836 -0.42 0.832 -0.404C0.816 -0.332 0.772 -0.312 0.74 -0.312H0.256C0.16 -0.312 0.144 -0.388 0.136 -0.46V-0.604C0.16 -0.696 0.204 -0.696 0.232 -0.696H0.732C0.772 -0.696 0.816 -0.684 0.84 -0.604ZM0.84 0.544C0.828 0.648 0.78 0.676 0.74 0.676H0.256C0.16 0.676 0.144 0.6 0.136 0.528V0.44C0.14 0.376 0.156 0.308 0.224 0.292H0.732C0.744 0.292 0.752 0.292 0.764 0.296C0.824 0.316 0.836 0.38 0.84 0.44Z","b":[0.0,-2.4,0.976,3.2]},"c5":{"d":"M0.928 -1.276H0.892C0.864 -1.276 0.84 -1.276 0.84 -1.208C0.832 -1.136 0.82 -1.096 0.72 -1.096H0.256C0.16 -1.096 0.144 -1.176 0.136 -1.248V-1.348C0.136 -1.416 0.112 -1.416 0.084 -1.416H0.052C0.024 -1.416 0 -1.416 0 -1.348V3.112C0 3.18 0.024 3.18 0.052 3.18H0.084C0.112 3.18 0.136 3.18 0.136 3.112V1.216C0.148 1.112 0.196 1.084 0.236 1.084H0.72C0.82 1.084 0.832 1.16 0.84 1.232V2.14C0.84 2.208 0.864 2.208 0.892 2.208H0.928C0.952 2.208 0.976 2.208 0.976 2.14V-1.208C0.976 -1.276 0.952 -1.276 0.928 -1.276ZM0.256 -0.696H0.74C0.78 -0.696 0.828 -0.668 0.84 -0.564V-0.46C0.836 -0.4 0.824 -0.336 0.764 -0.316C0.752 -0.312 0.744 -0.312 0.732 -0.312H0.224C0.156 -0.328 0.14 -0.396 0.136 -0.46V-0.548C0.144 -0.62 0.16 -0.696 0.256 -0.696ZM0.732 0.676H0.232C0.204 0.676 0.16 0.676 0.136 0.584V0.44C0.144 0.368 0.16 0.292 0.256 0.292H0.74C0.772 0.292 0.816 0.312 0.832 0.384C0.836 0.4 0.84 0.416 0.84 0.432V0.584C0.816 0.664 0.772 0.676 0.732 0.676Z","b":[0.0,-1.416,0.976,3.18]},"n8":{"d":"M0.452 -0.988C0.404 -0.988 0.356 -0.984 0.316 -0.964C0.212 -0.924 0.156 -0.836 0.156 -0.74C0.156 -0.684 0.176 -0.628 0.22 -0.576C0.224 -0.576 0.228 -0.572 0.228 -0.564C0.228 -0.552 0.22 -0.548 0.204 -0.544C0.1 -0.508 0 -0.392 0 -0.28C0 -0.272 0.004 -0.252 0.008 -0.232C0.04 -0.084 0.232 0 0.368 0C0.424 0 0.488 -0.008 0.532 -0.024C0.644 -0.072 0.716 -0.176 0.716 -0.284C0.716 -0.332 0.704 -0.376 0.68 -0.42C0.664 -0.44 0.664 -0.46 0.664 -0.484C0.664 -0.508 0.672 -0.528 0.696 -0.548C0.732 -0.576 0.82 -0.608 0.82 -0.748C0.82 -0.948 0.532 -0.988 0.468 -0.988ZM0.356 -0.82C0.364 -0.888 0.42 -0.916 0.48 -0.92C0.548 -0.92 0.608 -0.9 0.64 -0.864C0.664 -0.84 0.676 -0.796 0.676 -0.76C0.672 -0.688 0.652 -0.568 0.584 -0.568C0.572 -0.568 0.552 -0.576 0.532 -0.584C0.492 -0.612 0.46 -0.652 0.428 -0.684C0.396 -0.72 0.356 -0.764 0.356 -0.82ZM0.22 -0.436C0.232 -0.452 0.252 -0.464 0.276 -0.464C0.284 -0.464 0.316 -0.448 0.332 -0.44C0.356 -0.424 0.376 -0.404 0.4 -0.384C0.444 -0.344 0.48 -0.3 0.5 -0.248C0.508 -0.228 0.516 -0.212 0.516 -0.192C0.516 -0.128 0.448 -0.048 0.368 -0.048C0.292 -0.048 0.184 -0.128 0.156 -0.256C0.152 -0.268 0.152 -0.276 0.152 -0.284C0.152 -0.328 0.168 -0.372 0.192 -0.404C0.196 -0.416 0.208 -0.428 0.22 -0.436Z","b":[0.0,-0.988,0.82,0.0]},"fl":{"d":"M0.82 0.58V-0.22C0.82 -0.352 0.752 -0.416 0.624 -0.504C0.492 -0.584 0.348 -0.604 0.292 -0.608C0.24 -0.608 0.236 -0.584 0.236 -0.572V-0.404C0.236 -0.3 0.272 -0.296 0.272 -0.296L0.44 -0.2C0.568 -0.132 0.744 -0.004 0.744 0.144C0.744 0.276 0.656 0.284 0.632 0.284C0.448 0.284 0.264 0.156 0.152 0.024C0.116 -0.012 0.108 -0.036 0.108 -0.048C0.108 -0.048 0.12 -1.416 0.12 -1.496C0.12 -1.58 0.12 -1.648 0.072 -1.652C0.008 -1.652 0 -1.56 0 -1.508V0.216C0.028 0.308 0.072 0.34 0.072 0.34C0.324 0.584 0.7 0.604 0.764 0.604C0.812 0.604 0.82 0.584 0.82 0.58Z","b":[0.0,-1.652,0.82,0.604]},"na":{"d":"M0 0.432C0.008 0.456 0.016 0.464 0.04 0.472L0.328 0.424V0.604C0.328 0.864 0.328 0.992 0.324 1C0.356 1.012 0.376 1.016 0.38 1.016C0.396 1.016 0.408 1.008 0.408 0.992V-0.428C0.404 -0.44 0.396 -0.456 0.38 -0.456C0.332 -0.456 0.276 -0.448 0.092 -0.412V-1.004C0.072 -1.008 0.056 -1.012 0.04 -1.012C0.032 -1.012 0.016 -1.008 0 -1.004ZM0.336 0.208 0.084 0.248C0.084 -0.048 0.084 -0.196 0.088 -0.196L0.336 -0.236Z","b":[0.0,-1.012,0.408,1.016]},"sh":{"d":"M0.948 -0.472C0.976 -0.484 0.996 -0.516 0.996 -0.54V-0.824C0.996 -0.844 0.984 -0.856 0.968 -0.856C0.96 -0.856 0.956 -0.856 0.948 -0.852C0.948 -0.852 0.868 -0.82 0.848 -0.816C0.82 -0.816 0.792 -0.836 0.792 -0.868V-1.356C0.792 -1.38 0.768 -1.4 0.736 -1.4C0.696 -1.4 0.672 -1.38 0.672 -1.356V-0.836C0.668 -0.796 0.656 -0.744 0.62 -0.72C0.572 -0.692 0.436 -0.636 0.368 -0.62C0.332 -0.62 0.32 -0.668 0.32 -0.7V-1.18C0.32 -1.204 0.292 -1.224 0.264 -1.224C0.224 -1.224 0.2 -1.204 0.2 -1.18V-0.64C0.2 -0.584 0.176 -0.544 0.152 -0.532C0.128 -0.52 0.048 -0.488 0.048 -0.488C0.02 -0.48 0 -0.448 0 -0.424V-0.14C0 -0.116 0.012 -0.104 0.032 -0.104C0.036 -0.104 0.044 -0.108 0.048 -0.108C0.048 -0.108 0.108 -0.132 0.136 -0.148C0.14 -0.148 0.144 -0.152 0.148 -0.152C0.176 -0.152 0.2 -0.112 0.2 -0.08V0.316C0.2 0.36 0.18 0.396 0.156 0.408C0.132 0.416 0.048 0.452 0.048 0.452C0.02 0.46 0 0.492 0 0.516V0.8C0 0.824 0.012 0.836 0.032 0.836C0.036 0.836 0.044 0.832 0.048 0.832C0.048 0.832 0.104 0.808 0.14 0.796C0.144 0.792 0.148 0.792 0.152 0.792C0.18 0.792 0.2 0.836 0.2 0.856V1.348C0.2 1.372 0.224 1.392 0.252 1.392C0.292 1.392 0.32 1.372 0.32 1.348V0.792C0.32 0.74 0.34 0.712 0.36 0.704L0.604 0.604C0.608 0.604 0.616 0.6 0.62 0.6C0.652 0.6 0.672 0.648 0.672 0.672V1.172C0.672 1.196 0.696 1.216 0.724 1.216C0.768 1.216 0.792 1.196 0.792 1.172V0.604C0.792 0.572 0.808 0.524 0.836 0.512C0.864 0.5 0.948 0.468 0.948 0.468C0.976 0.456 0.996 0.424 0.996 0.4V0.116C0.996 0.096 0.984 0.084 0.968 0.084C0.96 0.084 0.956 0.084 0.948 0.088L0.844 0.128C0.82 0.128 0.792 0.104 0.792 0.056V-0.316C0.792 -0.344 0.812 -0.42 0.844 -0.432ZM0.672 0.18C0.648 0.26 0.46 0.34 0.368 0.34C0.344 0.34 0.324 0.332 0.32 0.32C0.312 0.304 0.308 0.216 0.308 0.12C0.308 -0.004 0.312 -0.144 0.32 -0.176C0.328 -0.244 0.512 -0.328 0.612 -0.328C0.64 -0.328 0.664 -0.32 0.672 -0.304C0.68 -0.284 0.688 -0.184 0.688 -0.076C0.688 0.032 0.68 0.144 0.672 0.18Z","b":[0.0,-1.4,0.996,1.392]},"cu":{"d":"M0.04 -0.3C0.024 -0.276 0.004 -0.236 0.004 -0.208C0.004 -0.184 0.016 -0.168 0.06 -0.168C0.104 -0.168 0.148 -0.224 0.18 -0.264C0.216 -0.312 0.252 -0.36 0.292 -0.404C0.32 -0.436 0.34 -0.456 0.356 -0.456C0.372 -0.456 0.384 -0.44 0.4 -0.408L0.656 -0.032C0.668 -0.012 0.688 -0.004 0.712 -0.004C0.732 -0.004 0.756 -0.012 0.768 -0.024C0.788 -0.052 1.036 -0.384 1.064 -0.416C1.08 -0.432 1.092 -0.44 1.1 -0.44C1.112 -0.44 1.12 -0.428 1.132 -0.408C1.152 -0.384 1.356 -0.064 1.396 -0.024C1.416 -0.004 1.436 0 1.46 0C1.488 0 1.512 -0.008 1.524 -0.024C1.552 -0.056 2.404 -1.468 2.444 -1.528C2.452 -1.54 2.456 -1.556 2.456 -1.568C2.456 -1.584 2.452 -1.596 2.44 -1.608C2.424 -1.624 2.4 -1.644 2.376 -1.644C2.372 -1.644 2.324 -1.62 2.304 -1.6C2.272 -1.56 1.7 -0.592 1.652 -0.532C1.64 -0.52 1.636 -0.52 1.636 -0.516C1.616 -0.488 1.604 -0.476 1.596 -0.476C1.592 -0.476 1.588 -0.484 1.584 -0.492L1.56 -0.528C1.536 -0.564 1.368 -0.92 1.328 -0.964C1.308 -0.984 1.292 -0.992 1.272 -0.992C1.252 -0.992 1.232 -0.984 1.216 -0.964C1.184 -0.928 0.984 -0.58 0.948 -0.536C0.928 -0.508 0.908 -0.496 0.892 -0.496C0.872 -0.496 0.856 -0.516 0.844 -0.536C0.82 -0.568 0.616 -0.9 0.596 -0.936C0.596 -0.976 0.54 -0.988 0.512 -0.992C0.492 -0.992 0.48 -0.984 0.46 -0.956C0.432 -0.928 0.412 -0.888 0.392 -0.856C0.308 -0.728 0.228 -0.6 0.148 -0.472Z","b":[0.004,-1.644,2.456,0.0]},"cd":{"d":"M0.04 -0.688 0.148 -0.516C0.228 -0.388 0.308 -0.26 0.392 -0.132C0.412 -0.1 0.432 -0.06 0.46 -0.032C0.48 -0.004 0.492 0.004 0.512 0.004C0.54 0 0.596 -0.012 0.596 -0.052C0.616 -0.088 0.82 -0.42 0.844 -0.452C0.856 -0.472 0.872 -0.492 0.892 -0.492C0.908 -0.492 0.928 -0.48 0.948 -0.452C0.984 -0.408 1.184 -0.06 1.216 -0.024C1.232 -0.004 1.252 0.004 1.272 0.004C1.292 0.004 1.308 -0.004 1.328 -0.024C1.368 -0.068 1.536 -0.424 1.56 -0.46L1.584 -0.496C1.588 -0.504 1.592 -0.512 1.596 -0.512C1.604 -0.512 1.616 -0.5 1.636 -0.472C1.636 -0.468 1.64 -0.468 1.652 -0.456C1.7 -0.396 2.272 0.572 2.304 0.612C2.324 0.632 2.372 0.656 2.376 0.656C2.4 0.656 2.424 0.636 2.44 0.62C2.452 0.608 2.456 0.596 2.456 0.58C2.456 0.568 2.452 0.552 2.444 0.54C2.404 0.48 1.552 -0.932 1.524 -0.964C1.512 -0.98 1.488 -0.988 1.46 -0.988C1.436 -0.988 1.416 -0.984 1.396 -0.964C1.356 -0.924 1.152 -0.604 1.132 -0.58C1.12 -0.56 1.112 -0.548 1.1 -0.548C1.092 -0.548 1.08 -0.556 1.064 -0.572C1.036 -0.604 0.788 -0.936 0.768 -0.964C0.756 -0.976 0.732 -0.984 0.712 -0.984C0.688 -0.984 0.668 -0.976 0.656 -0.956L0.4 -0.58C0.384 -0.548 0.372 -0.532 0.356 -0.532C0.34 -0.532 0.32 -0.552 0.292 -0.584C0.252 -0.628 0.216 -0.676 0.18 -0.724C0.148 -0.764 0.104 -0.82 0.06 -0.82C0.016 -0.82 0.004 -0.804 0.004 -0.78C0.004 -0.752 0.024 -0.712 0.04 -0.688Z","b":[0.004,-0.988,2.456,0.656]}};
/* filled (coloured) note heads: the outer contour of the void shapes */
/* modern note heads: oval heads, stems on the right going up and on the left going down (the 'd' glyphs) */
{
  const r2 = v => Math.round(v * 1000) / 1000;
  const ell = (cx, rx, ry, rot, sw) => { const a = rot * Math.PI / 180, dx = rx * Math.cos(a), dy = rx * Math.sin(a);
    return `M${r2(cx + dx)} ${r2(dy)}A${rx} ${ry} ${rot} 1 ${sw} ${r2(cx - dx)} ${r2(-dy)}A${rx} ${ry} ${rot} 1 ${sw} ${r2(cx + dx)} ${r2(dy)}Z`; };
  const head = ell(0.65, 0.65, 0.45, -20, 1), hole = ell(0.65, 0.5, 0.19, -30, 0);
  const up = 'M1.13 -0.2V-3.5H1.25V-0.2Z', dn = 'M0.05 0.2V3.5H0.17V0.2Z';
  const flagU = 'M1.13 -3.5H1.25C1.33 -2.8 2.15 -2.45 1.9 -1.25C1.86 -2.15 1.45 -2.45 1.25 -2.55Z';
  const flagD = 'M0.05 3.5H0.17C0.25 2.8 1.07 2.45 0.82 1.25C0.78 2.15 0.37 2.45 0.17 2.55Z';
  const B = [0, -0.55, 1.3, 0.55], BU = [0, -3.5, 1.3, 0.55], BD = [0, -0.55, 1.3, 3.5];
  GLY.nS = {d: ell(0.75, 0.75, 0.5, 0, 1) + ell(0.75, 0.42, 0.27, 55, 0), b: [0, -0.5, 1.5, 0.5]};
  GLY.nB = {d: 'M0 -0.62H0.1V0.62H0Z M0.2 -0.62H0.3V0.62H0.2Z' + ell(1.15, 0.75, 0.5, 0, 1) + ell(1.15, 0.42, 0.27, 55, 0) + 'M2 -0.62H2.1V0.62H2Z M2.2 -0.62H2.3V0.62H2.2Z', b: [0, -0.62, 2.3, 0.62]};
  GLY.nL = {d: GLY.nB.d + 'M2.2 0.6H2.3V3.5H2.2Z', b: [0, -0.62, 2.3, 3.5]};
  GLY.nM = {d: head + hole + up, b: BU}; GLY.nMd = {d: head + hole + dn, b: BD};
  GLY.nQ = {d: head + up, b: BU}; GLY.nQd = {d: head + dn, b: BD};
  GLY.nE = {d: head + up + flagU, b: BU}; GLY.nEd = {d: head + dn + flagD, b: BD};
  void B;
}
GLY.F2 = {d: GLY.F.d + 'M0.708 -2.62L1.268 -1.5C1.28 -1.48 1.304 -1.464 1.328 -1.464C1.336 -1.464 1.344 -1.468 1.356 -1.472C1.38 -1.484 1.392 -1.508 1.392 -1.532C1.392 -1.544 1.388 -1.552 1.384 -1.56L0.708 -2.91Z', b: GLY.F.b};
for (const k of ['Mx','L','B','S','M']) GLY[k + 'c'] = {d: GLY[k].d.slice(0, GLY[k].d.indexOf('Z') + 1), b: GLY[k].b};
/* the semifusa (Samuel 2026-11-15): one flag (or hook) more than the fusa. White: a black head with two flags (the black
   fusa's shape); black notation: three flags; modern: a sixteenth; its rest: the fusa rest with a second hook */
function shiftPath(d, dy){
  const out = []; let cmd = '', k = 0;
  const per = {M: 2, L: 2, C: 2, S: 2, Q: 2, T: 2, H: 1, V: 1, A: 7, Z: 0};
  for (const tok of d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g)) {
    if (/[A-Za-z]/.test(tok)) { cmd = tok.toUpperCase(); k = 0; out.push(tok); continue; }
    let v = +tok;
    const n = per[cmd] || 2;
    if ((cmd === 'V') || (cmd === 'A' && k % 7 === 6) || (n === 2 && k % 2 === 1)) v += dy;
    out.push((Math.round(v * 1000) / 1000).toString()); k++;
  }
  return out.join(' ').replace(/ ([A-Za-z]) /g, '$1').replace(/^([A-Za-z]) /, '$1').replace(/ ([A-Za-z])$/, '$1');
}
{
  const flag2 = GLY.F2.d.slice(GLY.F.d.length);
  GLY.Sf = {d: GLY.F2.d, b: GLY.F2.b};
  GLY.F3 = {d: GLY.F2.d + shiftPath(flag2, 0.45), b: GLY.F2.b};
  /* coloured small values (sesquialtera / triplet semiminima, fusa, semifusa): since Mc already uses the unflagged
     black diamond shape, coloured Sm (1/6) takes 1 flag (F), coloured F (1/12) takes 2 flags (Sf), coloured Sf takes 3 (F3) */
  GLY.Smc = {d: GLY.F.d, b: GLY.F.b};
  GLY.Fc = {d: GLY.Sf.d, b: GLY.Sf.b};
  GLY.Sfc = {d: GLY.F3.d, b: GLY.F3.b};
  /* Historical accidental styles: shO (Renaissance diagonal double-cross diesis), shX (early single diagonal cross), naO (square b quadratum) */
  const barP = (x1, y1, x2, y2, hw) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len * hw, ny = dx / len * hw;
    const r = n => Math.round(n * 1000) / 1000;
    return `M${r(x1 + nx)} ${r(y1 + ny)}L${r(x2 + nx)} ${r(y2 + ny)}L${r(x2 - nx)} ${r(y2 - ny)}L${r(x1 - nx)} ${r(y1 - ny)}Z`;
  };
  {
    /* Old Renaissance diesis (shO) and b quadratum (naO), sized to match modern sharp/natural height */
    const cx = 0.72, L = 0.88, s = 0.25, u = Math.SQRT1_2, vy = 1.24, hw = 0.072;
    GLY.shO = {
      d: barP(cx - L * u + s * u, (-L * u - s * u) * vy, cx + L * u + s * u, (L * u - s * u) * vy, hw) +
         barP(cx - L * u - s * u, (-L * u + s * u) * vy, cx + L * u - s * u, (L * u + s * u) * vy, hw) +
         barP(cx - L * u + s * u, (L * u + s * u) * vy, cx + L * u + s * u, (-L * u + s * u) * vy, hw) +
         barP(cx - L * u - s * u, (L * u - s * u) * vy, cx + L * u - s * u, (-L * u - s * u) * vy, hw),
      b: [0.02, -1.16, 1.42, 1.16]
    };
    GLY.shX = {
      d: barP(0.46 - 0.34, -0.34, 0.46 + 0.34, 0.34, 0.062) + barP(0.46 - 0.34, 0.34, 0.46 + 0.34, -0.34, 0.062),
      b: [0.06, -0.4, 0.86, 0.4]
    };
    GLY.naO = {
      d: 'M0.04 -1.32H0.16V0.62H0.04ZM0.48 -0.62H0.60V1.32H0.48ZM0.04 -0.50H0.60V-0.25H0.04ZM0.04 0.25H0.60V0.50H0.04Z',
      b: [0.04, -1.32, 0.60, 1.32]
    };
  }
  const flagU = 'M1.13 -3.5H1.25C1.33 -2.8 2.15 -2.45 1.9 -1.25C1.86 -2.15 1.45 -2.45 1.25 -2.55Z';
  const flagD = 'M0.05 3.5H0.17C0.25 2.8 1.07 2.45 0.82 1.25C0.78 2.15 0.37 2.45 0.17 2.55Z';
  GLY.nX = {d: GLY.nE.d + shiftPath(flagU, 0.6), b: GLY.nE.b};
  GLY.nXd = {d: GLY.nEd.d + shiftPath(flagD, -0.6), b: GLY.nEd.b};
  GLY.rSf = {d: shiftPath(GLY.rF.d, -0.32) + GLY.rF.d, b: [GLY.rF.b[0], GLY.rF.b[1] - 0.32, GLY.rF.b[2], GLY.rF.b[3]]};
}

const NATSC = 1.3;   /* the natural sign is drawn a little larger than its glyph (Samuel 2026-11-14) */
const accGlyph = k => {
  const s = typeof st !== 'undefined' ? st.accStyle : 'modern';
  if (s === 'old') return k === 'sh' ? 'shO' : k === 'na' ? 'naO' : k;
  return k;
};
const gw = k => { const g = accGlyph(k); return (GLY[g].b[2] - GLY[g].b[0]) * (g === 'na' ? NATSC : 1); };
const f = n => (Math.round(n * 1000) / 1000).toString();
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const EPS = 1e-6, eq = (a, b) => Math.abs(a - b) < 1e-4;
const rt = x => Math.round(x * 5040) / 5040;
const $ = s => document.querySelector(s);

/* Manuscript paper textures: selectable from the Paper swatch dropdown in Engraving */
const PAPER_TEXTURES = [
  ['vellum-cream',   '#F3E8CE', 'Warm Cream Vellum'],
  ['vellum-ivory',   '#F7EED9', 'Light Ivory Vellum'],
  ['vellum-chamois', '#F5EBD3', 'Fine Chamois Vellum'],
  ['vellum-chalk',   '#FAF4E4', 'Chalked Vellum'],
  ['vellum-gold',    '#EDE0C1', 'Stippled Golden Vellum'],
  ['laid',           '#F0E4C9', 'Laid & Chain-Line'],
  ['rag',            '#EAE0C8', 'Flecked Rag Pulp'],
  ['crisp',          '#F7F0DF', 'Bright Crisp Ivory'],
  ['classic',        '#EFE3C7', 'Cloudy Parchment']
];
const PAPER_URLS = {};
function makePaperUrl(kind){
  if (PAPER_URLS[kind]) return PAPER_URLS[kind];
  try {
    const rng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
    const noise = (seed, cell, w, h) => {
      const r = rng(seed), gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh);
      for (let i = 0; i < g.length; i++) g[i] = r();
      return (x, y) => {
        const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const ix = ((x0 % (gw - 1)) + gw - 1) % (gw - 1), iy = ((y0 % (gh - 1)) + gh - 1) % (gh - 1);
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
        return a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy;
      };
    };
    const w = 384, h = 384, ox = 48, oy = 48, gw = w + ox, gh = h + oy, k = w / 1600;
    const fine = noise(21, kind === 'vellum-chamois' ? 0.95 : 1.25, w, h);
    const mid = noise(22, 3.6, w, h), streak = noise(23, 8.5, w, h), big = noise(13, 180 * k, w, h), fox = noise(14, 40 * k, w, h);
    const raw = rng(101);
    const src = new Float32Array(gw * gh * 3);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 3;
      let r = 243, g = 232, b = 206;
      if (kind === 'vellum-cream') {
        const pore = (fine(x, y) - 0.5) * 20 + (mid(x * 0.8, y * 0.8) - 0.5) * 8;
        const fol = raw() < 0.04 ? -15 : raw() > 0.955 ? 9 : 0, v = pore + fol;
        r = 243 + v; g = 232 + v * 0.95; b = 206 + v * 0.86;
      } else if (kind === 'vellum-ivory') {
        const pore = (fine(x, y) - 0.5) * 18 + (mid(x * 0.9, y * 0.9) - 0.5) * 7;
        const fol = raw() < 0.038 ? -14 : raw() > 0.95 ? 8 : 0, v = pore + fol;
        r = 247 + v; g = 238 + v * 0.96; b = 217 + v * 0.88;
      } else if (kind === 'vellum-chamois') {
        const pore = (fine(x, y) - 0.5) * 16 + (raw() - 0.5) * 11;
        r = 245 + pore; g = 235 + pore * 0.95; b = 211 + pore * 0.88;
      } else if (kind === 'vellum-chalk') {
        const pore = (fine(x, y) - 0.5) * 19 + (mid(x, y) - 0.5) * 6;
        const fol = raw() < 0.042 ? -15 : raw() > 0.95 ? 7 : 0, v = pore + fol;
        r = 250 + v; g = 244 + v * 0.96; b = 228 + v * 0.90;
      } else if (kind === 'vellum-gold') {
        const pore = (fine(x, y) - 0.5) * 22 + (mid(x * 0.8, y * 0.8) - 0.5) * 10;
        const fol = raw() < 0.045 ? -18 : raw() > 0.96 ? 10 : 0, v = pore + fol;
        r = 237 + v; g = 221 + v * 0.95; b = 186 + v * 0.85;
      } else if (kind === 'laid') {
        const wire = Math.sin(y * (2 * Math.PI / 4)) * 8.5;
        const cd = Math.abs((x % 48) - 24), chain = cd < 1.2 ? -10 : cd < 2.4 ? 4.5 : 0;
        const fib = (mid(x * 0.12, y * 1.8) - 0.5) * 13 + (fine(x, y) - 0.5) * 9, v = wire + chain + fib;
        r = 240 + v; g = 228 + v * 0.96; b = 201 + v * 0.88;
      } else if (kind === 'rag') {
        const fx = (streak(x * 0.14, y * 2.4) - 0.5) * 17, fy = (streak(x * 2.4, y * 0.14) - 0.5) * 14;
        const gr = (fine(x, y) - 0.5) * 13, fl = raw() < 0.012 ? -42 : raw() < 0.028 ? -20 : 0, v = fx + fy + gr;
        r = 234 + v + fl * 0.85; g = 222 + v * 0.95 + fl * 0.95; b = 196 + v * 0.9 + fl * 1.1;
      } else if (kind === 'crisp') {
        const tooth = (fine(x, y) - 0.5) * 14 + (raw() - 0.5) * 8;
        r = 247 + tooth; g = 240 + tooth * 0.98; b = 223 + tooth * 0.92;
      } else {
        const n = (big(x, y) - 0.5) * 13 + (mid(x, y) - 0.5) * 6 + (fine(x, y) - 0.5) * 5;
        const laid = (mid(x * 0.15, y * 2.5) - 0.5) * 7, wv = (mid(x * 0.3, y * 0.3) - 0.5) * 60 * k;
        const fx = Math.max(0, fox(x + wv, y - wv) * 0.7 + big(x * 2, y * 2) * 0.3 - (1 - 0.05 * 2.6)) * 90;
        r = 239 + n + laid - fx * 0.4; g = 227 + n + laid - fx * 0.7; b = 199 + n * 1.2 + laid - fx;
      }
      src[i] = r; src[i + 1] = g; src[i + 2] = b;
    }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'), img = cx.createImageData(w, h), d = img.data;
    const at = (x, y, c) => src[(y * gw + x) * 3 + c];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const tx = x < ox ? x / ox : 1, ty = y < oy ? y / oy : 1, i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const row = yy => at(x, yy, c) * tx + (x < ox ? at(x + w, yy, c) * (1 - tx) : 0);
        d[i + c] = row(y) * ty + (y < oy ? row(y + h) * (1 - ty) : 0);
      }
      d[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return (PAPER_URLS[kind] = `url(${cv.toDataURL('image/jpeg', 0.88)})`);
  } catch (e) { return 'none'; }
}
makePaperUrl('vellum-cream');

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */
/* bottom = diatonic step of the bottom staff line (C4 = 28); pos = staff position of the clef's own line */
const CLEFS = {
  treble8:  {bottom:23, g:'gP', pos:2, oct:true},
  treble:   {bottom:30, g:'gP', pos:2},
  g1:       {bottom:32, g:'gP', pos:0},
  c1:       {bottom:28, g:'c1', pos:0},
  c2:       {bottom:26, g:'c2', pos:2},
  c3:       {bottom:24, g:'c3', pos:4},
  c4:       {bottom:22, g:'c4', pos:6},
  c5:       {bottom:20, g:'c5', pos:8},
  f3:       {bottom:20, g:'fP', pos:4},
  bass:     {bottom:18, g:'fP', pos:6},
  none:     {bottom:28, g:'c1', pos:0, none:true}
};
const MENS_CLEFS = ['c1','c2','c3','c4','f3','bass','treble'];
const KERN_CLEF = {G1:'g1', G2:'treble', Gv2:'treble8', G2v:'treble8', F4:'bass', F3:'f3', C1:'c1', C2:'c2', C3:'c3', C4:'c4', C5:'c5', none:'none', X:'none'};
const LETTERS = 'cdefgab';
const ACCG = {'-1':'fl', '0':'na', '1':'sh'};
const SHAPE_REST = {Mx:'rL', L:'rL', B:'rB', S:'rS', M:'rM', Sm:'rSm', F:'rF', Sf:'rSf'};
const STEMMED = {M:1, Sm:1, F:1, Sf:1, Mc:1};
const TAILED = {L:1, Lc:1, Mx:1, Mxc:1};

/* ------------------------------------------------------------------ */
/* Humdrum **kern reader                                               */
/* ------------------------------------------------------------------ */
function recipDur(tok){
  const m = tok.match(/(\d+)(?:%(\d+))?(\.*)/);
  if (!m) return null;
  let d;
  if (/^0+$/.test(m[1])) d = Math.pow(2, m[1].length);
  else d = (m[2] ? +m[2] : 1) / +m[1];
  const k = m[3].length;
  d *= 2 - Math.pow(0.5, k);
  return {d, dots: k, rational: !!m[2], rest: tok.slice(0, m.index) + tok.slice(m.index + m[0].length)};
}
function parsePitchAlt(rest){
  const pm = rest.match(/([a-gA-G])\1*/);
  if (/r/.test(rest) || !pm) return null;
  const L = pm[0], ch = L[0], idx = LETTERS.indexOf(ch.toLowerCase());
  const step = ch === ch.toLowerCase() ? 28 + 7 * (L.length - 1) + idx : 28 - 7 * L.length + idx;
  const after = rest.slice(rest.indexOf(L) + L.length);
  const am = after.match(/^(#+|-+|n)?(i)?/);
  let alt = null, ed = false;
  if (am && am[1]) { alt = am[1][0] === '#' ? am[1].length : am[1][0] === '-' ? -am[1].length : 0; ed = !!am[2]; }
  return {step, alt, ed};
}
/* Note appearance, for the eye only (Clemens Goldberg's editions: a black note against a white one in the same chord
   marks the supplementary note, not coloration). Kern signifiers: N black, + white, j red. */
const LOOK_SIG = {black: 'N', white: '+', red: 'j'};
function lookOfTok(tok){ return tok.includes('N') ? 'black' : tok.includes('j') ? 'red' : tok.includes('+') ? 'white' : null; }
function parseNoteTok(raw){
  const parts = raw.trim().split(/\s+/);
  const tok = parts[0];
  const r = recipDur(tok);
  if (!r) return null;
  const rest = r.rest;
  const ev = {d: r.d, kd: r.d, dots: r.dots, rational: r.rational};
  ev.tieStart = tok.includes('['); ev.tieEnd = tok.includes(']'); ev.tieMid = tok.includes('_');
  ev.ferm = tok.includes(';');
  ev.signum = tok.includes('$'); /* signum congruentiae (no playback pause) */
  ev.colH = tok.includes('@');   /* coloured as written (CMME), user signifier */
  { const lk = lookOfTok(tok); if (lk) ev.look = lk; }   /* how the note is shown only (black, white, red): no effect on its value */
  ev.altd = tok.includes('~');
  ev.dd = tok.includes('Y');      /* punctus divisionis: divides the perfection, adds nothing */
  ev.pa = tok.includes('W');      /* punctus additionis on an already-perfect value: keeps it perfect, adds nothing */
  ev.stemDirOvr = tok.includes('U') ? 'u' : tok.includes('J') ? 'd' : tok.includes('Q') ? 'n' : '';
  ev.stemSideOvr = tok.includes('K') ? 'l' : tok.includes('R') ? 'r' : '';
  ev.long = /l/.test(rest.replace(/[a-gA-G]/g, ''));
  ev.tupS = tok.includes('V'); ev.tupE = tok.includes('Z');
  const p0 = parsePitchAlt(rest);
  if (!p0) { ev.rest = true; return ev; }
  ev.step = p0.step; ev.alt = p0.alt; ev.ed = p0.ed;
  if (parts.length > 1) {
    const chord = [];
    for (let i = 1; i < parts.length; i++) {
      const ri = recipDur(parts[i]);
      const pi = parsePitchAlt(ri ? ri.rest : parts[i]);
      if (pi && pi.step !== ev.step && !chord.some(c => c.step === pi.step)) { const lk = lookOfTok(parts[i]); if (lk) pi.look = lk; chord.push(pi); }
    }
    if (chord.length) { chord.sort((a, b) => a.step - b.step); ev.chord = chord; }
  }
  return ev;
}
function prettyName(s){
  const m = String(s || '').match(/^([^,]+),\s*(.+)$/);
  return m ? m[2] + ' ' + m[1] : (s || '');
}
/* HTML entities in the reference records (JRP titles: mari&eacute;e) */
function decodeEnt(t){ const d = document.createElement('textarea'); d.innerHTML = t; return d.value; }
function defaultExt(){
  return {credits:{}, rests:{}, custos:[], lacunae:[], origText:{}, ann:[], ligKind:{}, variants:[], activeVer:'', chants:[], pass:[]};
}
function ensureExt(P){
  if (!P) return defaultExt();
  if (!P.ext || typeof P.ext !== 'object') P.ext = defaultExt();
  const d = defaultExt();
  for (const k of Object.keys(d)) if (P.ext[k] === undefined || P.ext[k] === null) P.ext[k] = d[k];
  return P.ext;
}
function extHasData(ext){
  if (!ext) return false;
  if (ext.credits && Object.values(ext.credits).some(v => v && String(v).trim())) return true;
  if (ext.rests && Object.keys(ext.rests).length) return true;
  if (ext.origText && Object.keys(ext.origText).length) return true;
  if (ext.ligKind && Object.keys(ext.ligKind).length) return true;
  if (ext.activeVer) return true;
  for (const k of ['custos','lacunae','ann','variants','chants','pass']) if (Array.isArray(ext[k]) && ext[k].length) return true;
  return false;
}
function parseKern(text){
  const lines = text.split(/\r?\n/);
  const meta = {};
  const ext = defaultExt();
  const voices = [];
  let cols = null;                 /* per column: {type:'kern', v} | {type:'text', v, verse} | {type:'other'} */
  const bars = [], sections = [], barNums = [];
  let pendingSection = null;
  for (const raw of lines) {
    const L = raw.replace(/\s+$/, '');
    if (!L) continue;
    if (L.startsWith('!!')) {
      let m = L.match(/^!!!EXT:\s*(.+)$/);
      if (m) {
        try {
          const obj = JSON.parse(m[1]);
          if (obj && typeof obj === 'object') {
            if (obj.credits) Object.assign(ext.credits, obj.credits);
            if (obj.rests) Object.assign(ext.rests, obj.rests);
            if (obj.origText) Object.assign(ext.origText, obj.origText);
            if (obj.ligKind) Object.assign(ext.ligKind, obj.ligKind);
            if (obj.activeVer) ext.activeVer = obj.activeVer;
            for (const k of ['custos','lacunae','ann','variants','chants','pass']) {
              if (Array.isArray(obj[k])) ext[k].push(...obj[k]);
            }
          }
        } catch (err) {}
        continue;
      }
      m = L.match(/^!!!([^:]+):\s*(.*)$/);
      if (m) { if (!(m[1] in meta)) meta[m[1]] = m[2].includes('&') ? decodeEnt(m[2]) : m[2]; continue; }
      m = L.match(/^!!section:\s*(.*)$/);
      if (m) pendingSection = m[1];
      continue;
    }
    const tok = L.split('\t');
    if (L.startsWith('**')) {
      cols = [];
      let last = null;
      for (const s of tok) {
        if (s === '**kern') {
          last = {name:null, abbr:'', kclef:null, events:[], mets:[], keys:[], clefs:[], verses:0, t:0};
          voices.push(last); cols.push({type:'kern', v:last});
        } else if ((s === '**text' || s === '**silbe') && last) {
          cols.push({type:'text', v:last, verse:last.verses++});
        } else cols.push({type:'other'});
      }
      continue;
    }
    if (!cols) continue;
    if (tok[0].startsWith('!')) continue;
    if (tok.some(s => s === '*^' || s === '*v')) {
      /* a voice dividing in two (divisi): only its first line is read */
      const nc = [];
      for (let i = 0; i < tok.length; ) {
        const c = cols[i] || {type:'other'};
        if (tok[i] === '*^') { nc.push(c, {type: c.type + 'X', v: c.v}); i++; }
        else if (tok[i] === '*v') {
          let j = i; while (j < tok.length && tok[j] === '*v') j++;
          const run = cols.slice(i, j);
          nc.push(run.find(x => x && !/X$/.test(x.type)) || run[0]);
          i = j;
        } else { nc.push(c); i++; }
      }
      cols = nc;
      continue;
    }
    if (tok[0].startsWith('*')) {
      tok.forEach((s, i) => {
        const c = cols[i];
        if (!c || c.type !== 'kern') return;
        const v = c.v;
        let m;
        if ((m = s.match(/^\*I"(.*)$/))) v.name = m[1].trim();
        else if ((m = s.match(/^\*I'(.*)$/))) v.abbr = m[1];
        else if ((m = s.match(/^\*clef(.+)$/))) v.clefs.push({t: v.t, c: m[1], ei: v.events.length});
        else if ((m = s.match(/^\*oclef(.+)$/))) { if (!v.oclef) v.oclef = m[1]; }
        else if ((m = s.match(/^\*k\[(.*)\]$/))) {
          const alts = {};
          (m[1].match(/[a-g](#+|-+)/g) || []).forEach(a => { alts[a[0]] = a[1][0] === '#' ? 1 : -1; });
          v.keys.push({t: v.t, alts, raw: m[1], ei: v.events.length});
        }
        else if ((m = s.match(/^\*met\((.*)\)$/))) v.mets.push({t: v.t, sign: m[1], ei: v.events.length});
        /* the modern equivalent of the sign before it (our own tandem, e.g. *mod(3/1)): printed in modern notation, and the barlines follow it */
        else if ((m = s.match(/^\*mod\((.*)\)$/))) { const q = v.mets[v.mets.length - 1]; if (q && eq(q.t, v.t) && m[1]) q.mod = m[1]; }
        else if ((m = s.match(/^\*M(\d+)\/(\d+)$/))) v.lastM = +m[1] / +m[2];
        else if (s === '*lig') { v.ligN = (v.ligN || 0) + 1; v.ligOn = v.ligN; }
        else if (s === '*Xlig') v.ligOn = 0;
        else if (s === '*divisi') v.isSub = true;
      });
      continue;
    }
    if (tok[0].startsWith('=')) {
      const t = Math.max(...voices.map(v => v.t));
      const s = tok[0];
      if (t > EPS && !/-/.test(s)) bars.push({t: rt(t), type: (s.startsWith('==') || s.includes('||')) ? 'double' : s.includes('!') ? 'sec' : 'single'});
      { const bm = s.match(/^=+(\d+)/); if (bm && !barNums.some(b => b.n === +bm[1])) barNums.push({n: +bm[1], t: rt(t)}); }
      continue;
    }
    /* data line */
    const started = new Map();
    tok.forEach((s, i) => {
      const c = cols[i];
      if (!c || c.type !== 'kern' || s === '.') return;
      const ev = parseNoteTok(s);
      if (!ev) return;
      const v = c.v;
      ev.t = rt(v.t); ev.syl = [];
      if (v.ligOn && !ev.rest) ev.lig = v.ligOn;
      if (pendingSection !== null) { sections.push({t: ev.t, label: pendingSection}); pendingSection = null; }
      v.events.push(ev); v.t = rt(v.t + ev.d);
      started.set(v, ev);
    });
    tok.forEach((s, i) => {
      const c = cols[i];
      if (!c || c.type !== 'text' || s === '.' || s.startsWith('!')) return;
      const ev = started.get(c.v);
      if (ev) ev.syl[c.verse] = s;
    });
  }
  if (!voices.length) throw new Error('No **kern voices found in this file.');
  voices.forEach((v, i) => {
    v.end = v.t;
    if (v.name === null) v.name = 'Voice ' + (voices.length - i);
    { const c0 = v.clefs.find(q => q.t < EPS); v.kclef = c0 ? c0.c : null; }
  });
  const titleKey = Object.keys(meta).find(k => k === 'OTL') || Object.keys(meta).find(k => k.startsWith('OTL'));
  let title = (titleKey ? meta[titleKey] : 'Untitled').replace(/\s*\.\.\.\s*/g, ' … ');
  if (meta.OPR) title = meta.OPR + ': ' + title;
  const composer = prettyName(meta.COM || meta.COA || '');
  /* top voice first */
  const vs = voices.slice().reverse();
  vs.forEach((v, i) => {
    if (v.isSub && i > 0) {
      let p = i - 1;
      while (p > 0 && vs[p].isSub) p--;
      v.subOf = p;
    }
    delete v.isSub;
  });
  const end = Math.max(...vs.map(v => v.end));
  if (meta.ENC && !ext.credits.editor) ext.credits.editor = meta.ENC;
  if ((meta.SMS || meta.SCT) && !ext.credits.source) ext.credits.source = [meta.SMS, meta.SCT].filter(Boolean).join(' — ');
  if (meta.YEC && !ext.credits.licence) ext.credits.licence = meta.YEC;
  if (meta.ONB && !ext.credits.notes) ext.credits.notes = meta.ONB;
  const res = {title, composer, attributed: !meta.COM && !!meta.COA, voices: vs, bars: bars.filter(b => b.t < end - EPS), sections, end, meta, barNums, ext};
  /* a score with mensuration signs but no barlines at all (one written here) gets them by itself, at every perfection */
  if (!res.bars.length && !meta.BARS && end > EPS && vs.some(v => v.mets.length)) meta.BARS = 'auto';
  autoRebar(res);
  return res;
}

/* ------------------------------------------------------------------ */
/* Mensuration signs                                                   */
/* ------------------------------------------------------------------ */
/* A sign: its shape (O C, dot, stroke, reversed), a number or a proportion (3, 2, 3/2, 4/3), and, after a ';', the
   higher levels that no shape shows: ';mp' modus perfectus (a longa is three breves), ';xp' maximodus perfectus (a maxima
   is three longae). T tempus, P prolatio, M modus, X maximodus (2 or 3); p the proportion (written = sounding x p). */
function mensBase(sign){ return String(sign || '').split(';')[0]; }
function parseSpeedFactor(raw){
  if (!raw) return 1;
  const fr = String(raw).match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fr) { const a = +fr[1], b = +fr[2]; return (a > 0 && b > 0) ? a / b : 1; }
  const n = +raw;
  return (n > 0 && isFinite(n)) ? n : 1;
}
function mensInfo(sign){
  const full = sign || '', s = mensBase(full), ext = full.slice(s.length);
  const circle = /O/.test(s), dot = /\./.test(s);
  const fr = s.match(/(\d+)\s*\/\s*(\d+)/), num = fr ? '' : (s.match(/\d+/) || [''])[0];
  /* under 3 and 3/2 the notes go in threes, as in tempus perfectum */
  const T = circle || num === '3' || (fr && +fr[1] === 3) ? 3 : 2;
  const P = dot ? 3 : 2;
  /* proportions: JRP gives sounding values, so written = sounding x p */
  const baseP = fr ? +fr[1] / +fr[2] : num === '3' ? 1.5 : num === '2' ? 2 : 1;
  const sfm = ext.match(/;sf=([0-9.]+(?:\/[0-9.]+)?)/);
  const sfRaw = sfm ? sfm[1] : '';
  const sf = parseSpeedFactor(sfRaw);
  const p = baseP * sf;
  const eqm = ext.match(/;eq=([MSBL])/);
  const M = /mp/.test(ext) ? 3 : 2, X = /xp/.test(ext) ? 3 : 2;
  return {T, P, p, baseP, sf, sfRaw, eq: eqm ? eqm[1] : '', M, X};
}
function metAt(v, t){
  let s = null;
  for (const m of v.mets) if (m.t <= t + EPS) s = m.sign;
  return s;
}

/* ------------------------------------------------------------------ */
/* From sounding durations to notated shapes                           */
/* ------------------------------------------------------------------ */
/* values in written semibreves for a mensuration */
function valueTable(T, P, M = 2, X = 2){
  const S = P === 3 ? 1.5 : 1, B = T * S, L = M * B;
  return [['Mx', X * L], ['L', L], ['B', B], ['S', S], ['M', 0.5], ['Sm', 0.25], ['F', 0.125], ['Sf', 0.0625]];
}
function shapeReal(w, T, P, M = 2, X = 2){
  const tab = valueTable(T, P, M, X), S = tab[3][1], B = tab[2][1], L = tab[1][1];
  for (const [g, v] of tab) if (eq(w, v)) return {g};
  if (T === 3 && eq(w, 2 * S)) return {g:'B', imp:true};
  if (M === 3 && eq(w, 2 * B)) return {g:'L', imp:true};
  if (X === 3 && eq(w, 2 * L)) return {g:'Mx', imp:true};
  if (P === 3 && eq(w, 1)) return {g:'S'};
  if (T === 3 && eq(w, 4 * S)) return {g:'L', col:true};
  for (const [g, v] of tab) {
    const imperfectLevel = g === 'B' ? T === 2 : g === 'S' ? P === 2 : g === 'L' ? M === 2 : g === 'Mx' ? X === 2 : true;
    if (imperfectLevel && eq(w, v * 1.5)) return {g, dot:true};
  }
  for (const [g, v] of tab) if (eq(w * 1.5, v)) return {g, col:true};
  /* last resort, before splitting into tied notes: a dot of addition even on a perfect value */
  for (const [g, v] of tab) if (eq(w, v * 1.5)) return {g, dot:true};
  return null;
}
/* an altered note is written as the shape half its value (alteration is not marked in white or black notation) */
function shapeAlt(w, T, P, M, X){
  for (const [g, v] of valueTable(T, P, M, X)) if (eq(w, 2 * v)) return {g};
  return null;
}
/* a note the source writes black (CMME): the white shape it is two thirds of (the usual coloration), three quarters of
   (minor colour: a black breve with a black semibreve), or the same value blackened (semibreves in a hemiola under 3) */
function shapeCol(w, T, P, M, X){
  const tab = valueTable(T, P, M, X);
  for (const f of [1.5, 4 / 3, 1]) for (const [g, v] of tab) if (eq(w * f, v) && (f !== 1 || (g !== 'M' && g !== 'Sm' && g !== 'F' && g !== 'Sf'))) return {g, col:true};
  return null;
}
function shapeFake(d){
  const tab = [['Mx', 8], ['L', 4], ['B', 2], ['S', 1], ['M', 0.5], ['Sm', 0.25], ['F', 0.125], ['Sf', 0.0625]];
  for (const [g, v] of tab) if (eq(d, v)) return {g};
  for (const [g, v] of tab) if (eq(d, v * 1.5)) return {g, dot:true};
  for (const [g, v] of tab) if (eq(d, v * 1.75)) return {g, dot:true, dot2:true};
  for (const [g, v] of tab) if (eq(d * 1.5, v)) return {g, tup:3};
  for (const [g, v] of tab) if (eq(d * 1.5, v * 1.5)) return {g, dot:true, tup:3};
  return null;
}
/* break a value into plain shapes, largest first */
function decompose(w, T, P){
  const tab = valueTable(T, P), out = [];
  let r = w, guard = 0;
  while (r > 0.01 && guard++ < 20) {
    let pick = tab.find(([g, v]) => v <= r + EPS);
    if (!pick) pick = tab[tab.length - 1];
    out.push(pick); r -= pick[1];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The mensural rules (Samuel 2026-11-15), for scores written here (!!!MENS: rules)   */
/* A note is written as a shape; how long it sounds follows from the sign and from what stands around it:
   - perfection: in tempus perfectum a breve is three semibreves, in prolatio maior a semibrevis three minims (modus is always
     imperfect here: a longa is two breves);
   - imperfection: a perfect note followed (a.p.p., the usual) or else preceded (a.p.a.) by the one smaller value that makes a third,
     is imperfected, loses a third;
   - alteration: the second of two such smaller notes before a perfect note is doubled;
   - a dot adds half of an imperfect value; on a perfect note it would be a dot of division, which is not written yet.
   Notes are shapes, so changing the sign or a neighbour re-counts them. Coloured notes, rests and notes of unknown shape keep their length. */
const MENS_RANK = {Mx: 0, L: 1, B: 2, S: 3, M: 4, Sm: 5, F: 6, Sf: 7};
/* the rules count the notes of scores written here and of the user's own scores; the repertoire keeps the lengths its edition gives,
   unless switched on in the sign's menu (Mensural rules: On) */
const mensRulesOn = () => !!(piece && piece.meta && (piece.meta.MENS === 'rules' || (piece.meta.MENS !== 'off' && typeof pieceKey === 'string' && /^(mine|file):/.test(pieceKey) && piece.meta.BARS === 'auto')));
/* the length of a shape in the sign standing at t, before perfection and the rest (written value, a minim = 0.5), and in sounding value */
function nomW(g, T, P, M, X){ const r = valueTable(T, P, M, X).find(x => x[0] === g); return r ? r[1] : null; }
/* is this shape a perfect one in the sign standing at t (a breve in tempus perfectum, a semibrevis in prolatio maior) */
function perfectShape(v, t, g){ const mi = mensInfo(metAt(v, t)); return isPerfectLevel(g, mi); }
const isPerfectLevel = (g, mi) => (g === 'B' && mi.T === 3) || (g === 'S' && mi.P === 3) || (g === 'L' && mi.M === 3) || (g === 'Mx' && mi.X === 3);
function nomD(v, t, g){ const mi = mensInfo(metAt(v, t)), w = nomW(g, mi.T, mi.P, mi.M, mi.X); return rt(w / mi.p); }
/* the written shape of an event, as it now stands in its sign: {g, dot} or null (coloured, tied oddly or of no shape: kept as it is) */
function shapeOfEvent(e, mi){
  if (e.colH || e.long || e.tupS || e.tupE) return null;
  const w = rt(e.d * mi.p), tab = valueTable(mi.T, mi.P, mi.M, mi.X);
  if (e.rest) { const r = tab.find(x => eq(w, x[1])); return r ? {g: r[0], rest: true} : null; }
  if (e.altd) { const a = shapeAlt(w, mi.T, mi.P, mi.M, mi.X); return a ? {g: a.g, altd: true, dd: !!e.dd} : null; }
  const sh = shapeReal(w, mi.T, mi.P, mi.M, mi.X);
  if (!sh || sh.col) return null;
  return {g: sh.g, dot: !!sh.dot && !e.dd && !e.pa, dd: !!e.dd, pa: !!e.pa};
}
/* one voice: tied parts (made by the barlines) are one note again, then every note takes its value from its shape and its neighbours.
   `map` is returned: where each old event went (so the selection and the caret can follow). */
function logicalNotes(v){
  const ev = v.events, n = ev.length, L = [];
  for (let i = 0; i < n; i++) {
    const e = ev[i], it = {i, parts: [i], e, d: e.d};
    if (!e.rest && e.tieStart && !e.tieEnd) {
      let j = i + 1;
      while (j < n && !ev[j].rest && ev[j].step === e.step) {
        it.parts.push(j); it.d = rt(it.d + ev[j].d);
        if (ev[j].tieEnd && !ev[j].tieStart) { j++; break; }
        j++;
      }
      i = j - 1;
    }
    L.push(it);
  }
  return L;
}
function mensurate(v){
  retime(v);
  const ev = v.events, n = ev.length;
  const map = new Array(n + 1);
  /* 1. logical notes: tied parts joined */
  const L = logicalNotes(v);
  /* 2. shapes, in the sign each note stands under (or, after a sign change, the one it was written under: e._sh) */
  const zones = [];
  let cur = null;
  for (const it of L) {
    const t = it.e.t, sign = metAt(v, t);
    const key = sign || '';
    if (!cur || cur.key !== key) { cur = {key, mi: mensInfo(sign), items: []}; zones.push(cur); }
    const mi = cur.mi;
    it.mi = mi;
    const sh = it.e._sh !== undefined ? it.e._sh : shapeOfEvent(Object.assign({}, it.e, {d: it.d}), it.e._shmi || mi);
    it.sh = sh;
    it.rigid = !sh;
    it.val = sh ? (nomW(sh.g, mi.T, mi.P, mi.M, mi.X) * (sh.dot ? 1.5 : 1)) : rt(it.d * mi.p);
    it.rank = sh ? MENS_RANK[sh.g] : -1;
    it.altd = false;
    cur.items.push(it);
  }
  /* 3. perfection, imperfection and alteration, zone by zone: the semibrevis level first (prolatio), then the breve (tempus) */
  const apa = mensOpt('apa'), imp2 = mensOpt('imp2');
  for (const z of zones) {
    const mi = z.mi, tab = valueTable(mi.T, mi.P, mi.M, mi.X), S = tab[3][1], B = tab[2][1], L = tab[1][1];
    /* from the smallest level up: prolatio (semibrevis), tempus (brevis), modus (longa), maximodus (maxima) */
    const levels = [];
    if (mi.P === 3) levels.push({g: 'S', rank: 3, perf: S, imp: 2 * 0.5, u: 0.5});
    if (mi.T === 3) levels.push({g: 'B', rank: 2, perf: 3 * S, imp: 2 * S, u: S});
    if (mi.M === 3) levels.push({g: 'L', rank: 1, perf: 3 * B, imp: 2 * B, u: B});
    if (mi.X === 3) levels.push({g: 'Mx', rank: 0, perf: 3 * L, imp: 2 * L, u: L});
    for (const lv of levels) {
      const it = z.items;
      const cand = x => !x.rigid && !x.sh.rest && x.sh.g === lv.g && !x.sh.dot && !x.sh.altd;
      const lower = x => x.rank > lv.rank;
      let prev = null, run = [];
      const settle = (next, div) => {
        if (!run.length) return;
        const r = run.reduce((a, x) => a + x.val, 0), m = r / lv.u;
        if (Math.abs(m - Math.round(m)) < 1e-6) {
          const k = Math.round(m) % 3;
          if (k === 1) {
            /* the usual reading: the note before is imperfected (a parte post); the other choice: the note after (a parte ante) */
            const first = apa ? next : prev, second = apa ? prev : next;
            if (first && !first.done) { first.val = lv.imp; first.done = true; }
            else if (second && !second.done) { second.val = lv.imp; second.done = true; }
          } else if (k === 2) {
            const last = run[run.length - 1];
            if (imp2 && prev && next && !prev.done && !next.done) { prev.val = lv.imp; prev.done = true; next.val = lv.imp; next.done = true; }
            else if ((next || (div && (!prev || prev.done))) && !last.rigid && !last.sh.rest && !last.sh.dot && Math.abs(last.val - lv.u) < 1e-6) { last.val = 2 * lv.u; last.altd = true; }
          }
        }
        run = [];
      };
      for (const x of it) {
        /* a dot on a perfect note keeps it perfect; a punctus divisionis also divides the perfection after it */
        if (cand(x)) { x.val = lv.perf; x.done = !!(x.sh.dd || x.sh.pa); settle(x, false); prev = x.sh.dd ? null : x; }
        else if (lower(x) && !x.rigid) {
          run.push(x);
          if (x.sh.dd && x.rank === lv.rank + 1) { settle(null, true); prev = null; }
        }
        else { settle(null, false); prev = null; }
      }
      settle(null, false);
    }
  }
  /* 4. written back; tied parts leave */
  const out = [];
  for (const z of zones) for (const it of z.items) {
    const e = it.e;
    if (!it.rigid) { e.d = rt(it.val / it.mi.p); e.altd = !!it.altd; }
    else e.d = it.d;
    e.kd = e.d;
    delete e._sh; delete e._shmi;
    if (it.parts.length > 1) { e.tieStart = e.tieEnd = e.tieMid = false; for (const j of it.parts.slice(1)) e.ferm = e.ferm || ev[j].ferm; }
    out.push(it);
  }
  const keep = [];
  for (const it of out) { for (const j of it.parts) map[j] = keep.length; keep.push(it.e); }
  map[n] = keep.length;
  const marks = [...v.mets, ...v.keys, ...v.clefs];
  for (const m of marks) m.ei = m.ei >= 0 && m.ei < map.length ? map[m.ei] : m.ei;
  v.events = keep;
  return map;
}
/* the shapes of a voice, kept on its events for the moment before a sign changes (they are what the notes were written as) */
function stashShapes(v){
  for (const it of logicalNotes(v)) { const mi = mensInfo(metAt(v, it.e.t)); it.e._sh = shapeOfEvent(Object.assign({}, it.e, {d: it.d}), mi); }
}
/* Checks (games/scriptorium/tests/mensural.html). mensTest: the rules on a small score; each note's written length
   (a semibrevis = 1). mensCheck: a piece against its signs and the rules: voices of equal length, barlines on the
   perfections of the sign, and every note the rules would count otherwise than the file does. */
function mensTest(text, opt){
  const keep = piece;
  try {
    const P = parseKern(text); P.meta.MENS = 'rules'; if (opt) P.meta.MENSOPT = opt; piece = P;
    return P.voices.map(v => { mensurate(v); retime(v); return v.events.map(e => rt(e.d * mensInfo(metAt(v, e.t)).p)); });
  } finally { piece = keep; }
}
function mensCheck(text, opt){
  const keep = piece;
  try {
    const P = parseKern(text); piece = P;
    const ends = P.voices.map(v => rt(v.end));
    const out = {title: P.title, voices: P.voices.length, ends, equalEnds: ends.every(x => Math.abs(x - ends[0]) < 1e-6),
      signs: [...new Set(P.voices.flatMap(v => v.mets.map(m => m.sign)))], bars: P.bars.length, barsOffGrid: 0, notes: 0, rulesDiffer: 0, examples: []};
    const v0 = P.voices[0];
    for (const b of P.bars) {
      let m = null; for (const x of v0.mets) if (x.t <= b.t + EPS) m = x;
      if (!m) continue;
      const mi = mensInfo(m.sign), len = mi.T * (mi.P === 3 ? 1.5 : 1) / mi.p, k = (b.t - m.t) / len;
      if (Math.abs(k - Math.round(k)) > 1e-6) out.barsOffGrid++;
    }
    const Q = parseKern(text); piece = Q; Q.meta.MENS = 'rules'; if (opt) Q.meta.MENSOPT = opt; else delete Q.meta.MENSOPT;
    Q.voices.forEach(v => {
      const before = logicalNotes(v).map(it => ({t: it.e.t, d: it.d}));
      mensurate(v); retime(v);
      out.notes += before.length;
      before.forEach((b, i) => {
        const a = v.events[i];
        if (!a || Math.abs(a.d - b.d) > 1e-6) { out.rulesDiffer++; if (out.examples.length < 4) out.examples.push((v.name || 'voice') + ' at ' + rt(b.t) + ': file ' + rt(b.d) + ', rules ' + (a ? rt(a.d) : '?')); }
      });
    });
    return out;
  } finally { piece = keep; }
}
function mensurateAll(){
  if (!mensRulesOn()) return null;
  return piece.voices.map(v => { const m = mensurate(v); retime(v); return m; });
}

/* Turn a voice's events into drawable symbols for the chosen notation */
function notate(piece, v, mode){
  const ev = v.events;
  const out = [];
  /* real mensural: no ties, tied notes become one value */
  const evs = [];
  if (mode === 'real') {
    for (let i = 0; i < ev.length; i++) {
      const e = Object.assign({}, ev[i]);
      const i0 = i;
      if (!e.rest && e.tieStart && !e.tieEnd) {
        let j = i + 1;
        while (j < ev.length && !ev[j].rest && ev[j].step === e.step) {
          e.d = rt(e.d + ev[j].d); e.ferm = e.ferm || ev[j].ferm; e.signum = e.signum || ev[j].signum; e.long = e.long || ev[j].long;
          if (ev[j].tieEnd && !ev[j].tieStart) { j++; break; }
          j++;
        }
        i = j - 1;
        e.tieStart = e.tieEnd = false;
      }
      e.src = []; for (let q = i0; q <= i; q++) e.src.push(q);
      evs.push(e);
    }
  } else ev.forEach((e, i) => evs.push(Object.assign({}, e, {src: [i]})));
  /* real mensural: rests that follow each other are one rest (two breve rests are a long rest, two spaces),
     except across a change of sign, a new section or a double bar */
  if (mode === 'real') {
    for (let i = evs.length - 1; i > 0; i--) {
      const a = evs[i - 1], b = evs[i];
      if (!a.rest || !b.rest || a.ferm || !eq(a.t + a.d, b.t)) continue;
      if (v.mets.some(m => m.t > a.t + EPS && m.t <= b.t + EPS)) continue;
      if (piece.sections.some(sec => eq(sec.t, b.t)) || piece.bars.some(br => (br.type === 'double' || br.type === 'sec') && eq(br.t, b.t))) continue;
      a.d = rt(a.d + b.d); a.src = a.src.concat(b.src); a.ferm = b.ferm;
      evs.splice(i, 1);
    }
  }
  /* segments by mensuration, for the perfection grid */
  let segStart = 0, curSign = undefined;
  let inTup = false;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    const sign = metAt(v, e.t);
    let mens = null;
    if (sign !== curSign) {
      const changed = v.mets.find(m => eq(m.t, e.t) || (m.t > (i ? evs[i - 1].t : -1) + EPS && m.t <= e.t + EPS));
      if (changed && changed.sign) mens = changed.sign;
      /* Modern notation prints the sign's modern equivalent, when it has one, as a time signature */
      if (mode === 'fake' && changed && changed.mod && /^[^/]{1,4}\/[^/]{1,4}$/.test(changed.mod)) mens = 'M:' + changed.mod;
      curSign = sign; segStart = e.t;
    }
    const mi = mensInfo(sign);
    const base = {t: e.t, d: e.d, rest: !!e.rest, step: e.step, alt: e.alt, ed: e.ed, chord: !e.rest && e.chord && e.chord.length ? e.chord.map(c => ({step: c.step, alt: c.alt, ed: c.ed, look: c.look})) : null, look: e.rest ? null : e.look || null, syl: e.syl, ferm: e.ferm, signum: !!e.signum, stemDirOvr: e.stemDirOvr || '', stemSideOvr: e.stemSideOvr || '', mens, sign, src: e.src, lig: e.rest ? 0 : (e.lig || 0)};
    if (e.tupS) inTup = true;
    if (mode === 'fake') {
      const wd = rt(e.d * mi.p);
      const sh = e.long && !e.rest ? {g: eq(wd, 2) ? 'B' : 'L'} : shapeFake(wd);
      if (sh) {
        out.push(Object.assign(base, {g: sh.g, dot: !!sh.dot, tieNext: !e.rest && (e.tieStart || e.tieMid), tup: sh.tup ? 1 : 0, tupBase: sh.tup ? wd * 1.5 / (sh.dot ? 1.5 : 1) : 0}));
      } else pushSplit(out, base, wd, 2, 2, !e.rest && (e.tieStart || e.tieMid), mi.p);
      if (e.tupE) inTup = false;
      continue;
    }
    if (e.tupE) inTup = false;
    const w = rt(e.d * mi.p);
    if (e.long && !e.rest) { out.push(Object.assign(base, {g:'L'})); continue; }
    if (e.rest) {
      /* rests: never coloured or dotted; a breve rest fills a perfect or imperfect breve */
      let r = w, t = e.t, first = true;
      const tab = valueTable(mi.T, mi.P, mi.M, mi.X);
      let guard = 0;
      while (r > 0.01 && guard++ < 30) {
        /* breve and long rests stand on the breve grid (a rest is never imperfect: two semibreves of rest in O are two semibreve rests) */
        const Bv = tab[2][1], posB = ((rt(t - segStart) * mi.p) % Bv + Bv) % Bv;
        const room = eq(posB, 0) || eq(posB, Bv) ? r : Math.min(r, Bv - posB);
        let pick = tab.find(([g, val]) => val <= room + EPS && (g !== 'Mx' || eq(posB, 0) && room >= val - EPS));
        /* a rest inside a coloured group counts two thirds of its value */
        const cp = tab.find(([g, val]) => eq(r * 1.5, val));
        if (cp && !tab.some(([g, val]) => eq(r, val))) pick = [cp[0], r];
        if (!pick) pick = tab[tab.length - 1];
        out.push(Object.assign({}, base, {t, d: pick[1] / mi.p, g: pick[0], mens: first ? mens : null, syl: first ? base.syl : []}));
        r = rt(r - pick[1]); t = rt(t + pick[1] / mi.p); first = false;
      }
      continue;
    }
    const sh = (e.altd && shapeAlt(w, mi.T, mi.P, mi.M, mi.X)) || (e.colH && shapeCol(w, mi.T, mi.P, mi.M, mi.X)) || shapeReal(w, mi.T, mi.P, mi.M, mi.X);
    if (!sh) { pushSplit(out, base, w, mi.T, mi.P, false, mi.p); continue; }
    const pos = rt(((rt(e.t - segStart) * mi.p) % (mi.T * (mi.P === 3 ? 1.5 : 1))));
    out.push(Object.assign(base, {g: sh.g, dot: !!sh.dot || (!!(e.dd || e.pa) && !e.rest), dd: !!e.dd, pa: !!e.pa, col: !!sh.col, imp: !!sh.imp, w, pos}));
  }
  /* each rest drawn is an object of its own: it belongs to the events that lie under it (three rests in a row are drawn as three,
     or as a long and a breve, and each can be selected, resized or deleted alone) */
  for (const q of out) {
    if (!q.rest || !q.src || !q.src.length) continue;
    const own = q.src.filter(k => ev[k] && ev[k].t < q.t + q.d - EPS && ev[k].t + ev[k].d > q.t + EPS);
    if (own.length) q.src = own;
  }
  /* fake mensural: number the triplets once per group of three units */
  if (mode === 'fake') {
    for (let i = 0; i < out.length; i++) {
      if (!out[i].tup) continue;
      const unit = out[i].tupBase, mi = mensInfo(out[i].sign);
      let sum = 0, j = i;
      while (j < out.length && out[j].tup && sum < 3 * unit - EPS) { sum += out[j].d * mi.p * 1.5; j++; }
      out[i].tup = 'start'; out[i].tupTo = j - 1;
      for (let k = i + 1; k < j; k++) out[k].tup = 'in';
      i = j - 1;
    }
  }
  /* coloration in perfect tempus: imperfect breves that cut across the perfection grid are black, with their neighbours;
     and in sesquialtera coloration, a 1/2 note immediately before a coloured semiminima (1/6) is a dotted coloured minima (Mc.) */
  if (mode === 'real') {
    for (let i = 0; i < out.length; i++) {
      const s = out[i];
      if (!s.rest && !s.col && !s.dot && s.g === 'M' && eq(s.w, 0.5)) {
        const nx = out[i + 1];
        if (nx && !nx.rest && nx.col && nx.g === 'Sm') { s.col = true; s.dot = true; }
      }
      if (!s.imp) continue;
      const mi = mensInfo(s.sign), B = mi.T * (mi.P === 3 ? 1.5 : 1);
      if (s.pos + s.w > B + EPS) {
        /* a lone syncopated breve stays white; a run of them (hemiola) is blackened */
        let a = i, b = i;
        while (a > 0 && out[a - 1].imp && !out[a - 1].rest) a--;
        while (b + 1 < out.length && out[b + 1].imp && !out[b + 1].rest) b++;
        /* a hemiola: the run starts on a perfection and fills a whole number of pairs of them */
        let sum = 0; for (let j = a; j <= b; j++) sum += out[j].w;
        const rem = sum % (2 * B);
        if (b > a && eq(out[a].pos, 0) && (eq(rem, 0) || eq(rem, 2 * B))) for (let j = a; j <= b; j++) out[j].col = true;
      }
    }
  }
  return out;
}
function pushSplit(out, base, w, T, P, tieLast, p = 1){
  const parts = decompose(w, T, P);
  let t = base.t;
  parts.forEach(([g, v], k) => {
    out.push(Object.assign({}, base, {t, d: v / p, g, tieNext: !base.rest && (k < parts.length - 1 || tieLast), syl: k ? [] : base.syl, mens: k ? null : base.mens}));
    t = rt(t + v / p);
  });
}

/* clef for a voice: as encoded, or a mensural C/F clef that keeps the range on the staff */
function chooseClef(v, mode){
  if (mode === 'modern') return KERN_CLEF[v.kclef] || 'treble';
  /* the original clef, when the file gives one (*oclef, from CMME) */
  if (v.oclef && CLEFS[KERN_CLEF[v.oclef]]) return KERN_CLEF[v.oclef];
  /* tied continuations don't count, so a clef doesn't change because an edit split notes at the barlines */
  const steps = v.events.filter(e => !e.rest && !e.tieEnd && !e.tieMid).map(e => e.step);
  if (!steps.length) return 'c3';
  let best = null, bestCost = Infinity;
  MENS_CLEFS.forEach((k, i) => {
    const b = CLEFS[k].bottom;
    let cost = 0;
    for (const s of steps) { const p = s - b; if (p < -1) cost += Math.ceil((-1 - p) / 2); else if (p > 9) cost += Math.ceil((p - 9) / 2); }
    cost += i * 0.01 * steps.length * 0 + (k === 'treble' ? 0.02 * steps.length : 0);
    if (cost < bestCost - 1e-9) { bestCost = cost; best = k; }
  });
  return best;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
let DOCK = null;     /* where the site page says the browser window is, when embedded: {top, vh, pageTop} */
const KEY = APP.store + ':v1';
const st = {
  inc: {}, thick: 0, thickL: 0, eq: 'off', piece: FIRST, view: 'score', nota: 'real', clefs: 'mens', bars: 'full', staff: 'red', noteCol: 'black', colLock: 'off', dashes: 'on', ed: 'on', heads: 'modern', stems: 'adaptive', accStyle: 'modern', origText: 'off', ann: 'on',
  size: 1.75, noteSize: 1.75, sizeLock: 'on', lyrFont: 'fell', lyrPt: 8.5, printPaper: 'A4', bounds: {}, staves: {},
  hs: 0.6, vs: 1, tempo: 60, unit: 'S', beatHand: true, beatPend: false, beatTick: false, handOp: 0.3, handSize: 1, vol: 70, loop: false, verse: 0, paper: 'A4', orient: 'portrait', flow: 'vertical', paperCol: 'parchment', vis: {}, lines: '5', dark: 'off', lig: 'on', mens: 'on', webScroll: 'vertical', zoom: 1, bnum: 'off', bunit: 'bar', bpos: 'top',
  ...(APP.defaults || {})
};
const HAD_SAVED = !!localStorage.getItem(KEY);
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
if (!st.tempoV2) { if (st.tempo === 90 || st.tempo === undefined) st.tempo = 60; if (!st.unit) st.unit = 'S'; st.tempoV2 = 1; }
if (st.bnum === '2' || st.bnum === '4') st.bnum = '5';
if (!st.bounds || typeof st.bounds !== 'object') st.bounds = {};
delete st.ctlMode;   /* the old Controls setting (On movement | At the edges) is gone: the controls always wake on movement */
/* the spacing sliders now cover only their tight end */
/* every piece opens with the same look: staff size and spacing */
const LOOK = {size: 1.5, hs: 0.47, vs: 0.6, ss: 0.8};
function resetLook(){ Object.assign(st, LOOK); st.noteSize = st.size; st.sizeLock = 'on'; save(); for (const k of ['size', 'noteSize', 'hs', 'vs', 'ss']) { const el = document.getElementById(k); if (el) el.value = st[k]; } }
for (const [k, v] of Object.entries(LOOK)) if (typeof st[k] !== 'number' || !isFinite(st[k])) st[k] = v;
if (typeof st.noteSize !== 'number' || !isFinite(st.noteSize) || st.sizeLock !== 'off') st.noteSize = st.size;
if (st.sizeLock !== 'off') st.sizeLock = 'on';
if (!st.noteCol) st.noteCol = 'black';
if (st.colLock !== 'on' && st.colLock !== 'off') st.colLock = st.staff === st.noteCol ? 'on' : 'off';
if (!st.lyrFont) st.lyrFont = 'fell';
if (!st.stems) st.stems = 'adaptive';
if (st.accStyle !== 'old') st.accStyle = 'modern';
if (typeof st.lyrPt !== 'number' || !isFinite(st.lyrPt)) st.lyrPt = typeof st.lyrSize === 'number' && isFinite(st.lyrSize) ? Math.round(st.lyrSize * 5 * 2) / 2 : 8.5;
if (!st.printPaper || st.printPaper === 'web') st.printPaper = st.paper && st.paper !== 'web' ? st.paper : 'A4';
st.hs = Math.max(-2, Math.min(10, st.hs)); st.vs = Math.max(0, Math.min(10, st.vs)); st.ss = Math.max(0, Math.min(10, st.ss));
if (st.bars === 'mstrich') st.bars = 'full';
/* barlines now stand in each staff only; everyone starts again from those */
if (st.barsV !== 2) { st.bars = 'full'; st.barsV = 2; }
/* presets (shared by the apps through the browser): the two built-in ones and the ones Samuel saves; one of them opens every score */
const PRESET_KEYS = ['thick', 'thickL', 'eq', 'nota', 'heads', 'stems', 'accStyle', 'clefs', 'bars', 'bnum', 'bunit', 'bpos', 'staff', 'noteCol', 'colLock', 'lines', 'paperCol', 'size', 'noteSize', 'sizeLock', 'lyrFont', 'lyrPt', 'hs', 'vs', 'ss', 'dashes', 'ed', 'lig', 'view', 'paper', 'printPaper', 'orient', 'flow'];
const MENS1 = {eq: 'off', nota: 'real', stems: 'adaptive', accStyle: 'modern', clefs: 'modern', bars: 'none', bnum: 'off', bunit: 'bar', bpos: 'top', staff: 'black', noteCol: 'black', colLock: 'on', lines: '5', paperCol: 'white', size: 1.5, noteSize: 1.5, sizeLock: 'on', lyrFont: 'fell', lyrPt: 8.5, hs: 0.47, vs: 0.6, ss: 0.8, dashes: 'on', ed: 'on', lig: 'on', view: 'score', paper: 'A4', printPaper: 'A4', orient: 'portrait', flow: 'vertical'};
const MENS2 = {...MENS1, clefs: 'mens', size: 1.65, noteSize: 1.65, dashes: 'off'};
const CF1 = {eq: 'off', nota: 'real', stems: 'adaptive', accStyle: 'modern', clefs: 'modern', bars: 'none', bnum: 'off', bunit: 'bar', bpos: 'top', staff: 'red', noteCol: 'black', colLock: 'off', lines: '5', paperCol: 'parchment', size: 3.6, noteSize: 3.6, sizeLock: 'on', lyrFont: 'fell', lyrPt: 8.5, hs: 0.47, vs: 0.6, ss: 0.85, dashes: 'on', ed: 'on', lig: 'on', view: 'score', paper: 'web', printPaper: 'A4'};
const CF2 = {...CF1, clefs: 'mens', dashes: 'off'};
const IS_CF = APP.id === 'cantus-firmus';
const IS_REDIX = APP.id === 'redix-melodia' || APP.id === 'redix-contrapunctus';
const BUILTIN = IS_CF ? [{name: 'Preset 1', s: CF1, fixed: true}, {name: 'Preset 2', s: CF2, fixed: true}] : [{name: 'Preset 1', s: MENS1, fixed: true}, {name: 'Preset 2', s: MENS2, fixed: true}];
const PKEY = IS_CF ? 'scriptorium:presets:cf' : IS_REDIX ? 'scriptorium:presets:redix' : 'scriptorium:presets';
function presetStore(){ let o = {}; try { o = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) {} return {custom: Array.isArray(o.custom) ? o.custom : [], active: o.active === undefined || o.active === 'Mensural 1' ? 'Preset 1' : o.active === 'Mensural 2' ? 'Preset 2' : o.active}; }
function presetPut(o){ try { localStorage.setItem(PKEY, JSON.stringify(o)); } catch (e) {} }
const presetAll = () => [...BUILTIN, ...presetStore().custom];
function presetApply(pr){ for (const k of PRESET_KEYS) if (pr.s[k] !== undefined) st[k] = pr.s[k]; if (pr.s.noteSize === undefined || st.sizeLock !== 'off') st.noteSize = st.size; if (pr.s.noteCol === undefined) st.noteCol = 'black'; if (pr.s.colLock === undefined) st.colLock = st.staff === st.noteCol ? 'on' : 'off'; }
{ const P = presetAll().find(q => q.name === presetStore().active); if (P) { presetApply(P); st.barsV = 2; } if (IS_CF) { st.view = 'score'; st.paper = 'web'; } if (IS_REDIX) { st.paperCol = 'white'; st.staff = 'black'; st.noteCol = 'black'; st.colLock = 'on'; st.clefs = 'modern'; if (APP.id === 'redix-melodia') { st.view = 'score'; st.paper = 'web'; } } }
/* changing an engraving setting unticks the ticked preset: the settings are now "current settings" of their own */
const LOOK_KEYS = ['thick', 'thickL', 'eq', 'nota', 'heads', 'stems', 'accStyle', 'clefs', 'bars', 'bnum', 'bunit', 'bpos', 'staff', 'noteCol', 'colLock', 'lines', 'paperCol', 'size', 'noteSize', 'sizeLock', 'lyrFont', 'lyrPt', 'hs', 'vs', 'ss', 'dashes', 'ed', 'lig'];
function presetDrift(){
  const S = presetStore(); if (!S.active) return;
  const P = presetAll().find(q => q.name === S.active);
  if (P && LOOK_KEYS.every(k => P.s[k] === undefined || P.s[k] === st[k])) return;
  S.active = ''; presetPut(S); if (typeof presetList === 'function' && document.getElementById('presetList')) presetList();
}
/* Undo and redo cover the look of the score as well as the notes: engraving settings, staff size, spacing, paper, which voices show,
   the incipit. Each change is one step in the same history as the music (a slider drag, which sends many changes, is one step). */
const STYLE_KEYS = [...PRESET_KEYS, 'verse', 'barsV', 'mens'];
function styleObj(){
  let pk = null, pc = null; try { pk = pieceKey; pc = piece; } catch (e) {}
  const o = {_k: pk}; for (const k of STYLE_KEYS) o[k] = st[k];
  o.inc = JSON.parse(JSON.stringify(st.inc || {}));
  o.staves = JSON.parse(JSON.stringify((st.staves && pk && st.staves[pk]) || null));
  o.black = !!(pk && st.black && st.black[pk]);
  if (pc) o.vis = pc.voices.map(v => { const q = vis(v.idx); return [q.on, q.notes, q.lyr, q.play]; });
  return o;
}
let styleLast = JSON.stringify(styleObj()), styleAt = 0, styleBusy = false;
function styleNote(){
  let E; try { E = ed; } catch (e) { return; }
  const cur = JSON.stringify(styleObj());
  if (cur === styleLast) return;
  const prev = styleLast; styleLast = cur;
  if (styleBusy || !E || !E.undo) return;
  if (JSON.parse(prev)._k !== JSON.parse(cur)._k) return;
  const now = performance.now(), top = E.undo[E.undo.length - 1];
  if (!(top && typeof top === 'object' && now - styleAt < 900)) E.undo.push({style: JSON.parse(prev)});
  styleAt = now; E.redo = [];
  try { syncEdit(); } catch (e) {}
}
function styleApply(snap){
  styleBusy = true;
  for (const k of STYLE_KEYS) if (snap[k] !== undefined) st[k] = snap[k];
  st.inc = snap.inc || {};
  if (snap.staves !== undefined && snap._k) { if (!st.staves || typeof st.staves !== 'object') st.staves = {}; if (snap.staves) st.staves[snap._k] = snap.staves; else delete st.staves[snap._k]; }
  if (snap.black !== undefined && snap._k) { if (!st.black || typeof st.black !== 'object') st.black = {}; if (snap.black) st.black[snap._k] = 1; else delete st.black[snap._k]; }
  if (snap.vis && piece) snap.vis.forEach((a, i) => { const v = piece.voices[i]; if (!v) return; const q = vis(v.idx); [q.on, q.notes, q.lyr, q.play] = a; });
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  syncUI(); render();
  styleLast = JSON.stringify(styleObj()); styleBusy = false;
}
const save = () => { presetDrift(); styleNote(); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} if (window.Organ) Organ.saveShared(); };
/* playback, metronome and sound: shared/organ.js, the same engine as the CantusFirmus app's */
const UNIT_NAMES = {Mx: 'Maxima', L: 'Longa', B: 'Brevis', S: 'Semibrevis', M: 'Minima', Sm: 'Semiminima', F: 'Fusa', Sf: 'Semifusa'};
let play = false;
Organ.init(st, {
  save: () => save(), replay: () => restartPlay(), toast: m => toast(m), playing: on => { play = on; setPlayIcon(on); document.documentElement.classList.toggle('playing', on); },
  units: ['Mx', 'L', 'B', 'S', 'M', 'Sm', 'F'], unitIcon: k => glyphIcon(k, 0.25), unitName: k => UNIT_NAMES[k],
  regChanged: () => { if (typeof mixSync === 'function') mixSync(); }
});
if (st.audition === undefined) st.audition = true;
let toastTimer = 0;
function toast(msg, act){
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on'); t.classList.toggle('act', !!act);
  if (act) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'toastact'; b.textContent = act.label;
    b.addEventListener('click', () => { t.classList.remove('on', 'act'); act.fn(); });
    t.appendChild(b);
  }
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on', 'act'), act ? 6000 : 2600);
}

let piece = null;           /* parsed piece */
let handTop = -1;           /* where the hand stands beside the music, px */
let pieceKey = null;
/* black notation (Samuel 2026-11-14): a switch per piece, kept in st.black by piece key; in mensural notation the notes are
   filled, the semiminima gets a flag (the fusa two) and coloured notes are red */
if (!st.black || typeof st.black !== 'object') st.black = {};
const BLACK_G = {Mx: 'Mxc', L: 'Lc', B: 'Bc', S: 'Sc', M: 'Mc', Sm: 'F', F: 'F2', Sf: 'F3'};
let BLACK = false;
const isBlack = () => st.nota === 'real' && !!(st.black && st.black[pieceKey]);
/* the Notation choice: White and Modern for every piece, Black for this piece only */
const notaNow = () => st.nota === 'fake' ? 'fake' : isBlack() ? 'black' : 'real';
function blackSync(){
  const el = document.getElementById('notaSeg'); if (!el) return;
  const v = notaNow(); el.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  const h = document.getElementById('headSeg'); if (h) h.classList.toggle('dim', st.nota !== 'fake');
}
/* modern note heads (Samuel 2026-11-14), in modern notation */
const MOD_G = {Mx: 'nL', L: 'nL', B: 'nB', S: 'nS', M: 'nM', Sm: 'nQ', F: 'nE', Sf: 'nX'};
let MODERN = false;
const cache = {};

/* per-voice switches: in the layout, notes, lyrics, playback (heard even when not shown) */
/* Playback of a voice has three states: on (heard, and the cursor follows), muted (silent, the cursor still follows) and left out (no sound, no cursor) */
const playState = o => o.play === 'mute' ? 'mute' : o.play === false ? 'off' : 'on';
const PLAY_ICON = {
  on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4v13l-5-4H3Z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M18.2 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4v13l-5-4H3Z"/><path class="w" d="m16 9.5 5 5m0-5-5 5"/></svg>',
  off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="w" d="M5 12h14"/></svg>'
};
const PLAY_TIP = {on: 'Heard, and the cursor follows it. Press to mute it', mute: 'Muted: no sound, the cursor still follows it. Press to leave it out altogether', off: 'Left out: no sound and no cursor. Press to play it again'};
function playCell(i, name){
  const t = playState(vis(i));
  return `<td><button type="button" class="ptri" data-i="${i}" data-s="${t}" aria-label="${esc(name)}: playback. ${PLAY_TIP[t]}" title="${PLAY_TIP[t]}">${PLAY_ICON[t]}</button></td>`;
}
function vis(i){
  if (piece && piece.voices && piece.voices[i] && piece.voices[i].subOf >= 0) i = piece.voices[i].subOf;
  const all = st.vis[pieceKey] || (st.vis[pieceKey] = {});
  const o = all[i] || (all[i] = {on: true, notes: true, lyr: true});
  if (o.play === undefined) o.play = true;
  return o;
}

/* ------------------------------------------------------------------ */
/* Text measuring                                                      */
/* ------------------------------------------------------------------ */
const LYR_FONTS = [
  ['fell', 'IM Fell English', '"IM Fell English", Georgia, serif'],
  ['garamond', 'Garamond', '"EB Garamond", Garamond, "Adobe Garamond Pro", Georgia, serif'],
  ['palatino', 'Palatino', '"Palatino Linotype", Palatino, "Book Antiqua", serif'],
  ['baskerville', 'Baskerville', 'Baskerville, "Libre Baskerville", Georgia, serif'],
  ['georgia', 'Georgia', 'Georgia, "Times New Roman", serif'],
  ['times', 'Times', '"Times New Roman", Times, serif'],
  ['sans', 'Sans-serif', 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif']
];
const lyrFontCss = () => (LYR_FONTS.find(x => x[0] === st.lyrFont) || LYR_FONTS[0])[2];
const lyrSize = () => Math.max(0.5, Math.min(6, (+st.lyrPt || 8.5) / 5));
const staffLinesN = () => Math.max(1, Math.min(15, parseInt(st.lines, 10) || 5));
const staffTopOff = () => { const n = staffLinesN(); return n === 1 ? 3 : 5 - n; };
const staffBotOff = () => staffLinesN() === 1 ? 5 : 4;
const noteScale = () => (st.sizeLock === 'off' && +st.noteSize > 0 && +st.size > 0) ? Math.max(0.3, Math.min(3, +st.noteSize / +st.size)) : 1;
const mctx = document.createElement('canvas').getContext('2d');
function textW(s, size, italic, fontCss){
  mctx.font = `${italic ? 'italic ' : ''}100px ${fontCss || '"IM Fell English", Georgia, serif'}`;
  return mctx.measureText(s).width / 100 * size;
}

/* ------------------------------------------------------------------ */
/* Preparing voices for layout                                         */
/* ------------------------------------------------------------------ */
const LYR = 1.7;   /* lyric size, staff spaces */
const decoder = document.createElement('textarea');
const parentOf = vi => (piece && piece.voices[vi] && piece.voices[vi].subOf >= 0) ? piece.voices[vi].subOf : vi;
const subVoiceOf = pvi => (piece && piece.voices.find(v => v.subOf === pvi)) || null;
const isLayer2Voice = vi => !!(piece && piece.voices[vi] && piece.voices[vi].subOf >= 0);
function subActiveAt(v2, t){
  if (!v2 || !v2.events) return false;
  let a = 0, b = piece ? piece.end + 1 : 1e9;
  if (piece && piece.bars && piece.bars.length) {
    for (const br of piece.bars) {
      if (br.t <= t + EPS) a = Math.max(a, br.t);
      else { b = Math.min(b, br.t); break; }
    }
  } else { a = Math.max(0, t - 2); b = t + 2; }
  return v2.events.some(e => !e.rest && e.t < b - EPS && e.t + e.d > a + EPS);
}
function staffCfg(){
  if (!st.staves || typeof st.staves !== 'object' || !pieceKey) return null;
  const c = st.staves[pieceKey];
  return c && c.map && typeof c.map === 'object' ? c : null;
}
function staffGroups(vlist){
  const cfg = st.view === 'score' ? staffCfg() : null;
  const hasSub = vlist.some(v => v.subOf >= 0);
  if ((!cfg && !hasSub) || vlist.length < 2) return vlist.map(v => ({id: v.idx, voices: [v]}));
  const byId = new Map(), order = [];
  for (const v of vlist) {
    const pIdx = v.subOf >= 0 ? v.subOf : v.idx;
    const id = cfg && cfg.map[pIdx] !== undefined ? +cfg.map[pIdx] : pIdx;
    if (!byId.has(id)) { const g = {id, voices: []}; byId.set(id, g); order.push(g); }
    byId.get(id).voices.push(v);
  }
  return order;
}
function chooseGroupClef(voices, staffId){
  const cfg = staffCfg();
  if (cfg && cfg.clefs && cfg.clefs[staffId] && CLEFS[cfg.clefs[staffId]]) return cfg.clefs[staffId];
  const steps = [];
  for (const v of voices) for (const e of v.events) if (!e.rest && !e.tieEnd && !e.tieMid) {
    steps.push(e.step);
    if (e.chord) for (const c of e.chord) steps.push(c.step);
  }
  if (!steps.length) return chooseClef(voices[0], st.clefs);
  const cands = st.clefs === 'modern' ? ['bass', 'treble8', 'treble'] : MENS_CLEFS;
  let best = cands[0], bestCost = Infinity;
  for (const k of cands) {
    const b = CLEFS[k].bottom;
    let cost = 0;
    for (const s of steps) {
      const p = s - b;
      if (p < -1) cost += Math.ceil((-1 - p) / 2) * 10;
      else if (p > 9) cost += Math.ceil((p - 9) / 2) * 10;
      cost += Math.abs(p - 4) * 0.25;
    }
    if (cost < bestCost - 1e-9) { bestCost = cost; best = k; }
  }
  return best;
}
function prepare(){
  const mode = st.nota, ls = lyrSize(), lf = lyrFontCss(), ns = noteScale();
  BLACK = isBlack(); MODERN = st.nota === 'fake' && st.heads !== 'old'; blackSync();
  try { iconsSync(); } catch (e) {}   /* the note value icons in the notation in use (defined with the edit tools, later) */
  piece.voices.forEach((v, i) => { v.idx = i; });
  const sharedMeta = new Map();
  for (const grp of staffGroups(piece.voices.filter(v => vis(v.idx).on))) {
    if (grp.voices.length > 1) {
      const primaries = grp.voices.filter(v => !(v.subOf >= 0));
      const onlyDivisi = primaries.length === 1;
      const clef = onlyDivisi
        ? ((vis(primaries[0].idx).clef && CLEFS[vis(primaries[0].idx).clef]) ? vis(primaries[0].idx).clef : chooseClef(primaries[0], st.clefs))
        : chooseGroupClef(grp.voices, grp.id);
      grp.voices.forEach((v, gi) => {
        const isSub = v.subOf >= 0;
        const subV = !isSub ? grp.voices.find(q => q.subOf === v.idx) : null;
        const dir = isSub ? -1 : onlyDivisi ? 0 : (gi === 0 ? 1 : gi === grp.voices.length - 1 ? -1 : 0);
        sharedMeta.set(v.idx, {clef, dir, subV, isSub, onlyDivisi});
      });
    }
  }
  piece.voices.forEach((v, i) => {
    v.idx = i;
    const sm = sharedMeta.get(i);
    v.clef = sm ? sm.clef : (vis(i).clef && CLEFS[vis(i).clef]) ? vis(i).clef : chooseClef(v, st.clefs);
    v.sharedStaff = !!(sm && !sm.onlyDivisi);
    const syms = notate(piece, v, mode);
    /* a voice with no notes yet still shows its staff, clef and sign, and a place where the first note will stand */
    if (!syms.length) { const m0 = v.mets.find(q => q.t < EPS); syms.push({t: 0, d: 2, rest: true, phantom: true, g: 'B', alt: null, syl: [], src: [], lig: 0, mens: m0 ? m0.sign : null, sign: m0 ? m0.sign : null}); }
    const ext = ensureExt(piece);
    for (const s of syms) {
      const ek = i + ':' + rt(s.t);
      s.restOvr = s.rest && ext.rests[ek] ? ext.rests[ek] : null;
      s.origText = ext.origText[ek] || '';
      s.ligKind = ext.ligKind[ek] || '';
      s.stemDir = sm ? (sm.onlyDivisi && sm.subV ? (subActiveAt(sm.subV, s.t) ? 1 : 0) : sm.dir) : 0;
      s.clef = sm ? sm.clef : clefAt(v, s.t);
      s.pos = s.rest ? null : s.step - CLEFS[s.clef].bottom;
      const g = s.rest ? SHAPE_REST[s.g] : BLACK ? BLACK_G[s.g] || s.g + 'c' : MODERN ? MOD_G[s.g] || s.g : s.g + (s.col ? 'c' : '');
      s.glyph = g; s.red = BLACK && !s.rest && !!s.col;
      s.glyphAuto = s.glyph; s.redAuto = s.red;
      if (s.look && !s.rest) { const lk = lookGlyph(s, s.look); s.glyph = lk.g; s.red = lk.red; }
      s.hw = s.phantom ? 1.2 : s.rest ? (s.g === 'Mx' ? 1.2 : s.g === 'Sm' || s.g === 'F' || s.g === 'Sf' ? gw(g) : 0.42) : gw(g);
      const nsExtra = ns > 1 ? s.hw * (ns - 1) * 0.5 : 0;
      /* accidental before the head (written ones only; key signature ones are implied) */
      s.acc = null; s.edAcc = null;
      if (!s.rest && s.alt !== null && s.alt !== undefined) {
        const key = keyAt(v, s.t), letter = LETTERS[((s.step % 7) + 7) % 7];
        const sigAlt = key[letter] || 0;
        const a = Math.max(-1, Math.min(1, s.alt));
        if (s.ed) { if (a !== sigAlt && st.ed === 'on') s.edAcc = ACCG[a]; }
        else if (a !== sigAlt) s.acc = ACCG[a];
      }
      s.left = (s.acc ? (gw(s.acc) + 0.35) * Math.max(1, ns) : 0) + nsExtra;
      if (s.chord && s.chord.length) {
        const key = keyAt(v, s.t);
        for (const c of s.chord) {
          c.pos = c.step - CLEFS[s.clef].bottom;
          c.acc = null; c.edAcc = null;
          if (c.alt !== null && c.alt !== undefined) {
            const letter = LETTERS[((c.step % 7) + 7) % 7], sigAlt = key[letter] || 0, a = Math.max(-1, Math.min(1, c.alt));
            if (c.ed) { if (a !== sigAlt && st.ed === 'on') c.edAcc = ACCG[a]; }
            else if (a !== sigAlt) c.acc = ACCG[a];
          }
          if (c.acc) s.left = Math.max(s.left, (gw(c.acc) + 0.35) * Math.max(1, ns) + (s.acc ? gw(s.acc) + 0.25 : 0) + nsExtra);
        }
      }
      s.vi = i;
      s.keyc = s.t > EPS && !s.cont ? v.keys.find(q => Math.abs(q.t - s.t) < EPS) || null : null;
      s.clefc = s.t > EPS && !s.cont ? v.clefs.find(q => q.t > EPS && Math.abs(q.t - s.t) < EPS && KERN_CLEF[q.c]) || null : null;
      if (s.clefc) s.left += clefW(s.clef) + 0.9;
      if (s.keyc) { s.keyN = keyChangeGlyphs(v, s.keyc).length; s.left += s.keyN * 1.0 + 0.9; }
      if (s.mens) s.left += mensW(s.mens) + 1.3;
      const hasSec = s.chord && s.chord.length && [s.pos, ...s.chord.map(c => c.pos)].sort((a, b) => a - b).some((p, idx, arr) => idx > 0 && p - arr[idx - 1] <= 1);
      s.right = s.hw + nsExtra + (hasSec ? s.hw * 0.85 * Math.max(1, ns) : 0) + (s.dot ? 0.75 * Math.max(1, ns) : 0);
      const sy = s.syl && s.syl[Math.min(st.verse, s.syl.length - 1)] !== undefined ? s.syl[Math.min(st.verse, (s.syl.length || 1) - 1)] : null;
      s.text = null; s.hy = false; s.hyRaw = false; s.cont = false; s.ww = 0; s.lyo = 0;
      if (sy && sy !== '.') {
        let tx = sy.replace(/^-/, '');
        if (/-$/.test(tx)) { s.hyRaw = true; s.hy = st.dashes === 'on'; tx = tx.slice(0, -1); }
        tx = tx.replace(/\|\|?/g, '').replace(/_/g, ' ').trim();
        if (tx.includes('&')) { decoder.innerHTML = tx; tx = decoder.value; }
        s.text = tx; s.tw = textW(tx, ls, false, lf);
        /* a long note whose stem hangs down through the lyric row: its syllable starts beside the stem, so the row need not drop below the stem (and the staves stay close) */
        if (!s.rest && s.pos !== null && s.pos !== undefined && (STEMMED[s.g] ? isFlipped(s) : TAILED[s.g] ? !isFlipped(s) : false) && 4 - s.pos * 0.5 + 3.6 > 5.1) s.lyo = s.tw / 2 + 0.4 + (TAILED[s.g] ? s.hw / 2 : 0);
      }
      s.end = rt(s.t + s.d);
    }
    /* without dashes a word is written whole from its first syllable on; the later syllables give way to it */
    if (st.dashes === 'off') {
      let owner = null;
      for (const q of syms) {
        if (!q.text) continue;
        if (owner && owner.last.hyRaw) { q.cont = true; owner.word += q.text; owner.last = q; }
        else { owner = q; q.word = q.text; q.last = q; }
      }
      for (const q of syms) if (q.text && !q.cont) { q.ww = textW(q.word, ls, false, lf); delete q.last; }
    }
    syms.forEach((q, k) => { q.id = 'n' + i + '-' + k; });
    v.syms = syms;
  });
}
/* the clef in force at time t: the voice's own, until a clef change (Add > Clef change, or a *clef inside the music) */
function clefAt(v, t){
  if (v.sharedStaff) return v.clef;
  let c = v.clef;
  for (const m of v.clefs) if (m.t > EPS && m.t <= t + EPS && KERN_CLEF[m.c]) c = KERN_CLEF[m.c];
  return c;
}
/* the clef a line starts with: where a clef change stands at the very start of a line, the line starts with the old clef and the change is drawn as such */
function lineClef(v, t){ if (v.sharedStaff) return v.clef; return t > EPS && v.clefs.some(m => m.t > EPS && Math.abs(m.t - t) < EPS) ? clefAt(v, t - 0.01) : clefAt(v, t); }
/* the clef change that governs time t, if there is one (the clef is then edited there, not at the start of the voice) */
function clefChangeAt(v, t){ let g = null; for (const m of v.clefs) if (m.t > EPS && m.t <= t + EPS && KERN_CLEF[m.c]) g = m; return g; }
function keyAt(v, t){
  let k = {};
  for (const e of v.keys) if (e.t <= t + EPS) k = e.alts;
  return k;
}
function mensW(sign){
  const s = sign || '';
  if (s.startsWith('M:')) return Math.max(...s.slice(2).split('/').map(x => x.length)) * 1.25 + 0.4;
  const b = mensBase(s), fr = b.match(/(\d+)\s*\/\s*(\d+)/);
  if (fr) return (/[CO]/.test(b) ? 2.5 : 0) + Math.max(fr[1].length, fr[2].length) * 1.0 + 0.2;
  const hasShape = /[CO]/.test(b), num = (b.match(/\d+/) || [''])[0];
  return (hasShape ? 2.2 : 0) + (num ? 1.2 * num.length + (hasShape ? 0.3 : 0) : 0);
}

/* ------------------------------------------------------------------ */
/* Horizontal layout                                                   */
/* ------------------------------------------------------------------ */
/* horizontal spacing: at 0 the notes stand as close as they can without touching; the slider adds room by duration */
const spring = d => Math.max(0.02, 0.05 + 0.25 * Math.min(1, st.hs) + (0.8 + 2.3 * Math.pow(Math.max(d, 0.05), 0.6)) * st.hs);

/* columns for a set of voices over [a, b) */
function columns(vlist, a, b, withLyrics){
  const map = new Map();
  const col = t => { const k = rt(t); let c = map.get(k); if (!c) { c = {t: k, items: new Map(), bar: null}; map.set(k, c); } return c; };
  for (const v of vlist) for (const s of v.syms) if (s.t >= a - EPS && s.t < b - EPS) col(s.t).items.set(v, s);
  /* no barlines past the end of the music shown (a voice with nothing written yet has none) */
  const vend = Math.max(0, ...vlist.map(v => v.end));
  for (const br of piece.bars) if (br.t > a + EPS && br.t < b - EPS && br.t < vend - EPS) col(br.t).bar = br.type;
  const cols = [...map.values()].sort((x, y) => x.t - y.t);
  /* spacing */
  const lastX = new Map(), lastD = new Map(), lastSyl = new Map();
  let prev = null;
  const barOn = st.bars === 'full';   /* ticks take no room: the music lies as without barlines (Samuel 2026-11-14) */
  /* the lowest quarter of the spacing slider lets notes and syllables crowd, even overlap */
  const m1 = Math.min(1, st.hs);
  for (const c of cols) {
    let left = 0, right = 0.3;
    for (const s of c.items.values()) { left = Math.max(left, s.left); right = Math.max(right, s.right); }
    c.left = left; c.right = right;
    const needBar = c.bar && (barOn || c.bar === 'double' || c.bar === 'sec');
    let x = prev ? prev.x + prev.right + left + 0.28 + 0.27 * m1 + (needBar ? 0.5 + 0.4 * m1 : 0) : left;
    for (const [v, s] of c.items) {
      if (lastX.has(v)) x = Math.max(x, lastX.get(v) + spring(lastD.get(v)) + (needBar ? 0.5 : 0));
      if (withLyrics(v) && s.text && !s.cont && lastSyl.has(v)) x = Math.max(x, lastSyl.get(v) + s.tw / 2 - s.hw / 2 - s.lyo + 0.3 + 0.25 * m1);
    }
    c.x = x;
    for (const [v, s] of c.items) {
      lastX.set(v, x); lastD.set(v, s.d);
      if (withLyrics(v) && s.text && s.ww) lastSyl.set(v, x + s.hw / 2 + s.lyo - s.tw / 2 + s.ww);
      else if (withLyrics(v) && s.text && !s.cont) lastSyl.set(v, x + s.hw / 2 + s.lyo + s.tw / 2 + (s.hy ? 0.9 : 0));
    }
    prev = c;
  }
  /* clean break points: no voice holds a note across the column */
  const ptr = new Map(vlist.map(v => [v, 0]));
  for (const c of cols) {
    c.clean = true;
    for (const v of vlist) {
      const syms = v.syms;
      let i = ptr.get(v);
      while (i < syms.length && syms[i].end <= c.t + EPS) i++;
      ptr.set(v, i);
      if (i < syms.length && syms[i].t < c.t - EPS) { c.clean = false; break; }
    }
  }
  return cols;
}

/* break columns into lines of the given width; returns [{from, to}] */
function breakLines(cols, avail, firstAvail){
  const lines = [];
  let i = 0;
  const CUST = 2.2;
  while (i < cols.length) {
    const W = lines.length === 0 && firstAvail !== undefined ? firstAvail : avail;
    let j = i + 1, lastClean = -1;
    while (j < cols.length) {
      const width = cols[j].x - cols[i].x + cols[i].left + cols[j].right + CUST;
      if (width > W) break;
      if (cols[j].clean) lastClean = j;
      j++;
    }
    let end = j;
    /* a line ends where no voice holds a note across, unless that would leave it well short of the margin (a long note in one voice must not make the whole line stretch to fill the space) */
    if (j < cols.length && lastClean > i && cols[lastClean].x - cols[i].x + cols[i].left + cols[lastClean].right + CUST >= 0.72 * W) end = lastClean;
    lines.push({from: i, to: end});
    i = end;
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */
const use = (k, x, y) => { const g = accGlyph(k); return g === 'na' ? `<use href="#g-na" transform="translate(${f(x)} ${f(y)}) scale(${NATSC})"/>` : `<use href="#g-${g}" x="${f(x)}" y="${f(y)}"/>`; };
/* A stem down turns the glyph over. The minim's hollow head is slanted, so a mirror would reverse its slant: it is turned half a circle about the middle of the head instead (the stem stands in the middle), and the head keeps its shape. */
const useT = (k, x, y, sx, sy) => sy === -1 && sx === 1 && GLY[k + 'd'] ? use(k + 'd', x, y) : k === 'M' && sy === -1 && sx === 1
  ? `<use href="#g-M" transform="translate(${f(x + 0.64)} ${f(y)}) rotate(180) translate(-0.64 0)"/>`
  : `<use href="#g-${k}" transform="translate(${f(x)} ${f(y)}) scale(${sx} ${sy})"/>`;
const hl = (x1, x2, y, cls, w) => `<line class="${cls}" x1="${f(x1)}" x2="${f(x2)}" y1="${f(y)}" y2="${f(y)}" stroke-width="${w}"/>`;
const vl = (x, y1, y2, cls, w) => `<line class="${cls}" x1="${f(x)}" x2="${f(x)}" y1="${f(y1)}" y2="${f(y2)}" stroke-width="${w}"/>`;

function clefSvg(c, x, top){
  const C = CLEFS[c];
  if (C && C.none) return `<g class="noclef" opacity=".52"><rect x="${f(x + 0.1)}" y="${f(top + 0.25)}" width="1.9" height="3.5" rx="0.35" fill="none" stroke="currentColor" stroke-width="0.13" stroke-dasharray="0.38 0.28"/><text x="${f(x + 1.05)}" y="${f(top + 2.65)}" text-anchor="middle" font-size="2.1" font-style="italic" fill="currentColor" font-family="IM Fell English,Georgia,serif">?</text></g>`;
  let s = use(C.g, x, top + (8 - C.pos) * 0.5);
  if (C.oct) s += `<g transform="translate(${f(x + (gw(C.g) - gw('n8') * 0.8) / 2)} ${f(top + (8 - C.pos) * 0.5 + GLY[C.g].b[3] + 1.15)}) scale(0.8)">${use('n8', 0, 0)}</g>`;
  return s;
}
const clefW = c => gw(CLEFS[c].g);
function keySig(v, t, clef){
  /* where a key change stands at the very start of a line, the line starts with the old signature and the change is drawn as such */
  const kt = t > EPS && v.keys.some(q => Math.abs(q.t - t) < EPS) ? t - 0.01 : t;
  return keySigOf(keyAt(v, kt), clef);
}
function keySigOf(k, clef){
  const C = CLEFS[clef], out = [];
  for (const L of Object.keys(k)) {
    const idx = LETTERS.indexOf(L);
    let best = null;
    for (let oct = 0; oct < 9; oct++) { const step = 7 * oct + idx, p = step - C.bottom; if (p >= 0 && p <= 8) best = p; }
    if (best === null) for (let oct = 0; oct < 9; oct++) { const step = 7 * oct + idx, p = step - C.bottom; if (p >= -1 && p <= 9) best = p; }
    if (best !== null) out.push({g: ACCG[k[L]], pos: best});
  }
  return out;
}
const NUMPATH = {
  '2': 'M0.1 0.6C0.2 0 1.1 0 1.1 0.65C1.1 1.2 0.4 1.6 0 2.3L1.2 2.3',
  '3': 'M0.1 0.55C0.2 0.1 1 0 1.05 0.6C1.1 1 0.7 1.1 0.5 1.15C0.9 1.2 1.2 1.5 1.1 1.85C1 2.4 0.2 2.5 0 1.9',
  '4': 'M0.95 2.3L0.95 0L0 1.6L1.3 1.6',
  '6': 'M1 0.2C0.3 0 0 1 0.1 1.7C0.15 2.6 1.1 2.5 1.1 1.7C1.1 1.1 0.3 1 0.1 1.7',
  '9': 'M0.1 2.1C0.8 2.3 1.1 1.3 1 0.6C0.95 -0.2 0 -0.1 0 0.6C0 1.2 0.8 1.3 1 0.6',
  '1': 'M0.2 0.5L0.7 0L0.7 2.3M0.2 2.3L1.2 2.3',
  '0': 'M0.6 0C0.1 0 0 0.6 0 1.15C0 1.7 0.1 2.3 0.6 2.3C1.1 2.3 1.2 1.7 1.2 1.15C1.2 0.6 1.1 0 0.6 0Z',
  '5': 'M1.1 0L0.25 0L0.15 1C0.45 0.8 1.1 0.75 1.1 1.5C1.1 2.4 0.25 2.45 0.05 2',
  '7': 'M0.05 0L1.2 0L0.5 2.3',
  '8': 'M0.6 1.1C0.1 1 0.1 0 0.6 0C1.1 0 1.1 1 0.6 1.1C0 1.2 0 2.3 0.6 2.3C1.2 2.3 1.2 1.2 0.6 1.1Z'
};
function mensSvg(sign, x, top){
  if (String(sign || '').startsWith('M:')) return timeSigSvg(String(sign).slice(2).split('/'), x, top);
  const s = mensBase(sign);
  const hasC = /C/.test(s), hasO = /O/.test(s), stroke = /\|/.test(s), dot = /\./.test(s), rev = /r/.test(s);
  const fr = s.match(/(\d+)\s*\/\s*(\d+)/);
  const num = fr ? '' : (s.match(/\d+/) || [''])[0];
  const cy = top + 2, r = 1.05;
  const a = `fill="none" class="ms" stroke-width="0.2" stroke-linecap="round"`;
  let o = '', cx = x + 1.1;
  if (hasO) o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" ${a}/>`;
  else if (hasC) {
    const dx = r * 0.643 * (rev ? -1 : 1), y1 = cy - r * 0.766, y2 = cy + r * 0.766;
    o += `<path d="M${f(cx + dx)} ${f(y1)}A${r} ${r} 0 1 ${rev ? 1 : 0} ${f(cx + dx)} ${f(y2)}" ${a}/>`;
  }
  if (stroke && (hasC || hasO)) o += vl(cx, cy - 1.75, cy + 1.75, 'ms', 0.2);
  if (dot) o += `<circle class="ink" cx="${f(cx)}" cy="${f(cy)}" r="0.15" stroke="none"/>`;
  /* a proportion as a fraction: the two numbers one over the other (3 over 2: sesquialtera; 4 over 3: sesquitertia) */
  if (fr) {
    const nx = hasC || hasO ? x + 2.5 : x;
    [[fr[1], cy - 2], [fr[2], cy]].forEach(([numr, y]) => [...numr].forEach((ch, i) => {
      const d = NUMPATH[ch];
      o += d ? `<path d="${d}" transform="translate(${f(nx + i * 1.0)} ${f(y)}) scale(0.9)" ${a}/>` : `<text x="${f(nx + i * 1.0)}" y="${f(y + 1.9)}" font-size="2.2">${ch}</text>`;
    }));
  }
  if (num) {
    const nx = hasC || hasO ? x + 2.5 : x;
    /* numerals drawn as thin strokes, like the sign itself (the font's digits are too heavy at this size) */
    [...num].forEach((ch, i) => {
      const d = NUMPATH[ch];
      o += d ? `<path d="${d}" transform="translate(${f(nx + i * 1.2)} ${f(cy - 1.1)}) scale(0.9)" ${a}/>` : `<text x="${f(nx + i * 1.2)}" y="${f(cy + 1.05)}" font-size="3">${ch}</text>`;
    });
  }
  const mi = mensInfo(sign);
  if (mi.sfRaw && Math.abs(mi.sf - 1) > 1e-6) {
    const lbl = mi.sfRaw === '0.5' || mi.sfRaw === '1/2' ? '×½' : '×' + mi.sfRaw;
    o += `<text class="sf-badge" x="${f(cx)}" y="${f(top - 0.55)}" font-size="1.15" text-anchor="middle">${esc(lbl)}</text>`;
  }
  return o;
}
/* a modern time signature: the two numbers, one over the other, each filling half the staff */
function timeSigSvg(rows, x, top){
  const W = Math.max(...rows.map(r => r.length)) * 1.25;
  let o = '';
  rows.forEach((r, k) => {
    const x0 = x + 0.2 + (W - r.length * 1.25) / 2, y0 = top + k * 2;
    [...r].forEach((ch, i) => {
      const d = NUMPATH[ch];
      o += d ? `<path d="${d}" transform="translate(${f(x0 + i * 1.25)} ${f(y0 + 0.05)}) scale(0.95 0.82)" fill="none" class="ms" stroke-width="0.34" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<text x="${f(x0 + i * 1.25 + 0.6)}" y="${f(y0 + 1.75)}" font-size="2.5" font-weight="bold" text-anchor="middle">${esc(ch)}</text>`;
    });
  });
  return o;
}
function ledgers(pos, x, w, top){
  let s = '';
  for (let p = -2; p >= pos; p -= 2) s += hl(x - 0.4, x + w + 0.4, top + 4 - p * 0.5, 'ledger', 0.16);
  for (let p = 2 * staffLinesN(); p <= pos; p += 2) s += hl(x - 0.4, x + w + 0.4, top + 4 - p * 0.5, 'ledger', 0.16);
  return s;
}
const rrect = (x, y1, y2) => `<rect class="ink" x="${f(x)}" y="${f(y1)}" width="0.42" height="${f(y2 - y1)}"/>`;
function restSvg(s, cx, top){
  const k = s.glyph, x = cx - 0.21;
  if (s.restOvr && s.restOvr.sp > 0) {
    const bot = Math.max(1, Math.min(5, s.restOvr.bot || 2));
    const sp = Math.max(0.5, Math.min(3, s.restOvr.sp));
    const y2 = top + 5 - bot, y1 = y2 - sp;
    if (s.g === 'Mx') return rrect(x - 0.4, y1, y2) + rrect(x + 0.4, y1, y2);
    return rrect(x, y1, y2);
  }
  if (s.g === 'Mx') return rrect(x - 0.4, top + 1, top + 3) + rrect(x + 0.4, top + 1, top + 3);
  if (s.g === 'L') return rrect(x, top + 1, top + 3);
  if (s.g === 'B') return rrect(x, top + 1, top + 2);
  if (s.g === 'S') return rrect(x, top + 1, top + 1.5);
  if (s.g === 'M') return rrect(x, top + 1.5, top + 2);
  return use(k, cx - gw(k) / 2, top + 2);
}
function fermata(cx, y){
  return `<path class="ink" d="M${f(cx - 0.9)} ${f(y)}A0.9 0.85 0 0 1 ${f(cx + 0.9)} ${f(y)}L${f(cx + 0.78)} ${f(y)}A0.78 0.66 0 0 0 ${f(cx - 0.78)} ${f(y)}Z"/><circle class="ink" cx="${f(cx)}" cy="${f(y - 0.22)}" r="0.16"/>`;
}
function signumSvg(cx, y){
  /* Renaissance signum congruentiae: dotted S-flourish, distinct from corona/fermata */
  return `<g class="signum"><path class="ms" fill="none" stroke-width="0.16" stroke-linecap="round" d="M${f(cx + 0.45)} ${f(y - 1.05)}C${f(cx - 0.35)} ${f(y - 1.15)} ${f(cx - 0.4)} ${f(y - 0.55)} ${f(cx)} ${f(y - 0.45)}C${f(cx + 0.42)} ${f(y - 0.35)} ${f(cx + 0.38)} ${f(y + 0.2)} ${f(cx - 0.45)} ${f(y + 0.1)}"/><circle class="ink" cx="${f(cx - 0.52)}" cy="${f(y - 0.5)}" r="0.13"/><circle class="ink" cx="${f(cx + 0.52)}" cy="${f(y - 0.4)}" r="0.13"/></g>`;
}
/* how far a symbol reaches above and below the staff (staff spaces from the top line) */
function extent(s, L = 3.6){
  if (s.rest) return [0, 4];
  const y = 4 - s.pos * 0.5;
  let lo = y - 0.8, hi = y + 0.8;
  const flip = isFlipped(s);
  if (STEMMED[s.g]) { if (flip) hi = y + L; else lo = y - L; }
  if (TAILED[s.g]) { if (flip) lo = y - L; else hi = y + L; }
  if (s.acc) { lo = Math.min(lo, y - (s.acc === 'fl' ? 2.1 : 1.6)); hi = Math.max(hi, y + 1.6); }
  if (s.edAcc) lo = Math.min(lo, Math.min(-0.9, y - (flip ? 1.6 : STEMMED[s.g] ? 4.3 : 1.7)) - 1.5);
  if (s.chord && s.chord.length) {
    for (const c of s.chord) { const cy = 4 - c.pos * 0.5; lo = Math.min(lo, cy - 0.8); hi = Math.max(hi, cy + 0.8); }
  }
  if (s.ferm || s.signum) lo = Math.min(lo, y - 2.2, -1.6);
  return [lo, hi];
}
const isFlipped = s => s.stemDirOvr === 'u' ? !!TAILED[s.g] : s.stemDirOvr === 'd' ? !!STEMMED[s.g] : s.stemDir === 1 ? !!TAILED[s.g] : s.stemDir === -1 ? !!STEMMED[s.g] : st.stems === 'strict' ? false : (STEMMED[s.g] && s.pos >= 7) || (TAILED[s.g] && s.pos <= -1);

/* a key change in the middle of a line: naturals for what is cancelled, then the new signature */
function keyChangeGlyphs(v, kc){
  const prev = keyAt(v, kc.t - 0.01), out = [], clef = clefAt(v, kc.t);
  const gone = {}; for (const L of Object.keys(prev)) if (!kc.alts[L]) gone[L] = 0;
  const nat = keySigOf(Object.fromEntries(Object.keys(gone).map(L => [L, 0])), clef);
  return [...nat.map(q => ({g: 'na', pos: q.pos})), ...keySigOf(kc.alts, clef)];
}
function markSvg(s, X, top){
  let o = '', ox = X - s.left;
  if (s.clefc) {
    const cw = clefW(s.clef);
    o += `<g class="clefhit" data-v="${s.vi}" data-t="${s.t}"><rect x="${f(ox - 0.2)}" y="${f(top - 1.5)}" width="${f(cw + 0.4)}" height="7" fill="transparent"/>${clefSvg(s.clef, ox, top)}</g>`;
    ox += cw + 0.9;
  }
  if (s.keyc) {
    const gl = keyChangeGlyphs(piece.voices[s.vi], s.keyc);
    let g = '', x = ox;
    for (const k of gl) { g += use(k.g, x, top + 4 - k.pos * 0.5); x += gw(k.g) + 0.15; }
    const kw = Math.max(1.6, x - ox), cx = ox + kw / 2 - 0.05;
    o += `<g class="keyhit" data-v="${s.vi}" data-t="${s.t}"><rect x="${f(ox - 0.2)}" y="${f(top - 2.6)}" width="${f(kw + 0.4)}" height="9.2" fill="transparent"/>${g}` +
      `<g class="ksarr" data-ks="1"><rect x="${f(cx - 0.9)}" y="${f(top - 2.6)}" width="1.8" height="2" fill="transparent"/><path d="M${f(cx - 0.6)} ${f(top - 0.8)}L${f(cx + 0.6)} ${f(top - 0.8)}L${f(cx)} ${f(top - 1.9)}Z"/></g>` +
      `<g class="ksarr" data-ks="-1"><rect x="${f(cx - 0.9)}" y="${f(top + 4.6)}" width="1.8" height="2" fill="transparent"/><path d="M${f(cx - 0.6)} ${f(top + 4.8)}L${f(cx + 0.6)} ${f(top + 4.8)}L${f(cx)} ${f(top + 5.9)}Z"/></g></g>`;
    ox += s.keyN * 1.0 + 0.9;
  }
  if (s.mens) o += `<g class="menshit" data-t="${s.t}"><rect x="${f(ox - 0.2)}" y="${f(top - 0.5)}" width="${f(X - ox - 0.1)}" height="5" fill="transparent"/>${mensSvg(s.mens, ox, top)}</g>`;
  return o;
}
function symSvg(s, X, top, showNotes, suppressMark, rdy){
  /* with the notes hidden, the key change and mensuration sign stay, like the clef */
  if (!showNotes) return !suppressMark && (s.keyc || s.mens || s.clefc) ? markSvg(s, X, top) : '';
  if (s.ligSvg && s.ligX != null) X = s.ligX;   /* a note of a drawn ligature stands where the ligature puts it */
  const hy = s.rest ? top + (rdy || 0) + 0.5 : top + 4 - s.pos * 0.5 - 1;
  /* the place of a first note in an empty voice: nothing drawn but the sign before it and the cursor's place */
  if (s.phantom) return `<g class="${s.id} phantom"><rect class="selbg" x="${f(X - 0.5)}" y="${f(top - 1.4)}" width="${f(s.hw + 1)}" height="6.8" rx="0.35"/>${!suppressMark && s.mens ? markSvg(s, X, top) : ''}</g>`;
  return `<g class="${s.id}"><rect class="selbg" x="${f(X - 0.5)}" y="${f(top - 1.4)}" width="${f(s.hw + 1)}" height="6.8" rx="0.35"/><rect class="hit" x="${f(X - 0.3)}" y="${f(hy)}" width="${f(s.hw + 0.6)}" height="${s.rest ? 3 : 2}"/>${symInner(s, X, top, suppressMark, rdy)}</g>`;
}
/* the glyph of a note (or of one head of a chord) with a chosen appearance; only the shapes that can be white or
   black (maxima to minima) change between the two, red works on all; modern notation shows red only */
const LOOK_SHAPES = {Mx: 1, L: 1, B: 1, S: 1, M: 1};
function lookGlyph(s, look){
  const auto = {g: s.glyphAuto || s.glyph, red: s.glyphAuto ? !!s.redAuto : !!s.red};
  if (!look || s.rest || s.phantom) return auto;
  const filled = BLACK ? BLACK_G[s.g] || s.g + 'c' : GLY[s.g + 'c'] ? s.g + 'c' : auto.g;
  if (look === 'red') return {g: MODERN ? auto.g : filled, red: true};
  if (MODERN || !LOOK_SHAPES[s.g]) return {g: auto.g, red: false};
  return {g: look === 'black' ? filled : s.g, red: false};
}
function chordHeadSvg(s, x, y, glyph){
  const g = glyph || s.glyph;
  if (g === 'M') return use('S', x, y);
  if (g === 'Mc' || g === 'Sm' || g === 'Smc' || g === 'F' || g === 'Fc' || g === 'F2' || g === 'F3' || g === 'Sf' || g === 'Sfc') return use('Sc', x, y);
  if (g === 'L') return use('B', x, y);
  if (g === 'Lc') return use('Bc', x, y);
  if (g === 'nM') return use('nS', x, y);
  if (g === 'nQ' || g === 'nE' || g === 'nX') return `<ellipse class="ink" cx="0" cy="0" rx="0.54" ry="0.39" transform="translate(${f(x + s.hw * 0.5)} ${f(y)}) rotate(-20)"/>`;
  return use(g, x, y);
}
function symInner(s, X, top, suppressMark, rdy){
  let o = '';
  let hx = X;
  const ns = noteScale(), cx = hx + s.hw / 2;
  if (!suppressMark && (s.mens || s.keyc || s.clefc)) o += markSvg(s, X, top);
  if (s.rest) {
    const rtTop = top + (rdy || 0);
    const r = restSvg(s, cx, rtTop);
    o += Math.abs(ns - 1) > 0.005 ? `<g transform="translate(${f(cx)} ${f(rtTop + 2)}) scale(${f(ns)}) translate(${f(-cx)} ${f(-(rtTop + 2))})">${r}</g>` : r;
    return o;
  }
  const y = top + 4 - s.pos * 0.5;
  let body = '';
  if (s.ligSvg) {
    o += ledgers(s.pos, hx - s.hw * (ns - 1) * 0.5, s.hw * ns, top);
    if (s.acc) body += use(s.acc, hx - gw(s.acc) - 0.3, y);
    o += s.ligSvg;
  } else if (s.chord && s.chord.length) {
    const all = [{pos: s.pos, acc: s.acc, main: true, look: s.look}, ...s.chord.map(c => ({pos: c.pos, acc: c.acc, main: false, look: c.look}))].sort((a, b) => a.pos - b.pos);
    const anyLook = all.some(n => n.look);
    let prevPos = -999, prevOff = false;
    for (const n of all) {
      const off = n.pos - prevPos <= 1 && !prevOff;
      n.dx = off ? s.hw * 0.85 : 0;
      prevPos = n.pos; prevOff = off;
    }
    const flip = isFlipped(s), upStem = flip ? !!TAILED[s.g] : !!STEMMED[s.g];
    const hasStem = !!(STEMMED[s.g] || TAILED[s.g]);
    /* place the stemmed/flagged glyph on the extreme notehead in the stem direction so the stem/flag never collides with inner heads */
    const stemIdx = hasStem ? (upStem ? all.length - 1 : 0) : -1;
    let accOff = 0, grp = '';
    all.forEach((n, idx) => {
      const cy = top + 4 - n.pos * 0.5, nx = hx + n.dx;
      o += ledgers(n.pos, nx - s.hw * (ns - 1) * 0.5, s.hw * ns, top);
      /* each head keeps its own appearance (a white main note with a black supplementary one) */
      const lk = anyLook ? lookGlyph(s, n.look) : {g: s.glyph, red: false};
      let hd;
      if (idx === stemIdx) hd = flip ? useT(lk.g, nx, cy, 1, -1) : use(lk.g, nx, cy);
      else hd = chordHeadSvg(s, nx, cy, lk.g);
      grp += anyLook && lk.red ? `<g class="red">${hd}</g>` : hd;
      if (n.acc) { grp += use(n.acc, hx - gw(n.acc) - 0.3 - accOff, cy); accOff += gw(n.acc) + 0.22; }
      if (s.dot) {
        const dx = hx + s.hw + (all.some(q => q.dx) ? s.hw * 0.85 : 0) + (s.dd ? 0.55 : 0.4);
        const dy = top + 4 - (n.pos % 2 === 0 ? n.pos + 1 : n.pos) * 0.5;
        if (n.main) grp += `<g class="dothit"><title>Punctus ${s.dd ? 'divisionis' : 'additionis'}</title><circle class="hit" cx="${f(dx)}" cy="${f(dy)}" r="0.55" fill="transparent"/><circle class="ink" cx="${f(dx)}" cy="${f(dy)}" r="0.19"/><text class="dotkind hit" x="${f(dx + 0.34)}" y="${f(dy + 0.24)}" font-size="0.85" font-style="normal">${s.dd ? 'D' : 'A'}</text></g>`;
        else grp += `<circle class="ink" cx="${f(dx)}" cy="${f(dy)}" r="0.19"/>`;
      }
    });
    if (hasStem) {
      const yTop = top + 4 - all[all.length - 1].pos * 0.5, yBot = top + 4 - all[0].pos * 0.5;
      const anchorX = hx + all[stemIdx].dx;
      const sx = MODERN ? (flip ? anchorX + 0.04 : anchorX + s.hw - 0.14) : (TAILED[s.g] ? anchorX + s.hw - 0.12 : anchorX + s.hw * 0.5 - 0.06);
      grp += `<rect class="ink" x="${f(sx)}" y="${f(yTop)}" width="0.12" height="${f(Math.max(0.1, yBot - yTop))}"/>`;
    }
    body += s.red && !anyLook ? `<g class="red">${grp}</g>` : grp;
  } else {
    o += ledgers(s.pos, hx - s.hw * (ns - 1) * 0.5, s.hw * ns, top);
    if (s.acc) body += use(s.acc, hx - gw(s.acc) - 0.3, y);
    let gm;
    if (s.stemDirOvr === 'n') {
      gm = chordHeadSvg(s, hx, y);
    } else if (s.stemSideOvr === 'l' && (TAILED[s.g] || s.g === 'L' || s.g === 'Mx')) {
      /* mirror horizontally around notehead center so right-side tail flips to left */
      gm = `<g transform="translate(${f(hx + s.hw)} ${f(y)}) scale(-1 ${isFlipped(s) ? -1 : 1}) translate(${f(-hx)} ${f(-y)})">${use(s.glyph, hx, y)}</g>`;
    } else {
      gm = isFlipped(s) ? useT(s.glyph, hx, y, 1, -1) : use(s.glyph, hx, y);
    }
    if (s.cut > 0.02) {
      const upStem = isFlipped(s) ? !!TAILED[s.g] : !!STEMMED[s.g];
      const y0 = upStem ? y - 3.7 + s.cut : y - 1.5, y1 = upStem ? y + 1.5 : y + 3.7 - s.cut;
      body += `<clipPath id="c-${s.id}"><rect x="${f(hx - 1)}" y="${f(y0)}" width="${f(s.hw + 3)}" height="${f(y1 - y0)}"/></clipPath><g clip-path="url(#c-${s.id})"${s.red ? ' class="red"' : ''}>${gm}</g>`;
    } else body += s.red ? `<g class="red">${gm}</g>` : gm;
  }
  if (s.dot && !s.ligSvg && !(s.chord && s.chord.length)) {
    const dx = hx + s.hw + (s.dd ? 0.55 : 0.4), dy = top + 4 - (s.pos % 2 === 0 ? s.pos + 1 : s.pos) * 0.5, dk = s.dd ? 'D' : 'A';
    body += `<g class="dothit"><title>Punctus ${s.dd ? 'divisionis' : 'additionis'}</title><circle class="hit" cx="${f(dx)}" cy="${f(dy)}" r="0.55" fill="transparent"/><circle class="ink" cx="${f(dx)}" cy="${f(dy)}" r="0.19"/><text class="dotkind hit" x="${f(dx + 0.34)}" y="${f(dy + 0.24)}" font-size="0.85" font-style="normal">${dk}</text></g>`;
  }
  if (s.edAcc) {
    const ay = Math.min(top - 0.9, y - (isFlipped(s) ? 1.6 : (STEMMED[s.g] ? 4.3 : 1.7)));
    body += `<g transform="translate(${f(hx + s.hw / 2 - gw(s.edAcc) * 0.36)} ${f(ay)}) scale(0.72)">${use(s.edAcc, 0, 0)}</g>`;
  }
  if (s.ferm) {
    const fy = Math.min(top - 0.7, y - (STEMMED[s.g] && !isFlipped(s) ? 4.1 : 1.2));
    body += fermata(hx + s.hw / 2, fy);
  }
  if (s.signum) {
    const sy = Math.min(top - (s.ferm ? 2.1 : 0.9), y - (STEMMED[s.g] && !isFlipped(s) ? 4.4 : 1.6));
    body += signumSvg(hx + s.hw / 2, sy);
  }
  o += Math.abs(ns - 1) > 0.005 && body ? `<g transform="translate(${f(cx)} ${f(y)}) scale(${f(ns)}) translate(${f(-cx)} ${f(-y)})">${body}</g>` : body;
  return o;
}
function custosSvg(s, x, top){
  if (!s || s.rest) return '';
  const y = top + 4 - s.pos * 0.5;
  return `<use href="#g-${s.pos >= 5 ? 'cd' : 'cu'}" transform="translate(${f(x)} ${f(y + 0.4)}) scale(0.8)"/>`;
}

/* Ligatures. With Ligatures on (and mensural notation) a ligature is drawn as one, compact, as in the sources: square
   notes joined at their sides, every falling step that the rules allow drawn as an oblique (one slanted body for two
   notes), the values shown by the old rules (Apel):
     first note: up-stem on the left = two semibreves (cum opposita proprietate); descending: stem down on the left = brevis,
       none = longa; ascending: none = brevis, stem down on the right = longa
     middle notes: brevis (square or in an oblique), or longa with a stem down on the right; a maxima is twice as wide
     last note: descending: square = longa, oblique = brevis; ascending: none = brevis, stem down on the right = longa
   The notes stand side by side from the first note's place, whatever the spacing of the other voices.
   Anything these rules cannot show (a dot, a minima, a semibrevis elsewhere, a repeated note, a ligature that runs over
   the line), and every ligature with Ligatures off, is written as single notes under a bracket. */
const LIG_W = {B: 1.3, L: 1.3, S: 1.3, M: 1.3, Sm: 1.3, F: 1.3, Mx: 2.5};
const LIG_SHORT = ['S', 'M', 'Sm', 'F'];   /* the values of the pair cum opposita proprietate */
function ligBand(xa, ya, xb, yb, filled, red){
  const P = (pts) => `<path class="ink${red ? ' red' : ''}" d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z"/>`;
  if (filled) return P([[xa, ya - 0.544], [xb, yb - 0.544], [xb, yb + 0.54], [xa, ya + 0.54]]);
  return P([[xa, ya - 0.544], [xb, yb - 0.544], [xb, yb - 0.296], [xa, ya - 0.296]]) + P([[xa, ya + 0.296], [xb, yb + 0.296], [xb, yb + 0.54], [xa, ya + 0.54]]);
}
const ligV = (x, y1, y2) => `<rect class="ink" x="${f(x)}" y="${f(Math.min(y1, y2))}" width="0.12" height="${f(Math.abs(y2 - y1))}"/>`;
function ligShape(G, top){
  /* G: [[sym, X]], all in one line; returns false when the rules can't show it */
  const n = G.length;
  if (n < 2) return false;
  const gs = G.map(([q]) => q.g);
  const lk = G[0][0].ligKind || '';
  const cop = lk === 'cop' || (LIG_SHORT.includes(gs[0]) && gs[1] === gs[0]);
  /* dots are only possible on the two notes of a c.o.p. pair (they just receive their dots) */
  if (G.some(([q], i) => q.rest || q.tieNext || !LIG_W[q.g] || (q.dot && !(cop && i < 2)))) return false;
  for (let i = 1; i < n; i++) if (G[i][0].step === G[i - 1][0].step) return false;
  if (gs.some((g, i) => LIG_SHORT.includes(g) && !(cop && i < 2))) return false;
  const Y = G.map(([q]) => top + 4 - q.pos * 0.5);
  const down = i => G[i][0].step < G[i - 1][0].step;          /* note i lower than the one before */
  /* the first note's value must be one its shape can show */
  if (!cop && !(gs[0] === 'Mx' || (gs[0] === 'B') || (gs[0] === 'L'))) return false;
  /* obliques: a falling step from note i to i+1, i+1 a brevis (or the second semibrevis of c.o.p.), i a brevis, the
     first note (B or L) or the first semibrevis; a falling final brevis must be one */
  const can = lk === 'recta' ? () => false : lk === 'obliqua' ? (i => down(i + 1)) : (i => down(i + 1) && ((cop && i === 0) || (gs[i + 1] === 'B' && (gs[i] === 'B' || (i === 0 && gs[i] === 'L')))));
  const pairAt = new Array(n).fill(false);
  const finalObl = lk !== 'recta' && gs[n - 1] === 'B' && down(n - 1) && !(cop && n === 2);
  if (finalObl && !can(n - 2)) return false;
  if (finalObl) pairAt[n - 2] = true;
  for (let i = 0; i < n - 1; i++) {
    if (pairAt[i]) break;
    if (finalObl && i + 1 >= n - 2) break;
    if (can(i)) { pairAt[i] = true; i++; }
  }
  /* units: a square note, or an oblique for two notes; each note gets its place */
  const units = [];
  for (let i = 0; i < n; i++) { if (pairAt[i]) { units.push([i, i + 1]); i++; } else units.push([i]); }
  const X = new Array(n);
  let x = G[0][1];
  /* the notes stay joined whatever their dots (a dot never opens a ligature: Samuel 2026-11-15) */
  for (const u of units) {
    if (u.length === 2) { X[u[0]] = x; X[u[1]] = x + 1.3; x += 2.6; }
    else { X[u[0]] = x; x += LIG_W[gs[u[0]]]; }
  }
  const parts = G.map(() => '');
  const TL = 3.548;
  units.forEach((u, k) => {
    const i = u[0], j = u[u.length - 1], xa = X[i], xb = xa + (u.length === 2 ? 2.6 : LIG_W[gs[i]]);
    const col = u.some(q => G[q][0].col);
    parts[i] += ligBand(xa, Y[i], xb, Y[j], col || BLACK, BLACK && col);
    /* the left side: the first note's, or the joint with the note before (both pitches) */
    if (i === 0) parts[i] += ligV(xa, Y[0] - 0.686, Y[0] + 0.686);
    else parts[i] += ligV(xa, Math.min(Y[i], Y[i - 1]) - 0.686, Math.max(Y[i], Y[i - 1]) + 0.686);
    if (j === n - 1) parts[j] += ligV(xb - 0.12, Y[j] - 0.686, Y[j] + 0.686);
  });
  /* dots, always on a space. The last note's dot stands after it (a line note: the space above, a space note: its own space);
     inside the ligature the note after it is joined on, so the dot stands over the joint, in the space diagonally up and right */
  G.forEach(([q], i) => {
    if (!q.dot) return;
    const line = q.pos % 2 === 0, last = i === n - 1;
    const u = units.find(w => w.includes(i)), w = u.length === 2 ? 1.3 : LIG_W[gs[i]];
    /* over the joint: the space above the higher of the two notes there */
    const hi = !last && Y[i + 1] < Y[i] ? i + 1 : i, hiLine = G[hi][0].pos % 2 === 0;
    const dy = last ? (line ? Y[i] - 0.5 : Y[i]) : (hiLine ? Y[hi] - 0.5 : Y[hi] - 1);
    const dx = last ? X[i] + w + 0.4 : X[i] + w - 0.35, dk = q.dd ? 'D' : 'A';   /* inside: just left of the joint, clear of the next note */
    parts[i] += `<g class="dothit"><title>Punctus ${q.dd ? 'divisionis' : 'additionis'}</title><circle class="hit" cx="${f(dx)}" cy="${f(dy)}" r="0.55" fill="transparent"/><circle class="ink" cx="${f(dx)}" cy="${f(dy)}" r="0.2"/><text class="dotkind hit" x="${f(dx + 0.34)}" y="${f(dy + 0.24)}" font-size="0.85" font-style="normal">${dk}</text></g>`;
  });
  /* stems */
  if (cop) parts[0] += ligV(X[0], Y[0] - TL, Y[0]);
  else if (lk === 'sp') { /* sine proprietate: no initial left stem */ }
  else if (gs[0] === 'B' && down(1)) parts[0] += ligV(X[0], Y[0], Y[0] + TL);
  else if (gs[0] === 'L' && !down(1)) parts[0] += ligV(X[0] + LIG_W.L - 0.12, Y[0], Y[0] + TL);
  else if (!(gs[0] === 'Mx' || (gs[0] === 'L' && down(1)) || (gs[0] === 'B' && !down(1)))) return false;
  for (let i = 1; i < n - 1; i++) {
    if (cop && i === 1) continue;
    if (gs[i] === 'L') parts[i] += ligV(X[i] + LIG_W.L - 0.12, Y[i], Y[i] + TL);
  }
  const L = n - 1;
  if (!(cop && L === 1)) {
    if (gs[L] === 'L' && !down(L)) parts[L] += ligV(X[L] + LIG_W.L - 0.12, Y[L], Y[L] + TL);
    if (gs[L] === 'B' && down(L) && !finalObl) return false;
  }
  G.forEach(([q], i) => { q.ligSvg = parts[i] || '<g/>'; q.ligX = X[i]; });
  return true;
}
function ligBracket(G, top, open0, open1){
  let lo = top - 1.1;
  for (const [q] of G) lo = Math.min(lo, top + extent(q)[0] - 0.5);
  const xa = G[0][1] - 0.25, xb = G[G.length - 1][1] + G[G.length - 1][0].hw + 0.25;
  let o = `<rect class="ink" x="${f(xa)}" y="${f(lo)}" width="${f(xb - xa)}" height="0.12"/>`;
  if (!open0) o += `<rect class="ink" x="${f(xa)}" y="${f(lo)}" width="0.12" height="0.7"/>`;
  if (!open1) o += `<rect class="ink" x="${f(xb - 0.12)}" y="${f(lo)}" width="0.12" height="0.7"/>`;
  return o;
}
function ligatures(v, list, top){
  for (const [q] of list) { q.ligSvg = null; q.ligX = null; }
  let out = '';
  for (let i = 0; i < list.length; ) {
    const q = list[i][0];
    if (!q.lig) { i++; continue; }
    let j = i + 1;
    while (j < list.length && list[j][0].lig === q.lig && !list[j][0].rest) j++;
    const G = list.slice(i, j);
    const k0 = v.syms.indexOf(q), k1 = v.syms.indexOf(list[j - 1][0]);
    const open0 = k0 > 0 && v.syms[k0 - 1].lig === q.lig && !v.syms[k0 - 1].rest;
    const open1 = k1 >= 0 && k1 + 1 < v.syms.length && v.syms[k1 + 1].lig === q.lig && !v.syms[k1 + 1].rest;
    const drawn = st.lig !== 'off' && st.nota === 'real' && !open0 && !open1 && ligShape(G, top);
    if (!drawn) { for (const [s2] of G) { s2.ligSvg = null; s2.ligX = null; } out += ligBracket(G, top, open0, open1); }
    i = j;
  }
  return out;
}

/* One line of one voice's staff. ctx: {v, cols(from..to), xs, top, x0, x1, last, showNotes, showLyr, first} */
function staffLine(o){
  const {v, top, x0, x1} = o;
  let s = '';
  for (let k = 5 - staffLinesN(); k < 5; k++) s += hl(x0, x1, top + k, 'staff', 0.12);
  /* clef, key */
  const t0 = o.t0;
  const clef = lineClef(v, t0), govC = clefChangeAt(v, t0 > EPS && v.clefs.some(m => m.t > EPS && Math.abs(m.t - t0) < EPS) ? t0 - 0.01 : t0);
  /* where the mouse writes notes; on the last line it reaches on to the margin, for adding at the end */
  const hx1 = o.tail ? Math.max(x1, o.tail) : x1;
  /* the times of the line's columns and where they stand, so a click can be turned into a time */
  const tx = []; for (let i = o.from; i < o.to; i++) tx.push(o.cols[i].t + ':' + f(o.xs[i]));
  if (o.tEnd !== undefined && o.tEnd !== null) tx.push(o.tEnd + ':' + f(x1));
  s += `<rect class="stafhit" data-v="${v.idx}" data-tx="${tx.join(',')}" data-top="${f(top)}" data-end="${f(x1)}" data-k0="${o.k0 ?? ''}" data-k1="${o.k1 ?? ''}" x="${f(x0)}" y="${f(top - 2.6)}" width="${f(hx1 - x0)}" height="9.2" fill="transparent"/>`;
  s += `<g class="clefhit" data-v="${v.idx}"${govC ? ` data-t="${govC.t}"` : ''}><rect x="${f(x0 + 0.2)}" y="${f(top - 1.5)}" width="${f(clefW(clef) + 0.4)}" height="7" fill="transparent"/>${clefSvg(clef, x0 + 0.5, top)}</g>`;
  let x = x0 + 0.5 + clefW(clef) + 0.5;
  /* the key signature: hovering it shows arrows, down adds flats, up goes to no accidental and then sharps */
  { const ks = keySig(v, t0, clef), kx = x; let g = '';
    for (const k of ks) { g += use(k.g, x, top + 4 - k.pos * 0.5); x += gw(k.g) + 0.15; }
    const kw = Math.max(1.6, x - kx), cx = kx + kw / 2 - 0.05;
    /* no mensuration sign yet: a faint one shows when the mouse is over the place, and a click adds it */
    if (t0 < EPS && !v.mets.some(m => m.t < EPS)) s += `<g class="mensadd" data-v="${v.idx}"><rect x="${f(x)}" y="${f(top - 0.5)}" width="2.8" height="5" fill="transparent"/>${mensSvg('C', x + 0.3, top)}</g>`;
    s += `<g class="keyhit" data-v="${v.idx}"><rect x="${f(kx - 0.1)}" y="${f(top - 2.6)}" width="${f(kw + 0.9)}" height="9.2" fill="transparent"/>${g}` +
      `<g class="ksarr" data-ks="1"><rect x="${f(cx - 0.9)}" y="${f(top - 2.6)}" width="1.8" height="2" fill="transparent"/><path d="M${f(cx - 0.6)} ${f(top - 0.8)}L${f(cx + 0.6)} ${f(top - 0.8)}L${f(cx)} ${f(top - 1.9)}Z"/></g>` +
      `<g class="ksarr" data-ks="-1"><rect x="${f(cx - 0.9)}" y="${f(top + 4.6)}" width="1.8" height="2" fill="transparent"/><path d="M${f(cx - 0.6)} ${f(top + 4.8)}L${f(cx + 0.6)} ${f(top + 4.8)}L${f(cx)} ${f(top + 5.9)}Z"/></g></g>`; }
  /* notes (single voice or shared multi-voice staff) */
  const drawLayer = (lv, lShow, lShowLyr, lyrY, dxMap, restDyMap, skipSet, drawCustos, suppressMark) => {
    let out = '', ligOut = '';
    if (lShow) {
      const list = [];
      for (let i = o.from; i < o.to; i++) { const sym = o.cols[i].items.get(lv); if (sym && (!skipSet || !skipSet.has(sym))) list.push([sym, o.xs[i] + (dxMap ? (dxMap.get(sym) || 0) : 0)]); }
      ligOut = ligatures(lv, list, top);
    }
    for (let i = o.from; i < o.to; i++) {
      const c = o.cols[i], sym = c.items.get(lv);
      if (!sym) continue;
      const X = o.xs[i] + (dxMap ? (dxMap.get(sym) || 0) : 0);
      const rdy = restDyMap ? (restDyMap.get(sym) || 0) : 0;
      if (!skipSet || !skipSet.has(sym)) out += symSvg(sym, X, top, lShow, suppressMark, rdy);
      if (lShowLyr && sym.text && st.dashes !== 'off') {
        out += `<text class="lyr" data-s="${sym.id}" x="${f(X + sym.hw / 2 + sym.lyo)}" y="${f(lyrY)}" font-size="${f(lyrSize())}" text-anchor="middle">${esc(sym.text)}</text>`;
      }
    }
    let prevSyl = null;
    const syms = [];
    for (let i = o.from; i < o.to; i++) { const sym = o.cols[i].items.get(lv); if (sym) syms.push([sym, o.xs[i] + (dxMap ? (dxMap.get(sym) || 0) : 0)]); }
    if (lShowLyr && st.dashes === 'off') {
      let open = false;
      syms.forEach(([sym, X], k) => {
        if (!sym.text) return;
        if (sym.cont && open) return;
        const x = X + sym.hw / 2 + sym.lyo - sym.tw / 2;
        if (sym.cont) {
          let i = lv.syms.indexOf(sym) - 1;
          while (i >= 0 && (!lv.syms[i].text || lv.syms[i].cont)) i--;
          open = true;
          if (i >= 0 && lv.syms[i].drewAll) return;
        }
        let w = sym.text;
        for (let j = k + 1; j < syms.length; j++) { const q = syms[j][0]; if (!q.text) continue; if (!q.cont) break; w += q.text; }
        if (!sym.cont) { sym.drewAll = w === sym.word || x + sym.ww <= o.lineEnd + 1.2; if (sym.drewAll) w = sym.word; }
        out += `<text class="lyr" data-s="${sym.id}" x="${f(x)}" y="${f(lyrY)}" font-size="${f(lyrSize())}">${esc(w)}</text>`;
        open = true;
      });
    }
    if (lShowLyr) {
      for (const [sym, X] of syms) {
        if (sym.text) {
          if (prevSyl && prevSyl[0].hy) {
            const a = prevSyl[1] + prevSyl[0].hw / 2 + prevSyl[0].lyo + prevSyl[0].tw / 2, b = X + sym.hw / 2 + sym.lyo - sym.tw / 2;
            if (b - a > 0.6) out += hl((a + b) / 2 - 0.3, (a + b) / 2 + 0.3, lyrY - 0.265 * lyrSize(), 'barl', 0.1);
          }
          prevSyl = [sym, X];
        }
      }
      if (prevSyl && prevSyl[0].hy && !o.last) {
        const a = prevSyl[1] + prevSyl[0].hw / 2 + prevSyl[0].lyo + prevSyl[0].tw / 2;
        if (o.lineEnd - a > 0.8) out += hl(a + 0.3, a + 0.9, lyrY - 0.265 * lyrSize(), 'barl', 0.1);
      }
    }
    if (lShow) {
      for (let k = 0; k < syms.length; k++) {
        const [sym, X] = syms[k];
        if (sym.tieNext && !sym.rest && st.nota !== 'real') {
          const nx = syms[k + 1];
          const xa = X + sym.hw + 0.15, xb = nx ? nx[1] - 0.15 : o.lineEnd - 1.4;
          const dir = sym.stemDir === 1 ? -1 : sym.stemDir === -1 ? 1 : (sym.pos >= 4 ? -1 : 1);
          const y = top + 4 - sym.pos * 0.5 + dir * 0.9;
          out += `<path class="tie" fill="none" stroke-width="0.13" d="M${f(xa)} ${f(y)}Q${f((xa + xb) / 2)} ${f(y + dir * 0.9)} ${f(xb)} ${f(y)}"/>`;
        }
        if (sym.tup === 'start') {
          let k2 = k;
          while (k2 + 1 < syms.length && syms[k2 + 1][0].tup === 'in') k2++;
          const xa = X, xb = syms[k2][1] + syms[k2][0].hw;
          let lo = 0;
          for (let q = k; q <= k2; q++) lo = Math.min(lo, extent(syms[q][0])[0]);
          out += `<text x="${f((xa + xb) / 2)}" y="${f(top + lo - 0.5)}" font-size="1.7" text-anchor="middle" font-style="italic">3</text>`;
        }
      }
    }
    out += ligOut;
    /* Beta extensions: original text, explicit custos, lacunae, annotations, variant brackets, plainchant incipits */
    const ext = ensureExt(piece);
    const colX = t => {
      for (let i = o.from; i < o.to; i++) if (o.cols[i].t >= t - EPS) return o.xs[i];
      return x1 - 2.0;
    };
    if (lShowLyr && st.origText === 'on') {
      const origY = lyrY + lyrSize() * 1.08;
      for (const [sym, X] of syms) {
        if (sym.origText) out += `<text class="orig-lyr" data-s="${sym.id}" x="${f(X + sym.hw / 2 + sym.lyo)}" y="${f(origY)}" font-size="${f(lyrSize() * 0.88)}" text-anchor="middle">${esc(sym.origText)}</text>`;
      }
    }
    if (lShow && ext.custos.length) {
      for (const cu of ext.custos) {
        if (cu.vi === lv.idx && cu.t >= o.t0 - EPS && cu.t <= o.tEnd + EPS) {
          out += custosSvg({pos: cu.step - CLEFS[clef].bottom}, colX(cu.t), top);
        }
      }
    }
    if (lShow && ext.lacunae.length) {
      for (const lac of ext.lacunae) {
        const lEnd = rt(lac.t + (lac.d || 2));
        if (lac.vi === lv.idx && lEnd > o.t0 + EPS && lac.t < o.tEnd - EPS) {
          const xa = Math.max(x0 + 2, colX(Math.max(lac.t, o.t0)) - 0.3);
          const xb = Math.min(x1 - 0.5, Math.max(xa + 3.2, colX(Math.min(lEnd, o.tEnd)) - 0.2));
          out += `<g class="lacuna"><rect x="${f(xa)}" y="${f(top - 0.2)}" width="${f(xb - xa)}" height="4.4" rx="0.25"/><text x="${f((xa + xb) / 2)}" y="${f(top + 2.35)}" font-size="1.25" text-anchor="middle">${esc(lac.label || '[lacuna]')}</text></g>`;
        }
      }
    }
    if (lShow && st.ann !== 'off' && ext.ann.length) {
      ext.ann.forEach((an, ai) => {
        if (an.vi === lv.idx && an.t >= o.t0 - EPS && an.t <= o.tEnd + EPS) {
          const ax = colX(an.t) + 0.5, ay = top - 1.5;
          out += `<g class="ann-badge" data-ann="${esc(an.id || String(ai))}"><title>${esc(an.text)}</title><rect x="${f(ax - 0.75)}" y="${f(ay - 0.95)}" width="1.5" height="1.25" rx="0.25"/><text x="${f(ax)}" y="${f(ay)}" font-size="0.95" text-anchor="middle">${ai + 1}</text></g>`;
        }
      });
    }
    if (lShow && ext.variants.length) {
      for (const vr of ext.variants) {
        if (vr.vi === lv.idx && vr.endT > o.t0 + EPS && vr.t < o.tEnd - EPS) {
          const xa = Math.max(x0 + 2, colX(Math.max(vr.t, o.t0)) - 0.2);
          const xb = Math.min(x1 - 0.5, Math.max(xa + 2.0, colX(Math.min(vr.endT, o.tEnd))));
          const by = top - 1.1;
          out += `<g class="var-br"><path fill="none" stroke-width="0.11" stroke-dasharray="0.4 0.3" d="M${f(xa)} ${f(by + 0.4)}V${f(by)}H${f(xb)}V${f(by + 0.4)}"/><text x="${f((xa + xb) / 2)}" y="${f(by - 0.25)}" font-size="0.88" text-anchor="middle">${esc(ext.activeVer || 'var')}</text></g>`;
        }
      }
    }
    if (drawCustos && !o.last && lShow) { const nx = nextSym(lv, o.tEnd); if (nx) out += custosSvg(nx, x1 - 2.0, top); }
    return out;
  };
  if (o.group && o.group.length > 1) {
    const grp = o.group, dxMap = new Map(), restDyMap = new Map(), skipSet = new Set();
    for (let i = o.from; i < o.to; i++) {
      const items = [];
      grp.forEach((gv, gi) => {
        const sym = o.cols[i].items.get(gv);
        if (!sym) return;
        if (gv.subOf >= 0 && sym.rest && !subActiveAt(gv, sym.t)) { skipSet.add(sym); return; }
        items.push([gi, sym]);
      });
      if (items.length < 2) {
        if (items.length === 1 && items[0][1].rest) {
          const gi = items[0][0];
          restDyMap.set(items[0][1], gi === 0 ? -1.1 : gi === grp.length - 1 ? 1.1 : 0);
        }
        continue;
      }
      const notes = items.filter(([, sym]) => !sym.rest), rests = items.filter(([, sym]) => sym.rest);
      if (rests.length === items.length && rests.every(([, r]) => r.g === rests[0][1].g)) {
        for (let k = 1; k < rests.length; k++) skipSet.add(rests[k][1]);
      } else {
        for (const [gi, r] of rests) restDyMap.set(r, gi === 0 ? -1.15 : gi === grp.length - 1 ? 1.15 : 0);
      }
      for (let a = 0; a < notes.length; a++) {
        for (let b = a + 1; b < notes.length; b++) {
          const sa = notes[a][1], sb = notes[b][1];
          const diff = Math.abs(sa.pos - sb.pos);
          if (diff === 1 || (diff === 0 && (sa.glyph !== sb.glyph || sa.col !== sb.col))) {
            dxMap.set(sb, Math.max(dxMap.get(sb) || 0, sa.hw * (diff === 1 ? 0.85 : 0.95)));
          }
        }
      }
    }
    let sharedLyrDrawn = false;
    grp.forEach((gv, gi) => {
      const sh = vis(gv.idx);
      let lShowLyr = false, ly = o.lyrY;
      if (sh.lyr) {
        if (o.diffLyr) {
          if (gi === 0) { lShowLyr = true; ly = o.lyrTopY; }
          else if (gi === grp.length - 1) { lShowLyr = true; ly = o.lyrY; }
        } else if (!sharedLyrDrawn && gv.syms.some(q => q.text)) {
          lShowLyr = true; ly = o.lyrY; sharedLyrDrawn = true;
        }
      }
      s += drawLayer(gv, sh.notes, lShowLyr, ly, dxMap, restDyMap, skipSet, gi === 0, gi > 0);
    });
  } else {
    s += drawLayer(v, o.showNotes, o.showLyr, o.lyrY, null, null, null, true, false);
  }
  return s;
}

/* barlines for a group of staves at column x */
/* segs: the stretches between the staves where a line may run (the lyrics are left clear) */
function barSvg(type, x, tops, single, segs){
  let s = '';
  const style = st.bars, y0 = staffTopOff(), y1 = staffBotOff();
  /* barlines stand in each staff only, never in the space between the staves */
  if (type === 'double') {
    for (const t of tops) { s += vl(x - 0.25, t + y0, t + y1, 'barl', 0.14) + vl(x + 0.25, t + y0, t + y1, 'barl', 0.14); }
    return s;
  }
  /* a section line: a full single line through every staff, whatever the barline style */
  if (type === 'sec') { for (const t of tops) s += vl(x, t + y0, t + y1, 'barl', 0.14); return s; }
  if (style === 'none') return '';
  if (style === 'full') {
    for (const t of tops) s += vl(x, t + y0, t + y1, 'barl', 0.14);
  } else if (style === 'out') {
    /* ticks outside the staff (Samuel 2026-11-16): a short stroke just above the top line and one just below the bottom line, nothing across the staff */
    for (const t of tops) s += vl(x, t + y0 - 0.6, t + y0, 'barl', 0.12) + vl(x, t + y1, t + y1 + 0.6, 'barl', 0.12);
  } else if (style === 'tick') {
    for (const t of tops) s += vl(x, t + y0 - 0.5, t + y0 + 0.5, 'barl', 0.12);   /* one space, across the top line */
  }
  return s;
}
/* the place to click a section line or double bar (to make it single or double, or take it away) */
function secHit(t, x, tops){ const y0 = staffTopOff(), y1 = staffBotOff(); return `<rect class="sechit" data-t="${t}" x="${f(x - 0.6)}" y="${f(tops[0] + y0 - 0.5)}" width="1.2" height="${f(tops[tops.length - 1] + y1 + 0.5 - (tops[0] + y0) + 0.5)}"/>`; }
function finalBar(x, tops){
  let s = '';
  const y0 = staffTopOff(), h = staffBotOff() - y0;
  for (const t of tops) s += `<rect class="ink" x="${f(x)}" y="${f(t + y0)}" width="0.16" height="${f(h)}"/><rect class="ink" x="${f(x + 0.4)}" y="${f(t + y0)}" width="0.5" height="${f(h)}"/>`;
  return s;
}

/* ------------------------------------------------------------------ */
/* Systems: a set of voices laid out together, line by line            */
/* ------------------------------------------------------------------ */
function headerW(v){
  const k = keySig(v, 0, v.clef).length;
  const cw = Math.max(clefW(v.clef), ...v.clefs.filter(m => m.t > EPS && KERN_CLEF[m.c]).map(m => clefW(KERN_CLEF[m.c])));
  return 0.5 + cw + 0.5 + k * 1.0 + 0.6;
}
/* build lines for voices over [a,b) at width W; returns lines with x positions */
function buildLines(vlist, a, b, W, opts = {}){
  const lyrOn = v => vis(v.idx).lyr;
  const cols = columns(vlist, a, b, lyrOn);
  if (!cols.length && APP.emptyStaves) cols.push({t: 0, items: new Map(), bar: null, left: 0, right: 24, x: 0, clean: true});
  if (!cols.length) return [];
  const hw = Math.max(...vlist.map(headerW));
  const emptyAll = vlist.every(v => !v.events.length);   /* nothing written yet: the staves run the whole width */
  const indent = opts.indent || 0;
  const avail = W - hw;
  const br = breakLines(cols, avail, avail - indent);
  const allEnd = b >= piece.end - EPS;
  return br.map((L, li) => {
    const ind = li === 0 ? indent : 0;
    const startX = ind + hw + cols[L.from].left;
    const last = li === br.length - 1;
    const lastCol = cols[L.to - 1];
    const natural = lastCol.x - cols[L.from].x;
    const room = W - ind - hw - cols[L.from].left - lastCol.right - (last && allEnd ? 1.6 : 2.4);
    let k = natural > 0 ? room / natural : 1;
    if (last && (k > 1.3 || opts.ragged)) k = 1;
    if (last && opts.raggedLast) k = Math.min(k, 1);
    const xs = [];
    for (let i = L.from; i < L.to; i++) xs[i] = startX + (cols[i].x - cols[L.from].x) * k;
    const endX = last ? (allEnd ? xs[L.to - 1] + lastCol.right + 1.2 : Math.max(xs[L.to - 1] + lastCol.right + 2.4, opts.ragged ? 0 : W)) : W;
    return {cols, from: L.from, to: L.to, xs, x0: ind, x1: last && !opts.fullLast && !emptyAll ? Math.min(W, endX + (allEnd ? 0.9 : 0)) : W, last, W, endsPiece: last && allEnd, t0: cols[L.from].t, tEnd: L.to < cols.length ? cols[L.to].t : b};
  });
}
/* vertical room a voice needs in a line */
const CUTTABLE = {M: 1, Mc: 1, L: 1, Lc: 1, Mx: 1, Mxc: 1};   /* stems without a flag: they may be drawn shorter where they would hit something */
const STEM_MIN = 2.2;
function lineRoom(v, line){
  const m = Math.min(1, st.vs), pad = 0.05 + 0.25 * m, base = 0.05 + 0.7 * m;
  const n = Math.max(1, line.to - line.from);
  /* per column how far the music reaches above and below the staff (so a neighbouring staff only keeps clear where something really is).
     kind: 'full' stems at their length, 'short' stems that may be cut at the shortest they may be, 'base' without those stems */
  const tEnd = line.tEnd !== undefined ? line.tEnd : line.to < line.cols.length ? line.cols[line.to].t : null;
  const nx = tEnd !== null && !line.endsPiece ? nextSym(v, tEnd) : null;
  const stTop = Math.min(0, 5 - staffLinesN());
  const build = kind => {
    const lo = Array(n).fill(stTop - base), hi = Array(n).fill(4 + base);
    const up = (i, y) => { lo[i] = Math.min(lo[i], y); }, dn = (i, y) => { hi[i] = Math.max(hi[i], y); };
    /* the custos at the line end, pointing at the next note */
    if (nx && !nx.rest && nx.pos !== null && nx.pos !== undefined) { const y = 4 - nx.pos * 0.5; up(n - 1, y - 1.9 - pad); dn(n - 1, y + 1.9 + pad); }
    /* the clef and the key signature at the line start */
    up(0, -1.3 - pad);
    for (const k of keySig(v, line.cols[line.from].t, lineClef(v, line.cols[line.from].t))) { const y = 4 - k.pos * 0.5; up(0, y - (/fl/.test(k.g) ? 2.1 : 1.6) - pad); dn(0, y + 1.6 + pad); }
    for (let i = line.from; i < line.to; i++) {
      const s = line.cols[i].items.get(v);
      if (!s) continue;
      const cut = CUTTABLE[s.glyph] && !s.ligSvg;
      const e = extent(s, kind === 'full' || !cut ? 3.6 : kind === 'short' ? STEM_MIN : 0);
      up(i - line.from, e[0] - pad); dn(i - line.from, e[1] + pad);
    }
    /* a note's reach counts for its neighbours too */
    return [lo.map((x, i) => Math.min(x, lo[i - 1] ?? 0, lo[i + 1] ?? 0)), hi.map((x, i) => Math.max(x, hi[i - 1] ?? 0, hi[i + 1] ?? 0))];
  };
  const [lo2, hi2] = build('full'), [loS, hiS] = build('short'), [loB, hiB] = build('base');
  /* what the lyric row has to clear: not a stem that its syllable stands beside, nor one on a note without a syllable */
  const hiTxt = Array(n).fill(4 + base);
  for (let i = line.from; i < line.to; i++) { const s = line.cols[i].items.get(v); if (s) hiTxt[i - line.from] = Math.max(hiTxt[i - line.from], extent(s, 0)[1] + pad); }
  const txt2 = hiTxt.map((x, i) => Math.max(x, hiTxt[i - 1] ?? 0, hiTxt[i + 1] ?? 0));
  let above = -Math.min(...lo2), below = Math.max(...hi2) - 4;
  const lyr = vis(v.idx).lyr && v.syms.some(s => s.text);
  const ls = lyrSize(), lyrExtra = Math.max(0, ls - 1.7) * 0.75, lyrDesc = 0.41 * ls;
  const lyrY = Math.max(4 + 1.5 + 1.1 * m, 4 + (Math.max(...txt2) - 4) + 0.9 + 0.6 * m) + lyrExtra;
  if (lyr) {
    /* the lyric row only claims room where a syllable (or its dash) really stands, so a neighbouring staff's stems may pass the empty stretches of the row */
    const hit = new Array(n).fill(!line.xs), sy = [];
    if (line.xs) for (let i = line.from; i < line.to; i++) { const q = line.cols[i].items.get(v); if (q && q.text) sy.push([q, line.xs[i]]); }
    sy.forEach(([q, X], k) => {
      const cx = X + q.hw / 2 + q.lyo;
      let lo = cx - q.tw / 2 - 0.4, hiX = cx + q.tw / 2 + 0.4;
      if (q.ww && st.dashes === 'off') hiX = Math.max(hiX, X + q.hw / 2 + q.lyo - q.tw / 2 + q.ww + 0.4);
      if (q.hy && k + 1 < sy.length) { const [r, X2] = sy[k + 1]; hiX = Math.max(hiX, X2 + r.hw / 2 + r.lyo - r.tw / 2); }
      else if (q.hy) hiX = line.x1;
      for (let j = line.from; j < line.to; j++) { const mx = line.xs[j] + 0.65; if (mx >= lo && mx <= hiX) hit[j - line.from] = true; }
    });
    for (const H of [hi2, hiS, hiB]) for (let i = 0; i < n; i++) if (hit[i] || hit[i - 1] || hit[i + 1]) H[i] = Math.max(H[i], lyrY + lyrDesc);
    below = Math.max(lyrY + lyrDesc, ...hi2) - 4;
  }
  return {above, below, lyrY, lo: lo2, hi: hi2, loS, hiS, loB, hiB};
}
function nextSym(v, t){
  return v.syms.find(s => s.t >= t - EPS) || null;
}
/* Bar numbers (Samuel 2026-11-15): Engraving > Bar numbers (Off, at the start of every line, every bar, every 2, 4, 5 or 10)
   counted in barlines or in a value chosen (semibreve, breve, perfect breve, long, perfect long, or the breve of the
   mensuration sign). They stand at the place in time, so they work with the barlines hidden or with none at all. */
const BAR_STARTS = new WeakMap();
function barStarts(){
  const key = st.bunit || 'bar', c = BAR_STARTS.get(piece);
  if (c && c.key === key) return c.list;
  const end = piece.end, list = [0];
  const fixed = {S: 1, B: 2, Bp: 3, L: 4, Lp: 9}[key];
  if (fixed) for (let t = fixed; t < end - EPS; t = rt(t + fixed)) list.push(t);
  else if (key === 'bar' && piece.bars.length) for (const b of piece.bars) { if (b.t > EPS && b.t < end - EPS && !eq(b.t, list[list.length - 1])) list.push(b.t); }
  else {
    /* the breve of the sign in the highest voice (perfect under O, imperfect under C), from every change of sign */
    const v = piece.voices[0], cuts = [...new Set([0, ...v.mets.map(m => rt(m.t))])].sort((a, b) => a - b);
    cuts.forEach((a, i) => {
      const b = i + 1 < cuts.length ? cuts[i + 1] : end, mi = mensInfo(metAt(v, a)), per = valueTable(mi.T, mi.P, mi.M, mi.X)[2][1] / mi.p;
      if (a > EPS && !eq(a, list[list.length - 1])) list.push(a);
      for (let t = rt(a + per); t < b - EPS; t = rt(t + per)) list.push(t);
    });
  }
  BAR_STARTS.set(piece, {key, list});
  return list;
}
/* the numbers a line shows: [{n, t, ci, x, start}] (ci: the column under it, for the room above the staff) */
function barNumbersFor(line){
  if (!st.bnum || st.bnum === 'off' || !piece) return [];
  const L = barStarts(), out = [];
  const t0 = line.t0, t1 = line.tEnd !== undefined ? line.tEnd : Infinity, cols = line.cols;
  const at = t => {
    let i = line.from; while (i + 1 < line.to && cols[i + 1].t <= t + EPS) i++;
    const c = cols[i];
    if (eq(c.t, t)) return {ci: i - line.from, x: line.xs[i] - c.left - (st.bars === 'full' ? 0.85 : 0.6)};
    /* inside a note: between its column and the next, in proportion to the time */
    const nx = i + 1 < line.to ? line.xs[i + 1] : line.x1, nt = i + 1 < line.to ? cols[i + 1].t : t1;
    return {ci: i - line.from, x: line.xs[i] + (nx - line.xs[i]) * Math.min(1, (t - c.t) / Math.max(EPS, nt - c.t))};
  };
  if (st.bnum === 'line') {
    if (t0 < EPS) return [];
    let n = 0; for (const t of L) if (t <= t0 + EPS) n++;
    return [{n, t: t0, ci: 0, x: line.x0 + 0.15, start: true}];
  }
  const every = +st.bnum || 1;
  L.forEach((t, k) => {
    const n = k + 1;
    if (n === 1 || n % every || t < t0 - EPS || t >= t1 - EPS) return;
    if (eq(t, t0)) out.push({n, t, ci: 0, x: line.x0 + 0.15, start: true});
    else out.push(Object.assign({n, t}, at(t)));
  });
  return out;
}
/* how high a bar number stands above a staff (from its top line), given what the music has there */
const barNumY = (room, ci) => Math.min(-0.9, room.lo[ci] ?? -0.9) - 0.45;
function sectionLabels(line, top, W){
  let s = '';
  for (const sec of piece.sections) {
    if (sec.t < line.t0 - EPS || sec.t >= line.tEnd - EPS) continue;
    let i = line.cols.findIndex((c, k) => k >= line.from && k < line.to && c.t >= sec.t - EPS);
    if (i < 0) continue;
    const x = sec.t < EPS ? line.x0 : line.xs[i] - 0.5;
    if (/^[A-Z0-9]{1,3}$/.test(sec.label)) { const w = textW(sec.label, 1.9, false) + 0.9; s += `<g class="seclab" data-t="${sec.t}"><rect x="${f(x - 0.2)}" y="${f(top - 1.55)}" width="${f(w)}" height="2.2" fill="transparent" stroke="currentColor" stroke-width="0.14"/><text x="${f(x + 0.25)}" y="${f(top)}" font-size="1.9">${esc(sec.label)}</text></g>`; }
    else s += `<text class="seclab" data-t="${sec.t}" x="${f(x)}" y="${f(top)}" font-size="1.9" font-style="italic">${esc(sec.label)}</text>`;
  }
  return s;
}
/* Incipit: the clef, mensuration sign and first notes of every voice as the piece was when it was opened (original clefs and
   values), set before the staves of the first system (Add > Add incipit) */
const INC = {key: null, snap: null};
function incipitSnap(){
  try {
    INC.key = pieceKey;
    INC.snap = piece.voices.map(v => ({
      clef: v.oclef && CLEFS[KERN_CLEF[v.oclef]] ? KERN_CLEF[v.oclef] : KERN_CLEF[v.kclef] || 'treble',
      mens: metAt(v, 0), key: Object.assign({}, keyAt(v, 0)),
      notes: (() => { const out = []; let n = 0; for (const q of v.syms || []) { if (n >= 5 || out.length >= 9) break; out.push({rest: !!q.rest, step: q.step, alt: q.alt, glyph: q.glyph, g: q.g, hw: q.hw, dot: !!q.dot}); if (!q.rest) n++; } return out; })()
    }));
  } catch (e) { INC.snap = null; }
  if (incipitOn()) render();
}
function incipitOn(){ return !!(piece && INC.snap && INC.key === pieceKey && (st.inc || {})[pieceKey] && INC.snap.length === piece.voices.length); }
const incAcc = (n, q) => { if (n.rest || n.alt === null || n.alt === undefined) return null; const a = Math.max(-1, Math.min(1, n.alt)); return a !== (q.key[LETTERS[((n.step % 7) + 7) % 7]] || 0) ? ACCG[a] : null; };
function incipitW(){
  let w = 0;
  for (const q of INC.snap) {
    let x = 0.4 + gw(CLEFS[q.clef].g) + 0.5 + (q.mens ? mensW(q.mens) + 0.6 : 0);
    for (const n of q.notes) { const a = incAcc(n, q); x += (a ? gw(a) + 0.35 : 0) + n.hw + 1.1; }
    w = Math.max(w, x);
  }
  return w + 1.6;
}
function incipitSvg(q, x0, top){
  if (!q) return '';
  const C = CLEFS[q.clef], W = incipitW() - 1.2;
  let o = '';
  for (let k = 5 - staffLinesN(); k < 5; k++) o += hl(x0, x0 + W, top + k, 'staff', 0.12);
  let x = x0 + 0.4;
  o += clefSvg(q.clef, x, top); x += gw(C.g) + 0.5;
  if (q.mens) { o += mensSvg(q.mens, x, top); x += mensW(q.mens) + 0.6; }
  for (const n of q.notes) {
    if (n.rest) { o += restSvg(n, x + n.hw / 2, top); x += n.hw + 1.1; continue; }
    const pos = n.step - C.bottom, y = top + 4 - pos * 0.5, a = incAcc(n, q);
    if (a) { o += use(a, x, y); x += gw(a) + 0.35; }
    o += ledgers(pos, x, n.hw, top) + use(n.glyph, x, y);
    if (n.dot) o += `<circle class="ink" cx="${f(x + n.hw + 0.4)}" cy="${f(top + 4 - (pos % 2 === 0 ? pos + 1 : pos) * 0.5)}" r="0.19"/>`;
    x += n.hw + 1.1;
  }
  return `<g class="incipit">${o}</g>`;
}
function groupLyricsDiffer(voices, line){
  if (voices.length < 2) return false;
  const topV = voices[0], botV = voices[voices.length - 1];
  const topOn = vis(topV.idx).lyr, botOn = vis(botV.idx).lyr;
  if (!topOn || !botOn) return false;
  let anyTop = false, anyBot = false, diff = false;
  for (let i = line.from; i < line.to; i++) {
    const a = line.cols[i].items.get(topV), b = line.cols[i].items.get(botV);
    const ta = a && a.text ? a.text : '', tb = b && b.text ? b.text : '';
    if (ta) anyTop = true;
    if (tb) anyBot = true;
    if (ta !== tb) diff = true;
  }
  return anyTop && anyBot && diff;
}
function groupRoom(grp, line){
  if (grp.voices.length === 1) return lineRoom(grp.voices[0], line);
  const rs = grp.voices.map(v => lineRoom(v, line));
  const n = rs[0].lo.length;
  const lo = new Array(n), hi = new Array(n), loS = new Array(n), hiS = new Array(n), loB = new Array(n), hiB = new Array(n);
  for (let i = 0; i < n; i++) {
    lo[i] = Math.min(...rs.map(r => r.lo[i]));
    hi[i] = Math.max(...rs.map(r => r.hi[i]));
    loS[i] = Math.min(...rs.map(r => r.loS[i]));
    hiS[i] = Math.max(...rs.map(r => r.hiS[i]));
    loB[i] = Math.min(...rs.map(r => r.loB[i]));
    hiB[i] = Math.max(...rs.map(r => r.hiB[i]));
  }
  let above = Math.max(...rs.map(r => r.above));
  const below = Math.max(...rs.map(r => r.below));
  const lyrY = Math.max(...rs.map(r => r.lyrY));
  const diffLyr = groupLyricsDiffer(grp.voices, line);
  let lyrTopY = 0;
  if (diffLyr) {
    const ls = lyrSize();
    lyrTopY = -(above + 0.55);
    const topEdge = lyrTopY - ls;
    above = Math.max(above, -topEdge + 0.3);
    for (let i = 0; i < n; i++) { loS[i] = Math.min(loS[i], topEdge); loB[i] = Math.min(loB[i], topEdge); }
  }
  return {above, below, lyrY, lyrTopY, diffLyr, lo, hi, loS, hiS, loB, hiB};
}
/* draw one system (several voices stacked, or combined onto shared staves) at y; returns {svg, h} */
function drawSystem(vlist, line, y, opts = {}){
  const groups = (st.view === 'score' || vlist.some(v => v.subOf >= 0)) ? staffGroups(vlist) : vlist.map(v => ({id: v.idx, voices: [v]}));
  const rooms = groups.map(grp => groupRoom(grp, line));
  const gap = Math.max(0.3, 0.5 * st.vs);
  const tops = [];
  let yy = y;
  const secRoom = piece.sections.some(sec => sec.t >= line.t0 - EPS && sec.t < line.tEnd - EPS) ? 2.6 : 0;
  yy += secRoom;
  /* the distance each staff needs from the one above: only where both have something in the same place (or, with equal distances, the largest of them for every pair) */
  const need = groups.map((grp, k) => {
    if (!k) return 0;
    const A = rooms[k - 1], B = rooms[k];
    let d = 0;
    for (let i = 0; i < A.hiS.length; i++) d = Math.max(d, (A.hiS[i] - 4) + -B.loS[i]);
    return d + gap;
  });
  /* bar numbers: above the top staff, or above every staff; they get room of their own where the music leaves none */
  const bnums = barNumbersFor(line), bnAll = st.bpos === 'all' && groups.length > 1;
  if (bnums.length && bnAll) groups.forEach((grp, k) => { if (k) for (const q of bnums) need[k] = Math.max(need[k], (rooms[k - 1].hiS[q.ci] ?? 4) - 4 - barNumY(rooms[k], q.ci) + 1.4); });
  if (st.eq === 'on' && groups.length > 1) { const D = Math.max(...need.slice(1)); for (let k = 1; k < need.length; k++) need[k] = D; }
  if (bnums.length) yy += Math.max(0, Math.max(...bnums.map(q => -barNumY(rooms[0], q.ci) + 1.4)) - rooms[0].above);
  yy += rooms[0].above;
  groups.forEach((grp, k) => {
    if (k) yy += need[k] + 4;
    tops.push(yy);
  });
  yy += 4 + rooms[groups.length - 1].below;
  /* stems that would reach into what the neighbouring staff has at that place (its notes, accidentals or lyrics) are drawn shorter, not the staves further apart */
  for (const v of vlist) for (let i = line.from; i < line.to; i++) { const q = line.cols[i].items.get(v); if (q) q.cut = 0; }
  groups.forEach((grp, k) => {
    for (const v of grp.voices) {
      for (let i = line.from; i < line.to; i++) {
        const q = v.syms && line.cols[i].items.get(v);
        if (!q || q.rest || q.pos === null || q.pos === undefined || !CUTTABLE[q.glyph] || q.ligSvg) continue;
        const ci = i - line.from, y = 4 - q.pos * 0.5, upStem = isFlipped(q) ? !!TAILED[q.g] : !!STEMMED[q.g];
        const max = 3.544 - STEM_MIN;
        if (upStem && k > 0) { const floor = tops[k - 1] + rooms[k - 1].hiB[ci] + 0.1, tip = tops[k] + y - 3.544; if (tip < floor) q.cut = Math.min(max, floor - tip); }
        else if (!upStem && k + 1 < groups.length) { const ceil = tops[k + 1] + rooms[k + 1].loB[ci] - 0.1, tip = tops[k] + y + 3.544; if (tip > ceil) q.cut = Math.min(max, tip - ceil); }
      }
    }
  });
  let s = '';
  if (secRoom) s += sectionLabels(line, tops[0] - rooms[0].above - 0.4, line.x1);
  groups.forEach((grp, k) => {
    const v = grp.voices[0], sh = vis(v.idx);
    let k0 = null, k1 = null;
    for (let ci = line.from; ci < line.to; ci++) { const q = line.cols[ci].items.get(v); if (q) { const kk = +q.id.split('-')[1]; if (k0 === null) k0 = kk; k1 = kk; } }
    s += staffLine({v, group: grp.voices.length > 1 ? grp.voices : null, k0, k1, cols: line.cols, from: line.from, to: line.to, xs: line.xs, top: tops[k], x0: line.x0, x1: line.x1,
      last: line.endsPiece, tail: line.last ? line.W : null, t0: line.t0, showNotes: sh.notes, showLyr: sh.lyr, lyrY: tops[k] + rooms[k].lyrY, lyrTopY: tops[k] + (rooms[k].lyrTopY || 0), diffLyr: !!rooms[k].diffLyr, lineEnd: line.x1,
      next: nextSym(v, line.tEnd), tEnd: line.tEnd});
    if (opts.inc && grp.voices.length === 1) s += incipitSvg(INC.snap[v.idx], line.x0 - opts.inc, tops[k]);
    if (opts.names) {
      const nX = line.x0 - 0.8 - (opts.inc || 0);
      if (grp.voices.length === 1) {
        const vi = vlist.indexOf(v);
        if (vi >= 0 && opts.names[vi]) s += `<text class="vnamehit" data-v="${v.idx}" x="${f(nX)}" y="${f(tops[k] + 2.6)}" font-size="1.8" text-anchor="end" font-style="italic">${esc(opts.names[vi])}</text>`;
      } else {
        const gn = grp.voices.filter(gv => !(gv.subOf >= 0)).map(gv => ({v: gv, name: opts.names[vlist.indexOf(gv)] || ''})).filter(x => x.name);
        const step = Math.min(2.1, 4.4 / Math.max(1, gn.length));
        const y0 = tops[k] + 2.6 - (gn.length - 1) * step * 0.5;
        gn.forEach((item, idx) => {
          s += `<text class="vnamehit" data-v="${item.v.idx}" x="${f(nX)}" y="${f(y0 + idx * step)}" font-size="1.65" text-anchor="end" font-style="italic">${esc(item.name)}</text>`;
        });
      }
    }
  });
  /* barlines */
  const single = groups.length === 1;
  const segs = [];
  for (let k = 0; k + 1 < groups.length; k++) {
    const a = tops[k] + 4, b = tops[k + 1];
    const hasLyr = groups[k].voices.some(gv => vis(gv.idx).lyr && gv.syms.some(q => q.text));
    if (hasLyr) { const ly = tops[k] + rooms[k].lyrY, ls = lyrSize(); segs.push([[a, ly - ls], [ly + 0.41 * ls, b]]); }
    else segs.push([[a, b]]);
  }
  for (let i = line.from; i < line.to; i++) {
    const c = line.cols[i];
    if (!c.bar || i === line.from) continue;
    /* a tick stands midway between the notes, in the room they already have */
    const pc = i > 0 ? line.cols[i - 1] : null;
    const strong = c.bar === 'double' || c.bar === 'sec';
    const bx = (st.bars === 'tick' || st.bars === 'out') && !strong && pc ? (line.xs[i - 1] + pc.right + line.xs[i] - c.left) / 2 : line.xs[i] - c.left - (st.bars === 'full' || strong ? 0.85 : 0.6);
    s += barSvg(c.bar, bx, tops, single, segs);
    if (strong) s += secHit(c.t, bx, tops);
  }
  /* a barline that falls on the line break goes at the line end */
  if (!line.endsPiece) {
    const br = piece.bars.find(b => eq(b.t, line.tEnd));
    if (br && (br.type === 'double' || br.type === 'sec')) { s += barSvg(br.type, line.x1 - 0.4, tops, single, segs); s += secHit(br.t, line.x1 - 0.4, tops); }
  }
  if (line.endsPiece) s += finalBar(line.x1 - 0.9, tops);
  for (const q of bnums) (bnAll ? tops : tops.slice(0, 1)).forEach((top, k) => {
    s += `<text class="barnum" x="${f(q.x)}" y="${f(top + barNumY(rooms[k], q.ci))}" font-size="1.6" font-style="italic" text-anchor="${q.start ? 'start' : 'middle'}">${q.n}</text>`;
  });
  /* left edge: a thin line joining the staves in score */
  if (groups.length > 1 && opts.join) s += vl(line.x0, tops[0] + staffTopOff(), tops[tops.length - 1] + staffBotOff(), 'barl', 0.14);
  return {svg: s, h: yy - y, tops};
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */
const PAPER = {A3: [297, 420], A4: [210, 297], A5: [148, 210]};
/* Choirbook on the Web: every page is as big as the frame (half of it, an opening being two pages) and the music is cut to fit; the arrows turn the page */
const webFit = () => st.paper === 'web' && st.view === 'choir';
const isHoriz = () => webFit() || (st.flow === 'horizontal' && st.paper !== 'web');
function frameSize(){
  const w = ($('.viewwrap').clientWidth || window.innerWidth) - (window.innerWidth <= 700 ? 60 : 40);
  const h = Math.max(320, (wrapEl.classList.contains('fs') ? window.innerHeight : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) || 700) - 60);
  return [Math.max(240, w), h];
}
/* ?example=1 (an example shown in Samuel's Musical Lexicon): one very wide, tall page, so the music stays on a single line;
   the page around crops it to the notes and scales it down to the room it has */
const EXAMPLE_MODE = /[?&]example=1/.test(location.search);
function pageGeom(){
  if (EXAMPLE_MODE) { const sp = st.size, w = 20000, h = 1500; return {wmm: w, hmm: h, sp, W: w / sp, H: h / sp, M: 210 * 0.065 / sp}; }
  if (webFit()) {
    const [fw, fh] = frameSize(), pw = fw >= 660 ? fw / 2 : fw, mm = 96 / 25.4;
    const w = pw / mm, h = fh / mm, sp = st.size * 1.2;
    return {fit: true, wmm: w, hmm: h, sp, W: w / sp, H: h / sp, M: Math.min(w, 297) * 0.04 / sp};
  }
  if (st.paper === 'web') {
    const avail = Math.max(240, ($('.viewwrap').clientWidth || window.innerWidth) - (window.innerWidth <= 700 ? 0 : 40));
    /* the two pages of an opening side by side, or one below the other on a narrow screen */
    const w = (st.view === 'choir' && avail >= 660 ? avail / 2 : avail) / (96 / 25.4), sp = st.size * 1.2, H = 100000;
    return {web: true, wmm: w, hmm: H * sp, sp, W: w / sp, H, M: Math.min(w, 297) * 0.04 / sp};
  }
  let [w, h] = PAPER[st.paper] || PAPER.A4;
  if (st.orient === 'landscape') [w, h] = [h, w];
  const sp = st.size * (st.paper === 'A5' ? 0.82 : st.paper === 'A3' ? 1.25 : 1);
  const m = Math.min(w, h) * 0.065;
  return {wmm: w, hmm: h, sp, W: w / sp, H: h / sp, M: m / sp};
}
/* the foot of a page: the credits on the first, the title and the page number on the others */
/* on the Web page a fixed size, about that of the lyrics (the page has no paper size to go by) */
function footFont(G){ return G.web || G.fit ? 1.6 : Math.min(G.wmm, G.hmm) * 0.0115 / G.sp; }
function wrapText(text, size, width){
  const words = text.split(/\s+/).filter(Boolean), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && textW(t, size, false) > width) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function footLines(G){
  const c = creditText(), fs = footFont(G), W = G.W - 2 * G.M;
  /* "Made with" only on real pages (A3 to A5), not on the Web page */
  return [...(c.about ? wrapText(c.about, fs, W) : []), ...(G.web ? [] : [c.made])];
}
/* how far up the first page's credits reach, so the music stops above them */
function footTop(G, first){
  const fs = footFont(G), lh = fs * 1.35, base = G.H - G.M * 0.42;
  const n = first ? Math.max(1, footLines(G).length) : 1;
  return Math.min(G.H - G.M, base - (n - 1) * lh - fs * 1.2);
}
/* Web: the page ends just below the music */
function webGeom(G, yEnd, first){
  const fs = footFont(G), lh = fs * 1.35, n = first ? Math.max(1, footLines(G).length) : 1;
  const H = yEnd + 2.8 + (n - 1) * lh + fs * 1.2 + G.M * 0.42;
  return {...G, H, hmm: H * G.sp};
}
function footSvg(G, first, num){
  const fs = footFont(G), lh = fs * 1.35, base = G.H - G.M * 0.42;
  let s = '';
  if (first) {
    const L = footLines(G);
    L.forEach((t, i) => { s += `<text class="foot" x="${f((G.titleW || G.W) / 2)}" y="${f(base - (L.length - 1 - i) * lh)}" font-size="${f(fs)}" text-anchor="middle"${t === creditText().made ? ' font-style="italic"' : ''}>${esc(t)}</text>`; });
  } else {
    const who = piece.composer ? `${piece.title}, ${piece.composer}` : piece.title;
    s += `<text class="foot" x="${f(G.M)}" y="${f(base)}" font-size="${f(fs)}" font-style="italic">${esc(who)}</text>`;
    s += `<text class="foot" x="${f(G.W - G.M)}" y="${f(base)}" font-size="${f(fs)}" text-anchor="end">${num}</text>`;
  }
  return s;
}
function pageSvg(G, body){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(G.W)} ${f(G.H)}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}
function titleBlock(G, x0, x1, y, sub){
  let s = `<text class="title texthit" data-f="title" x="${f((x0 + x1) / 2)}" y="${f(y + 3.2)}" font-size="3.4" text-anchor="middle">${esc(piece.title)}</text>`;
  let h = 4.6;
  if (sub) { s += `<text x="${f((x0 + x1) / 2)}" y="${f(y + h + 1.9)}" font-size="2.2" text-anchor="middle" font-style="italic">${esc(sub)}</text>`; h += 2.8; }
  if (piece.composer) { s += `<text class="texthit" data-f="comp" x="${f(x1)}" y="${f(y + h + 1.6)}" font-size="1.9" text-anchor="end">${esc(piece.composer)}</text>`; h += 2.4; }
  return {svg: s, h: h + 1.2};
}
function visibleVoices(){ return piece.voices.filter(v => vis(v.idx).on); }

/* ------------------------------------------------------------------ */
/* Plainchant Section Rendering Engine (4-line Gregorian square neumes)*/
/* ------------------------------------------------------------------ */
function parseGabcChant(raw){
  let src = String(raw || '').trim();
  let headerTitle = '';
  const sepIdx = src.indexOf('%%');
  if (sepIdx >= 0) {
    const hdr = src.slice(0, sepIdx);
    const nm = hdr.match(/^\s*name\s*:\s*([^;\n]+)/im);
    if (nm) headerTitle = nm[1].trim();
    src = src.slice(sepIdx + 2).trim();
  }
  const items = [];
  let clef = {type: 'c', line: 4, flat: false};
  /* Match syllable-text(neumes) pairs, or standalone (neumes/clef/bar) */
  const re = /([^()\s]*)\(([^)]*)\)|(\S+)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[3]) {
      /* bare text word without parens */
      items.push({kind: 'syl', text: m[3], groups: []});
      continue;
    }
    const text = (m[1] || '').trim();
    const inner = (m[2] || '').trim();
    /* Clef token e.g. c1..c4, f1..f4, cb3, cb4 */
    const cm = inner.match(/^([cf])(b)?([1-4])$/i);
    if (cm && !text) {
      const cObj = {type: cm[1].toLowerCase(), line: +cm[3], flat: !!cm[2]};
      if (!items.length) clef = cObj;
      else items.push({kind: 'clef', clef: cObj});
      continue;
    }
    /* Pure division bar token: , ; : :: */
    if (!text && /^[,;:]+$/.test(inner)) {
      items.push({kind: 'bar', bar: inner});
      continue;
    }
    /* Parse neume groups separated by / or ! or space */
    const parts = inner.split(/[\/!\s]+/).filter(Boolean);
    const groups = [];
    for (const part of parts) {
      if (/^[,;:]+$/.test(part)) { groups.push({bar: part}); continue; }
      const notes = [];
      let pendingAcc = '';
      for (let i = 0; i < part.length; i++) {
        const ch = part[i];
        const low = ch.toLowerCase();
        if (low >= 'a' && low <= 'm') {
          const pos = low.charCodeAt(0) - 'd'.charCodeAt(0); /* d=0 (line 1), f=2, h=4, j=6 (line 4) */
          const note = {pos, incl: ch !== low, dot: false, epiH: false, epiV: false, virga: false, acc: pendingAcc};
          pendingAcc = '';
          while (i + 1 < part.length && /[._'vxyr~<>o]/.test(part[i + 1])) {
            const mod = part[++i];
            if (mod === '.') note.dot = true;
            else if (mod === '_') note.epiH = true;
            else if (mod === "'") note.epiV = true;
            else if (mod === 'v') note.virga = true;
            else if (mod === 'x') note.acc = 'fl';
            else if (mod === 'y') note.acc = 'na';
          }
          notes.push(note);
        } else if (ch === 'x') pendingAcc = 'fl';
        else if (ch === 'y') pendingAcc = 'na';
        else if (ch === ',' || ch === ';' || ch === ':') {
          if (notes.length) { groups.push({notes: notes.slice()}); notes.length = 0; }
          let bar = ch;
          while (i + 1 < part.length && part[i + 1] === ':') bar += part[++i];
          groups.push({bar});
        }
      }
      if (notes.length) groups.push({notes});
    }
    items.push({kind: 'syl', text, groups});
  }
  return {clef, items, headerTitle};
}

function chantClefSvg(cl, x, top){
  const cy = top + (4 - cl.line); /* line 1 = top+3, line 4 = top */
  let s = '';
  if (cl.type === 'c') {
    s += `<rect class="ink" x="${f(x)}" y="${f(cy - 0.58)}" width="0.14" height="1.16"/>`;
    s += `<rect class="ink" x="${f(x)}" y="${f(cy - 0.58)}" width="0.62" height="0.28"/>`;
    s += `<rect class="ink" x="${f(x)}" y="${f(cy + 0.30)}" width="0.62" height="0.28"/>`;
  } else {
    /* Gregorian F-clef: diamond punctum on left + C-clef bars on right */
    s += `<rect class="ink" x="${f(x)}" y="${f(cy - 0.28)}" width="0.46" height="0.46"/>`;
    s += `<rect class="ink" x="${f(x + 0.38)}" y="${f(cy - 0.28)}" width="0.12" height="1.2"/>`;
    s += `<rect class="ink" x="${f(x + 0.62)}" y="${f(cy - 0.58)}" width="0.14" height="1.16"/>`;
    s += `<rect class="ink" x="${f(x + 0.62)}" y="${f(cy - 0.58)}" width="0.54" height="0.26"/>`;
    s += `<rect class="ink" x="${f(x + 0.62)}" y="${f(cy + 0.32)}" width="0.54" height="0.26"/>`;
  }
  if (cl.flat) {
    /* B-flat sits one space/line below C on c-clef */
    const fy = cy + 0.5;
    s += `<g transform="translate(${f(x + (cl.type === 'f' ? 1.35 : 0.85))} ${f(fy)}) scale(0.82)">${use('fl', 0, 0)}</g>`;
  }
  return s;
}

/* Interactive plainchant editor state: {idx: chant index, sel: {ii, gi, ni} | {ii, bar:true} | null} */
const chantEd = {idx: -1, sel: null};

function noteToGabc(n){
  const ch = String.fromCharCode('a'.charCodeAt(0) + Math.max(0, Math.min(12, n.pos + 3)));
  let s = (n.acc === 'fl' ? 'x' : n.acc === 'na' ? 'y' : '') + (n.incl ? ch.toUpperCase() : ch);
  if (n.virga) s += 'v';
  if (n.epiH) s += '_';
  if (n.epiV) s += "'";
  if (n.dot) s += '.';
  return s;
}
function serializeGabcChant(parsed){
  const parts = [];
  const cl = parsed.clef || {type: 'c', line: 4, flat: false};
  parts.push(`(${cl.type}${cl.flat ? 'b' : ''}${cl.line})`);
  for (const it of parsed.items) {
    if (it.kind === 'clef') {
      const c = it.clef;
      parts.push(`(${c.type}${c.flat ? 'b' : ''}${c.line})`);
    } else if (it.kind === 'bar') {
      parts.push(`(${it.bar})`);
    } else if (it.kind === 'syl') {
      const inner = (it.groups || []).map(g => g.bar ? g.bar : (g.notes || []).map(noteToGabc).join('')).filter(Boolean).join('/');
      if (it.text || inner) parts.push(`${it.text || ''}(${inner})`);
    }
  }
  return parts.join(' ');
}
function chantStepOf(cl, pos){
  const clefStep = cl.type === 'f' ? 24 : 28;
  return clefStep - 2 * (cl.line - 1) + pos;
}

function drawChantSystem(chant, chantIdx, W, y){
  const parsed = parseGabcChant(chant.gabc || '');
  const title = chant.title || parsed.headerTitle || 'Plainchant';
  const centered = chant.align === 'center';
  const ls = lyrSize(), lf = lyrFontCss();
  const PW = 0.62, PH = 0.52; /* square punctum width & height in staff spaces */
  const clefWCh = cl => (cl.type === 'f' ? 1.55 : 1.0) + (cl.flat ? 0.9 : 0) + 0.7;

  /* Measure each item's width (preserving original item index ii for interactive editing) */
  const measureGroup = g => {
    if (g.bar) return g.bar === '::' ? 1.1 : 0.85;
    const ns = g.notes || [];
    if (!ns.length) return 0;
    let w = 0;
    for (let i = 0; i < ns.length; i++) {
      if (ns[i].acc) w += 0.75;
      if (i > 0 && ns[i].pos > ns[i - 1].pos && ns.length === 2) {
        /* podatus: stacked vertically, no extra x */
      } else {
        w += i === 0 ? PW : PW * 0.92;
      }
      if (ns[i].dot) w += 0.45;
    }
    return w;
  };
  const measured = parsed.items.map((it, ii) => {
    if (it.kind === 'clef') return {...it, ii, w: clefWCh(it.clef) + 0.5};
    if (it.kind === 'bar') return {...it, ii, w: it.bar === '::' ? 0.9 : 0.85};
    let nw = 0;
    it.groups.forEach((g, gi) => { nw += measureGroup(g) + (gi > 0 ? 0.48 : 0); });
    const tw = it.text ? textW(it.text.replace(/-$/, ''), ls, false, lf) : 0;
    const w = Math.max(nw, tw, 0.9) + 0.85;
    return {...it, ii, w, nw, tw};
  });

  /* Wrap items across 4-line staves of width W */
  const lines = [];
  let curClef = parsed.clef;
  let curLine = {clef: curClef, items: [], x: clefWCh(curClef) + 0.8};
  for (const it of measured) {
    if (it.kind === 'clef') { curClef = it.clef; }
    if (curLine.items.length && curLine.x + it.w + 1.4 > W) {
      lines.push(curLine);
      curLine = {clef: curClef, items: [], x: clefWCh(curClef) + 0.8};
    }
    curLine.items.push(it);
    curLine.x += it.w;
  }
  lines.push(curLine);

  const isActiveChant = chantEd.idx === chantIdx;
  const lineGap = Math.max(3.6, ls * 2.1 + 1.8);
  const firstLineW = Math.min(W, Math.max(8, lines[0].x + 0.25));
  const titleX = centered ? W / 2 : 0;
  let s = '';
  let cy = y;
  /* Chant title header */
  s += `<text class="chant-title" x="${f(titleX)}" y="${f(cy + 1.5)}" font-size="1.65" font-style="italic"${centered ? ' text-anchor="middle"' : ''}>${esc(title)}</text>`;
  cy += 2.3;

  const drawNeumeGroup = (g, gx, top, ii, gi, lineClef) => {
    let o = '', x = gx;
    if (g.bar) {
      const bx = x + 0.3;
      const isSel = isActiveChant && chantEd.sel && chantEd.sel.ii === ii && chantEd.sel.gi === gi && chantEd.sel.bar;
      let bsvg = '';
      if (g.bar === ',') bsvg = vl(bx, top - 0.35, top + 0.35, 'barl', 0.14);
      else if (g.bar === ';') bsvg = vl(bx, top + 0.8, top + 2.2, 'barl', 0.14);
      else if (g.bar === ':') bsvg = vl(bx, top, top + 3, 'barl', 0.15);
      else { bsvg = vl(bx, top, top + 3, 'barl', 0.15) + vl(bx + 0.42, top, top + 3, 'barl', 0.15); }
      return `<g class="cb-hit${isSel ? ' cn-sel' : ''}" data-cb="${chantIdx}:${ii}:${gi}"><rect class="cn-bg" x="${f(bx - 0.25)}" y="${f(top - 0.5)}" width="${g.bar === '::' ? 0.95 : 0.55}" height="4" rx="0.2"/>${bsvg}</g>`;
    }
    const ns = g.notes || [];
    let prevX = null, prevY = null;
    for (let i = 0; i < ns.length; i++) {
      const nt = ns[i], ny = top + 3 - nt.pos * 0.5;
      const isSel = isActiveChant && chantEd.sel && !chantEd.sel.bar && chantEd.sel.ii === ii && chantEd.sel.gi === gi && chantEd.sel.ni === i;
      let no = '';
      if (nt.acc) {
        no += `<g transform="translate(${f(x)} ${f(ny)}) scale(0.76)">${use(nt.acc, 0, 0)}</g>`;
        x += 0.72;
      }
      /* Podatus (2-note ascending neume): stack upper note right above lower note */
      const isPodTop = (ns.length === 2 && i === 1 && nt.pos > ns[0].pos);
      const nx = isPodTop ? prevX : x;
      /* Ledger lines outside 4-line staff (pos <= -2 or pos >= 8) */
      for (let lp = -2; lp >= nt.pos; lp -= 2) no += hl(nx - 0.25, nx + PW + 0.25, top + 3 - lp * 0.5, 'ledger', 0.13);
      for (let lp = 8; lp <= nt.pos; lp += 2) no += hl(nx - 0.25, nx + PW + 0.25, top + 3 - lp * 0.5, 'ledger', 0.13);
      /* Clivis left stem on first note of descending pair */
      if (i === 0 && ns.length >= 2 && ns[1].pos < nt.pos) {
        no += `<rect class="ink" x="${f(nx)}" y="${f(ny)}" width="0.1" height="${f(Math.max(1.2, (top + 3 - ns[1].pos * 0.5) - ny + 0.7))}"/>`;
      }
      /* Connecting hairline from previous note in neume */
      if (prevX !== null) {
        const vx = isPodTop ? nx + PW - 0.1 : nx;
        no += `<rect class="ink" x="${f(vx)}" y="${f(Math.min(prevY, ny))}" width="0.1" height="${f(Math.max(0.1, Math.abs(ny - prevY)))}"/>`;
      }
      if (nt.incl) {
        const cx = nx + PW / 2;
        no += `<path class="ink" d="M${f(cx)} ${f(ny - 0.34)}L${f(cx + 0.34)} ${f(ny)}L${f(cx)} ${f(ny + 0.34)}L${f(cx - 0.34)} ${f(ny)}Z"/>`;
      } else {
        no += `<rect class="ink" x="${f(nx)}" y="${f(ny - PH / 2)}" width="${f(PW)}" height="${f(PH)}" rx="0.06"/>`;
      }
      if (nt.virga) no += `<rect class="ink" x="${f(nx + PW - 0.1)}" y="${f(ny)}" width="0.1" height="1.5"/>`;
      if (nt.epiH) no += `<rect class="ink" x="${f(nx - 0.04)}" y="${f(ny - 0.52)}" width="${f(PW + 0.08)}" height="0.1"/>`;
      if (nt.epiV) no += `<rect class="ink" x="${f(nx + PW / 2 - 0.05)}" y="${f(ny + 0.42)}" width="0.1" height="0.45"/>`;
      if (nt.dot) {
        const dy = nt.pos % 2 === 0 ? ny - 0.35 : ny;
        no += `<circle class="ink" cx="${f(nx + PW + 0.28)}" cy="${f(dy)}" r="0.15"/>`;
      }
      o += `<g class="cn-hit${isSel ? ' cn-sel' : ''}" data-cn="${chantIdx}:${ii}:${gi}:${i}" data-top="${f(top)}"><rect class="cn-bg" x="${f(nx - 0.25)}" y="${f(ny - 0.75)}" width="${f(PW + 0.5)}" height="1.5" rx="0.22"/>${no}</g>`;
      prevX = nx; prevY = ny;
      if (!isPodTop) x += PW * 0.92;
      if (nt.dot) x += 0.42;
    }
    return o;
  };

  const firstNotePos = ln => {
    for (const it of ln.items) {
      if (it.groups) for (const g of it.groups) if (g.notes && g.notes.length) return g.notes[0].pos;
    }
    return null;
  };

  lines.forEach((ln, li) => {
    const top = cy + 0.9;
    const isLastLine = li === lines.length - 1;
    const lastIt = ln.items[ln.items.length - 1];
    const endsWithDouble = lastIt && ((lastIt.kind === 'bar' && lastIt.bar === '::') || (lastIt.groups && lastIt.groups.length && lastIt.groups[lastIt.groups.length - 1].bar === '::'));
    /* Compute exact visual end of the 4-line staff: never extend past the double barline (or end of last line)! */
    let xCursor = clefWCh(ln.clef) + 0.8;
    let barEndX = null;
    for (const it of ln.items) {
      if (it.kind === 'bar' && it.bar === '::') barEndX = xCursor + 0.72;
      else if (it.groups && it.groups.length) {
        let gx = xCursor + Math.max(0, (it.tw - it.nw) / 2);
        it.groups.forEach((g, gi) => {
          if (g.bar === '::') barEndX = gx + 0.72;
          gx += measureGroup(g) + (gi + 1 < it.groups.length ? 0.48 : 0);
        });
      }
      xCursor += it.w;
    }
    const lineEnd = endsWithDouble && barEndX !== null ? Math.min(W, barEndX) : isLastLine ? Math.min(W, Math.max(clefWCh(ln.clef) + 3, xCursor + 0.2)) : W;
    const dx = centered && lineEnd < W ? (W - lineEnd) / 2 : 0;

    let lsSvg = '';
    /* Clickable 4-line staff surface for adding/editing notes */
    lsSvg += `<rect class="cs-hit" data-cs="${chantIdx}" data-top="${f(top)}" x="0" y="${f(top - 1.5)}" width="${f(lineEnd)}" height="6.2" fill="transparent"/>`;
    /* 4-line Gregorian staff ending cleanly at lineEnd (double barline on final line) */
    for (let k = 0; k < 4; k++) lsSvg += hl(0, lineEnd, top + k, 'staff', 0.12);
    lsSvg += chantClefSvg(ln.clef, 0.4, top);
    let x = clefWCh(ln.clef) + 0.8;
    const lyrY = top + 3 + ls * 1.15 + 0.45;
    for (const it of ln.items) {
      if (it.kind === 'clef') {
        lsSvg += chantClefSvg(it.clef, x, top);
        x += it.w;
        continue;
      }
      if (it.kind === 'bar') {
        lsSvg += drawNeumeGroup({bar: it.bar}, x, top, it.ii, -1, ln.clef);
        x += it.w;
        continue;
      }
      let gx = x + Math.max(0, (it.tw - it.nw) / 2);
      it.groups.forEach((g, gi) => {
        lsSvg += drawNeumeGroup(g, gx, top, it.ii, gi, ln.clef);
        gx += measureGroup(g) + (gi + 1 < it.groups.length ? 0.48 : 0);
      });
      if (it.text) {
        const cx = x + Math.max(it.nw, it.tw) / 2;
        lsSvg += `<text class="lyr" x="${f(cx)}" y="${f(lyrY)}" font-size="${f(ls)}" text-anchor="middle">${esc(it.text)}</text>`;
      }
      x += it.w;
    }
    /* End-of-line custos if another chant line follows */
    if (!isLastLine) {
      const np = firstNotePos(lines[li + 1]);
      if (np !== null) {
        const ny = top + 3 - np * 0.5;
        lsSvg += `<rect class="ink" x="${f(lineEnd - 1.15)}" y="${f(ny - 0.24)}" width="0.46" height="0.48" rx="0.05"/>`;
        lsSvg += `<rect class="ink" x="${f(lineEnd - 0.74)}" y="${f(ny - 1.05)}" width="0.09" height="1.15"/>`;
      }
    }
    s += dx > 0.01 ? `<g transform="translate(${f(dx)} 0)">${lsSvg}</g>` : lsSvg;
    cy = top + 3 + lineGap;
  });

  const totalH = Math.max(5.5, cy - y);
  return {svg: `<g class="chant-sys${isActiveChant ? ' chant-active' : ''}" data-chant="${chantIdx}">${s}</g>`, h: totalH};
}

function buildScoreItems(vlist, W, opts){
  const chants = ensureExt(piece).chants.map((ch, idx) => ({ch, idx})).sort((a, b) => a.ch.t - b.ch.t);
  if (!chants.length) {
    return buildLines(vlist, 0, piece.end + 1, W, opts).map((line, li) => ({kind: 'poly', line, li}));
  }
  const items = [];
  const cuts = [...new Set(chants.map(c => rt(c.ch.t)).filter(t => t > EPS && t < piece.end - EPS))].sort((a, b) => a - b);
  const segs = [0, ...cuts, piece.end + 1];
  let polyIdx = 0;
  /* Leading chants (t <= EPS) appear as their own system before polyphony starts */
  for (const c of chants) if (c.ch.t <= EPS) items.push({kind: 'chant', chant: c.ch, idx: c.idx});
  for (let si = 0; si + 1 < segs.length; si++) {
    const a = segs[si], b = segs[si + 1];
    const segOpts = polyIdx === 0 ? opts : {...opts, indent: 0};
    const segLines = buildLines(vlist, a, b, W, segOpts);
    for (const line of segLines) items.push({kind: 'poly', line, li: polyIdx++});
    if (si + 1 < segs.length - 1) {
      const cutT = segs[si + 1];
      for (const c of chants) if (eq(c.ch.t, cutT)) items.push({kind: 'chant', chant: c.ch, idx: c.idx});
    }
  }
  /* Trailing chants (t >= piece.end - EPS) appear as their own system at the end */
  for (const c of chants) if (c.ch.t >= piece.end - EPS) items.push({kind: 'chant', chant: c.ch, idx: c.idx});
  return items;
}

function layoutScore(G){
  const vlist = visibleVoices();
  if (!vlist.length) return [];
  const names = vlist.map(v => APP.voiceNames === false ? '' : v.name);   /* CantusFirmus: no names before the staves */
  const inc = incipitOn() ? incipitW() : 0;
  const indent = Math.max(...names.map(n => textW(n, 1.8, true))) + 1.4 + inc;
  /* Web, scrolling sideways: the whole score as one line, as long as the music */
  if (G.web && st.webScroll === 'horizontal') {
    const items = buildScoreItems(vlist, 1e6, {indent, ragged: true});
    const maxX1 = Math.max(0, ...items.filter(it => it.kind === 'poly').map(it => it.line.x1));
    if (items.length) {
      const need = Math.max(G.W, maxX1 + 2 * G.M + 1);
      const G2 = {...G, W: need, wmm: need * G.sp, titleW: G.W};
      return paginate(G2, items, vlist, (line, li) => li === 0 ? {names, join: true, inc} : {join: true}, null);
    }
  }
  const W = G.W - 2 * G.M;
  const items = buildScoreItems(vlist, W, {indent});
  return paginate(G, items, vlist, (line, li) => li === 0 ? {names, join: true, inc} : {join: true}, null);
}
function paginate(G, lines, vlist, optsFor, sub){
  const pages = [];
  let body = '', y = G.M, first = true;
  const sysGap = Math.max(1, 2.2 * st.ss + Math.min(1, st.ss));
  const newPage = () => { pages.push(body); body = ''; y = G.M; };
  if (first) { const tb = titleBlock(G, G.M, (G.titleW || G.W) - G.M, y, sub); body += tb.svg; y += tb.h; }
  const bottom1 = footTop(G, true) - 0.8, bottom = footTop(G, false) - 0.8;
  const W = G.W - 2 * G.M;
  lines.forEach((item, idx) => {
    const isChant = item && item.kind === 'chant';
    const line = item && item.kind === 'poly' ? item.line : item;
    const li = item && item.kind === 'poly' ? item.li : idx;
    const probe = isChant ? drawChantSystem(item.chant, item.idx, W, 0) : drawSystem(vlist, line, 0, optsFor(line, li));
    if (y + probe.h > (pages.length ? bottom : bottom1) && body) newPage();
    const sys = isChant ? drawChantSystem(item.chant, item.idx, W, y) : drawSystem(vlist, line, y, optsFor(line, li));
    body += `<g transform="translate(${f(G.M)} 0)">${sys.svg}</g>`;
    y += sys.h + sysGap;
  });
  if (body) pages.push(body);
  if (G.web) return pages.map((b, i) => { const G2 = webGeom(G, y - sysGap, i === 0); return pageSvg(G2, b + footSvg(G2, i === 0, i + 1)); });
  return pages.map((b, i) => pageSvg(G, b + footSvg(G, i === 0, i + 1)));
}
function layoutParts(G){
  const out = [];
  const W = G.W - 2 * G.M;
  for (const v of visibleVoices()) {
    const items = buildScoreItems([v], W, {});
    out.push(...paginate(G, items, [v], () => ({}), v.name));
  }
  return out;
}

/* Choir book: openings with the voices spread over the two pages; every opening covers the same music in each voice */
function choirSides(vlist){
  const n = vlist.length;
  if (n === 1) return [[vlist[0]], []];
  if (n === 2) return [[vlist[0]], [vlist[1]]];
  if (n === 3) return [[vlist[0]], [vlist[1], vlist[2]]];
  const L = [], R = [];
  vlist.forEach((v, i) => (i % 2 ? R : L).push(v));
  return [L, R];
}
function layoutChoir(G){
  const vlist = visibleVoices();
  if (!vlist.length) return [];
  const sides = choirSides(vlist);
  const W = G.W - 2 * G.M;
  /* each voice's own columns, spaced once */
  const lyrOn = v => vis(v.idx).lyr;
  const vcols = new Map(vlist.map(v => [v, columns([v], 0, piece.end + 1, lyrOn)]));
  /* opening boundaries where no voice holds a note across */
  const times = new Set();
  for (const v of vlist) for (const s of v.syms) times.add(s.t);
  for (const b of piece.bars) times.add(b.t);
  const holds = (v, t) => v.syms.some(s => s.t < t - EPS && s.end > t + EPS);
  let cands = [...times].filter(t => t > EPS && vlist.every(v => !holds(v, t))).sort((a, b) => a - b);
  cands.push(piece.end + 1);
  /* lines a voice needs for [a,b) */
  const hdr = new Map(vlist.map(v => [v, headerW(v)]));
  /* the height a voice needs for [a,b): each line as tall as what is on it (notes, stems, lyrics), at least a space apart */
  const gapC = Math.max(1, 1.6 * st.ss);
  const heightNeeded = (v, a, b) => {
    const cols = vcols.get(v).filter(c => c.t >= a - EPS && c.t < b - EPS);
    if (!cols.length) return 0;
    let h = 2.4;
    breakLines(cols, W - hdr.get(v)).forEach((L, i) => {
      const r = lineRoom(v, {cols, from: L.from, to: L.to});
      const t0 = cols[L.from].t, t1 = L.to < cols.length ? cols[L.to].t : b;
      const sec = piece.sections.some(q => q.t >= t0 - EPS && q.t < t1 - EPS) ? 2.6 : 0;
      h += (i ? gapC : 0) + sec + r.above + 4 + r.below;
    });
    return h;
  };
  /* region heights per side; the first opening carries the title */
  const tb = titleBlock(G, G.M, G.W - G.M, G.M, null);
  const capacity = (side, top, first) => {
    const H = (first ? footTop(G, true) - 0.8 : footTop(G, false) - 0.8) - top;
    const n = side.length || 1;
    const per = H / n;
    return side.map(() => per - 0.6);
  };
  const openings = [];
  let a = 0, guard = 0;
  /* a new score with nothing written yet still gets its opening: empty staves, ready for notes (as the Score view shows them) */
  const blank = !(piece.end > EPS);
  while ((blank ? openings.length === 0 : a < piece.end - EPS) && guard++ < 500) {
    const top = G.M + (openings.length === 0 ? tb.h : 0) + 0.4;
    const caps = new Map();
    sides.forEach(side => capacity(side, top, openings.length === 0).forEach((c, k) => caps.set(side[k], c)));
    const fits = b => vlist.every(v => heightNeeded(v, a, b) <= caps.get(v));
    if (blank) { openings.push({a: 0, b: 1, top, caps}); break; }
    let lo = cands.findIndex(t => t > a + EPS);
    if (lo < 0) break;
    let hi = cands.length - 1, best = lo;
    if (fits(cands[hi])) best = hi;
    else {
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (fits(cands[mid])) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    }
    const b = cands[best];
    openings.push({a, b, top, caps});
    a = b;
  }
  /* draw */
  const pages = [];
  openings.forEach((op, oi) => {
    const made = sides.map((side, si) => {
      let body = '', yc = op.top;
      if (oi === 0 && si === 0) body += titleBlock(G, G.M, G.W - G.M, G.M, null).svg;
      const H = (oi === 0 ? footTop(G, true) - 0.8 : footTop(G, false) - 0.8) - op.top, per = H / (side.length || 1);
      side.forEach((v, k) => {
        const y0 = G.web ? yc : op.top + per * k;
        if (APP.voiceNames !== false) body += `<text class="vnamehit" data-v="${v.idx}" x="${f(G.M)}" y="${f(y0 + 1.6)}" font-size="1.8" font-style="italic">${esc(v.name)}</text>`;
        const lines = buildLines([v], op.a, op.b, W, {raggedLast: true});
        let cy = y0 + 2.4;
        lines.forEach(line => {
          const sys = drawSystem([v], line, cy, {});
          body += `<g transform="translate(${f(G.M)} 0)">${sys.svg}</g>`;
          cy += sys.h + gapC;
        });
        yc = cy + 1.4;
      });
      return {body, yEnd: yc};
    });
    /* Web: both pages as long as the longer one */
    const Gp = G.web ? made.map((m, si) => webGeom(G, m.yEnd, oi === 0 && si === 0)).reduce((a, b) => (b.H > a.H ? b : a)) : G;
    made.forEach((m, si) => {
      pages.push({svg: pageSvg(Gp, m.body + footSvg(Gp, oi === 0 && si === 0, pages.length + 1)), side: si, opening: oi});
    });
  });
  return pages;
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
const pagesEl = $('#pages'), viewerEl = $('#viewer'), wrapEl = $('.viewwrap');
let defsDone = false;
function defs(){
  if (defsDone) return;
  const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  d.setAttribute('width', '0'); d.setAttribute('height', '0'); d.style.position = 'absolute';
  d.innerHTML = '<defs>' + Object.entries(GLY).map(([k, v]) => `<path id="g-${k}" d="${v.d}"/>`).join('') + '</defs>';
  document.body.appendChild(d);
  defsDone = true;
}
let wideFx = null, wideLast = 0, wideCache = null;   /* Horizontal Web follow-along (see wideFollow) */
/* thickness: the shapes get an outline of their own colour (CSS, --thk); every line is drawn that much wider */
function applyThick(){
  const k = Math.max(0, +st.thick || 0), kl = Math.max(0, +st.thickL || 0);
  pagesEl.style.setProperty('--thk', String(k));
  /* the staff, barlines and ledger lines follow the staff slider; the other strokes (ties, signs) the note slider */
  pagesEl.querySelectorAll('[stroke-width]').forEach(el => {
    const b = el.dataset.sw !== undefined ? +el.dataset.sw : (el.dataset.sw = el.getAttribute('stroke-width'), +el.dataset.sw);
    const m = /\b(staff|barl|ledger)\b/.test(el.getAttribute('class') || '') ? kl : k;
    if (m > 0) el.style.strokeWidth = String(+(b + m).toFixed(3)); else el.style.strokeWidth = '';
  });
}
function render(){
  if (!piece) return;
  wideCache = null;
  defs();
  prepare();
  const G = pageGeom();
  document.getElementById('pagerule').textContent = `@page{size:${G.web ? (st.printPaper || 'A4') : st.paper} ${st.orient};margin:0}`;
  let html = '';
  const fs = wrapEl.classList.contains('fs');
  const horiz = isHoriz();
  document.querySelectorAll('#orientSeg button').forEach(b => { b.disabled = !!G.fit; });
  document.querySelectorAll('#flowSeg button').forEach(b => { b.disabled = !!(G.web || G.fit); });
  if ($('#flowLab')) $('#flowLab').hidden = $('#flowSeg').hidden = !!G.web;
  $('#scrollLab').hidden = $('#scrollSeg').hidden = !G.web;
  document.querySelectorAll('#scrollSeg button').forEach(b => { b.disabled = st.view !== 'score'; b.title = st.view !== 'score' ? 'Only in Score' : b.title; });
  const wide = !!G.web && st.webScroll === 'horizontal' && st.view === 'score';
  const Z = G.web || G.fit ? 1 : Math.max(0.5, Math.min(3, st.zoom || 1));
  const avail = ($('.viewwrap').clientWidth || window.innerWidth) - (horiz ? (window.innerWidth <= 700 ? 60 : 40) : window.innerWidth <= 700 ? 0 : 40);
  const pxmm = 96 / 25.4;
  /* side by side, a page (or an opening) fits the height of the window */
  const availH = Math.max(320, (fs ? window.innerHeight : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) || 700) - 60);
  const fitH = horiz ? availH / (G.hmm * pxmm) : Infinity;
  if (st.view === 'choir') {
    const pages = layoutChoir(G);
    /* the opening fills the width of the window whatever its size (a page taller than the window scrolls up and down) */
    const sc = G.web || G.fit ? 1 : Math.min(2.5, avail / (2 * G.wmm * pxmm)) * Z;
    for (let i = 0; i < pages.length; i += 2) {
      html += `<div class="opening${G.web && 2 * G.wmm * pxmm > avail + 1 ? ' stack' : ''}">`;
      for (const p of pages.slice(i, i + 2)) html += pageDiv(p.svg, G, sc, '');
      html += `</div>`;
    }
    if (!pages.length) html = '<p class="msg">No voices are shown.</p>';
  } else {
    const pages = st.view === 'parts' ? layoutParts(G) : layoutScore(G);
    const sc = G.web ? 1 : Math.min(1.25, avail / (G.wmm * pxmm), fitH) * Z;
    pages.forEach(p => { html += pageDiv(p, G, sc, ''); });
    if (!pages.length) html = '<p class="msg">No voices are shown.</p>';
  }
  viewerEl.style.width = '';
  pagesEl.innerHTML = html;
  applyThick();
  /* the frame is as wide as one page (one opening in the choir book), measured afresh for every view */
  const framed = !horiz && window.innerWidth > 700;
  viewerEl.classList.toggle('frame', framed); wrapEl.classList.toggle('framed', framed);
  viewerEl.classList.toggle('horiz', horiz); wrapEl.classList.toggle('horiz', horiz);
  viewerEl.classList.toggle('wide', wide || Z > 1.001);
  /* the frame is the whole window: as wide as the page area and as tall as the window, the music centred in it */
  viewerEl.style.width = '';
  if (typeof showSel === 'function' && (ed.sel || ed.ins || ed.range || ed.picks)) showSel();
  applyMark();
  if (!play) { handTop = -1; $('#handBox').style.top = ''; $('#pendBox').style.top = ''; if (st.view === 'choir') handMid(null); }
  syncNav(); ghostClefs();
  if (typeof drawEditGrid === 'function') drawEditGrid();
  if (H.afterRender) { try { H.afterRender(); } catch (e) {} }
  postHeight();
}
/* pages side by side: the arrows move one page (one opening in the choir book) left or right */
const navItems = () => [...pagesEl.children].filter(c => c.classList.contains('page') || c.classList.contains('opening'));
function navIndex(){
  const items = navItems(), mid = viewerEl.scrollLeft + viewerEl.clientWidth / 2;
  let best = 0, bd = Infinity;
  items.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
  return best;
}
function goPage(dir){
  const items = navItems(); if (!items.length) return;
  const i = Math.max(0, Math.min(items.length - 1, navIndex() + dir)), c = items[i];
  viewerEl.scrollTo({left: c.offsetLeft + c.offsetWidth / 2 - viewerEl.clientWidth / 2, behavior: webFit() ? 'auto' : 'smooth'});
}
function syncNav(){
  const horiz = isHoriz();
  const max = viewerEl.scrollWidth - viewerEl.clientWidth;
  $('#pgPrev').disabled = !horiz || viewerEl.scrollLeft <= 2;
  $('#pgNext').disabled = !horiz || viewerEl.scrollLeft >= max - 2;
}
$('#pgPrev').addEventListener('click', () => goPage(-1));
$('#pgNext').addEventListener('click', () => goPage(1));
viewerEl.addEventListener('scroll', () => { syncNav(); ghostLater(); }, {passive: true});
window.addEventListener('resize', () => ghostLater());
/* Horizontal Web: the clefs stay at the left edge as faded reminders once the real ones have scrolled away (like Dorico's
   sticky clefs); they carry no musical meaning, the clef does not change along the line */
let ghostRq = 0;
function ghostLater(){ if (!ghostRq) ghostRq = requestAnimationFrame(() => { ghostRq = 0; ghostClefs(); }); }
function ghostClefs(){
  let el = document.getElementById('ghostClefs');
  const on = piece && viewerEl.classList.contains('wide') && st.paper === 'web';
  const rects = on ? [...pagesEl.querySelectorAll('rect.stafhit')] : [];
  const real = on ? pagesEl.querySelector('.clefhit') : null;
  if (!rects.length || !real) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'ghostClefs'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<svg></svg>'; wrapEl.appendChild(el); }
  const wr = wrapEl.getBoundingClientRect(), vr = viewerEl.getBoundingClientRect();
  /* appears as the real clef leaves the left edge */
  const o = Math.max(0, Math.min(1, (vr.left + 10 - real.getBoundingClientRect().right) / 40));
  if (o <= 0) { el.hidden = true; return; }
  el.hidden = false; el.style.opacity = String(o * 0.6);
  const W = 64;
  el.style.left = (vr.left - wr.left) + 'px'; el.style.top = (vr.top - wr.top) + 'px'; el.style.width = W + 'px'; el.style.height = vr.height + 'px';
  let g = '';
  for (const r of rects) {
    const v = piece.voices[+r.dataset.v]; if (!v || !CLEFS[v.clef]) continue;
    const b = r.getBoundingClientRect(), sc = b.height / 9.2, y = b.top - vr.top + 2.6 * sc;
    if (y < -40 || y > vr.height + 40) continue;
    let lines = '';
    for (let k = 5 - staffLinesN(); k < 5; k++) lines += hl(-3, 7, k, 'staff', 0.12);
    g += `<g transform="translate(${f(3 * sc)} ${f(y)}) scale(${f(sc)})">${lines}${clefSvg(v.clef, 0.2, 0)}</g>`;
  }
  el.firstChild.setAttribute('width', W); el.firstChild.setAttribute('height', vr.height);
  el.firstChild.innerHTML = g;
}
viewerEl.addEventListener('wheel', e => {
  if (st.flow !== 'horizontal' || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
  if (!e.target.closest('.page')) return;
  const max = viewerEl.scrollWidth - viewerEl.clientWidth;
  const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewerEl.clientWidth : 1);
  if ((d < 0 && viewerEl.scrollLeft <= 0) || (d > 0 && viewerEl.scrollLeft >= max - 1)) return;   /* at the end of the row the website scrolls on */
  e.preventDefault();
  viewerEl.scrollLeft += d;
}, {passive: false});
/* bring a note into sight: in the row of pages, and in the window (or the site page around the app) */
function bringIntoView(el, force){
  const r = el.getBoundingClientRect();
  let top = 0, bottom = window.innerHeight;
  if (EMBED) {
    try { const fr = window.frameElement.getBoundingClientRect(), H = window.top.innerHeight; top = -fr.top; bottom = H - fr.top; }
    catch (e) { top = 0; bottom = window.innerHeight; }
  }
  let vr = viewerEl.getBoundingClientRect();
  if (viewerEl.classList.contains('wide') && (r.left < vr.left + 40 || r.right > vr.right - 40)) viewerEl.scrollTo({left: viewerEl.scrollLeft + r.left - vr.left - vr.width / 3, behavior: force ? 'auto' : 'smooth'});
  if (viewerEl.classList.contains('frame') && (r.top < vr.top + 20 || r.bottom > vr.bottom - 20)) {
    viewerEl.scrollTo({top: viewerEl.scrollTop + r.top - vr.top - vr.height / 3, behavior: force ? 'auto' : 'smooth'});
    if (r.top >= Math.max(top, vr.top) - 2 && vr.bottom <= bottom + 2) return true;
    vr = viewerEl.getBoundingClientRect();
    if (vr.top >= top - 2 && vr.bottom <= bottom + 2) return true;
    const y = vr.top - top - 10;
    if (EMBED) { try { window.top.scrollBy({top: y, behavior: 'smooth'}); return true; } catch (e) {} }
    window.scrollBy({top: y, behavior: 'smooth'});
    return true;
  }
  const offX = st.flow === 'horizontal' && (r.left < vr.left + 50 || r.right > vr.right - 50);
  const offY = r.top < top + 20 || r.bottom > bottom - 20;
  if (!force && !offX && !offY) return false;
  if (offX) { const c = navItems().find(c => c.contains(el)); if (c) viewerEl.scrollTo({left: c.offsetLeft + c.offsetWidth / 2 - viewerEl.clientWidth / 2, behavior: webFit() ? 'auto' : 'smooth'}); }
  if (offY) {
    const y = r.top - top - (bottom - top) / 3;
    if (EMBED) { try { window.top.scrollBy({top: y, behavior: 'smooth'}); return true; } catch (e) {} }
    window.scrollBy({top: y, behavior: 'smooth'});
  }
  return true;
}
function pageDiv(svg, G, sc, extra){
  if (EXAMPLE_MODE) sc = 1;   /* true size: text drawn tiny on screen measures wrong */
  let hmm = G.hmm;
  let wmm = G.wmm;
  if (G.web) { const m = /viewBox="0 0 ([-\d.]+) ([\d.]+)"/.exec(svg); if (m) { hmm = +m[2] * G.sp; wmm = +m[1] * G.sp; } }
  return `<div class="page" style="width:${f(wmm * 96 / 25.4 * sc)}px;height:${f(hmm * 96 / 25.4 * sc)}px" data-w="${wmm}" data-h="${hmm}">${svg}${extra}</div>`;
}
/* print at true paper size */
let webPrint = false;
window.addEventListener('beforeprint', () => {
  if (st.paper === 'web') { webPrint = true; st.paper = 'A4'; render(); }
  document.querySelectorAll('.page').forEach(p => { p.dataset.sw = p.style.width; p.dataset.sh = p.style.height; p.style.width = p.dataset.w + 'mm'; p.style.height = p.dataset.h + 'mm'; });
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('.page').forEach(p => { p.style.width = p.dataset.sw; p.style.height = p.dataset.sh; });
  if (webPrint) { webPrint = false; st.paper = 'web'; render(); }
});

/* ------------------------------------------------------------------ */
/* Loading pieces                                                      */
/* ------------------------------------------------------------------ */
/* the full library: games/choirbook/catalogue.json (made from the ReDiX data by Ugo Bindini) */
let CAT = null, CATBY = {};
const APP_NAME = APP.name, APP_URL = 'samuelreidnavarro.github.io/' + APP.page;
const SRC_FROM = {jrp: 'the Josquin Research Project, josquin.stanford.edu', '1520': 'the 1520s Project, 1520s-project.org',
  pal: 'the music21 corpus, github.com/cuthbertLab/music21', uma: 'the Victoria website of Nancho Álvarez, victoria.uma.es'};
/* what the first page says about where the score comes from, who made it and its copyright */
function creditText(){
  const m = (piece && piece.meta) || {};
  const e = CATBY[pieceKey];
  const s = e ? e.s : (m.jrpid || (APP.catalogue && pieceKey && PIECES.includes(pieceKey)) ? 'jrp' : null);
  const parts = [];
  const mine = pieceKey && pieceKey.startsWith('mine:');
  if (s && !mine) parts.push(`Score from ${SRC_FROM[s]}.`);
  else if (s && mine) parts.push(`Based on a score from ${SRC_FROM[s]}.`);
  if (m.SMS) parts.push(`Source: ${m.SMS}.`);
  if (m.YOR) parts.push(`After ${m.YOR.replace(/\.$/, '')}.`);
  if (m.EED) parts.push(`Edited by ${m.EED.replace(/\.$/, '')}.`);
  else if (m.ENC) parts.push(`Encoded by ${m.ENC.replace(/\.$/, '')}.`);
  if (m.YEC) parts.push(m.YEC.replace(/\.?$/, '.'));
  return {about: parts.join(' '), made: `Made with ${APP_NAME}, ${APP_URL}`};
}
const SRC_NAMES = {jrp: ['Josquin Research Project', 'https://josquin.stanford.edu', ''],
  '1520': ['The 1520s Project', 'https://1520s-project.org', ''],
  pal: ['music21 corpus (Palestrina, encoded by John Miller)', 'https://github.com/cuthbertLab/music21', ''],
  uma: ['Tomás Luis de Victoria website (Nancho Álvarez, Universidad de Málaga)', 'https://victoria.uma.es/scores.html', '']};
/* the scores of victoria.uma.es are not copied here: choirbook/victoria.json only lists them (built from the site's data.json),
   and each piece is read from that site when opened, through a small Cloudflare Worker that adds the CORS header the site lacks */
const UMA = 'https://victoria.uma.es/', UMA_PROXY = 'https://victoria-proxy.samreidn.workers.dev/f/';
const UMA_EXT = {msc: 'mscz', ly: 'ly', mid: 'mid'};
function umaPath(e){ const p = e.k.slice(4), i = p.lastIndexOf('/'); return (i >= 0 ? p.slice(0, i + 1) : '') + e.f + '/' + p.slice(i + 1) + '.' + UMA_EXT[e.f]; }
let catPromise = null;
function loadCatalogue(){
  if (!catPromise) catPromise = Promise.all([fetch('choirbook/catalogue.json').then(r => r.json()),
    fetch('choirbook/victoria.json').then(r => r.ok ? r.json() : []).catch(() => [])]).then(([j, uma]) => {
    CAT = j; CAT.pieces = CAT.pieces.concat(uma); CAT.pieces.forEach(e => { CATBY[e.k] = e; });
    return CAT;
  });
  return catPromise;
}
function catUrl(e){
  if (e.s === 'uma') return UMA + umaPath(e);
  if (e.h) return 'choirbook/redix-progressio/' + e.k + '.krn';
  return CAT.sources[e.s] + (e.u || (e.s === 'pal' ? e.k.slice(4) : e.k) + '.krn');
}
async function pieceUrl(key){
  if (PIECES.includes(key)) return 'choirbook/' + key;
  await loadCatalogue();
  const e = CATBY[key];
  if (!e) throw new Error('This piece is not in the library: ' + key);
  if (e.s === 'uma') return UMA_PROXY + umaPath(e);
  return catUrl(e);
}
function showSource(key){
  const e = CATBY[key];
  const info = $('#infoSrc');
  const own = H.sourceHtml ? H.sourceHtml(key) : '';
  if (own) { if (info) info.innerHTML = own; return; }
  if (info) {
    const c = creditText().about;
    info.innerHTML = e ? '' : esc(c || (key && key.startsWith('mine:') ? `Your own, kept in this browser (${L.mine}).` : key && key.startsWith('file:') ? 'A file from your computer: ' + key.slice(5) : ''));
  }
  if (!e) return;
  const [n, href] = SRC_NAMES[e.s] || ['', '', ''];
  const lic = piece && piece.meta && piece.meta.YEC;
  const html = `Score: <a href="${esc(href)}" target="_blank" rel="noopener">${esc(n)}</a>${lic ? '. ' + esc(lic) : ''} · <a href="${esc(catUrl(e))}" target="_blank" rel="noopener">source file</a>`;
  if (info) info.innerHTML = html;
}
/* the address shows the open piece, so it can be bookmarked or shared */
function setAddress(key, extra){
  const q = '?piece=' + encodeURIComponent(key).replace(/%2F/g, '/') + (extra || '');
  try { history.replaceState(null, '', location.pathname + q); } catch (e) {}
  if (EMBED) try { parent.postMessage({[APP.msg + 'Query']: q}, '*'); } catch (e) {}
}
/* marked bars (e.g. from a ReDiX Progressio search result) */
let mark = null;
function barTime(n){
  if (!piece || !piece.barNums) return null;
  const b = piece.barNums.find(x => x.n === n);
  if (b) return b.t;
  if (n <= 1) return 0;
  return null;
}
function applyMark(){
  const box = $('#markBar');
  if (!mark || mark.piece !== pieceKey || !piece) { if (box) box.hidden = true; return; }
  const t0 = barTime(mark.from);
  let t1 = barTime(mark.to + 1); if (t1 === null) t1 = piece.end;
  box.hidden = false;
  $('#markTxt').textContent = mark.from === mark.to ? `Bar ${mark.from} is marked in blue.` : `Bars ${mark.from}–${mark.to} are marked in blue.`;
  if (t0 === null) { $('#markTxt').textContent = `Bar ${mark.from} was not found in this score.`; return; }
  let first = null;
  for (const v of piece.voices) for (const q of (v.syms || [])) {
    if (q.t === undefined || q.t < t0 - EPS || q.t >= t1 - EPS) continue;
    document.querySelectorAll('#pages g.' + q.id).forEach(g => { g.classList.add('mark'); if (!first) first = g; });
  }
  if (first && !mark.scrolled) { mark.scrolled = true; setTimeout(() => { try { if (typeof bringIntoView === 'function') bringIntoView(first, true); else first.scrollIntoView({block: 'center'}); } catch (e) {} }, 60); }
}
/* My scores: new scores, and cantus firmi brought over from the CantusFirmus app, kept in this browser */
const MINE_KEY = APP.store + ':mine:v1';
function mineAll(){ try { return JSON.parse(localStorage.getItem(MINE_KEY) || '{}'); } catch (e) { return {}; } }
function mineSave(all){ try { localStorage.setItem(MINE_KEY, JSON.stringify(all)); } catch (e) {} }
function mineAdd(title, text){
  const all = mineAll(), id = 'mine:' + Date.now().toString(36);
  all[id] = {title, text, at: Date.now()};
  mineSave(all);
  return id;
}
/* a score in My scores with no notes in it (a new score never written in) is not kept */
function mineEmpty(id, all){
  const m = (all || mineAll())[id]; if (!m) return false;
  let text = null; try { text = localStorage.getItem(EKEY(id)); } catch (e) {}
  try { return !parseKern(text || m.text).voices.some(v => v.events.some(e => !e.rest)); } catch (e) { return false; }
}
function mineDrop(id){
  const all = mineAll(); if (!all[id]) return;
  delete all[id]; mineSave(all); try { localStorage.removeItem(EKEY(id)); } catch (e) {}
  if (H.mineRemoved) H.mineRemoved(id);
}
/* empty scores go, except the one open now (it stays while it is being written in) */
function minePrune(keep){
  const all = mineAll();
  for (const id of Object.keys(all)) if (id !== keep && mineEmpty(id, all)) mineDrop(id);
}
const whenEdited = at => { try { return new Date(at).toLocaleString([], {day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'}); } catch (e) { return new Date(at).toLocaleDateString(); } };
async function loadPiece(file){
  file = MOVED[file] || file;
  if (pieceKey && pieceKey !== file && pieceKey.startsWith('mine:') && mineEmpty(pieceKey)) { mineDrop(pieceKey); if (typeof refreshMine === 'function') setTimeout(refreshMine); }
  let text = cache[file];
  if (!text && file.startsWith('mine:')) {
    const m = mineAll()[file];
    if (!m) throw new Error('This score is no longer kept in this browser.');
    text = m.text;
  }
  if (!text && file.startsWith('uma/')) { await loadCatalogue(); if (CATBY[file]) text = cache[file] = await umaLoad(CATBY[file]); }
  if (!text && H.loadKey) { const k = await H.loadKey(file); if (k) text = cache[file] = k; }   /* an add-on's own pieces, e.g. gb:<id> from GregoBase */
  if (!text) {
    const r = await fetch(await pieceUrl(file));
    if (!r.ok) throw new Error('Could not load ' + file);
    text = cache[file] = await r.text();
  }
  stopPlay(); heldAt = null;
  let saved = null; try { saved = localStorage.getItem(APP.store + ':edit:' + file); } catch (e) {}
  piece = null;
  if (saved && file.startsWith('mine:')) { try { piece = parseKern(saved); piece.text = saved; } catch (e) { piece = null; } }
  if (!piece) piece = parseKern(text);
  if (H.afterParse) { H.afterParse(piece); piece.text = writeKern(piece); }
  pieceKey = file;
  if (typeof ed !== 'undefined') { ed.sel = null; ed.undo = []; ed.redo = []; ed.warned = false; ed.colArm = false; ed.xf = "all"; ed.range = null; ed.picks = null; }
  st.piece = file; save();
  st.verse = 0;
  if (H.afterLoad) H.afterLoad();
  showSource(file);
  syncUI();
  render();
  incipitSnap();
}
/* a piece from victoria.uma.es: its MuseScore, LilyPond or MIDI file, fetched from that site and read like an opened file */
async function umaLoad(e){
  const get = async path => {
    const r = await fetch(UMA_PROXY + path);
    if (!r.ok) throw new Error('fetch');
    return ScoreImport.toKern(new File([await r.arrayBuffer()], path.split('/').pop()));
  };
  const spines = k => ((k.split('\n').find(l => l.startsWith('**')) || '').match(/\*\*kern/g) || []).length;
  if (!window.ScoreImport) throw new Error('This app cannot read this score.');
  let k = null;
  try { k = await get(umaPath(e)); } catch (x) {}
  /* a few of the oldest LilyPond files use a syntax this app cannot read: their MIDI file has the notes (without the words) */
  if (e.f === 'ly' && e.m !== 0 && (!k || spines(k) < Math.max(2, e.v || 0))) try { k = await get(umaPath(Object.assign({}, e, {f: 'mid'}))); } catch (x) {}
  if (!k) {
    const err = new Error('This score could not be fetched from victoria.uma.es just now.');
    err.html = `This score could not be fetched from victoria.uma.es just now. You can download it <a href="${esc(catUrl(e))}" target="_blank" rel="noopener">from their website</a> and open it here with Open file, or find it on <a href="${UMA}scores.html" target="_blank" rel="noopener">their score page</a>.`;
    throw err;
  }
  /* MuseScore and MIDI part names carry the instrument and a short voice name ("Electric Piano, 2s"): Cantus II */
  const VN = {s: 'Cantus', a: 'Altus', t: 'Tenor', b: 'Bassus'}, ROM = ['', ' I', ' II', ' III', ' IV'];
  k = k.replace(/\*I"(?:[^\t\n,]*, )?([1-4]?)([satb])(?=[\t\n])/g, (all, n, v) => '*I"' + VN[v] + (ROM[+n] || ''));
  k = k.replace(/\*I"[^\t\n,]*, ([^\t\n]+)/g, '*I"$1');
  if (!/^!!!OTL/m.test(k)) k = '!!!OTL: ' + e.t + '\n' + k;
  else k = k.replace(/^!!!OTL:.*$/m, '!!!OTL: ' + e.t);
  if (!/^!!!COM/m.test(k)) k = '!!!COM: ' + nameOf(e.c) + '\n' + k;
  return k;
}
/* a file opened from the computer stays open after a reload: its text is kept in this browser (the last one only) */
const FILE_KEY = APP.store + ':lastfile';
function fileKeep(name, text){ try { if (text.length < 3e6) localStorage.setItem(FILE_KEY, JSON.stringify({name, text})); } catch (e) {} }
function fileKept(){ try { return JSON.parse(localStorage.getItem(FILE_KEY) || 'null'); } catch (e) { return null; } }
function loadText(name, text){
  try {
    stopPlay(); heldAt = null;
    piece = parseKern(text);
    pieceKey = 'file:' + name; fileKeep(name, text); st.piece = pieceKey; save();
    if (typeof ed !== 'undefined') { ed.sel = null; ed.undo = []; ed.redo = []; ed.warned = false; ed.colArm = false; ed.xf = "all"; ed.range = null; ed.picks = null; }
    if (H.afterLoad) H.afterLoad();
    syncUI(); render(); incipitSnap();
  } catch (e) { pagesEl.innerHTML = `<p class="msg">${esc(e.message)}</p>`; }
}
const meta = {};
const lib = {q: '', comp: '', genre: '', voices: '', sort: 'composer', shown: 150};
const GENRES = {Mass: 'Mass movements', Motet: 'Motets', Song: 'Songs', Other: 'Other'};
function nameOf(c){ const i = c.indexOf(', '); return i > 0 ? c.slice(i + 2) + ' ' + c.slice(0, i) : c; }
function itemHtml(key, title, sub){
  return `<button class="pc" data-p="${esc(key)}" aria-current="${key === pieceKey}"><span class="t">${esc(title)}</span><span class="c">${esc(sub)}</span></button>`;
}
function fold(x){ return x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
/* composers first, then the kinds of music of the one you open, then its pieces. Searching or filtering goes straight to the pieces. */
function libBrowse(box){
  const comps = {};
  CAT.pieces.forEach(e => { const o = comps[e.c] || (comps[e.c] = {n: 0, d: e.d || ''}); o.n++; if (!o.d && e.d) o.d = e.d; });
  const names = Object.keys(comps).sort((a, b) => a.localeCompare(b));
  box.innerHTML = `<p class="libhint">${names.length} composers</p>` + names.map(c => `<button class="pc cbtn" data-comp="${esc(c)}"><span class="t">${esc(nameOf(c))}</span><span class="c">${comps[c].d ? esc(comps[c].d.replace('-', '\u2013')) + ' \u00b7 ' : ''}${comps[c].n} piece${comps[c].n === 1 ? '' : 's'}</span></button>`).join('');
}
function libGenres(box){
  const g = {};
  CAT.pieces.forEach(e => { if (e.c === lib.comp) g[e.g] = (g[e.g] || 0) + 1; });
  const keys = Object.keys(GENRES).filter(k => g[k]).concat(Object.keys(g).filter(k => !GENRES[k]));
  box.innerHTML = `<div class="libnav"><button class="libback" type="button" data-back="comps"><svg class="chev l" viewBox="0 0 12 12" aria-hidden="true"><path d="M7.8 2 3.6 6 7.8 10 8.9 8.9 5.9 6 8.9 3.1Z"/></svg>All composers</button></div>` +
    `<h2>${esc(nameOf(lib.comp))}</h2>` + keys.map(k => `<button class="pc cbtn" data-genre="${esc(k)}"><span class="t">${esc(GENRES[k] || k)}</span><span class="c">${g[k]} piece${g[k] === 1 ? '' : 's'}</span></button>`).join('');
}
function libList(){
  const box = $('#libList'); if (!box || !CAT) return;
  const filtering = !!(lib.q || lib.genre || lib.voices);
  if (!filtering && !lib.comp) { libBrowse(box); return; }
  if (!filtering && lib.comp) {
    const gs = new Set(CAT.pieces.filter(e => e.c === lib.comp).map(e => e.g));
    if (gs.size > 1) { libGenres(box); return; }
    lib.genre = [...gs][0] || ''; const sel = $('#libGenre'); if (sel) sel.value = lib.genre;
  }
  const words = fold(lib.q).split(/\s+/).filter(Boolean);
  let list = CAT.pieces.filter(e => {
    if (lib.comp && e.c !== lib.comp) return false;
    if (lib.genre && e.g !== lib.genre) return false;
    if (lib.voices && (lib.voices === '6' ? e.v < 6 : String(e.v) !== lib.voices)) return false;
    if (words.length) { const h = e._f || (e._f = fold(e.t + ' ' + e.c + ' ' + nameOf(e.c) + ' ' + e.k)); if (!words.every(w => h.includes(w))) return false; }
    return true;
  });
  const by = {composer: (a, b) => a.c.localeCompare(b.c) || a.t.localeCompare(b.t),
    title: (a, b) => a.t.localeCompare(b.t) || a.c.localeCompare(b.c),
    voices: (a, b) => a.v - b.v || a.c.localeCompare(b.c) || a.t.localeCompare(b.t)}[lib.sort];
  list.sort(by);
  const n = list.length, show = list.slice(0, lib.shown);
  let html = '';
  if (lib.comp && !lib.q) {
    const multi = new Set(CAT.pieces.filter(e => e.c === lib.comp).map(e => e.g)).size > 1;
    html += `<div class="libnav"><button class="libback" type="button" data-back="${multi ? 'genres' : 'comps'}"><svg class="chev l" viewBox="0 0 12 12" aria-hidden="true"><path d="M7.8 2 3.6 6 7.8 10 8.9 8.9 5.9 6 8.9 3.1Z"/></svg>${multi ? esc(nameOf(lib.comp)) : 'All composers'}</button></div><h2>${esc(nameOf(lib.comp))}${lib.genre && multi ? ' \u00b7 ' + esc(GENRES[lib.genre] || lib.genre) : ''}</h2>`;
  }
  html += `<p class="libhint">${n} piece${n === 1 ? '' : 's'}${n > show.length ? ` (showing ${show.length})` : ''}</p>`;
  const favs = favAll();
  html += show.map(e => `<div class="lrow">${itemHtml(e.k, e.t, `${nameOf(e.c)}${e.a ? ' (attributed)' : ''}${e.d ? ', ' + e.d : ''} · ${e.v} voices · ${(GENRES[e.g] || e.g).replace(/s$/, '')}`.replace(' · 0 voices', ''))}${favBtn(e.k, !!favs[e.k], e.t)}</div>`).join('');
  if (n > show.length) html += `<button class="more" id="libMore">Show more</button>`;
  box.innerHTML = html;
}
/* pieces from the library starred into My scores: kept in this browser as links, the pieces themselves stay as they are */
const FAV_KEY = APP.store + ':fav:v1';
function favAll(){ try { return JSON.parse(localStorage.getItem(FAV_KEY) || '{}'); } catch (e) { return {}; } }
function favSave(all){ try { localStorage.setItem(FAV_KEY, JSON.stringify(all)); } catch (e) {} }
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 14.7 9l6.7.6-5.1 4.5 1.5 6.6L12 17.2l-5.8 3.5 1.5-6.6-5.1-4.5L9.3 9Z"/></svg>';
function favBtn(key, on, title){
  return `<button class="fav" data-fav="${esc(key)}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Add'} ${esc(title)} ${on ? 'from' : 'to'} My scores" title="${on ? 'Remove from My scores' : 'Add to My scores'}">${STAR}</button>`;
}
function mineRows(){
  const all = mineAll(), favs = favAll();
  return [
    ...Object.keys(all).filter(id => !mineEmpty(id, all)).map(id => ({key: id, own: true, title: all[id].title || 'Untitled', at: all[id].at, pc: itemHtml(id, all[id].title || 'Untitled', (L.mineSub ? L.mineSub + 'last edited ' : 'Last edited ') + whenEdited(all[id].at)), html: `<div class="mine">${itemHtml(id, all[id].title || 'Untitled', (L.mineSub ? L.mineSub + 'last edited ' : 'Last edited ') + whenEdited(all[id].at))}<button class="mdel" data-del="${esc(id)}" aria-label="Remove ${esc(all[id].title || 'this score')}" title="Remove from ${esc(L.mine)}">×</button></div>`})),
    ...Object.keys(favs).map(k => ({key: k, own: false, title: favs[k].t || k, at: favs[k].at, pc: itemHtml(k, favs[k].t, favs[k].c), html: `<div class="mine">${itemHtml(k, favs[k].t, favs[k].c)}${favBtn(k, true, favs[k].t)}</div>`}))
  ].sort((a, b) => b.at - a.at);
}
function mineHtml(){
  const rows = mineRows();
  if (!rows.length && !L.mineHint) return '';
  return `<h2>${esc(L.mine)}</h2>` + (rows.length ? rows.map(r => r.html).join('')
    : L.mineHint ? `<p class="libhint">${esc(L.mineHint)}</p>` : '');
}
/* the five most recent scores, listed in the Open menu itself (ChoirBook) */
/* each with a small × that takes it off: a starred piece is unstarred; a score of your own is removed from My scores,
   with Undo in the message for a few seconds */
function recentSync(){
  const box = $('#openRecent'); if (!box) return;
  const rows = mineRows().slice(0, 5);
  box.innerHTML = rows.map(r => `<div class="rrow">${r.pc}<button class="rdel" data-del="${esc(r.key)}" aria-label="Remove ${esc(r.title)}" title="${r.own ? 'Delete this score' : 'Take it off My scores'}">×</button></div>`).join('');
  const hd = $('#recentHead'); if (hd) hd.hidden = !rows.length;
}
function refreshMine(){
  recentSync();
  const box = $('#libMine'); if (box) box.innerHTML = mineHtml();
  const favs = favAll();
  document.querySelectorAll('#libList .fav').forEach(b => {
    const on = !!favs[b.dataset.fav], t = b.closest('.lrow').querySelector('.t').textContent;
    b.outerHTML = favBtn(b.dataset.fav, on, t);
  });
}
function toggleFav(key){
  const favs = favAll();
  if (favs[key]) delete favs[key];
  else {
    const e = CATBY[key];
    favs[key] = {t: e ? e.t : (piece && pieceKey === key ? piece.title : key), c: e ? `${nameOf(e.c)}${e.d ? ', ' + e.d : ''}` : (piece && pieceKey === key ? piece.composer || '' : ''), at: Date.now()};
  }
  favSave(favs); refreshMine();
}
async function buildPieceList(){
  if (H.buildPieceList) return H.buildPieceList();
  await Promise.all(PIECES.map(async p => {
    try {
      const t = cache[p] || (cache[p] = await (await fetch('choirbook/' + p)).text());
      const pc = parseKern(t); meta[p] = {title: pc.title, composer: pc.composer};
    } catch (e) { meta[p] = {title: p, composer: ''}; }
  }));
  try { await loadCatalogue(); } catch (e) { CAT = null; }
  if (!CAT) {
    libEl.innerHTML = PIECES.map(p => itemHtml(p, meta[p].title, meta[p].composer)).join('');
    return;
  }
  const comps = {};
  CAT.pieces.forEach(e => { comps[e.c] = (comps[e.c] || 0) + 1; });
  const compOpts = Object.keys(comps).sort((a, b) => a.localeCompare(b)).map(c => `<option value="${esc(c)}">${esc(c)} (${comps[c]})</option>`).join('');
  libEl.innerHTML = `<div class="libtools">
      <input type="search" id="libQ" placeholder="Search title or composer" aria-label="Search">
      <select id="libComp" aria-label="Composer"><option value="">All composers</option>${compOpts}</select>
      <select id="libGenre" aria-label="Genre"><option value="">All genres</option>${Object.entries(GENRES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <select id="libVoices" aria-label="Voices"><option value="">Any number of voices</option><option value="2">2 voices</option><option value="3">3 voices</option><option value="4">4 voices</option><option value="5">5 voices</option><option value="6">6 or more</option></select>
      <select id="libSort" aria-label="Sort"><option value="composer">Sort by composer</option><option value="title">Sort by title</option><option value="voices">Sort by voices</option></select>
    </div>
    <div id="libFeat"><div id="libMine">${mineHtml()}</div><h2>Links to machine-readable files</h2><p class="linksub">Download any format but PDF and open in ChoirBook</p><details class="morelinks"><summary>+ Show the links</summary><ul><li><a href="https://gregobase.selapa.net/" target="_blank" rel="noopener">GregoBase</a> <span>Gregorian chant</span></li><li><a href="https://1520s-project.org/" target="_blank" rel="noopener">1520s Project</a> <span>Music of the 1520s</span></li><li><a href="https://victoria.uma.es/scores.html" target="_blank" rel="noopener">Victoria</a> <span>Victoria, Morales, Guerrero and others</span></li><li><a href="https://www.cpdl.org/" target="_blank" rel="noopener">CPDL</a> <span>Choral Public Domain Library</span></li><li><a href="https://www.tassomusic.org/" target="_blank" rel="noopener">Tasso</a> <span>Scores</span></li><li><a href="https://josquin.stanford.edu" target="_blank" rel="noopener">Josquin Research Project</a> <span>Josquin and his contemporaries</span></li></ul></details><h2>Library</h2>
    <p class="gnote">From the <a href="https://josquin.stanford.edu" target="_blank" rel="noopener">Josquin Research Project</a>, <a href="https://1520s-project.org" target="_blank" rel="noopener">the 1520s Project</a> and the <a href="https://github.com/cuthbertLab/music21" target="_blank" rel="noopener">music21</a> Palestrina masses, as collected by <a href="https://github.com/ugobindini/redix" target="_blank" rel="noopener">ReDiX</a> (Ugo Bindini), and the editions of Victoria, Morales, Guerrero and others by Nancho Álvarez on <a href="https://victoria.uma.es/scores.html" target="_blank" rel="noopener">victoria.uma.es</a>, read from that site when opened. Search their sonorities with <a href="../redix-progressio.html" target="_top">ReDiX Progressio</a>.</p></div>
    <div id="libList"></div>`;
  const upd = () => { lib.shown = 150; $('#libFeat').hidden = !!(lib.q || lib.comp || lib.genre || lib.voices); libList(); };
  $('#libQ').addEventListener('input', e => { lib.q = e.target.value; upd(); });
  $('#libComp').addEventListener('change', e => { lib.comp = e.target.value; upd(); });
  $('#libGenre').addEventListener('change', e => { lib.genre = e.target.value; upd(); });
  $('#libVoices').addEventListener('change', e => { lib.voices = e.target.value; upd(); });
  $('#libSort').addEventListener('change', e => { lib.sort = e.target.value; upd(); });
  libList(); recentSync();
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */
const STAFF_COLORS = [['red', '#8E2A1E', 'Red'], ['black', '#2A2218', 'Black'], ['brown', '#5C3D22', 'Dark brown']];
const colorOf = (v, fb = '#2A2218') => { const c = STAFF_COLORS.find(x => x[0] === v); return c ? c[1] : (/^#[0-9a-f]{6}$/i.test(v) ? v : fb); };
const SWATCH_HTML = STAFF_COLORS.map(([k, c, n]) => `<button class="tb swatch" data-v="${k}" style="--c:${c}" aria-label="${n}" title="${n}"><i></i></button>`).join('');
$('#staffSeg').innerHTML = SWATCH_HTML + `<label class="tb swatch pick" id="staffPickL" title="Any colour" aria-label="Any colour"><i></i><input type="color" id="staffPick" value="#2a2218"></label>`;
$('#noteColSeg').innerHTML = SWATCH_HTML + `<label class="tb swatch pick" id="noteColPickL" title="Any colour" aria-label="Any colour"><i></i><input type="color" id="noteColPick" value="#2a2218"></label>`;
$('#lyrFontSel').innerHTML = LYR_FONTS.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('');
const LOCK_ON_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5.2a3 3 0 0 1 6 0V7h.8c.66 0 1.2.54 1.2 1.2v5.1c0 .66-.54 1.2-1.2 1.2H4.2c-.66 0-1.2-.54-1.2-1.2V8.2C3 7.54 3.54 7 4.2 7H5Zm1.4 0h3.2V5.2a1.6 1.6 0 0 0-3.2 0V7Z"/></svg>';
const LOCK_OFF_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.4 4.8a1.6 1.6 0 0 0-3-.75l-1.3-.54A3 3 0 0 1 11.8 5v2h.2c.66 0 1.2.54 1.2 1.2v5.1c0 .66-.54 1.2-1.2 1.2H4.2c-.66 0-1.2-.54-1.2-1.2V8.2C3 7.54 3.54 7 4.2 7h6.2V4.8Z"/></svg>';
const RNG_DEF = {
  size: [1, 7, 0.05, 0.3, 20],
  noteSize: [1, 7, 0.05, 0.3, 20],
  thickL: [0, 0.16, 0.005, 0, 1],
  thick: [0, 0.16, 0.005, 0, 1],
  hs: [-0.4, 1.2, 0.01, -2, 10],
  vs: [0, 2, 0.02, 0, 10],
  ss: [0, 3, 0.05, 0, 10]
};
const rngFmt = v => String(+(+v).toFixed(3));
function rngSync(k){
  const wrap = document.querySelector(`.rng-wrap[data-for="${k}"]`); if (!wrap) return;
  const inp = wrap.querySelector('input[type="range"]'); if (!inp) return;
  const def = RNG_DEF[k] || [+inp.min, +inp.max, +inp.step || 0.05, -100, 100];
  const b = st.bounds && Array.isArray(st.bounds[k]) ? st.bounds[k] : null;
  const mn = b && isFinite(b[0]) ? b[0] : def[0];
  const mx = b && isFinite(b[1]) ? b[1] : def[1];
  inp.min = String(mn); inp.max = String(mx);
  const val = k === 'thick' || k === 'thickL' ? (st[k] || 0) : (st[k] !== undefined ? st[k] : +inp.value);
  inp.value = String(val);
  const bMin = wrap.querySelector('.rng-bound[data-end="min"]');
  const bMax = wrap.querySelector('.rng-bound[data-end="max"]');
  const vEl = wrap.querySelector('.rng-val');
  if (bMin) bMin.textContent = rngFmt(mn);
  if (bMax) bMax.textContent = rngFmt(mx);
  if (vEl) vEl.textContent = rngFmt(val);
}
function rngSyncAll(){ for (const k of Object.keys(RNG_DEF)) rngSync(k); }
const PAPER_COLORS = [['parchment', '#F3E8CE', 'Paper texture'], ['beige', '#F0E8D8', 'Beige'], ['white', '#FFFFFF', 'White']];
$('#paperColSeg').innerHTML = `<div class="texpop" id="texPop">` +
  `<button class="tb swatch" id="mainPaperSwatch" data-v="parchment" style="--c:#F3E8CE" aria-label="Paper texture" title="Paper texture (hover to choose)"><i style="background:#F3E8CE var(--paper);background-size:160px"></i></button>` +
  `<div class="texmenu" id="texMenu" role="group" aria-label="Paper textures">` +
    PAPER_TEXTURES.map(([tk, tc, tn]) => `<button type="button" class="tb texopt" data-tex="${tk}" title="${tn}"><i class="texsw" data-texsw="${tk}" style="background:${tc}"></i><span>${tn}</span></button>`).join('') +
  `</div></div>` +
  PAPER_COLORS.slice(1).map(([k, c, n]) => `<button class="tb swatch" data-v="${k}" style="--c:${c}" aria-label="${n}" title="${n}"><i></i></button>`).join('') +
  `<label class="tb swatch pick" id="paperPickL" title="Any colour" aria-label="Any colour"><i></i><input type="color" id="paperPick" value="#e8e0d0"></label>`;
function loadTexSwatches(){
  document.querySelectorAll('#texMenu [data-texsw]').forEach(el => {
    if (!el.dataset.ready) { el.dataset.ready = '1'; el.style.backgroundImage = makePaperUrl(el.dataset.texsw); el.style.backgroundSize = '120px'; }
  });
}
$('#texPop').addEventListener('pointerenter', loadTexSwatches);
document.addEventListener('pointerdown', e => { if (!e.target.closest('#texPop')) $('#texPop').classList.remove('open'); });
$('#paperColSeg').addEventListener('click', e => {
  const tb = e.target.closest('[data-tex]');
  if (tb) { e.stopPropagation(); st.paperCol = 'parchment'; st.paperTex = tb.dataset.tex; $('#texPop').classList.remove('open'); save(); syncUI(); return; }
  const b = e.target.closest('button[data-v]'); if (!b) return;
  if (b.id === 'mainPaperSwatch' && !canHover()) {
    loadTexSwatches();
    $('#texPop').classList.toggle('open');
  } else {
    $('#texPop').classList.remove('open');
  }
  st.paperCol = b.dataset.v; save(); syncUI();
});
$('#paperPick').addEventListener('input', e => { st.paperCol = e.target.value; save(); syncUI(); });
function applyPaper(){
  const texKey = PAPER_TEXTURES.some(t => t[0] === st.paperTex) ? st.paperTex : 'vellum-cream';
  const texEntry = PAPER_TEXTURES.find(t => t[0] === texKey) || PAPER_TEXTURES[0];
  const url = makePaperUrl(texKey);
  document.documentElement.style.setProperty('--paper', url);
  const named = PAPER_COLORS.find(c => c[0] === st.paperCol);
  const col = st.paperCol === 'parchment' ? texEntry[1] : named ? named[1] : (/^#[0-9a-f]{6}$/i.test(st.paperCol) ? st.paperCol : '#F3E8CE');
  document.documentElement.style.setProperty('--pagebg', col);
  document.documentElement.classList.toggle('flatpaper', st.paperCol !== 'parchment');
  const ms = $('#mainPaperSwatch');
  if (ms) { ms.title = `Paper: ${texEntry[2]}`; const mi = ms.querySelector('i'); if (mi) mi.style.backgroundColor = texEntry[1]; }
  $('#paperColSeg').querySelectorAll('button[data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.paperCol)));
  $('#paperColSeg').querySelectorAll('button[data-tex]').forEach(b => b.setAttribute('aria-pressed', String(st.paperCol === 'parchment' && b.dataset.tex === texKey)));
  const custom = !named;
  $('#paperPickL').setAttribute('aria-pressed', String(custom));
  if (custom) { $('#paperPickL').style.setProperty('--c', col); $('#paperPick').value = col; }
}
const VIEW_NAMES = {score: 'Score', parts: 'Parts', choir: 'Choirbook'};
function segInit(id, key, after){
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st[key] = b.dataset.v; save(); syncUI(); render(); if (after) after();
  });
}
function syncUI(){
  if (st.webWas) { st.webWas = false; if (st.paper === 'A4') st.paper = 'web'; save(); }   /* the old Web-to-A4 stand-in */
  const segs = {'#viewList': 'view', '#headSeg': 'heads', '#stemSeg': 'stems', '#accSeg': 'accStyle', '#clefSeg': 'clefs', '#barSeg': 'bars', '#orientSeg': 'orient', '#flowSeg': 'flow', '#staffSeg': 'staff', '#noteColSeg': 'noteCol', '#dashSeg': 'dashes', '#edSeg': 'ed', '#linesSeg': 'lines', '#darkSeg': 'dark', '#ligSeg': 'lig', '#scrollSeg': 'webScroll', '#eqSeg': 'eq', '#bposSeg': 'bpos'};
  $('#bnumSel').value = st.bnum || 'off'; $('#bunitSel').value = st.bunit || 'bar';
  $('#lyrFontSel').value = st.lyrFont || 'fell';
  if ($('#lyrPt') && document.activeElement !== $('#lyrPt')) $('#lyrPt').value = String(+(+st.lyrPt || 8.5).toFixed(2));
  if ($('#linesNum') && document.activeElement !== $('#linesNum')) $('#linesNum').value = String(staffLinesN());
  document.querySelectorAll('.bnx').forEach(el => { el.hidden = !st.bnum || st.bnum === 'off'; });
  for (const [id, k] of Object.entries(segs)) $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st[k])));
  const activePaper = st.paper === 'web' ? (st.printPaper || 'A4') : st.paper;
  $('#paperSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === activePaper)));
  $('#dispSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === (st.paper === 'web' ? 'web' : 'page'))));
  const sLocked = st.sizeLock !== 'off', cLocked = st.colLock !== 'off';
  if (sLocked) st.noteSize = st.size;
  const slBtn = $('#sizeLock'), clBtn = $('#colLock');
  if (slBtn) { slBtn.setAttribute('aria-pressed', String(sLocked)); slBtn.innerHTML = sLocked ? LOCK_ON_SVG : LOCK_OFF_SVG; slBtn.title = sLocked ? 'Locked to staff size — click to adjust independently' : 'Unlocked — click to lock note size to staff size'; }
  if (clBtn) { clBtn.setAttribute('aria-pressed', String(cLocked)); clBtn.innerHTML = cLocked ? LOCK_ON_SVG : LOCK_OFF_SVG; clBtn.title = cLocked ? 'Locked to staff colour — click to adjust independently' : 'Unlocked — click to lock note colour to staff colour'; }
  rngSyncAll();
  blackSync();
  Organ.sync();
  if ($('#audition')) $('#audition').checked = !!st.audition;
  const staffHex = colorOf(st.staff, '#2A2218');
  document.documentElement.style.setProperty('--staff', staffHex);
  const staffCustom = !STAFF_COLORS.some(c => c[0] === st.staff) && /^#[0-9a-f]{6}$/i.test(st.staff || '');
  $('#staffPickL').setAttribute('aria-pressed', String(staffCustom));
  if (staffCustom) { $('#staffPickL').style.setProperty('--c', staffHex); $('#staffPick').value = staffHex; }
  const noteHex = colorOf(st.noteCol, '#2A2218');
  if (st.noteCol && st.noteCol !== 'black') document.documentElement.style.setProperty('--note-ink', noteHex);
  else document.documentElement.style.removeProperty('--note-ink');
  const noteCustom = !STAFF_COLORS.some(c => c[0] === st.noteCol) && /^#[0-9a-f]{6}$/i.test(st.noteCol || '');
  $('#noteColPickL').setAttribute('aria-pressed', String(noteCustom));
  if (noteCustom) { $('#noteColPickL').style.setProperty('--c', noteHex); $('#noteColPick').value = noteHex; }
  document.documentElement.style.setProperty('--lyr-font', lyrFontCss());
  applyPaper(); if (typeof incSync === 'function') incSync();
  const horiz = isHoriz();
  viewerEl.classList.toggle('horiz', horiz); $('.viewwrap').classList.toggle('horiz', horiz);
  /* verses */
  const nv = piece ? Math.max(1, ...piece.voices.map(v => v.verses)) : 1;
  $('#verseLab').hidden = $('#verseSeg').hidden = nv < 2;
  $('#verseSeg').innerHTML = Array.from({length: nv}, (_, i) => `<button class="tb" data-v="${i}" aria-pressed="${i === st.verse}">${i + 1}</button>`).join('');
  /* voice table */
  if (piece) {
    if (H.voicePanel) H.voicePanel(); else {
    const row = (v) => {
      const s = vis(v.idx);
      const cb = (k, label) => `<td><input type="checkbox" data-i="${v.idx}" data-k="${k}" aria-label="${esc(v.name)}: ${label}"${s[k] ? ' checked' : ''}${(k === 'notes' || k === 'lyr') && !s.on ? ' disabled' : ''}></td>`;
      return `<tr data-i="${v.idx}"><td><span class="drag" data-i="${v.idx}" title="Drag to change the order" aria-hidden="true">⠿</span></td>` +
        `<td><input class="vname" data-i="${v.idx}" value="${esc(v.name)}" aria-label="Name of the voice" title="Click to rename"></td>${cb('on', 'shown')}${cb('notes', 'notes')}${cb('lyr', 'lyrics')}${playCell(v.idx, v.name)}` +
        `<td><button class="vbtn vexp" data-op="cf" data-i="${v.idx}" title="Open in CantusFirmus" aria-label="Open ${esc(v.name)} in CantusFirmus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.5h6.5V10h-2V6.9l-6.8 6.8-1.4-1.4 6.8-6.8H14ZM4.5 6.5h7v2h-5v9h9v-5h2v7h-13Z"/></svg></button></td>` +
        `<td><button class="vbtn vdel" data-op="del" data-i="${v.idx}" aria-label="Remove ${esc(v.name)}" title="Remove this voice">×</button></td></tr>`;
    };
    const mainVoices = piece.voices.filter((v, i) => { v.idx = i; return !(v.subOf >= 0); });
    const visMain = mainVoices.filter(v => vis(v.idx).on);
    const grpN = mainVoices.length >= 2 ? staffGroups(visMain).length : 0;
    const isComb = mainVoices.length >= 2 && !!staffCfg() && grpN < visMain.length;
    const combBtn = mainVoices.length >= 2 ? ` <button data-op="combine" class="vcomb" title="Combine multiple voices onto shared staves (short score)">${isComb ? `Staves (${grpN})` : 'Combine on staves…'}</button>` : '';
    $('#voiceTable').innerHTML = `<thead><tr><th></th><th></th><th>Shown</th><th>Notes</th><th>Lyrics</th><th>Playback</th><th></th><th></th></tr></thead><tbody>` + mainVoices.map(v => row(v)).join('') +
      `</tbody><tfoot><tr><td colspan="8"><div class="vfoot"><button data-op="add">+ New voice</button>${combBtn}</div></td></tr></tfoot>`;
    if (!$('#staffCombine').hidden && typeof renderStaffCombine === 'function') { if (piece.voices.length < 2) openStaffCombine(false); else renderStaffCombine(); }
    }
    if (document.activeElement !== $('#metaTitle')) $('#metaTitle').value = (piece.meta.OTL || piece.title || '').replace(/\s*\.\.\.\s*/g, ' … ');
    if (document.activeElement !== $('#metaComp')) $('#metaComp').value = piece.meta.COM || piece.meta.COA || '';
    { const cr = ensureExt(piece).credits;
      if ($('#metaEditor') && document.activeElement !== $('#metaEditor')) $('#metaEditor').value = cr.editor || piece.meta.ENC || '';
      if ($('#metaSource') && document.activeElement !== $('#metaSource')) $('#metaSource').value = cr.source || piece.meta.SMS || '';
      if ($('#metaLicence') && document.activeElement !== $('#metaLicence')) $('#metaLicence').value = cr.licence || piece.meta.YEC || '';
      if ($('#metaNotes') && document.activeElement !== $('#metaNotes')) $('#metaNotes').value = cr.publicNotes || cr.notes || piece.meta.ONB || '';
    }
    if (typeof syncAdv === 'function') syncAdv();
  }
  document.querySelectorAll('#library .pc').forEach(b => b.setAttribute('aria-current', String(b.dataset.p === pieceKey)));
  mixBuild();
}
/* ---------------- Mixer ---------------- */
/* Sound > Mixer (Samuel 2026-11-14): every voice of the piece with its own sound and volume. A voice follows the Sound chosen for
   all until it is given one of its own; kept per piece with the voice's other switches (st.vis), so they follow the voice when
   voices are added, removed or moved. */
const mixGain = o => Math.pow(Math.max(0, Math.min(100, o.gain ?? 100)) / 100, 1.6);
const mixReg = o => o.reg && Organ.soundName(o.reg) ? o.reg : null;
let mixSig = '';
function mixOpts(){
  return Organ.soundGroups().map(([g, items]) => `<optgroup label="${esc(g)}">` + items.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('') + '</optgroup>').join('');
}
function mixBuild(){
  const box = $('#mixList'); if (!box) return;
  const vs = piece ? piece.voices : [];
  const sig = pieceKey + '|' + vs.map(v => v.name).join('|');
  if (sig !== mixSig) {
    mixSig = sig;
    const opts = mixOpts();
    box.innerHTML = vs.map((v, i) => { const name = v.name || 'Voice ' + (i + 1);
      return `<div class="mxr" data-i="${i}"><span class="mxn" title="${esc(name)}">${esc(name)}</span>` +
        `<button type="button" class="ptri mxp" data-i="${i}"></button>` +
        `<select class="mxs" data-i="${i}" aria-label="${esc(name)}: sound"><option value="">General</option>${opts}</select>` +
        `<input type="range" class="mxv" data-i="${i}" min="0" max="100" step="1" aria-label="${esc(name)}: volume"></div>`; }).join('');
  }
  mixSync();
}
function mixSync(){
  const box = $('#mixList'); if (!box || !piece) return;
  const all = Organ.soundName(st.reg);
  box.querySelectorAll('.mxr').forEach(r => {
    const i = +r.dataset.i; if (!piece.voices[i]) return;
    const o = vis(i), t = playState(o), name = piece.voices[i].name || 'Voice ' + (i + 1);
    const sel = r.querySelector('.mxs'), first = sel.options[0];
    first.textContent = 'General: ' + all;
    if (document.activeElement !== sel) sel.value = mixReg(o) || '';
    sel.classList.toggle('own', !!mixReg(o));
    const rg = r.querySelector('.mxv'); if (document.activeElement !== rg) rg.value = o.gain ?? 100;
    const b = r.querySelector('.mxp');
    if (b.dataset.s !== t) { b.dataset.s = t; b.innerHTML = PLAY_ICON[t]; }
    b.title = PLAY_TIP[t]; b.setAttribute('aria-label', `${name}: playback. ${PLAY_TIP[t]}`);
    r.classList.toggle('quiet', t !== 'on');
  });
}
{
  const box = $('#mixList');
  box.addEventListener('change', e => {
    const sel = e.target.closest('.mxs'); if (!sel || !piece) return;
    const i = +sel.dataset.i, o = vis(i);
    if (sel.value) o.reg = sel.value; else delete o.reg;
    save(); mixSync();
    if (play) { restartPlay(); return; }
    const r = mixReg(o) || st.reg;
    if (Organ.isSampled(r)) Organ.Sampler.prepare(r).then(ok => { if (ok && !play) Organ.testTone(r, mixGain(o)); });
    else Organ.testTone(r, mixGain(o));
  });
  box.addEventListener('input', e => {
    const rg = e.target.closest('.mxv'); if (!rg || !piece) return;
    const i = +rg.dataset.i, o = vis(i);
    o.gain = +rg.value; save();
    Organ.setChannelGain(i, mixGain(o));
  });
  box.addEventListener('change', e => {
    const rg = e.target.closest('.mxv'); if (!rg || !piece || play) return;
    const o = vis(+rg.dataset.i); Organ.testTone(mixReg(o) || st.reg, mixGain(o));
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.mxp'); if (!b || !piece) return;
    e.stopPropagation();
    const o = vis(+b.dataset.i), t = playState(o);
    o.play = t === 'on' ? 'mute' : t === 'mute' ? false : true;
    save(); syncUI(); render(); if (play) restartPlay();
  });
}
/* ---------------- Presets ---------------- */
function presetList(){
  const S = presetStore();
  const cur = !S.active ? `<div class="prow pcur"><span class="pchk"></span><span class="pname pcurl">Current settings</span></div>` : '';
  $('#presetList').innerHTML = cur + presetAll().map(p => `<div class="prow"><label class="pchk" title="Open all scores with this preset"><input type="checkbox" data-p="${esc(p.name)}"${p.name === S.active ? ' checked' : ''}><span class="plab">Open all scores with it</span></label><button class="tb pname" data-p="${esc(p.name)}" title="Use this preset now">${esc(p.name)}</button>${p.fixed ? '' : `<button class="vbtn pdel" data-d="${esc(p.name)}" aria-label="Delete ${esc(p.name)}" title="Delete this preset">×</button>`}</div>`).join('');
}
$('#presetList').addEventListener('click', e => {
  const d = e.target.closest('[data-d]'), n = e.target.closest('.pname'), c = e.target.closest('input[type=checkbox]');
  if (d) { const S = presetStore(); S.custom = S.custom.filter(q => q.name !== d.dataset.d); if (S.active === d.dataset.d) S.active = ''; presetPut(S); presetList(); }
  else if (n) { const p = presetAll().find(q => q.name === n.dataset.p); if (p) { presetApply(p); save(); syncUI(); render(); } }
  else if (c) { e.preventDefault(); const S = presetStore(); S.active = c.dataset.p; presetPut(S); presetList(); const p = presetAll().find(q => q.name === c.dataset.p); if (p) { presetApply(p); save(); syncUI(); render(); } }
});
$('#presetAdd').addEventListener('click', () => {
  const taken = new Set(presetAll().map(q => q.name)); let n = 3; while (taken.has('Preset ' + n)) n++;
  $('#presetName').value = 'Preset ' + n; $('#presetForm').hidden = false; $('#presetName').focus(); $('#presetName').select();
});
function presetSaveNow(){
  const name = $('#presetName').value.trim(); if (!name) return;
  const S = presetStore(), s = {}; for (const k of PRESET_KEYS) s[k] = st[k];
  if (BUILTIN.some(b => b.name === name) || name === 'Current settings') { toast('That name is taken'); return; }
  S.custom = S.custom.filter(q => q.name !== name); S.custom.push({name, s}); presetPut(S);
  $('#presetName').value = ''; $('#presetForm').hidden = true; presetList(); toast('Preset saved');
}
$('#presetOk').addEventListener('click', presetSaveNow);
$('#presetName').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') presetSaveNow(); });
presetList();
segInit('#eqSeg', 'eq'); segInit('#viewList', 'view'); $('#notaSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (!st.black || typeof st.black !== 'object') st.black = {};
  if (b.dataset.v === 'fake') st.nota = 'fake';
  else { st.nota = 'real'; if (pieceKey) { if (b.dataset.v === 'black') st.black[pieceKey] = 1; else delete st.black[pieceKey]; } }
  save(); syncUI(); render();
}); segInit('#headSeg', 'heads'); segInit('#stemSeg', 'stems'); segInit('#clefSeg', 'clefs'); segInit('#barSeg', 'bars'); segInit('#bposSeg', 'bpos');
[['#bnumSel', 'bnum'], ['#bunitSel', 'bunit'], ['#lyrFontSel', 'lyrFont']].forEach(([id, k]) => $(id).addEventListener('change', e => { st[k] = e.target.value; save(); syncUI(); render(); }));
$('#paperSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.printPaper = b.dataset.v; if (st.paper !== 'web') st.paper = b.dataset.v; save(); syncUI(); render(); });
$('#dispSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.v === 'web') { if (st.paper !== 'web') st.printPaper = st.paper; st.paper = 'web'; } else { st.paper = st.printPaper || 'A4'; } save(); syncUI(); render(); });
segInit('#orientSeg', 'orient'); segInit('#flowSeg', 'flow', () => { viewerEl.scrollLeft = 0; syncNav(); });
$('#staffSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.staff = b.dataset.v; if (st.colLock !== 'off') st.noteCol = st.staff; save(); syncUI(); render(); });
$('#staffPick').addEventListener('input', e => { st.staff = e.target.value; if (st.colLock !== 'off') st.noteCol = st.staff; save(); syncUI(); });
$('#noteColSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.noteCol = b.dataset.v; if (st.colLock !== 'off') st.staff = st.noteCol; save(); syncUI(); render(); });
$('#noteColPick').addEventListener('input', e => { st.noteCol = e.target.value; if (st.colLock !== 'off') st.staff = st.noteCol; save(); syncUI(); });
$('#sizeLock').addEventListener('click', () => { st.sizeLock = st.sizeLock === 'off' ? 'on' : 'off'; if (st.sizeLock === 'on') st.noteSize = st.size; save(); syncUI(); render(); });
$('#colLock').addEventListener('click', () => { st.colLock = st.colLock === 'off' ? 'on' : 'off'; if (st.colLock === 'on') st.noteCol = st.staff; save(); syncUI(); render(); });
segInit('#dashSeg', 'dashes'); segInit('#linesSeg', 'lines');
$('#linesNum').addEventListener('input', e => { const n = parseInt(e.target.value, 10); if (isFinite(n) && n >= 1 && n <= 15) { st.lines = String(n); save(); syncUI(); later(); } });
$('#linesNum').addEventListener('change', e => { const n = Math.max(1, Math.min(15, parseInt(e.target.value, 10) || 5)); st.lines = String(n); e.target.value = String(n); save(); syncUI(); render(); });
$('#linesNum').addEventListener('keydown', e => { e.stopPropagation(); });
segInit('#darkSeg', 'dark', () => { if (H.dark) H.dark(); }); segInit('#edSeg', 'ed'); segInit('#accSeg', 'accStyle');
 segInit('#ligSeg', 'lig'); segInit('#scrollSeg', 'webScroll', () => { viewerEl.scrollLeft = 0; });
$('#verseSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.verse = +b.dataset.v; save(); syncUI(); render(); });
let rq = 0;
const later = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(render); };
$('#size').addEventListener('input', e => { st.size = +e.target.value; if (st.sizeLock !== 'off') { st.noteSize = st.size; rngSync('noteSize'); } rngSync('size'); save(); later(); });
$('#noteSize').addEventListener('input', e => { st.noteSize = +e.target.value; if (st.sizeLock !== 'off') { st.size = st.noteSize; rngSync('size'); } rngSync('noteSize'); save(); later(); });
for (const k of ['hs', 'vs', 'ss']) $('#' + k).addEventListener('input', e => { st[k] = +e.target.value; rngSync(k); save(); later(); });
$('#lyrPt').addEventListener('input', e => { const v = parseFloat(e.target.value); if (isFinite(v) && v >= 3 && v <= 48) { st.lyrPt = v; save(); later(); } });
$('#lyrPt').addEventListener('change', e => { const v = Math.max(4, Math.min(36, parseFloat(e.target.value) || 8.5)); st.lyrPt = v; e.target.value = String(+v.toFixed(2)); save(); render(); });
$('#lyrPt').addEventListener('keydown', e => { e.stopPropagation(); });
$('#thick').addEventListener('input', e => { st.thick = +e.target.value; rngSync('thick'); save(); applyThick(); });
$('#thickL').addEventListener('input', e => { st.thickL = +e.target.value; rngSync('thickL'); save(); applyThick(); });
document.addEventListener('pointerdown', e => {
  const w = e.target.closest('.rng-wrap');
  document.querySelectorAll('.rng-wrap.active').forEach(el => { if (el !== w) el.classList.remove('active'); });
  if (w) w.classList.add('active');
});
document.querySelectorAll('.rng-wrap .rng-bound').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const wrap = btn.closest('.rng-wrap'), k = wrap.dataset.for, end = btn.dataset.end;
    const inp = wrap.querySelector('input[type="range"]'), def = RNG_DEF[k];
    if (!inp || !def || btn.querySelector('input')) return;
    const ed = document.createElement('input');
    ed.type = 'number'; ed.step = 'any'; ed.className = 'rng-edit';
    ed.value = end === 'min' ? inp.min : inp.max;
    ed.setAttribute('aria-label', end === 'min' ? 'Minimum value' : 'Maximum value');
    btn.hidden = true;
    btn.parentNode.insertBefore(ed, btn);
    ed.focus(); ed.select();
    let done = false;
    const finish = commit => {
      if (done) return; done = true;
      const v = parseFloat(ed.value);
      ed.remove(); btn.hidden = false;
      if (!commit || !isFinite(v)) return;
      const curMin = +inp.min, curMax = +inp.max;
      let mn = end === 'min' ? v : curMin, mx = end === 'max' ? v : curMax;
      mn = Math.max(def[3], Math.min(def[4], mn));
      mx = Math.max(def[3], Math.min(def[4], mx));
      if (mx <= mn + 1e-6) return;
      if (!st.bounds || typeof st.bounds !== 'object') st.bounds = {};
      st.bounds[k] = [mn, mx];
      if ((k === 'size' || k === 'noteSize') && st.sizeLock !== 'off') st.bounds[k === 'size' ? 'noteSize' : 'size'] = [mn, mx];
      let changed = false;
      if (st[k] < mn) { st[k] = mn; changed = true; }
      else if (st[k] > mx) { st[k] = mx; changed = true; }
      if ((k === 'size' || k === 'noteSize') && st.sizeLock !== 'off') { st.size = st.noteSize = st[k]; rngSync('size'); rngSync('noteSize'); }
      else rngSync(k);
      save();
      if (changed) { if (k === 'thick' || k === 'thickL') applyThick(); else later(); }
    };
    ed.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') finish(true); else if (ev.key === 'Escape') finish(false); });
    ed.addEventListener('blur', () => finish(true));
  });
});
/* ---------------- Voices: name, clef, add, remove, open in CantusFirmus ---------------- */
/* the clefs, as CantusFirmus offers them (Samuel prefers its clef menu): short name and full name */
const CLEF_MENU = [['treble8', 'G2 8', 'G clef on line 2, octave lower (tenor)'], ['treble', 'G2', 'G clef on line 2'], ['g1', 'G1', 'G clef on line 1'],
  ['c1', 'C1', 'C clef on line 1'], ['c2', 'C2', 'C clef on line 2'], ['c3', 'C3', 'C clef on line 3'], ['c4', 'C4', 'C clef on line 4'], ['c5', 'C5', 'C clef on line 5'],
  ['f3', 'F3', 'F clef on line 3'], ['bass', 'F4', 'F clef on line 4'], ...(APP.noClef ? [['none', 'No clef', 'No clef: pitches are relative (search by intervals or contour)']] : [])];
const VCLEFS = [['', 'As written'], ...CLEF_MENU.map(c => [c[0], c[2]])];
const CLEF_KERN = {g1: 'G1', treble: 'G2', treble8: 'Gv2', bass: 'F4', f3: 'F3', c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4', c5: 'C5', none: 'none'};
/* a voice of rests as long as the piece, with the signs of the voice next to it */
function restVoice(name, clef, like){
  const v = {name, abbr: '', kclef: CLEF_KERN[clef], events: [], mets: [], keys: [], clefs: [{t: 0, c: CLEF_KERN[clef], ei: 0}], verses: 0, t: 0};
  const cuts = like ? [...new Set([0, ...like.mets.map(m => m.t), piece.end])].sort((a, b) => a - b) : [0, piece.end || 2];
  for (let k = 0; k + 1 < cuts.length; k++) {
    let r = rt(cuts[k + 1] - cuts[k]), t = cuts[k];
    const m = like && like.mets.find(x => eq(x.t, cuts[k]));
    if (m) v.mets.push(Object.assign({t, sign: m.sign, ei: v.events.length}, m.mod ? {mod: m.mod} : {}));
    while (r > EPS) { const d = r >= 2 - EPS ? 2 : r >= 1 - EPS ? 1 : r; v.events.push({d, kd: d, rest: true, t, syl: []}); t = rt(t + d); r = rt(r - d); }
  }
  if (!like || !like.mets.length) v.mets.push({t: 0, sign: 'C', ei: 0});
  if (like) for (const k of like.keys) if (eq(k.t, 0)) v.keys.push({t: 0, alts: Object.assign({}, k.alts), raw: k.raw, ei: 0});
  v.end = rt(v.events.reduce((a, e) => a + e.d, 0));
  return v;
}
/* the per-voice view switches follow their voice when voices are added or removed */
function shiftVis(at, by){
  const all = st.vis[pieceKey]; if (!all) return;
  const out = {};
  for (const [k, val] of Object.entries(all)) { const i = +k; if (by < 0 && i === at) continue; out[i >= at ? i + by : i] = val; }
  st.vis[pieceKey] = out; save();
}
const VOICE_OPS = {
  rename(i, name){ name = name.trim().slice(0, 40); if (piece.voices[i].name === name) return; commit(() => { piece.voices[i].name = name; }); },
  clef(i, c){
    const v = piece.voices[i];
    if (v && v.sharedStaff && st.view === 'score') {
      const grp = staffGroups(visibleVoices()).find(g => g.voices.includes(v));
      if (grp && grp.voices.length > 1) {
        const cfg = ensureStaffCfg();
        if (c) cfg.clefs[grp.id] = c; else delete cfg.clefs[grp.id];
        save(); syncUI(); render(); return;
      }
    }
    const oldC = (vis(i).clef && CLEFS[vis(i).clef]) ? vis(i).clef : chooseClef(v, st.clefs);
    vis(i).clef = c || null; save();
    const newC = (c && CLEFS[c]) ? c : chooseClef(v, st.clefs);
    const dStep = (APP.noClef && (oldC === 'none' || newC === 'none') && oldC !== newC)
      ? ((CLEFS[newC] ? CLEFS[newC].bottom : 28) - (CLEFS[oldC] ? CLEFS[oldC].bottom : 28)) : 0;
    if (c && !writable(v)) { render(); return; }
    if (c) commit(() => {
      if (dStep) v.events.forEach(e => { if (!e.rest) e.step += dStep; });
      v.kclef = CLEF_KERN[c];
      if (v.clefs.length && eq(v.clefs[0].t, 0)) v.clefs[0].c = CLEF_KERN[c]; else v.clefs.unshift({t: 0, c: CLEF_KERN[c], ei: 0});
    });
    else render();
  },
  /* B flat in the signature of a voice, on or off (from its beginning) */
  flat(i){
    if (!writable(piece.voices[i])) { refuse(); return; }
    commit(() => {
      const v = piece.voices[i];
      let k = v.keys.find(m => eq(m.t, 0));
      if (!k) { k = {t: 0, alts: {}, ei: 0}; v.keys.unshift(k); }
      const alts = Object.assign({}, k.alts);
      if (alts.b === -1) delete alts.b; else alts.b = -1;
      k.alts = alts; delete k.raw;
    });
  },
  /* a voice moved from place `from` to just before place `to` (0 .. number of voices) */
  move(from, to){
    const n = piece.voices.length;
    if (from === to || from + 1 === to || from < 0 || from >= n) return;
    const order = [...Array(n).keys()];
    const [x] = order.splice(from, 1); order.splice(to > from ? to - 1 : to, 0, x);
    const all = st.vis[pieceKey] || {}, nv = {};
    order.forEach((old, i) => { if (all[old]) nv[i] = all[old]; });
    st.vis[pieceKey] = nv; save();
    ed.sel = null;
    commit(() => { piece.voices = order.map(i => piece.voices[i]); });
  },
  add(where){
    const n = piece.voices.length;
    const ref = where === 'above' ? piece.voices[0] : piece.voices[n - 1];
    const clef = where === 'above' ? 'treble' : (ref && (ref.clef === 'bass' || ref.clef === 'f3') ? 'bass' : (ref && ref.clef === 'treble' ? 'treble8' : 'bass'));
    const v = restVoice('Voice ' + (n + 1), clef, ref);
    ed.sel = null;
    if (where === 'above') shiftVis(0, 1);
    vis(where === 'above' ? 0 : n).clef = clef; save();
    commit(() => { if (where === 'above') piece.voices.unshift(v); else piece.voices.push(v); });
    toast('A new voice at the top. Drag it by ⠿ to put it in its place; press N (note input), then click its staff to write.');
  },
  remove(i){
    if (piece.voices.length < 2) { toast('A score keeps at least one voice.'); return; }
    const name = piece.voices[i].name;
    if (ed.sel && ed.sel.vi >= i) ed.sel = null;
    shiftVis(i, -1);
    commit(() => { piece.voices.splice(i, 1); });
    toast(`${name} removed. Undo brings it back.`);
  }
};
function renderStaffCombine(){
  const box = $('#staffCombine'); if (!box || !piece) return;
  const vs = piece.voices.filter(v => !(v.subOf >= 0)), n = vs.length;
  const cfg = staffCfg() || {map: {}, clefs: {}};
  const getId = v => cfg.map[v.idx] !== undefined ? +cfg.map[v.idx] : vs.indexOf(v);
  const maxSt = Math.min(n, Math.max(2, n));
  const groups = staffGroups(vs);
  const shared = groups.filter(g => g.voices.length > 1);
  const clefOpts = (cur, auto) => `<option value=""${!cur ? ' selected' : ''}>Auto (${esc((CLEF_MENU.find(c => c[0] === auto) || [auto, auto])[1])})</option>` +
    CLEF_MENU.filter(c => c[0] !== 'none').map(([k, lbl]) => `<option value="${k}"${cur === k ? ' selected' : ''}>${esc(lbl)}</option>`).join('');
  box.innerHTML =
    `<div class="sc-head"><button type="button" class="tb sc-back" data-sc="back">← Voices</button><span class="sc-title">Voices per staff</span></div>` +
    `<div class="sc-presets"><button type="button" class="tb" data-sc="sep">Separate staves</button>` +
      (n >= 3 ? `<button type="button" class="tb" data-sc="short">${n === 4 ? 'Short score (SA / TB)' : 'Pair voices'}</button>` : '') + `</div>` +
    `<div class="sc-rows">` + vs.map(v => {
      const cur = getId(v);
      const pills = Array.from({length: maxSt}, (_, si) => `<button type="button" class="sc-pill" data-vi="${v.idx}" data-si="${si}" aria-pressed="${cur === si}">${si + 1}</button>`).join('');
      return `<div class="sc-row"><span class="sc-name">${esc(v.name)}</span><div class="sc-pills">${pills}</div></div>`;
    }).join('') + `</div>` +
    (shared.length ? `<div class="sc-staves"><div class="sc-sub">Shared staff clefs</div>` + shared.map((g, idx) => {
      const auto = chooseGroupClef(g.voices, -999);
      const cur = (cfg.clefs && cfg.clefs[g.id]) || '';
      return `<div class="sc-srow"><span class="sc-slbl">Staff ${g.id + 1}: ${esc(g.voices.map(v => v.name).join(' + '))}</span><select class="sc-clef" data-sid="${g.id}">${clefOpts(cur, auto)}</select></div>`;
    }).join('') + `</div>` : '');
}
function ensureStaffCfg(){
  if (!st.staves || typeof st.staves !== 'object') st.staves = {};
  if (!st.staves[pieceKey]) st.staves[pieceKey] = {map: {}, clefs: {}};
  if (!st.staves[pieceKey].map) st.staves[pieceKey].map = {};
  if (!st.staves[pieceKey].clefs) st.staves[pieceKey].clefs = {};
  return st.staves[pieceKey];
}
function openStaffCombine(on){
  const pop = $('#popVoices');
  if (pop) {
    if (on) pop.classList.add('open');
    else if (canHover()) pop.classList.remove('open');
    const pb = pop.querySelector('button.popbtn'); if (pb) pb.setAttribute('aria-expanded', String(on || pop.classList.contains('open')));
  }
  $('#voiceTable').hidden = !!on;
  $('#staffCombine').hidden = !on;
  if (on) renderStaffCombine();
  if (window.__fitMenus) window.__fitMenus();
}
$('#staffCombine').addEventListener('pointerdown', e => e.stopPropagation());
$('#staffCombine').addEventListener('click', e => {
  e.stopPropagation();
  const pop = $('#popVoices'); if (pop) pop.classList.add('open');
  const act = e.target.closest('[data-sc]');
  if (act) {
    const a = act.dataset.sc;
    if (a === 'back') { openStaffCombine(false); return; }
    if (a === 'sep') { if (st.staves && pieceKey) delete st.staves[pieceKey]; save(); syncUI(); render(); renderStaffCombine(); return; }
    if (a === 'short' && piece) {
      const c = ensureStaffCfg();
      c.map = {}; c.clefs = {};
      piece.voices.forEach((v, i) => { c.map[i] = Math.floor(i / 2); });
      if (st.view !== 'score') st.view = 'score';
      save(); syncUI(); render(); renderStaffCombine();
      return;
    }
  }
  const pill = e.target.closest('.sc-pill');
  if (pill && piece) {
    const vi = +pill.dataset.vi, si = +pill.dataset.si;
    const c = ensureStaffCfg();
    piece.voices.forEach((v, i) => { if (c.map[i] === undefined) c.map[i] = i; });
    c.map[vi] = si;
    if (st.view !== 'score') st.view = 'score';
    save(); syncUI(); render(); renderStaffCombine();
  }
});
$('#staffCombine').addEventListener('change', e => {
  const sel = e.target.closest('.sc-clef'); if (!sel) return;
  e.stopPropagation();
  const c = ensureStaffCfg(), sid = +sel.dataset.sid;
  if (sel.value) c.clefs[sid] = sel.value; else delete c.clefs[sid];
  save(); syncUI(); render(); renderStaffCombine();
});
$('#voiceTable').addEventListener('click', e => {
  const b = e.target.closest('button[data-op]'); if (!b) return;
  e.stopPropagation();
  const i = +b.dataset.i;
  if (b.dataset.op === 'cf') sendTo('cantus-firmus', i);
  else if (b.dataset.op === 'del') VOICE_OPS.remove(i);
  else if (b.dataset.op === 'combine') openStaffCombine(true);
  else VOICE_OPS.add('above');
});
$('#voiceTable').addEventListener('change', e => {
  if (e.target.classList.contains('vname')) { VOICE_OPS.rename(+e.target.dataset.i, e.target.value); return; }
  if (e.target.classList.contains('vclef')) { VOICE_OPS.clef(+e.target.dataset.i, e.target.value); return; }
});
{
  let drag = null;
  const rowAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('#voiceTable tbody tr') : null; };
  const clearMarks = () => document.querySelectorAll('#voiceTable tr.dropbefore, #voiceTable tr.dropafter').forEach(r => r.classList.remove('dropbefore', 'dropafter'));
  $('#voiceTable').addEventListener('pointerdown', e => {
    const h = e.target.closest('.drag'); if (!h) return;
    e.preventDefault();
    const tr = h.closest('tr');
    drag = {from: +h.dataset.i, to: null, tr, id: e.pointerId};
    tr.classList.add('dragging');
    try { h.setPointerCapture(e.pointerId); } catch (err) {}
  });
  $('#voiceTable').addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    clearMarks();
    const tr = rowAt(e.clientX, e.clientY); if (!tr) { drag.to = null; return; }
    const r = tr.getBoundingClientRect(), i = +tr.dataset.i, after = e.clientY > r.top + r.height / 2;
    tr.classList.add(after ? 'dropafter' : 'dropbefore');
    drag.to = after ? i + 1 : i;
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    clearMarks(); d.tr.classList.remove('dragging');
    if (e.type === 'pointerup' && d.to !== null) VOICE_OPS.move(d.from, d.to);
  };
  $('#voiceTable').addEventListener('pointerup', end);
  $('#voiceTable').addEventListener('pointercancel', end);
}
$('#voiceTable').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('vname')) e.target.blur(); e.stopPropagation(); });
/* title and composer */
function setTitle(t){ t = String(t).trim(); if (!piece || !t) return; commit(() => { for (const k of Object.keys(piece.meta)) if (k.startsWith('OTL') || k === 'OPR') delete piece.meta[k]; piece.meta.OTL = t; }); }
function setComposer(c){ if (!piece) return; c = String(c).trim(); commit(() => { delete piece.meta.COA; if (c) piece.meta.COM = c; else delete piece.meta.COM; }); }
$('#metaTitle').addEventListener('change', e => setTitle(e.target.value));
$('#metaComp').addEventListener('change', e => setComposer(e.target.value));
function setCredit(field, metaKey, val){
  if (!piece) return;
  val = String(val || '').trim();
  commit(() => {
    const cr = ensureExt(piece).credits;
    if (val) { cr[field] = val; if (metaKey) piece.meta[metaKey] = val; }
    else { delete cr[field]; if (metaKey) delete piece.meta[metaKey]; }
  });
}
if ($('#metaEditor')) $('#metaEditor').addEventListener('change', e => setCredit('editor', 'ENC', e.target.value));
if ($('#metaSource')) $('#metaSource').addEventListener('change', e => setCredit('source', 'SMS', e.target.value));
if ($('#metaLicence')) $('#metaLicence').addEventListener('change', e => setCredit('licence', 'YEC', e.target.value));
if ($('#metaNotes')) $('#metaNotes').addEventListener('change', e => setCredit('notes', 'ONB', e.target.value));
['#metaTitle', '#metaComp', '#metaEditor', '#metaSource', '#metaLicence'].forEach(id => { const el = $(id); if (el) el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); }); });
if ($('#metaNotes')) $('#metaNotes').addEventListener('keydown', e => e.stopPropagation());

/* a new score: four empty voices, ready to write in */
function kernOf(title, voices){
  const vs = voices.slice().reverse();
  const L = [`!!!OTL: ${title}`, '!!!BARS: auto', '!!!MENS: rules', vs.map(() => '**kern').join('\t'), vs.map(v => `*I"${v[0]}`).join('\t'), vs.map(v => `*clef${v[1]}`).join('\t'),
    vs.map(() => '*met(C)').join('\t'), vs.map(() => '==').join('\t'), vs.map(() => '*-').join('\t')];
  return L.join('\n') + '\n';
}
async function newScore(){
  const id = mineAdd('New score', kernOf('New score', [['Superius', 'G2'], ['Altus', 'Gv2'], ['Tenor', 'Gv2'], ['Bassus', 'F4']]));
  await loadPiece(id);
  ['treble', 'treble8', 'treble8', 'bass'].forEach((c, i) => { vis(i).clef = c; });
  save(); render();
  refreshMine();
  ed.on = true; ed.sel = null; ed.ins = {vi: 0, ei: 0, off: 0, pad: 0}; syncEdit(); showSel(true);
  toast('A new score. Click on a staff to write a note where you point, or type the letters A to G. Notes written over rests take their place. Voices adds, names and orders the voices.');
}
$('#newBtn').addEventListener('click', () => { (H.newScore || newScore)().catch(err => toast(err.message)); });

/* ---------------- between the apps: the square with the arrow opens the score (or one voice) in another one ---------------- */
const APPS = [{id: 'choirbook', name: 'ChoirBook', page: 'choirbook.html', whole: true},
  {id: 'cantus-firmus', name: 'CantusFirmus', page: 'cantus-firmus.html', whole: false},
  {id: 'canon', name: 'Canon Maker', page: 'canon-maker.html', whole: false}];
function sendList(){
  const box = $('#sendList'); if (!box || !piece) return;
  let h = '';
  for (const a of APPS) {
    if (a.id === APP.id) continue;
    /* Canon Maker is its own thing: nothing opens in it; what it makes can be opened in ChoirBook */
    if (a.id === 'canon' || (APP.id === 'canon' && a.id !== 'choirbook')) continue;
    if (a.whole) { h += `<button class="tb" data-to="${a.id}">Open in ${esc(a.name)}</button>`; continue; }
    h += `<div class="sendh">${a.id === 'canon' ? 'As the dux of a canon' : 'One voice in ' + esc(a.name)}</div>`;
    h += piece.voices.map((v, i) => `<button class="tb" data-to="${a.id}" data-i="${i}" title="Open ${esc(v.name)} in ${esc(a.name)}">${esc(v.name)}</button>`).join('');
  }
  box.innerHTML = h;
}
function sendTo(to, i){
  const a = APPS.find(x => x.id === to); if (!a || !piece) return;
  let kern, title = piece.title || 'Score';
  if (i === undefined) kern = piece.text || writeKern(piece);
  else {
    const v = piece.voices[i]; if (!v) return;
    if (!v.events.some(e => !e.rest)) { toast(`${v.name} has no notes yet.`); return; }
    kern = writeKern(Object.assign({}, piece, {voices: [v], text: null}));
    title = `${title}: ${v.name}`;
  }
  try { localStorage.setItem(HANDOFF, JSON.stringify({to, from: APP.name, title, kern, at: Date.now()})); }
  catch (e) { toast('This browser would not pass the score on.'); return; }
  stopPlay();
  goTo(a.page);
}
$('#popSend > button').addEventListener('click', sendList);
$('#popSend').addEventListener('pointerenter', sendList);
$('#sendList').addEventListener('click', e => {
  const b = e.target.closest('button[data-to]'); if (!b) return;
  closePops();
  sendTo(b.dataset.to, b.dataset.i === undefined ? undefined : +b.dataset.i);
});
/* ---------------- between the two apps ---------------- */
const HANDOFF = 'organ:handoff:v1';
const CF_CLEF = {treble: 'treble', treble8: 'treble8', bass: 'bass', f3: 'baritone', c1: 'c1', c2: 'c2', c3: 'c3', c4: 'c4', c5: 'c5'};
function goTo(page){
  try { if (EMBED && window.top.location.host === location.host) { window.top.location.href = new URL(page, window.top.location.href).href; return; } } catch (e) {}
  location.href = page;
}
/* one voice as a melody for the CantusFirmus app: sounding values in minims, pitches, accidentals as written */
function openInCantusFirmus(i){
  const v = piece.voices[i];
  const k0 = keyAt(v, 0), bflat = k0.b === -1;
  const items = [];
  for (let q = 0; q < v.events.length; q++) {
    const e = v.events[q];
    let d = e.d;
    if (!e.rest) { let j = q; while ((v.events[j].tieStart || v.events[j].tieMid) && v.events[j + 1] && !v.events[j + 1].rest && v.events[j + 1].step === e.step) { j++; d += v.events[j].d; } q = j; }
    if (e.rest) { const last = items[items.length - 1]; if (last && last.rest) { last.m += d * 2; continue; } items.push({rest: true, m: d * 2}); continue; }
    const letter = ((e.step % 7) + 7) % 7, sig = (bflat && letter === 6) ? -1 : 0;
    let alt = e.alt === null || e.alt === undefined ? 0 : e.alt;
    if (e.ed && st.ed === 'off') alt = sig;
    const a = alt === sig ? '' : alt < 0 ? 'b' : alt > 0 ? '#' : 'n';
    items.push({m: d * 2, s: e.step, a});
  }
  while (items.length && items[0].rest) items.shift();
  while (items.length && items[items.length - 1].rest) items.pop();
  if (!items.length) { toast(`${v.name} has no notes yet.`); return; }
  const tempus = mensInfo(metAt(v, 0)).T === 3 ? 'O' : 'C';
  const clef = CF_CLEF[vis(i).clef || KERN_CLEF[v.kclef] || 'treble8'] || 'treble8';
  try { localStorage.setItem(HANDOFF, JSON.stringify({to: 'cantus-firmus', title: `${piece.title}: ${v.name}`, clef, bflat, tempus, items, at: Date.now()})); }
  catch (e) { toast('This browser would not pass the voice on.'); return; }
  stopPlay();
  goTo('cantus-firmus.html');
}
/* a melody from the CantusFirmus app becomes a score of one voice, ready for voices to be added */
async function takeHandoff(){
  let h = null; try { h = JSON.parse(localStorage.getItem(HANDOFF) || 'null'); } catch (e) {}
  if (!h || h.to !== APP.id || Date.now() - (h.at || 0) > 10 * 60 * 1000) return false;
  if (typeof h.kern === 'string') {
    try { localStorage.removeItem(HANDOFF); } catch (e) {}
    if (H.fromHandoff) return H.fromHandoff(h);
    const id = mineAdd(h.title || 'Score', h.kern);
    await loadPiece(id); refreshMine();
    toast(`${h.title || 'The score'} came over from ${h.from || 'another app'}. It is kept in ${L.mine}.`);
    return true;
  }
  if (!Array.isArray(h.items)) return false;
  try { localStorage.removeItem(HANDOFF); } catch (e) {}
  const clef = ({treble: 'G2', treble8: 'Gv2', bass: 'F4', baritone: 'F3', g1: 'G1', c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4', c5: 'C5'})[h.clef] || 'Gv2';
  const title = h.title || 'Cantus firmus';
  const lines = [`!!!OTL: ${title}`, '**kern', '*I"Cantus firmus', `*clef${clef}`];
  if (h.bflat) lines.push('*k[b-]');
  lines.push(`*met(${h.tempus === 'O' ? 'O' : 'C'})`, '=1-');
  for (const it of h.items) {
    const d = recipOf(it.m / 2);
    if (it.rest) { lines.push(d + 'r'); continue; }
    const tok = pitchTok(it.s) + (it.alt === -1 ? '-' : it.alt === 1 ? '#' : it.alt === 0 && it.nat ? 'n' : '');
    lines.push(d + tok);
  }
  lines.push('==', '*-');
  /* barlines at every perfection (every brevis), with ties where a note runs over */
  const P = parseKern(lines.join('\n') + '\n');
  const per = h.tempus === 'O' ? 3 : 2;
  for (let t = per; t < P.end - EPS; t += per) P.bars.push({t: rt(t), type: 'single'});
  P.meta.OTL = title;
  const text = writeKern(P);
  const id = mineAdd(title, text);
  await loadPiece(id);
  vis(0).clef = KERN_CLEF[clef] || 'treble8'; save(); render();
  refreshMine();
  toast(`${title} came over from CantusFirmus. Voices adds voices above or below it.`);
  return true;
}
$('#voiceTable').addEventListener('click', e => {
  const b = e.target.closest('.ptri'); if (!b) return;
  e.stopPropagation();   /* the table is redrawn: the menu must not take the old button for a click outside it */
  const o = vis(+b.dataset.i), t = playState(o);
  o.play = t === 'on' ? 'mute' : t === 'mute' ? false : true;
  save(); syncUI(); render(); if (play) restartPlay();
});
$('#voiceTable').addEventListener('change', e => {
  const c = e.target; if (!c.dataset.k) return;
  vis(+c.dataset.i)[c.dataset.k] = c.checked; save(); syncUI(); render();
  if (play && (c.dataset.k === 'on' || c.dataset.k === 'play')) restartPlay();
});
/* pieces */
const libEl = $('#library'), libBtn = $('#libBtn');
function setLib(open, mode){ if (mode !== undefined) libEl.dataset.mode = mode; libEl.hidden = !open; libBtn.setAttribute('aria-expanded', String(open)); postHeight(); if (open) { const q = $('#libQ'); if (q) setTimeout(() => q.focus(), 0); } }
$('#markClear').addEventListener('click', () => { mark = null; document.querySelectorAll('#pages g.mark').forEach(g => g.classList.remove('mark')); $('#markBar').hidden = true; setAddress(pieceKey); postHeight(); });
const libMode = () => APP.catalogue ? 'rep' : '';
libBtn.addEventListener('click', e => { e.stopPropagation(); const open = libEl.hidden || (libEl.dataset.mode || '') !== libMode(); closePops(); setLib(open, libMode()); if (open) shutPop($('#popOpen')); });
if ($('#myBtn')) $('#myBtn').addEventListener('click', e => { e.stopPropagation(); const open = libEl.hidden || (libEl.dataset.mode || '') !== 'mine'; closePops(); setLib(open, 'mine'); if (open) shutPop($('#popOpen')); });
/* Repertoire opens on click (not hover), and closes without delay once the pointer leaves it. */
{
  const mouse = () => window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  const wrap = libEl.closest('.libwrap') || libEl.parentNode;
  let tShut = 0, libNavAt = 0;
  /* clicks inside the library (composer, genre, back, category) can resize its contents under a stationary pointer;
     ignore the synthetic mouseleave that fires right after such a click */
  libEl.addEventListener('pointerdown', e => { if (!e.target.closest('.pc')) libNavAt = performance.now(); }, true);
  libEl.addEventListener('click', e => { if (!e.target.closest('.pc')) libNavAt = performance.now(); }, true);
  /* passing over the other choices of the Open menu (New score, Open file) closes the panel */
  $('#openList').addEventListener('mouseover', e => {
    const b = e.target.closest('button'); if (!mouse() || !b || b === libBtn || b.id === 'myBtn') return;
    if (!libEl.hidden) setLib(false);
  });
  const ssOpenHere = () => window.StyledSelect && StyledSelect.isOpen() && libEl.contains(StyledSelect.owner());
  const shutNow = () => {
    clearTimeout(tShut);
    if (libEl.hidden || !mouse()) return;
    if (performance.now() - libNavAt < 450) return;
    if (wrap.matches(':hover') || ssOpenHere()) { if (ssOpenHere()) tShut = setTimeout(shutNow, 100); return; }
    setLib(false); if (libEl.contains(document.activeElement)) document.activeElement.blur();
  };
  wrap.addEventListener('mouseleave', () => { if (mouse()) shutNow(); });
  wrap.addEventListener('mouseenter', () => clearTimeout(tShut));
  /* + Show the links: opens while the mouse is over it */
  libEl.addEventListener('mouseover', e => {
    const d = e.target.closest && e.target.closest('details.morelinks'); if (!d || !mouse()) return;
    d.open = true;
  });
  libEl.addEventListener('mouseout', e => {
    const d = e.target.closest && e.target.closest('details.morelinks'); if (!d || !mouse() || d.contains(e.relatedTarget)) return;
    d.open = false;
  });
  /* a click on the summary with a mouse keeps it as the hover left it (open), instead of shutting it under the pointer */
  libEl.addEventListener('click', e => { const s = e.target.closest && e.target.closest('details.morelinks > summary'); if (s && mouse()) e.preventDefault(); }, true);
}
/* a piece chosen in the recent list opens at once */
if ($('#openRecent')) $('#openRecent').addEventListener('click', e => {
  const x = e.target.closest('.rdel');
  if (x) {
    e.stopPropagation(); e.preventDefault();
    const id = x.dataset.del, all = mineAll();
    if (!all[id]) { toggleFav(id); return; }
    const entry = all[id]; let text = null; try { text = localStorage.getItem(EKEY(id)); } catch (err) {}
    delete all[id]; mineSave(all); try { localStorage.removeItem(EKEY(id)); } catch (err) {}
    refreshMine();
    if (H.mineRemoved) H.mineRemoved(id);
    toast(`“${entry.title || 'Untitled'}” deleted.`, {label: 'Undo', fn: () => {
      const a = mineAll(); a[id] = entry; mineSave(a);
      if (text !== null) { try { localStorage.setItem(EKEY(id), text); } catch (err) {} }
      refreshMine();
    }});
    return;
  }
  const b = e.target.closest('.pc'); if (!b) return;
  mark = null; loadPiece(b.dataset.p).catch(err => { pagesEl.innerHTML = `<p class="msg">${err.html || esc(err.message)}</p>`; });
});
/* the Open menu closes once a choice is made */
$('#openList').addEventListener('click', e => { if (e.target.closest('button')) { closePops(); if (document.activeElement) document.activeElement.blur(); } });
libEl.addEventListener('click', e => {
  const fv = e.target.closest('.fav');
  if (fv) { e.stopPropagation(); toggleFav(fv.dataset.fav); return; }
  const del = e.target.closest('.mdel');
  if (del) {
    e.stopPropagation();
    const id = del.dataset.del, all = mineAll(), name = (all[id] && all[id].title) || 'This score';
    if (!confirm(`Remove “${name}” from ${L.mine}? It cannot be brought back.`)) return;
    delete all[id]; mineSave(all); try { localStorage.removeItem(EKEY(id)); } catch (err) {}
    refreshMine();
    if (H.mineRemoved) H.mineRemoved(id);
    return;
  }
  e.stopPropagation();
  const nav = e.target.closest('[data-comp],[data-genre],[data-back]');
  if (nav) {
    if (nav.dataset.comp !== undefined) { lib.comp = nav.dataset.comp; lib.genre = ''; }
    else if (nav.dataset.genre !== undefined) lib.genre = nav.dataset.genre;
    else if (nav.dataset.back === 'genres') lib.genre = '';
    else { lib.comp = ''; lib.genre = ''; }
    const sc = $('#libComp'), sg = $('#libGenre'); if (sc) sc.value = lib.comp; if (sg) sg.value = lib.genre;
    lib.shown = 150; $('#libFeat').hidden = !!(lib.q || lib.comp || lib.genre || lib.voices); libList(); libEl.scrollTop = 0;
    return;
  }
  if (e.target.id === 'libMore') { lib.shown += 300; libList(); return; }
  const b = e.target.closest('.pc'); if (!b) return;
  setLib(false); mark = null;
  loadPiece(b.dataset.p).then(() => { if (!pieceKey.startsWith('mine:')) setAddress(pieceKey); }).catch(err => { pagesEl.innerHTML = `<p class="msg">${err.html || esc(err.message)}</p>`; });
});
/* the note-input tools (shared/note-input.js, the same as CantusFirmus) go in before the pop-overs are wired */
NoteInput.build($('#editBar'), {what: 'voice', whole: 'the whole voice'});
/* the Add menu belongs to the note input controls: it shows when note input is on */
{ const pod = $('#popAdd').parentNode; $('#editBar').appendChild(pod); }
/* pop-overs: hover, or click to keep open */
function closePops(except){ document.querySelectorAll('.pop.open').forEach(p => { if (p !== except) { p.classList.remove('open'); p.querySelector('button').setAttribute('aria-expanded', 'false'); } }); }
/* with a mouse a menu follows the pointer: nothing is pinned open by a click. Touch screens tap to open and close. */
const canHover = () => window.matchMedia && matchMedia('(hover:hover)').matches;
function shutPop(p){
  if (!canHover() || !p) return;
  p.classList.add('shut');
  p.addEventListener('mouseleave', () => p.classList.remove('shut'), {once: true});
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
document.querySelectorAll('#openList, #exportList, #sendList').forEach(l => l.addEventListener('click', e => { if (e.target.closest('button') && !e.target.closest('[data-keep]')) shutPop(l.closest('.pop')); }));
document.querySelectorAll('.pop > button:not(#mic):not(#recGo)').forEach(b => b.addEventListener('click', () => {
  if (canHover()) return;
  const p = b.parentNode, open = !p.classList.contains('open');
  closePops(p); setLib(false); p.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  postHeight();
}));
document.addEventListener('click', e => { if (!e.target.closest('.pop')) closePops(); if (!e.target.closest('.libwrap')) { if (!libEl.hidden) setLib(false); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePops(); setLib(false); }
});
/* open a file from the computer, or drop one on the page */
$('#openBtn').addEventListener('click', () => $('#fileIn').click());
$('#fileIn').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  openFile(file);
  e.target.value = '';
});
if (APP.drop !== false) {
document.addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drop'); });
document.addEventListener('dragleave', e => { if (!e.relatedTarget) document.body.classList.remove('drop'); });
document.addEventListener('drop', e => {
  e.preventDefault(); document.body.classList.remove('drop');
  const file = e.dataTransfer.files[0]; if (file) openFile(file);
});
}
/* **kern is read as it is; MusicXML, MuseScore, MIDI, LilyPond, GABC and CMME are turned into **kern first (shared/score-import.js) */
/* Enhanced CMME reader (v2): reads all CMME 0.95 mensural information including TempoChange speed factors,
   mid-voice clefs & key signatures, ModusMinor/ModusMaior, MultiEvent chords, Stem Dir/Side, Rest shape,
   separate Corona vs Signum, Ligature kind, OriginalText, Custos, Lacuna, Annotation, VariantReadings,
   Plainchant sections, Credits, and unknown tag pass-through. */
function gcdInt(a, b){ a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function toFrac(x, maxDen = 48){
  if (!isFinite(x) || x <= 0) return [1, 1];
  let bestN = Math.round(x), bestD = 1, bestErr = Math.abs(x - bestN);
  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(x * d), err = Math.abs(x - n / d);
    if (err < bestErr - 1e-7) { bestN = n; bestD = d; bestErr = err; if (err < 1e-6) break; }
  }
  const g = gcdInt(bestN, bestD);
  return [bestN / g, bestD / g];
}
function fracStr(x){ const [n, d] = toFrac(x); return d === 1 ? String(n) : n + '/' + d; }

function cmmeToKernRich(text, fileName){
  const doc = new DOMParser().parseFromString(text, 'application/xml'), root = doc.documentElement;
  if (!root || root.localName !== 'Piece') return null;
  const LET = 'CDEFGAB';
  const ch = (el, tag) => el ? [...el.children].filter(c => c.localName === tag) : [];
  const c1 = (el, tag) => ch(el, tag)[0] || null;
  const tx = (el, tag) => { const c = tag ? c1(el, tag) : el; return c ? c.textContent.trim() : ''; };
  const gd = c1(root, 'GeneralData');
  const title = tx(gd, 'Title') || (fileName || 'Untitled').replace(/\.cmme(\.xml)?$/i, '');
  const source = tx(gd, 'Section');
  const editor = tx(gd, 'Editor');
  const pubNotes = tx(gd, 'PublicNotes');
  const notes = tx(gd, 'Notes');
  let composer = tx(gd, 'Composer'), attributed = false;
  { const m = /^\((.*)\)$/.exec(composer); if (m) { composer = m[1].trim(); attributed = true; } }

  const ext = defaultExt();
  if (editor) ext.credits.editor = editor;
  if (source) ext.credits.source = source;
  if (pubNotes) ext.credits.publicNotes = pubNotes;
  if (notes) ext.credits.notes = notes;

  const vd = c1(root, 'VoiceData');
  const names = ch(vd, 'Voice').map(v => tx(v, 'Name'));
  const n = Math.max(+tx(vd, 'NumVoices') || 0, names.length);
  const voices = Array.from({length: n}, (_, i) => ({
    name: names[i] || (i === 0 && n > 1 ? 'Superius' : 'Voice ' + (i + 1)),
    abbr: '', kclef: null, oclef: null,
    events: [], mets: [], keys: [], clefs: [], verses: 0, t: 0
  }));

  const pitchOf = el => {
    const L = tx(el, 'LetterName').toUpperCase(), o = +tx(el, 'OctaveNum');
    if (!L || isNaN(o)) return null;
    const li = LET.indexOf(L);
    if (li < 0) return null;
    return 7 * (o + (L === 'A' || L === 'B' ? 0 : 1)) + li;
  };
  const len = el => { const l = c1(el, 'Length'); return l ? (+tx(l, 'Num') || 0) / (+tx(l, 'Den') || 1) : 0; };
  const TYPE_G = {Maxima: 'Mx', Longa: 'L', Brevis: 'B', Semibrevis: 'S', Minima: 'M', Semiminima: 'Sm', Fusa: 'F', Semifusa: 'Sf'};
  const KNOWN_EV = new Set(['MultiEvent','VariantReadings','Clef','Mensuration','Dot','Note','Rest','Custos','Lacuna','Annotation','LineEnd','Barline','ColorChange','ModernKeySignature','Proportion']);

  /* find base TempoChange from the first Mensuration in Voice 1 (default 1) */
  let baseTc = 1;
  {
    const firstMs = ch(root, 'MusicSection').map(ms => c1(ms, 'MensuralMusic')).find(Boolean);
    if (firstMs) {
      const v0 = ch(firstMs, 'Voice')[0];
      const m0 = v0 && ch(c1(v0, 'EventList') || v0, 'Mensuration')[0];
      const tcEl = m0 && c1(c1(m0, 'MensInfo'), 'TempoChange');
      if (tcEl) {
        const a = +tx(tcEl, 'Num') || 1, b = +tx(tcEl, 'Den') || 1;
        if (a > 0 && b > 0) baseTc = a / b;
      }
    }
  }

  const bars = [], sections = [];
  let t0 = 0;

  for (const ms of ch(root, 'MusicSection')) {
    /* Plainchant section: convert CMME plainchant notes/clefs/syllables into GABC so it renders as its own 4-line chant system */
    const pcSec = c1(ms, 'Plainchant');
    if (pcSec) {
      const pcTitle = tx(pcSec, 'Title') || tx(ms, 'Title') || 'Plainchant';
      let gabcParts = [];
      let clefStep = 28, clefLine = 4, hasClef = false; /* default c4: C4 on line 4 */
      const stepToGabc = stp => {
        const bottomStep = clefStep - 2 * (clefLine - 1);
        const pos = stp - bottomStep; /* 0 = line 1 = 'd' */
        const idx = Math.max(0, Math.min(12, pos + 3));
        return String.fromCharCode('a'.charCodeAt(0) + idx);
      };
      const pcVoices = ch(pcSec, 'Voice');
      const pcEvl = (pcVoices[0] && (c1(pcVoices[0], 'EventList') || pcVoices[0])) || c1(pcSec, 'EventList') || pcSec;
      let curSyl = '', curNotes = '';
      const flushSyl = () => {
        if (curSyl || curNotes) { gabcParts.push((curSyl || '') + '(' + curNotes + ')'); curSyl = ''; curNotes = ''; }
      };
      for (const el of [...pcEvl.children]) {
        const tg = el.localName;
        if (tg === 'Clef') {
          flushSyl();
          const app = tx(el, 'Appearance').toLowerCase(), loc = +tx(el, 'StaffLoc') || 7;
          if (app === 'c' || app === 'f') {
            clefLine = Math.max(1, Math.min(4, Math.round((loc + 1) / 2)));
            clefStep = app === 'f' ? 24 : 28;
            gabcParts.push(`(${app}${clefLine})`);
            hasClef = true;
          }
        } else if (tg === 'Note') {
          const stp = pitchOf(el);
          const mt = c1(el, 'ModernText');
          const syl = mt ? tx(mt, 'Syllable') : '';
          if (syl) { flushSyl(); curSyl = syl + (c1(mt, 'WordEnd') ? '' : '-'); }
          if (stp !== null) curNotes += stepToGabc(stp);
        } else if (tg === 'Dot') {
          curNotes += '.';
        } else if (tg === 'Barline') {
          flushSyl();
          gabcParts.push('(::)');
        }
      }
      flushSyl();
      if (!hasClef && gabcParts.length) gabcParts.unshift('(c4)');
      const gabc = gabcParts.length ? gabcParts.join(' ') : [...pcSec.getElementsByTagName('*')].filter(x => x.localName === 'Syllable' || x.localName === 'Text').map(x => x.textContent.trim()).filter(Boolean).join(' ');
      ext.chants.push({t: rt(t0), title: pcTitle, gabc});
      continue;
    }
    const mm = c1(ms, 'MensuralMusic');
    if (!mm) continue;
    let secEnd = t0;
    const msVoices = ch(mm, 'Voice');

    for (const vx of msVoices) {
      const vi = (+tx(vx, 'VoiceNum') || 1) - 1, V = voices[vi];
      if (!V) continue;
      let t = t0, effP = 1, curTc = baseTc, propF = 1, curInk = '', curSign = 'C', open = false;
      let sig = V.keys.length ? Object.assign({}, V.keys[V.keys.length - 1].alts) : {};
      let sigDirty = false;
      const pendingAcc = {};
      const evs = [];

      const parseNoteEl = e => {
        const lMin = len(e), d = rt((lMin / 2) / (effP * propF));
        if (d <= 0) return null;
        const ev = {t: rt(t), d, syl: []};
        if (e.localName === 'Rest') {
          ev.rest = true;
          const bot = +tx(e, 'BottomStaffLine'), sp = +tx(e, 'NumSpaces');
          if (bot > 0 && sp > 0) ext.rests[vi + ':' + ev.t] = {bot, sp};
          return ev;
        }
        ev.step = pitchOf(e);
        if (ev.step === null) { ev.rest = true; delete ev.step; return ev; }
        const L = tx(e, 'LetterName').toLowerCase(), ma = c1(e, 'ModernAccidental'), s0 = sig[L] || 0;
        const a = ma ? Math.max(-1, Math.min(1, Math.round(+tx(ma, 'PitchOffset') || 0))) : 0;
        if (L in pendingAcc) {
          ev.alt = pendingAcc[L];
          ev.ed = false;
          delete pendingAcc[L];
        } else {
          ev.alt = a === s0 ? null : a;
          ev.ed = a !== s0;
        }
        if (c1(e, 'Colored')) ev.colH = true;
        else if (curInk) ev.look = curInk;
        if (c1(e, 'Corona')) ev.ferm = true;
        if (c1(e, 'Signum')) ev.signum = true;
        const stemEl = c1(e, 'Stem');
        if (stemEl) {
          const dir = tx(stemEl, 'Dir').toLowerCase(), side = tx(stemEl, 'Side').toLowerCase();
          if (dir === 'up') ev.stemDirOvr = 'u';
          else if (dir === 'down') ev.stemDirOvr = 'd';
          else if (dir === 'none') ev.stemDirOvr = 'n';
          if (side === 'left') ev.stemSideOvr = 'l';
          else if (side === 'right') ev.stemSideOvr = 'r';
        }
        const ligEl = c1(e, 'Lig');
        if (ligEl) {
          ev.ligNext = true;
          const lk = tx(ligEl).toLowerCase();
          if (lk === 'recta' || lk === 'obliqua') ext.ligKind[vi + ':' + ev.t] = lk;
        }
        const tp = tx(e, 'Type'), g = TYPE_G[tp];
        if (tp === 'Longa' || tp === 'Maxima') ev.longa = true;
        if (g) {
          const mi = mensInfo(curSign), nomMin = (nomW(g, mi.T, mi.P, mi.M, mi.X) || 0) * 2;
          if (nomMin > 0) {
            if (!ev.colH && Math.abs(lMin - 2 * nomMin) < 1e-4) ev.altd = true;
            else if (!ev.colH && Math.abs(lMin - 1.5 * nomMin) < 1e-4) ev.isDottedAdd = true;
          }
        }
        const mt = c1(e, 'ModernText');
        if (mt && tx(mt, 'Syllable')) {
          const end = !!c1(mt, 'WordEnd');
          ev.syl = [(open ? '-' : '') + tx(mt, 'Syllable') + (end ? '' : '-')];
          V.verses = Math.max(V.verses, 1);
          open = !end;
        }
        const ot = c1(e, 'OriginalText');
        if (ot && (tx(ot, 'Text') || tx(ot))) ext.origText[vi + ':' + ev.t] = tx(ot, 'Text') || tx(ot);
        return ev;
      };

      const flushSig = () => {
        if (!sigDirty) return;
        const raw = Object.entries(sig).map(([l, a]) => l + (a < 0 ? '-' : '#')).join('');
        V.keys.push({t: rt(t), alts: Object.assign({}, sig), raw, ei: V.events.length + evs.length});
        sigDirty = false;
      };

      const walk = list => { for (const e of list) {
        const tag = e.localName;
        /* notes sounding together in one voice (a chord, divisi): one event with the others as its chord. Where some are
           coloured and others not, the colour only tells the supplementary note from the main one (Clemens Goldberg's
           editions): the chord takes the white note's value and the black note is shown black, for the eye only */
        if (tag === 'MultiEvent') {
          flushSig();
          const kids = [...e.children], noteEls = kids.filter(c => c.localName === 'Note');
          const otherEls = kids.filter(c => c.localName !== 'Note' && c.localName !== 'Rest');
          if (otherEls.length) walk(otherEls);
          if (!noteEls.length) { walk(kids.filter(c => c.localName === 'Rest')); continue; }
          const grp = noteEls.map(parseNoteEl).filter(q => q && !q.rest);
          if (!grp.length) continue;
          const mixed = grp.some(q => q.colH) && grp.some(q => !q.colH);
          const cand = mixed ? grp.filter(q => !q.colH) : grp;
          const main = cand.reduce((a, q) => q.d > a.d ? q : a, cand[0]);
          const others = grp.filter(q => q !== main && q.step !== main.step);
          const sylSrc = grp.find(q => q.syl && q.syl.length);
          if (sylSrc) main.syl = sylSrc.syl;
          if (grp.some(q => q.ligNext)) main.ligNext = true;
          if (grp.some(q => q.ferm)) main.ferm = true;
          if (grp.some(q => q.signum)) main.signum = true;
          if (others.length) {
            const seen = new Set([main.step]);
            const chord = [];
            for (const q of others) {
              if (seen.has(q.step)) continue;
              seen.add(q.step);
              const co = {step: q.step, alt: q.alt, ed: q.ed};
              if (mixed && q.colH) co.look = 'black';
              else if (q.look) co.look = q.look;
              chord.push(co);
            }
            if (chord.length) { chord.sort((a, b) => a.step - b.step); main.chord = chord; }
          }
          main.t = rt(t);
          evs.push(main); t = rt(t + main.d);
          continue;
        }
        if (tag === 'VariantReadings') {
          const rds = ch(e, 'Reading');
          const defRd = rds.find(r => ch(r, 'VariantVersionID').some(x => x.textContent.trim().toUpperCase() === 'DEFAULT')) || rds[0];
          const vStart = rt(t);
          if (defRd) walk([...(c1(defRd, 'Music') || defRd).children]);
          const vEnd = rt(t);
          const altReadings = [];
          for (const r of rds) {
            const vids = ch(r, 'VariantVersionID').map(x => x.textContent.trim()).filter(Boolean);
            const ver = vids.join(', ') || 'Alt';
            const rMusic = c1(r, 'Music') || r;
            const rNotes = ch(rMusic, 'Note').concat(ch(rMusic, 'Rest')).map(x => {
              const tp = tx(x, 'Type'), ln = tx(x, 'LetterName'), oc = tx(x, 'OctaveNum');
              return x.localName === 'Rest' ? tp + ' rest' : tp + ' ' + ln + oc;
            });
            altReadings.push({ver, summary: rNotes.join(', '), xml: new XMLSerializer().serializeToString(r)});
          }
          if (altReadings.length > 1) {
            ext.variants.push({id: 'v' + (ext.variants.length + 1), vi, t: vStart, endT: vEnd, readings: altReadings});
          }
          continue;
        }
        if (tag === 'Clef') {
          const app = tx(e, 'Appearance'), loc = +tx(e, 'StaffLoc'), pc = c1(e, 'Pitch');
          if (c1(e, 'Signature') && pc) {
            const L = tx(pc, 'LetterName').toLowerCase();
            if (/^Bmol/i.test(app)) { sig[L] = -1; sigDirty = true; }
            else if (/^(Diesis|Sharp)/i.test(app)) { sig[L] = 1; sigDirty = true; }
          } else if (pc && /^(Bmol|Diesis|Sharp|Bqua|Natural)/i.test(app)) {
            /* CMME encodes inline source-written accidentals as <Clef> without <Signature/> */
            const L = tx(pc, 'LetterName').toLowerCase();
            pendingAcc[L] = /^Bmol/i.test(app) ? -1 : /^(Diesis|Sharp)/i.test(app) ? 1 : 0;
          } else if (/^[CFG]$/.test(app) && loc % 2) {
            const cName = app + ((loc + 1) / 2);
            if (!V.oclef && t < EPS) V.oclef = cName;
            if (KERN_CLEF[cName]) V.clefs.push({t: rt(t), c: cName, ei: V.events.length + evs.length});
          }
          continue;
        }
        if (tag === 'Proportion') {
          const n1 = +tx(e, 'Num'), d1 = +tx(e, 'Den');
          if (n1 > 0 && d1 > 0) propF *= n1 / d1;
          continue;
        }
        if (tag === 'ColorChange') {
          const pc = c1(e, 'PrimaryColor') || e;
          const colTxt = (tx(pc, 'Color') || tx(pc) || '').toLowerCase();
          const fillTxt = (tx(pc, 'Fill') || '').toLowerCase();
          if (colTxt.includes('red')) curInk = 'red';
          else if (colTxt.includes('white') || fillTxt === 'void') curInk = 'white';
          else if (colTxt.includes('black') && fillTxt === 'full') curInk = 'black';
          else curInk = '';
          try { ext.pass.push(new XMLSerializer().serializeToString(e)); } catch (err) {}
          continue;
        }
        if (tag === 'Mensuration') {
          flushSig();
          propF = 1;
          const sg = c1(e, 'Sign'), num = c1(e, 'Number'), minf = c1(e, 'MensInfo');
          let sign = '';
          if (sg) {
            sign = tx(sg, 'MainSymbol') === 'O' ? 'O' : 'C';
            if (c1(sg, 'Dot')) sign += '.';
            if (+tx(sg, 'Strokes') > 0) sign += '|';
          }
          if (num && +tx(num, 'Num')) {
            const n1 = +tx(num, 'Num'), d1 = +tx(num, 'Den');
            sign += d1 > 0 && d1 !== 1 ? n1 + '/' + d1 : String(n1);
          }
          if (!sign && minf) {
            const tp = +tx(minf, 'Tempus') || 2, pr = +tx(minf, 'Prolatio') || 2;
            sign = (tp === 3 ? 'O' : 'C') + (pr === 3 ? '.' : '');
          }
          if (!sign) continue;
          /* In CMME, each <Mensuration> resets TempoChange to 1/1 unless explicitly specified in <MensInfo><TempoChange> */
          curTc = 1;
          if (minf) {
            if (+tx(minf, 'ModusMinor') === 3) sign += ';mp';
            if (+tx(minf, 'ModusMaior') === 3) sign += ';xp';
            const tcEl = c1(minf, 'TempoChange');
            if (tcEl) {
              const a = +tx(tcEl, 'Num') || 1, b = +tx(tcEl, 'Den') || 1;
              if (a > 0 && b > 0) curTc = a / b;
            }
          }
          {
            const targetP = curTc / baseTc;
            const baseP = mensInfo(sign).baseP;
            const sfVal = targetP / baseP;
            if (Math.abs(sfVal - 1) > 1e-5) sign += ';sf=' + fracStr(sfVal);
          }
          curSign = sign;
          effP = mensInfo(sign).p;
          V.mets.push({t: rt(t), sign, ei: V.events.length + evs.length});
          continue;
        }
        if (tag === 'Dot') {
          const prev = evs[evs.length - 1];
          if (prev && !prev.rest && !prev.isDottedAdd) prev.dd = true;
          continue;
        }
        if (tag === 'Custos') {
          const stp = pitchOf(e);
          if (stp !== null) ext.custos.push({vi, t: rt(t), step: stp});
          continue;
        }
        if (tag === 'Lacuna') {
          const ld = len(e) ? rt((len(e) / 2) / effP) : 2;
          ext.lacunae.push({vi, t: rt(t), d: ld, label: tx(e, 'Text') || '[lacuna]'});
          continue;
        }
        if (tag === 'Annotation') {
          const atx = tx(e, 'Text') || tx(e);
          if (atx) ext.ann.push({id: 'a' + (ext.ann.length + 1), vi, t: rt(t), text: atx});
          continue;
        }
        if (tag === 'Note' || tag === 'Rest') {
          flushSig();
          const ev = parseNoteEl(e);
          if (ev) { evs.push(ev); t = rt(t + ev.d); }
          continue;
        }
        if (!KNOWN_EV.has(tag)) {
          try { ext.pass.push(new XMLSerializer().serializeToString(e)); } catch (err) {}
        }
      } };

      walk([...(c1(vx, 'EventList') || vx).children]);
      flushSig();
      let lig = 0, lid = 0;
      for (let k = 0; k < evs.length; k++) {
        const e = evs[k];
        if (e.rest) { lig = 0; continue; }
        if (!lig && e.ligNext) lig = ++lid + vi * 1000;
        if (lig) e.lig = lig;
        if (!e.ligNext) lig = 0;
        delete e.ligNext;
      }
      V.events.push(...evs);
      V.end = rt(t);
      secEnd = Math.max(secEnd, t);
    }

    secEnd = rt(secEnd);
    let fin = secEnd;
    for (const V of voices) {
      const last = [...V.events].reverse().find(e => e.t >= t0 - EPS && !e.rest);
      if (last && last.longa) { last.long = true; fin = Math.min(fin, last.t); }
    }
    const ref = voices.find(V => V.mets.some(m => m.t >= t0 - EPS)) || voices[0];
    const ms0 = ref ? ref.mets.filter(m => m.t >= t0 - EPS && m.t < secEnd - EPS) : [];
    ms0.forEach((m, k) => {
      const mi = mensInfo(m.sign);
      const br = rt(mi.T * (mi.P === 3 ? 1.5 : 1) / mi.p), to = k + 1 < ms0.length ? ms0[k + 1].t : secEnd;
      if (br > EPS) {
        for (let b = rt(m.t + br); b < to - EPS; b = rt(b + br)) if (b <= fin + EPS) bars.push({t: b, type: 'single'});
      }
      if (to < secEnd - EPS) bars.push({t: rt(to), type: 'single'});
    });
    if (t0 > EPS) bars.push({t: rt(t0), type: 'double'});
    t0 = secEnd;
  }

  for (const V of voices) {
    V.events.forEach(e => { delete e.longa; delete e.isDottedAdd; });
    if (!V.clefs.length || V.clefs[0].t > EPS) {
      const c0 = !V.oclef ? 'G2' : /^F/.test(V.oclef) ? 'F4' : /^(G|C1|C2)/.test(V.oclef) ? 'G2' : 'Gv2';
      V.clefs.unshift({t: 0, c: c0, ei: 0});
    }
    V.kclef = V.clefs[0].c;
  }
  const activeVoices = voices.filter(v => v.events.length);
  if (!activeVoices.length) return null;
  const meta = {OTL: title};
  if (composer) meta[attributed ? 'COA' : 'COM'] = composer;
  if (editor) meta.ENC = editor;
  if (source) meta.SMS = source;
  if (pubNotes || notes) meta.ONB = [pubNotes, notes].filter(Boolean).join(' | ');
  meta['RDF**kern'] = '@ = coloured (black) note; N = shown black only (no effect on the value)';

  const P = {
    title, composer, attributed,
    voices: activeVoices,
    bars: bars.filter((b, idx, arr) => b.t > EPS && b.t < t0 - EPS && arr.findIndex(q => eq(q.t, b.t)) === idx).sort((a, b) => a.t - b.t),
    sections, end: rt(t0), meta, barNums: [], ext
  };
  return writeKern(P);
}

/* Full CMME 0.95 XML exporter: writes back all mensural information, credits, extensions, and pass-through */
function exportCMME(P){
  const xe = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ext = ensureExt(P);
  const LET = 'CDEFGAB';
  const G_TYPE = {Mx: 'Maxima', L: 'Longa', B: 'Brevis', S: 'Semibrevis', M: 'Minima', Sm: 'Semiminima', F: 'Fusa', Sf: 'Semifusa'};
  const stepToLO = step => {
    const L = LET[((step % 7) + 7) % 7];
    const oct = Math.floor(step / 7) - (L === 'A' || L === 'B' ? 0 : 1);
    return [L, oct];
  };
  const out = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push('<Piece xmlns="http://www.cmme.org" CMMEversion="0.95">');
  out.push('  <GeneralData>');
  out.push(`    <Title>${xe(P.title || 'Untitled')}</Title>`);
  if (ext.credits.source) out.push(`    <Section>${xe(ext.credits.source)}</Section>`);
  if (P.composer) out.push(`    <Composer>${xe(P.attributed ? '(' + P.composer + ')' : P.composer)}</Composer>`);
  if (ext.credits.editor) out.push(`    <Editor>${xe(ext.credits.editor)}</Editor>`);
  if (ext.credits.publicNotes || ext.credits.notes) out.push(`    <PublicNotes>${xe(ext.credits.publicNotes || ext.credits.notes)}</PublicNotes>`);
  if (ext.credits.licence) out.push(`    <Notes>${xe(ext.credits.licence)}</Notes>`);
  out.push('  </GeneralData>');
  out.push('  <VoiceData>');
  out.push(`    <NumVoices>${P.voices.length}</NumVoices>`);
  P.voices.forEach(v => {
    out.push(`    <Voice><Name>${xe(v.name || 'Voice')}</Name></Voice>`);
  });
  out.push('  </VoiceData>');

  if (ext.variants.length) {
    const vers = [...new Set(ext.variants.flatMap(vr => (vr.readings || []).map(r => r.ver)).filter(Boolean))];
    if (vers.length) {
      out.push('  <VariantVersionData>');
      vers.forEach(ver => out.push(`    <VariantVersion><ID>${xe(ver)}</ID></VariantVersion>`));
      out.push('  </VariantVersionData>');
    }
  }

  out.push('  <MusicSection>');
  out.push('    <MensuralMusic>');
  out.push(`      <NumVoices>${P.voices.length}</NumVoices>`);
  P.voices.forEach((v, vi) => {
    out.push('      <Voice>');
    out.push(`        <VoiceNum>${vi + 1}</VoiceNum>`);
    out.push('        <EventList>');
    const emitClef = c => {
      const m = String(c || 'G2').match(/^([CFG])v?(\d)$/);
      if (!m) return;
      out.push(`          <Clef><Appearance>${m[1]}</Appearance><StaffLoc>${(+m[2]) * 2 - 1}</StaffLoc></Clef>`);
    };
    const emitKey = alts => {
      for (const [l, a] of Object.entries(alts || {})) {
        if (!a) continue;
        const app = a < 0 ? 'Bmol' : 'Diesis';
        out.push(`          <Clef><Appearance>${app}</Appearance><StaffLoc>3</StaffLoc><Pitch><LetterName>${l.toUpperCase()}</LetterName><OctaveNum>3</OctaveNum></Pitch><Signature/></Clef>`);
      }
    };
    const emitMens = sign => {
      const mi = mensInfo(sign), s = mensBase(sign);
      const main = /O/.test(s) ? 'O' : 'C', dot = /\./.test(s), strokes = /\|/.test(s) ? 1 : 0;
      const [tn, td] = toFrac(mi.p);
      out.push('          <Mensuration>');
      out.push(`            <Sign><MainSymbol>${main}</MainSymbol>${dot ? '<Dot/>' : ''}${strokes ? '<Strokes>1</Strokes>' : ''}</Sign>`);
      const fr = s.match(/(\d+)\s*\/\s*(\d+)/), nm = fr ? '' : (s.match(/\d+/) || [''])[0];
      if (fr) out.push(`            <Number><Num>${fr[1]}</Num><Den>${fr[2]}</Den></Number>`);
      else if (nm) out.push(`            <Number><Num>${nm}</Num><Den>1</Den></Number>`);
      out.push(`            <MensInfo><Prolatio>${mi.P}</Prolatio><Tempus>${mi.T}</Tempus><ModusMinor>${mi.M}</ModusMinor><ModusMaior>${mi.X}</ModusMaior><TempoChange><Num>${tn}</Num><Den>${td}</Den></TempoChange></MensInfo>`);
      out.push('          </Mensuration>');
    };

    const c0 = v.oclef || v.kclef || (v.clefs[0] && v.clefs[0].c) || 'G2';
    emitClef(c0);
    if (v.keys[0] && v.keys[0].t < EPS) emitKey(v.keys[0].alts);
    if (v.mets[0] && v.mets[0].t < EPS) emitMens(v.mets[0].sign);

    const syms = notate(P, v, 'real');
    for (let k = 0; k < syms.length; k++) {
      const s = syms[k], ek = vi + ':' + rt(s.t);
      if (s.t > EPS) {
        const cf = v.clefs.find(q => q.t > EPS && eq(q.t, s.t));
        if (cf) emitClef(cf.c);
        const kf = v.keys.find(q => q.t > EPS && eq(q.t, s.t));
        if (kf) emitKey(kf.alts);
        const mf = v.mets.find(q => q.t > EPS && eq(q.t, s.t));
        if (mf) emitMens(mf.sign);
      }
      for (const cu of ext.custos) {
        if (cu.vi === vi && eq(cu.t, s.t)) {
          const [L, oc] = stepToLO(cu.step);
          out.push(`          <Custos><LetterName>${L}</LetterName><OctaveNum>${oc}</OctaveNum></Custos>`);
        }
      }
      for (const lac of ext.lacunae) {
        if (lac.vi === vi && eq(lac.t, s.t)) {
          const [ln, ld] = toFrac((lac.d || 2) * 2);
          out.push(`          <Lacuna><Length><Num>${ln}</Num><Den>${ld}</Den></Length><Text>${xe(lac.label || '[lacuna]')}</Text></Lacuna>`);
        }
      }
      for (const an of ext.ann) {
        if (an.vi === vi && eq(an.t, s.t)) {
          out.push(`          <Annotation><Text>${xe(an.text)}</Text></Annotation>`);
        }
      }
      const mi = mensInfo(s.sign || metAt(v, s.t));
      const lMin = rt(s.d * mi.p * 2);
      const [ln, ld] = toFrac(lMin, 64);
      const tp = G_TYPE[s.g] || 'Semibrevis';
      if (s.rest) {
        const ro = ext.rests[ek];
        out.push(`          <Rest><Type>${tp}</Type><Length><Num>${ln}</Num><Den>${ld}</Den></Length>${ro ? `<BottomStaffLine>${ro.bot}</BottomStaffLine><NumSpaces>${ro.sp}</NumSpaces>` : ''}</Rest>`);
        continue;
      }
      const emitNote = (step, alt, isMain, ind) => {
        const [L, oc] = stepToLO(step);
        let nx = `${ind}<Note><Type>${tp}</Type><Length><Num>${ln}</Num><Den>${ld}</Den></Length><LetterName>${L}</LetterName><OctaveNum>${oc}</OctaveNum>`;
        if (isMain && (s.col || s.look === 'black' || s.look === 'red')) nx += '<Colored/>';
        if (isMain && s.lig && k + 1 < syms.length && syms[k + 1].lig === s.lig && !syms[k + 1].rest) {
          const lk = ext.ligKind[ek] === 'obliqua' ? 'Obliqua' : 'Recta';
          nx += `<Lig>${lk}</Lig>`;
        }
        if (isMain && (s.stemDirOvr || s.stemSideOvr)) {
          const dMap = {u: 'Up', d: 'Down', n: 'None'}, sMap = {l: 'Left', r: 'Right'};
          nx += `<Stem>${s.stemDirOvr ? `<Dir>${dMap[s.stemDirOvr]}</Dir>` : ''}${s.stemSideOvr ? `<Side>${sMap[s.stemSideOvr]}</Side>` : ''}</Stem>`;
        }
        if (alt !== null && alt !== undefined) nx += `<ModernAccidental><PitchOffset>${alt}</PitchOffset></ModernAccidental>`;
        if (isMain && s.ferm) nx += '<Corona/>';
        if (isMain && s.signum) nx += '<Signum/>';
        if (isMain && s.syl && s.syl[0] && s.syl[0] !== '.') {
          const raw = s.syl[0], wEnd = !/-$/.test(raw);
          const clean = raw.replace(/^-|-$/g, '');
          nx += `<ModernText><Syllable>${xe(clean)}</Syllable>${wEnd ? '<WordEnd/>' : ''}</ModernText>`;
        }
        if (isMain && ext.origText[ek]) nx += `<OriginalText><Text>${xe(ext.origText[ek])}</Text></OriginalText>`;
        nx += '</Note>';
        out.push(nx);
      };
      if (s.chord && s.chord.length) {
        out.push('          <MultiEvent>');
        emitNote(s.step, s.alt, true, '            ');
        for (const c of s.chord) emitNote(c.step, c.alt, false, '            ');
        out.push('          </MultiEvent>');
      } else {
        emitNote(s.step, s.alt, true, '          ');
      }
      if (s.dot || s.dd || s.pa) out.push('          <Dot/>');
    }
    out.push('        </EventList>');
    out.push('      </Voice>');
  });
  out.push('    </MensuralMusic>');
  out.push('  </MusicSection>');
  for (const ch of ext.chants) {
    out.push(`  <MusicSection><Plainchant><Title>${xe(ch.title || 'Plainchant')}</Title><Text>${xe(ch.gabc || '')}</Text></Plainchant></MusicSection>`);
  }
  out.push('</Piece>');
  return out.join('\n') + '\n';
}
/* MEI (.mei) importer: supports both CMN (measure-based) and Mensural MEI (CRIM, Verovio, Measuring Polyphony, etc.) */
function meiToKern(txt, fileName){
  const doc = new DOMParser().parseFromString(txt, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('This MEI file could not be parsed as XML.');
  const byLocal = (root, name) => {
    const out = [];
    const walk = el => { for (const c of el.children) { if (c.localName === name) out.push(c); walk(c); } };
    if (root) walk(root);
    return out;
  };
  const firstLocal = (root, name) => byLocal(root, name)[0] || null;
  const attr = (el, k) => el && el.getAttribute(k);
  const titleEl = firstLocal(firstLocal(doc, 'meiHead'), 'title');
  const title = (titleEl && titleEl.textContent.trim()) || (fileName || 'Untitled').replace(/\.mei(\.xml)?$/i, '');
  let composer = '';
  const compEl = firstLocal(firstLocal(doc, 'meiHead'), 'composer') || byLocal(firstLocal(doc, 'meiHead'), 'persName').find(e => /comp/i.test(attr(e, 'role') || ''));
  if (compEl) composer = compEl.textContent.trim();

  const clefMap = (shape, line, dis, disPlace) => {
    const sh = (shape || 'G').toUpperCase(), ln = line || (sh === 'F' ? '4' : sh === 'C' ? '3' : '2');
    if (sh === 'G' && ln === '2' && dis === '8' && disPlace === 'below') return 'Gv2';
    const k = sh + ln;
    return KERN_CLEF[k] ? k : (sh === 'F' ? 'F4' : sh === 'C' ? 'C3' : 'G2');
  };
  const keySigAlts = sig => {
    const m = /^(\d+)([fs])$/i.exec(String(sig || '').trim());
    if (!m) return {};
    const n = Math.min(7, +m[1]), sharp = m[2].toLowerCase() === 's';
    const ord = sharp ? 'fcgdaeb' : 'beadgcf';
    const alts = {};
    for (let i = 0; i < n; i++) alts[ord[i]] = sharp ? 1 : -1;
    return alts;
  };
  const mensFromEl = el => {
    if (!el) return null;
    const sign = attr(el, 'mensur.sign') || attr(el, 'sign');
    const slash = attr(el, 'mensur.slash') || attr(el, 'slash');
    const dot = attr(el, 'mensur.dot') || attr(el, 'dot');
    const T = +(attr(el, 'mensur.tempus') || attr(el, 'tempus') || 0);
    const P = +(attr(el, 'mensur.prolatio') || attr(el, 'prolatio') || 0);
    if (sign) {
      let s = sign.toUpperCase() === 'O' ? 'O' : 'C';
      if (dot === 'true' || dot === '1' || P === 3) s += '.';
      if (slash && slash !== '0' && slash !== 'false') s += '|';
      return s;
    }
    if (T || P) return (T === 3 ? 'O' : 'C') + (P === 3 ? '.' : '');
    const mc = attr(el, 'meter.count') || attr(el, 'count'), mu = attr(el, 'meter.unit') || attr(el, 'unit');
    const ms = attr(el, 'meter.sym') || attr(el, 'sym');
    if (ms === 'cut') return 'C|';
    if (ms === 'common') return 'C';
    if (mc && mu) {
      const len = +mc / +mu;
      return eq(len, 1.5) || (+mc === 3 && +mu <= 2) ? 'O' : 'C';
    }
    return null;
  };

  /* Collect staffDefs from the first scoreDef */
  const sdefs = new Map();
  const sdefOrder = [];
  const scoreDef = firstLocal(doc, 'scoreDef');
  const globKey = scoreDef ? (attr(scoreDef, 'key.sig') || attr(scoreDef, 'keysig') || '') : '';
  const globMens = mensFromEl(scoreDef);
  const globMeterLen = scoreDef && attr(scoreDef, 'meter.count') && attr(scoreDef, 'meter.unit') ? (+attr(scoreDef, 'meter.count') / +attr(scoreDef, 'meter.unit')) : 2;
  for (const sd of byLocal(doc, 'staffDef')) {
    const n = attr(sd, 'n') || String(sdefOrder.length + 1);
    if (sdefs.has(n)) continue;
    const lblEl = firstLocal(sd, 'label');
    const name = attr(sd, 'label') || (lblEl && lblEl.textContent.trim()) || ('Voice ' + n);
    const clefEl = firstLocal(sd, 'clef');
    const cShape = attr(sd, 'clef.shape') || (clefEl && attr(clefEl, 'shape')) || 'G';
    const cLine = attr(sd, 'clef.line') || (clefEl && attr(clefEl, 'line')) || '2';
    const cDis = attr(sd, 'clef.dis') || (clefEl && attr(clefEl, 'dis')) || '';
    const cDisP = attr(sd, 'clef.dis.place') || (clefEl && attr(clefEl, 'dis.place')) || '';
    const kSig = attr(sd, 'key.sig') || attr(sd, 'keysig') || globKey;
    const mens = mensFromEl(sd) || mensFromEl(firstLocal(sd, 'mensur')) || globMens || 'C';
    const mc = attr(sd, 'meter.count'), mu = attr(sd, 'meter.unit');
    const meterLen = mc && mu ? (+mc / +mu) : globMeterLen;
    sdefs.set(n, {n, name, clef: clefMap(cShape, cLine, cDis, cDisP), alts: keySigAlts(kSig), mens, meterLen});
    sdefOrder.push(n);
  }
  if (!sdefOrder.length) {
    const seen = new Set();
    for (const stEl of byLocal(doc, 'staff')) { const n = attr(stEl, 'n') || '1'; if (!seen.has(n)) { seen.add(n); sdefs.set(n, {n, name: 'Voice ' + n, clef: 'G2', alts: {}, mens: 'C', meterLen: 2}); sdefOrder.push(n); } }
  }
  if (!sdefOrder.length) throw new Error('No music staves found in this MEI file.');

  /* Collect tie and fermata control events referenced by xml:id */
  const tieStarts = new Set(), tieEnds = new Set(), fermIds = new Set();
  for (const t of byLocal(doc, 'tie')) {
    const s = (attr(t, 'startid') || '').replace(/^#/, ''), e = (attr(t, 'endid') || '').replace(/^#/, '');
    if (s) tieStarts.add(s);
    if (e) tieEnds.add(e);
  }
  for (const fm of byLocal(doc, 'fermata')) {
    const s = (attr(fm, 'startid') || '').replace(/^#/, '');
    if (s) fermIds.add(s);
  }

  /* Create voices per (staff n, layer n); layer > 1 becomes a *divisi sub-voice */
  const voiceMap = new Map(); /* key "staffN:layerN" -> voice */
  const getVoice = (sn, ln) => {
    const key = sn + ':' + ln;
    if (voiceMap.has(key)) return voiceMap.get(key);
    const sd = sdefs.get(sn) || {name: 'Voice ' + sn, clef: 'G2', alts: {}, mens: 'C', meterLen: 2};
    const v = {
      name: ln === '1' ? sd.name : sd.name + ' ' + ln, abbr: '', kclef: sd.clef,
      events: [], mets: [{t: 0, sign: sd.mens, ei: 0}],
      keys: Object.keys(sd.alts).length ? [{t: 0, alts: Object.assign({}, sd.alts), ei: 0}] : [],
      clefs: [{t: 0, c: sd.clef, ei: 0}], verses: 0, t: 0, _sn: sn, _ln: ln, _meterLen: sd.meterLen, _ligN: 0, _prop: 1
    };
    voiceMap.set(key, v);
    return v;
  };
  for (const sn of sdefOrder) getVoice(sn, '1');

  const DUR_BASE = {maxima: 8, long: 4, longa: 4, breve: 2, brevis: 2, semibrevis: 1, '1': 1, minima: 0.5, '2': 0.5, semiminima: 0.25, '4': 0.25, fusa: 0.125, '8': 0.125, semifusa: 0.0625, '16': 0.0625, '32': 0.03125, '64': 0.015625, '128': 0.0078125};
  const accVal = a => !a ? null : (a === 's' || a === 'xs' ? 1 : a === 'ss' || a === 'x' ? 2 : a === 'f' ? -1 : a === 'ff' ? -2 : a === 'n' ? 0 : null);
  const parseMeiPitch = el => {
    const pn = (attr(el, 'pname') || '').toLowerCase(), oc = parseInt(attr(el, 'oct'), 10);
    const li = LETTERS.indexOf(pn);
    if (li < 0 || !isFinite(oc)) return null;
    const step = 7 * oc + li;
    let alt = accVal(attr(el, 'accid')), ed = false;
    const accEl = Array.from(el.children).find(c => c.localName === 'accid');
    if (accEl) {
      const a2 = accVal(attr(accEl, 'accid'));
      if (a2 !== null) alt = a2;
      if (attr(accEl, 'func') === 'edit') ed = true;
    }
    if (alt === null) { const ag = accVal(attr(el, 'accid.ges')); if (ag !== null) alt = ag; }
    return {step, alt, ed};
  };
  const calcDur = (el, v, tupScale) => {
    const raw = (attr(el, 'dur') || '4').toLowerCase();
    const curSign = v.mets.length ? v.mets[v.mets.length - 1].sign : 'C';
    const mi = mensInfo(curSign);
    let d = DUR_BASE[raw];
    if (d === undefined) d = 0.25;
    if (raw === 'semibrevis' && mi.P === 3) d = 1.5;
    else if (raw === 'brevis') d = mi.T * (mi.P === 3 ? 1.5 : 1);
    else if (raw === 'longa') d = mi.M * mi.T * (mi.P === 3 ? 1.5 : 1);
    else if (raw === 'maxima') d = mi.X * mi.M * mi.T * (mi.P === 3 ? 1.5 : 1);
    const num = parseFloat(attr(el, 'num')), numbase = parseFloat(attr(el, 'numbase'));
    if (num > 0 && numbase > 0) d = d * numbase / num;
    else if (attr(el, 'colored') === 'true') d = d * 2 / 3;
    const dots = parseInt(attr(el, 'dots') || '0', 10);
    if (dots > 0) d *= 2 - Math.pow(0.5, dots);
    return rt(d * tupScale / (v._prop || 1));
  };

  const bars = [], sections = [];
  const addBar = (t, type) => { if (t > EPS && !bars.some(b => eq(b.t, t))) bars.push({t: rt(t), type}); };
  const walkLayer = (node, v, tupScale, ligId) => {
    const ch = Array.from(node.children);
    for (let i = 0; i < ch.length; i++) {
      const el = ch[i], tag = el.localName;
      if (tag === 'beam' || tag === 'bTrem' || tag === 'fTrem') { walkLayer(el, v, tupScale, ligId); continue; }
      if (tag === 'ligature') { v._ligN++; walkLayer(el, v, tupScale, v._ligN); continue; }
      if (tag === 'tuplet') {
        const num = parseFloat(attr(el, 'num')) || 3, nb = parseFloat(attr(el, 'numbase')) || 2;
        walkLayer(el, v, tupScale * nb / num, ligId);
        continue;
      }
      if (tag === 'clef') {
        const c = clefMap(attr(el, 'shape'), attr(el, 'line'), attr(el, 'dis'), attr(el, 'dis.place'));
        if (v.t < EPS && v.clefs.length) v.clefs[0].c = c;
        else v.clefs.push({t: rt(v.t), c, ei: v.events.length});
        continue;
      }
      if (tag === 'mensur') {
        const ms = mensFromEl(el);
        if (ms) {
          if (v.t < EPS && v.mets.length) v.mets[0].sign = ms;
          else v.mets.push({t: rt(v.t), sign: ms, ei: v.events.length});
        }
        continue;
      }
      if (tag === 'proport') {
        const num = parseFloat(attr(el, 'num')), nb = parseFloat(attr(el, 'numbase'));
        if (num > 0 && nb > 0) v._prop = num / nb;
        continue;
      }
      if (tag === 'barLine') {
        const fm = attr(el, 'form') || 'single';
        if (fm === 'dbl' || fm === 'rptend') addBar(v.t, 'double');
        else if (fm !== 'invis') addBar(v.t, 'single');
        continue;
      }
      if (tag === 'dot') {
        const prev = v.events[v.events.length - 1];
        if (prev && !prev.rest) {
          if (attr(el, 'form') === 'div') prev.dd = true;
          else { const add = rt(prev.d * 0.5); prev.d = rt(prev.d + add); prev.kd = prev.d; v.t = rt(v.t + add); }
        }
        continue;
      }
      if (tag === 'rest' || tag === 'space') {
        const d = calcDur(el, v, tupScale);
        v.events.push({t: rt(v.t), d, kd: d, rest: true, syl: []});
        v.t = rt(v.t + d);
        continue;
      }
      if (tag === 'mRest' || tag === 'mSpace') {
        const d = rt(v._meterLen || 2);
        v.events.push({t: rt(v.t), d, kd: d, rest: true, syl: []});
        v.t = rt(v.t + d);
        continue;
      }
      if (tag === 'multiRest') {
        const cnt = Math.max(1, parseInt(attr(el, 'num') || '1', 10));
        const d = rt((v._meterLen || 2) * cnt);
        v.events.push({t: rt(v.t), d, kd: d, rest: true, syl: []});
        v.t = rt(v.t + d);
        continue;
      }
      if (tag === 'chord') {
        const notes = Array.from(el.children).filter(c => c.localName === 'note');
        const ps = notes.map(parseMeiPitch).filter(Boolean);
        if (!ps.length) continue;
        const d = calcDur(el, v, tupScale);
        const ev = {t: rt(v.t), d, kd: d, rest: false, step: ps[0].step, alt: ps[0].alt, ed: ps[0].ed, syl: []};
        if (ps.length > 1) ev.chord = ps.slice(1).sort((a, b) => a.step - b.step);
        if (attr(el, 'colored') === 'true') ev.colH = true;
        if (attr(el, 'fermata')) ev.ferm = true;
        v.events.push(ev); v.t = rt(v.t + d);
        continue;
      }
      if (tag === 'note') {
        const p = parseMeiPitch(el); if (!p) continue;
        const d = calcDur(el, v, tupScale);
        const id = attr(el, 'xml:id') || attr(el, 'id') || '';
        const tieAttr = attr(el, 'tie') || '';
        const ev = {t: rt(v.t), d, kd: d, rest: false, step: p.step, alt: p.alt, ed: p.ed, syl: []};
        if (tieAttr === 'i' || (id && tieStarts.has(id))) ev.tieStart = true;
        if (tieAttr === 't' || (id && tieEnds.has(id))) ev.tieEnd = true;
        if (tieAttr === 'm' || (ev.tieStart && ev.tieEnd)) { ev.tieMid = true; ev.tieStart = ev.tieEnd = false; }
        if (attr(el, 'colored') === 'true') ev.colH = true;
        if (attr(el, 'fermata') || (id && fermIds.has(id))) ev.ferm = true;
        if (ligId) ev.lig = ligId;
        for (const ve of Array.from(el.children).filter(c => c.localName === 'verse')) {
          const vn = Math.max(0, parseInt(attr(ve, 'n') || '1', 10) - 1);
          const sy = firstLocal(ve, 'syl');
          if (sy) {
            let tx = sy.textContent.trim().replace(/\s+/g, '_');
            const wp = attr(sy, 'wordpos') || '';
            if (wp === 'i') tx = tx + '-';
            else if (wp === 'm') tx = '-' + tx + '-';
            else if (wp === 't') tx = '-' + tx;
            if (tx) { ev.syl[vn] = tx; v.verses = Math.max(v.verses, vn + 1); }
          }
        }
        v.events.push(ev); v.t = rt(v.t + d);
      }
    }
  };

  /* Walk <section>s (handles both <measure>-wrapped CMN and unmeasured Mensural MEI) */
  const measures = byLocal(doc, 'measure');
  if (measures.length) {
    for (const ms of measures) {
      let mStart = 0;
      for (const v of voiceMap.values()) mStart = Math.max(mStart, v.t);
      for (const v of voiceMap.values()) {
        if (v.t < mStart - EPS) { const pad = rt(mStart - v.t); v.events.push({t: rt(v.t), d: pad, kd: pad, rest: true, syl: []}); v.t = mStart; }
      }
      const reh = firstLocal(ms, 'reh');
      if (reh && reh.textContent.trim()) sections.push({t: rt(mStart), label: reh.textContent.trim()});
      for (const stEl of Array.from(ms.children).filter(c => c.localName === 'staff')) {
        const sn = attr(stEl, 'n') || '1';
        const layers = Array.from(stEl.children).filter(c => c.localName === 'layer');
        layers.forEach((ly, li) => {
          const ln = attr(ly, 'n') || String(li + 1);
          const v = getVoice(sn, ln);
          if (v.t < mStart - EPS) { const pad = rt(mStart - v.t); v.events.push({t: rt(v.t), d: pad, kd: pad, rest: true, syl: []}); v.t = mStart; }
          walkLayer(ly, v, 1, 0);
        });
      }
      let mEnd = mStart;
      for (const v of voiceMap.values()) mEnd = Math.max(mEnd, v.t);
      const rBar = attr(ms, 'right') || 'single';
      if (rBar === 'dbl' || rBar === 'rptend') addBar(mEnd, 'double');
      else if (rBar !== 'invis' && rBar !== 'end') addBar(mEnd, 'single');
    }
  } else {
    for (const stEl of byLocal(doc, 'staff')) {
      const sn = attr(stEl, 'n') || '1';
      const layers = Array.from(stEl.children).filter(c => c.localName === 'layer');
      layers.forEach((ly, li) => {
        const ln = attr(ly, 'n') || String(li + 1);
        walkLayer(ly, getVoice(sn, ln), 1, 0);
      });
    }
  }

  /* Order voices by staffDef order, attaching layer > 1 right after layer 1 as *divisi sub-voices */
  const voices = [];
  for (const sn of sdefOrder) {
    const group = [...voiceMap.values()].filter(v => v._sn === sn).sort((a, b) => (+a._ln || 1) - (+b._ln || 1));
    if (!group.length) continue;
    const pIdx = voices.length;
    group.forEach((v, idx) => {
      if (idx > 0 && !v.events.some(e => !e.rest)) return; /* drop empty extra layers */
      v.end = v.t;
      if (idx > 0) v.subOf = pIdx;
      voices.push(v);
    });
  }
  const end = Math.max(0, ...voices.map(v => v.end));
  if (!voices.length || end <= EPS) throw new Error('No playable notes found in this MEI file.');
  const meta = {OTL: title};
  if (composer) meta.COM = composer;
  const P = {title, composer, voices, bars: bars.filter(b => b.t > EPS && b.t < end - EPS), sections, end, meta, barNums: []};
  return writeKern(P);
}
function openFile(file){
  const fail = err => { stopPlay(); pagesEl.innerHTML = `<p class="msg">${esc(err.message)}</p>`; };
  const imp = f => f.text().then(txt => {
    if (/\.mei(\.xml)?$/i.test(file.name) || /<mei\b/i.test(txt.slice(0, 1200))) {
      loadText(file.name, meiToKern(txt, file.name));
      return;
    }
    if (/\.cmme(\.xml)?$/i.test(file.name) || /<Piece\b[^>]*cmme/i.test(txt.slice(0, 800))) {
      const k = cmmeToKernRich(txt, file.name);
      if (k) { loadText(file.name, k); return; }
    }
    return ScoreImport.toKern(f).then(k => loadText(file.name, k));
  }).catch(fail);
  if (/\.mei(\.xml)?$/i.test(file.name)) { imp(file); return; }
  if (window.ScoreImport && ScoreImport.accepts(file.name)) { imp(file); return; }
  /* any other name: a zip, MIDI or XML score is still read as one (renamed or saved without its extension); plain text as **kern */
  file.arrayBuffer().then(buf => {
    const b = new Uint8Array(buf, 0, Math.min(buf.byteLength, 600));
    const head = new TextDecoder().decode(b).replace(/^\uFEFF/, '').trimStart();
    const ext = (/\.([^.]+)$/.exec(file.name) || [, ''])[1].toLowerCase();
    if (window.ScoreImport && b[0] === 0x50 && b[1] === 0x4B) imp(new File([buf], file.name + '.zip'));
    else if (window.ScoreImport && b[0] === 0x4D && b[1] === 0x54 && b[2] === 0x68 && b[3] === 0x64) imp(new File([buf], file.name + '.mid'));
    else if (/^<(\?xml|!DOCTYPE |mei\b|museScore|score-partwise|score-timewise)\b/i.test(head)) imp(new File([buf], /<mei\b/i.test(head) ? file.name + '.mei' : file.name + '.xml'));
    else if (/\*\*(kern|mens)/.test(new TextDecoder().decode(buf)) || /^(krn|kern|txt)$/.test(ext)) loadText(file.name, new TextDecoder().decode(buf));
    else fail(new Error(unreadable(ext)));
  }, fail);
}
/* the message for a file the app cannot read: what it is, and what to do */
function unreadable(ext){
  const FMT = {pdf: 'a PDF (a picture of the music, not its notes)', sib: 'a Sibelius file', musx: 'a Finale file', mus: 'a Finale file', dorico: 'a Dorico file', mscs: 'a MuseScore 4 folder file', abc: 'an ABC file',
    png: 'an image', jpg: 'an image', jpeg: 'an image', heic: 'an image', mp3: 'a recording', wav: 'a recording', m4a: 'a recording', doc: 'a Word document', docx: 'a Word document'};
  const what = FMT[ext] ? 'This is ' + FMT[ext] + ', which ' + APP.name + ' cannot read.' : APP.name + ' cannot read ' + (ext ? '.' + ext + ' files.' : 'this file.');
  const fix = /^(sib|musx|mus|dorico|mscs|abc)$/.test(ext) ? ' Please export it from that program as MusicXML (.musicxml or .mxl) and open that.' : '';
  return what + fix + ' ' + APP.name + ' opens MuseScore (.mscz, .mscx), MusicXML (.musicxml, .mxl, .xml), MEI (.mei), MIDI (.mid), LilyPond (.ly), GABC (.gabc), CMME (.cmme.xml) and **kern (.krn).';
}
$('#printBtn').addEventListener('click', () => {
  /* Download PDF: a PDF file at once, at the paper size chosen in View (no print window) */
  if (window.__share && window.__share.pdf) { window.__share.pdf(); return; }
  if (EMBED && !pieceKey.startsWith('file:')) { window.open(APP.page + '?print=1', '_blank'); return; }
  window.print();
});
/* ------------------------------------------------------------------ */
/* Writing **kern back out (for edits, and to download)                */
/* ------------------------------------------------------------------ */
function recipOf(d){
  for (let dots = 0; dots <= 2; dots++) {
    const base = d / (2 - Math.pow(0.5, dots));
    const k = Math.log2(base);
    if (Math.abs(k - Math.round(k)) < 1e-6 && k >= -7 && k <= 3) {
      const r = Math.round(k) >= 1 ? '0'.repeat(Math.round(k)) : String(Math.round(1 / base));
      return r + '.'.repeat(dots);
    }
  }
  /* rational value M/N of a whole note: N%M */
  for (let n = 1; n <= 48; n++) { const m = Math.round(d * n); if (m > 0 && Math.abs(d - m / n) < 5e-5) return n + '%' + m; }
  for (let n = 49; n <= 96; n++) { const m = Math.round(d * n); if (m > 0 && Math.abs(d - m / n) < 2e-5) return n + '%' + m; }
  return '1';
}
function pitchTok(step){
  const oct = Math.floor(step / 7), L = LETTERS[((step % 7) + 7) % 7];
  return oct >= 4 ? L.repeat(oct - 3) : L.toUpperCase().repeat(4 - oct);
}
function singleNoteTok(e, tie){
  let s = recipOf(e.d);
  if (e.rest) s += 'r';
  else {
    s = (tie === 'start' ? '[' : '') + s + pitchTok(e.step);
    if (e.alt !== null && e.alt !== undefined) s += e.alt < 0 ? '-'.repeat(-e.alt) : e.alt > 0 ? '#'.repeat(e.alt) : 'n';
    if (e.ed) s += 'i';
    if (tie === 'mid') s += '_';
    if (tie === 'end') s += ']';
  }
  if (e.long) s += 'l';
  if (e.ferm) s += ';';
  if (e.signum) s += '$';
  if (e.colH && !e.rest) s += '@';
  if (e.altd && !e.rest) s += '~';
  if (e.dd && !e.rest) s += 'Y';
  if (e.pa && !e.rest) s += 'W';
  if (e.look && !e.rest && LOOK_SIG[e.look]) s += LOOK_SIG[e.look];
  if (!e.rest && e.stemDirOvr === 'u') s += 'U';
  else if (!e.rest && e.stemDirOvr === 'd') s += 'J';
  else if (!e.rest && e.stemDirOvr === 'n') s += 'Q';
  if (!e.rest && e.stemSideOvr === 'l') s += 'K';
  else if (!e.rest && e.stemSideOvr === 'r') s += 'R';
  return s;
}
function noteTok(e, tie){
  if (!e.rest && e.chord && e.chord.length) {
    return [singleNoteTok(e, tie), ...e.chord.map(c => singleNoteTok({...e, step: c.step, alt: c.alt, ed: c.ed, look: c.look, ferm: false}, tie))].join(' ');
  }
  return singleNoteTok(e, tie);
}
function retime(v){
  let t = 0;
  for (const e of v.events) { e.t = rt(t); t = rt(t + e.d); }
  v.end = t;
  const at = ei => ei < v.events.length ? v.events[ei].t : v.end;
  for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) m.t = at(m.ei);
}
/* The modern equivalent of a mensuration sign (Samuel 2026-11-15): two numbers typed in the sign's menu, e.g. 3/1 or 3/4,
   kept as *mod(3/1) after the *met. Modern notation prints it as a time signature, and from that sign on the barlines
   fall every so many whole notes (as written in Modern notation, so a proportion sign's values count as written). Where
   no sign has one, the barlines stay exactly as the file has them. */
function modLen(mod, sign){
  const m = String(mod || '').match(/^\s*(\d+(?:\s*\+\s*\d+)*)\s*\/\s*(\d+)\s*$/);
  if (!m) return 0;
  const n = m[1].split('+').reduce((a, x) => a + (+x || 0), 0), d = +m[2];
  return n > 0 && d > 0 ? n / d / mensInfo(sign).p : 0;
}
/* the stretches of the piece where a modern equivalent rules the barlines: [{a, b, len, at}] (at: where its sign starts), or null */
function modZones(P){
  if (!P.voices.some(v => v.mets.some(m => modLen(m.mod, m.sign)))) return null;
  const cuts = [...new Set([0, ...P.voices.flatMap(v => v.mets.map(m => rt(m.t)))])].filter(t => t < P.end - EPS).sort((a, b) => a - b);
  const Z = [];
  cuts.forEach((a, i) => {
    const b = i + 1 < cuts.length ? cuts[i + 1] : P.end;
    /* the highest voice whose sign there has a modern equivalent */
    for (const v of P.voices) {
      let m = null; for (const q of v.mets) if (q.t <= a + EPS) m = q;
      const len = m && modLen(m.mod, m.sign);
      if (len) { Z.push({a, b, len, at: m.t}); break; }
    }
  });
  return Z.length ? Z : null;
}
/* Scores written here (New score) keep their barlines by themselves (Samuel 2026-11-15): one at every perfection of the
   mensuration sign, as in the repertoire (a breve under C, three semibreves under O). A section line or a double bar
   put in by hand stays; the single barlines are laid again from the signs each time the score is written. */
function autoRebar(P){
  if (!P.meta || P.meta.BARS !== 'auto') return;
  const cuts = [...new Set([0, ...P.voices.flatMap(v => v.mets.map(m => rt(m.t)))])].filter(t => t < P.end - EPS).sort((a, b) => a - b);
  const grid = [];
  cuts.forEach((a, i) => {
    const b = i + 1 < cuts.length ? cuts[i + 1] : P.end;
    /* the highest voice that has a sign there */
    let m = null;
    for (const v of P.voices) { for (const q of v.mets) if (q.t <= a + EPS && q.sign) m = q; if (m) break; }
    if (!m) return;
    const mi = mensInfo(m.sign), len = rt(mi.T * (mi.P === 3 ? 1.5 : 1) / mi.p);
    if (!(len > EPS)) return;
    if (a > EPS && eq(m.t, a)) grid.push(rt(a));
    for (let k = Math.max(1, Math.ceil((a - m.t) / len - 1e-6)); ; k++) { const t = rt(m.t + k * len); if (t >= b - EPS) break; if (t > a - EPS) grid.push(t); }
  });
  const bars = P.bars.filter(br => br.type !== 'single');
  for (const t of grid) if (t > EPS && t < P.end - EPS && !bars.some(br => eq(br.t, t))) bars.push({t, type: 'single'});
  P.bars = bars.sort((a, b) => a.t - b.t);
}
function modRebar(P){
  const Z = modZones(P); if (!Z) return;
  const inZ = t => Z.some(z => t >= z.a - EPS && t < z.b - EPS);
  const grid = [];
  for (const z of Z) {
    if (z.a > EPS && eq(z.at, z.a)) grid.push(rt(z.a));   /* a barline before the new time signature */
    const k0 = Math.ceil((z.a - z.at) / z.len - 1e-6);
    for (let k = Math.max(1, k0); ; k++) { const t = rt(z.at + k * z.len); if (t >= z.b - EPS) break; if (t > z.a - EPS) grid.push(t); }
    if (z.b < P.end - EPS && !inZ(z.b)) grid.push(rt(z.b));
  }
  const onGrid = t => grid.some(g => eq(g, t));
  /* notes tied over a barline that is no longer there become one note again (the writer ties them anew at the new barlines) */
  for (const v of P.voices) {
    const ev = v.events, marks = [...v.mets, ...v.keys, ...v.clefs];
    for (let i = ev.length - 1; i > 0; i--) {
      const a = ev[i - 1], b = ev[i];
      if (a.rest || b.rest || a.step !== b.step || !(a.tieStart || a.tieMid) || !(b.tieEnd || b.tieMid) || !eq(a.t + a.d, b.t)) continue;
      if (!inZ(b.t) || onGrid(b.t) || marks.some(m => m.ei === i)) continue;
      const inc = !!((a.tieEnd && !a.tieStart) || a.tieMid), out = !!((b.tieStart && !b.tieEnd) || b.tieMid);
      a.d = rt(a.d + b.d); a.ferm = a.ferm || b.ferm;
      a.tieStart = !inc && out; a.tieEnd = inc && !out; a.tieMid = inc && out;
      ev.splice(i, 1);
      for (const m of marks) if (m.ei > i) m.ei--;
    }
    retime(v);
  }
  const bars = P.bars.filter(br => br.type !== 'single' || !inZ(br.t));
  for (const t of grid) if (!bars.some(br => eq(br.t, t))) bars.push({t, type: 'single'});
  P.bars = bars.filter(br => br.t > EPS && br.t < P.end - EPS).sort((a, b) => a.t - b.t);
}
function writeKern(P){
  const vs = P.voices.slice().reverse();          /* file order: lowest voice first */
  P.voices.forEach(retime);
  P.end = Math.max(...P.voices.map(v => v.end));
  autoRebar(P);
  modRebar(P);
  const out = [];
  const hasExt = extHasData(P.ext);
  if (hasExt && !P.meta.SCRIPTORIUM) out.push('!!!SCRIPTORIUM: 2');
  for (const [k, val] of Object.entries(P.meta)) out.push(`!!!${k}: ${val}`);
  const cols = [];
  vs.forEach(v => { cols.push({v, text: -1}); for (let k = 0; k < Math.max(v.verses, 0); k++) cols.push({v, text: k}); });
  const line = f2 => cols.map(c => f2(c)).join('\t');
  out.push(line(c => c.text < 0 ? '**kern' : '**text'));
  out.push(line(c => c.text < 0 ? `*I"${c.v.name}` : '*'));
  if (vs.some(v => v.subOf >= 0)) out.push(line(c => c.text < 0 && c.v.subOf >= 0 ? '*divisi' : '*'));
  if (vs.some(v => v.abbr)) out.push(line(c => c.text < 0 && c.v.abbr ? `*I'${c.v.abbr}` : '*'));
  if (vs.some(v => v.oclef)) out.push(line(c => c.text < 0 && c.v.oclef ? `*oclef${c.v.oclef}` : '*'));
  /* every event split at the barlines, with ties */
  const barT = P.bars.map(b => b.t);
  const pieces = new Map();
  vs.forEach(v => {
    const list = [];
    v.events.forEach((e, ei) => {
      let a = e.t; const b = rt(e.t + e.d);
      const cuts = barT.filter(t => t > a + EPS && t < b - EPS);
      const ts = [a, ...cuts, b];
      for (let q = 0; q + 1 < ts.length; q++) {
        const part = Object.assign({}, e, {d: rt(ts[q + 1] - ts[q]), t: ts[q]});
        let tie = null;
        if (!e.rest && ts.length > 2) tie = q === 0 ? (e.tieEnd || e.tieMid ? 'mid' : 'start') : q === ts.length - 2 ? (e.tieStart || e.tieMid ? 'mid' : 'end') : 'mid';
        else if (!e.rest) tie = e.tieStart && !e.tieEnd ? 'start' : e.tieMid ? 'mid' : e.tieEnd && !e.tieStart ? 'end' : null;
        if (q) part.syl = [], part.ferm = false;
        if (q < ts.length - 2) part.long = false;
        list.push({t: rt(part.t), e: part, tie, ei, first: q === 0});
      }
    });
    pieces.set(v, list);
  });
  const markersAt = (v, t) => ({
    clef: v.clefs.filter(m => eq(m.t, t)), key: v.keys.filter(m => eq(m.t, t)), met: v.mets.filter(m => eq(m.t, t))
  });
  const times = new Set([0]);
  vs.forEach(v => pieces.get(v).forEach(p => times.add(p.t)));
  barT.forEach(t => times.add(t));
  vs.forEach(v => [...v.mets, ...v.keys, ...v.clefs].forEach(m => times.add(rt(m.t))));
  /* ligatures: *lig before a ligature's first note, *Xlig after its last */
  const ligS = new Map(), ligE = new Map();
  vs.forEach(v => {
    const S = new Set(), E = new Set(), ev = v.events;
    ev.forEach((e, i) => {
      if (!e.lig || e.rest) return;
      if (!i || ev[i - 1].lig !== e.lig || ev[i - 1].rest) S.add(rt(e.t));
      if (i === ev.length - 1 || ev[i + 1].lig !== e.lig || ev[i + 1].rest) { const te = rt(e.t + e.d); E.add(te); times.add(te); }
    });
    ligS.set(v, S); ligE.set(v, E);
  });
  const sortedRaw = [...times].sort((a, b) => a - b);
  const sorted = [];
  for (const t of sortedRaw) if (!sorted.length || !eq(t, sorted[sorted.length - 1])) sorted.push(t);
  const ptr = new Map(vs.map(v => [v, 0]));
  out.push(line(() => '=1-'));
  for (const t of sorted) {
    if (vs.some(v => [...ligE.get(v)].some(x => eq(x, t)))) out.push(line(c => c.text < 0 && [...ligE.get(c.v)].some(x => eq(x, t)) ? '*Xlig' : '*'));
    const bar = P.bars.find(b => eq(b.t, t) && !eq(t, P.end));
    if (bar) out.push(line(() => bar.type === 'double' ? '=||' : bar.type === 'sec' ? '=!' : '='));
    for (const kind of ['clef', 'key', 'met', 'mod']) {
      if (kind === 'mod') {
        if (vs.some(v => markersAt(v, t).met.some(m => m.mod))) out.push(line(c => { const m = c.text < 0 && markersAt(c.v, t).met.find(q => q.mod); return m ? `*mod(${m.mod})` : '*'; }));
        continue;
      }
      const any = vs.some(v => markersAt(v, t)[kind].length);
      if (!any) continue;
      out.push(line(c => {
        if (c.text >= 0) return '*';
        const m = markersAt(c.v, t)[kind][0];
        if (!m) return '*';
        return kind === 'clef' ? `*clef${m.c}` : kind === 'key' ? `*k[${m.raw ?? Object.entries(m.alts).map(([l, a]) => l + (a < 0 ? '-' : '#')).join('')}]` : `*met(${m.sign})`;
      }));
    }
    const sec = P.sections.find(x => eq(x.t, t));
    if (sec) out.push('!!section: ' + sec.label);
    if (vs.some(v => [...ligS.get(v)].some(x => eq(x, t)))) out.push(line(c => c.text < 0 && [...ligS.get(c.v)].some(x => eq(x, t)) ? '*lig' : '*'));
    const row = new Map();
    vs.forEach(v => { const L = pieces.get(v); let i = ptr.get(v); if (i < L.length && eq(L[i].t, t)) { row.set(v, L[i]); ptr.set(v, i + 1); } });
    if (!row.size) continue;
    out.push(line(c => {
      const p = row.get(c.v);
      if (!p) return '.';
      if (c.text < 0) return noteTok(p.e, p.tie);
      const sy = p.first && p.e.syl && p.e.syl[c.text];
      return sy ? sy : '.';
    }));
  }
  out.push(line(() => '=='));
  out.push(line(() => '*-'));
  if (hasExt) out.push('!!!EXT: ' + JSON.stringify(P.ext));
  return out.join('\n') + '\n';
}

/* ------------------------------------------------------------------ */
/* Editing                                                             */
/* ------------------------------------------------------------------ */
/* As in CantusFirmus: after a note is entered nothing stays selected; the cursor (ins) moves on to where the next
   note goes, and the arrows, accidentals, dot and Delete act on the selected note or else on the note just entered. */
const ed = {on: false, sel: null, ins: null, inRest: false, undo: [], redo: [], val: 'S', accArm: null, accEd: false, dotArm: false};   /* sel, ins: {vi, ei}; val: the value to enter */
const EKEY = k => APP.store + ':edit:' + k;
/* Overwrite (default) or Insert, kept per app */
try { ed.ovr = localStorage.getItem(APP.store + ':ovr2') !== '0'; } catch (e) { ed.ovr = true; }
try { ed.nav = localStorage.getItem(APP.store + ':nav') || 'M'; } catch (e) { ed.nav = 'M'; }
/* the Grid is its own value (Samuel 2026-11-15): the number keys and the note value no longer change it; 'Same as note value' is gone */
if (ed.nav === 'follow') ed.nav = 'M';
/* the editing tools row is shown or hidden by the arrow beside the pen, apart from note input itself; until the arrow
   has been used it comes and goes with note input */
try { const b = localStorage.getItem(APP.store + ':edbar'); ed.bar = b === null ? undefined : b === '1'; } catch (e) { ed.bar = undefined; }
const barOpen = () => ed.bar === undefined ? !!(ed.on || ed.sel || ed.range || ed.picks) : ed.bar;
const VALS = [['Mx', 8], ['L', 4], ['B', 2], ['S', 1], ['M', 0.5], ['Sm', 0.25], ['F', 0.125], ['Sf', 0.0625]];
/* A rest drawn on its own may be only part of an event (a rest of three breves is drawn as a long and a breve): the event is cut
   where the drawing is cut, so that rest can be selected, resized or deleted alone. Nothing is heard or seen to change.
   Returns true when events were cut. */
function isolateRest(v, s){
  if (!v || !s || !s.rest) return false;
  let cut = false;
  for (const at of [s.t, rt(s.t + s.d)]) {
    const i = v.events.findIndex(e => e.rest && e.t < at - EPS && e.t + e.d > at + EPS);
    if (i < 0) continue;
    const e = v.events[i], d1 = rt(at - e.t), d2 = rt(e.d - d1);
    const b = Object.assign({}, e, {t: at, d: d2, kd: d2, syl: []});
    e.d = d1; e.kd = d1; e.ferm = false;
    v.events.splice(i + 1, 0, b);
    for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > i) m.ei++;
    cut = true;
  }
  return cut;
}
/* select a rest drawn on its own (cutting the events under it first, if need be) */
function pickRest(vi, s){
  const v = piece.voices[vi];
  if (isolateRest(v, s)) {
    render();
    s = v.syms.find(q => q.rest && eq(q.t, s.t) && eq(q.d, s.d)) || v.syms.find(q => q.rest && eq(q.t, s.t)) || s;
  }
  return s;
}
function selSym(){
  if (!ed.sel || !piece) return null;
  const v = piece.voices[ed.sel.vi];
  if (!v || !v.syms) return null;
  return v.syms.find(s => s.src && s.src.includes(ed.sel.ei)) || null;
}
function commit(mutate){
  const before = piece.text || writeKern(piece);
  const hc = H.commitStart ? H.commitStart() : null;
  mutate();
  if (H.commitEnd) H.commitEnd(hc);
  /* a score with the mensural rules: every note is counted again from its shape (tied parts joined first) */
  const maps = mensurateAll();
  if (maps) {
    if (ed.sel && maps[ed.sel.vi]) ed.sel = {vi: ed.sel.vi, ei: Math.min(maps[ed.sel.vi][Math.min(ed.sel.ei, maps[ed.sel.vi].length - 1)], Math.max(0, piece.voices[ed.sel.vi].events.length - 1))};
    if (ed.ins && maps[ed.ins.vi]) ed.ins = Object.assign({}, ed.ins, {ei: maps[ed.ins.vi][Math.min(ed.ins.ei, maps[ed.ins.vi].length - 1)]});
  }
  const text = writeKern(piece);
  /* writing cuts a note that crosses a barline into two tied notes: what is selected, and the caret, move on by those */
  const cut = (vi, ei) => {
    const v = piece.voices[vi]; if (!v) return ei;
    const bt = piece.bars.map(b => b.t); let n = 0;
    for (let j = 0; j < ei && j < v.events.length; j++) { const e = v.events[j], z = rt(e.t + e.d); n += bt.filter(t => t > e.t + EPS && t < z - EPS).length; }
    return ei + n;
  };
  if (ed.sel) ed.sel = {vi: ed.sel.vi, ei: cut(ed.sel.vi, ed.sel.ei)};
  if (ed.ins) ed.ins = Object.assign({}, ed.ins, {ei: cut(ed.ins.vi, ed.ins.ei)});
  ed.undo.push(before); ed.redo = [];
  applyText(text);
}
function applyText(text){
  const sel = ed.sel;
  const keep = piece;
  const ha = H.applyStart ? H.applyStart() : null;
  try { piece = parseKern(text); } catch (e) { piece = keep; return; }
  piece.text = text;
  if (pieceKey && pieceKey.startsWith('mine:')) { try { localStorage.setItem(EKEY(pieceKey), text); } catch (e) {} }
  else if (pieceKey && pieceKey.startsWith('file:')) fileKeep(pieceKey.slice(5), text);
  else if (!ed.warned) { ed.warned = true; toast('Changes to this piece are not kept once you leave it. Export, Save to My scores keeps a copy.'); }
  if (pieceKey && pieceKey.startsWith('mine:')) { const all = mineAll(); if (all[pieceKey]) { all[pieceKey].title = piece.title; all[pieceKey].at = Date.now(); mineSave(all); } recentSync(); }
  if (sel) { const v = piece.voices[sel.vi]; if (!v || sel.ei >= v.events.length) ed.sel = v && v.events.length ? {vi: sel.vi, ei: v.events.length - 1} : null; }
  if (ed.ins) { const v = piece.voices[ed.ins.vi]; if (!v) ed.ins = null; else ed.ins.ei = Math.min(ed.ins.ei, v.events.length); }
  if (H.applyEnd) H.applyEnd(ha);
  syncEdit(); syncUI(); render();
}
function implied(v, step, t){
  const k = keyAt(v, t), L = LETTERS[((step % 7) + 7) % 7];
  return k[L] ? k[L] : null;
}
function anyVoice(){ return !piece ? null : ed.sel ? piece.voices[ed.sel.vi] : ed.ins ? piece.voices[ed.ins.vi] || null : null; }
function xfTarget(){ return piece && typeof ed.xf === 'number' && ed.xf < piece.voices.length && piece.voices.length > 1 ? ed.xf : 'all'; }
function xfVoices(){
  if (!piece) return [];
  if (piece.voices.length < 2) { const v = curVoice(); return v ? [v] : []; }
  const t = xfTarget();
  return (t === 'all' ? piece.voices : [piece.voices[t]]).filter(v => v && writable(v));
}
function curVoice(){ const v = anyVoice(); return v && writable(v) ? v : null; }
function srcOf(){ const s = selSym(); return s ? s.src : ed.sel ? [ed.sel.ei] : []; }
/* written value of the selection under its sign, for the value buttons */
function propAt(v, t){ return mensInfo(metAt(v, t)).p; }
/* a note (or rest) of the chosen value written into voice vi before event `at`; written into rests, it takes their time */
const writable = v => !H.writable || H.writable(v);
const refuse = () => { if (H.refuse) H.refuse(); };
/* A note (or rest) goes in at the caret. The caret stands between two notes, or inside one (ed.ins.off, moved there on
   the grid with Alt and the arrows): that note is then cut where the caret is.
   Insert: the music after the new note moves along (rests right after a new note still make room for it, as before).
   Overwrite: the new note takes the place of what stood there for its length; a note it covers only partly keeps
   what is left as a rest, so the other voices stay where they are. */
function shiftMarks(v, from, by){ for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > from || (by > 0 && m.ei === from && from > 0)) m.ei += by; }
function insertEvent(vi, at, step, isRest, pad = 0, alt){
  const v = piece.voices[vi]; if (!v) return;
  if (!writable(v)) { refuse(); return; }
  const val = VALS.find(x => x[0] === ed.val)[1];
  let off = 0;
  if (!ed.sel && ed.ins && ed.ins.vi === vi && ed.ins.ei === at && at < v.events.length && ed.ins.off > EPS && ed.ins.off < v.events[at].d - EPS) off = ed.ins.off;
  const t = at < v.events.length ? rt(v.events[at].t + off) : rt(v.end + (pad > EPS ? pad : 0));
  /* alt: a sharp, flat or natural of its own (the keyboard's black and white keys); otherwise the signature's */
  const imp = isRest ? null : implied(v, step, t);
  /* a flat, sharp, natural or dot pressed before the note: this note takes it (once) */
  let altU = alt, armedAcc = false;
  if (!isRest && alt === undefined && ed.accArm) {
    const cur = imp || 0;
    altU = ed.accArm === 'n' ? 0 : ed.accArm === '#' ? Math.min(1, cur + 1) : Math.max(-1, cur - 1);
    armedAcc = true;
  }
  const alt0 = isRest ? null : altU === undefined ? imp : altU === 0 && !imp ? null : altU;
  const edAcc = armedAcc && !!ed.accEd && alt0 !== null;
  let dotted = !isRest && (ed.dotArm === true || ed.dotArm === 'add'), divDot = !isRest && ed.dotArm === 'div', perfAdd = false;
  if (dotted && perfectShape(v, t, ed.val)) { dotted = false; perfAdd = true; }
  if (!isRest) { ed.accArm = null; ed.accEd = false; ed.dotArm = false; }
  const d = mensRulesOn() ? rt(nomD(v, t, ed.val) * (ed.colArm ? 2 / 3 : 1) * (dotted ? 1.5 : 1)) : rt(val / propAt(v, t) * (ed.colArm ? 2 / 3 : 1) * (dotted ? 1.5 : 1));
  commit(() => {
    const e = {d, rest: !!isRest, step, alt: alt0, ed: edAcc, syl: [], t};
    if (!isRest && ed.colArm) e.colH = true;
    if (divDot || perfAdd) { if (divDot) e.dd = true; else e.pa = true; if (!mensRulesOn()) { const mi = mensInfo(metAt(v, t)); e.d = rt(nomW(ed.val, mi.T, mi.P, mi.M, mi.X) / mi.p); } }
    /* past the end: a rest up to the place clicked */
    if (pad > EPS && at >= v.events.length) { v.events.push({d: rt(pad), rest: true, alt: null, ed: false, syl: [], t: v.end}); at = v.events.length; }
    let k = at;
    if (off > EPS) {
      /* the note the caret is in is cut in two at the caret */
      const a = v.events[at];
      const b = Object.assign({}, a, {d: rt(a.d - off), t: rt(a.t + off), syl: [], ferm: false});
      b.tieEnd = false; b.tieMid = false; b.tieStart = !!(a.tieStart || a.tieMid);
      a.d = rt(off); a.long = false; a.ferm = false;
      if (a.tieMid) { a.tieMid = false; a.tieEnd = true; } else a.tieStart = false;
      if (b.tieStart && !a.rest) b.tieMid = false;
      v.events.splice(at + 1, 0, b);
      for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > at) m.ei++;
      k = at + 1;
    }
    /* a note put between two notes of a ligature belongs to it */
    const pv = v.events[k - 1], nx = v.events[k];
    if (!e.rest && pv && nx && pv.lig && pv.lig === nx.lig && !pv.rest && !nx.rest) e.lig = pv.lig;
    v.events.splice(k, 0, e);
    shiftMarks(v, k, 1);
    if (ed.ovr) {
      /* Overwrite: the new note covers a stretch of time. What it covers entirely goes; a note it covers only in part is cut,
         and what is left of it stays the same note (pitch, accidental ...) after the new one. Words stay at their place in
         time: the note that starts where an old one started takes its syllable. A rest is made only where a rest was. */
      let need = e.d, j = k + 1, took = false;
      while (need > EPS && v.events[j]) {
        const r = v.events[j];
        if (j === k + 1 && off < EPS && !e.rest && r.syl && r.syl.some(Boolean)) { e.syl = r.syl; took = true; }
        /* a sign, clef or key where the new note starts stays with the new note */
        if (j === k + 1 && off < EPS) for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei === j) m.ei = k;
        if (r.d <= need + EPS) {
          need = rt(need - r.d); v.events.splice(j, 1);
          for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > j) m.ei--;
        } else {
          r.d = rt(r.d - need); r.kd = r.d; need = 0;
          /* what is left starts later: it is the note's tail, cut from the front */
          if (!r.rest) { r.tieStart = !!(r.tieStart || r.tieMid); r.tieEnd = r.tieMid = false; r.long = false; r.ferm = false; if (took) r.syl = []; }
        }
      }
    } else if (!e.rest) {
      let need = e.d, j = k + 1;
      while (need > EPS && v.events[j] && v.events[j].rest) {
        const r = v.events[j];
        if (r.d <= need + EPS) {
          need = rt(need - r.d); v.events.splice(j, 1);
          for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > j) m.ei--;
        } else { r.d = rt(r.d - need); r.kd = r.d; need = 0; }
      }
    }
    ed.sel = null; ed.ins = {vi, ei: k + 1};
  });
  render(); syncEdit();
  if (!isRest) hear(step, alt0);
}
/* the time of the caret, in its voice */
function caretTime(v){
  const s = selSym();
  if (s) return v.events[s.src[0]].t;
  if (!ed.ins) return v.end;
  const ei = Math.min(ed.ins.ei, v.events.length);
  return ei < v.events.length ? rt(v.events[ei].t + (ed.ins.off || 0)) : rt(v.end + (ed.ins.pad || 0));
}
/* the caret's own step (Caret step in the edit bar): a value of its own, or the note value being entered */
const NAV_KEYS = ['Mx', 'L', 'B', 'S', 'M', 'Sm', 'F', 'Sf'];
function navVal(){ return ed.nav && ed.nav !== 'follow' && VALS.some(x => x[0] === ed.nav) ? ed.nav : ed.val; }
function navGrid(v, T){ return rt(VALS.find(x => x[0] === navVal())[1] / propAt(v, Math.min(T, v.end))); }
/* Alt with the arrows: the caret moves on a grid of the value chosen for entering, also into the middle of a note */
function moveCaret(dir){
  if (!piece) return;
  let vi = ed.sel ? ed.sel.vi : ed.ins ? ed.ins.vi : null;
  if (vi === null) { const vs = visibleVoices(); if (!vs.length) return; vi = vs[0].idx; }
  const v = piece.voices[vi]; if (!v) return;
  const T = caretTime(v);
  const g = navGrid(v, T);
  const q = T / g;
  let nt = dir > 0 ? (Math.floor(q + 1e-6) + 1) * g : (Math.ceil(q - 1e-6) - 1) * g;
  nt = rt(Math.max(0, Math.min(v.end + 32, nt)));     /* on past the last note, into empty space, where a new note can be written */
  let ei = v.events.length, off = 0, pad = 0;
  for (let i = 0; i < v.events.length; i++) {
    const e = v.events[i];
    if (nt < e.t + e.d - EPS) { ei = i; off = rt(nt - e.t); if (off < EPS) off = 0; break; }
  }
  if (ei >= v.events.length && nt > v.end + EPS) pad = rt(nt - v.end);
  ed.sel = null; ed.ins = {vi, ei, off, pad};
  showSel(true); syncEdit();
}
const OPS = {
  step(dir){
    const v = curVoice(); if (!v) return;
    commit(() => { for (const i of srcOf()) { const e = v.events[i]; if (e.rest) continue; e.step += dir; e.alt = implied(v, e.step, e.t); e.ed = false; } });
  },
  acc(a){
    const v = curVoice(); if (!v) return;
    commit(() => { for (const i of srcOf()) { const e = v.events[i]; if (e.rest) continue; const imp = implied(v, e.step, e.t) || 0; e.alt = (e.alt ?? imp) === a && a !== imp ? (imp || null) : a; e.ed = false; } });
  },
  value(g){
    const v = curVoice(); if (!v) return;
    const src = srcOf(); if (!src.length) return;
    const val = VALS.find(x => x[0] === g)[1];
    commit(() => {
      const e = v.events[src[0]], was = src.reduce((a, i) => a + v.events[i].d, 0);
      e.d = mensRulesOn() ? nomD(v, e.t, g) : rt(val / propAt(v, e.t)); e.altd = false; e.tieStart = e.tieEnd = e.tieMid = false; e.long = g === 'L' && e.long;
      dropEvents(v, src.slice(1));
      if (ed.ovr) ovrResize(v, src[0], was);
    });
    ed.val = g; syncEdit();
  },
  dot(){
    const v = curVoice(), s = selSym(); if (!v || !s) return;
    const src = srcOf();
    commit(() => {
      const e = v.events[src[0]];
      const total = src.reduce((a, i) => a + v.events[i].d, 0);
      e.d = rt(s.dot ? total / 1.5 : total * 1.5); e.tieStart = e.tieEnd = e.tieMid = false;
      dropEvents(v, src.slice(1));
      if (ed.ovr) ovrResize(v, src[0], total);
    });
  },
  rest(){
    const v = curVoice(); if (!v) return;
    const src = srcOf();
    commit(() => {
      for (const i of src) {
        const e = v.events[i];
        if (e.rest) {
          let j = i - 1; while (j >= 0 && v.events[j].rest) j--;
          e.rest = false; e.step = j >= 0 ? v.events[j].step : CLEFS[clefAt(v, e.t) || 'c3'].bottom + 4; e.alt = implied(v, e.step, e.t); e.ed = false;
        } else { e.rest = true; e.tieStart = e.tieEnd = e.tieMid = false; }
      }
    });
  },
  del(){
    const v = curVoice(); if (!v) return;
    const src = srcOf();
    /* a note becomes a rest of the same length so the other voices stay aligned; a rest is removed */
    if (src.some(i => !v.events[i].rest)) { commit(() => { for (const i of src) { const e = v.events[i]; e.rest = true; delete e.chord; e.tieStart = e.tieEnd = e.tieMid = false; const nx = v.events[i + 1]; if (e.syl && e.syl.some(Boolean) && nx && !nx.rest && !(nx.syl || []).some(Boolean)) nx.syl = e.syl; e.syl = []; } }); return; }
    commit(() => dropEvents(v, src));
    if (ed.sel) ed.sel.ei = Math.max(0, Math.min(src[0], piece.voices[ed.sel.vi].events.length - 1));
    render();
  },
  insert(letter){
    const v = curVoice(); if (!v) return;
    const src = srcOf();
    /* on a selected rest, the note goes where the rest begins */
    const onRest = src.length && v.events[src[0]] && v.events[src[0]].rest && letter !== 'r';
    const at = onRest ? src[0] : src.length ? src[src.length - 1] + 1 : v.events.length;
    let ref = null; for (let j = at - 1; j >= 0; j--) if (!v.events[j].rest) { ref = v.events[j].step; break; }
    if (ref === null) ref = CLEFS[v.clef || 'c3'].bottom + 4;
    const idx = LETTERS.indexOf(letter);
    let step = Math.round((ref - idx) / 7) * 7 + idx;
    insertEvent(ed.sel.vi, at, step, letter === 'r');
  },
  /* move the selection a minim later (+1) or earlier (-1): the rests around it give and take the time */
  shift(dir){
    const v = curVoice(); if (!v || !ed.sel) return;
    const src = srcOf(); if (!src.length) return;
    const a = src[0], b = src[src.length - 1];
    const m = rt(0.5 / propAt(v, v.events[a].t));
    const before = v.events[a - 1], after = v.events[b + 1];
    const give = dir > 0 ? after : before;
    /* the neighbour gives up a minim: a rest of any length, or a note longer than a minim */
    if (!give || give.d < m - EPS || (!give.rest && give.d < m + m / 2 - EPS)) {
      toast(!give ? (dir > 0 ? 'Nothing comes after it to make room.' : 'Nothing comes before it to make room.') : (dir > 0 ? 'The next note is too short to make room.' : 'The note before is too short to make room.'));
      return;
    }
    let first = a;
    commit(() => {
      const fix = (at, by) => { for (const arr of [v.mets, v.keys, v.clefs]) for (const mk of arr) if (mk.ei > at) mk.ei += by; };
      const shrink = (i) => { const r = v.events[i]; if (r.d <= m + EPS) { v.events.splice(i, 1); fix(i, -1); return true; } r.d = rt(r.d - m); r.kd = r.d; return false; };
      /* a sign standing at `place` stays with the new rest when it comes before the note, and with the next note when it comes after */
      const grow = (i, place, keepSign) => {
        const r = v.events[i];
        if (r && r.rest) { r.d = rt(r.d + m); r.kd = r.d; return false; }
        v.events.splice(place, 0, {d: m, kd: m, rest: true, t: 0, syl: []}); fix(keepSign ? place : place - 1, 1); return true;
      };
      if (dir > 0) {
        shrink(b + 1);
        if (grow(a - 1, a, true)) first = a + 1;
      } else {
        if (shrink(a - 1)) first = a - 1;
        const nb = b - (first < a ? 1 : 0);
        grow(nb + 1, nb + 1, false);
      }
    });
    ed.sel = {vi: ed.sel.vi, ei: first}; showSel(); syncEdit();
  },
  move(dir){
    if (!ed.sel) return;
    const v = curVoice(), s = selSym();
    const k = v.syms.indexOf(s) + dir;
    if (k >= 0 && k < v.syms.length) { const t = v.syms[k].rest ? pickRest(ed.sel.vi, v.syms[k]) : v.syms[k]; ed.sel = {vi: ed.sel.vi, ei: t.src[0]}; }
    showSel(true);
  },
  xform(kind){
    const v = curVoice(); if (!v) return;
    commit(() => {
      for (const e of v.events) {
        if (kind === 'octup' || kind === 'octdn') { if (!e.rest) e.step += kind === 'octup' ? 7 : -7; }
        else if (kind === 'tonup' || kind === 'tondn') { if (!e.rest) { e.step += kind === 'tonup' ? 1 : -1; e.alt = implied(v, e.step, e.t); e.ed = false; } }
        else if (kind === 'dbl') e.d = rt(e.d * 2);
        else if (kind === 'hlv') e.d = rt(e.d / 2);
      }
    });
  }
};
/* Overwrite, when a note changes its length (Samuel 2026-11-14): longer, it takes the time of what follows (notes and
   rests it covers go, one it covers in part keeps the rest of its time as a rest); shorter, a rest fills the time it
   gave up. Either way what comes after stays where it was. Insert pushes or pulls the music instead. */
function ovrResize(v, k, was){
  const e = v.events[k], delta = rt(e.d - was);
  const fix = (at, by) => { for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > at) m.ei += by; };
  if (delta < -EPS) {
    v.events.splice(k + 1, 0, {d: rt(-delta), rest: true, alt: null, ed: false, syl: [], t: rt(e.t + e.d)});
    fix(k, 1);
    return;
  }
  let need = delta, j = k + 1;
  while (need > EPS && v.events[j]) {
    const r = v.events[j];
    if (r.d <= need + EPS) {
      need = rt(need - r.d); v.events.splice(j, 1); fix(j, -1);
    } else {
      r.d = rt(r.d - need); r.kd = r.d; r.t = rt(r.t + need); need = 0;
      if (!r.rest) { r.rest = true; r.tieStart = r.tieEnd = r.tieMid = false; r.syl = []; r.lig = 0; r.alt = null; r.ed = false; r.long = false; }
    }
  }
}
function dropEvents(v, list){
  const sorted = list.slice().sort((a, b) => b - a);
  for (const i of sorted) {
    const e = v.events[i];
    /* keep the syllable on the next note */
    if (e.syl && e.syl.some(Boolean) && v.events[i + 1] && !(v.events[i + 1].syl || []).some(Boolean)) v.events[i + 1].syl = e.syl;
    v.events.splice(i, 1);
    for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > i) m.ei--;
  }
}
function undo(){
  if (!ed.undo.length) return;
  const top = ed.undo.pop();
  if (typeof top === 'object') { ed.redo.push({style: JSON.parse(styleLast)}); styleApply(top.style); syncEdit(); return; }
  ed.redo.push(piece.text || writeKern(piece)); applyText(top);
}
function redo(){
  if (!ed.redo.length) return;
  const top = ed.redo.pop();
  if (typeof top === 'object') { ed.undo.push({style: JSON.parse(styleLast)}); styleApply(top.style); syncEdit(); return; }
  ed.undo.push(piece.text || writeKern(piece)); applyText(top);
}
function showSel(scroll){
  if (typeof syncLayer2UI === 'function') syncLayer2UI();
  if (typeof syncAdv === 'function') syncAdv();
  document.querySelectorAll('#pages g.sel').forEach(g => g.classList.remove('sel'));
  document.querySelectorAll('#pages .caret').forEach(c => c.remove());
  if ((ed.range || ed.picks) && piece) {
    let first = null;
    const hit = ed.range ? (v, q) => inRange(q.t) : (v, q) => ed.picks.some(p => p.vi === v.idx && Math.abs(p.t - q.t) < EPS);
    const vs = ed.range ? rangeVoices() : piece.voices;
    for (const v of vs) for (const q of v.syms || []) if (q.src && hit(v, q)) document.querySelectorAll('#pages g.' + q.id).forEach(g => { g.classList.add('sel'); first = first || g; });
    if (scroll && first) bringIntoView(first);
    syncEdit(); return;
  }
  const s = selSym();
  if (!s) { if (ed.on && ed.ins) drawCaret(scroll); syncEdit(); return; }
  let first = null;
  piece.voices[ed.sel.vi].syms.filter(q => q.src && q.src[0] === s.src[0]).forEach(q => document.querySelectorAll('#pages g.' + q.id).forEach(g => { g.classList.add('sel'); first = first || g; }));
  if (scroll && first) bringIntoView(first);
  syncEdit();
}
/* clicking a note selects it (in any view); with note input off it only marks where Play starts */
pagesEl.addEventListener('click', e => {
  const g = e.target.closest('g[class^="n"]');
  if (!g || !piece) { if ((ed.sel || ed.range || ed.picks) && !ed.on) { ed.sel = null; ed.range = null; ed.picks = null; showSel(); } return; }
  const id = g.classList[0], m = id.match(/^n(\d+)-(\d+)$/);
  if (!m) return;
  const s = piece.voices[+m[1]].syms[+m[2]];
  if (e.shiftKey && (ed.sel || ed.range || ed.picks)) { extendRange(+m[1], s); return; }
  if ((e.ctrlKey || e.metaKey) && (ed.sel || ed.range || ed.picks)) { togglePick(+m[1], s); return; }
  ed.range = null; ed.picks = null;
  ed.sel = {vi: +m[1], ei: s.src[0]}; ed.ins = {vi: +m[1], ei: s.src[s.src.length - 1] + 1};
  if (!s.rest) hear(s.step, s.alt);
  showSel();
});
/* the clef menu, from a click on a clef in the score */
/* The clef menu, opened by clicking a clef on the staff: CantusFirmus's grid of clefs, with "As written"
   and the B flat in the signature. Arrow keys move, Enter chooses, Escape closes. */
const clefPick = $('#clefPick');
clefPick.id = 'clefMenu'; clefPick.setAttribute('role', 'listbox'); clefPick.tabIndex = -1;
const CLEF_KEYS = [...CLEF_MENU.map(c => c[0]), ''];
let clefActive = 0;
function clefIcon(k){
  let lines = '';
  for (let i = 0; i < 5; i++) lines += `<line x1="-0.3" x2="3.3" y1="${i}" y2="${i}" stroke="currentColor" stroke-opacity=".5" stroke-width="0.1"/>`;
  if (k === 'flat') return `<svg viewBox="-0.3 0.4 3.6 4.2" aria-hidden="true">${lines}${use('fl', 1.3, 2)}</svg>`;
  if (!k) return `<svg viewBox="-0.3 -1.9 3.6 8.8" aria-hidden="true">${lines}<text x="1.5" y="2.9" text-anchor="middle" font-size="2.6" font-style="italic" fill="currentColor" font-family="IM Fell English,Georgia,serif">?</text></svg>`;
  return `<svg viewBox="-0.3 -1.9 3.6 8.8" aria-hidden="true">${lines}${clefSvg(k, 0.25, 0)}</svg>`;
}
clefPick.innerHTML = CLEF_KEYS.map(k => {
  const c = CLEF_MENU.find(x => x[0] === k);
  const short = k === 'flat' ? 'B♭ in the signature' : k ? c[1] : 'As written', label = k === 'flat' ? 'B flat in the signature' : k ? c[2] : 'The clef the piece has (or the old clef that fits, with Old clefs)';
  return `<li role="option" id="clefopt-${k || 'asis'}" data-c="${k}" title="${esc(label)}"${k === 'flat' ? ' class="flatopt"' : !k ? ' class="flatopt asis"' : ''}>${clefIcon(k)}<span>${esc(short)}</span></li>`;
}).join('');
/* the clef menu belongs to the start of a voice, or to one clef change in it (dataset.t) */
const pickT = () => clefPick.dataset.t === undefined || clefPick.dataset.t === '' ? null : +clefPick.dataset.t;
function markClef(){
  const vi = +clefPick.dataset.v, v = piece && piece.voices[vi], mt = pickT();
  const cm = v && mt !== null ? v.clefs.find(m => m.t > EPS && eq(m.t, mt)) : null;
  const cur = cm ? KERN_CLEF[cm.c] || '' : v ? vis(vi).clef || '' : '', fl = v && keyAt(v, 0).b === -1;
  clefPick.querySelectorAll('li').forEach((li, i) => {
    li.classList.toggle('active', i === clefActive);
    li.setAttribute('aria-selected', String(li.dataset.c === 'flat' ? !!fl : li.dataset.c === cur));
  });
  clefPick.setAttribute('aria-activedescendant', clefPick.children[clefActive].id);
}
function openClefPick(vi, e, t){
  const wr = $('.viewwrap').getBoundingClientRect();
  clefPick.dataset.v = vi; clefPick.dataset.t = t === undefined ? '' : t; clefPick.hidden = false;
  const mid = t !== undefined, cm = mid ? piece.voices[vi].clefs.find(m => m.t > EPS && eq(m.t, t)) : null;
  /* at a clef change the last choice takes the change away again */
  const asis = clefPick.querySelector('.asis');
  if (asis) { asis.querySelector('span').textContent = mid ? 'Take this clef away' : 'As written'; asis.title = mid ? 'No clef change here: the clef before it goes on' : 'The clef the piece has (or the old clef that fits, with Old clefs)'; }
  clefActive = Math.max(0, CLEF_KEYS.indexOf(mid ? (cm && KERN_CLEF[cm.c]) || '' : vis(vi).clef || ''));
  markClef();
  clefPick.style.left = Math.max(4, Math.min(wr.width - clefPick.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  clefPick.style.top = (e.clientY - wr.top + 10) + 'px';
  clefPick.focus({preventScroll: true});
}
function pickClef(k){
  clefPick.hidden = true;
  const vi = +clefPick.dataset.v, mt = pickT();
  if (mt !== null) {
    const v = piece.voices[vi];
    if (!writable(v)) { refuse(); return; }
    commit(() => {
      const i = v.clefs.findIndex(m => m.t > EPS && eq(m.t, mt)); if (i < 0) return;
      if (!k || k === 'flat') v.clefs.splice(i, 1); else v.clefs[i].c = CLEF_KERN[k];
    });
    return;
  }
  if (k === 'flat') VOICE_OPS.flat(vi); else VOICE_OPS.clef(vi, k);
}
clefPick.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pickClef(li.dataset.c); });
clefPick.addEventListener('keydown', e => {
  e.stopPropagation();
  const mv = {ArrowDown: 5, ArrowUp: -5, ArrowRight: 1, ArrowLeft: -1}[e.key];
  if (mv) { e.preventDefault(); clefActive = Math.max(0, Math.min(CLEF_KEYS.length - 1, clefActive + mv)); markClef(); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickClef(CLEF_KEYS[clefActive]); }
  else if (e.key === 'Escape' || e.key === 'Tab') clefPick.hidden = true;
});
document.addEventListener('pointerdown', e => { if (!clefPick.hidden && !e.target.closest('#clefMenu') && !e.target.closest('.clefhit')) clefPick.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') clefPick.hidden = true; });
/* where a click on a staff would write: the pitch under the pointer, and the place among the voice's notes */
function staffTarget(rect, e){
  const ctm = rect.getScreenCTM(); if (!ctm) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  let vi = +rect.dataset.v, top = +rect.dataset.top, v = piece.voices[vi];
  if (!v) return null;
  if (ed.on && ed.layer2) { const sub = subVoiceOf(vi); if (sub) { vi = sub.idx; v = sub; } }
  const pos = Math.max(-8, Math.min(16, Math.round((top + 4 - p.y) * 2)));
  let mode = 'end', k = null;
  if (rect.dataset.k0 !== '') {
    const k0 = +rect.dataset.k0, k1 = +rect.dataset.k1, g = rect.parentNode;
    mode = 'before'; k = k0;
    for (let q = k0; q <= k1; q++) {
      const s = v.syms[q]; if (!s || !s.src || !s.src.length) continue;
      const el = g.querySelector('g.n' + vi + '-' + q); if (!el) continue;
      const bb = el.getBBox();
      if (s.rest && p.x >= bb.x - 0.5 && p.x <= bb.x + Math.max(bb.width, 0.5) + 0.8) { mode = 'on'; k = q; break; }
      if (bb.x + bb.width / 2 <= p.x) { mode = 'after'; k = q; }
    }
  }
  /* the place of a first note in an empty voice stands for no event: a note goes to the end, which is the start */
  if (k !== null && v.syms[k] && !(v.syms[k].src && v.syms[k].src.length)) { mode = 'end'; k = null; }
  /* the clef the new note is written in: the one in force at that place */
  const ref = k !== null ? v.syms[k] : null;
  const cl = !ref ? clefAt(v, 1e9) : mode === 'before' ? clefAt(v, Math.max(0, ref.t - 0.01)) : ref.clef;
  const step = CLEFS[cl || v.clef].bottom + pos;
  return {vi, v, top, pos, step, mode, k, x: p.x, end: +rect.dataset.end, g: rect.parentNode};
}
/* The staff a note stands on, and whether the pointer is at another pitch than the note's own: there (with a mouse) a click writes a
   note at that pitch, next to this one, instead of selecting it (a second above or below it, say); on the note's own pitch it selects. */
function staffOfNote(n){
  const m = /^n(\d+)-(\d+)/.exec(n.g.getAttribute('class') || ''); if (!m) return null;
  const k = +m[2]; let r = null;
  for (const r2 of n.g.parentNode.querySelectorAll('rect.stafhit[data-v="' + n.vi + '"]')) if (r2.dataset.k0 !== '' && +r2.dataset.k0 <= k && k <= +r2.dataset.k1) r = r2;
  return r;
}
function offPitch(n, e){
  if (!n || n.s.rest || n.s.pos === null || n.s.pos === undefined || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return null;
  const rect = staffOfNote(n); if (!rect) return null;
  const tg = staffTarget(rect, e);
  return tg && tg.pos !== n.s.pos ? {rect, tg} : null;
}
/* the writing area under the pointer: the staff itself, or, while editing, a rest on it (a note written there takes the rest's place) */
function stafFor(el){
  if (!el || !el.closest || !piece) return null;
  const r = el.closest('rect.stafhit'); if (r) return r;
  if (!ed.on) return null;
  const g = el.closest('g[class^="n"]'); if (!g) return null;
  const m = /^n(\d+)-(\d+)/.exec(g.getAttribute('class') || ''); if (!m) return null;
  const vi = +m[1], k = +m[2], v = piece.voices[vi], sy = v && v.syms[k];
  if (!sy || !sy.rest) return null;
  for (const r2 of g.parentNode.querySelectorAll('rect.stafhit[data-v="' + vi + '"]'))
    if (r2.dataset.k0 !== '' && +r2.dataset.k0 <= k && k <= +r2.dataset.k1) return r2;
  return null;
}
function eventIndexFor(tg){
  const s = tg.k !== null ? tg.v.syms[tg.k] : null;
  if (tg.mode === 'on') return {at: s.src[0], onRest: true};
  if (tg.mode === 'after') return {at: s.src[s.src.length - 1] + 1, onRest: false};
  if (tg.mode === 'before') return {at: s.src[0], onRest: false};
  return {at: tg.v.events.length, onRest: false};
}
/* Over a rest, or past the end of the voice, a click writes at the time under the pointer (on the grid of the chosen
   value), not after the last note: the time comes from where the line's columns stand. Over notes it goes between
   them, as before. Returns {T, x} or null. */
const slotW = () => (ed.inRest ? 0.42 : gw(navVal())) + 1.6;
const slotT = (v, t) => VALS.find(q => q[0] === navVal())[1] / propAt(v, t);
/* Single shared coordinate map between musical time T and staff x on a line (used by the rhythmic grid, the caret,
   and click-snapping so all three align pixel-for-pixel). */
function staffGridMap(rect, v){
  const pairs = (rect.dataset.tx || '').split(',').filter(Boolean).map(p => p.split(':').map(Number));
  if (!pairs.length) return null;
  const par = rect.parentNode, vi = +rect.dataset.v;
  const w = ed.inRest ? 0.6 : gw(ed.val);
  const bg = q => { const e = q >= 0 && par.querySelector('g.n' + vi + '-' + q + '>rect.selbg'); return e ? {x: +e.getAttribute('x'), w: +e.getAttribute('width')} : null; };
  const mid = q => { const b = bg(q); return b ? b.x + b.w / 2 : null; };
  const after = q => { const b = bg(q); return b ? b.x + b.w + 0.5 + w / 2 : null; };
  const pts = [];
  if (rect.dataset.k0 !== '') {
    const k0 = +rect.dataset.k0, k1 = +rect.dataset.k1;
    let lastQ = -1;
    for (let q = k0; q <= k1; q++) {
      const s = v.syms && v.syms[q];
      if (!s || !s.src || !s.src.length) continue;
      const mx = mid(q);
      if (mx !== null) { pts.push([s.t, mx]); lastQ = q; }
    }
    if (lastQ >= 0) {
      const ax = after(lastQ), ls = v.syms[lastQ];
      if (ax !== null && ls) pts.push([rt(ls.t + ls.d), ax]);
    }
  }
  if (pts.length < 2) {
    /* fallback for empty staff or lines without symbols */
    pairs.forEach(([t, x]) => pts.push([t, x + 0.6]));
  }
  const [tb, xb] = pts[pts.length - 1];
  const g = navGrid(v, Math.min(tb, v.end));
  const sw = slotW();
  const xOf = T => {
    if (T <= pts[0][0] + EPS) return pts[0][1];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ta, xa] = pts[i], [t2, x2] = pts[i + 1];
      if (T >= ta - EPS && T <= t2 + EPS && t2 > ta) return xa + (T - ta) / (t2 - ta) * (x2 - xa);
    }
    return xb + ((T - tb) / g) * sw;
  };
  const tOf = x => {
    if (x <= pts[0][1]) return pts[0][0];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ta, xa] = pts[i], [t2, x2] = pts[i + 1];
      if (x <= x2) return ta + (x2 > xa ? (x - xa) / (x2 - xa) : 0) * (t2 - ta);
    }
    /* past xb: centered on each grid tick xb + s*sw so clicking near tick 0 (caret at end) never jumps to +1 rest */
    return tb + Math.max(0, Math.round((x - xb) / sw)) * g;
  };
  return {pts, tMin: pts[0][0], tb, xb, g, sw, xOf, tOf};
}
function timePlace(rect, tg){
  const v = tg.v, M = staffGridMap(rect, v.subOf >= 0 ? piece.voices[v.subOf] : v);
  if (!M) return null;
  let T = M.tOf(tg.x);
  const g = navGrid(v, Math.min(T, v.end));
  T = rt(Math.max(0, Math.round(T / g) * g));
  /* over rests or past the end; in Overwrite also over a note, on the grid, inside it too (the note is cut, see insertEvent) */
  const ei = v.events.findIndex(e => T >= e.t - EPS && T < e.t + e.d - EPS);
  if (ei >= 0 && !v.events[ei].rest && !ed.ovr) return null;
  if (ei < 0 && T < v.end - EPS) return null;
  return {T, ei, x: M.xOf(T)};
}
let ghostEl = null;
function clearGhost(){ if (ghostEl) { ghostEl.remove(); ghostEl = null; } }
/* Rhythmic grid overlay in Note Input mode: follows the Grid dropdown (navVal) and aligns pixel-for-pixel with the caret. */
function drawEditGrid(){
  document.querySelectorAll('#pages .ed-grid').forEach(el => el.remove());
  if (!ed.on || !piece) return;
  pagesEl.querySelectorAll('rect.stafhit').forEach(rect => {
    const vi = +rect.dataset.v, top = +rect.dataset.top, v = piece.voices[vi];
    if (!v) return;
    const M = staffGridMap(rect, v);
    if (!M || !(M.g > 0)) return;
    const rx1 = +rect.getAttribute('x') + +rect.getAttribute('width');
    const {tMin, tb, xb, g, sw, xOf} = M;
    let out = '';
    /* 1. Grid ticks across existing music on this staff line (exact caret positions) */
    const stepCount = Math.min(180, Math.floor((tb - tMin) / g) + 1);
    const stepInc = stepCount >= 180 ? g * Math.ceil(((tb - tMin) / g) / 140) : g;
    let t0 = Math.ceil((tMin - EPS) / stepInc) * stepInc;
    if (t0 < tMin - EPS) t0 += stepInc;
    for (let T = t0; T <= tb + EPS; T = rt(T + stepInc)) {
      const x = xOf(T);
      const major = Math.abs(T - Math.round(T)) < 1e-3;
      out += `<line class="eg-tick${major ? ' maj' : ''}" x1="${f(x)}" x2="${f(x)}" y1="${f(top - (major ? 1.05 : 0.72))}" y2="${f(top - 0.18)}"/>`;
      out += `<line class="eg-line${major ? ' maj' : ''}" x1="${f(x)}" x2="${f(x)}" y1="${f(top)}" y2="${f(top + 4)}"/>`;
    }
    /* 2. Tail grid ticks past the end of the voice */
    if (rx1 > xb + 0.6) {
      for (let s = 1; s <= 40; s++) {
        const x = xb + s * sw;
        if (x > rx1 - 0.5) break;
        const T = rt(tb + s * g), major = Math.abs(T - Math.round(T)) < 1e-3;
        out += `<line class="eg-tick tail${major ? ' maj' : ''}" x1="${f(x)}" x2="${f(x)}" y1="${f(top - (major ? 1.05 : 0.72))}" y2="${f(top - 0.18)}"/>`;
        out += `<line class="eg-line tail${major ? ' maj' : ''}" x1="${f(x)}" x2="${f(x)}" y1="${f(top)}" y2="${f(top + 4)}"/>`;
      }
    }
    if (!out) return;
    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grp.setAttribute('class', 'ed-grid');
    grp.innerHTML = out;
    rect.parentNode.insertBefore(grp, rect);
  });
}
pagesEl.addEventListener('pointermove', e => {
  if (!ed.on || e.pointerType !== 'mouse' || !piece) { clearGhost(); return; }
  const on = noteAt(e);
  const off = on && !on.s.rest ? offPitch(on, e) : null;
  if (on && !on.s.rest && !off) { clearGhost(); return; }   /* over a note, at its own pitch: it is clicked, dragged or right-clicked */
  const rect = off ? off.rect : stafFor(e.target);
  if (!rect) { clearGhost(); return; }
  const tg = off ? off.tg : staffTarget(rect, e); if (!tg) { clearGhost(); return; }
  if (ed.divisi) {
    const dt = divisiTarget(rect, e);
    if (dt && dt.sym) {
      const sg = rect.ownerSVGElement && rect.ownerSVGElement.querySelector('g.' + dt.sym.id + ' rect.hit');
      if (sg) {
        const sx = +sg.getAttribute('x') + 0.3, w = dt.sym.hw, y = tg.top + 4 - tg.pos * 0.5;
        const html = ledgers(tg.pos, sx, w, tg.top) + chordHeadSvg(dt.sym, sx, y);
        if (!ghostEl || ghostEl.parentNode !== tg.g) { clearGhost(); ghostEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ghostEl.setAttribute('class', 'ghost'); tg.g.appendChild(ghostEl); }
        ghostEl.innerHTML = html;
        return;
      }
    }
  }
  const tp = timePlace(rect, tg); if (tp) tg.x = tp.x;
  const g = ed.val, w = ed.inRest ? 0.42 : gw(g), x = tg.x - w / 2, y = tg.top + 4 - tg.pos * 0.5;
  const flip = st.stems === 'strict' ? false : (STEMMED[g] && tg.pos >= 7) || (TAILED[g] && tg.pos <= -1);
  let html = ed.inRest ? restSvg({g, glyph: SHAPE_REST[g]}, tg.x, tg.top) : ledgers(tg.pos, x, w, tg.top) + (flip ? useT(g, x, y, 1, -1) : use(g, x, y));
  /* past the end of the music: a faint piece of staff for the note to stand on, plus a rest-gap cue if clicking here adds a rest first */
  if (tg.x > tg.end) {
    for (let q = 0; q < 5; q++) html += `<line class="ledger" x1="${f(tg.end)}" x2="${f(x + w + 1)}" y1="${f(tg.top + q)}" y2="${f(tg.top + q)}" stroke-width="0.1" opacity="0.5"/>`;
    if (tp && tp.T > tg.v.end + EPS) {
      const gx0 = tg.end + 0.3, gx1 = x - 0.35;
      if (gx1 > gx0 + 0.4) {
        html += `<line x1="${f(gx0)}" x2="${f(gx1)}" y1="${f(tg.top + 2)}" y2="${f(tg.top + 2)}" stroke="var(--sel)" stroke-width="0.12" stroke-dasharray="0.3 0.25" opacity="0.65"/>`;
        html += `<text x="${f((gx0 + gx1) / 2)}" y="${f(tg.top - 0.4)}" text-anchor="middle" font-size="0.95" font-style="italic" fill="var(--sel)" opacity="0.85" font-family="IM Fell English,Georgia,serif">+ rest</text>`;
      }
    }
  }
  if (!ghostEl || ghostEl.parentNode !== tg.g) { clearGhost(); ghostEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ghostEl.setAttribute('class', 'ghost'); tg.g.appendChild(ghostEl); }
  ghostEl.innerHTML = html;
});
pagesEl.addEventListener('pointerleave', clearGhost);

/* a voice's name in the score: click it to rename the voice (the same name as in Voices) */
/* Text in the score is edited where it stands: click a voice name, the title or the composer, type, Enter */
function editInPlace(el, value, label, commitFn, opts = {}){
  const wr = $('.viewwrap').getBoundingClientRect(), r = el.getBoundingClientRect();
  const inp = document.createElement('input');
  inp.className = 'vrename'; inp.value = value; inp.setAttribute('aria-label', label);
  const w = Math.max(opts.min || 140, r.width + 30);
  inp.style.width = w + 'px';
  inp.style.left = Math.max(2, (opts.align === 'center' ? r.left + r.width / 2 - w / 2 : r.right - w) - wr.left) + 'px';
  inp.style.top = (r.top - wr.top - 6) + 'px';
  if (opts.font) { inp.style.fontSize = opts.font + 'px'; inp.style.height = Math.round(opts.font * 1.9) + 'px'; }
  inp.style.textAlign = opts.align === 'center' ? 'center' : 'right'; inp.style.fontStyle = opts.italic === false ? 'normal' : 'italic';
  $('.viewwrap').appendChild(inp);
  inp.focus(); inp.select();
  let done = false;
  const finish = keep => { if (done) return; done = true; const val = inp.value; inp.remove(); if (keep) commitFn(val); };
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
  inp.addEventListener('blur', () => finish(true));
}
function renameInPlace(el){
  const vi = +el.dataset.v, v = piece && piece.voices[vi]; if (!v) return;
  editInPlace(el, v.name, 'Name of the voice', val => VOICE_OPS.rename(vi, val));
}
pagesEl.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('.vnamehit, .texthit');
  if (!t || !piece) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (t.classList.contains('vnamehit')) { renameInPlace(t); return; }
  const rect = t.getBoundingClientRect(), sc = rect.height / (+t.getAttribute('font-size') * 1.2 || 1);
  if (t.dataset.f === 'title') editInPlace(t, (piece.meta.OTL || piece.title || '').replace(/\s*\.\.\.\s*/g, ' … '), 'Title', setTitle, {align: 'center', min: 320, font: 22, italic: false});
  else editInPlace(t, piece.meta.COM || piece.meta.COA || piece.composer || '', 'Composer', setComposer, {align: 'right', min: 220, font: 16, italic: false});
}, true);

/* The mensuration menu, opened by clicking a mensuration sign: the signs as a grid, like the clefs. The change goes to
   every voice that has a sign there, or with "Different mensuration" ticked, to this voice only. */
const MENS_MENU = [['O', 'Tempus perfectum'], ['C', 'Tempus imperfectum'], ['O.', 'Tempus perfectum, prolatio maior'], ['C.', 'Tempus imperfectum, prolatio maior'],
  ['O|', 'Tempus perfectum diminutum'], ['C|', 'Tempus imperfectum diminutum (alla breve)'], ['Cr', 'Reversed C: half the values'], ['3', 'Proportio sesquialtera, 3'],
  ['O3', 'O with 3'], ['C3', 'C with 3'], ['C|3', 'C with stroke and 3'], ['C2', 'C with 2: proportio dupla'],
  ['O2', 'O with 2: proportio dupla in tempus perfectum'], ['O|3', 'O with stroke and 3'], ['3/2', 'Proportio sesquialtera, 3 over 2'],
  ['O3/2', 'O with 3 over 2'], ['C3/2', 'C with 3 over 2'], ['4/3', 'Proportio sesquitertia, 4 over 3']];
const mensMenu = document.createElement('ul');
mensMenu.id = 'mensMenu'; mensMenu.className = 'menu'; mensMenu.setAttribute('role', 'listbox'); mensMenu.tabIndex = -1; mensMenu.hidden = true;
mensMenu.setAttribute('aria-label', 'Mensuration');
$('.viewwrap').appendChild(mensMenu);
function mensIcon(sg){
  let lines = '';
  for (let i = 0; i < 5; i++) lines += `<line x1="-0.3" x2="4.6" y1="${i}" y2="${i}" stroke="currentColor" stroke-opacity=".5" stroke-width="0.1"/>`;
  return `<svg viewBox="-0.3 -1.9 4.9 8.8" aria-hidden="true">${lines}<g fill="currentColor" stroke="none">${mensSvg(sg, 0.2, 0)}</g></svg>`;
}
/* The menu is calm: the usual signs first, the proportions and the finer settings folded away (opened when the sign in use needs them) */
const MENS_COMMON = ['O', 'C', 'O.', 'C.', 'O|', 'C|', 'Cr', '3'];
const mensSignHtml = ([sg, name]) => `<div class="msign" role="option" data-m="${esc(sg)}" title="${esc(name)}">${mensIcon(sg)}<span>${esc(sg.replace('r', ' rev.'))}</span></div>`;
const mensRow = (lab, tip, inner) => `<div class="mlev" title="${esc(tip)}"><span class="mslab">${lab}</span><span class="seg">${inner}</span></div>`;
mensMenu.innerHTML = `<li class="flatopt mscope" data-m="" role="presentation"><span class="mslab">Change</span><span class="seg" role="group" aria-label="Which voices the sign changes in"><button type="button" class="tb" data-scope="all" aria-pressed="true">All voices</button><button type="button" class="tb" data-scope="one" aria-pressed="false">Only <span class="mvn">this voice</span></button></span><input type="checkbox" id="mensDiff" hidden></li>` +
  `<li class="mgrp" role="presentation"><div class="mgrid" role="group" aria-label="Signs">${MENS_MENU.filter(x => MENS_COMMON.includes(x[0])).map(mensSignHtml).join('')}</div></li>` +
  `<li class="mgrp meq" role="presentation">` +
    mensRow('Equivalent', 'Which note value keeps the same speed across the change of mensuration', `<button type="button" class="tb" data-eq="M" title="Minima = minima">Minima</button><button type="button" class="tb" data-eq="S" title="Semibrevis = semibrevis">Semibrevis</button><button type="button" class="tb" data-eq="B" title="Brevis = brevis">Brevis</button><button type="button" class="tb" data-eq="L" title="Longa = longa">Longa</button>`) +
    mensRow('Voice speed', 'Independent speed multiplier for this voice (e.g. augmentation ×½ or diminution ×2) without changing the written note shapes', `<button type="button" class="tb" data-sf="1">×1</button><button type="button" class="tb" data-sf="2">×2</button><button type="button" class="tb" data-sf="1/2">×½</button><button type="button" class="tb" data-sf="3/2">×3/2</button>`) +
    `<div class="mlev" title="Custom voice speed ratio (e.g. 2/3, 4/3, 1/2, 3)"><span class="mslab">Custom ratio</span><span class="mmodf"><input id="sfIn" type="text" maxlength="8" autocomplete="off" placeholder="1" aria-label="Voice speed ratio" style="width:4.5em"><button type="button" class="tb" id="sfOk">Set</button></span></div>` +
    `<div class="mlev"><button type="button" class="tb" data-recalc="1" style="width:100%;justify-content:center" title="Recalculate note durations from their written shapes, dots and mensuration signs (perfection, imperfection and alteration)">Recalculate durations</button></div>` +
  `</li>` +
  `<li class="mgrp" role="presentation"><details id="mensMore"><summary>Proportions</summary><div class="mgrid" role="group" aria-label="Proportion signs">${MENS_MENU.filter(x => !MENS_COMMON.includes(x[0])).map(mensSignHtml).join('')}</div></details></li>` +
  `<li class="mgrp" role="presentation"><details id="mensOpts"><summary>Modus, rules and modern equivalent</summary>` +
    mensRow('Modus', 'How many breves a longa holds. No sign shows it; the music (and the long rests) tell', `<button type="button" class="tb" data-lev="m" data-val="2">2</button><button type="button" class="tb" data-lev="m" data-val="3">3 perfect</button>`) +
    mensRow('Maximodus', 'How many longae a maxima holds', `<button type="button" class="tb" data-lev="x" data-val="2">2</button><button type="button" class="tb" data-lev="x" data-val="3">3 perfect</button>`) +
    mensRow('Rules', "On: each note's length follows from its shape, the signs and its neighbours (perfection, imperfection, alteration). Off: the lengths stay as written in the file", `<button type="button" class="tb" data-rules="on">On</button><button type="button" class="tb" data-rules="off">Off</button>`) +
    mensRow('One between', 'Where scholars differ: a single smaller note between two perfect notes imperfects the one before it (a parte post, the usual reading) or the one after it (a parte ante)', `<button type="button" class="tb" data-opt="app">note before</button><button type="button" class="tb" data-opt="apa">note after</button>`) +
    mensRow('Two between', 'Where scholars differ: two smaller notes before a perfect note. Alteration (the usual reading): the second is doubled. Or: both perfect notes around them are imperfected', `<button type="button" class="tb" data-opt="alt">alter the 2nd</button><button type="button" class="tb" data-opt="imp2">both imperfect</button>`) +
    `<div class="mlev mmod" title="What Modern notation prints for this sign, as a time signature; from here on the barlines fall where it says. Leave both empty for none (the barlines then stay as the file has them)."><span class="mslab">Modern equivalent</span><span class="mmodf"><input id="modN" type="text" inputmode="numeric" maxlength="6" autocomplete="off" aria-label="Modern equivalent: upper number"><span class="mmsl">/</span><input id="modD" type="text" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Modern equivalent: lower number"></span><button type="button" class="tb" id="modOk">Set</button></div>` +
  `</details></li>` +
  `<li class="flatopt mdel" data-m="-" role="option" title="Remove this mensuration sign (or press Delete)"><span>Delete the sign</span></li>`;
/* All voices | Only this voice, at the top of the menu (Samuel 2026-11-14: one voice's sign must be easy to change) */
function mensScope(one){ $('#mensDiff').checked = one; mensMenu.querySelectorAll('[data-scope]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.scope === 'one') === one))); }
let mensAt = null;
/* a mensuration sign is selected while its menu is open: the trash button then takes away that sign */
const mensOpen = () => { try { return !mensMenu.hidden && !!mensAt; } catch (err) { return false; } };
function openMensMenu(vi, t, e){
  const wr = $('.viewwrap').getBoundingClientRect();
  const v = piece.voices[vi]; if (!v) return;
  mensAt = {vi, t};
  const cur = metAt(v, t);
  mensScope(false);
  mensMenu.querySelector('.mvn').textContent = v.name || 'this voice';
  mensMenu.querySelectorAll('.msign').forEach(li => li.setAttribute('aria-selected', String(!!li.dataset.m && li.dataset.m === mensBase(cur))));
  /* the folded parts open when the sign in use belongs to them */
  { const more = mensMenu.querySelector('#mensMore'); if (more) more.open = !MENS_COMMON.includes(mensBase(cur)) && !!cur; }
  modFill(v, t); levFill(v, t);
  mensMenu.hidden = false; clefPick.hidden = true;
  mensMenu.style.left = Math.max(4, Math.min(wr.width - mensMenu.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  mensMenu.style.top = (e.clientY - wr.top + 10) + 'px';
  syncEdit();
}
function setMens(sign, justThis){
  if (!mensAt || !piece) return;
  const {vi, t} = mensAt, only = justThis || $('#mensDiff').checked;
  mensMenu.hidden = true;
  const del = sign === '-';
  const targets = only ? [vi] : piece.voices.map((v, i) => i).filter(i => i === vi || piece.voices[i].mets.some(m => eq(m.t, t)) || piece.voices[i].events.some(e => eq(e.t, t)));
  if (targets.some(i => !writable(piece.voices[i])) && only) { refuse(); return; }
  commit(() => {
    /* with the mensural rules the notes are shapes: they keep theirs under the new sign and are counted again */
    if (mensRulesOn()) for (const i of targets) stashShapes(piece.voices[i]);
    for (const i of targets) {
      const v = piece.voices[i];
      if (!writable(v)) continue;
      if (del) { v.mets = v.mets.filter(x => !eq(x.t, t)); continue; }
      const m = v.mets.find(x => eq(x.t, t));
      /* the same sign as the one already in effect from earlier in the piece: no override at all (Samuel 2026-11-14) */
      let prev = null; for (const q of v.mets) if (q.t < t - EPS) prev = q.sign;
      if (prev !== null && mensBase(prev) === sign) { if (m) v.mets = v.mets.filter(x => x !== m); continue; }
      if (m) { m.sign = sign + m.sign.slice(mensBase(m.sign).length); continue; }   /* modus, maximodus and equivalence stay */
      /* in a voice with no notes yet the sign stands at the start, before the first note to come */
      let k = v.events.findIndex(e => eq(e.t, t));
      if (k < 0 && t < EPS && !v.events.length) k = 0;
      if (k >= 0) { v.mets.push({t, sign, ei: k}); v.mets.sort((a, b) => a.t - b.t); }
    }
  });
}
/* the modern equivalent's two fields: filled from the sign, with the usual equivalent shown faintly as a hint */
const MOD_HINT = {'O': '3/1', 'C': '2/1', 'O|': '3/1', 'C|': '2/1', 'O.': '9/2', 'C.': '6/2', 'Cr': '2/1', '3': '3/1', 'O3': '3/1', 'C3': '3/1', 'C|3': '3/1', 'C2': '2/1'};
/* modus, maximodus, the rules and the two editorial choices: their buttons show what is in force */
function mensOpt(k){ const o = String(piece && piece.meta && piece.meta.MENSOPT || ''); return o.split(',').includes(k); }
function defaultEquiv(v, m){
  const mi = mensInfo(m ? m.sign : null);
  if (mi.eq) return mi.eq;
  if (!v || !m) return 'M';
  let prev = null; for (const q of v.mets) if (q.t < m.t - EPS) prev = q;
  if (!prev) return 'M';
  const pm = mensInfo(prev.sign);
  for (const k of ['M', 'S', 'B', 'L']) {
    const d1 = (nomW(k, pm.T, pm.P, pm.M, pm.X) || 1) / pm.p, d2 = (nomW(k, mi.T, mi.P, mi.M, mi.X) || 1) / mi.p;
    if (Math.abs(d1 - d2) < 1e-6) return k;
  }
  return 'M';
}
function levFill(v, t){
  let m = null; for (const q of v.mets) if (q.t <= t + EPS) m = q;
  const mi = mensInfo(m ? m.sign : null), eqCur = defaultEquiv(v, m);
  mensMenu.querySelectorAll('[data-eq]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.eq === eqCur)));
  mensMenu.querySelectorAll('[data-sf]').forEach(b => b.setAttribute('aria-pressed', String(Math.abs(parseSpeedFactor(b.dataset.sf) - mi.sf) < 1e-4)));
  { const sfi = $('#sfIn'); if (sfi) sfi.value = mi.sfRaw || (Math.abs(mi.sf - 1) < 1e-4 ? '' : fracStr(mi.sf)); }
  mensMenu.querySelectorAll('[data-lev]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.val === (b.dataset.lev === 'm' ? mi.M : mi.X))));
  mensMenu.querySelectorAll('[data-rules]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.rules === 'on') === mensRulesOn())));
  mensMenu.querySelectorAll('[data-opt]').forEach(b => { const k = b.dataset.opt, on = k === 'apa' ? mensOpt('apa') : k === 'app' ? !mensOpt('apa') : k === 'imp2' ? mensOpt('imp2') : !mensOpt('imp2'); b.setAttribute('aria-pressed', String(on)); });
}
function setEquiv(eqVal){
  if (!mensAt || !piece) return;
  const {vi, t} = mensAt, only = $('#mensDiff').checked;
  const targets = only ? [vi] : piece.voices.map((v, i) => i).filter(i => i === vi || piece.voices[i].mets.some(m => eq(m.t, t)));
  commit(() => {
    for (const i of targets) {
      const v = piece.voices[i]; if (!writable(v)) continue;
      let m = null; for (const q of v.mets) if (q.t <= t + EPS) m = q;
      if (!m) continue;
      const base = mensBase(m.sign), ext = m.sign.slice(base.length).split(';').filter(x => x && !/^eq=|^p=/.test(x));
      ext.push('eq=' + eqVal);
      m.sign = base + ext.map(x => ';' + x).join('');
    }
  });
  levFill(piece.voices[vi], t);
  if (play) restartPlay();
  const nm = {M: 'Minima = minima', S: 'Semibrevis = semibrevis', B: 'Brevis = brevis', L: 'Longa = longa'}[eqVal];
  if (nm) toast(nm + '.');
}
function setLevel(kind, val){
  if (!mensAt || !piece) return;
  const {vi, t} = mensAt, only = $('#mensDiff').checked;
  const targets = only ? [vi] : piece.voices.map((v, i) => i).filter(i => i === vi || piece.voices[i].mets.some(m => eq(m.t, t)));
  commit(() => {
    if (mensRulesOn()) for (const i of targets) stashShapes(piece.voices[i]);
    for (const i of targets) {
      const v = piece.voices[i]; if (!writable(v)) continue;
      let m = null; for (const q of v.mets) if (q.t <= t + EPS) m = q;
      if (!m) continue;
      const base = mensBase(m.sign), ext = m.sign.slice(base.length).split(';').filter(x => x && x !== kind + 'p');
      if (val === 3) ext.push(kind + 'p');
      ext.sort();
      m.sign = base + ext.map(x => ';' + x).join('');
    }
  });
  levFill(piece.voices[vi], t);
}
function recalcDurations(){
  if (!piece) return;
  const only = $('#mensDiff') && $('#mensDiff').checked && mensAt;
  const targets = only ? [mensAt.vi] : piece.voices.map((_, i) => i);
  let changed = 0;
  commit(() => {
    for (const i of targets) {
      const v = piece.voices[i]; if (!v || !writable(v)) continue;
      const before = logicalNotes(v).map(it => it.d);
      mensurate(v); retime(v);
      before.forEach((d, k) => { if (v.events[k] && Math.abs(v.events[k].d - d) > 1e-6) changed++; });
    }
  });
  toast(changed ? `Recalculated durations from mensural shapes (${changed} note${changed === 1 ? '' : 's'} adjusted; Undo restores the file's original lengths).` : 'All note durations already match the mensural rules.');
}
function setRules(on){
  if (!piece) return;
  commit(() => { piece.meta.MENS = on ? 'rules' : 'off'; });
  toast(on ? 'Mensural rules on: every note is counted from its shape, the signs and its neighbours.' : 'Mensural rules off: the lengths stay as they are.');
  if (mensAt) levFill(piece.voices[mensAt.vi], mensAt.t);
}
function setMensOpt(k){
  if (!piece) return;
  const pair = {app: 'apa', apa: 'apa', alt: 'imp2', imp2: 'imp2'}[k], on = k === 'apa' || k === 'imp2';
  commit(() => {
    const o = String(piece.meta.MENSOPT || '').split(',').filter(x => x && x !== pair);
    if (on) o.push(pair);
    if (o.length) piece.meta.MENSOPT = o.join(','); else delete piece.meta.MENSOPT;
  });
  if (mensAt) levFill(piece.voices[mensAt.vi], mensAt.t);
}
function modFill(v, t){
  let m = null; for (const q of v.mets) if (q.t <= t + EPS) m = q;
  const [n, d] = String(m && m.mod || '').split('/');
  const [hn, hd] = (MOD_HINT[m ? mensBase(m.sign) : 'C'] || '2/1').split('/');
  $('#modN').value = n || ''; $('#modD').value = d || '';
  $('#modN').placeholder = hn; $('#modD').placeholder = hd;
}
function setMod(){
  if (!mensAt || !piece) return;
  const n = $('#modN').value.trim(), d = $('#modD').value.trim();
  if (!!n !== !!d) { toast('Type both numbers (for example 3 and 1), or leave both empty for none.'); ($('#' + (n ? 'modD' : 'modN'))).focus(); return; }
  if (n && !modLen(n + '/' + d, 'C')) toast('Printed as typed. The barlines follow it only when both are numbers (the upper may be a sum, like 3+2).');
  const mod = n ? n.replace(/\s+/g, '') + '/' + d.replace(/\s+/g, '') : '';
  const {vi, t} = mensAt, only = $('#mensDiff').checked;
  const targets = only ? [vi] : piece.voices.map((v, i) => i).filter(i => i === vi || piece.voices[i].mets.some(m => eq(m.t, t)));
  if (targets.some(i => !writable(piece.voices[i])) && only) { refuse(); return; }
  mensMenu.hidden = true;
  commit(() => {
    for (const i of targets) {
      const v = piece.voices[i]; if (!writable(v)) continue;
      const m = v.mets.find(x => eq(x.t, t)); if (!m) continue;
      if (mod) m.mod = mod; else delete m.mod;
    }
  });
}
$('#modOk').addEventListener('click', setMod);
['#modN', '#modD'].forEach(id => $(id).addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); setMod(); }
  else if (e.key === 'Escape') mensMenu.hidden = true;
  else if (e.key === '/' && id === '#modN') { e.preventDefault(); $('#modD').focus(); $('#modD').select(); }
}));
function setVoiceSpeed(raw){
  if (!mensAt || !piece) return;
  const {vi, t} = mensAt, only = $('#mensDiff').checked;
  const newSf = parseSpeedFactor(raw || '1');
  if (!(newSf > 0 && isFinite(newSf))) { toast('Enter a positive ratio such as 2, 1/2, 3/2 or 4/3.'); return; }
  const cleanRaw = Math.abs(newSf - 1) < 1e-5 ? '' : fracStr(newSf);
  const targets = only ? [vi] : piece.voices.map((v, i) => i).filter(i => i === vi || piece.voices[i].mets.some(m => eq(m.t, t)));
  commit(() => {
    for (const i of targets) {
      const v = piece.voices[i]; if (!writable(v)) continue;
      let mIdx = -1; for (let k = 0; k < v.mets.length; k++) if (v.mets[k].t <= t + EPS) mIdx = k;
      if (mIdx < 0) continue;
      const m = v.mets[mIdx], oldSf = mensInfo(m.sign).sf || 1;
      const nextT = mIdx + 1 < v.mets.length ? v.mets[mIdx + 1].t : Infinity;
      const base = mensBase(m.sign), extParts = m.sign.slice(base.length).split(';').filter(x => x && !/^sf=/.test(x));
      if (cleanRaw) extParts.push('sf=' + cleanRaw);
      m.sign = base + extParts.map(x => ';' + x).join('');
      const ratio = oldSf / newSf;
      if (Math.abs(ratio - 1) > 1e-6) {
        for (const e of v.events) {
          if (e.t >= m.t - EPS && e.t < nextT - EPS) e.d = rt(e.d * ratio);
        }
        retime(v);
      }
    }
  });
  levFill(piece.voices[vi], t);
  if (play) restartPlay();
  toast(cleanRaw ? `Voice speed set to ×${cleanRaw}.` : 'Voice speed reset to ×1.');
}
$('#sfOk').addEventListener('click', () => setVoiceSpeed($('#sfIn').value.trim() || '1'));
$('#sfIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); setVoiceSpeed($('#sfIn').value.trim() || '1'); } else if (e.key === 'Escape') mensMenu.hidden = true; });
mensMenu.addEventListener('click', e => {
  const sc = e.target.closest('[data-scope]'); if (sc) { mensScope(sc.dataset.scope === 'one'); return; }
  const eqb = e.target.closest('[data-eq]'); if (eqb) { setEquiv(eqb.dataset.eq); return; }
  const sfb = e.target.closest('[data-sf]'); if (sfb) { setVoiceSpeed(sfb.dataset.sf); return; }
  const rc = e.target.closest('[data-recalc]'); if (rc) { recalcDurations(); return; }
  const lv = e.target.closest('[data-lev]'); if (lv) { setLevel(lv.dataset.lev, +lv.dataset.val); return; }
  const ru = e.target.closest('[data-rules]'); if (ru) { setRules(ru.dataset.rules === 'on'); return; }
  const op = e.target.closest('[data-opt]'); if (op) { setMensOpt(op.dataset.opt); return; }
  if (e.target.closest('.mlev') || e.target.closest('summary') || e.target.closest('details') && !e.target.closest('.msign')) return;
  if (e.target.closest('.mscope') || e.target.closest('.mmod')) return;
  const li = e.target.closest('.msign, li.mdel'); if (li && li.dataset.m) setMens(li.dataset.m);
});
document.addEventListener('pointerdown', e => { if (!mensMenu.hidden && !e.target.closest('#mensMenu') && !e.target.closest('.menshit') && !e.target.closest('#del')) mensMenu.hidden = true; });
/* the trash button, while a sign is selected (its menu open), takes away that one sign, in its voice only */
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#del') || mensMenu.hidden || !mensAt) return;
  e.preventDefault(); e.stopImmediatePropagation(); setMens('-', true);
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') mensMenu.hidden = true;
  else if ((e.key === 'Delete' || e.key === 'Backspace') && !mensMenu.hidden && mensAt && !(e.target && e.target.closest && e.target.closest('input'))) { e.preventDefault(); e.stopPropagation(); setMens('-', true); }
}, true);
/* Add > Add mensuration sign: at the selected note of the selected voice(s) only; Add incipit: before the staves */
function mensTargets(){
  const out = new Map(), add = (vi, t) => { if (!out.has(vi) || t < out.get(vi)) out.set(vi, t); };
  if (ed.range || ed.picks) for (const {v, e} of selItems()) add(v.idx, e.t);
  else if (ed.sel) { const v = piece.voices[ed.sel.vi], e = v && v.events[ed.sel.ei]; if (e) add(v.idx, e.t); }
  else if (ed.ins) { const v = piece.voices[ed.ins.vi], e = v && v.events[ed.ins.ei]; if (e) add(v.idx, e.t); }
  return out;
}
$('#addMens').addEventListener('click', () => {
  if (!piece) return;
  const T = mensTargets();
  if (!T.size) { toast('Select a note first (click it, or put the caret before it); the sign goes there, in that voice.'); return; }
  if ([...T.keys()].some(vi => !writable(piece.voices[vi]))) { refuse(); return; }
  let first = null;
  commit(() => {
    for (const [vi, t] of T) {
      const v = piece.voices[vi], k = v.events.findIndex(e => eq(e.t, t));
      if (k < 0 || v.mets.some(m => eq(m.t, t))) continue;
      v.mets.push({t, sign: 'C', ei: k}); v.mets.sort((a, b) => a.t - b.t);
      if (!first) first = {vi, t, k};
    }
  });
  if (!first) { toast('There is a sign there already: click it to change it.'); return; }
  setTimeout(() => {
    const el = pagesEl.querySelector(`g.n${first.vi}-${first.k} .menshit`);
    if (el) { const r = el.getBoundingClientRect(); openMensMenu(first.vi, first.t, {clientX: r.left, clientY: r.bottom}); mensTargetOnly(); }
  }, 60);
});
/* a sign added by hand belongs to the selected voice(s) only: the menu opens with "this voice only" on */
function mensTargetOnly(){ mensScope(true); }
/* Add > Signum: a fermata on the selected note(s) */
function selEvents(){
  if (ed.range || ed.picks) return selItems();
  if (ed.sel) { const v = piece.voices[ed.sel.vi], e = v && v.events[ed.sel.ei]; return e ? [{v, e}] : []; }
  if (ed.ins) { const v = piece.voices[ed.ins.vi], e = v && v.events[ed.ins.ei]; return e ? [{v, e}] : []; }
  return [];
}
$('#addFerm').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents();
  if (!it.length) { toast('Select a note first.'); return; }
  if (it.some(x => !writable(x.v))) { refuse(); return; }
  const all = it.every(x => x.e.ferm);
  commit(() => { for (const {e} of it) e.ferm = !all; });
});
$('#addSignum').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents();
  if (!it.length) { toast('Select a note first.'); return; }
  if (it.some(x => !writable(x.v))) { refuse(); return; }
  const all = it.every(x => x.e.signum);
  commit(() => { for (const {e} of it) e.signum = !all; });
});
$('#addCustos').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents();
  if (!it.length) { toast('Select a note first.'); return; }
  const {v, e} = it[0], vi = piece.voices.indexOf(v);
  if (!writable(v)) { refuse(); return; }
  const ext = ensureExt(piece);
  const idx = ext.custos.findIndex(c => c.vi === vi && eq(c.t, e.t));
  commit(() => {
    if (idx >= 0) ext.custos.splice(idx, 1);
    else {
      const nextNote = v.events.find(q => q.t > e.t + EPS && !q.rest);
      const step = !e.rest ? e.step : (nextNote ? nextNote.step : 28);
      ext.custos.push({vi, t: rt(e.t), step});
    }
  });
  toast(idx >= 0 ? 'Custos removed.' : 'Explicit custos added.');
});
$('#addLacuna').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents();
  if (!it.length) { toast('Select a note or rest first.'); return; }
  const {v, e} = it[0], vi = piece.voices.indexOf(v);
  if (!writable(v)) { refuse(); return; }
  const ext = ensureExt(piece);
  const idx = ext.lacunae.findIndex(l => l.vi === vi && eq(l.t, e.t));
  if (idx >= 0) {
    commit(() => { ext.lacunae.splice(idx, 1); });
    toast('Lacuna removed.');
    return;
  }
  const last = it[it.length - 1].e;
  const d = Math.max(1, rt((last.t + last.d) - e.t));
  const label = prompt('Lacuna label (leave default for [lacuna]):', '[lacuna]');
  if (label === null) return;
  commit(() => { ext.lacunae.push({vi, t: rt(e.t), d, label: label.trim() || '[lacuna]'}); });
  toast('Lacuna marked.');
});
/* Add > Clef change: at the selected note, in the selected voice(s) only, any clef; click it to choose. Again takes it off */
$('#addClef').addEventListener('click', () => {
  if (!piece) return;
  const T = mensTargets();
  if (!T.size) { toast('Select a note first (click it, or put the caret before it); the clef goes there, in that voice.'); return; }
  if ([...T.keys()].some(vi => !writable(piece.voices[vi]))) { refuse(); return; }
  if ([...T.values()].some(t => t < EPS)) { toast('At the very start, click the clef itself to change it.'); return; }
  commit(() => {
    for (const [vi, t] of T) {
      const v = piece.voices[vi], k = v.events.findIndex(e => eq(e.t, t));
      if (k < 0) continue;
      const had = v.clefs.findIndex(m => m.t > EPS && eq(m.t, t));
      if (had >= 0) { v.clefs.splice(had, 1); continue; }
      /* any clef but the one already there; a click on it chooses the right one */
      const cur = clefAt(v, t - 0.01), opts = ['c1', 'c2', 'c3', 'c4', 'f3', 'bass', 'treble', 'treble8'].filter(c => c !== cur);
      v.clefs.push({t, c: CLEF_KERN[opts[Math.floor(Math.random() * opts.length)]], ei: k}); v.clefs.sort((a, b) => a.t - b.t);
    }
  });
});
/* Add > Key signature change: at the selected note, in the selected voice(s) only, one flat more than before (then use the arrows) */
$('#addKey').addEventListener('click', () => {
  if (!piece) return;
  const T = mensTargets();
  if (!T.size) { toast('Select a note first (click it, or put the caret before it); the change goes there, in that voice.'); return; }
  if ([...T.keys()].some(vi => !writable(piece.voices[vi]))) { refuse(); return; }
  if ([...T.values()].some(t => t < EPS)) { toast('At the very start the key signature is the one after the clef: hover it (tap it on a phone) for the arrows.'); return; }
  commit(() => {
    for (const [vi, t] of T) {
      const v = piece.voices[vi], k = v.events.findIndex(e => eq(e.t, t));
      if (k < 0) continue;
      const had = v.keys.findIndex(m => eq(m.t, t));
      if (had >= 0) { v.keys.splice(had, 1); continue; }
      const prev = keyAt(v, t - 0.01), n = fifthsOfAlts(prev);
      v.keys.push({t, alts: altsOfFifths(n > -7 ? n - 1 : n + 1), ei: k}); v.keys.sort((a, b) => a.t - b.t);
    }
  });
});
/* Add > Rehearsal mark: [A], [B], ... over the selected note (a score-wide mark, written as a section line) */
$('#addMark').addEventListener('click', () => {
  if (!piece) return;
  const T = mensTargets(), it = selEvents();
  const t = T.size ? Math.min(...T.values()) : null;
  if (t === null) { toast('Select a note first.'); return; }
  const had = piece.sections.findIndex(x => eq(x.t, t));
  commit(() => {
    if (had >= 0) { piece.sections.splice(had, 1); return; }
    const used = new Set(piece.sections.map(x => x.label));
    let L = ''; for (let i = 0; i < 26 && !L; i++) { const c = String.fromCharCode(65 + i); if (!used.has(c)) L = c; }
    if (!L) L = String(piece.sections.length + 1);
    piece.sections.push({t, label: L}); piece.sections.sort((a, b) => a.t - b.t);
  });
});
/* Add > Staff text: italic text above the staff at time t (e.g. "Prima pars", "Patrem omnipotentem"); stored in piece.sections (!!section:) */
function openStaffText(t, anchorEl){
  if (!piece) return;
  document.querySelectorAll('.sec-ed').forEach(el => el.remove());
  const existing = piece.sections.find(x => eq(x.t, t));
  let target = anchorEl || null;
  if (!target) {
    target = pagesEl.querySelector(`.seclab[data-t="${t}"]`) || pagesEl.querySelector('g.sel') || pagesEl.querySelector('.caret') || pagesEl.querySelector('svg .staff');
  }
  const page = target && target.closest('.page') || pagesEl.querySelector('.page');
  if (!page) return;
  const pr = page.getBoundingClientRect();
  const tr = target ? target.getBoundingClientRect() : pr;
  const x = Math.max(12, Math.min(pr.width - 170, tr.left - pr.left));
  const y = Math.max(8, (anchorEl ? tr.top : tr.top - 30) - pr.top);
  const inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'sec-ed'; inp.autocomplete = 'off';
  inp.placeholder = 'Staff text…';
  inp.value = existing ? existing.label : '';
  inp.style.left = x + 'px'; inp.style.top = y + 'px';
  page.appendChild(inp);
  inp.focus(); inp.select();
  let done = false;
  const close = saveIt => {
    if (done) return; done = true;
    const val = inp.value.replace(/[\r\n\t]+/g, ' ').trim();
    inp.remove();
    if (!saveIt) return;
    const prev = existing ? existing.label : '';
    if (val === prev) return;
    commit(() => {
      const idx = piece.sections.findIndex(x => eq(x.t, t));
      if (!val) { if (idx >= 0) piece.sections.splice(idx, 1); }
      else if (idx >= 0) piece.sections[idx].label = val;
      else { piece.sections.push({t: rt(t), label: val}); piece.sections.sort((a, b) => a.t - b.t); }
    });
  };
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); close(true); } else if (e.key === 'Escape') { e.preventDefault(); close(false); } });
  inp.addEventListener('pointerdown', e => e.stopPropagation());
  inp.addEventListener('click', e => e.stopPropagation());
  inp.addEventListener('blur', () => close(true));
}
$('#addText').addEventListener('click', () => {
  if (!piece) return;
  const t = secTime();
  if (t === null) { toast('Select a note first, or put the caret where the text goes.'); return; }
  openStaffText(t, null);
});
pagesEl.addEventListener('click', e => {
  const el = e.target.closest('.seclab');
  if (!el || !piece) return;
  e.preventDefault(); e.stopPropagation();
  const t = parseFloat(el.dataset.t);
  if (isFinite(t)) openStaffText(t, el);
}, true);
/* Add > Section line (Samuel 2026-11-14): a line through all the staves at a time, independent of the metric
   barlines and of the barline style; stored as a kern barline (=! single, =|| double). Click it: Single, Double, Remove. */
function secTime(){
  const T = mensTargets();
  if (T.size) return Math.min(...T.values());
  if (ed.ins && piece) { const v = piece.voices[ed.ins.vi]; if (v) return caretTime(v); }
  return null;
}
$('#addSec').addEventListener('click', () => {
  if (!piece) return;
  const t = secTime();
  if (t === null) { toast('Select a note first, or put the caret where the line goes.'); return; }
  if (t < EPS || t > piece.end - EPS) { toast('A section line goes between notes, not at the very start or end.'); return; }
  const had = piece.bars.find(b => eq(b.t, t));
  if (had && had.type !== 'single') { toast('There is a section line there already: click it to change it.'); return; }
  commit(() => { if (had) had.type = 'sec'; else { piece.bars.push({t: rt(t), type: 'sec'}); piece.bars.sort((a, b) => a.t - b.t); } });
});
const secMenu = document.createElement('ul');
secMenu.id = 'secMenu'; secMenu.className = 'menu'; secMenu.setAttribute('role', 'listbox'); secMenu.hidden = true;
secMenu.setAttribute('aria-label', 'Section line');
secMenu.innerHTML = '<li role="option" data-s="sec"><svg viewBox="0 0 12 20" aria-hidden="true"><path d="M5.3 1h1.4v18H5.3Z"/></svg><span>Single</span></li>' +
  '<li role="option" data-s="double"><svg viewBox="0 0 12 20" aria-hidden="true"><path d="M3.3 1h1.4v18H3.3ZM7.3 1h1.4v18H7.3Z"/></svg><span>Double</span></li>' +
  '<li role="option" data-s="-" class="mdel"><span>Remove</span></li>';
$('.viewwrap').appendChild(secMenu);
let secAt = null;
pagesEl.addEventListener('click', e => {
  const h = e.target.closest && e.target.closest('.sechit');
  if (!h || !piece) return;
  e.stopImmediatePropagation(); e.preventDefault();
  secAt = +h.dataset.t;
  const br = piece.bars.find(b => eq(b.t, secAt));
  secMenu.querySelectorAll('li[data-s]').forEach(li => li.setAttribute('aria-selected', String(!!br && li.dataset.s === br.type)));
  const wr = $('.viewwrap').getBoundingClientRect();
  secMenu.hidden = false;
  secMenu.style.left = Math.max(4, Math.min(wr.width - secMenu.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  secMenu.style.top = (e.clientY - wr.top + 10) + 'px';
}, true);
secMenu.addEventListener('click', e => {
  const li = e.target.closest('li[data-s]'); if (!li || secAt === null || !piece) return;
  secMenu.hidden = true;
  const t = secAt, k = li.dataset.s;
  if (!piece.voices.every(writable)) { refuse(); return; }
  commit(() => {
    const i = piece.bars.findIndex(b => eq(b.t, t)); if (i < 0) return;
    if (k === '-') piece.bars.splice(i, 1); else piece.bars[i].type = k;
  });
});
document.addEventListener('pointerdown', e => { if (!secMenu.hidden && !e.target.closest('#secMenu') && !e.target.closest('.sechit')) secMenu.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') secMenu.hidden = true; }, true);
function incSync(){ const on = !!(st.inc || {})[pieceKey]; $('#addInc').textContent = on ? 'Remove incipit' : 'Incipit'; }
$('#addInc').addEventListener('click', () => {
  if (!piece || !INC.snap || INC.key !== pieceKey) { toast('Open a score first.'); return; }
  st.inc = st.inc || {}; if (st.inc[pieceKey]) delete st.inc[pieceKey]; else st.inc[pieceKey] = true;
  save(); incSync(); render();
  if (st.inc[pieceKey] && st.view !== 'score') toast('The incipit shows in the Score view.');
});
/* On a touch screen nothing waits for a hover: a tap on the key signature (or on the place for a mensuration sign) shows its arrows or outline, a second tap uses them */
const touchOnly = () => window.matchMedia('(hover:none)').matches;
/* the key signature that showed its arrows when the finger came down (a tap beside it, on the clef, still counts as on it) */
let ksWasOn = null;
document.addEventListener('pointerdown', e => { ksWasOn = pagesEl.querySelector('.keyhit.ks-on'); }, true);
document.addEventListener('pointerdown', e => { if (!e.target.closest || !e.target.closest('.keyhit,.mensadd')) pagesEl.querySelectorAll('.ks-on,.mensadd.on').forEach(g => g.classList.remove('ks-on', 'on')); });
pagesEl.addEventListener('click', e => {
  if (touchOnly() && piece && e.target.closest) {
    let kh = e.target.closest('.keyhit');
    /* the key signature is a small target next to the clef and the mensuration sign: a finger lands on whichever is nearer, so look for a key signature just under the finger */
    if (!kh && !e.target.closest('.ksarr,.mensadd')) for (const q of pagesEl.querySelectorAll('.keyhit')) { const r = q.querySelector('rect').getBoundingClientRect(); if (e.clientX >= r.left - 3 && e.clientX <= r.right + 3 && e.clientY >= r.top && e.clientY <= r.bottom) { kh = q; break; } }
    if (kh && !e.target.closest('.ksarr') && (kh.classList.contains('ks-on') || kh === ksWasOn)) { e.stopImmediatePropagation(); e.preventDefault(); openKeyMenu(+kh.dataset.v, kh.dataset.t !== undefined ? +kh.dataset.t : 0, e); return; }
    if (kh && !e.target.closest('.ksarr')) { const was = kh.classList.contains('ks-on'); pagesEl.querySelectorAll('.ks-on,.mensadd.on').forEach(g => g.classList.remove('ks-on', 'on')); if (!was) kh.classList.add('ks-on'); e.stopImmediatePropagation(); e.preventDefault(); return; }
    const mq = e.target.closest('.mensadd');
    if (mq && !mq.classList.contains('on')) { pagesEl.querySelectorAll('.ks-on,.mensadd.on').forEach(g => g.classList.remove('ks-on', 'on')); mq.classList.add('on'); e.stopImmediatePropagation(); e.preventDefault(); return; }
    const ar = e.target.closest('.ksarr');
    if (ar && !ar.closest('.keyhit').classList.contains('ks-on')) { ar.closest('.keyhit').classList.add('ks-on'); e.stopImmediatePropagation(); e.preventDefault(); return; }
  }
  const ma = e.target.closest && e.target.closest('.mensadd');
  if (ma && piece) { e.stopImmediatePropagation(); e.preventDefault(); if (!writable(piece.voices[+ma.dataset.v])) { refuse(); return; } openMensMenu(+ma.dataset.v, 0, e); return; }
  const mh = e.target.closest && e.target.closest('.menshit');
  if (!mh || !piece) return;
  const g = mh.closest('g[class^="n"]'); const m = g && g.classList[0].match(/^n(\d+)-(\d+)$/);
  if (!m) return;
  e.stopImmediatePropagation(); e.preventDefault();
  openMensMenu(+m[1], +mh.dataset.t, e);
}, true);

/* key signature: one step up (towards sharps) or down (towards flats), in every voice that can be written */
const FLATS = 'beadgcf', SHARPS = 'fcgdaeb';
const fifthsOfAlts = a => { const n = Object.values(a).filter(x => x > 0).length, m = Object.values(a).filter(x => x < 0).length; return n || -m; };
function altsOfFifths(n){ const o = {}; if (n > 0) SHARPS.slice(0, n).split('').forEach(l => { o[l] = 1; }); if (n < 0) FLATS.slice(0, -n).split('').forEach(l => { o[l] = -1; }); return o; }
/* The key signature menu (Samuel 2026-11-14: per voice, like the mensuration sign): a click on a key signature (a
   second tap on a phone) opens it, with All voices | Only this voice on top, then the signatures. The choice of
   scope stays for the arrows too. */
let keyOnly = false;
try { keyOnly = localStorage.getItem(APP.store + ':keyonly') === '1'; } catch (e) {}
const keyMenu = document.createElement('ul');
keyMenu.id = 'keyMenu'; keyMenu.className = 'menu'; keyMenu.setAttribute('role', 'listbox'); keyMenu.hidden = true;
keyMenu.setAttribute('aria-label', 'Key signature');
const KEY_OPTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const keyName = n => n === 0 ? 'None' : Math.abs(n) + (n < 0 ? ' ♭' : ' ♯');
keyMenu.innerHTML = `<li class="flatopt mscope" data-n="" role="presentation"><span class="mslab">Change</span><span class="seg" role="group" aria-label="Which voices the signature changes in"><button type="button" class="tb" data-kscope="all">All voices</button><button type="button" class="tb" data-kscope="one">Only <span class="kvn">this voice</span></button></span></li>` +
  KEY_OPTS.map(n => `<li role="option" data-n="${n}" title="${n === 0 ? 'No sharps or flats' : Math.abs(n) + (n < 0 ? ' flat' : ' sharp') + (Math.abs(n) > 1 ? 's' : '')}"><span>${keyName(n)}</span></li>`).join('');
$('.viewwrap').appendChild(keyMenu);
let keyAtMenu = null;
function keyScopeSync(){ keyMenu.querySelectorAll('[data-kscope]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.kscope === 'one') === keyOnly))); }
function openKeyMenu(vi, t, e){
  const v = piece.voices[vi]; if (!v) return;
  keyAtMenu = {vi, t};
  const mid = t > EPS, cur = fifthsOfAlts(keyAt(v, mid ? t : 0));
  keyMenu.querySelector('.kvn').textContent = v.name || 'this voice';
  /* a change in the middle of the piece belongs to its voice: no scope there */
  keyMenu.querySelector('.mscope').hidden = mid;
  keyScopeSync();
  keyMenu.querySelectorAll('li[data-n]').forEach(li => li.setAttribute('aria-selected', String(li.dataset.n !== '' && +li.dataset.n === cur)));
  const wr = $('.viewwrap').getBoundingClientRect();
  keyMenu.hidden = false; mensMenu.hidden = true; clefPick.hidden = true;
  keyMenu.style.left = Math.max(4, Math.min(wr.width - keyMenu.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  keyMenu.style.top = (e.clientY - wr.top + 10) + 'px';
}
keyMenu.addEventListener('click', e => {
  const sc = e.target.closest('[data-kscope]');
  if (sc) { keyOnly = sc.dataset.kscope === 'one'; try { localStorage.setItem(APP.store + ':keyonly', keyOnly ? '1' : '0'); } catch (err) {} keyScopeSync(); return; }
  const li = e.target.closest('li[data-n]'); if (!li || li.dataset.n === '' || !keyAtMenu || !piece) return;
  keyMenu.hidden = true;
  const {vi, t} = keyAtMenu, v = piece.voices[vi]; if (!v) return;
  const cur = fifthsOfAlts(keyAt(v, t > EPS ? t : 0)), n = +li.dataset.n;
  if (n !== cur) keyStep(vi, n - cur, t > EPS ? t : undefined);
});
document.addEventListener('pointerdown', e => { if (!keyMenu.hidden && !e.target.closest('#keyMenu') && !e.target.closest('.keyhit')) keyMenu.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') keyMenu.hidden = true; }, true);
function keyStep(vi, dir, t){
  const v = piece.voices[vi]; if (!v) return;
  if (!writable(v)) { refuse(); return; }
  const mid = t !== undefined && t > EPS;
  const cur = fifthsOfAlts(keyAt(v, mid ? t : 0));
  const n = Math.max(-7, Math.min(7, cur + dir));
  if (n === cur) return;
  commit(() => {
    if (mid) {
      /* a change in the middle: this voice only; back to what went before, it is no change at all */
      const k = v.keys.find(m => eq(m.t, t));
      if (!k) return;
      k.alts = altsOfFifths(n); delete k.raw;
      const prevAlts = keyAt({keys: v.keys.filter(m => m !== k)}, t - 0.01);
      if (JSON.stringify(prevAlts) === JSON.stringify(k.alts)) v.keys.splice(v.keys.indexOf(k), 1);
      return;
    }
    for (const q of keyOnly ? [v] : piece.voices) {
      if (!writable(q)) continue;
      let k = q.keys.find(m => eq(m.t, 0));
      if (!k) { k = {t: 0, alts: {}, ei: 0}; q.keys.unshift(k); }
      k.alts = altsOfFifths(n); delete k.raw;
    }
  });
  toast((n === 0 ? 'No sharps or flats in the signature' : Math.abs(n) + (n < 0 ? ' flat' : ' sharp') + (Math.abs(n) > 1 ? 's' : '') + ' in the signature') + (mid ? '' : keyOnly ? ', in ' + (v.name || 'this voice') + ' only.' : ', in all voices. Click the signature to change one voice only.'));
}
function divisiTarget(rect, e){
  const tg = staffTarget(rect, e); if (!tg) return null;
  const v = tg.v; if (!v || !v.syms) return null;
  const svg = rect.ownerSVGElement; if (!svg) return null;
  let best = null, bestDx = Infinity;
  const k0 = rect.dataset.k0 !== undefined && rect.dataset.k0 !== '' ? +rect.dataset.k0 : 0;
  const k1 = rect.dataset.k1 !== undefined && rect.dataset.k1 !== '' ? +rect.dataset.k1 : v.syms.length - 1;
  for (let k = k0; k <= k1 && k < v.syms.length; k++) {
    const sym = v.syms[k];
    if (!sym || sym.rest || sym.phantom) continue;
    const g = svg.querySelector('g.' + sym.id);
    if (!g) continue;
    const r = g.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const dx = Math.abs(e.clientX - cx);
    if (dx < bestDx) { bestDx = dx; best = sym; }
  }
  if (best && bestDx <= 46) return {vi: tg.vi, ei: best.src[0], step: tg.step, sym: best};
  if (ed.sel && ed.sel.vi === tg.vi && v.events[ed.sel.ei] && !v.events[ed.sel.ei].rest) {
    return {vi: tg.vi, ei: ed.sel.ei, step: tg.step, sym: selSym()};
  }
  return null;
}
function toggleDivisiNote(vi, ei, step){
  const v0 = piece && piece.voices[vi];
  if (!v0 || !v0.events[ei] || v0.events[ei].rest) return false;
  clearGhost(); ed.range = null; ed.picks = null;
  const arm = ed.accArm, armEd = !!ed.accEd;
  commit(() => {
    const ev = piece.voices[vi].events[ei];
    if (!ev || ev.rest) return;
    if (!Array.isArray(ev.chord)) ev.chord = [];
    if (step === ev.step) {
      if (ev.chord.length) { const nxt = ev.chord.shift(); ev.step = nxt.step; ev.alt = nxt.alt; ev.ed = nxt.ed; }
    } else {
      const idx = ev.chord.findIndex(c => c.step === step);
      if (idx >= 0) ev.chord.splice(idx, 1);
      else { ev.chord.push({step, alt: arm, ed: armEd}); ev.chord.sort((a, b) => a.step - b.step); }
    }
    if (!ev.chord.length) delete ev.chord;
  });
  ed.accArm = null; ed.accEd = false;
  ed.sel = {vi, ei}; ed.ins = {vi, ei: ei + 1};
  hear(step, arm);
  showSel(); syncEdit();
  return true;
}
pagesEl.addEventListener('click', e => {
  const ka = e.target.closest && e.target.closest('.ksarr');
  if (ka && piece && window.matchMedia('(hover:none)').matches && !ka.closest('.keyhit').classList.contains('ks-on')) { e.stopImmediatePropagation(); e.preventDefault(); pagesEl.querySelectorAll('.ks-on,.mensadd.on').forEach(g => g.classList.remove('ks-on', 'on')); ka.closest('.keyhit').classList.add('ks-on'); return; }
  if (ka && piece) { e.stopImmediatePropagation(); e.preventDefault(); const kh = ka.closest('.keyhit'); keyStep(+kh.dataset.v, +ka.dataset.ks, kh.dataset.t !== undefined ? +kh.dataset.t : undefined); return; }
  const kh = e.target.closest && e.target.closest('.keyhit');
  if (kh && piece) { e.stopImmediatePropagation(); e.preventDefault(); openKeyMenu(+kh.dataset.v, kh.dataset.t !== undefined ? +kh.dataset.t : 0, e); return; }
  const ch = e.target.closest && e.target.closest('.clefhit');
  if (ch && piece) { e.stopImmediatePropagation(); openClefPick(+ch.dataset.v, e, ch.dataset.t !== undefined ? +ch.dataset.t : undefined); return; }
  /* Divisi mode: clicking anywhere in the horizontal zone of a note (or on the selected note's staff) stacks/toggles that pitch */
  if (ed.on && ed.divisi && piece && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const rDiv = stafFor(e.target) || (e.target.closest && e.target.closest('svg') && [...e.target.closest('svg').querySelectorAll('rect.stafhit')].find(r => { const b = r.getBoundingClientRect(); return e.clientY >= b.top - 24 && e.clientY <= b.bottom + 24 && e.clientX >= b.left && e.clientX <= b.right; }));
    if (rDiv) {
      const dt = divisiTarget(rDiv, e);
      if (dt) { e.stopImmediatePropagation(); toggleDivisiNote(dt.vi, dt.ei, dt.step); return; }
    }
  }
  /* a click on a note selects it, in any mode (the staff's writing area lies over the notes: look underneath it too) */
  if (typeof noteAt === 'function') {
    const n = noteAt(e);
    if (n && e.shiftKey && (ed.sel || ed.range || ed.picks)) { e.stopImmediatePropagation(); extendRange(n.vi, n.s); return; }
    if (n && (e.ctrlKey || e.metaKey) && (ed.sel || ed.range || ed.picks)) { e.stopImmediatePropagation(); togglePick(n.vi, n.s); return; }
    /* Alt-click: what was copied is pasted there */
    if (n && e.altKey && ed.on) { e.stopImmediatePropagation(); ed.range = null; ed.picks = null; ed.sel = {vi: n.vi, ei: n.s.src[0]}; ed.ins = {vi: n.vi, ei: n.s.src[n.s.src.length - 1] + 1}; rangePaste(); return; }
    const off = ed.on && n && !e.shiftKey ? offPitch(n, e) : null;
    if (n && (!ed.on || !n.s.rest || e.shiftKey) && !off && !(ed.on && ed.divisi && !e.shiftKey && !n.s.rest && n.s.chord && n.s.chord.length)) {
      e.stopImmediatePropagation();
      ed.range = null; ed.picks = null;
      if (n.s.rest) n.s = pickRest(n.vi, n.s);
      ed.sel = {vi: n.vi, ei: n.s.src[0]}; ed.ins = {vi: n.vi, ei: n.s.src[n.s.src.length - 1] + 1};
      if (!n.s.rest) hear(n.s.step, n.s.alt);
      showSel(); return;
    }
  }
  /* outside note input a click on a staff selects it, even an empty one: the keyboard (its pitch dot and its notes) then goes to that staff */
  if (!ed.on && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && piece) {
    const r0 = e.target.closest && e.target.closest('rect.stafhit');
    if (r0) {
      const tg = staffTarget(r0, e);
      if (tg) {
        const {at} = eventIndexFor(tg);
        ed.range = null; ed.picks = null; ed.sel = null; ed.ins = {vi: tg.vi, ei: at, off: 0, pad: 0};
        showSel(); syncEdit();
      }
    }
  }
  const offN = ed.on && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey ? offPitch(noteAt(e), e) : null;
  const rect = offN ? offN.rect : ed.on && !e.shiftKey ? stafFor(e.target) : null;
  if (rect) {
    e.stopImmediatePropagation();
    if (ed.layer2) {
      const pvi = parentOf(+rect.dataset.v);
      if (!subVoiceOf(pvi)) ensureSubVoice(pvi);
    }
    const tg = offN ? offN.tg : staffTarget(rect, e); if (!tg) return;
    if (ed.layer2 && !isLayer2Voice(tg.vi)) {
      const sub = subVoiceOf(parentOf(tg.vi));
      if (sub) { tg.vi = sub.idx; tg.v = sub; }
    }
    clearGhost(); ed.range = null; ed.picks = null;
    const tp = timePlace(rect, tg);
    if (tp) {
      const v = tg.v;
      if (tp.ei >= 0) { ed.sel = null; ed.ins = {vi: tg.vi, ei: tp.ei, off: rt(tp.T - v.events[tp.ei].t)}; insertEvent(tg.vi, tp.ei, tg.step, ed.inRest); }
      else insertEvent(tg.vi, v.events.length, tg.step, ed.inRest, rt(tp.T - v.end));
      return;
    }
    const {at} = eventIndexFor(tg);
    insertEvent(tg.vi, at, tg.step, ed.inRest);
  }
}, true);
const STEP_MIN = 7, STEP_MAX = 55;
const clampStep = s => Math.max(STEP_MIN, Math.min(STEP_MAX, Math.round(s)));
const ACC_ALT = {b: -1, n: 0, '#': 1}, ACC_OF = {fl: 'b', na: 'n', sh: '#'};
const valKey = s => VALS.some(x => x[0] === s.g) ? s.g : 'S';
const accOf = s => ACC_OF[s.acc] || ACC_OF[s.edAcc] || '';
/* is this note coloured: as the white notation would draw it, whichever notation is on (Modern draws no coloration) */
function isColoured(s){
  if (!s || s.rest || !piece) return false;
  if (st.nota === 'real') return !!s.col;
  const v = piece.voices.find(q => q.syms && q.syms.includes(s)); if (!v) return !!s.col;
  const e = v.events[s.src[0]]; if (!e) return false;
  if (e.colH) return true;
  const total = s.src.reduce((a, i) => a + v.events[i].d, 0), mi = mensInfo(metAt(v, e.t)), sh = shapeReal(rt(total * mi.p), mi.T, mi.P, mi.M, mi.X);
  return !!(sh && sh.col);
}
function hear(step, alt){
  if (st.audition === false || play || step === null || step === undefined) return;
  if (alt === null || alt === undefined) { const v = anyVoice() || (piece && piece.voices[0]); alt = v ? implied(v, step, 0) : 0; }   /* as the key signature has it */
  const at = ed.sel || ed.ins, o = at && piece && piece.voices[at.vi] ? vis(at.vi) : null;
  Organ.audition(midiOf({step, alt}), undefined, o ? mixReg(o) : undefined);
}
function symAt(vi, ei){
  const v = piece && piece.voices[vi];
  return v && v.syms ? v.syms.find(q => q.src && q.src.includes(ei)) || null : null;
}
/* the note the arrows, accidentals, dot and Delete act on: the selected one, or else the one just entered */
function targetSym(){
  if (ed.sel) return selSym();
  if (ed.ins && ed.ins.off > EPS) return symAt(ed.ins.vi, ed.ins.ei);
  if (ed.ins && ed.ins.ei > 0) return symAt(ed.ins.vi, ed.ins.ei - 1);
  return null;
}
/* what a flat, sharp, natural, dot or Ed. acts on (as in Dorico): the selected note; with note input and no selection, the note
   under the caret (a rest does not count); else nothing, and the next note written takes it */
function accTarget(){
  if (ed.sel) return selSym();
  if (ed.on && ed.ins && !ed.range && !ed.picks) {
    const v = piece && piece.voices[ed.ins.vi];
    if (v && ed.ins.ei < v.events.length) { const q = symAt(ed.ins.vi, ed.ins.ei); return q && !q.rest ? q : null; }
  }
  return null;
}
/* the value a note or rest can take, one shape each (no ties), in the mensuration where it stands: [d ...] from the shortest up.
   A note: plain values, and dotted ones where the sign allows (minima, dotted minima, semibrevis, dotted semibrevis, brevis ...);
   a rest has no dot. Coloration is its own button, so coloured shapes are not on the ladder. */
function valueLadder(v, t, rest){
  const out = new Set();
  if (mensRulesOn()) {
    /* the shapes (how long each sounds is counted by the rules): a dot only where the level is imperfect */
    const mi = mensInfo(metAt(v, t));
    for (const [g, w] of valueTable(mi.T, mi.P, mi.M, mi.X)) {
      out.add(rt(w / mi.p));
      const perfectLevel = (g === 'B' && mi.T === 3) || (g === 'S' && mi.P === 3);
      if (!rest && !perfectLevel) out.add(rt(w * 1.5 / mi.p));
    }
  } else if (notaNow() === 'fake') {
    const mi = mensInfo(metAt(v, t));
    for (const [, val] of VALS) { out.add(rt(val / mi.p)); if (!rest) out.add(rt(val * 1.5 / mi.p)); }
  } else {
    const mi = mensInfo(metAt(v, t)), tab = valueTable(mi.T, mi.P, mi.M, mi.X), S = tab[3][1];
    const cand = [];
    for (const [, val] of tab) { cand.push(val); if (!rest) cand.push(val * 1.5); }
    if (!rest) { if (mi.T === 3) cand.push(2 * S); if (mi.P === 3) cand.push(1); }
    for (const w of cand) { const sh = shapeReal(rt(w), mi.T, mi.P, mi.M, mi.X); if (sh && !sh.col) out.add(rt(w / mi.p)); }
  }
  return [...out].sort((a, b) => a - b);
}
/* Cmd+Shift+Right and Left: the selected note or rest (or the one under the caret) takes the next longer or shorter value */
function stretch(dir){
  if (!piece) return;
  const s = ed.sel ? selSym() : (ed.on && ed.ins && !ed.range && !ed.picks ? symAt(ed.ins.vi, ed.ins.ei) : null);
  if (!s) return;
  const vi = ed.sel ? ed.sel.vi : ed.ins.vi, v = piece.voices[vi];
  if (!v || !writable(v)) { refuse(); return; }
  const src = s.src, first = src[0];
  let total = rt(src.reduce((a, i) => a + v.events[i].d, 0));
  /* under the rules the note is its shape (an imperfect breve is a breve): the steps start from the shape's own length */
  if (mensRulesOn()) { const mi = mensInfo(metAt(v, v.events[first].t)), sh = shapeOfEvent(Object.assign({}, v.events[first], {d: total}), mi); if (sh) total = rt(nomW(sh.g, mi.T, mi.P, mi.M, mi.X) * (sh.dot ? 1.5 : 1) / mi.p); }
  const ladder = valueLadder(v, v.events[first].t, s.rest);
  const nx = dir > 0 ? ladder.find(d => d > total + EPS) : ladder.slice().reverse().find(d => d < total - EPS);
  if (nx === undefined) { toast(dir > 0 ? 'That is the longest value there is.' : 'That is the shortest value there is.'); return; }
  commit(() => {
    const e = v.events[first];
    e.d = nx; e.tieStart = e.tieEnd = e.tieMid = false; e.long = false; e.colH = false; e.altd = false;
    dropEvents(v, src.slice(1));
    if (ed.ovr) ovrResize(v, first, total);
  });
  const q = ed.sel ? selSym() : null;
  if (q) ed.val = valKey(q);
  showSel(true); syncEdit();
}
function insertionIndex(v){
  const s = selSym();
  /* Overwrite starts on the selected note, Insert after it */
  if (s) return ed.ovr ? s.src[0] : s.src[s.src.length - 1] + 1;
  return ed.ins ? Math.min(ed.ins.ei, v.events.length) : v.events.length;
}
/* empty space the caret stands in, past the end of the voice: a rest fills up to it */
function caretPad(v, idx){ return !ed.sel && ed.ins && ed.ins.vi === v.idx && idx >= v.events.length && ed.ins.pad > EPS ? ed.ins.pad : 0; }
function refStepBefore(v, idx){
  for (let i = Math.min(idx, v.events.length) - 1; i >= 0; i--) if (!v.events[i].rest) return v.events[i].step;
  for (let i = idx; i < v.events.length; i++) if (!v.events[i].rest) return v.events[i].step;
  return CLEFS[v.clef || 'c3'].bottom + 4;
}
/* a pitch change keeps a written sharp or flat, and follows the signature otherwise */
function moveStep(v, e, s){
  const followed = (e.alt || 0) === (implied(v, e.step, e.t) || 0);
  e.step = s; e.ed = false;
  if (followed) e.alt = implied(v, s, e.t);
}
function toRestOrRemove(vi, s){
  const v = piece.voices[vi];
  if (s.rest) commit(() => { dropEvents(v, s.src); ed.sel = null; ed.ins = {vi, ei: s.src[0]}; });
  else commit(() => { for (const i of s.src) { const e = v.events[i]; e.rest = true; e.tieStart = e.tieEnd = e.tieMid = false; } ed.sel = null; ed.ins = {vi, ei: s.src[s.src.length - 1] + 1}; });
}
/* A range: Shift-click a second note while one is selected and everything between the two is selected, in all the
   voices between them, from the earlier start to the later end (ed.range {v0, v1, t0, t1, a: the anchor}). The
   arrows, Delete, Transform, dragging and copy/cut/paste then act on the whole range. */
function rangeVoices(){ const R = ed.range; if (!R || !piece) return []; const o = []; for (let i = R.v0; i <= R.v1; i++) if (piece.voices[i]) o.push(piece.voices[i]); return o; }
const inRange = (t) => t >= ed.range.t0 - EPS && t < ed.range.t1 - EPS;
function rangeEvents(v){ return ed.range ? v.events.filter(e => inRange(e.t)) : []; }
function extendRange(vi, s){
  if (ed.picks) pickToRange();
  let a = ed.range ? ed.range.a : null;
  if (!a) { const q = selSym(); if (!q) return; a = {vi: ed.sel.vi, t: q.t, te: rt(q.t + q.d)}; }
  ed.range = {a, v0: Math.min(a.vi, vi), v1: Math.max(a.vi, vi), t0: Math.min(a.t, s.t), t1: Math.max(a.te, rt(s.t + s.d)), f: {vi, t: s.t, te: rt(s.t + s.d)}};
  ed.sel = null; ed.ins = null; ed.picks = null;
  showSel();
}
function inSel(vi, q){
  if (ed.range) return vi >= ed.range.v0 && vi <= ed.range.v1 && inRange(q.t);
  if (ed.picks) return ed.picks.some(p => p.vi === vi && Math.abs(p.t - q.t) < EPS);
  return false;
}
function clearRange(){ if (ed.range) { ed.range = null; return true; } return false; }
/* Ctrl/Cmd-click adds single notes to the selection (ed.picks [{vi, t}], not a range); copying or moving them takes
   the passage from the first to the last */
function selItems(){
  if (!piece) return [];
  if (ed.range) return rangeVoices().flatMap(v => rangeEvents(v).map(e => ({v, e})));
  /* a picked note or rest is everything written for it (a long rest can be several rests in the file) */
  if (ed.picks) return ed.picks.flatMap(p => {
    const v = piece.voices[p.vi]; if (!v) return [];
    const q = (v.syms || []).find(q => q.src && Math.abs(q.t - p.t) < EPS);
    if (q) return q.src.map(i => v.events[i]).filter(Boolean).map(e => ({v, e}));
    const e = v.events.find(q => Math.abs(q.t - p.t) < EPS); return e ? [{v, e}] : [];
  });
  return [];
}
function pickToRange(){
  if (!ed.picks || !piece) return;
  const it = selItems(); ed.picks = null;
  if (!it.length) return;
  const vis = it.map(x => x.v.idx), t0 = Math.min(...it.map(x => x.e.t)), t1 = Math.max(...it.map(x => rt(x.e.t + x.e.d)));
  ed.range = {a: {vi: Math.min(...vis), t: t0, te: t1}, v0: Math.min(...vis), v1: Math.max(...vis), t0, t1};
}
function togglePick(vi, s){
  const cur = ed.picks ? ed.picks.slice() : ed.range ? selItems().map(x => ({vi: x.v.idx, t: x.e.t})) : [];
  if (!ed.picks && !ed.range && ed.sel) { const q = selSym(); if (q) cur.push({vi: ed.sel.vi, t: q.t}); }
  const k = cur.findIndex(p => p.vi === vi && Math.abs(p.t - s.t) < EPS);
  if (k >= 0) cur.splice(k, 1); else cur.push({vi, t: s.t});
  ed.range = null; ed.sel = null; ed.ins = null;
  ed.picks = cur.length ? cur : null;
  if (!s.rest && k < 0) hear(s.step, s.alt);
  showSel();
}
/* the selection as a span: a range, the picked notes' passage, or the one selected note */
function selSpan(){
  if (ed.range) return ed.range;
  if (ed.picks) { pickToRange(); return ed.range; }
  const q = selSym(); if (!q) return null;
  return {a: {vi: ed.sel.vi, t: q.t, te: rt(q.t + q.d)}, v0: ed.sel.vi, v1: ed.sel.vi, t0: q.t, t1: rt(q.t + q.d), one: true};
}
/* Alt (or Ctrl/Cmd) with Left/Right: the selection moves on the grid of the chosen value; what it leaves becomes rest,
   what it lands on is written over (as Dorico does) */
function moveSelection(dir){
  const R = selSpan(); if (!R) return;
  const vs = []; for (let i = R.v0; i <= R.v1; i++) if (piece.voices[i]) vs.push(piece.voices[i]);
  if (!vs.every(writable)) { refuse(); return; }
  const g = navGrid(vs[0], R.t0);
  const len = rt(R.t1 - R.t0), T = rt(R.t0 + dir * g);
  if (T < -EPS) return;
  const vi0 = R.one ? ed.sel.vi : null;
  commit(() => {
    for (const v of vs) {
      const list = spanCopy(v, R.t0, R.t1);
      overwriteSpan(v, R.t0, len, []);
      overwriteSpan(v, T, len, list);
    }
  });
  if (R.one) {
    const v = piece.voices[vi0], ei = v.events.findIndex(e => Math.abs(e.t - T) < EPS);
    if (ei >= 0) { ed.sel = {vi: vi0, ei}; ed.ins = {vi: vi0, ei: ei + 1}; }
    ed.range = null;
  } else ed.range = Object.assign({}, R, {a: {vi: R.a.vi, t: rt(R.a.t + dir * g), te: rt(R.a.te + dir * g)}, t0: T, t1: rt(T + len), f: R.f && {vi: R.f.vi, t: rt(R.f.t + dir * g), te: rt(R.f.te + dir * g)}});
  showSel(true);
  const q = selSym(); if (q && !q.rest) hear(q.step, q.alt);
}
/* Shift with the arrows: the selection grows (or shrinks) from its far end, by a note, or to the staff above or below */
function extendBy(key){
  if (!piece) return false;
  pickToRange();
  let f;
  if (ed.range) f = ed.range.f || {vi: ed.range.a.vi === ed.range.v0 ? ed.range.v1 : ed.range.v0, t: ed.range.a.t <= ed.range.t0 + EPS ? ed.range.t1 : ed.range.t0, te: ed.range.t1};
  else { const q = selSym(); if (!q) return false; f = {vi: ed.sel.vi, t: q.t, te: rt(q.t + q.d)}; }
  const symsOf = vi => (piece.voices[vi] && piece.voices[vi].syms || []).filter(q => q.src);
  let vi = f.vi, s = null;
  if (key === 'ArrowRight') s = symsOf(vi).find(q => q.t >= f.te - EPS);
  else if (key === 'ArrowLeft') s = symsOf(vi).filter(q => q.t < f.t - EPS).pop();
  else {
    vi += key === 'ArrowDown' ? 1 : -1;
    if (vi < 0 || vi >= piece.voices.length) return true;
    const L = symsOf(vi); s = L.find(q => f.t >= q.t - EPS && f.t < q.t + q.d - EPS) || L[L.length - 1];
  }
  if (!s) return true;
  extendRange(vi, s);
  return true;
}
/* Ctrl/Cmd with Up/Down and only the cursor: the cursor goes to the staff above or below, at the same time */
function caretStaff(dir){
  if (!piece || !ed.ins) return false;
  const v = piece.voices[ed.ins.vi], w = piece.voices[ed.ins.vi + dir]; if (!v || !w) return true;
  const T = caretTime(v);
  let ei = w.events.length, off = 0;
  for (let i = 0; i < w.events.length; i++) { const e = w.events[i]; if (T < e.t + e.d - EPS) { ei = i; off = rt(T - e.t); if (off < EPS) off = 0; break; } }
  ed.ins = {vi: w.idx, ei, off};
  showSel(true);
  return true;
}
function rangeStep(d){
  const it = selItems().filter(x => writable(x.v) && !x.e.rest); if (!it.length) { if (selItems().length) refuse(); return; }
  if (it.some(x => x.e.step + d < STEP_MIN || x.e.step + d > STEP_MAX)) return;
  commit(() => { for (const x of it) moveStep(x.v, x.e, x.e.step + d); });
  if (it.length && ed.picks) hear(it[0].e.step, it[0].e.alt);
}
/* Delete (and cut): the notes become rests, so the voices stay in step */
/* Delete on a selection of several notes and rests (a range, or Ctrl/Cmd-clicked ones, in any voices): the notes
   become rests first, so the voices stay in step; when only rests are selected they are removed, and in each voice
   the music after them moves up (Samuel 2026-11-14). One undo step either way. */
function rangeClear(cut){
  const it = selItems().filter(x => writable(x.v)); if (!it.length) { refuse(); return; }
  if (!cut && it.every(x => x.e.rest)) {
    const by = new Map();
    for (const {v, e} of it) { const i = v.events.indexOf(e); if (i >= 0) { if (!by.has(v)) by.set(v, []); by.get(v).push(i); } }
    const first = it.reduce((a, x) => !a || x.e.t < a.e.t ? x : a, null), vi = first.v.idx, ei = first.v.events.indexOf(first.e);
    commit(() => { for (const [v, list] of by) dropEvents(v, list); ed.range = null; ed.picks = null; ed.sel = null; ed.ins = {vi, ei, off: 0, pad: 0}; });
    showSel();
    return;
  }
  commit(() => { for (const {e} of it) { e.rest = true; e.tieStart = e.tieEnd = e.tieMid = false; e.syl = []; e.lig = 0; e.alt = null; e.ed = false; e.long = false; } });
}
/* the clipboard: per voice, the events from the start of the range (times relative), kept in localStorage so a passage
   can be pasted into another score or another of the apps */
const CLIP_KEY = 'scriptorium:clip';
/* the events of [t0, t1) of voice v, times from t0 */
function spanCopy(v, t0, t1){
  const list = v.events.filter(e => e.t >= t0 - EPS && e.t < t1 - EPS).map(e => {
    const c = JSON.parse(JSON.stringify(e)); c.t = rt(e.t - t0);
    /* a note that runs past the end of the span is cut there */
    if (e.t + e.d > t1 + EPS) { c.d = rt(t1 - e.t); c.tieStart = c.tieMid = false; }
    c.kd = c.d; return c;
  });
  /* a voice whose note began before the span starts it with a rest; ties don't reach out of the passage */
  if (list.length && list[0].t > EPS) list.unshift({d: list[0].t, kd: list[0].t, rest: true, alt: null, ed: false, syl: [], t: 0});
  const a = list[0], z = list[list.length - 1];
  if (a) { if (a.tieMid) { a.tieMid = false; a.tieStart = true; } a.tieEnd = false; }
  if (z) { if (z.tieMid) { z.tieMid = false; z.tieEnd = true; } z.tieStart = false; }
  return list;
}
function rangeCopy(){
  pickToRange();
  const R = ed.range; if (!R) return false;
  const voices = rangeVoices().map(v => spanCopy(v, R.t0, R.t1));
  const clip = {voices, len: rt(R.t1 - R.t0)};
  try { localStorage.setItem(CLIP_KEY, JSON.stringify(clip)); } catch (e) {}
  ed.clip = clip;
  toast('Copied ' + (voices.length > 1 ? voices.length + ' voices' : 'the passage') + '. Select a note (or put the cursor) where it should go and press ' + (/Mac|iP/.test(navigator.platform) ? '⌘' : 'Ctrl') + '+V.');
  return true;
}
/* write the events `list` (times from 0, length len) over [T, T + len) of voice v: what stood there goes; a note that
   began before T is cut at T, the part of a note after T + len becomes a rest */
function overwriteSpan(v, T, len, list){
  const T2 = rt(T + len);
  const fix = arr => { for (const m of arr) m.ei = Math.min(m.ei, v.events.length); };
  /* pad the voice with rests up to T */
  if (v.end < T - EPS) { v.events.push({d: rt(T - v.end), kd: rt(T - v.end), rest: true, alt: null, ed: false, syl: [], t: v.end}); retime(v); }
  const split = (at) => {
    const i = v.events.findIndex(e => at > e.t + EPS && at < e.t + e.d - EPS);
    if (i < 0) return null;
    const a = v.events[i], off = rt(at - a.t);
    const b = Object.assign({}, a, {d: rt(a.d - off), kd: rt(a.d - off), t: rt(at), syl: [], ferm: false});
    b.tieEnd = b.tieMid = false; b.tieStart = !!(a.tieStart || a.tieMid);
    a.d = rt(off); a.kd = a.d; a.long = false; a.ferm = false;
    if (a.tieMid) { a.tieMid = false; a.tieEnd = true; } else a.tieStart = false;
    v.events.splice(i + 1, 0, b);
    for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > i) m.ei++;
    return b;
  };
  split(T);
  const cut = split(T2);
  let i0 = v.events.findIndex(e => e.t >= T - EPS); if (i0 < 0) i0 = v.events.length;
  let i1 = i0; while (i1 < v.events.length && v.events[i1].t < T2 - EPS) i1++;
  /* after the span: the rest of a note cut at its end becomes a rest; a tie coming in from the span is gone */
  const after = v.events[i1];
  if (after && after === cut && !after.rest) {
    const nx = v.events[i1 + 1];
    if (after.tieStart && nx) { if (nx.tieMid) { nx.tieMid = false; nx.tieStart = true; } nx.tieEnd = false; }
    after.rest = true; after.tieStart = after.tieEnd = after.tieMid = false; after.alt = null; after.ed = false; after.lig = 0; }
  else if (after) { if (after.tieMid) { after.tieMid = false; after.tieStart = true; } after.tieEnd = false; }
  if (i0 > 0) { const p = v.events[i0 - 1]; if (p.tieStart || p.tieMid) { if (p.tieMid) { p.tieMid = false; p.tieEnd = true; } else p.tieStart = false; } }
  /* ligature numbers of the pasted notes: new ones, so they don't join this voice's */
  const base = Math.max(0, ...v.events.map(e => e.lig || 0)), map = {};
  const ins = list.map(e => { const c = JSON.parse(JSON.stringify(e)); if (c.lig) c.lig = map[c.lig] || (map[c.lig] = base + Object.keys(map).length + 1); return c; });
  const covered = ins.reduce((a, e) => rt(a + e.d), 0);
  if (covered < len - EPS) ins.push({d: rt(len - covered), kd: rt(len - covered), rest: true, alt: null, ed: false, syl: []});
  v.events.splice(i0, i1 - i0, ...ins);
  const dn = ins.length - (i1 - i0);
  for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei >= i1) m.ei += dn; else if (m.ei > i0) m.ei = i0;
  fix(v.mets); fix(v.keys); fix(v.clefs);
  retime(v);
}
function rangePaste(){
  pickToRange();
  let clip = ed.clip;
  try { const c = JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); if (c && c.voices) clip = c; } catch (e) {}
  if (!clip || !clip.voices || !clip.voices.length || !piece) { toast('Nothing copied yet: Shift-click to select a passage, then ' + (/Mac|iP/.test(navigator.platform) ? '⌘' : 'Ctrl') + '+C.'); return; }
  /* where: the start of the range, the selected note, or the cursor */
  let vi, T;
  if (ed.range) { vi = ed.range.v0; T = ed.range.t0; }
  else if (ed.sel) { const q = selSym(); if (!q) return; vi = ed.sel.vi; T = q.t; }
  else if (ed.ins) { vi = ed.ins.vi; T = caretTime(piece.voices[vi]); }
  else { toast('Select a note, or put the cursor, where the passage should go.'); return; }
  const targets = clip.voices.map((list, j) => [piece.voices[vi + j], list]).filter(([v]) => v && writable(v));
  if (!targets.length) { refuse(); return; }
  commit(() => { for (const [v, list] of targets) overwriteSpan(v, T, clip.len, list); });
  const n = targets.length;
  ed.range = {a: {vi, t: T, te: rt(T + clip.len)}, v0: vi, v1: vi + n - 1, t0: T, t1: rt(T + clip.len)};
  ed.sel = null; ed.ins = null;
  showSel();
  if (clip.voices.length > n) toast('There were not enough voices below for all of it: ' + n + ' of ' + clip.voices.length + ' pasted.');
}
document.addEventListener('keydown', e => {
  const t = e.target, tag = t.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t.isContentEditable || !piece) return;
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'c' && (ed.range || ed.picks)) { if (window.getSelection && String(window.getSelection())) return; e.preventDefault(); rangeCopy(); }
  else if (k === 'x' && (ed.range || ed.picks)) { e.preventDefault(); if (rangeCopy()) rangeClear(true); }
  else if (k === 'v' && (ed.on || ed.sel || ed.range || ed.picks)) { e.preventDefault(); rangePaste(); }
  else if (k === 'a') {
    /* select all: every voice, start to end */
    e.preventDefault();
    const end = Math.max(...piece.voices.map(v => v.end)); if (!(end > 0)) return;
    ed.range = {a: {vi: 0, t: 0, te: end}, v0: 0, v1: piece.voices.length - 1, t0: 0, t1: end}; ed.sel = null; ed.ins = null; showSel();
  }
});

/* is everything selected one ligature already (the Ligature button shows pressed) */
function ligSelOn(){
  if (ed.range || ed.picks) { const it = selItems().filter(x => !x.e.rest); return it.length > 1 && it.every(x => x.e.lig && x.e.lig === it[0].e.lig && x.v === it[0].v); }
  const t = targetSym(); return !!(t && !t.rest && t.lig);
}
/* what the shared note-input tools (shared/note-input.js) need from this app */
const CBA = {
  edit: () => ed.on,
  /* Escape leaves note input (the selection stays, so Delete still works on it) */
  exitEdit(){ if (ed.on) setEdit(false); },
  /* Delete and Backspace also work outside note input, on what is selected (a note, a rest, a range) */
  canDelete: () => !!(ed.on || ed.sel || ed.range || ed.picks),
  guard(){ return H.guard ? H.guard() : true; },
  hasSel: () => !!(ed.sel || ed.range || ed.picks),
  toggleEdit(){ if (piece) setEdit(!ed.on); },
  state(){
    const s = selSym(), t = targetSym(), v = curVoice(), ta = accTarget();
    return {selected: !!s, signSel: mensOpen(), dur: s ? valKey(s) : ed.val, rest: s ? s.rest : ed.inRest,
      acc: ta && {r: ta.rest, a: accOf(ta), p: !!(ta.dot && !ta.dd), pd: !!ta.dd, ed: !!ta.edAcc}, canAcc: !!(ed.on || ed.sel || ed.range || ed.picks), armAcc: ed.accArm || '', armDot: ed.dotArm === true || ed.dotArm === 'add', armDiv: ed.dotArm === 'div',
      target: t && {r: t.rest, a: accOf(t), p: !!(t.dot && !t.dd), pd: !!t.dd, ed: !!t.edAcc, lig: !!t.lig}, ligOn: ligSelOn(), edArm: !!ed.edArm, ovr: !!ed.ovr,
      col: s && !s.rest ? isColoured(s) : !!ed.colArm, canUndo: ed.undo.length > 0, canRedo: ed.redo.length > 0,
      hasNotes: !!(piece && piece.voices.length), durs: ed.range || ed.picks ? ['B'] : xfVoices().flatMap(q => q.syms ? q.syms.map(valKey) : []), range: !!(ed.range || ed.picks)};
  },
  setDur(k){
    ed.val = k;
    if (selSym()) OPS.value(k);
    else { ed.inRest = false; syncEdit(); }
  },
  setRestMode(rest){
    ed.inRest = rest;
    const s = selSym();
    if (s && s.rest !== rest) OPS.rest(); else syncEdit();
  },
  toggleAcc(a){
    if (!CBA.guard()) return;
    /* as in the 16th century a sharp sign raises the note a semitone from where it stands, a flat sign lowers it: a flat in the signature plus a sharp makes a natural, a sharp plus a flat makes a natural (never a double sign) */
    const to = (v, e) => {
      const cur = e.alt !== null && e.alt !== undefined ? e.alt : (implied(v, e.step, e.t) || 0);
      return a === 'n' ? 0 : a === '#' ? Math.min(1, cur + 1) : Math.max(-1, cur - 1);
    };
    /* several notes selected: all of them (all of them already have it: it comes off) */
    if (ed.range || ed.picks) {
      const it = selItems().filter(x => writable(x.v) && !x.e.rest); if (!it.length) return;
      const has = x => { const q = symAt(x.v.idx, x.v.events.indexOf(x.e)); return !!q && accOf(q) === a; };
      const off = it.every(has), edit = !!ed.edArm && !off; ed.edArm = false;
      commit(() => { for (const x of it) { x.e.alt = off ? implied(x.v, x.e.step, x.e.t) : to(x.v, x.e); x.e.ed = edit; } });
      return;
    }
    const t = accTarget(), v = curVoice();
    if (!t) {
      /* nothing selected and nothing under the caret: the next note written takes it (pressing it again takes it back) */
      if (!ed.on) return;
      ed.accEd = !!ed.edArm && ed.accArm !== a; ed.edArm = false;
      ed.accArm = ed.accArm === a ? null : a;
      syncEdit();
      return;
    }
    if (t.rest || !v) return;
    const off = accOf(t) === a;
    const edit = !!ed.edArm && !off; ed.edArm = false;
    commit(() => { for (const i of t.src) {
      const e = v.events[i], cur = e.alt !== null && e.alt !== undefined ? e.alt : (implied(v, e.step, e.t) || 0);
      e.alt = off || (a !== 'n' && to(v, e) === cur && e.alt !== null && e.alt !== undefined) ? implied(v, e.step, e.t) : to(v, e); e.ed = edit;
    } });
    const e = curVoice().events[t.src[0]]; if (e) hear(e.step, e.alt);
  },
  /* Ed.: the selected note's accidental becomes editorial (or written again); with none, the next accidental entered is editorial */
  toggleEd(){
    if (!CBA.guard()) return;
    const t = accTarget(), v = curVoice();
    if (t && !t.rest && v && accOf(t)) {
      const e0 = v.events[t.src[0]], on = !e0.ed;
      commit(() => { for (const i of t.src) v.events[i].ed = on; });
      return;
    }
    ed.edArm = !ed.edArm; syncEdit();
  },
  toggleOverwrite(){
    ed.ovr = !ed.ovr;
    try { localStorage.setItem(APP.store + ':ovr2', ed.ovr ? '1' : '0'); } catch (e) {}
    syncEdit();
    toast(ed.ovr ? 'Overwrite: a new note takes the place of what stands there, so the other voices stay in step.' : 'Insert: a new note pushes the music after it along.');
  },
  moveCaret: dir => moveCaret(dir),
  nav: () => ed.nav || 'M',
  semifusa: true,
  setNav(k){ ed.nav = NAV_KEYS.includes(k) ? k : 'S'; try { localStorage.setItem(APP.store + ':nav', ed.nav); } catch (e) {} syncEdit(); toast('Grid: ' + ({Mx:'maxima',L:'longa',B:'brevis',S:'semibrevis',M:'minima',Sm:'semiminima',F:'fusa',Sf:'semifusa'})[ed.nav] + '. The arrow keys move the caret by this.'); },
  /* coloration: the selected note turns black (two thirds of its value) or white again; with nothing selected,
     the notes entered from now on are coloured, until it is pressed again */
  toggleCol(){
    if (!CBA.guard()) return;
    if (ed.range || ed.picks) {
      const it = selItems().filter(x => !x.e.rest && writable(x.v));
      if (!it.length) return;
      const anyWhite = it.some(x => { const q = symAt(x.v.idx, x.v.events.indexOf(x.e)); return q && !isColoured(q); });
      commit(() => {
        for (const {v, e} of it) {
          if (anyWhite) { if (!e.colH) { e.d = rt(e.d * 2 / 3); e.colH = true; } }
          else { if (e.colH) { e.colH = false; e.d = rt(e.d * 1.5); } }
          e.tieStart = e.tieEnd = e.tieMid = false;
        }
      });
      return;
    }
    const s = selSym(), v = curVoice();
    if (!s || s.rest) { ed.colArm = !ed.colArm; syncEdit(); toast(ed.colArm ? 'Coloration: the notes you enter now are black, two thirds of their value.' : 'Coloration off.'); return; }
    if (!v) return;
    const on = !isColoured(s), first = s.src[0];
    commit(() => {
      const e = v.events[first];
      const total = s.src.reduce((a, i) => a + v.events[i].d, 0);
      if (on) {
        e.d = rt(total * 2 / 3); e.colH = true;
      } else {
        const mi = mensInfo(metAt(v, e.t)), tab = valueTable(mi.T, mi.P, mi.M, mi.X);
        const w = rt(total * mi.p);
        const wasSameSound = e.colH && tab.some(([, val]) => eq(w, val));
        e.colH = false;
        e.d = wasSameSound ? rt(total) : rt(total * 1.5);
      }
      e.tieStart = e.tieEnd = e.tieMid = false;
      dropEvents(v, s.src.slice(1));
    });
    if (st.nota === 'real') {
      const q = symAt(v.idx, first);
      if (!q || !!q.col !== on || q.tieNext || q.dot) { undo(); ed.redo.pop(); syncEdit(); toast(on ? 'This note cannot be coloured here.' : 'This note cannot be made white here.'); }
    }
  },
  /* ligature: a note joins the ligature just before it, or starts one with the next note; on a note already in a
     ligature it takes the last note out (or undoes the ligature) */
  toggleLig(){
    if (!CBA.guard()) return;
    /* several notes selected (Shift-click the last one): they become one ligature, or stop being one */
    if (ed.range || ed.picks) {
      const it = selItems().filter(x => !x.e.rest);
      if (it.length < 2 || new Set(it.map(x => x.v)).size > 1) { toast('A ligature joins at least two notes of one voice: select them (Shift-click the last), then press Ligature.'); return; }
      const v = it[0].v;
      if (!writable(v)) { refuse(); return; }
      const idx = it.map(x => v.events.indexOf(x.e)).sort((p, q) => p - q);
      if (idx.some((e, i) => i && (e !== idx[i - 1] + 1 || v.events[e].rest))) { toast('A ligature joins notes that follow each other, without a rest between.'); return; }
      const ids = new Set(idx.map(i => v.events[i].lig || 0));
      const same = ids.size === 1 && !ids.has(0);
      commit(() => {
        const old = new Set(idx.map(i => v.events[i].lig).filter(Boolean));
        if (same) { for (const i of idx) v.events[i].lig = 0; }
        else { const nid = Math.max(0, ...v.events.map(e => e.lig || 0)) + 1; for (const i of idx) v.events[i].lig = nid; }
        /* what is left of a ligature that lost notes: fewer than two notes is no ligature */
        for (const o of old) { const rest = v.events.filter(e => e.lig === o); if (rest.length < 2) rest.forEach(e => { e.lig = 0; }); }
      });
      return;
    }
    const s = targetSym(), v = curVoice();
    if (!s || s.rest || !v) return;
    const syms = v.syms, k = syms.indexOf(s), id = v.events[s.src[0]].lig;
    if (id) {
      /* one note of a ligature: the whole ligature is dissolved */
      commit(() => { for (const e of v.events) if (e.lig === id) e.lig = 0; });
      return;
    }
    toast('A ligature needs at least two notes: select them (click the first, Shift-click the last), then press Ligature.');
  },
  toggleDot(){
    if (!CBA.guard()) return;
    if (ed.range || ed.picks) return;
    const t = accTarget(), v = curVoice();
    if (!t) { if (ed.on) { ed.dotArm = (ed.dotArm === true || ed.dotArm === 'add') ? false : 'add'; syncEdit(); } return; }
    if (t.rest || !v) return;
    { const e0 = v.events[t.src[0]];
      if (e0.pa || perfectShape(v, t.t, t.g)) {
        const on = !e0.pa;
        commit(() => {
          const e = v.events[t.src[0]]; e.pa = on; e.dd = false;
          const mi = mensInfo(metAt(v, e.t)), total = t.src.reduce((a, i) => a + v.events[i].d, 0), nm = rt(nomW(t.g, mi.T, mi.P, mi.M, mi.X) / mi.p);
          if (!eq(total, nm)) { e.d = nm; e.tieStart = e.tieEnd = e.tieMid = false; dropEvents(v, t.src.slice(1)); if (ed.ovr) ovrResize(v, t.src[0], total); }
        });
        return;
      } }
    commit(() => {
      const e = v.events[t.src[0]], wasAdd = !!(t.dot && !e.dd && !e.pa);
      const total = t.src.reduce((a, i) => a + v.events[i].d, 0);
      e.dd = false; e.pa = false;
      if (mensRulesOn()) { const mi = mensInfo(metAt(v, e.t)), nm = nomW(t.g, mi.T, mi.P, mi.M, mi.X) / mi.p; e.d = rt(wasAdd ? nm : nm * 1.5); }
      else e.d = rt(wasAdd ? total / 1.5 : total * 1.5);
      e.altd = false; e.tieStart = e.tieEnd = e.tieMid = false;
      dropEvents(v, t.src.slice(1));
      if (ed.ovr) ovrResize(v, t.src[0], total);
    });
  },
  toggleDivDot(){
    if (!CBA.guard()) return;
    if (ed.range || ed.picks) return;
    const t = accTarget(), v = curVoice();
    if (!t) { if (ed.on) { ed.dotArm = ed.dotArm === 'div' ? false : 'div'; syncEdit(); } return; }
    if (t.rest || !v) return;
    commit(() => {
      const e = v.events[t.src[0]], wasDiv = !!e.dd, wasAdd = !!(t.dot && !e.dd && !e.pa);
      const total = t.src.reduce((a, i) => a + v.events[i].d, 0);
      e.dd = !wasDiv; e.pa = false;
      if (wasAdd) {
        if (mensRulesOn()) { const mi = mensInfo(metAt(v, e.t)), nm = nomW(t.g, mi.T, mi.P, mi.M, mi.X) / mi.p; e.d = rt(nm); }
        else e.d = rt(total / 1.5);
        e.altd = false; e.tieStart = e.tieEnd = e.tieMid = false;
        dropEvents(v, t.src.slice(1));
        if (ed.ovr) ovrResize(v, t.src[0], total);
      } else if (!wasDiv && !mensRulesOn()) {
        const mi = mensInfo(metAt(v, e.t)), nm = rt(nomW(t.g, mi.T, mi.P, mi.M, mi.X) / mi.p);
        if (!eq(total, nm)) { e.d = nm; e.tieStart = e.tieEnd = e.tieMid = false; dropEvents(v, t.src.slice(1)); if (ed.ovr) ovrResize(v, t.src[0], total); }
      }
    });
  },
  stepPitch(d){
    if (!CBA.guard()) return;
    if (ed.range || ed.picks) { rangeStep(d); return; }
    const t = targetSym(), v = curVoice(); if (!t || t.rest) return;
    commit(() => { for (const i of t.src) { const e = v.events[i]; moveStep(v, e, clampStep(e.step + d)); } });
    const e = curVoice().events[t.src[0]]; if (e) hear(e.step, e.alt);
  },
  moveSel(dir){
    if (!piece) return;
    if (ed.picks) pickToRange();
    if (ed.range) {
      /* the arrows leave the range at its first (or last) note */
      const R = ed.range, v = piece.voices[R.v0], qs = (v.syms || []).filter(q => q.src && inRange(q.t));
      ed.range = null;
      if (qs.length) { const q = dir < 0 ? qs[0] : qs[qs.length - 1]; ed.sel = {vi: v.idx, ei: q.src[0]}; ed.ins = {vi: v.idx, ei: q.src[q.src.length - 1] + 1}; showSel(true); return; }
    }
    let vi = ed.sel ? ed.sel.vi : ed.ins ? ed.ins.vi : null;
    if (vi === null) { const vs = visibleVoices(); if (!vs.length) return; vi = vs[0].idx; }
    const v = piece.voices[vi], syms = v.syms || [];
    if (!syms.length) return;
    const s = selSym();
    let k;
    if (s) {
      k = syms.indexOf(s) + dir;
      if (k >= syms.length && ed.on) { ed.sel = null; ed.ins = {vi, ei: v.events.length, off: 0, pad: 0}; showSel(true); return; }
    }
    else if (ed.ins) {
      const c = ed.ins.ei + (ed.ins.off > EPS ? 1 : 0);
      k = dir < 0 ? syms.findIndex(q => q.src.includes(c - 1)) : syms.findIndex(q => q.src[0] >= c);
      if (k < 0) k = dir < 0 ? 0 : syms.length - 1;
    } else k = 0;
    const q = syms[Math.max(0, Math.min(syms.length - 1, k))];
    ed.sel = {vi, ei: q.src[0]}; ed.ins = {vi, ei: q.src[q.src.length - 1] + 1};
    if (!q.rest) hear(q.step, q.alt);
    showSel(true);
  },
  deleteTarget(){
    if (!CBA.guard()) return;
    if (ed.range || ed.picks) { rangeClear(); return; }
    const t = targetSym(), v = curVoice(); if (!t) return;
    const vi = v.idx, first = t.src[0];
    commit(() => { dropEvents(v, t.src); ed.sel = null; ed.ins = {vi, ei: first}; });
  },
  typeNote(L){
    if (!CBA.guard()) return;
    const v = curVoice(); if (!v) return;
    const li = 'CDEFGAB'.indexOf(L);
    if (ed.divisi) {
      let ei = -1;
      if (ed.sel && ed.sel.vi === v.idx && v.events[ed.sel.ei] && !v.events[ed.sel.ei].rest) ei = ed.sel.ei;
      else if (ed.ins && ed.ins.vi === v.idx) {
        if (v.events[ed.ins.ei] && !v.events[ed.ins.ei].rest) ei = ed.ins.ei;
        else if (ed.ins.ei > 0 && v.events[ed.ins.ei - 1] && !v.events[ed.ins.ei - 1].rest) ei = ed.ins.ei - 1;
      }
      if (ei >= 0) {
        const ref = v.events[ei].step;
        let best = null;
        for (let o = 0; o <= 8; o++) {
          const s = 7 * o + li;
          if (s < STEP_MIN || s > STEP_MAX) continue;
          if (best === null || Math.abs(s - ref) < Math.abs(best - ref)) best = s;
        }
        if (best === ref && !(v.events[ei].chord && v.events[ei].chord.length)) best = best + 7 <= STEP_MAX ? best + 7 : best - 7;
        if (best !== null) { toggleDivisiNote(v.idx, ei, best); return; }
      }
    }
    const idx = insertionIndex(v), ref = refStepBefore(v, idx + (!ed.sel && ed.ins && ed.ins.off > EPS ? 1 : 0));
    let best = null;
    for (let o = 0; o <= 8; o++) {
      const s = 7 * o + li;
      if (s < STEP_MIN || s > STEP_MAX) continue;
      if (best === null || Math.abs(s - ref) < Math.abs(best - ref)) best = s;
    }
    ed.inRest = false;
    insertEvent(v.idx, idx, best, false, caretPad(v, idx));
  },
  typeRest(){
    if (!CBA.guard()) return;
    const v = curVoice(); if (!v) return;
    const idx = insertionIndex(v);
    insertEvent(v.idx, idx, refStepBefore(v, idx), true, caretPad(v, idx));
  },
  undo: () => undo(), redo: () => redo(),
  deselect(){ if (ed.sel || ed.range || ed.picks) { ed.sel = null; ed.range = null; ed.picks = null; showSel(); } },
  togglePlay(){ togglePlayHold(); },
  scaleAll(dir){
    if (!CBA.guard()) return;
    /* with a selection, only the selected notes and rests are doubled or halved; what follows in each voice moves along */
    if (ed.range || ed.picks) {
      const it = selItems().filter(x => writable(x.v));
      if (!it.length) return;
      commit(() => { for (const {e} of it) e.d = rt(dir < 0 ? e.d * 2 : e.d / 2); });
      return;
    }
    const vs = xfVoices(); if (vs.length) commit(() => { for (const v of vs) for (const e of v.events) e.d = rt(dir < 0 ? e.d * 2 : e.d / 2); }); },
  shiftOctave(dir){ if (!CBA.guard()) return; if (ed.range || ed.picks) { rangeStep(7 * dir); return; } const vs = xfVoices(); if (vs.length) commit(() => { for (const v of vs) for (const e of v.events) if (!e.rest) e.step = clampStep(e.step + 7 * dir); }); },
  mutate: fn => { if (CBA.guard()) commit(fn); },
  pitched(){
    if (!CBA.guard()) return [];
    if (ed.range || ed.picks) return selItems().filter(x => writable(x.v) && !x.e.rest).map(({e, v}) => ({e, v, s: e.step, alter: e.alt || 0}));
    return xfVoices().flatMap(v => v.events.filter(e => !e.rest).map(e => ({e, v, s: e.step, alter: e.alt || 0})));
  },
  /* Transform acts on all the voices (that can be written), or on the one chosen in its menu */
  xform: () => ({names: piece ? piece.voices.map((v, i) => v.name || 'Voice ' + (i + 1)) : [], target: xfTarget(), range: !!(ed.range || ed.picks)}),
  /* Dorico's keys for the selection and the cursor; true when handled */
  key(e){
    if (!piece) return false;
    const k = e.key, mod = e.ctrlKey || e.metaKey, has = !!(ed.sel || ed.range || ed.picks);
    if ((k === 'K' || k === 'k') && e.shiftKey && !mod && !e.altKey && has) { cycleLook(); return true; }
    if (!/^Arrow/.test(k)) return false;
    if (!ed.on && !has) return false;
    const horiz = k === 'ArrowLeft' || k === 'ArrowRight';
    /* Cmd+Shift+Right or Left: the note or rest takes the next longer or shorter value */
    const cmd = mod || e.altKey;   /* Cmd and Option do the same with the arrows */
    if (horiz && e.shiftKey && cmd) { if (CBA.guard()) stretch(k === 'ArrowRight' ? 1 : -1); return true; }
    if (e.shiftKey && !cmd && has) return extendBy(k);
    /* Cmd (or Option) with Left and Right: the selection moves along, in any mode */
    if (horiz && cmd && has) { if (CBA.guard()) moveSelection(k === 'ArrowLeft' ? -1 : 1); return true; }
    if (!ed.on) return false;
    if ((k === 'ArrowUp' || k === 'ArrowDown') && cmd && !has && ed.ins) return caretStaff(k === 'ArrowUp' ? -1 : 1);
    /* Cmd or Option with Left and Right and only the caret: it moves on the grid, also into a note */
    if (horiz && cmd && !e.shiftKey && !has && ed.ins) { moveCaret(k === 'ArrowLeft' ? -1 : 1); return true; }
    if (horiz && !e.shiftKey && !cmd && (!has || ed.sel)) { moveCaret(k === 'ArrowLeft' ? -1 : 1); return true; }
    return false;
  },
  setXform(t){ ed.xf = t; },
  setPitch(h, s, alter){
    const e = h.e, imp = implied(h.v, s, e.t);
    e.step = s; e.ed = false;
    e.alt = alter === null ? imp : alter === 0 && !imp ? null : alter;
  },
  range: [STEP_MIN, STEP_MAX],
  toast: m => toast(m)
};
/* The caret stands where the next note goes, centred on that place (Samuel 2026-11-14): on the head of the note now
   at the insertion point (in Insert it moves on, in Overwrite it is replaced), across a note in proportion when the
   caret is inside it, and one note's room after the last note at the end. A line through the staff with a small
   mark above it. */
function drawCaret(scroll){
  if (!piece) return;
  const {vi, ei} = ed.ins, v = piece.voices[vi];
  if (!v || !v.syms) return;
  const pad = ed.ins.pad > EPS && ei >= v.events.length ? ed.ins.pad : 0;
  const T = ei < v.events.length ? rt(v.events[ei].t + (ed.ins.off || 0)) : v.end;
  if (v.subOf >= 0) {
    const pvi = v.subOf, pv = piece.voices[pvi];
    if (!pv) return;
    const rects = [...document.querySelectorAll('#pages rect.stafhit[data-v="' + pvi + '"]')];
    let r = rects.find(r2 => {
      const M = staffGridMap(r2, pv);
      return M && T >= M.tMin - EPS && T <= M.tb + EPS;
    }) || rects[rects.length - 1];
    if (!r) return;
    const M = staffGridMap(r, pv); if (!M) return;
    const x = M.xOf(rt(T + pad)), top = +r.dataset.top;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    c.setAttribute('class', 'caret');
    c.innerHTML = `<rect x="${f(x - 0.075)}" y="${f(top - 0.9)}" width="0.15" height="5.5"/>` +
      `<path d="M${f(x - 0.45)} ${f(top - 1.6)}H${f(x + 0.45)}L${f(x)} ${f(top - 0.85)}Z"/>`;
    r.parentNode.appendChild(c);
    if (scroll) bringIntoView(c);
    return;
  }
  let k = -1, frac = 0, at = -1;
  v.syms.forEach((q, i) => { if (q.src && k < 0 && T > q.t + EPS && T < q.t + q.d - EPS) { k = i; frac = (T - q.t) / q.d; } });
  let last = -1; for (let i = v.syms.length - 1; i >= 0; i--) if (v.syms[i].src) { last = i; break; }
  if (k < 0) {
    at = v.syms.findIndex(q => q.src && Math.abs(q.t - T) < EPS);
    if (at < 0) at = last + 1;
  }
  /* drawn on the system of the note it stands on (after the last note: the last note's system) */
  let anchor = k >= 0 ? k : at <= last ? at : last;
  if (anchor < 0) return;
  const w = ed.inRest ? 0.6 : gw(ed.val);
  document.querySelectorAll('#pages g.n' + vi + '-' + anchor).forEach((el, n) => {
    const par = el.parentNode;
    let r = null;
    for (const r2 of par.querySelectorAll('rect.stafhit[data-v="' + vi + '"]')) if (r2.dataset.k0 !== '' && +r2.dataset.k0 <= anchor && anchor <= +r2.dataset.k1) r = r2;
    if (!r) return;
    const top = +r.dataset.top;
    /* a note's place: the middle of its head (its selection box), on this system */
    const bg = q => { const e = q >= 0 && par.querySelector('g.n' + vi + '-' + q + '>rect.selbg'); return e ? {x: +e.getAttribute('x'), w: +e.getAttribute('width')} : null; };
    const mid = q => { const b = bg(q); return b ? b.x + b.w / 2 : null; };
    const after = q => { const b = bg(q); return b ? b.x + b.w + 0.5 + w / 2 : null; };   /* the place just after a note */
    let x;
    if (k >= 0) { const x0 = mid(k), x1 = mid(k + 1) ?? after(k); x = x0 + frac * (x1 - x0); }
    else if (at <= last) x = mid(at);
    else x = after(last);
    if (x === null || isNaN(x)) return;
    if (pad) { const M = staffGridMap(r, v); x = M ? M.xOf(rt(T + pad)) : x + pad * 2.4; }
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    c.setAttribute('class', 'caret');
    c.innerHTML = `<rect x="${f(x - 0.075)}" y="${f(top - 0.9)}" width="0.15" height="5.5"/>` +
      `<path d="M${f(x - 0.45)} ${f(top - 1.6)}H${f(x + 0.45)}L${f(x)} ${f(top - 0.85)}Z"/>`;
    par.appendChild(c);
    if (scroll && !n) bringIntoView(c);
  });
}
/* with the mouse, as in CantusFirmus: right-click turns a note into a rest and removes a rest; drag a note up or down */
/* the note under the pointer: in note input the staff's writing area lies on top, so look underneath it too */
function noteAt(e){
  let g = null;
  for (const el of document.elementsFromPoint(e.clientX, e.clientY)) { const q = el.closest && el.closest('#pages g[class^="n"]'); if (q) { g = q; break; } }
  const m = g && /^n(\d+)-(\d+)/.exec(g.getAttribute('class') || '');
  if (!m || !piece) return null;
  const v = piece.voices[+m[1]], s = v && v.syms[+m[2]];
  return s && s.src ? {vi: +m[1], s, g} : null;
}
pagesEl.addEventListener('contextmenu', e => {
  const n = noteAt(e); if (!n) return;
  e.preventDefault(); clearGhost();
  /* on a Mac, Ctrl-click arrives as a right-click: it adds to the selection, as Ctrl/Cmd-click does */
  if (e.ctrlKey && e.button === 0) { if (ed.sel || ed.range || ed.picks) togglePick(n.vi, n.s); return; }
  if (!writable(piece.voices[n.vi])) { refuse(); return; }
  /* right-click never deletes notes or rests: it opens the note/rest context menu */
  openNotePick(n, e);
});
/* Right-click context menu on a note (Appearance + Stem direction) or rest (Rest shape).
   Per-note appearance (black, white, red) is for the eye only (kern N / + / j); on a chord the head under the pointer is changed. */
const LOOKS = [['', 'As notated'], ['black', 'Black'], ['white', 'White'], ['red', 'Red']];
const STEMS_MENU = [['', 'Auto'], ['u', 'Stem up'], ['d', 'Stem down'], ['n', 'Stemless']];
const notePick = $('#notePick');
notePick.tabIndex = -1;
let notePickAt = null;
function headAt(n, e){
  const s = n.s;
  if (!s.chord || !s.chord.length) return null;
  const hit = n.g.querySelector('rect.hit'), m = n.g.getScreenCTM();
  if (!hit || !m) return null;
  const y = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).y, y0 = +hit.getAttribute('y') + 1;
  const pos = s.pos + (y0 - y) / 0.5;
  let best = {step: s.step, d: Math.abs(pos - s.pos), main: true};
  for (const c of s.chord) { const d = Math.abs(pos - c.pos); if (d < best.d) best = {step: c.step, d, main: false}; }
  return best.main ? 'main' : best.step;
}
function lookEvents(v, s, head, fn){
  for (const i of s.src) {
    const ev = v.events[i]; if (!ev || ev.rest) continue;
    if (head === null || head === 'main') fn(ev);
    if (ev.chord) for (const c of ev.chord) if (head === null || c.step === head) fn(c);
  }
}
function setLook(v, s, head, look){
  commit(() => lookEvents(v, s, head, o => { if (look) o.look = look; else delete o.look; }));
}
function setStemDir(v, s, dir){
  commit(() => {
    for (const i of s.src) {
      const ev = v.events[i]; if (!ev || ev.rest) continue;
      if (dir) ev.stemDirOvr = dir; else delete ev.stemDirOvr;
    }
  });
}
function openNotePick(n, e){
  const v = piece.voices[n.vi], s = n.s;
  if (s.rest) {
    const ext = ensureExt(piece), ek = n.vi + ':' + rt(s.t), ro = ext.rests[ek] || null;
    const curSp = ro ? String(ro.sp) : '', curBot = ro && ro.bot ? String(ro.bot) : '';
    notePickAt = {vi: n.vi, t: s.t, rest: true};
    notePick.innerHTML = `<li class="hd" role="presentation">Rest shape</li>` +
      [['', 'Auto'], ['1', '1 space'], ['2', '2 spaces'], ['3', '3 spaces']].map(([k, l]) =>
        `<li role="menuitemradio" data-rsp="${k}" aria-checked="${k === curSp}" aria-selected="${k === curSp}"><span class="lookico"></span><span>${l}</span></li>`
      ).join('') +
      `<li class="sep" role="separator"></li><li class="hd" role="presentation">Bottom line</li>` +
      ['1', '2', '3', '4', '5'].map(k =>
        `<li role="menuitemradio" data-rbot="${k}" aria-checked="${k === curBot}" aria-selected="${k === curBot}"><span class="lookico"></span><span>Line ${k}</span></li>`
      ).join('');
  } else {
    const head = headAt(n, e);
    let cur = '', curStem = '';
    lookEvents(v, s, head, o => { if (!cur && o.look) cur = o.look; });
    for (const i of s.src) { const ev = v.events[i]; if (ev && !ev.rest && ev.stemDirOvr) { curStem = ev.stemDirOvr; break; } }
    notePickAt = {vi: n.vi, t: s.t, head, rest: false};
    const sw = k => {
      const g = k ? lookGlyph(s, k) : {g: s.glyphAuto || s.glyph, red: s.glyphAuto ? s.redAuto : s.red};
      const gl = chordHeadGlyph(g.g);
      return `<span class="lookico${g.red ? ' red' : ''}">${glyphIcon(gl, 3)}</span>`;
    };
    const stemIco = k => k === 'u' ? '↑' : k === 'd' ? '↓' : k === 'n' ? '○' : '·';
    notePick.innerHTML = `<li class="hd" role="presentation">Appearance</li>` +
      LOOKS.map(([k, l]) => `<li role="menuitemradio" data-look="${k}" aria-checked="${k === cur}" aria-selected="${k === cur}" title="${k ? 'Shown ' + l.toLowerCase() + ' only: the value and the sound stay as they are' : 'As the notation gives it'}">${sw(k)}<span>${l}</span></li>`).join('') +
      `<li class="sep" role="separator"></li><li class="hd" role="presentation">Stem direction</li>` +
      STEMS_MENU.map(([k, l]) => `<li role="menuitemradio" data-stem="${k}" aria-checked="${k === curStem}" aria-selected="${k === curStem}"><span class="lookico" style="align-items:center;justify-content:center;font-size:14px">${stemIco(k)}</span><span>${l}</span></li>`).join('');
  }
  const wr = $('.viewwrap').getBoundingClientRect();
  notePick.hidden = false;
  notePick.style.left = Math.max(4, Math.min(wr.width - notePick.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  notePick.style.top = (e.clientY - wr.top + 10) + 'px';
  notePick.focus({preventScroll: true});
}
function chordHeadGlyph(g){ return GLY[g] ? g : 'B'; }
function notePickDo(li){
  const at = notePickAt; notePick.hidden = true; notePickAt = null;
  if (!li || !at || !piece) return;
  const v = piece.voices[at.vi], s = v && (v.syms || []).find(q => q.src && !!q.rest === !!at.rest && Math.abs(q.t - at.t) < EPS);
  if (!s || !writable(v)) return;
  if (at.rest) {
    const ek = at.vi + ':' + rt(s.t);
    if (li.dataset.rsp !== undefined) {
      const sp = +li.dataset.rsp || 0;
      commit(() => {
        const ext = ensureExt(piece);
        if (!sp) delete ext.rests[ek];
        else ext.rests[ek] = {bot: (ext.rests[ek] && ext.rests[ek].bot) || 2, sp};
      });
    } else if (li.dataset.rbot !== undefined) {
      const bot = +li.dataset.rbot || 2;
      commit(() => {
        const ext = ensureExt(piece);
        ext.rests[ek] = {bot, sp: (ext.rests[ek] && ext.rests[ek].sp) || 1};
      });
    }
    return;
  }
  if (li.dataset.look !== undefined) { setLook(v, s, at.head, li.dataset.look); return; }
  if (li.dataset.stem !== undefined) { setStemDir(v, s, li.dataset.stem); return; }
}
notePick.addEventListener('click', e => { const li = e.target.closest('li[data-look],li[data-stem],li[data-rsp],li[data-rbot]'); if (li) notePickDo(li); });
notePick.addEventListener('keydown', e => {
  e.stopPropagation();
  const items = [...notePick.querySelectorAll('li[data-look],li[data-stem],li[data-rsp],li[data-rbot]')];
  let i = items.findIndex(li => li.classList.contains('active'));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); i = (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
    items.forEach((li, k) => li.classList.toggle('active', k === i));
  } else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); notePickDo(items[i]); }
  else if (e.key === 'Escape' || e.key === 'Tab') { notePick.hidden = true; notePickAt = null; }
});
document.addEventListener('pointerdown', e => { if (!notePick.hidden && !e.target.closest('#notePick')) { notePick.hidden = true; notePickAt = null; } });
/* touch: holding a finger on a note or rest opens the same menu (iPhones send no right-click) */
let notePress = null;
pagesEl.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || !piece) return;
  const n = noteAt(e); if (!n) return;
  const x = e.clientX, y = e.clientY, ev = {clientX: x, clientY: y};
  clearTimeout(notePress && notePress.tm);
  notePress = {x, y, tm: setTimeout(() => { notePress = null; if (!writable(piece.voices[n.vi])) return; clearGhost(); openNotePick(n, ev); }, 550)};
});
const notePressEnd = e => { if (!notePress) return; if (e.type !== 'pointermove' || Math.hypot(e.clientX - notePress.x, e.clientY - notePress.y) > 10) { clearTimeout(notePress.tm); notePress = null; } };
['pointermove', 'pointerup', 'pointercancel'].forEach(t => pagesEl.addEventListener(t, notePressEnd));
/* Shift+K: the selected notes go through the appearances (as notated, black, white, red) */
function cycleLook(){
  if (!piece || !CBA.guard()) return;
  let it = [];
  if (ed.range || ed.picks) it = selItems().filter(x => !x.e.rest && writable(x.v)).map(x => ({v: x.v, evs: [x.e]}));
  else { const s = selSym(), v = curVoice(); if (s && !s.rest && v && writable(v)) it = [{v, evs: s.src.map(i => v.events[i])}]; }
  if (!it.length) { toast('Select a note first, then Shift+K changes how it looks.'); return; }
  const order = ['', 'black', 'white', 'red'], first = it[0].evs[0];
  const next = order[(order.indexOf(first.look || '') + 1) % order.length];
  commit(() => { for (const x of it) for (const ev of x.evs) for (const o of [ev, ...(ev.chord || [])]) { if (next) o.look = next; else delete o.look; } });
  toast(next ? 'Shown ' + next + ' (for the eye only: the value and the sound stay as they are).' : 'Shown as notated.');
}
let noteDrag = null;
pagesEl.addEventListener('pointerdown', e => {
  if (e.button !== 0 || e.pointerType !== 'mouse' || e.shiftKey) return;
  const n = noteAt(e); if (!n || n.s.rest) return;
  if (!writable(piece.voices[n.vi])) return;
  const m = n.g.getScreenCTM(); if (!m) return;
  noteDrag = {n, y0: new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).y, steps: 0, id: e.pointerId};
});
pagesEl.addEventListener('pointermove', e => {
  if (!noteDrag || e.pointerId !== noteDrag.id) return;
  const m = noteDrag.n.g.getScreenCTM(); if (!m) return;
  const y = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).y, steps = Math.round((noteDrag.y0 - y) / 0.5);
  if (steps === noteDrag.steps) return;
  noteDrag.steps = steps; noteDrag.moved = true; clearGhost();
  const ids = inSel(noteDrag.n.vi, noteDrag.n.s)
    ? piece.voices.flatMap(v => (v.syms || []).filter(q => q.src && !q.rest && inSel(v.idx, q)).map(q => q.id)) : [noteDrag.n.s.id];
  for (const id of ids) document.querySelectorAll('#pages g.' + id).forEach(g => g.setAttribute('transform', `translate(0 ${f(-steps * 0.5)})`));
  hear(clampStep(noteDrag.n.s.step + steps), noteDrag.n.s.alt);
});
pagesEl.addEventListener('pointerup', () => {
  if (!noteDrag) return;
  const d = noteDrag; noteDrag = null;
  if (!d.moved || !d.steps) return;           /* a plain click: the click handler selects */
  const {vi, s} = d.n, v = piece.voices[vi];
  if (inSel(vi, s)) { rangeStep(d.steps); return; }
  ed.range = null; ed.picks = null;
  ed.sel = {vi, ei: s.src[0]}; ed.ins = {vi, ei: s.src[s.src.length - 1] + 1};
  commit(() => { for (const i of s.src) { const ev = v.events[i]; moveStep(v, ev, clampStep(ev.step + d.steps)); } });
});
pagesEl.addEventListener('pointercancel', () => { if (noteDrag) { noteDrag = null; render(); } });

function syncEdit(){
  if (typeof syncLayer2UI === 'function') syncLayer2UI();
  $('#editBtn').setAttribute('aria-pressed', String(ed.on));
  $('#editBar').hidden = !barOpen();
  $('#editMore').setAttribute('aria-expanded', String(barOpen()));
  document.body.classList.toggle('editing', ed.on);
  iconsSync();
  /* the tools show their state (the grid, the note value, the accidentals) even before a piece has come in */
  try {
    NoteInput.sync(CBA);
    const pb = $('#pdivBtn'), db = $('#dotBtn'), popDot = $('#popDot');
    if (pb && db) {
      const S = CBA.state(), ta = S.acc !== undefined ? S.acc : S.target;
      const dotOn = db.getAttribute('aria-pressed') === 'true';
      const pdivOn = ta ? (!ta.r && !!ta.pd) : !!S.armDiv;
      pb.setAttribute('aria-pressed', pdivOn ? 'true' : 'false');
      pb.disabled = db.disabled;
      if (popDot) {
        const curSelKey = ed.sel ? `${ed.sel.vi}:${ed.sel.ei}` : '';
        if (pdivOn) {
          popDot.classList.add('open');
        } else if ((!dotOn && !pdivOn) || (curSelKey !== popDot.dataset.selKey && !pdivOn)) {
          popDot.classList.remove('open');
        }
        popDot.dataset.selKey = curSelKey;
      }
    }
  } catch (e) { if (piece) throw e; }
  if (typeof drawEditGrid === 'function') drawEditGrid();
}
function glyphIcon(k, minBox){
  const b = GLY[k].b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  const box = Math.max(minBox, b[2] - b[0] + 0.5, b[3] - b[1] + 0.5);
  return `<svg viewBox="${f(cx - box / 2)} ${f(cy - box / 2)} ${f(box)} ${f(box)}" aria-hidden="true"><path d="${GLY[k].d}"/></svg>`;
}
/* the note value and Grid icons are drawn in the notation in use (Samuel 2026-11-15): white, black or modern */
const VKEYS = ['Mx', 'L', 'B', 'S', 'M', 'Sm', 'F', 'Sf'];
function styledKey(k){
  if (!VKEYS.includes(k)) return k;
  const black = isBlack(), modern = st.nota === 'fake' && st.heads !== 'old';
  const g = black ? BLACK_G[k] || k + 'c' : modern ? MOD_G[k] || k : k;
  return GLY[g] ? g : k;
}
let iconStyle = '';
function iconsSync(){
  const key = notaNow() + (st.heads || '');
  if (key === iconStyle) return;
  iconStyle = key;
  document.querySelectorAll('#durBtns button[data-d]').forEach(b => { b.innerHTML = glyphIcon(styledKey(b.dataset.d), 2.7); });
  document.querySelectorAll('#navBtns button[data-n] .navg').forEach(sp => { sp.innerHTML = glyphIcon(styledKey(sp.closest('button').dataset.n), 2.7); });
}
NoteInput.fill(CBA, glyphIcon);
NoteInput.wire(CBA);
function syncLayer2UI(){
  const on = !!(ed.layer2 || (ed.sel && isLayer2Voice(ed.sel.vi)) || (ed.on && ed.ins && isLayer2Voice(ed.ins.vi)));
  document.body.classList.toggle('layer2', on);
  const vb = $('#v2Btn'); if (vb) vb.setAttribute('aria-pressed', String(!!ed.layer2));
  const cb = $('#divisiBtn'); if (cb) cb.setAttribute('aria-pressed', String(!!ed.divisi));
}
function ensureSubVoice(pvi){
  const existing = subVoiceOf(pvi);
  if (existing) return existing;
  const par = piece.voices[pvi]; if (!par) return null;
  const v2 = restVoice((par.name || 'Voice') + ' 2', par.clef || 'treble', par);
  v2.subOf = pvi;
  commit(() => {
    const insertAt = pvi + 1;
    for (const v of piece.voices) if (v.subOf >= insertAt) v.subOf++;
    piece.voices.splice(insertAt, 0, v2);
    piece.voices.forEach((v, i) => { v.idx = i; });
  });
  return subVoiceOf(pvi);
}
function splitVoiceAt(v, t){
  if (!v || t <= EPS || t >= v.end - EPS) return;
  const i = v.events.findIndex(e => e.t < t - EPS && e.t + e.d > t + EPS);
  if (i < 0) return;
  const a = v.events[i], d1 = rt(t - a.t), d2 = rt(a.d - d1);
  const b = Object.assign({}, a, {t: rt(t), d: d2, kd: d2, syl: [], ferm: false});
  if (!a.rest) {
    b.tieEnd = !!(a.tieEnd || a.tieMid); b.tieStart = !!(a.tieStart || a.tieMid); b.tieMid = b.tieStart && b.tieEnd;
    if (a.tieEnd && !a.tieStart) { a.tieMid = true; a.tieEnd = false; } else if (!a.tieMid) a.tieStart = true;
  }
  a.d = d1; a.kd = d1; a.long = false; a.ferm = false;
  v.events.splice(i + 1, 0, b);
  for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > i) m.ei++;
}
function caretAtTime(v, T){
  if (!v) return {vi: 0, ei: 0, off: 0, pad: 0};
  const t = Math.max(0, Math.min(v.end, T || 0));
  const ei = v.events.findIndex(e => t >= e.t - EPS && t < e.t + e.d - EPS);
  if (ei >= 0) return {vi: v.idx, ei, off: rt(t - v.events[ei].t), pad: 0};
  return {vi: v.idx, ei: v.events.length, off: 0, pad: 0};
}
function swapDivisiSelection(){
  if (!piece) return false;
  let vi = -1, t0 = Infinity, t1 = -Infinity;
  if (ed.range || ed.picks) {
    const it = selItems();
    if (!it.length) return false;
    const parents = new Set(it.map(x => parentOf(x.v.idx)));
    if (parents.size !== 1) return false;
    vi = [...parents][0];
    for (const {e} of it) { t0 = Math.min(t0, e.t); t1 = Math.max(t1, rt(e.t + e.d)); }
  } else if (ed.sel) {
    const s = selSym(); if (!s) return false;
    vi = parentOf(ed.sel.vi); t0 = s.t; t1 = rt(s.t + s.d);
  } else return false;
  const v1 = piece.voices[vi], v2 = subVoiceOf(vi);
  if (!v1 || !v2 || !(t1 > t0 + EPS)) return false;
  const hasV2 = v2.events.some(e => !e.rest && e.t < t1 - EPS && e.t + e.d > t0 + EPS);
  if (!hasV2) return false;
  commit(() => {
    const a = piece.voices[vi], b = subVoiceOf(vi);
    if (!a || !b) return;
    splitVoiceAt(a, t0); splitVoiceAt(a, t1);
    splitVoiceAt(b, t0); splitVoiceAt(b, t1);
    const iA0 = a.events.findIndex(e => e.t >= t0 - EPS);
    const iA1 = a.events.findIndex(e => e.t >= t1 - EPS);
    const endA = iA1 < 0 ? a.events.length : iA1;
    const iB0 = b.events.findIndex(e => e.t >= t0 - EPS);
    const iB1 = b.events.findIndex(e => e.t >= t1 - EPS);
    const endB = iB1 < 0 ? b.events.length : iB1;
    if (iA0 < 0 || iB0 < 0) return;
    const sliceA = a.events.slice(iA0, endA);
    const sliceB = b.events.slice(iB0, endB);
    a.events.splice(iA0, endA - iA0, ...sliceB);
    b.events.splice(iB0, endB - iB0, ...sliceA);
    retime(a); retime(b);
  });
  toast('Swapped voice 1 and voice 2.');
  return true;
}
/* Chord (stacked notes of the same value in one voice) + Divisi (+v, true second voice with independent rhythm, stems down, blue selection) */
{
  const lb = $('#ligBtn');
  if (lb) {
    const cb = document.createElement('button');
    cb.className = 'ib'; cb.id = 'divisiBtn';
    cb.setAttribute('aria-pressed', 'false');
    cb.setAttribute('aria-label', 'Chord (stacked notes)');
    cb.title = 'Chord: click above or below an existing note (or press A–G) to stack another note of the same value';
    cb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4 16.5 6.9 12 11.4 7.5 6.9Zm0 2.5L9.9 6.9 12 9 14.1 6.9ZM12 12.6 16.5 17.1 12 21.6 7.5 17.1Zm0 2.5L9.9 17.1 12 19.2 14.1 17.1Z"/></svg>';
    cb.addEventListener('click', () => {
      if (!piece) return;
      ed.divisi = !ed.divisi;
      if (ed.divisi) { ed.layer2 = false; if (!ed.on) setEdit(true); }
      syncLayer2UI();
    });
    lb.insertAdjacentElement('afterend', cb);

    const vb = document.createElement('button');
    vb.className = 'ib v2btn'; vb.id = 'v2Btn';
    vb.setAttribute('aria-pressed', 'false');
    vb.setAttribute('aria-label', 'Divisi (+v): second voice');
    vb.title = 'Divisi (+v): write a second independent voice on the same staff (stems down, blue selection). With a divisi passage selected, click to swap voice 1 and voice 2';
    vb.innerHTML = '<span>+v</span>';
    vb.addEventListener('click', () => {
      if (!piece || !CBA.guard()) return;
      if (swapDivisiSelection()) { syncLayer2UI(); return; }
      ed.layer2 = !ed.layer2;
      if (ed.layer2) {
        ed.divisi = false;
        if (!ed.on) setEdit(true);
        const cv = curVoice() || visibleVoices()[0];
        if (cv) {
          const pvi = parentOf(cv.idx), T = selStart();
          const v2 = ensureSubVoice(pvi);
          if (v2) { ed.sel = null; ed.range = null; ed.picks = null; ed.ins = caretAtTime(v2, T); }
        }
        toast('Divisi (+v): writing second voice (stems down). Click +v again for voice 1.');
      } else {
        const cv = curVoice();
        if (cv) {
          const pvi = parentOf(cv.idx), T = selStart();
          ed.sel = null; ed.range = null; ed.picks = null;
          ed.ins = caretAtTime(piece.voices[pvi], T);
        }
      }
      syncLayer2UI(); showSel(true); drawEditGrid();
    });
    cb.insertAdjacentElement('afterend', vb);
  }
}
/* Punctus additionis (.A) and a hover dropdown below it for Punctus divisionis (.D) */
{
  const db = $('#dotBtn');
  if (db) {
    const dotIcon = L => `<svg viewBox="-1 -1 2 2" aria-hidden="true"><circle cx="-0.22" cy="0" r="0.28"/><text x="0.44" y="0.48" font-size="0.82" font-family="IM Fell English, Georgia, serif" text-anchor="middle">${L}</text></svg>`;
    db.title = 'Punctus additionis (.)';
    db.setAttribute('aria-label', 'Punctus additionis');
    db.innerHTML = dotIcon('A');
    const pop = document.createElement('div');
    pop.className = 'pop'; pop.id = 'popDot';
    db.parentNode.insertBefore(pop, db);
    pop.appendChild(db);
    const body = document.createElement('div');
    body.className = 'popbody';
    const pb = document.createElement('button');
    pb.className = 'ib'; pb.id = 'pdivBtn';
    pb.title = 'Punctus divisionis';
    pb.setAttribute('aria-label', 'Punctus divisionis');
    pb.setAttribute('aria-pressed', 'false');
    pb.innerHTML = dotIcon('D');
    pb.addEventListener('click', () => {
      CBA.toggleDivDot();
      const on = pb.getAttribute('aria-pressed') === 'true';
      pop.classList.toggle('open', on);
      if (on && window.__fitMenus) window.__fitMenus();
    });
    body.appendChild(pb);
    pop.appendChild(body);
    /* Touchscreens & Apple Pencil: tapping ·A toggles it as usual AND drops down the menu to show ·A / ·D;
       it collapses automatically once a note is input or another note without a dot of division is selected. */
    let dotLastPtr = 'mouse';
    db.addEventListener('pointerdown', e => { dotLastPtr = e.pointerType || 'touch'; });
    db.addEventListener('click', () => {
      if (dotLastPtr === 'mouse') return;
      const dotOn = db.getAttribute('aria-pressed') === 'true';
      const divOn = pb.getAttribute('aria-pressed') === 'true';
      if (dotOn || divOn) {
        closePops(pop);
        pop.classList.add('open');
        pop.dataset.selKey = ed.sel ? `${ed.sel.vi}:${ed.sel.ei}` : '';
        if (window.__fitMenus) window.__fitMenus();
      } else {
        pop.classList.remove('open');
      }
    });
  }
  document.head.insertAdjacentHTML('beforeend', '<style>#popDot.open .popbody{display:block !important}#popDot .popbody{left:50% !important;right:auto !important;transform:translateX(-50%);padding:3px !important}#pages .dothit .dotkind{opacity:0;pointer-events:none;fill:var(--sel);font-family:"IM Fell English",Georgia,serif;transition:opacity .12s}#pages .dothit:hover .dotkind{opacity:1}@media print{#pages .dotkind{display:none !important}}#mensMenu .meq{border-top:1px solid var(--line);margin-top:4px;padding-top:2px}#mensMenu .meq .mlev{flex-direction:column;align-items:stretch;gap:3px}#mensMenu .meq .mslab{width:auto;font-size:13px;color:var(--muted)}#mensMenu .meq .seg{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}#mensMenu .meq .tb{padding:3px 2px;font-size:12.5px;justify-content:center}.texpop{position:relative;display:inline-flex}.texmenu{display:none;position:absolute;left:-4px;top:calc(100% + 2px);z-index:85;padding:5px;border-radius:8px;background:var(--surface,#FAF5EA);border:1px solid var(--line);box-shadow:0 12px 28px -10px rgba(42,34,24,.38);flex-direction:column;gap:2px;min-width:170px}.texmenu::before{content:"";position:absolute;left:0;right:0;top:-6px;height:8px}.texpop:hover .texmenu,.texpop:focus-within .texmenu,.texpop.open .texmenu{display:flex}.texopt{display:flex !important;align-items:center;justify-content:flex-start !important;gap:8px;padding:4px 8px !important;min-height:30px !important;height:auto !important;font-size:13.5px !important;white-space:nowrap}.texsw{width:18px;height:18px;border-radius:4px;border:1px solid rgba(42,34,24,.28);flex:none;display:inline-block}</style>');
}
/* edit mode is always caret mode: the caret stands at the start until a note is clicked */
function setEdit(on){
  ed.on = on; clearGhost();
  if (!on) { ed.accArm = null; ed.accEd = false; ed.dotArm = false; ed.edArm = false; ed.layer2 = false; ed.divisi = false; }
  /* entering note input takes the selection away: the caret stands just before what was selected (Samuel 2026-11-14) */
  if (ed.on && piece && (ed.sel || ed.range || ed.picks)) {
    let at = null;
    if (ed.sel) at = {vi: ed.sel.vi, ei: ed.sel.ei};
    else { const it = selItems(); if (it.length) { const x = it.reduce((a, y) => !a || y.e.t < a.e.t - EPS || (Math.abs(y.e.t - a.e.t) < EPS && y.v.idx < a.v.idx) ? y : a, null); at = {vi: x.v.idx, ei: x.v.events.indexOf(x.e)}; } }
    ed.sel = null; ed.range = null; ed.picks = null;
    ed.ins = at && at.ei >= 0 ? {vi: at.vi, ei: at.ei, off: 0, pad: 0} : null;
  }
  if (ed.on && piece && !ed.sel && !ed.ins && !ed.range && !ed.picks) { const vs = visibleVoices(); if (vs.length) ed.ins = {vi: vs[0].idx, ei: 0, off: 0, pad: 0}; }
  showSel(true); syncEdit(); drawEditGrid(); postHeight();
}
$('#editBtn').addEventListener('click', () => setEdit(!ed.on));
/* the arrow beside the pen: the editing tools row, open or shut, kept per app */
$('#editMore').addEventListener('click', () => {
  ed.bar = !barOpen();
  try { localStorage.setItem(APP.store + ':edbar', ed.bar ? '1' : '0'); } catch (e) {}
  syncEdit(); postHeight();
});
$('#saveBtn').addEventListener('click', () => {
  closePops();
  const text = piece.text || writeKern(piece);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
  a.download = (H.fileName ? H.fileName() : (pieceKey.replace(/^file:/, '').replace(/\.(krn|kern|txt)$/i, '') || APP.store)) + '.krn';
  document.body.appendChild(a); a.click(); a.remove();
});
if ($('#cmmeBtn')) $('#cmmeBtn').addEventListener('click', () => {
  if (!piece) return;
  closePops();
  const xml = exportCMME(piece);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([xml], {type: 'application/xml'}));
  a.download = (H.fileName ? H.fileName() : (pieceKey.replace(/^file:/, '').replace(/\.(krn|kern|cmme|xml|txt)$/i, '') || APP.store)) + '.cmme.xml';
  document.body.appendChild(a); a.click(); a.remove();
  toast('Exported CMME XML (.cmme.xml).');
});

/* ---------------- Advanced (Beta) Menu & Apparatus ---------------- */
function syncAdv(){
  if (!piece) return;
  const ext = ensureExt(piece);
  const it = typeof selEvents === 'function' ? selEvents() : [];
  const first = it[0] || null;
  const vi = first ? piece.voices.indexOf(first.v) : -1;
  const ek = first ? vi + ':' + rt(first.e.t) : '';
  const lookVal = first && !first.e.rest ? (first.e.look || '') : '';
  const sdVal = first && !first.e.rest ? (first.e.stemDirOvr || '') : '';
  const ssVal = first && !first.e.rest ? (first.e.stemSideOvr || '') : '';
  const ro = first && first.e.rest ? ext.rests[ek] : null;
  const lkVal = first && !first.e.rest ? (ext.ligKind[ek] || '') : '';
  const setSeg = (id, val) => { const g = $(id); if (g) g.querySelectorAll('button[data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(val)))); };
  setSeg('#lookSeg', lookVal);
  setSeg('#stemOvrSeg', sdVal);
  setSeg('#stemSideSeg', ssVal);
  setSeg('#restSpSeg', ro ? String(ro.sp) : '');
  if ($('#restBotSel')) $('#restBotSel').value = ro && ro.bot ? String(ro.bot) : '';
  setSeg('#ligKindSeg', lkVal);
  setSeg('#origTxtSeg', st.origText || 'off');
  setSeg('#annSeg', st.ann || 'on');
  const al = $('#annList');
  if (al) {
    if (ext.ann.length) {
      al.hidden = false;
      al.innerHTML = ext.ann.map((a, idx) => `<div class="adv-item"><span>[${idx + 1}] V${a.vi + 1}: ${esc(a.text)}</span><button type="button" class="adv-del" data-del-ann="${idx}" title="Delete annotation">×</button></div>`).join('');
    } else { al.hidden = true; al.innerHTML = ''; }
  }
  const vsel = $('#varVerSel'), vl = $('#varList');
  if (vsel) {
    const vers = [...new Set(ext.variants.flatMap(vr => (vr.readings || []).map(r => r.ver)).filter(Boolean))];
    vsel.innerHTML = `<option value="">Default</option>` + vers.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    vsel.value = ext.activeVer || '';
  }
  if (vl) {
    if (ext.variants.length) {
      vl.hidden = false;
      vl.innerHTML = ext.variants.map((vr, idx) => `<div class="adv-item"><span>V${vr.vi + 1} (${vr.readings.map(r => r.ver).join(' / ')})</span><button type="button" class="adv-del" data-del-var="${idx}" title="Delete variant">×</button></div>`).join('');
    } else { vl.hidden = true; vl.innerHTML = ''; }
  }
  const cl = $('#chantList');
  if (cl) {
    if (ext.chants.length) {
      cl.hidden = false;
      cl.innerHTML = ext.chants.map((ch, idx) => `<div class="adv-item"><span class="chant-ed-item" data-ed-chant="${idx}" style="cursor:pointer" title="Click to edit">${esc(ch.title || 'Plainchant')}</span><button type="button" class="adv-del" data-del-chant="${idx}" title="Delete chant section">×</button></div>`).join('');
    } else { cl.hidden = true; cl.innerHTML = ''; }
  }
}
if ($('#lookSeg')) $('#lookSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b || !piece) return;
  const it = selEvents().filter(x => !x.e.rest);
  if (!it.length) { toast('Select a note first.'); return; }
  if (it.some(x => !writable(x.v))) { refuse(); return; }
  const val = b.dataset.v;
  commit(() => { for (const {e: ev} of it) ev.look = val; });
  syncAdv();
});
if ($('#stemOvrSeg')) $('#stemOvrSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b || !piece) return;
  const it = selEvents().filter(x => !x.e.rest);
  if (!it.length) { toast('Select a note first.'); return; }
  if (it.some(x => !writable(x.v))) { refuse(); return; }
  const val = b.dataset.v;
  commit(() => { for (const {e: ev} of it) ev.stemDirOvr = val; });
  syncAdv();
});
if ($('#stemSideSeg')) $('#stemSideSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b || !piece) return;
  const it = selEvents().filter(x => !x.e.rest);
  if (!it.length) { toast('Select a note first.'); return; }
  if (it.some(x => !writable(x.v))) { refuse(); return; }
  const val = b.dataset.v;
  commit(() => { for (const {e: ev} of it) ev.stemSideOvr = val; });
  syncAdv();
});
if ($('#restSpSeg')) $('#restSpSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b || !piece) return;
  const it = selEvents().filter(x => x.e.rest);
  if (!it.length) { toast('Select a rest first.'); return; }
  if (it.some(x => !writable(x.v))) { refuse(); return; }
  const sp = +b.dataset.v || 0, bot = +($('#restBotSel') && $('#restBotSel').value) || 2;
  commit(() => {
    const ext = ensureExt(piece);
    for (const {v, e: ev} of it) {
      const ek = piece.voices.indexOf(v) + ':' + rt(ev.t);
      if (!sp) delete ext.rests[ek];
      else ext.rests[ek] = {bot: (ext.rests[ek] && ext.rests[ek].bot) || bot, sp};
    }
  });
  syncAdv();
});
if ($('#restBotSel')) $('#restBotSel').addEventListener('change', e => {
  if (!piece) return;
  const it = selEvents().filter(x => x.e.rest);
  if (!it.length) { toast('Select a rest first.'); return; }
  const bot = +e.target.value || 0;
  commit(() => {
    const ext = ensureExt(piece);
    for (const {v, e: ev} of it) {
      const ek = piece.voices.indexOf(v) + ':' + rt(ev.t);
      if (!bot) delete ext.rests[ek];
      else ext.rests[ek] = {bot, sp: (ext.rests[ek] && ext.rests[ek].sp) || 1};
    }
  });
  syncAdv();
});
if ($('#ligKindSeg')) $('#ligKindSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b || !piece) return;
  const it = selEvents().filter(x => !x.e.rest);
  if (!it.length) { toast('Select the first note of a ligature first.'); return; }
  const val = b.dataset.v;
  commit(() => {
    const ext = ensureExt(piece);
    for (const {v, e: ev} of it) {
      const ek = piece.voices.indexOf(v) + ':' + rt(ev.t);
      if (!val) delete ext.ligKind[ek]; else ext.ligKind[ek] = val;
    }
  });
  syncAdv();
});
if ($('#origTxtSeg')) $('#origTxtSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b) return;
  st.origText = b.dataset.v; save(); render(); syncAdv();
});
if ($('#editOrigTxtBtn')) $('#editOrigTxtBtn').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents().filter(x => !x.e.rest);
  if (!it.length) { toast('Select a note first.'); return; }
  const {v, e: ev} = it[0], ek = piece.voices.indexOf(v) + ':' + rt(ev.t);
  const ext = ensureExt(piece);
  const cur = ext.origText[ek] || '';
  const val = prompt('Original-orthography syllable / text for this note (empty to clear):', cur);
  if (val === null) return;
  commit(() => {
    if (val.trim()) { ext.origText[ek] = val.trim(); st.origText = 'on'; save(); }
    else delete ext.origText[ek];
  });
  syncAdv();
});
if ($('#annSeg')) $('#annSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b) return;
  st.ann = b.dataset.v; save(); render(); syncAdv();
});
if ($('#addAnnBtn')) $('#addAnnBtn').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents();
  if (!it.length) { toast('Select a note or rest first.'); return; }
  const {v, e: ev} = it[0], vi = piece.voices.indexOf(v);
  const ext = ensureExt(piece);
  const existing = ext.ann.find(a => a.vi === vi && eq(a.t, ev.t));
  const val = prompt('Editorial annotation text (empty to remove):', existing ? existing.text : '');
  if (val === null) return;
  commit(() => {
    if (!val.trim()) { if (existing) ext.ann = ext.ann.filter(a => a !== existing); }
    else if (existing) existing.text = val.trim();
    else ext.ann.push({id: 'a' + (ext.ann.length + 1), vi, t: rt(ev.t), text: val.trim()});
  });
  syncAdv();
});
if ($('#annList')) $('#annList').addEventListener('click', e => {
  const del = e.target.closest('[data-del-ann]'); if (!del || !piece) return;
  const idx = +del.dataset.delAnn;
  commit(() => { ensureExt(piece).ann.splice(idx, 1); });
  syncAdv();
});
if ($('#varVerSel')) $('#varVerSel').addEventListener('change', e => {
  if (!piece) return;
  commit(() => { ensureExt(piece).activeVer = e.target.value; });
  syncAdv();
  toast(e.target.value ? `Showing variant reading: ${e.target.value}` : 'Showing Default reading.');
});
if ($('#addVarBtn')) $('#addVarBtn').addEventListener('click', () => {
  if (!piece) return;
  const it = selEvents();
  if (!it.length) { toast('Select a note or passage first.'); return; }
  const {v, e: ev} = it[0], last = it[it.length - 1].e, vi = piece.voices.indexOf(v);
  const ver = prompt('Source / variant version ID (e.g. Source B, ModB):', 'Source B');
  if (!ver || !ver.trim()) return;
  const summary = prompt('Describe or transcribe the variant reading for this passage:', '');
  if (summary === null) return;
  commit(() => {
    const ext = ensureExt(piece);
    ext.variants.push({
      id: 'v' + (ext.variants.length + 1), vi, t: rt(ev.t), endT: rt(last.t + last.d),
      readings: [{ver: 'Default', summary: 'Main text'}, {ver: ver.trim(), summary: summary.trim()}]
    });
  });
  syncAdv();
  toast('Variant reading added.');
});
if ($('#varList')) $('#varList').addEventListener('click', e => {
  const del = e.target.closest('[data-del-var]'); if (!del || !piece) return;
  const idx = +del.dataset.delVar;
  commit(() => { ensureExt(piece).variants.splice(idx, 1); });
  syncAdv();
});
/* ---------------- Interactive Plainchant GUI Editor ---------------- */
function chantCur(){
  if (!piece || chantEd.idx < 0) return null;
  const arr = ensureExt(piece).chants;
  if (chantEd.idx >= arr.length) { chantEd.idx = -1; chantEd.sel = null; return null; }
  return arr[chantEd.idx];
}
function chantFlatNotes(parsed){
  const list = [];
  parsed.items.forEach((it, ii) => {
    if (it.kind === 'syl') (it.groups || []).forEach((g, gi) => {
      if (g.notes) g.notes.forEach((n, ni) => list.push({ii, gi, ni, it, g, n}));
    });
  });
  return list;
}
function openChantEd(idx, sel){
  if (!piece) return;
  const arr = ensureExt(piece).chants;
  if (!arr[idx]) return;
  chantEd.idx = idx;
  if (sel !== undefined) chantEd.sel = sel;
  else {
    const p = parseGabcChant(arr[idx].gabc || '');
    const flat = chantFlatNotes(p);
    chantEd.sel = flat.length ? {ii: flat[0].ii, gi: flat[0].gi, ni: flat[0].ni} : null;
  }
  syncChantBar();
  render();
  postHeight();
}
function closeChantEd(){
  if (chantEd.idx < 0) return;
  chantEd.idx = -1; chantEd.sel = null;
  syncChantBar();
  render();
  postHeight();
}
function syncChantBar(){
  const bar = $('#chantBar'); if (!bar) return;
  const ch = chantCur();
  bar.hidden = !ch;
  if (!ch) return;
  const p = parseGabcChant(ch.gabc || '');
  if ($('#chTitle') && document.activeElement !== $('#chTitle')) $('#chTitle').value = ch.title || '';
  if ($('#chClef')) $('#chClef').value = `${p.clef.type}${p.clef.flat ? 'b' : ''}${p.clef.line}`;
  const al = ch.align === 'center' ? 'center' : 'left';
  if ($('#chAlign')) $('#chAlign').querySelectorAll('button[data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === al)));
  if ($('#chRaw') && document.activeElement !== $('#chRaw')) $('#chRaw').value = ch.gabc || '';
  const sel = chantEd.sel;
  let note = null, it = null;
  if (sel && !sel.bar && p.items[sel.ii] && p.items[sel.ii].groups && p.items[sel.ii].groups[sel.gi]) {
    it = p.items[sel.ii];
    note = (it.groups[sel.gi].notes || [])[sel.ni] || null;
  }
  const nr = $('#chNoteRow');
  if (nr) nr.style.opacity = note ? '1' : '.45';
  if ($('#chSyl') && document.activeElement !== $('#chSyl')) $('#chSyl').value = it ? (it.text || '') : '';
  const setP = (id, on) => { const el = $(id); if (el) el.setAttribute('aria-pressed', String(!!on)); };
  setP('#chDot', note && note.dot);
  setP('#chEpiH', note && note.epiH);
  setP('#chEpiV', note && note.epiV);
  setP('#chFlat', note && note.acc === 'fl');
  setP('#chNat', note && note.acc === 'na');
  setP('#chIncl', note && note.incl);
}
function mutateChant(fn, audition){
  const ch = chantCur(); if (!ch) return;
  const p = parseGabcChant(ch.gabc || '');
  const res = fn(p, ch);
  if (res === false) return;
  const nextGabc = serializeGabcChant(p);
  commit(() => { ch.gabc = nextGabc; });
  if (audition && chantEd.sel && !chantEd.sel.bar) {
    const p2 = parseGabcChant(ch.gabc || '');
    const it = p2.items[chantEd.sel.ii], g = it && it.groups && it.groups[chantEd.sel.gi], n = g && g.notes && g.notes[chantEd.sel.ni];
    if (n) {
      const stp = chantStepOf(p2.clef, n.pos);
      const alt = n.acc === 'fl' ? -1 : n.acc === 'na' ? 0 : (p2.clef.flat && ((stp % 7) + 7) % 7 === 6 ? -1 : 0);
      hear(stp, alt);
    }
  }
  syncChantBar();
  syncAdv();
}
function editChantAt(idx){ openChantEd(idx); }
if ($('#addChantBtn')) $('#addChantBtn').addEventListener('click', () => {
  if (!piece) return;
  closePops();
  const it = selEvents();
  const t = it.length ? rt(it[0].e.t) : 0;
  let newIdx = 0;
  commit(() => {
    const arr = ensureExt(piece).chants;
    newIdx = arr.length;
    arr.push({t, title: 'Intonation', align: 'center', gabc: '(c4) Glo(g)ri(h)a(g) in(f) ex(g)cel(gh)sis(hg) De(f)o.(e.) (::)'});
  });
  syncAdv();
  openChantEd(newIdx);
  toast('Plainchant section added. Click or drag notes on the 4-line staff to edit.');
});
if ($('#chantList')) $('#chantList').addEventListener('click', e => {
  const del = e.target.closest('[data-del-chant]');
  if (del && piece) {
    const di = +del.dataset.delChant;
    if (chantEd.idx === di) { chantEd.idx = -1; chantEd.sel = null; }
    commit(() => { ensureExt(piece).chants.splice(di, 1); });
    syncChantBar(); syncAdv(); return;
  }
  const edc = e.target.closest('[data-ed-chant]');
  if (edc && piece) { closePops(); openChantEd(+edc.dataset.edChant); }
});
/* Chant bar controls */
if ($('#chTitle')) $('#chTitle').addEventListener('change', e => {
  const ch = chantCur(); if (!ch) return;
  commit(() => { ch.title = e.target.value.trim() || 'Plainchant'; });
  syncChantBar(); syncAdv();
});
if ($('#chClef')) $('#chClef').addEventListener('change', e => {
  const m = String(e.target.value).match(/^([cf])(b)?([1-4])$/);
  if (!m) return;
  mutateChant(p => { p.clef = {type: m[1], flat: !!m[2], line: +m[3]}; });
});
if ($('#chAlign')) $('#chAlign').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); const ch = chantCur(); if (!b || !ch) return;
  commit(() => { ch.align = b.dataset.v; });
  syncChantBar();
});
if ($('#chRawTog')) $('#chRawTog').addEventListener('click', () => {
  const r = $('#chRawRow'); if (!r) return;
  r.hidden = !r.hidden;
  $('#chRawTog').setAttribute('aria-pressed', String(!r.hidden));
  postHeight();
});
if ($('#chRaw')) $('#chRaw').addEventListener('change', e => {
  const ch = chantCur(); if (!ch) return;
  commit(() => { ch.gabc = e.target.value.trim(); });
  syncChantBar();
});
if ($('#chDelSec')) $('#chDelSec').addEventListener('click', () => {
  if (!piece || chantEd.idx < 0) return;
  const di = chantEd.idx;
  chantEd.idx = -1; chantEd.sel = null;
  commit(() => { ensureExt(piece).chants.splice(di, 1); });
  syncChantBar(); syncAdv(); toast('Plainchant section deleted.');
});
if ($('#chDone')) $('#chDone').addEventListener('click', closeChantEd);
if ($('#chSyl')) $('#chSyl').addEventListener('change', e => {
  if (!chantEd.sel || chantEd.sel.bar) return;
  const txt = e.target.value.trim();
  mutateChant(p => { const it = p.items[chantEd.sel.ii]; if (it && it.kind === 'syl') it.text = txt; });
});
const chantMovePitch = delta => mutateChant(p => {
  if (!chantEd.sel || chantEd.sel.bar) return false;
  const it = p.items[chantEd.sel.ii], g = it && it.groups && it.groups[chantEd.sel.gi], n = g && g.notes && g.notes[chantEd.sel.ni];
  if (!n) return false;
  n.pos = Math.max(-3, Math.min(9, n.pos + delta));
}, true);
const chantModToggle = fn => mutateChant(p => {
  if (!chantEd.sel || chantEd.sel.bar) return false;
  const it = p.items[chantEd.sel.ii], g = it && it.groups && it.groups[chantEd.sel.gi], n = g && g.notes && g.notes[chantEd.sel.ni];
  if (!n) return false;
  fn(n, g, it, p);
}, true);
if ($('#chUp')) $('#chUp').addEventListener('click', () => chantMovePitch(1));
if ($('#chDn')) $('#chDn').addEventListener('click', () => chantMovePitch(-1));
if ($('#chDot')) $('#chDot').addEventListener('click', () => chantModToggle(n => { n.dot = !n.dot; }));
if ($('#chEpiH')) $('#chEpiH').addEventListener('click', () => chantModToggle(n => { n.epiH = !n.epiH; }));
if ($('#chEpiV')) $('#chEpiV').addEventListener('click', () => chantModToggle(n => { n.epiV = !n.epiV; }));
if ($('#chFlat')) $('#chFlat').addEventListener('click', () => chantModToggle(n => { n.acc = n.acc === 'fl' ? '' : 'fl'; }));
if ($('#chNat')) $('#chNat').addEventListener('click', () => chantModToggle(n => { n.acc = n.acc === 'na' ? '' : 'na'; }));
if ($('#chIncl')) $('#chIncl').addEventListener('click', () => chantModToggle(n => { n.incl = !n.incl; }));
if ($('#chJoin')) $('#chJoin').addEventListener('click', () => mutateChant(p => {
  if (!chantEd.sel || chantEd.sel.bar) return false;
  const {ii, gi, ni} = chantEd.sel, it = p.items[ii];
  if (!it || it.kind !== 'syl') return false;
  const g = it.groups[gi];
  if (ni > 0) {
    /* Split this note out into a new group/syllable after current */
    const tail = g.notes.splice(ni);
    it.groups.splice(gi + 1, 0, {notes: tail});
    chantEd.sel = {ii, gi: gi + 1, ni: 0};
  } else if (gi > 0 && it.groups[gi - 1].notes) {
    /* Join with previous group in same syllable */
    const prev = it.groups[gi - 1];
    const newNi = prev.notes.length;
    prev.notes.push(...g.notes);
    it.groups.splice(gi, 1);
    chantEd.sel = {ii, gi: gi - 1, ni: newNi};
  } else if (ii > 0 && p.items[ii - 1].kind === 'syl' && p.items[ii - 1].groups.length) {
    /* Join this syllable's notes into previous syllable's last group */
    const prevIt = p.items[ii - 1], pg = prevIt.groups[prevIt.groups.length - 1];
    if (!pg.notes) return false;
    const newNi = pg.notes.length;
    pg.notes.push(...g.notes);
    it.groups.splice(gi, 1);
    if (!it.groups.length) p.items.splice(ii, 1);
    chantEd.sel = {ii: ii - 1, gi: prevIt.groups.length - 1, ni: newNi};
  }
}));
const chantDelSel = () => mutateChant(p => {
  if (!chantEd.sel) return false;
  const {ii, gi, ni, bar} = chantEd.sel;
  if (bar) {
    if (gi < 0) p.items.splice(ii, 1);
    else if (p.items[ii] && p.items[ii].groups) { p.items[ii].groups.splice(gi, 1); if (!p.items[ii].groups.length && !p.items[ii].text) p.items.splice(ii, 1); }
    chantEd.sel = null;
    return;
  }
  const it = p.items[ii], g = it && it.groups && it.groups[gi];
  if (!g || !g.notes) return false;
  g.notes.splice(ni, 1);
  if (!g.notes.length) it.groups.splice(gi, 1);
  if (!it.groups.length) p.items.splice(ii, 1);
  const flat = chantFlatNotes(p);
  chantEd.sel = flat.length ? {ii: flat[Math.max(0, flat.length - 1)].ii, gi: flat[Math.max(0, flat.length - 1)].gi, ni: flat[Math.max(0, flat.length - 1)].ni} : null;
});
if ($('#chDelNote')) $('#chDelNote').addEventListener('click', chantDelSel);
if ($('#chAddNote')) $('#chAddNote').addEventListener('click', () => mutateChant(p => {
  const newNote = {pos: 3, incl: false, dot: false, epiH: false, epiV: false, virga: false, acc: ''};
  if (chantEd.sel && !chantEd.sel.bar && p.items[chantEd.sel.ii]) {
    const it = p.items[chantEd.sel.ii], g = it.groups && it.groups[chantEd.sel.gi];
    if (g && g.notes) {
      const ref = g.notes[chantEd.sel.ni];
      if (ref) newNote.pos = ref.pos;
      p.items.splice(chantEd.sel.ii + 1, 0, {kind: 'syl', text: '', groups: [{notes: [newNote]}]});
      chantEd.sel = {ii: chantEd.sel.ii + 1, gi: 0, ni: 0};
      return;
    }
  }
  const insAt = p.items.length && p.items[p.items.length - 1].kind === 'bar' && p.items[p.items.length - 1].bar === '::' ? p.items.length - 1 : p.items.length;
  p.items.splice(insAt, 0, {kind: 'syl', text: '', groups: [{notes: [newNote]}]});
  chantEd.sel = {ii: insAt, gi: 0, ni: 0};
}, true));
document.querySelectorAll('#chantBar [data-chbar]').forEach(b => b.addEventListener('click', () => mutateChant(p => {
  const bar = b.dataset.chbar;
  const insAt = chantEd.sel ? Math.min(p.items.length, chantEd.sel.ii + 1) : p.items.length;
  p.items.splice(insAt, 0, {kind: 'bar', bar});
  chantEd.sel = {ii: insAt, gi: -1, bar: true};
})));
['#chTitle', '#chSyl', '#chRaw'].forEach(id => { const el = $(id); if (el) el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') el.blur(); }); });

/* Click & vertical-drag on plainchant notes, bars, and 4-line staff */
let chantDrag = null;
pagesEl.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !piece) return;
  const cn = e.target.closest && e.target.closest('.cn-hit');
  if (cn) {
    e.preventDefault(); e.stopPropagation();
    const [ci, ii, gi, ni] = cn.dataset.cn.split(':').map(Number);
    const top = +cn.dataset.top;
    const ch = ensureExt(piece).chants[ci]; if (!ch) return;
    const p = parseGabcChant(ch.gabc || '');
    const n = p.items[ii] && p.items[ii].groups && p.items[ii].groups[gi] && p.items[ii].groups[gi].notes[ni];
    chantEd.idx = ci; chantEd.sel = {ii, gi, ni};
    ed.sel = null; ed.range = null; ed.picks = null; showSel();
    syncChantBar(); render();
    if (n) {
      const stp = chantStepOf(p.clef, n.pos);
      const alt = n.acc === 'fl' ? -1 : n.acc === 'na' ? 0 : (p.clef.flat && ((stp % 7) + 7) % 7 === 6 ? -1 : 0);
      hear(stp, alt);
      const svg = cn.ownerSVGElement;
      chantDrag = {ci, ii, gi, ni, top, svg, startY: e.clientY, origPos: n.pos, lastPos: n.pos, moved: false};
    }
    return;
  }
  const cb = e.target.closest && e.target.closest('.cb-hit');
  if (cb) {
    e.preventDefault(); e.stopPropagation();
    const [ci, ii, gi] = cb.dataset.cb.split(':').map(Number);
    chantEd.idx = ci; chantEd.sel = {ii, gi, bar: true};
    syncChantBar(); render();
    return;
  }
  const cs = e.target.closest && e.target.closest('.cs-hit');
  if (cs) {
    e.preventDefault(); e.stopPropagation();
    const ci = +cs.dataset.cs, top = +cs.dataset.top;
    if (chantEd.idx !== ci) { openChantEd(ci); return; }
    /* Already editing this chant: clicking on the 4-line staff adds a note at that exact pitch! */
    const m = cs.getScreenCTM();
    if (!m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const pos = Math.max(-3, Math.min(9, Math.round((top + 3 - pt.y) * 2)));
    mutateChant(p => {
      const newNote = {pos, incl: false, dot: false, epiH: false, epiV: false, virga: false, acc: ''};
      const insAt = chantEd.sel ? Math.min(p.items.length, chantEd.sel.ii + 1)
        : (p.items.length && p.items[p.items.length - 1].kind === 'bar' && p.items[p.items.length - 1].bar === '::' ? p.items.length - 1 : p.items.length);
      p.items.splice(insAt, 0, {kind: 'syl', text: '', groups: [{notes: [newNote]}]});
      chantEd.sel = {ii: insAt, gi: 0, ni: 0};
    }, true);
  }
});
document.addEventListener('pointermove', e => {
  if (!chantDrag || !piece) return;
  if (!chantDrag.moved && Math.abs(e.clientY - chantDrag.startY) < 4) return;
  chantDrag.moved = true;
  const ch = ensureExt(piece).chants[chantDrag.ci]; if (!ch) return;
  const el = pagesEl.querySelector(`.cn-hit[data-cn="${chantDrag.ci}:${chantDrag.ii}:${chantDrag.gi}:${chantDrag.ni}"]`);
  const m = (el || chantDrag.svg) && (el || chantDrag.svg).getScreenCTM();
  if (!m) return;
  const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  const pos = Math.max(-3, Math.min(9, Math.round((chantDrag.top + 3 - pt.y) * 2)));
  if (pos === chantDrag.lastPos) return;
  chantDrag.lastPos = pos;
  const p = parseGabcChant(ch.gabc || '');
  const n = p.items[chantDrag.ii] && p.items[chantDrag.ii].groups && p.items[chantDrag.ii].groups[chantDrag.gi] && p.items[chantDrag.ii].groups[chantDrag.gi].notes[chantDrag.ni];
  if (!n) return;
  n.pos = pos;
  ch.gabc = serializeGabcChant(p);
  const stp = chantStepOf(p.clef, pos);
  hear(stp, n.acc === 'fl' ? -1 : 0);
  render();
  syncChantBar();
});
document.addEventListener('pointerup', () => {
  if (!chantDrag) return;
  const d = chantDrag; chantDrag = null;
  if (d.moved && d.lastPos !== d.origPos && piece) {
    /* Persist dragged pitch into undo stack & kern snapshot */
    commit(() => {});
    syncChantBar();
  }
});
/* Keyboard editing when a plainchant note/bar is selected */
document.addEventListener('keydown', e => {
  if (chantEd.idx < 0 || !piece) return;
  if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeChantEd(); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); chantMovePitch(1); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); chantMovePitch(-1); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const ch = chantCur(); if (!ch) return;
    const flat = chantFlatNotes(parseGabcChant(ch.gabc || ''));
    if (!flat.length) return;
    e.preventDefault(); e.stopImmediatePropagation();
    let idx = chantEd.sel ? flat.findIndex(x => x.ii === chantEd.sel.ii && x.gi === chantEd.sel.gi && x.ni === chantEd.sel.ni) : 0;
    idx = Math.max(0, Math.min(flat.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)));
    const cur = flat[idx];
    chantEd.sel = {ii: cur.ii, gi: cur.gi, ni: cur.ni};
    const p = parseGabcChant(ch.gabc || '');
    hear(chantStepOf(p.clef, cur.n.pos), cur.n.acc === 'fl' ? -1 : 0);
    syncChantBar(); render();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!chantEd.sel) return;
    e.preventDefault(); e.stopImmediatePropagation(); chantDelSel();
  }
}, true);

document.addEventListener('click', e => {
  const ab = e.target.closest && e.target.closest('.ann-badge');
  if (!ab || !piece) return;
  const ext = ensureExt(piece), id = ab.dataset.ann;
  const an = ext.ann.find((a, i) => (a.id || String(i)) === id);
  if (!an) return;
  const val = prompt('Editorial annotation (edit or clear to delete):', an.text);
  if (val === null) return;
  commit(() => {
    if (val.trim()) an.text = val.trim();
    else ext.ann = ext.ann.filter(a => a !== an);
  });
  syncAdv();
});
document.head.insertAdjacentHTML('beforeend', '<style>.betapill{display:inline-block;margin-left:5px;padding:1px 5px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;background:var(--accent,#8B2E22);color:#FAF5EA;vertical-align:middle}.advset{min-width:290px;max-width:340px}.advset .subhead{grid-column:1/-1;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:6px;padding-top:6px;border-top:1px solid var(--line)}.advset .subhead:first-child{margin-top:0;padding-top:0;border-top:none}.adv-list{grid-column:1/-1;display:flex;flex-direction:column;gap:3px;max-height:110px;overflow:auto;padding:4px 6px;border-radius:6px;background:rgba(42,34,24,.04);font-size:12px}.adv-item{display:flex;align-items:center;justify-content:space-between;gap:6px}.adv-del{border:none;background:none;color:var(--muted);cursor:pointer;font-size:14px;padding:0 4px}.adv-del:hover{color:var(--accent,#8B2E22)}#pages .sf-badge{fill:var(--accent,#8B2E22);font-family:Georgia,serif;font-weight:700}#pages .orig-lyr{fill:var(--muted,#6B5E4E);font-style:italic;font-family:"IM Fell English",Georgia,serif}#pages .lacuna rect{fill:rgba(139,46,34,.08);stroke:var(--accent,#8B2E22);stroke-width:.12;stroke-dasharray:.4 .25}#pages .lacuna text{fill:var(--accent,#8B2E22);font-style:italic;font-family:Georgia,serif}#pages .ann-badge{cursor:pointer}#pages .ann-badge rect{fill:var(--accent,#8B2E22)}#pages .ann-badge text{fill:#FAF5EA;font-family:sans-serif;font-weight:700}#pages .var-br path{stroke:var(--muted,#6B5E4E)}#pages .var-br text{fill:var(--muted,#6B5E4E);font-family:sans-serif}#pages .chant-sys .cs-hit{cursor:crosshair}#pages .cn-hit,#pages .cb-hit{cursor:pointer}#pages .cn-hit .cn-bg,#pages .cb-hit .cn-bg{fill:transparent;transition:fill .1s}#pages .cn-hit:hover .cn-bg,#pages .cb-hit:hover .cn-bg{fill:rgba(139,46,34,.12)}#pages .cn-sel .cn-bg{fill:rgba(180,82,36,.24) !important;stroke:var(--accent,#8B2E22);stroke-width:.1}#pages .chant-title{fill:var(--ink,#2A2218);font-family:"IM Fell English",Georgia,serif}.chantbar{display:flex;flex-direction:column;gap:5px;padding:6px 10px;border-top:1px solid var(--line);background:var(--surface,#FAF5EA)}.chantbar[hidden]{display:none !important}.chantbar .chrow{display:flex;flex-wrap:wrap;align-items:center;gap:5px}.chantbar .chlab{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-right:2px}.chantbar input[type=text],.chantbar select{height:28px;padding:0 7px;border:1px solid var(--line);border-radius:6px;background:var(--bg,#FFFDF8);color:var(--ink,#2A2218);font:inherit;font-size:13px}.chantbar #chTitle{width:118px}.chantbar #chSyl{width:96px}.chantbar .chsep{width:1px;height:18px;background:var(--line);margin:0 2px}.chantbar .tb{min-height:28px;height:28px;padding:0 8px;font-size:13px}</style>');
$('#keepBtn').addEventListener('click', () => {
  if (!piece) return;
  closePops();
  if (pieceKey.startsWith('mine:')) { toast('This score is already kept in My scores.'); return; }
  const text = piece.text || writeKern(piece), undo = ed.undo.slice(), redo = ed.redo.slice();
  const id = mineAdd(piece.title, text);
  try { localStorage.setItem(EKEY(id), text); } catch (e) {}
  loadPiece(id).then(() => { ed.undo = undo; ed.redo = redo; syncEdit(); refreshMine(); toast('Saved to My scores. Changes to this copy are kept.'); });
});
/* Ctrl/Cmd or Alt with Left/Right move the selection: CBA.key (moveSelection) */
syncEdit();

/* the hand's look (the hand itself, the pendulum and the beat menu are the shared engine's) */
['handOp', 'handSize'].forEach(k => $('#' + k + 'P').addEventListener('input', e => {
  st[k] = +e.target.value; save(); Organ.syncBeat(); }));
/* hovering the hand (or the pendulum) opens a small panel with its size and opacity, like the Sound panel:
   it closes a moment after the pointer leaves; on a touch screen a tap on the hand opens and closes it */
(function(){
  const pop = $('#handPop'), boxes = [$('#handBox'), $('#pendBox')];
  const hov = () => window.matchMedia && matchMedia('(hover:hover)').matches;
  let tm = 0, from = null;
  const place = () => {
    const bx = from && !from.hidden ? from : boxes.find(x => !x.hidden) || boxes[0];
    const b = bx.querySelector('svg > g').getBoundingClientRect();   /* the drawing itself, not its box */
    pop.hidden = false;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let x = b.left + b.width / 2 - w / 2, y = b.bottom + 4;
    if (y + h > innerHeight - 8) y = Math.max(8, b.top - h - 4);
    pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, x)) + 'px'; pop.style.top = Math.max(8, y) + 'px';
  };
  const show = box => { clearTimeout(tm); if (box) from = box; if (pop.hidden) { $('#handSizeP').value = st.handSize; $('#handOpP').value = st.handOp; place(); } };
  const hide = () => { clearTimeout(tm); tm = setTimeout(() => { if (pop.matches(':hover') || pop.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return; pop.hidden = true; }, 330); };
  boxes.forEach(bx => { const svg = bx.querySelector('svg');
    svg.addEventListener('mouseover', () => { if (hov()) show(bx); });
    svg.addEventListener('mouseout', e => { if (hov() && !svg.contains(e.relatedTarget)) hide(); });
    svg.addEventListener('click', e => { if (hov()) return; e.stopPropagation(); if (pop.hidden) show(bx); else pop.hidden = true; }); });
  pop.addEventListener('mouseenter', () => { if (hov()) show(); });
  pop.addEventListener('mouseleave', () => { if (hov()) hide(); });
  pop.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => { pop.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.hidden = true; });
  /* while the size slider moves, the panel stays under the pointer: it is not re-placed until it opens again */
})();
if ($('#audition')) $('#audition').addEventListener('change', e => { st.audition = e.target.checked; save(); });

/* the music box fills the window (or the visitor's window, when embedded), with the controls above and below it */
function sizeViewer(){
  /* the music fills the window from its own top to the window's bottom; the controls float over it */
  let win = window.innerHeight;
  if (EMBED) { if (DOCK) win = DOCK.vh - DOCK.pageTop; else { try { win = window.top.innerHeight - 200; } catch (e) { win = Math.max(window.screen.availHeight - 360, 600); } } }
  const top = wrapEl.getBoundingClientRect().top + window.scrollY;
  document.documentElement.style.setProperty('--vh', Math.max(380, Math.round(win - top - 2)) + 'px');
}
/* Pinching on a trackpad (Ctrl with the wheel; gesture events in Safari) makes the music bigger, not the website:
   pages are magnified; on Web, where the music fills the width, the staves grow instead */
{
  let zRaf = 0;
  const applyZoomFast = () => {
    const G = pageGeom();
    if (G.web || G.fit) { render(); return; }
    const fs = wrapEl.classList.contains('fs'), horiz = isHoriz();
    const Z = Math.max(0.5, Math.min(3, st.zoom || 1));
    const avail = ($('.viewwrap').clientWidth || window.innerWidth) - (horiz ? (window.innerWidth <= 700 ? 60 : 40) : window.innerWidth <= 700 ? 0 : 40);
    const pxmm = 96 / 25.4;
    const availH = Math.max(320, (fs ? window.innerHeight : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) || 700) - 60);
    const fitH = horiz ? availH / (G.hmm * pxmm) : Infinity;
    const sc = st.view === 'choir' ? Math.min(2.5, avail / (2 * G.wmm * pxmm)) * Z : Math.min(1.25, avail / (G.wmm * pxmm), fitH) * Z;
    const w = Math.round(G.wmm * pxmm * sc) + 'px', h = Math.round(G.hmm * pxmm * sc) + 'px';
    pagesEl.querySelectorAll('.page').forEach(p => { p.style.width = w; p.style.height = h; });
    viewerEl.classList.toggle('wide', Z > 1.001);
    syncNav(); postHeight();
  };
  const zoomBy = k => {
    if (!piece || !isFinite(k) || k <= 0) return;
    if (st.paper === 'web') { const sb = st.bounds && st.bounds.size; const mn = sb ? sb[0] : 1, mx = sb ? sb[1] : 7; st.size = Math.max(mn, Math.min(mx, Math.round(st.size * k * 100) / 100)); if (st.sizeLock !== 'off') st.noteSize = st.size; rngSync('size'); rngSync('noteSize'); }
    else st.zoom = Math.max(0.5, Math.min(3, (st.zoom || 1) * k));
    save();
    if (!zRaf) zRaf = requestAnimationFrame(() => { zRaf = 0; applyZoomFast(); });
  };
  document.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); zoomBy(Math.exp(-Math.max(-25, Math.min(25, e.deltaY)) * 0.006)); }, {passive: false});
  let g0 = 1;
  document.addEventListener('gesturestart', e => { e.preventDefault(); g0 = e.scale || 1; });
  document.addEventListener('gesturechange', e => { e.preventDefault(); const sc = e.scale || 1; zoomBy(sc / g0); g0 = sc; });
  document.addEventListener('gestureend', e => e.preventDefault());
  /* scrolling sideways with an ordinary mouse wheel, when the music is one long line */
  viewerEl.addEventListener('wheel', e => {
    if (e.ctrlKey || !viewerEl.classList.contains('wide') || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (viewerEl.scrollHeight > viewerEl.clientHeight + 4) return;
    viewerEl.scrollLeft += e.deltaY; e.preventDefault();
  }, {passive: false});
}
/* the frame is always as tall as the window (the old drag grip is gone) */
delete st.frameH;

/* ------------------------------------------------------------------ */
/* Playback: the shared organ (shared/organ.js), every shown voice      */
/* ------------------------------------------------------------------ */
const SEMI = [0, 2, 4, 5, 7, 9, 11];
function midiOf(s){
  const oct = Math.floor(s.step / 7), idx = ((s.step % 7) + 7) % 7;
  return 12 * (oct + 1) + SEMI[idx] + (s.alt || 0);
}
function setPlayIcon(on){
  $('#playIcon').setAttribute('d', on ? 'M2 2h10v10H2Z' : 'M2 1 13 7 2 13Z');
  $('#fsPlayIcon').setAttribute('d', on ? 'M3 2h3v10H3ZM8 2h3v10H8Z' : 'M3 1.5 12.5 7 3 12.5Z');
  $('#fsPlay').setAttribute('aria-label', on ? 'Pause' : 'Play'); $('#fsPlay').title = on ? 'Pause' : 'Play';
  $('#play').setAttribute('aria-label', on ? 'Stop' : 'Play'); $('#play').title = on ? 'Stop (space bar)' : 'Play (space bar)';
}
function stopPlay(){ Organ.stop(); }
/* the beat's note value in minims, as the piece's first sign reads it (O: a perfect brevis; O. or C.: a perfect semibrevis) */
function unitMinims(){
  const top = visibleVoices()[0] || piece.voices[0];
  const mi = mensInfo(metAt(top, 0)), tab = valueTable(mi.T, mi.P, mi.M, mi.X);
  const e = tab.find(x => x[0] === st.unit) || tab[3];
  return e[1] * 2 / mi.p;
}
/* where the music stands, in semibreves */
const playPos = () => (Organ.position() || 0) / 2;
function restartPlay(){ if (!play) return; startPlay(playPos(), true); }
function startPlay(from, again){
  if (!piece) return;
  /* Play starts at the selected note (or the beginning) */
  if (typeof from !== 'number') from = selStart();
  from = Math.max(0, Math.min(from, piece.end));
  const voices = piece.voices.filter(v => vis(v.idx).play !== false);     /* the muted ones stay: their cursor moves, they make no sound */
  if (!voices.length) { toast('Every voice is left out of Playback (Voices).'); return; }
  const top = voices[0], u = unitMinims();
  /* map score time (in semibreves) to playback time (in minims), respecting any Equivalent (M, S, B, L) at sign changes without altering the score's notes */
  const playZones = [];
  {
    const mets = (top.mets || []).slice().sort((a, b) => a.t - b.t);
    let scale = 2, acc = 0, lastT = 0, prevMi = null;
    for (const m of mets) {
      if (m.t > lastT + EPS) { playZones.push({t0: lastT, p0: acc, scale}); acc += (m.t - lastT) * scale; lastT = m.t; }
      const mi = mensInfo(m.sign);
      if (prevMi && mi.eq) {
        const d1 = (nomW(mi.eq, prevMi.T, prevMi.P, prevMi.M, prevMi.X) || 1) / prevMi.p;
        const d2 = (nomW(mi.eq, mi.T, mi.P, mi.M, mi.X) || 1) / mi.p;
        if (d1 > EPS && d2 > EPS) scale = scale * (d1 / d2);
      }
      prevMi = mi;
    }
    playZones.push({t0: lastT, p0: acc, scale});
  }
  const toPlayT = t => {
    let z = playZones[0];
    for (const q of playZones) if (t >= q.t0 - EPS) z = q;
    return z.p0 + Math.max(0, t - z.t0) * z.scale;
  };
  const events = [];
  voices.forEach(v => {
    const muted = vis(v.idx).play === 'mute';
    for (let k = 0; k < v.syms.length; k++) {
      const s = v.syms[k];
      /* a rest sounds nothing but lights up while it lasts */
      if (s.rest) { const pt = toPlayT(s.t); events.push({id: s.id, t: pt, d: toPlayT(s.t + s.d) - pt, midi: null}); continue; }
      /* tied pieces sound as one note: struck once (where the playing starts, if it starts inside), held to the end */
      let j = k;
      while (v.syms[j].tieNext && v.syms[j + 1] && !v.syms[j + 1].rest && v.syms[j + 1].step === s.step) j++;
      const chainEnd = v.syms[j].t + v.syms[j].d;
      let struck = false;
      for (let q = k; q <= j; q++) {
        const p = v.syms[q], strike = !struck && p.t + p.d > from + EPS, pt = toPlayT(p.t), pd = toPlayT(p.t + p.d) - pt, ph = strike ? toPlayT(chainEnd) - pt : undefined;
        events.push({id: p.id, t: pt, d: pd, midi: muted ? null : midiOf({step: p.step, alt: p.alt === null || p.alt === undefined ? implied(v, p.step, p.t) : p.alt}), silent: !strike, hold: ph, ch: v.idx});
        if (!muted && p.chord && p.chord.length) {
          for (const c of p.chord) events.push({id: p.id, t: pt, d: pd, midi: midiOf({step: c.step, alt: c.alt === null || c.alt === undefined ? implied(v, c.step, p.t) : c.alt}), silent: !strike, hold: ph, ch: v.idx});
        }
        if (strike) struck = true;
      }
      k = j;
    }
  });
  const on = new Set();
  /* the Mixer: each voice's own sound (or the one for all) and volume */
  const mix = {};
  voices.forEach(v => { const o = vis(v.idx); mix[v.idx] = {reg: mixReg(o), gain: mixGain(o)}; });
  const spec = {
    mix, events, from: toPlayT(from), count: again ? 0 : st.countIn, unit: u, level: 1 / Math.sqrt(Math.max(1, voices.filter(v => vis(v.idx).play === true).length)),
    /* how many beats to the hand's pattern: three under a perfect sign */
    group: bi => { const T = mensInfo(metAt(top, bi * u / 2)).T; return T === 3 ? 3 : 2; },
    groupStart: bi => { let seg = 0; for (const m of top.mets) if (m.t <= bi * u / 2 + EPS) seg = m.t; return Math.round(seg * 2 / u); },
    onLoop: () => startPlay(0, true),     /* a repeat: no count-in again */
    onFrame: (ids, tNow, T) => {
      const now = new Set(ids);
      for (const id of [...on]) if (!now.has(id)) { on.delete(id); document.querySelectorAll('svg g.' + id).forEach(g => g.classList.remove('on')); }
      let first = null;
      for (const id of now) { const gs = document.querySelectorAll('svg g.' + id); if (!on.has(id)) { on.add(id); gs.forEach(g => g.classList.add('on')); } first = first || gs[0]; }
      if (first) { followHand(first); followPlay(first, tNow, T); }
    },
    onStop: () => { followT = 0; wideStop(); }
  };
  if (H.playSpec) H.playSpec(spec);
  Organ.play(spec);
}
/* where Play starts: the selected note, the start of a selected range, the caret, or the beginning */
function selStart(){
  if (!piece) return 0;
  if (ed.range) return ed.range.t0;
  if (ed.picks && ed.picks.length) return Math.min(...ed.picks.map(p => p.t));
  const s = selSym(); if (s) return s.t;
  if (ed.sel) { const v = piece.voices[ed.sel.vi], e = v && v.events[ed.sel.ei]; if (e) return e.t; }
  if (ed.ins) { const v = piece.voices[ed.ins.vi]; if (v) { const e = v.events[ed.ins.ei]; return (e ? e.t : v.end) + (ed.ins.off || 0); } }
  return 0;
}
/* Play always starts from the last selected note (or the beginning), never where Pause stopped (Samuel 2026-11-15) */
let heldAt = null;
function togglePlayHold(){
  selClicked = false; heldAt = null;
  if (play) stopPlay(); else startPlay();
}
/* A click on a note is a new start point, even on the note that is already selected: while playing, the music goes on from it at once;
   after a pause, Play starts there */
let selClicked = false;
pagesEl.addEventListener('pointerdown', e => {
  if (e.button || !e.target.closest || !e.target.closest('g[class^="n"]')) return;
  selClicked = true;
  if (play && ed.on) setTimeout(() => { if (play && (ed.sel || ed.range || ed.picks)) startPlay(selStart(), true); }, 30);
}, true);
$('#play').addEventListener('click', togglePlayHold);
/* While playing, the view follows the music (Samuel 2026-11-13, now that the frame is the whole window):
   horizontal Web: the sounding note stays in the middle, eased every frame so it never jerks;
   vertical: when the note leaves the view, quickly to its system; pages side by side: to its page.
   Touching the wheel or the screen hands the view back to the reader for a few seconds. */
let followT = 0, followHold = 0, followJump = 0;
const holdFollow = () => { followHold = performance.now() + 2500; wideStop(); };
viewerEl.addEventListener('wheel', holdFollow, {passive: true});
viewerEl.addEventListener('touchstart', holdFollow, {passive: true});
viewerEl.addEventListener('pointerdown', holdFollow, {passive: true});
/* Horizontal Web: the view is driven by the music's own time, not by the note being lit. Playing time is turned into a
   place on the line (between the columns, so it moves evenly through a note's width), led a little ahead and smoothed
   with a low-pass filter, and drawn in steps of whole pixels for the scroll plus the remaining fraction as a transform,
   so the motion has no stepping at any pixel ratio. */
function wideStop(){ wideFx = null; wideCache = null; pagesEl.style.transform = ''; }
function wideBuild(){
  const rect = pagesEl.querySelector('rect.stafhit'); if (!rect) return null;
  const pairs = (rect.dataset.tx || '').split(',').filter(Boolean).map(q => q.split(':').map(Number));
  if (pairs.length < 2) return null;
  const rr = rect.getBoundingClientRect(), vr = viewerEl.getBoundingClientRect();
  const sx = rr.width / (+rect.getAttribute('width') || 1), rx = +rect.getAttribute('x');
  return {pairs, sx, rx, A: rr.left - vr.left + viewerEl.scrollLeft};
}
function wideFollow(tNow, T, dt){
  const c = wideCache || (wideCache = wideBuild()); if (!c || !T) return;
  const tau = 0.5;
  const ts = (tNow - T.origin) / T.spm / 2 + tau / T.spm / 2;          /* in semibreves, a little ahead */
  const P = c.pairs; let x;
  if (ts <= P[0][0]) x = P[0][1];
  else if (ts >= P[P.length - 1][0]) x = P[P.length - 1][1];
  else { let i = 0; while (i + 2 < P.length && P[i + 1][0] < ts) i++; const [ta, xa] = P[i], [tb, xb] = P[i + 1]; x = tb > ta ? xa + (ts - ta) / (tb - ta) * (xb - xa) : xa; }
  const max = Math.max(0, viewerEl.scrollWidth - viewerEl.clientWidth);
  const target = Math.max(0, Math.min(max, c.A + (x - c.rx) * c.sx - viewerEl.clientWidth / 2));
  if (wideFx === null || Math.abs(viewerEl.scrollLeft - wideLast) > 2) wideFx = viewerEl.scrollLeft;
  const k = 1 - Math.exp(-dt / (Math.abs(target - wideFx) > viewerEl.clientWidth ? 0.04 : tau));
  wideFx += (target - wideFx) * k;
  const iv = Math.floor(wideFx);
  if (viewerEl.scrollLeft !== iv) viewerEl.scrollLeft = iv;
  wideLast = viewerEl.scrollLeft;
  pagesEl.style.transform = `translate3d(${(iv - wideFx).toFixed(3)}px,0,0)`;
}
function followPlay(el, tNow, T){
  const now = performance.now(), dt = followT ? Math.min(0.1, (now - followT) / 1000) : 0.016;
  followT = now;
  if (now < followHold || !el) return;
  const vr = viewerEl.getBoundingClientRect(), r = el.getBoundingClientRect();
  if (viewerEl.classList.contains('wide') && st.paper === 'web') { wideFollow(tNow, T, dt); return; }
  if (viewerEl.classList.contains('wide')) {
    const off = (r.left + r.width / 2) - (vr.left + vr.width / 2);
    if (Math.abs(off) < 0.5) return;
    const k = 1 - Math.exp(-dt / (Math.abs(off) > vr.width ? 0.05 : 0.3));
    viewerEl.scrollLeft += off * k;
    return;
  }
  if (viewerEl.classList.contains('horiz')) {
    const c = navItems().find(c => c.contains(el));
    if (c && c !== navItems()[navIndex()] && now > followJump) { followJump = now + 500; viewerEl.scrollTo({left: c.offsetLeft + c.offsetWidth / 2 - viewerEl.clientWidth / 2, behavior: webFit() ? 'auto' : 'smooth'}); }
    return;
  }
  if (viewerEl.classList.contains('frame')) {
    if (now < followJump) return;
    if (r.top < vr.top + 8 || r.bottom > vr.bottom - vr.height * 0.12) {
      followJump = now + 450;
      viewerEl.scrollTo({top: viewerEl.scrollTop + r.top - vr.top - vr.height * 0.22, behavior: 'smooth'});
    }
    return;
  }
  if (now > followJump) { followJump = now + 450; bringIntoView(el); }
}
/* the hand (and pendulum) stand beside the music that is sounding */
function followHand(el){
  if (st.view === 'choir') { handMid(el); return; }
  const wr = $('.viewwrap').getBoundingClientRect(), r = el.getBoundingClientRect();
  const hb = $('#handBox').getBoundingClientRect().height || 200;
  let y = Math.max(10, Math.round(r.top - wr.top + r.height / 2 - hb * 0.45));
  if (viewerEl.classList.contains('frame')) y = Math.min(y, Math.max(10, viewerEl.offsetHeight - hb - 10));
  if (Math.abs(y - handTop) < 24) return;
  handTop = y;
  $('#handBox').style.top = y + 'px'; $('#pendBox').style.top = y + 'px';
}

/* Choirbook: the hand stands still at the edge, halfway down the viewer (the opening, where the pages are not framed) */
function handMid(el){
  const hb = $('#handBox').getBoundingClientRect().height || $('#pendBox').getBoundingClientRect().height || 200;
  let y;
  if (viewerEl.classList.contains('frame') || viewerEl.classList.contains('horiz') || wrapEl.classList.contains('fs')) y = viewerEl.offsetTop + viewerEl.offsetHeight / 2 - hb / 2;
  else {
    const o = (el && el.closest('.opening')) || pagesEl.querySelector('.opening'); if (!o) return;
    const wr = wrapEl.getBoundingClientRect(), r = o.getBoundingClientRect();
    y = r.top - wr.top + r.height / 2 - hb / 2;
  }
  y = Math.max(10, Math.round(y));
  if (y === handTop) return;
  handTop = y;
  $('#handBox').style.top = y + 'px'; $('#pendBox').style.top = y + 'px';
}

/* full screen: the pages alone, with play and pause that show while the mouse moves */
let fsFake = false, fsTimer = 0, fsPaused = null;
const fsNative = () => (document.fullscreenElement || document.webkitFullscreenElement) === wrapEl;
function fsSync(){
  const on = fsNative() || fsFake;
  wrapEl.classList.toggle('fs', on);
  $('#fsBtn').setAttribute('aria-label', on ? 'Leave full screen' : 'Full screen'); $('#fsBtn').title = on ? 'Leave full screen' : 'Full screen';
  $('#fsIcon').setAttribute('d', on ? 'M8 3h2.4v7H3V7.6h5ZM13.6 3H16v4.6h5V10h-7.4ZM3 14h7.4v7H8v-4.6H3Zm10.6 0H21v2.4h-4.6V21h-2.8Z' : 'M3 3h7v2.4H5.4V10H3Zm11 0h7v7h-2.4V5.4H14ZM3 14h2.4v4.6H10V21H3Zm15.6 0H21v7h-7v-2.4h4.6Z');
  if (!on) fsPaused = null;
  fsWake(); render();
}
function fsFakeSet(on){
  fsFake = on;
  if (EMBED) try { window.parent.postMessage({[APP.msg + 'Full']: on}, '*'); } catch (e) {}
  setTimeout(fsSync, 60);
}
$('#fsBtn').addEventListener('click', () => {
  if (fsFake) return fsFakeSet(false);
  if (fsNative()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
  const req = wrapEl.requestFullscreen || wrapEl.webkitRequestFullscreen;
  if (req && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
    try { const pr = req.call(wrapEl); if (pr && pr.catch) pr.catch(() => fsFakeSet(true)); } catch (e) { fsFakeSet(true); }
  } else fsFakeSet(true);
});
document.addEventListener('fullscreenchange', fsSync); document.addEventListener('webkitfullscreenchange', fsSync);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && fsFake) fsFakeSet(false); });
function fsWake(){
  wrapEl.classList.remove('idle'); clearTimeout(fsTimer);
  if (wrapEl.classList.contains('fs')) fsTimer = setTimeout(() => { if (!$('#fsCtl').matches(':hover') && !$('#fsBtn').matches(':hover')) wrapEl.classList.add('idle'); }, 3000);
}
['pointermove', 'pointerdown', 'wheel'].forEach(t => wrapEl.addEventListener(t, fsWake, {passive: true}));
viewerEl.addEventListener('scroll', fsWake, {passive: true});
$('#fsPlay').addEventListener('click', () => { togglePlayHold(); fsWake(); });

/* the controls rest: after 3 s without the mouse moving, the top collapses into the Note input button and the arrow icon, and the
   bottom into Play and the volume; moving the mouse brings them back.
   On a touch screen nothing rests by itself: the controls stay until a tap on a blank place of the score hides them (and another tap, or a
   touch of any control, brings them back); a mouse moving over the page makes it behave as above again. */
{
  const root = document.documentElement;
  let timer = 0, topOn = true, botOn = true, wasOn = true;
  let touchMode = !!(window.matchMedia && matchMedia('(hover:none)').matches);
  const wide = () => window.innerWidth > 700;
  const hold = () => {
    if (!$('#handPop').hidden || document.querySelector('.pop.open, .pop:hover') || document.querySelector('.pop:has(:focus-visible)') || !libEl.hidden || !$('#tpSide').hidden) return true;
    const a = document.activeElement;
    return !!(a && /INPUT|SELECT|TEXTAREA/.test(a.tagName) && a.closest('.tools,.transport'));
  };
  const apply = (t, b) => {
    if (t === topOn && b === botOn) return;
    topOn = t; botOn = b;
    root.classList.toggle('ctl-top-idle', !t); root.classList.toggle('ctl-bot-idle', !b);
  };
  const rest = () => {
    if (!wide() || touchMode || root.classList.contains('focus')) return;
    if (hold()) { timer = setTimeout(rest, 1000); return; }
    apply(false, false);
  };
  const wake = e => {
    clearTimeout(timer);
    const pt = e && e.pointerType;
    if (pt === 'mouse' || pt === 'pen' || (e && e.type === 'wheel')) touchMode = false;
    else if (pt === 'touch' || (e && e.type === 'touchstart')) touchMode = true;
    apply(true, true);
    if (wide() && !touchMode) timer = setTimeout(rest, 3000);
  };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => document.addEventListener(t, wake, {passive: true}));
  window.addEventListener('resize', () => wake());
  /* a tap on a blank place of the score: the controls go (and come back with the next tap) */
  const NOT_BLANK = 'button, a, input, select, textarea, label, .pop, .library, .menu, #tpSide, .tools, .transport, .pagenav, .clefhit, .keyhit, .menshit, .mensadd, .markbar, .chant-sys, #chantBar, .ann-badge, #handBox, .handpop, #clefMenu, #keyMenu, #mensMenu, #notePick, g[class^="n"]';
  const blank = t => !!(t && t.closest && t.closest('.viewwrap') && !t.closest(NOT_BLANK) && !(ed.on && t.closest('rect.stafhit')));
  document.addEventListener('pointerdown', () => { wasOn = topOn || botOn; }, true);
  document.addEventListener('click', e => {
    if (!touchMode || !wide() || !blank(e.target)) return;
    if (wasOn) apply(false, false); else apply(true, true);
  });
  if (!touchMode) timer = setTimeout(rest, 3000);
}

/* the playback row stays at the bottom of the browser window. Alone it is simply fixed there; in the site's frame (which is as
   tall as the whole app) the page tells where the window's bottom is, and the row is put there */
{
  const tp = $('.transport'), root = document.documentElement;
  const place = () => {
    root.style.setProperty('--tph', tp.offsetHeight + 'px');
    let win = window.innerHeight; if (EMBED && DOCK) win = DOCK.vh;
    root.style.setProperty('--win', win + 'px');
    if (!EMBED || !DOCK) return;
    const h = tp.offsetHeight, main = document.querySelector('main.wrap'), docH = Math.max(main.offsetHeight, window.innerHeight);
    const lo = ($('.viewwrap').offsetTop || 0) + 80;
    const top = Math.max(Math.min(lo, docH - h), Math.min(docH - h, DOCK.vh - DOCK.top - h));
    root.style.setProperty('--tpTop', Math.round(top) + 'px');
    const sp = $('#tpSide'), sh = sp && !sp.hidden ? sp.offsetHeight : 0;
    root.style.setProperty('--spTop', Math.max(0, Math.round(top - sh - 8)) + 'px');
  };
  window.addEventListener('message', e => {
    const d = e.data && e.data.scriptoriumDock; if (!d || typeof d.top !== 'number') return;
    DOCK = {top: d.top, vh: d.vh, pageTop: typeof d.pageTop === 'number' ? d.pageTop : d.top}; place(); sizeViewer();
  });
  if (window.ResizeObserver) { new ResizeObserver(place).observe(tp); new ResizeObserver(place).observe($('#tpSide')); }
  $('#toggleSet').addEventListener('click', () => setTimeout(place, 0));
  window.addEventListener('resize', place);
  place();
  window.__dockPlace = place;
}

/* tell the site page how tall the app is (shared/frame-height.js, as in CantusFirmus) */
var postFrame = null;
function postHeight(){ if (EMBED && postFrame) requestAnimationFrame(postFrame); }
postFrame = frameHeight(APP.msg + 'Height');
let rw = 0, lastW = window.innerWidth;
let lastH = window.innerHeight;
window.addEventListener('resize', () => { if (window.innerWidth === lastW && !(webFit() && window.innerHeight !== lastH)) return; lastW = window.innerWidth; lastH = window.innerHeight; clearTimeout(rw); rw = setTimeout(() => { sizeViewer(); render(); }, 150); });
if (EMBED) try { window.top.addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { sizeViewer(); postHeight(); }, 150); }); } catch (e) {}

Organ.wire();
/* the organ samples' credit goes under the sound and temperament; the Tone column keeps every slider */
if ($('#tnCredit') && $('#soundCol')) $('#soundCol').appendChild($('#tnCredit'));

/* add-ons (Canon Maker's canon, ...): each is a function written as if it were part of this file */
for (const a of (APP.addons || [])) eval('(' + a + ')')();

/* phones: a top menu opens as a panel across the screen, just below its button (see the media query in the CSS) */
{
  const small = () => window.matchMedia('(max-width:1100px), (max-height:520px) and (orientation:landscape)').matches;
  /* medium windows: a menu keeps its own size, opens under (top row) or over (bottom row) its button, on the side of the button
     that has the room, and is only made smaller where the window is too narrow for it */
  const mid = () => window.matchMedia('(min-width:701px) and (max-width:1200px)').matches;
  const fitLeft = (r, w) => {
    const vw = document.documentElement.clientWidth, rightHalf = (r.left + r.right) / 2 > vw / 2;
    return Math.round(Math.max(8, Math.min(rightHalf ? r.right + 6 - w : r.left - 6, vw - 8 - w)));
  };
  const natural = pb => {   /* the menu's width as it will be drawn, measured while it is out of sight */
    const old = pb.style.cssText; pb.style.cssText += ';display:block !important;visibility:hidden !important';
    const w = pb.getBoundingClientRect().width; pb.style.cssText = old; return w;
  };
  const placeMid = btn => {
    const root = document.documentElement, r = btn.getBoundingClientRect(), vw = root.clientWidth;
    const pop = btn.closest('.pop'), pb = pop && pop.querySelector(':scope > .popbody');
    if (pb) root.style.setProperty('--popl', fitLeft(r, Math.min(natural(pb), vw - 4) - 20) + 'px');
    root.style.setProperty('--libl', fitLeft(r, Math.min(760, vw - 16)) + 'px');
    root.style.setProperty('--popbot', Math.round(window.innerHeight - r.top - 2) + 'px');
  };
  const place = btn => {
    if (window.matchMedia('(max-width:1200px)').matches && (btn.closest('.transport') || window.matchMedia('(max-width:1100px)').matches)) placeMid(btn);
    if (!small() || !btn.closest('.bar')) return;
    const r = btn.getBoundingClientRect(), bar = btn.closest('.bar').getBoundingClientRect();
    document.documentElement.style.setProperty('--poptop', Math.round(r.bottom - bar.top + 6) + 'px');
    document.documentElement.style.setProperty('--popabs', Math.round(r.bottom + 6) + 'px');
    document.documentElement.style.setProperty('--win', window.innerHeight + 'px');
  };
  const popBtn = e => e.target.closest && e.target.closest('.bar .popbtn, .transport .pop > button');
  document.addEventListener('click', e => { const b = popBtn(e); if (b) place(b); }, true);
  document.addEventListener('pointerenter', e => { const b = popBtn(e); if (b) place(b); }, true);
}
/* phones: while a menu of a sideways-scrolling row is open, the row stops being a scroll box (Safari on the iPhone cuts off, or hides,
   fixed menus inside one); the buttons keep their place, and the row scrolls again, where it was, once the menu closes */
{
  const rows = () => [...document.querySelectorAll('.tools .bar, .transport')];
  const sync = () => {
    for (const r of rows()) {
      const open = !!r.querySelector('.pop.open, #library:not([hidden]), #unitList:not([hidden])');
      if (open && !r.classList.contains('popup')) {
        r.dataset.sl = r.scrollLeft;
        r.style.setProperty('--sl', r.scrollLeft + 'px');
        r.classList.add('popup');
      } else if (!open && r.classList.contains('popup')) {
        r.classList.remove('popup');
        r.scrollLeft = +r.dataset.sl || 0;
      }
    }
  };
  const mo = new MutationObserver(sync);
  for (const r of rows()) mo.observe(r, {subtree: true, attributes: true, attributeFilter: ['class', 'hidden']});
  /* with a mouse, the wheel scrolls a row that is too wide sideways */
  for (const r of rows()) r.addEventListener('wheel', e => {
    if (e.target.closest && e.target.closest('.popbody, .library')) return;   /* a menu scrolls itself, not the row */
    if (r.scrollWidth <= r.clientWidth + 1 || r.classList.contains('popup') || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    r.scrollLeft += e.deltaY; e.preventDefault();
  }, {passive: false});
}
/* Pop-ups stay in bounds (Samuel 2026-11-16): every menu, drop-down and panel (the sign, clef and key menus, the library, the
   toolbar drop-downs ...) is kept between the top and bottom rows of controls: never over them, never off the window. If it is
   too tall for the room, it gets a scroll bar of its own; if it only stands a little too high or low, it is moved over. */
{
  const CAND = '.popbody, .menu, #library, .library';
  document.head.insertAdjacentHTML('beforeend', '<style>:root{--glass-bg:58%}html,body,body *:not(input):not(textarea):not([contenteditable]){-webkit-user-select:none !important;user-select:none !important;-webkit-touch-callout:none !important}input,textarea,[contenteditable]{-webkit-user-select:text !important;user-select:text !important;-webkit-touch-callout:default !important}#popView .staffset{grid-template-columns:auto minmax(150px,auto)}#pages svg .ledger,#pages svg .barl,#pages svg .tie,#pages svg .ms{stroke:var(--note-ink,var(--leaf-ink))}#pages svg use,#pages svg .ink{fill:var(--note-ink,var(--leaf-ink));color:var(--note-ink,var(--leaf-ink))}html.playing #pages g.sel:not(.on) use,html.playing #pages g.sel:not(.on) .ink{fill:var(--note-ink,var(--leaf-ink));color:var(--note-ink,var(--leaf-ink))}html.playing #pages g.sel:not(.on) .ledger{stroke:var(--note-ink,var(--leaf-ink))}#pages svg text.lyr{font-family:var(--lyr-font,"IM Fell English","Palatino Linotype",Palatino,Georgia,serif)}.staffset .subhead{grid-column:1/-1;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);opacity:.78;padding-top:6px;margin-top:2px;border-top:1px solid color-mix(in srgb,var(--line) 65%,transparent)}.staffset .subhead:first-child{padding-top:0;margin-top:0;border-top:0}.staffset .lab-lock{display:inline-flex;align-items:center;gap:5px}.lockbtn{display:inline-grid;place-items:center;width:22px;height:22px;padding:0;border:0 !important;outline:none;box-shadow:none !important;border-radius:5px;background:transparent !important;color:var(--muted) !important;cursor:pointer;opacity:.78;transition:opacity .12s,background .12s}.lockbtn svg{width:14px;height:14px;fill:currentColor;display:block}.lockbtn[aria-pressed="true"]{color:var(--muted) !important;background:transparent !important;box-shadow:none !important;border:0 !important;opacity:.85}.lockbtn:hover,.lockbtn[aria-pressed="true"]:hover:not(:disabled){background:color-mix(in srgb,var(--ink) 8%,transparent) !important;color:var(--muted) !important;border-color:transparent !important;opacity:1}.pt-field{display:inline-flex;align-items:center;gap:5px}.pt-field input{width:62px;height:var(--h);padding:0 7px;border:1px solid var(--line);border-radius:6px;background:var(--surface,#F4EDE0);color:var(--ink);font:inherit;font-size:14px;font-variant-numeric:tabular-nums}.pt-field span{color:var(--muted);font-size:13px}.lines-ctl{align-items:center;gap:4px !important}#linesNum{width:52px;height:var(--h);padding:0 6px;border:1px solid var(--line);border-radius:6px;background:var(--surface,#F4EDE0);color:var(--ink);font:inherit;font-size:14px;font-variant-numeric:tabular-nums;margin-left:2px}#pages .seclab{cursor:pointer}@media (hover:hover){#pages .seclab:hover{fill:var(--accent);color:var(--accent)}}.sec-ed{position:absolute;z-index:40;min-width:140px;max-width:280px;padding:3px 7px;border:1.5px solid var(--accent);border-radius:5px;background:var(--ground,#FBF7EF);color:var(--ink);font-family:"IM Fell English","Palatino Linotype",Palatino,Georgia,serif;font-style:italic;font-size:15px;box-shadow:0 4px 14px rgba(42,34,24,.22);outline:none}.vfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}#popVoices.open .popbody{display:block !important}#staffCombine{padding:6px 8px;min-width:290px;max-width:360px;display:flex;flex-direction:column;gap:8px}#staffCombine[hidden]{display:none !important}.sc-head{display:flex;align-items:center;gap:8px}.sc-title{font-size:13px;font-weight:700;color:var(--ink)}.sc-presets{display:flex;gap:6px;flex-wrap:wrap}.sc-presets .tb,.sc-back{font-size:12px;height:26px;padding:0 9px}.sc-rows{display:flex;flex-direction:column;gap:5px}.sc-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.sc-name{font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}.sc-pills{display:flex;gap:3px}.sc-pill{min-width:26px;height:24px;padding:0 6px;border:1px solid var(--line);border-radius:5px;background:transparent;color:var(--muted);font:inherit;font-size:12px;cursor:pointer}.sc-pill[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}.sc-staves{border-top:1px solid color-mix(in srgb,var(--line) 65%,transparent);padding-top:6px;display:flex;flex-direction:column;gap:5px}.sc-sub{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.sc-srow{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;color:var(--ink)}.sc-slbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}.sc-clef{font-size:12px;height:26px}body.layer2 #pages{--sel:#1B56B8;--accent:#1B56B8}.v2btn{font-family:"IM Fell English","Palatino Linotype",Palatino,Georgia,serif;font-weight:700;font-size:14px;letter-spacing:-.02em;padding:0 6px !important;width:auto !important;min-width:30px}.v2btn[aria-pressed="true"]{background:#1B56B8 !important;border-color:#1B56B8 !important;color:#fff !important}.embedded .wrap{padding-top:0 !important}.embedded .viewer{padding-top:0 !important}.rng-wrap{display:flex;flex-direction:column;min-width:150px}.rng-wrap input[type=range]{width:100%;margin:0}.rng-meta{display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:11px;line-height:1.2;font-variant-numeric:tabular-nums;opacity:0;max-height:0;overflow:hidden;margin-top:0;pointer-events:none;transition:opacity .14s ease,max-height .14s ease,margin-top .14s ease}.rng-wrap:hover .rng-meta,.rng-wrap:focus-within .rng-meta,.rng-wrap.active .rng-meta{opacity:1;max-height:22px;margin-top:2px;pointer-events:auto}.rng-bound{appearance:none;border:0;background:transparent;padding:0 3px;margin:0;font:inherit;color:var(--muted);cursor:pointer;border-radius:3px;border-bottom:1px dotted color-mix(in srgb,var(--muted) 55%,transparent)}.rng-bound:hover{color:var(--ink);background:color-mix(in srgb,var(--ink) 7%,transparent)}.rng-val{color:var(--accent);font-weight:600;padding:0 4px}.rng-edit{width:46px;font:inherit;font-size:11px;padding:0 3px;border:1px solid var(--accent);border-radius:3px;background:var(--ground,#FBF7EF);color:var(--ink);text-align:center;outline:none}.rng-edit::-webkit-inner-spin-button,.rng-edit::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pages .ed-grid{pointer-events:none}#pages .ed-grid .eg-tick{stroke:var(--sel);stroke-width:.11;opacity:.45}#pages .ed-grid .eg-tick.maj{stroke-width:.15;opacity:.75}#pages .ed-grid .eg-line{stroke:var(--sel);stroke-width:.08;stroke-dasharray:.26 .26;opacity:.13}#pages .ed-grid .eg-line.maj{opacity:.24}#pages .ed-grid .eg-line.tail{opacity:.24}@media print{#pages .ed-grid{display:none !important}}.popbody:not(.pop-scroll-y),.tools .bar .popbody:not(.pop-scroll-y),.transport .popbody:not(.pop-scroll-y){overflow:visible !important;max-height:none !important}.popbody.pop-scroll-y,.tools .bar .popbody.pop-scroll-y,.transport .popbody.pop-scroll-y{overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:thin !important}.popbody.pop-scroll-y::after{bottom:0 !important;right:0 !important}.popbody,.menu,.library,#library,.handpop,#tpSide,.tools .podg,.transport .podg{background-color:var(--surface,#F4EDE0) !important;background:color-mix(in srgb,var(--ground,#FBF7EF) var(--glass-bg,58%),transparent) !important;-webkit-backdrop-filter:blur(10px) saturate(1.08) !important;backdrop-filter:blur(10px) saturate(1.08) !important}.popbody,.menu,.library,#library,.handpop,#tpSide{border:1px solid color-mix(in srgb,var(--line) 78%,rgba(255,255,255,.45)) !important;box-shadow:0 12px 32px -10px rgba(42,34,24,.28),inset 0 1px 0 rgba(255,255,255,.38) !important}#library::before{content:"";position:absolute;left:0;right:0;top:-14px;height:14px}#library[data-mode="rep"]{min-height:min(62vh,520px)}.library .libtools{background:color-mix(in srgb,var(--ground,#FBF7EF) 88%,transparent) !important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:6px}html.dark .popbody,html.dark .menu,html.dark .library,html.dark #library,html.dark .handpop,html.dark #tpSide{box-shadow:0 14px 34px -10px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08) !important}.tools:has(#library:not([hidden])){z-index:70 !important}#libPod:has(#library:not([hidden])),.podg:has(#library:not([hidden])){z-index:60 !important}.bar .podg:has(#library:not([hidden])){transform:none !important;filter:none !important}.podg:has(.pop:hover),.podg:has(.pop.open),.podg:has(:focus-visible),.podg:has(#library:not([hidden])),.libwrap:has(#library:not([hidden])),html.no-glass .popbody,html.no-glass .menu,html.no-glass .library,html.no-glass #library,html.no-glass .handpop,html.no-glass #tpSide,html.no-glass .tools .podg,html.no-glass .transport .podg,html.no-glass .library .libtools{-webkit-backdrop-filter:none !important;backdrop-filter:none !important}html.no-glass .popbody,html.no-glass .menu,html.no-glass .library,html.no-glass #library,html.no-glass .handpop,html.no-glass #tpSide,html.no-glass .tools .podg,html.no-glass .transport .podg,html.no-glass .library .libtools{background:var(--ground,#FBF7EF) !important}</style>');
  {
    const gr = $('#glassRange');
    const applyGlass = v => {
      const n = Math.max(0, Math.min(0.95, isNaN(+v) ? 0.42 : +v));
      document.documentElement.classList.toggle('no-glass', n <= 0.005);
      document.documentElement.style.setProperty('--glass-bg', Math.round((1 - n) * 100) + '%');
      if (gr) gr.value = String(n);
    };
    const saved = st.glass !== undefined ? st.glass : 0.42;
    applyGlass(saved);
    if (gr) gr.addEventListener('input', e => { st.glass = +e.target.value; applyGlass(st.glass); save(); });
  }
  const vis = el => el.getClientRects().length > 0 && !el.hidden;
  let fitting = false, rq = 0;
  /* the room: below the top rows (the row the menu belongs to, or all of them) and above the playback row */
  function band(el){
    const H = (EMBED && DOCK && DOCK.vh) ? Math.min(window.innerHeight, DOCK.vh - Math.max(0, DOCK.top)) : window.innerHeight, pad = 6;
    let top = pad, bottom = H - pad;
    /* the controls themselves, not what is inside a menu */
    const bars = [...document.querySelectorAll('.tools .bar:not([hidden]) .podg, .tools .bar:not([hidden]) .libwrap')].filter(b => vis(b) && !b.parentElement.closest('.popbody, .menu, .library'));
    /* a drop-down of a row of controls opens right under its own button (it may cover the row below, as drop-downs do); a menu
       that belongs to no row (sign, clef, key, panels) keeps clear of every row at the top */
    const own = el.closest && el.closest('.tools .bar');
    for (const b of bars) {
      if (own && !own.contains(b)) continue;
      /* a menu of a row may reach up over the bottom of its button (its transparent margin is part of the menu for the mouse), so
         that no gap lies between them */
      top = Math.max(top, b.getBoundingClientRect().bottom + (own ? -6 : pad));
    }
    const tp = [...document.querySelectorAll('.transport .podg, .transport #play')].filter(b => vis(b) && !b.parentElement.closest('.popbody, .menu'));
    const inTp = el.closest && el.closest('.transport');
    if (tp.length && !inTp) bottom = Math.min(bottom, Math.min(...tp.map(b => b.getBoundingClientRect().top)) - pad);
    /* a menu of the playback row may reach down over the top of its own button (its margin for the mouse), so no gap lies between them */
    if (tp.length && inTp) { const own = el.closest('.podg'); bottom = Math.min(bottom, (own ? own.getBoundingClientRect().top : Math.min(...tp.map(b => b.getBoundingClientRect().top))) + 14); }
    return {top, bottom: Math.max(bottom, top + 80)};
  }
  function fit(el){
    const st = el.scrollTop;
    el.style.removeProperty('max-height'); el.style.removeProperty('max-width'); el.style.removeProperty('overflow-y'); el.style.removeProperty('overflow-x'); el.classList.remove('pop-scroll-y'); el.style.translate = ''; el.style.removeProperty('--bridge');
    if (!vis(el)) return;
    const B = band(el);
    let r = el.getBoundingClientRect();
    const room = B.bottom - B.top;
    if (r.height > room) {
      el.style.setProperty('max-height', Math.floor(room) + 'px', 'important');
      el.classList.add('pop-scroll-y');
      if (st) el.scrollTop = st;
      r = el.getBoundingClientRect();
    }
    /* the same sideways: inside the window */
    const W = window.innerWidth, padX = 6, roomX = W - 2 * padX;
    if (r.width > roomX) {
      el.style.setProperty('max-width', Math.floor(roomX) + 'px', 'important');
      r = el.getBoundingClientRect();
    }
    let dy = 0, dx = 0;
    if (r.top < B.top) dy = B.top - r.top;
    else if (r.bottom > B.bottom) dy = B.bottom - r.bottom;
    if (r.left < padX) dx = padX - r.left;
    else if (r.right > W - padX) dx = W - padX - r.right;
    if (dx || dy) el.style.translate = Math.round(dx) + 'px ' + Math.round(dy) + 'px';
    /* a menu moved down away from its button stays open while the pointer crosses the gap (an invisible bridge, see the CSS) */
    if (dy > 0) el.style.setProperty('--bridge', String(Math.round(dy))); else el.style.removeProperty('--bridge');
  }
  function fitAll(){
    if (fitting) return; fitting = true;
    try { document.querySelectorAll(CAND).forEach(fit); } finally { fitting = false; }
  }
  const later = () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; fitAll(); setTimeout(fitAll, 60); }); };
  document.addEventListener('pointerenter', e => { if (e.target && e.target.closest && e.target.closest('.popbody, .library') && !e.target.matches('.popbody, .library')) return; later(); }, true);
  for (const t of ['pointerdown', 'focusin', 'click', 'toggle', 'transitionend']) document.addEventListener(t, later, true);
  window.addEventListener('resize', later);
  window.addEventListener('scroll', e => { if (e.target && e.target.closest && e.target.closest('.popbody, .menu, .library')) return; later(); }, true);
  new MutationObserver(ms => { if (ms.some(m => !(m.target.closest && m.target.closest('#pages')))) later(); })
    .observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'open', 'aria-expanded']});
  window.__fitMenus = fitAll;
}
/* start */
if (H.start) H.start(); else (async () => {
  try { await document.fonts.load('100px "IM Fell English"'); await document.fonts.load('italic 100px "IM Fell English"'); } catch (e) {}
  if (H.preStart) { try { await H.preStart(); } catch (e) {} }
  const qs = new URLSearchParams(location.search);
  const want = qs.get('piece');
  pieceKey = MOVED[want || st.piece] || want || st.piece || FIRST;
  try { const fv = favAll(); let ch = false; for (const k of Object.keys(fv)) if (MOVED[k]) { if (!fv[MOVED[k]]) fv[MOVED[k]] = fv[k]; delete fv[k]; ch = true; } if (ch) favSave(fv); } catch (e) {}
  if (want && qs.get('bar')) {
    const from = parseInt(qs.get('bar'), 10), to = parseInt(qs.get('to') || qs.get('bar'), 10);
    if (from > 0) mark = {piece: want, from, to: Math.max(from, to || from)};
  }
  try { minePrune(pieceKey); } catch (e) {}
  syncUI(); sizeViewer();
  if (await takeHandoff().catch(() => false)) { buildPieceList().then(syncUI); return; }
  try {
    if (pieceKey.startsWith('file:')) { const k = fileKept(); if (k && 'file:' + k.name === pieceKey) loadText(k.name, k.text); else throw new Error('x'); }
    else await loadPiece(pieceKey);
  }
  catch (e) {
    if (!want && FIRST && pieceKey !== FIRST) { pieceKey = FIRST; try { await loadPiece(pieceKey); } catch (e2) { pagesEl.innerHTML = `<p class="msg">${esc(e2.message)}</p>`; } }
    else pagesEl.innerHTML = `<p class="msg">${e.html || esc(e.message)}</p>`;
  }
  buildPieceList().then(syncUI);
  if (/[?&]print=1/.test(location.search)) setTimeout(() => window.print(), 600);
})();
window.__cb = Object.assign({st, get ed(){ return ed; }, noteAt, mensTest, mensCheck, pieceUrl, get piece(){ return piece; }, render, parseKern, notate, ed, writeKern, CBA, insertEvent, undo, redo, startPlay, get pieceKey(){ return pieceKey; }}, H.expose ? H.expose() : {});
})();

/* Acknowledgments: a panel over the viewing area; the text is the one of choirbook-acknowledgements.html. It opens by itself
   the first time someone uses the apps in a browser (the key carries a version: change it when the text changes materially). */
{
  const ov = document.querySelector('#ackOv'), body = document.querySelector('#ackBody'), AKEY = 'scriptorium:ack:v1';
  let loaded = false;
  const fill = async () => {
    if (loaded) return; loaded = true;
    try {
      const t = await (await fetch('../choirbook-acknowledgements.html')).text();
      const m = new DOMParser().parseFromString(t, 'text/html').querySelector('main.ack');
      if (!m) throw 0;
      m.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
      body.innerHTML = m.innerHTML;
    } catch (e) { loaded = false; body.innerHTML = '<p>The acknowledgments could not be loaded just now. <a href="../choirbook-acknowledgements.html" target="_top">Open the page</a>.</p>'; }
  };
  const remember = () => { try { localStorage.setItem(AKEY, '1'); } catch (e) {} };
  const open = () => { fill(); ov.hidden = false; body.scrollTop = 0; document.querySelector('#ackX').focus({preventScroll: true}); };
  const shut = () => { if (ov.hidden) return; ov.hidden = true; remember(); document.querySelector('#ackBtn').focus({preventScroll: true}); };
  document.querySelector('#ackBtn').addEventListener('click', e => { e.stopPropagation(); ov.hidden ? open() : shut(); });
  document.querySelector('#ackX').addEventListener('click', shut);
  ov.addEventListener('click', e => { if (e.target === ov) shut(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) { e.stopPropagation(); shut(); } }, true);
  let seen = false; try { seen = !!localStorage.getItem(AKEY); } catch (e) { seen = true; }
  if (!seen && !/[?&](print|example)=1/.test(location.search)) setTimeout(open, 600);
}
