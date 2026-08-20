import {
  prisma,
} from "@/lib/prisma";

import AdminShell from "../../components/AdminShell";

import {
  getEmployeeOfMonthRecommendation,
} from "@/app/lib/employeeOfMonthEngine";

import {
  deleteAttendanceEvent,
  saveAttendanceEvent,
  saveEmployeeOfMonthSettings,
  saveMonthlyEmployeeOfMonthScores,
  saveRecognitionScore,
  saveRolePerformanceTarget,
} from "./actions";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
  }>;
};

const TARGET_DEFINITIONS = [
  {
    role:
      "PHLEBOTOMIST",

    metric:
      "STICKS",

    label:
      "Phlebotomist — Successful Sticks",
  },

  {
    role:
      "MSA",

    metric:
      "PHYSICALS",

    label:
      "MSA — Physicals",
  },

  {
    role:
      "RECEPTION_TECH",

    metric:
      "INTERVIEWS",

    label:
      "Reception Tech — Interviews",
  },

  {
    role:
      "DST",

    metric:
      "SETUPS",

    label:
      "DST — Setups",
  },

  {
    role:
      "DST",

    metric:
      "DISCONNECTS",

    label:
      "DST — Disconnects",
  },

  {
    role:
      "PROCESSOR",

    metric:
      "PROCESSED",

    label:
      "Processor — Bottles Processed",
  },
] as const;

function formatDateInput(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function monthName(
  month: number,
) {
  return new Date(
    2000,
    month - 1,
    1,
  ).toLocaleString(
    "en-US",
    {
      month:
        "long",
    },
  );
}

function attendanceLabel(
  eventType: string,
) {
  switch (
    eventType
  ) {
    case "LATE":
      return "Late";

    case "ABSENT":
      return "Absent";

    case "LATE_FROM_LUNCH":
      return "Late From Lunch";

    case "LEFT_EARLY":
      return "Left Early";

    default:
      return eventType;
  }
}

export default async function RecognitionPage({
  searchParams,
}: PageProps) {
  const resolvedParams =
    searchParams
      ? await searchParams
      : {};

  const today =
    new Date();

  const selectedYear =
    Number.parseInt(
      resolvedParams.year ??
        "",
      10,
    ) ||
    today.getFullYear();

  const selectedMonth =
    Math.min(
      12,
      Math.max(
        1,
        Number.parseInt(
          resolvedParams.month ??
            "",
          10,
        ) ||
          today.getMonth() +
            1,
      ),
    );

  const startOfMonth =
    new Date(
      Date.UTC(
        selectedYear,
        selectedMonth - 1,
        1,
      ),
    );

  const startOfNextMonth =
    new Date(
      Date.UTC(
        selectedYear,
        selectedMonth,
        1,
      ),
    );

  const [
    settings,
    workers,
    targets,
    recognitionEntries,
    attendanceEntries,
    rankingResult,
  ] = await Promise.all([
    prisma.employeeOfMonthSettings.findUnique({
      where: {
        id: 1,
      },
    }),

    prisma.collector.findMany({
      where: {
        active: true,
      },

      orderBy: [
        {
          position:
            "asc",
        },

        {
          name:
            "asc",
        },
      ],
    }),

    prisma.rolePerformanceTarget.findMany({
      where: {
        active: true,
      },
    }),

    prisma.monthlyRecognitionScore.findMany({
      where: {
        year:
          selectedYear,

        month:
          selectedMonth,
      },
    }),

    prisma.attendanceEntry.findMany({
      where: {
        entryDate: {
          gte:
            startOfMonth,

          lt:
            startOfNextMonth,
        },
      },

      include: {
        collector:
          true,
      },

      orderBy: [
        {
          entryDate:
            "desc",
        },

        {
          createdAt:
            "desc",
        },
      ],
    }),

    getEmployeeOfMonthRecommendation({
      year:
        selectedYear,

      month:
        selectedMonth,
    }),
  ]);

  function getTargetValue(
    role: string,
    metric: string,
  ) {
    return (
      targets.find(
        (target) =>
          target.role ===
            role &&
          target.metric ===
            metric,
      )?.targetPerDay ??
      0
    );
  }

  function getRecognitionValue(
    collectorId: number,
  ) {
    return (
      recognitionEntries.find(
        (entry) =>
          entry.collectorId ===
          collectorId,
      )?.score ??
      0
    );
  }

  function getRecognitionNote(
    collectorId: number,
  ) {
    return (
      recognitionEntries.find(
        (entry) =>
          entry.collectorId ===
          collectorId,
      )?.note ??
      ""
    );
  }

  const recommendation =
    rankingResult.recommendation;

  return (
    <AdminShell
      pageTitle="Employee of the Month"
      pageDescription="Private management scoring, attendance, quality, recognition and monthly ranking."
      activePath="/settings/workers/recognition"
    >
      <section className="recognition-hero">
        <div>
          <p className="eyebrow">
            Private Management View
          </p>

          <h2>
            Employee of the Month
          </h2>

          <p className="hero-description">
            Review the whole-HIVE monthly
            performance ranking using
            productivity, accuracy, private
            quality data, attendance and
            management recognition.
          </p>
        </div>

        <form
          method="get"
          className="month-picker"
        >
          <label>
            <span>
              Year
            </span>

            <input
              type="number"
              name="year"
              min="2025"
              defaultValue={
                selectedYear
              }
            />
          </label>

          <label>
            <span>
              Month
            </span>

            <select
              name="month"
              defaultValue={
                selectedMonth
              }
            >
              {Array.from(
                {
                  length: 12,
                },
                (
                  _,
                  index,
                ) => (
                  <option
                    key={
                      index + 1
                    }
                    value={
                      index + 1
                    }
                  >
                    {monthName(
                      index + 1,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="submit"
            className="gold-button"
          >
            Load Month
          </button>
        </form>
      </section>

      <section className="recommendation-panel">
        <div>
          <p className="eyebrow">
            Current Recommendation
          </p>

          <h2>
            {recommendation
              ? recommendation.preferredName ||
                recommendation.name
              : "No Eligible Candidate"}
          </h2>

          <p>
            {recommendation
              ? `${recommendation.primaryRole} · ${recommendation.totalScore.toFixed(
                  1,
                )} overall score`
              : "Enter monthly performance and productivity targets to generate a recommendation."}
          </p>
        </div>

        <form
          action={
            saveMonthlyEmployeeOfMonthScores
          }
        >
          <input
            type="hidden"
            name="year"
            value={
              selectedYear
            }
          />

          <input
            type="hidden"
            name="month"
            value={
              selectedMonth
            }
          />

          <button
            type="submit"
            className="gold-button"
          >
            Save Monthly Ranking
          </button>
        </form>
      </section>

      <section className="ranking-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {monthName(
                selectedMonth,
              )}{" "}
              {selectedYear}
            </p>

            <h2>
              Monthly Ranking
            </h2>
          </div>

          <span className="private-badge">
            🔒 Private
          </span>
        </div>

        <div className="table-wrap">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>
                  Rank
                </th>

                <th>
                  Worker
                </th>

                <th>
                  Productivity
                </th>

                <th>
                  Accuracy
                </th>

                <th>
                  Quality
                </th>

                <th>
                  Attendance
                </th>

                <th>
                  Recognition
                </th>

                <th>
                  Overall
                </th>
              </tr>
            </thead>

            <tbody>
              {rankingResult.rankings.map(
                (
                  candidate,
                  index,
                ) => (
                  <tr
                    key={
                      candidate.collectorId
                    }
                    className={
                      !candidate.eligible
                        ? "ineligible-row"
                        : index ===
                          0
                        ? "winner-row"
                        : ""
                    }
                  >
                    <td>
                      {candidate.eligible
                        ? index +
                          1
                        : "—"}
                    </td>

                    <td>
                      <strong>
                        {candidate.preferredName ||
                          candidate.name}
                      </strong>

                      <small>
                        {
                          candidate.primaryRole
                        }
                      </small>

                      {!candidate.eligible &&
                        candidate.ineligibleReason && (
                          <em>
                            {
                              candidate.ineligibleReason
                            }
                          </em>
                        )}
                    </td>

                    <td>
                      {candidate.productivityScore ===
                      null
                        ? "N/A"
                        : `${candidate.productivityScore.toFixed(
                            1,
                          )}%`}
                    </td>

                    <td>
                      {candidate.accuracyScore ===
                      null
                        ? "N/A"
                        : `${candidate.accuracyScore.toFixed(
                            1,
                          )}%`}
                    </td>

                    <td>
                      {candidate.qualityScore.toFixed(
                        1,
                      )}
                    </td>

                    <td>
                      {candidate.attendanceScore.toFixed(
                        1,
                      )}
                    </td>

                    <td>
                      {candidate.recognitionScore.toFixed(
                        1,
                      )}
                    </td>

                    <td>
                      <strong>
                        {candidate.totalScore.toFixed(
                          1,
                        )}
                      </strong>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="management-grid">
        <article className="management-card">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">
                Productivity
              </p>

              <h2>
                Daily Targets
              </h2>
            </div>
          </div>

          <p className="section-description">
            Set the expected daily activity
            for each measurable role. These
            targets normalize productivity
            across different jobs.
          </p>

          <div className="target-list">
            {TARGET_DEFINITIONS.map(
              (definition) => (
                <form
                  key={`${definition.role}-${definition.metric}`}
                  action={
                    saveRolePerformanceTarget
                  }
                  className="target-row"
                >
                  <input
                    type="hidden"
                    name="role"
                    value={
                      definition.role
                    }
                  />

                  <input
                    type="hidden"
                    name="metric"
                    value={
                      definition.metric
                    }
                  />

                  <span>
                    {
                      definition.label
                    }
                  </span>

                  <input
                    type="number"
                    name="targetPerDay"
                    min="0"
                    step="0.1"
                    defaultValue={getTargetValue(
                      definition.role,
                      definition.metric,
                    )}
                  />

                  <button type="submit">
                    Save
                  </button>
                </form>
              ),
            )}
          </div>
        </article>

        <article className="management-card">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">
                Attendance
              </p>

              <h2>
                Record Event
              </h2>
            </div>
          </div>

          <p className="section-description">
            Attendance remains private and
            contributes to monthly scoring.
          </p>

          <form
            action={
              saveAttendanceEvent
            }
            className="stack-form"
          >
            <label>
              <span>
                Worker Bee
              </span>

              <select
                name="collectorId"
                required
                defaultValue=""
              >
                <option
                  value=""
                  disabled
                >
                  Select worker
                </option>

                {workers.map(
                  (worker) => (
                    <option
                      key={
                        worker.id
                      }
                      value={
                        worker.id
                      }
                    >
                      {worker.preferredName ||
                        worker.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                Date
              </span>

              <input
                type="date"
                name="entryDate"
                defaultValue={formatDateInput(
                  today,
                )}
                required
              />
            </label>

            <label>
              <span>
                Event
              </span>

              <select
                name="eventType"
                defaultValue="LATE"
                required
              >
                <option value="LATE">
                  Late
                </option>

                <option value="ABSENT">
                  Absent
                </option>

                <option value="LATE_FROM_LUNCH">
                  Late From Lunch
                </option>

                <option value="LEFT_EARLY">
                  Left Early
                </option>
              </select>
            </label>

            <label>
              <span>
                Note
              </span>

              <input
                type="text"
                name="note"
                placeholder="Optional"
              />
            </label>

            <button
              type="submit"
              className="gold-button"
            >
              Record Attendance
            </button>
          </form>
        </article>
      </section>

      <section className="attendance-history-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Private Attendance
            </p>

            <h2>
              Monthly Attendance Events
            </h2>
          </div>
        </div>

        {attendanceEntries.length >
        0 ? (
          <div className="attendance-list">
            {attendanceEntries.map(
              (entry) => (
                <article
                  key={
                    entry.id
                  }
                  className="attendance-entry"
                >
                  <div>
                    <strong>
                      {entry.collector.preferredName ||
                        entry.collector.name}
                    </strong>

                    <span>
                      {attendanceLabel(
                        entry.eventType,
                      )}{" "}
                      ·{" "}
                      {entry.entryDate.toLocaleDateString(
                        "en-US",
                        {
                          month:
                            "short",
                          day:
                            "numeric",
                        },
                      )}
                    </span>

                    {entry.note && (
                      <small>
                        {
                          entry.note
                        }
                      </small>
                    )}
                  </div>

                  <form
                    action={
                      deleteAttendanceEvent
                    }
                  >
                    <input
                      type="hidden"
                      name="attendanceId"
                      value={
                        entry.id
                      }
                    />

                    <button
                      type="submit"
                      className="delete-button"
                    >
                      Remove
                    </button>
                  </form>
                </article>
              ),
            )}
          </div>
        ) : (
          <p className="empty-note">
            No attendance events recorded
            for this month.
          </p>
        )}
      </section>

      <section className="recognition-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Management Recognition
            </p>

            <h2>
              Monthly Recognition Scores
            </h2>
          </div>
        </div>

        <p className="section-description">
          This is the management recognition
          portion of the Employee of the
          Month calculation. Score from 0–100.
        </p>

        <div className="recognition-grid">
          {workers.map(
            (worker) => (
              <form
                key={
                  worker.id
                }
                action={
                  saveRecognitionScore
                }
                className="recognition-card"
              >
                <input
                  type="hidden"
                  name="collectorId"
                  value={
                    worker.id
                  }
                />

                <input
                  type="hidden"
                  name="year"
                  value={
                    selectedYear
                  }
                />

                <input
                  type="hidden"
                  name="month"
                  value={
                    selectedMonth
                  }
                />

                <div>
                  <strong>
                    {worker.preferredName ||
                      worker.name}
                  </strong>

                  <small>
                    {
                      worker.role
                    }
                  </small>
                </div>

                <label>
                  <span>
                    Recognition Score
                  </span>

                  <input
                    type="number"
                    name="score"
                    min="0"
                    max="100"
                    step="1"
                    defaultValue={getRecognitionValue(
                      worker.id,
                    )}
                  />
                </label>

                <label>
                  <span>
                    Recognition Note
                  </span>

                  <input
                    type="text"
                    name="note"
                    defaultValue={getRecognitionNote(
                      worker.id,
                    )}
                    placeholder="Optional"
                  />
                </label>

                <button type="submit">
                  Save Recognition
                </button>
              </form>
            ),
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Scoring Engine
            </p>

            <h2>
              Weighting & Penalties
            </h2>
          </div>

          <span className="private-badge">
            Total must equal 100%
          </span>
        </div>

        <form
          action={
            saveEmployeeOfMonthSettings
          }
          className="settings-form"
        >
          <label>
            <span>
              Productivity Weight %
            </span>

            <input
              type="number"
              name="productivityWeight"
              step="0.5"
              defaultValue={
                settings?.productivityWeight ??
                35
              }
            />
          </label>

          <label>
            <span>
              Accuracy Weight %
            </span>

            <input
              type="number"
              name="accuracyWeight"
              step="0.5"
              defaultValue={
                settings?.accuracyWeight ??
                25
              }
            />
          </label>

          <label>
            <span>
              Quality Weight %
            </span>

            <input
              type="number"
              name="qualityWeight"
              step="0.5"
              defaultValue={
                settings?.qualityWeight ??
                25
              }
            />
          </label>

          <label>
            <span>
              Attendance Weight %
            </span>

            <input
              type="number"
              name="attendanceWeight"
              step="0.5"
              defaultValue={
                settings?.attendanceWeight ??
                10
              }
            />
          </label>

          <label>
            <span>
              Recognition Weight %
            </span>

            <input
              type="number"
              name="recognitionWeight"
              step="0.5"
              defaultValue={
                settings?.recognitionWeight ??
                5
              }
            />
          </label>

          <label>
            <span>
              EMF Penalty Points
            </span>

            <input
              type="number"
              name="emfPenaltyPoints"
              min="0"
              step="0.5"
              defaultValue={
                settings?.emfPenaltyPoints ??
                15
              }
            />
          </label>

          <label>
            <span>
              EMF Disqualify Threshold
            </span>

            <input
              type="number"
              name="emfDisqualifyThreshold"
              min="0"
              placeholder="Optional"
              defaultValue={
                settings?.emfDisqualifyThreshold ??
                ""
              }
            />
          </label>

          <label>
            <span>
              Late Penalty
            </span>

            <input
              type="number"
              name="latePenalty"
              min="0"
              step="0.5"
              defaultValue={
                settings?.latePenalty ??
                1
              }
            />
          </label>

          <label>
            <span>
              Absent Penalty
            </span>

            <input
              type="number"
              name="absentPenalty"
              min="0"
              step="0.5"
              defaultValue={
                settings?.absentPenalty ??
                3
              }
            />
          </label>

          <label>
            <span>
              Late From Lunch Penalty
            </span>

            <input
              type="number"
              name="lateFromLunchPenalty"
              min="0"
              step="0.5"
              defaultValue={
                settings?.lateFromLunchPenalty ??
                1
              }
            />
          </label>

          <label>
            <span>
              Left Early Penalty
            </span>

            <input
              type="number"
              name="leftEarlyPenalty"
              min="0"
              step="0.5"
              defaultValue={
                settings?.leftEarlyPenalty ??
                1.5
              }
            />
          </label>

          <button
            type="submit"
            className="gold-button settings-save"
          >
            Save Scoring Settings
          </button>
        </form>
      </section>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .recognition-hero,
          .recommendation-panel,
          .ranking-section,
          .management-card,
          .attendance-history-section,
          .recognition-section,
          .settings-section {
            border: 1px solid #dfc779;
            border-radius: 18px;
            background: #fffdf7;
            box-shadow:
              0 8px 22px
              rgba(
                70,
                50,
                5,
                .07
              );
          }

          .recognition-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;

            margin-bottom: 16px;
            padding: 22px;

            background:
              linear-gradient(
                135deg,
                #362605,
                #694a08
              );
          }

          .eyebrow {
            margin: 0 0 5px;

            color: #a8790a;

            font-size: .66rem;
            font-weight: 900;
            letter-spacing: .12em;
            text-transform: uppercase;
          }

          .recognition-hero .eyebrow {
            color: #e4c45b;
          }

          .recognition-hero h2 {
            margin: 0;

            color: #ffe793;

            font-size: 1.7rem;
          }

          .hero-description {
            max-width: 650px;

            margin: 7px 0 0;

            color: #f1dfad;

            font-size: .84rem;
            line-height: 1.5;
          }

          .month-picker {
            display: flex;
            align-items: flex-end;
            gap: 8px;

            padding: 11px;

            border: 1px solid rgba(255,255,255,.15);
            border-radius: 12px;

            background: rgba(255,255,255,.07);
          }

          label {
            display: grid;
            gap: 5px;
          }

          label > span {
            color: #67501c;

            font-size: .63rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .month-picker label > span {
            color: #e8d27f;
          }

          input,
          select {
            width: 100%;
            min-height: 38px;

            padding: 7px 9px;

            border: 1px solid #d5c17d;
            border-radius: 8px;

            background: white;

            color: #3e300d;

            font-family: inherit;
            font-weight: 700;
          }

          button {
            min-height: 36px;

            padding: 8px 12px;

            border: none;
            border-radius: 8px;

            background: #ddad26;

            color: white;

            font-weight: 900;
            cursor: pointer;
          }

          .gold-button {
            background:
              linear-gradient(
                135deg,
                #d7a318,
                #b57a00
              );
          }

          .recommendation-panel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;

            margin-bottom: 16px;
            padding: 20px;

            background:
              linear-gradient(
                135deg,
                #fff9d4,
                #ffe999
              );
          }

          .recommendation-panel h2 {
            margin: 0;

            color: #4b3404;

            font-size: 1.45rem;
          }

          .recommendation-panel p:not(.eyebrow) {
            margin: 5px 0 0;

            color: #79601e;
          }

          .ranking-section,
          .attendance-history-section,
          .recognition-section,
          .settings-section {
            margin-bottom: 16px;
            padding: 20px;
          }

          .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;

            margin-bottom: 15px;
          }

          .section-heading.compact {
            margin-bottom: 4px;
          }

          .section-heading h2 {
            margin: 0;

            color: #422e05;
          }

          .section-description {
            margin: 4px 0 14px;

            color: #786d51;

            font-size: .8rem;
            line-height: 1.45;
          }

          .private-badge {
            padding: 6px 10px;

            border-radius: 999px;

            background: #f0e6bf;

            color: #71561c;

            font-size: .64rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .ranking-table {
            width: 100%;

            border-collapse: collapse;
          }

          .ranking-table th,
          .ranking-table td {
            padding: 11px 9px;

            border-bottom: 1px solid #eee1bb;

            text-align: left;
          }

          .ranking-table th {
            color: #77590d;

            font-size: .63rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .ranking-table td {
            color: #3e300e;

            font-size: .8rem;
          }

          .ranking-table td small,
          .ranking-table td em {
            display: block;

            margin-top: 3px;
          }

          .ranking-table td small {
            color: #84775a;
          }

          .ranking-table td em {
            color: #9b3930;

            font-size: .64rem;
          }

          .winner-row {
            background: #fff4bd;
          }

          .ineligible-row {
            opacity: .58;
          }

          .management-grid {
            display: grid;

            grid-template-columns:
              1.35fr
              1fr;

            gap: 16px;

            margin-bottom: 16px;
          }

          .management-card {
            padding: 20px;
          }

          .target-list,
          .stack-form {
            display: grid;
            gap: 9px;
          }

          .target-row {
            display: grid;

            grid-template-columns:
              minmax(0,1fr)
              95px
              65px;

            gap: 7px;

            align-items: center;
          }

          .target-row > span {
            color: #574313;

            font-size: .72rem;
            font-weight: 800;
          }

          .attendance-list {
            display: grid;
            gap: 8px;
          }

          .attendance-entry {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;

            padding: 11px 12px;

            border: 1px solid #e7d9aa;
            border-radius: 10px;

            background: #fffaf0;
          }

          .attendance-entry > div {
            display: grid;
            gap: 2px;
          }

          .attendance-entry strong {
            color: #493406;
          }

          .attendance-entry span {
            color: #7b6a43;

            font-size: .72rem;
          }

          .attendance-entry small {
            color: #918468;

            font-size: .68rem;
          }

          .delete-button {
            background: #a64a40;
          }

          .empty-note {
            color: #84775a;

            font-size: .8rem;
          }

          .recognition-grid {
            display: grid;

            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 10px;
          }

          .recognition-card {
            display: grid;
            gap: 8px;

            padding: 13px;

            border: 1px solid #e6d49a;
            border-radius: 12px;

            background: #fffaf0;
          }

          .recognition-card > div {
            display: grid;
          }

          .recognition-card strong {
            color: #4a3508;
          }

          .recognition-card small {
            margin-top: 2px;

            color: #877858;
          }

          .settings-form {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 10px;
          }

          .settings-save {
            align-self: end;
          }

          @media (
            max-width: 1050px
          ) {
            .management-grid {
              grid-template-columns:
                1fr;
            }

            .recognition-grid,
            .settings-form {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );
            }
          }

          @media (
            max-width: 700px
          ) {
            .recognition-hero,
            .recommendation-panel,
            .section-heading {
              align-items: stretch;
              flex-direction: column;
            }

            .month-picker {
              align-items: stretch;
              flex-direction: column;
            }

            .target-row,
            .recognition-grid,
            .settings-form {
              grid-template-columns:
                1fr;
            }

            .attendance-entry {
              align-items: stretch;
              flex-direction: column;
            }
          }
        `}
      </style>
    </AdminShell>
  );
}