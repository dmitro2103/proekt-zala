/* ============ 2. textures & materials ============ */
let THREE_OK = !!(window.THREE && THREE.OrbitControls && THREE.RoundedBoxGeometry);
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let MAXANI = 4;
function ctex(c, srgb = true, rep = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = MAXANI; return t; }
const TEXC = new Map();
function cached(key, fn) { if (!TEXC.has(key)) TEXC.set(key, fn()); return TEXC.get(key); }
const rgbStr = (c, a = 1) => { const n = toInt(c); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
function noiseImg(g, w, h, amp, seed) { const img = g.getImageData(0, 0, w, h), d = img.data, R = rng(seed); for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(img, 0, 0); }
function wrapDraw(N, x, y, pad, fn) { for (const ox of [0, x < pad ? N : x > N - pad ? -N : 0]) for (const oy of [0, y < pad ? N : y > N - pad ? -N : 0]) fn(x + ox, y + oy); }

/* --- walls --- */
function liquidHeight() {
  const N = 1024, c = cv(N, N), g = c.getContext('2d'), Rn = rng(7);
  g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 70; i++) { const x = Rn() * N, y = Rn() * N, r = 60 + Rn() * 170, v = Rn() < .5 ? 255 : 0, a = 0.04 + Rn() * 0.06; for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); } }
  g.lineCap = 'round';
  for (let i = 0; i < 16000; i++) {
    const x = Rn() * N, y = Rn() * N, len = 4 + Rn() * 20, a = Rn() * Math.PI * 2, bend = (Rn() - .5) * 0.9, v = Rn() < 0.55 ? 165 + Rn() * 80 : 45 + Rn() * 55;
    g.strokeStyle = `rgba(${v | 0},${v | 0},${v | 0},${0.16 + Rn() * 0.3})`; g.lineWidth = 0.6 + Rn() * 1.5;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, qx = (x + x2) / 2 + Math.cos(a + 1.57) * len * bend, qy = (y + y2) / 2 + Math.sin(a + 1.57) * len * bend;
    wrapDraw(N, x, y, 30, (X, Y) => { g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(qx + X - x, qy + Y - y, x2 + X - x, y2 + Y - y); g.stroke(); });
  }
  for (let i = 0; i < 32000; i++) { const v = Rn() < .5 ? 200 + Rn() * 55 : 40 + Rn() * 60; g.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},${0.2 + Rn() * 0.3})`; const sz = 0.6 + Rn() * 1.4; g.fillRect(Rn() * N, Rn() * N, sz, sz); }
  return c;
}
function grayToColor(hc, base, amp, sparkles) {
  const N = hc.width, M = hc.height, c = cv(N, M), g = c.getContext('2d'), src = hc.getContext('2d').getImageData(0, 0, N, M).data, img = g.createImageData(N, M), d = img.data, Rn = rng(11);
  for (let i = 0; i < d.length; i += 4) { const v = base + (src[i] / 255 - 0.5) * amp; d[i] = v; d[i + 1] = v - 1; d[i + 2] = v - 2; d[i + 3] = 255; }
  for (let k = 0; k < sparkles; k++) { const x = (Rn() * N) | 0, y = (Rn() * M) | 0, i = (y * N + x) * 4; d[i] = 255; d[i + 1] = 253; d[i + 2] = 246; }
  g.putImageData(img, 0, 0); return c;
}
function paintHeight() { const N = 512, c = cv(N, N), g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N); noiseImg(g, N, N, 40, 5); return c; }
function paperHeight() {
  const N = 1024, c = cv(N, N), g = c.getContext('2d'), Rn = rng(19);
  g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 9000; i++) { const x = Rn() * N, y = Rn() * N, len = 3 + Rn() * 9, a = Rn() * Math.PI; g.strokeStyle = `rgba(${Rn() < .5 ? 200 : 60},${Rn() < .5 ? 200 : 60},${Rn() < .5 ? 200 : 60},0.12)`; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); }
  noiseImg(g, N, N, 24, 23);
  g.fillStyle = 'rgba(40,40,40,0.55)'; g.fillRect(0, 0, 1.4, N); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(1.4, 0, 1.2, N);
  return c;
}
function damask(g, cx, cy, s, ink, base) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  for (const m of [1, -1]) {
    g.save(); g.scale(m, 1); g.fillStyle = ink;
    g.beginPath(); g.moveTo(0, -112); g.bezierCurveTo(16, -92, 50, -82, 42, -44); g.bezierCurveTo(74, -40, 86, -6, 54, 8); g.bezierCurveTo(82, 34, 56, 74, 22, 58); g.bezierCurveTo(26, 86, 10, 100, 0, 112); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(44, -40); g.quadraticCurveTo(100, -70, 116, -22); g.quadraticCurveTo(86, -30, 54, -10); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(52, 14); g.quadraticCurveTo(108, 20, 106, 66); g.quadraticCurveTo(84, 40, 48, 30); g.closePath(); g.fill();
    g.fillStyle = base;
    g.beginPath(); g.moveTo(0, -72); g.bezierCurveTo(10, -60, 28, -52, 22, -30); g.bezierCurveTo(38, -24, 40, 0, 22, 6); g.bezierCurveTo(36, 28, 20, 44, 0, 36); g.closePath(); g.fill();
    g.fillStyle = ink; g.beginPath(); g.ellipse(0, -18, 7, 16, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(10, 18, 5, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  g.restore();
}
function patternTex(kind, base, ink) {
  const T = { damask: 0.53, stripes: 0.53, geometric: 0.36, botanic: 0.53, dots: 0.26 }[kind] || 0.5;
  const N = 512, c = cv(N, N), g = c.getContext('2d'), h = cv(N, N), hg = h.getContext('2d'), Rn = rng(hashStr(kind));
  g.fillStyle = base; g.fillRect(0, 0, N, N); hg.fillStyle = '#7a7a7a'; hg.fillRect(0, 0, N, N);
  const draw = fn => { fn(g, ink, base); fn(hg, '#c4c4c4', '#7a7a7a'); };
  if (kind === 'damask') draw((ctx, i, b) => { for (const [x, y] of [[N / 2, N / 2], [0, 0], [N, 0], [0, N], [N, N]]) damask(ctx, x, y, 1.05, i, b); for (const [x, y] of [[N / 2, 0], [N / 2, N], [0, N / 2], [N, N / 2]]) { ctx.fillStyle = i; ctx.beginPath(); ctx.ellipse(x, y, 9, 22, 0, 0, Math.PI * 2); ctx.fill(); } });
  else if (kind === 'stripes') draw((ctx, i) => { ctx.fillStyle = i; ctx.globalAlpha = 0.28; ctx.fillRect(0, 0, N * 0.30, N); ctx.globalAlpha = 1; ctx.fillRect(N * 0.30, 0, 5, N); ctx.fillRect(N * 0.62, 0, 3, N); ctx.fillRect(N * 0.66, 0, 3, N); });
  else if (kind === 'geometric') draw((ctx, i) => { ctx.strokeStyle = i; ctx.lineWidth = 5; for (const o of [-N, 0, N]) { ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o + N, N); ctx.moveTo(o + N, 0); ctx.lineTo(o, N); ctx.stroke(); } ctx.lineWidth = 2; for (const o of [-N, 0, N]) { ctx.beginPath(); ctx.moveTo(o + 24, 0); ctx.lineTo(o + N + 24, N); ctx.moveTo(o + N - 24, 0); ctx.lineTo(o - 24, N); ctx.stroke(); } ctx.fillStyle = i; for (const [x, y] of [[0, 0], [N, 0], [0, N], [N, N], [N / 2, N / 2]]) { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); } });
  else if (kind === 'botanic') draw((ctx, i) => {
    const R2 = rng(77); ctx.fillStyle = i; ctx.strokeStyle = i; ctx.lineWidth = 3;
    for (let k = 0; k < 7; k++) {
      const x = R2() * N, y = R2() * N, a = R2() * Math.PI * 2, len = 70 + R2() * 50;
      wrapDraw(N, x, y, 140, (X, Y) => {
        ctx.save(); ctx.translate(X, Y); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.3, -12, len, 0); ctx.stroke();
        for (let j = 1; j <= 5; j++) { const t = j / 6, px = len * t, py = -12 * 4 * t * (1 - t); for (const sd of [1, -1]) { ctx.save(); ctx.translate(px, py); ctx.rotate(sd * 0.9); ctx.beginPath(); ctx.ellipse(13, 0, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
        ctx.beginPath(); ctx.ellipse(len + 12, 0, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }
  });
  else if (kind === 'dots') draw((ctx, i) => { ctx.fillStyle = i; for (const [x, y] of [[0, 0], [N, 0], [0, N], [N, N], [N / 2, N / 2]]) { ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill(); } for (const [x, y] of [[N / 2, 0], [0, N / 2], [N, N / 2], [N / 2, N]]) { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); } });
  noiseImg(g, N, N, 10, 31); noiseImg(hg, N, N, 30, 33);
  return { map: ctex(c), bump: ctex(h, false), tile: T, bumpScale: 0.004, tint: false };
}
function wallTexFor(f) {
  if (f.type === 'liquid') return cached('w:liquid', () => { const hh = liquidHeight(); return { map: ctex(grayToColor(hh, 236, 40, 2200)), bump: ctex(hh, false), tile: 0.6, bumpScale: 0.013, tint: true }; });
  if (f.type === 'paint') return cached('w:paint', () => { const hh = paintHeight(); return { map: ctex(grayToColor(hh, 246, 6, 0)), bump: ctex(hh, false), tile: 0.5, bumpScale: 0.0012, tint: true }; });
  if (f.type === 'plain') return cached('w:plain', () => { const hh = paperHeight(); return { map: ctex(grayToColor(hh, 240, 18, 0)), bump: ctex(hh, false), tile: 1.06, bumpScale: 0.0025, tint: true }; });
  const ink = f.color2 || shade(f.color, -0.16);
  return cached('w:p:' + f.pattern + f.color + ink, () => patternTex(f.pattern, f.color, ink));
}

/* --- floors --- */
const FLOOR_DEF = {
  lino: { kind: 'plank', pw: 0.18, pl: 1.2, pal: [[134, 87, 58], [143, 95, 62], [124, 80, 53], [150, 104, 66], [128, 83, 58], [139, 92, 59], [122, 79, 52], [146, 98, 64]], rough: 0.52, seam: 0.55, plinth: 0x4A3022 },
  oaklight: { kind: 'plank', pw: 0.20, pl: 1.4, pal: [[206, 172, 132], [197, 161, 121], [213, 180, 140], [190, 155, 115], [202, 167, 127], [210, 176, 134]], rough: 0.55, seam: 0.32, plinth: 0xC9A57C },
  oakgrey: { kind: 'plank', pw: 0.20, pl: 1.4, pal: [[161, 151, 139], [151, 141, 129], [169, 159, 147], [143, 134, 123], [156, 147, 136]], rough: 0.6, seam: 0.38, plinth: 0x8F8579 },
  walnut: { kind: 'plank', pw: 0.18, pl: 1.2, pal: [[92, 62, 44], [100, 68, 48], [86, 57, 40], [106, 73, 52], [95, 64, 45]], rough: 0.45, seam: 0.62, plinth: 0x3A281C },
  herring: { kind: 'herring', pal: [[176, 128, 86], [186, 138, 94], [166, 120, 80], [192, 146, 100], [172, 124, 84], [181, 133, 90]], rough: 0.5, plinth: 0x8A6243 },
  tile: { kind: 'tile', size: 0.6, base: [198, 192, 184], rough: 0.32, plinth: 0xBDB7AE },
};
function grain(g, x0, y0, w, h, horizontal, Rn, lines = 30) {
  const ph = Rn() * 10, fr = 0.004 + Rn() * 0.006;
  for (let l = 0; l < lines; l++) {
    const dark = Rn() < 0.7; g.strokeStyle = dark ? `rgba(55,32,18,${0.06 + Rn() * 0.14})` : `rgba(255,228,195,${0.04 + Rn() * 0.07})`; g.lineWidth = 0.6 + Rn() * 1.5;
    const u = (l + Rn() * 0.8) / lines, amp = 1.5 + Rn() * 4; g.beginPath();
    if (horizontal) { for (let x = x0; x <= x0 + w; x += 12) { const y = y0 + u * h + Math.sin((x + ph * 100) * fr + l * 0.4) * amp; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } }
    else { for (let y = y0; y <= y0 + h; y += 12) { const x = x0 + u * w + Math.sin((y + ph * 100) * fr + l * 0.4) * amp; y === y0 ? g.moveTo(x, y) : g.lineTo(x, y); } }
    g.stroke();
  }
}
function plankTex(F) {
  const across = Math.max(6, Math.round(2 / F.pw)), ppm = 480, w = Math.round(across * F.pw * ppm), h = Math.round(2 * F.pl * ppm);
  const c = cv(w, h), g = c.getContext('2d'), Rn = rng(3);
  for (let i = 0; i < across; i++) {
    const x0 = Math.round(i * F.pw * ppm), x1 = Math.round((i + 1) * F.pw * ppm), off = ((i * 0.613) % 1) * F.pl;
    for (let k = -1; k < 2; k++) {
      const ys = (off + k * F.pl) * ppm, ye = ys + F.pl * ppm, col = F.pal[(Rn() * F.pal.length) | 0], j = (Rn() - 0.5) * 10;
      for (const dy of [0, h, -h]) {
        g.save(); g.beginPath(); g.rect(x0, ys + dy, x1 - x0, ye - ys); g.clip();
        g.fillStyle = `rgb(${col[0] + j | 0},${col[1] + j | 0},${col[2] + j | 0})`; g.fillRect(x0, ys + dy, x1 - x0, ye - ys);
        const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(0,0,0,0.05)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.03)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(x0, ys + dy, x1 - x0, ye - ys);
        grain(g, x0, ys + dy, x1 - x0, ye - ys, false, rng(i * 31 + k * 7 + 5), 32);
        g.restore();
        g.fillStyle = `rgba(38,22,12,${F.seam})`; g.fillRect(x0, ys + dy - 1, x1 - x0, 2);
      }
    }
    g.fillStyle = `rgba(38,22,12,${F.seam * 0.9})`; g.fillRect(x0, 0, 1.6, h);
  }
  noiseImg(g, w, h, 7, 9);
  const t = ctex(c); t.userData = { wm: across * F.pw, lm: 2 * F.pl }; return t;
}
function herringTex(F) {
  const L = 0.5, Wd = 0.09, cc = L / Math.SQRT2, p = Wd * Math.SQRT2, rows = 6, ppm = 900;
  const w = Math.round(2 * cc * ppm), h = Math.round(rows * p * ppm), c = cv(w, h), g = c.getContext('2d'), Rn = rng(13), C = cc * ppm, P = p * ppm;
  g.fillStyle = '#6b4a32'; g.fillRect(0, 0, w, h);
  for (let col = 0; col < 2; col++) for (let k = -3; k < rows + 4; k++) {
    const x0 = col * C, x1 = x0 + C, y = k * P, pc = F.pal[(Rn() * F.pal.length) | 0], j = (Rn() - 0.5) * 12;
    const pts = col === 0 ? [[x0, y], [x1, y + C], [x1, y + C - P], [x0, y - P]] : [[x0, y + C], [x1, y], [x1, y - P], [x0, y + C - P]];
    for (const dy of [0, h, -h]) {
      g.save(); g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b + dy) : g.moveTo(a, b + dy)); g.closePath(); g.clip();
      g.fillStyle = `rgb(${pc[0] + j | 0},${pc[1] + j | 0},${pc[2] + j | 0})`; g.fill();
      g.translate(x0, y + dy); g.rotate(col === 0 ? Math.PI / 4 : -Math.PI / 4);
      grain(g, -10, -P * 1.2, C * 1.6, P * 1.6, true, rng(col * 97 + k * 13), 10);
      g.restore();
      g.strokeStyle = 'rgba(40,24,14,0.5)'; g.lineWidth = 1.4; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b + dy) : g.moveTo(a, b + dy)); g.closePath(); g.stroke();
    }
  }
  noiseImg(g, w, h, 7, 15);
  const t = ctex(c); t.userData = { wm: 2 * cc, lm: rows * p }; return t;
}
function tileTex(F) {
  const n = 2, ppm = 700, px = Math.round(n * F.size * ppm), c = cv(px, px), g = c.getContext('2d'), Rn = rng(21), ts = px / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const jj = (Rn() - 0.5) * 10; g.fillStyle = `rgb(${F.base[0] + jj | 0},${F.base[1] + jj | 0},${F.base[2] + jj | 0})`; g.fillRect(i * ts, j * ts, ts, ts);
    for (let k = 0; k < 40; k++) { const x = i * ts + Rn() * ts, y = j * ts + Rn() * ts, r = 20 + Rn() * 80; const gr = g.createRadialGradient(x, y, 0, x, y, r); const v = Rn() < 0.5 ? 255 : 0; gr.addColorStop(0, `rgba(${v},${v},${v},0.05)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  }
  noiseImg(g, px, px, 12, 17);
  g.fillStyle = 'rgba(120,114,106,0.9)'; for (let i = 0; i <= n; i++) { g.fillRect(i * ts - 2, 0, 4, px); g.fillRect(0, i * ts - 2, px, 4); }
  const t = ctex(c); t.userData = { wm: n * F.size, lm: n * F.size }; return t;
}
function floorTexFor(type) { const F = FLOOR_DEF[type] || FLOOR_DEF.lino; return cached('f:' + type, () => F.kind === 'herring' ? herringTex(F) : F.kind === 'tile' ? tileTex(F) : plankTex(F)); }

/* --- misc textures --- */
function fabricBump() { return cached('fabric', () => { const N = 256, c = cv(N, N), g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data, Rn = rng(5); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4, v = 128 + 38 * Math.sin(x * Math.PI / 2) * Math.cos(y * Math.PI / 3) + (Rn() - 0.5) * 50; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } g.putImageData(img, 0, 0); const t = ctex(c, false); t.repeat.set(8, 8); return t; }); }
function woodTex(dark) {
  return cached('wood:' + dark, () => {
    const N = 512, c = cv(N, N), g = c.getContext('2d'), Rn = rng(dark ? 41 : 21);
    g.fillStyle = dark ? 'rgb(110,75,52)' : 'rgb(196,158,116)'; g.fillRect(0, 0, N, N);
    for (let l = 0; l < 90; l++) { const y0 = Rn() * N, amp = 2 + Rn() * 6, fr = 0.006 + Rn() * 0.01, ph = Rn() * 9; g.strokeStyle = Rn() < 0.75 ? `rgba(${dark ? '50,30,18' : '120,80,45'},${0.08 + Rn() * 0.2})` : `rgba(255,236,205,${0.05 + Rn() * 0.07})`; g.lineWidth = 0.6 + Rn() * 1.8; g.beginPath(); for (let x = 0; x <= N; x += 8) { const yy = y0 + Math.sin(x * fr + ph) * amp; x === 0 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
    return ctex(c);
  });
}
function rugTex(color, pattern) {
  return cached('rug:' + color + pattern, () => {
    const w = 512, h = 640, c = cv(w, h), g = c.getContext('2d'), Rn = rng(31), base = (RUGC[color] || RUGC.greige)[1], ink = shade(base, -0.22);
    g.fillStyle = hex(base); g.fillRect(0, 0, w, h);
    g.strokeStyle = rgbStr(ink, 0.45); g.fillStyle = rgbStr(ink, 0.35);
    if (pattern === 'lattice') { g.lineWidth = 2; for (let i = -h; i < w + h; i += 46) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h * 0.6, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h * 0.6, 0); g.stroke(); } }
    if (pattern === 'stripes') for (let x = 30; x < w; x += 60) g.fillRect(x, 0, 18, h);
    if (pattern !== 'plain') { g.strokeStyle = rgbStr(ink, 0.6); g.lineWidth = 10; g.strokeRect(22, 22, w - 44, h - 44); g.lineWidth = 2; g.strokeRect(40, 40, w - 80, h - 80); }
    noiseImg(g, w, h, 26, 41);
    return ctex(c, true, false);
  });
}
function skyTex(night) {
  return cached('sky:' + night, () => {
    const w = 1024, h = 512, c = cv(w, h), g = c.getContext('2d'), Rn = rng(night ? 41 : 43), gr = g.createLinearGradient(0, 0, 0, h);
    if (night) { gr.addColorStop(0, '#060a1a'); gr.addColorStop(0.6, '#16203f'); gr.addColorStop(1, '#2a3459'); } else { gr.addColorStop(0, '#8fb7dc'); gr.addColorStop(0.55, '#d3e4ef'); gr.addColorStop(1, '#f4f6f2'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let layer = 0; layer < 2; layer++) { let x = -20; while (x < w) { const bw = 40 + Rn() * 90, bh = (layer ? 60 : 110) + Rn() * (layer ? 60 : 120), top = h * (layer ? 0.80 : 0.86) - bh; g.fillStyle = night ? (layer ? '#0b1022' : '#121a33') : (layer ? 'rgba(170,186,198,0.55)' : 'rgba(196,208,214,0.6)'); g.fillRect(x, top, bw, h - top); if (night) for (let yy = top + 8; yy < h - 10; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 10) if (Rn() < 0.22) { g.fillStyle = `rgba(255,${200 + Rn() * 40 | 0},${130 + Rn() * 60 | 0},${0.5 + Rn() * 0.5})`; g.fillRect(xx, yy, 4, 5); } x += bw + 4 + Rn() * 16; } }
    return ctex(c, true, false);
  });
}
function tvTex() {
  return cached('tv', () => {
    const w = 640, h = 370, c = cv(w, h), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#f6b26b'); gr.addColorStop(0.45, '#f7d9a6'); gr.addColorStop(0.62, '#a9c3d6'); gr.addColorStop(1, '#2f4b63'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,240,210,0.95)'; g.beginPath(); g.arc(w * 0.62, h * 0.48, 26, 0, Math.PI * 2); g.fill();
    const mount = (base, amp, col, seed) => { const Rn = rng(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, h); let y = base; for (let x = 0; x <= w; x += 16) { y += (Rn() - 0.5) * amp; y = Math.min(Math.max(y, base - 60), base + 40); g.lineTo(x, y); } g.lineTo(w, h); g.fill(); };
    mount(h * 0.56, 26, '#6f7f94', 4); mount(h * 0.63, 20, '#4b5b70', 8); mount(h * 0.72, 14, '#2c3a4c', 12);
    return ctex(c, true, false);
  });
}
function codeTex() {
  return cached('code', () => {
    const w = 512, h = 300, c = cv(w, h), g = c.getContext('2d'), Rn = rng(77);
    g.fillStyle = '#1b1f27'; g.fillRect(0, 0, w, h); g.fillStyle = '#232834'; g.fillRect(0, 0, 90, h); g.fillStyle = '#151820'; g.fillRect(0, 0, w, 18);
    const cols = ['#7fb4ff', '#c792ea', '#f0b37e', '#9ad38a', '#e6e6e6', '#7fdbca'];
    for (let y = 28; y < h - 6; y += 11) { let x = 100 + (Rn() < 0.6 ? 16 * ((Rn() * 3) | 0) : 0); const n = 2 + (Rn() * 5 | 0); for (let k = 0; k < n; k++) { const ww = 14 + Rn() * 60; g.fillStyle = cols[(Rn() * cols.length) | 0]; g.globalAlpha = 0.85; g.fillRect(x, y, ww, 5); x += ww + 7; if (x > w - 20) break; } }
    g.globalAlpha = 1; return ctex(c, true, false);
  });
}
function artTex(kind) {
  return cached('art:' + kind, () => {
    const w = 400, h = 520, c = cv(w, h), g = c.getContext('2d'), Rn = rng(hashStr(kind));
    if (kind === 'landscape') { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e9d8bf'); gr.addColorStop(1, '#c9b79c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#d98f5f'; g.beginPath(); g.arc(w * 0.62, h * 0.36, 42, 0, Math.PI * 2); g.fill(); [['#8c9a86', 0.58], ['#6c7b6a', 0.68], ['#4d5b4f', 0.8]].forEach(([col, b]) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * b - Math.sin(x * 0.02 + b * 9) * 30 - Rn() * 10); g.lineTo(w, h); g.fill(); }); }
    else if (kind === 'lines') { g.fillStyle = '#f3efe8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2b2f33'; g.lineWidth = 3; g.beginPath(); g.moveTo(60, 420); g.bezierCurveTo(120, 120, 240, 520, 330, 140); g.stroke(); g.beginPath(); g.arc(150, 200, 60, 0, Math.PI * 1.6); g.stroke(); g.fillStyle = '#c98e72'; g.beginPath(); g.arc(270, 330, 34, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = '#efe9df'; g.fillRect(0, 0, w, h); const cols = ['#c98e72', '#8c9384', '#d8c3a5', '#435273', '#e3b866']; for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(60 + Rn() * 280, 60 + Rn() * 400, 40 + Rn() * 90, 30 + Rn() * 70, Rn() * 3, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }
    return ctex(c, true, false);
  });
}
function blobTex() { return cached('blob', () => { const c = cv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c, true, false); }); }

/* --- materials --- */
const MATS = [];
let ENV_F = 0.30;
function std(p, env = 1) { const m = new THREE.MeshStandardMaterial(p); m.userData.env = env; m.envMapIntensity = env * ENV_F; MATS.push(m); return m; }
const MC = new Map();
function mat(key, fn) { if (!MC.has(key)) MC.set(key, fn()); return MC.get(key); }
const colMat = (c, rough = 0.7, metal = 0, env = 1) => mat('c:' + c + ':' + rough + ':' + metal, () => std({ color: toInt(c), roughness: rough, metalness: metal }, env));
const fabric = k => mat('fab:' + k, () => std({ color: (FABRIC[k] || FABRIC.greige)[1], roughness: 1, bumpMap: fabricBump(), bumpScale: 0.003 }, 0.8));
const wood = k => (k === 'oak' || k === 'walnut') ? mat('wood:' + k, () => std({ map: woodTex(k === 'walnut'), color: 0xffffff, roughness: 0.55 })) : colMat((WOOD[k] || WOOD.white)[1], k === 'black' || k === 'graphite' ? 0.5 : 0.6);
const panel = k => k === 'oak' ? wood('oak') : colMat((PANEL[k] || PANEL.cream)[1], 0.66);
const metal = (k, set = METAL) => mat('met:' + k, () => std({ color: (set[k] || set[Object.keys(set)[0]])[1], roughness: k === 'black' || k === 'white' ? 0.45 : 0.28, metalness: k === 'black' || k === 'white' ? 0.3 : 1 }, 1.3));
let M = null;
function baseMaterials() {
  M = {
    reveal: std({ color: 0xF3F3F0, roughness: 0.55 }), ceil: std({ color: 0xFBFBFA, roughness: 0.92 }, 0.9),
    cornice: std({ color: 0xF6F6F3, roughness: 0.7 }), pvc: std({ color: 0xF4F5F3, roughness: 0.35 }),
    glass: std({ color: 0xd6e8ef, transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0, depthWrite: false }, 1.2),
    corr: std({ color: 0x8c857c, roughness: 0.9, side: THREE.BackSide }, 0.5), corrFloor: std({ color: 0x4d3a2c, roughness: 0.6 }, 0.5), balc: std({ color: 0xd9d6d0, roughness: 0.9 }),
    whiteMetal: std({ color: 0xF1F1EE, roughness: 0.38, metalness: 0.15 }), blackMetal: std({ color: 0x1f2022, roughness: 0.4, metalness: 0.3 }),
    black: std({ color: 0x17181A, roughness: 0.5 }), graphite: std({ color: 0x2F3236, roughness: 0.8 }),
    mesh: std({ color: 0x26292d, roughness: 0.9, bumpMap: fabricBump(), bumpScale: 0.002 }),
    screenOff: std({ color: 0x050607, roughness: 0.12, metalness: 0.4 }, 1.4), tvOn: new THREE.MeshBasicMaterial({ map: tvTex() }), monitor: new THREE.MeshBasicMaterial({ map: codeTex() }),
    linen: std({ color: 0xF1EFEA, roughness: 0.98 }, 0.8), throwFab: std({ color: 0xB4714F, roughness: 1, bumpMap: fabricBump(), bumpScale: 0.004 }, 0.8),
    oakDark: std({ color: 0x6b4a33, roughness: 0.5 }), mirror: std({ color: 0xdfe5e8, metalness: 1, roughness: 0.03 }, 1.6),
    ledRing: std({ color: 0xffffff, emissive: 0xFFD8A8, emissiveIntensity: 0, roughness: 0.4 }),
    opal: std({ color: 0xf7f5f0, emissive: 0xFFD2A0, emissiveIntensity: 0, roughness: 0.25 }),
    clearGlass: std({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, emissive: 0xFFD2A0, emissiveIntensity: 0, depthWrite: false }, 1.2),
    smoke: std({ color: 0x5a5e63, transparent: true, opacity: 0.55, roughness: 0.08, emissive: 0xFFB070, emissiveIntensity: 0, depthWrite: false }, 1.2),
    bulb: std({ color: 0xfff6e0, emissive: 0xFFD7A0, emissiveIntensity: 0, roughness: 0.3 }),
    shadeFab: std({ color: 0xE9E2D3, roughness: 0.95, side: THREE.DoubleSide, emissive: 0xFFC98C, emissiveIntensity: 0 }),
    ledStrip: new THREE.MeshBasicMaterial({ color: 0xFFD7A3 }),
    ceramic: std({ color: 0xEDE9E2, roughness: 0.35 }), ceramic2: std({ color: 0xC9B7A2, roughness: 0.6 }),
    soil: std({ color: 0x3a2a1f, roughness: 1 }), leaf: std({ color: 0x3E6A3A, roughness: 0.6, side: THREE.DoubleSide }), leaf2: std({ color: 0x5C8A4A, roughness: 0.6, side: THREE.DoubleSide }), stem: std({ color: 0x5b4a33, roughness: 0.8 }),
    tulle: std({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }, 0.8),
    plate: std({ color: 0xF7F7F5, roughness: 0.35 }), plateIn: std({ color: 0xE9E9E6, roughness: 0.45 }), plateHi: std({ color: 0x2A55C9, emissive: 0x2A55C9, emissiveIntensity: 0.9, roughness: 0.4 }),
    acGhost: new THREE.MeshBasicMaterial({ color: 0x2A55C9, transparent: true, opacity: 0.18, depthWrite: false }),
    acUnit: std({ color: 0xF4F4F2, roughness: 0.4 }),
    books: [0xE8E0D2, 0x9AA38E, 0x5E6B78, 0xC28B66, 0x3F4A55, 0xD7CBB8, 0x8E6F57, 0xB9B2A6].map(c => std({ color: c, roughness: 0.85 })),
    basket: std({ color: 0xB89B74, roughness: 0.95, bumpMap: fabricBump(), bumpScale: 0.006 }),
    sky: new THREE.MeshBasicMaterial({ map: skyTex(false), toneMapped: false }),
  };
  M.blob = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.55, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
}
function wallMaterial(f) {
  const t = wallTexFor(f), key = 'wall:' + f.type + ':' + f.pattern + ':' + f.color + ':' + (f.color2 || '');
  return mat(key, () => { for (const x of [t.map, t.bump]) x.repeat.set(1 / t.tile, 1 / t.tile); return std({ color: t.tint ? toInt(f.color) : 0xffffff, map: t.map, bumpMap: t.bump, bumpScale: t.bumpScale, roughness: f.type === 'paint' ? 0.9 : 0.96 }, 0.9); });
}
function floorMaterial(type) { const F = FLOOR_DEF[type] || FLOOR_DEF.lino; return mat('floor:' + type, () => std({ map: floorTexFor(type), color: 0xffffff, roughness: F.rough }, 1.1)); }
