import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Trash2, ArrowRightLeft } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ConfirmToast {
  id: number;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (message: string, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const dur = toast.duration || 3000;
    const exitTimer = setTimeout(() => setExiting(true), dur - 300);
    const removeTimer = setTimeout(() => onDismiss(toast.id), dur);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, [toast, onDismiss]);

  const icon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case 'error': return <Trash2 size={16} className="text-red-500 shrink-0" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
      case 'info': return <ArrowRightLeft size={16} className="text-blue-500 shrink-0" />;
      default: return <Info size={16} className="text-content-muted shrink-0" />;
    }
  };

  const bgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-surface border-edge';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border pointer-events-auto transition-all duration-300 bg-surface ${bgColor()} ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
      style={{ animation: 'toastSlideIn 0.3s ease-out' }}
    >
      {icon()}
      <p className="text-sm font-medium text-content flex-1">{toast.message}</p>
      <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} className="text-content-muted hover:text-content transition-colors p-1 rounded-md hover:bg-surface-inset">
        <X size={14} />
      </button>
    </div>
  );
};

const ConfirmItem = ({ confirm, onDone }: { confirm: ConfirmToast; onDone: (id: number) => void }) => {
  const [exiting, setExiting] = useState(false);

  const handleConfirm = () => {
    confirm.onConfirm();
    setExiting(true);
    setTimeout(() => onDone(confirm.id), 300);
  };

  const handleCancel = () => {
    confirm.onCancel();
    setExiting(true);
    setTimeout(() => onDone(confirm.id), 300);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={handleCancel}>
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-surface border border-edge rounded-xl p-6 max-w-md w-full mx-4 transition-all duration-300 ${exiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{ animation: 'confirmPop 0.3s ease-out' }}
      >
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content mb-1">Confirmar acción</h3>
            <p className="text-sm text-content-secondary">{confirm.message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 text-sm font-medium text-content-secondary bg-surface-inset hover:bg-surface-raised rounded-lg border border-edge transition-colors"
          >
            {confirm.cancelText || 'Cancelar'}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
          >
            {confirm.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirms, setConfirms] = useState<ConfirmToast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string }) => {
    const id = Date.now() + Math.random();
    setConfirms(prev => [...prev, { id, message, onConfirm, onCancel: () => {}, confirmText: options?.confirmText, cancelText: options?.cancelText }]);
  }, []);

  const dismissConfirm = useCallback((id: number) => {
    setConfirms(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>

      {confirms.map(c => (
        <ConfirmItem key={c.id} confirm={c} onDone={dismissConfirm} />
      ))}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
