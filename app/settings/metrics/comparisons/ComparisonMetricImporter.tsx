"use client";

import { useState } from "react";

type VerifyRow = {
  sourceHeader: string;
  metricKey: string;
  displayName: string;
  existingValue: number | null;
  existingDisplay: string;
  existingSource: string | null;
  existingRecordedAt?: string | null;
  fileValue: number | null;
  fileDisplay: string;
  action:
    | "ADD"
    | "UPDATE"
    | "NO_CHANGE"
    | "SKIP_BLANK"
    | "NEEDS_MAPPING";
  canImport: boolean;
};

type VerifyResponse = {
  ok?: boolean;
  blocked?: boolean;
  reason?: string;
  fileName?: string;
  centerName?: string;
  operationalDate?: string;
  rows?: VerifyRow[];
  summary?: {
    add: number;
    update: number;
    noChange: number;
    skippedBlank: number;
    needsMapping: number;
    ignored: number;
  };
  ignoredHeaders?: string[];
};

type ImportResponse = {
  ok?: boolean;
  operationalDate?: string;
  centerName?: string;
  imported?: string[];
  ignored?: string[];
  needsMapping?: string[];
  error?: string;
};

function formatDate(dateText?: string) {
  if (!dateText) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateText}T12:00:00.000Z`));
}

function actionLabel(action: VerifyRow["action"]) {
  if (action === "ADD") return "ADD";
  if (action === "UPDATE") return "UPDATE";
  if (action === "NO_CHANGE") return "NO CHANGE";
  if (action === "SKIP_BLANK") return "SKIP";
  return "NEEDS MAPPING";
}

export default function ComparisonMetricImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [verification, setVerification] =
    useState<VerifyResponse | null>(null);
  const [importResult, setImportResult] =
    useState<ImportResponse | null>(null);

  async function verifyFile() {
    if (!file) return;

    setVerifying(true);
    setVerification(null);
    setImportResult(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(
        "/api/comparison-metrics/import/verify",
        {
          method: "POST",
          body,
        },
      );

      const data = (await response.json()) as VerifyResponse;

      setVerification(data);
    } catch {
      setVerification({
        ok: false,
        blocked: true,
        reason: "Unable to verify file.",
      });
    } finally {
      setVerifying(false);
    }
  }

  async function confirmImport() {
    if (!file || !verification?.ok || verification.blocked) {
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(
        "/api/comparison-metrics/import",
        {
          method: "POST",
          body,
        },
      );

      const data = (await response.json()) as ImportResponse;
      setImportResult(data);

      if (data.ok) {
        setVerification(null);
      }
    } catch {
      setImportResult({
        error: "Unable to import file.",
      });
    } finally {
      setImporting(false);
    }
  }

  const actionableCount =
    verification?.rows?.filter((row) => row.canImport).length ?? 0;

  return (
    <section className="comparison-importer">
      <div>
        <p className="eyebrow">
          Comparison Metric Importer
        </p>

        <h2>
          Verify before import
        </h2>

        <p className="copy">
          Select the Ops Stat Excel file, verify the detected
          center/date and every metric change, then confirm the import.
          Verification does not write anything to HIVE.
        </p>
      </div>

      <div className="upload-row">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setVerification(null);
            setImportResult(null);
          }}
        />

        <button
          type="button"
          onClick={verifyFile}
          disabled={!file || verifying || importing}
        >
          {verifying ? "Verifying…" : "Verify File"}
        </button>
      </div>

      {verification?.blocked ? (
        <div className="result error">
          <strong>Import blocked</strong>
          <span>{verification.reason}</span>
        </div>
      ) : null}

      {verification?.ok && !verification.blocked ? (
        <div className="verification-panel">
          <div className="verify-banner">
            <div>
              <span>You are about to update</span>
              <strong>
                Comparison Metrics for{" "}
                {formatDate(verification.operationalDate)}
              </strong>
            </div>

            <div>
              <span>Center</span>
              <strong>{verification.centerName}</strong>
            </div>
          </div>

          <div className="summary-grid">
            <Summary
              label="Add"
              value={verification.summary?.add ?? 0}
            />
            <Summary
              label="Update"
              value={verification.summary?.update ?? 0}
            />
            <Summary
              label="No Change"
              value={verification.summary?.noChange ?? 0}
            />
            <Summary
              label="Needs Mapping"
              value={verification.summary?.needsMapping ?? 0}
            />
            <Summary
              label="Ignored"
              value={verification.summary?.ignored ?? 0}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Existing HIVE Value</th>
                  <th>Current Source</th>
                  <th>File Value</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {verification.rows?.map((row) => (
                  <tr key={`${row.metricKey}-${row.sourceHeader}`}>
                    <td>
                      <strong>{row.displayName}</strong>
                      <small>{row.sourceHeader}</small>
                    </td>

                    <td>{row.existingDisplay}</td>

                    <td>{row.existingSource ?? "—"}</td>

                    <td>{row.fileDisplay}</td>

                    <td>
                      <span
                        className={`action ${row.action
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {actionLabel(row.action)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="confirm-row">
            <div>
              <strong>
                Verification complete — no data has been written yet.
              </strong>
              <span>
                Confirm only after checking the date, center, and
                metric changes above.
              </span>
            </div>

            <button
              type="button"
              className="confirm-button"
              onClick={confirmImport}
              disabled={importing || actionableCount === 0}
            >
              {importing
                ? "Importing…"
                : `Confirm & Import ${actionableCount} Metric${
                    actionableCount === 1 ? "" : "s"
                  }`}
            </button>
          </div>
        </div>
      ) : null}

      {importResult?.error ? (
        <div className="result error">
          {importResult.error}
        </div>
      ) : null}

      {importResult?.ok ? (
        <div className="result success">
          <strong>Import completed successfully</strong>
          <span>
            Date: {formatDate(importResult.operationalDate)}
          </span>
          <span>
            Imported: {importResult.imported?.length ?? 0}
          </span>
        </div>
      ) : null}

      <style>{`
        .comparison-importer {
          display: grid;
          gap: 14px;
          padding: 18px;
          border: 1px solid #e7d8a7;
          border-radius: 20px;
          background: #fff;
        }

        .eyebrow {
          margin: 0 0 5px;
          color: #9a6b05;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0;
          color: #30250f;
        }

        .copy {
          margin-bottom: 0;
          color: #6b6251;
          line-height: 1.5;
        }

        .upload-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .upload-row input {
          flex: 1 1 280px;
        }

        .upload-row button,
        .confirm-button {
          padding: 10px 14px;
          border: 0;
          border-radius: 10px;
          background: #3f2d09;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }

        button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .verification-panel {
          display: grid;
          gap: 12px;
        }

        .verify-banner {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 14px;
          border-radius: 13px;
          background: #fff7d6;
          color: #6e4d07;
        }

        .verify-banner span,
        .verify-banner strong {
          display: block;
        }

        .verify-banner span {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .verify-banner strong {
          margin-top: 3px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit,minmax(110px,1fr));
          gap: 8px;
        }

        .summary-card {
          padding: 10px;
          border-radius: 10px;
          background: #faf7ed;
        }

        .summary-card span,
        .summary-card strong {
          display: block;
        }

        .summary-card span {
          color: #7a7161;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .summary-card strong {
          margin-top: 2px;
          color: #30250f;
          font-size: 18px;
        }

        .table-wrap {
          overflow: auto;
          border: 1px solid #ece4d3;
          border-radius: 12px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee8dc;
          text-align: left;
          vertical-align: middle;
        }

        th {
          background: #faf7ed;
          color: #6d5b2b;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        td {
          color: #3f382c;
          font-size: 11px;
        }

        td strong,
        td small {
          display: block;
        }

        td small {
          margin-top: 2px;
          color: #8b806b;
        }

        .action {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .action.add {
          background: #dcfce7;
          color: #166534;
        }

        .action.update {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .action.no-change,
        .action.skip-blank {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action.needs-mapping {
          background: #fee2e2;
          color: #991b1b;
        }

        .confirm-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 4px;
        }

        .confirm-row strong,
        .confirm-row span {
          display: block;
        }

        .confirm-row strong {
          color: #30250f;
          font-size: 11px;
        }

        .confirm-row span {
          margin-top: 2px;
          color: #7a7161;
          font-size: 9px;
        }

        .result {
          display: grid;
          gap: 4px;
          padding: 11px 12px;
          border-radius: 11px;
          font-size: 11px;
        }

        .result.success {
          background: #dcfce7;
          color: #166534;
        }

        .result.error {
          background: #fee2e2;
          color: #991b1b;
        }

        @media (max-width:720px) {
          .verify-banner,
          .confirm-row {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </section>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
