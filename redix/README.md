# ReDiX in the browser

This folder belongs to [redix.html](../redix.html), a browser version of
**ReDiX – Renaissance Digital eXplorer** by **Ugo Bindini**
(<https://github.com/ugobindini/redix>). The idea, the analysis of the scores
and the original search are his. The browser version adds a search for
successions of two sonorities ("interval successions") and links every result
to the [Choir book](../choirbook.html).

Like the original, `redix.html` and the files in this folder are free software
under the GNU General Public License, version 3 (see `LICENSE`).

## Files

- `index.json`, `points.bin`: the sonorities of every piece, exported from the
  ReDiX database (onset time, bar, beat, lowest note, intervals above the bass).
  Each record in `points.bin` is 10 bytes: int32 time × 100 (in quarter notes,
  a semibreve = 4), uint16 bar, uint8 beat, uint8 lowest note (diatonic, c3 = 28),
  uint16 index into `chords` in `index.json`. `index.json` lists, per piece, its
  position in `../games/choirbook/catalogue.json` and its number of records.
- `verovio-humdrum-3.10.0.js`: [Verovio](https://www.verovio.org) with Humdrum
  support (npm package `verovio-humdrum`), LGPL-3.0, by Laurent Pugin, Craig Sapp
  and others. It draws the music examples and cuts out the bars with the Humdrum
  filter `myank`.

## Scores

The scores are not stored here; they are loaded from where they are published:

- Josquin Research Project, <https://josquin.stanford.edu>,
  <https://github.com/josquin-research-project/jrp-scores> (CC BY-NC 4.0)
- The 1520s Project (Benjamin Ory), <https://1520s-project.org>,
  <https://github.com/benory/1520s-project-scores> (CC BY-NC 4.0)
- Palestrina masses encoded by John Miller, in the music21 corpus,
  <https://github.com/cuthbertLab/music21>

80 files whose current published version differs from the one ReDiX analysed
(renamed or re-edited since) are kept in `../games/choirbook/redix/`, so that bar
numbers match the search results; they are from the JRP and the 1520s Project
and are shared under CC BY-NC 4.0 with attribution.
