import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';

const PLANS = [
    {
        id: 'basic',
        name: 'ベーシック',
        price: 2980,
        period: '月',
        features: [
            '月10枚まで生成',
            '基本スタイル5種類',
            '標準解像度',
            'メールサポート'
        ],
        limitations: [
            '商用利用不可',
            '優先サポートなし'
        ],
        popular: false
    },
    {
        id: 'standard',
        name: 'スタンダード',
        price: 5980,
        period: '月',
        features: [
            '月50枚まで生成',
            '全スタイル利用可能',
            '高解像度',
            '優先メールサポート',
            '商用利用可'
        ],
        limitations: [],
        popular: true
    },
    {
        id: 'pro',
        name: 'プロ',
        price: 9980,
        period: '月',
        features: [
            '無制限生成',
            '全スタイル利用可能',
            '最高解像度',
            '優先サポート',
            '商用利用可',
            'APIアクセス',
            'カスタムスタイル'
        ],
        limitations: [],
        popular: false
    }
];

export const PricingPage: React.FC = () => {
    const { user } = useAuth();

    const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

    const handleSubscribe = async (planKey: string) => {
        if (!user) {
            alert('ログインが必要です');
            window.location.href = '/auth';
            return;
        }

        setLoadingPlan(planKey);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { plan_id: planKey }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            console.error('Subscription error:', err);
            alert('エラーが発生しました: ' + err.message);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-semibold text-slate-900 font-outfit mb-4">料金プラン</h1>
                    <p className="text-slate-600 text-lg">あなたのニーズに合わせたプランを選択してください</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-white rounded-2xl border-2 p-8 shadow-lg ${plan.popular
                                ? 'border-blue-600 scale-105'
                                : 'border-slate-200'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                                    おすすめ
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-slate-900">¥{plan.price.toLocaleString()}</span>
                                    <span className="text-slate-600">/{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-700">{feature}</span>
                                    </li>
                                ))}
                                {plan.limitations.map((limitation, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <X className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-400 line-through">{limitation}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleSubscribe(plan.id)}
                                isLoading={loadingPlan === plan.id}
                                className={`w-full h-12 ${plan.popular
                                    ? ''
                                    : 'variant-outline'
                                    }`}
                                variant={plan.popular ? 'primary' : 'outline'}
                            >
                                {user ? 'プランを変更' : '今すぐ始める'}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-600 mb-4">エンタープライズプランをご希望の方は</p>
                    <Button variant="outline" className="px-6">
                        お問い合わせ
                    </Button>
                </div>
            </div>
        </div>
    );
};

