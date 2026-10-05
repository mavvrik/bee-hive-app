import {
  prisma,
} from "@/lib/prisma";

import {
  getAttendanceWindowSummary,
  getCurrentAttendanceStanding,
} from "@/app/lib/attendance/attendancePolicyEngine";

import {
  notFound,
} from "next/navigation";

import PrintButton from "./PrintButton";

export const dynamic =
  "force-dynamic";

type AttendanceExportPageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

type AttendanceEntry = {
  id: number;
  entryDate: Date;
  eventType: string;
  minutesMissed: number | null;
  policyPoints: number | null;
  protectedAbsence: boolean;
  excusedByManagement: boolean;
  exceptionReason: string | null;
  note: string | null;
  recordedBy: string | null;
};

function formatDate(
  value: Date | null,
) {
  if (!value) {
    return "—";
  }

  return value.toLocaleDateString(
    "en-US",
    {
      timeZone: "UTC",
    },
  );
}

function formatActionLevel(
  value: string | null,
) {
  if (!value) {
    return "None";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatEventType(
  value: string,
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function startOfUtcMonth(
  value: Date,
) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      1,
    ),
  );
}

function addUtcMonths(
  value: Date,
  amount: number,
) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth() +
        amount,
      1,
    ),
  );
}

function sameUtcDate(
  left: Date,
  right: Date,
) {
  return (
    left.getUTCFullYear() ===
      right.getUTCFullYear() &&
    left.getUTCMonth() ===
      right.getUTCMonth() &&
    left.getUTCDate() ===
      right.getUTCDate()
  );
}

function eventMark(
  entries: AttendanceEntry[],
) {
  if (entries.length === 0) {
    return "";
  }

  const countable =
    entries.filter(
      (entry) =>
        !entry.protectedAbsence &&
        !entry.excusedByManagement,
    );

  if (countable.length === 0) {
    return "E";
  }

  const points =
    countable.reduce(
      (total, entry) =>
        total +
        Math.max(
          0,
          entry.policyPoints ?? 0,
        ),
      0,
    );

  if (points > 0) {
    return String(points);
  }

  return "0";
}

export default async function AttendanceExportPage({
  params,
}: AttendanceExportPageProps) {
  const {
    workerId: workerIdParam,
  } = await params;

  const workerId =
    Number(workerIdParam);

  if (
    !Number.isInteger(workerId) ||
    workerId <= 0
  ) {
    notFound();
  }

  const worker =
    await prisma.collector.findUnique({
      where: {
        id: workerId,
      },

      select: {
        id: true,
        name: true,

        employmentProfile: {
          select: {
            dateOfHire: true,
          },
        },

        attendanceEntries: {
          orderBy: [
            {
              entryDate: "desc",
            },
            {
              id: "desc",
            },
          ],

          select: {
            id: true,
            entryDate: true,
            eventType: true,
            minutesMissed: true,
            policyPoints: true,
            protectedAbsence: true,
            excusedByManagement: true,
            exceptionReason: true,
            note: true,
            recordedBy: true,
          },
        },

        attendanceCorrectiveActions: {
          orderBy: [
            {
              effectiveDate: "desc",
            },
            {
              id: "desc",
            },
          ],

          select: {
  id: true,
  actionLevel: true,
  status: true,
  effectiveDate: true,
  expiresAt: true,
},
        },
      },
    });

  if (!worker) {
    notFound();
  }

  const asOfDate =
    new Date();

  const attendanceHistory =
    worker.attendanceEntries.map(
      (entry) => ({
        id: entry.id,
        entryDate:
          entry.entryDate,
        eventType:
          entry.eventType,
        policyPoints:
          entry.policyPoints,
        protectedAbsence:
          entry.protectedAbsence,
        excusedByManagement:
          entry.excusedByManagement,
      }),
    );

  const correctiveActionHistory =
    worker.attendanceCorrectiveActions.map(
      (action) => ({
        actionLevel:
          action.actionLevel,
        status:
          action.status,
        effectiveDate:
          action.effectiveDate,
        expiresAt: action.expiresAt,
      }),
    );

  const attendanceWindow =
    getAttendanceWindowSummary(
      attendanceHistory,
      asOfDate,
    );

  const currentStanding =
    getCurrentAttendanceStanding(
      attendanceHistory,
      correctiveActionHistory,
      worker.employmentProfile
        ?.dateOfHire ?? null,
      asOfDate,
    );

  const activeCorrectiveAction =
    worker.attendanceCorrectiveActions.find(
      (action) =>
        action.status === "ISSUED",
    ) ?? null;

  const neededLevel =
    currentStanding
      .recommendedAction
      ? formatActionLevel(
          currentStanding
            .recommendedAction,
        )
      : worker.employmentProfile
          ?.dateOfHire
        ? "None"
        : "Unable to Determine";

  const givenLevel =
    activeCorrectiveAction
      ? formatActionLevel(
          activeCorrectiveAction
            .actionLevel,
        )
      : "None";

  const firstMonth =
    startOfUtcMonth(
      attendanceWindow.windowStart,
    );

  const lastMonth =
    startOfUtcMonth(
      attendanceWindow.windowEnd,
    );

  const months: Date[] = [];

  for (
    let month = firstMonth;
    month.getTime() <=
    lastMonth.getTime();
    month = addUtcMonths(
      month,
      1,
    )
  ) {
    months.push(month);
  }

  const activeEntries =
    worker.attendanceEntries.filter(
      (entry) =>
        entry.entryDate.getTime() >=
          attendanceWindow
            .windowStart
            .getTime() &&
        entry.entryDate.getTime() <=
          attendanceWindow
            .windowEnd
            .getTime(),
    );

  return (
    <main className="attendance-record">
      <div className="print-toolbar">
    <PrintButton />
      </div>

      <section className="record-sheet">
        <h1>
          ATTENDANCE RECORD
        </h1>

        <div className="employee-summary">
          <div className="employee-fields">
            <div className="field-row">
              <span className="field-label">
                Name:
              </span>

              <span className="field-value">
                {worker.name}
              </span>
            </div>

            <div className="field-row">
              <span className="field-label">
                DOH:
              </span>

              <span className="field-value">
                {formatDate(
                  worker
                    .employmentProfile
                    ?.dateOfHire ??
                    null,
                )}
              </span>
            </div>

            <div className="field-row">
              <span className="field-label">
                SAP#:
              </span>

              <span className="field-value">
                —
              </span>
            </div>
          </div>

          <div className="counseling-summary">
            <div className="counseling-row">
              <span>
                Current Counseling
                Level NEEDED:
              </span>

              <strong className="needed-level">
                {neededLevel}
              </strong>
            </div>

            <div className="counseling-row">
              <span>
                Current Counseling
                Level GIVEN:
              </span>

              <strong>
                {givenLevel}
              </strong>
            </div>
          </div>
        </div>

        <div className="policy-strip">
          <span>
            Policy Window:{" "}
            <strong>
              {formatDate(
                attendanceWindow
                  .windowStart,
              )}{" "}
              –{" "}
              {formatDate(
                attendanceWindow
                  .windowEnd,
              )}
            </strong>
          </span>

          <span>
            HIVE Policy Standing:{" "}
            <strong>
              {
                currentStanding
                  .recommendationReason
              }
            </strong>
          </span>
        </div>

        <div className="calendar-wrap">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="month-column">
                  Month
                </th>

                {Array.from(
                  {
                    length: 31,
                  },
                  (_, index) => (
                    <th
                      key={
                        index + 1
                      }
                    >
                      {index + 1}
                    </th>
                  ),
                )}

                <th className="total-column">
                  Monthly
                  <br />
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {months.map(
                (month) => {
                  const monthEntries =
                    activeEntries.filter(
                      (entry) =>
                        entry.entryDate.getUTCFullYear() ===
                          month.getUTCFullYear() &&
                        entry.entryDate.getUTCMonth() ===
                          month.getUTCMonth(),
                    );

                  const monthlyTotal =
                    monthEntries.reduce(
                      (
                        total,
                        entry,
                      ) =>
                        total +
                        Math.max(
                          0,
                          entry.policyPoints ??
                            0,
                        ),
                      0,
                    );

                  return (
                    <tr
                      key={
                        month.toISOString()
                      }
                    >
                      <th>
                        {month.toLocaleDateString(
                          "en-US",
                          {
                            month:
                              "short",
                            year:
                              "numeric",
                            timeZone:
                              "UTC",
                          },
                        )}
                      </th>

                      {Array.from(
                        {
                          length: 31,
                        },
                        (
                          _,
                          index,
                        ) => {
                          const day =
                            index + 1;

                          const date =
                            new Date(
                              Date.UTC(
                                month.getUTCFullYear(),
                                month.getUTCMonth(),
                                day,
                              ),
                            );

                          const validDay =
                            date.getUTCMonth() ===
                            month.getUTCMonth();

                          const inWindow =
                            validDay &&
                            date.getTime() >=
                              attendanceWindow
                                .windowStart
                                .getTime() &&
                            date.getTime() <=
                              attendanceWindow
                                .windowEnd
                                .getTime();

                          const dayEntries =
                            inWindow
                              ? monthEntries.filter(
                                  (
                                    entry,
                                  ) =>
                                    sameUtcDate(
                                      entry.entryDate,
                                      date,
                                    ),
                                )
                              : [];

                          return (
                            <td
                              key={
                                day
                              }
                              className={
                                !validDay
                                  ? "invalid-day"
                                  : !inWindow
                                    ? "outside-window"
                                    : dayEntries.length >
                                        0
                                      ? "event-day"
                                      : ""
                              }
                            >
                              {inWindow
                                ? eventMark(
                                    dayEntries,
                                  )
                                : ""}
                            </td>
                          );
                        },
                      )}

                      <td className="monthly-total">
                        {
                          monthlyTotal
                        }
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        <div className="six-month-total">
          <span>
            6-Month Total
          </span>

          <strong>
            {
              attendanceWindow
                .activePoints
            }
          </strong>
        </div>

        <section className="occurrence-section">
          <h2>
            Attendance Occurrences
            and Corrective Actions
            Given
          </h2>

          <table className="occurrence-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Points</th>
                <th>
                  Type of Occurrence
                </th>
                <th>Recorder</th>
                <th>
                  Details / Comments
                </th>
              </tr>
            </thead>

            <tbody>
              {activeEntries.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="empty-row"
                  >
                    No attendance
                    occurrences in
                    the active
                    six-month
                    window.
                  </td>
                </tr>
              ) : (
                activeEntries.map(
                  (entry) => (
                    <tr
                      key={
                        entry.id
                      }
                    >
                      <td>
                        {formatDate(
                          entry.entryDate,
                        )}
                      </td>

                      <td>
                        {
                          entry.policyPoints ??
                          0
                        }
                      </td>

                      <td>
                        {formatEventType(
                          entry.eventType,
                        )}
                      </td>

                      <td>
                        {entry.recordedBy ||
                          "—"}
                      </td>

                      <td>
                        {entry.note ||
                          entry.exceptionReason ||
                          (entry.protectedAbsence
                            ? "Protected absence"
                            : entry.excusedByManagement
                              ? "Excused by management"
                              : "—")}
                      </td>
                    </tr>
                  ),
                )
              )}

              {worker
                .attendanceCorrectiveActions
                .map(
                  (action) => (
                    <tr
                      key={`action-${action.id}`}
                      className="corrective-action-row"
                    >
                      <td>
                        {formatDate(
                          action.effectiveDate,
                        )}
                      </td>

                      <td>—</td>

                      <td>
                        Corrective
                        Action
                      </td>

                      <td>—</td>

                      <td>
                        {formatActionLevel(
                          action.actionLevel,
                        )}{" "}
                        —{" "}
                        {action.status}
                      </td>
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        </section>

        <div className="legend">
          <strong>
            Calendar:
          </strong>{" "}
          numeric value = recorded
          attendance points; E =
          protected/excused event.
        </div>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #ececec;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .attendance-record {
          padding: 20px;
        }

        .print-toolbar {
          width: min(1500px, 100%);
          margin: 0 auto 12px;
          display: flex;
          justify-content: flex-end;
        }

        .print-toolbar button {
          border: 1px solid #222;
          border-radius: 6px;
          background: #fff;
          padding: 9px 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .record-sheet {
          width: min(1500px, 100%);
          margin: 0 auto;
          background: #fff;
          border: 2px solid #111;
          padding: 12px;
        }

        h1 {
          margin: 0 0 12px;
          text-align: center;
          font-size: 22px;
          letter-spacing: 0.5px;
        }

        .employee-summary {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 14px;
          margin-bottom: 10px;
        }

        .employee-fields,
        .counseling-summary {
          border: 1px solid #111;
        }

        .field-row,
        .counseling-row {
          min-height: 34px;
          display: grid;
          align-items: center;
          border-bottom: 1px solid #111;
        }

        .field-row:last-child,
        .counseling-row:last-child {
          border-bottom: 0;
        }

        .field-row {
          grid-template-columns: 90px 1fr;
        }

        .field-label {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 6px 8px;
          background: #e5e5e5;
          font-weight: 700;
          border-right: 1px solid #111;
        }

        .field-value {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 6px 10px;
          background: #fff3a6;
          font-weight: 700;
        }

        .counseling-row {
          grid-template-columns: 1fr 230px;
        }

        .counseling-row > span {
          padding: 6px 8px;
          font-weight: 700;
          background: #e5e5e5;
          border-right: 1px solid #111;
        }

        .counseling-row strong {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          text-align: center;
        }

        .needed-level {
          background: #ffd7d7;
          color: #9d0000;
        }

        .policy-strip {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 6px 8px;
          margin-bottom: 10px;
          border: 1px solid #111;
          font-size: 11px;
        }

        .calendar-wrap {
          overflow-x: auto;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        .calendar-table {
          table-layout: fixed;
          font-size: 9px;
        }

        .calendar-table th,
        .calendar-table td {
          border: 1px solid #111;
          height: 28px;
          text-align: center;
          padding: 1px;
        }

        .calendar-table thead th {
          background: #d9d9d9;
          font-weight: 700;
        }

        .calendar-table .month-column {
          width: 76px;
        }

        .calendar-table .total-column {
          width: 58px;
        }

        .calendar-table tbody th {
          background: #ededed;
          white-space: nowrap;
        }

        .invalid-day {
          background: #555;
        }

        .outside-window {
          background: #ddd;
        }

        .event-day {
          background: #fff3a6;
          font-weight: 800;
        }

        .monthly-total {
          background: #ededed;
          font-weight: 800;
        }

        .six-month-total {
          width: 230px;
          margin: 8px 0 14px auto;
          display: grid;
          grid-template-columns: 1fr 75px;
          border: 2px solid #111;
          font-size: 15px;
          font-weight: 800;
        }

        .six-month-total span,
        .six-month-total strong {
          padding: 7px 10px;
        }

        .six-month-total span {
          background: #d9d9d9;
          border-right: 2px solid #111;
        }

        .six-month-total strong {
          display: flex;
          justify-content: center;
          align-items: center;
          background: #ffd7d7;
          color: #9d0000;
          font-size: 18px;
        }

        .occurrence-section h2 {
          margin: 0;
          padding: 6px;
          border: 1px solid #111;
          border-bottom: 0;
          background: #d9d9d9;
          text-align: center;
          font-size: 14px;
        }

        .occurrence-table {
          table-layout: fixed;
          font-size: 10px;
        }

        .occurrence-table th,
        .occurrence-table td {
          border: 1px solid #111;
          padding: 5px 6px;
          vertical-align: top;
        }

        .occurrence-table th {
          background: #ededed;
        }

        .occurrence-table th:nth-child(1) {
          width: 100px;
        }

        .occurrence-table th:nth-child(2) {
          width: 65px;
        }

        .occurrence-table th:nth-child(3) {
          width: 160px;
        }

        .occurrence-table th:nth-child(4) {
          width: 85px;
        }

        .corrective-action-row {
          background: #f3f3f3;
          font-weight: 700;
        }

        .empty-row {
          text-align: center;
          font-style: italic;
        }

        .legend {
          margin-top: 8px;
          font-size: 9px;
        }

        @page {
          size: landscape;
          margin: 0.3in;
        }

        @media print {
          body {
            background: #fff;
          }

          .attendance-record {
            padding: 0;
          }

          .print-toolbar {
            display: none;
          }

          .record-sheet {
            width: 100%;
            max-width: none;
            margin: 0;
            border: 0;
            padding: 0;
          }

          .calendar-wrap {
            overflow: visible;
          }

          .employee-summary,
          .calendar-table,
          .six-month-total,
          .occurrence-section {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}