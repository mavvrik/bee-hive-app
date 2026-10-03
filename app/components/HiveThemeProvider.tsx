"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_HIVE_THEME,
  HIVE_THEMES,
  type HiveTheme,
  type HiveThemeProfile,
} from "@/app/lib/theme/hiveTheme";

type HiveThemeContextValue = {
  theme: HiveTheme;
  profile: HiveThemeProfile;
  setTheme: (
    theme: HiveTheme,
  ) => void;
};

const HiveThemeContext =
  createContext<
    HiveThemeContextValue | undefined
  >(undefined);

const STORAGE_KEY =
  "hive-presentation-theme";

type HiveThemeProviderProps = {
  children: ReactNode;
};

export default function HiveThemeProvider({
  children,
}: HiveThemeProviderProps) {
  const [
    theme,
    setThemeState,
  ] = useState<HiveTheme>(
    DEFAULT_HIVE_THEME,
  );

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (
      savedTheme === "CLASSIC" ||
      savedTheme === "HALLOWEEN"
    ) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (
    nextTheme: HiveTheme,
  ) => {
    setThemeState(nextTheme);

    window.localStorage.setItem(
      STORAGE_KEY,
      nextTheme,
    );
  };

  const profile = useMemo(
    () => HIVE_THEMES[theme],
    [theme],
  );

  return (
    <HiveThemeContext.Provider
      value={{
        theme,
        profile,
        setTheme,
      }}
    >
      <div
        data-hive-theme={theme}
        data-hive-environment={
          profile.environment.style
        }
        data-hive-progress={
          profile.environment
            .progressStyle
        }
      >
        {children}
      </div>
    </HiveThemeContext.Provider>
  );
}

export function useHiveTheme() {
  const context =
    useContext(HiveThemeContext);

  if (!context) {
    throw new Error(
      "useHiveTheme must be used inside HiveThemeProvider.",
    );
  }

  return context;
}