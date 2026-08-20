import {
  prisma,
} from "@/lib/prisma";

import AdminShell from "../../components/AdminShell";

import {
  ensureBuiltInExecutiveMetrics,
} from "@/app/lib/executiveComparisonEngine";

import {
  createComparisonMetric,
  saveDailyComparisonReading,
  toggleComparisonMetric,
  updateComparisonMetric,
} from "./actions";

export const dynamic =
  "force-dynamic";

function todayInput() {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      today.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

export default async function ComparisonMetricsPage() {
  await ensureBuiltInExecutiveMetrics();

  const metrics =
    await prisma.dashboardMetric.findMany({
      where: {
        comparisonEnabled:
          true,
      },

      orderBy: [
        {
          displayOrder:
            "asc",
        },

        {
          displayName:
            "asc",
        },
      ],
    });

  return (
    <AdminShell
      pageTitle="Executive Comparison Metrics"
      pageDescription="Manage daily KPIs used for same-weekday week-over-week Executive Intelligence."
      activePath="/settings/metrics/comparisons"
    >
      <section className="hero">
        <div>
          <p className="eyebrow">
            Executive Intelligence
          </p>

          <h2>
            Comparative Metric Library
          </h2>

          <p>
            Current-day performance is compared
            with the same weekday from the
            immediately previous week.
          </p>
        </div>
      </section>

      <section className="add-card">
        <h3>
          Add New Metric
        </h3>

        <form
          action={
            createComparisonMetric
          }
          className="add-grid"
        >
          <input
            name="displayName"
            placeholder="Metric name"
            required
          />

          <input
            name="unit"
            placeholder="Unit"
          />

          <input
            type="number"
            name="decimalPlaces"
            min="0"
            defaultValue="1"
          />

          <select
            name="improvementDirection"
            defaultValue="HIGHER"
          >
            <option value="HIGHER">
              Higher is Better
            </option>

            <option value="LOWER">
              Lower is Better
            </option>

            <option value="NEUTRAL">
              Direction Only
            </option>
          </select>

          <input
            type="number"
            name="displayOrder"
            defaultValue="100"
          />

          <button type="submit">
            Add Metric
          </button>
        </form>
      </section>

      <section className="metric-grid">
        {metrics.map(
          (metric) => (
            <article
              key={
                metric.id
              }
              className={`metric-card ${
                !metric.isVisible
                  ? "inactive"
                  : ""
              }`}
            >
              <div className="metric-header">
                <div>
                  <span>
                    {metric.isBuiltIn
                      ? "Built-In"
                      : "Custom"}
                  </span>

                  <h3>
                    {
                      metric.displayName
                    }
                  </h3>

                  <small>
                    {metric.dataSourceKey
                      ? "Automatic HIVE Data"
                      : "Daily Metric Entry"}
                  </small>
                </div>

                <form
                  action={
                    toggleComparisonMetric
                  }
                >
                  <input
                    type="hidden"
                    name="metricId"
                    value={
                      metric.id
                    }
                  />

                  <button
                    className={
                      metric.isVisible
                        ? "remove-button"
                        : "add-button"
                    }
                  >
                    {metric.isVisible
                      ? "Remove"
                      : "Re-Add"}
                  </button>
                </form>
              </div>

              <form
                action={
                  updateComparisonMetric
                }
                className="settings-grid"
              >
                <input
                  type="hidden"
                  name="metricId"
                  value={
                    metric.id
                  }
                />

                <label>
                  <span>
                    Display Name
                  </span>

                  <input
                    name="displayName"
                    defaultValue={
                      metric.displayName
                    }
                  />
                </label>

                <label>
                  <span>
                    Unit
                  </span>

                  <input
                    name="unit"
                    defaultValue={
                      metric.unit ??
                      ""
                    }
                  />
                </label>

                <label>
                  <span>
                    Decimals
                  </span>

                  <input
                    type="number"
                    name="decimalPlaces"
                    min="0"
                    defaultValue={
                      metric.decimalPlaces
                    }
                  />
                </label>

                <label>
                  <span>
                    Favorable Direction
                  </span>

                  <select
                    name="improvementDirection"
                    defaultValue={
                      metric.improvementDirection
                    }
                  >
                    <option value="HIGHER">
                      Higher is Better
                    </option>

                    <option value="LOWER">
                      Lower is Better
                    </option>

                    <option value="NEUTRAL">
                      Direction Only
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Display Order
                  </span>

                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={
                      metric.displayOrder
                    }
                  />
                </label>

                <button type="submit">
                  Save Settings
                </button>
              </form>

              {!metric.dataSourceKey && (
                <form
                  action={
                    saveDailyComparisonReading
                  }
                  className="entry-row"
                >
                  <input
                    type="hidden"
                    name="metricId"
                    value={
                      metric.id
                    }
                  />

                  <label>
                    <span>
                      Daily Date
                    </span>

                    <input
                      type="date"
                      name="entryDate"
                      defaultValue={
                        todayInput()
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Value
                    </span>

                    <input
                      type="number"
                      name="value"
                      step="any"
                      required
                    />
                  </label>

                  <button type="submit">
                    Save Daily Value
                  </button>
                </form>
              )}
            </article>
          ),
        )}
      </section>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .hero,
          .add-card,
          .metric-card {
            border: 1px solid #dfc779;
            border-radius: 18px;
          }

          .hero {
            margin-bottom: 16px;
            padding: 22px;
            background:
              linear-gradient(
                135deg,
                #372705,
                #654708
              );
          }

          .eyebrow {
            margin: 0 0 5px;
            color: #e4c45b;
            font-size: .65rem;
            font-weight: 900;
            letter-spacing: .13em;
            text-transform: uppercase;
          }

          .hero h2 {
            margin: 0;
            color: #ffe795;
          }

          .hero p:not(.eyebrow) {
            margin: 6px 0 0;
            color: #f1dfad;
          }

          .add-card {
            margin-bottom: 16px;
            padding: 18px;
            background: #fffdf7;
          }

          .add-card h3 {
            margin-top: 0;
            color: #473207;
          }

          .add-grid {
            display: grid;
            grid-template-columns:
              1.5fr
              .7fr
              .6fr
              1fr
              .65fr
              .8fr;
            gap: 8px;
          }

          input,
select {
  width: 100%;
  min-height: 38px;
  padding: 7px 9px;
  border: 1px solid #d4c17e;
  border-radius: 8px;
  background: white;

  color: #3f300d;
  -webkit-text-fill-color: #3f300d;

  font-family: inherit;
  font-weight: 700;
}

input::placeholder {
  color: #9a8a66;
  opacity: 1;
}

select option {
  color: #3f300d;
  background: white;
}

          button {
            min-height: 38px;
            padding: 7px 11px;
            border: 0;
            border-radius: 8px;
            background: #c9920c;
            color: white;
            font-weight: 900;
            cursor: pointer;
          }

          .metric-grid {
            display: grid;
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 14px;
          }

          .metric-card {
            padding: 16px;
            background: #fffdf7;
          }

          .metric-card.inactive {
            opacity: .62;
          }

          .metric-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 13px;
          }

          .metric-header span {
            color: #9c720f;
            font-size: .59rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .metric-header h3 {
            margin: 3px 0;
            color: #433006;
          }

          .metric-header small {
            color: #837655;
          }

          .remove-button {
            background: #8c6430;
          }

          .add-button {
            background: #4f7d46;
          }

          .settings-grid {
            display: grid;
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 8px;
          }

          label {
            display: grid;
            gap: 4px;
          }

          label span {
            color: #68501a;
            font-size: .6rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .entry-row {
            display: grid;
            grid-template-columns:
              1fr
              1fr
              auto;
            gap: 8px;
            align-items: end;
            margin-top: 13px;
            padding-top: 13px;
            border-top: 1px solid #eadfb8;
          }

          @media (
            max-width: 1000px
          ) {
            .metric-grid {
              grid-template-columns:
                1fr;
            }

            .add-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );
            }
          }

          @media (
            max-width: 650px
          ) {
            .add-grid,
            .settings-grid,
            .entry-row {
              grid-template-columns:
                1fr;
            }
          }
        `}
      </style>
    </AdminShell>
  );
}