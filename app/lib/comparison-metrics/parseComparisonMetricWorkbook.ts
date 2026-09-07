import * as XLSX from "xlsx";

import {
  comparisonMetricImportMappings,
} from "@/app/lib/comparison-metrics/importMapping";

export type ParsedComparisonMetric = {
  sourceHeader: string;
  metricKey: string;
  value: number | null;
};

export type ParsedComparisonMetricWorkbook = {
  centerName: string | null;
  operationalDate: string | null;
  metrics: ParsedComparisonMetric[];
  ignoredHeaders: string[];
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function formatDateParts(month: string, day: string, year: string) {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseExcelDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return [
        String(parsed.y).padStart(4, "0"),
        String(parsed.m).padStart(2, "0"),
        String(parsed.d).padStart(2, "0"),
      ].join("-");
    }
  }

  const text = normalizeText(value);

  const qlikDate = text.match(
    /Calendar\.Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
  );

  if (qlikDate) {
    const [, month, day, year] = qlikDate;
    return formatDateParts(month, day, year);
  }

  const anyDate = text.match(
    /(?:^|\D)(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\D|$)/,
  );

  if (anyDate) {
    const [, month, day, year] = anyDate;
    return formatDateParts(month, day, year);
  }

  return null;
}

function parseCenterName(value: unknown): string | null {
  const text = normalizeText(value);

  const selectionMatch = text.match(
    /Centers\.CENTER_NAME:\s*([^|]+)/i,
  );

  if (selectionMatch) {
    return selectionMatch[1]?.trim() ?? null;
  }

  const directMatch = text.match(/\bRiviera Beach\s*115\b/i);

  return directMatch
    ? directMatch[0].replace(/\s+/g, " ").trim()
    : null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const original = normalizeText(value);
  const text = original.replace(/,/g, "").replace(/%$/, "");
  const numeric = Number(text);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

/*
 * HIVE percentage metrics are stored/displayed on a 0–100 scale.
 * Qlik exports percentage-formatted Excel cells as decimal fractions.
 *
 * Example:
 *   0.9846317628432604 -> 98.46317628432604
 */
function normalizeMetricValue(
  sourceHeader: string,
  value: number | null,
): number | null {
  if (value === null) return null;

  if (
    sourceHeader === "% Theoretical Yield" &&
    Math.abs(value) <= 1
  ) {
    return value * 100;
  }

  return value;
}

export function parseComparisonMetricWorkbook(
  buffer: Buffer,
): ParsedComparisonMetricWorkbook {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Workbook contains no sheets.");
  }

  const sheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  if (rows.length === 0) {
    throw new Error("Workbook is empty.");
  }

  let centerName: string | null = null;
  let operationalDate: string | null = null;
  let headerRowIndex = -1;
  let headerRow: unknown[] = [];

  for (
    let rowIndex = 0;
    rowIndex < Math.min(rows.length, 30);
    rowIndex += 1
  ) {
    const row = rows[rowIndex] ?? [];

    for (
      let columnIndex = 0;
      columnIndex < row.length;
      columnIndex += 1
    ) {
      const value = row[columnIndex];

      if (!centerName) {
        centerName = parseCenterName(value);
      }

      if (!operationalDate) {
        operationalDate = parseExcelDate(value);
      }
    }

    const normalized = row.map(normalizeHeader);

    if (
      normalized.indexOf("gross procedures") >= 0 &&
      normalized.indexOf("gross liters") >= 0
    ) {
      headerRowIndex = rowIndex;
      headerRow = row;
      break;
    }
  }

  if (headerRowIndex < 0) {
    throw new Error(
      "Could not identify the Ops Stat metric header row.",
    );
  }

  if (!operationalDate) {
    throw new Error(
      "Could not determine the operational date from this export.",
    );
  }

  let dataRow: unknown[] | null = null;

  for (
    let rowIndex = headerRowIndex + 1;
    rowIndex < rows.length;
    rowIndex += 1
  ) {
    const row = rows[rowIndex] ?? [];
    const firstCell = normalizeText(row[0]);

    if (/Riviera Beach\s*115/i.test(firstCell)) {
      dataRow = row;
      centerName = "Riviera Beach 115";
      break;
    }
  }

  if (!dataRow) {
    for (
      let rowIndex = headerRowIndex + 1;
      rowIndex < rows.length;
      rowIndex += 1
    ) {
      const row = rows[rowIndex] ?? [];

      if (
        row.some(
          (value) => parseExcelDate(value) === operationalDate,
        )
      ) {
        dataRow = row;
        break;
      }
    }
  }

  if (!dataRow) {
    for (
      let rowIndex = headerRowIndex + 1;
      rowIndex < rows.length;
      rowIndex += 1
    ) {
      const row = rows[rowIndex] ?? [];

      if (normalizeText(row[0]).toLowerCase() === "total") {
        dataRow = row;
        break;
      }
    }
  }

  if (!dataRow) {
    throw new Error(
      "Could not identify the Riviera Beach daily data row.",
    );
  }

  const metrics: ParsedComparisonMetric[] = [];
  const ignoredHeaders: string[] = [];

  for (
    let columnIndex = 0;
    columnIndex < headerRow.length;
    columnIndex += 1
  ) {
    const rawHeader = normalizeText(headerRow[columnIndex]);

    if (!rawHeader) continue;

    const normalizedHeader = normalizeHeader(rawHeader);

    const mapping = comparisonMetricImportMappings.find(
      (candidate) =>
        candidate.active &&
        candidate.sourceHeader.toLowerCase() === normalizedHeader,
    );

    if (!mapping) {
      ignoredHeaders.push(rawHeader);
      continue;
    }

    const rawValue = toNumber(dataRow[columnIndex]);

    metrics.push({
      sourceHeader: mapping.sourceHeader,
      metricKey: mapping.metricKey,
      value: normalizeMetricValue(
        mapping.sourceHeader,
        rawValue,
      ),
    });
  }

  return {
    centerName,
    operationalDate,
    metrics,
    ignoredHeaders,
  };
}
