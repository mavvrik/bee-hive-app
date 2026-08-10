import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/app/settings/components/AdminShell";
import {
  saveDailyCenterProduction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatDateInput(
  date: Date,
) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLiters(
  value: number,
) {
  return `${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )} L`;
}

export default async function DailyCenterProductionPage() {
  const today = new Date();

  const recentEntries =
    await prisma.dailyCenterProduction.findMany({
      orderBy: {
        entryDate: "desc",
      },
      take: 14,
    });

  const latestEntry =
    recentEntries[0] ?? null;

  return (
    <AdminShell
      pageTitle="Daily Center Production"
      pageDescription="Enter the official daily center totals for liters collected and donors processed."
      activePath="/daily-center-production"
    >
      <div style={styles.topActions}>
        <Link
          href="/settings"
          style={styles.backLink}
        >
          ← Return to Hive Administration
        </Link>
      </div>

      <section style={styles.summaryGrid}>
        <article style={styles.summaryCard}>
          <span>Latest Liters</span>

          <strong>
            {latestEntry
              ? formatLiters(
                  latestEntry.liters,
                )
              : "—"}
          </strong>

          <small>
            Most recent center entry
          </small>
        </article>

        <article style={styles.summaryCard}>
          <span>Latest Donors</span>

          <strong>
            {latestEntry
              ? latestEntry.donors.toLocaleString(
                  "en-US",
                )
              : "—"}
          </strong>

          <small>
            Most recent center entry
          </small>
        </article>

        <article style={styles.summaryCard}>
          <span>Records</span>

          <strong>
            {recentEntries.length}
          </strong>

          <small>
            Most recent 14 loaded below
          </small>
        </article>
      </section>

      <section style={styles.entryCard}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>
              Official Daily Total
            </p>

            <h2 style={styles.sectionTitle}>
              Enter center production
            </h2>
          </div>

          <span style={styles.badge}>
            Center Level
          </span>
        </div>

        <form
          action={
            saveDailyCenterProduction
          }
          style={styles.entryForm}
        >
          <label style={styles.field}>
            <span style={styles.label}>
              Production Date
            </span>

            <small style={styles.helpText}>
              One official record is stored
              for each operational day.
            </small>

            <input
              name="entryDate"
              type="date"
              defaultValue={
                formatDateInput(today)
              }
              required
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Total Liters
            </span>

            <small style={styles.helpText}>
              Enter the official total
              liters collected by the center.
            </small>

            <input
              name="liters"
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              required
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Total Donors
            </span>

            <small style={styles.helpText}>
              Enter the official donor
              count for the day.
            </small>

            <input
              name="donors"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              required
              style={styles.input}
            />
          </label>

          <div style={styles.formActions}>
            <button
              type="submit"
              style={styles.primaryButton}
            >
              Save Daily Production
            </button>
          </div>
        </form>
      </section>

      <section style={styles.historySection}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>
              Production History
            </p>

            <h2 style={styles.sectionTitle}>
              Recent center totals
            </h2>
          </div>
        </div>

        {recentEntries.length === 0 ? (
          <div style={styles.emptyState}>
            No center production records
            have been entered yet.
          </div>
        ) : (
          <div style={styles.historyTable}>
            <div style={styles.tableHeader}>
              <span>Date</span>
              <span>Liters</span>
              <span>Donors</span>
            </div>

            {recentEntries.map(
              (entry) => (
                <div
                  key={entry.id}
                  style={styles.tableRow}
                >
                  <strong>
                    {entry.entryDate.toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </strong>

                  <span>
                    {formatLiters(
                      entry.liters,
                    )}
                  </span>

                  <span>
                    {entry.donors.toLocaleString(
                      "en-US",
                    )}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

const styles = {
  topActions: {
    marginBottom: 18,
  },

  backLink: {
    color: "#805c0b",
    fontWeight: 800,
    textDecoration: "none",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
    marginBottom: 22,
  },

  summaryCard: {
    display: "flex",
    flexDirection: "column" as const,
    padding: 20,
    border: "1px solid #dfc36c",
    borderRadius: 16,
    background:
      "linear-gradient(145deg,#ffffff,#fff7d1)",
    boxShadow:
      "0 8px 20px rgba(76,53,6,.08)",
  },

  entryCard: {
    marginBottom: 24,
    padding: 24,
    border: "1px solid #e2cd83",
    borderRadius: 20,
    background: "#ffffff",
    boxShadow:
      "0 10px 24px rgba(76,53,6,.07)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 20,
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#9a6b08",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform:
      "uppercase" as const,
  },

  sectionTitle: {
    margin: 0,
    color: "#3d2a07",
  },

  badge: {
    padding: "7px 11px",
    borderRadius: 999,
    background: "#fff0b7",
    color: "#825900",
    fontSize: 11,
    fontWeight: 900,
    textTransform:
      "uppercase" as const,
  },

  entryForm: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 18,
  },

  field: {
    display: "grid",
    gap: 7,
  },

  label: {
    color: "#49350b",
    fontSize: 13,
    fontWeight: 900,
  },

  helpText: {
    minHeight: 34,
    color: "#7b6c47",
    fontSize: 12,
    lineHeight: 1.4,
  },

  input: {
    width: "100%",
    padding: "12px 13px",
    border: "1px solid #dbc77f",
    borderRadius: 10,
    background: "#fffef9",
    color: "#302204",
    font: "inherit",
    fontWeight: 700,
    boxSizing:
      "border-box" as const,
  },

  formActions: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  primaryButton: {
    padding: "13px 19px",
    border: 0,
    borderRadius: 10,
    background:
      "linear-gradient(135deg,#4c3506,#805b08)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  historySection: {
    marginTop: 12,
  },

  emptyState: {
    padding: 30,
    border: "1px dashed #d5bd6d",
    borderRadius: 16,
    background: "#fffdf5",
    color: "#76643a",
    textAlign: "center" as const,
  },

  historyTable: {
    overflow: "hidden",
    border: "1px solid #e2cd83",
    borderRadius: 16,
    background: "#ffffff",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "1.4fr 1fr 1fr",
    padding: "12px 16px",
    background: "#fff1b8",
    color: "#6d4d08",
    fontSize: 12,
    fontWeight: 900,
    textTransform:
      "uppercase" as const,
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns:
      "1.4fr 1fr 1fr",
    padding: "14px 16px",
    borderTop:
      "1px solid #eee2b8",
    color: "#49350b",
  },
};