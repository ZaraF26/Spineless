// Paper + ink colour palettes for the EPUB reader
export const THEMES = {
  light: { paper: "#fffdf5", ink: "#2b2b2b", label: "Light" },
  sepia: { paper: "#f4ecd8", ink: "#5b4636", label: "Sepia" },
  dark: { paper: "#232323", ink: "#e6e6e6", label: "Dark" },
  night: { paper: "#0a0a0a", ink: "#9a9a9a", label: "Night" },
};

export const DEFAULT_THEME = "light";

// Highlighter colours
export const HIGHLIGHT = "#f5d76e";
export const NOTE = "#a7d8f5";

export const applyTheme = (rendition, theme, fontScale) => {
  const t = THEMES[theme] || THEMES.light;
  try { rendition.themes.override("background", t.paper); } catch {}
  try { rendition.themes.override("color", t.ink); } catch {}
  try { rendition.themes.fontSize(`${fontScale}%`); } catch {}
};