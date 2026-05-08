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
      case 'success': return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case 'error': return <Trash2 size={18} className="text-rose-500 shrink-0" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500 shrink-0" />;
      case 'info': return <ArrowRightLeft size={18} className="text-blue-500 shrink-0" />;
      default: return <Info size={18} className="text-slate-400 shrink-0" />;
    }
  };

  const bgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10';
      case 'error': return 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/10';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/10';
      default: return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div
      className={`flex items-center gap-4 px-6 py-4 rounded-[24px] border backdrop-blur-2xl shadow-2xl transition-all duration-300 pointer-events-auto ${bgColor()} ${exiting ? 'opacity-0 translate-x-12 scale-90' : 'opacity-100 translate-x-0 scale-100'}`}
      style={{ animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10">{icon()}</div>
      <p className="text-[13px] font-black lowercase text-white tracking-tight flex-1">{toast.message}</p>
      <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/5">
        <X size={16} />
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={handleCancel}>
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-[#1E1E1E] border border-slate-800 rounded-[40px] shadow-2xl p-10 max-w-md w-full mx-4 transition-all duration-300 ${exiting ? 'opacity-0 scale-90 translate-y-10' : 'opacity-100 scale-100 translate-y-0'}`}
        style={{ animation: 'confirmPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex flex-col items-center text-center gap-6 mb-10">
          <div className="w-20 h-20 rounded-[28px] bg-amber-500/10 flex items-center justify-center shadow-2xl shadow-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={36} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white lowercase mb-2">confirmar acción</h3>
            <p className="text-[13px] font-bold text-slate-500 leading-relaxed">{confirm.message}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all"
          >
            {confirm.cancelText || 'cancelar'}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-white bg-primary hover:bg-primary-dark rounded-2xl transition-all shadow-2xl shadow-primary/30 active:scale-95"
          >
            {confirm.confirmText || 'confirmar'}
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

      <div className="fixed top-8 right-8 z-[9998] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>

      {confirms.map(c => (
        <ConfirmItem key={c.id} confirm={c} onDone={dismissConfirm} />
      ))}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.9) translateY(40px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
