"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createOperationalDisruption,
  updateOperationalDisruption,
} from "./actions";

type DisruptionRecord = {
  id: number;
  disruptionDate: string;
  startTime: string | null;
  endTime: string | null;
  hoursLost: number;
  type: string;
  impactLevel: string;
  affectedArea: string;
  title: string;
  description: string | null;
  estimatedProceduresLost: number | null;
  estimatedLitersLost: number | null;
  resolved: boolean;
};

type DisruptionFormProps = {
  mode?: "create" | "edit";
  record?: DisruptionRecord;
};

const disruptionTypes = [
  ["SYSTEM_OUTAGE", "System Outage"],
  ["NETWORK_OUTAGE", "Network Outage"],
  ["EQUIPMENT_FAILURE", "Equipment Failure"],
  ["POWER_OUTAGE", "Power Outage"],
  ["WEATHER", "Weather"],
  ["STAFFING", "Staffing"],
  ["DELAYED_OPENING", "Delayed Opening"],
  ["EARLY_CLOSURE", "Early Closure"],
  ["FACILITY", "Facility"],
  ["OTHER", "Other"],
] as const;

function calculateHoursLost(
  startTime: string,
  endTime: string,
) {
  if (!startTime || !endTime) {
    return null;
  }

  const [startHour, startMinute] =
    startTime.split(":").map(Number);

  const [endHour, endMinute] =
    endTime.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return null;
  }

  const startMinutes =
    startHour * 60 + startMinute;

  let endMinutes =
    endHour * 60 + endMinute;

  // Handle a disruption that crosses midnight.
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const durationMinutes =
    endMinutes - startMinutes;

  return Number(
    (durationMinutes / 60).toFixed(2),
  );
}

export default function DisruptionForm({
  mode = "create",
  record,
}: DisruptionFormProps) {
  const isEdit = mode === "edit";

  const [startTime, setStartTime] =
    useState(record?.startTime ?? "");

  const [endTime, setEndTime] =
    useState(record?.endTime ?? "");

  const [hoursLost, setHoursLost] =
    useState(
      record?.hoursLost?.toString() ?? "",
    );

  const calculatedHours = useMemo(
    () =>
      calculateHoursLost(
        startTime,
        endTime,
      ),
    [startTime, endTime],
  );

  useEffect(() => {
    if (calculatedHours !== null) {
      setHoursLost(
        calculatedHours.toFixed(2),
      );
    }
  }, [calculatedHours]);

  const timesAreComplete =
    Boolean(startTime && endTime);

  const action = isEdit
    ? updateOperationalDisruption
    : createOperationalDisruption;

  return (
    <form
      action={action}
      style={formGridStyle}
    >
      {isEdit && record ? (
        <input
          type="hidden"
          name="disruptionId"
          value={record.id}
        />
      ) : null}

      <label style={fieldStyle}>
        <span style={labelStyle}>Date</span>

        <input
          type="date"
          name="disruptionDate"
          defaultValue={
            record?.disruptionDate ?? ""
          }
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Disruption Type
        </span>

        <select
          name="type"
          defaultValue={
            record?.type ??
            "SYSTEM_OUTAGE"
          }
          style={inputStyle}
        >
          {disruptionTypes.map(
            ([value, label]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ),
          )}
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Impact Level
        </span>

        <select
          name="impactLevel"
          defaultValue={
            record?.impactLevel ?? "FULL"
          }
          style={inputStyle}
        >
          <option value="FULL">
            Full Operational Stop
          </option>

          <option value="PARTIAL">
            Partial Operational Impact
          </option>
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Affected Area
        </span>

        <input
          type="text"
          name="affectedArea"
          defaultValue={
            record?.affectedArea ??
            "Entire Center"
          }
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Start Time
        </span>

        <input
          type="time"
          name="startTime"
          value={startTime}
          onChange={(event) =>
            setStartTime(
              event.target.value,
            )
          }
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          End Time
        </span>

        <input
          type="time"
          name="endTime"
          value={endTime}
          onChange={(event) =>
            setEndTime(
              event.target.value,
            )
          }
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Hours Lost
        </span>

        <input
          type="number"
          name="hoursLost"
          min="0"
          step="0.01"
          value={hoursLost}
          onChange={(event) =>
            setHoursLost(
              event.target.value,
            )
          }
          required
          readOnly={timesAreComplete}
          style={{
            ...inputStyle,
            opacity: timesAreComplete
              ? 0.8
              : 1,
          }}
        />

        <span style={helperTextStyle}>
          {timesAreComplete
            ? "Calculated automatically from start and end time."
            : "Enter manually when exact start/end times are unknown."}
        </span>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Estimated Procedures Lost
        </span>

        <input
          type="number"
          name="estimatedProceduresLost"
          min="0"
          step="1"
          defaultValue={
            record?.estimatedProceduresLost ??
            ""
          }
          placeholder="Optional"
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>
          Estimated Liters Lost
        </span>

        <input
          type="number"
          name="estimatedLitersLost"
          min="0"
          step="0.01"
          defaultValue={
            record?.estimatedLitersLost ??
            ""
          }
          placeholder="Optional"
          style={inputStyle}
        />
      </label>

      <label
        style={{
          ...fieldStyle,
          gridColumn: "1 / -1",
        }}
      >
        <span style={labelStyle}>
          Event Title
        </span>

        <input
          type="text"
          name="title"
          defaultValue={
            record?.title ?? ""
          }
          placeholder="Example: Center System Outage"
          required
          style={inputStyle}
        />
      </label>

      <label
        style={{
          ...fieldStyle,
          gridColumn: "1 / -1",
        }}
      >
        <span style={labelStyle}>
          Description
        </span>

        <textarea
          name="description"
          rows={4}
          defaultValue={
            record?.description ?? ""
          }
          placeholder="Describe what happened and how operations were affected."
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          gridColumn: "1 / -1",
          fontWeight: 700,
        }}
      >
        <input
          type="checkbox"
          name="resolved"
          defaultChecked={
            record?.resolved ?? true
          }
        />

        Event is resolved
      </label>

      <div
        style={{
          gridColumn: "1 / -1",
        }}
      >
        <button
          type="submit"
          style={primaryButtonStyle}
        >
          {isEdit
            ? "Save Changes"
            : "Save Disruption Record"}
        </button>
      </div>
    </form>
  );
}

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
} as const;

const fieldStyle = {
  display: "grid",
  gap: "7px",
} as const;

const labelStyle = {
  fontSize: "13px",
  fontWeight: 800,
} as const;

const helperTextStyle = {
  fontSize: "12px",
  lineHeight: 1.4,
  opacity: 0.65,
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: "10px",
  border:
    "1px solid rgba(148, 163, 184, 0.35)",
  background:
    "rgba(15, 23, 42, 0.45)",
  color: "inherit",
  font: "inherit",
} as const;

const primaryButtonStyle = {
  padding: "12px 18px",
  border: 0,
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 900,
  background: "#f4b400",
  color: "#111827",
} as const;