/* ============ 1. core: utils, catalog, state, history ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r1 = v => Math.round(v * 10) / 10;
const r3 = v => Math.round(v * 1000) / 1000;
const fm = (v, d = 2) => Number(v).toFixed(d).replace('.', ',');
const mm = v => String(Math.round(v * 1000));
const cmv = v => Math.round(v * 100);
const deg = d => d * Math.PI / 180;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = p => p + Math.random().toString(36).slice(2, 9);
const toInt = c => typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16);
const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
function shade(c, k) { const n = toInt(c); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; const f = v => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255); return hex(f(r) << 16 | f(g) << 8 | f(b)); }

/* walls: А=N (window), Б=E (doorway), В=S, Г=W. s runs from the Г/А corner (x for N,S; z for E,W) */
const WALLS = ['N', 'E', 'S', 'W'];
const WRU = { N: 'А', E: 'Б', S: 'В', W: 'Г' };
const WNAME = { N: 'оконная', E: 'с проёмом', S: 'напротив окна', W: 'напротив проёма' };
const WROT = { N: 0, S: Math.PI, E: -Math.PI / 2, W: Math.PI / 2 };
function wallLen(w, R) { R = R || S.room; return (w === 'N' || w === 'S') ? R.W : R.L; }
function wallPt(w, s, R) {
  R = R || S.room;
  switch (w) {
    case 'N': return { x: s, z: 0, nx: 0, nz: 1, tx: 1, tz: 0 };
    case 'S': return { x: s, z: R.L, nx: 0, nz: -1, tx: 1, tz: 0 };
    case 'E': return { x: R.W, z: s, nx: -1, nz: 0, tx: 0, tz: 1 };
    default: return { x: 0, z: s, nx: 1, nz: 0, tx: 0, tz: 1 };
  }
}
function nearestWall(x, z, R) {
  R = R || S.room;
  const d = { N: z, S: R.L - z, W: x, E: R.W - x };
  let best = 'N'; for (const k of WALLS) if (d[k] < d[best]) best = k;
  return { wall: best, s: (best === 'N' || best === 'S') ? x : z, dist: d[best] };
}

/* palettes */
const FABRIC = { sage: ['шалфей', 0x8C9384], graphite: ['графит', 0x4C5056], beige: ['беж', 0xCDBFA8], greige: ['грейдж', 0xC6BCAD], cream: ['молочный', 0xE6DFD1], terracotta: ['терракота', 0xB06A4A], mustard: ['горчица', 0xC29A45], olive: ['олива', 0x7C7B52], navy: ['синий', 0x435273], grey: ['серый', 0x9B9D9F] };
const WOOD = { oak: ['дуб', 0xC49E74], walnut: ['орех', 0x6E4B33], white: ['белый', 0xF1F0EC], greige: ['грейдж', 0xD3CABD], graphite: ['графит', 0x3E4145], black: ['чёрный', 0x1F2022] };
const PANEL = { cream: ['крем', 0xE7E0D4], white: ['белый', 0xF4F3F0], greige: ['грейдж', 0xCDC4B7], graphite: ['графит', 0x484B50], oak: ['дуб', 0xC49E74] };
const METAL = { brass: ['латунь', 0xC9A167], black: ['чёрный', 0x1E1F21], white: ['белый', 0xF0F0EE], chrome: ['хром', 0xD9DCDF] };
const PROFILE = { champagne: ['шампань', 0xC7B18D], black: ['чёрный', 0x1E1F21], silver: ['серебро', 0xBFC3C7] };
const RUGC = { greige: ['грейдж', 0xD9D0C2], grey: ['серый', 0xBFC1C2], cream: ['молочный', 0xEAE3D6], terracotta: ['терракота', 0xC98E72], sage: ['шалфей', 0xA8B09B], navy: ['синий', 0x5A6782] };
const LINEN = { white: ['белое', 0xF1EFEA], grey: ['серое', 0xC9CBCB], sage: ['шалфей', 0xB9C1AE], sand: ['песочное', 0xE2D6C2] };
const WALLC = ['#F2EEE7', '#EDE7DD', '#E7E6E2', '#EADFCF', '#E2E7E3', '#E6E0E8', '#DDE4EA', '#F5F3EE', '#D9CDBD', '#C9D1C4', '#C4CCD6', '#E8D6CC'];
const CURTC = { linen: ['#DDD4C6', '#EFEBE4', '#C9C3B8', '#B9C1B0', '#9AA2AE', '#C9A98E'], blackout: ['#7B7F86', '#5D6168', '#A89F92', '#6E7A6A', '#3F4A5E', '#8A5F4E'], roman: ['#DDD4C6', '#EFEBE4', '#B9C1B0', '#9AA2AE', '#C9A98E', '#7B7F86'] };
const WALLT = { liquid: 'Жидкие обои', paint: 'Покраска', plain: 'Обои однотонные', pattern: 'Обои с узором' };
const PATTERNS = { damask: 'Дамаск', stripes: 'Полоска', geometric: 'Геометрия', botanic: 'Листья', dots: 'Горошек' };
const FLOORS = { lino: 'Линолеум «дуб»', oaklight: 'Светлый дуб', oakgrey: 'Серый дуб', walnut: 'Орех', herring: 'Паркет ёлочка', tile: 'Плитка 60×60' };
const PLINTH = { brown: ['коричневый', 0x4A3022], white: ['белый', 0xF2F2EF], black: ['чёрный', 0x1E1F21], floor: ['в тон пола', null] };
const CURT = { linen: 'Лён', blackout: 'Блэкаут', roman: 'Римские', none: 'Без штор' };
const MODS = { s: 'розетка', su: 'розетка + USB', lan: 'интернет RJ-45', tv: 'ТВ-гнездо' };
const CEIL_V = { ring: 'Кольца LED', globes: 'Молекула', cones: 'Рожковая, конусы', tulips: 'Рожковая, тюльпаны', drum: 'Абажур', pendant: 'Подвес-купол', spot: 'Точечный' };
const WALL_V = { sphere: 'Шар', cone: 'Конус', updown: 'Вверх-вниз' };
const SHADES = { opal: 'опал', clear: 'прозрачные', smoke: 'дымчатые', fabric: 'ткань' };
const NO_SHADE = { ring: 1, spot: 1 };

/* catalog: local frame — width along x, depth along z, front = +z */
const CAT = {
  sofa: { name: 'Диван', group: 'living', def: { w: 1.95, d: 0.95, h: 0.84 }, dims: { w: [1.40, 2.80], d: [0.80, 1.10] }, opts: { color: 'sage', legs: 'wood' }, ui: [['color', 'Обивка', 'fabric'], ['legs', 'Ножки', 'chips', [['wood', 'дерево'], ['black', 'чёрные']]]] },
  armchair: { name: 'Кресло', group: 'living', def: { w: 0.85, d: 0.85, h: 0.82 }, dims: { w: [0.65, 1.10], d: [0.70, 1.00] }, opts: { color: 'beige', legs: 'wood' }, ui: [['color', 'Обивка', 'fabric'], ['legs', 'Ножки', 'chips', [['wood', 'дерево'], ['black', 'чёрные']]]] },
  coffee: { name: 'Журнальный столик', group: 'living', def: { w: 0.60, d: 0.60, h: 0.43 }, dims: { w: [0.40, 1.40], d: [0.40, 0.90], h: [0.30, 0.55] }, opts: { shape: 'round', top: 'oak' }, ui: [['shape', 'Форма', 'chips', [['round', 'круглый'], ['rect', 'прямоугольный']]], ['top', 'Столешница', 'wood']] },
  pouf: { name: 'Пуф', group: 'living', def: { w: 0.50, d: 0.50, h: 0.42 }, dims: { w: [0.35, 0.80], d: [0.35, 0.80], h: [0.30, 0.50] }, opts: { color: 'terracotta' }, ui: [['color', 'Обивка', 'fabric']] },
  rug: { name: 'Ковёр', group: 'living', def: { w: 1.60, d: 2.00, h: 0.01 }, dims: { w: [0.60, 3.40], d: [0.60, 4.20] }, opts: { color: 'greige', pattern: 'lattice' }, ui: [['color', 'Цвет', 'rug'], ['pattern', 'Рисунок', 'chips', [['lattice', 'ромб'], ['plain', 'гладкий'], ['stripes', 'полосы'], ['border', 'кайма']]]] },
  bed: { name: 'Кровать', group: 'sleep', def: { w: 1.46, d: 2.07, h: 1.06 }, dims: null, opts: { size: 140, head: 'channels', color: 'greige', linen: 'white', lift: true }, ui: [['size', 'Спальное место', 'chips', [[90, '90×200'], [120, '120'], [140, '140'], [160, '160'], [180, '180']]], ['head', 'Изголовье', 'chips', [['channels', 'стёжка'], ['panel', 'панель'], ['none', 'без']]], ['color', 'Обивка', 'fabric'], ['linen', 'Бельё', 'linen'], ['lift', 'Подъёмный механизм', 'bool']] },
  nightstand: { name: 'Тумба прикроватная', group: 'sleep', def: { w: 0.45, d: 0.40, h: 0.52 }, dims: { w: [0.35, 0.65], d: [0.30, 0.50], h: [0.40, 0.70] }, opts: { color: 'oak' }, ui: [['color', 'Корпус', 'wood']] },
  wardrobe: { name: 'Шкаф-купе', group: 'storage', def: { w: 1.18, d: 0.62, h: 2.60 }, dims: { w: [0.60, 3.60], d: [0.45, 0.70], h: [1.80, 3.00] }, opts: { style: 'panels', color: 'cream', profile: 'champagne', toCeil: true, led: true }, ui: [['style', 'Двери', 'chips', [['panels', 'купе, 3 филёнки'], ['plain', 'купе, гладкие'], ['mirror', 'купе с зеркалом'], ['hinged', 'распашные']]], ['color', 'Фасады', 'panel'], ['profile', 'Профиль', 'profile'], ['toCeil', 'До потолка', 'bool'], ['led', 'Подсветка внутри', 'bool']] },
  divider: { name: 'Стеллаж-перегородка', group: 'storage', def: { w: 1.90, d: 0.35, h: 2.20 }, dims: { w: [0.80, 2.80], d: [0.28, 0.45], h: [1.20, 2.60] }, opts: { color: 'greige', decor: true, led: true }, ui: [['color', 'Цвет', 'wood'], ['decor', 'Декор на полках', 'bool'], ['led', 'LED-подсветка', 'bool']] },
  bookcase: { name: 'Стеллаж у стены', group: 'storage', def: { w: 1.20, d: 0.35, h: 2.00 }, dims: { w: [0.50, 2.40], d: [0.28, 0.45], h: [0.80, 2.60] }, opts: { color: 'white', decor: true, led: false }, ui: [['color', 'Цвет', 'wood'], ['decor', 'Книги и декор', 'bool'], ['led', 'LED-подсветка', 'bool']] },
  dresser: { name: 'Комод', group: 'storage', def: { w: 1.00, d: 0.45, h: 0.85 }, dims: { w: [0.60, 1.80], d: [0.38, 0.55], h: [0.60, 1.20] }, opts: { color: 'white' }, ui: [['color', 'Корпус', 'wood']] },
  desk: { name: 'Стол с электроприводом', group: 'work', def: { w: 1.40, d: 0.70, h: 0.74 }, dims: { w: [1.00, 1.80], d: [0.60, 0.80], h: [0.62, 1.25] }, opts: { top: 'grey', frame: 'white', monitor: true, pc: true }, ui: [['top', 'Столешница', 'chips', [['grey', 'серая'], ['white', 'белая'], ['oak', 'дуб'], ['black', 'чёрная']]], ['frame', 'Рама', 'chips', [['white', 'белая'], ['black', 'чёрная']]], ['monitor', 'Монитор', 'bool'], ['pc', 'Системный блок', 'bool']] },
  chair: { name: 'Кресло офисное', group: 'work', def: { w: 0.64, d: 0.64, h: 1.15 }, dims: null, opts: { color: 'graphite' }, ui: [['color', 'Цвет', 'chips', [['graphite', 'графит'], ['grey', 'серый'], ['white', 'белый']]]] },
  tv: { name: 'Телевизор', group: 'tv', wall: true, def: { w: 1.244, d: 0.05, h: 0.725, y: 1.15 }, dims: null, opts: { size: 55, shelf: true, shelfW: 1.30, soundbar: true }, ui: [['size', 'Диагональ', 'chips', [[43, '43″'], [50, '50″'], [55, '55″'], [65, '65″'], [75, '75″']]], ['shelf', 'Полка под саундбар', 'bool'], ['soundbar', 'Саундбар', 'bool']] },
  tvstand: { name: 'Тумба под ТВ', group: 'tv', def: { w: 1.60, d: 0.40, h: 0.48 }, dims: { w: [1.00, 2.40], d: [0.32, 0.50], h: [0.35, 0.60] }, opts: { color: 'oak' }, ui: [['color', 'Корпус', 'wood']] },
  shelf: { name: 'Полка настенная', group: 'tv', wall: true, def: { w: 1.00, d: 0.22, h: 0.035, y: 1.40 }, dims: { w: [0.40, 2.00], d: [0.15, 0.35] }, opts: { color: 'oak', decor: true, led: false }, ui: [['color', 'Цвет', 'wood'], ['decor', 'Декор', 'bool'], ['led', 'LED-подсветка', 'bool']] },
  picture: { name: 'Картина', group: 'decor', wall: true, def: { w: 0.70, d: 0.03, h: 0.90, y: 1.45 }, dims: { w: [0.30, 1.60], h: [0.30, 1.40] }, opts: { art: 'abstract', frame: 'black' }, ui: [['art', 'Сюжет', 'chips', [['abstract', 'абстракция'], ['lines', 'линии'], ['landscape', 'пейзаж']]], ['frame', 'Рама', 'chips', [['black', 'чёрная'], ['oak', 'дуб'], ['white', 'белая']]]] },
  floorlamp: { name: 'Торшер', group: 'decor', def: { w: 0.42, d: 0.42, h: 1.62 }, dims: { h: [1.20, 1.90] }, opts: { shade: 'linen', base: 'black' }, ui: [['shade', 'Абажур', 'chips', [['linen', 'лён'], ['white', 'белый'], ['graphite', 'графит']]], ['base', 'Стойка', 'chips', [['black', 'чёрная'], ['brass', 'латунь'], ['white', 'белая']]]] },
  plant: { name: 'Растение', group: 'decor', def: { w: 0.60, d: 0.60, h: 1.60 }, dims: { h: [0.50, 2.00] }, opts: { pot: 'white' }, ui: [['pot', 'Кашпо', 'chips', [['white', 'белое'], ['terracotta', 'терракота'], ['graphite', 'графит']]]] },
};
const GROUPS = [['living', 'Гостиная'], ['sleep', 'Спальное место'], ['storage', 'Хранение'], ['work', 'Рабочее место'], ['tv', 'ТВ и полки'], ['decor', 'Свет и декор']];
const LEDABLE = { divider: 1, bookcase: 1, shelf: 1, wardrobe: 1 };
const ELADD = [
  ['s1', 'Розетка', () => ({ kind: 'socket', mods: ['s'], h: 0.30 })],
  ['s2', 'Блок розеток ×2', () => ({ kind: 'socket', mods: ['s', 's'], h: 0.30 })],
  ['su', 'Розетка с USB', () => ({ kind: 'socket', mods: ['su'], h: 0.30 })],
  ['lan', 'Интернет LAN', () => ({ kind: 'socket', mods: ['lan'], h: 0.30 })],
  ['tvs', 'ТВ-гнездо', () => ({ kind: 'socket', mods: ['tv'], h: 1.10 })],
  ['sw1', 'Выключатель 1-клав.', () => ({ kind: 'switch', keys: [[]], h: 0.90 })],
  ['sw2', 'Выключатель 2-клав.', () => ({ kind: 'switch', keys: [[], []], h: 0.90 })],
  ['ch', 'Люстра', () => ({ kind: 'light', mount: 'ceil', variant: 'ring', frame: 'brass', shade: 'opal' })],
  ['spot', 'Точечный светильник', () => ({ kind: 'light', mount: 'ceil', variant: 'spot', frame: 'white', shade: 'opal' })],
  ['pend', 'Подвесной светильник', () => ({ kind: 'light', mount: 'ceil', variant: 'pendant', frame: 'black', shade: 'opal' })],
  ['sconce', 'Бра', () => ({ kind: 'light', mount: 'wall', variant: 'sphere', frame: 'brass', shade: 'opal', h: 1.30 })],
  ['ac', 'Кондиционер (резерв)', () => ({ kind: 'ac', h: 2.30 })],
];

/* ---------- state ---------- */
const DEF_ROOM = { W: 3.30, L: 5.90, H: 2.60, door: { off: 1.15, w: 0.90 }, win: { x0: 0.90, w: 1.50, sill: 0.85, top: 2.15 } };
const ROOM_LIM = { W: [2.6, 5.0], L: [3.0, 8.0], H: [2.4, 3.2] };
let S = null, SEL = null;

function newItem(type, o = {}) {
  const c = CAT[type];
  const it = { id: uid('i'), type, rot: 0, w: c.def.w, d: c.def.d, h: c.def.h, opts: { ...c.opts } };
  if (c.wall) { it.wall = 'E'; it.s = 1; it.y = c.def.y; } else { it.x = 1; it.z = 1; }
  Object.assign(it, o); it.opts = { ...c.opts, ...(o.opts || {}) };
  return it;
}
function makeDefault(R0) {
  const R = JSON.parse(JSON.stringify(R0 || DEF_ROOM)), { W, L, H } = R;
  const items = [], add = (t, o) => { const it = newItem(t, o); items.push(it); return it; };
  add('bed', { x: 1.035, z: L - 0.73, rot: 90 });
  add('nightstand', { x: 0.22, z: L - 1.725, rot: 90 });
  const dvw = Math.min(1.90, W - 1.35);
  const dv = add('divider', { x: dvw / 2, z: L - 2.275, w: dvw });
  const ww = Math.max(0.6, W - 2.12);
  add('wardrobe', { x: W - ww / 2, z: L - 0.31, rot: 180, w: ww, h: H });
  const cs = (L - 2.45) - 0.06 - 0.975;
  add('sofa', { x: 0.475, z: cs, rot: 90 });
  add('desk', { x: W - 0.35, z: 1.0, rot: 270 });
  add('chair', { x: W - 1.05, z: 1.0, rot: 90 });
  const casN = L - R.door.off - R.door.w - 0.07;
  const ct = Math.min(Math.max(cs, 2.57), casN - 0.97);
  add('tv', { wall: 'E', s: ct, y: 1.15 });
  add('coffee', { x: 1.65, z: cs });
  add('rug', { x: 1.60, z: cs - 0.025, d: 1.95 });
  add('floorlamp', { x: 0.28, z: cs - 1.235 });
  add('plant', { x: 0.50, z: 0.55 });
  const E = p => ({ id: uid('e'), ...p });
  const ch = E({ kind: 'light', mount: 'ceil', x: W / 2, z: L / 2, variant: 'ring', frame: 'brass', shade: 'opal', note: 'Старая точка, потолок не трогаем' });
  const sc1 = E({ kind: 'light', mount: 'wall', wall: 'W', s: L - 1.10, h: 1.30, variant: 'sphere', frame: 'brass', shade: 'opal', note: 'Бра у изголовья' });
  const sc2 = E({ kind: 'light', mount: 'wall', wall: 'W', s: L - 0.36, h: 1.30, variant: 'sphere', frame: 'brass', shade: 'opal', note: 'Бра у изголовья' });
  const elec = [
    E({ kind: 'socket', wall: 'E', s: 1.00, h: 0.30, mods: ['s', 's', 's', 'lan'], note: 'ПК, монитор, мотор стола, интернет' }),
    E({ kind: 'socket', wall: 'E', s: ct, h: 1.10, mods: ['s', 's', 'lan', 'tv'], note: 'За ТВ. Вниз к полке — труба Ø25' }),
    E({ kind: 'switch', wall: 'E', s: casN - 0.12, h: 0.90, keys: [[ch.id], ['led:' + dv.id]], note: 'У входа. Проходной с выключателем у кровати' }),
    E({ kind: 'socket', wall: 'E', s: casN - 0.12, h: 0.30, mods: ['s'], note: 'Пылесос, гирлянда' }),
    E({ kind: 'socket', wall: 'E', s: (L - R.door.off + 0.07 + L - 0.62) / 2, h: 0.30, mods: ['s'], note: 'Утюг, отпариватель' }),
    E({ kind: 'socket', wall: 'S', s: W - 0.25, h: 2.45, mods: ['s'], note: 'В шкафу: питание LED-подсветки' }),
    E({ kind: 'switch', wall: 'W', s: L - 1.57, h: 0.75, keys: [[ch.id], [sc1.id, sc2.id]], note: 'У кровати. Проходной с выключателем у входа' }),
    E({ kind: 'socket', wall: 'W', s: L - 1.72, h: 0.75, mods: ['s', 'su'], note: 'Телефон, ночник' }),
    E({ kind: 'socket', wall: 'W', s: cs - 1.095, h: 0.30, mods: ['s', 'su'], note: 'Торшер, зарядка' }),
    E({ kind: 'ac', wall: 'W', s: 1.14, h: 2.30, note: 'Резерв, отдельная линия 3×2,5' }),
    ch, sc1, sc2,
  ];
  return {
    v: 2, room: R, items, elec,
    fin: { wall: { type: 'liquid', color: '#F2EEE7', pattern: 'damask', color2: '' }, accent: { wall: '', type: 'pattern', color: '#E9E1D5', pattern: 'damask', color2: '' }, floor: 'lino', plinth: 'brown', curt: { type: 'linen', color: '#DDD4C6', tulle: true } },
    meta: { object: 'Квартира. Жилая комната (зал)', author: '', stage: 'Эскиз' },
  };
}

/* geometry */
function extents(it) { const a = deg(it.rot || 0), c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return { ex: c * it.w / 2 + s * it.d / 2, ez: s * it.w / 2 + c * it.d / 2 }; }
function corners(it) { const a = deg(it.rot || 0), c = Math.cos(a), s = Math.sin(a), hw = it.w / 2, hd = it.d / 2; return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [it.x + lx * c + lz * s, it.z - lx * s + lz * c]); }
function toLocal(it, x, z) { const a = deg(it.rot || 0), c = Math.cos(a), s = Math.sin(a), dx = x - it.x, dz = z - it.z; return [dx * c - dz * s, dx * s + dz * c]; }
function fromLocal(it, lx, lz) { const a = deg(it.rot || 0), c = Math.cos(a), s = Math.sin(a); return [it.x + lx * c + lz * s, it.z - lx * s + lz * c]; }
function itemPos(it, R) { // world centre of an item (floor items: x,z; wall items: from wall)
  if (!CAT[it.type].wall) return { x: it.x, z: it.z };
  const p = wallPt(it.wall, it.s, R); return { x: p.x + p.nx * it.d / 2, z: p.z + p.nz * it.d / 2 };
}
function clampInRoom(it, R, snap = 0.06) {
  const { ex, ez } = extents(it);
  const fit = (v, e, lim) => { if (2 * e >= lim) return lim / 2; v = clamp(v, e, lim - e); if (v - e < snap) v = e; if (lim - e - v < snap) v = lim - e; return v; };
  it.x = r3(fit(it.x, ex, R.W)); it.z = r3(fit(it.z, ez, R.L));
}

/* normalisation (also migrates/validates shared states) */
function normItem(it, R) {
  const c = CAT[it && it.type]; if (!c) return null;
  it.opts = { ...c.opts, ...(it.opts || {}) };
  for (const k of ['w', 'd', 'h']) { const v = +it[k]; it[k] = isFinite(v) && v > 0 ? v : c.def[k]; const rg = c.dims && c.dims[k]; if (rg) it[k] = r3(clamp(it[k], rg[0], rg[1])); else it[k] = c.def[k]; }
  if (it.type === 'tv') { const sz = [43, 50, 55, 65, 75].includes(+it.opts.size) ? +it.opts.size : 55; it.opts.size = sz; const wd = sz * 0.0254 * 0.8716; it.w = r3(wd + 0.012); it.h = r3(wd * 9 / 16 + 0.012); it.d = 0.05; it.opts.shelfW = clamp(+it.opts.shelfW || 1.3, 0.6, 2.4); }
  if (it.type === 'bed') { const sz = [90, 120, 140, 160, 180].includes(+it.opts.size) ? +it.opts.size : 140; it.opts.size = sz; it.w = r3(sz / 100 + 0.06); it.d = 2.07; it.h = 1.06; }
  if (it.type === 'chair') { it.w = 0.64; it.d = 0.64; it.h = 1.15; }
  if (it.type === 'wardrobe' && it.opts.toCeil) it.h = R.H;
  if (it.type === 'coffee' && it.opts.shape === 'round') it.d = it.w;
  it.id = typeof it.id === 'string' ? it.id : uid('i');
  if (c.wall) {
    if (!WALLS.includes(it.wall)) it.wall = 'E';
    const len = wallLen(it.wall, R); it.s = r3(clamp(isFinite(+it.s) ? +it.s : len / 2, Math.min(it.w / 2, len / 2), Math.max(len - it.w / 2, len / 2)));
    it.y = r3(clamp(isFinite(+it.y) ? +it.y : c.def.y, 0.25 + it.h / 2, R.H - 0.05 - it.h / 2));
    delete it.x; delete it.z; it.rot = 0;
  } else {
    it.x = isFinite(+it.x) ? +it.x : R.W / 2; it.z = isFinite(+it.z) ? +it.z : R.L / 2;
    it.rot = ((Math.round(+it.rot || 0) % 360) + 360) % 360;
    clampInRoom(it, R, 0);
  }
  return it;
}
function normElec(e, R) {
  if (!e || !['socket', 'switch', 'light', 'ac'].includes(e.kind)) return null;
  e.id = typeof e.id === 'string' ? e.id : uid('e');
  if (e.kind === 'light' && e.mount === 'ceil') {
    e.x = r3(clamp(isFinite(+e.x) ? +e.x : R.W / 2, 0.08, R.W - 0.08)); e.z = r3(clamp(isFinite(+e.z) ? +e.z : R.L / 2, 0.08, R.L - 0.08));
    if (!CEIL_V[e.variant]) e.variant = 'ring';
    delete e.wall; delete e.s; delete e.h;
  } else {
    if (e.kind === 'light') { e.mount = 'wall'; if (!WALL_V[e.variant]) e.variant = 'sphere'; }
    if (!WALLS.includes(e.wall)) e.wall = 'W';
    const len = wallLen(e.wall, R); e.s = r3(clamp(isFinite(+e.s) ? +e.s : len / 2, 0.05, len - 0.05)); e.h = r3(clamp(isFinite(+e.h) ? +e.h : 0.3, 0.1, R.H - 0.08));
  }
  if (e.kind === 'socket') { e.mods = (Array.isArray(e.mods) ? e.mods : ['s']).filter(m => MODS[m]).slice(0, 4); if (!e.mods.length) e.mods = ['s']; }
  if (e.kind === 'switch') { e.keys = (Array.isArray(e.keys) ? e.keys : [[]]).slice(0, 3).map(k => Array.isArray(k) ? k.filter(x => typeof x === 'string') : []); if (!e.keys.length) e.keys = [[]]; }
  if (e.kind === 'light') { if (!METAL[e.frame]) e.frame = 'brass'; if (!SHADES[e.shade]) e.shade = 'opal'; }
  e.note = typeof e.note === 'string' ? e.note.slice(0, 200) : '';
  return e;
}
function sanitizeState(st) {
  const d = makeDefault(DEF_ROOM);
  if (!st || typeof st !== 'object' || st.v !== 2) return d;
  const R = st.room && typeof st.room === 'object' ? st.room : d.room;
  for (const k of ['W', 'L', 'H']) R[k] = r3(clamp(isFinite(+R[k]) ? +R[k] : DEF_ROOM[k], ROOM_LIM[k][0], ROOM_LIM[k][1]));
  R.door = { off: clamp(+(R.door && R.door.off) || 1.15, 0.1, R.L - 1.0), w: clamp(+(R.door && R.door.w) || 0.9, 0.6, 1.8) };
  if (R.door.off + R.door.w > R.L - 0.1) R.door.off = Math.max(0.1, R.L - 0.1 - R.door.w);
  const wn = R.win || {}, ww = r3(clamp(+wn.w || 1.5, 0.5, Math.min(3.0, R.W - 0.3))), sill = r3(clamp(+wn.sill || 0.85, 0.3, 1.2)); // old saves had a balcony block here: it is a plain window
  R.win = { w: ww, x0: r3(clamp(isFinite(+wn.x0) && R.win ? +wn.x0 : (R.W - ww) / 2, 0.15, R.W - 0.15 - ww)), sill, top: r3(clamp(+wn.top || 2.15, sill + 0.6, R.H - 0.1)) }; delete R.balc;
  const out = { v: 2, room: R, items: [], elec: [], fin: Object.assign({}, d.fin, st.fin || {}), meta: Object.assign({}, d.meta, st.meta || {}) };
  out.fin.wall = Object.assign({}, d.fin.wall, out.fin.wall); out.fin.accent = Object.assign({}, d.fin.accent, out.fin.accent); out.fin.curt = Object.assign({}, d.fin.curt, out.fin.curt);
  for (const w of [out.fin.wall, out.fin.accent]) { if (!WALLT[w.type]) w.type = 'liquid'; if (!PATTERNS[w.pattern]) w.pattern = 'damask'; if (!/^#[0-9a-f]{6}$/i.test(w.color)) w.color = '#F2EEE7'; if (w.color2 && !/^#[0-9a-f]{6}$/i.test(w.color2)) w.color2 = ''; }
  if (!WALLS.includes(out.fin.accent.wall)) out.fin.accent.wall = '';
  if (!FLOORS[out.fin.floor]) out.fin.floor = 'lino'; if (!PLINTH[out.fin.plinth]) out.fin.plinth = 'brown';
  if (!CURT[out.fin.curt.type]) out.fin.curt.type = 'linen'; if (!/^#[0-9a-f]{6}$/i.test(out.fin.curt.color)) out.fin.curt.color = '#DDD4C6'; out.fin.curt.tulle = !!out.fin.curt.tulle;
  for (const k of ['object', 'author', 'stage']) out.meta[k] = String(out.meta[k] ?? '').slice(0, 120);
  for (const it of (Array.isArray(st.items) ? st.items : []).slice(0, 120)) { const n = normItem(JSON.parse(JSON.stringify(it)), R); if (n) out.items.push(n); }
  for (const e of (Array.isArray(st.elec) ? st.elec : []).slice(0, 150)) { const n = normElec(JSON.parse(JSON.stringify(e)), R); if (n) out.elec.push(n); }
  return out;
}
function reclampAll() { for (const it of S.items) normItem(it, S.room); for (const e of S.elec) normElec(e, S.room); }

/* LED strips are an option of some furniture; they act as light points */
function ledList() { return S.items.filter(it => LEDABLE[it.type] && it.opts.led).map(it => ({ id: 'led:' + it.id, kind: 'led', item: it })); }
function lightTargets() { return [...S.elec.filter(e => e.kind === 'light'), ...ledList()]; }
function elecLabels() {
  const ord = { N: 0, E: 1, S: 2, W: 3 };
  const key = e => e.mount === 'ceil' ? [4, e.z, e.x] : [ord[e.wall], e.s, e.h || 0];
  const cmp = (a, b) => { const A = key(a), B = key(b); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; };
  const lab = {}; let r = 0, s = 0, l = 0, k = 0;
  for (const e of [...S.elec].sort(cmp)) { if (e.kind === 'socket') lab[e.id] = 'R' + (++r); else if (e.kind === 'switch') lab[e.id] = 'S' + (++s); else if (e.kind === 'ac') lab[e.id] = 'К' + (++k); }
  for (const e of S.elec.filter(e => e.kind === 'light').sort(cmp)) lab[e.id] = 'L' + (++l);
  for (const v of ledList()) lab[v.id] = 'L' + (++l);
  return lab;
}
function elecName(e) {
  if (e.kind === 'socket') { const n = e.mods.length, pw = e.mods.filter(m => m === 's' || m === 'su').length; if (n === 1) return ({ s: 'Розетка', su: 'Розетка с USB', lan: 'Интернет-розетка RJ-45', tv: 'ТВ-гнездо' })[e.mods[0]]; return `Блок ${n}: ${e.mods.map(m => ({ s: 'розетка', su: 'розетка+USB', lan: 'LAN', tv: 'ТВ' })[m]).join(', ')}` + (pw ? '' : ' (слаботочка)'); }
  if (e.kind === 'switch') return `Выключатель ${e.keys.length}-клав.`;
  if (e.kind === 'ac') return 'Розетка под кондиционер';
  if (e.kind === 'light') return e.mount === 'ceil' ? (e.variant === 'spot' ? 'Точечный светильник' : e.variant === 'pendant' ? 'Подвесной светильник' : 'Люстра «' + CEIL_V[e.variant] + '»') : 'Бра «' + WALL_V[e.variant] + '»';
  return '';
}

/* persistence & history */
const STORE = 'proekt-zala-v2';
function saveLocal() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { } }
function loadLocal() { try { const t = localStorage.getItem(STORE); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
const HIST = { past: [], future: [], snap: '' };
let onChange = () => { };
function resetHistory() { HIST.past = []; HIST.future = []; HIST.snap = JSON.stringify(S); }
function commit() {
  const cur = JSON.stringify(S); if (cur === HIST.snap) return;
  HIST.past.push(HIST.snap); if (HIST.past.length > 120) HIST.past.shift(); HIST.future.length = 0; HIST.snap = cur; saveLocal(); onChange();
}
function undo() { if (!HIST.past.length) return; HIST.future.push(HIST.snap); HIST.snap = HIST.past.pop(); S = JSON.parse(HIST.snap); fixSel(); saveLocal(); onChange(true); }
function redo() { if (!HIST.future.length) return; HIST.past.push(HIST.snap); HIST.snap = HIST.future.pop(); S = JSON.parse(HIST.snap); fixSel(); saveLocal(); onChange(true); }
function fixSel() { if (!SEL) return; const ok = SEL.kind === 'item' ? S.items.some(i => i.id === SEL.id) : S.elec.some(e => e.id === SEL.id); if (!ok) SEL = null; }
function getSel() { if (!SEL) return null; return SEL.kind === 'item' ? S.items.find(i => i.id === SEL.id) : S.elec.find(e => e.id === SEL.id); }

/* share link: state → deflate → base64url in the hash */
function b64u(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
async function encodeState(st) {
  const json = JSON.stringify(st);
  if (window.CompressionStream) { try { const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw')); return 'z' + b64u(new Uint8Array(await new Response(cs).arrayBuffer())); } catch (e) { } }
  return 'j' + b64u(new TextEncoder().encode(json));
}
async function decodeState(str) {
  const kind = str[0], bytes = unb64u(str.slice(1));
  if (kind === 'z') { const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return JSON.parse(await new Response(ds).text()); }
  return JSON.parse(new TextDecoder().decode(bytes));
}
