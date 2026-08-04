export interface AllocationContributor {
  id: number;
  name: string;
  weight: number;
}

export interface ContributorAllocation {
  id: number;
  name: string;
  weight: number;
  weightPercentage: number;
  dailyTargetLiters: number;
}

export interface AllocationEngineInput {
  dailyCenterGoalLiters: number;
  contributors: AllocationContributor[];
}

export interface AllocationEngineResult {
  dailyCenterGoalLiters: number;
  totalWeight: number;
  allocations: ContributorAllocation[];
}

function roundToTwoDecimals(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function allocateDailyGoal(
  input: AllocationEngineInput,
): AllocationEngineResult {
  const validContributors =
    input.contributors.filter(
      (contributor) =>
        Number.isFinite(contributor.weight) &&
        contributor.weight > 0,
    );

  const totalWeight =
    validContributors.reduce(
      (sum, contributor) =>
        sum + contributor.weight,
      0,
    );

  if (
    input.dailyCenterGoalLiters <= 0 ||
    totalWeight <= 0 ||
    validContributors.length === 0
  ) {
    return {
      dailyCenterGoalLiters:
        input.dailyCenterGoalLiters,
      totalWeight,
      allocations: validContributors.map(
        (contributor) => ({
          id: contributor.id,
          name: contributor.name,
          weight: contributor.weight,
          weightPercentage: 0,
          dailyTargetLiters: 0,
        }),
      ),
    };
  }

  const allocations =
    validContributors.map(
      (contributor) => {
        const weightPercentage =
          contributor.weight / totalWeight;

        const dailyTargetLiters =
          input.dailyCenterGoalLiters *
          weightPercentage;

        return {
          id: contributor.id,
          name: contributor.name,
          weight: contributor.weight,
          weightPercentage:
            roundToTwoDecimals(
              weightPercentage * 100,
            ),
          dailyTargetLiters:
            roundToTwoDecimals(
              dailyTargetLiters,
            ),
        };
      },
    );

  /*
   * Rounding individual allocations can create
   * a small difference from the center goal.
   *
   * Apply that difference to the final
   * contributor so the allocations always add
   * back to the full center target.
   */
  const allocatedTotal =
    allocations.reduce(
      (sum, allocation) =>
        sum + allocation.dailyTargetLiters,
      0,
    );

  const roundingDifference =
    roundToTwoDecimals(
      input.dailyCenterGoalLiters -
        allocatedTotal,
    );

  if (
    allocations.length > 0 &&
    roundingDifference !== 0
  ) {
    const finalAllocation =
      allocations[allocations.length - 1];

    finalAllocation.dailyTargetLiters =
      roundToTwoDecimals(
        finalAllocation.dailyTargetLiters +
          roundingDifference,
      );
  }

  return {
    dailyCenterGoalLiters:
      input.dailyCenterGoalLiters,
    totalWeight:
      roundToTwoDecimals(totalWeight),
    allocations,
  };
}