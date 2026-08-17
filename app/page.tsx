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

function safeDivide(
  numerator: number,
  denominator: number,
) {
  if (denominator <= 0) {
    return 0;
  }

  return (
    numerator /
    denominator
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

  const startOfCurrentWeek =
    startOfOperationalWeek(
      today,
    );

  const startOfNextWeek =
    new Date(
      startOfCurrentWeek,
    );

  startOfNextWeek.setDate(
    startOfNextWeek.getDate() +
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
      today.getMonth() + 1,
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
      today.getDate() + 1,
    );

  /*
   * ==========================================
   * HIVE SETTINGS
   * ==========================================
   */

  const settings =
    await prisma.hiveSettings.findUnique({
      where: {
        id: 1,
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
    settings?.centerOperatingDaysPerWeek ??
    7;

  const dashboardRotationMs =
    (
      settings?.dashboardRotationSeconds ??
      45
    ) * 1000;

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
      ?.budgetLiters ?? 0;

  const monthlyGoalDonors =
    currentBudget
      ?.budgetDonors ?? 0;

  /*
   * These are the FIXED weekly goals used
   * by both the Meadow and rolling target
   * engine.
   */

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
  ] = await Promise.all([
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
        liters: true,
        donors: true,
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
        liters: true,
        donors: true,
      },
    }),
  ]);

  /*
   * ==========================================
   * OFFICIAL CENTER TOTALS
   * ==========================================
   */

  const currentLiters =
    monthToDateProduction._sum
      .liters ?? 0;

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
    currentDayProduction._sum
      .liters ?? 0;

  const dailyCurrentDonors =
    currentDayProduction._sum
      .donors ?? 0;

  /*
   * ==========================================
   * SHARED DAILY TARGET ENGINE
   * ==========================================
   *
   * This is the exact same rolling-target
   * engine used by Daily Center Production.
   *
   * Weekly target stays fixed.
   *
   * Today's target =
   * remaining weekly requirement divided
   * across the remaining operating days.
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
          (entry) => ({
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
   * Existing ExecutiveStatusBar still
   * uses older "stick" prop names.
   *
   * These values currently represent
   * official center donor totals.
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

  /*
   * Temporary center-level historical
   * production average.
   */

  const historicalLitersPerStick =
    weeklyLitersPerDonor;

  /*
   * ==========================================
   * HOURLY OPERATIONAL INTELLIGENCE
   * ==========================================
   */

  const hourlyOperationalSummary =
    await prisma.hourlyOperationalEntry.aggregate(
      {
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
      },
    );

  const successfulSticks =
    hourlyOperationalSummary._sum
      .successfulSticks ??
    0;

  const unsuccessfulSticks =
    hourlyOperationalSummary._sum
      .unsuccessfulSticks ??
    0;

  /*
   * Projection engine expects liters.
   * Lost volume is stored in milliliters.
   */

  const lostVolume =
    (
      hourlyOperationalSummary._sum
        .lostVolumeMl ??
      0
    ) / 1000;

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
        active: true,
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
   * MEET THE BEES
   * ==========================================
   */

  const meetTheBeesProfiles =
    collectors
      .filter(
        (collector) =>
          collector.showOnMeetTheBees,
      )
      .map(
        (collector) => ({
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
            collector.isEmployeeOfMonth,

          recognitionMessage:
            collector.recognitionMessage,
        }),
      );

  /*
   * ==========================================
   * DYNAMIC KPI ENGINE
   * ==========================================
   */

  const visibleDashboardMetrics =
    await prisma.dashboardMetric.findMany({
      where: {
        isVisible:
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

      include: {
        readings: {
          orderBy: {
            recordedAt:
              "desc",
          },

          take: 50,
        },
      },
    });

  const executiveMetrics =
    visibleDashboardMetrics.map(
      (metric) => {
        const publicReading =
          metric.readings.find(
            (reading) =>
              reading.source ===
              metric.publicSource,
          );

        return {
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
            publicReading
              ?.value ??
            null,

          source:
            metric.publicSource,
        };
      },
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
      intelligence.center
        .currentWeekLiters,

      intelligence.goals
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
        ) * 100
      : null;

  /*
   * ==========================================
   * MONTHLY LEAD FORAGER
   * ==========================================
   *
   * Monthly recognition is independent
   * from the reigning Lead Forager crown.
   */

  const monthlyLeadForager =
    await updateMonthlyLeadForager({
      year:
        today.getFullYear(),

      month:
        today.getMonth() +
        1,
    });

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
            PAGE 1 — MAIN HIVE DASHBOARD
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
              intelligence.center
                .currentWeekLiters
            }

            weeklyTarget={
              intelligence.goals
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
                intelligence.goals
                  .monthlyLiters
              }

              currentLiters={
                intelligence.center
                  .currentMonthLiters
              }
            />

            <DonorMeadow
              weeklyCurrentLiters={
                intelligence.center
                  .currentWeekLiters
              }

              weeklyTarget={
                intelligence.goals
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
                intelligence.projection
                  .currentLiters
              }

              projectedFinish={
                intelligence.projection
                  .projectedFinish
              }

              dailyGoal={
                dailyTargetPlan
                  .todaysTargetLiters
              }

              confidence={
                intelligence.projection
                  .confidence
              }

              projectedVariance={
                intelligence.projection
                  .projectedVariance
              }

              additionalDonorsNeeded={
                intelligence.projection
                  .additionalDonorsNeeded
              }

              currentHourlyPace={
                intelligence.projection
                  .currentHourlyPace
              }

              hoursRemaining={
                intelligence.projection
                  .hoursRemaining
              }
            />
          </section>

          <BeeTeam
            collectors={
              collectors
            }
          />
        </DashboardPage>

        {/* =====================================
            PAGE 2 — EXECUTIVE INTELLIGENCE
           ===================================== */}

        <DashboardPage>
          <ExecutiveIntelligencePage
            centerName={
              centerName
            }

            metrics={
              executiveMetrics
            }

            projectedFinish={
              intelligence.projection
                .projectedFinish
            }

            projectedVariance={
              intelligence.projection
                .projectedVariance
            }

            confidence={
              intelligence.projection
                .confidence
            }

            additionalDonorsNeeded={
              intelligence.projection
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
            PAGE 3 — RIVIERA BEEch
            MEET THE BEES
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