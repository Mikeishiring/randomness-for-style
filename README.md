# Randomness for Style

A playable experiment in how randomness can help you avoid AI slop—the familiar patterns we recognize in AI-generated design. Combine two unexpected ingredients, then refine the result while keeping the brief fixed.

[Try the live site](https://randomness-for-style.vercel.app/)

## Why this exists

The starting idea is that some of what gets called “AI slop” is familiarity: we learn to recognize the same layouts, typography and visual habits appearing repeatedly. AI may raise the baseline quality of design while also making its defaults easier to spot.

This project explores whether a little deliberate randomness can interrupt those defaults. Two dice supply ingredients you might never choose together: Cthulhu × Fast food, Motorsport × Opera, or Deep-sea bioluminescence × Victorian insect collecting. Both dice are simply ingredients; they do not need to fit a rigid theme/style taxonomy.

The combination should shape the idea, language, typography, layout and presentation of information. Cthulhu × Fast food should feel different from Cthulhu × Luxury hotel. A different color or a themed mascot alone is a weak interpretation.

Originality is the aim, with simplicity as a constraint. Simple means easy to understand while keeping useful detail. It does not require a minimalist aesthetic, and adding more decoration is not the same as developing an identity.

## What the experiment makes visible

The brief stays deliberately small: a one-page weekly website-performance report using fixed synthetic data. It supplies the purpose and figures without prescribing a chart, layout or visual style. That gives the model room to make design decisions and makes those decisions easier to compare.

The journey has three parts:

1. **Plain one-shot:** see the result from the brief alone.
2. **Add two ingredients:** see another one-shot with an unexpected visual direction.
3. **Refine three times:** repeat the same harsh-critique prompt, asking the model to commit more strongly to the ingredients while keeping the report understandable.

Six ingredients on each die produce 36 combinations. The page is an educational toy: roll, choose, compare and inspect the prompts to judge what changed for yourself. The interesting question is whether the ingredients become part of the design's structure, and whether further passes develop that idea or merely add noise.

These examples explore a hypothesis; they do not prove that randomness always makes work more original or that each refinement is better. Distinctiveness, clarity and quality can move in different directions.

## A related idea: build a reusable sense of style

An earlier idea behind the project was to collect a handful of references, analyze them repeatedly, and turn the observations into a reusable design skill. Try a fresh one-shot with that skill, feed the critique back into the skill, then try again. The intention is to spend more effort learning a preferred style upfront and need fewer corrections later.

The recorded reports here use no personal design skills or supplied visual references. This keeps the current experiment focused on the brief, the two ingredients and the refinement prompt. The reference-to-skill loop is a separate direction to explore.

## Explore

- A first visit plays the story once with a demo cursor on the real controls. Any click, tap, key or scroll takes over from exactly where it is; **Watch demo** replays it.
- The page opens on the plain one-shot: the report everyone gets from one prompt. The first die waits beside it saying **Click me**. Roll it, and the second die arrives; roll that, and the page changes, because every saved result needs both ingredients. **Refine it** then appears.
- Click a die to roll it, drag slowly to choose its upper face, or flick to throw. Arrow keys turn it; Escape cancels a drag.
- Each throw makes a short synthesized clatter timed to the die's landing and bounces, after your first click. **Sound** turns it off.
- **Refine it** runs the same refinement prompt up to three times, one pass per click; nothing advances on a timer. **Reset** returns to the plain page.
- The step track under the action (Plain, Dice, +1, +2, +3) jumps to any step without losing your pair.
- **Compare** sits beside the action and shows both pages side by side at full width. Prompt, Share, Watch demo and Sound are in the bar at the bottom of the page.
- Compare with the brief-only result, inspect the exact prompt and critique, browse all 36 combinations, or share a selected state.

These are saved results, not live model calls. The original and stronger refinement sequences are both preserved. The stronger sequence restarts from the same one-shot in a fresh context. Generated reports were not manually restyled; unchanged passes and rough edges remain visible. The exact prompts and critiques are available so someone else can repeat the procedure.

## Run locally

Node.js 24 or later. No dependencies, API keys or model access are needed to build or use the recorded experiment.

```sh
npm run build
npm test
python -m http.server 8000 --directory site/dist
```

Open `http://localhost:8000`. Any static web server can serve the two files in `site/dist`.

## Project structure

| Path | Purpose |
| --- | --- |
| `work/fixed-report/` | Viewer, 3D dice, gestures, refinement controls and interaction checks |
| `work/simple-astra/` | Original prompts, saved reports, critiques and artifact hashes |
| `work/strong-astra/` | Stronger refinement sequence and predecessor hashes |
| `work/prompt-study/` | Separate matched test of the two refinement prompts |
| `site/dist/` | Self-contained public HTML, with no runtime dependencies |

The protocol files document the generation method and its limitations. To repeat the experiment, use the supplied synthetic data and filled prompts, preserve every first result, and apply the identical refinement prompt sequentially three times. Store new runs separately rather than overwriting these records.

## Checks and deployment

`npm test` checks report and prompt integrity, all 36 combinations and their stages, dice geometry, gestures, the guided path, disclosures and bundled JavaScript. `npm run check:security` scans tracked or staged files for credential patterns, local paths and forbidden account/configuration files. CI runs a checksum-pinned Gitleaks scan across the repository history, rebuilds the public files and checks for differences.

Deploy `site` as the Vercel project root; `site/vercel.json` serves `dist` without a build command. The existing public site is deployed separately; pushing this repository does not change its deployment connection.

Local credentials, service account state, working notes and deployment logs are excluded from version control. Some untouched generated reports overflow their own frames on small screens; the viewer adapts to mobile widths.
