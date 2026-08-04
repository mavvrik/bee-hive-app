import { prisma } from "@/lib/prisma";
import AdminShell from "@/app/settings/components/AdminShell";
import { updateMonthlyBudget } from "@/app/budget/actions";

export const dynamic = "force-dynamic";

const monthNames: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

const fiscalMonthOrder = [
  7,
  8,
  9,
  10,
  11,
  12,
  1,
  2,
  3,
  4,
  5,
  6,
];

export default async function BudgetPage() {
  const budgets =
    await prisma.monthlyBudget.findMany({
      where: {
        fiscalYear: 2027,
      },
    });

  const sortedBudgets = [...budgets].sort(
    (a, b) =>
      fiscalMonthOrder.indexOf(a.month) -
      fiscalMonthOrder.indexOf(b.month),
  );

  const annualBudget = sortedBudgets.reduce(
    (total, budget) =>
      total + budget.budgetLiters,
    0,
  );

  const originalAnnualBudget =
    sortedBudgets.reduce(
      (total, budget) =>
        total + budget.originalBudgetLiters,
      0,
    );

  const annualVariance =
    annualBudget - originalAnnualBudget;

  return (
    <AdminShell
      pageTitle="Budget Management"
      pageDescription="Review the FY27 annual liter budget and update monthly production targets for Riviera Beach 115."
      activePath="/budget"
    >
      <section className="budget-summary-grid">
        <article className="budget-summary-card featured">
          <span>FY27 Annual Budget</span>

          <strong>
            {annualBudget.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}{" "}
            L
          </strong>

          <small>
            Current approved monthly total
          </small>
        </article>

        <article className="budget-summary-card">
          <span>Original Annual Budget</span>

          <strong>
            {originalAnnualBudget.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}{" "}
            L
          </strong>

          <small>
            Initial FY27 budget total
          </small>
        </article>

        <article className="budget-summary-card">
          <span>Annual Adjustment</span>

          <strong
            className={
              annualVariance > 0
                ? "positive-variance"
                : annualVariance < 0
                  ? "negative-variance"
                  : ""
            }
          >
            {annualVariance > 0 ? "+" : ""}
            {annualVariance.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}{" "}
            L
          </strong>

          <small>
            Difference from original budget
          </small>
        </article>
      </section>

      <section className="monthly-budget-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">
              Fiscal Year 2027
            </p>

            <h2>Monthly Liter Budgets</h2>
          </div>

          <span className="section-badge">
            July–June
          </span>
        </div>

        {sortedBudgets.length > 0 ? (
          <div className="budget-grid">
            {sortedBudgets.map((budget) => {
              const variance =
                budget.budgetLiters -
                budget.originalBudgetLiters;

              return (
                <form
                  key={budget.id}
                  action={updateMonthlyBudget}
                  className="budget-card"
                >
                  <input
                    type="hidden"
                    name="budgetId"
                    value={budget.id}
                  />

                  <div className="budget-card-header">
                    <div>
                      <p>FY27 Month</p>

                      <h3>
                        {monthNames[budget.month]}
                      </h3>
                    </div>

                    <span
                      className={`variance-badge ${
                        variance > 0
                          ? "positive"
                          : variance < 0
                            ? "negative"
                            : "neutral"
                      }`}
                    >
                      {variance > 0 ? "+" : ""}
                      {variance.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}{" "}
                      L
                    </span>
                  </div>

                  <div className="budget-details">
                    <div>
                      <span>Original Budget</span>

                      <strong>
                        {budget.originalBudgetLiters.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        L
                      </strong>
                    </div>

                    <div>
                      <span>Current Budget</span>

                      <strong>
                        {budget.budgetLiters.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        L
                      </strong>
                    </div>
                  </div>

                  <label className="budget-field">
                    <span>
                      Updated Monthly Target
                    </span>

                    <div className="budget-input">
                      <input
                        type="number"
                        name="budgetLiters"
                        defaultValue={
                          budget.budgetLiters
                        }
                        min="0"
                        step="0.01"
                        required
                      />

                      <strong>L</strong>
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="save-budget-button"
                  >
                    Save Monthly Budget
                  </button>
                </form>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span>💰</span>

            <h3>
              No FY27 budgets were found
            </h3>

            <p>
              Monthly budget records must be
              created before they can be managed
              here.
            </p>
          </div>
        )}
      </section>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .budget-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          .budget-summary-card {
            display: flex;
            min-height: 145px;
            flex-direction: column;
            justify-content: center;
            padding: 22px;
            border: 1px solid #e2ce87;
            border-radius: 18px;
            background: rgba(
              255,
              255,
              255,
              0.97
            );
            box-shadow:
              0 8px 22px
              rgba(76, 55, 9, 0.07);
          }

          .budget-summary-card.featured {
            border-color: #d4a017;
            background:
              linear-gradient(
                135deg,
                #fffef6,
                #fff0ae
              );
          }

          .budget-summary-card span {
            color: #826617;
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .budget-summary-card strong {
            display: block;
            margin: 9px 0 6px;
            color: #3c2a07;
            font-size: clamp(
              1.45rem,
              3vw,
              2rem
            );
          }

          .budget-summary-card small {
            color: #766b4e;
            font-size: 0.78rem;
            line-height: 1.4;
          }

          .positive-variance {
            color: #28743c !important;
          }

          .negative-variance {
            color: #a23c33 !important;
          }

          .monthly-budget-section {
            padding: 24px;
            border: 1px solid #e0c675;
            border-radius: 22px;
            background: rgba(
              255,
              255,
              255,
              0.97
            );
            box-shadow:
              0 10px 28px
              rgba(74, 53, 7, 0.08);
          }

          .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eee1b5;
          }

          .section-eyebrow {
            margin: 0 0 6px;
            color: #9b6c09;
            font-size: 0.68rem;
            font-weight: 900;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .section-heading h2 {
            margin: 0;
            color: #3e2c08;
            font-size: 1.55rem;
          }

          .section-badge {
            padding: 7px 11px;
            border-radius: 999px;
            background: #fff0ae;
            color: #785300;
            font-size: 0.7rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .budget-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .budget-card {
            display: flex;
            min-width: 0;
            flex-direction: column;
            padding: 18px;
            border: 1px solid #e4d08a;
            border-radius: 17px;
            background:
              linear-gradient(
                180deg,
                #ffffff,
                #fffaf0
              );
          }

          .budget-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 16px;
          }

          .budget-card-header p {
            margin: 0 0 3px;
            color: #8a6e1b;
            font-size: 0.65rem;
            font-weight: 900;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .budget-card-header h3 {
            margin: 0;
            color: #3c2a07;
            font-size: 1.3rem;
          }

          .variance-badge {
            flex: 0 0 auto;
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 0.65rem;
            font-weight: 900;
          }

          .variance-badge.positive {
            background: #e2f7e6;
            color: #28743c;
          }

          .variance-badge.negative {
            background: #fbe4e1;
            color: #a23c33;
          }

          .variance-badge.neutral {
            background: #ececec;
            color: #666;
          }

          .budget-details {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }

          .budget-details > div {
            padding: 12px;
            border: 1px solid #eee2bc;
            border-radius: 11px;
            background: #fffdf6;
          }

          .budget-details span {
            display: block;
            margin-bottom: 5px;
            color: #807353;
            font-size: 0.68rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .budget-details strong {
            color: #48350b;
            font-size: 0.95rem;
          }

          .budget-field {
            display: grid;
            gap: 7px;
            margin-top: auto;
          }

          .budget-field > span {
            color: #5d4b1c;
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .budget-input {
            position: relative;
          }

          .budget-input input {
            width: 100%;
            height: 44px;
            padding: 10px 42px 10px 12px;
            border: 1px solid #d8c47a;
            border-radius: 9px;
            background: white;
            color: #332606;
            font-size: 0.98rem;
            font-weight: 800;
            outline: none;
          }

          .budget-input input:focus {
            border-color: #c88e00;
            box-shadow:
              0 0 0 3px
              rgba(214, 161, 14, 0.16);
          }

          .budget-input strong {
            position: absolute;
            top: 50%;
            right: 13px;
            color: #73570d;
            transform: translateY(-50%);
          }

          .save-budget-button {
            width: 100%;
            margin-top: 12px;
            padding: 11px 14px;
            border: none;
            border-radius: 9px;
            background:
              linear-gradient(
                135deg,
                #d5a318,
                #b97e00
              );
            color: white;
            font-weight: 900;
            cursor: pointer;
          }

          .save-budget-button:hover {
            filter: brightness(1.05);
          }

          .empty-state {
            padding: 42px;
            border: 1px dashed #d4bd72;
            border-radius: 16px;
            text-align: center;
          }

          .empty-state span {
            font-size: 2.5rem;
          }

          .empty-state h3 {
            margin: 10px 0 6px;
            color: #4b3508;
          }

          .empty-state p {
            margin: 0;
            color: #776d54;
          }

          @media (max-width: 1050px) {
            .budget-summary-grid {
              grid-template-columns: 1fr;
            }

            .budget-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .section-heading,
            .budget-card-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .budget-details {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </AdminShell>
  );
}