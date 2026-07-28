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
  const [entries, setEntries] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalToday = useMemo(() => {
    return collectors.reduce((total, collector) => {
      const value = Number(entries[collector.id] ?? 0);

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [collectors, entries]);

  function handleEntryChange(
    collectorId: number,
    value: string,
  ) {
    setEntries((currentEntries) => ({
      ...currentEntries,
      [collectorId]: value,
    }));

    setMessage("");
  }

  function handleSave() {
    const productionEntries = collectors.map((collector) => ({
      collectorId: collector.id,
      liters: Number(entries[collector.id] ?? 0),
    }));

    startTransition(async () => {
      try {
        const result = await saveDailyProduction(productionEntries);

        setMessage(
          `Production saved successfully for ${result.savedCount} collectors.`,
        );
      } catch (error) {
        console.error(error);
        setMessage("Production could not be saved. Please try again.");
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
        {collectors.map((collector) => (
          <div
            key={collector.id}
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
            <div
              style={{
                color: "#333",
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              {collector.name}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="number"
                name={`collector-${collector.id}`}
                min="0"
                step="0.01"
                placeholder="0.00"
                value={entries[collector.id] ?? ""}
                onChange={(event) =>
                  handleEntryChange(
                    collector.id,
                    event.target.value,
                  )
                }
                disabled={isPending}
                style={{
                  width: "140px",
                  padding: "10px 12px",
                  border: "1px solid #d8c47a",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "bold",
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
          </div>
        ))}
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
        <div>
          <div
            style={{
              color: "#777",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            Total Today
          </div>

          <div
            style={{
              color: "#b8860b",
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            {totalToday.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            L
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            backgroundColor: isPending ? "#c8b26d" : "#d4a017",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Saving..." : "Save Production"}
        </button>
      </div>

      {message && (
        <div
          style={{
            marginTop: "18px",
            padding: "12px 14px",
            borderRadius: "10px",
            backgroundColor: message.includes("successfully")
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