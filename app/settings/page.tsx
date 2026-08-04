import Link from "next/link";
import AdminShell from "./components/AdminShell";

const adminSections = [
  {
    title: "Dashboard & KPIs",
    description:
      "Manage the official CSL metrics displayed on the public dashboard.",
    href: "/settings/hive",
    icon: "📊",
    status: "Active",
  },
  {
    title: "Hive Analytics",
    description:
      "View Hive-calculated metrics and compare them with official CSL values.",
    href: "/settings/analytics",
    icon: "📈",
    status: "Coming Soon",
  },
  {
    title: "Worker Bees",
    description:
      "Manage collectors, management participation, and worker bee targets.",
    href: "/settings/workers",
    icon: "🐝",
    status: "Active",
  },
  {
    title: "Budget Management",
    description:
      "Review annual budgets, monthly targets, and forecasting information.",
    href: "/budget",
    icon: "💰",
    status: "Active",
  },
  {
    title: "Center Settings",
    description:
      "Configure center preferences and Hive operational settings.",
    href: "/settings/center",
    icon: "🏢",
    status: "Planned",
  },
  {
    title: "Security",
    description:
      "Administrator accounts, passwords, and audit history.",
    href: "/settings/security",
    icon: "🔐",
    status: "Planned",
  },
];

export default function SettingsPage() {
  return (
    <AdminShell
      pageTitle="Hive Administration"
      pageDescription="Manage every operational component of The Hive from a single administration console."
      activePath="/settings"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
          gap: 20,
        }}
      >
        {adminSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: 24,
                border: "1px solid #e4d28a",
                boxShadow: "0 10px 24px rgba(0,0,0,.08)",
                height: "100%",
                transition: "all .15s ease",
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 18,
                }}
              >
                {section.icon}
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#3d2a07",
                }}
              >
                {section.title}
              </h2>

              <p
                style={{
                  marginTop: 12,
                  lineHeight: 1.6,
                  color: "#666",
                }}
              >
                {section.description}
              </p>

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong
                  style={{
                    color: "#996b00",
                  }}
                >
                  Open →
                </strong>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      section.status === "Active"
                        ? "#2d8c46"
                        : "#9b7b00",
                  }}
                >
                  {section.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}