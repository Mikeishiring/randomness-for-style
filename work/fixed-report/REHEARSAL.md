# Rehearsal: narrative stage

A working, user-paced experience, not a recorded demo. Stage Show 1.1.0 (benjitaylor/skills) guided the working-UI craft: a sliding segmented selection, labels that change on the same button, and state changes that ease in. No simulated cursor or timed playback.

## Story

The pitch, one beat per idea: the plain prompt (the page everyone gets), add randomness (one die lands; the page waits, because every saved result needs both ingredients), and another (the second die lands and the page changes), then refine in those directions. The dice are the action for the first two beats: the first die waits on the plain page saying "Click me"; once it lands the second die arrives saying the same; the refine button appears only when the pair has made a page. Compare sits beside the action and lays both pages side by side at full width; Prompt, Share, Watch demo and Sound live in a bar at the foot of the page (each pass names the two ingredients it leans into), then compare.

No headline competes with the report: each step is announced to screen readers, and on screen one pointing label names the next action beside its control. The plain step points at the report, the dice step at the first die, and after a swap the label moves to the action ("Now refine it.", "Again.", "Once more.", "Three passes in… Compare it."). The action is a vermilion keycap that lifts on hover and presses down.

Changes arrive one at a time so the eye is led rather than pulled: the press, then the page wipe and its stacked sheet (120ms later), then the timeline (260ms later), then the next label (760ms). The label itself draws in from its target: a vermilion dot lands, the leader draws out, then a paper card settles at its end. Ingredient names under the dice are set in the type each ingredient brings (italic Palatino for Cthulhu, heavy capitals for Fast food, mono for Tech and Bureaucracy, wide serif capitals for Greek myths and Luxury hotel). Hovers ease over 180ms into a vermilion tint.

1. **One prompt. One page.** The plain report and the brief it came from. Action: Add randomness.
2. **Now add randomness.** The dice roll in from either side of the report and land on two ingredients. Click a die to swap that ingredient. Reset returns to the plain page; the dice leave the way they came.
3. **Now refine it. / Again. / And again.** The same refinement prompt, three times. A pass that changed nothing says so.
4. **Explore.** A small step track under the action (Plain, Dice, +1, +2, +3) jumps anywhere. Reset sits under the first die; Prompt, Compare, Share and Watch demo under the second; all 36 combinations are below. There is no top bar.

Pointing labels name what an object can do beside the object: in the dice step a label points at the first die until a die has been rolled. The dice are solid bevelled objects: six inset faces, twelve 45° bevels and eight corner facets, each lit from its own normal through the pose and camera on every animation sample, so faces brighten and darken as the die turns. Each sits on a slanted ground plane in its own perspective. The twelve face icons are bold single-weight drawings with one accent detail each (Cthulhu's eyes, the lightning bolt, the angler's lure, the chip core). Throws sound: the existing synthesized clatter (dice-sound.js) plays at the plan's real contact times after a visitor gesture, with a Sound toggle.

Refinement has momentum: the action is a large button that fires a sheen when pressed, the new page settles in (a 12px drop) while the previous one is wiped away, and each pass leaves a sheet stacked behind the report. The timeline below the button shows nodes on one line: done steps filled, the current step vermilion.

Adding randomness from the plain page rolls a fresh pair. The Dice chapter returns to the last pair.

The story cards speak to the visitor and carry the next move: clicking a card (or Enter on it) rolls the first die, rolls the second, refines, or compares. The narration says back what the visitor actually did, so breaking the story's order still explains where you are: "You added Greek myths. It is now part of the style brief. Roll the second die.", "You swapped in Disco.", "You chose Opera.", "You picked Cthulhu × Tech." Moving through the passes returns it to the refinement narration. The die waiting to be rolled carries a floating, gently bobbing Click me. Under the report the refine button stands alone, with three pass pips; Reset sits bottom left and Compare bottom right once the pair has made a page, and the story card sits beside the button. Cards are kept inside the window. Reset is narrated too: "Back to plain."

## Demo and takeover

A first visit (no query, motion allowed) plays the story once with a cursor: read the plain page, click the first die (Cthulhu), click the second (Fast food), refine three times, compare the third pass with the plain page side by side, then step aside and point at a die: "Your turn". The demo drives the real state functions, so a visitor's pointer, tap, key or scroll stops it at once and keeps whatever is on screen. **Watch demo** replays it; it pauses with a hidden tab and stops when the width changes. Reduced motion never autoplays.

Reports change with a top-down wipe: the previous page clips away from its top edge while a vermilion line rides the boundary (560ms). First loads fade in once painted.

## Rehearsed

- Demo: autoplay to +3 and handover at desktop and 375 × 812; a real tap mid-demo stopped it with the state kept.
- In-app browser at 1280 × 800: each beat, a die swap during refinement, Reset with the dice exit, the prompt panel and Compare.
- 375 × 812: plain and dice steps; the dice sit side by side above the action and the report starts at 441px; no horizontal overflow.
- Reports keep their reading position across steps and scroll together in Compare.

## Limits

The browser pane ran at a 1.5 device-pixel ratio late in the session, so desktop stills were cropped and desktop layout was checked by measurement. It also advanced animations only when capturing, so mid-motion stills are unreliable. It painted newly loaded report frames late, so several stills show a blank frame that filled in on the next capture. No physical touch device or reduced-motion emulation was used; the dice entrance and exit are skipped under reduced motion and when the page is hidden.
