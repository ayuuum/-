import React, { useState } from 'react';
import { Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';

type Page = 'home' | 'pricing' | 'collections' | 'profile';

interface DashboardLayoutProps {
    children: React.ReactNode;
    onNavigate?: (page: Page) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onNavigate }) => {
    const { user } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => supabase.auth.signOut();
    
    const handlePricingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate('pricing' as Page);
        } else {
            window.location.href = '/pricing';
        }
    };

    const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate('profile' as Page);
        }
        setShowUserMenu(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Top Navigation */}
            <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="font-outfit font-bold text-xl tracking-tight text-blue-600">StageX</span>
                </div>

                <nav className="flex items-center gap-6">
                    <a href="/collections" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('collections' as Page); }} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">コレクション</a>
                    <a href="/pricing" onClick={handlePricingClick} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">料金プラン</a>
                    {user ? (
                        <div className="flex items-center gap-4 relative">
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-slate-700 hidden md:block">{user.email}</span>
                                </button>
                                
                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowUserMenu(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-20">
                                            <a
                                                href="/profile"
                                                onClick={handleProfileClick}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <User className="h-4 w-4" />
                                                プロフィール
                                            </a>
                                            <a
                                                href="/settings"
                                                onClick={(e) => { e.preventDefault(); setShowUserMenu(false); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <Settings className="h-4 w-4" />
                                                設定
                                            </a>
                                            <div className="border-t border-slate-200" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                ログアウト
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors font-medium shadow-sm">
                            ログイン
                        </button>
                    )}
                </nav>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
};
