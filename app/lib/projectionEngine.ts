export interface ProjectionInput {
  successfulSticks: number;
  unsuccessfulSticks: number;
  lostVolume: number;
  historicalLitersPerStick: number;
  currentHour: number;
  openingHour: number;
  closingHour: number;
  dailyGoalLiters: number;
}

export interface ProjectionResult {
  currentLiters: number;
  projectedLiters: number;
  projectedFinish: number;
  confidence: number;
  additionalDonorsNeeded: number;
  projectedVariance: number;
  projectedGoalMet: boolean;
  hoursElapsed: number;
  hoursRemaining: number;
  currentHourlyPace: number;
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(max, Math.max(min, value));
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

/*
 * Confidence increases as the operating day progresses.
 *
 * Minimum: 55%
 * Maximum: 99%
 */
function calculateConfidence(
  currentHour: number,
  openingHour: number,
  closingHour: number,
) {
  const totalOperatingHours =
    closingHour - openingHour;

  if (totalOperatingHours <= 0) {
    return 55;
  }

  const elapsedHours = clamp(
    currentHour - openingHour,
    0,
    totalOperatingHours,
  );

  const elapsedPercentage =
    elapsedHours / totalOperatingHours;

  return clamp(
    Math.round(
      55 + elapsedPercentage * 44,
    ),
    55,
    99,
  );
}

export function getProjection(
  input: ProjectionInput,
): ProjectionResult {
  const totalOperatingHours = Math.max(
    input.closingHour - input.openingHour,
    0,
  );

  const hoursElapsed = clamp(
    input.currentHour - input.openingHour,
    0,
    totalOperatingHours,
  );

  const hoursRemaining = Math.max(
    totalOperatingHours - hoursElapsed,
    0,
  );

  /*
   * Current estimated production based on successful
   * sticks and historical liters per successful stick.
   *
   * This assumes lostVolume is already supplied in liters.
   */
  const estimatedGrossLiters =
    input.successfulSticks *
    input.historicalLitersPerStick;

  const currentLiters = Math.max(
    estimatedGrossLiters -
      input.lostVolume,
    0,
  );

  const currentHourlyPace =
    hoursElapsed > 0
      ? currentLiters / hoursElapsed
      : 0;

  /*
   * Before opening or before meaningful production exists,
   * the safest projection is the current known production.
   *
   * During operating hours, extrapolate the current pace
   * through closing.
   *
   * After closing, the projection becomes the actual
   * estimated production for the completed day.
   */
  let projectedFinish = currentLiters;

  if (
    hoursElapsed > 0 &&
    hoursRemaining > 0 &&
    currentHourlyPace > 0
  ) {
    projectedFinish =
      currentLiters +
      currentHourlyPace *
        hoursRemaining;
  }

  const projectedVariance =
    projectedFinish -
    input.dailyGoalLiters;

  const additionalDonorsNeeded =
    projectedVariance >= 0 ||
    input.historicalLitersPerStick <= 0
      ? 0
      : Math.ceil(
          Math.abs(projectedVariance) /
            input.historicalLitersPerStick,
        );

  const roundedCurrentLiters =
    roundToTwoDecimals(currentLiters);

  const roundedProjectedFinish =
    roundToTwoDecimals(projectedFinish);

  return {
    currentLiters:
      roundedCurrentLiters,

    /*
     * Keep projectedLiters for compatibility with
     * existing Center Intelligence code.
     */
    projectedLiters:
      roundedProjectedFinish,

    projectedFinish:
      roundedProjectedFinish,

    confidence: calculateConfidence(
      input.currentHour,
      input.openingHour,
      input.closingHour,
    ),

    additionalDonorsNeeded,

    projectedVariance:
      roundToTwoDecimals(
        projectedVariance,
      ),

    projectedGoalMet:
      projectedVariance >= 0,

    hoursElapsed:
      roundToTwoDecimals(hoursElapsed),

    hoursRemaining:
      roundToTwoDecimals(hoursRemaining),

    currentHourlyPace:
      roundToTwoDecimals(
        currentHourlyPace,
      ),
  };
}