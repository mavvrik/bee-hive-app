"use client";

import { useEffect, useMemo, useState } from "react";

type MetricRow = {
  id: number;
  key: string;
  displayName: string;
  description: string | null;
  unit: string | null;
  decimalPlaces: number;
  source: "CSL" | "HIVE" | "MANUAL";
  dataSourceKey: string | null;
  editable: boolean;
  value: number | null;
};

function localDateText() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function shiftDate(dateText: string, days: number) {
  const date = new Date(`${dateText}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function displayDate(dateText: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateText}T12:00:00.000Z`));
}

export default function DailyComparisonSnapshotEditor() {
  const [selectedDate, setSelectedDate] = useState(localDateText);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSavedMessage(null);

      try {
        const response = await fetch(
          `/api/comparison-metrics/daily?date=${encodeURIComponent(
            selectedDate,
          )}`,
          { cache: "no-store" },
        );

        const data = (await response.json()) as {
          metrics?: MetricRow[];
          error?: string;
        };

        if (!response.ok || !data.metrics) {
          throw new Error(
            data.error ?? "Unable to load daily metrics.",
          );
        }

        if (!cancelled) {
          setMetrics(data.metrics);
          setDirty(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load daily metrics.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const editableMetrics = useMemo(
    () => metrics.filter((metric) => metric.editable),
    [metrics],
  );

  function updateMetric(metricId: number, rawValue: string) {
    setMetrics((current) =>
      current.map((metric) =>
        metric.id === metricId
          ? {
              ...metric,
              value: rawValue === "" ? null : Number(rawValue),
            }
          : metric,
      ),
    );

    setDirty(true);
    setSavedMessage(null);
  }

  async function saveSnapshot() {
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const response = await fetch("/api/comparison-metrics/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          values: editableMetrics.map((metric) => ({
            metricId: metric.id,
            value: metric.value,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to save daily metrics.",
        );
      }

      setDirty(false);
      setSavedMessage(`Saved ${displayDate(selectedDate)}.`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save daily metrics.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="daily-snapshot-editor">
      <div className="snapshot-top">
        <div>
          <p className="snapshot-eyebrow">
            Daily Comparison Snapshot
          </p>

          <h2>{displayDate(selectedDate)}</h2>

          <p>
            One date controls every comparison value below.
            Changing the date reloads whatever was previously
            saved for that day.
          </p>
        </div>

        <div className={`save-state ${dirty ? "unsaved" : "saved"}`}>
          <span>Status</span>
          <strong>
            {loading
              ? "Loading"
              : saving
                ? "Saving"
                : dirty
                  ? "Unsaved Changes"
                  : "Saved"}
          </strong>
        </div>
      </div>

      <div className="date-toolbar">
        <button
          type="button"
          onClick={() =>
            setSelectedDate(shiftDate(selectedDate, -1))
          }
        >
          ← Previous Day
        </button>

        <label>
          <span>Selected Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
          />
        </label>

        <button
          type="button"
          onClick={() =>
            setSelectedDate(shiftDate(selectedDate, 1))
          }
        >
          Next Day →
        </button>
      </div>

      {error ? (
        <div className="message error">{error}</div>
      ) : null}

      {savedMessage ? (
        <div className="message success">{savedMessage}</div>
      ) : null}

      {loading ? (
        <div className="loading-card">
          Loading saved values for {displayDate(selectedDate)}…
        </div>
      ) : (
        <>
          <div className="metric-grid">
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className={`metric-entry ${
                  metric.editable ? "" : "automatic"
                }`}
              >
                <div className="metric-heading">
                  <div>
                    <span className="metric-source">
                      {metric.editable
                        ? `${metric.source} entry`
                        : "HIVE automatic"}
                    </span>
                    <strong>{metric.displayName}</strong>
                  </div>

                  {metric.unit ? (
                    <span className="unit">{metric.unit}</span>
                  ) : null}
                </div>

                {metric.description ? (
                  <p>{metric.description}</p>
                ) : null}

                {metric.editable ? (
                  <input
                    type="number"
                    step={
                      metric.decimalPlaces <= 0
                        ? "1"
                        : String(1 / 10 ** metric.decimalPlaces)
                    }
                    value={metric.value ?? ""}
                    onChange={(event) =>
                      updateMetric(metric.id, event.target.value)
                    }
                    placeholder="No value saved"
                  />
                ) : (
                  <div className="automatic-value">
                    {metric.value === null
                      ? "No HIVE value for this date"
                      : metric.value.toLocaleString("en-US", {
                          minimumFractionDigits: Math.max(
                            0,
                            Math.min(20, metric.decimalPlaces),
                          ),
                          maximumFractionDigits: Math.max(
                            0,
                            Math.min(20, metric.decimalPlaces),
                          ),
                        })}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="save-row">
            <div>
              <strong>
                {editableMetrics.length} editable comparison metric
                {editableMetrics.length === 1 ? "" : "s"}
              </strong>
              <span>
                Blank fields clear the saved value for this date.
              </span>
            </div>

            <button
              type="button"
              className="save-button"
              onClick={saveSnapshot}
              disabled={saving || loading || !dirty}
            >
              {saving ? "Saving…" : "Save Daily Metrics"}
            </button>
          </div>
        </>
      )}

      <style>{`
        .daily-snapshot-editor {
          display: grid;
          gap: 14px;
          margin-bottom: 22px;
          padding: 20px;
          border: 1px solid #e7d8a7;
          border-radius: 20px;
          background: linear-gradient(135deg,#fffdf6,#fffaf0);
        }
        .snapshot-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
        }
        .snapshot-eyebrow {
          margin: 0 0 5px;
          color: #9a6b05;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .snapshot-top h2 {
          margin: 0;
          color: #30250f;
        }
        .snapshot-top p:last-child {
          max-width: 720px;
          margin-bottom: 0;
          color: #6b6251;
          line-height: 1.5;
        }
        .save-state {
          min-width: 150px;
          padding: 11px 13px;
          border-radius: 12px;
        }
        .save-state.saved {
          background: #dcfce7;
          color: #166534;
        }
        .save-state.unsaved {
          background: #fff4cf;
          color: #805c0b;
        }
        .save-state span,
        .save-state strong {
          display: block;
        }
        .save-state span {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .date-toolbar {
          display: grid;
          grid-template-columns: auto minmax(220px,1fr) auto;
          gap: 10px;
          align-items: end;
        }
        .date-toolbar label span {
          display: block;
          margin-bottom: 4px;
          color: #6d5b2b;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .date-toolbar input,
        .date-toolbar button {
          min-height: 40px;
          border: 1px solid #d9c89c;
          border-radius: 10px;
          background: #fff;
          color: #3f2d09;
          font: inherit;
          font-weight: 800;
        }
        .date-toolbar input {
          width: 100%;
          padding: 8px 10px;
        }
        .date-toolbar button {
          padding: 8px 12px;
          cursor: pointer;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap: 10px;
        }
        .metric-entry {
          padding: 13px;
          border: 1px solid #e7dfc8;
          border-radius: 13px;
          background: #fff;
        }
        .metric-entry.automatic {
          background: #f8fafc;
        }
        .metric-heading {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .metric-heading strong,
        .metric-source {
          display: block;
        }
        .metric-source {
          margin-bottom: 3px;
          color: #8b650f;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .metric-heading strong {
          color: #30250f;
          font-size: 13px;
        }
        .unit {
          padding: 3px 6px;
          border-radius: 999px;
          background: #f5edda;
          color: #6b5110;
          font-size: 9px;
          font-weight: 900;
        }
        .metric-entry p {
          min-height: 30px;
          margin: 6px 0 9px;
          color: #777063;
          font-size: 10px;
          line-height: 1.4;
        }
        .metric-entry input {
          width: 100%;
          padding: 9px 10px;
          border: 1px solid #d7c89f;
          border-radius: 9px;
          background: #fff;
          color: #261d0a;
          font: inherit;
          font-weight: 800;
        }
        .automatic-value {
          padding: 9px 10px;
          border-radius: 9px;
          background: #eef2f7;
          color: #475569;
          font-size: 12px;
          font-weight: 850;
        }
        .save-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 4px;
        }
        .save-row strong,
        .save-row span {
          display: block;
        }
        .save-row strong {
          color: #30250f;
          font-size: 11px;
        }
        .save-row span {
          margin-top: 2px;
          color: #7a7161;
          font-size: 9px;
        }
        .save-button {
          padding: 10px 14px;
          border: 0;
          border-radius: 10px;
          background: #3f2d09;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }
        .save-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }
        .message,
        .loading-card {
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
        }
        .message.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .message.success {
          background: #dcfce7;
          color: #166534;
        }
        .loading-card {
          background: #f8fafc;
          color: #64748b;
        }
        @media (max-width:720px) {
          .snapshot-top,
          .save-row {
            flex-direction: column;
            align-items: stretch;
          }
          .save-state {
            min-width: 0;
          }
          .date-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
