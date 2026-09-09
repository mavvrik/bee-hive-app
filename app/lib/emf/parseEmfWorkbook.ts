import ExcelJS from "exceljs";

import {
  matchWorkerName,
  normalizeWorkerName,
  type MatchableWorker,
} from "@/app/lib/workers/workerNameMatcher";

export type EmfImportStatus =
  | "READY"
  | "SHARED"
  | "NEEDS_MATCHING"
  | "IGNORED";

export type ParsedEmfSourceRow = {
  rowNumber: number;
  sourceEmployeeName: string;
  emfCount: number;

  matchedWorkers: Array<{
    id: number;
    name: string;
  }>;

  unresolvedNames: string[];

  status: EmfImportStatus;
  message: string;
};

export type ParsedEmfWorkerTotal = {
  collectorId: number;
  workerName: string;
  emfCount: number;
};

export type ParsedEmfWorkbook = {
  rows: ParsedEmfSourceRow[];
  workerTotals: ParsedEmfWorkerTotal[];

  readySourceCount: number;
  sharedSourceCount: number;
  needsMatchingCount: number;
  ignoredCount: number;

  sourceEmfTotal: number;
  attributedEmfTotal: number;

  detectedPeriodStart: string | null;
  detectedPeriodEnd: string | null;

  dateDetectionStatus:
    | "DETECTED"
    | "NOT_FOUND";
};

type Worker = MatchableWorker & {
  active?: boolean;
};

/*
 * ==========================================
 * GROUP-ONLY LABELS
 * ==========================================
 *
 * These never contribute to individual
 * Worker Bee EMF totals.
 */

const IGNORED_GROUP_LABELS =
  new Set([
    "management",
    "leadership",
    "center management",
    "reception staff",
    "center janitorial employee",
    "janitorial employee",
    "janitorial staff",
    "janitorial",
  ]);

/*
 * ==========================================
 * CONFIRMED / OBSERVED EMF ALIASES
 * ==========================================
 */

const EMF_ALIAS_OVERRIDES:
  Record<string, string> = {
  /*
   * Ashley Marquez
   */
  "a marquez":
    "Ashley",

  "marquez a":
    "Ashley",

  "marques a":
    "Ashley",

  /*
   * Amando Steer
   */
  "a steer":
    "Amando",

  "steer a":
    "Amando",

  /*
   * Demetrius Anderson
   */
  "anderson d":
    "Demetrius",

  "d anderson":
    "Demetrius",

  /*
   * Craig Gay
   */
  "c gay":
    "Craig Gay",

  "gay c":
    "Craig Gay",

  /*
   * Cheryl Mckever
   */
  "c mckever":
    "Cheryl",

  "cmckever":
    "Cheryl",

  "mckever c":
    "Cheryl",

  /*
   * Kelly Callahan
   */
  "callahan k":
    "Kelly Callahan",

  "k callahan":
    "Kelly Callahan",

  /*
   * Daria Coleman
   *
   * CSL report also contains Coleman.F.
   * User confirmed this should be treated
   * as D. Coleman.
   */
  "coleman d":
    "Daria",

  "d coleman":
    "Daria",

  "coleman f":
    "Daria",

  "f coleman":
    "Daria",

  /*
   * Deirdre Destefano
   */
  "d destafano":
    "Deirdre",

  "d destefano":
    "Deirdre",

  "destafano d":
    "Deirdre",

  "destefano d":
    "Deirdre",

  /*
   * Emilio Leon Cruz
   */
  "e cruz":
    "Emilio leon",

  "e leon cruz":
    "Emilio leon",

  "leon cruz e":
    "Emilio leon",

  "leon cruz":
    "Emilio leon",

  /*
   * Frankie Elien
   */
  "elein f":
    "Frankie",

  "elien f":
    "Frankie",

  /*
   * Gladys Penaloza
   */
  "g penaloza":
    "Gladys",

  "penaloza g":
    "Gladys",

  "penazola g":
    "Gladys",

  /*
   * Shantoria Shannon
   */
  "s shannon":
    "Shantoria",

  "shannon s":
    "Shantoria",

  /*
   * Rhonda Garner
   */
  "garner r":
    "Rhonda",

  "r garner":
    "Rhonda",

  /*
   * Elisabeta Hayes
   */
  "hayes e":
    "Elisabeta",

  "e hayes":
    "Elisabeta",

  /*
   * Judelande Saint-Louis
   *
   * HIVE stores this Worker Bee as
   * "Judelande".
   */
  "j saint louis":
    "Judelande",

  "saint louis j":
    "Judelande",

  "saint louis":
    "Judelande",

  /*
   * Cicley Bristol-Jones
   *
   * HIVE stores this Worker Bee as
   * "Cicley".
   */
  "jones c":
    "Cicley",

  "jones bristol c":
    "Cicley",

  "bristol jones c":
    "Cicley",

  /*
   * Michelle Jones
   */
  "jones m":
    "Michelle",

  "m jones":
    "Michelle",

  /*
   * Shacara Lyman
   */
  "lyman s":
    "Shacara",

  "s lyman":
    "Shacara",

  /*
   * Sanaa Mills
   */
  "mills s":
    "Sanaa",

  "s mills":
    "Sanaa",

  /*
   * Nellie Robertson
   */
  "n robertson":
    "Nellie",

  "robertson n":
    "Nellie",

  /*
   * Roni Thompson-Steward
   */
  "r thompon steward":
    "Roni",

  "r thompson steward":
    "Roni",

  "thompson sstewart r":
    "Roni",

  "thompson steward r":
    "Roni",

  /*
   * Sergio Romero
   */
  "romero s":
    "Sergio",

  "s romero":
    "Sergio",

  /*
   * Shanya Wilson
   */
  "wilson s":
    "Shanya",

  "s wilson":
    "Shanya",

  /*
   * Valarie Wright
   *
   * CSL report contains A. Wright.
   * User confirmed A. Wright should be
   * interpreted as V. Wright.
   */
  "a wright":
    "Valarie",

  "wright a":
    "Valarie",

  "v wright":
    "Valarie",

  "wright v":
    "Valarie",

  /*
   * Joanne Charles-Clarke
   */
  "charles clarke":
    "Joanne",

  /*
   * Ke'Yala O'Neal / Key
   */
  "k oneal":
    "Key",

  "oneal k":
    "Key",

  "keyala oneal":
    "Key",

  "keyala o neal":
    "Key",
};

/*
 * ==========================================
 * BASIC NORMALIZATION
 * ==========================================
 */

function normalizeLoose(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /['’]/g,
      "",
    )
    .replace(
      /[-_.]+/g,
      " ",
    )
    .replace(
      /,/g,
      " ",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

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
    typeof value === "string"
  ) {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "object"
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
      return candidate.text.trim();
    }

    if (
      candidate.result !== null &&
      candidate.result !== undefined
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
          (part) =>
            part.text ?? "",
        )
        .join("")
        .trim();
    }
  }

  return String(value).trim();
}

function cellToInteger(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return Math.max(
      0,
      Math.round(value),
    );
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    const candidate =
      value as {
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
        Math.round(
          candidate.result,
        ),
      );
    }
  }

  const text =
    cellToString(value)
      .replace(/,/g, "")
      .trim();

  if (!text) {
    return null;
  }

  const number =
    Number(text);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.round(number),
  );
}

/*
 * ==========================================
 * REPORTING PERIOD
 * ==========================================
 */

function formatDate(
  date: Date,
) {
  return [
    String(
      date.getFullYear(),
    ).padStart(4, "0"),

    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),

    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

function parseDateText(
  text: string,
): string | null {
  const match =
    text.match(
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/,
    );

  if (!match) {
    return null;
  }

  const month =
    Number(match[1]);

  const day =
    Number(match[2]);

  const year =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day,
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return formatDate(
    date,
  );
}

function detectReportingPeriod(
  worksheet: ExcelJS.Worksheet,
) {
  /*
   * Only trust dates associated with explicit
   * report-period language.
   *
   * An isolated export/print timestamp must
   * NOT become the EMF reporting period.
   */

  const periodKeywords =
    /\b(reporting period|report period|date range|period start|period end|from|through|thru|between)\b/i;

  for (
    let rowNumber = 1;
    rowNumber <=
    Math.min(
      worksheet.rowCount,
      50,
    );
    rowNumber += 1
  ) {
    const row =
      worksheet.getRow(
        rowNumber,
      );

    const texts:
      string[] = [];

    row.eachCell(
      {
        includeEmpty: false,
      },
      (cell) => {
        const text =
          cellToString(
            cell.value,
          );

        if (text) {
          texts.push(
            text,
          );
        }
      },
    );

    const combined =
      texts.join(" ");

    if (
      !periodKeywords.test(
        combined,
      )
    ) {
      continue;
    }

    const matches =
      combined.match(
        /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/g,
      ) ?? [];

    const dates =
      matches
        .map(
          parseDateText,
        )
        .filter(
          (
            value,
          ): value is string =>
            value !== null,
        );

    if (
      dates.length >= 2
    ) {
      return {
        start:
          dates[0],

        end:
          dates[
            dates.length - 1
          ],
      };
    }
  }

  return {
    start: null,
    end: null,
  };
}

/*
 * ==========================================
 * GROUP HANDLING
 * ==========================================
 */

function isIgnoredGroup(
  value: string,
) {
  return IGNORED_GROUP_LABELS.has(
    normalizeLoose(
      value,
    ),
  );
}

/*
 * ==========================================
 * WORKER MATCHING
 * ==========================================
 */

function matchSinglePerson(
  sourceName: string,
  workers: Worker[],
) {
  let candidate =
    sourceName
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  /*
   * Ashley Lawrence is a known historical
   * employee, but she does not currently
   * have a Collector record in HIVE.
   *
   * Never let unique-first-name fallback
   * assign her historical EMFs to Ashley
   * Marquez.
   */
  const originalNormalized =
    normalizeLoose(
      candidate,
    );

  if (
    originalNormalized ===
      "a lawrence" ||
    originalNormalized ===
      "lawrence a" ||
    originalNormalized ===
      "ashley lawrence"
  ) {
    return {
      worker: null,
    };
  }

  /*
   * Handle report variation:
   *
   * DeStefano.D
   * Coleman.F
   *
   * Normalize to:
   *
   * DeStefano, D
   * Coleman, F
   */

  const dottedLastInitial =
    /^([A-Za-z][A-Za-z'’ -]+)\.\s*([A-Za-z])$/i.exec(
      candidate,
    );

  if (
    dottedLastInitial
  ) {
    candidate =
      `${dottedLastInitial[1]}, ${dottedLastInitial[2]}`;
  }

  const normalized =
    normalizeLoose(
      candidate,
    );

  const alias =
    EMF_ALIAS_OVERRIDES[
      normalized
    ];

  if (alias) {
    candidate =
      alias;
  }

  const match =
    matchWorkerName(
      candidate,
      workers,
      {
        allowUniqueFirstName:
          true,
      },
    );

  if (
    match.worker
  ) {
    return {
      worker:
        match.worker,
    };
  }

  /*
   * Safe surname-only fallback.
   *
   * Example:
   *
   * Charles-Clarke
   *
   * Only resolve when exactly one Worker Bee
   * has that surname.
   */

  const normalizedCandidate =
    normalizeWorkerName(
      candidate,
    );

  if (
    normalizedCandidate &&
    !normalizedCandidate.includes(
      " ",
    )
  ) {
    const surnameMatches =
      workers.filter(
        (worker) => {
          const workerName =
            normalizeWorkerName(
              worker.name,
            );

          const pieces =
            workerName.split(
              " ",
            );

          return (
            pieces[
              pieces.length - 1
            ] ===
            normalizedCandidate
          );
        },
      );

    if (
      surnameMatches.length ===
      1
    ) {
      return {
        worker:
          surnameMatches[0],
      };
    }
  }

  return {
    worker: null,
  };
}

/*
 * ==========================================
 * SHARED EMPLOYEE SPLITTING
 * ==========================================
 */

function splitSharedNames(
  sourceName: string,
) {
  const cleaned =
    sourceName
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  /*
   * Explicit separators:
   *
   * Wright, V / Coleman, D / Charles-Clarke
   */

  if (
    cleaned.includes("/") ||
    cleaned.includes("&") ||
    cleaned.includes("+")
  ) {
    return cleaned
      .split(
        /[\/&+]+/,
      )
      .map(
        (part) =>
          part.trim(),
      )
      .filter(Boolean);
  }

  /*
   * Initial + surname pairs:
   *
   * C. Gay, A. Wright
   * G. Penaloza, S. Shannon
   */

  const initialSurnamePattern =
    /([A-Za-z]\s*\.?\s+[A-Za-z][A-Za-z'’\-]*(?:\s+[A-Za-z][A-Za-z'’\-]*)*)/g;

  const initialSurnameMatches =
    Array.from(
      cleaned.matchAll(
        initialSurnamePattern,
      ),
    )
      .map(
        (match) =>
          match[1]?.trim(),
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

  if (
    initialSurnameMatches.length >=
    2
  ) {
    return initialSurnameMatches;
  }

  /*
   * Lastname, Initial pairs:
   *
   * Gay, C Marquez, A
   * Elien, F Lawrence, A
   * Wilson, S Leon-Cruz, E
   */

  const lastInitialPattern =
    /([A-Za-z][A-Za-z'’\-]*(?:\s+[A-Za-z][A-Za-z'’\-]*)*)\s*,\s*([A-Za-z])\.?/g;

  const pairMatches:
    string[] = [];

  let pairMatch:
    RegExpExecArray | null;

  while (
    (
      pairMatch =
        lastInitialPattern.exec(
          cleaned,
        )
    ) !== null
  ) {
    pairMatches.push(
      `${pairMatch[1]}, ${pairMatch[2]}`,
    );
  }

  if (
    pairMatches.length >=
    2
  ) {
    return pairMatches;
  }

  /*
   * Otherwise it is one employee.
   */

  return [
    cleaned,
  ];
}

/*
 * ==========================================
 * TOTAL ROW DETECTION
 * ==========================================
 */

function isEmployeeTotalRow(
  row: ExcelJS.Row,
) {
  const label =
    normalizeLoose(
      cellToString(
        row.getCell(
          5,
        ).value,
      ),
    );

  if (
    label.includes(
      "total employee errors",
    )
  ) {
    return true;
  }

  /*
   * Safe fallback in case CSL shifts the
   * total label to another column.
   */

  let found =
    false;

  row.eachCell(
    {
      includeEmpty: false,
    },
    (cell) => {
      const text =
        normalizeLoose(
          cellToString(
            cell.value,
          ),
        );

      if (
        text.includes(
          "total employee errors",
        )
      ) {
        found =
          true;
      }
    },
  );

  return found;
}

function getEmployeeTotal(
  row: ExcelJS.Row,
) {
  /*
   * Confirmed workbook layout:
   *
   * Column 11 and column 12 both contain the
   * employee total.
   */

  const column11 =
    cellToInteger(
      row.getCell(
        11,
      ).value,
    );

  if (
    column11 !== null
  ) {
    return column11;
  }

  const column12 =
    cellToInteger(
      row.getCell(
        12,
      ).value,
    );

  if (
    column12 !== null
  ) {
    return column12;
  }

  /*
   * Fallback: scan right-to-left for a numeric
   * value.
   */

  for (
    let column =
      Math.max(
        row.cellCount,
        16,
      );
    column >= 1;
    column -= 1
  ) {
    const count =
      cellToInteger(
        row.getCell(
          column,
        ).value,
      );

    if (
      count !== null
    ) {
      return count;
    }
  }

  return null;
}

/*
 * ==========================================
 * SOURCE ROW RESOLUTION
 * ==========================================
 */

function buildSourceRow(
  rowNumber: number,
  sourceEmployeeName: string,
  emfCount: number,
  workers: Worker[],
): ParsedEmfSourceRow {
  if (
    isIgnoredGroup(
      sourceEmployeeName,
    )
  ) {
    return {
      rowNumber,
      sourceEmployeeName,
      emfCount,

      matchedWorkers:
        [],

      unresolvedNames:
        [],

      status:
        "IGNORED",

      message:
        "Group-only EMF entry ignored for individual scoring.",
    };
  }

  const personNames =
    splitSharedNames(
      sourceEmployeeName,
    );

  const matchedWorkers:
    Array<{
      id: number;
      name: string;
    }> = [];

  const unresolvedNames:
    string[] = [];

  for (
    const personName of
    personNames
  ) {
    if (
      isIgnoredGroup(
        personName,
      )
    ) {
      continue;
    }

    const result =
      matchSinglePerson(
        personName,
        workers,
      );

    if (
      result.worker
    ) {
      if (
        !matchedWorkers.some(
          (worker) =>
            worker.id ===
            result.worker!.id,
        )
      ) {
        matchedWorkers.push({
          id:
            result.worker.id,

          name:
            result.worker.name,
        });
      }
    } else {
      unresolvedNames.push(
        personName,
      );
    }
  }

  /*
   * If any named person inside a shared EMF
   * cannot be resolved, do NOT partially
   * import the shared event.
   *
   * Preview it as NEEDS_MATCHING instead.
   */

  if (
    unresolvedNames.length >
    0
  ) {
    return {
      rowNumber,
      sourceEmployeeName,
      emfCount,
      matchedWorkers,
      unresolvedNames,

      status:
        "NEEDS_MATCHING",

      message:
        `Needs matching: ${unresolvedNames.join(
          ", ",
        )}`,
    };
  }

  if (
    matchedWorkers.length ===
    0
  ) {
    return {
      rowNumber,
      sourceEmployeeName,
      emfCount,

      matchedWorkers:
        [],

      unresolvedNames:
        [],

      status:
        "IGNORED",

      message:
        "No individual Worker Bees were attributable from this entry.",
    };
  }

  const shared =
    matchedWorkers.length >
    1;

  return {
    rowNumber,
    sourceEmployeeName,
    emfCount,
    matchedWorkers,

    unresolvedNames:
      [],

    status:
      shared
        ? "SHARED"
        : "READY",

    message:
      shared
        ? `Shared EMF will add ${emfCount} to each matched Worker Bee.`
        : "Ready to import.",
  };
}

/*
 * ==========================================
 * MAIN WORKBOOK PARSER
 * ==========================================
 */

export async function parseEmfWorkbook(
  buffer: Buffer,
  workers: Worker[],
): Promise<ParsedEmfWorkbook> {
  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.load(
    buffer as any,
  );

  const worksheet =
    workbook.worksheets[0];

  if (
    !worksheet
  ) {
    throw new Error(
      "The workbook does not contain a readable worksheet.",
    );
  }

  const detectedPeriod =
    detectReportingPeriod(
      worksheet,
    );

  const rows:
    ParsedEmfSourceRow[] =
    [];

  /*
   * ==========================================
   * STATEFUL CSL EMPLOYEE-BLOCK PARSER
   * ==========================================
   *
   * Confirmed structure:
   *
   * Column 2:
   *   employee or employee group
   *
   * Column 5:
   *   EMF detail / Total Employee Errors
   *
   * Column 11 / 12:
   *   count
   *
   * Example:
   *
   * Row 7:
   *   B = A. Marquez
   *   E = D23 ...
   *
   * Row 8:
   *   E = D28 ...
   *
   * Row 9:
   *   E = Total Employee Errors
   *   K = 3
   *
   * Therefore:
   *
   * A. Marquez = 3
   */

  let currentEmployeeName:
    string | null =
    null;

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
     * A populated Column B begins a new
     * employee/group block.
     */

    const columnTwo =
      cellToString(
        row.getCell(
          2,
        ).value,
      )
        .replace(
          /\s+/g,
          " ",
        )
        .trim();

    if (
      columnTwo
    ) {
      currentEmployeeName =
        columnTwo;
    }

    /*
     * Continue until the total row for the
     * current block is reached.
     */

    if (
      !isEmployeeTotalRow(
        row,
      )
    ) {
      continue;
    }

    const emfCount =
      getEmployeeTotal(
        row,
      );

    if (
      emfCount === null
    ) {
      rows.push({
        rowNumber,

        sourceEmployeeName:
          currentEmployeeName ??
          "Unknown employee",

        emfCount:
          0,

        matchedWorkers:
          [],

        unresolvedNames:
          currentEmployeeName
            ? [
                currentEmployeeName,
              ]
            : [
                "Unknown employee",
              ],

        status:
          "NEEDS_MATCHING",

        message:
          "HIVE found the employee block but could not read its Total Employee Errors count.",
      });

      currentEmployeeName =
        null;

      continue;
    }

    if (
      !currentEmployeeName
    ) {
      rows.push({
        rowNumber,

        sourceEmployeeName:
          "Unknown employee",

        emfCount,

        matchedWorkers:
          [],

        unresolvedNames:
          [
            "Unknown employee",
          ],

        status:
          "NEEDS_MATCHING",

        message:
          "HIVE found an employee total without a preceding employee name.",
      });

      continue;
    }

    rows.push(
      buildSourceRow(
        rowNumber,
        currentEmployeeName,
        emfCount,
        workers,
      ),
    );

    /*
     * The next Column B value starts the next
     * employee block.
     */

    currentEmployeeName =
      null;
  }

  if (
    rows.length ===
    0
  ) {
    throw new Error(
      "HIVE found no readable employee EMF blocks in this workbook.",
    );
  }

  /*
   * ==========================================
   * AGGREGATE WORKER TOTALS
   * ==========================================
   *
   * Shared EMFs intentionally count toward
   * every matched worker.
   */

  const totals =
    new Map<
      number,
      {
        workerName: string;
        emfCount: number;
      }
    >();

  for (
    const row of rows
  ) {
    if (
      row.status !==
        "READY" &&
      row.status !==
        "SHARED"
    ) {
      continue;
    }

    for (
      const worker of
      row.matchedWorkers
    ) {
      const current =
        totals.get(
          worker.id,
        ) ?? {
          workerName:
            worker.name,

          emfCount:
            0,
        };

      current.emfCount +=
        row.emfCount;

      totals.set(
        worker.id,
        current,
      );
    }
  }

  const workerTotals =
    Array.from(
      totals.entries(),
    )
      .map(
        ([
          collectorId,
          value,
        ]) => ({
          collectorId,

          workerName:
            value.workerName,

          emfCount:
            value.emfCount,
        }),
      )
      .sort(
        (a, b) =>
          b.emfCount -
            a.emfCount ||
          a.workerName.localeCompare(
            b.workerName,
          ),
      );

  /*
   * Source EMFs count every non-ignored source
   * employee block once.
   *
   * Attributed EMFs can exceed Source EMFs
   * because shared EMFs are counted against
   * each involved Worker Bee.
   */

  const sourceEmfTotal =
    rows
      .filter(
        (row) =>
          row.status !==
          "IGNORED",
      )
      .reduce(
        (
          total,
          row,
        ) =>
          total +
          row.emfCount,
        0,
      );

  const attributedEmfTotal =
    workerTotals.reduce(
      (
        total,
        worker,
      ) =>
        total +
        worker.emfCount,
      0,
    );

  return {
    rows,
    workerTotals,

    readySourceCount:
      rows.filter(
        (row) =>
          row.status ===
          "READY",
      ).length,

    sharedSourceCount:
      rows.filter(
        (row) =>
          row.status ===
          "SHARED",
      ).length,

    needsMatchingCount:
      rows.filter(
        (row) =>
          row.status ===
          "NEEDS_MATCHING",
      ).length,

    ignoredCount:
      rows.filter(
        (row) =>
          row.status ===
          "IGNORED",
      ).length,

    sourceEmfTotal,
    attributedEmfTotal,

    detectedPeriodStart:
      detectedPeriod.start,

    detectedPeriodEnd:
      detectedPeriod.end,

    dateDetectionStatus:
      detectedPeriod.start &&
      detectedPeriod.end
        ? "DETECTED"
        : "NOT_FOUND",
  };
}