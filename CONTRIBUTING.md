# Contributing

Thanks for helping. Two kinds of contribution matter most: **new streets** and **new miniatures**. Both are judged by eye, so please include a screenshot or a short screen recording in your pull request.

Before you open one, run:

```sh
npm install
npm test            # every example and the studio, headless
npm run test:shaders   # optional; needs glslangValidator installed
```

`npm test` fails if a project key stops opening its project, if hovering stops finding a key, or if any part of a street pokes up through the keyboard.

## Adding a street

A street is one complete place, so a new one touches four spots:

1. **`src/loader.js`**: add it to `SETTINGS_INFO` with a label, a one-line description and `ready: true`.
2. **`src/engine/02-settings.js`**: add its entry to `SETTING_DATA`, covering the light at four times of day, fog, the keyboard's palette, people's clothes and the sound profile.
3. **A new engine file** (for example `src/engine/05-brooklyn.js`) with three functions, following `05-kyoto.js`:
   - `worldX()`: everything outside the board. Returns `{zoom, applyTOD(P), animate()}`.
   - `platformX()`: the surface the keyboard rests on. Returns `{slab, mat, warmPos, applyTOD(), animate(dt)}`.
   - `streetX()`: the lane inside the board. It must stay inside the lane (`LANE_C`, `LANE_HW`) and below the key tops. Returns `{merged, applyTOD(), animate()}`.
4. **The dispatch lines** in `06-birds-and-world-choice.js` and `09-people.js`, plus the card art and text in `src/studio.html` (`ART` and `PLACE_TEXT`).

Keep the draw-call budget near the existing streets: merge static geometry by material (`mergeByMaterial`, `mergedAt`) and use instancing for anything repeated. The harness prints the budget.

## Adding a miniature

Miniatures are the small sculptures sealed inside a project's keycap.

1. Add a builder to the `ARCH` table in `src/engine/07-keyboard.js`. It receives the cap's group and draws into a space roughly one key wide. Use the shared `AM` materials so it picks up the project colour.
2. Add its name to `MINIATURES` in `src/loader.js`.
3. Add an icon, a name and a hint to `ICONS`, `MINI_NAMES` and `MINI_HINT` in `src/studio.html`.

## Style

Plain JavaScript, no build step beyond concatenation, no runtime dependencies beyond three.js r128. Write comments that explain why, not what.
