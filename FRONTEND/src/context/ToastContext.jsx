import { createContext, useCallback, useContext, useRef } from "react";
import { Toast } from "primereact/toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toastRef = useRef(null);

  const showToast = useCallback((severity, summary, detail) => {
    toastRef.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <Toast
        ref={toastRef}
        position="top-right"
        className="app-toast-offset"
      />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
