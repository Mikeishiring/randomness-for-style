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

- **Watch demo**, in the bottom right corner beside Compare, plays the story with a cursor on the real controls. Any click, tap, key or scroll takes over from exactly where it is. A first visit waits for your own first roll.
- The page opens on the plain brief: the one-shot report made without ingredients. One die waits beside it with a tag, **Pick me up and throw me**, and above the page a headline says where things stand: "You asked AI for a report. It looks like everyone else's." with two empty slots under it, ▢ + ▢. One throw adds one ingredient. Throw the die (a click works too) and, when it strikes the page, the page changes and the headline becomes a recipe: "Same data + Motorsport + ⦙Disco⦙". Each ingredient is a token in its die's colour with the picture from the face that came up; the second stays dashed and names the face the second die is resting on. That die slides in beside the page at rest, with no name under it yet, tagged **Now throw me** on wide screens. Throw it and the token fills in with a new ingredient and the page changes again. A tag then says **Throw again** (above the first die on wide screens, between the two on narrow ones) until the next throw. After that, rolling either die changes the page.
- The page shows one version of each pair: the one saved as its best in `work/fixed-report/curation.json`, which is the last pass once in 108. A showcase pair shows its one-shot, the version it was chosen for. Before and Compare show the plain brief at that same pass, so the two are compared like with like. The passes themselves stay out of the way. **Show every pass**, in About the experiment, brings back the action, the step track and the keep question; the notes below about passes describe that mode.
- A visitor's first roll is guided in: it lands on one of six curated showcase pairs (see `work/fixed-report/CURATION.md`), where the one added sentence most clearly makes a distinct, readable page. Every roll after that is random. The results themselves are untouched; only that first draw is chosen.
- Every saved result used two ingredients, so there is no page for one ingredient alone. Between the two throws the page shown is the first ingredient paired with the face the second die happens to show, and the open gap says which; the second throw always lands on a different face, so the page changes. About the experiment says the pages are saved, not generated live, the Prompt panel shows the exact prompt behind the page on screen, and a link shared between the two throws opens on the plain page.
- Once both dice are thrown, the headline reads "Same data + A + B", set large, both ingredients as tokens. A token a throw adds drops in when its die strikes, not before. On narrow screens the tokens name the dice, so the small dice carry no second label. Tap the line to see the whole prompt, with the one sentence the dice added ("Combine A and B into a distinct visual identity.") marked. After a push the line gains a second sentence saying what was asked, in the opening words of the refinement prompt ("Then asked, once: …"); tapping it shows that prompt under the one-shot. Nothing floats beside the action.
- Click a die and it is thrown at the page: it flies to the nearest edge, strikes it in the air and bounces back to its tray as it comes to rest, so it never sits on what it changed. Beside the page that is the page's side; above it, on narrow screens, its top. Press and drag to pick a die up: it lifts off its tray, goes wherever the pointer goes and turns as it moves. Let go with a still hand and it drops where it is, with the face you held on top; flick it and it goes the way the hand went and as far as the hand was moving, a slow flick a short way and a hard one across the window, turning back at the window's edges. A flick toward the page always reaches it, strikes the edge and turns back. Let go without turning a new face up, or with a swipe too gentle to be a flick, and it is thrown at the page like a click, so a slip never does nothing. A die that stops away from its tray is fetched: a pointer fades in, presses on it, carries it home and lets go. Pressing a die that is still in the air does not stop it; the click re-throws it from where it is. Under the mouse a die leans and turns toward the pointer. Arrow keys turn it; Escape puts it back.
- The dice are simulated, not scripted: a bevelled cube with gravity, corner impacts and friction, re-thrown out of sight until a throw comes to rest flat on the chosen face. The tumble is worked out on the spot and the die's way across the screen rides on top of it: full speed in the air, slower after every landing, home again once it has stopped. Each die sits on a small felt coaster drawn in the die's own perspective; its shadow travels with it.
- The page changes where a die strikes it: a ring marks the spot on the edge, the page takes a small shove, and the new design wipes in from that edge. A die thrown clear of the page still changes it, when it first lands.
- Every throw is synthesized and varies: each die has its own material, landings rattle differently each time, the strike on the page knocks, the page change swishes, and dragging a die clicks as each face comes up. On phones that support it, contacts also vibrate. Nothing sounds before your first click; **Sound** turns it all off.
- **Critique and redo** (then **Again**) runs the same refinement prompt up to three times, one pass per click; nothing advances on a timer. The label says what happens: the model critiques its own page and redoes it. Each pass makes the page more distinct, not necessarily better. Right after a roll it waits as a quiet outline while the dice and the new page have the stage, and turns solid once everything has come to rest; it works either way. The button reaches up and touches the page, and the pass prints from the bottom up. **Reset** returns to the plain page.
- The step track under the action (No dice, Dice, +1, +2, +3) jumps to any step without losing your pair.
- The first time a roll's page lands it is left alone for a moment. Then the original is wiped in from the left and away again, once, and the handle rests at the edge with a **Before** tab. While the original shows, **Before** and **After** sit above the page, clear of both reports' headings. Only after that do the action, the step track, Compare and Reset arrive; doing anything else first brings them at once, and nothing waits on a clock. Both reports carry a small **Same data** lock badge: the figures never change, only the design around them. Throwing a die again returns to the single page, so it can strike it. On the single page the original sits under it: drag the round knob (a solid ink grip), tap it, or use the arrow keys to wipe it in from the left. Once both dice are in, the grip leans into the page now and then until it has been pulled once; a **Before** tag rides on the revealed side, and its position holds through rolls and pushes.
- Your first roll of a visit lands with a small burst of confetti and a chime.
- The page stays light while you play: the next refinement and the pair each die will roll to are loaded while the page is idle, the next throws are worked out the same way, and only a few report pages stay loaded at once.
- **Compare** toggles the side-by-side view. Its left side is the plain brief at the same pass, labelled **No dice**. Prompt, Newer model, Share and Sound are in the bar at the bottom of the page.
- A six-by-six map sits in the middle of the dock: rows are the first die's faces, columns the second's, one dot per pair. Every pair that has been on screen is filled in (kept between visits where the browser allows it) and the one on screen stands out. With a mouse a dot goes straight to its pair; anywhere else on the map, and any tap, opens the gallery, whose heading counts what has been found ("7 of 36 found"). Under that count one short paragraph says what the experiment is; About the experiment keeps the method.
- After the third push the flow ends on a choice: **Which would you keep?** takes the step track's place in the dock and lays out every version of the pair, from the plain one-shot to the third push. Until one is chosen nothing looks selected and the action waits as a quiet outline. Choosing one shows it and marks it kept. The question is then answered: what you kept, beside the pick saved for that pair and its reason ("You kept Dice. Our pick is +2: insect-pin bars."), and the action becomes **Roll a new pair**.
- Reports are shown whole: each frame takes its report's own height and the page scrolls through the full composition, so rhythm and whitespace can be judged. On wide screens the dice stay beside the report as it scrolls; the action and the step track stay docked at the bottom of the window. On phones the dice are big for the first throw, then fold into small chips with their names under them, and the line above the report is the only caption.
- One orange cue at a time: the action is the only orange element once it is in play; the step track, pointer and links speak in ink, and the step track is the only progress indicator.
- Compare with the no-ingredient result, inspect the exact prompt and critique, open **36 combinations** below the page to browse every pairing, or share a selected state.

These are saved results, not live model calls. The original and stronger refinement sequences are both preserved, and a **Newer model** switch shows a rerun of the whole experiment by a model one generation newer: identical prompts, its own one-shots and refinements, recorded nine days after the original. The stronger sequence restarts from the same one-shot in a fresh context. Generated reports were not manually restyled; unchanged passes and rough edges remain visible. The exact prompts and critiques are available so someone else can repeat the procedure, and the protocol files name the exact model behind each generation.

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
| `work/simple-fable/` | Newer-model rerun: identical prompts, its own saved reports, critiques and hashes |
| `work/prompt-study/` | Separate matched test of the two refinement prompts |
| `site/dist/` | Self-contained public HTML, with no runtime dependencies |

The protocol files document the generation method and its limitations. To repeat the experiment, use the supplied synthetic data and filled prompts, preserve every first result, and apply the identical refinement prompt sequentially three times. Store new runs separately rather than overwriting these records.

## Checks and deployment

`npm test` checks report and prompt integrity, all 36 combinations and their stages, dice geometry, gestures, the guided path, disclosures and bundled JavaScript. `npm run check:security` scans tracked or staged files for credential patterns, local paths and forbidden account/configuration files. CI runs a checksum-pinned Gitleaks scan across the repository history, rebuilds the public files and checks for differences.

Vercel's GitHub connection deploys from the repository root: the root `vercel.json` serves the committed `site/dist` without a build command, so every branch gets a preview and a push to the project's production branch publishes `site/dist` as it is committed. Deploying `site` as the project root works the same way through `site/vercel.json`.

Local credentials, service account state, working notes and deployment logs are excluded from version control. Some untouched generated reports overflow their own frames on small screens; the viewer adapts to mobile widths.
