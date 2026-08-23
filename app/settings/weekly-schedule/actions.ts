"use server";

import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ParsedShift = {
  employeeName: string;
  normalizedEmployeeName: string;
  primaryJob: string;
  shiftDate: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  collectorId: number | null;
  collectorName: string | null;
  matched: boolean;
  matchMethod:
    | "FULL_NAME"
    | "FIRST_NAME"
    | "NONE";
};

export type ParsedWeek = {
  weekStart: string;
  weekEnd: string;
  shifts: ParsedShift[];
};

export type SchedulePreviewState = {
  status:
    | "idle"
    | "success"
    | "error";

  message?: string;
  fileName?: string;
  totalShifts?: number;
  matchedShifts?: number;
  unmatchedShifts?: number;
  weeks?: ParsedWeek[];
};

export type ScheduleImportState = {
  status:
    | "idle"
    | "success"
    | "error";

  message?: string;

  importedShifts?: number;
};

type CollectorMatch = {
  id: number;
  name: string;
};

const HIVE_FIRST_NAME_ALIASES: Record<
  string,
  string
> = {
  keyala: "key",
  judelande: "jude",
};

function cleanText(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value,
  ).trim();
}

function normalizePersonName(
  value: string,
) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]/g,
      "",
    );
}

function scheduleNameToNormalOrder(
  value: string,
) {
  const cleaned =
    value.trim();

  if (
    !cleaned.includes(
      ",",
    )
  ) {
    return cleaned;
  }

  const parts =
    cleaned.split(
      ",",
    );

  if (
    parts.length <
    2
  ) {
    return cleaned;
  }

  const lastName =
    parts[0]?.trim() ??
    "";

  const firstAndMiddle =
    parts
      .slice(
        1,
      )
      .join(
        " ",
      )
      .trim();

  if (
    !lastName ||
    !firstAndMiddle
  ) {
    return cleaned;
  }

  return `${firstAndMiddle} ${lastName}`;
}

function getFirstName(
  value: string,
) {
  const cleaned =
    value.trim();

  if (!cleaned) {
    return "";
  }

  return cleaned
    .split(/\s+/)[0] ??
    "";
}

function getDateFromValue(
  value: unknown,
): string | null {
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime(),
    )
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10,
      );
  }

  const text =
    cleanText(
      value,
    );

  if (!text) {
    return null;
  }

  const match =
    text.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    );

  if (!match) {
    return null;
  }

  const month =
    Number(
      match[1],
    );

  const day =
    Number(
      match[2],
    );

  const year =
    Number(
      match[3],
    );

  if (
    !month ||
    !day ||
    !year
  ) {
    return null;
  }

  return [
    String(
      year,
    ).padStart(
      4,
      "0",
    ),

    String(
      month,
    ).padStart(
      2,
      "0",
    ),

    String(
      day,
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}

function parseDateOnly(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "Invalid schedule date.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function getDayLabel(
  dateText: string,
) {
  const date =
    parseDateOnly(
      dateText,
    );

  return date.toLocaleDateString(
    "en-US",
    {
      timeZone:
        "UTC",

      weekday:
        "short",
    },
  );
}

function parseShiftTimes(
  value: unknown,
) {
  const text =
    cleanText(
      value,
    )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  if (!text) {
    return null;
  }

  const match =
    text.match(
      /^(.+?)\s*-\s*(.+)$/,
    );

  if (!match) {
    return null;
  }

  const startTime =
    match[1]
      ?.trim() ??
    "";

  const endTime =
    match[2]
      ?.trim() ??
    "";

  if (
    !startTime ||
    !endTime
  ) {
    return null;
  }

  return {
    startTime,
    endTime,
  };
}

function addDays(
  dateText: string,
  days: number,
) {
  const date =
    parseDateOnly(
      dateText,
    );

  date.setUTCDate(
    date.getUTCDate() +
      days,
  );

  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function getWeekStart(
  dateText: string,
) {
  const date =
    parseDateOnly(
      dateText,
    );

  const day =
    date.getUTCDay();

  date.setUTCDate(
    date.getUTCDate() -
      day,
  );

  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function looksLikeOrganizationRow(
  value: string,
) {
  const normalized =
    value.toLowerCase();

  return (
    normalized.includes(
      "csl llc/",
    ) ||
    normalized.includes(
      "/riviera beach 115",
    )
  );
}

function findCollectorMatch(
  employeeName: string,
  fullNameLookup: Map<
    string,
    CollectorMatch
  >,
  firstNameLookup: Map<
    string,
    CollectorMatch[]
  >,
) {
  /*
   * 1. EXACT FULL NAME
   */

  const normalizedFullName =
    normalizePersonName(
      employeeName,
    );

  const exactMatch =
    fullNameLookup.get(
      normalizedFullName,
    );

  if (exactMatch) {
    return {
      collector:
        exactMatch,

      matchMethod:
        "FULL_NAME" as const,
    };
  }

  /*
   * 2. UNIQUE FIRST NAME
   *
   * Try the official schedule first name first,
   * then a known HIVE 1 alias.
   */

  const scheduleFirstName =
    normalizePersonName(
      getFirstName(
        employeeName,
      ),
    );

  const candidateFirstNames =
    new Set<string>();

  if (scheduleFirstName) {
    candidateFirstNames.add(
      scheduleFirstName,
    );

    const alias =
      HIVE_FIRST_NAME_ALIASES[
        scheduleFirstName
      ];

    if (alias) {
      candidateFirstNames.add(
        alias,
      );
    }
  }

  for (
    const firstName of
    candidateFirstNames
  ) {
    const candidates =
      firstNameLookup.get(
        firstName,
      ) ??
      [];

    if (
      candidates.length ===
      1
    ) {
      return {
        collector:
          candidates[0] ??
          null,

        matchMethod:
          "FIRST_NAME" as const,
      };
    }
  }

  /*
   * 3. NEEDS MATCHING
   */

  return {
    collector:
      null,

    matchMethod:
      "NONE" as const,
  };
}

export async function previewWeeklySchedule(
  _previousState:
    SchedulePreviewState,

  formData:
    FormData,
): Promise<SchedulePreviewState> {
  try {
    const uploadedFile =
      formData.get(
        "scheduleFile",
      );

    if (
      !(uploadedFile instanceof File)
    ) {
      return {
        status:
          "error",

        message:
          "Please select an Excel schedule file.",
      };
    }

    if (
      uploadedFile.size ===
      0
    ) {
      return {
        status:
          "error",

        message:
          "The selected schedule file is empty.",
      };
    }

    const lowerName =
      uploadedFile.name.toLowerCase();

    if (
      !lowerName.endsWith(
        ".xlsx",
      ) &&
      !lowerName.endsWith(
        ".xls",
      )
    ) {
      return {
        status:
          "error",

        message:
          "Please upload an Excel .xlsx or .xls schedule file.",
      };
    }

    const arrayBuffer =
      await uploadedFile.arrayBuffer();

    const workbook =
      XLSX.read(
        arrayBuffer,
        {
          type:
            "array",

          cellDates:
            true,
        },
      );

    const firstSheetName =
      workbook.SheetNames[
        0
      ];

    if (
      !firstSheetName
    ) {
      return {
        status:
          "error",

        message:
          "The workbook does not contain a worksheet.",
      };
    }

    const worksheet =
      workbook.Sheets[
        firstSheetName
      ];

    if (
      !worksheet
    ) {
      return {
        status:
          "error",

        message:
          "The schedule worksheet could not be read.",
      };
    }

    const rows =
      XLSX.utils.sheet_to_json<
        unknown[]
      >(
        worksheet,
        {
          header:
            1,

          defval:
            "",

          raw:
            true,
        },
      );

    type ScheduleSection = {
      headerRowIndex:
        number;

      dateRowIndex:
        number;

      employeeColumn:
        number;

      jobColumn:
        number;

      dateColumns: {
        columnIndex:
          number;

        date:
          string;
      }[];
    };

    const sections:
      ScheduleSection[] =
      [];

    /*
     * FIND CSL EMPLOYEE / PRIMARY JOB HEADERS
     */

    for (
      let rowIndex =
        0;

      rowIndex <
      rows.length;

      rowIndex +=
        1
    ) {
      const row =
        rows[
          rowIndex
        ] ??
        [];

      let employeeColumn =
        -1;

      let jobColumn =
        -1;

      for (
        let columnIndex =
          0;

        columnIndex <
        row.length;

        columnIndex +=
          1
      ) {
        const text =
          cleanText(
            row[
              columnIndex
            ],
          ).toLowerCase();

        if (
          text ===
          "employee"
        ) {
          employeeColumn =
            columnIndex;
        }

        if (
          text ===
          "primary job"
        ) {
          jobColumn =
            columnIndex;
        }
      }

      if (
        employeeColumn <
          0 ||
        jobColumn <
          0
      ) {
        continue;
      }

      let dateRowIndex =
        -1;

      let dateColumns: {
        columnIndex:
          number;

        date:
          string;
      }[] =
        [];

      for (
        let candidateIndex =
          rowIndex +
          1;

        candidateIndex <=
          Math.min(
            rowIndex +
              3,

            rows.length -
              1,
          );

        candidateIndex +=
          1
      ) {
        const candidateRow =
          rows[
            candidateIndex
          ] ??
          [];

        const candidateDates: {
          columnIndex:
            number;

          date:
            string;
        }[] =
          [];

        for (
          let columnIndex =
            0;

          columnIndex <
          candidateRow.length;

          columnIndex +=
            1
        ) {
          const date =
            getDateFromValue(
              candidateRow[
                columnIndex
              ],
            );

          if (
            date
          ) {
            candidateDates.push({
              columnIndex,
              date,
            });
          }
        }

        if (
          candidateDates.length >=
          4
        ) {
          dateRowIndex =
            candidateIndex;

          dateColumns =
            candidateDates;

          break;
        }
      }

      if (
        dateRowIndex <
          0 ||
        dateColumns.length ===
          0
      ) {
        continue;
      }

      sections.push({
        headerRowIndex:
          rowIndex,

        dateRowIndex,

        employeeColumn,

        jobColumn,

        dateColumns,
      });
    }

    if (
      sections.length ===
      0
    ) {
      return {
        status:
          "error",

        message:
          "HIVE could not find the Employee / Primary Job schedule sections in this workbook.",
      };
    }

    const collectors =
      await prisma.collector.findMany({
        where: {
          active:
            true,
        },

        select: {
          id:
            true,

          name:
            true,

          preferredName:
            true,
        },

        orderBy: {
          name:
            "asc",
        },
      });

    const fullNameLookup =
      new Map<
        string,
        CollectorMatch
      >();

    const firstNameLookup =
      new Map<
        string,
        CollectorMatch[]
      >();

    for (
      const collector of
      collectors
    ) {
      const collectorMatch:
        CollectorMatch = {
          id:
            collector.id,

          name:
            collector.name,
        };

      const normalizedFullName =
        normalizePersonName(
          collector.name,
        );

      if (
        normalizedFullName
      ) {
        fullNameLookup.set(
          normalizedFullName,
          collectorMatch,
        );
      }

      const storedFirstName =
        normalizePersonName(
          getFirstName(
            collector.name,
          ),
        );

      if (
        storedFirstName
      ) {
        const existing =
          firstNameLookup.get(
            storedFirstName,
          ) ??
          [];

        if (
          !existing.some(
            (
              item,
            ) =>
              item.id ===
              collector.id,
          )
        ) {
          existing.push(
            collectorMatch,
          );
        }

        firstNameLookup.set(
          storedFirstName,
          existing,
        );
      }

      if (
        collector.preferredName
      ) {
        const preferredFirstName =
          normalizePersonName(
            getFirstName(
              collector.preferredName,
            ),
          );

        if (
          preferredFirstName
        ) {
          const existing =
            firstNameLookup.get(
              preferredFirstName,
            ) ??
            [];

          if (
            !existing.some(
              (
                item,
              ) =>
                item.id ===
                collector.id,
            )
          ) {
            existing.push(
              collectorMatch,
            );
          }

          firstNameLookup.set(
            preferredFirstName,
            existing,
          );
        }
      }
    }

    const parsedShifts:
      ParsedShift[] =
      [];

    /*
     * READ EMPLOYEE ROWS
     */

    for (
      let sectionIndex =
        0;

      sectionIndex <
      sections.length;

      sectionIndex +=
        1
    ) {
      const section =
        sections[
          sectionIndex
        ];

      if (
        !section
      ) {
        continue;
      }

      const nextSection =
        sections[
          sectionIndex +
            1
        ];

      const endRow =
        nextSection
          ? nextSection
              .headerRowIndex
          : rows.length;

      for (
        let rowIndex =
          section.dateRowIndex +
          1;

        rowIndex <
        endRow;

        rowIndex +=
          1
      ) {
        const row =
          rows[
            rowIndex
          ] ??
          [];

        const rawEmployeeName =
          cleanText(
            row[
              section
                .employeeColumn
            ],
          );

        if (
          !rawEmployeeName
        ) {
          continue;
        }

        if (
          looksLikeOrganizationRow(
            rawEmployeeName,
          )
        ) {
          continue;
        }

        const lowerEmployeeName =
          rawEmployeeName.toLowerCase();

        if (
          lowerEmployeeName ===
            "employee" ||
          lowerEmployeeName.includes(
            "time period",
          ) ||
          lowerEmployeeName.includes(
            "query :",
          )
        ) {
          continue;
        }

        const primaryJob =
          cleanText(
            row[
              section
                .jobColumn
            ],
          );

        const hasAnyShift =
          section.dateColumns.some(
            (
              dateColumn,
            ) =>
              Boolean(
                parseShiftTimes(
                  row[
                    dateColumn
                      .columnIndex
                  ],
                ),
              ),
          );

        if (
          !primaryJob &&
          !hasAnyShift
        ) {
          continue;
        }

        const normalOrderName =
          scheduleNameToNormalOrder(
            rawEmployeeName,
          );

        const normalizedEmployeeName =
          normalizePersonName(
            normalOrderName,
          );

        const matchResult =
          findCollectorMatch(
            normalOrderName,
            fullNameLookup,
            firstNameLookup,
          );

        for (
          const dateColumn of
          section.dateColumns
        ) {
          const shift =
            parseShiftTimes(
              row[
                dateColumn
                  .columnIndex
              ],
            );

          if (
            !shift
          ) {
            continue;
          }

          parsedShifts.push({
            employeeName:
              normalOrderName,

            normalizedEmployeeName,

            primaryJob,

            shiftDate:
              dateColumn.date,

            dayLabel:
              getDayLabel(
                dateColumn.date,
              ),

            startTime:
              shift.startTime,

            endTime:
              shift.endTime,

            collectorId:
              matchResult
                .collector
                ?.id ??
              null,

            collectorName:
              matchResult
                .collector
                ?.name ??
              null,

            matched:
              Boolean(
                matchResult
                  .collector,
              ),

            matchMethod:
              matchResult
                .matchMethod,
          });
        }
      }
    }

    const uniqueShifts =
      new Map<
        string,
        ParsedShift
      >();

    for (
      const shift of
      parsedShifts
    ) {
      const key = [
        shift
          .normalizedEmployeeName,

        shift
          .shiftDate,

        shift
          .startTime,

        shift
          .endTime,

        shift
          .primaryJob,
      ].join(
        "|",
      );

      uniqueShifts.set(
        key,
        shift,
      );
    }

    const shifts =
      Array.from(
        uniqueShifts.values(),
      ).sort(
        (
          a,
          b,
        ) => {
          const dateCompare =
            a.shiftDate.localeCompare(
              b.shiftDate,
            );

          if (
            dateCompare !==
            0
          ) {
            return dateCompare;
          }

          return a.employeeName.localeCompare(
            b.employeeName,
          );
        },
      );

    if (
      shifts.length ===
      0
    ) {
      return {
        status:
          "error",

        message:
          "The workbook was read, but HIVE did not find any scheduled shifts.",
      };
    }

    const weekMap =
      new Map<
        string,
        ParsedShift[]
      >();

    for (
      const shift of
      shifts
    ) {
      const weekStart =
        getWeekStart(
          shift.shiftDate,
        );

      const existing =
        weekMap.get(
          weekStart,
        ) ??
        [];

      existing.push(
        shift,
      );

      weekMap.set(
        weekStart,
        existing,
      );
    }

    const weeks:
      ParsedWeek[] =
      Array.from(
        weekMap.entries(),
      )
        .sort(
          (
            [a],
            [b],
          ) =>
            a.localeCompare(
              b,
            ),
        )
        .map(
          ([
            weekStart,
            weekShifts,
          ]) => ({
            weekStart,

            weekEnd:
              addDays(
                weekStart,
                6,
              ),

            shifts:
              weekShifts,
          }),
        );

    const matchedShifts =
      shifts.filter(
        (
          shift,
        ) =>
          shift.matched,
      ).length;

    const unmatchedShifts =
      shifts.length -
      matchedShifts;

    return {
      status:
        "success",

      message:
        `HIVE found ${shifts.length} scheduled shifts across ${weeks.length} week${weeks.length === 1 ? "" : "s"}.`,

      fileName:
        uploadedFile.name,

      totalShifts:
        shifts.length,

      matchedShifts,

      unmatchedShifts,

      weeks,
    };
  } catch (
    error
  ) {
    console.error(
      "Weekly schedule preview failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "HIVE could not read this schedule. No schedule data was saved.",
    };
  }
}

/*
 * ==========================================
 * CONFIRM / IMPORT PREVIEWED SCHEDULE
 * ==========================================
 */

export async function importWeeklySchedule(
  _previousState:
    ScheduleImportState,

  formData:
    FormData,
): Promise<ScheduleImportState> {
  try {
    const fileName =
      cleanText(
        formData.get(
          "fileName",
        ),
      );

    const payloadText =
      cleanText(
        formData.get(
          "schedulePayload",
        ),
      );

    if (
      !fileName ||
      !payloadText
    ) {
      return {
        status:
          "error",

        message:
          "The schedule preview data is missing. Please preview the file again.",
      };
    }

    let parsedPayload:
      ParsedShift[];

    try {
      parsedPayload =
        JSON.parse(
          payloadText,
        ) as ParsedShift[];
    } catch {
      return {
        status:
          "error",

        message:
          "The schedule preview data could not be read. Please preview the file again.",
      };
    }

    if (
      !Array.isArray(
        parsedPayload,
      ) ||
      parsedPayload.length ===
        0
    ) {
      return {
        status:
          "error",

        message:
          "There are no shifts available to import.",
      };
    }

    /*
     * Import only successfully matched workers.
     */

    const matchedShifts =
      parsedPayload.filter(
        (
          shift,
        ) =>
          shift.matched &&
          shift.collectorId !==
            null,
      );

    const unmatchedShifts =
      parsedPayload.filter(
        (
          shift,
        ) =>
          !shift.matched ||
          shift.collectorId ===
            null,
      );

    if (
      unmatchedShifts.length >
      0
    ) {
      return {
        status:
          "error",

        message:
          `${unmatchedShifts.length} shift${unmatchedShifts.length === 1 ? "" : "s"} still need worker matching. Preview the schedule again after resolving them.`,
      };
    }

    if (
      matchedShifts.length ===
      0
    ) {
      return {
        status:
          "error",

        message:
          "No matched shifts are available to import.",
      };
    }

    const sortedDates =
      matchedShifts
        .map(
          (
            shift,
          ) =>
            shift.shiftDate,
        )
        .sort();

    const firstDate =
      sortedDates[0];

    const lastDate =
      sortedDates[
        sortedDates.length -
          1
      ];

    if (
      !firstDate ||
      !lastDate
    ) {
      return {
        status:
          "error",

        message:
          "HIVE could not determine the schedule date range.",
      };
    }

    const periodStart =
      parseDateOnly(
        firstDate,
      );

    const periodEnd =
      parseDateOnly(
        lastDate,
      );

    /*
     * Validate that every collector ID still
     * exists before writing anything.
     */

    const collectorIds =
      Array.from(
        new Set(
          matchedShifts
            .map(
              (
                shift,
              ) =>
                shift.collectorId,
            )
            .filter(
              (
                id,
              ): id is number =>
                typeof id ===
                "number",
            ),
        ),
      );

    const validCollectors =
      await prisma.collector.findMany({
        where: {
          id: {
            in:
              collectorIds,
          },

          active:
            true,
        },

        select: {
          id:
            true,
        },
      });

    const validCollectorIds =
      new Set(
        validCollectors.map(
          (
            collector,
          ) =>
            collector.id,
        ),
      );

    const missingCollector =
      collectorIds.find(
        (
          id,
        ) =>
          !validCollectorIds.has(
            id,
          ),
      );

    if (
      missingCollector !==
      undefined
    ) {
      return {
        status:
          "error",

        message:
          "A worker changed after the preview was created. Please preview the schedule again before importing.",
      };
    }

    await prisma.$transaction(
      async (
        tx,
      ) => {
        /*
         * If this same downloaded schedule
         * file for the same range was already
         * imported, replace that import.
         *
         * ScheduledShift rows cascade-delete.
         */

        await tx.scheduleImport.deleteMany({
          where: {
            fileName,

            periodStart,

            periodEnd,
          },
        });

        await tx.scheduleImport.create({
          data: {
            fileName,

            periodStart,

            periodEnd,

            shifts: {
              create:
                matchedShifts.map(
                  (
                    shift,
                  ) => ({
                    collectorId:
                      shift.collectorId as number,

                    employeeName:
                      shift.employeeName,

                    primaryJob:
                      shift.primaryJob ||
                      null,

                    shiftDate:
                      parseDateOnly(
                        shift.shiftDate,
                      ),

                    startTime:
                      shift.startTime,

                    endTime:
                      shift.endTime,
                  }),
                ),
            },
          },
        });
      },
    );

    revalidatePath(
      "/settings/weekly-schedule",
    );

    return {
      status:
        "success",

      message:
        `${matchedShifts.length} scheduled shift${matchedShifts.length === 1 ? "" : "s"} imported successfully.`,

      importedShifts:
        matchedShifts.length,
    };
  } catch (
    error
  ) {
    console.error(
      "Weekly schedule import failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "HIVE could not save the schedule. No partial import was kept.",
    };
  }
}