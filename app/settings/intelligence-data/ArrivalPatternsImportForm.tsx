"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import {
  parseArrivalPatternsWorkbook,
  type ArrivalPatternsPreview,
} from "@/app/lib/intelligence-data/arrivalPatternsParser";
import { importArrivalPatternsAction } from "./actions";

function totalForPopulated(
  preview: ArrivalPatternsPreview,
  key: "visitTotals" | "unitTotals",
) {
  return preview.populatedWeekdays.reduce(
    (sum, weekday) => sum + preview[key][weekday],
    0,
  );
}

function formatIsoDate(value: string | null) {
  if (!value) return "Not detected";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

type ArrivalPatternsImportState = {
  status: "idle" | "success" | "error";
  message: string;
  importedRows?: number;
  populatedWeekdays?: string[];
  visitTotal?: number;
  unitTotal?: number;
  warningCount?: number;
};

const initialImportState: ArrivalPatternsImportState = {
  status: "idle",
  message: "",
};

export default function ArrivalPatternsImportForm() {
  const [state, formAction, pending] = useActionState(
    importArrivalPatternsAction,
    initialImportState,
  );
  const [preview, setPreview] = useState<ArrivalPatternsPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [centerNumber, setCenterNumber] = useState("115");

  const totals = useMemo(() => {
    if (!preview) return null;

    return {
      visits: totalForPopulated(preview, "visitTotals"),
      units: totalForPopulated(preview, "unitTotals"),
      rows: preview.rows.filter((row) =>
        preview.populatedWeekdays.includes(row.weekday),
      ).length,
    };
  }, [preview]);

  useEffect(() => {
    if (!preview) return;
    if (preview.metadata.periodStart) setPeriodStart(preview.metadata.periodStart);
    if (preview.metadata.periodEnd) setPeriodEnd(preview.metadata.periodEnd);
    if (preview.metadata.centerNumber) setCenterNumber(preview.metadata.centerNumber);
  }, [preview]);

  async function previewWorkbook(file: File | null) {
    setPreview(null);
    setPreviewError("");
    setSelectedFileName(file?.name ?? "");
    setPeriodStart("");
    setPeriodEnd("");

    if (!file) return;

    try {
      setPreviewing(true);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = parseArrivalPatternsWorkbook(bytes);
      setPreview(parsed);
    } catch (error) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : "The workbook could not be previewed.",
      );
    } finally {
      setPreviewing(false);
    }
  }

  const readyToConfirm = Boolean(
    preview && totals && periodStart && periodEnd && centerNumber,
  );

  return (
    <form action={formAction} style={formStyle}>
      <div style={stepHeaderStyle}>
        <span style={stepPillStyle}>STEP 1</span>
        <div>
          <strong style={stepTitleStyle}>Choose & analyze the workbook</strong>
          <div style={helperStyle}>
            HIVE reads the workbook first. No data is saved during preview.
          </div>
        </div>
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Arrival Patterns workbook</span>
        <input
          name="workbook"
          type="file"
          accept=".xlsx,.xls"
          required
          style={inputStyle}
          onChange={(event) =>
            void previewWorkbook(event.target.files?.[0] ?? null)
          }
        />
        <span style={helperStyle}>
          CSL Arrival Patterns for Scheduling (.xlsx or .xls)
        </span>
      </label>

      {previewing ? (
        <div style={noticeStyle}>Analyzing workbook structure and metadata…</div>
      ) : null}

      {previewError ? (
        <div style={errorStyle}>
          <strong>Preview failed:</strong> {previewError}
        </div>
      ) : null}

      {preview && totals ? (
        <>
          <div style={previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>Import Preview</div>
                <strong style={previewTitleStyle}>{selectedFileName}</strong>
              </div>
              <span style={validBadgeStyle}>STRUCTURE VALID</span>
            </div>

            <div style={previewStatsStyle}>
              <PreviewStat label="Sheet" value={preview.sheetName} />
              <PreviewStat label="Interval" value="30 min" />
              <PreviewStat label="Observations" value={totals.rows.toLocaleString()} />
              <PreviewStat label="Visits" value={totals.visits.toLocaleString()} />
              <PreviewStat label="Units" value={totals.units.toLocaleString()} />
            </div>

            <div style={metadataGridStyle}>
              <MetadataStat
                label="Coverage start"
                value={formatIsoDate(preview.metadata.periodStart)}
                detected={preview.metadata.periodDetected}
              />
              <MetadataStat
                label="Coverage end"
                value={formatIsoDate(preview.metadata.periodEnd)}
                detected={preview.metadata.periodDetected}
              />
              <MetadataStat
                label="Center"
                value={preview.metadata.centerNumber ?? "Not detected"}
                detected={preview.metadata.centerDetected}
              />
            </div>

            <div style={weekdayWrapStyle}>
              <span style={weekdayLabelStyle}>Populated weekdays</span>
              <div style={weekdayRowStyle}>
                {preview.populatedWeekdays.map((weekday) => (
                  <span key={weekday} style={weekdayChipStyle}>
                    {weekday}: {preview.visitTotals[weekday].toLocaleString()} visits / {preview.unitTotals[weekday].toLocaleString()} units
                  </span>
                ))}
              </div>
            </div>

            {preview.warnings.length > 0 ? (
              <div style={warningStyle}>
                <strong>Preview notes</strong>
                {preview.warnings.map((warning) => (
                  <div key={warning}>• {warning}</div>
                ))}
              </div>
            ) : (
              <div style={successNoteStyle}>
                ✓ Workbook structure and reported totals validated with no parser warnings.
              </div>
            )}

            <div style={approvalNoteStyle}>
              <strong>Preview only.</strong> Nothing has been written to HIVE yet.
            </div>
          </div>

          <div style={stepHeaderStyle}>
            <span style={stepPillStyle}>STEP 2</span>
            <div>
              <strong style={stepTitleStyle}>Confirm metadata</strong>
              <div style={helperStyle}>
                Automatically detected values are filled for you. If CSL did not embed them, enter the values manually before confirming.
              </div>
            </div>
          </div>

          <div style={fieldGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Center number</span>
              <input
                name="centerNumber"
                type="text"
                value={centerNumber}
                onChange={(event) => setCenterNumber(event.target.value)}
                required
                readOnly={preview.metadata.centerDetected}
                style={{
                  ...inputStyle,
                  background: preview.metadata.centerDetected ? "#f3f4f6" : "#ffffff",
                }}
              />
              <span style={helperStyle}>
                {preview.metadata.centerDetected
                  ? "Detected from the workbook and locked for this import."
                  : "Not found in the workbook; confirm the center manually."}
              </span>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Report period start</span>
              <input
                name="periodStart"
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                required
                readOnly={preview.metadata.periodDetected}
                style={{
                  ...inputStyle,
                  background: preview.metadata.periodDetected ? "#f3f4f6" : "#ffffff",
                }}
              />
              <span style={helperStyle}>
                {preview.metadata.periodDetected
                  ? "Detected from the workbook and locked for this import."
                  : "Not embedded in the workbook; enter the CSL report start date."}
              </span>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Report period end</span>
              <input
                name="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
                required
                readOnly={preview.metadata.periodDetected}
                style={{
                  ...inputStyle,
                  background: preview.metadata.periodDetected ? "#f3f4f6" : "#ffffff",
                }}
              />
              <span style={helperStyle}>
                {preview.metadata.periodDetected
                  ? "Detected from the workbook and locked for this import."
                  : "Not embedded in the workbook; enter the CSL report end date."}
              </span>
            </label>
          </div>

          <div style={stepHeaderStyle}>
            <span style={stepPillStyle}>STEP 3</span>
            <div>
              <strong style={stepTitleStyle}>Confirm import</strong>
              <div style={helperStyle}>
                HIVE will re-read and re-validate the workbook on the server before saving any observations.
              </div>
            </div>
          </div>
        </>
      ) : null}

      {state.status === "error" ? (
        <div style={errorStyle}>
          <strong>Import stopped:</strong> {state.message}
        </div>
      ) : null}

      {state.status === "success" ? (
        <div style={successStyle}>
          <strong>Import complete.</strong> {state.message}
          <div style={resultDetailStyle}>
            {state.populatedWeekdays?.join(", ")} • {state.visitTotal ?? 0} visits • {state.unitTotal ?? 0} units
            {state.warningCount ? ` • ${state.warningCount} warning(s)` : ""}
          </div>
        </div>
      ) : null}

      {preview ? (
        <div style={actionRowStyle}>
          <button
            type="submit"
            disabled={pending || !readyToConfirm}
            style={{
              ...buttonStyle,
              opacity: pending || !readyToConfirm ? 0.55 : 1,
              cursor: pending || !readyToConfirm ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Importing…" : "Confirm & Import to HIVE"}
          </button>

          <span style={helperStyle}>
            Import remains disabled until the workbook has been previewed and all required metadata is present.
          </span>
        </div>
      ) : null}
    </form>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={previewStatStyle}>
      <div style={previewStatLabelStyle}>{label}</div>
      <div style={previewStatValueStyle}>{value}</div>
    </div>
  );
}

function MetadataStat({
  label,
  value,
  detected,
}: {
  label: string;
  value: string;
  detected: boolean;
}) {
  return (
    <div style={metadataStatStyle}>
      <div style={previewStatLabelStyle}>{label}</div>
      <div style={metadataValueRowStyle}>
        <strong>{value}</strong>
        <span style={detected ? detectedBadgeStyle : fallbackBadgeStyle}>
          {detected ? "AUTO" : "CONFIRM"}
        </span>
      </div>
    </div>
  );
}

const formStyle: CSSProperties = { display: "grid", gap: "18px" };
const fieldGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" };
const fieldStyle: CSSProperties = { display: "grid", gap: "7px" };
const labelStyle: CSSProperties = { color: "#111827", fontSize: "13px", fontWeight: 800 };
const helperStyle: CSSProperties = { color: "#6b7280", fontSize: "12px", lineHeight: 1.45 };
const inputStyle: CSSProperties = { width: "100%", minHeight: "42px", border: "1px solid #d1d5db", borderRadius: "10px", padding: "9px 11px", color: "#111827", fontSize: "14px", boxSizing: "border-box" };
const stepHeaderStyle: CSSProperties = { display: "flex", gap: "12px", alignItems: "center", paddingTop: "2px" };
const stepPillStyle: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "64px", borderRadius: "999px", background: "#111827", color: "#ffffff", fontSize: "10px", fontWeight: 900, padding: "6px 9px", letterSpacing: "0.05em" };
const stepTitleStyle: CSSProperties = { color: "#111827", fontSize: "14px" };
const noticeStyle: CSSProperties = { borderRadius: "12px", background: "#f9fafb", padding: "12px 14px", color: "#4b5563", fontSize: "13px" };
const previewPanelStyle: CSSProperties = { border: "1px solid #d6b85a", borderRadius: "16px", padding: "18px", background: "#fffdf5", display: "grid", gap: "15px" };
const previewHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "center" };
const eyebrowStyle: CSSProperties = { color: "#a16207", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" };
const previewTitleStyle: CSSProperties = { color: "#111827", fontSize: "16px" };
const validBadgeStyle: CSSProperties = { display: "inline-flex", padding: "6px 9px", borderRadius: "999px", background: "#dcfce7", color: "#166534", fontSize: "10px", fontWeight: 900 };
const previewStatsStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" };
const previewStatStyle: CSSProperties = { padding: "12px", borderRadius: "12px", background: "#ffffff", border: "1px solid #eee7cc" };
const previewStatLabelStyle: CSSProperties = { color: "#6b7280", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" };
const previewStatValueStyle: CSSProperties = { color: "#111827", fontSize: "18px", fontWeight: 900, marginTop: "4px" };
const metadataGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" };
const metadataStatStyle: CSSProperties = { padding: "12px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e5e7eb" };
const metadataValueRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", flexWrap: "wrap", color: "#111827" };
const detectedBadgeStyle: CSSProperties = { borderRadius: "999px", background: "#dcfce7", color: "#166534", fontSize: "9px", fontWeight: 900, padding: "3px 6px" };
const fallbackBadgeStyle: CSSProperties = { borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontSize: "9px", fontWeight: 900, padding: "3px 6px" };
const weekdayWrapStyle: CSSProperties = { display: "grid", gap: "8px" };
const weekdayLabelStyle: CSSProperties = { color: "#6b7280", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" };
const weekdayRowStyle: CSSProperties = { display: "flex", gap: "8px", flexWrap: "wrap" };
const weekdayChipStyle: CSSProperties = { display: "inline-flex", padding: "6px 9px", borderRadius: "999px", background: "#f3f4f6", color: "#374151", fontSize: "11px", fontWeight: 700 };
const warningStyle: CSSProperties = { display: "grid", gap: "4px", borderRadius: "12px", background: "#fef3c7", color: "#92400e", padding: "12px 14px", fontSize: "12px", lineHeight: 1.5 };
const successNoteStyle: CSSProperties = { borderRadius: "12px", background: "#dcfce7", color: "#166534", padding: "12px 14px", fontSize: "12px", fontWeight: 700 };
const approvalNoteStyle: CSSProperties = { borderTop: "1px solid #eee7cc", paddingTop: "12px", color: "#4b5563", fontSize: "12px" };
const errorStyle: CSSProperties = { borderRadius: "12px", background: "#fee2e2", color: "#991b1b", padding: "12px 14px", fontSize: "13px" };
const successStyle: CSSProperties = { borderRadius: "12px", background: "#dcfce7", color: "#166534", padding: "12px 14px", fontSize: "13px" };
const resultDetailStyle: CSSProperties = { marginTop: "5px", fontSize: "12px" };
const actionRowStyle: CSSProperties = { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" };
const buttonStyle: CSSProperties = { border: 0, borderRadius: "12px", padding: "11px 16px", background: "#111827", color: "#ffffff", fontWeight: 900, fontSize: "13px" };
