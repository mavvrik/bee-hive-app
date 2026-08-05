"use client";

import {
  useEffect,
  useState,
} from "react";

type BeeProfile = {
  id: number;
  name: string;
  roleLabel: string;
  currentLiters: number;
  dailyGoalLiters: number;
  weeklyGoalLiters: number;
  isManagement: boolean;
};

type MeetTheBeesPageProps = {
  centerName: string;
  bees: BeeProfile[];
};

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}

function getBeeTitle(
  roleLabel: string,
  isManagement: boolean,
) {
  if (isManagement) {
    return "Hive Leadership";
  }

  if (
    roleLabel.toLowerCase().includes("lead")
  ) {
    return "Lead Forager";
  }

  return "Plasma Pathfinder";
}

export default function MeetTheBeesPage({
  centerName,
  bees,
}: MeetTheBeesPageProps) {
  const [activeBeeIndex, setActiveBeeIndex] =
    useState(0);

  useEffect(() => {
    if (bees.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveBeeIndex(
        (current) =>
          (current + 1) % bees.length,
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [bees.length]);

  return (
    <section className="meet-bees-page">
      <div className="sun-honeycomb" />

      <div className="ocean-wave wave-one" />
      <div className="ocean-wave wave-two" />

      <div className="beach-bee beach-bee-one">
        🐝
      </div>

      <div className="beach-bee beach-bee-two">
        🐝
      </div>

      <header className="meet-bees-header">
        <div>
          <p className="meet-bees-eyebrow">
            Welcome to Riviera BEEch
          </p>

          <h1>Meet the Bees</h1>

          <p className="meet-bees-subtitle">
            The people powering{" "}
            {centerName}
          </p>
        </div>

        <div className="beech-badge">
          <span>Center 115</span>
          <strong>Riviera BEEch</strong>
        </div>
      </header>

      <main className="meet-bees-content">
        <section className="featured-bee">
          {bees.length > 0 ? (
            <>
              <div className="featured-bee-art">
                <div className="featured-wing wing-left" />
                <div className="featured-wing wing-right" />
                <div className="featured-body" />
                <div className="featured-head">
                  <span className="featured-eye eye-left" />
                  <span className="featured-eye eye-right" />
                </div>
              </div>

              <p className="featured-label">
                Featured Bee
              </p>

              <h2>
                {bees[activeBeeIndex].name}
              </h2>

              <strong className="featured-title">
                {getBeeTitle(
                  bees[activeBeeIndex]
                    .roleLabel,
                  bees[activeBeeIndex]
                    .isManagement,
                )}
              </strong>

              <span className="featured-role">
                {
                  bees[activeBeeIndex]
                    .roleLabel
                }
              </span>

              <div className="featured-metrics">
                <article>
                  <span>Today</span>
                  <strong>
                    {formatLiters(
                      bees[activeBeeIndex]
                        .currentLiters,
                    )}
                  </strong>
                </article>

                <article>
                  <span>Daily Goal</span>
                  <strong>
                    {formatLiters(
                      bees[activeBeeIndex]
                        .dailyGoalLiters,
                    )}
                  </strong>
                </article>

                <article>
                  <span>Weekly Goal</span>
                  <strong>
                    {formatLiters(
                      bees[activeBeeIndex]
                        .weeklyGoalLiters,
                    )}
                  </strong>
                </article>
              </div>
            </>
          ) : (
            <div className="empty-bees">
              No active bees are configured.
            </div>
          )}
        </section>

        <section className="bee-roster-panel">
          <div className="roster-heading">
            <div>
              <p className="meet-bees-eyebrow">
                The Hive Workforce
              </p>

              <h2>Our Riviera BEEch Crew</h2>
            </div>

            <span>
              {bees.length} Active Bees
            </span>
          </div>

          <div className="bee-roster-grid">
            {bees.map((bee, index) => (
              <article
                key={bee.id}
                className={`roster-bee-card ${
                  index === activeBeeIndex
                    ? "active-roster-bee"
                    : ""
                }`}
              >
                <div className="roster-bee-icon">
                  🐝
                </div>

                <div>
                  <strong>{bee.name}</strong>
                  <span>{bee.roleLabel}</span>
                </div>

                <small>
                  {getBeeTitle(
                    bee.roleLabel,
                    bee.isManagement,
                  )}
                </small>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="meet-bees-footer">
        <strong>
          Riviera BEEch 115
        </strong>

        <span>
          Where every bee helps the Hive
          thrive.
        </span>

        <div className="shoreline-mark">
          🌴 🐝 🌊
        </div>
      </footer>

      <style>
        {`
          .meet-bees-page {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            padding: 18px 24px;
            overflow: hidden;
            background:
              linear-gradient(
                180deg,
                #e9f8ff 0%,
                #fff9df 54%,
                #f5dda1 100%
              );
            box-sizing: border-box;
          }

          .sun-honeycomb {
            position: absolute;
            top: 36px;
            right: 8%;
            width: 105px;
            height: 94px;
            background:
              linear-gradient(
                145deg,
                #ffe88b,
                #eebc2e
              );
            clip-path: polygon(
              25% 6%,
              75% 6%,
              100% 50%,
              75% 94%,
              25% 94%,
              0 50%
            );
            opacity: 0.58;
            animation:
              honeySunGlow
              5s ease-in-out infinite;
          }

          @keyframes honeySunGlow {
            0%,
            100% {
              transform: scale(0.96);
              filter:
                drop-shadow(
                  0 0 8px
                  rgba(232, 174, 24, 0.2)
                );
            }

            50% {
              transform: scale(1.06);
              filter:
                drop-shadow(
                  0 0 22px
                  rgba(232, 174, 24, 0.48)
                );
            }
          }

          .ocean-wave {
            position: absolute;
            right: -8%;
            bottom: -12%;
            width: 70%;
            height: 38%;
            border-radius: 50%;
            background:
              rgba(84, 184, 218, 0.26);
            animation:
              shorelineMove
              9s ease-in-out infinite;
          }

          .wave-two {
            right: 18%;
            bottom: -19%;
            background:
              rgba(49, 145, 191, 0.18);
            animation-delay: -4s;
          }

          @keyframes shorelineMove {
            0%,
            100% {
              transform:
                translateX(0)
                translateY(0);
            }

            50% {
              transform:
                translateX(-24px)
                translateY(-12px);
            }
          }

          .beach-bee {
            position: absolute;
            z-index: 1;
            font-size: 27px;
            animation:
              beachBeeFlight
              18s linear infinite;
          }

          .beach-bee-one {
            top: 16%;
            left: -8%;
          }

          .beach-bee-two {
            top: 66%;
            left: -15%;
            animation-delay: -8s;
            animation-duration: 23s;
          }

          @keyframes beachBeeFlight {
            0% {
              transform:
                translateX(0)
                translateY(0)
                rotate(-5deg);
            }

            35% {
              transform:
                translateX(42vw)
                translateY(-28px)
                rotate(6deg);
            }

            70% {
              transform:
                translateX(80vw)
                translateY(18px)
                rotate(-4deg);
            }

            100% {
              transform:
                translateX(118vw)
                translateY(-5px)
                rotate(5deg);
            }
          }

          .meet-bees-header {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
          }

          .meet-bees-eyebrow {
            margin: 0 0 5px;
            color: #9b6b07;
            font-size: 0.68rem;
            font-weight: 900;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .meet-bees-header h1 {
            margin: 0;
            color: #342405;
            font-size: clamp(
              2.1rem,
              3.2vw,
              3.3rem
            );
            line-height: 0.95;
          }

          .meet-bees-subtitle {
            margin: 9px 0 0;
            color: #6c5d32;
            font-weight: 800;
          }

          .beech-badge {
            display: flex;
            flex-direction: column;
            min-width: 175px;
            padding: 12px 15px;
            border: 1px solid
              rgba(52, 142, 184, 0.28);
            border-radius: 14px;
            background:
              rgba(255, 255, 255, 0.78);
            box-shadow:
              0 9px 22px
              rgba(50, 109, 137, 0.12);
            text-align: right;
          }

          .beech-badge span {
            color: #5a8495;
            font-size: 0.58rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .beech-badge strong {
            margin-top: 4px;
            color: #76510a;
            font-size: 1.05rem;
          }

          .meet-bees-content {
            position: relative;
            z-index: 2;
            display: grid;
            flex: 1 1 0;
            grid-template-columns:
              0.9fr 1.6fr;
            gap: 18px;
            min-height: 0;
            margin-top: 16px;
          }

          .featured-bee,
          .bee-roster-panel {
            min-width: 0;
            min-height: 0;
            padding: 18px;
            overflow: hidden;
            border: 1px solid
              rgba(204, 165, 55, 0.46);
            border-radius: 20px;
            background:
              rgba(255, 255, 255, 0.84);
            box-shadow:
              0 12px 28px
              rgba(71, 55, 12, 0.1);
            backdrop-filter: blur(5px);
            box-sizing: border-box;
          }

          .featured-bee {
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;
            text-align: center;
          }

          .featured-bee-art {
            position: relative;
            width: 128px;
            height: 90px;
            margin-bottom: 10px;
            animation:
              featuredBeeFloat
              4s ease-in-out infinite;
          }

          @keyframes featuredBeeFloat {
            0%,
            100% {
              transform: translateY(3px);
            }

            50% {
              transform: translateY(-8px);
            }
          }

          .featured-body {
            position: absolute;
            top: 36px;
            left: 35px;
            width: 76px;
            height: 40px;
            border: 4px solid #4d380c;
            border-radius: 50%;
            background:
              repeating-linear-gradient(
                90deg,
                #f3bc28 0 14px,
                #4b360d 14px 23px
              );
          }

          .featured-head {
            position: absolute;
            z-index: 3;
            top: 34px;
            left: 17px;
            width: 43px;
            height: 43px;
            border: 4px solid #4d380c;
            border-radius: 50%;
            background: #edb92e;
          }

          .featured-eye {
            position: absolute;
            top: 15px;
            width: 5px;
            height: 6px;
            border-radius: 50%;
            background: #2d230c;
          }

          .eye-left {
            left: 10px;
          }

          .eye-right {
            right: 10px;
          }

          .featured-wing {
            position: absolute;
            z-index: 1;
            top: 7px;
            width: 45px;
            height: 40px;
            border: 2px solid
              rgba(72, 127, 149, 0.4);
            border-radius: 55%;
            background:
              rgba(222, 245, 252, 0.82);
          }

          .wing-left {
            left: 45px;
            transform: rotate(-18deg);
          }

          .wing-right {
            left: 74px;
            transform: rotate(19deg);
          }

          .featured-label {
            margin: 0;
            color: #a2730b;
            font-size: 0.62rem;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .featured-bee h2 {
            margin: 6px 0 0;
            color: #342405;
            font-size: 1.7rem;
          }

          .featured-title {
            margin-top: 5px;
            color: #9a6b08;
          }

          .featured-role {
            margin-top: 4px;
            color: #6d603c;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }

          .featured-metrics {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 8px;
            width: 100%;
            margin-top: 18px;
          }

          .featured-metrics article {
            display: flex;
            flex-direction: column;
            padding: 10px 7px;
            border: 1px solid #ead99d;
            border-radius: 11px;
            background: #fffdf4;
          }

          .featured-metrics span {
            color: #866d2e;
            font-size: 0.52rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .featured-metrics strong {
            margin-top: 5px;
            color: #392707;
          }

          .roster-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
          }

          .roster-heading h2 {
            margin: 0;
            color: #392707;
          }

          .roster-heading > span {
            padding: 7px 10px;
            border-radius: 999px;
            background: #e7f5dd;
            color: #3f7136;
            font-size: 0.6rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .bee-roster-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 9px;
            margin-top: 15px;
          }

          .roster-bee-card {
            display: grid;
            grid-template-columns:
              42px minmax(0, 1fr);
            align-items: center;
            gap: 9px;
            min-width: 0;
            padding: 11px;
            border: 1px solid #eadca9;
            border-radius: 13px;
            background:
              rgba(255, 255, 255, 0.74);
            transition:
              transform 450ms ease,
              border-color 450ms ease,
              background 450ms ease;
          }

          .active-roster-bee {
            transform: translateY(-3px);
            border-color: #dfa91e;
            background: #fff4bd;
            box-shadow:
              0 7px 16px
              rgba(123, 84, 5, 0.12);
          }

          .roster-bee-icon {
            font-size: 27px;
            text-align: center;
            animation:
              rosterBeeWiggle
              3.5s ease-in-out infinite;
          }

          @keyframes rosterBeeWiggle {
            0%,
            100% {
              transform: rotate(-3deg);
            }

            50% {
              transform: rotate(5deg);
            }
          }

          .roster-bee-card div:nth-child(2) {
            display: flex;
            min-width: 0;
            flex-direction: column;
          }

          .roster-bee-card strong {
            overflow: hidden;
            color: #392707;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .roster-bee-card span {
            margin-top: 3px;
            color: #6e613e;
            font-size: 0.64rem;
            font-weight: 800;
            text-transform: uppercase;
          }

          .roster-bee-card small {
            grid-column: 2;
            color: #9a6b08;
            font-size: 0.6rem;
            font-weight: 900;
          }

          .meet-bees-footer {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns:
              auto 1fr auto;
            align-items: center;
            gap: 18px;
            margin-top: 13px;
            padding: 10px 14px;
            border-radius: 13px;
            background:
              rgba(54, 40, 8, 0.9);
            color: #ffffff;
          }

          .meet-bees-footer strong {
            color: #ffe58a;
          }

          .meet-bees-footer span {
            text-align: center;
            font-weight: 800;
          }

          .shoreline-mark {
            font-size: 1.15rem;
          }

          .empty-bees {
            color: #75643c;
            font-weight: 800;
          }

          @media (max-width: 1000px) {
            .meet-bees-page {
              height: auto;
              min-height: 100vh;
              overflow: visible;
            }

            .meet-bees-content {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .meet-bees-header {
              flex-direction: column;
            }

            .beech-badge {
              width: 100%;
              text-align: left;
              box-sizing: border-box;
            }

            .bee-roster-grid {
              grid-template-columns: 1fr;
            }

            .featured-metrics {
              grid-template-columns: 1fr;
            }

            .meet-bees-footer {
              grid-template-columns: 1fr;
              text-align: center;
            }
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .sun-honeycomb,
            .ocean-wave,
            .beach-bee,
            .featured-bee-art,
            .roster-bee-icon {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}