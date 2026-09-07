import Link from "next/link";

import AdminShell from "@/app/settings/components/AdminShell";
import PowerHourAlertTestButton from "./PowerHourAlertTestButton";
import { requireAdmin } from "@/lib/admin-auth";
import { getTodayPowerHours } from "@/app/lib/power-hour/powerHourToday";
import { powerHourAlertPolicy } from "@/app/lib/power-hour/powerHourAlertPolicy";

export const dynamic = "force-dynamic";

function formatMinute(minute: number) {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minutePart = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 =
    hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${String(minutePart).padStart(
    2,
    "0",
  )} ${suffix}`;
}

export default async function PowerHourPage() {
  await requireAdmin();

  const now = new Date();

  const local = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/New_York",
    }),
  );

  const dayOfWeek = local.getDay();

  const todayPowerHours =
    await getTodayPowerHours(dayOfWeek);

  const nextPowerHour =
    todayPowerHours.find(
      (item) =>
        item.startMinute >
        local.getHours() * 60 + local.getMinutes(),
    ) ?? null;

  return (
    <AdminShell
      pageTitle="Power Hour"
      pageDescription="View HIVE Power Hour intelligence and manage the alert experience."
      activePath="/settings/power-hour"
    >
      <div className="page">
        <div className="top-links">
          <Link href="/settings">
            ← Administration
          </Link>

          <Link href="/settings/scheduling">
            Intelligent Scheduling
          </Link>
        </div>

        <section className="hero">
          <div>
            <p className="eyebrow">
              HIVE Operational Intelligence
            </p>

            <h2>
              Today&apos;s Power Hour
            </h2>

            <p>
              HIVE uses donor arrival patterns to identify
              the busiest one-hour windows and prepare the
              team before peak demand.
            </p>
          </div>

          <div className="hero-status">
            <span>Next Event</span>

            <strong>
              {nextPowerHour
                ? `${nextPowerHour.startTime}–${nextPowerHour.endTime}`
                : "No remaining Power Hour today"}
            </strong>
          </div>
        </section>

        <section className="today-grid">
          {todayPowerHours.length === 0 ? (
            <article className="empty-card">
              <strong>
                No Power Hour calculated for today.
              </strong>
            </article>
          ) : (
            todayPowerHours.map((item) => (
              <article
                className="power-card"
                key={`${item.startMinute}-${item.endMinute}`}
              >
                <span className="label">
                  {item.label}
                </span>

                <strong>
                  {item.startTime} – {item.endTime}
                </strong>

                <small>
                  Pre-alert at{" "}
                  {formatMinute(
                    item.startMinute -
                      powerHourAlertPolicy.preAlertMinutes,
                  )}
                </small>
              </article>
            ))
          )}
        </section>

        <section className="rules">
          <div>
            <p className="eyebrow">
              Locked Selection Rules
            </p>
            <h2>
              How HIVE chooses Power Hour
            </h2>
          </div>

          <div className="rule-grid">
            <Rule
              title="Monday–Friday"
              text="One busiest one-hour period before 12 PM and one busiest one-hour period after 12 PM."
            />

            <Rule
              title="Saturday–Sunday"
              text="One busiest one-hour period for the day."
            />

            <Rule
              title="Shortened / Holiday Days"
              text="One Power Hour only."
            />
          </div>
        </section>

        <section className="alerts">
          <div>
            <p className="eyebrow">
              Alert Experience
            </p>

            <h2>
              Current Power Hour alert policy
            </h2>
          </div>

          <div className="policy-grid">
            <Policy
              label="Pre-alert"
              value={`${powerHourAlertPolicy.preAlertMinutes} minutes before`}
            />

            <Policy
              label="Large alert duration"
              value={`${powerHourAlertPolicy.largeAlertDurationSeconds} seconds`}
            />

            <Policy
              label="Audio"
              value={
                powerHourAlertPolicy.audioEnabled
                  ? "Enabled"
                  : "Disabled"
              }
            />

            <Policy
              label="Pre-alert phrase"
              value={
                powerHourAlertPolicy.preAlertSpokenPhrase
              }
            />

            <Policy
              label="Start phrase"
              value={
                powerHourAlertPolicy.startSpokenPhrase
              }
            />
          </div>

          <div className="test-panel">
            <PowerHourAlertTestButton />

            <p>
              Test control wiring is the next small step.
              The live global alert system is already
              separated from this management view.
            </p>
          </div>
        </section>

        <section className="future">
          <p className="eyebrow">
            Next Evolution
          </p>

          <h2>
            Management-configurable intelligence
          </h2>

          <p>
            This page is the natural home for future
            controls such as advance warning, spoken
            phrase, audio on/off, alert duration,
            ticker behavior, acknowledgement tracking,
            and Power Hour overrides without changing
            the underlying algorithm.
          </p>
        </section>

        <style>{`
          .page {
            display: grid;
            gap: 18px;
          }

          .top-links {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .top-links a {
            color: #805c0b;
            font-weight: 850;
            text-decoration: none;
          }

          .hero,
          .rules,
          .alerts,
          .future,
          .power-card,
          .empty-card {
            border: 1px solid #e7d8a7;
            border-radius: 20px;
            background: #fff;
          }

          .hero {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: center;
            padding: 22px;
            background:
              linear-gradient(135deg,#fffdf5,#fff5c9);
          }

          .eyebrow {
            margin: 0 0 5px;
            color: #9a6b05;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }

          h2 {
            margin: 0;
            color: #30250f;
          }

          .hero p:last-child,
          .future p:last-child {
            max-width: 760px;
            color: #6b6251;
            line-height: 1.55;
          }

          .hero-status {
            min-width: 210px;
            padding: 14px;
            border-radius: 14px;
            background: #3f2d09;
            color: #fff;
          }

          .hero-status span {
            display: block;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            opacity: .75;
          }

          .hero-status strong {
            display: block;
            margin-top: 4px;
            font-size: 17px;
          }

          .today-grid {
            display: grid;
            grid-template-columns:
              repeat(auto-fit,minmax(220px,1fr));
            gap: 12px;
          }

          .power-card,
          .empty-card {
            padding: 18px;
          }

          .power-card {
            border-top: 5px solid #f4c430;
          }

          .power-card .label,
          .power-card strong,
          .power-card small {
            display: block;
          }

          .power-card .label {
            color: #8b650f;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
          }

          .power-card strong {
            margin-top: 6px;
            color: #30250f;
            font-size: 24px;
          }

          .power-card small {
            margin-top: 5px;
            color: #7a7161;
          }

          .rules,
          .alerts,
          .future {
            padding: 18px;
          }

          .rule-grid,
          .policy-grid {
            display: grid;
            grid-template-columns:
              repeat(auto-fit,minmax(220px,1fr));
            gap: 10px;
            margin-top: 12px;
          }

          .rule,
          .policy {
            padding: 12px;
            border-radius: 12px;
            background: #faf7ed;
          }

          .rule span,
          .policy span {
            display: block;
            color: #8b650f;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
          }

          .rule strong,
          .policy strong {
            display: block;
            margin-top: 4px;
            color: #3e2d08;
            font-size: 12px;
            line-height: 1.45;
          }

          .test-panel {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 14px;
            padding: 12px;
            border-radius: 12px;
            background: #f8fafc;
          }

          .test-button {
            padding: 9px 12px;
            border: 0;
            border-radius: 10px;
            background: #9ca3af;
            color: #fff;
            font-weight: 900;
          }

          .test-panel p {
            margin: 0;
            color: #6b7280;
            font-size: 11px;
          }

          @media (max-width: 760px) {
            .hero {
              flex-direction: column;
              align-items: stretch;
            }

            .hero-status {
              min-width: 0;
            }

            .test-panel {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </AdminShell>
  );
}

function Rule({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rule">
      <span>{title}</span>
      <strong>{text}</strong>
    </div>
  );
}

function Policy({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="policy">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
