"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

type Phase =
  | "none"
  | "pre"
  | "start"
  | "active"
  | "test";

function minuteNow(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? 0,
  );

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return hour * 60 + minute;
}

function formatMinute(minute: number) {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export default function PowerHourAlert() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [windowItem, setWindowItem] = useState<WindowItem | null>(null);
  const [phase, setPhase] = useState<Phase>("none");
  const [largeUntil, setLargeUntil] = useState(0);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);

  const activatedKeys = useRef(new Set<string>());
  const repeatTimer = useRef<number | null>(null);

  const stopRepeatingAudio = useCallback(() => {
    if (repeatTimer.current !== null) {
      window.clearTimeout(repeatTimer.current);
      repeatTimer.current = null;
    }

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakOnce = useCallback((text: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }, []);

  const startRepeatingAudio = useCallback(
    ({
      text,
      until,
      alertKey,
    }: {
      text: string;
      until: number;
      alertKey: string;
    }) => {
      stopRepeatingAudio();

      const repeat = () => {
        if (
          Date.now() >= until ||
          dismissedKey === alertKey
        ) {
          stopRepeatingAudio();
          return;
        }

        if (
          typeof window === "undefined" ||
          !("speechSynthesis" in window)
        ) {
          return;
        }

        const utterance =
          new SpeechSynthesisUtterance(text);

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          if (
            Date.now() < until &&
            dismissedKey !== alertKey
          ) {
            repeatTimer.current =
              window.setTimeout(
                repeat,
                750,
              );
          }
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      };

      repeat();
    },
    [dismissedKey, stopRepeatingAudio],
  );

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/power-hour/today",
        { cache: "no-store" },
      );

      if (response.ok) {
        setPayload(await response.json());
      }
    } catch {
      // Power Hour alerts must never break HIVE.
    }
  }, []);

  const activateLargeAlert = useCallback(
    ({
      nextPhase,
      item,
      spokenText,
      durationSeconds,
      repeatAudio,
    }: {
      nextPhase: Phase;
      item: WindowItem;
      spokenText: string;
      durationSeconds: number;
      repeatAudio: boolean;
    }) => {
      const alertKey =
        `${nextPhase}-${item.startMinute}`;

      const until =
        Date.now() + durationSeconds * 1000;

      setWindowItem(item);
      setPhase(nextPhase);
      setDismissedKey(null);
      setLargeUntil(until);

      if (repeatAudio) {
        startRepeatingAudio({
          text: spokenText,
          until,
          alertKey,
        });
      } else {
        speakOnce(spokenText);
      }
    },
    [speakOnce, startRepeatingAudio],
  );

  useEffect(() => {
    refresh();

    const id = window.setInterval(
      refresh,
      5 * 60 * 1000,
    );

    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const ticker = window.setInterval(
      () => setRenderTick((value) => value + 1),
      500,
    );

    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!payload?.policy.enabled) {
      return;
    }

    const tick = () => {
      const now = minuteNow(payload.timeZone);

      let found: WindowItem | null = null;
      let next:
        | "none"
        | "pre"
        | "start"
        | "active" = "none";

      for (const item of payload.powerHours) {
        if (
          now >=
            item.startMinute -
              payload.policy.preAlertMinutes &&
          now < item.startMinute
        ) {
          found = item;
          next = "pre";
          break;
        }

        if (now === item.startMinute) {
          found = item;
          next = "start";
          break;
        }

        if (
          now > item.startMinute &&
          now < item.endMinute
        ) {
          found = item;
          next = "active";
          break;
        }
      }

      if (!found) {
        if (phase !== "test") {
          setWindowItem(null);
          setPhase("none");
        }
        return;
      }

      if (next === "pre" || next === "start") {
        const key =
          `${next}-${found.startMinute}`;

        if (!activatedKeys.current.has(key)) {
          activatedKeys.current.add(key);

          activateLargeAlert({
            nextPhase: next,
            item: found,
            spokenText:
              next === "pre"
                ? payload.policy.preAlertSpokenPhrase
                : payload.policy.startSpokenPhrase,
            durationSeconds:
              payload.policy.largeAlertDurationSeconds,

            // Pre-alert speaks once.
            // LIVE Power Hour repeats for the full alert duration.
            repeatAudio:
              next === "start",
          });
        } else {
          setWindowItem(found);
          setPhase(next);
        }

        return;
      }

      setWindowItem(found);
      setPhase(next);
    };

    tick();

    const id = window.setInterval(tick, 1000);

    return () => window.clearInterval(id);
  }, [payload, phase, activateLargeAlert]);

  useEffect(() => {
    const handleTest = () => {
      const duration =
        payload?.policy.largeAlertDurationSeconds ?? 60;

      const now = new Date();

      const startMinute =
        now.getHours() * 60 + now.getMinutes();

      const testItem: WindowItem = {
        label: "Test Power Hour",
        startMinute,
        endMinute: startMinute + 60,
        startTime: formatMinute(startMinute),
        endTime: formatMinute(startMinute + 60),
      };

      activateLargeAlert({
        nextPhase: "test",
        item: testItem,
        spokenText:
          payload?.policy.startSpokenPhrase ??
          "Grab your P.P.E. — POWER HOUR!",
        durationSeconds: duration,
        repeatAudio: true,
      });
    };

    window.addEventListener(
      "hive:power-hour-test",
      handleTest,
    );

    return () =>
      window.removeEventListener(
        "hive:power-hour-test",
        handleTest,
      );
  }, [payload, activateLargeAlert]);

  useEffect(() => {
    return () => {
      stopRepeatingAudio();
    };
  }, [stopRepeatingAudio]);

  const dismiss = () => {
    const key =
      `${phase}-${windowItem?.startMinute ?? "none"}`;

    setDismissedKey(key);
    setLargeUntil(0);

    stopRepeatingAudio();
  };

  if (!windowItem) {
    return null;
  }

  const key =
    `${phase}-${windowItem.startMinute}`;

  const large =
    (
      phase === "pre" ||
      phase === "start" ||
      phase === "test"
    ) &&
    key !== dismissedKey &&
    Date.now() < largeUntil;

  void renderTick;

  if (large) {
    const isPre = phase === "pre";

    return (
      <div
        className={`ph-alert ${
          isPre ? "pre" : "live"
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="ticker">
          <span>
            {isPre
              ? `⚠️ POWER HOUR IN ${payload?.policy.preAlertMinutes ?? 5} MINUTES • GET READY • ${windowItem.startTime}–${windowItem.endTime} •`
              : `⚡🐝 POWER HOUR IS LIVE! • GRAB YOUR P.P.E. • ${windowItem.startTime}–${windowItem.endTime} •`}
          </span>

          <span aria-hidden="true">
            {isPre
              ? `⚠️ POWER HOUR IN ${payload?.policy.preAlertMinutes ?? 5} MINUTES • GET READY • ${windowItem.startTime}–${windowItem.endTime} •`
              : `⚡🐝 POWER HOUR IS LIVE! • GRAB YOUR P.P.E. • ${windowItem.startTime}–${windowItem.endTime} •`}
          </span>
        </div>

        <button
          type="button"
          onClick={dismiss}
        >
          Dismiss ✕
        </button>

        <style>{`
          .ph-alert {
            position: fixed;
            z-index: 99999;
            left: 0;
            right: 0;
            top: 0;
            min-height: 70px;
            display: flex;
            align-items: center;
            overflow: hidden;
            box-shadow: 0 8px 28px rgba(0,0,0,.35);
            border-bottom: 3px solid rgba(0,0,0,.2);
          }

          .ph-alert.pre {
            background: #facc15;
            color: #241a00;
          }

          .ph-alert.live {
            background: #111827;
            color: #fde047;
          }

          .ticker {
            display: flex;
            width: max-content;
            min-width: 200%;
            white-space: nowrap;
            font-size: clamp(20px,2.7vw,36px);
            font-weight: 1000;
            letter-spacing: .04em;
            text-transform: uppercase;
            animation: phscroll 12s linear infinite;
          }

          .ticker span {
            padding-right: 50px;
          }

          .ph-alert button {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            border: 2px solid currentColor;
            border-radius: 999px;
            background: #fff;
            color: #111827;
            padding: 8px 13px;
            font-size: 12px;
            font-weight: 950;
            cursor: pointer;
          }

          @keyframes phscroll {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .ticker {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  if (phase === "test") {
    return null;
  }

  if (
    payload?.policy.showActiveBanner &&
    (phase === "active" || phase === "start")
  ) {
    return (
      <div className="ph-small">
        ⚡ POWER HOUR • {windowItem.startTime}–{windowItem.endTime}

        <style>{`
          .ph-small {
            position: fixed;
            z-index: 99998;
            left: 50%;
            top: 10px;
            transform: translateX(-50%);
            padding: 7px 12px;
            border-radius: 999px;
            background: #111827;
            color: #fde047;
            font-size: 11px;
            font-weight: 850;
            box-shadow: 0 6px 20px rgba(0,0,0,.2);
          }
        `}</style>
      </div>
    );
  }

  return null;
}
