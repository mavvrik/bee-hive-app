import { prisma } from "@/lib/prisma";

export type ExecutiveDailyComparison = {
  dayName: string;

  currentDate: string;
  previousDate: string;

  currentValue: number | null;
  previousValue: number | null;

  difference: number | null;
  percentChange: number | null;

  direction:
    | "UP"
    | "DOWN"
    | "FLAT"
    | "NONE";

  outcome:
    | "POSITIVE"
    | "NEGATIVE"
    | "NEUTRAL"
    | "NO_DATA";
};

export type ExecutiveMetricComparison = {
  metricId: number;

  key: string;
  displayName: string;

  unit: string | null;
  decimalPlaces: number;

  improvementDirection: string;

  source:
    | "CSL"
    | "HIVE"
    | "MANUAL";

  days:
    ExecutiveDailyComparison[];
};

type BuiltInMetric = {
  key: string;
  displayName: string;
  description: string;

  unit: string | null;

  decimalPlaces: number;
  displayOrder: number;

  publicSource:
    | "CSL"
    | "HIVE"
    | "MANUAL";

  improvementDirection:
    | "HIGHER"
    | "LOWER"
    | "NEUTRAL";

  dataSourceKey:
    string | null;
};

const BUILT_IN_METRICS:
  BuiltInMetric[] = [
    {
      key:
        "gross_procedures",

      displayName:
        "Gross Procedures",

      description:
        "Daily gross procedures from total HIVE sticks.",

      unit:
        "procedures",

      decimalPlaces:
        0,

      displayOrder:
        10,

      publicSource:
        "HIVE",

      improvementDirection:
        "HIGHER",

      dataSourceKey:
        "GROSS_PROCEDURES",
    },

    {
      key:
        "total_applicant_donors",

      displayName:
        "Total Applicant Donors",

      description:
        "Daily total applicant donors.",

      unit:
        "donors",

      decimalPlaces:
        0,

      displayOrder:
        20,

      publicSource:
        "MANUAL",

      improvementDirection:
        "HIGHER",

      dataSourceKey:
        null,
    },

    {
      key:
        "total_applicant_donor_percentage",

      displayName:
        "Total Applicant Donor %",

      description:
        "Daily applicant donor percentage.",

      unit:
        "%",

      decimalPlaces:
        1,

      displayOrder:
        30,

      publicSource:
        "MANUAL",

      improvementDirection:
        "HIGHER",

      dataSourceKey:
        null,
    },

    {
      key:
        "hpd",

      displayName:
        "HPD",

      description:
        "Daily HPD performance.",

      unit:
        null,

      decimalPlaces:
        2,

      displayOrder:
        40,

      publicSource:
        "MANUAL",

      improvementDirection:
        "NEUTRAL",

      dataSourceKey:
        null,
    },

    {
      key:
        "gross_liters",

      displayName:
        "Gross Liters",

      description:
        "Daily gross liters from center production.",

      unit:
        "L",

      decimalPlaces:
        1,

      displayOrder:
        50,

      publicSource:
        "HIVE",

      improvementDirection:
        "HIGHER",

      dataSourceKey:
        "GROSS_LITERS",
    },

    {
      key:
        "gross_yield",

      displayName:
        "Gross Yield",

      description:
        "Daily gross yield.",

      unit:
        null,

      decimalPlaces:
        3,

      displayOrder:
        60,

      publicSource:
        "MANUAL",

      improvementDirection:
        "HIGHER",

      dataSourceKey:
        null,
    },

    {
      key:
        "theoretical_yield_percentage",

      displayName:
        "Theoretical Yield %",

      description:
        "Daily theoretical yield percentage.",

      unit:
        "%",

      decimalPlaces:
        1,

      displayOrder:
        70,

      publicSource:
        "MANUAL",

      improvementDirection:
        "HIGHER",

      dataSourceKey:
        null,
    },

    {
      key:
        "return_checkin_to_phlebotomy_time",

      displayName:
        "Return Check-In → Phlebotomy",

      description:
        "Return donor check-in to phlebotomy time.",

      unit:
        "min",

      decimalPlaces:
        1,

      displayOrder:
        80,

      publicSource:
        "MANUAL",

      improvementDirection:
        "LOWER",

      dataSourceKey:
        null,
    },
  ];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function startOfUtcDay(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

function addUtcDays(
  date: Date,
  days: number,
) {
  const result =
    startOfUtcDay(
      date,
    );

  result.setUTCDate(
    result.getUTCDate() +
      days,
  );

  return result;
}

function nextUtcDay(
  date: Date,
) {
  return addUtcDays(
    date,
    1,
  );
}

/*
 * HIVE operational comparison week:
 *
 * Sunday through Saturday.
 */

function startOfComparisonWeek(
  date: Date,
) {
  const result =
    startOfUtcDay(
      date,
    );

  const weekday =
    result.getUTCDay();

  result.setUTCDate(
    result.getUTCDate() -
      weekday,
  );

  return result;
}

function toDateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

export async function ensureBuiltInExecutiveMetrics() {
  for (
    const definition of
      BUILT_IN_METRICS
  ) {
    await prisma.dashboardMetric.upsert({
      where: {
        key:
          definition.key,
      },

      update: {
        isBuiltIn:
          true,

        comparisonEnabled:
          true,
      },

      create: {
        key:
          definition.key,

        displayName:
          definition.displayName,

        description:
          definition.description,

        unit:
          definition.unit,

        decimalPlaces:
          definition.decimalPlaces,

        displayOrder:
          definition.displayOrder,

        publicSource:
          definition.publicSource,

        isVisible:
          true,

        comparisonEnabled:
          true,

        improvementDirection:
          definition.improvementDirection,

        dataSourceKey:
          definition.dataSourceKey,

        isBuiltIn:
          true,
      },
    });
  }
}

/*
 * ==========================================
 * AUTOMATIC HIVE DATA
 * ==========================================
 */

async function getDerivedValue(
  dataSourceKey: string,
  date: Date,
) {
  const start =
    startOfUtcDay(
      date,
    );

  const end =
    nextUtcDay(
      date,
    );

 /*
 * Gross Procedures =
 * official Daily Center Production donors/procedures
 *
 * WorkerStickEntry is individual phlebotomy
 * performance and must not determine the
 * center's official Gross Procedures.
 */

if (
  dataSourceKey ===
  "GROSS_PROCEDURES"
) {
  const result =
    await prisma.dailyCenterProduction.aggregate({
      where: {
        entryDate: {
          gte:
            start,

          lt:
            end,
        },
      },

      _count: {
        id:
          true,
      },

      _sum: {
        donors:
          true,
      },
    });

  if (
    result._count.id ===
    0
  ) {
    return null;
  }

  return (
    result._sum
      .donors ??
    0
  );
}

  /*
   * Gross Liters =
   * DailyCenterProduction.liters
   */

  if (
    dataSourceKey ===
    "GROSS_LITERS"
  ) {
    const result =
      await prisma.dailyCenterProduction.aggregate({
        where: {
          entryDate: {
            gte:
              start,

            lt:
              end,
          },
        },

        _count: {
          id:
            true,
        },

        _sum: {
          liters:
            true,
        },
      });

    if (
      result._count.id ===
      0
    ) {
      return null;
    }

    return (
      result._sum
        .liters ??
      0
    );
  }

  return null;
}

/*
 * ==========================================
 * MANUAL / CSL / STORED METRIC READING
 * ==========================================
 */

async function getReadingValue(
  metricId: number,

  source:
    | "CSL"
    | "HIVE"
    | "MANUAL",

  date: Date,
) {
  const reading =
    await prisma.metricReading.findFirst({
      where: {
        metricId,

        source,

        recordedAt: {
          gte:
            startOfUtcDay(
              date,
            ),

          lt:
            nextUtcDay(
              date,
            ),
        },
      },

      orderBy: {
        recordedAt:
          "desc",
      },

      select: {
        value:
          true,
      },
    });

  return (
    reading?.value ??
    null
  );
}

async function resolveMetricValue(
  metric: {
    id: number;

    publicSource:
      | "CSL"
      | "HIVE"
      | "MANUAL";

    dataSourceKey:
      string | null;
  },

  date: Date,
) {
  if (
    metric.dataSourceKey
  ) {
    return getDerivedValue(
      metric.dataSourceKey,
      date,
    );
  }

  return getReadingValue(
    metric.id,
    metric.publicSource,
    date,
  );
}

function getOutcome(
  difference: number,
  improvementDirection: string,
) {
  if (
    difference ===
    0
  ) {
    return "NEUTRAL" as const;
  }

  if (
    improvementDirection ===
    "NEUTRAL"
  ) {
    return "NEUTRAL" as const;
  }

  if (
    improvementDirection ===
    "HIGHER"
  ) {
    return difference >
      0
      ? "POSITIVE" as const
      : "NEGATIVE" as const;
  }

  if (
    improvementDirection ===
    "LOWER"
  ) {
    return difference <
      0
      ? "POSITIVE" as const
      : "NEGATIVE" as const;
  }

  return "NEUTRAL" as const;
}

/*
 * ==========================================
 * WEEKLY EXECUTIVE COMPARISON ENGINE
 * ==========================================
 *
 * Current week:
 * Sunday through Saturday.
 *
 * Every day compares against exactly
 * seven days earlier.
 *
 * Example:
 *
 * Current Monday -> Previous Monday
 * Current Tuesday -> Previous Tuesday
 * etc.
 *
 * Completed days remain visible for the
 * entire week.
 * ==========================================
 */

export async function getExecutiveMetricComparisons(
  date =
    new Date(),
): Promise<
  ExecutiveMetricComparison[]
> {
  await ensureBuiltInExecutiveMetrics();

  const weekStart =
    startOfComparisonWeek(
      date,
    );

  const metrics =
    await prisma.dashboardMetric.findMany({
      where: {
        isVisible:
          true,

        comparisonEnabled:
          true,
      },

      orderBy: [
        {
          displayOrder:
            "asc",
        },

        {
          displayName:
            "asc",
        },
      ],
    });

  const results:
    ExecutiveMetricComparison[] =
    [];

  for (
    const metric of
      metrics
  ) {
    const days:
      ExecutiveDailyComparison[] =
      [];

    for (
      let dayIndex =
        0;

      dayIndex <
      7;

      dayIndex +=
        1
    ) {
      const currentDate =
        addUtcDays(
          weekStart,
          dayIndex,
        );

      const previousDate =
        addUtcDays(
          currentDate,
          -7,
        );

      const [
        currentValue,
        previousValue,
      ] =
        await Promise.all([
          resolveMetricValue(
            metric,
            currentDate,
          ),

          resolveMetricValue(
            metric,
            previousDate,
          ),
        ]);

      /*
       * If either side is unavailable we still
       * display the weekday. We simply do not
       * claim an improvement/decline yet.
       */

      if (
        currentValue ===
          null ||
        previousValue ===
          null
      ) {
        days.push({
          dayName:
            DAY_NAMES[
              dayIndex
            ],

          currentDate:
            toDateKey(
              currentDate,
            ),

          previousDate:
            toDateKey(
              previousDate,
            ),

          currentValue,

          previousValue,

          difference:
            null,

          percentChange:
            null,

          direction:
            "NONE",

          outcome:
            "NO_DATA",
        });

        continue;
      }

      const difference =
        currentValue -
        previousValue;

      const percentChange =
        previousValue !==
        0
          ? (
              difference /
              Math.abs(
                previousValue,
              )
            ) *
            100
          : null;

      days.push({
        dayName:
          DAY_NAMES[
            dayIndex
          ],

        currentDate:
          toDateKey(
            currentDate,
          ),

        previousDate:
          toDateKey(
            previousDate,
          ),

        currentValue,

        previousValue,

        difference,

        percentChange,

        direction:
          difference >
          0
            ? "UP"
            : difference <
                0
              ? "DOWN"
              : "FLAT",

        outcome:
          getOutcome(
            difference,
            metric.improvementDirection,
          ),
      });
    }

    results.push({
      metricId:
        metric.id,

      key:
        metric.key,

      displayName:
        metric.displayName,

      unit:
        metric.unit,

      decimalPlaces:
        metric.decimalPlaces,

      improvementDirection:
        metric.improvementDirection,

      source:
        metric.publicSource,

      days,
    });
  }

  return results;
}