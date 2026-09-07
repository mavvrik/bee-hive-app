import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getExecutiveMetricComparisons } from "@/app/lib/executiveComparisonEngine";

export const dynamic = "force-dynamic";

function parseDateText(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("A valid date is required.");
  }

  const date = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("A valid date is required.");
  }

  return date;
}

function startOfUtcDay(dateText: string) {
  return new Date(`${dateText}T00:00:00.000Z`);
}

function nextUtcDay(dateText: string) {
  const date = startOfUtcDay(dateText);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  try {
    const dateText = request.nextUrl.searchParams.get("date");
    const selectedDate = parseDateText(dateText);
    const selectedDateText = selectedDate.toISOString().slice(0, 10);

    const [metrics, comparisons] = await Promise.all([
      prisma.dashboardMetric.findMany({
        where: {
          comparisonEnabled: true,
          isVisible: true,
        },
        orderBy: [
          { displayOrder: "asc" },
          { displayName: "asc" },
        ],
        select: {
          id: true,
          key: true,
          displayName: true,
          description: true,
          unit: true,
          decimalPlaces: true,
          publicSource: true,
          dataSourceKey: true,
        },
      }),
      getExecutiveMetricComparisons(selectedDate),
    ]);

    const comparisonById = new Map(
      comparisons.map((metric) => [metric.metricId, metric]),
    );

    return NextResponse.json({
      date: selectedDateText,
      metrics: metrics.map((metric) => {
        const comparison = comparisonById.get(metric.id);
        const selectedDay =
          comparison?.days.find(
            (day) => day.currentDate === selectedDateText,
          ) ?? null;

        return {
          id: metric.id,
          key: metric.key,
          displayName: metric.displayName,
          description: metric.description,
          unit: metric.unit,
          decimalPlaces: metric.decimalPlaces,
          source: metric.publicSource,
          dataSourceKey: metric.dataSourceKey,
          editable: metric.dataSourceKey === null,
          value: selectedDay?.currentValue ?? null,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load comparison metrics.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  try {
    const body = (await request.json()) as {
      date?: unknown;
      values?: unknown;
    };

    const dateText =
      typeof body.date === "string" ? body.date : null;

    parseDateText(dateText);

    if (!Array.isArray(body.values)) {
      throw new Error("Metric values are required.");
    }

    const submitted = body.values.map((item) => {
      if (typeof item !== "object" || item === null) {
        throw new Error("Invalid metric value payload.");
      }

      const record = item as Record<string, unknown>;
      const metricId = Number(record.metricId);
      const rawValue = record.value;

      if (!Number.isInteger(metricId) || metricId <= 0) {
        throw new Error("Invalid metric identifier.");
      }

      if (
        rawValue !== null &&
        (typeof rawValue !== "number" || !Number.isFinite(rawValue))
      ) {
        throw new Error("Metric values must be numeric or blank.");
      }

      return {
        metricId,
        value: rawValue as number | null,
      };
    });

    const metricIds = submitted.map((item) => item.metricId);

    const metrics = await prisma.dashboardMetric.findMany({
      where: {
        id: { in: metricIds },
        comparisonEnabled: true,
        isVisible: true,
      },
      select: {
        id: true,
        publicSource: true,
        dataSourceKey: true,
      },
    });

    const metricMap = new Map(
      metrics.map((metric) => [metric.id, metric]),
    );

    const dayStart = startOfUtcDay(dateText!);
    const dayEnd = nextUtcDay(dateText!);
    const recordedAt = new Date(`${dateText}T12:00:00.000Z`);

    await prisma.$transaction(async (tx) => {
      for (const item of submitted) {
        const metric = metricMap.get(item.metricId);

        if (!metric) {
          throw new Error(
            `Metric ${item.metricId} is not available for comparison entry.`,
          );
        }

        if (metric.dataSourceKey !== null) {
          throw new Error(
            "HIVE-derived metrics cannot be manually overwritten.",
          );
        }

        await tx.metricReading.deleteMany({
          where: {
            metricId: metric.id,
            source: metric.publicSource,
            recordedAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        });

        if (item.value !== null) {
          await tx.metricReading.create({
            data: {
              metricId: metric.id,
              source: metric.publicSource,
              value: item.value,
              recordedAt,
            },
          });
        }
      }
    });

    return NextResponse.json({
      ok: true,
      date: dateText,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save comparison metrics.",
      },
      { status: 400 },
    );
  }
}
