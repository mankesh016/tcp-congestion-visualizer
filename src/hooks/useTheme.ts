import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Tracks the OS light/dark preference live (updates automatically if the
 * device's theme changes, e.g. an OS-scheduled dark mode) until the user
 * manually toggles it — at which point that explicit choice is persisted
 * and takes over permanently, no longer following the device.
 */
export function useTheme() {
  const [manualTheme, setManualTheme] = useState<Theme | null>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const theme = manualTheme ?? systemTheme;

  // useLayoutEffect (not useEffect) so the attribute lands before the
  // browser paints, avoiding a flash of the wrong theme on load/toggle.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setManualTheme((current) => {
      const next = (current ?? systemTheme) === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [systemTheme]);

  return { theme, toggleTheme };
}
