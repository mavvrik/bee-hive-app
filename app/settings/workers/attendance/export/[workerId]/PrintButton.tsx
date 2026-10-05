"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        border: "1px solid #222",
        borderRadius: "4px",
        background: "#ffffff",
        color: "#111111",
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
        lineHeight: 1.2,
      }}
    >
      Print / Save as PDF
    </button>
  );
}