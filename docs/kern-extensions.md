# Scriptorium `**kern` Superset Specification (`!!!SCRIPTORIUM: 2`)

Scriptorium uses Humdrum `**kern` as its internal working and save format, extended with backwards-compatible tokens and a structured `!!!EXT:` sidecar so that every supported format (CMME, MEI, MusicXML, MuseScore, MIDI, LilyPond, GABC) can round-trip without silent data loss.

## Header

- `!!!SCRIPTORIUM: 2` — identifies a Scriptorium v2 superset file.
- Standard reference records: `!!!OTL:` (Title), `!!!COM:` / `!!!COA:` (Composer / Attributed), `!!!SCT:` / `!!!SMS:` (Source / Section), `!!!ENC:` (Editor), `!!!YEC:` (Licence), `!!!ONB:` (Notes).

## Inline Note / Event Signifiers

| Token | Meaning | Notes |
|---|---|---|
| `@` | Coloured (black) as written | Affects duration (`2/3` unless CMME same-sound hemiola) |
| `N` | Display-only black notehead | No rhythmic change (E15) |
| `+` | Display-only white notehead | No rhythmic change (E15) |
| `j` | Display-only red notehead | No rhythmic change (E15) |
| `~` | Altered note (mensural alteration) | Written as half its sounding value |
| `Y` | *Punctus divisionis* | Does not add duration |
| `W` | *Punctus additionis* on a perfect value | Keeps value perfect |
| `l` | Final *longa* | Drawn as *longa* regardless of sounding length |
| `;` | Fermata (*corona*) | Musical pause / hold |
| `$` | *Signum congruentiae* | Visual entry/alignment mark, no playback effect (E6) |
| `U` / `J` / `Q` | Per-note stem direction override | Up / Down / None (E2) |
| `K` / `R` | Per-note stem side override | Left / Right (E2) |
| `i` | Editorial accidental (*musica ficta*) | Placed above staff when Editorial accidentals = On |
| `a b` (space) | Chord / stacked notes | Same-duration notes in one voice |

## Tandem Interpretations & Barlines

- `*met(sign;eq=X;mp;xp;sf=N)` — Mensuration sign with optional invisible parameters:
  - `eq=M|S|B|L` — equivalence level across sign changes
  - `mp` — *modus minor perfectus* (3 breves per longa)
  - `xp` — *modus maior perfectus* (3 longae per maxima)
  - `sf=N` or `sf=A/B` — voice speed factor against other voices (E1; e.g. `sf=2`, `sf=1/2`, `sf=4/3`)
- `*mod(n/d)` — Modern time signature equivalent
- `*oclef...` — Original source clef
- `*lig` / `*Xlig` — Ligature span
- `*divisi` — Companion Layer 2 voice sharing the preceding voice's staff
- `=!` — Editorial section line (single), `=||` (double)
- `!!section: <label>` — Staff text / section heading / rehearsal mark

## Structured Sidecar (`!!!EXT:`)

Structured metadata and pass-through data that cannot be represented in single inline tokens are stored at the end of the `**kern` file as one or more `!!!EXT: <json>` comment lines (ignored safely by older Humdrum/Scriptorium parsers):

- `credits`: `{editor, source, notes, licence}` (E11)
- `rests`: `{ "<vi>:<t>": {bot, sp} }` — rest bottom staff line & span spaces (E3)
- `custos`: `[{vi, t, step}]` — explicit custos marks (E4)
- `lacunae`: `[{vi, t, d, label}]` — missing-passage markers (E5)
- `origText`: `{ "<vi>:<t>": "<text>" }` — original orthography text layer (E7)
- `ann`: `[{vi, t, text}]` — editorial annotations (E8)
- `ligKind`: `{ "<vi>:<t>": "auto|recta|obliqua|cop|sp" }` — ligature kind override (E12)
- `variants`: `{ versions: [{id, name}], active, readings: [{vi, t0, t1, alts}] }` — variant readings & apparatus (E9)
- `chants`: `[{t, title, gabc}]` — inline plainchant sections (E10)
- `pass`: raw pass-through entries from source files (CMME/MEI) for lossless round-trip.
