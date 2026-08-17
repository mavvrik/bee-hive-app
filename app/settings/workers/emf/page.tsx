import Link from "next/link";

import { prisma } from "@/lib/prisma";

import AdminShell from "../../components/AdminShell";

import {
  saveEmfEntries,
} from "./actions";

export const dynamic =
  "force-dynamic";

type EmfPageProps = {
  searchParams: Promise<{
    date?: string;
    saved?: string;
  }>;
};

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

function parseDateInput(
  value: string | undefined,
) {
  if (!value) {
    return new Date();
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return new Date();
  }

  return new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0,
  );
}

function formatReadableDate(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );
}

export default async function EmfPage({
  searchParams,
}: EmfPageProps) {
  const {
    date,
    saved,
  } = await searchParams;

  const selectedDate =
    parseDateInput(date);

  const selectedDateValue =
    formatDateInput(
      selectedDate,
    );

  const startOfMonth =
    new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

  const startOfNextMonth =
    new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    );

  const [
    collectors,
    selectedDateEntries,
    monthlyEmfTotals,
    recentEntries,
  ] = await Promise.all([
    prisma.collector.findMany({
      where: {
        active: true,
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.qualityEmfEntry.findMany({
      where: {
        entryDate:
          selectedDate,
      },
    }),

    prisma.qualityEmfEntry.groupBy({
      by: [
        "collectorId",
      ],

      where: {
        entryDate: {
          gte:
            startOfMonth,

          lt:
            startOfNextMonth,
        },
      },

      _sum: {
        emfCount: true,
      },
    }),

    prisma.qualityEmfEntry.findMany({
      include: {
        collector: {
          select: {
            name: true,
            preferredName: true,
          },
        },
      },

      orderBy: [
        {
          entryDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      take: 20,
    }),
  ]);

  const selectedEntryMap =
    new Map(
      selectedDateEntries.map(
        (entry) => [
          entry.collectorId,
          entry,
        ],
      ),
    );

  const monthlyTotalMap =
    new Map(
      monthlyEmfTotals.map(
        (entry) => [
          entry.collectorId,
          entry._sum.emfCount ?? 0,
        ],
      ),
    );

  const rankedCollectors =
    collectors
      .map((collector) => ({
        collector,
        monthlyEmfs:
          monthlyTotalMap.get(
            collector.id,
          ) ?? 0,
      }))
      .sort((a, b) => {
        if (
          a.monthlyEmfs !==
          b.monthlyEmfs
        ) {
          return (
            a.monthlyEmfs -
            b.monthlyEmfs
          );
        }

        return (
          a.collector.position -
          b.collector.position
        );
      });

  const totalMonthlyEmfs =
    rankedCollectors.reduce(
      (
        total,
        worker,
      ) =>
        total +
        worker.monthlyEmfs,
      0,
    );

  const workersWithZeroEmfs =
    rankedCollectors.filter(
      (worker) =>
        worker.monthlyEmfs === 0,
    ).length;

  return (
    <AdminShell
      pageTitle="Quality / EMF Tracking"
      pageDescription="Record Quality EMFs by Worker Bee and review month-to-date quality performance."
      activePath="/settings/workers/emf"
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Link
            href="/settings/workers"
            style={{
              color: "#805c0b",
              fontWeight: 900,
              textDecoration:
                "none",
            }}
          >
            ← Worker Bees
          </Link>

          <Link
            href="/settings/workers/performance"
            style={{
              color: "#805c0b",
              fontWeight: 900,
              textDecoration:
                "none",
            }}
          >
            Stick Performance
          </Link>
        </div>

        <div
          style={{
            padding:
              "8px 12px",
            borderRadius: 999,
            background:
              "#fff6cd",
            color:
              "#765400",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          Quality Weight: 30%
        </div>
      </div>

      {saved === "1" && (
        <div
          style={{
            marginBottom: 18,
            padding:
              "12px 15px",
            border:
              "1px solid #afd8b4",
            borderRadius: 12,
            background:
              "#effbf0",
            color:
              "#276b32",
            fontWeight: 800,
          }}
        >
          Quality / EMF entries
          saved successfully.
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <SummaryCard
          label="Month"
          value={startOfMonth.toLocaleDateString(
            "en-US",
            {
              month: "long",
              year: "numeric",
            },
          )}
          helper="Current quality review period"
        />

        <SummaryCard
          label="Total EMFs"
          value={String(
            totalMonthlyEmfs,
          )}
          helper="Lower is better"
        />

        <SummaryCard
          label="Zero EMF Bees"
          value={`${workersWithZeroEmfs} / ${collectors.length}`}
          helper="Workers with no EMFs this month"
        />
      </section>

      <section
        style={{
          marginBottom: 24,
          padding: 20,
          border:
            "1px solid #e2d49a",
          borderRadius: 18,
          background:
            "#fffdf5",
          boxShadow:
            "0 8px 25px rgba(92, 69, 9, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              "space-between",
            alignItems: "end",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                margin:
                  "0 0 5px",
                color:
                  "#a36d00",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing:
                  "0.12em",
                textTransform:
                  "uppercase",
              }}
            >
              Quality Entry
            </p>

            <h2
              style={{
                margin: 0,
                color:
                  "#43320c",
              }}
            >
              {formatReadableDate(
                selectedDate,
              )}
            </h2>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "#746640",
                fontSize: 13,
              }}
            >
              Enter only confirmed
              Quality EMFs.
            </p>
          </div>

          <form
            method="get"
            style={{
              display: "flex",
              alignItems: "end",
              gap: 8,
            }}
          >
            <label
              style={{
                display: "grid",
                gap: 5,
                color:
                  "#5d4b1c",
                fontSize: 11,
                fontWeight: 900,
                textTransform:
                  "uppercase",
              }}
            >
              Entry Date

              <input
                type="date"
                name="date"
                defaultValue={
                  selectedDateValue
                }
                style={{
                  height: 42,
                  padding:
                    "8px 11px",
                  border:
                    "1px solid #d8c47a",
                  borderRadius: 9,
                  fontWeight: 700,
                }}
              />
            </label>

            <button
              type="submit"
              style={{
                height: 42,
                padding:
                  "0 14px",
                border: 0,
                borderRadius: 9,
                background:
                  "#66500f",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Load Date
            </button>
          </form>
        </div>

        <form
          action={
            saveEmfEntries
          }
        >
          <input
            type="hidden"
            name="entryDate"
            value={
              selectedDateValue
            }
          />

          <div
            style={{
              display: "grid",
              gap: 11,
            }}
          >
            {collectors.map(
              (collector) => {
                const existing =
                  selectedEntryMap.get(
                    collector.id,
                  );

                const monthlyTotal =
                  monthlyTotalMap.get(
                    collector.id,
                  ) ?? 0;

                const displayName =
                  collector
                    .preferredName
                    ?.trim() ||
                  collector.name;

                return (
                  <div
                    key={
                      collector.id
                    }
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "minmax(190px, 1fr) 115px minmax(240px, 1.5fr) 110px",

                      gap: 12,

                      alignItems:
                        "center",

                      padding:
                        "12px 14px",

                      border:
                        "1px solid #eadfb6",

                      borderRadius:
                        13,

                      background:
                        existing
                          ? "#fff8d9"
                          : "#ffffff",
                    }}
                  >
                    <input
                      type="hidden"
                      name="collectorId"
                      value={
                        collector.id
                      }
                    />

                    <div>
                      <strong
                        style={{
                          display:
                            "block",
                          color:
                            "#493710",
                          fontSize:
                            15,
                        }}
                      >
                        {
                          displayName
                        }
                      </strong>

                      <span
                        style={{
                          display:
                            "block",
                          marginTop:
                            3,
                          color:
                            "#89794c",
                          fontSize:
                            11,
                          fontWeight:
                            700,
                        }}
                      >
                        {
                          collector.role
                        }
                      </span>
                    </div>

                    <label
                      style={{
                        display:
                          "grid",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#78611d",
                          fontSize:
                            10,
                          fontWeight:
                            900,
                          textTransform:
                            "uppercase",
                        }}
                      >
                        EMFs
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        name={`emfCount-${collector.id}`}
                        defaultValue={
                          existing
                            ?.emfCount ??
                          0
                        }
                        style={{
                          height: 40,
                          width:
                            "100%",
                          padding:
                            "8px 10px",
                          border:
                            "1px solid #d8c47a",
                          borderRadius:
                            8,
                          fontWeight:
                            800,
                        }}
                      />
                    </label>

                    <label
                      style={{
                        display:
                          "grid",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#78611d",
                          fontSize:
                            10,
                          fontWeight:
                            900,
                          textTransform:
                            "uppercase",
                        }}
                      >
                        Quality Note
                      </span>

                      <input
                        type="text"
                        name={`note-${collector.id}`}
                        defaultValue={
                          existing
                            ?.note ??
                          ""
                        }
                        placeholder="Optional note..."
                        style={{
                          height: 40,
                          padding:
                            "8px 10px",
                          border:
                            "1px solid #d8c47a",
                          borderRadius:
                            8,
                        }}
                      />
                    </label>

                    <div
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#90772f",
                          fontSize:
                            9,
                          fontWeight:
                            900,
                          letterSpacing:
                            "0.07em",
                          textTransform:
                            "uppercase",
                        }}
                      >
                        MTD
                      </span>

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            2,
                          color:
                            monthlyTotal ===
                            0
                              ? "#27743a"
                              : "#9b5b08",
                          fontSize:
                            20,
                        }}
                      >
                        {
                          monthlyTotal
                        }
                      </strong>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginTop: 18,
            }}
          >
            <button
              type="submit"
              style={{
                padding:
                  "12px 20px",
                border: 0,
                borderRadius:
                  10,
                background:
                  "linear-gradient(135deg, #dca716, #9d6f00)",
                color:
                  "#ffffff",
                fontWeight:
                  900,
                cursor:
                  "pointer",
                boxShadow:
                  "0 7px 18px rgba(118, 81, 0, 0.18)",
              }}
            >
              Save Quality Entries
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(280px, 0.8fr) minmax(0, 1.2fr)",
          gap: 18,
        }}
      >
        <div
          style={{
            padding: 18,
            border:
              "1px solid #e2d49a",
            borderRadius: 16,
            background:
              "#fffdf5",
          }}
        >
          <p
            style={{
              margin:
                "0 0 4px",
              color:
                "#a36d00",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
            }}
          >
            Monthly Quality
          </p>

          <h3
            style={{
              margin:
                "0 0 14px",
              color:
                "#44330e",
            }}
          >
            EMF Ranking
          </h3>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            {rankedCollectors.map(
              (
                {
                  collector,
                  monthlyEmfs,
                },
                index,
              ) => (
                <div
                  key={
                    collector.id
                  }
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "28px 1fr auto",
                    alignItems:
                      "center",
                    gap: 8,
                    padding:
                      "8px 10px",
                    borderRadius:
                      9,
                    background:
                      monthlyEmfs ===
                      0
                        ? "#eff9ef"
                        : "#faf6e8",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#8b6a14",
                      fontSize:
                        12,
                    }}
                  >
                    #
                    {index +
                      1}
                  </strong>

                  <span
                    style={{
                      color:
                        "#4e401d",
                      fontWeight:
                        800,
                    }}
                  >
                    {collector
                      .preferredName ||
                      collector
                        .name}
                  </span>

                  <strong
                    style={{
                      color:
                        monthlyEmfs ===
                        0
                          ? "#26713a"
                          : "#9a5b0b",
                    }}
                  >
                    {
                      monthlyEmfs
                    }
                  </strong>
                </div>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            padding: 18,
            border:
              "1px solid #e2d49a",
            borderRadius: 16,
            background:
              "#fffdf5",
          }}
        >
          <p
            style={{
              margin:
                "0 0 4px",
              color:
                "#a36d00",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
            }}
          >
            Quality History
          </p>

          <h3
            style={{
              margin:
                "0 0 14px",
              color:
                "#44330e",
            }}
          >
            Recent EMF Entries
          </h3>

          {recentEntries.length ===
          0 ? (
            <p
              style={{
                color:
                  "#85764b",
              }}
            >
              No EMF history
              has been recorded.
            </p>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap: 8,
              }}
            >
              {recentEntries.map(
                (entry) => {
                  const workerName =
                    entry
                      .collector
                      .preferredName ||
                    entry
                      .collector
                      .name;

                  return (
                    <div
                      key={
                        entry.id
                      }
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "120px minmax(120px, 0.7fr) 70px minmax(0, 1fr)",
                        gap: 10,
                        alignItems:
                          "center",
                        padding:
                          "9px 10px",
                        borderBottom:
                          "1px solid #eee5c5",
                        color:
                          "#5a4b28",
                        fontSize:
                          12,
                      }}
                    >
                      <span>
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
                      </span>

                      <strong>
                        {
                          workerName
                        }
                      </strong>

                      <strong
                        style={{
                          color:
                            "#9a5b0b",
                        }}
                      >
                        {
                          entry.emfCount
                        }{" "}
                        EMF
                        {entry.emfCount ===
                        1
                          ? ""
                          : "s"}
                      </strong>

                      <span
                        style={{
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {entry.note ||
                          "—"}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        border:
          "1px solid #e1d49e",
        borderRadius: 14,
        background:
          "linear-gradient(145deg, #fffdf4, #fff7d8)",
      }}
    >
      <span
        style={{
          display: "block",
          color:
            "#977018",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing:
            "0.11em",
          textTransform:
            "uppercase",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: 5,
          color:
            "#46350d",
          fontSize: 22,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: 4,
          color:
            "#88784e",
          fontSize: 11,
        }}
      >
        {helper}
      </span>
    </div>
  );
}