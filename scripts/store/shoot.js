const { chromium } = require('playwright');
// Google Play 用の画像を作る（スクリーンショット 1080×1920 日英 各 6 枚・フィーチャーグラフィック・アイコン 512）
//   npm run build:app && node scripts/store/shoot.js
// Playwright が必要（npm i -D playwright、または入っている環境で実行）。結果は docs/store/ に保存
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const www = path.join(root, 'www');
const OUT = path.join(root, 'docs', 'store') + '/';
const PORT = 8766;
const BASE = `http://localhost:${PORT}/`;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
// www/ をそのまま配信する小さなサーバー（フィーチャーグラフィック用の HTML とアイコンも一緒に配る）
const extra = { '/fg.html': path.join(__dirname, 'feature-graphic.html'), '/icon.png': path.join(root, 'assets', 'icon-only.png') };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const file = extra[u] || path.join(www, u === '/' ? 'index.html' : u);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
const SETTINGS = { mode: 'parallel', pattern: 'jewel', mu: 0.3, period: 76, dot: 1, dots: true };
function records() {
  const rec = {}; const d = new Date();
  const mins = [5, 3, 6, 4, 0, 5, 7, 3, 5, 6, 4, 8, 5, 6];
  for (let i = 0; i < 14; i++) {
    const day = new Date(d); day.setDate(d.getDate() - (13 - i));
    const k = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
    if (!mins[i]) continue;
    rec[k] = { sec: mins[i] * 60, total: mins[i] * 4, correct: Math.round(mins[i] * 4 * 0.85), sessions: Math.ceil(mins[i] / 3), timeSum: mins[i] * 4 * 0.85 * 3.4, timeN: Math.round(mins[i] * 4 * 0.85) };
  }
  return rec;
}
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  for (const lang of ['ja', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: lang === 'ja' ? 'ja-JP' : 'en-US' });
    await ctx.addInitScript(([s, r, l]) => {
      localStorage.setItem('stereo.settings', JSON.stringify(s));
      localStorage.setItem('stereo.records', JSON.stringify(r));
      localStorage.setItem('stereo.lang', l);
      localStorage.setItem('stereo.sound', JSON.stringify({ bgm: false, bgmSet: true, sfx: true, bgmVol: .5, sfxVol: .6, track: 'calm' }));
    }, [SETTINGS, records(), lang]);
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const shot = (name) => p.screenshot({ path: `${OUT}${lang}-${name}.png` });
    const scrollTo = (sel, off) => p.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o); }, [sel, off]);

    // 1. ホーム
    await p.goto(BASE + '#home'); await p.waitForTimeout(900);
    await shot('1-home');

    // 2. 3Dアート（土星・カラフル図形）
    await p.goto(BASE + '#gallery'); await p.waitForTimeout(800);
    await p.evaluate(() => { const t = [...document.querySelectorAll('#galleryThumbs .thumb')]; t[11].click(); });
    await p.waitForTimeout(600);
    await scrollTo('#page-gallery h2', 70); await p.waitForTimeout(200);
    await shot('2-gallery');

    // 3. トレーニング（クイズ）
    await p.goto(BASE + '#training'); await p.waitForTimeout(500);
    await p.selectOption('#trainSet', 'shape');
    await p.click('#trainStart'); await p.waitForTimeout(1600);
    await scrollTo('#page-training h2', 70); await p.waitForTimeout(200);
    await shot('3-training');

    // 4. 遠近トレーニング（呼吸）
    await p.goto(BASE + '#focus'); await p.waitForTimeout(500);
    await p.selectOption('#focusMotion', 'breath');
    await p.selectOption('#focusShape', 'sphere');
    await p.click('#focusToggle'); await p.waitForTimeout(2300);
    await scrollTo('#focusStage', 70); await p.waitForTimeout(150);
    await shot('4-focus');
    await p.click('#focusToggle');

    // 5. 騙し絵（不可能な三角形・種明かし）
    await p.goto(BASE + '#illusion'); await p.waitForTimeout(500);
    await p.click('#illReveal'); await p.waitForTimeout(300);
    await scrollTo('#illStage', 66); await p.waitForTimeout(150);
    await shot('5-illusion');

    // 6. 記録
    await p.goto(BASE + '#record'); await p.waitForTimeout(500);
    await shot('6-record');
    console.log(lang, 'errors:', errs);
    await ctx.close();
  }

  // フィーチャーグラフィック（1024×500）
  const fp = await b.newPage({ viewport: { width: 1024, height: 500 } });
  for (const [l, f] of [['ja', 'feature-graphic.png'], ['en', 'feature-graphic-en.png']]) {
    await fp.goto(BASE + 'fg.html?l=' + l); await fp.waitForTimeout(800);
    await fp.locator('#c').screenshot({ path: OUT + f });
  }
  // アイコン（512×512）
  const ip = await b.newPage({ viewport: { width: 512, height: 512 } });
  await ip.setContent(`<body style="margin:0"><img src="${BASE}icon.png" style="width:512px;height:512px;display:block"></body>`);
  await ip.waitForTimeout(300);
  await ip.screenshot({ path: OUT + 'icon-512.png' });
  await b.close();
  server.close();
})();
