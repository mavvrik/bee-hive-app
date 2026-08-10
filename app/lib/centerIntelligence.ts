import {
  getGoals,
  type GoalEngineResult,
} from "@/app/lib/goalEngine";

import {
  getProjection,
  type ProjectionResult,
} from "@/app/lib/projectionEngine";

export interface CenterIntelligenceInput {
  monthlyGoalLiters: number;
  monthlyGoalDonors: number;
  weeksInPeriod: number;
  collectionDaysPerWeek: number;

  currentMonthLiters: number;
  currentWeekLiters: number;
  currentDayLiters: number;
  currentDayDonors: number;

  /*
   * Live operational inputs used by the
   * pace-based projection engine.
   */
  successfulSticks: number;
  unsuccessfulSticks: number;
  lostVolume: number;
  historicalLitersPerStick: number;
  currentHour: number;
  openingHour: number;
  closingHour: number;
}

export interface CenterIntelligenceResult {
  goals: GoalEngineResult;

  center: {
    currentMonthLiters: number;
    currentWeekLiters: number;
    currentDayLiters: number;
    currentDayDonors: number;

    monthlyLitersRemaining: number;
    weeklyLitersRemaining: number;
    dailyLitersRemaining: number;
    dailyDonorsRemaining: number;

    monthlyCompletionPercentage: number;
    weeklyCompletionPercentage: number;
    dailyCompletionPercentage: number;
  };

  projection: ProjectionResult;
}

function safeDivide(
  numerator: number,
  denominator: number,
) {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function roundToTwoDecimals(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function clampMinimumZero(
  value: number,
) {
  return Math.max(0, value);
}

export function getCenterIntelligence(
  input: CenterIntelligenceInput,
): CenterIntelligenceResult {
  /*
   * Goal Engine
   *
   * Establishes monthly, weekly, and daily
   * center targets.
   */
  const goals = getGoals({
    monthlyGoalLiters:
      input.monthlyGoalLiters,

    monthlyGoalDonors:
      input.monthlyGoalDonors,

    weeksInPeriod:
      input.weeksInPeriod,

    collectionDaysPerWeek:
      input.collectionDaysPerWeek,
  });

  /*
   * Projection Engine
   *
   * Uses live operational activity and
   * current pace to estimate where the
   * CENTER will finish at closing.
   */
  const projection = getProjection({
    successfulSticks:
      input.successfulSticks,

    unsuccessfulSticks:
      input.unsuccessfulSticks,

    lostVolume:
      input.lostVolume,

    historicalLitersPerStick:
      input.historicalLitersPerStick,

    currentHour:
      input.currentHour,

    openingHour:
      input.openingHour,

    closingHour:
      input.closingHour,

    dailyGoalLiters:
      goals.dailyLiters,
  });

  /*
   * Center Intelligence
   *
   * All liter production remains
   * center-level only.
   */
  return {
    goals,

    center: {
      currentMonthLiters:
        roundToTwoDecimals(
          input.currentMonthLiters,
        ),

      currentWeekLiters:
        roundToTwoDecimals(
          input.currentWeekLiters,
        ),

      currentDayLiters:
        roundToTwoDecimals(
          input.currentDayLiters,
        ),

      currentDayDonors:
        input.currentDayDonors,

      monthlyLitersRemaining:
        roundToTwoDecimals(
          clampMinimumZero(
            goals.monthlyLiters -
              input.currentMonthLiters,
          ),
        ),

      weeklyLitersRemaining:
        roundToTwoDecimals(
          clampMinimumZero(
            goals.weeklyLiters -
              input.currentWeekLiters,
          ),
        ),

      dailyLitersRemaining:
        roundToTwoDecimals(
          clampMinimumZero(
            goals.dailyLiters -
              input.currentDayLiters,
          ),
        ),

      dailyDonorsRemaining:
        Math.ceil(
          clampMinimumZero(
            goals.dailyDonors -
              input.currentDayDonors,
          ),
        ),

      monthlyCompletionPercentage:
        roundToTwoDecimals(
          safeDivide(
            input.currentMonthLiters,
            goals.monthlyLiters,
          ) * 100,
        ),

      weeklyCompletionPercentage:
        roundToTwoDecimals(
          safeDivide(
            input.currentWeekLiters,
            goals.weeklyLiters,
          ) * 100,
        ),

      dailyCompletionPercentage:
        roundToTwoDecimals(
          safeDivide(
            input.currentDayLiters,
            goals.dailyLiters,
          ) * 100,
        ),
    },

    projection,
  };
}