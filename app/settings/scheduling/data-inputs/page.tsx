import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import AdminShell from "@/app/settings/components/AdminShell";

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

export default async function SchedulingDataInputsPage() {
  await requireAdmin();

  const [latestArrivalImport, latestTimeOffImport, workers] =
    await Promise.all([
      prisma.intelligenceDataImport.findFirst({
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
          coverage: {
            orderBy: {
              coverageStart: "asc",
            },
          },
        },
      }),

      prisma.timeOffImport.findFirst({
        where: {
          status: "SUCCESS",
        },
        orderBy: {
          importedAt: "desc",
        },
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
      }),

      prisma.collector.findMany({
        where: {
          active: true,
        },
        include: {
          roleAssignments: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  const coverage = latestArrivalImport?.coverage[0];

  return (
    <AdminShell
      pageTitle="Scheduling Data Inputs"
      pageDescription="Keep the evidence required by HIVE Scheduling Intelligence in one place."
      activePath="/settings/scheduling"
    >
      <div className="inputs-page">
        <Link href="/settings/scheduling" className="back">
          ← Scheduling Command Center
        </Link>

        <section className="intro">
          <p className="eyebrow">Scheduling • Data Inputs</p>
          <h2>One command center. Specialized uploaders.</h2>
          <p>
            Each report keeps its own validation rules, while HIVE maintains
            one scheduling workflow.
          </p>
        </section>

        <section className="input-grid">
          <article className="input-card ready">
            <div className="icon">📈</div>
            <div>
              <span className="status">CONNECTED</span>
              <h3>Arrival Patterns</h3>
              <p>
                Four-week demand history used for weekday demand curves and
                Power Hour selection.
              </p>

              {latestArrivalImport ? (
                <div className="metadata">
                  <span>
                    Latest: <b>{latestArrivalImport.fileName}</b>
                  </span>
                  <span>
                    Coverage:{" "}
                    <b>
                      {coverage
                        ? `${formatDate(
                            coverage.coverageStart,
                          )} – ${formatDate(coverage.coverageEnd)}`
                        : "Not recorded"}
                    </b>
                  </span>
                </div>
              ) : (
                <div className="metadata">
                  No successful Arrival Patterns import found.
                </div>
              )}

              <Link
                href="/settings/intelligence-data"
                className="button"
              >
                Upload / Review Arrival Patterns
              </Link>
            </div>
          </article>

          <article
            className={`input-card ${
              latestTimeOffImport ? "ready" : "pending"
            }`}
          >
            <div className="icon">🏖️</div>
            <div>
              <span className="status">
                {latestTimeOffImport ? "CONNECTED" : "NEEDED"}
              </span>
              <h3>Time Off / Vacation</h3>
              <p>
                Imported Time Off becomes hard employee unavailability before
                HIVE generates any schedule.
              </p>

              <div className="metadata">
                {latestTimeOffImport ? (
                  <>
                    <span>
                      Requests:{" "}
                      <b>{latestTimeOffImport._count.requests}</b>
                    </span>
                    <span>
                      Actual coverage:{" "}
                      <b>
                        {formatDate(
                          latestTimeOffImport.actualCoverageStart,
                        )}{" "}
                        –{" "}
                        {formatDate(
                          latestTimeOffImport.actualCoverageEnd,
                        )}
                      </b>
                    </span>
                  </>
                ) : (
                  <span>
                    No successful Time Off import found.
                  </span>
                )}
              </div>

              <Link
                href="/settings/scheduling/time-off"
                className="button"
              >
                Open Time Off / Vacation Importer
              </Link>
            </div>
          </article>

          <article className="input-card ready">
            <div className="icon">🐝</div>
            <div>
              <span className="status">HIVE CONNECTED</span>
              <h3>Center Roster</h3>
              <p>
                HIVE is the source of truth. No duplicate roster upload is
                required.
              </p>

              <div className="metadata">
                <span>
                  Active workers: <b>{workers.length}</b>
                </span>
                <span>
                  Role eligibility assignments:{" "}
                  <b>
                    {workers.reduce(
                      (total, worker) =>
                        total + worker.roleAssignments.length,
                      0,
                    )}
                  </b>
                </span>
              </div>

              <Link href="/settings/workers" className="button">
                Review HIVE Roster
              </Link>
            </div>
          </article>
        </section>

        <section className="note">
          <strong>Architecture rule</strong>
          <p>
            The Data Hub remains the underlying audit and evidence layer.
            Scheduling exposes the manager-friendly workflow without creating
            duplicate copies of Arrival Patterns, Time Off records, or worker
            records.
          </p>
        </section>

        <style>{`
          .inputs-page {
            display: grid;
            gap: 20px;
          }

          .back {
            color: #805c0b;
            font-weight: 800;
            text-decoration: none;
          }

          .intro,
          .note {
            padding: 22px;
            border: 1px solid #e7d8a7;
            border-radius: 20px;
            background: #fff;
          }

          .eyebrow {
            margin: 0 0 6px;
            color: #9a6b05;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .intro h2 {
            margin: 0;
            color: #30250f;
          }

          .intro p:last-child,
          .note p {
            color: #6b7280;
            line-height: 1.55;
          }

          .input-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 15px;
          }

          .input-card {
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            background: #fff;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 14px;
          }

          .input-card.ready {
            border-top: 4px solid #22c55e;
          }

          .input-card.pending {
            border-top: 4px solid #eab308;
          }

          .icon {
            font-size: 32px;
          }

          .status {
            color: #8a650e;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .06em;
          }

          h3 {
            margin: 4px 0 6px;
            color: #30250f;
          }

          .input-card p {
            margin: 0;
            color: #6b7280;
            font-size: 13px;
            line-height: 1.5;
          }

          .metadata {
            display: grid;
            gap: 5px;
            margin: 14px 0;
            padding: 11px;
            border-radius: 12px;
            background: #faf7ed;
            color: #5f5645;
            font-size: 12px;
          }

          .button {
            display: inline-block;
            padding: 9px 12px;
            border: 0;
            border-radius: 10px;
            background: #3f2d09;
            color: #fff;
            font: inherit;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
          }

          .note strong {
            color: #3e2d08;
          }

          .note p {
            margin-bottom: 0;
          }
        `}</style>
      </div>
    </AdminShell>
  );
}
