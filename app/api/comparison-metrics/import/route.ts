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

    const fileName =
      file.name.toLowerCase();

    if (
      !fileName.endsWith(
        ".xlsx",
      ) &&
      !fileName.endsWith(
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

    /*
     * ==========================================
     * CENTER VALIDATION
     * ==========================================
     */

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

    /*
     * ==========================================
     * DATE VALIDATION
     * ==========================================
     */

    if (
      !parsed.operationalDate
    ) {
      throw new Error(
        "Could not determine the operational date from this export.",
      );
    }

    const operationalDate =
      parsed.operationalDate;

    const dayStart =
      startOfDay(
        operationalDate,
      );

    const dayEnd =
      nextDay(
        operationalDate,
      );

    const recordedAt =
      new Date(
        `${operationalDate}T12:00:00.000Z`,
      );

    /*
     * ==========================================
     * LOAD DASHBOARD METRIC DEFINITIONS
     * ==========================================
     */

    const activeMetrics =
      await prisma.dashboardMetric.findMany({
        where: {
          key: {
            in: parsed.metrics.map(
              (
                metric,
              ) =>
                metric.metricKey,
            ),
          },

          isVisible:
            true,
        },

        select: {
          id: true,
          key: true,
          publicSource:
            true,
          dataSourceKey:
            true,
        },
      });

    const metricByKey =
      new Map(
        activeMetrics.map(
          (
            metric,
          ) => [
            metric.key,
            metric,
          ],
        ),
      );

    /*
     * ==========================================
     * LOCATE PRODUCTION VALUES
     * ==========================================
     *
     * Gross Procedures and Gross Liters are
     * special.
     *
     * They do NOT get stored as ordinary
     * MetricReading records.
     *
     * They reconcile the authoritative
     * DailyCenterProduction record:
     *
     * Gross Procedures
     *   -> donors
     *
     * Gross Liters
     *   -> liters
     */

    const grossProceduresItem =
      parsed.metrics.find(
        (
          item,
        ) =>
          item.metricKey ===
          "gross_procedures",
      );

    const grossLitersItem =
      parsed.metrics.find(
        (
          item,
        ) =>
          item.metricKey ===
          "gross_liters",
      );

    const imported:
      string[] = [];

    const needsMapping:
      string[] = [];

    const skipped:
      string[] = [];

    const reconciledProduction:
      string[] = [];

    await prisma.$transaction(
      async (
        tx,
      ) => {
        /*
         * ======================================
         * RECONCILE DAILY CENTER PRODUCTION
         * ======================================
         *
         * Only perform a production reconciliation
         * when at least one production metric has
         * a nonblank value.
         *
         * IMPORTANT:
         *
         * If only one of the two fields were ever
         * supplied, preserve the existing value of
         * the other field rather than resetting it.
         */

        const hasGrossProcedures =
          grossProceduresItem
            ?.value !==
            null &&
          grossProceduresItem
            ?.value !==
            undefined;

        const hasGrossLiters =
          grossLitersItem
            ?.value !==
            null &&
          grossLitersItem
            ?.value !==
            undefined;

        if (
          hasGrossProcedures ||
          hasGrossLiters
        ) {
          const existingProduction =
            await tx.dailyCenterProduction.findUnique({
              where: {
                entryDate:
                  dayStart,
              },

              select: {
                donors:
                  true,
                liters:
                  true,
              },
            });

          /*
           * Gross Procedures are whole
           * procedures/donors.
           */
          const finalDonors =
            hasGrossProcedures
              ? Math.max(
                  0,
                  Math.round(
                    grossProceduresItem!
                      .value!,
                  ),
                )
              : existingProduction
                  ?.donors ??
                0;

          const finalLiters =
            hasGrossLiters
              ? Math.max(
                  0,
                  grossLitersItem!
                    .value!,
                )
              : existingProduction
                  ?.liters ??
                0;

          await tx.dailyCenterProduction.upsert({
            where: {
              entryDate:
                dayStart,
            },

            update: {
              donors:
                finalDonors,

              liters:
                finalLiters,
            },

            create: {
              entryDate:
                dayStart,

              donors:
                finalDonors,

              liters:
                finalLiters,
            },
          });

          if (
            hasGrossProcedures
          ) {
            imported.push(
              grossProceduresItem!
                .sourceHeader,
            );

            reconciledProduction.push(
              grossProceduresItem!
                .sourceHeader,
            );
          }

          if (
            hasGrossLiters
          ) {
            imported.push(
              grossLitersItem!
                .sourceHeader,
            );

            reconciledProduction.push(
              grossLitersItem!
                .sourceHeader,
            );
          }
        }

        /*
         * ======================================
         * IMPORT OTHER COMPARISON METRICS
         * ======================================
         */

        for (
          const item of
          parsed.metrics
        ) {
          /*
           * Gross Procedures and Gross Liters
           * were already handled above.
           */
          if (
            item.metricKey ===
              "gross_procedures" ||
            item.metricKey ===
              "gross_liters"
          ) {
            continue;
          }

          const metric =
            metricByKey.get(
              item.metricKey,
            );

          /*
           * A parser mapping exists but HIVE
           * does not have a matching active
           * DashboardMetric definition.
           */
          if (
            !metric
          ) {
            needsMapping.push(
              item.sourceHeader,
            );

            continue;
          }

          /*
           * Blank spreadsheet values never
           * delete existing HIVE history.
           */
          if (
            item.value ===
            null
          ) {
            skipped.push(
              item.sourceHeader,
            );

            continue;
          }

          /*
           * ====================================
           * ONE METRIC + ONE DATE =
           * ONE IMPORTED VALUE
           * ====================================
           *
           * Remove the existing reading for
           * this metric/source/date, then create
           * the finalized imported reading.
           */

          await tx.metricReading.deleteMany({
            where: {
              metricId:
                metric.id,

              source:
                metric.publicSource,

              recordedAt: {
                gte:
                  dayStart,

                lt:
                  dayEnd,
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

    /*
     * ==========================================
     * SUCCESS RESPONSE
     * ==========================================
     */

    return NextResponse.json({
      ok: true,

      fileName:
        file.name,

      centerName:
        parsed.centerName ??
        "Riviera Beach 115",

      operationalDate,

      imported,

      reconciledProduction,

      ignored:
        parsed.ignoredHeaders,

      skipped,

      needsMapping,
    });
  } catch (
    error
  ) {
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