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
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: unknown) {
  return normalizeText(value)
    .toLowerCase();
}

function formatDateParts(
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

function parseExcelDate(
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
      .slice(0, 10);
  }

  if (
    typeof value ===
    "number"
  ) {
    const parsed =
      XLSX.SSF.parse_date_code(
        value,
      );

    if (parsed) {
      return [
        String(
          parsed.y,
        ).padStart(
          4,
          "0",
        ),

        String(
          parsed.m,
        ).padStart(
          2,
          "0",
        ),

        String(
          parsed.d,
        ).padStart(
          2,
          "0",
        ),
      ].join("-");
    }
  }

  const text =
    normalizeText(
      value,
    );

  const qlikDate =
    text.match(
      /Calendar\.Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
    );

  if (qlikDate) {
    const [
      ,
      month,
      day,
      year,
    ] = qlikDate;

    return formatDateParts(
      month,
      day,
      year,
    );
  }

  const anyDate =
    text.match(
      /(?:^|\D)(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\D|$)/,
    );

  if (anyDate) {
    const [
      ,
      month,
      day,
      year,
    ] = anyDate;

    return formatDateParts(
      month,
      day,
      year,
    );
  }

  return null;
}

function parseCenterName(
  value: unknown,
): string | null {
  const text =
    normalizeText(
      value,
    );

  const selectionMatch =
    text.match(
      /Centers\.CENTER_NAME:\s*([^|]+)/i,
    );

  if (selectionMatch) {
    return (
      selectionMatch[1]
        ?.trim() ??
      null
    );
  }

  const directMatch =
    text.match(
      /\bRiviera Beach\s*115\b/i,
    );

  return directMatch
    ? directMatch[0]
        .replace(
          /\s+/g,
          " ",
        )
        .trim()
    : null;
}

function toNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  /*
   * XLSX gives us Excel numeric
   * values directly when raw:true.
   *
   * This includes:
   * - ordinary numbers
   * - percentage fractions
   * - Excel duration fractions
   */
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : null;
  }

  /*
   * Some Excel time cells may arrive
   * as Date objects because the
   * workbook is opened with
   * cellDates:true.
   *
   * For a time-only cell, convert the
   * UTC clock portion to minutes.
   */
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime(),
    )
  ) {
    return (
      value.getUTCHours() *
        60 +
      value.getUTCMinutes() +
      value.getUTCSeconds() /
        60 +
      value.getUTCMilliseconds() /
        60000
    );
  }

  const original =
    normalizeText(
      value,
    );

  /*
   * Handle time strings such as:
   *
   * 16:25.498
   * 57:59.261
   * 1:35:58.476
   *
   * These represent elapsed time,
   * not a time of day.
   */
  const timeParts =
    original.split(":");

  if (
    timeParts.length === 2 ||
    timeParts.length === 3
  ) {
    const numericParts =
      timeParts.map(
        (part) =>
          Number(part),
      );

    if (
      numericParts.every(
        Number.isFinite,
      )
    ) {
      if (
        numericParts.length ===
        2
      ) {
        const [
          minutes,
          seconds,
        ] =
          numericParts;

        return (
          minutes +
          seconds / 60
        );
      }

      const [
        hours,
        minutes,
        seconds,
      ] =
        numericParts;

      return (
        hours * 60 +
        minutes +
        seconds / 60
      );
    }
  }

  const text =
    original
      .replace(
        /,/g,
        "",
      )
      .replace(
        /%$/,
        "",
      );

  const numeric =
    Number(
      text,
    );

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return null;
  }

  return numeric;
}

/*
 * ==========================================
 * METRIC-SPECIFIC NORMALIZATION
 * ==========================================
 *
 * HIVE percentages are stored on a 0-100
 * scale.
 *
 * Excel percentage cells are normally
 * exported as decimal fractions.
 *
 * Example:
 *
 * 0.963 -> 96.3
 *
 * Excel duration cells are normally stored
 * as fractions of a 24-hour day.
 *
 * Example:
 *
 * 16 minutes 25 seconds
 * ≈ 0.0114 Excel days
 *
 * HIVE stores the Return Check-In ->
 * Phlebotomy comparison metric in minutes.
 */

function normalizeMetricValue(
  sourceHeader: string,
  value: number | null,
): number | null {
  if (
    value === null
  ) {
    return null;
  }

  /*
   * Theoretical Yield %
   */
  if (
    sourceHeader ===
      "% Theoretical Yield" &&
    Math.abs(
      value,
    ) <= 1
  ) {
    return value * 100;
  }

  /*
   * Total Applicant Donor %
   */
  if (
    sourceHeader ===
      "Total Applicant Donor %" &&
    Math.abs(
      value,
    ) <= 1
  ) {
    return value * 100;
  }

  /*
   * Return Check-In -> Phlebotomy
   *
   * If the raw value is <= 1 it came
   * through as an Excel fraction of a
   * day, so:
   *
   * days * 24 * 60 = minutes
   *
   * If it is already > 1, toNumber()
   * has most likely already converted
   * a Date/time string to minutes.
   */
  if (
    sourceHeader ===
      "Return Check in to Phleb Time"
  ) {
    if (
      Math.abs(
        value,
      ) <= 1
    ) {
      return (
        value *
        24 *
        60
      );
    }

    return value;
  }

  return value;
}

export function parseComparisonMetricWorkbook(
  buffer: Buffer,
): ParsedComparisonMetricWorkbook {
  const workbook =
    XLSX.read(
      buffer,
      {
        type: "buffer",

        /*
         * Preserve the existing behavior.
         * The parser above can handle
         * numeric or Date-based time cells.
         */
        cellDates: true,
      },
    );

  const firstSheetName =
    workbook
      .SheetNames[0];

  if (
    !firstSheetName
  ) {
    throw new Error(
      "Workbook contains no sheets.",
    );
  }

  const sheet =
    workbook.Sheets[
      firstSheetName
    ];

  const rows =
    XLSX.utils.sheet_to_json<
      unknown[]
    >(
      sheet,
      {
        header: 1,
        raw: true,
        defval: null,
      },
    );

  if (
    rows.length === 0
  ) {
    throw new Error(
      "Workbook is empty.",
    );
  }

  let centerName:
    | string
    | null = null;

  let operationalDate:
    | string
    | null = null;

  let headerRowIndex =
    -1;

  let headerRow:
    unknown[] = [];

  /*
   * ==========================================
   * FIND HEADER / CENTER / DATE
   * ==========================================
   */

  for (
    let rowIndex = 0;
    rowIndex <
    Math.min(
      rows.length,
      30,
    );
    rowIndex += 1
  ) {
    const row =
      rows[rowIndex] ??
      [];

    for (
      let columnIndex = 0;
      columnIndex <
      row.length;
      columnIndex += 1
    ) {
      const value =
        row[
          columnIndex
        ];

      if (
        !centerName
      ) {
        centerName =
          parseCenterName(
            value,
          );
      }

      if (
        !operationalDate
      ) {
        operationalDate =
          parseExcelDate(
            value,
          );
      }
    }

    const normalized =
      row.map(
        normalizeHeader,
      );

    if (
      normalized.indexOf(
        "gross procedures",
      ) >= 0 &&
      normalized.indexOf(
        "gross liters",
      ) >= 0
    ) {
      headerRowIndex =
        rowIndex;

      headerRow =
        row;

      break;
    }
  }

  if (
    headerRowIndex < 0
  ) {
    throw new Error(
      "Could not identify the Ops Stat metric header row.",
    );
  }

  if (
    !operationalDate
  ) {
    throw new Error(
      "Could not determine the operational date from this export.",
    );
  }

  /*
   * ==========================================
   * FIND RIVIERA BEACH DATA ROW
   * ==========================================
   */

  let dataRow:
    | unknown[]
    | null = null;

  /*
   * First preference:
   * explicit Riviera Beach 115 row.
   */

  for (
    let rowIndex =
      headerRowIndex + 1;
    rowIndex <
    rows.length;
    rowIndex += 1
  ) {
    const row =
      rows[rowIndex] ??
      [];

    const firstCell =
      normalizeText(
        row[0],
      );

    if (
      /Riviera Beach\s*115/i.test(
        firstCell,
      )
    ) {
      dataRow =
        row;

      centerName =
        "Riviera Beach 115";

      break;
    }
  }

  /*
   * Second preference:
   * row containing the selected date.
   */

  if (
    !dataRow
  ) {
    for (
      let rowIndex =
        headerRowIndex + 1;
      rowIndex <
      rows.length;
      rowIndex += 1
    ) {
      const row =
        rows[rowIndex] ??
        [];

      if (
        row.some(
          (value) =>
            parseExcelDate(
              value,
            ) ===
            operationalDate,
        )
      ) {
        dataRow =
          row;

        break;
      }
    }
  }

  /*
   * Final fallback:
   * Total row.
   */

  if (
    !dataRow
  ) {
    for (
      let rowIndex =
        headerRowIndex + 1;
      rowIndex <
      rows.length;
      rowIndex += 1
    ) {
      const row =
        rows[rowIndex] ??
        [];

      if (
        normalizeText(
          row[0],
        ).toLowerCase() ===
        "total"
      ) {
        dataRow =
          row;

        break;
      }
    }
  }

  if (
    !dataRow
  ) {
    throw new Error(
      "Could not identify the Riviera Beach daily data row.",
    );
  }

  /*
   * ==========================================
   * MAP REQUIRED METRICS
   * ==========================================
   */

  const metrics:
    ParsedComparisonMetric[] =
    [];

  const ignoredHeaders:
    string[] =
    [];

  for (
    let columnIndex = 0;
    columnIndex <
    headerRow.length;
    columnIndex += 1
  ) {
    const rawHeader =
      normalizeText(
        headerRow[
          columnIndex
        ],
      );

    if (
      !rawHeader
    ) {
      continue;
    }

    const normalizedHeader =
      normalizeHeader(
        rawHeader,
      );

    const mapping =
      comparisonMetricImportMappings.find(
        (
          candidate,
        ) =>
          candidate.active &&
          candidate.sourceHeader
            .toLowerCase() ===
            normalizedHeader,
      );

    if (
      !mapping
    ) {
      ignoredHeaders.push(
        rawHeader,
      );

      continue;
    }

    const rawValue =
      toNumber(
        dataRow[
          columnIndex
        ],
      );

    metrics.push({
      sourceHeader:
        mapping.sourceHeader,

      metricKey:
        mapping.metricKey,

      value:
        normalizeMetricValue(
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