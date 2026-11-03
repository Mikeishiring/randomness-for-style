# Randomness for Style

An interactive experiment in visual originality: give the same website brief two unexpected ingredients, then see what repeated refinement changes.

[Try the live site](https://randomness-for-style.vercel.app/)

The brief is deliberately small: a one-page weekly website-performance report using fixed synthetic data. Six ingredients on each die produce 36 combinations, from Cthulhu × Fast food to Motorsport × Opera. Every combination has its original one-shot and three sequential refinements using the same prompt.

## Explore

- New visitors start with the plain one-shot. The first roll reveals two ingredients and their result.
- Click a die to roll, drag slowly to choose its upper face, or flick to throw. Arrow keys turn it; Escape cancels a drag.
- Choose One-shot, +1, +2 or +3, drag the refinement control, or press Play.
- Compare with the brief-only result, inspect the exact prompt and critique, browse all 36 combinations, or share a selected state.

These are saved results, not live model calls. The original and stronger refinement sequences are both preserved. The stronger sequence restarts from the same one-shot in a fresh context. Generated reports were not manually restyled; unchanged passes and rough edges remain visible. More refinement is not a quality score, and these examples do not establish that randomness always improves a design.

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

`npm test` checks report and prompt integrity, all 36 combinations and their stages, dice geometry, gestures, playback, disclosures and bundled JavaScript. `npm run check:security` scans tracked or staged files for credential patterns, local paths and forbidden account/configuration files. CI runs a checksum-pinned Gitleaks scan across the repository history, rebuilds the public files and checks for differences.

Deploy `site` as the Vercel project root; `site/vercel.json` serves `dist` without a build command. The existing public site is deployed separately; pushing this repository does not change its deployment connection.

Local credentials, service account state, working notes and deployment logs are excluded from version control. Some untouched generated reports overflow their own frames on small screens; the viewer adapts to mobile widths.
