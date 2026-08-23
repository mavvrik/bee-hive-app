import type {
  CSSProperties,
} from "react";

type SupportMetric = {
  label: string;

  value:
    | number
    | string;

  emphasis?:
    | "gold"
    | "green"
    | "red";
};

type WorkerBeeCardProps = {
  name: string;
  roleLabel: string;
  primaryRole: string;

  mode:
    | "phlebotomy"
    | "support";

  successfulSticks: number;
  successRate: number | null;

  varianceFreeStreak: number;
  streakVerifiedThrough: Date | null;

  supportMetrics?: SupportMetric[];

  isManagement?: boolean;
  isPhlebotomist?: boolean;
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
  value:
    | number
    | string,
) {
  return typeof value ===
    "number"
    ? value.toLocaleString(
        "en-US",
      )
    : value;
}

function compactMetricLabel(
  label: string,
) {
  const map:
    Record<
      string,
      string
    > = {
      "Weekly Setups":
        "Setups",

      "Weekly Disconnects":
        "Disconnects",

      "Weekly Interviews":
        "Interviews",

      "Weekly Physicals":
        "Physicals",

      "Weekly Separations":
        "Separations",

      "Weekly Resticks":
        "Resticks",

      "Weekly Solutions Spiked":
        "Solutions Spiked",

      "Solutions Spiked":
        "Solutions Spiked",

      "Bottles Processed":
        "Processed",
    };

  return (
    map[label] ??
    label.replace(
      /^Weekly\s+/i,
      "",
    )
  );
}

function shouldDisplayMetric(
  metric:
    SupportMetric,
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
    value !==
      "team support" &&
    value !==
      "worker bee"
  );
}

export default function WorkerBeeCard({
  name,
  roleLabel,
  primaryRole,
  mode,

  successfulSticks,
  successRate,

  varianceFreeStreak,
  streakVerifiedThrough,

  supportMetrics = [],

  isManagement = false,
  isPhlebotomist = false,
}: WorkerBeeCardProps) {
  const isPhlebotomy =
    mode ===
    "phlebotomy";

  const streakIntensity =
    getStreakIntensity(
      varianceFreeStreak,
    );

  const hasActiveStreak =
    isPhlebotomy &&
    isPhlebotomist &&
    varianceFreeStreak >
      0;

  const streakStyle =
    hasActiveStreak
      ? ({
          "--streak-opacity":
            String(
              .34 +
                streakIntensity *
                  .5,
            ),

          "--streak-blur": `${
            8 +
            streakIntensity *
              18
          }px`,

          "--streak-border": `${
            1.5 +
            streakIntensity *
              2
          }px`,
        } as CSSProperties)
      : undefined;

  const verifiedDateLabel =
    streakVerifiedThrough
      ? streakVerifiedThrough
          .toLocaleDateString(
            "en-US",
            {
              timeZone:
                "UTC",

              month:
                "short",

              day:
                "numeric",
            },
          )
      : null;

  const visibleSupportMetrics =
    supportMetrics
      .filter(
        shouldDisplayMetric,
      )
      .filter(
        (
          metric,
        ) =>
          metric.label !==
            "Management" &&
          metric.label !==
            "Group Lead" &&
          metric.label !==
            "Role Contribution",
      );

  /*
   * ==========================================
   * PHLEBOTOMY METRIC SET
   * ==========================================
   *
   * Meadow 1 now uses the same concept as
   * Meadow 2:
   *
   * Every meaningful metric gets its own
   * clearly separated tile.
   */

  const phlebotomyMetrics:
    SupportMetric[] =
    [
      {
        label:
          "Successful Sticks",

        value:
          successfulSticks,

        emphasis:
          "gold",
      },

      {
        label:
          "Success Rate",

        value:
          successRate ===
            null
            ? "—"
            : `${successRate.toFixed(
                1,
              )}%`,

        emphasis:
          successRate !==
            null &&
          successRate >=
            90
            ? "green"
            : "gold",
      },

      ...visibleSupportMetrics,
    ];

  const displayMetrics =
    isPhlebotomy
      ? phlebotomyMetrics
      : visibleSupportMetrics;

  const metricCount =
    displayMetrics.length;

  return (
    <article
      className={`worker-bee-card ${
        isManagement
          ? "management-card"
          : ""
      } ${
        isPhlebotomy
          ? "phlebotomy-card"
          : "support-card"
      }`}
      aria-label={`${name}, ${roleLabel}`}
    >
      {/* =====================================
          COMPACT IDENTITY HEADER
         ===================================== */}

      <div className="worker-card-header">
        <div className="mini-bee-zone">
          {isManagement ? (
            <ManagementBees />
          ) : (
            <div
              className={`mini-bee-wrapper ${
                hasActiveStreak
                  ? "active-streak"
                  : ""
              }`}
              style={
                streakStyle
              }
              title={
                hasActiveStreak
                  ? verifiedDateLabel
                    ? `${varianceFreeStreak}-day variance-free streak, verified through ${verifiedDateLabel}`
                    : `${varianceFreeStreak}-day variance-free streak`
                  : undefined
              }
            >
              <BeeIllustration
                primaryRole={
                  primaryRole
                }
              />

              {hasActiveStreak && (
                <span className="streak-count-badge">
                  {
                    varianceFreeStreak
                  }
                </span>
              )}
            </div>
          )}
        </div>

        <div className="worker-header-identity">
          <strong className="worker-name">
            {name}
          </strong>

          <span className="worker-role-pill">
            {roleLabel}
          </span>
        </div>

        {isPhlebotomy && (
          <div
            className={`header-streak ${
              hasActiveStreak
                ? "header-streak-active"
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
              day
              {varianceFreeStreak ===
              1
                ? ""
                : "s"}
            </small>
          </div>
        )}
      </div>

      {/* =====================================
          METRIC AREA
         ===================================== */}

      <div className="worker-metric-area">
        <div className="metric-section-heading">
          <span>
            {isPhlebotomy
              ? "Weekly Performance"
              : "Weekly Contribution"}
          </span>

          {isPhlebotomy &&
            visibleSupportMetrics.length >
              0 && (
              <small>
                {
                  visibleSupportMetrics.length
                }{" "}
                cross-trained{" "}
                {visibleSupportMetrics.length ===
                1
                  ? "activity"
                  : "activities"}
              </small>
            )}
        </div>

        {metricCount >
        0 ? (
          <div
            className={`clear-metric-grid metric-count-${Math.min(
              metricCount,
              9,
            )}`}
          >
            {displayMetrics.map(
              (
                metric,
                index,
              ) => (
                <MetricTile
                  key={`${metric.label}-${index}`}
                  label={
                    compactMetricLabel(
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
                    "gold"
                  }
                  primary={
                    isPhlebotomy &&
                    index <
                      2
                  }
                />
              ),
            )}
          </div>
        ) : (
          <div className="empty-performance">
            No activity recorded
            this week.
          </div>
        )}
      </div>

      <style>
        {`
          .worker-bee-card {
            position: relative;

            display: grid;

            grid-template-rows:
              auto
              minmax(
                0,
                1fr
              );

            width: 100%;
            height: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(
                169,
                108,
                12,
                .5
              );

            border-radius:
              16px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  255,
                  248,
                  .97
                ),
                rgba(
                  255,
                  239,
                  177,
                  .97
                )
              );

            box-shadow:
              0 7px 16px
              rgba(
                89,
                55,
                4,
                .16
              );
          }

          .management-card {
            border-color:
              rgba(
                104,
                75,
                17,
                .72
              );
          }

          /*
           * ==================================
           * COMPACT IDENTITY HEADER
           * ==================================
           */

          .worker-card-header {
            position: relative;

            display: grid;

            grid-template-columns:
              58px
              minmax(
                0,
                1fr
              )
              auto;

            align-items: center;

            gap: 6px;

            min-width: 0;

            min-height: 58px;

            padding:
              4px 7px;

            border-bottom:
              1px solid
              rgba(
                174,
                111,
                12,
                .22
              );

            background:
              linear-gradient(
                90deg,
                #fff8cd,
                #ffe898
              );
          }

          .mini-bee-zone {
            position: relative;

            display: grid;

            width: 58px;
            height: 50px;

            place-items: center;

            overflow: visible;
          }

          .mini-bee-wrapper {
            position: relative;

            display: grid;

            width: 56px;
            height: 48px;

            place-items: center;
          }

          .mini-bee-wrapper
          .bee-illustration {
            transform:
              scale(.56);

            animation: none;
          }

          .mini-bee-wrapper.active-streak::before {
            content: "";

            position: absolute;

            inset: 3px;

            border:
              var(
                --streak-border,
                2px
              )
              solid
              rgba(
                235,
                145,
                16,
                .72
              );

            border-radius:
              50%;

            box-shadow:
              0 0
              var(
                --streak-blur,
                10px
              )
              rgba(
                246,
                155,
                20,
                var(
                  --streak-opacity,
                  .55
                )
              );
          }

          .streak-count-badge {
            position: absolute;

            z-index: 10;

            top: -2px;
            right: -2px;

            display: grid;

            width: 19px;
            height: 19px;

            place-items: center;

            border:
              2px solid
              #fff7c7;

            border-radius:
              50%;

            background:
              #efaa27;

            color:
              #442707;

            font-size:
              .56rem;

            font-weight:
              1000;
          }

          .worker-header-identity {
            min-width: 0;
          }

          .worker-name {
            display: block;

            overflow: hidden;

            color:
              #3d2405;

            font-size:
              clamp(
                .8rem,
                .9vw,
                .98rem
              );

            font-weight:
              1000;

            line-height:
              1.05;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .worker-role-pill {
            display:
              inline-flex;

            max-width:
              100%;

            margin-top:
              4px;

            padding:
              2px 7px;

            overflow:
              hidden;

            border-radius:
              999px;

            background:
              #e2efc5;

            color:
              #3d5f25;

            font-size:
              .42rem;

            font-weight:
              1000;

            text-overflow:
              ellipsis;

            text-transform:
              uppercase;

            white-space:
              nowrap;
          }

          .header-streak {
            display: grid;

            grid-template-columns:
              auto auto;

            grid-template-rows:
              auto auto;

            align-items: center;

            justify-items: center;

            column-gap: 2px;

            min-width: 45px;

            padding:
              4px 5px;

            border-radius:
              10px;

            background:
              rgba(
                112,
                88,
                42,
                .07
              );

            color:
              #806733;
          }

          .header-streak span {
            grid-row:
              1 / 3;

            font-size:
              .72rem;
          }

          .header-streak strong {
            color: inherit;

            font-size:
              .78rem;

            line-height:
              1;
          }

          .header-streak small {
            color: inherit;

            font-size:
              .32rem;

            font-weight:
              900;

            text-transform:
              uppercase;
          }

          .header-streak-active {
            border:
              1px solid
              rgba(
                214,
                129,
                11,
                .34
              );

            background:
              linear-gradient(
                145deg,
                #fff0a6,
                #ffd265
              );

            color:
              #713b04;
          }

          /*
           * ==================================
           * METRIC AREA
           * ==================================
           */

          .worker-metric-area {
            position: relative;

            display: flex;

            flex-direction:
              column;

            min-width: 0;
            min-height: 0;

            padding:
              5px 6px 6px;

            overflow: hidden;
          }

          .metric-section-heading {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 5px;

            flex:
              0 0 auto;

            min-width: 0;

            margin-bottom:
              4px;
          }

          .metric-section-heading span {
            color:
              #795515;

            font-size:
              .37rem;

            font-weight:
              1000;

            letter-spacing:
              .08em;

            text-transform:
              uppercase;
          }

          .metric-section-heading small {
            color:
              #87692f;

            font-size:
              .31rem;

            font-weight:
              900;

            white-space:
              nowrap;
          }

          /*
           * This is deliberately modeled after
           * the clear metric approach used on
           * Meadow 2.
           */

          .clear-metric-grid {
            display: grid;

            flex:
              1 1 0;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            grid-auto-rows:
              minmax(
                0,
                1fr
              );

            gap: 4px;

            min-width: 0;
            min-height: 0;
          }

          /*
           * More than four metrics:
           *
           * use three columns so every metric
           * remains a real tile instead of a
           * squeezed ribbon/string.
           */

          .clear-metric-grid.metric-count-5,
          .clear-metric-grid.metric-count-6,
          .clear-metric-grid.metric-count-7,
          .clear-metric-grid.metric-count-8,
          .clear-metric-grid.metric-count-9 {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .metric-tile {
            display: flex;

            flex-direction:
              column;

            align-items: center;

            justify-content:
              center;

            min-width: 0;
            min-height: 0;

            padding:
              3px 3px;

            overflow:
              hidden;

            border:
              1px solid
              rgba(
                157,
                101,
                11,
                .22
              );

            border-radius:
              8px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  .96
                ),
                rgba(
                  255,
                  235,
                  159,
                  .88
                )
              );

            text-align:
              center;

            box-shadow:
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                .72
              );
          }

          .metric-tile-primary {
            border-color:
              rgba(
                177,
                108,
                6,
                .38
              );

            background:
              linear-gradient(
                180deg,
                #fffdf0,
                #ffe38a
              );
          }

          .metric-tile-label {
            display: block;

            width: 100%;

            color:
              #735b2c;

            font-size:
              clamp(
                .28rem,
                .34vw,
                .39rem
              );

            font-weight:
              1000;

            line-height:
              1.12;

            text-transform:
              uppercase;

            overflow-wrap:
              anywhere;
          }

          .metric-tile-value {
            display: block;

            margin-top:
              2px;

            color:
              #805107;

            font-size:
              clamp(
                .68rem,
                .88vw,
                .95rem
              );

            font-weight:
              1000;

            line-height:
              1;
          }

          .metric-tile-primary
          .metric-tile-value {
            font-size:
              clamp(
                .77rem,
                1vw,
                1.08rem
              );
          }

          .metric-green
          .metric-tile-value {
            color:
              #47752a;
          }

          .metric-red
          .metric-tile-value {
            color:
              #a23b32;
          }

          .empty-performance {
            display: grid;

            flex: 1;

            place-items: center;

            color:
              #876f43;

            font-size:
              .52rem;

            font-weight:
              800;

            text-align:
              center;
          }

          /*
           * ==================================
           * BEE ART
           * ==================================
           */

          .bee-illustration {
            position: relative;

            width: 92px;
            height: 72px;

            transform-origin:
              center;
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

            border-radius:
              52%;

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

            border-radius:
              48%;

            background:
              #e8ac26;
          }

          .bee-eye {
            position:
              absolute;

            top: 10px;

            width: 5px;
            height: 6px;

            border-radius:
              50%;

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

            border-radius:
              60%;

            background:
              rgba(
                230,
                249,
                252,
                .78
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

          .bee-nurse-hat {
            position: absolute;

            z-index: 10;

            top: 18px;
            left: 12px;

            width: 32px;
            height: 12px;

            border:
              1px solid
              #d5d5d5;

            border-radius:
              8px 8px 3px 3px;

            background:
              white;
          }

          .bee-nurse-hat::after {
            content: "+";

            position: absolute;

            left: 11px;
            top: -4px;

            color:
              #c53b35;

            font-weight:
              1000;
          }

          .bee-glasses {
            position: absolute;

            z-index: 11;

            top: 37px;
            left: 17px;

            width: 25px;
            height: 8px;
          }

          .bee-glasses::before,
          .bee-glasses::after {
            content: "";

            position: absolute;

            width: 8px;
            height: 8px;

            border:
              2px solid
              #352916;

            border-radius:
              50%;
          }

          .bee-glasses::before {
            left: 0;
          }

          .bee-glasses::after {
            right: 0;
          }

          .bee-glasses-bridge {
            position: absolute;

            z-index: 12;

            top: 40px;
            left: 28px;

            width: 6px;
            height: 2px;

            background:
              #352916;
          }

          .bee-black-glove {
            position: absolute;

            z-index: 9;

            top: 47px;

            width: 12px;
            height: 9px;

            border-radius:
              50%;

            background:
              #111;
          }

          .bee-black-glove-left {
            left: 7px;
          }

          .bee-black-glove-right {
            right: 5px;
          }

          .bee-lab-coat {
            position: absolute;

            z-index: 7;

            top: 32px;
            left: 30px;

            width: 39px;
            height: 27px;

            border:
              1px solid
              #ddd;

            border-radius:
              8px;

            background:
              rgba(
                255,
                255,
                255,
                .94
              );
          }

          /*
           * ==================================
           * MANAGEMENT ART
           * ==================================
           */

          .management-bee-group {
            display: flex;

            align-items:
              flex-end;

            justify-content:
              center;

            width: 55px;

            transform:
              scale(.75);
          }

          .management-mini-bee {
            position:
              relative;

            width: 28px;
            height: 34px;

            margin:
              0 -3px;
          }

          .management-mini-bee:nth-child(2) {
            transform:
              translateY(-5px);
          }

          .mini-bee-body {
            position:
              absolute;

            top: 15px;
            left: 6px;

            width: 21px;
            height: 14px;

            border:
              2px solid
              #553b0b;

            border-radius:
              50%;

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
            position:
              absolute;

            top: 14px;
            left: 0;

            width: 15px;
            height: 15px;

            border-radius:
              50%;

            background:
              #e7ae2f;
          }

          .mini-bee-wing {
            position:
              absolute;

            top: 5px;
            left: 12px;

            width: 17px;
            height: 14px;

            border-radius:
              50%;

            background:
              #e5f7fa;
          }

          /*
           * ==================================
           * SHORT DESKTOP
           * ==================================
           */

          @media (
            max-height:
              850px
          ) and (
            min-width:
              1101px
          ) {
            .worker-card-header {
              min-height:
                50px;

              grid-template-columns:
                48px
                minmax(
                  0,
                  1fr
                )
                auto;

              padding:
                3px 5px;
            }

            .mini-bee-zone {
              width: 48px;
              height: 42px;
            }

            .mini-bee-wrapper {
              width: 47px;
              height: 41px;
            }

            .mini-bee-wrapper
            .bee-illustration {
              transform:
                scale(.47);
            }

            .worker-name {
              font-size:
                .77rem;
            }

            .header-streak {
              min-width:
                39px;

              padding:
                3px;
            }

            .worker-metric-area {
              padding:
                3px 4px 4px;
            }

            .metric-section-heading {
              margin-bottom:
                2px;
            }

            .clear-metric-grid {
              gap: 3px;
            }

            .metric-tile {
              padding:
                2px;
            }

            .metric-tile-label {
              font-size:
                .27rem;
            }

            .metric-tile-value {
              margin-top:
                1px;

              font-size:
                .68rem;
            }

            .metric-tile-primary
            .metric-tile-value {
              font-size:
                .75rem;
            }
          }

          @media (
            max-height:
              720px
          ) and (
            min-width:
              1101px
          ) {
            .worker-card-header {
              min-height:
                43px;

              grid-template-columns:
                42px
                minmax(
                  0,
                  1fr
                )
                auto;
            }

            .mini-bee-zone {
              width: 42px;
              height: 36px;
            }

            .mini-bee-wrapper
            .bee-illustration {
              transform:
                scale(.4);
            }

            .worker-role-pill {
              margin-top:
                2px;

              padding:
                1px 5px;
            }

            .metric-section-heading {
              display: none;
            }

            .worker-metric-area {
              padding-top:
                3px;
            }
          }
        `}
      </style>
    </article>
  );
}

type MetricTileProps = {
  label: string;
  value: string;

  emphasis:
    | "gold"
    | "green"
    | "red";

  primary?: boolean;
};

function MetricTile({
  label,
  value,
  emphasis,
  primary = false,
}: MetricTileProps) {
  return (
    <div
      className={`metric-tile metric-${emphasis} ${
        primary
          ? "metric-tile-primary"
          : ""
      }`}
    >
      <span className="metric-tile-label">
        {label}
      </span>

      <strong className="metric-tile-value">
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
  const isPhlebotomist =
    primaryRole ===
    "Phlebotomist";

  const isMsa =
    primaryRole ===
    "MSA";

  const isReception =
    primaryRole ===
    "Reception Tech";

  const isDst =
    primaryRole ===
    "DST";

  const isProcessor =
    primaryRole ===
    "Processor";

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

      {isProcessor && (
        <div className="bee-lab-coat" />
      )}

      <div className="bee-head">
        <div className="bee-eye bee-eye-left" />
        <div className="bee-eye bee-eye-right" />
      </div>

      {isPhlebotomist && (
        <div className="bee-needle" />
      )}

      {isMsa && (
        <div className="bee-nurse-hat" />
      )}

      {isReception && (
        <>
          <div className="bee-glasses" />
          <div className="bee-glasses-bridge" />
        </>
      )}

      {isDst && (
        <>
          <div className="bee-black-glove bee-black-glove-left" />
          <div className="bee-black-glove bee-black-glove-right" />
        </>
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