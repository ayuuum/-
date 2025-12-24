import React, { useState } from 'react';
import { Download, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import type { Generation } from '../types';

interface ExportDialogProps {
    generation: Generation;
    onClose: () => void;
}

type ExportFormat = 'jpg' | 'png' | 'webp';
type ExportQuality = 'high' | 'medium' | 'low';

const QUALITY_SETTINGS = {
    high: { quality: 0.95, scale: 1.0 },
    medium: { quality: 0.8, scale: 0.8 },
    low: { quality: 0.6, scale: 0.6 },
};

export const ExportDialog: React.FC<ExportDialogProps> = ({ generation, onClose }) => {
    const [format, setFormat] = useState<ExportFormat>('jpg');
    const [quality, setQuality] = useState<ExportQuality>('high');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!generation.generated_url) return;

        setExporting(true);

        try {
            // Fetch the image
            const response = await fetch(generation.generated_url);
            if (!response.ok) throw new Error('画像の取得に失敗しました。');

            const blob = await response.blob();
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error('Canvas context not available');

            img.onload = () => {
                const settings = QUALITY_SETTINGS[quality];
                const width = Math.floor(img.width * settings.scale);
                const height = Math.floor(img.height * settings.scale);

                canvas.width = width;
                canvas.height = height;

                // Draw image with quality settings
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to desired format
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            setExporting(false);
                            return;
                        }

                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `stagex-${generation.style}-${generation.id}.${format}`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        setExporting(false);
                        onClose();
                    },
                    format === 'jpg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp',
                    format === 'png' ? undefined : settings.quality
                );
            };

            img.onerror = () => {
                throw new Error('画像の読み込みに失敗しました。');
            };

            img.src = URL.createObjectURL(blob);
        } catch (err: any) {
            console.error('Export error:', err);
            alert(err.message || 'エクスポートに失敗しました。');
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">画像をエクスポート</h3>
                            <p className="text-xs text-slate-500">形式と品質を選択</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-3 block">形式</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['jpg', 'png', 'webp'] as ExportFormat[]).map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setFormat(fmt)}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                                        format === fmt
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    {fmt.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality Selection */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-3 block">品質</label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { value: 'high' as ExportQuality, label: '高品質', desc: '100%' },
                                { value: 'medium' as ExportQuality, label: '標準', desc: '80%' },
                                { value: 'low' as ExportQuality, label: '軽量', desc: '60%' },
                            ]).map((q) => (
                                <button
                                    key={q.value}
                                    onClick={() => setQuality(q.value)}
                                    className={`px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                                        quality === q.value
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-medium">{q.label}</div>
                                    <div className="text-xs opacity-70">{q.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview Info */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">解像度</span>
                            <span className="font-medium text-slate-900">
                                {QUALITY_SETTINGS[quality].scale === 1.0 ? 'オリジナル' : 
                                 `${Math.floor(QUALITY_SETTINGS[quality].scale * 100)}%`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">ファイル形式</span>
                            <span className="font-medium text-slate-900">{format.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleExport}
                            isLoading={exporting}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            エクスポート
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

