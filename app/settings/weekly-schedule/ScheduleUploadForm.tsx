"use client";

import {
  useActionState,
} from "react";

import {
  importWeeklySchedule,
  previewWeeklySchedule,
  type ScheduleImportState,
  type SchedulePreviewState,
} from "./actions";

const initialSchedulePreviewState:
  SchedulePreviewState = {
    status:
      "idle",
  };

const initialScheduleImportState:
  ScheduleImportState = {
    status:
      "idle",
  };

function formatDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  return date.toLocaleDateString(
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
}

export default function ScheduleUploadForm() {
  const [
    previewState,
    previewAction,
    previewPending,
  ] =
    useActionState(
      previewWeeklySchedule,
      initialSchedulePreviewState,
    );

  const [
    importState,
    importAction,
    importPending,
  ] =
    useActionState(
      importWeeklySchedule,
      initialScheduleImportState,
    );

  const allMatched =
    previewState.status ===
      "success" &&
    (
      previewState.unmatchedShifts ??
      0
    ) ===
      0;

  const previewedShifts =
    previewState.weeks
      ?.flatMap(
        (
          week,
        ) =>
          week.shifts,
      ) ??
    [];

  return (
    <div
      style={
        styles.page
      }
    >
      <section
        style={
          styles.uploadCard
        }
      >
        <div>
          <p
            style={
              styles.eyebrow
            }
          >
            CSL Schedule Import
          </p>

          <h2
            style={
              styles.title
            }
          >
            Upload Weekly Schedule
          </h2>

          <p
            style={
              styles.copy
            }
          >
            Upload the Employee Schedule - Weekly
            Excel report. HIVE previews and matches
            every scheduled shift before anything
            is written to the database.
          </p>
        </div>

        <form
          action={
            previewAction
          }
          style={
            styles.form
          }
        >
          <label
            style={
              styles.fileField
            }
          >
            <span
              style={
                styles.fileLabel
              }
            >
              Weekly schedule file
            </span>

            <input
              name="scheduleFile"
              type="file"
              accept=".xlsx,.xls"
              required
              style={
                styles.fileInput
              }
            />
          </label>

          <button
            type="submit"
            disabled={
              previewPending
            }
            style={{
              ...styles.button,

              opacity:
                previewPending
                  ? 0.65
                  : 1,
            }}
          >
            {previewPending
              ? "Reading Schedule..."
              : "Preview Schedule"}
          </button>
        </form>
      </section>

      {previewState.status ===
        "error" && (
        <section
          style={
            styles.errorCard
          }
        >
          <strong>
            Schedule could not be previewed
          </strong>

          <p>
            {previewState.message}
          </p>
        </section>
      )}

      {previewState.status ===
        "success" && (
        <>
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
                File
              </span>

              <strong>
                {
                  previewState.fileName
                }
              </strong>
            </article>

            <article
              style={
                styles.summaryCard
              }
            >
              <span>
                Shifts Found
              </span>

              <strong>
                {previewState.totalShifts ??
                  0}
              </strong>
            </article>

            <article
              style={
                styles.summaryCardGood
              }
            >
              <span>
                Worker Matches
              </span>

              <strong>
                {previewState.matchedShifts ??
                  0}
              </strong>
            </article>

            <article
              style={
                (
                  previewState.unmatchedShifts ??
                  0
                ) >
                0
                  ? styles.summaryCardWarning
                  : styles.summaryCardGood
              }
            >
              <span>
                Unmatched Shifts
              </span>

              <strong>
                {previewState.unmatchedShifts ??
                  0}
              </strong>
            </article>
          </section>

          <section
            style={
              styles.previewCard
            }
          >
            <div
              style={
                styles.previewHeader
              }
            >
              <div>
                <p
                  style={
                    styles.eyebrow
                  }
                >
                  Import Preview
                </p>

                <h2
                  style={
                    styles.title
                  }
                >
                  Schedule HIVE Found
                </h2>

                <p
                  style={
                    styles.copy
                  }
                >
                  Review the employee matches,
                  dates and shift times before
                  importing.
                </p>
              </div>

              {allMatched && (
                <span
                  style={
                    styles.readyBadge
                  }
                >
                  Ready to Import
                </span>
              )}
            </div>

            {previewState.weeks?.map(
              (
                week,
              ) => (
                <div
                  key={
                    week.weekStart
                  }
                  style={
                    styles.weekSection
                  }
                >
                  <div
                    style={
                      styles.weekHeading
                    }
                  >
                    <strong>
                      Week of{" "}
                      {formatDate(
                        week.weekStart,
                      )}
                    </strong>

                    <span>
                      through{" "}
                      {formatDate(
                        week.weekEnd,
                      )}
                    </span>
                  </div>

                  <div
                    style={
                      styles.table
                    }
                  >
                    <div
                      style={
                        styles.tableHeader
                      }
                    >
                      <span>
                        Date
                      </span>

                      <span>
                        Employee
                      </span>

                      <span>
                        Primary Job
                      </span>

                      <span>
                        Schedule
                      </span>

                      <span>
                        HIVE Match
                      </span>
                    </div>

                    {week.shifts.map(
                      (
                        shift,
                        index,
                      ) => (
                        <div
                          key={[
                            shift
                              .normalizedEmployeeName,

                            shift
                              .shiftDate,

                            shift
                              .startTime,

                            shift
                              .endTime,

                            index,
                          ].join(
                            "-",
                          )}
                          style={
                            styles.tableRow
                          }
                        >
                          <div>
                            <strong>
                              {
                                shift.dayLabel
                              }
                            </strong>

                            <small
                              style={
                                styles.muted
                              }
                            >
                              {formatDate(
                                shift.shiftDate,
                              )}
                            </small>
                          </div>

                          <strong>
                            {
                              shift.employeeName
                            }
                          </strong>

                          <span>
                            {shift.primaryJob ||
                              "—"}
                          </span>

                          <span>
                            {
                              shift.startTime
                            }{" "}
                            –{" "}
                            {
                              shift.endTime
                            }
                          </span>

                          <span
                            style={
                              shift.matched
                                ? styles.matchGood
                                : styles.matchWarning
                            }
                          >
                            {shift.matched
                              ? shift.collectorName
                              : "Needs Matching"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}

            <div
              style={
                styles.importArea
              }
            >
              {!allMatched ? (
                <div
                  style={
                    styles.warningBox
                  }
                >
                  All scheduled workers must be
                  matched before this schedule can
                  be imported.
                </div>
              ) : (
                <form
                  action={
                    importAction
                  }
                >
                  <input
                    type="hidden"
                    name="fileName"
                    value={
                      previewState.fileName ??
                      ""
                    }
                  />

                  <input
                    type="hidden"
                    name="schedulePayload"
                    value={JSON.stringify(
                      previewedShifts,
                    )}
                  />

                  <button
                    type="submit"
                    disabled={
                      importPending ||
                      importState.status ===
                        "success"
                    }
                    style={{
                      ...styles.importButton,

                      opacity:
                        importPending ||
                        importState.status ===
                          "success"
                          ? 0.65
                          : 1,
                    }}
                  >
                    {importPending
                      ? "Importing Schedule..."
                      : importState.status ===
                            "success"
                        ? "Schedule Imported"
                        : "Confirm & Import Schedule"}
                  </button>
                </form>
              )}
            </div>

            {importState.status ===
              "success" && (
              <div
                style={
                  styles.successBox
                }
              >
                <strong>
                  Schedule imported successfully.
                </strong>

                <span>
                  {importState.message}
                </span>
              </div>
            )}

            {importState.status ===
              "error" && (
              <div
                style={
                  styles.errorCard
                }
              >
                <strong>
                  Schedule was not imported.
                </strong>

                <p>
                  {importState.message}
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    display:
      "grid",

    gap:
      22,
  },

  uploadCard: {
    padding:
      24,

    border:
      "1px solid #e2cd83",

    borderRadius:
      20,

    background:
      "#ffffff",

    boxShadow:
      "0 10px 24px rgba(76,53,6,.07)",
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

  title: {
    margin:
      0,

    color:
      "#3d2a07",
  },

  copy: {
    maxWidth:
      760,

    margin:
      "8px 0 0",

    color:
      "#75653e",

    fontSize:
      13,

    lineHeight:
      1.5,
  },

  form: {
    display:
      "flex",

    flexWrap:
      "wrap" as const,

    alignItems:
      "end",

    gap:
      14,

    marginTop:
      22,
  },

  fileField: {
    display:
      "grid",

    flex:
      "1 1 420px",

    gap:
      7,
  },

  fileLabel: {
    color:
      "#49350b",

    fontSize:
      13,

    fontWeight:
      900,
  },

  fileInput: {
    width:
      "100%",

    padding:
      12,

    border:
      "1px solid #dbc77f",

    borderRadius:
      10,

    background:
      "#fffef9",

    color:
      "#302204",

    boxSizing:
      "border-box" as const,
  },

  button: {
    padding:
      "13px 20px",

    border:
      0,

    borderRadius:
      10,

    background:
      "linear-gradient(135deg,#4c3506,#805b08)",

    color:
      "#ffffff",

    fontWeight:
      900,

    cursor:
      "pointer",
  },

  errorCard: {
    padding:
      20,

    border:
      "1px solid #e0a48d",

    borderRadius:
      16,

    background:
      "#fff2ed",

    color:
      "#8a351e",
  },

  summaryGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",

    gap:
      14,
  },

  summaryCard: {
    display:
      "grid",

    gap:
      8,

    padding:
      18,

    border:
      "1px solid #e2cd83",

    borderRadius:
      16,

    background:
      "#ffffff",

    color:
      "#49350b",
  },

  summaryCardGood: {
    display:
      "grid",

    gap:
      8,

    padding:
      18,

    border:
      "1px solid #a8cfad",

    borderRadius:
      16,

    background:
      "#eff9f0",

    color:
      "#235d31",
  },

  summaryCardWarning: {
    display:
      "grid",

    gap:
      8,

    padding:
      18,

    border:
      "1px solid #e3c067",

    borderRadius:
      16,

    background:
      "#fff8dd",

    color:
      "#805c0b",
  },

  previewCard: {
    padding:
      24,

    border:
      "1px solid #e2cd83",

    borderRadius:
      20,

    background:
      "#ffffff",

    boxShadow:
      "0 10px 24px rgba(76,53,6,.07)",
  },

  previewHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      16,

    marginBottom:
      22,
  },

  readyBadge: {
    padding:
      "8px 12px",

    borderRadius:
      999,

    background:
      "#e7f6e9",

    color:
      "#28743a",

    fontSize:
      11,

    fontWeight:
      900,

    textTransform:
      "uppercase" as const,
  },

  weekSection: {
    display:
      "grid",

    gap:
      12,

    marginTop:
      24,
  },

  weekHeading: {
    display:
      "flex",

    flexWrap:
      "wrap" as const,

    alignItems:
      "baseline",

    gap:
      8,

    color:
      "#49350b",
  },

  table: {
    overflowX:
      "auto" as const,

    border:
      "1px solid #eadba7",

    borderRadius:
      14,
  },

  tableHeader: {
    display:
      "grid",

    gridTemplateColumns:
      "130px minmax(180px,1.2fr) minmax(180px,1.2fr) minmax(180px,1fr) minmax(170px,1fr)",

    gap:
      12,

    minWidth:
      900,

    padding:
      "11px 14px",

    background:
      "#fff1b8",

    color:
      "#6d4d08",

    fontSize:
      11,

    fontWeight:
      900,

    textTransform:
      "uppercase" as const,
  },

  tableRow: {
    display:
      "grid",

    gridTemplateColumns:
      "130px minmax(180px,1.2fr) minmax(180px,1.2fr) minmax(180px,1fr) minmax(170px,1fr)",

    gap:
      12,

    alignItems:
      "center",

    minWidth:
      900,

    padding:
      "12px 14px",

    borderTop:
      "1px solid #eee2b8",

    color:
      "#49350b",

    fontSize:
      12,
  },

  muted: {
    display:
      "block",

    marginTop:
      3,

    color:
      "#8a7a4f",

    fontSize:
      10,
  },

  matchGood: {
    color:
      "#28743a",

    fontWeight:
      900,
  },

  matchWarning: {
    color:
      "#a7650b",

    fontWeight:
      900,
  },

  importArea: {
    display:
      "flex",

    justifyContent:
      "flex-end",

    marginTop:
      26,

    paddingTop:
      20,

    borderTop:
      "1px solid #eee2b8",
  },

  importButton: {
    padding:
      "14px 22px",

    border:
      0,

    borderRadius:
      11,

    background:
      "linear-gradient(135deg,#28743a,#175326)",

    color:
      "#ffffff",

    fontWeight:
      900,

    cursor:
      "pointer",
  },

  warningBox: {
    width:
      "100%",

    padding:
      14,

    border:
      "1px solid #e3c067",

    borderRadius:
      12,

    background:
      "#fff8dd",

    color:
      "#805c0b",

    fontWeight:
      800,
  },

  successBox: {
    display:
      "grid",

    gap:
      5,

    marginTop:
      18,

    padding:
      16,

    border:
      "1px solid #9fcba6",

    borderRadius:
      12,

    background:
      "#eff9f0",

    color:
      "#235d31",
  },
};