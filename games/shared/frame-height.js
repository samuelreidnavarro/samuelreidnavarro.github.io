/* Inside the website's frame: tell the page how tall the app is, so the page scrolls and the frame doesn't.
   Shared by the CantusFirmus and ChoirBook apps. key is the message name the page listens for. */
window.frameHeight = function(key){
  try {
    if (window.parent === window) return () => {};
    let last = 0;
    const post = () => {
      /* the app's own bottom (not the frame's: the page may make the frame taller than the app) */
      let h = document.body.getBoundingClientRect().bottom + window.scrollY;
      /* a menu that opens below the end of the page */
      document.querySelectorAll('.popbody, .library').forEach(p => {
        const r = p.getBoundingClientRect();
        if (r.height && getComputedStyle(p).display !== 'none') h = Math.max(h, r.bottom + window.scrollY + 20);
      });
      h = Math.ceil(h);
      if (h !== last) { last = h; parent.postMessage({[key]: h}, '*'); }
    };
    if (window.ResizeObserver) { new ResizeObserver(post).observe(document.body); new ResizeObserver(post).observe(document.documentElement); }
    setInterval(post, 400);
    post();
    return post;
  } catch (e) { return () => {}; }
};
