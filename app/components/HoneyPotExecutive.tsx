"use client";

import { useEffect, useMemo, useState } from "react";

type HoneyPotExecutiveProps = {
  currentLiters: number;
  monthlyGoal: number;
};

export default function HoneyPotExecutive({
  currentLiters,
  monthlyGoal,
}: HoneyPotExecutiveProps) {
  const targetPercent = useMemo(() => {
    if (monthlyGoal <= 0) {
      return 0;
    }

    return Math.min(
      Math.max((currentLiters / monthlyGoal) * 100, 0),
      100,
    );
  }, [currentLiters, monthlyGoal]);

  const remainingLiters = Math.max(
    monthlyGoal - currentLiters,
    0,
  );

  const [animatedPercent, setAnimatedPercent] =
    useState(0);

  const [displayedLiters, setDisplayedLiters] =
    useState(0);

  useEffect(() => {
    const duration = 900;
    const startTime = performance.now();
    const startPercent = animatedPercent;
    const startLiters = displayedLiters;

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
        startPercent +
          (targetPercent - startPercent) *
            eased,
      );

      setDisplayedLiters(
        startLiters +
          (currentLiters - startLiters) *
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
  }, [currentLiters, targetPercent]);

  const status =
    targetPercent >= 100
      ? "Goal Achieved"
      : targetPercent >= 90
        ? "Within Reach"
        : targetPercent >= 75
          ? "Building Momentum"
          : targetPercent >= 50
            ? "In Progress"
            : "Early Progress";

  return (
    <section
      className="honey-executive-card"
      aria-label="Monthly production summary"
    >
      <div className="honey-copy">
        <header className="honey-heading">
          <div>
            <p className="honey-eyebrow">
              Monthly Production
            </p>

            <h2>The Honey Pot</h2>
          </div>

          <span className="honey-status">
            {status}
          </span>
        </header>

        <div className="honey-main-value">
          <strong>
            {displayedLiters.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              },
            )}
          </strong>

          <span>liters collected</span>
        </div>

        <div className="honey-progress-track">
          <div
            className="honey-progress-fill"
            style={{
              width: `${animatedPercent}%`,
            }}
          />
        </div>

        <div className="honey-progress-labels">
          <span>
            {animatedPercent.toFixed(1)}%
            complete
          </span>

          <span>
            Goal:{" "}
            {formatLiters(monthlyGoal)}
          </span>
        </div>

        <div className="honey-kpi-grid">
          <Metric
            label="Current"
            value={currentLiters}
          />

          <Metric
            label="Remaining"
            value={remainingLiters}
          />

          <Metric
            label="Monthly Goal"
            value={monthlyGoal}
          />
        </div>
      </div>

      <div
        className="honey-pot-area"
        aria-hidden="true"
      >
        <div className="honey-pot-lid" />

        <div className="honey-pot-body">
          <div
            className="honey-level"
            style={{
              height: `${animatedPercent}%`,
            }}
          >
            <div className="honey-wave" />
          </div>

          <div className="honey-pot-badge">
            <strong>
              {animatedPercent.toFixed(0)}%
            </strong>

            <span>FULL</span>
          </div>
        </div>

        <div className="honey-pot-shadow" />
      </div>

      <style>
        {`
          .honey-executive-card {
            position: relative;
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              150px;
            align-items: center;
            gap: 18px;
            width: 100%;
            height: 100%;
            min-height: 0;
            padding: 16px 18px;
            overflow: hidden;
            border: 1px solid #d9b95a;
            border-radius: 24px;
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.98),
                rgba(255, 248, 215, 0.96)
              );
            box-shadow:
              0 12px 28px
                rgba(86, 58, 8, 0.12),
              inset 0 1px 0
                rgba(255, 255, 255, 0.9);
            box-sizing: border-box;
          }

          .honey-copy {
            min-width: 0;
          }

          .honey-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .honey-eyebrow {
            margin: 0 0 3px;
            color: #8f6813;
            font-size: 0.64rem;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .honey-heading h2 {
            margin: 0;
            color: #2e220d;
            font-size: clamp(
              1.35rem,
              1.8vw,
              1.9rem
            );
            line-height: 1;
          }

          .honey-status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 10px;
            border: 1px solid #d69d16;
            border-radius: 999px;
            background: #fff1b4;
            color: #67480b;
            font-size: 0.61rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .honey-main-value {
            display: flex;
            align-items: baseline;
            gap: 9px;
            margin-top: 10px;
          }

          .honey-main-value strong {
            color: #231b0c;
            font-size: clamp(
              2.35rem,
              3.4vw,
              3.9rem
            );
            line-height: 0.92;
            letter-spacing: -0.04em;
          }

          .honey-main-value span {
            color: #745d2d;
            font-size: 0.9rem;
            font-weight: 800;
          }

          .honey-progress-track {
            position: relative;
            height: 15px;
            margin-top: 11px;
            overflow: hidden;
            border: 1px solid
              rgba(146, 102, 18, 0.3);
            border-radius: 999px;
            background:
              linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.9),
                rgba(226, 207, 145, 0.7)
              );
            box-shadow:
              inset 0 2px 4px
                rgba(89, 62, 10, 0.1);
          }

          .honey-progress-fill {
            position: absolute;
            inset: 0 auto 0 0;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                #d98307,
                #f2ad17,
                #ffd75f
              );
            box-shadow:
              0 0 14px
                rgba(242, 173, 23, 0.32);
            transition:
              width 900ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                );
          }

          .honey-progress-fill::after {
            content: "";
            position: absolute;
            inset: 0;
            background:
              linear-gradient(
                105deg,
                transparent,
                rgba(255, 255, 255, 0.38),
                transparent
              );
            animation:
              honeyShimmer 3.4s
                linear infinite;
          }

          @keyframes honeyShimmer {
            from {
              transform: translateX(-100%);
            }

            to {
              transform: translateX(100%);
            }
          }

          .honey-progress-labels {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 5px;
            color: #735b2b;
            font-size: 0.66rem;
            font-weight: 800;
          }

          .honey-kpi-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-top: 10px;
          }

          .honey-kpi {
            min-width: 0;
            padding: 8px 9px;
            border: 1px solid
              rgba(183, 139, 38, 0.28);
            border-radius: 12px;
            background:
              rgba(255, 255, 255, 0.76);
          }

          .honey-kpi span {
            display: block;
            margin-bottom: 4px;
            color: #806b3f;
            font-size: 0.56rem;
            font-weight: 900;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .honey-kpi strong {
            display: block;
            overflow: hidden;
            color: #2e2411;
            font-size: clamp(
              0.8rem,
              1vw,
              1rem
            );
            line-height: 1.15;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .honey-pot-area {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 0;
            height: 100%;
          }

          .honey-pot-lid {
            position: relative;
            z-index: 3;
            width: 112px;
            height: 20px;
            margin-bottom: -7px;
            border: 3px solid #6f4b0a;
            border-radius: 50%;
            background:
              linear-gradient(
                180deg,
                #f3d468,
                #ba7c14
              );
            box-shadow:
              0 4px 8px
                rgba(72, 47, 5, 0.18);
          }

          .honey-pot-body {
            position: relative;
            width: 128px;
            height: 145px;
            overflow: hidden;
            border: 4px solid #6f4b0a;
            border-radius:
              22px 22px 45px 45px;
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.82),
                rgba(231, 208, 132, 0.52)
              );
            box-shadow:
              inset 7px 0 12px
                rgba(255, 255, 255, 0.4),
              inset -6px 0 12px
                rgba(96, 62, 7, 0.11),
              0 11px 18px
                rgba(65, 42, 4, 0.16);
          }

          .honey-level {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            background:
              linear-gradient(
                180deg,
                #ffd961,
                #eda116 48%,
                #b65c05 100%
              );
            transition:
              height 900ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                );
          }

          .honey-wave {
            position: absolute;
            top: -7px;
            left: -8%;
            width: 116%;
            height: 15px;
            border-radius: 50%;
            background: #ffe789;
            animation:
              honeyWave 3.8s
                ease-in-out infinite;
          }

          @keyframes honeyWave {
            0%,
            100% {
              transform:
                translateX(-3%)
                scaleY(0.92);
            }

            50% {
              transform:
                translateX(3%)
                scaleY(1.07);
            }
          }

          .honey-pot-badge {
            position: absolute;
            z-index: 2;
            top: 50%;
            left: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 72px;
            height: 58px;
            transform: translate(-50%, -50%);
            border: 1px solid
              rgba(92, 60, 8, 0.24);
            border-radius: 13px;
            background:
              rgba(255, 249, 220, 0.92);
            box-shadow:
              0 5px 12px
                rgba(70, 45, 4, 0.1);
          }

          .honey-pot-badge strong {
            color: #2b210e;
            font-size: 1.4rem;
            line-height: 1;
          }

          .honey-pot-badge span {
            margin-top: 3px;
            color: #71551a;
            font-size: 0.52rem;
            font-weight: 900;
            letter-spacing: 0.12em;
          }

          .honey-pot-shadow {
            width: 108px;
            height: 12px;
            margin-top: 5px;
            border-radius: 50%;
            background:
              rgba(69, 43, 4, 0.15);
            filter: blur(3px);
          }

          @media (max-width: 1100px) {
            .honey-executive-card {
              grid-template-columns:
                minmax(0, 1fr)
                125px;
              gap: 10px;
              padding: 14px;
            }

            .honey-pot-body {
              width: 112px;
              height: 132px;
            }

            .honey-pot-lid {
              width: 98px;
            }
          }

          @media (max-width: 760px) {
            .honey-executive-card {
              grid-template-columns: 1fr;
              height: auto;
            }

            .honey-pot-area {
              display: none;
            }
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .honey-progress-fill::after,
            .honey-wave {
              animation: none;
            }

            .honey-progress-fill,
            .honey-level {
              transition: none;
            }
          }
        `}
      </style>
    </section>
  );
}

type MetricProps = {
  label: string;
  value: number;
};

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div className="honey-kpi">
      <span>{label}</span>

      <strong>{formatLiters(value)}</strong>
    </div>
  );
}

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}