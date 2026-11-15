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
