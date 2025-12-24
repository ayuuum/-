import React, { useState, useRef } from 'react';

interface CompareSliderProps {
    originalUrl: string;
    generatedUrl: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ originalUrl, generatedUrl }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const position = ((x - rect.left) / rect.width) * 100;

        setSliderPosition(Math.max(0, Math.min(100, position)));
    };

    return (
        <div
            ref={containerRef}
            className="relative aspect-video w-full rounded-lg overflow-hidden cursor-col-resize select-none"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
        >
            {/* Generated Image (Right Side) */}
            <img
                src={generatedUrl}
                alt="Generated"
                className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Original Image (Left Side, Clipped) */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={originalUrl}
                    alt="Original"
                    className="absolute inset-0 h-full w-[100vw] max-w-none object-cover"
                    style={{ width: containerRef.current?.offsetWidth }}
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                    Before
                </div>
            </div>

            <div className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                After
            </div>

            {/* Slider Line */}
            <div
                className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-4 4m0 0l4 4m-4-4h16m0 0l-4-4m4 4l-4 4" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
