// Рамка кадра: фоны, шапка секции, субтитр, ударный заголовок, плашка шага, полутоновые тень и шторка.
import React from 'react';
import {FONT, L, T} from '../theme';
import type {FilmProps} from '../types';
import {ease, lin, mix, pop} from './motion';

export const Abs = ({x, y, w, h, z, style, children}: {x: number; y: number; w?: number; h?: number; z?: number; style?: React.CSSProperties; children?: React.ReactNode}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, ...style}}>{children}</div>
);

/** Растр из точек — основа полутоновой тени и шторки. */
export const dots = (c: string = T.shadow, step = 7, r = 46): React.CSSProperties => ({
  backgroundImage: `radial-gradient(circle, ${c} ${r}%, transparent ${r + 6}%)`,
  backgroundSize: `${step}px ${step}px`,
});
/** Точечная тень со сдвигом вправо-вниз. Кладётся первым ребёнком в position:relative контейнер. */
export const HT = ({w, h, r = 18, dx = 12, dy = 12, c = T.shadow, op = 0.5}: {w: number | string; h: number | string; r?: number; dx?: number; dy?: number; c?: string; op?: number}) => (
  <div style={{position: 'absolute', left: dx, top: dy, width: w, height: h, borderRadius: r, ...dots(c), opacity: op, zIndex: -1, pointerEvents: 'none'}} />
);

/** Кремовая миллиметровка: мелкая клетка 24 px, крупная 120 px, зерно. Фон всех сцен после хука. */
export const GridPaper = ({t}: {t: number}) => (
  <div style={{position: 'absolute', inset: 0, background: T.paper}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${T.gridMinor} 1.5px, transparent 1.5px), linear-gradient(90deg, ${T.gridMinor} 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
        backgroundPosition: '-1px 8px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${T.gridMajor} 2px, transparent 2px), linear-gradient(90deg, ${T.gridMajor} 2px, transparent 2px)`,
        backgroundSize: '120px 120px',
        backgroundPosition: '-1px 8px',
      }}
    />
    <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, opacity: 0.28, mixBlendMode: 'multiply'}}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed={Math.floor(t * 12) % 4} />
        <feColorMatrix values="0 0 0 0 .42  0 0 0 0 .38  0 0 0 0 .3  0 0 0 .5 0" />
      </filter>
      <rect width={L.W} height={L.H} filter="url(#paper-grain)" />
    </svg>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(130% 90% at 50% 45%, transparent 60%, rgba(60,45,20,.10) 100%)'}} />
  </div>
);

/** Грифельная доска хука: тёмный сланец, меловая пыль, стёртые разводы. Субтитры на ней светлые. */
export const Chalkboard = () => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(120% 85% at 50% 48%, ${T.board} 0%, ${T.boardDark} 100%)`}}>
    <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.22}}>
      <filter id="board-dust">
        <feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="3" seed="4" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 .95  0 0 0 1.6 -.75" />
      </filter>
      <rect width={L.W} height={L.H} filter="url(#board-dust)" />
    </svg>
    <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.35}}>
      <filter id="board-grain">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="11" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -1.55" />
      </filter>
      <rect width={L.W} height={L.H} filter="url(#board-grain)" />
    </svg>
    {/* следы стёртого мела */}
    <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, opacity: 0.07, filter: 'blur(14px)'}}>
      <path d="M80 640 C 300 560, 520 720, 980 600" stroke="#fff" strokeWidth="90" fill="none" />
      <path d="M140 1260 C 420 1180, 700 1330, 1000 1220" stroke="#fff" strokeWidth="70" fill="none" />
    </svg>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#0b100fcc 0%, #0b100f00 30%, #0b100f00 80%, #0b100f66 100%)'}} />
  </div>
);

/** Меловой фильтр для штрихов на доске. Положи один раз в сцену хука. */
export const ChalkDefs = () => (
  <svg width="0" height="0" style={{position: 'absolute'}}>
    <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="2" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d" />
      <feComponentTransfer in="d">
        <feFuncA type="table" tableValues="0 .9 .75 1" />
      </feComponentTransfer>
    </filter>
  </svg>
);

/** Шапка секции: «// 04 · шаг 2 · папка». */
export const Eyebrow = ({text, light}: {text: string; light?: boolean}) => (
  <div style={{position: 'absolute', left: L.eyebrow.x, top: L.eyebrow.y, fontFamily: FONT.mono, fontSize: 29, letterSpacing: 0.5, color: light ? '#b9c4bf' : T.mute, whiteSpace: 'pre', zIndex: 70}}>
    {'//  ' + text}
  </div>
);

/** Субтитр: слово появляется в момент произнесения, 0,12 с светлое → тёмное; акцент — рукописный цветом акцента. */
export const Caption = ({p, t, light}: {p: FilmProps; t: number; light?: boolean}) => {
  const ci = p.chunks.findIndex((c, i) => t >= p.words[c.first].start - 0.06 && (i === p.chunks.length - 1 || t < p.words[p.chunks[i + 1].first].start - 0.06));
  if (ci < 0) return null;
  const c = p.chunks[ci];
  const ws = p.words.slice(c.first, c.last + 1);
  const ink = light ? T.boardText : T.ink;
  const ghost = light ? 'rgba(246,243,234,.4)' : T.ghost;
  const acc = light ? T.accentOnDark : T.accent;
  const S = L.caption.size;
  return (
    <div style={{position: 'absolute', left: L.caption.x, top: L.caption.y, width: L.caption.w, lineHeight: 1.08, zIndex: 70}}>
      {ws.map((w, j) => {
        if (t < w.start - 0.06) return null;
        const k = lin(t, w.start - 0.06, w.start + 0.1);
        const dark = lin(t, w.start + 0.02, w.start + 0.16);
        return (
          <span
            key={j}
            style={{
              display: 'inline-block',
              marginRight: w.accent ? 16 : 18,
              fontFamily: w.accent ? FONT.accent : FONT.caption,
              fontWeight: w.accent ? 700 : 600,
              fontSize: w.accent ? S * 1.32 : S,
              lineHeight: w.accent ? 0.82 : 1.08,
              letterSpacing: w.accent ? -0.5 : -2,
              color: w.accent ? acc : dark >= 1 ? ink : `color-mix(in srgb, ${ink} ${dark * 100}%, ${ghost})`,
              opacity: k,
              transform: `translateY(${(1 - k) * 6}px) rotate(${w.accent ? -2 : 0}deg)`,
              verticalAlign: 'baseline',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** Сегмент заголовка. at — своё время появления (слово, которое звучит позже остальных). */
export type Seg = {s: string; accent?: boolean; at?: number};
/** Ударный заголовок: буквы влетают по одной (35 мс) с увеличением и блюром. */
export const Display = ({segs, t, at, x = L.title.x, y = L.title.y, size = 124, stagger = 0.035, out = 1e9, small, light, align = 'left', width, z = 30}: {
  segs: Seg[];
  t: number;
  at: number;
  x?: number;
  y?: number;
  size?: number;
  stagger?: number;
  out?: number;
  small?: string;
  light?: boolean;
  align?: 'left' | 'center';
  width?: number;
  z?: number;
}) => {
  if (t < at - 0.02 || t > out + 0.2) return null;
  let n = 0;
  const o = 1 - lin(t, out, out + 0.15);
  return (
    <div style={{position: 'absolute', left: x, top: y, width, textAlign: align, opacity: o, transform: `scale(${1 - 0.1 * lin(t, out, out + 0.15)})`, transformOrigin: '0 50%', zIndex: z}}>
      {small && <div style={{fontFamily: FONT.mono, fontSize: 22, color: light ? '#b9c4bf' : T.mute, marginBottom: 2, opacity: lin(t, at, at + 0.1)}}>{'// ' + small}</div>}
      <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: size, lineHeight: 0.98, letterSpacing: -0.5, textTransform: 'uppercase', whiteSpace: 'pre'}}>
        {segs.map((sg, i) => (
          <span key={i} style={{color: sg.accent ? (light ? T.accentOnDark : T.accent) : light ? T.boardText : T.ink}}>
            {[...sg.s].map((ch, j) => {
              n++;
              const a = sg.at !== undefined ? sg.at + stagger * j : at + stagger * (n - 1);
              const k = pop(t, a, 18, 12);
              return (
                <span key={j} style={{display: 'inline-block', opacity: lin(t, a, a + 0.05), transform: `scale(${mix(1.9, 1, k)}) translateY(${(1 - k) * -10}px)`, filter: `blur(${(1 - lin(t, a, a + 0.09)) * 6}px)`}}>
                  {ch === ' ' ? ' ' : ch}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Плашка шага: тёмный скруглённый квадрат, белая цифра, точки прогресса (текущая — акцент). */
export const Badge = ({n, total = 6, size = 96, style}: {n: number; total?: number; size?: number; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: size, height: size * 1.06, ...style}}>
    <HT w={size} h={size * 1.06} r={size * 0.18} dx={size * 0.08} dy={size * 0.08} op={0.55} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: T.ink,
        borderRadius: size * 0.18,
        border: `${Math.max(2, size * 0.028)}px solid #fff`,
        boxShadow: '0 6px 14px #0004',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{fontFamily: FONT.display, fontWeight: 700, color: '#fff', fontSize: size * 0.66, lineHeight: 0.9, marginTop: size * 0.02}}>{n}</div>
      <div style={{display: 'flex', gap: size * 0.035, marginTop: size * 0.07}}>
        {Array.from({length: total}, (_, k) => k + 1).map((i) => (
          <i key={i} style={{width: size * 0.075, height: size * 0.075, borderRadius: '50%', background: i < n ? '#fff' : i === n ? T.accentOnDark : 'transparent', border: i > n ? `${size * 0.012 + 0.6}px solid #fff9` : 'none'}} />
        ))}
      </div>
    </div>
  </div>
);

/** Шаг открывается огромной плашкой в тонком круге акцента, затем она улетает в угол объекта (to). */
export const StepBadge = ({n, total = 6, t, a, go, cx = 540, cy = 900, to = [900, 600]}: {n: number; total?: number; t: number; a: number; go: number; cx?: number; cy?: number; to?: [number, number]}) => {
  const k = ease(t, go, go + 0.3);
  return (
    <>
      {t < go + 0.25 && (
        <div style={{position: 'absolute', left: cx - 200, top: cy - 200, width: 400, height: 400, borderRadius: '50%', border: `4px solid ${T.accent}`, opacity: 0.8 * (1 - k), transform: `scale(${mix(0.5, 1, ease(t, a, a + 0.3))})`, zIndex: 34}} />
      )}
      <div style={{position: 'absolute', left: mix(cx - 130, to[0], k), top: mix(cy - 136, to[1], k), transform: `scale(${mix(2.6, 1, k) * mix(0.3, 1, pop(t, a, 14, 10))}) rotate(${mix(-6, 0, k)}deg)`, transformOrigin: '0 0', zIndex: 35}}>
        <Badge n={n} total={total} size={100} />
      </div>
    </>
  );
};

/** Полутоновая шторка: точки растут волной до тёмного экрана и уходят. Разделяет главы. */
export const Halftone = ({t, at, dur = 0.55, dir = 'left', color = T.shutter, hold = 0}: {t: number; at: number; dur?: number; dir?: 'left' | 'right' | 'center' | 'corners'; color?: string; hold?: number}) => {
  const total = dur * 2 + hold;
  if (t < at || t > at + total) return null;
  const inK = lin(t, at, at + dur);
  const outK = lin(t, at + dur + hold, at + total);
  const S = 54;
  const cols = 21;
  const rows = 37;
  const els: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = i * S + S / 2;
      const y = j * S + S / 2;
      const p =
        dir === 'left'
          ? x / L.W
          : dir === 'right'
            ? 1 - x / L.W
            : dir === 'center'
              ? Math.hypot(x - 540, y - 960) / 1100
              : 1 - Math.min(Math.hypot(x, y), Math.hypot(L.W - x, L.H - y), Math.hypot(L.W - x, y), Math.hypot(x, L.H - y)) / 1100;
      const g = Math.max(0, Math.min(1, inK * 1.8 - p * 0.8)) * (1 - Math.max(0, Math.min(1, outK * 1.8 - (1 - p) * 0.8)));
      if (g <= 0.01) continue;
      els.push(<circle key={j * cols + i} cx={x} cy={y} r={g * S * 0.74} />);
    }
  return (
    <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, zIndex: 90}} fill={color}>
      {els}
    </svg>
  );
};
