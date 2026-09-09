"use client";

import {
  useState,
} from "react";

import Link from "next/link";

type PreviewRow = {
  rowNumber: number;
  sourceEmployeeName: string;
  emfCount: number;

  matchedWorkers: Array<{
    id: number;
    name: string;
  }>;

  unresolvedNames: string[];

  status:
    | "READY"
    | "SHARED"
    | "NEEDS_MATCHING"
    | "IGNORED";

  message: string;
};

type WorkerTotal = {
  collectorId: number;
  workerName: string;
  emfCount: number;
};

type PreviewResponse = {
  ok: boolean;
  reason?: string;

  fileName?: string;

  periodStart?: string | null;
  periodEnd?: string | null;

  detectedPeriodStart?: string | null;
  detectedPeriodEnd?: string | null;

  dateSource?:
    | "DETECTED"
    | "MANUAL"
    | "REQUIRED";

  needsManualDate?: boolean;

  rows?: PreviewRow[];
  workerTotals?: WorkerTotal[];

  readySourceCount?: number;
  sharedSourceCount?: number;
  needsMatchingCount?: number;
  ignoredCount?: number;

  sourceEmfTotal?: number;
  attributedEmfTotal?: number;
};

type ImportResponse = {
  ok?: boolean;
  reason?: string;

  importedWorkers?: number;
  importedAttributedEmfs?: number;
};

export default function EmfImportClient() {
  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    periodStart,
    setPeriodStart,
  ] =
    useState("");

  const [
    periodEnd,
    setPeriodEnd,
  ] =
    useState("");

  const [
    preview,
    setPreview,
  ] =
    useState<PreviewResponse | null>(
      null,
    );

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    importComplete,
    setImportComplete,
  ] =
    useState(false);

  function resetPreview() {
    setPreview(null);
    setMessage("");
    setImportComplete(
      false,
    );
  }

  async function verify() {
    if (!file) {
      setMessage(
        "Choose the EMF workbook first.",
      );

      return;
    }

    setBusy(true);
    setMessage("");
    setImportComplete(
      false,
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      /*
       * Manual dates are optional.
       *
       * The backend will prefer a trustworthy
       * reporting period detected from the
       * workbook.
       */

      if (periodStart) {
        formData.append(
          "periodStart",
          periodStart,
        );
      }

      if (periodEnd) {
        formData.append(
          "periodEnd",
          periodEnd,
        );
      }

      const response =
        await fetch(
          "/api/emf-import/verify",
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        (await response.json()) as PreviewResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.reason ??
            "Unable to verify the workbook.",
        );
      }

      /*
       * If HIVE confidently detected the
       * reporting period, populate the UI.
       */

      if (
        data.periodStart
      ) {
        setPeriodStart(
          data.periodStart,
        );
      }

      if (
        data.periodEnd
      ) {
        setPeriodEnd(
          data.periodEnd,
        );
      }

      setPreview(data);

      if (
        data.needsManualDate
      ) {
        setMessage(
          "HIVE successfully read the EMF data, but this workbook does not contain a trustworthy reporting period. Enter the period start and end dates, then click Verify Import again.",
        );
      }
    } catch (error) {
      setPreview(null);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the workbook.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function importRows() {
    if (!file) {
      return;
    }

    if (
      !periodStart ||
      !periodEnd
    ) {
      setMessage(
        "The reporting period must be confirmed before importing.",
      );

      return;
    }

    if (
      preview?.needsManualDate
    ) {
      setMessage(
        "Enter the reporting period and click Verify Import again before confirming.",
      );

      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "periodStart",
        periodStart,
      );

      formData.append(
        "periodEnd",
        periodEnd,
      );

      const response =
        await fetch(
          "/api/emf-import",
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        (await response.json()) as ImportResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.reason ??
            "Unable to import EMFs.",
        );
      }

      setImportComplete(
        true,
      );

      const skipped =
        preview?.needsMatchingCount ?? 0;

      setMessage(
        `${data.importedWorkers ?? 0} Worker Bee totals imported successfully (${data.importedAttributedEmfs ?? 0} attributed EMFs).${
          skipped > 0
            ? ` ${skipped} unresolved source row${skipped === 1 ? "" : "s"} skipped.`
            : ""
        }`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to import EMFs.",
      );
    } finally {
      setBusy(false);
    }
  }

  const cardStyle:
    React.CSSProperties = {
    border:
      "1px solid #ead9a5",

    borderRadius: 18,

    background:
      "#fffdf6",

    color:
      "#2b220b",

    padding: 20,

    boxShadow:
      "0 8px 24px rgba(68,47,4,0.08)",
  };

  const inputStyle:
    React.CSSProperties = {
    width: "100%",

    boxSizing:
      "border-box",

    padding:
      "10px 12px",

    borderRadius: 10,

    border:
      "1px solid #d9c483",

    background:
      "#ffffff",

    color:
      "#211a08",

    fontWeight:
      700,
  };

  const canImport =
    Boolean(
      preview?.ok &&
        !preview.needsManualDate &&
        periodStart &&
        periodEnd &&
        (
          preview.workerTotals ??
          []
        ).length > 0 &&
        !importComplete,
    );

  return (
    <div
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      <div>
        <Link
          href="/settings/workers/emf"
          style={{
            color:
              "#805c0b",

            fontWeight:
              900,

            textDecoration:
              "none",
          }}
        >
          ← Back to Quality / EMF
        </Link>
      </div>

      <section
        style={
          cardStyle
        }
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          Import CSL EMF Report
        </h2>

        <p
          style={{
            marginTop: 0,
            color:
              "#4b3c17",
            lineHeight: 1.6,
          }}
        >
          Upload the CSL
          employee-error workbook.
          HIVE will identify the
          employee totals, resolve
          Worker Bees, expand shared
          EMFs, and attempt to detect
          the reporting period before
          anything is written.
        </p>

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: 14,

            marginTop: 18,
          }}
        >
          <label>
            <div
              style={{
                fontWeight:
                  900,

                marginBottom:
                  6,
              }}
            >
              EMF workbook
            </div>

            <input
              type="file"
              accept=".xlsx,.xlsm,.xls"
              onChange={(
                event,
              ) => {
                setFile(
                  event
                    .target
                    .files?.[0] ??
                    null,
                );

                setPeriodStart(
                  "",
                );

                setPeriodEnd(
                  "",
                );

                resetPreview();
              }}
            />
          </label>

          <label>
            <div
              style={{
                fontWeight:
                  900,

                marginBottom:
                  6,
              }}
            >
              Period start
            </div>

            <input
              type="date"
              value={
                periodStart
              }
              onChange={(
                event,
              ) => {
                setPeriodStart(
                  event
                    .target
                    .value,
                );

                /*
                 * If dates were required,
                 * changing them means the
                 * workbook needs verification
                 * again.
                 */

                if (
                  preview
                ) {
                  setPreview({
                    ...preview,
                    needsManualDate:
                      true,
                  });
                }

                setImportComplete(
                  false,
                );
              }}
              style={
                inputStyle
              }
            />
          </label>

          <label>
            <div
              style={{
                fontWeight:
                  900,

                marginBottom:
                  6,
              }}
            >
              Period end
            </div>

            <input
              type="date"
              value={
                periodEnd
              }
              onChange={(
                event,
              ) => {
                setPeriodEnd(
                  event
                    .target
                    .value,
                );

                if (
                  preview
                ) {
                  setPreview({
                    ...preview,
                    needsManualDate:
                      true,
                  });
                }

                setImportComplete(
                  false,
                );
              }}
              style={
                inputStyle
              }
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 12,
            color:
              "#514318",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          You can leave the dates
          blank initially. HIVE will
          attempt to detect a real
          reporting period from the
          workbook. An export or print
          timestamp alone will not be
          treated as the reporting
          period.
        </div>

        <button
          type="button"
          onClick={
            verify
          }
          disabled={
            busy ||
            !file
          }
          style={{
            marginTop: 18,

            padding:
              "11px 18px",

            border: 0,

            borderRadius:
              12,

            fontWeight:
              900,

            background:
              "#f5b800",

            color:
              "#271d00",

            cursor:
              busy
                ? "default"
                : "pointer",
          }}
        >
          {busy
            ? "Working..."
            : preview?.needsManualDate &&
                periodStart &&
                periodEnd
              ? "Verify Dates & Import"
              : "Verify Import"}
        </button>

        {message ? (
          <div
            style={{
              marginTop:
                16,

              padding:
                12,

              borderRadius:
                10,

              background:
                importComplete
                  ? "#e8f7e7"
                  : "#fff4c4",

              fontWeight:
                800,

              lineHeight:
                1.5,
            }}
          >
            {message}
          </div>
        ) : null}
      </section>

      {preview?.ok ? (
        <>
          <section
            style={
              cardStyle
            }
          >
            <h3
              style={{
                marginTop:
                  0,
              }}
            >
              Reporting Period
            </h3>

            {preview.dateSource ===
            "DETECTED" ? (
              <div>
                <strong>
                  HIVE detected:
                </strong>{" "}
                {periodStart} →{" "}
                {periodEnd}
              </div>
            ) : preview.dateSource ===
              "MANUAL" ? (
              <div>
                <strong>
                  Manager confirmed:
                </strong>{" "}
                {periodStart} →{" "}
                {periodEnd}
              </div>
            ) : (
              <div
                style={{
                  color:
                    "#8b5b00",

                  fontWeight:
                    800,
                }}
              >
                No trustworthy
                reporting period was
                found in the workbook.
                Enter the dates above
                and verify again.
              </div>
            )}
          </section>

          <section
            style={
              cardStyle
            }
          >
            <h3
              style={{
                marginTop:
                  0,
              }}
            >
              Verification Summary
            </h3>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(140px, 1fr))",

                gap: 12,
              }}
            >
              {[
                [
                  "Ready",
                  preview.readySourceCount ??
                    0,
                ],

                [
                  "Shared",
                  preview.sharedSourceCount ??
                    0,
                ],

                [
                  "Needs Matching",
                  preview.needsMatchingCount ??
                    0,
                ],

                [
                  "Ignored",
                  preview.ignoredCount ??
                    0,
                ],

                [
                  "Source EMFs",
                  preview.sourceEmfTotal ??
                    0,
                ],

                [
                  "Attributed EMFs",
                  preview.attributedEmfTotal ??
                    0,
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={
                      String(
                        label,
                      )
                    }
                    style={{
                      padding:
                        14,

                      borderRadius:
                        12,

                      background:
                        "#fff8d9",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          12,

                        fontWeight:
                          900,

                        color:
                          "#574814",
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        marginTop:
                          4,

                        fontSize:
                          24,

                        fontWeight:
                          950,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section
            style={
              cardStyle
            }
          >
            <h3
              style={{
                marginTop:
                  0,
              }}
            >
              Worker Bee Totals
            </h3>

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",

                  color:
                    "#2b220b",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign:
                          "left",

                        padding:
                          10,
                      }}
                    >
                      Worker Bee
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",

                        padding:
                          10,
                      }}
                    >
                      EMFs
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(
                    preview.workerTotals ??
                    []
                  ).map(
                    (
                      worker,
                    ) => (
                      <tr
                        key={
                          worker.collectorId
                        }
                      >
                        <td
                          style={{
                            padding:
                              10,

                            borderTop:
                              "1px solid #eee2bd",

                            fontWeight:
                              800,
                          }}
                        >
                          {
                            worker.workerName
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              10,

                            borderTop:
                              "1px solid #eee2bd",

                            textAlign:
                              "right",

                            fontWeight:
                              950,
                          }}
                        >
                          {
                            worker.emfCount
                          }
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section
            style={{
              ...cardStyle,
              background:
                (preview.needsMatchingCount ?? 0) > 0
                  ? "#fff7d6"
                  : "#eef8ea",
              border:
                (preview.needsMatchingCount ?? 0) > 0
                  ? "1px solid #d5a900"
                  : "1px solid #9abb8e",
            }}
          >
            <div
              style={{
                fontWeight: 950,
                color: "#2b220b",
                lineHeight: 1.55,
              }}
            >
              {(preview.needsMatchingCount ?? 0) > 0
                ? `HIVE will import all verified Worker Bee EMFs. ${preview.needsMatchingCount ?? 0} unresolved source row${(preview.needsMatchingCount ?? 0) === 1 ? "" : "s"} will be skipped and will not block this import.`
                : "All identified EMF rows are verified and ready for import."}
            </div>
          </section>

          <section
            style={
              cardStyle
            }
          >
            <h3
              style={{
                marginTop:
                  0,
                color:
                  "#2b220b",
              }}
            >
              Source Verification
            </h3>

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",

                  fontSize:
                    13,

                  color:
                    "#2b220b",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign:
                          "left",

                        padding:
                          8,
                      }}
                    >
                      Source
                    </th>

                    <th
                      style={{
                        textAlign:
                          "right",

                        padding:
                          8,
                      }}
                    >
                      EMFs
                    </th>

                    <th
                      style={{
                        textAlign:
                          "left",

                        padding:
                          8,
                      }}
                    >
                      HIVE Match
                    </th>

                    <th
                      style={{
                        textAlign:
                          "left",

                        padding:
                          8,
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(
                    preview.rows ??
                    []
                  ).map(
                    (
                      row,
                    ) => (
                      <tr
                        key={
                          row.rowNumber
                        }
                        style={{
                          background:
                            row.status === "NEEDS_MATCHING"
                              ? "#fff1e8"
                              : row.status === "SHARED"
                                ? "#fff8d9"
                                : row.status === "IGNORED"
                                  ? "#f2f0e8"
                                  : "#ffffff",
                        }}
                      >
                        <td
                          style={{
                            padding:
                              8,

                            borderTop:
                              "1px solid #eee2bd",
                          }}
                        >
                          {
                            row.sourceEmployeeName
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              8,

                            borderTop:
                              "1px solid #eee2bd",

                            textAlign:
                              "right",

                            fontWeight:
                              900,
                          }}
                        >
                          {
                            row.emfCount
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              8,

                            borderTop:
                              "1px solid #eee2bd",
                          }}
                        >
                          {row.matchedWorkers
                            .map(
                              (
                                worker,
                              ) =>
                                worker.name,
                            )
                            .join(
                              ", ",
                            ) ||
                            "—"}
                        </td>

                        <td
                          style={{
                            padding:
                              8,

                            borderTop:
                              "1px solid #eee2bd",

                            fontWeight:
                              900,
                          }}
                        >
                          <span
                            style={{
                              color:
                                row.status === "NEEDS_MATCHING"
                                  ? "#8b2f22"
                                  : row.status === "READY"
                                    ? "#235c2b"
                                    : row.status === "SHARED"
                                      ? "#6a4d00"
                                      : "#514b3d",
                            }}
                          >
                            {row.status === "NEEDS_MATCHING"
                              ? "NEEDS MATCHING"
                              : row.status}
                          </span>

                          {row.message ? (
                            <div
                              style={{
                                marginTop:
                                  3,

                                fontWeight:
                                  600,

                                color:
                                  row.status ===
                                  "NEEDS_MATCHING"
                                    ? "#8b2f22"
                                    : "#4b3c17",
                              }}
                            >
                              {
                                row.message
                              }
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={
                importRows
              }
              disabled={
                busy ||
                !canImport
              }
              style={{
                marginTop:
                  18,

                padding:
                  "12px 20px",

                border:
                  0,

                borderRadius:
                  12,

                background:
                  canImport
                    ? "#342600"
                    : "#aaa38f",

                color:
                  canImport
                    ? "#ffd84d"
                    : "#ece8dd",

                fontWeight:
                  950,

                cursor:
                  canImport
                    ? "pointer"
                    : "default",
              }}
            >
              Confirm EMF Import
            </button>
          </section>
        </>
      ) : null}
    </div>
  );
}