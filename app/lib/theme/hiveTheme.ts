export type HiveTheme =
  | "CLASSIC"
  | "HALLOWEEN";

export type HiveThemeProfile = {
  id: HiveTheme;
  name: string;
  shortName: string;

  environment: {
    style: "MEADOW" | "HAUNTED_MEADOW";
    flyingCreature: "BEE" | "BAT";
    progressStyle: "HONEY" | "BLOOD";
  };

  mascot: {
    style: "CLASSIC" | "HALLOWEEN";
  };

  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
};

export const HIVE_THEMES: Record<
  HiveTheme,
  HiveThemeProfile
> = {
  CLASSIC: {
    id: "CLASSIC",
    name: "Classic HIVE",
    shortName: "Classic",

    environment: {
      style: "MEADOW",
      flyingCreature: "BEE",
      progressStyle: "HONEY",
    },

    mascot: {
      style: "CLASSIC",
    },

    palette: {
      primary: "#d4a017",
      secondary: "#6f9d3a",
      accent: "#f2c742",
      background: "#fffdf6",
      surface: "#ffffff",
      text: "#3f2a03",
    },
  },

  HALLOWEEN: {
    id: "HALLOWEEN",
    name: "Halloween HIVE",
    shortName: "Halloween",

    environment: {
      style: "HAUNTED_MEADOW",
      flyingCreature: "BAT",
      progressStyle: "BLOOD",
    },

    mascot: {
      style: "HALLOWEEN",
    },

    palette: {
      primary: "#9f1d20",
      secondary: "#3c174f",
      accent: "#e86f19",
      background: "#120d18",
      surface: "#21162a",
      text: "#f6edf8",
    },
  },
};

export const DEFAULT_HIVE_THEME: HiveTheme =
  "CLASSIC";

export function getHiveTheme(
  theme: HiveTheme = DEFAULT_HIVE_THEME,
): HiveThemeProfile {
  return HIVE_THEMES[theme];
}