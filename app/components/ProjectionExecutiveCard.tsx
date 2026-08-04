type ProjectionExecutiveCardProps = {
  currentLiters: number;
  projectedFinish: number;
  dailyGoal: number;
  confidence: number;
  projectedVariance: number;
  additionalDonorsNeeded: number;
  currentHourlyPace: number;
  hoursRemaining: number;
};

function formatLiters(value: number) {
  return `${value.toFixed(1)} L`;
}

export default function ProjectionExecutiveCard({
  currentLiters,
  projectedFinish,
  dailyGoal,
  confidence,
  projectedVariance,
  additionalDonorsNeeded,
  currentHourlyPace,
  hoursRemaining,
}: ProjectionExecutiveCardProps) {
  const status =
    projectedVariance >= 5
      ? "AHEAD"
      : projectedVariance >= 0
        ? "ON_TRACK"
        : "AT_RISK";

  const statusLabel =
    status === "AHEAD"
      ? "Ahead of Goal"
      : status === "ON_TRACK"
        ? "On Track"
        : "Goal at Risk";

  return (
    <section
      className={`projection-card projection-card--${status.toLowerCase()}`}
    >
      <header className="projection-card__header">
        <div>
          <p className="projection-card__eyebrow">
            Today&apos;s Forecast
          </p>

          <h2>
            Projected Center Finish
          </h2>
        </div>

        <div className="projection-card__status">
          <span>{statusLabel}</span>

          <strong>
            {projectedVariance >= 0
              ? "+"
              : ""}
            {formatLiters(projectedVariance)}
          </strong>
        </div>
      </header>

      <div className="projection-card__primary">
        <div className="projection-card__finish">
          <span>Projected Finish</span>

          <strong>
            {formatLiters(projectedFinish)}
          </strong>

          <small>
            Daily goal: {formatLiters(dailyGoal)}
          </small>
        </div>

        <div className="projection-card__confidence">
          <div
            className="projection-card__confidence-ring"
            style={{
              background: `conic-gradient(
                #d99b0b ${confidence}%,
                #f1e8c9 ${confidence}% 100%
              )`,
            }}
          >
            <div>
              <strong>{confidence}%</strong>
              <span>Confidence</span>
            </div>
          </div>
        </div>
      </div>

      <div className="projection-card__metrics">
        <article>
          <span>Current Production</span>
          <strong>
            {formatLiters(currentLiters)}
          </strong>
        </article>

        <article>
          <span>Current Pace</span>
          <strong>
            {formatLiters(currentHourlyPace)}
            /hr
          </strong>
        </article>

        <article>
          <span>Hours Remaining</span>
          <strong>
            {hoursRemaining.toFixed(1)}
          </strong>
        </article>

        <article>
          <span>Additional Donors Needed</span>
          <strong>
            {additionalDonorsNeeded}
          </strong>
        </article>
      </div>

      <style>
        {`
          .projection-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
            height: 100%;
            padding: 15px 17px;
            overflow: hidden;
            border: 1px solid #d9bd64;
            border-radius: 20px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.99),
                rgba(255, 247, 214, 0.98)
              );
            box-shadow:
              0 12px 28px
              rgba(92, 63, 4, 0.14);
            box-sizing: border-box;
          }

          .projection-card--ahead {
            border-color: #7ca65b;
          }

          .projection-card--on_track {
            border-color: #d9bd64;
          }

          .projection-card--at_risk {
            border-color: #c96a5d;
          }

          .projection-card__header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
          }

          .projection-card__eyebrow {
            margin: 0 0 4px;
            color: #9a6d10;
            font-size: 0.65rem;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .projection-card__header h2 {
            margin: 0;
            color: #3d2a08;
            font-size: clamp(
              1.15rem,
              1.45vw,
              1.55rem
            );
            line-height: 1;
          }

          .projection-card__status {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            min-width: 120px;
            padding: 7px 10px;
            border-radius: 12px;
            background: rgba(
              255,
              255,
              255,
              0.66
            );
          }

          .projection-card__status span {
            color: #765715;
            font-size: 0.58rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .projection-card__status strong {
            color: #332304;
            font-size: 1rem;
          }

          .projection-card__primary {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr) 118px;
            align-items: center;
            gap: 14px;
          }

          .projection-card__finish {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
          }

          .projection-card__finish span {
            color: #7f641e;
            font-size: 0.68rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .projection-card__finish strong {
            margin-top: 4px;
            color: #2f2105;
            font-size: clamp(
              2.2rem,
              3.6vw,
              3.6rem
            );
            line-height: 0.95;
          }

          .projection-card__finish small {
            margin-top: 6px;
            color: #74591a;
            font-size: 0.72rem;
            font-weight: 700;
          }

          .projection-card__confidence {
            display: flex;
            justify-content: center;
          }

          .projection-card__confidence-ring {
            display: grid;
            width: 104px;
            height: 104px;
            place-items: center;
            border-radius: 50%;
          }

          .projection-card__confidence-ring > div {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            width: 78px;
            height: 78px;
            border-radius: 50%;
            background: #fffdf5;
          }

          .projection-card__confidence-ring strong {
            color: #382705;
            font-size: 1.25rem;
            line-height: 1;
          }

          .projection-card__confidence-ring span {
            margin-top: 4px;
            color: #8a681a;
            font-size: 0.5rem;
            font-weight: 900;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .projection-card__metrics {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 8px;
          }

          .projection-card__metrics article {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
            min-height: 56px;
            padding: 7px 9px;
            border: 1px solid
              rgba(203, 162, 58, 0.35);
            border-radius: 11px;
            background:
              rgba(255, 255, 255, 0.63);
          }

          .projection-card__metrics span {
            overflow: hidden;
            color: #866a25;
            font-size: 0.5rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-overflow: ellipsis;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .projection-card__metrics strong {
            margin-top: 4px;
            overflow: hidden;
            color: #382705;
            font-size: 0.92rem;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          @media (max-width: 900px) {
            .projection-card__metrics {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 620px) {
            .projection-card__header {
              flex-direction: column;
            }

            .projection-card__status {
              align-items: flex-start;
              width: 100%;
            }

            .projection-card__primary {
              grid-template-columns: 1fr;
            }

            .projection-card__confidence {
              justify-content: flex-start;
            }

            .projection-card__metrics {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </section>
  );
}