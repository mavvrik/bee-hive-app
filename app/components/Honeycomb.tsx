type HoneycombProps = {
  name: string;
  currentLiters: number;
  targetLiters: number;
  isTopWorker?: boolean;
};

export default function Honeycomb({
  name,
  currentLiters,
  targetLiters,
  isTopWorker = false,
}: HoneycombProps) {
  const rawPercentage =
    targetLiters > 0 ? (currentLiters / targetLiters) * 100 : 0;

  const percentage = Math.max(0, Math.min(rawPercentage, 100));

  return (
    <article
      className={`honeycomb-card ${
        isTopWorker ? "top-worker" : ""
      }`}
    >
      {isTopWorker && (
        <div className="top-worker-badge">
          🏆 Top Worker
        </div>
      )}

      <div className="honeycomb-wrapper">
        <div
          className="honey-fill"
          style={{
            height: `${percentage}%`,
          }}
        />

        <div className="honeycomb-content">
          <strong>{Math.round(rawPercentage)}%</strong>
          <span>of target</span>
        </div>
      </div>

      <div className="collector-details">
        <h3>{name}</h3>

        <p>
          <strong>{currentLiters.toFixed(1)} L</strong>
          <span> collected</span>
        </p>

        <p className="target">
          Target: {targetLiters.toFixed(1)} L
        </p>
      </div>

      <style>
        {`
          .honeycomb-card {
            position: relative;
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
            padding: 12px;
            border: 1px solid #dfc36c;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.88);
            box-shadow: 0 8px 18px rgba(84, 58, 8, 0.1);
          }

          .honeycomb-card.top-worker {
            border: 2px solid #d99b0b;
            background:
              linear-gradient(
                135deg,
                rgba(255, 249, 218, 0.98),
                rgba(255, 226, 121, 0.9)
              );
            box-shadow:
              0 0 0 4px rgba(217, 155, 11, 0.12),
              0 12px 24px rgba(84, 58, 8, 0.16);
          }

          .top-worker-badge {
            position: absolute;
            top: -11px;
            right: 10px;
            z-index: 3;
            padding: 5px 9px;
            border-radius: 999px;
            background: #3a2908;
            color: #ffe784;
            font-size: 0.65rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .honeycomb-wrapper {
            position: relative;
            flex: 0 0 92px;
            width: 92px;
            height: 80px;
            overflow: hidden;
            clip-path: polygon(
              25% 0%,
              75% 0%,
              100% 50%,
              75% 100%,
              25% 100%,
              0% 50%
            );
            background:
              linear-gradient(
                180deg,
                #fff8d7,
                #f3ddb0
              );
            box-shadow:
              inset 0 0 0 4px #b87d0b;
          }

          .honeycomb-wrapper::after {
            content: "";
            position: absolute;
            inset: 5px;
            z-index: 2;
            clip-path: polygon(
              25% 0%,
              75% 0%,
              100% 50%,
              75% 100%,
              25% 100%,
              0% 50%
            );
            border: 1px solid rgba(125, 82, 6, 0.35);
            pointer-events: none;
          }

          .honey-fill {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 1;
            min-height: 0;
            background:
              linear-gradient(
                180deg,
                #ffd54a 0%,
                #eca20c 55%,
                #c97605 100%
              );
            transition: height 700ms ease;
          }

          .honey-fill::before {
            content: "";
            position: absolute;
            top: -5px;
            right: 0;
            left: 0;
            height: 10px;
            border-radius: 50%;
            background: rgba(255, 231, 111, 0.95);
          }

          .honeycomb-content {
            position: absolute;
            inset: 0;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #352304;
            text-align: center;
            text-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);
          }

          .honeycomb-content strong {
            font-size: 1.25rem;
            line-height: 1;
          }

          .honeycomb-content span {
            margin-top: 3px;
            font-size: 0.62rem;
            font-weight: 800;
            text-transform: uppercase;
          }

          .collector-details {
            min-width: 0;
          }

          .collector-details h3 {
            margin: 0 0 5px;
            overflow: hidden;
            color: #392806;
            font-size: 1rem;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .collector-details p {
            margin: 0;
            color: #5e4a22;
            font-size: 0.78rem;
          }

          .collector-details p strong {
            color: #3b2908;
            font-size: 0.92rem;
          }

          .collector-details .target {
            margin-top: 3px;
            color: #8a713d;
            font-size: 0.7rem;
          }

          @media (max-width: 900px) {
            .honeycomb-wrapper {
              flex-basis: 78px;
              width: 78px;
              height: 68px;
            }

            .honeycomb-card {
              gap: 10px;
              padding: 10px;
            }
          }
        `}
      </style>
    </article>
  );
}