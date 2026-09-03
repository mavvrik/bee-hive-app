import Link from "next/link";

import AdminShell from "@/app/settings/components/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  auditWeeklyHours,
} from "@/app/lib/scheduling/weeklyHoursConstraint";

export const dynamic = "force-dynamic";

export default async function EmploymentProfilesPage() {
  await requireAdmin();

  const workers = await prisma.collector.findMany({
    where: { active: true },
    include: { employmentProfile: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  return (
    <AdminShell
      pageTitle="Employment Profiles"
      pageDescription="S3B — define the employment and weekly-hours rules HIVE must respect before assigning shifts."
      activePath="/settings/scheduling"
    >
      <div className="page">
        <div className="top-links">
          <Link href="/settings/scheduling/workforce">
            ← Workforce Constraints
          </Link>
          <Link href="/settings/scheduling">
            Scheduling Command Center
          </Link>
        </div>

        <section className="hero">
          <div>
            <p className="eyebrow">Scheduling Intelligence • S3B</p>
            <h2>Employment status becomes a real scheduling constraint.</h2>
            <p>
              FTE and PTE rules now live on the worker instead of being guessed
              by the schedule generator.
            </p>
          </div>
        </section>

        <section className="workers">
          {workers.map((worker) => {
            const profile = worker.employmentProfile;
            const audit = profile ? auditWeeklyHours(profile) : null;

            return (
              <article key={worker.id} className="card">
                <div className="heading">
                  <div>
                    <h3>{worker.preferredName || worker.name}</h3>
                    <small>{worker.role}</small>
                  </div>

                  <span className={profile ? "ready" : "missing"}>
                    {profile ? "PROFILED" : "NEEDS PROFILE"}
                  </span>
                </div>

                {profile && audit ? (
                  <div className="facts">
                    <span>{profile.employmentType}</span>
                    <span>{profile.schedulePattern}</span>
                    <span>{audit.paidHoursPerShift.toFixed(1)} paid hrs/shift</span>
                    <span>{audit.projectedWeeklyPaidHours.toFixed(1)} projected/week</span>
                    <span>
                      Range {profile.minPaidWeeklyHours}–{profile.maxPaidWeeklyHours}
                    </span>
                    <span>
                      Target {profile.targetPaidWeeklyHours}
                    </span>
                  </div>
                ) : (
                  <p>
                    This worker cannot enter the weekly-hours solver until an
                    employment profile is added.
                  </p>
                )}

                <Link href={`/settings/workers/${worker.id}`}>
                  Open Worker →
                </Link>
              </article>
            );
          })}
        </section>

        <style>{`
          .page { display: grid; gap: 18px; }
          .top-links { display: flex; justify-content: space-between; }
          .top-links a { color: #805c0b; font-weight: 850; text-decoration: none; }
          .hero, .card {
            border: 1px solid #e7d8a7;
            border-radius: 18px;
            background: #fff;
          }
          .hero { padding: 22px; background: linear-gradient(135deg,#fffdf5,#fff5c9); }
          .eyebrow { margin: 0 0 5px; color: #9a6b05; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          .hero h2 { margin: 0; color: #30250f; }
          .hero p:last-child { color: #6b6251; }
          .workers { display: grid; gap: 12px; }
          .card { padding: 16px; }
          .heading { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
          h3 { margin: 0; color: #30250f; }
          small { color: #7a7161; }
          .ready, .missing {
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 900;
          }
          .ready { background: #dcfce7; color: #166534; }
          .missing { background: #fef3c7; color: #92400e; }
          .facts { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
          .facts span {
            padding: 5px 8px;
            border-radius: 999px;
            background: #faf3df;
            color: #71510c;
            font-size: 10px;
            font-weight: 800;
          }
          .card p { color: #6b7280; font-size: 12px; }
          .card a { color: #805c0b; font-weight: 800; text-decoration: none; }
        `}</style>
      </div>
    </AdminShell>
  );
}
