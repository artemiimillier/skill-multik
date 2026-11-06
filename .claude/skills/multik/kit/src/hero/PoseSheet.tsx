// Лист поз героя: все позы рядом с подписями. Композиция «Poses» — для подбора трека и проверки своего героя.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {GridPaper} from '../lib/frame';
import {FONT, T} from '../theme';
import {useFontsReady} from '../Film';
import {Mascot, POSES} from './Mascot';

const RU: Record<string, string> = {
  neutral: 'спокойно',
  palm: 'объясняет',
  point: 'показывает',
  up: 'главное / идея',
  celebrate: 'восторг, итог',
  think: 'сомнение',
  surprise: 'неожиданно',
  shrug: 'не нужно',
  wink: 'готово',
};

export const PoseSheet = () => {
  useFontsReady();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cols = 5;
  const cw = 324;
  const ch = 540;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: T.paper}}>
      <GridPaper t={0} />
      {POSES.map((pose, i) => {
        const cx = (i % cols) * cw + cw / 2;
        const top = Math.floor(i / cols) * ch;
        return (
          <div key={pose} style={{position: 'absolute', left: (i % cols) * cw, top, width: cw, height: ch, overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, filter: 'drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)'}}>
              <div style={{position: 'absolute', left: -((i % cols) * cw), top: -top}}>
                <Mascot t={t} fps={fps} pose={pose} prev={pose} k={1} words={[]} amp={[]} x={cx} y={top + 250} scale={0.52} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 16, top: 14, fontFamily: FONT.mono, fontSize: 24, color: T.ink, background: '#fff', padding: '2px 10px', borderRadius: 8, border: `2px solid ${T.ink}`}}>{pose}</div>
            <div style={{position: 'absolute', left: 18, top: 54, fontFamily: FONT.accent, fontWeight: 700, fontSize: 34, color: T.accent}}>{RU[pose]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
