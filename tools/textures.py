"""Generates the tileable PBR texture set for Ash Tree Lane (colour, normal, roughness), the labels and the pages.
Run from the repository root: python3 tools/textures.py [outdir]   (needs numpy and pillow)
Everything is seeded, so the same files come out every time."""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets/textures'
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1331)

def fbm(size, octaves=6, base=4, persistence=0.5, seed=0):
    """Tileable value-noise fbm in [0,1], via periodic random grids upsampled bilinearly."""
    r = np.random.default_rng(seed)
    out = np.zeros((size, size), dtype=np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        if n > size: break
        grid = r.random((n, n), dtype=np.float32)
        # bilinear periodic upsample
        y = (np.arange(size) * n / size)
        x = (np.arange(size) * n / size)
        y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int)
        fy = (y - y0)[:, None]; fx = (x - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        y1 = (y0 + 1) % n; x1 = (x0 + 1) % n
        a = grid[y0][:, x0]; b = grid[y0][:, x1]; c = grid[y1][:, x0]; d = grid[y1][:, x1]
        layer = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
        out += layer * amp; total += amp; amp *= persistence
    return out / total

def grain(size, seed, amount=1.0):
    r = np.random.default_rng(seed)
    return r.random((size, size), dtype=np.float32) * amount

def normal_from_height(h, strength=2.0):
    """Sobel normal map from a tileable height field (0..1)."""
    hx = np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)
    hy = np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)
    nx = -hx * strength; ny = -hy * strength; nz = np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    n = np.stack([nx / l, ny / l, nz / l], axis=-1)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)

def save(name, arr, quality=88):
    img = Image.fromarray(arr)
    path = os.path.join(OUT, name)
    if name.endswith('.png'): img.save(path, optimize=True)
    else: img.save(path, quality=quality, subsampling=0 if 'normal' in name else 2, optimize=True)
    print(name, img.size, os.path.getsize(path) // 1024, 'KB')

def rgb(base, mult):
    """base: (h,w) 0..1 lum; mult: rgb tuple 0..255 -> tinted image"""
    b = np.clip(base, 0, 1)[..., None]
    return (b * np.array(mult, dtype=np.float32)[None, None, :]).clip(0, 255).astype(np.uint8)

# ---------- plaster: the house walls and ceiling ----------
S = 1024
big = fbm(S, octaves=4, base=2, persistence=0.6, seed=11)        # mottling from old paint
fine = fbm(S, octaves=7, base=16, persistence=0.55, seed=12)     # trowel texture
g = grain(S, 13)
stains = fbm(S, octaves=3, base=3, persistence=0.7, seed=14)
lum = 0.80 + (big - 0.5) * 0.10 + (fine - 0.5) * 0.06 + (g - 0.5) * 0.05 - np.clip(stains - 0.62, 0, 1) * 0.35
col = np.stack([lum * 229, lum * 227, lum * 221], axis=-1).clip(0, 255).astype(np.uint8)
save('plaster_color.jpg', col)
height = fine * 0.55 + big * 0.35 + g * 0.10
save('plaster_normal.jpg', normal_from_height(height, 1.6), 90)
rough = (0.88 + (fine - 0.5) * 0.12 + (g - 0.5) * 0.05).clip(0, 1)
save('plaster_rough.jpg', (rough * 255).astype(np.uint8), 80)

# ---------- ash: the hallway. smooth, seamless, no mark of any tool ----------
big = fbm(S, octaves=3, base=2, persistence=0.65, seed=21)
mid = fbm(S, octaves=6, base=8, persistence=0.5, seed=22)
g = grain(S, 23)
lum = 0.58 + (big - 0.5) * 0.10 + (mid - 0.5) * 0.05 + (g - 0.5) * 0.04
col = np.stack([lum * 250, lum * 248, lum * 252], axis=-1).clip(0, 255).astype(np.uint8)
save('ash_color.jpg', col)
save('ash_normal.jpg', normal_from_height(big * 0.6 + mid * 0.3 + g * 0.1, 1.1), 90)
rough = (0.93 + (mid - 0.5) * 0.06).clip(0, 1)
save('ash_rough.jpg', (rough * 255).astype(np.uint8), 80)

# ---------- walnut: furniture, doors, frames ----------
S2 = 1024
r = np.random.default_rng(31)
y, x = np.mgrid[0:S2, 0:S2].astype(np.float32) / S2
warp = fbm(S2, octaves=4, base=2, persistence=0.6, seed=32)
rings = np.sin((x * 2 + warp * 0.55) * math.pi * 2 * 4)  # periodic in x (integer cycles), warped by noise
rings = (rings * 0.5 + 0.5) ** 1.6
fine = fbm(S2, octaves=7, base=32, persistence=0.5, seed=33)
lum = 0.30 + rings * 0.14 + (fine - 0.5) * 0.10 + (grain(S2, 34) - 0.5) * 0.04
col = np.stack([lum * 255, lum * 180, lum * 130], axis=-1).clip(0, 255).astype(np.uint8)
save('walnut_color.jpg', col)
save('walnut_normal.jpg', normal_from_height(rings * 0.25 + fine * 0.6 + grain(S2, 35) * 0.15, 1.2), 90)
rough = (0.55 + (rings - 0.5) * 0.12 + (fine - 0.5) * 0.1).clip(0, 1)
save('walnut_rough.jpg', (rough * 255).astype(np.uint8), 80)

# ---------- cardboard: the moving boxes ----------
S3 = 512
y, x = np.mgrid[0:S3, 0:S3].astype(np.float32) / S3
corr = (np.sin(y * math.pi * 2 * 64) * 0.5 + 0.5)
fine = fbm(S3, octaves=6, base=8, persistence=0.55, seed=41)
lum = 0.62 + (fine - 0.5) * 0.16 + (grain(S3, 42) - 0.5) * 0.06
col = np.stack([lum * 214, lum * 170, lum * 118], axis=-1).clip(0, 255).astype(np.uint8)
# packing tape across the middle, slightly translucent brown
tape = (np.abs(y - 0.5) < 0.055).astype(np.float32)[..., None]
col = (col * (1 - tape * 0.35) + tape * np.array([96, 62, 38], dtype=np.float32) * 0.35).astype(np.uint8)
save('cardboard_color.jpg', col)
save('cardboard_normal.jpg', normal_from_height(corr * 0.12 + fine * 0.5 + grain(S3, 43) * 0.1, 1.0), 88)

# ---------- linen: beds ----------
weave = ((np.sin(x * math.pi * 2 * 128) * np.sin(y * math.pi * 2 * 128)) * 0.5 + 0.5)
folds = fbm(S3, octaves=4, base=2, persistence=0.6, seed=51)
lum = 0.80 + (folds - 0.5) * 0.18 + (weave - 0.5) * 0.08 + (grain(S3, 52) - 0.5) * 0.03
col = np.stack([lum * 228, lum * 222, lum * 208], axis=-1).clip(0, 255).astype(np.uint8)
save('linen_color.jpg', col)
save('linen_normal.jpg', normal_from_height(folds * 0.7 + weave * 0.3, 1.4), 88)

# ---------- leather: the trunk ----------
cells = fbm(S3, octaves=6, base=24, persistence=0.55, seed=61)
scuff = fbm(S3, octaves=3, base=2, persistence=0.7, seed=62)
lum = 0.22 + (cells - 0.5) * 0.14 + (scuff - 0.5) * 0.10
col = np.stack([lum * 255, lum * 190, lum * 140], axis=-1).clip(0, 255).astype(np.uint8)
save('leather_color.jpg', col)
save('leather_normal.jpg', normal_from_height(cells * 0.8 + grain(S3, 63) * 0.2, 1.8), 88)
save('leather_rough.jpg', ((0.6 + (cells - 0.5) * 0.25).clip(0, 1) * 255).astype(np.uint8), 80)

# ---------- laminate: kitchen counters ----------
speck = grain(S3, 71)
soft = fbm(S3, octaves=5, base=4, persistence=0.5, seed=72)
lum = 0.74 + (soft - 0.5) * 0.06 + (speck > 0.985) * -0.35 + (speck < 0.01) * 0.12
col = np.stack([lum * 224, lum * 220, lum * 210], axis=-1).clip(0, 255).astype(np.uint8)
save('laminate_color.jpg', col)

# ---------- labels and papers (not tileable) ----------
FONT_MONO = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf'
FONT_MONO_B = '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf'
FONT_SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
FONT_SERIF_I = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'

def paper(w, h, tone=(240, 236, 226), seed=0):
    r = np.random.default_rng(seed)
    n = fbm(max(w, h), octaves=5, base=4, persistence=0.55, seed=seed)[:h, :w]
    lum = 0.94 + (n - 0.5) * 0.08 + (r.random((h, w)) - 0.5) * 0.04
    arr = np.stack([lum * tone[0], lum * tone[1], lum * tone[2]], axis=-1).clip(0, 255).astype(np.uint8)
    return Image.fromarray(arr).convert('RGB')

def scrawl(draw, x0, y0, w, lines, seed, color=(40, 38, 48), gap=22, amp=3.0):
    """Illegible handwriting: wobbly strokes in rows."""
    r = np.random.default_rng(seed)
    for i in range(lines):
        y = y0 + i * gap
        x = x0 + r.random() * 12
        end = x0 + w * (0.55 + r.random() * 0.45)
        pts = []
        while x < end:
            pts.append((x, y + math.sin(x * 0.35 + i) * amp + (r.random() - 0.5) * amp * 1.4))
            x += 2.5 + r.random() * 2.5
            if r.random() < 0.06:
                draw.line(pts, fill=color, width=2); pts = []; x += 8 + r.random() * 10
        if len(pts) > 1: draw.line(pts, fill=color, width=2)

def tape_label(text, name, w=512, h=192):
    img = paper(w, h, (236, 232, 218), seed=hash(text) % 1000)
    d = ImageDraw.Draw(img)
    d.rectangle([6, 6, w - 7, h - 7], outline=(150, 145, 130), width=2)
    for i in range(1, 4): d.line([(24, 46 * i + 8), (w - 24, 46 * i + 8)], fill=(190, 186, 172), width=1)
    f = ImageFont.truetype(FONT_MONO_B, 44 if len(text) < 14 else 34)
    d.text((28, 22), text, font=f, fill=(28, 26, 34))
    f2 = ImageFont.truetype(FONT_MONO, 20)
    d.text((28, h - 46), 'Hi8  ·  90 min  ·  SP', font=f2, fill=(90, 86, 80))
    img.save(os.path.join(OUT, name), quality=88); print(name)

tape_label('ASH TREE LANE 1', 'label_tape1.jpg')
tape_label('5 1/2', 'label_tape2.jpg')
tape_label('WHAT SOME HAVE THOUGHT', 'label_karen.jpg')
tape_label('HOLLOWAY - LAST', 'label_holloway.jpg')
tape_label('TOM - RELAY', 'label_tom.jpg')

def page(name, title, lines, seed, w=512, h=724, italic=False):
    img = paper(w, h, seed=seed)
    d = ImageDraw.Draw(img)
    if title:
        f = ImageFont.truetype(FONT_SERIF_I if italic else FONT_SERIF, 26)
        d.text((48, 40), title, font=f, fill=(30, 28, 36))
    scrawl(d, 48, 96, w - 96, lines, seed)
    # a coffee ring and a fold
    d.ellipse([w - 190, h - 210, w - 60, h - 80], outline=(196, 170, 130), width=3)
    d.line([(0, h * 0.52), (w, h * 0.50)], fill=(206, 200, 186), width=2)
    img.save(os.path.join(OUT, name), quality=86); print(name)

page('page_echo.jpg', 'On echoes', 24, 5)
page('page_tom.jpg', 'Tom, at the relay', 20, 6, italic=True)

def map_sheet(name, w=768, h=576):
    img = paper(w, h, (236, 232, 218), seed=9)
    d = ImageDraw.Draw(img)
    ink = (36, 34, 44)
    # the house, small, in the corner
    d.rectangle([60, 60, 200, 190], outline=ink, width=3)
    d.line([(60, 120), (200, 120)], fill=ink, width=2); d.line([(130, 60), (130, 120)], fill=ink, width=2)
    f = ImageFont.truetype(FONT_SERIF_I, 18); d.text((66, 196), 'the house (to scale?)', font=f, fill=ink)
    # the corridor, not to scale, running off the page
    d.line([(200, 150), (720, 150)], fill=ink, width=3); d.line([(200, 178), (720, 178)], fill=ink, width=3)
    r = np.random.default_rng(3)
    x = 260
    while x < 640:
        side = -1 if r.random() < .5 else 1
        y0 = 150 if side < 0 else 178
        d.line([(x, y0), (x, y0 + side * (30 + r.random() * 60))], fill=ink, width=2)
        d.line([(x + 22, y0), (x + 22, y0 + side * (30 + r.random() * 60))], fill=ink, width=2)
        x += 60 + r.random() * 60
    d.text((300, 110), 'hallway   (>200 ft on day 2, 480 on day 3, ???)', font=f, fill=ink)
    # the great hall and the stairs
    d.ellipse([560, 300, 740, 520], outline=ink, width=3)
    d.text((588, 420), 'the Hall', font=f, fill=ink)
    d.arc([620, 380, 690, 450], 0, 300, fill=ink, width=3); d.text((630, 456), 'stairs', font=f, fill=ink)
    d.line([(720, 178), (720, 300)], fill=ink, width=2)
    f2 = ImageFont.truetype(FONT_SERIF, 22)
    d.text((60, 480), 'Exploration #3. Stopped here. Depth of stair: no bottom found.', font=f2, fill=(140, 30, 30))
    scrawl(d, 60, 250, 380, 7, 12, gap=26)
    img.save(os.path.join(OUT, name), quality=86); print(name)

map_sheet('map.jpg')

def tag(name, text, w=384, h=192):
    img = paper(w, h, (230, 228, 220), seed=17)
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, w - 5, h - 5], outline=(110, 108, 100), width=2)
    d.ellipse([16, h // 2 - 10, 36, h // 2 + 10], outline=(110, 108, 100), width=2)
    f = ImageFont.truetype(FONT_MONO, 19)
    for i, t in enumerate(text.split('\n')): d.text((50, 24 + i * 32), t, font=f, fill=(28, 26, 34))
    img.save(os.path.join(OUT, name), quality=86); print(name)

tag('tag_sample.jpg', 'SAMPLE 3 / NE wall / 40 ft\nW. Reston, UVA\nfor dating. DO NOT OPEN')
tag('tag_photo.jpg', 'K.  1989\n\n(keep this one)')

# ---------- screen: the television, off ----------
scr = np.zeros((256, 256, 3), dtype=np.uint8); scr[..., :] = (14, 14, 18)
save('screen_off.png', scr)
