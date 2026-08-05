import { prisma } from "@/lib/prisma";
import {
  KPI_KEYS,
  formatKpiValue,
} from "@/app/lib/kpiDefinitions";
import AdminShell from "../components/AdminShell";
import { updateHiveMetrics } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type LatestValues = {
  donorFrequency: number;
  theoreticalYield: number;
  uniqueDonorCount: number;
};

export default async function HiveSettingsPage() {
  const [settings, metrics] = await Promise.all([
    prisma.hiveSettings.findUnique({
      where: { id: 1 },
    }),
    prisma.dashboardMetric.findMany({
      where: {
        key: {
          in: [
            KPI_KEYS.donorFrequency,
            KPI_KEYS.theoreticalYield,
            KPI_KEYS.uniqueDonorCount,
          ],
        },
      },
      include: {
        readings: {
          where: {
            source: "CSL",
          },
          orderBy: {
            recordedAt: "desc",
          },
          take: 1,
        },
      },
    }),
  ]);

  if (!settings) {
    throw new Error(
      "Hive settings record 1 was not found.",
    );
  }

  const latestValues: LatestValues = {
    donorFrequency: 0,
    theoreticalYield: 0,
    uniqueDonorCount: 0,
  };

  for (const metric of metrics) {
    const latestValue =
      metric.readings[0]?.value ?? 0;

    if (
      metric.key === KPI_KEYS.donorFrequency
    ) {
      latestValues.donorFrequency =
        latestValue;
    }

    if (
      metric.key === KPI_KEYS.theoreticalYield
    ) {
      latestValues.theoreticalYield =
        latestValue;
    }

    if (
      metric.key === KPI_KEYS.uniqueDonorCount
    ) {
      latestValues.uniqueDonorCount =
        latestValue;
    }
  }

  return (
    <AdminShell
      pageTitle="Dashboard & KPIs"
      pageDescription="Manage the official CSL-reported performance metrics displayed on the public Hive dashboard."
      activePath="/settings/hive"
    >
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>Donor Frequency</span>

          <strong>
            {formatKpiValue(
              latestValues.donorFrequency,
              2,
              null,
            )}
          </strong>

          <small>Current CSL value</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Theoretical Yield</span>

          <strong>
            {formatKpiValue(
              latestValues.theoreticalYield,
              1,
              "%",
            )}
          </strong>

          <small>Current CSL value</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Unique Donors</span>

          <strong>
            {formatKpiValue(
              latestValues.uniqueDonorCount,
              0,
              null,
            )}
          </strong>

          <small>Current CSL value</small>
        </article>
      </section>

      <form
        action={updateHiveMetrics}
        className={styles.form}
      >
        <section className={styles.formSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p>Official Data Source</p>
              <h2>CSL-reported metrics</h2>
            </div>

            <span>Public Dashboard</span>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Donor Frequency</span>

              <small>
                Enter the current official CSL
                donor-frequency value.
              </small>

              <input
                name="donorFrequency"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  latestValues.donorFrequency
                }
                required
              />
            </label>

            <label className={styles.field}>
              <span>Theoretical Yield</span>

              <small>
                Enter the reported percentage,
                such as 96.4.
              </small>

              <div className={styles.suffixInput}>
                <input
                  name="theoreticalYield"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={
                    latestValues
                      .theoreticalYield
                  }
                  required
                />

                <strong>%</strong>
              </div>
            </label>

            <label className={styles.field}>
              <span>Unique Donor Count</span>

              <small>
                Enter the official whole-number
                unique donor count.
              </small>

              <input
                name="uniqueDonorCount"
                type="number"
                min="0"
                step="1"
                defaultValue={
                  latestValues.uniqueDonorCount
                }
                required
              />
            </label>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p>Dashboard Display</p>
              <h2>Rotation timing</h2>
            </div>

            <span>TV Configuration</span>
          </div>

          <label
            className={`${styles.field} ${styles.rotationField}`}
          >
            <span>
              Seconds before changing views
            </span>

            <small>
  Select how long each dashboard view
  remains visible before rotating.
</small>

            <select
  name="dashboardRotationSeconds"
  defaultValue={
    settings.dashboardRotationSeconds
  }
  required
>
  <option value="30">
    30 seconds
  </option>

  <option value="45">
    45 seconds
  </option>

  <option value="60">
    60 seconds
  </option>

  <option value="90">
    90 seconds
  </option>

  <option value="120">
    120 seconds
  </option>
</select>
          </label>
        </section>

        <div className={styles.actions}>
          <button type="submit">
            Save Official KPIs
          </button>
        </div>
      </form>
    </AdminShell>
  );
}