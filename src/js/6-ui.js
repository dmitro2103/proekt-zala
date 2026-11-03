/* ============ 6. UI: selection, panels, add/remove, finishes, room ============ */
const CNAME = {
  '#F2EEE7': 'молочный', '#EDE7DD': 'слоновая кость', '#E7E6E2': 'светло-серый', '#EADFCF': 'бежевый', '#E2E7E3': 'серо-мятный', '#E6E0E8': 'лавандовый', '#DDE4EA': 'серо-голубой', '#F5F3EE': 'тёплый белый', '#D9CDBD': 'песочный', '#C9D1C4': 'шалфей', '#C4CCD6': 'стальной', '#E8D6CC': 'пудровый', '#E9E1D5': 'бежевый светлый',
  '#DDD4C6': 'натуральный лён', '#EFEBE4': 'молочный', '#C9C3B8': 'серо-бежевый', '#B9C1B0': 'шалфей', '#9AA2AE': 'серо-голубой', '#C9A98E': 'карамель', '#7B7F86': 'серый', '#5D6168': 'графит', '#A89F92': 'мокко', '#6E7A6A': 'оливковый', '#3F4A5E': 'тёмно-синий', '#8A5F4E': 'терракота',
};
const colorName = c => CNAME[String(c).toUpperCase()] || String(c).toUpperCase();
const UI = { tab: 'add', layout: '3d', toastT: 0, nudgeT: 0 };
const PAL = { fabric: FABRIC, wood: WOOD, panel: PANEL, profile: PROFILE, rug: RUGC, linen: LINEN };
const DIML = { w: 'Ширина', d: 'Глубина', h: 'Высота' };

function toast(msg, actLabel, act) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${msg}</span>` + (actLabel ? `<button type="button" class="tbtn">${esc(actLabel)}</button>` : '');
  t.hidden = false; requestAnimationFrame(() => t.classList.add('on'));
  if (actLabel) t.querySelector('.tbtn').onclick = () => { hideToast(); act(); };
  clearTimeout(UI.toastT); UI.toastT = setTimeout(hideToast, actLabel ? 6000 : 3200);
}
function hideToast() { const t = $('#toast'); if (!t) return; t.classList.remove('on'); setTimeout(() => { if (!t.classList.contains('on')) t.hidden = true; }, 250); }

function showTab(t) {
  UI.tab = t;
  $$('#sideTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  $$('.tabp').forEach(p => { p.hidden = p.id !== 'tab-' + t; });
}
function setElMode(on) {
  ED.mode = on ? 'elec' : 'furn'; G3.el = on;
  const b = $('#elToggle'); if (b) b.setAttribute('aria-pressed', String(on));
  $$('#planMode button').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.m === 'elec') === on)));
  applyEl(); renderPlan();
}
function setLayout(l) {
  if (l === 'split' && window.innerWidth < 1000) l = '3d';
  if (!G3.ok && l !== 'plan') l = 'plan';
  UI.layout = l; $('#stage').dataset.layout = l;
  $('#pane3d').hidden = l === 'plan'; $('#panePlan').hidden = l === '3d';
  G3.visible = l !== 'plan';
  $$('#paneTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === l)));
  $('#views').hidden = l === 'plan';
  if (l !== '3d') renderPlan();
  if (G3.ok) { G3.resize && G3.resize(); G3.needs = true; }
}
function select(kind, id, silent) {
  SEL = kind ? { kind, id } : null; fixSel();
  if (SEL && SEL.kind === 'elec' && ED.mode !== 'elec') setElMode(true);
  else if (SEL && SEL.kind === 'item' && ED.mode === 'elec') setElMode(false);
  updateSelBox(); markPlanSel(); renderProps(); renderSelBar(); markTableRow();
  if (!silent && SEL && UI.tab !== 'obj') showTab('obj');
}

/* ---------- placing new things ---------- */
function bbox(it) { const cs = corners(it), xs = cs.map(c => c[0]), zs = cs.map(c => c[1]); return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]; }
function overlapA(a, b) { const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); return w > 0 && h > 0 ? w * h : 0; }
function keepOut() { const R = S.room, d = doorGeom(R), B = winGeom(R); return [[R.W - 0.95, d.z0, R.W, d.z1], [B.w0, 0, B.w1, 0.2]]; }
function byCentre(lo, hi, mid, step) { const out = []; for (let v = lo; v <= hi + 1e-6; v += step) out.push(r3(v)); return out.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid)); }
function freeSpot(it) {
  const R = S.room; if (it.type === 'rug') { it.x = R.W / 2; it.z = R.L / 2; return; }
  const others = S.items.filter(o => o !== it && !CAT[o.type].wall && o.type !== 'rug').map(bbox).concat(keepOut());
  const { ex, ez } = extents(it); let best = null;
  for (let x = ex; x <= R.W - ex + 1e-6; x += 0.05) for (let z = ez; z <= R.L - ez + 1e-6; z += 0.05) {
    const b = [x - ex - 0.05, z - ez - 0.05, x + ex + 0.05, z + ez + 0.05]; let ov = 0; for (const o of others) ov += overlapA(b, o);
    const sc = ov * 100 + Math.hypot(x - R.W / 2, z - R.L / 2) * 0.05; if (!best || sc < best.sc) best = { x, z, sc };
  }
  if (best) { it.x = r3(best.x); it.z = r3(best.z); }
}
function wallBlocks(wl, skip) {
  const R = S.room, B = winGeom(R), d = doorGeom(R), bl = [];
  if (wl === 'N') bl.push([B.l - 0.08, B.r + 0.08, 0, B.top + 0.1]);
  if (wl === 'E') bl.push([d.z0 - d.cas - 0.05, d.z1 + d.cas + 0.05, 0, d.h + d.cas + 0.05]);
  for (const o of S.items) {
    if (o === skip) continue;
    if (CAT[o.type].wall) { if (o.wall === wl) { const y0 = o.type === 'tv' && o.opts.shelf ? o.y - o.h / 2 - 0.2 : o.y - o.h / 2; bl.push([o.s - Math.max(o.w, o.type === 'tv' && o.opts.shelf ? o.opts.shelfW : 0) / 2, o.s + Math.max(o.w, o.type === 'tv' && o.opts.shelf ? o.opts.shelfW : 0) / 2, y0, o.y + o.h / 2]); } continue; }
    if (o.type === 'rug') continue;
    const b = bbox(o), dist = { N: b[1], S: R.L - b[3], W: b[0], E: R.W - b[2] }[wl];
    if (dist < 0.3) { const [a0, a1] = (wl === 'N' || wl === 'S') ? [b[0], b[2]] : [b[1], b[3]]; bl.push([a0, a1, 0, o.h + 0.05]); }
  }
  for (const e of S.elec) if (e !== skip && e.wall === wl && !(e.kind === 'light' && e.mount === 'ceil')) bl.push([e.s - 0.16, e.s + 0.16, e.h - 0.14, e.h + 0.14]);
  return bl;
}
function freeWallSpot(obj, w, y, hh, order = ['W', 'S', 'E', 'N']) {
  const R = S.room;
  for (const wl of order) {
    const len = wallLen(wl, R), bl = wallBlocks(wl, obj);
    for (const s of byCentre(w / 2 + 0.12, len - w / 2 - 0.12, len / 2, 0.05)) if (bl.every(([a, b, y0, y1]) => s + w / 2 <= a || s - w / 2 >= b || y + hh / 2 <= y0 || y - hh / 2 >= y1)) return { wall: wl, s };
  }
  return { wall: order[0], s: wallLen(order[0], R) / 2 };
}
function freeCeil() {
  const R = S.room, L = S.elec.filter(e => e.kind === 'light' && e.mount === 'ceil'); let best = null;
  for (let x = 0.4; x <= R.W - 0.4 + 1e-6; x += 0.1) for (let z = 0.4; z <= R.L - 0.4 + 1e-6; z += 0.1) {
    const md = L.length ? Math.min(...L.map(e => Math.hypot(e.x - x, e.z - z))) : 9, sc = Math.min(md, 1.1) * 10 - Math.hypot(x - R.W / 2, z - R.L / 2);
    if (!best || sc > best.sc) best = { x, z, sc };
  }
  return best || { x: R.W / 2, z: R.L / 2 };
}
function addItem(type) {
  const c = CAT[type], it = newItem(type);
  if (type === 'wardrobe' && it.opts.toCeil) it.h = S.room.H;
  if (c.wall) { const ext = type === 'tv' && it.opts.shelf ? Math.max(it.w, it.opts.shelfW) : it.w; const sp = freeWallSpot(it, ext, it.y, it.h + (type === 'tv' ? 0.25 : 0), type === 'tv' ? ['E', 'W', 'S', 'N'] : ['W', 'S', 'E', 'N']); it.wall = sp.wall; it.s = sp.s; }
  else freeSpot(it);
  normItem(it, S.room); S.items.push(it);
  if (ED.mode === 'elec') setElMode(false);
  commit(); select('item', it.id);
  toast(`Добавлено: ${esc(c.name)}. Тяни его на плане или в 3D.`);
}
function addElec(key) {
  const tpl = ELADD.find(a => a[0] === key); if (!tpl) return;
  const e = Object.assign({ id: uid('e'), note: '' }, tpl[2]());
  if (e.kind === 'light' && e.mount === 'ceil') Object.assign(e, freeCeil());
  else { const w = e.kind === 'ac' ? 1.0 : 0.13 * (e.mods ? e.mods.length : 1) + 0.06; const sp = freeWallSpot(e, w, e.h, 0.12, e.kind === 'switch' ? ['E', 'W', 'S', 'N'] : ['W', 'S', 'E', 'N']); e.wall = sp.wall; e.s = sp.s; }
  normElec(e, S.room); S.elec.push(e);
  commit(); setElMode(true); select('elec', e.id);
  toast(`Добавлено: ${esc(elecName(e))} (${elecLabels()[e.id]}). ${e.kind === 'light' && e.mount === 'ceil' ? 'Тяни его по потолку на плане или в 3D.' : 'Тяни точку вдоль стены на плане.'}${e.kind === 'light' ? ' Выключатель выбирается ниже.' : ''}`);
}
function dupSel() {
  const o = getSel(); if (!o) return; const c = JSON.parse(JSON.stringify(o)), R = S.room;
  if (SEL.kind === 'item') {
    c.id = uid('i');
    if (CAT[c.type].wall) { const sp = freeWallSpot(c, c.w, c.y, c.h, [c.wall, 'W', 'S', 'E', 'N']); c.wall = sp.wall; c.s = sp.s; }
    else { c.x += 0.3; c.z += 0.3; clampInRoom(c, R); }
    normItem(c, R); S.items.push(c); commit(); select('item', c.id);
  } else {
    c.id = uid('e');
    if (c.kind === 'light' && c.mount === 'ceil') { c.x += 0.5; c.z += 0.5; }
    else { const len = wallLen(c.wall, R), w = 0.13 * (c.mods ? c.mods.length : 1) + 0.06; c.s = c.s + w + 0.1 <= len - 0.05 ? c.s + w + 0.1 : c.s - w - 0.1; }
    normElec(c, R); S.elec.push(c); commit(); select('elec', c.id);
  }
  toast('Сделал копию — она рядом с оригиналом');
}
function delSel() {
  const o = getSel(); if (!o) return; let name;
  if (SEL.kind === 'item') { name = CAT[o.type].name; S.items = S.items.filter(i => i !== o); const lid = 'led:' + o.id; for (const e of S.elec) if (e.kind === 'switch') e.keys = e.keys.map(k => k.filter(t => t !== lid)); }
  else { name = elecLabels()[o.id] + ' · ' + elecName(o); S.elec = S.elec.filter(e => e !== o); for (const e of S.elec) if (e.kind === 'switch') e.keys = e.keys.map(k => k.filter(t => t !== o.id)); }
  SEL = null; commit(); select(null);
  toast(`Удалено: ${esc(name)}`, 'Вернуть', undo);
}
function rotSel(d) {
  const o = getSel(); if (!o || SEL.kind !== 'item' || CAT[o.type].wall) return;
  o.rot = (((o.rot || 0) + d) % 360 + 360) % 360; clampInRoom(o, S.room); commit();
}
function nudge(dx, dz, dy) {
  const o = getSel(); if (!o) return; const R = S.room;
  if (SEL.kind === 'item') { if (CAT[o.type].wall) { o.s += (o.wall === 'N' || o.wall === 'S' ? dx : dz) || 0; o.y += dy || 0; normItem(o, R); } else { o.x += dx; o.z += dz; clampInRoom(o, R, 0); } }
  else { if (o.kind === 'light' && o.mount === 'ceil') { o.x += dx; o.z += dz; } else { o.s += (o.wall === 'N' || o.wall === 'S' ? dx : dz) || 0; o.h += dy || 0; } normElec(o, R); }
  updatePlanLive(); liveSync(); propsLive();
  clearTimeout(UI.nudgeT); UI.nudgeT = setTimeout(commit, 450);
}

/* ---------- small HTML helpers ---------- */
const chip = (act, v, label, on, extra = '') => `<button type="button" class="ch" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}"${extra}>${label}</button>`;
const swatch = (act, v, col, title, on, extra = '') => `<button type="button" class="swb" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}" title="${esc(title)}" aria-label="${esc(title)}" style="--c:${col}"${extra}></button>`;
const toggle = (act, label, on, extra = '') => `<button type="button" class="tg" data-act="${act}" aria-pressed="${on}"${extra}><span class="knob"></span>${label}</button>`;
function numRow(f, label, val, min, max, step = 1, range = true, unit = 'см', dis = false) {
  return `<div class="nrow"><label><span>${label}</span><span class="nin"><input type="number" data-f="${f}" value="${val}" min="${min}" max="${max}" step="${step}" inputmode="numeric"${dis ? ' disabled' : ''}><i>${unit}</i></span></label>${range ? `<input type="range" data-f="${f}" value="${val}" min="${min}" max="${max}" step="${step}" aria-label="${esc(label)}"${dis ? ' disabled' : ''}>` : ''}</div>`;
}
const wallChips = (act, cur) => `<div class="chips">${WALLS.map(w => chip(act, w, 'Стена ' + WRU[w], cur === w)).join('')}</div>`;
const sref = w => (w === 'N' || w === 'S') ? 'Г' : 'А';

/* ---------- "Добавить" ---------- */
function renderAddPanel() {
  let h = '';
  for (const [g, gname] of GROUPS) { const ts = Object.keys(CAT).filter(t => CAT[t].group === g); h += `<div class="grp"><h4>${gname}</h4><div class="addlist">${ts.map(t => `<button type="button" class="addb" data-act="add-item" data-type="${t}"><b>+</b>${esc(CAT[t].name)}</button>`).join('')}</div></div>`; }
  h += `<div class="grp"><h4>Электрика</h4><div class="addlist">${ELADD.map(([k, l]) => `<button type="button" class="addb el" data-act="add-el" data-k="${k}"><b>+</b>${esc(l)}</button>`).join('')}</div></div>`;
  h += `<p class="muted">Новое встаёт на свободное место. Дальше тяни мышкой или пальцем, размер — за квадратики по краям, поворот — за кружок.</p>`;
  $('#tab-add').innerHTML = h;
}

/* ---------- "Объект" ---------- */
function objList() {
  const lab = elecLabels(); let h = '<p class="muted">Выбери предмет на плане или в 3D — здесь появятся размеры, цвета и настройки.</p>';
  h += `<div class="grp"><h4>Мебель и декор · ${S.items.length}</h4><div class="olist">${S.items.map(it => `<button type="button" data-act="sel" data-kind="item" data-id="${it.id}">${esc(CAT[it.type].name)}${it.type === 'wardrobe' || it.type === 'divider' || it.type === 'sofa' || it.type === 'desk' ? `<i>${cmv(it.w)}×${cmv(it.d)}</i>` : ''}</button>`).join('') || '<span class="muted">Пусто — добавь во вкладке «Добавить».</span>'}</div></div>`;
  const els = [...S.elec].sort((a, b) => lab[a.id].localeCompare(lab[b.id], 'ru', { numeric: true }));
  h += `<div class="grp"><h4>Электрика · ${S.elec.length}</h4><div class="olist">${els.map(e => `<button type="button" data-act="sel" data-kind="elec" data-id="${e.id}"><b class="lb">${lab[e.id]}</b>${esc(elecName(e))}</button>`).join('')}</div></div>`;
  return h;
}
function optsUI(it) {
  let h = '';
  for (const [key, label, kind, options] of CAT[it.type].ui) {
    const cur = it.opts[key];
    if (PAL[kind]) h += `<div class="orow"><span class="ol">${label}: <b>${esc((PAL[kind][cur] || [cur])[0])}</b></span><div class="sws">${Object.entries(PAL[kind]).map(([k, [n, c]]) => swatch('opt', k, hex(c), n, cur === k, ` data-o="${key}"`)).join('')}</div></div>`;
    else if (kind === 'chips') h += `<div class="orow"><span class="ol">${label}</span><div class="chips">${options.map(([v, l]) => chip('opt', v, l, String(cur) === String(v), ` data-o="${key}"${typeof v === 'number' ? ' data-num="1"' : ''}`)).join('')}</div></div>`;
    else if (kind === 'bool') h += `<div class="orow">${toggle('optb', label, !!cur, ` data-o="${key}"`)}</div>`;
  }
  return h;
}
function itemProps(it) {
  const c = CAT[it.type], R = S.room; let h = `<div class="ohead"><h3>${esc(c.name)}</h3><span class="muted">${it.type === 'tv' ? `${it.opts.size}″ · ${mm(it.w)}×${mm(it.h)} мм` : c.wall ? `${mm(it.w)}×${mm(it.h)} мм` : `${mm(it.w)}×${mm(it.d)}×${mm(it.h)} мм`}</span></div>`;
  if (c.dims) {
    h += '<div class="grp"><h4>Размеры</h4>';
    for (const k of ['w', 'd', 'h']) {
      const rg = c.dims[k]; if (!rg) continue; if (k === 'd' && it.type === 'coffee' && it.opts.shape === 'round') continue;
      const lbl = it.type === 'rug' && k === 'd' ? 'Длина' : it.type === 'coffee' && it.opts.shape === 'round' && k === 'w' ? 'Диаметр' : DIML[k];
      const dis = it.type === 'wardrobe' && k === 'h' && it.opts.toCeil;
      h += numRow(k, lbl + (dis ? ' (до потолка)' : ''), cmv(it[k]), Math.round(rg[0] * 100), Math.round(rg[1] * 100), 1, true, 'см', dis);
    }
    h += '</div>';
  }
  h += '<div class="grp"><h4>Где стоит</h4>';
  if (c.wall) {
    h += wallChips('iwall', it.wall);
    const len = wallLen(it.wall, R);
    h += numRow('s', `Центр от стены ${sref(it.wall)}`, cmv(it.s), Math.round(it.w * 50), Math.round((len - it.w / 2) * 100), 1);
    h += numRow('y', 'Высота центра от пола', cmv(it.y), Math.round((0.25 + it.h / 2) * 100), Math.round((R.H - 0.05 - it.h / 2) * 100), 1);
  } else {
    h += numRow('x', 'Центр от стены Г', cmv(it.x), 0, Math.round(R.W * 100), 1, false) + numRow('z', 'Центр от стены А', cmv(it.z), 0, Math.round(R.L * 100), 1, false);
    h += `<div class="nrow"><label><span>Поворот</span><span class="nin"><input type="number" data-f="rot" value="${it.rot}" min="0" max="359" step="1"><i>°</i></span></label><div class="rbtns"><button type="button" class="btn sm" data-act="rot" data-d="-90">↺ 90°</button><button type="button" class="btn sm" data-act="rot" data-d="90">↻ 90°</button></div></div>`;
  }
  h += '</div>';
  if (c.ui.length) h += `<div class="grp"><h4>Вид</h4>${optsUI(it)}</div>`;
  if (it.type === 'tv' && it.opts.shelf) h += `<div class="grp">${numRow('shelfW', 'Ширина полки', cmv(it.opts.shelfW), 60, 240, 1)}</div>`;
  h += `<div class="obtns"><button type="button" class="btn" data-act="dup">Копия</button><button type="button" class="btn danger" data-act="del">Удалить</button></div>`;
  return h;
}
function controlledBy(id) { const lab = elecLabels(), out = []; for (const e of S.elec) if (e.kind === 'switch') e.keys.forEach((k, i) => { if (k.includes(id)) out.push(`${lab[e.id]}·${i + 1}`); }); return out; }
function elecProps(e) {
  const lab = elecLabels(), R = S.room; let h = `<div class="ohead"><h3><b class="lb">${lab[e.id]}</b> ${esc(elecName(e))}</h3></div>`;
  const ceil = e.kind === 'light' && e.mount === 'ceil';
  h += '<div class="grp"><h4>Где</h4>';
  if (ceil) h += numRow('x', 'От стены Г', cmv(e.x), 8, Math.round((R.W - 0.08) * 100), 1) + numRow('z', 'От стены А', cmv(e.z), 8, Math.round((R.L - 0.08) * 100), 1);
  else {
    h += wallChips('ewall', e.wall) + numRow('s', `От стены ${sref(e.wall)} до центра`, cmv(e.s), 5, Math.round((wallLen(e.wall, R) - 0.05) * 100), 1);
    const pre = e.kind === 'light' ? [[1.3, 'бра 1300'], [1.6, '1600'], [2.0, '2000']] : e.kind === 'ac' ? [[2.3, '2300'], [2.0, '2000']] : e.kind === 'switch' ? [[0.9, '900'], [0.75, 'у кровати 750'], [1.0, '1000']] : [[0.3, '300'], [0.75, 'над тумбой 750'], [0.9, 'над столом 900'], [1.1, 'за ТВ 1100'], [2.3, 'под потолком 2300']];
    h += numRow('h', 'Высота от пола', cmv(e.h), 10, Math.round((R.H - 0.08) * 100), 1) + `<div class="chips">${pre.map(([v, l]) => chip('hpre', v, l + (l.length < 5 ? ' мм' : ''), Math.abs(e.h - v) < 0.005)).join('')}</div>`;
  }
  h += '</div>';
  if (e.kind === 'socket') {
    h += `<div class="grp"><h4>Состав блока · ${e.mods.length} из 4</h4>${e.mods.map((m, i) => `<div class="mrow"><span class="mi">${i + 1}</span><select data-mod="${i}" aria-label="Модуль ${i + 1}">${Object.entries(MODS).map(([k, l]) => `<option value="${k}"${k === m ? ' selected' : ''}>${l}</option>`).join('')}</select>${e.mods.length > 1 ? `<button type="button" class="btn sm" data-act="mod-del" data-i="${i}" aria-label="Убрать модуль">×</button>` : ''}</div>`).join('')}${e.mods.length < 4 ? '<button type="button" class="btn sm" data-act="mod-add">+ модуль</button>' : ''}</div>`;
  }
  if (e.kind === 'switch') {
    const tg = lightTargets();
    h += `<div class="grp"><h4>Клавиши · что включают</h4>${e.keys.map((k, i) => `<div class="krow"><div class="kh"><b>Клавиша ${i + 1}</b>${e.keys.length > 1 ? `<button type="button" class="btn sm" data-act="key-del" data-i="${i}">убрать</button>` : ''}</div><div class="kt">${tg.length ? tg.map(t => `<label class="cb"><input type="checkbox" data-key="${i}" data-tgt="${t.id}"${k.includes(t.id) ? ' checked' : ''}><span><b class="lb">${lab[t.id]}</b> ${t.kind === 'led' ? 'LED: ' + esc(CAT[t.item.type].name.toLowerCase()) : esc(elecName(t))}</span></label>`).join('') : '<span class="muted">Нет светильников — добавь люстру или бра.</span>'}</div></div>`).join('')}${e.keys.length < 3 ? '<button type="button" class="btn sm" data-act="key-add">+ клавиша</button>' : ''}<p class="muted">Если одну лампу включают два выключателя — это проходная схема, электрик положит трёхжильный кабель между ними.</p></div>`;
  }
  if (e.kind === 'light') {
    const V = ceil ? CEIL_V : WALL_V;
    h += `<div class="grp"><h4>${ceil ? 'Люстра / светильник' : 'Бра'}</h4><div class="chips">${Object.entries(V).map(([k, l]) => chip('lvar', k, l, e.variant === k)).join('')}</div>`;
    h += `<div class="orow"><span class="ol">Металл: <b>${METAL[e.frame][0]}</b></span><div class="sws">${Object.entries(METAL).map(([k, [n, c]]) => swatch('lframe', k, hex(c), n, e.frame === k)).join('')}</div></div>`;
    if (!NO_SHADE[e.variant]) h += `<div class="orow"><span class="ol">Плафоны</span><div class="chips">${Object.entries(SHADES).map(([k, l]) => chip('lshade', k, l, e.shade === k)).join('')}</div></div>`;
    h += '</div>';
    const sw = S.elec.filter(x => x.kind === 'switch');
    h += `<div class="grp"><h4>Чем включается</h4>${sw.length ? sw.map(s => s.keys.map((k, i) => `<label class="cb"><input type="checkbox" data-sw="${s.id}" data-key="${i}"${k.includes(e.id) ? ' checked' : ''}><span><b class="lb">${lab[s.id]}</b> клавиша ${i + 1}</span></label>`).join('')).join('') : '<span class="muted">Нет выключателей.</span>'}${controlledBy(e.id).length ? '' : '<p class="warn">Не подключён ни к одному выключателю.</p>'}</div>`;
  }
  h += `<div class="grp"><h4>Примечание для электрика</h4><textarea data-note rows="2" maxlength="200" placeholder="Например: ПК, монитор, мотор стола">${esc(e.note || '')}</textarea></div>`;
  h += `<div class="obtns"><button type="button" class="btn" data-act="dup">Копия</button><button type="button" class="btn danger" data-act="del">Удалить</button></div>`;
  return h;
}
function renderProps() {
  const host = $('#tab-obj'); if (!host) return; const o = getSel();
  host.innerHTML = !o ? objList() : SEL.kind === 'item' ? itemProps(o) : elecProps(o);
  const tb = $('#sideTabs [data-t="obj"]'); if (tb) tb.classList.toggle('dot', !!o);
}
function propsLive() {
  const o = getSel(); if (!o) return; const host = $('#tab-obj');
  const val = { w: o.w, d: o.d, h: SEL.kind === 'item' ? o.h : o.h, x: o.x, z: o.z, s: o.s, y: o.y };
  $$('[data-f]', host).forEach(inp => { if (inp === document.activeElement) return; const f = inp.dataset.f; if (f === 'rot') inp.value = o.rot; else if (f === 'shelfW') inp.value = cmv(o.opts.shelfW); else if (val[f] != null) inp.value = cmv(val[f]); });
  renderSelBar(true);
}
function renderSelBar(light) {
  const bar = $('#selbar'); if (!bar) return; const o = getSel();
  if (!o) { bar.hidden = true; $('#hint') && $('#hint').classList.remove('away'); return; }
  const lab = elecLabels(), name = SEL.kind === 'item' ? CAT[o.type].name : lab[o.id] + ' · ' + elecName(o);
  const info = SEL.kind === 'item' ? (CAT[o.type].wall ? `стена ${WRU[o.wall]} · ${mm(o.s)}` : `${cmv(o.w)}×${cmv(o.d)} см`) : (o.kind === 'light' && o.mount === 'ceil' ? 'потолок' : `стена ${WRU[o.wall]} · h${mm(o.h)}`);
  if (light && !bar.hidden) { const i = $('.sb-info', bar); if (i) i.textContent = info; return; }
  const canRot = SEL.kind === 'item' && !CAT[o.type].wall;
  bar.innerHTML = `<span class="sb-name">${esc(name)}<i class="sb-info">${info}</i></span>${canRot ? '<button type="button" data-act="rot" data-d="-90" title="Повернуть влево (Shift+R)" aria-label="Повернуть влево">↺</button><button type="button" data-act="rot" data-d="90" title="Повернуть вправо (R)" aria-label="Повернуть вправо">↻</button>' : ''}<button type="button" data-act="dup" title="Копия (Ctrl+D)">Копия</button><button type="button" data-act="del" class="danger" title="Удалить (Delete)">Удалить</button><button type="button" data-act="props" class="only-narrow">Свойства</button><button type="button" data-act="desel" aria-label="Снять выделение" title="Снять выделение (Esc)">×</button>`;
  bar.hidden = false; $('#hint') && $('#hint').classList.add('away');
}

/* ---------- "Отделка" ---------- */
function patBg(kind, base, ink) {
  return ({
    damask: `radial-gradient(ellipse 28% 38% at 50% 50%, ${ink} 60%, transparent 64%) 0 0/12px 14px, ${base}`,
    stripes: `repeating-linear-gradient(90deg, ${ink} 0 3px, ${base} 3px 10px)`,
    geometric: `repeating-linear-gradient(45deg, ${ink} 0 1.2px, transparent 1.2px 7px), repeating-linear-gradient(-45deg, ${ink} 0 1.2px, ${base} 1.2px 7px)`,
    botanic: `radial-gradient(ellipse 34% 14% at 35% 40%, ${ink} 95%, transparent) 0 0/14px 14px, radial-gradient(ellipse 14% 34% at 70% 70%, ${ink} 95%, transparent) 0 0/14px 14px, ${base}`,
    dots: `radial-gradient(circle, ${ink} 0 22%, transparent 25%) 0 0/9px 9px, ${base}`,
  })[kind] || base;
}
function floorBg(t) {
  const F = FLOOR_DEF[t], c = i => `rgb(${(F.pal || [F.base])[i % (F.pal || [F.base]).length].join(',')})`;
  if (F.kind === 'tile') return `linear-gradient(rgba(0,0,0,.25) 1px, transparent 1px) 0 0/13px 13px, linear-gradient(90deg, rgba(0,0,0,.25) 1px, transparent 1px) 0 0/13px 13px, rgb(${F.base.join(',')})`;
  if (F.kind === 'herring') return `repeating-linear-gradient(45deg, ${c(0)} 0 5px, ${c(1)} 5px 6px, ${c(3)} 6px 11px, rgba(60,40,25,.6) 11px 12px)`;
  return `repeating-linear-gradient(90deg, ${c(0)} 0 8px, rgba(40,25,15,.45) 8px 9px, ${c(1)} 9px 17px, rgba(40,25,15,.45) 17px 18px, ${c(2)} 18px 26px, rgba(40,25,15,.45) 26px 27px)`;
}
function wallBlock(f, pre) {
  const ink = f.color2 || shade(f.color, -0.16);
  let h = `<div class="chips">${Object.entries(WALLT).map(([k, l]) => chip(pre + 't', k, l, f.type === k)).join('')}</div>`;
  if (f.type === 'pattern') h += `<div class="orow"><span class="ol">Узор</span><div class="pats">${Object.entries(PATTERNS).map(([k, l]) => `<button type="button" class="pat" data-act="${pre}p" data-v="${k}" aria-pressed="${f.pattern === k}"><span style="background:${patBg(k, f.color, ink)}"></span>${l}</button>`).join('')}</div></div>`;
  h += `<div class="orow"><span class="ol">Цвет: <b>${esc(colorName(f.color))}</b></span><div class="sws">${WALLC.map(c => swatch(pre + 'c', c, c, colorName(c), f.color.toUpperCase() === c.toUpperCase())).join('')}<label class="swc" title="Свой цвет"><input type="color" data-fin="${pre}c" value="${f.color}" aria-label="Свой цвет"></label></div></div>`;
  if (f.type === 'pattern') h += `<div class="orow"><span class="ol">Цвет рисунка: <b>${f.color2 ? esc(colorName(f.color2)) : 'авто'}</b></span><div class="sws">${chip(pre + 'i', '', 'авто', !f.color2)}<label class="swc" title="Свой цвет рисунка" style="--c:${ink}"><input type="color" data-fin="${pre}i" value="${ink}" aria-label="Цвет рисунка"></label></div></div>`;
  return h;
}
function renderFinish() {
  const f = S.fin, host = $('#tab-fin'); if (!host) return;
  let h = `<div class="grp"><h4>Стены</h4>${wallBlock(f.wall, 'w')}</div>`;
  h += `<div class="grp"><h4>Акцентная стена</h4><div class="chips">${chip('aw', '', 'нет', !f.accent.wall)}${WALLS.map(w => chip('aw', w, 'Стена ' + WRU[w], f.accent.wall === w)).join('')}</div>${f.accent.wall ? wallBlock(f.accent, 'a') : '<p class="muted">Одну стену можно сделать другой: обои с узором за кроватью или за диваном.</p>'}</div>`;
  h += `<div class="grp"><h4>Пол</h4><div class="pats">${Object.entries(FLOORS).map(([k, l]) => `<button type="button" class="pat" data-act="fl" data-v="${k}" aria-pressed="${f.floor === k}"><span style="background:${floorBg(k)}"></span>${l}</button>`).join('')}</div></div>`;
  h += `<div class="grp"><h4>Плинтус</h4><div class="chips">${Object.entries(PLINTH).map(([k, [l]]) => chip('pl', k, l, f.plinth === k)).join('')}</div></div>`;
  const ct = f.curt, cc = CURTC[ct.type] || [];
  h += `<div class="grp"><h4>Шторы</h4><div class="chips">${Object.entries(CURT).map(([k, l]) => chip('ct', k, l, ct.type === k)).join('')}</div>`;
  if (ct.type !== 'none') h += `<div class="orow"><span class="ol">Цвет: <b>${esc(colorName(ct.color))}</b></span><div class="sws">${cc.map(c => swatch('cc', c, c, colorName(c), ct.color.toUpperCase() === c.toUpperCase())).join('')}<label class="swc" title="Свой цвет"><input type="color" data-fin="cc" value="${ct.color}" aria-label="Свой цвет штор"></label></div></div>`;
  h += `<div class="orow">${toggle('tl', 'Тюль', !!ct.tulle)}</div></div>`;
  host.innerHTML = h;
}
function finAct(act, v) {
  const f = S.fin, W = { w: f.wall, a: f.accent };
  const p = act[0], q = act.slice(1);
  if ((p === 'w' || p === 'a') && ['t', 'p', 'c', 'i'].includes(q)) { const t = W[p]; if (q === 't') t.type = v; if (q === 'p') t.pattern = v; if (q === 'c') t.color = v.toUpperCase(); if (q === 'i') t.color2 = v ? v.toUpperCase() : ''; return true; }
  if (act === 'aw') { f.accent.wall = v; return true; }
  if (act === 'fl') { f.floor = v; return true; }
  if (act === 'pl') { f.plinth = v; return true; }
  if (act === 'ct') { f.curt.type = v; const cc = CURTC[v]; if (cc && !cc.map(x => x.toUpperCase()).includes(f.curt.color.toUpperCase())) f.curt.color = cc[0]; return true; }
  if (act === 'cc') { f.curt.color = v.toUpperCase(); return true; }
  if (act === 'tl') { f.curt.tulle = !f.curt.tulle; return true; }
  return false;
}

/* ---------- "Комната" ---------- */
function renderRoomPanel() {
  const R = S.room, host = $('#tab-room'); if (!host) return;
  const f = (path, label, v, min, max) => `<label class="rf"><span>${label}</span><span class="nin"><input type="number" data-room="${path}" value="${cmv(v)}" min="${min}" max="${max}" step="1" inputmode="numeric"><i>см</i></span></label>`;
  host.innerHTML = `<div class="grp"><h4>Комната</h4><div class="rgrid">${f('W', 'Ширина (стены А и В)', R.W, 260, 500)}${f('L', 'Длина (стены Б и Г)', R.L, 300, 800)}${f('H', 'Высота потолка', R.H, 240, 320)}</div></div>
<div class="grp"><h4>Проём в коридор · стена Б</h4><div class="rgrid">${f('door.off', 'От стены В', R.door.off, 10, Math.round((R.L - 1) * 100))}${f('door.w', 'Ширина проёма', R.door.w, 60, 180)}</div></div>
<div class="grp"><h4>Окно · стена А</h4><div class="rgrid">${f('win.w', 'Ширина окна', R.win.w, 50, Math.round(Math.min(3, R.W - 0.3) * 100))}${f('win.x0', 'От стены Г до окна', R.win.x0, 15, Math.round((R.W - 0.15 - R.win.w) * 100))}${f('win.sill', 'Подоконник от пола', R.win.sill, 30, 120)}${f('win.top', 'Верх окна от пола', R.win.top, Math.round((R.win.sill + 0.6) * 100), Math.round((R.H - 0.1) * 100))}</div><div class="chips">${chip('rwin-center', '', 'Окно по центру стены', Math.abs(R.win.x0 - (R.W - R.win.w) / 2) < 0.006)}</div></div>
<div class="grp"><h4>Площадь</h4><p class="area"><b>${fm(R.W * R.L, 1)} м²</b> пола · стены ≈ ${fm(wallArea(), 1)} м² · периметр ${fm(2 * (R.W + R.L), 2)} м</p><p class="muted">Размеры я снял с фото на глаз. Перемерь рулеткой и впиши сюда — мебель у дальних стен поедет вместе со стенами.</p></div>
<div class="grp"><h4>Эталон и сброс</h4><div class="obtns col"><button type="button" class="btn primary" data-act="r-etalon">Вернуть эталон целиком</button>${UI.onEtalon && UI.mine ? '<button type="button" class="btn" data-act="r-mine">Вернуть мой вариант</button>' : ''}<button type="button" class="btn" data-act="r-default">Расстановка как в эталоне, размеры мои</button><button type="button" class="btn" data-act="r-clear">Убрать всю мебель</button><button type="button" class="btn" data-act="r-clear-el">Убрать всю электрику</button></div><p class="muted">Эталон — исходный проект: размеры с фото, жидкие обои, линолеум, вся мебель и электрика. Твой текущий вариант при этом откладывается, его можно вернуть. Второй вариант ставит мебель и розетки по эталону, но оставляет твои замеры и отделку.</p></div>`;
}
function wallArea() { const R = S.room, B = winGeom(R), d = doorGeom(R); return 2 * (R.W + R.L) * R.H - (B.w1 - B.w0) * (B.top - B.sill) - (d.z1 - d.z0) * d.h; }
function applyRoom(path, cm) {
  const v = cm / 100; if (!isFinite(v)) return;
  const old = { W: S.room.W, L: S.room.L }, st = JSON.parse(JSON.stringify(S)), R = st.room;
  const [a, b] = path.split('.'); if (b) R[a][b] = v; else R[a] = v;
  const wasCentred = Math.abs(S.room.win.x0 - (S.room.W - S.room.win.w) / 2) < 0.006;
  if (wasCentred && path !== 'win.x0') R.win.x0 = (R.W - R.win.w) / 2;
  const NR = sanitizeState({ v: 2, room: JSON.parse(JSON.stringify(R)), items: [], elec: [], fin: st.fin, meta: st.meta }).room;
  if (wasCentred && path !== 'win.x0') NR.win.x0 = r3((NR.W - NR.win.w) / 2);
  const dW = NR.W - old.W, dL = NR.L - old.L, n = st; // shift in old coordinates, normalise after
  if (Math.abs(dW) > 1e-6 || Math.abs(dL) > 1e-6) {
    for (const it of n.items) {
      if (CAT[it.type].wall) { const len = it.wall === 'N' || it.wall === 'S' ? old.W : old.L, dd = it.wall === 'N' || it.wall === 'S' ? dW : dL; if (it.s > len * 0.62) it.s += dd; continue; }
      const { ex, ez } = extents(it);
      if (it.x + ex >= old.W - 0.03 || it.x > old.W * 0.62) it.x += dW;
      if (it.z + ez >= old.L - 0.03 || it.z > old.L * 0.62) it.z += dL;
    }
    for (const e of n.elec) {
      if (e.kind === 'light' && e.mount === 'ceil') { if (Math.abs(e.x - old.W / 2) < 0.05) e.x = NR.W / 2; else if (e.x > old.W * 0.62) e.x += dW; if (Math.abs(e.z - old.L / 2) < 0.05) e.z = NR.L / 2; else if (e.z > old.L * 0.62) e.z += dL; continue; }
      const len = e.wall === 'N' || e.wall === 'S' ? old.W : old.L, dd = e.wall === 'N' || e.wall === 'S' ? dW : dL; if (e.s > len * 0.62) e.s += dd;
    }
  }
  n.room = NR; S = sanitizeState(n); reclampAll(); commit();
}

/* ---------- etalon: the original project, always restorable ---------- */
const MINE_KEY = 'proekt-zala-mine';
function designKey(st) { // ids are random, so compare by position: same room, finishes, things and wiring
  const map = {}; st.items.forEach((it, i) => { map[it.id] = 'i' + i; }); st.elec.forEach((e, i) => { map[e.id] = 'e' + i; });
  const items = st.items.map(it => Object.assign({}, it, { id: map[it.id] }));
  const elec = st.elec.map(e => Object.assign({}, e, { id: map[e.id] }, e.kind === 'switch' ? { keys: e.keys.map(k => k.map(t => t.startsWith('led:') ? 'led:' + (map[t.slice(4)] || '?') : (map[t] || '?'))) } : {}));
  return JSON.stringify([st.room, st.fin, items, elec]);
}
function etalonState() { // makeDefault with stable ids, so "is this the etalon?" can be answered
  const d = makeDefault(DEF_ROOM), map = {};
  d.items.forEach((it, i) => { map[it.id] = it.id = 'et-i' + (i + 1); });
  d.elec.forEach((e, i) => { map[e.id] = e.id = 'et-e' + (i + 1); });
  for (const e of d.elec) if (e.kind === 'switch') e.keys = e.keys.map(k => k.map(t => t.startsWith('led:') ? 'led:' + (map[t.slice(4)] || t.slice(4)) : (map[t] || t)));
  return sanitizeState(d);
}
let ETALON_KEY = '';
function isEtalon() { if (!ETALON_KEY) ETALON_KEY = designKey(etalonState()); return designKey(S) === ETALON_KEY; }
function saveMine() { try { localStorage.setItem(MINE_KEY, JSON.stringify({ on: UI.onEtalon, st: UI.mine })); } catch (e) { } }
function loadMine() { try { const t = JSON.parse(localStorage.getItem(MINE_KEY) || 'null'); if (t && t.st) { UI.mine = sanitizeState(t.st); UI.mineKey = designKey(UI.mine); UI.onEtalon = !!t.on; } } catch (e) { } }
function toEtalon(quiet) {
  const et = etalonState();
  if (designKey(S) === designKey(et)) { if (!quiet) toast('Сейчас и так открыт эталон — исходный проект'); return; }
  if (!UI.onEtalon) { UI.mine = JSON.parse(JSON.stringify(S)); UI.mineKey = designKey(UI.mine); UI.onEtalon = true; saveMine(); } // keep the first pocketed variant while working from the etalon
  et.meta = Object.assign({}, S.meta); S = et; SEL = null; ED.view = null;
  commit(); select(null); if (G3.ok) goTo('entry');
  toast('Открыт эталон — исходный проект. Твой вариант отложен.', 'Вернуть мой', toMine);
}
function toMine() {
  if (!UI.mine) return; const st = sanitizeState(JSON.parse(JSON.stringify(UI.mine)));
  st.meta = Object.assign({}, S.meta); S = st; SEL = null; UI.onEtalon = false; saveMine();
  commit(); select(null); toast('Вернул твой вариант', 'Снова эталон', toEtalon);
}
function updateEtalonUI() {
  if (UI.onEtalon && UI.mineKey && designKey(S) === UI.mineKey) { UI.onEtalon = false; saveMine(); } // back in own variant (e.g. by undo)
  const et = isEtalon(), b = $('#etalonBtn'), m = $('#mineBtn');
  if (b) { b.setAttribute('aria-pressed', String(et)); b.title = et ? 'Сейчас открыт эталон — исходный проект' : 'Вернуть исходный проект целиком (твой вариант отложится)'; }
  if (m) m.hidden = !(UI.onEtalon && UI.mine);
}

/* ---------- events ---------- */
function applyField(f, raw) {
  const o = getSel(); if (!o) return false; const R = S.room; let v = +raw; if (!isFinite(v)) return false;
  if (SEL.kind === 'item') {
    if (f === 'rot') { o.rot = ((Math.round(v) % 360) + 360) % 360; clampInRoom(o, R, 0); return true; }
    if (f === 'shelfW') { o.opts.shelfW = v / 100; normItem(o, R); return true; }
    v /= 100;
    if (f === 'w' || f === 'd' || f === 'h') { o[f] = v; if (o.type === 'coffee' && o.opts.shape === 'round' && f === 'w') o.d = v; }
    else o[f] = v;
    normItem(o, R); return true;
  }
  v /= 100; o[f] = v; normElec(o, R); return true;
}
function bindPanels() {
  const side = $('#side'), bar = $('#selbar');
  const onClick = ev => {
    const b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, v = b.dataset.v, o = getSel();
    switch (act) {
      case 'add-item': return addItem(b.dataset.type);
      case 'add-el': return addElec(b.dataset.k);
      case 'sel': return select(b.dataset.kind, b.dataset.id);
      case 'dup': return dupSel();
      case 'del': return delSel();
      case 'rot': return rotSel(+b.dataset.d);
      case 'desel': return select(null);
      case 'props': showTab('obj'); $('#side').scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
      case 'opt': if (o) { o.opts[b.dataset.o] = b.dataset.num ? +v : v; normItem(o, S.room); commit(); } return;
      case 'optb': if (o) { o.opts[b.dataset.o] = !o.opts[b.dataset.o]; normItem(o, S.room); commit(); } return;
      case 'iwall': if (o) { o.wall = v; normItem(o, S.room); commit(); } return;
      case 'ewall': if (o) { o.wall = v; normElec(o, S.room); commit(); } return;
      case 'hpre': if (o) { o.h = +v; normElec(o, S.room); commit(); } return;
      case 'mod-add': if (o && o.mods.length < 4) { o.mods.push('s'); commit(); } return;
      case 'mod-del': if (o && o.mods.length > 1) { o.mods.splice(+b.dataset.i, 1); commit(); } return;
      case 'key-add': if (o && o.keys.length < 3) { o.keys.push([]); commit(); } return;
      case 'key-del': if (o && o.keys.length > 1) { o.keys.splice(+b.dataset.i, 1); commit(); } return;
      case 'lvar': if (o) { o.variant = v; commit(); } return;
      case 'lframe': if (o) { o.frame = v; commit(); } return;
      case 'lshade': if (o) { o.shade = v; commit(); } return;
      case 'rwin-center': S.room.win.x0 = r3((S.room.W - S.room.win.w) / 2); S = sanitizeState(JSON.parse(JSON.stringify(S))); reclampAll(); commit(); return;
      case 'r-etalon': return toEtalon();
      case 'r-mine': return toMine();
      case 'r-default': { const R = JSON.parse(JSON.stringify(S.room)), d = makeDefault(R); S.items = d.items; S.elec = d.elec; SEL = null; commit(); select(null); toast('Вернул исходную расстановку', 'Отменить', undo); return; }
      case 'r-clear': S.items = []; for (const e of S.elec) if (e.kind === 'switch') e.keys = e.keys.map(k => k.filter(t => !t.startsWith('led:'))); SEL = null; commit(); select(null); toast('Мебель убрана', 'Отменить', undo); return;
      case 'r-clear-el': S.elec = []; SEL = null; commit(); select(null); toast('Электрика убрана', 'Отменить', undo); return;
    }
    if (finAct(act, v ?? '')) commit();
  };
  side.addEventListener('click', onClick); bar.addEventListener('click', onClick);
  side.addEventListener('input', ev => {
    const t = ev.target;
    if (t.matches('input[type=range][data-f]')) { if (applyField(t.dataset.f, t.value)) { const n = t.closest('.nrow').querySelector('input[type=number]'); if (n) n.value = t.value; updatePlanLive(); liveSync(); renderSelBar(true); } }
  });
  side.addEventListener('change', ev => {
    const t = ev.target, o = getSel();
    if (t.matches('[data-f]')) { if (applyField(t.dataset.f, t.value)) commit(); else renderProps(); return; }
    if (t.matches('[data-room]')) return applyRoom(t.dataset.room, +t.value);
    if (t.matches('[data-mod]') && o) { o.mods[+t.dataset.mod] = t.value; commit(); return; }
    if (t.matches('[data-tgt]') && o) { const k = o.keys[+t.dataset.key], id = t.dataset.tgt; if (t.checked) { if (!k.includes(id)) k.push(id); } else o.keys[+t.dataset.key] = k.filter(x => x !== id); commit(); return; }
    if (t.matches('[data-sw]') && o) { const sw = S.elec.find(x => x.id === t.dataset.sw); if (!sw) return; const i = +t.dataset.key; if (t.checked) { if (!sw.keys[i].includes(o.id)) sw.keys[i].push(o.id); } else sw.keys[i] = sw.keys[i].filter(x => x !== o.id); commit(); return; }
    if (t.matches('[data-note]') && o) { o.note = t.value.slice(0, 200); commit(); return; }
    if (t.matches('[data-fin]')) { if (finAct(t.dataset.fin, t.value)) commit(); return; }
  });
  side.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches('input[type=number]')) ev.target.blur(); });
}
