import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { Input } from './Input';
import { Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('確認メールを送信しました。メールボックスをご確認ください。');
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'メールアドレスまたはパスワードが正しくありません。' : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
                        <span className="text-white font-outfit font-semibold text-2xl">X</span>
                    </div>
                    <h2 className="font-outfit text-3xl font-semibold text-slate-900">
                        {isLogin ? 'おかえりなさい' : 'アカウントを作成'}
                    </h2>
                    <p className="text-slate-600 text-sm">
                        {isLogin
                            ? "新しいプロジェクトを始めましょう。 "
                            : 'AIによる次世代のビジュアル運用を体験。 '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 font-medium hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                        >
                            {isLogin ? '新規登録' : 'ログイン'}
                        </button>
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
                    <form className="space-y-5" onSubmit={handleAuth} aria-label={isLogin ? 'ログインフォーム' : 'サインアップフォーム'}>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 px-1">メールアドレス</label>
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="bg-white border-slate-200 rounded-lg h-12 px-4 text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 px-1">パスワード</label>
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-white border-slate-200 rounded-lg h-12 px-4 text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-lg font-medium"
                            isLoading={loading}
                        >
                            {isLogin ? 'ログイン' : '登録する'}
                        </Button>

                        <div className="relative py-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white px-3 text-slate-400">
                                    または
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-lg"
                            onClick={handleGoogleLogin}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                Googleでログイン
                            </span>
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Sparkles className="h-3 w-3" /> Powered by StageX AI
                </p>
            </div>
        </div>
    );
};
