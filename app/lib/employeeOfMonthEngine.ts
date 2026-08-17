import { prisma } from "@/lib/prisma";

export type EmployeeOfMonthCandidate = {
  collectorId: number;
  name: string;
  preferredName: string | null;

  successfulSticks: number;
  totalSticks: number;
  successRate: number;

  emfCount: number;

  volumeScore: number;
  successRateScore: number;
  performanceScore: number;
  qualityScore: number;
  totalScore: number;
};

export type EmployeeOfMonthResult = {
  year: number;
  month: number;

  recommendation:
    EmployeeOfMonthCandidate | null;

  rankings:
    EmployeeOfMonthCandidate[];
};

type EmployeeOfMonthPeriod = {
  year: number;
  month: number;
};

function roundToTwo(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
}

function getMonthRange(
  year: number,
  month: number,
) {
  const startDate =
    new Date(
      year,
      month - 1,
      1,
      0,
      0,
      0,
      0,
    );

  const endDate =
    new Date(
      year,
      month,
      1,
      0,
      0,
      0,
      0,
    );

  return {
    startDate,
    endDate,
  };
}

export async function getEmployeeOfMonthRecommendation(
  period: EmployeeOfMonthPeriod,
): Promise<EmployeeOfMonthResult> {
  const {
    startDate,
    endDate,
  } = getMonthRange(
    period.year,
    period.month,
  );

  const collectors =
    await prisma.collector.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        preferredName: true,
      },
    });

  const stickEntries =
    await prisma.workerStickEntry.findMany({
      where: {
        entryDate: {
          gte: startDate,
          lt: endDate,
        },

        collector: {
          active: true,
        },
      },

      select: {
        collectorId: true,
        totalSticks: true,
        successfulSticks: true,
      },
    });

  const emfEntries =
    await prisma.qualityEmfEntry.findMany({
      where: {
        entryDate: {
          gte: startDate,
          lt: endDate,
        },

        collector: {
          active: true,
        },
      },

      select: {
        collectorId: true,
        emfCount: true,
      },
    });

  const stickTotals =
    new Map<
      number,
      {
        totalSticks: number;
        successfulSticks: number;
      }
    >();

  for (const entry of stickEntries) {
    const current =
      stickTotals.get(
        entry.collectorId,
      ) ?? {
        totalSticks: 0,
        successfulSticks: 0,
      };

    current.totalSticks +=
      entry.totalSticks;

    current.successfulSticks +=
      entry.successfulSticks;

    stickTotals.set(
      entry.collectorId,
      current,
    );
  }

  const emfTotals =
    new Map<number, number>();

  for (const entry of emfEntries) {
    emfTotals.set(
      entry.collectorId,
      (
        emfTotals.get(
          entry.collectorId,
        ) ?? 0
      ) + entry.emfCount,
    );
  }

  /*
   * A Worker Bee must have actual monthly
   * performance data to qualify.
   *
   * Zero EMFs alone cannot make someone
   * Employee of the Month.
   */

  const eligibleCollectors =
    collectors
      .map((collector) => {
        const sticks =
          stickTotals.get(
            collector.id,
          );

        if (
          !sticks ||
          sticks.totalSticks <= 0
        ) {
          return null;
        }

        return {
          collector,
          totalSticks:
            sticks.totalSticks,

          successfulSticks:
            sticks.successfulSticks,

          emfCount:
            emfTotals.get(
              collector.id,
            ) ?? 0,
        };
      })
      .filter(
        (
          candidate,
        ): candidate is NonNullable<
          typeof candidate
        > => candidate !== null,
      );

  const highestSuccessfulSticks =
    eligibleCollectors.reduce(
      (
        highest,
        candidate,
      ) =>
        Math.max(
          highest,
          candidate.successfulSticks,
        ),
      0,
    );

  const rankings:
    EmployeeOfMonthCandidate[] =
    eligibleCollectors
      .map((candidate) => {
        /*
         * --------------------------------------
         * VOLUME — 35 POINTS
         * --------------------------------------
         *
         * Successful-stick contribution is
         * normalized against the strongest
         * monthly producer.
         */

        const volumeScore =
          highestSuccessfulSticks > 0
            ? (
                candidate
                  .successfulSticks /
                highestSuccessfulSticks
              ) * 35
            : 0;

        /*
         * --------------------------------------
         * SUCCESS RATE — 35 POINTS
         * --------------------------------------
         *
         * A 100% success rate earns the full
         * 35 points.
         */

        const successRate =
          candidate.totalSticks > 0
            ? (
                candidate
                  .successfulSticks /
                candidate
                  .totalSticks
              ) * 100
            : 0;

        const successRateScore =
          (
            successRate /
            100
          ) * 35;

        /*
         * --------------------------------------
         * PERFORMANCE — 70 POINTS TOTAL
         * --------------------------------------
         */

        const performanceScore =
          volumeScore +
          successRateScore;

        /*
         * --------------------------------------
         * QUALITY — 30 POINTS
         * --------------------------------------
         *
         * 0 EMFs = 30
         * 1 EMF  = 25
         * 2 EMFs = 20
         * 3 EMFs = 15
         * 4 EMFs = 10
         * 5 EMFs = 5
         * 6+     = 0
         */

        const qualityScore =
          Math.max(
            0,
            30 -
              candidate.emfCount *
                5,
          );

        const totalScore =
          performanceScore +
          qualityScore;

        return {
          collectorId:
            candidate.collector.id,

          name:
            candidate.collector.name,

          preferredName:
            candidate.collector
              .preferredName,

          successfulSticks:
            candidate.successfulSticks,

          totalSticks:
            candidate.totalSticks,

          successRate:
            roundToTwo(
              successRate,
            ),

          emfCount:
            candidate.emfCount,

          volumeScore:
            roundToTwo(
              volumeScore,
            ),

          successRateScore:
            roundToTwo(
              successRateScore,
            ),

          performanceScore:
            roundToTwo(
              performanceScore,
            ),

          qualityScore:
            roundToTwo(
              qualityScore,
            ),

          totalScore:
            roundToTwo(
              totalScore,
            ),
        };
      })
      .sort((a, b) => {
        if (
          b.totalScore !==
          a.totalScore
        ) {
          return (
            b.totalScore -
            a.totalScore
          );
        }

        if (
          b.successRate !==
          a.successRate
        ) {
          return (
            b.successRate -
            a.successRate
          );
        }

        if (
          b.successfulSticks !==
          a.successfulSticks
        ) {
          return (
            b.successfulSticks -
            a.successfulSticks
          );
        }

        if (
          a.emfCount !==
          b.emfCount
        ) {
          return (
            a.emfCount -
            b.emfCount
          );
        }

        return a.name.localeCompare(
          b.name,
        );
      });

  return {
    year:
      period.year,

    month:
      period.month,

    recommendation:
      rankings[0] ?? null,

    rankings,
  };
}