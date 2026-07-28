export type TargetCollector = {
  id: number;
  active: boolean;
  participatesInTarget: boolean;
  targetAdjustmentLiters: number;
};

export interface WorkerTarget<
  TCollector extends TargetCollector,
> {
  collector: TCollector;
  calculatedTarget: number;
}

export interface TargetCalculationResult<
  TCollector extends TargetCollector,
> {
  participatingCollectors: WorkerTarget<TCollector>[];
  supportCollectors: TCollector[];
  totalWeeklyTarget: number;
  totalAllocatedTarget: number;
}

function roundToHundredths(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

export function calculateWeeklyTargets<
  TCollector extends TargetCollector,
>(
  collectors: TCollector[],
  weeklyCenterTarget: number,
): TargetCalculationResult<TCollector> {
  const safeWeeklyTarget = Math.max(
    0,
    weeklyCenterTarget,
  );

  const activeCollectors =
    collectors.filter(
      (collector) => collector.active,
    );

  const participants =
    activeCollectors.filter(
      (collector) =>
        collector.participatesInTarget,
    );

  const supportCollectors =
    activeCollectors.filter(
      (collector) =>
        !collector.participatesInTarget,
    );

  if (participants.length === 0) {
    return {
      participatingCollectors: [],
      supportCollectors,
      totalWeeklyTarget:
        roundToHundredths(
          safeWeeklyTarget,
        ),
      totalAllocatedTarget: 0,
    };
  }

  if (participants.length === 1) {
    const singleTarget =
      roundToHundredths(
        safeWeeklyTarget,
      );

    return {
      participatingCollectors: [
        {
          collector: participants[0],
          calculatedTarget:
            singleTarget,
        },
      ],
      supportCollectors,
      totalWeeklyTarget:
        singleTarget,
      totalAllocatedTarget:
        singleTarget,
    };
  }

  const participantCount =
    participants.length;

  const equalTarget =
    safeWeeklyTarget /
    participantCount;

  const totalAdjustments =
    participants.reduce(
      (total, collector) =>
        total +
        collector.targetAdjustmentLiters,
      0,
    );

  const calculatedTargets:
    WorkerTarget<TCollector>[] =
    participants.map((collector) => {
      const otherWorkerAdjustments =
        totalAdjustments -
        collector.targetAdjustmentLiters;

      const redistributedAmount =
        otherWorkerAdjustments /
        (participantCount - 1);

      const calculatedTarget =
        equalTarget +
        collector.targetAdjustmentLiters -
        redistributedAmount;

      return {
        collector,
        calculatedTarget:
          roundToHundredths(
            Math.max(
              0,
              calculatedTarget,
            ),
          ),
      };
    });

  const roundedAllocation =
    calculatedTargets.reduce(
      (total, worker) =>
        total +
        worker.calculatedTarget,
      0,
    );

  const roundingDifference =
    roundToHundredths(
      safeWeeklyTarget -
        roundedAllocation,
    );

  if (roundingDifference !== 0) {
    const correctionWorker =
      calculatedTargets[
        calculatedTargets.length - 1
      ];

    correctionWorker.calculatedTarget =
      roundToHundredths(
        Math.max(
          0,
          correctionWorker.calculatedTarget +
            roundingDifference,
        ),
      );
  }

  const totalAllocatedTarget =
    roundToHundredths(
      calculatedTargets.reduce(
        (total, worker) =>
          total +
          worker.calculatedTarget,
        0,
      ),
    );

  return {
    participatingCollectors:
      calculatedTargets,
    supportCollectors,
    totalWeeklyTarget:
      roundToHundredths(
        safeWeeklyTarget,
      ),
    totalAllocatedTarget,
  };
}