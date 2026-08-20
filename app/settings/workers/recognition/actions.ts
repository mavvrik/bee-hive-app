"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

import {
  getEmployeeOfMonthRecommendation,
} from "@/app/lib/employeeOfMonthEngine";

type WorkforceRoleValue =
  | "MANAGEMENT"
  | "PHLEBOTOMIST"
  | "GROUP_LEAD"
  | "PROCESSOR"
  | "RECEPTION_TECH"
  | "MSA"
  | "DST"
  | "OTHER";

type PerformanceMetricValue =
  | "STICKS"
  | "DISCONNECTS"
  | "SETUPS"
  | "PHYSICALS"
  | "INTERVIEWS"
  | "PROCESSED"
  | "OTHER";

type AttendanceEventValue =
  | "LATE"
  | "ABSENT"
  | "LATE_FROM_LUNCH"
  | "LEFT_EARLY";

function readText(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function readInteger(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value =
    Number.parseInt(
      readText(
        formData,
        fieldName,
      ),
      10,
    );

  return Number.isFinite(
    value,
  )
    ? value
    : fallback;
}

function readFloat(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value =
    Number.parseFloat(
      readText(
        formData,
        fieldName,
      ),
    );

  return Number.isFinite(
    value,
  )
    ? value
    : fallback;
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
      "A valid date is required.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function validateRole(
  value: string,
): WorkforceRoleValue {
  const allowed:
    WorkforceRoleValue[] = [
      "MANAGEMENT",
      "PHLEBOTOMIST",
      "GROUP_LEAD",
      "PROCESSOR",
      "RECEPTION_TECH",
      "MSA",
      "DST",
      "OTHER",
    ];

  if (
    !allowed.includes(
      value as WorkforceRoleValue,
    )
  ) {
    throw new Error(
      "Invalid workforce role.",
    );
  }

  return value as WorkforceRoleValue;
}

function validateMetric(
  value: string,
): PerformanceMetricValue {
  const allowed:
    PerformanceMetricValue[] = [
      "STICKS",
      "DISCONNECTS",
      "SETUPS",
      "PHYSICALS",
      "INTERVIEWS",
      "PROCESSED",
      "OTHER",
    ];

  if (
    !allowed.includes(
      value as PerformanceMetricValue,
    )
  ) {
    throw new Error(
      "Invalid performance metric.",
    );
  }

  return value as PerformanceMetricValue;
}

function validateAttendanceEvent(
  value: string,
): AttendanceEventValue {
  const allowed:
    AttendanceEventValue[] = [
      "LATE",
      "ABSENT",
      "LATE_FROM_LUNCH",
      "LEFT_EARLY",
    ];

  if (
    !allowed.includes(
      value as AttendanceEventValue,
    )
  ) {
    throw new Error(
      "Invalid attendance event.",
    );
  }

  return value as AttendanceEventValue;
}

function refreshRecognitionPages() {
  revalidatePath(
    "/settings/workers/recognition",
  );

  revalidatePath(
    "/settings/workers",
  );
}

export async function saveRolePerformanceTarget(
  formData: FormData,
) {
  const role =
    validateRole(
      readText(
        formData,
        "role",
      ),
    );

  const metric =
    validateMetric(
      readText(
        formData,
        "metric",
      ),
    );

  const targetPerDay =
    Math.max(
      0,
      readFloat(
        formData,
        "targetPerDay",
        0,
      ),
    );

  await prisma.rolePerformanceTarget.upsert({
    where: {
      role_metric: {
        role,
        metric,
      },
    },

    update: {
      targetPerDay,
      active: true,
    },

    create: {
      role,
      metric,
      targetPerDay,
      accuracyApplicable:
        role ===
          "PHLEBOTOMIST" &&
        metric ===
          "STICKS",

      active: true,
    },
  });

  refreshRecognitionPages();
}

export async function saveAttendanceEvent(
  formData: FormData,
) {
  const collectorId =
    readInteger(
      formData,
      "collectorId",
    );

  if (
    collectorId <= 0
  ) {
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
    validateAttendanceEvent(
      readText(
        formData,
        "eventType",
      ),
    );

  const note =
    readText(
      formData,
      "note",
    );

  await prisma.attendanceEntry.create({
    data: {
      collectorId,
      entryDate,
      eventType,
      note:
        note ||
        null,
    },
  });

  refreshRecognitionPages();
}

export async function deleteAttendanceEvent(
  formData: FormData,
) {
  const attendanceId =
    readInteger(
      formData,
      "attendanceId",
    );

  if (
    attendanceId <= 0
  ) {
    throw new Error(
      "A valid attendance entry is required.",
    );
  }

  await prisma.attendanceEntry.delete({
    where: {
      id:
        attendanceId,
    },
  });

  refreshRecognitionPages();
}

export async function saveRecognitionScore(
  formData: FormData,
) {
  const collectorId =
    readInteger(
      formData,
      "collectorId",
    );

  const year =
    readInteger(
      formData,
      "year",
    );

  const month =
    readInteger(
      formData,
      "month",
    );

  if (
    collectorId <= 0
  ) {
    throw new Error(
      "Worker Bee is required.",
    );
  }

  const score =
    Math.max(
      0,
      Math.min(
        100,
        readFloat(
          formData,
          "score",
          0,
        ),
      ),
    );

  const note =
    readText(
      formData,
      "note",
    );

  await prisma.monthlyRecognitionScore.upsert({
    where: {
      collectorId_year_month: {
        collectorId,
        year,
        month,
      },
    },

    update: {
      score,
      note:
        note ||
        null,
    },

    create: {
      collectorId,
      year,
      month,
      score,
      note:
        note ||
        null,
    },
  });

  refreshRecognitionPages();
}

export async function saveEmployeeOfMonthSettings(
  formData: FormData,
) {
  const productivityWeight =
    Math.max(
      0,
      readFloat(
        formData,
        "productivityWeight",
        35,
      ),
    );

  const accuracyWeight =
    Math.max(
      0,
      readFloat(
        formData,
        "accuracyWeight",
        25,
      ),
    );

  const qualityWeight =
    Math.max(
      0,
      readFloat(
        formData,
        "qualityWeight",
        25,
      ),
    );

  const attendanceWeight =
    Math.max(
      0,
      readFloat(
        formData,
        "attendanceWeight",
        10,
      ),
    );

  const recognitionWeight =
    Math.max(
      0,
      readFloat(
        formData,
        "recognitionWeight",
        5,
      ),
    );

  const totalWeight =
    productivityWeight +
    accuracyWeight +
    qualityWeight +
    attendanceWeight +
    recognitionWeight;

  if (
    Math.abs(
      totalWeight -
        100,
    ) >
    0.01
  ) {
    throw new Error(
      "Employee of the Month weights must total 100%.",
    );
  }

  const emfPenaltyPoints =
    Math.max(
      0,
      readFloat(
        formData,
        "emfPenaltyPoints",
        15,
      ),
    );

  const emfThresholdText =
    readText(
      formData,
      "emfDisqualifyThreshold",
    );

  const emfDisqualifyThreshold =
    emfThresholdText ===
    ""
      ? null
      : Math.max(
          0,
          Number.parseInt(
            emfThresholdText,
            10,
          ),
        );

  const latePenalty =
    Math.max(
      0,
      readFloat(
        formData,
        "latePenalty",
        1,
      ),
    );

  const absentPenalty =
    Math.max(
      0,
      readFloat(
        formData,
        "absentPenalty",
        3,
      ),
    );

  const lateFromLunchPenalty =
    Math.max(
      0,
      readFloat(
        formData,
        "lateFromLunchPenalty",
        1,
      ),
    );

  const leftEarlyPenalty =
    Math.max(
      0,
      readFloat(
        formData,
        "leftEarlyPenalty",
        1.5,
      ),
    );

  await prisma.employeeOfMonthSettings.upsert({
    where: {
      id: 1,
    },

    update: {
      productivityWeight,
      accuracyWeight,
      qualityWeight,
      attendanceWeight,
      recognitionWeight,

      emfPenaltyPoints,
      emfDisqualifyThreshold,

      latePenalty,
      absentPenalty,
      lateFromLunchPenalty,
      leftEarlyPenalty,
    },

    create: {
      id: 1,

      productivityWeight,
      accuracyWeight,
      qualityWeight,
      attendanceWeight,
      recognitionWeight,

      emfPenaltyPoints,
      emfDisqualifyThreshold,

      latePenalty,
      absentPenalty,
      lateFromLunchPenalty,
      leftEarlyPenalty,
    },
  });

  refreshRecognitionPages();
}

export async function saveMonthlyEmployeeOfMonthScores(
  formData: FormData,
) {
  const year =
    readInteger(
      formData,
      "year",
    );

  const month =
    readInteger(
      formData,
      "month",
    );

  const result =
    await getEmployeeOfMonthRecommendation({
      year,
      month,
    });

  await prisma.$transaction(
    result.rankings.map(
      (candidate) =>
        prisma.employeeOfMonthScore.upsert({
          where: {
            collectorId_year_month: {
              collectorId:
                candidate.collectorId,

              year,

              month,
            },
          },

          update: {
            productivityScore:
              candidate.productivityScore ??
              0,

            accuracyScore:
              candidate.accuracyScore ??
              0,

            qualityScore:
              candidate.qualityScore,

            attendanceScore:
              candidate.attendanceScore,

            recognitionScore:
              candidate.recognitionScore,

            weightedScore:
              candidate.totalScore,

            eligible:
              candidate.eligible,

            ineligibleReason:
              candidate.ineligibleReason,

            calculatedAt:
              new Date(),
          },

          create: {
            collectorId:
              candidate.collectorId,

            year,

            month,

            productivityScore:
              candidate.productivityScore ??
              0,

            accuracyScore:
              candidate.accuracyScore ??
              0,

            qualityScore:
              candidate.qualityScore,

            attendanceScore:
              candidate.attendanceScore,

            recognitionScore:
              candidate.recognitionScore,

            weightedScore:
              candidate.totalScore,

            eligible:
              candidate.eligible,

            ineligibleReason:
              candidate.ineligibleReason,

            calculatedAt:
              new Date(),
          },
        }),
    ),
  );

  refreshRecognitionPages();
}