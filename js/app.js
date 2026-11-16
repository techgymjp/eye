(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DM = window.DepthMaps;
  const L = window.I18N;
  const nm = (o) => L.name(o);
  const ST = window.Stereo;

  // ---------------- 保存ユーティリティ ----------------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    }
  };

  // ---------------- 表示設定 ----------------
  const DEFAULTS = { mode: 'parallel', pattern: 'jewel', mu: 0.3, period: 96, dot: 1, dots: true };
  const settings = Object.assign({}, DEFAULTS, store.get('stereo.settings', {}));
  if (window.matchMedia('(max-width: 600px)').matches && !store.get('stereo.settings', null)) {
    settings.period = 76;
  }

  function saveSettings() { store.set('stereo.settings', settings); }

  // ---------------- ステレオグラム描画 ----------------
  const depthCache = new Map();
  const patternCache = new Map();
  let patternSeed = 1;

  function getDepth(shape, w, h, region) {
    const key = shape.id + ':' + (shape.customText || '') + ':' + w + 'x' + h + ':' + (region || 0.7);
    if (!depthCache.has(key)) {
      if (depthCache.size > 60) depthCache.clear();
      depthCache.set(key, DM.build(shape, w, h, { region }));
    }
    return depthCache.get(key);
  }
  function getPattern(type, w, h, period, seed) {
    const key = [type, w, h, period, seed].join(':');
    if (!patternCache.has(key)) {
      if (patternCache.size > 12) patternCache.clear();
      patternCache.set(key, ST.makePattern(type, w, h, period, seed));
    }
    return patternCache.get(key);
  }

  function isFullscreen(stage) {
    return (document.fullscreenElement || document.webkitFullscreenElement) === stage;
  }

  /** ステージの大きさに合わせたレンダリングサイズを計算 */
  function stageDims(stage, ratio) {
    const ds = settings.dot;
    let cssW, cssH;
    if (isFullscreen(stage)) {
      cssW = window.innerWidth; cssH = window.innerHeight - 40;
    } else {
      cssW = Math.min(stage.clientWidth || 800, 1040);
      cssH = cssW * (ratio || 0.58);
      cssH = Math.min(cssH, window.innerHeight * 0.68);
    }
    const w = Math.max(120, Math.floor(cssW / ds));
    const h = Math.max(80, Math.floor(cssH / ds));
    const period = Math.max(24, Math.round(settings.period / ds));
    return { w, h, ds, period };
  }

  function placeDots(dotsEl, periodCss) {
    if (!dotsEl) return;
    dotsEl.hidden = !settings.dots;
    const [a, b] = dotsEl.children;
    a.style.left = (-periodCss / 2 - 6) + 'px';
    b.style.left = (periodCss / 2 - 6) + 'px';
  }

  function renderStereo(canvas, shape, opts) {
    opts = opts || {};
    const stage = canvas.closest('.stage');
    const d = stageDims(stage, opts.ratio);
    const depth = opts.depth || getDepth(shape, d.w, d.h, opts.region);
    const pattern = getPattern(opts.pattern || settings.pattern, d.w, d.h, d.period, opts.seed || patternSeed);
    ST.drawToCanvas(canvas, depth, d.w, d.h, {
      period: d.period,
      mu: opts.mu || settings.mu,
      cross: settings.mode === 'cross',
      dotSize: d.ds
    }, pattern);
    placeDots(stage.querySelector('.guide-dots'), d.period * d.ds);
    return d;
  }

  function showDepthOverlay(overlay, shape, stereoCanvas, show) {
    if (!show) { overlay.hidden = true; return; }
    const w = Math.round(stereoCanvas.width / 3), h = Math.round(stereoCanvas.height / 3);
    DM.preview(overlay, getDepth(shape, w, h), w, h);
    overlay.style.width = stereoCanvas.width + 'px';
    overlay.style.height = stereoCanvas.height + 'px';
    overlay.hidden = false;
  }

  // ---------------- ルーティング ----------------
  const PAGES = ['home', 'gallery', 'training', 'focus', 'illusion', 'guide', 'record'];
  let current = null;
  const pageInit = {};
  const pageEnter = {};
  const pageLeave = {};

  function go(name) {
    if (!PAGES.includes(name)) name = 'home';
    if (current && pageLeave[current]) pageLeave[current]();
    PAGES.forEach(p => { $('page-' + p).hidden = p !== name; });
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
    $('nav').classList.remove('open');
    $('menuBtn').setAttribute('aria-expanded', 'false');
    $('settings').classList.toggle('hidden-on-page', name === 'illusion' || name === 'record');
    current = name;
    if (pageInit[name]) { pageInit[name](); pageInit[name] = null; }
    if (pageEnter[name]) pageEnter[name]();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  $('menuBtn').addEventListener('click', () => {
    const open = $('nav').classList.toggle('open');
    $('menuBtn').setAttribute('aria-expanded', String(open));
  });

  // 全画面
  document.querySelectorAll('[data-fullscreen]').forEach(btn => {
    btn.addEventListener('click', () => {
      const stage = $(btn.dataset.fullscreen);
      if (isFullscreen(stage)) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
        if (req) req.call(stage);
      }
    });
  });
  const onFs = () => setTimeout(rerenderCurrent, 80);
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);

  let resizeTimer;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) < 40 && !document.fullscreenElement) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rerenderCurrent, 200);
  });

  const rerender = {};
  function rerenderCurrent() { if (rerender[current]) rerender[current](); }

  // ---------------- 設定パネル ----------------
  (function initSettings() {
    const sel = $('setPattern');
    Object.keys(ST.PATTERNS).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = nm(ST.PATTERNS[k]); sel.appendChild(o);
    });
    function sync() {
      $('setMode').value = settings.mode;
      $('setPattern').value = settings.pattern;
      $('setDepth').value = settings.mu;
      $('setPeriod').value = settings.period;
      $('setDot').value = String(settings.dot);
      $('setDots').checked = settings.dots;
      $('outDepth').textContent = Math.round(settings.mu * 100) + '%';
      $('outPeriod').textContent = settings.period + 'px';
    }
    sync();
    let t;
    function changed() {
      settings.mode = $('setMode').value;
      settings.pattern = $('setPattern').value;
      settings.mu = parseFloat($('setDepth').value);
      settings.period = parseInt($('setPeriod').value, 10);
      settings.dot = parseInt($('setDot').value, 10);
      settings.dots = $('setDots').checked;
      sync(); saveSettings();
      clearTimeout(t); t = setTimeout(rerenderCurrent, 60);
    }
    ['setMode', 'setPattern', 'setDot', 'setDots'].forEach(id => $(id).addEventListener('change', changed));
    ['setDepth', 'setPeriod'].forEach(id => $(id).addEventListener('input', changed));
    $('setResetBtn').addEventListener('click', () => { Object.assign(settings, DEFAULTS); sync(); saveSettings(); rerenderCurrent(); });
    $('settingsToggle').addEventListener('click', () => {
      const body = $('settingsBody');
      body.hidden = !body.hidden;
      $('settingsToggle').setAttribute('aria-expanded', String(!body.hidden));
    });
  })();

  // ---------------- サウンド ----------------
  const SND = window.Sound;
  (function initSound() {
    const sel = $('setTrack');
    Object.keys(SND.TRACKS).forEach(k => {
      const o = document.createElement('option'); o.value = k; o.textContent = nm(SND.TRACKS[k]); sel.appendChild(o);
    });
    function sync(st) {
      $('bgmBtn').setAttribute('aria-pressed', String(st.bgm));
      $('sfxBtn').setAttribute('aria-pressed', String(st.sfx));
      $('bgmBtn').title = L.t(st.bgm ? 'bgm.stop' : 'bgm.play');
      $('sfxBtn').title = L.t(st.sfx ? 'sfx.off' : 'sfx.on');
      $('sfxBtn').firstChild.textContent = st.sfx ? '🔊' : '🔇';
      sel.value = st.track;
      $('setBgmVol').value = st.bgmVol;
      $('setSfxVol').value = st.sfxVol;
    }
    sync(SND.state);
    SND.onChange(sync);
    $('bgmBtn').addEventListener('click', () => { SND.setBgm(!SND.state.bgm); SND.play('toggle'); });
    $('sfxBtn').addEventListener('click', () => { SND.setSfx(!SND.state.sfx); SND.play('toggle'); });
    sel.addEventListener('change', () => SND.setTrack(sel.value));
    $('setBgmVol').addEventListener('input', (e) => SND.setBgmVol(parseFloat(e.target.value)));
    $('setSfxVol').addEventListener('input', (e) => SND.setSfxVol(parseFloat(e.target.value)));
    $('setSfxVol').addEventListener('change', () => SND.play('click'));

    // 自動再生制限：最初のユーザー操作で音声を有効化
    const unlock = () => { SND.unlock(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));

    // ボタン共通のクリック音（個別の音を持つボタンは data-sfx で指定）
    document.addEventListener('click', (e) => {
      const el = e.target.closest('button, .btn, .card, .nav a, .brand, select');
      if (!el || el.matches('select') || el.id === 'bgmBtn' || el.id === 'sfxBtn') return;
      if (el.dataset.sfx === 'none') return;
      SND.play(el.dataset.sfx || (el.matches('.nav a, .card, .brand, a.btn') ? 'nav' : 'click'));
    });
  })();

  // ---------------- ホーム ----------------
  rerender.home = () => renderStereo($('heroCanvas'), DM.byId['a-hearts'], { ratio: 0.62 });
  pageEnter.home = () => requestAnimationFrame(rerender.home);
  // hero はステージ外なので、専用サイズ計算
  (function patchHero() {
    const canvas = $('heroCanvas');
    rerender.home = () => {
      const ds = settings.dot;
      const cssW = Math.min(canvas.parentElement.clientWidth * (window.innerWidth > 760 ? 0.52 : 1), 560);
      const w = Math.floor(cssW / ds), h = Math.floor(cssW * 0.62 / ds);
      const period = Math.max(24, Math.round(Math.min(settings.period, cssW / 5) / ds));
      ST.drawToCanvas(canvas, getDepth(DM.byId['a-hearts'], w, h), w, h,
        { period, mu: settings.mu, cross: settings.mode === 'cross', dotSize: ds },
        getPattern(settings.pattern, w, h, period, 3));
    };
  })();

  // ---------------- ギャラリー ----------------
  const gallery = { cat: 'art', index: 0, reveal: false, custom: null };
  function galleryItems() {
    if (gallery.cat === 'custom') return gallery.custom ? [gallery.custom] : [];
    return DM.CATEGORIES.find(c => c.id === gallery.cat).items;
  }
  function galleryShape() { return galleryItems()[gallery.index]; }

  rerender.gallery = () => {
    const shape = galleryShape();
    if (!shape) return;
    renderStereo($('galleryCanvas'), shape);
    $('galleryTitle').textContent = L.t('quote', nm(shape));
    showDepthOverlay($('galleryDepth'), shape, $('galleryCanvas'), gallery.reveal);
    $('galleryReveal').textContent = L.t(gallery.reveal ? 'reveal.hide' : 'reveal.show');
    document.querySelectorAll('#galleryThumbs .thumb').forEach((t, i) => t.classList.toggle('active', i === gallery.index));
  };

  function buildGalleryThumbs() {
    const wrap = $('galleryThumbs');
    wrap.innerHTML = '';
    galleryItems().forEach((shape, i) => {
      const b = document.createElement('button');
      b.className = 'thumb';
      b.type = 'button';
      const c = document.createElement('canvas');
      b.appendChild(c);
      const s = document.createElement('span');
      s.textContent = nm(shape);
      b.appendChild(s);
      b.addEventListener('click', () => { gallery.index = i; gallery.reveal = false; rerender.gallery(); scrollToStage('galleryStage'); });
      wrap.appendChild(b);
      // 遅延描画
      setTimeout(() => DM.preview(c, getDepth(shape, 160, 100), 160, 100), 10 + i * 6);
    });
  }

  function scrollToStage(id) {
    const el = $(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    if (top < window.scrollY) window.scrollTo({ top, behavior: 'smooth' });
  }

  pageInit.gallery = () => {
    const tabs = $('galleryTabs');
    const cats = DM.CATEGORIES.map(c => ({ id: c.id, name: L.t('cat.count', nm(c), c.items.length) }));
    cats.forEach(c => {
      const b = document.createElement('button');
      b.textContent = c.name; b.dataset.cat = c.id; b.type = 'button';
      b.addEventListener('click', () => selectCat(c.id));
      tabs.appendChild(b);
    });
    function selectCat(id) {
      gallery.cat = id; gallery.index = 0; gallery.reveal = false;
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === id));
      buildGalleryThumbs(); rerender.gallery();
    }
    gallery.selectCat = selectCat;
    tabs.querySelector('button').classList.add('active');
    buildGalleryThumbs();

    const step = (d) => {
      const n = galleryItems().length;
      gallery.index = (gallery.index + d + n) % n; gallery.reveal = false; rerender.gallery();
    };
    $('galleryPrev').addEventListener('click', () => step(-1));
    $('galleryNext').addEventListener('click', () => step(1));
    $('galleryRandom').addEventListener('click', () => {
      const cats = DM.CATEGORIES;
      const c = cats[Math.floor(Math.random() * cats.length)];
      if (gallery.cat !== c.id) selectCat(c.id);
      gallery.index = Math.floor(Math.random() * c.items.length);
      gallery.reveal = false; rerender.gallery();
    });
    $('galleryReveal').addEventListener('click', () => { gallery.reveal = !gallery.reveal; if (gallery.reveal) SND.play('reveal'); rerender.gallery(); });
    $('galleryRegen').addEventListener('click', () => {
      patternSeed = (patternSeed % 9999) + 1;
      const keys = Object.keys(ST.PATTERNS);
      if (!$('settingsBody').hidden) { /* 手動設定中は模様の種類を維持 */ } else {
        settings.pattern = keys[(keys.indexOf(settings.pattern) + 1) % keys.length];
        $('setPattern').value = settings.pattern; saveSettings();
      }
      rerender.gallery();
    });
    $('galleryDownload').addEventListener('click', () => {
      const c = $('galleryCanvas');
      const a = document.createElement('a');
      a.download = 'stereogram-' + nm(galleryShape()) + '.png';
      a.href = c.toDataURL('image/png');
      a.click();
    });
    $('customMake').addEventListener('click', makeCustom);
    $('customText').addEventListener('keydown', (e) => { if (e.key === 'Enter') makeCustom(); });
    function makeCustom() {
      const txt = $('customText').value.trim();
      if (!txt) return;
      gallery.custom = {
        id: 'custom', customText: txt, name: txt, cat: 'custom',
        draw(ctx, w, h) {
          let size = h * 0.7;
          const font = (s) => `900 ${s}px "Hiragino Sans","Noto Sans JP","Yu Gothic","Meiryo",sans-serif`;
          ctx.font = font(size);
          const mw = ctx.measureText(txt).width;
          if (mw > w * 0.95) size *= (w * 0.95) / mw;
          ctx.font = font(size);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, w / 2, h / 2);
        }
      };
      gallery.cat = 'custom'; gallery.index = 0; gallery.reveal = false;
      tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      buildGalleryThumbs(); rerender.gallery(); scrollToStage('galleryStage');
    }
  };
  pageEnter.gallery = () => { syncSwatches(); requestAnimationFrame(rerender.gallery); };

  // 模様スウォッチ（ワンタップで模様を切り替え）
  function syncSwatches() {
    document.querySelectorAll('#patternSwatches .swatch').forEach(b => b.classList.toggle('active', b.dataset.pattern === settings.pattern));
  }
  (function initSwatches() {
    const wrap = $('patternSwatches');
    Object.keys(ST.PATTERNS).forEach(k => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.dataset.pattern = k; b.title = nm(ST.PATTERNS[k]);
      const c = document.createElement('canvas');
      const S = 56;
      c.width = S; c.height = S;
      const pat = ST.makePattern(k, S, S, S, 7);
      const img = new ImageData(S, S);
      const out = new Uint32Array(img.data.buffer);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) out[y * S + x] = pat.data[(y % pat.th) * pat.tw + (x % pat.tw)];
      c.getContext('2d').putImageData(img, 0, 0);
      const label = document.createElement('span'); label.textContent = nm(ST.PATTERNS[k]);
      b.append(c, label);
      b.addEventListener('click', () => {
        $('setPattern').value = k;
        $('setPattern').dispatchEvent(new Event('change'));
        syncSwatches();
      });
      wrap.appendChild(b);
    });
    $('setPattern').addEventListener('change', syncSwatches);
    syncSwatches();
  })();

  // ---------------- トレーニング ----------------
  const MU_LEVEL = { easy: 0.42, normal: 0.3, hard: 0.18 };
  const train = { running: false };

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function poolFor(set) {
    if (set === 'mix') return [].concat(...(L.lang === 'en' ? ['shape', 'number', 'alpha'] : ['shape', 'number', 'kana', 'kanji']).map(id => DM.CATEGORIES.find(c => c.id === id).items));
    return DM.CATEGORIES.find(c => c.id === set).items;
  }

  function nextQuestion() {
    const pool = poolFor(train.set);
    let shape;
    do { shape = pool[Math.floor(Math.random() * pool.length)]; } while (train.last && shape.id === train.last.id && pool.length > 1);
    train.last = shape;
    train.shape = shape;
    train.qStart = performance.now();
    train.answered = false;
    train.count++;
    patternSeed = (patternSeed % 9999) + 1;
    $('trainCount').textContent = train.count;
    $('trainFeedback').hidden = true;
    $('trainFeedback').textContent = '';
    $('trainDepth').hidden = true;
    rerender.training();

    const same = DM.CATEGORIES.find(c => c.id === shape.cat).items.filter(s => s.id !== shape.id);
    const opts = shuffle([shape].concat(shuffle(same.slice()).slice(0, 3)));
    const box = $('trainChoices');
    box.innerHTML = '';
    opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = nm(o); b.dataset.id = o.id; b.dataset.sfx = 'none';
      b.addEventListener('click', () => answer(o, b));
      box.appendChild(b);
    });
  }

  function answer(choice, btn) {
    if (train.answered) return;
    train.answered = true;
    const ok = choice && choice.id === train.shape.id;
    const secs = (performance.now() - train.qStart) / 1000;
    train.total++;
    if (ok) { train.correct++; train.times.push(secs); }
    $('trainScore').textContent = train.correct;
    $('trainChoices').querySelectorAll('button').forEach(b => {
      b.disabled = true;
      if (b.dataset.id === train.shape.id) b.classList.add('correct');
    });
    if (btn && !ok) btn.classList.add('wrong');
    SND.play(ok ? 'correct' : 'wrong');
    const fb = $('trainFeedback');
    fb.className = 'feedback ' + (ok ? 'good' : 'bad');
    fb.textContent = ok ? L.t('fb.ok', secs.toFixed(1)) : L.t('fb.ng', nm(train.shape));
    fb.hidden = false;
    showDepthOverlay($('trainDepth'), train.shape, $('trainCanvas'), !ok);
    clearTimeout(train.nextTimer);
    train.nextTimer = setTimeout(() => { if (train.running) nextQuestion(); }, ok ? 1300 : 2600);
  }

  rerender.training = () => {
    if (!train.running || !train.shape) return;
    renderStereo($('trainCanvas'), train.shape, { mu: train.mu, ratio: 0.46 });
  };

  function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

  function startTraining() {
    Object.assign(train, {
      running: true, count: 0, correct: 0, total: 0, times: [], last: null,
      set: $('trainSet').value, mu: MU_LEVEL[$('trainLevel').value],
      duration: parseInt($('trainDuration').value, 10), started: performance.now()
    });
    $('trainSetup').hidden = true; $('trainResult').hidden = true; $('trainRun').hidden = false;
    $('trainScore').textContent = '0';
    SND.play('start');
    nextQuestion();
    clearInterval(train.timer);
    const tick = () => {
      const left = train.duration - (performance.now() - train.started) / 1000;
      $('trainTime').textContent = fmt(left);
      if (left <= 0) finishTraining();
    };
    tick();
    train.timer = setInterval(tick, 250);
  }

  function finishTraining(aborted) {
    if (!train.running) return;
    train.running = false;
    clearInterval(train.timer); clearTimeout(train.nextTimer);
    const elapsed = Math.min(train.duration, (performance.now() - train.started) / 1000);
    if (elapsed >= 10) addRecord(elapsed, train.total, train.correct, train.times);
    if (aborted && elapsed < 10) { resetTrainingUI(); return; }
    $('trainRun').hidden = true; $('trainResult').hidden = false;
    SND.play('finish');
    const avg = train.times.length ? (train.times.reduce((a, b) => a + b, 0) / train.times.length) : null;
    const acc = train.total ? Math.round(train.correct / train.total * 100) : 0;
    $('trainResultStats').innerHTML = [
      [L.t('res.time'), fmt(elapsed)],
      [L.t('res.score'), `${train.correct} / ${train.total}`],
      [L.t('res.acc'), acc + '%'],
      [L.t('res.avg'), avg ? L.t('sec', avg.toFixed(1)) : '—']
    ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
  }
  function resetTrainingUI() {
    $('trainSetup').hidden = false; $('trainRun').hidden = true; $('trainResult').hidden = true;
  }

  pageInit.training = () => {
    $('trainStart').addEventListener('click', startTraining);
    $('trainQuit').addEventListener('click', () => finishTraining(true));
    $('trainSkip').addEventListener('click', () => answer(null, null));
    $('trainAgain').addEventListener('click', resetTrainingUI);
  };
  pageLeave.training = () => { if (train.running) finishTraining(true); resetTrainingUI(); };

  // ---------------- 記録 ----------------
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addRecord(seconds, total, correct, times) {
    const rec = store.get('stereo.records', {});
    const k = todayKey();
    const r = rec[k] || { sec: 0, total: 0, correct: 0, sessions: 0, timeSum: 0, timeN: 0 };
    r.sec += Math.round(seconds); r.total += total; r.correct += correct; r.sessions += 1;
    (times || []).forEach(t => { r.timeSum += t; r.timeN += 1; });
    rec[k] = r;
    store.set('stereo.records', rec);
  }
  function streak(rec) {
    let n = 0;
    const d = new Date();
    if (!rec[todayKey(d)]) d.setDate(d.getDate() - 1);
    while (rec[todayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  rerender.record = () => {
    const rec = store.get('stereo.records', {});
    const days = Object.keys(rec);
    const sum = (f) => days.reduce((a, k) => a + (rec[k][f] || 0), 0);
    const tot = sum('total'), cor = sum('correct'), tn = sum('timeN');
    $('recordStats').innerHTML = [
      [L.t('rec.streak'), L.t('days', streak(rec))],
      [L.t('rec.total'), L.t('min', Math.round(sum('sec') / 60))],
      [L.t('rec.sessions'), L.t('times', sum('sessions'))],
      [L.t('res.acc'), tot ? Math.round(cor / tot * 100) + '%' : '—'],
      [L.t('res.avg'), tn ? L.t('sec', (sum('timeSum') / tn).toFixed(1)) : '—']
    ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');

    const chart = $('recordChart');
    chart.innerHTML = '';
    const list = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); list.push(d); }
    const max = Math.max(60, ...list.map(d => (rec[todayKey(d)] || {}).sec || 0));
    list.forEach(d => {
      const r = rec[todayKey(d)];
      const sec = r ? r.sec : 0;
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = (sec / max * 100) + '%';
      bar.title = `${d.getMonth() + 1}/${d.getDate()} ${L.t('min', Math.round(sec / 60))}`;
      bar.innerHTML = `<small>${d.getMonth() + 1}/${d.getDate()}</small>${sec ? `<em>${L.t('min', Math.max(1, Math.round(sec / 60)))}</em>` : ''}`;
      if (!sec) bar.style.opacity = '.25';
      chart.appendChild(bar);
    });

    const cal = $('recordCalendar');
    cal.innerHTML = L.t('weekdays').map(c => `<div class="head">${c}</div>`).join('');
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first.getDay(); i++) cal.insertAdjacentHTML('beforeend', '<div style="background:none"></div>');
    for (let d = 1; d <= daysIn; d++) {
      const r = rec[todayKey(new Date(now.getFullYear(), now.getMonth(), d))];
      const lv = !r ? '' : r.sec >= 300 ? 'lv3' : r.sec >= 120 ? 'lv2' : 'lv1';
      cal.insertAdjacentHTML('beforeend', `<div class="${lv}">${d}</div>`);
    }
  };
  pageEnter.record = rerender.record;
  $('recordReset').addEventListener('click', () => {
    if (confirm(L.t('rec.confirm'))) { store.set('stereo.records', {}); rerender.record(); }
  });

  // ---------------- 遠近トレーニング ----------------
  const focus = { running: false, raf: 0, t0: 0, last: 0, logged: 0 };

  function focusFrame(now) {
    if (!focus.running) return;
    focus.raf = requestAnimationFrame(focusFrame);
    if (now - focus.last < 45) return; // 約22fps
    focus.last = now;
    const canvas = $('focusCanvas');
    const stage = $('focusStage');
    const d = stageDims(stage, 0.55);
    const shape = DM.byId[$('focusShape').value];
    const base = getDepth(shape, d.w, d.h, 0.42);
    const speed = parseFloat($('focusSpeed').value);
    const t = (now - focus.t0) / 1000 * speed;
    const motion = $('focusMotion').value;
    const out = focus.buf && focus.buf.length === d.w * d.h ? focus.buf : (focus.buf = new Float32Array(d.w * d.h));
    let amp = 1, ox = 0, oy = 0, msg = '';
    if (motion === 'pulse') {
      const s = Math.sin(t * Math.PI / 3);
      amp = 0.12 + 0.88 * (0.5 + 0.5 * s);
      msg = L.t(Math.cos(t * Math.PI / 3) > 0 ? 'focus.near' : 'focus.far');
    } else if (motion === 'swing') {
      ox = Math.round(Math.sin(t * 0.9) * d.w * 0.28);
      amp = 0.75;
      msg = L.t('focus.swing');
    } else if (motion === 'orbit') {
      ox = Math.round(Math.cos(t * 0.8) * d.w * 0.25);
      oy = Math.round(Math.sin(t * 0.8) * d.h * 0.22);
      amp = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.8));
      msg = L.t('focus.orbit');
    } else {
      const cyc = (t / speed) % 8;
      const inhale = cyc < 4;
      const p = inhale ? cyc / 4 : 1 - (cyc - 4) / 4;
      amp = 0.1 + 0.9 * (0.5 - 0.5 * Math.cos(p * Math.PI));
      msg = inhale ? L.t('focus.in', 4 - Math.floor(cyc)) : L.t('focus.out', 8 - Math.floor(cyc));
      if (focus.phase !== inhale) { focus.phase = inhale; SND.play(inhale ? 'breathIn' : 'breathOut'); }
    }
    const w = d.w, h = d.h;
    for (let y = 0; y < h; y++) {
      const sy = y - oy;
      const row = y * w;
      if (sy < 0 || sy >= h) { out.fill(0, row, row + w); continue; }
      const srow = sy * w;
      for (let x = 0; x < w; x++) {
        const sx = x - ox;
        out[row + x] = sx >= 0 && sx < w ? base[srow + sx] * amp : 0;
      }
    }
    renderStereo(canvas, shape, { depth: out, seed: 77 });
    $('focusMsg').textContent = msg;
    // 1分ごとに記録
    if (now - focus.logged > 60000) {
      addRecord(60, 0, 0, []);
      focus.logged = now;
    }
  }
  function focusStart() {
    focus.running = true; focus.phase = null; focus.t0 = performance.now(); focus.last = 0; focus.logged = performance.now();
    $('focusToggle').textContent = L.t('btn.stop');
    focus.raf = requestAnimationFrame(focusFrame);
  }
  function focusStop() {
    focus.running = false; cancelAnimationFrame(focus.raf);
    $('focusToggle').textContent = L.t('btn.start');
    $('focusMsg').textContent = '';
  }
  rerender.focus = () => {
    if (focus.running) { focus.last = 0; return; }
    renderStereo($('focusCanvas'), DM.byId[$('focusShape').value], { region: 0.42, ratio: 0.55, seed: 77 });
  };
  pageInit.focus = () => {
    $('focusToggle').addEventListener('click', () => focus.running ? focusStop() : focusStart());
    $('focusShape').addEventListener('change', rerender.focus);
  };
  pageEnter.focus = () => requestAnimationFrame(rerender.focus);
  pageLeave.focus = focusStop;
  document.addEventListener('visibilitychange', () => { if (document.hidden && focus.running) focusStop(); });

  // ---------------- 騙し絵 ----------------
  const ill = { index: 0, reveal: false, raf: 0, t0: 0 };
  const ILL = window.Illusions.LIST;

  function illDraw(now) {
    const item = ILL[ill.index];
    const c = $('illCanvas');
    const fs = isFullscreen($('illStage'));
    const W = fs ? window.innerWidth : 960, H = fs ? window.innerHeight : 600;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== W * dpr || c.height !== H * dpr) { c.width = W * dpr; c.height = H * dpr; }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    item.draw(ctx, W, H, { reveal: ill.reveal, t: ((now || performance.now()) - ill.t0) / 1000 });
    ctx.restore();
    const anim = item.animated || (item.id === 'jastrow' && ill.reveal);
    cancelAnimationFrame(ill.raf);
    if (anim && current === 'illusion') {
      ill.raf = requestAnimationFrame((ts) => setTimeout(() => illDraw(ts), item.id === 'afterimage' ? 200 : 16));
    }
  }
  function illShow(i) {
    ill.index = (i + ILL.length) % ILL.length;
    ill.reveal = false; ill.t0 = performance.now();
    const item = ILL[ill.index];
    $('illTitle').textContent = L.name(item, 'name');
    $('illKind').textContent = L.name(item, 'kind');
    $('illQ').textContent = L.name(item, 'q');
    $('illA').textContent = L.name(item, 'a');
    $('illA').hidden = true;
    $('illReveal').textContent = L.t('ill.reveal');
    document.querySelectorAll('#illThumbs .thumb').forEach((t, k) => t.classList.toggle('active', k === ill.index));
    illDraw();
  }
  rerender.illusion = () => illDraw();
  pageInit.illusion = () => {
    const wrap = $('illThumbs');
    ILL.forEach((item, i) => {
      const b = document.createElement('button');
      b.className = 'thumb'; b.type = 'button';
      const c = document.createElement('canvas');
      c.width = 240; c.height = 150;
      const ctx = c.getContext('2d');
      item.draw(ctx, 240, 150, { reveal: false, t: 0 });
      const s = document.createElement('span'); s.textContent = L.name(item, 'name');
      b.append(c, s);
      b.addEventListener('click', () => { illShow(i); scrollToStage('illStage'); });
      wrap.appendChild(b);
    });
    $('illPrev').addEventListener('click', () => illShow(ill.index - 1));
    $('illNext').addEventListener('click', () => illShow(ill.index + 1));
    $('illReveal').addEventListener('click', () => {
      ill.reveal = !ill.reveal;
      if (ill.reveal) SND.play('reveal');
      $('illA').hidden = !ill.reveal;
      $('illReveal').textContent = L.t(ill.reveal ? 'ill.back' : 'ill.reveal');
      illDraw();
    });
  };
  pageEnter.illusion = () => illShow(ill.index);
  pageLeave.illusion = () => cancelAnimationFrame(ill.raf);

  // ---------------- 見方ガイド ----------------
  rerender.guide = () => renderStereo($('practiceCanvas'), DM.byId.circle, { ratio: 0.45, mu: 0.4, seed: 5 });
  pageEnter.guide = () => requestAnimationFrame(rerender.guide);

  // ---------------- 言語切り替え ----------------
  $('langLabel').textContent = L.t('lang.switch');
  $('langShort').textContent = L.t('lang.short');
  $('langBtn').addEventListener('click', () => L.setLang(L.lang === 'en' ? 'ja' : 'en'));

  // ---------------- 起動 ----------------
  go(location.hash.slice(1) || 'home');
})();
