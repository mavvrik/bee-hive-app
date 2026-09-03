import * as XLSX from "xlsx";

export type ParsedTimeOffRequest = {
  employeeId: string;
  sourceEmployeeName: string;
  normalizedEmployeeName: string;
  subtype: string | null;
  duration: number | null;
  startDate: string;
  endDate: string;
  comments: string | null;
};

export type TimeOffPreview = {
  sheetName: string;
  reportPeriodStart: string | null;
  reportPeriodEnd: string | null;
  executedAt: string | null;
  printedFor: string | null;
  requests: ParsedTimeOffRequest[];
  warnings: string[];
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function excelDateToIso(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;

    return `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(
      2,
      "0",
    )}-${String(parsed.d).padStart(2, "0")}`;
  }

  const text = clean(value);
  if (!text) return null;

  const match = text.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/,
  );

  if (match) {
    const year =
      match[3].length === 2 ? `20${match[3]}` : match[3];

    return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(
      2,
      "0",
    )}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function normalizePersonName(value: string) {
  const compact = value
    .replace(/\s+/g, " ")
    .replace(/[.]/g, "")
    .trim();

  if (!compact.includes(",")) {
    return compact.toLowerCase();
  }

  const [last, firstPart] = compact.split(",", 2);
  const firstTokens = firstPart.trim().split(" ").filter(Boolean);

  // Ignore a single middle initial for matching purposes.
  const first = firstTokens[0] ?? "";

  return `${first} ${last.trim()}`.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseReportPeriod(value: unknown) {
  const text = clean(value);
  const match = text.match(
    /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\s*-\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/,
  );

  if (!match) {
    return { start: null, end: null };
  }

  return {
    start: excelDateToIso(match[1]),
    end: excelDateToIso(match[2]),
  };
}

export async function parseTimeOffWorkbook(
  buffer: ArrayBuffer | Uint8Array,
): Promise<TimeOffPreview> {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const warnings: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });

    const headerRowIndex = rows.findIndex((row) =>
      row.some(
        (cell) =>
          clean(cell).toLowerCase() === "employee id",
      ),
    );

    if (headerRowIndex < 0) {
      continue;
    }

    const headers = rows[headerRowIndex].map((cell) => clean(cell));

    const indexOf = (header: string) =>
      headers.findIndex(
        (value) => value.toLowerCase() === header.toLowerCase(),
      );

    const employeeIdIndex = indexOf("Employee ID");
    const nameIndex = indexOf(
      "Time-off Request Creator Full Name",
    );
    const subtypeIndex = indexOf(
      "Time-off Request Subtype Name",
    );
    const durationIndex = indexOf(
      "Time-off Request Item Duration",
    );
    const startIndex = indexOf(
      "Time-off Request Item Start Date",
    );
    const endIndex = indexOf(
      "Time-off Request Item End Date",
    );
    const commentsIndex = indexOf(
      "Time-off Request Employee Comments & Notes",
    );

    if (
      employeeIdIndex < 0 ||
      nameIndex < 0 ||
      startIndex < 0 ||
      endIndex < 0
    ) {
      throw new Error(
        "The workbook contains a Time Off table, but required CSL columns are missing.",
      );
    }

    let reportPeriodStart: string | null = null;
    let reportPeriodEnd: string | null = null;
    let executedAt: string | null = null;
    let printedFor: string | null = null;

    for (const row of rows.slice(0, headerRowIndex)) {
      for (let index = 0; index < row.length; index += 1) {
        const label = clean(row[index]).toLowerCase();
        const next = row[index + 1];

        if (label === "time period :") {
          const period = parseReportPeriod(next);
          reportPeriodStart = period.start;
          reportPeriodEnd = period.end;
        }

        if (label === "executed on :") {
          executedAt = clean(next) || null;
        }

        if (label === "printed for :") {
          printedFor = clean(next) || null;
        }
      }
    }

    const requests: ParsedTimeOffRequest[] = [];

    for (const row of rows.slice(headerRowIndex + 1)) {
      const employeeId = clean(row[employeeIdIndex]);
      const sourceEmployeeName = clean(row[nameIndex]);

      if (!employeeId && !sourceEmployeeName) {
        continue;
      }

      const startDate = excelDateToIso(row[startIndex]);
      const endDate = excelDateToIso(row[endIndex]);

      if (!sourceEmployeeName || !startDate || !endDate) {
        warnings.push(
          `Skipped an incomplete row for employee ID ${employeeId || "unknown"}.`,
        );
        continue;
      }

      if (endDate < startDate) {
        warnings.push(
          `${sourceEmployeeName}: end date is before start date. Row was skipped.`,
        );
        continue;
      }

      const durationValue =
        durationIndex >= 0 ? row[durationIndex] : null;

      const duration =
        typeof durationValue === "number"
          ? durationValue
          : clean(durationValue)
            ? Number(durationValue)
            : null;

      requests.push({
        employeeId,
        sourceEmployeeName,
        normalizedEmployeeName:
          normalizePersonName(sourceEmployeeName),
        subtype:
          subtypeIndex >= 0
            ? clean(row[subtypeIndex]) || null
            : null,
        duration:
          duration !== null && Number.isFinite(duration)
            ? duration
            : null,
        startDate,
        endDate,
        comments:
          commentsIndex >= 0
            ? clean(row[commentsIndex]) || null
            : null,
      });
    }

    if (!reportPeriodStart || !reportPeriodEnd) {
      warnings.push(
        "The report period could not be detected from the workbook header.",
      );
    }

    const actualEnd = requests
      .map((request) => request.endDate)
      .sort()
      .at(-1);

    if (
      actualEnd &&
      reportPeriodEnd &&
      actualEnd > reportPeriodEnd
    ) {
      warnings.push(
        `At least one request extends beyond the report period (${reportPeriodEnd}). HIVE will preserve the request's actual end date.`,
      );
    }

    return {
      sheetName,
      reportPeriodStart,
      reportPeriodEnd,
      executedAt,
      printedFor,
      requests,
      warnings,
    };
  }

  throw new Error(
    "HIVE could not find the CSL Time Off Requests table in this workbook.",
  );
}
