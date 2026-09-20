"use client";

import { useEffect, useState } from "react";

type Status = { available: boolean; online: boolean; players: { online: number; max: number } | null; showStatus: boolean; showPlayers: boolean };

function useStatus(): Status | null | "loading" {
  const [s, setS] = useState<Status | null | "loading">("loading");
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/server-status")
        .then((r) => r.json())
        .then((j: Status) => alive && setS(j))
        .catch(() => alive && setS(null));
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return s;
}

type Labels = { online: string; offline: string; statusUnavailable: string; playersOnline: string };

export function StatusPanel({ title, description, ip, labels }: { title: string; description: string; ip: string; labels: Labels }) {
  const s = useStatus();
  const known = s && s !== "loading" && s.available;
  return (
    <div className="status-panel">
      <div>
        <h2>{title}</h2>
        {description ? <p className="muted" style={{ margin: ".5rem 0 1rem" }}>{description}</p> : null}
        {s === "loading" ? (
          <div className="status-line" aria-live="polite"><span className="dot" />&nbsp;</div>
        ) : s && s.showStatus === false ? null : (
          <div className="status-line" aria-live="polite">
            <span className="dot" data-s={known ? (s.online ? "on" : "off") : ""} />
            {known ? (s.online ? labels.online : labels.offline) : labels.statusUnavailable}
          </div>
        )}
        {known && s.online && s.players && s.showPlayers ? (
          <>
            <p style={{ margin: ".5rem 0 0" }}>
              <b>{s.players.online}</b>
              {s.players.max ? ` / ${s.players.max}` : ""} {labels.playersOnline}
            </p>
            {s.players.max ? <div className="meter" aria-hidden><i style={{ width: `${Math.min(100, (s.players.online / s.players.max) * 100)}%` }} /></div> : null}
          </>
        ) : null}
      </div>
      {ip ? <CopyIp ip={ip} copyLabel="Copy" copiedLabel="Copied" /> : null}
    </div>
  );
}

export function CopyIp({ ip, copyLabel, copiedLabel }: { ip: string; copyLabel: string; copiedLabel: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="chip"
      title={copyLabel}
      onClick={() => {
        navigator.clipboard?.writeText(ip).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      <span>{ip}</span>
      <small aria-live="polite" className="muted">{done ? copiedLabel : copyLabel}</small>
    </button>
  );
}

export function PlayerChip({ labels }: { labels: Labels }) {
  const s = useStatus();
  if (s === "loading" || !s || !s.showStatus) return null;
  if (!s.available) return <span className="chip"><span className="dot" />{labels.statusUnavailable}</span>;
  return (
    <span className="chip" aria-live="polite">
      <span className="dot" data-s={s.online ? "on" : "off"} />
      {s.online ? (s.players && s.showPlayers ? `${s.players.online} ${labels.playersOnline}` : labels.online) : labels.offline}
    </span>
  );
}
