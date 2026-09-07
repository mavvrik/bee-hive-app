export type ComparisonMetricImportMapping = {
  sourceHeader: string;
  metricKey: string;
  active: boolean;
  sourcePriority: "OPS_STAT" | "LIVE_PRODUCTION" | "MANUAL";
};

export const comparisonMetricImportMappings: ComparisonMetricImportMapping[] = [
  {
    sourceHeader: "Gross Procedures",
    metricKey: "gross_procedures",
    active: true,
    sourcePriority: "OPS_STAT",
  },
  {
    sourceHeader: "Gross Liters",
    metricKey: "gross_liters",
    active: true,
    sourcePriority: "OPS_STAT",
  },
  {
    sourceHeader: "HPD",
    metricKey: "hpd",
    active: true,
    sourcePriority: "OPS_STAT",
  },
  {
    sourceHeader: "Gross Yield",
    metricKey: "gross_yield",
    active: true,
    sourcePriority: "OPS_STAT",
  },
  {
    sourceHeader: "% Theoretical Yield",
    metricKey: "theoretical_yield_percentage",
    active: true,
    sourcePriority: "OPS_STAT",
  },
];

/*
 * COMPARISON METRIC IMPORTER MAPPING REGISTRY
 *
 * Qlik column names map to EXISTING HIVE metric keys.
 *
 * Future Ops Stat fields can be enabled here without
 * rewriting the workbook parser or importer UI.
 *
 * Unknown/unneeded Qlik columns are ignored safely.
 */