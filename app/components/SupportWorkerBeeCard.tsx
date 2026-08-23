type SupportMetric = {
  label: string;
  value: number | string;

  emphasis?:
    | "gold"
    | "green"
    | "red";
};

type SupportWorkerBeeCardProps = {
  name: string;
  roleLabel: string;
  primaryRole: string;

  supportMetrics?: SupportMetric[];

  isManagement?: boolean;
};

function formatValue(
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
    value !== "—"
  );
}

export default function SupportWorkerBeeCard({
  name,
  roleLabel,
  primaryRole,

  supportMetrics = [],

  isManagement = false,
}: SupportWorkerBeeCardProps) {
  const visibleMetrics =
    supportMetrics.filter(
      metricHasValue,
    );

  return (
    <article
      className={`support-worker-card ${
        isManagement
          ? "management-support-card"
          : ""
      }`}
      aria-label={`${name}, ${roleLabel}`}
    >
      <div className="support-worker-left">
        <div className="support-bee-stage">
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

        <div className="support-identity">
          <strong>
            {name}
          </strong>

          <span>
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="support-worker-right">
        <div className="support-heading">
          <small>
            Worker Bee
          </small>

          <strong>
            Weekly Contribution
          </strong>
        </div>

        {visibleMetrics.length >
        0 ? (
          <div
            className={`support-metric-grid ${
              visibleMetrics.length ===
              1
                ? "single-support-metric"
                : ""
            }`}
          >
            {visibleMetrics.map(
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
                    formatValue(
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
        ) : (
          <div className="no-support-activity">
            No recorded activity
            this week
          </div>
        )}
      </div>

      <style>
        {`
          .support-worker-card {
            display: grid;

            grid-template-columns:
              minmax(
                118px,
                .72fr
              )
              minmax(
                0,
                1.28fr
              );

            width: 100%;
            height: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;

            border:
              1px solid
              rgba(
                184,
                138,
                39,
                .52
              );

            border-radius: 17px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  255,
                  239,
                  .96
                ),
                rgba(
                  247,
                  226,
                  151,
                  .96
                )
              );

            box-shadow:
              0 8px 18px
              rgba(
                35,
                53,
                18,
                .2
              );
          }

          .management-support-card {
            border-color:
              rgba(
                117,
                83,
                18,
                .68
              );
          }

          /*
           * LEFT SIDE
           */

          .support-worker-left {
            display: flex;

            flex-direction: column;

            align-items: center;
            justify-content:
              space-between;

            min-width: 0;
            min-height: 0;

            padding:
              8px 7px 7px;

            border-right:
              1px solid
              rgba(
                159,
                114,
                23,
                .25
              );

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  248,
                  207,
                  .96
                ),
                rgba(
                  246,
                  223,
                  142,
                  .88
                )
              );
          }

          .support-bee-stage {
            display: grid;

            flex: 1 1 0;

            width: 100%;

            min-height: 0;

            place-items: center;
          }

          .support-identity {
            width: 100%;

            flex: 0 0 auto;

            text-align: center;
          }

          .support-identity strong {
            display: block;

            width: 100%;

            overflow: hidden;

            color: #3f2707;

            font-size:
              clamp(
                .82rem,
                .9vw,
                1rem
              );

            font-weight: 1000;

            line-height: 1.05;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .support-identity span {
            display: inline-flex;

            max-width: 100%;

            margin-top: 4px;

            padding:
              2px 8px;

            overflow: hidden;

            border-radius:
              999px;

            background:
              #dcebc6;

            color:
              #3d6029;

            font-size:
              .46rem;

            font-weight: 1000;

            text-overflow:
              ellipsis;

            text-transform:
              uppercase;

            white-space:
              nowrap;
          }

          /*
           * RIGHT SIDE
           */

          .support-worker-right {
            display: flex;

            flex-direction: column;

            min-width: 0;
            min-height: 0;

            padding:
              8px 10px 9px;
          }

          .support-heading {
            flex: 0 0 auto;

            margin-bottom: 6px;
          }

          .support-heading small {
            display: block;

            color: #8f641a;

            font-size: .42rem;

            font-weight: 1000;

            letter-spacing:
              .1em;

            text-transform:
              uppercase;
          }

          .support-heading strong {
            display: block;

            margin-top: 1px;

            color: #392304;

            font-size:
              clamp(
                .82rem,
                .9vw,
                1rem
              );

            font-weight: 1000;
          }

          /*
           * IMPORTANT:
           * Support Meadow always uses
           * TWO metric columns.
           *
           * No 3-column compression.
           */

          .support-metric-grid {
            display: grid;

            flex: 1 1 0;

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

            gap: 6px;

            min-width: 0;
            min-height: 0;
          }

          .support-metric-grid.single-support-metric {
            grid-template-columns:
              1fr;
          }

          .support-metric {
            display: flex;

            flex-direction: column;

            align-items: center;
            justify-content: center;

            min-width: 0;
            min-height: 0;

            padding:
              6px 5px;

            overflow: hidden;

            border:
              1px solid
              rgba(
                167,
                112,
                14,
                .27
              );

            border-radius:
              10px;

            background:
              linear-gradient(
                180deg,
                #fffef8,
                #ffebaa
              );

            text-align: center;
          }

          .support-metric span {
            display: block;

            width: 100%;

            color: #725927;

            font-size:
              clamp(
                .34rem,
                .42vw,
                .48rem
              );

            font-weight: 1000;

            line-height: 1.12;

            overflow-wrap: anywhere;

            text-transform:
              uppercase;
          }

          .support-metric strong {
            display: block;

            margin-top: 5px;

            color: #805108;

            font-size:
              clamp(
                .82rem,
                1vw,
                1.08rem
              );

            font-weight: 1000;

            line-height: 1;
          }

          .support-metric.green
          strong {
            color: #47752b;
          }

          .support-metric.red
          strong {
            color: #a13b32;
          }

          .no-support-activity {
            display: grid;

            flex: 1 1 0;

            place-items: center;

            color: #7b683f;

            font-size: .58rem;
            font-weight: 800;

            text-align: center;
          }

          /*
           * BEE
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

            background: #e8ac26;
          }

          .bee-eye {
            position: absolute;

            top: 10px;

            width: 5px;
            height: 6px;

            border-radius: 50%;

            background: #211707;
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

            background: #a6bbc3;

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

            background: #352916;
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

            background: #e7ae2f;
          }

          .mini-bee-wing {
            position: absolute;

            top: 6px;
            left: 15px;

            width: 20px;
            height: 16px;

            border-radius: 50%;

            background: #e5f7fa;
          }

          /*
           * SHORT SCREENS
           */

          @media (
            max-height: 850px
          ) and (
            min-width: 1101px
          ) {
            .support-worker-left {
              padding:
                5px;
            }

            .support-worker-right {
              padding:
                5px 7px 6px;
            }

            .support-heading {
              margin-bottom: 4px;
            }

            .support-heading small {
              display: none;
            }

            .support-heading strong {
              font-size: .78rem;
            }

            .support-metric-grid {
              gap: 4px;
            }

            .support-metric {
              padding:
                3px;
            }

            .support-metric span {
              font-size: .33rem;
            }

            .support-metric strong {
              margin-top: 3px;

              font-size: .78rem;
            }

            .bee-illustration {
              transform:
                scale(.84);
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
  emphasis,
}: {
  label: string;
  value: string;

  emphasis:
    | "gold"
    | "green"
    | "red";
}) {
  return (
    <div
      className={`support-metric ${emphasis}`}
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