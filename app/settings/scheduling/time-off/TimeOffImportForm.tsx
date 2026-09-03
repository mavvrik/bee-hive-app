"use client";

import { useState, useTransition } from "react";

import {
  confirmTimeOffImport,
  previewTimeOffImport,
} from "./actions";

type Preview = Awaited<
  ReturnType<typeof previewTimeOffImport>
>;

function prettyDate(value: string | null) {
  if (!value) return "Not detected";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function TimeOffImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function analyze() {
    if (!file) {
      setMessage("Choose the CSL Time Off Requests workbook first.");
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);

        const formData = new FormData();
        formData.set("file", file);

        const result = await previewTimeOffImport(formData);
        setPreview(result);
      } catch (error) {
        setPreview(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "HIVE could not analyze the workbook.",
        );
      }
    });
  }

  function confirmImport() {
    if (!file || !preview) return;

    startTransition(async () => {
      try {
        setMessage(null);

        const formData = new FormData();
        formData.set("file", file);

        const result = await confirmTimeOffImport(formData);

        setMessage(
          `Import complete. ${result.importedCount} time-off request(s) are now scheduling constraints${
            result.warningCount
              ? ` with ${result.warningCount} warning(s)`
              : ""
          }.`,
        );

        setPreview(null);
        setFile(null);

        const input = document.getElementById(
          "time-off-file",
        ) as HTMLInputElement | null;

        if (input) input.value = "";
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "HIVE could not import the workbook.",
        );
      }
    });
  }

  return (
    <div className="importer">
      <section className="step">
        <div className="step-number">1</div>
        <div className="step-body">
          <h3>Choose &amp; analyze workbook</h3>
          <p>
            HIVE reads the CSL report first. Nothing is written during
            preview.
          </p>

          <div className="file-row">
            <input
              id="time-off-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setMessage(null);
              }}
            />

            <button
              type="button"
              onClick={analyze}
              disabled={!file || isPending}
            >
              {isPending ? "Analyzing..." : "Analyze Workbook"}
            </button>
          </div>
        </div>
      </section>

      {preview ? (
        <>
          <section className="step">
            <div className="step-number">2</div>
            <div className="step-body">
              <h3>Review detected requests &amp; worker matches</h3>

              <div className="kpis">
                <Kpi
                  label="Requests"
                  value={String(preview.matches.length)}
                />
                <Kpi
                  label="Matched"
                  value={String(preview.matchedCount)}
                  good
                />
                <Kpi
                  label="Needs Review"
                  value={String(preview.reviewCount)}
                  warn={preview.reviewCount > 0}
                />
                <Kpi
                  label="Report Period"
                  value={`${prettyDate(
                    preview.reportPeriodStart,
                  )} – ${prettyDate(preview.reportPeriodEnd)}`}
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Source Employee</th>
                      <th>HIVE Match</th>
                      <th>Dates</th>
                      <th>Type</th>
                      <th>Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.matches.map((item, index) => (
                      <tr
                        key={`${item.employeeId}-${item.startDate}-${index}`}
                      >
                        <td>
                          <strong>{item.sourceEmployeeName}</strong>
                          <small>
                            Employee ID {item.employeeId || "—"}
                          </small>
                        </td>
                        <td>
                          {item.collectorName ?? "Needs Review"}
                        </td>
                        <td>
                          {prettyDate(item.startDate)} –{" "}
                          {prettyDate(item.endDate)}
                        </td>
                        <td>{item.subtype ?? "—"}</td>
                        <td>
                          <span
                            className={`match ${
                              item.matchStatus === "MATCHED"
                                ? "good"
                                : "warn"
                            }`}
                          >
                            {item.matchStatus}
                          </span>
                          <small>{item.matchMethod}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.warnings.length > 0 ? (
                <div className="warnings">
                  <strong>Parser notes</strong>
                  {preview.warnings.map((warning) => (
                    <p key={warning}>• {warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="step">
            <div className="step-number">3</div>
            <div className="step-body">
              <h3>Confirm import</h3>
              <p>
                Confirming writes the matched requests to HIVE. Their actual
                start/end dates become hard scheduling unavailability.
              </p>

              {preview.reviewCount > 0 ? (
                <div className="blocked">
                  Import blocked: {preview.reviewCount} employee match(es)
                  need review. HIVE will not guess.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={isPending}
                  className="confirm"
                >
                  {isPending
                    ? "Importing..."
                    : `Confirm ${preview.matches.length} Time-Off Request${
                        preview.matches.length === 1 ? "" : "s"
                      }`}
                </button>
              )}
            </div>
          </section>
        </>
      ) : null}

      {message ? <div className="message">{message}</div> : null}

      <style>{`
        .importer {
          display: grid;
          gap: 15px;
        }

        .step {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          padding: 18px;
          border: 1px solid #e7d8a7;
          border-radius: 18px;
          background: #fff;
        }

        .step-number {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #3f2d09;
          color: #fff;
          font-weight: 900;
        }

        .step h3 {
          margin: 3px 0 5px;
          color: #33250c;
        }

        .step p {
          margin: 0 0 13px;
          color: #6b7280;
          line-height: 1.5;
        }

        .file-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        button {
          border: 0;
          border-radius: 10px;
          padding: 10px 13px;
          background: #3f2d09;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .confirm {
          background: #166534;
        }

        .kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 9px;
          margin-bottom: 14px;
        }

        .kpi {
          padding: 11px;
          border-radius: 12px;
          background: #f7f7f7;
        }

        .kpi.good {
          background: #ecfdf5;
        }

        .kpi.warn {
          background: #fff7d6;
        }

        .kpi span {
          display: block;
          color: #6b7280;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .kpi strong {
          display: block;
          margin-top: 3px;
          color: #272015;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        th,
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          vertical-align: top;
        }

        th {
          color: #6b7280;
          font-size: 10px;
          text-transform: uppercase;
        }

        td strong,
        td small {
          display: block;
        }

        td small {
          margin-top: 3px;
          color: #6b7280;
        }

        .match {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .match.good {
          background: #dcfce7;
          color: #166534;
        }

        .match.warn {
          background: #fef3c7;
          color: #92400e;
        }

        .warnings,
        .blocked,
        .message {
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
        }

        .warnings,
        .blocked {
          background: #fff7d6;
          color: #79550a;
        }

        .warnings p {
          margin: 5px 0 0;
          color: inherit;
          font-size: 12px;
        }

        .message {
          border: 1px solid #d1d5db;
          background: #f9fafb;
          color: #374151;
        }
      `}</style>
    </div>
  );
}

function Kpi({
  label,
  value,
  good = false,
  warn = false,
}: {
  label: string;
  value: string;
  good?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`kpi ${good ? "good" : ""} ${
        warn ? "warn" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
