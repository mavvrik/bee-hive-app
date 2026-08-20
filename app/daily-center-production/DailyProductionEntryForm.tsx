"use client";

import {
  useMemo,
  useState,
} from "react";

type ExistingEntry = {
  entryDate: string;
  liters: number;
  donors: number;
};

type Props = {
  action:
    (formData: FormData) =>
      void | Promise<void>;

  defaultDate: string;

  existingEntries:
    ExistingEntry[];

  todaysTargetLiters:
    number;

  todaysTargetDonors:
    number;
};

function formatLiters(
  value: number,
) {
  return `${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )} L`;
}

export default function DailyProductionEntryForm({
  action,
  defaultDate,
  existingEntries,
  todaysTargetLiters,
  todaysTargetDonors,
}: Props) {
  const entryMap =
    useMemo(() => {
      return new Map(
        existingEntries.map(
          (entry) => [
            entry.entryDate,
            entry,
          ],
        ),
      );
    }, [
      existingEntries,
    ]);

  const initialEntry =
    entryMap.get(
      defaultDate,
    );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      defaultDate,
    );

  const [
    liters,
    setLiters,
  ] =
    useState(
      initialEntry
        ? String(
            initialEntry.liters,
          )
        : "",
    );

  const [
    donors,
    setDonors,
  ] =
    useState(
      initialEntry
        ? String(
            initialEntry.donors,
          )
        : "",
    );

  function handleDateChange(
    value: string,
  ) {
    setSelectedDate(
      value,
    );

    const existing =
      entryMap.get(
        value,
      );

    /*
     * Existing date:
     * load its authoritative values so they
     * can be corrected.
     *
     * New date:
     * give the user empty fields.
     */

    if (existing) {
      setLiters(
        String(
          existing.liters,
        ),
      );

      setDonors(
        String(
          existing.donors,
        ),
      );

      return;
    }

    setLiters("");
    setDonors("");
  }

  const existingEntry =
    entryMap.get(
      selectedDate,
    );

  return (
    <form
      action={
        action
      }
      style={
        styles.entryForm
      }
    >
      <label
        style={
          styles.field
        }
      >
        <span
          style={
            styles.label
          }
        >
          Production Date
        </span>

        <small
          style={
            styles.helpText
          }
        >
          One authoritative record is stored
          for each operational day.
        </small>

        <input
          name="entryDate"
          type="date"
          value={
            selectedDate
          }
          onChange={
            (
              event,
            ) =>
              handleDateChange(
                event.target.value,
              )
          }
          required
          style={
            styles.input
          }
        />

        {existingEntry ? (
          <small
            style={
              styles.existingNotice
            }
          >
            Existing record loaded.
            Saving will replace this
            date&apos;s current values.
          </small>
        ) : (
          <small
            style={
              styles.newNotice
            }
          >
            New production date.
          </small>
        )}
      </label>

      <label
        style={
          styles.field
        }
      >
        <span
          style={
            styles.label
          }
        >
          Total Liters
        </span>

        <small
          style={
            styles.helpText
          }
        >
          Today&apos;s rolling requirement is{" "}
          {formatLiters(
            todaysTargetLiters,
          )}
          .
        </small>

        <input
          name="liters"
          type="number"
          min="0"
          step="0.1"
          placeholder="0.0"
          value={
            liters
          }
          onChange={
            (
              event,
            ) =>
              setLiters(
                event.target.value,
              )
          }
          required
          style={
            styles.input
          }
        />
      </label>

      <label
        style={
          styles.field
        }
      >
        <span
          style={
            styles.label
          }
        >
          Total Donors
        </span>

        <small
          style={
            styles.helpText
          }
        >
          Current rolling donor target:{" "}
          {todaysTargetDonors}.
        </small>

        <input
          name="donors"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={
            donors
          }
          onChange={
            (
              event,
            ) =>
              setDonors(
                event.target.value,
              )
          }
          required
          style={
            styles.input
          }
        />
      </label>

      <div
        style={
          styles.formActions
        }
      >
        <button
          type="submit"
          style={
            styles.primaryButton
          }
        >
          {existingEntry
            ? "Update Daily Production"
            : "Save Daily Production"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  entryForm: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",

    gap: 18,
  },

  field: {
    display: "grid",
    gap: 7,
  },

  label: {
    color: "#49350b",
    fontSize: 13,
    fontWeight: 900,
  },

  helpText: {
    minHeight: 34,
    color: "#7b6c47",
    fontSize: 12,
    lineHeight: 1.4,
  },

  existingNotice: {
    color: "#805c0b",
    fontSize: 11,
    fontWeight: 800,
  },

  newNotice: {
    color: "#28743a",
    fontSize: 11,
    fontWeight: 800,
  },

  input: {
    width: "100%",

    padding:
      "12px 13px",

    border:
      "1px solid #dbc77f",

    borderRadius: 10,

    background:
      "#fffef9",

    color: "#302204",

    font: "inherit",
    fontWeight: 700,

    boxSizing:
      "border-box" as const,
  },

  formActions: {
    display: "flex",

    alignItems:
      "flex-end",

    justifyContent:
      "flex-end",
  },

  primaryButton: {
    padding:
      "13px 19px",

    border: 0,

    borderRadius: 10,

    background:
      "linear-gradient(135deg,#4c3506,#805b08)",

    color: "#ffffff",

    fontWeight: 900,

    cursor: "pointer",
  },
};