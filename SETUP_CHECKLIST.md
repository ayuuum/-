# StageX セットアップチェックリスト

## プロジェクト情報
- **プロジェクトID**: `rmrabqbdgmehdnwhjoez`
- **プロジェクトURL**: `https://rmrabqbdgmehdnwhjoez.supabase.co`

## 確認・設定が必要な項目

### ✅ 1. データベーステーブル

Supabaseダッシュボード > Table Editor で以下を確認：

- [ ] `profiles` テーブルが存在する
- [ ] `generations` テーブルが存在する
- [ ] `collections` テーブルが存在する

**もしテーブルがない場合：**

Supabaseダッシュボード > SQL Editor で以下を順番に実行：

1. `supabase/migrations/0001_initial_schema.sql` をコピー&ペーストして実行
2. `supabase/migrations/0002_collections_and_plans.sql` をコピー&ペーストして実行
3. `supabase/migrations/0003_add_watermark_flag.sql` をコピー&ペーストして実行

### ✅ 2. ストレージバケット

Supabaseダッシュボード > Storage で以下を確認：

- [ ] `images` バケットが存在する
- [ ] バケットが公開設定（Public）になっている

**もしバケットがない場合：**

1. Storage > Create bucket をクリック
2. バケット名: `images`
3. Public bucket: **ON** に設定
4. Create をクリック

### ✅ 3. Edge Functions

Supabaseダッシュボード > Edge Functions で以下を確認：

- [ ] `generate-image` 関数が存在する
- [ ] `create-checkout-session` 関数が存在する
- [ ] `stripe-webhook` 関数が存在する

**もし関数がない場合：**

Supabase CLIを使用してデプロイ：

```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# ログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref rmrabqbdgmehdnwhjoez

# Edge Functionsをデプロイ
supabase functions deploy generate-image
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### ✅ 4. Edge Functionsの環境変数（Secrets）

Supabaseダッシュボード > Settings > Edge Functions > Secrets で以下を設定：

- [ ] `GEMINI_API_KEY` - Google Gemini APIキー
- [ ] `STRIPE_SECRET_KEY` - Stripeシークレットキー（決済機能を使用する場合）
- [ ] `STRIPE_PRICE_BASIC` - Stripe BasicプランのPrice ID
- [ ] `STRIPE_PRICE_STANDARD` - Stripe StandardプランのPrice ID
- [ ] `STRIPE_PRICE_PRO` - Stripe ProプランのPrice ID
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe Webhookシークレット

**設定方法：**

1. Settings > Edge Functions > Secrets を開く
2. "Add new secret" をクリック
3. 名前と値を入力して保存

### ✅ 5. 認証設定

Supabaseダッシュボード > Authentication > URL Configuration で以下を確認：

- [ ] Site URL が設定されている
- [ ] Redirect URLs に以下が追加されている：
  - `http://localhost:5173` (開発環境)
  - `https://your-domain.com` (本番環境)
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/reset-password`

### ✅ 6. Google Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. APIキーを取得
3. Supabase Edge FunctionsのSecretsに `GEMINI_API_KEY` として設定

### ✅ 7. Stripe設定（決済機能を使用する場合）

1. [Stripe](https://stripe.com) でアカウント作成
2. ダッシュボードでプランを作成：
   - Basic: ¥2,980/月
   - Standard: ¥5,980/月
   - Pro: ¥9,980/月
3. 各プランのPrice IDを取得
4. Webhookを設定：
   - エンドポイント: `https://rmrabqbdgmehdnwhjoez.supabase.co/functions/v1/stripe-webhook`
   - イベント: `checkout.session.completed`
5. Webhookシークレットを取得

## 確認方法

### データベーステーブルの確認

```sql
-- Supabaseダッシュボード > SQL Editor で実行
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'generations', 'collections');
```

### ストレージバケットの確認

Supabaseダッシュボード > Storage で `images` バケットが表示されるか確認

### Edge Functionsの確認

Supabaseダッシュボード > Edge Functions で関数一覧を確認

## 次のステップ

1. 上記のチェックリストを確認
2. 未設定の項目を設定
3. 動作確認

すべて設定が完了したら、アプリケーションが正常に動作するはずです！

