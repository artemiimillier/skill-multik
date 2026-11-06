#!/usr/bin/env python3
"""Мультяшный герой по фото: атлас 3×3 из 9 поз (neutral, palm, point, up, celebrate, think, surprise, shrug, wink).

  python3 scripts/make_character.py prompt [--bg green]                      промпт для ручного пути (ChatGPT / Gemini)
  python3 scripts/make_character.py generate photo.jpg --provider openai      план запроса: ничего не отправляет
  python3 scripts/make_character.py generate photo.jpg --provider openai --dry-run   что именно ушло бы (без сети)
  python3 scripts/make_character.py generate photo.jpg --provider openai --yes       реальный платный запрос

Провайдеры: openai (images/edits, модель gpt-image-1, ключ OPENAI_API_KEY) и gemini (generateContent с картинкой,
модель gemini-2.5-flash-image, ключ GEMINI_API_KEY). Ключи — в .env студии. Цены не зашиты: перед --yes открой
страницу тарифов провайдера и назови человеку цену. Результат — public/hero/atlas-raw.png, затем scripts/atlas_rig.py.
Фото — только своё или с согласия человека на фото.
"""
import argparse, base64, json, re, sys, urllib.error, urllib.request
from pathlib import Path

from _common import STUDIO, die, load_env, mime_of, multipart, redact, update_setup

POSES = ['neutral', 'palm', 'point', 'up', 'celebrate', 'think', 'surprise', 'shrug', 'wink']
PRICING = {'openai': 'https://openai.com/api/pricing', 'gemini': 'https://ai.google.dev/gemini-api/docs/pricing'}
BG = {'green': 'plain solid pure green (#00FF00)', 'white': 'plain solid white (#FFFFFF)', 'transparent': 'fully transparent'}


def hero_style():
    """Строка «Стиль героя: …» из style/STYLE.md студии — чтобы герой совпал с темой."""
    p = STUDIO / 'style' / 'STYLE.md'
    if p.exists():
        m = re.search(r'^Стиль героя:\s*(.+)$', p.read_text(encoding='utf-8'), re.M)
        if m:
            return m.group(1).strip()
    return 'flat 2D vector cartoon, thick clean dark outline, simple flat colors, soft cel shading, friendly big-eyed proportions'


def build_prompt(style, bg):
    poses = (
        '1 neutral — relaxed, arms down, light smile; '
        '2 palm — explaining, one open palm raised to the side at chest height; '
        '3 point — arm extended, index finger pointing to the LEFT edge of the image; '
        '4 up — index finger raised up next to the face, "important idea"; '
        '5 celebrate — both arms up, joyful, eyes closed in happiness; '
        '6 think — hand on the chin, eyes looking up, thoughtful; '
        '7 surprise — eyes wide, mouth open in an "O", both hands raised; '
        '8 shrug — palms up, shoulders raised, "no idea"; '
        '9 wink — winking, thumbs up'
    )
    return (
        'Create a character sheet of ONE cartoon character based on the person in the attached photo. '
        'Keep the recognizable features (face shape, hairstyle, facial hair, glasses, skin tone, typical clothing) '
        f'but redraw them in this style: {style}. '
        'Layout: exactly a 3x3 grid of nine equal cells, the same character in every cell, same scale and same outfit, '
        'framed from the waist up, facing the viewer, centered in the cell with empty margin around. '
        f'Background: {BG[bg]} across the whole image, no shadows on the background, no text, no numbers, no borders, no grid lines. '
        'Do not use the background color anywhere on the character. '
        f'Poses in reading order (left to right, top to bottom): {poses}. '
        'Mouth closed in all poses except surprise. Same lighting and colors in all nine cells.'
    )


def call_openai(key, photo, prompt, model, size, dry):
    url = 'https://api.openai.com/v1/images/edits'
    fields = {'model': model, 'prompt': prompt, 'size': size, 'n': '1', 'background': 'transparent', 'quality': 'high'}
    data = Path(photo).read_bytes()
    if dry:
        print(json.dumps({'POST': url, 'headers': {'Authorization': 'Bearer ***'}, 'fields': fields, 'files': {'image': f'{photo} ({len(data)} байт, {mime_of(photo)})'}}, ensure_ascii=False, indent=1))
        return None
    body, ctype = multipart(fields, [('image', Path(photo).name, data, mime_of(photo))])
    req = urllib.request.Request(url, data=body, headers={'Authorization': f'Bearer {key}', 'Content-Type': ctype})
    with urllib.request.urlopen(req, timeout=600) as r:
        res = json.loads(r.read())
    return base64.b64decode(res['data'][0]['b64_json'])


def call_gemini(key, photo, prompt, model, dry):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
    data = Path(photo).read_bytes()
    payload = {'contents': [{'parts': [{'text': prompt}, {'inline_data': {'mime_type': mime_of(photo), 'data': '<base64>'}}]}], 'generationConfig': {'responseModalities': ['IMAGE', 'TEXT']}}
    if dry:
        print(json.dumps({'POST': url, 'headers': {'x-goog-api-key': '***'}, 'json': payload, 'image': f'{photo} ({len(data)} байт)'}, ensure_ascii=False, indent=1))
        return None
    payload['contents'][0]['parts'][1]['inline_data']['data'] = base64.b64encode(data).decode()
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=600) as r:
        res = json.loads(r.read())
    for part in res.get('candidates', [{}])[0].get('content', {}).get('parts', []):
        inline = part.get('inline_data') or part.get('inlineData')
        if inline and inline.get('data'):
            return base64.b64decode(inline['data'])
    die('Gemini не вернул картинку: ' + json.dumps(res, ensure_ascii=False)[:400])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('prompt')
    p.add_argument('--bg', choices=list(BG), default='green')
    p.add_argument('--style')
    g = sub.add_parser('generate')
    g.add_argument('photo')
    g.add_argument('--provider', choices=['openai', 'gemini'], required=True)
    g.add_argument('--model')
    g.add_argument('--size', default='1024x1536', help='openai: 1024x1536 (портрет, клетка ~341×512)')
    g.add_argument('--style')
    g.add_argument('-o', '--out', default=str(STUDIO / 'public' / 'hero' / 'atlas-raw.png'))
    g.add_argument('--dry-run', action='store_true', help='показать запрос, ничего не отправлять')
    g.add_argument('--yes', action='store_true', help='человек согласился с ценой — отправить')
    a = ap.parse_args()

    style = a.style or hero_style()
    if a.cmd == 'prompt':
        print(build_prompt(style, a.bg))
        return
    if not Path(a.photo).exists():
        die(f'нет файла {a.photo}')
    bg = 'transparent' if a.provider == 'openai' else 'green'
    prompt = build_prompt(style, bg)
    model = a.model or ('gpt-image-1' if a.provider == 'openai' else 'gemini-2.5-flash-image')
    env = load_env()
    kname = 'OPENAI_API_KEY' if a.provider == 'openai' else 'GEMINI_API_KEY'
    key = env.get(kname, '')
    if not a.yes and not a.dry_run:
        print(f'План: {a.provider} / {model}, фото {a.photo}, 1 изображение {a.size if a.provider == "openai" else ""}, фон {bg}.')
        print(f'Ключ {kname}: {"есть в .env" if key else "НЕТ — добавь в .env"}.')
        print(f'Цена — по тарифу: {PRICING[a.provider]}. Назови её человеку и после «ок» запусти с --yes.')
        return
    if a.dry_run:
        print(f'[dry-run] ключ {kname}: {"есть" if key else "нет"}; сеть не используется')
    elif not key:
        die(f'нет {kname} в .env студии')
    try:
        img = call_openai(key, a.photo, prompt, model, a.size, a.dry_run) if a.provider == 'openai' else call_gemini(key, a.photo, prompt, model, a.dry_run)
    except urllib.error.HTTPError as e:
        die(redact(f'{a.provider}: HTTP {e.code} {e.read()[:400]!r}', key))
    except urllib.error.URLError as e:
        die(redact(f'{a.provider}: сеть недоступна: {e.reason}', key))
    if img is None:
        return
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(img)
    update_setup(**{'hero.kind': 'atlas', 'hero.photo': str(Path(a.photo)), 'hero.atlas': str(out.relative_to(STUDIO)) if out.is_relative_to(STUDIO) else str(out)})
    print(f'{out}  ({len(img)} байт). Дальше: python3 scripts/atlas_rig.py {out} --install')


if __name__ == '__main__':
    main()
