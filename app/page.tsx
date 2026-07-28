import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HiveHeader from "@/app/components/HiveHeader";
import { getCurrentMonthNumber } from "@/app/lib/fiscalMonth";
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
      },
    });

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
          },
        },
      },
    });

  const monthlyGoal =
    currentBudget?.budgetLiters ?? 0;

  const currentLiters =
    monthToDateProduction._sum.liters ?? 0;

  const weeklyCurrentLiters =
    currentWeekProduction._sum.liters ?? 0;

  /*
   * Current V1 weekly goal:
   *
   * Monthly budget divided by the configured
   * number of operational weeks in the period.
   */
  const weeklyTarget =
    weeksInPeriod > 0
      ? monthlyGoal / weeksInPeriod
      : 0;

  /*
   * One performance object will eventually
   * control:
   *
   * - flower bloom count
   * - bee activity
   * - Honey Pot glow
   * - weekly celebration
   */
  const hivePerformance =
    getHivePerformanceStatus(
      weeklyCurrentLiters,
      weeklyTarget,
    );

  const weekRange =
    formatOperationalWeekRange(today);

  /*
   * Donor placeholders remain separate for now.
   *
   * They will be removed from the Meadow during
   * the next step because V1 will use liters as
   * the only ecosystem driver.
   */
  
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f7f4e9",
        padding: "18px 24px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <HiveHeader
        centerName={
          settings?.centerName ??
          "Riviera Beach 115"
        }
        reportingYear={reportingYear}
      />

      <Link
  href="/settings"
  aria-label="Open Hive settings"
  style={{
    position: "absolute",
    top: "20px",
    right: "24px",
    zIndex: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    padding: "8px 14px",
    border: "1px solid #c9a33b",
    borderRadius: "10px",
    background:
      "linear-gradient(180deg, #fff9dc 0%, #f1d878 100%)",
    boxShadow: "0 3px 10px rgba(77, 54, 8, 0.15)",
    color: "#3c2a08",
    fontSize: "0.75rem",
    fontWeight: 900,
    letterSpacing: "0.04em",
    textDecoration: "none",
    textTransform: "uppercase",
  }}
>
  <span
    aria-hidden="true"
    style={{
      fontSize: "1rem",
      lineHeight: 1,
    }}
  >
    ⚙
  </span>
  Settings
</Link>

      <section
        aria-label="Current operational week"
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr auto auto",
          alignItems: "center",
          gap: "24px",
          marginTop: "12px",
          padding: "10px 18px",
          border: hivePerformance.goalAchieved
            ? "1px solid #d99b0b"
            : "1px solid #dfc36c",
          borderRadius: "14px",
          background:
            hivePerformance.goalAchieved
              ? "linear-gradient(90deg, #fff5bd, #ffe28a)"
              : "linear-gradient(90deg, #fffdf4, #fff4c7)",
          boxShadow:
            hivePerformance.goalAchieved
              ? "0 5px 18px rgba(203, 139, 6, 0.18)"
              : "0 4px 12px rgba(98, 70, 10, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 3px",
              color: "#98701d",
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Sunday–Saturday Operational Week
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <strong
              style={{
                color: "#3c2a08",
                fontSize: "1.05rem",
              }}
            >
              {hiveWeek.dayName}:{" "}
              {hiveWeek.stageLabel}
            </strong>

            <span
              style={{
                color: "#7a6538",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {weekRange}
            </span>
          </div>

          <p
            style={{
              margin: "3px 0 0",
              color: "#69562e",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {hivePerformance.message}
          </p>
        </div>

        <div
          style={{
            minWidth: "150px",
            textAlign: "right",
          }}
        >
          <span
            style={{
              display: "block",
              color: "#8b6a22",
              fontSize: "0.58rem",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Weekly Liters
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "2px",
              color: "#342406",
              fontSize: "1.15rem",
            }}
          >
            {formatLiters(
              weeklyCurrentLiters,
            )}
          </strong>

          <small
            style={{
              color: "#766239",
              fontSize: "0.65rem",
              fontWeight: 700,
            }}
          >
            of {formatLiters(weeklyTarget)}
          </small>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            border:
              "2px solid rgba(191, 137, 16, 0.58)",
            borderRadius: "50%",
            background:
              hivePerformance.goalAchieved
                ? "linear-gradient(180deg, #ffd94f, #e8a713)"
                : "linear-gradient(180deg, #fff4b0, #e9c353)",
            boxShadow:
              hivePerformance.goalAchieved
                ? "0 0 18px rgba(230, 164, 23, 0.45)"
                : "none",
            color: "#3d2a05",
            fontSize: "1.13rem",
            fontWeight: 900,
          }}
        >
          {Math.round(
            hivePerformance.percentage,
          )}
          %
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "0.9fr 1.1fr",
          gap: "18px",
          marginTop: "12px",
          height: "27vh",
          flex: "0 0 27vh",
          minHeight: "220px",
        }}
      >
        <HoneyPotExecutive
          monthlyGoal={monthlyGoal}
          currentLiters={currentLiters}
        />

        <DonorMeadow
          weeklyCurrentLiters={
          weeklyCurrentLiters
            }
  weeklyTarget={weeklyTarget}
  dayName={hiveWeek.dayName}
  totalFlowers={12}
        />
      </section>

      <BeeTeam
        collectors={collectors}
        monthlyGoal={monthlyGoal}
        weeksInPeriod={weeksInPeriod}
      />
    </main>
  );
}

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}