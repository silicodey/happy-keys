# Keystreet

**A portfolio you explore like a miniature world.** Your projects glow on the keys of a 3D mechanical keyboard, and a small street runs through the middle of the board, with lamps, cafés and people. Visitors drag to look around, press a key on their own keyboard (or click it), and that project opens.

**[Open the studio →](https://silicodey.github.io/happy-keys/)**  ·  Examples: [Kyoto](https://silicodey.github.io/happy-keys/examples/mara-kyoto.html) · [Santorini](https://silicodey.github.io/happy-keys/examples/mara-santorini.html) · [Silicode](https://silicodey.github.io/happy-keys/examples/agon.html)

## Make your own

No code and no sign-up. Everything runs in your browser.

1. Open the [studio](https://silicodey.github.io/happy-keys/) and answer four short questions: who you are, which street runs through your keyboard, what your projects are, and how to publish.
2. The scene updates while you type. Your draft is saved in your browser.
3. Click **Download your site**. You get one file, `index.html`, with everything inside it.
4. Put that file on any static host:
   - **Vercel:** `npm i -g vercel`, then run `vercel --prod` in the folder that holds the file.
   - **Netlify:** drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
   - **GitHub Pages:** add the file to a repository, then turn on Pages under *Settings → Pages*.

**Recording a video of your site?** Add `#record` to the end of the address (for example `…/index.html#record`). That turns off the film grain, which video compression handles badly.

To change your site later, open the studio and use **Open a saved portfolio** to load the `index.html` you downloaded (or the `portfolio.json` project file).

### Streets

| Street | What you get |
| --- | --- |
| **Santorini** | Whitewashed terraces above the caldera, blue domes, a cruise ship crossing at dusk, church bells and the sea. |
| **Kyoto** | A temple stage over the city, a lantern lane climbing to a pagoda, falling maple leaves, a temple bell and wind chimes. |
| Brooklyn | Coming next. |
| Lofoten | Coming next. |

Each street is one complete place: the lane inside the board, the world around it, the light through the day, the keyboard's materials and its sound.

## Develop

You need Node 18 or newer.

```sh
npm install
npm run build      # writes index.html (the studio) and examples/*.html
npm test           # builds, then drives every example and the studio in a headless DOM
```

Open `index.html` straight from disk to try the studio locally; no server is needed.

The finished pages load three.js r128 from cdnjs and jsDelivr and the fonts from Google Fonts. Everything else (geometry, textures, sound) is generated in the browser, so there are no asset files.

### How it fits together

```
src/
  head.html        page shell: styles, HUD, project panel, welcome screen
  module.js        shared helpers and the keyboard layout
  loader.js        reads and validates the portfolio JSON, then boots the engine
  engine/          the 3D scene, in the order it is concatenated:
    01-renderer … 03-sky                  renderer, materials, time of day, sky
    04-santorini-world, 05-kyoto          each street's world and lane
    07-keyboard                           case, keys, the resin caps with their miniatures
    10-light-and-post, 11-sound           lighting, bloom, synthesised audio
    12-camera … 14-entrance-loop-teardown camera, input, main loop, the handle the studio drives
  studio.html      the guided builder; left out of exported sites
portfolios/        example portfolios, built into examples/
scripts/build.mjs  joins src/ into single HTML files
test/              jsdom harness with a stub WebGL renderer
```

A finished site is the viewer page with your portfolio written into
`<script type="application/json" id="portfolio">`. The studio is the same page with that tag left empty and `studio.html` added.

### The portfolio format

You never need to write this by hand, but it is plain JSON if you prefer to:

```json
{
  "version": 1,
  "owner": { "name": "Mara Lindqvist", "subtitle": "Landscape architecture in Malmö" },
  "intro": { "kicker": "Studio Lindqvist" },
  "scene": { "setting": "kyoto", "timeOfDay": "blue" },
  "projects": [
    {
      "name": "Harbour Steps",
      "key": "A",
      "category": "Public waterfront",
      "color": "#2F8F9D",
      "miniature": "ship",
      "url": "https://example.com",
      "lede": "A flight of stone steps that turned a car park into the town's living room.",
      "body": ["First paragraph.", "Second paragraph."],
      "facts": [["Client", "City harbour board"], ["Area", "1.4 hectares"]],
      "tags": ["Public space"]
    }
  ]
}
```

- `setting`: `santorini` or `kyoto`.
- `timeOfDay`: `afternoon`, `golden`, `blue` or `night`; visitors can still slide through the day.
- `miniature`: `house`, `vault`, `forge`, `orbit`, `ledger`, `blueprint`, `palette`, `telescope`, `compass`, `loom`, `ship`, `sapling`, `gears`, `scales` or `lantern`.
- Up to 12 projects. `key` is optional; leave it out and a free key is chosen from the project's name.
- Only `owner.name` and each project's `name` are required.

## Contributing

New streets and miniatures are the most welcome contributions; see [CONTRIBUTING.md](CONTRIBUTING.md). Please run `npm test` before opening a pull request.

## License

[MIT](LICENSE). Built on [three.js](https://threejs.org) (MIT).
