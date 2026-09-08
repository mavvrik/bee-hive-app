import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin-auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  parseComparisonMetricWorkbook,
} from "@/app/lib/comparison-metrics/parseComparisonMetricWorkbook";

export const dynamic =
  "force-dynamic";

function startOfDay(
  dateText: string,
) {
  return new Date(
    `${dateText}T00:00:00.000Z`,
  );
}

function nextDay(
  dateText: string,
) {
  const date =
    startOfDay(
      dateText,
    );

  date.setUTCDate(
    date.getUTCDate() + 1,
  );

  return date;
}

function displayValue(
  value: number | null,
  unit: string | null,
  decimals: number,
) {
  if (
    value === null
  ) {
    return "—";
  }

  const safeDecimals =
    Math.max(
      0,
      Math.min(
        20,
        Number.isFinite(
          decimals,
        )
          ? Math.trunc(
              decimals,
            )
          : 1,
      ),
    );

  const formatted =
    value.toLocaleString(
      "en-US",
      {
        minimumFractionDigits:
          safeDecimals,

        maximumFractionDigits:
          safeDecimals,
      },
    );

  if (
    unit === "%"
  ) {
    return `${formatted}%`;
  }

  if (
    unit === "L"
  ) {
    return `${formatted} L`;
  }

  if (
    unit === "min"
  ) {
    return `${formatted}m`;
  }

  return formatted;
}

function valuesMatch(
  left: number,
  right: number,
) {
  return (
    Math.abs(
      left - right,
    ) < 0.0000001
  );
}

export async function POST(
  request: NextRequest,
) {
  await requireAdmin();

  try {
    const formData =
      await request.formData();

    const file =
      formData.get(
        "file",
      );

    if (
      !(file instanceof File)
    ) {
      throw new Error(
        "An Excel file is required.",
      );
    }

    const lowerName =
      file.name.toLowerCase();

    if (
      !lowerName.endsWith(
        ".xlsx",
      ) &&
      !lowerName.endsWith(
        ".xls",
      )
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
      !parsed.operationalDate
    ) {
      throw new Error(
        "Could not determine the operational date from this export.",
      );
    }

    const centerName =
      parsed.centerName ??
      "Riviera Beach 115";

    if (
      !/Riviera Beach\s*115/i.test(
        centerName,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,

          reason:
            `Wrong center detected: ${centerName}`,
        },

        {
          status: 400,
        },
      );
    }

    const metricKeys =
      parsed.metrics.map(
        (
          metric,
        ) =>
          metric.metricKey,
      );

    const metricDefinitions =
      await prisma.dashboardMetric.findMany({
        where: {
          key: {
            in: metricKeys,
          },

          isVisible:
            true,
        },

        select: {
          id: true,
          key: true,
          displayName:
            true,
          unit: true,
          decimalPlaces:
            true,
          publicSource:
            true,
          dataSourceKey:
            true,
        },
      });

    const metricByKey =
      new Map(
        metricDefinitions.map(
          (
            metric,
          ) => [
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

    /*
     * ==========================================
     * DAILY CENTER PRODUCTION
     * ==========================================
     *
     * Gross Procedures and Gross Liters are
     * HIVE-derived metrics.
     *
     * Their authoritative historical values
     * live in DailyCenterProduction:
     *
     * Gross Procedures
     *   -> DailyCenterProduction.donors
     *
     * Gross Liters
     *   -> DailyCenterProduction.liters
     */

    const dailyProduction =
      await prisma.dailyCenterProduction.findUnique({
        where: {
          entryDate:
            dayStart,
        },

        select: {
          donors: true,
          liters: true,
          updatedAt:
            true,
        },
      });

    /*
     * ==========================================
     * MANUAL / IMPORTED COMPARISON READINGS
     * ==========================================
     */

    const nonProductionMetrics =
      metricDefinitions.filter(
        (
          metric,
        ) =>
          metric.key !==
            "gross_procedures" &&
          metric.key !==
            "gross_liters",
      );

    const metricIds =
      nonProductionMetrics.map(
        (
          metric,
        ) =>
          metric.id,
      );

    const existingReadings =
      metricIds.length > 0
        ? await prisma.metricReading.findMany({
            where: {
              metricId: {
                in: metricIds,
              },

              recordedAt: {
                gte:
                  dayStart,

                lt:
                  dayEnd,
              },
            },

            orderBy: {
              recordedAt:
                "desc",
            },

            select: {
              metricId: true,
              source: true,
              value: true,
              recordedAt:
                true,
            },
          })
        : [];

    const latestByMetric =
      new Map<
        number,
        {
          value: number;
          source: string;
          recordedAt: Date;
        }
      >();

    for (
      const reading of
      existingReadings
    ) {
      if (
        !latestByMetric.has(
          reading.metricId,
        )
      ) {
        latestByMetric.set(
          reading.metricId,
          {
            value:
              reading.value,

            source:
              reading.source,

            recordedAt:
              reading.recordedAt,
          },
        );
      }
    }

    const rows =
      parsed.metrics.map(
        (
          item,
        ) => {
          const definition =
            metricByKey.get(
              item.metricKey,
            );

          if (
            !definition
          ) {
            return {
              sourceHeader:
                item.sourceHeader,

              metricKey:
                item.metricKey,

              displayName:
                item.sourceHeader,

              existingValue:
                null,

              existingDisplay:
                "—",

              existingSource:
                null,

              existingRecordedAt:
                null,

              fileValue:
                item.value,

              fileDisplay:
                item.value ===
                null
                  ? "—"
                  : String(
                      item.value,
                    ),

              action: "NEEDS_MAPPING" as const,

canImport: false,
            };
          }

          /*
           * ======================================
           * GROSS PROCEDURES
           * ======================================
           */

          if (
            definition.key ===
            "gross_procedures"
          ) {
            const existingValue =
              dailyProduction
                ?.donors ??
              null;

            let action:
              | "ADD"
              | "UPDATE"
              | "NO_CHANGE"
              | "SKIP_BLANK" =
              "ADD";

            if (
              item.value ===
              null
            ) {
              action =
                "SKIP_BLANK";
            } else if (
              existingValue !==
              null
            ) {
              action =
                valuesMatch(
                  existingValue,
                  item.value,
                )
                  ? "NO_CHANGE"
                  : "UPDATE";
            }

            return {
              sourceHeader:
                item.sourceHeader,

              metricKey:
                item.metricKey,

              displayName:
                definition.displayName,

              existingValue,

              existingDisplay:
                displayValue(
                  existingValue,
                  definition.unit,
                  definition.decimalPlaces,
                ),

              existingSource:
                "HIVE",

              existingRecordedAt:
                dailyProduction
                  ?.updatedAt
                  .toISOString() ??
                null,

              fileValue:
                item.value,

              fileDisplay:
                displayValue(
                  item.value,
                  definition.unit,
                  definition.decimalPlaces,
                ),

              action,

              canImport:
                action ===
                  "ADD" ||
                action ===
                  "UPDATE",
            };
          }

          /*
           * ======================================
           * GROSS LITERS
           * ======================================
           */

          if (
            definition.key ===
            "gross_liters"
          ) {
            const existingValue =
              dailyProduction
                ?.liters ??
              null;

            let action:
              | "ADD"
              | "UPDATE"
              | "NO_CHANGE"
              | "SKIP_BLANK" =
              "ADD";

            if (
              item.value ===
              null
            ) {
              action =
                "SKIP_BLANK";
            } else if (
              existingValue !==
              null
            ) {
              action =
                valuesMatch(
                  existingValue,
                  item.value,
                )
                  ? "NO_CHANGE"
                  : "UPDATE";
            }

            return {
              sourceHeader:
                item.sourceHeader,

              metricKey:
                item.metricKey,

              displayName:
                definition.displayName,

              existingValue,

              existingDisplay:
                displayValue(
                  existingValue,
                  definition.unit,
                  definition.decimalPlaces,
                ),

              existingSource:
                "HIVE",

              existingRecordedAt:
                dailyProduction
                  ?.updatedAt
                  .toISOString() ??
                null,

              fileValue:
                item.value,

              fileDisplay:
                displayValue(
                  item.value,
                  definition.unit,
                  definition.decimalPlaces,
                ),

              action,

              canImport:
                action ===
                  "ADD" ||
                action ===
                  "UPDATE",
            };
          }

          /*
           * ======================================
           * NORMAL COMPARISON METRIC
           * ======================================
           */

          const existing =
            latestByMetric.get(
              definition.id,
            ) ??
            null;

          let action:
            | "ADD"
            | "UPDATE"
            | "NO_CHANGE"
            | "SKIP_BLANK" =
            "ADD";

          if (
            item.value ===
            null
          ) {
            action =
              "SKIP_BLANK";
          } else if (
            existing
          ) {
            action =
              valuesMatch(
                existing.value,
                item.value,
              )
                ? "NO_CHANGE"
                : "UPDATE";
          }

          return {
            sourceHeader:
              item.sourceHeader,

            metricKey:
              item.metricKey,

            displayName:
              definition.displayName,

            existingValue:
              existing?.value ??
              null,

            existingDisplay:
              displayValue(
                existing?.value ??
                  null,

                definition.unit,

                definition.decimalPlaces,
              ),

            existingSource:
              existing?.source ??
              null,

            existingRecordedAt:
              existing?.recordedAt
                .toISOString() ??
              null,

            fileValue:
              item.value,

            fileDisplay:
              displayValue(
                item.value,

                definition.unit,

                definition.decimalPlaces,
              ),

            action,

            canImport:
              action ===
                "ADD" ||
              action ===
                "UPDATE",
          };
        },
      );

    const summary = {
      add:
        rows.filter(
          (
            row,
          ) =>
            row.action ===
            "ADD",
        ).length,

      update:
        rows.filter(
          (
            row,
          ) =>
            row.action ===
            "UPDATE",
        ).length,

      noChange:
        rows.filter(
          (
            row,
          ) =>
            row.action ===
            "NO_CHANGE",
        ).length,

      skippedBlank:
        rows.filter(
          (
            row,
          ) =>
            row.action ===
            "SKIP_BLANK",
        ).length,

      needsMapping:
        rows.filter(
          (
            row,
          ) =>
            row.action ===
            "NEEDS_MAPPING",
        ).length,

      ignored:
        parsed
          .ignoredHeaders
          .length,
    };

    return NextResponse.json({
      ok: true,
      blocked: false,

      fileName:
        file.name,

      centerName,

      operationalDate:
        parsed.operationalDate,

      rows,

      summary,

      ignoredHeaders:
        parsed.ignoredHeaders,
    });
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        ok: false,
        blocked: true,

        reason:
          error instanceof Error
            ? error.message
            : "Unable to verify comparison metric file.",
      },

      {
        status: 400,
      },
    );
  }
}