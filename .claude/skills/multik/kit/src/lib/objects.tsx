// Реквизит: скотч, лист бумаги, стикер, лупа, флажок, карточки шагов и дорога-маршрут, мини-сцены.
import React from 'react';
import {FONT, T} from '../theme';
import {HT} from './frame';

/** Полоска малярного скотча (прикрепить лист к доске). */
export const Tape = ({x, y, w = 120, rot = -8}: {x: number; y: number; w?: number; rot?: number}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - 18, width: w, height: 36, background: T.tape, transform: `rotate(${rot}deg)`, boxShadow: '0 2px 4px #0003', clipPath: 'polygon(3% 0,97% 4%,100% 50%,96% 100%,2% 96%,0 45%)', zIndex: 25}} />
);

/** Лист бумаги с рваным верхним краем. */
export const PaperSheet = ({w, h, children, rot = 0, style}: {w: number; h: number; children?: React.ReactNode; rot?: number; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: w, height: h, transform: `rotate(${rot}deg)`, ...style}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: T.card,
        boxShadow: '0 22px 40px #000a',
        clipPath: 'polygon(0 2.5%,5% 0,12% 2%,20% .4%,29% 2.4%,38% .2%,49% 2%,60% 0,71% 2.2%,82% .3%,91% 2%,100% .6%,100% 100%,0 100%)',
        backgroundImage: `linear-gradient(${T.gridMinor} 1.5px, transparent 1.5px), linear-gradient(90deg, ${T.gridMinor} 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
      }}
    />
    {children}
  </div>
);

/** Квадратный стикер. */
export const Sticky = ({w = 170, color = '#FFE16A', rot = -6, children, style}: {w?: number; color?: string; rot?: number; children?: React.ReactNode; style?: React.CSSProperties}) => (
  <div style={{width: w, height: w * 0.94, background: color, transform: `rotate(${rot}deg)`, boxShadow: '0 10px 16px #0005', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: FONT.accent, fontWeight: 700, fontSize: w * 0.34, lineHeight: 0.9, color: T.ink, ...style}}>
    {children}
  </div>
);

/** Лупа; (x, y) — центр линзы. */
export const Magnifier = ({x, y, r = 90, rot = -35}: {x: number; y: number; r?: number; rot?: number}) => (
  <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible', zIndex: 45}}>
    <line x1={r * 0.72} y1={r * 0.72} x2={r * 2.05} y2={r * 2.05} stroke={T.ink} strokeWidth={r * 0.24} strokeLinecap="round" transform={`rotate(${rot + 45})`} />
    <circle r={r} fill="#ffffff44" stroke={T.ink} strokeWidth={r * 0.14} />
    <circle r={r * 0.9} fill="none" stroke={T.accent} strokeWidth={r * 0.05} />
    <path d={`M${-r * 0.55} ${-r * 0.35} A${r * 0.7} ${r * 0.7} 0 0 1 ${-r * 0.1} ${-r * 0.66}`} stroke="#fff" strokeWidth={r * 0.09} fill="none" strokeLinecap="round" opacity=".85" />
  </svg>
);

/** Финишный флажок в клетку. k — 0..1 подъём. */
export const Flag = ({x, y, k = 1, size = 120}: {x: number; y: number; k?: number; size?: number}) => (
  <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible', zIndex: 30}}>
    <line x1="0" y1="0" x2="0" y2={-size * 1.4} stroke={T.ink} strokeWidth="8" strokeLinecap="round" />
    <g transform={`translate(0 ${-size * 1.4 + (1 - k) * size}) scale(${k})`}>
      {Array.from({length: 12}, (_, i) => {
        const cx = i % 4;
        const cy = Math.floor(i / 4);
        return <rect key={i} x={cx * size * 0.22} y={cy * size * 0.2} width={size * 0.22} height={size * 0.2} fill={(cx + cy) % 2 ? T.ink : '#fff'} />;
      })}
      <rect width={size * 0.88} height={size * 0.6} fill="none" stroke={T.ink} strokeWidth="4" />
    </g>
  </svg>
);

export type Step = {n: number; title: string; sub: string; icon?: string};
/** Карточка шага для маршрута: номер (или галочка done), заголовок, подпись. hi — обводка акцентом. */
export const StepCard = ({s, hi, done, w = 365, style}: {s: Step; hi?: boolean; done?: number; w?: number; style?: React.CSSProperties}) => {
  const h = w * 0.42;
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      <HT w={w} h={h} r={18} dx={10} dy={12} op={0.4} />
      <div style={{position: 'absolute', inset: 0, background: '#fff', borderRadius: 18, border: hi ? `5px solid ${T.accent}` : `2px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px'}}>
        <div style={{width: h * 0.58, height: h * 0.58, borderRadius: 14, background: hi && !done ? T.accent : T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontFamily: FONT.display, fontWeight: 700, color: '#fff', fontSize: h * 0.42, lineHeight: 1}}>
          {done ? (
            <svg viewBox="0 0 40 40" width={h * 0.4} height={h * 0.4} style={{transform: `scale(${done})`}}>
              <path d="M8 21 L17 30 33 11" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            s.n
          )}
        </div>
        <div style={{fontFamily: FONT.ui, minWidth: 0}}>
          <div style={{fontSize: s.title.length > 11 ? 27 : 31, fontWeight: 800, color: T.ink, letterSpacing: -0.8, whiteSpace: 'nowrap'}}>{s.title}</div>
          <div style={{fontFamily: FONT.mono, fontSize: 18, whiteSpace: 'nowrap', color: hi ? T.accent : '#7c776e', marginTop: 4}}>// {s.sub}</div>
        </div>
        {s.icon && <div style={{position: 'absolute', right: 14, top: 10, fontSize: 28, color: '#b9b4aa'}}>{s.icon}</div>}
      </div>
    </div>
  );
};

/** Дорога-маршрут по точкам (широкая серая полоса с белой разметкой); progress 0..1 — пройденная часть акцентом. */
export const Road = ({d, k = 1, progress = 0, width = 78}: {d: string; k?: number; progress?: number; width?: number}) => (
  <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: k}}>
    <path d={d} fill="none" stroke="#dcd6ca" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="22 26" />
    <path d={d} fill="none" stroke={T.accent} strokeWidth="12" strokeLinecap="round" pathLength={1} strokeDasharray={`${progress} 1`} />
  </svg>
);

/** Мини-сцены для превью «раскадровки»: маленькие рисунки внутри кадра 9:16. */
export const MiniScene = ({kind, w = 120}: {kind: number; w?: number}) => {
  const h = w * 1.5;
  const k = kind % 6;
  return (
    <div style={{position: 'relative', width: w, height: h, background: T.paper, border: `3px solid ${T.ink}`, borderRadius: 10, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: w * 0.1, top: w * 0.1, width: w * 0.6, height: w * 0.07, background: T.ink, borderRadius: 3}} />
      <div style={{position: 'absolute', left: w * 0.1, top: w * 0.22, width: w * 0.35, height: w * 0.07, background: T.accent, borderRadius: 3}} />
      <svg viewBox="0 0 100 100" width={w * 0.8} height={w * 0.8} style={{position: 'absolute', left: w * 0.1, top: h * 0.38}}>
        {k === 0 && <rect x="10" y="20" width="80" height="55" rx="8" fill={T.win} />}
        {k === 0 && <rect x="22" y="58" width="56" height="9" rx="4" fill={T.accent} />}
        {k === 1 && <path d="M10 30 Q10 22 18 22 H40 L48 30 H84 Q92 30 92 38 V78 Q92 84 86 84 H16 Q10 84 10 78Z" fill={T.folder} stroke={T.ink} strokeWidth="4" />}
        {k === 2 && <rect x="30" y="8" width="40" height="84" rx="9" fill="#111" />}
        {k === 2 && <rect x="35" y="16" width="30" height="66" rx="5" fill={T.accentSoft} />}
        {k === 3 && [20, 45, 70].map((x, i) => <rect key={i} x={x - 8} y={80 - (i + 1) * 20} width="16" height={(i + 1) * 20} fill={i === 2 ? T.accent : T.ink} />)}
        {k === 4 && <circle cx="50" cy="50" r="34" fill={T.accent} />}
        {k === 4 && <path d="M33 51 L45 63 68 38" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />}
        {k === 5 && <path d="M50 10 L61 38 L91 39 L67 57 L76 87 L50 70 L24 87 L33 57 L9 39 L39 38Z" fill={T.warm} stroke={T.ink} strokeWidth="4" strokeLinejoin="round" />}
      </svg>
      <div style={{position: 'absolute', right: w * 0.08, bottom: w * 0.08, width: w * 0.22, height: w * 0.22, borderRadius: '50%', background: T.hero.shell, border: `3px solid ${T.ink}`}} />
    </div>
  );
};

/** Маленькая «рамка кадра 9:16» мелом (для доски хука). progress 0..1 — сколько контура нарисовано. */
export const ChalkFrame = ({x, y, w = 200, progress = 1, children}: {x: number; y: number; w?: number; progress?: number; children?: React.ReactNode}) => {
  const h = w * 1.6;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'url(#chalk)'}}>
        <rect x="4" y="4" width={w - 8} height={h - 8} rx="14" fill="none" stroke={T.chalk} strokeWidth="6" pathLength={1} strokeDasharray={`${progress} 1`} />
      </svg>
      {children}
    </div>
  );
};
