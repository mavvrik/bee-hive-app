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
  preferredName:
    string | null,
) {
  return (
    preferredName?.trim() ||
    name
  );
}

export default async function EmployeeOfMonthPage({
  searchParams,
}: EmployeeOfMonthPageProps) {
  /*
   * Server-side protection.
   *
   * Typing this URL manually without
   * Manager Access still redirects to
   * /admin-login.
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

  const currentWinner =
    await prisma.collector.findFirst({
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
    });

  const monthLabel =
    today.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      },
    );

  return (
    <AdminShell
      pageTitle="Employee of the Month"
      pageDescription="Review the HIVE 70/30 recommendation and make the final management selection."
      activePath="/settings/workers/employee-of-month"
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
            gap: 14,
            flexWrap: "wrap",
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
            href="/settings/workers/emf"
            style={{
              color: "#805c0b",
              fontWeight: 900,
              textDecoration:
                "none",
            }}
          >
            Quality / EMFs
          </Link>
        </div>

        <span
          style={{
            padding:
              "8px 13px",
            borderRadius: 999,
            background:
              "#fff2bd",
            color:
              "#755200",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          70% Performance •
          30% Quality
        </span>
      </div>

      {saved === "1" && (
        <div
          style={{
            marginBottom: 18,
            padding:
              "12px 15px",
            border:
              "1px solid #aad6b0",
            borderRadius: 11,
            background:
              "#effaf0",
            color:
              "#276b32",
            fontWeight: 800,
          }}
        >
          Employee of the Month
          selection saved.
        </div>
      )}

      {cleared === "1" && (
        <div
          style={{
            marginBottom: 18,
            padding:
              "12px 15px",
            border:
              "1px solid #dfcf90",
            borderRadius: 11,
            background:
              "#fff9df",
            color:
              "#755b11",
            fontWeight: 800,
          }}
        >
          Employee of the Month
          selection cleared.
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: 20,
            border:
              "1px solid #e0ca78",
            borderRadius: 18,
            background:
              "linear-gradient(145deg, #fff9dc, #fff1a7)",
          }}
        >
          <p
            style={{
              margin: 0,
              color:
                "#9a6b00",
              fontSize: 11,
              fontWeight: 900,
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
              fontSize: 28,
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
              margin: 0,
              color:
                "#75643c",
              fontWeight: 700,
            }}
          >
            {result.recommendation
              ? `${result.recommendation.totalScore.toFixed(
                  1,
                )} / 100`
              : "No qualifying performance data yet."}
          </p>
        </div>

        <div
          style={{
            padding: 20,
            border:
              "1px solid #ded4ae",
            borderRadius: 18,
            background:
              "#fffdf6",
          }}
        >
          <p
            style={{
              margin: 0,
              color:
                "#887231",
              fontSize: 11,
              fontWeight: 900,
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
              fontSize: 28,
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
              margin: 0,
              color:
                "#75643c",
              fontWeight: 700,
            }}
          >
            Final management decision
            for {monthLabel}
          </p>
        </div>
      </section>

      <section
        style={{
          marginBottom: 20,
          padding: 20,
          border:
            "1px solid #e2d49a",
          borderRadius: 18,
          background:
            "#fffdf6",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
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
              Ranked Recommendation
            </p>

            <h2
              style={{
                margin: 0,
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
              fontWeight: 700,
            }}
          >
            Management may override
            the ranking.
          </small>
        </div>

        {result.rankings.length ===
        0 ? (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
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
              display: "grid",
              gap: 10,
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
                  index === 0;

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
                        "55px minmax(170px, 1fr) 110px 110px 90px 105px 130px",

                      gap: 10,

                      alignItems:
                        "center",

                      padding:
                        "13px 14px",

                      border:
                        isRecommended
                          ? "2px solid #d7a51a"
                          : "1px solid #eadfb7",

                      borderRadius:
                        13,

                      background:
                        isRecommended
                          ? "#fff8da"
                          : "#ffffff",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#8f6b12",
                        fontSize: 18,
                      }}
                    >
                      #{index + 1}
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
                          color:
                            "#88794e",
                        }}
                      >
                        {isRecommended
                          ? "HIVE Recommended"
                          : isSelected
                            ? "Management Selected"
                            : "Eligible Candidate"}
                      </small>
                    </div>

                    <Metric
                      label="Successful"
                      value={String(
                        candidate
                          .successfulSticks,
                      )}
                    />

                    <Metric
                      label="Success Rate"
                      value={`${candidate.successRate.toFixed(
                        1,
                      )}%`}
                    />

                    <Metric
                      label="EMFs"
                      value={String(
                        candidate.emfCount,
                      )}
                    />

                    <Metric
                      label="70% Perf."
                      value={candidate.performanceScore.toFixed(
                        1,
                      )}
                    />

                    <div
                      style={{
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <strong
                        style={{
                          color:
                            "#513a00",
                          fontSize: 18,
                        }}
                      >
                        {candidate.totalScore.toFixed(
                          1,
                        )}
                      </strong>

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
                            border: 0,
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
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      <section
        style={{
          padding: 18,
          border:
            "1px solid #e4d8ad",
          borderRadius: 15,
          background:
            "#fffdf7",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div>
            <strong
              style={{
                display: "block",
                color:
                  "#49380f",
              }}
            >
              Management Veto
            </strong>

            <span
              style={{
                display: "block",
                marginTop: 3,
                color:
                  "#80714a",
                fontSize: 12,
              }}
            >
              You may clear the
              selection and recognize
              no employee until a final
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
                borderRadius: 9,
                background:
                  "#fff8e0",
                color:
                  "#78530a",
                fontWeight: 900,
                cursor: "pointer",
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
          display: "block",
          color:
            "#8b7a4e",
          fontSize: 9,
          fontWeight: 900,
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
          display: "block",
          marginTop: 3,
          color:
            "#4d3d18",
          fontSize: 15,
        }}
      >
        {value}
      </strong>
    </div>
  );
}