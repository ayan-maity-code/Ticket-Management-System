import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

const ICONS = {
  success: '✓',
  error: '!',
  info: 'i',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const push = useCallback((message, variant = 'info', duration = 4200) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-glass toast-${t.variant} ${t.leaving ? 'toast-leave' : 'toast-enter'}`}
            role="status"
          >
            <span className={`toast-icon toast-icon-${t.variant}`} aria-hidden="true">
              {ICONS[t.variant] || ICONS.info}
            </span>
            <div className="toast-body">
              <span>{t.message}</span>
              <span className="toast-progress" style={{ animationDuration: `${t.duration}ms` }} />
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
