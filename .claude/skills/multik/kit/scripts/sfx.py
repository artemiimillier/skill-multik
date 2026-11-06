#!/usr/bin/env python3
"""Звуки событий: короткие синтезированные щелчки, удары, свисты на видимых событиях. Музыки нет — звучат только действия.

  python3 scripts/sfx.py examples/demo/props.json examples/demo/sfx.json -o public/demo-sfx.wav

sfx.json — список событий. Время — имя якоря из props.cues (или число секунд) плюс dt:
  {"s": "pop", "at": "mult", "dt": 0.1}                 одиночный звук
  {"s": "tick", "at": "nikto", "n": 6, "step": 0.035}   серия (буквы заголовка влетают)
  {"s": "key", "from": "sdelai", "to": "tekstu"}        клавиши на каждом слове между якорями (печать в такт речи)
  "g" — громкость (1 = по умолчанию).
Звуки: thud pop tick click key swish whoosh marker stamp ding confetti popper rise.
Если wav лежит внутри public/, путь записывается в props.json (поле sfx) и Remotion подмешает его сам.
Только стандартная библиотека Python.
"""
import argparse, json, math, random, struct, sys, wave
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
SR = 44100
rng = random.Random(7)


def env(n, a=0.002, d=0.06):
    return [min(1.0, (i / SR) / a) * math.exp(-(i / SR) / d) for i in range(n)]


def lp_noise(sec, d, lp=0.2):
    n = int(sec * SR); e = env(n, 0.002, d); y = []; s = 0.0
    for i in range(n):
        s += lp * (rng.gauss(0, 1) - s); y.append(s * e[i])
    return y


def tone(f, sec, d):
    n = int(sec * SR); e = env(n, 0.001, d)
    return [math.sin(2 * math.pi * f * i / SR) * e[i] for i in range(n)]


def add(a, b, gb=1.0):
    out = list(a) + [0.0] * max(0, len(b) - len(a))
    for i, x in enumerate(b):
        out[i] += x * gb
    return out


def chirp(f0, f1, sec, d):
    n = int(sec * SR); e = env(n, 0.001, d); ph = 0.0; out = []
    for i in range(n):
        ph += 2 * math.pi * (f0 + (f1 - f0) * i / n) / SR; out.append(math.sin(ph) * e[i])
    return out


def window(x):
    n = len(x)
    return [v * math.sin(math.pi * i / n) for i, v in enumerate(x)]


def thud(): return add(chirp(95, 55, 0.3, 0.07), lp_noise(0.3, 0.02, 0.3), 0.4)
def pop(): return chirp(520, 1420, 0.12, 0.03)
def tick(): return [v * 0.8 for v in lp_noise(0.03, 0.006, 0.8)]
def click(): return add(lp_noise(0.025, 0.004, 0.9), tone(2400, 0.025, 0.004), 0.3)
def key(): return add(lp_noise(0.05, 0.009, 0.6), tone(1500, 0.05, 0.006), 0.2)
def swish(): return window(lp_noise(0.14, 0.05, 0.45))
def whoosh():
    n = int(0.34 * SR); y = []; s = 0.0
    for i in range(n):
        c = 0.03 + 0.3 * (i / n); s += c * (rng.gauss(0, 1) - s); y.append(s * math.sin(math.pi * i / n) ** 2)
    return y
def marker():
    x = lp_noise(0.16, 0.09, 0.55); n = len(x)
    return [v * (1 + 0.6 * math.sin(2 * math.pi * 38 * i / SR)) * math.sin(math.pi * i / n) for i, v in enumerate(x)]
def stamp(): return add([v * 1.2 for v in thud()], lp_noise(0.08, 0.015, 0.9), 0.6)
def ding(): return add([v * 0.7 for v in tone(2637, 0.9, 0.35)], tone(5274, 0.9, 0.12), 0.25)
def confetti():
    out = [0.0] * int(0.9 * SR)
    for _ in range(40):
        i = int(rng.uniform(0, 0.7) * SR); g = rng.uniform(0.2, 0.6)
        for k, v in enumerate(tone(rng.uniform(3000, 7000), 0.03, 0.008)):
            out[i + k] += v * g
    return add(out, lp_noise(0.9, 0.25, 0.5), 0.5)
def popper(): return add([v * 0.6 for v in thud()], lp_noise(0.12, 0.03, 0.7), 1.2)
def rise(): return [v * 0.5 for v in window(chirp(300, 1200, 0.5, 10))]


GAIN = {'thud': .45, 'pop': .15, 'tick': .18, 'click': .3, 'key': .16, 'swish': .22, 'whoosh': .26, 'marker': .2, 'stamp': .55, 'ding': .12, 'confetti': .2, 'popper': .45, 'rise': .1}
BANK = {k: globals()[k] for k in GAIN}
CACHE = {}


def sound(name):
    if name not in BANK:
        sys.exit(f'нет звука «{name}». Есть: {" ".join(BANK)}')
    if name not in CACHE:
        CACHE[name] = BANK[name]()
    return CACHE[name]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('props'); ap.add_argument('events'); ap.add_argument('-o', '--out', required=True)
    ap.add_argument('--volume', type=float, default=0.6, help='громкость слоя в ролике (sfxVolume)')
    a = ap.parse_args()
    props = json.loads(Path(a.props).read_text(encoding='utf-8'))
    cues, words = props['cues'], props['words']
    dur = props['durationInFrames'] / props.get('fps', 30)
    out = [0.0] * int((dur + 1) * SR)

    def when(x):
        if isinstance(x, (int, float)):
            return float(x)
        if x not in cues:
            sys.exit(f'нет якоря «{x}» в {a.props}')
        return cues[x]

    def put(name, t, g=1.0):
        x = sound(name); i = int(max(t, 0) * SR); gg = GAIN[name] * g
        for k in range(min(len(x), len(out) - i)):
            out[i + k] += x[k] * gg

    events = json.loads(Path(a.events).read_text(encoding='utf-8'))
    for e in events:
        g = e.get('g', 1.0)
        if 'from' in e:
            t0, t1 = when(e['from']), when(e['to'])
            for w in words:
                if t0 - 0.01 <= w['start'] <= t1 + 0.01:
                    for k in range(max(2, len(w['text']) // 2)):
                        put(e['s'], w['start'] + k * 0.05, g)
            continue
        t = when(e['at']) + e.get('dt', 0.0)
        for k in range(int(e.get('n', 1))):
            put(e['s'], t + k * e.get('step', 0.05), g)

    peak = max(1e-9, max(abs(v) for v in out))
    scale = min(1.0, 0.9 / peak) * 32767
    path = Path(a.out); path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-32767, min(32767, v * scale)))) for v in out))
    try:
        rel = path.resolve().relative_to(KIT / 'public').as_posix()
        props['sfx'] = rel; props['sfxVolume'] = a.volume
        Path(a.props).write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{path}: {len(events)} событий, {dur:.1f} с → props.sfx = {rel}')
    except ValueError:
        print(f'{path}: {len(events)} событий, {dur:.1f} с (не внутри public/ — в ролик сам не подключится)')


if __name__ == '__main__':
    main()
