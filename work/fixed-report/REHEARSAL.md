# Rehearsal: narrative stage

A working, user-paced experience, not a recorded demo. Stage Show 1.1.0 (benjitaylor/skills) guided the working-UI craft: a sliding segmented selection, labels that change on the same button, and state changes that ease in. No simulated cursor or timed playback.

## Story

One headline per step, the report in the middle, one action below it.

1. **One prompt. One page.** The plain report and the brief it came from. Action: Add randomness.
2. **Now add randomness.** The dice roll in from either side of the report and land on two ingredients. Click a die to swap that ingredient. Reset returns to the plain page; the dice leave the way they came.
3. **Now refine it. / Again. / And again.** The same refinement prompt, three times. A pass that changed nothing says so.
4. **Explore.** The chapters (Plain, Dice, +1, +2, +3) jump anywhere; Prompt, Compare and Share sit beside the action; all 36 combinations are below.

Adding randomness from the plain page rolls a fresh pair. The Dice chapter returns to the last pair.

## Demo and takeover

A first visit (no query, motion allowed) plays the story once with a cursor: read the plain page, add randomness (an authored roll: Deep-sea bioluminescence × Fast food), swap the first die (Cthulhu), then refine three times and step aside. The demo drives the real state functions, so a visitor's pointer, tap, key or scroll stops it at once and keeps whatever is on screen. **Watch demo** replays it; it pauses with a hidden tab and stops when the width changes. Reduced motion never autoplays.

Reports change with a top-down wipe: the previous page clips away from its top edge while a vermilion line rides the boundary (560ms). First loads fade in once painted.

## Rehearsed

- Demo: autoplay to +3 and handover at desktop and 375 × 812; a real tap mid-demo stopped it with the state kept.
- In-app browser at 1280 × 800: each beat, a die swap during refinement, Reset with the dice exit, the prompt panel and Compare.
- 375 × 812: plain and dice steps; the dice sit side by side above the action and the report starts at 441px; no horizontal overflow.
- Reports keep their reading position across steps and scroll together in Compare.

## Limits

The browser pane ran at a 1.5 device-pixel ratio late in the session, so desktop stills were cropped and desktop layout was checked by measurement. It also advanced animations only when capturing, so mid-motion stills are unreliable. It painted newly loaded report frames late, so several stills show a blank frame that filled in on the next capture. No physical touch device or reduced-motion emulation was used; the dice entrance and exit are skipped under reduced motion and when the page is hidden.
