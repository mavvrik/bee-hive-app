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

function parseOptionalDate(
  value: FormDataEntryValue | null,
) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "Reporting period date is invalid.",
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
      "Reporting period date is invalid.",
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
      "EMF imports must stay inside one calendar month because Employee of the Month scoring is monthly.",
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

    if (
      !/\.(xlsx|xlsm|xls)$/i.test(
        file.name,
      )
    ) {
      throw new Error(
        "The EMF importer accepts Excel workbooks only.",
      );
    }

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

    /*
     * ==========================================
     * DATE RESOLUTION
     * ==========================================
     *
     * Priority:
     *
     * 1. Trust a reporting period detected from
     *    the workbook itself.
     *
     * 2. If the workbook does not provide one,
     *    accept manual dates from the UI.
     *
     * 3. If neither exists, return a successful
     *    preview but mark the dates as required.
     */

    let periodStartText:
      string | null =
      parsed.detectedPeriodStart;

    let periodEndText:
      string | null =
      parsed.detectedPeriodEnd;

    let dateSource:
      | "DETECTED"
      | "MANUAL"
      | "REQUIRED";

    if (
      periodStartText &&
      periodEndText
    ) {
      dateSource =
        "DETECTED";
    } else {
      const manualStart =
        parseOptionalDate(
          formData.get(
            "periodStart",
          ),
        );

      const manualEnd =
        parseOptionalDate(
          formData.get(
            "periodEnd",
          ),
        );

      if (
        manualStart &&
        manualEnd
      ) {
        periodStartText =
          manualStart.text;

        periodEndText =
          manualEnd.text;

        dateSource =
          "MANUAL";
      } else {
        dateSource =
          "REQUIRED";
      }
    }

    if (
      periodStartText &&
      periodEndText
    ) {
      const start =
        new Date(
          `${periodStartText}T00:00:00.000Z`,
        );

      const end =
        new Date(
          `${periodEndText}T00:00:00.000Z`,
        );

      ensureSameMonth(
        start,
        end,
      );
    }

    return NextResponse.json({
      ok: true,

      fileName:
        file.name,

      periodStart:
        periodStartText,

      periodEnd:
        periodEndText,

      dateSource,

      needsManualDate:
        dateSource ===
        "REQUIRED",

      ...parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        reason:
          error instanceof Error
            ? error.message
            : "Unable to verify the EMF workbook.",
      },
      {
        status: 400,
      },
    );
  }
}