import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProductionHistoryPage() {
  const productionEntries =
    await prisma.dailyCenterProduction.findMany({
      orderBy: {
        entryDate: "desc",
      },
    });

  const totalLiters =
    productionEntries.reduce(
      (total, entry) =>
        total + entry.liters,
      0,
    );

  const totalDonors =
    productionEntries.reduce(
      (total, entry) =>
        total + entry.donors,
      0,
    );

  const litersPerDonor =
    totalDonors > 0
      ? totalLiters / totalDonors
      : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fff9e8 0%, #f5e5a8 100%)",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "28px",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#805b00",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            ← Return to The Hive
          </Link>

          <h1
            style={{
              margin: "18px 0 6px",
              color: "#3d2a07",
              fontSize: "2.4rem",
            }}
          >
            📊 Center Production History
          </h1>

          <p
            style={{
              margin: 0,
              color: "#74643a",
              lineHeight: 1.5,
            }}
          >
            Official daily center production
            totals for liters collected and
            donors processed.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <SummaryCard
            label="Recorded Days"
            value={productionEntries.length.toLocaleString(
              "en-US",
            )}
          />

          <SummaryCard
            label="Total Liters"
            value={formatLiters(
              totalLiters,
            )}
          />

          <SummaryCard
            label="Total Donors"
            value={totalDonors.toLocaleString(
              "en-US",
            )}
          />

          <SummaryCard
            label="Liters / Donor"
            value={litersPerDonor.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              },
            )}
          />
        </section>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#3d2a07",
            }}
          >
            Daily Records
          </h2>

          <Link
            href="/daily-center-production"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor:
                "#d4a017",
              color: "#fff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            + Enter Daily Production
          </Link>
        </div>

        {productionEntries.length ===
        0 ? (
          <section
            style={{
              padding: "36px",
              border:
                "1px dashed #c9aa48",
              borderRadius: "16px",
              backgroundColor:
                "rgba(255,255,255,.72)",
              textAlign: "center",
              color: "#75663c",
            }}
          >
            No center production
            records have been entered
            yet.
          </section>
        ) : (
          <section
            style={{
              overflow: "hidden",
              border:
                "1px solid #d7bd65",
              borderRadius: "18px",
              backgroundColor: "#fff",
              boxShadow:
                "0 10px 24px rgba(88,62,8,.10)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1.5fr 1fr 1fr 1fr",
                gap: "12px",
                padding: "13px 18px",
                backgroundColor:
                  "#ffeaa0",
                color: "#624607",
                fontSize: "0.75rem",
                fontWeight: 900,
                letterSpacing:
                  "0.05em",
                textTransform:
                  "uppercase",
              }}
            >
              <span>Date</span>
              <span>Liters</span>
              <span>Donors</span>
              <span>
                Liters / Donor
              </span>
            </div>

            {productionEntries.map(
              (entry) => {
                const entryLitersPerDonor =
                  entry.donors > 0
                    ? entry.liters /
                      entry.donors
                    : 0;

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.5fr 1fr 1fr 1fr",
                      gap: "12px",
                      alignItems: "center",
                      padding:
                        "16px 18px",
                      borderTop:
                        "1px solid #eee2b8",
                      color: "#49350b",
                    }}
                  >
                    <strong>
                      {formatDate(
                        entry.entryDate,
                      )}
                    </strong>

                    <span>
                      {formatLiters(
                        entry.liters,
                      )}
                    </span>

                    <span>
                      {entry.donors.toLocaleString(
                        "en-US",
                      )}
                    </span>

                    <span>
                      {entryLitersPerDonor.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        },
                      )}
                    </span>
                  </div>
                );
              },
            )}
          </section>
        )}
      </div>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <article
      style={{
        padding: "18px",
        border:
          "1px solid #dcc46e",
        borderRadius: "14px",
        background:
          "linear-gradient(145deg, #ffffff, #fff4c4)",
        boxShadow:
          "0 6px 16px rgba(88,62,8,.08)",
      }}
    >
      <span
        style={{
          display: "block",
          color: "#8a6b1d",
          fontSize: "0.72rem",
          fontWeight: 900,
          textTransform:
            "uppercase",
          letterSpacing:
            "0.06em",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "7px",
          color: "#3d2a07",
          fontSize: "1.45rem",
        }}
      >
        {value}
      </strong>
    </article>
  );
}