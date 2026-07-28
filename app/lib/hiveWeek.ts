export type HiveWeekDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type HiveStage =
  | "new-week"
  | "momentum"
  | "growth"
  | "midweek"
  | "harvest"
  | "goal-push"
  | "celebration";

export type HivePerformanceLevel =
  | "starting"
  | "building"
  | "on-pace"
  | "strong"
  | "goal-achieved"
  | "exceeding";

export type HiveWeekStatus = {
  dayName: HiveWeekDay;
  dayIndex: number;
  dayNumber: number;
  stage: HiveStage;
  stageLabel: string;
  stageMessage: string;
  weekStart: Date;
  weekEnd: Date;
  completedDays: number;
  remainingDays: number;
};

export type HivePerformanceStatus = {
  percentage: number;
  cappedPercentage: number;
  level: HivePerformanceLevel;
  levelLabel: string;
  message: string;
  flowersUnlocked: number;
  beeActivityLevel: number;
  honeyGlowLevel: number;
  goalAchieved: boolean;
  exceedingGoal: boolean;
};

const DAY_NAMES: HiveWeekDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const STAGE_CONFIG: Record<
  HiveWeekDay,
  {
    stage: HiveStage;
    stageLabel: string;
    stageMessage: string;
  }
> = {
  Sunday: {
    stage: "new-week",
    stageLabel: "New Hive",
    stageMessage:
      "A new operational week begins. Every liter matters.",
  },

  Monday: {
    stage: "momentum",
    stageLabel: "Building Momentum",
    stageMessage:
      "The hive is building momentum for the week ahead.",
  },

  Tuesday: {
    stage: "growth",
    stageLabel: "Growth",
    stageMessage:
      "Production is growing as every collector contributes.",
  },

  Wednesday: {
    stage: "midweek",
    stageLabel: "Midweek Strength",
    stageMessage:
      "The hive has reached the middle of its weekly journey.",
  },

  Thursday: {
    stage: "harvest",
    stageLabel: "Harvest",
    stageMessage:
      "The hive is gathering strength for the final push.",
  },

  Friday: {
    stage: "goal-push",
    stageLabel: "Push to Goal",
    stageMessage:
      "Every collected liter brings the hive closer to its goal.",
  },

  Saturday: {
    stage: "celebration",
    stageLabel: "Finish Strong",
    stageMessage:
      "The hive is completing its Sunday-to-Saturday journey.",
  },
};

export function getHiveWeekStatus(
  date: Date = new Date(),
): HiveWeekStatus {
  const dayIndex = date.getDay();
  const dayName = DAY_NAMES[dayIndex];

  const weekStart = startOfOperationalWeek(date);
  const weekEnd = endOfOperationalWeek(date);

  const stageConfig = STAGE_CONFIG[dayName];

  return {
    dayName,
    dayIndex,
    dayNumber: dayIndex + 1,
    stage: stageConfig.stage,
    stageLabel: stageConfig.stageLabel,
    stageMessage: stageConfig.stageMessage,
    weekStart,
    weekEnd,
    completedDays: dayIndex,
    remainingDays: 6 - dayIndex,
  };
}

export function getHivePerformanceStatus(
  currentLiters: number,
  weeklyTarget: number,
): HivePerformanceStatus {
  const safeCurrentLiters = Math.max(currentLiters, 0);
  const safeWeeklyTarget = Math.max(weeklyTarget, 0);

  const percentage =
    safeWeeklyTarget > 0
      ? (safeCurrentLiters / safeWeeklyTarget) * 100
      : 0;

  const cappedPercentage = Math.min(
    Math.max(percentage, 0),
    100,
  );

  if (percentage >= 110) {
    return {
      percentage,
      cappedPercentage,
      level: "exceeding",
      levelLabel: "Exceeding Goal",
      message:
        "Outstanding performance. The hive is producing beyond its weekly target.",
      flowersUnlocked: 12,
      beeActivityLevel: 5,
      honeyGlowLevel: 5,
      goalAchieved: true,
      exceedingGoal: true,
    };
  }

  if (percentage >= 100) {
    return {
      percentage,
      cappedPercentage,
      level: "goal-achieved",
      levelLabel: "Hive Goal Achieved",
      message:
        "The weekly liter target has been achieved. Outstanding teamwork.",
      flowersUnlocked: 12,
      beeActivityLevel: 4,
      honeyGlowLevel: 5,
      goalAchieved: true,
      exceedingGoal: false,
    };
  }

  if (percentage >= 75) {
    return {
      percentage,
      cappedPercentage,
      level: "strong",
      levelLabel: "Strong Progress",
      message:
        "The hive is approaching its weekly goal. Keep the momentum going.",
      flowersUnlocked: 9,
      beeActivityLevel: 4,
      honeyGlowLevel: 3,
      goalAchieved: false,
      exceedingGoal: false,
    };
  }

  if (percentage >= 50) {
    return {
      percentage,
      cappedPercentage,
      level: "on-pace",
      levelLabel: "Building Strength",
      message:
        "The hive is making steady progress toward the weekly target.",
      flowersUnlocked: 6,
      beeActivityLevel: 3,
      honeyGlowLevel: 2,
      goalAchieved: false,
      exceedingGoal: false,
    };
  }

  if (percentage >= 25) {
    return {
      percentage,
      cappedPercentage,
      level: "building",
      levelLabel: "Momentum Building",
      message:
        "The first major milestone has been reached. Keep building.",
      flowersUnlocked: 3,
      beeActivityLevel: 2,
      honeyGlowLevel: 1,
      goalAchieved: false,
      exceedingGoal: false,
    };
  }

  return {
    percentage,
    cappedPercentage,
    level: "starting",
    levelLabel: "Week in Progress",
    message:
      "The hive is beginning its weekly production journey.",
    flowersUnlocked: 1,
    beeActivityLevel: 1,
    honeyGlowLevel: 0,
    goalAchieved: false,
    exceedingGoal: false,
  };
}

export function startOfOperationalWeek(
  date: Date = new Date(),
): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());

  return result;
}

export function endOfOperationalWeek(
  date: Date = new Date(),
): Date {
  const result = startOfOperationalWeek(date);

  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

export function formatOperationalWeekRange(
  date: Date = new Date(),
): string {
  const weekStart = startOfOperationalWeek(date);
  const weekEnd = endOfOperationalWeek(date);

  const startLabel = weekStart.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );

  const endLabel = weekEnd.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return `${startLabel} – ${endLabel}`;
}