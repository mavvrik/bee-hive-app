export type OperationalPatternLike = {
  dayOfWeek: number;
  time: string;
  minuteOfDay: number;
  visits: number;
  units: number;
};

export type PowerHourWindow = {
  dayOfWeek: number;
  dayName: string;
  period: "MORNING" | "AFTERNOON" | "SINGLE";
  startTime: string;
  endTime: string;
  startMinute: number;
  endMinute: number;
  visits: number;
  units: number;
};

export type DayDemandSummary = {
  dayOfWeek: number;
  dayName: string;
  visits: number;
  units: number;
  powerHours: PowerHourWindow[];
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function formatMinute(minuteOfDay: number) {
  const normalized = ((minuteOfDay % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function buildRollingHourWindows(
  dayOfWeek: number,
  entries: OperationalPatternLike[],
): PowerHourWindow[] {
  const sorted = [...entries]
    .filter((entry) => entry.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.minuteOfDay - b.minuteOfDay);

  const byMinute = new Map(
    sorted.map((entry) => [entry.minuteOfDay, entry]),
  );

  const windows: PowerHourWindow[] = [];

  for (const first of sorted) {
    const second = byMinute.get(first.minuteOfDay + 30);

    if (!second) {
      continue;
    }

    const startMinute = first.minuteOfDay;
    const endMinute = second.minuteOfDay + 30;

    windows.push({
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek] ?? `Day ${dayOfWeek}`,
      period: "SINGLE",
      startTime: formatMinute(startMinute),
      endTime: formatMinute(endMinute),
      startMinute,
      endMinute,
      visits: first.visits + second.visits,
      units: first.units + second.units,
    });
  }

  return windows;
}

function strongestWindow(
  windows: PowerHourWindow[],
): PowerHourWindow | null {
  if (windows.length === 0) {
    return null;
  }

  return [...windows].sort((a, b) => {
    if (b.visits !== a.visits) {
      return b.visits - a.visits;
    }

    if (b.units !== a.units) {
      return b.units - a.units;
    }

    return a.startMinute - b.startMinute;
  })[0] ?? null;
}

export function calculatePowerHours(
  entries: OperationalPatternLike[],
  options?: {
    shortenedDays?: number[];
  },
): DayDemandSummary[] {
  const shortenedDays = new Set(options?.shortenedDays ?? []);

  return DAY_NAMES.map((dayName, dayOfWeek) => {
    const dayEntries = entries.filter(
      (entry) => entry.dayOfWeek === dayOfWeek,
    );

    const visits = dayEntries.reduce(
      (total, entry) => total + entry.visits,
      0,
    );

    const units = dayEntries.reduce(
      (total, entry) => total + entry.units,
      0,
    );

    const windows = buildRollingHourWindows(dayOfWeek, dayEntries);

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const useSinglePowerHour =
      isWeekend || shortenedDays.has(dayOfWeek);

    if (useSinglePowerHour) {
      const winner = strongestWindow(windows);

      return {
        dayOfWeek,
        dayName,
        visits,
        units,
        powerHours: winner
          ? [{ ...winner, period: "SINGLE" }]
          : [],
      };
    }

    /*
     * HIVE POWER HOUR RULE
     * Monday-Friday:
     *   1 busiest rolling hour fully before/ending at noon.
     *   1 busiest rolling hour starting at/after noon.
     *
     * Visits are the primary demand signal.
     * Units break ties and remain supporting context.
     */
    const morning = strongestWindow(
      windows.filter((window) => window.endMinute <= 12 * 60),
    );

    const afternoon = strongestWindow(
      windows.filter((window) => window.startMinute >= 12 * 60),
    );

    return {
      dayOfWeek,
      dayName,
      visits,
      units,
      powerHours: [
        ...(morning
          ? [{ ...morning, period: "MORNING" as const }]
          : []),
        ...(afternoon
          ? [{ ...afternoon, period: "AFTERNOON" as const }]
          : []),
      ],
    };
  });
}
