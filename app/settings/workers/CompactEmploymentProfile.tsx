"use client";

import { useMemo, useState } from "react";

import { saveCompactEmploymentProfile } from "./employment-actions";

type EmploymentProfileValue = {
  employmentType: "FTE" | "PTE";
  schedulePattern: "STANDARD_8" | "FOUR_TENS";
  minPaidWeeklyHours: number;
  maxPaidWeeklyHours: number;
  targetPaidWeeklyHours: number;
  scheduledShiftHours: number;
  unpaidLunchMinutes: number;
};

function defaults(
  employmentType: "FTE" | "PTE",
  schedulePattern: "STANDARD_8" | "FOUR_TENS",
): EmploymentProfileValue {
  return {
    employmentType,
    schedulePattern,
    minPaidWeeklyHours:
      employmentType === "FTE" ? 37 : 0,
    maxPaidWeeklyHours:
      employmentType === "FTE" ? 40 : 29,
    targetPaidWeeklyHours:
      employmentType === "FTE" ? 40 : 29,
    scheduledShiftHours:
      schedulePattern === "FOUR_TENS" ? 10 : 8,
    unpaidLunchMinutes: 30,
  };
}

export default function CompactEmploymentProfile({
  collectorId,
  workerName,
  profile,
}: {
  collectorId: number;
  workerName: string;
  profile: EmploymentProfileValue | null;
}) {
  const initialType =
    profile?.employmentType ?? "FTE";

  const initialPattern =
    profile?.schedulePattern ?? "STANDARD_8";

  const [employmentType, setEmploymentType] =
    useState<"FTE" | "PTE">(initialType);

  const [schedulePattern, setSchedulePattern] =
    useState<"STANDARD_8" | "FOUR_TENS">(
      initialPattern,
    );

  const [values, setValues] =
    useState<EmploymentProfileValue>(
      profile ?? defaults(initialType, initialPattern),
    );

  const paidHoursPerShift = useMemo(
    () =>
      Math.max(
        0,
        values.scheduledShiftHours -
          values.unpaidLunchMinutes / 60,
      ),
    [values],
  );

  function applyEmploymentType(
    next: "FTE" | "PTE",
  ) {
    setEmploymentType(next);

    const nextDefaults = defaults(
      next,
      schedulePattern,
    );

    setValues((current) => ({
      ...current,
      employmentType: next,
      minPaidWeeklyHours:
        nextDefaults.minPaidWeeklyHours,
      maxPaidWeeklyHours:
        nextDefaults.maxPaidWeeklyHours,
      targetPaidWeeklyHours:
        nextDefaults.targetPaidWeeklyHours,
    }));
  }

  function applySchedulePattern(
    next: "STANDARD_8" | "FOUR_TENS",
  ) {
    setSchedulePattern(next);

    setValues((current) => ({
      ...current,
      schedulePattern: next,
      scheduledShiftHours:
        next === "FOUR_TENS" ? 10 : 8,
    }));
  }

  return (
    <details className="employment-details">
      <summary>
        <div className="employment-summary-copy">
          <span className="employment-kicker">
            Employment & Scheduling
          </span>

          <strong>
            {profile
              ? `${employmentType} • ${
                  schedulePattern === "FOUR_TENS"
                    ? "4×10"
                    : "Standard 8"
                }`
              : "Profile not configured"}
          </strong>
        </div>

        <div className="employment-summary-badges">
          <span>
            {values.minPaidWeeklyHours}–
            {values.maxPaidWeeklyHours} hrs
          </span>

          <span>
            Lunch {values.unpaidLunchMinutes}m
          </span>

          <span className="expand-label">
            Edit
          </span>
        </div>
      </summary>

      <div className="employment-form">

        <input
          type="hidden"
          name="collectorId"
          value={collectorId}
        />

        <div className="quick-grid">
          <label>
            <span>Employment</span>

            <select
              name="employmentType"
              value={employmentType}
              onChange={(event) =>
                applyEmploymentType(
                  event.target.value as
                    | "FTE"
                    | "PTE",
                )
              }
            >
              <option value="FTE">
                FTE
              </option>
              <option value="PTE">
                PTE
              </option>
            </select>
          </label>

          <label>
            <span>Shift Pattern</span>

            <select
              name="schedulePattern"
              value={schedulePattern}
              onChange={(event) =>
                applySchedulePattern(
                  event.target.value as
                    | "STANDARD_8"
                    | "FOUR_TENS",
                )
              }
            >
              <option value="STANDARD_8">
                Standard 8
              </option>

              <option value="FOUR_TENS">
                4 × 10
              </option>
            </select>
          </label>

          <div className="auto-rule">
            <span>Weekly Rule</span>
            <strong>
              {values.minPaidWeeklyHours}–
              {values.maxPaidWeeklyHours} paid hrs
            </strong>
          </div>

          <div className="auto-rule">
            <span>Lunch</span>
            <strong>
              30 min unpaid default
            </strong>
          </div>
        </div>

        <div className="paid-preview">
          <span>
            {values.scheduledShiftHours} scheduled
          </span>

          <span>−</span>

          <span>
            {values.unpaidLunchMinutes / 60} lunch
          </span>

          <span>=</span>

          <strong>
            {paidHoursPerShift.toFixed(1)} paid hrs/shift
          </strong>
        </div>

        <details className="advanced">
          <summary>
            Advanced overrides
          </summary>

          <p>
            HIVE fills the normal rules automatically.
            Open these only when management needs a
            worker-specific exception.
          </p>

          <div className="advanced-grid">
            <label>
              <span>Minimum Paid</span>
              <input
                name="minPaidWeeklyHours"
                type="number"
                step="0.5"
                min="0"
                value={values.minPaidWeeklyHours}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    minPaidWeeklyHours:
                      Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              <span>Maximum Paid</span>
              <input
                name="maxPaidWeeklyHours"
                type="number"
                step="0.5"
                min="0"
                value={values.maxPaidWeeklyHours}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    maxPaidWeeklyHours:
                      Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              <span>Target Paid</span>
              <input
                name="targetPaidWeeklyHours"
                type="number"
                step="0.5"
                min="0"
                value={values.targetPaidWeeklyHours}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    targetPaidWeeklyHours:
                      Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              <span>Shift Hours</span>
              <input
                name="scheduledShiftHours"
                type="number"
                step="0.5"
                min="1"
                value={values.scheduledShiftHours}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    scheduledShiftHours:
                      Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              <span>Lunch Override</span>
              <input
                name="unpaidLunchMinutes"
                type="number"
                step="5"
                min="0"
                value={values.unpaidLunchMinutes}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    unpaidLunchMinutes:
                      Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>
        </details>

        <button
  type="submit"
  formAction={saveCompactEmploymentProfile}
>
  Save Scheduling Profile
</button>
</div>

      <style>{`
        .employment-details {
          margin-top: 14px;
          border: 1px solid #ead8a3;
          border-radius: 13px;
          background: #fffdf6;
          overflow: hidden;
        }

        .employment-details > summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 11px 13px;
          cursor: pointer;
          list-style: none;
        }

        .employment-details > summary::-webkit-details-marker {
          display: none;
        }

        .employment-summary-copy {
          display: grid;
          gap: 2px;
          min-width: 0;
        }

        .employment-kicker {
          color: #9a6b05;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .employment-summary-copy strong {
          color: #36280c;
          font-size: 13px;
        }

        .employment-summary-badges {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .employment-summary-badges span {
          padding: 4px 7px;
          border-radius: 999px;
          background: #f7eed3;
          color: #6e520e;
          font-size: 9px;
          font-weight: 800;
        }

        .employment-summary-badges .expand-label {
          background: #3f2d09;
          color: white;
        }

        .employment-form {
          padding: 12px 13px 14px;
          border-top: 1px solid #eee2bd;
        }

        .quick-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(145px, 1fr));
          gap: 8px;
        }

        .employment-form label > span,
.auto-rule > span {
  display: block;
  margin-bottom: 4px;
  color: #4b3b1a;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

        .employment-form select,
.employment-form input {
  width: 100%;
  padding: 7px 8px;
  border: 1px solid #cbbd92;
  border-radius: 8px;
  background: #ffffff;
  color: #2f240e;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

        .auto-rule {
          padding: 7px 8px;
          border-radius: 8px;
          background: #faf6e9;
        }

        .auto-rule strong {
  color: #2f240e;
  font-size: 12px;
  font-weight: 800;
}

        .paid-preview {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 9px;
  padding: 8px 10px;
  border-radius: 9px;
  background: #ecfdf5;
  color: #254c31;
  font-size: 11px;
  font-weight: 700;
}

        .paid-preview strong {
          color: #166534;
        }

        .advanced {
          margin-top: 9px;
          border-radius: 9px;
          background: #fafafa;
          padding: 8px 10px;
        }

        .advanced > summary {
          cursor: pointer;
          color: #6c5b2c;
          font-size: 10px;
          font-weight: 850;
        }

        .advanced p {
          margin: 7px 0;
          color: #7a7161;
          font-size: 10px;
          line-height: 1.4;
        }

        .advanced-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(125px, 1fr));
          gap: 7px;
        }

        .employment-form button {
          margin-top: 10px;
          padding: 8px 10px;
          border: 0;
          border-radius: 8px;
          background: #3f2d09;
          color: white;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        @media (max-width: 720px) {
          .employment-details > summary {
            align-items: flex-start;
            flex-direction: column;
          }

          .employment-summary-badges {
            justify-content: flex-start;
          }
        }
      `}</style>
    </details>
  );
}
