import Link from "next/link";

import AdminShell from "@/app/settings/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import {
  generateDraftSchedule,
} from "@/app/lib/scheduling/scheduleGenerator";
import {
  buildStaffingRequirements,
  getCoverageWeeks,
} from "@/app/lib/scheduling/staffingRequirementsEngine";
import {
  buildLswStaffingRequirements,
  lswFormulaReference,
} from "@/app/lib/scheduling/lswStaffingRequirementsEngine";
import {
  startOfOperationalWeek,
} from "@/app/lib/scheduling/workforceConstraintEngine";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  week?: string;
  mode?: string;
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

function modeHref({
  week,
  mode,
}: {
  week: Date;
  mode: "hive" | "lsw";
}) {
  return `/settings/scheduling/generate?week=${isoDate(
    week,
  )}&mode=${mode}`;
}

export default async function GenerateSchedulePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;

  const mode: "hive" | "lsw" =
    params.mode === "lsw" ? "lsw" : "hive";

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

  const hiveRequirements =
    buildStaffingRequirements(
      patternEntries,
      coverageWeeks,
    );

  /*
   * Temporary comparison mode requested by management.
   *
   * LSW mode uses the verified LSW workbook formulas for the roles
   * the workbook itself derives from donor arrivals.
   *
   * projectedVolumeChange remains 0% for this first comparison,
   * matching "Constant (0%)" in the corporate workbook.
   */
  const lswRequirements =
    buildLswStaffingRequirements({
      observations: patternEntries,
      coverageWeeks,
      projectedVolumeChange: 0,
    });

  const selectedRequirements =
    mode === "lsw"
      ? lswRequirements
      : hiveRequirements;

  const result = generateDraftSchedule({
    weekStart,
    workers,
    timeOff,
    requirements: selectedRequirements,
  });

  const previousWeek = new Date(weekStart);
  previousWeek.setUTCDate(
    previousWeek.getUTCDate() - 7,
  );

  const nextWeek = new Date(weekStart);
  nextWeek.setUTCDate(
    nextWeek.getUTCDate() + 7,
  );

  const groupedByDay = Array.from(
    { length: 7 },
    (_, dayOfWeek) => ({
      dayOfWeek,
      shifts: result.shifts.filter(
        (shift) =>
          shift.dayOfWeek === dayOfWeek,
      ),
    }),
  );

  return (
    <AdminShell
      pageTitle="Generate Intelligent Schedule"
      pageDescription="Compare HIVE Intelligence against a temporary LSW corporate-workbook baseline."
      activePath="/settings/scheduling"
    >
      <div className="page">
        <div className="top-links">
          <Link href="/settings/scheduling/feasibility">
            ← Weekly Feasibility
          </Link>

          <Link href="/settings/scheduling">
            Scheduling Command Center
          </Link>
        </div>

        <section className="mode-panel">
          <div>
            <p className="eyebrow">
              Temporary Comparison Mode
            </p>

            <h2>
              Which scheduling logic should drive
              this draft?
            </h2>
          </div>

          <div className="mode-buttons">
            <Link
              href={modeHref({
                week: weekStart,
                mode: "hive",
              })}
              className={
                mode === "hive"
                  ? "mode-button selected"
                  : "mode-button"
              }
            >
              🐝 HIVE Intelligence
            </Link>

            <Link
              href={modeHref({
                week: weekStart,
                mode: "lsw",
              })}
              className={
                mode === "lsw"
                  ? "mode-button selected"
                  : "mode-button"
              }
            >
              📊 LSW Baseline
            </Link>
          </div>
        </section>

        <section
          className={`hero ${
            mode === "lsw"
              ? "lsw-hero"
              : ""
          }`}
        >
          <div>
            <p className="eyebrow">
              {mode === "lsw"
                ? "LSW Corporate Workbook Baseline"
                : "HIVE Scheduling Intelligence"}
            </p>

            <h2>
              {mode === "lsw"
                ? "LSW Formula-Driven Draft"
                : "HIVE Generated Draft Schedule"}
            </h2>

            <p>
              {mode === "lsw"
                ? "Reception and Donor Floor demand are being calculated from the verified formulas in the supplied LSW Scheduling Tool workbook. HIVE is only translating those calculated requirements into actual roster assignments because the workbook itself does not automatically generate a complete employee schedule."
                : "The HIVE model uses the operational rules we designed together: center-opening coverage, mandatory roles, qualifications, PTO, workforce profiles, and the developing HIVE demand model."}
            </p>
          </div>

          <div
            className={`status ${
              result.warnings.length === 0
                ? "clean"
                : "review"
            }`}
          >
            <span>Draft Status</span>

            <strong>
              {result.warnings.length === 0
                ? "CLEAN DRAFT"
                : `${result.warnings.length} REVIEW ITEM${
                    result.warnings.length === 1
                      ? ""
                      : "S"
                  }`}
            </strong>
          </div>
        </section>

        {mode === "lsw" ? (
          <section className="lsw-reference">
            <div>
              <span>
                Forecast Donors
              </span>
              <strong>
                {lswFormulaReference.forecast}
              </strong>
            </div>

            <div>
              <span>Reception</span>
              <strong>
                {lswFormulaReference.reception}
              </strong>
            </div>

            <div>
              <span>Donor Floor</span>
              <strong>
                {lswFormulaReference.donorFloor}
              </strong>
            </div>

            <div>
              <span>
                Other Departments
              </span>
              <strong>
                {lswFormulaReference.otherRoles}
              </strong>
            </div>
          </section>
        ) : (
          <section className="locked-rules">
            <Rule
              label="Mon–Fri Reception"
              text="5:00 AM opener • through final screening, normal max 7:30 PM"
            />

            <Rule
              label="Mon–Fri Floor"
              text="5:30 AM opener • 2-person minimum through final disconnect"
            />

            <Rule
              label="Mon–Fri MSA"
              text="5:50 AM opener • cannot be zero while operating"
            />

            <Rule
              label="Mon–Fri Processing"
              text="5:50 AM opener • closing tail after final donation"
            />

            <Rule
              label="Mon–Fri Leadership"
              text="5:00 AM opener • leader remains through final donor + reports"
            />
          </section>
        )}

        {mode === "lsw" ? (
          <section className="comparison-warning">
            <strong>
              Important comparison behavior
            </strong>

            <p>
              Pure LSW calculation mode does not
              invent MSA, Processing, or Leadership
              requirements that the corporate
              workbook does not mathematically
              derive. Those were manager-entered
              schedule areas in the workbook.
              Therefore this mode may look
              intentionally incomplete compared
              with HIVE. That difference is part of
              what we are testing.
            </p>
          </section>
        ) : null}

        <section className="week-nav">
          <Link
            href={modeHref({
              week: previousWeek,
              mode,
            })}
          >
            ← Previous
          </Link>

          <div>
            <span>Generated Week</span>
            <strong>
              {formatDate(weekStart)} –{" "}
              {formatDate(weekEnd)}
            </strong>
          </div>

          <Link
            href={modeHref({
              week: nextWeek,
              mode,
            })}
          >
            Next →
          </Link>
        </section>

        {result.warnings.length > 0 ? (
          <section className="warnings">
            <p className="eyebrow">
              Management Review
            </p>

            <h2>Draft warnings</h2>

            <div className="warning-list">
              {result.warnings.map(
                (warning, index) => (
                  <div
                    key={`${warning.dayName}-${index}`}
                  >
                    <strong>
                      {warning.dayName}
                    </strong>

                    <span>
                      {warning.message}
                    </span>
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}

        <section className="schedule">
          {groupedByDay.map((day) => (
            <article
              key={day.dayOfWeek}
              className="day-card"
            >
              <header>
                <h2>
                  {
                    [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][day.dayOfWeek]
                  }
                </h2>

                <span>
                  {day.shifts.length} assigned
                  shifts
                </span>
              </header>

              {day.shifts.length === 0 ? (
                <div className="empty">
                  No generated shifts.
                </div>
              ) : (
                <div className="shift-list">
                  {day.shifts
                    .sort(
                      (a, b) =>
                        a.startMinute -
                        b.startMinute,
                    )
                    .map((shift) => (
                      <div
                        className="shift-row"
                        key={`${shift.dayOfWeek}-${shift.workerId}-${shift.role}`}
                      >
                        <div className="worker">
                          <strong>
                            {shift.workerName}
                          </strong>

                          <span>
                            {shift.role} •{" "}
                            {shift.orientation}
                          </span>
                        </div>

                        <div className="times">
                          <strong>
                            {shift.startTime} –{" "}
                            {shift.endTime}
                          </strong>

                          <span>
                            {shift.scheduledHours.toFixed(
                              1,
                            )}{" "}
                            scheduled •{" "}
                            {shift.paidHours.toFixed(
                              1,
                            )}{" "}
                            paid
                          </span>
                        </div>

                        <div className="lunch">
                          <span>Lunch</span>

                          <strong>
                            {shift.lunchStartTime
                              ? `${shift.lunchStartTime} • 30m`
                              : "Review"}
                          </strong>
                        </div>

                        <div
                          className={`source ${shift.source.toLowerCase()}`}
                        >
                          {shift.source.replaceAll(
                            "_",
                            " ",
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="hours">
          <p className="eyebrow">
            Weekly Paid Hours
          </p>

          <h2>
            Worker totals in this{" "}
            {mode === "lsw"
              ? "LSW comparison"
              : "HIVE draft"}
          </h2>

          <div className="hours-grid">
            {workers
              .filter(
                (worker) =>
                  worker.employmentProfile,
              )
              .map((worker) => {
                const paid =
                  result.paidHoursByWorker.get(
                    worker.id,
                  ) ?? 0;

                return (
                  <div key={worker.id}>
                    <span>
                      {worker.preferredName ||
                        worker.name}
                    </span>

                    <strong>
                      {paid.toFixed(1)} hrs
                    </strong>

                    <small>
                      Target{" "}
                      {
                        worker
                          .employmentProfile!
                          .targetPaidWeeklyHours
                      }
                    </small>
                  </div>
                );
              })}
          </div>
        </section>

        <style>{`
          .page { display:grid; gap:18px; }

          .top-links {
            display:flex;
            justify-content:space-between;
            gap:12px;
          }

          .top-links a,
          .week-nav a {
            color:#805c0b;
            font-weight:850;
            text-decoration:none;
          }

          .mode-panel,
          .hero,
          .locked-rules,
          .lsw-reference,
          .comparison-warning,
          .week-nav,
          .warnings,
          .day-card,
          .hours {
            border:1px solid #e7d8a7;
            border-radius:20px;
            background:#fff;
          }

          .mode-panel {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            padding:16px 18px;
          }

          .mode-panel h2 {
            margin:0;
            color:#30250f;
            font-size:17px;
          }

          .mode-buttons {
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          }

          .mode-button {
            padding:9px 12px;
            border-radius:10px;
            border:1px solid #d8c99d;
            color:#5d4a1a;
            background:#fffaf0;
            font-size:11px;
            font-weight:900;
            text-decoration:none;
          }

          .mode-button.selected {
            background:#3f2d09;
            border-color:#3f2d09;
            color:#fff;
          }

          .hero {
            display:flex;
            justify-content:space-between;
            gap:22px;
            align-items:center;
            padding:22px;
            background:linear-gradient(
              135deg,
              #fffdf5,
              #fff5c9
            );
          }

          .hero.lsw-hero {
            background:linear-gradient(
              135deg,
              #f7fbff,
              #e9f2ff
            );
            border-color:#b8cee8;
          }

          .eyebrow {
            margin:0 0 5px;
            color:#9a6b05;
            font-size:10px;
            font-weight:900;
            text-transform:uppercase;
            letter-spacing:.08em;
          }

          h2 {
            margin:0;
            color:#30250f;
          }

          .hero p:last-child {
            color:#6b6251;
            line-height:1.55;
            max-width:800px;
          }

          .status {
            min-width:190px;
            padding:14px;
            border-radius:14px;
          }

          .status.clean {
            background:#dcfce7;
            color:#166534;
          }

          .status.review {
            background:#fff4cf;
            color:#805c0b;
          }

          .status span {
            display:block;
            font-size:10px;
            font-weight:900;
            text-transform:uppercase;
          }

          .status strong {
            display:block;
            margin-top:4px;
            font-size:18px;
          }

          .locked-rules,
          .lsw-reference {
            display:grid;
            grid-template-columns:
              repeat(
                auto-fit,
                minmax(220px,1fr)
              );
            overflow:hidden;
          }

          .rule,
          .lsw-reference > div {
            padding:12px 14px;
            border-right:1px solid #eee8dc;
          }

          .rule span,
          .lsw-reference span {
            display:block;
            color:#8b650f;
            font-size:9px;
            font-weight:900;
            text-transform:uppercase;
          }

          .rule strong,
          .lsw-reference strong {
            display:block;
            margin-top:4px;
            color:#3e2d08;
            font-size:11px;
            line-height:1.45;
          }

          .comparison-warning {
            padding:14px 16px;
            background:#eef6ff;
            border-color:#b8cee8;
            color:#315579;
          }

          .comparison-warning p {
            margin:5px 0 0;
            line-height:1.5;
            font-size:12px;
          }

          .week-nav {
            display:grid;
            grid-template-columns:
              120px 1fr 120px;
            align-items:center;
            padding:13px 16px;
            text-align:center;
          }

          .week-nav > a:first-child {
            text-align:left;
          }

          .week-nav > a:last-child {
            text-align:right;
          }

          .week-nav span {
            display:block;
            color:#8b806b;
            font-size:9px;
            font-weight:900;
            text-transform:uppercase;
          }

          .week-nav strong {
            color:#3e2d08;
          }

          .warnings,
          .hours {
            padding:18px;
          }

          .warning-list {
            display:grid;
            gap:7px;
            margin-top:12px;
          }

          .warning-list > div {
            display:grid;
            grid-template-columns:
              100px 1fr;
            gap:10px;
            padding:9px 11px;
            border-radius:10px;
            background:#fff7d6;
            color:#79550a;
            font-size:11px;
          }

          .schedule {
            display:grid;
            gap:14px;
          }

          .day-card {
            overflow:hidden;
          }

          .day-card header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            padding:14px 16px;
            background:#fffaf0;
          }

          .day-card header span {
            color:#7a7161;
            font-size:10px;
          }

          .shift-list {
            display:grid;
          }

          .shift-row {
            display:grid;
            grid-template-columns:
              1.3fr 1.4fr .8fr .8fr;
            gap:12px;
            align-items:center;
            padding:11px 16px;
            border-top:1px solid #eee8dc;
          }

          .worker strong,
          .worker span,
          .times strong,
          .times span,
          .lunch span,
          .lunch strong {
            display:block;
          }

          .worker strong,
          .times strong,
          .lunch strong {
            color:#30250f;
          }

          .worker span,
          .times span,
          .lunch span {
            margin-top:2px;
            color:#7a7161;
            font-size:10px;
          }

          .source {
            justify-self:end;
            padding:4px 7px;
            border-radius:999px;
            font-size:9px;
            font-weight:900;
            text-transform:uppercase;
          }

          .source.primary {
            background:#dcfce7;
            color:#166534;
          }

          .source.cross_trained {
            background:#dbeafe;
            color:#1d4ed8;
          }

          .source.management_exception {
            background:#fee2e2;
            color:#991b1b;
          }

          .hours-grid {
            display:grid;
            grid-template-columns:
              repeat(
                auto-fit,
                minmax(145px,1fr)
              );
            gap:8px;
            margin-top:12px;
          }

          .hours-grid > div {
            padding:10px;
            border-radius:10px;
            background:#faf7ed;
          }

          .hours-grid span,
          .hours-grid strong,
          .hours-grid small {
            display:block;
          }

          .hours-grid span {
            color:#6b6251;
            font-size:10px;
          }

          .hours-grid strong {
            margin-top:3px;
            color:#30250f;
            font-size:16px;
          }

          .hours-grid small {
            margin-top:2px;
            color:#8b806b;
          }

          .empty {
            padding:16px;
            color:#7a7161;
          }

          @media (max-width:800px) {
            .mode-panel,
            .hero {
              flex-direction:column;
              align-items:stretch;
            }

            .status {
              min-width:0;
            }

            .week-nav {
              grid-template-columns:1fr;
              gap:7px;
            }

            .week-nav > a:first-child,
            .week-nav > a:last-child {
              text-align:center;
            }

            .shift-row {
              grid-template-columns:1fr 1fr;
            }

            .source {
              justify-self:start;
            }
          }
        `}</style>
      </div>
    </AdminShell>
  );
}

function Rule({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="rule">
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}
