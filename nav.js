/* App and tool pages: the bar is out when the page opens and folds to the left into a small "S" square after ten seconds;
   resting the mouse on the S opens it again, and it folds once the mouse leaves the bar. On touch screens the S is tapped to open it, and a tap elsewhere folds it.
   In ChoirBook, Canon Maker and CantusFirmus the S sits just left of the app's Edit pen, on the same row. */
(function () {
  var body = document.body, nav = document.querySelector("body.compact .nav"), brand = nav && nav.querySelector(".brand");
  if (!nav || !brand) return;
  var name = brand.textContent.trim();
  brand.innerHTML = '<span class="b-s">' + name.charAt(0) + '</span><span class="b-rest">' + name.slice(1) + "</span>";
  brand.setAttribute("aria-label", name);
  var GAP = 8, SIZE = 40, root = document.documentElement;
  var frame = document.querySelector("main iframe");
  var open = true, anim = 0;

  /* where the S goes: beside the pen when the app has one, else in the top left corner */
  function appDoc() { try { return frame && frame.contentDocument; } catch (e) { return null; } }
  /* the first control of the app's top row (the Edit pen; on phones the Open menu comes first) */
  function pen() {
    var d = appDoc(), e = d && d.getElementById("editPod");
    if (!e) return null;
    var best = e, b = e.getBoundingClientRect();
    [].forEach.call(e.parentNode.querySelectorAll(".podg"), function (c) {
      var r = c.getBoundingClientRect();
      if (r.width && Math.abs(r.top - b.top) < 4 && r.left < best.getBoundingClientRect().left) best = c;
    });
    return best;
  }
  function place() {
    var p = pen(), left = 14, top = 8, size = SIZE;
    if (p) {
      var d = appDoc();
      d.documentElement.classList.add("site-s");
      d.documentElement.style.setProperty("--site-s", (size + GAP) + "px");
      var r = p.getBoundingClientRect();
      if (r.height) {
        size = Math.round(r.height);
        d.documentElement.style.setProperty("--site-s", (size + GAP) + "px");
        r = p.getBoundingClientRect();
        /* the folded bar takes no room: the frame then starts where the bar starts */
        var fr = frame.getBoundingClientRect(), nr = nav.getBoundingClientRect();
        top = Math.round(fr.top + r.top - nr.top - nr.height);
        left = Math.round(fr.left + r.left - nr.left - size - GAP);
      }
    }
    root.style.setProperty("--s-left", Math.max(4, left) + "px");
    root.style.setProperty("--s-top", Math.max(4, top) + "px");
    root.style.setProperty("--s-size", size + "px");
  }

  /* while the bar opens or folds, the pages below re-measure themselves every frame */
  function settle() {
    cancelAnimationFrame(anim);
    var until = performance.now() + 420;
    (function tick() {
      window.dispatchEvent(new Event("resize"));
      if (performance.now() < until) anim = requestAnimationFrame(tick);
    })();
  }
  function set(o) {
    if (o === open) return;
    open = o;
    body.classList.toggle("nav-folded", !o);
    if (!o) { place(); if (window.SiteMenu) window.SiteMenu.closeAll(); }
    settle();
  }
  /* a phone keeps a "hover" where it was last tapped, so only a real mouse counts as resting on the bar */
  var mouse = false;
  document.addEventListener("pointermove", function (e) { mouse = e.pointerType === "mouse"; }, { passive: true });
  /* an open More menu (menu.js) also keeps the bar out */
  var held = function () { return (mouse && nav.matches(":hover")) || nav.matches(":focus-within") || !!nav.querySelector(".has-menu.open"); };
  var foldTimer = 0, started = false;
  function foldSoon(ms) {
    clearTimeout(foldTimer);
    foldTimer = setTimeout(function () { if (!held()) set(false); }, ms);
  }

  /* the mouse opens the bar only by resting on the S itself, and the bar folds again shortly after the mouse leaves it */
  brand.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && !open) { clearTimeout(foldTimer); set(true); } });
  nav.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") clearTimeout(foldTimer); });
  nav.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && open && started) foldSoon(600); });

  /* touch: the folded S opens the bar instead of going home; a tap anywhere else folds it */
  brand.addEventListener("click", function (e) { if (!open) { e.preventDefault(); set(true); } });
  function onTap(e) { if (e.pointerType !== "mouse" && open && !nav.contains(e.target)) set(false); }
  document.addEventListener("pointerdown", onTap, true);
  nav.addEventListener("focusin", function () { clearTimeout(foldTimer); set(true); });
  nav.addEventListener("focusout", function () { setTimeout(function () { if (started && !held()) set(false); }, 0); });

  /* the app in the frame is on this site, so its mouse moves can be followed too */
  function hook() {
    var d = appDoc();
    if (!d || d.__siteNav) return;
    d.__siteNav = true;
    d.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse" && open) set(false); }, true);
  }
  if (frame) {
    frame.addEventListener("load", function () { hook(); place(); setTimeout(place, 600); setTimeout(place, 2000); });
    hook();
  }
  window.addEventListener("resize", function () { if (!open) place(); });
  window.addEventListener("load", place);

  /* the page opens with the bar out; after ten seconds it folds into the S (unless the mouse is on it) */
  body.classList.add("nav-fold");
  setTimeout(function () { started = true; if (!held()) set(false); }, 10000);
})();
