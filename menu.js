/* The "More" menu in the navigation.
   Touch: one tap on More opens the menu, a tap on an item goes there, a tap anywhere else closes it.
   Mouse: resting on More opens it, and it closes shortly after the mouse leaves; a click on More also opens or closes it.
   Keyboard: Enter on More opens it, Escape closes it.
   The menu is placed on the screen itself (not inside the bar), so a bar that scrolls sideways on a phone cannot cut it off. */
(function () {
  var items = [].slice.call(document.querySelectorAll(".nav .has-menu"));
  if (!items.length) return;
  document.documentElement.classList.add("js-menu");

  items.forEach(function (li) {
    var link = li.querySelector(":scope > a"), menu = li.querySelector(":scope > .menu");
    if (!link || !menu) return;
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    var closeTimer = 0;

    function place() {
      var r = link.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
      menu.style.maxWidth = (vw - 16) + "px";
      var w = menu.offsetWidth;
      var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - 8 - w);
      menu.style.left = Math.round(left) + "px";
      menu.style.top = Math.round(r.bottom) + "px";
      menu.style.maxHeight = Math.max(120, vh - r.bottom - 8) + "px";
    }
    function isOpen() { return li.classList.contains("open"); }
    function open() {
      clearTimeout(closeTimer);
      if (isOpen()) return;
      closeAll(li);
      li.classList.add("open");
      link.setAttribute("aria-expanded", "true");
      place();
    }
    function close() {
      clearTimeout(closeTimer);
      if (!isOpen()) return;
      li.classList.remove("open");
      link.setAttribute("aria-expanded", "false");
    }
    li.__menu = { open: open, close: close, place: place, isOpen: isOpen };

    /* a tap or click on More opens or closes the menu instead of leaving the page */
    link.addEventListener("click", function (e) {
      e.preventDefault();
      if (isOpen() && !li.__hoverOpened) close(); else open();
      li.__hoverOpened = false;
    });

    /* mouse only: hovering opens, leaving closes after a moment */
    li.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      if (!isOpen()) li.__hoverOpened = true;
      open();
    });
    li.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      li.__hoverOpened = false;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, 300);
    });

    /* keyboard: leaving the menu with Tab closes it */
    li.addEventListener("focusout", function () {
      setTimeout(function () { if (!li.contains(document.activeElement)) close(); }, 0);
    });
    /* a chosen item closes the menu (matters when the page does not change, e.g. the current page) */
    menu.addEventListener("click", function () { close(); });
  });

  function closeAll(except) { items.forEach(function (li) { if (li !== except && li.__menu) li.__menu.close(); }); }
  function anyOpen() { return items.some(function (li) { return li.__menu && li.__menu.isOpen(); }); }

  /* a tap or click anywhere else closes it */
  function outside(e) {
    if (!anyOpen()) return;
    var t = e.target;
    items.forEach(function (li) { if (li.__menu && !li.contains(t)) li.__menu.close(); });
  }
  document.addEventListener("pointerdown", outside, true);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !anyOpen()) return;
    items.forEach(function (li) {
      if (li.__menu && li.__menu.isOpen()) { li.__menu.close(); var a = li.querySelector(":scope > a"); if (a) a.focus(); }
    });
  });

  /* taps inside an app on this site (in a frame) close it too */
  function hookFrame(f) {
    function hook() {
      try {
        var d = f.contentDocument;
        if (!d || d.__siteMenu) return;
        d.__siteMenu = true;
        d.addEventListener("pointerdown", function () { closeAll(null); }, true);
      } catch (err) { /* another site: nothing to follow */ }
    }
    f.addEventListener("load", hook);
    hook();
  }
  [].forEach.call(document.querySelectorAll("iframe"), hookFrame);
  /* clicking into a frame from another site moves the focus away from this window */
  window.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement && document.activeElement.tagName === "IFRAME") closeAll(null); }, 0); });

  /* keep it under More when the page or the bar scrolls, or the screen turns */
  function replace() { items.forEach(function (li) { if (li.__menu && li.__menu.isOpen()) li.__menu.place(); }); }
  window.addEventListener("scroll", replace, { passive: true });
  window.addEventListener("resize", replace);
  [].forEach.call(document.querySelectorAll(".nav ul"), function (ul) { ul.addEventListener("scroll", replace, { passive: true }); });

  window.SiteMenu = { anyOpen: anyOpen, closeAll: function () { closeAll(null); } };
})();
