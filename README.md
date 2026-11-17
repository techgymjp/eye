# 3D視力回復 ステレオグラム / 3D Eye Training Stereograms

ステレオグラム（立体視）と騙し絵で、楽しく目のトレーニングができるWEBアプリです。
Web 版はビルド不要の静的サイトで、GitHub Pages（`main` ブランチ / ルート）でそのまま公開しています。
Android アプリ版（Capacitor）もこのリポジトリから作ります（下の「Android アプリ」）。

## 機能
- **日本語 / English** … ブラウザの言語設定で自動切り替え。ヘッダーの🌐ボタン、または URL に `?lang=en` / `?lang=ja` で指定可能（英語版のトレーニングはA〜Zのアルファベット問題）
- **3Dアート ギャラリー** … 3Dアート18種・立体8種・図形・数字・ひらがな・漢字など80種類以上。オリジナル文字の3D化、PNG保存、全画面表示
- **トレーニング** … 隠れた絵を4択で当てるクイズ。見えるまでの時間・正解率を記録
- **遠近トレーニング** … 浮き沈み／左右／回転／呼吸リズムで動くアニメーション・ステレオグラム
- **騙し絵・錯視** … 不可能な三角形、ルビンの壺、ネッカーの立方体、カフェウォール、周辺ドリフト、残像など15種（種明かし付き）
- **見方ガイド** … 平行法・交差法の解説と練習用画像
- **記録** … 連続日数・合計時間・カレンダー（ブラウザ内に保存）
- **BGM・効果音** … Web Audio APIで合成（音声ファイル不要）。BGM3曲（やすらぎ／森の朝／宇宙遊泳）、ボタン音・正解/不正解音・呼吸ガイド音など。既定でON（ブラウザの制限により最初のタップ・クリック後に再生開始）、ヘッダーでON/OFF、表示設定で音量調整
- **表示設定** … 平行法/交差法、15種の模様（カラフル図形・レインボー糸・パステル落書き・ステンドグラス・ネオン・キャンディ・花畑・マーブルなどのテクスチャ型と、ランダムドット型）、奥行きの強さ、パターン幅、ドットサイズ、ガイド点

## ローカルで確認
```bash
python3 -m http.server 8000
```

## 構成
- `index.html` / `css/style.css`
- `js/stereogram.js` … SIRDS生成エンジン（Thimblebyらのアルゴリズム、隠面処理付き）
- `js/depthmaps.js` … 奥行きマップ（3Dアート・図形・文字）
- `js/illusions.js` … 騙し絵・錯視
- `js/i18n.js` … 多言語対応（日本語はHTMLに記述、英語訳をここに定義）
- `js/sound.js` … BGM・効果音（Web Audio API）
- `js/app.js` … 画面・トレーニング・記録・アプリ用の処理（戻るボタン・シェアなど）
- `js/ads.js` … Google AdMob 広告（Android アプリのときだけ動く）
- `js/ads-config.js` / `js/build-info.js` … ビルド時に `scripts/build-web.js` が上書きする（Web 版では既定値のまま）
- `scripts/build-web.js` … Web / アプリ用のファイルを `www/` にまとめる
- `android/` … Android プロジェクト（Capacitor）
- `assets/` … アプリのアイコンと起動画面の元画像

※ 本アプリは目のリラックスを目的としたもので、医療行為ではなく視力回復の効果を保証するものではありません。

## Android アプリ

パッケージ名は `jp.techgym.eye` です（Google Play に一度公開すると変更できません）。
[Capacitor](https://capacitorjs.com/) で Web 版のファイルをアプリ内に同梱しているため、ネットにつながっていなくても使えます（広告の読み込みを除く）。

- 縦画面・全画面表示（ステータスバー／ナビゲーションバーを隠す）
- トレーニング中は画面が暗くならない
- Android の戻るボタン：設定やメニューを閉じる → トレーニング中なら終了して結果へ → ホームへ → ホームではアプリを終了
- 別のアプリに切り替えると、音が止まり、トレーニングのタイマーも止まる
- 結果の「シェア」は Android の共有メニューから LINE や X などを選べる（コラム記事へのリンク付き）
- ホームにビルド番号とプライバシーポリシーへのリンクを表示（EU など同意が必要な地域では「広告の設定」も）
- アプリでは、Web 版だけの機能（ギャラリーの画像保存）を `npm run build:app` で取り除く

### 動作確認用 APK

既定ブランチ（`main`）のビルドは GitHub の Release（`android-latest`）に自動で載ります。Android 端末で次のページを開くか、QR コードを読み取ってください。

- リリース画面：https://github.com/techgymjp/eye/releases/tag/android-latest
- APK を直接ダウンロード：https://github.com/techgymjp/eye/releases/latest/download/eye.apk

<img src="docs/apk-qr.png" alt="リリース画面の QR コード" width="180">

インストール時に「提供元不明のアプリ」の許可が必要です。動作確認用 APK は常に **Google のテスト広告** を表示します。

### 広告（Google AdMob）

Android アプリでのみ広告を表示します（Web 版には広告は出ません）。

| 広告 | 出す場面 |
| --- | --- |
| バナー | ホーム・見方ガイド・記録・トレーニングの開始画面と結果画面の下中央だけ（ステレオグラムを見ている画面では出さない） |
| インタースティシャル（全画面） | トレーニングの「スタート」、結果画面の「もう一度」、遠近トレーニングの「スタート」、見方ガイドや結果画面からホームに戻るとき（毎回） |
| リワード | トレーニングで答えを外したとき、2.5 秒後に「広告を見てやり直す」を表示（6 秒で自動的に消えて答えを表示）。最後まで見ると、その問題の成績を取り消し、同じ模様・同じ選択肢の並びでもう一度挑戦できる（1 回のトレーニングで 5 回まで。結果画面とシェア文に「やり直し N 回」と表示） |

- やり直しの案内と広告の間は、トレーニングのタイマーを止めます。
- EU・英国など同意が必要な地域では、初回起動時に Google の同意確認画面が出ます。その地域では、ホームの「広告の設定」から同意内容をいつでも変更できます。
- 広告ユニット ID は `js/ads.js`、AdMob のアプリ ID は `android/app/src/main/res/values/strings.xml` にあります。本番の ID が空の種類は、Google Play 用のビルドでは出しません（現在はバナー・インタースティシャル・リワードとも本番の ID を設定済み）。
- Google Play 用の .aab をビルドするときだけ、CI が `ADMOB_MODE=production` で本番の広告に切り替えます。
- 本番の広告を自分でタップするとアカウント停止の対象になるので注意してください。

### ビルド方法

GitHub Actions（`.github/workflows/android.yml`）が push のたびにビルドします。

1. `npm ci` → `npm run build:app` → `npx cap sync android` → `./gradlew assembleDebug`（動作確認用 APK）
2. 既定ブランチなら Release `android-latest` の APK を差し替える
3. GitHub Secrets（`ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD`）があれば、本番広告で署名付き AAB（Google Play 用）を作り、Artifact `eye-release-aab` に上げる

手元でビルドする場合は Android Studio を入れて `npm ci` → `npm run android:sync` → `npm run android:open`。

## ライセンス

著作権はテックジム株式会社に帰属します（All rights reserved）。許可なく複製・改変・再配布すること、Web サイトやアプリ（Google Play、App Store など）として公開・販売すること、名前・ロゴ・アイコン・画像を使うことを禁止します。
テックジムの受講生が学習目的で複製・改変することは許可します（アプリストアでの公開・広告の掲載・販売などの商用利用は不可、著作権表示は残すこと）。詳しくは [LICENSE](LICENSE) をご覧ください。
