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
    bw: { name: 'ランダムドット（白黒）', tiled: false },
    color: { name: 'カラードット', tiled: false },
    pastel: { name: 'パステルドット', tiled: false },
    ocean: { name: 'オーシャン', tiled: false },
    bubbles: { name: 'バブル模様', tiled: true },
    mosaic: { name: 'モザイク', tiled: true },
    leaves: { name: 'フォレスト', tiled: true }
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
    const th = Math.max(64, Math.min(h, 256));
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
    }
    const img = ctx.getImageData(0, 0, tw, th);
    return { data: new Uint32Array(img.data.buffer), tw, th };
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
      const py = (y % th) * tw;
      for (let x = w - 1; x >= 0; x--) {
        pix[x] = same[x] === x ? pd[py + (x % tw)] : pix[same[x]];
      }
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
