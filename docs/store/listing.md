# Google Play ストア掲載情報（下書き）

パッケージ名：`jp.techgym.eye`／カテゴリ：ゲーム（パズル）または 健康＆フィットネス／無料／広告あり

> 注意：「視力回復」は効果をうたう表現と受け取られるおそれがあります。説明文では「効果を保証しない」「医療行為ではない」ことを必ず添えてください。審査で指摘された場合は、アプリ名を「3D アイトレーニング ステレオグラム」などに変える案もあります。

## 画像（`docs/store/`）

| 用途 | ファイル | サイズ |
| --- | --- | --- |
| アプリのアイコン | `icon-512.png` | 512 × 512 |
| フィーチャー グラフィック | `feature-graphic.png`（日本語）／`feature-graphic-en.png`（英語） | 1024 × 500 |
| スマートフォンのスクリーンショット | `ja-1-home.png` 〜 `ja-6-record.png`（日本語）／`en-1-home.png` 〜 `en-6-record.png`（英語） | 1080 × 1920（縦） |

スクリーンショットは 1 ホーム → 2 3Dアート → 3 トレーニング → 4 遠近トレーニング → 5 騙し絵 → 6 記録 の順に登録します。
撮り直すときは `npm run build:app && node scripts/store/shoot.js`（Playwright が必要）。記録の画面は見本のデータで撮っています。

## 日本語（ja-JP）

**アプリ名**（30 字以内）

3D視力回復 ステレオグラム

**簡単な説明**（80 字以内）

ステレオグラムと騙し絵で、楽しく目のトレーニング。見つめると絵が立体に浮かび上がる！

**詳しい説明**

不思議な模様をぼんやり眺めていると、隠れた絵が立体的に浮かび上がる――
「3D視力回復 ステレオグラム」は、ステレオグラム（立体視）と騙し絵で、スマホで疲れた目をリフレッシュするアプリです。

■ 3Dアート ギャラリー
浮かぶハート、星空、土星、らせん階段など、80 種類以上の 3D 画像。
カラフル図形・レインボー糸・ステンドグラスなど 15 種類の模様から選べます。好きな文字を入れてオリジナルの 3D 画像も作れます。

■ 立体視トレーニング
ステレオグラムに隠れた絵を 4 択で当てるクイズ。1・3・5 分のコースと 3 段階の難易度。
見えるまでの時間と正解率を記録します。

■ 遠近トレーニング
浮き沈み・左右・回転・呼吸のリズムで動く立体を目で追います。

■ 騙し絵・錯視コレクション
不可能な三角形、ルビンの壺、ネッカーの立方体、カフェウォール錯視、残像トリックなど 15 種類を種明かし付きで。

■ そのほか
・平行法／交差法の両方に対応。見方ガイドと練習画像つき
・連続日数・合計時間・カレンダーで記録を確認
・やさしい BGM と効果音（オン・オフ可）
・日本語／英語に対応。オフラインでも使えます

※ 本アプリは目のリラックス・トレーニングを目的としたもので、医療行為ではなく、視力回復の効果を保証するものではありません。目の痛み・頭痛・気分の悪さを感じたら直ちに中止してください。目の病気がある方は医師にご相談ください。

## English（en-US）

**App name** (max 30)

3D Eye Training: Stereograms

**Short description** (max 80)

Relax your eyes with stereograms and illusions. Watch pictures pop out in 3D!

**Full description**

Gaze softly at a strange pattern, and a hidden picture pops out in 3D.
3D Eye Training: Stereograms helps you refresh eyes tired from screens with stereograms (Magic Eye–style 3D images) and optical illusions.

■ 3D Art Gallery
80+ 3D images, including floating hearts, a starry sky, Saturn and a spiral staircase.
Choose from 15 patterns such as Colorful Shapes, Rainbow Threads and Stained Glass, or type your own text to make an original 3D image.

■ Stereo Vision Training
A quiz: find the picture hidden in the stereogram and pick it from four choices. 1-, 3- and 5-minute sessions with three difficulty levels.
Your time-to-see and accuracy are recorded.

■ Focus Training
Follow a 3D object that moves near and far, side to side, in circles or with your breathing.

■ Optical Illusion Collection
15 illusions with explanations, including the impossible triangle, Rubin's vase, the Necker cube, the café wall illusion and an afterimage trick.

■ Also
- Supports both parallel and cross-eyed viewing, with a viewing guide and practice image
- Track your streak, total time and a calendar
- Gentle background music and sound effects (can be turned off)
- Japanese and English. Works offline

* This app is intended for eye relaxation and training. It is not a medical treatment and does not guarantee any improvement in eyesight. Stop immediately if you feel eye pain, a headache or discomfort. If you have an eye condition, please consult a doctor.

## リリースノート（初回）

```
<ja-JP>
初めてのリリースです。
</ja-JP>
<en-US>
First release.
</en-US>
```
