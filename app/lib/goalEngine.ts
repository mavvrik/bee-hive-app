export interface GoalEngineInput {
  monthlyGoalLiters: number;
  monthlyGoalDonors: number;
  weeksInPeriod: number;
  collectionDaysPerWeek: number;
}

export interface GoalEngineResult {
  monthlyLiters: number;
  weeklyLiters: number;
  dailyLiters: number;

  monthlyDonors: number;
  weeklyDonors: number;
  dailyDonors: number;

  litersPerDonor: number;
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

export function getGoals(
  input: GoalEngineInput,
): GoalEngineResult {
  const weeklyLiters =
    safeDivide(
      input.monthlyGoalLiters,
      input.weeksInPeriod,
    );

  const dailyLiters =
    safeDivide(
      weeklyLiters,
      input.collectionDaysPerWeek,
    );

  const weeklyDonors =
    safeDivide(
      input.monthlyGoalDonors,
      input.weeksInPeriod,
    );

  const dailyDonors =
    safeDivide(
      weeklyDonors,
      input.collectionDaysPerWeek,
    );

  const litersPerDonor =
    safeDivide(
      input.monthlyGoalLiters,
      input.monthlyGoalDonors,
    );

  return {
    monthlyLiters:
      input.monthlyGoalLiters,

    weeklyLiters,
    dailyLiters,

    monthlyDonors:
      input.monthlyGoalDonors,

    weeklyDonors,
    dailyDonors,

    litersPerDonor,
  };
}