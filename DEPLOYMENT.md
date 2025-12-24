# StageX デプロイメントガイド

## デプロイ前チェックリスト

### ✅ 完了している項目
- [x] コードのビルド成功
- [x] TypeScriptエラーなし
- [x] すべての機能実装済み
- [x] Gitリポジトリ準備済み

### ⚠️ デプロイ前に必要な設定

## 1. Supabaseプロジェクトのセットアップ

### 1.1 Supabaseプロジェクト作成
1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトURLとAPIキーを取得

### 1.2 データベースマイグレーション実行
```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref your-project-ref

# マイグレーションを実行
supabase db push
```

または、Supabaseダッシュボードから直接SQLを実行：
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_collections_and_plans.sql`
- `supabase/migrations/0003_add_watermark_flag.sql`

### 1.3 ストレージバケット作成
Supabaseダッシュボードで以下を作成：
- バケット名: `images`
- 公開バケット: `true`
- フォルダ: `originals/`, `generated/`

### 1.4 Edge Functionsのデプロイ
```bash
# generate-image関数
supabase functions deploy generate-image

# create-checkout-session関数
supabase functions deploy create-checkout-session

# stripe-webhook関数
supabase functions deploy stripe-webhook
```

### 1.5 環境変数の設定（Supabase Edge Functions）
Supabaseダッシュボード > Settings > Edge Functions > Secrets で以下を設定：
- `GEMINI_API_KEY`: Google Gemini APIキー
- `STRIPE_SECRET_KEY`: Stripeシークレットキー（決済機能を使用する場合）
- `STRIPE_PRICE_BASIC`: Stripe BasicプランのPrice ID
- `STRIPE_PRICE_STANDARD`: Stripe StandardプランのPrice ID
- `STRIPE_PRICE_PRO`: Stripe ProプランのPrice ID
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhookシークレット

## 2. Google Gemini APIの設定

1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキーを取得
2. Supabase Edge Functionsの環境変数に設定

## 3. Stripeの設定（決済機能を使用する場合）

### 3.1 Stripeアカウント作成
1. [Stripe](https://stripe.com)でアカウント作成
2. ダッシュボードでプランを作成：
   - Basic: ¥2,980/月
   - Standard: ¥5,980/月
   - Pro: ¥9,980/月
3. 各プランのPrice IDを取得

### 3.2 Webhook設定
1. Stripeダッシュボード > Developers > Webhooks
2. エンドポイント追加: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. イベント選択: `checkout.session.completed`
4. Webhookシークレットを取得

## 4. フロントエンドのデプロイ

### オプション1: Vercel（推奨）

```bash
# Vercel CLIをインストール
npm install -g vercel

# プロジェクトルートで実行
cd frontend
vercel

# 環境変数を設定
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

または、Vercelダッシュボードから：
1. GitHubリポジトリをインポート
2. ルートディレクトリを `frontend` に設定
3. ビルドコマンド: `npm run build`
4. 出力ディレクトリ: `dist`
5. 環境変数を設定

### オプション2: Netlify

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# デプロイ
cd frontend
netlify deploy --prod
```

### オプション3: その他のホスティング

静的ファイルを `frontend/dist` からアップロード

## 5. 環境変数の設定（フロントエンド）

デプロイ先の環境変数設定で以下を追加：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 6. 認証設定（Supabase）

1. Supabaseダッシュボード > Authentication > URL Configuration
2. Site URLを設定: `https://your-domain.com`
3. Redirect URLsに追加:
   - `https://your-domain.com`
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/reset-password`

## 7. デプロイ後の確認事項

- [ ] ログイン・サインアップが動作する
- [ ] 画像アップロードが動作する
- [ ] 画像生成が動作する
- [ ] ギャラリーが表示される
- [ ] フィルター機能が動作する
- [ ] 削除機能が動作する
- [ ] エクスポート機能が動作する
- [ ] プランページが表示される
- [ ] プロフィール設定が動作する

## トラブルシューティング

### ビルドエラー
```bash
cd frontend
npm install
npm run build
```

### Supabase接続エラー
- 環境変数が正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認
- RLS（Row Level Security）ポリシーが正しく設定されているか確認

### 画像アップロードエラー
- ストレージバケットが作成されているか確認
- バケットの公開設定を確認
- RLSポリシーを確認

## 本番環境の推奨設定

1. **セキュリティ**
   - HTTPS必須
   - CORS設定の確認
   - 環境変数の保護

2. **パフォーマンス**
   - CDNの使用（Vercel/Netlifyは自動）
   - 画像最適化
   - キャッシュ設定

3. **モニタリング**
   - エラートラッキング（Sentryなど）
   - アナリティクス（Google Analyticsなど）
   - Supabaseダッシュボードでログ監視

## サポート

問題が発生した場合：
1. ブラウザのコンソールでエラーを確認
2. Supabaseダッシュボードでログを確認
3. デプロイ先のログを確認

