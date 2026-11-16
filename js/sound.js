/*
 * サウンド（BGM・効果音）
 * 音声ファイルを使わず Web Audio API でリアルタイム合成する。
 */
(function (global) {
  'use strict';

  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  const state = Object.assign({ bgm: true, sfx: true, bgmVol: 0.5, sfxVol: 0.6, track: 'calm' }, store.get('stereo.sound', {}));
  // BGMは既定でオン。ユーザーが自分でBGMボタンを操作した場合のみ、その選択を優先する
  if (!state.bgmSet) state.bgm = true;
  function save() { store.set('stereo.sound', state); }

  let ctx = null, master, bgmBus, sfxBus, delay, delayFb, delayWet;
  const listeners = [];

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);

    // 簡易リバーブ（フィードバックディレイ）
    delay = ctx.createDelay(1.5); delay.delayTime.value = 0.38;
    delayFb = ctx.createGain(); delayFb.gain.value = 0.42;
    const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 2400;
    delayWet = ctx.createGain(); delayWet.gain.value = 0.5;
    delay.connect(damp); damp.connect(delayFb); delayFb.connect(delay);
    damp.connect(delayWet); delayWet.connect(master);

    bgmBus = ctx.createGain(); bgmBus.gain.value = 0;
    bgmBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = state.sfxVol;
    sfxBus.connect(master);
    return ctx;
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------------- 効果音 ----------------
  function tone(opts) {
    const t = ctx.currentTime + (opts.at || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(opts.f, t);
    if (opts.f2) o.frequency.exponentialRampToValueAtTime(opts.f2, t + opts.d);
    const v = opts.v || 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (opts.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.d);
    o.connect(g); g.connect(opts.bus || sfxBus);
    if (opts.wet) { const s = ctx.createGain(); s.gain.value = opts.wet; g.connect(s); s.connect(delay); }
    o.start(t); o.stop(t + opts.d + 0.05);
  }

  const SFX = {
    click() { tone({ f: 1320, f2: 990, d: 0.07, v: 0.16, type: 'triangle' }); },
    nav() { tone({ f: 660, d: 0.09, v: 0.12, type: 'sine' }); tone({ f: 990, d: 0.12, v: 0.1, at: 0.05, type: 'sine' }); },
    toggle() { tone({ f: 880, f2: 1175, d: 0.1, v: 0.14, type: 'triangle' }); },
    start() { [60, 64, 67, 72].forEach((m, i) => tone({ f: mtof(m + 12), d: 0.25, v: 0.18, at: i * 0.07, type: 'triangle', wet: 0.3 })); },
    correct() {
      tone({ f: mtof(84), d: 0.18, v: 0.22, type: 'square', at: 0 });
      tone({ f: mtof(88), d: 0.35, v: 0.2, type: 'square', at: 0.09, wet: 0.3 });
      tone({ f: mtof(96), d: 0.5, v: 0.12, type: 'sine', at: 0.09, wet: 0.4 });
    },
    wrong() {
      tone({ f: 220, f2: 140, d: 0.35, v: 0.22, type: 'sawtooth' });
      tone({ f: 233, f2: 147, d: 0.35, v: 0.12, type: 'sawtooth' });
    },
    reveal() { [76, 81, 88].forEach((m, i) => tone({ f: mtof(m), d: 0.9, v: 0.12, at: i * 0.08, type: 'sine', wet: 0.6 })); },
    finish() {
      const seq = [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.52], [84, 0.64]];
      seq.forEach(([m, at]) => tone({ f: mtof(m), d: 0.3, v: 0.18, at, type: 'triangle', wet: 0.35 }));
      tone({ f: mtof(60), d: 1.2, v: 0.15, at: 0.64, type: 'sine', wet: 0.3 });
    },
    breathIn() { tone({ f: mtof(79), d: 1.6, v: 0.12, type: 'sine', a: 0.05, wet: 0.6 }); },
    breathOut() { tone({ f: mtof(72), d: 1.6, v: 0.12, type: 'sine', a: 0.05, wet: 0.6 }); },
    tick() { tone({ f: 1760, d: 0.04, v: 0.07, type: 'sine' }); }
  };

  function play(name) {
    if (!state.sfx) return;
    if (!ensure()) return;
    const fn = SFX[name];
    if (fn) fn();
  }

  // ---------------- BGM（ジェネレーティブ・アンビエント） ----------------
  const TRACKS = {
    calm: {
      name: 'やすらぎ', bar: 8,
      chords: [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]],
      scale: [72, 74, 76, 79, 81, 84, 86, 88], wave: 'triangle', cutoff: 1100, bellRate: 0.55, bellType: 'sine'
    },
    forest: {
      name: '森の朝', bar: 6,
      chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]],
      scale: [74, 76, 78, 81, 83, 86, 88, 90], wave: 'sine', cutoff: 1600, bellRate: 0.8, bellType: 'triangle', birds: true
    },
    space: {
      name: '宇宙遊泳', bar: 10,
      chords: [[38, 45, 52, 57], [36, 43, 50, 55], [41, 48, 53, 60], [34, 41, 48, 53]],
      scale: [69, 72, 74, 76, 79, 81, 84], wave: 'sawtooth', cutoff: 700, bellRate: 0.35, bellType: 'sine'
    }
  };

  let bgmTimer = null, nextBar = 0, barIndex = 0, nextBell = 0;
  let activeVoices = [];

  function padChord(notes, t, dur, tr) {
    notes.forEach((m, i) => {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = tr.wave;
        o.frequency.value = mtof(m);
        o.detune.value = det + (i % 2 ? 3 : -3);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = tr.cutoff; f.Q.value = 0.4;
        const g = ctx.createGain();
        const peak = (tr.wave === 'sawtooth' ? 0.04 : 0.045) * (i === 0 ? 1.3 : 1);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.35);
        g.gain.setValueAtTime(peak, t + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.25);
        o.connect(f); f.connect(g); g.connect(bgmBus);
        const s = ctx.createGain(); s.gain.value = 0.25; g.connect(s); s.connect(delay);
        o.start(t); o.stop(t + dur * 1.3);
        activeVoices.push(o);
      }
    });
  }

  function bell(t, tr) {
    const m = tr.scale[Math.floor(Math.random() * tr.scale.length)];
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tr.bellType; o.frequency.value = mtof(m);
    const v = 0.03 + Math.random() * 0.035;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g); g.connect(bgmBus);
    const s = ctx.createGain(); s.gain.value = 0.9; g.connect(s); s.connect(delay);
    o.start(t); o.stop(t + 2.3);
    activeVoices.push(o);
  }

  function bird(t) {
    const base = 2600 + Math.random() * 1400;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const st = t + i * 0.11;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(base, st);
      o.frequency.exponentialRampToValueAtTime(base * 1.35, st + 0.05);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, st + 0.09);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.018, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.1);
      o.connect(g); g.connect(bgmBus);
      const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(delay);
      o.start(st); o.stop(st + 0.12);
      activeVoices.push(o);
    }
  }

  function scheduler() {
    const tr = TRACKS[state.track] || TRACKS.calm;
    const ahead = ctx.currentTime + 0.6;
    while (nextBar < ahead) {
      padChord(tr.chords[barIndex % tr.chords.length], nextBar, tr.bar, tr);
      barIndex++;
      nextBar += tr.bar;
    }
    while (nextBell < ahead) {
      if (Math.random() < tr.bellRate) bell(nextBell, tr);
      if (tr.birds && Math.random() < 0.08) bird(nextBell + 0.3);
      nextBell += 0.6 + Math.random() * 0.9;
    }
    if (activeVoices.length > 300) activeVoices = activeVoices.slice(-200);
  }

  function startBgm() {
    if (!ensure() || bgmTimer) return;
    const t = ctx.currentTime;
    bgmBus.gain.cancelScheduledValues(t);
    bgmBus.gain.setValueAtTime(bgmBus.gain.value, t);
    bgmBus.gain.linearRampToValueAtTime(state.bgmVol, t + 2);
    nextBar = t + 0.05; nextBell = t + 1.5; barIndex = 0;
    scheduler();
    bgmTimer = setInterval(scheduler, 200);
  }

  function stopBgm(fade) {
    if (!ctx) return;
    clearInterval(bgmTimer); bgmTimer = null;
    const t = ctx.currentTime;
    bgmBus.gain.cancelScheduledValues(t);
    bgmBus.gain.setValueAtTime(bgmBus.gain.value, t);
    bgmBus.gain.linearRampToValueAtTime(0, t + (fade || 0.8));
    const voices = activeVoices; activeVoices = [];
    setTimeout(() => voices.forEach(o => { try { o.stop(); } catch (e) { /* already stopped */ } }), (fade || 0.8) * 1000 + 100);
  }

  function notify() { listeners.forEach(fn => fn(state)); }

  const Sound = {
    TRACKS,
    state,
    play,
    onChange(fn) { listeners.push(fn); },
    setBgm(on) {
      state.bgm = !!on; state.bgmSet = true; save();
      if (on) startBgm(); else stopBgm();
      notify();
    },
    setSfx(on) { state.sfx = !!on; save(); notify(); },
    setTrack(id) {
      if (!TRACKS[id]) return;
      state.track = id; save();
      if (state.bgm && bgmTimer) { stopBgm(0.6); setTimeout(() => { if (state.bgm) startBgm(); }, 700); }
      notify();
    },
    setBgmVol(v) {
      state.bgmVol = v; save();
      if (ctx && bgmTimer) bgmBus.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
    },
    setSfxVol(v) {
      state.sfxVol = v; save();
      if (ctx) sfxBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    },
    /** ユーザー操作後に呼ぶ（自動再生制限への対応） */
    unlock() {
      if (!ensure()) return;
      if (state.bgm && !bgmTimer) startBgm();
    }
  };

  // タブが非表示の間はBGMを止める
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (bgmTimer) stopBgm(0.3); }
    else if (state.bgm) startBgm();
  });

  global.Sound = Sound;
})(window);
