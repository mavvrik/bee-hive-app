"use client";

import {
  Children,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type DashboardRotatorProps = {
  children: ReactNode;
  intervalMs?: number;
};

export default function DashboardRotator({
  children,
  intervalMs = 20000,
}: DashboardRotatorProps) {
  const pages = useMemo(
    () => Children.toArray(children),
    [children],
  );

  const [activePage, setActivePage] =
    useState(0);

  useEffect(() => {
    if (pages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActivePage((currentPage) =>
        (currentPage + 1) % pages.length,
      );
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [intervalMs, pages.length]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {pages.map((page, index) => (
        <div
          key={index}
          aria-hidden={index !== activePage}
          style={{
            position: "absolute",
            inset: 0,
            opacity:
              index === activePage ? 1 : 0,
            visibility:
              index === activePage
                ? "visible"
                : "hidden",
            transform:
              index === activePage
                ? "translateX(0)"
                : "translateX(24px)",
            transition:
              "opacity 700ms ease, transform 700ms ease",
            pointerEvents:
              index === activePage
                ? "auto"
                : "none",
          }}
        >
          {page}
        </div>
      ))}
    </div>
  );
}