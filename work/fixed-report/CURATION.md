# Recommended versions

`curation.json` names one recommended version for every dice pair on each recorded track, with a short reason and one sentence on what the other passes gained or lost. These are editorial judgments made after the recording, by looking at the rendered pages. They are not measurements, they are not part of the frozen experiment, and another reviewer could reasonably pick differently. The recorded reports themselves are unchanged.

The point is to stop the rightmost pass reading as the winner. Each refinement makes the page more distinct; it does not necessarily make it better.

## Shape

```json
{"original": {"4-3": {"pick": 1, "reason": "chequered finale bar", "note": "…"}},
 "showcase": [{"pair": "5-3", "reason": "bars lit as stage arches"}]}
```

- Tracks: `original` (earlier model, original refinement prompt), `stronger` (earlier model, stronger refinement prompt, same one-shot), `newer` (newer model, original prompt).
- Pair ids are `a-b`, the indexes of the two dice faces, as in the catalogs.
- `pick`: 1 = one-shot, 2 = +1, 3 = +2, 4 = +3. The plain no-dice page is never a pick.
- `reason`: two to five words. `note`: one sentence.

`check-curation.mjs` (run by `npm test`) checks that every pair on every curated track has exactly one valid pick, reason and note, that the last pass is not the default, and that the showcase lists 5–8 distinct original-track pairs.

## Rubric

Applied in order. A later criterion only separates versions the earlier ones left tied.

1. **Quality floor.** A version that fails the floor is not recommended while another version of the pair passes it.
   - Labels and secondary text at least about 11px at 860px wide. A stray footer under 11px is a small fault; chart labels or table headers under 11px are a fail.
   - Secondary text readable: about 4.5:1 contrast for small text, 3:1 for large.
   - Numerals aligned in tables and stat rows (tabular figures or right-aligned columns).
   - Charts still read as charts: the seven-day trend shows its shape at a glance on a common baseline with day labels, and sources stay comparable. A chart replaced by a table of numbers, a gauge or decoration fails.
2. **One strong carrier per identity.** The pairing is carried by one strong idea (the masthead, the chart form, a material, a typographic voice). Structural carriers beat decoration. The theme restated in every box counts against a version, as does a generic dashboard with a colour swap.
3. **Lineage.** Find the best move in the pair's history and prefer the version that holds it in its best form. Ties go to the earlier version; a pass that renders the same as its predecessor never wins.

## Method

1. Every recorded version was rendered headless in Chrome at 860px wide, full page, after its load animations finished.
2. Each render was probed for the floor: the smallest visible text, text under 11px, approximate contrast of each text element against its resolved background, and whether numeric strings use tabular or monospace figures. The contrast probe is approximate (gradients and labels positioned over bars can mislead it), so flags were checked by eye before counting.
3. The four versions of each pair were laid side by side on a contact sheet with those measurements and the share of pixels changed from the previous version. A text diff listed the copy each pass added or removed.
4. Each pair was judged from its sheet, with full-resolution crops where the sheet left the call open. The original track was judged first; the stronger and newer tracks were judged against the same rubric, with the original picks as calibration.

## Showcase

`showcase` lists six original-track pairs, best first, each with a short phrase. A first-time visitor's first roll may land on one of them; every roll after that stays random, and nothing in the recorded experiment changes.

The criterion is the one-shot, because the Dice step is what a first roll shows. A showcase pair's one-shot has to:

- look clearly unlike the plain page, not the same cream-and-green report with a new name;
- carry the pairing in one idea a visitor can read at a glance (glowing arches for bars, a mirror ball in a government form, a chequered flag on the final act);
- stay readable: the data, chart and controls intact, with no floor failure worse than small table headers.

Ties went to variety, so the list spans light and dark pages and no ingredient appears more than twice. Most cream-and-green or generic dark one-shots were left out even where a later pass improved them, since the first roll only shows the one-shot.

## What the picks show

| Track | One-shot | +1 | +2 | +3 |
| --- | --- | --- | --- | --- |
| original | 13 | 14 | 9 | 0 |
| stronger | 9 | 15 | 11 | 1 |
| newer | 15 | 15 | 6 | 0 |

The last pass is the recommended version once in 108 pairs: stronger Motorsport × Victorian insect collecting, where +3 rejoined a trend that +1 and +2 had split into seven separate drawers.

- **Original track: the passes converge, then repeat.** The median share of pixels changed is 15% at +1, 3% at +2 and 0% at +3; +3 is byte-identical to +2 in 30 of 36 pairs. The usual loss is small: in 17 pairs a later pass dropped, recoloured or moved the comparison bars beside each traffic source, and many swapped a headline with some voice for "Website performance". A single accent (a pink, gold or chequered Sunday bar) was often lost, or tiled onto every bar so it no longer marked anything.
- **Stronger track: the passes keep changing, and the chart pays.** The median change stays high (31%, 27%, 14%). +1 usually finds the structural idea: a menu board and receipt, a pediment, a forecast board. Later passes mostly add ornament. In about a third of the pairs a glanceable vertical bar chart becomes horizontal bars or rules inside a table, a thin line, or gauge strips, and in another third the later passes bring in 9–10px captions and headers.
- **Newer track: strong one-shots, additive passes.** Later passes add sub-11px captions, redraw source sign-ups as slivers on the visits scale, and in three pairs introduce collisions (a stamp printed over 12,480, a clipped row label, axis ticks running into a day label). About half the newer pairs have small labels in every version, so those picks are the least bad, not clean; the Deep-sea pairs with Tech, Disco, Fast food and Luxury hotel stay generic glow dashboards throughout.
- **Real gains are usually fixes.** The passes that won restored a clipped Sunday column, lifted 9px labels to 11px, repaired contrast, added a missing daily-rate row, or put back a bar chart that an earlier pass had broken up.
