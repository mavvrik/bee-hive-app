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
    .16 +
      streak * .1,
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
              month:
                "short",
              day:
                "numeric",
            },
          )
      : null;

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
      }`}
      aria-label={`${name}, ${roleLabel}`}
    >
      <div className="card-shine" />

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

          <span>
            {roleLabel}
          </span>
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

          <small className="worker-description">
            {mode ===
            "phlebotomy"
              ? "Current weekly stick performance."
              : "Current weekly role-based performance."}
          </small>
        </div>

        {mode ===
        "phlebotomy" ? (
          <div className="worker-value-grid">
            <WorkerValue
              label="Successful Sticks"
              value={successfulSticks.toLocaleString(
                "en-US",
              )}
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
                successRate !== null &&
                successRate >= 90
                  ? "green"
                  : "gold"
              }
            />
          </div>
        ) : (
          <div
            className={`support-value-grid ${
              supportMetrics.length >=
              3
                ? "three-values"
                : ""
            }`}
          >
            {supportMetrics.map(
              (
                metric,
                index,
              ) => (
                <WorkerValue
                  key={`${metric.label}-${index}`}
                  label={
                    metric.label
                  }
                  value={
                    typeof metric.value ===
                    "number"
                      ? metric.value.toLocaleString(
                          "en-US",
                        )
                      : metric.value
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

        <div className="worker-message">
          <div className="message-bee">
            🐝
          </div>

          <p>
            One team. One Hive.
          </p>
        </div>
      </div>

      <style>
        {`
          .worker-bee-card {
            position: relative;

            display: grid;

            grid-template-columns:
              minmax(
                112px,
                .9fr
              )
              minmax(
                0,
                1.1fr
              );

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

            border-radius:
              17px;

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

          .card-shine {
            position: absolute;

            z-index: 1;

            top: -20px;
            right: -24px;

            width: 100px;
            height: 100px;

            border-radius:
              50%;

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

          .management-card {
            border-color:
              rgba(
                115,
                81,
                16,
                .62
              );
          }

          .worker-left-panel {
            position: relative;

            z-index: 2;

            display: flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              space-between;

            padding:
              7px 7px 8px;

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

            flex: 1;

            align-items:
              center;

            justify-content:
              center;

            width: 100%;
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

            border-radius:
              50%;

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

            place-items:
              center;

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

            border-radius:
              50%;

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

            width: 21px;
            height: 21px;

            place-items:
              center;

            border:
              2px solid
              #fffCDF;

            border-radius:
              50%;

            background:
              linear-gradient(
                145deg,
                #ffe16c,
                #e59415
              );

            color: #422403;

            font-size:
              .61rem;

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
            position: relative;

            z-index: 3;

            width: 100%;

            text-align:
              center;
          }

          .worker-identity strong {
            display: block;

            overflow: hidden;

            color: #422505;

            font-size:
              .86rem;

            font-weight: 1000;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .worker-identity span {
            display:
              inline-flex;

            margin-top: 4px;

            padding:
              3px 8px;

            border-radius:
              999px;

            background:
              #e5f1c6;

            color: #416126;

            font-size:
              .47rem;

            font-weight: 1000;

            text-transform:
              uppercase;
          }

          .worker-right-panel {
            position: relative;

            z-index: 2;

            display: flex;

            flex-direction:
              column;

            justify-content:
              center;

            min-width: 0;

            padding:
              9px 11px;
          }

          .worker-eyebrow {
            display: block;

            color: #a16d12;

            font-size:
              .43rem;

            font-weight: 1000;

            letter-spacing:
              .11em;

            text-transform:
              uppercase;
          }

          .worker-title {
            display: block;

            color: #3b2205;

            font-size:
              1rem;

            font-weight: 1000;
          }

          .worker-description {
            display: block;

            margin-top: 3px;

            color: #816532;

            font-size:
              .46rem;

            font-weight: 700;
          }

          .worker-value-grid,
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

            gap: 7px;

            margin-top: 8px;
          }

          .support-value-grid.three-values {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .worker-value {
            display: flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              center;

            min-height: 54px;

            padding:
              6px 5px;

            border:
              1px solid
              rgba(
                168,
                107,
                9,
                .23
              );

            border-radius:
              10px;

            background:
              linear-gradient(
                180deg,
                #fff,
                #ffedab
              );

            text-align:
              center;
          }

          .worker-value span {
            color: #8b6f37;

            font-size:
              .4rem;

            font-weight: 1000;

            line-height: 1.15;

            text-transform:
              uppercase;
          }

          .worker-value strong {
            margin-top: 4px;

            font-size:
              .9rem;

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

          .worker-message {
            display: flex;

            align-items:
              center;

            gap: 6px;

            margin-top: 7px;

            padding-top: 6px;

            border-top:
              1px solid
              rgba(
                184,
                123,
                18,
                .18
              );
          }

          .message-bee {
            font-size:
              .68rem;
          }

          .worker-message p {
            margin: 0;

            color: #735728;

            font-size:
              .44rem;

            font-weight: 900;
          }

          /*
           * BASE BEE
           */

          .bee-illustration {
            position: relative;

            width: 92px;
            height: 72px;

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
            position: absolute;

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

          /*
           * PRIMARY ROLE ACCESSORIES
           */

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
           * MANAGEMENT
           */

          .management-bee-group {
            display: flex;

            align-items:
              flex-end;

            justify-content:
              center;

            width: 100%;
          }

          .management-mini-bee {
            position: relative;

            width: 40px;
            height: 40px;

            margin:
              0 -4px;
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

            border-radius:
              50%;

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

            border-radius:
              50%;

            background:
              #e7ae2f;
          }

          .mini-bee-wing {
            position: absolute;

            top: 6px;
            left: 15px;

            width: 20px;
            height: 16px;

            border-radius:
              50%;

            background:
              #e5f7fa;
          }

          @media (
            max-width: 700px
          ) {
            .support-value-grid.three-values {
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
            key={
              index
            }
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