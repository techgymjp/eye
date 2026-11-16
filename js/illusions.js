/*
 * 騙し絵・錯視コレクション
 * draw(ctx, w, h, state) で描画。state.reveal = 種明かし表示、state.t = 経過秒（アニメーション用）
 */
(function (global) {
  'use strict';

  const INK = '#1d1d22';
  const PAPER = '#fafaf7';
  const MARK = '#e8433a';

  function bg(ctx, w, h, c) { ctx.fillStyle = c || PAPER; ctx.fillRect(0, 0, w, h); }
  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }

  const LIST = [
    {
      id: 'penrose', name: '不可能な三角形', kind: '不可能図形', nameEn: "Impossible Triangle", kindEn: "Impossible figure",
      qEn: "Could this 3D triangle be built in real life?",
      aEn: "Each corner on its own looks like a correct solid, but the whole shape cannot exist in reality — an “impossible figure”. In isometric projection, moving the same distance along X, Y and Z brings you back to the same spot on screen, so two distant corners appear to join.",
      q: 'この三角形の立体は、現実に作れるでしょうか？',
      a: '各角だけを見ると正しい立体ですが、全体としては現実には存在できない「不可能図形」です。等角投影では、X・Y・Z方向に同じだけ進むと画面上で元の位置に戻るため、遠く離れた2つの角がつながって見えます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        const n = 5;
        const s = Math.min(w / (2 * n * 0.866 + 2), h / (n * 1.5 + 2.2));
        const P0 = (x, y, z) => [(x - y) * 0.866 * s, (x + y) * 0.5 * s - z * s];
        // 全体のバウンディングボックスから中央寄せ
        const ext = [P0(0, 1, 0), P0(0, 0, 1), P0(n + 1, 0, 0), P0(n, n + 1, 0), P0(n + 1, n + 1, 0)];
        const xs = ext.map(p => p[0]), ys = ext.map(p => p[1]);
        const cx = w / 2 - (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = h / 2 - (Math.min(...ys) + Math.max(...ys)) / 2;
        const P = (x, y, z) => { const q = P0(x, y, z); return [cx + q[0], cy + q[1]]; };
        const cubes = [];
        for (let i = 0; i <= n; i++) cubes.push([i, 0, 0]);
        for (let j = 1; j <= n; j++) cubes.push([n, j, 0]);
        for (let k = 1; k < n; k++) cubes.push([n, n, k]);
        const faceColors = st.reveal ? ['#ffd34d', '#f08a24', '#b8561b'] : ['#e9eef7', '#7d93b8', '#3c4f73'];
        const drawCube = (c, which) => {
          const [x, y, z] = c;
          const top = [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
          const fx = [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)];
          const fy = [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)];
          const faces = [[top, 0], [fy, 1], [fx, 2]];
          faces.forEach(([f, i]) => {
            if (which && !which.includes(i)) return;
            ctx.fillStyle = faceColors[i];
            poly(ctx, f); ctx.fill();
            ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, s * 0.04); ctx.stroke();
          });
        };
        const sorted = cubes.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
        sorted.forEach(c => drawCube(c));
        // 始点のキューブを一部だけ上書きして「つながり」を作る
        drawCube([0, 0, 0], [0, 1]);
        if (st.reveal) {
          ctx.fillStyle = MARK;
          ctx.font = `bold ${Math.round(s * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          const a = P(0.5, 0.5, 1.4), b = P(n + 0.5, n + 0.5, n - 0.3);
          ctx.fillText((window.I18N ? I18N.t : (k => k))('ill.near'), a[0], a[1] - s * 0.3);
          ctx.textAlign = 'right';
          ctx.fillText((window.I18N ? I18N.t : (k => k))('ill.far'), b[0] - s * 1.0, b[1] + s * 0.4);
        }
      }
    },
    {
      id: 'muller', name: 'ミュラー・リヤー錯視', kind: '長さの錯視', nameEn: "Müller-Lyer Illusion", kindEn: "Length illusion",
      qEn: "Which horizontal line looks longer, top or bottom?",
      aEn: "Both lines are exactly the same length. The direction of the arrow fins changes how we judge length.",
      q: '上と下の横線、どちらが長く見えますか？',
      a: '2本の横線はまったく同じ長さです。矢羽の向きによって、線の長さの判断が変わります。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        const L = w * 0.42, cx = w / 2, f = Math.min(w, h) * 0.09;
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(3, w / 160); ctx.lineCap = 'round';
        const y1 = h * 0.32, y2 = h * 0.7;
        line(ctx, cx - L / 2, y1, cx + L / 2, y1);
        line(ctx, cx - L / 2, y1, cx - L / 2 + f, y1 - f); line(ctx, cx - L / 2, y1, cx - L / 2 + f, y1 + f);
        line(ctx, cx + L / 2, y1, cx + L / 2 - f, y1 - f); line(ctx, cx + L / 2, y1, cx + L / 2 - f, y1 + f);
        line(ctx, cx - L / 2, y2, cx + L / 2, y2);
        line(ctx, cx - L / 2, y2, cx - L / 2 - f, y2 - f); line(ctx, cx - L / 2, y2, cx - L / 2 - f, y2 + f);
        line(ctx, cx + L / 2, y2, cx + L / 2 + f, y2 - f); line(ctx, cx + L / 2, y2, cx + L / 2 + f, y2 + f);
        if (st.reveal) {
          ctx.strokeStyle = MARK; ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
          line(ctx, cx - L / 2, h * 0.12, cx - L / 2, h * 0.9);
          line(ctx, cx + L / 2, h * 0.12, cx + L / 2, h * 0.9);
          ctx.setLineDash([]);
        }
      }
    },
    {
      id: 'ebbinghaus', name: 'エビングハウス錯視', kind: '大きさの錯視', nameEn: "Ebbinghaus Illusion", kindEn: "Size illusion",
      qEn: "Which orange center circle is bigger?",
      aEn: "The two center circles are the same size. Surrounded by large circles one looks smaller; surrounded by small circles it looks bigger.",
      q: '中央のオレンジの円、どちらが大きいですか？',
      a: '中央の円は左右とも同じ大きさです。周りの円が大きいと小さく、小さいと大きく見えます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        const r = Math.min(w, h) * 0.065;
        const L = [w * 0.28, h / 2], R = [w * 0.72, h / 2];
        ctx.fillStyle = '#5b7bb4';
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          ctx.beginPath(); ctx.arc(L[0] + Math.cos(a) * r * 3.4, L[1] + Math.sin(a) * r * 3.4, r * 1.75, 0, Math.PI * 2); ctx.fill();
        }
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          ctx.beginPath(); ctx.arc(R[0] + Math.cos(a) * r * 1.75, R[1] + Math.sin(a) * r * 1.75, r * 0.45, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#f08a24';
        for (const c of [L, R]) { ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.fill(); }
        if (st.reveal) {
          ctx.strokeStyle = MARK; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
          line(ctx, 0, h / 2 - r, w, h / 2 - r); line(ctx, 0, h / 2 + r, w, h / 2 + r);
          ctx.setLineDash([]);
        }
      }
    },
    {
      id: 'cafewall', name: 'カフェウォール錯視', kind: '傾きの錯視', nameEn: "Café Wall Illusion", kindEn: "Tilt illusion",
      qEn: "Do the gray horizontal lines look tilted?",
      aEn: "All the horizontal lines are perfectly level and parallel. The offset black-and-white tiles combined with the thin gray lines make them look wedge-shaped.",
      q: '灰色の横線は傾いて見えますか？',
      a: '横線はすべて完全に水平・平行です。白黒タイルのずれと細い灰色の線の組み合わせで、くさび形に傾いて見えます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h, '#888');
        const rows = 9, rh = h / rows, tw = rh * 1.6, mortar = Math.max(2, rh * 0.07);
        const shifts = [0, 0.25, 0.5, 0.25];
        for (let r = 0; r < rows; r++) {
          const off = shifts[r % 4] * tw * 2;
          for (let x = -tw * 2 + off, i = 0; x < w; x += tw, i++) {
            ctx.fillStyle = i % 2 ? '#fff' : '#111';
            ctx.fillRect(x, r * rh + mortar / 2, tw, rh - mortar);
          }
        }
        if (st.reveal) {
          ctx.strokeStyle = MARK; ctx.lineWidth = 2;
          for (let r = 1; r < rows; r++) line(ctx, 0, r * rh, w, r * rh);
        }
      }
    },
    {
      id: 'scintillating', name: 'きらめき格子錯視', kind: '明るさの錯視', nameEn: "Scintillating Grid", kindEn: "Brightness illusion",
      qEn: "Look at the white dots at the intersections. Do you see black dots?",
      aEn: "All the dots are white. As you move your eyes, black dots flicker at the intersections you are not looking at directly. Lateral inhibition in the retina is thought to play a role.",
      q: '交差点の白い丸をよく見てください。黒い点が見えますか？',
      a: '交差点の丸はすべて白です。視線を動かすと、見ていない交差点に黒い点がチカチカ現れます。網膜の側抑制などが関係していると言われます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h, '#000');
        const n = 8, cell = Math.min(w, h) / (n + 0.5), lw = cell * 0.16;
        const ox = (w - cell * n) / 2, oy = (h - cell * n) / 2;
        ctx.fillStyle = '#7a7a7a';
        for (let i = 0; i <= n; i++) {
          ctx.fillRect(ox + i * cell - lw / 2, oy - lw / 2, lw, cell * n + lw);
          ctx.fillRect(ox - lw / 2, oy + i * cell - lw / 2, cell * n + lw, lw);
        }
        ctx.fillStyle = st.reveal ? MARK : '#fff';
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
          ctx.beginPath(); ctx.arc(ox + i * cell, oy + j * cell, lw * 0.75, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    {
      id: 'rubin', name: 'ルビンの壺', kind: '多義図形', nameEn: "Rubin’s Vase", kindEn: "Ambiguous figure",
      qEn: "Do you see a white vase, or two faces looking at each other?",
      aEn: "The same picture can be seen as a vase or as two faces in profile. It is a classic example of figure–ground reversal.",
      q: '白い壺が見えますか？それとも向かい合う2人の顔？',
      a: '同じ絵が「壺」にも「向かい合った顔」にも見えます。図（主役）と地（背景）が入れ替わる「図地反転」の代表例です。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h, st.reveal ? '#2f5d9b' : INK);
        // 横顔の輪郭（中心からの距離 0..1, 上→下）
        const prof = [[0, 0.62], [0.08, 0.55], [0.18, 0.42], [0.26, 0.38], [0.33, 0.36], [0.37, 0.27], [0.42, 0.18],
          [0.47, 0.3], [0.52, 0.31], [0.55, 0.24], [0.58, 0.3], [0.62, 0.28], [0.66, 0.36], [0.72, 0.5], [0.8, 0.52],
          [0.88, 0.62], [1, 0.75]];
        const H = h * 0.9, top = h * 0.05, half = Math.min(w * 0.42, H * 0.55), cx = w / 2;
        ctx.fillStyle = PAPER;
        ctx.beginPath();
        prof.forEach(([t, d], i) => { const p = [cx - d * half, top + t * H]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
        for (let i = prof.length - 1; i >= 0; i--) { const [t, d] = prof[i]; ctx.lineTo(cx + d * half, top + t * H); }
        ctx.closePath();
        ctx.lineJoin = 'round';
        ctx.fill();
        ctx.fillRect(cx - 0.62 * half, 0, 1.24 * half, top + 1);
        ctx.fillRect(cx - 0.75 * half, top + H - 1, 1.5 * half, h - top - H + 1);
      }
    },
    {
      id: 'necker', name: 'ネッカーの立方体', kind: '多義図形', nameEn: "Necker Cube", kindEn: "Ambiguous figure",
      qEn: "Which face is in front? Keep looking…",
      aEn: "Because the line drawing has no depth cues, either the lower-left or the upper-right face can look like the front, and they naturally flip every few seconds.",
      q: 'どちらの面が手前に見えますか？じっと見ていると…',
      a: '奥行きの手がかりがない線画なので、左下の面が手前にも、右上の面が手前にも見え、数秒ごとに自然に入れ替わります。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        const s = Math.min(w, h) * 0.42, d = s * 0.42, cx = w / 2 - d / 2, cy = h / 2 + d / 2;
        const A = [cx - s / 2, cy - s / 2], B = [A[0] + d, A[1] - d];
        if (st.reveal) {
          ctx.fillStyle = 'rgba(232,67,58,0.18)'; ctx.fillRect(A[0], A[1], s, s);
          ctx.fillStyle = 'rgba(47,93,155,0.18)'; ctx.fillRect(B[0], B[1], s, s);
        }
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(3, s / 70);
        ctx.strokeRect(A[0], A[1], s, s); ctx.strokeRect(B[0], B[1], s, s);
        for (const [dx, dy] of [[0, 0], [s, 0], [0, s], [s, s]]) line(ctx, A[0] + dx, A[1] + dy, B[0] + dx, B[1] + dy);
      }
    },
    {
      id: 'kanizsa', name: 'カニッツァの三角形', kind: '主観的輪郭', nameEn: "Kanizsa Triangle", kindEn: "Illusory contour",
      qEn: "Do you see a white triangle in the middle?",
      aEn: "No outline of that triangle is drawn. From the arrangement of the notched circles and corners, your brain fills in an edge that is not there.",
      q: '中央に白い三角形が見えますか？',
      a: '三角形の輪郭線は描かれていません。欠けた円と角の配置から、脳が存在しない輪郭を補って「見て」います。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        const R = Math.min(w, h) * 0.36, r = R * 0.27, cx = w / 2, cy = h / 2 + R * 0.12;
        const pts = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
        ctx.fillStyle = INK;
        pts.forEach((p, i) => {
          const a = -Math.PI / 2 + i * 2 * Math.PI / 3 + Math.PI;
          ctx.beginPath(); ctx.moveTo(p[0], p[1]);
          ctx.arc(p[0], p[1], r, a + Math.PI / 6, a - Math.PI / 6 + Math.PI * 2);
          ctx.closePath(); ctx.fill();
        });
        // 逆三角形の輪郭（途切れ線）
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, r / 9);
        const q = [0, 1, 2].map(i => { const a = Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + Math.cos(a) * R * 0.85, cy - R * 0.12 + Math.sin(a) * R * 0.85 - R * 0.05]; });
        for (let i = 0; i < 3; i++) {
          const p1 = q[i], p2 = q[(i + 1) % 3];
          const v = [p2[0] - p1[0], p2[1] - p1[1]];
          line(ctx, p1[0], p1[1], p1[0] + v[0] * 0.3, p1[1] + v[1] * 0.3);
          line(ctx, p2[0], p2[1], p2[0] - v[0] * 0.3, p2[1] - v[1] * 0.3);
        }
        if (st.reveal) {
          ctx.strokeStyle = MARK; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
          poly(ctx, pts); ctx.stroke(); ctx.setLineDash([]);
        }
      }
    },
    {
      id: 'zollner', name: 'ツェルナー錯視', kind: '傾きの錯視', nameEn: "Zöllner Illusion", kindEn: "Tilt illusion",
      qEn: "Are the long diagonal lines parallel?",
      aEn: "All the long lines are perfectly parallel. The short hatches alternate in direction, making neighboring lines seem to converge and diverge.",
      q: '長い斜めの線は平行ですか？',
      a: 'すべての長い線は完全に平行です。短い斜線が交互に向きを変えることで、隣同士が開いたり閉じたりして見えます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, w / 300);
        const n = 7, gap = w / n, len = Math.hypot(w, h);
        for (let i = 0; i < n + 3; i++) {
          const x0 = -h * 0.5 + i * gap;
          const dir = [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)];
          const x1 = x0, y1 = 0, x2 = x0 + dir[0] * len, y2 = dir[1] * len;
          ctx.strokeStyle = st.reveal ? MARK : INK;
          line(ctx, x1, y1, x2, y2);
          ctx.strokeStyle = INK;
          const hatch = gap * 0.22, ang = i % 2 ? Math.PI * 0.95 : Math.PI * 0.4;
          for (let t = 0; t < len; t += gap * 0.28) {
            const px = x1 + dir[0] * t, py = y1 + dir[1] * t;
            line(ctx, px - Math.cos(ang) * hatch, py - Math.sin(ang) * hatch, px + Math.cos(ang) * hatch, py + Math.sin(ang) * hatch);
          }
        }
      }
    },
    {
      id: 'contrast', name: '明るさの同時対比', kind: '明るさの錯視', nameEn: "Simultaneous Contrast", kindEn: "Brightness illusion",
      qEn: "Which of the two center squares is brighter?",
      aEn: "The two squares are exactly the same gray. On a dark background it looks lighter; on a light background it looks darker.",
      q: '中央の2つの四角、どちらが明るいですか？',
      a: '2つの四角はまったく同じ灰色です。暗い背景の上では明るく、明るい背景の上では暗く見えます。',
      draw(ctx, w, h, st) {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#111'); g.addColorStop(1, '#eee');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const s = Math.min(w, h) * 0.22;
        ctx.fillStyle = '#808080';
        ctx.fillRect(w * 0.2 - s / 2, h / 2 - s / 2, s, s);
        ctx.fillRect(w * 0.8 - s / 2, h / 2 - s / 2, s, s);
        if (st.reveal) ctx.fillRect(w * 0.2, h / 2 - s * 0.12, w * 0.6, s * 0.24);
      }
    },
    {
      id: 'ponzo', name: 'ポンゾ錯視', kind: '大きさの錯視', nameEn: "Ponzo Illusion", kindEn: "Size illusion",
      qEn: "Which of the two yellow bars is longer?",
      aEn: "They are the same length. The railway-like perspective makes your brain assume the upper bar is farther away — and therefore bigger.",
      q: '2本の黄色い棒、どちらが長いですか？',
      a: '2本は同じ長さです。線路のような遠近の手がかりで、上の棒が「遠くにある＝本当は大きい」と脳が補正してしまいます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h, '#2d3a2e');
        ctx.strokeStyle = '#c9c2b0'; ctx.lineWidth = Math.max(3, w / 150);
        line(ctx, w * 0.5 - w * 0.04, h * 0.04, w * 0.5 - w * 0.36, h * 0.98);
        line(ctx, w * 0.5 + w * 0.04, h * 0.04, w * 0.5 + w * 0.36, h * 0.98);
        ctx.lineWidth = Math.max(2, w / 260);
        for (let i = 1; i < 12; i++) {
          const t = Math.pow(i / 12, 1.6), y = h * 0.04 + t * h * 0.94, hw = w * 0.04 + t * w * 0.32;
          line(ctx, w / 2 - hw * 1.08, y, w / 2 + hw * 1.08, y);
        }
        const L = w * 0.16;
        ctx.fillStyle = '#ffd34d';
        ctx.fillRect(w / 2 - L / 2, h * 0.3, L, h * 0.035);
        ctx.fillRect(w / 2 - L / 2, h * 0.8, L, h * 0.035);
        if (st.reveal) {
          ctx.strokeStyle = MARK; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
          line(ctx, w / 2 - L / 2, 0, w / 2 - L / 2, h); line(ctx, w / 2 + L / 2, 0, w / 2 + L / 2, h);
          ctx.setLineDash([]);
        }
      }
    },
    {
      id: 'fraser', name: 'フレーザーの渦巻き', kind: '形の錯視', nameEn: "Fraser Spiral", kindEn: "Shape illusion",
      qEn: "Does it look like a spiral?",
      aEn: "It is not a spiral — just overlapping concentric circles. The twisted-cord pattern misleads your sense of line direction.",
      q: '渦巻きに見えますか？',
      a: '実は渦巻きではなく、同心円が重なっているだけです。ねじれた縞模様が線の向きの判断を狂わせます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h, '#7d8a99');
        const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.48;
        // 背景の市松（渦）
        const sectors = 32;
        for (let r = R; r > 6; r -= R / 10) {
          for (let k = 0; k < sectors; k++) {
            const a0 = k * Math.PI * 2 / sectors + r * 0.01, a1 = a0 + Math.PI * 2 / sectors;
            ctx.fillStyle = (k + Math.round(r / (R / 10))) % 2 ? '#3e5c7a' : '#9fb7c9';
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill();
          }
        }
        // ねじれた紐の同心円
        const rings = 7;
        for (let i = 1; i <= rings; i++) {
          const r = R * i / (rings + 0.6);
          const segs = Math.round(16 + i * 8);
          for (let k = 0; k < segs; k++) {
            const a = k * Math.PI * 2 / segs;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            const tilt = a + Math.PI / 2 + 0.45;
            const sl = Math.PI * r / segs * 0.95;
            ctx.strokeStyle = k % 2 ? '#111' : '#fff';
            ctx.lineWidth = Math.max(2, R / 70);
            line(ctx, x - Math.cos(tilt) * sl, y - Math.sin(tilt) * sl, x + Math.cos(tilt) * sl, y + Math.sin(tilt) * sl);
          }
          if (st.reveal && i === 4) {
            ctx.strokeStyle = MARK; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          }
        }
      }
    },
    {
      id: 'drift', name: '周辺ドリフト錯視', kind: '動きの錯視', nameEn: "Peripheral Drift Illusion", kindEn: "Motion illusion",
      qEn: "It is a still image, yet don’t the circles seem to rotate slowly?",
      aEn: "The image is completely still. The luminance sequence “black → dark → white → light” is processed as a motion signal when your eyes move. Staring at the center weakens the effect.",
      q: '静止画なのに、円がゆっくり回って見えませんか？',
      a: 'この絵は完全に止まっています。「黒→濃い灰→白→薄い灰」という明るさの並びが、視線を動かしたときに動きの信号として処理されます。中心を見つめると動きは弱まります。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h, '#556b2f');
        const seq = ['#000', '#3a62c6', '#fff', '#e8d34a'];
        const R = Math.min(w / 4.4, h / 2.3);
        const centers = [[w * 0.27, h * 0.5, 1], [w * 0.73, h * 0.5, -1]];
        for (const [cx, cy, dir] of centers) {
          for (let ring = 5; ring >= 1; ring--) {
            const r = R * ring / 5, n = 24;
            for (let k = 0; k < n * 4; k++) {
              const a0 = (k / (n * 4)) * Math.PI * 2 * dir + ring * 0.2;
              const a1 = ((k + 1) / (n * 4)) * Math.PI * 2 * dir + ring * 0.2;
              ctx.fillStyle = seq[k % 4];
              ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, Math.min(a0, a1), Math.max(a0, a1)); ctx.closePath(); ctx.fill();
            }
            ctx.fillStyle = ring % 2 ? '#556b2f' : '#7a5230';
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.fill();
          }
          if (st.reveal) {
            ctx.fillStyle = MARK;
            ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    },
    {
      id: 'jastrow', name: 'ジャストロー錯視', kind: '大きさの錯視', nameEn: "Jastrow Illusion", kindEn: "Size illusion",
      qEn: "Which arc is bigger, top or bottom?",
      aEn: "The two arcs are exactly the same size. Comparing the short edge of one with the long edge of the other makes the lower one look bigger.",
      q: '上と下の扇形、どちらが大きいですか？',
      a: '2つの扇形はまったく同じ大きさです。並べたときの短い辺と長い辺の比較で、下が大きく見えます。',
      draw(ctx, w, h, st) {
        bg(ctx, w, h);
        const R = Math.min(w, h) * 0.9, r = R * 0.62, span = 0.75;
        const drawArc = (ox, oy, col) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(ox, oy, R, -Math.PI / 2 - span / 2, -Math.PI / 2 + span / 2);
          ctx.arc(ox, oy, r, -Math.PI / 2 + span / 2, -Math.PI / 2 - span / 2, true);
          ctx.closePath(); ctx.fill();
        };
        const ox = w / 2, oy1 = h * 0.05 + R, oy2 = oy1 + (R - r) * 1.2;
        drawArc(ox, oy1, '#e8433a');
        drawArc(ox, oy2, '#2f5d9b');
        if (st.reveal) {
          ctx.globalAlpha = 0.5; drawArc(ox, oy2 - (R - r) * 1.2 * (0.5 + 0.5 * Math.sin(st.t * 1.5)), '#e8433a'); ctx.globalAlpha = 1;
        }
      }
    },
    {
      id: 'afterimage', name: '残像トリック', kind: '残像', nameEn: "Afterimage Trick", kindEn: "Afterimage",
      qEn: "Stare at the center dot for 20 seconds, then press “Reveal”.",
      aEn: "You should have seen the flag in its true colors (red, white and blue) on the white screen. Photoreceptors tired from one color respond less, so the opposite (complementary) color appears as an afterimage.",
      q: '中央の点を20秒見つめてから「種明かし」を押してください。',
      a: '白い画面に、本来の色（赤・白・青の旗）が浮かんで見えたはずです。同じ色を見続けて疲れた視細胞の反応が弱まり、反対の色（補色）の残像が現れます。',
      draw(ctx, w, h, st) {
        if (st.reveal) {
          bg(ctx, w, h, '#fff');
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2); ctx.fill();
          return;
        }
        bg(ctx, w, h, '#000');
        const fw = Math.min(w * 0.75, h * 1.2), fh = fw * 0.6, x = (w - fw) / 2, y = (h - fh) / 2;
        // 補色の旗（緑・黒・橙）
        ctx.fillStyle = '#00d6d6'; ctx.fillRect(x, y, fw / 3, fh);
        ctx.fillStyle = '#000'; ctx.fillRect(x + fw / 3, y, fw / 3, fh);
        ctx.fillStyle = '#ffb000'; ctx.fillRect(x + fw * 2 / 3, y, fw / 3, fh);
        ctx.strokeStyle = '#444'; ctx.strokeRect(x, y, fw, fh);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2); ctx.fill();
        const remain = Math.max(0, 20 - Math.floor(st.t));
        ctx.font = `bold ${Math.round(h * 0.06)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(remain > 0 ? (window.I18N ? I18N.t : (k => k))('ill.remain', remain) : (window.I18N ? I18N.t : (k => k))('ill.pressReveal'), w / 2, h - h * 0.06);
      },
      animated: true
    }
  ];

  global.Illusions = { LIST };
})(window);
