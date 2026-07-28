import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GroupedDay = {
  date: Date;
  entries: {
    id: number;
    collectorName: string;
    liters: number;
  }[];
  totalLiters: number;
};

export default async function ProductionHistoryPage() {
  const dailyEntries = await prisma.dailyEntry.findMany({
    include: {
      collector: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      {
        entryDate: "desc",
      },
      {
        collector: {
          position: "asc",
        },
      },
    ],
  });

  const groupedDays = dailyEntries.reduce<GroupedDay[]>(
    (days, entry) => {
      const dateKey = entry.entryDate.toISOString();

      let existingDay = days.find(
        (day) => day.date.toISOString() === dateKey,
      );

      if (!existingDay) {
        existingDay = {
          date: entry.entryDate,
          entries: [],
          totalLiters: 0,
        };

        days.push(existingDay);
      }

      existingDay.entries.push({
        id: entry.id,
        collectorName: entry.collector.name,
        liters: entry.liters,
      });

      existingDay.totalLiters += entry.liters;

      return days;
    },
    [],
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fff9e8 0%, #f5e5a8 100%)",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
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
            ← Back to The Hive
          </Link>

          <h1
            style={{
              marginTop: "18px",
              marginBottom: "6px",
              color: "#4c3500",
              fontSize: "2.3rem",
            }}
          >
            Production History
          </h1>

          <p
            style={{
              margin: 0,
              color: "#755d27",
              fontSize: "1rem",
            }}
          >
            Riviera Beach 115 daily production records
          </p>
        </header>

        {groupedDays.length === 0 ? (
          <section
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "30px",
              textAlign: "center",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: "12px",
              }}
            >
              🐝
            </div>

            <h2
              style={{
                color: "#4c3500",
                marginBottom: "8px",
              }}
            >
              No production saved yet
            </h2>

            <p
              style={{
                color: "#755d27",
                marginBottom: "20px",
              }}
            >
              Saved daily production will appear here.
            </p>

            <Link
              href="/daily-entry"
              style={{
                display: "inline-block",
                backgroundColor: "#d4a017",
                color: "white",
                borderRadius: "10px",
                padding: "12px 18px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Enter Production
            </Link>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "22px",
            }}
          >
            {groupedDays.map((day) => (
              <section
                key={day.date.toISOString()}
                style={{
                  overflow: "hidden",
                  backgroundColor: "white",
                  borderRadius: "16px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    padding: "18px 22px",
                    backgroundColor: "#4c3500",
                    color: "white",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                    }}
                  >
                    {day.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </h2>

                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#ffd86b",
                    }}
                  >
                    {day.totalLiters.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    L
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 22px 18px",
                  }}
                >
                  {day.entries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        padding: "14px 0",
                        borderBottom: "1px solid #eee2bd",
                      }}
                    >
                      <span
                        style={{
                          color: "#3e3420",
                          fontWeight: "bold",
                        }}
                      >
                        {entry.collectorName}
                      </span>

                      <span
                        style={{
                          color: "#9a6c00",
                          fontWeight: "bold",
                          fontSize: "1.05rem",
                        }}
                      >
                        {entry.liters.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        L
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}