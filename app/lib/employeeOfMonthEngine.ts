import { prisma } from "@/lib/prisma";

export type ProductivityDetail = {
  role: string;
  metric: string;
  label: string;

  actual: number;
  expected: number;
  daysWorked: number;

  score: number;
};

export type AttendanceBreakdown = {
  late: number;
  absent: number;
  lateFromLunch: number;
  leftEarly: number;
};

export type EmployeeOfMonthCandidate = {
  collectorId: number;

  name: string;

  preferredName:
    string | null;

  primaryRole: string;

  /*
   * ========================================
   * PERFORMANCE
   * ========================================
   */

  productivityScore:
    number | null;

  accuracyScore:
    number | null;

  productivityDetails:
    ProductivityDetail[];

  /*
   * ========================================
   * QUALITY
   * ========================================
   */

  emfCount: number;

  qualityScore: number;

  /*
   * ========================================
   * ATTENDANCE
   * ========================================
   */

  attendance:
    AttendanceBreakdown;

  attendanceScore:
    number;

  /*
   * ========================================
   * RECOGNITION
   * ========================================
   */

  recognitionScore:
    number;

  /*
   * ========================================
   * FINAL
   * ========================================
   */

  totalScore: number;

  eligible: boolean;

  ineligibleReason:
    string | null;

  missingTargets:
    string[];
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

type ScoreComponent = {
  score:
    number | null;

  weight: number;
};

const DEFAULT_SETTINGS = {
  productivityWeight:
    35,

  accuracyWeight:
    25,

  qualityWeight:
    25,

  attendanceWeight:
    10,

  recognitionWeight:
    5,

  emfPenaltyPoints:
    15,

  emfDisqualifyThreshold:
    null as number | null,

  latePenalty:
    1,

  absentPenalty:
    3,

  lateFromLunchPenalty:
    1,

  leftEarlyPenalty:
    1.5,
};

function roundToTwo(
  value: number,
) {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) *
        100,
    ) / 100
  );
}

function clampScore(
  value: number,
) {
  return Math.max(
    0,
    Math.min(
      100,
      value,
    ),
  );
}

function getMonthRange(
  year: number,
  month: number,
) {
  const startDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
      ),
    );

  const endDate =
    new Date(
      Date.UTC(
        year,
        month,
        1,
      ),
    );

  return {
    startDate,
    endDate,
  };
}

function primaryRoleToEnum(
  role: string,
) {
  switch (role) {
    case "Management":
      return "MANAGEMENT";

    case "Phlebotomist":
      return "PHLEBOTOMIST";

    case "Group Lead":
      return "GROUP_LEAD";

    case "Processor":
      return "PROCESSOR";

    case "Reception Tech":
      return "RECEPTION_TECH";

    case "MSA":
      return "MSA";

    case "DST":
      return "DST";

    default:
      return "OTHER";
  }
}

function getMetricLabel(
  role: string,
  metric: string,
) {
  if (
    role ===
      "PHLEBOTOMIST" &&
    metric ===
      "STICKS"
  ) {
    return "Successful Sticks";
  }

  if (
    role === "MSA" &&
    metric ===
      "PHYSICALS"
  ) {
    return "Physicals";
  }

  if (
    role ===
      "RECEPTION_TECH" &&
    metric ===
      "INTERVIEWS"
  ) {
    return "Interviews";
  }

  if (
    role === "DST" &&
    metric ===
      "SETUPS"
  ) {
    return "Setups";
  }

  if (
    role === "DST" &&
    metric ===
      "DISCONNECTS"
  ) {
    return "Disconnects";
  }

  if (
    role ===
      "PROCESSOR" &&
    metric ===
      "PROCESSED"
  ) {
    return "Bottles Processed";
  }

  return `${role} ${metric}`;
}

function makeMetricKey(
  role: string,
  metric: string,
) {
  return `${role}:${metric}`;
}

function weightedAverage(
  components:
    ScoreComponent[],
) {
  /*
   * Only categories that genuinely apply
   * participate in the final score.
   *
   * Example:
   * Processor does not currently have a
   * defined accuracy metric.
   *
   * We do NOT give them zero for accuracy.
   * We redistribute the applicable weights.
   */

  const applicable =
    components.filter(
      (
        component,
      ): component is {
        score: number;
        weight: number;
      } =>
        component.score !==
          null &&
        component.weight > 0,
    );

  const totalWeight =
    applicable.reduce(
      (
        total,
        component,
      ) =>
        total +
        component.weight,
      0,
    );

  if (
    totalWeight <= 0
  ) {
    return 0;
  }

  const weightedTotal =
    applicable.reduce(
      (
        total,
        component,
      ) =>
        total +
        component.score *
          component.weight,
      0,
    );

  return (
    weightedTotal /
    totalWeight
  );
}

export async function getEmployeeOfMonthRecommendation(
  period:
    EmployeeOfMonthPeriod,
): Promise<EmployeeOfMonthResult> {
  const {
    startDate,
    endDate,
  } = getMonthRange(
    period.year,
    period.month,
  );

  /*
   * ========================================
   * LOAD DATA
   * ========================================
   */

  const [
    savedSettings,
    collectors,
    targets,
    stickEntries,
    performanceEntries,
    emfEntries,
    attendanceEntries,
    recognitionEntries,
  ] = await Promise.all([
    prisma.employeeOfMonthSettings.findUnique({
      where: {
        id: 1,
      },
    }),

    prisma.collector.findMany({
      where: {
        active: true,
      },

      include: {
        roleAssignments:
          true,
      },

      orderBy: [
        {
          position:
            "asc",
        },

        {
          name:
            "asc",
        },
      ],
    }),

    prisma.rolePerformanceTarget.findMany({
      where: {
        active: true,
      },
    }),

    prisma.workerStickEntry.findMany({
      where: {
        entryDate: {
          gte:
            startDate,

          lt:
            endDate,
        },

        collector: {
          active:
            true,
        },
      },
    }),

    prisma.workerPerformanceEntry.findMany({
      where: {
        entryDate: {
          gte:
            startDate,

          lt:
            endDate,
        },

        collector: {
          active:
            true,
        },
      },
    }),

    prisma.qualityEmfEntry.findMany({
      where: {
        entryDate: {
          gte:
            startDate,

          lt:
            endDate,
        },

        collector: {
          active:
            true,
        },
      },
    }),

    prisma.attendanceEntry.findMany({
      where: {
        entryDate: {
          gte:
            startDate,

          lt:
            endDate,
        },
      },
    }),

    prisma.monthlyRecognitionScore.findMany({
      where: {
        year:
          period.year,

        month:
          period.month,
      },
    }),
  ]);

  const settings = {
    ...DEFAULT_SETTINGS,
    ...(savedSettings ??
      {}),
  };

  /*
   * ========================================
   * TARGET MAP
   * ========================================
   */

  const targetMap =
    new Map<
      string,
      {
        targetPerDay:
          number;

        accuracyApplicable:
          boolean;
      }
    >();

  for (
    const target of
      targets
  ) {
    targetMap.set(
      makeMetricKey(
        target.role,
        target.metric,
      ),

      {
        targetPerDay:
          target.targetPerDay,

        accuracyApplicable:
          target.accuracyApplicable,
      },
    );
  }

  const rankings:
    EmployeeOfMonthCandidate[] =
    [];

  /*
   * ========================================
   * SCORE EACH WORKER
   * ========================================
   */

  for (
    const collector of
      collectors
  ) {
    /*
     * ======================================
     * ELIGIBLE ROLES
     * ======================================
     */

    const eligibleRoles =
      new Set<string>();

    for (
      const assignment of
        collector.roleAssignments
    ) {
      eligibleRoles.add(
        assignment.role,
      );
    }

    /*
     * Primary role is always included.
     */

    eligibleRoles.add(
      primaryRoleToEnum(
        collector.role,
      ),
    );

    /*
     * ======================================
     * WORKER DATA
     * ======================================
     */

    const workerStickEntries =
      stickEntries.filter(
        (entry) =>
          entry.collectorId ===
          collector.id,
      );

    const workerPerformanceEntries =
      performanceEntries.filter(
        (entry) =>
          entry.collectorId ===
          collector.id,
      );

    /*
     * ======================================
     * PRODUCTIVITY
     * ======================================
     */

    const productivityDetails:
      ProductivityDetail[] =
      [];

    const missingTargets:
      string[] =
      [];

    /*
     * --------------------------------------
     * PHLEBOTOMY
     * --------------------------------------
     */

    if (
      eligibleRoles.has(
        "PHLEBOTOMIST",
      )
    ) {
      const target =
        targetMap.get(
          makeMetricKey(
            "PHLEBOTOMIST",
            "STICKS",
          ),
        );

      if (!target) {
        missingTargets.push(
          "Phlebotomist — Successful Sticks",
        );
      } else {
        /*
         * A workday counts only when actual
         * stick activity was entered.
         */

        const activeDays =
          workerStickEntries.filter(
            (entry) =>
              entry.totalSticks >
              0,
          );

        if (
          activeDays.length >
          0
        ) {
          const successfulSticks =
            activeDays.reduce(
              (
                total,
                entry,
              ) =>
                total +
                entry.successfulSticks,
              0,
            );

          const daysWorked =
            activeDays.length;

          const expected =
            target.targetPerDay *
            daysWorked;

          const score =
            expected > 0
              ? clampScore(
                  (
                    successfulSticks /
                    expected
                  ) *
                    100,
                )
              : 0;

          productivityDetails.push({
            role:
              "PHLEBOTOMIST",

            metric:
              "STICKS",

            label:
              "Successful Sticks",

            actual:
              successfulSticks,

            expected,

            daysWorked,

            score:
              roundToTwo(
                score,
              ),
          });
        }
      }
    }

    /*
     * --------------------------------------
     * SUPPORT ACTIVITY DEFINITIONS
     * --------------------------------------
     */

    const supportDefinitions =
      [
        {
          role: "MSA",

          metric:
            "PHYSICALS",
        },

        {
          role:
            "RECEPTION_TECH",

          metric:
            "INTERVIEWS",
        },

        {
          role: "DST",

          metric:
            "SETUPS",
        },

        {
          role: "DST",

          metric:
            "DISCONNECTS",
        },

        {
          role:
            "PROCESSOR",

          metric:
            "PROCESSED",
        },
      ] as const;

    /*
     * --------------------------------------
     * ALL ELIGIBLE SUPPORT ROLES
     * --------------------------------------
     */

    for (
      const definition of
        supportDefinitions
    ) {
      if (
        !eligibleRoles.has(
          definition.role,
        )
      ) {
        continue;
      }

      const target =
        targetMap.get(
          makeMetricKey(
            definition.role,
            definition.metric,
          ),
        );

      if (!target) {
        missingTargets.push(
          getMetricLabel(
            definition.role,
            definition.metric,
          ),
        );

        continue;
      }

      const matchingEntries =
        workerPerformanceEntries.filter(
          (entry) =>
            entry.role ===
              definition.role &&
            entry.metric ===
              definition.metric &&
            entry.totalCount >
              0,
        );

      if (
        matchingEntries.length ===
        0
      ) {
        continue;
      }

      /*
       * Count unique days the activity
       * was actually performed.
       */

      const uniqueDates =
        new Set(
          matchingEntries.map(
            (entry) =>
              entry.entryDate
                .toISOString()
                .slice(
                  0,
                  10,
                ),
          ),
        );

      const daysWorked =
        uniqueDates.size;

      const actual =
        matchingEntries.reduce(
          (
            total,
            entry,
          ) =>
            total +
            entry.totalCount,
          0,
        );

      const expected =
        target.targetPerDay *
        daysWorked;

      const score =
        expected > 0
          ? clampScore(
              (
                actual /
                expected
              ) *
                100,
            )
          : 0;

      productivityDetails.push({
        role:
          definition.role,

        metric:
          definition.metric,

        label:
          getMetricLabel(
            definition.role,
            definition.metric,
          ),

        actual,

        expected,

        daysWorked,

        score:
          roundToTwo(
            score,
          ),
      });
    }

    /*
     * --------------------------------------
     * COMBINED PRODUCTIVITY
     * --------------------------------------
     *
     * Cross-trained workers receive credit
     * for every eligible activity they
     * actually performed.
     */

    const productivityScore =
      productivityDetails.length >
      0
        ? productivityDetails.reduce(
            (
              total,
              detail,
            ) =>
              total +
              detail.score,
            0,
          ) /
          productivityDetails.length
        : null;

    /*
     * ======================================
     * ACCURACY
     * ======================================
     *
     * Phlebotomy currently has the only
     * fully defined success/accuracy metric.
     *
     * Other roles are NOT penalized with 0.
     */

    let accuracyScore:
      number | null =
      null;

    if (
      eligibleRoles.has(
        "PHLEBOTOMIST",
      )
    ) {
      const totalSticks =
        workerStickEntries.reduce(
          (
            total,
            entry,
          ) =>
            total +
            entry.totalSticks,
          0,
        );

      const successfulSticks =
        workerStickEntries.reduce(
          (
            total,
            entry,
          ) =>
            total +
            entry.successfulSticks,
          0,
        );

      if (
        totalSticks >
        0
      ) {
        accuracyScore =
          clampScore(
            (
              successfulSticks /
              totalSticks
            ) *
              100,
          );
      }
    }

    /*
     * ======================================
     * QUALITY — PRIVATE EMF DATA
     * ======================================
     *
     * EMFs affect EOM scoring internally.
     * They are NOT sent to Meadow/public
     * displays.
     */

    const emfCount =
      emfEntries
        .filter(
          (entry) =>
            entry.collectorId ===
            collector.id,
        )
        .reduce(
          (
            total,
            entry,
          ) =>
            total +
            entry.emfCount,
          0,
        );

    const qualityScore =
      clampScore(
        100 -
          emfCount *
            settings.emfPenaltyPoints,
      );

    /*
     * ======================================
     * ATTENDANCE
     * ======================================
     */

    const attendance:
      AttendanceBreakdown = {
      late:
        0,

      absent:
        0,

      lateFromLunch:
        0,

      leftEarly:
        0,
    };

    for (
      const entry of
        attendanceEntries
    ) {
      if (
        entry.collectorId !==
        collector.id
      ) {
        continue;
      }

      switch (
        entry.eventType
      ) {
        case "LATE":
          attendance.late +=
            1;
          break;

        case "ABSENT":
          attendance.absent +=
            1;
          break;

        case "LATE_FROM_LUNCH":
          attendance.lateFromLunch +=
            1;
          break;

        case "LEFT_EARLY":
          attendance.leftEarly +=
            1;
          break;
      }
    }

    const attendancePenalty =
      attendance.late *
        settings.latePenalty +
      attendance.absent *
        settings.absentPenalty +
      attendance.lateFromLunch *
        settings.lateFromLunchPenalty +
      attendance.leftEarly *
        settings.leftEarlyPenalty;

    const attendanceScore =
      clampScore(
        100 -
          attendancePenalty,
      );

    /*
     * ======================================
     * MONTHLY RECOGNITION
     * ======================================
     */

    const recognitionEntry =
      recognitionEntries.find(
        (entry) =>
          entry.collectorId ===
          collector.id,
      );

    const recognitionScore =
      clampScore(
        recognitionEntry
          ?.score ??
          0,
      );

    /*
     * ======================================
     * ELIGIBILITY
     * ======================================
     */

    let eligible =
      true;

    let ineligibleReason:
      string | null =
      null;

    /*
     * Worker must have actual measurable
     * performance for the month.
     *
     * Zero EMFs alone cannot make someone
     * Employee of the Month.
     */

    if (
      productivityDetails.length ===
      0
    ) {
      eligible =
        false;

      ineligibleReason =
        "No qualifying monthly productivity data.";
    }

    /*
     * Optional EMF disqualification rule.
     */

    if (
      settings.emfDisqualifyThreshold !==
        null &&
      emfCount >=
        settings.emfDisqualifyThreshold
    ) {
      eligible =
        false;

      ineligibleReason =
        `EMF disqualification threshold reached.`;
    }

    /*
     * ======================================
     * FINAL WEIGHTED SCORE
     * ======================================
     */

    const totalScore =
      weightedAverage([
        {
          score:
            productivityScore,

          weight:
            settings.productivityWeight,
        },

        {
          score:
            accuracyScore,

          weight:
            settings.accuracyWeight,
        },

        {
          score:
            qualityScore,

          weight:
            settings.qualityWeight,
        },

        {
          score:
            attendanceScore,

          weight:
            settings.attendanceWeight,
        },

        {
          score:
            recognitionScore,

          weight:
            settings.recognitionWeight,
        },
      ]);

    rankings.push({
      collectorId:
        collector.id,

      name:
        collector.name,

      preferredName:
        collector.preferredName,

      primaryRole:
        collector.role,

      productivityScore:
        productivityScore ===
        null
          ? null
          : roundToTwo(
              productivityScore,
            ),

      accuracyScore:
        accuracyScore ===
        null
          ? null
          : roundToTwo(
              accuracyScore,
            ),

      productivityDetails,

      emfCount,

      qualityScore:
        roundToTwo(
          qualityScore,
        ),

      attendance,

      attendanceScore:
        roundToTwo(
          attendanceScore,
        ),

      recognitionScore:
        roundToTwo(
          recognitionScore,
        ),

      totalScore:
        roundToTwo(
          totalScore,
        ),

      eligible,

      ineligibleReason,

      missingTargets,
    });
  }

  /*
   * ========================================
   * RANKING
   * ========================================
   */

  rankings.sort(
    (
      a,
      b,
    ) => {
      /*
       * Eligible employees always rank
       * above ineligible employees.
       */

      if (
        a.eligible !==
        b.eligible
      ) {
        return a.eligible
          ? -1
          : 1;
      }

      /*
       * Primary ranking:
       * overall weighted score.
       */

      if (
        b.totalScore !==
        a.totalScore
      ) {
        return (
          b.totalScore -
          a.totalScore
        );
      }

      /*
       * Tie breaker:
       * stronger quality.
       */

      if (
        b.qualityScore !==
        a.qualityScore
      ) {
        return (
          b.qualityScore -
          a.qualityScore
        );
      }

      /*
       * Then attendance.
       */

      if (
        b.attendanceScore !==
        a.attendanceScore
      ) {
        return (
          b.attendanceScore -
          a.attendanceScore
        );
      }

      /*
       * Then productivity.
       */

      if (
        (
          b.productivityScore ??
          0
        ) !==
        (
          a.productivityScore ??
          0
        )
      ) {
        return (
          (
            b.productivityScore ??
            0
          ) -
          (
            a.productivityScore ??
            0
          )
        );
      }

      return a.name.localeCompare(
        b.name,
      );
    },
  );

  const recommendation =
    rankings.find(
      (candidate) =>
        candidate.eligible,
    ) ??
    null;

  return {
    year:
      period.year,

    month:
      period.month,

    recommendation,

    rankings,
  };
}