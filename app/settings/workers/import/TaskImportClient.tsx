"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  importWorkerTaskRows,
  parseWorkerTaskWorkbook,

  type TaskImportPreview,
  type TaskImportRow,
  type TaskImportStatus,
} from "./actions";

function statusLabel(
  status:
    TaskImportStatus,
) {
  switch (
    status
  ) {
    case "READY":
      return "Ready";

    case "UNMATCHED_WORKER":
      return "Worker Not Found";

    case "ROLE_MISMATCH":
      return "Role Mismatch";

    case "NEEDS_MAPPING":
      return "Needs Mapping";

      case "AMBIGUOUS_WORKER":
  return "Ambiguous Worker";
  }
}

function statusClass(
  status:
    TaskImportStatus,
) {
  switch (
    status
  ) {
    case "READY":
      return "status-ready";

    case "UNMATCHED_WORKER":
      return "status-error";

    case "ROLE_MISMATCH":
      return "status-warning";

    case "NEEDS_MAPPING":
      return "status-mapping";

      case "AMBIGUOUS_WORKER":
  return "status-warning";
  }
}

function formatDate(
  dateKey:
    string | null,
) {
  if (
    !dateKey
  ) {
    return "—";
  }

  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split(
        "-",
      )
      .map(
        Number,
      );

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  ).toLocaleDateString(
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

export default function TaskImportClient() {
  const [
    preview,
    setPreview,
  ] =
    useState<TaskImportPreview | null>(
      null,
    );

  const [
    resultMessage,
    setResultMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isPreviewing,
    startPreview,
  ] =
    useTransition();

  const [
    isImporting,
    startImport,
  ] =
    useTransition();

  const readyRows =
    useMemo(
      () =>
        preview?.rows.filter(
          (
            row,
          ) =>
            row.status ===
            "READY",
        ) ??
        [],
      [
        preview,
      ],
    );

  function handlePreview(
    formData:
      FormData,
  ) {
    setResultMessage(
      null,
    );

    startPreview(
      async () => {
        const response =
          await parseWorkerTaskWorkbook(
            formData,
          );

        setPreview(
          response,
        );
      },
    );
  }

  function handleImport() {
    if (
      !preview
    ) {
      return;
    }

    setResultMessage(
      null,
    );

    startImport(
      async () => {
        const response =
          await importWorkerTaskRows(
            JSON.stringify(
              preview.rows,
            ),
          );

        setResultMessage(
          response.message,
        );

        if (
          response.success
        ) {
          setPreview(
            (
              current,
            ) =>
              current
                ? {
                    ...current,

                    rows:
                      current.rows.map(
                        (
                          row,
                        ) =>
                          row.status ===
                          "READY"
                            ? {
                                ...row,

                                message:
                                  "Imported successfully.",
                              }
                            : row,
                      ),
                  }
                : current,
          );
        }
      },
    );
  }

  return (
    <div className="task-import">
      <section className="upload-card">
        <div className="upload-heading">
          <div>
            <p className="eyebrow">
              CSL Task Import
            </p>

            <h2>
              Upload Tasks Completed by Employee
            </h2>

            <p>
              HIVE will detect the report date,
              normalize employee names, match
              tasks to Worker Bee roles, and
              preview every row before anything
              is written.
            </p>
          </div>

          <span className="safe-badge">
            Preview First
          </span>
        </div>

        <form action={handlePreview}>
          <label className="file-picker">
            <span>
              Excel Task Sheet
            </span>

            <input
              type="file"
              name="taskFile"
              accept=".xlsx,.xlsm,.xls"
              required
            />
          </label>

          <button
            type="submit"
            disabled={
              isPreviewing
            }
          >
            {isPreviewing
              ? "Reading Workbook..."
              : "Preview Import"}
          </button>
        </form>
      </section>

      {preview && (
        <>
          <section className="summary-grid">
            <article>
              <span>
                Report Date
              </span>

              <strong>
                {formatDate(
                  preview.operationalDate,
                )}
              </strong>
            </article>

            <article>
              <span>
                Rows Detected
              </span>

              <strong>
                {
                  preview.rows.length
                }
              </strong>
            </article>

            <article className="good-card">
              <span>
                Ready to Import
              </span>

              <strong>
                {
                  preview.readyCount
                }
              </strong>
            </article>

            <article
              className={
                preview.warningCount >
                0
                  ? "warning-card"
                  : ""
              }
            >
              <span>
                Needs Review
              </span>

              <strong>
                {
                  preview.warningCount
                }
              </strong>
            </article>
          </section>

          {preview.errors.length >
            0 && (
            <section className="error-box">
              {preview.errors.map(
                (
                  error,
                ) => (
                  <p
                    key={
                      error
                    }
                  >
                    {error}
                  </p>
                ),
              )}
            </section>
          )}

          {preview.success && (
            <section className="preview-card">
              <div className="preview-heading">
                <div>
                  <p className="eyebrow">
                    Validation Preview
                  </p>

                  <h2>
                    Worker Task Matches
                  </h2>
                </div>

                <div className="preview-actions">
                  <span>
                    {
                      readyRows.length
                    }{" "}
                    validated
                  </span>

                  <button
                    type="button"
                    onClick={
                      handleImport
                    }
                    disabled={
                      readyRows.length ===
                        0 ||
                      isImporting
                    }
                  >
                    {isImporting
                      ? "Importing..."
                      : `Import ${readyRows.length} Validated Rows`}
                  </button>
                </div>
              </div>

              {resultMessage && (
                <div className="result-message">
                  {
                    resultMessage
                  }
                </div>
              )}

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Date
                      </th>

                      <th>
                        Report Employee
                      </th>

                      <th>
                        HIVE Worker
                      </th>

                      <th>
                        Task
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        Value
                      </th>

                      <th>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {preview.rows.map(
                      (
                        row,
                      ) => (
                        <PreviewRow
                          key={
                            row.rowId
                          }
                          row={
                            row
                          }
                        />
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      <style>
        {`
          .task-import {
            display: grid;
            gap: 20px;
          }

          .upload-card,
          .preview-card {
            padding: 22px;

            border:
              1px solid
              #e2cd83;

            border-radius:
              18px;

            background:
              #ffffff;

            box-shadow:
              0 10px 24px
              rgba(
                76,
                53,
                6,
                .07
              );
          }

          .upload-heading,
          .preview-heading {
            display: flex;

            align-items:
              flex-start;

            justify-content:
              space-between;

            gap: 20px;

            margin-bottom:
              20px;
          }

          .eyebrow {
            margin:
              0 0 6px;

            color:
              #9a6b08;

            font-size:
              11px;

            font-weight:
              900;

            letter-spacing:
              .14em;

            text-transform:
              uppercase;
          }

          h2 {
            margin: 0;

            color:
              #3d2a07;
          }

          .upload-heading p:not(
            .eyebrow
          ) {
            max-width:
              760px;

            margin:
              7px 0 0;

            color:
              #75653e;

            font-size:
              13px;

            line-height:
              1.5;
          }

          .safe-badge {
            flex:
              0 0 auto;

            padding:
              7px 11px;

            border-radius:
              999px;

            background:
              #e9f4d8;

            color:
              #396625;

            font-size:
              11px;

            font-weight:
              900;

            text-transform:
              uppercase;
          }

          form {
            display: flex;

            align-items:
              flex-end;

            gap: 14px;
          }

          .file-picker {
            display: grid;

            flex: 1;

            gap: 7px;

            color:
              #49350b;

            font-size:
              13px;

            font-weight:
              900;
          }

          input[type="file"] {
            width: 100%;

            padding:
              12px;

            border:
              1px solid
              #dbc77f;

            border-radius:
              10px;

            background:
              #fffef9;

            color:
              #49350b;
          }

          button {
            padding:
              12px 18px;

            border: 0;

            border-radius:
              10px;

            background:
              linear-gradient(
                135deg,
                #4c3506,
                #805b08
              );

            color:
              white;

            font-weight:
              900;

            cursor:
              pointer;
          }

          button:disabled {
            cursor:
              not-allowed;

            opacity:
              .55;
          }

          .summary-grid {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 12px;
          }

          .summary-grid article {
            display: flex;

            flex-direction:
              column;

            padding: 16px;

            border:
              1px solid
              #e4d6a4;

            border-radius:
              14px;

            background:
              #fffdf5;

            color:
              #49350b;
          }

          .summary-grid span {
            color:
              #84744b;

            font-size:
              10px;

            font-weight:
              900;

            letter-spacing:
              .08em;

            text-transform:
              uppercase;
          }

          .summary-grid strong {
            margin-top:
              5px;

            font-size:
              1.25rem;
          }

          .good-card {
            border-color:
              #afd292 !important;

            background:
              #f2f9e9 !important;
          }

          .warning-card {
            border-color:
              #e8ba72 !important;

            background:
              #fff4df !important;
          }

          .error-box {
            padding:
              14px 16px;

            border:
              1px solid
              #e1a28e;

            border-radius:
              12px;

            background:
              #fff0eb;

            color:
              #8f3928;
          }

          .error-box p {
            margin:
              0;
          }

          .preview-actions {
            display: flex;

            align-items:
              center;

            gap: 12px;
          }

          .preview-actions span {
            color:
              #75653e;

            font-size:
              12px;

            font-weight:
              800;
          }

          .result-message {
            margin-bottom:
              14px;

            padding:
              11px 13px;

            border-radius:
              10px;

            background:
              #eef7df;

            color:
              #3c6526;

            font-size:
              12px;

            font-weight:
              900;
          }

          .table-scroll {
            overflow-x:
              auto;

            border:
              1px solid
              #eadba7;

            border-radius:
              12px;
          }

          table {
            width: 100%;

            min-width:
              950px;

            border-collapse:
              collapse;

            background:
              white;
          }

          th {
            padding:
              10px 12px;

            background:
              #fff1b8;

            color:
              #6d4d08;

            font-size:
              10px;

            text-align:
              left;

            text-transform:
              uppercase;
          }

          td {
            padding:
              11px 12px;

            border-top:
              1px solid
              #eee2b8;

            color:
              #49350b;

            font-size:
              12px;

            vertical-align:
              top;
          }

          td strong {
            display: block;
          }

          td small {
            display: block;

            margin-top:
              3px;

            color:
              #85774f;

            line-height:
              1.35;
          }

          .status-pill {
            display:
              inline-flex;

            padding:
              5px 8px;

            border-radius:
              999px;

            font-size:
              9px;

            font-weight:
              1000;

            white-space:
              nowrap;

            text-transform:
              uppercase;
          }

          .status-ready {
            background:
              #e4f3d5;

            color:
              #32651e;
          }

          .status-warning {
            background:
              #fff0c9;

            color:
              #8d5b08;
          }

          .status-error {
            background:
              #ffe2dc;

            color:
              #9d3f2e;
          }

          .status-mapping {
            background:
              #e7e3f8;

            color:
              #554690;
          }

          @media (
            max-width:
              900px
          ) {
            .summary-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );
            }

            .upload-heading,
            .preview-heading,
            form {
              align-items:
                stretch;

              flex-direction:
                column;
            }
          }
        `}
      </style>
    </div>
  );
}

function PreviewRow({
  row,
}: {
  row:
    TaskImportRow;
}) {
  return (
    <tr>
      <td>
        {formatDate(
          row.operationalDate,
        )}
      </td>

      <td>
        <strong>
          {
            row.sourceEmployeeName
          }
        </strong>

        <small>
          {
            row.sourceSection
          }
        </small>
      </td>

      <td>
        {row.matchedWorkerName ??
          "—"}
      </td>

      <td>
        {
          row.taskLabel
        }
      </td>

      <td>
        {row.role
          ? row.role.replaceAll(
              "_",
              " ",
            )
          : "—"}
      </td>

      <td>
        <strong>
          {row.value.toLocaleString(
            "en-US",
          )}
        </strong>
      </td>

      <td>
        <span
          className={`status-pill ${statusClass(
            row.status,
          )}`}
        >
          {statusLabel(
            row.status,
          )}
        </span>

        <small>
          {
            row.message
          }
        </small>
      </td>
    </tr>
  );
}