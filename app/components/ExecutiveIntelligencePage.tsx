"use client";

import Beezy from "./Beezy";

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

  todaysLitersTarget: number;
  todaysLitersCollected: number;

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
    value.toLocaleString(
      "en-US",
      {
        minimumFractionDigits:
          decimalPlaces,

        maximumFractionDigits:
          decimalPlaces,
      },
    );

  if (!unit) {
    return formatted;
  }

  if (unit === "%") {
    return `${formatted}%`;
  }

  return `${formatted} ${unit}`;
}

function formatLiters(
  value: number,
) {
  return `${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits:
        1,

      maximumFractionDigits:
        1,
    },
  )} L`;
}

function clampPercentage(
  value: number,
) {
  return Math.min(
    100,
    Math.max(
      0,
      value,
    ),
  );
}

export default function ExecutiveIntelligencePage({
  centerName,
  metrics,

  todaysLitersTarget,
  todaysLitersCollected,

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
  const [
    now,
    setNow,
  ] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    setNow(
      new Date(),
    );

    const timer =
      window.setInterval(
        () => {
          setNow(
            new Date(),
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, []);

  /*
   * ==========================================
   * TODAY'S MISSION
   * ==========================================
   */

  const remainingLiters =
    Math.max(
      0,
      todaysLitersTarget -
        todaysLitersCollected,
    );

  const missionPercentage =
    todaysLitersTarget > 0
      ? (
          todaysLitersCollected /
          todaysLitersTarget
        ) * 100
      : 0;

  const missionProgress =
    clampPercentage(
      missionPercentage,
    );

  /*
   * ==========================================
   * STICK PERFORMANCE
   * ==========================================
   */

  const totalAttempts =
    successfulSticks +
    unsuccessfulSticks;

  const successfulStickRate =
    totalAttempts > 0
      ? (
          successfulSticks /
          totalAttempts
        ) * 100
      : 0;

  /*
   * ==========================================
   * STATUS
   * ==========================================
   */

  const status =
    useMemo(() => {
      if (
        projectedVariance >=
        5
      ) {
        return {
          label:
            "Ahead of Goal",

          shortLabel:
            "Ahead",

          className:
            "status-ahead",
        };
      }

      if (
        projectedVariance >=
        0
      ) {
        return {
          label:
            "On Track",

          shortLabel:
            "On Track",

          className:
            "status-track",
        };
      }

      return {
        label:
          "Goal at Risk",

        shortLabel:
          "At Risk",

        className:
          "status-risk",
      };
    }, [
      projectedVariance,
    ]);

  /*
   * ==========================================
   * INTELLIGENCE SUMMARY
   * ==========================================
   */

  const intelligenceSummary =
    projectedVariance >= 0
      ? `Current production is projected to finish ${formatLiters(
          projectedVariance,
        )} above today's liters target.`
      : `Current production is projected to finish ${formatLiters(
          Math.abs(
            projectedVariance,
          ),
        )} below today's liters target.`;

  const beezyMessage =
    projectedVariance >= 5
      ? "The Hive is outperforming today's requirement. Protect the pace and finish strong."
      : projectedVariance >= 0
        ? "The Hive is currently on pace. Maintain consistency through the remainder of the day."
        : `We still need ${formatLiters(
            remainingLiters,
          )} toward today's target. Focus the team on closing the remaining gap.`;

  /*
   * Keep the command center readable.
   * If many KPIs are configured, show
   * the first six on television.
   */

  const visibleMetrics =
    metrics.slice(
      0,
      6,
    );

  return (
    <section className="intelligence-page">
      {/* =====================================
          BACKGROUND ATMOSPHERE
         ===================================== */}

      <div className="command-grid" />

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="hex-decoration hex-decoration-one">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="hex-decoration hex-decoration-two">
        <span />
        <span />
        <span />
      </div>

      {/* =====================================
          HEADER
         ===================================== */}

      <header className="intelligence-header">
        <div className="header-brand">
          <div className="hive-mark">
            <span>
              H
            </span>
          </div>

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
        </div>

        <div className="header-right">
          <div
            className={`center-status ${status.className}`}
          >
            <span>
              Center Status
            </span>

            <strong>
              {status.label}
            </strong>
          </div>

          <div className="command-clock">
            <span>
              Local Time
            </span>

            <strong
              suppressHydrationWarning
            >
              {now
                ? now.toLocaleTimeString(
                    "en-US",
                    {
                      hour:
                        "numeric",

                      minute:
                        "2-digit",
                    },
                  )
                : "--:--"}
            </strong>
          </div>
        </div>
      </header>

      {/* =====================================
          PRIMARY INTELLIGENCE GRID
         ===================================== */}

      <main className="command-layout">
        {/* ===================================
            LEFT — TODAY'S MISSION
           =================================== */}

        <section className="mission-panel command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Today&apos;s Mission
              </p>

              <h2>
                Daily Production
              </h2>
            </div>

            <div className="mission-day-indicator">
              Live
            </div>
          </div>

          <div className="mission-ring-wrapper">
            <div
              className="mission-ring"
              style={{
                background: `conic-gradient(
                  #f3b722 ${missionProgress}%,
                  rgba(255,255,255,0.08) ${missionProgress}% 100%
                )`,
              }}
            >
              <div className="mission-ring-inner">
                <span>
                  Mission
                </span>

                <strong>
                  {Math.round(
                    missionPercentage,
                  )}
                  %
                </strong>

                <small>
                  complete
                </small>
              </div>
            </div>
          </div>

          <div className="mission-target">
            <span>
              Today&apos;s Liters Target
            </span>

            <strong>
              {formatLiters(
                todaysLitersTarget,
              )}
            </strong>
          </div>

          <div className="mission-stats">
            <article>
              <span>
                Collected
              </span>

              <strong>
                {formatLiters(
                  todaysLitersCollected,
                )}
              </strong>
            </article>

            <article>
              <span>
                Remaining
              </span>

              <strong>
                {formatLiters(
                  remainingLiters,
                )}
              </strong>
            </article>
          </div>

          <div className="donor-need">
            <span>
              Additional Donors Needed
            </span>

            <strong>
              {
                additionalDonorsNeeded
              }
            </strong>
          </div>
        </section>

        {/* ===================================
            CENTER — INTELLIGENCE CORE
           =================================== */}

        <section className="core-panel command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Intelligence Core
              </p>

              <h2>
                Performance Network
              </h2>
            </div>

            <div className="confidence-pill">
              {confidence}% Confidence
            </div>
          </div>

          <div className="projection-core">
            <div className="projection-glow" />

            <div className="projection-hex">
              <span>
                Projected Finish
              </span>

              <strong>
                {formatLiters(
                  projectedFinish,
                )}
              </strong>

              <small
                className={
                  projectedVariance >=
                  0
                    ? "variance-positive"
                    : "variance-negative"
                }
              >
                {projectedVariance >=
                0
                  ? "+"
                  : "-"}
                {formatLiters(
                  Math.abs(
                    projectedVariance,
                  ),
                )}{" "}
                variance
              </small>
            </div>
          </div>

          <div className="metric-honeycomb">
            {visibleMetrics.length ===
            0 ? (
              <div className="empty-metrics">
                No executive KPIs are
                currently configured.
              </div>
            ) : (
              visibleMetrics.map(
                (
                  metric,
                  index,
                ) => (
                  <article
                    key={
                      metric.id
                    }
                    className={`metric-hex metric-hex-${
                      index + 1
                    }`}
                    title={
                      metric.description ??
                      undefined
                    }
                  >
                    <div>
                      <span>
                        {
                          metric.displayName
                        }
                      </span>

                      <strong>
                        {formatMetricValue(
                          metric.value,
                          metric.decimalPlaces,
                          metric.unit,
                        )}
                      </strong>

                      <small>
                        {
                          metric.source
                        }
                      </small>
                    </div>
                  </article>
                ),
              )
            )}
          </div>
        </section>

        {/* ===================================
            RIGHT — HIVE PERFORMANCE
           =================================== */}

        <section className="performance-panel command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Hive Performance
              </p>

              <h2>
                Worker Intelligence
              </h2>
            </div>
          </div>

          <div className="lead-forager-card">
            <div className="crown">
              👑
            </div>

            <div>
              <span>
                Reigning Lead Forager
              </span>

              <strong>
                {topWorkerName ??
                  "Not yet established"}
              </strong>

              <small>
                {topWorkerPercentage !==
                null
                  ? `${topWorkerPercentage.toFixed(
                      1,
                    )}% stick success`
                  : "Awaiting performance data"}
              </small>
            </div>
          </div>

          <div className="stick-performance-card">
            <div className="stick-rate-header">
              <div>
                <span>
                  Successful Stick Rate
                </span>

                <strong>
                  {successfulStickRate.toFixed(
                    1,
                  )}
                  %
                </strong>
              </div>

              <div className="stick-rate-icon">
                ✓
              </div>
            </div>

            <div className="stick-rate-track">
              <div
                className="stick-rate-fill"
                style={{
                  width: `${clampPercentage(
                    successfulStickRate,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="performance-grid">
            <article>
              <span>
                Successful
              </span>

              <strong>
                {
                  successfulSticks
                }
              </strong>
            </article>

            <article>
              <span>
                Unsuccessful
              </span>

              <strong>
                {
                  unsuccessfulSticks
                }
              </strong>
            </article>

            <article className="lost-volume-card">
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

          <div className="trajectory-card">
            <div>
              <span>
                Trajectory
              </span>

              <strong>
                {
                  status.shortLabel
                }
              </strong>
            </div>

            <div
              className={`trajectory-light ${status.className}`}
            />
          </div>
        </section>

        {/* ===================================
            BOTTOM LEFT / CENTER
            INTELLIGENCE SUMMARY
           =================================== */}

        <section className="summary-panel command-panel">
          <div className="summary-light" />

          <div className="summary-icon">
            ◆
          </div>

          <div>
            <p className="eyebrow">
              Hive Intelligence
            </p>

            <h2>
              Operational Assessment
            </h2>

            <p>
              {
                intelligenceSummary
              }
            </p>
          </div>
        </section>

        {/* ===================================
            BOTTOM RIGHT — BEEZY ADVISOR
           =================================== */}

        <section className="beezy-panel command-panel">
          <div className="beezy-image-wrap">
  <Beezy
    size={100}
    className="beezy-image"
  />
</div>

          <div className="beezy-copy">
            <p className="eyebrow">
              Beezy Says
            </p>

            <h2>
              Hive Advisor
            </h2>

            <p>
              {beezyMessage}
            </p>
          </div>
        </section>
      </main>

      {/* =====================================
          FOOTER
         ===================================== */}

      <footer className="intelligence-footer">
        <div className="footer-status">
          <span className="status-dot" />

          <div>
            <span>
              Intelligence Status
            </span>

            <strong>
              HIVE Systems Active
            </strong>
          </div>
        </div>

        <p>
          Every Drop Counts. Every Bee
          Matters.
        </p>

        <div className="powered-by">
          <span>
            Powered by
          </span>

          <strong>
            THE HIVE
          </strong>
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
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            padding: 18px 22px 14px;
            background:
              radial-gradient(
                circle at 20% 20%,
                rgba(242, 183, 34, 0.08),
                transparent 28%
              ),
              radial-gradient(
                circle at 84% 72%,
                rgba(73, 135, 159, 0.08),
                transparent 30%
              ),
              linear-gradient(
                145deg,
                #111614,
                #18201c 48%,
                #0d1210
              );
            color: #f7f2df;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            box-sizing: border-box;
          }

          .command-grid {
            position: absolute;
            inset: 0;
            opacity: 0.18;
            pointer-events: none;
            background-image:
              linear-gradient(
                rgba(255,255,255,0.025)
                1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,0.025)
                1px,
                transparent 1px
              );
            background-size:
              34px 34px;
          }

          .ambient {
            position: absolute;
            border-radius: 50%;
            filter: blur(70px);
            pointer-events: none;
          }

          .ambient-one {
            top: -12%;
            left: -5%;
            width: 340px;
            height: 340px;
            background:
              rgba(
                245,
                183,
                32,
                0.15
              );
          }

          .ambient-two {
            right: -8%;
            bottom: -10%;
            width: 420px;
            height: 420px;
            background:
              rgba(
                27,
                118,
                148,
                0.12
              );
          }

          .hex-decoration {
            position: absolute;
            display: grid;
            grid-template-columns:
              repeat(
                2,
                34px
              );
            gap: 4px;
            opacity: 0.08;
            pointer-events: none;
          }

          .hex-decoration span {
            width: 34px;
            height: 30px;
            border:
              2px solid
              #efb523;
            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );
          }

          .hex-decoration-one {
            top: 19%;
            left: 1%;
          }

          .hex-decoration-two {
            right: 2%;
            bottom: 17%;
          }

          .intelligence-header {
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 18px;
            flex: 0 0 auto;
          }

          .header-brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .hive-mark {
            display: grid;
            width: 54px;
            height: 48px;
            place-items: center;
            background:
              linear-gradient(
                145deg,
                #f6c33c,
                #b57c08
              );
            color: #191408;
            font-size: 1.6rem;
            font-weight: 1000;
            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );
            box-shadow:
              0 0 26px
              rgba(
                240,
                183,
                31,
                0.28
              );
          }

          .eyebrow {
            margin: 0 0 4px;
            color: #e9ae24;
            font-size:
              clamp(
                0.54rem,
                0.65vw,
                0.68rem
              );
            font-weight: 1000;
            letter-spacing:
              0.15em;
            text-transform:
              uppercase;
          }

          .intelligence-header h1 {
            margin: 0;
            color: #fff7d5;
            font-size:
              clamp(
                2rem,
                2.8vw,
                3rem
              );
            line-height: 0.96;
            letter-spacing:
              -0.04em;
          }

          .center-name {
            margin: 6px 0 0;
            color: #9ca99f;
            font-size:
              clamp(
                0.72rem,
                0.9vw,
                0.92rem
              );
            font-weight: 800;
          }

          .header-right {
            display: flex;
            gap: 10px;
          }

          .center-status,
          .command-clock {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 150px;
            padding:
              9px 13px;
            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.08
              );
            border-radius:
              12px;
            background:
              rgba(
                255,
                255,
                255,
                0.035
              );
            box-shadow:
              inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.04
              );
          }

          .center-status span,
          .command-clock span {
            color: #859088;
            font-size:
              0.5rem;
            font-weight: 900;
            letter-spacing:
              0.1em;
            text-transform:
              uppercase;
          }

          .center-status strong,
          .command-clock strong {
            margin-top: 3px;
            font-size:
              0.9rem;
          }

          .status-ahead {
            color: #89df75;
          }

          .status-track {
            color: #f0c14a;
          }

          .status-risk {
            color: #ff8a61;
          }

          .command-layout {
            position: relative;
            z-index: 5;
            display: grid;
            flex: 1 1 0;
            grid-template-columns:
              0.9fr
              1.5fr
              1fr;
            grid-template-rows:
              minmax(0, 1fr)
              118px;
            gap: 12px;
            min-height: 0;
            margin-top: 12px;
          }

          .command-panel {
            position: relative;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            border:
              1px solid
              rgba(
                225,
                174,
                48,
                0.22
              );
            border-radius:
              16px;
            background:
              linear-gradient(
                150deg,
                rgba(
                  31,
                  40,
                  35,
                  0.96
                ),
                rgba(
                  18,
                  25,
                  21,
                  0.98
                )
              );
            box-shadow:
              0 12px 30px
              rgba(
                0,
                0,
                0,
                0.28
              ),
              inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.035
              );
            box-sizing: border-box;
          }

          .mission-panel,
          .core-panel,
          .performance-panel {
            padding: 15px;
          }

          .panel-heading {
            display: flex;
            align-items:
              flex-start;
            justify-content:
              space-between;
            gap: 12px;
          }

          .panel-heading h2,
          .summary-panel h2,
          .beezy-panel h2 {
            margin: 0;
            color: #fff6cf;
            font-size:
              clamp(
                0.95rem,
                1.15vw,
                1.18rem
              );
          }

          .mission-day-indicator {
            padding:
              5px 8px;
            border:
              1px solid
              rgba(
                111,
                206,
                98,
                0.28
              );
            border-radius:
              999px;
            background:
              rgba(
                76,
                167,
                70,
                0.09
              );
            color: #8cdf7c;
            font-size:
              0.5rem;
            font-weight: 1000;
            letter-spacing:
              0.08em;
            text-transform:
              uppercase;
          }

          .mission-ring-wrapper {
            display: grid;
            place-items: center;
            margin-top: 15px;
          }

          .mission-ring {
            display: grid;
            width:
              clamp(
                110px,
                9vw,
                145px
              );
            height:
              clamp(
                110px,
                9vw,
                145px
              );
            place-items: center;
            border-radius: 50%;
            box-shadow:
              0 0 28px
              rgba(
                240,
                181,
                34,
                0.16
              );
          }

          .mission-ring-inner {
            display: flex;
            flex-direction:
              column;
            align-items: center;
            justify-content: center;
            width: 76%;
            height: 76%;
            border-radius: 50%;
            background:
              radial-gradient(
                circle,
                #263028,
                #111814
              );
            box-shadow:
              inset 0 0 24px
              rgba(
                0,
                0,
                0,
                0.35
              );
          }

          .mission-ring-inner span,
          .mission-ring-inner small {
            color: #8f9d92;
            font-size:
              0.48rem;
            font-weight: 900;
            letter-spacing:
              0.08em;
            text-transform:
              uppercase;
          }

          .mission-ring-inner strong {
            margin:
              2px 0;
            color: #f5c440;
            font-size:
              clamp(
                1.8rem,
                2.4vw,
                2.5rem
              );
            line-height: 1;
          }

          .mission-target {
            margin-top:
              12px;
            text-align: center;
          }

          .mission-target span {
            display: block;
            color: #859188;
            font-size:
              0.54rem;
            font-weight: 900;
            letter-spacing:
              0.08em;
            text-transform:
              uppercase;
          }

          .mission-target strong {
            display: block;
            margin-top: 3px;
            color: #fff4bf;
            font-size:
              clamp(
                1.2rem,
                1.5vw,
                1.55rem
              );
          }

          .mission-stats {
            display: grid;
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 7px;
            margin-top: 10px;
          }

          .mission-stats article,
          .performance-grid article {
            padding:
              9px 10px;
            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.06
              );
            border-radius:
              10px;
            background:
              rgba(
                255,
                255,
                255,
                0.025
              );
          }

          .mission-stats span,
          .performance-grid span,
          .donor-need span,
          .trajectory-card span {
            display: block;
            color: #809086;
            font-size:
              0.48rem;
            font-weight: 900;
            letter-spacing:
              0.07em;
            text-transform:
              uppercase;
          }

          .mission-stats strong,
          .performance-grid strong {
            display: block;
            margin-top: 3px;
            color: #f6eed0;
            font-size:
              0.9rem;
          }

          .donor-need {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 12px;
            margin-top: 8px;
            padding:
              8px 10px;
            border:
              1px solid
              rgba(
                232,
                171,
                31,
                0.17
              );
            border-radius:
              9px;
            background:
              rgba(
                240,
                178,
                31,
                0.055
              );
          }

          .donor-need strong {
            color: #f3bd35;
            font-size:
              1.15rem;
          }

          .confidence-pill {
            padding:
              5px 8px;
            border-radius:
              999px;
            background:
              rgba(
                38,
                129,
                153,
                0.12
              );
            color: #76c6dd;
            font-size:
              0.48rem;
            font-weight: 1000;
            letter-spacing:
              0.05em;
            text-transform:
              uppercase;
          }

          .projection-core {
            position: relative;
            display: grid;
            place-items: center;
            height: 38%;
            min-height: 112px;
            margin-top: 5px;
          }

          .projection-glow {
            position: absolute;
            width: 180px;
            height: 130px;
            border-radius: 50%;
            background:
              radial-gradient(
                circle,
                rgba(
                  242,
                  180,
                  36,
                  0.22
                ),
                transparent
                  65%
              );
            filter: blur(8px);
            animation:
              intelligencePulse
              3.5s ease-in-out
              infinite;
          }

          .projection-hex {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction:
              column;
            align-items: center;
            justify-content: center;
            width:
              clamp(
                180px,
                18vw,
                255px
              );
            height:
              clamp(
                100px,
                10vw,
                140px
              );
            border:
              2px solid
              rgba(
                242,
                185,
                46,
                0.55
              );
            background:
              linear-gradient(
                145deg,
                rgba(
                  55,
                  47,
                  22,
                  0.94
                ),
                rgba(
                  24,
                  29,
                  24,
                  0.98
                )
              );
            clip-path:
              polygon(
                14% 0,
                86% 0,
                100% 50%,
                86% 100%,
                14% 100%,
                0 50%
              );
          }

          .projection-hex span {
            color: #9b9d87;
            font-size:
              0.5rem;
            font-weight: 900;
            letter-spacing:
              0.08em;
            text-transform:
              uppercase;
          }

          .projection-hex strong {
            margin:
              5px 0 3px;
            color: #ffd55f;
            font-size:
              clamp(
                1.8rem,
                2.6vw,
                2.8rem
              );
            line-height: 1;
          }

          .projection-hex small {
            font-size:
              0.58rem;
            font-weight: 900;
          }

          .variance-positive {
            color: #80d873;
          }

          .variance-negative {
            color: #ff8d68;
          }

          .metric-honeycomb {
            display: grid;
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
            gap:
              7px 5px;
            margin-top:
              6px;
          }

          .metric-hex {
            display: grid;
            min-width: 0;
            min-height: 92px;
            place-items: center;
            padding: 8px;
            border:
              1px solid
              rgba(
                242,
                181,
                43,
                0.23
              );
            background:
              linear-gradient(
                145deg,
                rgba(
                  54,
                  60,
                  47,
                  0.86
                ),
                rgba(
                  22,
                  30,
                  25,
                  0.94
                )
              );
            clip-path:
              polygon(
                12% 0,
                88% 0,
                100% 50%,
                88% 100%,
                12% 100%,
                0 50%
              );
            text-align: center;
          }

          .metric-hex div {
            min-width: 0;
          }

          .metric-hex span {
            display: block;
            overflow: hidden;
            color: #a4aa9d;
            font-size:
              clamp(
                0.42rem,
                0.5vw,
                0.53rem
              );
            font-weight: 900;
            letter-spacing:
              0.06em;
            line-height: 1.15;
            text-overflow:
              ellipsis;
            text-transform:
              uppercase;
            white-space:
              nowrap;
          }

          .metric-hex strong {
            display: block;
            margin-top:
              5px;
            overflow: hidden;
            color: #f4c74d;
            font-size:
              clamp(
                1rem,
                1.3vw,
                1.35rem
              );
            line-height: 1;
            text-overflow:
              ellipsis;
            white-space:
              nowrap;
          }

          .metric-hex small {
            display: block;
            margin-top:
              4px;
            color: #68746c;
            font-size:
              0.4rem;
            font-weight: 900;
          }

          .empty-metrics {
            grid-column:
              1 / -1;
            padding: 20px;
            border:
              1px dashed
              rgba(
                234,
                181,
                47,
                0.28
              );
            border-radius:
              12px;
            color: #7f8b82;
            text-align:
              center;
          }

          .lead-forager-card {
            display: grid;
            grid-template-columns:
              auto 1fr;
            gap: 10px;
            align-items: center;
            margin-top: 14px;
            padding:
              11px;
            border:
              1px solid
              rgba(
                238,
                183,
                43,
                0.27
              );
            border-radius:
              12px;
            background:
              linear-gradient(
                145deg,
                rgba(
                  239,
                  179,
                  39,
                  0.09
                ),
                rgba(
                  255,
                  255,
                  255,
                  0.02
                )
              );
          }

          .crown {
            display: grid;
            width: 42px;
            height: 42px;
            place-items: center;
            border-radius:
              10px;
            background:
              rgba(
                244,
                184,
                37,
                0.12
              );
            font-size:
              1.3rem;
          }

          .lead-forager-card span {
            display: block;
            color: #8e9a91;
            font-size:
              0.48rem;
            font-weight: 900;
            letter-spacing:
              0.08em;
            text-transform:
              uppercase;
          }

          .lead-forager-card strong {
            display: block;
            margin-top: 3px;
            color: #ffdf72;
            font-size:
              1rem;
          }

          .lead-forager-card small {
            display: block;
            margin-top: 2px;
            color: #7b897f;
            font-size:
              0.48rem;
            font-weight: 700;
          }

          .stick-performance-card {
            margin-top: 9px;
            padding:
              11px;
            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.06
              );
            border-radius:
              12px;
            background:
              rgba(
                255,
                255,
                255,
                0.025
              );
          }

          .stick-rate-header {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
          }

          .stick-rate-header span {
            display: block;
            color: #849188;
            font-size:
              0.48rem;
            font-weight: 900;
            text-transform:
              uppercase;
          }

          .stick-rate-header strong {
            display: block;
            margin-top: 2px;
            color: #88dc78;
            font-size:
              1.25rem;
          }

          .stick-rate-icon {
            display: grid;
            width: 30px;
            height: 30px;
            place-items: center;
            border-radius:
              50%;
            background:
              rgba(
                77,
                176,
                81,
                0.12
              );
            color: #79d36e;
            font-weight: 1000;
          }

          .stick-rate-track {
            height: 5px;
            margin-top: 9px;
            overflow: hidden;
            border-radius:
              999px;
            background:
              rgba(
                255,
                255,
                255,
                0.07
              );
          }

          .stick-rate-fill {
            height: 100%;
            border-radius:
              inherit;
            background:
              linear-gradient(
                90deg,
                #3d9b4b,
                #93da73
              );
            transition:
              width
              900ms ease;
          }

          .performance-grid {
            display: grid;
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 7px;
            margin-top: 8px;
          }

          .lost-volume-card {
            grid-column:
              1 / -1;
          }

          .trajectory-card {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            margin-top: 8px;
            padding:
              9px 11px;
            border-radius:
              10px;
            background:
              rgba(
                255,
                255,
                255,
                0.025
              );
          }

          .trajectory-card strong {
            display: block;
            margin-top: 3px;
            color: #f4eed4;
            font-size:
              0.9rem;
          }

          .trajectory-light {
            width: 13px;
            height: 13px;
            border-radius:
              50%;
            box-shadow:
              0 0 16px
              currentColor;
          }

          .trajectory-light.status-ahead {
            background:
              #7fd16f;
          }

          .trajectory-light.status-track {
            background:
              #eeb846;
          }

          .trajectory-light.status-risk {
            background:
              #ff8260;
          }

          .summary-panel {
            grid-column:
              1 / 3;
            display: grid;
            grid-template-columns:
              auto 1fr;
            gap: 12px;
            align-items: center;
            padding:
              13px 15px;
          }

          .summary-light {
            position: absolute;
            top: -50px;
            right: 12%;
            width: 180px;
            height: 120px;
            border-radius:
              50%;
            background:
              rgba(
                238,
                175,
                32,
                0.08
              );
            filter:
              blur(30px);
          }

          .summary-icon {
            display: grid;
            width: 46px;
            height: 46px;
            place-items: center;
            border:
              1px solid
              rgba(
                239,
                177,
                35,
                0.26
              );
            background:
              rgba(
                238,
                177,
                37,
                0.07
              );
            color: #f3ba34;
            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );
          }

          .summary-panel p:not(
            .eyebrow
          ) {
            margin:
              4px 0 0;
            color: #a8b0a9;
            font-size:
              clamp(
                0.65rem,
                0.75vw,
                0.78rem
              );
            font-weight: 700;
            line-height: 1.35;
          }

          .beezy-panel {
            display: grid;
            grid-template-columns:
              92px 1fr;
            gap: 12px;
            align-items: center;
            padding:
              10px 12px;
          }

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-body span {
            display: block;
            height: 8px;
            margin-top: 7px;
            background:
              #151713;
          }

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-image-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
}

.beezy-image {
  filter:
    drop-shadow(
      0 8px 18px
      rgba(0, 0, 0, 0.42)
    )
    drop-shadow(
      0 0 18px
      rgba(241, 181, 35, 0.22)
    );
}

          .beezy-copy p:not(
            .eyebrow
          ) {
            margin:
              4px 0 0;
            color: #9ea8a1;
            font-size:
              clamp(
                0.6rem,
                0.7vw,
                0.72rem
              );
            font-weight: 700;
            line-height: 1.3;
          }

          .intelligence-footer {
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 18px;
            flex: 0 0 auto;
            margin-top: 10px;
            padding:
              7px 11px;
            border-top:
              1px solid
              rgba(
                233,
                178,
                41,
                0.16
              );
            color: #88948c;
          }

          .footer-status {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius:
              50%;
            background:
              #7fd170;
            box-shadow:
              0 0 10px
              rgba(
                111,
                214,
                103,
                0.7
              );
            animation:
              statusPulse
              1.7s ease-in-out
              infinite;
          }

          .footer-status div,
          .powered-by {
            display: flex;
            flex-direction:
              column;
          }

          .intelligence-footer span {
            font-size:
              0.43rem;
            font-weight: 900;
            letter-spacing:
              0.08em;
            text-transform:
              uppercase;
          }

          .intelligence-footer strong {
            margin-top: 1px;
            color: #d6d8ce;
            font-size:
              0.64rem;
          }

          .intelligence-footer p {
            margin: 0;
            color: #d7b24c;
            font-size:
              0.7rem;
            font-weight: 900;
          }

          .powered-by {
            text-align: right;
          }

          @keyframes intelligencePulse {
            0%,
            100% {
              opacity: 0.55;
              transform:
                scale(0.94);
            }

            50% {
              opacity: 1;
              transform:
                scale(1.08);
            }
          }

          @keyframes statusPulse {
            0%,
            100% {
              opacity: 0.55;
              transform:
                scale(0.85);
            }

            50% {
              opacity: 1;
              transform:
                scale(1.2);
            }
          }

          @media (
            max-width: 1100px
          ) {
            .intelligence-page {
              height: auto;
              min-height:
                100vh;
              overflow: auto;
            }

            .command-layout {
              grid-template-columns:
                1fr;
              grid-template-rows:
                auto;
            }

            .summary-panel {
              grid-column:
                auto;
            }
          }

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            .projection-glow,
            .status-dot {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}