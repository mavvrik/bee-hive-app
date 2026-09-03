import * as XLSX from "xlsx";

export const ARRIVAL_PATTERN_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type ArrivalPatternWeekday =
  (typeof ARRIVAL_PATTERN_WEEKDAYS)[number];

export type OperationalPatternRow = {
  dayOfWeek: number;
  weekday: ArrivalPatternWeekday;
  time: string;
  minuteOfDay: number;
  intervalMinutes: number;
  visits: number;
  units: number;
};

export type ArrivalPatternSectionTotals = Record<
  ArrivalPatternWeekday,
  number
>;

export type ArrivalPatternsMetadata = {
  periodStart: string | null;
  periodEnd: string | null;
  centerNumber: string | null;
  periodDetected: boolean;
  centerDetected: boolean;
};

export type ArrivalPatternsPreview = {
  sourceKey: "ARRIVAL_PRODUCTION_PATTERNS";
  sheetName: string;
  intervalMinutes: 30;
  rows: OperationalPatternRow[];
  visitTotals: ArrivalPatternSectionTotals;
  unitTotals: ArrivalPatternSectionTotals;
  populatedWeekdays: ArrivalPatternWeekday[];
  metadata: ArrivalPatternsMetadata;
  warnings: string[];
};

type Grid = unknown[][];

type ParsedSection = {
  values: Map<string, number>;
  totals: ArrivalPatternSectionTotals;
  warnings: string[];
};

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = asText(value).replace(/,/g, "");
  if (!text) return 0;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected a numeric value but found "${text}".`);
  }
  return parsed;
}

function normalizeTime(value: unknown): string {
  const text = asText(value);
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    throw new Error(`Invalid half-hour time value: "${text}".`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    (minute !== 0 && minute !== 30)
  ) {
    throw new Error(`Unsupported interval time: "${text}".`);
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function minuteOfDay(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function normalizeDateToIso(value: string): string | null {
  const match = value.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractMetadata(grids: Grid[]): ArrivalPatternsMetadata {
  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  let centerNumber: string | null = null;

  for (const grid of grids) {
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
      const row = grid[rowIndex] ?? [];

      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        const text = asText(row[colIndex]);
        if (!text) continue;

        if (!periodStart || !periodEnd) {
          const rangeMatch = text.match(
            /(?:donation\s+between\s+dates?|between\s+dates?|report\s+period|date\s+range)?\s*:?\s*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{4})\s+(?:and|to|through|-)\s+(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{4})/i,
          );

          if (rangeMatch) {
            periodStart = normalizeDateToIso(rangeMatch[1]);
            periodEnd = normalizeDateToIso(rangeMatch[2]);
          }
        }

        if (!centerNumber && /^center\s*(?:number|#)?\s*:?$/i.test(text)) {
          const sameRowNext = asText(row[colIndex + 1]);
          const nextRowSameColumn = asText(grid[rowIndex + 1]?.[colIndex]);
          const candidate = sameRowNext || nextRowSameColumn;

          if (/^[A-Za-z0-9-]{1,20}$/.test(candidate)) {
            centerNumber = candidate;
          }
        }

        if (!centerNumber) {
          const inlineCenter = text.match(/^center\s*(?:number|#)?\s*:?\s*([A-Za-z0-9-]+)$/i);
          if (inlineCenter?.[1]) centerNumber = inlineCenter[1];
        }
      }
    }
  }

  return {
    periodStart,
    periodEnd,
    centerNumber,
    periodDetected: Boolean(periodStart && periodEnd),
    centerDetected: Boolean(centerNumber),
  };
}

function findSectionRow(grid: Grid, sectionName: string): number {
  const target = sectionName.toLowerCase();

  for (let row = 0; row < grid.length; row += 1) {
    if (asText(grid[row]?.[0]).toLowerCase() === target) return row;
  }

  throw new Error(`Could not find the "${sectionName}" section in the workbook.`);
}

function emptyTotals(): ArrivalPatternSectionTotals {
  return {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };
}

function parseSection(
  grid: Grid,
  sectionName: "Visits" | "Units",
): ParsedSection {
  const sectionRow = findSectionRow(grid, sectionName);
  const headerRow = sectionRow + 1;
  const header = grid[headerRow] ?? [];

  if (asText(header[0]).toLowerCase() !== "time") {
    throw new Error(`${sectionName} section is missing the expected Time header.`);
  }

  ARRIVAL_PATTERN_WEEKDAYS.forEach((weekday, index) => {
    const actual = asText(header[index + 1]);
    if (actual !== weekday) {
      throw new Error(
        `${sectionName} section expected ${weekday} in column ${index + 2}, but found "${actual}".`,
      );
    }
  });

  const values = new Map<string, number>();
  const calculatedTotals = emptyTotals();
  const reportedTotals = emptyTotals();
  const warnings: string[] = [];
  let totalsRowFound = false;

  for (let row = headerRow + 1; row < grid.length; row += 1) {
    const firstCell = asText(grid[row]?.[0]);
    if (!firstCell) continue;

    if (firstCell.toLowerCase() === "totals") {
      ARRIVAL_PATTERN_WEEKDAYS.forEach((weekday, index) => {
        reportedTotals[weekday] = asNumber(grid[row]?.[index + 1]);
      });
      totalsRowFound = true;
      break;
    }

    const time = normalizeTime(firstCell);
    ARRIVAL_PATTERN_WEEKDAYS.forEach((weekday, index) => {
      const value = asNumber(grid[row]?.[index + 1]);
      values.set(`${index}:${time}`, value);
      calculatedTotals[weekday] += value;
    });
  }

  if (!totalsRowFound) {
    throw new Error(`${sectionName} section is missing its Totals row.`);
  }

  ARRIVAL_PATTERN_WEEKDAYS.forEach((weekday) => {
    const calculated = calculatedTotals[weekday];
    const reported = reportedTotals[weekday];

    if (calculated !== reported) {
      warnings.push(
        `${sectionName} total mismatch for ${weekday}: calculated ${calculated}, reported ${reported}.`,
      );
    }
  });

  return { values, totals: calculatedTotals, warnings };
}

function getSortedTimes(values: Map<string, number>): string[] {
  const times = new Set<string>();
  for (const key of values.keys()) {
    const separator = key.indexOf(":");
    times.add(key.slice(separator + 1));
  }
  return [...times].sort((a, b) => minuteOfDay(a) - minuteOfDay(b));
}

export function parseArrivalPatternsWorkbook(
  fileBytes: Uint8Array,
): ArrivalPatternsPreview {
  const workbook = XLSX.read(fileBytes, {
    type: "array",
    cellDates: false,
  });

  const gridsBySheet = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: true,
    }) as Grid;
    return { name, grid };
  });

  if (gridsBySheet.length === 0) {
    throw new Error("The workbook does not contain a worksheet.");
  }

  const patternSheet = gridsBySheet.find(({ grid }) => {
    try {
      findSectionRow(grid, "Visits");
      findSectionRow(grid, "Units");
      return true;
    } catch {
      return false;
    }
  });

  if (!patternSheet) {
    throw new Error(
      'This workbook does not contain the expected CSL scheduling pattern structure with both "Visits" and "Units" sections.',
    );
  }

  const visits = parseSection(patternSheet.grid, "Visits");
  const units = parseSection(patternSheet.grid, "Units");
  const times = getSortedTimes(visits.values);

  if (times.length === 0) {
    throw new Error("No half-hour interval rows were found.");
  }

  const rows: OperationalPatternRow[] = [];
  ARRIVAL_PATTERN_WEEKDAYS.forEach((weekday, dayOfWeek) => {
    for (const time of times) {
      rows.push({
        dayOfWeek,
        weekday,
        time,
        minuteOfDay: minuteOfDay(time),
        intervalMinutes: 30,
        visits: visits.values.get(`${dayOfWeek}:${time}`) ?? 0,
        units: units.values.get(`${dayOfWeek}:${time}`) ?? 0,
      });
    }
  });

  const populatedWeekdays = ARRIVAL_PATTERN_WEEKDAYS.filter(
    (weekday) => visits.totals[weekday] > 0 || units.totals[weekday] > 0,
  );

  const metadata = extractMetadata(gridsBySheet.map(({ grid }) => grid));
  const warnings = [...visits.warnings, ...units.warnings];

  if (!metadata.periodDetected) {
    warnings.push(
      "Report coverage dates were not embedded in this workbook. Confirm the start and end dates before importing.",
    );
  }

  if (!metadata.centerDetected) {
    warnings.push(
      "Center number was not embedded in this workbook. Confirm the center before importing.",
    );
  }

  return {
    sourceKey: "ARRIVAL_PRODUCTION_PATTERNS",
    sheetName: patternSheet.name,
    intervalMinutes: 30,
    rows,
    visitTotals: visits.totals,
    unitTotals: units.totals,
    populatedWeekdays: [...populatedWeekdays],
    metadata,
    warnings,
  };
}
