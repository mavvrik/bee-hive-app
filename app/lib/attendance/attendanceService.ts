import { prisma } from "@/lib/prisma";

import {
  evaluateAttendance,
  type AttendanceEvaluation,
  type AttendanceEventInput,
  type AttendanceHistoryEvent,
  type CorrectiveActionHistory,
} from "./attendancePolicyEngine";

export type AttendanceAssessmentRequest = {
  collectorId: number;
  entryDate: Date;
  eventType: AttendanceEventInput["eventType"];

  minutesMissed?: number | null;

  protectedAbsence?: boolean;
  excusedByManagement?: boolean;

  occurrenceGroupKey?: string | null;

  excludeAttendanceEntryId?: number | null;
};

export type AttendanceAssessmentResult = {
  collector: {
    id: number;
    name: string;
    profileTitle: string | null;
    dateOfHire: Date | null;
  };

  attendancePointsApply: boolean;
  evaluation: AttendanceEvaluation | null;

  ncnsScheduleVerification: {
    applicable: boolean;
    scheduledShiftsChecked: number;
    consecutiveScheduledShiftNcns: number;
    jobAbandonmentProvisionMet: boolean;
    verificationComplete: boolean;
    message: string;
  };

};

function startOfUtcDay(
  value: Date,
) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

function subtractUtcMonths(
  value: Date,
  months: number,
) {
  const result =
    startOfUtcDay(value);

  result.setUTCMonth(
    result.getUTCMonth() - months,
  );

  return result;
}

function isAttendancePointsExempt(
  profileTitle: string | null,
) {
  if (!profileTitle) {
    return false;
  }

  const normalizedTitle =
    profileTitle
      .trim()
      .toUpperCase();

    return (
    normalizedTitle === "CM" ||
    normalizedTitle === "CENTER MANAGER" ||
    normalizedTitle === "ACM" ||
    normalizedTitle === "ASSISTANT CENTER MANAGER" ||
    normalizedTitle === "AMQ"
  );
}

export async function assessAttendanceEvent(
  request: AttendanceAssessmentRequest,
): Promise<AttendanceAssessmentResult> {
  const collector =
    await prisma.collector.findUnique({
      where: {
        id: request.collectorId,
      },

      select: {
        id: true,
        name: true,
        profileTitle: true,

        employmentProfile: {
          select: {
            dateOfHire: true,
          },
        },
      },
    });

  if (!collector) {
    throw new Error(
      `Collector ${request.collectorId} was not found.`,
    );
  }

  const historyRows =
    await prisma.attendanceEntry.findMany({
      where: {
  collectorId:
    request.collectorId,

  entryDate: {
    lte:
      request.entryDate,
        },
      },

      orderBy: [
        {
          entryDate: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  const correctiveActionRows =
    await prisma.attendanceCorrectiveAction.findMany({
      where: {
        collectorId: request.collectorId,
        effectiveDate: {
          lte: request.entryDate,
        },
      },

      orderBy: [
        {
          effectiveDate: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    
  const history: AttendanceHistoryEvent[] =
    historyRows.map((row) => ({
      entryDate: row.entryDate,
      eventType: row.eventType,
      policyPoints: row.policyPoints ?? 0,
      protectedAbsence:
        row.protectedAbsence,
      excusedByManagement:
        row.excusedByManagement,
      occurrenceGroupKey:
        row.occurrenceGroupKey,
    }));

  const scheduledShiftRows =
    request.eventType ===
    "NO_CALL_NO_SHOW"
      ? await prisma.scheduledShift.findMany({
          where: {
            collectorId:
              request.collectorId,

            shiftDate: {
              gte: subtractUtcMonths(
                request.entryDate,
                6,
              ),

              lte: startOfUtcDay(
                request.entryDate,
              ),
            },
          },

          orderBy: [
            {
              shiftDate: "asc",
            },
            {
              startTime: "asc",
            },
            {
              id: "asc",
            },
          ],
        })
      : [];

    const uniqueScheduledShifts =
    Array.from(
      new Map(
        scheduledShiftRows.map(
          (shift) => [
            [
              startOfUtcDay(
                shift.shiftDate,
              ).toISOString(),
              shift.startTime,
              shift.endTime,
            ].join("|"),
            shift,
          ],
        ),
      ).values(),
    );

    const uniqueScheduledShiftDates =
    Array.from(
      new Map(
        uniqueScheduledShifts.map(
          (shift) => [
            startOfUtcDay(
              shift.shiftDate,
            ).toISOString(),
            startOfUtcDay(
              shift.shiftDate,
            ),
          ],
        ),
      ).values(),
    ).sort(
      (a, b) =>
        a.getTime() -
        b.getTime(),
    );

    const currentEventDate =
    startOfUtcDay(
      request.entryDate,
    );

  const currentEventWasScheduled =
    uniqueScheduledShiftDates.some(
      (shiftDate) =>
        shiftDate.getTime() ===
        currentEventDate.getTime(),
    );

    const historicalNcnsDates =
    historyRows
      .filter(
        (row) =>
          row.eventType ===
            "NO_CALL_NO_SHOW" &&
          !row.protectedAbsence &&
          !row.excusedByManagement,
      )
      .map((row) =>
        startOfUtcDay(
          row.entryDate,
        ),
      );

  const countableNcnsDateKeys =
    new Set(
      historicalNcnsDates.map(
        (date) =>
          date.toISOString(),
      ),
    );

  if (
    request.eventType ===
      "NO_CALL_NO_SHOW" &&
    !request.protectedAbsence &&
    !request.excusedByManagement
  ) {
    countableNcnsDateKeys.add(
      currentEventDate.toISOString(),
    );
  }

    let consecutiveScheduledShiftNcns = 0;

  if (
    request.eventType ===
      "NO_CALL_NO_SHOW" &&
    currentEventWasScheduled &&
    !request.protectedAbsence &&
    !request.excusedByManagement
  ) {
    const currentShiftIndex =
      uniqueScheduledShiftDates.findIndex(
        (shiftDate) =>
          shiftDate.getTime() ===
          currentEventDate.getTime(),
      );

    for (
      let index = currentShiftIndex;
      index >= 0;
      index -= 1
    ) {
      const shiftDateKey =
        uniqueScheduledShiftDates[
          index
        ].toISOString();

      if (
        !countableNcnsDateKeys.has(
          shiftDateKey,
        )
      ) {
        break;
      }

      consecutiveScheduledShiftNcns += 1;
    }
  }

  const correctiveActions:
    CorrectiveActionHistory[] =
      correctiveActionRows.map(
        (row) => ({
          effectiveDate:
            row.effectiveDate,
          actionLevel:
            row.actionLevel,
          status: row.status,
          expiresAt:
            row.expiresAt,
        }),
      );

  const currentEvent:
    AttendanceEventInput = {
      entryDate:
        request.entryDate,

      eventType:
        request.eventType,

      minutesMissed:
        request.minutesMissed ?? null,

      protectedAbsence:
        request.protectedAbsence ??
        false,

      excusedByManagement:
        request.excusedByManagement ??
        false,

      occurrenceGroupKey:
        request.occurrenceGroupKey ??
        null,

      dateOfHire:
        collector
          .employmentProfile
          ?.dateOfHire ??
        null,
    };

    const attendancePointsApply =
    !isAttendancePointsExempt(
      collector.profileTitle,
    );

  const evaluation =
    attendancePointsApply
      ? evaluateAttendance(
          currentEvent,
          history,
          correctiveActions,
        )
      : null;

        const ncnsScheduleVerification =
    request.eventType !==
    "NO_CALL_NO_SHOW"
      ? {
          applicable: false,
          scheduledShiftsChecked:
            uniqueScheduledShiftDates.length,
          consecutiveScheduledShiftNcns: 0,
          jobAbandonmentProvisionMet: false,
          verificationComplete: true,
          message:
            "Scheduled-shift NCNS verification does not apply to this attendance event.",
        }
      : request.protectedAbsence ||
          request.excusedByManagement
        ? {
            applicable: true,
            scheduledShiftsChecked:
              uniqueScheduledShiftDates.length,
            consecutiveScheduledShiftNcns: 0,
            jobAbandonmentProvisionMet: false,
            verificationComplete: true,
            message:
              "This NCNS is protected or management-excused and does not count toward the consecutive scheduled-shift NCNS provision.",
          }
        : !currentEventWasScheduled
          ? {
              applicable: true,
              scheduledShiftsChecked:
                uniqueScheduledShiftDates.length,
              consecutiveScheduledShiftNcns: 0,
              jobAbandonmentProvisionMet: false,
              verificationComplete: false,
              message:
                "No matching scheduled shift was found for this NCNS date. Schedule verification is required before applying the job-abandonment provision.",
            }
          : {
              applicable: true,
              scheduledShiftsChecked:
                uniqueScheduledShiftDates.length,
              consecutiveScheduledShiftNcns,
              jobAbandonmentProvisionMet:
                consecutiveScheduledShiftNcns >=
                3,
              verificationComplete: true,
              message:
                consecutiveScheduledShiftNcns >=
                3
                  ? "Three consecutive scheduled-shift NCNS events were verified. The policy job-abandonment provision is met and requires manager review."
                  : `Verified ${consecutiveScheduledShiftNcns} consecutive scheduled-shift NCNS event(s).`,
            };

  return {
    collector: {
      id: collector.id,
      name: collector.name,
      profileTitle:
        collector.profileTitle,
      dateOfHire:
        collector
          .employmentProfile
          ?.dateOfHire ??
        null,
    },

    attendancePointsApply,
    evaluation,
    ncnsScheduleVerification,
  };
}