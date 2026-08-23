import BeezyStreakTour from "./BeezyStreakTour";
import PhlebotomyWorkerBeeCard from "./PhlebotomyWorkerBeeCard";
import SupportWorkerBeeCard from "./SupportWorkerBeeCard";

type SupportMetric = {
  label: string;
  value: number | string;

  emphasis?:
    | "gold"
    | "green"
    | "red";
};

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

  supportMetrics?: SupportMetric[];
};

type BeeTeamProps = {
  collectors: CollectorForBeeTeam[];

  mode:
    | "phlebotomy"
    | "support";
};

export default function BeeTeam({
  collectors,
  mode,
}: BeeTeamProps) {
  const activeBees =
    collectors.filter(
      (collector) =>
        collector.active,
    );

  const isPhlebotomy =
    mode === "phlebotomy";

  const activeStreakers =
    isPhlebotomy
      ? activeBees.filter(
          (collector) =>
            (
              collector
                .varianceFreeStreak ??
              0
            ) > 0,
        ).length
      : 0;

  const uniquePrimaryRoles =
    new Set(
      activeBees.map(
        (collector) =>
          collector.role,
      ),
    ).size;

  /*
   * ==========================================
   * MEADOW 1 GRID
   * ==========================================
   *
   * Up to 8 bees:
   * 4 columns x 2 rows
   *
   * 9+ bees:
   * 3 columns x 3 rows
   */

  const useThreeRowGrid =
    isPhlebotomy &&
    activeBees.length > 8;

  /*
   * ==========================================
   * MEADOW 2 GRID
   * ==========================================
   *
   * Support Meadow gets its own independent
   * grid allocation based on worker count.
   */

  let supportGridClass = "";

  if (!isPhlebotomy) {
    if (activeBees.length <= 8) {
      supportGridClass =
        "support-grid-4x2";
    } else if (
      activeBees.length <= 12
    ) {
      supportGridClass =
        "support-grid-4x3";
    } else if (
      activeBees.length <= 15
    ) {
      supportGridClass =
        "support-grid-5x3";
    } else if (
      activeBees.length <= 20
    ) {
      supportGridClass =
        "support-grid-5x4";
    } else {
      supportGridClass =
        "support-grid-5x5";
    }
  }

  return (
    <section
      className={`bee-team-section ${
        isPhlebotomy
          ? "phlebotomy-meadow"
          : "support-meadow"
      }`}
    >
      {/* =====================================
          PHLEBOTOMY BACKGROUND
         ===================================== */}

      {isPhlebotomy && (
        <>
          <div className="honeycomb-background" />

          <div className="honey-glow honey-glow-left" />

          <div className="honey-glow honey-glow-right" />

          <BeezyStreakTour />
        </>
      )}

      {/* =====================================
          SUPPORT MEADOW WORLD
         ===================================== */}

      {!isPhlebotomy && (
        <div
          className="support-world"
          aria-hidden="true"
        >
          <div className="support-sky" />

          <div className="support-sun" />

          <div className="support-sun-glow" />

          <div className="distant-hill distant-hill-one" />

          <div className="distant-hill distant-hill-two" />

          <div className="distant-hill distant-hill-three" />

          <div className="hive-architecture hive-architecture-left">
            {Array.from({
              length: 7,
            }).map(
              (
                _,
                index,
              ) => (
                <span
                  key={index}
                  className={`architecture-cell architecture-cell-${index + 1}`}
                />
              ),
            )}
          </div>

          <div className="hive-architecture hive-architecture-right">
            {Array.from({
              length: 6,
            }).map(
              (
                _,
                index,
              ) => (
                <span
                  key={index}
                  className={`architecture-cell architecture-cell-${index + 1}`}
                />
              ),
            )}
          </div>

          <div className="honey-light honey-light-one" />

          <div className="honey-light honey-light-two" />

          <div className="flight-trail flight-trail-one" />

          <div className="flight-trail flight-trail-two" />

          <div className="tiny-flight-bee tiny-flight-bee-one">
            🐝
          </div>

          <div className="tiny-flight-bee tiny-flight-bee-two">
            🐝
          </div>

          <div className="pollen pollen-1" />
          <div className="pollen pollen-2" />
          <div className="pollen pollen-3" />
          <div className="pollen pollen-4" />
          <div className="pollen pollen-5" />
          <div className="pollen pollen-6" />
          <div className="pollen pollen-7" />
          <div className="pollen pollen-8" />

          <div className="middle-field" />

          <div className="flower-cluster flower-cluster-left">
            <span className="flower flower-gold" />
            <span className="flower flower-white" />
            <span className="flower flower-purple" />
            <span className="flower flower-gold small" />
            <span className="flower flower-white small" />
          </div>

          <div className="flower-cluster flower-cluster-right">
            <span className="flower flower-purple" />
            <span className="flower flower-gold" />
            <span className="flower flower-white" />
            <span className="flower flower-purple small" />
          </div>

          <div className="foreground-grass" />

          <div className="foreground-flower foreground-flower-one" />

          <div className="foreground-flower foreground-flower-two" />

          <div className="foreground-flower foreground-flower-three" />

          <div className="foreground-honeycomb">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {/* =====================================
          PHLEBOTOMY HEADER
         ===================================== */}

      {isPhlebotomy ? (
        <header className="bee-team-header">
          <div className="bee-team-title-area">
            <div className="bee-team-title">
              <p className="bee-team-eyebrow">
                Riviera BEEch 115
              </p>

              <h2>
                Phlebotomy Meadow
              </h2>

              <p className="bee-team-subtitle">
                Weekly stick performance from our collection Worker Bees
              </p>
            </div>
          </div>

          <div className="team-summary-area">
            <div className="team-summary">
              <span>
                Phlebotomy Team
              </span>

              <strong>
                {activeBees.length} Bees
              </strong>

              <small>
                Weekly collection performance
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
                  {activeStreakers}
                </strong>
              </div>
            </div>
          </div>
        </header>
      ) : (
        <div className="support-floating-summary">
          <div className="support-summary-chip">
            <span>
              Worker Bees
            </span>

            <strong>
              {activeBees.length}
            </strong>
          </div>

          <div className="support-summary-chip">
            <span>
              Role Coverage
            </span>

            <strong>
              {uniquePrimaryRoles}
            </strong>
          </div>
        </div>
      )}

      {/* =====================================
          WORKER GRID
         ===================================== */}

      <div className="bee-performance-stage">
        {isPhlebotomy && (
          <>
            <div className="stage-highlight stage-highlight-one" />

            <div className="stage-highlight stage-highlight-two" />
          </>
        )}

        <div
          className={`bee-performance-grid ${
            useThreeRowGrid
              ? "three-row-grid"
              : ""
          } ${supportGridClass}`}
        >
          {activeBees.map(
            (bee) => {
              const displayName =
                bee.preferredName ||
                bee.name;

              const roleLabel =
                bee.profileTitle ||
                bee.role;

              const isManagement =
                bee.role ===
                  "Management" ||
                bee.name ===
                  "Management Team";

              if (isPhlebotomy) {
                return (
                  <PhlebotomyWorkerBeeCard
                    key={bee.id}
                    name={
                      displayName
                    }
                    primaryRole={
                      bee.role
                    }
                    roleLabel={
                      roleLabel
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
                    supportMetrics={
                      bee.supportMetrics ??
                      []
                    }
                    isManagement={
                      isManagement
                    }
                  />
                );
              }

              return (
                <SupportWorkerBeeCard
                  key={bee.id}
                  name={
                    displayName
                  }
                  primaryRole={
                    bee.role
                  }
                  roleLabel={
                    roleLabel
                  }
                  supportMetrics={
                    bee.supportMetrics ??
                    []
                  }
                  isManagement={
                    isManagement
                  }
                />
              );
            },
          )}
        </div>
      </div>

      <style>
        {`
          /*
           * ==================================
           * BASE MEADOW
           * ==================================
           */

          .bee-team-section {
            position: relative;

            display: flex;
            flex: 1 1 0;
            flex-direction: column;

            width: 100%;
            height: auto;

            min-width: 0;
            min-height: 0;

            margin-top: 6px;

            padding:
              7px 11px 8px;

            overflow: hidden;

            border:
              1px solid
              rgba(
                209,
                153,
                29,
                .72
              );

            border-radius: 22px;

            box-shadow:
              0 12px 28px
              rgba(
                109,
                69,
                5,
                .2
              );

            box-sizing:
              border-box;
          }

          /*
           * Both Meadows fill whatever
           * dashboard height is available.
           */

          .phlebotomy-meadow,
          .support-meadow {
            height: auto;
            flex: 1 1 0;

            min-height: 0;
          }

          /*
           * ==================================
           * PHLEBOTOMY MEADOW
           * ==================================
           */

          .phlebotomy-meadow {
            background:
              linear-gradient(
                180deg,
                #fff7cf 0%,
                #f9df88 55%,
                #efbf42 100%
              );
          }

          .honeycomb-background {
            position: absolute;

            inset: 0;

            z-index: 0;

            opacity: .18;

            background-image:
              linear-gradient(
                30deg,
                #c79014 12%,
                transparent 12.5%,
                transparent 87%,
                #c79014 87.5%
              ),
              linear-gradient(
                150deg,
                #c79014 12%,
                transparent 12.5%,
                transparent 87%,
                #c79014 87.5%
              );

            background-size:
              42px 74px;

            pointer-events:
              none;
          }

          .honey-glow {
            position: absolute;

            z-index: 0;

            border-radius: 50%;

            filter:
              blur(34px);

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
                .62
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
                .32
              );
          }

          /*
           * ==================================
           * SUPPORT MEADOW
           * ==================================
           */

          .support-meadow {
            isolation: isolate;

            background:
              linear-gradient(
                180deg,
                #f8d878 0%,
                #d5c968 28%,
                #86a84d 63%,
                #53792f 100%
              );

            border-color:
              rgba(
                130,
                92,
                14,
                .7
              );

            box-shadow:
              0 15px 34px
              rgba(
                61,
                79,
                24,
                .28
              );
          }

          .support-world {
            position: absolute;

            inset: 0;

            z-index: 0;

            overflow: hidden;

            pointer-events: none;
          }

          .support-sky {
            position: absolute;

            inset:
              0 0 38% 0;

            background:
              linear-gradient(
                180deg,
                #8bc9dc 0%,
                #c7e1c8 32%,
                #f7d780 72%,
                #e8b84d 100%
              );
          }

          .support-sun {
            position: absolute;

            z-index: 1;

            top: 7%;
            right: 11%;

            width: 88px;
            height: 88px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                #fffbd5 0%,
                #ffe77a 42%,
                #f5b72b 75%,
                rgba(
                  246,
                  182,
                  39,
                  0
                ) 100%
              );

            opacity: .96;
          }

          .support-sun-glow {
            position: absolute;

            z-index: 0;

            top: -30px;
            right: 2%;

            width: 300px;
            height: 240px;

            border-radius: 50%;

            background:
              rgba(
                255,
                221,
                103,
                .42
              );

            filter:
              blur(48px);
          }

          /*
           * ==================================
           * HILLS
           * ==================================
           */

          .distant-hill {
            position: absolute;

            border-radius:
              50% 50% 0 0;

            transform-origin:
              center bottom;
          }

          .distant-hill-one {
            z-index: 2;

            left: -10%;
            bottom: 30%;

            width: 65%;
            height: 31%;

            background:
              linear-gradient(
                180deg,
                #9dbb61,
                #688c3e
              );

            transform:
              rotate(4deg);
          }

          .distant-hill-two {
            z-index: 2;

            right: -12%;
            bottom: 31%;

            width: 72%;
            height: 35%;

            background:
              linear-gradient(
                180deg,
                #87a853,
                #557b35
              );

            transform:
              rotate(-3deg);
          }

          .distant-hill-three {
            z-index: 3;

            left: 22%;
            bottom: 27%;

            width: 70%;
            height: 28%;

            background:
              linear-gradient(
                180deg,
                rgba(
                  116,
                  157,
                  69,
                  .92
                ),
                #446d2d
              );
          }

          /*
           * ==================================
           * HIVE ARCHITECTURE
           * ==================================
           */

          .hive-architecture {
            position: absolute;

            z-index: 4;

            display: grid;

            grid-template-columns:
              repeat(
                3,
                58px
              );

            grid-auto-rows:
              51px;

            gap: 3px;

            opacity: .68;

            filter:
              drop-shadow(
                0 9px 12px
                rgba(
                  71,
                  44,
                  4,
                  .24
                )
              );
          }

          .hive-architecture-left {
            left: 5%;
            top: 21%;

            transform:
              rotate(-4deg)
              scale(.93);
          }

          .hive-architecture-right {
            right: 4%;
            top: 30%;

            transform:
              rotate(5deg)
              scale(.78);
          }

          .architecture-cell {
            position: relative;

            display: block;

            width: 58px;
            height: 51px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  218,
                  95,
                  .9
                ),
                rgba(
                  201,
                  126,
                  12,
                  .92
                )
              );

            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );

            box-shadow:
              inset
              0 0 0
              5px
              rgba(
                115,
                71,
                7,
                .23
              );
          }

          .architecture-cell::after {
            content: "";

            position: absolute;

            inset: 9px;

            background:
              rgba(
                122,
                75,
                7,
                .26
              );

            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );
          }

          .architecture-cell-2,
          .architecture-cell-5 {
            transform:
              translateY(
                27px
              );
          }

          /*
           * ==================================
           * HONEY LIGHT
           * ==================================
           */

          .honey-light {
            position: absolute;

            z-index: 5;

            border-radius: 50%;

            filter: blur(30px);
          }

          .honey-light-one {
            left: 7%;
            top: 26%;

            width: 200px;
            height: 105px;

            background:
              rgba(
                255,
                202,
                48,
                .25
              );
          }

          .honey-light-two {
            right: 5%;
            top: 35%;

            width: 180px;
            height: 100px;

            background:
              rgba(
                255,
                216,
                80,
                .2
              );
          }

          /*
           * ==================================
           * MID FIELD
           * ==================================
           */

          .middle-field {
            position: absolute;

            z-index: 6;

            left: -5%;
            right: -5%;
            bottom: 0;

            height: 48%;

            background:
              linear-gradient(
                180deg,
                rgba(
                  112,
                  150,
                  55,
                  .52
                ),
                rgba(
                  65,
                  105,
                  38,
                  .85
                )
              );

            border-radius:
              50% 50% 0 0 /
              20% 20% 0 0;
          }

          /*
           * ==================================
           * FLIGHT TRAILS
           * ==================================
           */

          .flight-trail {
            position: absolute;

            z-index: 8;

            width: 160px;
            height: 70px;

            border-top:
              2px dashed
              rgba(
                255,
                248,
                200,
                .52
              );

            border-radius: 50%;
          }

          .flight-trail-one {
            top: 17%;
            left: 34%;

            transform:
              rotate(-7deg);
          }

          .flight-trail-two {
            top: 29%;
            right: 23%;

            width: 120px;

            transform:
              rotate(13deg);
          }

          .tiny-flight-bee {
            position: absolute;

            z-index: 9;

            font-size: .9rem;
          }

          .tiny-flight-bee-one {
            top: 14%;
            left: 45%;
          }

          .tiny-flight-bee-two {
            top: 27%;
            right: 28%;

            transform:
              scale(.75);
          }

          /*
           * ==================================
           * POLLEN
           * ==================================
           */

          .pollen {
            position: absolute;

            z-index: 9;

            width: 5px;
            height: 5px;

            border-radius: 50%;

            background: #ffe877;

            box-shadow:
              0 0 9px
              rgba(
                255,
                222,
                78,
                .9
              );

            animation:
              pollenFloat
              5s
              ease-in-out
              infinite;
          }

          .pollen-1 {
            top: 14%;
            left: 18%;
          }

          .pollen-2 {
            top: 22%;
            left: 30%;

            animation-delay: .9s;
          }

          .pollen-3 {
            top: 18%;
            right: 23%;

            animation-delay: 1.7s;
          }

          .pollen-4 {
            top: 39%;
            right: 11%;

            animation-delay: .4s;
          }

          .pollen-5 {
            top: 47%;
            left: 12%;

            animation-delay: 2.1s;
          }

          .pollen-6 {
            top: 35%;
            left: 52%;

            animation-delay: 1.2s;
          }

          .pollen-7 {
            top: 58%;
            right: 31%;

            animation-delay: 2.7s;
          }

          .pollen-8 {
            top: 52%;
            left: 37%;

            animation-delay: 3.3s;
          }

          @keyframes pollenFloat {
            0%,
            100% {
              transform:
                translateY(4px);

              opacity: .45;
            }

            50% {
              transform:
                translateY(-9px);

              opacity: 1;
            }
          }

          /*
           * ==================================
           * FLOWERS
           * ==================================
           */

          .flower-cluster {
            position: absolute;

            z-index: 8;

            display: flex;

            align-items:
              flex-end;

            gap: 9px;
          }

          .flower-cluster-left {
            left: 2%;
            bottom: 10%;
          }

          .flower-cluster-right {
            right: 2%;
            bottom: 12%;
          }

          .flower {
            position: relative;

            display: block;

            width: 23px;
            height: 23px;

            border-radius: 50%;
          }

          .flower::before {
            content: "";

            position: absolute;

            left: 10px;
            top: 19px;

            width: 3px;
            height: 44px;

            background: #3d702e;
          }

          .flower-gold {
            background:
              radial-gradient(
                circle,
                #75420b 0 21%,
                #f6bd2f 23% 55%,
                #ffdb62 58%
              );
          }

          .flower-white {
            background:
              radial-gradient(
                circle,
                #f1b832 0 20%,
                #fffdf1 22% 58%,
                #e7ecd9 60%
              );
          }

          .flower-purple {
            background:
              radial-gradient(
                circle,
                #f3c740 0 18%,
                #9670c5 20% 56%,
                #7554a6 58%
              );
          }

          .flower.small {
            width: 16px;
            height: 16px;

            opacity: .85;
          }

          /*
           * ==================================
           * FOREGROUND
           * ==================================
           */

          .foreground-grass {
            position: absolute;

            z-index: 20;

            left: -3%;
            right: -3%;
            bottom: -15px;

            height: 68px;

            background:
              repeating-linear-gradient(
                78deg,
                transparent 0 8px,
                #345d27 9px 12px,
                transparent 13px 19px
              );

            opacity: .8;
          }

          .foreground-flower {
            position: absolute;

            z-index: 21;

            bottom: -7px;

            width: 36px;
            height: 36px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                #7d4508 0 20%,
                #f8c137 22% 53%,
                #ffdc64 55%
              );

            opacity: .78;
          }

          .foreground-flower-one {
            left: 3%;
          }

          .foreground-flower-two {
            left: 18%;

            bottom: -16px;

            transform:
              scale(.75);
          }

          .foreground-flower-three {
            right: 7%;

            transform:
              scale(.9);
          }

          .foreground-honeycomb {
            position: absolute;

            z-index: 19;

            right: -12px;
            bottom: 8px;

            display: flex;

            gap: 2px;

            opacity: .37;

            transform:
              rotate(-9deg);
          }

          .foreground-honeycomb span {
            display: block;

            width: 42px;
            height: 37px;

            background: #d18b18;

            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );
          }

          /*
           * ==================================
           * SUPPORT HUD
           * ==================================
           */

          .support-floating-summary {
            position: relative;

            z-index: 30;

            display: flex;

            justify-content:
              flex-end;

            gap: 7px;

            flex: 0 0 auto;

            min-height: 34px;

            margin-bottom: 4px;
          }

          .support-summary-chip {
            display: flex;

            align-items: center;

            gap: 8px;

            min-width: 112px;

            padding:
              5px 9px;

            border:
              1px solid
              rgba(
                255,
                228,
                136,
                .54
              );

            border-radius: 999px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  39,
                  69,
                  29,
                  .85
                ),
                rgba(
                  78,
                  92,
                  33,
                  .82
                )
              );

            box-shadow:
              0 6px 14px
              rgba(
                33,
                49,
                16,
                .25
              );
          }

          .support-summary-chip span {
            color: #f4dda0;

            font-size: .42rem;

            font-weight: 1000;

            letter-spacing:
              .07em;

            text-transform:
              uppercase;
          }

          .support-summary-chip strong {
            margin-left: auto;

            color: #ffe272;

            font-size: .9rem;
          }

          /*
           * ==================================
           * PHLEBOTOMY HEADER
           * ==================================
           */

          .bee-team-header {
            position: relative;

            z-index: 10;

            display: flex;
            flex: 0 0 auto;

            align-items: center;

            justify-content:
              space-between;

            gap: 14px;

            min-width: 0;
            min-height: 42px;

            margin-bottom: 5px;
          }

          .bee-team-title-area {
            display: flex;

            align-items: center;

            min-width: 0;
          }

          .bee-team-title {
            min-width: 0;
          }

          .bee-team-eyebrow {
            margin:
              0 0 1px;

            color: #8e5b09;

            font-size: .52rem;

            font-weight: 1000;

            letter-spacing:
              .16em;

            text-transform:
              uppercase;
          }

          .bee-team-header h2 {
            margin: 0;

            color: #4a2803;

            font-size:
              clamp(
                1.18rem,
                1.55vw,
                1.7rem
              );

            font-weight: 1000;

            line-height: .96;
          }

          .bee-team-subtitle {
            margin:
              2px 0 0;

            color: #795018;

            font-size: .5rem;

            font-weight: 800;
          }

          .team-summary-area {
            display: flex;

            align-items: stretch;

            gap: 6px;
          }

          .team-summary {
            display: flex;

            flex-direction: column;

            justify-content: center;

            width: 150px;

            min-height: 38px;

            padding:
              4px 9px;

            border:
              1px solid
              rgba(
                171,
                107,
                7,
                .46
              );

            border-radius: 11px;

            background:
              linear-gradient(
                145deg,
                #fffce1,
                #ffe488
              );

            text-align: right;
          }

          .team-summary span,
          .streak-summary div span {
            color: #8a5d12;

            font-size: .4rem;

            font-weight: 1000;

            text-transform:
              uppercase;
          }

          .team-summary strong {
            color: #432606;

            font-size: .82rem;
          }

          .team-summary small {
            color: #73511e;

            font-size: .42rem;

            font-weight: 700;
          }

          .streak-summary {
            display: flex;

            align-items: center;

            gap: 6px;

            min-width: 94px;

            padding:
              4px 8px;

            border:
              1px solid
              rgba(
                192,
                112,
                8,
                .45
              );

            border-radius: 11px;

            background:
              linear-gradient(
                145deg,
                #fff5c6,
                #ffd15c
              );
          }

          .streak-summary-icon {
            font-size: .82rem;
          }

          .streak-summary div {
            display: flex;

            flex-direction: column;
          }

          .streak-summary strong {
            color: #512c04;

            font-size: .86rem;
          }

          /*
           * ==================================
           * PERFORMANCE STAGE
           * ==================================
           */

          .bee-performance-stage {
            position: relative;

            z-index: 25;

            display: flex;

            flex: 1 1 0;

            min-width: 0;
            min-height: 0;

            padding: 3px;

            overflow: hidden;

            border-radius: 17px;
          }

          .phlebotomy-meadow
          .bee-performance-stage {
            border:
              1px solid
              rgba(
                156,
                96,
                6,
                .14
              );

            background:
              rgba(
                255,
                246,
                202,
                .4
              );
          }

          .support-meadow
          .bee-performance-stage {
            border:
              1px solid
              rgba(
                255,
                232,
                147,
                .24
              );

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  248,
                  199,
                  .08
                ),
                rgba(
                  48,
                  82,
                  34,
                  .13
                )
              );

            backdrop-filter:
              blur(1px);
          }

          .stage-highlight {
            position: absolute;

            border-radius: 50%;

            filter: blur(24px);

            pointer-events: none;
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
                .42
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
                .18
              );
          }

          /*
           * ==================================
           * DEFAULT GRID
           * ==================================
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

            gap: 6px;

            width: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;
          }

          /*
           * ==================================
           * MEADOW 1 — 3 x 3
           * ==================================
           */

          .phlebotomy-meadow
          .bee-performance-grid.three-row-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );

            grid-template-rows:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }

          /*
           * ==================================
           * MEADOW 2 — DYNAMIC SUPPORT GRID
           * ==================================
           */

          .support-meadow
          .bee-performance-grid.support-grid-4x2 {
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
          }

          .support-meadow
          .bee-performance-grid.support-grid-4x3 {
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
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .support-meadow
          .bee-performance-grid.support-grid-5x3 {
            grid-template-columns:
              repeat(
                5,
                minmax(
                  0,
                  1fr
                )
              );

            grid-template-rows:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .support-meadow
          .bee-performance-grid.support-grid-5x4 {
            grid-template-columns:
              repeat(
                5,
                minmax(
                  0,
                  1fr
                )
              );

            grid-template-rows:
              repeat(
                4,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .support-meadow
          .bee-performance-grid.support-grid-5x5 {
            grid-template-columns:
              repeat(
                5,
                minmax(
                  0,
                  1fr
                )
              );

            grid-template-rows:
              repeat(
                5,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .bee-performance-grid > * {
            min-width: 0;
            min-height: 0;
          }

          /*
           * ==================================
           * SHORT DESKTOP
           * ==================================
           */

          @media (
            max-height: 850px
          ) and (
            min-width: 1101px
          ) {
            .bee-team-section {
              margin-top: 4px;

              padding:
                5px 8px 6px;
            }

            .bee-team-header {
              min-height: 36px;

              margin-bottom: 3px;
            }

            .bee-team-subtitle {
              display: none;
            }

            .team-summary {
              min-height: 32px;

              padding:
                3px 7px;
            }

            .team-summary small {
              display: none;
            }

            .streak-summary {
              min-height: 32px;

              padding:
                3px 6px;
            }

            .support-floating-summary {
              min-height: 29px;

              margin-bottom: 3px;
            }

            .support-summary-chip {
              padding:
                4px 7px;
            }

            .bee-performance-stage {
              padding: 2px;
            }

            .bee-performance-grid {
              gap: 4px;
            }
          }

          /*
           * ==================================
           * RESPONSIVE
           * ==================================
           */

          @media (
            max-width: 1100px
          ) {
            .bee-team-section {
              flex: none;

              height: auto;

              min-height: 560px;

              overflow: visible;
            }

            .bee-performance-stage,
            .bee-performance-grid {
              overflow: visible;
            }

            .bee-performance-grid,
            .phlebotomy-meadow
            .bee-performance-grid.three-row-grid,
            .support-meadow
            .bee-performance-grid.support-grid-4x2,
            .support-meadow
            .bee-performance-grid.support-grid-4x3,
            .support-meadow
            .bee-performance-grid.support-grid-5x3,
            .support-meadow
            .bee-performance-grid.support-grid-5x4,
            .support-meadow
            .bee-performance-grid.support-grid-5x5 {
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
            }
          }

          @media (
            max-width: 700px
          ) {
            .bee-team-section {
              min-height: 900px;
            }

            .bee-team-header {
              flex-direction:
                column;

              align-items:
                stretch;
            }

            .team-summary-area {
              width: 100%;
            }

            .team-summary {
              flex: 1;

              width: auto;

              text-align: left;
            }

            .support-floating-summary {
              justify-content:
                stretch;
            }

            .support-summary-chip {
              flex: 1;
            }

            .bee-performance-grid,
            .phlebotomy-meadow
            .bee-performance-grid.three-row-grid,
            .support-meadow
            .bee-performance-grid.support-grid-4x2,
            .support-meadow
            .bee-performance-grid.support-grid-4x3,
            .support-meadow
            .bee-performance-grid.support-grid-5x3,
            .support-meadow
            .bee-performance-grid.support-grid-5x4,
            .support-meadow
            .bee-performance-grid.support-grid-5x5 {
              grid-template-columns:
                1fr;

              grid-template-rows:
                auto;
            }
          }

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            .pollen {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}