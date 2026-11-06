// Сцены демо-ролика. Это пример, а не обязательный сценарий: для своего текста сцены пишутся заново
// по раскадровке (storyboard.md), рамка кадра и библиотека src/lib остаются.
// Каждая сцена сама решает, когда её показывать, и ссылается только на якоря c.имя из cues.json.
import React from 'react';
import {
  AgentHello,
  AppWindow,
  ArrowUp,
  Caret,
  ChalkFrame,
  Cursor,
  Display,
  Eyebrow,
  FileCard,
  FileWindow,
  Flag,
  Folder,
  FONT,
  Frame,
  HT,
  InputBar,
  Key,
  Magnifier,
  Mark,
  MiniScene,
  PaperSheet,
  Particles,
  Pill,
  Rays,
  Ring,
  Road,
  Spinner,
  Stamp,
  StepBadge,
  StepCard,
  T,
  Tape,
  Tip,
  Underline,
  curPath,
  ease,
  enter,
  lin,
  mix,
  pop,
  shake,
  slideIn,
  smooth,
  typed,
  useFilm,
  type Step,
} from '../../src/lib';

const slov = (n: number) => {
  const a = n % 10;
  const b = n % 100;
  return a === 1 && b !== 11 ? 'слово' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'слова' : 'слов';
};
const clean = (s: string) => s.replace(/[«»".,:;!?—–]/g, '').trim();

// ───────────── 01 · хук: грифельная доска ─────────────
/** Меловой штрих: d — путь, k — сколько нарисовано (0..1). */
const Chalk = ({d, k, w = 6, color = T.chalk}: {d: string; k: number; w?: number; color?: string}) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
);
const DOODLES = [
  ['M110 86 a34 34 0 1 0 0.1 0', 'M110 154 V250', 'M58 196 L110 178 L162 140', 'M110 250 L74 318 M110 250 L146 318'],
  ['M30 96 h160 a10 10 0 0 1 10 10 v96 a10 10 0 0 1 -10 10 h-160 a10 10 0 0 1 -10 -10 v-96 a10 10 0 0 1 10 -10z', 'M20 128 H200', 'M118 150 l0 58 l15 -14 l12 26 l10 -5 l-12 -25 l20 0 Z', 'M40 262 H180 M40 294 H140'],
  ['M110 84 L131 146 L196 148 L144 186 L163 250 L110 213 L57 250 L76 186 L24 148 L89 146 Z', 'M40 290 L60 270 M180 290 L160 270 M110 312 V284'],
];
export const Hook = () => {
  const {t, c} = useFilm();
  if (t >= c.vot) return null;
  const sh = shake(t, c.mult, 10) + shake(t, c.nikto, 16) + shake(t, c.kak, 12);
  const dim = t >= c.nikto ? mix(1, 0.4, lin(t, c.nikto, c.nikto + 0.2)) : 1;
  const frames = [
    {x: 110, at: 0.05},
    {x: 430, at: 0.32},
    {x: 750, at: 0.59},
  ];
  const cardK = pop(t, c.mult, 16, 11);
  const sheetK = pop(t, c.nikto, 18, 12);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${sh}px,${sh * 0.4}px)`}}>
      <Eyebrow text="01 · хук" light />
      <div style={{position: 'absolute', inset: 0, opacity: dim}}>
        {frames.map((f, i) => (
          <ChalkFrame key={i} x={f.x} y={590} w={220} progress={ease(t, f.at, f.at + 0.35)}>
            <svg width={220} height={352} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'url(#chalk)'}}>
              {DOODLES[i].map((d, j) => (
                <Chalk key={j} d={d} k={ease(t, f.at + 0.22 + j * 0.08, f.at + 0.5 + j * 0.08)} color={i === 1 && j === 2 ? T.accentOnDark : T.chalk} />
              ))}
            </svg>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: -46, textAlign: 'center', fontFamily: FONT.accent, fontWeight: 700, fontSize: 36, color: T.chalk, opacity: lin(t, f.at + 0.3, f.at + 0.45)}}>кадр {i + 1}</div>
          </ChalkFrame>
        ))}
        {/* «объясняющие» — меловые стрелки связывают кадры в историю */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'url(#chalk)'}}>
          {[340, 660].map((x, i) => (
            <Chalk key={x} d={`M${x} 770 Q${x + 40} 740 ${x + 78} 770 M${x + 60} 752 L${x + 80} 772 L${x + 56} 786`} k={ease(t, c.obyasn + i * 0.15, c.obyasn + 0.3 + i * 0.15)} w={7} />
          ))}
        </svg>
        {/* «мультики» — карточка на скотче */}
        {t >= c.mult && (
          <div style={{position: 'absolute', left: 210, top: 1000, zIndex: 12, transform: `scale(${mix(1.5, 1, cardK)}) rotate(${mix(6, -4, cardK)}deg)`, opacity: lin(t, c.mult, c.mult + 0.06)}}>
            <div style={{position: 'relative', width: 660, height: 300, background: T.card, boxShadow: '0 18px 30px #0009'}}>
              <div style={{position: 'absolute', left: 36, top: 34, width: 124, height: 232, borderRadius: 22, border: `7px solid ${T.ink}`, background: T.accentSoft}}>
                <svg width={110} height={218} viewBox="0 0 110 218">
                  <path d="M40 84 L78 109 L40 134Z" fill={T.accent} />
                </svg>
              </div>
              <Display segs={[{s: 'Мультик'}]} t={t} at={c.mult + 0.05} x={196} y={50} size={108} stagger={0.03} />
              <div style={{position: 'absolute', left: 200, top: 186, fontFamily: FONT.mono, fontSize: 24, color: T.mute}}>// 9:16 · 30 сек</div>
              <Underline x={200} y={236} w={300} t={t} at={c.mult + 0.35} sw={9} />
            </div>
            <Tape x={30} y={6} rot={-35} />
            <Tape x={636} y={10} rot={30} />
          </div>
        )}
      </div>
      {/* «никто не говорит, как» — лист перекрывает доску */}
      {t >= c.nikto && (
        <div style={{position: 'absolute', left: 80, top: 860, zIndex: 30, transform: `scale(${mix(1.8, 1, sheetK)}) rotate(${mix(-9, -2, sheetK)}deg)`, opacity: lin(t, c.nikto, c.nikto + 0.05)}}>
          <PaperSheet w={920} h={500}>
            <Display segs={[{s: 'Никто '}, {s: 'не говорит', at: c.govorit}]} t={t} at={c.nikto} x={56} y={64} size={92} stagger={0.03} />
            <Display segs={[{s: 'Как?', accent: true}]} t={t} at={c.kak} x={50} y={168} size={260} stagger={0.05} />
            <Underline x={64} y={442} w={470} t={t} at={c.sobrat} sw={10} />
          </PaperSheet>
          <Tape x={460} y={0} rot={-3} w={150} />
        </div>
      )}
      <Ring x={395} y={1170} r={150} rx={290} t={t} at={c.kak + 0.12} dur={1.2} w={8} />
      {/* «собрать» — меловые вопросы вокруг */}
      {[
        [70, 520, -12],
        [960, 560, 10],
        [990, 900, 14],
        [40, 1430, -8],
      ].map(([x, y, r], i) => {
        const at = c.sobrat + i * 0.07;
        if (t < at) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, fontFamily: FONT.accent, fontWeight: 700, fontSize: 110, color: T.chalk, transform: `rotate(${r}deg) scale(${pop(t, at, 18, 11)})`, opacity: 0.85, zIndex: 31}}>
            ?
          </div>
        );
      })}
    </div>
  );
};

// ───────────── 02 · маршрут: три шага на дороге ─────────────
export const STEPS: Step[] = [
  {n: 1, title: 'Положи скилл', sub: '.claude/skills', icon: '⇣'},
  {n: 2, title: 'Одна строка', sub: 'опиши ролик', icon: '⌨'},
  {n: 3, title: 'Он делает сам', sub: 'сцены + проверка', icon: '✓'},
];
export const CELL: [number, number][] = [
  [118, 775],
  [560, 970],
  [118, 1165],
];
export const ROAD = 'M-20 852 H860 Q960 852 960 950 Q960 1046 860 1046 H170 Q70 1046 70 1142 Q70 1240 170 1240 H740';

export const Roadmap = () => {
  const {t, c} = useFilm();
  if (t < c.vot || t >= c.p1 - 0.2) return null;
  const hops = [c.shaga, c.shaga + 0.1, c.shaga + 0.2];
  const cur = hops.filter((h) => t >= h).length - 1;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Eyebrow text="02 · маршрут" />
      <Road d={ROAD} k={ease(t, c.vot, c.vot + 0.3)} progress={ease(t, c.shaga, c.shaga + 0.35) * 0.45} />
      {STEPS.map((s, j) => {
        const [gx, gy] = CELL[j];
        const k = ease(t, c.vot + 0.04 * j, c.vot + 0.36 + 0.05 * j);
        const fx = 360 + j * 20;
        const fy = 1300 - j * 16;
        return (
          <div key={s.n} style={{position: 'absolute', left: mix(fx, gx, k), top: mix(fy, gy, k), transform: `rotate(${mix(-16 + j * 12, 0, k)}deg) scale(${mix(0.6, 1, k) * (cur === j ? 1.05 : 1)})`, opacity: lin(t, c.vot + 0.04 * j, c.vot + 0.1 + 0.04 * j), zIndex: 10 + j}}>
            <StepCard s={s} hi={cur === j} />
          </div>
        );
      })}
      <Display segs={[{s: '3', accent: true}, {s: ' шага'}]} t={t} at={c.tri} x={300} y={560} size={150} />
      <Ring x={340} y={640} r={96} t={t} at={c.tri + 0.08} dur={0.6} />
    </div>
  );
};

// ───────────── шаг 1 · положи скилл в папку проекта ─────────────
// Окно файлов: левый верх (130, 660), 820×520; содержимое начинается с (351, 724).
const WX = 130;
const WY = 660;
const CX = WX + 820 * 0.27;
const CY = WY + 64;
export const Step1 = () => {
  const {t, c} = useFilm();
  if (t < c.p1 - 0.05 || t >= c.p2 - 0.05) return null;
  const win = c.p1 + 0.3;
  const grab = c.skill + 0.12;
  const drop = c.papku + 0.32;
  const [mx, my] = curPath(t, [
    [900, 1260, win],
    [740, 960, c.skill],
    [726, 948, grab],
    [CX + 120, CY + 90, drop],
    [CX + 300, CY + 300, c.proekta + 0.3],
  ]);
  const holding = t >= grab && t < drop;
  const fileK = pop(t, c.polozhi, 16, 10);
  const inK = ease(t, drop, drop + 0.22);
  const fx = holding || t >= drop ? mx - 70 : 670;
  const fy = holding || t >= drop ? my - 40 : 905;
  const open = t >= c.papku ? Math.min(ease(t, c.papku, c.papku + 0.2), 1 - ease(t, drop + 0.15, drop + 0.4)) : 0;
  const pathTxt = (t >= c.papku ? ' › .claude › skills' : '') + (t >= c.proekta ? ' › ' + typed('multik', t, c.proekta, c.proekta + 0.25) : '');
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Eyebrow text="03 · шаг 1 · скилл" />
      <div style={{position: 'absolute', left: WX, top: WY, transform: `scale(${mix(0.6, 1, pop(t, win, 14, 10))})`, transformOrigin: '50% 50%', opacity: lin(t, win, win + 0.08), display: t < win ? 'none' : undefined}}>
        <FileWindow w={820} h={520} title="мой-проект" side={['Недавние', 'Проекты', 'Документы', 'Загрузки']} active={1} path={<span>мой-проект<b style={{color: T.accent}}>{pathTxt}</b></span>}>
          <div style={{position: 'absolute', left: 30, top: 36, textAlign: 'center', transform: `scale(${1 + 0.08 * Math.sin(lin(t, drop, drop + 0.3) * Math.PI)})`}}>
            <Folder w={180} open={open} label=".claude" labelSize={20} />
          </div>
          <div style={{position: 'absolute', left: 240, top: 36}}>
            <Folder w={180} label="src" labelSize={20} />
          </div>
          <div style={{position: 'absolute', left: 452, top: 26}}>
            <FileCard name="README.md" w={104} />
          </div>
        </FileWindow>
        {t >= c.proekta && (
          <div style={{position: 'absolute', right: -26, bottom: -30}}>
            <Mark kind="check" size={100} k={pop(t, c.proekta + 0.1)} />
          </div>
        )}
      </div>
      {/* SKILL.md: появляется, курсор хватает и несёт в папку .claude */}
      {t >= c.polozhi && t < drop + 0.25 && (
        <div style={{position: 'absolute', left: fx, top: fy, zIndex: 60, transform: `scale(${mix(0.4, 1, fileK) * mix(1, 0.25, inK)}) rotate(${holding ? -6 : 0}deg)`, transformOrigin: '30% 30%', opacity: 1 - lin(t, drop + 0.12, drop + 0.25)}}>
          <FileCard name="SKILL.md" w={150} accent />
        </div>
      )}
      {t >= win && t < c.proekta + 0.6 && <Cursor x={mx} y={my} t={t} click={t < drop ? grab : drop} hand={holding} />}
      <StepBadge n={1} total={3} t={t} a={c.p1} go={c.polozhi} to={[905, 608]} />
      <Display segs={[{s: 'Положи '}, {s: 'скилл', accent: true, at: c.skill}]} t={t} at={c.polozhi} size={108} out={c.papku - 0.05} />
      <Display segs={[{s: 'В папку '}, {s: 'проекта', accent: true, at: c.proekta}]} t={t} at={c.papku} size={104} />
      <Ring x={CX + 120} y={CY + 100} r={120} t={t} at={c.proekta + 0.05} dur={0.8} />
      {t >= c.papku && (
        <div style={slideIn(t, c.papku, -60, 0)}>
          <Tip y={1236}>
            <div style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 28, display: 'flex', gap: 12, alignItems: 'center'}}>
              <span style={{display: 'inline-block', width: 30, height: 22, background: T.folder, border: `3px solid ${T.ink}`, borderRadius: 4}} />
              .claude/skills/<span style={{color: T.accent}}>multik</span>
            </div>
          </Tip>
        </div>
      )}
    </div>
  );
};

// ───────────── шаг 2 · одна строка ─────────────
export const Step2 = () => {
  const {t, c, p} = useFilm();
  if (t < c.p2 - 0.05 || t >= c.p3) return null;
  const win = c.p2 + 0.25;
  const send = c.tekstu + 0.24;
  const big = t >= c.stroku && t < send + 0.2;
  // промпт печатается в такт речи: каждое слово — за время своего произнесения
  const i0 = p.words.findIndex((w) => w.start >= c.sdelai - 0.001);
  const i1 = p.words.findIndex((w) => w.start >= c.tekstu - 0.001);
  const typedWords = p.words.slice(i0, i1 + 1).filter((w) => t >= w.start);
  const last = typedWords.length - 1;
  const parts = typedWords.map((w, j) => (j === last ? typed(clean(w.text), t, w.start, w.end) : clean(w.text)));
  const sendK = ease(t, send, send + 0.2);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Eyebrow text="04 · шаг 2 · одна строка" />
      <div style={{position: 'absolute', left: 130, top: 665, transform: `scale(${mix(0.6, 1, pop(t, win, 14, 10))})`, opacity: lin(t, win, win + 0.08), display: t < win ? 'none' : undefined}}>
        <AppWindow w={820} h={430} title="Claude Code · мой-проект" hi={big}>
          {t < send + 0.1 ? (
            <AgentHello text="Что делаем?" />
          ) : (
            <div style={{padding: '22px 26px', fontSize: 26}}>
              <div style={{marginLeft: 'auto', width: 'fit-content', maxWidth: 560, background: T.win3, borderRadius: 18, padding: '12px 20px', color: '#fff', transform: `scale(${pop(t, send + 0.1, 16, 10)})`, transformOrigin: '100% 0'}}>сделай мультик по этому тексту</div>
              {t >= send + 0.3 && (
                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, color: T.winText}}>
                  <Spinner t={t} />
                  {typed('Раскладываю текст по словам…', t, send + 0.3, send + 0.8)}
                </div>
              )}
            </div>
          )}
        </AppWindow>
      </div>
      <Ring x={392} y={697} r={34} rx={210} t={t} at={c.claude} dur={0.7} w={5} />
      <StepBadge n={2} total={3} t={t} a={c.p2} go={c.napishi} to={[905, 613]} />
      <Display segs={[{s: 'Напиши'}]} t={t} at={c.napishi} size={112} out={c.odnu - 0.05} />
      <Display segs={[{s: 'Одну', accent: true}, {s: ' строку', at: c.stroku}]} t={t} at={c.odnu} size={112} />
      {/* огромная строка ввода «напиши это» */}
      {big && (
        <div style={{position: 'absolute', left: 140, top: mix(1140, 760, sendK), zIndex: 40, transform: `scale(${pop(t, c.stroku, 16, 10) * mix(1, 0.5, sendK)})`, transformOrigin: '0 50%', opacity: 1 - sendK}}>
          <InputBar w={800} h={116}>
            <span style={{fontWeight: 300, color: T.accentOnDark}}>›</span>
            <span style={{fontSize: 40}}>
              {parts.map((s, j) => (
                <span key={j} style={j === parts.length - 1 && t >= c.tekstu ? {color: T.accentOnDark, borderBottom: `5px solid ${T.accentOnDark}`} : undefined}>
                  {s}
                  {j < parts.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
            <Caret t={t} />
            <span style={{marginLeft: 'auto'}}>
              <Key k="↵" hi={t >= c.tekstu + 0.12} />
            </span>
          </InputBar>
        </div>
      )}
      {t >= c.stroku && t < send + 0.2 && (
        <>
          <ArrowUp x={190} y={1286} h={84} t={t} at={c.stroku + 0.15} />
          <Display segs={[{s: 'Напиши это', accent: true}]} t={t} at={c.stroku + 0.2} x={236} y={1300} size={62} stagger={0.02} />
        </>
      )}
      {t >= c.sdelai && (
        <div style={{position: 'absolute', left: 110, top: 1420, zIndex: 40, ...slideIn(t, c.sdelai, -50, 0)}}>
          <Pill size={40} accent={t >= c.tekstu}>
            {typedWords.length} {slov(typedWords.length)}
          </Pill>
        </div>
      )}
      <Particles x={540} y={1200} t={t} at={send} n={16} spread={240} colors={[T.accent, T.ink]} dur={0.6} />
    </div>
  );
};

// ───────────── шаг 3 · он делает сам ─────────────
const CHIPS = ['Все', 'хотят', 'объясняющие', 'мультики', 'но', 'никто'];
export const Step3 = () => {
  const {t, c} = useFilm();
  if (t < c.p3 - 0.05 || t >= c.vot2 - 0.1) return null;
  const win = c.p3 + 0.25;
  const rows = [
    {s: 'Раскадровка по словам', on: c.razlozhit, done: c.slovam + 0.35},
    {s: 'Сцены', on: c.narisuet, done: c.scenu + 0.35},
    {s: 'Проверка кадров', on: c.proverit, done: c.kadry + 0.25},
  ];
  const doneN = rows.filter((r) => t >= r.done).length;
  const mode = t < c.narisuet ? 0 : t < c.proverit ? 1 : 2;
  const magX = mix(-20, 700, smooth(t, c.proverit, c.kadry + 0.1));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Eyebrow text="05 · шаг 3 · он делает сам" />
      <div style={{position: 'absolute', left: 130, top: 660, transform: `scale(${mix(0.6, 1, pop(t, win, 14, 10))})`, opacity: lin(t, win, win + 0.08), display: t < win ? 'none' : undefined}}>
        <AppWindow w={820} h={380} title="Claude Code · мультик" foot={false}>
          <div style={{padding: '18px 28px', fontSize: 27}}>
            <div style={{display: 'flex', color: '#cfcdd6', fontWeight: 600}}>
              <span style={{color: T.accentOnDark}}>✳&nbsp;</span>
              {doneN === 3 ? 'Мультик готов' : 'Собираю мультик…'}
              <span style={{marginLeft: 'auto', fontFamily: FONT.mono}}>{doneN}/3</span>
            </div>
            {rows.map((r, i) => {
              const ok = t >= r.done;
              const act = t >= r.on && !ok;
              return (
                <div key={i} style={{marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', borderRadius: 12, background: act ? '#1f2a5c' : 'none', color: ok || act ? '#fff' : '#77757e', whiteSpace: 'nowrap'}}>
                  {act ? (
                    <Spinner t={t} size={32} />
                  ) : (
                    <span style={{width: 32, height: 32, borderRadius: '50%', flex: 'none', background: ok ? T.accentOnDark : 'none', border: ok ? 'none' : '3px dotted #666', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.win, fontSize: 20, fontWeight: 800, transform: `scale(${ok ? pop(t, r.done) : 1})`}}>
                      {ok ? '✓' : ''}
                    </span>
                  )}
                  <b style={{fontWeight: 700}}>{r.s}</b>
                  {act && <span style={{marginLeft: 'auto', width: 2, height: 4}} />}
                </div>
              );
            })}
            <div style={{marginTop: 14, fontSize: 20, color: '#8e8c95', fontFamily: FONT.mono}}>⁘ работает · {(0.4 + Math.max(0, t - win) * 0.9).toFixed(1)}k токенов</div>
          </div>
        </AppWindow>
      </div>
      <StepBadge n={3} total={3} t={t} a={c.p3} go={c.razlozhit} to={[905, 608]} />
      {/* карточка текущего действия под окном */}
      {t >= c.razlozhit && (
        <div style={{position: 'absolute', left: 130, top: 1075, ...enter(t, c.razlozhit, 1e9, 0.7)}}>
          <div style={{position: 'relative', width: 820, height: 270}}>
            <HT w={820} h={270} r={22} op={0.45} />
            <div style={{position: 'absolute', inset: 0, background: '#fff', border: `3px solid ${T.ink}`, borderRadius: 22, overflow: 'hidden'}}>
              {mode === 0 && (
                <div style={{position: 'absolute', left: 24, top: 22, right: 24, display: 'flex', gap: 12, flexWrap: 'nowrap'}}>
                  {CHIPS.map((w, i) => {
                    const at = c.razlozhit + 0.08 + i * 0.09;
                    const fr = c.slovam + i * 0.06;
                    return (
                      <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: lin(t, at, at + 0.05), transform: `translateY(${(1 - pop(t, at, 16, 10)) * -40}px)`}}>
                        <span style={{fontFamily: FONT.ui, fontWeight: 700, fontSize: 25, padding: '6px 12px', borderRadius: 10, background: w === 'мультики' ? T.accent : T.accentSoft, color: w === 'мультики' ? '#fff' : T.ink, whiteSpace: 'nowrap'}}>{w}</span>
                        <svg width={20} height={28} style={{opacity: lin(t, fr, fr + 0.08)}}>
                          <path d="M10 2 V22 M3 15 L10 23 L17 15" fill="none" stroke={T.mute} strokeWidth={3} strokeLinecap="round" />
                        </svg>
                        <div style={{transform: `scale(${pop(t, fr, 16, 10)})`}}>
                          <MiniScene kind={i} w={72} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {mode >= 1 && (
                <div style={{position: 'absolute', left: 26, top: 30, display: 'flex', gap: 16}}>
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const at = c.narisuet + i * 0.11;
                    const chk = c.proverit + 0.1 + i * 0.11;
                    return (
                      <div key={i} style={{position: 'relative', transform: `scale(${pop(t, at, 16, 10)})`}}>
                        <MiniScene kind={i} w={112} />
                        {mode === 2 && t >= chk && (
                          <div style={{position: 'absolute', right: -12, top: -12}}>
                            <Mark kind="check" size={42} k={pop(t, chk)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {mode === 2 && <Magnifier x={magX + 60} y={110} r={70} />}
            </div>
          </div>
        </div>
      )}
      <Ring x={130 + 26 + 3 * 128 + 56} y={1075 + 30 + 84} r={110} t={t} at={c.scenu + 0.05} dur={0.6} />
      <Stamp text="ОК" t={t} at={c.kadry + 0.05} x={760} y={1215} size={110} rot={-10} />
      <Display segs={[{s: 'По '}, {s: 'словам', accent: true, at: c.slovam}]} t={t} at={c.razlozhit} size={112} out={c.narisuet - 0.05} />
      <Display segs={[{s: 'Каждая '}, {s: 'сцена', accent: true, at: c.scenu}]} t={t} at={c.narisuet} size={112} out={c.sam - 0.05} />
      <Display segs={[{s: 'Сам '}, {s: 'проверит', accent: true, at: c.proverit}]} t={t} at={c.sam} size={112} />
      {t >= c.proverit && (
        <div style={{position: 'absolute', left: 110, top: 1400, zIndex: 40, ...slideIn(t, c.proverit, -50, 0)}}>
          <Pill size={40} accent={t >= c.kadry}>
            кадров: {Math.round(mix(0, 48, ease(t, c.proverit, c.kadry + 0.2)))}
          </Pill>
        </div>
      )}
    </div>
  );
};

// ───────────── 06 · весь путь ─────────────
export const Finale = () => {
  const {t, c, p} = useFilm();
  if (t < c.vot2 - 0.1) return null;
  const a = c.vot2;
  const end = p.durationInFrames / 30;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Eyebrow text="06 · весь путь" />
      <Road d={ROAD} k={1} progress={ease(t, a + 0.05, c.vsyo + 0.3)} />
      {STEPS.map((s, j) => {
        const [gx, gy] = CELL[j];
        const at = a + 0.12 + j * 0.15;
        return (
          <div key={s.n} style={{position: 'absolute', left: gx, top: gy, transform: `scale(${mix(0.7, 1, pop(t, a + j * 0.04, 16, 10)) * (1 + 0.05 * Math.sin(lin(t, at, at + 0.25) * Math.PI))})`, zIndex: 10 + j}}>
            <StepCard s={s} done={t >= at ? pop(t, at) : 0} />
          </div>
        );
      })}
      <Flag x={760} y={1250} k={ease(t, c.vsyo, c.vsyo + 0.3)} size={80} />
      <Frame x={92} y={748} w={890} h={600} t={t} at={c.vsyo + 0.05} r={26} sw={6} />
      <Stamp text="ГОТОВО" t={t} at={c.vsyo + 0.15} x={770} y={790} size={84} rot={8} />
      <Display segs={[{s: 'Вот и '}, {s: 'всё', accent: true, at: c.vsyo}]} t={t} at={a} size={118} out={c.stav - 0.05} />
      <Display segs={[{s: 'Ставь и '}, {s: 'пробуй', accent: true, at: c.probui}]} t={t} at={c.stav} size={112} />
      {t >= c.stav && (
        <div style={slideIn(t, c.stav, -60, 0)}>
          <Tip y={1400} rot={-2}>
            <div style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 26}}>
              <span style={{color: T.accent}}>›</span> {typed('сделай мультик по тексту', t, c.stav + 0.1, c.probui + 0.4)}
              <Caret t={t} />
            </div>
          </Tip>
        </div>
      )}
      <Ring x={520} y={562} r={66} rx={175} t={t} at={c.probui + 0.45} dur={end - c.probui} />
      <Particles x={800} y={1450} t={t} at={c.probui} n={34} spread={420} up={-0.8} dur={1.1} />
      <Rays x={800} y={1600} t={t} at={c.probui} r0={230} len={80} />
      <Rays x={800} y={1600} t={t} at={c.vsyo} r0={230} len={70} color={T.accent} />
    </div>
  );
};
