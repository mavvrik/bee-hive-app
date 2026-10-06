"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  previewAttendanceEvent,
  saveAttendanceEvent,
  saveCorrectiveAction,
  voidCorrectiveAction,
} from "./actions";

export type AttendanceWorker = {
  id: number;
  name: string;
  preferredName: string | null;
  profileTitle: string | null;
  dateOfHire: string | null;
};

export type AttendanceRecord = {
  id: number;
  collectorId: number;
  entryDate: string;
  eventType: string;
  minutesMissed: number | null;
  policyPoints: number | null;
  protectedAbsence: boolean;
  excusedByManagement: boolean;
  exceptionReason: string | null;
  note: string | null;
  recordedBy: string | null;
  occurrenceGroupKey: string | null;
  policyVersion: string | null;
  createdAt: string;
};

export type CorrectiveActionRecord = {
  id: number;
  collectorId: number;

  actionLevel:
    | "VERBAL_COACHING"
    | "WRITTEN_COACHING"
    | "WRITTEN_WARNING"
    | "FINAL_WRITTEN_WARNING"
    | "TERMINATION";

  status:
    | "RECOMMENDED"
    | "ISSUED"
    | "VOIDED";

  effectiveDate: string;
  expiresAt: string | null;

  activePointsAtAction:
    number | null;

  qualifyingPeriod: boolean;

  recommendationReason:
    string | null;

  managerNote:
    string | null;

  issuedBy:
    string | null;

  issuedAt:
    string | null;

  voidedAt:
    string | null;

  policyVersion:
    string | null;

  createdAt: string;
};

type AttendanceWorkspaceProps = {
  workers: AttendanceWorker[];
  attendanceEntries: AttendanceRecord[];
  correctiveActions: CorrectiveActionRecord[];
};

type PreviewSnapshot = {
  collectorId: string;
  entryDate: string;
  eventType: string;
  minutesMissed: string;
  recordedBy: string;
  note: string;
  protectedAbsence: boolean;
  protectedAbsenceReason: string;
  excusedByManagement: boolean;
  exceptionReason: string;
};

function formatEventType(
  eventType: string,
) {
  return eventType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatCorrectiveActionLevel(
  level: string,
) {
  return level
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleDateString(
    "en-US",
    {
      timeZone: "UTC",
    },
  );
}

export default function AttendanceWorkspace({
  workers,
  attendanceEntries,
  correctiveActions,
}: AttendanceWorkspaceProps) {
  const router =
    useRouter();

  const [
    selectedWorkerId,
    setSelectedWorkerId,
  ] = useState<number | null>(
    null,
  );

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
    previewSnapshot,
    setPreviewSnapshot,
  ] = useState<PreviewSnapshot | null>(
    null,
  );

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
      const result =
        await previewAttendanceEvent(
          formData,
        );

      setPreviewSnapshot({
        collectorId:
          String(
            formData.get(
              "collectorId",
            ) ?? "",
          ),

        entryDate:
          String(
            formData.get(
              "entryDate",
            ) ?? "",
          ),

        eventType:
          String(
            formData.get(
              "eventType",
            ) ?? "",
          ),

               minutesMissed:
          String(
            formData.get(
              "minutesMissed",
            ) ?? "",
          ),

        recordedBy:
          String(
            formData.get(
              "recordedBy",
            ) ?? "",
          ).toUpperCase(),

                  note:
          String(
            formData.get(
              "note",
            ) ?? "",
          ),


        protectedAbsence:
          formData.get(
            "protectedAbsence",
          ) === "on",

        protectedAbsenceReason:
          String(
            formData.get(
              "protectedAbsenceReason",
            ) ?? "",
          ),

        excusedByManagement:
          formData.get(
            "excusedByManagement",
          ) === "on",

        exceptionReason:
          String(
            formData.get(
              "exceptionReason",
            ) ?? "",
          ),
      });

      return result;
    },
    null,
  );

  const [
    saveResult,
    confirmAction,
    confirmPending,
  ] = useActionState(
    async (
      _previousState:
        Awaited<
          ReturnType<
            typeof saveAttendanceEvent
          >
        > | null,
      formData: FormData,
    ) => {
      const result =
  await saveAttendanceEvent(
    formData,
  );

if (result.success) {
  setPreviewSnapshot(
    null,
  );

  setEventType("");

  setProtectedAbsence(
    false,
  );

  setExcusedByManagement(
    false,
  );
}

router.refresh();

return result;
    },
    null,
  );

  const [
  correctiveActionResult,
  correctiveActionSave,
  correctiveActionPending,
] = useActionState(
  async (
    _previousState:
      Awaited<
        ReturnType<
          typeof saveCorrectiveAction
        >
      > | null,
    formData: FormData,
  ) => {
    const result =
      await saveCorrectiveAction(
        formData,
      );

    router.refresh();

    return result;
  },
  null,
);

    const [
    voidCorrectiveActionResult,
    voidCorrectiveActionSave,
    voidCorrectiveActionPending,
  ] = useActionState(
    async (
      _previousState:
        Awaited<
          ReturnType<
            typeof voidCorrectiveAction
          >
        > | null,
      formData: FormData,
    ) => {
      const result =
        await voidCorrectiveAction(
          formData,
        );

      router.refresh();

      return result;
    },
    null,
  );

  const requiresMinutesMissed =
    eventType === "LATE" ||
    eventType ===
      "LATE_FROM_LUNCH" ||
    eventType ===
      "LEFT_EARLY";

  const selectedWorker =
    workers.find(
      (worker) =>
        worker.id ===
        selectedWorkerId,
    ) ?? null;

  const selectedAttendanceEntries =
    selectedWorkerId === null
      ? []
      : attendanceEntries
          .filter(
            (entry) =>
              entry.collectorId ===
              selectedWorkerId,
          )
          .sort(
            (a, b) =>
              new Date(
                b.entryDate,
              ).getTime() -
              new Date(
                a.entryDate,
              ).getTime(),
          );

  const selectedCorrectiveActions =
  selectedWorkerId === null
    ? []
    : correctiveActions
        .filter(
          (action) =>
            action.collectorId ===
              selectedWorkerId &&
            action.status ===
              "ISSUED",
        )
        .sort(
          (a, b) =>
            new Date(
              b.effectiveDate,
            ).getTime() -
              new Date(
                a.effectiveDate,
              ).getTime() ||
            b.id - a.id,
        );

const currentCorrectiveAction =
  selectedCorrectiveActions.find(
    (action) => {
      const today =
        new Date();

      const todayUtc =
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        );

      const effectiveDate =
        new Date(
          action.effectiveDate,
        ).getTime();

      const expiresAt =
        action.expiresAt
          ? new Date(
              action.expiresAt,
            ).getTime()
          : null;

      return (
        effectiveDate <= todayUtc &&
        (
          expiresAt === null ||
          expiresAt >= todayUtc
        )
      );
    },
  ) ?? null;

  const activePoints =
  selectedAttendanceEntries.reduce(
    (total, entry) =>
      total +
      (entry.policyPoints ?? 0),
    0,
  );

  function selectWorker(
    workerId: number,
  ) {
    setSelectedWorkerId(
      workerId,
    );

    setPreviewSnapshot(
      null,
    );

    setEventType("");

    setProtectedAbsence(
      false,
    );

    setExcusedByManagement(
      false,
    );
  }

  function invalidatePreview() {
    if (previewSnapshot) {
      setPreviewSnapshot(
        null,
      );
    }
  }

  return (
    <>
      <div className="worker-grid">
        {workers.map(
          (worker) => {
            const isSelected =
              worker.id ===
              selectedWorkerId;

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
                  selectWorker(
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
                    ? `DOH: ${formatDate(
                        worker.dateOfHire,
                      )}`
                    : "Date of hire required"}
                </small>
              </button>
            );
          },
        )}
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
                ? formatDate(
                    selectedWorker.dateOfHire,
                  )
                : "Required"}
            </strong>
          </div>
        </div>
      ) : (
        <div className="selection-message">
          Select a Worker Bee to
          begin attendance review.
        </div>
      )}

      {selectedWorker ? (
  <>
    <section className="corrective-action-panel">
      <div className="corrective-action-heading">
        <div>
          <span className="assessment-eyebrow">
            Attendance Management
          </span>

          <h3>
            Current Corrective Action
          </h3>

          <p>
            Current issued attendance
            corrective action for{" "}
            <strong>
              {selectedWorker.name}
            </strong>
            .
          </p>
        </div>

        <div
          className={`ca-status-badge${
            currentCorrectiveAction
              ? " active"
              : ""
          }`}
        >
          {currentCorrectiveAction
            ? "Active"
            : "None"}
        </div>
      </div>

      <div className="corrective-action-summary">
        <div>
          <span>
            Current Level
          </span>

          <strong>
            {currentCorrectiveAction
              ? formatCorrectiveActionLevel(
                  currentCorrectiveAction.actionLevel,
                )
              : "None"}
          </strong>
        </div>

        <div>
          <span>
            Effective Date
          </span>

          <strong>
            {currentCorrectiveAction
              ? formatDate(
                  currentCorrectiveAction.effectiveDate,
                )
              : "—"}
          </strong>
        </div>

        <div>
          <span>
            Active Through
          </span>

          <strong>
            {currentCorrectiveAction
              ?.expiresAt
              ? formatDate(
                  currentCorrectiveAction.expiresAt,
                )
              : "—"}
          </strong>
        </div>

        <div>
          <span>
            Points at Issuance
          </span>

          <strong>
            {currentCorrectiveAction
              ?.activePointsAtAction ??
              "—"}
          </strong>
        </div>
      </div>

      {currentCorrectiveAction ? (
        <div className="current-ca-detail">
          <span>
            Issued By
          </span>

          <strong>
            {currentCorrectiveAction
              .issuedBy || "—"}
          </strong>

          {currentCorrectiveAction
            .managerNote ? (
            <p>
              {
                currentCorrectiveAction
                  .managerNote
              }
            </p>
          ) : null}
        </div>
      ) : null}

              {currentCorrectiveAction ? (
        <form
          action={voidCorrectiveActionSave}
          className="corrective-action-form"
          onSubmit={(event) => {
            const confirmed =
              window.confirm(
                "Are you sure you want to void this corrective action? The action will remain in the audit history as VOIDED.",
              );

            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          <input
            type="hidden"
            name="correctiveActionId"
            value={
              currentCorrectiveAction.id
            }
          />

          <input
            type="hidden"
            name="confirmVoid"
            value="YES"
          />

          <div className="ca-form-heading">
            <strong>
              Void Incorrect CA
            </strong>

            <span>
              Use this only when the current
              corrective action was entered or
              applied incorrectly. HIVE will
              preserve the record in the audit
              history as VOIDED.
            </span>
          </div>

          <div className="corrective-action-form-grid">
            <label>
              <span>
                Manager Initials
              </span>

              <input
                type="text"
                name="voidedBy"
                required
                minLength={2}
                maxLength={4}
                placeholder="MS"
                autoComplete="off"
                style={{
                  textTransform:
                    "uppercase",
                }}
              />
            </label>

            <label className="ca-note-field">
              <span>
                Reason for Void
              </span>

              <textarea
                name="voidReason"
                rows={3}
                required
                maxLength={500}
                placeholder="Example: Entered in error."
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={
              voidCorrectiveActionPending
            }
          >
            {voidCorrectiveActionPending
              ? "Voiding Corrective Action..."
              : "Void Corrective Action"}
          </button>
        </form>
      ) : null}

      {voidCorrectiveActionResult?.success ? (
        <div className="save-success">
          <strong>
            Corrective Action Voided
          </strong>

          <span>
            {
              voidCorrectiveActionResult.message
            }
          </span>
        </div>
      ) : null}

            <div className="corrective-action-form">
        <div className="ca-form-heading">
          <strong>
            Attendance Corrective Action
          </strong>

          <span>
            Establish an existing action
            already in effect, or allow HIVE
            to determine whether a new action
            is currently due.
          </span>
        </div>

        <form
          action={correctiveActionSave}
        >
          <input
            type="hidden"
            name="collectorId"
            value={selectedWorker.id}
          />

          <input
            type="hidden"
            name="correctiveActionMode"
            value="EXISTING"
          />

          <div className="ca-form-heading">
            <strong>
              Establish Existing CA
            </strong>

            <span>
              Use this only to establish a
              corrective action the employee
              is already on. HIVE will preserve
              it as part of the employee&apos;s
              attendance history.
            </span>
          </div>

          <div className="corrective-action-form-grid">
            <label>
              <span>
                Existing CA Level
              </span>

              <select
                name="actionLevel"
                required
                defaultValue=""
              >
                <option value="">
                  Select existing level
                </option>

                <option value="VERBAL_COACHING">
                  Verbal Coaching
                </option>

                <option value="WRITTEN_COACHING">
                  Written Coaching
                </option>

                <option value="WRITTEN_WARNING">
                  Written Warning
                </option>

                <option value="FINAL_WRITTEN_WARNING">
                  Final Written Warning
                </option>

                <option value="TERMINATION">
                  Termination
                </option>
              </select>
            </label>

            <label>
              <span>
                Effective Date / CA Began
              </span>

              <input
                type="date"
                name="effectiveDate"
                required
              />
            </label>

            <label>
              <span>
                Manager Initials
              </span>

              <input
                type="text"
                name="issuedBy"
                required
                minLength={2}
                maxLength={4}
                placeholder="MS"
                autoComplete="off"
                style={{
                  textTransform:
                    "uppercase",
                }}
              />
            </label>

            <label className="ca-note-field">
              <span>
                Manager Note (Optional)
              </span>

              <textarea
                name="managerNote"
                rows={3}
                maxLength={500}
                placeholder="Example: Existing CA established in HIVE from prior attendance record."
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={
              correctiveActionPending
            }
          >
            {correctiveActionPending
              ? "Establishing Existing CA..."
              : "Establish Existing CA"}
          </button>
        </form>

        <form
          action={correctiveActionSave}
        >
          <input
            type="hidden"
            name="collectorId"
            value={selectedWorker.id}
          />

          <input
            type="hidden"
            name="correctiveActionMode"
            value="NEW"
          />

          <input
            type="hidden"
            name="actionLevel"
            value="VERBAL_COACHING"
          />

          <div className="ca-form-heading">
            <strong>
              Issue New CA
            </strong>

            <span>
              HIVE determines the corrective
              action level from the attendance
              policy, current points, NCNS
              rules, and active corrective-action
              history. The level cannot be
              manually selected.
            </span>
          </div>

          {!selectedWorker.dateOfHire ? (
            <div className="ca-warning">
              Date of hire is required before
              HIVE can determine whether a new
              attendance corrective action is
              due.
            </div>
          ) : null}

          <div className="corrective-action-form-grid">
            <label>
              <span>
                Effective Date
              </span>

              <input
                type="date"
                name="effectiveDate"
                required
                disabled={
                  !selectedWorker.dateOfHire
                }
              />
            </label>

            <label>
              <span>
                Manager Initials
              </span>

              <input
                type="text"
                name="issuedBy"
                required
                minLength={2}
                maxLength={4}
                placeholder="MS"
                autoComplete="off"
                disabled={
                  !selectedWorker.dateOfHire
                }
                style={{
                  textTransform:
                    "uppercase",
                }}
              />
            </label>

            <label className="ca-note-field">
              <span>
                Manager Note (Optional)
              </span>

              <textarea
                name="managerNote"
                rows={3}
                maxLength={500}
                placeholder="Add relevant corrective-action details."
                disabled={
                  !selectedWorker.dateOfHire
                }
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={
              correctiveActionPending ||
              !selectedWorker.dateOfHire
            }
          >
            {correctiveActionPending
              ? "Checking Attendance Policy..."
              : "Issue HIVE-Determined CA"}
          </button>
        </form>
      </div>

      {correctiveActionResult?.success ? (
        <div className="save-success">
          <strong>
            Corrective Action Recorded
          </strong>

          <span>
            {
              correctiveActionResult.message
            }
          </span>

          <small>
            {formatCorrectiveActionLevel(
              correctiveActionResult.actionLevel,
            )}{" "}
            • Effective{" "}
            {formatDate(
              correctiveActionResult.effectiveDate,
            )}{" "}
            • Active through{" "}
            {correctiveActionResult.expiresAt
              ? formatDate(
                  correctiveActionResult.expiresAt,
                )
              : "—"}
          </small>
        </div>
      ) : null}
    </section>

    <form
      action={previewAction}
      className="attendance-form"
            onChange={
              invalidatePreview
            }
          >
            <input
              type="hidden"
              name="collectorId"
              value={
                selectedWorker.id
              }
            />

            <h3>
              Record Attendance Event
            </h3>

            <div className="attendance-form-grid">
              <label>
                <span>
                  Event Date
                </span>

                <input
                  type="date"
                  name="entryDate"
                  required
                />
              </label>

              <label>
                <span>
                  Event Type
                </span>

                <select
                  name="eventType"
                  value={eventType}
                  onChange={(
                    event,
                  ) =>
                    setEventType(
                      event.target
                        .value,
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

              <label>
                <span>
                  Recorder Initials
                </span>

                <input
                  type="text"
                  name="recordedBy"
                  required
                  maxLength={4}
                  placeholder="MS"
                  autoComplete="off"
                  style={{
                    textTransform:
                      "uppercase",
                  }}
                />
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
                            <label>
                <span>
                  Details / Comments
                  (Optional)
                </span>

                <textarea
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder="Add relevant attendance details or comments."
                />
              </label>
            </div>

            <div className="attendance-options">
              <label>
                <input
                  type="checkbox"
                  name="protectedAbsence"
                  checked={
                    protectedAbsence
                  }
                  disabled={
                    excusedByManagement
                  }
                  onChange={(
                    event,
                  ) =>
                    setProtectedAbsence(
                      event.target
                        .checked,
                    )
                  }
                />

                Protected Absence
              </label>

              {protectedAbsence ? (
                <label>
                  <span>
                    Protected Status
                    Basis / Reference
                  </span>

                  <textarea
                    name="protectedAbsenceReason"
                    required
                    rows={3}
                    placeholder="Document the protected status basis or reference. Do not enter diagnosis or medical details."
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
                  disabled={
                    protectedAbsence
                  }
                  onChange={(
                    event,
                  ) =>
                    setExcusedByManagement(
                      event.target
                        .checked,
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
              disabled={
                previewPending
              }
            >
              {previewPending
                ? "Assessing Attendance..."
                : "Preview Attendance Assessment"}
            </button>
          </form>

          {attendanceAssessment &&
          previewSnapshot ? (
            <div className="attendance-assessment">
              <div className="assessment-heading">
                <div>
                  <span className="assessment-eyebrow">
                    HIVE Attendance
                    Intelligence
                  </span>

                  <h3>
                    Attendance Policy
                    Assessment
                  </h3>
                </div>

                <span className="review-badge">
                  Manager Review
                  Required
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
                    Active Attendance
                    Points
                  </span>

                  <strong>
                    {attendanceAssessment
                      .evaluation
                      ?.activePoints ??
                      0}
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
                        <p
                          key={
                            warning
                          }
                        >
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

              {attendanceAssessment.existingEntry ? (
  <div className="assessment-reason">
    <span>
      Existing Attendance Event
    </span>

    <p>
      This worker already has a{" "}
      <strong>
        {formatEventType(
          attendanceAssessment
            .existingEntry
            .eventType,
        )}
      </strong>{" "}
      event recorded for this
      date.
    </p>

    <p>
      Existing record:{" "}
      <strong>
        {attendanceAssessment
          .existingEntry
          .minutesMissed ?? 0}{" "}
        minute
        {attendanceAssessment
          .existingEntry
          .minutesMissed === 1
          ? ""
          : "s"}
      </strong>{" "}
      and{" "}
      <strong>
        {attendanceAssessment
          .existingEntry
          .policyPoints ?? 0}{" "}
        point
        {attendanceAssessment
          .existingEntry
          .policyPoints === 1
          ? ""
          : "s"}
      </strong>
      .
    </p>

    <p>
      Confirming below will
      replace the existing record.
      It will not create a second{" "}
      {formatEventType(
        attendanceAssessment
          .existingEntry
          .eventType,
      )}{" "}
      event for this date.
    </p>
  </div>
) : null}

              <div className="confirmation-panel">
                <div>
                  <strong>
                    Manager Confirmation
                  </strong>

                  <p>
                    {attendanceAssessment
                    .existingEntry
                    ? "Confirming will replace the existing attendance event with this newly assessed record."
                    : "Confirming will record this exact assessed attendance event in HIVE."}
                  </p>
                </div>

                <form
                  action={
                    confirmAction
                  }
                >
                  <input
                    type="hidden"
                    name="collectorId"
                    value={
                      previewSnapshot
                        .collectorId
                    }
                  />

                  <input
                    type="hidden"
                    name="entryDate"
                    value={
                      previewSnapshot
                        .entryDate
                    }
                  />

                  <input
                    type="hidden"
                    name="eventType"
                    value={
                      previewSnapshot
                        .eventType
                    }
                  />

                  <input
                    type="hidden"
                    name="minutesMissed"
                    value={
                      previewSnapshot
                        .minutesMissed
                    }
                  />

                  <input
                    type="hidden"
                    name="recordedBy"
                    value={
                      previewSnapshot
                        .recordedBy
                    }
                  />

                                    <input
                    type="hidden"
                    name="note"
                    value={
                      previewSnapshot
                        .note
                    }
                  />


                  {previewSnapshot
                    .protectedAbsence ? (
                    <input
                      type="hidden"
                      name="protectedAbsence"
                      value="on"
                    />
                  ) : null}

                  <input
                    type="hidden"
                    name="protectedAbsenceReason"
                    value={
                      previewSnapshot
                        .protectedAbsenceReason
                    }
                  />

                  {previewSnapshot
                    .excusedByManagement ? (
                    <input
                      type="hidden"
                      name="excusedByManagement"
                      value="on"
                    />
                  ) : null}

                  <input
  type="hidden"
  name="exceptionReason"
  value={
    previewSnapshot
      .exceptionReason
  }
/>

{attendanceAssessment
  .existingEntry ? (
  <input
    type="hidden"
    name="replaceExisting"
    value="on"
  />
) : null}

<button
  type="submit"
  disabled={
    confirmPending
  }
>
             {confirmPending
                ? attendanceAssessment
                .existingEntry
                ? "Replacing Attendance..."
                : "Recording Attendance..."
                : attendanceAssessment
                .existingEntry
                ? "Confirm & Replace Attendance Event"
                : "Confirm & Record Attendance Event"}
                  </button>
                </form>
              </div>

              <p className="assessment-disclaimer">
                HIVE recalculates the
                policy assessment on the
                server before the event is
                recorded. Corrective action
                remains subject to manager
                review.
              </p>
            </div>
          ) : null}

          {saveResult?.success ? (
            <div className="save-success">
              <strong>
                Attendance Recorded
              </strong>

              <span>
                {saveResult.message}
              </span>

              <small>
                Event #
                {
                  saveResult.attendanceEntryId
                }{" "}
                •{" "}
                {
                  saveResult.policyPoints
                }{" "}
                point
                {saveResult.policyPoints ===
                1
                  ? ""
                  : "s"}
              </small>
            </div>
          ) : null}

          <section className="attendance-record">
            <div className="record-heading">
              <div>
                <span className="assessment-eyebrow">
                  Employee Record
                </span>

                <h3>
                  Attendance Record
                </h3>

                <p>
                  Recorded attendance
                  history for{" "}
                  <strong>
                    {selectedWorker.name}
                  </strong>
                  .
                </p>
              </div>

              <div className="record-summary">
                <span>
                  Recorded Events
                </span>

                <strong>
                  {
                    selectedAttendanceEntries.length
                  }
                </strong>
              </div>

              <div className="record-summary">
                <span>
                  Recorded Points
                </span>

                <strong>
                  {activePoints}
                </strong>
              </div>
            </div>

            {selectedAttendanceEntries.length >
            0 ? (
              <div className="record-table-wrap">
                <table className="record-table">
  <thead>
    <tr>
      <th>Date</th>

      <th>
        Attendance Event
      </th>

      <th>Minutes</th>

      <th>Points</th>

      <th>Status</th>

      <th>Recorder</th>

      <th>
        Comments / Exception
      </th>
    </tr>
  </thead>

  <tbody>
    {selectedAttendanceEntries.map(
      (entry) => (
        <tr key={entry.id}>
          <td>
            {formatDate(
              entry.entryDate,
            )}
          </td>

          <td>
            {formatEventType(
              entry.eventType,
            )}
          </td>

          <td>
            {entry.minutesMissed ??
              "—"}
          </td>

          <td>
            {entry.policyPoints ??
              0}
          </td>

          <td>
            {entry.protectedAbsence
              ? "Protected"
              : entry.excusedByManagement
                ? "Management Excused"
                : "Counted"}
          </td>

          <td>
            {entry.recordedBy ||
              "—"}
          </td>

          <td>
            {entry.note ||
              entry.exceptionReason ||
              "—"}
          </td>
        </tr>
      ),
    )}
  </tbody>
</table>
              </div>
            ) : (
              <div className="empty-record">
                No attendance events
                have been recorded for
                this employee.
              </div>
            )}

            <div className="export-preview">
              <div>
                <strong>
                  EmpRecord Export
                </strong>

                <p>
                  This employee history
                  will feed the
                  EmpRecord-style
                  attendance export.
                </p>
              </div>

              <button
  type="button"
  onClick={() =>
    window.open(
      `/settings/workers/attendance/export/${selectedWorker.id}`,
      "_blank",
      "noopener,noreferrer",
    )
  }
>
  Export Attendance Record
</button>
            </div>
          </section>
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

        .corrective-action-panel {
  margin-top: 20px;
  border: 1px solid
    rgba(225, 170, 25, 0.38);
  border-radius: 18px;
  background:
    rgba(31, 27, 14, 0.88);
  padding: 20px;
}

.corrective-action-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.corrective-action-heading h3 {
  margin: 4px 0 6px;
  color: #ffe48a;
}

.corrective-action-heading p {
  margin: 0;
  color:
    rgba(255, 255, 255, 0.65);
}

.ca-status-badge {
  border: 1px solid
    rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  padding: 7px 12px;
  color:
    rgba(255, 255, 255, 0.62);
  font-size: 0.75rem;
  font-weight: 800;
}

.ca-status-badge.active {
  border-color:
    rgba(225, 170, 25, 0.5);
  background:
    rgba(225, 170, 25, 0.12);
  color: #ffe48a;
}

.corrective-action-summary {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.corrective-action-summary > div {
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

.corrective-action-summary span,
.current-ca-detail span,
.ca-form-heading span,
.corrective-action-form label > span {
  color:
    rgba(255, 255, 255, 0.56);
  font-size: 0.75rem;
}

.corrective-action-summary strong,
.current-ca-detail strong {
  color: #fff4c4;
}

.current-ca-detail {
  margin-top: 12px;
  border-radius: 12px;
  background:
    rgba(255, 255, 255, 0.035);
  padding: 14px;
}

.current-ca-detail p {
  margin: 8px 0 0;
  color:
    rgba(255, 255, 255, 0.76);
  line-height: 1.5;
}

.corrective-action-form {
  margin-top: 18px;
  border-top: 1px solid
    rgba(255, 255, 255, 0.09);
  padding-top: 18px;
}

.ca-form-heading {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
}

.ca-form-heading strong {
  color: #ffe48a;
}

.ca-warning {
  margin-bottom: 14px;
  border: 1px solid
    rgba(225, 170, 25, 0.35);
  border-radius: 12px;
  background:
    rgba(225, 170, 25, 0.08);
  color: #ffe48a;
  padding: 12px 14px;
  font-size: 0.8rem;
}

.corrective-action-form-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.corrective-action-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.corrective-action-form input,
.corrective-action-form select,
.corrective-action-form textarea {
  border: 1px solid
    rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: #11130f;
  color: #ffffff;
  padding: 10px 12px;
  font: inherit;
}

.corrective-action-form textarea {
  resize: vertical;
}

.ca-note-field {
  grid-column: 1 / -1;
}

.corrective-action-form > button {
  margin-top: 18px;
  border: 1px solid #e1aa19;
  border-radius: 11px;
  background: #e1aa19;
  color: #171208;
  padding: 11px 18px;
  font-weight: 800;
  cursor: pointer;
}

.corrective-action-form > button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

        .attendance-form,
        .attendance-assessment,
        .attendance-record {
          margin-top: 20px;
          border: 1px solid
            rgba(225, 170, 25, 0.28);
          border-radius: 18px;
          background:
            rgba(25, 22, 12, 0.72);
          padding: 20px;
        }

        .attendance-form h3,
        .attendance-assessment h3,
        .attendance-record h3 {
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

        .attendance-form > button,
        .confirmation-panel button {
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
        > button:disabled,
        .confirmation-panel
        button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .attendance-assessment {
          border-color:
            rgba(225, 170, 25, 0.38);
          background:
            rgba(31, 27, 14, 0.88);
        }

        .assessment-heading {
          display: flex;
          align-items: flex-start;
          justify-content:
            space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .assessment-heading h3 {
          margin: 4px 0 0;
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

        .assessment-grid > div,
        .record-summary {
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
        .assessment-reason > span,
        .record-summary span {
          color:
            rgba(255, 255, 255, 0.56);
          font-size: 0.75rem;
        }

        .assessment-grid strong,
        .record-summary strong {
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

        .confirmation-panel {
          margin-top: 18px;
          border: 1px solid
            rgba(225, 170, 25, 0.42);
          border-radius: 14px;
          background:
            rgba(225, 170, 25, 0.08);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 18px;
        }

        .confirmation-panel strong {
          color: #ffe48a;
        }

        .confirmation-panel p {
          margin: 5px 0 0;
          color:
            rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .confirmation-panel button {
          margin-top: 0;
          white-space: nowrap;
        }

        .assessment-disclaimer {
          margin: 14px 0 0;
          color:
            rgba(255, 255, 255, 0.48);
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .save-success {
          margin-top: 18px;
          border: 1px solid
            rgba(116, 211, 144, 0.45);
          border-radius: 14px;
          background:
            rgba(41, 112, 61, 0.18);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .save-success strong {
          color: #b8f4c8;
        }

        .save-success span {
          color:
            rgba(255, 255, 255, 0.82);
        }

        .save-success small {
          color:
            rgba(255, 255, 255, 0.58);
        }

        .record-heading {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            150px
            150px;
          gap: 12px;
          align-items: stretch;
        }

        .record-heading h3 {
          margin: 4px 0 6px;
        }

        .record-heading p {
          margin: 0;
          color:
            rgba(255, 255, 255, 0.65);
        }

        .record-table-wrap {
          margin-top: 18px;
          overflow-x: auto;
          border: 1px solid
            rgba(255, 255, 255, 0.09);
          border-radius: 14px;
        }

        .record-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .record-table th,
        .record-table td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.07);
          vertical-align: top;
        }

        .record-table th {
          background:
            rgba(225, 170, 25, 0.1);
          color: #ffe48a;
          font-size: 0.76rem;
        }

        .record-table td {
          color:
            rgba(255, 255, 255, 0.78);
          font-size: 0.82rem;
        }

        .record-table tbody
        tr:last-child td {
          border-bottom: none;
        }

        .empty-record {
          margin-top: 18px;
          border: 1px dashed
            rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 22px;
          color:
            rgba(255, 255, 255, 0.55);
          text-align: center;
        }

        .export-preview {
          margin-top: 18px;
          border-top: 1px solid
            rgba(255, 255, 255, 0.09);
          padding-top: 16px;
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 16px;
        }

        .export-preview strong {
          color: #ffe48a;
        }

        .export-preview p {
          margin: 4px 0 0;
          color:
            rgba(255, 255, 255, 0.58);
        }

        .export-preview button {
  border: 1px solid #e1aa19;
  border-radius: 10px;
  background:
    rgba(225, 170, 25, 0.12);
  color: #ffe48a;
  padding: 10px 14px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 150ms ease,
    transform 150ms ease;
}

.export-preview button:hover {
  background:
    rgba(225, 170, 25, 0.2);
  transform:
    translateY(-1px);
}

        @media (max-width: 900px) {
          .assessment-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .record-heading {
            grid-template-columns:
              1fr 1fr;
          }

          .record-heading
          > div:first-child {
            grid-column:
              1 / -1;
          }
        }

        @media (max-width: 700px) {
          .selected-worker,
          .attendance-form-grid,
          .attendance-options,
          .assessment-grid,
          .record-heading {
          .corrective-action-summary,
          .corrective-action-form-grid,
            grid-template-columns:
              1fr;
          }

          .record-heading
          > div:first-child {
            grid-column: auto;
          }

          .assessment-heading,
          .confirmation-panel,
          .export-preview {
            flex-direction: column;
            align-items: stretch;
          }

          .confirmation-panel button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}