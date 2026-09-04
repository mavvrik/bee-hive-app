export type LswPatternObservation = {
  dayOfWeek: number;
  time: string;
  minuteOfDay: number;
  visits: number;
  units: number;
};

export type LswStaffingInterval = {
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

/*
 * HIVE LSW-HYBRID MODEL
 *
 * LSW-derived formulas remain the source for:
 *   - Forecast donors
 *   - Reception requirement
 *   - Donor Floor requirement
 *
 * HIVE operational guardrail added:
 *   - MSA can NEVER be zero while the center is operational.
 *
 * Processing and Leadership are still left at zero in this temporary
 * comparison engine until their HIVE rules are deliberately layered in.
 */

function excelRoundPositive(value: number) {
  return Math.round(Math.max(0, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function isWeekend(dayOfWeek: number) {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function doorOpenMinute(dayOfWeek: number) {
  return isWeekend(dayOfWeek)
    ? 7 * 60
    : 6 * 60;
}

function doorCloseMinute(dayOfWeek: number) {
  return isWeekend(dayOfWeek)
    ? 15 * 60
    : 19 * 60;
}

/*
 * Locked MSA rule:
 *
 * Weekdays:
 * - MSA arrives 10 minutes before 6:00 AM opening => 5:50 AM
 * - MSA must remain continuously available throughout operating hours
 *
 * Weekends:
 * - MSA arrives 10 minutes before 7:00 AM opening => 6:50 AM
 * - MSA must remain continuously available throughout operating hours
 *
 * Because Arrival Pattern rows are half-hour based, a 5:50 or 6:50
 * pre-open requirement will not necessarily have its own row.
 * The schedule generator handles exact shift start times.
 *
 * This requirements layer therefore marks the MSA requirement as 1
 * for every operating half-hour interval and never 0 while open.
 */
function msaRequirementForInterval(
  dayOfWeek: number,
  minuteOfDay: number,
) {
  const open = doorOpenMinute(dayOfWeek);
  const close = doorCloseMinute(dayOfWeek);

  return minuteOfDay >= open &&
    minuteOfDay < close
    ? 1
    : 0;
}

export function buildLswStaffingRequirements({
  observations,
  coverageWeeks,
  projectedVolumeChange = 0,
}: {
  observations: LswPatternObservation[];
  coverageWeeks: number;
  projectedVolumeChange?: number;
}): LswStaffingInterval[] {
  const safeWeeks = Math.max(1, coverageWeeks);

  return observations.map((row) => {
    const baseVisits = row.visits / safeWeeks;
    const baseUnits = row.units / safeWeeks;

    /*
     * LSW Forecast Donors
     *
     * ROUND(
     *   4-week half-hour donor total / 4
     *   × (1 + projected-volume-change),
     *   0
     * )
     *
     * coverageWeeks is used so the importer can safely support
     * more than exactly 4 weeks of source data.
     */
    const forecastDonors =
      excelRoundPositive(
        baseVisits *
          (1 + projectedVolumeChange),
      );

    /*
     * LSW Reception formula:
     *
     * ROUND(
     *   forecast donors × 5.6 × 1.10 × 1.125 / 60,
     *   0
     * )
     */
    const receptionRequired =
      excelRoundPositive(
        (
          forecastDonors *
          5.6 *
          1.1 *
          1.125
        ) / 60,
      );

    /*
     * LSW Donor Floor formula:
     *
     * ROUND(
     *   forecast donors × 13.65 / 49 × 1.125,
     *   0
     * )
     *
     * If the result is exactly 1,
     * the workbook forces it to 2.
     */
    const rawFloor =
      excelRoundPositive(
        (
          forecastDonors *
          13.65 *
          1.125
        ) / 49,
      );

    const donorFloorRequired =
      rawFloor === 1
        ? 2
        : rawFloor;

    /*
     * HIVE operational addition:
     * MSA cannot be 0 while center is operational.
     */
    const msaMinimum =
      msaRequirementForInterval(
        row.dayOfWeek,
        row.minuteOfDay,
      );

    const notes: string[] = [];

    if (
      forecastDonors > 0 &&
      receptionRequired === 0
    ) {
      notes.push(
        "LSW formula rounds Reception requirement to 0 for this interval.",
      );
    }

    if (rawFloor === 1) {
      notes.push(
        "LSW Donor Floor calculation produced 1; workbook minimum changed it to 2.",
      );
    }

    if (msaMinimum === 1) {
      notes.push(
        "HIVE guardrail: minimum 1 qualified MSA while center is operational.",
      );
    }

    return {
      dayOfWeek: row.dayOfWeek,
      dayName:
        DAY_NAMES[row.dayOfWeek] ??
        `Day ${row.dayOfWeek}`,
      time: row.time,
      minuteOfDay: row.minuteOfDay,
      averageVisits: round2(forecastDonors),
      averageUnits: round2(baseUnits),

      receptionBaseline:
        receptionRequired,

      floorMinimum:
        donorFloorRequired,

      msaMinimum,

      // Not layered into this hybrid yet.
      processingMinimum: 0,
      leadershipMinimum: 0,

      notes,
    };
  });
}

export const lswFormulaReference = {
  model:
    "LSW Reception + LSW Donor Floor + mandatory HIVE MSA coverage",
  forecast:
    "ROUND(average half-hour donor demand × (1 + projected volume change), 0)",
  reception:
    "ROUND(forecast donors × 5.6 × 1.10 × 1.125 / 60, 0)",
  donorFloor:
    "ROUND(forecast donors × 13.65 / 49 × 1.125, 0); if result = 1, use 2",
  msa:
    "HIVE hard rule: minimum 1 qualified MSA continuously while the center is operating; exact opener is 10 minutes before doors open.",
  notYetLayered:
    "Processing and Leadership are intentionally not yet layered into this hybrid comparison mode.",
} as const;
