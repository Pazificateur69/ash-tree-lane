# Ash Tree Lane

**An unofficial retelling of *House of Leaves* by Mark Z. Danielewski, as a house you walk through.**

Live: **https://pazificateur69.github.io/ash-tree-lane/**

You arrive at night in the empty house on Ash Tree Lane with a flashlight. Whatever the Navidsons left is still inside: Hi8 tapes, a tape measure, a page in a blind man's hand, a cache of supplies torn open. Each thing you find adds its chapter to a journal, and the house answers what you read. A door appears where there was a wall. The living room grows a hallway that should not exist. At the end of it, a hall too large for your light, and a staircase going down.

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

1. **The house.** Foyer, kitchen, living room, two bedrooms. A trunk that is not theirs holds the story of how the papers were found. Tapes and a tape measure hold the first chapters.
2. **A quarter of an inch.** Read the measurements and a door appears between the bedrooms. Behind it, a closet that was never there, and a tape labelled 5½.
3. **The hallway.** The living room's east wall opens onto ash-gray corridors, colder than the season, longer than the house is wide. Fishing line is tied off at the frame. Rooms off the corridor hold Zampanò's page on echoes and the explorers' cache.
4. **The Great Hall and the staircase.** Your light goes out into the hall and does not come back. In the middle, a spiral staircase. Going down, you find what the fourth exploration left behind.
5. **The house has moved.** Coming back up, the corridor is shorter than it was. The house leans, the floor has opened, the lamps are dead. Tom's radio and Karen's tapes are what is left.
6. **Exploration #5.** Through the doorway one last time, into a dark with no dimensions, with a book and something to light it with. Then a light that is not yours.
7. **Vermont**, and at the back of the journal, the letters.

## The journal

The journal is the book side of the project: a retelling of the novel in new words, in the novel's structure.

- **Three voices, four typefaces**, as in the book: Zampanò's study of *The Navidson Record* in Times, Johnny Truant's interruptions in Courier, the Editors in Bookman, and Pelafina's letters in Goudy.
- **house** is blue wherever it appears, in any language. The struck-through passages about the minotaur are red.
- **Eighteen notes** open as sheets of paper stacked over the text. Some notes open other notes.
- The pages do what the book's pages do: echoes fade across the page, a list has a back you can turn, a passage is printed upside down, a column narrows as the expedition goes wrong, the text of chapter VIII tears apart as you scroll, a film is shown frame by frame.
- Pelafina's second letter carries a message in the first letters of its words. There is a button to read it, and you can also just look.
- Chapter II measures itself. So does the title page, and the difference grows a sixteenth of a pixel every time you come back.

## How it was made

**Plain web.** One HTML file, one stylesheet, one script. No framework, no bundler, no build step. The only dependency is [three.js](https://threejs.org/) (r170), fetched from a CDN at the moment you open the door, so the title page and the journal work without it.

**Everything is drawn or generated in code**, nothing is downloaded:

- Textures (wood planks, plaster, cardboard, ash-gray walls) are painted onto canvases at load time.
- The house is a list of walls with door gaps; furniture is boxes. Walls pivot at their base so the house can lean later.
- The hallway is a tile maze generated from a seed: a corridor 70 m long with rooms off it, then a Great Hall 60 m across. When the house "moves", it is regenerated shorter around the same staircase.
- The staircase is a helix. Walking on it means moving along a rail; only the 140 steps nearest to you exist at any moment.
- The flashlight is a spotlight on the camera, with a faint point light for what the beam scatters back. The rest is fog.
- Sound is Web Audio: brown noise through filters for the drone and the growl, short filtered bursts for footsteps (with two delayed copies in the hallway, so they echo), a wobbling sawtooth for the creak, high-passed noise for the burning pages.
- The last exploration is not 3D at all: a page of paper in the DOM, burned with a CSS mask.

**The text** was written for this site. The plot follows the novel; the plot summary was checked against several public sources and where they disagreed or fell silent, the site stays vague rather than guessing. The chapter divisions are this retelling's own, and a few small details (a name on a tape, what a cache contained) are invented.

**Accessibility.** Everything can be played from the keyboard. The journal is plain HTML and works with a screen reader; the house does not, which is why *or just read* exists. `prefers-reduced-motion` turns off the head bob, the flicker and the shaking.

**Testing.** `node check.mjs` verifies the things that break silently when the text is edited: note numbers in order, every reference has its note, the cipher still spells its sentence, every unlockable chapter has a page, and no em dashes anywhere. The whole walk (every door, every pickup, the stairs, the ending) is also played through in headless Chrome before a release.

**Tools.** Written and built with the help of Claude (Anthropic), used as a coding and writing partner; every scene was checked by hand.

## Files

```
index.html   title page, the house's HUD, the journal, and the book itself in a <template>
style.css    paper typography for the journal, the HUD, the last pages
game.js      journal, three.js house, maze, staircase, sound, Exploration #5
check.mjs    structural checks (node check.mjs)
og.png       link preview
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

---

### En français

*Ash Tree Lane* est un hommage non officiel à *La Maison des feuilles* de Mark Z. Danielewski (traduction française de Claro, Denoël). Au lieu de lire l'histoire, on la parcourt : une maison en 3D à la première personne, où chaque objet trouvé débloque un chapitre du carnet, et où la maison réagit à ce qu'on lit. Le texte est une réécriture, jamais le texte du roman. Tout est fait en HTML, CSS et JavaScript, avec three.js pour la maison, sans aucun fichier téléchargé : textures dessinées, sons synthétisés, labyrinthe généré. Le site est en anglais parce qu'il est destiné à l'auteur.
