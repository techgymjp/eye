/*
 * 奥行きマップ（デプスマップ）定義
 * 白(1.0)ほど手前、黒(0.0)ほど奥。
 */
(function (global) {
  'use strict';

  const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic","Meiryo",sans-serif';

  function path(ctx, fn) { ctx.beginPath(); fn(); ctx.closePath(); ctx.fill(); }

  function starPath(ctx, cx, cy, R, r, n) {
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? r : R;
      const a = -Math.PI / 2 + i * Math.PI / n;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
  }

  function text(str, scale) {
    return (ctx, w, h) => {
      const s = Math.min(w, h * 1.2) * (scale || 0.8);
      ctx.font = `900 ${s}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, w / 2, h / 2 + s * 0.04);
    };
  }

  // 平面シェイプ（クイズにも使う）
  const SHAPES = [
    { id: 'heart', name: 'ハート', en: 'Heart', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2 - s * 0.15;
      path(ctx, () => {
        ctx.moveTo(cx, cy + s * 0.95);
        ctx.bezierCurveTo(cx - s * 1.5, cy + s * 0.05, cx - s * 0.75, cy - s * 0.95, cx, cy - s * 0.35);
        ctx.bezierCurveTo(cx + s * 0.75, cy - s * 0.95, cx + s * 1.5, cy + s * 0.05, cx, cy + s * 0.95);
      });
    } },
    { id: 'star', name: '星', en: 'Star', cat: 'shape', draw(ctx, w, h) {
      const R = Math.min(w, h) * 0.44;
      path(ctx, () => starPath(ctx, w / 2, h / 2 + R * 0.08, R, R * 0.42, 5));
    } },
    { id: 'circle', name: '丸', en: 'Circle', cat: 'shape', draw(ctx, w, h) {
      path(ctx, () => ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.36, 0, Math.PI * 2));
    } },
    { id: 'triangle', name: '三角', en: 'Triangle', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2 + s * 0.12;
      path(ctx, () => {
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s * 0.95, cy + s * 0.7);
        ctx.lineTo(cx - s * 0.95, cy + s * 0.7);
      });
    } },
    { id: 'square', name: '四角', en: 'Square', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.62;
      ctx.fillRect(w / 2 - s / 2, h / 2 - s / 2, s, s);
    } },
    { id: 'diamond', name: 'ひし形', en: 'Diamond', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.44, cx = w / 2, cy = h / 2;
      path(ctx, () => {
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.75, cy);
        ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s * 0.75, cy);
      });
    } },
    { id: 'moon', name: '三日月', en: 'Crescent', cat: 'shape', draw(ctx, w, h) {
      const r = Math.min(w, h) * 0.38, cx = w / 2, cy = h / 2;
      path(ctx, () => ctx.arc(cx, cy, r, 0, Math.PI * 2));
      ctx.fillStyle = '#000';
      path(ctx, () => ctx.arc(cx + r * 0.45, cy - r * 0.2, r * 0.85, 0, Math.PI * 2));
      ctx.fillStyle = '#fff';
    } },
    { id: 'plus', name: '十字', en: 'Cross', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.7, t = s * 0.3;
      ctx.fillRect(w / 2 - s / 2, h / 2 - t / 2, s, t);
      ctx.fillRect(w / 2 - t / 2, h / 2 - s / 2, t, s);
    } },
    { id: 'arrow', name: '矢印', en: 'Arrow', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2;
      path(ctx, () => {
        ctx.moveTo(cx + s * 1.2, cy);
        ctx.lineTo(cx + s * 0.2, cy - s * 0.85);
        ctx.lineTo(cx + s * 0.2, cy - s * 0.35);
        ctx.lineTo(cx - s * 1.1, cy - s * 0.35);
        ctx.lineTo(cx - s * 1.1, cy + s * 0.35);
        ctx.lineTo(cx + s * 0.2, cy + s * 0.35);
        ctx.lineTo(cx + s * 0.2, cy + s * 0.85);
      });
    } },
    { id: 'ring', name: 'ドーナツ', en: 'Donut', cat: 'shape', draw(ctx, w, h) {
      const r = Math.min(w, h) * 0.38;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.arc(w / 2, h / 2, r * 0.5, 0, Math.PI * 2, true);
      ctx.fill();
    } },
    { id: 'house', name: '家', en: 'House', cat: 'shape', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2 + s * 0.15;
      path(ctx, () => {
        ctx.moveTo(cx, cy - s * 1.05);
        ctx.lineTo(cx + s * 1.0, cy - s * 0.15);
        ctx.lineTo(cx + s * 0.7, cy - s * 0.15);
        ctx.lineTo(cx + s * 0.7, cy + s * 0.8);
        ctx.lineTo(cx - s * 0.7, cy + s * 0.8);
        ctx.lineTo(cx - s * 0.7, cy - s * 0.15);
        ctx.lineTo(cx - s * 1.0, cy - s * 0.15);
      });
    } },
    { id: 'clover', name: 'クローバー', en: 'Clover', cat: 'shape', draw(ctx, w, h) {
      const r = Math.min(w, h) * 0.16, cx = w / 2, cy = h / 2 - r * 0.2;
      for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0]]) {
        path(ctx, () => ctx.arc(cx + dx * r * 1.05, cy + dy * r * 1.05, r, 0, Math.PI * 2));
      }
      ctx.fillRect(cx - r * 0.18, cy, r * 0.36, r * 2.3);
    } }
  ];

  const DIGITS = '123456789'.split('').map(d => ({ id: 'n' + d, name: d, cat: 'number', draw: text(d, 0.85) }));
  const ALPHA = 'ABCDEFGHJKLMNPRSTUVWXYZ'.split('').map(a => ({ id: 'e' + a, name: a, cat: 'alpha', draw: text(a, 0.85) }));
  const KANA = 'あいうえおかきくけこさしすせそたなはまやらわ'.split('').map(k => ({ id: 'k' + k, name: k, cat: 'kana', draw: text(k, 0.75) }));
  const KANJI = '山川木日月火水金土田空花'.split('').map(k => ({ id: 'j' + k, name: k, cat: 'kanji', draw: text(k, 0.75) }));

  // 立体（グラデーション）シェイプ：ギャラリー専用
  const SOLIDS = [
    { id: 'sphere', name: '球', en: 'Sphere', cat: 'solid', fn(x, y) {
      const d = x * x + y * y;
      return d < 0.36 ? Math.sqrt(0.36 - d) / 0.6 : 0;
    } },
    { id: 'pyramid', name: 'ピラミッド', en: 'Pyramid', cat: 'solid', fn(x, y) {
      const d = Math.max(Math.abs(x), Math.abs(y));
      return d < 0.6 ? 1 - d / 0.6 : 0;
    } },
    { id: 'cone', name: '円すい', en: 'Cone', cat: 'solid', fn(x, y) {
      const d = Math.sqrt(x * x + y * y);
      return d < 0.6 ? 1 - d / 0.6 : 0;
    } },
    { id: 'ripple', name: '波紋', en: 'Ripples', cat: 'solid', fn(x, y) {
      const d = Math.sqrt(x * x + y * y);
      return (0.5 + 0.5 * Math.cos(d * 22)) * Math.max(0, 1 - d * 0.9);
    } },
    { id: 'waves', name: '波', en: 'Waves', cat: 'solid', fn(x, y) {
      return 0.5 + 0.5 * Math.sin(x * 9) * Math.cos(y * 6);
    } },
    { id: 'stairs', name: '階段', en: 'Stairs', cat: 'solid', fn(x) {
      return Math.max(0, Math.min(1, Math.floor((x + 0.8) * 3.2) / 5));
    } },
    { id: 'target', name: 'ターゲット', en: 'Target', cat: 'solid', fn(x, y) {
      const d = Math.sqrt(x * x + y * y);
      if (d > 0.65) return 0;
      return 1 - Math.floor(d / 0.13) * 0.2;
    } },
    { id: 'tunnel', name: 'トンネル', en: 'Tunnel', cat: 'solid', fn(x, y) {
      const d = Math.sqrt(x * x + y * y);
      return Math.min(1, d * 1.1);
    } }
  ];

  // ---- 3Dアート（複数の物体・多層の奥行きを持つシーン） ----
  function gray(v) { const c = Math.round(v * 255); return `rgb(${c},${c},${c})`; }
  function seeded(seed) { return global.Stereo ? global.Stereo.mulberry32(seed) : Math.random; }
  function heartAt(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.95);
    ctx.bezierCurveTo(cx - s * 1.5, cy + s * 0.05, cx - s * 0.75, cy - s * 0.95, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.75, cy - s * 0.95, cx + s * 1.5, cy + s * 0.05, cx, cy + s * 0.95);
    ctx.fill();
  }
  function domeAt(ctx, cx, cy, r, top) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, gray(top));
    g.addColorStop(0.6, gray(top * 0.85));
    g.addColorStop(1, gray(top * 0.45));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  const ART = [
    { id: 'a-hearts', name: '浮かぶハート', en: 'Floating Hearts', cat: 'art', draw(ctx, w, h) {
      const rnd = seeded(7);
      const list = [];
      for (let i = 0; i < 9; i++) list.push({ x: rnd() * w, y: rnd() * h, s: Math.min(w, h) * (0.07 + rnd() * 0.1), d: 0.3 + rnd() * 0.7 });
      list.sort((a, b) => a.d - b.d).forEach(o => { ctx.fillStyle = gray(o.d); heartAt(ctx, o.x, o.y, o.s); });
    } },
    { id: 'a-stars', name: '星空', en: 'Starry Sky', cat: 'art', draw(ctx, w, h) {
      const rnd = seeded(11);
      const list = [];
      for (let i = 0; i < 16; i++) list.push({ x: rnd() * w, y: rnd() * h, R: Math.min(w, h) * (0.04 + rnd() * 0.09), d: 0.2 + rnd() * 0.8 });
      list.sort((a, b) => a.d - b.d).forEach(o => {
        ctx.fillStyle = gray(o.d);
        ctx.beginPath(); starPath(ctx, o.x, o.y, o.R, o.R * 0.42, 5); ctx.closePath(); ctx.fill();
      });
    } },
    { id: 'a-bubbles', name: 'シャボン玉', en: 'Soap Bubbles', cat: 'art', draw(ctx, w, h) {
      const rnd = seeded(23);
      const list = [];
      for (let i = 0; i < 14; i++) list.push({ x: rnd() * w, y: rnd() * h, r: Math.min(w, h) * (0.05 + rnd() * 0.12), d: 0.35 + rnd() * 0.65 });
      list.sort((a, b) => a.d - b.d).forEach(o => domeAt(ctx, o.x, o.y, o.r, o.d));
    } },
    { id: 'a-cube', name: '立方体', en: 'Cube', cat: 'art', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2;
      const c30 = Math.cos(Math.PI / 6) * s, s30 = s / 2;
      const top = [[cx, cy - s], [cx + c30, cy - s + s30], [cx, cy], [cx - c30, cy - s + s30]];
      const left = [[cx - c30, cy - s + s30], [cx, cy], [cx, cy + s], [cx - c30, cy + s30]];
      const right = [[cx + c30, cy - s + s30], [cx, cy], [cx, cy + s], [cx + c30, cy + s30]];
      // 中央の稜線が最も手前になるようグラデーション
      for (const [poly, dir] of [[left, -1], [right, 1], [top, 0]]) {
        const g = dir === 0
          ? ctx.createLinearGradient(cx, cy - s, cx, cy)
          : ctx.createLinearGradient(cx + dir * c30, 0, cx, 0);
        g.addColorStop(0, gray(0.45));
        g.addColorStop(1, gray(1));
        ctx.fillStyle = g;
        ctx.beginPath(); poly.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
      }
    } },
    { id: 'a-spiral', name: 'らせん階段', en: 'Spiral Staircase', cat: 'art', fn(x, y) {
      const d = Math.sqrt(x * x + y * y);
      if (d > 0.62 || d < 0.12) return 0;
      let a = (Math.atan2(y, x) + Math.PI) / (Math.PI * 2);
      return 0.25 + 0.75 * (Math.floor(a * 12) / 12);
    } },
    { id: 'a-torus', name: 'トーラス', en: 'Torus', cat: 'art', fn(x, y) {
      const d = Math.sqrt(x * x + y * y), R = 0.38, r = 0.18;
      const q = r * r - (d - R) * (d - R);
      return q > 0 ? Math.sqrt(q) / r : 0;
    } },
    { id: 'a-mountains', name: '山並み', en: 'Mountains', cat: 'art', fn(x, y) {
      let v = 0;
      const layers = [
        { base: 0.42, amp: 0.12, f: 3.1, ph: 0.3, d: 0.25 },
        { base: 0.22, amp: 0.12, f: 4.7, ph: 1.7, d: 0.5 },
        { base: 0.02, amp: 0.1, f: 6.3, ph: 2.9, d: 0.75 },
        { base: -0.2, amp: 0.06, f: 9.0, ph: 0.9, d: 1.0 }
      ];
      for (const L of layers) {
        const ridge = -L.base + L.amp * Math.sin(x * L.f + L.ph) + 0.08 * Math.abs(Math.sin(x * L.f * 2.3));
        if (y > ridge) v = L.d;
      }
      return v;
    } },
    { id: 'a-flower', name: '花', en: 'Flower', cat: 'art', fn(x, y) {
      const d = Math.sqrt(x * x + y * y), a = Math.atan2(y, x);
      if (d < 0.1) return 1;
      const petal = 0.5 * (0.55 + 0.45 * Math.abs(Math.cos(a * 4)));
      if (d < petal) return 0.95 - 0.5 * (d / petal);
      return 0;
    } },
    { id: 'a-checker', name: 'チェッカー', en: 'Checkerboard', cat: 'art', fn(x, y) {
      if (Math.abs(x) > 0.75 || Math.abs(y) > 0.55) return 0;
      const c = (Math.floor((x + 1) * 5) + Math.floor((y + 1) * 5)) % 2;
      return c ? 0.9 : 0.35;
    } },
    { id: 'a-fish', name: '魚の群れ', en: 'School of Fish', cat: 'art', draw(ctx, w, h) {
      const rnd = seeded(5);
      const list = [];
      for (let i = 0; i < 8; i++) list.push({ x: rnd() * w, y: rnd() * h, s: Math.min(w, h) * (0.06 + rnd() * 0.07), d: 0.3 + rnd() * 0.7 });
      list.sort((a, b) => a.d - b.d).forEach(o => {
        ctx.fillStyle = gray(o.d);
        ctx.beginPath(); ctx.ellipse(o.x, o.y, o.s * 1.4, o.s * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(o.x - o.s * 1.1, o.y);
        ctx.lineTo(o.x - o.s * 2.1, o.y - o.s * 0.7);
        ctx.lineTo(o.x - o.s * 2.1, o.y + o.s * 0.7);
        ctx.closePath(); ctx.fill();
      });
    } },
    { id: 'a-butterfly', name: '蝶', en: 'Butterfly', cat: 'art', draw(ctx, w, h) {
      const s = Math.min(w, h) * 0.22, cx = w / 2, cy = h / 2;
      ctx.fillStyle = gray(0.6);
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(cx + sx * s * 0.85, cy - s * 0.45, s * 0.85, s * 0.65, sx * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + sx * s * 0.6, cy + s * 0.6, s * 0.55, s * 0.45, -sx * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = gray(1);
      ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.14, s * 1.05, 0, 0, Math.PI * 2); ctx.fill();
    } },
    { id: 'a-planet', name: '土星', en: 'Saturn', cat: 'art', draw(ctx, w, h) {
      const r = Math.min(w, h) * 0.24, cx = w / 2, cy = h / 2;
      // 奥側のリング
      ctx.fillStyle = gray(0.35);
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 2, r * 0.55, -0.25, Math.PI, Math.PI * 2); ctx.ellipse(cx, cy, r * 1.45, r * 0.35, -0.25, Math.PI * 2, Math.PI, true); ctx.fill();
      domeAt(ctx, cx, cy, r, 0.8);
      // 手前側のリング
      ctx.fillStyle = gray(1);
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 2, r * 0.55, -0.25, 0, Math.PI); ctx.ellipse(cx, cy, r * 1.45, r * 0.35, -0.25, Math.PI, 0, true); ctx.fill();
    } },
    { id: 'a-3d', name: '「3D」文字', en: '“3D” Letters', cat: 'art', draw(ctx, w, h) {
      const s = Math.min(w * 0.55, h * 0.85);
      ctx.font = `900 ${s}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = gray(0.55); ctx.fillText('3', w / 2 - s * 0.32, h / 2);
      ctx.fillStyle = gray(1); ctx.fillText('D', w / 2 + s * 0.32, h / 2);
    } },
    { id: 'a-pillars', name: '柱の森', en: 'Forest of Pillars', cat: 'art', draw(ctx, w, h) {
      const rnd = seeded(31);
      const n = 7;
      for (let i = 0; i < n; i++) {
        const d = 0.25 + rnd() * 0.75, x = (i + 0.5) / n * w, cw = w / n * 0.55;
        const g = ctx.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0);
        g.addColorStop(0, gray(d * 0.6)); g.addColorStop(0.5, gray(d)); g.addColorStop(1, gray(d * 0.6));
        ctx.fillStyle = g;
        ctx.fillRect(x - cw / 2, h * 0.1, cw, h * 0.8);
      }
    } },
    { id: 'a-tilt', name: '傾いた床と玉', en: 'Ball on a Slope', cat: 'art', fn(x, y) {
      const floor = Math.max(0, Math.min(1, 0.15 + (y + 0.6) * 0.55));
      const bx = x - 0.05, by = y + 0.05, q = 0.07 - bx * bx - by * by;
      const ball = q > 0 ? Math.min(1, floor + 0.35 + Math.sqrt(q) * 1.5) : 0;
      return Math.max(floor, ball);
    } },
    { id: 'a-steps', name: 'ピラミッド階段', en: 'Stepped Pyramid', cat: 'art', fn(x, y) {
      const d = Math.max(Math.abs(x) * 0.85, Math.abs(y));
      if (d > 0.6) return 0;
      return 1 - Math.floor(d / 0.12) * 0.18;
    } },
    { id: 'a-egg', name: 'たまごパック', en: 'Egg Carton', cat: 'art', fn(x, y) {
      if (Math.abs(x) > 0.8 || Math.abs(y) > 0.55) return 0;
      const fx = (x * 4.4) % 1, fy = (y * 4.4) % 1;
      const dx = (fx < 0 ? fx + 1 : fx) - 0.5, dy = (fy < 0 ? fy + 1 : fy) - 0.5;
      const q = 0.18 - dx * dx - dy * dy;
      return 0.3 + (q > 0 ? Math.sqrt(q) * 1.6 : 0);
    } },
    { id: 'a-saddle', name: '鞍型曲面', en: 'Saddle Surface', cat: 'art', fn(x, y) {
      if (x * x + y * y > 0.45) return 0;
      return 0.55 + (x * x - y * y) * 1.4;
    } }
  ];

  const CATEGORIES = [
    { id: 'art', name: '3Dアート', en: '3D Art', items: ART },
    { id: 'solid', name: '立体', en: 'Solids', items: SOLIDS },
    { id: 'shape', name: '図形', en: 'Shapes', items: SHAPES },
    { id: 'number', name: '数字', en: 'Numbers', items: DIGITS },
    { id: 'alpha', name: 'アルファベット', en: 'Letters', items: ALPHA },
    { id: 'kana', name: 'ひらがな', en: 'Hiragana', items: KANA },
    { id: 'kanji', name: '漢字', en: 'Kanji', items: KANJI }
  ];

  const ALL = [].concat(ART, SOLIDS, SHAPES, DIGITS, ALPHA, KANA, KANJI);
  const byId = {};
  ALL.forEach(s => { byId[s.id] = s; });

  function boxBlur(src, w, h, r) {
    if (r < 1) return src;
    const tmp = new Float32Array(w * h);
    const k = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += src[o + Math.min(w - 1, Math.max(0, i))];
      for (let x = 0; x < w; x++) {
        tmp[o + x] = acc / k;
        acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
      }
    }
    const dst = new Float32Array(w * h);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = acc / k;
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return dst;
  }

  /**
   * 奥行きマップを生成。
   * opts.region: 図形を描く領域の幅割合（中央寄せ）
   */
  function build(shape, w, h, opts) {
    opts = opts || {};
    const depth = new Float32Array(w * h);
    if (shape.fn) {
      const s = Math.min(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = (x - w / 2) / s * 1.2, ny = (y - h / 2) / s * 1.2;
          depth[y * w + x] = Math.max(0, Math.min(1, shape.fn(nx, ny)));
        }
      }
      return boxBlur(depth, w, h, 1);
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    // 図形は左右の周期分の余白を確保するため、中央の領域に描く
    const rw = Math.round(w * (opts.region || 0.7));
    ctx.save();
    ctx.translate((w - rw) / 2, 0);
    shape.draw(ctx, rw, h);
    ctx.restore();
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < w * h; i++) depth[i] = data[i * 4] / 255;
    return boxBlur(depth, w, h, Math.max(1, Math.round(Math.min(w, h) / 160)));
  }

  /** 奥行きマップをプレビュー用キャンバスに描く */
  function preview(canvas, depth, w, h) {
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = Math.round(depth[i] * 255);
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  global.DepthMaps = { CATEGORIES, ALL, byId, build, preview, boxBlur };
})(window);
