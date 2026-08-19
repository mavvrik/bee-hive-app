import BeezyStreakTour from "./BeezyStreakTour";

import WorkerBeeCard from "./WorkerBeeCard";

type CollectorForBeeTeam = {
  id: number;
  name: string;
  role: string;
  groupType: string;
  position: number;
  active: boolean;

  preferredName?: string | null;
  profileTitle?: string | null;
  photoUrl?: string | null;
  isEmployeeOfMonth?: boolean;

  weeklySuccessfulSticks?: number;
  weeklySuccessRate?: number | null;

  varianceFreeStreak?: number;
  streakVerifiedThrough?: Date | null;
};

type BeeTeamProps = {
  collectors: CollectorForBeeTeam[];
};

export default function BeeTeam({
  collectors,
}: BeeTeamProps) {
  const activeBees =
    collectors.filter(
      (collector) =>
        collector.active,
    );

  const activeStreakers =
    activeBees.filter(
      (collector) =>
        (
          collector.varianceFreeStreak ??
          0
        ) > 0,
    ).length;

  return (
    <section className="bee-team-section">
      <div className="honeycomb-background" />

      <div className="honey-glow honey-glow-left" />

      <div className="honey-glow honey-glow-right" />

      <BeezyStreakTour />

      <header className="bee-team-header">
        <div className="bee-team-title-area">
          <div className="bee-team-title">
            <p className="bee-team-eyebrow">
              Riviera BEEch 115
            </p>

            <h2>
              Worker Bee Team
            </h2>

            <p className="bee-team-subtitle">
              Weekly performance across
              the Hive
            </p>
          </div>
        </div>

        <div className="team-summary-area">
          <div className="team-summary">
            <span>
              Active Team
            </span>

            <strong>
              {
                activeBees.length
              }{" "}
              Bees
            </strong>

            <small>
              Weekly workforce
              performance
            </small>
          </div>

          <div className="streak-summary">
            <span className="streak-summary-icon">
              🔥
            </span>

            <div>
              <span>
                Active Streaks
              </span>

              <strong>
                {
                  activeStreakers
                }
              </strong>
            </div>
          </div>
        </div>
      </header>

      <div className="bee-performance-stage">
        <div className="stage-highlight stage-highlight-one" />

        <div className="stage-highlight stage-highlight-two" />

        <div className="bee-performance-grid">
          {activeBees.map(
            (bee) => (
              <WorkerBeeCard
                key={
                  bee.id
                }

                name={
                  bee.preferredName ||
                  bee.name
                }

                roleLabel={
                  bee.profileTitle ||
                  bee.role
                }

                successfulSticks={
                  bee.weeklySuccessfulSticks ??
                  0
                }

                successRate={
                  bee.weeklySuccessRate ??
                  null
                }

                varianceFreeStreak={
                  bee.varianceFreeStreak ??
                  0
                }

                streakVerifiedThrough={
                  bee.streakVerifiedThrough ??
                  null
                }

                isManagement={
                  bee.role ===
                    "Management" ||
                  bee.name ===
                    "Management Team"
                }

                isPhlebotomist={
                  bee.role
                    .toLowerCase()
                    .includes(
                      "phlebotomist",
                    )
                }
              />
            ),
          )}
        </div>
      </div>

      <style>
        {`
          .bee-team-section {
            position: relative;

            display: flex;
            flex: 1 1 0;

            flex-direction:
              column;

            width: 100%;
            height: auto;

            min-width: 0;
            min-height: 0;

            margin-top: 10px;

            padding:
              10px 15px 12px;

            overflow: hidden;

            border:
              1px solid
              rgba(
                209,
                153,
                29,
                0.72
              );

            border-radius:
              22px;

            background:
              linear-gradient(
                180deg,
                #fff7cf 0%,
                #f9df88 55%,
                #efbf42 100%
              );

            box-shadow:
              0 12px 28px
              rgba(
                109,
                69,
                5,
                0.2
              ),
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.88
              );

            box-sizing:
              border-box;
          }

          /*
           * ==========================================
           * NORTH STAR BACKGROUND
           * ==========================================
           */

          .honeycomb-background {
            position: absolute;

            inset: 0;

            z-index: 0;

            opacity: 0.18;

            background-image:
              linear-gradient(
                30deg,
                #c79014 12%,
                transparent 12.5%,
                transparent 87%,
                #c79014 87.5%,
                #c79014
              ),
              linear-gradient(
                150deg,
                #c79014 12%,
                transparent 12.5%,
                transparent 87%,
                #c79014 87.5%,
                #c79014
              ),
              linear-gradient(
                30deg,
                #c79014 12%,
                transparent 12.5%,
                transparent 87%,
                #c79014 87.5%,
                #c79014
              ),
              linear-gradient(
                150deg,
                #c79014 12%,
                transparent 12.5%,
                transparent 87%,
                #c79014 87.5%,
                #c79014
              ),
              linear-gradient(
                60deg,
                rgba(
                  150,
                  96,
                  7,
                  0.12
                )
                25%,
                transparent 25.5%,
                transparent 75%,
                rgba(
                  150,
                  96,
                  7,
                  0.12
                )
                75%,
                rgba(
                  150,
                  96,
                  7,
                  0.12
                )
              ),
              linear-gradient(
                60deg,
                rgba(
                  150,
                  96,
                  7,
                  0.12
                )
                25%,
                transparent 25.5%,
                transparent 75%,
                rgba(
                  150,
                  96,
                  7,
                  0.12
                )
                75%,
                rgba(
                  150,
                  96,
                  7,
                  0.12
                )
              );

            background-size:
              42px 74px;

            background-position:
              0 0,
              0 0,
              21px 37px,
              21px 37px,
              0 0,
              21px 37px;

            pointer-events:
              none;
          }

          .honey-glow {
            position: absolute;

            z-index: 0;

            border-radius:
              50%;

            filter:
              blur(
                34px
              );

            pointer-events:
              none;
          }

          .honey-glow-left {
            top: -42px;
            left: -70px;

            width: 260px;
            height: 150px;

            background:
              rgba(
                255,
                229,
                111,
                0.62
              );
          }

          .honey-glow-right {
            right: -90px;
            bottom: -60px;

            width: 300px;
            height: 190px;

            background:
              rgba(
                223,
                137,
                16,
                0.32
              );
          }

          /*
           * ==========================================
           * HEADER
           * ==========================================
           */

          .bee-team-header {
            position: relative;

            z-index: 10;

            display: flex;

            flex: 0 0 auto;

            align-items:
              center;

            justify-content:
              space-between;

            gap: 16px;

            min-width: 0;
            min-height: 52px;

            margin-bottom:
              9px;
          }

          .bee-team-title-area {
            display: flex;

            align-items:
              center;

            min-width: 0;
          }

          .bee-team-title {
            min-width: 0;
          }

          .bee-team-eyebrow {
            margin:
              0 0 2px;

            color:
              #8e5b09;

            font-size:
              clamp(
                0.52rem,
                0.62vw,
                0.66rem
              );

            font-weight:
              1000;

            letter-spacing:
              0.16em;

            text-transform:
              uppercase;
          }

          .bee-team-header h2 {
            margin: 0;

            overflow: hidden;

            color:
              #4a2803;

            font-size:
              clamp(
                1.45rem,
                1.9vw,
                2rem
              );

            font-weight:
              1000;

            line-height: 0.96;

            letter-spacing:
              -0.035em;

            text-shadow:
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.62
              );

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .bee-team-subtitle {
            margin:
              4px 0 0;

            color:
              #795018;

            font-size:
              clamp(
                0.48rem,
                0.57vw,
                0.62rem
              );

            font-weight:
              800;
          }

          /*
           * ==========================================
           * TEAM SUMMARY
           * ==========================================
           */

          .team-summary-area {
            display: flex;

            flex: 0 0 auto;

            align-items:
              stretch;

            gap: 7px;
          }

          .team-summary {
            display: flex;

            flex-direction:
              column;

            justify-content:
              center;

            width: 170px;

            min-height:
              46px;

            padding:
              6px 11px;

            overflow:
              hidden;

            border:
              1px solid
              rgba(
                171,
                107,
                7,
                0.46
              );

            border-radius:
              12px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  252,
                  225,
                  0.98
                ),
                rgba(
                  255,
                  228,
                  136,
                  0.94
                )
              );

            box-shadow:
              0 4px 9px
              rgba(
                107,
                65,
                3,
                0.11
              ),
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.8
              );

            text-align:
              right;

            box-sizing:
              border-box;
          }

          .team-summary span,
          .streak-summary div span {
            overflow:
              hidden;

            color:
              #8a5d12;

            font-size:
              0.45rem;

            font-weight:
              1000;

            letter-spacing:
              0.08em;

            text-overflow:
              ellipsis;

            text-transform:
              uppercase;

            white-space:
              nowrap;
          }

          .team-summary strong {
            overflow:
              hidden;

            color:
              #432606;

            font-size:
              0.9rem;

            line-height: 1.05;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .team-summary small {
            overflow:
              hidden;

            margin-top:
              2px;

            color:
              #73511e;

            font-size:
              0.48rem;

            font-weight:
              700;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .streak-summary {
            display: flex;

            align-items:
              center;

            gap: 7px;

            min-width:
              105px;

            padding:
              5px 9px;

            border:
              1px solid
              rgba(
                192,
                112,
                8,
                0.45
              );

            border-radius:
              12px;

            background:
              linear-gradient(
                145deg,
                #fff5c6,
                #ffd15c
              );

            box-shadow:
              0 4px 9px
              rgba(
                107,
                65,
                3,
                0.11
              );

            box-sizing:
              border-box;
          }

          .streak-summary-icon {
            display: grid;

            width: 28px;
            height: 28px;

            place-items:
              center;

            border-radius:
              50%;

            background:
              rgba(
                255,
                255,
                255,
                0.58
              );

            font-size:
              0.9rem;

            box-shadow:
              0 0 9px
              rgba(
                240,
                145,
                12,
                0.32
              );
          }

          .streak-summary div {
            display: flex;

            flex-direction:
              column;
          }

          .streak-summary strong {
            color:
              #512c04;

            font-size:
              0.95rem;

            line-height: 1;
          }

          /*
           * ==========================================
           * WORKFORCE STAGE
           * ==========================================
           */

          .bee-performance-stage {
            position: relative;

            z-index: 5;

            display: flex;

            flex: 1 1 0;

            min-width: 0;
            min-height: 0;

            padding:
              5px;

            overflow:
              hidden;

            border:
              1px solid
              rgba(
                156,
                96,
                6,
                0.14
              );

            border-radius:
              17px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  246,
                  202,
                  0.4
                ),
                rgba(
                  255,
                  231,
                  146,
                  0.22
                )
              );

            box-shadow:
              inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                0.54
              );

            box-sizing:
              border-box;
          }

          .stage-highlight {
            position: absolute;

            border-radius:
              50%;

            filter:
              blur(
                24px
              );

            pointer-events:
              none;
          }

          .stage-highlight-one {
            top: -35px;
            left: 18%;

            width: 220px;
            height: 80px;

            background:
              rgba(
                255,
                255,
                224,
                0.42
              );
          }

          .stage-highlight-two {
            right: 4%;
            bottom: -40px;

            width: 180px;
            height: 90px;

            background:
              rgba(
                226,
                143,
                17,
                0.18
              );
          }

          /*
           * ==========================================
           * GRID
           * ==========================================
           */

          .bee-performance-grid {
            position: relative;

            z-index: 3;

            display: grid;

            flex: 1 1 0;

            grid-template-columns:
              repeat(
                4,
                minmax(
                  0,
                  1fr
                )
              );

            grid-template-rows:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 8px;

            width: 100%;

            min-width: 0;
            min-height: 0;

            overflow:
              hidden;
          }

          .bee-performance-grid > * {
            min-width: 0;
            min-height: 0;
          }

          /*
           * ==========================================
           * RESPONSIVE
           * ==========================================
           */

          @media (
            max-width: 1100px
          ) {
            .bee-team-section {
              flex: none;

              height: auto;

              min-height:
                560px;

              overflow:
                visible;
            }

            .bee-performance-stage {
              overflow:
                visible;
            }

            .bee-performance-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );

              grid-template-rows:
                auto;

              overflow:
                visible;
            }
          }

          @media (
            max-width: 700px
          ) {
            .bee-team-section {
              min-height:
                900px;
            }

            .bee-team-header {
              align-items:
                stretch;

              flex-direction:
                column;
            }

            .bee-team-header h2 {
              white-space:
                normal;
            }

            .team-summary-area {
              width: 100%;
            }

            .team-summary {
              flex: 1;

              width: auto;

              text-align:
                left;
            }

            .streak-summary {
              flex: 0 0 auto;
            }

            .bee-performance-grid {
              grid-template-columns:
                1fr;
            }
          }
        `}
      </style>
    </section>
  );
}