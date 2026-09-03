import Link from "next/link";

import AdminShell from "@/app/settings/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import {
  buildWorkforceAudit,
  startOfOperationalWeek,
  workforceConstraintMetadata,
} from "@/app/lib/scheduling/workforceConstraintEngine";
import {
  buildStaffingRequirements,
  getCoverageWeeks,
} from "@/app/lib/scheduling/staffingRequirementsEngine";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  week?: string;
}>;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function parseWeek(value: string | undefined) {
  if (!value) return startOfOperationalWeek(new Date());

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfOperationalWeek(new Date());
  }

  return startOfOperationalWeek(parsed);
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function WorkforceConstraintPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const weekStart = parseWeek(params.week);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const latestArrivalImport =
    await prisma.intelligenceDataImport.findFirst({
      where: {
        status: "SUCCESS",
        dataSource: {
          key: "ARRIVAL_PRODUCTION_PATTERNS",
        },
      },
      orderBy: {
        importedAt: "desc",
      },
    });

  const [
    collectors,
    timeOff,
    patternEntries,
  ] = await Promise.all([
    prisma.collector.findMany({
      where: {
        active: true,
      },
      include: {
        roleAssignments: true,
      },
      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.timeOffRequest.findMany({
      where: {
        startDate: {
          lte: weekEnd,
        },
        endDate: {
          gte: weekStart,
        },
      },
      select: {
        collectorId: true,
        startDate: true,
        endDate: true,
      },
    }),

    latestArrivalImport
      ? prisma.operationalPatternEntry.findMany({
          where: {
            dataImportId: latestArrivalImport.id,
          },
          orderBy: [
            {
              dayOfWeek: "asc",
            },
            {
              minuteOfDay: "asc",
            },
          ],
          select: {
            dayOfWeek: true,
            time: true,
            minuteOfDay: true,
            visits: true,
            units: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const coverageWeeks = getCoverageWeeks(
    latestArrivalImport?.periodStart,
    latestArrivalImport?.periodEnd,
  );

  const intervalRequirements =
    buildStaffingRequirements(
      patternEntries,
      coverageWeeks,
    );

  // S3B needs the highest requirement HIVE could demand during each day.
  // It does NOT total departments together because one person cannot be
  // simultaneously counted as productive capacity in multiple areas.
  const requirementsByDay = new Map<
    number,
    {
      dayOfWeek: number;
      reception: number;
      msa: number;
      floor: number;
      processing: number;
      leadership: number;
    }
  >();

  for (const row of intervalRequirements) {
    const current =
      requirementsByDay.get(row.dayOfWeek) ?? {
        dayOfWeek: row.dayOfWeek,
        reception: 0,
        msa: 0,
        floor: 0,
        processing: 0,
        leadership: 0,
      };

    current.reception = Math.max(
      current.reception,
      row.receptionBaseline,
    );
    current.msa = Math.max(
      current.msa,
      row.msaMinimum,
    );
    current.floor = Math.max(
      current.floor,
      row.floorMinimum,
    );
    current.processing = Math.max(
      current.processing,
      row.processingMinimum,
    );
    current.leadership = Math.max(
      current.leadership,
      row.leadershipMinimum,
    );

    requirementsByDay.set(row.dayOfWeek, current);
  }

  const audit = buildWorkforceAudit({
    weekStart,
    collectors,
    timeOff,
    requirementsByDay,
  });

  const readyDays = audit.filter((day) => day.isReady).length;
  const gapDays = audit.length - readyDays;

  const previousWeek = new Date(weekStart);
  previousWeek.setUTCDate(previousWeek.getUTCDate() - 7);

  const nextWeek = new Date(weekStart);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);

  return (
    <AdminShell
      pageTitle="Workforce Constraints"
      pageDescription="S3B — overlay the real HIVE roster, role eligibility, cross-training and Time Off against the validated S3A requirements."
      activePath="/settings/scheduling"
    >
      <div className="page">
        <div className="top-links">
          <Link
            href="/settings/scheduling/requirements"
            className="back"
          >
            ← Staffing Requirements
          </Link>

          <Link
            href="/settings/scheduling"
            className="secondary-link"
          >
            Scheduling Command Center
          </Link>
        </div>

        <section className="hero">
          <div>
            <p className="eyebrow">
              Scheduling Intelligence • S3B
            </p>

            <h2>
              Can the qualified workforce satisfy the requirement?
            </h2>

            <p>
              S3A remains untouched. If HIVE needs three people
              and only two qualified workers are available,
              S3B reports a gap — it never lowers the requirement.
            </p>
          </div>

          <div className="hero-status">
            <span>Week Readiness</span>
            <strong>
              {gapDays === 0 ? "READY" : `${gapDays} GAP DAY${gapDays === 1 ? "" : "S"}`}
            </strong>
            <small>{readyDays}/7 days pass the qualification + PTO audit</small>
          </div>
        </section>

        <section className="week-nav">
          <Link
            href={`/settings/scheduling/workforce?week=${isoDate(
              previousWeek,
            )}`}
          >
            ← Previous
          </Link>

          <div>
            <span>Operational Week</span>
            <strong>
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </strong>
          </div>

          <Link
            href={`/settings/scheduling/workforce?week=${isoDate(
              nextWeek,
            )}`}
          >
            Next →
          </Link>
        </section>

        <section className="constraint-grid">
          {Object.entries(workforceConstraintMetadata).map(
            ([key, item]) => (
              <article className="constraint-card" key={key}>
                <div>
                  <h3>{labelForConstraint(key)}</h3>
                  <span className={`state state-${slug(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p>{item.text}</p>
              </article>
            ),
          )}
        </section>

        <section className="audit-grid">
          {audit.map((day) => (
            <article
              key={day.date.toISOString()}
              className={`day-card ${
                day.isReady ? "ready" : "gap"
              }`}
            >
              <header>
                <div>
                  <p className="eyebrow">{formatShortDate(day.date)}</p>
                  <h2>{day.dayName}</h2>
                </div>

                <span className="day-status">
                  {day.isReady ? "POOL READY" : "QUALIFICATION GAP"}
                </span>
              </header>

              <div className="role-table">
                <RoleRow
                  label="Reception"
                  required={day.requirements.reception}
                  workers={day.available.reception}
                  gap={day.gaps.reception}
                />

                <RoleRow
                  label="MSA"
                  required={day.requirements.msa}
                  workers={day.available.msa}
                  gap={day.gaps.msa}
                />

                <RoleRow
                  label="Donor Floor"
                  required={day.requirements.floor}
                  workers={day.available.floor}
                  gap={day.gaps.floor}
                />

                <RoleRow
                  label="Processing"
                  required={day.requirements.processing}
                  workers={day.available.processing}
                  gap={day.gaps.processing}
                />

                <RoleRow
                  label="Leadership"
                  required={day.requirements.leadership}
                  workers={day.available.leadership}
                  gap={day.gaps.leadership}
                />
              </div>

              <div className="pto">
                <strong>Time Off</strong>
                {day.unavailable.length === 0 ? (
                  <span>None affecting this date</span>
                ) : (
                  <div className="chips">
                    {day.unavailable.map((worker) => (
                      <span key={worker.id}>
                        {worker.preferredName || worker.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="guardrail">
          <p className="eyebrow">S3B Guardrail</p>
          <h2>This is workforce feasibility, not a generated schedule.</h2>
          <p>
            A worker appearing in Reception and MSA eligibility does
            <b> not</b> mean HIVE counts that person twice in an
            interval. This screen asks whether the qualified pools
            exist after PTO. Employee assignment, paid-hour limits,
            lunches, shift timing, open/close rotation and
            simultaneous-capacity solving belong to the next S3B
            layer after worker employment profiles are available.
          </p>
        </section>

        <style>{`
          .page { display: grid; gap: 20px; }
          .top-links { display: flex; justify-content: space-between; gap: 12px; }
          .back, .secondary-link, .week-nav a {
            color: #805c0b;
            font-weight: 850;
            text-decoration: none;
          }

          .hero, .week-nav, .constraint-card, .day-card, .guardrail {
            border: 1px solid #e7d8a7;
            border-radius: 20px;
            background: #fff;
            box-shadow: 0 10px 26px rgba(84,58,9,.06);
          }

          .hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            padding: 24px;
            background:
              radial-gradient(circle at 86% 10%, rgba(255,215,70,.35), transparent 27%),
              linear-gradient(135deg,#fffdf5,#fff5c9);
          }

          .eyebrow {
            margin: 0 0 5px;
            color: #9a6b05;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .09em;
            text-transform: uppercase;
          }

          h2, h3 { color: #30250f; }
          .hero h2, .day-card h2, .guardrail h2 { margin: 0; }
          .hero p:last-child, .guardrail p:last-child {
            max-width: 780px;
            color: #6b6251;
            line-height: 1.6;
          }

          .hero-status {
            min-width: 210px;
            padding: 16px;
            border-radius: 15px;
            background: #3f2d09;
            color: white;
          }
          .hero-status span, .hero-status small { display: block; }
          .hero-status span {
            font-size: 10px;
            font-weight: 850;
            opacity: .72;
            text-transform: uppercase;
          }
          .hero-status strong {
            display: block;
            margin-top: 4px;
            font-size: 21px;
          }
          .hero-status small { margin-top: 4px; opacity: .76; }

          .week-nav {
            display: grid;
            grid-template-columns: 120px 1fr 120px;
            align-items: center;
            padding: 14px 18px;
            text-align: center;
          }
          .week-nav > a:last-child { text-align: right; }
          .week-nav > a:first-child { text-align: left; }
          .week-nav span {
            display: block;
            color: #8b806b;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
          }
          .week-nav strong { color: #3e2d08; }

          .constraint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit,minmax(225px,1fr));
            gap: 12px;
          }
          .constraint-card { padding: 15px; }
          .constraint-card > div {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }
          .constraint-card h3 { margin: 0; font-size: 14px; }
          .constraint-card p {
            margin: 8px 0 0;
            color: #6b7280;
            font-size: 12px;
            line-height: 1.5;
          }

          .state {
            padding: 4px 7px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 900;
          }
          .state-active, .state-hard {
            background: #dcfce7;
            color: #166534;
          }
          .state-pending-data {
            background: #fef3c7;
            color: #92400e;
          }
          .state-not-yet {
            background: #f3f4f6;
            color: #4b5563;
          }

          .audit-grid { display: grid; gap: 16px; }
          .day-card { overflow: hidden; }
          .day-card.ready { border-left: 5px solid #22c55e; }
          .day-card.gap { border-left: 5px solid #ef4444; }
          .day-card header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 18px;
            background: #fffaf0;
          }
          .day-status {
            padding: 5px 8px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #4b5563;
            font-size: 9px;
            font-weight: 900;
          }
          .ready .day-status {
            background: #dcfce7;
            color: #166534;
          }
          .gap .day-status {
            background: #fee2e2;
            color: #991b1b;
          }

          .role-table { display: grid; }
          .role-row {
            display: grid;
            grid-template-columns: 145px 120px 1fr 110px;
            gap: 12px;
            align-items: center;
            padding: 11px 18px;
            border-top: 1px solid #eee8dc;
          }
          .role-name { font-weight: 900; color: #3f2d09; }
          .counts {
            color: #6b7280;
            font-size: 12px;
          }
          .counts strong { color: #30250f; font-size: 15px; }
          .workers { display: flex; flex-wrap: wrap; gap: 5px; }
          .workers span, .chips span {
            padding: 4px 7px;
            border-radius: 999px;
            background: #faf3df;
            color: #71510c;
            font-size: 10px;
            font-weight: 800;
          }
          .gap-label, .ok-label {
            justify-self: end;
            font-size: 10px;
            font-weight: 900;
          }
          .gap-label { color: #b91c1c; }
          .ok-label { color: #15803d; }

          .pto {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 18px;
            border-top: 1px solid #eee8dc;
            background: #fcfbf7;
            color: #6b7280;
            font-size: 12px;
          }
          .pto strong { color: #3f2d09; }
          .chips { display: flex; flex-wrap: wrap; gap: 5px; }

          .guardrail { padding: 20px; }

          @media (max-width: 800px) {
            .hero { flex-direction: column; align-items: stretch; }
            .hero-status { min-width: 0; }
            .week-nav { grid-template-columns: 1fr; gap: 8px; }
            .week-nav > a:first-child,
            .week-nav > a:last-child { text-align: center; }
            .role-row {
              grid-template-columns: 1fr 1fr;
            }
            .workers { grid-column: 1 / -1; }
            .gap-label, .ok-label { justify-self: start; }
          }
        `}</style>
      </div>
    </AdminShell>
  );
}

function RoleRow({
  label,
  required,
  workers,
  gap,
}: {
  label: string;
  required: number;
  workers: {
    id: number;
    name: string;
    preferredName?: string | null;
  }[];
  gap: number;
}) {
  return (
    <div className="role-row">
      <div className="role-name">{label}</div>

      <div className="counts">
        Need <strong>{required}</strong> • Pool{" "}
        <strong>{workers.length}</strong>
      </div>

      <div className="workers">
        {workers.length === 0 ? (
          <span>None available</span>
        ) : (
          workers.map((worker) => (
            <span key={worker.id}>
              {worker.preferredName || worker.name}
            </span>
          ))
        )}
      </div>

      {gap > 0 ? (
        <div className="gap-label">GAP {gap}</div>
      ) : (
        <div className="ok-label">QUALIFIED</div>
      )}
    </div>
  );
}

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

function labelForConstraint(key: string) {
  switch (key) {
    case "qualification":
      return "Role Eligibility";
    case "timeOff":
      return "Time Off";
    case "employmentHours":
      return "FTE / PTE Hours";
    case "shiftPattern":
      return "Shift Pattern";
    case "assignment":
      return "Employee Assignment";
    default:
      return key;
  }
}
