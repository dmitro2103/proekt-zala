/* ============ 8. main: boot, change pipeline, table, toolbar, keyboard, share ============ */
function renderFacts() {
  const R = S.room, T = elecTotals();
  $('#facts').innerHTML = `<span><b>${fm(R.W)} × ${fm(R.L)}</b> м</span><span>потолок <b>${fm(R.H)}</b></span><span><b>${fm(R.W * R.L, 1)}</b> м²</span><span>предметов <b>${S.items.length}</b></span><span>розеток <b>${T.p}</b></span>`;
}
function renderTable() {
  const lab = elecLabels(), rowsById = Object.fromEntries(elecRows().map(r => [r.id, r]));
  const groups = [['N', 'Стена А — оконная'], ['E', 'Стена Б — с проёмом'], ['S', 'Стена В — напротив окна'], ['W', 'Стена Г — напротив проёма'], ['ceil', 'Потолок'], ['led', 'Подсветка в мебели']];
  let h = '<thead><tr><th>Точка</th><th>Что</th><th>Привязка, мм</th><th>Высота, мм</th><th>Управление и примечание</th></tr></thead><tbody>';
  for (const [g, name] of groups) {
    const pts = g === 'ceil' ? S.elec.filter(e => e.kind === 'light' && e.mount === 'ceil') : g === 'led' ? ledList() : S.elec.filter(e => e.wall === g && !(e.kind === 'light' && e.mount === 'ceil')).sort((a, b) => a.s - b.s || a.h - b.h);
    if (!pts.length) continue;
    h += `<tr class="zone"><td colspan="5">${name}</td></tr>`;
    for (const p of pts) {
      const r = rowsById[p.id]; if (!r) continue;
      const opt = p.kind === 'ac' ? ' <span class="opt-note">(резерв)</span>' : '', warn = /не подключён/.test(r.note) ? ' class="warnc"' : '';
      h += `<tr data-${g === 'led' ? 'iid' : 'eid'}="${g === 'led' ? p.item.id : p.id}" tabindex="0"><td class="id">${esc(lab[p.id])}</td><td>${esc(r.name)}${opt}</td><td class="n">${esc(r.bind)}</td><td class="n">${esc(r.h)}</td><td${warn}>${esc(r.note || '—')}</td></tr>`;
    }
  }
  if (!S.elec.length && !ledList().length) h += '<tr><td colspan="5" class="muted">Точек нет — добавь розетки и свет во вкладке «Добавить».</td></tr>';
  $('#elTable').innerHTML = h + '</tbody>';
  const T = elecTotals();
  $('#totals').innerHTML = `<span>Розеток 220 В: ${T.p} (с USB: ${T.usb})</span><span>LAN: ${T.lan}</span><span>ТВ: ${T.tv}</span><span>Выключателей: ${T.sw} · клавиш ${T.keys}</span><span>Свет: потолок ${T.ceil}, бра ${T.wall}, LED ${T.led}</span><span>Коробок под розетки/выкл.: ${T.boxes}</span>`;
  markTableRow();
}
function markTableRow() { $$('#elTable tr[data-eid], #elTable tr[data-iid]').forEach(tr => tr.classList.toggle('sel', !!SEL && ((SEL.kind === 'elec' && tr.dataset.eid === SEL.id) || (SEL.kind === 'item' && tr.dataset.iid === SEL.id)))); }
function renderNotes() {
  const R = S.room, d = doorGeom(R), bed = S.items.find(i => i.type === 'bed'), dv = S.items.find(i => i.type === 'divider'), wd = S.items.find(i => i.type === 'wardrobe');
  const li = [
    `Комната <b>${fm(R.W)} × ${fm(R.L)} м</b>, потолок ${fm(R.H)} — оценка по фото, погрешность ±10–15 см. Замеры вписываются во вкладке «Комната».`,
    `Проём в коридор ${mm(R.door.w)} мм, в ${mm(R.door.off)} мм от стены В.`,
    `Окно ${mm(R.win.w)} мм ${Math.abs(R.win.x0 - (R.W - R.win.w) / 2) < 0.006 ? 'по центру стены А' : `в ${mm(R.win.x0)} мм от стены Г`}, подоконник ${mm(R.win.sill)}, верх ${mm(R.win.top)} от пола — за шторами не видно, перемерь.`,
    'Люстра — на старом месте в центре: натяжной потолок не трогаем.',
  ];
  if (bed && dv) { const bb = bbox(bed), db = bbox(dv), gap = Math.max(0, Math.max(bb[1] - db[3], db[1] - bb[3])); li.push(`Кровать ${bed.opts.size}×200: проход до стеллажа ${mm(gap)} мм${wd ? `, шкаф ${mm(wd.w)} мм` : ''}.`); }
  $('#assume').innerHTML = li.map(x => `<li>${x}</li>`).join('');
  $('#cableNotes').innerHTML = cableNotes().map(x => `<li>${esc(x)}</li>`).join('');
}
let sheetT = 0;
function scheduleSheets(now) { clearTimeout(sheetT); if (now) renderSheets(); else sheetT = setTimeout(renderSheets, 400); }
function updateUndo() { $('#undoBtn').disabled = !HIST.past.length; $('#redoBtn').disabled = !HIST.future.length; }
function fillMeta() { for (const k of ['object', 'author', 'code', 'org']) { const i = $(`#metaForm [name="${k}"]`); if (i && i !== document.activeElement) i.value = S.meta[k] || ''; } }
function renderAll() {
  fixSel(); updateEtalonUI(); sync3D(); renderPlan(); renderProps(); renderSelBar(); renderFinish(); renderRoomPanel();
  renderTable(); renderNotes(); renderFacts(); fillMeta(); updateUndo(); scheduleSheets();
}

/* share / save / load */
async function share() {
  const code = await encodeState(S), url = location.origin + location.pathname + '#v=' + code, dlg = $('#shareDlg'), inp = $('#shareUrl');
  inp.value = url; $('#shareMsg').textContent = url.length > 8000 ? 'Ссылка длинная — если мессенджер её обрежет, отправь файл проекта.' : 'В ссылке весь проект — открывший увидит его у себя и сможет менять копию.';
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  inp.focus(); inp.select();
}
async function copyShare() {
  const inp = $('#shareUrl');
  try { await navigator.clipboard.writeText(inp.value); $('#copyBtn').textContent = 'Скопировано'; }
  catch (e) { inp.focus(); inp.select(); try { document.execCommand('copy'); $('#copyBtn').textContent = 'Скопировано'; } catch (er) { $('#copyBtn').textContent = 'Выдели и скопируй'; } }
  setTimeout(() => { $('#copyBtn').textContent = 'Копировать'; }, 1800);
}
function saveFile() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'proekt-zala.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('Файл проекта сохранён — его можно открыть кнопкой «Открыть файл»');
}
function loadFile(file) {
  if (!file) return; const r = new FileReader();
  r.onload = () => { try { const st = JSON.parse(String(r.result)); if (!st || st.v !== 2) throw new Error('не тот формат'); S = sanitizeState(st); SEL = null; commit(); select(null); toast('Проект открыт', 'Отменить', undo); } catch (e) { toast('Не получилось открыть файл: ' + esc(e.message)); } };
  r.readAsText(file);
}
function doPrint() { clearTimeout(sheetT); renderSheets(); setTimeout(() => window.print(), 60); }

function bindGlobal() {
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#etalonBtn').onclick = () => toEtalon(); $('#mineBtn').onclick = toMine;
  $('#shareBtn').onclick = () => share().catch(e => toast('Не вышло собрать ссылку: ' + esc(e.message)));
  $('#copyBtn').onclick = copyShare; $('#shareClose').onclick = () => { const d = $('#shareDlg'); d.close ? d.close() : d.removeAttribute('open'); };
  $('#saveBtn').onclick = saveFile; $('#loadFile').onchange = ev => { loadFile(ev.target.files[0]); ev.target.value = ''; };
  $('#printBtn').onclick = doPrint;
  $$('[data-dl]').forEach(b => { b.onclick = () => downloadSheet(+b.dataset.dl); });
  $('#sideTabs').onclick = ev => { const b = ev.target.closest('button[data-t]'); if (b) showTab(b.dataset.t); };
  $('#paneTabs').onclick = ev => { const b = ev.target.closest('button[data-p]'); if (b) setLayout(b.dataset.p); };
  $('#views').onclick = ev => { const b = ev.target.closest('button[data-v]'); if (b) goTo(b.dataset.v); };
  $('#mode').onclick = ev => { const b = ev.target.closest('button[data-m]'); if (!b) return; G3.eve = b.dataset.m === 'eve'; $$('#mode button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); applyMode(); };
  $('#elToggle').onclick = () => setElMode(ED.mode !== 'elec');
  $('#planMode').onclick = ev => { const b = ev.target.closest('button[data-m]'); if (b) setElMode(b.dataset.m === 'elec'); };
  $('#zoomIn').onclick = () => zoomAt(1.35); $('#zoomOut').onclick = () => zoomAt(1 / 1.35); $('#zoomFit').onclick = () => { ED.view = null; applyViewBox(); };
  $('#elTable').addEventListener('click', ev => { const tr = ev.target.closest('tr[data-eid], tr[data-iid]'); if (!tr) return; if (tr.dataset.eid) select('elec', tr.dataset.eid); else select('item', tr.dataset.iid); $('#editor').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#elTable').addEventListener('keydown', ev => { if (ev.key === 'Enter') { const tr = ev.target.closest('tr'); if (tr) tr.click(); } });
  const mf = $('#metaForm');
  mf.addEventListener('input', ev => { const t = ev.target; if (!t.name) return; S.meta[t.name] = t.value.slice(0, 120); scheduleSheets(); });
  mf.addEventListener('change', () => { commit(); });
  mf.addEventListener('submit', ev => ev.preventDefault());
  window.addEventListener('beforeprint', () => { clearTimeout(sheetT); renderSheets(); });
  let wasWide = window.innerWidth >= 1000;
  window.addEventListener('resize', () => { const wide = window.innerWidth >= 1000; if (wide !== wasWide) { wasWide = wide; if (!wide && UI.layout === 'split') setLayout('3d'); } measureUpp(); renderOverlay(); });
  document.addEventListener('keydown', ev => {
    const t = ev.target, typing = t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable), mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.code === 'KeyZ') { if (typing) return; ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
    if (mod && ev.code === 'KeyY') { if (typing) return; ev.preventDefault(); redo(); return; }
    if (typing || ev.altKey) return;
    if (mod && ev.code === 'KeyD') { ev.preventDefault(); dupSel(); return; }
    if (mod) return;
    if (ev.key === 'Escape') { if (SEL) select(null); return; }
    if (!SEL) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); delSel(); return; }
    if (ev.code === 'KeyR') { rotSel(ev.shiftKey ? -90 : 90); return; }
    const st = ev.shiftKey ? 0.1 : 0.01, mv = { ArrowLeft: [-st, 0, 0], ArrowRight: [st, 0, 0], ArrowUp: [0, -st, 0], ArrowDown: [0, st, 0], PageUp: [0, 0, st], PageDown: [0, 0, -st] }[ev.key];
    if (mv) { ev.preventDefault(); nudge(...mv); }
  });
}
async function boot() {
  let st = null, fromLink = false;
  const m = location.hash.match(/[#&]v=([A-Za-z0-9_-]+)/), wantEtalon = /^#etalon\b/.test(location.hash);
  if (m) { try { st = await decodeState(m[1]); fromLink = true; } catch (e) { st = null; } }
  if (!st) st = loadLocal();
  S = st ? sanitizeState(st) : etalonState();
  if (fromLink || wantEtalon) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } if (fromLink) saveLocal(); }
  loadMine();
  resetHistory();
  renderAddPanel(); bindPanels(); bindGlobal(); initPlanEditor();
  const ok = init3D();
  if (ok) { sync3D(true); goTo('entry', true); $('#msg').hidden = true; }
  else { $('#msg').innerHTML = '3D не запустилось в этом браузере (нет WebGL). План, отделка, электрика и чертежи работают.'; }
  onChange = () => renderAll();
  setLayout(window.innerWidth >= 1100 && ok ? 'split' : ok ? '3d' : 'plan');
  showTab('add'); renderAll(); scheduleSheets(true);
  if (fromLink) toast('Открыт проект по ссылке — правки сохраняются у тебя');
  else if (wantEtalon) toEtalon(true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { renderPlan(); });
  if (/[?&]test\b/.test(location.search)) window.__zal = { get S() { return S; }, set S(v) { S = v; }, get SEL() { return SEL; }, UI, toEtalon, toMine, isEtalon, select, addItem, addElec, goTo, setLayout, setElMode, undo, redo, commit, renderSheets, sheet1, sheet2, sheet3, encodeState, decodeState, G3, ED, HIST, applyRoom, finAct, delSel, dupSel, rotSel };
}
boot();
