// Бип — встроенный векторный герой: круглый робот с экраном-лицом.
// Позы задаются углами рук и выражением лица; между позами руки переезжают пружиной.
// Рот открывается по громкости голоса (props.amplitude), а без аудио — по таймингам слов.
import React from 'react';
import {T} from '../theme';
import type {Word} from '../types';
import {mix} from '../lib/motion';

export const POSES = ['neutral', 'palm', 'point', 'up', 'celebrate', 'think', 'surprise', 'shrug', 'wink'] as const;
export type PoseName = (typeof POSES)[number];

type Hand = 'mitt' | 'open' | 'point' | 'thumb';
/** Рука: a1 — угол плеча, a2 — угол предплечья (градусы, 0 = вправо, 90 = вниз), f — направление пальца. */
type Arm = {a1: number; a2: number; hand: Hand; f?: number};
type Eyes = 'open' | 'happy' | 'wide' | 'wink' | 'squint';
type Mouth = 'smile' | 'grin' | 'o' | 'flat';
type Pose = {L: Arm; R: Arm; eyes: Eyes; mouth: Mouth; look: [number, number]; tilt: number; brows?: number};

const mirror = (a: Arm): Arm => ({...a, a1: 180 - a.a1, a2: 180 - a.a2, f: a.f === undefined ? undefined : 180 - a.f});
const DOWN_L: Arm = {a1: 100, a2: 84, hand: 'mitt'};
const DOWN_R = mirror(DOWN_L);

/** Библиотека поз. L — рука слева в кадре (она жестикулирует в сторону сцены). */
export const POSE: Record<PoseName, Pose> = {
  neutral: {L: DOWN_L, R: DOWN_R, eyes: 'open', mouth: 'smile', look: [0, 0], tilt: 0},
  palm: {L: {a1: 160, a2: -80, hand: 'open'}, R: DOWN_R, eyes: 'open', mouth: 'smile', look: [-6, 0], tilt: -3},
  point: {L: {a1: 196, a2: 200, hand: 'point', f: 200}, R: DOWN_R, eyes: 'open', mouth: 'grin', look: [-14, -3], tilt: -4},
  up: {L: {a1: 205, a2: -92, hand: 'point', f: -92}, R: DOWN_R, eyes: 'open', mouth: 'smile', look: [-4, -9], tilt: 3},
  celebrate: {L: {a1: -125, a2: -112, hand: 'open'}, R: mirror({a1: -125, a2: -112, hand: 'open'}), eyes: 'happy', mouth: 'grin', look: [0, -2], tilt: 0},
  think: {L: {a1: -15, a2: -100, hand: 'mitt'}, R: DOWN_R, eyes: 'squint', mouth: 'flat', look: [9, -9], tilt: 6, brows: 1},
  surprise: {L: {a1: 168, a2: -78, hand: 'open'}, R: mirror({a1: 168, a2: -78, hand: 'open'}), eyes: 'wide', mouth: 'o', look: [0, -2], tilt: 0},
  shrug: {L: {a1: 148, a2: 198, hand: 'open'}, R: mirror({a1: 148, a2: 198, hand: 'open'}), eyes: 'open', mouth: 'flat', look: [0, 2], tilt: -5, brows: -1},
  wink: {L: {a1: 128, a2: -58, hand: 'thumb', f: -90}, R: DOWN_R, eyes: 'wink', mouth: 'grin', look: [-3, 0], tilt: 4},
};

const SL: [number, number] = [132, 452];
const SR: [number, number] = [368, 452];
const L1 = 100;
const L2 = 92;
/** Точка между глазами в координатах рисунка — по ней герой ставится в кадр. */
export const EYE: [number, number] = [250, 186];

const rad = (d: number) => (d * Math.PI) / 180;
const angMix = (a: number, b: number, k: number) => {
  const d = (((b - a) % 360) + 540) % 360 - 180;
  return a + d * k;
};
const armMix = (a: Arm, b: Arm, k: number): Arm => ({a1: angMix(a.a1, b.a1, k), a2: angMix(a.a2, b.a2, k), f: angMix(a.f ?? a.a2, b.f ?? b.a2, k), hand: k < 0.5 ? a.hand : b.hand});

const O = T.hero.outline;
const SH = T.hero.shell;

const ArmShape = ({s, arm}: {s: [number, number]; arm: Arm}) => {
  const e = [s[0] + Math.cos(rad(arm.a1)) * L1, s[1] + Math.sin(rad(arm.a1)) * L1];
  const h = [e[0] + Math.cos(rad(arm.a2)) * L2, e[1] + Math.sin(rad(arm.a2)) * L2];
  const d = `M${s[0]} ${s[1]} L${e[0]} ${e[1]} L${h[0]} ${h[1]}`;
  const f = rad(arm.f ?? arm.a2);
  const finger = arm.hand === 'point' || arm.hand === 'thumb';
  const fl = arm.hand === 'thumb' ? 34 : 44;
  const fx = h[0] + Math.cos(f) * fl;
  const fy = h[1] + Math.sin(f) * fl;
  return (
    <g>
      <path d={d} fill="none" stroke={O} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={SH} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      {arm.hand === 'open' &&
        [-34, 0, 34].map((dd) => {
          const a = rad(arm.a2 + dd);
          return <circle key={dd} cx={h[0] + Math.cos(a) * 27} cy={h[1] + Math.sin(a) * 27} r={11} fill={SH} stroke={O} strokeWidth={6} />;
        })}
      {finger && (
        <>
          <line x1={h[0]} y1={h[1]} x2={fx} y2={fy} stroke={O} strokeWidth={arm.hand === 'thumb' ? 28 : 24} strokeLinecap="round" />
          <line x1={h[0]} y1={h[1]} x2={fx} y2={fy} stroke={SH} strokeWidth={arm.hand === 'thumb' ? 15 : 11} strokeLinecap="round" />
        </>
      )}
      <circle cx={h[0]} cy={h[1]} r={arm.hand === 'open' ? 28 : 27} fill={SH} stroke={O} strokeWidth={6.5} />
    </g>
  );
};

const Eye = ({kind, side, blink, look}: {kind: Eyes; side: 0 | 1; blink: boolean; look: [number, number]}) => {
  const cx = (side ? 304 : 196) + look[0];
  const cy = 186 + look[1];
  const g = T.hero.glow;
  const k = kind === 'wink' && side === 1 ? 'happy' : kind === 'wink' ? 'open' : kind;
  if (k === 'happy') return <path d={`M${cx - 25} ${cy + 10} Q${cx} ${cy - 26} ${cx + 25} ${cy + 10}`} fill="none" stroke={g} strokeWidth={11} strokeLinecap="round" />;
  const w = k === 'wide' ? 52 : 42;
  const h = (k === 'wide' ? 76 : k === 'squint' ? 46 : 64) * (blink ? 0.12 : 1);
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={Math.min(w, h) / 2} fill={g} />
      {!blink && <circle cx={cx - w * 0.18} cy={cy - h * 0.22} r={w * 0.15} fill="#fff" opacity={0.9} />}
    </g>
  );
};

/** Открытие рта 0..1 и форма «о/у». */
export const mouthAt = (t: number, fps: number, words: Word[], amp: number[]) => {
  const w = words.find((x) => t >= x.start && t < x.end);
  const letters = w ? w.text.toLowerCase().replace(/[^a-zа-яё]/g, '') : '';
  const prog = w ? (t - w.start) / Math.max(0.02, w.end - w.start) : 0;
  const ch = letters[Math.min(letters.length - 1, Math.floor(prog * letters.length))] ?? '';
  const round = /[оуёюou]/.test(ch);
  if (amp.length) {
    const f = Math.floor(t * fps);
    const a = ((amp[f - 1] ?? 0) + (amp[f] ?? 0) * 2 + (amp[f + 1] ?? 0)) / 4;
    return {open: Math.max(0, Math.min(1, (a - 0.08) / 0.55)), round, talking: a > 0.08};
  }
  if (!w) return {open: 0, round: false, talking: false};
  const syl = Math.max(1, (letters.match(/[аеёиоуыэюяaeiouy]/g) ?? []).length);
  return {open: 0.2 + 0.8 * Math.abs(Math.sin(Math.PI * syl * prog)), round, talking: true};
};

const MouthShape = ({mode, open, round, look}: {mode: Mouth; open: number; round: boolean; look: [number, number]}) => {
  const cx = 250 + look[0] * 0.6;
  const cy = 254 + look[1] * 0.4;
  const g = T.hero.glow;
  if (open > 0.06) {
    const w = round ? 32 : 56;
    const h = 10 + 38 * open;
    return (
      <g>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={Math.min(w, h) / 2} fill={g} />
        {h > 22 && <rect x={cx - w / 2 + 7} y={cy - h / 2 + 6} width={w - 14} height={h - 12} rx={Math.min(w - 14, h - 12) / 2} fill={T.hero.visor} />}
        {h > 30 && <ellipse cx={cx} cy={cy + h / 2 - 10} rx={w / 2 - 12} ry={5} fill={T.hero.cheek} />}
      </g>
    );
  }
  if (mode === 'o') return <ellipse cx={cx} cy={cy} rx={13} ry={16} fill="none" stroke={g} strokeWidth={8} />;
  if (mode === 'flat') return <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke={g} strokeWidth={9} strokeLinecap="round" />;
  if (mode === 'grin') return <path d={`M${cx - 30} ${cy - 8} Q${cx} ${cy + 30} ${cx + 30} ${cy - 8} Z`} fill={g} stroke={g} strokeWidth={4} strokeLinejoin="round" />;
  return <path d={`M${cx - 26} ${cy - 5} Q${cx} ${cy + 18} ${cx + 26} ${cy - 5}`} fill="none" stroke={g} strokeWidth={9} strokeLinecap="round" />;
};

export type MascotArgs = {t: number; fps: number; pose: string; prev: string; k: number; words: Word[]; amp: number[]};

/** Рисунок героя в собственных координатах (точка между глазами — EYE). */
export const MascotDrawing = ({t, fps, pose, prev, k, words, amp}: MascotArgs) => {
  const P = POSE[(pose in POSE ? pose : 'neutral') as PoseName];
  const Q = POSE[(prev in POSE ? prev : 'neutral') as PoseName];
  const kk = Math.max(-0.2, Math.min(1.2, k));
  const Larm = armMix(Q.L, P.L, kk);
  const Rarm = armMix(Q.R, P.R, kk);
  const tilt = mix(Q.tilt, P.tilt, Math.max(0, Math.min(1, kk)));
  const look: [number, number] = [mix(Q.look[0], P.look[0], Math.min(1, kk)) + Math.sin(t * 0.9) * 1.5, mix(Q.look[1], P.look[1], Math.min(1, kk))];
  const blink = (t + 0.6) % 3.7 < 0.1 && P.eyes !== 'happy';
  const m = mouthAt(t, fps, words, amp);
  const sway = Math.sin(t * 2.3) * 4 + (pose === 'up' ? Math.sin(t * 9) * 3 : 0);
  const glowUp = pose === 'up' ? 0.5 + 0.5 * Math.sin(t * 10) : 0;
  return (
    <g>
      {/* шея и корпус */}
      <rect x={222} y={320} width={56} height={90} rx={12} fill={T.ink2} />
      <path d="M138 404 Q250 384 362 404 Q392 410 398 446 L420 680 L80 680 L102 446 Q108 410 138 404Z" fill={SH} stroke={O} strokeWidth={8} strokeLinejoin="round" />
      <path d="M362 404 Q392 410 398 446 L420 680 L372 680 L360 450Z" fill={T.hero.shellShade} opacity={0.8} />
      {/* экран на груди: эквалайзер голоса */}
      <rect x={196} y={452} width={108} height={66} rx={18} fill={T.hero.visor} stroke={O} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => {
        const hh = 8 + (m.talking ? 30 * Math.abs(Math.sin(t * 13 + i * 1.7)) * Math.max(0.35, m.open) : 0);
        return <rect key={i} x={214 + i * 20} y={485 - hh / 2} width={11} height={hh} rx={5} fill={i === 1 ? T.hero.antenna : T.hero.glow} />;
      })}
      <g transform={`rotate(${tilt} 250 340)`}>
        {/* антенна */}
        <path d={`M250 46 Q${250 + sway * 0.4} 18 ${250 + sway} -14`} fill="none" stroke={O} strokeWidth={8} strokeLinecap="round" />
        {glowUp > 0 && <circle cx={250 + sway} cy={-14} r={30 + 8 * glowUp} fill={T.hero.antenna} opacity={0.25 * glowUp} />}
        <circle cx={250 + sway} cy={-14} r={18} fill={T.hero.antenna} stroke={O} strokeWidth={6} />
        <circle cx={244 + sway} cy={-20} r={5} fill="#fff" opacity={0.85} />
        {/* «уши» */}
        <rect x={46} y={150} width={30} height={76} rx={12} fill={T.hero.shellShade} stroke={O} strokeWidth={6} />
        <rect x={424} y={150} width={30} height={76} rx={12} fill={T.hero.shellShade} stroke={O} strokeWidth={6} />
        {/* голова и экран-лицо */}
        <rect x={68} y={40} width={364} height={300} rx={132} ry={124} fill={SH} stroke={O} strokeWidth={8} />
        <path d="M110 92 Q250 54 392 96" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
        <rect x={104} y={96} width={292} height={196} rx={92} ry={88} fill={T.hero.visor} />
        <path d="M140 124 Q190 104 238 108" fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.12} />
        <ellipse cx={150} cy={250} rx={22} ry={12} fill={T.hero.cheek} opacity={0.55} />
        <ellipse cx={350} cy={250} rx={22} ry={12} fill={T.hero.cheek} opacity={0.55} />
        {P.brows !== undefined && (
          <g stroke={T.hero.glow} strokeWidth={8} strokeLinecap="round" opacity={0.8}>
            <line x1={176 + look[0]} y1={134 + look[1] - P.brows * 6} x2={214 + look[0]} y2={134 + look[1] + P.brows * 6} />
            <line x1={286 + look[0]} y1={134 + look[1] + P.brows * 6} x2={324 + look[0]} y2={134 + look[1] - P.brows * 6} />
          </g>
        )}
        <Eye kind={P.eyes} side={0} blink={blink} look={look} />
        <Eye kind={P.eyes} side={1} blink={blink} look={look} />
        <MouthShape mode={P.mouth} open={m.open} round={m.round} look={look} />
      </g>
      <ArmShape s={SL} arm={Larm} />
      <ArmShape s={SR} arm={Rarm} />
    </g>
  );
};

/** Бип в кадре: (x, y) — где окажется точка между глазами, scale — масштаб рисунка. */
export const Mascot = (a: MascotArgs & {x: number; y: number; scale: number}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <g transform={`translate(${a.x} ${a.y}) scale(${a.scale}) translate(${-EYE[0]} ${-EYE[1]})`}>
      <MascotDrawing {...a} />
    </g>
  </svg>
);
