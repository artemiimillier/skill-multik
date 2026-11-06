#!/usr/bin/env python3
"""Лист «образец / наш»: кадр ролика-образца и наш кадр того же события рядом, по 6 пар на лист.

  python3 scripts/compare.py reference.mp4 out/my.mp4 pairs.json out/compare/my

pairs.json — одинаковые смысловые моменты, а не одинаковые секунды:
  [[1.25, 1.2, "хук"], [5.75, 5.2, "маршрут"], [10.5, 9.7, "шаг 1"]]
Нужны ffmpeg и Pillow (pip install pillow). Образец — только для сверки механики у себя локально, в ролик его кадры не идут.
"""
import json, subprocess, sys
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit('нужен Pillow: pip install pillow')

if len(sys.argv) != 5:
    sys.exit(__doc__)
ref, ours, pairs_path, prefix = sys.argv[1:]
pairs = json.loads(Path(pairs_path).read_text(encoding='utf-8'))
W, H, PER = 270, 480, 6


def grab(src, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-vf', f'scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    return Image.open(BytesIO(raw)).convert('RGB')


font = None
for f in ('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf'):
    try:
        font = ImageFont.truetype(f, 18)
        break
    except OSError:
        pass
font = font or ImageFont.load_default()
Path(prefix).parent.mkdir(parents=True, exist_ok=True)
for s in range(0, len(pairs), PER):
    chunk = pairs[s:s + PER]
    sheet = Image.new('RGB', (len(chunk) * (2 * W + 20), H + 34), '#f2efe8')
    dr = ImageDraw.Draw(sheet)
    for i, (rt, ot, label) in enumerate(chunk):
        x = i * (2 * W + 20)
        sheet.paste(grab(ref, rt), (x, 34))
        sheet.paste(grab(ours, ot), (x + W, 34))
        dr.text((x + 6, 8), f'{label}   образец {rt}s | наш {ot}s', fill='#111', font=font)
    out = f'{prefix}-{s // PER + 1:02d}.jpg'
    sheet.save(out, quality=86)
    print(out)
