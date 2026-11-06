// Знаки акцента: маркерный круг, рамка, подчёркивание, зачёркивание, стрелка, галочка/крест, штамп, частицы.
// Акцент — только на сути. Если всё акцентное, ничего не акцентное.
import React from 'react';
import {Easing, random} from 'remotion';
import {FONT, L, T} from '../theme';
import {ease, lin, mix, pop, pulse} from './motion';

/** Маркерный круг «от руки»: чуть неровный, заходит на себя, рисуется ~0,28 с, дышит, исчезает через dur. */
export const Ring = ({x, y, r, rx, t, at, dur = 0.9, w = 6, rot = -30, color = T.accent}: {x: number; y: number; r: number; rx?: number; t: number; at: number; dur?: number; w?: number; rot?: number; color?: string}) => {
  if (t < at || t > at + dur + 0.2) return null;
  const k = ease(t, at, at + 0.28);
  const o = 1 - lin(t, at + dur, at + dur + 0.2);
  const ax = (rx ?? r) * (1 + 0.025 * Math.sin(t * 9));
  const ay = r * (1 + 0.025 * Math.sin(t * 9 + 1));
  const pts: string[] = [];
  const turns = 1.12;
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const th = (rot * Math.PI) / 180 + (i / N) * turns * Math.PI * 2;
    const wob = 1 + 0.035 * Math.sin(th * 3 + 0.7) + 0.05 * (i / N);
    pts.push(`${(Math.cos(th) * ax * wob).toFixed(1)},${(Math.sin(th) * ay * wob).toFixed(1)}`);
  }
  const len = 2 * Math.PI * Math.max(ax, ay) * turns * 1.1;
  return (
    <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible', zIndex: 60, opacity: o * 0.92}}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len * k} ${len}`} />
    </svg>
  );
};

/** Рамка акцента вокруг объекта, рисуется по периметру. */
export const Frame = ({x, y, w, h, t, at, dur = 1e9, r = 16, sw = 5, color = T.accent}: {x: number; y: number; w: number; h: number; t: number; at: number; dur?: number; r?: number; sw?: number; color?: string}) => {
  if (t < at || t > at + dur + 0.15) return null;
  const k = ease(t, at, at + 0.25);
  const P = 2 * (w + h);
  return (
    <svg style={{position: 'absolute', left: x - sw, top: y - sw, width: w + 2 * sw, height: h + 2 * sw, overflow: 'visible', zIndex: 55, opacity: 1 - lin(t, at + dur, at + dur + 0.15)}}>
      <rect x={sw} y={sw} width={w} height={h} rx={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={`${P * k} ${P}`} />
    </svg>
  );
};

/** Подчёркивание маркером (слегка дугой). */
export const Underline = ({x, y, w, t, at, sw = 8, color = T.accent}: {x: number; y: number; w: number; t: number; at: number; sw?: number; color?: string}) =>
  t < at ? null : (
    <svg style={{position: 'absolute', left: x, top: y - sw, width: w, height: sw * 3, overflow: 'visible', zIndex: 55}}>
      <path d={`M0 ${sw} Q${w * 0.5} ${sw * 2} ${w} ${sw * 0.5}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${w * 1.1 * ease(t, at, at + 0.25)} ${w * 2}`} />
    </svg>
  );

/** Зачёркивание линией (координаты кадра). Рисуй внутри контейнера объекта, если объект двигается. */
export const Strike = ({x1, y1, x2, y2, t, at, sw = 12, color = T.accent}: {x1: number; y1: number; x2: number; y2: number; t: number; at: number; sw?: number; color?: string}) => {
  if (t < at) return null;
  const k = ease(t, at, at + 0.18);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', zIndex: 58, pointerEvents: 'none'}}>
      <line x1={x1} y1={y1} x2={mix(x1, x2, k)} y2={mix(y1, y2, k)} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
};

/** Стрелка вверх «↑ напиши это». */
export const ArrowUp = ({x, y, h = 90, t, at, color = T.accent}: {x: number; y: number; h?: number; t: number; at: number; color?: string}) =>
  t < at ? null : (
    <svg style={{position: 'absolute', left: x - 30, top: y, width: 60, height: h + 10, overflow: 'visible', zIndex: 55}}>
      <path d={`M30 ${h} Q22 ${h * 0.5} 30 6 M12 28 L30 4 L48 28`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${(h + 60) * ease(t, at, at + 0.3)} 400`} />
    </svg>
  );

/** Галочка или крест в круге акцента. k — масштаб (подай pop(t, at)). */
export const Mark = ({kind, size = 64, k = 1, color = T.accent}: {kind: 'check' | 'x'; size?: number; k?: number; color?: string}) => (
  <svg viewBox="0 0 50 50" width={size} height={size} style={{transform: `scale(${k})`, filter: 'drop-shadow(0 3px 4px #0003)', flex: 'none'}}>
    <circle cx="25" cy="25" r="23" fill={color} stroke="#fff" strokeWidth="3" />
    {kind === 'check' ? (
      <path d="M14 26 L22 34 37 17" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M16 16 L34 34 M34 16 L16 34" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    )}
  </svg>
);

/** Чекбокс: пунктирный пустой → тёмный с галочкой (v — масштаб галочки). */
export const CheckBox = ({v, size = 48, dark = true}: {v: number; size?: number; dark?: boolean}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.2, background: v > 0 ? T.ink : 'transparent', border: v > 0 ? 'none' : `3px dashed ${dark ? '#9a968d' : '#bbb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
    {v > 0 && (
      <svg viewBox="0 0 40 40" width={size * 0.8} height={size * 0.8} style={{transform: `scale(${v})`}}>
        <path d="M9 21 L17 29 32 12" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

/** Штамп («ОК», «ГОТОВО»): падает с большого размера, чуть повёрнут, с потёртой краской. (x, y) — центр. */
export const Stamp = ({text, t, at, x, y, size = 90, rot = -8, color = T.accent}: {text: string; t: number; at: number; x: number; y: number; size?: number; rot?: number; color?: string}) => {
  if (t < at) return null;
  const k = pop(t, at, 20, 13);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${mix(2.2, 1, k)})`,
        opacity: lin(t, at, at + 0.05),
        zIndex: 62,
        fontFamily: FONT.display,
        fontWeight: 700,
        fontSize: size,
        color,
        border: `${size * 0.07}px solid ${color}`,
        borderRadius: size * 0.14,
        padding: `0 ${size * 0.2}px`,
        lineHeight: 1.12,
        letterSpacing: 3,
        background: '#ffffff2a',
        WebkitMaskImage: 'repeating-linear-gradient(35deg,#000 0 7px,#000c 7px 9px)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/** Конфетти/искры: детерминированные частицы из точки (x, y). */
export const Particles = ({x, y, t, at, n = 24, spread = 320, colors = [T.accent, T.ink, T.warm, '#fff'], dur = 0.9, up = 1}: {x: number; y: number; t: number; at: number; n?: number; spread?: number; colors?: string[]; dur?: number; up?: number}) => {
  const k = lin(t, at, at + dur);
  if (k <= 0 || k >= 1) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = random(`a${at}${i}`) * Math.PI * 2;
        const v = 0.4 + random(`v${at}${i}`) * 0.6;
        const s = 8 + random(`s${at}${i}`) * 12;
        const e = Easing.out(Easing.cubic)(k);
        const px = x + Math.cos(a) * spread * v * e;
        const py = y + Math.sin(a) * spread * v * e * up + 260 * k * k;
        return <i key={i} style={{position: 'absolute', left: px, top: py, width: s, height: s * 0.6, background: colors[i % colors.length], transform: `rotate(${a * 57 + k * 720}deg)`, opacity: 1 - lin(k, 0.7, 1), zIndex: 75, borderRadius: 2}} />;
      })}
    </>
  );
};

/** Лучи-вспышка вокруг точки (у героя на «восторг»). */
export const Rays = ({x, y, t, at, dur = 0.6, len = 110, r0 = 150, n = 10, color = T.ink}: {x: number; y: number; t: number; at: number; dur?: number; len?: number; r0?: number; n?: number; color?: string}) => {
  const k = lin(t, at, at + dur);
  if (k <= 0 || k >= 1) return null;
  const e = Easing.out(Easing.cubic)(k);
  return (
    <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible', zIndex: 74, opacity: 1 - lin(k, 0.6, 1)}}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.2;
        const r1 = r0 + e * 40;
        const r2 = r1 + len * (1 - k * 0.6);
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={color} strokeWidth="7" strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Наклейка-подсказка «состояния» внизу слева: «правый клик → Новая папка». */
export const Tip = ({children, x = L.state.x, y = L.state.y, w, rot = -3, style}: {children: React.ReactNode; x?: number; y?: number; w?: number; rot?: number; style?: React.CSSProperties}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, transform: `rotate(${rot}deg)`, zIndex: 40, ...style}}>
    <div style={{position: 'relative', background: '#fff', border: `3px solid ${T.ink}`, borderRadius: 16, padding: '14px 20px', fontFamily: FONT.ui, fontWeight: 700, fontSize: 30, color: T.ink, boxShadow: `7px 8px 0 ${T.shadow}22`}}>{children}</div>
  </div>
);

/** Клавиша; hi — подсвечена акцентом (нажата). */
export const Key = ({k, hi}: {k: string; hi?: boolean}) => (
  <span style={{display: 'inline-block', border: `3px solid ${hi ? T.accent : T.ink}`, background: hi ? T.accent : '#fff', color: hi ? '#fff' : T.ink, borderRadius: 8, padding: '0 10px', fontFamily: FONT.ui, fontWeight: 700, fontSize: 24, boxShadow: '0 3px 0 #0003'}}>{k}</span>
);

/** Пилюля-метка: «1 СТРОКА», «3/3», «48 кадров». */
export const Pill = ({children, accent, size = 34, style}: {children: React.ReactNode; accent?: boolean; size?: number; style?: React.CSSProperties}) => (
  <span style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.3, background: accent ? T.accent : T.ink, color: '#fff', borderRadius: 999, padding: `${size * 0.12}px ${size * 0.55}px`, fontFamily: FONT.display, fontWeight: 700, fontSize: size, letterSpacing: 1, whiteSpace: 'nowrap', ...style}}>
    {children}
  </span>
);

/** Счётчик набегает от a до b. */
export const Counter = ({t, at, dur = 0.6, from = 0, to, style}: {t: number; at: number; dur?: number; from?: number; to: number; style?: React.CSSProperties}) => (
  <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>{Math.round(mix(from, to, ease(t, at, at + dur)))}</span>
);

/** Мигающий текстовый курсор «|». */
export const Caret = ({t, color = 'currentColor'}: {t: number; color?: string}) => <span style={{opacity: Math.floor(t * 4) % 2 ? 1 : 0, fontWeight: 300, color}}>|</span>;

/** Короткий «тык»: масштаб 1 → 1-amp → 1 в момент at. */
export const tap = (t: number, at: number, amp = 0.08) => 1 - amp * pulse(t, at, 0.2);
