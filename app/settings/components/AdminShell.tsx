import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AdminShell.module.css";

type AdminNavItem = {
  title: string;
  href: string;
  icon: string;
};

type AdminShellProps = {
  children: ReactNode;
  pageTitle: string;
  pageDescription?: string;
  activePath?: string;
};

const navigationItems: AdminNavItem[] = [
  {
    title: "Administration",
    href: "/settings",
    icon: "🏠",
  },
  {
  title: "Dashboard & KPIs",
  href: "/settings/hive",
  icon: "📊",
},
{
  title: "Comparison Metrics",
  href: "/settings/metrics/comparisons",
  icon: "↕️",
},
{
  title: "Hive Analytics",
  href: "/settings/analytics",
  icon: "📈",
},
  {
    title: "Worker Bees",
    href: "/settings/workers",
    icon: "🐝",
  },

{
  title: "Task Import",
  href: "/settings/workers/import",
  icon: "📥",
},

  {
    title: "Budget Management",
    href: "/budget",
    icon: "💰",
  },
  {
    title: "Center Settings",
    href: "/settings/center",
    icon: "🏢",
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: "🔐",
  },
];

export default function AdminShell({
  children,
  pageTitle,
  pageDescription,
  activePath = "/settings",
}: AdminShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              🐝
            </div>

            <div>
              <span>Riviera Beach 115</span>
              <strong>Hive Admin</strong>
            </div>
          </div>

          <nav
            className={styles.navigation}
            aria-label="Administration navigation"
          >
            {navigationItems.map((item) => {
              const isActive =
                activePath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? styles.activeNavLink
                      : styles.navLink
                  }
                >
                  <span className={styles.navIcon}>
                    {item.icon}
                  </span>

                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <span>Fiscal Year</span>
            <strong>FY27</strong>

            <Link href="/">
              ← Return to The Hive
            </Link>
          </div>
        </aside>

        <section className={styles.workspace}>
          <header className={styles.topBar}>
            <div>
              <p className={styles.eyebrow}>
                Hive Administration
              </p>

              <h1>{pageTitle}</h1>

              {pageDescription ? (
                <p className={styles.description}>
                  {pageDescription}
                </p>
              ) : null}
            </div>

            <div className={styles.systemBadge}>
              <span
                className={styles.statusDot}
                aria-hidden="true"
              />

              <div>
                <small>System Status</small>
                <strong>Operational</strong>
              </div>
            </div>
          </header>

          <div className={styles.content}>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}