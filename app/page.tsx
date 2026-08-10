import ProjectionExecutiveCard from "./components/ProjectionExecutiveCard";
import { prisma } from "@/lib/prisma";
import HiveHeader from "@/app/components/HiveHeader";
import ExecutiveStatusBar from "@/app/components/ExecutiveStatusBar";
import { getCurrentMonthNumber } from "@/app/lib/fiscalMonth";
import { getCenterIntelligence } from "@/app/lib/centerIntelligence";
import DashboardRotator from "./components/DashboardRotator";
import DashboardPage from "./components/DashboardPage";
import ExecutiveIntelligencePage from "./components/ExecutiveIntelligencePage";

import {
  formatOperationalWeekRange,
  getHivePerformanceStatus,
  getHiveWeekStatus,
  startOfOperationalWeek,
} from "@/app/lib/hiveWeek";

import HoneyPotExecutive from "./components/HoneyPotExecutive";
import DonorMeadow from "./components/DonorMeadow";
import BeeTeam from "./components/BeeTeam";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = new Date();

  const currentMonthNumber =
    getCurrentMonthNumber();

  /*
   * ==========================================
   * DATE BOUNDARIES
   * ==========================================
   */

  const hiveWeek =
    getHiveWeekStatus(today);

  const startOfCurrentWeek =
    startOfOperationalWeek(today);

  const startOfNextWeek =
    new Date(startOfCurrentWeek);

  startOfNextWeek.setDate(
    startOfNextWeek.getDate() + 7,
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

  const reportingYear =
    settings?.currentYear ?? 2027;

  const weeksInPeriod =
    settings?.weeksInPeriod ?? 4.33;

  const centerOperatingDaysPerWeek =
    settings?.centerOperatingDaysPerWeek ??
    7;

  const workerDaysPerWeek =
    settings?.workerDaysPerWeek ?? 5;

  const dashboardRotationMs =
    (settings?.dashboardRotationSeconds ??
      45) * 1000;

  const openingHour =
    settings?.openingHour ?? 6;

  const closingHour =
    settings?.closingHour ?? 19;

  /*
   * ==========================================
   * MONTHLY BUDGET
   * ==========================================
   */

  const currentBudget =
    await prisma.monthlyBudget.findUnique({
      where: {
        fiscalYear_month: {
          fiscalYear: reportingYear,
          month: currentMonthNumber,
        },
      },
    });

  const monthlyGoal =
    currentBudget?.budgetLiters ?? 0;

  const monthlyGoalDonors =
    currentBudget?.budgetDonors ?? 0;

  /*
   * ==========================================
   * OFFICIAL CENTER PRODUCTION
   * ==========================================
   *
   * DailyCenterProduction is now the sole
   * source of truth for center liters and
   * donor totals.
   */

  const monthToDateProduction =
    await prisma.dailyCenterProduction.aggregate(
      {
        where: {
          entryDate: {
            gte: startOfCurrentMonth,
            lt: startOfNextMonth,
          },
        },

        _sum: {
          liters: true,
          donors: true,
        },
      },
    );

  const currentWeekProduction =
    await prisma.dailyCenterProduction.aggregate(
      {
        where: {
          entryDate: {
            gte: startOfCurrentWeek,
            lt: startOfNextWeek,
          },
        },

        _sum: {
          liters: true,
          donors: true,
        },
      },
    );

  const currentDayProduction =
    await prisma.dailyCenterProduction.aggregate(
      {
        where: {
          entryDate: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },

        _sum: {
          liters: true,
          donors: true,
        },
      },
    );

  /*
   * ==========================================
   * OFFICIAL CENTER TOTALS
   * ==========================================
   */

  const currentLiters =
    monthToDateProduction._sum.liters ??
    0;

  const weeklyCurrentLiters =
    currentWeekProduction._sum.liters ??
    0;

  const weeklyCurrentDonors =
    currentWeekProduction._sum.donors ??
    0;

  const dailyCurrentLiters =
    currentDayProduction._sum.liters ??
    0;

  const dailyCurrentDonors =
    currentDayProduction._sum.donors ??
    0;

  /*
   * Official weekly liters per donor.
   *
   * Some existing component names still use
   * the older "stick" terminology. The values
   * supplied here are now based on official
   * center donor totals.
   */

  const weeklyLitersPerDonor =
    weeklyCurrentDonors > 0
      ? weeklyCurrentLiters /
        weeklyCurrentDonors
      : 0;

  const weeklyCurrentSticks =
    weeklyCurrentDonors;

  const weeklyLitersPerStick =
    weeklyLitersPerDonor;

  /*
   * Temporary historical average.
   *
   * Later we can calculate this from a rolling
   * DailyCenterProduction history.
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
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },

        _sum: {
          successfulSticks: true,
          unsuccessfulSticks: true,
          lostVolumeMl: true,
        },
      },
    );

  const successfulSticks =
    hourlyOperationalSummary._sum
      .successfulSticks ?? 0;

  const unsuccessfulSticks =
    hourlyOperationalSummary._sum
      .unsuccessfulSticks ?? 0;

  /*
   * Projection engine expects liters.
   * Database stores lost volume in milliliters.
   */

  const lostVolume =
    (hourlyOperationalSummary._sum
      .lostVolumeMl ?? 0) / 1000;

  const currentHour =
    today.getHours();

  /*
   * ==========================================
   * WORKER BEES
   * ==========================================
   *
   * Workers are now loaded as workforce /
   * target records only.
   *
   * DailyEntry is no longer queried.
   */

  const collectors =
    await prisma.collector.findMany({
      where: {
        active: true,
      },

      orderBy: {
        position: "asc",
      },
    });

  /*
   * ==========================================
   * DYNAMIC KPI ENGINE
   * ==========================================
   */

  const visibleDashboardMetrics =
    await prisma.dashboardMetric.findMany({
      where: {
        isVisible: true,
      },

      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          displayName: "asc",
        },
      ],

      include: {
        readings: {
          orderBy: {
            recordedAt: "desc",
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
          id: metric.id,

          displayName:
            metric.displayName,

          description:
            metric.description,

          unit:
            metric.unit,

          decimalPlaces:
            metric.decimalPlaces,

          value:
            publicReading?.value ??
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
   *
   * Contributors still receive weighted targets.
   *
   * currentLiters is intentionally zero because
   * individual worker production is no longer
   * collected or inferred.
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

      contributors: collectors
        .filter(
          (collector) =>
            collector.participatesInTarget,
        )
        .map((collector) => ({
          id: collector.id,

          name:
            collector.name,

          weight:
            collector.allocationWeight,

          /*
           * Intentionally zero.
           *
           * We no longer enter or infer
           * individual production.
           */
          currentLiters: 0,
        })),
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
    formatOperationalWeekRange(today);

  /*
   * Individual Lead Forager is intentionally
   * unavailable until we introduce a reliable
   * recognition metric or another legitimate
   * worker-level source.
   */

  const executiveTopWorkerName =
    null;

  const executiveTopWorkerPercentage =
    null;

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",

        overflow: "hidden",

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
              settings?.centerName ??
              "Riviera Beach 115"
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
              display: "grid",

              gridTemplateColumns:
                "0.9fr 1.2fr 1.3fr",

              gap: "18px",

              marginTop: "12px",

              height: "31vh",
              flex: "0 0 31vh",

              minHeight: "270px",
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

              dayName={
                hiveWeek.dayName
              }

              totalFlowers={12}
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
                intelligence.goals
                  .dailyLiters
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

            contributorIntelligence={
              intelligence.contributors
            }

            workerDaysPerWeek={
              workerDaysPerWeek
            }
          />
        </DashboardPage>

        {/* =====================================
            PAGE 2 — EXECUTIVE INTELLIGENCE
           ===================================== */}

        <DashboardPage>
          <ExecutiveIntelligencePage
            centerName={
              settings?.centerName ??
              "Riviera Beach 115"
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
      </DashboardRotator>
    </main>
  );
}