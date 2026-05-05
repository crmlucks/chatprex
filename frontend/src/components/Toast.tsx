import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Trash2, ArrowRightLeft } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
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

// ─── Context ─────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

// ─── Single Toast Item ──────────────────────────────────────────────
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
      case 'success': return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case 'error': return <Trash2 size={18} className="text-rose-500 shrink-0" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500 shrink-0" />;
      case 'info': return <ArrowRightLeft size={18} className="text-blue-500 shrink-0" />;
      default: return <Info size={18} className="text-slate-400 shrink-0" />;
    }
  };

  const bgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'error': return 'bg-rose-500/10 border-rose-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${bgColor()} ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      {icon()}
      <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
      <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} className="text-slate-400 hover:text-white transition-colors p-0.5">
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Confirm Dialog Item ────────────────────────────────────────────
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleCancel}>
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-[#1E1E2E] border border-slate-700 rounded-2xl shadow-2xl p-5 max-w-sm w-full mx-4 transition-all duration-300 ${exiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{ animation: 'popIn 0.25s ease-out' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">Confirmar acción</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{confirm.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            {confirm.cancelText || 'Cancelar'}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            {confirm.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Provider ───────────────────────────────────────────────────────
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

      {/* Toast Stack */}
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      {/* Confirm Modals */}
      {confirms.map(c => (
        <ConfirmItem key={c.id} confirm={c} onDone={dismissConfirm} />
      ))}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
