import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminShell from "../../components/AdminShell";
import { saveWorkerStickPerformance } from "./actions";

export const dynamic = "force-dynamic";

function formatDateInput(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateSuccessRate(
  totalSticks: number,
  successfulSticks: number,
) {
  if (totalSticks <= 0) {
    return 0;
  }

  return (
    successfulSticks /
    totalSticks
  ) * 100;
}

export default async function WorkerPerformancePage() {
  const today = new Date();

  const collectors =
    await prisma.collector.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const recentEntries =
    await prisma.workerStickEntry.findMany({
      include: {
        collector: {
          select: {
            name: true,
            preferredName: true,
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
      take: 40,
    });

  return (
    <AdminShell
      pageTitle="Stick Performance"
      pageDescription="Track worker-level total sticks and successful sticks without assigning individual liters."
      activePath="/settings/workers/performance"
    >
      <div
        style={{
          marginBottom: 18,
        }}
      >
        <Link
          href="/settings/workers"
          style={{
            color: "#805c0b",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← Return to Worker Bees
        </Link>
      </div>

      <section
        style={{
          marginBottom: 22,
          padding: 24,
          border: "1px solid #e0c675",
          borderRadius: 20,
          background: "#ffffff",
          boxShadow:
            "0 10px 24px rgba(76,53,6,.07)",
        }}
      >
        <div
          style={{
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "#9a6b08",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Worker Performance
          </p>

          <h2
            style={{
              margin: 0,
              color: "#3d2a07",
            }}
          >
            Enter Daily Stick Results
          </h2>

          <p
            style={{
              margin:
                "8px 0 0",
              color: "#756843",
              lineHeight: 1.5,
            }}
          >
            Enter each worker&apos;s total sticks
            and successful sticks. Success rate
            is calculated automatically.
          </p>
        </div>

        <form
          action={saveWorkerStickPerformance}
        >
          <label
            style={{
              display: "grid",
              gap: 6,
              maxWidth: 240,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                color: "#5d4b1c",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Performance Date
            </span>

            <input
              type="date"
              name="entryDate"
              defaultValue={
                formatDateInput(today)
              }
              required
              style={{
                height: 42,
                padding: "9px 11px",
                border: "1px solid #d8c47a",
                borderRadius: 9,
                fontWeight: 700,
              }}
            />
          </label>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {collectors.map(
              (collector) => (
                <div
                  key={collector.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(220px,1.4fr) 1fr 1fr",
                    gap: 14,
                    alignItems: "end",
                    padding: 16,
                    border: "1px solid #eadba8",
                    borderRadius: 14,
                    background: "#fffaf0",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#3c2a08",
                        fontSize: 16,
                      }}
                    >
                      {collector.preferredName ||
                        collector.name}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        color: "#8a7130",
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {collector.role}
                    </span>

                    <input
                      type="hidden"
                      name="collectorId"
                      value={collector.id}
                    />
                  </div>

                  <label
                    style={{
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        color: "#5d4b1c",
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      Total Sticks
                    </span>

                    <input
                      type="number"
                      name={`totalSticks-${collector.id}`}
                      min="0"
                      step="1"
                      defaultValue="0"
                      required
                      style={{
                        height: 42,
                        padding: "9px 11px",
                        border: "1px solid #d8c47a",
                        borderRadius: 9,
                        fontWeight: 700,
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        color: "#5d4b1c",
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      Successful Sticks
                    </span>

                    <input
                      type="number"
                      name={`successfulSticks-${collector.id}`}
                      min="0"
                      step="1"
                      defaultValue="0"
                      required
                      style={{
                        height: 42,
                        padding: "9px 11px",
                        border: "1px solid #d8c47a",
                        borderRadius: 9,
                        fontWeight: 700,
                      }}
                    />
                  </label>
                </div>
              ),
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 18,
            }}
          >
            <button
              type="submit"
              style={{
                padding:
                  "12px 18px",
                border: 0,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg,#d5a318,#b97e00)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Save Stick Performance
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          marginTop: 20,
        }}
      >
        <h2
          style={{
            color: "#3d2a07",
            marginBottom: 14,
          }}
        >
          Recent Stick Performance
        </h2>

        {recentEntries.length === 0 ? (
          <div
            style={{
              padding: 28,
              border: "1px dashed #d4bd72",
              borderRadius: 16,
              background: "#fffdf5",
              color: "#756843",
              textAlign: "center",
            }}
          >
            No worker stick performance has
            been entered yet.
          </div>
        ) : (
          <div
            style={{
              overflow: "hidden",
              border: "1px solid #e2cd83",
              borderRadius: 16,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1.3fr 1.6fr 1fr 1fr 1fr",
                gap: 10,
                padding: "12px 16px",
                background: "#fff1b8",
                color: "#6d4d08",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              <span>Date</span>
              <span>Worker</span>
              <span>Total</span>
              <span>Successful</span>
              <span>Success Rate</span>
            </div>

            {recentEntries.map(
              (entry) => {
                const rate =
                  calculateSuccessRate(
                    entry.totalSticks,
                    entry.successfulSticks,
                  );

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.3fr 1.6fr 1fr 1fr 1fr",
                      gap: 10,
                      padding: "14px 16px",
                      borderTop:
                        "1px solid #eee2b8",
                      color: "#49350b",
                    }}
                  >
                    <strong>
                      {entry.entryDate.toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </strong>

                    <span>
                      {entry.collector
                        .preferredName ||
                        entry.collector.name}
                    </span>

                    <span>
                      {entry.totalSticks}
                    </span>

                    <span>
                      {entry.successfulSticks}
                    </span>

                    <strong>
                      {rate.toFixed(1)}%
                    </strong>
                  </div>
                );
              },
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}