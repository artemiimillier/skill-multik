#!/usr/bin/env python3
"""Состояние онбординга студии (setup.json): какой шаг следующий, отметки, проверка окружения.

  python3 scripts/onboarding.py init                     создать setup.json, если его нет
  python3 scripts/onboarding.py status                   шаги ✓/· и следующий непройденный
  python3 scripts/onboarding.py set steps.mcp=true piratex.credits=5000 niche.niches='["ai"]'
  python3 scripts/onboarding.py doctor                   Node, npm, ffmpeg, Python, faster-whisper, node_modules

Значения в set читаются как JSON (true, 5000, "текст", [..]); не-JSON — как строка.
setup.json хранит выбор человека. Ключи и токены сюда не пишем — они только в .env.
"""
import json, platform, re, shutil, subprocess, sys
from datetime import datetime, timezone

from _common import EXAMPLE, SETUP, STUDIO, read_setup, set_path, write_setup

ORDER = [
    ('lang', 'язык общения'),
    ('mcp', 'Piratex AI / Viralex AI MCP — обязательный'),
    ('niche', 'ниша по профилю'),
    ('style', 'свой стиль по ролику'),
    ('hero', 'свой герой по фото'),
    ('voice', 'голос'),
    ('env', 'окружение и npm i'),
    ('telegram', 'Telegram-бот (по желанию)'),
    ('done', 'готово'),
]


def next_step(data):
    st = data.get('steps', {})
    for k, title in ORDER:
        if not st.get(k):
            return k, title
    return None, None


def cmd_init():
    if SETUP.exists():
        print(f'{SETUP.name} уже есть')
    else:
        SETUP.write_text(EXAMPLE.read_text(encoding='utf-8'), encoding='utf-8')
        print(f'создан {SETUP}')
    cmd_status()


def cmd_status():
    data = read_setup()
    st = data.get('steps', {})
    for k, title in ORDER:
        print(f"  {'✓' if st.get(k) else '·'} {k:<9} {title}")
    k, title = next_step(data)
    if not data.get('steps', {}).get('mcp'):
        print('ГЕЙТ: MCP не подключён — до шага mcp ничего другого не делаем.')
    print(f'Следующий шаг: {k} — {title}' if k else 'Онбординг пройден: можно делать ролики.')


def cmd_set(pairs):
    data = read_setup()
    for p in pairs:
        if '=' not in p:
            sys.exit(f'нужно key=value: {p}')
        k, v = p.split('=', 1)
        try:
            val = json.loads(v)
        except json.JSONDecodeError:
            val = v
        if k.lower().endswith(('token', 'api_key', 'apikey', 'secret', 'password')):
            sys.exit('секреты в setup.json не пишем — положи их в .env')
        set_path(data, k, val)
    if any(p.startswith('piratex.') for p in pairs):
        set_path(data, 'piratex.checked_at', datetime.now(timezone.utc).isoformat(timespec='seconds'))
    write_setup(data)
    cmd_status()


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception:
        return ''


def cmd_doctor():
    osn = platform.system()
    hints = {
        'Darwin': {'node': 'brew install node', 'ffmpeg': 'brew install ffmpeg'},
        'Linux': {'node': 'sudo apt install nodejs npm  (или nvm: https://github.com/nvm-sh/nvm)', 'ffmpeg': 'sudo apt install ffmpeg'},
        'Windows': {'node': 'winget install OpenJS.NodeJS.LTS', 'ffmpeg': 'winget install Gyan.FFmpeg'},
    }.get(osn, {'node': 'https://nodejs.org', 'ffmpeg': 'https://ffmpeg.org/download.html'})
    ok = True
    node = run(['node', '--version']) if shutil.which('node') else ''
    m = re.match(r'v(\d+)', node)
    node_ok = bool(m and int(m.group(1)) >= 18)
    print(f"  {'✓' if node_ok else '✗'} Node.js 18+: {node or 'нет'}" + ('' if node_ok else f'   → {hints["node"]}'))
    npm = shutil.which('npm')
    print(f"  {'✓' if npm else '✗'} npm: {'есть' if npm else 'нет'}")
    ff = shutil.which('ffmpeg') and shutil.which('ffprobe')
    print(f"  {'✓' if ff else '✗'} ffmpeg + ffprobe: {'есть' if ff else 'нет'}" + ('' if ff else f'   → {hints["ffmpeg"]}'))
    py_ok = sys.version_info >= (3, 9)
    print(f"  {'✓' if py_ok else '✗'} Python 3.9+: {platform.python_version()}")
    try:
        import faster_whisper  # noqa: F401
        fw = True
    except ImportError:
        fw = False
    print(f"  {'✓' if fw else '·'} faster-whisper (по желанию): {'есть' if fw else 'нет'}" + ('' if fw else '   → pip install faster-whisper'))
    nm = (STUDIO / 'node_modules' / 'remotion').exists()
    print(f"  {'✓' if nm else '✗'} node_modules: {'установлены' if nm else 'нет'}" + ('' if nm else f'   → cd {STUDIO.name} && npm i'))
    ok = node_ok and npm and ff and py_ok and nm
    data = read_setup()
    set_path(data, 'env.node', node or None)
    set_path(data, 'env.ffmpeg', bool(ff))
    set_path(data, 'env.whisper', fw)
    set_path(data, 'env.npm_installed', nm)
    if SETUP.exists():
        write_setup(data)
    print('Окружение готово.' if ok else 'Не хватает обязательного — поставь и запусти doctor ещё раз.')
    sys.exit(0 if ok else 1)


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ('-h', '--help'):
        print(__doc__)
        return
    c = sys.argv[1]
    if c == 'init':
        cmd_init()
    elif c == 'status':
        cmd_status()
    elif c == 'set':
        cmd_set(sys.argv[2:])
    elif c == 'doctor':
        cmd_doctor()
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
