import type { MetricSource } from "@/app/generated/prisma/client";

export type KpiDefinition = {
  key: string;
  displayName: string;
  description: string;
  unit: string | null;
  decimalPlaces: number;
  publicSource: MetricSource;
  isVisible: boolean;
  displayOrder: number;
};

export const KPI_KEYS = {
  donorFrequency: "donor-frequency",
  theoreticalYield: "theoretical-yield",
  uniqueDonorCount: "unique-donor-count",
} as const;

export const DEFAULT_KPI_DEFINITIONS: KpiDefinition[] = [
  {
    key: KPI_KEYS.donorFrequency,
    displayName: "Donor Frequency",
    description:
      "Official donor-frequency value reported by CSL.",
    unit: null,
    decimalPlaces: 2,
    publicSource: "CSL",
    isVisible: true,
    displayOrder: 1,
  },
  {
    key: KPI_KEYS.theoreticalYield,
    displayName: "Theoretical Yield",
    description:
      "Official theoretical-yield percentage reported by CSL.",
    unit: "%",
    decimalPlaces: 1,
    publicSource: "CSL",
    isVisible: true,
    displayOrder: 2,
  },
  {
    key: KPI_KEYS.uniqueDonorCount,
    displayName: "Unique Donors",
    description:
      "Official unique-donor count reported by CSL.",
    unit: null,
    decimalPlaces: 0,
    publicSource: "CSL",
    isVisible: true,
    displayOrder: 3,
  },
];

export function getKpiDefinition(
  key: string,
): KpiDefinition | undefined {
  return DEFAULT_KPI_DEFINITIONS.find(
    (definition) => definition.key === key,
  );
}

export function formatKpiValue(
  value: number,
  decimalPlaces: number,
  unit: string | null,
): string {
  const formattedValue = value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    },
  );

  if (!unit) {
    return formattedValue;
  }

  if (unit === "%") {
    return `${formattedValue}%`;
  }

  return `${formattedValue} ${unit}`;
}