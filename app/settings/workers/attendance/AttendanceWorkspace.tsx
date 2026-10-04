"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  previewAttendanceEvent,
} from "./actions";

export type AttendanceWorker = {
  id: number;
  name: string;
  preferredName: string | null;
  profileTitle: string | null;
  dateOfHire: string | null;
};

type AttendanceWorkspaceProps = {
  workers: AttendanceWorker[];
};

export default function AttendanceWorkspace({
  workers,
}: AttendanceWorkspaceProps) {
  const [
    selectedWorkerId,
    setSelectedWorkerId,
  ] = useState<number | null>(null);

  const [
    eventType,
    setEventType,
  ] = useState("");

  const [
    excusedByManagement,
    setExcusedByManagement,
  ] = useState(false);

  const [
    protectedAbsence,
    setProtectedAbsence,
  ] = useState(false);

  const [
    attendanceAssessment,
    previewAction,
    previewPending,
  ] = useActionState(
    async (
      _previousState:
        Awaited<
          ReturnType<
            typeof previewAttendanceEvent
          >
        > | null,
      formData: FormData,
    ) => {
      return previewAttendanceEvent(
        formData,
      );
    },
    null,
  );

  const requiresMinutesMissed =
    eventType === "LATE" ||
    eventType === "LATE_FROM_LUNCH" ||
    eventType === "LEFT_EARLY";

  const selectedWorker =
    workers.find(
      (worker) =>
        worker.id === selectedWorkerId,
    ) ?? null;

  return (
    <>
      <div className="worker-grid">
        {workers.map((worker) => {
          const isSelected =
            worker.id === selectedWorkerId;

          return (
            <button
              key={worker.id}
              type="button"
              className={`worker-card${
                isSelected
                  ? " selected"
                  : ""
              }`}
              onClick={() =>
                setSelectedWorkerId(
                  worker.id,
                )
              }
            >
              <div>
                <strong>
                  {worker.preferredName ||
                    worker.name}
                </strong>

                <span>
                  {worker.profileTitle ||
                    "Title not assigned"}
                </span>
              </div>

              <small>
                {worker.dateOfHire
                  ? `DOH: ${new Date(
                      worker.dateOfHire,
                    ).toLocaleDateString(
                      "en-US",
                      {
                        timeZone: "UTC",
                      },
                    )}`
                  : "Date of hire required"}
              </small>
            </button>
          );
        })}
      </div>

      {selectedWorker ? (
        <div className="selected-worker">
          <div>
            <span>
              Selected Employee
            </span>

            <strong>
              {selectedWorker.name}
            </strong>
          </div>

          <div>
            <span>
              Position
            </span>

            <strong>
              {selectedWorker.profileTitle ||
                "Title Required"}
            </strong>
          </div>

          <div>
            <span>
              Date of Hire
            </span>

            <strong>
              {selectedWorker.dateOfHire
                ? new Date(
                    selectedWorker.dateOfHire,
                  ).toLocaleDateString(
                    "en-US",
                    {
                      timeZone: "UTC",
                    },
                  )
                : "Required"}
            </strong>
          </div>
        </div>
      ) : (
        <div className="selection-message">
          Select a Worker Bee to begin
          attendance review.
        </div>
      )}

      {selectedWorker ? (
        <>
          <form
            action={previewAction}
            className="attendance-form"
          >
            <input
              type="hidden"
              name="collectorId"
              value={selectedWorker.id}
            />

            <h3>
              Record Attendance Event
            </h3>

            <div className="attendance-form-grid">
              <label>
                <span>Event Date</span>

                <input
                  type="date"
                  name="entryDate"
                  required
                />
              </label>

              <label>
                <span>Event Type</span>

                <select
                  name="eventType"
                  value={eventType}
                  onChange={(event) =>
                    setEventType(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Select event
                  </option>

                  <option value="LATE">
                    Late
                  </option>

                  <option value="ABSENT">
                    Absence
                  </option>

                  <option value="LATE_FROM_LUNCH">
                    Late From Lunch
                  </option>

                  <option value="LEFT_EARLY">
                    Left Early
                  </option>

                  <option value="NO_CALL_NO_SHOW">
                    No Call / No Show
                  </option>
                </select>
              </label>

              {requiresMinutesMissed ? (
                <label>
                  <span>
                    Minutes Missed
                  </span>

                  <input
                    type="number"
                    name="minutesMissed"
                    min="0"
                    required
                  />
                </label>
              ) : null}
            </div>

            <div className="attendance-options">
              <label>
                <input
                  type="checkbox"
                  name="protectedAbsence"
                  checked={
                    protectedAbsence
                  }
                  onChange={(event) =>
                    setProtectedAbsence(
                      event.target.checked,
                    )
                  }
                />

                Protected Absence
              </label>

              {protectedAbsence ? (
                <label>
                  <span>
                    Protected Absence
                    Documentation
                  </span>

                  <textarea
                    name="protectedAbsenceReason"
                    required
                    rows={3}
                    placeholder="Document the protected leave or absence basis."
                  />
                </label>
              ) : null}

              <label>
                <input
                  type="checkbox"
                  name="excusedByManagement"
                  checked={
                    excusedByManagement
                  }
                  onChange={(event) =>
                    setExcusedByManagement(
                      event.target.checked,
                    )
                  }
                />

                Excused by Management
              </label>

              {excusedByManagement ? (
                <label>
                  <span>
                    Management Exception
                    Reason
                  </span>

                  <textarea
                    name="exceptionReason"
                    required
                    rows={3}
                    placeholder="Document the circumstances supporting the management exception."
                  />
                </label>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={previewPending}
            >
              {previewPending
                ? "Assessing Attendance..."
                : "Preview Attendance Assessment"}
            </button>
          </form>

          {attendanceAssessment ? (
            <div className="attendance-assessment">
              <div className="assessment-heading">
                <div>
                  <span className="assessment-eyebrow">
                    HIVE Attendance Intelligence
                  </span>

                  <h3>
                    Attendance Policy Assessment
                  </h3>
                </div>

                <span className="review-badge">
                  Manager Review Required
                </span>
              </div>

              <div className="assessment-grid">
                <div>
                  <span>
                    Event Points
                  </span>

                  <strong>
                    {attendanceAssessment
                      .evaluation
                      ?.points ?? 0}
                  </strong>
                </div>

                <div>
                  <span>
                    Active Attendance Points
                  </span>

                  <strong>
                    {attendanceAssessment
                      .evaluation
                      ?.activePoints ?? 0}
                  </strong>
                </div>

                <div>
                  <span>
                    Qualifying Period
                  </span>

                  <strong>
                    {attendanceAssessment
                      .evaluation
                      ?.qualifyingPeriod ===
                    null
                      ? "Unable to Determine"
                      : attendanceAssessment
                            .evaluation
                            ?.qualifyingPeriod
                        ? "Yes"
                        : "No"}
                  </strong>
                </div>

                <div>
                  <span>
                    Recommended Action
                  </span>

                  <strong>
                    {attendanceAssessment
                      .evaluation
                      ?.recommendedAction
                      ?.replaceAll(
                        "_",
                        " ",
                      ) ??
                      "No Corrective Action"}
                  </strong>
                </div>
              </div>

              <div className="assessment-reason">
                <span>
                  Policy Assessment
                </span>

                <p>
                  {attendanceAssessment
                    .evaluation
                    ?.recommendationReason ??
                    (attendanceAssessment
                      .attendancePointsApply
                      ? "No policy recommendation is available."
                      : "Attendance corrective-action points do not apply to this position.")}
                </p>
              </div>

              {attendanceAssessment
                .evaluation
                ?.warnings.length ? (
                <div className="assessment-warning">
                  <strong>
                    Review Required
                  </strong>

                  {attendanceAssessment
                    .evaluation
                    .warnings.map(
                      (warning) => (
                        <p key={warning}>
                          {warning}
                        </p>
                      ),
                    )}
                </div>
              ) : null}

              {attendanceAssessment
                .ncnsScheduleVerification
                .applicable ? (
                <div className="assessment-reason">
                  <span>
                    No Call / No Show
                    Verification
                  </span>

                  <p>
                    {
                      attendanceAssessment
                        .ncnsScheduleVerification
                        .message
                    }
                  </p>
                </div>
              ) : null}

              <p className="assessment-disclaimer">
                This assessment is decision
                support only. No attendance
                event or corrective action has
                been recorded.
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      <style jsx>{`
        .worker-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(210px, 1fr)
            );
          gap: 12px;
          margin-top: 18px;
        }

        .worker-card {
          appearance: none;
          width: 100%;
          border: 1px solid
            rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          background:
            rgba(255, 255, 255, 0.035);
          padding: 16px;
          color: inherit;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition:
            border-color 150ms ease,
            background 150ms ease,
            transform 150ms ease;
        }

        .worker-card:hover {
          border-color:
            rgba(225, 170, 25, 0.55);
          transform:
            translateY(-1px);
        }

        .worker-card.selected {
          border-color: #e1aa19;
          background:
            rgba(225, 170, 25, 0.14);
          box-shadow:
            inset 0 0 0 1px
            rgba(255, 228, 138, 0.12);
        }

        .worker-card > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .worker-card strong {
          color: #fff4c4;
        }

        .worker-card span {
          color:
            rgba(255, 255, 255, 0.62);
          font-size: 0.8rem;
        }

        .worker-card small {
          color:
            rgba(255, 255, 255, 0.66);
          line-height: 1.45;
        }

        .selected-worker {
          margin-top: 18px;
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 12px;
        }

        .selected-worker > div {
          border: 1px solid
            rgba(225, 170, 25, 0.25);
          border-radius: 14px;
          background:
            rgba(63, 48, 11, 0.42);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .selected-worker span {
          color:
            rgba(255, 255, 255, 0.58);
          font-size: 0.76rem;
        }

        .selected-worker strong {
          color: #ffe48a;
        }

        .selection-message {
          margin-top: 18px;
          border: 1px dashed
            rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          padding: 16px;
          color:
            rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        .attendance-form {
          margin-top: 20px;
          border: 1px solid
            rgba(225, 170, 25, 0.28);
          border-radius: 18px;
          background:
            rgba(25, 22, 12, 0.72);
          padding: 20px;
        }

        .attendance-form h3 {
          margin: 0 0 16px;
          color: #ffe48a;
          font-size: 1rem;
        }

        .attendance-form-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 14px;
        }

        .attendance-form-grid label,
        .attendance-options label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color:
            rgba(255, 255, 255, 0.72);
          font-size: 0.8rem;
        }

        .attendance-form input,
        .attendance-form select,
        .attendance-form textarea {
          border: 1px solid
            rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          background: #11130f;
          color: #ffffff;
          padding: 10px 12px;
          font: inherit;
        }

        .attendance-form textarea {
          resize: vertical;
        }

        .attendance-options {
          margin-top: 16px;
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 14px;
        }

        .attendance-options label {
          border: 1px solid
            rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          padding: 12px;
        }

        .attendance-options
        input[type="checkbox"] {
          width: auto;
          align-self: flex-start;
        }

        .attendance-form > button {
          margin-top: 18px;
          border: 1px solid #e1aa19;
          border-radius: 11px;
          background: #e1aa19;
          color: #171208;
          padding: 11px 18px;
          font-weight: 800;
          cursor: pointer;
        }

        .attendance-form
        > button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .attendance-form
        > button:not(:disabled):hover {
          filter: brightness(1.06);
        }

        .attendance-assessment {
          margin-top: 18px;
          border: 1px solid
            rgba(225, 170, 25, 0.38);
          border-radius: 18px;
          background:
            rgba(31, 27, 14, 0.88);
          padding: 20px;
        }

        .assessment-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .assessment-heading h3 {
          margin: 4px 0 0;
          color: #ffe48a;
        }

        .assessment-eyebrow {
          color:
            rgba(255, 255, 255, 0.55);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .review-badge {
          border: 1px solid
            rgba(225, 170, 25, 0.45);
          border-radius: 999px;
          background:
            rgba(225, 170, 25, 0.12);
          color: #ffe48a;
          padding: 7px 10px;
          font-size: 0.72rem;
          white-space: nowrap;
        }

        .assessment-grid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 12px;
        }

        .assessment-grid > div {
          border: 1px solid
            rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          background:
            rgba(255, 255, 255, 0.035);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .assessment-grid span,
        .assessment-reason > span {
          color:
            rgba(255, 255, 255, 0.56);
          font-size: 0.75rem;
        }

        .assessment-grid strong {
          color: #fff4c4;
          text-transform: capitalize;
        }

        .assessment-reason {
          margin-top: 14px;
          border-radius: 12px;
          background:
            rgba(255, 255, 255, 0.035);
          padding: 14px;
        }

        .assessment-reason p {
          margin: 6px 0 0;
          color:
            rgba(255, 255, 255, 0.82);
          line-height: 1.55;
        }

        .assessment-warning {
          margin-top: 14px;
          border: 1px solid
            rgba(225, 170, 25, 0.3);
          border-radius: 12px;
          padding: 14px;
        }

        .assessment-warning strong {
          color: #ffe48a;
        }

        .assessment-warning p {
          margin: 7px 0 0;
          color:
            rgba(255, 255, 255, 0.76);
          line-height: 1.5;
        }

        .assessment-disclaimer {
          margin: 14px 0 0;
          color:
            rgba(255, 255, 255, 0.48);
          font-size: 0.75rem;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .assessment-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }

        @media (max-width: 700px) {
          .selected-worker,
          .attendance-form-grid,
          .attendance-options,
          .assessment-grid {
            grid-template-columns: 1fr;
          }

          .assessment-heading {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}