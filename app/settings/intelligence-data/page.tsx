import type { CSSProperties, ReactNode } from "react";

import AdminShell from "../components/AdminShell";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import ArrivalPatternsImportForm from "./ArrivalPatternsImportForm";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function IntelligenceDataPage() {
  await requireAdmin();

  const [
    dataSources,
    recentImports,
    coverage,
    operationalPatternCount,
  ] = await Promise.all([
    prisma.intelligenceDataSource.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: {
  _count: {
    select: {
      imports: true,
    },
  },
},
    }),

    prisma.intelligenceDataImport.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        dataSource: true,
       coverage: {
  orderBy: {
    coverageStart: "asc",
  },
},
      },
    }),

    prisma.intelligenceDataCoverage.findMany({
      take: 20,
      orderBy: {
        coverageStart: "desc",
      },
      include: {
        dataImport: {
          include: {
            dataSource: true,
          },
        },
      },
    }),

    prisma.operationalPatternEntry.count(),
  ]);

  const eligibleSources = dataSources.filter(
    (source) => source.active && source.intelligenceEligible
  ).length;


  return (
    <AdminShell
      pageTitle="Intelligence Data"
      pageDescription="Manage the external operational data that feeds HIVE Executive Intelligence."
      activePath="/settings/intelligence-data"
    >
      <div style={pageGridStyle}>
        <section style={summaryGridStyle}>
          <SummaryCard
            label="Registered Sources"
            value={dataSources.length}
            description="Data sources HIVE knows how to interpret"
          />

          <SummaryCard
            label="Intelligence Eligible"
            value={eligibleSources}
            description="Sources approved for Executive Intelligence"
          />

          <SummaryCard
            label="Pattern Observations"
            value={operationalPatternCount.toLocaleString()}
            description="Imported 30-minute operational observations"
          />

          <SummaryCard
            label="Coverage Ranges"
            value={coverage.length}
            description="Recent operational coverage ranges in the Data Hub"
          />
        </section>

        <section style={panelStyle}>
          <SectionHeader
            eyebrow="Source Library"
            title="Data Sources"
            description="These definitions tell HIVE what each external report represents and whether Executive Intelligence may use it."
          />

          {dataSources.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>🧠</div>

              <strong style={emptyTitleStyle}>
                No intelligence sources registered yet
              </strong>

              <div>
                Arrival &amp; Production Patterns will become the first
                registered HIVE intelligence source.
              </div>
            </div>
          ) : (
            <div style={listStyle}>
              {dataSources.map((source) => (
                <div key={source.id} style={sourceCardStyle}>
                  <div style={sourceTopStyle}>
                    <div>
                      <div style={sourceTitleRowStyle}>
                        <strong style={sourceTitleStyle}>
                          {source.name}
                        </strong>

                        {source.intelligenceEligible ? (
                          <Badge text="INTELLIGENCE ELIGIBLE" type="success" />
                        ) : null}

                        {!source.active ? (
                          <Badge text="INACTIVE" type="neutral" />
                        ) : null}
                      </div>

                      <div style={mutedTextStyle}>
                        {source.description || "No description provided."}
                      </div>
                    </div>

                    <div style={statGridStyle}>
                      <MiniStat
                        label="Imports"
                        value={source._count.imports}
                      />
                    </div>
                  </div>

                  <div style={chipRowStyle}>
                    <Chip label="Key" value={source.key} />

                    <Chip
                      label="Category"
                      value={formatLabel(source.category)}
                    />

                    <Chip
                      label="Format"
                      value={source.fileFormat}
                    />

                    {source.granularity ? (
                      <Chip
                        label="Granularity"
                        value={formatLabel(source.granularity)}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <SectionHeader
            eyebrow="Data Ingestion"
            title="Upload Intelligence Data"
            description="Upload external reports, validate their structure, preview the detected operational data, and then commit approved records to HIVE."
          />

          <ArrivalPatternsImportForm />
        </section>

        <section style={panelStyle}>
          <SectionHeader
            eyebrow="Audit Trail"
            title="Import History"
            description="Every submitted workbook remains traceable by source, status, row count and operational coverage."
          />

          {recentImports.length === 0 ? (
            <div style={emptyStyle}>
              No intelligence files have been imported yet.
            </div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <TableHeader>File</TableHeader>
                    <TableHeader>Source</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Accepted</TableHeader>
                    <TableHeader>Rejected</TableHeader>
                    <TableHeader>Coverage</TableHeader>
                    <TableHeader>Imported</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {recentImports.map((item) => {
                    const firstDate =
                      item.coverage[0]?.coverageStart ?? null;

                    const lastDate =
                      item.coverage[item.coverage.length - 1]
                        ?.coverageEnd ?? null;

                    let coverageText = "—";

                    if (firstDate && lastDate) {
                      coverageText =
                        firstDate.getTime() === lastDate.getTime()
                          ? formatDate(firstDate)
                          : `${formatDate(firstDate)} – ${formatDate(
                              lastDate
                            )}`;
                    }

                    return (
                      <tr key={item.id}>
                        <TableCell>
                          <strong>{item.fileName}</strong>
                        </TableCell>

                        <TableCell>
                          {item.dataSource.name}
                        </TableCell>

                        <TableCell>
                          <Badge
                            text={formatLabel(item.status)}
                            type={
                              item.status === "SUCCESS"
                                ? "success"
                                : item.status === "FAILED"
                                  ? "danger"
                                  : item.status === "PARTIAL"
                                    ? "warning"
                                    : "neutral"
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {item.importedRowCount}
                        </TableCell>

                        <TableCell>
                          {item.rejectedRowCount}
                        </TableCell>

                        <TableCell>
                          {coverageText}
                        </TableCell>

                        <TableCell>
                          {formatDateTime(item.importedAt)}
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <SectionHeader
            eyebrow="Evidence Availability"
            title="Intelligence Coverage"
            description="Coverage tells Executive Intelligence which operational dates have usable evidence from each registered source."
          />

          {coverage.length === 0 ? (
            <div style={emptyStyle}>
              Coverage will appear after the first successful
              intelligence-data import.
            </div>
          ) : (
            <div style={listStyle}>
              {coverage.map((item) => (
                <div key={item.id} style={coverageRowStyle}>
                  <div>
                    <strong style={coverageDateStyle}>
                      {item.coverageStart.getTime() === item.coverageEnd.getTime()
                        ? formatDate(item.coverageStart)
                        : `${formatDate(item.coverageStart)} – ${formatDate(
                            item.coverageEnd
                          )}`}
                    </strong>

                    <div style={mutedTextStyle}>
                      {item.dataImport.dataSource.name}
                    </div>
                  </div>

                  <div style={coverageRightStyle}>
                    {item.centerNumber ? (
                      <span style={coverageRecordStyle}>
                        Center <strong>{item.centerNumber}</strong>
                      </span>
                    ) : null}

                    <Badge
                      text={
                        item.dataImport.dataSource.intelligenceEligible
                          ? "USABLE BY INTELLIGENCE"
                          : "NOT ELIGIBLE"
                      }
                      type={
                        item.dataImport.dataSource.intelligenceEligible
                          ? "success"
                          : "neutral"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryDescriptionStyle}>
        {description}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <div>
        <div style={eyebrowStyle}>{eyebrow}</div>

        <h2 style={sectionTitleStyle}>{title}</h2>

        <p style={sectionDescriptionStyle}>
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={miniStatStyle}>
      <div style={miniStatLabelStyle}>{label}</div>
      <div style={miniStatValueStyle}>{value}</div>
    </div>
  );
}

function Chip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span style={chipStyle}>
      <strong>{label}:</strong> {value}
    </span>
  );
}

function Badge({
  text,
  type,
}: {
  text: string;
  type: "success" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    success: {
      background: "#dcfce7",
      color: "#166534",
    },
    warning: {
      background: "#fef3c7",
      color: "#92400e",
    },
    danger: {
      background: "#fee2e2",
      color: "#991b1b",
    },
    neutral: {
      background: "#f3f4f6",
      color: "#4b5563",
    },
  };

  return (
    <span
      style={{
        ...badgeBaseStyle,
        ...colors[type],
      }}
    >
      {text}
    </span>
  );
}

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th style={tableHeaderStyle}>
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td style={tableCellStyle}>
      {children}
    </td>
  );
}

const pageGridStyle: CSSProperties = {
  display: "grid",
  gap: "24px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "16px",
};

const summaryCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  background: "#ffffff",
};

const summaryLabelStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const summaryValueStyle: CSSProperties = {
  color: "#111827",
  fontSize: "30px",
  fontWeight: 900,
  marginTop: "7px",
};

const summaryDescriptionStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.5,
  marginTop: "4px",
};

const panelStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "22px",
  background: "#ffffff",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "flex-start",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  color: "#a16207",
  fontWeight: 900,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "5px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "21px",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "760px",
};

const emptyStyle: CSSProperties = {
  border: "1px dashed #d1d5db",
  borderRadius: "16px",
  padding: "24px",
  background: "#fafafa",
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const emptyIconStyle: CSSProperties = {
  fontSize: "34px",
  marginBottom: "10px",
};

const emptyTitleStyle: CSSProperties = {
  display: "block",
  color: "#111827",
  marginBottom: "6px",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const sourceCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  background: "#ffffff",
  display: "grid",
  gap: "12px",
};

const sourceTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const sourceTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "5px",
  flexWrap: "wrap",
};

const sourceTitleStyle: CSSProperties = {
  fontSize: "17px",
  color: "#111827",
};

const mutedTextStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.55,
};

const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(100px, 1fr))",
  gap: "10px",
  minWidth: "230px",
};

const miniStatStyle: CSSProperties = {
  borderRadius: "12px",
  background: "#f9fafb",
  padding: "10px 12px",
};

const miniStatLabelStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
};

const miniStatValueStyle: CSSProperties = {
  fontSize: "20px",
  fontWeight: 900,
  color: "#111827",
  marginTop: "3px",
};

const chipRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  fontSize: "12px",
};

const chipStyle: CSSProperties = {
  display: "inline-flex",
  gap: "5px",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "#f3f4f6",
  color: "#4b5563",
};

const badgeBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const uploadPlaceholderStyle: CSSProperties = {
  border: "2px dashed #d1d5db",
  borderRadius: "18px",
  padding: "30px 22px",
  textAlign: "center",
  background: "#fafafa",
};

const uploadIconStyle: CSSProperties = {
  fontSize: "36px",
  marginBottom: "10px",
};

const uploadTitleStyle: CSSProperties = {
  display: "block",
  color: "#111827",
  fontSize: "16px",
  marginBottom: "7px",
};

const uploadTextStyle: CSSProperties = {
  margin: "0 auto",
  maxWidth: "620px",
  color: "#6b7280",
  lineHeight: 1.6,
  fontSize: "14px",
};

const tableWrapperStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "820px",
};

const tableHeaderStyle: CSSProperties = {
  textAlign: "left",
  padding: "11px 12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tableCellStyle: CSSProperties = {
  padding: "13px 12px",
  borderBottom: "1px solid #f3f4f6",
  color: "#374151",
  fontSize: "13px",
  verticalAlign: "top",
};

const coverageRowStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "15px 16px",
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "center",
  flexWrap: "wrap",
  background: "#ffffff",
};

const coverageDateStyle: CSSProperties = {
  display: "block",
  color: "#111827",
  marginBottom: "4px",
};

const coverageRightStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  flexWrap: "wrap",
};

const coverageRecordStyle: CSSProperties = {
  fontSize: "13px",
  color: "#374151",
};