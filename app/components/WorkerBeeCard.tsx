type WorkerBeeCardProps = {
  name: string;
  roleLabel: string;
  isManagement?: boolean;
};

export default function WorkerBeeCard({
  name,
  roleLabel,
  isManagement = false,
}: WorkerBeeCardProps) {
  return (
    <article
      className={`worker-bee-card ${
        isManagement
          ? "management-card"
          : ""
      }`}
      aria-label={`${name}, ${roleLabel}`}
    >
      <div className="worker-left-panel">
        <div className="worker-bee-stage">
          {isManagement ? (
            <ManagementBees />
          ) : (
            <BeeIllustration />
          )}
        </div>

        <div className="worker-identity">
          <strong>{name}</strong>

          <span>{roleLabel}</span>
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
              : "Part of the Hive"}
          </strong>

          <small className="worker-description">
            {isManagement
              ? "Supporting the team, donor experience, and center performance."
              : "Every interaction and every successful contribution helps move the Hive forward."}
          </small>
        </div>

        <div className="worker-value-grid">
          <WorkerValue
            label="Team"
            value="Riviera Beach"
          />

          <WorkerValue
            label="Status"
            value="Active"
          />
        </div>

        <div className="worker-message">
          <span>🐝</span>

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
              minmax(105px, 0.85fr)
              minmax(0, 1.15fr);

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(202, 163, 56, 0.56);

            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.98),
                rgba(255, 249, 224, 0.92)
              );

            box-shadow:
              0 5px 12px
                rgba(94, 66, 8, 0.07),
              inset 0 1px 0
                rgba(255, 255, 255, 0.9);

            box-sizing: border-box;
          }

          .worker-bee-card.management-card {
            border-color:
              rgba(142, 111, 30, 0.62);

            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.98),
                rgba(246, 231, 174, 0.94)
              );
          }

          .worker-left-panel {
            display: flex;

            flex-direction: column;

            align-items: center;
            justify-content:
              space-between;

            min-width: 0;
            min-height: 0;

            padding: 7px 6px 8px;

            border-right:
              1px solid
              rgba(203, 165, 59, 0.25);

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  251,
                  230,
                  0.9
                ),
                rgba(
                  243,
                  220,
                  139,
                  0.28
                )
              );
          }

          .worker-bee-stage {
            display: flex;

            flex: 1;

            align-items: center;
            justify-content: center;

            width: 100%;

            min-height: 0;
          }

          .worker-identity {
            flex: 0 0 auto;

            width: 100%;

            text-align: center;
          }

          .worker-identity strong {
            display: block;

            overflow: hidden;

            color: #392706;

            font-size: 0.82rem;
            line-height: 1.05;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-identity span {
            display: inline-flex;

            align-items: center;
            justify-content: center;

            max-width: 100%;

            margin-top: 4px;
            padding: 3px 7px;

            overflow: hidden;

            border:
              1px solid
              rgba(
                85,
                131,
                42,
                0.22
              );

            border-radius: 999px;

            background: #edf5d9;

            color: #466527;

            font-size: 0.49rem;
            font-weight: 900;
            line-height: 1;

            text-overflow: ellipsis;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .worker-right-panel {
            display: flex;

            flex-direction: column;

            justify-content: center;

            min-width: 0;
            min-height: 0;

            padding: 9px 11px;
          }

          .worker-heading {
            min-width: 0;
          }

          .worker-eyebrow {
            display: block;

            margin-bottom: 3px;

            color: #9a6d10;

            font-size: 0.45rem;
            font-weight: 900;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .worker-title {
            display: block;

            overflow: hidden;

            color: #342406;

            font-size: clamp(
              0.9rem,
              1.05vw,
              1.1rem
            );

            line-height: 1.05;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-description {
            display: block;

            margin-top: 4px;

            color: #7e6b43;

            font-size: 0.48rem;
            font-weight: 700;
            line-height: 1.25;
          }

          .worker-value-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 7px;

            margin-top: 9px;
          }

          .worker-value {
            display: flex;

            flex-direction: column;

            align-items: center;
            justify-content: center;

            min-width: 0;
            min-height: 55px;

            padding: 7px 5px;

            border:
              1px solid
              rgba(
                189,
                151,
                45,
                0.25
              );

            border-radius: 9px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  0.86
                ),
                rgba(
                  255,
                  244,
                  198,
                  0.66
                )
              );

            text-align: center;

            box-sizing: border-box;
          }

          .worker-value span {
            display: block;

            color: #897341;

            font-size: 0.42rem;
            font-weight: 900;

            letter-spacing: 0.05em;
            line-height: 1.15;

            text-transform: uppercase;
          }

          .worker-value strong {
            display: block;

            max-width: 100%;

            margin-top: 5px;

            overflow: hidden;

            color: #3b2a08;

            font-size: clamp(
              0.65rem,
              0.78vw,
              0.84rem
            );

            line-height: 1;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-message {
            display: flex;

            align-items: center;

            gap: 5px;

            margin-top: 7px;
            padding-top: 6px;

            border-top:
              1px solid
              rgba(
                194,
                158,
                57,
                0.2
              );
          }

          .worker-message span {
            flex: 0 0 auto;

            font-size: 0.72rem;
          }

          .worker-message p {
            margin: 0;

            overflow: hidden;

            color: #776136;

            font-size: 0.46rem;
            font-weight: 800;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /*
           * ==========================================
           * INDIVIDUAL BEE
           * ==========================================
           */

          .bee-illustration {
            position: relative;

            width: 82px;
            height: 60px;

            animation:
              workerBeeFloat
              4.4s ease-in-out infinite;
          }

          @keyframes workerBeeFloat {
            0%,
            100% {
              transform:
                translateY(2px);
            }

            50% {
              transform:
                translateY(-4px);
            }
          }

          .bee-body {
            position: absolute;

            top: 22px;
            left: 18px;

            width: 50px;
            height: 28px;

            overflow: hidden;

            border:
              3px solid #5c430e;

            border-radius:
              50% 55% 55% 50%;

            background:
              repeating-linear-gradient(
                90deg,
                #f3bc28 0 10px,
                #4b360d 10px 17px
              );

            box-shadow:
              0 5px 8px
                rgba(
                  83,
                  58,
                  8,
                  0.14
                );
          }

          .bee-head {
            position: absolute;
            z-index: 3;

            top: 21px;
            left: 8px;

            width: 29px;
            height: 29px;

            border:
              3px solid #5c430e;

            border-radius: 50%;

            background:
              radial-gradient(
                circle at 35% 28%,
                #ffe486,
                #e2a91e 72%
              );
          }

          .bee-eye {
            position: absolute;

            top: 10px;

            width: 4px;
            height: 5px;

            border-radius: 50%;

            background: #2f250d;
          }

          .bee-eye-left {
            left: 7px;
          }

          .bee-eye-right {
            right: 7px;
          }

          .bee-wing {
            position: absolute;
            z-index: 1;

            top: 5px;

            width: 31px;
            height: 27px;

            border:
              2px solid
              rgba(
                99,
                126,
                139,
                0.42
              );

            border-radius:
              60% 60% 48% 48%;

            background:
              rgba(
                222,
                244,
                250,
                0.68
              );
          }

          .bee-wing-left {
            left: 28px;

            transform:
              rotate(-15deg);
          }

          .bee-wing-right {
            left: 46px;

            transform:
              rotate(18deg);
          }

          .bee-antenna {
            position: absolute;
            z-index: 4;

            top: 13px;

            width: 17px;
            height: 13px;

            border-top:
              2px solid #4b360d;
          }

          .bee-antenna-left {
            left: 11px;

            transform:
              rotate(-32deg);
          }

          .bee-antenna-right {
            left: 25px;

            transform:
              rotate(26deg);
          }

          /*
           * ==========================================
           * MANAGEMENT BEE GROUP
           * ==========================================
           */

          .management-bee-group {
            display: flex;

            align-items: flex-end;
            justify-content: center;

            width: 100%;

            animation:
              workerBeeFloat
              4.8s ease-in-out infinite;
          }

          .management-mini-bee {
            position: relative;

            width: 38px;
            height: 38px;

            margin: 0 -4px;
          }

          .management-mini-bee:nth-child(
            2
          ) {
            transform:
              translateY(-7px);
          }

          .mini-bee-body {
            position: absolute;

            top: 16px;
            left: 7px;

            width: 27px;
            height: 17px;

            border:
              2px solid #5c430e;

            border-radius: 50%;

            background:
              repeating-linear-gradient(
                90deg,
                #f3bc28 0 6px,
                #4b360d 6px 10px
              );
          }

          .mini-bee-head {
            position: absolute;
            z-index: 2;

            top: 15px;
            left: 1px;

            width: 18px;
            height: 18px;

            border:
              2px solid #5c430e;

            border-radius: 50%;

            background: #edbb32;
          }

          .mini-bee-wing {
            position: absolute;

            top: 6px;
            left: 14px;

            width: 19px;
            height: 15px;

            border:
              1px solid
              rgba(
                92,
                123,
                139,
                0.42
              );

            border-radius: 50%;

            background:
              rgba(
                224,
                244,
                250,
                0.68
              );
          }

          /*
           * ==========================================
           * RESPONSIVE
           * ==========================================
           */

          @media (
            max-width: 1250px
          ) {
            .worker-bee-card {
              grid-template-columns:
                minmax(92px, 0.78fr)
                minmax(0, 1.22fr);
            }

            .bee-illustration {
              transform: scale(0.9);
            }
          }

          @media (
            max-width: 700px
          ) {
            .worker-bee-card {
              grid-template-columns:
                minmax(100px, 0.8fr)
                minmax(0, 1.2fr);
            }

            .worker-value-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
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

type WorkerValueProps = {
  label: string;
  value: string;
};

function WorkerValue({
  label,
  value,
}: WorkerValueProps) {
  return (
    <div className="worker-value">
      <span>{label}</span>

      <strong>{value}</strong>
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
      }).map((_, index) => (
        <div
          className="management-mini-bee"
          key={index}
        >
          <div className="mini-bee-wing" />

          <div className="mini-bee-body" />

          <div className="mini-bee-head" />
        </div>
      ))}
    </div>
  );
}