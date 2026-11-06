#!/usr/bin/env python3
"""Готовый ролик (или любой файл: кадр, лист поз) — в личного Telegram-бота человека.

  python3 scripts/send_telegram.py find                       найти chat_id (человек написал боту /start) → setup.json
  python3 scripts/send_telegram.py send out/my.mp4 --caption-file films/my/description.txt
  --dry-run — показать, что ушло бы, без сети (токен не нужен).

Бот создаётся у @BotFather, токен — в .env студии как TELEGRAM_BOT_TOKEN. Токен не печатается и не коммитится.
Bot API принимает файлы до 50 МБ: больше — скрипт делает копию <имя>-tg.mp4 через ffmpeg, оригинал не меняется.
Подпись длиннее 1024 символов уходит отдельным сообщением.
"""
import argparse, json, shutil, subprocess, sys, urllib.error, urllib.request
from pathlib import Path

from _common import die, load_env, mime_of, multipart, read_setup, redact, update_setup

LIMIT = 49 * 1024 * 1024


def api(token, method, data=None, ctype=None):
    url = f'https://api.telegram.org/bot{token}/{method}'
    req = urllib.request.Request(url, data=data, headers={'Content-Type': ctype} if ctype else {})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()[:300].decode('utf-8', 'replace')
        hint = ' (у бота включён webhook или его уже читает другая программа — getUpdates недоступен)' if e.code == 409 else ''
        die(redact(f'Telegram {method}: HTTP {e.code} {body}{hint}', token))
    except urllib.error.URLError as e:
        die(redact(f'Telegram {method}: сеть недоступна: {e.reason}', token))
    if not res.get('ok'):
        die(redact(f'Telegram {method}: {res}', token))
    return res['result']


def find_chat(token, dry):
    if dry:
        print('[dry-run] GET getUpdates → последний личный чат, где человек написал боту → setup.json telegram.chat_id')
        return None
    ups = api(token, 'getUpdates')
    chats = [u['message']['chat'] for u in ups if u.get('message', {}).get('chat', {}).get('type') == 'private']
    if not chats:
        die('боту ещё никто не писал: открой бота в Telegram, нажми Start (/start) и запусти find ещё раз')
    chat = chats[-1]
    update_setup(**{'telegram.enabled': True, 'telegram.chat_id': chat['id']})
    print(f'чат найден: {chat.get("first_name", "")} (@{chat.get("username", "—")}), chat_id сохранён в setup.json')
    return chat['id']


def shrink(src):
    if not shutil.which('ffmpeg'):
        die('файл больше 50 МБ, а ffmpeg нет — уменьши вручную')
    for scale, crf in ((1080, 26), (720, 28), (720, 32)):
        dst = src.with_name(src.stem + '-tg.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vf', f'scale={scale}:-2', '-c:v', 'libx264', '-preset', 'medium', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(dst)], check=True)
        if dst.stat().st_size <= LIMIT:
            return dst
    die('даже сжатая копия больше 50 МБ — укороти ролик')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    f = sub.add_parser('find')
    s = sub.add_parser('send')
    s.add_argument('file')
    s.add_argument('--caption', default='')
    s.add_argument('--caption-file')
    for p in (f, s):
        p.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    token = load_env().get('TELEGRAM_BOT_TOKEN', '')
    if not token and not a.dry_run:
        die('нет TELEGRAM_BOT_TOKEN в .env студии (создай бота у @BotFather)')
    if a.cmd == 'find':
        find_chat(token, a.dry_run)
        return
    src = Path(a.file)
    if not src.exists():
        die(f'нет файла {src}')
    caption = Path(a.caption_file).read_text(encoding='utf-8').strip() if a.caption_file else a.caption
    chat = read_setup().get('telegram', {}).get('chat_id')
    big = src.stat().st_size > LIMIT and src.suffix.lower() == '.mp4'
    if a.dry_run:
        print(json.dumps({'chat_id': chat or '<найдётся через getUpdates>', 'sendDocument': f'{src.name} ({src.stat().st_size / 1e6:.1f} МБ{", сначала сжатая копия -tg.mp4" if big else ""})',
                          'caption': caption[:1024] if len(caption) <= 1024 else '(отдельным сообщением)', 'sendMessage': len(caption) > 1024, 'token': 'есть' if token else 'нет'}, ensure_ascii=False, indent=1))
        return
    chat = chat or find_chat(token, False)
    path = shrink(src) if big else src
    fields = {'chat_id': str(chat)}
    if caption and len(caption) <= 1024:
        fields['caption'] = caption
    body, ctype = multipart(fields, [('document', path.name, path.read_bytes(), mime_of(path))])
    msg = api(token, 'sendDocument', body, ctype)
    if caption and len(caption) > 1024:
        api(token, 'sendMessage', json.dumps({'chat_id': chat, 'text': caption[:4096]}).encode(), 'application/json')
    print(f'отправлено: {path.name}, message_id {msg.get("message_id")}')


if __name__ == '__main__':
    main()
