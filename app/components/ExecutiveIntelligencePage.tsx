"use client";

import Beezy from "./Beezy";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type DailyComparison = {
  dayName: string;

  currentDate: string;
  previousDate: string;

  currentValue: number | null;
  previousValue: number | null;

  difference: number | null;
  percentChange: number | null;

  direction:
    | "UP"
    | "DOWN"
    | "FLAT"
    | "NONE";

  outcome:
    | "POSITIVE"
    | "NEGATIVE"
    | "NEUTRAL"
    | "NO_DATA";
};

type IntelligenceMetric = {
  metricId: number;

  key: string;
  displayName: string;

  unit: string | null;
  decimalPlaces: number;

  improvementDirection: string;

  source:
    | "CSL"
    | "HIVE"
    | "MANUAL";

  days: DailyComparison[];
};

type CslSnapshotMetric = {
  id: number;

  displayName: string;

  description:
    string | null;

  unit:
    string | null;

  decimalPlaces:
    number;

  value:
    number | null;
};

type ExecutiveIntelligencePageProps = {
  centerName: string;

  cslMetrics:
    CslSnapshotMetric[];

  metrics:
    IntelligenceMetric[];

  todaysLitersTarget: number;
  todaysLitersCollected: number;

  projectedFinish: number;
  projectedVariance: number;
  confidence: number;
  additionalDonorsNeeded: number;

  successfulSticks: number;
  unsuccessfulSticks: number;
  lostVolumeLiters: number;

  topWorkerName?:
    string | null;

  topWorkerPercentage?:
    number | null;
};

function formatMetricValue(
  value: number | null,
  decimalPlaces: number,
  unit: string | null,
) {
  if (
    value === null
  ) {
    return "—";
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

  if (
    unit === "%"
  ) {
    return `${formatted}%`;
  }

  if (
    unit === "L"
  ) {
    return `${formatted} L`;
  }

  if (
    unit === "min"
  ) {
    return `${formatted}m`;
  }

  return formatted;
}

function formatLiters(
  value: number,
) {
  return `${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
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

function arrowFor(
  direction:
    DailyComparison["direction"],
) {
  if (
    direction === "UP"
  ) {
    return "↑";
  }

  if (
    direction === "DOWN"
  ) {
    return "↓";
  }

  if (
    direction === "FLAT"
  ) {
    return "→";
  }

  return "";
}

function outcomeClass(
  outcome:
    DailyComparison["outcome"],
) {
  if (
    outcome === "POSITIVE"
  ) {
    return "positive";
  }

  if (
    outcome === "NEGATIVE"
  ) {
    return "negative";
  }

  return "neutral";
}

export default function ExecutiveIntelligencePage({
  centerName,
  cslMetrics,
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
  ] =
    useState<Date | null>(
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

    return () =>
      window.clearInterval(
        timer,
      );
  }, []);

  const remainingLiters =
    Math.max(
      0,
      todaysLitersTarget -
        todaysLitersCollected,
    );

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

  const status =
    useMemo(() => {
      if (
        projectedVariance >= 5
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
        projectedVariance >= 0
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

  const dayHeaders =
    metrics[0]
      ?.days ??
    [];

  return (
    <section className="intelligence-page">
      <div className="command-grid" />

      <header className="intelligence-header">
        <div className="header-brand">
          <div className="hive-mark">
            H
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

      <main className="command-layout">
        {/* ===================================
            LEFT — OFFICIAL CSL KPI SNAPSHOT
           =================================== */}

        <section className="mission-panel command-panel csl-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Official Data Source
              </p>

              <h2>
                CSL Performance
              </h2>
            </div>

            <div className="csl-badge">
              CSL
            </div>
          </div>

          <p className="csl-panel-copy">
            Current official center metrics
          </p>

          <div className="csl-kpi-stack">
            {cslMetrics.length ===
            0 ? (
              <div className="csl-empty">
                No current CSL metrics are
                available.
              </div>
            ) : (
              cslMetrics.map(
                (
                  metric,
                ) => (
                  <article
                    key={
                      metric.id
                    }
                    className="csl-kpi-card"
                    title={
                      metric.description ??
                      undefined
                    }
                  >
                    <div className="csl-kpi-label">
                      <span>
                        {
                          metric.displayName
                        }
                      </span>

                      <small>
                        Current CSL Value
                      </small>
                    </div>

                    <strong>
                      {formatMetricValue(
                        metric.value,
                        metric.decimalPlaces,
                        metric.unit,
                      )}
                    </strong>

                    <div className="csl-kpi-line" />
                  </article>
                ),
              )
            )}
          </div>

          <div className="csl-source-footer">
            <span className="csl-source-dot" />

            <div>
              <small>
                Data Source
              </small>

              <strong>
                Official CSL Reporting
              </strong>
            </div>
          </div>
        </section>

        {/* CENTER */}

        <section className="core-panel command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Intelligence Core
              </p>

              <h2>
                Weekly Comparative Intelligence
              </h2>
            </div>

            <div className="confidence-pill">
              {confidence}% Confidence
            </div>
          </div>

          <div className="projection-bar">
            <div>
              <span>
                Projected Finish
              </span>

              <strong>
                {formatLiters(
                  projectedFinish,
                )}
              </strong>
            </div>

            <div>
              <span>
                Projected Variance
              </span>

              <strong
                className={
                  projectedVariance >= 0
                    ? "good"
                    : "bad"
                }
              >
                {projectedVariance >=
                0
                  ? "+"
                  : ""}
                {formatLiters(
                  projectedVariance,
                )}
              </strong>
            </div>
          </div>

          <div className="weekly-table-wrap">
            <table className="weekly-table">
              <thead>
                <tr>
                  <th>
                    Metric
                  </th>

                  {dayHeaders.map(
                    (
                      day,
                    ) => (
                      <th
                        key={
                          day.currentDate
                        }
                      >
                        {day.dayName.slice(
                          0,
                          3,
                        )}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {metrics.map(
                  (
                    metric,
                  ) => (
                    <tr
                      key={
                        metric.metricId
                      }
                    >
                      <td className="metric-name">
                        <strong>
                          {
                            metric.displayName
                          }
                        </strong>

                        <small>
                          {
                            metric.source
                          }
                        </small>
                      </td>

                      {metric.days.map(
                        (
                          day,
                        ) => (
                          <td
                            key={
                              day.currentDate
                            }
                          >
                            <div className="day-cell">
                              <strong>
                                {formatMetricValue(
                                  day.currentValue,
                                  metric.decimalPlaces,
                                  metric.unit,
                                )}
                              </strong>

                              {day.direction !==
                              "NONE" ? (
                                <span
                                  className={outcomeClass(
                                    day.outcome,
                                  )}
                                >
                                  {arrowFor(
                                    day.direction,
                                  )}

                                  {day.percentChange !==
                                  null
                                    ? ` ${Math.abs(
                                        day.percentChange,
                                      ).toFixed(
                                        1,
                                      )}%`
                                    : ""}
                                </span>
                              ) : (
                                <span className="neutral">
                                  —
                                </span>
                              )}

                              <small>
                                Prev{" "}
                                {formatMetricValue(
                                  day.previousValue,
                                  metric.decimalPlaces,
                                  metric.unit,
                                )}
                              </small>
                            </div>
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* RIGHT */}

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
            <span>
              Successful Stick Rate
            </span>

            <strong>
              {successfulStickRate.toFixed(
                1,
              )}
              %
            </strong>

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

            <article className="wide">
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

        {/* SUMMARY */}

        <section className="summary-panel command-panel">
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

        {/* BEEZY */}

        <section className="beezy-panel command-panel">
          <Beezy
            size={
              92
            }
          />

          <div>
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

      <style>
        {`
          * {
            box-sizing: border-box;
          }

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
                rgba(242,183,34,.08),
                transparent 28%
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
          }

          .command-grid {
            position: absolute;
            inset: 0;

            pointer-events: none;
            opacity: .15;

            background-image:
              linear-gradient(
                rgba(255,255,255,.025) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,.025) 1px,
                transparent 1px
              );

            background-size:
              34px 34px;
          }

          .intelligence-header {
            position: relative;
            z-index: 5;

            display: flex;
            align-items: center;
            justify-content: space-between;
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
          }

          .eyebrow {
            margin:
              0 0 4px;

            color: #e9ae24;

            font-size: .58rem;
            font-weight: 1000;

            letter-spacing: .14em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;

            color: #fff7d5;

            font-size: 2.3rem;
          }

          h2 {
            margin: 0;

            color: #fff6cf;

            font-size: 1.02rem;
          }

          .center-name {
            margin:
              4px 0 0;

            color: #9ca99f;

            font-size: .8rem;
          }

          .header-right {
            display: flex;

            gap: 10px;
          }

          .center-status,
          .command-clock {
            display: flex;
            flex-direction: column;

            min-width: 145px;

            padding:
              8px 12px;

            border:
              1px solid
              rgba(255,255,255,.08);

            border-radius: 11px;

            background:
              rgba(255,255,255,.03);
          }

          .center-status span,
          .command-clock span {
            color: #859088;

            font-size: .48rem;
            font-weight: 900;

            text-transform: uppercase;
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
            z-index: 4;

            display: grid;
            flex: 1 1 0;

            grid-template-columns:
              .68fr
              2.75fr
              .72fr;

            grid-template-rows:
              minmax(0,1fr)
              105px;

            gap: 10px;

            min-height: 0;

            margin-top: 10px;
          }

          .command-panel {
            min-width: 0;
            min-height: 0;

            overflow: hidden;

            padding: 13px;

            border:
              1px solid
              rgba(225,174,48,.22);

            border-radius: 15px;

            background:
              linear-gradient(
                150deg,
                rgba(31,40,35,.96),
                rgba(18,25,21,.98)
              );
          }

          .panel-heading {
            display: flex;

            justify-content:
              space-between;

            gap: 10px;
          }

          .confidence-pill {
            padding:
              5px 8px;

            border-radius: 999px;

            background:
              rgba(38,129,153,.12);

            color: #76c6dd;

            font-size: .46rem;
            font-weight: 900;
          }

          /*
           * ==================================
           * CSL SNAPSHOT
           * ==================================
           */

          .csl-panel {
            display: flex;
            flex-direction: column;
          }

          .csl-badge {
            display: grid;

            min-width: 42px;
            height: 26px;

            place-items: center;

            padding:
              0 9px;

            border:
              1px solid
              rgba(255,199,54,.3);

            border-radius: 999px;

            background:
              linear-gradient(
                145deg,
                rgba(242,184,38,.15),
                rgba(124,82,8,.13)
              );

            color: #f5c542;

            font-size: .58rem;
            font-weight: 1000;

            letter-spacing: .08em;
          }

          .csl-panel-copy {
            margin:
              6px 0 8px;

            color: #839087;

            font-size: .58rem;
            font-weight: 700;
          }

          .csl-kpi-stack {
            display: grid;

            flex: 1 1 0;

            grid-template-rows:
              repeat(
                3,
                minmax(0,1fr)
              );

            gap: 9px;

            min-height: 0;
          }

          .csl-kpi-card {
            position: relative;

            display: flex;
            flex-direction: column;
            justify-content: center;

            min-height: 0;

            padding:
              12px 13px;

            overflow: hidden;

            border:
              1px solid
              rgba(235,181,43,.2);

            border-radius: 12px;

            background:
              linear-gradient(
                145deg,
                rgba(50,58,46,.82),
                rgba(20,29,24,.96)
              );

            box-shadow:
              inset
              0 1px 0
              rgba(255,255,255,.035);
          }

          .csl-kpi-card::after {
            content: "";

            position: absolute;

            top: -35px;
            right: -25px;

            width: 90px;
            height: 90px;

            border-radius: 50%;

            background:
              rgba(241,182,37,.07);

            filter:
              blur(15px);
          }

          .csl-kpi-label {
            position: relative;
            z-index: 2;

            display: flex;

            align-items: center;
            justify-content: space-between;

            gap: 7px;
          }

          .csl-kpi-label span {
            color: #aab3aa;

            font-size:
              clamp(
                .5rem,
                .62vw,
                .66rem
              );

            font-weight: 1000;

            letter-spacing: .055em;
            text-transform: uppercase;
          }

          .csl-kpi-label small {
            color: #68756c;

            font-size: .38rem;
            font-weight: 900;

            text-transform: uppercase;
          }

          .csl-kpi-card > strong {
            position: relative;
            z-index: 2;

            display: block;

            margin-top: 7px;

            color: #ffd55b;

            font-size:
              clamp(
                1.45rem,
                2vw,
                2.15rem
              );

            font-weight: 1000;

            line-height: 1;
          }

          .csl-kpi-line {
            position: relative;
            z-index: 2;

            width: 38%;
            height: 3px;

            margin-top: 8px;

            border-radius: 999px;

            background:
              linear-gradient(
                90deg,
                #e8ae27,
                rgba(232,174,39,0)
              );
          }

          .csl-source-footer {
            display: flex;

            align-items: center;

            gap: 8px;

            flex: 0 0 auto;

            margin-top: 9px;

            padding:
              8px 10px;

            border-top:
              1px solid
              rgba(255,255,255,.05);
          }

          .csl-source-dot {
            width: 8px;
            height: 8px;

            flex: 0 0 auto;

            border-radius: 50%;

            background: #75cc69;

            box-shadow:
              0 0 9px
              rgba(117,204,105,.55);
          }

          .csl-source-footer div {
            display: flex;
            flex-direction: column;
          }

          .csl-source-footer small {
            color: #6f7c73;

            font-size: .4rem;
            font-weight: 900;

            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .csl-source-footer strong {
            margin-top: 1px;

            color: #b8c0b9;

            font-size: .53rem;
          }

          .csl-empty {
            grid-row:
              1 / -1;

            display: grid;

            place-items: center;

            color: #78847c;

            font-size: .65rem;

            text-align: center;
          }

          /*
           * ==================================
           * COMPARISON CORE
           * ==================================
           */

          .projection-bar {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 8px;

            margin-top: 7px;
          }

          .projection-bar > div {
            padding:
              7px 10px;

            border-radius: 9px;

            background:
              rgba(255,255,255,.035);
          }

          .projection-bar span {
            display: block;

            color: #8f998f;

            font-size: .43rem;
            font-weight: 900;

            text-transform: uppercase;
          }

          .projection-bar strong {
            display: block;

            margin-top: 2px;

            color: #f3c647;

            font-size: .95rem;
          }

          .good {
            color:
              #79d36e !important;
          }

          .bad {
            color:
              #ff8065 !important;
          }

          .weekly-table-wrap {
            height:
              calc(100% - 74px);

            margin-top: 8px;

            overflow: auto;
          }

          .weekly-table {
            width: 100%;

            border-collapse:
              separate;

            border-spacing:
              3px;

            table-layout:
              fixed;
          }

          .weekly-table th {
            padding: 4px;

            color: #9aa59c;

            font-size: .43rem;
            font-weight: 900;

            text-transform: uppercase;
          }

          .weekly-table th:first-child {
            width: 170px;

            text-align: left;
          }

          .weekly-table td {
            padding: 4px;

            vertical-align:
              middle;
          }

          .metric-name {
            padding-left:
              6px !important;
          }

          .metric-name strong {
            display: block;

            color: #fff0b3;

            font-size:
              clamp(
                .68rem,
                .82vw,
                .9rem
              );

            font-weight: 900;

            line-height: 1.15;
          }

          .metric-name small {
            color: #68746c;

            font-size: .36rem;
          }

          .day-cell {
            display: grid;

            min-height: 68px;

            place-items: center;

            padding:
              6px 5px;

            border:
              1px solid
              rgba(242,181,43,.18);

            border-radius: 9px;

            background:
              rgba(255,255,255,.035);

            text-align: center;
          }

          .day-cell > strong {
            color: #ffd75c;

            font-size:
              clamp(
                .82rem,
                1vw,
                1.08rem
              );

            font-weight: 1000;
          }

          .day-cell > span {
            margin-top: 2px;

            font-size:
              clamp(
                .58rem,
                .68vw,
                .74rem
              );

            font-weight: 1000;
          }

          .day-cell > small {
            margin-top: 2px;

            color: #a5aea7;

            font-size:
              clamp(
                .48rem,
                .55vw,
                .6rem
              );

            font-weight: 700;
          }

          .positive {
            color: #71d369;
          }

          .negative {
            color: #ff735c;
          }

          .neutral {
            color: #9ba29e;
          }

          /*
           * ==================================
           * WORKER INTELLIGENCE
           * ==================================
           */

          .lead-forager-card {
            display: grid;

            grid-template-columns:
              auto 1fr;

            gap: 9px;

            margin-top: 14px;

            padding: 10px;

            border-radius: 10px;

            background:
              rgba(239,179,39,.07);
          }

          .crown {
            font-size: 1.3rem;
          }

          .lead-forager-card span {
            display: block;

            color: #8e9a91;

            font-size: .45rem;
            font-weight: 900;

            text-transform: uppercase;
          }

          .lead-forager-card strong {
            display: block;

            margin-top: 2px;

            color: #ffdf72;
          }

          .lead-forager-card small {
            color: #7b897f;

            font-size: .44rem;
          }

          .stick-performance-card {
            margin-top: 10px;

            padding: 10px;

            border-radius: 10px;

            background:
              rgba(255,255,255,.025);
          }

          .stick-performance-card span,
          .performance-grid span {
            color: #859188;

            font-size: .47rem;
            font-weight: 900;

            text-transform: uppercase;
          }

          .stick-performance-card strong {
            display: block;

            margin-top: 3px;

            color: #88dc78;

            font-size: 1.2rem;
          }

          .stick-rate-track {
            height: 5px;

            margin-top: 7px;

            border-radius: 99px;

            background:
              rgba(255,255,255,.07);
          }

          .stick-rate-fill {
            height: 100%;

            border-radius: inherit;

            background: #73cc66;
          }

          .performance-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 6px;

            margin-top: 9px;
          }

          .performance-grid article {
            padding: 8px;

            border-radius: 9px;

            background:
              rgba(255,255,255,.03);
          }

          .performance-grid strong {
            display: block;

            margin-top: 3px;
          }

          .wide {
            grid-column:
              1 / -1;
          }

          /*
           * ==================================
           * BOTTOM ROW
           * ==================================
           */

          .summary-panel {
            grid-column:
              1 / 3;
          }

          .summary-panel p,
          .beezy-panel p {
            margin:
              4px 0 0;

            color: #a8b0a9;

            font-size: .65rem;
          }

          .beezy-panel {
            display: grid;

            grid-template-columns:
              86px 1fr;

            align-items: center;

            gap: 8px;
          }

          @media (
            max-width: 1100px
          ) {
            .intelligence-page {
              height: auto;
              min-height: 100vh;

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
        `}
      </style>
    </section>
  );
}