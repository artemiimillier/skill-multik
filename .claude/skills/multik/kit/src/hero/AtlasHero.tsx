// Свой герой из PNG-атласа поз. Атлас по фото собирают scripts/make_character.py (или вручную в ChatGPT/Gemini)
// и scripts/atlas_rig.py — он режет сетку 3×3, убирает фон и пишет public/hero/rig.json:
// {
//   "atlas": "hero/atlas.png", "width": 1024, "height": 1536, "fit": 1.9,
//   "poses": {
//     "neutral": {"box": [x, y, w, h], "anchor": [ex, ey], "eyes": [[x1, y1], [x2, y2]], "mouth": [mx, my], "mouthW": 40, "skin": "#f1c7a3"},
//     ...
//   }
// }
// box — кадр позы [x, y, w, h]; anchor — точка между глазами; координаты — пиксели атласа.
// eyes/mouth/skin — для моргания и открывания рта поверх рисунка; talk/blink — необязательные готовые кадры
// той же позы того же размера (рот открыт / глаза закрыты) — тогда они важнее наложений.
// fit — во сколько раз увеличить атлас, чтобы фигура была ростом с Бипа (atlas_rig.py считает сам).
import React from 'react';
import {Img, staticFile} from 'remotion';
import {L} from '../theme';
import type {HeroRender} from './HeroSticker';
import {mouthAt} from './Mascot';

type Box = [number, number, number, number];
export type AtlasPose = {box: Box; anchor: [number, number]; eyes?: [number, number][]; mouth?: [number, number]; mouthW?: number; skin?: string; talk?: Box; blink?: Box};
export type AtlasRig = {atlas: string; width: number; height: number; fit?: number; poses: Record<string, AtlasPose>};

export const atlasHero =
  (rig: AtlasRig): HeroRender =>
  ({t, fps, pose, words, amp, x, y, scale}) => {
    const p = rig.poses[pose] ?? rig.poses.neutral ?? Object.values(rig.poses)[0];
    if (!p) return null;
    const s = rig.fit ? rig.fit * (scale / L.hero.scale) : scale;
    const m = mouthAt(t, fps, words, amp);
    const blink = (t + 0.6) % 3.7 < 0.1 && pose !== 'celebrate';
    const box = blink && p.blink ? p.blink : m.open > 0.35 && p.talk ? p.talk : p.box;
    const [bx, by, bw, bh] = box;
    const ax = p.anchor[0] - p.box[0];
    const ay = p.anchor[1] - p.box[1];
    const ox = (v: number) => v - p.box[0];
    const oy = (v: number) => v - p.box[1];
    const mw = p.mouthW ?? bw * 0.1;
    const showMouth = !p.talk && p.mouth && m.open > 0.08;
    const mW = mw * (m.round ? 0.62 : 1);
    const mH = mw * (0.14 + 0.5 * m.open);
    return (
      <div style={{position: 'absolute', left: x - ax * s, top: y - ay * s, width: bw * s, height: bh * s}}>
        <div style={{position: 'relative', width: bw, height: bh, transform: `scale(${s})`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            <Img src={staticFile(rig.atlas)} style={{position: 'absolute', left: -bx, top: -by, width: rig.width, height: rig.height, maxWidth: 'none'}} />
          </div>
          <svg width={bw} height={bh} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            {showMouth && p.mouth && (
              <g transform={`translate(${ox(p.mouth[0])} ${oy(p.mouth[1])})`}>
                <ellipse rx={mW / 2} ry={mH / 2} fill="#2a0f12" />
                {mH > mw * 0.35 && <ellipse cy={mH * 0.22} rx={mW * 0.3} ry={mH * 0.18} fill="#e76a7c" />}
              </g>
            )}
            {blink && !p.blink && p.eyes && p.skin &&
              p.eyes.map(([ex, ey], i) => (
                <g key={i} transform={`translate(${ox(ex)} ${oy(ey)})`}>
                  <ellipse rx={mw * 0.42} ry={mw * 0.3} fill={p.skin} />
                  <path d={`M${-mw * 0.38} 0 Q0 ${mw * 0.16} ${mw * 0.38} 0`} fill="none" stroke="#2a1a14" strokeWidth={Math.max(2, mw * 0.07)} strokeLinecap="round" />
                </g>
              ))}
          </svg>
        </div>
      </div>
    );
  };
