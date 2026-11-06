#!/usr/bin/env node
// Кадры для проверки глазами до полного рендера: один бандл, один браузер, много кадров + листы-превью.
//
//   node scripts/stills.mjs Demo out/stills --cues            кадр через 0,25 с после каждого якоря
//   node scripts/stills.mjs Demo out/stills --every 0.5       кадр каждые полсекунды
//   node scripts/stills.mjs Demo out/stills --frames 30,90,150
//   ... --props films/my/props.json   другой props.json для той же композиции
//   ... --sheet                       ещё и листы по 6 кадров (нужен ffmpeg)
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {bundle} = require('@remotion/bundler');
const {renderStill, selectComposition, openBrowser} = require('@remotion/renderer');

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const [id, outDir] = args;
if (!id || !outDir) {
  console.error('usage: node scripts/stills.mjs <Composition> <outDir> [--cues | --every S | --frames a,b] [--props p.json] [--sheet]');
  process.exit(2);
}
const opt = (k) => {
  const i = args.indexOf(k);
  return i < 0 ? undefined : args[i + 1];
};
const has = (k) => args.includes(k);

const serveUrl = await bundle({entryPoint: path.join(KIT, 'src/index.ts'), publicDir: path.join(KIT, 'public')});
const propsPath = opt('--props');
const inputProps = propsPath ? JSON.parse(fs.readFileSync(propsPath, 'utf8')) : undefined;
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
try {
  const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser, logLevel: 'warn'});
  const fps = composition.fps;
  const props = inputProps ?? composition.defaultProps;
  const last = composition.durationInFrames - 1;
  let frames;
  if (opt('--frames')) frames = opt('--frames').split(',').map(Number);
  else if (opt('--every')) {
    const s = Number(opt('--every'));
    frames = [];
    for (let x = 0; x <= last / fps; x += s) frames.push(Math.round(x * fps));
  } else if (has('--cues') && props?.cues) {
    frames = Object.values(props.cues).map((s) => Math.round((s + 0.25) * fps));
  } else frames = [0, Math.round(last / 2), last];
  frames = [...new Set(frames.map((f) => Math.max(0, Math.min(last, f))))].sort((a, b) => a - b);
  fs.mkdirSync(outDir, {recursive: true});
  const files = [];
  for (const frame of frames) {
    const output = path.join(outDir, String(frame).padStart(5, '0') + '.png');
    await renderStill({serveUrl, composition, inputProps: props, frame, imageFormat: 'png', output, puppeteerInstance: browser, logLevel: 'warn', overwrite: true});
    files.push(output);
    process.stdout.write(`${output}  (${(frame / fps).toFixed(2)} с)\n`);
  }
  if (has('--sheet')) {
    for (let i = 0; i < files.length; i += 6) {
      const part = files.slice(i, i + 6);
      const sheet = path.join(outDir, `sheet-${String(i / 6 + 1).padStart(2, '0')}.jpg`);
      const inputs = part.flatMap((f) => ['-i', f]);
      const scaled = part.map((_, j) => `[${j}:v]scale=360:-1[v${j}]`).join(';');
      const stack = part.map((_, j) => `[v${j}]`).join('') + `hstack=inputs=${part.length}`;
      execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', part.length > 1 ? `${scaled};${stack}` : `[0:v]scale=360:-1`, '-q:v', '3', sheet]);
      process.stdout.write(`${sheet}\n`);
    }
  }
} finally {
  await browser.close({silent: true});
}
