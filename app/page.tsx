import ProjectionExecutiveCard from "./components/ProjectionExecutiveCard";
import { prisma } from "@/lib/prisma";
import HiveHeader from "@/app/components/HiveHeader";
import ExecutiveStatusBar from "@/app/components/ExecutiveStatusBar";
import { getCurrentMonthNumber } from "@/app/lib/fiscalMonth";
import { getCenterIntelligence } from "@/app/lib/centerIntelligence";
import DashboardRotator from "./components/DashboardRotator";
import DashboardPage from "./components/DashboardPage";
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
   * Sunday-to-Saturday operational week.
   */
  const hiveWeek = getHiveWeekStatus(today);

  const startOfCurrentWeek =
    startOfOperationalWeek(today);

  const startOfNextWeek = new Date(
    startOfCurrentWeek,
  );

  startOfNextWeek.setDate(
    startOfNextWeek.getDate() + 7,
  );

  /*
   * Current calendar-month boundaries.
   */
  const startOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  const startOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1,
  );

  const startOfToday = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate(),
);

const startOfTomorrow = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() + 1,
);

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

  const collectionDaysPerWeek =
    settings?.collectionDaysPerWeek ?? 6;

  const currentBudget =
    await prisma.monthlyBudget.findUnique({
      where: {
        fiscalYear_month: {
          fiscalYear: reportingYear,
          month: currentMonthNumber,
        },
      },
    });

  /*
   * Monthly liters collected.
   */
  const monthToDateProduction =
    await prisma.dailyEntry.aggregate({
      where: {
        entryDate: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: {
        liters: true,
        sticks: true,
      },
    });

    /*
 * Total center production for today.
 */
const currentDayProduction =
  await prisma.dailyEntry.aggregate({
    where: {
      entryDate: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    _sum: {
      liters: true,
      sticks: true,
    },
  });

  const hourlyOperationalSummary =
  await prisma.hourlyOperationalEntry.aggregate({
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
  });

  const successfulSticks =
  hourlyOperationalSummary._sum
    .successfulSticks ?? 0;

const unsuccessfulSticks =
  hourlyOperationalSummary._sum
    .unsuccessfulSticks ?? 0;

/*
 * Projection engine expects liters.
 * Database stores milliliters.
 */
const lostVolume =
  (hourlyOperationalSummary._sum
    .lostVolumeMl ?? 0) / 1000;

const currentHour =
  today.getHours();

const openingHour =
  settings?.openingHour ?? 6;

const closingHour =
  settings?.closingHour ?? 19;

  /*
   * Total center liters collected during the
   * current Sunday-to-Saturday week.
   *
   * This includes all DailyEntry records,
   * independently of whether a collector is
   * currently active.
   */
  const currentWeekProduction =
    await prisma.dailyEntry.aggregate({
      where: {
        entryDate: {
          gte: startOfCurrentWeek,
          lt: startOfNextWeek,
        },
      },
      _sum: {
        liters: true,
        sticks: true,
      },
    });

  /*
   * Active collectors and their individual
   * entries for the current operational week.
   */
  const collectors =
    await prisma.collector.findMany({
      where: {
        active: true,
      },
      orderBy: {
        position: "asc",
      },
      include: {
        entries: {
          where: {
            entryDate: {
              gte: startOfCurrentWeek,
              lt: startOfNextWeek,
            },
          },
          select: {
            liters: true,
            sticks: true,
          },
        },
      },
    });

    /*
 * Individual contributor production for today.
 */
const currentDayContributorProduction =
  await prisma.dailyEntry.groupBy({
    by: ["collectorId"],
    where: {
      entryDate: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
    _sum: {
      liters: true,
      sticks: true,
    },
  });

  const monthlyGoal =
    currentBudget?.budgetLiters ?? 0;

  const monthlyGoalDonors =
    currentBudget?.budgetDonors ?? 0;

  /*
   * The Goal Engine is now the single source
   * of truth for center targets.
   */
  
  const currentLiters =
    monthToDateProduction._sum.liters ?? 0;

  const weeklyCurrentLiters =
    currentWeekProduction._sum.liters ?? 0;

    const dailyCurrentLiters =
  currentDayProduction._sum.liters ?? 0;

const dailyCurrentDonors =
  currentDayProduction._sum.sticks ?? 0;

  const weeklyCurrentSticks =
    currentWeekProduction._sum.sticks ?? 0;

  const weeklyLitersPerStick =
    weeklyCurrentSticks > 0
      ? weeklyCurrentLiters /
        weeklyCurrentSticks
      : 0;

      /*
 * Use current week's average until we have
 * a dedicated historical rolling average.
 */
      const historicalLitersPerStick =
  weeklyLitersPerStick;

      const intelligence =
  getCenterIntelligence({
    monthlyGoalLiters: monthlyGoal,
    monthlyGoalDonors,
    weeksInPeriod,
    collectionDaysPerWeek,

    currentMonthLiters: currentLiters,
    currentWeekLiters: weeklyCurrentLiters,
    currentDayLiters: dailyCurrentLiters,
    currentDayDonors: dailyCurrentDonors,

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
      .map((collector) => {
        const today =
          currentDayContributorProduction.find(
            (entry) =>
              entry.collectorId ===
              collector.id,
          );

        return {
          id: collector.id,
          name: collector.name,
          weight:
            collector.allocationWeight,
          currentLiters:
            today?._sum.liters ?? 0,
        };
      }),
  });

  const weeklyTarget =
  intelligence.goals.weeklyLiters;

  /*
   * One performance object controls:
   *
   * - flower bloom count
   * - bee activity
   * - Honey Pot glow
   * - weekly celebration
   */
  const hivePerformance =
  getHivePerformanceStatus(
    intelligence.center.currentWeekLiters,
    intelligence.goals.weeklyLiters,
  );

  const weekRange =
    formatOperationalWeekRange(today);

  return (
  <main
    style={{
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "#f7f4e9",
      fontFamily: "Arial, sans-serif",
      boxSizing: "border-box",
    }}
  >
    <DashboardRotator intervalMs={20000}>
      <DashboardPage>
        <HiveHeader
          centerName={
            settings?.centerName ??
            "Riviera Beach 115"
          }
          reportingYear={reportingYear}
        />

        <ExecutiveStatusBar
          dayName={hiveWeek.dayName}
          stageLabel={hiveWeek.stageLabel}
          weekRange={weekRange}
          hivePerformance={hivePerformance}
          weeklyCurrentLiters={
            intelligence.center
              .currentWeekLiters
          }
          weeklyTarget={
            intelligence.goals.weeklyLiters
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
              intelligence.goals.monthlyLiters
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
              intelligence.goals.weeklyLiters
            }
            dayName={hiveWeek.dayName}
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
              intelligence.goals.dailyLiters
            }
            confidence={
              intelligence.projection.confidence
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
          collectors={collectors}
          contributorIntelligence={
            intelligence.contributors
          }
        />
      </DashboardPage>
    </DashboardRotator>
  </main>
);
}