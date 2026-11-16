/*
 * 多言語対応（日本語 / English）
 * - HTML内の静的テキスト: data-i18n="key"（innerHTML を置換）、data-i18n-attr="attr:key;attr2:key2"
 * - 日本語は HTML にそのまま書き、英語のみここで定義する
 * - JS で生成するテキスト: I18N.t(key, ...args)
 */
(function (global) {
  'use strict';

  function detect() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'ja' || q === 'en') return q;
      const saved = localStorage.getItem('stereo.lang');
      if (saved === 'ja' || saved === 'en') return saved;
    } catch (e) { /* ignore */ }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'ja';
    return /^ja/i.test(nav) ? 'ja' : 'en';
  }

  const lang = detect();

  // ---------- 静的テキスト（英語） ----------
  const STATIC_EN = {
    'meta.title': '3D Eye Training Stereograms',
    'meta.desc': 'Relax and train your eyes with stereograms (Magic Eye–style 3D images) and optical illusions. Free web app supporting parallel and cross-eyed viewing.',
    'brand.main': '3D Eye Training',
    'brand.sub': 'STEREOGRAMS',
    'menu': 'Menu',
    'sfx.label': 'SFX',
    'nav.home': 'Home', 'nav.gallery': '3D Art', 'nav.training': 'Training', 'nav.focus': 'Focus Training',
    'nav.illusion': 'Illusions', 'nav.guide': 'How to View', 'nav.record': 'Records',
    'home.sample': 'Sample stereogram',
    'home.h1': 'Refresh your eyes<br>with stereograms.',
    'home.p': 'Gaze softly at a strange pattern, and a picture <strong>pops out in 3D</strong>.<br>Just a few minutes of stereo-vision training a day helps relax eye muscles stiffened by screens and phones.',
    'home.start': 'Start Training', 'home.learn': 'How to View',
    'card.gallery.t': '3D Art', 'card.gallery.p': '80+ images: 3D art, solids, shapes and letters. Freely change the pattern and depth.',
    'card.training.t': 'Training', 'card.training.p': 'A quiz: find the hidden picture. Records how long it took to see and your accuracy.',
    'card.focus.t': 'Focus Training', 'card.focus.p': 'Follow a 3D object moving near and far to loosen your focusing muscles.',
    'card.illusion.t': 'Illusions', 'card.illusion.p': 'Impossible figures, optical illusions and afterimages that fool your brain — with explanations.',
    'home.notice': '* This app is intended for eye relaxation and training. It is not a medical treatment and does not guarantee any improvement in eyesight. Stop immediately if you feel eye pain, a headache or discomfort. If you have an eye condition, please consult a doctor.',
    'gallery.h2': '3D Art Gallery',
    'fullscreen': 'Full screen',
    'btn.prev': '◀ Prev', 'btn.next': 'Next ▶', 'btn.random': 'Random', 'btn.reveal': 'Show answer',
    'btn.regen': 'New pattern', 'btn.save': 'Save',
    'gallery.pattern': 'Pattern',
    'custom.summary': 'Type text to make your own 3D image',
    'custom.ph': 'e.g. HELLO / LOVE', 'custom.make': 'Create',
    'train.h2': 'Stereo Vision Training',
    'train.intro': 'Find the picture hidden in the stereogram and pick it from four choices. Your time-to-see and accuracy are recorded.',
    'train.duration': 'Time', 'train.min1': '1 min', 'train.min3': '3 min', 'train.min5': '5 min',
    'train.set': 'Questions', 'set.shape': 'Shapes', 'set.number': 'Numbers', 'set.alpha': 'Letters (A–Z)',
    'set.kana': 'Hiragana', 'set.kanji': 'Kanji', 'set.mix': 'Mix',
    'train.level': 'Difficulty', 'level.easy': 'Easy (deep)', 'level.normal': 'Normal', 'level.hard': 'Hard (shallow)',
    'btn.start': 'Start', 'train.left': 'Time', 'train.q': 'Question', 'train.correct': 'Correct', 'btn.quit': 'Quit',
    'train.skip': "I can't see it (show answer)",
    'train.done': 'Well done!',
    'train.tip': 'Close your eyes and rest for about 10 seconds. Looking at distant scenery is also good.',
    'btn.again': 'Try again',
    'focus.h2': 'Focus Training',
    'focus.lead': 'Once you see the 3D object, keep your gaze on it and follow it as it moves toward you and away. The motion is designed to stretch the muscles that adjust your focus (ciliary muscles).',
    'focus.motion': 'Motion', 'motion.pulse': 'Near & far', 'motion.swing': 'Side to side', 'motion.orbit': 'Circling',
    'motion.breath': 'Breathing (4s in, 4s out)',
    'focus.object': 'Object', 'obj.heart': 'Heart', 'obj.star': 'Star', 'obj.sphere': 'Sphere', 'obj.circle': 'Circle', 'obj.torus': 'Torus',
    'focus.speed': 'Speed',
    'ill.h2': 'Optical Illusion Collection',
    'ill.lead': 'Your brain “interprets” what your eyes see. Answer the question first, then press “Reveal”.',
    'btn.illReveal': 'Reveal',
    'guide.h2': 'How to View Stereograms',
    'guide.parallel': 'Parallel viewing (recommended)',
    'guide.parallel.d': 'Eyes parallel (look far)',
    'guide.p1': 'Sit about 30–40 cm from the screen and gaze softly as if looking <strong>far beyond the screen</strong>.',
    'guide.p2': 'Another good method: bring your face close to the screen, then slowly move back without focusing.',
    'guide.p3': 'When the <strong>two dots look like three</strong>, you are there. Lower your gaze to the pattern and the 3D image appears.',
    'guide.cross': 'Cross-eyed viewing',
    'guide.cross.d': 'Cross your eyes (in front)',
    'guide.c1': 'Hold a finger between your eyes and the screen, and look at the fingertip.',
    'guide.c2': 'Keeping focus on your finger, move it back and forth until the <strong>two dots become three</strong>.',
    'guide.c3': 'Gently remove your finger and look at the pattern. Switch “Viewing” to <strong>Cross-eyed</strong> in Display Settings.',
    'guide.tips': 'Tips',
    'guide.t1': 'Keep the room bright and the screen slightly dimmer.',
    'guide.t2': 'Full screen (⛶ button) makes it easier to see.',
    'guide.t3': 'If it is hard to see, try a smaller “Pattern width” or larger “Dot size”.',
    'guide.t4': 'Checking the hidden picture first with “Show answer” makes it easier to find.',
    'guide.t5': 'Once you see it, the 3D image stays for a while even if you move your eyes.',
    'guide.safety': 'Using it safely',
    'guide.s1': 'Aim for <strong>3–5 minutes</strong> per session, a few times a day at most.',
    'guide.s2': 'Also make the “20-20-20 rule” a habit: every 20 minutes, look at something 20 feet (6 m) away for 20 seconds.',
    'guide.s3': 'If you feel eye strain, pain, headache or dizziness, stop and rest right away.',
    'guide.s4': 'If you are being treated for strabismus or amblyopia, or for use by children, please consult a doctor.',
    'guide.practice': 'Practice: turn two dots into three',
    'guide.practice.p': 'Adjust your gaze so the two dots above the image overlap in the middle and look like three. You have succeeded when a “circle” floats up in the center.',
    'rec.h2': 'Training Records', 'rec.14': 'Last 14 days', 'rec.cal': 'Calendar',
    'rec.note': 'Records are saved only in this browser.', 'rec.reset': 'Reset records',
    'set.toggle': '⚙ Display Settings', 'set.title': 'Display Settings', 'close': 'Close', 'set.mode': 'Viewing', 'mode.parallel': 'Parallel', 'mode.cross': 'Cross-eyed',
    'set.pattern': 'Pattern', 'set.depth': 'Depth', 'set.period': 'Pattern width', 'set.dot': 'Dot size',
    'dot.s': 'Small', 'dot.m': 'Medium', 'dot.l': 'Large', 'set.dots': 'Show guide dots',
    'set.bgm': 'BGM', 'set.bgmVol': 'BGM volume', 'set.sfxVol': 'Sound effects volume', 'set.reset': 'Reset to defaults',
    'footer': '3D Eye Training Stereograms — gentle on your eyes, a little every day.',
    'btn.share': 'Share result', 'btn.home': 'Back to Home',
    'retry.q': 'Try this one again?', 'retry.watch': 'Watch an ad to retry', 'retry.no': 'Show answer',
    'legal.privacy': 'Privacy Policy', 'legal.adSettings': 'Ad settings'
  };

  // ---------- JSで生成するテキスト ----------
  const DYN = {
    ja: {
      'bgm.stop': 'BGMを止める', 'bgm.play': 'BGMを流す', 'sfx.off': '効果音をオフ', 'sfx.on': '効果音をオン',
      'quote': (s) => '「' + s + '」',
      'reveal.hide': '答えを隠す', 'reveal.show': '答えを見る',
      'cat.count': (name, n) => name + '（' + n + '）',
      'fb.ok': (s) => `正解！ ${s}秒`, 'fb.ng': (n) => `答えは「${n}」`,
      'res.time': 'トレーニング時間', 'res.score': '正解数', 'res.acc': '正解率', 'res.avg': '見えるまでの平均',
      'sec': (v) => v + '秒', 'min': (v) => v + '分', 'days': (v) => v + '日', 'times': (v) => v + '回',
      'rec.streak': '連続日数', 'rec.total': '合計時間', 'rec.sessions': 'トレーニング回数',
      'weekdays': '日月火水木金土'.split(''),
      'rec.confirm': 'トレーニング記録をすべて削除しますか？',
      'focus.near': '手前に近づいてくる…', 'focus.far': '奥へ遠ざかる…',
      'focus.swing': '左右の動きを目で追いましょう', 'focus.orbit': 'ぐるぐる回る立体を追いかけましょう',
      'focus.in': (n) => '吸って… ' + n, 'focus.out': (n) => '吐いて… ' + n,
      'btn.stop': 'ストップ', 'btn.start': 'スタート',
      'ill.reveal': '種明かし', 'ill.back': '元に戻す',
      'ill.near': '手前', 'ill.far': '奥…のはず',
      'ill.remain': (n) => `あと ${n} 秒`, 'ill.pressReveal': '「種明かし」を押してください',
      'lang.switch': 'English', 'lang.short': 'EN',
      'url.privacy': 'https://techgym.jp/privacy-policy/',
      'retry.left': (n) => `（残り${n}回）`, 'res.retries': 'やり直し', 'fb.wrong': '不正解…',
      'share.text': (c, t, acc, avg, r) => `3D視力回復 ステレオグラムで立体視トレーニング！正解 ${c}/${t}（${acc}%）` + (avg ? `・見えるまで平均 ${avg}秒` : '') + (r ? `・やり直し ${r}回` : ''),
      'share.title': '3D視力回復 ステレオグラム', 'share.dialog': '結果をシェア',
      'share.copied': '結果をコピーしました', 'share.copyFail': 'コピーできませんでした'
    },
    en: {
      'bgm.stop': 'Stop BGM', 'bgm.play': 'Play BGM', 'sfx.off': 'Sound effects off', 'sfx.on': 'Sound effects on',
      'quote': (s) => '“' + s + '”',
      'reveal.hide': 'Hide answer', 'reveal.show': 'Show answer',
      'cat.count': (name, n) => name + ' (' + n + ')',
      'fb.ok': (s) => `Correct! ${s}s`, 'fb.ng': (n) => `Answer: “${n}”`,
      'res.time': 'Training time', 'res.score': 'Correct answers', 'res.acc': 'Accuracy', 'res.avg': 'Avg. time to see',
      'sec': (v) => v + 's', 'min': (v) => v + ' min', 'days': (v) => v + (v === 1 ? ' day' : ' days'), 'times': (v) => String(v),
      'rec.streak': 'Day streak', 'rec.total': 'Total time', 'rec.sessions': 'Sessions',
      'weekdays': ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      'rec.confirm': 'Delete all training records?',
      'focus.near': 'Coming closer…', 'focus.far': 'Moving away…',
      'focus.swing': 'Follow the side-to-side motion with your eyes', 'focus.orbit': 'Follow the circling object',
      'focus.in': (n) => 'Breathe in… ' + n, 'focus.out': (n) => 'Breathe out… ' + n,
      'btn.stop': 'Stop', 'btn.start': 'Start',
      'ill.reveal': 'Reveal', 'ill.back': 'Back',
      'ill.near': 'Near', 'ill.far': 'Far…supposedly',
      'ill.remain': (n) => `${n} s left`, 'ill.pressReveal': 'Now press “Reveal”',
      'lang.switch': '日本語', 'lang.short': 'JA',
      'url.privacy': 'https://techgym.jp/privacy-policy-en/',
      'retry.left': (n) => `(${n} left)`, 'res.retries': 'Retries', 'fb.wrong': 'Not quite…',
      'share.text': (c, t, acc, avg, r) => `Stereo vision training with 3D Eye Training! ${c}/${t} correct (${acc}%)` + (avg ? `, avg. ${avg}s to see` : '') + (r ? `, ${r} retr${r === 1 ? 'y' : 'ies'}` : ''),
      'share.title': '3D Eye Training Stereograms', 'share.dialog': 'Share result',
      'share.copied': 'Result copied to clipboard', 'share.copyFail': 'Could not copy'
    }
  };

  function t(key) {
    const args = Array.prototype.slice.call(arguments, 1);
    const v = (DYN[lang] && DYN[lang][key] !== undefined) ? DYN[lang][key] : DYN.ja[key];
    return typeof v === 'function' ? v.apply(null, args) : (v !== undefined ? v : key);
  }

  /** オブジェクトの表示名（英語なら en / nameEn を優先） */
  function name(obj, field) {
    if (!obj) return '';
    field = field || 'name';
    if (lang === 'en') {
      const en = obj[field + 'En'] || (field === 'name' ? obj.en : undefined);
      if (en) return en;
    }
    return obj[field];
  }

  function apply(root) {
    root = root || document;
    document.documentElement.lang = lang;
    if (lang === 'ja') return;
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const v = STATIC_EN[el.getAttribute('data-i18n')];
      if (v !== undefined) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
        const [attr, key] = pair.split(':');
        if (STATIC_EN[key] !== undefined) el.setAttribute(attr, STATIC_EN[key]);
      });
    });
    document.title = STATIC_EN['meta.title'];
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', STATIC_EN['meta.desc']);
  }

  function setLang(l) {
    try { localStorage.setItem('stereo.lang', l); } catch (e) { /* ignore */ }
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      location.href = url.toString();
    } else {
      location.reload();
    }
  }

  global.I18N = { lang, t, name, apply, setLang };
})(window);
