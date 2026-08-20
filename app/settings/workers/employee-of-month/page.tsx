import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

import {
  getEmployeeOfMonthRecommendation,
} from "@/app/lib/employeeOfMonthEngine";

import AdminShell from "../../components/AdminShell";

import {
  clearEmployeeOfMonth,
  selectEmployeeOfMonth,
} from "./actions";

export const dynamic =
  "force-dynamic";

type EmployeeOfMonthPageProps = {
  searchParams: Promise<{
    saved?: string;
    cleared?: string;
  }>;
};

function getDisplayName(
  name: string,
  preferredName: string | null,
) {
  return (
    preferredName?.trim() ||
    name
  );
}

function formatScore(
  value: number | null,
) {
  if (
    value === null
  ) {
    return "N/A";
  }

  return value.toFixed(1);
}

export default async function EmployeeOfMonthPage({
  searchParams,
}: EmployeeOfMonthPageProps) {
  /*
   * ==========================================
   * PRIVATE MANAGEMENT PAGE
   * ==========================================
   */

  await requireAdmin();

  const {
    saved,
    cleared,
  } = await searchParams;

  const today =
    new Date();

  const result =
    await getEmployeeOfMonthRecommendation({
      year:
        today.getFullYear(),

      month:
        today.getMonth() + 1,
    });

  const [
    currentWinner,
    scoringSettings,
  ] = await Promise.all([
    prisma.collector.findFirst({
      where: {
        active: true,

        isEmployeeOfMonth:
          true,
      },

      select: {
        id: true,
        name: true,
        preferredName: true,
      },
    }),

    prisma.employeeOfMonthSettings.findUnique({
      where: {
        id: 1,
      },
    }),
  ]);

  const monthLabel =
    today.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      },
    );

  const productivityWeight =
    scoringSettings
      ?.productivityWeight ??
    35;

  const accuracyWeight =
    scoringSettings
      ?.accuracyWeight ??
    25;

  const qualityWeight =
    scoringSettings
      ?.qualityWeight ??
    25;

  const attendanceWeight =
    scoringSettings
      ?.attendanceWeight ??
    10;

  const recognitionWeight =
    scoringSettings
      ?.recognitionWeight ??
    5;

  return (
    <AdminShell
      pageTitle="Employee of the Month"
      pageDescription="Review the whole-HIVE recommendation and make the final management selection."
      activePath="/settings/workers/employee-of-month"
    >
      {/* ======================================
          TOP NAVIGATION
         ====================================== */}

      <div
        style={{
          display:
            "flex",

          flexWrap:
            "wrap",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            12,

          marginBottom:
            20,
        }}
      >
        <div
          style={{
            display:
              "flex",

            gap:
              14,

            flexWrap:
              "wrap",
          }}
        >
          <Link
            href="/settings/workers"
            style={{
              color:
                "#805c0b",

              fontWeight:
                900,

              textDecoration:
                "none",
            }}
          >
            ← Worker Bees
          </Link>

          <Link
            href="/settings/workers/performance"
            style={{
              color:
                "#805c0b",

              fontWeight:
                900,

              textDecoration:
                "none",
            }}
          >
            Daily Performance
          </Link>

          <Link
            href="/settings/workers/recognition"
            style={{
              color:
                "#805c0b",

              fontWeight:
                900,

              textDecoration:
                "none",
            }}
          >
            EOM Scoring
          </Link>
        </div>

        <span
          style={{
            padding:
              "8px 13px",

            borderRadius:
              999,

            background:
              "#fff2bd",

            color:
              "#755200",

            fontSize:
              12,

            fontWeight:
              900,
          }}
        >
          Private Management View
        </span>
      </div>

      {/* ======================================
          STATUS MESSAGES
         ====================================== */}

      {saved === "1" && (
        <div
          style={{
            marginBottom:
              18,

            padding:
              "12px 15px",

            border:
              "1px solid #aad6b0",

            borderRadius:
              11,

            background:
              "#effaf0",

            color:
              "#276b32",

            fontWeight:
              800,
          }}
        >
          Employee of the Month
          selection saved.
        </div>
      )}

      {cleared === "1" && (
        <div
          style={{
            marginBottom:
              18,

            padding:
              "12px 15px",

            border:
              "1px solid #dfcf90",

            borderRadius:
              11,

            background:
              "#fff9df",

            color:
              "#755b11",

            fontWeight:
              800,
          }}
        >
          Employee of the Month
          selection cleared.
        </div>
      )}

      {/* ======================================
          RECOMMENDATION / FINAL SELECTION
         ====================================== */}

      <section
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",

          gap:
            16,

          marginBottom:
            20,
        }}
      >
        <div
          style={{
            padding:
              20,

            border:
              "1px solid #e0ca78",

            borderRadius:
              18,

            background:
              "linear-gradient(145deg, #fff9dc, #fff1a7)",
          }}
        >
          <p
            style={{
              margin:
                0,

              color:
                "#9a6b00",

              fontSize:
                11,

              fontWeight:
                900,

              letterSpacing:
                "0.12em",

              textTransform:
                "uppercase",
            }}
          >
            HIVE Recommendation
          </p>

          <h2
            style={{
              margin:
                "7px 0 3px",

              color:
                "#493408",

              fontSize:
                28,
            }}
          >
            {result.recommendation
              ? getDisplayName(
                  result
                    .recommendation
                    .name,

                  result
                    .recommendation
                    .preferredName,
                )
              : "Not Available"}
          </h2>

          <p
            style={{
              margin:
                0,

              color:
                "#75643c",

              fontWeight:
                700,
            }}
          >
            {result.recommendation
              ? `${result.recommendation.totalScore.toFixed(
                  1,
                )} / 100`
              : "No qualifying performance data yet."}
          </p>

          {result.recommendation && (
            <small
              style={{
                display:
                  "block",

                marginTop:
                  6,

                color:
                  "#88794e",

                fontWeight:
                  700,
              }}
            >
              {
                result
                  .recommendation
                  .primaryRole
              }
            </small>
          )}
        </div>

        <div
          style={{
            padding:
              20,

            border:
              "1px solid #ded4ae",

            borderRadius:
              18,

            background:
              "#fffdf6",
          }}
        >
          <p
            style={{
              margin:
                0,

              color:
                "#887231",

              fontSize:
                11,

              fontWeight:
                900,

              letterSpacing:
                "0.12em",

              textTransform:
                "uppercase",
            }}
          >
            Management Selection
          </p>

          <h2
            style={{
              margin:
                "7px 0 3px",

              color:
                "#493408",

              fontSize:
                28,
            }}
          >
            {currentWinner
              ? getDisplayName(
                  currentWinner.name,

                  currentWinner
                    .preferredName,
                )
              : "Not Selected"}
          </h2>

          <p
            style={{
              margin:
                0,

              color:
                "#75643c",

              fontWeight:
                700,
            }}
          >
            Final management decision
            for {monthLabel}
          </p>
        </div>
      </section>

      {/* ======================================
          WEIGHT SUMMARY
         ====================================== */}

      <section
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",

          gap:
            9,

          marginBottom:
            20,
        }}
      >
        <WeightCard
          label="Productivity"
          value={
            productivityWeight
          }
        />

        <WeightCard
          label="Accuracy"
          value={
            accuracyWeight
          }
        />

        <WeightCard
          label="Quality"
          value={
            qualityWeight
          }
        />

        <WeightCard
          label="Attendance"
          value={
            attendanceWeight
          }
        />

        <WeightCard
          label="Recognition"
          value={
            recognitionWeight
          }
        />
      </section>

      {/* ======================================
          MONTHLY RANKING
         ====================================== */}

      <section
        style={{
          marginBottom:
            20,

          padding:
            20,

          border:
            "1px solid #e2d49a",

          borderRadius:
            18,

          background:
            "#fffdf6",
        }}
      >
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              12,

            marginBottom:
              14,
          }}
        >
          <div>
            <p
              style={{
                margin:
                  "0 0 4px",

                color:
                  "#a36d00",

                fontSize:
                  10,

                fontWeight:
                  900,

                letterSpacing:
                  "0.12em",

                textTransform:
                  "uppercase",
              }}
            >
              Whole-HIVE Ranking
            </p>

            <h2
              style={{
                margin:
                  0,

                color:
                  "#44330e",
              }}
            >
              {monthLabel}
            </h2>
          </div>

          <small
            style={{
              color:
                "#81734b",

              fontWeight:
                700,
            }}
          >
            Management retains final
            selection authority.
          </small>
        </div>

        {result.rankings.length ===
        0 ? (
          <div
            style={{
              padding:
                20,

              borderRadius:
                12,

              background:
                "#faf7ea",

              color:
                "#7b6e47",
            }}
          >
            No Worker Bees currently
            have qualifying monthly
            performance data.
          </div>
        ) : (
          <div
            style={{
              display:
                "grid",

              gap:
                10,
            }}
          >
            {result.rankings.map(
              (
                candidate,
                index,
              ) => {
                const displayName =
                  getDisplayName(
                    candidate.name,

                    candidate
                      .preferredName,
                  );

                const isRecommended =
                  candidate
                    .eligible &&
                  result
                    .recommendation
                    ?.collectorId ===
                    candidate.collectorId;

                const isSelected =
                  currentWinner?.id ===
                  candidate.collectorId;

                return (
                  <article
                    key={
                      candidate.collectorId
                    }
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "55px minmax(160px, 1.25fr) repeat(5, minmax(80px, .72fr)) 120px",

                      gap:
                        10,

                      alignItems:
                        "center",

                      padding:
                        "13px 14px",

                      border:
                        isRecommended
                          ? "2px solid #d7a51a"
                          : candidate
                                .eligible
                            ? "1px solid #eadfb7"
                            : "1px solid #ddd7c2",

                      borderRadius:
                        13,

                      background:
                        isRecommended
                          ? "#fff8da"
                          : candidate
                                .eligible
                            ? "#ffffff"
                            : "#f5f3ed",

                      opacity:
                        candidate
                          .eligible
                          ? 1
                          : 0.65,
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#8f6b12",

                        fontSize:
                          18,
                      }}
                    >
                      {candidate
                        .eligible
                        ? `#${index + 1}`
                        : "—"}
                    </strong>

                    <div>
                      <strong
                        style={{
                          display:
                            "block",

                          color:
                            "#49380f",
                        }}
                      >
                        {
                          displayName
                        }
                      </strong>

                      <small
                        style={{
                          display:
                            "block",

                          marginTop:
                            2,

                          color:
                            "#88794e",
                        }}
                      >
                        {
                          candidate.primaryRole
                        }
                      </small>

                      <small
                        style={{
                          display:
                            "block",

                          marginTop:
                            3,

                          color:
                            candidate
                              .eligible
                              ? "#6d7c42"
                              : "#a14c42",

                          fontWeight:
                            800,
                        }}
                      >
                        {isRecommended
                          ? "HIVE Recommended"
                          : isSelected
                            ? "Management Selected"
                            : candidate
                                  .eligible
                              ? "Eligible Candidate"
                              : candidate
                                  .ineligibleReason ??
                                "Not Eligible"}
                      </small>
                    </div>

                    <Metric
                      label="Productivity"
                      value={
                        candidate
                          .productivityScore ===
                        null
                          ? "N/A"
                          : `${formatScore(
                              candidate
                                .productivityScore,
                            )}%`
                      }
                    />

                    <Metric
                      label="Accuracy"
                      value={
                        candidate
                          .accuracyScore ===
                        null
                          ? "N/A"
                          : `${formatScore(
                              candidate
                                .accuracyScore,
                            )}%`
                      }
                    />

                    <Metric
                      label="Quality"
                      value={`${candidate.qualityScore.toFixed(
                        1,
                      )}%`}
                    />

                    <Metric
                      label="Attendance"
                      value={`${candidate.attendanceScore.toFixed(
                        1,
                      )}%`}
                    />

                    <Metric
                      label="Recognition"
                      value={`${candidate.recognitionScore.toFixed(
                        1,
                      )}%`}
                    />

                    <div
                      style={{
                        display:
                          "grid",

                        gap:
                          6,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display:
                              "block",

                            color:
                              "#8b7a4e",

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
                          Overall
                        </span>

                        <strong
                          style={{
                            display:
                              "block",

                            marginTop:
                              3,

                            color:
                              "#513a00",

                            fontSize:
                              18,
                          }}
                        >
                          {candidate.totalScore.toFixed(
                            1,
                          )}
                        </strong>
                      </div>

                      {candidate.eligible && (
                        <form
                          action={
                            selectEmployeeOfMonth
                          }
                        >
                          <input
                            type="hidden"
                            name="collectorId"
                            value={
                              candidate.collectorId
                            }
                          />

                          <button
                            type="submit"
                            style={{
                              width:
                                "100%",

                              padding:
                                "8px 10px",

                              border:
                                0,

                              borderRadius:
                                8,

                              background:
                                isSelected
                                  ? "#49704c"
                                  : "#a77500",

                              color:
                                "#ffffff",

                              fontWeight:
                                900,

                              cursor:
                                "pointer",
                            }}
                          >
                            {isSelected
                              ? "Selected"
                              : "Select"}
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* ======================================
          PRIVATE QUALITY NOTE
         ====================================== */}

      <section
        style={{
          marginBottom:
            20,

          padding:
            16,

          border:
            "1px solid #d9ca92",

          borderRadius:
            14,

          background:
            "#fff8dc",
        }}
      >
        <strong
          style={{
            display:
              "block",

            color:
              "#674a08",
          }}
        >
          🔒 Quality scoring is private
        </strong>

        <span
          style={{
            display:
              "block",

            marginTop:
              4,

            color:
              "#7c6a3c",

            fontSize:
              12,

            lineHeight:
              1.45,
          }}
        >
          EMFs are included inside the
          Quality score used by this
          management-only recommendation.
          Individual EMF counts are not
          displayed on public HIVE Meadow
          pages.
        </span>
      </section>

      {/* ======================================
          MANAGEMENT VETO
         ====================================== */}

      <section
        style={{
          padding:
            18,

          border:
            "1px solid #e4d8ad",

          borderRadius:
            15,

          background:
            "#fffdf7",
        }}
      >
        <div
          style={{
            display:
              "flex",

            flexWrap:
              "wrap",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              14,
          }}
        >
          <div>
            <strong
              style={{
                display:
                  "block",

                color:
                  "#49380f",
              }}
            >
              Management Veto
            </strong>

            <span
              style={{
                display:
                  "block",

                marginTop:
                  3,

                color:
                  "#80714a",

                fontSize:
                  12,
              }}
            >
              Management may clear the
              current selection until a
              final Employee of the Month
              decision is made.
            </span>
          </div>

          <form
            action={
              clearEmployeeOfMonth
            }
          >
            <button
              type="submit"
              style={{
                padding:
                  "10px 14px",

                border:
                  "1px solid #c8a661",

                borderRadius:
                  9,

                background:
                  "#fff8e0",

                color:
                  "#78530a",

                fontWeight:
                  900,

                cursor:
                  "pointer",
              }}
            >
              Clear Selection
            </button>
          </form>
        </div>
      </section>
    </AdminShell>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span
        style={{
          display:
            "block",

          color:
            "#8b7a4e",

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
        {label}
      </span>

      <strong
        style={{
          display:
            "block",

          marginTop:
            3,

          color:
            "#4d3d18",

          fontSize:
            15,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function WeightCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding:
          "11px 12px",

        border:
          "1px solid #e4d49c",

        borderRadius:
          11,

        background:
          "#fffaf0",

        textAlign:
          "center",
      }}
    >
      <span
        style={{
          display:
            "block",

          color:
            "#857349",

          fontSize:
            9,

          fontWeight:
            900,

          letterSpacing:
            "0.08em",

          textTransform:
            "uppercase",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display:
            "block",

          marginTop:
            4,

          color:
            "#5a4005",

          fontSize:
            16,
        }}
      >
        {value}%
      </strong>
    </div>
  );
}