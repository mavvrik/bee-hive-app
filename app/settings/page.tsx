import Link from "next/link";

const settingsCards = [
  {
    title: "Budget Management",
    description:
      "Review the FY27 annual budget and update monthly liter targets.",
    href: "/budget",
    icon: "📊",
    status: "Available",
  },
  {
    title: "Worker Bee Roster",
    description:
      "Add worker bees, manage active status, set target participation, and adjust individual targets.",
    href: "/settings/workers",
    icon: "🐝",
    status: "Coming Next",
  },
  {
    title: "Hive Configuration",
    description:
      "Manage future center settings, operational rules, and dashboard preferences.",
    href: "/settings/hive",
    icon: "⚙️",
    status: "Planned",
  },
];

export default function SettingsPage() {
  return (
    <main className="settings-page">
      <div className="settings-shell">
        <Link href="/" className="back-link">
          ← Return to The Hive
        </Link>

        <header className="settings-header">
          <div>
            <p className="settings-eyebrow">
              Riviera Beach 115
            </p>

            <h1>Hive Administration</h1>

            <p className="settings-description">
              Manage production targets, worker bees,
              and center-level Hive settings.
            </p>
          </div>

          <div className="settings-badge">
            <span>🐝</span>
            <strong>FY27</strong>
          </div>
        </header>

        <section className="settings-grid">
          {settingsCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="settings-card"
            >
              <div className="settings-card-top">
                <div className="settings-icon">
                  {card.icon}
                </div>

                <span
                  className={`settings-status ${
                    card.status === "Available"
                      ? "available"
                      : card.status === "Coming Next"
                        ? "next"
                        : "planned"
                  }`}
                >
                  {card.status}
                </span>
              </div>

              <div className="settings-card-content">
                <h2>{card.title}</h2>

                <p>{card.description}</p>
              </div>

              <div className="settings-card-footer">
                <span>Open Settings</span>
                <strong>→</strong>
              </div>
            </Link>
          ))}
        </section>
      </div>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
          }

          .settings-page {
            min-height: 100vh;
            padding: 40px 24px;
            background:
              radial-gradient(
                circle at top right,
                rgba(255, 221, 102, 0.25),
                transparent 28%
              ),
              linear-gradient(
                180deg,
                #fbf8ee 0%,
                #f2ecd8 100%
              );
            font-family: Arial, sans-serif;
          }

          .settings-shell {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            margin-bottom: 24px;
            color: #7d5c0a;
            font-size: 0.95rem;
            font-weight: 800;
            text-decoration: none;
          }

          .back-link:hover {
            color: #b07c00;
          }

          .settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 28px;
            padding: 28px 30px;
            border: 1px solid #dfc36c;
            border-radius: 24px;
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.98),
                rgba(255, 246, 207, 0.95)
              );
            box-shadow:
              0 14px 34px
              rgba(90, 63, 8, 0.12);
          }

          .settings-eyebrow {
            margin: 0 0 7px;
            color: #a06f08;
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .settings-header h1 {
            margin: 0;
            color: #3d2a07;
            font-size: clamp(
              2rem,
              4vw,
              3.2rem
            );
            line-height: 1;
          }

          .settings-description {
            max-width: 650px;
            margin: 12px 0 0;
            color: #71633e;
            font-size: 1rem;
            line-height: 1.55;
          }

          .settings-badge {
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 10px;
            min-width: 120px;
            padding: 14px 18px;
            border: 1px solid #d79d11;
            border-radius: 16px;
            background: #fff0ae;
            color: #513804;
          }

          .settings-badge span {
            font-size: 1.8rem;
          }

          .settings-badge strong {
            font-size: 1.15rem;
          }

          .settings-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .settings-card {
            display: flex;
            min-height: 270px;
            flex-direction: column;
            padding: 22px;
            overflow: hidden;
            border: 1px solid #e2ca7a;
            border-radius: 20px;
            background: rgba(
              255,
              255,
              255,
              0.96
            );
            color: inherit;
            text-decoration: none;
            box-shadow:
              0 10px 26px
              rgba(77, 56, 9, 0.08);
            transition:
              transform 160ms ease,
              box-shadow 160ms ease,
              border-color 160ms ease;
          }

          .settings-card:hover {
            transform: translateY(-4px);
            border-color: #d8a922;
            box-shadow:
              0 16px 34px
              rgba(77, 56, 9, 0.14);
          }

          .settings-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .settings-icon {
            display: grid;
            width: 54px;
            height: 54px;
            place-items: center;
            border: 1px solid #e5c961;
            border-radius: 16px;
            background:
              linear-gradient(
                135deg,
                #fff8d4,
                #ffe991
              );
            font-size: 1.7rem;
          }

          .settings-status {
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 0.67rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .settings-status.available {
            background: #ddf7e4;
            color: #28763c;
          }

          .settings-status.next {
            background: #fff0b8;
            color: #8a5c00;
          }

          .settings-status.planned {
            background: #ececec;
            color: #696969;
          }

          .settings-card-content {
            flex: 1;
            padding-top: 24px;
          }

          .settings-card-content h2 {
            margin: 0 0 10px;
            color: #3d2a07;
            font-size: 1.35rem;
          }

          .settings-card-content p {
            margin: 0;
            color: #736643;
            font-size: 0.92rem;
            line-height: 1.55;
          }

          .settings-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #eee2b8;
            color: #9b6a08;
            font-size: 0.85rem;
            font-weight: 900;
          }

          .settings-card-footer strong {
            font-size: 1.25rem;
          }

          @media (max-width: 900px) {
            .settings-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 640px) {
            .settings-page {
              padding: 24px 16px;
            }

            .settings-header {
              align-items: flex-start;
              flex-direction: column;
              padding: 22px;
            }

            .settings-grid {
              grid-template-columns: 1fr;
            }

            .settings-card {
              min-height: 240px;
            }
          }
        `}
      </style>
    </main>
  );
}