# StageX - AI Visual Operations Platform

AIを活用した不動産写真のビジュアル運用プラットフォーム。物件写真を高コンバージョンのビジュアル資産に変換します。

## 機能

- 🎨 **画像生成**: 家具配置（ステージング）と家具除去（リムーバル）の2つのモード
- 🖼️ **ギャラリー**: 生成された画像の管理と表示
- 📁 **コレクション**: 画像の整理と分類
- 💳 **サブスクリプション**: プランベースの利用制限
- 👤 **プロフィール管理**: アカウント設定と利用状況の確認
- 🔄 **リアルタイム更新**: 生成ステータスの自動更新
- 🎯 **AI修正機能**: 生成後の画像をAIで修正

## 技術スタック

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (状態管理)
- React Query
- Supabase Client

### Backend
- Supabase (認証、データベース、ストレージ)
- Supabase Edge Functions (Deno)
- Google Gemini AI

## セットアップ

### 必要な環境変数

`.env` ファイルを作成し、以下を設定してください：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### インストール

```bash
cd frontend
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

## プロジェクト構造

```
StageX/
├── frontend/          # React フロントエンド
│   ├── src/
│   │   ├── components/   # React コンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   ├── lib/           # ライブラリ設定
│   │   ├── store/         # 状態管理
│   │   └── types/         # TypeScript型定義
│   └── ...
└── supabase/          # Supabase設定
    ├── functions/     # Edge Functions
    └── migrations/    # データベースマイグレーション
```

## デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### クイックスタート

1. **Supabaseプロジェクトを作成**
   - [Supabase](https://supabase.com)でプロジェクト作成
   - データベースマイグレーションを実行
   - ストレージバケットを作成

2. **環境変数を設定**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **フロントエンドをデプロイ**
   - Vercel、Netlify、またはその他のホスティングサービスを使用
   - 環境変数を設定
   - ビルドしてデプロイ

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## ライセンス

MIT

