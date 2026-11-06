#!/usr/bin/env python3
"""Атлас героя 3×3 → прозрачный atlas.png + rig.json для atlasHero(rig) + лист проверки.

  python3 scripts/atlas_rig.py public/hero/atlas-raw.png              разрезать, убрать фон, угадать глаза/рот
  python3 scripts/atlas_rig.py public/hero/atlas-raw.png --install    и подключить героя ко всем роликам (src/hero/current.ts)

Ячейки — в порядке чтения: neutral, palm, point, up, celebrate, think, surprise, shrug, wink (--poses меняет).
Фон: прозрачный берётся как есть; однотонный (зелёный, белый…) определяется по краям и вырезается с мягким краем.
Глаза, рот и цвет кожи скрипт только угадывает: открой rig-check.png, поправь "anchor" (точка между глазами),
"eyes", "mouth", "mouthW", "skin" в rig.json глазами. Координаты — пиксели атласа.
Работает на стандартной библиотеке (только PNG, медленнее); с Pillow быстрее и читает JPG/WebP.
"""
import argparse, json, struct, sys, zlib
from pathlib import Path

from _common import STUDIO, die, update_setup

POSES = ['neutral', 'palm', 'point', 'up', 'celebrate', 'think', 'surprise', 'shrug', 'wink']

try:
    from PIL import Image, ImageDraw  # noqa: F401
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False


# ── PNG без Pillow ──────────────────────────────────────────────
def decode_png(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        die('без Pillow читаю только PNG: pip install pillow')
    pos, idat, plte, trns = 8, [], None, None
    while pos < len(data):
        ln, typ = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + ln]
        pos += 12 + ln
        if typ == b'IHDR':
            w, h, depth, ctype, _, _, inter = struct.unpack('>IIBBBBB', body)
        elif typ == b'PLTE':
            plte = body
        elif typ == b'tRNS':
            trns = body
        elif typ == b'IDAT':
            idat.append(body)
        elif typ == b'IEND':
            break
    if depth != 8 or inter != 0 or ctype not in (0, 2, 3, 4, 6):
        die('этот PNG (глубина/чересстрочность) без Pillow не читаю: pip install pillow')
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(b''.join(idat))
    stride = w * ch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    i = 0
    for y in range(h):
        f = raw[i]; i += 1
        line = bytearray(raw[i:i + stride]); i += stride
        if f == 1:
            for x in range(ch, stride):
                line[x] = (line[x] + line[x - ch]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x - ch] if x >= ch else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - ch] if x >= ch else 0
                b = prev[x]
                c = prev[x - ch] if x >= ch else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    rgba = bytearray(w * h * 4)
    for k in range(w * h):
        if ctype == 6:
            rgba[k * 4:k * 4 + 4] = out[k * 4:k * 4 + 4]
        elif ctype == 2:
            rgba[k * 4:k * 4 + 3] = out[k * 3:k * 3 + 3]; rgba[k * 4 + 3] = 255
        elif ctype == 0:
            v = out[k]; rgba[k * 4:k * 4 + 4] = bytes((v, v, v, 255))
        elif ctype == 4:
            v = out[k * 2]; rgba[k * 4:k * 4 + 4] = bytes((v, v, v, out[k * 2 + 1]))
        else:
            j = out[k]
            rgba[k * 4:k * 4 + 3] = plte[j * 3:j * 3 + 3]
            rgba[k * 4 + 3] = trns[j] if trns and j < len(trns) else 255
    return w, h, rgba


def encode_png(w, h, rgba):
    raw = b''.join(b'\x00' + bytes(rgba[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, b):
        return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b'')


def load(path):
    if HAVE_PIL:
        from PIL import Image
        im = Image.open(path).convert('RGBA')
        return im.width, im.height, bytearray(im.tobytes())
    return decode_png(Path(path).read_bytes())


def save(path, w, h, rgba):
    if HAVE_PIL:
        from PIL import Image
        Image.frombytes('RGBA', (w, h), bytes(rgba)).save(path)
    else:
        Path(path).write_bytes(encode_png(w, h, rgba))


# ── фон → прозрачность ─────────────────────────────────────────
def key_background(w, h, px, tol, soft):
    n = w * h
    transparent = sum(1 for k in range(3, n * 4, 4 * 7) if px[k] < 250) / (n / 7)
    if transparent > 0.05:
        return 'alpha', None
    border = []
    for x in range(0, w, 4):
        border += [x, (h - 1) * w + x]
    for y in range(0, h, 4):
        border += [y * w, y * w + w - 1]
    cols = sorted((px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) for i in border)
    bg = tuple(sorted(c[j] for c in cols)[len(cols) // 2] for j in range(3))
    green = bg[1] > bg[0] + 40 and bg[1] > bg[2] + 40
    for k in range(n):
        r, g, b = px[k * 4], px[k * 4 + 1], px[k * 4 + 2]
        d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
        a = 0 if d <= tol else 255 if d >= tol + soft else int(255 * (d - tol) / soft)
        if green and a and d < tol + soft * 3 and g > max(r, b):
            px[k * 4 + 1] = max(r, b)  # убрать зелёную кайму
        px[k * 4 + 3] = min(px[k * 4 + 3], a)
    return 'color', '#%02x%02x%02x' % bg


def guess_pose(w, px, cell, thr=40):
    x0, y0, x1, y1 = cell
    rows, colsn = {}, {}
    for y in range(y0, y1):
        base = y * w
        cnt = 0
        for x in range(x0, x1):
            if px[(base + x) * 4 + 3] > thr:
                cnt += 1
                colsn[x] = colsn.get(x, 0) + 1
        if cnt >= 3:
            rows[y] = cnt
    xs = [x for x, c in colsn.items() if c >= 3]
    if not rows or not xs:
        return None
    top, bot, left, right = min(rows), max(rows), min(xs), max(xs)
    bh, bw = bot - top + 1, right - left + 1
    # голова: центр масс верхних 30% фигуры (вытянутая рука не сдвигает)
    sx = sn = 0
    for y in range(top, top + int(bh * 0.3)):
        for x in range(left, right + 1):
            if px[(y * w + x) * 4 + 3] > thr:
                sx += x; sn += 1
    hx = sx / sn if sn else (left + right) / 2
    ey = top + 0.22 * bh
    row = [x for x in range(left, right + 1) if px[(int(ey) * w + x) * 4 + 3] > thr]
    span = [x for x in row if abs(x - hx) < bw * 0.45]
    head_w = (max(span) - min(span)) if span else bw * 0.5
    my = top + 0.34 * bh
    sxp, syp = int(hx - head_w * 0.22), int(my - bh * 0.03)
    k = (syp * w + sxp) * 4
    skin = '#%02x%02x%02x' % (px[k], px[k + 1], px[k + 2])
    pad = 10
    box = [max(x0, left - pad), max(y0, top - pad), 0, 0]
    box[2] = min(x1, right + pad + 1) - box[0]
    box[3] = min(y1, bot + pad + 1) - box[1]
    return {
        'box': box,
        'anchor': [round(hx), round(ey)],
        'eyes': [[round(hx - head_w * 0.18), round(ey)], [round(hx + head_w * 0.18), round(ey)]],
        'mouth': [round(hx), round(my)],
        'mouthW': round(head_w * 0.22),
        'skin': skin,
        '_height': bh,
    }


def draw_check(w, h, px, poses):
    """Лист проверки: светлая подложка, рамки поз, крест — anchor, точки — глаза, полоса — рот."""
    out = bytearray(w * h * 4)
    for k in range(w * h):
        a = px[k * 4 + 3] / 255
        for j in range(3):
            out[k * 4 + j] = int(px[k * 4 + j] * a + 228 * (1 - a))
        out[k * 4 + 3] = 255
    def dot(x, y, c, r=3):
        for yy in range(max(0, y - r), min(h, y + r + 1)):
            for xx in range(max(0, x - r), min(w, x + r + 1)):
                out[(yy * w + xx) * 4:(yy * w + xx) * 4 + 3] = bytes(c)
    for name, p in poses.items():
        x, y, bw, bh = p['box']
        for t in range(bw):
            dot(x + t, y, (220, 40, 40), 1); dot(x + t, y + bh - 1, (220, 40, 40), 1)
        for t in range(bh):
            dot(x, y + t, (220, 40, 40), 1); dot(x + bw - 1, y + t, (220, 40, 40), 1)
        ax, ay = p['anchor']
        for t in range(-14, 15):
            dot(ax + t, ay, (35, 70, 255), 1); dot(ax, ay + t, (35, 70, 255), 1)
        for ex, ey in p['eyes']:
            dot(ex, ey, (0, 200, 220), 4)
        mx, my = p['mouth']
        for t in range(-p['mouthW'] // 2, p['mouthW'] // 2 + 1):
            dot(mx + t, my, (230, 0, 160), 2)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('image')
    ap.add_argument('--grid', default='3x3')
    ap.add_argument('--poses', default=','.join(POSES))
    ap.add_argument('--out-dir', default=str(STUDIO / 'public' / 'hero'))
    ap.add_argument('--tol', type=int, default=38, help='насколько цвет может отличаться от фона и всё ещё считаться фоном')
    ap.add_argument('--soft', type=int, default=36, help='ширина мягкого края')
    ap.add_argument('--install', action='store_true', help='подключить героя: переписать src/hero/current.ts')
    a = ap.parse_args()

    cols, rows = (int(v) for v in a.grid.lower().split('x'))
    names = a.poses.split(',')
    if len(names) != cols * rows:
        die(f'поз {len(names)}, а ячеек {cols * rows}')
    w, h, px = load(a.image)
    mode, bg = key_background(w, h, px, a.tol, a.soft)
    cw, ch = w // cols, h // rows
    poses = {}
    for i, name in enumerate(names):
        cx, cy = i % cols, i // cols
        p = guess_pose(w, px, (cx * cw, cy * ch, (cx + 1) * cw, (cy + 1) * ch))
        if p is None:
            print(f'! пустая ячейка {i + 1} ({name}) — проверь сетку', file=sys.stderr)
            continue
        poses[name] = p
    if not poses:
        die('не нашёл ни одной фигуры: фон не однотонный? попробуй --tol 60')
    heights = sorted(p.pop('_height') for p in poses.values())
    fit = round(800 / heights[len(heights) // 2], 4)
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    save(out / 'atlas.png', w, h, px)
    save(out / 'rig-check.png', w, h, draw_check(w, h, px, poses))
    try:
        rel = (out / 'atlas.png').resolve().relative_to((STUDIO / 'public').resolve()).as_posix()
    except ValueError:
        rel = 'hero/atlas.png'
        print('! out-dir не внутри public/ — путь в rig.json: hero/atlas.png', file=sys.stderr)
    rig = {'atlas': rel, 'width': w, 'height': h, 'fit': fit, 'poses': poses}
    (out / 'rig.json').write_text(json.dumps(rig, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps({'background': bg or 'прозрачный', 'mode': mode, 'poses': len(poses), 'fit': fit, 'atlas': str(out / 'atlas.png'), 'rig': str(out / 'rig.json'), 'check': str(out / 'rig-check.png')}, ensure_ascii=False))
    if a.install:
        rig_rel = Path('../../public') / Path(rel).parent / 'rig.json'
        (STUDIO / 'src' / 'hero' / 'current.ts').write_text(
            "// Герой роликов студии: атлас из public/hero (собран scripts/atlas_rig.py --install).\n"
            "// Вернуть встроенного Бипа: export const HERO = undefined.\n"
            f"import rig from '{rig_rel.as_posix()}';\n"
            "import {atlasHero, type AtlasRig} from './AtlasHero';\n"
            "import type {HeroRender} from './HeroSticker';\n\n"
            "export const HERO: HeroRender | undefined = atlasHero(rig as unknown as AtlasRig);\n", encoding='utf-8')
        update_setup(**{'hero.kind': 'atlas', 'hero.atlas': 'public/' + rel, 'hero.rig': 'public/' + (Path(rel).parent / 'rig.json').as_posix()})
        print('подключено: src/hero/current.ts → atlasHero(rig). Проверь: node scripts/stills.mjs Poses out/poses --frames 20')


if __name__ == '__main__':
    main()
