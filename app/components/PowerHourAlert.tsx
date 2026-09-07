"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WindowItem = {
  label: string;
  startMinute: number;
  endMinute: number;
  startTime: string;
  endTime: string;
};

type Policy = {
  enabled: boolean;
  preAlertMinutes: number;
  largeAlertDurationSeconds: number;
  audioEnabled: boolean;
  preAlertSpokenPhrase: string;
  startSpokenPhrase: string;
  showActiveBanner: boolean;
};

type Payload = {
  timeZone: string;
  policy: Policy;
  powerHours: WindowItem[];
};

function minuteNow(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export default function PowerHourAlert() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [windowItem, setWindowItem] = useState<WindowItem | null>(null);
  const [phase, setPhase] = useState<"none" | "pre" | "start" | "active">("none");
  const [largeUntil, setLargeUntil] = useState(0);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const spoken = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/power-hour/today", { cache: "no-store" });
      if (r.ok) setPayload(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!payload?.policy.enabled) return;

    const tick = () => {
      const now = minuteNow(payload.timeZone);
      let found: WindowItem | null = null;
      let next: typeof phase = "none";

      for (const w of payload.powerHours) {
        if (now >= w.startMinute - payload.policy.preAlertMinutes && now < w.startMinute) {
          found = w; next = "pre"; break;
        }
        if (now === w.startMinute) {
          found = w; next = "start"; break;
        }
        if (now > w.startMinute && now < w.endMinute) {
          found = w; next = "active"; break;
        }
      }

      setWindowItem(found);
      setPhase(next);

      if (!found || (next !== "pre" && next !== "start")) return;

      const key = `${next}-${found.startMinute}`;

      if (!spoken.current.has(key)) {
        spoken.current.add(key);
        setLargeUntil(Date.now() + payload.policy.largeAlertDurationSeconds * 1000);

        if (
          payload.policy.audioEnabled &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          window.speechSynthesis.cancel();
          const text =
            next === "pre"
              ? payload.policy.preAlertSpokenPhrase
              : payload.policy.startSpokenPhrase;
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [payload]);

  if (!payload || !windowItem) return null;

  const key = `${phase}-${windowItem.startMinute}`;
  const large =
    (phase === "pre" || phase === "start") &&
    key !== dismissedKey &&
    Date.now() < largeUntil;

  const dismiss = () => {
    setDismissedKey(key);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  if (large) {
    return (
      <div className={`ph-alert ${phase === "pre" ? "pre" : "live"}`} role="alert">
        <div className="ticker">
          <span>
            {phase === "pre"
              ? `⚠️ POWER HOUR IN ${payload.policy.preAlertMinutes} MINUTES • GET READY • ${windowItem.startTime}–${windowItem.endTime} •`
              : `⚡🐝 POWER HOUR IS LIVE! • GRAB YOUR P.P.E. • ${windowItem.startTime}–${windowItem.endTime} •`}
          </span>
          <span aria-hidden="true">
            {phase === "pre"
              ? `⚠️ POWER HOUR IN ${payload.policy.preAlertMinutes} MINUTES • GET READY • ${windowItem.startTime}–${windowItem.endTime} •`
              : `⚡🐝 POWER HOUR IS LIVE! • GRAB YOUR P.P.E. • ${windowItem.startTime}–${windowItem.endTime} •`}
          </span>
        </div>

        <button type="button" onClick={dismiss}>Dismiss ✕</button>

        <style>{`
          .ph-alert{position:fixed;z-index:99999;left:0;right:0;top:0;min-height:64px;display:flex;align-items:center;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.28)}
          .ph-alert.pre{background:#facc15;color:#241a00}
          .ph-alert.live{background:#111827;color:#fde047}
          .ticker{display:flex;width:max-content;min-width:200%;white-space:nowrap;font-size:clamp(18px,2.5vw,34px);font-weight:1000;text-transform:uppercase;animation:phscroll 12s linear infinite}
          .ticker span{padding-right:40px}
          .ph-alert button{position:absolute;right:12px;top:50%;transform:translateY(-50%);border:2px solid currentColor;border-radius:999px;background:#fff;color:#111827;padding:8px 13px;font-size:12px;font-weight:950;cursor:pointer}
          @keyframes phscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        `}</style>
      </div>
    );
  }

  if (payload.policy.showActiveBanner && (phase === "active" || phase === "start")) {
    return (
      <div className="ph-small">
        ⚡ POWER HOUR • {windowItem.startTime}–{windowItem.endTime}
        <style>{`
          .ph-small{position:fixed;z-index:99998;left:50%;top:10px;transform:translateX(-50%);padding:7px 12px;border-radius:999px;background:#111827;color:#fde047;font-size:11px;font-weight:850;box-shadow:0 6px 20px rgba(0,0,0,.2)}
        `}</style>
      </div>
    );
  }

  return null;
}
