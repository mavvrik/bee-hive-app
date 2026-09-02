"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  OperationalDisruptionType,
  OperationalImpactLevel,
} from "@/app/generated/prisma/client";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readOptionalText(
  formData: FormData,
  key: string,
) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      "A valid disruption date is required.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function parseRequiredFloat(
  value: string,
  label: string,
) {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `${label} must be a valid number.`,
    );
  }

  return parsed;
}

function parseOptionalFloat(
  value: string,
) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

function parseOptionalInt(
  value: string,
) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(
    value,
    10,
  );

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

function parseType(value: string) {
  if (
    !Object.values(
      OperationalDisruptionType,
    ).includes(
      value as OperationalDisruptionType,
    )
  ) {
    throw new Error(
      "Invalid disruption type.",
    );
  }

  return value as OperationalDisruptionType;
}

function parseImpactLevel(
  value: string,
) {
  if (
    !Object.values(
      OperationalImpactLevel,
    ).includes(
      value as OperationalImpactLevel,
    )
  ) {
    throw new Error(
      "Invalid impact level.",
    );
  }

  return value as OperationalImpactLevel;
}

function parseRecordId(
  formData: FormData,
) {
  const id = Number(
    readText(
      formData,
      "disruptionId",
    ),
  );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid disruption record.",
    );
  }

  return id;
}

export async function createOperationalDisruption(
  formData: FormData,
) {
  await requireAdmin();

  const disruptionDate =
    parseDateOnly(
      readText(
        formData,
        "disruptionDate",
      ),
    );

  const type = parseType(
    readText(formData, "type"),
  );

  const impactLevel =
    parseImpactLevel(
      readText(
        formData,
        "impactLevel",
      ),
    );

  const affectedArea =
    readText(
      formData,
      "affectedArea",
    ) || "Entire Center";

  const title = readText(
    formData,
    "title",
  );

  if (!title) {
    throw new Error(
      "A disruption title is required.",
    );
  }

  const description =
    readOptionalText(
      formData,
      "description",
    );

  const startTime =
    readOptionalText(
      formData,
      "startTime",
    );

  const endTime =
    readOptionalText(
      formData,
      "endTime",
    );

  const hoursLost =
    parseRequiredFloat(
      readText(
        formData,
        "hoursLost",
      ),
      "Hours lost",
    );

  const estimatedProceduresLost =
    parseOptionalInt(
      readText(
        formData,
        "estimatedProceduresLost",
      ),
    );

  const estimatedLitersLost =
    parseOptionalFloat(
      readText(
        formData,
        "estimatedLitersLost",
      ),
    );

  const resolved =
    formData.get("resolved") ===
    "on";

  await prisma.operationalDisruption.create(
    {
      data: {
        disruptionDate,
        startTime,
        endTime,
        hoursLost,
        type,
        impactLevel,
        affectedArea,
        title,
        description,
        estimatedProceduresLost,
        estimatedLitersLost,
        resolved,
        resolvedAt: resolved
          ? new Date()
          : null,
      },
    },
  );

  revalidatePath(
    "/settings/operational-impact",
  );

  redirect(
    "/settings/operational-impact",
  );
}

export async function updateOperationalDisruption(
  formData: FormData,
) {
  await requireAdmin();

  const id =
    parseRecordId(formData);

  const disruptionDate =
    parseDateOnly(
      readText(
        formData,
        "disruptionDate",
      ),
    );

  const type = parseType(
    readText(formData, "type"),
  );

  const impactLevel =
    parseImpactLevel(
      readText(
        formData,
        "impactLevel",
      ),
    );

  const title = readText(
    formData,
    "title",
  );

  if (!title) {
    throw new Error(
      "A disruption title is required.",
    );
  }

  const affectedArea =
    readText(
      formData,
      "affectedArea",
    ) || "Entire Center";

  const resolved =
    formData.get("resolved") ===
    "on";

  const existing =
    await prisma.operationalDisruption.findUnique(
      {
        where: { id },
        select: {
          resolved: true,
          resolvedAt: true,
        },
      },
    );

  if (!existing) {
    throw new Error(
      "Operational disruption record was not found.",
    );
  }

  let resolvedAt =
    existing.resolvedAt;

  if (
    resolved &&
    !existing.resolved
  ) {
    resolvedAt = new Date();
  }

  if (!resolved) {
    resolvedAt = null;
  }

  await prisma.operationalDisruption.update(
    {
      where: { id },
      data: {
        disruptionDate,
        startTime:
          readOptionalText(
            formData,
            "startTime",
          ),
        endTime:
          readOptionalText(
            formData,
            "endTime",
          ),
        hoursLost:
          parseRequiredFloat(
            readText(
              formData,
              "hoursLost",
            ),
            "Hours lost",
          ),
        type,
        impactLevel,
        affectedArea,
        title,
        description:
          readOptionalText(
            formData,
            "description",
          ),
        estimatedProceduresLost:
          parseOptionalInt(
            readText(
              formData,
              "estimatedProceduresLost",
            ),
          ),
        estimatedLitersLost:
          parseOptionalFloat(
            readText(
              formData,
              "estimatedLitersLost",
            ),
          ),
        resolved,
        resolvedAt,
      },
    },
  );

  revalidatePath(
    "/settings/operational-impact",
  );

  redirect(
    "/settings/operational-impact",
  );
}

export async function archiveOperationalDisruption(
  formData: FormData,
) {
  await requireAdmin();

  const id =
    parseRecordId(formData);

  await prisma.operationalDisruption.update(
    {
      where: { id },
      data: {
        archived: true,
      },
    },
  );

  revalidatePath(
    "/settings/operational-impact",
  );
}

export async function restoreOperationalDisruption(
  formData: FormData,
) {
  await requireAdmin();

  const id =
    parseRecordId(formData);

  await prisma.operationalDisruption.update(
    {
      where: { id },
      data: {
        archived: false,
      },
    },
  );

  revalidatePath(
    "/settings/operational-impact",
  );
}

export async function deleteOperationalDisruption(
  formData: FormData,
) {
  await requireAdmin();

  const id =
    parseRecordId(formData);

  const existing =
    await prisma.operationalDisruption.findUnique(
      {
        where: { id },
        select: {
          id: true,
        },
      },
    );

  if (!existing) {
    throw new Error(
      "Operational disruption record was not found.",
    );
  }

  await prisma.operationalDisruption.delete(
    {
      where: { id },
    },
  );

  revalidatePath(
    "/settings/operational-impact",
  );
}