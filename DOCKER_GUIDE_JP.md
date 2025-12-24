# Docker & Docker Compose ドキュメント (日本語)

このドキュメントでは、`monorepo-fullstack` プロジェクトの開発、テスト、およびデプロイにおける Docker と Docker Compose の使用方法について説明します。

---

## 🏗 Docker アーキテクチャ

このプロジェクトは、Docker Compose によってパッケージ化および管理されるシンプルなマイクロサービスアーキテクチャを採用しています。

- **Frontend**: ビルド済みの React アプリケーションを提供する Nginx。
- **Backend**: [Hono](https://hono.dev/) アプリケーションを実行する Node.js API。
- **Database**: PostgreSQL 16。
- **Database GUI**: Prisma Studio。
- **Cache**: Redis 7。

---

## 🚀 クイックスタートガイド

### 1. 前提条件

- Docker Engine >= 20.10
- Docker Compose v2
- Node.js & pnpm (ローカルビルドが必要な場合のみ)

### 2. 初回セットアップ

```bash
# 環境変数のテンプレートをコピー
cp .env.example .env

# コンテナをビルドしてバックグラウンドで実行
pnpm docker:up
```

### 3. よく使われるコマンド (pnpm 経由)

`package.json` に統合されている便利なユーティリティスクリプト：

- `pnpm docker:up`: システム全体を起動 (`docker-compose up -d`)。
- `pnpm docker:down`: コンテナを停止・削除 (`docker-compose down`)。
- `pnpm docker:build`: サービスを再ビルド (`docker-compose build`)。
- `pnpm docker:db:migrate`: コンテナ内でデータベースマイグレーションを実行。
- `pnpm docker:db:seed`: コンテナ内でデータベースシーディングを実行。

---

## 📦 サービスの仕様

| サービス        | ポート | イメージ             | 説明                                                                 |
| :-------------- | :----- | :------------------- | :------------------------------------------------------------------- |
| `postgres`      | 5432   | `postgres:16-alpine` | メインデータストレージ。自動ヘルスチェック付き。                     |
| `redis`         | 6379   | `redis:7-alpine`     | キャッシングおよび Pub/Sub。                                         |
| `api`           | 3001   | Custom (Node 20)     | バックエンドサーバー。Postgres と Redis に接続。                     |
| `web`           | 3000   | Custom (Nginx)       | フロントエンドアプリ。`/api` リクエストを `api` サービスへプロキシ。 |
| `prisma-studio` | 5555   | Custom (Node 20)     | Prisma 用のビジュアルデータベースブラウザ。                          |

---

## 🛠 Dockerfile の解説

### バックエンド (`apps/api/Dockerfile`)

イメージサイズを最適化するために **マルチステージビルド** を使用しています：

1.  **ステージ 1 (Builder)**: `pnpm` をインストールし、ワークスペース全体をコピー、`prisma generate` と `pnpm build` を実行。
2.  **ステージ 2 (Runner)**: ビルド済みのファイル (`dist`)、本番用の `node_modules`、および設定ファイルのみをコピー。非ルートユーザー (`api`) で実行。

### フロントエンド (`apps/web/Dockerfile`)

1.  **ステージ 1 (Builder)**: Web アプリと依存パッケージ (`@myorg/types`, `@myorg/ui`) をビルド。
2.  **ステージ 2 (Runner)**: **Nginx Alpine** を使用。ビルドされたファイルを Nginx の html フォルダにコピーし、SPA ルーティング用のカスタム `nginx.conf` を使用。

---

## ⚙️ 環境変数

`.env` ファイル内の重要な変数：

| 変数名              | デフォルト値 | 説明                     |
| :------------------ | :----------- | :----------------------- |
| `POSTGRES_USER`     | `postgres`   | データベースユーザー     |
| `POSTGRES_PASSWORD` | `postgres`   | データベースパスワード   |
| `POSTGRES_DB`       | `myorg`      | 初期データベース名       |
| `JWT_SECRET`        | (ランダム)   | JWT 秘密鍵               |
| `API_PORT`          | `3001`       | バックエンド公開ポート   |
| `WEB_PORT`          | `3000`       | フロントエンド公開ポート |

---

## 💾 データの永続化 (ボリューム)

- `postgres_data`: PostgreSQL の永続データストレージ。
- `redis_data`: Redis データストレージ。
- `uploads_data`: `api` コンテナの `/app/uploads` にあるアップロードファイルストレージ。

---

## 🛠 Docker 開発環境

API と Web アプリケーションの両方でホットリロードを含む、開発用の独立したスタンドアロン Docker 環境を提供しています。

```bash
# 開発環境を起動
pnpm docker:dev

# コンテナを再ビルド (依存関係が変更された場合)
pnpm docker:dev:build
```

サービスへのアクセス:

- **Web**: http://localhost:5173
- **API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

---

## 🔍 ヘルスチェック

システムは正しい起動シーケンスを保証します：

- `api` は `postgres` と `redis` が **Healthy** になってから起動します。
- `web` は `api` の準備ができてから起動します。

---

> [!IMPORTANT]
> 本番環境では、必ず `.env` ファイルの `POSTGRES_PASSWORD` と `JWT_SECRET` を変更してください。
