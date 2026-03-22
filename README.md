# 倉庫番

バニラ HTML / CSS / JavaScript 製の倉庫番ゲームです。

デモURL: https://sadaakiemuravaltes.github.io/soukoban-html/

## 遊び方

箱（茶色ブロック）をすべてゴール（×印）に押し込めばクリアです。
箱は引けないので、行き詰まったらアンドゥかリスタートを使いましょう。

| キー | 操作 |
|------|------|
| ← → ↑ ↓ | プレイヤー移動・箱押し |
| Z | 1手アンドゥ |
| R | ステージリスタート |

## ステージ構成

全 10 ステージ（チュートリアルから難しめまで段階的に難しくなります）

## ファイル構成

```
soukoban-html/
├── index.html   # HTML 構造
├── style.css    # スタイル（ダークテーマ）
├── levels.js    # 10 ステージのマップ定義
└── game.js      # ゲームロジック・Canvas 描画
```

## 技術スタック

- HTML5 Canvas（描画）
- バニラ JavaScript（ゲームロジック）
- CSS3（レイアウト・モーダル）

## 実行方法

サーバー不要。`index.html` をブラウザで開くだけで動作します。

## デプロイ (GitHub Pages)

```bash
npm run build  # 不要（静的ファイルのみ）
DEPLOY_DIR=/c/Users/sadaaki.emura/AppData/Local/Temp/soukoban-deploy
rm -rf $DEPLOY_DIR
git clone --branch gh-pages https://github.com/SadaakiEmuraValtes/soukoban-html.git $DEPLOY_DIR
cp -r . $DEPLOY_DIR/
cd $DEPLOY_DIR && git add -A && git commit -m "Deploy" && git push origin gh-pages
```
