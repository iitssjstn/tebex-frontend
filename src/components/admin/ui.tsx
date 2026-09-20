"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Toast = { id: number; text: string; kind: "ok" | "e" };
const ToastCtx = createContext<(text: string, kind?: "ok" | "e") => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: "ok" | "e" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, text, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === "e" ? 6000 : 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={t.kind === "e" ? "e" : ""}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Warns before leaving the page while there are unsaved changes. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}

export function Field({ label, help, children, id }: { label: string; help?: string; children: ReactNode; id?: string }) {
  return (
    <div className="f">
      {id ? <label htmlFor={id}>{label}</label> : <span className="lbl">{label}</span>}
      {children}
      {help ? <small>{help}</small> : null}
    </div>
  );
}

export function SaveBar({ children, message, error, dirty }: { children: ReactNode; message?: string; error?: boolean; dirty?: boolean }) {
  return (
    <div className="savebar">
      <span className={`msg ${error ? "err" : message ? "ok" : ""}`} role="status">{message ?? (dirty ? "You have unsaved changes." : "")}</span>
      {children}
    </div>
  );
}

export function Confirm({ text, children }: { text: string; children: (ask: (fn: () => void) => void) => ReactNode }) {
  return <>{children((fn) => { if (window.confirm(text)) fn(); })}</>;
}

export const Tag = ({ kind = "", children }: { kind?: "ok" | "warn" | "bad" | "blue" | ""; children: ReactNode }) => <span className={`tag ${kind}`}>{children}</span>;
