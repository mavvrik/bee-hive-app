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

  const [rotationKey, setRotationKey] =
    useState(0);

  function resetRotationTimer() {
    setRotationKey(
      (current) => current + 1,
    );
  }

  function goToPreviousPage() {
    setActivePage(
      (currentPage) =>
        currentPage === 0
          ? pages.length - 1
          : currentPage - 1,
    );

    resetRotationTimer();
  }

  function goToNextPage() {
    setActivePage(
      (currentPage) =>
        (currentPage + 1) %
        pages.length,
    );

    resetRotationTimer();
  }

  function goToPage(
    pageIndex: number,
  ) {
    setActivePage(pageIndex);

    resetRotationTimer();
  }

  useEffect(() => {
    if (pages.length <= 1) {
      return;
    }

    const interval =
      window.setInterval(() => {
        setActivePage(
          (currentPage) =>
            (currentPage + 1) %
            pages.length,
        );
      }, intervalMs);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    intervalMs,
    pages.length,
    rotationKey,
  ]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="dashboard-rotator">
      {pages.map((page, index) => (
        <div
          key={index}
          aria-hidden={
            index !== activePage
          }
          className={`dashboard-page-layer ${
            index === activePage
              ? "active"
              : ""
          }`}
        >
          {page}
        </div>
      ))}

      {pages.length > 1 && (
        <nav
          className="dashboard-controls"
          aria-label="Dashboard pages"
        >
          <button
            type="button"
            className="dashboard-nav-button"
            onClick={
              goToPreviousPage
            }
            aria-label="Previous dashboard page"
          >
            ←
          </button>

          <div className="dashboard-page-dots">
            {pages.map(
              (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Open dashboard page ${
                    index + 1
                  }`}
                  aria-current={
                    index ===
                    activePage
                      ? "page"
                      : undefined
                  }
                  className={`dashboard-page-dot ${
                    index ===
                    activePage
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    goToPage(
                      index,
                    )
                  }
                />
              ),
            )}
          </div>

          <button
            type="button"
            className="dashboard-nav-button"
            onClick={
              goToNextPage
            }
            aria-label="Next dashboard page"
          >
            →
          </button>
        </nav>
      )}

      <style>
        {`
          .dashboard-rotator {
            position: relative;

            width: 100%;
            height: 100%;

            overflow: hidden;
          }

          .dashboard-page-layer {
            position: absolute;

            inset: 0;

            opacity: 0;

            visibility: hidden;

            transform:
              translateX(24px);

            transition:
              opacity 700ms ease,
              transform 700ms ease;

            pointer-events: none;
          }

          .dashboard-page-layer.active {
            opacity: 1;

            visibility: visible;

            transform:
              translateX(0);

            pointer-events: auto;
          }

          .dashboard-controls {
            position: absolute;

            z-index: 999;

            right: 18px;
            bottom: 16px;

            display: flex;

            align-items: center;

            gap: 9px;

            padding:
              7px 9px;

            border:
              1px solid
              rgba(
                142,
                105,
                14,
                0.28
              );

            border-radius:
              999px;

            background:
              rgba(
                255,
                255,
                255,
                0.82
              );

            box-shadow:
              0 6px 18px
              rgba(
                56,
                39,
                4,
                0.13
              );

            backdrop-filter:
              blur(10px);
          }

          .dashboard-nav-button {
            display: grid;

            width: 31px;
            height: 31px;

            place-items: center;

            padding: 0;

            border:
              1px solid
              rgba(
                184,
                139,
                20,
                0.32
              );

            border-radius: 50%;

            background:
              rgba(
                255,
                248,
                216,
                0.94
              );

            color: #684900;

            font-size: 17px;
            font-weight: 900;

            cursor: pointer;

            transition:
              transform
                120ms ease,
              background
                120ms ease;
          }

          .dashboard-nav-button:hover {
            background:
              #ffe89b;

            transform:
              scale(1.06);
          }

          .dashboard-page-dots {
            display: flex;

            align-items: center;

            gap: 7px;
          }

          .dashboard-page-dot {
            width: 9px;
            height: 9px;

            padding: 0;

            border: none;
            border-radius: 50%;

            background:
              rgba(
                101,
                79,
                21,
                0.28
              );

            cursor: pointer;

            transition:
              transform
                150ms ease,
              background
                150ms ease,
              box-shadow
                150ms ease;
          }

          .dashboard-page-dot.active {
            background:
              #d69b08;

            transform:
              scale(1.35);

            box-shadow:
              0 0 0 3px
              rgba(
                214,
                155,
                8,
                0.16
              );
          }

          @media (
            max-width: 700px
          ) {
            .dashboard-controls {
              right: 10px;
              bottom: 10px;

              gap: 7px;

              padding:
                6px 8px;
            }

            .dashboard-nav-button {
              width: 29px;
              height: 29px;
            }
          }

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            .dashboard-page-layer,
            .dashboard-nav-button,
            .dashboard-page-dot {
              transition: none;
            }
          }
        `}
      </style>
    </div>
  );
}