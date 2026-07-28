type MeadowProps = {
  dailyGoal: number;
  todayLiters: number;
};

export default function Meadow({
  dailyGoal,
  todayLiters,
}: MeadowProps) {
  const rawProgress =
    dailyGoal > 0 ? (todayLiters / dailyGoal) * 100 : 0;

  const progress = Math.min(
    Math.max(rawProgress, 0),
    100,
  );

  const totalFlowers = 12;

  const collectedFlowers = Math.min(
    Math.floor((progress / 100) * totalFlowers),
    totalFlowers,
  );

  const remainingLiters = Math.max(
    dailyGoal - todayLiters,
    0,
  );

  return (
    <section className="meadow-card">
      <header className="meadow-header">
        <div>
          <p className="meadow-eyebrow">
            Today&apos;s Opportunity
          </p>

          <h2>The Meadow</h2>

          <p className="meadow-description">
            Each flower represents part of today&apos;s
            production goal.
          </p>
        </div>

        <div className="meadow-progress">
          <strong>{progress.toFixed(1)}%</strong>
          <span>complete today</span>
        </div>
      </header>

      <div
        className="flower-field"
        aria-label={`${collectedFlowers} of ${totalFlowers} flowers collected`}
      >
        {Array.from({
          length: totalFlowers,
        }).map((_, index) => {
          const isCollected =
            index < collectedFlowers;

          return (
            <div
              className={`flower-plot ${
                isCollected
                  ? "flower-collected"
                  : "flower-available"
              }`}
              key={index}
            >
              <div className="flower">
                <div className="petal petal-one" />
                <div className="petal petal-two" />
                <div className="petal petal-three" />
                <div className="petal petal-four" />
                <div className="flower-center" />
              </div>

              <div className="stem" />

              <div className="leaf leaf-left" />
              <div className="leaf leaf-right" />

              <div className="grass-shadow" />
            </div>
          );
        })}
      </div>

      <div className="meadow-metrics">
        <Metric
          label="Today’s Liters"
          value={todayLiters}
        />

        <Metric
          label="Daily Goal"
          value={dailyGoal}
        />

        <Metric
          label="Remaining"
          value={remainingLiters}
        />
      </div>

      <style>
        {`
          .meadow-card {
            position: relative;
            overflow: hidden;
            margin-bottom: 32px;
            padding: 30px 26px 26px;
            border: 1px solid #c7dca4;
            border-radius: 28px;
            background:
              linear-gradient(
                180deg,
                #eef8ff 0%,
                #fffbed 40%,
                #dceeb7 72%,
                #a8cf74 100%
              );
            box-shadow:
              0 18px 42px rgba(72, 107, 38, 0.14),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .meadow-card::before {
            content: "";
            position: absolute;
            top: -75px;
            right: -55px;
            width: 210px;
            height: 210px;
            border-radius: 50%;
            background:
              radial-gradient(
                circle,
                rgba(255, 231, 119, 0.92) 0%,
                rgba(255, 231, 119, 0.3) 48%,
                transparent 72%
              );
          }

          .meadow-header {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 28px;
          }

          .meadow-eyebrow {
            margin: 0;
            color: #5f7f33;
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .meadow-header h2 {
            margin: 7px 0 5px;
            color: #294019;
            font-size: clamp(1.75rem, 4vw, 2.25rem);
          }

          .meadow-description {
            margin: 0;
            color: #60714c;
            font-size: 0.94rem;
          }

          .meadow-progress {
            min-width: 140px;
            padding: 14px 16px;
            border: 1px solid rgba(93, 128, 45, 0.24);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.7);
            text-align: center;
            backdrop-filter: blur(8px);
          }

          .meadow-progress strong {
            display: block;
            color: #35531f;
            font-size: 1.55rem;
          }

          .meadow-progress span {
            display: block;
            margin-top: 3px;
            color: #71805d;
            font-size: 0.76rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          .flower-field {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns:
              repeat(auto-fit, minmax(72px, 1fr));
            align-items: end;
            gap: 18px 14px;
            min-height: 210px;
            padding: 28px 20px 18px;
            border-radius: 24px;
            background:
              linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.23),
                rgba(92, 146, 52, 0.18)
              );
          }

          .flower-plot {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            min-height: 145px;
            transition:
              opacity 350ms ease,
              transform 350ms ease,
              filter 350ms ease;
          }

          .flower {
            position: absolute;
            top: 11px;
            left: 50%;
            width: 48px;
            height: 48px;
            transform: translateX(-50%);
          }

          .petal {
            position: absolute;
            left: 15px;
            top: 2px;
            width: 18px;
            height: 28px;
            border-radius: 70% 70% 55% 55%;
            background:
              linear-gradient(
                180deg,
                #fffdf7,
                #f5d95a
              );
            transform-origin: 50% 22px;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.85),
              0 3px 5px rgba(91, 68, 9, 0.12);
          }

          .petal-one {
            transform: rotate(0deg);
          }

          .petal-two {
            transform: rotate(90deg);
          }

          .petal-three {
            transform: rotate(180deg);
          }

          .petal-four {
            transform: rotate(270deg);
          }

          .flower-center {
            position: absolute;
            top: 15px;
            left: 15px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background:
              radial-gradient(
                circle at 35% 30%,
                #fff49a,
                #d9930b 72%
              );
            box-shadow:
              0 2px 4px rgba(83, 55, 3, 0.22);
          }

          .stem {
            position: absolute;
            top: 49px;
            width: 6px;
            height: 78px;
            border-radius: 8px;
            background:
              linear-gradient(
                90deg,
                #4f8b32,
                #79ae4b,
                #3f7627
              );
          }

          .leaf {
            position: absolute;
            top: 86px;
            width: 26px;
            height: 13px;
            background: #65983e;
          }

          .leaf-left {
            left: calc(50% - 28px);
            border-radius: 90% 10% 90% 10%;
            transform: rotate(20deg);
          }

          .leaf-right {
            right: calc(50% - 28px);
            border-radius: 10% 90% 10% 90%;
            transform: rotate(-20deg);
          }

          .grass-shadow {
            width: 55px;
            height: 12px;
            border-radius: 50%;
            background: rgba(48, 84, 27, 0.19);
            filter: blur(1px);
          }

          .flower-available {
            opacity: 1;
          }

          .flower-collected {
            opacity: 0.28;
            filter: grayscale(0.75);
            transform: translateY(8px) scale(0.88);
          }

          .flower-collected .flower {
            transform:
              translateX(-50%)
              rotate(9deg);
          }

          .meadow-metrics {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns:
              repeat(auto-fit, minmax(165px, 1fr));
            gap: 13px;
            margin-top: 18px;
          }

          .meadow-metric {
            padding: 15px 14px;
            border: 1px solid rgba(97, 132, 50, 0.24);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.7);
            text-align: center;
            backdrop-filter: blur(8px);
          }

          .meadow-metric-label {
            margin: 0 0 6px;
            color: #71805d;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .meadow-metric-value {
            color: #294019;
            font-size: 1.24rem;
          }

          @media (max-width: 650px) {
            .meadow-card {
              padding: 24px 14px 20px;
            }

            .meadow-header {
              flex-direction: column;
            }

            .meadow-progress {
              width: 100%;
            }

            .flower-field {
              grid-template-columns:
                repeat(4, minmax(55px, 1fr));
              padding-left: 8px;
              padding-right: 8px;
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
    <div className="meadow-metric">
      <p className="meadow-metric-label">
        {label}
      </p>

      <strong className="meadow-metric-value">
        {value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        L
      </strong>
    </div>
  );
}