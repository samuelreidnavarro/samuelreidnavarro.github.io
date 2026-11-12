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
  const LIBBTN = `<button class="tb" id="libBtn" aria-haspopup="true" aria-expanded="false" aria-controls="library">${esc(L.lib)}</button>`;
  const NEWBTN = `<button class="tb" id="newBtn" title="${esc(L.newTitle)}">${esc(L.newScore)}</button>`;
  document.body.insertAdjacentHTML('afterbegin', `<main class="wrap">
  <header class="top"><h1>${esc(APP.name)}</h1></header>

  <section class="tools" aria-label="View">
    <div class="bar">
      <div class="podg" id="editPod"><button class="ib" id="editBtn" aria-pressed="false" aria-label="Edit" title="Edit: change, add and remove notes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 17.3 14.8 6l3.2 3.2L6.7 20.5 3 21Zm13.7-12.6 1.4-1.4a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1l-1.4 1.4Z"/></svg></button></div>
${APP.popsBeforeVoices || ''}
      <div class="podg"><div class="pop" id="popVoices">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Voices<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><table class="voices" id="voiceTable"></table></div>
      </div></div>
      <div class="podg"><div class="pop" id="popPage">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Page<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="staffset">
          <span class="lab">View</span><div class="btns" id="viewList" role="group" aria-label="View"><button class="tb" data-v="score">Score</button><button class="tb" data-v="parts">Parts</button><button class="tb" data-v="choir">Choirbook</button></div>
          <span class="lab">Size</span><div class="btns" id="paperSeg" role="group" aria-label="Paper size"><button class="tb" data-v="A3">A3</button><button class="tb" data-v="A4">A4</button><button class="tb" data-v="A5">A5</button><button class="tb" data-v="web">Web</button></div>
          <span class="lab">Orientation</span><div class="btns" id="orientSeg" role="group" aria-label="Orientation"><button class="tb" data-v="portrait">Portrait</button><button class="tb" data-v="landscape">Landscape</button></div>
          <span class="lab">Pages</span><div class="btns" id="flowSeg" role="group" aria-label="Pages"><button class="tb" data-v="vertical">Vertical</button><button class="tb" data-v="horizontal">Horizontal</button></div>
        </div></div>
      </div></div>
      <div class="podg"><div class="pop" id="popLook">
        <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Appearance<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
        <div class="popbody"><div class="staffset">
          <span class="lab">Notation</span><div class="btns" id="notaSeg" role="group" aria-label="Notation"><button class="tb" data-v="real">Mensural</button><button class="tb" data-v="fake">Modern</button></div>
          <span class="lab">Clefs</span><div class="btns" id="clefSeg" role="group" aria-label="Clefs"><button class="tb" data-v="modern">Modern</button><button class="tb" data-v="mens">Old</button></div>
          <span class="lab">Barlines</span><div class="btns" id="barSeg" role="group" aria-label="Barlines"><button class="tb" data-v="none">None</button><button class="tb" data-v="tick">Ticks</button><button class="tb" data-v="full">Through the staff</button></div>
          <span class="lab">Staff colour</span><div class="swatches" id="staffSeg" role="group" aria-label="Staff colour"></div>
          <span class="lab">Staff lines</span><div class="btns" id="linesSeg" role="group" aria-label="Staff lines"><button class="tb" data-v="5">Five</button><button class="tb" data-v="4">Four</button></div>
          <span class="lab">Paper</span><div class="swatches" id="paperColSeg" role="group" aria-label="Paper colour"></div>
          <span class="lab">Dark room</span><div class="btns" id="darkSeg" role="group" aria-label="Dark room"><button class="tb" data-v="on">On</button><button class="tb" data-v="off">Off</button></div>
          <label class="ctl" for="size">Staff size</label><input type="range" id="size" min="1" max="4" step="0.05">
          <label class="ctl" for="hs">Horizontal spacing</label><input type="range" id="hs" min="0" max="1.2" step="0.01">
          <label class="ctl" for="vs">Vertical spacing</label><input type="range" id="vs" min="0" max="2" step="0.02">
          <label class="ctl" for="ss">Space between systems</label><input type="range" id="ss" min="0" max="3" step="0.05">
          <span class="lab">Syllable dashes</span><div class="btns" id="dashSeg" role="group" aria-label="Syllable dashes"><button class="tb" data-v="on">On</button><button class="tb" data-v="off">Off</button></div>
          <span class="lab">Editorial accidentals</span><div class="btns" id="edSeg" role="group" aria-label="Editorial accidentals"><button class="tb" data-v="on">On</button><button class="tb" data-v="off">Off</button></div>
          <label class="ctl" for="handOp">Hand opacity</label><input type="range" id="handOp" min="0.05" max="1" step="0.05">
          <label class="ctl" for="handSize">Hand size</label><input type="range" id="handSize" min="0.4" max="2.5" step="0.05">
          <span class="lab" id="verseLab">Verse</span><div class="btns" id="verseSeg" role="group" aria-label="Verse"></div>
        </div></div>
      </div></div>
      <div class="grow">
        <div class="podg"><div class="pop" id="popInfo">
          <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Info<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
          <div class="popbody"><div class="pagemeta infobox"><label class="lab" for="metaTitle">Title</label><input id="metaTitle" type="text" autocomplete="off"><label class="lab" for="metaComp">Composer</label><input id="metaComp" type="text" autocomplete="off"><span class="lab">Source</span><div id="infoSrc"></div></div></div>
        </div></div>
        <div class="podg" id="libPod"><div class="libwrap"><div class="pop" id="popOpen">
          <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Open<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
          <div class="popbody"><div class="btns col" id="openList">
${APP.newFirst ? NEWBTN + LIBBTN : LIBBTN + NEWBTN}
            <button class="tb" id="openBtn" title="MusicXML, MuseScore, MIDI, LilyPond or **kern"${APP.openFile === false ? ' hidden' : ''}>Open file</button>
          </div></div>
        </div>
          <div id="library" class="library" role="dialog" aria-label="Pieces" hidden></div>
        </div></div>
        <div class="podg">
          <div class="pop" id="popSend">
            <button class="tb popbtn ib sendbtn" aria-haspopup="true" aria-expanded="false" aria-label="Open in another app" title="Open this score in another app"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.5h6.5V10h-2V6.9l-6.8 6.8-1.4-1.4 6.8-6.8H14ZM4.5 6.5h7v2h-5v9h9v-5h2v7h-13Z"/></svg></button>
            <div class="popbody"><div class="btns col" id="sendList"></div></div>
          </div>
        </div>
        <div class="podg">
          <div class="pop" id="popExport">
            <button class="tb popbtn" aria-haspopup="true" aria-expanded="false">Export<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
            <div class="popbody"><div class="btns col" id="exportList">
              <div class="btns duo"><button class="tb" id="printBtn" title="Print, or save as PDF in the print window">Download PDF</button><button class="tb" id="mxlBtn" title="MusicXML (.mxl), for MuseScore, Dorico, Sibelius, Finale: in modern notation">Download MXL</button></div>
              <button class="tb" id="saveBtn" title="Save this piece, with your changes, as a .krn file">Download .krn</button>
              <button class="tb" id="keepBtn" title="Keep a copy of this piece, with your changes, in ${esc(L.mine)}"${APP.keep === false ? ' hidden' : ''}>Save to ${esc(L.mine)}</button>
              <div class="btns duo"><button class="tb" id="svgBtn" title="The page you see, as an SVG picture">Download SVG</button><button class="tb" id="pngBtn" title="The page you see, as a PNG picture">Download PNG</button></div>
              <button class="tb" id="linkBtn" title="A link that opens this score, with your changes, for anyone">Copy link</button>
            </div></div>
          </div>
        </div>
      </div>
      <input type="file" id="fileIn" accept=".krn,.kern,.txt,.musicxml,.xml,.mxl,.mscz,.mscx,.mid,.midi,.ly" hidden>
    </div>
    <div class="bar editbar" id="editBar" hidden></div>
  </section>

  <div class="markbar" id="markBar" hidden><span id="markTxt"></span><button id="markClear">Clear marking</button></div>
  <div class="viewwrap">
    <section class="viewer" id="viewer" aria-label="Music"><div id="pages"></div></section>
    <button class="fsbtn" id="fsBtn" aria-label="Full screen" title="Full screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path id="fsIcon" d="M3 3h7v2.4H5.4V10H3Zm11 0h7v7h-2.4V5.4H14ZM3 14h2.4v4.6H10V21H3Zm15.6 0H21v7h-7v-2.4h4.6Z"/></svg></button>
    <div class="fsctl" id="fsCtl"><button id="fsPlay" aria-label="Play" title="Play"><svg viewBox="0 0 14 14" aria-hidden="true"><path id="fsPlayIcon" d="M3 1.5 12.5 7 3 12.5Z"/></svg></button></div>
    <button class="pagenav prev" id="pgPrev" aria-label="Previous page" title="Previous page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.6-1.6L11.2 12 17 6.2Z"/></svg></button>
    <div id="countBox" aria-live="off" hidden></div>
    <ul id="clefPick" class="menu" role="menu" aria-label="Clef" hidden></ul>
    <button class="pagenav next" id="pgNext" aria-label="Next page" title="Next page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4L7 17.8 12.8 12 7 6.2Z"/></svg></button>
    <div class="handbox" id="handBox" title="The tactus: the hand drops on one beat and lifts on the next" aria-hidden="true"><svg viewBox="-20 -36 236 190"><g id="handRot"></g></svg></div><div class="handbox pendbox" id="pendBox" aria-hidden="true"><svg viewBox="-20 -36 236 190"><g id="pendG"><path d="M66 158 H130 L120 142 H76Z" fill="currentColor"/><g id="pendRot"><line x1="98" y1="150" x2="98" y2="-16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="84" y="14" width="28" height="34" rx="4" fill="currentColor"/></g></g></svg></div>
  </div>

  <p class="srcnote" id="srcNote"></p>
  <section class="transport" aria-label="Playback and sound">
    <div class="tp-main">
    <button id="play" aria-label="Play" title="Play (space bar)"><svg viewBox="0 0 14 14" aria-hidden="true"><path id="playIcon" d="M2 1 13 7 2 13Z"/></svg><span>Play</span></button>
    <div class="tp-stack">
    <div class="podg" id="podModes">
    <button id="loop" aria-pressed="false" title="Repeat until stopped; adds a repeat sign at the end">Loop</button>
    <button id="mic" aria-pressed="false" title="Sing along: the microphone shows the note you sing as a faint red dot on the staff of your voice"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14.6a3.4 3.4 0 0 0 3.4-3.4V5.4a3.4 3.4 0 0 0-6.8 0v5.8a3.4 3.4 0 0 0 3.4 3.4Zm6-3.5a6 6 0 0 1-12 0H4.3a7.7 7.7 0 0 0 6.8 7.6V22h1.8v-3.3a7.7 7.7 0 0 0 6.8-7.6Z"/></svg><span>Sing</span></button>
    <div class="pop" id="popSing">
      <button class="tb popbtn singopts" aria-haspopup="true" aria-expanded="false" aria-label="Sing options" title="Sing options"><svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
      <div class="popbody">
        <div class="latrow singrow"><label for="singVoice">I sing</label><select id="singVoice" title="The voice you sing: the dot shows on its staff. Automatic: the first voice whose Playback is off (Voices), else the one you are editing, else the top voice"></select></div>
        <div class="btns col" role="group" aria-label="Sing options">
        <button class="tb" id="micFlex" data-keep aria-pressed="true" title="On: the dot follows your exact pitch, a little above or below its note when you are sharp or flat. Off: it sits on the nearest note">Flexible pitch</button>
        <button class="tb" id="micDia" data-keep aria-pressed="false" title="What you sing is written with the notes of the scale only (B or B flat as your voice has it), never a chromatic note">Diatonic</button>
        <button class="tb" id="micNotate" data-keep aria-pressed="true" title="While the music plays, what you sing is written out as a voice of its own, Sung, under your voice">Notate what I sing</button>
        <button class="tb" id="micPhones" data-keep aria-pressed="false" title="On: no filtering, so unisons and octaves with the organ show too. Off: the organ is filtered out of what the microphone hears, for singing along through speakers">Headphones</button>
        </div>
        <div class="latrow" title="The time from the organ sounding to your voice reaching the microphone, so what you sing is written in the right place. Empty: worked out by itself">
          <label for="micLat">Latency</label><input type="number" id="micLat" min="0" max="600" step="1" inputmode="numeric" placeholder="auto"><span>ms</span>
          <button class="tb" id="micClap" data-keep title="Eight clicks: clap with each one, and the latency is measured">Clap test</button>
        </div>
      </div>
    </div>
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
        <label class="ctl vol" title="Volume"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.2h3.9L12.6 5v14l-5.2-4.2H3.5Zm11.6-1.1a5.5 5.5 0 0 1 0 7.8l-1.2-1.2a3.8 3.8 0 0 0 0-5.4Zm2.7-2.7a9.3 9.3 0 0 1 0 13.2l-1.2-1.2a7.6 7.6 0 0 0 0-10.8Z"/></svg><span class="sr">Volume</span><input type="range" id="vol" min="0" max="100" step="1"></label>
        <label class="ctl hzctl" title="The pitch of a′ in Hz">a′<span class="eqs"> =</span><input type="number" id="ref" min="100" max="1000" step="any" inputmode="decimal" aria-label="Pitch of a′ in Hz">Hz</label>
        <button id="toggleSet" aria-expanded="false" aria-controls="tpSide" title="Show or hide all the sound settings">Sound<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2 6 8.4 10 4.2 8.9 3.1 6 6.1 3.1 3.1Z"/></svg></button>
      </div>
    </div>
  </section>

  <section class="tp-side" id="tpSide" aria-label="Sound settings" hidden>
    <div class="tcol">
      <label for="reg">Sound</label><select id="reg"><option value="gedackt">Gedackt 8′ (stopped flute)</option><option value="principal">Principal 8′</option><option value="plenum">Principal chorus (8′ 4′ 2′)</option><option value="flute">Open flute 8′</option><option value="regal">Regal (soft reed)</option><option value="sine">Sine</option><option value="custom">Your own (drawbars)</option></select>
      <div class="tg">Tone</div>
      <label for="bright">Brightness</label><input type="range" id="bright" min="0" max="100" step="1"><output id="bo"></output>
      <label for="room">Room</label><input type="range" id="room" min="0" max="100" step="1"><output id="ro"></output>
      <label class="check"><input type="checkbox" id="audition"> Hear notes while editing</label>
      <button id="copySound" title="Copies the current sound settings as text, to send to whoever is tuning the sound">Copy sound settings</button>
    </div>
    <div class="tune" id="tune"></div>
  </section>

  <div id="toast" role="status" aria-live="polite"></div>
</main>`);
  if (!document.getElementById('pagerule')) document.head.insertAdjacentHTML('beforeend', '<style id="pagerule">@page{size:A4 portrait;margin:0}</style>');
  document.title = APP.name;
}
let EMBED = false;
try { EMBED = window.self !== window.top; } catch (e) { EMBED = true; }
if (EMBED) document.documentElement.classList.add('embedded');

/* Pieces shipped with the app: APP.pieces, files in games/choirbook/ */
const PIECES = APP.pieces;

/* Glyph outlines in staff-space units, y pointing down. b = [left, top, right, bottom]. */
const GLY = {"Mx":{"d":"M2.456 -0.684H2.42C2.396 -0.684 2.38 -0.664 2.38 -0.64V-0.54H0.12V-0.64C0.12 -0.664 0.1 -0.684 0.076 -0.684H0.04C0.02 -0.684 0 -0.664 0 -0.64V0.644C0 0.668 0.02 0.688 0.04 0.688H0.076C0.1 0.688 0.12 0.668 0.12 0.644V0.544H2.38V3.504C2.38 3.528 2.396 3.548 2.42 3.548H2.456C2.48 3.548 2.5 3.528 2.5 3.504V-0.64C2.5 -0.664 2.48 -0.684 2.456 -0.684ZM2.38 -0.292V0.3H0.12V-0.292Z","b":[0.0,-0.684,2.5,3.548]},"L":{"d":"M1.256 -0.684H1.22C1.196 -0.684 1.18 -0.664 1.18 -0.64V-0.54H0.12V-0.64C0.12 -0.664 0.1 -0.684 0.076 -0.684H0.04C0.02 -0.684 0 -0.664 0 -0.64V0.644C0 0.668 0.02 0.688 0.04 0.688H0.076C0.1 0.688 0.12 0.668 0.12 0.644V0.544H1.18V3.504C1.18 3.528 1.196 3.548 1.22 3.548H1.256C1.28 3.548 1.3 3.528 1.3 3.504V-0.64C1.3 -0.664 1.28 -0.684 1.256 -0.684ZM1.18 -0.292V0.3H0.12V-0.292Z","b":[0.0,-0.684,1.3,3.548]},"B":{"d":"M1.26 -0.688H1.224C1.2 -0.688 1.18 -0.668 1.18 -0.644V-0.544H0.12V-0.644C0.12 -0.668 0.104 -0.688 0.08 -0.688H0.044C0.02 -0.688 0 -0.668 0 -0.644V0.64C0 0.664 0.02 0.684 0.044 0.684H0.08C0.104 0.684 0.12 0.664 0.12 0.64V0.54H1.18V0.64C1.18 0.664 1.2 0.684 1.224 0.684H1.26C1.28 0.684 1.3 0.664 1.3 0.64V-0.644C1.3 -0.668 1.28 -0.688 1.26 -0.688ZM1.18 -0.296V0.296H0.12V-0.296Z","b":[0.0,-0.688,1.3,0.684]},"S":{"d":"M0.68 -0.724C0.672 -0.736 0.66 -0.74 0.648 -0.74C0.632 -0.736 0.624 -0.732 0.616 -0.724L0.008 -0.028C0.004 -0.016 0 -0.008 0 0C0 0.016 0.004 0.02 0.008 0.028L0.616 0.724C0.624 0.732 0.636 0.736 0.648 0.736C0.66 0.736 0.672 0.732 0.68 0.724L1.272 0.028C1.276 0.02 1.28 0.012 1.28 0C1.28 -0.008 1.276 -0.02 1.272 -0.028ZM0.74 0.468 0.24 -0.108 0.56 -0.472 1.04 0.108Z","b":[0.0,-0.74,1.28,0.736]},"M":{"d":"M1.272 -0.028 0.712 -0.712V-3.504C0.712 -3.524 0.692 -3.544 0.668 -3.544H0.632C0.608 -3.544 0.592 -3.524 0.592 -3.504V-0.712L0.008 -0.028C0 -0.02 0 -0.008 0 0C0 0.012 0 0.02 0.008 0.028L0.616 0.724C0.624 0.732 0.636 0.736 0.648 0.736C0.66 0.736 0.672 0.732 0.68 0.724L1.272 0.028C1.276 0.02 1.28 0.012 1.28 0C1.28 -0.008 1.276 -0.02 1.272 -0.028ZM0.74 0.468 0.24 -0.108 0.56 -0.472 1.04 0.108Z","b":[0.0,-3.544,1.28,0.736]},"Sm":{"d":"M1.272 -0.028 0.712 -0.712V-3.504C0.712 -3.524 0.692 -3.544 0.668 -3.544H0.632C0.608 -3.544 0.588 -3.524 0.588 -3.504V-0.712L0.008 -0.028C0 -0.02 0 -0.008 0 0C0 0.012 0 0.02 0.008 0.028L0.616 0.724C0.624 0.732 0.636 0.736 0.648 0.736C0.66 0.736 0.672 0.732 0.68 0.724L1.272 0.028C1.276 0.02 1.28 0.012 1.28 0C1.28 -0.008 1.276 -0.02 1.272 -0.028Z","b":[0.0,-3.544,1.28,0.736]},"F":{"d":"M1.384 -2.16 0.712 -3.508C0.696 -3.512 0.692 -3.54 0.668 -3.54C0.664 -3.54 0.656 -3.544 0.652 -3.544C0.648 -3.544 0.644 -3.54 0.64 -3.54C0.608 -3.54 0.588 -3.52 0.588 -3.496V-0.708L0.008 -0.024C0 -0.016 0 -0.004 0 0.004C0 0.016 0 0.024 0.008 0.032L0.616 0.728C0.624 0.736 0.636 0.744 0.648 0.744C0.66 0.744 0.672 0.736 0.68 0.728L1.272 0.032C1.276 0.024 1.28 0.016 1.28 0.004C1.28 -0.004 1.276 -0.016 1.272 -0.024L0.708 -0.708V-3.22L1.268 -2.1C1.28 -2.08 1.304 -2.064 1.328 -2.064C1.336 -2.064 1.344 -2.068 1.356 -2.072C1.38 -2.084 1.392 -2.108 1.392 -2.132C1.392 -2.144 1.388 -2.152 1.384 -2.16Z","b":[0.0,-3.544,1.392,0.744]},"rL":{"d":"M0.192 -0.936C0.192 -0.972 0.164 -1 0.128 -1H0.064C0.028 -1 0 -0.972 0 -0.936V0.936C0 0.972 0.028 1 0.064 1H0.128C0.164 1 0.192 0.972 0.192 0.936Z","b":[0.0,-1.0,0.192,1.0]},"rB":{"d":"M0.192 -0.936C0.192 -0.972 0.164 -1 0.128 -1H0.064C0.028 -1 0 -0.972 0 -0.936V-0.064C0 -0.028 0.028 0 0.064 0H0.128C0.164 0 0.192 -0.028 0.192 -0.064Z","b":[0.0,-1.0,0.192,0.0]},"rS":{"d":"M0.192 -0.936C0.192 -0.972 0.164 -1 0.128 -1H0.064C0.028 -1 0 -0.972 0 -0.936V-0.564C0 -0.528 0.028 -0.5 0.064 -0.5H0.128C0.164 -0.5 0.192 -0.528 0.192 -0.564Z","b":[0.0,-1.0,0.192,-0.5]},"rM":{"d":"M0.192 -0.436C0.192 -0.472 0.164 -0.5 0.128 -0.5H0.064C0.028 -0.5 0 -0.472 0 -0.436V-0.064C0 -0.028 0.028 0 0.064 0H0.128C0.164 0 0.192 -0.028 0.192 -0.064Z","b":[0.0,-0.5,0.192,0.0]},"rSm":{"d":"M0.512 -0.54 0.156 -0.656C0.152 -0.66 0.144 -0.66 0.14 -0.66H0.064C0.028 -0.66 0 -0.632 0 -0.596V-0.064C0 -0.028 0.028 0 0.064 0H0.128C0.164 0 0.192 -0.028 0.192 -0.064V-0.444L0.448 -0.356C0.456 -0.352 0.46 -0.352 0.468 -0.352C0.496 -0.352 0.524 -0.372 0.532 -0.396L0.552 -0.46C0.552 -0.464 0.556 -0.472 0.556 -0.476C0.556 -0.504 0.54 -0.532 0.512 -0.54Z","b":[0.0,-0.66,0.556,0.0]},"rF":{"d":"M0.044 -0.54C0.016 -0.532 0 -0.504 0 -0.476C0 -0.472 0.004 -0.464 0.004 -0.46L0.024 -0.396C0.032 -0.372 0.06 -0.352 0.088 -0.352C0.096 -0.352 0.1 -0.352 0.108 -0.356L0.364 -0.444V-0.064C0.364 -0.028 0.392 0 0.428 0H0.492C0.528 0 0.556 -0.028 0.556 -0.064V-0.596C0.556 -0.632 0.528 -0.66 0.492 -0.66H0.416C0.412 -0.66 0.404 -0.66 0.4 -0.656Z","b":[0.0,-0.66,0.556,0.0]},"gP":{"d":"M0.916 -0.356C0.988 -0.352 1.052 -0.332 1.1 -0.304C1.104 -0.304 1.108 -0.3 1.112 -0.3C1.12 -0.3 1.132 -0.304 1.14 -0.308C1.204 -0.348 1.292 -0.496 1.292 -0.524C1.292 -0.544 1.288 -0.548 1.284 -0.552C1.212 -0.604 1.132 -0.632 1.044 -0.632C1.028 -0.632 1.012 -0.628 0.996 -0.628L1.016 -0.668C1.092 -0.832 1.188 -1.036 1.188 -1.236C1.188 -1.256 1.188 -1.28 1.184 -1.3C1.164 -1.512 1.004 -1.828 0.864 -2.076C0.96 -2.232 1.02 -2.404 1.08 -2.584C1.116 -2.704 1.208 -3.024 1.208 -3.288C1.208 -3.508 1.148 -3.688 0.944 -3.688C0.924 -3.688 0.904 -3.688 0.884 -3.684C0.512 -3.628 0.4 -3.24 0.372 -3.092C0.36 -3.036 0.356 -2.976 0.356 -2.92C0.356 -2.652 0.464 -2.396 0.588 -2.164L0.704 -1.968C0.5 -1.72 0.228 -1.52 0.076 -1.228C0.032 -1.136 0 -1.036 0 -0.936V-0.916C0.008 -0.564 0.244 -0.496 0.244 -0.496C0.244 -0.496 0.256 -0.484 0.272 -0.484C0.284 -0.484 0.3 -0.492 0.316 -0.508C0.36 -0.552 0.376 -0.6 0.384 -0.612C0.388 -0.62 0.396 -0.636 0.396 -0.64C0.396 -0.648 0.388 -0.66 0.372 -0.672C0.308 -0.672 0.124 -0.828 0.124 -1.04C0.124 -1.056 0.124 -1.072 0.128 -1.088C0.18 -1.448 0.52 -1.652 0.74 -1.908C0.848 -1.732 0.96 -1.548 1.012 -1.356C1.036 -1.272 1.048 -1.192 1.048 -1.104C1.048 -0.972 1.02 -0.84 0.956 -0.696L0.92 -0.612C0.796 -0.572 0.668 -0.48 0.544 -0.32C0.44 -0.188 0.4 -0.056 0.4 0.08C0.4 0.188 0.428 0.3 0.468 0.408C0.524 0.556 0.716 0.676 0.88 0.676H0.904C1.108 0.66 1.356 0.432 1.356 0.084C1.356 0.024 1.348 -0.04 1.332 -0.104C1.332 -0.104 1.204 -0.116 1.108 -0.116C1.06 -0.116 1.016 -0.112 1.004 -0.104C0.996 -0.104 0.988 -0.092 0.976 -0.08C0.944 -0.16 0.916 -0.244 0.916 -0.336ZM0.824 -2.144C0.756 -2.268 0.692 -2.364 0.664 -2.412C0.604 -2.508 0.492 -2.848 0.492 -3.128C0.492 -3.264 0.52 -3.388 0.592 -3.46C0.632 -3.5 0.7 -3.52 0.768 -3.52C0.852 -3.52 0.94 -3.488 0.992 -3.42C1.06 -3.328 1.084 -3.212 1.084 -3.096C1.084 -3.012 1.072 -2.928 1.06 -2.848C1.024 -2.636 0.964 -2.424 0.872 -2.228ZM0.596 -0.26C0.66 -0.324 0.752 -0.356 0.84 -0.36C0.816 -0.264 0.804 -0.168 0.804 -0.084C0.804 0.012 0.824 0.092 0.876 0.14C0.884 0.144 0.904 0.144 0.924 0.144C0.964 0.144 1.024 0.14 1.068 0.14C1.108 0.14 1.14 0.144 1.144 0.156C1.156 0.184 1.164 0.252 1.164 0.312C1.164 0.364 1.16 0.408 1.144 0.408C1.124 0.412 1.088 0.416 1.048 0.416C0.88 0.416 0.596 0.34 0.596 -0.184Z","b":[0.0,-3.688,1.356,0.676]},"fP":{"d":"M1.94 -0.484C1.948 -0.5 1.952 -0.512 1.952 -0.528C1.952 -0.552 1.944 -0.576 1.928 -0.608C1.904 -0.656 1.704 -1.008 1.668 -1.06L1.644 -1.092V-2.324C1.644 -2.344 1.624 -2.364 1.604 -2.364H1.552C1.528 -2.364 1.512 -2.344 1.512 -2.324V-1.136C1.48 -1.12 1.448 -1.084 1.416 -1.02L1.096 -0.46C1.092 -0.436 1.072 -0.42 1.072 -0.396C1.072 -0.38 1.08 -0.36 1.096 -0.332C1.132 -0.272 1.284 0.008 1.308 0.044C1.32 0.06 1.324 0.072 1.324 0.08C1.324 0.088 1.32 0.096 1.308 0.112C1.308 0.112 1.308 0.116 1.088 0.504C1.08 0.524 1.072 0.544 1.072 0.568C1.072 0.588 1.076 0.608 1.088 0.624C1.12 0.664 1.336 1.04 1.368 1.088L1.388 1.12V4.236C1.388 4.26 1.404 4.276 1.428 4.276H1.48C1.5 4.276 1.52 4.26 1.52 4.236V1.14C1.548 1.12 1.58 1.088 1.616 1.032C1.756 0.812 1.936 0.468 1.936 0.468C1.936 0.468 1.944 0.452 1.944 0.42C1.944 0.396 1.94 0.36 1.916 0.324C1.864 0.24 1.72 -0.02 1.72 -0.02C1.712 -0.036 1.704 -0.048 1.704 -0.064C1.704 -0.076 1.708 -0.088 1.716 -0.104ZM1.312 -0.54 1.468 -0.804 1.716 -0.388 1.556 -0.116ZM0.864 -0.72C0.84 -0.72 0.82 -0.716 0.816 -0.664C0.808 -0.588 0.792 -0.508 0.696 -0.508H0.228C0.192 -0.508 0.144 -0.536 0.132 -0.64V-0.68C0.132 -0.704 0.108 -0.72 0.084 -0.72H0.048C0.02 -0.72 0 -0.704 0 -0.68V0.704C0 0.724 0.02 0.744 0.048 0.744H0.084C0.108 0.744 0.132 0.724 0.132 0.704V0.632C0.152 0.54 0.196 0.54 0.224 0.54H0.708C0.748 0.54 0.788 0.552 0.816 0.632V3.776C0.816 3.848 0.836 3.848 0.864 3.848H0.896C0.924 3.848 0.944 3.848 0.944 3.776V-0.644C0.944 -0.712 0.924 -0.72 0.896 -0.72ZM0.228 0.212C0.192 0.212 0.144 0.184 0.132 0.08V-0.088C0.152 -0.18 0.196 -0.18 0.224 -0.18H0.708C0.748 -0.18 0.788 -0.168 0.816 -0.088V0.064C0.808 0.136 0.792 0.212 0.696 0.212ZM1.556 0.824 1.312 0.4 1.468 0.136 1.716 0.552Z","b":[0.0,-2.364,1.952,4.276]},"c1":{"d":"M0.928 1.256C0.952 1.256 0.976 1.256 0.976 1.188V-2.16C0.976 -2.228 0.952 -2.228 0.928 -2.228H0.892C0.864 -2.228 0.84 -2.228 0.84 -2.16V-1.252C0.832 -1.18 0.82 -1.104 0.72 -1.104H0.236C0.196 -1.104 0.148 -1.132 0.136 -1.236V-3.132C0.136 -3.2 0.112 -3.2 0.084 -3.2H0.052C0.024 -3.2 0 -3.2 0 -3.132V1.328C0 1.396 0.024 1.396 0.052 1.396H0.084C0.112 1.396 0.136 1.396 0.136 1.328V1.228C0.144 1.156 0.16 1.076 0.256 1.076H0.72C0.82 1.076 0.832 1.116 0.84 1.188C0.84 1.256 0.864 1.256 0.892 1.256ZM0.732 -0.696C0.772 -0.696 0.816 -0.684 0.84 -0.604V-0.452C0.84 -0.436 0.836 -0.42 0.832 -0.404C0.816 -0.332 0.772 -0.312 0.74 -0.312H0.256C0.16 -0.312 0.144 -0.388 0.136 -0.46V-0.604C0.16 -0.696 0.204 -0.696 0.232 -0.696ZM0.256 0.676C0.16 0.676 0.144 0.6 0.136 0.528V0.44C0.14 0.376 0.156 0.308 0.224 0.292H0.732C0.744 0.292 0.752 0.292 0.764 0.296C0.824 0.316 0.836 0.38 0.84 0.44V0.544C0.828 0.648 0.78 0.676 0.74 0.676Z","b":[0.0,-3.2,0.976,1.396]},"c2":{"d":"M0.892 2.188H0.928C0.952 2.188 0.976 2.188 0.976 2.12V-2.176C0.976 -2.244 0.952 -2.244 0.928 -2.244H0.892C0.864 -2.244 0.84 -2.244 0.84 -2.176V-1.228C0.832 -1.156 0.82 -1.076 0.72 -1.076H0.256C0.16 -1.076 0.144 -1.156 0.136 -1.228V-3.132C0.136 -3.2 0.112 -3.2 0.084 -3.2H0.052C0.024 -3.2 0 -3.2 0 -3.132V2.332C0 2.4 0.024 2.4 0.052 2.4H0.084C0.112 2.4 0.136 2.4 0.136 2.332V1.196C0.148 1.092 0.196 1.064 0.236 1.064H0.72C0.82 1.064 0.832 1.14 0.84 1.212V2.12C0.84 2.188 0.864 2.188 0.892 2.188ZM0.84 -0.544V-0.44C0.836 -0.38 0.824 -0.316 0.764 -0.296C0.752 -0.292 0.744 -0.292 0.732 -0.292H0.224C0.156 -0.308 0.14 -0.376 0.136 -0.44V-0.528C0.144 -0.6 0.16 -0.676 0.256 -0.676H0.74C0.78 -0.676 0.828 -0.648 0.84 -0.544ZM0.84 0.452V0.604C0.816 0.684 0.772 0.696 0.732 0.696H0.232C0.204 0.696 0.16 0.696 0.136 0.604V0.46C0.144 0.388 0.16 0.312 0.256 0.312H0.74C0.772 0.312 0.816 0.332 0.832 0.404C0.836 0.42 0.84 0.436 0.84 0.452Z","b":[0.0,-3.2,0.976,2.4]},"c3":{"d":"M0.892 -2.228C0.864 -2.228 0.84 -2.228 0.84 -2.16V-1.252C0.832 -1.18 0.82 -1.104 0.72 -1.104H0.236C0.196 -1.104 0.148 -1.132 0.136 -1.236V-3.132C0.136 -3.2 0.112 -3.2 0.084 -3.2H0.052C0.024 -3.2 0 -3.2 0 -3.132V3.132C0 3.2 0.024 3.2 0.052 3.2H0.084C0.112 3.2 0.136 3.2 0.136 3.132V1.228C0.144 1.156 0.16 1.076 0.256 1.076H0.72C0.82 1.076 0.832 1.156 0.84 1.228V2.176C0.84 2.244 0.864 2.244 0.892 2.244H0.928C0.952 2.244 0.976 2.244 0.976 2.176V-2.16C0.976 -2.228 0.952 -2.228 0.928 -2.228ZM0.84 -0.452C0.84 -0.436 0.836 -0.42 0.832 -0.404C0.816 -0.332 0.772 -0.312 0.74 -0.312H0.256C0.16 -0.312 0.144 -0.388 0.136 -0.46V-0.604C0.16 -0.696 0.204 -0.696 0.232 -0.696H0.732C0.772 -0.696 0.816 -0.684 0.84 -0.604ZM0.84 0.544C0.828 0.648 0.78 0.676 0.74 0.676H0.256C0.16 0.676 0.144 0.6 0.136 0.528V0.44C0.14 0.376 0.156 0.308 0.224 0.292H0.732C0.744 0.292 0.752 0.292 0.764 0.296C0.824 0.316 0.836 0.38 0.84 0.44Z","b":[0.0,-3.2,0.976,3.2]},"c4":{"d":"M0.892 -2.188C0.864 -2.188 0.84 -2.188 0.84 -2.12V-1.212C0.832 -1.14 0.82 -1.064 0.72 -1.064H0.236C0.196 -1.064 0.148 -1.092 0.136 -1.196V-2.332C0.136 -2.4 0.112 -2.4 0.084 -2.4H0.052C0.024 -2.4 0 -2.4 0 -2.332V3.132C0 3.2 0.024 3.2 0.052 3.2H0.084C0.112 3.2 0.136 3.2 0.136 3.132V1.228C0.144 1.156 0.16 1.076 0.256 1.076H0.72C0.82 1.076 0.832 1.156 0.84 1.228V2.176C0.84 2.244 0.864 2.244 0.892 2.244H0.928C0.952 2.244 0.976 2.244 0.976 2.176V-2.12C0.976 -2.188 0.952 -2.188 0.928 -2.188ZM0.84 -0.452C0.84 -0.436 0.836 -0.42 0.832 -0.404C0.816 -0.332 0.772 -0.312 0.74 -0.312H0.256C0.16 -0.312 0.144 -0.388 0.136 -0.46V-0.604C0.16 -0.696 0.204 -0.696 0.232 -0.696H0.732C0.772 -0.696 0.816 -0.684 0.84 -0.604ZM0.84 0.544C0.828 0.648 0.78 0.676 0.74 0.676H0.256C0.16 0.676 0.144 0.6 0.136 0.528V0.44C0.14 0.376 0.156 0.308 0.224 0.292H0.732C0.744 0.292 0.752 0.292 0.764 0.296C0.824 0.316 0.836 0.38 0.84 0.44Z","b":[0.0,-2.4,0.976,3.2]},"c5":{"d":"M0.928 -1.276H0.892C0.864 -1.276 0.84 -1.276 0.84 -1.208C0.832 -1.136 0.82 -1.096 0.72 -1.096H0.256C0.16 -1.096 0.144 -1.176 0.136 -1.248V-1.348C0.136 -1.416 0.112 -1.416 0.084 -1.416H0.052C0.024 -1.416 0 -1.416 0 -1.348V3.112C0 3.18 0.024 3.18 0.052 3.18H0.084C0.112 3.18 0.136 3.18 0.136 3.112V1.216C0.148 1.112 0.196 1.084 0.236 1.084H0.72C0.82 1.084 0.832 1.16 0.84 1.232V2.14C0.84 2.208 0.864 2.208 0.892 2.208H0.928C0.952 2.208 0.976 2.208 0.976 2.14V-1.208C0.976 -1.276 0.952 -1.276 0.928 -1.276ZM0.256 -0.696H0.74C0.78 -0.696 0.828 -0.668 0.84 -0.564V-0.46C0.836 -0.4 0.824 -0.336 0.764 -0.316C0.752 -0.312 0.744 -0.312 0.732 -0.312H0.224C0.156 -0.328 0.14 -0.396 0.136 -0.46V-0.548C0.144 -0.62 0.16 -0.696 0.256 -0.696ZM0.732 0.676H0.232C0.204 0.676 0.16 0.676 0.136 0.584V0.44C0.144 0.368 0.16 0.292 0.256 0.292H0.74C0.772 0.292 0.816 0.312 0.832 0.384C0.836 0.4 0.84 0.416 0.84 0.432V0.584C0.816 0.664 0.772 0.676 0.732 0.676Z","b":[0.0,-1.416,0.976,3.18]},"n8":{"d":"M0.452 -0.988C0.404 -0.988 0.356 -0.984 0.316 -0.964C0.212 -0.924 0.156 -0.836 0.156 -0.74C0.156 -0.684 0.176 -0.628 0.22 -0.576C0.224 -0.576 0.228 -0.572 0.228 -0.564C0.228 -0.552 0.22 -0.548 0.204 -0.544C0.1 -0.508 0 -0.392 0 -0.28C0 -0.272 0.004 -0.252 0.008 -0.232C0.04 -0.084 0.232 0 0.368 0C0.424 0 0.488 -0.008 0.532 -0.024C0.644 -0.072 0.716 -0.176 0.716 -0.284C0.716 -0.332 0.704 -0.376 0.68 -0.42C0.664 -0.44 0.664 -0.46 0.664 -0.484C0.664 -0.508 0.672 -0.528 0.696 -0.548C0.732 -0.576 0.82 -0.608 0.82 -0.748C0.82 -0.948 0.532 -0.988 0.468 -0.988ZM0.356 -0.82C0.364 -0.888 0.42 -0.916 0.48 -0.92C0.548 -0.92 0.608 -0.9 0.64 -0.864C0.664 -0.84 0.676 -0.796 0.676 -0.76C0.672 -0.688 0.652 -0.568 0.584 -0.568C0.572 -0.568 0.552 -0.576 0.532 -0.584C0.492 -0.612 0.46 -0.652 0.428 -0.684C0.396 -0.72 0.356 -0.764 0.356 -0.82ZM0.22 -0.436C0.232 -0.452 0.252 -0.464 0.276 -0.464C0.284 -0.464 0.316 -0.448 0.332 -0.44C0.356 -0.424 0.376 -0.404 0.4 -0.384C0.444 -0.344 0.48 -0.3 0.5 -0.248C0.508 -0.228 0.516 -0.212 0.516 -0.192C0.516 -0.128 0.448 -0.048 0.368 -0.048C0.292 -0.048 0.184 -0.128 0.156 -0.256C0.152 -0.268 0.152 -0.276 0.152 -0.284C0.152 -0.328 0.168 -0.372 0.192 -0.404C0.196 -0.416 0.208 -0.428 0.22 -0.436Z","b":[0.0,-0.988,0.82,0.0]},"fl":{"d":"M0.82 0.58V-0.22C0.82 -0.352 0.752 -0.416 0.624 -0.504C0.492 -0.584 0.348 -0.604 0.292 -0.608C0.24 -0.608 0.236 -0.584 0.236 -0.572V-0.404C0.236 -0.3 0.272 -0.296 0.272 -0.296L0.44 -0.2C0.568 -0.132 0.744 -0.004 0.744 0.144C0.744 0.276 0.656 0.284 0.632 0.284C0.448 0.284 0.264 0.156 0.152 0.024C0.116 -0.012 0.108 -0.036 0.108 -0.048C0.108 -0.048 0.12 -1.416 0.12 -1.496C0.12 -1.58 0.12 -1.648 0.072 -1.652C0.008 -1.652 0 -1.56 0 -1.508V0.216C0.028 0.308 0.072 0.34 0.072 0.34C0.324 0.584 0.7 0.604 0.764 0.604C0.812 0.604 0.82 0.584 0.82 0.58Z","b":[0.0,-1.652,0.82,0.604]},"na":{"d":"M0 0.432C0.008 0.456 0.016 0.464 0.04 0.472L0.328 0.424V0.604C0.328 0.864 0.328 0.992 0.324 1C0.356 1.012 0.376 1.016 0.38 1.016C0.396 1.016 0.408 1.008 0.408 0.992V-0.428C0.404 -0.44 0.396 -0.456 0.38 -0.456C0.332 -0.456 0.276 -0.448 0.092 -0.412V-1.004C0.072 -1.008 0.056 -1.012 0.04 -1.012C0.032 -1.012 0.016 -1.008 0 -1.004ZM0.336 0.208 0.084 0.248C0.084 -0.048 0.084 -0.196 0.088 -0.196L0.336 -0.236Z","b":[0.0,-1.012,0.408,1.016]},"sh":{"d":"M0.948 -0.472C0.976 -0.484 0.996 -0.516 0.996 -0.54V-0.824C0.996 -0.844 0.984 -0.856 0.968 -0.856C0.96 -0.856 0.956 -0.856 0.948 -0.852C0.948 -0.852 0.868 -0.82 0.848 -0.816C0.82 -0.816 0.792 -0.836 0.792 -0.868V-1.356C0.792 -1.38 0.768 -1.4 0.736 -1.4C0.696 -1.4 0.672 -1.38 0.672 -1.356V-0.836C0.668 -0.796 0.656 -0.744 0.62 -0.72C0.572 -0.692 0.436 -0.636 0.368 -0.62C0.332 -0.62 0.32 -0.668 0.32 -0.7V-1.18C0.32 -1.204 0.292 -1.224 0.264 -1.224C0.224 -1.224 0.2 -1.204 0.2 -1.18V-0.64C0.2 -0.584 0.176 -0.544 0.152 -0.532C0.128 -0.52 0.048 -0.488 0.048 -0.488C0.02 -0.48 0 -0.448 0 -0.424V-0.14C0 -0.116 0.012 -0.104 0.032 -0.104C0.036 -0.104 0.044 -0.108 0.048 -0.108C0.048 -0.108 0.108 -0.132 0.136 -0.148C0.14 -0.148 0.144 -0.152 0.148 -0.152C0.176 -0.152 0.2 -0.112 0.2 -0.08V0.316C0.2 0.36 0.18 0.396 0.156 0.408C0.132 0.416 0.048 0.452 0.048 0.452C0.02 0.46 0 0.492 0 0.516V0.8C0 0.824 0.012 0.836 0.032 0.836C0.036 0.836 0.044 0.832 0.048 0.832C0.048 0.832 0.104 0.808 0.14 0.796C0.144 0.792 0.148 0.792 0.152 0.792C0.18 0.792 0.2 0.836 0.2 0.856V1.348C0.2 1.372 0.224 1.392 0.252 1.392C0.292 1.392 0.32 1.372 0.32 1.348V0.792C0.32 0.74 0.34 0.712 0.36 0.704L0.604 0.604C0.608 0.604 0.616 0.6 0.62 0.6C0.652 0.6 0.672 0.648 0.672 0.672V1.172C0.672 1.196 0.696 1.216 0.724 1.216C0.768 1.216 0.792 1.196 0.792 1.172V0.604C0.792 0.572 0.808 0.524 0.836 0.512C0.864 0.5 0.948 0.468 0.948 0.468C0.976 0.456 0.996 0.424 0.996 0.4V0.116C0.996 0.096 0.984 0.084 0.968 0.084C0.96 0.084 0.956 0.084 0.948 0.088L0.844 0.128C0.82 0.128 0.792 0.104 0.792 0.056V-0.316C0.792 -0.344 0.812 -0.42 0.844 -0.432ZM0.672 0.18C0.648 0.26 0.46 0.34 0.368 0.34C0.344 0.34 0.324 0.332 0.32 0.32C0.312 0.304 0.308 0.216 0.308 0.12C0.308 -0.004 0.312 -0.144 0.32 -0.176C0.328 -0.244 0.512 -0.328 0.612 -0.328C0.64 -0.328 0.664 -0.32 0.672 -0.304C0.68 -0.284 0.688 -0.184 0.688 -0.076C0.688 0.032 0.68 0.144 0.672 0.18Z","b":[0.0,-1.4,0.996,1.392]},"cu":{"d":"M0.04 -0.3C0.024 -0.276 0.004 -0.236 0.004 -0.208C0.004 -0.184 0.016 -0.168 0.06 -0.168C0.104 -0.168 0.148 -0.224 0.18 -0.264C0.216 -0.312 0.252 -0.36 0.292 -0.404C0.32 -0.436 0.34 -0.456 0.356 -0.456C0.372 -0.456 0.384 -0.44 0.4 -0.408L0.656 -0.032C0.668 -0.012 0.688 -0.004 0.712 -0.004C0.732 -0.004 0.756 -0.012 0.768 -0.024C0.788 -0.052 1.036 -0.384 1.064 -0.416C1.08 -0.432 1.092 -0.44 1.1 -0.44C1.112 -0.44 1.12 -0.428 1.132 -0.408C1.152 -0.384 1.356 -0.064 1.396 -0.024C1.416 -0.004 1.436 0 1.46 0C1.488 0 1.512 -0.008 1.524 -0.024C1.552 -0.056 2.404 -1.468 2.444 -1.528C2.452 -1.54 2.456 -1.556 2.456 -1.568C2.456 -1.584 2.452 -1.596 2.44 -1.608C2.424 -1.624 2.4 -1.644 2.376 -1.644C2.372 -1.644 2.324 -1.62 2.304 -1.6C2.272 -1.56 1.7 -0.592 1.652 -0.532C1.64 -0.52 1.636 -0.52 1.636 -0.516C1.616 -0.488 1.604 -0.476 1.596 -0.476C1.592 -0.476 1.588 -0.484 1.584 -0.492L1.56 -0.528C1.536 -0.564 1.368 -0.92 1.328 -0.964C1.308 -0.984 1.292 -0.992 1.272 -0.992C1.252 -0.992 1.232 -0.984 1.216 -0.964C1.184 -0.928 0.984 -0.58 0.948 -0.536C0.928 -0.508 0.908 -0.496 0.892 -0.496C0.872 -0.496 0.856 -0.516 0.844 -0.536C0.82 -0.568 0.616 -0.9 0.596 -0.936C0.596 -0.976 0.54 -0.988 0.512 -0.992C0.492 -0.992 0.48 -0.984 0.46 -0.956C0.432 -0.928 0.412 -0.888 0.392 -0.856C0.308 -0.728 0.228 -0.6 0.148 -0.472Z","b":[0.004,-1.644,2.456,0.0]},"cd":{"d":"M0.04 -0.688 0.148 -0.516C0.228 -0.388 0.308 -0.26 0.392 -0.132C0.412 -0.1 0.432 -0.06 0.46 -0.032C0.48 -0.004 0.492 0.004 0.512 0.004C0.54 0 0.596 -0.012 0.596 -0.052C0.616 -0.088 0.82 -0.42 0.844 -0.452C0.856 -0.472 0.872 -0.492 0.892 -0.492C0.908 -0.492 0.928 -0.48 0.948 -0.452C0.984 -0.408 1.184 -0.06 1.216 -0.024C1.232 -0.004 1.252 0.004 1.272 0.004C1.292 0.004 1.308 -0.004 1.328 -0.024C1.368 -0.068 1.536 -0.424 1.56 -0.46L1.584 -0.496C1.588 -0.504 1.592 -0.512 1.596 -0.512C1.604 -0.512 1.616 -0.5 1.636 -0.472C1.636 -0.468 1.64 -0.468 1.652 -0.456C1.7 -0.396 2.272 0.572 2.304 0.612C2.324 0.632 2.372 0.656 2.376 0.656C2.4 0.656 2.424 0.636 2.44 0.62C2.452 0.608 2.456 0.596 2.456 0.58C2.456 0.568 2.452 0.552 2.444 0.54C2.404 0.48 1.552 -0.932 1.524 -0.964C1.512 -0.98 1.488 -0.988 1.46 -0.988C1.436 -0.988 1.416 -0.984 1.396 -0.964C1.356 -0.924 1.152 -0.604 1.132 -0.58C1.12 -0.56 1.112 -0.548 1.1 -0.548C1.092 -0.548 1.08 -0.556 1.064 -0.572C1.036 -0.604 0.788 -0.936 0.768 -0.964C0.756 -0.976 0.732 -0.984 0.712 -0.984C0.688 -0.984 0.668 -0.976 0.656 -0.956L0.4 -0.58C0.384 -0.548 0.372 -0.532 0.356 -0.532C0.34 -0.532 0.32 -0.552 0.292 -0.584C0.252 -0.628 0.216 -0.676 0.18 -0.724C0.148 -0.764 0.104 -0.82 0.06 -0.82C0.016 -0.82 0.004 -0.804 0.004 -0.78C0.004 -0.752 0.024 -0.712 0.04 -0.688Z","b":[0.004,-0.988,2.456,0.656]}};
/* filled (coloured) note heads: the outer contour of the void shapes */
for (const k of ['Mx','L','B','S','M']) GLY[k + 'c'] = {d: GLY[k].d.slice(0, GLY[k].d.indexOf('Z') + 1), b: GLY[k].b};

const gw = k => GLY[k].b[2] - GLY[k].b[0];
const f = n => (Math.round(n * 1000) / 1000).toString();
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const EPS = 1e-6, eq = (a, b) => Math.abs(a - b) < 1e-4;
const rt = x => Math.round(x * 5040) / 5040;
const $ = s => document.querySelector(s);

/* Manuscript paper (same recipe as the CantusFirmus app) */
(function(){
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
    const w = 512, h = 512, ox = 64, oy = 64, gw = w + ox, gh = h + oy, k = w / 1600;
    const fine = noise(11, 1.6 * k + 1, w, h), mid = noise(12, 9 * k + 2, w, h), big = noise(13, 180 * k, w, h), fox = noise(14, 40 * k, w, h);
    const P = [239, 227, 199], FOX = 0.05;
    const src = new Float32Array(gw * gh * 3);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 3;
      const n = (big(x, y) - 0.5) * 13 + (mid(x, y) - 0.5) * 6 + (fine(x, y) - 0.5) * 5;
      const laid = (mid(x * 0.15, y * 2.5) - 0.5) * 7;
      const wv = (mid(x * 0.3, y * 0.3) - 0.5) * 60 * k;
      const fx = Math.max(0, fox(x + wv, y - wv) * 0.7 + big(x * 2, y * 2) * 0.3 - (1 - FOX * 2.6)) * 90;
      src[i] = P[0] + n + laid - fx * 0.4; src[i + 1] = P[1] + n + laid - fx * 0.7; src[i + 2] = P[2] + n * 1.2 + laid - fx;
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
    document.documentElement.style.setProperty('--paper', `url(${cv.toDataURL('image/jpeg', 0.88)})`);
  } catch (e) { /* plain beige is fine */ }
})();

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
  bass:     {bottom:18, g:'fP', pos:6}
};
const MENS_CLEFS = ['c1','c2','c3','c4','f3','bass','treble'];
const KERN_CLEF = {G1:'g1', G2:'treble', Gv2:'treble8', G2v:'treble8', F4:'bass', F3:'f3', C1:'c1', C2:'c2', C3:'c3', C4:'c4', C5:'c5'};
const LETTERS = 'cdefgab';
const ACCG = {'-1':'fl', '0':'na', '1':'sh'};
const SHAPE_REST = {Mx:'rL', L:'rL', B:'rB', S:'rS', M:'rM', Sm:'rSm', F:'rF'};
const STEMMED = {M:1, Sm:1, F:1, Mc:1};
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
function parseNoteTok(tok){
  tok = tok.split(' ')[0];
  const r = recipDur(tok);
  if (!r) return null;
  const rest = r.rest;
  const ev = {d: r.d, kd: r.d, dots: r.dots, rational: r.rational};
  ev.tieStart = tok.includes('['); ev.tieEnd = tok.includes(']'); ev.tieMid = tok.includes('_');
  ev.ferm = tok.includes(';');
  ev.long = /l/.test(rest.replace(/[a-gA-G]/g, ''));
  ev.tupS = tok.includes('V'); ev.tupE = tok.includes('Z');
  const pm = rest.match(/([a-gA-G])\1*/);
  if (/r/.test(rest) || !pm) { ev.rest = true; return ev; }
  const L = pm[0], ch = L[0], idx = LETTERS.indexOf(ch.toLowerCase());
  ev.step = ch === ch.toLowerCase() ? 28 + 7 * (L.length - 1) + idx : 28 - 7 * L.length + idx;
  const after = rest.slice(rest.indexOf(L) + L.length);
  const am = after.match(/^(#+|-+|n)?(i)?/);
  ev.alt = null; ev.ed = false;
  if (am && am[1]) { ev.alt = am[1][0] === '#' ? am[1].length : am[1][0] === '-' ? -am[1].length : 0; ev.ed = !!am[2]; }
  return ev;
}
function prettyName(s){
  const m = String(s || '').match(/^([^,]+),\s*(.+)$/);
  return m ? m[2] + ' ' + m[1] : (s || '');
}
/* HTML entities in the reference records (JRP titles: mari&eacute;e) */
function decodeEnt(t){ const d = document.createElement('textarea'); d.innerHTML = t; return d.value; }
function parseKern(text){
  const lines = text.split(/\r?\n/);
  const meta = {};
  const voices = [];
  let cols = null;                 /* per column: {type:'kern', v} | {type:'text', v, verse} | {type:'other'} */
  const bars = [], sections = [], barNums = [];
  let pendingSection = null;
  for (const raw of lines) {
    const L = raw.replace(/\s+$/, '');
    if (!L) continue;
    if (L.startsWith('!!')) {
      let m = L.match(/^!!!([^:]+):\s*(.*)$/);
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
          last = {name:'', abbr:'', kclef:null, events:[], mets:[], keys:[], clefs:[], verses:0, t:0};
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
        if ((m = s.match(/^\*I"(.*)$/))) v.name = m[1];
        else if ((m = s.match(/^\*I'(.*)$/))) v.abbr = m[1];
        else if ((m = s.match(/^\*clef(.+)$/))) v.clefs.push({t: v.t, c: m[1], ei: v.events.length});
        else if ((m = s.match(/^\*k\[(.*)\]$/))) {
          const alts = {};
          (m[1].match(/[a-g](#+|-+)/g) || []).forEach(a => { alts[a[0]] = a[1][0] === '#' ? 1 : -1; });
          v.keys.push({t: v.t, alts, raw: m[1], ei: v.events.length});
        }
        else if ((m = s.match(/^\*met\((.*)\)$/))) v.mets.push({t: v.t, sign: m[1], ei: v.events.length});
        else if ((m = s.match(/^\*M(\d+)\/(\d+)$/))) v.lastM = +m[1] / +m[2];
      });
      continue;
    }
    if (tok[0].startsWith('=')) {
      const t = Math.max(...voices.map(v => v.t));
      const s = tok[0];
      if (t > EPS && !/-/.test(s)) bars.push({t: rt(t), type: (s.startsWith('==') || s.includes('||')) ? 'double' : 'single'});
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
    if (!v.name) v.name = 'Voice ' + (voices.length - i);
    v.kclef = v.clefs.length ? v.clefs[0].c : null;
  });
  const titleKey = Object.keys(meta).find(k => k === 'OTL') || Object.keys(meta).find(k => k.startsWith('OTL'));
  let title = (titleKey ? meta[titleKey] : 'Untitled').replace(/\s*\.\.\.\s*/g, ' … ');
  if (meta.OPR) title = meta.OPR + ': ' + title;
  const composer = prettyName(meta.COM || meta.COA || '');
  /* top voice first */
  const vs = voices.slice().reverse();
  const end = Math.max(...vs.map(v => v.end));
  return {title, composer, attributed: !meta.COM && !!meta.COA, voices: vs, bars: bars.filter(b => b.t < end - EPS), sections, end, meta, barNums};
}

/* ------------------------------------------------------------------ */
/* Mensuration signs                                                   */
/* ------------------------------------------------------------------ */
function mensInfo(sign){
  const s = sign || '';
  const circle = /O/.test(s), dot = /\./.test(s), num = (s.match(/\d+/) || [''])[0];
  const T = circle || num === '3' ? 3 : 2;
  const P = dot ? 3 : 2;
  /* proportions: JRP gives sounding values, so written = sounding x p */
  const p = num === '3' ? 1.5 : num === '2' ? 2 : 1;
  return {T, P, p};
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
function valueTable(T, P){
  const S = P === 3 ? 1.5 : 1, B = T * S, L = 2 * B;
  return [['Mx', 2 * L], ['L', L], ['B', B], ['S', S], ['M', 0.5], ['Sm', 0.25], ['F', 0.125]];
}
function shapeReal(w, T, P){
  const tab = valueTable(T, P), S = tab[3][1];
  for (const [g, v] of tab) if (eq(w, v)) return {g};
  if (T === 3 && eq(w, 2 * S)) return {g:'B', imp:true};
  if (P === 3 && eq(w, 1)) return {g:'S'};
  if (T === 3 && eq(w, 4 * S)) return {g:'L', col:true};
  for (const [g, v] of tab) {
    const imperfectLevel = g === 'B' ? T === 2 : g === 'S' ? P === 2 : true;
    if (imperfectLevel && eq(w, v * 1.5)) return {g, dot:true};
  }
  for (const [g, v] of tab) if (eq(w * 1.5, v) && g !== 'Sm' && g !== 'F') return {g, col:true};
  /* last resort, before splitting into tied notes: a dot of addition even on a perfect value */
  for (const [g, v] of tab) if (eq(w, v * 1.5)) return {g, dot:true};
  return null;
}
function shapeFake(d){
  const tab = [['Mx', 8], ['L', 4], ['B', 2], ['S', 1], ['M', 0.5], ['Sm', 0.25], ['F', 0.125]];
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
          e.d = rt(e.d + ev[j].d); e.ferm = e.ferm || ev[j].ferm; e.long = e.long || ev[j].long;
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
      if (piece.sections.some(sec => eq(sec.t, b.t)) || piece.bars.some(br => br.type === 'double' && eq(br.t, b.t))) continue;
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
      curSign = sign; segStart = e.t;
    }
    const mi = mensInfo(sign);
    const base = {t: e.t, d: e.d, rest: !!e.rest, step: e.step, alt: e.alt, ed: e.ed, syl: e.syl, ferm: e.ferm, mens, sign, src: e.src};
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
      const tab = valueTable(mi.T, mi.P);
      let guard = 0;
      while (r > 0.01 && guard++ < 30) {
        /* breve and long rests stand on the breve grid (a rest is never imperfect: two semibreves of rest in O are two semibreve rests) */
        const Bv = tab[2][1], posB = ((rt(t - segStart) * mi.p) % Bv + Bv) % Bv;
        const room = eq(posB, 0) || eq(posB, Bv) ? r : Math.min(r, Bv - posB);
        let pick = tab.find(([g, val]) => val <= room + EPS && g !== 'Mx');
        /* a rest inside a coloured group counts two thirds of its value */
        const cp = tab.find(([g, val]) => eq(r * 1.5, val));
        if (cp && !tab.some(([g, val]) => eq(r, val))) pick = [cp[0], r];
        if (!pick) pick = tab[tab.length - 1];
        out.push(Object.assign({}, base, {t, d: pick[1] / mi.p, g: pick[0], mens: first ? mens : null, syl: first ? base.syl : []}));
        r = rt(r - pick[1]); t = rt(t + pick[1] / mi.p); first = false;
      }
      continue;
    }
    const sh = shapeReal(w, mi.T, mi.P);
    if (!sh) { pushSplit(out, base, w, mi.T, mi.P, false, mi.p); continue; }
    const pos = rt(((rt(e.t - segStart) * mi.p) % (mi.T * (mi.P === 3 ? 1.5 : 1))));
    out.push(Object.assign(base, {g: sh.g, dot: !!sh.dot, col: !!sh.col, imp: !!sh.imp, w, pos}));
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
  /* coloration in perfect tempus: imperfect breves that cut across the perfection grid are black, with their neighbours */
  if (mode === 'real') {
    for (let i = 0; i < out.length; i++) {
      const s = out[i];
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
const KEY = APP.store + ':v1';
const st = {
  piece: PIECES[0] || null, view: 'score', nota: 'real', clefs: 'mens', bars: 'full', staff: 'red', dashes: 'on', ed: 'on',
  size: 1.75, hs: 0.6, vs: 1, tempo: 90, beatHand: true, beatPend: false, beatTick: false, handOp: 0.3, handSize: 1, vol: 70, loop: false, verse: 0, paper: 'A4', orient: 'portrait', flow: 'vertical', paperCol: 'parchment', vis: {}, lines: '5', dark: 'off',
  ...(APP.defaults || {})
};
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
/* the spacing sliders now cover only their tight end */
/* every piece opens with the same look: staff size and spacing */
const LOOK = {size: 1.75, hs: 0.45, vs: 0.6, ss: 0.8};
function resetLook(){ Object.assign(st, LOOK); save(); for (const k of ['size', 'hs', 'vs', 'ss']) { const el = document.getElementById(k); if (el) el.value = st[k]; } }
for (const [k, v] of Object.entries(LOOK)) if (typeof st[k] !== 'number' || !isFinite(st[k])) st[k] = v;
st.hs = Math.max(0, Math.min(1.2, st.hs)); st.vs = Math.max(0, Math.min(2, st.vs)); st.ss = Math.max(0, Math.min(3, st.ss));
if (st.bars === 'mstrich') st.bars = 'full';
/* barlines now stand in each staff only; everyone starts again from those */
if (st.barsV !== 2) { st.bars = 'full'; st.barsV = 2; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} if (window.Organ) Organ.saveShared(); };
/* playback, metronome and sound: shared/organ.js, the same engine as the CantusFirmus app's */
const UNIT_NAMES = {Mx: 'Maxima', L: 'Longa', B: 'Brevis', S: 'Semibrevis', M: 'Minima', Sm: 'Semiminima', F: 'Fusa'};
let play = false;
Organ.init(st, {
  save: () => save(), replay: () => restartPlay(), toast: m => toast(m), playing: on => { play = on; setPlayIcon(on); document.documentElement.classList.toggle('playing', on); },
  units: ['Mx', 'L', 'B', 'S', 'M', 'Sm', 'F'], unitIcon: k => glyphIcon(k, 0.25), unitName: k => UNIT_NAMES[k]
});
if (st.audition === undefined) st.audition = true;
let toastTimer = 0;
function toast(msg){
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

let piece = null;           /* parsed piece */
let handTop = -1;           /* where the hand stands beside the music, px */
let pieceKey = null;
const cache = {};

/* per-voice switches: in the layout, notes, lyrics, playback (heard even when not shown) */
function vis(i){
  const all = st.vis[pieceKey] || (st.vis[pieceKey] = {});
  const o = all[i] || (all[i] = {on: true, notes: true, lyr: true});
  if (o.play === undefined) o.play = true;
  return o;
}

/* ------------------------------------------------------------------ */
/* Text measuring                                                      */
/* ------------------------------------------------------------------ */
const mctx = document.createElement('canvas').getContext('2d');
function textW(s, size, italic){
  mctx.font = `${italic ? 'italic ' : ''}100px "IM Fell English", Georgia, serif`;
  return mctx.measureText(s).width / 100 * size;
}

/* ------------------------------------------------------------------ */
/* Preparing voices for layout                                         */
/* ------------------------------------------------------------------ */
const LYR = 1.7;   /* lyric size, staff spaces */
const decoder = document.createElement('textarea');
function prepare(){
  const mode = st.nota;
  piece.voices.forEach((v, i) => {
    v.idx = i;
    v.clef = (vis(i).clef && CLEFS[vis(i).clef]) ? vis(i).clef : chooseClef(v, st.clefs);
    const syms = notate(piece, v, mode);
    const C = CLEFS[v.clef];
    for (const s of syms) {
      s.pos = s.rest ? null : s.step - C.bottom;
      const g = s.rest ? SHAPE_REST[s.g] : s.g + (s.col ? 'c' : '');
      s.glyph = g;
      s.hw = s.rest ? (s.g === 'Mx' ? 1.2 : s.g === 'Sm' || s.g === 'F' ? gw(g) : 0.42) : gw(g);
      /* accidental before the head (written ones only; key signature ones are implied) */
      s.acc = null; s.edAcc = null;
      if (!s.rest && s.alt !== null && s.alt !== undefined) {
        const key = keyAt(v, s.t), letter = LETTERS[((s.step % 7) + 7) % 7];
        const sigAlt = key[letter] || 0;
        const a = Math.max(-1, Math.min(1, s.alt));
        if (s.ed) { if (a !== sigAlt && st.ed === 'on') s.edAcc = ACCG[a]; }
        else if (a !== sigAlt) s.acc = ACCG[a];
      }
      s.left = s.acc ? gw(s.acc) + 0.35 : 0;
      if (s.mens) s.left += mensW(s.mens) + 1.3;
      s.right = s.hw + (s.dot ? 0.75 : 0);
      const sy = s.syl && s.syl[Math.min(st.verse, s.syl.length - 1)] !== undefined ? s.syl[Math.min(st.verse, (s.syl.length || 1) - 1)] : null;
      s.text = null; s.hy = false; s.hyRaw = false; s.cont = false; s.ww = 0;
      if (sy && sy !== '.') {
        let tx = sy.replace(/^-/, '');
        if (/-$/.test(tx)) { s.hyRaw = true; s.hy = st.dashes === 'on'; tx = tx.slice(0, -1); }
        tx = tx.replace(/\|\|?/g, '').replace(/_/g, ' ').trim();
        if (tx.includes('&')) { decoder.innerHTML = tx; tx = decoder.value; }
        s.text = tx; s.tw = textW(tx, LYR);
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
      for (const q of syms) if (q.text && !q.cont) { q.ww = textW(q.word, LYR); delete q.last; }
    }
    syms.forEach((q, k) => { q.id = 'n' + i + '-' + k; });
    v.syms = syms;
  });
}
function keyAt(v, t){
  let k = {};
  for (const e of v.keys) if (e.t <= t + EPS) k = e.alts;
  return k;
}
function mensW(sign){
  const s = sign || '';
  const hasShape = /[CO]/.test(s), num = (s.match(/\d+/) || [''])[0];
  return (hasShape ? 2.2 : 0) + (num ? 1.2 * num.length + (hasShape ? 0.3 : 0) : 0);
}

/* ------------------------------------------------------------------ */
/* Horizontal layout                                                   */
/* ------------------------------------------------------------------ */
/* horizontal spacing: at 0 the notes stand as close as they can without touching; the slider adds room by duration */
const spring = d => 0.05 + 0.25 * Math.min(1, st.hs) + (0.8 + 2.3 * Math.pow(Math.max(d, 0.05), 0.6)) * st.hs;

/* columns for a set of voices over [a, b) */
function columns(vlist, a, b, withLyrics){
  const map = new Map();
  const col = t => { const k = rt(t); let c = map.get(k); if (!c) { c = {t: k, items: new Map(), bar: null}; map.set(k, c); } return c; };
  for (const v of vlist) for (const s of v.syms) if (s.t >= a - EPS && s.t < b - EPS) col(s.t).items.set(v, s);
  for (const br of piece.bars) if (br.t > a + EPS && br.t < b - EPS) col(br.t).bar = br.type;
  const cols = [...map.values()].sort((x, y) => x.t - y.t);
  /* spacing */
  const lastX = new Map(), lastD = new Map(), lastSyl = new Map();
  let prev = null;
  const barOn = st.bars === 'full' || st.bars === 'tick';
  /* the lowest quarter of the spacing slider lets notes and syllables crowd, even overlap */
  const m1 = Math.min(1, st.hs);
  for (const c of cols) {
    let left = 0, right = 0.3;
    for (const s of c.items.values()) { left = Math.max(left, s.left); right = Math.max(right, s.right); }
    c.left = left; c.right = right;
    const needBar = c.bar && (barOn || c.bar === 'double');
    let x = prev ? prev.x + prev.right + left + 0.28 + 0.27 * m1 + (needBar ? 0.5 + 0.4 * m1 : 0) : left;
    for (const [v, s] of c.items) {
      if (lastX.has(v)) x = Math.max(x, lastX.get(v) + spring(lastD.get(v)) + (needBar ? 0.5 : 0));
      if (withLyrics(v) && s.text && !s.cont && lastSyl.has(v)) x = Math.max(x, lastSyl.get(v) + s.tw / 2 - s.hw / 2 + 0.3 + 0.25 * m1);
    }
    c.x = x;
    for (const [v, s] of c.items) {
      lastX.set(v, x); lastD.set(v, s.d);
      if (withLyrics(v) && s.text && s.ww) lastSyl.set(v, x + s.hw / 2 - s.tw / 2 + s.ww);
      else if (withLyrics(v) && s.text && !s.cont) lastSyl.set(v, x + s.hw / 2 + s.tw / 2 + (s.hy ? 0.9 : 0));
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
    if (j < cols.length && lastClean > i) end = lastClean;
    lines.push({from: i, to: end});
    i = end;
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */
const use = (k, x, y) => `<use href="#g-${k}" x="${f(x)}" y="${f(y)}"/>`;
const useT = (k, x, y, sx, sy) => `<use href="#g-${k}" transform="translate(${f(x)} ${f(y)}) scale(${sx} ${sy})"/>`;
const hl = (x1, x2, y, cls, w) => `<line class="${cls}" x1="${f(x1)}" x2="${f(x2)}" y1="${f(y)}" y2="${f(y)}" stroke-width="${w}"/>`;
const vl = (x, y1, y2, cls, w) => `<line class="${cls}" x1="${f(x)}" x2="${f(x)}" y1="${f(y1)}" y2="${f(y2)}" stroke-width="${w}"/>`;

function clefSvg(c, x, top){
  const C = CLEFS[c];
  let s = use(C.g, x, top + (8 - C.pos) * 0.5);
  if (C.oct) s += `<g transform="translate(${f(x + (gw(C.g) - gw('n8') * 0.8) / 2)} ${f(top + (8 - C.pos) * 0.5 + GLY[C.g].b[3] + 1.15)}) scale(0.8)">${use('n8', 0, 0)}</g>`;
  return s;
}
const clefW = c => gw(CLEFS[c].g);
function keySig(v, t, clef){
  const k = keyAt(v, t), C = CLEFS[clef], out = [];
  for (const L of Object.keys(k)) {
    const idx = LETTERS.indexOf(L);
    let best = null;
    for (let oct = 0; oct < 9; oct++) { const step = 7 * oct + idx, p = step - C.bottom; if (p >= 0 && p <= 8) best = p; }
    if (best === null) for (let oct = 0; oct < 9; oct++) { const step = 7 * oct + idx, p = step - C.bottom; if (p >= -1 && p <= 9) best = p; }
    if (best !== null) out.push({g: ACCG[k[L]], pos: best});
  }
  return out;
}
function mensSvg(sign, x, top){
  const s = sign || '';
  const hasC = /C/.test(s), hasO = /O/.test(s), stroke = /\|/.test(s), dot = /\./.test(s), rev = /r/.test(s);
  const num = (s.match(/\d+/) || [''])[0];
  const cy = top + 2, r = 1.05;
  const a = `fill="none" class="ms" stroke-width="0.2" stroke-linecap="round"`;
  let o = '', cx = x + 1.1;
  if (hasO) o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" ${a}/>`;
  else if (hasC) {
    const dx = r * 0.643 * (rev ? -1 : 1), y1 = cy - r * 0.766, y2 = cy + r * 0.766;
    o += `<path d="M${f(cx + dx)} ${f(y1)}A${r} ${r} 0 1 ${rev ? 1 : 0} ${f(cx + dx)} ${f(y2)}" ${a}/>`;
  }
  if (stroke && (hasC || hasO)) o += vl(cx, cy - 1.75, cy + 1.75, 'ms', 0.2);
  if (dot) o += `<circle class="ink" cx="${f(cx)}" cy="${f(cy)}" r="0.2"/>`;
  if (num) {
    const nx = hasC || hasO ? x + 2.5 : x;
    o += `<text x="${f(nx)}" y="${f(cy + 1.05)}" font-size="3">${num}</text>`;
  }
  return o;
}
function ledgers(pos, x, w, top){
  let s = '';
  for (let p = -2; p >= pos; p -= 2) s += hl(x - 0.4, x + w + 0.4, top + 4 - p * 0.5, 'ledger', 0.16);
  for (let p = st.lines === '4' ? 8 : 10; p <= pos; p += 2) s += hl(x - 0.4, x + w + 0.4, top + 4 - p * 0.5, 'ledger', 0.16);
  return s;
}
const rrect = (x, y1, y2) => `<rect class="ink" x="${f(x)}" y="${f(y1)}" width="0.42" height="${f(y2 - y1)}"/>`;
function restSvg(s, cx, top){
  const k = s.glyph, x = cx - 0.21;
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
/* how far a symbol reaches above and below the staff (staff spaces from the top line) */
function extent(s){
  if (s.rest) return [0, 4];
  const y = 4 - s.pos * 0.5;
  let lo = y - 0.8, hi = y + 0.8;
  const flip = isFlipped(s);
  if (STEMMED[s.g]) { if (flip) hi = y + 3.6; else lo = y - 3.6; }
  if (TAILED[s.g]) { if (flip) lo = y - 3.6; else hi = y + 3.6; }
  if (s.acc) { lo = Math.min(lo, y - (s.acc === 'fl' ? 2.1 : 1.6)); hi = Math.max(hi, y + 1.6); }
  if (s.edAcc) lo = Math.min(lo, Math.min(-0.9, y - (flip ? 1.6 : STEMMED[s.g] ? 4.3 : 1.7)) - 1.5);
  if (s.ferm) lo = Math.min(lo, y - 2.2, -1.6);
  return [lo, hi];
}
const isFlipped = s => (STEMMED[s.g] && s.pos >= 7) || (TAILED[s.g] && s.pos <= -1);

function symSvg(s, X, top, showNotes){
  /* with the notes hidden, the mensuration sign stays, like the clef */
  if (!showNotes) return s.mens ? mensSvg(s.mens, X - s.left, top) : '';
  const hy = s.rest ? top + 0.5 : top + 4 - s.pos * 0.5 - 1;
  return `<g class="${s.id}"><rect class="selbg" x="${f(X - 0.5)}" y="${f(top - 1.4)}" width="${f(s.hw + 1)}" height="6.8" rx="0.35"/><rect class="hit" x="${f(X - 0.3)}" y="${f(hy)}" width="${f(s.hw + 0.6)}" height="${s.rest ? 3 : 2}"/>${symInner(s, X, top)}</g>`;
}
function symInner(s, X, top){
  let o = '';
  let hx = X;
  if (s.mens) {
    const mx = X - s.left;
    o += `<g class="menshit" data-t="${s.t}"><rect x="${f(mx - 0.2)}" y="${f(top - 0.5)}" width="${f(s.left - 0.3)}" height="5" fill="transparent"/>${mensSvg(s.mens, mx, top)}</g>`;
  }
  if (s.rest) { o += restSvg(s, hx + s.hw / 2, top); return o; }
  const y = top + 4 - s.pos * 0.5;
  o += ledgers(s.pos, hx, s.hw, top);
  if (s.acc) o += use(s.acc, hx - gw(s.acc) - 0.3, y);
  o += isFlipped(s) ? useT(s.glyph, hx, y, 1, -1) : use(s.glyph, hx, y);
  if (s.dot) {
    const dy = top + 4 - (s.pos % 2 === 0 ? s.pos + 1 : s.pos) * 0.5;
    o += `<circle class="ink" cx="${f(hx + s.hw + 0.4)}" cy="${f(dy)}" r="0.19"/>`;
  }
  if (s.edAcc) {
    const ay = Math.min(top - 0.9, y - (isFlipped(s) ? 1.6 : (STEMMED[s.g] ? 4.3 : 1.7)));
    o += `<g transform="translate(${f(hx + s.hw / 2 - gw(s.edAcc) * 0.36)} ${f(ay)}) scale(0.72)">${use(s.edAcc, 0, 0)}</g>`;
  }
  if (s.ferm) {
    const fy = Math.min(top - 0.7, y - (STEMMED[s.g] && !isFlipped(s) ? 4.1 : 1.2));
    o += fermata(hx + s.hw / 2, fy);
  }
  return o;
}
function custosSvg(s, x, top){
  if (!s || s.rest) return '';
  const y = top + 4 - s.pos * 0.5;
  return `<use href="#g-${s.pos >= 5 ? 'cd' : 'cu'}" transform="translate(${f(x)} ${f(y + 0.4)}) scale(0.8)"/>`;
}

/* One line of one voice's staff. ctx: {v, cols(from..to), xs, top, x0, x1, last, showNotes, showLyr, first} */
function staffLine(o){
  const {v, top, x0, x1} = o;
  let s = '';
  for (let k = st.lines === '4' ? 1 : 0; k < 5; k++) s += hl(x0, x1, top + k, 'staff', 0.12);
  /* clef, key */
  const t0 = o.t0;
  const clef = v.clef;
  /* where the mouse writes notes; on the last line it reaches on to the margin, for adding at the end */
  const hx1 = o.tail ? Math.max(x1, o.tail) : x1;
  s += `<rect class="stafhit" data-v="${v.idx}" data-top="${f(top)}" data-end="${f(x1)}" data-k0="${o.k0 ?? ''}" data-k1="${o.k1 ?? ''}" x="${f(x0)}" y="${f(top - 2.6)}" width="${f(hx1 - x0)}" height="9.2" fill="transparent"/>`;
  s += `<g class="clefhit" data-v="${v.idx}"><rect x="${f(x0 + 0.2)}" y="${f(top - 1.5)}" width="${f(clefW(clef) + 0.6)}" height="7" fill="transparent"/>${clefSvg(clef, x0 + 0.5, top)}</g>`;
  let x = x0 + 0.5 + clefW(clef) + 0.5;
  for (const k of keySig(v, t0, clef)) { s += use(k.g, x, top + 4 - k.pos * 0.5); x += gw(k.g) + 0.15; }
  /* notes */
  const show = o.showNotes;
  for (let i = o.from; i < o.to; i++) {
    const c = o.cols[i], sym = c.items.get(v);
    if (!sym) continue;
    const X = o.xs[i];
    s += symSvg(sym, X, top, show);
    if (o.showLyr && sym.text && st.dashes !== 'off') {
      s += `<text x="${f(X + sym.hw / 2)}" y="${f(o.lyrY)}" font-size="${LYR}" text-anchor="middle">${esc(sym.text)}</text>`;
    }
  }
  /* hyphens between syllables, ties */
  let prevSyl = null;
  const syms = [];
  for (let i = o.from; i < o.to; i++) { const sym = o.cols[i].items.get(v); if (sym) syms.push([sym, o.xs[i]]); }
  /* without dashes: each word whole, starting where its first syllable starts (a word that runs over the line goes on from its next syllable) */
  if (o.showLyr && st.dashes === 'off') {
    let open = false;
    syms.forEach(([sym, X], k) => {
      if (!sym.text) return;
      if (sym.cont && open) return;
      const x = X + sym.hw / 2 - sym.tw / 2;
      if (sym.cont) {
        /* the line begins inside a word: nothing more if the line before wrote it whole */
        let i = v.syms.indexOf(sym) - 1;
        while (i >= 0 && (!v.syms[i].text || v.syms[i].cont)) i--;
        open = true;
        if (i >= 0 && v.syms[i].drewAll) return;
      }
      let w = sym.text;
      for (let j = k + 1; j < syms.length; j++) { const q = syms[j][0]; if (!q.text) continue; if (!q.cont) break; w += q.text; }
      /* a word that goes on past the line is written whole when it fits in the margin */
      if (!sym.cont) { sym.drewAll = w === sym.word || x + sym.ww <= o.lineEnd + 1.2; if (sym.drewAll) w = sym.word; }
      s += `<text x="${f(x)}" y="${f(o.lyrY)}" font-size="${LYR}">${esc(w)}</text>`;
      open = true;
    });
  }
  if (o.showLyr) {
    for (const [sym, X] of syms) {
      if (sym.text) {
        if (prevSyl && prevSyl[0].hy) {
          const a = prevSyl[1] + prevSyl[0].hw / 2 + prevSyl[0].tw / 2, b = X + sym.hw / 2 - sym.tw / 2;
          if (b - a > 0.6) s += hl((a + b) / 2 - 0.3, (a + b) / 2 + 0.3, o.lyrY - 0.45, 'barl', 0.1);
        }
        prevSyl = [sym, X];
      }
    }
    if (prevSyl && prevSyl[0].hy && !o.last) {
      const a = prevSyl[1] + prevSyl[0].hw / 2 + prevSyl[0].tw / 2;
      if (o.lineEnd - a > 0.8) s += hl(a + 0.3, a + 0.9, o.lyrY - 0.45, 'barl', 0.1);
    }
  }
  if (show) {
    for (let k = 0; k < syms.length; k++) {
      const [sym, X] = syms[k];
      if (sym.tieNext && !sym.rest) {
        const nx = syms[k + 1];
        const xa = X + sym.hw + 0.15, xb = nx ? nx[1] - 0.15 : o.lineEnd - 1.4;
        const y = top + 4 - sym.pos * 0.5 + (sym.pos >= 4 ? -0.9 : 0.9), dir = sym.pos >= 4 ? -1 : 1;
        s += `<path class="tie" fill="none" stroke-width="0.13" d="M${f(xa)} ${f(y)}Q${f((xa + xb) / 2)} ${f(y + dir * 0.9)} ${f(xb)} ${f(y)}"/>`;
      }
      if (sym.tup === 'start') {
        let k2 = k;
        while (k2 + 1 < syms.length && syms[k2 + 1][0].tup === 'in') k2++;
        const xa = X, xb = syms[k2][1] + syms[k2][0].hw;
        let lo = 0;
        for (let q = k; q <= k2; q++) lo = Math.min(lo, extent(syms[q][0])[0]);
        s += `<text x="${f((xa + xb) / 2)}" y="${f(top + lo - 0.5)}" font-size="1.7" text-anchor="middle" font-style="italic">3</text>`;
      }
    }
  }
  /* custos at the end of the line */
  if (!o.last && show && o.next) s += custosSvg(o.next, x1 - 2.0, top);
  return s;
}

/* barlines for a group of staves at column x */
/* segs: the stretches between the staves where a line may run (the lyrics are left clear) */
function barSvg(type, x, tops, single, segs){
  let s = '';
  const style = st.bars;
  /* barlines stand in each staff only, never in the space between the staves */
  if (type === 'double') {
    for (const t of tops) { s += vl(x - 0.25, t, t + 4, 'barl', 0.14) + vl(x + 0.25, t, t + 4, 'barl', 0.14); }
    return s;
  }
  if (style === 'none') return '';
  if (style === 'full') {
    for (const t of tops) s += vl(x, t, t + 4, 'barl', 0.14);
  } else if (style === 'tick') {
    for (const t of tops) s += vl(x, t - 0.9, t + 1, 'barl', 0.14);
  }
  return s;
}
function finalBar(x, tops){
  let s = '';
  for (const t of tops) s += `<rect class="ink" x="${f(x)}" y="${f(t)}" width="0.16" height="4"/><rect class="ink" x="${f(x + 0.4)}" y="${f(t)}" width="0.5" height="4"/>`;
  return s;
}

/* ------------------------------------------------------------------ */
/* Systems: a set of voices laid out together, line by line            */
/* ------------------------------------------------------------------ */
function headerW(v){
  const k = keySig(v, 0, v.clef).length;
  return 0.5 + clefW(v.clef) + 0.5 + k * 1.0 + 0.6;
}
/* build lines for voices over [a,b) at width W; returns lines with x positions */
function buildLines(vlist, a, b, W, opts = {}){
  const lyrOn = v => vis(v.idx).lyr;
  const cols = columns(vlist, a, b, lyrOn);
  if (!cols.length && APP.emptyStaves) cols.push({t: 0, items: new Map(), bar: null, left: 0, right: 24, x: 0, clean: true});
  if (!cols.length) return [];
  const hw = Math.max(...vlist.map(headerW));
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
    return {cols, from: L.from, to: L.to, xs, x0: ind, x1: last && !opts.fullLast ? Math.min(W, endX + (allEnd ? 0.9 : 0)) : W, last, W, endsPiece: last && allEnd, t0: cols[L.from].t, tEnd: L.to < cols.length ? cols[L.to].t : b};
  });
}
/* vertical room a voice needs in a line */
function lineRoom(v, line){
  const m = Math.min(1, st.vs), pad = 0.05 + 0.35 * m;
  let lo = -(0.05 + 1.15 * m), hi = 4.05 + 1.15 * m;
  /* the custos at the line end, pointing at the next note */
  const tEnd = line.tEnd !== undefined ? line.tEnd : line.to < line.cols.length ? line.cols[line.to].t : null;
  const nx = tEnd !== null && !line.endsPiece ? nextSym(v, tEnd) : null;
  if (nx && !nx.rest && nx.pos !== null && nx.pos !== undefined) { const y = 4 - nx.pos * 0.5; lo = Math.min(lo, y - 1.9 - pad); hi = Math.max(hi, y + 1.9 + pad); }
  /* the clef and the key signature at the line start */
  lo = Math.min(lo, -1.3 - pad);
  for (const k of keySig(v, line.cols[line.from].t, v.clef)) { const y = 4 - k.pos * 0.5; lo = Math.min(lo, y - (/fl/.test(k.g) ? 2.1 : 1.6) - pad); hi = Math.max(hi, y + 1.6 + pad); }
  for (let i = line.from; i < line.to; i++) {
    const s = line.cols[i].items.get(v);
    if (!s) continue;
    const e = extent(s);
    lo = Math.min(lo, e[0] - pad); hi = Math.max(hi, e[1] + pad);
  }
  const lyr = vis(v.idx).lyr && v.syms.some(s => s.text);
  const lyrY = Math.max(4 + 1.5 + 1.1 * m, hi + 0.9 + 0.6 * m);
  if (lyr) hi = lyrY + 0.7;
  return {above: -lo, below: hi - 4, lyrY};
}
function nextSym(v, t){
  return v.syms.find(s => s.t >= t - EPS) || null;
}
function sectionLabels(line, top, W){
  let s = '';
  for (const sec of piece.sections) {
    if (sec.t < line.t0 - EPS || sec.t >= line.tEnd - EPS) continue;
    let i = line.cols.findIndex((c, k) => k >= line.from && k < line.to && c.t >= sec.t - EPS);
    if (i < 0) continue;
    const x = sec.t < EPS ? line.x0 : line.xs[i] - 0.5;
    s += `<text x="${f(x)}" y="${f(top)}" font-size="1.9" font-style="italic">${esc(sec.label)}</text>`;
  }
  return s;
}
/* draw one system (several voices stacked) at y; returns {svg, h} */
function drawSystem(vlist, line, y, opts = {}){
  const rooms = vlist.map(v => lineRoom(v, line));
  const gap = Math.max(1, 1.2 * st.vs);
  const tops = [];
  let yy = y;
  const secRoom = piece.sections.some(sec => sec.t >= line.t0 - EPS && sec.t < line.tEnd - EPS) ? 2.6 : 0;
  yy += secRoom;
  vlist.forEach((v, k) => {
    yy += rooms[k].above + (k ? gap : 0);
    tops.push(yy);
    yy += 4 + rooms[k].below;
  });
  let s = '';
  if (secRoom) s += sectionLabels(line, tops[0] - rooms[0].above - 0.4, line.x1);
  vlist.forEach((v, k) => {
    const sh = vis(v.idx);
    let k0 = null, k1 = null;
    for (let ci = line.from; ci < line.to; ci++) { const q = line.cols[ci].items.get(v); if (q) { const kk = +q.id.split('-')[1]; if (k0 === null) k0 = kk; k1 = kk; } }
    s += staffLine({v, k0, k1, cols: line.cols, from: line.from, to: line.to, xs: line.xs, top: tops[k], x0: line.x0, x1: line.x1,
      last: line.endsPiece, tail: line.last ? line.W : null, t0: line.t0, showNotes: sh.notes, showLyr: sh.lyr, lyrY: tops[k] + rooms[k].lyrY, lineEnd: line.x1,
      next: nextSym(v, line.tEnd)});
    if (opts.names && opts.names[k]) s += `<text class="vnamehit" data-v="${v.idx}" x="${f(line.x0 - 0.8)}" y="${f(tops[k] + 2.6)}" font-size="1.8" text-anchor="end" font-style="italic">${esc(opts.names[k])}</text>`;
  });
  /* barlines */
  const single = vlist.length === 1;
  const segs = [];
  for (let k = 0; k + 1 < vlist.length; k++) {
    const a = tops[k] + 4, b = tops[k + 1];
    const hasLyr = vis(vlist[k].idx).lyr && vlist[k].syms.some(q => q.text);
    if (hasLyr) { const ly = tops[k] + rooms[k].lyrY; segs.push([[a, ly - 1.7], [ly + 0.7, b]]); }
    else segs.push([[a, b]]);
  }
  for (let i = line.from; i < line.to; i++) {
    const c = line.cols[i];
    if (!c.bar || i === line.from) continue;
    const bx = line.xs[i] - c.left - (st.bars === 'full' || st.bars === 'tick' || c.bar === 'double' ? 0.85 : 0.6);
    s += barSvg(c.bar, bx, tops, single, segs);
  }
  /* a barline that falls on the line break goes at the line end */
  if (!line.endsPiece) {
    const br = piece.bars.find(b => eq(b.t, line.tEnd));
    if (br && br.type === 'double') s += barSvg('double', line.x1 - 0.4, tops, single, segs);
  }
  if (line.endsPiece) s += finalBar(line.x1 - 0.9, tops);
  /* left edge: a thin line joining the staves in score */
  if (vlist.length > 1 && opts.join) s += vl(line.x0, tops[0], tops[tops.length - 1] + 4, 'barl', 0.14);
  return {svg: s, h: yy - y, tops};
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */
const PAPER = {A3: [297, 420], A4: [210, 297], A5: [148, 210]};
function pageGeom(){
  if (st.paper === 'web') {
    const avail = Math.max(240, ($('.viewwrap').clientWidth || window.innerWidth) - 40);
    /* the two pages of an opening side by side, or one below the other on a narrow screen */
    const w = (st.view === 'choir' && avail >= 660 ? avail / 2 : avail) / (96 / 25.4), sp = st.size * 1.2, H = 100000;
    return {web: true, wmm: w, hmm: H * sp, sp, W: w / sp, H, M: Math.min(w, 297) * 0.065 / sp};
  }
  let [w, h] = PAPER[st.paper] || PAPER.A4;
  if (st.orient === 'landscape') [w, h] = [h, w];
  const sp = st.size * (st.paper === 'A5' ? 0.82 : st.paper === 'A3' ? 1.25 : 1);
  const m = Math.min(w, h) * 0.065;
  return {wmm: w, hmm: h, sp, W: w / sp, H: h / sp, M: m / sp};
}
/* the foot of a page: the credits on the first, the title and the page number on the others */
/* on the Web page a fixed size, about that of the lyrics (the page has no paper size to go by) */
function footFont(G){ return G.web ? 1.6 : Math.min(G.wmm, G.hmm) * 0.0115 / G.sp; }
function wrapText(text, size, width){
  const words = text.split(/\s+/).filter(Boolean), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && textW(t, size, false) > width) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function footLines(G){
  const c = creditText(), fs = footFont(G), W = G.W - 2 * G.M;
  return [...(c.about ? wrapText(c.about, fs, W) : []), c.made];
}
/* how far up the first page's credits reach, so the music stops above them */
function footTop(G, first){
  const fs = footFont(G), lh = fs * 1.35, base = G.H - G.M * 0.42;
  const n = first ? footLines(G).length : 1;
  return Math.min(G.H - G.M, base - (n - 1) * lh - fs * 1.2);
}
/* Web: the page ends just below the music */
function webGeom(G, yEnd, first){
  const fs = footFont(G), lh = fs * 1.35, n = first ? footLines(G).length : 1;
  const H = yEnd + 2.8 + (n - 1) * lh + fs * 1.2 + G.M * 0.42;
  return {...G, H, hmm: H * G.sp};
}
function footSvg(G, first, num){
  const fs = footFont(G), lh = fs * 1.35, base = G.H - G.M * 0.42;
  let s = '';
  if (first) {
    const L = footLines(G);
    L.forEach((t, i) => { s += `<text class="foot" x="${f(G.W / 2)}" y="${f(base - (L.length - 1 - i) * lh)}" font-size="${f(fs)}" text-anchor="middle"${i === L.length - 1 ? ' font-style="italic"' : ''}>${esc(t)}</text>`; });
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
  let s = `<text class="title" x="${f((x0 + x1) / 2)}" y="${f(y + 3.2)}" font-size="3.4" text-anchor="middle">${esc(piece.title)}</text>`;
  let h = 4.6;
  if (sub) { s += `<text x="${f((x0 + x1) / 2)}" y="${f(y + h + 1.9)}" font-size="2.2" text-anchor="middle" font-style="italic">${esc(sub)}</text>`; h += 2.8; }
  if (piece.composer) { s += `<text x="${f(x1)}" y="${f(y + h + 1.6)}" font-size="1.9" text-anchor="end">${esc(piece.composer)}</text>`; h += 2.4; }
  return {svg: s, h: h + 1.2};
}
function visibleVoices(){ return piece.voices.filter(v => vis(v.idx).on); }

function layoutScore(G){
  const vlist = visibleVoices();
  if (!vlist.length) return [];
  const names = vlist.map(v => v.name);
  const indent = Math.max(...names.map(n => textW(n, 1.8, true))) + 1.4;
  const W = G.W - 2 * G.M;
  const lines = buildLines(vlist, 0, piece.end + 1, W, {indent});
  return paginate(G, lines, vlist, (line, li) => li === 0 ? {names, join: true} : {join: true}, null);
}
function paginate(G, lines, vlist, optsFor, sub){
  const pages = [];
  let body = '', y = G.M, first = true;
  const sysGap = Math.max(1, 2.2 * st.ss + Math.min(1, st.ss));
  const newPage = () => { pages.push(body); body = ''; y = G.M; };
  if (first) { const tb = titleBlock(G, G.M, G.W - G.M, y, sub); body += tb.svg; y += tb.h; }
  const bottom1 = footTop(G, true) - 0.8, bottom = footTop(G, false) - 0.8;
  lines.forEach((line, li) => {
    const probe = drawSystem(vlist, line, 0, optsFor(line, li));
    if (y + probe.h > (pages.length ? bottom : bottom1) && body) newPage();
    const sys = drawSystem(vlist, line, y, optsFor(line, li));
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
    const lines = buildLines([v], 0, piece.end + 1, W, {});
    out.push(...paginate(G, lines, [v], () => ({}), v.name));
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
  while (a < piece.end - EPS && guard++ < 500) {
    const top = G.M + (openings.length === 0 ? tb.h : 0) + 0.4;
    const caps = new Map();
    sides.forEach(side => capacity(side, top, openings.length === 0).forEach((c, k) => caps.set(side[k], c)));
    const fits = b => vlist.every(v => heightNeeded(v, a, b) <= caps.get(v));
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
        body += `<text class="vnamehit" data-v="${v.idx}" x="${f(G.M)}" y="${f(y0 + 1.6)}" font-size="1.8" font-style="italic">${esc(v.name)}</text>`;
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
function render(){
  if (!piece) return;
  defs();
  prepare();
  const G = pageGeom();
  document.getElementById('pagerule').textContent = `@page{size:${G.web ? 'A4' : st.paper} ${st.orient};margin:0}`;
  let html = '';
  const fs = wrapEl.classList.contains('fs');
  const horiz = st.flow === 'horizontal' && !G.web;
  document.querySelectorAll('#orientSeg button,#flowSeg button').forEach(b => { b.disabled = !!G.web; });
  const avail = ($('.viewwrap').clientWidth || window.innerWidth) - (horiz ? (window.innerWidth <= 700 ? 60 : 140) : 40);
  const pxmm = 96 / 25.4;
  /* side by side, a page (or an opening) fits the height of the window */
  const availH = Math.max(320, (fs ? window.innerHeight : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) || 700) - 60);
  const fitH = horiz ? availH / (G.hmm * pxmm) : Infinity;
  if (st.view === 'choir') {
    const pages = layoutChoir(G);
    const sc = G.web ? 1 : Math.min(1.25, avail / (2 * G.wmm * pxmm), fitH);
    for (let i = 0; i < pages.length; i += 2) {
      html += `<div class="opening${G.web && 2 * G.wmm * pxmm > avail + 1 ? ' stack' : ''}">`;
      for (const p of pages.slice(i, i + 2)) html += pageDiv(p.svg, G, sc, '');
      html += `</div>`;
    }
    if (!pages.length) html = '<p class="msg">No voices are shown.</p>';
  } else {
    const pages = st.view === 'parts' ? layoutParts(G) : layoutScore(G);
    const sc = G.web ? 1 : Math.min(1.25, avail / (G.wmm * pxmm), fitH);
    pages.forEach(p => { html += pageDiv(p, G, sc, ''); });
    if (!pages.length) html = '<p class="msg">No voices are shown.</p>';
  }
  viewerEl.style.width = '';
  pagesEl.innerHTML = html;
  /* the frame is as wide as one page (one opening in the choir book), measured afresh for every view */
  const framed = !horiz && window.innerWidth > 700;
  viewerEl.classList.toggle('frame', framed); wrapEl.classList.toggle('framed', framed);
  viewerEl.classList.toggle('horiz', horiz); wrapEl.classList.toggle('horiz', horiz);
  const widest = Math.max(0, ...[...pagesEl.children].map(c => c.offsetWidth || 0));
  viewerEl.style.width = framed && widest ? (widest + 24) + 'px' : '';
  $('#fsBtn').style.left = (viewerEl.offsetLeft + 6) + 'px';
  if (typeof showSel === 'function' && (ed.sel || ed.ins)) showSel();
  applyMark();
  if (!play) { handTop = -1; $('#handBox').style.top = ''; $('#pendBox').style.top = ''; if (st.view === 'choir') handMid(null); }
  syncNav();
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
  viewerEl.scrollTo({left: c.offsetLeft + c.offsetWidth / 2 - viewerEl.clientWidth / 2, behavior: 'smooth'});
}
function syncNav(){
  const horiz = st.flow === 'horizontal' && st.paper !== 'web';
  const max = viewerEl.scrollWidth - viewerEl.clientWidth;
  $('#pgPrev').disabled = !horiz || viewerEl.scrollLeft <= 2;
  $('#pgNext').disabled = !horiz || viewerEl.scrollLeft >= max - 2;
}
$('#pgPrev').addEventListener('click', () => goPage(-1));
$('#pgNext').addEventListener('click', () => goPage(1));
viewerEl.addEventListener('scroll', () => syncNav(), {passive: true});
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
  if (offX) { const c = navItems().find(c => c.contains(el)); if (c) viewerEl.scrollTo({left: c.offsetLeft + c.offsetWidth / 2 - viewerEl.clientWidth / 2, behavior: 'smooth'}); }
  if (offY) {
    const y = r.top - top - (bottom - top) / 3;
    if (EMBED) { try { window.top.scrollBy({top: y, behavior: 'smooth'}); return true; } catch (e) {} }
    window.scrollBy({top: y, behavior: 'smooth'});
  }
  return true;
}
function pageDiv(svg, G, sc, extra){
  let hmm = G.hmm;
  if (G.web) { const m = /viewBox="0 0 [-\d.]+ ([\d.]+)"/.exec(svg); if (m) hmm = +m[1] * G.sp; }
  return `<div class="page" style="width:${f(G.wmm * 96 / 25.4 * sc)}px;height:${f(hmm * 96 / 25.4 * sc)}px" data-w="${G.wmm}" data-h="${hmm}">${svg}${extra}</div>`;
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
  pal: 'the music21 corpus, github.com/cuthbertLab/music21'};
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
  pal: ['music21 corpus (Palestrina, encoded by John Miller)', 'https://github.com/cuthbertLab/music21', '']};
let catPromise = null;
function loadCatalogue(){
  if (!catPromise) catPromise = fetch('choirbook/catalogue.json').then(r => r.json()).then(j => {
    CAT = j; CAT.pieces.forEach(e => { CATBY[e.k] = e; });
    return CAT;
  });
  return catPromise;
}
function catUrl(e){
  if (e.h) return 'choirbook/redix-progressio/' + e.k + '.krn';
  return CAT.sources[e.s] + (e.u || (e.s === 'pal' ? e.k.slice(4) : e.k) + '.krn');
}
async function pieceUrl(key){
  if (PIECES.includes(key)) return 'choirbook/' + key;
  await loadCatalogue();
  const e = CATBY[key];
  if (!e) throw new Error('This piece is not in the library: ' + key);
  return catUrl(e);
}
function showSource(key){
  const el = $('#srcNote'); if (!el) return;
  const e = CATBY[key];
  const info = $('#infoSrc');
  if (info) {
    const c = creditText().about;
    info.innerHTML = e ? '' : esc(c || (key && key.startsWith('mine:') ? `Your own, kept in this browser (${L.mine}).` : key && key.startsWith('file:') ? 'A file from your computer: ' + key.slice(5) : ''));
  }
  if (!e) { el.textContent = ''; return; }
  const [n, href] = SRC_NAMES[e.s] || ['', '', ''];
  const lic = piece && piece.meta && piece.meta.YEC;
  el.innerHTML = `Score: <a href="${esc(href)}" target="_blank" rel="noopener">${esc(n)}</a>${lic ? '. ' + esc(lic) : ''} · <a href="${esc(catUrl(e))}" target="_blank" rel="noopener">source file</a>`;
  if (info) info.innerHTML = el.innerHTML;
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
async function loadPiece(file){
  let text = cache[file];
  if (!text && file.startsWith('mine:')) {
    const m = mineAll()[file];
    if (!m) throw new Error('This score is no longer kept in this browser.');
    text = m.text;
  }
  if (!text) {
    const r = await fetch(await pieceUrl(file));
    if (!r.ok) throw new Error('Could not load ' + file);
    text = cache[file] = await r.text();
  }
  stopPlay();
  let saved = null; try { saved = localStorage.getItem(APP.store + ':edit:' + file); } catch (e) {}
  piece = null;
  if (saved && file.startsWith('mine:')) { try { piece = parseKern(saved); piece.text = saved; } catch (e) { piece = null; } }
  if (!piece) piece = parseKern(text);
  if (H.afterParse) { H.afterParse(piece); piece.text = writeKern(piece); }
  pieceKey = file;
  if (typeof ed !== 'undefined') { ed.sel = null; ed.undo = []; ed.redo = []; ed.warned = false; }
  resetLook();
  st.piece = file; save();
  st.verse = 0;
  if (H.afterLoad) H.afterLoad();
  showSource(file);
  syncUI();
  render();
}
function loadText(name, text){
  try {
    stopPlay();
    piece = parseKern(text);
    pieceKey = 'file:' + name;
    if (typeof ed !== 'undefined') { ed.sel = null; ed.undo = []; ed.redo = []; ed.warned = false; }
    resetLook();
    syncUI(); render();
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
function libList(){
  const box = $('#libList'); if (!box || !CAT) return;
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
  let html = `<p class="libhint">${n} piece${n === 1 ? '' : 's'}${n > show.length ? ` (showing ${show.length})` : ''}</p>`;
  const favs = favAll();
  html += show.map(e => `<div class="lrow">${itemHtml(e.k, e.t, `${nameOf(e.c)}${e.a ? ' (attributed)' : ''}${e.d ? ', ' + e.d : ''} · ${e.v} voices · ${(GENRES[e.g] || e.g).replace(/s$/, '')}`)}${favBtn(e.k, !!favs[e.k], e.t)}</div>`).join('');
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
function mineHtml(){
  const all = mineAll(), favs = favAll();
  const rows = [
    ...Object.keys(all).map(id => ({at: all[id].at, html: `<div class="mine">${itemHtml(id, all[id].title || 'Untitled', L.mineSub + new Date(all[id].at).toLocaleDateString())}<button class="mdel" data-del="${esc(id)}" aria-label="Remove ${esc(all[id].title || 'this score')}" title="Remove from ${esc(L.mine)}">×</button></div>`})),
    ...Object.keys(favs).map(k => ({at: favs[k].at, html: `<div class="mine">${itemHtml(k, favs[k].t, favs[k].c)}${favBtn(k, true, favs[k].t)}</div>`}))
  ].sort((a, b) => b.at - a.at);
  if (!rows.length && !L.mineHint) return '';
  return `<h2>${esc(L.mine)}</h2>` + (rows.length ? rows.map(r => r.html).join('')
    : L.mineHint ? `<p class="libhint">${esc(L.mineHint)}</p>` : '');
}
function refreshMine(){
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
    <div id="libFeat"><div id="libMine">${mineHtml()}</div><h2>Library</h2>
    <p class="gnote">From the <a href="https://josquin.stanford.edu" target="_blank" rel="noopener">Josquin Research Project</a>, <a href="https://1520s-project.org" target="_blank" rel="noopener">the 1520s Project</a> and the <a href="https://github.com/cuthbertLab/music21" target="_blank" rel="noopener">music21</a> Palestrina masses, as collected by <a href="https://github.com/ugobindini/redix" target="_blank" rel="noopener">ReDiX</a> (Ugo Bindini). Search their sonorities with <a href="../redix-progressio.html" target="_top">ReDiX Progressio</a>.</p></div>
    <div id="libList"></div>`;
  const upd = () => { lib.shown = 150; $('#libFeat').hidden = !!(lib.q || lib.comp || lib.genre || lib.voices); libList(); };
  $('#libQ').addEventListener('input', e => { lib.q = e.target.value; upd(); });
  $('#libComp').addEventListener('change', e => { lib.comp = e.target.value; upd(); });
  $('#libGenre').addEventListener('change', e => { lib.genre = e.target.value; upd(); });
  $('#libVoices').addEventListener('change', e => { lib.voices = e.target.value; upd(); });
  $('#libSort').addEventListener('change', e => { lib.sort = e.target.value; upd(); });
  libList();
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */
const STAFF_COLORS = [['red', '#8E2A1E', 'Red'], ['black', '#2A2218', 'Black'], ['brown', '#8A6A44', 'Brown'], ['blue', '#2F4F8F', 'Blue'], ['grey', '#9A9286', 'Grey']];
$('#staffSeg').innerHTML = STAFF_COLORS.map(([k, c, n]) => `<button class="tb swatch" data-v="${k}" style="--c:${c}" aria-label="${n}" title="${n}"><i></i></button>`).join('');
const PAPER_COLORS = [['parchment', '#EFE3C7', 'Parchment'], ['beige', '#EADCC0', 'Beige'], ['white', '#FFFFFF', 'White']];
$('#paperColSeg').innerHTML = PAPER_COLORS.map(([k, c, n]) => `<button class="tb swatch" data-v="${k}" style="--c:${c}" aria-label="${n}" title="${n}"><i${k === 'parchment' ? ' style="background:#EFE3C7 var(--paper);background-size:160px"' : ''}></i></button>`).join('') +
  `<label class="tb swatch pick" id="paperPickL" title="Any colour" aria-label="Any colour"><i></i><input type="color" id="paperPick" value="#e8e0d0"></label>`;
$('#paperColSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  st.paperCol = b.dataset.v; save(); syncUI();
});
$('#paperPick').addEventListener('input', e => { st.paperCol = e.target.value; save(); syncUI(); });
function applyPaper(){
  const named = PAPER_COLORS.find(c => c[0] === st.paperCol);
  const col = named ? named[1] : (/^#[0-9a-f]{6}$/i.test(st.paperCol) ? st.paperCol : '#EFE3C7');
  document.documentElement.style.setProperty('--pagebg', col);
  document.documentElement.classList.toggle('flatpaper', st.paperCol !== 'parchment');
  $('#paperColSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.paperCol)));
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
  const segs = {'#viewList': 'view', '#notaSeg': 'nota', '#clefSeg': 'clefs', '#barSeg': 'bars', '#paperSeg': 'paper', '#orientSeg': 'orient', '#flowSeg': 'flow', '#staffSeg': 'staff', '#dashSeg': 'dashes', '#edSeg': 'ed', '#linesSeg': 'lines', '#darkSeg': 'dark'};
  for (const [id, k] of Object.entries(segs)) $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st[k])));
  for (const k of ['size', 'hs', 'vs', 'ss']) $('#' + k).value = st[k];
  Organ.sync();
  $('#handOp').value = st.handOp; $('#handSize').value = st.handSize;
  if ($('#audition')) $('#audition').checked = !!st.audition;
  document.documentElement.style.setProperty('--staff', (STAFF_COLORS.find(c => c[0] === st.staff) || STAFF_COLORS[0])[1]);
  applyPaper();
  const horiz = st.flow === 'horizontal' && st.paper !== 'web';
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
        `<td><input class="vname" data-i="${v.idx}" value="${esc(v.name)}" aria-label="Name of the voice" title="Click to rename"></td>${cb('on', 'shown')}${cb('notes', 'notes')}${cb('lyr', 'lyrics')}${cb('play', 'playback')}` +
        `<td><button class="vbtn vexp" data-op="cf" data-i="${v.idx}" title="Open in CantusFirmus" aria-label="Open ${esc(v.name)} in CantusFirmus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.5h6.5V10h-2V6.9l-6.8 6.8-1.4-1.4 6.8-6.8H14ZM4.5 6.5h7v2h-5v9h9v-5h2v7h-13Z"/></svg></button></td>` +
        `<td><button class="vbtn vdel" data-op="del" data-i="${v.idx}" aria-label="Remove ${esc(v.name)}" title="Remove this voice">×</button></td></tr>`;
    };
    $('#voiceTable').innerHTML = `<thead><tr><th></th><th></th><th>Shown</th><th>Notes</th><th>Lyrics</th><th>Playback</th><th></th><th></th></tr></thead><tbody>` + piece.voices.map((v, i) => { v.idx = i; return row(v); }).join('') +
      `</tbody><tfoot><tr><td colspan="8"><button data-op="add">+ New voice</button></td></tr></tfoot>`;
    }
    if (document.activeElement !== $('#metaTitle')) $('#metaTitle').value = (piece.meta.OTL || piece.title || '').replace(/\s*\.\.\.\s*/g, ' … ');
    if (document.activeElement !== $('#metaComp')) $('#metaComp').value = piece.meta.COM || piece.meta.COA || '';
  }
  document.querySelectorAll('#library .pc').forEach(b => b.setAttribute('aria-current', String(b.dataset.p === pieceKey)));
}
segInit('#viewList', 'view'); segInit('#notaSeg', 'nota'); segInit('#clefSeg', 'clefs'); segInit('#barSeg', 'bars');
segInit('#paperSeg', 'paper'); segInit('#orientSeg', 'orient'); segInit('#flowSeg', 'flow', () => { viewerEl.scrollLeft = 0; syncNav(); }); segInit('#staffSeg', 'staff'); segInit('#dashSeg', 'dashes'); segInit('#linesSeg', 'lines'); segInit('#darkSeg', 'dark', () => { if (H.dark) H.dark(); }); segInit('#edSeg', 'ed');
$('#verseSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.verse = +b.dataset.v; save(); syncUI(); render(); });
let rq = 0;
const later = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(render); };
for (const k of ['size', 'hs', 'vs', 'ss']) $('#' + k).addEventListener('input', e => { st[k] = +e.target.value; save(); later(); });
/* ---------------- Voices: name, clef, add, remove, open in CantusFirmus ---------------- */
/* the clefs, as CantusFirmus offers them (Samuel prefers its clef menu): short name and full name */
const CLEF_MENU = [['treble8', 'G2 8', 'G clef on line 2, octave lower (tenor)'], ['treble', 'G2', 'G clef on line 2'], ['g1', 'G1', 'G clef on line 1'],
  ['c1', 'C1', 'C clef on line 1'], ['c2', 'C2', 'C clef on line 2'], ['c3', 'C3', 'C clef on line 3'], ['c4', 'C4', 'C clef on line 4'], ['c5', 'C5', 'C clef on line 5'],
  ['f3', 'F3', 'F clef on line 3'], ['bass', 'F4', 'F clef on line 4']];
const VCLEFS = [['', 'As written'], ...CLEF_MENU.map(c => [c[0], c[2]])];
const CLEF_KERN = {g1: 'G1', treble: 'G2', treble8: 'Gv2', bass: 'F4', f3: 'F3', c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4', c5: 'C5'};
/* a voice of rests as long as the piece, with the signs of the voice next to it */
function restVoice(name, clef, like){
  const v = {name, abbr: '', kclef: CLEF_KERN[clef], events: [], mets: [], keys: [], clefs: [{t: 0, c: CLEF_KERN[clef], ei: 0}], verses: 0, t: 0};
  const cuts = like ? [...new Set([0, ...like.mets.map(m => m.t), piece.end])].sort((a, b) => a - b) : [0, piece.end || 2];
  for (let k = 0; k + 1 < cuts.length; k++) {
    let r = rt(cuts[k + 1] - cuts[k]), t = cuts[k];
    const m = like && like.mets.find(x => eq(x.t, cuts[k]));
    if (m) v.mets.push({t, sign: m.sign, ei: v.events.length});
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
  rename(i, name){ name = name.trim().slice(0, 40); if (!name || piece.voices[i].name === name) return; commit(() => { piece.voices[i].name = name; }); },
  clef(i, c){
    vis(i).clef = c || null; save();
    if (c && !writable(piece.voices[i])) { render(); return; }
    if (c) commit(() => { const v = piece.voices[i]; if (v.clefs.length && eq(v.clefs[0].t, 0)) v.clefs[0].c = CLEF_KERN[c]; else v.clefs.unshift({t: 0, c: CLEF_KERN[c], ei: 0}); });
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
    toast('A new voice at the top. Drag it by ⠿ to put it in its place; Edit, then click its staff to write.');
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
$('#voiceTable').addEventListener('click', e => {
  const b = e.target.closest('button[data-op]'); if (!b) return;
  e.stopPropagation();
  const i = +b.dataset.i;
  if (b.dataset.op === 'cf') sendTo('cantus-firmus', i);
  else if (b.dataset.op === 'del') VOICE_OPS.remove(i);
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
$('#metaTitle').addEventListener('change', e => { const t = e.target.value.trim(); if (!piece || !t) return; commit(() => { for (const k of Object.keys(piece.meta)) if (k.startsWith('OTL') || k === 'OPR') delete piece.meta[k]; piece.meta.OTL = t; }); });
$('#metaComp').addEventListener('change', e => { if (!piece) return; const c = e.target.value.trim(); commit(() => { delete piece.meta.COA; if (c) piece.meta.COM = c; else delete piece.meta.COM; }); });
['#metaTitle', '#metaComp'].forEach(id => $(id).addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); }));

/* a new score: four voices, a brevis rest each, ready to write in */
function kernOf(title, voices){
  const vs = voices.slice().reverse();
  const L = [`!!!OTL: ${title}`, vs.map(() => '**kern').join('\t'), vs.map(v => `*I"${v[0]}`).join('\t'), vs.map(v => `*clef${v[1]}`).join('\t'),
    vs.map(() => '*met(C)').join('\t'), vs.map(() => '=1-').join('\t'), vs.map(() => '0r').join('\t'), vs.map(() => '==').join('\t'), vs.map(() => '*-').join('\t')];
  return L.join('\n') + '\n';
}
async function newScore(){
  const id = mineAdd('New score', kernOf('New score', [['Superius', 'G2'], ['Altus', 'Gv2'], ['Tenor', 'Gv2'], ['Bassus', 'F4']]));
  await loadPiece(id);
  ['treble', 'treble8', 'treble8', 'bass'].forEach((c, i) => { vis(i).clef = c; });
  save(); render();
  refreshMine();
  ed.on = true; ed.sel = {vi: 0, ei: 0}; syncEdit(); showSel();
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
$('#voiceTable').addEventListener('change', e => {
  const c = e.target; if (!c.dataset.k) return;
  vis(+c.dataset.i)[c.dataset.k] = c.checked; save(); syncUI(); render();
  if (play && (c.dataset.k === 'on' || c.dataset.k === 'play')) restartPlay();
});
/* pieces */
const libEl = $('#library'), libBtn = $('#libBtn');
function setLib(open){ libEl.hidden = !open; libBtn.setAttribute('aria-expanded', String(open)); postHeight(); if (open) { const q = $('#libQ'); if (q) setTimeout(() => q.focus(), 0); } }
$('#markClear').addEventListener('click', () => { mark = null; document.querySelectorAll('#pages g.mark').forEach(g => g.classList.remove('mark')); $('#markBar').hidden = true; setAddress(pieceKey); postHeight(); });
libBtn.addEventListener('click', e => { e.stopPropagation(); closePops(); setLib(libEl.hidden); });
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
  if (e.target.id === 'libMore') { lib.shown += 300; libList(); return; }
  const b = e.target.closest('.pc'); if (!b) return;
  setLib(false); mark = null;
  loadPiece(b.dataset.p).then(() => { if (!b.dataset.p.startsWith('mine:')) setAddress(b.dataset.p); }).catch(err => { pagesEl.innerHTML = `<p class="msg">${esc(err.message)}</p>`; });
});
/* the note-input tools (shared/note-input.js, the same as CantusFirmus) go in before the pop-overs are wired */
NoteInput.build($('#editBar'), {what: 'voice', whole: 'the whole voice'});
/* pop-overs: hover, or click to keep open */
function closePops(except){ document.querySelectorAll('.pop.open').forEach(p => { if (p !== except) { p.classList.remove('open'); p.querySelector('button').setAttribute('aria-expanded', 'false'); } }); }
document.querySelectorAll('.pop > button').forEach(b => b.addEventListener('click', () => {
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
/* **kern is read as it is; MusicXML, MuseScore, MIDI and LilyPond are turned into **kern first (shared/score-import.js) */
function openFile(file){
  if (window.ScoreImport && ScoreImport.accepts(file.name)) ScoreImport.toKern(file).then(k => loadText(file.name, k), err => { stopPlay(); pagesEl.innerHTML = `<p class="msg">${esc(err.message)}</p>`; });
  else file.text().then(t => loadText(file.name, t));
}
$('#printBtn').addEventListener('click', () => {
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
  for (let n = 1; n <= 96; n++) { const m = d * n; if (Math.abs(m - Math.round(m)) < 1e-6) return n + '%' + Math.round(m); }
  return '1';
}
function pitchTok(step){
  const oct = Math.floor(step / 7), L = LETTERS[((step % 7) + 7) % 7];
  return oct >= 4 ? L.repeat(oct - 3) : L.toUpperCase().repeat(4 - oct);
}
function noteTok(e, tie){
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
  return s;
}
function retime(v){
  let t = 0;
  for (const e of v.events) { e.t = rt(t); t = rt(t + e.d); }
  v.end = t;
  const at = ei => ei < v.events.length ? v.events[ei].t : v.end;
  for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) m.t = at(m.ei);
}
function writeKern(P){
  const vs = P.voices.slice().reverse();          /* file order: lowest voice first */
  P.voices.forEach(retime);
  P.end = Math.max(...P.voices.map(v => v.end));
  const out = [];
  for (const [k, val] of Object.entries(P.meta)) out.push(`!!!${k}: ${val}`);
  const cols = [];
  vs.forEach(v => { cols.push({v, text: -1}); for (let k = 0; k < Math.max(v.verses, 0); k++) cols.push({v, text: k}); });
  const line = f2 => cols.map(c => f2(c)).join('\t');
  out.push(line(c => c.text < 0 ? '**kern' : '**text'));
  out.push(line(c => c.text < 0 ? `*I"${c.v.name}` : '*'));
  if (vs.some(v => v.abbr)) out.push(line(c => c.text < 0 && c.v.abbr ? `*I'${c.v.abbr}` : '*'));
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
  const sorted = [...times].sort((a, b) => a - b);
  const ptr = new Map(vs.map(v => [v, 0]));
  out.push(line(() => '=1-'));
  for (const t of sorted) {
    const bar = P.bars.find(b => eq(b.t, t) && !eq(t, P.end));
    if (bar) out.push(line(() => bar.type === 'double' ? '=||' : '='));
    for (const kind of ['clef', 'key', 'met']) {
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
  return out.join('\n') + '\n';
}

/* ------------------------------------------------------------------ */
/* Editing                                                             */
/* ------------------------------------------------------------------ */
/* As in CantusFirmus: after a note is entered nothing stays selected; the cursor (ins) moves on to where the next
   note goes, and the arrows, accidentals, dot and Delete act on the selected note or else on the note just entered. */
const ed = {on: false, sel: null, ins: null, inRest: false, undo: [], redo: [], val: 'S'};   /* sel, ins: {vi, ei}; val: the value to enter */
const EKEY = k => APP.store + ':edit:' + k;
const VALS = [['Mx', 8], ['L', 4], ['B', 2], ['S', 1], ['M', 0.5], ['Sm', 0.25], ['F', 0.125]];
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
  const text = writeKern(piece);
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
  else if (!ed.warned) { ed.warned = true; toast('Changes to this piece are not kept once you leave it. Export, Save to My scores keeps a copy.'); }
  if (pieceKey && pieceKey.startsWith('mine:')) { const all = mineAll(); if (all[pieceKey]) { all[pieceKey].title = piece.title; all[pieceKey].at = Date.now(); mineSave(all); } }
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
function curVoice(){ const v = anyVoice(); return v && writable(v) ? v : null; }
function srcOf(){ const s = selSym(); return s ? s.src : ed.sel ? [ed.sel.ei] : []; }
/* written value of the selection under its sign, for the value buttons */
function propAt(v, t){ return mensInfo(metAt(v, t)).p; }
/* a note (or rest) of the chosen value written into voice vi before event `at`; written into rests, it takes their time */
const writable = v => !H.writable || H.writable(v);
const refuse = () => { if (H.refuse) H.refuse(); };
function insertEvent(vi, at, step, isRest){
  const v = piece.voices[vi]; if (!v) return;
  if (!writable(v)) { refuse(); return; }
  const val = VALS.find(x => x[0] === ed.val)[1];
  const t = at < v.events.length ? v.events[at].t : v.end;
  const alt0 = isRest ? null : implied(v, step, t);
  commit(() => {
    const e = {d: rt(val / propAt(v, t)), rest: !!isRest, step, alt: alt0, ed: false, syl: [], t};
    v.events.splice(at, 0, e);
    for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > at || (m.ei === at && at > 0)) m.ei++;
    if (!e.rest) {
      let need = e.d, k = at + 1;
      while (need > EPS && v.events[k] && v.events[k].rest) {
        const r = v.events[k];
        if (r.d <= need + EPS) {
          need = rt(need - r.d); v.events.splice(k, 1);
          for (const arr of [v.mets, v.keys, v.clefs]) for (const m of arr) if (m.ei > k) m.ei--;
        } else { r.d = rt(r.d - need); r.kd = r.d; need = 0; }
      }
    }
    ed.sel = null; ed.ins = {vi, ei: at + 1};
  });
  render(); syncEdit();
  if (!isRest) hear(step, alt0);
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
      const e = v.events[src[0]];
      e.d = rt(val / propAt(v, e.t)); e.tieStart = e.tieEnd = e.tieMid = false; e.long = g === 'L' && e.long;
      dropEvents(v, src.slice(1));
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
          e.rest = false; e.step = j >= 0 ? v.events[j].step : CLEFS[v.clef || 'c3'].bottom + 4; e.alt = implied(v, e.step, e.t); e.ed = false;
        } else { e.rest = true; e.tieStart = e.tieEnd = e.tieMid = false; }
      }
    });
  },
  del(){
    const v = curVoice(); if (!v) return;
    const src = srcOf();
    /* a note becomes a rest of the same length so the other voices stay aligned; a rest is removed */
    if (src.some(i => !v.events[i].rest)) { commit(() => { for (const i of src) { const e = v.events[i]; e.rest = true; e.tieStart = e.tieEnd = e.tieMid = false; const nx = v.events[i + 1]; if (e.syl && e.syl.some(Boolean) && nx && !nx.rest && !(nx.syl || []).some(Boolean)) nx.syl = e.syl; e.syl = []; } }); return; }
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
    if (k >= 0 && k < v.syms.length) ed.sel = {vi: ed.sel.vi, ei: v.syms[k].src[0]};
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
function undo(){ if (!ed.undo.length) return; ed.redo.push(piece.text || writeKern(piece)); applyText(ed.undo.pop()); }
function redo(){ if (!ed.redo.length) return; ed.undo.push(piece.text || writeKern(piece)); applyText(ed.redo.pop()); }
function showSel(scroll){
  document.querySelectorAll('#pages g.sel').forEach(g => g.classList.remove('sel'));
  document.querySelectorAll('#pages .caret').forEach(c => c.remove());
  const s = selSym();
  if (!s) { if (ed.on && ed.ins) drawCaret(scroll); syncEdit(); return; }
  let first = null;
  piece.voices[ed.sel.vi].syms.filter(q => q.src && q.src[0] === s.src[0]).forEach(q => document.querySelectorAll('#pages g.' + q.id).forEach(g => { g.classList.add('sel'); first = first || g; }));
  if (scroll && first) bringIntoView(first);
  syncEdit();
}
/* clicking a note selects it (in any view); with Edit off it only marks where Play starts */
pagesEl.addEventListener('click', e => {
  const g = e.target.closest('g[class^="n"]');
  if (!g || !piece) { if (ed.sel && !ed.on) { ed.sel = null; showSel(); } return; }
  const id = g.classList[0], m = id.match(/^n(\d+)-(\d+)$/);
  if (!m) return;
  const s = piece.voices[+m[1]].syms[+m[2]];
  ed.sel = {vi: +m[1], ei: s.src[0]}; ed.ins = {vi: +m[1], ei: s.src[s.src.length - 1] + 1};
  if (!s.rest) hear(s.step, s.alt);
  showSel();
});
/* the clef menu, from a click on a clef in the score */
/* The clef menu, opened by clicking a clef on the staff: CantusFirmus's grid of clefs, with "As written"
   and the B flat in the signature. Arrow keys move, Enter chooses, Escape closes. */
const clefPick = $('#clefPick');
clefPick.id = 'clefMenu'; clefPick.setAttribute('role', 'listbox'); clefPick.tabIndex = -1;
const CLEF_KEYS = [...CLEF_MENU.map(c => c[0]), '', 'flat'];
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
function markClef(){
  const vi = +clefPick.dataset.v, v = piece && piece.voices[vi];
  const cur = v ? vis(vi).clef || '' : '', fl = v && keyAt(v, 0).b === -1;
  clefPick.querySelectorAll('li').forEach((li, i) => {
    li.classList.toggle('active', i === clefActive);
    li.setAttribute('aria-selected', String(li.dataset.c === 'flat' ? !!fl : li.dataset.c === cur));
  });
  clefPick.setAttribute('aria-activedescendant', clefPick.children[clefActive].id);
}
function openClefPick(vi, e){
  const wr = $('.viewwrap').getBoundingClientRect();
  clefPick.dataset.v = vi; clefPick.hidden = false;
  clefActive = Math.max(0, CLEF_KEYS.indexOf(vis(vi).clef || ''));
  markClef();
  clefPick.style.left = Math.max(4, Math.min(wr.width - clefPick.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  clefPick.style.top = (e.clientY - wr.top + 10) + 'px';
  clefPick.focus({preventScroll: true});
}
function pickClef(k){
  clefPick.hidden = true;
  const vi = +clefPick.dataset.v;
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
  const vi = +rect.dataset.v, top = +rect.dataset.top, v = piece.voices[vi];
  if (!v) return null;
  const pos = Math.max(-8, Math.min(16, Math.round((top + 4 - p.y) * 2)));
  const step = CLEFS[v.clef].bottom + pos;
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
  return {vi, v, top, pos, step, mode, k, x: p.x, end: +rect.dataset.end, g: rect.parentNode};
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
let ghostEl = null;
function clearGhost(){ if (ghostEl) { ghostEl.remove(); ghostEl = null; } }
pagesEl.addEventListener('pointermove', e => {
  if (!ed.on || e.pointerType !== 'mouse' || !piece) { clearGhost(); return; }
  const on = noteAt(e);
  if (on && !on.s.rest) { clearGhost(); return; }   /* over a note: it is clicked, dragged or right-clicked */
  const rect = stafFor(e.target);
  if (!rect) { clearGhost(); return; }
  const tg = staffTarget(rect, e); if (!tg) { clearGhost(); return; }
  const g = ed.val, w = ed.inRest ? 0.42 : gw(g), x = tg.x - w / 2, y = tg.top + 4 - tg.pos * 0.5;
  const flip = (STEMMED[g] && tg.pos >= 7) || (TAILED[g] && tg.pos <= -1);
  let html = ed.inRest ? restSvg({g, glyph: SHAPE_REST[g]}, tg.x, tg.top) : ledgers(tg.pos, x, w, tg.top) + (flip ? useT(g, x, y, 1, -1) : use(g, x, y));
  /* past the end of the music: a faint piece of staff for the note to stand on */
  if (tg.x > tg.end) for (let q = 0; q < 5; q++) html += `<line class="ledger" x1="${f(tg.end)}" x2="${f(x + w + 1)}" y1="${f(tg.top + q)}" y2="${f(tg.top + q)}" stroke-width="0.1" opacity="0.5"/>`;
  if (!ghostEl || ghostEl.parentNode !== tg.g) { clearGhost(); ghostEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ghostEl.setAttribute('class', 'ghost'); tg.g.appendChild(ghostEl); }
  ghostEl.innerHTML = html;
});
pagesEl.addEventListener('pointerleave', clearGhost);

/* a voice's name in the score: click it to rename the voice (the same name as in Voices) */
function renameInPlace(el){
  const vi = +el.dataset.v, v = piece && piece.voices[vi]; if (!v) return;
  const wr = $('.viewwrap').getBoundingClientRect(), r = el.getBoundingClientRect();
  const inp = document.createElement('input');
  inp.className = 'vrename'; inp.value = v.name; inp.setAttribute('aria-label', 'Name of the voice');
  inp.style.left = Math.max(2, r.right - wr.left - Math.max(140, r.width + 30)) + 'px';
  inp.style.top = (r.top - wr.top - 6) + 'px';
  inp.style.width = Math.max(140, r.width + 30) + 'px';
  $('.viewwrap').appendChild(inp);
  inp.focus(); inp.select();
  let done = false;
  const finish = keep => { if (done) return; done = true; const val = inp.value; inp.remove(); if (keep) VOICE_OPS.rename(vi, val); };
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
  inp.addEventListener('blur', () => finish(true));
}
pagesEl.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('.vnamehit');
  if (!t || !piece) return;
  e.stopImmediatePropagation(); e.preventDefault();
  renameInPlace(t);
}, true);

/* The mensuration menu, opened by clicking a mensuration sign: the signs as a grid, like the clefs. The change goes to
   every voice that has a sign there, or with "Different mensuration" ticked, to this voice only. */
const MENS_MENU = [['O', 'Tempus perfectum'], ['C', 'Tempus imperfectum'], ['O.', 'Tempus perfectum, prolatio maior'], ['C.', 'Tempus imperfectum, prolatio maior'],
  ['O|', 'Tempus perfectum diminutum'], ['C|', 'Tempus imperfectum diminutum (alla breve)'], ['Cr', 'Reversed C: half the values'], ['3', 'Proportio sesquialtera, 3'],
  ['O3', 'O with 3'], ['C3', 'C with 3'], ['C|3', 'C with stroke and 3'], ['C2', 'C with 2: proportio dupla']];
const mensMenu = document.createElement('ul');
mensMenu.id = 'mensMenu'; mensMenu.className = 'menu'; mensMenu.setAttribute('role', 'listbox'); mensMenu.tabIndex = -1; mensMenu.hidden = true;
mensMenu.setAttribute('aria-label', 'Mensuration');
$('.viewwrap').appendChild(mensMenu);
function mensIcon(sg){
  let lines = '';
  for (let i = 0; i < 5; i++) lines += `<line x1="-0.3" x2="4.6" y1="${i}" y2="${i}" stroke="currentColor" stroke-opacity=".5" stroke-width="0.1"/>`;
  return `<svg viewBox="-0.3 -1.9 4.9 8.8" aria-hidden="true">${lines}<g fill="currentColor" stroke="currentColor">${mensSvg(sg, 0.2, 0)}</g></svg>`;
}
mensMenu.innerHTML = MENS_MENU.map(([sg, name]) => `<li role="option" data-m="${esc(sg)}" title="${esc(name)}">${mensIcon(sg)}<span>${esc(sg.replace('r', ' rev.'))}</span></li>`).join('') +
  `<li class="flatopt mdiff" data-m="" role="option"><label class="check"><input type="checkbox" id="mensDiff"> Different mensuration <span class="mhint">(this voice only)</span></label></li>`;
let mensAt = null;
function openMensMenu(vi, t, e){
  const wr = $('.viewwrap').getBoundingClientRect();
  const v = piece.voices[vi]; if (!v) return;
  mensAt = {vi, t};
  const cur = metAt(v, t);
  $('#mensDiff').checked = false;
  mensMenu.querySelectorAll('li[data-m]').forEach(li => li.setAttribute('aria-selected', String(!!li.dataset.m && li.dataset.m === cur)));
  mensMenu.hidden = false; clefPick.hidden = true;
  mensMenu.style.left = Math.max(4, Math.min(wr.width - mensMenu.offsetWidth - 4, e.clientX - wr.left)) + 'px';
  mensMenu.style.top = (e.clientY - wr.top + 10) + 'px';
}
function setMens(sign){
  if (!mensAt || !piece) return;
  const {vi, t} = mensAt, only = $('#mensDiff').checked;
  mensMenu.hidden = true;
  const targets = only ? [vi] : piece.voices.map((v, i) => i).filter(i => i === vi || piece.voices[i].mets.some(m => eq(m.t, t)) || piece.voices[i].events.some(e => eq(e.t, t)));
  if (targets.some(i => !writable(piece.voices[i])) && only) { refuse(); return; }
  commit(() => {
    for (const i of targets) {
      const v = piece.voices[i];
      if (!writable(v)) continue;
      const m = v.mets.find(x => eq(x.t, t));
      if (m) { m.sign = sign; continue; }
      const k = v.events.findIndex(e => eq(e.t, t));
      if (k >= 0) { v.mets.push({t, sign, ei: k}); v.mets.sort((a, b) => a.t - b.t); }
    }
  });
}
mensMenu.addEventListener('click', e => {
  if (e.target.closest('.mdiff')) return;
  const li = e.target.closest('li[data-m]'); if (li && li.dataset.m) setMens(li.dataset.m);
});
document.addEventListener('pointerdown', e => { if (!mensMenu.hidden && !e.target.closest('#mensMenu') && !e.target.closest('.menshit')) mensMenu.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') mensMenu.hidden = true; });
pagesEl.addEventListener('click', e => {
  const mh = e.target.closest && e.target.closest('.menshit');
  if (!mh || !piece) return;
  const g = mh.closest('g[class^="n"]'); const m = g && g.classList[0].match(/^n(\d+)-(\d+)$/);
  if (!m) return;
  e.stopImmediatePropagation(); e.preventDefault();
  openMensMenu(+m[1], +mh.dataset.t, e);
}, true);

pagesEl.addEventListener('click', e => {
  const ch = e.target.closest && e.target.closest('.clefhit');
  if (ch && piece) { e.stopImmediatePropagation(); openClefPick(+ch.dataset.v, e); return; }
  if (ed.on && typeof noteAt === 'function') {
    const n = noteAt(e);
    if (n && (!n.s.rest || e.shiftKey)) {
      e.stopImmediatePropagation();
      ed.sel = {vi: n.vi, ei: n.s.src[0]}; ed.ins = {vi: n.vi, ei: n.s.src[n.s.src.length - 1] + 1};
      if (!n.s.rest) hear(n.s.step, n.s.alt);
      showSel(); return;
    }
  }
  const rect = ed.on && !e.shiftKey ? stafFor(e.target) : null;
  if (rect) {
    e.stopImmediatePropagation();
    const tg = staffTarget(rect, e); if (!tg) return;
    const {at} = eventIndexFor(tg);
    clearGhost();
    insertEvent(tg.vi, at, tg.step, ed.inRest);
  }
}, true);
const STEP_MIN = 7, STEP_MAX = 55;
const clampStep = s => Math.max(STEP_MIN, Math.min(STEP_MAX, Math.round(s)));
const ACC_ALT = {b: -1, n: 0, '#': 1}, ACC_OF = {fl: 'b', na: 'n', sh: '#'};
const valKey = s => VALS.some(x => x[0] === s.g) ? s.g : 'S';
const accOf = s => ACC_OF[s.acc] || ACC_OF[s.edAcc] || '';
function hear(step, alt){ if (st.audition !== false && !play && step !== null && step !== undefined) Organ.audition(midiOf({step, alt})); }
function symAt(vi, ei){
  const v = piece && piece.voices[vi];
  return v && v.syms ? v.syms.find(q => q.src && q.src.includes(ei)) || null : null;
}
/* the note the arrows, accidentals, dot and Delete act on: the selected one, or else the one just entered */
function targetSym(){
  if (ed.sel) return selSym();
  if (ed.ins && ed.ins.ei > 0) return symAt(ed.ins.vi, ed.ins.ei - 1);
  return null;
}
function insertionIndex(v){
  const s = selSym();
  if (s) return s.src[s.src.length - 1] + 1;
  return ed.ins ? Math.min(ed.ins.ei, v.events.length) : v.events.length;
}
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
/* what the shared note-input tools (shared/note-input.js) need from this app */
const CBA = {
  edit: () => ed.on,
  guard(){ return H.guard ? H.guard() : true; },
  state(){
    const s = selSym(), t = targetSym(), v = curVoice();
    return {selected: !!s, dur: s ? valKey(s) : ed.val, rest: s ? s.rest : ed.inRest,
      target: t && {r: t.rest, a: accOf(t), p: t.dot, ed: !!t.edAcc}, edArm: !!ed.edArm, canUndo: ed.undo.length > 0, canRedo: ed.redo.length > 0,
      hasNotes: !!(piece && piece.voices.length), durs: v && v.syms ? v.syms.map(valKey) : []};
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
    const t = targetSym(), v = curVoice(); if (!t || t.rest) return;
    const off = accOf(t) === a;
    const edit = !!ed.edArm && !off; ed.edArm = false;
    commit(() => { for (const i of t.src) { const e = v.events[i]; e.alt = off ? implied(v, e.step, e.t) : ACC_ALT[a]; e.ed = edit; } });
    const e = curVoice().events[t.src[0]]; if (e) hear(e.step, e.alt);
  },
  /* Ed.: the selected note's accidental becomes editorial (or written again); with none, the next accidental entered is editorial */
  toggleEd(){
    if (!CBA.guard()) return;
    const t = targetSym(), v = curVoice();
    if (t && !t.rest && v && accOf(t)) {
      const e0 = v.events[t.src[0]], on = !e0.ed;
      commit(() => { for (const i of t.src) v.events[i].ed = on; });
      return;
    }
    ed.edArm = !ed.edArm; syncEdit();
  },
  toggleDot(){
    if (!CBA.guard()) return;
    const t = targetSym(), v = curVoice(); if (!t || t.rest) return;
    commit(() => {
      const e = v.events[t.src[0]];
      const total = t.src.reduce((a, i) => a + v.events[i].d, 0);
      e.d = rt(t.dot ? total / 1.5 : total * 1.5); e.tieStart = e.tieEnd = e.tieMid = false;
      dropEvents(v, t.src.slice(1));
    });
  },
  stepPitch(d){
    if (!CBA.guard()) return;
    const t = targetSym(), v = curVoice(); if (!t || t.rest) return;
    commit(() => { for (const i of t.src) { const e = v.events[i]; moveStep(v, e, clampStep(e.step + d)); } });
    const e = curVoice().events[t.src[0]]; if (e) hear(e.step, e.alt);
  },
  moveSel(dir){
    if (!piece) return;
    let vi = ed.sel ? ed.sel.vi : ed.ins ? ed.ins.vi : null;
    if (vi === null) { const vs = visibleVoices(); if (!vs.length) return; vi = vs[0].idx; }
    const v = piece.voices[vi], syms = v.syms || [];
    if (!syms.length) return;
    const s = selSym();
    let k;
    if (s) k = syms.indexOf(s) + dir;
    else if (ed.ins) {
      const c = ed.ins.ei;
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
    const t = targetSym(), v = curVoice(); if (!t) return;
    const vi = v.idx, first = t.src[0];
    commit(() => { dropEvents(v, t.src); ed.sel = null; ed.ins = {vi, ei: first}; });
  },
  typeNote(L){
    if (!CBA.guard()) return;
    const v = curVoice(); if (!v) return;
    const idx = insertionIndex(v), ref = refStepBefore(v, idx), li = 'CDEFGAB'.indexOf(L);
    let best = null;
    for (let o = 0; o <= 8; o++) {
      const s = 7 * o + li;
      if (s < STEP_MIN || s > STEP_MAX) continue;
      if (best === null || Math.abs(s - ref) < Math.abs(best - ref)) best = s;
    }
    ed.inRest = false;
    insertEvent(v.idx, idx, best, false);
  },
  typeRest(){
    if (!CBA.guard()) return;
    const v = curVoice(); if (!v) return;
    const idx = insertionIndex(v);
    insertEvent(v.idx, idx, refStepBefore(v, idx), true);
  },
  undo: () => undo(), redo: () => redo(),
  deselect(){ if (ed.sel) { ed.sel = null; showSel(); } },
  togglePlay(){ if (play) stopPlay(); else startPlay(); },
  scaleAll(dir){ if (!CBA.guard()) return; const v = curVoice(); if (v) commit(() => { for (const e of v.events) e.d = rt(dir < 0 ? e.d * 2 : e.d / 2); }); },
  shiftOctave(dir){ if (!CBA.guard()) return; const v = curVoice(); if (v) commit(() => { for (const e of v.events) if (!e.rest) e.step = clampStep(e.step + 7 * dir); }); },
  mutate: fn => { if (CBA.guard()) commit(fn); },
  pitched(){
    if (!CBA.guard()) return [];
    const v = curVoice();
    return v ? v.events.filter(e => !e.rest).map(e => ({e, v, s: e.step, alter: e.alt || 0})) : [];
  },
  setPitch(h, s, alter){
    const e = h.e, imp = implied(h.v, s, e.t);
    e.step = s; e.ed = false;
    e.alt = alter === null ? imp : alter === 0 && !imp ? null : alter;
  },
  range: [STEP_MIN, STEP_MAX],
  toast: m => toast(m)
};
/* the cursor: a thin line after the note just entered (or before the next one) */
function drawCaret(scroll){
  if (!piece) return;
  const {vi, ei} = ed.ins, v = piece.voices[vi];
  if (!v || !v.syms) return;
  let k = v.syms.findIndex(q => q.src && q.src.includes(ei - 1)), after = true;
  if (k < 0) { k = v.syms.findIndex(q => q.src && q.src[0] >= ei); after = false; }
  if (k < 0) return;
  document.querySelectorAll('#pages g.n' + vi + '-' + k).forEach((el, n) => {
    const par = el.parentNode;
    let r = null;
    for (const r2 of par.querySelectorAll('rect.stafhit[data-v="' + vi + '"]')) if (r2.dataset.k0 !== '' && +r2.dataset.k0 <= k && k <= +r2.dataset.k1) r = r2;
    if (!r) return;
    const bb = el.getBBox(), top = +r.dataset.top;
    const x = after ? bb.x + bb.width + 0.35 : bb.x - 0.45;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    c.setAttribute('class', 'caret'); c.setAttribute('x', f(x - 0.07)); c.setAttribute('y', f(top - 1));
    c.setAttribute('width', '0.14'); c.setAttribute('height', '6');
    par.appendChild(c);
    if (scroll && !n) bringIntoView(c);
  });
}
/* with the mouse, as in CantusFirmus: right-click turns a note into a rest and removes a rest; drag a note up or down */
/* the note under the pointer: in Edit the staff's writing area lies on top, so look underneath it too */
function noteAt(e){
  let g = null;
  for (const el of document.elementsFromPoint(e.clientX, e.clientY)) { const q = el.closest && el.closest('#pages g[class^="n"]'); if (q) { g = q; break; } }
  const m = g && /^n(\d+)-(\d+)/.exec(g.getAttribute('class') || '');
  if (!m || !piece) return null;
  const v = piece.voices[+m[1]], s = v && v.syms[+m[2]];
  return s && s.src ? {vi: +m[1], s, g} : null;
}
pagesEl.addEventListener('contextmenu', e => {
  if (!ed.on) return;
  const n = noteAt(e); if (!n) return;
  e.preventDefault(); clearGhost();
  if (!writable(piece.voices[n.vi])) { refuse(); return; }
  toRestOrRemove(n.vi, n.s);
});
let noteDrag = null;
pagesEl.addEventListener('pointerdown', e => {
  if (!ed.on || e.button !== 0 || e.pointerType !== 'mouse' || e.shiftKey) return;
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
  document.querySelectorAll('#pages g.' + noteDrag.n.s.id).forEach(g => g.setAttribute('transform', `translate(0 ${f(-steps * 0.5)})`));
  hear(clampStep(noteDrag.n.s.step + steps), noteDrag.n.s.alt);
});
pagesEl.addEventListener('pointerup', () => {
  if (!noteDrag) return;
  const d = noteDrag; noteDrag = null;
  if (!d.moved || !d.steps) return;           /* a plain click: the click handler selects */
  const {vi, s} = d.n, v = piece.voices[vi];
  ed.sel = {vi, ei: s.src[0]}; ed.ins = {vi, ei: s.src[s.src.length - 1] + 1};
  commit(() => { for (const i of s.src) { const ev = v.events[i]; moveStep(v, ev, clampStep(ev.step + d.steps)); } });
});
pagesEl.addEventListener('pointercancel', () => { if (noteDrag) { noteDrag = null; render(); } });

function syncEdit(){
  $('#editBtn').setAttribute('aria-pressed', String(ed.on));
  $('#editBar').hidden = !ed.on;
  document.body.classList.toggle('editing', ed.on);
  if (piece) NoteInput.sync(CBA);
}
function glyphIcon(k, minBox){
  const b = GLY[k].b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  const box = Math.max(minBox, b[2] - b[0] + 0.5, b[3] - b[1] + 0.5);
  return `<svg viewBox="${f(cx - box / 2)} ${f(cy - box / 2)} ${f(box)} ${f(box)}" aria-hidden="true"><path d="${GLY[k].d}"/></svg>`;
}
NoteInput.fill(CBA, glyphIcon);
NoteInput.wire(CBA);
$('#editBtn').addEventListener('click', () => { ed.on = !ed.on; clearGhost(); showSel(); postHeight(); });
$('#saveBtn').addEventListener('click', () => {
  closePops();
  const text = piece.text || writeKern(piece);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
  a.download = (H.fileName ? H.fileName() : (pieceKey.replace(/^file:/, '').replace(/\.(krn|kern|txt)$/i, '') || APP.store)) + '.krn';
  document.body.appendChild(a); a.click(); a.remove();
});
$('#keepBtn').addEventListener('click', () => {
  if (!piece) return;
  closePops();
  if (pieceKey.startsWith('mine:')) { toast('This score is already kept in My scores.'); return; }
  const text = piece.text || writeKern(piece), undo = ed.undo.slice(), redo = ed.redo.slice();
  const id = mineAdd(piece.title, text);
  try { localStorage.setItem(EKEY(id), text); } catch (e) {}
  loadPiece(id).then(() => { ed.undo = undo; ed.redo = redo; syncEdit(); refreshMine(); toast('Saved to My scores. Changes to this copy are kept.'); });
});
/* Ctrl+Left / Ctrl+Right move the selection a minim (the other keys are the shared tools') */
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ed.on && ed.sel) { e.preventDefault(); OPS.shift(e.key === 'ArrowRight' ? 1 : -1); }
});
syncEdit();

/* the hand's look (the hand itself, the pendulum and the beat menu are the shared engine's) */
$('#handOp').addEventListener('input', e => { st.handOp = +e.target.value; save(); Organ.syncBeat(); });
$('#handSize').addEventListener('input', e => { st.handSize = +e.target.value; save(); Organ.syncBeat(); });
if ($('#audition')) $('#audition').addEventListener('change', e => { st.audition = e.target.checked; save(); });

/* the music box fills the window (or the visitor's window, when embedded), with the controls above and below it */
function sizeViewer(){
  let H = window.innerHeight;
  if (EMBED) { try { H = window.top.innerHeight; } catch (e) { H = Math.max(window.screen.availHeight - 160, 600); } }
  const used = ($('.tools').offsetHeight || 60) + ($('.transport').offsetHeight || 70) + (EMBED ? 40 : 120);
  document.documentElement.style.setProperty('--vh', (st.frameH ? Math.max(120, st.frameH) : Math.max(380, H - used)) + 'px');
}
/* the grip at the frame's corner: the frame as tall as you drag it; double-click gives it back to the window */
{
  const grip = document.createElement('button');
  grip.className = 'framegrip'; grip.type = 'button'; grip.title = 'Drag to make the music frame taller or shorter. Double-click: as tall as the window';
  grip.setAttribute('aria-label', 'Frame height');
  grip.innerHTML = '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M20 8v2L10 20H8ZM20 14v2l-4 4h-2Z"/></svg>';
  $('.viewwrap').appendChild(grip);
  grip.addEventListener('pointerdown', e => {
    e.preventDefault(); grip.setPointerCapture(e.pointerId);
    const y0 = e.clientY, h0 = viewerEl.getBoundingClientRect().height;
    const move = ev => { st.frameH = Math.max(120, Math.round(h0 + ev.clientY - y0)); sizeViewer(); postHeight(); };
    const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); save(); render(); };
    grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up);
  });
  grip.addEventListener('dblclick', () => { st.frameH = null; save(); sizeViewer(); render(); });
}

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
  const mi = mensInfo(metAt(top, 0)), tab = valueTable(mi.T, mi.P);
  const e = tab.find(x => x[0] === st.unit) || tab[3];
  return e[1] * 2 / mi.p;
}
/* where the music stands, in semibreves */
const playPos = () => (Organ.position() || 0) / 2;
function restartPlay(){ if (!play) return; startPlay(playPos()); }
function startPlay(from){
  if (!piece) return;
  /* Play starts at the selected note (or the beginning) */
  if (typeof from !== 'number') { const s = selSym(); from = s ? s.t : 0; }
  from = Math.max(0, Math.min(from, piece.end));
  const voices = piece.voices.filter(v => vis(v.idx).play);
  if (!voices.length) { toast('No voice has Playback ticked (Voices).'); return; }
  const events = [];
  voices.forEach(v => {
    for (let k = 0; k < v.syms.length; k++) {
      const s = v.syms[k];
      /* a rest sounds nothing but lights up while it lasts */
      if (s.rest) { events.push({id: s.id, t: s.t * 2, d: s.d * 2, midi: null}); continue; }
      /* tied pieces sound as one note: struck once (where the playing starts, if it starts inside), held to the end */
      let j = k;
      while (v.syms[j].tieNext && v.syms[j + 1] && !v.syms[j + 1].rest && v.syms[j + 1].step === s.step) j++;
      const chainEnd = v.syms[j].t + v.syms[j].d;
      let struck = false;
      for (let q = k; q <= j; q++) {
        const p = v.syms[q], strike = !struck && p.t + p.d > from + EPS;
        events.push({id: p.id, t: p.t * 2, d: p.d * 2, midi: midiOf(p), silent: !strike, hold: strike ? (chainEnd - p.t) * 2 : undefined});
        if (strike) struck = true;
      }
      k = j;
    }
  });
  const top = voices[0], u = unitMinims();
  const on = new Set();
  const spec = {
    events, from: from * 2, count: st.countIn, unit: u, level: 1 / Math.sqrt(Math.max(1, voices.length)),
    /* how many beats to the hand's pattern: three under a perfect sign */
    group: bi => { const T = mensInfo(metAt(top, bi * u / 2)).T; return T === 3 ? 3 : 2; },
    groupStart: bi => { let seg = 0; for (const m of top.mets) if (m.t <= bi * u / 2 + EPS) seg = m.t; return Math.round(seg * 2 / u); },
    onLoop: () => startPlay(0),
    onFrame: ids => {
      const now = new Set(ids);
      for (const id of [...on]) if (!now.has(id)) { on.delete(id); document.querySelectorAll('svg g.' + id).forEach(g => g.classList.remove('on')); }
      let first = null;
      for (const id of now) { const gs = document.querySelectorAll('svg g.' + id); if (!on.has(id)) { on.add(id); gs.forEach(g => g.classList.add('on')); } first = first || gs[0]; }
      if (first) followHand(first);
    }
  };
  if (H.playSpec) H.playSpec(spec);
  Organ.play(spec);
}
$('#play').addEventListener('click', () => { if (play) stopPlay(); else startPlay(); });
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
  if (wrapEl.classList.contains('fs')) fsTimer = setTimeout(() => { if (!$('#fsCtl').matches(':hover') && !$('#fsBtn').matches(':hover')) wrapEl.classList.add('idle'); }, 2200);
}
['pointermove', 'pointerdown', 'wheel'].forEach(t => wrapEl.addEventListener(t, fsWake, {passive: true}));
viewerEl.addEventListener('scroll', fsWake, {passive: true});
$('#fsPlay').addEventListener('click', () => {
  if (play) { fsPaused = playPos(); stopPlay(); }
  else { const at = fsPaused; fsPaused = null; startPlay(typeof at === 'number' ? at : undefined); }
  fsWake();
});

/* tell the site page how tall the app is (shared/frame-height.js, as in CantusFirmus) */
var postFrame = null;
function postHeight(){ if (EMBED && postFrame) requestAnimationFrame(postFrame); }
postFrame = frameHeight(APP.msg + 'Height');
let rw = 0, lastW = window.innerWidth;
window.addEventListener('resize', () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rw); rw = setTimeout(() => { sizeViewer(); render(); }, 150); });
if (EMBED) try { window.top.addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { sizeViewer(); postHeight(); }, 150); }); } catch (e) {}

Organ.wire();

/* add-ons (Canon Maker's canon, ...): each is a function written as if it were part of this file */
for (const a of (APP.addons || [])) eval('(' + a + ')')();

/* start */
if (H.start) H.start(); else (async () => {
  try { await document.fonts.load('100px "IM Fell English"'); await document.fonts.load('italic 100px "IM Fell English"'); } catch (e) {}
  if (H.preStart) { try { await H.preStart(); } catch (e) {} }
  const qs = new URLSearchParams(location.search);
  const want = qs.get('piece');
  pieceKey = want || st.piece || PIECES[0];
  if (want && qs.get('bar')) {
    const from = parseInt(qs.get('bar'), 10), to = parseInt(qs.get('to') || qs.get('bar'), 10);
    if (from > 0) mark = {piece: want, from, to: Math.max(from, to || from)};
  }
  syncUI(); sizeViewer();
  if (await takeHandoff().catch(() => false)) { buildPieceList().then(syncUI); return; }
  try { await loadPiece(pieceKey); }
  catch (e) {
    if (!want && pieceKey !== PIECES[0]) { pieceKey = PIECES[0]; try { await loadPiece(pieceKey); } catch (e2) { pagesEl.innerHTML = `<p class="msg">${esc(e2.message)}</p>`; } }
    else pagesEl.innerHTML = `<p class="msg">${esc(e.message)}</p>`;
  }
  buildPieceList().then(syncUI);
  if (/[?&]print=1/.test(location.search)) setTimeout(() => window.print(), 600);
})();
window.__cb = Object.assign({st, get piece(){ return piece; }, render, parseKern, notate, ed, writeKern, CBA, insertEvent, undo, redo, startPlay, get pieceKey(){ return pieceKey; }}, H.expose ? H.expose() : {});
})();
