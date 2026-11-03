/* ============ 3. 3D builders (local frame: width x, depth z, front +z, floor y=0) ============ */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function mesh(geo, m, x = 0, y = 0, z = 0, cast = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; return o; }
function box(x0, x1, y0, y1, z0, z1, m, cast = true) { return mesh(new THREE.BoxGeometry(Math.max(Math.abs(x1 - x0), 0.001), Math.max(Math.abs(y1 - y0), 0.001), Math.max(Math.abs(z1 - z0), 0.001)), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast); }
function rbox(x0, x1, y0, y1, z0, z1, r, m, seg = 3) { const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0), rr = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)); return mesh(new THREE.RoundedBoxGeometry(w, h, d, seg, rr), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); }
function cyl(rt, rb, h, m, x, y, z, seg = 24) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z); }
function rod(a, b, r, m, seg = 6) { const d = new THREE.Vector3().subVectors(b, a), len = d.length(); const o = mesh(new THREE.CylinderGeometry(r, r, len, seg), m); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return o; }
function lathe(profile, m, x, y, z, seg = 32) { return mesh(new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0], p[1])), seg), m, x, y, z); }
function blob(x, z, w, d, op = 0.55) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.blob.clone()); o.material.opacity = op; o.rotation.x = -Math.PI / 2; o.position.set(x, 0.004, z); o.renderOrder = 1; o.userData.noPick = true; return o; }
function eveLight(color, intensity, dist, x, y, z) { const l = new THREE.PointLight(color, intensity, dist, 2); l.position.set(x, y, z); l.userData.eve = true; l.visible = false; return l; }
function ledStrip(x0, x1, y, z, w = 0.012) { const s = box(x0, x1, y - 0.006, y - 0.001, z - w / 2, z + w / 2, M.ledStrip, false); s.receiveShadow = false; s.userData.led = true; s.visible = false; return s; }
const glowMat = (key, color, emissive, glow, extra = {}) => mat('glow:' + key, () => { const m = std({ color, emissive, emissiveIntensity: 0, roughness: 0.9, ...extra }, 0.8); m.userData.glow = glow; return m; });

/* upholstered seating (sofa / armchair) */
function bSeat(it, single) {
  const g = new THREE.Group(), w = it.w, d = it.d, F = fabric(it.opts.color), Lg = it.opts.legs === 'black' ? M.blackMetal : M.oakDark;
  const legH = 0.11, baseH = 0.2, arm = single ? 0.13 : Math.min(0.15, w * 0.09), back = single ? 0.18 : 0.20, x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  for (const [x, z] of [[x0 + 0.07, z0 + 0.07], [x1 - 0.07, z0 + 0.07], [x0 + 0.07, z1 - 0.07], [x1 - 0.07, z1 - 0.07]]) g.add(cyl(0.017, 0.011, legH, Lg, x, legH / 2, z, 12));
  g.add(rbox(x0 + 0.005, x1 - 0.005, legH, legH + baseH, z0 + 0.01, z1, 0.035, F));
  g.add(rbox(x0 + arm - 0.01, x1 - arm + 0.01, legH + baseH - 0.02, single ? 0.80 : 0.84, z0 + 0.01, z0 + back, 0.05, F));
  for (const [a, b] of [[x0, x0 + arm], [x1 - arm, x1]]) g.add(rbox(a, b, legH, single ? 0.60 : 0.62, z0 + 0.01, z1, 0.06, F, 4));
  const c0 = x0 + arm, c1 = x1 - arm, n = single ? 1 : w > 2.3 ? 3 : w < 1.55 ? 1 : 2, cw = (c1 - c0) / n;
  for (let i = 0; i < n; i++) {
    g.add(rbox(c0 + cw * i + 0.005, c0 + cw * (i + 1) - 0.005, legH + baseH, legH + baseH + 0.14, z0 + back, z1 - 0.005, 0.055, F, 4));
    const bc = rbox(c0 + cw * i + 0.008, c0 + cw * (i + 1) - 0.008, legH + baseH + 0.13, legH + baseH + (single ? 0.52 : 0.6), z0 + back - 0.02, z0 + back + 0.17, 0.075, F, 4); bc.rotation.x = -0.13; g.add(bc);
  }
  if (!single) {
    const pl = (x, m, ry, rz) => { const p = rbox(-0.2, 0.2, -0.2, 0.2, -0.065, 0.065, 0.07, m, 4); p.position.set(x, legH + baseH + 0.36, z0 + back + 0.2); p.rotation.set(-0.22, ry, rz); return p; };
    g.add(pl(c0 + 0.24, fabric('terracotta'), 0.2, 0.18), pl(c0 + 0.52, fabric('cream'), 0.1, -0.12), pl(c1 - 0.26, fabric('cream'), -0.2, -0.16));
  }
  g.add(blob(0, 0.02, w + 0.3, d + 0.3, 0.6));
  return g;
}
function bCoffee(it) {
  const g = new THREE.Group(), h = it.h, top = wood(it.opts.top);
  if (it.opts.shape === 'round') {
    const r = it.w / 2; g.add(cyl(r, r, 0.028, top, 0, h - 0.014, 0, 48));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; g.add(rod(V3(Math.cos(a) * r * 0.55, h - 0.02, Math.sin(a) * r * 0.55), V3(Math.cos(a) * r * 0.75, 0, Math.sin(a) * r * 0.75), 0.011, M.blackMetal, 8)); }
  } else {
    g.add(rbox(-it.w / 2, it.w / 2, h - 0.03, h, -it.d / 2, it.d / 2, 0.008, top));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(sx * (it.w / 2 - 0.05) - 0.012, sx * (it.w / 2 - 0.05) + 0.012, 0, h - 0.03, sz * (it.d / 2 - 0.05) - 0.012, sz * (it.d / 2 - 0.05) + 0.012, M.blackMetal));
  }
  for (let i = 0; i < 3; i++) g.add(box(-0.12 + i * 0.01, 0.06, h + 0.002 + i * 0.022, h + (i + 1) * 0.022, -0.1, 0.05 - i * 0.01, M.books[(i * 3 + 2) % 8]));
  g.add(lathe([[0, 0], [0.035, 0], [0.04, 0.07], [0, 0.07]], M.ceramic2, 0.12, h, 0.08));
  g.add(blob(0, 0, it.w + 0.25, it.d + 0.25, 0.4));
  return g;
}
function bPouf(it) {
  const g = new THREE.Group(), rx = it.w / 2, h = it.h;
  const p = lathe([[0, 0], [rx * 0.92, 0], [rx, 0.04], [rx, h - 0.05], [rx * 0.94, h - 0.01], [rx * 0.5, h], [0, h]], fabric(it.opts.color), 0, 0, 0, 40);
  p.scale.z = it.d / it.w; g.add(p); g.add(blob(0, 0, it.w + 0.2, it.d + 0.2, 0.45)); return g;
}
function bRug(it) { const g = new THREE.Group(), m = mat('rugm:' + it.opts.color + it.opts.pattern, () => std({ map: rugTex(it.opts.color, it.opts.pattern), roughness: 1 }, 0.8)); g.add(box(-it.w / 2, it.w / 2, 0, 0.008, -it.d / 2, it.d / 2, m, false)); return g; }
function bBed(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, o = it.opts, F = fabric(o.color), x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, hb = o.head === 'none' ? 0.04 : 0.095;
  const lin = mat('linen:' + o.linen, () => std({ color: (LINEN[o.linen] || LINEN.white)[1], roughness: 0.98 }, 0.8));
  g.add(rbox(x0, x1, 0.05, 0.34, z0 + hb - 0.005, z1, 0.035, F));
  if (o.head === 'channels') { const n = Math.max(3, Math.round(w / 0.24)), hw = w / n; for (let i = 0; i < n; i++) g.add(rbox(x0 + hw * i + 0.003, x0 + hw * (i + 1) - 0.003, 0.05, 1.06, z0, z0 + hb, 0.04, F, 4)); }
  else if (o.head === 'panel') g.add(rbox(x0, x1, 0.05, 1.0, z0, z0 + hb, 0.03, F, 3));
  else g.add(rbox(x0, x1, 0.05, 0.42, z0, z0 + hb, 0.012, F, 2));
  g.add(rbox(x0 + 0.03, x1 - 0.03, 0.33, 0.53, z0 + hb + 0.015, z1 - 0.02, 0.06, M.linen, 4));
  g.add(rbox(x0 - 0.015, x1 + 0.015, 0.47, 0.585, z0 + 0.62, z1 - 0.005, 0.05, lin, 4));
  const fold = cyl(0.055, 0.055, w - 0.06, lin, 0, 0.565, z0 + 0.66, 20); fold.rotation.z = Math.PI / 2; g.add(fold);
  g.add(rbox(x0 - 0.04, x1 + 0.04, 0.575, 0.605, z1 - 0.48, z1 - 0.02, 0.012, M.throwFab, 2));
  for (const sx of [-1, 1]) g.add(rbox(sx * (w / 2 + 0.005) - 0.02, sx * (w / 2 + 0.005) + 0.02, 0.30, 0.6, z1 - 0.47, z1 - 0.05, 0.01, M.throwFab, 2));
  const n = w >= 1.15 ? 2 : 1, pw = Math.min(0.64, (w - 0.1) / n - 0.04);
  for (let i = 0; i < n; i++) { const px = n === 2 ? (i ? 1 : -1) * (w / 4 - 0.01) : 0; const p = rbox(-pw / 2, pw / 2, -0.24, 0.24, -0.075, 0.075, 0.07, M.linen, 4); p.position.set(px, 0.73, z0 + hb + 0.17); p.rotation.x = -0.42; g.add(p); }
  const cu = (x, m, ry) => { const p = rbox(-0.19, 0.19, -0.19, 0.19, -0.06, 0.06, 0.07, m, 4); p.position.set(x, 0.70, z0 + hb + 0.36); p.rotation.set(-0.3, ry, 0); return p; };
  if (w >= 1.15) g.add(cu(-0.2, fabric('sage'), 0.12), cu(0.2, fabric('terracotta'), -0.1)); else g.add(cu(0, fabric('terracotta'), 0));
  g.add(blob(0, 0.03, w + 0.35, d + 0.3, 0.55));
  return g;
}
function bNight(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, h = it.h, m = wood(it.opts.color);
  g.add(rbox(-w / 2, w / 2, 0.12, h, -d / 2, d / 2, 0.012, m, 2));
  g.add(box(-w / 2 + 0.04, w / 2 - 0.04, h - 0.17, h - 0.16, d / 2, d / 2 + 0.004, M.oakDark, false));
  for (const [x, z] of [[-w / 2 + 0.04, -d / 2 + 0.04], [w / 2 - 0.04, -d / 2 + 0.04], [-w / 2 + 0.04, d / 2 - 0.04], [w / 2 - 0.04, d / 2 - 0.04]]) g.add(cyl(0.012, 0.009, 0.12, M.oakDark, x, 0.06, z, 10));
  g.add(lathe([[0, 0], [0.04, 0], [0.055, 0.05], [0.04, 0.12], [0.018, 0.16], [0.02, 0.18], [0, 0.18]], M.ceramic2, -w / 2 + 0.13, h, -0.03));
  g.add(rbox(0.0, Math.min(0.2, w / 2 - 0.02), h, h + 0.03, -0.08, 0.08, 0.004, M.books[4]));
  g.add(blob(0, 0, w + 0.2, d + 0.2, 0.45));
  return g;
}
function bWardrobe(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, h = it.h, o = it.opts, P = panel(o.color), PR = metal(o.profile, PROFILE), x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  g.add(box(x0, x0 + 0.018, 0, h, z0, z1, P), box(x1 - 0.018, x1, 0, h, z0, z1, P));
  g.add(box(x0 + 0.018, x1 - 0.018, 0.05, h - 0.065, z0, z1 - 0.09, P, false));
  if (o.style === 'hinged') {
    g.add(box(x0 + 0.018, x1 - 0.018, h - 0.04, h, z1 - 0.03, z1 - 0.005, P), box(x0 + 0.018, x1 - 0.018, 0, 0.07, z1 - 0.03, z1 - 0.01, P));
    const n = Math.max(1, Math.round((w - 0.036) / 0.45)), dw = (w - 0.036) / n;
    for (let i = 0; i < n; i++) {
      const a = x0 + 0.018 + dw * i, b = a + dw; g.add(box(a + 0.002, b - 0.002, 0.075, h - 0.045, z1 - 0.02, z1, P));
      const hx = (i % 2 === 0) ? b - 0.04 : a + 0.04; if (n > 1 || i === 0) g.add(box(hx - 0.006, hx + 0.006, h / 2 - 0.25, h / 2 + 0.05, z1, z1 + 0.025, PR));
    }
  } else {
    g.add(box(x0 + 0.018, x1 - 0.018, h - 0.065, h, z1 - 0.075, z1 - 0.012, PR), box(x0 + 0.018, x1 - 0.018, 0, 0.05, z1 - 0.075, z1 - 0.012, PR));
    const in0 = x0 + 0.018, in1 = x1 - 0.018, n = clamp(Math.round((in1 - in0) / 0.62), 1, 6), ov = 0.025, dw = (in1 - in0 + ov * (n - 1)) / n;
    const y0 = 0.05, y1 = h - 0.065, dh = y1 - y0, rails = o.style === 'plain' ? [] : [0.32, 0.68], pr = 0.026;
    for (let i = 0; i < n; i++) {
      const a = in0 + i * (dw - ov), b = a + dw, za = z1 - (i % 2 === 0 ? 0.044 : 0.078), zb = za + 0.03;
      g.add(box(a, a + pr, y0, y1, za, zb + 0.006, PR), box(b - pr, b, y0, y1, za, zb + 0.006, PR), box(a + pr, b - pr, y0, y0 + 0.03, za, zb, PR), box(a + pr, b - pr, y1 - 0.03, y1, za, zb, PR));
      let prev = y0 + 0.03; const seg = [...rails, 1];
      seg.forEach((f, k) => {
        const yy = f < 1 ? y0 + dh * f : y1 - 0.03, top = yy - (f < 1 ? 0.007 : 0);
        const isMirror = o.style === 'mirror' && k === 1;
        g.add(box(a + pr, b - pr, prev, top, za + 0.006, zb - 0.004, isMirror ? M.mirror : P));
        if (f < 1) g.add(box(a + pr, b - pr, yy - 0.007, yy + 0.007, za + 0.004, zb - 0.002, PR));
        prev = yy + (f < 1 ? 0.007 : 0);
      });
    }
  }
  g.add(blob(0, z1 + 0.05, w + 0.25, 0.35, 0.5));
  return g;
}
function decorShelf(g, x0, x1, y, zc, depth, Rn, maxH, plantOk) {
  const r = Rn(), wd = x1 - x0;
  if (wd < 0.12 || maxH < 0.12) return;
  if (r < 0.42) { let x = x0 + 0.02; const end = x0 + wd * (0.45 + Rn() * 0.5); while (x < end - 0.02) { const th = 0.018 + Rn() * 0.03, hh = Math.min(maxH - 0.02, 0.15 + Rn() * 0.12); g.add(box(x, x + th, y, y + hh, zc - depth / 2, zc + depth / 2 - Rn() * 0.03, M.books[(Rn() * 8) | 0])); x += th + 0.001; } }
  else if (r < 0.62) { const hh = Math.min(maxH - 0.02, 0.18 + Rn() * 0.12), rr = 0.045 + Rn() * 0.02; g.add(lathe([[0, 0], [rr, 0], [rr * 1.5, hh * 0.3], [rr * 1.1, hh * 0.75], [rr * 0.6, hh * 0.95], [rr * 0.7, hh], [0, hh]], Rn() < 0.5 ? M.ceramic : M.ceramic2, x0 + wd * (0.3 + Rn() * 0.4), y, zc)); }
  else if (r < 0.78 && plantOk) plantSmall(g, x0 + wd * (0.3 + Rn() * 0.4), y, zc, 1.0, (Rn() * 1e6) | 0);
  else if (r < 0.9) { for (let i = 0; i < 3; i++) g.add(box(x0 + 0.03, x0 + Math.min(wd - 0.03, 0.22) - i * 0.01, y + i * 0.03, y + (i + 1) * 0.03 - 0.002, zc - 0.09, zc + 0.09, M.books[(i * 3 + 1) % 8])); }
  else { g.add(lathe([[0, 0], [0.04, 0], [0.11, 0.06], [0.12, 0.07], [0, 0.07]], M.ceramic, x0 + wd / 2, y, zc)); }
}
let _leaf = null, _bigLeaf = null;
function leafGeo() { if (_leaf) return _leaf; const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.075, 0.07, 0.015, 0.2); sh.quadraticCurveTo(0, 0.215, -0.015, 0.2); sh.quadraticCurveTo(-0.075, 0.07, 0, 0); _leaf = new THREE.ShapeGeometry(sh, 6); return _leaf; }
function bigLeafGeo() {
  if (_bigLeaf) return _bigLeaf;
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.09, 0.03, 0.13, 0.16, 0.06, 0.27); sh.quadraticCurveTo(0, 0.3, -0.06, 0.27); sh.bezierCurveTo(-0.13, 0.16, -0.09, 0.03, 0, 0);
  const geo = new THREE.ShapeGeometry(sh, 8), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -Math.abs(x) * 0.45 + 0.25 * y * y); }
  geo.computeVertexNormals(); geo.rotateZ(-Math.PI / 2); geo.translate(0.03, 0, 0); _bigLeaf = geo; return geo;
}
function plantSmall(g, x, y, z, s, seed) {
  const Rn = rng(seed); g.add(lathe([[0, 0], [0.05 * s, 0], [0.065 * s, 0.1 * s], [0.068 * s, 0.11 * s], [0, 0.11 * s]], M.ceramic, x, y, z));
  const lg = leafGeo();
  for (let i = 0; i < 11; i++) { const holder = new THREE.Group(); holder.position.set(x, y + 0.1 * s, z); holder.rotation.y = Rn() * Math.PI * 2; const lf = new THREE.Mesh(lg, Rn() < 0.5 ? M.leaf : M.leaf2); lf.scale.setScalar(s * (0.45 + Rn() * 0.3)); lf.rotation.z = -(0.4 + Rn() * 0.9); holder.add(lf); g.add(holder); }
}
function bDivider(it) {
  const g = new THREE.Group(), Wd = it.w, D = it.d, H = it.h, th = 0.025, mt = wood(it.opts.color), x0 = -Wd / 2, z0 = -D / 2, z1 = D / 2, Rn = rng(hashStr(it.id));
  const pan = (a, b, y0, y1) => box(x0 + a, x0 + b, y0, y1, z0, z1, mt);
  g.add(box(x0 + 0.03, -x0 - 0.03, 0, 0.06, z0 + 0.03, z1 - 0.03, mt));
  g.add(pan(0, th, 0.06, H), pan(Wd - th, Wd, 0.06, H));
  const n = clamp(Math.round((H - 0.06) / 0.43), 2, 6), ys = []; for (let i = 0; i <= n; i++) ys.push(i === n ? H - th : 0.06 + i * (H - 0.06 - th) / n);
  const special = n === 5;
  const span = i => special && i === 2 ? [0, 0.63] : special && i === 4 ? [0.29, 1] : [0, 1];
  const VP = special ? [[0.33, 0.68], [0.20, 0.63], [0.40, 0.63], [0.29, 0.76], [0.29, 0.60]] : [[0.33, 0.68], [0.5], [0.25, 0.62], [0.42, 0.8], [0.3], [0.6]];
  for (let i = 0; i <= n; i++) { const [a, b] = span(i); g.add(pan(a * Wd + (a ? -th / 2 : 0), b * Wd, ys[i], ys[i] + th)); }
  const comps = [];
  for (let i = 0; i < n; i++) { const fr = VP[i % VP.length]; for (const f of fr) g.add(pan(f * Wd - th / 2, f * Wd + th / 2, ys[i] + th, ys[i + 1])); const xs = [0, ...fr, 1]; for (let k = 0; k < xs.length - 1; k++) comps.push([xs[k] * Wd + th, xs[k + 1] * Wd - th, ys[i] + th, ys[i + 1]]); }
  if (it.opts.decor) for (const [a, b, y0, y1] of comps) { if (y0 < 0.1 && Rn() < 0.5) { g.add(rbox(x0 + a + 0.01, x0 + Math.min(b - 0.01, a + 0.14), y0, Math.min(y1 - 0.02, y0 + 0.27), z0 + 0.04, z1 - 0.04, 0.02, M.basket)); continue; } decorShelf(g, x0 + a + 0.01, x0 + b - 0.01, y0, 0, 0.22, Rn, y1 - y0, true); }
  if (it.opts.decor && H > 1.4) plantSmall(g, x0 + Wd * 0.82, H, 0, 1.2, 13);
  if (it.opts.led) { for (let i = 1; i <= n; i++) { const [a, b] = span(i); g.add(ledStrip(x0 + a * Wd + 0.03, x0 + b * Wd - 0.03, ys[i], 0)); } for (const fx of [0.3, 0.55, 0.78]) g.add(eveLight(0xFFBE7A, 0.3, 1.4, x0 + fx * Wd, H * (0.35 + fx * 0.5), 0)); }
  g.add(blob(0, 0, Wd + 0.35, D + 0.4, 0.5));
  return g;
}
function bBookcase(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, H = it.h, th = 0.022, mt = wood(it.opts.color), x0 = -w / 2, z0 = -d / 2, z1 = d / 2, Rn = rng(hashStr(it.id));
  g.add(box(x0, -x0, 0, 0.06, z0, z1 - 0.02, mt), box(x0, x0 + th, 0, H, z0, z1, mt), box(-x0 - th, -x0, 0, H, z0, z1, mt), box(x0, -x0, H - th, H, z0, z1, mt), box(x0 + th, -x0 - th, 0.06, H - th, z0, z0 + 0.008, mt));
  const rows = Math.max(2, Math.round((H - 0.08) / 0.36)), cols = Math.max(1, Math.round(w / 0.62)), rh = (H - 0.06 - th) / rows, cw = (w - th) / cols;
  for (let r = 1; r < rows; r++) g.add(box(x0 + th, -x0 - th, 0.06 + r * rh, 0.06 + r * rh + th, z0 + 0.008, z1, mt));
  for (let c = 1; c < cols; c++) g.add(box(x0 + c * cw, x0 + c * cw + th, 0.06, H - th, z0 + 0.008, z1, mt));
  if (it.opts.decor) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) decorShelf(g, x0 + c * cw + th + 0.01, x0 + (c + 1) * cw - 0.01, 0.06 + r * rh + (r ? th : 0), 0.02, d - 0.1, Rn, rh - th, r > 0);
  if (it.opts.led) { for (let r = 1; r <= rows; r++) g.add(ledStrip(x0 + th + 0.02, -x0 - th - 0.02, 0.06 + r * rh, z1 - 0.04)); g.add(eveLight(0xFFBE7A, 0.35, 1.4, 0, H * 0.6, z1)); }
  g.add(blob(0, 0, w + 0.25, d + 0.3, 0.5));
  return g;
}
function bDresser(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, h = it.h, m = wood(it.opts.color), rows = h > 0.95 ? 4 : 3, base = 0.1;
  g.add(rbox(-w / 2, w / 2, base, h, -d / 2, d / 2, 0.01, m, 2));
  for (let r = 1; r < rows; r++) { const y = base + (h - base) * r / rows; g.add(box(-w / 2 + 0.02, w / 2 - 0.02, y - 0.003, y + 0.003, d / 2, d / 2 + 0.003, M.oakDark, false)); }
  for (let r = 0; r < rows; r++) { const y = base + (h - base) * (r + 0.5) / rows; g.add(box(-0.08, 0.08, y - 0.008, y + 0.008, d / 2, d / 2 + 0.018, M.blackMetal)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.012, 0.009, base, M.oakDark, sx * (w / 2 - 0.05), base / 2, sz * (d / 2 - 0.05), 10));
  g.add(lathe([[0, 0], [0.05, 0], [0.07, 0.1], [0.04, 0.24], [0.045, 0.26], [0, 0.26]], M.ceramic, w / 2 - 0.15, h, 0));
  g.add(blob(0, 0, w + 0.25, d + 0.25, 0.45));
  return g;
}
function bDesk(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, top = it.h, o = it.opts;
  const TOP = { grey: 0x7E8186, white: 0xF2F2EF, black: 0x1F2022 }, topM = o.top === 'oak' ? wood('oak') : colMat(TOP[o.top] || TOP.grey, 0.6), edge = colMat(o.top === 'black' ? 0x2a2b2d : 0xC9CBCC, 0.5), FR = o.frame === 'black' ? M.blackMetal : M.whiteMetal;
  const r = 0.03, sh = new THREE.Shape(), hw = w / 2, hd = d / 2;
  sh.moveTo(-hw + r, -hd); sh.lineTo(hw - r, -hd); sh.quadraticCurveTo(hw, -hd, hw, -hd + r); sh.lineTo(hw, hd - r); sh.quadraticCurveTo(hw, hd, hw - r, hd); sh.lineTo(-hw + r, hd); sh.quadraticCurveTo(-hw, hd, -hw, hd - r); sh.lineTo(-hw, -hd + r); sh.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  const tg = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false, curveSegments: 6 }); tg.rotateX(Math.PI / 2);
  g.add(mesh(tg, [topM, edge], 0, top, 0));
  const lowTop = Math.min(0.46, top - 0.2);
  for (const lx of [-hw + 0.13, hw - 0.13]) {
    for (const pz of [-hd + 0.08, hd - 0.08]) g.add(box(lx - 0.03, lx + 0.03, 0.02, lowTop, pz - 0.04, pz + 0.04, FR), box(lx - 0.024, lx + 0.024, lowTop, top - 0.07, pz - 0.033, pz + 0.033, FR));
    g.add(box(lx - 0.026, lx + 0.026, 0.02, 0.07, -hd + 0.04, hd - 0.04, FR), box(lx - 0.028, lx + 0.028, top - 0.08, top - 0.025, -hd + 0.04, hd - 0.04, FR));
    for (const pz of [-hd + 0.05, hd - 0.05]) g.add(cyl(0.016, 0.018, 0.02, M.graphite, lx, 0.01, pz, 10));
  }
  g.add(box(-hw + 0.13, hw - 0.13, top - 0.075, top - 0.025, -hd + 0.10, -hd + 0.16, FR));
  g.add(rbox(hw - 0.30, hw - 0.16, top - 0.055, top - 0.025, hd - 0.046, hd - 0.004, 0.006, M.black));
  if (o.monitor) {
    const mz = -hd + 0.2, my0 = top + 0.12, mh = 0.36, mw = 0.61;
    g.add(rbox(-0.06, 0.16, top, top + 0.012, mz - 0.09, mz + 0.09, 0.004, M.graphite), box(0.035, 0.065, top, my0 + 0.22, mz - 0.04, mz - 0.01, M.graphite), box(0.05 - mw / 2, 0.05 + mw / 2, my0, my0 + mh, mz - 0.012, mz + 0.012, M.black));
    const scr = mesh(new THREE.PlaneGeometry(mw - 0.016, mh - 0.016), M.monitor, 0.05, my0 + mh / 2, mz + 0.0125, false); g.add(scr);
    const bar = cyl(0.009, 0.009, 0.42, M.graphite, 0.05, my0 + mh + 0.012, mz, 10); bar.rotation.z = Math.PI / 2; g.add(bar);
    g.add(rbox(-0.2, 0.25, top, top + 0.022, hd - 0.30, hd - 0.16, 0.005, M.graphite), rbox(-0.19, 0.24, top + 0.02, top + 0.026, hd - 0.29, hd - 0.17, 0.003, M.black), rbox(0.36, 0.42, top, top + 0.025, hd - 0.31, hd - 0.20, 0.012, M.graphite), rbox(0.30, 0.52, top, top + 0.003, hd - 0.42, hd - 0.08, 0.002, M.mesh));
  }
  if (o.pc) { g.add(rbox(-hw + 0.04, -hw + 0.25, top, top + 0.46, -hd + 0.03, -hd + 0.47, 0.01, M.black)); const gl = mesh(new THREE.PlaneGeometry(0.42, 0.42), M.screenOff, -hw + 0.252, top + 0.23, -hd + 0.25, false); gl.rotation.y = Math.PI / 2; g.add(gl); }
  g.add(blob(0, 0, w + 0.3, d + 0.3, 0.4));
  return g;
}
function bChair(it) {
  const g = new THREE.Group(), C = { graphite: M.mesh, grey: colMat(0x8A8D91, 0.85), white: colMat(0xE8E8E6, 0.7) }[it.opts.color] || M.mesh, B = it.opts.color === 'white' ? M.whiteMetal : M.graphite;
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + 0.3, ex = Math.cos(a) * 0.32, ez = Math.sin(a) * 0.32; g.add(rod(V3(0, 0.085, 0), V3(ex, 0.065, ez), 0.018, B, 6)); g.add(mesh(new THREE.SphereGeometry(0.028, 12, 8), M.black, ex, 0.03, ez)); }
  g.add(cyl(0.026, 0.026, 0.33, B, 0, 0.25, 0, 14), rbox(-0.25, 0.25, 0.42, 0.50, -0.25, 0.25, 0.04, C, 3));
  const bk = rbox(-0.24, 0.24, -0.31, 0.31, -0.03, 0.03, 0.03, C, 3); bk.position.set(0, 0.85, -0.28); bk.rotation.x = -0.13; g.add(bk);
  g.add(rod(V3(0, 0.47, -0.2), V3(0, 0.6, -0.27), 0.02, B));
  for (const s of [-1, 1]) { g.add(rod(V3(s * 0.24, 0.47, -0.05), V3(s * 0.26, 0.64, -0.05), 0.013, B)); g.add(rbox(s * 0.26 - 0.035, s * 0.26 + 0.035, 0.64, 0.665, -0.17, 0.08, 0.012, B)); }
  g.add(blob(0, 0, 0.8, 0.8, 0.45));
  return g;
}
/* wall items: built with z=0 on the wall surface, +z into the room, y relative to item centre */
function bTV(it) {
  const g = new THREE.Group(), w = it.w, h = it.h, o = it.opts;
  g.add(box(-w / 2, w / 2, -h / 2, h / 2, 0.02, 0.05, M.black));
  const scr = mesh(new THREE.PlaneGeometry(w - 0.012, h - 0.012), M.screenOff, 0, 0, 0.0505, false); scr.userData.tvScreen = true; g.add(scr);
  if (o.shelf) {
    const sw = o.shelfW || 1.3, top = -h / 2 - 0.13;
    g.add(box(-sw / 2, sw / 2, top - 0.036, top, 0, 0.22, wood('oak')));
    if (o.soundbar) g.add(rbox(-Math.min(0.46, sw / 2 - 0.05), Math.min(0.46, sw / 2 - 0.05), top, top + 0.065, 0.06, 0.16, 0.015, M.graphite));
    g.add(lathe([[0, 0], [0.045, 0], [0.05, 0.02], [0.05, 0.11], [0, 0.11]], M.ceramic, sw / 2 - 0.12, top, 0.11));
  }
  return g;
}
function bShelf(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, m = wood(it.opts.color), Rn = rng(hashStr(it.id));
  g.add(box(-w / 2, w / 2, -0.0175, 0.0175, 0, d, m));
  if (it.opts.decor) decorShelf(g, -w / 2 + 0.03, w / 2 - 0.03, 0.0175, d / 2, d - 0.06, Rn, 0.32, true);
  if (it.opts.led) { g.add(ledStrip(-w / 2 + 0.03, w / 2 - 0.03, -0.0175, d - 0.03)); g.add(eveLight(0xFFBE7A, 0.25, 1.2, 0, -0.1, d)); }
  return g;
}
function bPicture(it) {
  const g = new THREE.Group(), w = it.w, h = it.h, fr = { black: M.black, oak: wood('oak'), white: colMat(0xF2F2EF, 0.5) }[it.opts.frame] || M.black;
  g.add(box(-w / 2, w / 2, -h / 2, h / 2, 0, 0.028, fr));
  const art = mat('art:' + it.opts.art, () => std({ map: artTex(it.opts.art), roughness: 0.8 }, 0.8));
  g.add(mesh(new THREE.PlaneGeometry(w - 0.05, h - 0.05), art, 0, 0, 0.029, false));
  return g;
}
function bTVStand(it) {
  const g = new THREE.Group(), w = it.w, d = it.d, h = it.h, m = wood(it.opts.color), n = Math.max(2, Math.round(w / 0.55));
  g.add(rbox(-w / 2, w / 2, 0.08, h, -d / 2, d / 2, 0.008, m, 2));
  for (let i = 1; i < n; i++) { const x = -w / 2 + w * i / n; g.add(box(x - 0.002, x + 0.002, 0.1, h - 0.02, d / 2, d / 2 + 0.003, M.oakDark, false)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.012, 0.009, 0.08, M.oakDark, sx * (w / 2 - 0.05), 0.04, sz * (d / 2 - 0.05), 10));
  g.add(blob(0, 0, w + 0.25, d + 0.25, 0.45));
  return g;
}
function bLamp(it) {
  const g = new THREE.Group(), h = it.h, base = { black: M.blackMetal, brass: metal('brass'), white: M.whiteMetal }[it.opts.base] || M.blackMetal;
  const sc = { linen: [0xE9E2D3, 0.9], white: [0xF6F5F2, 1.0], graphite: [0x4A4D52, 0.25] }[it.opts.shade] || [0xE9E2D3, 0.9];
  const shadeM = glowMat('lamp' + it.opts.shade, sc[0], 0xFFC98C, sc[1], { side: THREE.DoubleSide, roughness: 0.95 });
  g.add(cyl(0.14, 0.15, 0.022, base, 0, 0.011, 0, 32), cyl(0.011, 0.011, h - 0.26, base, 0, (h - 0.26) / 2, 0, 10));
  g.add(mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.30, 40, 1, true), shadeM, 0, h - 0.15, 0));
  g.add(eveLight(0xFFC487, 2.2, 6, 0, h - 0.2, 0));
  g.add(blob(0, 0, 0.45, 0.45, 0.4));
  return g;
}
function bPlant(it) {
  const g = new THREE.Group(), Rn = rng(5), s = it.h / 1.6, pot = { white: colMat(0xE6E1D8, 0.7), terracotta: colMat(0xB86E4B, 0.8), graphite: colMat(0x3E4145, 0.6) }[it.opts.pot] || colMat(0xE6E1D8, 0.7);
  g.add(lathe([[0, 0], [0.13 * s, 0], [0.155 * s, 0.04], [0.17 * s, 0.38 * s], [0.175 * s, 0.4 * s], [0.155 * s, 0.4 * s], [0, 0.4 * s]], pot, 0, 0, 0));
  g.add(cyl(0.15 * s, 0.15 * s, 0.01, M.soil, 0, 0.38 * s, 0, 20));
  const lg = bigLeafGeo();
  for (const [dx, th, dz] of [[0.02, 1.55, 0.05], [-0.05, 1.25, -0.08], [0.06, 1.05, 0.1]]) {
    const b0 = V3(dx * 0.3, 0.38 * s, dz * 0.3), tp = V3(dx * 1.6, th * s, dz * 1.6); g.add(rod(b0, tp, 0.011, M.stem, 6));
    const nl = Math.round(th * 15);
    for (let i = 0; i < nl; i++) { const k = 0.35 + 0.65 * (i / nl) + Rn() * 0.04, p = b0.clone().lerp(tp, Math.min(k, 1)), holder = new THREE.Group(); holder.position.copy(p); holder.rotation.y = i * 2.39996 + Rn() * 0.5; const lf = new THREE.Mesh(lg, Rn() < 0.55 ? M.leaf : M.leaf2); lf.scale.setScalar(s * (0.75 + Rn() * 0.45) * (1.1 - 0.35 * k)); lf.rotation.z = -(0.55 + Rn() * 0.5) + k * 0.35; lf.castShadow = true; holder.add(lf); g.add(holder); }
  }
  g.add(blob(0, 0, 0.8 * s, 0.8 * s, 0.45));
  return g;
}
const BUILD = { sofa: it => bSeat(it, false), armchair: it => bSeat(it, true), coffee: bCoffee, pouf: bPouf, rug: bRug, bed: bBed, nightstand: bNight, wardrobe: bWardrobe, divider: bDivider, bookcase: bBookcase, dresser: bDresser, desk: bDesk, chair: bChair, tv: bTV, tvstand: bTVStand, shelf: bShelf, picture: bPicture, floorlamp: bLamp, plant: bPlant };

/* ---------- electrical: plates and light fittings ---------- */
function plateGroup(e) {
  const g = new THREE.Group(), mods = e.kind === 'switch' ? ['sw' + e.keys.length] : e.kind === 'ac' ? ['s'] : e.mods, mw = 0.071, fw = mods.length * mw + 0.012, fh = 0.083;
  const frame = rbox(-fw / 2, fw / 2, -fh / 2, fh / 2, 0, 0.011, 0.004, M.plate, 2); frame.castShadow = false; frame.userData.plate = true; g.add(frame);
  mods.forEach((m, i) => {
    const cx = -fw / 2 + 0.006 + mw * (i + 0.5);
    if (m === 's' || m === 'su') {
      const c = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.004, 28), M.plateIn, cx, 0, 0.0115, false); c.rotation.x = Math.PI / 2; g.add(c);
      for (const dx of [-0.0095, 0.0095]) { const hl = mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.003, 10), M.black, cx + dx, 0, 0.0128, false); hl.rotation.x = Math.PI / 2; g.add(hl); }
      if (m === 'su') g.add(box(cx - 0.006, cx + 0.006, -0.032, -0.028, 0.011, 0.0135, M.black, false));
    } else if (m === 'lan' || m === 'tv') { g.add(box(cx - 0.024, cx + 0.024, -0.024, 0.024, 0.011, 0.014, M.plateIn, false)); g.add(box(cx - 0.008, cx + 0.008, -0.006, 0.008, 0.0135, 0.0145, M.black, false)); }
    else if (m.startsWith('sw')) { const k = +m.slice(2) || 1, kw = 0.066 / k; for (let j = 0; j < k; j++) g.add(box(cx - 0.033 + j * kw + 0.0015, cx - 0.033 + (j + 1) * kw - 0.0015, -0.034, 0.034, 0.011, 0.018, M.plateIn, false)); }
  });
  if (e.kind === 'ac') { const u = box(-0.40, 0.40, 0.10, 0.38, 0, 0.21, M.acGhost, false); u.userData.acGhost = true; u.visible = false; u.position.x = -0.48; g.add(u); }
  return g;
}
function shadeMat(e) { return { opal: M.opal, clear: M.clearGlass, smoke: M.smoke, fabric: M.shadeFab }[e.shade] || M.opal; }
function lightGroup(e) {
  const g = new THREE.Group(), F = metal(e.frame), SH = shadeMat(e);
  if (e.mount === 'wall') {
    g.add(cyl(0.05, 0.05, 0.015, F, 0, 0, 0.0075)); g.children[0].rotation.x = Math.PI / 2;
    if (e.variant === 'sphere') { g.add(rod(V3(0, 0, 0.01), V3(0, 0.02, 0.11), 0.008, F)); g.add(mesh(new THREE.SphereGeometry(0.075, 24, 16), e.shade === 'clear' || e.shade === 'smoke' ? SH : M.opal, 0, 0.03, 0.17, false)); if (e.shade === 'clear' || e.shade === 'smoke') g.add(mesh(new THREE.SphereGeometry(0.025, 12, 8), M.bulb, 0, 0.03, 0.17, false)); g.add(eveLight(0xFFC487, 0.9, 4, 0, 0.03, 0.17)); }
    else if (e.variant === 'cone') { g.add(rod(V3(0, 0, 0.01), V3(0, 0.06, 0.16), 0.007, F)); const c = mesh(new THREE.CylinderGeometry(0.035, 0.09, 0.14, 28, 1, true), e.shade === 'fabric' ? M.shadeFab : F, 0, 0.0, 0.18, false); c.material.side = THREE.DoubleSide; g.add(c); g.add(mesh(new THREE.SphereGeometry(0.025, 12, 8), M.bulb, 0, 0.0, 0.18, false)); g.add(eveLight(0xFFC487, 0.8, 4, 0, -0.06, 0.18)); }
    else { g.add(box(-0.05, 0.05, -0.12, 0.12, 0.01, 0.09, F)); g.add(box(-0.04, 0.04, 0.11, 0.125, 0.02, 0.08, M.opal, false), box(-0.04, 0.04, -0.125, -0.11, 0.02, 0.08, M.opal, false)); g.add(eveLight(0xFFC487, 0.6, 3, 0, 0.25, 0.1), eveLight(0xFFC487, 0.6, 3, 0, -0.25, 0.1)); }
    return g;
  }
  const v = e.variant;
  if (v === 'spot') { g.add(cyl(0.045, 0.045, 0.006, F, 0, -0.003, 0, 24)); g.add(cyl(0.032, 0.032, 0.004, M.opal, 0, -0.007, 0, 24)); g.add(eveLight(0xFFD2A0, 1.6, 5, 0, -0.1, 0)); return g; }
  g.add(cyl(0.075, 0.075, 0.025, F, 0, -0.0125, 0, 32));
  if (v === 'ring') {
    const ra = 0.30, rb = 0.19, y1 = -0.44, y2 = -0.55;
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.4; g.add(rod(V3(Math.cos(a) * 0.04, -0.025, Math.sin(a) * 0.04), V3(Math.cos(a) * ra, y1, Math.sin(a) * ra), 0.0018, M.black, 4)); g.add(rod(V3(Math.cos(a + 1) * ra, y1, Math.sin(a + 1) * ra), V3(Math.cos(a + 1) * rb, y2, Math.sin(a + 1) * rb), 0.0016, M.black, 4)); }
    for (const [r, y] of [[ra, y1], [rb, y2]]) { const ring = mesh(new THREE.TorusGeometry(r, 0.013, 12, 96), F, 0, y, 0, false); ring.rotation.x = Math.PI / 2; g.add(ring); const led = mesh(new THREE.TorusGeometry(r, 0.0085, 8, 96), M.ledRing, 0, y - 0.009, 0, false); led.rotation.x = Math.PI / 2; g.add(led); }
    g.add(eveLight(0xFFC98E, 7.5, 0, 0, -0.61, 0));
  } else if (v === 'globes') {
    g.add(rod(V3(0, -0.02, 0), V3(0, -0.42, 0), 0.008, F)); g.add(mesh(new THREE.SphereGeometry(0.03, 16, 12), F, 0, -0.45, 0));
    const dirs = [[1, 0.2, 0], [-1, 0.25, 0.1], [0.3, -0.5, 1], [-0.4, -0.4, -1], [0.6, 0.6, -0.8], [-0.6, 0.5, 0.9], [0, -1, 0.2], [0.9, -0.3, -0.4]];
    for (const [dx, dy, dz] of dirs) { const dv = V3(dx, dy, dz).normalize(), end = V3(0, -0.45, 0).addScaledVector(dv, 0.24); g.add(rod(V3(0, -0.45, 0), end, 0.006, F)); const b = mesh(new THREE.SphereGeometry(0.065, 22, 16), SH, end.x, end.y, end.z, false); g.add(b); if (e.shade !== 'opal' && e.shade !== 'fabric') g.add(mesh(new THREE.SphereGeometry(0.02, 10, 8), M.bulb, end.x, end.y, end.z, false)); }
    g.add(eveLight(0xFFC98E, 7, 0, 0, -0.5, 0));
  } else if (v === 'cones' || v === 'tulips') {
    g.add(rod(V3(0, -0.02, 0), V3(0, -0.32, 0), 0.009, F)); g.add(mesh(new THREE.SphereGeometry(0.04, 16, 12), F, 0, -0.34, 0));
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n, ex = Math.cos(a) * 0.32, ez = Math.sin(a) * 0.32;
      g.add(rod(V3(0, -0.34, 0), V3(ex * 0.6, -0.38, ez * 0.6), 0.007, F), rod(V3(ex * 0.6, -0.38, ez * 0.6), V3(ex, -0.33, ez), 0.007, F));
      if (v === 'cones') { const c = mesh(new THREE.CylinderGeometry(0.03, 0.085, 0.13, 26, 1, true), e.shade === 'fabric' ? M.shadeFab : SH, ex, -0.39, ez, false); g.add(c); g.add(mesh(new THREE.SphereGeometry(0.022, 10, 8), M.bulb, ex, -0.40, ez, false)); }
      else { const t = lathe([[0.02, 0], [0.05, 0.03], [0.075, 0.09], [0.07, 0.13], [0.06, 0.135]], SH, ex, -0.33, ez, 24); t.castShadow = false; t.material.side = THREE.DoubleSide; g.add(t); g.add(mesh(new THREE.SphereGeometry(0.022, 10, 8), M.bulb, ex, -0.28, ez, false)); }
    }
    g.add(eveLight(0xFFC98E, 7, 0, 0, -0.4, 0));
  } else if (v === 'drum') {
    g.add(rod(V3(0, -0.02, 0), V3(0, -0.55, 0), 0.004, M.black)); const sm = e.shade === 'opal' || e.shade === 'fabric' ? M.shadeFab : SH;
    g.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.24, 48, 1, true), sm, 0, -0.67, 0, false)); g.add(mesh(new THREE.SphereGeometry(0.03, 12, 8), M.bulb, 0, -0.67, 0, false));
    g.add(eveLight(0xFFC98E, 5, 0, 0, -0.7, 0));
  } else { // pendant
    g.add(rod(V3(0, -0.02, 0), V3(0, -0.75, 0), 0.004, M.black));
    const dome = mesh(new THREE.SphereGeometry(0.17, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), F, 0, -0.92, 0, false); dome.material = F; dome.scale.y = 0.8; g.add(dome);
    const inner = mesh(new THREE.CircleGeometry(0.165, 32), SH === M.smoke ? M.smoke : M.opal, 0, -0.925, 0, false); inner.rotation.x = Math.PI / 2; g.add(inner);
    g.add(eveLight(0xFFC98E, 3.5, 0, 0, -1.0, 0));
  }
  return g;
}
