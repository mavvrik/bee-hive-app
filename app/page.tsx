import {
  calculateVarianceStreaks,
} from "@/app/lib/varianceStreakEngine";

import ProjectionExecutiveCard from "./components/ProjectionExecutiveCard";

import { prisma } from "@/lib/prisma";

import HiveHeader from "@/app/components/HiveHeader";
import ExecutiveStatusBar from "@/app/components/ExecutiveStatusBar";

import {
  getCurrentMonthNumber,
} from "@/app/lib/fiscalMonth";

import {
  getCenterIntelligence,
} from "@/app/lib/centerIntelligence";

import {
  getExecutiveMetricComparisons,
} from "@/app/lib/executiveComparisonEngine";

import {
  getDailyTargets,
} from "@/app/lib/dailyTargetEngine";

import DashboardRotator from "./components/DashboardRotator";
import DashboardPage from "./components/DashboardPage";
import ExecutiveIntelligencePage from "./components/ExecutiveIntelligencePage";
import MeetTheBeesPage from "./components/MeetTheBeesPage";

import {
  updateMonthlyLeadForager,
  updateReigningLeadForager,
} from "@/app/lib/leadForagerEngine";

import {
  formatOperationalWeekRange,
  getHivePerformanceStatus,
  getHiveWeekStatus,
  startOfOperationalWeek,
} from "@/app/lib/hiveWeek";

import HoneyPotExecutive from "./components/HoneyPotExecutive";
import DonorMeadow from "./components/DonorMeadow";
import BeeTeam from "./components/BeeTeam";

export const dynamic =
  "force-dynamic";

type SupportMetric = {
  label: string;

  value:
    | number
    | string;

  emphasis?:
    | "gold"
    | "green"
    | "red";
};

function safeDivide(
  numerator: number,
  denominator: number,
) {
  if (
    denominator <= 0
  ) {
    return 0;
  }

  return (
    numerator /
    denominator
  );
}

function primaryRoleToEnum(
  role: string,
) {
  switch (
    role
  ) {
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

function getEligibleRoleSet(
  collector: {
    role: string;

    roleAssignments: {
      role: string;
    }[];
  },
) {
  const roles =
    new Set<string>();

  for (
    const assignment of
      collector.roleAssignments
  ) {
    roles.add(
      assignment.role,
    );
  }

  /*
   * Always include primary role
   * as a compatibility safety net.
   */

  roles.add(
    primaryRoleToEnum(
      collector.role,
    ),
  );

  return roles;
}

function hasPhlebotomyEligibility(
  collector: {
    role: string;

    roleAssignments: {
      role: string;
    }[];
  },
) {
  return getEligibleRoleSet(
    collector,
  ).has(
    "PHLEBOTOMIST",
  );
}

function supportMetricKey(
  collectorId: number,
  role: string,
  metric: string,
) {
  return `${collectorId}:${role}:${metric}`;
}

/*
 * ==========================================
 * MANAGEMENT DISPLAY ARCHITECTURE
 * ==========================================
 *
 * The existing Management collector is the
 * single public/display shell.
 *
 * Craig, Kelly, Michael, and any future
 * individual Management workers remain real
 * Collector records for imports, analytics,
 * recognition, attendance, EMFs, etc.
 *
 * Those individual records do NOT render as
 * separate Meadow bees.
 */

function isManagementDisplayShell(
  collector: {
    name: string;
    role: string;
    groupType: string;
  },
) {
  const normalizedName =
    collector.name
      .trim()
      .toLowerCase();

  return (
    collector.role === "Management" &&
    normalizedName === "management"
  );
}

function isIndividualManagementWorker(
  collector: {
    name: string;
    role: string;
    groupType: string;
  },
) {
  const normalizedName =
    collector.name
      .trim()
      .toLowerCase();

  return (
    collector.role === "Management" &&
    normalizedName !== "management"
  );
}

export default async function Home() {
  const today =
    new Date();

  const currentMonthNumber =
    getCurrentMonthNumber();

  /*
   * ==========================================
   * DATE BOUNDARIES
   * ==========================================
   */

  const hiveWeek =
    getHiveWeekStatus(
      today,
    );

  const localWeekStart =
  startOfOperationalWeek(
    today,
  );

const startOfCurrentWeek =
  new Date(
    Date.UTC(
      localWeekStart.getFullYear(),
      localWeekStart.getMonth(),
      localWeekStart.getDate(),
    ),
  );

const startOfNextWeek =
  new Date(
    startOfCurrentWeek,
  );

startOfNextWeek.setUTCDate(
  startOfNextWeek.getUTCDate() +
    7,
);

  const startOfCurrentMonth =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

  const startOfNextMonth =
    new Date(
      today.getFullYear(),
      today.getMonth() +
        1,
      1,
    );

  const startOfToday =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

  const startOfTomorrow =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() +
        1,
    );

  /*
   * ==========================================
   * HIVE SETTINGS
   * ==========================================
   */

  const settings =
    await prisma.hiveSettings.findUnique({
      where: {
        id:
          1,
      },
    });

  const centerName =
    settings?.centerName ??
    "Riviera Beach 115";

  const reportingYear =
    settings?.currentYear ??
    2027;

  const weeksInPeriod =
    settings?.weeksInPeriod ??
    4.33;

  const centerOperatingDaysPerWeek =
    settings
      ?.centerOperatingDaysPerWeek ??
    7;

  const dashboardRotationMs =
    (
      settings
        ?.dashboardRotationSeconds ??
      45
    ) *
    1000;

  const openingHour =
    settings?.openingHour ??
    6;

  const closingHour =
    settings?.closingHour ??
    19;

  /*
   * ==========================================
   * MONTHLY BUDGET
   * ==========================================
   */

  const currentBudget =
    await prisma.monthlyBudget.findUnique({
      where: {
        fiscalYear_month: {
          fiscalYear:
            reportingYear,

          month:
            currentMonthNumber,
        },
      },
    });

  const monthlyGoal =
    currentBudget
      ?.budgetLiters ??
    0;

  const monthlyGoalDonors =
    currentBudget
      ?.budgetDonors ??
    0;

  const weeklyGoalLiters =
    safeDivide(
      monthlyGoal,
      weeksInPeriod,
    );

  const weeklyGoalDonors =
    safeDivide(
      monthlyGoalDonors,
      weeksInPeriod,
    );

  /*
   * ==========================================
   * OFFICIAL CENTER PRODUCTION
   * ==========================================
   */

  const [
    monthToDateProduction,
    currentWeekEntries,
    currentDayProduction,
  ] =
    await Promise.all([
      prisma.dailyCenterProduction.aggregate({
        where: {
          entryDate: {
            gte:
              startOfCurrentMonth,

            lt:
              startOfNextMonth,
          },
        },

        _sum: {
          liters:
            true,

          donors:
            true,
        },
      }),

      prisma.dailyCenterProduction.findMany({
        where: {
          entryDate: {
            gte:
              startOfCurrentWeek,

            lt:
              startOfNextWeek,
          },
        },

        orderBy: {
          entryDate:
            "asc",
        },
      }),

      prisma.dailyCenterProduction.aggregate({
        where: {
          entryDate: {
            gte:
              startOfToday,

            lt:
              startOfTomorrow,
          },
        },

        _sum: {
          liters:
            true,

          donors:
            true,
        },
      }),
    ]);

  /*
   * ==========================================
   * CENTER TOTALS
   * ==========================================
   */

  const currentLiters =
    monthToDateProduction
      ._sum.liters ??
    0;

  const weeklyCurrentLiters =
    currentWeekEntries.reduce(
      (
        total,
        entry,
      ) =>
        total +
        entry.liters,
      0,
    );

  const weeklyCurrentDonors =
    currentWeekEntries.reduce(
      (
        total,
        entry,
      ) =>
        total +
        entry.donors,
      0,
    );

  const dailyCurrentLiters =
    currentDayProduction
      ._sum.liters ??
    0;

  const dailyCurrentDonors =
    currentDayProduction
      ._sum.donors ??
    0;

  /*
   * ==========================================
   * DAILY TARGET ENGINE
   * ==========================================
   */

  const dailyTargetPlan =
    getDailyTargets({
      weeklyGoalLiters,
      weeklyGoalDonors,

      weekStart:
        startOfCurrentWeek,

      today,

      entries:
        currentWeekEntries.map(
          (
            entry,
          ) => ({
            entryDate:
              entry.entryDate,

            liters:
              entry.liters,

            donors:
              entry.donors,
          }),
        ),
    });

  /*
   * ==========================================
   * WEEKLY CENTER RATIOS
   * ==========================================
   */

  const weeklyLitersPerDonor =
    weeklyCurrentDonors >
    0
      ? weeklyCurrentLiters /
        weeklyCurrentDonors
      : 0;

  const weeklyCurrentSticks =
    weeklyCurrentDonors;

  const weeklyLitersPerStick =
    weeklyLitersPerDonor;

  const historicalLitersPerStick =
    weeklyLitersPerDonor;

  /*
   * ==========================================
   * HOURLY OPERATIONAL INTELLIGENCE
   * ==========================================
   */

  const hourlyOperationalSummary =
    await prisma.hourlyOperationalEntry.aggregate({
      where: {
        entryDate: {
          gte:
            startOfToday,

          lt:
            startOfTomorrow,
        },
      },

      _sum: {
        successfulSticks:
          true,

        unsuccessfulSticks:
          true,

        lostVolumeMl:
          true,
      },
    });

  const successfulSticks =
    hourlyOperationalSummary
      ._sum
      .successfulSticks ??
    0;

  const unsuccessfulSticks =
    hourlyOperationalSummary
      ._sum
      .unsuccessfulSticks ??
    0;

  const lostVolume =
    (
      hourlyOperationalSummary
        ._sum
        .lostVolumeMl ??
      0
    ) /
    1000;

  const currentHour =
    today.getHours();

  /*
   * ==========================================
   * WORKER BEES
   * ==========================================
   */

  const collectors =
    await prisma.collector.findMany({
      where: {
        active:
          true,
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
    });

  /*
   * ==========================================
   * MANAGEMENT MEMBERS
   * ==========================================
   *
   * These workers remain in the database
   * individually but are hidden as separate
   * public Meadow cards.
   */

  const managementMembers =
    collectors.filter(
      (
        collector,
      ) =>
        isIndividualManagementWorker(
          collector,
        ),
    );

  const managementMemberIds =
    new Set(
      managementMembers.map(
        (
          collector,
        ) =>
          collector.id,
      ),
    );

  /*
   * ==========================================
   * PUBLIC MEADOW COLLECTORS
   * ==========================================
   */

  const meadowCollectors =
    collectors.filter(
      (
        collector,
      ) =>
        !managementMemberIds.has(
          collector.id,
        ),
    );

  /*
   * ==========================================
   * TWO-MEADOW SPLIT
   * ==========================================
   *
   * Management shell stays on Meadow 1.
   *
   * Individual management workers are excluded
   * from both Meadows.
   */

  const phlebotomyCollectors =
    meadowCollectors.filter(
      (
        collector,
      ) =>
        isManagementDisplayShell(
          collector,
        ) ||
        hasPhlebotomyEligibility(
          collector,
        ),
    );

  const supportCollectors =
    meadowCollectors.filter(
      (
        collector,
      ) =>
        !isManagementDisplayShell(
          collector,
        ) &&
        !hasPhlebotomyEligibility(
          collector,
        ),
    );

  /*
   * ==========================================
   * WEEKLY PERFORMANCE DATA
   * ==========================================
   */

  const [
    currentWeekStickEntries,
    currentWeekSupportEntries,
  ] =
    await Promise.all([
      prisma.workerStickEntry.findMany({
        where: {
          entryDate: {
            gte:
              startOfCurrentWeek,

            lt:
              startOfNextWeek,
          },
        },

        select: {
          collectorId:
            true,

          totalSticks:
            true,

          successfulSticks:
            true,
        },
      }),

      prisma.workerPerformanceEntry.findMany({
        where: {
          entryDate: {
            gte:
              startOfCurrentWeek,

            lt:
              startOfNextWeek,
          },
        },

        select: {
          collectorId:
            true,

          role:
            true,

          metric:
            true,

          totalCount:
            true,
        },
      }),
    ]);

  /*
   * ==========================================
   * PHLEBOTOMY WEEKLY TOTALS
   * ==========================================
   */

  const weeklyWorkerPerformance =
    new Map<
      number,
      {
        totalSticks: number;
        successfulSticks: number;
      }
    >();

  for (
    const entry of
      currentWeekStickEntries
  ) {
    const current =
      weeklyWorkerPerformance.get(
        entry.collectorId,
      ) ?? {
        totalSticks:
          0,

        successfulSticks:
          0,
      };

    current.totalSticks +=
      entry.totalSticks;

    current.successfulSticks +=
      entry.successfulSticks;

    weeklyWorkerPerformance.set(
      entry.collectorId,
      current,
    );
  }

  /*
   * ==========================================
   * MANAGEMENT PHLEBOTOMY AGGREGATION
   * ==========================================
   *
   * Normal workers return their own totals.
   *
   * The Management shell returns:
   *
   * Management shell record
   * + Craig
   * + Kelly
   * + Michael
   * + any future individual Management workers.
   */

  function getWeeklyPhlebotomyPerformance(
    collector: {
      id: number;
      name: string;
      role: string;
      groupType: string;
    },
  ) {
    if (
      !isManagementDisplayShell(
        collector,
      )
    ) {
      return (
        weeklyWorkerPerformance.get(
          collector.id,
        ) ?? {
          totalSticks:
            0,

          successfulSticks:
            0,
        }
      );
    }

    const aggregate = {
      totalSticks:
        0,

      successfulSticks:
        0,
    };

    const sourceIds = [
      collector.id,

      ...managementMembers.map(
        (
          member,
        ) =>
          member.id,
      ),
    ];

    for (
      const sourceId of
        sourceIds
    ) {
      const performance =
        weeklyWorkerPerformance.get(
          sourceId,
        );

      if (
        !performance
      ) {
        continue;
      }

      aggregate.totalSticks +=
        performance.totalSticks;

      aggregate.successfulSticks +=
        performance.successfulSticks;
    }

    return aggregate;
  }

  /*
   * ==========================================
   * SUPPORT WEEKLY TOTALS
   * ==========================================
   */

  const weeklySupportPerformance =
    new Map<
      string,
      number
    >();

  for (
    const entry of
      currentWeekSupportEntries
  ) {
    const key =
      supportMetricKey(
        entry.collectorId,
        entry.role,
        entry.metric,
      );

    const current =
      weeklySupportPerformance.get(
        key,
      ) ??
      0;

    weeklySupportPerformance.set(
      key,
      current +
        entry.totalCount,
    );
  }

  /*
   * ==========================================
   * SUPPORT METRIC BUILDER
   * ==========================================
   *
   * Normal Worker Bee:
   * reads only that worker.
   *
   * Management display shell:
   * reads shell + all individual management
   * workers and combines their totals.
   *
   * EMFs and Attendance are NOT included.
   */

  function getSupportMetrics(
    collector: {
      id: number;
      name: string;
      role: string;
      groupType: string;

      roleAssignments: {
        role: string;
      }[];
    },
  ): SupportMetric[] {
    const metrics:
      SupportMetric[] =
      [];

    const isManagementShell =
      isManagementDisplayShell(
        collector,
      );

    const sourceCollectors =
      isManagementShell
        ? [
            collector,
            ...managementMembers,
          ]
        : [
            collector,
          ];

    const sourceIds =
      sourceCollectors.map(
        (
          sourceCollector,
        ) =>
          sourceCollector.id,
      );

    /*
     * Management's visible card should expose
     * any operational roles performed by any
     * individual member.
     */

    const eligibleRoles =
      new Set<string>();

    for (
      const sourceCollector of
        sourceCollectors
    ) {
      for (
        const role of
          getEligibleRoleSet(
            sourceCollector,
          )
      ) {
        eligibleRoles.add(
          role,
        );
      }
    }

    function getTotal(
      role: string,
      metric: string,
    ) {
      let total =
        0;

      for (
        const collectorId of
          sourceIds
      ) {
        total +=
          weeklySupportPerformance.get(
            supportMetricKey(
              collectorId,
              role,
              metric,
            ),
          ) ??
          0;
      }

      return total;
    }

    /*
     * ========================================
     * MSA
     * ========================================
     */

    if (
      eligibleRoles.has(
        "MSA",
      )
    ) {
      metrics.push({
        label:
          "Weekly Physicals",

        value:
          getTotal(
            "MSA",
            "PHYSICALS",
          ),

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * RECEPTION TECH
     * ========================================
     */

    if (
      eligibleRoles.has(
        "RECEPTION_TECH",
      )
    ) {
      metrics.push({
        label:
          "Weekly Interviews",

        value:
          getTotal(
            "RECEPTION_TECH",
            "INTERVIEWS",
          ),

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * DST
     * ========================================
     */

    if (
      eligibleRoles.has(
        "DST",
      )
    ) {
      metrics.push({
        label:
          "Weekly Setups",

        value:
          getTotal(
            "DST",
            "SETUPS",
          ),

        emphasis:
          "gold",
      });

      metrics.push({
        label:
          "Weekly Disconnects",

        value:
          getTotal(
            "DST",
            "DISCONNECTS",
          ),

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * PROCESSOR
     * ========================================
     */

    if (
      eligibleRoles.has(
        "PROCESSOR",
      )
    ) {
      metrics.push({
        label:
          "Bottles Processed",

        value:
          getTotal(
            "PROCESSOR",
            "PROCESSED",
          ),

        emphasis:
          "gold",
      });

      metrics.push({
        label:
          "Weekly Separations",

        value:
          getTotal(
            "PROCESSOR",
            "SEPARATIONS",
          ),

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * PHLEBOTOMY — RESTICKS
     * ========================================
     */

    if (
      eligibleRoles.has(
        "PHLEBOTOMIST",
      )
    ) {
      metrics.push({
        label:
          "Weekly Resticks",

        value:
          getTotal(
            "PHLEBOTOMIST",
            "RESTICKS",
          ),

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * MANAGEMENT
     * ========================================
     */

    if (
      eligibleRoles.has(
        "MANAGEMENT",
      )
    ) {
      metrics.push({
        label:
          "Management",

        value:
          "Team Support",

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * GROUP LEAD
     * ========================================
     */

    if (
      eligibleRoles.has(
        "GROUP_LEAD",
      )
    ) {
      metrics.push({
        label:
          "Group Lead",

        value:
          "Team Support",

        emphasis:
          "gold",
      });
    }

    /*
     * ========================================
     * FALLBACK
     * ========================================
     */

    if (
      metrics.length ===
      0
    ) {
      metrics.push({
        label:
          "Role Contribution",

        value:
          "Worker Bee",

        emphasis:
          "gold",
      });
    }

    return metrics;
  }

  /*
   * ==========================================
   * VERIFIED VARIANCE-FREE STREAKS
   * ==========================================
   */

  const verifiedWorkerStickEntries =
    await prisma.workerStickEntry.findMany({
      where: {
        entryDate: {
          lt:
            startOfToday,
        },
      },

      select: {
        collectorId:
          true,

        entryDate:
          true,

        totalSticks:
          true,

        successfulSticks:
          true,
      },

      orderBy: {
        entryDate:
          "asc",
      },
    });

  const workerVarianceStreaks =
    calculateVarianceStreaks({
      entries:
        verifiedWorkerStickEntries,

      today,
    });

  /*
   * ==========================================
   * MEET THE BEES
   * ==========================================
   */

  const meetTheBeesProfiles =
    collectors
      .filter(
        (
          collector,
        ) =>
          collector
            .showOnMeetTheBees,
      )
      .map(
        (
          collector,
        ) => ({
          id:
            collector.id,

          name:
            collector.name,

          preferredName:
            collector.preferredName,

          role:
            collector.role,

          profileTitle:
            collector.profileTitle,

          bio:
            collector.bio,

          funFact:
            collector.funFact,

          photoUrl:
            collector.photoUrl,

          isEmployeeOfMonth:
            collector
              .isEmployeeOfMonth,

          recognitionMessage:
            collector
              .recognitionMessage,
        }),
      );

  /*
   * ==========================================
   * OFFICIAL CSL KPI SNAPSHOT
   * ==========================================
   */

  const cslDashboardMetrics =
    await prisma.dashboardMetric.findMany({
      where: {
        isVisible:
          true,

        publicSource:
          "CSL",
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

      include: {
        readings: {
          where: {
            source:
              "CSL",
          },

          orderBy: {
            recordedAt:
              "desc",
          },

          take:
            1,
        },
      },
    });

  const cslSnapshotMetrics =
    cslDashboardMetrics.map(
      (
        metric,
      ) => ({
        id:
          metric.id,

        displayName:
          metric.displayName,

        description:
          metric.description,

        unit:
          metric.unit,

        decimalPlaces:
          metric.decimalPlaces,

        value:
          metric.readings[0]
            ?.value ??
          null,
      }),
    );

  /*
   * ==========================================
   * EXECUTIVE COMPARATIVE KPI ENGINE
   * ==========================================
   */

  const executiveMetricComparisons =
    await getExecutiveMetricComparisons(
      today,
    );

  /*
   * ==========================================
   * CENTER INTELLIGENCE
   * ==========================================
   */

  const intelligence =
    getCenterIntelligence({
      monthlyGoalLiters:
        monthlyGoal,

      monthlyGoalDonors,

      weeksInPeriod,

      collectionDaysPerWeek:
        centerOperatingDaysPerWeek,

      currentMonthLiters:
        currentLiters,

      currentWeekLiters:
        weeklyCurrentLiters,

      currentDayLiters:
        dailyCurrentLiters,

      currentDayDonors:
        dailyCurrentDonors,

      successfulSticks,

      unsuccessfulSticks,

      lostVolume,

      historicalLitersPerStick,

      currentHour,

      openingHour,

      closingHour,
    });

  /*
   * ==========================================
   * CENTER PERFORMANCE
   * ==========================================
   */

  const hivePerformance =
    getHivePerformanceStatus(
      intelligence
        .center
        .currentWeekLiters,

      intelligence
        .goals
        .weeklyLiters,
    );

  const weekRange =
    formatOperationalWeekRange(
      today,
    );

  /*
   * ==========================================
   * REIGNING LEAD FORAGER
   * ==========================================
   */

  const reigningLeadForager =
    await updateReigningLeadForager({
      startDate:
        startOfCurrentWeek,

      endDate:
        new Date(
          startOfNextWeek.getTime() -
            1,
        ),
    });

  const executiveTopWorkerName =
    reigningLeadForager
      ? (
          reigningLeadForager
            .preferredName
            ?.trim() ||
          reigningLeadForager
            .name
        )
      : null;

  const executiveTopWorkerPercentage =
    reigningLeadForager &&
    reigningLeadForager
      .totalSticks >
      0
      ? (
          reigningLeadForager
            .successfulSticks /
          reigningLeadForager
            .totalSticks
        ) *
        100
      : null;

  /*
   * ==========================================
   * MONTHLY LEAD FORAGER
   * ==========================================
   */

  const monthlyLeadForager =
    await updateMonthlyLeadForager({
      year:
        today.getFullYear(),

      month:
        today.getMonth() +
        1,
    });

  /*
   * ==========================================
   * PAGE RENDER
   * ==========================================
   */

  return (
    <main
      style={{
        width:
          "100vw",

        height:
          "100vh",

        overflow:
          "hidden",

        backgroundColor:
          "#f7f4e9",

        fontFamily:
          "Arial, sans-serif",

        boxSizing:
          "border-box",
      }}
    >
      <DashboardRotator
        intervalMs={
          dashboardRotationMs
        }
      >
        {/* =====================================
            PAGE 1 — PHLEBOTOMY MEADOW
           ===================================== */}

        <DashboardPage>
          <HiveHeader
            centerName={
              centerName
            }

            reportingYear={
              reportingYear
            }
          />

          <ExecutiveStatusBar
            dayName={
              hiveWeek.dayName
            }

            stageLabel={
              hiveWeek.stageLabel
            }

            weekRange={
              weekRange
            }

            hivePerformance={
              hivePerformance
            }

            weeklyCurrentLiters={
              intelligence
                .center
                .currentWeekLiters
            }

            weeklyTarget={
              intelligence
                .goals
                .weeklyLiters
            }

            weeklyCurrentSticks={
              weeklyCurrentSticks
            }

            weeklyLitersPerStick={
              weeklyLitersPerStick
            }
          />

          <section
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "0.9fr 1.2fr 1.3fr",

              gap:
                "18px",

              marginTop:
                "12px",

              height:
                "31vh",

              flex:
                "0 0 31vh",

              minHeight:
                "270px",
            }}
          >
            <HoneyPotExecutive
              monthlyGoal={
                intelligence
                  .goals
                  .monthlyLiters
              }

              currentLiters={
                intelligence
                  .center
                  .currentMonthLiters
              }
            />

            <DonorMeadow
              weeklyCurrentLiters={
                intelligence
                  .center
                  .currentWeekLiters
              }

              weeklyTarget={
                intelligence
                  .goals
                  .weeklyLiters
              }

              todaysLitersTarget={
                dailyTargetPlan
                  .todaysTargetLiters
              }

              dayName={
                hiveWeek.dayName
              }

              totalFlowers={
                12
              }
            />

            <ProjectionExecutiveCard
              currentLiters={
                intelligence
                  .projection
                  .currentLiters
              }

              projectedFinish={
                intelligence
                  .projection
                  .projectedFinish
              }

              dailyGoal={
                dailyTargetPlan
                  .todaysTargetLiters
              }

              confidence={
                intelligence
                  .projection
                  .confidence
              }

              projectedVariance={
                intelligence
                  .projection
                  .projectedVariance
              }

              additionalDonorsNeeded={
                intelligence
                  .projection
                  .additionalDonorsNeeded
              }

              currentHourlyPace={
                intelligence
                  .projection
                  .currentHourlyPace
              }

              hoursRemaining={
                intelligence
                  .projection
                  .hoursRemaining
              }
            />
          </section>

          <BeeTeam
            mode="phlebotomy"

            collectors={
              phlebotomyCollectors.map(
                (
                  collector,
                ) => {
                  const performance =
                    getWeeklyPhlebotomyPerformance(
                      collector,
                    );

                  const streak =
                    workerVarianceStreaks.get(
                      collector.id,
                    );

                  const totalSticks =
                    performance
                      ?.totalSticks ??
                    0;

                  const successful =
                    performance
                      ?.successfulSticks ??
                    0;

                  const rate =
                    totalSticks >
                    0
                      ? (
                          successful /
                          totalSticks
                        ) *
                        100
                      : null;

                  return {
                    ...collector,

                    weeklySuccessfulSticks:
                      successful,

                    weeklySuccessRate:
                      rate,

                    varianceFreeStreak:
                      streak
                        ?.streakDays ??
                      0,

                    streakVerifiedThrough:
                      streak
                        ?.latestVerifiedDate ??
                      null,

                    /*
                     * Cross-trained support
                     * metrics are now passed
                     * into Meadow 1 too.
                     *
                     * WorkerBeeCard still needs
                     * the next visual update to
                     * actually render them while
                     * in phlebotomy mode.
                     */
                    supportMetrics:
                      getSupportMetrics(
                        collector,
                      ),
                  };
                },
              )
            }
          />
        </DashboardPage>

        {/* =====================================
            PAGE 2 — SUPPORT MEADOW
           ===================================== */}

        {supportCollectors.length >
          0 && (
          <DashboardPage>
            <HiveHeader
              centerName={
                centerName
              }

              reportingYear={
                reportingYear
              }
            />

            <BeeTeam
              mode="support"

              collectors={
                supportCollectors.map(
                  (
                    collector,
                  ) => ({
                    ...collector,

                    weeklySuccessfulSticks:
                      0,

                    weeklySuccessRate:
                      null,

                    varianceFreeStreak:
                      0,

                    streakVerifiedThrough:
                      null,

                    supportMetrics:
                      getSupportMetrics(
                        collector,
                      ),
                  }),
                )
              }
            />
          </DashboardPage>
        )}

        {/* =====================================
            PAGE 3 — EXECUTIVE INTELLIGENCE
           ===================================== */}

        <DashboardPage>
          <ExecutiveIntelligencePage
            centerName={
              centerName
            }

            cslMetrics={
              cslSnapshotMetrics
            }

            metrics={
              executiveMetricComparisons
            }

            todaysLitersTarget={
              dailyTargetPlan
                .todaysTargetLiters
            }

            todaysLitersCollected={
              dailyCurrentLiters
            }

            projectedFinish={
              intelligence
                .projection
                .projectedFinish
            }

            projectedVariance={
              intelligence
                .projection
                .projectedVariance
            }

            confidence={
              intelligence
                .projection
                .confidence
            }

            additionalDonorsNeeded={
              intelligence
                .projection
                .additionalDonorsNeeded
            }

            successfulSticks={
              successfulSticks
            }

            unsuccessfulSticks={
              unsuccessfulSticks
            }

            lostVolumeLiters={
              lostVolume
            }

            topWorkerName={
              executiveTopWorkerName
            }

            topWorkerPercentage={
              executiveTopWorkerPercentage
            }
          />
        </DashboardPage>

        {/* =====================================
            PAGE 4 — MEET THE BEES
           ===================================== */}

        <DashboardPage>
          <MeetTheBeesPage
            centerName={
              centerName
            }

            bees={
              meetTheBeesProfiles
            }

            monthlyLeadForagerId={
              monthlyLeadForager
                ?.collectorId ??
              null
            }
          />
        </DashboardPage>
      </DashboardRotator>
    </main>
  );
}