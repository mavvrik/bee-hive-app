import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DailyEntryForm from "@/app/daily-entry/DailyEntryForm";

export default async function DailyEntryPage() {
  const collectors = await prisma.collector.findMany({
    orderBy: {
      id: "asc",
    },
  });

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
          🐝 Daily Hive Production
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "28px",
          }}
        >
          Enter each collector&apos;s production for today.
        </p>

        <DailyEntryForm collectors={collectors} />
      </div>
    </main>
  );
}