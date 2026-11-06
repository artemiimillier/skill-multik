"""Общее для скриптов студии: корень студии, .env, setup.json, скрытие секретов. Только стандартная библиотека."""
import json, os, re, sys, uuid
from pathlib import Path

STUDIO = Path(__file__).resolve().parents[1]
SETUP = STUDIO / 'setup.json'
EXAMPLE = STUDIO / 'setup.example.json'


def load_env():
    """Переменные из окружения и из .env студии (и .env на уровень выше — корень проекта). Значения не печатаем."""
    env = {}
    for p in (STUDIO.parent / '.env', STUDIO / '.env'):
        if p.exists():
            for line in p.read_text(encoding='utf-8').splitlines():
                m = re.match(r'\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$', line)
                if m and not line.lstrip().startswith('#'):
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    env.update({k: v for k, v in os.environ.items() if v})
    return env


def read_setup():
    if SETUP.exists():
        return json.loads(SETUP.read_text(encoding='utf-8'))
    return json.loads(EXAMPLE.read_text(encoding='utf-8'))


def write_setup(data):
    SETUP.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def set_path(data, dotted, value):
    cur = data
    keys = dotted.split('.')
    for k in keys[:-1]:
        cur = cur.setdefault(k, {})
    cur[keys[-1]] = value


def update_setup(**pairs):
    """update_setup(**{'telegram.chat_id': 123}) — точечная запись в setup.json."""
    data = read_setup()
    for k, v in pairs.items():
        set_path(data, k, v)
    write_setup(data)
    return data


def redact(text, *secrets):
    s = str(text)
    for sec in secrets:
        if sec:
            s = s.replace(sec, '***')
    return s


def multipart(fields, files):
    """fields: {name: str}; files: [(name, filename, bytes, mime)] → (body, content_type)."""
    b = uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        out += [f'--{b}\r\n'.encode(), f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode(), str(v).encode('utf-8'), b'\r\n']
    for name, filename, data, mime in files:
        out += [f'--{b}\r\n'.encode(), f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode(), f'Content-Type: {mime}\r\n\r\n'.encode(), data, b'\r\n']
    out.append(f'--{b}--\r\n'.encode())
    return b''.join(out), f'multipart/form-data; boundary={b}'


def mime_of(path):
    ext = Path(path).suffix.lower()
    return {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4'}.get(ext, 'application/octet-stream')


def die(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)
