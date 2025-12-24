import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';

export const ProfileSettings: React.FC = () => {
    const { user } = useAuth();
    const { profile, setProfile } = useStore();
    const { success, error: showError } = useToast();
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
        }
        setLoading(false);
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName || null
                })
                .eq('id', user.id);

            if (error) throw error;

            setProfile({
                ...profile!,
                full_name: fullName || undefined
            });

            success('プロフィールを更新しました。');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            showError('プロフィールの更新に失敗しました。');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-slate-900 font-outfit">プロフィール設定</h2>
                <p className="text-slate-600 mt-1 text-sm">アカウント情報を管理</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">{fullName || 'ユーザー'}</p>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                                <User className="h-4 w-4" />
                                表示名
                            </label>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="表示名を入力"
                                className="max-w-md"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                メールアドレス
                            </label>
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="max-w-md bg-slate-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">メールアドレスは変更できません</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        保存
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">現在のプランと利用状況</h3>
                    <p className="text-sm text-slate-500">現在のサブスクリプション状況を確認できます</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">プラン</p>
                        <p className="text-lg font-semibold text-blue-600">
                            {profile?.plan_type === 'pro' ? 'プロ' :
                                profile?.plan_type === 'standard' ? 'スタンダード' :
                                    profile?.plan_type === 'basic' ? 'ベーシック' : '無料トライアル'}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">今月の生成枚数</p>
                        <p className="text-lg font-semibold text-slate-900">
                            {profile?.generation_count || 0} <span className="text-sm font-normal text-slate-400">/
                                {profile?.plan_type === 'pro' ? '無制限' :
                                    profile?.plan_type === 'standard' ? '50' :
                                        profile?.plan_type === 'basic' ? '10' : '3'}</span>
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <Button variant="outline" className="w-full md:w-auto" onClick={() => window.location.hash = 'pricing'}>
                        プランをアップグレード
                    </Button>
                </div>
            </div>
        </div>
    );
};

