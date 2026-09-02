import AdminShell from "../components/AdminShell";
import DisruptionForm from "./DisruptionForm";
import DeleteDisruptionButton from "./DeleteDisruptionButton";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import {
  archiveOperationalDisruption,
  restoreOperationalDisruption,
} from "./actions";

export const dynamic = "force-dynamic";

const disruptionTypes = [
  ["SYSTEM_OUTAGE", "System Outage"],
  ["NETWORK_OUTAGE", "Network Outage"],
  ["EQUIPMENT_FAILURE", "Equipment Failure"],
  ["POWER_OUTAGE", "Power Outage"],
  ["WEATHER", "Weather"],
  ["STAFFING", "Staffing"],
  ["DELAYED_OPENING", "Delayed Opening"],
  ["EARLY_CLOSURE", "Early Closure"],
  ["FACILITY", "Facility"],
  ["OTHER", "Other"],
] as const;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}

function formatType(value: string) {
  return (
    disruptionTypes.find(
      ([type]) => type === value,
    )?.[1] ?? value
  );
}

function dateInputValue(date: Date) {
  return date
    .toISOString()
    .slice(0, 10);
}

export default async function OperationalImpactPage() {
  await requireAdmin();

  const disruptions =
    await prisma.operationalDisruption.findMany(
      {
        orderBy: [
          {
            disruptionDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    );

  const activeRecords =
    disruptions.filter(
      (record) => !record.archived,
    );

  const archivedRecords =
    disruptions.filter(
      (record) => record.archived,
    );

  const totalHoursLost =
    activeRecords.reduce(
      (sum, record) =>
        sum + record.hoursLost,
      0,
    );

  const unresolvedCount =
    activeRecords.filter(
      (record) => !record.resolved,
    ).length;

  return (
    <AdminShell
      pageTitle="Operational Impact"
      pageDescription="Record center disruptions and preserve the operational context behind HIVE performance."
      activePath="/settings/operational-impact"
    >
      <div
        style={{
          display: "grid",
          gap: "24px",
        }}
      >
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>
              Recorded Events
            </div>

            <div style={summaryValueStyle}>
              {activeRecords.length}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>
              Hours Lost
            </div>

            <div style={summaryValueStyle}>
              {totalHoursLost.toFixed(1)}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>
              Unresolved
            </div>

            <div style={summaryValueStyle}>
              {unresolvedCount}
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <h2 style={sectionTitleStyle}>
              Record Operational Disruption
            </h2>

            <p
              style={
                sectionDescriptionStyle
              }
            >
              Record what happened without
              changing actual production or
              official budget performance.
            </p>
          </div>

          <DisruptionForm />
        </section>

        <section>
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <h2 style={sectionTitleStyle}>
              Disruption History
            </h2>

            <p
              style={
                sectionDescriptionStyle
              }
            >
              These records remain separate
              from actual production and
              provide historical context for
              HIVE intelligence.
            </p>
          </div>

          {activeRecords.length === 0 ? (
            <div style={panelStyle}>
              No operational disruptions have
              been recorded yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "18px",
              }}
            >
              {activeRecords.map(
                (record) => (
                  <details
                    key={record.id}
                    style={recordCardStyle}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        listStyle: "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                            }}
                          >
                            {record.title}
                          </div>

                          <div
                            style={{
                              marginTop: "5px",
                              opacity: 0.72,
                            }}
                          >
                            {formatDate(
                              record.disruptionDate,
                            )}{" "}
                            ·{" "}
                            {formatType(
                              record.type,
                            )}{" "}
                            ·{" "}
                            {record.hoursLost.toFixed(
                              2,
                            )}{" "}
                            hours lost
                          </div>
                        </div>

                        <div
                          style={{
                            fontWeight: 800,
                          }}
                        >
                          {record.resolved
                            ? "Resolved"
                            : "Active"}
                        </div>
                      </div>
                    </summary>

                    <div
                      style={{
                        marginTop: "22px",
                        paddingTop: "22px",
                        borderTop:
                          "1px solid rgba(148, 163, 184, 0.25)",
                      }}
                    >
                      <DisruptionForm
                        mode="edit"
                        record={{
                          id: record.id,
                          disruptionDate:
                            dateInputValue(
                              record.disruptionDate,
                            ),
                          startTime:
                            record.startTime,
                          endTime:
                            record.endTime,
                          hoursLost:
                            record.hoursLost,
                          type: record.type,
                          impactLevel:
                            record.impactLevel,
                          affectedArea:
                            record.affectedArea,
                          title:
                            record.title,
                          description:
                            record.description,
                          estimatedProceduresLost:
                            record.estimatedProceduresLost,
                          estimatedLitersLost:
                            record.estimatedLitersLost,
                          resolved:
                            record.resolved,
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                          marginTop: "14px",
                        }}
                      >
                        <form
                          action={
                            archiveOperationalDisruption
                          }
                        >
                          <input
                            type="hidden"
                            name="disruptionId"
                            value={record.id}
                          />

                          <button
                            type="submit"
                            style={
                              archiveButtonStyle
                            }
                          >
                            Archive Record
                          </button>
                        </form>

                        <DeleteDisruptionButton
                          disruptionId={
                            record.id
                          }
                          title={record.title}
                        />
                      </div>
                    </div>
                  </details>
                ),
              )}
            </div>
          )}
        </section>

        {archivedRecords.length > 0 && (
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>
              Archived Records
            </h2>

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {archivedRecords.map(
                (record) => (
                  <div
                    key={record.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "16px",
                      flexWrap: "wrap",
                      padding: "14px 0",
                      borderBottom:
                        "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <div>
                      <strong>
                        {record.title}
                      </strong>

                      <div
                        style={{
                          marginTop: "4px",
                          opacity: 0.7,
                        }}
                      >
                        {formatDate(
                          record.disruptionDate,
                        )}{" "}
                        ·{" "}
                        {record.hoursLost.toFixed(
                          2,
                        )}{" "}
                        hours
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <form
                        action={
                          restoreOperationalDisruption
                        }
                      >
                        <input
                          type="hidden"
                          name="disruptionId"
                          value={record.id}
                        />

                        <button
                          type="submit"
                          style={
                            secondaryButtonStyle
                          }
                        >
                          Restore
                        </button>
                      </form>

                      <DeleteDisruptionButton
                        disruptionId={
                          record.id
                        }
                        title={record.title}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  );
}

const panelStyle = {
  padding: "24px",
  borderRadius: "18px",
  border:
    "1px solid rgba(148, 163, 184, 0.22)",
  background:
    "rgba(15, 23, 42, 0.35)",
} as const;

const summaryCardStyle = {
  ...panelStyle,
  minHeight: "120px",
} as const;

const summaryLabelStyle = {
  fontSize: "13px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  opacity: 0.7,
} as const;

const summaryValueStyle = {
  marginTop: "10px",
  fontSize: "34px",
  fontWeight: 900,
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 900,
} as const;

const sectionDescriptionStyle = {
  margin: "7px 0 0",
  opacity: 0.72,
  lineHeight: 1.6,
} as const;

const secondaryButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 800,
  border:
    "1px solid rgba(148, 163, 184, 0.35)",
  background: "transparent",
  color: "inherit",
} as const;

const archiveButtonStyle = {
  ...secondaryButtonStyle,
  opacity: 0.75,
} as const;

const recordCardStyle = {
  ...panelStyle,
} as const;