import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  parseComparisonMetricWorkbook,
} from "@/app/lib/comparison-metrics/parseComparisonMetricWorkbook";

export const dynamic = "force-dynamic";

function startOfDay(dateText: string) {
  return new Date(
    `${dateText}T00:00:00.000Z`,
  );
}

function nextDay(dateText: string) {
  const date = startOfDay(dateText);

  date.setUTCDate(
    date.getUTCDate() + 1,
  );

  return date;
}

export async function POST(
  request: NextRequest,
) {
  await requireAdmin();

  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      throw new Error(
        "An Excel file is required.",
      );
    }

    const fileName =
      file.name.toLowerCase();

    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls")
    ) {
      throw new Error(
        "Comparison Metric Importer currently accepts Excel files only.",
      );
    }

    const buffer =
      Buffer.from(
        await file.arrayBuffer(),
      );

    const parsed =
      parseComparisonMetricWorkbook(
        buffer,
      );

    if (
      parsed.centerName &&
      !/Riviera Beach\s*115/i.test(
        parsed.centerName,
      )
    ) {
      throw new Error(
        `This file appears to belong to ${parsed.centerName}, not Riviera Beach 115.`,
      );
    }

    if (!parsed.operationalDate) {
      throw new Error(
        "Could not determine the operational date from this export.",
      );
    }

    const activeMetrics =
      await prisma.dashboardMetric.findMany({
        where: {
          key: {
            in: parsed.metrics.map(
              (metric) =>
                metric.metricKey,
            ),
          },
          isVisible: true,
        },
        select: {
          id: true,
          key: true,
          publicSource: true,
        },
      });

    const metricByKey =
      new Map(
        activeMetrics.map(
          (metric) => [
            metric.key,
            metric,
          ],
        ),
      );

    const dayStart =
      startOfDay(
        parsed.operationalDate,
      );

    const dayEnd =
      nextDay(
        parsed.operationalDate,
      );

    const recordedAt =
      new Date(
        `${parsed.operationalDate}T12:00:00.000Z`,
      );

    const imported: string[] = [];
    const needsMapping: string[] = [];

    await prisma.$transaction(
      async (tx) => {
        for (
          const item of
          parsed.metrics
        ) {
          const metric =
            metricByKey.get(
              item.metricKey,
            );

          if (!metric) {
            needsMapping.push(
              item.sourceHeader,
            );

            continue;
          }

          if (
            item.value ===
            null
          ) {
            continue;
          }

          await tx.metricReading.deleteMany({
            where: {
              metricId:
                metric.id,
              source:
                metric.publicSource,
              recordedAt: {
                gte: dayStart,
                lt: dayEnd,
              },
            },
          });

          await tx.metricReading.create({
            data: {
              metricId:
                metric.id,
              source:
                metric.publicSource,
              value:
                item.value,
              recordedAt,
            },
          });

          imported.push(
            item.sourceHeader,
          );
        }
      },
    );

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      centerName:
        parsed.centerName ??
        "Riviera Beach 115",
      operationalDate:
        parsed.operationalDate,
      imported,
      ignored:
        parsed.ignoredHeaders,
      needsMapping,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to import comparison metrics.",
      },
      {
        status: 400,
      },
    );
  }
}
