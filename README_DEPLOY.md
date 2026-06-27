# 西洋占星術鑑定アプリ 公開手順

このアプリを自分のサイトで公開する場合は、静的HTMLだけではなく Node.js サーバーとして動かします。

理由:

- `/api/timing` でトランジット、プログレス、ソーラーリターン、プロフェクションを計算するため
- Swiss Ephemeris `swetest` を使う場合、ブラウザだけではなくサーバー側ランタイムが必要なため

## 公開に必要なもの

- Node.js が動くサーバー
- このアプリ一式
- Swiss Ephemeris `swetest` 実行ファイル
- 公開用ソースコードURL

## Netlifyで公開する場合

Netlifyでは常時Nodeサーバーを起動するのではなく、`/api/timing` を Netlify Functions として動かします。

このリポジトリにはNetlify用の設定を入れています。

- `netlify.toml`
- `netlify/functions/timing.mjs`
- `netlify/functions/healthz.mjs`
- `scripts/setup_netlify_swiss.sh`

Netlifyのサイト設定では、このアプリフォルダをデプロイ対象にします。

```text
Base directory: codex-workspace/apps/astro-chart-clone
Build command: npm run build:netlify && npm run check:deploy
Publish directory: .
Functions directory: netlify/functions
```

環境変数:

```text
PUBLIC_SOURCE_URL=https://example.com/your-public-source-repo
ASTRO_TIMING_ENGINE=swetest
```

`SWETEST_PATH` と `SWISS_EPHEMERIS_PATH` は `netlify.toml` に設定済みです。

Netlifyビルド時に `scripts/setup_netlify_swiss.sh` が動き、Swiss Ephemerisから最小構成だけを作ります。

関数に含めるファイル:

- `netlify/swiss/swetest`
- `netlify/swiss/ephe/sepl_18.se1`
- `netlify/swiss/ephe/semo_18.se1`

この最小構成で、アプリの入力範囲である1800〜2200年の主要10天体計算を扱います。

## ローカル確認

```bash
cd /Users/higashitakehiro/Desktop/ai-workspace/codex-workspace/apps/astro-chart-clone
npm start
```

ブラウザで開く:

```text
http://127.0.0.1:4173/
```

## 公開サーバーでの起動

サーバー上では `HOST=0.0.0.0` で起動します。

```bash
cd /path/to/astro-chart-clone
PUBLIC_SOURCE_URL="https://example.com/your-public-source-repo" \
SWETEST_PATH="/path/to/swetest" \
SWISS_EPHEMERIS_PATH="/path/to/ephe" \
PORT=4173 \
npm run start:public
```

公開先のURL例:

```text
https://your-domain.example/
```

## 事前チェック

公開前に実行します。

```bash
npm run check:deploy
```

内訳:

- `npm run check:public`
- `npm run check:api`
- `npm run check:timing:strict`

## 動作確認

ヘルスチェック:

```text
https://your-domain.example/healthz
```

正常なら次のようなJSONが返ります。

```json
{
  "status": "ok",
  "service": "astro-chart-clone"
}
```

## 公開時の注意

- `file://.../index.html` で開かない
- 公開URLでは必ず `https://ドメイン/` から開く
- Netlifyでは `npm start` ではなく、Netlify Functions経由で `/api/timing` が動く
- `.env`、APIキー、実在ユーザーの出生データ、鑑定ログは公開しない
- Swiss Ephemeris Free Edition を使う場合は、対応するソースコードを公開する
- アプリ画面下部の「公開用ソースコード」に実際のURLが表示されていることを確認する

## サーバーを止める

ターミナルで起動している場合:

```text
Control + C
```

常駐化する場合は、利用中のサーバー管理方法に合わせて Node.js プロセスを管理します。
