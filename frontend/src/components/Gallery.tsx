import React, { useState, useEffect } from 'react';
import { Download, MoreVertical, Search, Filter, Maximize2, X, History, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { CompareSlider } from './CompareSlider';
import { ExportDialog } from './ExportDialog';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import type { Generation } from '../types';

export const Gallery: React.FC = () => {
    const { user } = useAuth();
    const { generations, setGenerations, updateGeneration } = useStore();
    const { success, error: showError } = useToast();
    const [selectedAsset, setSelectedAsset] = useState<Generation | null>(null);
    const [exportAsset, setExportAsset] = useState<Generation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [refiningPrompt, setRefiningPrompt] = useState('');
    const [loading, setLoading] = useState(true);
    const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>([]);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="スタイルを検索"]') as HTMLInputElement;
                searchInput?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Fetch generations from database
    useEffect(() => {
        if (!user) return;

        const fetchGenerations = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('generations')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setGenerations((data as Generation[]) || []);
            } catch (err) {
                console.error('Error fetching generations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGenerations();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('generations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'generations',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setGenerations([payload.new as Generation, ...generations]);
                    } else if (payload.eventType === 'UPDATE') {
                        updateGeneration(payload.new.id, payload.new as Partial<Generation>);
                    } else if (payload.eventType === 'DELETE') {
                        setGenerations(generations.filter(g => g.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, generations.length]); // Added length to dependency to ensure subscription updates correctly

    // Filter generations by search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredGenerations(generations);
        } else {
            setFilteredGenerations(
                generations.filter(gen =>
                    gen.style.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }
    }, [searchQuery, generations]);

    const handleRefine = async () => {
        if (!selectedAsset || !refiningPrompt.trim()) return;

        setIsRefining(true);
        try {
            const { error: functionError } = await supabase.functions.invoke('generate-image', {
                body: {
                    generation_id: selectedAsset.id,
                    is_refinement: true,
                    prompt_override: refiningPrompt
                }
            });

            if (functionError) throw functionError;

            success('AIが修正を開始しました。完了までお待ちください。');
            setRefiningPrompt('');
        } catch (err: any) {
            console.error('Refine error:', err);
            showError('修正の依頼に失敗しました。');
        } finally {
            setIsRefining(false);
        }
    };

    const handleDownload = async (generation: Generation, showExportDialog = false) => {
        if (!generation.generated_url) {
            showError('画像がまだ生成されていません。');
            return;
        }

        // Watermark check
        if (generation.is_watermarked && !showExportDialog) {
            showError('無料プランではダウンロードをご利用いただけません。プランのアップグレードをお願いします。');
            return;
        }

        if (showExportDialog) {
            setExportAsset(generation);
            return;
        }

        // Quick download (default JPG)
        try {
            const response = await fetch(generation.generated_url);
            if (!response.ok) throw new Error('画像の取得に失敗しました。');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stagex-${generation.style}-${generation.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            success('画像をダウンロードしました。');
        } catch (err: any) {
            console.error('Download error:', err);
            showError(err.message || 'ダウンロードに失敗しました。');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 font-outfit">ギャラリー</h1>
                    <p className="text-slate-600 mt-1 text-sm">生成されたすべての資産</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="スタイルを検索... (Ctrl/Cmd + K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-56"
                            aria-label="スタイルを検索"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg px-4">
                        <Filter className="h-4 w-4 mr-1.5" /> フィルター
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : filteredGenerations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Sparkles className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">生成された画像がありません</p>
                    <p className="text-slate-400 text-sm mt-2">画像をアップロードして生成を開始してください</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGenerations.map((asset) => (
                        <div key={asset.id} className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all shadow-sm">
                            <div className="aspect-[4/3] overflow-hidden relative bg-slate-100">
                                {asset.status === 'completed' && asset.generated_url ? (
                                    <img
                                        src={asset.generated_url}
                                        alt={asset.style}
                                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${asset.is_watermarked ? 'sepia-[0.3]' : ''}`}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {asset.status === 'processing' ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                        ) : asset.status === 'queued' ? (
                                            <div className="text-center">
                                                <Sparkles className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500">待機中</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <X className="h-6 w-6 text-red-400 mx-auto mb-2" />
                                                <p className="text-xs text-red-500">失敗</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {asset.is_watermarked && asset.status === 'completed' && (
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 font-medium tracking-wider">
                                        <Sparkles className="h-3 w-3 text-yellow-400" />
                                        WATERMARKED
                                    </div>
                                )}
                                {asset.status === 'completed' && asset.generated_url && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setSelectedAsset(asset)}
                                            className="p-2.5 bg-white text-slate-900 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(asset, true);
                                            }}
                                            className={`p-2.5 rounded-lg transition-colors shadow-sm ${asset.is_watermarked ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                            disabled={asset.is_watermarked}
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-slate-900">{asset.style}スタイル</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <History className="h-3 w-3 text-slate-400" />
                                        <p className="text-xs text-slate-500">
                                            {new Date(asset.created_at).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${asset.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        asset.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                            asset.status === 'queued' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {asset.status === 'completed' ? '完了' :
                                            asset.status === 'processing' ? '処理中' :
                                                asset.status === 'queued' ? '待機中' : '失敗'}
                                    </span>
                                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Comparison Modal */}
            {selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 font-outfit">{selectedAsset.style} Transformation</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Generated by StageX AI</p>
                            </div>
                            <button
                                onClick={() => setSelectedAsset(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-6 flex items-center justify-center bg-slate-50">
                            <div className="w-full h-full">
                                {selectedAsset.generated_url ? (
                                    <div className="relative w-full h-full">
                                        <CompareSlider
                                            originalUrl={selectedAsset.original_url}
                                            generatedUrl={selectedAsset.generated_url}
                                        />
                                        {selectedAsset.is_watermarked && (
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 select-none overflow-hidden">
                                                <div className="text-[120px] font-bold -rotate-45 whitespace-nowrap text-slate-900 tracking-[10px]">
                                                    STAGE X PREVIEW
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-slate-500">画像がまだ生成されていません</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-white border-t border-slate-200 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="AIへの修正指示（例：ソファの色を青にして、照明を暖色系に）"
                                        value={refiningPrompt}
                                        onChange={(e) => setRefiningPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-32 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <div className="absolute right-1 top-1 bottom-1">
                                        <Button
                                            size="sm"
                                            onClick={handleRefine}
                                            isLoading={isRefining}
                                            disabled={!refiningPrompt.trim()}
                                            className="h-full px-4 rounded-md text-xs"
                                        >
                                            修正を依頼
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="rounded-lg text-xs">共有</Button>
                                    <Button variant="outline" size="sm" className="rounded-lg text-xs">報告</Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setSelectedAsset(null)} className="rounded-lg">閉じる</Button>
                                    {!selectedAsset.is_watermarked && (
                                        <Button
                                            onClick={() => selectedAsset && handleDownload(selectedAsset, false)}
                                            variant="outline"
                                            className="px-4 rounded-lg font-medium"
                                            disabled={!selectedAsset?.generated_url}
                                        >
                                            <Download className="h-4 w-4 mr-2" /> クイックDL
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => selectedAsset && handleDownload(selectedAsset, true)}
                                        className={`px-6 rounded-lg font-medium ${selectedAsset.is_watermarked ? 'bg-slate-200 text-slate-500 hover:bg-slate-200' : ''}`}
                                        disabled={!selectedAsset?.generated_url || selectedAsset.is_watermarked}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {selectedAsset.is_watermarked ? 'ダウンロード不可' : 'エクスポート'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Dialog */}
            {exportAsset && (
                <ExportDialog
                    generation={exportAsset}
                    onClose={() => setExportAsset(null)}
                />
            )}
        </div>
    );
};
