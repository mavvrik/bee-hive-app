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
  const replacements:
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

      "Solutions Spiked":
        "Solutions",

      "Weekly Solutions Spiked":
        "Solutions",

      "Bottles Processed":
        "Processed",
    };

  return (
    replacements[label] ??
    label.replace(
      /^Weekly\s+/i,
      "",
    )
  );
}

function shouldShowMetric(
  metric:
    SupportMetric,
) {
  if (
    typeof metric.value ===
    "number"
  ) {
    return metric.value > 0;
  }

  const normalized =
    metric.value
      .trim()
      .toLowerCase();

  return (
    normalized !== "" &&
    normalized !== "0" &&
    normalized !== "—" &&
    normalized !==
      "team support" &&
    normalized !==
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
  const streakIntensity =
    getStreakIntensity(
      varianceFreeStreak,
    );

  const hasActiveStreak =
    mode ===
      "phlebotomy" &&
    isPhlebotomist &&
    varianceFreeStreak > 0;

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
            10 +
            streakIntensity *
              23
          }px`,

          "--streak-spread": `${
            1 +
            streakIntensity *
              5
          }px`,

          "--streak-border": `${
            2 +
            streakIntensity *
              2.5
          }px`,

          "--streak-scale":
            String(
              1 +
                streakIntensity *
                  .045,
            ),
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
        shouldShowMetric,
      )
      .filter(
        (metric) =>
          metric.label !==
            "Management" &&
          metric.label !==
            "Group Lead" &&
          metric.label !==
            "Role Contribution",
      );

  const hasCrossTrainedMetrics =
    mode ===
      "phlebotomy" &&
    visibleSupportMetrics.length >
      0;

  return (
    <article
      data-streaker={
        hasActiveStreak
          ? "true"
          : "false"
      }
      className={`worker-bee-card ${
        isManagement
          ? "management-card"
          : ""
      } ${
        hasCrossTrainedMetrics
          ? "cross-trained-card"
          : ""
      }`}
      aria-label={`${name}, ${roleLabel}`}
    >
      <div className="card-shine" />

      <div className="worker-main-row">
        <div className="worker-left-panel">
          <div className="worker-bee-stage">
            <div className="bee-stage-glow" />

            {isManagement ? (
              <ManagementBees />
            ) : hasActiveStreak ? (
              <div
                className="bee-streak-orbit"
                style={
                  streakStyle
                }
                title={
                  verifiedDateLabel
                    ? `${varianceFreeStreak}-day variance-free streak, verified through ${verifiedDateLabel}`
                    : `${varianceFreeStreak}-day variance-free streak`
                }
              >
                <BeeIllustration
                  primaryRole={
                    primaryRole
                  }
                />

                <span className="streak-count-badge">
                  {
                    varianceFreeStreak
                  }
                </span>
              </div>
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

            <span className="worker-role-pill">
              {roleLabel}
            </span>

            {mode ===
              "phlebotomy" && (
              <div
                className={`identity-streak ${
                  hasActiveStreak
                    ? "identity-streak-active"
                    : ""
                }`}
              >
                <span>
                  {hasActiveStreak
                    ? "🔥"
                    : "○"}
                </span>

                <strong>
                  {varianceFreeStreak}{" "}
                  Day
                  {varianceFreeStreak ===
                  1
                    ? ""
                    : "s"}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div className="worker-right-panel">
          <div className="worker-heading">
            <span className="worker-eyebrow">
              Worker Bee
            </span>

            <strong className="worker-title">
              {mode ===
              "phlebotomy"
                ? "Weekly Performance"
                : "Weekly Contribution"}
            </strong>
          </div>

          {mode ===
          "phlebotomy" ? (
            <div className="phlebotomy-core-grid">
              <WorkerValue
                label="Successful Sticks"
                value={
                  successfulSticks.toLocaleString(
                    "en-US",
                  )
                }
                emphasis="gold"
              />

              <WorkerValue
                label="Success Rate"
                value={
                  successRate === null
                    ? "—"
                    : `${successRate.toFixed(
                        1,
                      )}%`
                }
                emphasis={
                  successRate !==
                    null &&
                  successRate >=
                    90
                    ? "green"
                    : "gold"
                }
              />
            </div>
          ) : (
            <div className="support-value-grid">
              {visibleSupportMetrics.map(
                (
                  metric,
                  index,
                ) => (
                  <WorkerValue
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
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {mode ===
        "phlebotomy" &&
        visibleSupportMetrics.length >
          0 && (
        <div className="activity-ribbon">
          <span className="activity-ribbon-label">
            Cross-Trained
          </span>

          <div className="activity-ribbon-values">
            {visibleSupportMetrics.map(
              (
                metric,
                index,
              ) => (
                <div
                  key={`${metric.label}-${index}`}
                  className="activity-ribbon-item"
                >
                  <span>
                    {compactMetricLabel(
                      metric.label,
                    )}
                  </span>

                  <strong>
                    {formatMetricValue(
                      metric.value,
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <style>
        {`
          .worker-bee-card {
            position: relative;

            display: grid;

            grid-template-rows:
              minmax(0, 1fr)
              auto;

            width: 100%;
            height: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(
                175,
                111,
                10,
                .46
              );

            border-radius: 17px;

            background:
              linear-gradient(
                145deg,
                #fffef2,
                #fff5cb
              );

            box-shadow:
              0 7px 16px
              rgba(
                99,
                61,
                4,
                .15
              );
          }

          .cross-trained-card {
            border-color:
              rgba(
                163,
                108,
                10,
                .68
              );
          }

          .management-card {
            border-color:
              rgba(
                115,
                81,
                16,
                .62
              );
          }

          .card-shine {
            position: absolute;
            z-index: 1;

            top: -20px;
            right: -24px;

            width: 100px;
            height: 100px;

            border-radius: 50%;

            background:
              rgba(
                255,
                255,
                255,
                .5
              );

            filter:
              blur(22px);
          }

          /*
           * ==================================
           * MAIN ROW
           * ==================================
           */

          .worker-main-row {
            position: relative;
            z-index: 2;

            display: grid;

            grid-template-columns:
              minmax(
                108px,
                .82fr
              )
              minmax(
                0,
                1.18fr
              );

            min-width: 0;
            min-height: 0;
          }

          /*
           * ==================================
           * LEFT PANEL
           * ==================================
           */

          .worker-left-panel {
            display: grid;

            grid-template-rows:
              minmax(
                0,
                1fr
              )
              auto;

            align-items: center;

            min-width: 0;
            min-height: 0;

            padding:
              4px 5px 4px;

            border-right:
              1px solid
              rgba(
                188,
                126,
                17,
                .22
              );

            background:
              linear-gradient(
                180deg,
                #fffbdc,
                rgba(
                  243,
                  209,
                  108,
                  .35
                )
              );
          }

          .worker-bee-stage {
            position: relative;

            display: flex;

            align-items: center;
            justify-content: center;

            min-height: 0;
          }

          .bee-stage-glow {
            position: absolute;

            top: 50%;
            left: 50%;

            width: 88px;
            height: 58px;

            transform:
              translate(
                -50%,
                -50%
              );

            border-radius: 50%;

            background:
              radial-gradient(
                ellipse,
                rgba(
                  255,
                  218,
                  104,
                  .34
                ),
                transparent
                68%
              );

            filter:
              blur(6px);
          }

          .bee-streak-orbit {
            position: relative;
            z-index: 3;

            display: grid;

            width: 102px;
            height: 80px;

            place-items: center;

            transform:
              scale(
                var(
                  --streak-scale,
                  1
                )
              );
          }

          .bee-streak-orbit::before {
            content: "";

            position: absolute;

            top: 50%;
            left: 50%;

            width: 87px;
            height: 68px;

            transform:
              translate(
                -50%,
                -50%
              );

            border:
              var(
                --streak-border,
                2px
              )
              solid
              rgba(
                245,
                164,
                21,
                var(
                  --streak-opacity,
                  .5
                )
              );

            border-radius: 50%;

            box-shadow:
              0 0
              var(
                --streak-blur,
                13px
              )
              var(
                --streak-spread,
                1px
              )
              rgba(
                255,
                156,
                17,
                var(
                  --streak-opacity,
                  .5
                )
              );

            animation:
              streakRingPulse
              2.3s
              ease-in-out
              infinite;
          }

          .streak-count-badge {
            position: absolute;
            z-index: 8;

            top: 0;
            right: 4px;

            display: grid;

            width: 22px;
            height: 22px;

            place-items: center;

            border:
              2px solid
              #fffcdf;

            border-radius: 50%;

            background:
              linear-gradient(
                145deg,
                #ffe16c,
                #e59415
              );

            color: #422403;

            font-size: .65rem;
            font-weight: 1000;
          }

          @keyframes streakRingPulse {
            0%,
            100% {
              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(.98);
            }

            50% {
              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(1.045);
            }
          }

          .worker-identity {
            display: flex;

            flex-direction: column;
            align-items: center;

            width: 100%;

            text-align: center;
          }

          .worker-identity > strong {
            display: block;

            width: 100%;

            overflow: hidden;

            color: #422505;

            font-size:
              clamp(
                .78rem,
                .9vw,
                .92rem
              );

            font-weight: 1000;

            line-height: 1.05;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-role-pill {
            display: inline-flex;

            margin-top: 3px;

            padding:
              2px 7px;

            border-radius: 999px;

            background: #e5f1c6;

            color: #416126;

            font-size: .43rem;
            font-weight: 1000;

            text-transform: uppercase;
          }

          .identity-streak {
            display: flex;

            align-items: center;
            justify-content: center;

            gap: 3px;

            min-height: 17px;

            margin-top: 3px;

            padding:
              2px 6px;

            border-radius: 999px;

            background:
              rgba(
                121,
                96,
                50,
                .08
              );

            color: #896e3d;

            white-space: nowrap;
          }

          .identity-streak span {
            font-size: .52rem;
          }

          .identity-streak strong {
            color: inherit;

            font-size: .5rem;
            font-weight: 1000;
          }

          .identity-streak-active {
            border:
              1px solid
              rgba(
                218,
                137,
                13,
                .34
              );

            background:
              linear-gradient(
                145deg,
                #fff2af,
                #ffd263
              );

            color: #7a4104;
          }

          /*
           * ==================================
           * RIGHT PANEL
           * ==================================
           */

          .worker-right-panel {
            display: flex;

            flex-direction: column;
            justify-content: center;

            min-width: 0;
            min-height: 0;

            padding:
              5px 7px;
          }

          .worker-eyebrow {
            display: block;

            color: #a16d12;

            font-size: .38rem;

            font-weight: 1000;

            letter-spacing: .11em;

            text-transform: uppercase;
          }

          .worker-title {
            display: block;

            color: #3b2205;

            font-size: .8rem;
            font-weight: 1000;
          }

          .phlebotomy-core-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 5px;

            margin-top: 5px;
          }

          .support-value-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 5px;

            margin-top: 5px;
          }

          /*
           * ==================================
           * VALUE BOX
           * ==================================
           */

          .worker-value {
            display: flex;

            flex-direction: column;
            align-items: center;
            justify-content: center;

            min-width: 0;

            min-height: 43px;

            padding:
              5px 4px;

            border:
              1px solid
              rgba(
                168,
                107,
                9,
                .23
              );

            border-radius: 9px;

            background:
              linear-gradient(
                180deg,
                #fff,
                #ffedab
              );

            text-align: center;
          }

          .worker-value span {
            color: #8b6f37;

            font-size: .33rem;
            font-weight: 1000;

            line-height: 1.05;

            text-transform: uppercase;
          }

          .worker-value strong {
            margin-top: 3px;

            font-size: .8rem;
            font-weight: 1000;
          }

          .worker-value-gold strong {
            color: #8b5708;
          }

          .worker-value-green strong {
            color: #477728;
          }

          .worker-value-red strong {
            color: #a23b32;
          }

          /*
           * ==================================
           * CROSS-TRAINED RIBBON
           * ==================================
           */

          .activity-ribbon {
            position: relative;
            z-index: 4;

            display: grid;

            grid-template-columns:
              auto
              minmax(
                0,
                1fr
              );

            align-items: center;

            gap: 6px;

            min-width: 0;

            padding:
              4px 7px 5px;

            border-top:
              1px solid
              rgba(
                152,
                96,
                9,
                .28
              );

            background:
              linear-gradient(
                90deg,
                rgba(
                  239,
                  196,
                  70,
                  .24
                ),
                rgba(
                  255,
                  250,
                  213,
                  .72
                )
              );
          }

          .activity-ribbon-label {
            align-self: stretch;

            display: flex;

            align-items: center;

            padding-right: 6px;

            border-right:
              1px solid
              rgba(
                154,
                100,
                11,
                .23
              );

            color: #73500d;

            font-size: .28rem;
            font-weight: 1000;

            letter-spacing: .08em;

            text-transform: uppercase;

            white-space: nowrap;
          }

          .activity-ribbon-values {
            display: flex;

            flex-wrap: wrap;

            align-items: center;

            gap:
              2px 8px;

            min-width: 0;
          }

          .activity-ribbon-item {
            display: inline-flex;

            align-items: baseline;

            gap: 3px;

            min-width: 0;

            white-space: nowrap;
          }

          .activity-ribbon-item:not(
            :last-child
          )::after {
            content: "•";

            margin-left: 5px;

            color:
              rgba(
                115,
                77,
                8,
                .48
              );

            font-size: .4rem;
          }

          .activity-ribbon-item span {
            color: #785d27;

            font-size: .29rem;
            font-weight: 900;
          }

          .activity-ribbon-item strong {
            color: #6b4306;

            font-size: .55rem;
            font-weight: 1000;
          }

          /*
           * ==================================
           * BASE BEE
           * ==================================
           */

          .bee-illustration {
            position: relative;

            width: 92px;
            height: 72px;

            transform-origin: center;

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
                translateY(2px);
            }

            50% {
              transform:
                translateY(-5px);
            }
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
                .75
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

            background: white;
          }

          .bee-nurse-hat::after {
            content: "+";

            position: absolute;

            left: 11px;
            top: -4px;

            color: #c53b35;

            font-weight: 1000;
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

            border-radius: 50%;
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

            border-radius: 50%;

            background: #111;
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

            border-radius: 8px;

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
           * MANAGEMENT
           * ==================================
           */

          .management-bee-group {
            display: flex;

            align-items: flex-end;
            justify-content: center;

            width: 100%;
          }

          .management-mini-bee {
            position: relative;

            width: 40px;
            height: 40px;

            margin: 0 -4px;
          }

          .management-mini-bee:nth-child(2) {
            transform:
              translateY(-8px);
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
          }

          .mini-bee-head {
            position: absolute;

            top: 16px;
            left: 2px;

            width: 18px;
            height: 18px;

            border-radius: 50%;

            background:
              #e7ae2f;
          }

          .mini-bee-wing {
            position: absolute;

            top: 6px;
            left: 15px;

            width: 20px;
            height: 16px;

            border-radius: 50%;

            background:
              #e5f7fa;
          }

          /*
           * ==================================
           * SHORT DESKTOP
           * ==================================
           */

          @media (
            max-height: 850px
          ) and (
            min-width: 1101px
          ) {
            .worker-left-panel {
              padding:
                2px 4px 3px;
            }

            .worker-right-panel {
              padding:
                3px 5px;
            }

            .bee-illustration {
              transform:
                scale(.78);

              animation: none;
            }

            .bee-streak-orbit {
              width: 84px;
              height: 62px;

              transform:
                scale(.78);
            }

            .bee-streak-orbit::before {
              width: 72px;
              height: 55px;
            }

            .management-bee-group {
              transform:
                scale(.82);
            }

            .worker-eyebrow {
              display: none;
            }

            .worker-title {
              font-size: .69rem;
            }

            .phlebotomy-core-grid {
              gap: 3px;

              margin-top: 3px;
            }

            .worker-value {
              min-height: 31px;

              padding:
                2px;
            }

            .worker-value span {
              font-size: .27rem;
            }

            .worker-value strong {
              margin-top: 1px;

              font-size: .65rem;
            }

            .activity-ribbon {
              gap: 4px;

              padding:
                3px 5px;
            }

            .activity-ribbon-label {
              font-size: .23rem;
            }

            .activity-ribbon-item span {
              font-size: .24rem;
            }

            .activity-ribbon-item strong {
              font-size: .49rem;
            }

            .worker-identity > strong {
              font-size: .76rem;
            }

            .identity-streak {
              min-height: 14px;

              margin-top: 2px;

              padding:
                1px 5px;
            }
          }

          @media (
            max-height: 720px
          ) and (
            min-width: 1101px
          ) {
            .bee-illustration {
              transform:
                scale(.68);
            }

            .bee-streak-orbit {
              width: 73px;
              height: 52px;

              transform:
                scale(.68);
            }

            .bee-streak-orbit::before {
              width: 64px;
              height: 48px;
            }

            .worker-heading {
              display: none;
            }

            .worker-value {
              min-height: 27px;
            }

            .activity-ribbon {
              padding:
                2px 4px;
            }

            .activity-ribbon-label {
              display: none;
            }

            .activity-ribbon {
              grid-template-columns:
                1fr;
            }
          }

          @media (
            max-width: 700px
          ) {
            .worker-main-row {
              grid-template-columns:
                1fr;
            }

            .worker-left-panel {
              border-right: 0;

              border-bottom:
                1px solid
                rgba(
                  188,
                  126,
                  17,
                  .22
                );
            }

            .activity-ribbon {
              grid-template-columns:
                1fr;
            }

            .activity-ribbon-label {
              border-right: 0;

              border-bottom:
                1px solid
                rgba(
                  154,
                  100,
                  11,
                  .18
                );

              padding-bottom: 3px;
            }
          }
        `}
      </style>
    </article>
  );
}

type WorkerValueProps = {
  label: string;
  value: string;

  emphasis?:
    | "gold"
    | "green"
    | "red";
};

function WorkerValue({
  label,
  value,
  emphasis = "gold",
}: WorkerValueProps) {
  return (
    <div
      className={`worker-value worker-value-${emphasis}`}
    >
      <span>
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