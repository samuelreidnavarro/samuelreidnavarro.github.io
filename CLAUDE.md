# Samuel's website

Plain HTML/CSS site (GitHub Pages, repo samuelreidnavarro.github.io). No build step.

- Shared engine lives in `games/scriptorium/`. Edit the engine, not the individual app pages.
- After changing `style.css`, bump the cache-buster (`style.css?v=N`) in every HTML page.
- Preview: `python3 -m http.server 8000`, then open http://localhost:8000

## Release rule
- Commit locally as often as you like. Do NOT push to `main` until Samuel says "publish".
- Each publish gets a tag: v0.1.1, v0.1.2, ... Push `main` and the tag together
  (`git push origin main --follow-tags`, or push the tag explicitly).
- v0.1 is the baseline tag (current main when this setup was done).

## The ChoirBook file (.choirbook.xml)
One file with everything about a piece: the music (as **kern text, which carries lyrics, credits and what came from CMME/MEI etc.), the layout settings, and the per-piece items (voices shown, clefs, staves, incipit, black notation). Code: `exportChoirbook`, `readChoirbook`, `openChoirbook` in `games/scriptorium/scriptorium.js`.
- **Files only ever grow.** Never rename or remove a setting or element; old files must keep opening for ever.
- A new layout/look setting that belongs to a piece (fonts of lyrics, titles, composer names, ...): add its name to `CB_SETTINGS`. A new per-piece item kept in `st` under the piece key: add it to `CB_PIECE_ITEMS`. Missing in a file = leave the person's own value.
- A change that cannot be only an addition: raise `CB_VERSION` and add a step to `CB_MIGRATE`.
- When the format changes, ADD a new example file to `tests/choirbook-files/` (never edit or delete the old ones) and list it in `tests/choirbook-compat.html`; open that page (site running) before publishing: every line must be green.

## Pre-publish checklist
Before every publish, verify:
- **Touchscreens:** Every hover-opened dropdown, sub-menu, or pop-up also works on touchscreens (tap-to-toggle, or press-and-hold when the button has a primary tap action) and closes cleanly on selection or tapping outside.
- **Cache-busters across all apps:** After editing `games/scriptorium/scriptorium.js` or `scriptorium.css`, bump `?v=N` in every Scriptorium app (`games/choirbook.html`, `games/cantus-firmus.html`, `games/canon-maker.html`, `games/cat-melodia.html`, `games/cat-contrapunctus.html`) and their outer wrapper pages (`choirbook.html`, `cantus-firmus.html`, `canon-maker.html`, `cat-melodia.html`, `cat-contrapunctus.html`).
- **All score-loading paths:** Any feature or add-on that updates UI on piece load works for Repertoire (`loadPiece`), `Open file` / drag-and-drop (`loadText`), and voice/title edits—always using the piece's actual voice names and metadata.
- **Popups & Repertoire panel:** Panels keep their background/glass styling across every app (not just ChoirBook), keep proper `z-index`, and never close unexpectedly when clicking internal navigation items (composers, genres, categories).
- **ChoirBook file:** Any new setting that belongs to a piece or its layout is written to and read from `.choirbook.xml` (see above), and `tests/choirbook-compat.html` is all green.
