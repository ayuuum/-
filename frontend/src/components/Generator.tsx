import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Sofa, Eraser, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import type { Generation } from '../types';

interface BatchFile {
    file: File;
    preview: string;
    id: string;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
    progress: number;
    generationId?: string;
}

export const Generator: React.FC = () => {
    const { user } = useAuth();
    const { profile, addGeneration, setIsGenerating, updateGeneration, setProfile } = useStore();
    const { success, error: showError, warning } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [mode, setMode] = useState<'staging' | 'removal'>('staging');
    const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [style, setStyle] = useState<string>('モダン');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl/Cmd + U to upload
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                fileInputRef.current?.click();
            }
            // Escape to clear file
            if (e.key === 'Escape' && file) {
                clearFile();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        // Validate files
        const invalidFiles = selectedFiles.filter(f => 
            !f.type.startsWith('image/') || f.size > 10 * 1024 * 1024
        );

        if (invalidFiles.length > 0) {
            setError('画像ファイル（10MB以下）を選択してください。');
            return;
        }

        setError(null);

        if (selectedFiles.length === 1 && !isBatchMode) {
            // Single file mode
            const selectedFile = selectedFiles[0];
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            // Batch mode
            setIsBatchMode(true);
            const newBatchFiles: BatchFile[] = selectedFiles.map((f, idx) => {
                const id = `${Date.now()}-${idx}`;
                const reader = new FileReader();
                let preview = '';
                reader.onloadend = () => {
                    preview = reader.result as string;
                    setBatchFiles(prev => prev.map(bf => 
                        bf.id === id ? { ...bf, preview } : bf
                    ));
                };
                reader.readAsDataURL(f);
                return {
                    file: f,
                    preview: '',
                    id,
                    status: 'pending',
                    progress: 0
                };
            });
            setBatchFiles(newBatchFiles);
            setFile(null);
            setPreview(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setError('画像ファイルをドロップしてください。');
            return;
        }

        if (imageFiles.length === 1 && !isBatchMode) {
            const droppedFile = imageFiles[0];
            if (droppedFile.size > 10 * 1024 * 1024) {
                setError('ファイルサイズは10MB以下にしてください。');
                return;
            }
            setFile(droppedFile);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(droppedFile);
        } else {
            setIsBatchMode(true);
            const newBatchFiles: BatchFile[] = imageFiles.map((f, idx) => {
                const id = `${Date.now()}-${idx}`;
                const reader = new FileReader();
                let preview = '';
                reader.onloadend = () => {
                    preview = reader.result as string;
                    setBatchFiles(prev => prev.map(bf => 
                        bf.id === id ? { ...bf, preview } : bf
                    ));
                };
                reader.readAsDataURL(f);
                return {
                    file: f,
                    preview: '',
                    id,
                    status: 'pending',
                    progress: 0
                };
            });
            setBatchFiles(newBatchFiles);
            setFile(null);
            setPreview(null);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setBatchFiles([]);
        setIsBatchMode(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeBatchFile = (id: string) => {
        setBatchFiles(prev => prev.filter(bf => bf.id !== id));
        if (batchFiles.length === 1) {
            setIsBatchMode(false);
        }
    };

    const handleGenerate = async () => {
        if ((!file && batchFiles.length === 0) || !user) return;

        // 0. Quota Check
        const limit = profile?.plan_type === 'pro' ? Infinity :
            profile?.plan_type === 'standard' ? 50 :
                profile?.plan_type === 'basic' ? 10 : 3;

        const filesToProcess = isBatchMode ? batchFiles.length : 1;
        const currentCount = profile?.generation_count || 0;

        if (currentCount + filesToProcess > limit) {
            warning(`今月の生成上限（${limit}枚）に達しました。プランのアップグレードをご検討ください。`);
            window.location.hash = 'pricing';
            return;
        }

        setIsGeneratingLocal(true);
        setIsGenerating(true);
        setError(null);
        setUploadProgress(0);

        if (isBatchMode && batchFiles.length > 0) {
            await handleBatchGenerate();
            return;
        }

        try {
            if (!file) return;
            
            // 1. Upload image to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `originals/${fileName}`;

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (uploadError) {
                // If bucket doesn't exist, create a generation record with a data URL
                console.warn('Storage upload failed, using data URL:', uploadError);
                const reader = new FileReader();
                reader.onloadend = async () => {
                    await createGeneration(reader.result as string);
                };
                if (file) {
                    reader.readAsDataURL(file);
                }
                return;
            }

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 3. Create generation record
            await createGeneration(publicUrl);
            success('画像生成を開始しました。処理が完了するまでお待ちください。');

        } catch (err: any) {
            console.error('Generation error:', err);
            const errorMessage = err.message || '画像生成に失敗しました。もう一度お試しください。';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setIsGeneratingLocal(false);
            setIsGenerating(false);
            setUploadProgress(0);
        }
    };

    const handleBatchGenerate = async () => {
        if (!user || batchFiles.length === 0) return;

        try {
            let completedCount = 0;

            // Update all files to uploading
            setBatchFiles(prev => prev.map(bf => ({ ...bf, status: 'uploading' as const })));

            // Process each file
            for (let i = 0; i < batchFiles.length; i++) {
                const batchFile = batchFiles[i];
                
                try {
                    // Update status
                    setBatchFiles(prev => prev.map(bf => 
                        bf.id === batchFile.id ? { ...bf, status: 'uploading', progress: 0 } : bf
                    ));

                    // Upload file
                    const fileExt = batchFile.file.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
                    const filePath = `originals/${fileName}`;

                    const progressInterval = setInterval(() => {
                        setBatchFiles(prev => prev.map(bf => 
                            bf.id === batchFile.id 
                                ? { ...bf, progress: Math.min(bf.progress + 5, 90) }
                                : bf
                        ));
                    }, 100);

                    const { error: uploadError } = await supabase.storage
                        .from('images')
                        .upload(filePath, batchFile.file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    clearInterval(progressInterval);

                    if (uploadError) {
                        // Use data URL as fallback
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            await createBatchGeneration(reader.result as string, batchFile.id);
                        };
                        reader.readAsDataURL(batchFile.file);
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('images')
                            .getPublicUrl(filePath);
                        await createBatchGeneration(publicUrl, batchFile.id);
                    }

                    completedCount++;
                } catch (err: any) {
                    console.error(`Error processing file ${i + 1}:`, err);
                    setBatchFiles(prev => prev.map(bf => 
                        bf.id === batchFile.id 
                            ? { ...bf, status: 'failed' as const, progress: 0 }
                            : bf
                    ));
                }
            }

            if (completedCount > 0) {
                success(`${completedCount}件の画像生成を開始しました。`);
            }

            // Clear batch files after a delay
            setTimeout(() => {
                clearFile();
            }, 2000);

        } catch (err: any) {
            console.error('Batch generation error:', err);
            showError('バッチ処理の開始に失敗しました。');
        } finally {
            setIsGeneratingLocal(false);
            setIsGenerating(false);
        }
    };

    const createBatchGeneration = async (originalUrl: string, batchFileId: string) => {
        if (!user) return;

        // Create generation record
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                original_url: originalUrl,
                status: 'queued',
                style: style,
                metadata: {
                    mode: mode,
                    style: style,
                    batch: true
                }
            })
            .select()
            .single();

        if (genError) throw genError;

        // Update batch file status
        setBatchFiles(prev => prev.map(bf => 
            bf.id === batchFileId 
                ? { ...bf, status: 'processing' as const, progress: 100, generationId: generation.id }
                : bf
        ));

        // Add to store
        addGeneration(generation as Generation);

        // Call Edge Function to process
        const { error: functionError } = await supabase.functions.invoke('generate-image', {
            body: { generation_id: generation.id }
        });

        if (functionError) {
            console.error('Edge function error:', functionError);
            await supabase
                .from('generations')
                .update({ status: 'failed' })
                .eq('id', generation.id);
            setBatchFiles(prev => prev.map(bf => 
                bf.id === batchFileId ? { ...bf, status: 'failed' as const } : bf
            ));
            return;
        }

        // Start polling
        startPolling(generation.id, batchFileId);
    };

    const createGeneration = async (originalUrl: string) => {
        if (!user) return;

        // Create generation record
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                original_url: originalUrl,
                status: 'queued',
                style: style,
                metadata: {
                    mode: mode,
                    style: style
                }
            })
            .select()
            .single();

        if (genError) throw genError;

        // Add to store
        addGeneration(generation as Generation);

        // 4. Call Edge Function to process
        const { error: functionError } = await supabase.functions.invoke('generate-image', {
            body: { generation_id: generation.id }
        });

        if (functionError) {
            console.error('Edge function error:', functionError);
            // Update status to failed
            await supabase
                .from('generations')
                .update({ status: 'failed' })
                .eq('id', generation.id);
            updateGeneration(generation.id, { status: 'failed' });
            throw new Error('画像処理の開始に失敗しました。');
        }

        // Start polling for status updates
        startPolling(generation.id);

        // Clear file after successful submission
        clearFile();
    };

    const startPolling = (generationId: string, batchFileId?: string) => {
        const pollInterval = setInterval(async () => {
            const { data, error } = await supabase
                .from('generations')
                .select('status, generated_url')
                .eq('id', generationId)
                .single();

            if (!error && data) {
                updateGeneration(generationId, {
                    status: data.status as any,
                    generated_url: data.generated_url
                });

                if (batchFileId) {
                    setBatchFiles(prev => prev.map(bf => 
                        bf.id === batchFileId 
                            ? { ...bf, status: data.status as any }
                            : bf
                    ));
                }

                if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    if (!batchFileId) {
                        success('画像生成が完了しました！');
                    }
                    // Refresh profile to update generation count
                    fetchLatestProfile();
                } else if (data.status === 'failed') {
                    clearInterval(pollInterval);
                    if (batchFileId) {
                        setBatchFiles(prev => prev.map(bf => 
                            bf.id === batchFileId ? { ...bf, status: 'failed' as const } : bf
                        ));
                    } else {
                        showError('画像生成に失敗しました。');
                    }
                }
            }
        }, 2000); // Poll every 2 seconds

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    };

    const fetchLatestProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (data) setProfile(data);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8 shadow-sm">
            {/* Step 1 Title */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">1</div>
                <h2 className="text-lg font-semibold text-slate-900">モードとスタイルを選択</h2>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button
                    onClick={() => setMode('staging')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-medium text-sm ${mode === 'staging'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <Sofa className={`h-4 w-4 ${mode === 'staging' ? 'text-blue-600' : 'text-slate-400'}`} />
                    家具を置く
                </button>
                <button
                    onClick={() => setMode('removal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-medium text-sm ${mode === 'removal'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <Eraser className={`h-4 w-4 ${mode === 'removal' ? 'text-blue-600' : 'text-slate-400'}`} />
                    家具を消す
                </button>
            </div>

            {/* Style Selector */}
            {mode === 'staging' && (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 px-1">スタイル</label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                        <option value="モダン">モダン</option>
                        <option value="ミニマル">ミニマル</option>
                        <option value="クラシック">クラシック</option>
                        <option value="スカンジナビア">スカンジナビア</option>
                        <option value="インダストリアル">インダストリアル</option>
                    </select>
                </div>
            )}

            {/* Batch Mode Toggle */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={isBatchMode}
                        onChange={(e) => {
                            setIsBatchMode(e.target.checked);
                            if (!e.target.checked) {
                                setBatchFiles([]);
                            } else {
                                setFile(null);
                                setPreview(null);
                            }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>バッチ処理モード（複数画像を一括生成）</span>
                </label>
                {isBatchMode && batchFiles.length > 0 && (
                    <button
                        onClick={clearFile}
                        className="text-xs text-slate-500 hover:text-slate-700"
                    >
                        すべてクリア
                    </button>
                )}
            </div>

            {/* Upload Area */}
            {isBatchMode && batchFiles.length > 0 ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {batchFiles.map((batchFile) => (
                            <div key={batchFile.id} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200">
                                    {batchFile.preview ? (
                                        <img
                                            src={batchFile.preview}
                                            alt={batchFile.file.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => removeBatchFile(batchFile.id)}
                                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 right-2">
                                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                                            {batchFile.file.name}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                                            {batchFile.status === 'pending' && <span>待機中</span>}
                                            {batchFile.status === 'uploading' && (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>アップロード中 {batchFile.progress}%</span>
                                                </>
                                            )}
                                            {batchFile.status === 'processing' && (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>処理中</span>
                                                </>
                                            )}
                                            {batchFile.status === 'completed' && (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                                                    <span>完了</span>
                                                </>
                                            )}
                                            {batchFile.status === 'failed' && (
                                                <>
                                                    <X className="h-3 w-3 text-red-400" />
                                                    <span>失敗</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {batchFile.progress > 0 && batchFile.progress < 100 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                                            <div
                                                className="h-full bg-blue-600 transition-all"
                                                style={{ width: `${batchFile.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-sm text-slate-500">
                        {batchFiles.length}枚の画像を選択中
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`relative aspect-[21/9] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center ${preview
                        ? 'border-slate-200 bg-white'
                        : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500'
                        }`}
                    onClick={() => !preview && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !preview) {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    aria-label="画像をアップロード"
                >
                    {preview ? (
                        <div className="relative w-full h-full group">
                            <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                            <button
                                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-lg hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto">
                                <Upload className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-base font-medium text-slate-900">タップして画像を選択</p>
                                <p className="text-slate-500 mt-1 text-sm">またはドラッグ＆ドロップ</p>
                            </div>
                            <p className="text-xs text-slate-400">JPG、PNG対応 / {isBatchMode ? '複数枚選択可' : '複数枚選択可'}</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        multiple={isBatchMode}
                    />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">エラー</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">アップロード中...</span>
                        <span className="text-slate-900 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Button */}
            {(file || (isBatchMode && batchFiles.length > 0)) && (
                <div className="flex justify-center pt-2">
                    <Button
                        onClick={handleGenerate}
                        isLoading={isGeneratingLocal}
                        disabled={isGeneratingLocal || uploadProgress > 0}
                        className="px-8 h-12 text-base font-medium"
                    >
                        {isBatchMode 
                            ? `${batchFiles.length}枚を一括生成`
                            : uploadProgress > 0 
                                ? 'アップロード中...' 
                                : '生成を開始する'}
                    </Button>
                </div>
            )}

            {/* Floating Toast */}
            <div className="fixed bottom-6 right-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xl flex items-center justify-between gap-6 min-w-[300px] z-50">
                <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                </button>
                <div className="space-y-0.5">
                    <p className="text-xs text-slate-500">このクオリティを全物件で</p>
                    <p className="text-lg font-semibold text-slate-900">月2,980円〜</p>
                </div>
                <button
                    onClick={() => window.location.href = '/pricing'}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    プランを見る
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </button>
            </div>
        </div>
    );
};
