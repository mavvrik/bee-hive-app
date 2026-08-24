import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

import AdminShell from "@/app/settings/components/AdminShell";

export const dynamic =
  "force-dynamic";

const CENTER_TIME_ZONE =
  "America/New_York";

type SearchParams = Promise<{
  week?: string | string[];
}>;

function getOperationalDateParts(
  date: Date,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          CENTER_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    ).formatToParts(
      date,
    );

  const year =
    Number(
      parts.find(
        (
          part,
        ) =>
          part.type ===
          "year",
      )?.value,
    );

  const month =
    Number(
      parts.find(
        (
          part,
        ) =>
          part.type ===
          "month",
      )?.value,
    );

  const day =
    Number(
      parts.find(
        (
          part,
        ) =>
          part.type ===
          "day",
      )?.value,
    );

  return {
    year,
    month,
    day,
  };
}

function getOperationalDateString(
  date: Date,
) {
  const {
    year,
    month,
    day,
  } =
    getOperationalDateParts(
      date,
    );

  return [
    String(
      year,
    ),
    String(
      month,
    ).padStart(
      2,
      "0",
    ),
    String(
      day,
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}

function parseDateOnly(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "Invalid operational date.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function toDateString(
  date: Date,
) {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function addDays(
  dateText: string,
  days: number,
) {
  const date =
    parseDateOnly(
      dateText,
    );

  date.setUTCDate(
    date.getUTCDate() +
      days,
  );

  return toDateString(
    date,
  );
}

function getWeekStart(
  dateText: string,
) {
  const date =
    parseDateOnly(
      dateText,
    );

  const day =
    date.getUTCDay();

  date.setUTCDate(
    date.getUTCDate() -
      day,
  );

  return toDateString(
    date,
  );
}

function formatDate(
  dateText: string,
  includeYear = false,
) {
  const date =
    parseDateOnly(
      dateText,
    );

  return date.toLocaleDateString(
    "en-US",
    {
      timeZone:
        "UTC",

      weekday:
        "short",

      month:
        "short",

      day:
        "numeric",

      ...(includeYear
        ? {
            year:
              "numeric" as const,
          }
        : {}),
    },
  );
}

function formatWeekRange(
  weekStart: string,
  weekEnd: string,
) {
  const start =
    parseDateOnly(
      weekStart,
    );

  const end =
    parseDateOnly(
      weekEnd,
    );

  const startLabel =
    start.toLocaleDateString(
      "en-US",
      {
        timeZone:
          "UTC",

        month:
          "short",

        day:
          "numeric",
      },
    );

  const endLabel =
    end.toLocaleDateString(
      "en-US",
      {
        timeZone:
          "UTC",

        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",
      },
    );

  return `${startLabel} – ${endLabel}`;
}

function timeToMinutes(
  value: string,
) {
  const match =
    value
      .trim()
      .match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
      );

  if (
    !match
  ) {
    return 99999;
  }

  let hour =
    Number(
      match[1],
    );

  const minute =
    Number(
      match[2],
    );

  const period =
    match[3]
      ?.toUpperCase();

  if (
    period ===
      "AM" &&
    hour ===
      12
  ) {
    hour =
      0;
  }

  if (
    period ===
      "PM" &&
    hour !==
      12
  ) {
    hour +=
      12;
  }

  return (
    hour *
      60 +
    minute
  );
}

function getScheduleRoleGroup(
  primaryJob: string | null,
) {
  const job =
    (primaryJob ?? "")
      .trim()
      .toLowerCase();

  if (
    job.includes("phleb") ||
    job.includes("pheresis")
  ) {
    return "Phlebotomy";
  }

  if (
    job.includes("reception")
  ) {
    return "Reception";
  }

  if (
    job.includes("medical staff") ||
    job === "msa" ||
    job.includes(" msa")
  ) {
    return "MSA";
  }

  if (
    job.includes("donor support") ||
    job === "dst" ||
    job.includes(" dst")
  ) {
    return "DST";
  }

  if (
    job.includes("processing") ||
    job.includes("processor")
  ) {
    return "Processing";
  }

  if (
    job.includes("quality")
  ) {
    return "Quality";
  }

  if (
    job.includes("manager") ||
    job.includes("supervisor")
  ) {
    return "Management";
  }

  if (
    job.includes("group lead") ||
    job.includes("group leader")
  ) {
    return "Group Lead";
  }

  return "Other";
}

const scheduleRoleOrder = [
  "Phlebotomy",
  "Reception",
  "MSA",
  "DST",
  "Processing",
  "Quality",
  "Management",
  "Group Lead",
  "Other",
];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams:
    SearchParams;
}) {
  await requireAdmin();

  const params =
    await searchParams;

  const rawWeek =
    Array.isArray(
      params.week,
    )
      ? params.week[0]
      : params.week;

  const today =
    getOperationalDateString(
      new Date(),
    );

  const requestedDate =
    rawWeek &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      rawWeek,
    )
      ? rawWeek
      : today;

  const weekStart =
    getWeekStart(
      requestedDate,
    );

  const weekEnd =
    addDays(
      weekStart,
      6,
    );

  const nextWeekStart =
    addDays(
      weekStart,
      7,
    );

  const previousWeekStart =
    addDays(
      weekStart,
      -7,
    );

  const currentWeekStart =
    getWeekStart(
      today,
    );

  const shifts =
    await prisma.scheduledShift.findMany({
      where: {
        shiftDate: {
          gte:
            parseDateOnly(
              weekStart,
            ),

          lte:
            parseDateOnly(
              weekEnd,
            ),
        },
      },

      include: {
        collector: {
          select: {
            id:
              true,

            name:
              true,

            preferredName:
              true,

            active:
              true,
          },
        },
      },

      orderBy: [
        {
          shiftDate:
            "asc",
        },

        {
          employeeName:
            "asc",
        },
      ],
    });

  const days =
    Array.from(
      {
        length:
          7,
      },
      (
        _,
        index,
      ) => {
        const date =
          addDays(
            weekStart,
            index,
          );

        const dayShifts =
          shifts
            .filter(
              (
                shift,
              ) =>
                toDateString(
                  shift.shiftDate,
                ) ===
                date,
            )
            .sort(
              (
                a,
                b,
              ) => {
                const timeDifference =
                  timeToMinutes(
                    a.startTime,
                  ) -
                  timeToMinutes(
                    b.startTime,
                  );

                if (
                  timeDifference !==
                  0
                ) {
                  return timeDifference;
                }

                return a.employeeName.localeCompare(
                  b.employeeName,
                );
              },
            );

        const roleGroups =
          scheduleRoleOrder
            .map(
              (
                roleGroup,
              ) => ({
                roleGroup,

                shifts:
                  dayShifts.filter(
                    (
                      shift,
                    ) =>
                      getScheduleRoleGroup(
                        shift.primaryJob,
                      ) ===
                      roleGroup,
                  ),
              }),
            )
            .filter(
              (
                group,
              ) =>
                group.shifts.length >
                0,
            );

        return {
          date,
          shifts:
            dayShifts,
          roleGroups,
        };
      },
    );

  const todayShifts =
    shifts.filter(
      (
        shift,
      ) =>
        toDateString(
          shift.shiftDate,
        ) ===
        today,
    );

  const uniqueWorkers =
    new Set(
      shifts
        .map(
          (
            shift,
          ) =>
            shift.collectorId ??
            shift.employeeName,
        ),
    );

  const isCurrentWeek =
    weekStart ===
    currentWeekStart;

  return (
    <AdminShell
      pageTitle="Weekly Staff Schedule"
      pageDescription="See who is scheduled to work each day and when they are expected on site."
      activePath="/schedule"
    >
      <div
        style={
          styles.topBar
        }
      >
        <div>
          <p
            style={
              styles.eyebrow
            }
          >
            HIVE Workforce Schedule
          </p>

          <h2
            style={
              styles.weekTitle
            }
          >
            {formatWeekRange(
              weekStart,
              weekEnd,
            )}
          </h2>

          <p
            style={
              styles.weekCopy
            }
          >
            Sunday through Saturday staffing
            based on the most recently imported
            CSL weekly schedule.
          </p>
        </div>

        <Link
          href="/settings/weekly-schedule"
          style={
            styles.importLink
          }
        >
          Upload Schedule
        </Link>
      </div>

      <section
        style={
          styles.navigation
        }
      >
        <Link
          href={`/schedule?week=${previousWeekStart}`}
          style={
            styles.navButton
          }
        >
          ← Previous Week
        </Link>

        {!isCurrentWeek && (
          <Link
            href={`/schedule?week=${currentWeekStart}`}
            style={
              styles.currentButton
            }
          >
            Current Week
          </Link>
        )}

        <Link
          href={`/schedule?week=${nextWeekStart}`}
          style={
            styles.navButton
          }
        >
          Next Week →
        </Link>
      </section>

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
            Weekly Shifts
          </span>

          <strong>
            {shifts.length.toLocaleString(
              "en-US",
            )}
          </strong>

          <small>
            Scheduled shifts this week
          </small>
        </article>

        <article
          style={
            styles.summaryCard
          }
        >
          <span>
            Scheduled Workers
          </span>

          <strong>
            {uniqueWorkers.size.toLocaleString(
              "en-US",
            )}
          </strong>

          <small>
            Unique workers this week
          </small>
        </article>

        <article
          style={
            isCurrentWeek
              ? styles.summaryCardHighlight
              : styles.summaryCard
          }
        >
          <span>
            Working Today
          </span>

          <strong>
            {isCurrentWeek
              ? todayShifts.length.toLocaleString(
                  "en-US",
                )
              : "—"}
          </strong>

          <small>
            {isCurrentWeek
              ? formatDate(
                  today,
                  true,
                )
              : "Viewing another week"}
          </small>
        </article>
      </section>

      {shifts.length ===
      0 ? (
        <section
          style={
            styles.emptyState
          }
        >
          <strong>
            No schedule found for this week.
          </strong>

          <p>
            Upload the CSL weekly employee schedule
            to populate this view.
          </p>

          <Link
            href="/settings/weekly-schedule"
            style={
              styles.emptyLink
            }
          >
            Upload Schedule
          </Link>
        </section>
      ) : (
        <section
          style={
            styles.dayGrid
          }
        >
          {days.map(
            (
              day,
            ) => {
              const isToday =
                day.date ===
                today;

              return (
                <article
                  key={
                    day.date
                  }
                  style={{
                    ...styles.dayCard,

                    ...(isToday
                      ? styles.todayCard
                      : {}),
                  }}
                >
                  <div
                    style={
                      styles.dayHeader
                    }
                  >
                    <div>
                      <h3
                        style={
                          styles.dayTitle
                        }
                      >
                        {formatDate(
                          day.date,
                        )}
                      </h3>

                      {isToday && (
                        <span
                          style={
                            styles.todayBadge
                          }
                        >
                          Today
                        </span>
                      )}
                    </div>

                    <strong
                      style={
                        styles.dayCount
                      }
                    >
                      {day.shifts.length}
                    </strong>
                  </div>

                  {day.shifts.length ===
                  0 ? (
                    <div
                      style={
                        styles.noShifts
                      }
                    >
                      No scheduled shifts
                    </div>
                  ) : (
                    <div
                      style={
                        styles.shiftList
                      }
                    >
                      {day.roleGroups.map(
                        (
                          group,
                        ) => (
                          <div
                            key={
                              group.roleGroup
                            }
                          >
                            <div
                              style={
                                styles.roleGroupHeader
                              }
                            >
                              <strong>
                                {group.roleGroup}
                              </strong>

                              <span>
                                {group.shifts.length}{" "}
                                {group.shifts.length === 1
                                  ? "worker"
                                  : "workers"}
                              </span>
                            </div>

                            {group.shifts.map(
                              (
                                shift,
                              ) => {
                                const displayName =
                                  shift.collector
                                    ?.preferredName ||
                                  shift.collector
                                    ?.name ||
                                  shift.employeeName;

                                return (
                                  <div
                                    key={
                                      shift.id
                                    }
                                    style={
                                      styles.shiftRow
                                    }
                                  >
                                    <div
                                      style={
                                        styles.workerBlock
                                      }
                                    >
                                      <strong
                                        style={
                                          styles.workerName
                                        }
                                      >
                                        {displayName}
                                      </strong>

                                      <span
                                        style={
                                          styles.jobLabel
                                        }
                                      >
                                        {shift.primaryJob ||
                                          "Scheduled Worker"}
                                      </span>
                                    </div>

                                    <div
                                      style={
                                        styles.timeBlock
                                      }
                                    >
                                      <strong>
                                        {
                                          shift.startTime
                                        }
                                      </strong>

                                      <span>
                                        to
                                      </span>

                                      <strong>
                                        {
                                          shift.endTime
                                        }
                                      </strong>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </article>
              );
            },
          )}
        </section>
      )}
    </AdminShell>
  );
}

const styles = {
  topBar: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    flexWrap:
      "wrap" as const,

    gap:
      18,

    marginBottom:
      18,
  },

  eyebrow: {
    margin:
      "0 0 6px",

    color:
      "#9a6b08",

    fontSize:
      11,

    fontWeight:
      900,

    letterSpacing:
      "0.14em",

    textTransform:
      "uppercase" as const,
  },

  weekTitle: {
    margin:
      0,

    color:
      "#3d2a07",

    fontSize:
      26,
  },

  weekCopy: {
    maxWidth:
      680,

    margin:
      "7px 0 0",

    color:
      "#75653e",

    fontSize:
      13,

    lineHeight:
      1.5,
  },

  importLink: {
    padding:
      "11px 15px",

    borderRadius:
      10,

    background:
      "#805b08",

    color:
      "#ffffff",

    fontSize:
      12,

    fontWeight:
      900,

    textDecoration:
      "none",
  },

  navigation: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      10,

    marginBottom:
      18,
  },

  navButton: {
    padding:
      "9px 12px",

    border:
      "1px solid #dbc77f",

    borderRadius:
      9,

    background:
      "#fffdf5",

    color:
      "#6d4d08",

    fontSize:
      12,

    fontWeight:
      800,

    textDecoration:
      "none",
  },

  currentButton: {
    padding:
      "9px 12px",

    border:
      "1px solid #d6a518",

    borderRadius:
      9,

    background:
      "#fff1b8",

    color:
      "#6d4d08",

    fontSize:
      12,

    fontWeight:
      900,

    textDecoration:
      "none",
  },

  summaryGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",

    gap:
      14,

    marginBottom:
      22,
  },

  summaryCard: {
    display:
      "grid",

    gap:
      5,

    padding:
      17,

    border:
      "1px solid #e2cd83",

    borderRadius:
      15,

    background:
      "#ffffff",

    color:
      "#49350b",
  },

  summaryCardHighlight: {
    display:
      "grid",

    gap:
      5,

    padding:
      17,

    border:
      "2px solid #d6a518",

    borderRadius:
      15,

    background:
      "#fff7d1",

    color:
      "#49350b",
  },

  dayGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(310px,1fr))",

    gap:
      16,
  },

  dayCard: {
    overflow:
      "hidden",

    border:
      "1px solid #e2cd83",

    borderRadius:
      17,

    background:
      "#ffffff",

    boxShadow:
      "0 8px 20px rgba(76,53,6,.06)",
  },

  todayCard: {
    border:
      "2px solid #d6a518",

    boxShadow:
      "0 10px 24px rgba(126,88,0,.13)",
  },

  dayHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    padding:
      "14px 16px",

    background:
      "#fff1b8",

    color:
      "#49350b",
  },

  dayTitle: {
    margin:
      0,

    fontSize:
      17,
  },

  todayBadge: {
    display:
      "inline-block",

    marginTop:
      5,

    padding:
      "3px 7px",

    borderRadius:
      999,

    background:
      "#805b08",

    color:
      "#ffffff",

    fontSize:
      9,

    fontWeight:
      900,

    textTransform:
      "uppercase" as const,
  },

  dayCount: {
    display:
      "grid",

    placeItems:
      "center",

    width:
      34,

    height:
      34,

    borderRadius:
      "50%",

    background:
      "#ffffff",

    color:
      "#805b08",
  },

  roleGroupHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    padding:
      "8px 15px",

    borderTop:
      "1px solid #e3cf85",

    borderBottom:
      "1px solid #eee2b8",

    background:
      "#fff9e5",

    color:
      "#805b08",

    fontSize:
      10,

    fontWeight:
      900,

    letterSpacing:
      "0.06em",

    textTransform:
      "uppercase" as const,
  },

  shiftList: {
    display:
      "grid",
  },

  shiftRow: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      12,

    padding:
      "12px 15px",

    borderTop:
      "1px solid #f0e6c5",
  },

  workerBlock: {
    display:
      "grid",

    gap:
      3,
  },

  workerName: {
    color:
      "#3d2a07",

    fontSize:
      13,
  },

  jobLabel: {
    color:
      "#87774c",

    fontSize:
      10,
  },

  timeBlock: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      5,

    whiteSpace:
      "nowrap" as const,

    color:
      "#6d4d08",

    fontSize:
      11,
  },

  noShifts: {
    padding:
      22,

    color:
      "#91845e",

    fontSize:
      12,

    textAlign:
      "center" as const,
  },

  emptyState: {
    padding:
      35,

    border:
      "1px dashed #d5bd6d",

    borderRadius:
      17,

    background:
      "#fffdf5",

    color:
      "#6d4d08",

    textAlign:
      "center" as const,
  },

  emptyLink: {
    display:
      "inline-block",

    marginTop:
      12,

    padding:
      "10px 14px",

    borderRadius:
      9,

    background:
      "#805b08",

    color:
      "#ffffff",

    fontWeight:
      900,

    textDecoration:
      "none",
  },
};