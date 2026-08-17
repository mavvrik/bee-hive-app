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

  return (
    <section className="bee-team-section">
      <header className="bee-team-header">
        <div className="bee-team-title">
          <p className="bee-team-eyebrow">
            The Hive Workforce
          </p>

          <h2>
            Meet the Worker Bees
          </h2>
        </div>

        <div className="team-summary">
          <span>
            Active Team
          </span>

          <strong>
            {activeBees.length} Bees
          </strong>

          <small>
            Riviera Beach 115
          </small>
        </div>
      </header>

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

              isManagement={
                bee.role ===
                  "Management" ||
                bee.name ===
                  "Management Team"
              }
            />
          ),
        )}
      </div>

      <style>
        {`
          .bee-team-section {
            display: flex;
            flex: 1 1 0;
            flex-direction: column;

            width: 100%;
            height: auto;

            min-width: 0;
            min-height: 0;

            margin-top: 10px;
            padding: 9px 14px 11px;

            overflow: hidden;

            border:
              1px solid #dfc36c;

            border-radius: 20px;

            background:
              linear-gradient(
                180deg,
                rgba(
                  255,
                  255,
                  255,
                  0.98
                ),
                rgba(
                  255,
                  246,
                  207,
                  0.96
                )
              );

            box-shadow:
              0 10px 24px
              rgba(
                98,
                70,
                10,
                0.12
              );

            box-sizing:
              border-box;
          }

          .bee-team-header {
            display: flex;
            flex: 0 0 auto;

            align-items: center;
            justify-content:
              space-between;

            gap: 16px;

            min-width: 0;
            min-height: 42px;

            margin-bottom: 7px;
          }

          .bee-team-title {
            min-width: 0;
          }

          .bee-team-eyebrow {
            margin: 0 0 3px;

            color: #9a6d10;

            font-size: clamp(
              0.58rem,
              0.67vw,
              0.72rem
            );

            font-weight: 900;

            letter-spacing:
              0.14em;

            text-transform:
              uppercase;
          }

          .bee-team-header h2 {
            margin: 0;

            overflow: hidden;

            color: #3c2a08;

            font-size: clamp(
              1.25rem,
              1.55vw,
              1.7rem
            );

            line-height: 1;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .team-summary {
            display: flex;
            flex: 0 0 auto;

            flex-direction:
              column;

            justify-content:
              center;

            width: 190px;
            min-height: 42px;

            padding: 5px 11px;

            overflow: hidden;

            border:
              1px solid #d99b0b;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #fff8d2,
                #ffe99a
              );

            text-align: right;

            box-sizing:
              border-box;
          }

          .team-summary span {
            overflow: hidden;

            color: #8c650c;

            font-size: 0.51rem;
            font-weight: 900;

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
            overflow: hidden;

            color: #382605;

            font-size: 0.88rem;
            line-height: 1.08;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .team-summary small {
            overflow: hidden;

            color: #725617;

            font-size: 0.59rem;
            font-weight: 700;
            line-height: 1.08;

            text-overflow:
              ellipsis;

            white-space:
              nowrap;
          }

          .bee-performance-grid {
            display: grid;
            flex: 1 1 0;

            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            grid-template-rows:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 8px;

            width: 100%;

            min-width: 0;
            min-height: 0;

            overflow: hidden;
          }

          .bee-performance-grid > * {
            min-width: 0;
            min-height: 0;
          }

          @media (
            max-width: 1100px
          ) {
            .bee-team-section {
              flex: none;

              height: auto;
              min-height: 560px;

              overflow: visible;
            }

            .bee-performance-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );

              grid-template-rows:
                auto;

              overflow: visible;
            }
          }

          @media (
            max-width: 700px
          ) {
            .bee-team-section {
              min-height: 900px;
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

            .team-summary {
              width: 100%;

              text-align:
                left;
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