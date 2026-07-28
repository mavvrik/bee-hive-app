import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateMonthlyBudget } from "@/app/budget/actions";

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

const fiscalMonthOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

export default async function BudgetPage() {
  const budgets = await prisma.monthlyBudget.findMany({
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
    (total, budget) => total + budget.budgetLiters,
    0,
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f4e9",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#8a6810",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          ← Return to The Hive
        </Link>

        <h1
          style={{
            fontSize: "2.5rem",
            color: "#d4a017",
            marginBottom: "8px",
          }}
        >
          🐝 FY27 Budget Settings
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "28px",
          }}
        >
          Riviera Beach 115
        </p>

        <section
          style={{
            backgroundColor: "#fff8dc",
            border: "2px solid #e2b93b",
            borderRadius: "16px",
            padding: "22px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              color: "#666",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            FY27 Annual Liter Budget
          </div>

          <div
            style={{
              color: "#b8860b",
              fontSize: "2.5rem",
              fontWeight: "bold",
            }}
          >
            {annualBudget.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            L
          </div>
        </section>

        <section
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,.1)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#333",
            }}
          >
            Monthly Budgets
          </h2>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {sortedBudgets.map((budget) => (
              <form
                key={budget.id}
                action={updateMonthlyBudget}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  border: "1px solid #eadba8",
                  borderRadius: "12px",
                  padding: "16px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="hidden"
                  name="budgetId"
                  value={budget.id}
                />

                <div>
                  <div
                    style={{
                      color: "#333",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {monthNames[budget.month]}
                  </div>

                  <div
                    style={{
                      color: "#888",
                      fontSize: "0.85rem",
                      marginTop: "4px",
                    }}
                  >
                    Original:{" "}
                    {budget.originalBudgetLiters.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    L
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="number"
                    name="budgetLiters"
                    defaultValue={budget.budgetLiters}
                    min="0"
                    step="0.01"
                    required
                    style={{
                      width: "140px",
                      padding: "10px 12px",
                      border: "1px solid #d8c47a",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#d4a017",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}