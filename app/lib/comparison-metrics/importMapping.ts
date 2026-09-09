export type ComparisonMetricImportMapping = {
  sourceHeader: string;
  metricKey: string;
  active: boolean;
  sourcePriority:
    | "OPS_STAT"
    | "LIVE_PRODUCTION"
    | "MANUAL";
};

export const comparisonMetricImportMappings: ComparisonMetricImportMapping[] =
  [
    /*
     * ==========================================
     * HIVE / DAILY CENTER PRODUCTION
     * ==========================================
     *
     * These values are entered/updated live
     * during the operational day through
     * Daily Center Production.
     *
     * The next-day Ops Stat import is allowed
     * to reconcile/finalize the prior day's
     * authoritative production values.
     */

    {
      sourceHeader:
        "Gross Procedures",
      metricKey:
        "gross_procedures",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    {
      sourceHeader:
        "Gross Liters",
      metricKey:
        "gross_liters",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    /*
     * ==========================================
     * APPLICANT METRICS
     * ==========================================
     */

    {
      sourceHeader:
        "Total Applicant Donors",
      metricKey:
        "total_applicant_donors",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    {
      sourceHeader:
        "Total Applicant Donor %",
      metricKey:
        "total_applicant_donor_percentage",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    /*
     * ==========================================
     * PRODUCTIVITY
     * ==========================================
     */

    {
      sourceHeader:
        "HPD",
      metricKey:
        "hpd",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    /*
     * ==========================================
     * YIELD
     * ==========================================
     */

    {
      sourceHeader:
        "Gross Yield",
      metricKey:
        "gross_yield",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    {
      sourceHeader:
        "% Theoretical Yield",
      metricKey:
        "theoretical_yield_percentage",
      active: true,
      sourcePriority:
        "OPS_STAT",
    },

    /*
     * ==========================================
     * DONOR EXPERIENCE / PROCESSING TIME
     * ==========================================
     */

    {
  sourceHeader:
    "Return Check in to Phleb Time\n(Goal: 35 Minutes)",
  metricKey:
    "return_checkin_to_phlebotomy_time",
  active: true,
  sourcePriority:
    "OPS_STAT",
},
  ];

/*
 * ==============================================
 * COMPARISON METRIC IMPORTER MAPPING REGISTRY
 * ==============================================
 *
 * Qlik column names map to EXISTING HIVE
 * DashboardMetric keys.
 *
 * REQUIRED EXECUTIVE COMPARISON SET:
 *
 * 1. Gross Procedures
 * 2. Total Applicant Donors
 * 3. Total Applicant Donor %
 * 4. HPD
 * 5. Gross Liters
 * 6. Gross Yield
 * 7. Theoretical Yield %
 * 8. Return Check-In -> Phlebotomy
 *
 * Gross Procedures and Gross Liters have special
 * reconciliation behavior:
 *
 * During the operational day:
 *   Daily Center Production is authoritative.
 *
 * During the next-day Ops Stat import:
 *   The finalized report may reconcile the
 *   previous day's Daily Center Production
 *   record.
 *
 * Unknown/unneeded Ops Stat columns remain
 * ignored safely.
 */