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

- Textures: photographed PBR materials from ambientCG and Poly Haven (worn floorboards with normal, roughness and occlusion maps, mahogany for the doors and furniture, plaster for the walls, a smooth gray concrete for the hallway, linen, leather, forest ground for the yard), brick from the three.js examples, and a few generated ones (cardboard, laminate) from `tools/textures.py`, which also renders the tape labels, Zampanò's pages, Reston's map and the tags.
- Models: a leather sofa, an armchair, a floor lamp, plants, an antique camera on its tripod, a bed with its blanket, nightstands and bedside lamps, curtains, a rug, books, a magazine, a cushion, a picture frame, a kitchen (cupboards, worktops, cooker, hood, microwave), a teacup, mugs, vases, a candle holder, a toy car, a damask chair, water bottles, a lantern, a Bush radio, a Sony reel-to-reel tape recorder and a broken window pane, from the Khronos glTF sample assets, the three.js examples, Benedikt Bitterli's rendering resources and Sketchfab, with textures resized and re-encoded as WebP and the heaviest meshes simplified (`tools/models.sh`, `tools/extract.mjs`). About 16 MB in all, streamed in after the house is already standing.
- Sounds: CC0 recordings for the footsteps on wood and on stone, the creaks, the doors, the page of the journal, the wind and the summer night outside the windows, and the old timbers of the house once it has moved. The drone, the growl and the burning pages are still synthesized.
- The night sky is a photographed panorama (stars, the Milky Way, the glow of a town over the tree line), seen through real window openings in the walls; its HDR twin lights everything that shines.

**Rendering.** The flashlight is a spotlight with a projected cookie, and it casts soft (VSM) shadows from every wall, every piece of furniture and every instanced tile of the labyrinth. It closes its iris when the wall is close, the way a camcorder does, and dips when the house growls. A post-processing chain adds bloom to the lamps, the lantern and the television, film grain, a vignette, a breath of chromatic aberration at the edges and, once the house has moved, the tracking tear of a worn tape: the Hi8 look. The camera is held in a hand, not on a tripod. Dust drifts in the beam; your breath shows in the cold of the hallway. The hallway's gray uses world-space texture coordinates, so its tiles have no seams, and the labyrinth is built in chunks so that what is behind you is not drawn. The shadow map is redrawn only when the camera has moved, the bloom runs at half resolution, the far plane sits just behind the fog, and the textures and props are shared and decimated to what the light can show. The pixel ratio follows the frame rate (bloom off first, then fewer pixels, then a smaller shadow map), and a **Detail** button in the corner does the same by hand; touch devices start low.

**The rest is still built in code:**

- The house is a list of walls with door and window gaps; walls pivot at their base so the house can lean later.
- The hallway is a tile maze generated from a seed: a corridor 70 m long with rooms off it, then a Great Hall 60 m across. When the house "moves", it is regenerated shorter around the same staircase.
- The staircase is a helix. Walking on it means moving along a rail; only the 140 steps nearest to you exist at any moment.
- Sound is Web Audio: the recordings above, brown noise through filters for the drone and the growl, high-passed noise for the burning pages, and a convolution reverb whose room gets longer the deeper you go. The staircase is a helix of wedge-shaped steps walked freely around its column; the well in the Hall floor is a real hole.
- The last exploration is not 3D at all: a page of paper in the DOM, burned with a CSS mask.

**The text** was written for this site. The plot follows the novel; the plot summary was checked against several public sources and where they disagreed or fell silent, the site stays vague rather than guessing. The chapter divisions are this retelling's own, and a few small details (a name on a tape, what a cache contained, what was written on a map) are invented.

**Accessibility.** Everything can be played from the keyboard. The journal is plain HTML and works with a screen reader; the house does not, which is why *or just read* exists. `prefers-reduced-motion` turns off the head bob, the flicker, the shaking and most of the grain.

**Testing.** `node check.mjs` verifies the things that break silently when the text is edited: note numbers in order, every reference has its note, the cipher still spells its sentence, every page is in the journal's order, every texture and model the script asks for exists, and no em dashes anywhere. `node tools/walk.mjs` plays the whole walk (every room, the hallway, the Hall, the stairs, the torn house, the last pages, the ending) in headless Chromium and screenshots each scene; `node tools/resume.mjs` opens the house with saved progress at every stage of the story and checks that it comes back as it was.

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
tools/extract.mjs   cuts named props out of whole-room glTF scenes
assets/CREDITS.md   every asset, its author, source and licence
tools/walk.mjs      the headless walkthrough (playwright-core)
tools/resume.mjs    reopens a saved house at every stage of the story
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

**Assets.** Everything below is CC0, CC BY or MIT; the CC BY credits are also in the site's colophon.

- Textures: WoodFloor041, Wood027, Plaster001, Concrete034, Fabric066 and Leather030 by [ambientCG](https://ambientcg.com) (CC0); forrest_ground_03 by Rob Tuytel, [Poly Haven](https://polyhaven.com) (CC0); the night panorama and HDRI dikhololo_night by Greg Zaal, Poly Haven (CC0); brick from the three.js examples (MIT). Cardboard, laminate, the labels, pages and tags were generated for this site and are MIT with the code.
- Models from the [Khronos glTF sample assets](https://github.com/KhronosGroup/glTF-Sample-Assets): Lantern, WaterBottle and ToyCar (CC0, Microsoft); SheenChair (CC0, Eric Chadwick, Wayfair); AntiqueCamera (CC0, UX3D); DiffuseTransmissionTeacup (CC0, Poly Haven); GlassVaseFlowers (CC0, Eric Chadwick and Rico Cilliers); ChairDamaskPurplegold, GlassHurricaneCandleHolder and GlassBrokenWindow (CC BY 4.0, Eric Chadwick, Wayfair); LightsPunctualLamp (CC BY 4.0, Teresa Gonzalez Viegas, Darmstadt Graphics Group); DiffuseTransmissionPlant (CC BY 4.0, Darmstadt Graphics Group, over a CC0 plant by Rico Cilliers); SheenWoodLeatherSofa (CC BY 4.0, Darmstadt Graphics Group, over a CC0 sofa by Fran Calvente, Poly Haven). The coffee mug is from the three.js examples (MIT).
- Props cut out of [Benedikt Bitterli's rendering resources](https://benedikt-bitterli.me/resources/): the bed, blanket, nightstands, bedside lamps, curtains, rug, boxes, book, picture frame, small vase and small plant from *Bedroom* by SlykDrako (CC0); the radio, books, magazine and cushion from *The White Room* and the cupboards, worktops, cooker, hood and microwave from *Country Kitchen*, both by Jay-Artist (CC BY 3.0). The Sony TC-510-2 tape recorder is by Ilgis "Dolgov" Fatykhov on Sketchfab (CC BY 4.0).
- Sounds: footsteps, creaks, doors and the page from [Kenney](https://kenney.nl) (CC0); the wind by felix.blume and the timbers by Falcet, both on freesound (CC0); the summer night by Lisa Redfern, SoundBible (public domain).

---

### En français

*Ash Tree Lane* est un hommage non officiel à *La Maison des feuilles* de Mark Z. Danielewski (traduction française de Claro, Denoël). Au lieu de lire l'histoire, on la parcourt : une maison en 3D à la première personne, où chaque objet trouvé débloque un chapitre du carnet, et où la maison réagit à ce qu'on lit. Le texte est une réécriture, jamais le texte du roman. Tout est fait en HTML, CSS et JavaScript, avec three.js pour la maison : matériaux PBR photographiés et modèles glTF (lit, cuisine, canapé, radio, magnétophone), sons enregistrés, ombres portées par la lampe torche, grain et bloom d'un caméscope Hi8, ciel étoilé aux fenêtres, sons synthétisés, labyrinthe généré. Seize chapitres, trente-trois notes, les lettres, les pièces à conviction et un index. Le site est en anglais parce qu'il est destiné à l'auteur.
