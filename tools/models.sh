#!/usr/bin/env sh
# Fetches the glTF models the house uses and optimizes them for the web: textures resized to 1K or 512, re-encoded as
# WebP, geometry quantized, the two heaviest meshes simplified. Needs node and npx (@gltf-transform/cli is fetched on demand).
# Run from the repository root: sh tools/models.sh
set -e
K=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models
T=https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/models/gltf
mkdir -p .cache/models assets/models
fetch() { [ -f ".cache/models/$1.glb" ] || curl -sSL -o ".cache/models/$1.glb" "$2"; }
for m in Lantern BoomBox WaterBottle ToyCar AntiqueCamera SheenChair GlamVelvetSofa DiffuseTransmissionPlant GlassHurricaneCandleHolder ChairDamaskPurplegold LightsPunctualLamp; do fetch "$m" "$K/$m/glTF-Binary/$m.glb"; done
fetch coffeeMug "$T/coffeeMug.glb"
opt() { npx --yes @gltf-transform/cli optimize ".cache/models/$1.glb" "assets/models/$2.glb" --compress quantize --simplify false --texture-compress webp --texture-size "$3"; }
opt AntiqueCamera antique_camera 1024
opt BoomBox boom_box 1024
opt Lantern lantern 1024
opt SheenChair sheen_chair 1024
opt GlamVelvetSofa glam_velvet_sofa 1024
opt DiffuseTransmissionPlant diffuse_transmission_plant 1024
opt ChairDamaskPurplegold chair_damask_purplegold 1024
opt LightsPunctualLamp lights_punctual_lamp 1024
opt WaterBottle water_bottle 512
opt GlassHurricaneCandleHolder glass_hurricane_candle_holder 512
opt coffeeMug coffee_mug 512
npx --yes @gltf-transform/cli simplify .cache/models/ToyCar.glb .cache/models/ToyCar.simplified.glb --ratio 0.35 --error 0.002
npx --yes @gltf-transform/cli optimize .cache/models/ToyCar.simplified.glb assets/models/toy_car.glb --compress quantize --simplify false --texture-compress webp --texture-size 512
du -sh assets/models
