"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/analytics/events";

export default function ThemeSync() {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      const dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.body.classList.toggle("dark", dark);
    } catch {
      // Theme preference is best effort when storage is unavailable.
    }
  }, []);

  return null;
}
