import { ReactNode } from "react";

type DashboardPageProps = {
  children: ReactNode;
};

export default function DashboardPage({
  children,
}: DashboardPageProps) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",

        width: "100%",
        height: "100%",

        overflow: "hidden",

        padding: "8px 14px 6px",

        boxSizing: "border-box",
      }}
    >
      {children}
    </section>
  );
}