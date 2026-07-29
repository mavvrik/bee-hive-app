"use client";

import { useMemo, useState, useTransition } from "react";
import { saveDailyProduction } from "@/app/daily-entry/actions";

type Collector = {
  id: number;
  name: string;
};

type DailyEntryFormProps = {
  collectors: Collector[];
};

export default function DailyEntryForm({
  collectors,
}: DailyEntryFormProps) {
  const [literEntries, setLiterEntries] = useState<
    Record<number, string>
  >({});

  const [stickEntries, setStickEntries] = useState<
    Record<number, string>
  >({});

  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalLitersToday = useMemo(() => {
    return collectors.reduce((total, collector) => {
      const value = Number(
        literEntries[collector.id] ?? 0,
      );

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [collectors, literEntries]);

  const totalSticksToday = useMemo(() => {
    return collectors.reduce((total, collector) => {
      const value = Number(
        stickEntries[collector.id] ?? 0,
      );

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [collectors, stickEntries]);

  const overallLitersPerStick =
    totalSticksToday > 0
      ? totalLitersToday / totalSticksToday
      : 0;

  function handleLiterChange(
    collectorId: number,
    value: string,
  ) {
    setLiterEntries((currentEntries) => ({
      ...currentEntries,
      [collectorId]: value,
    }));

    setMessage("");
  }

  function handleStickChange(
    collectorId: number,
    value: string,
  ) {
    setStickEntries((currentEntries) => ({
      ...currentEntries,
      [collectorId]: value,
    }));

    setMessage("");
  }

  function handleSave() {
    const productionEntries = collectors.map(
      (collector) => ({
        collectorId: collector.id,
        liters: Number(
          literEntries[collector.id] ?? 0,
        ),
        sticks: Math.max(
          0,
          Math.trunc(
            Number(stickEntries[collector.id] ?? 0),
          ),
        ),
      }),
    );

    startTransition(async () => {
      try {
        const result =
          await saveDailyProduction(productionEntries);

        setMessage(
          `Production saved successfully for ${result.savedCount} collectors.`,
        );
      } catch (error) {
        console.error(error);

        setMessage(
          "Production could not be saved. Please try again.",
        );
      }
    });
  }

  return (
    <section
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "14px",
        }}
      >
        {collectors.map((collector) => {
          const collectorLiters = Number(
            literEntries[collector.id] ?? 0,
          );

          const collectorSticks = Number(
            stickEntries[collector.id] ?? 0,
          );

          const litersPerStick =
            collectorSticks > 0
              ? collectorLiters / collectorSticks
              : 0;

          return (
            <div
              key={collector.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(180px, 1fr) repeat(3, minmax(130px, auto))",
                alignItems: "end",
                gap: "16px",
                border: "1px solid #eadba8",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "#333",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  alignSelf: "center",
                }}
              >
                {collector.name}
              </div>

              <label
                style={{
                  display: "grid",
                  gap: "6px",
                  color: "#6c5a24",
                  fontSize: "0.78rem",
                  fontWeight: "bold",
                }}
              >
                Liters

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="number"
                    name={`liters-${collector.id}`}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      literEntries[collector.id] ?? ""
                    }
                    onChange={(event) =>
                      handleLiterChange(
                        collector.id,
                        event.target.value,
                      )
                    }
                    disabled={isPending}
                    style={{
                      width: "120px",
                      padding: "10px 12px",
                      border: "1px solid #d8c47a",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      boxSizing: "border-box",
                    }}
                  />

                  <span
                    style={{
                      color: "#777",
                      fontWeight: "bold",
                    }}
                  >
                    L
                  </span>
                </div>
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "6px",
                  color: "#6c5a24",
                  fontSize: "0.78rem",
                  fontWeight: "bold",
                }}
              >
                Total Sticks

                <input
                  type="number"
                  name={`sticks-${collector.id}`}
                  min="0"
                  step="1"
                  placeholder="0"
                  value={
                    stickEntries[collector.id] ?? ""
                  }
                  onChange={(event) =>
                    handleStickChange(
                      collector.id,
                      event.target.value,
                    )
                  }
                  disabled={isPending}
                  style={{
                    width: "120px",
                    padding: "10px 12px",
                    border: "1px solid #d8c47a",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <div
                style={{
                  minWidth: "130px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#fff8dc",
                  border: "1px solid #eadba8",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    color: "#7b672d",
                    fontSize: "0.72rem",
                    fontWeight: "bold",
                  }}
                >
                  Liters per Stick
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#b8860b",
                    fontSize: "1rem",
                    fontWeight: "bold",
                  }}
                >
                  {litersPerStick.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    },
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #eadba8",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#777",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              Total Liters Today
            </div>

            <div
              style={{
                color: "#b8860b",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              {totalLitersToday.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}{" "}
              L
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#777",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              Total Sticks Today
            </div>

            <div
              style={{
                color: "#b8860b",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              {totalSticksToday.toLocaleString(
                "en-US",
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#777",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              Overall Liters per Stick
            </div>

            <div
              style={{
                color: "#b8860b",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              {overallLitersPerStick.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                },
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            backgroundColor: isPending
              ? "#c8b26d"
              : "#d4a017",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: isPending
              ? "not-allowed"
              : "pointer",
          }}
        >
          {isPending
            ? "Saving..."
            : "Save Production"}
        </button>
      </div>

      {message && (
        <div
          style={{
            marginTop: "18px",
            padding: "12px 14px",
            borderRadius: "10px",
            backgroundColor: message.includes(
              "successfully",
            )
              ? "#edf8ee"
              : "#fdecec",
            color: message.includes("successfully")
              ? "#276738"
              : "#9a2f2f",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}