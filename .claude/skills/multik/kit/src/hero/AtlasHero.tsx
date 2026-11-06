// Свой герой из PNG-атласа поз (необязательно). Нарисуй/сгенерируй позы на одном прозрачном PNG,
// положи его в public/ и опиши в rig.json — см. README раздел «Свой герой».
//
// rig.json:
// {
//   "atlas": "hero/atlas.png", "width": 4096, "height": 2048,
//   "poses": {
//     "neutral": {"box": [0, 0, 600, 700], "anchor": [300, 260], "talk": [600, 0, 600, 700], "blink": [1200, 0, 600, 700]},
//     "point":   {"box": [0, 700, 600, 700], "anchor": [300, 260]}
//   }
// }
// box — кадр позы в атласе [x, y, w, h]; anchor — точка между глазами в координатах атласа;
// talk / blink — необязательные кадры той же позы и того же размера: рот открыт / глаза закрыты.
import React from 'react';
import {Img, staticFile} from 'remotion';
import type {HeroRender} from './HeroSticker';
import {mouthAt} from './Mascot';

type Box = [number, number, number, number];
export type AtlasRig = {
  atlas: string;
  width: number;
  height: number;
  poses: Record<string, {box: Box; anchor: [number, number]; talk?: Box; blink?: Box}>;
};

export const atlasHero =
  (rig: AtlasRig): HeroRender =>
  ({t, fps, pose, words, amp, x, y, scale}) => {
    const p = rig.poses[pose] ?? rig.poses.neutral ?? Object.values(rig.poses)[0];
    if (!p) return null;
    const m = mouthAt(t, fps, words, amp);
    const blink = (t + 0.6) % 3.7 < 0.1;
    const box = blink && p.blink ? p.blink : m.open > 0.35 && p.talk ? p.talk : p.box;
    const [bx, by, bw, bh] = box;
    // кадры talk/blink совпадают по раскладке с box, поэтому якорь берём смещённым на ту же величину
    const ax = p.anchor[0] - p.box[0];
    const ay = p.anchor[1] - p.box[1];
    return (
      <div style={{position: 'absolute', left: x - ax * scale, top: y - ay * scale, width: bw * scale, height: bh * scale, overflow: 'hidden'}}>
        <div style={{position: 'relative', width: bw, height: bh, transform: `scale(${scale})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Img src={staticFile(rig.atlas)} style={{position: 'absolute', left: -bx, top: -by, width: rig.width, height: rig.height, maxWidth: 'none'}} />
        </div>
      </div>
    );
  };
