import type {
  CSSProperties,
} from "react";

type SupportMetric = {
  label: string;
  value: number | string;

  emphasis?:
    | "gold"
    | "green"
    | "red";
};

type PhlebotomyWorkerBeeCardProps = {
  name: string;
  roleLabel: string;
  primaryRole: string;

  successfulSticks: number;
  successRate: number | null;

  varianceFreeStreak: number;
  streakVerifiedThrough: Date | null;

  supportMetrics?: SupportMetric[];

  isManagement?: boolean;
};

function getStreakIntensity(
  streak: number,
) {
  if (streak <= 0) {
    return 0;
  }

  return Math.min(
    1,
    0.16 + streak * 0.1,
  );
}

function formatMetricValue(
  value: number | string,
) {
  return typeof value === "number"
    ? value.toLocaleString(
        "en-US",
      )
    : value;
}

function cleanMetricLabel(
  label: string,
) {
  return label.replace(
    /^Weekly\s+/i,
    "",
  );
}

function metricHasValue(
  metric: SupportMetric,
) {
  if (
    typeof metric.value ===
    "number"
  ) {
    return metric.value > 0;
  }

  const value =
    metric.value
      .trim()
      .toLowerCase();

  return (
    value !== "" &&
    value !== "0" &&
    value !== "—" &&
    value !== "â€”"
  );
}

export default function PhlebotomyWorkerBeeCard({
  name,
  roleLabel,
  primaryRole,

  successfulSticks,
  successRate,

  varianceFreeStreak,
  streakVerifiedThrough,

  supportMetrics = [],

  isManagement = false,
}: PhlebotomyWorkerBeeCardProps) {
  const visibleSupportMetrics =
    supportMetrics.filter(
      metricHasValue,
    );

  const hasActiveStreak =
    varianceFreeStreak > 0;

  const streakIntensity =
    getStreakIntensity(
      varianceFreeStreak,
    );

  const streakStyle =
    hasActiveStreak
      ? ({
          "--streak-strength":
            String(
              0.24 +
                streakIntensity *
                  0.42,
            ),
        } as CSSProperties)
      : undefined;

  const verifiedLabel =
    streakVerifiedThrough
      ? streakVerifiedThrough
          .toLocaleDateString(
            "en-US",
            {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
            },
          )
      : null;

  const successRateLabel =
    successRate === null
      ? "—"
      : `${successRate.toFixed(
          1,
        )}%`;

  const supportGridClass =
    visibleSupportMetrics.length ===
    1
      ? "support-one"
      : visibleSupportMetrics.length ===
          2
        ? "support-two"
        : visibleSupportMetrics.length ===
            3
          ? "support-three"
          : "support-many";

  return (
    <article
      className={`north-star-worker-card ${
        isManagement
          ? "north-star-management"
          : ""
      } ${
        hasActiveStreak
          ? "north-star-streak"
          : ""
      }`}
      style={streakStyle}
    >
      <div className="card-light-wash" />

      <div className="card-honeycomb card-honeycomb-top" />

      <div className="card-honeycomb card-honeycomb-bottom" />

      {/* =====================================
          SHOWCASE BEE SIDE
         ===================================== */}

      <div className="bee-showcase-panel">
        <div
          className={`bee-showcase ${
            hasActiveStreak
              ? "bee-showcase-active"
              : ""
          }`}
          title={
            hasActiveStreak
              ? verifiedLabel
                ? `${varianceFreeStreak}-day variance-free streak through ${verifiedLabel}`
                : `${varianceFreeStreak}-day variance-free streak`
              : undefined
          }
        >
          <div className="bee-showcase-halo" />

          <div className="bee-showcase-platform" />

          {isManagement ? (
            <ManagementBees />
          ) : (
            <BeeIllustration
              primaryRole={
                primaryRole
              }
            />
          )}

          {hasActiveStreak && (
            <div className="streak-flare">
              🔥
            </div>
          )}
        </div>

        <div className="showcase-identity">
          <strong>
            {name}
          </strong>

          <span>
            {roleLabel}
          </span>
        </div>

        <div
          className={`showcase-streak ${
            hasActiveStreak
              ? "showcase-streak-active"
              : ""
          }`}
        >
          <span>
            {hasActiveStreak
              ? "🔥"
              : "○"}
          </span>

          <strong>
            {
              varianceFreeStreak
            }
          </strong>

          <small>
            {varianceFreeStreak === 1
              ? "DAY"
              : "DAYS"}
          </small>
        </div>
      </div>

      {/* =====================================
          PERFORMANCE SIDE
         ===================================== */}

      <div className="performance-panel">
        <div className="performance-heading">
          <span>
            Weekly Performance
          </span>

          <strong>
            Collection Results
          </strong>
        </div>

        <div className="primary-performance-grid">
          <PerformanceMetric
            label="Successful Sticks"
            value={successfulSticks.toLocaleString(
              "en-US",
            )}
            emphasis="gold"
            primary
          />

          <PerformanceMetric
            label="Success Rate"
            value={
              successRateLabel
            }
            emphasis={
              successRate !== null &&
              successRate >= 90
                ? "green"
                : "gold"
            }
            primary
          />
        </div>

        {visibleSupportMetrics.length >
          0 && (
          <div className="support-contribution">
            <div className="support-divider">
              <span>
                Cross-Trained Activity
              </span>
            </div>

            <div
              className={`support-performance-grid ${supportGridClass}`}
            >
              {visibleSupportMetrics.map(
                (
                  metric,
                  index,
                ) => (
                  <PerformanceMetric
                    key={`${metric.label}-${index}`}
                    label={
                      cleanMetricLabel(
                        metric.label,
                      )
                    }
                    value={
                      formatMetricValue(
                        metric.value,
                      )
                    }
                    emphasis={
                      metric.emphasis ??
                      "green"
                    }
                  />
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          /*
           * ====================================
           * NORTH STAR CARD SHELL
           * ====================================
           */

          .north-star-worker-card {
            position: relative;

            display: grid;

            grid-template-columns:
              minmax(
                112px,
                0.84fr
              )
              minmax(
                0,
                1.16fr
              );

            width: 100%;
            height: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(
                176,
                117,
                17,
                0.36
              );

            border-radius: 18px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  254,
                  239,
                  0.99
                ),
                rgba(
                  255,
                  241,
                  181,
                  0.98
                )
              );

            box-shadow:
              0 8px 18px
              rgba(
                74,
                47,
                6,
                0.16
              ),
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.92
              );

            isolation: isolate;
          }

          .north-star-worker-card::before {
            content: "";

            position: absolute;

            inset: 0;

            z-index: 0;

            background:
              linear-gradient(
                118deg,
                rgba(
                  255,
                  255,
                  255,
                  0.48
                ),
                transparent 36%,
                rgba(
                  173,
                  105,
                  11,
                  0.05
                )
                74%
              );

            pointer-events: none;
          }

          .north-star-management {
            border-color:
              rgba(
                112,
                78,
                15,
                0.5
              );

            background:
              linear-gradient(
                145deg,
                #fff9dc,
                #ebd18b
              );
          }

          .north-star-streak {
            box-shadow:
              0 8px 18px
              rgba(
                74,
                47,
                6,
                0.16
              ),
              0 0 14px
              rgba(
                236,
                147,
                14,
                var(
                  --streak-strength,
                  0.3
                )
              ),
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.92
              );
          }

          /*
           * ====================================
           * CARD DECORATION
           * ====================================
           */

          .card-light-wash {
            position: absolute;

            z-index: 0;

            top: -42px;
            left: -38px;

            width: 170px;
            height: 120px;

            border-radius: 50%;

            background:
              rgba(
                255,
                242,
                163,
                0.42
              );

            filter: blur(31px);

            pointer-events: none;
          }

          .card-honeycomb {
            position: absolute;

            z-index: 0;

            width: 84px;
            height: 66px;

            opacity: 0.06;

            background-image:
              linear-gradient(
                30deg,
                #85550a 12%,
                transparent 12.5%,
                transparent 87%,
                #85550a 87.5%
              ),
              linear-gradient(
                150deg,
                #85550a 12%,
                transparent 12.5%,
                transparent 87%,
                #85550a 87.5%
              );

            background-size:
              24px 41px;

            pointer-events: none;
          }

          .card-honeycomb-top {
            top: -9px;
            right: -8px;
          }

          .card-honeycomb-bottom {
            left: -9px;
            bottom: -15px;
          }

          /*
           * ====================================
           * BEE SHOWCASE PANEL
           * ====================================
           */

          .bee-showcase-panel {
            position: relative;

            z-index: 2;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            min-width: 0;
            min-height: 0;

            padding:
              6px 7px;

            border-right:
              1px solid
              rgba(
                158,
                101,
                11,
                0.19
              );

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  249,
                  214,
                  0.7
                ),
                rgba(
                  247,
                  219,
                  126,
                  0.35
                )
              );

            text-align: center;
          }

          .bee-showcase {
            position: relative;

            display: grid;

            flex: 1 1 0;

            width: 100%;

            min-height: 68px;

            place-items: center;
          }

          .bee-showcase-halo {
            position: absolute;

            width: 96px;
            height: 62px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(
                  255,
                  231,
                  117,
                  0.54
                ),
                rgba(
                  232,
                  168,
                  38,
                  0.16
                )
                56%,
                transparent
                77%
              );

            filter: blur(4px);

            pointer-events: none;
          }

          .bee-showcase-active
          .bee-showcase-halo {
            background:
              radial-gradient(
                circle,
                rgba(
                  255,
                  239,
                  133,
                  0.76
                ),
                rgba(
                  233,
                  143,
                  18,
                  0.31
                )
                56%,
                transparent
                79%
              );
          }

          .bee-showcase-platform {
            position: absolute;

            bottom: 8px;

            width: 76px;
            height: 12px;

            border-radius: 50%;

            background:
              radial-gradient(
                ellipse,
                rgba(
                  111,
                  70,
                  8,
                  0.16
                ),
                transparent 70%
              );

            filter: blur(2px);
          }

          .streak-flare {
            position: absolute;

            z-index: 10;

            top: 3px;
            right: 6px;

            display: grid;

            width: 24px;
            height: 24px;

            place-items: center;

            border:
              1px solid
              rgba(
                211,
                132,
                12,
                0.32
              );

            border-radius: 50%;

            background:
              linear-gradient(
                145deg,
                #fff4bf,
                #ffd770
              );

            box-shadow:
              0 0 9px
              rgba(
                229,
                138,
                10,
                0.28
              );

            font-size: 0.74rem;
          }

          /*
           * ====================================
           * LEFT IDENTITY
           * ====================================
           */

          .showcase-identity {
            flex: 0 0 auto;

            width: 100%;

            min-width: 0;
          }

          .showcase-identity strong {
            display: block;

            overflow: hidden;

            color: #3b2205;

            font-size:
              clamp(
                0.8rem,
                0.92vw,
                1rem
              );

            font-weight: 1000;

            line-height: 1;

            text-overflow:
              ellipsis;

            white-space: nowrap;
          }

          .showcase-identity span {
            display: inline-flex;

            max-width: 100%;

            margin-top: 4px;

            padding:
              3px 8px;

            overflow: hidden;

            border:
              1px solid
              rgba(
                74,
                111,
                40,
                0.24
              );

            border-radius: 999px;

            background:
              linear-gradient(
                145deg,
                #f1f7dd,
                #dfefbd
              );

            color: #416126;

            font-size: 0.42rem;

            font-weight: 1000;

            line-height: 1;

            text-overflow: ellipsis;

            text-transform:
              uppercase;

            white-space: nowrap;
          }

          .showcase-streak {
            display: flex;

            align-items: center;

            justify-content: center;

            gap: 3px;

            flex: 0 0 auto;

            margin-top: 5px;

            padding:
              2px 7px;

            border-radius: 999px;

            color: #735f3a;
          }

          .showcase-streak-active {
            border:
              1px solid
              rgba(
                201,
                122,
                9,
                0.24
              );

            background:
              linear-gradient(
                145deg,
                #fff2bc,
                #ffd674
              );

            color: #744107;
          }

          .showcase-streak span {
            font-size: 0.55rem;
          }

          .showcase-streak strong {
            font-size: 0.58rem;
            font-weight: 1000;
          }

          .showcase-streak small {
            font-size: 0.25rem;
            font-weight: 1000;
          }

          /*
           * ====================================
           * PERFORMANCE PANEL
           * ====================================
           */

          .performance-panel {
            position: relative;

            z-index: 2;

            display: flex;

            flex-direction: column;

            min-width: 0;
            min-height: 0;

            padding:
              8px 10px;
          }

          .performance-heading {
            flex: 0 0 auto;
          }

          .performance-heading span {
            display: block;

            margin-bottom: 2px;

            color: #9d6b14;

            font-size: 0.4rem;

            font-weight: 1000;

            letter-spacing: 0.11em;

            text-transform: uppercase;
          }

          .performance-heading strong {
            display: block;

            color: #3b2205;

            font-size:
              clamp(
                0.87rem,
                1vw,
                1.04rem
              );

            font-weight: 1000;

            line-height: 1;
          }

          /*
           * ====================================
           * PRIMARY PERFORMANCE
           * ====================================
           */

          .primary-performance-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            flex: 1 1 0;

            gap: 6px;

            min-width: 0;
            min-height: 0;

            margin-top: 7px;
          }

          /*
           * ====================================
           * CROSS TRAINED CONTRIBUTION
           * ====================================
           */

          .support-contribution {
            display: flex;

            flex: 0 0 auto;

            flex-direction: column;

            min-width: 0;

            margin-top: 6px;
          }

          .support-divider {
            display: flex;

            align-items: center;

            gap: 6px;

            margin-bottom: 4px;
          }

          .support-divider::before,
          .support-divider::after {
            content: "";

            flex: 1;

            height: 1px;

            background:
              rgba(
                153,
                98,
                11,
                0.17
              );
          }

          .support-divider span {
            flex: 0 0 auto;

            color: #80652e;

            font-size: 0.29rem;

            font-weight: 1000;

            letter-spacing: 0.05em;

            text-transform: uppercase;
          }

          .support-performance-grid {
            display: grid;

            gap: 4px;

            min-width: 0;
          }

          .support-one {
            grid-template-columns: 1fr;
          }

          .support-two {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .support-three,
          .support-many {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }

          /*
           * ====================================
           * PERFORMANCE METRIC
           * ====================================
           */

          .performance-metric {
            position: relative;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            min-width: 0;
            min-height: 0;

            padding:
              4px 5px;

            overflow: hidden;

            border:
              1px solid
              rgba(
                169,
                107,
                8,
                0.23
              );

            border-radius: 10px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  0.91
                ),
                rgba(
                  255,
                  237,
                  170,
                  0.7
                )
              );

            box-shadow:
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.86
              );

            text-align: center;
          }

          .performance-metric::before {
            content: "";

            position: absolute;

            top: 0;
            left: 15%;

            width: 70%;
            height: 2px;

            border-radius: 999px;

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(
                  220,
                  145,
                  18,
                  0.68
                ),
                transparent
              );
          }

          .performance-metric-primary {
            min-height: 48px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  0.96
                ),
                rgba(
                  255,
                  226,
                  129,
                  0.76
                )
              );
          }

          .performance-metric span {
            display: block;

            max-width: 100%;

            overflow: hidden;

            color: #876c36;

            font-size: 0.34rem;

            font-weight: 1000;

            letter-spacing: 0.04em;

            line-height: 1.12;

            text-overflow: ellipsis;

            text-transform: uppercase;

            white-space: nowrap;
          }

          .performance-metric strong {
            display: block;

            max-width: 100%;

            margin-top: 4px;

            overflow: hidden;

            color: #885608;

            font-size:
              clamp(
                0.69rem,
                0.82vw,
                0.9rem
              );

            font-weight: 1000;

            line-height: 1;

            text-overflow: ellipsis;

            white-space: nowrap;
          }

          .performance-metric-primary
          strong {
            font-size:
              clamp(
                0.84rem,
                1vw,
                1.04rem
              );
          }

          .performance-metric-green
          strong {
            color: #477628;
          }

          .performance-metric-red
          strong {
            color: #a4483e;
          }

          /*
           * ====================================
           * ORIGINAL NORTH STAR BEE
           * ====================================
           */

          .bee-illustration {
            position: relative;

            z-index: 2;

            width: 86px;
            height: 66px;

            filter:
              drop-shadow(
                0 5px 5px
                rgba(
                  75,
                  49,
                  4,
                  0.18
                )
              );

            animation:
              workerBeeFloat
              4.2s
              ease-in-out
              infinite;
          }

          @keyframes workerBeeFloat {
            0%,
            100% {
              transform:
                translateY(
                  2px
                )
                rotate(
                  -1deg
                );
            }

            50% {
              transform:
                translateY(
                  -5px
                )
                rotate(
                  1deg
                );
            }
          }

          .bee-body {
            position: absolute;

            z-index: 3;

            top: 27px;
            left: 22px;

            width: 49px;
            height: 29px;

            overflow: hidden;

            border:
              2px solid
              #493308;

            border-radius:
              52% 58%
              55% 48%;

            background:
              repeating-linear-gradient(
                90deg,
                #ffd34f
                0 10px,
                #3b2a0c
                10px 17px
              );

            box-shadow:
              inset
              3px 4px 7px
              rgba(
                255,
                255,
                255,
                0.24
              ),
              inset
              -3px -3px 7px
              rgba(
                45,
                27,
                4,
                0.18
              );
          }

          .bee-head {
            position: absolute;

            z-index: 5;

            top: 24px;
            left: 9px;

            width: 31px;
            height: 31px;

            border:
              2px solid
              #4d3508;

            border-radius: 48%;

            background:
              radial-gradient(
                circle at
                34% 27%,
                #ffe994,
                #e8ac26
                72%
              );

            box-shadow:
              inset
              3px 3px 5px
              rgba(
                255,
                255,
                255,
                0.26
              );
          }

          .bee-head::after {
            content: "";

            position: absolute;

            bottom: 5px;
            left: 9px;

            width: 10px;
            height: 4px;

            border-bottom:
              2px solid
              rgba(
                74,
                44,
                6,
                0.72
              );

            border-radius: 50%;
          }

          .bee-eye {
            position: absolute;

            top: 10px;

            width: 5px;
            height: 6px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle at
                35% 30%,
                #ffffff
                0 16%,
                #211707
                18% 100%
              );

            box-shadow:
              0 0 2px
              rgba(
                0,
                0,
                0,
                0.35
              );
          }

          .bee-eye-left {
            left: 7px;
          }

          .bee-eye-right {
            right: 7px;
          }

          .bee-wing {
            position: absolute;

            z-index: 2;

            top: 7px;

            width: 33px;
            height: 29px;

            border:
              1px solid
              rgba(
                107,
                144,
                151,
                0.44
              );

            border-radius:
              65% 54%
              52% 60%;

            background:
              linear-gradient(
                145deg,
                rgba(
                  245,
                  255,
                  255,
                  0.84
                ),
                rgba(
                  182,
                  229,
                  238,
                  0.48
                )
              );

            box-shadow:
              inset
              3px 3px 6px
              rgba(
                255,
                255,
                255,
                0.44
              );
          }

          .bee-wing-left {
            left: 29px;

            transform:
              rotate(-18deg);
          }

          .bee-wing-right {
            left: 48px;

            transform:
              rotate(20deg);
          }

          .bee-antenna {
            position: absolute;

            z-index: 6;

            top: 14px;

            width: 17px;
            height: 13px;

            border-top:
              2px solid
              #4a3209;
          }

          .bee-antenna::after {
            content: "";

            position: absolute;

            top: -3px;

            width: 4px;
            height: 4px;

            border-radius: 50%;

            background: #4a3209;
          }

          .bee-antenna-left {
            left: 12px;

            transform:
              rotate(-34deg);
          }

          .bee-antenna-right {
            left: 27px;

            transform:
              rotate(28deg);
          }

          .bee-needle {
            position: absolute;

            z-index: 8;

            top: 41px;
            right: -3px;

            width: 29px;
            height: 3px;

            background:
              linear-gradient(
                90deg,
                #8fa4ad,
                #d7e4e8
              );

            transform:
              rotate(-18deg);

            box-shadow:
              0 1px 1px
              rgba(
                67,
                77,
                80,
                0.16
              );
          }

          /*
           * ====================================
           * MANAGEMENT BEES
           * ====================================
           */

          .management-bee-group {
            position: relative;

            z-index: 2;

            display: flex;

            align-items: flex-end;

            justify-content: center;

            width: 100%;

            animation:
              workerBeeFloat
              4.6s
              ease-in-out
              infinite;
          }

          .management-mini-bee {
            position: relative;

            width: 40px;
            height: 40px;

            margin:
              0 -4px;
          }

          .management-mini-bee:nth-child(
            2
          ) {
            transform:
              translateY(-8px)
              scale(1.08);
          }

          .mini-bee-body {
            position: absolute;

            top: 17px;
            left: 8px;

            width: 27px;
            height: 17px;

            border:
              2px solid
              #553b0b;

            border-radius: 50%;

            background:
              repeating-linear-gradient(
                90deg,
                #ffd044
                0 6px,
                #3f2c0b
                6px 10px
              );

            box-shadow:
              0 3px 4px
              rgba(
                70,
                45,
                4,
                0.16
              );
          }

          .mini-bee-head {
            position: absolute;

            z-index: 3;

            top: 16px;
            left: 2px;

            width: 18px;
            height: 18px;

            border:
              2px solid
              #553b0b;

            border-radius: 50%;

            background:
              radial-gradient(
                circle at
                35% 25%,
                #ffe89a,
                #e7ae2f
              );
          }

          .mini-bee-wing {
            position: absolute;

            top: 6px;
            left: 15px;

            width: 20px;
            height: 16px;

            border:
              1px solid
              rgba(
                88,
                125,
                138,
                0.4
              );

            border-radius: 50%;

            background:
              rgba(
                229,
                249,
                252,
                0.75
              );
          }

          /*
           * ====================================
           * SHORT DESKTOP
           * ====================================
           */

          @media (
            max-height: 850px
          ) and (
            min-width: 1101px
          ) {
            .north-star-worker-card {
              grid-template-columns:
                minmax(
                  102px,
                  0.8fr
                )
                minmax(
                  0,
                  1.2fr
                );
            }

            .bee-showcase-panel {
              padding:
                4px 5px;
            }

            .bee-showcase {
              min-height: 57px;
            }

            .bee-illustration {
              transform:
                scale(0.9);
            }

            .showcase-identity strong {
              font-size: 0.76rem;
            }

            .performance-panel {
              padding:
                5px 7px;
            }

            .performance-heading span {
              font-size: 0.34rem;
            }

            .performance-heading strong {
              font-size: 0.84rem;
            }

            .primary-performance-grid {
              gap: 4px;

              margin-top: 5px;
            }

            .support-contribution {
              margin-top: 4px;
            }

            .performance-metric {
              padding:
                2px 3px;
            }

            .performance-metric-primary {
              min-height: 40px;
            }

            .performance-metric-primary
            strong {
              font-size: 0.82rem;
            }
          }

          @media (
            max-width: 700px
          ) {
            .north-star-worker-card {
              grid-template-columns:
                minmax(
                  108px,
                  0.84fr
                )
                minmax(
                  0,
                  1.16fr
                );
            }

            .support-three,
            .support-many {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );
            }
          }

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            .bee-illustration,
            .management-bee-group {
              animation: none;
            }
          }
        `}
      </style>
    </article>
  );
}

type PerformanceMetricProps = {
  label: string;
  value: string;

  emphasis?:
    | "gold"
    | "green"
    | "red";

  primary?: boolean;
};

function PerformanceMetric({
  label,
  value,
  emphasis = "gold",
  primary = false,
}: PerformanceMetricProps) {
  return (
    <div
      className={`performance-metric performance-metric-${emphasis} ${
        primary
          ? "performance-metric-primary"
          : ""
      }`}
    >
      <span title={label}>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function BeeIllustration({
  primaryRole,
}: {
  primaryRole: string;
}) {
  return (
    <div
      className="bee-illustration"
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

      {primaryRole ===
        "Phlebotomist" && (
        <div className="bee-needle" />
      )}
    </div>
  );
}

function ManagementBees() {
  return (
    <div
      className="management-bee-group"
      aria-hidden="true"
    >
      {Array.from({
        length: 3,
      }).map(
        (
          _,
          index,
        ) => (
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