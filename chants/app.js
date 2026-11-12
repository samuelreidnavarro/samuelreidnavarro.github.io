/* Chant Sources: search Cantus Database (through a small Cloudflare Worker, since
   cantusdatabase.org does not allow other sites to read it), show every manuscript
   of a chant with its notation, date and origin, collect chants and print them. */
(function () {
  "use strict";
  var API = "https://cantus-proxy.samreidn.workers.dev";
  var CDB = "https://cantusdatabase.org";
  var $ = function (id) { return document.getElementById(id); };
  var SOURCES = {}, NOTATIONS = {}, current = null, currentRows = [];

  var GENRES = { A: "Antiphon", R: "Responsory", V: "Responsory verse", I: "Invitatory", H: "Hymn", W: "Versicle",
    In: "Introit", InV: "Introit verse", Gr: "Gradual", GrV: "Gradual verse", Al: "Alleluia", AlV: "Alleluia verse",
    Tc: "Tract", TcV: "Tract verse", Of: "Offertory", OfV: "Offertory verse", Cm: "Communion", CmV: "Communion verse",
    Sq: "Sequence", Ky: "Kyrie", Gl: "Gloria", Cr: "Credo", Sa: "Sanctus", Ag: "Agnus Dei", Pr: "Prefatio",
    InR: "Invitatory antiphon", Hy: "Hymn", Mc: "Miscellaneous", Ps: "Psalm", Rc: "Recitative", Tp: "Trope" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function status(t) { $("status").textContent = t || ""; }
  function getJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  /* ---------- sources and notation types (static files on this site) ---------- */
  var ready = Promise.all([
    getJSON("chants/sources.json?v=1").then(function (d) { SOURCES = d; }),
    getJSON("chants/notations.json?v=1").then(function (d) { NOTATIONS = d; })
  ]).catch(function () {});

  function src(id) {
    var s = SOURCES[id];
    if (!s) return { id: id, siglum: "", title: "", century: "", cy: 99, date: "", prov: "", not: "" };
    return { id: id, siglum: s[0], title: s[1], century: s[2], cy: cyear(s[2], s[3]), date: s[3], prov: s[4], not: s[5] || "" };
  }
  function cyear(c, d) {
    var m = /(\d{4})/.exec(c || "") || /(\d{4})/.exec(d || "");
    if (m) return +m[1].slice(0, 2);
    m = /(\d+)(st|nd|rd|th)/.exec(c || "");
    return m ? +m[1] - 1 : 99;
  }
  function centuryLabel(s) {
    var m = /(\d+)(st|nd|rd|th)/.exec(s.century || "");
    if (m) return m[1] + m[2] + " c.";
    return s.date || "";
  }
  function notName(k) { return (NOTATIONS[k] && NOTATIONS[k].name) || ""; }
  function notImg(k) { return (NOTATIONS[k] && NOTATIONS[k].img) ? "chants/notation/" + NOTATIONS[k].img : ""; }

  /* ---------- turn a library image link into a picture we can show ---------- */
  function preview(u, w) {
    if (!u) return "";
    w = w || 600;
    var m;
    u = u.replace(/^http:\/\//, "https://");
    if ((m = /^(https:\/\/.+\/full\/)[^/]+(\/0\/(?:default|native)\.jpg)$/.exec(u))) return m[1] + w + "," + m[2];
    if ((m = /gallica\.bnf\.fr\/ark:\/12148\/([^/]+)\/f(\d+)/.exec(u))) return "https://gallica.bnf.fr/iiif/ark:/12148/" + m[1] + "/f" + m[2] + "/full/" + w + ",/0/native.jpg";
    if ((m = /e-codices\.unifr\.ch\/\w\w\/(\w+)\/(\w+)\/(\d+)([rv]?)/.exec(u))) {
      var p = ("000" + m[3]).slice(-3) + m[4];
      return "https://www.e-codices.unifr.ch/loris/" + m[1] + "/" + m[1] + "-" + m[2] + "/" + m[1] + "-" + m[2] + "_" + p + ".jp2/full/" + w + ",/0/default.jpg";
    }
    if ((m = /digitale-sammlungen\.de\/(?:en\/view\/)?(bsb\d{8})(?:\/image_|\?page=)(\d+)/.exec(u))) return "https://api.digitale-sammlungen.de/iiif/image/v2/" + m[1] + "_" + ("0000" + m[2]).slice(-5) + "/full/" + w + ",/0/default.jpg";
    if (/\.(jpe?g|png)$/i.test(u)) return u;
    return "";
  }

  /* ---------- search ---------- */
  $("search").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = $("q").value.trim();
    if (q.length < 2) return;
    history.replaceState(null, "", "?q=" + encodeURIComponent(q));
    if (/^\d{6}[\w.]*$/.test(q)) return openChant(q);
    search(q);
  });

  function search(q) {
    $("sources").hidden = true;
    $("chants").hidden = true;
    status("Searching…");
    getJSON(API + "/search?q=" + encodeURIComponent(q)).then(function (d) {
      var groups = {}, order = [];
      d.rows.forEach(function (r) {
        if (!r.cid) return;
        var g = groups[r.cid];
        if (!g) { g = groups[r.cid] = { cid: r.cid, incipits: {}, genre: r.genreName || GENRES[r.genre] || r.genre, feasts: {}, n: 0 }; order.push(g); }
        g.n++;
        var inc = r.incipit.replace(/\*$/, "");
        g.incipits[inc] = (g.incipits[inc] || 0) + inc.length;
        if (r.feast) g.feasts[r.feast] = (g.feasts[r.feast] || 0) + 1;
      });
      order.sort(function (a, b) { return b.n - a.n; });
      status(order.length ? "" : "No chants found.");
      $("chants").innerHTML = order.map(function (g) {
        var inc = top(g.incipits), feasts = Object.keys(g.feasts).sort(function (a, b) { return g.feasts[b] - g.feasts[a]; }).slice(0, 3).join(", ");
        return '<button class="ch-chant" type="button" data-cid="' + esc(g.cid) + '"><b>' + esc(inc) + '</b><span class="n">' + g.n +
          '</span><small>' + esc(g.genre) + (feasts ? " · " + esc(feasts) : "") + " · " + esc(g.cid) + "</small></button>";
      }).join("");
      $("chants").hidden = !order.length;
    }).catch(function () { status("Cantus Database could not be reached."); });
  }
  function top(o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; })[0] || ""; }

  $("chants").addEventListener("click", function (e) {
    var b = e.target.closest(".ch-chant");
    if (b) openChant(b.dataset.cid);
  });
  $("back").addEventListener("click", function () {
    $("sources").hidden = true;
    if ($("chants").innerHTML) $("chants").hidden = false;
  });

  /* ---------- all manuscripts of one chant ---------- */
  function openChant(cid) {
    status("Loading…");
    $("chants").hidden = true;
    Promise.all([ready, getJSON(API + "/cid/" + encodeURIComponent(cid))]).then(function (res) {
      var list = (res[1].chants || []).map(function (x) { return x.chant; });
      if (!list.length) { status("No manuscripts found."); return; }
      currentRows = list.map(function (c) {
        var id = +((/source\/(\d+)/.exec(c.srclink) || [])[1] || 0);
        var s = src(id);
        return {
          cid: c.cantus_id, chant: +((/chant\/(\d+)/.exec(c.chantlink) || [])[1] || 0), src: id,
          siglum: c.siglum || s.siglum, title: s.title, century: centuryLabel(s), cy: s.cy, prov: s.prov, not: s.not,
          folio: c.folio, feast: c.feast, genre: GENRES[c.genre] || c.genre, office: c.office, mode: c.mode,
          image: c.image, incipit: (c.incipit || "").replace(/\*$/, "").trim(), text: c.full_text || ""
        };
      }).sort(function (a, b) { return a.cy - b.cy || a.siglum.localeCompare(b.siglum); });
      var inc = {}, gen = {}, fe = {};
      currentRows.forEach(function (r) { inc[r.incipit] = (inc[r.incipit] || 0) + r.incipit.length; gen[r.genre] = (gen[r.genre] || 0) + 1; if (r.feast) fe[r.feast] = (fe[r.feast] || 0) + 1; });
      current = { cid: cid, incipit: top(inc), genre: top(gen) };
      $("chantTitle").textContent = current.incipit;
      $("chantSub").textContent = [current.genre, top(fe), "Cantus ID " + cid, currentRows.length + " sources"].filter(Boolean).join(" · ");
      fillFilters();
      renderRows();
      status("");
      $("sources").hidden = false;
    }).catch(function () { status("Cantus Database could not be reached."); });
  }

  function fillFilters() {
    var nots = {}, cens = {};
    currentRows.forEach(function (r) { nots[r.not] = 1; cens[r.century] = r.cy; });
    $("fNot").innerHTML = '<option value="">All</option>' + Object.keys(nots).filter(Boolean).sort(function (a, b) { return notName(a).localeCompare(notName(b)); })
      .map(function (k) { return '<option value="' + esc(k) + '">' + esc(notName(k) || k) + "</option>"; }).join("");
    $("fCen").innerHTML = '<option value="">All</option>' + Object.keys(cens).filter(Boolean).sort(function (a, b) { return cens[a] - cens[b]; })
      .map(function (k) { return '<option>' + esc(k) + "</option>"; }).join("");
  }
  ["fNot", "fCen", "fImg"].forEach(function (id) { $(id).addEventListener("change", renderRows); });

  function renderRows() {
    var fn = $("fNot").value, fc = $("fCen").value, fi = $("fImg").checked;
    var coll = items();
    $("rows").innerHTML = currentRows.map(function (r, i) {
      if (fn && r.not !== fn) return "";
      if (fc && r.century !== fc) return "";
      if (fi && !r.image) return "";
      var pv = preview(r.image), ex = notImg(r.not), on = coll.some(function (c) { return c.chant === r.chant; });
      return "<tr data-i=\"" + i + "\">" +
        '<td><div class="ch-not"' + (pv ? ' data-pv="' + esc(pv) + '"' : ex ? ' data-pv="' + esc(ex) + '"' : "") + ">" +
          (ex ? '<img src="' + esc(ex) + '" alt="" loading="lazy">' : "") + "<span>" + esc(notName(r.not)) + "</span></div></td>" +
        '<td class="ch-src"><a href="' + CDB + "/source/" + r.src + '/" target="_blank" rel="noopener"><b>' + esc(r.siglum) + "</b></a><small>" + esc(r.title) + "</small></td>" +
        "<td>" + esc(r.century) + "</td><td>" + esc(r.prov) + "</td>" +
        '<td><a href="' + CDB + "/chant/" + r.chant + '/" target="_blank" rel="noopener">' + esc(r.folio) + "</a></td>" +
        "<td>" + esc(r.feast) + "</td><td>" + esc(r.mode) + "</td>" +
        '<td class="ch-img">' + (r.image ? '<a href="' + esc(r.image) + '" target="_blank" rel="noopener"' + (pv ? ' data-pv="' + esc(pv) + '"' : "") + ">" + (pv ? "View" : "Open") + "</a>" : "") + "</td>" +
        '<td><button class="ch-add' + (on ? " on" : "") + '" type="button" aria-label="Add to collection">' + (on ? "✓" : "+") + "</button></td></tr>";
    }).join("");
  }

  $("rows").addEventListener("click", function (e) {
    var b = e.target.closest(".ch-add");
    if (!b) return;
    var r = currentRows[+b.closest("tr").dataset.i];
    var list = items(), k = list.findIndex(function (c) { return c.chant === r.chant; });
    if (k >= 0) list.splice(k, 1);
    else list.push({ cid: r.cid, chant: r.chant, incipit: current.incipit, genre: r.genre, feast: r.feast, mode: r.mode, folio: r.folio,
      src: r.src, siglum: r.siglum, title: r.title, century: r.century, prov: r.prov, not: r.not, image: r.image, text: r.text });
    save();
    renderRows();
    renderColl();
  });

  /* ---------- hover preview ---------- */
  var pop = $("pop"), popImg = pop.querySelector("img"), popTxt = pop.querySelector("span");
  document.addEventListener("mouseover", function (e) {
    var t = e.target.closest && e.target.closest("[data-pv]");
    if (!t) return;
    if (popImg.getAttribute("src") !== t.dataset.pv) { popTxt.textContent = "…"; popImg.src = t.dataset.pv; }
    pop.hidden = false;
    place(e);
  });
  document.addEventListener("mouseout", function (e) {
    var t = e.target.closest && e.target.closest("[data-pv]");
    if (t && !t.contains(e.relatedTarget)) pop.hidden = true;
  });
  document.addEventListener("mousemove", function (e) { if (!pop.hidden) place(e); });
  popImg.addEventListener("load", function () { popTxt.textContent = ""; });
  popImg.addEventListener("error", function () { popTxt.textContent = "No preview"; });
  function place(e) {
    var w = pop.offsetWidth, h = pop.offsetHeight, x = e.clientX + 18, y = e.clientY - h / 2;
    if (x + w > innerWidth - 8) x = e.clientX - w - 18;
    y = Math.max(8, Math.min(y, innerHeight - h - 8));
    pop.style.left = Math.max(8, x) + "px";
    pop.style.top = y + "px";
  }

  /* ---------- collections (kept in this browser) ---------- */
  var KEY = "chantCollections", store;
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!store || !store.lists) store = { cur: "Collection", lists: { Collection: [] } };
  function items() { return store.lists[store.cur] || (store.lists[store.cur] = []); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  function renderColl() {
    $("cSel").innerHTML = Object.keys(store.lists).map(function (n) {
      return "<option" + (n === store.cur ? " selected" : "") + ">" + esc(n) + "</option>";
    }).join("");
    var list = items();
    $("cList").innerHTML = list.map(function (c, i) {
      return '<li data-i="' + i + '"><span><b>' + esc(c.incipit) + "</b><small>" + esc([c.siglum, c.folio, c.century, notName(c.not)].filter(Boolean).join(" · ")) +
        '</small></span> <button type="button" data-a="up" aria-label="Move up">↑</button><button type="button" data-a="down" aria-label="Move down">↓</button><button type="button" data-a="rm" aria-label="Remove">×</button></li>';
    }).join("");
    $("cPdf").disabled = !list.length;
    $("cDel").disabled = Object.keys(store.lists).length < 2;
  }
  $("cSel").addEventListener("change", function () { store.cur = this.value; save(); renderColl(); if (current) renderRows(); });
  $("cNew").addEventListener("click", function () {
    var n = (prompt("Name") || "").trim();
    if (!n) return;
    if (!store.lists[n]) store.lists[n] = [];
    store.cur = n; save(); renderColl(); if (current) renderRows();
  });
  $("cRen").addEventListener("click", function () {
    var n = (prompt("Name", store.cur) || "").trim();
    if (!n || n === store.cur || store.lists[n]) return;
    store.lists[n] = store.lists[store.cur]; delete store.lists[store.cur]; store.cur = n; save(); renderColl();
  });
  $("cDel").addEventListener("click", function () {
    if (Object.keys(store.lists).length < 2 || !confirm("Delete “" + store.cur + "”?")) return;
    delete store.lists[store.cur]; store.cur = Object.keys(store.lists)[0]; save(); renderColl(); if (current) renderRows();
  });
  $("cList").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var list = items(), i = +b.closest("li").dataset.i;
    if (b.dataset.a === "rm") list.splice(i, 1);
    if (b.dataset.a === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
    if (b.dataset.a === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
    save(); renderColl(); if (current) renderRows();
  });

  /* ---------- PDF: one page per chant, through the browser's print dialog ---------- */
  $("cPdf").addEventListener("click", function () {
    var list = items();
    var title = document.title;
    $("print").innerHTML = list.map(function (c) {
      var pv = preview(c.image, 1400), ex = notImg(c.not);
      var meta = [["Source", c.siglum + (c.title ? ", " + c.title : "")], ["Folio", c.folio], ["Date", c.century], ["Origin", c.prov],
        ["Notation", notName(c.not)], ["Genre", c.genre], ["Feast", c.feast], ["Mode", c.mode], ["Cantus ID", c.cid]]
        .filter(function (m) { return m[1]; }).map(function (m) { return "<dt>" + esc(m[0]) + "</dt><dd>" + esc(m[1]) + "</dd>"; }).join("");
      return '<section class="pp"><h1>' + esc(c.incipit) + '</h1><dl class="meta">' + meta + "</dl>" +
        (c.text ? '<p class="text">' + esc(c.text) + "</p>" : "") +
        (ex ? '<img class="ex" src="' + esc(ex) + '" alt="">' : "") +
        (pv ? '<img class="page" src="' + esc(pv) + '" alt="">' : "") +
        '<p class="link">' + esc(CDB + "/chant/" + c.chant + "/") + (c.image ? "<br>" + esc(c.image) : "") + "</p></section>";
    }).join("");
    var imgs = [].slice.call($("print").querySelectorAll("img"));
    status("Preparing PDF…");
    Promise.race([
      Promise.all(imgs.map(function (im) { return im.complete ? 0 : new Promise(function (ok) { im.onload = im.onerror = ok; }); })),
      new Promise(function (ok) { setTimeout(ok, 15000); })
    ]).then(function () {
      imgs.forEach(function (im) { if (!im.naturalWidth) im.remove(); });
      status("");
      document.title = store.cur;
      window.print();
      document.title = title;
    });
  });

  renderColl();
  var q0 = new URLSearchParams(location.search).get("q");
  if (q0) { $("q").value = q0; $("search").requestSubmit(); }
})();
