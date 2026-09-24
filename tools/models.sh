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
for m in Lantern WaterBottle ToyCar AntiqueCamera SheenChair DiffuseTransmissionPlant GlassHurricaneCandleHolder ChairDamaskPurplegold LightsPunctualLamp GlassBrokenWindow SheenWoodLeatherSofa DiffuseTransmissionTeacup GlassVaseFlowers; do fetch "$m" "$K/$m/glTF-Binary/$m.glb"; done
fetch coffeeMug "$T/coffeeMug.glb"
fetch bedroom "$B/bitterli-rendering-resources/bedroom.glb"
fetch white-room "$B/bitterli-rendering-resources/white-room.glb"
fetch country-kitchen "$B/bitterli-rendering-resources/country-kitchen.glb"
fetch tape-recorder "$B/devices/sony-tc-510-2-tape-recorder.glb"
GT="npx --yes @gltf-transform/cli"
opt() { $GT optimize "$1" "assets/models/$2.glb" --compress quantize --simplify false --texture-compress webp --texture-size "$3"; }
simp() { $GT simplify "$1" "$2" --ratio "$3" --error 0.001; }
simp .cache/models/AntiqueCamera.glb .cache/models/AntiqueCamera.s.glb 0.5 && opt .cache/models/AntiqueCamera.s.glb antique_camera 512
opt .cache/models/Lantern.glb lantern 512
opt .cache/models/ChairDamaskPurplegold.glb chair_damask_purplegold 1024
opt .cache/models/LightsPunctualLamp.glb lights_punctual_lamp 512
opt .cache/models/GlassBrokenWindow.glb glass_broken_window 512
simp .cache/models/SheenChair.glb .cache/models/SheenChair.s.glb 0.3 && opt .cache/models/SheenChair.s.glb sheen_chair 512
simp .cache/models/SheenWoodLeatherSofa.glb .cache/models/Sofa.s.glb 0.3 && opt .cache/models/Sofa.s.glb leather_sofa 512
opt .cache/models/WaterBottle.glb water_bottle 512
opt .cache/models/GlassHurricaneCandleHolder.glb glass_hurricane_candle_holder 512
simp .cache/models/DiffuseTransmissionTeacup.glb .cache/models/Teacup.s.glb 0.15 && opt .cache/models/Teacup.s.glb teacup 256
simp .cache/models/GlassVaseFlowers.glb .cache/models/Vase.s.glb 0.5 && opt .cache/models/Vase.s.glb vase_flowers 256
opt .cache/models/coffeeMug.glb coffee_mug 512
simp .cache/models/ToyCar.glb .cache/models/ToyCar.s.glb 0.2 && opt .cache/models/ToyCar.s.glb toy_car 256
simp .cache/models/DiffuseTransmissionPlant.glb .cache/models/Plant.s.glb 0.3 && opt .cache/models/Plant.s.glb diffuse_transmission_plant 512
simp .cache/models/tape-recorder.glb .cache/models/tape-recorder.s.glb 0.4 && opt .cache/models/tape-recorder.s.glb tape_recorder 512
# props cut out of the room scenes (node name patterns, optional simplification ratio after the colon)
node tools/extract.mjs .cache/models/bedroom.glb .cache/extract/ "bed=^(Matress|Bedsheets_0001|WoodFurniture_000[67]|StainlessSmooth_0005)$:0.27" "blanket=^Blankets_0001$:0.15" "nightstand=^(WoodFurniture_0001|StainlessSmooth_0001)$" "bedside_lamp=^(LampMetal_0002|LampGlass_0001|LampEmitter_0002)$:0.4" "curtain=^(Curtains_0001|CurtainRod_0001)$" "rug=^Carpet_0001$" "boxes=^Boxes$" "book=^(BookCover|BookPages)$" "picture=^(PictureFrame|Picture|PictureBacking)$" "vase_small=^Vase_0001$" "plant_small=^DecoPlant$:0.4"
node tools/extract.mjs .cache/models/white-room.glb .cache/extract/ "radio=^(Radio|BushLogo):0.35" "cushion=^Cushion1_0001$" "books=^Books" "magazine=^Magazine"
node tools/extract.mjs .cache/models/country-kitchen.glb .cache/extract/ "cooker=^Cooker:0.09" "microwave=^Microwave:0.12" "cupboards=^CupboardUnits::-3,-1.5,-3,3" "worktops=^Worktops" "hood=^ExtractorHood"
for f in .cache/extract/*.glb; do n=$(basename "$f" .glb); case $n in bed|cupboards|curtain|nightstand|rug) size=1024;; *) size=512;; esac; opt "$f" "$n" $size; done
du -sh assets/models
