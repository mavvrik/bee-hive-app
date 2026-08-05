import type { CSSProperties } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminShell from "../../components/AdminShell";

import {
  addMetricReading,
  createDashboardMetric,
  updateMetricVisibility,
} from "../metric-actions";

export const dynamic = "force-dynamic";

function formatMetricValue(
  value: number,
  decimalPlaces: number,
  unit: string | null,
) {
  const formattedValue =
    value.toLocaleString("en-US", {
      minimumFractionDigits:
        decimalPlaces,
      maximumFractionDigits:
        decimalPlaces,
    });

  if (!unit) {
    return formattedValue;
  }

  if (unit === "%") {
    return `${formattedValue}%`;
  }

  return `${formattedValue} ${unit}`;
}

export default async function MetricAdministrationPage() {
  const metrics =
    await prisma.dashboardMetric.findMany({
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          displayName: "asc",
        },
      ],
      include: {
        readings: {
          orderBy: {
            recordedAt: "desc",
          },
          take: 25,
        },
      },
    });

  const nextDisplayOrder =
    metrics.length > 0
      ? Math.max(
          ...metrics.map(
            (metric) =>
              metric.displayOrder,
          ),
        ) + 1
      : 1;

  return (
    <AdminShell
      pageTitle="Metric Administration"
      pageDescription="Create, configure, and manage the operational metrics used throughout The Hive."
      activePath="/settings/hive"
    >
      <div style={pageStyles.topActions}>
        <Link
          href="/settings/hive"
          style={pageStyles.backLink}
        >
          ← Return to Dashboard & KPIs
        </Link>
      </div>

      <section style={pageStyles.introCard}>
        <div>
          <p style={pageStyles.eyebrow}>
            Performance Intelligence
          </p>

          <h2 style={pageStyles.introTitle}>
            Dynamic KPI Management
          </h2>

          <p style={pageStyles.introText}>
            Add new CSL, Hive, or manually
            maintained performance metrics
            without changing the database schema
            or application code.
          </p>
        </div>

        <div style={pageStyles.metricCount}>
          <strong>{metrics.length}</strong>
          <span>Configured Metrics</span>
        </div>
      </section>

      <section style={pageStyles.formCard}>
        <div style={pageStyles.sectionHeader}>
          <div>
            <p style={pageStyles.eyebrow}>
              Create Metric
            </p>

            <h2 style={pageStyles.sectionTitle}>
              Add a new performance KPI
            </h2>
          </div>

          <span style={pageStyles.statusBadge}>
            Database Driven
          </span>
        </div>

        <form
          action={createDashboardMetric}
          style={pageStyles.createForm}
        >
          <label style={pageStyles.field}>
            <span style={pageStyles.label}>
              Display Name
            </span>

            <small style={pageStyles.helpText}>
              The name staff will see on the
              dashboard.
            </small>

            <input
              name="displayName"
              type="text"
              placeholder="Check-in to Phleb Time"
              required
              style={pageStyles.input}
            />
          </label>

          <label style={pageStyles.field}>
            <span style={pageStyles.label}>
              Metric Key
            </span>

            <small style={pageStyles.helpText}>
              Optional. Leave blank to create it
              automatically.
            </small>

            <input
              name="key"
              type="text"
              placeholder="check_in_to_phleb_time"
              style={pageStyles.input}
            />
          </label>

          <label style={pageStyles.field}>
            <span style={pageStyles.label}>
              Unit
            </span>

            <small style={pageStyles.helpText}>
              Examples: %, min, L, donors.
            </small>

            <input
              name="unit"
              type="text"
              placeholder="min"
              style={pageStyles.input}
            />
          </label>

          <label style={pageStyles.field}>
            <span style={pageStyles.label}>
              Decimal Places
            </span>

            <small style={pageStyles.helpText}>
              Select how precisely the value is
              displayed.
            </small>

            <select
              name="decimalPlaces"
              defaultValue="1"
              required
              style={pageStyles.input}
            >
              <option value="0">
                0 — Whole number
              </option>

              <option value="1">
                1 — Example: 29.4
              </option>

              <option value="2">
                2 — Example: 29.42
              </option>

              <option value="3">
                3 — Example: 29.421
              </option>
            </select>
          </label>

          <label style={pageStyles.field}>
            <span style={pageStyles.label}>
              Public Source
            </span>

            <small style={pageStyles.helpText}>
              Which source should appear publicly?
            </small>

            <select
              name="publicSource"
              defaultValue="CSL"
              required
              style={pageStyles.input}
            >
              <option value="CSL">
                CSL Official
              </option>

              <option value="HIVE">
                Hive Calculated
              </option>

              <option value="MANUAL">
                Manual
              </option>
            </select>
          </label>

          <label style={pageStyles.field}>
            <span style={pageStyles.label}>
              Display Order
            </span>

            <small style={pageStyles.helpText}>
              Lower numbers appear first.
            </small>

            <input
              name="displayOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={nextDisplayOrder}
              required
              style={pageStyles.input}
            />
          </label>

          <label
            style={{
              ...pageStyles.field,
              gridColumn: "1 / -1",
            }}
          >
            <span style={pageStyles.label}>
              Description
            </span>

            <small style={pageStyles.helpText}>
              Explain what the metric measures.
            </small>

            <textarea
              name="description"
              rows={3}
              placeholder="Measures the time from entering the screening queue until the donor is stuck by a phlebotomist."
              style={{
                ...pageStyles.input,
                resize: "vertical",
              }}
            />
          </label>

          <label style={pageStyles.checkboxField}>
            <input
              name="isVisible"
              type="checkbox"
              defaultChecked
            />

            <span>
              Show this metric on the public
              dashboard
            </span>
          </label>

          <div style={pageStyles.formActions}>
            <button
              type="submit"
              style={pageStyles.primaryButton}
            >
              Create Metric
            </button>
          </div>
        </form>
      </section>

      <section style={pageStyles.metricsSection}>
        <div style={pageStyles.sectionHeader}>
          <div>
            <p style={pageStyles.eyebrow}>
              Current Metrics
            </p>

            <h2 style={pageStyles.sectionTitle}>
              Manage configured KPIs
            </h2>
          </div>
        </div>

        {metrics.length === 0 ? (
          <div style={pageStyles.emptyState}>
            No dashboard metrics have been
            configured yet.
          </div>
        ) : (
          <div style={pageStyles.metricGrid}>
            {metrics.map((metric) => {
              const publicReading =
                metric.readings.find(
                  (reading) =>
                    reading.source ===
                    metric.publicSource,
                );

              const latestCsl =
                metric.readings.find(
                  (reading) =>
                    reading.source === "CSL",
                );

              const latestHive =
                metric.readings.find(
                  (reading) =>
                    reading.source === "HIVE",
                );

              return (
                <article
                  key={metric.id}
                  style={pageStyles.metricCard}
                >
                  <header
                    style={pageStyles.metricHeader}
                  >
                    <div>
                      <span
                        style={
                          pageStyles.metricOrder
                        }
                      >
                        Position{" "}
                        {metric.displayOrder}
                      </span>

                      <h3
                        style={
                          pageStyles.metricTitle
                        }
                      >
                        {metric.displayName}
                      </h3>

                      <code
                        style={pageStyles.metricKey}
                      >
                        {metric.key}
                      </code>
                    </div>

                    <span
                      style={{
                        ...pageStyles.visibilityBadge,
                        background:
                          metric.isVisible
                            ? "#ddf5e2"
                            : "#eeeeee",
                        color:
                          metric.isVisible
                            ? "#28713b"
                            : "#666666",
                      }}
                    >
                      {metric.isVisible
                        ? "Visible"
                        : "Hidden"}
                    </span>
                  </header>

                  <p
                    style={
                      pageStyles.metricDescription
                    }
                  >
                    {metric.description ??
                      "No description provided."}
                  </p>

                  <div
                    style={pageStyles.latestValue}
                  >
                    <span>
                      Public Dashboard Value
                    </span>

                    <strong>
                      {publicReading
                        ? formatMetricValue(
                            publicReading.value,
                            metric.decimalPlaces,
                            metric.unit,
                          )
                        : "No reading"}
                    </strong>

                    <small>
                      Source:{" "}
                      {metric.publicSource}
                    </small>
                  </div>

                  <div
                    style={
                      pageStyles.comparisonGrid
                    }
                  >
                    <div
                      style={
                        pageStyles.comparisonBox
                      }
                    >
                      <span>Latest CSL</span>

                      <strong>
                        {latestCsl
                          ? formatMetricValue(
                              latestCsl.value,
                              metric.decimalPlaces,
                              metric.unit,
                            )
                          : "—"}
                      </strong>
                    </div>

                    <div
                      style={
                        pageStyles.comparisonBox
                      }
                    >
                      <span>Latest Hive</span>

                      <strong>
                        {latestHive
                          ? formatMetricValue(
                              latestHive.value,
                              metric.decimalPlaces,
                              metric.unit,
                            )
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <form
                    action={addMetricReading}
                    style={pageStyles.readingForm}
                  >
                    <input
                      type="hidden"
                      name="metricId"
                      value={metric.id}
                    />

                    <label style={pageStyles.field}>
                      <span
                        style={pageStyles.label}
                      >
                        New Value
                      </span>

                      <input
                        name="value"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        required
                        style={pageStyles.input}
                      />
                    </label>

                    <label style={pageStyles.field}>
                      <span
                        style={pageStyles.label}
                      >
                        Source
                      </span>

                      <select
                        name="source"
                        defaultValue={
                          metric.publicSource
                        }
                        required
                        style={pageStyles.input}
                      >
                        <option value="CSL">
                          CSL Official
                        </option>

                        <option value="HIVE">
                          Hive Calculated
                        </option>

                        <option value="MANUAL">
                          Manual
                        </option>
                      </select>
                    </label>

                    <button
                      type="submit"
                      style={pageStyles.secondaryButton}
                    >
                      Add Reading
                    </button>
                  </form>

                  <form
                    action={updateMetricVisibility}
                    style={pageStyles.visibilityForm}
                  >
                    <input
                      type="hidden"
                      name="metricId"
                      value={metric.id}
                    />

                    <label
                      style={
                        pageStyles.checkboxField
                      }
                    >
                      <input
                        name="isVisible"
                        type="checkbox"
                        defaultChecked={
                          metric.isVisible
                        }
                      />

                      <span>
                        Display publicly
                      </span>
                    </label>

                    <button
                      type="submit"
                      style={pageStyles.smallButton}
                    >
                      Save Visibility
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

const pageStyles: Record<
  string,
  CSSProperties
> = {
  topActions: {
    marginBottom: 18,
  },

  backLink: {
    color: "#805c0b",
    fontWeight: 800,
    textDecoration: "none",
  },

  introCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 22,
    padding: 26,
    border: "1px solid #dfc36c",
    borderRadius: 20,
    background:
      "linear-gradient(135deg,#ffffff,#fff4bd)",
    boxShadow:
      "0 12px 28px rgba(76,53,6,.10)",
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#9a6b08",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },

  introTitle: {
    margin: 0,
    color: "#3d2a07",
    fontSize: 28,
  },

  introText: {
    maxWidth: 650,
    margin: "10px 0 0",
    color: "#71633e",
    lineHeight: 1.55,
  },

  metricCount: {
    display: "flex",
    minWidth: 150,
    flexDirection: "column",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    background: "#fff1ae",
    color: "#4f3806",
  },

  formCard: {
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

  sectionTitle: {
    margin: 0,
    color: "#3d2a07",
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: 999,
    background: "#fff0b7",
    color: "#825900",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
  },

  createForm: {
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
    boxSizing: "border-box",
  },

  checkboxField: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: "#49350b",
    fontSize: 13,
    fontWeight: 800,
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

  metricsSection: {
    marginTop: 12,
  },

  emptyState: {
    padding: 30,
    border: "1px dashed #d5bd6d",
    borderRadius: 16,
    background: "#fffdf5",
    color: "#76643a",
    textAlign: "center",
  },

  metricGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(330px,1fr))",
    gap: 18,
  },

  metricCard: {
    padding: 20,
    border: "1px solid #e2cd83",
    borderRadius: 18,
    background: "#ffffff",
    boxShadow:
      "0 8px 20px rgba(76,53,6,.07)",
  },

  metricHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  metricOrder: {
    color: "#9b7318",
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
  },

  metricTitle: {
    margin: "5px 0",
    color: "#3d2a07",
  },

  metricKey: {
    color: "#77683e",
    fontSize: 11,
  },

  visibilityBadge: {
    padding: "6px 9px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
  },

  metricDescription: {
    minHeight: 44,
    color: "#756643",
    fontSize: 13,
    lineHeight: 1.5,
  },

  latestValue: {
    display: "flex",
    flexDirection: "column",
    marginTop: 14,
    padding: 16,
    borderRadius: 13,
    background: "#fff6cd",
  },

  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 9,
    marginTop: 10,
  },

  comparisonBox: {
    display: "flex",
    flexDirection: "column",
    padding: 11,
    border: "1px solid #eadca8",
    borderRadius: 10,
    background: "#fffef9",
  },

  readingForm: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr auto",
    alignItems: "end",
    gap: 9,
    marginTop: 15,
  },

  secondaryButton: {
    padding: "12px 13px",
    border: 0,
    borderRadius: 9,
    background: "#d29a12",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  visibilityForm: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
    paddingTop: 13,
    borderTop: "1px solid #eee2b8",
  },

  smallButton: {
    padding: "9px 11px",
    border: "1px solid #d8c175",
    borderRadius: 8,
    background: "#ffffff",
    color: "#76540b",
    fontWeight: 800,
    cursor: "pointer",
  },
};