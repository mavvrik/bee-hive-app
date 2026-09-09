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
  parseEmfWorkbook,
} from "@/app/lib/emf/parseEmfWorkbook";

export const dynamic =
  "force-dynamic";

function validateDate(
  value: FormDataEntryValue | null,
  label: string,
) {
  if (
    typeof value !==
      "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${label} is invalid.`,
    );
  }

  return {
    text: value,
    date,
  };
}

function ensureSameMonth(
  start: Date,
  end: Date,
) {
  if (
    start.getTime() >
    end.getTime()
  ) {
    throw new Error(
      "The reporting period start date cannot be after the end date.",
    );
  }

  if (
    start.getUTCFullYear() !==
      end.getUTCFullYear() ||
    start.getUTCMonth() !==
      end.getUTCMonth()
  ) {
    throw new Error(
      "EMF imports must stay inside one calendar month.",
    );
  }
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

    if (
      !(file instanceof File)
    ) {
      throw new Error(
        "Choose an Excel EMF report.",
      );
    }

    const periodStart =
      validateDate(
        formData.get(
          "periodStart",
        ),
        "Reporting period start",
      );

    const periodEnd =
      validateDate(
        formData.get(
          "periodEnd",
        ),
        "Reporting period end",
      );

    ensureSameMonth(
      periodStart.date,
      periodEnd.date,
    );

    const workers =
      await prisma.collector.findMany({
        select: {
          id: true,
          name: true,
          preferredName:
            true,
          active: true,
        },
      });

    const buffer =
      Buffer.from(
        await file.arrayBuffer(),
      );

    const parsed =
      await parseEmfWorkbook(
        buffer,
        workers,
      );

    if (
      parsed.workerTotals.length ===
      0
    ) {
      throw new Error(
        "No matched Worker Bee EMF totals are available to import.",
      );
    }

    /*
     * Imported EMFs are consolidated on the
     * report END date.
     *
     * EOM scoring is monthly, so the exact
     * daily placement inside the month does
     * not affect monthly totals.
     *
     * Manual EMF entries remain separate.
     */

    const entryDate =
      new Date(
        `${periodEnd.text}T00:00:00.000Z`,
      );

    const importPrefix =
      `EMF_IMPORT|${periodStart.text}|${periodEnd.text}|`;

    await prisma.$transaction(
      async (tx) => {
        /*
         * Re-importing the same reporting
         * period replaces ONLY the earlier
         * importer-generated records.
         *
         * Manual EMF records are preserved.
         */

        await tx.qualityEmfEntry.deleteMany({
          where: {
            note: {
              startsWith:
                importPrefix,
            },
          },
        });

        await tx.qualityEmfEntry.createMany({
          data:
            parsed.workerTotals.map(
              (worker) => ({
                collectorId:
                  worker.collectorId,

                entryDate,

                emfCount:
                  worker.emfCount,

                note:
                  `${importPrefix}${file.name}`,
              }),
            ),
        });
      },
    );

    return NextResponse.json({
      ok: true,

      importedWorkers:
        parsed.workerTotals.length,

      importedAttributedEmfs:
        parsed.attributedEmfTotal,

      needsMatchingCount:
        parsed.needsMatchingCount,

      ignoredCount:
        parsed.ignoredCount,

      periodStart:
        periodStart.text,

      periodEnd:
        periodEnd.text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        reason:
          error instanceof Error
            ? error.message
            : "Unable to import the EMF workbook.",
      },
      {
        status: 400,
      },
    );
  }
}