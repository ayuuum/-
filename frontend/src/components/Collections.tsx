import React, { useState, useEffect } from 'react';
import { Plus, Folder, X, Trash2, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useStore } from '../store/useStore';
import type { Generation } from '../types';

interface Collection {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    created_at: string;
}

export const Collections: React.FC = () => {
    const { user } = useAuth();
    const { generations } = useStore();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [collectionGenerations, setCollectionGenerations] = useState<Generation[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [collectionName, setCollectionName] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchCollections();
    }, [user]);

    useEffect(() => {
        if (selectedCollection) {
            fetchCollectionGenerations(selectedCollection.id);
        }
    }, [selectedCollection, generations]);

    const fetchCollections = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('collections')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCollections((data as Collection[]) || []);
        } catch (err) {
            console.error('Error fetching collections:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollectionGenerations = async (collectionId: string) => {
        try {
            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .eq('collection_id', collectionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCollectionGenerations((data as Generation[]) || []);
        } catch (err) {
            console.error('Error fetching collection generations:', err);
        }
    };

    const handleCreateCollection = async () => {
        if (!user || !collectionName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('collections')
                .insert({
                    user_id: user.id,
                    name: collectionName,
                    description: collectionDescription || null
                })
                .select()
                .single();

            if (error) throw error;
            setCollections([data as Collection, ...collections]);
            setCollectionName('');
            setCollectionDescription('');
            setIsCreating(false);
        } catch (err: any) {
            console.error('Error creating collection:', err);
            alert('コレクションの作成に失敗しました。');
        }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!confirm('このコレクションを削除しますか？')) return;

        try {
            const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCollections(collections.filter(c => c.id !== id));
            if (selectedCollection?.id === id) {
                setSelectedCollection(null);
            }
        } catch (err) {
            console.error('Error deleting collection:', err);
            alert('コレクションの削除に失敗しました。');
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 font-outfit">コレクション</h2>
                    <p className="text-slate-600 mt-1 text-sm">生成画像を整理して管理</p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    新規作成
                </Button>
            </div>

            {/* Create Collection Modal */}
            {isCreating && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">新しいコレクション</h3>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setCollectionName('');
                                setCollectionDescription('');
                            }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">名前</label>
                            <input
                                type="text"
                                value={collectionName}
                                onChange={(e) => setCollectionName(e.target.value)}
                                placeholder="コレクション名"
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">説明（任意）</label>
                            <textarea
                                value={collectionDescription}
                                onChange={(e) => setCollectionDescription(e.target.value)}
                                placeholder="コレクションの説明"
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreating(false);
                                setCollectionName('');
                                setCollectionDescription('');
                            }}
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleCreateCollection} disabled={!collectionName.trim()}>
                            作成
                        </Button>
                    </div>
                </div>
            )}

            {/* Collections List */}
            {collections.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium mb-2">コレクションがありません</p>
                    <p className="text-slate-400 text-sm">新しいコレクションを作成して画像を整理しましょう</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                                selectedCollection?.id === collection.id
                                    ? 'border-blue-600 shadow-lg'
                                    : 'border-slate-200 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedCollection(collection)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-1">{collection.name}</h3>
                                    {collection.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2">{collection.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCollection(collection.id);
                                    }}
                                    className="text-slate-400 hover:text-red-600 p-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">
                                {new Date(collection.created_at).toLocaleDateString('ja-JP')}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Collection Generations */}
            {selectedCollection && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{selectedCollection.name}</h3>
                            <p className="text-sm text-slate-500">{collectionGenerations.length}枚の画像</p>
                        </div>
                        <button
                            onClick={() => setSelectedCollection(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {collectionGenerations.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500">このコレクションには画像がありません</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {collectionGenerations.map((gen) => (
                                <div key={gen.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                    {gen.generated_url ? (
                                        <img
                                            src={gen.generated_url}
                                            alt={gen.style}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

