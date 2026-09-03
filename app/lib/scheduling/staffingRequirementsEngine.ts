export type PatternObservation = {
  dayOfWeek: number;
  time: string;
  minuteOfDay: number;
  visits: number;
  units: number;
};

export type StaffingInterval = {
  dayOfWeek: number;
  dayName: string;
  time: string;
  minuteOfDay: number;
  averageVisits: number;
  averageUnits: number;
  receptionBaseline: number;
  msaMinimum: number;
  floorMinimum: number;
  processingMinimum: number;
  leadershipMinimum: number;
  notes: string[];
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Corporate Scheduling Tool baseline discovered in the workbook.
// This is intentionally isolated here so HIVE can compare/replace it later.
const CSL_RECEPTION_MINUTES_PER_VISIT = 5.6;
const CSL_RECEPTION_ALLOWANCE = 1.10;
const CSL_RECEPTION_SECONDARY_ALLOWANCE = 1.125;
const INTERVAL_MINUTES = 30;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function getCoverageWeeks(
  periodStart: Date | null | undefined,
  periodEnd: Date | null | undefined,
) {
  if (!periodStart || !periodEnd) return 1;

  const start = new Date(
    Date.UTC(
      periodStart.getUTCFullYear(),
      periodStart.getUTCMonth(),
      periodStart.getUTCDate(),
    ),
  );

  const end = new Date(
    Date.UTC(
      periodEnd.getUTCFullYear(),
      periodEnd.getUTCMonth(),
      periodEnd.getUTCDate(),
    ),
  );

  const days =
    Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
    );

  return Math.max(1, days / 7);
}

export function buildStaffingRequirements(
  observations: PatternObservation[],
  coverageWeeks: number,
): StaffingInterval[] {
  const safeWeeks = Math.max(1, coverageWeeks);

  return observations.map((row) => {
    // Arrival Patterns are aggregated weekday/time observations across the
    // import coverage period. Convert the aggregate into an average occurrence
    // of that weekday before applying staffing logic.
    const averageVisits = row.visits / safeWeeks;
    const averageUnits = row.units / safeWeeks;

    const receptionWorkMinutes =
      averageVisits *
      CSL_RECEPTION_MINUTES_PER_VISIT *
      CSL_RECEPTION_ALLOWANCE *
      CSL_RECEPTION_SECONDARY_ALLOWANCE;

    const calculatedReceptionBaseline = Math.max(
      1,
      Math.ceil(receptionWorkMinutes / INTERVAL_MINUTES),
    );

    // Riviera Beach Reception closing rule:
    // - Monday-Friday doors close at 7:00 PM.
    // - Saturday-Sunday doors close at 3:00 PM.
    // - Reception remains only long enough to finish the final donor screening.
    // - Normal planning ceiling is 30 minutes after doors close.
    // - Beginning at that ceiling, planned Reception coverage is zero.
    //
    // A manager may release Reception earlier once the final donor is screened.
    const isWeekday = row.dayOfWeek >= 1 && row.dayOfWeek <= 5;
    const isWeekend = row.dayOfWeek === 0 || row.dayOfWeek === 6;

    const weekdayReceptionCeiling = 19 * 60 + 30; // 7:30 PM
    const weekendReceptionCeiling = 15 * 60 + 30; // 3:30 PM

    const isAfterReceptionCeiling =
      (isWeekday && row.minuteOfDay >= weekdayReceptionCeiling) ||
      (isWeekend && row.minuteOfDay >= weekendReceptionCeiling);

    const receptionBaseline = isAfterReceptionCeiling
      ? 0
      : calculatedReceptionBaseline;

    const notes: string[] = [];

    if (isWeekday && row.minuteOfDay === 19 * 60) {
      notes.push(
        "Reception closing tail: keep up to one qualified Reception worker only until the final donor is screened; normal weekday ceiling is 7:30 PM.",
      );
    }

    if (isWeekend && row.minuteOfDay === 15 * 60) {
      notes.push(
        "Reception closing tail: keep up to one qualified Reception worker only until the final donor is screened; normal weekend ceiling is 3:30 PM.",
      );
    }

    if (isAfterReceptionCeiling) {
      notes.push(
        isWeekend
          ? "Planned Reception coverage ends at 3:30 PM on normal weekends."
          : "Planned Reception coverage ends at 7:30 PM on normal weekdays.",
      );
    } else if (receptionBaseline > 1) {
      notes.push("CSL Reception baseline indicates added front-end capacity.");
    }

    if (averageVisits >= 8) {
      notes.push(
        "High arrival pressure: new-donor mix and MSA exceptions can create a bottleneck.",
      );
    }

    if (averageUnits >= 8) {
      notes.push(
        "Processing workload is elevated; packing and the 30-minute bottle queue still require operational review.",
      );
    }

    // Riviera Beach normal operating boundaries.
    // Weekdays: doors 6:00 AM–7:00 PM.
    // Weekends: doors 7:00 AM–3:00 PM.
    //
    // Required pre-open arrival times:
    // Reception: 60 min before doors
    // Donor Floor: 30 min before doors
    // MSA: 10 min before doors
    // Processing: 10 min before doors
    // Leadership: 60 min before doors
    //
    // Closing:
    // Reception: screening-completion tail, max 30 min after doors close.
    // Floor: continues while donors are actively donating (S3A currently
    //        carries the hard minimum through the 30-minute post-close tail).
    // MSA: required through operating hours only in this first requirements layer.
    // Processing: carried through the 30-minute post-close tail so the final
    //             donation/processing handoff is not incorrectly zeroed.
    // Leadership: carried through the 30-minute post-close tail because the
    //             leader remains until the final donor leaves.
    const doorOpenMinute = isWeekend ? 7 * 60 : 6 * 60;
    const doorCloseMinute = isWeekend ? 15 * 60 : 19 * 60;

    const receptionStart = doorOpenMinute - 60;
    const floorStart = doorOpenMinute - 30;
    const msaStart = doorOpenMinute - 10;
    const processingStart = doorOpenMinute - 10;
    const leadershipStart = doorOpenMinute - 60;

    const postCloseTailEnd = doorCloseMinute + 30;

    const receptionRequirement =
      row.minuteOfDay >= receptionStart &&
      row.minuteOfDay < (isWeekend ? weekendReceptionCeiling : weekdayReceptionCeiling)
        ? receptionBaseline
        : 0;

    const msaRequirement =
      row.minuteOfDay >= msaStart && row.minuteOfDay < doorCloseMinute
        ? 1
        : 0;

    const floorRequirement =
      row.minuteOfDay >= floorStart && row.minuteOfDay < postCloseTailEnd
        ? 2
        : 0;

    const processingRequirement =
      row.minuteOfDay >= processingStart && row.minuteOfDay < postCloseTailEnd
        ? 1
        : 0;

    const leadershipRequirement =
      row.minuteOfDay >= leadershipStart && row.minuteOfDay < postCloseTailEnd
        ? 1
        : 0;

    if (isWeekend && row.minuteOfDay < receptionStart) {
      notes.push(
        "Weekend Reception is not required before the 6:00 AM opener arrival.",
      );
    }

    return {
      dayOfWeek: row.dayOfWeek,
      dayName: DAY_NAMES[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`,
      time: row.time,
      minuteOfDay: row.minuteOfDay,
      averageVisits: round2(averageVisits),
      averageUnits: round2(averageUnits),
      receptionBaseline: receptionRequirement,
      msaMinimum: msaRequirement,
      floorMinimum: floorRequirement,
      processingMinimum: processingRequirement,
      leadershipMinimum: leadershipRequirement,
      notes,
    };
  });
}

export const staffingModelMetadata = {
  reception: {
    status: "ADAPT",
    explanation:
      "Uses the CSL workbook Reception baseline as a starting signal. HIVE allows a screening-completion tail after doors close: weekdays 7:00–7:30 PM and weekends 3:00–3:30 PM. Reception may be released earlier once the final donor is screened. HIVE will later layer new-donor mix, MSA demand and the 25-minute Check-in-to-Stick target over it.",
  },
  msa: {
    status: "HIVE RULE",
    explanation:
      "At least one qualified MSA is required while the center operates. Additional MSA demand is not yet inferred from Visits alone.",
  },
  floor: {
    status: "HIVE RULE",
    explanation:
      "Minimum two qualified floor workers. HIVE will next add concurrent-donor modeling using the 6:1 rule and 35–45 minute floor occupancy.",
  },
  processing: {
    status: "HIVE RULE",
    explanation:
      "Minimum one Processing-qualified worker while donations occur. Units are the demand signal; throughput and packing load remain intentionally un-hard-coded.",
  },
  leadership: {
    status: "HIVE RULE",
    explanation:
      "At least one CM/ACM/CS must be physically present. Management operational coverage remains last-resort capacity.",
  },
} as const;
