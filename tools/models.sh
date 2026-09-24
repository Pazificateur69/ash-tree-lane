#!/usr/bin/env sh
# Fetches the glTF models the house uses and optimizes them for the web: textures resized, re-encoded as WebP,
# geometry quantized, the heaviest meshes simplified. Props that live inside whole-room scenes (Benedikt Bitterli's
# rendering resources, re-exported as GLB in gkjohnson/3d-demo-data) are cut out by name with tools/extract.mjs.
# Needs node and npx; @gltf-transform/cli, @gltf-transform/core, @gltf-transform/functions, meshoptimizer and
# draco3dgltf are fetched on demand. Run from the repository root: sh tools/models.sh
set -e
K=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models
T=https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/models/gltf
B=https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models
mkdir -p .cache/models .cache/extract assets/models
fetch() { [ -f ".cache/models/$1.glb" ] || curl -sSL -o ".cache/models/$1.glb" "$2"; }
fetch coffeeMug "$T/coffeeMug.glb"
fetch bedroom "$B/bitterli-rendering-resources/bedroom.glb"
fetch white-room "$B/bitterli-rendering-resources/white-room.glb"
fetch country-kitchen "$B/bitterli-rendering-resources/country-kitchen.glb"
fetch tape-recorder "$B/devices/sony-tc-510-2-tape-recorder.glb"
GT="npx --yes @gltf-transform/cli"
opt() { $GT optimize "$1" "assets/models/$2.glb" --compress quantize --simplify false --texture-compress webp --texture-size "$3"; }
# decimated: optimize welds the mesh first, so its simplifier actually runs (the standalone simplify command skips unwelded meshes)
dec() { $GT optimize "$1" "assets/models/$2.glb" --compress quantize --simplify true --simplify-ratio "$3" --simplify-error 0.001 --texture-compress webp --texture-size "$4"; }
dec .cache/models/AntiqueCamera.glb antique_camera 0.4 512
dec .cache/models/Lantern.glb lantern 0.6 512
dec .cache/models/ChairDamaskPurplegold.glb chair_damask_purplegold 0.35 512
dec .cache/models/LightsPunctualLamp.glb lights_punctual_lamp 0.5 512
opt .cache/models/GlassBrokenWindow.glb glass_broken_window 512
dec .cache/models/SheenChair.glb sheen_chair 0.25 512
dec .cache/models/SheenWoodLeatherSofa.glb leather_sofa 0.22 512
dec .cache/models/WaterBottle.glb water_bottle 0.4 512
dec .cache/models/GlassHurricaneCandleHolder.glb glass_hurricane_candle_holder 0.5 512
dec .cache/models/DiffuseTransmissionTeacup.glb teacup 0.12 256
dec .cache/models/GlassVaseFlowers.glb vase_flowers 0.4 256
opt .cache/models/coffeeMug.glb coffee_mug 512
dec .cache/models/ToyCar.glb toy_car 0.1 256
dec .cache/models/tape-recorder.glb tape_recorder 0.3 512
# props cut out of the room scenes (node name patterns, optional simplification ratio after the colon)
node tools/extract.mjs .cache/models/bedroom.glb .cache/extract/ "bed=^(Matress|Bedsheets_0001|WoodFurniture_000[67]|StainlessSmooth_0005)$:0.45" "blanket=^Blankets_0001$:0.3" "nightstand=^(WoodFurniture_0001|StainlessSmooth_0001)$" "bedside_lamp=^(LampMetal_0002|LampGlass_0001|LampEmitter_0002)$" "curtain=^(Curtains_0001|CurtainRod_0001)$" "rug=^Carpet_0001$" "boxes=^Boxes$" "book=^(BookCover|BookPages)$" "picture=^(PictureFrame|Picture|PictureBacking)$" "vase_small=^Vase_0001$" "plant_small=^DecoPlant$"
node tools/extract.mjs .cache/models/white-room.glb .cache/extract/ "radio=^(Radio|BushLogo)" "cushion=^Cushion1_0001$" "books=^Books" "magazine=^Magazine"
node tools/extract.mjs .cache/models/country-kitchen.glb .cache/extract/ "cooker=^Cooker:0.25" "microwave=^Microwave:0.3" "cupboards=^CupboardUnits::-3,-1.5,-3,3" "worktops=^Worktops" "hood=^ExtractorHood"
for f in .cache/extract/*.glb; do n=$(basename "$f" .glb); size=512; ratio=1
  case $n in bed) size=1024; ratio=0.25;; cupboards|curtain|nightstand|rug) size=1024;; cooker) ratio=0.35;; radio) ratio=0.35;; microwave) ratio=0.4;; blanket) ratio=0.4;; vase_small) ratio=0.3;; plant_small) ratio=0.5;; bedside_lamp) size=256; ratio=0.4;; esac
  if [ "$ratio" = 1 ]; then opt "$f" "$n" $size; else dec "$f" "$n" $ratio $size; fi
done
du -sh assets/models
