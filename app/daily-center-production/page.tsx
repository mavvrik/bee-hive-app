import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

import AdminShell from "@/app/settings/components/AdminShell";

import {
  getCurrentMonthNumber,
} from "@/app/lib/fiscalMonth";

import {
  startOfOperationalWeek,
} from "@/app/lib/hiveWeek";

import {
  getDailyTargets,
} from "@/app/lib/dailyTargetEngine";

import {
  saveDailyCenterProduction,
} from "./actions";

export const dynamic =
  "force-dynamic";

function formatDateInput(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
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

function formatPercent(
  value: number,
) {
  return `${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )}%`;
}

function safeDivide(
  numerator: number,
  denominator: number,
) {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function getDayLabel(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  );
}

function getShortDate(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );
}

export default async function DailyCenterProductionPage() {
  await requireAdmin();

  const now =
    new Date();

  const today =
    startOfDay(now);

  /*
   * ==========================================
   * SETTINGS / BUDGET
   * ==========================================
   */

  const settings =
    await prisma.hiveSettings.findUnique({
      where: {
        id: 1,
      },
    });

  const reportingYear =
    settings?.currentYear ??
    now.getFullYear();

  const weeksInPeriod =
    settings?.weeksInPeriod ??
    4.33;

  const currentMonthNumber =
    getCurrentMonthNumber();

  const currentBudget =
    await prisma.monthlyBudget.findUnique({
      where: {
        fiscalYear_month: {
          fiscalYear:
            reportingYear,

          month:
            currentMonthNumber,
        },
      },
    });

  const monthlyGoalLiters =
    currentBudget
      ?.budgetLiters ?? 0;

  const monthlyGoalDonors =
    currentBudget
      ?.budgetDonors ?? 0;

  const weeklyGoalLiters =
    safeDivide(
      monthlyGoalLiters,
      weeksInPeriod,
    );

  const weeklyGoalDonors =
    safeDivide(
      monthlyGoalDonors,
      weeksInPeriod,
    );

  /*
   * ==========================================
   * DATE BOUNDARIES
   * ==========================================
   */

  const weekStart =
    startOfOperationalWeek(
      today,
    );

  const weekEnd =
    new Date(
      weekStart,
    );

  weekEnd.setDate(
    weekEnd.getDate() + 7,
  );

  const monthStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

  const nextMonthStart =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    );

  /*
   * ==========================================
   * PRODUCTION DATA
   * ==========================================
   */

  const [
    weekEntries,
    monthProduction,
    recentEntries,
  ] = await Promise.all([
    prisma.dailyCenterProduction.findMany({
      where: {
        entryDate: {
          gte:
            weekStart,

          lt:
            weekEnd,
        },
      },

      orderBy: {
        entryDate:
          "asc",
      },
    }),

    prisma.dailyCenterProduction.aggregate({
      where: {
        entryDate: {
          gte:
            monthStart,

          lt:
            nextMonthStart,
        },
      },

      _sum: {
        liters: true,
        donors: true,
      },
    }),

    prisma.dailyCenterProduction.findMany({
      orderBy: {
        entryDate:
          "desc",
      },

      take: 14,
    }),
  ]);

  /*
   * ==========================================
   * SHARED ROLLING TARGET ENGINE
   * ==========================================
   */

  const targetPlan =
    getDailyTargets({
      weeklyGoalLiters,
      weeklyGoalDonors,

      weekStart,
      today,

      entries:
        weekEntries.map(
          (entry) => ({
            entryDate:
              entry.entryDate,

            liters:
              entry.liters,

            donors:
              entry.donors,
          }),
        ),
    });

  const todayRow =
    targetPlan.days.find(
      (day) =>
        day.isToday,
    ) ?? null;

  /*
   * ==========================================
   * MONTHLY PROGRESS
   * ==========================================
   */

  const monthlyActualLiters =
    monthProduction._sum
      .liters ?? 0;

  const monthlyActualDonors =
    monthProduction._sum
      .donors ?? 0;

  const monthlyCompletion =
    safeDivide(
      monthlyActualLiters,
      monthlyGoalLiters,
    ) * 100;

  const latestEntry =
    recentEntries[0] ??
    null;

  return (
    <AdminShell
      pageTitle="Daily Center Production"
      pageDescription="Enter official daily production and let the HIVE automatically recalculate the pace required to achieve the fixed weekly goal."
      activePath="/daily-center-production"
    >
      <div
        style={
          styles.topActions
        }
      >
        <Link
          href="/settings"
          style={
            styles.backLink
          }
        >
          ← Return to Hive Administration
        </Link>
      </div>

      {/* =====================================
          ROLLING TARGET SUMMARY
         ===================================== */}

      <section
        style={
          styles.summaryGrid
        }
      >
        <article
          style={
            styles.summaryCard
          }
        >
          <span>
            Fixed Weekly Goal
          </span>

          <strong>
            {formatLiters(
              targetPlan.weeklyGoalLiters,
            )}
          </strong>

          <small>
            This target does not move
          </small>
        </article>

        <article
          style={
            styles.summaryCard
          }
        >
          <span>
            Week Collected
          </span>

          <strong>
            {formatLiters(
              targetPlan.weeklyActualLiters,
            )}
          </strong>

          <small>
            {formatPercent(
              targetPlan.weeklyCompletionPercentage,
            )}{" "}
            of weekly goal
          </small>
        </article>

        <article
          style={
            styles.summaryCardHighlight
          }
        >
          <span>
            Today&apos;s Target
          </span>

          <strong>
            {formatLiters(
              targetPlan.todaysTargetLiters,
            )}
          </strong>

          <small>
            Rolling requirement for{" "}
            {getDayLabel(
              today,
            )}
          </small>
        </article>

        <article
          style={
            styles.summaryCard
          }
        >
          <span>
            Remaining This Week
          </span>

          <strong>
            {formatLiters(
              targetPlan.weeklyRemainingLiters,
            )}
          </strong>

          <small>
            {targetPlan.futureDaysRemaining >
            0
              ? `${formatLiters(
                  targetPlan.nextRequiredLiters,
                )} average after today`
              : "Final operational day"}
          </small>
        </article>
      </section>

      {/* =====================================
          WEEKLY ROLLING PLAN
         ===================================== */}

      <section
        style={
          styles.rollingCard
        }
      >
        <div
          style={
            styles.sectionHeader
          }
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              Dynamic Daily Pace
            </p>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Weekly Rolling Targets
            </h2>

            <p
              style={
                styles.sectionCopy
              }
            >
              Daily requirements automatically
              adjust based on actual production.
              Overperformance lowers the
              remaining pace; underperformance
              raises it.
            </p>
          </div>

          <span
            style={
              styles.badge
            }
          >
            Weekly Goal Fixed
          </span>
        </div>

        <div
          style={
            styles.weekTable
          }
        >
          <div
            style={
              styles.weekTableHeader
            }
          >
            <span>Day</span>
            <span>Target</span>
            <span>Actual</span>
            <span>Variance</span>
            <span>Achievement</span>
            <span>Donors</span>
          </div>

          {targetPlan.days.map(
            (row) => {
              const positive =
                (
                  row.varianceLiters ??
                  0
                ) >= 0;

              return (
                <div
                  key={
                    row.key
                  }
                  style={{
                    ...styles.weekTableRow,

                    ...(row.isToday
                      ? styles.todayRow
                      : {}),
                  }}
                >
                  <div>
                    <strong>
                      {getDayLabel(
                        row.date,
                      )}
                    </strong>

                    <small
                      style={
                        styles.rowDate
                      }
                    >
                      {getShortDate(
                        row.date,
                      )}

                      {row.isToday
                        ? " • Today"
                        : ""}
                    </small>
                  </div>

                  <strong>
                    {formatLiters(
                      row.targetLiters,
                    )}
                  </strong>

                  <span>
                    {row.actualLiters !==
                    null
                      ? formatLiters(
                          row.actualLiters,
                        )
                      : row.isFuture
                        ? "Planned"
                        : "—"}
                  </span>

                  <span
                    style={{
                      color:
                        row.varianceLiters ===
                        null
                          ? "#8a7a4f"
                          : positive
                            ? "#28743a"
                            : "#ad4e28",

                      fontWeight:
                        900,
                    }}
                  >
                    {row.varianceLiters ===
                    null
                      ? "—"
                      : `${positive ? "+" : ""}${formatLiters(
                          row.varianceLiters,
                        )}`}
                  </span>

                  <span>
                    {row.completionPercentage !==
                    null
                      ? formatPercent(
                          row.completionPercentage,
                        )
                      : "—"}
                  </span>

                  <span>
                    {row.actualDonors !==
                    null
                      ? `${row.actualDonors.toLocaleString(
                          "en-US",
                        )} / ${row.targetDonors}`
                      : `Target ${row.targetDonors}`}
                  </span>
                </div>
              );
            },
          )}
        </div>
      </section>

      {/* =====================================
          PRODUCTION ENTRY
         ===================================== */}

      <section
        style={
          styles.entryCard
        }
      >
        <div
          style={
            styles.sectionHeader
          }
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              Official Daily Total
            </p>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Enter center production
            </h2>
          </div>

          <span
            style={
              styles.badge
            }
          >
            Center Level
          </span>
        </div>

        <form
          action={
            saveDailyCenterProduction
          }
          style={
            styles.entryForm
          }
        >
          <label
            style={
              styles.field
            }
          >
            <span
              style={
                styles.label
              }
            >
              Production Date
            </span>

            <small
              style={
                styles.helpText
              }
            >
              One official record is stored
              for each operational day.
            </small>

            <input
              name="entryDate"
              type="date"
              defaultValue={
                formatDateInput(
                  today,
                )
              }
              required
              style={
                styles.input
              }
            />
          </label>

          <label
            style={
              styles.field
            }
          >
            <span
              style={
                styles.label
              }
            >
              Total Liters
            </span>

            <small
              style={
                styles.helpText
              }
            >
              Today&apos;s rolling requirement is{" "}
              {formatLiters(
                targetPlan.todaysTargetLiters,
              )}.
            </small>

            <input
              name="liters"
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              defaultValue={
                todayRow
                  ?.actualLiters ??
                undefined
              }
              required
              style={
                styles.input
              }
            />
          </label>

          <label
            style={
              styles.field
            }
          >
            <span
              style={
                styles.label
              }
            >
              Total Donors
            </span>

            <small
              style={
                styles.helpText
              }
            >
              Current rolling donor target:{" "}
              {targetPlan.todaysTargetDonors}.
            </small>

            <input
              name="donors"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              defaultValue={
                todayRow
                  ?.actualDonors ??
                undefined
              }
              required
              style={
                styles.input
              }
            />
          </label>

          <div
            style={
              styles.formActions
            }
          >
            <button
              type="submit"
              style={
                styles.primaryButton
              }
            >
              Save Daily Production
            </button>
          </div>
        </form>
      </section>

      {/* =====================================
          MONTHLY / LATEST SUMMARY
         ===================================== */}

      <section
        style={
          styles.secondarySummary
        }
      >
        <article
          style={
            styles.secondaryCard
          }
        >
          <span>
            Month Collected
          </span>

          <strong>
            {formatLiters(
              monthlyActualLiters,
            )}
          </strong>

          <small>
            {formatPercent(
              monthlyCompletion,
            )}{" "}
            of{" "}
            {formatLiters(
              monthlyGoalLiters,
            )}
          </small>
        </article>

        <article
          style={
            styles.secondaryCard
          }
        >
          <span>
            Monthly Donors
          </span>

          <strong>
            {monthlyActualDonors.toLocaleString(
              "en-US",
            )}
          </strong>

          <small>
            Goal{" "}
            {monthlyGoalDonors.toLocaleString(
              "en-US",
            )}
          </small>
        </article>

        <article
          style={
            styles.secondaryCard
          }
        >
          <span>
            Latest Entry
          </span>

          <strong>
            {latestEntry
              ? formatLiters(
                  latestEntry.liters,
                )
              : "—"}
          </strong>

          <small>
            {latestEntry
              ? latestEntry.entryDate.toLocaleDateString(
                  "en-US",
                  {
                    month:
                      "short",
                    day:
                      "numeric",
                  },
                )
              : "No production entered"}
          </small>
        </article>
      </section>

      {/* =====================================
          RECENT HISTORY
         ===================================== */}

      <section
        style={
          styles.historySection
        }
      >
        <div
          style={
            styles.sectionHeader
          }
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              Production History
            </p>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Recent center totals
            </h2>
          </div>
        </div>

        {recentEntries.length ===
        0 ? (
          <div
            style={
              styles.emptyState
            }
          >
            No center production records
            have been entered yet.
          </div>
        ) : (
          <div
            style={
              styles.historyTable
            }
          >
            <div
              style={
                styles.tableHeader
              }
            >
              <span>Date</span>
              <span>Liters</span>
              <span>Donors</span>
            </div>

            {recentEntries.map(
              (entry) => (
                <div
                  key={
                    entry.id
                  }
                  style={
                    styles.tableRow
                  }
                >
                  <strong>
                    {entry.entryDate.toLocaleDateString(
                      "en-US",
                      {
                        month:
                          "short",
                        day:
                          "numeric",
                        year:
                          "numeric",
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
      "repeat(auto-fit,minmax(205px,1fr))",
    gap: 14,
    marginBottom: 20,
  },

  summaryCard: {
    display: "flex",
    flexDirection:
      "column" as const,
    padding: 18,
    border:
      "1px solid #dfc36c",
    borderRadius: 16,
    background:
      "linear-gradient(145deg,#ffffff,#fff7d1)",
    boxShadow:
      "0 8px 20px rgba(76,53,6,.08)",
    color: "#3d2a07",
  },

  summaryCardHighlight: {
    display: "flex",
    flexDirection:
      "column" as const,
    padding: 18,
    border:
      "2px solid #d6a518",
    borderRadius: 16,
    background:
      "linear-gradient(145deg,#fff4ad,#ffe379)",
    boxShadow:
      "0 8px 22px rgba(126,88,0,.13)",
    color: "#3d2a07",
  },

  rollingCard: {
    marginBottom: 24,
    padding: 22,
    border:
      "1px solid #e2cd83",
    borderRadius: 20,
    background:
      "#ffffff",
    boxShadow:
      "0 10px 24px rgba(76,53,6,.07)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 18,
    marginBottom: 20,
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#9a6b08",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing:
      "0.14em",
    textTransform:
      "uppercase" as const,
  },

  sectionTitle: {
    margin: 0,
    color: "#3d2a07",
  },

  sectionCopy: {
    maxWidth: 720,
    margin:
      "7px 0 0",
    color: "#75653e",
    fontSize: 12,
    lineHeight: 1.5,
  },

  badge: {
    padding:
      "7px 11px",
    borderRadius: 999,
    background:
      "#fff0b7",
    color: "#825900",
    fontSize: 11,
    fontWeight: 900,
    textTransform:
      "uppercase" as const,
  },

  weekTable: {
    overflow:
      "hidden",
    border:
      "1px solid #eadba7",
    borderRadius: 14,
  },

  weekTableHeader: {
    display: "grid",
    gridTemplateColumns:
      "1.25fr 1fr 1fr 1fr 1fr 1fr",
    gap: 10,
    padding:
      "10px 14px",
    background:
      "#fff1b8",
    color: "#6d4d08",
    fontSize: 10,
    fontWeight: 900,
    textTransform:
      "uppercase" as const,
  },

  weekTableRow: {
    display: "grid",
    gridTemplateColumns:
      "1.25fr 1fr 1fr 1fr 1fr 1fr",
    gap: 10,
    alignItems:
      "center",
    padding:
      "12px 14px",
    borderTop:
      "1px solid #eee2b8",
    color: "#49350b",
    fontSize: 12,
  },

  todayRow: {
    background:
      "#fff9df",
    boxShadow:
      "inset 4px 0 0 #d59d00",
  },

  rowDate: {
    display: "block",
    marginTop: 2,
    color: "#88794e",
    fontSize: 10,
  },

  entryCard: {
    marginBottom: 24,
    padding: 24,
    border:
      "1px solid #e2cd83",
    borderRadius: 20,
    background: "#ffffff",
    boxShadow:
      "0 10px 24px rgba(76,53,6,.07)",
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
    padding:
      "12px 13px",
    border:
      "1px solid #dbc77f",
    borderRadius: 10,
    background:
      "#fffef9",
    color: "#302204",
    font: "inherit",
    fontWeight: 700,
    boxSizing:
      "border-box" as const,
  },

  formActions: {
    display: "flex",
    alignItems:
      "flex-end",
    justifyContent:
      "flex-end",
  },

  primaryButton: {
    padding:
      "13px 19px",
    border: 0,
    borderRadius: 10,
    background:
      "linear-gradient(135deg,#4c3506,#805b08)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondarySummary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
    marginBottom: 24,
  },

  secondaryCard: {
    display: "flex",
    flexDirection:
      "column" as const,
    padding: 16,
    border:
      "1px solid #e4d6a4",
    borderRadius: 14,
    background:
      "#fffdf5",
    color: "#3d2a07",
  },

  historySection: {
    marginTop: 12,
  },

  emptyState: {
    padding: 30,
    border:
      "1px dashed #d5bd6d",
    borderRadius: 16,
    background:
      "#fffdf5",
    color: "#76643a",
    textAlign:
      "center" as const,
  },

  historyTable: {
    overflow:
      "hidden",
    border:
      "1px solid #e2cd83",
    borderRadius: 16,
    background:
      "#ffffff",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "1.4fr 1fr 1fr",
    padding:
      "12px 16px",
    background:
      "#fff1b8",
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
    padding:
      "14px 16px",
    borderTop:
      "1px solid #eee2b8",
    color: "#49350b",
  },
};