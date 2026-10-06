"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  assessAttendanceEvent,
} from "@/app/lib/attendance/attendanceService";

import {
  ATTENDANCE_POLICY_VERSION,
  calculateActivePoints,
  getCurrentAttendanceStanding,
  isInQualifyingPeriod,
} from "@/app/lib/attendance/attendancePolicyEngine";

import type {
  AttendanceEventType,
} from "@/app/lib/attendance/attendancePolicyEngine";

const ATTENDANCE_EVENT_TYPES:
  AttendanceEventType[] = [
    "LATE",
    "ABSENT",
    "LATE_FROM_LUNCH",
    "LEFT_EARLY",
    "NO_CALL_NO_SHOW",
  ];

function readText(
  formData: FormData,
  name: string,
) {
  const value =
    formData.get(name);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function readInteger(
  formData: FormData,
  name: string,
) {
  const value =
    Number.parseInt(
      readText(
        formData,
        name,
      ),
      10,
    );

  return Number.isFinite(value)
    ? value
    : 0;
}

function readOptionalInteger(
  formData: FormData,
  name: string,
) {
  const rawValue =
    readText(
      formData,
      name,
    );

  if (!rawValue) {
    return null;
  }

  const value =
    Number.parseInt(
      rawValue,
      10,
    );

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${name} must be a valid non-negative number.`,
    );
  }

  return value;
}

function readCheckbox(
  formData: FormData,
  name: string,
) {
  return (
    formData.get(name) ===
    "on"
  );
}

function parseDate(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "A valid attendance date is required.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function validateAttendanceEventType(
  value: string,
): AttendanceEventType {
  if (
    !ATTENDANCE_EVENT_TYPES.includes(
      value as AttendanceEventType,
    )
  ) {
    throw new Error(
      "A valid attendance event type is required.",
    );
  }

  return value as AttendanceEventType;
}

function readAttendanceEvent(
  formData: FormData,
) {
  const collectorId =
    readInteger(
      formData,
      "collectorId",
    );

  if (collectorId <= 0) {
    throw new Error(
      "A Worker Bee is required.",
    );
  }

  const entryDate =
    parseDate(
      readText(
        formData,
        "entryDate",
      ),
    );

  const eventType =
    validateAttendanceEventType(
      readText(
        formData,
        "eventType",
      ),
    );

  const minutesMissed =
    readOptionalInteger(
      formData,
      "minutesMissed",
    );

  const protectedAbsence =
    readCheckbox(
      formData,
      "protectedAbsence",
    );

  const protectedAbsenceReason =
    readText(
      formData,
      "protectedAbsenceReason",
    );

  const excusedByManagement =
    readCheckbox(
      formData,
      "excusedByManagement",
    );

  const exceptionReason =
    readText(
      formData,
      "exceptionReason",
    );

    const note =
  readText(
    formData,
    "note",
  );

    const recordedBy =
  readText(
    formData,
    "recordedBy",
  ).toUpperCase();

if (
  !/^[A-Z]{2,4}$/.test(
    recordedBy,
  )
) {
  throw new Error(
    "Recorder initials must contain 2 to 4 letters.",
  );
}

  if (
    protectedAbsence &&
    excusedByManagement
  ) {
    throw new Error(
      "An attendance event cannot be both a protected absence and a management exception.",
    );
  }

  if (
    protectedAbsence &&
    !protectedAbsenceReason
  ) {
    throw new Error(
      "Protected absence documentation is required.",
    );
  }

  if (
    excusedByManagement &&
    !exceptionReason
  ) {
    throw new Error(
      "A management exception reason is required.",
    );
  }

  return {
    collectorId,
    entryDate,
    eventType,
    minutesMissed,
    protectedAbsence,
    protectedAbsenceReason,
    excusedByManagement,
    exceptionReason,
    note,
    recordedBy,
  };
}

export async function previewAttendanceEvent(
  formData: FormData,
) {
  const event =
    readAttendanceEvent(
      formData,
    );

  const existingEntry =
    await prisma.attendanceEntry.findFirst({
      where: {
        collectorId:
          event.collectorId,

        entryDate:
          event.entryDate,

        eventType:
          event.eventType,

        recordedBy:
          event.recordedBy,
      },

      select: {
        id: true,
        entryDate: true,
        eventType: true,
        minutesMissed: true,
        policyPoints: true,
        protectedAbsence: true,
        excusedByManagement: true,
        exceptionReason: true,
      },

      orderBy: {
        id: "desc",
      },
    });

  const assessment =
    await assessAttendanceEvent({
      collectorId:
        event.collectorId,

      entryDate:
        event.entryDate,

      eventType:
        event.eventType,

      minutesMissed:
        event.minutesMissed,

      protectedAbsence:
        event.protectedAbsence,

      excusedByManagement:
        event.excusedByManagement,
    });

  return {
    ...assessment,

    existingEntry:
      existingEntry
        ? {
            id:
              existingEntry.id,

            entryDate:
              existingEntry.entryDate
                .toISOString(),

            eventType:
              existingEntry.eventType,

            minutesMissed:
              existingEntry.minutesMissed,

            policyPoints:
              existingEntry.policyPoints,

            protectedAbsence:
              existingEntry.protectedAbsence,

            excusedByManagement:
              existingEntry.excusedByManagement,

            exceptionReason:
              existingEntry.exceptionReason,
          }
        : null,
  };
}

export async function saveAttendanceEvent(
  formData: FormData,
) {
  const event =
    readAttendanceEvent(
      formData,
    );

  const replaceExisting =
    readCheckbox(
      formData,
      "replaceExisting",
    );

  const existingEntry =
    await prisma.attendanceEntry.findFirst({
      where: {
        collectorId:
          event.collectorId,

        entryDate:
          event.entryDate,

        eventType:
          event.eventType,
      },

      orderBy: {
        id: "desc",
      },
    });

  /*
   * One employee may only have one
   * attendance event of the same type
   * on the same date.
   *
   * Existing records are never silently
   * overwritten. Manager confirmation
   * is required before replacement.
   */
  if (
    existingEntry &&
    !replaceExisting
  ) {
    return {
      success: false as const,

      requiresReplacementConfirmation:
        true as const,

      message:
        "This employee already has this attendance event recorded for the selected date. Manager confirmation is required before the existing record can be replaced.",

      existingEntry: {
        id:
          existingEntry.id,

        entryDate:
          existingEntry.entryDate
            .toISOString(),

        eventType:
          existingEntry.eventType,

        minutesMissed:
          existingEntry.minutesMissed,

        policyPoints:
          existingEntry.policyPoints,

        protectedAbsence:
          existingEntry.protectedAbsence,

        excusedByManagement:
          existingEntry.excusedByManagement,

        exceptionReason:
          existingEntry.exceptionReason,
      },
    };
  }

  /*
   * HIVE recalculates policy immediately
   * before persistence. Policy points are
   * never accepted from the browser.
   */
  const assessment =
  await assessAttendanceEvent({
    collectorId:
      event.collectorId,

    entryDate:
      event.entryDate,

    eventType:
      event.eventType,

    minutesMissed:
      event.minutesMissed,

    protectedAbsence:
      event.protectedAbsence,

    excusedByManagement:
      event.excusedByManagement,

    excludeAttendanceEntryId:
      existingEntry?.id ?? null,
  });

  const evaluation =
    assessment.evaluation;

  const attendanceData = {
    collectorId:
      event.collectorId,

    entryDate:
      event.entryDate,

       eventType:
      event.eventType,

        recordedBy:
      event.recordedBy,

    note:
      event.note || null,

    minutesMissed:
      event.minutesMissed,

    protectedAbsence:
      event.protectedAbsence,

    excusedByManagement:
      event.excusedByManagement,

    exceptionReason:
      event.protectedAbsence
        ? event.protectedAbsenceReason
        : event.exceptionReason ||
          null,

    policyPoints:
      evaluation?.points ?? 0,

    policyVersion:
      evaluation?.policyVersion ??
      null,
  };

  const attendanceEntry =
    existingEntry
      ? await prisma.attendanceEntry.update({
          where: {
            id:
              existingEntry.id,
          },

          data:
            attendanceData,
        })
      : await prisma.attendanceEntry.create({
          data:
            attendanceData,
        });

  revalidatePath(
    "/settings/workers/attendance",
  );

  return {
    success: true as const,

    requiresReplacementConfirmation:
      false as const,

    replacedExisting:
      Boolean(
        existingEntry,
      ),

    message:
      existingEntry
        ? "Existing attendance event replaced successfully."
        : "Attendance event recorded successfully.",

    attendanceEntryId:
      attendanceEntry.id,

    policyPoints:
      evaluation?.points ?? 0,

    activePointsAfterEvent:
      evaluation
        ? evaluation.activePoints +
          evaluation.points
        : 0,

    recommendedAction:
      evaluation?.recommendedAction ??
      null,

    policyVersion:
      evaluation?.policyVersion ??
      null,
  };
}
const CORRECTIVE_ACTION_LEVELS = [
  "VERBAL_COACHING",
  "WRITTEN_COACHING",
  "WRITTEN_WARNING",
  "FINAL_WRITTEN_WARNING",
  "TERMINATION",
] as const;

type CorrectiveActionLevel =
  (typeof CORRECTIVE_ACTION_LEVELS)[number];

  const CORRECTIVE_ACTION_MODES = [
  "EXISTING",
  "NEW",
] as const;

type CorrectiveActionMode =
  (typeof CORRECTIVE_ACTION_MODES)[number];

function addUtcMonths(
  value: Date,
  months: number,
) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth() +
        months,
      value.getUTCDate(),
    ),
  );
}

function readDate(
  formData: FormData,
  name: string,
) {
  const value =
    readText(
      formData,
      name,
    );

  if (!value) {
    throw new Error(
      `${name} is required.`,
    );
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${name} must be a valid date.`,
    );
  }

  return date;
}

export async function saveCorrectiveAction(
  formData: FormData,
) {
  const collectorId =
    readInteger(
      formData,
      "collectorId",
    );

  if (collectorId <= 0) {
    throw new Error(
      "A valid employee is required.",
    );
  }

  const rawMode =
  readText(
    formData,
    "correctiveActionMode",
  );

if (
  !CORRECTIVE_ACTION_MODES.includes(
    rawMode as CorrectiveActionMode,
  )
) {
  throw new Error(
    "A valid corrective action mode is required.",
  );
}

const correctiveActionMode =
  rawMode as CorrectiveActionMode;

  const rawActionLevel =
    readText(
      formData,
      "actionLevel",
    );

  if (
    !CORRECTIVE_ACTION_LEVELS.includes(
      rawActionLevel as CorrectiveActionLevel,
    )
  ) {
    throw new Error(
      "A valid corrective action level is required.",
    );
  }

  const actionLevel =
    rawActionLevel as CorrectiveActionLevel;

  const effectiveDate =
    readDate(
      formData,
      "effectiveDate",
    );

  const issuedBy =
    readText(
      formData,
      "issuedBy",
    ).toUpperCase();

  if (
    !/^[A-Z]{2,4}$/.test(
      issuedBy,
    )
  ) {
    throw new Error(
      "Manager initials must contain 2 to 4 letters.",
    );
  }

  const managerNote =
    readText(
      formData,
      "managerNote",
    );

  if (
    managerNote.length > 500
  ) {
    throw new Error(
      "Manager note cannot exceed 500 characters.",
    );
  }

  const worker =
    await prisma.collector.findUnique({
      where: {
        id: collectorId,
      },

      select: {
        id: true,

        employmentProfile: {
          select: {
            dateOfHire: true,
          },
        },

        attendanceEntries: {
          where: {
            entryDate: {
              lte: effectiveDate,
            },
          },

          select: {
            id: true,
            entryDate: true,
            eventType: true,
            policyPoints: true,
            protectedAbsence: true,
            excusedByManagement: true,
            occurrenceGroupKey: true,
          },
        },

                attendanceCorrectiveActions: {
          select: {
            actionLevel: true,
            status: true,
            effectiveDate: true,
            expiresAt: true,
          },
        },
      },
    });

  if (!worker) {
    throw new Error(
      "Employee could not be found.",
    );
  }

  const attendanceHistory =
    worker.attendanceEntries.map(
      (entry) => ({
        id: entry.id,
        entryDate:
          entry.entryDate,
        eventType:
          entry.eventType,
        policyPoints:
          entry.policyPoints,
        protectedAbsence:
          entry.protectedAbsence,
        excusedByManagement:
          entry.excusedByManagement,
        occurrenceGroupKey:
          entry.occurrenceGroupKey,
      }),
    );

    const correctiveActionHistory =
    worker.attendanceCorrectiveActions.map(
      (action) => ({
        actionLevel:
          action.actionLevel,
        status:
          action.status,
        effectiveDate:
          action.effectiveDate,
        expiresAt:
          action.expiresAt,
      }),
    );

  const currentStanding =
    getCurrentAttendanceStanding(
      attendanceHistory,
      correctiveActionHistory,
      worker.employmentProfile
        ?.dateOfHire ?? null,
      effectiveDate,
    );

  let resolvedActionLevel =
    actionLevel;

  if (
    correctiveActionMode === "NEW"
  ) {
        if (
      !currentStanding.correctiveActionDue
    ) {
      throw new Error(
        "HIVE does not currently indicate a new attendance corrective action for this employee.",
      );
    }

    resolvedActionLevel =
      currentStanding.correctiveActionDue;
  }

  const activePointsAtAction =
    calculateActivePoints(
      attendanceHistory,
      effectiveDate,
    );

  const qualifyingPeriod =
    isInQualifyingPeriod(
      worker.employmentProfile
        ?.dateOfHire ?? null,
      effectiveDate,
    );

  if (
    qualifyingPeriod === null
  ) {
    throw new Error(
      "Date of hire is required before an attendance corrective action can be issued.",
    );
  }

  const expiresAt =
    addUtcMonths(
      effectiveDate,
      6,
    );

  const correctiveAction =
    await prisma.attendanceCorrectiveAction.create({
      data: {
        collectorId,
        actionLevel:
         resolvedActionLevel,
        status: "ISSUED",

        effectiveDate,
        expiresAt,

        activePointsAtAction,
        qualifyingPeriod,

        managerNote:
          managerNote || null,

        issuedBy,
        issuedAt:
          new Date(),

        policyVersion:
          ATTENDANCE_POLICY_VERSION,

        recommendationReason:
          `Attendance corrective action issued with ${activePointsAtAction} active point${
            activePointsAtAction === 1
              ? ""
              : "s"
          } as of the effective date.`,
      },
    });

  revalidatePath(
    "/settings/workers/attendance",
  );

  revalidatePath(
    `/settings/workers/attendance/export/${collectorId}`,
  );

  return {
    success: true as const,

    correctiveActionId:
      correctiveAction.id,

    actionLevel:
      correctiveAction.actionLevel,

    effectiveDate:
      correctiveAction.effectiveDate.toISOString(),

    expiresAt:
      correctiveAction.expiresAt?.toISOString() ??
      null,

    activePointsAtAction:
      correctiveAction.activePointsAtAction,

    message:
      "Corrective action recorded successfully.",
  };
}
export async function voidCorrectiveAction(
  formData: FormData,
) {
  const correctiveActionId =
    readInteger(
      formData,
      "correctiveActionId",
    );

    const confirmVoid =
    readText(
      formData,
      "confirmVoid",
    );

  if (confirmVoid !== "YES") {
    throw new Error(
      "Corrective action voiding requires explicit confirmation.",
    );
  }

  if (correctiveActionId <= 0) {
    throw new Error(
      "A valid corrective action is required.",
    );
  }

  const voidedBy =
    readText(
      formData,
      "voidedBy",
    ).toUpperCase();

  if (
    !/^[A-Z]{2,4}$/.test(
      voidedBy,
    )
  ) {
    throw new Error(
      "Manager initials must contain 2 to 4 letters.",
    );
  }

  const voidReason =
    readText(
      formData,
      "voidReason",
    );

  if (!voidReason) {
    throw new Error(
      "A reason is required to void a corrective action.",
    );
  }

  if (voidReason.length > 500) {
    throw new Error(
      "Void reason cannot exceed 500 characters.",
    );
  }

  const existing =
    await prisma.attendanceCorrectiveAction.findUnique({
      where: {
        id: correctiveActionId,
      },
      select: {
        id: true,
        collectorId: true,
        status: true,
        managerNote: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Corrective action could not be found.",
    );
  }

    if (existing.status !== "ISSUED") {
    throw new Error(
      "Only an issued corrective action can be voided.",
    );
  }

  const auditNote =
    [
      existing.managerNote,
      `VOIDED by ${voidedBy}: ${voidReason}`,
    ]
      .filter(Boolean)
      .join("\n");

  await prisma.attendanceCorrectiveAction.update({
    where: {
      id: correctiveActionId,
    },
    data: {
      status: "VOIDED",
      voidedAt: new Date(),
      managerNote: auditNote,
    },
  });

  revalidatePath(
    "/settings/workers/attendance",
  );

  revalidatePath(
    `/settings/workers/attendance/export/${existing.collectorId}`,
  );

  return {
    success: true as const,
    correctiveActionId,
    message:
      "Corrective action voided successfully.",
  };
}