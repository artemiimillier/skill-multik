#!/usr/bin/env python3
"""props.json для ролика: слова субтитров из сценария, время — из ASR или синтетическое, якоря событий, громкость для рта.

Слова на экране всегда берутся из chunks.txt (точный сценарий), ASR даёт только время: строки сверяются посимвольно.

Три режима времени:
  --synthetic                 без аудио: темп речи по слогам и паузы на знаках препинания (для черновика и демо)
  --words asr.json            готовые слова с таймингами из любого распознавателя (whisper, whisperX, faster-whisper, Deepgram…)
  --audio voice.mp3 --whisper small   распознать локально через faster-whisper (pip install faster-whisper)

Примеры:
  python3 scripts/prep.py examples/demo/chunks.txt examples/demo/cues.json -o examples/demo/props.json --synthetic
  python3 scripts/prep.py films/my/chunks.txt films/my/cues.json -o films/my/props.json --audio public/my/voice.mp3 --whisper small

Формат chunks.txt: одна строка — одна фраза субтитра (1–2 строки на экране). *слово* — акцент. Пустые строки и # — пропуск.
Формат cues.json: {"имя": ["слово", номер_вхождения]} — имя якоря → слово сценария (без знаков, регистр не важен).
Только стандартная библиотека Python; ffmpeg/ffprobe нужны для режима с аудио.
"""
import argparse, difflib, json, math, re, shutil, subprocess, sys
from array import array
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
VOWELS = 'аеёиоуыэюяaeiouy'


def norm(s, yo=True):
    s = s.lower()
    if yo:
        s = s.replace('ё', 'е')
    return re.sub(r'[^a-zа-яё0-9]', '', s)


def read_chunks(path):
    words, chunks = [], []
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        first = len(words)
        for tok in line.split():
            if tok in ('—', '–', '-') and words:  # тире не произносится — приклеиваем к предыдущему слову
                words[-1]['text'] += ' ' + tok
                continue
            acc = '*' in tok
            words.append({'text': tok.replace('*', ''), 'accent': acc, 'chunk': len(chunks)})
        if len(words) > first:
            chunks.append({'first': first, 'last': len(words) - 1})
    if not words:
        sys.exit('chunks.txt пустой')
    return words, chunks


def synthetic(words, pace=1.2, start=0.35):
    """Время без аудио: ~0,075 с на букву + слог, паузы на знаках. Похоже на спокойную речь 2,5–3 слова/с."""
    t = start
    for w in words:
        n = norm(w['text'])
        syl = max(1, sum(ch in VOWELS for ch in n))
        dur = (0.07 + 0.045 * len(n) + 0.05 * syl) / pace
        w['start'], w['end'] = round(t, 3), round(t + dur, 3)
        t += dur + 0.035 / pace
        tail = w['text'].rstrip('»"\')')
        if tail.endswith((',', ';')):
            t += 0.16 / pace
        elif tail.endswith(('.', '!', '?', ':', '—', '–', '…')):
            t += 0.34 / pace
    return t


def load_asr_words(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    if isinstance(data, dict) and 'words' in data:
        raw = data['words']
    elif isinstance(data, dict) and 'segments' in data:
        raw = [w for s in data['segments'] for w in s.get('words', [])]
    elif isinstance(data, list):
        raw = data
    else:
        sys.exit(f'{path}: не нашёл слов (нужно {{"words": [...]}} или {{"segments": [{{"words": [...]}}]}})')
    out = []
    for w in raw:
        text = w.get('text', w.get('word', ''))
        if 'start' in w and 'end' in w and str(text).strip():
            out.append({'text': str(text).strip(), 'start': float(w['start']), 'end': float(w['end'])})
    if not out:
        sys.exit(f'{path}: слова без таймингов')
    return out


def whisper_words(audio, model_name, lang):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit('нет faster-whisper: pip install faster-whisper  (или распознай сам и передай --words asr.json)')
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segs, _ = model.transcribe(str(audio), language=lang, word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
    return [{'text': w.word.strip(), 'start': w.start, 'end': w.end} for s in segs for w in s.words]


def align(words, asr):
    """Посимвольная сверка нормализованного сценария и распознанного текста; время каждого слова — по его первой букве."""
    a_chars, a_time = [], []
    for w in asr:
        n = norm(w['text'])
        for k, ch in enumerate(n):
            a_chars.append(ch)
            a_time.append(w['start'] + (w['end'] - w['start']) * k / max(1, len(n)))
    s_chars, owner = [], []
    for i, w in enumerate(words):
        for ch in norm(w['text']):
            s_chars.append(ch)
            owner.append(i)
    sm = difflib.SequenceMatcher(None, s_chars, a_chars, autojunk=False)
    t_of = [None] * len(s_chars)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            t_of[a + k] = a_time[b + k]
    matched = sum(x is not None for x in t_of) / max(1, len(t_of))
    known = [i for i, x in enumerate(t_of) if x is not None]
    if not known:
        sys.exit('ASR не совпал со сценарием ни в одной букве — проверь язык и файл')
    for i in range(len(t_of)):  # пропуски — линейно между известными соседями
        if t_of[i] is None:
            lo = max((k for k in known if k < i), default=None)
            hi = min((k for k in known if k > i), default=None)
            if lo is None:
                t_of[i] = t_of[hi]
            elif hi is None:
                t_of[i] = t_of[lo] + 0.06 * (i - lo)
            else:
                t_of[i] = t_of[lo] + (t_of[hi] - t_of[lo]) * (i - lo) / (hi - lo)
    for i, w in enumerate(words):
        ts = [t_of[k] for k, o in enumerate(owner) if o == i]
        w['start'] = round(min(ts), 3)
    for i, w in enumerate(words):
        nxt = words[i + 1]['start'] if i + 1 < len(words) else w['start'] + 0.5
        w['end'] = round(min(nxt, w['start'] + max(0.18, 0.075 * len(norm(w['text'])))), 3)
    return matched


def audio_info(audio, fps):
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        sys.exit('для режима с аудио нужны ffmpeg и ffprobe')
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(audio)], capture_output=True, text=True, check=True).stdout)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(audio), '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    a = array('h')
    a.frombytes(pcm[: len(pcm) // 2 * 2])
    if sys.byteorder == 'big':
        a.byteswap()
    hop = 16000 // fps
    amp = []
    for i in range(len(a) // hop):
        seg = a[i * hop:(i + 1) * hop]
        amp.append(math.sqrt(sum(x * x for x in seg) / len(seg)) / 32768)
    peak = sorted(amp)[int(len(amp) * 0.98)] if amp else 1
    peak = peak or 1
    return dur, [round(min(1.0, x / peak), 3) for x in amp]


def find_cue(words, sub, occ):
    seen = 0
    for i, w in enumerate(words):
        if norm(sub, yo=False) == norm(w['text'], yo=False):
            seen += 1
            if seen == occ:
                return i
    raise SystemExit(f'нет якоря: слово «{sub}» №{occ} в сценарии не найдено')


def rel_public(path):
    try:
        return Path(path).resolve().relative_to(KIT / 'public').as_posix()
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('chunks')
    ap.add_argument('cues')
    ap.add_argument('-o', '--out', required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--synthetic', action='store_true')
    g.add_argument('--words', help='JSON со словами и таймингами')
    g.add_argument('--whisper', metavar='MODEL', help='tiny/base/small/medium/large-v3 — нужен --audio')
    ap.add_argument('--audio', help='голос: длительность, громкость для рта; внутри public/ — подключится к ролику')
    ap.add_argument('--script', help='полный текст озвучки для сверки с chunks.txt')
    ap.add_argument('--lang', default='ru')
    ap.add_argument('--pace', type=float, default=1.2, help='синтетический темп: 1.0 — спокойно, 1.2 — живо (по умолчанию), 1.4 — быстро')
    ap.add_argument('--tail', type=float, default=0.9, help='секунд после последнего слова')
    ap.add_argument('--fps', type=int, default=30)
    args = ap.parse_args()

    words, chunks = read_chunks(args.chunks)
    if args.script:
        spoken = norm(Path(args.script).read_text(encoding='utf-8'))
        shown = norm(' '.join(w['text'] for w in words))
        if spoken != shown:
            d = next((i for i, (x, y) in enumerate(zip(spoken, shown)) if x != y), min(len(spoken), len(shown)))
            sys.exit(f'субтитры не совпадают с озвучкой около символа {d}: …{spoken[max(0, d - 20):d + 20]}… / …{shown[max(0, d - 20):d + 20]}…')

    matched, amp, audio_rel = 1.0, [], None
    if args.synthetic:
        end = synthetic(words, args.pace)
        dur = end
    else:
        if args.whisper and not args.audio:
            sys.exit('--whisper требует --audio')
        asr = load_asr_words(args.words) if args.words else whisper_words(args.audio, args.whisper, args.lang)
        matched = align(words, asr)
        dur = max(w['end'] for w in words)
    if args.audio:
        dur, amp = audio_info(args.audio, args.fps)
        audio_rel = rel_public(args.audio)
        if not audio_rel:
            print(f'! {args.audio} не внутри public/ — ролик будет без голоса. Положи файл в public/ и перезапусти.', file=sys.stderr)

    cue_spec = json.loads(Path(args.cues).read_text(encoding='utf-8'))
    cues = {}
    for name, spec in cue_spec.items():
        sub, occ = (spec, 1) if isinstance(spec, str) else (spec[0], int(spec[1]) if len(spec) > 1 else 1)
        cues[name] = words[find_cue(words, sub, occ)]['start']

    frames = int(math.ceil((dur + args.tail) * args.fps))
    out = Path(args.out)
    old = json.loads(out.read_text(encoding='utf-8')) if out.exists() else {}
    props = {'words': words, 'chunks': chunks, 'cues': cues, 'amplitude': amp, 'durationInFrames': frames, 'audioDuration': round(dur, 3), 'fps': args.fps, 'audio': audio_rel, 'sfx': old.get('sfx'), 'sfxVolume': old.get('sfxVolume', 0.6)}
    out.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding='utf-8')

    print(json.dumps({'words': len(words), 'chunks': len(chunks), 'chars_matched': round(matched, 4), 'frames': frames, 'seconds': round(frames / args.fps, 2), 'out': str(out)}, ensure_ascii=False))
    if matched < 0.95:
        print(f'! совпало только {matched:.0%} букв: разберись (другой текст в озвучке? числа цифрами?) до сборки сцен', file=sys.stderr)
    print('якоря:', ' '.join(f'{k}={v:.2f}' for k, v in sorted(cues.items(), key=lambda kv: kv[1])))


if __name__ == '__main__':
    main()
