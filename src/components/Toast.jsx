import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastStyles = {
    success: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500',
        text: 'text-emerald-400',
        icon: CheckCircle,
    },
    error: {
        bg: 'bg-red-500/20',
        border: 'border-red-500',
        text: 'text-red-400',
        icon: XCircle,
    },
    warning: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500',
        text: 'text-amber-400',
        icon: AlertTriangle,
    },
    info: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500',
        text: 'text-blue-400',
        icon: Info,
    },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[480px] mx-auto">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const style = toastStyles[toast.type] || toastStyles.info;
                        const Icon = style.icon;
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border-2 backdrop-blur-lg ${style.bg} ${style.border}`}
                            >
                                <Icon size={20} className={style.text} />
                                <span className={`flex-1 text-sm font-medium ${style.text}`}>
                                    {toast.message}
                                </span>
                                <button
                                    onClick={() => dismissToast(toast.id)}
                                    className={`${style.text} opacity-60 hover:opacity-100 transition-opacity`}
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
