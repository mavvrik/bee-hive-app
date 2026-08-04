import {
  allocateDailyGoal,
  type ContributorAllocation,
} from "@/app/lib/allocationEngine";

import {
  getGoals,
  type GoalEngineResult,
} from "@/app/lib/goalEngine";

import {
  getProjection,
  type ProjectionResult,
} from "@/app/lib/projectionEngine";

export interface CenterContributorInput {
  id: number;
  name: string;
  weight: number;
  currentLiters: number;
}

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

  contributors: CenterContributorInput[];
}

export interface ContributorIntelligence
  extends ContributorAllocation {
  currentLiters: number;
  litersRemaining: number;
  completionPercentage: number;
  status:
    | "AHEAD"
    | "ON_TRACK"
    | "BEHIND";
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

  contributors: ContributorIntelligence[];
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

function getContributorStatus(
  completionPercentage: number,
): ContributorIntelligence["status"] {
  if (completionPercentage >= 105) {
    return "AHEAD";
  }

  if (completionPercentage >= 90) {
    return "ON_TRACK";
  }

  return "BEHIND";
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

    contributors:
      input.contributors.length,
  });

  /*
   * Allocation Engine
   *
   * Divides the daily center target among
   * participating contributors according
   * to their allocation weights.
   */
  const allocationResult =
    allocateDailyGoal({
      dailyCenterGoalLiters:
        goals.dailyLiters,

      contributors:
        input.contributors.map(
          (contributor) => ({
            id: contributor.id,
            name: contributor.name,
            weight: contributor.weight,
          }),
        ),
    });

  /*
   * Projection Engine
   *
   * Uses live operational activity and
   * the current pace to estimate where
   * the center will finish at closing.
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
   * Create a fast lookup for each
   * contributor's current production.
   */
  const contributorCurrentLiters =
    new Map(
      input.contributors.map(
        (contributor) => [
          contributor.id,
          contributor.currentLiters,
        ],
      ),
    );

  /*
   * Contributor Intelligence
   *
   * Combines allocation targets with
   * current contributor performance.
   */
  const contributors:
    ContributorIntelligence[] =
    allocationResult.allocations.map(
      (allocation) => {
        const currentLiters =
          contributorCurrentLiters.get(
            allocation.id,
          ) ?? 0;

        const completionPercentage =
          safeDivide(
            currentLiters,
            allocation.dailyTargetLiters,
          ) * 100;

        return {
          ...allocation,

          currentLiters:
            roundToTwoDecimals(
              currentLiters,
            ),

          litersRemaining:
            roundToTwoDecimals(
              clampMinimumZero(
                allocation.dailyTargetLiters -
                  currentLiters,
              ),
            ),

          completionPercentage:
            roundToTwoDecimals(
              completionPercentage,
            ),

          status:
            getContributorStatus(
              completionPercentage,
            ),
        };
      },
    );

  /*
   * Center Intelligence
   *
   * Consolidates official production,
   * goal performance, projection data,
   * and contributor performance.
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

    contributors,
  };
}