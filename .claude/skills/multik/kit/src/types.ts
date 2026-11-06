import {createContext, useContext} from 'react';

/** Слово субтитров: текст из сценария, время из ASR (или синтетическое). accent — слово в *звёздочках*. */
export type Word = {text: string; start: number; end: number; accent: boolean; chunk: number};

/** props.json, который собирает scripts/prep.py. */
export type FilmProps = {
  words: Word[];
  chunks: {first: number; last: number}[];
  /** Якоря: имя → секунда начала слова. Сцены ссылаются только на якоря, не на секунды. */
  cues: Record<string, number>;
  /** Громкость голоса по кадрам 0..1 (рот героя). Пусто — рот двигается по таймингам слов. */
  amplitude: number[];
  durationInFrames: number;
  audioDuration: number;
  fps?: number;
  /** Голос и звуки — пути внутри public/ (необязательно). */
  audio?: string | null;
  sfx?: string | null;
  sfxVolume?: number;
};

export type FilmState = {t: number; frame: number; c: Record<string, number>; p: FilmProps};
export const FilmContext = createContext<FilmState | null>(null);

/** В сцене: const {t, c} = useFilm(); t — секунды, c.имя — время якоря. */
export const useFilm = () => {
  const v = useContext(FilmContext);
  if (!v) throw new Error('useFilm() работает только внутри <Film>');
  return v;
};

const SAFE = new Set(['toJSON', 'then', 'constructor', 'valueOf', 'toString', 'hasOwnProperty']);
/** Якоря с понятной ошибкой: опечатка в имени якоря иначе молча даёт NaN и сцена просто не появляется. */
export const strictCues = (cues: Record<string, number>) =>
  new Proxy(cues, {
    get(o, k) {
      if (typeof k === 'string' && !(k in o) && !SAFE.has(k)) throw new Error(`Нет якоря «${k}» в props.cues — добавь его в cues.json и перезапусти prep.py`);
      return (o as Record<string | symbol, number>)[k];
    },
  });
