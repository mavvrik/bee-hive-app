type BeeStatus =
  | "donor-floor"
  | "supporting-operations"
  | "unavailable";

type WorkerBeeProps = {
  name: string;
  status?: BeeStatus;
};

export default function WorkerBee({
  name,
  status = "donor-floor",
}: WorkerBeeProps) {
  const statusLabel =
    status === "donor-floor"
      ? "On Donor Floor"
      : status === "supporting-operations"
        ? "Supporting Operations"
        : "Unavailable";

  return (
    <article className={`worker-bee-card status-${status}`}>
      <div className="bee-scene" aria-hidden="true">
        <div className="bee-shadow" />

        <div className="bee">
          <div className="wing wing-left" />
          <div className="wing wing-right" />

          <div className="bee-body">
            <div className="stripe stripe-one" />
            <div className="stripe stripe-two" />
          </div>

          <div className="bee-head">
            <div className="eye eye-left" />
            <div className="eye eye-right" />

            <div className="antenna antenna-left" />
            <div className="antenna antenna-right" />
          </div>

          <div className="stinger" />
        </div>
      </div>

      <div className="bee-info">
        <h3>{name}</h3>

        <span className="bee-status">
          <span className="status-dot" />
          {statusLabel}
        </span>
      </div>

      <style>
        {`
          .worker-bee-card {
            position: relative;
            overflow: hidden;
            min-height: 230px;
            padding: 22px 18px 18px;
            border: 1px solid #e1c66e;
            border-radius: 24px;
            background:
              radial-gradient(
                circle at top,
                rgba(255, 255, 255, 0.96),
                rgba(255, 247, 214, 0.94) 52%,
                rgba(239, 212, 125, 0.88) 100%
              );
            box-shadow:
              0 14px 30px rgba(98, 70, 10, 0.13),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
            text-align: center;
            transition:
              transform 220ms ease,
              box-shadow 220ms ease,
              opacity 220ms ease,
              filter 220ms ease;
          }

          .worker-bee-card:hover {
            transform: translateY(-4px);
            box-shadow:
              0 18px 36px rgba(98, 70, 10, 0.17),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .bee-scene {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 142px;
          }

          .bee {
            position: relative;
            width: 100px;
            height: 80px;
          }

          .bee-shadow {
            position: absolute;
            bottom: 19px;
            left: 50%;
            width: 78px;
            height: 15px;
            transform: translateX(-50%);
            border-radius: 50%;
            background: rgba(63, 42, 6, 0.16);
            filter: blur(3px);
          }

          .bee-body {
            position: absolute;
            left: 25px;
            top: 30px;
            width: 56px;
            height: 39px;
            overflow: hidden;
            border: 3px solid #302207;
            border-radius: 52% 48% 46% 54%;
            background:
              linear-gradient(
                180deg,
                #ffe168 0%,
                #efad1b 100%
              );
            box-shadow:
              inset 0 4px 8px rgba(255, 255, 255, 0.42),
              0 5px 8px rgba(58, 39, 5, 0.18);
          }

          .stripe {
            position: absolute;
            top: -4px;
            width: 9px;
            height: 50px;
            border-radius: 8px;
            background: #352508;
            transform: rotate(4deg);
          }

          .stripe-one {
            left: 19px;
          }

          .stripe-two {
            left: 37px;
          }

          .bee-head {
            position: absolute;
            left: 10px;
            top: 31px;
            width: 35px;
            height: 34px;
            border: 3px solid #302207;
            border-radius: 50%;
            background:
              radial-gradient(
                circle at 35% 28%,
                #fff08a,
                #e4a81d 70%
              );
          }

          .eye {
            position: absolute;
            top: 10px;
            width: 5px;
            height: 6px;
            border-radius: 50%;
            background: #1f1707;
          }

          .eye-left {
            left: 8px;
          }

          .eye-right {
            right: 8px;
          }

          .antenna {
            position: absolute;
            top: -15px;
            width: 18px;
            height: 18px;
            border-top: 2px solid #332508;
          }

          .antenna-left {
            left: 3px;
            border-radius: 70% 0 0 0;
            transform: rotate(-21deg);
          }

          .antenna-right {
            right: 3px;
            border-radius: 0 70% 0 0;
            transform: rotate(21deg);
          }

          .wing {
            position: absolute;
            top: 8px;
            width: 38px;
            height: 38px;
            border: 2px solid rgba(77, 103, 113, 0.44);
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.84),
                rgba(196, 227, 234, 0.45)
              );
            box-shadow:
              inset 0 2px 4px rgba(255, 255, 255, 0.8);
          }

          .wing-left {
            left: 28px;
            border-radius: 70% 40% 70% 35%;
            transform: rotate(-24deg);
          }

          .wing-right {
            left: 54px;
            border-radius: 40% 70% 35% 70%;
            transform: rotate(25deg);
          }

          .stinger {
            position: absolute;
            right: 8px;
            top: 47px;
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-left: 14px solid #342307;
          }

          .bee-info h3 {
            margin: 0;
            color: #36270a;
            font-size: 1.2rem;
          }

          .bee-status {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            margin-top: 9px;
            padding: 7px 11px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.72);
            color: #725d2d;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #5f9b3a;
            box-shadow: 0 0 0 4px rgba(95, 155, 58, 0.12);
          }

          .status-supporting-operations {
            background:
              radial-gradient(
                circle at top,
                rgba(255, 255, 255, 0.96),
                rgba(239, 243, 222, 0.94) 52%,
                rgba(194, 211, 152, 0.88) 100%
              );
          }

          .status-supporting-operations .status-dot {
            background: #bd8b23;
            box-shadow: 0 0 0 4px rgba(189, 139, 35, 0.13);
          }

          .status-supporting-operations .bee {
            transform: translateX(10px) rotate(-4deg);
          }

          .status-unavailable {
            opacity: 0.58;
            filter: grayscale(0.7);
          }

          .status-unavailable .status-dot {
            background: #8e8e8e;
            box-shadow: 0 0 0 4px rgba(120, 120, 120, 0.12);
          }

          @media (max-width: 600px) {
            .worker-bee-card {
              min-height: 210px;
            }
          }
        `}
      </style>
    </article>
  );
}