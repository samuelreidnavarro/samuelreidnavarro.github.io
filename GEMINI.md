# Pre-Publish QA & Bug-Testing Rules

Before publishing or pushing any web app changes to `main`, automatically check and verify:

1. **Touchscreens (`hover: none` / `!canHover()`):**
   - Every hover-opened dropdown, sub-menu, tooltip-gated control, or pop-up must also work on touchscreens (tap-to-toggle, or press-and-hold when the button has a primary tap action) and close cleanly on selection or tapping outside.
2. **Visual glitches & popups:**
   - Verify backgrounds, liquid-glass `backdrop-filter` (no parent backdrop-root clipping), `z-index` layering, and dark-mode contrast across *every* app sharing the engine—not just the one currently being edited.
   - Verify popups and panels (`.popbody`, `#library`) never collapse or close unexpectedly on internal clicks (e.g., clicking a composer, genre, or category) and never show unwanted scrollbars on short menus.
3. **All score-loading & editing paths:**
   - Any UI or add-on hook that reacts to a score must work for Repertoire loading (`loadPiece`), `Open file` / drag-and-drop (`loadText`), and voice/title edits—always using the piece's actual voice names and metadata.
4. **Cache-busters in sync across every app:**
   - Whenever `games/scriptorium/scriptorium.js`, `scriptorium.css`, or `style.css` changes, bump `?v=N` in **all** Scriptorium apps (`games/choirbook.html`, `games/cantus-firmus.html`, `games/canon-maker.html`, `games/redix-melodia.html`, `games/redix-contrapunctus.html`) and their outer wrapper pages.
