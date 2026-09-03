"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseTimeOffWorkbook } from "@/app/lib/scheduling/timeOffParser";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function normalizeHiveName(value: string) {
  return value
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sourceNameToFirstLast(value: string) {
  const compact = value
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact.includes(",")) {
    return compact.toLowerCase();
  }

  const [last, firstPart] = compact.split(",", 2);
  const first = firstPart.trim().split(" ")[0] ?? "";

  return `${first} ${last.trim()}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function buildMatches(
  requests: Awaited<ReturnType<typeof parseTimeOffWorkbook>>["requests"],
) {
  const workers = await prisma.collector.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
    },
  });

  return requests.map((request) => {
    const target = sourceNameToFirstLast(
      request.sourceEmployeeName,
    );

    const exact = workers.filter(
      (worker) => normalizeHiveName(worker.name) === target,
    );

    if (exact.length === 1) {
      return {
        ...request,
        matchStatus: "MATCHED" as const,
        collectorId: exact[0].id,
        collectorName: exact[0].name,
        matchMethod: "Normalized full name",
      };
    }

    const sourceFirst = target.split(" ")[0];

    const firstNameMatches = workers.filter(
      (worker) =>
        normalizeHiveName(worker.name).split(" ")[0] === sourceFirst,
    );

    if (firstNameMatches.length === 1) {
      return {
        ...request,
        matchStatus: "MATCHED" as const,
        collectorId: firstNameMatches[0].id,
        collectorName: firstNameMatches[0].name,
        matchMethod: "Unique first name",
      };
    }

    return {
      ...request,
      matchStatus:
        firstNameMatches.length > 1
          ? ("AMBIGUOUS" as const)
          : ("UNMATCHED" as const),
      collectorId: null,
      collectorName: null,
      matchMethod:
        firstNameMatches.length > 1
          ? "Multiple HIVE workers share this first name"
          : "No safe HIVE roster match",
    };
  });
}

export async function previewTimeOffImport(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Choose a Time Off Requests workbook.");
  }

  if (file.size <= 0) {
    throw new Error("The selected workbook is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("The workbook is larger than HIVE's 10 MB import limit.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const preview = await parseTimeOffWorkbook(bytes);
  const matches = await buildMatches(preview.requests);

  return {
    ...preview,
    fileName: file.name,
    fileHash: crypto
      .createHash("sha256")
      .update(bytes)
      .digest("hex"),
    matches,
    matchedCount: matches.filter(
      (item) => item.matchStatus === "MATCHED",
    ).length,
    reviewCount: matches.filter(
      (item) => item.matchStatus !== "MATCHED",
    ).length,
  };
}

export async function confirmTimeOffImport(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("The Time Off workbook is missing.");
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("The workbook is empty or exceeds 10 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileHash = crypto
    .createHash("sha256")
    .update(bytes)
    .digest("hex");

  const parsed = await parseTimeOffWorkbook(bytes);
  const matches = await buildMatches(parsed.requests);

  const unresolved = matches.filter(
    (item) => item.matchStatus !== "MATCHED",
  );

  if (unresolved.length > 0) {
    throw new Error(
      `${unresolved.length} request(s) still need a safe HIVE worker match. Import was not written.`,
    );
  }

  const duplicate = await prisma.timeOffImport.findFirst({
    where: {
      fileHash,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error(
      "This exact Time Off workbook has already been imported into HIVE.",
    );
  }

  const actualStarts = matches.map((item) => item.startDate).sort();
  const actualEnds = matches.map((item) => item.endDate).sort();

  const actualCoverageStart = actualStarts[0] ?? null;
  const actualCoverageEnd = actualEnds.at(-1) ?? null;

  await prisma.$transaction(async (tx) => {
    const dataImport = await tx.timeOffImport.create({
      data: {
        fileName: file.name,
        fileHash,
        reportPeriodStart: parsed.reportPeriodStart
          ? new Date(`${parsed.reportPeriodStart}T00:00:00.000Z`)
          : null,
        reportPeriodEnd: parsed.reportPeriodEnd
          ? new Date(`${parsed.reportPeriodEnd}T00:00:00.000Z`)
          : null,
        actualCoverageStart: actualCoverageStart
          ? new Date(`${actualCoverageStart}T00:00:00.000Z`)
          : null,
        actualCoverageEnd: actualCoverageEnd
          ? new Date(`${actualCoverageEnd}T00:00:00.000Z`)
          : null,
        sourceRowCount: parsed.requests.length,
        importedRowCount: matches.length,
        warningCount: parsed.warnings.length,
        warnings: parsed.warnings,
        executedAtText: parsed.executedAt,
        printedFor: parsed.printedFor,
        status: "SUCCESS",
        importedAt: new Date(),
      },
    });

    await tx.timeOffRequest.createMany({
      data: matches.map((item) => ({
        timeOffImportId: dataImport.id,
        collectorId: item.collectorId!,
        employeeExternalId: item.employeeId || null,
        sourceEmployeeName: item.sourceEmployeeName,
        collectorNameSnapshot: item.collectorName!,
        matchMethod: item.matchMethod,
        subtype: item.subtype,
        duration: item.duration,
        startDate: new Date(`${item.startDate}T00:00:00.000Z`),
        endDate: new Date(`${item.endDate}T00:00:00.000Z`),
        comments: item.comments,
      })),
    });
  });

  revalidatePath("/settings/scheduling");
  revalidatePath("/settings/scheduling/data-inputs");
  revalidatePath("/settings/scheduling/time-off");

  return {
    ok: true,
    importedCount: matches.length,
    warningCount: parsed.warnings.length,
    actualCoverageStart,
    actualCoverageEnd,
  };
}
