import { prisma } from "@/lib/prisma";

export type PowerHourWindow = {
  label: string;
  startMinute: number;
  endMinute: number;
  startTime: string;
  endTime: string;
};

function formatMinute(minute: number) {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function bestHour(rows: { minuteOfDay: number; visits: number }[]) {
  return rows
    .map((row) => {
      const next = rows.find((r) => r.minuteOfDay === row.minuteOfDay + 30);
      return next
        ? { startMinute: row.minuteOfDay, score: row.visits + next.visits }
        : null;
    })
    .filter((x): x is { startMinute: number; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);
}

export async function getTodayPowerHours(dayOfWeek: number) {
  const latest = await prisma.intelligenceDataImport.findFirst({
    where: {
      status: "SUCCESS",
      dataSource: { key: "ARRIVAL_PRODUCTION_PATTERNS" },
    },
    orderBy: { importedAt: "desc" },
  });

  if (!latest) return [] as PowerHourWindow[];

  const rows = await prisma.operationalPatternEntry.findMany({
    where: { dataImportId: latest.id, dayOfWeek },
    select: { minuteOfDay: true, visits: true },
    orderBy: { minuteOfDay: "asc" },
  });

  const scored = bestHour(rows);
  const make = (startMinute: number, label: string): PowerHourWindow => ({
    label,
    startMinute,
    endMinute: startMinute + 60,
    startTime: formatMinute(startMinute),
    endTime: formatMinute(startMinute + 60),
  });

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return scored[0] ? [make(scored[0].startMinute, "Power Hour")] : [];
  }

  const before = scored.find((x) => x.startMinute < 12 * 60);
  const after = scored.find((x) => x.startMinute >= 12 * 60);

  return [
    ...(before ? [make(before.startMinute, "Morning Power Hour")] : []),
    ...(after ? [make(after.startMinute, "Afternoon Power Hour")] : []),
  ];
}
