/*
 * ステレオグラム生成エンジン
 * Thimbleby, Inglis & Witten (1994) の SIRDS アルゴリズム（隠面処理付き）をベースに、
 * ランダムドット / テクスチャ両方のパターンに対応。
 */
(function (global) {
  'use strict';

  // 0xAABBGGRR (little-endian) にパック
  function rgba(r, g, b) {
    return (255 << 24 | b << 16 | g << 8 | r) >>> 0;
  }

  // 再現可能な乱数（アニメーション時のちらつき防止）
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  const PATTERNS = {
    jewel: { name: 'カラフル図形', en: 'Colorful Shapes', tiled: true },
    rainbow: { name: 'レインボー糸', en: 'Rainbow Threads', tiled: true },
    scribble: { name: 'パステル落書き', en: 'Pastel Scribbles', tiled: true },
    stained: { name: 'ステンドグラス', en: 'Stained Glass', tiled: true },
    neon: { name: 'ネオン', en: 'Neon', tiled: true },
    candy: { name: 'キャンディ', en: 'Candy', tiled: true },
    flowers: { name: '花畑', en: 'Flower Field', tiled: true },
    marble: { name: 'マーブル', en: 'Marble', tiled: true },
    bw: { name: 'ランダムドット（白黒）', en: 'Random Dots (B&W)', tiled: false },
    color: { name: 'カラードット', en: 'Color Dots', tiled: false },
    pastel: { name: 'パステルドット', en: 'Pastel Dots', tiled: false },
    ocean: { name: 'オーシャン', en: 'Ocean', tiled: false },
    bubbles: { name: 'バブル模様', en: 'Bubbles', tiled: true },
    mosaic: { name: 'モザイク', en: 'Mosaic', tiled: true },
    leaves: { name: 'フォレスト', en: 'Forest', tiled: true }
  };

  /**
   * パターンソースを生成。
   * 返り値 { data: Uint32Array, tw, th } で pattern(x,y) = data[(y%th)*tw + (x%tw)]
   */
  function makePattern(type, w, h, period, seed) {
    const rnd = mulberry32(seed || 12345);
    if (!PATTERNS[type] || !PATTERNS[type].tiled) {
      const data = new Uint32Array(w * h);
      let pal;
      if (type === 'color') {
        pal = [];
        for (let i = 0; i < 24; i++) {
          const c = hsl(i * 15, 85, 30 + (i % 3) * 18);
          pal.push(rgba(c[0], c[1], c[2]));
        }
      } else if (type === 'pastel') {
        pal = [];
        for (let i = 0; i < 18; i++) {
          const c = hsl(i * 20, 70, 72 + (i % 3) * 6);
          pal.push(rgba(c[0], c[1], c[2]));
        }
      } else if (type === 'ocean') {
        pal = [];
        for (let i = 0; i < 16; i++) {
          const c = hsl(180 + i * 4, 70, 20 + i * 4);
          pal.push(rgba(c[0], c[1], c[2]));
        }
      }
      for (let i = 0; i < data.length; i++) {
        if (!pal) {
          data[i] = rnd() < 0.5 ? rgba(20, 20, 24) : rgba(245, 245, 240);
        } else {
          data[i] = pal[(rnd() * pal.length) | 0];
        }
      }
      return { data, tw: w, th: h };
    }

    // タイル型テクスチャ：幅 = 遠景面の周期
    const tw = Math.max(8, period);
    const th = Math.max(64, Math.min(h, 1400)); // 縦方向の繰り返しを避けるため全高で生成

    // ピクセル単位で計算するパターン
    if (type === 'stained') return stainedGlass(tw, th, rnd);
    if (type === 'marble') return marble(tw, th, rnd);

    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    const ctx = c.getContext('2d');
    const draw = (fn) => {
      // 横方向に継ぎ目なく繋げるため3回描画
      for (const dx of [-tw, 0, tw]) for (const dy of [-th, 0, th]) fn(dx, dy);
    };
    if (type === 'bubbles') {
      ctx.fillStyle = '#1c2541'; ctx.fillRect(0, 0, tw, th);
      const n = Math.round(tw * th / 120);
      for (let i = 0; i < n; i++) {
        const x = rnd() * tw, y = rnd() * th, r = 2 + rnd() * tw * 0.12;
        const col = hsl(170 + rnd() * 140, 75, 45 + rnd() * 30);
        const a = 0.5 + rnd() * 0.5;
        draw((dx, dy) => {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
          ctx.fill();
        });
      }
    } else if (type === 'mosaic') {
      const s = Math.max(3, Math.round(tw / 14));
      for (let y = 0; y < th; y += s) {
        for (let x = 0; x < tw; x += s) {
          const col = hsl(rnd() * 360, 60 + rnd() * 30, 35 + rnd() * 40);
          ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          ctx.fillRect(x, y, s, s);
        }
      }
    } else if (type === 'leaves') {
      ctx.fillStyle = '#16301b'; ctx.fillRect(0, 0, tw, th);
      const n = Math.round(tw * th / 80);
      for (let i = 0; i < n; i++) {
        const x = rnd() * tw, y = rnd() * th;
        const rx = 2 + rnd() * tw * 0.09, ry = rx * (0.35 + rnd() * 0.3);
        const rot = rnd() * Math.PI;
        const col = hsl(70 + rnd() * 70, 55 + rnd() * 30, 22 + rnd() * 40);
        draw((dx, dy) => {
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, rx, ry, rot, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          ctx.fill();
        });
      }
    } else if (type === 'jewel') {
      // 参考：鮮やかな図形が重なり合うテクスチャ
      const g = ctx.createLinearGradient(0, 0, 0, th);
      for (let i = 0; i <= 6; i++) {
        const col = hsl((rnd() * 360) | 0, 90, 45);
        g.addColorStop(i / 6, `rgb(${col[0]},${col[1]},${col[2]})`);
      }
      ctx.fillStyle = g; ctx.fillRect(0, 0, tw, th);
      const unit = tw;
      const n = Math.round(tw * th / 260);
      const shapes = ['circle', 'square', 'ring', 'tri', 'diamond', 'blob'];
      for (let i = 0; i < n; i++) {
        const x = rnd() * tw, y = rnd() * th;
        const r = unit * (0.05 + Math.pow(rnd(), 1.6) * 0.2);
        const kind = shapes[(rnd() * shapes.length) | 0];
        const hue = (rnd() * 360) | 0;
        const col = hsl(hue, 85 + rnd() * 15, 40 + rnd() * 25);
        const fillA = 0.55 + rnd() * 0.45;
        const rot = rnd() * Math.PI;
        const outline = rnd() < 0.5 ? 'rgba(20,10,30,.85)' : 'rgba(255,255,255,.9)';
        const lw = Math.max(1, unit * (0.008 + rnd() * 0.012));
        const glow = rnd() < 0.35;
        draw((dx, dy) => {
          ctx.save();
          ctx.translate(x + dx, y + dy); ctx.rotate(rot);
          ctx.beginPath();
          if (kind === 'circle' || kind === 'ring') ctx.arc(0, 0, r, 0, Math.PI * 2);
          else if (kind === 'square') ctx.rect(-r, -r, r * 2, r * 2);
          else if (kind === 'tri') { ctx.moveTo(0, -r); ctx.lineTo(r * 0.9, r * 0.7); ctx.lineTo(-r * 0.9, r * 0.7); ctx.closePath(); }
          else if (kind === 'diamond') { ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); }
          else { ctx.ellipse(0, 0, r * 1.3, r * 0.7, 0, 0, Math.PI * 2); }
          if (glow) { ctx.shadowColor = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.shadowBlur = r * 0.8; }
          if (kind !== 'ring') {
            const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2);
            const hi = hsl(hue, 100, 75);
            gr.addColorStop(0, `rgba(${hi[0]},${hi[1]},${hi[2]},${fillA})`);
            gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},${fillA})`);
            ctx.fillStyle = gr; ctx.fill();
          }
          ctx.shadowBlur = 0;
          ctx.lineWidth = kind === 'ring' ? lw * 3 : lw;
          ctx.strokeStyle = kind === 'ring' ? `rgb(${col[0]},${col[1]},${col[2]})` : outline;
          ctx.stroke();
          ctx.restore();
        });
      }
    } else if (type === 'rainbow') {
      // 赤→黄→緑→青の縦グラデーションに、絡み合う糸のような曲線
      const hueAt = (y) => Math.max(0, Math.min(240, y / th * 250 - 5));
      const g = ctx.createLinearGradient(0, 0, 0, th);
      for (let i = 0; i <= 8; i++) {
        const c0 = hsl(hueAt(i / 8 * th), 100, 18);
        g.addColorStop(i / 8, `rgb(${c0[0]},${c0[1]},${c0[2]})`);
      }
      ctx.fillStyle = g; ctx.fillRect(0, 0, tw, th);
      const xs = [-tw, 0, tw];
      // ぼんやり光る下地
      for (let i = 0, n = Math.round(tw * th / 500); i < n; i++) {
        const x = rnd() * tw, y = rnd() * th, r = tw * (0.05 + rnd() * 0.12);
        const c1 = hsl(hueAt(y) + (rnd() - 0.5) * 40, 100, 45);
        for (const dx of xs) {
          const gr = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
          gr.addColorStop(0, `rgba(${c1[0]},${c1[1]},${c1[2]},.55)`);
          gr.addColorStop(1, `rgba(${c1[0]},${c1[1]},${c1[2]},0)`);
          ctx.fillStyle = gr; ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
        }
      }
      // 糸
      ctx.lineCap = 'round';
      for (let i = 0, n = Math.round(tw * th / 70); i < n; i++) {
        let x = rnd() * tw, y = rnd() * th;
        const dark = rnd() < 0.12;
        const c2 = hsl(hueAt(y) + (rnd() - 0.5) * 50, 100, 45 + rnd() * 20);
        const col = dark ? 'rgba(0,0,0,.75)' : `rgb(${c2[0]},${c2[1]},${c2[2]})`;
        const lw = Math.max(0.7, tw * (0.004 + rnd() * 0.012));
        const segs = [];
        const step = tw * (0.08 + rnd() * 0.1);
        let ang = rnd() * Math.PI * 2;
        for (let k = 0; k < 3; k++) {
          const a1 = ang + (rnd() - 0.5) * 3, a2 = a1 + (rnd() - 0.5) * 3;
          const p1 = [x + Math.cos(a1) * step, y + Math.sin(a1) * step * 0.6];
          const p2 = [p1[0] + Math.cos(a2) * step, p1[1] + Math.sin(a2) * step * 0.6];
          const p3 = [p2[0] + (rnd() - 0.5) * step, p2[1] + (rnd() - 0.5) * step * 0.6];
          segs.push([p1, p2, p3]);
          x = p3[0]; y = p3[1]; ang = a2;
        }
        const start = [segs[0][0][0], segs[0][0][1]];
        for (const dx of xs) {
          ctx.beginPath();
          ctx.moveTo(start[0] + dx, start[1]);
          for (const [p1, p2, p3] of segs) ctx.bezierCurveTo(p1[0] + dx, p1[1], p2[0] + dx, p2[1], p3[0] + dx, p3[1]);
          ctx.strokeStyle = col; ctx.lineWidth = lw;
          if (!dark && rnd() < 0.3) { ctx.shadowColor = col; ctx.shadowBlur = lw * 3; } else ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
    } else if (type === 'scribble') {
      // 白地に細かいくるくる線（ピンク・赤・オレンジ系）
      ctx.fillStyle = '#fffafa'; ctx.fillRect(0, 0, tw, th);
      const pal = [[350, 90, 60], [5, 90, 55], [25, 95, 58], [320, 80, 75], [300, 70, 80], [40, 95, 60], [355, 85, 72]];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0, n = Math.round(tw * th / 22); i < n; i++) {
        const x0 = rnd() * tw, y0 = rnd() * th;
        const c = pal[(rnd() * pal.length) | 0];
        const col = hsl(c[0] + (rnd() - 0.5) * 16, c[1], c[2] + (rnd() - 0.5) * 12);
        const alpha = 0.55 + rnd() * 0.45;
        const size = tw * (0.02 + rnd() * 0.035);
        const pts = [];
        let x = x0, y = y0, a = rnd() * Math.PI * 2;
        const turn = (rnd() < 0.5 ? -1 : 1) * (0.9 + rnd() * 0.9);
        for (let k = 0, m = 4 + ((rnd() * 6) | 0); k < m; k++) {
          a += turn + (rnd() - 0.5) * 0.8;
          x += Math.cos(a) * size; y += Math.sin(a) * size;
          pts.push([x, y]);
        }
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
        ctx.lineWidth = Math.max(0.8, tw * (0.006 + rnd() * 0.01));
        draw((dx, dy) => {
          ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dy);
          for (let k = 0; k < pts.length - 1; k++) {
            const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
            ctx.quadraticCurveTo(pts[k][0] + dx, pts[k][1] + dy, mx + dx, my + dy);
          }
          ctx.stroke();
        });
      }
    } else if (type === 'neon') {
      ctx.fillStyle = '#0a0618'; ctx.fillRect(0, 0, tw, th);
      const n = Math.round(tw * th / 330);
      for (let i = 0; i < n; i++) {
        const x = rnd() * tw, y = rnd() * th, r = tw * (0.04 + rnd() * 0.13);
        const col = hsl([300, 190, 120, 50, 330, 260][(rnd() * 6) | 0], 100, 60);
        const kind = (rnd() * 3) | 0, rot = rnd() * Math.PI;
        draw((dx, dy) => {
          ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(rot);
          ctx.beginPath();
          if (kind === 0) ctx.arc(0, 0, r, 0, Math.PI * 2);
          else if (kind === 1) ctx.rect(-r, -r * 0.6, r * 2, r * 1.2);
          else { ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r * 1.4, r, 0); ctx.quadraticCurveTo(0, r * 1.4, -r, 0); }
          ctx.shadowColor = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.shadowBlur = tw * 0.06;
          ctx.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.lineWidth = Math.max(1.5, tw * 0.02);
          ctx.stroke();
          ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(0.6, tw * 0.006); ctx.stroke();
          ctx.restore();
        });
      }
    } else if (type === 'candy') {
      ctx.fillStyle = '#ffe9f3'; ctx.fillRect(0, 0, tw, th);
      const n = Math.round(tw * th / 140);
      for (let i = 0; i < n; i++) {
        const x = rnd() * tw, y = rnd() * th, r = tw * (0.04 + rnd() * 0.09);
        const col = hsl([340, 20, 50, 160, 200, 270][(rnd() * 6) | 0], 80, 62 + rnd() * 15);
        draw((dx, dy) => {
          const gr = ctx.createRadialGradient(x + dx - r * 0.35, y + dy - r * 0.35, r * 0.05, x + dx, y + dy, r);
          gr.addColorStop(0, '#fff');
          gr.addColorStop(0.35, `rgb(${col[0]},${col[1]},${col[2]})`);
          gr.addColorStop(1, `rgb(${Math.round(col[0] * 0.75)},${Math.round(col[1] * 0.75)},${Math.round(col[2] * 0.75)})`);
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
        });
      }
    } else if (type === 'flowers') {
      ctx.fillStyle = '#2f6b2a'; ctx.fillRect(0, 0, tw, th);
      const n = Math.round(tw * th / 260);
      for (let i = 0; i < n; i++) {
        const x = rnd() * tw, y = rnd() * th, r = tw * (0.05 + rnd() * 0.08);
        const col = hsl([0, 330, 50, 280, 210, 20][(rnd() * 6) | 0], 85, 60 + rnd() * 15);
        const petals = 5 + ((rnd() * 3) | 0), rot = rnd() * Math.PI;
        draw((dx, dy) => {
          ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(rot);
          ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
          for (let k = 0; k < petals; k++) {
            ctx.rotate(Math.PI * 2 / petals);
            ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.5, r * 0.26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          ctx.fillStyle = '#ffd23f';
          ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });
      }
    }
    const img = ctx.getImageData(0, 0, tw, th);
    return { data: new Uint32Array(img.data.buffer), tw, th };
  }

  // ステンドグラス（横方向に継ぎ目なく繋がるボロノイ分割）
  function stainedGlass(tw, th, rnd) {
    const n = Math.max(8, Math.round(tw * th / 900));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const col = hsl((rnd() * 360) | 0, 80 + rnd() * 20, 38 + rnd() * 22);
      pts.push({ x: rnd() * tw, y: rnd() * th, c: col });
    }
    const data = new Uint32Array(tw * th);
    const lead = Math.max(1.2, tw / 70);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        let d1 = 1e9, d2 = 1e9, best = null;
        for (const p of pts) {
          let dx = Math.abs(x - p.x); dx = Math.min(dx, tw - dx);
          let dy = Math.abs(y - p.y); dy = Math.min(dy, th - dy);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < d1) { d2 = d1; d1 = d; best = p; } else if (d < d2) d2 = d;
        }
        if (d2 - d1 < lead) { data[y * tw + x] = rgba(25, 20, 28); continue; }
        // 中心が明るく光るような陰影
        const k = 1.25 - Math.min(0.55, d1 / (tw * 0.35));
        const [r, g, b] = best.c;
        data[y * tw + x] = rgba(Math.min(255, r * k) | 0, Math.min(255, g * k) | 0, Math.min(255, b * k) | 0);
      }
    }
    return { data, tw, th };
  }

  // マーブル（周期関数のみで作るので継ぎ目なし）
  function marble(tw, th, rnd) {
    const data = new Uint32Array(tw * th);
    const ph = [rnd() * 6, rnd() * 6, rnd() * 6, rnd() * 6];
    const base = rnd() * 360;
    const TAU = Math.PI * 2;
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const u = x / tw * TAU, v = y / th * TAU;
        const warp = 1.6 * Math.sin(u + ph[0]) + 1.2 * Math.sin(2 * v + ph[1]) + 0.8 * Math.sin(u * 2 + v * 3 + ph[2]);
        const t = Math.sin(v * 4 + u * 1 + warp * 1.8 + ph[3]);
        const hue = (base + t * 70 + warp * 25 + 360) % 360;
        const light = 45 + 18 * Math.sin(warp * 3 + u);
        const [r, g, b] = hsl(hue, 85, light);
        data[y * tw + x] = rgba(r, g, b);
      }
    }
    return { data, tw, th };
  }

  /**
   * depth: Float32Array (w*h, 0=遠景〜1=最も手前)
   * period: 遠景面の繰り返し周期 [px]（= 目の間隔/2 に相当）
   * mu: 奥行きの強さ (0.1〜0.5)
   * cross: 交差法用に奥行きを反転
   * out: Uint32Array (w*h)
   */
  function render(opts) {
    const { depth, w, h, period, mu, pattern, cross, out } = opts;
    const E = period * 2;
    const same = new Int32Array(w);
    const zrow = new Float32Array(w);
    const pix = new Uint32Array(w);
    const root = new Int32Array(w);
    const rep = new Int32Array(w);
    const mid = w >> 1;
    const pd = pattern.data, tw = pattern.tw, th = pattern.th;
    const hsr = opts.hiddenSurface !== false;

    for (let y = 0; y < h; y++) {
      const off = y * w;
      for (let x = 0; x < w; x++) {
        const z = depth[off + x];
        zrow[x] = cross ? 1 - z : z;
        same[x] = x;
      }
      for (let x = 0; x < w; x++) {
        const z = zrow[x];
        const s = Math.round((1 - mu * z) * E / (2 - mu * z));
        let left = x - (s >> 1);
        let right = left + s;
        if (left < 0 || right >= w) continue;

        let visible = true;
        if (hsr) {
          let t = 1, zt;
          do {
            zt = z + 2 * (2 - mu * z) * t / (mu * E);
            visible = zrow[x - t] < zt && zrow[x + t] < zt;
            t++;
          } while (visible && zt < 1 && x - t >= 0 && x + t < w);
        }
        if (!visible) continue;

        let l = same[left];
        while (l !== left && l !== right) {
          if (l < right) {
            left = l;
            l = same[left];
          } else {
            same[left] = right;
            left = right;
            l = same[left];
            right = l;
          }
        }
        same[left] = right;
      }
      // 同じ色になるべきピクセルの連鎖ごとに、画面中央に最も近い画素の模様を採用する
      // （歪みを左右の端へ均等に逃がし、中央の模様をきれいに保つ）
      const py = (y % th) * tw;
      for (let x = w - 1; x >= 0; x--) root[x] = same[x] === x ? x : root[same[x]];
      rep.fill(-1);
      for (let x = 0; x < w; x++) {
        const r = root[x], cur = rep[r];
        if (cur < 0 || Math.abs(x - mid) < Math.abs(cur - mid)) rep[r] = x;
      }
      for (let x = 0; x < w; x++) pix[x] = pd[py + (rep[root[x]] % tw)];
      out.set(pix, off);
    }
    return out;
  }

  /**
   * キャンバスに描画（dotSize で拡大表示）
   */
  function drawToCanvas(canvas, depth, w, h, settings, pattern) {
    const out = new Uint32Array(w * h);
    render({
      depth, w, h,
      period: settings.period,
      mu: settings.mu,
      pattern,
      cross: settings.cross,
      out
    });
    const ds = settings.dotSize || 1;
    canvas.width = w * ds;
    canvas.height = h * ds;
    const ctx = canvas.getContext('2d');
    const img = new ImageData(new Uint8ClampedArray(out.buffer), w, h);
    if (ds === 1) {
      ctx.putImageData(img, 0, 0);
    } else {
      const tmp = document.createElement('canvas');
      tmp.width = w; tmp.height = h;
      tmp.getContext('2d').putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, w * ds, h * ds);
    }
    return canvas;
  }

  global.Stereo = { render, makePattern, drawToCanvas, PATTERNS, mulberry32 };
})(window);
