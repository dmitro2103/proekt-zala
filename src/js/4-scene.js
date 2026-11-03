/* ============ 4. 3D scene: shell, sync, picking, dragging, modes ============ */
function balcGeom(R) { R = R || S.room; const b = R.balc, d0 = b.x0, d1 = b.x0 + b.dw; let w0, w1; if (b.side === 'left') { w1 = d0; w0 = d0 - b.ww; } else { w0 = d1; w1 = d1 + b.ww; } return { d0, d1, w0, w1, top: 2.15, sill: 0.85, side: b.side, l: Math.min(d0, w0), r: Math.max(d1, w1) }; }
function doorGeom(R) { R = R || S.room; return { z0: R.L - R.door.off - R.door.w, z1: R.L - R.door.off, h: 2.05, cas: 0.07 }; }
const T3 = { N: 0.30, E: 0.14, S: 0.16, W: 0.16 };
const CORNICE = [[0, 0], [0.065, 0], [0.065, -0.012], [0.05, -0.02], [0.03, -0.035], [0.016, -0.055], [0.012, -0.075], [0, -0.075]];
const PLINTH_P = [[0, 0], [0.019, 0], [0.019, 0.05], [0.012, 0.062], [0, 0.065]];
function profileAlong(pts, len, m, start, inward) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
  const o = mesh(new THREE.ExtrudeGeometry(sh, { depth: Math.max(len, 0.001), bevelEnabled: false, curveSegments: 4 }), m, start.x, start.y, start.z, false);
  o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(inward, V3(0, 1, 0), new THREE.Vector3().crossVectors(inward, V3(0, 1, 0)))); return o;
}
function wallGeo(a0, a1, h, depth, holes) {
  const sh = new THREE.Shape(); sh.moveTo(a0, -0.05); sh.lineTo(a1, -0.05); sh.lineTo(a1, h); sh.lineTo(a0, h); sh.closePath();
  for (const pts of holes) { const p = new THREE.Path(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); sh.holes.push(p); }
  return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1 });
}
const G3 = { ok: false, needs: true, walls: {}, ceil: [], ext: [], items: new Map(), elec: new Map(), shellKey: '', eve: false, el: false, view: 'entry' };

function curtainPanel(x0, x1, folds, amp, m, zc, H) {
  const w = Math.max(0.05, x1 - x0), seg = Math.max(32, folds * 10), g = new THREE.PlaneGeometry(w, H - 0.06, seg, 8), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), k = (x + w / 2) / w; pos.setZ(i, amp * Math.sin(k * folds * Math.PI * 2) + (y < -0.9 ? 0.006 * Math.sin(k * 40) : 0)); }
  g.computeVertexNormals(); return mesh(g, m, (x0 + x1) / 2, (H - 0.06) / 2 + 0.03, zc, true);
}
function buildShell() {
  const G = new THREE.Group(), R = S.room, { W, L, H } = R, t = T3, B = balcGeom(R), d = doorGeom(R), fin = S.fin;
  G3.walls = { N: [], E: [], S: [], W: [] }; G3.ceil = []; G3.ext = [];
  const addW = (k, ...o) => { for (const x of o) { G3.walls[k].push(x); G.add(x); } };
  const ext = (...o) => { for (const x of o) { G3.ext.push(x); G.add(x); } };
  const wm = k => wallMaterial(fin.accent.wall === k ? fin.accent : fin.wall);
  const fmM = floorMaterial(fin.floor), ft = fmM.map; ft.repeat.set(W / ft.userData.wm, L / ft.userData.lm);
  const floor = mesh(new THREE.PlaneGeometry(W, L), fmM, W / 2, 0, L / 2, false); floor.rotation.x = -Math.PI / 2; floor.userData.floor = true; G.add(floor);
  const ceil = mesh(new THREE.PlaneGeometry(W + 0.34, L + 0.5), M.ceil, W / 2, H, L / 2, true); ceil.rotation.x = Math.PI / 2; G3.ceil.push(ceil); G.add(ceil);
  const hole = B.side === 'left' ? [[B.w0, B.sill], [B.d0, B.sill], [B.d0, 0], [B.d1, 0], [B.d1, B.top], [B.w0, B.top]] : [[B.d0, 0], [B.d1, 0], [B.d1, B.sill], [B.w1, B.sill], [B.w1, B.top], [B.d0, B.top]];
  addW('N', mesh(wallGeo(-t.W, W + t.E, H, t.N, [hole]), [wm('N'), M.reveal], 0, 0, -t.N));
  const wE = mesh(wallGeo(-t.N, L + t.S, H, t.E, [[[d.z0, 0], [d.z1, 0], [d.z1, d.h], [d.z0, d.h]]]), [wm('E'), M.reveal], W + t.E, 0, 0); wE.rotation.y = -Math.PI / 2; addW('E', wE);
  addW('S', mesh(wallGeo(-t.W, W + t.E, H, t.S, []), [wm('S'), M.reveal], 0, 0, L));
  const wW = mesh(wallGeo(-t.N, L + t.S, H, t.W, []), [wm('W'), M.reveal], 0, 0, 0); wW.rotation.y = -Math.PI / 2; addW('W', wW);
  const pc = fin.plinth === 'floor' ? (FLOOR_DEF[fin.floor] || FLOOR_DEF.lino).plinth : PLINTH[fin.plinth][1], PM = colMat(pc, 0.45);
  addW('N', profileAlong(CORNICE, W, M.cornice, V3(W, H, 0), V3(0, 0, 1)), profileAlong(CORNICE, W, M.cornice, V3(0, H, L), V3(0, 0, -1)));
  addW('E', profileAlong(CORNICE, L, M.cornice, V3(W, H, L), V3(-1, 0, 0))); addW('W', profileAlong(CORNICE, L, M.cornice, V3(0, H, 0), V3(1, 0, 0)));
  addW('N', profileAlong(PLINTH_P, B.d0, PM, V3(B.d0, 0, 0), V3(0, 0, 1)), profileAlong(PLINTH_P, W - B.d1, PM, V3(W, 0, 0), V3(0, 0, 1)));
  addW('S', profileAlong(PLINTH_P, W, PM, V3(0, 0, L), V3(0, 0, -1)));
  addW('E', profileAlong(PLINTH_P, d.z0 - d.cas, PM, V3(W, 0, d.z0 - d.cas), V3(-1, 0, 0)), profileAlong(PLINTH_P, L - d.z1 - d.cas, PM, V3(W, 0, L), V3(-1, 0, 0)));
  addW('W', profileAlong(PLINTH_P, L, PM, V3(0, 0, 0), V3(1, 0, 0)));
  addW('E', box(W - 0.014, W, 0, d.h + d.cas, d.z0 - d.cas, d.z0, M.pvc), box(W - 0.014, W, 0, d.h + d.cas, d.z1, d.z1 + d.cas, M.pvc), box(W - 0.014, W, d.h, d.h + d.cas, d.z0 - d.cas, d.z1 + d.cas, M.pvc));
  ext(mesh(new THREE.BoxGeometry(1.5, H, 3.4), M.corr, W + t.E + 0.75, H / 2, (d.z0 + d.z1) / 2 + 0.2, true));
  const cf = mesh(new THREE.PlaneGeometry(1.5, 3.4), M.corrFloor, W + t.E + 0.75, 0.002, (d.z0 + d.z1) / 2 + 0.2, false); cf.rotation.x = -Math.PI / 2; ext(cf);
  // balcony block
  const fz0 = -0.22, fz1 = -0.15, fr = 0.065, fb = (a, b, y0, y1) => box(a, b, y0, y1, fz0, fz1, M.pvc), sz0 = fz1 - 0.005, sz1 = fz1 + 0.03, sb = (a, b, y0, y1) => box(a, b, y0, y1, sz0, sz1, M.pvc), sw = 0.075;
  const mull = B.side === 'right' ? B.d1 : B.d0;
  addW('N', fb(B.l, B.l + fr, B.l === B.d0 ? 0 : B.sill, B.top), fb(B.r - fr, B.r, B.r === B.d1 ? 0 : B.sill, B.top), fb(B.l, B.r, B.top - fr, B.top), fb(mull - 0.04, mull + 0.04, 0, B.top), fb(B.d0, B.d1, 0, 0.04), fb(B.w0, B.w1, B.sill, B.sill + fr));
  const sx0 = B.d0 + (B.d0 === B.l ? fr : 0.04), sx1 = B.d1 - (B.d1 === B.r ? fr : 0.04), sy0 = 0.04, sy1 = B.top - fr;
  addW('N', sb(sx0, sx0 + sw, sy0, sy1), sb(sx1 - sw, sx1, sy0, sy1), sb(sx0, sx1, sy1 - sw, sy1), sb(sx0, sx1, sy0, sy0 + sw), sb(sx0 + sw, sx1 - sw, sy0 + sw, 0.95), sb(sx0, sx1, 0.93, 1.0));
  const hx = B.side === 'right' ? sx1 - 0.06 : sx0 + 0.035; addW('N', box(hx, hx + 0.025, 1.02, 1.17, sz1, sz1 + 0.05, M.whiteMetal));
  const glass = (a, b, y0, y1) => { const g = mesh(new THREE.PlaneGeometry(Math.max(b - a, 0.01), Math.max(y1 - y0, 0.01)), M.glass, (a + b) / 2, (y0 + y1) / 2, (fz0 + fz1) / 2, false); g.receiveShadow = false; g.renderOrder = 2; return g; };
  addW('N', glass(sx0 + sw, sx1 - sw, 1.0, sy1 - sw));
  const wx0 = B.w0 + (B.w0 === B.l ? fr : 0.04), wx1 = B.w1 - (B.w1 === B.r ? fr : 0.04), wide = wx1 - wx0 > 0.8, wmid = (wx0 + wx1) / 2;
  if (wide) addW('N', fb(wmid - 0.035, wmid + 0.035, B.sill, B.top));
  const ws0 = wx0, ws1 = wide ? wmid - 0.035 : wx1;
  addW('N', sb(ws0, ws0 + sw, B.sill + fr, B.top - fr), sb(ws1 - sw, ws1, B.sill + fr, B.top - fr), sb(ws0, ws1, B.top - fr - sw, B.top - fr), sb(ws0, ws1, B.sill + fr, B.sill + fr + sw), glass(ws0 + sw, ws1 - sw, B.sill + fr + sw, B.top - fr - sw));
  if (wide) addW('N', glass(wmid + 0.035, wx1, B.sill + fr, B.top - fr));
  addW('N', box(B.side === 'right' ? B.w0 : B.w0 - 0.04, B.side === 'right' ? B.w1 + 0.04 : B.w1, B.sill - 0.03, B.sill, fz1, 0.06, M.pvc));
  const rx0 = B.w0 + 0.12, rx1 = B.w1 - 0.12;
  for (let x = rx0; x < rx1 - 0.05; x += 0.08) addW('N', rbox(x, x + 0.065, 0.14, 0.64, 0.04, 0.12, 0.012, M.pvc, 2));
  addW('N', box(rx1 + 0.02, rx1 + 0.045, 0, 0.62, 0.05, 0.075, M.whiteMetal), box(rx1 + 0.06, rx1 + 0.085, 0, 0.62, 0.05, 0.075, M.whiteMetal));
  ext(box(B.l - 0.7, B.r + 0.7, -0.22, -0.12, -t.N - 1.25, -t.N, M.balc), box(B.l - 0.7, B.r + 0.7, -0.12, 0.92, -t.N - 1.28, -t.N - 1.18, M.balc));
  for (let x = B.l - 0.68; x <= B.r + 0.7; x += 0.62) ext(box(x - 0.03, x + 0.03, 0.92, 2.5, -t.N - 1.26, -t.N - 1.20, M.pvc));
  ext(box(B.l - 0.7, B.r + 0.7, 0.92, 0.98, -t.N - 1.27, -t.N - 1.19, M.pvc), box(B.l - 0.7, B.r + 0.7, 2.44, 2.56, -t.N - 1.27, -t.N - 1.19, M.pvc), box(B.l - 0.7, B.r + 0.7, 2.56, 2.66, -t.N - 1.3, -t.N, M.balc));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(34, 17), M.sky); sky.position.set(W / 2, 3.2, -9); ext(sky);
  // curtains
  const ct = fin.curt;
  if (ct.type !== 'none') {
    addW('N', box(0.02, W - 0.02, H - 0.025, H, 0.10, 0.24, M.pvc));
    const cm = mat('curt:' + ct.type + ct.color, () => std({ color: toInt(ct.color), roughness: 1, side: THREE.DoubleSide, bumpMap: fabricBump(), bumpScale: ct.type === 'blackout' ? 0.001 : 0.002 }, 0.8));
    if (ct.type === 'roman') {
      const top = B.top + 0.02, drop = 0.55, a = B.w0 + 0.02, b = B.w1 - 0.02, n = 4;
      for (let i = 0; i < n; i++) { const y1 = top - i * drop / n, y0 = y1 - drop / n; const f = rbox(a, b, y0, y1, -0.13, -0.10, 0.012, cm, 2); f.scale.z = 1; addW('N', f); }
      if (ct.tulle) { const tl = curtainPanel(Math.max(0.05, B.l - 0.2), Math.min(W - 0.05, B.r + 0.05), 20, 0.012, M.tulle, 0.145, H); tl.castShadow = false; tl.receiveShadow = false; tl.renderOrder = 3; addW('N', tl); }
    } else {
      const heavy = ct.type === 'blackout', lA = Math.max(0.05, B.l - 1.0), lB = Math.max(lA + 0.2, B.l - 0.12), rA = Math.min(W - 0.25, B.r), rB = Math.min(W - 0.04, B.r + 0.9);
      addW('N', curtainPanel(lA, lB, heavy ? 8 : 7, heavy ? 0.055 : 0.045, cm, 0.20, H), curtainPanel(rA, rB, Math.max(3, Math.round((rB - rA) * 9)), heavy ? 0.05 : 0.04, cm, 0.20, H));
      if (ct.tulle) { const tl = curtainPanel(Math.max(0.05, B.l - 0.2), Math.min(W - 0.05, B.r + 0.05), 20, 0.012, M.tulle, 0.145, H); tl.castShadow = false; tl.receiveShadow = false; tl.renderOrder = 3; addW('N', tl); }
    }
  }
  // light rigs follow the room
  G3.sun.position.set(B.r + 1.4, 4.6, -3.8); G3.sun.target.position.set(W * 0.42, 0, Math.min(2.3, L * 0.4));
  G3.sky.width = B.r - B.l; G3.sky.height = B.top - 0.2; G3.sky.position.set((B.l + B.r) / 2, (B.top + 0.2) / 2 + 0.1, 0.03); G3.sky.lookAt((B.l + B.r) / 2, 1.0, 3);
  G3.bounce.width = W; G3.bounce.height = L; G3.bounce.position.set(W / 2, 0.03, L / 2); G3.bounce.lookAt(W / 2, 3, L / 2);
  return G;
}
function disposeObj(o) { o.traverse(x => { if (x.geometry && x.geometry !== _leaf && x.geometry !== _bigLeaf) x.geometry.dispose(); if (x.isLight && x.shadow && x.shadow.map) x.shadow.map.dispose(); }); if (o.parent) o.parent.remove(o); }
const itemKey = it => JSON.stringify([it.type, it.w, it.d, it.h, it.opts, it.type === 'wardrobe' ? S.room.H : 0]);
const elecKey = e => JSON.stringify([e.kind, e.mods, e.keys && e.keys.length, e.variant, e.frame, e.shade, e.mount]);
function placeItem(it, g) {
  if (CAT[it.type].wall) { const p = wallPt(it.wall, it.s); g.position.set(p.x, it.y, p.z); g.rotation.set(0, WROT[it.wall], 0); }
  else { g.position.set(it.x, 0, it.z); g.rotation.set(0, deg(it.rot), 0); }
}
function placeElec(e, g) {
  if (e.kind === 'light' && e.mount === 'ceil') { g.position.set(e.x, S.room.H, e.z); g.rotation.set(0, 0, 0); }
  else { const p = wallPt(e.wall, e.s); g.position.set(p.x, e.h, p.z); g.rotation.set(0, WROT[e.wall], 0); }
}
function sync3D(full) {
  if (!G3.ok) return;
  const sk = JSON.stringify([S.room, S.fin]);
  if (full || sk !== G3.shellKey) { if (G3.shell) disposeObj(G3.shell); G3.shell = buildShell(); G3.scene.add(G3.shell); G3.shellKey = sk; full = true; }
  const seen = new Set();
  for (const it of S.items) {
    seen.add(it.id); let rec = G3.items.get(it.id); const key = itemKey(it);
    if (!rec || rec.key !== key || full) { if (rec) disposeObj(rec.g); const g = BUILD[it.type](it); g.userData.itemId = it.id; G3.itemsRoot.add(g); rec = { g, key }; G3.items.set(it.id, rec); }
    placeItem(it, rec.g);
  }
  for (const [id, rec] of G3.items) if (!seen.has(id)) { disposeObj(rec.g); G3.items.delete(id); }
  seen.clear();
  for (const e of S.elec) {
    seen.add(e.id); let rec = G3.elec.get(e.id); const key = elecKey(e);
    if (!rec || rec.key !== key || full) { if (rec) disposeObj(rec.g); const g = e.kind === 'light' ? lightGroup(e) : plateGroup(e); g.userData.elecId = e.id; G3.elecRoot.add(g); rec = { g, key }; G3.elec.set(e.id, rec); }
    placeElec(e, rec.g);
  }
  for (const [id, rec] of G3.elec) if (!seen.has(id)) { disposeObj(rec.g); G3.elec.delete(id); }
  applyMode(); applyEl(); makeTags(); updateSelBox(); G3.needs = true;
}
function liveMove(sel) { // cheap transform update during drags
  if (!G3.ok || !sel) return;
  if (sel.kind === 'item') { const it = S.items.find(i => i.id === sel.id), rec = it && G3.items.get(it.id); if (rec) placeItem(it, rec.g); }
  else { const e = S.elec.find(x => x.id === sel.id), rec = e && G3.elec.get(e.id); if (rec) placeElec(e, rec.g); }
  updateSelBox(); G3.needs = true;
}
function updateSelBox() {
  if (!G3.ok) return; const rec = SEL && (SEL.kind === 'item' ? G3.items.get(SEL.id) : G3.elec.get(SEL.id));
  if (!rec) { G3.selBox.visible = false; return; }
  G3.selBox.setFromObject(rec.g); G3.selBox.visible = true; G3.needs = true;
}
function applyMode() {
  if (!G3.ok) return; const ev = G3.eve;
  G3.renderer.toneMappingExposure = ev ? 1.15 : 0.95; ENV_F = ev ? 0.035 : 0.30;
  for (const m of MATS) { m.envMapIntensity = (m.userData.env ?? 1) * ENV_F; if (m.userData.glow != null) m.emissiveIntensity = ev ? m.userData.glow : 0; }
  G3.sun.visible = !ev; G3.sky.visible = !ev;
  G3.hemi.color.set(ev ? 0xFFE2C2 : 0xffffff); G3.hemi.groundColor.set(ev ? 0x8a6a50 : 0xcdbfae); G3.hemi.intensity = ev ? 0.12 : 0.3;
  G3.bounce.color.set(ev ? 0xFFD3A6 : 0xFFF1E2); G3.bounce.intensity = ev ? 0.16 : 0.5;
  M.ledRing.emissiveIntensity = ev ? 4 : 0; M.opal.emissiveIntensity = ev ? 2.6 : 0; M.shadeFab.emissiveIntensity = ev ? 0.9 : 0; M.bulb.emissiveIntensity = ev ? 3 : 0; M.clearGlass.emissiveIntensity = ev ? 0.4 : 0; M.smoke.emissiveIntensity = ev ? 0.5 : 0;
  M.sky.map = skyTex(ev); M.sky.needsUpdate = true;
  G3.scene.traverse(o => { if (o.userData.eve || o.userData.led) o.visible = ev; if (o.userData.tvScreen) o.material = ev ? M.tvOn : M.screenOff; });
  G3.scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--viewer-bg').trim() || '#D9DCD7');
  G3.needs = true;
}
function applyEl() {
  if (!G3.ok) return;
  G3.elecRoot.traverse(o => { if (o.userData.plate) o.material = G3.el ? M.plateHi : M.plate; if (o.userData.acGhost) o.visible = G3.el; });
  $('#tags').hidden = !G3.el; G3.needs = true;
}
function makeTags() {
  if (!G3.ok) return; const host = $('#tags'), lab = elecLabels(); host.innerHTML = ''; G3.tags = [];
  const pts = S.elec.map(e => {
    if (e.kind === 'light' && e.mount === 'ceil') return { e, pos: V3(e.x, S.room.H - 0.3, e.z), n: null };
    const p = wallPt(e.wall, e.s); return { e, pos: V3(p.x + p.nx * 0.03, e.h + (e.kind === 'light' ? 0.16 : 0), p.z + p.nz * 0.03), n: V3(p.nx, 0, p.nz) };
  });
  for (const v of ledList()) { const c = itemPos(v.item); pts.push({ e: { id: v.id, kind: 'led' }, pos: V3(c.x, Math.min(v.item.h || 1, 1.6), c.z), n: null }); }
  for (const q of pts) { const d = document.createElement('div'); d.className = 'tag' + (q.e.kind === 'ac' ? ' opt' : ''); d.innerHTML = `${esc(lab[q.e.id] || '')}<i>${q.e.h != null ? 'h' + mm(q.e.h) : q.e.kind === 'led' ? 'LED' : ''}</i>`; host.appendChild(d); q.el = d; G3.tags.push(q); }
}
function updateTags() {
  if (!G3.el || !G3.tags) return;
  const w = G3.canvas.clientWidth, h = G3.canvas.clientHeight, v = new THREE.Vector3(), cp = G3.camera.position;
  for (const q of G3.tags) {
    v.copy(q.pos).project(G3.camera); let ok = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
    if (ok && q.n) ok = (cp.x - q.pos.x) * q.n.x + (cp.z - q.pos.z) * q.n.z > 0.02;
    q.el.hidden = !ok; if (ok) q.el.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px) translate(-50%, ${q.e.kind === 'socket' && q.e.h < 0.5 ? '40%' : '-130%'})`;
  }
}
function updateVisibility() {
  const c = G3.camera.position, R = S.room, hid = { N: c.z < -0.01, S: c.z > R.L + 0.01, E: c.x > R.W + 0.01, W: c.x < -0.01 };
  for (const k in G3.walls) for (const m of G3.walls[k]) m.visible = !hid[k];
  const ch = c.y > R.H - 0.01; for (const m of G3.ceil) m.visible = !ch;
  const out = hid.N || hid.S || hid.E || hid.W || ch; for (const m of G3.ext) m.visible = !out;
  G3.hidden = hid;
}
function presets() {
  const R = S.room, { W, L } = R, d = doorGeom(R);
  return {
    entry: { p: [W - 0.36, 1.6, (d.z0 + d.z1) / 2 - 0.08], t: [W * 0.30, 1.0, 0.75] },
    window: { p: [W * 0.48, 1.55, 0.45], t: [W * 0.48, 1.0, L - 0.4] },
    ne: { p: [W - 0.3, 1.7, 0.3], t: [W * 0.25, 0.85, L * 0.62] },
    sw: { p: [0.35, 1.7, L - 0.35], t: [W * 0.75, 0.85, L * 0.35] },
    top: { p: [-1.7, 6.6, -1.9], t: [W / 2 + 0.15, 0.1, L / 2 + 0.25] },
    plan: { p: [W / 2, Math.max(W, L) * 1.55 + 2, L / 2 + 0.01], t: [W / 2, 0, L / 2] },
  };
}
const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function goTo(name, instant) {
  if (!G3.ok) return; const pr = presets()[name]; if (!pr) return; G3.view = name;
  $$('#views button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === name)));
  const p1 = V3(...pr.p), t1 = V3(...pr.t), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (instant || reduce) { G3.camera.position.copy(p1); G3.controls.target.copy(t1); G3.controls.update(); G3.needs = true; G3.tween = null; return; }
  G3.tween = { p0: G3.camera.position.clone(), t0: G3.controls.target.clone(), p1, t1, s: performance.now(), d: 1000 };
}

/* picking & dragging in 3D */
function ray3(cx, cy) { const r = G3.canvas.getBoundingClientRect(); G3.ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); G3.ray.setFromCamera(G3.ndc, G3.camera); return G3.ray.ray; }
function pick(cx, cy) {
  ray3(cx, cy);
  const objs = [...[...G3.items.values()].map(r => r.g), ...[...G3.elec.values()].map(r => r.g)];
  for (const h of G3.ray.intersectObjects(objs, true)) {
    let o = h.object; if (o.userData.noPick || !o.visible) continue;
    while (o && !o.userData.itemId && !o.userData.elecId) o = o.parent;
    if (o) return { kind: o.userData.itemId ? 'item' : 'elec', id: o.userData.itemId || o.userData.elecId, point: h.point.clone() };
  }
  return null;
}
function rayWall(ray) {
  const R = S.room, c = G3.camera.position; let best = null;
  const P = [['N', V3(0, 0, 1), 0], ['S', V3(0, 0, -1), R.L], ['W', V3(1, 0, 0), 0], ['E', V3(-1, 0, 0), R.W]];
  for (const [w, n, k] of P) {
    if ((G3.hidden || {})[w]) continue;
    const p = ray.intersectPlane(new THREE.Plane(n, k), new THREE.Vector3()); if (!p) continue;
    const s = (w === 'N' || w === 'S') ? p.x : p.z; if (s < 0 || s > wallLen(w) || p.y < 0 || p.y > R.H) continue;
    const dist = p.distanceTo(c); if (!best || dist < best.dist) best = { wall: w, s, y: p.y, dist };
  }
  return best;
}
function init3DInteraction() {
  const host = $('#view3d'), cv3 = G3.canvas;
  let drag = null;
  host.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target !== cv3) return;
    const hit = pick(e.clientX, e.clientY); G3.down = { x: e.clientX, y: e.clientY, hit };
    if (!hit) return;
    e.stopPropagation(); e.preventDefault();
    const obj = hit.kind === 'item' ? S.items.find(i => i.id === hit.id) : S.elec.find(x => x.id === hit.id); if (!obj) return;
    drag = { hit, obj, moved: false, sx: e.clientX, sy: e.clientY, pid: e.pointerId };
    if (hit.kind === 'item' && !CAT[obj.type].wall) { drag.mode = 'floor'; drag.plane = new THREE.Plane(V3(0, 1, 0), -clamp(hit.point.y, 0, 1.2)); const p = ray3(e.clientX, e.clientY).intersectPlane(drag.plane, new THREE.Vector3()); drag.off = p ? [obj.x - p.x, obj.z - p.z] : [0, 0]; }
    else if (hit.kind === 'elec' && obj.kind === 'light' && obj.mount === 'ceil') { drag.mode = 'ceil'; drag.plane = new THREE.Plane(V3(0, 1, 0), -S.room.H); const p = ray3(e.clientX, e.clientY).intersectPlane(drag.plane, new THREE.Vector3()); drag.off = p ? [obj.x - p.x, obj.z - p.z] : [0, 0]; }
    else { drag.mode = 'wall'; const wh = rayWall(ray3(e.clientX, e.clientY)); drag.off = wh ? [(obj.s ?? 0) - wh.s, (obj.y ?? obj.h ?? 0) - wh.y] : [0, 0]; }
    try { host.setPointerCapture(e.pointerId); } catch (er) { }
  }, true);
  host.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    if (!drag.moved) { drag.moved = true; select(drag.hit.kind, drag.hit.id, true); }
    const o = drag.obj, ray = ray3(e.clientX, e.clientY);
    if (drag.mode === 'floor' || drag.mode === 'ceil') {
      const p = ray.intersectPlane(drag.plane, new THREE.Vector3()); if (!p) return;
      o.x = r3(p.x + drag.off[0]); o.z = r3(p.z + drag.off[1]);
      if (drag.mode === 'floor') clampInRoom(o, S.room); else normElec(o, S.room);
    } else {
      const wh = rayWall(ray); if (!wh) return;
      const isItem = drag.hit.kind === 'item';
      if (wh.wall !== o.wall) { o.wall = wh.wall; drag.off[0] = 0; }
      o.s = r3(wh.s + drag.off[0]);
      if (isItem) { o.y = r3(clamp(wh.y + drag.off[1], 0.3, S.room.H - 0.1)); normItem(o, S.room); }
      else { o.h = r3(Math.round((wh.y + drag.off[1]) * 100) / 100); normElec(o, S.room); }
    }
    liveMove(drag.hit); propsLive();
  }, true);
  const end = e => {
    if (!drag) { if (G3.down && !G3.down.hit && Math.hypot(e.clientX - G3.down.x, e.clientY - G3.down.y) < 5 && e.target === cv3) select(null); G3.down = null; return; }
    try { host.releasePointerCapture(drag.pid); } catch (er) { }
    if (drag.moved) commit(); else select(drag.hit.kind, drag.hit.id);
    drag = null; G3.down = null;
  };
  host.addEventListener('pointerup', end, true); host.addEventListener('pointercancel', end, true);
}
function init3D() {
  if (!THREE_OK) return false;
  const canvas = $('#c3d'); let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }); } catch (e) { return false; }
  MAXANI = renderer.capabilities.getMaxAnisotropy();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.physicallyCorrectLights = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, 0.03, 80), controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.5; controls.zoomSpeed = 0.9; controls.panSpeed = 0.7; controls.minDistance = 0.25; controls.maxDistance = 18; controls.maxPolarAngle = Math.PI * 0.97; controls.screenSpacePanning = true;
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  THREE.RectAreaLightUniformsLib.init();
  baseMaterials();
  const sun = new THREE.DirectionalLight(0xFFF0DC, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -5.5, right: 5.5, top: 5.5, bottom: -5.5, near: 0.5, far: 18 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
  const sky = new THREE.RectAreaLight(0xE4EEFF, 2.2, 2, 2), hemi = new THREE.HemisphereLight(0xffffff, 0xcdbfae, 0.3), bounce = new THREE.RectAreaLight(0xFFF1E2, 0.5, 3, 5);
  scene.add(sun, sun.target, sky, hemi, bounce);
  const itemsRoot = new THREE.Group(), elecRoot = new THREE.Group(); scene.add(itemsRoot, elecRoot);
  const selBox = new THREE.BoxHelper(undefined, 0x2A55C9); selBox.visible = false; selBox.material.depthTest = false; selBox.material.transparent = true; selBox.renderOrder = 10; scene.add(selBox);
  Object.assign(G3, { ok: true, renderer, scene, camera, controls, canvas, sun, sky, hemi, bounce, itemsRoot, elecRoot, selBox, ray: new THREE.Raycaster(), ndc: new THREE.Vector2() });
  controls.addEventListener('change', () => { G3.needs = true; });
  controls.addEventListener('start', () => { G3.tween = null; const h = $('#hint'); if (h && !h.classList.contains('gone')) setTimeout(() => h.classList.add('gone'), 700); $$('#views button').forEach(b => b.setAttribute('aria-pressed', 'false')); });
  const resize = () => { const host = $('#view3d'), w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = clamp(2 * Math.atan(Math.tan(deg(78) / 2) / camera.aspect) * 180 / Math.PI, 48, 82); camera.updateProjectionMatrix(); G3.needs = true; };
  new ResizeObserver(resize).observe($('#view3d')); G3.resize = resize;
  init3DInteraction();
  const frame = now => {
    requestAnimationFrame(frame);
    if (G3.tween) { const k = Math.min(1, (now - G3.tween.s) / G3.tween.d), e = easeIO(k); camera.position.lerpVectors(G3.tween.p0, G3.tween.p1, e); controls.target.lerpVectors(G3.tween.t0, G3.tween.t1, e); if (k >= 1) G3.tween = null; G3.needs = true; }
    const moved = controls.update();
    if ((moved || G3.needs) && !document.hidden && G3.visible !== false) { updateVisibility(); renderer.render(scene, camera); updateTags(); G3.needs = false; }
  };
  requestAnimationFrame(frame);
  return true;
}
