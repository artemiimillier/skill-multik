// Нарисованные кодом интерфейсы: курсор, окна, папки, файлы, телефон, строка ввода, чек-лист.
// Это не скриншоты конкретных программ, а узнаваемые схемы: их можно подписать как угодно.
import React from 'react';
import {FONT, T} from '../theme';
import {HT} from './frame';
import {CheckBox} from './marks';
import {lin, pop, pulse} from './motion';

/** Курсор-стрелка; click — момент клика (кольцо-волна акцента и «нажатие»). */
export const Cursor = ({x, y, t, click, hand}: {x: number; y: number; t: number; click?: number; hand?: boolean}) => {
  const c = click !== undefined && t >= click && t < click + 0.45;
  const k = c ? lin(t, click!, click! + 0.45) : 0;
  const press = click !== undefined ? pulse(t, click, 0.18) : 0;
  return (
    <>
      {c && <div style={{position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: '50%', border: `5px solid ${T.accent}`, opacity: 1 - k, transform: `scale(${0.4 + 1.3 * k})`, zIndex: 79}} />}
      <svg viewBox="0 0 100 120" style={{position: 'absolute', left: x - 8, top: y - 6, width: 58, height: 70, overflow: 'visible', transform: `scale(${1 - 0.15 * press})`, transformOrigin: '8px 6px', filter: 'drop-shadow(0 5px 6px #0005)', zIndex: 80}}>
        {hand ? (
          <path d="M38 8 Q38 0 46 0 Q54 0 54 8 V48 Q56 40 64 40 Q72 41 72 50 Q74 44 82 45 Q90 47 89 56 Q92 52 98 54 Q104 57 102 66 V84 Q100 108 76 116 H48 Q30 112 18 92 L6 70 Q2 60 10 58 Q18 56 24 66 L38 82Z" fill="#fff" stroke={T.ink} strokeWidth="7" strokeLinejoin="round" />
        ) : (
          <path d="M10 6 L10 92 L32 72 L48 108 L64 100 L48 66 L80 66Z" fill={T.ink} stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
        )}
      </svg>
    </>
  );
};

const Lights = ({gap = 9, size = 14, muted}: {gap?: number; size?: number; muted?: boolean}) => (
  <div style={{display: 'flex', gap}}>
    {(muted ? ['#4a4d58', '#4a4d58', '#4a4d58'] : ['#ff5f57', '#febc2e', '#28c840']).map((c, i) => (
      <i key={i} style={{width: size, height: size, borderRadius: '50%', background: c}} />
    ))}
  </div>
);

/** Тёмное окно агента/терминала: заголовок, лента, поле ввода внизу. hi — поле подсвечено акцентом. */
export const AppWindow = ({w, h, title = 'Агент', children, input, hi, foot = true, style}: {w: number; h: number; title?: React.ReactNode; children?: React.ReactNode; input?: React.ReactNode; hi?: boolean; foot?: boolean; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <HT w={w} h={h} r={24} dx={14} dy={16} op={0.6} />
    <div style={{position: 'absolute', inset: 0, background: T.win, borderRadius: 24, overflow: 'hidden', fontFamily: FONT.ui, color: T.winText, border: '2px solid #000', boxShadow: '0 20px 40px #0003'}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', borderBottom: `1px solid ${T.win3}`}}>
        <Lights muted />
        <span style={{marginLeft: 8, fontSize: 25, fontWeight: 700, whiteSpace: 'nowrap'}}>{title}</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 64, bottom: foot ? 112 : 0}}>{children}</div>
      {foot && (
        <div style={{position: 'absolute', left: 22, right: 22, bottom: 26, height: 66, borderRadius: 18, background: T.win2, border: hi ? `4px solid ${T.accentOnDark}` : `1px solid ${T.win3}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', fontSize: 23, color: T.winMute, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          <b style={{fontSize: 30, fontWeight: 300, color: '#ccc'}}>›</b>
          {input ?? <span>напиши задачу…</span>}
          <span style={{marginLeft: 'auto', width: 36, height: 36, flex: 'none', borderRadius: '50%', background: hi ? T.accent : '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff'}}>↑</span>
        </div>
      )}
    </div>
  </div>
);

/** Пустой экран агента: значок и вопрос посередине. */
export const AgentHello = ({text = 'Что делаем?', op = 1}: {text?: string; op?: number}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: '30%', textAlign: 'center', opacity: op}}>
    <div style={{display: 'inline-flex', width: 64, height: 64, borderRadius: 18, background: T.accent, alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: FONT.mono, fontWeight: 600, fontSize: 34}}>›_</div>
    <div style={{fontSize: 30, color: '#a19fa8', marginTop: 16, fontWeight: 500}}>{text}</div>
  </div>
);

/** Светлое окно файлов: боковое меню, заголовок, путь внизу. */
export const FileWindow = ({w, h, title = 'Проект', side = ['Недавние', 'Рабочий стол', 'Документы', 'Загрузки'], active = 1, path, children, style}: {w: number; h: number; title?: string; side?: string[]; active?: number; path?: React.ReactNode; children?: React.ReactNode; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <HT w={w} h={h} r={22} dx={14} dy={14} op={0.45} />
    <div style={{position: 'absolute', inset: 0, background: '#fff', borderRadius: 22, overflow: 'hidden', fontFamily: FONT.ui, border: `2px solid ${T.line}`, boxShadow: '0 18px 40px #0002'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: w * 0.27, background: '#f3f0ea', borderRight: `1px solid ${T.line}`, padding: '70px 16px', fontSize: 19, color: '#666', lineHeight: 1.8}}>
        <div style={{position: 'absolute', top: 22, left: 18}}>
          <Lights />
        </div>
        <div style={{fontSize: 14, color: '#aaa', fontWeight: 700, letterSpacing: 1}}>МЕСТА</div>
        {side.map((s, i) => (
          <div key={s} style={{background: i === active ? '#e2ded6' : 'none', borderRadius: 7, padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden'}}>
            ▫ {s}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: w * 0.27, right: 0, top: 0, height: 64, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14, fontSize: 22, fontWeight: 700, color: '#333'}}>
        ‹ ›<span style={{whiteSpace: 'nowrap'}}>{title}</span>
        <span style={{marginLeft: 'auto', color: '#aaa', fontWeight: 400}}>⊞ ☰ ⌕</span>
      </div>
      <div style={{position: 'absolute', left: w * 0.27, right: 0, top: 64, bottom: path ? 46 : 0}}>{children}</div>
      {path && (
        <div style={{position: 'absolute', left: w * 0.27, right: 0, bottom: 0, height: 46, borderTop: `1px solid ${T.line}`, fontFamily: FONT.mono, fontSize: 18, color: '#888', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          {path}
        </div>
      )}
    </div>
  </div>
);

/** Папка (картонная, цвета T.folder). open 0..1 — крышка откидывается; children — то, что выглядывает изнутри. */
export const Folder = ({w = 300, label, open = 0, children, style, labelSize, color = T.folder, dark = T.folderDark}: {w?: number; label?: string; open?: number; children?: React.ReactNode; style?: React.CSSProperties; labelSize?: number; color?: string; dark?: string}) => {
  const h = w * 0.74;
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      <svg viewBox="0 0 200 148" width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d="M8 18 Q8 6 20 6 H70 Q78 6 83 13 L90 22 H180 Q192 22 192 34 V136 Q192 146 182 146 H18 Q8 146 8 136Z" fill={dark} stroke={T.ink} strokeWidth="3" />
      </svg>
      <div style={{position: 'absolute', left: '6%', right: '6%', top: '4%', height: '50%', zIndex: 1}}>{children}</div>
      <svg viewBox="0 0 200 148" width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible', zIndex: 2, transform: `perspective(600px) rotateX(${open * 32}deg)`, transformOrigin: '50% 100%'}}>
        <path d="M4 44 Q4 34 14 34 H186 Q196 34 196 44 L192 136 Q192 146 182 146 H18 Q8 146 8 136Z" fill={color} stroke={T.ink} strokeWidth="3" />
        <path d="M14 42 H186" stroke="#ffffff99" strokeWidth="2.5" />
      </svg>
      {label && (
        <div style={{position: 'absolute', left: '12%', right: '12%', top: '58%', zIndex: 3, background: '#fff', border: `2px solid ${T.ink}`, borderRadius: 10, padding: '6px 10px', fontFamily: FONT.mono, fontWeight: 600, fontSize: labelSize ?? w * 0.07, color: T.ink, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden'}}>
          {label}
        </div>
      )}
    </div>
  );
};

/** Файл-карточка с расширением на ярлыке. accent — рамка цветом акцента. */
export const FileCard = ({name, w = 130, accent, style}: {name: string; w?: number; accent?: boolean; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: w, height: w * 1.25, background: '#fff', border: `3px solid ${accent ? T.accent : T.ink}`, borderRadius: 8, boxShadow: `4px 5px 0 ${T.shadow}33`, padding: w * 0.08, fontFamily: FONT.mono, fontSize: w * 0.105, fontWeight: 600, color: T.ink, ...style}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
      <span style={{alignSelf: 'flex-start', background: accent ? T.accent : T.ink, color: '#fff', fontSize: w * 0.085, padding: '1px 5px', borderRadius: 3}}>{(name.split('.').pop() ?? '').toUpperCase().slice(0, 4)}</span>
      <span style={{whiteSpace: 'nowrap'}}>{name}</span>
    </div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{height: w * 0.035, background: '#d6d2c8', borderRadius: 2, marginTop: w * 0.075, width: `${[90, 70, 85, 60][i]}%`}} />
    ))}
  </div>
);

/** Телефон 9:19.5 с вырезом. */
export const Phone = ({w = 380, children, style, dark}: {w?: number; children?: React.ReactNode; style?: React.CSSProperties; dark?: boolean}) => {
  const h = w * 2.06;
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      <HT w={w} h={h} r={w * 0.16} dx={14} dy={14} op={0.5} />
      <div style={{position: 'absolute', inset: 0, background: '#111', borderRadius: w * 0.16, padding: w * 0.035}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.13, overflow: 'hidden', background: dark ? '#111' : T.paper}}>
          {children}
          <div style={{position: 'absolute', left: '50%', top: w * 0.03, width: w * 0.3, height: w * 0.075, background: '#111', borderRadius: 99, transform: 'translateX(-50%)', zIndex: 20}} />
          <div style={{position: 'absolute', left: w * 0.08, top: w * 0.035, fontFamily: FONT.ui, fontWeight: 700, fontSize: w * 0.045, color: dark ? '#fff' : '#111', zIndex: 20}}>9:41</div>
        </div>
      </div>
    </div>
  );
};

/** Окно браузера (схема): вкладка, адрес, пустая страница. */
export const Browser = ({w = 640, url = 'example.com', tab = 'Вкладка', children}: {w?: number; url?: string; tab?: string; children?: React.ReactNode}) => {
  const h = w * 0.66;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <HT w={w} h={h} r={18} op={0.45} />
      <div style={{position: 'absolute', inset: 0, background: '#f7f4ee', borderRadius: 18, border: `2px solid ${T.line}`, overflow: 'hidden', fontFamily: FONT.ui}}>
        <div style={{height: 48, background: '#ebe7df', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px'}}>
          <Lights size={13} gap={8} />
          <span style={{marginLeft: 16, background: '#fff', borderRadius: 8, padding: '4px 14px', fontSize: 18, color: '#555'}}>{tab} ×</span>
        </div>
        <div style={{margin: '10px 16px', background: '#fff', borderRadius: 20, padding: '6px 18px', fontSize: 19, color: '#666'}}>🔒 {url}</div>
        {children}
      </div>
    </div>
  );
};

/** Огромная строка ввода «напиши это»: тёмная капсула с рамкой акцента. */
export const InputBar = ({w = 800, h = 120, children, style}: {w?: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: w, height: h, ...style}}>
    <HT w={w} h={h} r={h / 2} dx={10} dy={12} op={0.5} />
    <div style={{position: 'absolute', inset: 0, borderRadius: h / 2, background: T.win, border: `5px solid ${T.accent}`, outline: `3px solid ${T.accent}55`, outlineOffset: 8, display: 'flex', alignItems: 'center', padding: '0 34px', gap: 14, fontFamily: FONT.ui, fontSize: h * 0.36, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden'}}>
      {children}
    </div>
  </div>
);

/** Крутилка «в работе». */
export const Spinner = ({t, size = 28, color = T.accentOnDark}: {t: number; size?: number; color?: string}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{transform: `rotate(${t * 400}deg)`, flex: 'none'}}>
    <circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff22" strokeWidth="6" />
    <path d="M20 5 A15 15 0 0 1 35 20" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export type CheckItem = {s: string; at: number; hi?: number; icon?: string};
/** Чек-лист шага на белой карточке: пункт подсвечен с hi, отмечен с at. */
export const Checklist = ({t, items, title, w = 420, size = 50, style}: {t: number; items: CheckItem[]; title: string; w?: number; size?: number; style?: React.CSSProperties}) => (
  <div style={{position: 'relative', width: w, ...style}}>
    <div style={{position: 'relative', background: '#fff', border: `3px solid ${T.ink}`, borderRadius: 20, padding: '16px 22px', boxShadow: `7px 8px 0 ${T.shadow}22`}}>
      <div style={{display: 'flex', fontFamily: FONT.mono, fontSize: 22, color: '#666', letterSpacing: 2, marginBottom: 6}}>
        {title}
        <span style={{marginLeft: 'auto', letterSpacing: 4}}>{items.map((it, i) => <span key={i}>{t >= it.at ? '●' : '○'}</span>)}</span>
      </div>
      {items.map((it, i) => {
        const done = t >= it.at;
        const hi = it.hi !== undefined && t >= it.hi && !done;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, margin: '6px 0'}}>
            <div style={{border: hi ? `4px solid ${T.accent}` : '4px solid transparent', borderRadius: 10}}>
              <CheckBox v={done ? pop(t, it.at) : 0} size={size * 0.85} />
            </div>
            <span style={{fontFamily: FONT.display, fontWeight: 700, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', textTransform: 'uppercase', color: done ? T.ink : hi ? T.accent : '#c5c1b9'}}>{it.s}</span>
            {it.icon && <span style={{marginLeft: 'auto', fontSize: 28, color: '#999'}}>{it.icon}</span>}
          </div>
        );
      })}
    </div>
  </div>
);
