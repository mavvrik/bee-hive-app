"use server";

import ExcelJS from "exceljs";
import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  matchWorkerName,
  type WorkerNameMatchType,
} from "@/app/lib/workers/workerNameMatcher";

type SupportedRole =
  | "MANAGEMENT"
  | "PHLEBOTOMIST"
  | "DST"
  | "RECEPTION_TECH"
  | "MSA"
  | "PROCESSOR";

type SupportedMetric =
  | "STICKS"
  | "RESTICKS"
  | "DISCONNECTS"
  | "SETUPS"
  | "PHYSICALS"
  | "INTERVIEWS"
  | "SEPARATIONS"
  | "SOLUTIONS_SPIKED";

export type TaskImportStatus =
  | "READY"
  | "UNMATCHED_WORKER"
  | "AMBIGUOUS_WORKER"
  | "ROLE_MISMATCH"
  | "NEEDS_MAPPING";

export type TaskImportRow = {
  rowId: string;
  operationalDate: string;
  sourceSection: string;
  taskLabel: string;
  sourceEmployeeName: string;

  collectorId: number | null;
  matchedWorkerName: string | null;

  role: SupportedRole | null;
  metric: SupportedMetric | null;

  value: number;

  status:
    TaskImportStatus;

  message: string;
};

export type TaskImportPreview = {
  success: boolean;
  fileName: string;
  operationalDate:
    string | null;

  rows:
    TaskImportRow[];

  readyCount: number;
  warningCount: number;

  errors: string[];
};

export type TaskImportResult = {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  message: string;
};

type TaskDefinition = {
  taskLabel: string;
  roles:
    SupportedRole[];
  metric:
    SupportedMetric;
};

type WorkerForMatching = {
  id: number;
  name: string;
  preferredName:
    string | null;
  role: string;
  active: boolean;

  roleAssignments: {
    role: string;
  }[];
};

/*
 * ==========================================
 * TASK MAP
 * ==========================================
 */

const TASK_SECTION_MAP: Record<
  string,
  TaskDefinition
> = {
  "softgood setups by employee": {
    taskLabel:
      "Setups",

    roles:
      [
        "DST",
      ],

    metric:
      "SETUPS",
  },

  disconnects: {
    taskLabel:
      "Disconnects",

    roles:
      [
        "DST",
      ],

    metric:
      "DISCONNECTS",
  },

  "interviews by employee": {
    taskLabel:
      "Interviews",

    roles:
      [
        "RECEPTION_TECH",
      ],

    metric:
      "INTERVIEWS",
  },

  "phlebotomies by employee": {
    taskLabel:
      "Phlebotomies",

    roles:
      [
        "PHLEBOTOMIST",
      ],

    metric:
      "STICKS",
  },

  resticks: {
    taskLabel:
      "Resticks",

    roles:
      [
        "PHLEBOTOMIST",
      ],

    metric:
      "RESTICKS",
  },

  "physicals by employee": {
    taskLabel:
      "Physicals",

    roles:
      [
        "MSA",
      ],

    metric:
      "PHYSICALS",
  },

  "units labeled by employee": {
    taskLabel:
      "Separations",

    roles:
      [
        "PROCESSOR",
      ],

    metric:
      "SEPARATIONS",
  },

  "solutions spiked by employee": {
    taskLabel:
      "Solutions Spiked",

    roles: [
      "MSA",
      "MANAGEMENT",
      "PHLEBOTOMIST",
      "DST",
    ],

    metric:
      "SOLUTIONS_SPIKED",
  },
};

/*
 * ==========================================
 * PRIMARY ROLE MAP
 * ==========================================
 */

const PRIMARY_ROLE_MAP: Record<
  string,
  string
> = {
  Management:
    "MANAGEMENT",

  Phlebotomist:
    "PHLEBOTOMIST",

  "Group Lead":
    "GROUP_LEAD",

  Processor:
    "PROCESSOR",

  "Reception Tech":
    "RECEPTION_TECH",

  MSA:
    "MSA",

  DST:
    "DST",

  Other:
    "OTHER",
};

function primaryRoleToEnum(
  role: string,
) {
  return (
    PRIMARY_ROLE_MAP[
      role
    ] ??
    "OTHER"
  );
}

/*
 * ==========================================
 * TEXT NORMALIZATION
 * ==========================================
 */

function normalizeWhitespace(
  value: string,
) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSectionName(
  value: string,
) {
  return normalizeWhitespace(
    value,
  )
    .toLowerCase()
    .trim();
}

function normalizedRowId(
  value: string,
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

/*
 * ==========================================
 * MATCH MESSAGE
 * ==========================================
 */

function getMatchMessage(
  matchType:
    WorkerNameMatchType,
  workerName: string,
  active: boolean,
) {
  const historicalPrefix =
    active
      ? ""
      : "Historical worker matched. ";

  switch (
    matchType
  ) {
    case "EXACT":
      return `${historicalPrefix}Exact worker-name match. Ready to import.`;

    case "DISPLAY":
      return `${historicalPrefix}Matched using the Worker Bee preferred/display name. Ready to import.`;

    case "KNOWN_ALIAS":
      return `${historicalPrefix}Matched ${workerName} using a confirmed CSL/HIVE name alias. Ready to import.`;

    case "NORMALIZED_FULL":
      return `${historicalPrefix}Matched ${workerName} after normalizing punctuation/name formatting. Ready to import.`;

    case "INITIAL_LAST":
      return `${historicalPrefix}Matched ${workerName} using first initial + surname. Ready to import.`;

    case "LAST_INITIAL":
      return `${historicalPrefix}Matched ${workerName} using surname + first initial. Ready to import.`;

    case "FIRST_NAME":
      return `${historicalPrefix}Matched ${workerName} using a unique Worker Bee first name. Ready to import.`;

    default:
      return `${historicalPrefix}Ready to import.`;
  }
}

/*
 * ==========================================
 * EXCEL CELL READING
 * ==========================================
 */

function cellToString(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return String(
      value,
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    const candidate =
      value as {
        text?: unknown;
        result?: unknown;

        richText?: Array<{
          text?: string;
        }>;
      };

    if (
      typeof candidate.text ===
      "string"
    ) {
      return candidate
        .text
        .trim();
    }

    if (
      candidate.result !==
        undefined &&
      candidate.result !==
        null
    ) {
      return String(
        candidate.result,
      ).trim();
    }

    if (
      Array.isArray(
        candidate.richText,
      )
    ) {
      return candidate.richText
        .map(
          (item) =>
            item.text ?? "",
        )
        .join("")
        .trim();
    }
  }

  return String(
    value,
  ).trim();
}

/*
 * ==========================================
 * ADAPTIVE SUMMARY ROW DETECTION
 * ==========================================
 */

function findEmployeeMarkerColumn(
  row: ExcelJS.Row,
  worksheet:
    ExcelJS.Worksheet,
) {
  const maxColumn =
    Math.min(
      Math.max(
        worksheet.columnCount,
        20,
      ),
      40,
    );

  for (
    let column = 1;
    column <= maxColumn;
    column += 1
  ) {
    const text =
      normalizeWhitespace(
        cellToString(
          row.getCell(
            column,
          ).value,
        ),
      ).toLowerCase();

    if (
      text ===
      "employee name"
    ) {
      return column;
    }
  }

  return null;
}

function findEmployeeName(
  row: ExcelJS.Row,
  markerColumn: number,
  worksheet:
    ExcelJS.Worksheet,
) {
  /*
   * Compact file:
   *
   * Employee Name = col 4
   * Name          = col 6
   *
   * Expanded file:
   *
   * Employee Name = col 5
   * Name          = col 8
   *
   * Search several cells to the right rather
   * than hard-coding either format.
   */

  const maximum =
    Math.min(
      worksheet.columnCount,
      markerColumn + 7,
    );

  for (
    let column =
      markerColumn + 1;
    column <= maximum;
    column += 1
  ) {
    const value =
      row.getCell(
        column,
      ).value;

    /*
     * Employee names are text values in
     * the CSL summary rows.
     */
    const text =
      normalizeWhitespace(
        cellToString(
          value,
        ),
      );

    if (
      !text
    ) {
      continue;
    }

    const normalized =
      text.toLowerCase();

    if (
      normalized ===
      "employee name"
    ) {
      continue;
    }

    /*
     * Ignore pure numbers.
     */
    if (
      /^-?\d+(?:\.\d+)?$/.test(
        text,
      )
    ) {
      continue;
    }

    /*
     * Ignore obvious summary labels.
     */
    if (
      /by employee$/i.test(
        text,
      ) ||
      normalized ===
        "disconnects" ||
      normalized ===
        "resticks"
    ) {
      continue;
    }

    return text;
  }

  return "";
}

function getNumericValueFromSummaryRow(
  row: ExcelJS.Row,
  markerColumn: number,
  worksheet:
    ExcelJS.Worksheet,
) {
  /*
   * The compact and expanded CSL exports put
   * the summary count in different columns.
   *
   * We scan from the far right toward the
   * Employee Name marker and use the first
   * whole numeric value found.
   */

  const maximumColumn =
    Math.min(
      Math.max(
        worksheet.columnCount,
        20,
      ),
      40,
    );

  for (
    let column =
      maximumColumn;
    column >
      markerColumn;
    column -= 1
  ) {
    const cellValue =
      row.getCell(
        column,
      ).value;

    if (
      typeof cellValue ===
        "number" &&
      Number.isFinite(
        cellValue,
      )
    ) {
      return Math.max(
        0,
        Math.trunc(
          cellValue,
        ),
      );
    }

    const text =
      cellToString(
        cellValue,
      );

    if (
      /^\d+$/.test(
        text,
      )
    ) {
      return Math.max(
        0,
        Number.parseInt(
          text,
          10,
        ),
      );
    }

    /*
     * Formula result support.
     */
    if (
      typeof cellValue ===
      "object" &&
      cellValue !==
        null
    ) {
      const candidate =
        cellValue as {
          result?: unknown;
        };

      if (
        typeof candidate.result ===
          "number" &&
        Number.isFinite(
          candidate.result,
        )
      ) {
        return Math.max(
          0,
          Math.trunc(
            candidate.result,
          ),
        );
      }
    }
  }

  return null;
}

/*
 * ==========================================
 * REPORT DATE
 * ==========================================
 */

function parseUsReportDate(
  month: string,
  day: string,
  year: string,
) {
  return `${year}-${month.padStart(
    2,
    "0",
  )}-${day.padStart(
    2,
    "0",
  )}`;
}

function getOperationalDateFromWorkbook(
  worksheet:
    ExcelJS.Worksheet,
) {
  for (
    let rowNumber = 1;
    rowNumber <=
    Math.min(
      worksheet.rowCount,
      15,
    );
    rowNumber += 1
  ) {
    const row =
      worksheet.getRow(
        rowNumber,
      );

    for (
      let column = 1;
      column <=
      Math.min(
        Math.max(
          worksheet.columnCount,
          20,
        ),
        40,
      );
      column += 1
    ) {
      const text =
        cellToString(
          row.getCell(
            column,
          ).value,
        );

      if (
        !text
      ) {
        continue;
      }

      const match =
        /Donation Dates Between:\s*(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+and\s+(\d{1,2})[-/](\d{1,2})[-/](\d{4})/i.exec(
          text,
        );

      if (
        !match
      ) {
        continue;
      }

      return {
        startDate:
          parseUsReportDate(
            match[1],
            match[2],
            match[3],
          ),

        endDate:
          parseUsReportDate(
            match[4],
            match[5],
            match[6],
          ),
      };
    }
  }

  return null;
}

/*
 * ==========================================
 * ROLE ELIGIBILITY
 * ==========================================
 */

function getWorkerRoleSet(
  worker: {
    role: string;

    roleAssignments: {
      role: string;
    }[];
  },
) {
  const roles =
    new Set<string>();

  for (
    const assignment of
    worker.roleAssignments
  ) {
    roles.add(
      assignment.role,
    );
  }

  const legacyRole =
    PRIMARY_ROLE_MAP[
      worker.role
    ];

  if (
    legacyRole
  ) {
    roles.add(
      legacyRole,
    );
  }

  return roles;
}

function resolveTaskRole(
  worker: {
    role: string;

    roleAssignments: {
      role: string;
    }[];
  },
  definition:
    TaskDefinition,
): SupportedRole | null {
  const roleSet =
    getWorkerRoleSet(
      worker,
    );

  const primaryRole =
    primaryRoleToEnum(
      worker.role,
    );

  if (
    definition.roles.includes(
      primaryRole as SupportedRole,
    ) &&
    roleSet.has(
      primaryRole,
    )
  ) {
    return primaryRole as SupportedRole;
  }

  for (
    const allowedRole of
    definition.roles
  ) {
    if (
      roleSet.has(
        allowedRole,
      )
    ) {
      return allowedRole;
    }
  }

  return null;
}

/*
 * ==========================================
 * PREVIEW WORKBOOK
 * ==========================================
 */

export async function parseWorkerTaskWorkbook(
  formData: FormData,
): Promise<TaskImportPreview> {
  const fileValue =
    formData.get(
      "taskFile",
    );

  if (
    !fileValue ||
    typeof fileValue ===
      "string"
  ) {
    return {
      success: false,
      fileName: "",
      operationalDate:
        null,
      rows: [],
      readyCount: 0,
      warningCount: 0,

      errors: [
        "Choose an Excel task report before previewing the import.",
      ],
    };
  }

  const file =
    fileValue as File;

  const fileName =
    file.name;

  if (
    !/\.(xlsx|xlsm|xls)$/i.test(
      fileName,
    )
  ) {
    return {
      success: false,
      fileName,
      operationalDate:
        null,
      rows: [],
      readyCount: 0,
      warningCount: 0,

      errors: [
        "The selected file must be an Excel workbook.",
      ],
    };
  }

  const workbook =
    new ExcelJS.Workbook();

  const arrayBuffer =
    await file.arrayBuffer();

  await workbook.xlsx.load(
    arrayBuffer as any,
  );

  const worksheet =
    workbook.worksheets[0];

  if (
    !worksheet
  ) {
    return {
      success: false,
      fileName,
      operationalDate:
        null,
      rows: [],
      readyCount: 0,
      warningCount: 0,

      errors: [
        "The workbook does not contain a readable worksheet.",
      ],
    };
  }

  const reportDates =
    getOperationalDateFromWorkbook(
      worksheet,
    );

  if (
    !reportDates
  ) {
    return {
      success: false,
      fileName,
      operationalDate:
        null,
      rows: [],
      readyCount: 0,
      warningCount: 0,

      errors: [
        "HIVE could not find the Donation Dates Between header in this workbook.",
      ],
    };
  }

  if (
    reportDates.startDate !==
    reportDates.endDate
  ) {
    return {
      success: false,
      fileName,
      operationalDate:
        null,
      rows: [],
      readyCount: 0,
      warningCount: 0,

      errors: [
        "This importer currently supports one operational day per task sheet.",
      ],
    };
  }

  const operationalDate =
    reportDates.startDate;

  const workers =
    (
      await prisma.collector.findMany({
        select: {
          id: true,
          name: true,
          preferredName:
            true,
          role: true,
          active: true,

          roleAssignments: {
            select: {
              role: true,
            },
          },
        },
      })
    ) as WorkerForMatching[];

  const parsedRows:
    TaskImportRow[] =
    [];

  let currentSection:
    string | null =
    null;

  let currentDefinition:
    TaskDefinition | null =
    null;

  /*
   * ==========================================
   * READ REPORT
   * ==========================================
   */

  for (
    let rowNumber = 1;
    rowNumber <=
    worksheet.rowCount;
    rowNumber += 1
  ) {
    const row =
      worksheet.getRow(
        rowNumber,
      );

    /*
     * ------------------------------------------
     * Detect task section.
     * ------------------------------------------
     */

    const firstCellText =
      cellToString(
        row.getCell(
          1,
        ).value,
      );

    if (
      firstCellText
    ) {
      const normalizedSection =
        normalizeSectionName(
          firstCellText,
        );

      const mappedSection =
        TASK_SECTION_MAP[
          normalizedSection
        ];

      if (
        mappedSection
      ) {
        currentSection =
          firstCellText.trim();

        currentDefinition =
          mappedSection;

        continue;
      }
    }

    if (
      !currentSection ||
      !currentDefinition
    ) {
      continue;
    }

    /*
     * ------------------------------------------
     * Dynamically detect the summary row.
     * ------------------------------------------
     */

    const employeeMarkerColumn =
      findEmployeeMarkerColumn(
        row,
        worksheet,
      );

    if (
      employeeMarkerColumn ===
      null
    ) {
      continue;
    }

    const sourceEmployeeName =
      findEmployeeName(
        row,
        employeeMarkerColumn,
        worksheet,
      );

    if (
      !sourceEmployeeName
    ) {
      continue;
    }

    const value =
      getNumericValueFromSummaryRow(
        row,
        employeeMarkerColumn,
        worksheet,
      );

    if (
      value === null
    ) {
      continue;
    }

    const workerMatch =
      matchWorkerName(
        sourceEmployeeName,
        workers,
        {
          allowUniqueFirstName:
            true,
        },
      );

    const worker =
      workerMatch.worker;

    const rowId =
      `${rowNumber}-${normalizedRowId(
        sourceEmployeeName,
      )}-${normalizedRowId(
        currentSection,
      )}`;

    /*
     * ========================================
     * MULTI-PERSON / AMBIGUOUS
     * ========================================
     */

    if (
      workerMatch.matchType ===
        "AMBIGUOUS" ||
      workerMatch.matchType ===
        "MULTI_PERSON"
    ) {
      parsedRows.push({
        rowId,
        operationalDate,

        sourceSection:
          currentSection,

        taskLabel:
          currentDefinition
            .taskLabel,

        sourceEmployeeName,

        collectorId:
          null,

        matchedWorkerName:
          null,

        role: null,

        metric:
          currentDefinition
            .metric,

        value,

        status:
          "AMBIGUOUS_WORKER",

        message:
          workerMatch.matchType ===
          "MULTI_PERSON"
            ? "This source entry appears to name multiple employees or a staff group. HIVE refused to assign it to one Worker Bee."
            : "More than one Worker Bee could match this employee name. HIVE refused to guess.",
      });

      continue;
    }

    /*
     * ========================================
     * WORKER NOT FOUND
     * ========================================
     */

    if (
      !worker
    ) {
      parsedRows.push({
        rowId,
        operationalDate,

        sourceSection:
          currentSection,

        taskLabel:
          currentDefinition
            .taskLabel,

        sourceEmployeeName,

        collectorId:
          null,

        matchedWorkerName:
          null,

        role: null,

        metric:
          currentDefinition
            .metric,

        value,

        status:
          "UNMATCHED_WORKER",

        message:
          "No unique HIVE Worker Bee matched this employee name.",
      });

      continue;
    }

    /*
     * ========================================
     * ROLE VALIDATION
     * ========================================
     */

    const matchingRole =
      resolveTaskRole(
        worker,
        currentDefinition,
      );

    if (
      !matchingRole
    ) {
      parsedRows.push({
        rowId,
        operationalDate,

        sourceSection:
          currentSection,

        taskLabel:
          currentDefinition
            .taskLabel,

        sourceEmployeeName,

        collectorId:
          worker.id,

        matchedWorkerName:
          worker.name,

        role: null,

        metric:
          currentDefinition
            .metric,

        value,

        status:
          "ROLE_MISMATCH",

        message:
          `${worker.name} matched successfully, but HIVE does not currently show this Worker Bee as eligible for any role allowed to perform ${currentDefinition.taskLabel}.`,
      });

      continue;
    }

    /*
     * ========================================
     * READY
     * ========================================
     */

    parsedRows.push({
      rowId,
      operationalDate,

      sourceSection:
        currentSection,

      taskLabel:
        currentDefinition
          .taskLabel,

      sourceEmployeeName,

      collectorId:
        worker.id,

      matchedWorkerName:
        worker.name,

      role:
        matchingRole,

      metric:
        currentDefinition
          .metric,

      value,

      status:
        "READY",

      message:
        getMatchMessage(
          workerMatch.matchType,
          worker.name,
          worker.active,
        ),
    });
  }

  const readyCount =
    parsedRows.filter(
      (row) =>
        row.status ===
        "READY",
    ).length;

  const warningCount =
    parsedRows.length -
    readyCount;

  return {
    success: true,
    fileName,
    operationalDate,
    rows: parsedRows,
    readyCount,
    warningCount,
    errors: [],
  };
}

/*
 * ==========================================
 * IMPORT VALIDATED ROWS
 * ==========================================
 */

export async function importWorkerTaskRows(
  rawRows: string,
): Promise<TaskImportResult> {
  let rows:
    TaskImportRow[];

  try {
    rows =
      JSON.parse(
        rawRows,
      ) as TaskImportRow[];
  } catch {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,

      message:
        "The import preview could not be read.",
    };
  }

  const readyRows =
    rows.filter(
      (row) =>
        row.status ===
          "READY" &&
        row.collectorId !==
          null &&
        row.role !==
          null &&
        row.metric !==
          null,
    );

  if (
    readyRows.length ===
    0
  ) {
    return {
      success: false,
      importedCount: 0,
      skippedCount:
        rows.length,

      message:
        "There are no validated task rows ready to import.",
    };
  }

  const allowedMetrics =
    new Set<string>([
      "STICKS",
      "RESTICKS",
      "DISCONNECTS",
      "SETUPS",
      "PHYSICALS",
      "INTERVIEWS",
      "SEPARATIONS",
      "SOLUTIONS_SPIKED",
    ]);

  const allowedRoles =
    new Set<string>([
      "MANAGEMENT",
      "PHLEBOTOMIST",
      "DST",
      "RECEPTION_TECH",
      "MSA",
      "PROCESSOR",
    ]);

  const collectorIds =
    Array.from(
      new Set(
        readyRows
          .map(
            (row) =>
              row.collectorId,
          )
          .filter(
            (
              id,
            ): id is number =>
              id !== null,
          ),
      ),
    );

  const workers =
    await prisma.collector.findMany({
      where: {
        id: {
          in:
            collectorIds,
        },
      },

      select: {
        id: true,
        role: true,

        roleAssignments: {
          select: {
            role: true,
          },
        },
      },
    });

  const workerMap =
    new Map(
      workers.map(
        (worker) => [
          worker.id,
          worker,
        ],
      ),
    );

  const validatedRows:
    TaskImportRow[] =
    [];

  let skippedCount =
    rows.length -
    readyRows.length;

  /*
   * ==========================================
   * FINAL SERVER VALIDATION
   * ==========================================
   */

  for (
    const row of
    readyRows
  ) {
    if (
      !row.collectorId ||
      !row.role ||
      !row.metric ||
      !allowedRoles.has(
        row.role,
      ) ||
      !allowedMetrics.has(
        row.metric,
      ) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        row.operationalDate,
      ) ||
      !Number.isFinite(
        row.value,
      ) ||
      row.value < 0
    ) {
      skippedCount +=
        1;

      continue;
    }

    const worker =
      workerMap.get(
        row.collectorId,
      );

    if (
      !worker
    ) {
      skippedCount +=
        1;

      continue;
    }

    const roleSet =
      getWorkerRoleSet(
        worker,
      );

    if (
      !roleSet.has(
        row.role,
      )
    ) {
      skippedCount +=
        1;

      continue;
    }

    validatedRows.push(
      row,
    );
  }

  if (
    validatedRows.length ===
    0
  ) {
    return {
      success: false,
      importedCount: 0,
      skippedCount,

      message:
        "No task rows passed final server-side validation.",
    };
  }

  /*
   * ==========================================
   * FAST TRANSACTION
   * ==========================================
   */

  await prisma.$transaction(
    validatedRows.map(
      (row) => {
        const entryDate =
          new Date(
            `${row.operationalDate}T00:00:00.000Z`,
          );

        return prisma.workerPerformanceEntry.upsert({
          where: {
            collectorId_entryDate_role_metric: {
              collectorId:
                row.collectorId!,

              entryDate,

              role:
                row.role!,

              metric:
                row.metric!,
            },
          },

          update: {
            totalCount:
              Math.trunc(
                row.value,
              ),

            note:
              "Imported from CSL Tasks Completed by Employee report.",
          },

          create: {
            collectorId:
              row.collectorId!,

            entryDate,

            role:
              row.role!,

            metric:
              row.metric!,

            totalCount:
              Math.trunc(
                row.value,
              ),

            note:
              "Imported from CSL Tasks Completed by Employee report.",
          },
        });
      },
    ),
  );

  const importedCount =
    validatedRows.length;

  revalidatePath(
    "/",
  );

  revalidatePath(
    "/settings/workers",
  );

  revalidatePath(
    "/settings/workers/performance",
  );

  revalidatePath(
    "/settings/workers/import",
  );

  return {
    success: true,
    importedCount,
    skippedCount,

    message:
      `${importedCount} validated task row${
        importedCount === 1
          ? ""
          : "s"
      } imported successfully.`,
  };
}