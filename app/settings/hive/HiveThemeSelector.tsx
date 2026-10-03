"use client";

import {
  HIVE_THEMES,
  type HiveTheme,
} from "@/app/lib/theme/hiveTheme";

import {
  useHiveTheme,
} from "@/app/components/HiveThemeProvider";

export default function HiveThemeSelector() {
  const {
    theme,
    setTheme,
  } = useHiveTheme();

  return (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      <div>
        <strong>
          HIVE Theme
        </strong>

        <p
          style={{
            margin:
              "6px 0 0",
            opacity: 0.72,
            fontSize:
              "0.9rem",
          }}
        >
          Changes the visual presentation
          of the HIVE dashboard only.
        </p>
      </div>

      <select
        value={theme}
        onChange={(event) =>
          setTheme(
            event.target
              .value as HiveTheme,
          )
        }
        style={{
          width: "100%",
          maxWidth: "360px",
          padding:
            "10px 12px",
          borderRadius: "10px",
          border:
            "1px solid #d4a017",
          fontWeight: 700,
        }}
      >
        <option value="CLASSIC">
          {
            HIVE_THEMES
              .CLASSIC.name
          }
        </option>

        <option value="HALLOWEEN">
          {
            HIVE_THEMES
              .HALLOWEEN.name
          }
        </option>
      </select>

      <small
        style={{
          opacity: 0.68,
        }}
      >
        Current profile:{" "}
        <strong>
          {
            HIVE_THEMES[
              theme
            ].name
          }
        </strong>
      </small>
    </div>
  );
}