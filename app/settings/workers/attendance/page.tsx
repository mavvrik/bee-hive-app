import {
  prisma,
} from "@/lib/prisma";

import AdminShell from "../../components/AdminShell";
import AttendanceWorkspace from "./AttendanceWorkspace";

export const dynamic =
  "force-dynamic";

export default async function AttendancePage() {
  const workers =
    await prisma.collector.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        preferredName: true,
        profileTitle: true,

        employmentProfile: {
          select: {
            dateOfHire: true,
          },
        },
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  return (
    <AdminShell
      pageTitle="Attendance Intelligence"
      pageDescription="Private management workspace for attendance events, policy review, corrective-action guidance, and employee attendance records."
      activePath="/settings/workers/attendance"
    >
      <section className="attendance-hero">
        <div>
          <p className="eyebrow">
            Private Management View
          </p>

          <h2>
            Attendance Intelligence
          </h2>

          <p className="hero-description">
            Record attendance events,
            evaluate them against policy,
            review active attendance history,
            and receive auditable guidance
            before corrective action is
            issued.
          </p>
        </div>

        <div className="policy-card">
          <span>
            Policy Engine
          </span>

          <strong>
            Manager Review Required
          </strong>

          <small>
            HIVE calculates and recommends.
            Management reviews and issues
            corrective action.
          </small>
        </div>
      </section>

      <section className="attendance-workspace">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Worker Bee
            </p>

            <h3>
              Select Employee
            </h3>

            <p>
              Choose a worker to review
              attendance history and record
              a new event.
            </p>
          </div>
        </div>

                <AttendanceWorkspace
          workers={workers.map(
            (worker) => ({
              id: worker.id,
              name: worker.name,
              preferredName:
                worker.preferredName,
              profileTitle:
                worker.profileTitle,
              dateOfHire:
                worker.employmentProfile
                  ?.dateOfHire
                  ?.toISOString() ??
                null,
            }),
          )}
        />
      </section>

      <section className="intelligence-preview">
        <div>
          <p className="eyebrow">
            Policy Assessment
          </p>

          <h3>
            Attendance Decision Support
          </h3>

          <p>
            Select an employee and record
            an attendance event to activate
            policy classification, point
            calculation, six-month history,
            NCNS verification, and
            corrective-action guidance.
          </p>
        </div>

        <div className="preview-grid">
          <article>
            <span>
              Active Points
            </span>

            <strong>
              —
            </strong>
          </article>

          <article>
            <span>
              Current Status
            </span>

            <strong>
              Select Worker
            </strong>
          </article>

          <article>
            <span>
              Recommended Action
            </span>

            <strong>
              Manager Review
            </strong>
          </article>

          <article>
            <span>
              Attendance Record
            </span>

            <strong>
              EmpRecord
            </strong>
          </article>
        </div>
      </section>

      <style>{`
        .attendance-hero,
        .attendance-workspace,
        .intelligence-preview {
          border: 1px solid rgba(255, 228, 138, 0.22);
          border-radius: 22px;
          background: rgba(20, 16, 6, 0.72);
          padding: 24px;
          margin-bottom: 22px;
        }

        .attendance-hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: stretch;
        }

        .attendance-hero > div:first-child {
          max-width: 720px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #e1aa19;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        h2,
        h3,
        p {
          margin-top: 0;
        }

        .hero-description,
        .section-heading p,
        .intelligence-preview p {
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.6;
        }

        .policy-card {
          width: min(320px, 100%);
          border: 1px solid rgba(225, 170, 25, 0.55);
          border-radius: 18px;
          background: rgba(63, 48, 11, 0.7);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .policy-card span,
        .worker-card span,
        .preview-grid span {
          color: rgba(255, 255, 255, 0.62);
          font-size: 0.8rem;
        }

        .policy-card strong {
          color: #ffe48a;
          font-size: 1.05rem;
        }

        .policy-card small,
        .worker-card small {
          color: rgba(255, 255, 255, 0.66);
          line-height: 1.45;
        }

        .worker-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(210px, 1fr)
            );
          gap: 12px;
          margin-top: 18px;
        }

        .worker-card {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.035);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .worker-card > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .worker-card strong {
          color: #fff4c4;
        }

        .preview-grid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 12px;
          margin-top: 18px;
        }

        .preview-grid article {
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.045);
          padding: 16px;
          min-height: 96px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
        }

        .preview-grid strong {
          color: #fff4c4;
        }

        @media (max-width: 900px) {
          .attendance-hero {
            flex-direction: column;
          }

          .policy-card {
            width: auto;
          }

          .preview-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }

        @media (max-width: 560px) {
          .attendance-hero,
          .attendance-workspace,
          .intelligence-preview {
            padding: 18px;
          }

          .preview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AdminShell>
  );
}
