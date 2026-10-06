export const ATTENDANCE_POLICY_VERSION =
  "HR0604-DOC-000245536-V1.0-2021-03-01";

export type AttendanceEventType =
  | "LATE"
  | "ABSENT"
  | "LATE_FROM_LUNCH"
  | "LEFT_EARLY"
  | "NO_CALL_NO_SHOW";

export type CorrectiveActionLevel =
  | "VERBAL_COACHING"
  | "WRITTEN_COACHING"
  | "WRITTEN_WARNING"
  | "FINAL_WRITTEN_WARNING"
  | "TERMINATION";

export type CorrectiveActionStatus =
  | "RECOMMENDED"
  | "ISSUED"
  | "VOIDED";

export type AttendanceEventInput = {
  eventType: AttendanceEventType;

  entryDate: Date;

  dateOfHire?: Date | null;

  minutesMissed?: number | null;

  protectedAbsence?: boolean;

  excusedByManagement?: boolean;

  sameIllnessGroup?: boolean;

  occurrenceGroupKey?: string | null;
};

export type AttendanceHistoryEvent = {
  id?: number;

  entryDate: Date;

  eventType: AttendanceEventType;

  policyPoints?: number | null;

  protectedAbsence?: boolean;

  excusedByManagement?: boolean;

  occurrenceGroupKey?: string | null;
};

export type CorrectiveActionHistory = {
  actionLevel: CorrectiveActionLevel;

  status: CorrectiveActionStatus;

  effectiveDate: Date;

  expiresAt?: Date | null;
};

export type AttendanceEvaluation = {
  policyVersion: string;

  points: number;

  qualifyingPeriod: boolean | null;

  protectedOrExcused: boolean;

  occurrenceCounted: boolean;

  activePoints: number;

  activeWindowStart: Date;

  activeWindowEnd: Date;

  noCallNoShowCount: number;

  consecutiveNoCallNoShowCount: number;

  recommendedAction: CorrectiveActionLevel | null;

  recommendationReason: string;

  warnings: string[];
};

const DAY_MS =
  24 * 60 * 60 * 1000;

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

function addUtcDays(
  value: Date,
  days: number,
) {
  const result =
    startOfUtcDay(value);

  result.setUTCDate(
    result.getUTCDate() + days,
  );

  return result;
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

function isSameOrAfter(
  value: Date,
  minimum: Date,
) {
  return (
    startOfUtcDay(value).getTime() >=
    startOfUtcDay(minimum).getTime()
  );
}

function isSameOrBefore(
  value: Date,
  maximum: Date,
) {
  return (
    startOfUtcDay(value).getTime() <=
    startOfUtcDay(maximum).getTime()
  );
}

function daysBetween(
  earlier: Date,
  later: Date,
) {
  return Math.floor(
    (
      startOfUtcDay(later).getTime() -
      startOfUtcDay(earlier).getTime()
    ) /
      DAY_MS,
  );
}

export function isInQualifyingPeriod(
  dateOfHire: Date | null | undefined,
  eventDate: Date,
): boolean | null {
  if (!dateOfHire) {
    return null;
  }

  const days =
    daysBetween(
      dateOfHire,
      eventDate,
    );

  return days >= 0 && days < 90;
}

export function calculateAttendancePoints(
  input: AttendanceEventInput,
): number {
  if (
    input.protectedAbsence ||
    input.excusedByManagement
  ) {
    return 0;
  }

  if (
    input.eventType ===
    "NO_CALL_NO_SHOW"
  ) {
    /*
     * NCNS follows its own corrective-action
     * progression. Do not invent ordinary
     * attendance points for it.
     */
    return 0;
  }

  if (
    input.eventType === "ABSENT"
  ) {
    return 1;
  }

  const minutes =
    input.minutesMissed;

  if (
    minutes === null ||
    minutes === undefined
  ) {
    /*
     * We cannot safely infer points for
     * tardy/early-departure events without
     * the duration.
     */
    return 0;
  }

  if (minutes < 6) {
    return 0;
  }

  if (minutes <= 120) {
    return 0.5;
  }

  return 1;
}

function eventIsCountable(
  event: AttendanceHistoryEvent,
) {
  return !(
    event.protectedAbsence ||
    event.excusedByManagement
  );
}

function uniqueOccurrenceEvents(
  events: AttendanceHistoryEvent[],
) {
  const seenGroups =
    new Set<string>();

  return events.filter(
    (event) => {
      if (
        !eventIsCountable(event)
      ) {
        return false;
      }

      const group =
        event.occurrenceGroupKey?.trim();

      if (!group) {
        return true;
      }

      if (
        seenGroups.has(group)
      ) {
        return false;
      }

      seenGroups.add(group);

      return true;
    },
  );
}

export function calculateActivePoints(
  events: AttendanceHistoryEvent[],
  asOfDate: Date,
) {
  const windowStart =
    subtractUtcMonths(
      asOfDate,
      6,
    );

  const eligible =
    events.filter(
      (event) =>
        isSameOrAfter(
          event.entryDate,
          windowStart,
        ) &&
        isSameOrBefore(
          event.entryDate,
          asOfDate,
        ),
    );

  const occurrences =
    uniqueOccurrenceEvents(
      eligible,
    );

  return occurrences.reduce(
    (total, event) =>
      total +
      Math.max(
        0,
        event.policyPoints ?? 0,
      ),
    0,
  );
}

export function getAttendanceWindowSummary(
  events: AttendanceHistoryEvent[],
  asOfDate: Date,
) {
  const windowEnd =
    startOfUtcDay(asOfDate);

  const windowStart =
    subtractUtcMonths(
      windowEnd,
      6,
    );

  return {
    windowStart,
    windowEnd,

    activePoints:
      calculateActivePoints(
        events,
        windowEnd,
      ),
  };
}

function activeCorrectiveActions(
  actions: CorrectiveActionHistory[],
  asOfDate: Date,
) {
  const windowStart =
    subtractUtcMonths(
      asOfDate,
      6,
    );

  return actions
    .filter(
      (action) =>
        action.status === "ISSUED" &&
        isSameOrAfter(
          action.effectiveDate,
          windowStart,
        ) &&
        isSameOrBefore(
          action.effectiveDate,
          asOfDate,
        ) &&
        (
          !action.expiresAt ||
          isSameOrAfter(
            action.expiresAt,
            asOfDate,
          )
        ),
    )
    .sort(
      (a, b) =>
        a.effectiveDate.getTime() -
        b.effectiveDate.getTime(),
    );
}

function normalPointRecommendation(
  points: number,
  qualifyingPeriod: boolean,
): CorrectiveActionLevel | null {
  if (qualifyingPeriod) {
    if (points >= 6) {
      return "TERMINATION";
    }

    if (points >= 4) {
      return "FINAL_WRITTEN_WARNING";
    }

    if (points >= 2) {
      return "WRITTEN_WARNING";
    }

    if (points >= 1) {
      return "VERBAL_COACHING";
    }

    return null;
  }

  if (points >= 10) {
    return "TERMINATION";
  }

  if (points >= 8) {
    return "FINAL_WRITTEN_WARNING";
  }

  if (points >= 6) {
    return "WRITTEN_WARNING";
  }

  if (points >= 4) {
    return "WRITTEN_COACHING";
  }

  if (points >= 2) {
    return "VERBAL_COACHING";
  }

  return null;
}

function actionRank(
  level: CorrectiveActionLevel,
) {
  const ranks:
    Record<
      CorrectiveActionLevel,
      number
    > = {
      VERBAL_COACHING: 1,
      WRITTEN_COACHING: 2,
      WRITTEN_WARNING: 3,
      FINAL_WRITTEN_WARNING: 4,
      TERMINATION: 5,
    };

  return ranks[level];
}

function nextActionLevel(
  current: CorrectiveActionLevel,
): CorrectiveActionLevel {
  switch (current) {
    case "VERBAL_COACHING":
      return "WRITTEN_COACHING";

    case "WRITTEN_COACHING":
      return "WRITTEN_WARNING";

    case "WRITTEN_WARNING":
      return "FINAL_WRITTEN_WARNING";

    case "FINAL_WRITTEN_WARNING":
    case "TERMINATION":
      return "TERMINATION";
  }
}

function applyActiveActionEscalation(
  pointRecommendation:
    CorrectiveActionLevel | null,
  actions: CorrectiveActionHistory[],
  asOfDate: Date,
) {
  const active =
    activeCorrectiveActions(
      actions,
      asOfDate,
    );

  const latest =
    active.at(-1);

  if (!latest) {
    return pointRecommendation;
  }

  const escalated =
    nextActionLevel(
      latest.actionLevel,
    );

  if (!pointRecommendation) {
    return escalated;
  }

  return actionRank(escalated) >
    actionRank(pointRecommendation)
    ? escalated
    : pointRecommendation;
}

function ncnsEvents(
  events: AttendanceHistoryEvent[],
  asOfDate: Date,
) {
  const windowStart =
    subtractUtcMonths(
      asOfDate,
      6,
    );

  return events
    .filter(
      (event) =>
        event.eventType ===
          "NO_CALL_NO_SHOW" &&
        eventIsCountable(event) &&
        isSameOrAfter(
          event.entryDate,
          windowStart,
        ) &&
        isSameOrBefore(
          event.entryDate,
          asOfDate,
        ),
    )
    .sort(
      (a, b) =>
        a.entryDate.getTime() -
        b.entryDate.getTime(),
    );
}

function calculateConsecutiveNcns(
  events: AttendanceHistoryEvent[],
) {
  if (events.length === 0) {
    return 0;
  }

  let consecutive = 1;

  for (
    let index =
      events.length - 1;
    index > 0;
    index--
  ) {
    const current =
      events[index];

    const previous =
      events[index - 1];

    const difference =
      daysBetween(
        previous.entryDate,
        current.entryDate,
      );

    /*
     * This is calendar-day continuity only.
     * The UI/service layer must verify that
     * these were consecutive scheduled shifts
     * before treating this as job abandonment.
     */
    if (difference !== 1) {
      break;
    }

    consecutive++;
  }

  return consecutive;
}

function ncnsRecommendation(
  count: number,
  qualifyingPeriod: boolean,
  activeActions:
    CorrectiveActionHistory[],
): CorrectiveActionLevel | null {
  const hasActiveFinal =
    activeActions.some(
      (action) =>
        action.status === "ISSUED" &&
        action.actionLevel ===
          "FINAL_WRITTEN_WARNING",
    );

  if (
    hasActiveFinal &&
    count >= 1
  ) {
    return "TERMINATION";
  }

  if (qualifyingPeriod) {
    if (count >= 2) {
      return "TERMINATION";
    }

    if (count >= 1) {
      return "FINAL_WRITTEN_WARNING";
    }

    return null;
  }

  if (count >= 3) {
    return "TERMINATION";
  }

  if (count === 2) {
    return "FINAL_WRITTEN_WARNING";
  }

  if (count === 1) {
    return "WRITTEN_WARNING";
  }

  return null;
}

export function getCurrentAttendanceStanding(
  history: AttendanceHistoryEvent[],
  correctiveActions:
    CorrectiveActionHistory[],
  dateOfHire: Date | null,
  asOfDate: Date,
) {
  const standingDate =
    startOfUtcDay(asOfDate);

  const qualifyingPeriod =
    isInQualifyingPeriod(
      dateOfHire,
      standingDate,
    );

  const activePoints =
    calculateActivePoints(
      history,
      standingDate,
    );

  const activeActions =
    activeCorrectiveActions(
      correctiveActions,
      standingDate,
    );

  const ncns =
    ncnsEvents(
      history,
      standingDate,
    );

  const consecutiveNcns =
    calculateConsecutiveNcns(
      ncns,
    );

  if (qualifyingPeriod === null) {
    return {
      activePoints,
      qualifyingPeriod,
      ncnsCount: ncns.length,
      consecutiveNcns,
      recommendedAction: null,
      recommendationReason:
        "Date of hire is missing. HIVE cannot determine the current corrective-action level needed.",
    };
  }

  const pointRecommendation =
    normalPointRecommendation(
      activePoints,
      qualifyingPeriod,
    );

  const latestActiveAction =
  activeActions.at(-1) ?? null;

const hasCountableOccurrenceAfterActiveAction =
  latestActiveAction
    ? history.some(
        (event) =>
          eventIsCountable(event) &&
          event.entryDate.getTime() >
            latestActiveAction.effectiveDate.getTime() &&
          isSameOrBefore(
            event.entryDate,
            standingDate,
          ),
      )
    : false;

const pointStanding =
  pointRecommendation &&
  latestActiveAction &&
  hasCountableOccurrenceAfterActiveAction
    ? applyActiveActionEscalation(
        pointRecommendation,
        correctiveActions,
        standingDate,
      )
    : pointRecommendation;

  const ncnsStanding =
    ncnsRecommendation(
      ncns.length,
      qualifyingPeriod,
      activeActions,
    );

  let recommendedAction =
    pointStanding;

  if (
    ncnsStanding &&
    (
      !recommendedAction ||
      actionRank(ncnsStanding) >
        actionRank(
          recommendedAction,
        )
    )
  ) {
    recommendedAction =
      ncnsStanding;
  }

    const correctiveActionDue =
    !latestActiveAction
      ? recommendedAction
      : hasCountableOccurrenceAfterActiveAction &&
          recommendedAction &&
          actionRank(
            recommendedAction,
          ) >
            actionRank(
              latestActiveAction.actionLevel,
            )
        ? recommendedAction
        : null;

  return {
    activePoints,
    qualifyingPeriod,
    ncnsCount: ncns.length,
    consecutiveNcns,
    recommendedAction,
    correctiveActionDue,
    recommendationReason:
      recommendedAction
        ? `Current attendance standing indicates ${recommendedAction}.`
        : "No corrective action is currently indicated.",
  };
}

export function evaluateAttendance(
  currentEvent: AttendanceEventInput,
  history: AttendanceHistoryEvent[],
  correctiveActions:
    CorrectiveActionHistory[],
): AttendanceEvaluation {
  const warnings: string[] = [];

  const eventDate =
    startOfUtcDay(
      currentEvent.entryDate,
    );

  const qualifyingPeriod =
    isInQualifyingPeriod(
      currentEvent.dateOfHire,
      eventDate,
    );

  if (
    qualifyingPeriod === null
  ) {
    warnings.push(
      "Date of hire is missing. HIVE cannot determine whether the employee is in the initial 90-day qualifying period.",
    );
  }

  const protectedOrExcused =
    Boolean(
      currentEvent.protectedAbsence ||
        currentEvent.excusedByManagement,
    );

  const points =
    calculateAttendancePoints(
      currentEvent,
    );

  if (
    (
      currentEvent.eventType ===
        "LATE" ||
      currentEvent.eventType ===
        "LATE_FROM_LUNCH" ||
      currentEvent.eventType ===
        "LEFT_EARLY"
    ) &&
    currentEvent.minutesMissed ==
      null
  ) {
    warnings.push(
      "Minutes missed are required before HIVE can determine attendance points for this event.",
    );
  }

  const currentHistoryEvent:
    AttendanceHistoryEvent = {
      entryDate: eventDate,
      eventType:
        currentEvent.eventType,
      policyPoints: points,
      protectedAbsence:
        currentEvent.protectedAbsence,
      excusedByManagement:
        currentEvent.excusedByManagement,
      occurrenceGroupKey:
        currentEvent.occurrenceGroupKey,
    };

  const combinedHistory = [
    ...history,
    currentHistoryEvent,
  ];

  const activePoints =
    calculateActivePoints(
      combinedHistory,
      eventDate,
    );

  const activeWindowStart =
    subtractUtcMonths(
      eventDate,
      6,
    );

  const activeWindowEnd =
    eventDate;

  const ncns =
    ncnsEvents(
      combinedHistory,
      eventDate,
    );

  const consecutiveNcns =
    calculateConsecutiveNcns(
      ncns,
    );

  if (consecutiveNcns >= 3) {
    warnings.push(
      "Three consecutive calendar-day NCNS events were detected. Confirm that these were three consecutive scheduled shifts before applying the job-abandonment provision.",
    );
  }

  let recommendedAction:
    CorrectiveActionLevel | null =
      null;

  let recommendationReason =
    "No corrective action is currently recommended.";

  if (protectedOrExcused) {
    recommendationReason =
      "This event is protected or excused and does not generate attendance points.";
  } else if (
    qualifyingPeriod === null
  ) {
    recommendationReason =
      "A corrective-action recommendation cannot be finalized until the employee's date of hire is recorded.";
  } else if (
    currentEvent.eventType ===
    "NO_CALL_NO_SHOW"
  ) {
    recommendedAction =
      ncnsRecommendation(
        ncns.length,
        qualifyingPeriod,
        activeCorrectiveActions(
          correctiveActions,
          eventDate,
        ),
      );

    recommendationReason =
      recommendedAction
        ? `NCNS policy progression indicates ${recommendedAction}.`
        : "No NCNS corrective action is currently indicated.";
    } else if (points > 0) {
    const pointRecommendation =
      normalPointRecommendation(
        activePoints,
        qualifyingPeriod,
      );

    recommendedAction =
      applyActiveActionEscalation(
        pointRecommendation,
        correctiveActions,
        eventDate,
      );

    if (recommendedAction) {
      recommendationReason =
        `Active attendance points: ${activePoints}. ` +
        `Policy progression indicates ${recommendedAction}.`;
    }
  } else {
    recommendationReason =
      "This event does not generate attendance points, so no corrective-action escalation is recommended.";
  }

  return {
    policyVersion:
      ATTENDANCE_POLICY_VERSION,

    points,

    qualifyingPeriod,

    protectedOrExcused,

    occurrenceCounted:
      !protectedOrExcused,

    activePoints,

    activeWindowStart,

    activeWindowEnd,

    noCallNoShowCount:
      ncns.length,

    consecutiveNoCallNoShowCount:
      consecutiveNcns,

    recommendedAction,

    recommendationReason,

    warnings,
  };
}
