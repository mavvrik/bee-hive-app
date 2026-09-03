import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import AdminShell from "@/app/settings/components/AdminShell";
import TimeOffImportForm from "./TimeOffImportForm";

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

export default async function TimeOffPage() {
  await requireAdmin();

  const imports = await prisma.timeOffImport.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      _count: {
        select: {
          requests: true,
        },
      },
    },
  });

  return (
    <AdminShell
      pageTitle="Time Off / Vacation"
      pageDescription="Import CSL Time Off Requests, verify worker matches, and protect approved unavailable dates from schedule generation."
      activePath="/settings/scheduling"
    >
      <div className="page">
        <Link href="/settings/scheduling" className="back">
          ← Scheduling Command Center
        </Link>

        <section className="intro">
          <p className="eyebrow">Scheduling Data Input</p>
          <h2>Time Off Intelligence</h2>
          <p>
            HIVE reads the CSL report, matches each request to the HIVE
            roster, previews everything, and writes nothing until management
            confirms.
          </p>
        </section>

        <TimeOffImportForm />

        <section className="history">
          <div>
            <p className="eyebrow">Audit Trail</p>
            <h2>Recent Time Off Imports</h2>
          </div>

          {imports.length === 0 ? (
            <div className="empty">No Time Off imports yet.</div>
          ) : (
            <div className="history-list">
              {imports.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.fileName}</strong>
                    <small>
                      {item._count.requests} requests •{" "}
                      {formatDate(item.actualCoverageStart)} –{" "}
                      {formatDate(item.actualCoverageEnd)}
                    </small>
                  </div>

                  <span>{item.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <style>{`
          .page {
            display: grid;
            gap: 18px;
          }

          .back {
            color: #805c0b;
            font-weight: 800;
            text-decoration: none;
          }

          .intro,
          .history {
            padding: 20px;
            border: 1px solid #e7d8a7;
            border-radius: 18px;
            background: #fff;
          }

          .eyebrow {
            margin: 0 0 5px;
            color: #9a6b05;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          h2 {
            margin: 0;
            color: #33250c;
          }

          .intro p:last-child {
            color: #6b7280;
            line-height: 1.5;
          }

          .history-list {
            display: grid;
            gap: 8px;
            margin-top: 14px;
          }

          .history-list article {
            display: flex;
            justify-content: space-between;
            gap: 14px;
            align-items: center;
            padding: 12px;
            border-radius: 12px;
            background: #faf7ed;
          }

          .history-list strong,
          .history-list small {
            display: block;
          }

          .history-list small {
            margin-top: 3px;
            color: #6b7280;
          }

          .history-list span {
            color: #166534;
            font-size: 10px;
            font-weight: 900;
          }

          .empty {
            margin-top: 12px;
            padding: 12px;
            border: 1px dashed #d1d5db;
            border-radius: 12px;
            color: #6b7280;
          }
        `}</style>
      </div>
    </AdminShell>
  );
}
