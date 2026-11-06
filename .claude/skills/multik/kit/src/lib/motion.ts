// Время в сценах — секунды (t = frame / fps). Все функции чистые: один и тот же кадр всегда рисуется одинаково.
import type React from 'react';
import {Easing, interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 между a и b, быстрый старт и мягкая посадка. */
export const ease = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
/** 0→1, плавно с двух сторон — для курсора и переездов. */
export const smooth = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], {...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1)});
/** 0→1 линейно. */
export const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** Пружина 0→1 с перелётом: «шлепок», с которым объекты входят в кадр. */
export const pop = (t: number, at: number, f = 15, d = 9) => {
  const x = t - at;
  return x < 0 ? 0 : 1 - Math.exp(-d * x) * Math.cos(f * x);
};
/** Импульс 0→1→0 длиной d. */
export const pulse = (t: number, at: number, d = 0.4) => Math.sin(lin(t, at, at + d) * Math.PI);
export const on = (t: number, a: number, b = 1e9) => t >= a && t < b;
/** Текст печатается по буквам между a и b. */
export const typed = (s: string, t: number, a: number, b: number) =>
  [...s].slice(0, Math.round([...s].length * lin(t, a, b))).join('');
/** Затухающая тряска кадра/объекта после удара. */
export const shake = (t: number, at: number, amp = 10, d = 0.25) => {
  const k = 1 - lin(t, at, at + d);
  return k <= 0 || t < at ? 0 : Math.sin(t * 90) * amp * k;
};

/** Вход «шлепком» (скейл 0.6→1 с перелётом и лёгким блюром) и быстрый уход в b. */
export const enter = (t: number, a: number, b = 1e9, from = 0.6): React.CSSProperties => {
  const k = pop(t, a, 16, 10);
  const out = lin(t, b, b + 0.16);
  return {
    opacity: Math.min(1, lin(t, a, a + 0.08)) * (1 - out),
    transform: `scale(${mix(from, 1, k) * (1 - 0.25 * out)})`,
    filter: `blur(${(1 - lin(t, a, a + 0.12)) * 8 + out * 6}px)`,
    display: t < a - 0.01 || t > b + 0.17 ? 'none' : undefined,
  };
};
/** Въезд со сдвигом (dx, dy) и уход в b. */
export const slideIn = (t: number, a: number, dx = 0, dy = 120, b = 1e9): React.CSSProperties => {
  const k = ease(t, a, a + 0.32);
  const out = lin(t, b, b + 0.16);
  return {
    opacity: lin(t, a, a + 0.1) * (1 - out),
    transform: `translate(${(1 - k) * dx}px,${(1 - k) * dy}px)`,
    display: t < a - 0.01 || t > b + 0.17 ? 'none' : undefined,
  };
};

/** Путь курсора по ключевым точкам [x, y, время]: между точками — плавная кривая. */
export const curPath = (t: number, pts: [number, number, number][]): [number, number] => {
  let i = 0;
  while (i < pts.length - 1 && t >= pts[i + 1][2]) i++;
  if (i >= pts.length - 1) return [pts[pts.length - 1][0], pts[pts.length - 1][1]];
  const [x0, y0, t0] = pts[i];
  const [x1, y1, t1] = pts[i + 1];
  const k = smooth(t, t0, t1);
  return [mix(x0, x1, k), mix(y0, y1, k)];
};

/** Номер последнего наступившего момента из списка (или -1). */
export const stepOf = (t: number, times: number[]) => {
  let n = -1;
  times.forEach((x, i) => {
    if (t >= x) n = i;
  });
  return n;
};
