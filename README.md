# Ash Tree Lane

**An unofficial retelling of *House of Leaves* by Mark Z. Danielewski, as a house you walk through.**

Live: **https://pazificateur69.github.io/ash-tree-lane/**

You arrive at night in the empty house on Ash Tree Lane with a flashlight and a camcorder running. Whatever the Navidsons left is still inside: Hi8 tapes, a tape measure, a photograph face down, a bag of gray dust with a laboratory tag, a page in a blind man's hand, a cache of supplies torn open, a lantern still lit at the top of the stairs. Each thing you find adds its chapter to a journal, and the house answers what you read. A door appears where there was a wall. The living room grows a hallway that should not exist. At the end of it, a hall too large for your light, and a staircase going down.

This is a tribute made by a reader. It is not the book, it contains none of the book's text, and nothing here replaces reading it.

---

## What it is for

*House of Leaves* is a novel about a house that is larger on the inside than on the outside, told through three nested narrators and a typography that turns the page itself into a labyrinth: footnotes that open other footnotes, text that runs upside down or narrows to a single word, the word **house** printed in blue everywhere it appears.

The book already asks the reader to move through it physically, turning the volume around, following notes down into other notes. This site takes that one step further. Instead of reading about the hallway, you walk into it. Instead of being told the house grew, you measure it. The story is not delivered; it is found, object by object, and reassembled in the journal in whatever order you find it.

The site exists to say thank you to the book, and to try the question: what does *House of Leaves* look like when the medium can actually be larger on the inside?

## How to walk through it

Open the door on the title page. Then:

| | Desktop | Phone |
|---|---|---|
| Look | move the mouse (click once to capture it) | drag on the right half of the screen |
| Walk | `W A S D`, `Z Q S D` or the arrow keys, `Shift` to hurry | drag on the left half |
| Pick up / open | `E`, `Enter` or click, when something is named at the bottom | tap the label |
| Journal | `J` or the button top right | the button top right |
| Leave a room, close a page | `Esc` | the button |

A full walk takes twenty to forty minutes. Progress is kept in your own browser only (no account, no cookies, no tracking), so you can leave and come back; the house remembers what you found and keeps its doors open. If you would rather not play, **or just read** on the title page opens the journal complete.

Headphones are worth it. Every sound is synthesized in the browser: the growl, the footsteps that echo late in the hallway, the creak of a door that was not there, the pages burning.

## What happens, in order (light spoilers)

1. **The house.** Foyer, kitchen, living room, two bedrooms, the yard under the stars through the windows. A trunk that is not theirs holds the story of how the papers were found. Tapes, a tape measure, a photograph face down and a specimen bag hold the first chapters: the move, the quarter of an inch, the hallway, Karen, and what the laboratory made of the walls.
2. **A quarter of an inch.** Read the measurements and a door appears between the bedrooms. Behind it, a closet that was never there, and a tape labelled 5½.
3. **The hallway.** The living room's east wall opens onto ash-gray corridors, colder than the season, longer than the house is wide. Fishing line is tied off at the frame. Rooms off the corridor hold Zampanò's page on echoes and the explorers' cache.
4. **The Great Hall and the staircase.** Your light goes out into the hall and does not come back. Far off, at floor level, a light that is not yours: Tom's lantern, his chair, his recorder and his jokes at the lip of the well, next to a hand-drawn map that stops at the stairs. Going down, you find what the fourth exploration left behind.
5. **The house has moved.** Coming back up, the corridor is shorter than it was. The house leans, the floor has opened, the lamps are dead and the television is showing static. Tom's radio, Karen's tapes and the rig he built for the wounded are what is left.
6. **Exploration #5.** Through the doorway one last time, into a dark with no dimensions, with a book and something to light it with. Then a light that is not yours.
7. **Vermont**, and at the back of the journal, the letters, the exhibits and the index.

## The journal

The journal is the book side of the project: a retelling of the novel in new words, in the novel's structure. Sixteen chapters, an introduction, thirty-three notes, the Whalestoe letters, an appendix of exhibits and contrary evidence, and an index.

- **Three voices, four typefaces**, as in the book: Zampanò's study of *The Navidson Record* in Times, Johnny Truant's interruptions in Courier, the Editors in Bookman, and Pelafina's letters in Goudy.
- **house** is blue wherever it appears, in any language. The struck-through passages about the minotaur are red.
- **Thirty-three notes** open as sheets of paper stacked over the text. Some notes open other notes.
- The pages do what the book's pages do: echoes fade across the page, a list has a back you can turn, a passage is printed upside down, a column narrows as the expedition goes wrong, the text of chapter VIII tears apart as you scroll, a film is shown frame by frame.
- Pelafina's second letter carries a message in the first letters of its words. There is a button to read it, and you can also just look.
- The exhibits are all missing, and say so. The index gives heights in pixels instead of page numbers, and marks with DNE the things the house does not contain.
- Chapter II measures itself. So does the title page, and the difference grows a sixteenth of a pixel every time you come back.

## How it was made

**Plain web.** One HTML file, one stylesheet, one script. No framework, no bundler, no build step. [three.js](https://threejs.org/) (r170) and the handful of addons the house needs (the effect composer, bloom, the glTF loader) are vendored under `vendor/` and imported through an import map at the moment you open the door, so the title page and the journal work without them.

**Real assets, streamed in.** The house is built from photographic and physically based materials and from glTF models, all of them loaded from `assets/` while the loading bar fills:

- Textures: hardwood floorboards and brick with bump and roughness maps (from the three.js examples), and a set of tileable PBR materials made for this site with `tools/textures.py` (aged plaster, the seamless ash-gray of the hallway, walnut, cardboard, linen, leather, laminate), each with colour, normal and roughness maps. The tape labels, Zampanò's pages, Reston's map and tags are rendered images too.
- Models: a velvet sofa, an armchair, a floor lamp, a potted plant, an antique camera on its tripod, a coffee mug, a candle holder, a toy car, a damask chair, water bottles, a boom box and a lantern, from the Khronos glTF sample assets and the three.js examples, with textures resized to 1K and re-encoded as WebP (`tools/models.sh`). About 12 MB in all, loaded after the house is already standing.
- The night sky is a Milky Way cube map, seen through real window openings in the walls, and used as the environment map for everything that shines.

**Rendering.** The flashlight is a spotlight with a projected cookie, and it casts soft (VSM) shadows from every wall, every piece of furniture and every instanced tile of the labyrinth. It closes its iris when the wall is close, the way a camcorder does. A post-processing chain adds bloom to the lamps, the lantern and the television, film grain, a vignette and a breath of chromatic aberration at the edges: the Hi8 look. Dust drifts in the beam. The hallway's gray uses world-space texture coordinates, so its tiles have no seams. A **Detail** button in the corner drops the pixel ratio, the shadow map and the bloom for slower machines; touch devices start low.

**The rest is still built in code:**

- The house is a list of walls with door and window gaps; walls pivot at their base so the house can lean later.
- The hallway is a tile maze generated from a seed: a corridor 70 m long with rooms off it, then a Great Hall 60 m across. When the house "moves", it is regenerated shorter around the same staircase.
- The staircase is a helix. Walking on it means moving along a rail; only the 140 steps nearest to you exist at any moment.
- Sound is Web Audio: brown noise through filters for the drone and the growl, short filtered bursts for footsteps, a wobbling sawtooth for the creak, high-passed noise for the burning pages, wind at the windows while the house is still a house, and a convolution reverb whose room gets longer the deeper you go.
- The last exploration is not 3D at all: a page of paper in the DOM, burned with a CSS mask.

**The text** was written for this site. The plot follows the novel; the plot summary was checked against several public sources and where they disagreed or fell silent, the site stays vague rather than guessing. The chapter divisions are this retelling's own, and a few small details (a name on a tape, what a cache contained, what was written on a map) are invented.

**Accessibility.** Everything can be played from the keyboard. The journal is plain HTML and works with a screen reader; the house does not, which is why *or just read* exists. `prefers-reduced-motion` turns off the head bob, the flicker, the shaking and most of the grain.

**Testing.** `node check.mjs` verifies the things that break silently when the text is edited: note numbers in order, every reference has its note, the cipher still spells its sentence, every page is in the journal's order, every texture and model the script asks for exists, and no em dashes anywhere. `node tools/walk.mjs` plays the whole walk (every room, the hallway, the Hall, the stairs, the torn house, the last pages, the ending) in headless Chromium and screenshots each scene.

**Tools.** Written and built with the help of Claude (Anthropic), used as a coding and writing partner; every scene was checked by hand.

## Files

```
index.html          title page, the house's HUD, the journal, and the book itself in a <template>
style.css           paper typography for the journal, the HUD, the last pages
game.js             journal, three.js house, maze, staircase, sound, Exploration #5
check.mjs           structural checks (node check.mjs)
assets/textures/    PBR materials, labels, pages, the flashlight cookie
assets/models/      glTF models (optimized)
assets/sky/         the Milky Way cube map
vendor/three/       three.js r170 and the addons the house imports
tools/textures.py   regenerates the materials and labels (python3, numpy, pillow)
tools/models.sh     fetches and optimizes the models (gltf-transform)
tools/walk.mjs      the headless walkthrough (playwright-core)
og.jpg              link preview, a still from the living room
```

## Run it locally

Any static server will do; a plain `file://` open will not, because the script is loaded as a module.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Rights

*House of Leaves* © Mark Z. Danielewski (Pantheon Books, 2000). The characters, the events and the house belong to the book; this site reproduces none of its text and is not affiliated with the author or the publisher. It is non-commercial and will be taken down at the rights holder's request.

The code is released under the MIT license. The retelling's text is © its author; please do not republish it without asking.

**Assets.** three.js and its examples are MIT (the hardwood and brick textures, the coffee mug, the Milky Way cube map, which derives from the ESO / S. Brunier panorama, CC BY 4.0). From the [Khronos glTF sample assets](https://github.com/KhronosGroup/glTF-Sample-Assets): Lantern, BoomBox, WaterBottle, ToyCar and SheenChair (CC0, Microsoft and Khronos); AntiqueCamera (CC0, UX3D); GlamVelvetSofa, ChairDamaskPurplegold, LightsPunctualLamp, DiffuseTransmissionPlant and GlassHurricaneCandleHolder (CC BY 4.0, Wayfair and Khronos). The plaster, ash, walnut, cardboard, linen, leather and laminate materials, the labels and the pages were generated for this site and are MIT with the code.

---

### En français

*Ash Tree Lane* est un hommage non officiel à *La Maison des feuilles* de Mark Z. Danielewski (traduction française de Claro, Denoël). Au lieu de lire l'histoire, on la parcourt : une maison en 3D à la première personne, où chaque objet trouvé débloque un chapitre du carnet, et où la maison réagit à ce qu'on lit. Le texte est une réécriture, jamais le texte du roman. Tout est fait en HTML, CSS et JavaScript, avec three.js pour la maison : matériaux PBR et modèles glTF, ombres portées par la lampe torche, grain et bloom d'un caméscope Hi8, ciel étoilé aux fenêtres, sons synthétisés, labyrinthe généré. Seize chapitres, trente-trois notes, les lettres, les pièces à conviction et un index. Le site est en anglais parce qu'il est destiné à l'auteur.
