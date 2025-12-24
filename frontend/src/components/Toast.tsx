import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

export const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-600" />,
        error: <XCircle className="h-5 w-5 text-red-600" />,
        warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        info: <Info className="h-5 w-5 text-blue-600" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
    };

    return (
        <div
            className={`${bgColors[toast.type]} border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-slate-900">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-6 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};

