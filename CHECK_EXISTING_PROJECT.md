# 既存Supabaseプロジェクトの確認と設定

## 既存プロジェクト情報

- **プロジェクトURL**: `https://rmrabqbdgmehdnwhjoez.supabase.co`
- **プロジェクトID**: `rmrabqbdgmehdnwhjoez`

## 確認すべき項目

### 1. データベーステーブルの確認

Supabaseダッシュボード > Table Editor で以下が存在するか確認：

- [ ] `profiles` テーブル
- [ ] `generations` テーブル
- [ ] `collections` テーブル

**もしテーブルがない場合：**
マイグレーションファイルを実行する必要があります。

### 2. ストレージバケットの確認

Supabaseダッシュボード > Storage で以下が存在するか確認：

- [ ] `images` バケット（公開設定）

**もしバケットがない場合：**
1. Storage > Create bucket
2. バケット名: `images`
3. Public bucket: ON
4. Create

### 3. Edge Functionsの確認

Supabaseダッシュボード > Edge Functions で以下が存在するか確認：

- [ ] `generate-image` 関数
- [ ] `create-checkout-session` 関数
- [ ] `stripe-webhook` 関数

**もし関数がない場合：**
デプロイする必要があります。

### 4. 環境変数（Secrets）の確認

Supabaseダッシュボード > Settings > Edge Functions > Secrets で以下が設定されているか確認：

- [ ] `GEMINI_API_KEY`
- [ ] `STRIPE_SECRET_KEY`（決済機能を使用する場合）
- [ ] `STRIPE_PRICE_BASIC`
- [ ] `STRIPE_PRICE_STANDARD`
- [ ] `STRIPE_PRICE_PRO`
- [ ] `STRIPE_WEBHOOK_SECRET`

## 既存プロジェクトを使う場合の手順

### オプション1: 既存プロジェクトを設定（推奨）

既存のプロジェクトに必要な設定を追加する：

1. **マイグレーション実行**
   - Supabaseダッシュボード > SQL Editor
   - 以下のファイルを順番に実行：
     - `supabase/migrations/0001_initial_schema.sql`
     - `supabase/migrations/0002_collections_and_plans.sql`
     - `supabase/migrations/0003_add_watermark_flag.sql`

2. **ストレージバケット作成**
   - Storage > Create bucket > `images`（公開）

3. **Edge Functionsデプロイ**
   ```bash
   supabase link --project-ref rmrabqbdgmehdnwhjoez
   supabase functions deploy generate-image
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

4. **環境変数設定**
   - Settings > Edge Functions > Secrets に追加

### オプション2: 新しくプロジェクトを作成

既存プロジェクトが他の用途で使われている場合、新しく作ることも可能：

1. 新しいSupabaseプロジェクトを作成
2. `.env.local` の接続情報を更新
3. 上記の設定を実行

## 推奨

**既存プロジェクトを使うことを推奨します**（設定が既に一部完了している可能性があるため）

ただし、既存プロジェクトが他の重要な用途で使われている場合は、新しくプロジェクトを作成する方が安全です。

