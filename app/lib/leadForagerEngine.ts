import { prisma } from "@/lib/prisma";

export type LeadForagerCandidate = {
  collectorId: number;
  name: string;
  preferredName: string | null;
  successfulSticks: number;
  totalSticks: number;
};

export type ReigningLeadForager = {
  collectorId: number;
  name: string;
  preferredName: string | null;
  successfulSticks: number;
  totalSticks: number;
  benchmarkSuccessfulSticks: number;
  crownedAt: Date | null;
};

export type MonthlyLeadForagerResult = {
  year: number;
  month: number;
  collectorId: number;
  name: string;
  preferredName: string | null;
  successfulSticks: number;
  totalSticks: number;
};

type DateRange = {
  startDate: Date;
  endDate: Date;
};

type MonthlyPeriod = {
  year: number;
  month: number;
};

function getDisplayName(
  name: string,
  preferredName: string | null,
) {
  const preferred =
    preferredName?.trim();

  return preferred || name;
}

function getMonthBounds(
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
      0,
      23,
      59,
      59,
      999,
    );

  return {
    startDate,
    endDate,
  };
}

async function getStickTotalsForRange(
  range: DateRange,
): Promise<LeadForagerCandidate[]> {
  const entries =
    await prisma.workerStickEntry.findMany({
      where: {
        entryDate: {
          gte: range.startDate,
          lte: range.endDate,
        },
      },

      include: {
        collector: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            active: true,
          },
        },
      },
    });

  const totals =
    new Map<
      number,
      LeadForagerCandidate
    >();

  for (const entry of entries) {
    /*
     * Historical entries remain valid even
     * if the worker is later deactivated.
     */
    const existing =
      totals.get(entry.collectorId);

    if (existing) {
      existing.totalSticks +=
        entry.totalSticks;

      existing.successfulSticks +=
        entry.successfulSticks;

      continue;
    }

    totals.set(
      entry.collectorId,
      {
        collectorId:
          entry.collector.id,

        name:
          entry.collector.name,

        preferredName:
          entry.collector
            .preferredName,

        totalSticks:
          entry.totalSticks,

        successfulSticks:
          entry.successfulSticks,
      },
    );
  }

  return Array.from(
    totals.values(),
  ).sort((a, b) => {
    /*
     * Primary recognition measure:
     * successful sticks.
     *
     * Total sticks are only a secondary
     * deterministic sort and do NOT
     * override successful sticks.
     */
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
      b.totalSticks !==
      a.totalSticks
    ) {
      return (
        b.totalSticks -
        a.totalSticks
      );
    }

    return getDisplayName(
      a.name,
      a.preferredName,
    ).localeCompare(
      getDisplayName(
        b.name,
        b.preferredName,
      ),
    );
  });
}

export async function getWeeklyLeadForagerCandidates(
  range: DateRange,
) {
  return getStickTotalsForRange(
    range,
  );
}

export async function updateReigningLeadForager(
  range: DateRange,
): Promise<
  ReigningLeadForager | null
> {
  const candidates =
    await getStickTotalsForRange(
      range,
    );

  const weeklyLeader =
    candidates[0] ?? null;

  const currentReign =
    await prisma.leadForagerReign.findUnique({
      where: {
        id: 1,
      },

      include: {
        collector: {
          select: {
            id: true,
            name: true,
            preferredName: true,
          },
        },
      },
    });

  /*
   * No stick data exists for this
   * operational week.
   *
   * Preserve the existing champion.
   */
  if (!weeklyLeader) {
    if (
      !currentReign ||
      !currentReign.collector
    ) {
      return null;
    }

    return {
      collectorId:
        currentReign.collector.id,

      name:
        currentReign.collector.name,

      preferredName:
        currentReign.collector
          .preferredName,

      successfulSticks: 0,
      totalSticks: 0,

      benchmarkSuccessfulSticks:
        currentReign
          .benchmarkSuccessfulSticks,

      crownedAt:
        currentReign.crownedAt,
    };
  }

  /*
   * First Lead Forager ever.
   */
  if (
    !currentReign ||
    !currentReign.collectorId
  ) {
    const newReign =
      await prisma.leadForagerReign.upsert({
        where: {
          id: 1,
        },

        create: {
          id: 1,

          collectorId:
            weeklyLeader.collectorId,

          benchmarkSuccessfulSticks:
            weeklyLeader.successfulSticks,

          crownedAt:
            new Date(),
        },

        update: {
          collectorId:
            weeklyLeader.collectorId,

          benchmarkSuccessfulSticks:
            weeklyLeader.successfulSticks,

          crownedAt:
            new Date(),
        },

        include: {
          collector: {
            select: {
              id: true,
              name: true,
              preferredName: true,
            },
          },
        },
      });

    if (!newReign.collector) {
      return null;
    }

    return {
      collectorId:
        newReign.collector.id,

      name:
        newReign.collector.name,

      preferredName:
        newReign.collector
          .preferredName,

      successfulSticks:
        weeklyLeader
          .successfulSticks,

      totalSticks:
        weeklyLeader.totalSticks,

      benchmarkSuccessfulSticks:
        newReign
          .benchmarkSuccessfulSticks,

      crownedAt:
        newReign.crownedAt,
    };
  }

  const reigningCollectorId =
    currentReign.collectorId;

  const reigningThisWeek =
    candidates.find(
      (candidate) =>
        candidate.collectorId ===
        reigningCollectorId,
    ) ?? null;

  /*
   * If the reigning Lead Forager improves
   * on their own record, raise the
   * benchmark.
   *
   * This makes the crown harder to take
   * while preserving the rule that the
   * incumbent stays champion until beaten.
   */
  let benchmark =
    currentReign
      .benchmarkSuccessfulSticks;

  if (
    reigningThisWeek &&
    reigningThisWeek
      .successfulSticks >
      benchmark
  ) {
    benchmark =
      reigningThisWeek
        .successfulSticks;

    await prisma.leadForagerReign.update({
      where: {
        id: 1,
      },

      data: {
        benchmarkSuccessfulSticks:
          benchmark,
      },
    });
  }

  /*
   * The crown changes hands ONLY when
   * another worker exceeds the reigning
   * benchmark.
   *
   * A tie does not dethrone the
   * Lead Forager.
   */
  const challenger =
    candidates.find(
      (candidate) =>
        candidate.collectorId !==
          reigningCollectorId &&
        candidate.successfulSticks >
          benchmark,
    ) ?? null;

  if (challenger) {
    const newReign =
      await prisma.leadForagerReign.update({
        where: {
          id: 1,
        },

        data: {
          collectorId:
            challenger.collectorId,

          benchmarkSuccessfulSticks:
            challenger.successfulSticks,

          crownedAt:
            new Date(),
        },

        include: {
          collector: {
            select: {
              id: true,
              name: true,
              preferredName: true,
            },
          },
        },
      });

    if (!newReign.collector) {
      return null;
    }

    return {
      collectorId:
        newReign.collector.id,

      name:
        newReign.collector.name,

      preferredName:
        newReign.collector
          .preferredName,

      successfulSticks:
        challenger.successfulSticks,

      totalSticks:
        challenger.totalSticks,

      benchmarkSuccessfulSticks:
        newReign
          .benchmarkSuccessfulSticks,

      crownedAt:
        newReign.crownedAt,
    };
  }

  /*
   * No challenger beat the benchmark.
   * The reigning Lead Forager keeps
   * the crown.
   */
  if (!currentReign.collector) {
    return null;
  }

  return {
    collectorId:
      currentReign.collector.id,

    name:
      currentReign.collector.name,

    preferredName:
      currentReign.collector
        .preferredName,

    successfulSticks:
      reigningThisWeek
        ?.successfulSticks ?? 0,

    totalSticks:
      reigningThisWeek
        ?.totalSticks ?? 0,

    benchmarkSuccessfulSticks:
      benchmark,

    crownedAt:
      currentReign.crownedAt,
  };
}

export async function updateMonthlyLeadForager(
  period: MonthlyPeriod,
): Promise<
  MonthlyLeadForagerResult | null
> {
  const {
    startDate,
    endDate,
  } = getMonthBounds(
    period.year,
    period.month,
  );

  const candidates =
    await getStickTotalsForRange({
      startDate,
      endDate,
    });

  const monthlyLeader =
    candidates[0] ?? null;

  if (!monthlyLeader) {
    return null;
  }

  /*
   * This record is continuously refreshed
   * while the month is active.
   *
   * Once the month ends, it naturally
   * becomes that month's historical
   * recognition result.
   */
  await prisma.monthlyLeadForager.upsert({
    where: {
      year_month: {
        year:
          period.year,

        month:
          period.month,
      },
    },

    create: {
      year:
        period.year,

      month:
        period.month,

      collectorId:
        monthlyLeader.collectorId,

      successfulSticks:
        monthlyLeader.successfulSticks,
    },

    update: {
      collectorId:
        monthlyLeader.collectorId,

      successfulSticks:
        monthlyLeader.successfulSticks,
    },
  });

  return {
    year:
      period.year,

    month:
      period.month,

    collectorId:
      monthlyLeader.collectorId,

    name:
      monthlyLeader.name,

    preferredName:
      monthlyLeader.preferredName,

    successfulSticks:
      monthlyLeader.successfulSticks,

    totalSticks:
      monthlyLeader.totalSticks,
  };
}

export async function getSavedMonthlyLeadForager(
  period: MonthlyPeriod,
): Promise<
  MonthlyLeadForagerResult | null
> {
  const record =
    await prisma.monthlyLeadForager.findUnique({
      where: {
        year_month: {
          year:
            period.year,

          month:
            period.month,
        },
      },

      include: {
        collector: {
          select: {
            name: true,
            preferredName: true,
          },
        },
      },
    });

  if (!record) {
    return null;
  }

  const {
    startDate,
    endDate,
  } = getMonthBounds(
    period.year,
    period.month,
  );

  const candidates =
    await getStickTotalsForRange({
      startDate,
      endDate,
    });

  const matchingCandidate =
    candidates.find(
      (candidate) =>
        candidate.collectorId ===
        record.collectorId,
    );

  return {
    year:
      record.year,

    month:
      record.month,

    collectorId:
      record.collectorId,

    name:
      record.collector.name,

    preferredName:
      record.collector
        .preferredName,

    successfulSticks:
      record.successfulSticks,

    totalSticks:
      matchingCandidate
        ?.totalSticks ?? 0,
  };
}