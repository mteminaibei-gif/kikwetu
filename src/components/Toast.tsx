'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';

interface ToastContextType {
  show: (msg: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 z-[100] px-3 max-w-[min(24rem,calc(100vw-1.5rem))] transition-all duration-300 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <div className="bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl text-center leading-snug backdrop-blur-sm border border-white/10 dark:border-black/5">
          {message}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
