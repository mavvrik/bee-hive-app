"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type WorkerBeeCardProps = {
  name: string;
  roleLabel: string;

  /*
   * Production recorded for today.
   */
  currentLiters: number;

  /*
   * Weekly stick total remains a supporting KPI.
   */
  currentSticks: number;
  litersPerStick: number;

  /*
   * Individual weighted targets.
   */
  dailyTargetLiters: number;
  weeklyTargetLiters: number;

  isTopWorker?: boolean;
  isManagement?: boolean;
};

export default function WorkerBeeCard({
  name,
  roleLabel,
  currentLiters,
  currentSticks,
  litersPerStick,
  dailyTargetLiters,
  weeklyTargetLiters,
  isTopWorker = false,
  isManagement = false,
}: WorkerBeeCardProps) {
  const rawPercent =
    dailyTargetLiters > 0
      ? (currentLiters /
          dailyTargetLiters) *
        100
      : 0;

  /*
   * The progress bar visually stops at 100%,
   * while the displayed percentage may exceed
   * 100% when a contributor surpasses goal.
   */
  const targetPercent = useMemo(() => {
    return Math.min(
      Math.max(rawPercent, 0),
      100,
    );
  }, [rawPercent]);

  const [animatedPercent, setAnimatedPercent] =
    useState(0);

  useEffect(() => {
    const duration = 850;
    const startTime = performance.now();
    const startingPercent = animatedPercent;

    let animationFrame = 0;

    const animate = (time: number) => {
      const elapsed = time - startTime;

      const progress = Math.min(
        elapsed / duration,
        1,
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setAnimatedPercent(
        startingPercent +
          (targetPercent - startingPercent) *
            eased,
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [targetPercent]);

  const performanceClass =
    rawPercent >= 100
      ? "goal-achieved"
      : rawPercent >= 90
        ? "near-goal"
        : "goal-in-progress";

  return (
    <article
      className={`worker-bee-card ${performanceClass} ${
        isTopWorker
          ? "top-worker-card"
          : ""
      }`}
      aria-label={`${name}, ${rawPercent.toFixed(
        0,
      )}% of daily goal`}
    >
      {isTopWorker && (
        <div className="top-worker-ribbon">
          Top Worker
        </div>
      )}

      <div className="worker-left-panel">
        <div className="worker-bee-stage">
          {isManagement ? (
            <ManagementBees />
          ) : (
            <BeeIllustration
              progress={targetPercent}
            />
          )}
        </div>

        <div className="worker-identity">
          <strong>{name}</strong>

          <span>{roleLabel}</span>
        </div>
      </div>

      <div className="worker-right-panel">
        <div className="worker-progress-heading">
          <div
            className="worker-progress-ring"
            style={{
              background: `conic-gradient(
                #d99b0b ${targetPercent}%,
                #f1e7c3 ${targetPercent}% 100%
              )`,
            }}
            aria-hidden="true"
          >
            <div className="worker-progress-ring-inner">
              <strong>
                {rawPercent.toFixed(0)}%
              </strong>

              <span>Daily Goal</span>
            </div>
          </div>

          <div className="worker-liter-summary">
            <span className="worker-production-label">
              Today&apos;s Production
            </span>

            <strong>
              {formatLiters(currentLiters)}
            </strong>

            <small>
              of{" "}
              {formatLiters(
                dailyTargetLiters,
              )}{" "}
              daily goal
            </small>
          </div>
        </div>

        <div className="worker-progress-track">
          <div
            className="worker-progress-fill"
            style={{
              width: `${animatedPercent}%`,
            }}
          />
        </div>

        <div className="worker-kpi-row">
          <WorkerMetric
            label="Daily Goal"
            value={formatLiters(
              dailyTargetLiters,
            )}
          />

          <WorkerMetric
            label="Weekly Goal"
            value={formatLiters(
              weeklyTargetLiters,
            )}
          />

          <WorkerMetric
            label="Weekly Sticks"
            value={currentSticks.toLocaleString(
              "en-US",
            )}
          />

          <WorkerMetric
            label="Liters / Stick"
            value={litersPerStick.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              },
            )}
          />
        </div>
      </div>

      <style>
        {`
          .worker-bee-card {
            position: relative;
            display: grid;
            grid-template-columns:
              minmax(105px, 0.85fr)
              minmax(0, 1.15fr);
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            border: 1px solid
              rgba(202, 163, 56, 0.56);
            border-radius: 16px;
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.97),
                rgba(255, 249, 224, 0.9)
              );
            box-shadow:
              0 5px 12px
                rgba(94, 66, 8, 0.07),
              inset 0 1px 0
                rgba(255, 255, 255, 0.9);
            box-sizing: border-box;
          }

          .worker-bee-card.top-worker-card {
            border-color: #d89609;
            box-shadow:
              0 6px 18px
                rgba(211, 145, 7, 0.16),
              inset 0 0 0 2px
                rgba(217, 155, 11, 0.11);
          }

          .worker-bee-card.goal-achieved {
            border-color:
              rgba(74, 145, 72, 0.72);
          }

          .worker-bee-card.near-goal {
            border-color:
              rgba(214, 156, 20, 0.8);
          }

          .top-worker-ribbon {
            position: absolute;
            z-index: 8;
            top: 7px;
            right: -28px;
            width: 105px;
            padding: 3px 0;
            transform: rotate(34deg);
            background:
              linear-gradient(
                90deg,
                #d68d05,
                #f2bb2c
              );
            color: #4b3104;
            font-size: 0.49rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-align: center;
            text-transform: uppercase;
            box-shadow:
              0 2px 6px
                rgba(86, 56, 4, 0.18);
          }

          .worker-left-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            min-width: 0;
            min-height: 0;
            padding: 7px 6px 8px;
            border-right: 1px solid
              rgba(203, 165, 59, 0.25);
            background:
              linear-gradient(
                180deg,
                rgba(255, 251, 230, 0.9),
                rgba(243, 220, 139, 0.28)
              );
          }

          .worker-bee-stage {
            display: flex;
            flex: 1;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 0;
          }

          .worker-identity {
            flex: 0 0 auto;
            width: 100%;
            text-align: center;
          }

          .worker-identity strong {
            display: block;
            overflow: hidden;
            color: #392706;
            font-size: 0.82rem;
            line-height: 1.05;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-identity span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            max-width: 100%;
            margin-top: 4px;
            padding: 3px 7px;
            overflow: hidden;
            border: 1px solid
              rgba(85, 131, 42, 0.22);
            border-radius: 999px;
            background: #edf5d9;
            color: #466527;
            font-size: 0.49rem;
            font-weight: 900;
            line-height: 1;
            text-overflow: ellipsis;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .worker-right-panel {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
            min-height: 0;
            padding: 8px 9px;
          }

          .worker-progress-heading {
            display: grid;
            grid-template-columns:
              64px minmax(0, 1fr);
            align-items: center;
            gap: 9px;
            min-width: 0;
          }

          .worker-progress-ring {
            display: grid;
            width: 60px;
            height: 60px;
            place-items: center;
            border-radius: 50%;
            filter:
              drop-shadow(
                0 3px 4px
                rgba(106, 74, 7, 0.13)
              );
          }

          .worker-progress-ring-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background:
              linear-gradient(
                180deg,
                #fffdf4,
                #fff5cd
              );
          }

          .worker-progress-ring-inner strong {
            display: block;
            color: #4a3205;
            font-size: 0.92rem;
            line-height: 1;
          }

          .worker-progress-ring-inner span {
            display: block;
            margin-top: 3px;
            color: #705316;
            font-size: 0.36rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-align: center;
            text-transform: uppercase;
          }

          .worker-liter-summary {
            min-width: 0;
          }

          .worker-production-label {
            display: block;
            margin: 0 0 3px;
            color: #82661c;
            font-size: 0.45rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .worker-liter-summary strong {
            display: block;
            overflow: hidden;
            color: #342406;
            font-size: clamp(
              1.05rem,
              1.35vw,
              1.45rem
            );
            line-height: 1;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-liter-summary small {
            display: block;
            margin-top: 4px;
            overflow: hidden;
            color: #7e6b43;
            font-size: 0.48rem;
            font-weight: 700;
            line-height: 1.2;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-progress-track {
            position: relative;
            height: 7px;
            margin-top: 8px;
            overflow: hidden;
            border-radius: 999px;
            background:
              rgba(160, 125, 37, 0.17);
            box-shadow:
              inset 0 1px 2px
                rgba(81, 56, 6, 0.1);
          }

          .worker-progress-fill {
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                #d98f08,
                #f3bf2c,
                #f8dc6d
              );
            transition:
              width 850ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                );
          }

          .worker-bee-card.goal-achieved
          .worker-progress-fill {
            background:
              linear-gradient(
                90deg,
                #4f9a51,
                #78bd67,
                #b0db80
              );
          }

          .worker-kpi-row {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 6px;
            margin-top: 7px;
          }

          .worker-kpi {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
            min-height: 48px;
            padding: 6px;
            border: 1px solid
              rgba(189, 151, 45, 0.22);
            border-radius: 8px;
            background:
              rgba(255, 255, 255, 0.7);
            text-align: center;
            box-sizing: border-box;
          }

          .worker-kpi span {
            display: block;
            min-height: 20px;
            overflow: visible;
            color: #897341;
            font-size: 0.4rem;
            font-weight: 900;
            letter-spacing: 0.035em;
            line-height: 1.15;
            text-overflow: unset;
            text-transform: uppercase;
            white-space: normal;
          }

          .worker-kpi strong {
            display: block;
            margin-top: 3px;
            overflow: visible;
            color: #3b2a08;
            font-size: 0.64rem;
            line-height: 1.05;
            text-overflow: unset;
            white-space: nowrap;
          }

          .bee-illustration {
            position: relative;
            width: 82px;
            height: 60px;
            animation:
              workerBeeFloat
              4.4s ease-in-out infinite;
          }

          @keyframes workerBeeFloat {
            0%,
            100% {
              transform: translateY(2px);
            }

            50% {
              transform: translateY(-4px);
            }
          }

          .bee-body {
            position: absolute;
            top: 22px;
            left: 18px;
            width: 50px;
            height: 28px;
            overflow: hidden;
            border: 3px solid #5c430e;
            border-radius: 50% 55% 55% 50%;
            background:
              repeating-linear-gradient(
                90deg,
                #f3bc28 0 10px,
                #4b360d 10px 17px
              );
            box-shadow:
              0 5px 8px
                rgba(83, 58, 8, 0.14);
          }

          .bee-head {
            position: absolute;
            z-index: 3;
            top: 21px;
            left: 8px;
            width: 29px;
            height: 29px;
            border: 3px solid #5c430e;
            border-radius: 50%;
            background:
              radial-gradient(
                circle at 35% 28%,
                #ffe486,
                #e2a91e 72%
              );
          }

          .bee-eye {
            position: absolute;
            top: 10px;
            width: 4px;
            height: 5px;
            border-radius: 50%;
            background: #2f250d;
          }

          .bee-eye-left {
            left: 7px;
          }

          .bee-eye-right {
            right: 7px;
          }

          .bee-wing {
            position: absolute;
            z-index: 1;
            top: 5px;
            width: 31px;
            height: 27px;
            border: 2px solid
              rgba(99, 126, 139, 0.42);
            border-radius: 60% 60% 48% 48%;
            background:
              rgba(222, 244, 250, 0.68);
          }

          .bee-wing-left {
            left: 28px;
            transform: rotate(-15deg);
          }

          .bee-wing-right {
            left: 46px;
            transform: rotate(18deg);
          }

          .bee-antenna {
            position: absolute;
            z-index: 4;
            top: 13px;
            width: 17px;
            height: 13px;
            border-top: 2px solid #4b360d;
          }

          .bee-antenna-left {
            left: 11px;
            transform: rotate(-32deg);
          }

          .bee-antenna-right {
            left: 25px;
            transform: rotate(26deg);
          }

          .management-bee-group {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            width: 100%;
            animation:
              workerBeeFloat
              4.8s ease-in-out infinite;
          }

          .management-mini-bee {
            position: relative;
            width: 38px;
            height: 38px;
            margin: 0 -4px;
          }

          .management-mini-bee:nth-child(2) {
            transform: translateY(-7px);
          }

          .mini-bee-body {
            position: absolute;
            top: 16px;
            left: 7px;
            width: 27px;
            height: 17px;
            border: 2px solid #5c430e;
            border-radius: 50%;
            background:
              repeating-linear-gradient(
                90deg,
                #f3bc28 0 6px,
                #4b360d 6px 10px
              );
          }

          .mini-bee-head {
            position: absolute;
            z-index: 2;
            top: 15px;
            left: 1px;
            width: 18px;
            height: 18px;
            border: 2px solid #5c430e;
            border-radius: 50%;
            background: #edbb32;
          }

          .mini-bee-wing {
            position: absolute;
            top: 6px;
            left: 14px;
            width: 19px;
            height: 15px;
            border: 1px solid
              rgba(92, 123, 139, 0.42);
            border-radius: 50%;
            background:
              rgba(224, 244, 250, 0.68);
          }

          @media (max-width: 1250px) {
            .worker-bee-card {
              grid-template-columns:
                minmax(92px, 0.78fr)
                minmax(0, 1.22fr);
            }

            .worker-progress-heading {
              grid-template-columns:
                56px minmax(0, 1fr);
              gap: 6px;
            }

            .worker-progress-ring {
              width: 54px;
              height: 54px;
            }

            .worker-progress-ring-inner {
              width: 41px;
              height: 41px;
            }

            .bee-illustration {
              transform: scale(0.9);
            }

            .worker-kpi {
              padding: 5px 4px;
            }
          }

          @media (max-width: 700px) {
            .worker-bee-card {
              grid-template-columns:
                minmax(100px, 0.8fr)
                minmax(0, 1.2fr);
            }

            .worker-kpi-row {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .worker-kpi {
              min-height: 52px;
            }
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .bee-illustration,
            .management-bee-group {
              animation: none;
            }

            .worker-progress-fill {
              transition: none;
            }
          }
        `}
      </style>
    </article>
  );
}

type WorkerMetricProps = {
  label: string;
  value: string;
};

function WorkerMetric({
  label,
  value,
}: WorkerMetricProps) {
  return (
    <div className="worker-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type BeeIllustrationProps = {
  progress: number;
};

function BeeIllustration({
  progress,
}: BeeIllustrationProps) {
  return (
    <div
      className="bee-illustration"
      style={{
        opacity: progress > 0 ? 1 : 0.86,
      }}
      aria-hidden="true"
    >
      <div className="bee-wing bee-wing-left" />
      <div className="bee-wing bee-wing-right" />

      <div className="bee-antenna bee-antenna-left" />
      <div className="bee-antenna bee-antenna-right" />

      <div className="bee-body" />

      <div className="bee-head">
        <div className="bee-eye bee-eye-left" />
        <div className="bee-eye bee-eye-right" />
      </div>
    </div>
  );
}

function ManagementBees() {
  return (
    <div
      className="management-bee-group"
      aria-hidden="true"
    >
      {Array.from({ length: 3 }).map(
        (_, index) => (
          <div
            className="management-mini-bee"
            key={index}
          >
            <div className="mini-bee-wing" />
            <div className="mini-bee-body" />
            <div className="mini-bee-head" />
          </div>
        ),
      )}
    </div>
  );
}

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}