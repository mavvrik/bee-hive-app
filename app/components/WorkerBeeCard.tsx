import type {
  CSSProperties,
} from "react";

type WorkerBeeCardProps = {
  name: string;
  roleLabel: string;

  successfulSticks: number;
  successRate: number | null;

  varianceFreeStreak: number;
  streakVerifiedThrough: Date | null;

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
    0.16 +
      streak * 0.1,
  );
}

export default function WorkerBeeCard({
  name,
  roleLabel,

  successfulSticks,
  successRate,

  varianceFreeStreak,
  streakVerifiedThrough,

  isManagement = false,
  isPhlebotomist = false,
}: WorkerBeeCardProps) {
  const streakIntensity =
    getStreakIntensity(
      varianceFreeStreak,
    );

  const hasActiveStreak =
    isPhlebotomist &&
    varianceFreeStreak > 0;

  const streakStyle =
    hasActiveStreak
      ? ({
          "--streak-opacity":
            String(
              0.34 +
                streakIntensity *
                  0.5,
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

          "--streak-scale": String(
            1 +
              streakIntensity *
                0.045,
          ),
        } as CSSProperties)
      : undefined;

  const verifiedDateLabel =
    streakVerifiedThrough
      ? streakVerifiedThrough.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
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
      } ${
        isPhlebotomist
          ? "phleb-card"
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
              <BeeIllustration />

              <span
                className="streak-count-badge"
                aria-label={`${varianceFreeStreak} day variance-free streak`}
              >
                {
                  varianceFreeStreak
                }
              </span>
            </div>
          ) : (
            <BeeIllustration />
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
            {isManagement
              ? "Hive Leadership"
              : "Weekly Performance"}
          </strong>

          <small className="worker-description">
            {isManagement
              ? "Supporting the team and moving the Hive forward."
              : "Current weekly stick performance."}
          </small>
        </div>

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
              minmax(112px, 0.9fr)
              minmax(0, 1.1fr);

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(
                175,
                111,
                10,
                0.46
              );

            border-radius:
              17px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  254,
                  242,
                  0.99
                ),
                rgba(
                  255,
                  245,
                  203,
                  0.98
                )
              );

            box-shadow:
              0 7px 16px
              rgba(
                99,
                61,
                4,
                0.15
              ),
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.94
              );

            box-sizing:
              border-box;
          }

          .worker-bee-card::after {
            content: "";

            position: absolute;

            inset: 0;

            z-index: 0;

            border-radius:
              inherit;

            background:
              radial-gradient(
                circle at
                16% 20%,
                rgba(
                  255,
                  219,
                  91,
                  0.18
                ),
                transparent
                30%
              );

            pointer-events:
              none;
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
                0.5
              );

            filter:
              blur(
                22px
              );

            pointer-events:
              none;
          }

          .worker-bee-card.management-card {
            border-color:
              rgba(
                115,
                81,
                16,
                0.62
              );

            background:
              linear-gradient(
                145deg,
                #fffdf0,
                #efdaa2
              );
          }

          .worker-bee-card.phleb-card {
            border-color:
              rgba(
                204,
                132,
                15,
                0.58
              );
          }

          /*
           * ====================================
           * LEFT PANEL
           * ====================================
           */

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

            min-width: 0;
            min-height: 0;

            padding:
              7px 7px 8px;

            border-right:
              1px solid
              rgba(
                188,
                126,
                17,
                0.22
              );

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  251,
                  221,
                  0.98
                ),
                rgba(
                  243,
                  209,
                  108,
                  0.35
                )
              );
          }

          .worker-left-panel::before {
            content: "";

            position: absolute;

            inset: 0;

            opacity: 0.1;

            background-image:
              linear-gradient(
                30deg,
                #ba7910 12%,
                transparent 12.5%,
                transparent 87%,
                #ba7910 87.5%
              ),
              linear-gradient(
                150deg,
                #ba7910 12%,
                transparent 12.5%,
                transparent 87%,
                #ba7910 87.5%
              );

            background-size:
              24px 42px;

            pointer-events:
              none;
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

            min-height: 0;
          }

          .bee-stage-glow {
            position: absolute;

            top: 50%;
            left: 50%;

            width: 88px;
            height: 58px;

            border-radius:
              50%;

            transform:
              translate(
                -50%,
                -50%
              );

            background:
              radial-gradient(
                ellipse,
                rgba(
                  255,
                  218,
                  104,
                  0.34
                ),
                transparent
                68%
              );

            filter:
              blur(
                6px
              );
          }

          /*
           * ====================================
           * STREAK RING
           * ====================================
           */

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

            transition:
              transform
              450ms ease;
          }

          .bee-streak-orbit::before {
            content: "";

            position: absolute;

            z-index: 0;

            top: 50%;
            left: 50%;

            width: 87px;
            height: 68px;

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
                  0.5
                )
              );

            border-radius:
              50%;

            transform:
              translate(
                -50%,
                -50%
              );

            background:
              radial-gradient(
                ellipse,
                rgba(
                  255,
                  229,
                  124,
                  calc(
                    var(
                        --streak-opacity,
                        0.5
                      ) *
                      0.14
                  )
                ),
                transparent
                62%
              );

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
                  0.5
                )
              ),
              0 0 18px
              rgba(
                255,
                213,
                74,
                calc(
                  var(
                      --streak-opacity,
                      0.5
                    ) *
                    0.52
                )
              ),
              inset
              0 0 14px
              rgba(
                255,
                226,
                107,
                calc(
                  var(
                      --streak-opacity,
                      0.5
                    ) *
                    0.5
                )
              );

            animation:
              streakRingPulse
              2.3s
              ease-in-out
              infinite;

            pointer-events:
              none;
          }

          .bee-streak-orbit::after {
            content: "";

            position: absolute;

            z-index: 0;

            top: 50%;
            left: 50%;

            width: 72px;
            height: 54px;

            border-radius:
              50%;

            transform:
              translate(
                -50%,
                -50%
              );

            background:
              radial-gradient(
                ellipse,
                rgba(
                  255,
                  202,
                  55,
                  calc(
                    var(
                        --streak-opacity,
                        0.5
                      ) *
                      0.24
                  )
                ),
                transparent
                67%
              );
          }

          .bee-streak-orbit
          .bee-illustration {
            z-index: 2;
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
              rgba(
                255,
                252,
                223,
                0.98
              );

            border-radius:
              50%;

            background:
              linear-gradient(
                145deg,
                #ffe16c,
                #e59415
              );

            color:
              #422403;

            font-size:
              0.61rem;

            font-weight:
              1000;

            line-height: 1;

            box-shadow:
              0 3px 7px
              rgba(
                87,
                51,
                3,
                0.28
              ),
              0 0 10px
              rgba(
                246,
                161,
                20,
                0.55
              );

            transition:
              transform
              300ms ease,
              box-shadow
              300ms ease;
          }

          /*
           * ====================================
           * BEEZY RECOGNITION
           * ====================================
           */

          .worker-bee-card.beezy-highlight
          .bee-streak-orbit::before {
            border-color:
              rgba(
                255,
                188,
                31,
                1
              );

            box-shadow:
              0 0 36px 9px
              rgba(
                255,
                151,
                16,
                0.78
              ),
              0 0 60px 18px
              rgba(
                255,
                218,
                66,
                0.44
              ),
              inset
              0 0 20px
              rgba(
                255,
                231,
                120,
                0.76
              );

            animation:
              beezyStreakCelebration
              0.75s
              ease-in-out
              infinite;
          }

          .worker-bee-card.beezy-highlight
          .streak-count-badge {
            transform:
              scale(
                1.22
              );

            box-shadow:
              0 0 18px
              rgba(
                255,
                140,
                12,
                0.92
              );
          }

          @keyframes beezyStreakCelebration {
            0%,
            100% {
              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(
                  1
                );
            }

            50% {
              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(
                  1.12
                );
            }
          }

          @keyframes streakRingPulse {
            0%,
            100% {
              opacity: 0.82;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(
                  0.98
                );
            }

            50% {
              opacity: 1;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(
                  1.045
                );
            }
          }

          /*
           * ====================================
           * WORKER IDENTITY
           * ====================================
           */

          .worker-identity {
            position: relative;

            z-index: 3;

            flex: 0 0 auto;

            width: 100%;

            text-align:
              center;
          }

          .worker-identity strong {
            display: block;

            overflow:
              hidden;

            color:
              #422505;

            font-size:
              0.86rem;

            font-weight:
              1000;

            line-height: 1.02;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .worker-identity span {
            display:
              inline-flex;

            align-items:
              center;

            justify-content:
              center;

            max-width: 100%;

            margin-top: 4px;

            padding:
              3px 8px;

            overflow:
              hidden;

            border:
              1px solid
              rgba(
                79,
                119,
                40,
                0.24
              );

            border-radius:
              999px;

            background:
              linear-gradient(
                145deg,
                #f1f7dd,
                #dfefbd
              );

            color:
              #416126;

            font-size:
              0.47rem;

            font-weight:
              1000;

            line-height: 1;

            text-overflow:
              ellipsis;

            text-transform:
              uppercase;

            white-space:
              nowrap;
          }

          /*
           * ====================================
           * RIGHT PANEL
           * ====================================
           */

          .worker-right-panel {
            position: relative;

            z-index: 2;

            display: flex;

            flex-direction:
              column;

            justify-content:
              center;

            min-width: 0;
            min-height: 0;

            padding:
              9px 11px;
          }

          .worker-heading {
            min-width: 0;
          }

          .worker-eyebrow {
            display: block;

            margin-bottom:
              2px;

            color:
              #a16d12;

            font-size:
              0.43rem;

            font-weight:
              1000;

            letter-spacing:
              0.11em;

            text-transform:
              uppercase;
          }

          .worker-title {
            display: block;

            overflow:
              hidden;

            color:
              #3b2205;

            font-size:
              clamp(
                0.92rem,
                1.05vw,
                1.12rem
              );

            font-weight:
              1000;

            line-height: 1.05;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .worker-description {
            display: block;

            margin-top:
              3px;

            color:
              #816532;

            font-size:
              0.46rem;

            font-weight: 700;

            line-height: 1.22;
          }

          /*
           * ====================================
           * METRICS
           * ====================================
           */

          .worker-value-grid {
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

            margin-top:
              8px;
          }

          .worker-value {
            position: relative;

            display: flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              center;

            min-width: 0;

            min-height:
              54px;

            padding:
              6px 5px;

            overflow:
              hidden;

            border:
              1px solid
              rgba(
                168,
                107,
                9,
                0.23
              );

            border-radius:
              10px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  0.9
                ),
                rgba(
                  255,
                  237,
                  171,
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
                0.84
              );

            text-align:
              center;

            box-sizing:
              border-box;
          }

          .worker-value::before {
            content: "";

            position: absolute;

            top: 0;
            left: 15%;

            width: 70%;
            height: 2px;

            border-radius:
              999px;

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(
                  222,
                  148,
                  20,
                  0.7
                ),
                transparent
              );
          }

          .worker-value span {
            display: block;

            color:
              #8b6f37;

            font-size:
              0.4rem;

            font-weight:
              1000;

            letter-spacing:
              0.05em;

            line-height: 1.15;

            text-transform:
              uppercase;
          }

          .worker-value strong {
            display: block;

            max-width: 100%;

            margin-top:
              4px;

            overflow:
              hidden;

            font-size:
              clamp(
                0.8rem,
                0.95vw,
                1rem
              );

            font-weight:
              1000;

            line-height: 1;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .worker-value-gold strong {
            color:
              #8b5708;
          }

          .worker-value-green strong {
            color:
              #477728;
          }

          /*
           * ====================================
           * MESSAGE
           * ====================================
           */

          .worker-message {
            display: flex;

            align-items:
              center;

            gap: 6px;

            margin-top:
              7px;

            padding-top:
              6px;

            border-top:
              1px solid
              rgba(
                184,
                123,
                18,
                0.18
              );
          }

          .message-bee {
            display: grid;

            flex:
              0 0 auto;

            width: 18px;
            height: 18px;

            place-items:
              center;

            border-radius:
              50%;

            background:
              rgba(
                244,
                183,
                45,
                0.16
              );

            font-size:
              0.68rem;
          }

          .worker-message p {
            margin: 0;

            overflow:
              hidden;

            color:
              #735728;

            font-size:
              0.44rem;

            font-weight:
              900;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          /*
           * ====================================
           * NORTH STAR BEE
           * ====================================
           */

          .bee-illustration {
            position: relative;

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

            overflow:
              hidden;

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

            border-radius:
              48%;

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

            border-radius:
              50%;
          }

          .bee-eye {
            position: absolute;

            top: 10px;

            width: 5px;
            height: 6px;

            border-radius:
              50%;

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
              rotate(
                -18deg
              );
          }

          .bee-wing-right {
            left: 48px;

            transform:
              rotate(
                20deg
              );
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

            border-radius:
              50%;

            background:
              #4a3209;
          }

          .bee-antenna-left {
            left: 12px;

            transform:
              rotate(
                -34deg
              );
          }

          .bee-antenna-right {
            left: 27px;

            transform:
              rotate(
                28deg
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

            align-items:
              flex-end;

            justify-content:
              center;

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
              translateY(
                -8px
              )
              scale(
                1.08
              );
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

            border-radius:
              50%;

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

            border-radius:
              50%;

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
           * RESPONSIVE
           * ====================================
           */

          @media (
            max-width: 1250px
          ) {
            .worker-bee-card {
              grid-template-columns:
                minmax(
                  100px,
                  0.82fr
                )
                minmax(
                  0,
                  1.18fr
                );
            }

            .bee-illustration {
              transform:
                scale(
                  0.93
                );
            }
          }

          @media (
            max-width: 700px
          ) {
            .worker-bee-card {
              grid-template-columns:
                minmax(
                  104px,
                  0.84fr
                )
                minmax(
                  0,
                  1.16fr
                );
            }

            .worker-value-grid {
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
            .management-bee-group,
            .bee-streak-orbit::before {
              animation: none;
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
    | "green";
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

function BeeIllustration() {
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