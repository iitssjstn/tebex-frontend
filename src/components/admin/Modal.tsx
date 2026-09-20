"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { width: "min(64rem,100%)" } : { width: "min(40rem,100%)" }}>
        <header>
          <b>{title}</b>
          <button type="button" className="b s" onClick={onClose}>Close</button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
