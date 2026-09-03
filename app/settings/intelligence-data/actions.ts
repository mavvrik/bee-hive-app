"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  parseArrivalPatternsWorkbook,
  type ArrivalPatternWeekday,
} from "@/app/lib/intelligence-data/arrivalPatternsParser";

type ArrivalPatternsImportState = {
  status: "idle" | "success" | "error";
  message: string;
  importedRows?: number;
  populatedWeekdays?: string[];
  visitTotal?: number;
  unitTotal?: number;
  warningCount?: number;
};

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDateOnly(value: string, label: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} is required.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid date.`);
  }
  return date;
}

function daysInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function weekdayTotal(
  totals: Record<ArrivalPatternWeekday, number>,
  weekdays: ArrivalPatternWeekday[],
): number {
  return weekdays.reduce((sum, weekday) => sum + totals[weekday], 0);
}

export async function importArrivalPatternsAction(
  _previousState: ArrivalPatternsImportState,
  formData: FormData,
): Promise<ArrivalPatternsImportState> {
  await requireAdmin();

  try {
    const fileValue = formData.get("workbook");

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      throw new Error("Choose the CSL Arrival Patterns workbook first.");
    }

    if (fileValue.size > 10 * 1024 * 1024) {
      throw new Error("The workbook is larger than the 10 MB import limit.");
    }

    const lowerName = fileValue.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      throw new Error(
        "Arrival Patterns imports must be an Excel workbook (.xlsx or .xls).",
      );
    }

    const bytes = new Uint8Array(await fileValue.arrayBuffer());
    const parsed = parseArrivalPatternsWorkbook(bytes);

    if (parsed.populatedWeekdays.length === 0) {
      throw new Error(
        "The workbook contains no populated Visits or Units weekday data.",
      );
    }

    const submittedStart = readText(formData, "periodStart");
    const submittedEnd = readText(formData, "periodEnd");
    const submittedCenter = readText(formData, "centerNumber");

    const effectiveStart = parsed.metadata.periodStart || submittedStart;
    const effectiveEnd = parsed.metadata.periodEnd || submittedEnd;
    const effectiveCenter = parsed.metadata.centerNumber || submittedCenter;

    const periodStart = parseDateOnly(effectiveStart, "Period start");
    const periodEnd = parseDateOnly(effectiveEnd, "Period end");

    if (periodEnd < periodStart) {
      throw new Error("Period end cannot be earlier than period start.");
    }

    if (!effectiveCenter) {
      throw new Error("Center number is required.");
    }

    if (
      parsed.metadata.periodDetected &&
      (submittedStart !== parsed.metadata.periodStart ||
        submittedEnd !== parsed.metadata.periodEnd)
    ) {
      throw new Error(
        "The submitted coverage dates do not match the dates detected in the workbook. Re-preview the file before importing.",
      );
    }

    if (
      parsed.metadata.centerDetected &&
      submittedCenter !== parsed.metadata.centerNumber
    ) {
      throw new Error(
        "The submitted center does not match the center detected in the workbook. Re-preview the file before importing.",
      );
    }

    const activeRows = parsed.rows.filter((row) =>
      parsed.populatedWeekdays.includes(row.weekday),
    );

    const warnings = [...parsed.warnings];
    const coverageDays = daysInclusive(periodStart, periodEnd);

    if (coverageDays < 28) {
      warnings.push(
        `This import covers ${coverageDays} day${coverageDays === 1 ? "" : "s"}. Scheduling Intelligence prefers approximately four weeks of history for forecasting.`,
      );
    }

    const fileHash = createHash("sha256").update(bytes).digest("hex");

    const source = await prisma.intelligenceDataSource.upsert({
      where: { key: "ARRIVAL_PRODUCTION_PATTERNS" },
      create: {
        key: "ARRIVAL_PRODUCTION_PATTERNS",
        name: "Arrival & Production Patterns",
        description:
          "CSL Arrival Patterns for Scheduling report. Preserves Visits and Units separately by weekday and 30-minute interval.",
        category: "OPERATIONS",
        granularity: "30_MINUTE_TIME_PATTERN",
        fileFormat: "XLSX",
        intelligenceEligible: true,
        active: true,
        sourceDefinition: {
          parserVersion: 2,
          intervalMinutes: 30,
          measures: ["visits", "units"],
          metadataDetection: ["coverageDates", "centerNumber"],
          weekdayOrder: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
        },
      },
      update: {
        active: true,
        intelligenceEligible: true,
        granularity: "30_MINUTE_TIME_PATTERN",
        fileFormat: "XLSX",
        sourceDefinition: {
          parserVersion: 2,
          intervalMinutes: 30,
          measures: ["visits", "units"],
          metadataDetection: ["coverageDates", "centerNumber"],
          weekdayOrder: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
        },
      },
    });

    const duplicate = await prisma.intelligenceDataImport.findFirst({
      where: {
        dataSourceId: source.id,
        fileHash,
        centerNumber: effectiveCenter,
        periodStart,
        periodEnd,
        status: { in: ["SUCCESS", "PARTIAL"] },
      },
      select: { id: true, fileName: true },
    });

    if (duplicate) {
      throw new Error(
        `This workbook has already been imported for Center ${effectiveCenter} and the same coverage period (Import #${duplicate.id}: ${duplicate.fileName}).`,
      );
    }

    const overlapping = await prisma.intelligenceDataCoverage.findFirst({
      where: {
        centerNumber: effectiveCenter,
        dataImport: {
          dataSourceId: source.id,
          status: { in: ["SUCCESS", "PARTIAL"] },
        },
        coverageStart: { lte: periodEnd },
        coverageEnd: { gte: periodStart },
      },
      include: {
        dataImport: { select: { id: true, fileName: true } },
      },
    });

    if (overlapping) {
      warnings.push(
        `Coverage overlaps Import #${overlapping.dataImport.id} (${overlapping.dataImport.fileName}). The new import is preserved as a separate evidence set; Scheduling Intelligence should use the most appropriate approved coverage when forecasting.`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const dataImport = await tx.intelligenceDataImport.create({
        data: {
          dataSourceId: source.id,
          fileName: fileValue.name,
          fileHash,
          periodStart,
          periodEnd,
          centerNumber: effectiveCenter,
          status: "PROCESSING",
          sourceRowCount: activeRows.length,
          importedRowCount: 0,
          rejectedRowCount: 0,
          warningCount: warnings.length,
          warnings,
        },
      });

      await tx.operationalPatternEntry.createMany({
        data: activeRows.map((row) => ({
          dataImportId: dataImport.id,
          centerNumber: effectiveCenter,
          dayOfWeek: row.dayOfWeek,
          time: row.time,
          minuteOfDay: row.minuteOfDay,
          intervalMinutes: row.intervalMinutes,
          visits: row.visits,
          units: row.units,
        })),
      });

      await tx.intelligenceDataCoverage.create({
        data: {
          dataImportId: dataImport.id,
          coverageStart: periodStart,
          coverageEnd: periodEnd,
          centerNumber: effectiveCenter,
          granularity: "30_MINUTE_TIME_PATTERN",
        },
      });

      return tx.intelligenceDataImport.update({
        where: { id: dataImport.id },
        data: {
          status: "SUCCESS",
          importedRowCount: activeRows.length,
          importedAt: new Date(),
        },
      });
    });

    revalidatePath("/settings/intelligence-data");

    return {
      status: "success",
      message: `Imported ${result.importedRowCount} half-hour observations from ${fileValue.name}.`,
      importedRows: result.importedRowCount,
      populatedWeekdays: parsed.populatedWeekdays,
      visitTotal: weekdayTotal(parsed.visitTotals, parsed.populatedWeekdays),
      unitTotal: weekdayTotal(parsed.unitTotals, parsed.populatedWeekdays),
      warningCount: warnings.length,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The Arrival Patterns workbook could not be imported.",
    };
  }
}
