"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function readInteger(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return 0;
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    );

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
}

function readOptionalText(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed === ""
    ? null
    : trimmed;
}

function readDate(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new Error(
      "EMF date is required.",
    );
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      "EMF date is invalid.",
    );
  }

  return new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0,
  );
}

function formatDateInput(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function saveEmfEntries(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const entryDate =
    readDate(
      formData,
      "entryDate",
    );

  const collectorIds =
    formData
      .getAll("collectorId")
      .map((value) =>
        Number(value),
      )
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value > 0,
      );

  /*
   * One worker receives one consolidated
   * EMF record for the selected date.
   *
   * Existing records for that worker/date
   * are replaced so managers can safely
   * correct prior entries.
   */
  await prisma.$transaction(
    async (transaction) => {
      for (
        const collectorId
        of collectorIds
      ) {
        const emfCount =
          readInteger(
            formData,
            `emfCount-${collectorId}`,
          );

        const note =
          readOptionalText(
            formData,
            `note-${collectorId}`,
          );

        await transaction
          .qualityEmfEntry
          .deleteMany({
            where: {
              collectorId,
              entryDate,
            },
          });

        /*
         * Zero EMFs with no note means there
         * is nothing to store.
         *
         * This also provides a clean way to
         * remove an incorrectly entered EMF.
         */
        if (
          emfCount === 0 &&
          !note
        ) {
          continue;
        }

        await transaction
          .qualityEmfEntry
          .create({
            data: {
              collectorId,
              entryDate,
              emfCount,
              note,
            },
          });
      }
    },
  );

  revalidatePath(
    "/settings/workers/emf",
  );

  revalidatePath(
    "/settings/workers",
  );

  revalidatePath("/");

  redirect(
    `/settings/workers/emf?date=${formatDateInput(
      entryDate,
    )}&saved=1`,
  );
}