/* ============ 7. drawings: three A3 sheets (СПДС-style draft) ============ */
const SHEET_CSS = `.sht text{font-family:"Golos Text",Arial,Helvetica,sans-serif;fill:#000}
.sht .fr{fill:none;stroke:#000;stroke-width:.7}.sht .tbm{fill:none;stroke:#000;stroke-width:.5}.sht .tbt{fill:none;stroke:#000;stroke-width:.25}
.sht .b{font-weight:600}.sht .ttl{font-weight:600}
.sht .wall{stroke:#000;stroke-width:.5}.sht .win{fill:none;stroke:#000;stroke-width:.25}.sht .sill{fill:#fff;stroke:#000;stroke-width:.25}
.sht .rad{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:1 .8}.sht .leaf{fill:none;stroke:#000;stroke-width:.35}
.sht .sw{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:1.2 1}.sht .head{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:2 1.2}
.sht .f{fill:#fff;stroke:#000;stroke-width:.3}.sht .f2{fill:#e8e8e8;stroke:#000;stroke-width:.25}.sht .l{fill:none;stroke:#000;stroke-width:.18}
.sht .d{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:1.5 1}.sht .rug{fill:none;stroke:#666;stroke-width:.2;stroke-dasharray:2 1.2}
.sht .gh .f,.sht .gh .f2{fill:#fff;stroke:#a6a6a6;stroke-width:.18}.sht .gh .l,.sht .gh .d,.sht .gh .sw{stroke:#bdbdbd}.sht .gh .rug{stroke:#cfcfcf}
.sht .el{fill:#fff;stroke:#000;stroke-width:.35}.sht .elf{fill:#000;stroke:none}.sht .ell{fill:none;stroke:#000;stroke-width:.3}
.sht .elo{fill:none;stroke:#000;stroke-width:.3;stroke-dasharray:1 .7}.sht .led{fill:none;stroke:#000;stroke-width:.9;stroke-dasharray:.3 1.1;stroke-linecap:round}
.sht .ctl{fill:none;stroke:#000;stroke-width:.2}.sht .ctl.k1{stroke-dasharray:2.2 1.1}.sht .ctl.k2{stroke-dasharray:.5 1}.sht .ctl.k3{stroke-dasharray:3 1 .6 1}
.sht .el-lbl{font-size:2.5px;font-weight:600}.sht .el-sub{font-size:2px;font-weight:400}
.sht .dim line{stroke:#000;stroke-width:.18}.sht .dim .tick{stroke-width:.5}.sht .dim text{font-size:2.5px}
.sht .wl circle{fill:#fff;stroke:#000;stroke-width:.25}.sht .wl text{font-size:3.5px;font-weight:600}
.sht .pos circle{fill:#fff;stroke:#000;stroke-width:.25}.sht .pos text{font-size:2.5px;font-weight:600}
.sht .ew{fill:none;stroke:#000;stroke-width:.5}.sht .egnd{stroke:#000;stroke-width:.7}.sht .eo{fill:#fff;stroke:#000;stroke-width:.3}.sht .eo2{fill:none;stroke:#000;stroke-width:.18}
.sht .erad{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:1 .8}.sht .fe{fill:none;stroke:#8c8c8c;stroke-width:.2}.sht .fen{font-size:2px;fill:#777}
.sht .etv{fill:#f2f2f2;stroke:#000;stroke-width:.3}.sht .efs{fill:#d9d9d9;stroke:#000;stroke-width:.25}
.sht .lvm{fill:none;stroke:#000;stroke-width:.25}.sht .lvl{stroke:#000;stroke-width:.25}.sht .ext{stroke:#000;stroke-width:.18}
.sht .kp{fill:none;stroke:#000;stroke-width:.6}.sht .kpa{fill:#000}`;
const TW = 0.54; // average glyph width / font size
const tW = (s, fs) => String(s).length * fs * TW;
function clipT(s, w, fs) { s = String(s ?? ''); const n = Math.max(1, Math.floor(w / (fs * TW))); return s.length <= n ? s : s.slice(0, n - 1) + '…'; }
function wrapT(s, w, fs) {
  const out = []; for (const para of String(s ?? '').split('\n')) { let cur = ''; for (const wd of para.split(/\s+/).filter(Boolean)) { const t = cur ? cur + ' ' + wd : wd; if (!cur || tW(t, fs) <= w) cur = t; else { out.push(cur); cur = wd; } } out.push(cur); }
  return out.map(l => tW(l, fs) > w ? clipT(l, w, fs) : l);
}
const tx = (x, y, s, fs = 2.5, a = 'start', cls = '', rot = 0) => `<text x="${n1(x)}" y="${n1(y)}" style="font-size:${fs}px" text-anchor="${a}"${cls ? ` class="${cls}"` : ''}${rot ? ` transform="rotate(${rot} ${n1(x)} ${n1(y)})"` : ''}>${esc(s)}</text>`;
const ln = (cls, x1, y1, x2, y2) => `<line class="${cls}" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}"/>`;
const rc = (cls, x, y, w, h) => `<rect class="${cls}" x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}"/>`;
function dateMY() { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getFullYear()).slice(2); }

/* table: cols [{t, w, a:'s'|'m', wrap, ml}] → {s, h, w} */
function tbl(x, y, cols, rows, o = {}) {
  const fs = o.fs || 2.5, lh = fs * 1.22, hh = o.hh || 8, rh = o.rh || 6, pad = 1.1, W = cols.reduce((a, c) => a + c.w, 0);
  let s = '', yy = y + hh, cx = x;
  for (const c of cols) { const L = wrapT(c.t, c.w - 2 * pad, fs).slice(0, 2), ty = y + (hh - L.length * lh) / 2 + fs * 0.8; L.forEach((l, j) => { s += tx(cx + c.w / 2, ty + j * lh, l, fs, 'middle'); }); cx += c.w; }
  s += ln('tbm', x, yy, x + W, yy);
  for (const r of rows) {
    const cells = cols.map((c, i) => c.wrap ? wrapT(r[i], c.w - 2 * pad, fs).slice(0, c.ml || 2) : [clipT(r[i], c.w - 2 * pad, fs)]);
    const n = Math.max(1, ...cells.map(l => l.length)), h = Math.max(rh, n * lh + 1.8); cx = x;
    cells.forEach((L, i) => { const c = cols[i], ty = yy + (h - L.length * lh) / 2 + fs * 0.8; L.forEach((l, j) => { s += tx(c.a === 'm' ? cx + c.w / 2 : cx + pad, ty + j * lh, l, fs, c.a === 'm' ? 'middle' : 'start', r.bold && i === 0 ? 'b' : ''); }); cx += c.w; });
    yy += h; s += ln('tbt', x, yy, x + W, yy);
  }
  cx = x; for (let i = 0; i < cols.length - 1; i++) { cx += cols[i].w; s += ln('tbm', cx, y, cx, yy); }
  s += rc('tbm', x, y, W, yy - y);
  return { s, h: yy - y, w: W };
}
function noteBlock(x, y, w, title, items, fs = 2.5) {
  const lh = fs * 1.3; let s = tx(x, y + 3.5, title, 3.5, 'start', 'ttl'), yy = y + 8;
  items.forEach((t, i) => { const num = `${i + 1}. `, ind = tW(num, fs); const L = wrapT(t, w - ind, fs); L.forEach((l, j) => { if (!j) s += tx(x, yy + fs * 0.8, num, fs); s += tx(x + ind, yy + fs * 0.8, l, fs); yy += lh; }); yy += 0.6; });
  return { s, h: yy - y };
}
function titleBlock(n, total, name) {
  const x = 230, y = 237, m = S.meta, R = S.room; let s = '';
  for (const cx of [10, 20, 30, 40, 55]) s += ln(cx === 10 || cx === 30 ? 'tbm' : 'tbm', x + cx, y, x + cx, y + 25);
  for (const cx of [20, 40, 55]) s += ln('tbm', x + cx, y + 25, x + cx, y + 55);
  s += ln('tbm', x + 65, y, x + 65, y + 55);
  for (let i = 1; i < 11; i++) s += ln(i === 4 || i === 5 ? 'tbm' : 'tbt', x, y + 5 * i, x + 65, y + 5 * i);
  [['Изм.', 0, 10], ['Кол.уч', 10, 10], ['Лист', 20, 10], ['№ док.', 30, 10], ['Подп.', 40, 15], ['Дата', 55, 10]].forEach(([t, cx, w]) => { s += tx(x + cx + w / 2, y + 23.8, t, 2.1, 'middle'); });
  ['Разраб.', 'Пров.', '', '', 'Н. контр.', ''].forEach((r, i) => { if (r) s += tx(x + 1, y + 28.8 + 5 * i, r, 2.1); });
  if (m.author) s += tx(x + 21, y + 28.8, clipT(m.author, 18.5, 2.1), 2.1);
  s += tx(x + 60, y + 28.8, dateMY(), 2.1, 'middle');
  s += ln('tbm', x + 65, y + 15, x + 185, y + 15) + ln('tbm', x + 65, y + 25, x + 185, y + 25) + ln('tbm', x + 65, y + 40, x + 185, y + 40);
  s += ln('tbm', x + 135, y + 25, x + 135, y + 55) + ln('tbm', x + 150, y + 25, x + 150, y + 40) + ln('tbm', x + 165, y + 25, x + 165, y + 40) + ln('tbt', x + 135, y + 30, x + 185, y + 30);
  s += tx(x + 125, y + 9.6, clipT(m.code || 'ЗАЛ-01', 115, 5), 5, 'middle', 'b');
  const ob = wrapT(m.object || '', 114, 3).slice(0, 2); ob.forEach((l, i) => { s += tx(x + 125, y + 20.6 - (ob.length - 1) * 1.9 + i * 3.8, l, 3, 'middle'); });
  s += tx(x + 100, y + 31.4, 'Жилая комната (зал)', 3, 'middle') + tx(x + 100, y + 36.4, `S = ${fm(R.W * R.L, 1)} м², h = ${fm(R.H, 2)} м`, 2.5, 'middle');
  [['Стадия', 142.5], ['Лист', 157.5], ['Листов', 175]].forEach(([t, cx]) => { s += tx(x + cx, y + 28.7, t, 2.1, 'middle'); });
  s += tx(x + 142.5, y + 36.6, 'ЭП', 3.5, 'middle') + tx(x + 157.5, y + 36.6, String(n), 3.5, 'middle') + tx(x + 175, y + 36.6, String(total), 3.5, 'middle');
  const nm = wrapT(name, 66, 2.8).slice(0, 3); nm.forEach((l, i) => { s += tx(x + 100, y + 47.9 - (nm.length - 1) * 1.75 + i * 3.5, l, 2.8, 'middle'); });
  const og = wrapT(m.org || '', 46, 2.8).slice(0, 3); og.forEach((l, i) => { s += tx(x + 160, y + 47.9 - (og.length - 1) * 1.75 + i * 3.5, l, 2.8, 'middle'); });
  return s;
}
function sideStrip() { let s = '', yy = 292; for (const [t, h] of [['Инв. № подл.', 25], ['Подп. и дата', 35], ['Взам. инв. №', 25]]) { s += rc('tbm', 8, yy - h, 12, h) + ln('tbm', 13, yy - h, 13, yy) + tx(11.6, yy - h / 2, t, 2.1, 'middle', '', -90); yy -= h; } return s; }
function sheetSVG(n, name, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="sht" viewBox="0 0 420 297" width="420mm" height="297mm" data-sheet="${n}"><style>${SHEET_CSS}</style>`
    + `<defs><pattern id="ht${n}" patternUnits="userSpaceOnUse" width="1.5" height="1.5" patternTransform="rotate(45)"><rect width="1.5" height="1.5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="1.5" stroke="#000" stroke-width=".22"/></pattern></defs>`
    + `<rect x="0" y="0" width="420" height="297" fill="#fff"/>${body}${rc('fr', 20, 5, 395, 287)}${sideStrip()}${titleBlock(n, 3, name)}${tx(415, 296, 'Формат А3', 2.5, 'end')}</svg>`;
}

/* ---------- shared text for the plan drawings and the page table ---------- */
function bindTxt(e) { if (e.kind === 'light' && e.mount === 'ceil') return `${mm(e.x)} от Г; ${mm(e.z)} от А`; return `${mm(e.s)} от ${sref(e.wall)}`; }
function keysTxt(e) { const lab = elecLabels(); return e.keys.map((k, i) => `${i + 1} — ${k.length ? k.map(t => lab[t] || '?').join(', ') : 'не назначена'}`).join('; '); }
function ctlTxt(id) { const c = controlledBy(id); if (c.length) return 'вкл. ' + c.join(', '); if (id.startsWith('led:')) { const it = S.items.find(i => 'led:' + i.id === id); return it && it.type === 'wardrobe' ? 'включается датчиком двери, питание — розетка в шкафу' : 'не подключена к выключателю'; } return 'не подключён к выключателю'; }
function ledName(it) { return 'LED-подсветка: ' + CAT[it.type].name.toLowerCase(); }
function elecRows() { // sorted rows for the spec: R, S, К, L
  const lab = elecLabels(), ord = { R: 0, S: 1, 'К': 2, L: 3 }, rows = [];
  for (const e of S.elec) {
    const ceil = e.kind === 'light' && e.mount === 'ceil', notes = [];
    if (e.kind === 'switch') notes.push('клавиши: ' + keysTxt(e));
    if (e.kind === 'light') notes.push(ctlTxt(e.id));
    if (e.note) notes.push(e.note);
    rows.push({ id: e.id, lab: lab[e.id], name: elecName(e), wall: ceil ? 'потолок' : WRU[e.wall], bind: bindTxt(e), h: ceil ? '—' : mm(e.h), note: notes.join('. ') });
  }
  for (const v of ledList()) rows.push({ id: v.id, item: v.item.id, lab: lab[v.id], name: ledName(v.item), wall: '—', bind: '—', h: '—', note: ctlTxt(v.id) });
  return rows.sort((a, b) => (ord[a.lab[0]] - ord[b.lab[0]]) || (parseInt(a.lab.slice(1)) - parseInt(b.lab.slice(1))));
}
function elecTotals() {
  const t = { p: 0, usb: 0, lan: 0, tv: 0, sw: 0, keys: 0, ceil: 0, wall: 0, led: ledList().length, ac: 0, boxes: 0 };
  for (const e of S.elec) {
    if (e.kind === 'socket') { for (const m of e.mods) { if (m === 's' || m === 'su') t.p++; if (m === 'su') t.usb++; if (m === 'lan') t.lan++; if (m === 'tv') t.tv++; } t.boxes += e.mods.length; }
    if (e.kind === 'switch') { t.sw++; t.keys += e.keys.length; t.boxes++; }
    if (e.kind === 'ac') { t.ac++; t.boxes++; }
    if (e.kind === 'light') { if (e.mount === 'ceil') t.ceil++; else t.wall++; }
  }
  return t;
}
function passPairs() { const lab = elecLabels(), out = new Set(); for (const t of lightTargets()) { const sw = S.elec.filter(e => e.kind === 'switch' && e.keys.some(k => k.includes(t.id))).map(e => lab[e.id]); if (sw.length > 1) out.add(sw.sort().join(' и ')); } return [...out]; }
function cableNotes() {
  const has = ty => S.items.some(i => i.type === ty), pp = passPairs(), T = elecTotals(), out = [];
  out.push('Розетки — кабель ВВГнг(А)-LS 3×2,5, дифавтомат 16 А / 30 мА.' + (has('desk') ? ' Розетки у рабочего стола — отдельной линией.' : ''));
  out.push('Свет — ВВГнг(А)-LS 3×1,5, автомат 10 А.' + (pp.length ? ` Проходная схема: ${pp.join('; ')} — трёхжильный кабель между выключателями.` : ''));
  if (T.ac) out.push('Кондиционер (резерв) — своя линия 3×2,5, автомат 16 А.');
  out.push('Высота — от чистого пола до центра коробки. Привязка — от угла до центра коробки, угол указан в таблице.');
  out.push('Кабель вести по потолку над натяжным и спусками вниз. Несущие стены горизонтально не штробить.');
  const tvs = S.items.find(i => i.type === 'tv' && i.opts.shelf);
  out.push('Подрозетники ставить до чистовой отделки стен.' + (tvs ? ' От блока за ТВ вниз к полке — гофротруба Ø25 под провода.' : ''));
  out.push('Эскиз: размеры ориентировочные, точки уточнить по месту.');
  return out;
}

/* ---------- plan pieces on paper ---------- */
function planGeom(m) { const R = S.room, t = T3, wM = R.W + t.W + t.E + 2 * m, hM = R.L + t.N + t.S + 2 * m; for (const sc of [40, 50, 75, 100]) { const k = 1000 / sc; if (wM * k <= 185 && hM * k <= 258) return { sc, k, wM, hM, m }; } return { sc: 100, k: 10, wM, hM, m }; }
function itemSig(it) { return JSON.stringify([it.type, cmv(it.w), cmv(it.d), cmv(it.h), it.opts]); }
function positions() {
  const order = Object.keys(CAT), its = [...S.items].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)), g = new Map();
  for (const it of its) { const k = itemSig(it); if (!g.has(k)) g.set(k, []); g.get(k).push(it); }
  let n = 0; const rows = [], pos = {}; for (const list of g.values()) { n++; for (const it of list) pos[it.id] = n; rows.push({ n, it: list[0], q: list.length }); }
  return { rows, pos };
}
function itemDesc(it) {
  const o = it.opts, F = k => (FABRIC[k] || [k])[0], Wd = k => (WOOD[k] || [k])[0];
  switch (it.type) {
    case 'sofa': return `Диван прямой, обивка «${F(o.color)}», ножки — ${o.legs === 'black' ? 'чёрные' : 'дерево'}`;
    case 'armchair': return `Кресло мягкое, обивка «${F(o.color)}»`;
    case 'coffee': return `Столик журнальный ${o.shape === 'round' ? 'круглый' : 'прямоугольный'}, столешница — ${Wd(o.top)}`;
    case 'pouf': return `Пуф, обивка «${F(o.color)}»`;
    case 'rug': return `Ковёр, ${(RUGC[o.color] || [o.color])[0]}, рисунок — ${({ lattice: 'ромб', plain: 'гладкий', stripes: 'полосы', border: 'кайма' })[o.pattern] || o.pattern}`;
    case 'bed': return `Кровать ${o.size}×200${o.lift ? ' с подъёмным механизмом' : ''}, изголовье — ${({ channels: 'со стёжкой', panel: 'панель', none: 'нет' })[o.head]}, обивка «${F(o.color)}»`;
    case 'nightstand': return `Тумба прикроватная, ${Wd(o.color)}`;
    case 'wardrobe': return `Шкаф ${o.style === 'hinged' ? 'с распашными дверями' : 'купе'} встроенный${o.style === 'panels' ? ', двери с филёнками' : o.style === 'mirror' ? ', с зеркалом' : ''}, ${(PANEL[o.color] || [o.color])[0]}, профиль — ${(PROFILE[o.profile] || [o.profile])[0]}${o.led ? ', подсветка' : ''}`;
    case 'divider': return `Стеллаж-перегородка открытый, ${Wd(o.color)}${o.led ? ', LED-подсветка' : ''}`;
    case 'bookcase': return `Стеллаж пристенный, ${Wd(o.color)}${o.led ? ', LED-подсветка' : ''}`;
    case 'dresser': return `Комод, ${Wd(o.color)}`;
    case 'desk': return `Стол с электроприводом высоты, столешница ${({ grey: 'серая', white: 'белая', oak: 'дуб', black: 'чёрная' })[o.top]}, рама ${o.frame === 'black' ? 'чёрная' : 'белая'}`;
    case 'chair': return `Кресло офисное, ${({ graphite: 'графит', grey: 'серое', white: 'белое' })[o.color]}`;
    case 'tv': return `Телевизор ${o.size}″ на настенном кронштейне${o.shelf ? `; полка под саундбар ${mm(o.shelfW)} мм` : ''}`;
    case 'tvstand': return `Тумба под ТВ, ${Wd(o.color)}`;
    case 'shelf': return `Полка настенная, ${Wd(o.color)}${o.led ? ', LED-подсветка' : ''}`;
    case 'picture': return 'Картина / постер в раме';
    case 'floorlamp': return 'Торшер';
    case 'plant': return 'Растение в кашпо';
  }
  return CAT[it.type].name;
}
function itemNote(it) {
  if (it.type === 'wardrobe') return 'По замеру' + (it.opts.toCeil ? ', до потолка' : '');
  if (it.type === 'divider') return 'Крепить к полу и стене';
  if (it.type === 'tv') return `Стена ${WRU[it.wall]}, центр экрана h ${mm(it.y)}`;
  if (it.type === 'shelf' || it.type === 'picture') return `Стена ${WRU[it.wall]}, h ${mm(it.y)}`;
  return '';
}
function itemDims(it) { if (CAT[it.type].wall) return it.type === 'shelf' ? `${mm(it.w)}×${mm(it.d)}` : `${mm(it.w)}×${mm(it.h)}`; return it.type === 'rug' ? `${mm(it.w)}×${mm(it.d)}` : `${mm(it.w)}×${mm(it.d)}×${mm(it.h)}`; }
function wallAreaOf(w) { const R = S.room, B = winGeom(R), d = doorGeom(R); let a = wallLen(w, R) * R.H; if (w === 'N') a -= (B.w1 - B.w0) * (B.top - B.sill); if (w === 'E') a -= (d.z1 - d.z0) * d.h; return a; }
function finishRows() {
  const R = S.room, f = S.fin, area = R.W * R.L, d = doorGeom(R), plin = 2 * (R.W + R.L) - (d.z1 - d.z0);
  const wd = w => w.type === 'pattern' ? `Обои с узором «${PATTERNS[w.pattern]}», фон — ${colorName(w.color)}${w.color2 ? ', рисунок — ' + colorName(w.color2) : ''}` : `${WALLT[w.type]}, ${colorName(w.color)}`;
  const rows = [['Потолок', 'Натяжной, существующий — без изменений', fm(area, 1) + ' м²', 'Люстра на прежнем месте']];
  const all = WALLS.reduce((a, w) => a + wallAreaOf(w), 0);
  if (f.accent.wall) { const aa = wallAreaOf(f.accent.wall); rows.push(['Стены', wd(f.wall), fm(all - aa, 1) + ' м²', 'Подрозетники — до отделки']); rows.push([`Стена ${WRU[f.accent.wall]}`, wd(f.accent) + ' (акцент)', fm(aa, 1) + ' м²', '']); }
  else rows.push(['Стены', wd(f.wall), fm(all, 1) + ' м²', 'Подрозетники — до отделки']);
  rows.push(['Пол', FLOORS[f.floor] + (f.floor === 'lino' ? ', новый' : ''), fm(area, 1) + ' м²', f.floor === 'lino' ? 'Взамен старого, без стыков в проходе' : '']);
  rows.push(['Плинтус', `Напольный, ${f.plinth === 'floor' ? 'в тон пола' : PLINTH[f.plinth][0]}`, fm(plin, 1) + ' м', 'Новый, профиль как прежний']);
  rows.push(['Окно', f.curt.type === 'none' ? 'Без штор' : `Шторы: ${CURT[f.curt.type].toLowerCase()}, ${colorName(f.curt.color)}${f.curt.tulle ? ' + тюль' : ''}`, '', f.curt.type === 'none' ? '' : 'Карниз потолочный']);
  return rows;
}
function posLabels(pos, k) {
  const placed = [], out = [];
  const items = [...S.items].sort((a, b) => (a.type === 'rug') - (b.type === 'rug'));
  for (const it of items) {
    let c;
    if (CAT[it.type].wall) { const p = wallPt(it.wall, it.s); c = [p.x + p.nx * 0.32, p.z + p.nz * 0.32]; }
    else if (it.type === 'rug') c = fromLocal(it, -it.w / 2 + 0.22, it.d / 2 - 0.22);
    else c = [it.x, it.z];
    let [x, y] = [c[0] * k, c[1] * k];
    for (let tries = 0; tries < 8 && placed.some(([a, b]) => Math.hypot(a - x, b - y) < 4.6); tries++) { const ang = tries * Math.PI / 4; x = c[0] * k + Math.cos(ang) * 5; y = c[1] * k + Math.sin(ang) * 5; }
    placed.push([x, y]); out.push(`<g class="pos"><circle cx="${n1(x)}" cy="${n1(y)}" r="2.1"/><text x="${n1(x)}" y="${n1(y + 0.9)}" text-anchor="middle">${pos[it.id]}</text></g>`);
  }
  return out.join('');
}
function paperPlan(n, kind, G, ox, oy) {
  const k = G.k, sz = 1.4, lab = elecLabels(), fo = { fs: 2.5 / k };
  let s = `<g transform="translate(${n1(ox)} ${n1(oy)})"><g${kind === 'el' ? ' class="gh"' : ''}>`;
  for (const it of [...S.items].sort((a, b) => (b.type === 'rug') - (a.type === 'rug'))) s += `<g transform="${itemTransform(it, k)}">${symItem(it, k)}</g>`;
  s += '</g>' + shellSym(S.room, k).replace(/class="wall"/g, `class="wall" fill="url(#ht${n})"`) + wallMarks(k, kind === 'el' ? 0.86 : 0.72, 0.11);
  if (kind === 'furn') s += roomDims(k, 0.32, fo) + posLabels(positions().pos, k);
  else {
    s += ledList().map(v => ledSym(v.item, k)).join('') + ctlLines(k, sz);
    for (const e of S.elec) s += elSym(e, k, lab, { sz });
    for (const o of elLabelLayout(k, sz, 2.5)) s += `<text class="el-lbl" x="${n1(o.x)}" y="${n1(o.y)}" text-anchor="${o.a}">${esc(o.t)}${o.sub ? `<tspan class="el-sub" dx=".6">${o.sub}</tspan>` : ''}</text>`;
    for (const v of ledList()) { const c = itemPos(v.item); s += `<text class="el-lbl" x="${n1(c.x * k)}" y="${n1(c.z * k - 1.6)}" text-anchor="middle">${lab[v.id]}<tspan class="el-sub" dx=".6">LED</tspan></text>`; }
    s += elecChains(k, 0.32, fo);
  }
  return s + '</g>';
}
function flow(blocks, colX, colW, y0, yMax, alt) { // stack blocks in the right column, spill into the area under the plan
  let y = y0, s = '', ay = alt ? alt.y : 0;
  for (const b of blocks) {
    let r = b(colW); if (y + r.h <= yMax) { s += `<g transform="translate(${n1(colX)} ${n1(y)})">${r.s}</g>`; y += r.h + 6; continue; }
    if (alt) { r = b(alt.w); if (ay + r.h <= alt.yMax) { s += `<g transform="translate(${n1(alt.x)} ${n1(ay)})">${r.s}</g>`; ay += r.h + 6; continue; } }
    s += `<g transform="translate(${n1(colX)} ${n1(y)})">${r.s}</g>`; y += r.h + 6;
  }
  return s;
}
const titled = (title, inner) => ({ s: tx(0, 3.6, title, 3.5, 'start', 'ttl') + `<g transform="translate(0 6)">${inner.s}</g>`, h: inner.h + 6 });

/* ---------- sheet 1: furniture ---------- */
function sheet1() {
  const G = planGeom(0.9), k = G.k, t = T3, px = 25, py = 22, ox = px + (t.W + G.m) * k, oy = py + (t.N + G.m) * k, R = S.room;
  let b = tx(px + G.wM * k / 2, 15, 'План расстановки мебели', 5, 'middle', 'ttl') + tx(px + G.wM * k / 2, 19.6, `М1:${G.sc}`, 3, 'middle') + paperPlan(1, 'furn', G, ox, oy);
  const colX = Math.max(px + G.wM * k + 10, 150), colW = 410 - colX, P = positions();
  const blocks = [
    w => { const fx = [10, 0, 36, 10, 0], rest = w - 56; fx[1] = Math.round(rest * 0.58); fx[4] = rest - fx[1];
      return titled('Экспликация мебели и оборудования', tbl(0, 0, [{ t: 'Поз.', w: fx[0], a: 'm' }, { t: 'Наименование', w: fx[1], wrap: true }, { t: 'Габариты (Ш×Г×В), мм', w: fx[2], a: 'm' }, { t: 'Кол.', w: fx[3], a: 'm' }, { t: 'Примечание', w: fx[4], wrap: true }], P.rows.map(r => [String(r.n), itemDesc(r.it), itemDims(r.it), String(r.q), itemNote(r.it)]))); },
    w => titled('Ведомость отделки', tbl(0, 0, [{ t: 'Элемент', w: 24 }, { t: 'Отделка', w: Math.round((w - 46) * 0.6), wrap: true }, { t: 'Кол-во', w: 22, a: 'm' }, { t: 'Примечание', w: w - 46 - Math.round((w - 46) * 0.6), wrap: true }], finishRows())),
    w => noteBlock(0, 0, w, 'Примечания', [
      'Эскиз. Размеры ориентировочные, сняты по фото — до заказа мебели и начала работ уточнить обмером.',
      'Габариты мебели — Ш×Г×В, мм. ' + (S.items.some(i => i.type === 'wardrobe') ? 'Встроенный шкаф изготовить по замеру после чистовой отделки.' : 'Мебель приставная, по каталогу.'),
      'Стены: А — оконная, Б — с проёмом в коридор, В — напротив окна, Г — напротив проёма.',
      'Электрика — лист 2, развёртки стен с высотами точек — лист 3.',
    ]),
  ];
  b += flow(blocks, colX, colW, 12, 231, { x: 25, w: 198, y: py + G.hM * k + 4, yMax: 288 });
  return sheetSVG(1, 'План расстановки мебели. Экспликация. Ведомость отделки', b);
}

/* ---------- sheet 2: electrics ---------- */
function legendBlock(w) {
  const has = {}; for (const e of S.elec) { if (e.kind === 'socket') e.mods.forEach(m => { has[m] = 1; }); if (e.kind === 'switch') { has.sw = 1; e.keys.forEach((kk, i) => { if (kk.length) has['k' + Math.min(i + 1, 3)] = 1; }); } if (e.kind === 'ac') has.ac = 1; if (e.kind === 'light') has[e.mount === 'ceil' ? (e.variant === 'spot' ? 'spot' : e.variant === 'pendant' ? 'pend' : 'ceil') : 'wl'] = 1; }
  if (ledList().length) has.led = 1;
  const k = 25, sz = 1.15, P = e => elSym(Object.assign({ wall: 'N', s: 0, h: 0.3 }, e), k, {}, { sz }), wl = '<line class="tbm" x1="-4" y1="0" x2="4" y2="0"/>';
  const L = [['s', wl + P({ kind: 'socket', mods: ['s'] }), 'Розетка 220 В, знак на модуль'], ['su', wl + P({ kind: 'socket', mods: ['su'] }), 'Розетка 220 В с USB'], ['lan', wl + P({ kind: 'socket', mods: ['lan'] }), 'Розетка интернет RJ-45'], ['tv', wl + P({ kind: 'socket', mods: ['tv'] }), 'Розетка ТВ (антенна)'],
    ['sw', wl + P({ kind: 'switch', keys: [[], []] }), 'Выключатель (штрихи — клавиши)'], ['ceil', P({ kind: 'light', mount: 'ceil', variant: 'ring', x: 0, z: 0.13 }), 'Люстра / потолочный светильник'], ['pend', P({ kind: 'light', mount: 'ceil', variant: 'pendant', x: 0, z: 0.13 }), 'Подвесной светильник'], ['spot', P({ kind: 'light', mount: 'ceil', variant: 'spot', x: 0, z: 0.08 }), 'Точечный светильник'],
    ['wl', wl + P({ kind: 'light', mount: 'wall', variant: 'sphere' }), 'Бра (вывод на стене)'], ['led', '<line class="led" x1="-5" y1="2.5" x2="5" y2="2.5"/>', 'LED-лента / подсветка'], ['ac', wl + P({ kind: 'ac' }).replace(/<path class="elo" d="M[^"]*Z"\/>$/, ''), 'Розетка под кондиционер'],
    ['k1', '<path class="ctl k1" d="M-5 4Q0 -1 5 4"/>', 'Управление — клавиша 1'], ['k2', '<path class="ctl k2" d="M-5 4Q0 -1 5 4"/>', 'Управление — клавиша 2'], ['k3', '<path class="ctl k3" d="M-5 4Q0 -1 5 4"/>', 'Управление — клавиша 3']].filter(r => has[r[0]]);
  const colW = w / 2, rh = 8.4; let s = '';
  L.forEach(([, sym, t], i) => { const cx = (i % 2) * colW, cy = Math.floor(i / 2) * rh; s += `<g transform="translate(${n1(cx + 6)} ${n1(cy + 1.4)})">${sym}</g>` + tx(cx + 14, cy + 5, clipT(t, colW - 15, 2.5), 2.5); });
  const h = Math.ceil(L.length / 2) * rh; s += tx(0, h + 3.4, 'R — розетки, S — выключатели, L — свет, К — кондиционер; h — высота от пола до центра, мм', 2.3);
  return titled('Условные обозначения', { s, h: h + 5 });
}
function sheet2() {
  const G = planGeom(1.0), k = G.k, t = T3, px = 25, py = 22, ox = px + (t.W + G.m) * k, oy = py + (t.N + G.m) * k, T = elecTotals();
  let b = tx(px + G.wM * k / 2, 15, 'План электрики: розетки, выключатели, свет', 5, 'middle', 'ttl') + tx(px + G.wM * k / 2, 19.6, `М1:${G.sc}`, 3, 'middle') + paperPlan(2, 'el', G, ox, oy);
  const colX = Math.max(px + G.wM * k + 10, 150), colW = 410 - colX, rows = elecRows();
  const tot = `Итого: розеток 220 В — ${T.p} (с USB — ${T.usb}), RJ-45 — ${T.lan}, ТВ — ${T.tv}; выключателей — ${T.sw} (клавиш — ${T.keys}); люстр и потолочных — ${T.ceil}, бра — ${T.wall}, LED — ${T.led}; монтажных коробок — ${T.boxes}.`;
  const spec = (w, rh) => { const fx = [11, Math.round((w - 64) * 0.42), 14, 30, 16]; fx.push(w - fx.reduce((a, c) => a + c, 0)); const tb = tbl(0, 0, [{ t: 'Поз.', w: fx[0], a: 'm' }, { t: 'Наименование', w: fx[1], wrap: true }, { t: 'Стена', w: fx[2], a: 'm' }, { t: 'Привязка, мм', w: fx[3], a: 'm' }, { t: 'Высота, мм', w: fx[4], a: 'm' }, { t: 'Примечание', w: fx[5], wrap: true }], rows.map(r => Object.assign([r.lab, r.name, r.wall, r.bind, r.h, r.note], { bold: true })), { rh }); const tl = wrapT(tot, w, 2.5); return { s: tb.s + tl.map((l, i) => tx(0, tb.h + 4.4 + i * 3.2, l, 2.5)).join(''), h: tb.h + 3 + tl.length * 3.2 }; };
  // legend + notes side by side, then the spec; shrink rows if needed, else notes go under the plan
  const lw = Math.min(118, Math.round(colW * 0.5)), nw = colW - lw - 6;
  const leg = legendBlock(lw), notes = noteBlock(0, 0, nw, 'Указания по монтажу', cableNotes(), 2.3);
  let top = Math.max(leg.h, notes.h), spill = false, sp = null;
  for (const rh of [6, 5.4, 4.8]) { sp = titled('Ведомость электроточек', spec(colW, rh)); if (12 + top + 6 + sp.h <= 232) break; }
  if (12 + top + 6 + sp.h > 232) { spill = true; top = leg.h; }
  b += `<g transform="translate(${n1(colX)} 12)">${leg.s}</g>`;
  const under = { x: 25, y: py + G.hM * k + 4, w: 198 };
  if (!spill) b += `<g transform="translate(${n1(colX + lw + 6)} 12)">${notes.s}</g>`;
  else { const n2 = noteBlock(0, 0, under.w, 'Указания по монтажу', cableNotes(), 2.3); b += `<g transform="translate(${under.x} ${n1(under.y)})">${n2.s}</g>`; }
  b += `<g transform="translate(${n1(colX)} ${n1(12 + top + 6)})">${sp.s}</g>`;
  return sheetSVG(2, 'План электрики. Условные обозначения. Ведомость электроточек', b);
}

/* ---------- sheet 3: wall elevations ---------- */
const NEIGH = { N: ['W', 'E'], E: ['N', 'S'], S: ['E', 'W'], W: ['S', 'N'] };
function levelMark(x, y, t) { return `<path class="lvm" d="M${n1(x)} ${n1(y)}l-1.4 -1.4h2.8z"/>` + ln('lvl', x, y - 1.4, x, y - 4.4) + ln('lvl', x, y - 4.4, x - 12, y - 4.4) + tx(x - 6, y - 5.2, t, 2.5, 'middle'); }
function elevation(w, k, X0, Y0) {
  const R = S.room, len = wallLen(w, R), H = R.H, rev = w === 'S' || w === 'W', U = v => rev ? len - v : v, px = u => X0 + u * k, py = v => Y0 - v * k, F = 2.5 / k;
  const B = winGeom(R), d = doorGeom(R), lab = elecLabels(), along = (x, z) => (w === 'N' || w === 'S') ? x : z, stops = [0, len];
  let s = '';
  if (w === 'N') {
    const fr = 0.065, cw = (B.w1 - B.w0 - 2 * fr) / B.n;
    s += rc('eo', px(B.w0), py(B.top), (B.w1 - B.w0) * k, (B.top - B.sill) * k) + rc('eo2', px(B.w0 + fr), py(B.top - fr), (B.w1 - B.w0 - 2 * fr) * k, (B.top - B.sill - 2 * fr) * k);
    for (let i = 1; i < B.n; i++) s += ln('eo2', px(B.w0 + fr + i * cw), py(B.top - fr), px(B.w0 + fr + i * cw), py(B.sill + fr));
    for (let i = 0; i < B.n; i++) { if (!(B.n === 1 || (B.n === 2 && i === 1) || (B.n === 3 && i !== 1))) continue; const a0 = B.w0 + fr + i * cw, a1 = a0 + cw, hinge = B.n === 3 && i === 0 ? a0 : a1, free = hinge === a0 ? a1 : a0; s += `<path class="eo2" style="stroke-dasharray:1.2 .8" d="M${n1(px(free))} ${n1(py(B.top - fr))}L${n1(px(hinge))} ${n1(py((B.top + B.sill) / 2))}L${n1(px(free))} ${n1(py(B.sill + fr))}"/>`; }
    s += rc('eo', px(B.w0 - 0.05), py(B.sill), (B.w1 - B.w0 + 0.1) * k, 0.03 * k) + rc('erad', px(B.w0 + 0.12), py(0.14 + Math.min(0.5, B.sill - 0.25)), (B.w1 - B.w0 - 0.24) * k, Math.min(0.5, B.sill - 0.25) * k); stops.push(B.w0, B.w1);
  }
  if (w === 'E') { s += rc('eo2', px(d.z0 - d.cas), py(d.h + d.cas), (d.z1 - d.z0 + 2 * d.cas) * k, (d.h + d.cas) * k) + rc('eo', px(d.z0), py(d.h), (d.z1 - d.z0) * k, d.h * k) + tx(px((d.z0 + d.z1) / 2), py(1.0), 'проём', 2.2, 'middle', 'fen'); stops.push(d.z0, d.z1); }
  for (const it of S.items) {
    if (CAT[it.type].wall || it.type === 'rug') continue;
    const bb = bbox(it), dist = { N: bb[1], S: R.L - bb[3], W: bb[0], E: R.W - bb[2] }[w]; if (dist > 0.6) continue;
    const seg = (z0, z1, h) => { const us = [[-it.w / 2, z0], [it.w / 2, z0], [it.w / 2, z1], [-it.w / 2, z1]].map(([lx, lz]) => U(along(...fromLocal(it, lx, lz)))), u0 = Math.max(0, Math.min(...us)), u1 = Math.min(len, Math.max(...us)); return u1 - u0 > 0.01 ? rc('fe', px(u0), py(h), (u1 - u0) * k, h * k) : ''; };
    const z0 = -it.d / 2, z1 = it.d / 2;
    if (it.type === 'bed') { const hb = it.opts.head === 'none' ? 0 : 0.1; s += seg(z0 + hb, z1, 0.52) + (hb ? seg(z0, z0 + hb, it.h) : ''); }
    else if (it.type === 'sofa' || it.type === 'armchair') s += seg(z0, z0 + 0.2, it.h) + seg(z0 + 0.2, z1, 0.45);
    else s += seg(z0, z1, it.h);
    const us = corners(it).map(([x, z]) => U(along(x, z))), u0 = Math.max(0, Math.min(...us)), u1 = Math.min(len, Math.max(...us));
    if (SHORT[it.type] && (u1 - u0) * k > 12) s += tx(px((u0 + u1) / 2), py(Math.min(it.h, 1.2) / 2) + 0.8, SHORT[it.type], 2, 'middle', 'fen');
  }
  for (const it of S.items.filter(i => CAT[i.type].wall && i.wall === w)) {
    const u = U(it.s);
    if (it.type === 'tv') {
      s += rc('etv', px(u - it.w / 2), py(it.y + it.h / 2), it.w * k, it.h * k) + rc('eo2', px(u - it.w / 2 + 0.02), py(it.y + it.h / 2 - 0.02), (it.w - 0.04) * k, (it.h - 0.04) * k) + tx(px(u), py(it.y) + 1, `ТВ ${it.opts.size}″`, 2.2, 'middle', 'fen');
      if (it.opts.shelf) { const sw = it.opts.shelfW, top = it.y - it.h / 2 - 0.13; s += rc('efs', px(u - sw / 2), py(top), sw * k, 0.036 * k); if (it.opts.soundbar) { const bw = Math.min(0.92, sw - 0.1); s += rc('eo2', px(u - bw / 2), py(top + 0.065), bw * k, 0.065 * k); } }
    } else if (it.type === 'shelf') s += rc('efs', px(u - it.w / 2), py(it.y + 0.0175), it.w * k, 0.035 * k);
    else s += rc('etv', px(u - it.w / 2), py(it.y + it.h / 2), it.w * k, it.h * k) + rc('eo2', px(u - it.w / 2 + 0.04), py(it.y + it.h / 2 - 0.04), (it.w - 0.08) * k, (it.h - 0.08) * k);
  }
  const pts = S.elec.filter(e => e.wall === w && !(e.kind === 'light' && e.mount === 'ceil')), a = Math.max(1.5, 0.082 * k), fh = Math.max(1.8, 0.095 * k), lbls = [];
  for (const e of pts) {
    const u = U(e.s), x = px(u), y = py(e.h); stops.push(u);
    if (e.kind === 'light') { const r = Math.max(1.5, 0.08 * k), q = r * 0.7071; s += `<circle class="el" cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}"/><path class="ell" d="M${n1(x - q)} ${n1(y - q)}l${n1(2 * q)} ${n1(2 * q)}M${n1(x + q)} ${n1(y - q)}l${n1(-2 * q)} ${n1(2 * q)}"/>`; lbls.push({ x, y: y - r - 0.9, t: lab[e.id] }); }
    else {
      const mods = e.kind === 'socket' ? e.mods : [e.kind], n = mods.length, fw = n * a + 0.25 * a, x0 = x - n * a / 2;
      if (e.kind === 'ac') { const s0 = U(e.s - 0.9), s1 = U(e.s - 0.1), top = Math.min(e.h + 0.14, H - 0.06); s += `<rect class="elo" x="${n1(px(Math.min(s0, s1)))}" y="${n1(py(top))}" width="${n1(Math.abs(s1 - s0) * k)}" height="${n1(0.28 * k)}"/>`; }
      s += rc(e.kind === 'ac' ? 'elo' : 'el', x - fw / 2, y - fh / 2, fw, fh);
      mods.forEach((m, i) => {
        const cx = x0 + i * a + a / 2;
        if (m === 's' || m === 'su' || m === 'ac') s += `<circle class="ell" cx="${n1(cx)}" cy="${n1(y)}" r="${n1(a * 0.33)}"/>`;
        if (m === 'su') s += rc('elf', cx - a * 0.12, y + a * 0.36, a * 0.24, a * 0.1);
        if (m === 'lan' || m === 'tv') s += rc('elf', cx - a * 0.2, y - a * 0.2, a * 0.4, a * 0.4);
        if (i) s += ln('ell', x0 + i * a, y - fh / 2, x0 + i * a, y + fh / 2);
        if (m === 'switch') { const kk = e.keys.length; for (let j = 1; j < kk; j++) s += ln('ell', x0 + a * j / kk, y - fh / 2 + 0.3, x0 + a * j / kk, y + fh / 2 - 0.3); }
      });
      lbls.push({ x, y: y - fh / 2 - 0.9, t: lab[e.id] });
    }
  }
  lbls.sort((p, q) => q.y - p.y || p.x - q.x); const placed = [];
  for (const L of lbls) { const w2 = L.t.length * 0.66 * 2.3 / 2 + 0.4; let y = L.y; for (let g = 0; g < 6 && placed.some(P => Math.abs(P.x - L.x) < P.w2 + w2 && Math.abs(P.y - y) < 2.6); g++) y -= 2.7; placed.push({ x: L.x, y, w2 }); s += tx(L.x, y, L.t, 2.3, 'middle', 'b'); }
  s += rc('ew', px(0), py(H), len * k, H * k) + ln('egnd', px(0) - 3, py(0), px(len) + 3, py(0));
  const hs = [...new Set([...pts.map(e => r3(e.h)), ...(w === 'N' ? [B.sill, B.top] : w === 'E' ? [d.h] : [])])];
  s += `<g transform="translate(${n1(px(len) + 8)} ${n1(Y0)})">${dimChain('z', [0, ...hs.map(v => -v), -H], 0, -8 / k, k, '', { fs: F })}</g>`;
  s += `<g transform="translate(${n1(X0)} ${n1(Y0)})">${dimChain('x', stops, 7.5 / k, 0, k, '', { fs: F })}</g>`;
  s += ln('ext', px(0) - 1, py(H), px(0) - 4.5, py(H)) + ln('ext', px(0) - 1, py(0), px(0) - 4.5, py(0)) + levelMark(px(0) - 3, py(H), '+' + fm(H, 3)) + levelMark(px(0) - 3, py(0), '±0,000');
  const [lw, rw] = NEIGH[w];
  for (const [u, l] of [[0, lw], [len, rw]]) s += ln('ext', px(u), Y0 + 9.5, px(u), Y0 + 12.4) + `<g class="wl"><circle cx="${n1(px(u))}" cy="${n1(Y0 + 14.8)}" r="2.4"/><text x="${n1(px(u))}" y="${n1(Y0 + 16.05)}" text-anchor="middle">${WRU[l]}</text></g>`;
  s += tx(px(len / 2), py(H) - 5, `Развёртка стены ${WRU[w]}  М1:${Math.round(1000 / k)}`, 3.5, 'middle', 'ttl');
  return s;
}
function keyPlan(x, y, maxW, maxH) {
  const R = S.room, k = Math.min(9, (maxW - 14) / R.W, (maxH - 18) / R.L), B = winGeom(R), d = doorGeom(R), X = v => x + 7 + v * k, Y = v => y + 9 + v * k;
  let s = tx(x, y + 3.6, 'Схема развёрток', 3.5, 'start', 'ttl');
  s += `<path class="kp" d="M${n1(X(0))} ${n1(Y(0))}H${n1(X(B.l))}M${n1(X(B.r))} ${n1(Y(0))}H${n1(X(R.W))}V${n1(Y(d.z0))}M${n1(X(R.W))} ${n1(Y(d.z1))}V${n1(Y(R.L))}H${n1(X(0))}V${n1(Y(0))}"/>`;
  s += `<path class="win" d="M${n1(X(B.l))} ${n1(Y(0))}H${n1(X(B.r))}"/>`;
  const cx = R.W / 2, cz = R.L / 2, A = { N: [cx, 0.55, 0, -1], S: [cx, R.L - 0.55, 0, 1], W: [0.55, cz, -1, 0], E: [R.W - 0.55, cz, 1, 0] };
  for (const w of WALLS) { const [ax, az, dx, dz] = A[w], px = X(ax), py = Y(az), q = 1.6; s += `<path class="kpa" d="M${n1(px + dx * 2.4)} ${n1(py + dz * 2.4)}L${n1(px - dz * q)} ${n1(py + dx * q)}L${n1(px + dz * q)} ${n1(py - dx * q)}Z"/>` + tx(px - dx * 3.2, py - dz * 3.2 + 1.2, WRU[w], 3.5, 'middle', 'b'); }
  return { s, h: 9 + R.L * k + 4 };
}
function sheet3() {
  const R = S.room, rowW = k => (R.W + R.L) * k + 2 * 40 + 12;
  let sc = 50; for (const c of [50, 75, 100]) { sc = c; if (rowW(1000 / c) <= 385 && 2 * (R.H * (1000 / c) + 34) + 8 <= 196) break; }
  const k = 1000 / sc, rowH = R.H * k + 34; let b = '';
  const place = (w, X0, top) => { b += elevation(w, k, X0 + 22, top + 12 + R.H * k); return X0 + wallLen(w, R) * k + 40 + 12; };
  let x = 25; x = place('N', x, 12); place('E', x, 12);
  x = 25; x = place('S', x, 12 + rowH + 6); place('W', x, 12 + rowH + 6);
  const rowEnd = 25 + rowW(k) - 12, by = 12 + 2 * rowH + 10, notes = ['Развёртки — вид изнутри комнаты на стену. Мебель показана условно, контуром.', 'Высоты — от чистого пола до центра коробки или светильника, мм. Привязки по горизонтали — от левого угла развёртки.', 'Обозначения точек — по листу 2. Размеры ориентировочные, уточнить по месту.'];
  if (410 - rowEnd >= 52) { // key plan in the free right column, notes under the elevations
    const kp = keyPlan(rowEnd + 10, 12, 410 - rowEnd - 10, 150); b += kp.s;
    const nb = noteBlock(0, 0, 198, 'Примечания', notes, 2.5); b += `<g transform="translate(25 ${n1(by)})">${nb.s}</g>`;
  } else {
    const kp = keyPlan(25, by, 60, 288 - by); b += kp.s;
    const nb = noteBlock(0, 0, 225 - 92, 'Примечания', notes, 2.5); b += `<g transform="translate(92 ${n1(by)})">${nb.s}</g>`;
  }
  return sheetSVG(3, 'Развёртки стен А, Б, В, Г с точками электрики', b);
}
function renderSheets() {
  const fns = [sheet1, sheet2, sheet3];
  fns.forEach((fn, i) => { const host = $('#sheet' + (i + 1)); if (!host) return; try { host.innerHTML = fn(); } catch (e) { console.error(e); host.innerHTML = `<p class="muted">Лист ${i + 1} не построился: ${esc(e.message)}</p>`; } });
}
function downloadSheet(n) {
  const svg = [sheet1, sheet2, sheet3][n - 1](), blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + svg], { type: 'image/svg+xml' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `zal-list-${n}.svg`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
