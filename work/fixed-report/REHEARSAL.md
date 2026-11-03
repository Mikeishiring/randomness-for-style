# Rehearsal: repeated refinement

This is the working, user-paced experiment. Stage Show Demo's choreography and panel-annotation examples informed the fixed control footprint, changing text, persistent selection marker and contextual hint. Stage Show's working-interface rules govern the implementation. No simulated cursor or timed playback was added.

## Story

Brief only → roll two ingredients → ingredient one-shot → three refinements. The first refinement action says “Lean into it · +1”; the next two say “Again, same prompt · +2 / +3.” The current step and next action remain distinct. The final result holds until the visitor acts.

The report remains the focal object. The sidebar supplies the inputs and one next action. Exact prompts, comparison and hints remain accessible; the saved examples and prompts were not edited.

## Rehearsed

- In-app browser at 1280 × 720 and 390 × 844: opening, dice result, all three refinements and held finale. Settled screenshots saved locally for each beat.
- 320 × 760 and 820 × 760: longest ingredient names, longest action label, step-marker placement and no viewer horizontal overflow.
- Keyboard activation and Escape dismissal; rapid jumps between stages; return to the brief and back; resize between phone and desktop.
- Desktop action height stays 48px; phone action height stays 44px. The hint holds a 124px footprint. Desktop report top remains 24px throughout the sequence.
- The marker uses measured button bounds, including fractional widths. Its transition can retarget; label motion only runs when that text changes. Reduced-motion and hidden-document paths cancel presentation motion.

## Findings resolved

- “Refine again” hid the repeated-input idea: the button now names the same prompt and the next pass number.
- The selection underline jumped between buttons: one persistent marker now moves between them.
- Action labels changed abruptly: changed spans settle within the same button footprint; repeated words stay still.
- A long ingredient name wrapped its last letter onto a separate desktop line: adjusted label size and horizontal inset.
- Hint size varied with its copy: its minimum height now holds the longest current message without shifting the report.

## Limits

Browser screenshots and direct interaction were used, not a Stage-kit film or frame-by-frame gate. No physical touch device or browser reduced-motion emulation was used; motion guards and existing reduced-motion paths are covered by source and automated checks. Some untouched generated reports overflow inside their own narrow frames. These are preserved experimental outputs, not viewer layout regressions.
