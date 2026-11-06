// Герой-наклейка справа снизу весь ролик: белый контур, точечная тень, «шлепок» при смене позы.
// Тело рисует render: по умолчанию векторный Бип, можно подставить свой PNG-атлас (AtlasHero).
import React from 'react';
import {L, T} from '../theme';
import type {Word} from '../types';
import {mix, pop} from '../lib/motion';
import {Mascot, type MascotArgs} from './Mascot';

/** Трек поз: [секунда, имя позы]. Меняй позу примерно раз в секунду по смыслу слова. */
export type Track = [number, string][];
export type HeroRender = (a: MascotArgs & {x: number; y: number; scale: number}) => React.ReactNode;

export const defaultHero: HeroRender = (a) => <Mascot {...a} />;

export const HeroSticker = ({t, fps, track, words, amp, glow = 0, x = L.hero.x, y = L.hero.y, scale = L.hero.scale, outline = 6, render = defaultHero}: {
  t: number;
  fps: number;
  track: Track;
  words: Word[];
  amp: number[];
  glow?: number;
  x?: number;
  y?: number;
  scale?: number;
  outline?: number;
  render?: HeroRender;
}) => {
  const sorted = track.length ? track : ([[0, 'neutral']] as Track);
  let i = 0;
  while (i < sorted.length - 1 && t >= sorted[i + 1][0]) i++;
  const at = sorted[i][0];
  const pose = sorted[i][1];
  const prev = i > 0 ? sorted[i - 1][1] : pose;
  const k = i === 0 ? 1 : pop(t, at, 16, 10);
  const slap = i === 0 ? 1 : pop(t, at, 22, 14);
  const breath = Math.sin(t * 2.1) * 0.006;
  const sc = mix(0.94, 1, slap) + breath;
  const lift = (1 - slap) * 16 + Math.sin(t * 2.1) * 3;
  const args = {t, fps, pose, prev, k, words, amp, x, y, scale};
  const body = render(args);
  const o = outline;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none'}}>
      {glow > 0 && <div style={{position: 'absolute', left: x - 340, top: y - 360, width: 680, height: 680, borderRadius: '50%', background: `radial-gradient(circle, ${T.accent}55, ${T.accent}00 70%)`, opacity: glow}} />}
      <div style={{position: 'absolute', inset: 0, transform: `translate(0px, ${lift}px) scale(${sc})`, transformOrigin: `${x}px ${L.H}px`}}>
        {/* точечная тень: силуэт тёмный, сдвинут и порезан на растр */}
        <div style={{position: 'absolute', inset: 0, transform: 'translate(18px, 14px)', filter: 'brightness(0)', opacity: 0.42, WebkitMaskImage: 'radial-gradient(circle, #000 46%, transparent 53%)', WebkitMaskSize: '7px 7px'}}>{body}</div>
        {/* белый контур-наклейка */}
        <div style={{position: 'absolute', inset: 0, filter: `drop-shadow(${o}px 0 0 #fff) drop-shadow(-${o}px 0 0 #fff) drop-shadow(0 ${o}px 0 #fff) drop-shadow(0 -${o}px 0 #fff)`}}>{body}</div>
      </div>
    </div>
  );
};
