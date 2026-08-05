"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type IntelligenceMetric = {
  id: number;
  displayName: string;
  description: string | null;
  unit: string | null;
  decimalPlaces: number;
  value: number | null;
  source: "CSL" | "HIVE" | "MANUAL";
};

type ExecutiveIntelligencePageProps = {
  centerName: string;
  metrics: IntelligenceMetric[];

  projectedFinish: number;
  projectedVariance: number;
  confidence: number;
  additionalDonorsNeeded: number;

  successfulSticks: number;
  unsuccessfulSticks: number;
  lostVolumeLiters: number;

  topWorkerName?: string | null;
  topWorkerPercentage?: number | null;
};

function formatMetricValue(
  value: number | null,
  decimalPlaces: number,
  unit: string | null,
) {
  if (value === null) {
    return "No reading";
  }

  const formatted =
    value.toLocaleString("en-US", {
      minimumFractionDigits:
        decimalPlaces,
      maximumFractionDigits:
        decimalPlaces,
    });

  if (!unit) {
    return formatted;
  }

  if (unit === "%") {
    return `${formatted}%`;
  }

  return `${formatted} ${unit}`;
}

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}

export default function ExecutiveIntelligencePage({
  centerName,
  metrics,
  projectedFinish,
  projectedVariance,
  confidence,
  additionalDonorsNeeded,
  successfulSticks,
  unsuccessfulSticks,
  lostVolumeLiters,
  topWorkerName = null,
  topWorkerPercentage = null,
}: ExecutiveIntelligencePageProps) {
  const [now, setNow] =
  useState<Date | null>(null);
  
  useEffect(() => {
  setNow(new Date());

  const timer = window.setInterval(() => {
    setNow(new Date());
  }, 1000);

  return () => {
    window.clearInterval(timer);
  };
}, []);

  const totalAttempts =
    successfulSticks +
    unsuccessfulSticks;

  const successfulStickRate =
    totalAttempts > 0
      ? (successfulSticks /
          totalAttempts) *
        100
      : 0;

  const status = useMemo(() => {
    if (projectedVariance >= 5) {
      return {
        label: "Ahead of Goal",
        className: "status-ahead",
      };
    }

    if (projectedVariance >= 0) {
      return {
        label: "On Track",
        className: "status-track",
      };
    }

    return {
      label: "Goal at Risk",
      className: "status-risk",
    };
  }, [projectedVariance]);

  const intelligenceSummary =
    projectedVariance >= 0
      ? `The center is projected to finish ${formatLiters(
          projectedVariance,
        )} above today’s goal.`
      : `The center is projected to finish ${formatLiters(
          Math.abs(projectedVariance),
        )} below today’s goal.`;

  return (
    <section className="intelligence-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <div className="flying-bee flying-bee-one">
        🐝
      </div>

      <div className="flying-bee flying-bee-two">
        🐝
      </div>

      <header className="intelligence-header">
        <div>
          <p className="eyebrow">
            The Hive Command Center
          </p>

          <h1>
            Executive Intelligence
          </h1>

          <p className="center-name">
            {centerName}
          </p>
        </div>

        <div
          className={`center-status ${status.className}`}
        >
          <span>Center Status</span>
          <strong>{status.label}</strong>
        </div>
      </header>

      <main className="intelligence-grid">
        <section className="forecast-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Live Forecast
              </p>

              <h2>
                Projected Center Finish
              </h2>
            </div>

            <span className="confidence-pill">
              {confidence}% confidence
            </span>
          </div>

          <div className="forecast-primary">
            <strong>
              {formatLiters(
                projectedFinish,
              )}
            </strong>

            <span>
              {projectedVariance >= 0
                ? "+"
                : "-"}
              {formatLiters(
                Math.abs(
                  projectedVariance,
                ),
              )}{" "}
              variance
            </span>
          </div>

          <div className="forecast-kpis">
            <article>
              <span>
                Additional Donors Needed
              </span>

              <strong>
                {additionalDonorsNeeded}
              </strong>
            </article>

            <article>
              <span>
                Successful Stick Rate
              </span>

              <strong>
                {successfulStickRate.toFixed(
                  1,
                )}
                %
              </strong>
            </article>

            <article>
              <span>
                Lost Volume
              </span>

              <strong>
                {formatLiters(
                  lostVolumeLiters,
                )}
              </strong>
            </article>
          </div>
        </section>

        <section className="metrics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Official Performance
              </p>

              <h2>
                Executive KPIs
              </h2>
            </div>

            <span className="live-badge">
              Live
            </span>
          </div>

          <div className="metric-grid">
            {metrics.length === 0 ? (
              <div className="empty-metrics">
                No visible executive metrics
                have been configured yet.
              </div>
            ) : (
              metrics.map((metric) => (
                <article
                  key={metric.id}
                  className="metric-card"
                >
                  <span>
                    {metric.displayName}
                  </span>

                  <strong>
                    {formatMetricValue(
                      metric.value,
                      metric.decimalPlaces,
                      metric.unit,
                    )}
                  </strong>

                  <small>
                    {metric.source} source
                  </small>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="summary-panel">
          <div className="summary-glow" />

          <p className="eyebrow">
            Hive Intelligence
          </p>

          <h2>
            Operational Summary
          </h2>

          <p className="summary-copy">
            {intelligenceSummary}
          </p>

          <div className="summary-list">
            <div>
              <span>
                Successful sticks
              </span>

              <strong>
                {successfulSticks}
              </strong>
            </div>

            <div>
              <span>
                Unsuccessful sticks
              </span>

              <strong>
                {unsuccessfulSticks}
              </strong>
            </div>

            <div>
              <span>
                Lead forager
              </span>

              <strong>
                {topWorkerName ??
                  "Not yet established"}
              </strong>
            </div>

            <div>
              <span>
                Lead performance
              </span>

              <strong>
                {topWorkerPercentage !==
                null
                  ? `${Math.round(
                      topWorkerPercentage,
                    )}%`
                  : "—"}
              </strong>
            </div>
          </div>
        </section>
      </main>

      <footer className="intelligence-footer">
        <div>
          <span>Last refreshed</span>

          <strong suppressHydrationWarning>
  {now
    ? now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--"}
</strong>
        </div>

        <p>
          Every Drop Counts. Every Bee
          Matters.
        </p>

        <div className="powered-by">
          <span>Powered by</span>
          <strong>The Hive</strong>
        </div>
      </footer>

      <style>
        {`
          .intelligence-page {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow: hidden;
            padding: 18px 24px;
            background:
              radial-gradient(
                circle at top left,
                rgba(255, 235, 147, 0.42),
                transparent 35%
              ),
              linear-gradient(
                145deg,
                #fffef7,
                #f7edbd
              );
            box-sizing: border-box;
          }

          .ambient {
            position: absolute;
            border-radius: 50%;
            filter: blur(14px);
            opacity: 0.22;
            animation:
              ambientDrift
              18s ease-in-out infinite;
          }

          .ambient-one {
            top: 8%;
            left: 8%;
            width: 150px;
            height: 150px;
            background: #f2c94c;
          }

          .ambient-two {
            right: 10%;
            bottom: 10%;
            width: 210px;
            height: 210px;
            background: #9fcb6a;
            animation-delay: -6s;
          }

          .ambient-three {
            top: 38%;
            right: 32%;
            width: 120px;
            height: 120px;
            background: #f7dd85;
            animation-delay: -10s;
          }

          @keyframes ambientDrift {
            0%,
            100% {
              transform:
                translate3d(0, 0, 0)
                scale(1);
            }

            50% {
              transform:
                translate3d(
                  24px,
                  -18px,
                  0
                )
                scale(1.12);
            }
          }

          .flying-bee {
            position: absolute;
            z-index: 1;
            font-size: 28px;
            filter:
              drop-shadow(
                0 5px 4px
                rgba(74, 51, 5, 0.16)
              );
            animation:
              beeFlight
              20s linear infinite;
          }

          .flying-bee-one {
            top: 20%;
            left: -5%;
          }

          .flying-bee-two {
            top: 72%;
            left: -12%;
            animation-delay: -9s;
            animation-duration: 24s;
          }

          @keyframes beeFlight {
            0% {
              transform:
                translateX(0)
                translateY(0)
                rotate(-8deg);
            }

            25% {
              transform:
                translateX(28vw)
                translateY(-18px)
                rotate(6deg);
            }

            50% {
              transform:
                translateX(55vw)
                translateY(14px)
                rotate(-4deg);
            }

            75% {
              transform:
                translateX(82vw)
                translateY(-12px)
                rotate(5deg);
            }

            100% {
              transform:
                translateX(112vw)
                translateY(4px)
                rotate(-6deg);
            }
          }

          .intelligence-header {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
          }

          .eyebrow {
            margin: 0 0 5px;
            color: #93690e;
            font-size: 0.68rem;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .intelligence-header h1 {
            margin: 0;
            color: #342406;
            font-size: clamp(
              2rem,
              3vw,
              3rem
            );
            line-height: 0.95;
          }

          .center-name {
            margin: 8px 0 0;
            color: #6e5a2c;
            font-weight: 800;
          }

          .center-status {
            display: flex;
            flex-direction: column;
            min-width: 190px;
            padding: 12px 15px;
            border-radius: 14px;
            box-shadow:
              0 8px 18px
              rgba(68, 47, 5, 0.11);
          }

          .center-status span {
            font-size: 0.62rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .center-status strong {
            margin-top: 4px;
            font-size: 1.05rem;
          }

          .status-ahead {
            background: #e4f4d5;
            color: #386a25;
          }

          .status-track {
            background: #fff2bd;
            color: #805c07;
          }

          .status-risk {
            background: #f8d9d3;
            color: #8b3329;
          }

          .intelligence-grid {
            position: relative;
            z-index: 2;
            display: grid;
            flex: 1 1 0;
            grid-template-columns:
              1.1fr 1.35fr 0.9fr;
            gap: 16px;
            min-height: 0;
            margin-top: 16px;
          }

          .forecast-panel,
          .metrics-panel,
          .summary-panel {
            min-width: 0;
            min-height: 0;
            padding: 18px;
            overflow: hidden;
            border: 1px solid
              rgba(204, 170, 71, 0.48);
            border-radius: 20px;
            background:
              rgba(255, 255, 255, 0.84);
            box-shadow:
              0 12px 28px
              rgba(86, 59, 5, 0.11);
            backdrop-filter: blur(6px);
            box-sizing: border-box;
          }

          .panel-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .panel-heading h2,
          .summary-panel h2 {
            margin: 0;
            color: #392707;
            font-size: 1.2rem;
          }

          .confidence-pill,
          .live-badge {
            padding: 7px 9px;
            border-radius: 999px;
            background: #fff1b4;
            color: #795500;
            font-size: 0.62rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .live-badge {
            position: relative;
            padding-left: 20px;
          }

          .live-badge::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 8px;
            width: 7px;
            height: 7px;
            transform:
              translateY(-50%);
            border-radius: 50%;
            background: #48a054;
            animation:
              livePulse
              1.4s ease-in-out infinite;
          }

          @keyframes livePulse {
            0%,
            100% {
              opacity: 0.4;
              transform:
                translateY(-50%)
                scale(0.8);
            }

            50% {
              opacity: 1;
              transform:
                translateY(-50%)
                scale(1.18);
            }
          }

          .forecast-primary {
            display: flex;
            flex-direction: column;
            margin-top: 32px;
          }

          .forecast-primary strong {
            color: #2f2105;
            font-size: clamp(
              3rem,
              4.8vw,
              5rem
            );
            line-height: 0.9;
          }

          .forecast-primary span {
            margin-top: 12px;
            color: #7c6223;
            font-size: 0.82rem;
            font-weight: 900;
          }

          .forecast-kpis {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 24px;
          }

          .forecast-kpis article {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 13px;
            border: 1px solid #eadca9;
            border-radius: 12px;
            background: #fffdf5;
          }

          .forecast-kpis span {
            color: #816d3c;
            font-size: 0.72rem;
            font-weight: 800;
          }

          .forecast-kpis strong {
            color: #372606;
          }

          .metric-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }

          .metric-card {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
            min-height: 108px;
            padding: 13px;
            border: 1px solid #e8d79d;
            border-radius: 14px;
            background:
              linear-gradient(
                145deg,
                #ffffff,
                #fff8d6
              );
          }

          .metric-card span {
            color: #7d692f;
            font-size: 0.66rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            line-height: 1.2;
            text-transform: uppercase;
          }

          .metric-card strong {
            margin-top: 8px;
            overflow: hidden;
            color: #332304;
            font-size: 1.65rem;
            line-height: 1;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .metric-card small {
            margin-top: 7px;
            color: #8b7a50;
            font-size: 0.58rem;
            font-weight: 800;
          }

          .empty-metrics {
            grid-column: 1 / -1;
            padding: 24px;
            border: 1px dashed #d4b95f;
            border-radius: 12px;
            color: #746238;
            text-align: center;
          }

          .summary-panel {
            position: relative;
            background:
              linear-gradient(
                160deg,
                rgba(67, 47, 8, 0.97),
                rgba(113, 79, 11, 0.94)
              );
            color: #ffffff;
          }

          .summary-panel .eyebrow {
            color: #f1c95b;
          }

          .summary-panel h2 {
            color: #ffffff;
          }

          .summary-glow {
            position: absolute;
            top: -30px;
            right: -30px;
            width: 170px;
            height: 170px;
            border-radius: 50%;
            background:
              rgba(255, 205, 75, 0.25);
            filter: blur(15px);
            animation:
              summaryGlow
              4s ease-in-out infinite;
          }

          @keyframes summaryGlow {
            0%,
            100% {
              transform: scale(0.92);
              opacity: 0.45;
            }

            50% {
              transform: scale(1.12);
              opacity: 0.78;
            }
          }

          .summary-copy {
            position: relative;
            margin: 24px 0;
            color: #fff3c3;
            font-size: 0.95rem;
            font-weight: 800;
            line-height: 1.55;
          }

          .summary-list {
            position: relative;
            display: grid;
            gap: 9px;
          }

          .summary-list div {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 0;
            border-bottom: 1px solid
              rgba(255, 255, 255, 0.13);
          }

          .summary-list span {
            color: #e9d99d;
            font-size: 0.7rem;
            font-weight: 800;
          }

          .summary-list strong {
            color: #ffffff;
            font-size: 0.86rem;
            text-align: right;
          }

          .intelligence-footer {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-top: 14px;
            padding: 10px 14px;
            border-radius: 13px;
            background:
              rgba(57, 39, 5, 0.92);
            color: #ffffff;
          }

          .intelligence-footer div {
            display: flex;
            flex-direction: column;
          }

          .intelligence-footer span {
            color: #e4d396;
            font-size: 0.55rem;
            font-weight: 900;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .intelligence-footer strong {
            margin-top: 2px;
          }

          .intelligence-footer p {
            margin: 0;
            color: #ffe68a;
            font-weight: 900;
          }

          .powered-by {
            text-align: right;
          }

          @media (max-width: 1100px) {
            .intelligence-page {
              height: auto;
              min-height: 100vh;
              overflow: visible;
            }

            .intelligence-grid {
              grid-template-columns: 1fr;
            }

            .metric-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .intelligence-header {
              flex-direction: column;
            }

            .center-status {
              width: 100%;
              box-sizing: border-box;
            }

            .metric-grid {
              grid-template-columns: 1fr;
            }

            .intelligence-footer {
              align-items: stretch;
              flex-direction: column;
            }

            .powered-by {
              text-align: left;
            }
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .ambient,
            .flying-bee,
            .live-badge::before,
            .summary-glow {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}