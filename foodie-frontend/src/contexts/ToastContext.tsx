'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastInstance {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-50',
  error: 'border-rose-400/60 bg-rose-500/10 text-rose-100',
  info: 'border-white/20 bg-white/10 text-white',
};

function ToastContainer({ toasts, onDismiss }: { toasts: ToastInstance[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[1000] flex max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onDismiss }: { toast: ToastInstance; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setVisible(true));
    const autoDismiss = window.setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(autoDismiss);
    };
  }, []);

  useEffect(() => {
    if (visible) return undefined;

    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 220);

    return () => clearTimeout(timeout);
  }, [onDismiss, toast.id, visible]);

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3 shadow-lg shadow-black/40 backdrop-blur transition-all duration-300 ease-out ${
        TYPE_STYLES[toast.type]
      } ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-sm font-medium leading-snug">{toast.message}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="-mr-1 rounded-full p-1 text-current transition hover:bg-black/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>((message, type = 'info') => {
    if (!message) return;

    setToasts((prev) => [
      ...prev,
      {
        id: idRef.current++,
        message,
        type,
      },
    ]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
