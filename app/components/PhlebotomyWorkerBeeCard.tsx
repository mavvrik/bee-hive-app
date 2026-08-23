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
    .16 + streak * .1,
  );
}

function formatMetricValue(
  value: number | string,
) {
  return typeof value === "number"
    ? value.toLocaleString("en-US")
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

function hasMetricValue(
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
      hasMetricValue,
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
          "--streak-glow":
            String(
              .18 +
                streakIntensity *
                  .24,
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
      ? "support-grid-one"
      : visibleSupportMetrics.length ===
          2
        ? "support-grid-two"
        : "support-grid-three";

  return (
    <article
      className={`phleb-worker-card ${
        isManagement
          ? "management-card"
          : ""
      } ${
        hasActiveStreak
          ? "active-streak-card"
          : ""
      }`}
      style={streakStyle}
    >
      <div className="corner-honeycomb corner-honeycomb-top" />
      <div className="corner-honeycomb corner-honeycomb-bottom" />

      <header className="worker-header">
        <div className="worker-main">
          <div className="bee-area">
            {isManagement ? (
              <ManagementBees />
            ) : (
              <BeeIllustration
                primaryRole={
                  primaryRole
                }
              />
            )}
          </div>

          <div className="worker-identity">
            <strong>
              {name}
            </strong>

            <span>
              {roleLabel}
            </span>
          </div>
        </div>

        <div
          className={`streak-badge ${
            hasActiveStreak
              ? "streak-badge-active"
              : ""
          }`}
          title={
            hasActiveStreak
              ? verifiedLabel
                ? `Variance-free through ${verifiedLabel}`
                : `${varianceFreeStreak}-day variance-free streak`
              : undefined
          }
        >
          <span className="streak-icon">
            {hasActiveStreak
              ? "🔥"
              : "○"}
          </span>

          <div>
            <strong>
              {varianceFreeStreak}
            </strong>

            <small>
              {varianceFreeStreak === 1
                ? "DAY"
                : "DAYS"}
            </small>
          </div>
        </div>
      </header>

      <div className="primary-metrics">
        <MetricTile
          label="Successful Sticks"
          value={successfulSticks.toLocaleString(
            "en-US",
          )}
          primary
        />

        <MetricTile
          label="Success Rate"
          value={successRateLabel}
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
        <div
          className={`support-metrics ${supportGridClass}`}
        >
          {visibleSupportMetrics.map(
            (
              metric,
              index,
            ) => (
              <MetricTile
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
      )}

      <style>
        {`
          .phleb-worker-card {
            position: relative;

            display: flex;
            flex-direction: column;

            width: 100%;
            height: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(
                218,
                164,
                47,
                .52
              );

            border-radius: 16px;

            background:
              linear-gradient(
                180deg,
                #fffdf4 0%,
                #fff8dc 100%
              );

            box-shadow:
              0 4px 10px
              rgba(
                98,
                64,
                10,
                .09
              );

            color: #352209;

            box-sizing: border-box;
          }

          .management-card {
            background:
              linear-gradient(
                180deg,
                #fffced 0%,
                #faedbd 100%
              );

            border-color:
              rgba(
                178,
                126,
                31,
                .65
              );
          }

          .active-streak-card {
            box-shadow:
              0 4px 10px
              rgba(
                98,
                64,
                10,
                .09
              ),
              0 0 11px
              rgba(
                238,
                160,
                32,
                var(
                  --streak-glow,
                  .2
                )
              );
          }

          /*
           * HONEYCOMB ACCENTS
           */

          .corner-honeycomb {
            position: absolute;

            z-index: 0;

            width: 72px;
            height: 48px;

            opacity: .08;

            background-image:
              linear-gradient(
                30deg,
                #c89722 12%,
                transparent 12.5%,
                transparent 87%,
                #c89722 87.5%
              ),
              linear-gradient(
                150deg,
                #c89722 12%,
                transparent 12.5%,
                transparent 87%,
                #c89722 87.5%
              );

            background-size:
              20px 34px;

            pointer-events: none;
          }

          .corner-honeycomb-top {
            top: -4px;
            right: 10px;
          }

          .corner-honeycomb-bottom {
            bottom: -8px;
            left: 8px;
          }

          /*
           * HEADER
           */

          .worker-header {
            position: relative;

            z-index: 2;

            display: flex;

            align-items: center;
            justify-content:
              space-between;

            gap: 8px;

            flex: 0 0 auto;

            min-height: 55px;

            padding:
              7px 10px 5px;
          }

          .worker-main {
            display: flex;

            align-items: center;

            gap: 9px;

            min-width: 0;
          }

          .bee-area {
            display: grid;

            flex: 0 0 auto;

            width: 54px;
            height: 44px;

            place-items: center;
          }

          .bee-area
          .bee-illustration {
            transform:
              scale(.48);

            transform-origin:
              center;
          }

          .worker-identity {
            min-width: 0;
          }

          .worker-identity strong {
            display: block;

            overflow: hidden;

            color: #342006;

            font-size:
              clamp(
                .92rem,
                1.05vw,
                1.08rem
              );

            font-weight: 1000;

            line-height: 1;

            text-overflow:
              ellipsis;

            white-space: nowrap;
          }

          .worker-identity span {
            display: block;

            margin-top: 5px;

            color: #44713b;

            font-size: .42rem;
            font-weight: 1000;

            letter-spacing:
              .02em;

            line-height: 1;

            text-transform:
              uppercase;
          }

          /*
           * STREAK BADGE
           */

          .streak-badge {
            display: flex;

            align-items: center;

            gap: 6px;

            flex: 0 0 auto;

            min-width: 64px;

            padding:
              5px 7px;

            border-radius: 11px;

            color: #59492d;
          }

          .streak-badge-active {
            border:
              1px solid
              rgba(
                225,
                158,
                38,
                .35
              );

            background:
              linear-gradient(
                145deg,
                #fff4c5,
                #ffe5a0
              );
          }

          .streak-icon {
            font-size: .85rem;
          }

          .streak-badge div {
            display: flex;

            flex-direction: column;

            align-items: flex-start;
          }

          .streak-badge strong {
            color: #3f2707;

            font-size: .92rem;
            font-weight: 1000;

            line-height: .9;
          }

          .streak-badge small {
            margin-top: 2px;

            color: #694a18;

            font-size: .28rem;
            font-weight: 1000;

            line-height: 1;
          }

          /*
           * PRIMARY KPI AREA
           */

          .primary-metrics {
            position: relative;

            z-index: 2;

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

            gap: 5px;

            min-width: 0;
            min-height: 0;

            padding:
              0 10px 7px;
          }

          /*
           * SUPPORT METRICS
           */

          .support-metrics {
            position: relative;

            z-index: 2;

            display: grid;

            flex: 0 0 auto;

            gap: 5px;

            min-width: 0;

            padding:
              0 10px 8px;
          }

          .support-grid-one {
            grid-template-columns:
              1fr;
          }

          .support-grid-two {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .support-grid-three {
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
           * METRIC TILE
           */

          .metric-tile {
            display: flex;

            flex-direction: column;

            align-items: center;
            justify-content: center;

            min-width: 0;
            min-height: 0;

            padding:
              5px 6px;

            border:
              1px solid
              rgba(
                221,
                166,
                52,
                .46
              );

            border-radius: 10px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  252,
                  .96
                ),
                rgba(
                  255,
                  247,
                  215,
                  .94
                )
              );

            box-shadow:
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                .8
              );

            text-align: center;
          }

          .metric-primary {
            background:
              linear-gradient(
                180deg,
                #fffef8,
                #fff4cd
              );
          }

          .metric-tile span {
            display: block;

            max-width: 100%;

            overflow: hidden;

            color: #665944;

            font-size: .4rem;
            font-weight: 900;

            line-height: 1.1;

            text-overflow:
              ellipsis;

            text-transform:
              uppercase;

            white-space: nowrap;
          }

          .metric-tile strong {
            display: block;

            margin-top: 5px;

            color: #5b3707;

            font-size: .92rem;
            font-weight: 1000;

            line-height: 1;
          }

          .metric-primary strong {
            font-size: 1.08rem;
          }

          .metric-green span {
            color: #4b703f;
          }

          .metric-green strong {
            color: #3f6938;
          }

          .metric-red strong {
            color: #9d4438;
          }

          /*
           * BEE ILLUSTRATION
           */

          .bee-illustration {
            position: relative;

            width: 92px;
            height: 72px;
          }

          .bee-body {
            position: absolute;

            z-index: 3;

            top: 30px;
            left: 26px;

            width: 49px;
            height: 29px;

            border:
              2px solid
              #493308;

            border-radius: 52%;

            background:
              repeating-linear-gradient(
                90deg,
                #ffd34f
                0 10px,
                #3b2a0c
                10px 17px
              );
          }

          .bee-head {
            position: absolute;

            z-index: 5;

            top: 27px;
            left: 13px;

            width: 31px;
            height: 31px;

            border:
              2px solid
              #4d3508;

            border-radius: 48%;

            background:
              #e8ac26;
          }

          .bee-eye {
            position: absolute;

            top: 10px;

            width: 5px;
            height: 6px;

            border-radius: 50%;

            background:
              #211707;
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

            top: 9px;

            width: 33px;
            height: 29px;

            border-radius: 60%;

            background:
              rgba(
                230,
                249,
                252,
                .86
              );
          }

          .bee-wing-left {
            left: 32px;

            transform:
              rotate(-18deg);
          }

          .bee-wing-right {
            left: 51px;

            transform:
              rotate(20deg);
          }

          .bee-antenna {
            position: absolute;

            z-index: 6;

            top: 17px;

            width: 17px;

            border-top:
              2px solid
              #4a3209;
          }

          .bee-antenna-left {
            left: 16px;

            transform:
              rotate(-34deg);
          }

          .bee-antenna-right {
            left: 31px;

            transform:
              rotate(28deg);
          }

          .bee-needle {
            position: absolute;

            z-index: 8;

            top: 44px;
            right: -2px;

            width: 31px;
            height: 4px;

            background:
              #a6bbc3;

            transform:
              rotate(-18deg);
          }

          /*
           * MANAGEMENT BEES
           */

          .management-bee-group {
            display: flex;

            align-items: flex-end;

            justify-content:
              center;

            width: 58px;

            transform:
              scale(.78);
          }

          .management-mini-bee {
            position: relative;

            width: 28px;
            height: 34px;

            margin:
              0 -3px;
          }

          .management-mini-bee:nth-child(
            2
          ) {
            transform:
              translateY(
                -5px
              );
          }

          .mini-bee-body {
            position: absolute;

            top: 15px;
            left: 6px;

            width: 21px;
            height: 14px;

            border:
              2px solid
              #553b0b;

            border-radius: 50%;

            background:
              repeating-linear-gradient(
                90deg,
                #ffd044
                0 5px,
                #3f2c0b
                5px 8px
              );
          }

          .mini-bee-head {
            position: absolute;

            top: 14px;
            left: 0;

            width: 15px;
            height: 15px;

            border-radius: 50%;

            background:
              #e7ae2f;
          }

          .mini-bee-wing {
            position: absolute;

            top: 5px;
            left: 12px;

            width: 17px;
            height: 14px;

            border-radius: 50%;

            background:
              #e5f7fa;
          }

          /*
           * SHORT DESKTOP
           */

          @media (
            max-height: 850px
          ) and (
            min-width: 1101px
          ) {
            .worker-header {
              min-height: 48px;

              padding:
                5px 8px 4px;
            }

            .bee-area {
              width: 48px;
              height: 38px;
            }

            .bee-area
            .bee-illustration {
              transform:
                scale(.43);
            }

            .worker-identity strong {
              font-size: .88rem;
            }

            .streak-badge {
              min-width: 56px;

              padding:
                4px 6px;
            }

            .primary-metrics {
              padding:
                0 8px 5px;
            }

            .support-metrics {
              padding:
                0 8px 6px;
            }

            .metric-tile {
              padding:
                3px 4px;
            }

            .metric-primary strong {
              font-size: .92rem;
            }

            .metric-tile strong {
              font-size: .78rem;
            }
          }
        `}
      </style>
    </article>
  );
}

function MetricTile({
  label,
  value,
  emphasis = "gold",
  primary = false,
}: {
  label: string;
  value: string;

  emphasis?:
    | "gold"
    | "green"
    | "red";

  primary?: boolean;
}) {
  return (
    <div
      className={`metric-tile metric-${emphasis} ${
        primary
          ? "metric-primary"
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