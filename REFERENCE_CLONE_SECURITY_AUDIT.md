# 複製元コード監査メモ

作成日: 2026-06-11

## 複製するもの

- 画面に表示されている表の項目名
- 画面に表示されている表の数値
- 手法ごとの出力構造
- 計算結果の照合用フィールド

## コピーしないもの

- 複製元サイトのHTML/CSS/JavaScriptコード
- inline script
- 広告タグ、Google Tag Manager、Google Analytics、AdSense
- Cloudflare beacon
- Funding Choices / consent 管理スクリプト
- jQuery、Bootstrap、slick、datepicker などの外部/内部UIスクリプト
- Cookie、localStorage、sessionStorage
- 保存チャートID、ユーザーID、セッションID、CSRF/nonce/tokenらしき値
- hidden input の値
- フォーム送信先や内部APIを呼ぶ実装
- 著作権のある解釈文
- 画像、SVG、デザイン、レイアウト

## 監査結果

現在の参照ページには、以下のコピー禁止要素が確認された。

- `script[src]`: 広告、Googleタグ、Funding Choices、Cloudflare beacon、複製元サイト内JS
- `script:not([src])`: 25件
- 保存チャートIDを含むリンク: 複数件
- 表: 4件

このアプリに取り込むのは、表4件の表示済みテキストから作った数値データだけ。

## 実装ルール

複製元サイトのコードを保存・転記・再利用しない。

アプリ側では、`reference-current-data.js` に手作業で抽出した表データだけを置く。URL中の保存チャートIDは `<redacted-chart-id>` に置き換える。

複製元から新しいサンプルを取るときも、保存ID、Cookie、広告/解析コード、内部JS、hidden値は記録しない。
