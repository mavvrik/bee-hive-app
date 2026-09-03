import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import AdminShell from "@/app/settings/components/AdminShell";
import {
  buildStaffingRequirements,
  getCoverageWeeks,
  staffingModelMetadata,
} from "@/app/lib/scheduling/staffingRequirementsEngine";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function StaffingRequirementsPage() {
  await requireAdmin();

  const latestImport = await prisma.intelligenceDataImport.findFirst({
    where: {
      status: "SUCCESS",
      dataSource: {
        key: "ARRIVAL_PRODUCTION_PATTERNS",
      },
    },
    orderBy: {
      importedAt: "desc",
    },
    include: {
      dataSource: true,
      coverage: {
        orderBy: {
          coverageStart: "asc",
        },
      },
    },
  });

  const observations = latestImport
    ? await prisma.operationalPatternEntry.findMany({
        where: {
          dataImportId: latestImport.id,
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { minuteOfDay: "asc" },
        ],
        select: {
          dayOfWeek: true,
          time: true,
          minuteOfDay: true,
          visits: true,
          units: true,
        },
      })
    : [];

  const coverageWeeks = getCoverageWeeks(
    latestImport?.periodStart,
    latestImport?.periodEnd,
  );

  const requirements = buildStaffingRequirements(
    observations,
    coverageWeeks,
  );

  const days = Array.from(
    new Set(requirements.map((row) => row.dayOfWeek)),
  );

  const coverage = latestImport?.coverage[0];

  return (
    <AdminShell
      pageTitle="Staffing Requirements"
      pageDescription="S3A — translate demand evidence and locked operating rules into transparent 30-minute staffing requirements before HIVE assigns a single employee."
      activePath="/settings/scheduling"
    >
      <div className="page">
        <div className="top-links">
          <Link href="/settings/scheduling" className="back">
            ← Scheduling Command Center
          </Link>
          <Link
            href="/settings/scheduling/data-inputs"
            className="secondary-link"
          >
            Data Inputs
          </Link>
        </div>

        <section className="hero">
          <div>
            <p className="eyebrow">Scheduling Intelligence • S3A</p>
            <h2>Required coverage before employee assignment</h2>
            <p>
              This screen deliberately separates <b>what the center needs</b>{" "}
              from <b>who HIVE schedules</b>. No PTO, lunches, FTE/PTE hours,
              weekend rotation or employee assignment is solved here yet.
            </p>
          </div>
          <div className="badge">
            <span>Engine Stage</span>
            <strong>REQUIREMENTS</strong>
          </div>
        </section>

        <section className="source-strip">
          <div>
            <span>Arrival Pattern</span>
            <strong>
              {latestImport ? latestImport.fileName : "Not connected"}
            </strong>
          </div>
          <div>
            <span>Coverage</span>
            <strong>
              {coverage
                ? `${formatDate(coverage.coverageStart)} – ${formatDate(
                    coverage.coverageEnd,
                  )}`
                : "—"}
            </strong>
          </div>
          <div>
            <span>Normalization</span>
            <strong>
              {latestImport
                ? `${coverageWeeks.toFixed(1)} week${
                    coverageWeeks === 1 ? "" : "s"
                  }`
                : "—"}
            </strong>
          </div>
          <div>
            <span>Intervals</span>
            <strong>{requirements.length}</strong>
          </div>
        </section>

        <section className="model-grid">
          {Object.entries(staffingModelMetadata).map(
            ([key, model]) => (
              <article key={key} className="model-card">
                <div className="model-top">
                  <h3>{labelForModel(key)}</h3>
                  <span>{model.status}</span>
                </div>
                <p>{model.explanation}</p>
              </article>
            ),
          )}
        </section>

        {!latestImport || requirements.length === 0 ? (
          <section className="empty">
            <h3>Arrival Patterns required</h3>
            <p>
              Import a successful Arrival &amp; Production Patterns workbook
              before HIVE can calculate staffing requirements.
            </p>
            <Link
              href="/settings/intelligence-data"
              className="button"
            >
              Open Intelligence Data Hub
            </Link>
          </section>
        ) : (
          <section className="days">
            {days.map((dayOfWeek) => {
              const rows = requirements.filter(
                (row) => row.dayOfWeek === dayOfWeek,
              );

              if (rows.length === 0) return null;

              return (
                <article key={dayOfWeek} className="day-card">
                  <div className="day-heading">
                    <div>
                      <p className="eyebrow">30-minute requirements</p>
                      <h2>{rows[0].dayName}</h2>
                    </div>
                    <small>
                      Demand shown as average weekday occurrence across the
                      imported coverage period.
                    </small>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Avg Visits</th>
                          <th>Avg Units</th>
                          <th>Reception</th>
                          <th>MSA</th>
                          <th>Floor</th>
                          <th>Processing</th>
                          <th>Leadership</th>
                          <th>Intelligence Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={`${row.dayOfWeek}-${row.minuteOfDay}`}
                          >
                            <td className="time">{row.time}</td>
                            <td>{row.averageVisits}</td>
                            <td>{row.averageUnits}</td>
                            <td>
                              <Requirement
                                value={row.receptionBaseline}
                                type="baseline"
                              />
                            </td>
                            <td>
                              <Requirement
                                value={row.msaMinimum}
                                type="hard"
                              />
                            </td>
                            <td>
                              <Requirement
                                value={row.floorMinimum}
                                type="hard"
                              />
                            </td>
                            <td>
                              <Requirement
                                value={row.processingMinimum}
                                type="hard"
                              />
                            </td>
                            <td>
                              <Requirement
                                value={row.leadershipMinimum}
                                type="hard"
                              />
                            </td>
                            <td className="note-cell">
                              {row.notes.length > 0
                                ? row.notes.join(" ")
                                : "Base operating coverage."}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="guardrails">
          <p className="eyebrow">Important S3A Guardrails</p>
          <h2>What HIVE is intentionally not pretending to know yet</h2>
          <div className="guardrail-grid">
            <div>
              <strong>Reception closing tail</strong>
              <p>
                On normal weekdays, planned Reception coverage may continue
                through 7:30 PM only to finish the final donor screening.
                Reception may be released earlier once that donor is screened.
              </p>
            </div>
            <div>
              <strong>New-donor mix</strong>
              <p>
                No new-donor count exists in the Arrival Patterns source, so
                HIVE does not fabricate it.
              </p>
            </div>
            <div>
              <strong>Additional MSA demand</strong>
              <p>
                One MSA is the hard minimum. Extra MSA staffing will require
                new-donor / suitability evidence or validated learning.
              </p>
            </div>
            <div>
              <strong>Concurrent floor census</strong>
              <p>
                The 6:1 rule is locked, but S3A does not yet turn arrivals into
                active-bed census without validating the flow model.
              </p>
            </div>
            <div>
              <strong>Processor throughput</strong>
              <p>
                Units drive workload, but packing and sustainable throughput
                will be learned rather than invented.
              </p>
            </div>
          </div>
        </section>

        <style>{`
          .page { display: grid; gap: 20px; }
          .top-links { display: flex; justify-content: space-between; gap: 12px; }
          .back, .secondary-link { color: #805c0b; font-weight: 800; text-decoration: none; }

          .hero, .source-strip, .model-card, .day-card, .guardrails, .empty {
            border: 1px solid #e7d8a7;
            border-radius: 20px;
            background: #fff;
            box-shadow: 0 10px 26px rgba(84, 58, 9, .06);
          }

          .hero {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: center;
            padding: 24px;
            background:
              radial-gradient(circle at 88% 10%, rgba(255, 215, 70, .35), transparent 27%),
              linear-gradient(135deg, #fffdf5, #fff5c9);
          }

          .eyebrow {
            margin: 0 0 6px;
            color: #9a6b05;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .09em;
            text-transform: uppercase;
          }

          h2, h3 { color: #30250f; }
          .hero h2, .day-heading h2, .guardrails h2 { margin: 0; }
          .hero p:last-child { max-width: 780px; color: #6b6251; line-height: 1.6; }

          .badge {
            min-width: 180px;
            padding: 16px;
            border-radius: 15px;
            background: #3f2d09;
            color: #fff;
          }
          .badge span { display: block; font-size: 10px; font-weight: 800; opacity: .75; text-transform: uppercase; }
          .badge strong { display: block; margin-top: 4px; font-size: 21px; }

          .source-strip {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr .7fr;
            gap: 1px;
            overflow: hidden;
          }
          .source-strip > div { padding: 15px; background: #fffdf7; }
          .source-strip span { display: block; color: #8b806b; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          .source-strip strong { display: block; margin-top: 4px; color: #3e2d08; font-size: 13px; overflow-wrap: anywhere; }

          .model-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 12px;
          }
          .model-card { padding: 16px; }
          .model-top { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
          .model-top h3 { margin: 0; font-size: 15px; }
          .model-top span {
            padding: 4px 7px;
            border-radius: 999px;
            background: #fff4cf;
            color: #805c0b;
            font-size: 9px;
            font-weight: 900;
          }
          .model-card p { margin: 9px 0 0; color: #6b7280; font-size: 12px; line-height: 1.5; }

          .days { display: grid; gap: 18px; }
          .day-card { overflow: hidden; }
          .day-heading {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: end;
            padding: 18px 20px;
            background: #fffaf0;
          }
          .day-heading small { color: #7a7161; max-width: 430px; text-align: right; }

          .table-wrap { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; min-width: 1050px; }
          th {
            padding: 10px;
            background: #3f2d09;
            color: #fff;
            font-size: 10px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: .04em;
          }
          td { padding: 9px 10px; border-bottom: 1px solid #eee8dc; color: #514a3d; font-size: 12px; vertical-align: top; }
          tbody tr:hover { background: #fffdf7; }
          .time { font-weight: 900; color: #33250c; white-space: nowrap; }
          .note-cell { min-width: 270px; color: #6b7280; line-height: 1.4; }

          .req {
            display: inline-flex;
            min-width: 28px;
            height: 28px;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-weight: 900;
          }
          .req.hard { background: #dcfce7; color: #166534; }
          .req.baseline { background: #fff4cf; color: #805c0b; }

          .guardrails { padding: 20px; }
          .guardrail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 10px;
            margin-top: 14px;
          }
          .guardrail-grid > div { padding: 13px; border-radius: 13px; background: #faf7ed; }
          .guardrail-grid strong { color: #3e2d08; }
          .guardrail-grid p { margin: 5px 0 0; color: #6b7280; font-size: 12px; line-height: 1.45; }

          .empty { padding: 24px; }
          .empty h3 { margin-top: 0; }
          .empty p { color: #6b7280; }
          .button {
            display: inline-block;
            padding: 9px 12px;
            border-radius: 10px;
            background: #3f2d09;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
          }

          @media (max-width: 800px) {
            .hero { flex-direction: column; align-items: stretch; }
            .badge { min-width: 0; }
            .source-strip { grid-template-columns: 1fr 1fr; }
            .day-heading { flex-direction: column; align-items: flex-start; }
            .day-heading small { text-align: left; }
          }
        `}</style>
      </div>
    </AdminShell>
  );
}

function Requirement({
  value,
  type,
}: {
  value: number;
  type: "hard" | "baseline";
}) {
  return <span className={`req ${type}`}>{value}</span>;
}

function labelForModel(key: string) {
  switch (key) {
    case "reception":
      return "Reception";
    case "msa":
      return "MSA";
    case "floor":
      return "Donor Floor";
    case "processing":
      return "Processing";
    case "leadership":
      return "Leadership";
    default:
      return key;
  }
}
