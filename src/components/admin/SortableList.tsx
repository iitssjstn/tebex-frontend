"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

let n = 0;
const key = () => `k${++n}`;

type Props<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  title: (item: T, index: number) => ReactNode;
  body: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  headerExtra?: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  empty?: string;
  defaultOpen?: boolean;
};

/** Reorderable list: drag the handle or use the arrow buttons (keyboard friendly). */
export function SortableList<T extends object>({ items, onChange, title, body, headerExtra, empty = "Nothing here yet.", defaultOpen = false }: Props<T>) {
  const [keys, setKeys] = useState<string[]>(() => items.map(key));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [over, setOver] = useState<number | null>(null);
  const drag = useRef<number | null>(null);

  useEffect(() => {
    if (keys.length !== items.length) setKeys(items.map(key));
  }, [items, keys.length]);

  const ks = keys.length === items.length ? keys : items.map((_, i) => keys[i] ?? key());

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const k = [...ks];
    next.splice(to, 0, next.splice(from, 1)[0]);
    k.splice(to, 0, k.splice(from, 1)[0]);
    setKeys(k);
    onChange(next);
  };

  if (!items.length) return <div className="empty-a">{empty}</div>;

  return (
    <div>
      {items.map((item, i) => {
        const k = ks[i];
        const isOpen = open.has(k) || (defaultOpen && !open.has(`x${k}`));
        const update = (patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
        return (
          <div
            key={k}
            className="list-item"
            data-drag={over === i ? "over" : undefined}
            onDragOver={(e) => {
              if (drag.current !== null) {
                e.preventDefault();
                setOver(i);
              }
            }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (drag.current !== null) move(drag.current, i);
              drag.current = null;
              setOver(null);
            }}
          >
            <div className="li-head" draggable onDragStart={(e) => { drag.current = i; e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { drag.current = null; setOver(null); }}>
              <span className="grip" aria-hidden title="Drag to reorder">&#x2807;&#x2807;</span>
              <button
                type="button"
                className="ttl"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((s) => {
                    const c = new Set(s);
                    if (defaultOpen) {
                      c.has(`x${k}`) ? c.delete(`x${k}`) : c.add(`x${k}`);
                    } else {
                      c.has(k) ? c.delete(k) : c.add(k);
                    }
                    return c;
                  })
                }
              >
                {title(item, i)}
              </button>
              {headerExtra ? headerExtra(item, i, update) : null}
              <button type="button" className="b s" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">&uarr;</button>
              <button type="button" className="b s" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down">&darr;</button>
              <button type="button" className="b s d" onClick={() => { onChange(items.filter((_, j) => j !== i)); setKeys(ks.filter((_, j) => j !== i)); }} aria-label="Delete">&times;</button>
            </div>
            {isOpen ? <div className="li-body">{body(item, i, update)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
