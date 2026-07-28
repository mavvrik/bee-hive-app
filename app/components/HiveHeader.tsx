import Link from "next/link";

type HiveHeaderProps = {
  centerName: string;
  reportingYear: number;
};

export default function HiveHeader({
  centerName,
  reportingYear,
}: HiveHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "24px",
        flexWrap: "wrap",
        marginBottom: "32px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "3rem",
            color: "#d4a017",
            margin: 0,
          }}
        >
          🐝 THE HIVE
        </h1>

        <h2
          style={{
            color: "#444",
            marginTop: "10px",
            marginBottom: "6px",
          }}
        >
          {centerName}
        </h2>

        <p
          style={{
            color: "#777",
            margin: 0,
          }}
        >
          Reporting Year: {reportingYear}
        </p>
      </div>

      <nav
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            backgroundColor: "#d4a017",
            color: "white",
            padding: "10px 16px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Dashboard
        </Link>

        <Link
          href="/budget"
          style={{
            backgroundColor: "white",
            color: "#8a6810",
            border: "1px solid #d4a017",
            padding: "10px 16px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Budget Settings
        </Link>
      </nav>
    </header>
  );
}