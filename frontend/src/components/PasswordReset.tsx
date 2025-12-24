import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface PasswordResetProps {
    onBack: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onBack }) => {
    const { success, error: showError } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    const handleSendResetEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setEmailSent(true);
            success('パスワードリセットメールを送信しました。メールボックスをご確認ください。');
        } catch (err: any) {
            console.error('Password reset error:', err);
            showError(err.message || 'メール送信に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showError('パスワードが一致しません。');
            return;
        }

        if (newPassword.length < 6) {
            showError('パスワードは6文字以上にしてください。');
            return;
        }

        setResetting(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;
            success('パスワードを更新しました。');
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (err: any) {
            console.error('Password update error:', err);
            showError(err.message || 'パスワードの更新に失敗しました。');
        } finally {
            setResetting(false);
        }
    };

    // Check if we have a reset token in URL
    React.useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
            setResetToken(accessToken);
        }
    }, []);

    if (resetToken) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="font-outfit text-3xl font-semibold text-slate-900">新しいパスワードを設定</h2>
                        <p className="text-slate-600 text-sm">新しいパスワードを入力してください</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
                        <form className="space-y-5" onSubmit={handleResetPassword}>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700 px-1">新しいパスワード</label>
                                    <Input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="6文字以上"
                                        className="bg-white border-slate-200 rounded-lg h-12 px-4 text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700 px-1">パスワード（確認）</label>
                                    <Input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="パスワードを再入力"
                                        className="bg-white border-slate-200 rounded-lg h-12 px-4 text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-lg font-medium"
                                isLoading={resetting}
                            >
                                パスワードを更新
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (emailSent) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center mx-auto shadow-xl shadow-green-500/30">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="font-outfit text-3xl font-semibold text-slate-900">メールを確認してください</h2>
                        <p className="text-slate-600 text-sm">
                            パスワードリセットリンクを <strong>{email}</strong> に送信しました。
                            <br />
                            メール内のリンクをクリックして、パスワードをリセットしてください。
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 text-center">
                        <p className="text-sm text-slate-500 mb-4">メールが届かない場合は、迷惑メールフォルダもご確認ください。</p>
                        <Button variant="outline" onClick={onBack} className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            ログインに戻る
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="font-outfit text-3xl font-semibold text-slate-900">パスワードをリセット</h2>
                    <p className="text-slate-600 text-sm">登録済みのメールアドレスを入力してください</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
                    <form className="space-y-5" onSubmit={handleSendResetEmail}>
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
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-lg font-medium"
                            isLoading={loading}
                        >
                            リセットリンクを送信
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={onBack}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors flex items-center gap-1 mx-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            ログインに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

