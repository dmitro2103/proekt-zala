/* ============ 5. plan drawing primitives (shared by editor and sheets) + editor ============ */
const n1 = v => Math.round(v * 10) / 10;
function svgR(cls, x, y, w, h, rx = 0, extra = '') { return `<rect class="${cls}" x="${n1(Math.min(x, x + w))}" y="${n1(Math.min(y, y + h))}" width="${n1(Math.abs(w))}" height="${n1(Math.abs(h))}"${rx ? ` rx="${n1(rx)}"` : ''}${extra}/>`; }
function svgL(cls, x1, y1, x2, y2) { return `<line class="${cls}" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}"/>`; }
function svgC(cls, x, y, r) { return `<circle class="${cls}" cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}"/>`; }
function svgT(cls, x, y, s, anchor = 'middle', rot = 0) { return `<text class="${cls}" x="${n1(x)}" y="${n1(y)}" text-anchor="${anchor}"${rot ? ` transform="rotate(${rot} ${n1(x)} ${n1(y)})"` : ''}>${s}</text>`; }

/* furniture symbol in local frame (centre origin, width along u, depth along v, front = +v); k = units per metre */
function symItem(it, k) {
  const w = it.w * k, d = it.d * k, x0 = -w / 2, z0 = -d / 2, x1 = w / 2, z1 = d / 2, R = svgR, L = svgL, C = svgC; let s = '';
  switch (it.type) {
    case 'sofa': case 'armchair': {
      const arm = (it.type === 'sofa' ? Math.min(0.15, it.w * 0.09) : 0.13) * k, back = (it.type === 'sofa' ? 0.2 : 0.18) * k, n = it.type === 'armchair' ? 1 : it.w > 2.3 ? 3 : it.w < 1.55 ? 1 : 2;
      s = R('f', x0, z0, w, d, 0.05 * k) + R('f2', x0, z0, arm, d, 0.04 * k) + R('f2', x1 - arm, z0, arm, d, 0.04 * k) + R('f2', x0 + arm, z0, w - 2 * arm, back);
      for (let i = 1; i < n; i++) { const x = x0 + arm + (w - 2 * arm) * i / n; s += L('l', x, z0 + back, x, z1); } return s;
    }
    case 'bed': {
      const hb = (it.opts.head === 'none' ? 0.04 : 0.095) * k, n = it.w >= 1.15 ? 2 : 1, pw = Math.min(0.62, (it.w - 0.1) / n - 0.04) * k;
      s = R('f', x0, z0, w, d, 0.03 * k) + R('f2', x0, z0, w, hb);
      for (let i = 0; i < n; i++) { const px = n === 2 ? (i ? 1 : -1) * (w / 4 - 0.01 * k) : 0; s += R('l', px - pw / 2, z0 + hb + 0.05 * k, pw, 0.34 * k, 0.05 * k); }
      s += L('l', x0 + 0.02 * k, z0 + 0.64 * k, x1 - 0.02 * k, z0 + 0.64 * k) + R('f2', x0, z1 - 0.48 * k, w, 0.42 * k); return s;
    }
    case 'nightstand': case 'dresser': case 'tvstand': s = R('f', x0, z0, w, d, 0.01 * k) + L('l', x0 + 0.03 * k, z1 - 0.04 * k, x1 - 0.03 * k, z1 - 0.04 * k); if (it.type === 'tvstand') { const n = Math.max(2, Math.round(it.w / 0.55)); for (let i = 1; i < n; i++) s += L('l', x0 + w * i / n, z1 - 0.04 * k, x0 + w * i / n, z1); } return s;
    case 'wardrobe': {
      s = R('f', x0, z0, w, d);
      if (it.opts.style === 'hinged') { const n = Math.max(1, Math.round((it.w - 0.036) / 0.45)), dw = w / n; for (let i = 0; i < n; i++) { const a = x0 + dw * i; s += L('l', a, z1, a + dw, z1) + `<path class="sw" d="M${n1(a + dw)} ${n1(z1)} A${n1(dw)} ${n1(dw)} 0 0 1 ${n1(a)} ${n1(z1 + dw)}"/>`; } }
      else s += L('l', x0, z1 - 0.03 * k, x1, z1 - 0.03 * k) + L('l', x0, z1 - 0.065 * k, x1, z1 - 0.065 * k);
      s += L('d', x0 + 0.06 * k, z0 + d * 0.45, x1 - 0.06 * k, z0 + d * 0.45); return s;
    }
    case 'divider': s = R('f2', x0, z0, w, d); for (const f of [0.33, 0.68]) s += L('l', x0 + f * w, z0, x0 + f * w, z1); return s;
    case 'bookcase': return R('f2', x0, z0, w, d) + L('l', x0, z0 + 0.02 * k, x1, z0 + 0.02 * k) + L('l', x0, z0, x1, z1) + L('l', x1, z0, x0, z1);
    case 'desk': return R('f', x0, z0, w, d, 0.03 * k) + (it.opts.monitor ? R('l', -0.26 * k, z0 + 0.17 * k, 0.62 * k, 0.04 * k) + R('l', -0.2 * k, z1 - 0.30 * k, 0.45 * k, 0.14 * k, 0.01 * k) : '') + (it.opts.pc ? R('l', x0 + 0.04 * k, z0 + 0.03 * k, 0.21 * k, 0.44 * k) : '');
    case 'chair': return R('f', -0.25 * k, -0.25 * k, 0.5 * k, 0.5 * k, 0.08 * k) + `<path class="l" d="M${n1(-0.24 * k)} ${n1(-0.31 * k)}Q0 ${n1(-0.38 * k)} ${n1(0.24 * k)} ${n1(-0.31 * k)}"/>`;
    case 'coffee': return it.opts.shape === 'round' ? C('f', 0, 0, w / 2) : R('f', x0, z0, w, d, 0.02 * k);
    case 'pouf': return `<ellipse class="f" cx="0" cy="0" rx="${n1(w / 2)}" ry="${n1(d / 2)}"/>`;
    case 'rug': return R('rug', x0, z0, w, d, 0.03 * k);
    case 'floorlamp': return C('f', 0, 0, 0.15 * k) + C('l', 0, 0, 0.03 * k);
    case 'plant': { s = C('f', 0, 0, 0.24 * k * Math.min(1.2, it.h / 1.6 + 0.2)); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3, cx = Math.cos(a) * 0.12 * k, cy = Math.sin(a) * 0.12 * k; s += `<ellipse class="l" cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(0.11 * k)}" ry="${n1(0.045 * k)}" transform="rotate(${n1(a * 180 / Math.PI)} ${n1(cx)} ${n1(cy)})"/>`; } return s; }
    case 'tv': return (it.opts.shelf ? R('d', -(it.opts.shelfW || 1.3) * k / 2, 0, (it.opts.shelfW || 1.3) * k, 0.22 * k) : '') + R('f2', x0, 0.01 * k, w, 0.04 * k);
    case 'shelf': return R('d', x0, 0, w, d);
    case 'picture': return R('f2', x0, 0, w, 0.03 * k);
  }
  return R('f', x0, z0, w, d);
}
function itemTransform(it, k) {
  if (CAT[it.type].wall) { const p = wallPt(it.wall, it.s); return `translate(${n1(p.x * k)} ${n1(p.z * k)}) rotate(${n1(-WROT[it.wall] * 180 / Math.PI)})`; }
  return `translate(${n1(it.x * k)} ${n1(it.z * k)}) rotate(${n1(-(it.rot || 0))})`;
}
/* walls, openings */
function shellSym(R, k) {
  const t = T3, W = R.W, L = R.L, B = balcGeom(R), d = doorGeom(R), X = v => v * k;
  const rect = (x0, z0, x1, z1, cls = 'wall') => svgR(cls, X(x0), X(z0), X(x1 - x0), X(z1 - z0));
  let s = rect(-t.W, -t.N, B.l, 0) + rect(B.r, -t.N, W + t.E, 0);
  s += `<path class="win" d="M${X(B.w0)} ${X(-t.N)}H${X(B.w1)}M${X(B.w0)} ${X(0)}H${X(B.w1)}M${X(B.w0)} ${X(-0.20)}H${X(B.w1)}M${X(B.w0)} ${X(-0.15)}H${X(B.w1)}M${X(B.side === 'right' ? B.w1 : B.w0)} ${X(-t.N)}V${X(0)}"/>`;
  s += rect(B.side === 'right' ? B.w0 : B.w0 - 0.04, -0.15, B.side === 'right' ? B.w1 + 0.04 : B.w1, 0.06, 'sill') + rect(B.w0 + 0.12, 0.08, B.w1 - 0.12, 0.15, 'rad');
  const dw = B.d1 - B.d0, hinge = B.side === 'right' ? B.d0 : B.d1, other = B.side === 'right' ? B.d1 : B.d0;
  s += `<path class="win" d="M${X(B.d0)} ${X(-0.20)}H${X(B.d1)}M${X(B.side === 'right' ? B.d0 : B.d1)} ${X(-t.N)}V${X(0)}"/>`;
  s += `<path class="leaf" d="M${X(hinge)} ${X(0)}V${X(dw)}"/><path class="sw" d="M${X(hinge)} ${X(dw)}A${X(dw)} ${X(dw)} 0 0 ${B.side === 'right' ? 0 : 1} ${X(other)} ${X(0)}"/>`;
  s += rect(W, -t.N, W + t.E, d.z0) + rect(W, d.z1, W + t.E, L + t.S) + `<path class="head" d="M${X(W)} ${X(d.z0)}V${X(d.z1)}M${X(W + t.E)} ${X(d.z0)}V${X(d.z1)}"/>`;
  s += rect(-t.W, L, W + t.E, L + t.S) + rect(-t.W, -t.N, 0, L + t.S);
  return s;
}
/* electrical symbols, world coordinates; opt.sz scales symbol size (sheets) without moving anchors */
function elSym(e, k, lab, opt = {}) {
  const X = v => v * k, q = k * (opt.sz || 1); let s = '';
  if (e.kind === 'light' && e.mount === 'ceil') {
    const x = X(e.x), z = X(e.z);
    if (e.variant === 'spot') s = svgC('el', x, z, 0.06 * q) + svgC('elf', x, z, 0.018 * q);
    else { const r = (e.variant === 'pendant' ? 0.10 : 0.13) * q, dd = r * 0.7071; s = svgC('el', x, z, r) + `<path class="ell" d="M${n1(x - dd)} ${n1(z - dd)}l${n1(2 * dd)} ${n1(2 * dd)}M${n1(x + dd)} ${n1(z - dd)}l${n1(-2 * dd)} ${n1(2 * dd)}"/>`; }
    return s;
  }
  const w = wallPt(e.wall, e.s), px = X(w.x), pz = X(w.z), nx = w.nx, nz = w.nz, tx = w.tx, tz = w.tz;
  if (e.kind === 'socket' || e.kind === 'ac') {
    const mods = e.kind === 'ac' ? ['s'] : e.mods, n = mods.length, gap = 0.13 * q, rr = 0.06 * q, sweep = (tx * nz - tz * nx) > 0 ? 0 : 1, cls = e.kind === 'ac' ? 'elo' : 'el';
    mods.forEach((m, i) => {
      const off = (i - (n - 1) / 2) * gap, cx = px + tx * off, cz = pz + tz * off;
      if (m === 'lan' || m === 'tv') { const a = 0.045 * q, qx = cx + nx * a, qz = cz + nz * a; s += svgR(cls, qx - a, qz - a, 2 * a, 2 * a) + svgR('elf', qx - a * 0.36, qz - a * 0.36, a * 0.72, a * 0.72); }
      else { s += `<path class="${cls}" d="M${n1(cx - tx * rr)} ${n1(cz - tz * rr)}A${n1(rr)} ${n1(rr)} 0 0 ${sweep} ${n1(cx + tx * rr)} ${n1(cz + tz * rr)}Z"/>` + svgL(e.kind === 'ac' ? 'elo' : 'ell', cx + nx * rr, cz + nz * rr, cx + nx * rr * 1.55, cz + nz * rr * 1.55); if (m === 'su') s += svgC('elf', cx + nx * 0.03 * q, cz + nz * 0.03 * q, 0.016 * q); }
    });
    if (e.kind === 'ac') { const a0 = 0.10 * q, a1 = 0.10 * q + 0.8 * k, dpt = 0.21 * k, P = (u, v) => `${n1(px - tx * u + nx * v)} ${n1(pz - tz * u + nz * v)}`; s += `<path class="elo" d="M${P(a0, 0)}L${P(a1, 0)}L${P(a1, dpt)}L${P(a0, dpt)}Z"/>`; }
    return s;
  }
  if (e.kind === 'switch') {
    const cx = px + nx * 0.10 * q, cz = pz + nz * 0.10 * q, r = 0.045 * q;
    s += svgL('ell', px, pz, cx - nx * r, cz - nz * r);
    const ks = e.keys.length, angs = ks === 1 ? [0.8] : ks === 2 ? [0.55, 1.05] : [0.45, 0.8, 1.15];
    for (const a of angs) { const dx = nx * Math.cos(a) + tx * Math.sin(a), dz = nz * Math.cos(a) + tz * Math.sin(a), ex = cx + dx * 0.13 * q, ez = cz + dz * 0.13 * q; s += svgL('ell', cx + dx * r, cz + dz * r, ex, ez) + svgL('ell', ex, ez, ex - nx * 0.04 * q, ez - nz * 0.04 * q); }
    return s + svgC('el', cx, cz, r);
  }
  if (e.kind === 'light') { const cx = px + nx * 0.13 * q, cz = pz + nz * 0.13 * q, r = 0.07 * q, dd = r * 0.7071; return svgL('ell', px, pz, px + nx * 0.06 * q, pz + nz * 0.06 * q) + svgC('el', cx, cz, r) + `<path class="ell" d="M${n1(cx - dd)} ${n1(cz - dd)}l${n1(2 * dd)} ${n1(2 * dd)}M${n1(cx + dd)} ${n1(cz - dd)}l${n1(-2 * dd)} ${n1(2 * dd)}"/>`; }
  return s;
}
function ledSym(it, k) {
  if (it.type === 'wardrobe') { const c = fromLocal(it, -it.w / 2 + 0.08, -it.d / 2 + 0.12), dd = fromLocal(it, it.w / 2 - 0.08, -it.d / 2 + 0.12); return svgL('led', c[0] * k, c[1] * k, dd[0] * k, dd[1] * k); }
  if (CAT[it.type].wall) { const p = wallPt(it.wall, it.s), q = it.d / 2, h = it.w / 2 - 0.04; return svgL('led', (p.x + p.nx * q - p.tx * h) * k, (p.z + p.nz * q - p.tz * h) * k, (p.x + p.nx * q + p.tx * h) * k, (p.z + p.nz * q + p.tz * h) * k); }
  const a = fromLocal(it, -it.w / 2 + 0.06, 0), b = fromLocal(it, it.w / 2 - 0.06, 0); return svgL('led', a[0] * k, a[1] * k, b[0] * k, b[1] * k);
}
function elAnchor(id, k, sz = 1) {
  if (id.startsWith('led:')) { const it = S.items.find(i => 'led:' + i.id === id); if (!it) return null; const c = itemPos(it); return { x: c.x * k, z: c.z * k }; }
  const e = S.elec.find(x => x.id === id); if (!e) return null;
  if (e.kind === 'light' && e.mount === 'ceil') return { x: e.x * k, z: e.z * k };
  const w = wallPt(e.wall, e.s), off = (e.kind === 'light' ? 0.13 : 0.10) * sz; return { x: (w.x + w.nx * off) * k, z: (w.z + w.nz * off) * k };
}
function ctlLines(k, sz = 1) {
  let s = '';
  for (const e of S.elec.filter(x => x.kind === 'switch')) e.keys.forEach((key, ki) => key.forEach((tid, j) => {
    const A = elAnchor(e.id, k, sz), B = elAnchor(tid, k, sz); if (!A || !B) return;
    const dx = B.x - A.x, dz = B.z - A.z, bend = (ki % 2 ? -0.18 : 0.18) + j * 0.05, cx = (A.x + B.x) / 2 - dz * bend, cz = (A.z + B.z) / 2 + dx * bend;
    s += `<path class="ctl k${Math.min(ki + 1, 3)}" d="M${n1(A.x)} ${n1(A.z)}Q${n1(cx)} ${n1(cz)} ${n1(B.x)} ${n1(B.z)}"/>`;
  }));
  return s;
}
function elLabelPos(e, k, i, sz = 1) {
  if (e.kind === 'light' && e.mount === 'ceil') return { x: e.x * k, y: e.z * k + 0.27 * k * sz, a: 'middle' };
  const w = wallPt(e.wall, e.s), q = k * sz, off = (e.kind === 'light' ? 0.30 : 0.26) * q + (e.kind === 'switch' ? 0.06 * q : 0), alt = 0;
  let x = w.x * k + w.nx * off, y = w.z * k + w.nz * off, a = 'middle';
  if (w.nx > 0) { a = 'start'; x -= 0.08 * q; } if (w.nx < 0) { a = 'end'; x += 0.08 * q; }
  if (w.nx !== 0) y += 0.035 * q + (e.kind === 'switch' ? -0.08 * q : e.h < 0.5 ? 0.09 * q : 0); else y += (w.nz > 0 ? 0.05 * q : 0) + alt;
  return { x, y, a };
}
/* label placement with simple collision avoidance: stacked along vertical walls, rows along horizontal walls */
function elLabelLayout(k, sz = 1, fs = 11) {
  const lab = elecLabels(), out = [], by = { N: [], E: [], S: [], W: [] }, gap = fs * 1.2;
  for (const e of S.elec) {
    const p = elLabelPos(e, k, 0, sz), t = lab[e.id] || '', sub = e.h != null ? 'h' + mm(e.h) : '';
    const o = { e, x: p.x, y: p.y, a: p.a, t, sub, w: (t.length + sub.length * 0.82 + 0.6) * 0.6 * fs };
    out.push(o); if (!(e.kind === 'light' && e.mount === 'ceil')) by[e.wall].push(o);
  }
  for (const w of ['E', 'W']) { const L = by[w].sort((a, b) => a.y - b.y); for (let i = 1; i < L.length; i++) if (L[i].y < L[i - 1].y + gap) L[i].y = L[i - 1].y + gap; }
  for (const w of ['N', 'S']) { const L = by[w].sort((a, b) => a.x - b.x), ends = [], dir = w === 'N' ? 1 : -1; for (const o of L) { let r = 0; while (ends[r] != null && ends[r] > o.x - o.w / 2 - fs * 0.4) r++; ends[r] = o.x + o.w / 2; o.y += dir * r * gap; } }
  return out;
}
/* dimension chain. Text goes above a horizontal line and left of a vertical one (GOST 2.307);
   spans too narrow for their number alternate to the other side / a second row. o.fs = text height in metres at this scale */
function dimChain(axis, stops, at, from, k, cls = '', o = {}) {
  const F = o.fs || 0.1, st = [...new Set(stops.map(v => Math.round(v * 1000) / 1000))].sort((a, b) => a - b), X = v => v * k, tk = 0.35 * F; if (st.length < 2) return '';
  let s = `<g class="dim">`, flip = 0;
  const dir = from != null && at < from ? -1 : 1, OFF = [-0.35 * F, 1.15 * F, -1.5 * F];
  const tx = (a, b) => { const t = mm(b - a), need = t.length * 0.62 * F + 0.4 * F; let lvl = 0; if (b - a < need) { flip = flip === 1 ? 2 : 1; lvl = flip; } else flip = 0; return [t, OFF[lvl]]; };
  if (axis === 'x') {
    s += svgL('', X(st[0]), X(at), X(st[st.length - 1]), X(at));
    st.forEach(v => { s += svgL('tick', X(v - tk), X(at + tk), X(v + tk), X(at - tk)); if (from != null) s += svgL('ext', X(v), X(from + dir * 0.3 * F), X(v), X(at + dir * 0.5 * F)); });
    for (let i = 0; i < st.length - 1; i++) { const a = st[i], b = st[i + 1], [t, of] = tx(a, b); s += svgT(cls, X((a + b) / 2), X(at + of), t); }
  } else {
    s += svgL('', X(at), X(st[0]), X(at), X(st[st.length - 1]));
    st.forEach(v => { s += svgL('tick', X(at - tk), X(v + tk), X(at + tk), X(v - tk)); if (from != null) s += svgL('ext', X(from + dir * 0.3 * F), X(v), X(at + dir * 0.5 * F), X(v)); });
    for (let i = 0; i < st.length - 1; i++) { const a = st[i], b = st[i + 1], [t, of] = tx(a, b); s += svgT(cls, X(at + of), X((a + b) / 2), t, 'middle', -90); }
  }
  return s + '</g>';
}
function elecChains(k, gap = 0.30, o = {}) {
  const R = S.room, t = T3, d = doorGeom(R), on = w => S.elec.filter(e => e.wall === w && !(e.kind === 'light' && e.mount === 'ceil')).map(e => e.s);
  const ceil = S.elec.filter(e => e.kind === 'light' && e.mount === 'ceil');
  return dimChain('z', [0, ...on('E'), d.z0, d.z1, R.L], R.W + t.E + gap, R.W + t.E, k, '', o) + dimChain('z', [0, ...on('W'), ...ceil.map(e => e.z), R.L], -t.W - gap, -t.W, k, '', o) + dimChain('x', [0, ...on('S'), R.W], R.L + t.S + gap, R.L + t.S, k, '', o) + dimChain('x', [0, ...on('N'), ...ceil.map(e => e.x), R.W], -t.N - gap, -t.N, k, '', o);
}
/* overall room dimensions + wall marks (А Б В Г in circles) */
function roomDims(k, gap = 0.30, o = {}) {
  const R = S.room, t = T3, d = doorGeom(R), B = balcGeom(R);
  return dimChain('x', [0, B.l, B.r, R.W], -t.N - gap, -t.N, k, '', o) + dimChain('z', [0, d.z0, d.z1, R.L], R.W + t.E + gap, R.W + t.E, k, '', o) + dimChain('x', [0, R.W], R.L + t.S + gap, R.L + t.S, k, '', o) + dimChain('z', [0, R.L], -t.W - gap, -t.W, k, '', o);
}
function wallMarks(k, gap = 0.62, r = 0.11) {
  const R = S.room, t = T3, P = { N: [R.W / 2, -t.N - gap], S: [R.W / 2, R.L + t.S + gap], E: [R.W + t.E + gap, R.L / 2], W: [-t.W - gap, R.L / 2] };
  let s = '<g class="wl">'; for (const w of WALLS) { const [x, z] = P[w]; s += svgC('', x * k, z * k, r * k) + svgT('', x * k, z * k + r * k * 0.36, WRU[w]); } return s + '</g>';
}

/* ---------- editor ---------- */
const ED = { mode: 'furn', drag: null, view: null, upp: 1, ptrs: new Map(), pinch: null };
const PK = 100; // editor units: centimetres
const SHORT = { sofa: 'Диван', armchair: 'Кресло', coffee: 'Столик', pouf: 'Пуф', bed: 'Кровать', nightstand: 'Тумба', wardrobe: 'Шкаф', divider: 'Стеллаж', bookcase: 'Стеллаж', dresser: 'Комод', desk: 'Стол', tvstand: 'Тумба ТВ' };
function edViewBox() { const R = S.room, p = 0.78, top = 0.5; return [(-T3.W - p) * PK, (-T3.N - p - top) * PK, (R.W + T3.W + T3.E + 2 * p) * PK, (R.L + T3.N + T3.S + 2 * p + top) * PK]; }
function curViewBox() {
  const b = edViewBox(), v = ED.view; if (!v || v.zoom <= 1.001) return b;
  const w = b[2] / v.zoom, h = b[3] / v.zoom; let x = v.cx * PK - w / 2, y = v.cz * PK - h / 2;
  x = clamp(x, b[0] - w * 0.25, b[0] + b[2] - w * 0.75); y = clamp(y, b[1] - h * 0.25, b[1] + b[3] - h * 0.75);
  v.cx = (x + w / 2) / PK; v.cz = (y + h / 2) / PK; return [x, y, w, h];
}
function measureUpp() { const svg = $('#planSvg'); if (!svg) return; const r = svg.getBoundingClientRect(), vb = curViewBox(); if (r.width > 0 && r.height > 0) ED.upp = Math.max(vb[2] / r.width, vb[3] / r.height); }
function applyViewBox() { const svg = $('#planSvg'); if (!svg) return; svg.setAttribute('viewBox', curViewBox().map(n1).join(' ')); measureUpp(); renderOverlay(); const z = $('#zoomFit'); if (z) z.disabled = !ED.view || ED.view.zoom <= 1.001; }
function renderPlan() {
  const host = $('#planHost'); if (!host || host.closest('[hidden]')) return;
  const vb = curViewBox(), b0 = edViewBox(), el = ED.mode === 'elec', lab = elecLabels(), k = PK;
  let s = `<svg id="planSvg" class="plan ed${el ? ' elmode' : ''}" viewBox="${vb.map(n1).join(' ')}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${el ? 'План электрики' : 'План расстановки мебели'}">`;
  s += `<rect class="bg" x="${n1(b0[0] - b0[2])}" y="${n1(b0[1] - b0[3])}" width="${n1(b0[2] * 3)}" height="${n1(b0[3] * 3)}"/>`;
  s += `<rect class="floor" x="0" y="0" width="${n1(S.room.W * k)}" height="${n1(S.room.L * k)}"/>`;
  const isSel = it => SEL && SEL.kind === 'item' && SEL.id === it.id, items = [...S.items].sort((a, b) => ((b.type === 'rug') - (a.type === 'rug')) || (isSel(a) - isSel(b)));
  s += '<g id="plItems">';
  for (const it of items) s += `<g class="it${SEL && SEL.kind === 'item' && SEL.id === it.id ? ' sel' : ''}${el ? ' ghost' : ''}" data-id="${it.id}" transform="${itemTransform(it, k)}">${symItem(it, k)}</g>`;
  s += '</g><g id="plShell">' + shellSym(S.room, k) + '</g>' + wallMarks(k);
  if (el) {
    s += '<g id="plElec">' + ledList().map(v => ledSym(v.item, k)).join('') + ctlLines(k);
    S.elec.forEach(e => { s += `<g class="ep${SEL && SEL.kind === 'elec' && SEL.id === e.id ? ' sel' : ''}" data-eid="${e.id}">${elSym(e, k, lab)}${svgC('hit', ...hitPos(e, k), 0.17 * k)}</g>`; });
    for (const o of elLabelLayout(k, 1, 11)) s += svgT('el-lbl', o.x, o.y, `${esc(o.t)}<tspan class="el-sub" dx="3">${o.sub}</tspan>`, o.a);
    for (const v of ledList()) { const c = itemPos(v.item); s += svgT('el-lbl', c.x * k, c.z * k - 0.08 * k, `${lab[v.id]}<tspan class="el-sub" dx="3">LED</tspan>`); }
    s += elecChains(k) + '</g>';
  } else {
    for (const it of S.items) if (SHORT[it.type] && it.w * it.d > 0.12) { const c = itemPos(it); s += svgT('nm', c.x * k, c.z * k + 4, SHORT[it.type]); }
    s += roomDims(k);
  }
  s += '<g id="plOver"></g></svg>';
  host.innerHTML = s; measureUpp(); renderOverlay();
}
function hitPos(e, k) { if (e.kind === 'light' && e.mount === 'ceil') return [e.x * k, e.z * k]; const w = wallPt(e.wall, e.s); return [(w.x + w.nx * 0.08) * k, (w.z + w.nz * 0.08) * k]; }
function liveDim(x1, z1, x2, z2, k) { const L = Math.hypot(x2 - x1, z2 - z1); if (L < 0.015) return ''; const v = Math.abs(x2 - x1) < 1e-6, f = Math.max(1, ED.upp * 0.9); return `<g class="dim live" style="font-size:${n1(10 * f)}px">${svgL('', x1 * k, z1 * k, x2 * k, z2 * k)}${svgT('', (x1 + x2) / 2 * k + (v ? -4 * f : 0), (z1 + z2) / 2 * k - (v ? 0 : 4 * f), mm(L), 'middle', v ? -90 : 0)}</g>`; }
function renderOverlay() {
  const g = $('#plOver'); if (!g) return; const k = PK, R = S.room, o = getSel(); let s = '';
  const hs = Math.max(7, 11 * ED.upp), sw = Math.max(1.2, 1.6 * ED.upp);
  const handle = (x, z, h) => svgR('hdl', x * k - hs, z * k - hs, 2 * hs, 2 * hs, hs * 0.35, ` data-h="${h}" style="stroke-width:${n1(sw)}"`);
  if (o && SEL.kind === 'item' && ED.mode === 'furn') {
    const it = o, c = CAT[it.type];
    if (c.wall) {
      const p = wallPt(it.wall, it.s), a = [p.x - p.tx * it.w / 2, p.z - p.tz * it.w / 2], b = [p.x + p.tx * it.w / 2, p.z + p.tz * it.w / 2], dd = Math.max(it.d, it.type === 'tv' && it.opts.shelf ? 0.22 : 0.06);
      s += `<path class="selo" style="stroke-width:${n1(sw)}" d="M${n1(a[0] * k)} ${n1(a[1] * k)}L${n1(b[0] * k)} ${n1(b[1] * k)}L${n1((b[0] + p.nx * dd) * k)} ${n1((b[1] + p.nz * dd) * k)}L${n1((a[0] + p.nx * dd) * k)} ${n1((a[1] + p.nz * dd) * k)}Z"/>`;
      if (c.dims && c.dims.w) { s += handle(a[0] + p.nx * dd / 2, a[1] + p.nz * dd / 2, 's-') + handle(b[0] + p.nx * dd / 2, b[1] + p.nz * dd / 2, 's+'); }
      const len = wallLen(it.wall), s0 = it.s - it.w / 2, s1 = it.s + it.w / 2, off = 0.42, P = v => { const q = wallPt(it.wall, v); return [q.x + q.nx * off, q.z + q.nz * off]; };
      s += liveDim(...P(0), ...P(s0), k) + liveDim(...P(s1), ...P(len), k);
    } else {
      const P = corners(it).map(([x, z]) => `${n1(x * k)} ${n1(z * k)}`).join('L');
      s += `<path class="selo" style="stroke-width:${n1(sw)}" d="M${P}Z"/>`;
      for (const [lx, lz, h] of [[it.w / 2, 0, 'w+'], [-it.w / 2, 0, 'w-'], [0, it.d / 2, 'd+'], [0, -it.d / 2, 'd-']]) {
        const dim = h[0]; if (!c.dims || !c.dims[dim]) continue; if (it.type === 'coffee' && it.opts.shape === 'round' && dim === 'd') continue;
        const [x, z] = fromLocal(it, lx, lz); s += handle(x, z, h);
      }
      const reach = Math.max(0.3, (hs * 3) / k), [fx, fz] = fromLocal(it, 0, it.d / 2), [rx, rz] = fromLocal(it, 0, it.d / 2 + reach);
      s += `<line class="rotl" style="stroke-width:${n1(sw * 0.8)}" x1="${n1(fx * k)}" y1="${n1(fz * k)}" x2="${n1(rx * k)}" y2="${n1(rz * k)}"/><circle class="hdl rot" style="stroke-width:${n1(sw)}" cx="${n1(rx * k)}" cy="${n1(rz * k)}" r="${n1(hs * 1.15)}" data-h="rot"/>`;
      const cs = corners(it), xs = cs.map(q => q[0]), zs = cs.map(q => q[1]), minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
      s += liveDim(0, it.z, minX, it.z, k) + liveDim(maxX, it.z, R.W, it.z, k) + liveDim(it.x, 0, it.x, minZ, k) + liveDim(it.x, maxZ, it.x, R.L, k);
    }
  }
  if (o && SEL.kind === 'elec' && ED.mode === 'elec') {
    const e = o, [hx, hz] = hitPos(e, k); s += `<circle class="selc" style="stroke-width:${n1(sw)}" cx="${n1(hx)}" cy="${n1(hz)}" r="${n1(Math.max(0.2 * k, hs * 1.6))}"/>`;
    if (!(e.kind === 'light' && e.mount === 'ceil')) { const len = wallLen(e.wall), off = 0.55, P = v => { const q = wallPt(e.wall, v); return [q.x + q.nx * off, q.z + q.nz * off]; }; s += liveDim(...P(0), ...P(e.s), k) + liveDim(...P(e.s), ...P(len), k); }
    else s += liveDim(0, e.z, e.x, e.z, k) + liveDim(e.x, 0, e.x, e.z, k);
  }
  g.innerHTML = s;
}
function svgPt(ev) { const svg = $('#planSvg'); const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: p.x / PK, z: p.y / PK }; }
function zoomAt(f, clientX, clientY) {
  const svg = $('#planSvg'); if (!svg) return; const v = ED.view || (ED.view = { zoom: 1, cx: 0, cz: 0 }), vb = curViewBox();
  if (ED.view.zoom <= 1.001) { v.cx = (vb[0] + vb[2] / 2) / PK; v.cz = (vb[1] + vb[3] / 2) / PK; }
  const nz = clamp(v.zoom * f, 1, 6); if (Math.abs(nz - v.zoom) < 1e-4) return;
  let p = null; if (clientX != null) p = svgPt({ clientX, clientY });
  const r = nz / v.zoom; v.zoom = nz;
  if (p) { v.cx = p.x + (v.cx - p.x) / r; v.cz = p.z + (v.cz - p.z) / r; }
  if (nz <= 1.001) ED.view = null;
  applyViewBox();
}
function initPlanEditor() {
  const host = $('#planHost');
  host.addEventListener('wheel', ev => { if (!$('#planSvg')) return; ev.preventDefault(); zoomAt(Math.exp(-clamp(ev.deltaY, -120, 120) * 0.0022), ev.clientX, ev.clientY); }, { passive: false });
  host.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return; const svg = $('#planSvg'); if (!svg) return;
    ED.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    try { host.setPointerCapture(ev.pointerId); } catch (er) { }
    if (ED.ptrs.size === 2) { // pinch: drop any drag, zoom around the midpoint
      if (ED.drag && ED.drag.moved && ED.drag.type !== 'pan') commit();
      const [a, b] = [...ED.ptrs.values()]; ED.drag = null;
      ED.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: ED.view ? ED.view.zoom : 1, last: 1 }; return;
    }
    if (ED.ptrs.size > 2) return;
    const hEl = ev.target.closest('[data-h]'), iEl = ev.target.closest('[data-id]'), eEl = ev.target.closest('[data-eid]'), p = svgPt(ev);
    let target = null;
    if (hEl && SEL) target = { type: 'handle', h: hEl.dataset.h };
    else if (ED.mode === 'elec' && eEl) target = { type: 'elec', id: eEl.dataset.eid };
    else if (ED.mode === 'furn' && iEl) target = { type: 'item', id: iEl.dataset.id };
    if (!target) { ED.drag = { type: 'bg', sx: ev.clientX, sy: ev.clientY, moved: false, vb: curViewBox() }; return; }
    ev.preventDefault();
    if (target.type === 'item') { select('item', target.id, true); const it = getSel(); target.off = CAT[it.type].wall ? [it.s - (it.wall === 'N' || it.wall === 'S' ? p.x : p.z), 0] : [it.x - p.x, it.z - p.z]; }
    if (target.type === 'elec') { select('elec', target.id, true); const e = getSel(); target.off = e.kind === 'light' && e.mount === 'ceil' ? [e.x - p.x, e.z - p.z] : [0, 0]; }
    if (target.type === 'handle') target.start = JSON.parse(JSON.stringify(getSel()));
    target.sx = ev.clientX; target.sy = ev.clientY; target.moved = false; ED.drag = target;
  });
  host.addEventListener('pointermove', ev => {
    if (!ED.ptrs.has(ev.pointerId)) return; ED.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ED.pinch && ED.ptrs.size >= 2) { const [a, b] = [...ED.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), f = (ED.pinch.z0 * d / ED.pinch.d0) / (ED.view ? ED.view.zoom : 1); zoomAt(f, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
    const d = ED.drag; if (!d) return;
    if (!d.moved && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 4) return; d.moved = true;
    if (d.type === 'bg') { if (!ED.view) return; const svg = $('#planSvg'), r = svg.getBoundingClientRect(), u = ED.upp; ED.view.cx = (d.vb[0] + d.vb[2] / 2 - (ev.clientX - d.sx) * u) / PK; ED.view.cz = (d.vb[1] + d.vb[3] / 2 - (ev.clientY - d.sy) * u) / PK; applyViewBox(); return; }
    const p = svgPt(ev), R = S.room;
    if (d.type === 'item') {
      const it = getSel(); if (!it) return;
      if (CAT[it.type].wall) { const nw = nearestWall(p.x, p.z, R); if (nw.wall !== it.wall && nw.dist < 0.6) { it.wall = nw.wall; d.off = [0, 0]; } it.s = Math.round(((it.wall === 'N' || it.wall === 'S' ? p.x : p.z) + d.off[0]) * 100) / 100; normItem(it, R); }
      else { it.x = Math.round((p.x + d.off[0]) * 100) / 100; it.z = Math.round((p.z + d.off[1]) * 100) / 100; clampInRoom(it, R); }
    } else if (d.type === 'elec') {
      const e = getSel(); if (!e) return;
      if (e.kind === 'light' && e.mount === 'ceil') { e.x = Math.round((p.x + d.off[0]) * 100) / 100; e.z = Math.round((p.z + d.off[1]) * 100) / 100; }
      else { const nw = nearestWall(p.x, p.z, R); e.wall = nw.wall; e.s = Math.round(nw.s * 100) / 100; }
      normElec(e, R);
    } else if (d.type === 'handle') {
      const it = getSel(), st = d.start; if (!it) return; const c = CAT[it.type];
      if (d.h === 'rot') { let a = Math.atan2(p.x - st.x, p.z - st.z) * 180 / Math.PI; a = ev.shiftKey ? Math.round(a) : Math.round(a / 15) * 15; it.rot = ((a % 360) + 360) % 360; clampInRoom(it, R); }
      else if (d.h === 's+' || d.h === 's-') { const sv = (it.wall === 'N' || it.wall === 'S') ? p.x : p.z, rg = c.dims.w, e0 = st.s - st.w / 2, e1 = st.s + st.w / 2; const nw = r3(clamp(Math.round((d.h === 's+' ? sv - e0 : e1 - sv) * 100) / 100, rg[0], rg[1])); it.w = nw; it.s = r3(d.h === 's+' ? e0 + nw / 2 : e1 - nw / 2); normItem(it, R); }
      else {
        const [lx, lz] = toLocal(st, p.x, p.z), dim = d.h[0], rg = c.dims[dim], sign = d.h[1] === '+' ? 1 : -1, cur = st[dim];
        const fixed = -sign * cur / 2, raw = dim === 'w' ? lx : lz, nv = r3(clamp(Math.round(Math.abs(raw - fixed) * 100) / 100, rg[0], rg[1]));
        const shift = sign * (nv - cur) / 2, [nx, nz] = dim === 'w' ? fromLocal(st, shift, 0) : fromLocal(st, 0, shift);
        it[dim] = nv; it.x = r3(nx); it.z = r3(nz); if (it.type === 'coffee' && it.opts.shape === 'round') it.d = it.w; clampInRoom(it, R, 0.02);
      }
    }
    updatePlanLive(); liveSync(); propsLive();
  });
  const end = ev => {
    ED.ptrs.delete(ev.pointerId); try { host.releasePointerCapture(ev.pointerId); } catch (er) { }
    if (ED.pinch) { if (ED.ptrs.size < 2) ED.pinch = null; ED.drag = null; return; }
    const d = ED.drag; ED.drag = null; if (!d) return;
    if (d.type === 'bg') { if (!d.moved && ev.type === 'pointerup') select(null); return; }
    if (d.moved) commit(); else if (d.type === 'item' || d.type === 'elec') select(d.type, d.id); else renderOverlay();
  };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
}
function updatePlanLive() {
  const o = getSel(); if (!o || !$('#planSvg')) return;
  if (SEL.kind === 'item') { const g = $(`#plItems [data-id="${SEL.id}"]`); if (g) { g.setAttribute('transform', itemTransform(o, PK)); g.innerHTML = symItem(o, PK); } renderOverlay(); }
  else renderPlan();
}
let liveTimer = 0;
function liveSync() { if (!G3.ok) return; const o = getSel(); if (!o) return; const rec = SEL.kind === 'item' ? G3.items.get(o.id) : G3.elec.get(o.id), key = SEL.kind === 'item' ? itemKey(o) : elecKey(o); if (rec && rec.key === key) liveMove(SEL); else { cancelAnimationFrame(liveTimer); liveTimer = requestAnimationFrame(() => sync3D()); } }
function markPlanSel() { // cheap selection refresh without rebuilding the plan
  if (!$('#planSvg')) return;
  $$('#plItems .it').forEach(g => { const on = !!SEL && SEL.kind === 'item' && SEL.id === g.dataset.id; g.classList.toggle('sel', on); if (on) g.parentNode.appendChild(g); });
  $$('#plElec .ep').forEach(g => g.classList.toggle('sel', !!SEL && SEL.kind === 'elec' && SEL.id === g.dataset.eid));
  renderOverlay();
}
