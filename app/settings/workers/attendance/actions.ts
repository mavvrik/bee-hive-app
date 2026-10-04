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

export async function saveAttendanceEvent(
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

  if (
    protectedAbsence &&
    !protectedAbsenceReason
  ) {
    throw new Error(
      "Protected absence documentation is required.",
    );
  }

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

  if (
    excusedByManagement &&
    !exceptionReason
  ) {
    throw new Error(
      "A management exception reason is required.",
    );
  }

  const assessment =
    await assessAttendanceEvent({
      collectorId,
      entryDate,
      eventType,
      minutesMissed,
      protectedAbsence,
      excusedByManagement,
    });

  const evaluation =
    assessment.evaluation;

  await prisma.attendanceEntry.create({
    data: {
      collectorId,
      entryDate,
      eventType,
      minutesMissed,
      protectedAbsence,
      excusedByManagement,

      exceptionReason:
        protectedAbsence
          ? protectedAbsenceReason
          : exceptionReason || null,

      policyPoints:
        evaluation?.points ?? 0,

      policyVersion:
        evaluation?.policyVersion ??
        null,
    },
  });

  revalidatePath(
    "/settings/workers/attendance",
  );
}

export async function previewAttendanceEvent(
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

  const excusedByManagement =
    readCheckbox(
      formData,
      "excusedByManagement",
    );

  return assessAttendanceEvent({
    collectorId,
    entryDate,
    eventType,
    minutesMissed,
    protectedAbsence,
    excusedByManagement,
  });
}