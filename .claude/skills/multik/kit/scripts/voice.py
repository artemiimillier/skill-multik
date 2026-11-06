#!/usr/bin/env python3
"""Голос через ElevenLabs: клон по образцу и озвучка текста ролика одним запросом.

  python3 scripts/voice.py record                      как записать образец 1–3 минуты (команда под твою ОС)
  python3 scripts/voice.py clone sample.wav --name "Мой голос"            план, ничего не отправляет
  python3 scripts/voice.py clone sample.wav --name "Мой голос" --yes      создать клон → voice_id в setup.json
  python3 scripts/voice.py say films/my/voice.txt -o public/my/voice.mp3  план: символы, голос, модель
  python3 scripts/voice.py say films/my/voice.txt -o public/my/voice.mp3 --yes   озвучить и сохранить MP3
  --dry-run — показать запрос без сети.

Ключ ELEVENLABS_API_KEY — в .env студии. Мгновенный клон доступен не на всех тарифах: тариф и цену проверь на
elevenlabs.io/pricing, не угадывай. Клонируй только свой голос или голос человека, который явно согласился.
Исходный MP3 не перезаписывается: новый дубль — новое имя файла.
"""
import argparse, json, platform, sys, urllib.error, urllib.request
from pathlib import Path

from _common import STUDIO, die, load_env, mime_of, multipart, read_setup, redact, update_setup

API = 'https://api.elevenlabs.io/v1'


def post(url, key, body, ctype, accept='application/json'):
    req = urllib.request.Request(url, data=body, headers={'xi-api-key': key, 'Content-Type': ctype, 'Accept': accept})
    with urllib.request.urlopen(req, timeout=600) as r:
        return r.read()


def cmd_record():
    osn = platform.system()
    if osn == 'Darwin':
        cmd = 'ffmpeg -f avfoundation -i ":0" -t 120 -ac 1 -ar 44100 sample.wav'
        note = '":0" — первый микрофон; список: ffmpeg -f avfoundation -list_devices true -i ""'
    elif osn == 'Windows':
        cmd = 'ffmpeg -f dshow -i audio="Микрофон (...)" -t 120 -ac 1 -ar 44100 sample.wav'
        note = 'имя микрофона: ffmpeg -list_devices true -f dshow -i dummy'
    else:
        cmd = 'ffmpeg -f pulse -i default -t 120 -ac 1 -ar 44100 sample.wav'
        note = 'или -f alsa -i default'
    print('Образец для клона: 1–3 минуты чистой речи, тихая комната, микрофон в 15–20 см, без музыки и эха.')
    print('Говори так, как в роликах: живо, с разной интонацией. Можно просто диктофоном телефона.')
    print(f'Mac/ПК: {cmd}\n  ({note})')


def cmd_clone(a, key):
    files = [Path(f) for f in a.samples]
    for f in files:
        if not f.exists():
            die(f'нет файла {f}')
    size = sum(f.stat().st_size for f in files)
    if not a.yes and not a.dry_run:
        print(f'План: создать мгновенный клон «{a.name}» из {len(files)} файл(ов), {size / 1e6:.1f} МБ.')
        print(f'Ключ ELEVENLABS_API_KEY: {"есть" if key else "НЕТ — добавь в .env"}. Тариф и цену проверь: https://elevenlabs.io/pricing')
        print('Голос — только свой или с явного согласия владельца. После «ок» — тот же запуск с --yes.')
        return
    fields = {'name': a.name, 'remove_background_noise': 'true'}
    if a.dry_run:
        print(json.dumps({'POST': f'{API}/voices/add', 'headers': {'xi-api-key': '***'}, 'fields': fields, 'files': [str(f) for f in files]}, ensure_ascii=False, indent=1))
        return
    if not key:
        die('нет ELEVENLABS_API_KEY в .env')
    body, ctype = multipart(fields, [('files', f.name, f.read_bytes(), mime_of(f)) for f in files])
    res = json.loads(post(f'{API}/voices/add', key, body, ctype))
    vid = res.get('voice_id')
    if not vid:
        die('ElevenLabs не вернул voice_id: ' + json.dumps(res, ensure_ascii=False)[:300])
    update_setup(**{'voice.mode': 'elevenlabs', 'voice.voice_id': vid})
    print(f'клон готов, voice_id сохранён в setup.json{" (нужна проверка голоса на сайте)" if res.get("requires_verification") else ""}')


def cmd_say(a, key):
    text = Path(a.text).read_text(encoding='utf-8').strip()
    st = read_setup().get('voice', {})
    vid = a.voice_id or st.get('voice_id')
    model = a.model or st.get('model') or 'eleven_multilingual_v2'
    out = Path(a.out)
    if out.exists():
        die(f'{out} уже есть — новый дубль сохраняй под новым именем')
    if not vid:
        die('нет voice_id: сначала clone или передай --voice-id')
    if not a.yes and not a.dry_run:
        print(f'План: озвучить {len(text)} символов одним запросом, модель {model}, голос из setup.json → {out}.')
        print(f'Ключ: {"есть" if key else "НЕТ"}. Символы списываются с тарифа ElevenLabs. После «ок» — с --yes.')
        return
    payload = {'text': text, 'model_id': model, 'voice_settings': {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.2, 'use_speaker_boost': True}}
    url = f'{API}/text-to-speech/{vid}?output_format=mp3_44100_128'
    if a.dry_run:
        print(json.dumps({'POST': url.replace(vid, '<voice_id>'), 'headers': {'xi-api-key': '***'}, 'json': {**payload, 'text': f'<{len(text)} символов>'}, 'out': str(out)}, ensure_ascii=False, indent=1))
        return
    if not key:
        die('нет ELEVENLABS_API_KEY в .env')
    audio = post(url, key, json.dumps(payload).encode(), 'application/json', 'audio/mpeg')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    print(f'{out}  ({len(audio)} байт). Дальше: python3 scripts/prep.py … --audio {out} --whisper small')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('record')
    c = sub.add_parser('clone')
    c.add_argument('samples', nargs='+')
    c.add_argument('--name', default='Мой голос')
    s = sub.add_parser('say')
    s.add_argument('text')
    s.add_argument('-o', '--out', required=True)
    s.add_argument('--voice-id')
    s.add_argument('--model')
    for p in (c, s):
        p.add_argument('--dry-run', action='store_true')
        p.add_argument('--yes', action='store_true')
    a = ap.parse_args()
    if a.cmd == 'record':
        return cmd_record()
    key = load_env().get('ELEVENLABS_API_KEY', '')
    try:
        cmd_clone(a, key) if a.cmd == 'clone' else cmd_say(a, key)
    except urllib.error.HTTPError as e:
        die(redact(f'ElevenLabs: HTTP {e.code} {e.read()[:400]!r}', key))
    except urllib.error.URLError as e:
        die(redact(f'ElevenLabs: сеть недоступна: {e.reason}', key))


if __name__ == '__main__':
    main()
