import Link from "next/link";

import AdminShell from "@/app/settings/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import {
  auditWeeklyFeasibility,
} from "@/app/lib/scheduling/weeklyFeasibilityEngine";
import {
  buildStaffingRequirements,
  getCoverageWeeks,
} from "@/app/lib/scheduling/staffingRequirementsEngine";
import {
  startOfOperationalWeek,
} from "@/app/lib/scheduling/workforceConstraintEngine";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  week?: string;
}>;

function parseWeek(value?: string) {
  if (!value) {
    return startOfOperationalWeek(new Date());
  }

  const parsed = new Date(
    `${value}T00:00:00.000Z`,
  );

  return Number.isNaN(parsed.getTime())
    ? startOfOperationalWeek(new Date())
    : startOfOperationalWeek(parsed);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function displayDepartment(value: string) {
  return value.replace(
    "Donor Floor - Phlebotomist",
    "Floor (Phleb required)",
  );
}

export default async function WeeklyFeasibilityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const weekStart = parseWeek(params.week);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(
    weekEnd.getUTCDate() + 6,
  );

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
    workers,
    timeOff,
    patternEntries,
  ] = await Promise.all([
    prisma.collector.findMany({
      where: {
        active: true,
      },
      include: {
        roleAssignments: true,
        employmentProfile: true,
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
            dataImportId:
              latestArrivalImport.id,
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

  const requirements =
    buildStaffingRequirements(
      patternEntries,
      coverageWeeks,
    );

  const result = auditWeeklyFeasibility({
    weekStart,
    workers,
    timeOff,
    requirements,
  });

  const previousWeek = new Date(weekStart);
  previousWeek.setUTCDate(
    previousWeek.getUTCDate() - 7,
  );

  const nextWeek = new Date(weekStart);
  nextWeek.setUTCDate(
    nextWeek.getUTCDate() + 7,
  );

  const ready =
    result.failedIntervals.length === 0 &&
    result.unprofiledWorkers.length === 0 &&
    result.maxHoursFeasible;

  const firstFailures =
    result.failedIntervals.slice(0, 20);

  return (
    <AdminShell
      pageTitle="Weekly Feasibility"
      pageDescription="S3B.2 — test whether the actual qualified workforce can satisfy every 30-minute staffing requirement before HIVE generates a schedule."
      activePath="/settings/scheduling"
    >
      <div className="page">
        <div className="top-links">
          <Link
            href="/settings/scheduling/workforce"
          >
            ← Workforce Constraints
          </Link>

          <Link
            href="/settings/scheduling"
          >
            Scheduling Command Center
          </Link>
        </div>

        <section className="hero">
          <div>
            <p className="eyebrow">
              Scheduling Intelligence • S3B.2
            </p>

            <h2>
              Can this workforce cover the week?
            </h2>

            <p>
              HIVE now prevents one worker from
              satisfying two departments in the same
              30-minute interval. PTO and role
              qualifications are hard constraints.
            </p>
          </div>

          <div
            className={`readiness ${
              ready ? "ready" : "blocked"
            }`}
          >
            <span>Solver Status</span>
            <strong>
              {ready
                ? "FEASIBLE"
                : "NOT READY"}
            </strong>
            <small>
              {result.failedIntervals.length} failed
              intervals
            </small>
          </div>
        </section>

        <section className="week-nav">
          <Link
            href={`/settings/scheduling/feasibility?week=${isoDate(
              previousWeek,
            )}`}
          >
            ← Previous
          </Link>

          <div>
            <span>Operational Week</span>
            <strong>
              {formatDate(weekStart)} –{" "}
              {formatDate(weekEnd)}
            </strong>
          </div>

          <Link
            href={`/settings/scheduling/feasibility?week=${isoDate(
              nextWeek,
            )}`}
          >
            Next →
          </Link>
        </section>

        <section className="metrics">
          <Metric
            label="Required Coverage"
            value={`${result.requiredCoverageHours.toFixed(
              1,
            )} hrs`}
          />

          <Metric
            label="FTE/PTE Minimum"
            value={`${result.rosterMinimumPaidHours.toFixed(
              1,
            )} hrs`}
          />

          <Metric
            label="Roster Target"
            value={`${result.rosterTargetPaidHours.toFixed(
              1,
            )} hrs`}
          />

          <Metric
            label="Roster Maximum"
            value={`${result.rosterMaximumPaidHours.toFixed(
              1,
            )} hrs`}
            warn={!result.maxHoursFeasible}
          />

          <Metric
            label="Unprofiled Workers"
            value={String(
              result.unprofiledWorkers.length,
            )}
            warn={
              result.unprofiledWorkers.length > 0
            }
          />

          <Metric
            label="Failed Intervals"
            value={String(
              result.failedIntervals.length,
            )}
            warn={
              result.failedIntervals.length > 0
            }
          />
        </section>

        {result.unprofiledWorkers.length > 0 ? (
          <section className="warning">
            <strong>
              Employment profiles still required
            </strong>

            <p>
              {result.unprofiledWorkers
                .map(
                  (worker) =>
                    worker.preferredName ||
                    worker.name,
                )
                .join(", ")}
            </p>
          </section>
        ) : null}

        {!result.maxHoursFeasible ? (
          <section className="warning">
            <strong>
              Weekly labor-capacity warning
            </strong>

            <p>
              Required coverage exceeds the total
              maximum paid hours stored across the
              active worker profiles.
            </p>
          </section>
        ) : null}

        <section className="results">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                Interval Solver
              </p>

              <h2>
                {result.failedIntervals.length === 0
                  ? "Every interval has a legal qualified matching."
                  : "Intervals requiring attention"}
              </h2>
            </div>

            <span>
              Showing{" "}
              {firstFailures.length === 0
                ? "pass"
                : `first ${firstFailures.length}`}
            </span>
          </div>

          {firstFailures.length === 0 ? (
            <div className="success">
              <strong>
                Qualification + PTO matching passed.
              </strong>

              <p>
                HIVE found a unique worker for every
                required role in every 30-minute
                interval without double-counting
                anyone.
              </p>
            </div>
          ) : (
            <div className="failure-list">
              {firstFailures.map(
                (interval) => (
                  <article
                    key={`${interval.dayOfWeek}-${interval.minuteOfDay}`}
                  >
                    <div>
                      <strong>
                        {interval.dayName} •{" "}
                        {interval.time}
                      </strong>

                      <small>
                        Need{" "}
                        {interval.requiredSlots} unique
                        workers
                      </small>
                    </div>

                    <div className="missing">
                      {interval.unfilled.length === 0
                        ? "No perfect cross-role matching"
                        : interval.unfilled
                            .map((slot) =>
                              displayDepartment(
                                slot.department,
                              ),
                            )
                            .join(", ")}
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="guardrail">
          <p className="eyebrow">
            What S3B.2 proves
          </p>

          <h2>
            Feasibility before generation.
          </h2>

          <p>
            This solver now enforces unique
            simultaneous workers, PTO, role
            eligibility, the mandatory Phlebotomist
            floor position, and the roster's weekly
            maximum labor envelope. It still does
            not choose final shift start/end times,
            lunch placement, weekend rotation or
            opening/closing assignment. Those are
            the optimization decisions S3C will make
            while generating the actual schedule.
          </p>
        </section>

        <style>{`
          .page { display: grid; gap: 18px; }
          .top-links { display:flex; justify-content:space-between; gap:12px; }
          .top-links a, .week-nav a { color:#805c0b; font-weight:850; text-decoration:none; }

          .hero, .week-nav, .metrics, .results, .guardrail, .warning {
            border:1px solid #e7d8a7;
            border-radius:20px;
            background:#fff;
          }

          .hero {
            display:flex;
            justify-content:space-between;
            gap:22px;
            align-items:center;
            padding:22px;
            background:linear-gradient(135deg,#fffdf5,#fff5c9);
          }

          .eyebrow {
            margin:0 0 5px;
            color:#9a6b05;
            font-size:10px;
            font-weight:900;
            text-transform:uppercase;
            letter-spacing:.08em;
          }

          h2 { margin:0; color:#30250f; }
          .hero p:last-child, .guardrail p:last-child { color:#6b6251; line-height:1.55; max-width:760px; }

          .readiness {
            min-width:180px;
            padding:14px;
            border-radius:14px;
            display:grid;
            gap:3px;
          }
          .readiness.ready { background:#dcfce7; color:#166534; }
          .readiness.blocked { background:#fee2e2; color:#991b1b; }
          .readiness span, .readiness small { font-size:10px; }
          .readiness strong { font-size:20px; }

          .week-nav {
            display:grid;
            grid-template-columns:120px 1fr 120px;
            align-items:center;
            padding:13px 16px;
            text-align:center;
          }
          .week-nav > a:first-child { text-align:left; }
          .week-nav > a:last-child { text-align:right; }
          .week-nav span { display:block; color:#8b806b; font-size:9px; font-weight:900; text-transform:uppercase; }
          .week-nav strong { color:#3e2d08; }

          .metrics {
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(145px,1fr));
            overflow:hidden;
          }
          .metric { padding:13px; border-right:1px solid #eee8dc; }
          .metric span { display:block; color:#7a7161; font-size:9px; font-weight:900; text-transform:uppercase; }
          .metric strong { display:block; margin-top:4px; color:#30250f; font-size:18px; }
          .metric.warn { background:#fff7d6; }

          .warning { padding:14px 16px; background:#fff7d6; color:#79550a; }
          .warning p { margin:5px 0 0; }

          .results, .guardrail { padding:18px; }
          .section-heading { display:flex; justify-content:space-between; gap:14px; align-items:end; }
          .section-heading > span { color:#7a7161; font-size:10px; }

          .success {
            margin-top:14px;
            padding:14px;
            border-radius:13px;
            background:#ecfdf5;
            color:#166534;
          }
          .success p { margin:5px 0 0; }

          .failure-list { display:grid; gap:8px; margin-top:14px; }
          .failure-list article {
            display:flex;
            justify-content:space-between;
            gap:14px;
            align-items:center;
            padding:11px 12px;
            border-radius:11px;
            background:#fff7f7;
            border:1px solid #fecaca;
          }
          .failure-list strong, .failure-list small { display:block; }
          .failure-list small { color:#7a7161; margin-top:2px; }
          .missing { color:#991b1b; font-size:11px; font-weight:850; text-align:right; }

          @media (max-width:760px) {
            .hero { flex-direction:column; align-items:stretch; }
            .readiness { min-width:0; }
            .week-nav { grid-template-columns:1fr; gap:7px; }
            .week-nav > a:first-child, .week-nav > a:last-child { text-align:center; }
            .failure-list article { align-items:flex-start; flex-direction:column; }
            .missing { text-align:left; }
          }
        `}</style>
      </div>
    </AdminShell>
  );
}

function Metric({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className={`metric ${warn ? "warn" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
