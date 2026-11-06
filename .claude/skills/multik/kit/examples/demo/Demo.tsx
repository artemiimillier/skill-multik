// Демо-ролик: какие сцены, трек поз героя, шторки между главами. Время — только через якоря из cues.json.
import React from 'react';
import {Film, type Shutter} from '../../src/Film';
import type {Track} from '../../src/hero/HeroSticker';
import type {FilmProps} from '../../src/types';
import {Finale, Hook, Roadmap, Step1, Step2, Step3} from './scenes';

type C = Record<string, number>;

// Поза меняется примерно раз в секунду по смыслу слова (таблица «смысл → поза» — в SKILL.md).
const track = (c: C): Track => [
  [0, 'palm'],
  [c.mult, 'point'],
  [c.nikto, 'surprise'],
  [c.kak, 'shrug'],
  [c.vot, 'palm'],
  [c.tri, 'up'],
  [c.shaga, 'wink'],
  [c.p1, 'up'],
  [c.polozhi, 'palm'],
  [c.skill, 'point'],
  [c.papku, 'palm'],
  [c.proekta, 'wink'],
  [c.p2, 'up'],
  [c.napishi, 'palm'],
  [c.claude, 'point'],
  [c.odnu, 'up'],
  [c.sdelai, 'point'],
  [c.tekstu, 'wink'],
  [c.p3, 'up'],
  [c.razlozhit, 'palm'],
  [c.slovam, 'point'],
  [c.narisuet, 'palm'],
  [c.scenu, 'point'],
  [c.sam, 'think'],
  [c.kadry, 'wink'],
  [c.vot2, 'celebrate'],
  [c.stav, 'palm'],
  [c.probui, 'celebrate'],
];

// Полутоновая шторка перед крупными шагами (в темноте — плашка шага) и короткая «по углам» перед итогом.
const shutters = (c: C): Shutter[] => [
  {at: c.p1 - 0.42, badge: 1, total: 3, dir: 'right'},
  {at: c.p3 - 0.25, badge: 3, total: 3, dir: 'left'},
  {at: c.vot2 - 0.3, dir: 'corners', dur: 0.22, hold: 0.04},
];
const flashes = (c: C) => [c.vot2 - 0.12];
const glow = (t: number, c: C) => (t >= c.vot2 ? 0.8 : 0);
const board = (c: C) => c.vot;

export const Demo: React.FC<FilmProps> = (p) => (
  <Film p={p} boardUntil={board} track={track} shutters={shutters} flashes={flashes} glow={glow}>
    <Hook />
    <Roadmap />
    <Step1 />
    <Step2 />
    <Step3 />
    <Finale />
  </Film>
);
